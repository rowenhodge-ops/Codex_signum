// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
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
        // Execute via injected TaskExecutor
        const context = {
            repoPath: options?.repoPath ?? "",
            dryRun: options?.dryRun ?? false,
            previousOutcomes: outcomes,
            planId: planState.plan_id,
            intent: planState.intent,
        };
        try {
            const outcome = await taskExecutor.execute(task, context);
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
function checkDependencies(taskId, dependencies, outcomes) {
    const requiredDeps = dependencies
        .filter((d) => d.to === taskId && d.type === "hard")
        .map((d) => d.from);
    return requiredDeps.every((depId) => outcomes.some((o) => o.task_id === depId && o.success));
}
//# sourceMappingURL=dispatch.js.map