// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Architect Pattern
 *
 * Tests for G-8 architect pipeline stages:
 * - Type exports (ModelExecutor, TaskExecutor, pipeline types)
 * - CLASSIFY stage
 * - SEQUENCE stage
 * - GATE stage (auto-approve mode)
 * - DISPATCH stage (with mock TaskExecutor)
 * - ADAPT stage
 */
import { describe, expect, it } from "vitest";
import {
  classify,
  sequence,
  gate,
  adapt,
  dispatch,
  MAX_ADAPTATIONS_PER_PLAN,
} from "../../src/patterns/architect/index.js";
import type {
  Task,
  TaskGraph,
  Phase,
  ExecutionPlan,
  PlanState,
  TaskOutcome,
  ModelExecutor,
  TaskExecutor,
  TaskExecutionContext,
} from "../../src/patterns/architect/index.js";

// ============ HELPERS ============

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    task_id: "t1",
    title: "Test task",
    description: "A test task",
    acceptance_criteria: ["Task completes"],
    type: "generative",
    phase: "phase_1",
    estimated_complexity: "medium",
    files_affected: [],
    specification_refs: [],
    verification: "npx tsc --noEmit",
    commit_message: "test: add task",
    ...overrides,
  };
}

function makeTaskGraph(
  tasks: Task[],
  dependencies: TaskGraph["dependencies"] = [],
  phases?: Phase[],
): TaskGraph {
  const phaseIds = [...new Set(tasks.map((t) => t.phase))];
  return {
    intent_id: "test-intent",
    tasks,
    dependencies,
    phases: phases ?? phaseIds.map((pid) => ({
      phase_id: pid,
      title: `Phase ${pid}`,
      description: "",
      tasks: tasks.filter((t) => t.phase === pid).map((t) => t.task_id),
      gate: "human" as const,
      gate_criteria: "Human reviews",
    })),
    estimated_total_effort: "medium",
    decomposition_confidence: 0.8,
    assumptions: [],
  };
}

