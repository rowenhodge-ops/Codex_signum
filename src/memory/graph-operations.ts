// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Graph-Backed Memory Operations
 *
 * Bridge layer that wires pure memory functions (compaction.ts, distillation.ts,
 * flow.ts, operations.ts) to the Neo4j graph via graph query functions.
 *
 * Each function:
 * 1. Reads data from Neo4j using graph queries
 * 2. Passes it through the appropriate pure function
 * 3. Writes results back to Neo4j
 *
 * All functions are NON-FATAL: if Neo4j is down or any query fails,
 * they log a warning and return a no-op result. The pipeline must never
 * crash because memory persistence failed.
 *
 * @see codex-signum-v3.0.md §Memory Topology
 * @module codex-signum-core/memory/graph-operations
 */

import {
  DEFAULT_COMPACTION_CONFIG,
  identifyCompactable,
  type CompactionConfig,
} from "./compaction.js";
import {
  distillPerformanceProfile,
  distillRoutingHints,
  type PerformanceObservation,
  type PerformanceProfile,
  type RoutingHints,
  type RoutingObservation,
} from "./distillation.js";
import { computeUpwardFlow } from "./flow.js";
import { shouldDistill } from "./operations.js";
import type { Observation, ObservationData } from "../types/memory.js";
import {
  getCompactableObservations,
  deleteObservations,
  getActiveDistillationIds,
  getObservationsForDistillation,
  createStructuredDistillation,
  getDistillationsForBloom,
  supersededDistillation,
  countObservationsForBloom,
} from "../graph/queries.js";

// Polyfill for environments without crypto.randomUUID
const generateId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
};

// ============ RESULT TYPES ============

export interface CompactionResult {
  observationsEvaluated: number;
  observationsDeleted: number;
  error?: string;
}

export interface DistillationResult {
  distillationId: string;
  observationCount: number;
  performanceProfile: PerformanceProfile;
  routingHints: RoutingHints;
  supersededDistillationIds: string[];
}

export interface MemoryProcessingResult {
  compaction: CompactionResult | null;
  distillation: DistillationResult | null;
  error?: string;
}

// ============ COMPACTION ============

/** Observation count threshold before compaction is attempted */
const COMPACTION_OBSERVATION_THRESHOLD = 50;

/**
 * Run compaction for a bloom's observations.
 * Fetches compactable observations from Neo4j, runs identifyCompactable(),
 * deletes the safe-to-remove ones.
 *
 * Non-fatal: returns error result instead of throwing.
 */
export async function runCompaction(
  bloomId: string,
  config?: Partial<CompactionConfig>,
): Promise<CompactionResult> {
  try {
    const observations = await getCompactableObservations(bloomId);
    if (observations.length === 0) {
      return { observationsEvaluated: 0, observationsDeleted: 0 };
    }

    const activeIds = await getActiveDistillationIds(bloomId);

    const compactableIds = identifyCompactable(
      observations.map((o) => ({
        id: o.id,
        timestamp: o.timestamp,
        signalProcessed: o.signalProcessed,
        includedInDistillationIds: o.includedInDistillationIds,
      })),
      activeIds,
      new Date(),
      config,
    );

    let deleted = 0;
    if (compactableIds.length > 0) {
      deleted = await deleteObservations(compactableIds);
    }

    return {
      observationsEvaluated: observations.length,
      observationsDeleted: deleted,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[memory] compaction failed for bloom ${bloomId}: ${msg}`);
    return {
      observationsEvaluated: 0,
      observationsDeleted: 0,
      error: msg,
    };
  }
}

// ============ DISTILLATION ============

/**
 * Check if distillation should trigger for a bloom, and if so, run it.
 * Fetches observations, checks shouldDistill(), runs distillPerformanceProfile()
 * and distillRoutingHints(), persists results, supersedes old distillations.
 *
 * Returns null if distillation was not triggered.
 * Non-fatal: returns null + logs warning on error.
 */
export async function checkAndDistill(
  bloomId: string,
): Promise<DistillationResult | null> {
  try {
    const rawObservations = await getObservationsForDistillation(bloomId);

    // Map to Observation[] shape for shouldDistill()
    const observations: Observation[] = rawObservations.map((o) => ({
      id: o.id,
      stratum: 2 as const,
      timestamp: o.timestamp,
      sourceBloomId: bloomId,
      observationType: "execution_outcome" as const,
      data: {
        success: o.success,
        qualityScore: o.qualityScore ?? undefined,
        durationMs: o.durationMs ?? undefined,
        modelUsed: o.modelUsed ?? undefined,
      },
    }));

    if (!shouldDistill(observations)) {
      return null;
    }

    // Map to PerformanceObservation[] for distillPerformanceProfile()
    const perfObs: PerformanceObservation[] = rawObservations.map((o) => ({
      timestamp: o.timestamp,
      phiL: o.qualityScore ?? undefined, // Use qualityScore as proxy for ΦL
      success: o.success,
      failureSignature: o.failureSignature ?? undefined,
      qualityScore: o.qualityScore ?? undefined,
    }));

    const performanceProfile = distillPerformanceProfile(bloomId, perfObs);

    // Map to RoutingObservation[] for distillRoutingHints()
    const routingObs: RoutingObservation[] = rawObservations
      .filter((o) => o.modelUsed != null)
      .map((o) => ({
        modelId: o.modelUsed!,
        success: o.success,
        qualityScore: o.qualityScore ?? undefined,
        context: o.context ?? undefined,
      }));

    const routingHints = distillRoutingHints(bloomId, routingObs);

    // Persist the structured distillation
    const distillationId = generateId();
    const sourceIds = rawObservations.map((o) => o.id);

    await createStructuredDistillation({
      id: distillationId,
      bloomId,
      confidence: performanceProfile.successRate,
      observationCount: rawObservations.length,
      sourceObservationIds: sourceIds,
      insight: `Performance: ΦL=${performanceProfile.meanPhiL.toFixed(3)} (${performanceProfile.phiLTrend}), success=${(performanceProfile.successRate * 100).toFixed(0)}%, n=${performanceProfile.observationCount}`,
      meanPhiL: performanceProfile.meanPhiL,
      phiLTrend: performanceProfile.phiLTrend,
      phiLVariance: performanceProfile.phiLVariance,
      successRate: performanceProfile.successRate,
      windowStart: performanceProfile.windowStart.toISOString(),
      windowEnd: performanceProfile.windowEnd.toISOString(),
      preferredModels: JSON.stringify(routingHints.preferredModels),
      avoidModels: JSON.stringify(routingHints.avoidModels),
    });

    // Supersede older active distillations for this bloom
    const existingDistillations = await getDistillationsForBloom(bloomId, true);
    const supersededIds: string[] = [];
    for (const existing of existingDistillations) {
      if (existing.id !== distillationId) {
        await supersededDistillation(existing.id);
        supersededIds.push(existing.id);
      }
    }

    return {
      distillationId,
      observationCount: rawObservations.length,
      performanceProfile,
      routingHints,
      supersededDistillationIds: supersededIds,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[memory] distillation failed for bloom ${bloomId}: ${msg}`);
    return null;
  }
}

