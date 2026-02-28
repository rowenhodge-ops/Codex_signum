// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Observation Value Conditioning
 *
 * Wraps SignalPipeline.process() for observation values.
 * Consumers provide the pipeline instance; core remains stateless.
 *
 * conditionValue() is called INLINE during observation writes --
 * it is a function call, not a scheduled process or background task.
 *
 * @module codex-signum-core/computation/condition-value
 */

import type { SignalPipeline } from "../signals/SignalPipeline.js";
import type { ConditionedSignal, SignalEvent } from "../signals/types.js";

/**
 * Condition a raw observation value through the 7-stage signal pipeline.
 *
 * Converts the observation context (patternId, metric, raw value) into
 * a SignalEvent and routes it through the caller-provided pipeline.
 *
 * The pipeline instance MUST be reused across calls for the same pattern
 * to maintain EWMA/CUSUM/trend accumulator state. Creating a new pipeline
 * per call resets all stateful stages.
 *
 * @param pipeline - The SignalPipeline instance (caller owns lifecycle)
 * @param patternId - The pattern this observation belongs to
 * @param metric - Observation metric name (mapped to signal dimension)
 * @param rawValue - The raw observation value
 * @param topologyRole - Node's topology role for EWMA alpha selection
 * @returns ConditionedSignal with smoothedValue, alerts, etc.
 */
export function conditionValue(
  pipeline: SignalPipeline,
  patternId: string,
  metric: string,
  rawValue: number,
  topologyRole: "leaf" | "hub" | "default" = "default",
): ConditionedSignal {
  const dimension = mapMetricToDimension(metric);

  const event: SignalEvent = {
    agentId: patternId, // Pipeline uses agentId as entity key
    dimension,
    rawValue,
    timestamp: Date.now(),
    topologyRole,
  };

  return pipeline.process(event);
}

/**
 * Map observation metric names to signal pipeline dimensions.
 *
 * The signal pipeline operates on three dimensions: phiL, psiH, epsilonR.
 * Observation metrics may use more specific names; this maps them.
 */
function mapMetricToDimension(
  metric: string,
): "phiL" | "psiH" | "epsilonR" {
  const normalized = metric.toLowerCase();
  if (
    normalized.includes("phi") ||
    normalized.includes("health") ||
    normalized.includes("quality") ||
    normalized.includes("success")
  ) {
    return "phiL";
  }
  if (
    normalized.includes("psi") ||
    normalized.includes("harmonic") ||
    normalized.includes("friction") ||
    normalized.includes("coherence")
  ) {
    return "psiH";
  }
  if (
    normalized.includes("epsilon") ||
    normalized.includes("exploration") ||
    normalized.includes("exploratory")
  ) {
    return "epsilonR";
  }
  // Default: treat as health observation
  return "phiL";
}
