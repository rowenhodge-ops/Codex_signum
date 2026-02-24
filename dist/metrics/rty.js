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
// ─── Conversion ──────────────────────────────────────────────────────────
/**
 * Convert StageResult[] to StageAttempt[] for RTY computation.
 *
 * correctionIteration is approximated from qualityScore:
 *   >= 0.5 → first-pass (0)
 *   <  0.5 → correction needed (1)
 */
export function stageResultsToAttempts(stages) {
    return stages.map((s) => ({
        stage: s.stage,
        modelId: s.modelId,
        qualityScore: s.qualityScore,
        correctionIteration: s.qualityScore >= 0.5 ? 0 : 1,
    }));
}
// ─── RTY ─────────────────────────────────────────────────────────────────
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
export function computeRTY(attempts) {
    if (attempts.length === 0) {
        return { rty: 1, stageYields: {} };
    }
    const stageYields = {};
    for (const a of attempts) {
        const yield_ = a.correctionIteration === 0 ? a.qualityScore : a.qualityScore * 0.7;
        stageYields[a.stage] = Math.max(0, Math.min(1, yield_));
    }
    const rty = Object.values(stageYields).reduce((product, y) => product * y, 1);
    return { rty, stageYields };
}
// ─── %C&A ────────────────────────────────────────────────────────────────
/**
 * Compute %C&A (Percent Correct & Accurate) per pipeline stage.
 *
 * Per-stage %C&A:
 *   correctionIteration === 0: %C&A = qualityScore * 100
 *   correctionIteration >  0: %C&A = qualityScore * 50
 *
 * Overall %C&A = fraction of stages with correctionIteration === 0.
 */
export function computePercentCA(attempts) {
    if (attempts.length === 0) {
        return { perStage: {}, overall: 100 };
    }
    const perStage = {};
    let firstPassCount = 0;
    for (const a of attempts) {
        if (a.correctionIteration === 0) {
            perStage[a.stage] = Math.round(a.qualityScore * 100);
            firstPassCount++;
        }
        else {
            perStage[a.stage] = Math.round(a.qualityScore * 50);
        }
    }
    const overall = attempts.length > 0
        ? Math.round((firstPassCount / attempts.length) * 100)
        : 100;
    return { perStage, overall };
}
//# sourceMappingURL=rty.js.map