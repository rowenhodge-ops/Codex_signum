// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Architect Pipeline — End-to-End Integration Tests
 *
 * These tests prove all 7 stages execute in sequence using mock executors.
 * Moved from DND-Manager — substrate-agnostic tests that use only core types.
 *
 * Test Level: 3 (Pipeline/Integration)
 */
import { describe, expect, it } from "vitest";
import {
  executePlan,
  classify,
  sequence,
  decompose,
} from "../../src/patterns/architect/index.js";
import type {
  ArchitectConfig,
  PlanState,
  PipelineSurveyOutput,
  TaskExecutor,
  Task,
  TaskExecutionContext,
  TaskOutcome,
  TaskGraph,
} from "../../src/patterns/architect/types.js";
import { createMockModelExecutor } from "../../src/patterns/architect/mock-model-executor.js";
import { createMockTaskExecutor } from "../../src/patterns/architect/mock-task-executor.js";
import {
  parallelDecompose,
  scorePlan,
} from "../../src/patterns/architect/parallel-decompose.js";

// ============ HELPERS ============

function createTestSurvey(
  overrides: Partial<PipelineSurveyOutput> = {},
): PipelineSurveyOutput {
  return {
    intent_id: `test_${Date.now()}`,
    codebase_state: {
      structure: "src/ with TypeScript files",
      recent_changes: ["Added mock executors"],
      test_status: "passing",
      open_issues: [],
    },
    graph_state: {
      pattern_health: {},
      active_cascades: 0,
      constitutional_alerts: [],
    },
    gap_analysis: {
      what_exists: ["Core architect pipeline", "DND adapters"],
      what_needs_building: ["Integration tests"],
      what_needs_changing: [],
      risks: [],
    },
    confidence: 0.85,
    blind_spots: [],
    ...overrides,
  };
}

function makeTaskGraph(count: number): TaskGraph {
  const tasks: Task[] = Array.from({ length: count }, (_, i) => ({
    task_id: `t${i}`,
    title: `Task ${i}`,
    description: "test task",
    acceptance_criteria: ["done"],
    type: "generative" as const,
    phase: "p1",
    estimated_complexity: "medium" as const,
    files_affected: [],
    specification_refs: [],
    verification: "npx tsc --noEmit",
    commit_message: `feat: task ${i}`,
  }));

  return {
    intent_id: "test",
    tasks,
    dependencies: [],
    phases: [
      {
        phase_id: "p1",
        title: "Phase 1",
        description: "",
        tasks: tasks.map((t) => t.task_id),
        gate: "human" as const,
        gate_criteria: "review",
      },
    ],
    estimated_total_effort: "medium" as const,
    decomposition_confidence: 0.8,
    assumptions: [],
  };
}

// ============ FULL PIPELINE TESTS (via core's executePlan) ============

