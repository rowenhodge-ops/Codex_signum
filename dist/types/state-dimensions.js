/**
 * Codex Signum — State Dimension Type Definitions
 *
 * Every morpheme carries three state properties:
 * - ΦL (Luminance Schema) — Health
 * - ΨH (Harmonic Signature) — Relational coherence
 * - εR (Exploration Rate) — Adaptive capacity
 *
 * These are NEVER single numbers. They are always composite structures.
 *
 * @see codex-signum-v3.0.md §State Dimensions
 * @see engineering-bridge-v2.0.md §Part 2
 * @module codex-signum-core/types/state-dimensions
 */
/** Default ΦL weights per Engineering Bridge v2.0 §Part 2 */
export const DEFAULT_PHI_L_WEIGHTS = {
    axiomCompliance: 0.4,
    provenanceClarity: 0.2,
    usageSuccessRate: 0.2,
    temporalStability: 0.2,
};
/**
 * Create a fresh PhiLState with default settings.
 *
 * @param maxSize — Ring buffer capacity (default 20, matching DND convention)
 */
export function createPhiLState(maxSize = 20) {
    return { ringBuffer: [], maxSize };
}
/** Recommended ΨH component weights per Engineering Bridge v2.0 */
export const PSI_H_WEIGHTS = {
    structural: 0.4,
    runtime: 0.6,
};
/** ΨH friction thresholds */
export const PSI_H_FRICTION_THRESHOLDS = {
    resonant: 0.2,
    working: 0.5,
    strained: 0.8,
    /** Above 0.8 = dissonant — composition is fighting itself */
    dissonant: 1.0,
};
/**
 * Create a fresh PsiHState with default settings.
 *
 * @param maxSize — Ring buffer capacity (default 20)
 * @param alpha — EWMA smoothing factor (default 0.15)
 */
export function createPsiHState(maxSize = 20, alpha = 0.15) {
    return {
        ringBuffer: [],
        maxSize,
        alpha,
        trend: undefined,
        baseline: undefined,
    };
}
/**
 * εR range thresholds per v3.0 spec.
 */
export const EPSILON_R_THRESHOLDS = {
    rigid: 0.0,
    stableMin: 0.01,
    stableMax: 0.1,
    adaptiveMin: 0.1,
    adaptiveMax: 0.3,
    /** Above 0.30 = unstable */
    unstable: 0.3,
};
/**
 * Classify εR value into a range.
 */
export function classifyEpsilonR(value) {
    if (value <= EPSILON_R_THRESHOLDS.rigid)
        return "rigid";
    if (value <= EPSILON_R_THRESHOLDS.stableMax)
        return "stable";
    if (value <= EPSILON_R_THRESHOLDS.adaptiveMax)
        return "adaptive";
    return "unstable";
}
/**
 * Maturity-indexed threshold tables per Engineering Bridge v2.0.
 */
export const MATURITY_THRESHOLDS = {
    young: {
        phiLHealthy: 0.6,
        phiLDegraded: 0.4,
        epsilonRStableMin: 0.1,
        epsilonRStableMax: 0.4,
        psiHDissonance: 0.25,
    },
    maturing: {
        phiLHealthy: 0.7,
        phiLDegraded: 0.5,
        epsilonRStableMin: 0.05,
        epsilonRStableMax: 0.3,
        psiHDissonance: 0.2,
    },
    mature: {
        phiLHealthy: 0.8,
        phiLDegraded: 0.6,
        epsilonRStableMin: 0.01,
        epsilonRStableMax: 0.15,
        psiHDissonance: 0.15,
    },
};
//# sourceMappingURL=state-dimensions.js.map