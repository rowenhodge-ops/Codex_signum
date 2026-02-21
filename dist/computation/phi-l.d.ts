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
import type { PhiL, PhiLFactors, PhiLTrend, PhiLWeights } from "../types/state-dimensions.js";
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
 * Binary per axiom — fraction of 10 axioms satisfied.
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
//# sourceMappingURL=phi-l.d.ts.map