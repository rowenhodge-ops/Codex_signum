// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/** Minimum confidence for mechanical classification to use DevAgent path */
export const MECHANICAL_CONFIDENCE_THRESHOLD = 0.6;
// Registry of deterministic executors
const deterministicExecutors = [];
/**
 * Register a DeterministicExecutor for handling structured data transforms.
 * Executors are checked in registration order — first match wins.
 */
export function registerDeterministicExecutor(executor) {
    deterministicExecutors.push(executor);
}
/**
 * Clear all registered deterministic executors.
 * Primarily for testing — resets the registry between test runs.
 */
export function clearDeterministicExecutors() {
    deterministicExecutors.length = 0;
}
/**
 * Get the count of registered deterministic executors.
 */
export function getDeterministicExecutorCount() {
    return deterministicExecutors.length;
}
export async function dispatch(planState, taskExecutor, options) {
    const { task_graph, execution_plan } = planState;
    if (!task_graph || !execution_plan) {
        throw new Error("Cannot dispatch — no execution plan");
    }
    const updatedState = { ...planState, status: "executing" };
    const outcomes = [];
    for (const taskId of execution_plan.ordered_tasks) {
        const task = task_graph.tasks.find((t) => t.task_id === taskId);
        if (!task)
            continue;
        // Check dependencies
        const depsOk = checkDependencies(taskId, task_graph.dependencies, outcomes);
        if (!depsOk) {
            outcomes.push({
                task_id: taskId,
                success: false,
                error: "Unmet dependencies",
                adaptations_applied: 0,
            });
            continue;
        }
        // Build execution context
        const context = {
            repoPath: options?.repoPath ?? "",
            dryRun: options?.dryRun ?? false,
            previousOutcomes: outcomes,
            planId: planState.plan_id,
            intent: planState.intent,
        };
        try {
            const outcome = await dispatchTask(task, taskExecutor, context);
            outcomes.push(outcome);
        }
        catch (error) {
            outcomes.push({
                task_id: taskId,
                success: false,
                error: error.message,
                adaptations_applied: 0,
            });
        }
    }
    return {
        ...updatedState,
        task_outcomes: outcomes,
        status: "completed",
        updated_at: new Date().toISOString(),
    };
}
/**
 * Route a single task to the appropriate executor based on classification.
 */
async function dispatchTask(task, taskExecutor, context) {
    const classification = task.classification ?? {
        type: task.type,
        confidence: 1.0,
        signals: [],
        layer: "default",
    };
    // Route 1: Deterministic — no LLM
    if (classification.type === "deterministic") {
        const executor = deterministicExecutors.find((e) => e.canHandle(task));
        if (executor) {
            return executor.execute(task, context);
        }
        // No registered executor — fall through to generative
    }
    // Route 2 & 3: Both go through TaskExecutor (consumer decides internal routing)
    // The classification is available on the task for the executor to inspect
    return taskExecutor.execute(task, context);
}
function checkDependencies(taskId, dependencies, outcomes) {
    const requiredDeps = dependencies
        .filter((d) => d.to === taskId && d.type === "hard")
        .map((d) => d.from);
    return requiredDeps.every((depId) => outcomes.some((o) => o.task_id === depId && o.success));
}
//# sourceMappingURL=dispatch.js.map