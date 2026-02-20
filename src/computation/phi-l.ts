/**
 * Codex Signum — ΦL Computation (Luminance Schema)
 *
 * ΦL is the health composite. NEVER a single number.
 * Always: weighted factors × maturity adjustment.
 *
 * Formula:
 *   raw = Σ(wᵢ × fᵢ)   where i ∈ {axiom, provenance, success, stability}
 *   maturityFactor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
 *   effective = raw × maturityFactor
 *
 * @see engineering-bridge-v2.0.md §Part 2 "Computing ΦL"
 * @see codex-signum-v3.0.md §State Dimensions
 * @module codex-signum-core/computation/phi-l
 */

import type {
  PhiL,
  PhiLFactors,
  PhiLTrend,
  PhiLWeights,
} from "../types/state-dimensions.js";
import { DEFAULT_PHI_L_WEIGHTS } from "../types/state-dimensions.js";
import { computeMaturityFactor } from "./maturity.js";

// ============ CORE COMPUTATION ============

/**
 * Compute ΦL from raw factors.
 *
 * This is the primary entry point. All ΦL in the system flows through here.
 *
 * @param factors — The four observable factor values (0.0–1.0 each)
 * @param observationCount — Number of retained observations backing this score
 * @param connectionCount — Number of active graph connections
 * @param previousPhiL — Previous ΦL effective value (for trend calculation)
 * @param weights — Factor weights (defaults to spec recommendation)
 */
export function computePhiL(
  factors: PhiLFactors,
  observationCount: number,
  connectionCount: number,
  previousPhiL?: number,
  weights: PhiLWeights = DEFAULT_PHI_L_WEIGHTS,
): PhiL {
  // Validate factors are in [0, 1]
  validateFactors(factors);
  validateWeights(weights);

  // Raw weighted sum
  const raw = computeRawPhiL(factors, weights);

  // Maturity adjustment
  const maturityFactor = computeMaturityFactor(
    observationCount,
    connectionCount,
  );

  // Effective = raw × maturity
  const effective = raw * maturityFactor;

  // Trend from previous
  const trend = computeTrend(effective, previousPhiL);

  return {
    factors,
    weights,
    raw,
    maturityFactor,
    effective,
    trend,
    observationCount,
    connectionCount,
    computedAt: new Date(),
  };
}

// ============ SUB-COMPUTATIONS ============

/**
 * Compute the raw weighted sum of ΦL factors.
 *   raw = w_axiom × axiomCompliance
 *       + w_provenance × provenanceClarity
 *       + w_success × usageSuccessRate
 *       + w_stability × temporalStability
 */
export function computeRawPhiL(
  factors: PhiLFactors,
  weights: PhiLWeights,
): number {
  return (
    weights.axiomCompliance * factors.axiomCompliance +
    weights.provenanceClarity * factors.provenanceClarity +
    weights.usageSuccessRate * factors.usageSuccessRate +
    weights.temporalStability * factors.temporalStability
  );
}

/**
 * Determine ΦL trend from current vs previous effective value.
 *
 * Band of ±0.02 for stability — prevents noise-driven oscillation.
 */
export function computeTrend(
  currentEffective: number,
  previousEffective?: number,
): PhiLTrend {
  if (previousEffective === undefined) return "stable";
  const delta = currentEffective - previousEffective;
  if (delta > 0.02) return "improving";
  if (delta < -0.02) return "declining";
  return "stable";
}

// ============ FACTOR EXTRACTORS ============

/**
 * Compute axiomCompliance factor from a compliance record.
 * Binary per axiom — fraction of 10 axioms satisfied.
 */
export function computeAxiomComplianceFactor(
  compliance: Record<string, boolean>,
): number {
  const axiomKeys = Object.keys(compliance);
  if (axiomKeys.length === 0) return 0;
  const satisfied = axiomKeys.filter((k) => compliance[k]).length;
  return satisfied / axiomKeys.length;
}

/**
 * Compute usageSuccessRate from a window of observations.
 *
 * @param successCount — successful invocations in window
 * @param totalCount — total invocations in window
 */
export function computeUsageSuccessRate(
  successCount: number,
  totalCount: number,
): number {
  if (totalCount === 0) return 0;
  return Math.min(1, Math.max(0, successCount / totalCount));
}

/**
 * Compute temporalStability from a series of ΦL observations.
 *
 * Stability = 1 - coefficient_of_variation
 * (bounded to [0, 1])
 *
 * If fewer than 3 observations, assume moderate stability (0.5).
 */
export function computeTemporalStability(recentPhiLValues: number[]): number {
  if (recentPhiLValues.length < 3) return 0.5; // Not enough data

  const mean =
    recentPhiLValues.reduce((sum, v) => sum + v, 0) / recentPhiLValues.length;
  if (mean === 0) return 0;

  const variance =
    recentPhiLValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
    recentPhiLValues.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean; // coefficient of variation

  // Stability = 1 - cv, clamped to [0, 1]
  return Math.max(0, Math.min(1, 1 - cv));
}

// ============ VALIDATION ============

function validateFactors(factors: PhiLFactors): void {
  const entries = Object.entries(factors) as Array<[string, number]>;
  for (const [key, value] of entries) {
    if (typeof value !== "number" || value < 0 || value > 1) {
      throw new Error(
        `ΦL factor '${key}' must be a number in [0, 1], got ${value}`,
      );
    }
  }
}

function validateWeights(weights: PhiLWeights): void {
  const sum =
    weights.axiomCompliance +
    weights.provenanceClarity +
    weights.usageSuccessRate +
    weights.temporalStability;

  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(`ΦL weights must sum to 1.0, got ${sum.toFixed(4)}`);
  }
}
