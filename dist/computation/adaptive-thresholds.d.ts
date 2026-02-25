/**
 * Codex Signum — Adaptive Threshold Resolver
 *
 * Replaces fixed thresholds with maturity-driven values.
 * A young network where mean ΦL is 0.6 is healthy.
 * A mature network at ΦL 0.6 is sick.
 *
 * Uses LINEAR INTERPOLATION between band anchor points for smooth transitions.
 * Hard band boundaries cause threshold-crossing oscillation — a system at
 * MI = 0.299 and MI = 0.301 should have nearly identical thresholds.
 *
 * @see codex-signum-v3.0.md §State Dimensions
 * @see engineering-bridge-v2.0.md §Part 2 "Adaptive thresholds — maturity-indexed"
 * @module codex-signum-core/computation/adaptive-thresholds
 */
export interface ThresholdSet {
    /** ΦL above this = healthy */
    phiL_healthy: number;
    /** ΦL below this = degraded */
    phiL_degraded: number;
    /** εR within this range = stable */
    epsilonR_stable: {
        min: number;
        max: number;
    };
    /** ΨH combined above this = dissonant */
    psiH_dissonance: number;
}
/**
 * Resolve thresholds from a maturity index value.
 *
 * Linear interpolation between band anchor points for smooth transitions.
 * Band anchors are at MI = 0.15 (young center), 0.5 (maturing center), 0.85 (mature center).
 * Below 0.15 → young values. Above 0.85 → mature values.
 * Between anchors → linear interpolation.
 */
export declare function getThresholds(maturityIndex: number): ThresholdSet;
/**
 * Classify a ΦL value against maturity-indexed thresholds.
 * Returns 'healthy', 'degraded', or 'intermediate'.
 */
export declare function classifyPhiLHealth(phiL_effective: number, maturityIndex: number): "healthy" | "intermediate" | "degraded";
/**
 * Classify εR value against maturity-indexed thresholds.
 * Returns 'rigid', 'stable', 'adaptive', or 'unstable'.
 */
export declare function classifyEpsilonRAdaptive(epsilonR: number, maturityIndex: number): "rigid" | "stable" | "adaptive" | "unstable";
/**
 * Check if ΨH indicates dissonance at the current maturity level.
 */
export declare function isDissonant(psiH_combined: number, maturityIndex: number): boolean;
//# sourceMappingURL=adaptive-thresholds.d.ts.map