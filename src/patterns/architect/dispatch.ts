// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * DISPATCH stage — three-way task routing.
 *
 * 1. Deterministic tasks → registered DeterministicExecutor (no LLM)
 * 2. Mechanical tasks (confidence ≥ threshold) → TaskExecutor (DevAgent path)
 * 3. Generative tasks → TaskExecutor (LLM path, default)
 *
 * Deterministic tasks that have no registered executor fall back to generative.
 */

import type {
  PlanState,
  TaskOutcome,
  TaskExecutor,
  TaskExecutionContext,
  DeterministicExecutor,
  Task,
  ClassificationResult,
} from "./types.js";

export interface DispatchOptions {
  repoPath: string;
  dryRun?: boolean;
}

/** Minimum confidence for mechanical classification to use DevAgent path */
export const MECHANICAL_CONFIDENCE_THRESHOLD = 0.6;

// Registry of deterministic executors
const deterministicExecutors: DeterministicExecutor[] = [];

/**
 * Register a DeterministicExecutor for handling structured data transforms.
 * Executors are checked in registration order — first match wins.
 */
export function registerDeterministicExecutor(
  executor: DeterministicExecutor,
): void {
  deterministicExecutors.push(executor);
}

/**
 * Clear all registered deterministic executors.
 * Primarily for testing — resets the registry between test runs.
 */
export function clearDeterministicExecutors(): void {
  deterministicExecutors.length = 0;
}

/**
 * Get the count of registered deterministic executors.
 */
export function getDeterministicExecutorCount(): number {
  return deterministicExecutors.length;
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

    // Build execution context
    const context: TaskExecutionContext = {
      repoPath: options?.repoPath ?? "",
      dryRun: options?.dryRun ?? false,
      previousOutcomes: outcomes,
      planId: planState.plan_id,
      intent: planState.intent,
    };

    try {
      const outcome = await dispatchTask(task, taskExecutor, context);
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

/**
 * Route a single task to the appropriate executor based on classification.
 */
async function dispatchTask(
  task: Task,
  taskExecutor: TaskExecutor,
  context: TaskExecutionContext,
): Promise<TaskOutcome> {
  const classification: ClassificationResult = task.classification ?? {
    type: task.type,
    confidence: 1.0,
    signals: [],
    layer: "default" as const,
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
