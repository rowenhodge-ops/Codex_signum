/**
 * Mock ModelExecutor — returns pre-built TaskGraph JSON for testing.
 * Enables full pipeline execution without API keys.
 *
 * The response format matches what core's decompose() parseTaskGraph() expects:
 * - tasks array with task_id, title, description, phase (minimum required)
 * - phases array with phase_id, title, tasks
 * - dependencies array
 * - estimated_total_effort string
 * - assumptions array
 */
import type { ModelExecutor } from "./types.js";
export interface MockModelExecutorOptions {
    /** Number of tasks to generate (default: 3) */
    taskCount?: number;
    /** Whether to simulate LLM failure (default: false) */
    simulateFailure?: boolean;
    /** Artificial latency in ms (default: 50) */
    latencyMs?: number;
    /** Custom response text (overrides auto-generation) */
    customResponse?: string;
}
export declare function createMockModelExecutor(options?: MockModelExecutorOptions): ModelExecutor;
//# sourceMappingURL=mock-model-executor.d.ts.map