function makePlanState(overrides: Partial<PlanState> = {}): PlanState {
  return {
    plan_id: "plan-1",
    intent: "Test intent",
    status: "executing",
    task_outcomes: [],
    adaptations_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============ TYPE TESTS ============

describe("Type exports", () => {
  it("ModelExecutor interface is exported and usable", () => {
    const mock: ModelExecutor = {
      execute: async (prompt: string) => ({
        text: "response",
        modelId: "test-model",
        durationMs: 100,
      }),
    };
    expect(mock.execute).toBeDefined();
  });

  it("TaskExecutor interface is exported and usable", () => {
    const mock: TaskExecutor = {
      execute: async (task: Task, _ctx: TaskExecutionContext) => ({
        task_id: task.task_id,
        success: true,
        adaptations_applied: 0,
      }),
    };
    expect(mock.execute).toBeDefined();
  });

  it("Task, TaskGraph, Phase, ExecutionPlan types are exported", () => {
    const task: Task = makeTask();
    expect(task.task_id).toBe("t1");

    const graph: TaskGraph = makeTaskGraph([task]);
    expect(graph.intent_id).toBe("test-intent");

    const phase: Phase = graph.phases[0];
    expect(phase.phase_id).toBe("phase_1");

    const plan: ExecutionPlan = {
      intent_id: "test",
      ordered_tasks: ["t1"],
      phase_boundaries: {},
      critical_path: ["t1"],
      estimated_duration: "~15 minutes",
    };
    expect(plan.ordered_tasks.length).toBe(1);
  });
});

// ============ CLASSIFY TESTS ============

describe("classify", () => {
  it("tasks with file operation keywords → mechanical", () => {
    const tasks = [
      makeTask({
        task_id: "t1",
        title: "Rename old module",
        description: "Rename the module to new name",
      }),
      makeTask({
        task_id: "t2",
        title: "Delete unused imports",
        description: "Remove unused import statements",
      }),
      makeTask({
        task_id: "t3",
        title: "Move file to new location",
        description: "Move the component file",
      }),
    ];
    const graph = makeTaskGraph(tasks);
    const result = classify(graph);

    expect(result.tasks[0].type).toBe("mechanical");
    expect(result.tasks[1].type).toBe("mechanical");
    expect(result.tasks[2].type).toBe("mechanical");
  });

  it("tasks with design/implement keywords → generative", () => {
    const tasks = [
      makeTask({
        task_id: "t1",
        title: "Implement auth module",
        description: "Create a new authentication module",
      }),
      makeTask({
        task_id: "t2",
        title: "Design API",
        description: "Design the REST API endpoints",
      }),
      makeTask({
        task_id: "t3",
        title: "Build dashboard",
        description: "Build the admin dashboard",
      }),
    ];
    const graph = makeTaskGraph(tasks);
    const result = classify(graph);

    expect(result.tasks[0].type).toBe("generative");
    expect(result.tasks[1].type).toBe("generative");
    expect(result.tasks[2].type).toBe("generative");
  });

  it("classification preserves all other task properties", () => {
    const task = makeTask({
      task_id: "t1",
      title: "Rename module",
      description: "rename the old module",
      files_affected: ["src/old.ts"],
      specification_refs: ["docs/spec.md"],
    });
    const graph = makeTaskGraph([task]);
    const result = classify(graph);

    expect(result.tasks[0].task_id).toBe("t1");
    expect(result.tasks[0].files_affected).toEqual(["src/old.ts"]);
    expect(result.tasks[0].specification_refs).toEqual(["docs/spec.md"]);
    expect(result.tasks[0].acceptance_criteria).toEqual(task.acceptance_criteria);
  });

  it("defaults to generative when ambiguous", () => {
    const task = makeTask({
      task_id: "t1",
      title: "Update configuration",
      description: "Change configuration values",
    });
    const graph = makeTaskGraph([task]);
    const result = classify(graph);

    expect(result.tasks[0].type).toBe("generative");
  });
});

// ============ SEQUENCE TESTS ============

describe("sequence", () => {
  it("tasks with no dependencies → maintain original order", () => {
    const tasks = [
      makeTask({ task_id: "t1", estimated_complexity: "medium" }),
      makeTask({ task_id: "t2", estimated_complexity: "medium" }),
      makeTask({ task_id: "t3", estimated_complexity: "medium" }),
    ];
    const graph = makeTaskGraph(tasks);
    const plan = sequence(graph);

    expect(plan.ordered_tasks).toEqual(["t1", "t2", "t3"]);
  });

  it("tasks with hard dependencies → topological sort respects them", () => {
    const tasks = [
      makeTask({ task_id: "t1" }),
      makeTask({ task_id: "t2" }),
      makeTask({ task_id: "t3" }),
    ];
    // t1 → t2 → t3 (t1 must come before t2, t2 before t3)
    const deps = [
      { from: "t1", to: "t2", type: "hard" as const },
      { from: "t2", to: "t3", type: "hard" as const },
    ];
    const graph = makeTaskGraph(tasks, deps);
    const plan = sequence(graph);

    const t1Idx = plan.ordered_tasks.indexOf("t1");
    const t2Idx = plan.ordered_tasks.indexOf("t2");
    const t3Idx = plan.ordered_tasks.indexOf("t3");

    expect(t1Idx).toBeLessThan(t2Idx);
    expect(t2Idx).toBeLessThan(t3Idx);
  });

  it("circular dependencies → throws", () => {
    const tasks = [
      makeTask({ task_id: "t1" }),
      makeTask({ task_id: "t2" }),
    ];
    const deps = [
      { from: "t1", to: "t2", type: "hard" as const },
      { from: "t2", to: "t1", type: "hard" as const },
    ];
    const graph = makeTaskGraph(tasks, deps);

    expect(() => sequence(graph)).toThrow("Circular dependency");
  });

  it("critical path computed", () => {
    const tasks = [
      makeTask({ task_id: "t1" }),
      makeTask({ task_id: "t2" }),
    ];
    const graph = makeTaskGraph(tasks);
    const plan = sequence(graph);

    expect(plan.critical_path.length).toBeGreaterThan(0);
  });

  it("estimated_duration is computed", () => {
    const tasks = [
      makeTask({ task_id: "t1", estimated_complexity: "trivial" }),
      makeTask({ task_id: "t2", estimated_complexity: "high" }),
    ];
    const graph = makeTaskGraph(tasks);
    const plan = sequence(graph);

    expect(plan.estimated_duration).toBeDefined();
    expect(plan.estimated_duration.startsWith("~")).toBe(true);
  });
});

// ============ GATE TESTS ============

describe("gate", () => {
  it("auto-gate mode approves without interaction", async () => {
    const planState = makePlanState({
      task_graph: makeTaskGraph([makeTask()]),
      execution_plan: {
        intent_id: "test",
        ordered_tasks: ["t1"],
        phase_boundaries: {},
        critical_path: ["t1"],
        estimated_duration: "~15 minutes",
      },
    });

    const response = await gate(planState, { autoApprove: true });
    expect(response.decision).toBe("approve");
  });
});

// ============ DISPATCH TESTS (with mock TaskExecutor) ============

describe("dispatch", () => {
  const mockTaskExecutor: TaskExecutor = {
    execute: async (task: Task, ctx: TaskExecutionContext) => ({
      task_id: task.task_id,
      success: true,
      output: `Executed ${task.title}`,
      adaptations_applied: 0,
    }),
  };

  it("tasks dispatched in execution plan order", async () => {
    const tasks = [
      makeTask({ task_id: "t1", title: "First" }),
      makeTask({ task_id: "t2", title: "Second" }),
    ];
    const graph = makeTaskGraph(tasks);
    const plan = sequence(graph);

    const planState = makePlanState({
      task_graph: graph,
      execution_plan: plan,
    });

    const result = await dispatch(planState, mockTaskExecutor);
    expect(result.task_outcomes.length).toBe(2);
    expect(result.task_outcomes[0].task_id).toBe("t1");
    expect(result.task_outcomes[1].task_id).toBe("t2");
  });

  it("failed dependency → task skipped", async () => {
    const failingExecutor: TaskExecutor = {
      execute: async (task: Task) => ({
        task_id: task.task_id,
        success: task.task_id === "t1" ? false : true,
        error: task.task_id === "t1" ? "Intentional failure" : undefined,
        adaptations_applied: 0,
      }),
    };

    const tasks = [
      makeTask({ task_id: "t1" }),
      makeTask({ task_id: "t2" }),
    ];
    // t2 depends on t1 (hard)
    const deps = [{ from: "t1", to: "t2", type: "hard" as const }];
    const graph = makeTaskGraph(tasks, deps);
    const plan = sequence(graph);

    const planState = makePlanState({
      task_graph: graph,
      execution_plan: plan,
    });

    const result = await dispatch(planState, failingExecutor);

    const t1Outcome = result.task_outcomes.find((o) => o.task_id === "t1");
    const t2Outcome = result.task_outcomes.find((o) => o.task_id === "t2");

    expect(t1Outcome?.success).toBe(false);
    expect(t2Outcome?.success).toBe(false);
    expect(t2Outcome?.error).toBe("Unmet dependencies");
  });

  it("TaskExecutor called with correct context", async () => {
    let capturedContext: TaskExecutionContext | null = null;
    const capturingExecutor: TaskExecutor = {
      execute: async (task: Task, ctx: TaskExecutionContext) => {
        capturedContext = ctx;
        return {
          task_id: task.task_id,
          success: true,
          adaptations_applied: 0,
        };
      },
    };

    const tasks = [makeTask({ task_id: "t1" })];
    const graph = makeTaskGraph(tasks);
    const plan = sequence(graph);

    const planState = makePlanState({
      plan_id: "plan-capture",
      intent: "capture intent",
      task_graph: graph,
      execution_plan: plan,
    });

    await dispatch(planState, capturingExecutor);

    expect(capturedContext).not.toBeNull();
    expect(capturedContext!.planId).toBe("plan-capture");
    expect(capturedContext!.intent).toBe("capture intent");
  });

  it("all outcomes recorded in PlanState", async () => {
    const tasks = [
      makeTask({ task_id: "t1" }),
      makeTask({ task_id: "t2" }),
      makeTask({ task_id: "t3" }),
    ];
    const graph = makeTaskGraph(tasks);
    const plan = sequence(graph);

    const planState = makePlanState({
      task_graph: graph,
      execution_plan: plan,
    });

    const result = await dispatch(planState, mockTaskExecutor);
    expect(result.task_outcomes.length).toBe(3);
    expect(result.status).toBe("completed");
    expect(result.task_outcomes.every((o) => o.success)).toBe(true);
  });
});

// ============ ADAPT TESTS ============

describe("adapt", () => {
  it("failed task triggers adaptation", () => {
    const planState = makePlanState({
      task_graph: makeTaskGraph([makeTask({ task_id: "t1" })]),
    });

    const failedOutcome: TaskOutcome = {
      task_id: "t1",
      success: false,
      error: "Compilation failed",
      adaptations_applied: 0,
    };

    const result = adapt(planState, failedOutcome);
    expect(result.scope).toBe("task");
    expect(result.should_halt).toBe(false);
    expect(result.modified_plan).toBeDefined();
    expect(result.modified_plan!.adaptations_count).toBe(1);
  });

  it("max adaptations limit respected", () => {
    const planState = makePlanState({
      adaptations_count: MAX_ADAPTATIONS_PER_PLAN,
      task_graph: makeTaskGraph([makeTask({ task_id: "t1" })]),
    });

    const failedOutcome: TaskOutcome = {
      task_id: "t1",
      success: false,
      error: "Still failing",
      adaptations_applied: 0,
    };

    const result = adapt(planState, failedOutcome);
    expect(result.should_halt).toBe(true);
    expect(result.scope).toBe("plan");
  });

  it("repeated failures escalate scope from task to phase", () => {
    const planState = makePlanState({
      task_graph: makeTaskGraph([
        makeTask({ task_id: "t1" }),
        makeTask({ task_id: "t2" }),
      ]),
      task_outcomes: [
        // Two previous failures of t1
        { task_id: "t1", success: false, error: "fail1", adaptations_applied: 0 },
        { task_id: "t1", success: false, error: "fail2", adaptations_applied: 0 },
      ],
    });

    const failedOutcome: TaskOutcome = {
      task_id: "t1",
      success: false,
      error: "fail3",
      adaptations_applied: 0,
    };

    const result = adapt(planState, failedOutcome);
    expect(result.scope).toBe("phase");
  });
});
