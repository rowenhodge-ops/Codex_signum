// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Memory Strata Operations
 *
 * Four strata, each with distinct retention and promotion rules:
 *
 * Stratum 1: Ephemeral  — In-session context (evaporates at session end)
 * Stratum 2: Observation — RETAINED. Raw signals that feed ΦL.
 * Stratum 3: Distillation — Extracted patterns from multiple observations
 * Stratum 4: Institutional — Permanent governance knowledge
 *
 * Promotion flows upward: 1 → 2 (on significance) → 3 (on pattern) → 4 (on consensus)
 * Stratum 2 is the INFLECTION POINT — everything below evaporates, above persists.
 *
 * @see codex-signum-v3.0.md §Memory Topology
 * @see engineering-bridge-v2.0.md §Part 4 "Memory Topology"
 * @module codex-signum-core/memory
 */

import type {
  Decision,
  DecisionContext,
  DecisionOutcome,
  Distillation,
  DistillationCategory,
  EphemeralMemory,
  InstitutionalKnowledge,
  InstitutionalKnowledgeType,
  Observation,
  ObservationData,
  ObservationType,
} from "../types/memory.js";

// Polyfill for environments without crypto.randomUUID
const generateId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
};

// ============ STRATUM 1: EPHEMERAL ============

/**
 * In-memory execution store. Evaporates when process ends.
 * Keyed by executionId — each execution gets one entry.
 */
export class EphemeralStore {
  private entries: Map<string, EphemeralMemory> = new Map();

  /** Create an ephemeral entry for an execution */
  add(patternId: string, data: Record<string, unknown> = {}): EphemeralMemory {
    const executionId = generateId();
    const entry: EphemeralMemory = {
      stratum: 1,
      executionId,
      patternId,
      data,
      createdAt: new Date(),
    };
    this.entries.set(executionId, entry);
    return entry;
  }

  /** Get by execution ID */
  get(executionId: string): EphemeralMemory | undefined {
    return this.entries.get(executionId);
  }

  /** Find all entries for a specific pattern */
  findByPattern(patternId: string): EphemeralMemory[] {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.patternId === patternId,
    );
  }

  /** Get all entries */
  getAll(): EphemeralMemory[] {
    return Array.from(this.entries.values());
  }

  /** Clear all (session end) */
  clear(): void {
    this.entries.clear();
  }

  /** Count */
  get size(): number {
    return this.entries.size;
  }

  /**
   * Update correction state for an execution (Correction Helix).
   */
  updateCorrectionState(
    executionId: string,
    iteration: number,
    maxIterations: number,
    feedback: string[],
  ): EphemeralMemory | null {
    const entry = this.entries.get(executionId);
    if (!entry) return null;

    const updated: EphemeralMemory = {
      ...entry,
      correctionState: { iteration, maxIterations, feedback },
    };
    this.entries.set(executionId, updated);
    return updated;
  }

  /**
   * Promote an ephemeral entry to Observation (Stratum 2).
   * This is the critical Stratum 1 → 2 transition.
   */
  promote(
    executionId: string,
    observationType: ObservationType,
    data: ObservationData,
  ): Observation | null {
    const entry = this.entries.get(executionId);
    if (!entry) return null;

    const observation: Observation = {
      id: generateId(),
      stratum: 2,
      timestamp: new Date(),
      sourceBloomId: entry.patternId,
      observationType,
      data,
    };

    // Remove from ephemeral store (promoted)
    this.entries.delete(executionId);

    return observation;
  }
}

// ============ STRATUM 2: OBSERVATIONS ============

/**
 * Create a new Observation directly (without promotion from Stratum 1).
 * Use this for automated signals (e.g., success/failure, latency).
 */
export function createObservation(
  sourceBloomId: string,
  observationType: ObservationType,
  data: ObservationData,
): Observation {
  return {
    id: generateId(),
    stratum: 2,
    timestamp: new Date(),
    sourceBloomId,
    observationType,
    data,
  };
}

/**
 * Check if observations should be distilled (promoted to Stratum 3).
 *
 * Criteria:
 * - At least `minCount` observations with the same metric
 * - Sufficient variance to extract a meaningful pattern
 * - OR a significant trend (monotonic increase/decrease)
 */
