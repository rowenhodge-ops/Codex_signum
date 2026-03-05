/**
 * Codex Signum — Stratum 2 Compaction
 *
 * Prune observations whose recency weight has decayed below threshold.
 * Uses continuous exponential decay: weight = e^(-λ × age)
 *
 * Safe to compact when ALL of:
 * 1. Recency weight < compactionThreshold (default: 0.01)
 * 2. The observation's signal has been processed by the signal pipeline
 * 3. The observation has been included in at least one distillation
 *
 * Key insight: compaction is SAFE because the information has already been
 * absorbed into ΦL, Thompson posteriors, and signal conditioning state.
 * Old observations whose signal has been integrated into higher-level state
 * can be pruned without information loss.
 *
 * @see codex-signum-v3.0.md §Memory Topology, Stratum 2
 * @module codex-signum-core/memory/compaction
 */
/**
 * Configuration for Stratum 2 compaction.
 *
 * The decay constant λ determines how quickly observations fade.
 * This value CAN be tuned per component by the calibration meta-process.
 */
export interface CompactionConfig {
    /**
     * Decay constant λ (per millisecond).
     * Controls how quickly observations fade.
     * Higher λ = faster decay = more aggressive compaction.
     *
     * Reference: half-life = ln(2) / λ
     * For a 7-day half-life:  λ ≈ 1.1457e-9
     * For a 14-day half-life: λ ≈ 5.7286e-10
     * For a 30-day half-life: λ ≈ 2.6741e-10
     *
     * This value CAN be tuned per component by the calibration meta-process.
     */
    decayConstant: number;
    /**
     * Weight threshold below which an observation is eligible for compaction.
     * Spec recommends 0.01. At this point the observation contributes < 1%
     * to any running average it participates in.
     */
    compactionThreshold: number;
    /** Maximum observations to evaluate per compaction run. Default: 500 */
    batchSize: number;
    /** If true, keep observations that contributed to active (non-superseded) distillations */
    preserveActiveDistillationSources: boolean;
}
/**
 * Default config uses a 14-day half-life.
 * The practical observation window is ~5× half-life ≈ 70 days.
 * This is a STARTING POINT — the calibration meta-process should tune λ
 * based on false positive/negative rates and observation density.
 */
export declare const DEFAULT_COMPACTION_CONFIG: CompactionConfig;
/**
 * Compute the recency weight of an observation.
 * weight = e^(-λ × age_ms)
 *
 * Exported because other parts of the system (signal conditioning,
 * threshold learning) may need to weight observations by recency.
 */
export declare function computeObservationWeight(ageMs: number, decayConstant: number): number;
/**
 * Compute the practical observation window size for a given config.
 * This is the age at which weight drops below compactionThreshold.
 * window = -ln(compactionThreshold) / λ
 *
 * Useful for query optimization — no need to scan observations
 * older than this window.
 */
export declare function computePracticalWindow(config: CompactionConfig): number;
/**
 * Observation metadata needed for compaction decisions.
 *
 * NOTE: `signalProcessed` is currently a dead read — no code path sets it to `true`.
 * This is architecturally intentional: the signal conditioning pipeline (M-9.V vertical
 * compute) is not yet wired into the observation write path. When it is, the pipeline
 * will set `signalProcessed = true` after conditioning, and compaction will begin
 * reclaiming those observations. Until then, all observations remain non-compactable
 * on this criterion, which is the safe default.
 */
export interface CompactableObservation {
    id: string;
    timestamp: Date;
    signalProcessed: boolean;
    includedInDistillationIds: string[];
}
/**
 * Pure function: given observations and their metadata, return IDs safe to compact.
 * No graph dependency — caller provides the data.
 *
 * For each observation, computes weight = e^(-λ × age) where
 * age = now - observation.timestamp. If weight < compactionThreshold
 * AND signal has been processed AND observation has been distilled,
 * the observation is compactable.
 */
export declare function identifyCompactable(observations: CompactableObservation[], activeDistillationIds: Set<string>, now: Date, config?: Partial<CompactionConfig>): string[];
/**
 * Compaction statistics for monitoring.
 */
export interface CompactionStats {
    evaluated: number;
    compactable: number;
    retained: {
        aboveWeightThreshold: number;
        unprocessedSignal: number;
        neverDistilled: number;
        activeDistillationSource: number;
    };
    /** Useful diagnostics */
    diagnostics: {
        /** Current practical window size in ms */
        practicalWindowMs: number;
        /** Equivalent in days (for human readability) */
        practicalWindowDays: number;
        /** Min/max/mean weight of evaluated observations */
        weightDistribution: {
            min: number;
            max: number;
            mean: number;
        };
    };
}
/**
 * Compute compaction statistics for monitoring.
 * Same logic as identifyCompactable but tracks detailed retention reasons.
 */
export declare function computeCompactionStats(observations: CompactableObservation[], activeDistillationIds: Set<string>, now: Date, config?: Partial<CompactionConfig>): CompactionStats;
//# sourceMappingURL=compaction.d.ts.map