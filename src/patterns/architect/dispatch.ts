// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * DISPATCH stage — feeds tasks to execution one at a time.
 *
 * Refactored from DND-Manager to accept a TaskExecutor interface
 * instead of using console.log stubs.
 *
 * Moved from DND-Manager agent/patterns/architect/dispatch.ts.
 * Verdict: GENERIC — refactored to use TaskExecutor injection.
 */

import type {
  PlanState,
  TaskOutcome,
  TaskExecutor,
  TaskExecutionContext,
} from "./types.js";

export interface DispatchOptions {
  repoPath: string;
  dryRun?: boolean;
}

export async function dispatch(
  planState: PlanState,
  taskExecutor: TaskExecutor,
  options?: DispatchOptions,
): Promise<PlanState> {
  const { task_graph, execution_plan } = planState;
  if (!task_graph || !execution_plan) {
    throw new Error("Cannot dispatch — no execution plan");
  }

  const updatedState = { ...planState, status: "executing" as const };
  const outcomes: TaskOutcome[] = [];

  for (const taskId of execution_plan.ordered_tasks) {
    const task = task_graph.tasks.find((t) => t.task_id === taskId);
    if (!task) continue;

    // Check dependencies
    const depsOk = checkDependencies(
      taskId,
      task_graph.dependencies,
      outcomes,
    );
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
    const context: TaskExecutionContext = {
      repoPath: options?.repoPath ?? "",
      dryRun: options?.dryRun ?? false,
      previousOutcomes: outcomes,
      planId: planState.plan_id,
      intent: planState.intent,
    };

    try {
      const outcome = await taskExecutor.execute(task, context);
      outcomes.push(outcome);
    } catch (error) {
      outcomes.push({
        task_id: taskId,
        success: false,
        error: (error as Error).message,
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

function checkDependencies(
  taskId: string,
  dependencies: Array<{ from: string; to: string; type: string }>,
  outcomes: TaskOutcome[],
): boolean {
  const requiredDeps = dependencies
    .filter((d) => d.to === taskId && d.type === "hard")
    .map((d) => d.from);

  return requiredDeps.every((depId) =>
    outcomes.some((o) => o.task_id === depId && o.success),
  );
}