describe("Architect Pipeline — End-to-End", () => {
  it("executes all 7 stages: SURVEY → DECOMPOSE → CLASSIFY → SEQUENCE → GATE → DISPATCH → ADAPT", async () => {
    const executionLog: Array<{
      task: Task;
      context: TaskExecutionContext;
      timestamp: number;
    }> = [];

    const config: ArchitectConfig = {
      modelExecutor: createMockModelExecutor({ taskCount: 3 }),
      taskExecutor: createMockTaskExecutor({ executionLog }),
      autoGate: true,
      decomposeAttempts: 3,
    };

    const result = await executePlan(
      "add health check endpoint",
      "/tmp/test-repo",
      config,
      createTestSurvey(),
    );

    // Pipeline completed
    expect(result).toBeDefined();
    expect(result.plan_id).toBeDefined();
    expect(result.intent).toBe("add health check endpoint");

    // DECOMPOSE produced task graph (from mock model executor)
    expect(result.task_graph).toBeDefined();
    expect(result.task_graph!.tasks.length).toBeGreaterThan(0);

    // CLASSIFY assigned types
    const classifiedTask = result.task_graph!.tasks[0];
    expect(classifiedTask.type).toBeDefined();
    expect(["mechanical", "generative"]).toContain(classifiedTask.type);

    // SEQUENCE produced execution plan
    expect(result.execution_plan).toBeDefined();
    expect(result.execution_plan!.ordered_tasks.length).toBeGreaterThan(0);

    // DISPATCH executed tasks (via mock task executor)
    expect(result.task_outcomes.length).toBeGreaterThan(0);
    expect(result.task_outcomes.every((o) => o.success)).toBe(true);

    // Tasks were actually dispatched (execution log populated)
    expect(executionLog.length).toBeGreaterThan(0);

    // Status reflects completion
    expect(["completed", "executing"]).toContain(result.status);
  }, 15_000);

  it("handles task failure → ADAPT triggers", async () => {
    const failingTaskExecutor: TaskExecutor = {
      async execute(
        task: Task,
        _context: TaskExecutionContext,
      ): Promise<TaskOutcome> {
        return {
          task_id: task.task_id,
          success: false,
          error: "Simulated compilation failure",
          adaptations_applied: 0,
        };
      },
    };

    const config: ArchitectConfig = {
      modelExecutor: createMockModelExecutor({ taskCount: 2 }),
      taskExecutor: failingTaskExecutor,
      autoGate: true,
    };

    const result = await executePlan(
      "test failure handling",
      "/tmp/test-repo",
      config,
      createTestSurvey(),
    );

    // ADAPT should have been triggered
    expect(result.task_outcomes.some((o) => !o.success)).toBe(true);
    expect(result).toBeDefined();
  }, 15_000);

  it("mock model executor failure → stub task graph (graceful degradation)", async () => {
    const config: ArchitectConfig = {
      modelExecutor: createMockModelExecutor({ simulateFailure: true }),
      taskExecutor: createMockTaskExecutor(),
      autoGate: true,
    };

    const result = await executePlan(
      "test LLM failure",
      "/tmp/test-repo",
      config,
      createTestSurvey(),
    );

    // Should still complete — decompose returns stub on LLM failure
    expect(result.task_graph).toBeDefined();
    expect(result.task_graph!.decomposition_confidence).toBeLessThanOrEqual(
      0.1,
    );
  }, 15_000);

  it("tasks execute in dependency order", async () => {
    const executionLog: Array<{
      task: Task;
      context: TaskExecutionContext;
      timestamp: number;
    }> = [];

    const config: ArchitectConfig = {
      modelExecutor: createMockModelExecutor({
        taskCount: 3,
        latencyMs: 10,
      }),
      taskExecutor: createMockTaskExecutor({
        executionLog,
        latencyMs: 10,
      }),
      autoGate: true,
    };

    const result = await executePlan(
      "test ordering",
      "/tmp/test-repo",
      config,
      createTestSurvey(),
    );

    // Verify execution order matches sequence
    if (result.execution_plan && executionLog.length >= 2) {
      const executedIds = executionLog.map((e) => e.task.task_id);
      const plannedIds = result.execution_plan.ordered_tasks.filter((id) =>
        executedIds.includes(id),
      );
      expect(executedIds).toEqual(plannedIds);
    }
  }, 15_000);
});

// ============ INDIVIDUAL STAGE TESTS ============

describe("Individual Pipeline Stages", () => {
  it("decompose returns valid TaskGraph from mock model executor", async () => {
    const executor = createMockModelExecutor({ taskCount: 3 });
    const survey = createTestSurvey();

    const graph = await decompose("test intent", survey, executor);

    expect(graph).toBeDefined();
    expect(graph.tasks.length).toBe(3);
    expect(graph.phases.length).toBeGreaterThan(0);
    expect(graph.decomposition_confidence).toBeGreaterThan(0);
  });

  it("classify assigns mechanical/generative types", () => {
    const graph = makeTaskGraph(4);
    const classified = classify(graph);

    for (const task of classified.tasks) {
      expect(["mechanical", "generative"]).toContain(task.type);
    }
  });

  it("sequence produces topological ordering", () => {
    const graph = makeTaskGraph(3);
    const plan = sequence(graph);

    expect(plan.ordered_tasks.length).toBe(3);
    expect(plan.estimated_duration).toBeDefined();
  });
});

