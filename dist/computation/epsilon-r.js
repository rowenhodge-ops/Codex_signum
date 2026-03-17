// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { classifyEpsilonR, EPSILON_R_THRESHOLDS, } from "../types/state-dimensions.js";
// ============ CORE COMPUTATION ============
/**
 * Compute εR from decision history.
 *
 * @param exploratoryDecisions — Number of exploratory decisions in the window
 * @param totalDecisions — Total decisions in the window
 * @param floor — Minimum εR floor (from imperative gradients / spectral calibration)
 */
export function computeEpsilonR(exploratoryDecisions, totalDecisions, floor = EPSILON_R_THRESHOLDS.stableMin) {
    let value;
    if (totalDecisions === 0) {
        // No decisions yet — default to adaptive range midpoint
        value = 0.15;
    }
    else {
        value = exploratoryDecisions / totalDecisions;
    }
    // Enforce floor — εR must never be exactly 0 for active patterns
    value = Math.max(value, floor);
    return {
        value,
        range: classifyEpsilonR(value),
        exploratoryDecisions,
        totalDecisions,
        floor,
        computedAt: new Date(),
    };
}
/**
 * Spectral calibration table (Engineering Bridge §Part 2).
 *
 * Maps spectral ratio to minimum εR floor.
 * Higher spectral concentration → more mandatory exploration.
 *
 * | Spectral Ratio | Minimum εR |
 * |     > 0.9      |    0.05    |
 * |   0.7 – 0.9    |    0.02    |
 * |   0.5 – 0.7    |    0.01    |
 * |     < 0.5      |    0.0     |
 */
export function minEpsilonRForSpectralState(spectralRatio) {
    if (spectralRatio > 0.9)
        return 0.05;
    if (spectralRatio >= 0.7)
        return 0.02;
    if (spectralRatio >= 0.5)
        return 0.01;
    return 0.0;
}
/**
 * Compute the εR floor from imperative gradients and spectral calibration.
 *
 * The floor prevents εR from collapsing to zero even when
 * the Thompson Router is exploiting a dominant arm.
 *
 * εR_floor = max(
 *   base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient)),
 *   min_εR_for_spectral_state(spectral_ratio)
 * )
 *
 * @param baseFloor — Default minimum (0.01 per spec)
 * @param imperativeGradient — Ω_aggregate_gradient. Negative = declining health → more exploration.
 *   (1.0 = normal, >1.0 = increased pressure from Ω₃ Increase Understanding)
 * @param spectralRatio — Optional spectral concentration ratio (0-1). Higher = more concentrated.
 * @param gradientSensitivity — How strongly negative gradients inflate the floor (default 0.1)
 */
export function computeEpsilonRFloor(baseFloor = 0.01, imperativeGradient = 1.0, spectralRatio, gradientSensitivity = 0.1) {
    // Gradient-based floor: base + sensitivity × max(0, -gradient)
    const gradientFloor = baseFloor +
        gradientSensitivity * Math.max(0, -imperativeGradient);
    // Spectral calibration floor (if ratio provided)
    const spectralFloor = spectralRatio !== undefined
        ? minEpsilonRForSpectralState(spectralRatio)
        : 0;
    // Absolute minimum floor of 0.01 — εR must never fully collapse for active patterns
    return Math.max(gradientFloor, spectralFloor, 0.01);
}
/**
 * Check if εR is in a warning state.
 *
 * WARNING conditions:
 * - εR = 0 with active pattern → Constitutional violation
 * - εR > 0.3 for non-young network → Instability risk
 * - High ΦL + low εR → Over-optimization, needs exploration
 */
export function checkEpsilonRWarnings(epsilonR, phiLEffective, isPatternActive) {
    const warnings = [];
    // Critical: zero εR on active pattern
    if (epsilonR.value === 0 && isPatternActive) {
        warnings.push({
            level: "critical",
            message: "εR is exactly 0 on active pattern. Constitutional violation (Axiom 5).",
        });
    }
    // Warning: high ΦL + low εR = over-optimization
    if (phiLEffective > 0.8 && epsilonR.value < 0.02) {
        warnings.push({
            level: "warning",
            message: `High ΦL (${phiLEffective.toFixed(2)}) with near-zero εR (${epsilonR.value.toFixed(3)}). Over-optimized — increase exploration.`,
        });
    }
    // Warning: unstable εR
    if (epsilonR.range === "unstable") {
        warnings.push({
            level: "warning",
            message: `εR is unstable (${epsilonR.value.toFixed(2)} > 0.30). Too much exploration — decisions are inconsistent.`,
        });
    }
    return warnings;
}
/**
 * Check if εR exceeds the maturity-indexed stable range upper bound.
 * Used by M-22.7 (event-triggered structural review) as a trigger condition.
 *
 * | Maturity       | Upper bound |
 * | Young (<0.3)   | 0.40        |
 * | Maturing       | 0.30        |
 * | Mature (>0.7)  | 0.15        |
 */
export function isEpsilonRSpike(epsilonR, maturityIndex) {
    const upperBound = maturityIndex > 0.7 ? 0.15
        : maturityIndex > 0.3 ? 0.30
            : 0.40;
    return epsilonR > upperBound;
}
//# sourceMappingURL=epsilon-r.js.map