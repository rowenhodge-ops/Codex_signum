// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
// ============ SPEC VALUES ============
// From v3.0 §State Dimensions and Engineering Bridge §Part 2:
//
// | Threshold         | Young (MI < 0.3) | Maturing (0.3–0.7) | Mature (MI > 0.7) |
// |-------------------|------------------|---------------------|-------------------|
// | ΦL healthy        | > 0.6            | > 0.7               | > 0.8             |
// | ΦL degraded       | < 0.4            | < 0.5               | < 0.6             |
// | εR stable range   | 0.10–0.40        | 0.05–0.30           | 0.01–0.15         |
// | ΨH dissonance     | > 0.25           | > 0.20              | > 0.15            |
const YOUNG = {
    phiL_healthy: 0.6,
    phiL_degraded: 0.4,
    epsilonR_stable: { min: 0.10, max: 0.40 },
    psiH_dissonance: 0.25,
};
const MATURING = {
    phiL_healthy: 0.7,
    phiL_degraded: 0.5,
    epsilonR_stable: { min: 0.05, max: 0.30 },
    psiH_dissonance: 0.20,
};
const MATURE = {
    phiL_healthy: 0.8,
    phiL_degraded: 0.6,
    epsilonR_stable: { min: 0.01, max: 0.15 },
    psiH_dissonance: 0.15,
};
// ============ INTERPOLATION ============
/** Anchor points — centers of each band */
const YOUNG_ANCHOR = 0.15;
const MATURING_ANCHOR = 0.5;
const MATURE_ANCHOR = 0.85;
/** Linear interpolation clamped to [0, 1] */
function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
}
/** Interpolate between two threshold sets */
function lerpThresholds(a, b, t) {
    return {
        phiL_healthy: lerp(a.phiL_healthy, b.phiL_healthy, t),
        phiL_degraded: lerp(a.phiL_degraded, b.phiL_degraded, t),
        epsilonR_stable: {
            min: lerp(a.epsilonR_stable.min, b.epsilonR_stable.min, t),
            max: lerp(a.epsilonR_stable.max, b.epsilonR_stable.max, t),
        },
        psiH_dissonance: lerp(a.psiH_dissonance, b.psiH_dissonance, t),
    };
}
// ============ COMPUTATION ============
/**
 * Resolve thresholds from a maturity index value.
 *
 * Linear interpolation between band anchor points for smooth transitions.
 * Band anchors are at MI = 0.15 (young center), 0.5 (maturing center), 0.85 (mature center).
 * Below 0.15 → young values. Above 0.85 → mature values.
 * Between anchors → linear interpolation.
 */
export function getThresholds(maturityIndex) {
    if (maturityIndex <= YOUNG_ANCHOR) {
        return { ...YOUNG, epsilonR_stable: { ...YOUNG.epsilonR_stable } };
    }
    if (maturityIndex >= MATURE_ANCHOR) {
        return { ...MATURE, epsilonR_stable: { ...MATURE.epsilonR_stable } };
    }
    if (maturityIndex <= MATURING_ANCHOR) {
        // Interpolate young → maturing
        const t = (maturityIndex - YOUNG_ANCHOR) / (MATURING_ANCHOR - YOUNG_ANCHOR);
        return lerpThresholds(YOUNG, MATURING, t);
    }
    // Interpolate maturing → mature
    const t = (maturityIndex - MATURING_ANCHOR) / (MATURE_ANCHOR - MATURING_ANCHOR);
    return lerpThresholds(MATURING, MATURE, t);
}
/**
 * Classify a ΦL value against maturity-indexed thresholds.
 * Returns 'healthy', 'degraded', or 'intermediate'.
 */
export function classifyPhiLHealth(phiL_effective, maturityIndex) {
    const thresholds = getThresholds(maturityIndex);
    if (phiL_effective >= thresholds.phiL_healthy)
        return "healthy";
    if (phiL_effective <= thresholds.phiL_degraded)
        return "degraded";
    return "intermediate";
}
/**
 * Classify εR value against maturity-indexed thresholds.
 * Returns 'rigid', 'stable', 'adaptive', or 'unstable'.
 */
export function classifyEpsilonRAdaptive(epsilonR, maturityIndex) {
    const thresholds = getThresholds(maturityIndex);
    if (epsilonR <= 0)
        return "rigid";
    if (epsilonR >= thresholds.epsilonR_stable.min && epsilonR <= thresholds.epsilonR_stable.max) {
        return "stable";
    }
    if (epsilonR < thresholds.epsilonR_stable.min)
        return "rigid";
    // Above stable max but below some unstable threshold
    // If it's only slightly above, it's adaptive. If way above, it's unstable.
    // Use 2× stable max as the unstable boundary (consistent with εR spike trigger)
    if (epsilonR <= 2 * thresholds.epsilonR_stable.max)
        return "adaptive";
    return "unstable";
}
/**
 * Check if ΨH indicates dissonance at the current maturity level.
 */
export function isDissonant(psiH_combined, maturityIndex) {
    const thresholds = getThresholds(maturityIndex);
    return psiH_combined > thresholds.psiH_dissonance;
}
//# sourceMappingURL=adaptive-thresholds.js.map