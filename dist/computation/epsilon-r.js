/**
 * Codex Signum — εR Computation (Exploration Rate)
 *
 * εR measures the fraction of decisions that sample uncertain alternatives
 * rather than exploiting known-best options. High ΦL with zero εR is a WARNING.
 *
 * Key principle: εR must never be exactly 0 for active patterns.
 *
 * @see codex-signum-v3.0.md §εR
 * @see engineering-bridge-v2.0.md §Part 2 "εR"
 * @module codex-signum-core/computation/epsilon-r
 */
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
 * Compute the εR floor from imperative gradients.
 *
 * The floor prevents εR from collapsing to zero even when
 * the Thompson Router is exploiting a dominant arm.
 *
 * εR_floor = max(0.01, baseFloor × imperativeGradient)
 *
 * @param baseFloor — Default minimum (0.01 per spec)
 * @param imperativeGradient — How strongly meta-imperatives are pushing for exploration
 *   (1.0 = normal, >1.0 = increased pressure from Ω₃ Increase Understanding)
 */
export function computeEpsilonRFloor(baseFloor = 0.01, imperativeGradient = 1.0) {
    return Math.max(0.01, baseFloor * Math.max(0, imperativeGradient));
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
//# sourceMappingURL=epsilon-r.js.map