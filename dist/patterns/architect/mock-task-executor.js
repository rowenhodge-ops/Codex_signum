/**
 * Mock TaskExecutor — simulates task execution for testing.
 *
 * Records all executed tasks for test assertions and supports
 * configurable failure injection.
 */
export function createMockTaskExecutor(options = {}) {
    const { failingTasks = [], latencyMs = 20, executionLog = [], } = options;
    return {
        async execute(task, context) {
            await new Promise((r) => setTimeout(r, latencyMs));
            // Record execution for test assertions
            executionLog.push({ task, context, timestamp: Date.now() });
            // Dry run mode
            if (context.dryRun) {
                return {
                    task_id: task.task_id,
                    success: true,
                    output: `[DRY RUN] ${task.title}`,
                    adaptations_applied: 0,
                };
            }
            // Simulate failure for specified tasks
            if (failingTasks.includes(task.task_id)) {
                return {
                    task_id: task.task_id,
                    success: false,
                    error: `Mock failure for ${task.task_id}: simulated compilation error`,
                    adaptations_applied: 0,
                };
            }
            return {
                task_id: task.task_id,
                success: true,
                output: `[MOCK] Executed: ${task.title} (${task.type}, ${task.estimated_complexity})`,
                adaptations_applied: 0,
            };
        },
    };
}
//# sourceMappingURL=mock-task-executor.js.map