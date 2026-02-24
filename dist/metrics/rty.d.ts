/**
 * Codex Signum — Rolled Throughput Yield (RTY) and %C&A Metrics
 *
 * RTY measures pipeline efficiency as the product of per-stage first-pass yields.
 * A RTY of 1.0 means every stage passed on the first attempt at full quality.
 * A RTY of 0.0 means at least one stage produced no usable output.
 *
 * %C&A (Percent Correct & Accurate) per stage = fraction of output accepted
 * without triggering a correction loop.
 *
 * Ported from DND-Manager agent/metrics/rty.ts.
 *
 * @module codex-signum-core/metrics/rty
 */
import type { StageResult } from "../patterns/dev-agent/types.js";
/**
 * A single stage execution attempt.
 *
 * correctionIteration tracks how many times this stage had to be re-run:
 *   0 = first-pass success (accepted without correction loop)
 *   1+ = stage needed at least one correction before being accepted
 */
export interface StageAttempt {
    stage: string;
    modelId: string;
    qualityScore: number;
    correctionIteration: number;
}
export interface RtyResult {
    /** Product of all per-stage yields. Range: [0, 1]. */
    rty: number;
    /** Per-stage yield values. Map of stage name → yield [0, 1]. */
    stageYields: Record<string, number>;
}
export interface PercentCAResult {
    /** Per-stage %C&A. Map of stage name → 0–100. */
    perStage: Record<string, number>;
    /** Pipeline-level %C&A: fraction of stages with correctionIteration === 0. */
    overall: number;
}
/**
 * Convert StageResult[] to StageAttempt[] for RTY computation.
 *
 * correctionIteration is approximated from qualityScore:
 *   >= 0.5 → first-pass (0)
 *   <  0.5 → correction needed (1)
 */
export declare function stageResultsToAttempts(stages: StageResult[]): StageAttempt[];
/**
 * Compute Rolled Throughput Yield (RTY) across pipeline stages.
 *
 * RTY = ∏ stageYield(s) for all stages s
 *
 * Per-stage yield:
 *   - First-pass (correctionIteration === 0): yield = qualityScore
 *   - Correction needed (correctionIteration > 0): yield = qualityScore * 0.7
 *     (30% penalty for needing a re-run)
 */
export declare function computeRTY(attempts: StageAttempt[]): RtyResult;
/**
 * Compute %C&A (Percent Correct & Accurate) per pipeline stage.
 *
 * Per-stage %C&A:
 *   correctionIteration === 0: %C&A = qualityScore * 100
 *   correctionIteration >  0: %C&A = qualityScore * 50
 *
 * Overall %C&A = fraction of stages with correctionIteration === 0.
 */
export declare function computePercentCA(attempts: StageAttempt[]): PercentCAResult;
//# sourceMappingURL=rty.d.ts.map