/**
 * GATE stage — presents the plan and collects human approval.
 *
 * Every plan requires human gate approval in V1
 * (constitutional rule: mandatory_human_gate_initial = true).
 *
 * Uses readline for terminal interaction. Supports auto-gate mode
 * for automated/testing scenarios.
 *
 * Moved from DND-Manager agent/patterns/architect/gate.ts.
 * Verdict: GENERIC — no DND imports.
 */
import type { PlanState, GateResponse } from "./types.js";
export interface GateOptions {
    /** If true, automatically approve without prompting */
    autoApprove?: boolean;
}
export declare function gate(planState: PlanState, options?: GateOptions): Promise<GateResponse>;
//# sourceMappingURL=gate.d.ts.map