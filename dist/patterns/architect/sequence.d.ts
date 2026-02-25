/**
 * SEQUENCE stage — produces an execution order via topological sort.
 *
 * Uses Kahn's algorithm for topological sorting with secondary ordering
 * by complexity (ascending). Detects circular dependencies.
 *
 * Moved from DND-Manager agent/patterns/architect/sequence.ts.
 * Verdict: GENERIC — pure computation, no DND imports.
 */
import type { TaskGraph, ExecutionPlan } from "./types.js";
export declare function sequence(taskGraph: TaskGraph): ExecutionPlan;
//# sourceMappingURL=sequence.d.ts.map