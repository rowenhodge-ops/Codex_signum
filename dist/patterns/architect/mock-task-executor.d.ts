/**
 * Mock TaskExecutor — simulates task execution for testing.
 *
 * Records all executed tasks for test assertions and supports
 * configurable failure injection.
 */
import type { Task, TaskExecutor, TaskExecutionContext } from "./types.js";
export interface MockTaskExecutorOptions {
    /** Tasks that should fail (by task_id) */
    failingTasks?: string[];
    /** Artificial latency in ms per task (default: 20) */
    latencyMs?: number;
    /** Record of all executed tasks (for test assertions) */
    executionLog?: Array<{
        task: Task;
        context: TaskExecutionContext;
        timestamp: number;
    }>;
}
export declare function createMockTaskExecutor(options?: MockTaskExecutorOptions): TaskExecutor;
//# sourceMappingURL=mock-task-executor.d.ts.map