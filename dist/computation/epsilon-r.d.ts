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
import type { EpsilonR } from "../types/state-dimensions.js";
/**
 * Compute εR from decision history.
 *
 * @param exploratoryDecisions — Number of exploratory decisions in the window
 * @param totalDecisions — Total decisions in the window
 * @param floor — Minimum εR floor (from imperative gradients / spectral calibration)
 */
export declare function computeEpsilonR(exploratoryDecisions: number, totalDecisions: number, floor?: number): EpsilonR;
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
export declare function computeEpsilonRFloor(baseFloor?: number, imperativeGradient?: number): number;
/**
 * Check if εR is in a warning state.
 *
 * WARNING conditions:
 * - εR = 0 with active pattern → Constitutional violation
 * - εR > 0.3 for non-young network → Instability risk
 * - High ΦL + low εR → Over-optimization, needs exploration
 */
export declare function checkEpsilonRWarnings(epsilonR: EpsilonR, phiLEffective: number, isPatternActive: boolean): Array<{
    level: "warning" | "critical";
    message: string;
}>;
//# sourceMappingURL=epsilon-r.d.ts.map