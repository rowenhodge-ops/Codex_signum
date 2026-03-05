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
import type { PhiL, PhiLFactors, PhiLState, PhiLTrend, PhiLWeights } from "../types/state-dimensions.js";
/**
 * Recommended ΦL ring buffer (window) sizes by node type.
 * Engineering Bridge §Part 2: "ΦL window sizes must match hierarchy."
 *
 * | Node type              | Window size N |
 * | Leaf / function        | 10–20         |
 * | Intermediate / pattern | 30–50         |
 * | Root / coordinator     | 50–100        |
 *
 * Pass these to createPhiLState(maxSize) for the appropriate node type.
 */
export declare const PHI_L_WINDOW_SIZES: {
    readonly leaf: {
        readonly min: 10;
        readonly max: 20;
        readonly default: 20;
    };
    readonly intermediate: {
        readonly min: 30;
        readonly max: 50;
        readonly default: 40;
    };
    readonly root: {
        readonly min: 50;
        readonly max: 100;
        readonly default: 75;
    };
};
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
export declare function computePhiL(factors: PhiLFactors, observationCount: number, connectionCount: number, previousPhiL?: number, weights?: PhiLWeights): PhiL;
/**
 * Compute the raw weighted sum of ΦL factors.
 *   raw = w_axiom × axiomCompliance
 *       + w_provenance × provenanceClarity
 *       + w_success × usageSuccessRate
 *       + w_stability × temporalStability
 */
export declare function computeRawPhiL(factors: PhiLFactors, weights: PhiLWeights): number;
/**
 * Determine ΦL trend from current vs previous effective value.
 *
 * Band of ±0.02 for stability — prevents noise-driven oscillation.
 */
export declare function computeTrend(currentEffective: number, previousEffective?: number): PhiLTrend;
/**
 * Compute axiomCompliance factor from a compliance record.
 * Binary per axiom — fraction of axioms satisfied.
 */
export declare function computeAxiomComplianceFactor(compliance: Record<string, boolean>): number;
/**
 * Compute usageSuccessRate from a window of observations.
 *
 * @param successCount — successful invocations in window
 * @param totalCount — total invocations in window
 */
export declare function computeUsageSuccessRate(successCount: number, totalCount: number): number;
/**
 * Compute temporalStability from a series of ΦL observations.
 *
 * Stability = 1 - coefficient_of_variation
 * (bounded to [0, 1])
 *
 * If fewer than 3 observations, assume moderate stability (0.5).
 */
export declare function computeTemporalStability(recentPhiLValues: number[]): number;
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
export declare function computeTemporalStabilityFromState(state: PhiLState, latestPhiL: number): {
    stability: number;
    updatedState: PhiLState;
};
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
export declare function computePhiLWithState(factors: Omit<PhiLFactors, "temporalStability">, observationCount: number, connectionCount: number, state: PhiLState, previousPhiL?: number, weights?: PhiLWeights): {
    phiL: PhiL;
    updatedState: PhiLState;
};
//# sourceMappingURL=phi-l.d.ts.map