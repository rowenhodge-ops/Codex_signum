// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Arm Stats Update (Pure Function)
 *
 * Incremental update of Thompson Sampling arm statistics
 * after an execution outcome. Handles Beta posterior update
 * and EWMA smoothing for duration/quality/cost metrics.
 *
 * @module codex-signum-core/patterns/thompson-router/arm-stats
 */

import type { ArmStats } from "../../graph/queries.js";

/** Outcome record provided by the caller after execution completes. */
export interface OutcomeRecord {
  /** Did the execution succeed? */
  success: boolean;
  /** Wall-clock execution time in milliseconds */
  durationMs: number;
  /** Quality score [0,1] — caller-assessed */
  qualityScore?: number;
  /** Cost of this execution (e.g., API cost) */
  cost?: number;
  /** Error type string if success=false */
  errorType?: string;
  /** Optional notes */
  notes?: string;
}

/**
 * Update ArmStats after an outcome (pure function).
 *
 * Beta distribution update:
 *   success → alpha += 1  (alpha = successes + 1 prior)
 *   failure → beta  += 1  (beta  = failures  + 1 prior)
 *
 * EWMA update (default λ = 0.1):
 *   avgLatencyMs = λ × durationMs  + (1-λ) × prev
 *   avgQuality   = λ × qualityScore + (1-λ) × prev  (if qualityScore provided)
 *   avgCost      = λ × cost         + (1-λ) × prev  (if cost provided)
 *
 * totalTrials always increments by 1.
 * totalCost accumulates the raw cost.
 */
export function updateArmStats(
  current: ArmStats,
  outcome: OutcomeRecord,
  ewmaLambda: number = 0.1,
): ArmStats {
  const alpha = outcome.success ? current.alpha + 1 : current.alpha;
  const beta = outcome.success ? current.beta : current.beta + 1;
  const totalTrials = current.totalTrials + 1;

  const avgLatencyMs =
    current.totalTrials === 0
      ? outcome.durationMs
      : ewmaLambda * outcome.durationMs +
        (1 - ewmaLambda) * current.avgLatencyMs;

  const avgQuality =
    outcome.qualityScore !== undefined
      ? current.totalTrials === 0
        ? outcome.qualityScore
        : ewmaLambda * outcome.qualityScore +
          (1 - ewmaLambda) * current.avgQuality
      : current.avgQuality;

  const outcomesCost = outcome.cost ?? 0;
  const avgCost =
    outcome.cost !== undefined
      ? current.totalTrials === 0
        ? outcome.cost
        : ewmaLambda * outcome.cost + (1 - ewmaLambda) * current.avgCost
      : current.avgCost;

  const totalCost = current.totalCost + outcomesCost;

  return {
    seedId: current.seedId,
    alpha,
    beta,
    totalTrials,
    avgQuality,
    avgLatencyMs,
    avgCost,
    totalCost,
  };
}

/**
 * Create a fresh ArmStats with uniform Beta(1,1) prior.
 * Used when a seed has no prior observations in a cluster.
 */
export function freshArmStats(seedId: string): ArmStats {
  return {
    seedId,
    alpha: 1,
    beta: 1,
    totalTrials: 0,
    avgQuality: 0,
    avgLatencyMs: 0,
    avgCost: 0,
    totalCost: 0,
  };
}
