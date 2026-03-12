/**
 * Codex Signum — Rolled Throughput Yield (RTY) and %C&A Metrics
 *
 * RTY measures pipeline efficiency as the product of per-stage first-pass yields.
 * A RTY of 1.0 means every stage passed on the first attempt at full quality.
 * A RTY of 0.0 means at least one stage produced no usable output.
 *
 * %C&A (Percent Correct & Accurate) per stage = fraction of output accepted
 * without triggering a refinement loop.
 *
 * Origin: consumer agent/metrics/rty.ts.
 *
 * @module codex-signum-core/metrics/rty
 */
import type { StageResult } from "../patterns/dev-agent/types.js";
/**
 * A single stage execution attempt.
 *
 * refinementIteration tracks how many times this stage had to be re-run:
 *   0 = first-pass success (accepted without refinement loop)
 *   1+ = stage needed at least one refinement before being accepted
 */
export interface StageAttempt {
    stage: string;
    modelId: string;
    qualityScore: number;
    refinementIteration: number;
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
    /** Pipeline-level %C&A: fraction of stages with refinementIteration === 0. */
    overall: number;
}
/**
 * Convert StageResult[] to StageAttempt[] for RTY computation.
 *
 * refinementIteration is approximated from qualityScore:
 *   >= 0.5 → first-pass (0)
 *   <  0.5 → refinement needed (1)
 */
export declare function stageResultsToAttempts(stages: StageResult[]): StageAttempt[];
/**
 * Compute Rolled Throughput Yield (RTY) across pipeline stages.
 *
 * RTY = ∏ stageYield(s) for all stages s
 *
 * Per-stage yield:
 *   - First-pass (refinementIteration === 0): yield = qualityScore
 *   - Refinement needed (refinementIteration > 0): yield = qualityScore * 0.7
 *     (30% penalty for needing a re-run)
 */
export declare function computeRTY(attempts: StageAttempt[]): RtyResult;
/**
 * Compute %C&A (Percent Correct & Accurate) per pipeline stage.
 *
 * Per-stage %C&A:
 *   refinementIteration === 0: %C&A = qualityScore * 100
 *   refinementIteration >  0: %C&A = qualityScore * 50
 *
 * Overall %C&A = fraction of stages with refinementIteration === 0.
 */
export declare function computePercentCA(attempts: StageAttempt[]): PercentCAResult;
//# sourceMappingURL=rty.d.ts.map