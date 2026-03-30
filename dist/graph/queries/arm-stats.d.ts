/** Thompson Sampling arm stats */
export interface ArmStats {
    seedId: string;
    alpha: number;
    beta: number;
    totalTrials: number;
    avgQuality: number;
    avgLatencyMs: number;
    avgCost: number;
    totalCost: number;
}
/** Default half-life for model-performance context (~2.5 days in ms) */
export declare const DEFAULT_HALF_LIFE_MS = 216000000;
/**
 * Compute temporal decay factor: γ = e^(-λ × Δt) where λ = ln(2) / halfLifeMs.
 * Returns 1.0 when elapsedMs is 0, decays toward 0 as time passes.
 */
export declare function computeTemporalDecay(halfLifeMs: number, elapsedMs: number): number;
/** γ-recursive Beta posterior read from node properties */
export interface DecayWeightedPosterior {
    alpha: number;
    beta: number;
}
/**
 * Read γ-recursive decay-weighted posteriors from a Bloom or Resonator node.
 *
 * Returns Beta(α, β) where α = weightedSuccesses + 1 and β = weightedFailures + 1.
 * Missing node or missing properties → uniform Beta(1, 1).
 *
 * @param bloomId - Node ID (Bloom or Resonator)
 * @param _armId - Reserved for future per-arm decomposition
 */
export declare function getDecayWeightedPosteriors(bloomId: string, _armId?: string): Promise<DecayWeightedPosterior>;
/** Compute Thompson Sampling arm stats for a context cluster */
export declare function getArmStatsForCluster(clusterId: string): Promise<ArmStats[]>;
//# sourceMappingURL=arm-stats.d.ts.map