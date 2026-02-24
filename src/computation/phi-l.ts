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
  PhiLState,
  PhiLTrend,
  PhiLWeights,
} from "../types/state-dimensions.js";
import { DEFAULT_PHI_L_WEIGHTS } from "../types/state-dimensions.js";
import { computeMaturityFactor } from "./maturity.js";

// ============ CONSTANTS ============

/**
 * Maximum expected inter-run ΦL variance for temporal stability.
 * stddev ≈ 0.2 normalised. Matches DND-Manager convention.
 */
const MAX_EXPECTED_VARIANCE = 0.04;

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

// ============ STATEFUL COMPUTATION ============

/**
 * Compute temporal stability from a PhiLState ring buffer.
 *
 * Uses variance-based approach: stability = 1 - min(1, variance / MAX_EXPECTED_VARIANCE)
 * Low variance → high stability. High variance → low stability.
 *
 * This is the stateless equivalent of DND-Manager's HealthComputer ring buffer.
 * The caller owns and persists the PhiLState between runs.
 *
 * @param state — Current PhiLState (ring buffer)
 * @param latestPhiL — Most recent ΦL effective value to push into buffer
 * @returns { stability, updatedState } — the computed stability and new state
 */
export function computeTemporalStabilityFromState(
  state: PhiLState,
  latestPhiL: number,
): { stability: number; updatedState: PhiLState } {
  // Clone ring buffer (immutable update)
  const ringBuffer = [...state.ringBuffer, latestPhiL];
  if (ringBuffer.length > state.maxSize) {
    ringBuffer.shift();
  }

  const updatedState: PhiLState = { ...state, ringBuffer };

  // Need at least 2 values to compute variance
  if (ringBuffer.length < 2) {
    return { stability: 0.5, updatedState };
  }

  const mean = ringBuffer.reduce((a, b) => a + b, 0) / ringBuffer.length;
  const variance =
    ringBuffer.reduce((sum, v) => sum + (v - mean) ** 2, 0) / ringBuffer.length;

  const stability = Math.max(0, Math.min(1, 1 - variance / MAX_EXPECTED_VARIANCE));
  return { stability, updatedState };
}

/**
 * Compute ΦL with integrated state management.
 *
 * Wraps `computePhiL` with ring buffer temporal stability tracking.
 * The caller provides a PhiLState; the function returns the updated state
 * alongside the PhiL result. Core remains stateless — no module-level Maps.
 *
 * Flow:
 * 1. Compute raw ΦL using provided factors (temporalStability from state)
 * 2. Push effective ΦL into ring buffer
 * 3. Recompute temporal stability from updated buffer for next cycle
 * 4. Return both the PhiL result and updated state
 *
 * @param factors — The three non-stability factors (stability is computed from state)
 * @param observationCount — Number of retained observations
 * @param connectionCount — Number of active graph connections
 * @param state — Current PhiLState (ring buffer for temporal stability)
 * @param previousPhiL — Previous ΦL effective value (for trend)
 * @param weights — Factor weights (defaults to spec recommendation)
 */
export function computePhiLWithState(
  factors: Omit<PhiLFactors, "temporalStability">,
  observationCount: number,
  connectionCount: number,
  state: PhiLState,
  previousPhiL?: number,
  weights: PhiLWeights = DEFAULT_PHI_L_WEIGHTS,
): { phiL: PhiL; updatedState: PhiLState } {
  // Compute temporal stability from current ring buffer state
  // Use previousPhiL as the latest observation to push
  const phiLForBuffer = previousPhiL ?? 0.5;
  const { stability, updatedState } = computeTemporalStabilityFromState(
    state,
    phiLForBuffer,
  );

  // Build full factors including computed stability
  const fullFactors: PhiLFactors = {
    ...factors,
    temporalStability: stability,
  };

  // Delegate to existing computePhiL (backward compatible)
  const phiL = computePhiL(
    fullFactors,
    observationCount,
    connectionCount,
    previousPhiL,
    weights,
  );

  return { phiL, updatedState };
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