export function shouldDistill(
  observations: Observation[],
  minCount: number = 10,
): boolean {
  if (observations.length < minCount) return false;

  // Extract quality scores where available
  const scores = observations
    .map((o) => o.data.qualityScore)
    .filter((s): s is number => s !== undefined);

  if (scores.length < 3) return true; // Poor data but enough volume — distill anyway

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((sum, v) => sum + (v - mean) ** 2, 0) / scores.length;

  // Low variance = stable pattern worth distilling
  if (variance < 0.01) return true;

  // Clear trend = worth distilling
  const trend = computeLinearTrend(scores);
  if (Math.abs(trend) > 0.01) return true;

  return false;
}

// ============ STRATUM 3: DISTILLATIONS ============

/**
 * Distill a set of observations into a pattern insight (Stratum 3).
 */
export function distillObservations(
  observations: Observation[],
  category: DistillationCategory,
  patternIds?: string[],
): Distillation {
  const scores = observations
    .map((o) => o.data.qualityScore)
    .filter((s): s is number => s !== undefined);

  const mean =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const variance =
    scores.length > 1
      ? scores.reduce((sum, v) => sum + (v - mean) ** 2, 0) / scores.length
      : 0;
  const trend = computeLinearTrend(scores);

  const trendDir =
    trend > 0.01 ? "improving" : trend < -0.01 ? "declining" : "stable";

  const successRate =
    observations.filter((o) => o.data.success).length / observations.length;

  const insight = `${category}: ${trendDir} trend (mean quality=${mean.toFixed(3)}, σ²=${variance.toFixed(4)}, success=${(successRate * 100).toFixed(0)}%, n=${observations.length})`;

  // Confidence based on sample size and consistency
  const confidence = Math.min(
    1,
    Math.max(
      0,
      (1 - Math.sqrt(variance)) * (1 - Math.exp(-0.1 * observations.length)),
    ),
  );

  // Derive related pattern IDs from observations if not provided
  const relatedPatternIds = patternIds ?? [
    ...new Set(observations.map((o) => o.sourceBloomId)),
  ];

  return {
    id: generateId(),
    stratum: 3,
    createdAt: new Date(),
    sourceObservationIds: observations.map((o) => o.id),
    insight,
    confidence,
    category,
    relatedPatternIds,
  };
}

// ============ STRATUM 4: INSTITUTIONAL KNOWLEDGE ============

/**
 * Create institutional knowledge (Stratum 4).
 * Permanent, governance-level knowledge.
 */
export function createInstitutionalKnowledge(
  content: string,
  knowledgeType: InstitutionalKnowledgeType,
  distillations: Distillation[],
): InstitutionalKnowledge {
  const avgConfidence =
    distillations.length > 0
      ? distillations.reduce((sum, d) => sum + d.confidence, 0) /
        distillations.length
      : 0;

  return {
    id: generateId(),
    stratum: 4,
    createdAt: new Date(),
    content,
    knowledgeType,
    confidence: avgConfidence,
    contributingCount: distillations.length,
    lastReinforced: new Date(),
  };
}

/**
 * Check if distillations should be promoted to institutional knowledge.
 *
 * Criteria:
 * - At least `minDistillations` related distillations
 * - Average confidence above threshold
 * - Distillations span sufficient time range
 */
export function shouldPromoteToInstitutional(
  distillations: Distillation[],
  minDistillations: number = 5,
  minConfidence: number = 0.7,
): boolean {
  if (distillations.length < minDistillations) return false;

  const avgConfidence =
    distillations.reduce((sum, d) => sum + d.confidence, 0) /
    distillations.length;

  return avgConfidence >= minConfidence;
}

// ============ DECISION RECORDING ============

/**
 * Create a Decision record for the memory system.
 */
export function createDecision(
  context: DecisionContext,
  alternatives: string[],
  selected: string,
  reason: string,
  madeByBloomId: string,
  evaluatedRules: string[] = [],
): Decision {
  return {
    id: generateId(),
    timestamp: new Date(),
    context,
    alternatives,
    selected,
    reason,
    evaluatedRules,
    madeByBloomId,
  };
}

/**
 * Attach an outcome to a decision.
 */
export function attachOutcome(
  decision: Decision,
  outcome: DecisionOutcome,
): Decision {
  return {
    ...decision,
    outcome,
  };
}

// ============ HELPERS ============

/**
 * Simple linear regression slope for trend detection.
 * Returns the slope of the best-fit line through the values.
 */
function computeLinearTrend(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}
