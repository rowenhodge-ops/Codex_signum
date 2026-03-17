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
export declare function minEpsilonRForSpectralState(spectralRatio: number): number;
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
export declare function computeEpsilonRFloor(baseFloor?: number, imperativeGradient?: number, spectralRatio?: number, gradientSensitivity?: number): number;
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
/**
 * Check if εR exceeds the maturity-indexed stable range upper bound.
 * Used by M-22.7 (event-triggered structural review) as a trigger condition.
 *
 * | Maturity       | Upper bound |
 * | Young (<0.3)   | 0.40        |
 * | Maturing       | 0.30        |
 * | Mature (>0.7)  | 0.15        |
 */
export declare function isEpsilonRSpike(epsilonR: number, maturityIndex: number): boolean;
//# sourceMappingURL=epsilon-r.d.ts.map