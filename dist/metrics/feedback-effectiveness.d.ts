/**
 * Codex Signum — Feedback Effectiveness Metric
 *
 * Measures how well the correction loop is working.
 * effectiveness = improved_stages / corrected_stages
 *
 * - A "corrected stage" is one that triggered the correction loop (qualityScore < 0.5)
 * - An "improved stage" is a corrected stage whose final qualityScore ended >= 0.5
 * - If no corrections occurred, effectiveness = 1.0 (nothing needed fixing)
 * - Low effectiveness (< 0.3) signals the correction loop isn't helping
 *
 * Ported from DND-Manager agent/metrics/feedback-effectiveness.ts.
 *
 * @module codex-signum-core/metrics/feedback-effectiveness
 */
import type { StageResult } from "../patterns/dev-agent/types.js";
export interface FeedbackEffectivenessResult {
    /** Ratio of improved corrected stages to total corrected stages. [0, 1] */
    effectiveness: number;
    /** Number of stages that triggered correction loops */
    correctedStages: number;
    /** Number of corrected stages that improved to >= 0.5 */
    improvedStages: number;
}
export declare function computeFeedbackEffectiveness(stages: StageResult[], correctionCount: number): FeedbackEffectivenessResult;
//# sourceMappingURL=feedback-effectiveness.d.ts.map