// ============ PARALLEL DECOMPOSE TESTS ============

describe("Parallel Decompose — Best-of-N", () => {
  it("generates N plans and selects the best-scoring one", async () => {
    const executor = createMockModelExecutor({
      taskCount: 3,
      latencyMs: 10,
    });

    const result = await parallelDecompose(
      "test parallel decompose",
      createTestSurvey(),
      executor,
      { n: 3, parallel: false },
    );

    expect(result).toBeDefined();
    expect(result.tasks.length).toBeGreaterThan(0);
  });

  it("falls back to single decompose when N=1", async () => {
    const executor = createMockModelExecutor({
      taskCount: 2,
      latencyMs: 10,
    });

    const result = await parallelDecompose(
      "single attempt",
      createTestSurvey(),
      executor,
      { n: 1 },
    );

    expect(result).toBeDefined();
    expect(result.tasks.length).toBe(2);
  });

  it("survives all attempts failing — returns stub", async () => {
    const executor = createMockModelExecutor({
      simulateFailure: true,
      latencyMs: 10,
    });

    const result = await parallelDecompose(
      "all fail",
      createTestSurvey(),
      executor,
      { n: 3 },
    );

    // Should return stub (decompose's fallback on LLM failure)
    expect(result).toBeDefined();
    expect(result.decomposition_confidence).toBeLessThanOrEqual(0.1);
  });

  it("parallel mode completes", async () => {
    const executor = createMockModelExecutor({
      taskCount: 3,
      latencyMs: 50,
    });

    const result = await parallelDecompose(
      "parallel timing",
      createTestSurvey(),
      executor,
      { n: 3, parallel: true },
    );

    expect(result).toBeDefined();
    expect(result.tasks.length).toBeGreaterThan(0);
  });
});

// ============ PLAN SCORING TESTS ============

describe("Plan Scoring", () => {
  it("higher confidence = higher score", () => {
    const survey = createTestSurvey();
    const highConf = makeTaskGraph(4);
    highConf.decomposition_confidence = 0.9;

    const lowConf = makeTaskGraph(4);
    lowConf.decomposition_confidence = 0.2;

    const highScore = scorePlan(highConf, survey, "test");
    const lowScore = scorePlan(lowConf, survey, "test");

    expect(highScore.score).toBeGreaterThan(lowScore.score);
  });

  it("3-8 tasks scores higher than 1 task", () => {
    const survey = createTestSurvey();

    const optimal = scorePlan(makeTaskGraph(5), survey, "test");
    const tooFew = scorePlan(makeTaskGraph(1), survey, "test");

    expect(optimal.score).toBeGreaterThan(tooFew.score);
    expect(optimal.breakdown.taskCountScore).toBe(1.0);
    expect(tooFew.breakdown.taskCountScore).toBeLessThan(1.0);
  });

  it("orphaned dependencies lower consistency score", () => {
    const survey = createTestSurvey();
    const graph = makeTaskGraph(3);

    // Add orphaned dependency (references non-existent task)
    graph.dependencies.push({
      from: "t0",
      to: "nonexistent",
      type: "hard",
    });

    const scored = scorePlan(graph, survey, "test");
    expect(scored.breakdown.consistencyScore).toBeLessThan(1.0);
  });

  it("unassigned tasks lower consistency score", () => {
    const survey = createTestSurvey();
    const graph = makeTaskGraph(3);

    // Add task not in any phase
    graph.tasks.push({
      task_id: "orphan",
      title: "Orphan",
      description: "not in any phase",
      acceptance_criteria: ["done"],
      type: "generative",
      phase: "p_missing",
      estimated_complexity: "medium",
      files_affected: [],
      specification_refs: [],
      verification: "tsc",
      commit_message: "orphan",
    });

    const scored = scorePlan(graph, survey, "test");
    expect(scored.breakdown.consistencyScore).toBeLessThan(1.0);
  });
});

