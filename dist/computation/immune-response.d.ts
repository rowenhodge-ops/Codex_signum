import type { TriggerInputState, TriggeredEvent } from "./structural-triggers.js";
import type { StructuralReviewResult } from "./structural-review.js";
/**
 * The immune response: check triggers, run review if needed.
 *
 * Usage:
 * ```
 * const result = await evaluateAndReviewIfNeeded(triggerState);
 * if (result) {
 *   // structural issues detected — result contains diagnostics
 *   // feed into Scale 2/3 feedback topology
 * }
 * ```
 *
 * @param state — Current trigger input values (caller assembles from live system)
 * @returns StructuralReviewResult if any trigger fired, null if system is healthy
 */
export declare function evaluateAndReviewIfNeeded(state: TriggerInputState): Promise<{
    triggers: TriggeredEvent[];
    review: StructuralReviewResult;
} | null>;
//# sourceMappingURL=immune-response.d.ts.map