// ============ FULL MEMORY FLOW ============

/** Counter for opportunistic compaction scheduling */
let _executionCounter = 0;

/** How often to run compaction (every Nth execution) */
const COMPACTION_INTERVAL = 10;

/**
 * Run the full upward memory flow after a task execution.
 * This is what the executor calls after each task when graphEnabled.
 *
 * 1. Compute upward flow (should we distill? promote to institutional?)
 * 2. If distillation triggered, run checkAndDistill()
 * 3. Opportunistic compaction (every Nth call)
 *
 * Non-fatal: if any step fails, logs warning and continues.
 */
export async function processMemoryAfterExecution(
  bloomId: string,
  executionResult: {
    modelId: string;
    success: boolean;
    qualityScore?: number;
    durationMs: number;
    failureSignature?: string;
  },
): Promise<MemoryProcessingResult> {
  const result: MemoryProcessingResult = {
    compaction: null,
    distillation: null,
  };

  try {
    // Get existing state for upward flow computation
    let existingCount: number;
    let existingDistillations: Array<{
      id: string;
      confidence: number;
      createdAt: Date;
    }>;

    try {
      existingCount = await countObservationsForBloom(bloomId);
      const distillations = await getDistillationsForBloom(bloomId);
      existingDistillations = distillations.map((d) => ({
        id: d.id,
        confidence: d.confidence,
        createdAt: d.createdAt,
      }));
    } catch {
      // Graph unavailable — return no-op
      console.warn(
        `[memory] cannot read graph state for bloom ${bloomId}, skipping memory processing`,
      );
      result.error = "Graph read failed";
      return result;
    }

    // Compute what upward flow actions should happen
    const flowResult = computeUpwardFlow({
      execution: {
        bloomId,
        modelId: executionResult.modelId,
        success: executionResult.success,
        qualityScore: executionResult.qualityScore,
        durationMs: executionResult.durationMs,
        failureSignature: executionResult.failureSignature,
      },
      existingObservationCount: existingCount,
      existingDistillations,
    });

    // Check if distillation should trigger
    if (flowResult.shouldDistill) {
      result.distillation = await checkAndDistill(bloomId);
    }

    // Opportunistic compaction: every Nth execution, if enough observations
    _executionCounter++;
    if (
      _executionCounter % COMPACTION_INTERVAL === 0 &&
      existingCount >= COMPACTION_OBSERVATION_THRESHOLD
    ) {
      result.compaction = await runCompaction(bloomId);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(
      `[memory] processMemoryAfterExecution failed for bloom ${bloomId}: ${msg}`,
    );
    result.error = msg;
  }

  return result;
}

/**
 * Reset the execution counter (for testing purposes).
 * @internal
 */
export function _resetExecutionCounter(): void {
  _executionCounter = 0;
}
