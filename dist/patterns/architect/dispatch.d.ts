/**
 * DISPATCH stage — feeds tasks to execution one at a time.
 *
 * Refactored from DND-Manager to accept a TaskExecutor interface
 * instead of using console.log stubs.
 *
 * Moved from DND-Manager agent/patterns/architect/dispatch.ts.
 * Verdict: GENERIC — refactored to use TaskExecutor injection.
 */
import type { PlanState, TaskExecutor } from "./types.js";
export interface DispatchOptions {
    repoPath: string;
    dryRun?: boolean;
}
export declare function dispatch(planState: PlanState, taskExecutor: TaskExecutor, options?: DispatchOptions): Promise<PlanState>;
//# sourceMappingURL=dispatch.d.ts.map