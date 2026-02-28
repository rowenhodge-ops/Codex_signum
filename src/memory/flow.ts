// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Memory Flow Coordinator
 *
 * Coordinates the upward flow (lossy compression from execution → observation →
 * distillation → institutional) and downward flow (contextual enrichment from
 * institutional → distilled → better defaults).
 *
 * All functions are pure — they compute what SHOULD happen.
 * Callers (graph-feeder, bridges) are responsible for persistence.
 *
 * @see codex-signum-v3.0.md §Memory Topology
 * @module codex-signum-core/memory/flow
 */

import type { Observation, ObservationData } from "../types/memory.js";
import type { PerformanceProfile, RoutingHints } from "./distillation.js";

// Polyfill for environments without crypto.randomUUID
const generateId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
};

// ============ UPWARD FLOW ============

export interface UpwardFlowInput {
  /** The execution that just completed */
  execution: {
    patternId: string;
    modelId: string;
    success: boolean;
    qualityScore?: number;
    durationMs: number;
    failureSignature?: string;
    context?: string;
  };
  /** Existing observations for this pattern (for distillation trigger check) */
  existingObservationCount: number;
  /** Existing distillations for this pattern (for institutional promotion check) */
  existingDistillations: Array<{
    id: string;
    confidence: number;
    createdAt: Date;
  }>;
}

export interface UpwardFlowResult {
  /** The observation to persist */
  observation: Observation;
  /** Whether distillation should be triggered */
  shouldDistill: boolean;
  /** Whether institutional promotion should be triggered */
  shouldPromoteToInstitutional: boolean;
}

/** Thresholds for upward flow decisions */
const DISTILLATION_THRESHOLD = 10; // observations before first distillation
const DISTILLATION_INTERVAL = 5; // re-distill every N new observations
const INSTITUTIONAL_MIN_DISTILLATIONS = 5;
const INSTITUTIONAL_MIN_CONFIDENCE = 0.7;

/**
 * Compute what upward flow actions should happen after an execution.
 *
 * Upward: execution completes → write observation → check distillation trigger
 *         → check institutional promotion
 */
export function computeUpwardFlow(input: UpwardFlowInput): UpwardFlowResult {
  const { execution, existingObservationCount, existingDistillations } = input;

  // Create observation from execution result
  const data: ObservationData = {
    success: execution.success,
    durationMs: execution.durationMs,
    qualityScore: execution.qualityScore,
    modelUsed: execution.modelId,
    context: execution.failureSignature
      ? { failureSignature: execution.failureSignature }
      : execution.context
        ? { context: execution.context }
        : undefined,
  };

  const observation: Observation = {
    id: generateId(),
    stratum: 2,
    timestamp: new Date(),
    sourcePatternId: execution.patternId,
    observationType: "execution_outcome",
    data,
  };

  // New count includes this observation
  const newCount = existingObservationCount + 1;

  // Distillation trigger: enough observations accumulated
  const shouldDistill =
    newCount >= DISTILLATION_THRESHOLD &&
    (existingDistillations.length === 0 ||
      (newCount - DISTILLATION_THRESHOLD) % DISTILLATION_INTERVAL === 0);

  // Institutional promotion: enough distillations with sufficient confidence
  let shouldPromoteToInstitutional = false;
  if (existingDistillations.length >= INSTITUTIONAL_MIN_DISTILLATIONS) {
    const avgConfidence =
      existingDistillations.reduce((sum, d) => sum + d.confidence, 0) /
      existingDistillations.length;
    shouldPromoteToInstitutional =
      avgConfidence >= INSTITUTIONAL_MIN_CONFIDENCE;
  }

  return {
    observation,
    shouldDistill,
    shouldPromoteToInstitutional,
  };
}

// ============ DOWNWARD FLOW ============

export interface DownwardFlowInput {
  /** The component requesting context */
  componentId: string;
  /** Available distilled insights for this component */
  distilledInsights: PerformanceProfile[];
  /** Available routing hints */
  routingHints: RoutingHints[];
  /** Relevant institutional knowledge */
  institutionalKnowledge: Array<{
    content: string;
    confidence: number;
    knowledgeType: string;
  }>;
}

export interface MemoryContext {
  /** Performance context for decision-making */
  performanceSummary: string;
  /** Model routing suggestions */
  modelSuggestions: Array<{ modelId: string; reason: string }>;
  /** Known failure modes to watch for */
  knownFailureModes: Array<{ signature: string; mitigation: string }>;
  /** Threshold calibration hints */
  thresholdHints: Array<{
    threshold: string;
    suggestedValue: number;
    confidence: number;
  }>;
  /** Confidence in this context (based on evidence depth) */
  contextConfidence: number;
}

/**
 * Compute the downward flow — synthesize available insights into
 * actionable context for a component.
 *
 * Downward: gather distilled insights + institutional knowledge →
 *           produce enriched context
 */
export function computeDownwardFlow(input: DownwardFlowInput): MemoryContext {
  const {
    componentId,
    distilledInsights,
    routingHints,
    institutionalKnowledge,
  } = input;

  // Performance summary from distilled insights
  let performanceSummary: string;
  if (distilledInsights.length === 0) {
    performanceSummary = `No performance data available for ${componentId}`;
  } else {
    const latest = distilledInsights[distilledInsights.length - 1];
    performanceSummary =
      `${componentId}: ΦL=${latest.meanPhiL.toFixed(3)} (${latest.phiLTrend}), ` +
      `success=${(latest.successRate * 100).toFixed(0)}%, ` +
      `n=${latest.observationCount}`;
  }

  // Model suggestions from routing hints
  const modelSuggestions: MemoryContext["modelSuggestions"] = [];
  for (const hints of routingHints) {
    for (const preferred of hints.preferredModels) {
      modelSuggestions.push({
        modelId: preferred.modelId,
        reason: `${(preferred.successRate * 100).toFixed(0)}% success rate over ${preferred.sampleSize} observations`,
      });
    }
  }

  // Known failure modes from performance profiles
  const knownFailureModes: MemoryContext["knownFailureModes"] = [];
  for (const profile of distilledInsights) {
    for (const failure of profile.commonFailureModes) {
      knownFailureModes.push({
        signature: failure.signature,
        mitigation: `Seen ${failure.frequency.toFixed(1)}/day — consider retry or alternative model`,
      });
    }
  }

  // Threshold hints from institutional knowledge
  const thresholdHints: MemoryContext["thresholdHints"] = [];
  for (const ik of institutionalKnowledge) {
    if (ik.knowledgeType === "environment_adaptation") {
      thresholdHints.push({
        threshold: "phiL_healthy",
        suggestedValue: 0.7,
        confidence: ik.confidence,
      });
    }
  }

  // Context confidence based on evidence depth
  const evidenceFactors = [
    distilledInsights.length > 0 ? 0.3 : 0,
    routingHints.length > 0 ? 0.3 : 0,
    institutionalKnowledge.length > 0 ? 0.2 : 0,
    // Bonus for volume
    Math.min(
      0.2,
      distilledInsights.reduce((sum, p) => sum + p.observationCount, 0) /
        100 *
        0.2,
    ),
  ];
  const contextConfidence = evidenceFactors.reduce((a, b) => a + b, 0);

  return {
    performanceSummary,
    modelSuggestions,
    knownFailureModes,
    thresholdHints,
    contextConfidence,
  };
}
