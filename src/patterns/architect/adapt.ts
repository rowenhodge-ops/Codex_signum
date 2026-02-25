/**
 * ADAPT stage — handles failures by classifying scope and producing
 * replanning instructions.
 *
 * Foundation implementation classifies scope (task/phase/plan) but
 * does not yet trigger full replanning loops.
 *
 * Moved from DND-Manager agent/patterns/architect/adapt.ts.
 * Verdict: GENERIC — no DND imports.
 */

import type { PlanState, TaskOutcome, AdaptationScope } from "./types.js";
import { MAX_ADAPTATIONS_PER_PLAN } from "./types.js";

export interface AdaptationResult {
  scope: AdaptationScope;
  action: string;
  modified_plan?: PlanState;
  should_halt: boolean;
}

export function adapt(
  planState: PlanState,
  failedOutcome: TaskOutcome,
): AdaptationResult {
  const adaptCount = planState.adaptations_count + 1;

  // Constitutional rule: max adaptations per plan
  if (adaptCount > MAX_ADAPTATIONS_PER_PLAN) {
    return {
      scope: "plan",
      action:
        "Plan exceeded maximum adaptations. Human intervention required.",
      should_halt: true,
    };
  }

  const scope = classifyScope(failedOutcome, planState);

  switch (scope) {
    case "task":
      return {
        scope: "task",
        action: `Retry task ${failedOutcome.task_id} with modified parameters`,
        modified_plan: {
          ...planState,
          adaptations_count: adaptCount,
          updated_at: new Date().toISOString(),
        },
        should_halt: false,
      };
    case "phase":
      return {
        scope: "phase",
        action: `Re-decompose remaining tasks in current phase`,
        modified_plan: {
          ...planState,
          adaptations_count: adaptCount,
          status: "decomposing",
          updated_at: new Date().toISOString(),
        },
        should_halt: false,
      };
    case "plan":
      return {
        scope: "plan",
        action: `Full re-survey and re-decompose required`,
        modified_plan: {
          ...planState,
          adaptations_count: adaptCount,
          status: "surveying",
          updated_at: new Date().toISOString(),
        },
        should_halt: false,
      };
  }
}

function classifyScope(
  outcome: TaskOutcome,
  planState: PlanState,
): AdaptationScope {
  // Heuristics for scope classification:
  // - Single task, first failure → task-level retry
  // - Task failed twice → phase-level replan
  // - Multiple tasks in same phase failed → phase-level
  // - Fundamental assumption wrong → plan-level

  const previousFailures = planState.task_outcomes.filter(
    (o) => o.task_id === outcome.task_id && !o.success,
  ).length;

  if (previousFailures >= 2) return "phase";

  const phaseFailures = planState.task_outcomes.filter((o) => {
    const task = planState.task_graph?.tasks.find(
      (t) => t.task_id === o.task_id,
    );
    const failedTask = planState.task_graph?.tasks.find(
      (t) => t.task_id === outcome.task_id,
    );
    return task?.phase === failedTask?.phase && !o.success;
  }).length;

  if (phaseFailures >= 3) return "plan";
  if (phaseFailures >= 1) return "phase";

  return "task";
}
