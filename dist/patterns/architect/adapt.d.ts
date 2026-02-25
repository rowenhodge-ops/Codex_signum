/**
 * ADAPT stage — handles failures by classifying scope and producing
 * replanning instructions.
 *
 * Foundation implementation classifies scope (task/phase/plan) but
 * does not yet trigger full replanning loops.
 *
 * Moved from DND-Manager agent/patterns/architect/adapt.ts.
 * Verdict: GENERIC — no DND imports.
 */
import type { PlanState, TaskOutcome, AdaptationScope } from "./types.js";
export interface AdaptationResult {
    scope: AdaptationScope;
    action: string;
    modified_plan?: PlanState;
    should_halt: boolean;
}
export declare function adapt(planState: PlanState, failedOutcome: TaskOutcome): AdaptationResult;
//# sourceMappingURL=adapt.d.ts.map