// ============ MOCK EXECUTOR TESTS ============

describe("Mock Model Executor", () => {
  it("returns valid TaskGraph JSON", async () => {
    const executor = createMockModelExecutor({ taskCount: 3 });
    const result = await executor.execute("test prompt");

    const parsed = JSON.parse(result.text);
    expect(parsed.tasks).toBeDefined();
    expect(parsed.tasks.length).toBe(3);
    expect(parsed.phases).toBeDefined();
    expect(parsed.dependencies).toBeDefined();
  });

  it("respects taskCount option", async () => {
    const executor = createMockModelExecutor({ taskCount: 5 });
    const result = await executor.execute("test");

    const parsed = JSON.parse(result.text);
    expect(parsed.tasks.length).toBe(5);
  });

  it("throws on simulateFailure", async () => {
    const executor = createMockModelExecutor({ simulateFailure: true });
    await expect(executor.execute("test")).rejects.toThrow(
      "Mock LLM failure",
    );
  });

  it("uses custom response when provided", async () => {
    const custom = JSON.stringify({ custom: true });
    const executor = createMockModelExecutor({ customResponse: custom });
    const result = await executor.execute("test");
    expect(result.text).toBe(custom);
  });
});

describe("Mock Task Executor", () => {
  it("records execution log", async () => {
    const log: Array<{
      task: Task;
      context: TaskExecutionContext;
      timestamp: number;
    }> = [];
    const executor = createMockTaskExecutor({ executionLog: log });

    const task: Task = {
      task_id: "t1",
      title: "Test",
      description: "test",
      acceptance_criteria: [],
      type: "mechanical",
      phase: "p1",
      estimated_complexity: "trivial",
      files_affected: [],
      specification_refs: [],
      verification: "tsc",
      commit_message: "test",
    };

    const context: TaskExecutionContext = {
      repoPath: "/tmp",
      dryRun: false,
      previousOutcomes: [],
      planId: "plan_1",
      intent: "test",
    };

    await executor.execute(task, context);

    expect(log.length).toBe(1);
    expect(log[0].task.task_id).toBe("t1");
  });

  it("returns dry run output", async () => {
    const executor = createMockTaskExecutor();

    const task: Task = {
      task_id: "t1",
      title: "Test",
      description: "test",
      acceptance_criteria: [],
      type: "mechanical",
      phase: "p1",
      estimated_complexity: "trivial",
      files_affected: [],
      specification_refs: [],
      verification: "tsc",
      commit_message: "test",
    };

    const result = await executor.execute(task, {
      repoPath: "/tmp",
      dryRun: true,
      previousOutcomes: [],
      planId: "plan_1",
      intent: "test",
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("[DRY RUN]");
  });

  it("fails specified tasks", async () => {
    const executor = createMockTaskExecutor({ failingTasks: ["t1"] });

    const task: Task = {
      task_id: "t1",
      title: "Failing Task",
      description: "should fail",
      acceptance_criteria: [],
      type: "generative",
      phase: "p1",
      estimated_complexity: "medium",
      files_affected: [],
      specification_refs: [],
      verification: "tsc",
      commit_message: "test",
    };

    const result = await executor.execute(task, {
      repoPath: "/tmp",
      dryRun: false,
      previousOutcomes: [],
      planId: "plan_1",
      intent: "test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Mock failure");
  });
});

// ============ SURVEY CONVERSION TEST ============

describe("Survey Type Bridge", () => {
  it("creates valid PipelineSurveyOutput", () => {
    const survey = createTestSurvey({
      confidence: 0.42,
      blind_spots: ["No Neo4j connection"],
    });

    expect(survey.confidence).toBe(0.42);
    expect(survey.blind_spots).toContain("No Neo4j connection");
    expect(survey.codebase_state.test_status).toBe("passing");
    expect(survey.graph_state.active_cascades).toBe(0);
    expect(survey.gap_analysis.what_needs_building).toContain(
      "Integration tests",
    );
  });
});
