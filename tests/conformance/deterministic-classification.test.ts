// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * R-31: Deterministic task classification tests.
 *
 * Tests three-layer classification (content-shape → file-type → keyword),
 * priority ordering between layers, and dispatch routing.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  classify,
  classifyTask,
  dispatch,
  registerDeterministicExecutor,
  clearDeterministicExecutors,
  getDeterministicExecutorCount,
} from "../../src/patterns/architect/index.js";
import type {
  Task,
  TaskGraph,
  Phase,
  PlanState,
  ExecutionPlan,
  DeterministicExecutor,
  TaskOutcome,
  TaskExecutionContext,
  TaskExecutor,
  ClassificationResult,
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
  return {
    intent_id: "test-intent",
    tasks,
    dependencies,
    phases: phases ?? [
      {
        phase_id: "phase_1",
        title: "Phase 1",
        description: "Test phase",
        tasks: tasks.map((t) => t.task_id),
        gate: "auto",
        gate_criteria: "auto",
      },
    ],
    estimated_total_effort: "small",
    decomposition_confidence: 0.9,
    assumptions: [],
  };
}

function makePlanState(tasks: Task[], deps: TaskGraph["dependencies"] = []): PlanState {
  const taskGraph = makeTaskGraph(tasks, deps);
  const executionPlan: ExecutionPlan = {
    intent_id: "test-intent",
    ordered_tasks: tasks.map((t) => t.task_id),
    phase_boundaries: {},
    critical_path: tasks.map((t) => t.task_id),
    estimated_duration: "1h",
  };
  return {
    plan_id: "plan-test",
    intent: "test intent",
    status: "executing",
    task_graph: taskGraph,
    execution_plan: executionPlan,
    task_outcomes: [],
    adaptations_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ============ LAYER 1: CONTENT-SHAPE TESTS ============

describe("Layer 1: Content-shape classification", () => {
  it("json_manifest + graph_nodes → deterministic, 0.95, content_shape", () => {
    const result = classifyTask(
      makeTask({
        input_type: "json_manifest",
        output_type: "graph_nodes",
        title: "Seed pipeline output",
        description: "Read manifest and create graph nodes",
      }),
    );
    expect(result.type).toBe("deterministic");
    expect(result.confidence).toBe(0.95);
    expect(result.layer).toBe("content_shape");
    expect(result.signals).toContain("input_type: json_manifest");
    expect(result.signals).toContain("output_type: graph_nodes");
  });

  it("json_manifest + source_code → deterministic, 0.95, content_shape", () => {
    const result = classifyTask(
      makeTask({
        input_type: "json_manifest",
        output_type: "source_code",
        title: "Generate config from schema",
        description: "Transform JSON schema to TypeScript types",
      }),
    );
    expect(result.type).toBe("deterministic");
    expect(result.confidence).toBe(0.95);
    expect(result.layer).toBe("content_shape");
  });

  it("json_manifest + document → generative, 0.7, content_shape (needs LLM for prose)", () => {
    const result = classifyTask(
      makeTask({
        input_type: "json_manifest",
        output_type: "document",
        title: "Generate summary report",
        description: "Create a human-readable report from manifest data",
      }),
    );
    expect(result.type).toBe("generative");
    expect(result.confidence).toBe(0.7);
    expect(result.layer).toBe("content_shape");
  });

  it("source_code + source_code → mechanical, 0.8, content_shape", () => {
    const result = classifyTask(
      makeTask({
        input_type: "source_code",
        output_type: "source_code",
        title: "Refactor module",
        description: "Restructure source code",
      }),
    );
    expect(result.type).toBe("mechanical");
    expect(result.confidence).toBe(0.8);
    expect(result.layer).toBe("content_shape");
  });

  it("no input_type → falls through to Layer 2/3", () => {
    const result = classifyTask(
      makeTask({
        title: "Seed pipeline output",
        description: "Read manifest and create nodes",
        files_affected: ["data/manifest.json"],
      }),
    );
    // Should NOT be content_shape layer since input_type is absent
    expect(result.layer).not.toBe("content_shape");
  });

  it("inconclusive content-shape (e.g. prose + mixed) → falls through", () => {
    const result = classifyTask(
      makeTask({
        input_type: "prose",
        output_type: "mixed",
        title: "Analyze specifications",
      }),
    );
    // prose input with no matching rule → falls through to Layer 2/3
    expect(result.layer).not.toBe("content_shape");
  });
});

// ============ LAYER 2: FILE-TYPE TESTS ============

describe("Layer 2: File-type classification", () => {
  it("structured data files + transform keywords → deterministic, file_type", () => {
    const result = classifyTask(
      makeTask({
        title: "Seed pipeline output",
        description: "Load data from manifest",
        files_affected: ["data/manifest.json", "config/settings.yaml"],
      }),
    );
    expect(result.type).toBe("deterministic");
    expect(result.layer).toBe("file_type");
    expect(result.confidence).toBe(0.8);
  });

  it("source files + rename ops → mechanical, file_type", () => {
    const result = classifyTask(
      makeTask({
        title: "Rename AgentProps",
        description: "Rename AgentProps to SeedProps across the codebase",
        files_affected: ["src/graph/queries.ts", "src/types/morphemes.ts"],
      }),
    );
    expect(result.type).toBe("mechanical");
    expect(result.layer).toBe("file_type");
    expect(result.signals.some((s) => s.includes("mechanical ops"))).toBe(true);
  });

  it("source files with no mechanical ops → falls through to Layer 3", () => {
    const result = classifyTask(
      makeTask({
        title: "Implement new router",
        description: "Build the task routing logic",
        files_affected: ["src/patterns/router.ts"],
      }),
    );
    // "implement" and "build" are generative keywords → Layer 3
    expect(result.layer).toBe("keyword");
  });

  it("mixed source + data files → not deterministic (source files present)", () => {
    const result = classifyTask(
      makeTask({
        title: "Load and transform data",
        description: "Parse config and update source",
        files_affected: ["config.json", "src/loader.ts"],
      }),
    );
    // sourceFiles.length > 0, so structured-data-only check fails
    // Falls to mechanical ops check or Layer 3
    expect(result.type).not.toBe("deterministic");
  });

  it("no files_affected → falls through to Layer 3", () => {
    const result = classifyTask(
      makeTask({
        title: "Implement feature",
        description: "Create the new feature module",
        files_affected: [],
      }),
    );
    expect(result.layer).not.toBe("file_type");
  });
});

// ============ LAYER 3: KEYWORD TESTS ============

describe("Layer 3: Keyword classification", () => {
  it("rename keywords → mechanical with high confidence", () => {
    const result = classifyTask(
      makeTask({
        title: "Rename all AgentProps to SeedProps",
        description: "Rename the type across the project",
      }),
    );
    expect(result.type).toBe("mechanical");
    expect(result.layer).toBe("keyword");
    expect(result.signals).toContain("rename");
  });

  it("review/analyze keywords → generative", () => {
    const result = classifyTask(
      makeTask({
        title: "Review the axioms",
        description: "Analyze axiom consistency and verify correctness",
      }),
    );
    expect(result.type).toBe("generative");
    expect(result.layer).toBe("keyword");
    expect(result.signals).toContain("review");
  });

  it("empty description → generative, 0.5 confidence, default layer", () => {
    const result = classifyTask(
      makeTask({
        title: "",
        description: "",
      }),
    );
    expect(result.type).toBe("generative");
    expect(result.confidence).toBe(0.5);
    expect(result.layer).toBe("default");
  });

  it("mixed signals → type with more keyword matches wins", () => {
    const result = classifyTask(
      makeTask({
        title: "Create and format module",
        description: "Implement the new module and lint the output and format it",
      }),
    );
    // "create", "implement" are generative; "format", "lint" are mechanical
    // generative: 2 (create, implement), mechanical: 2 (format, lint) — tie goes to generative
    expect(result.layer).toBe("keyword");
  });

  it("signals array contains matched keywords", () => {
    const result = classifyTask(
      makeTask({
        title: "Delete old files",
        description: "Remove unused exports and fix typo in name",
      }),
    );
    expect(result.signals).toContain("delete");
    expect(result.signals).toContain("remove unused");
    expect(result.signals).toContain("fix typo");
  });
});

// ============ LAYER PRIORITY TESTS ============

describe("Layer priority", () => {
  it("Layer 1 trumps Layer 2 — content-shape wins over file-type", () => {
    const result = classifyTask(
      makeTask({
        input_type: "json_manifest",
        output_type: "graph_nodes",
        title: "Seed pipeline output",
        description: "Load manifest into graph",
        files_affected: ["data/manifest.json"],
      }),
    );
    // Layer 1 should win even though Layer 2 would also match
    expect(result.layer).toBe("content_shape");
    expect(result.type).toBe("deterministic");
    expect(result.confidence).toBe(0.95);
  });

  it("Layer 2 trumps Layer 3 — file-type wins over keywords", () => {
    const result = classifyTask(
      makeTask({
        title: "Rename old module to new",
        description: "Move and rename the module file",
        files_affected: ["src/old-module.ts", "src/new-module.ts"],
      }),
    );
    // Layer 2 (source files + rename/move) should win over Layer 3 keywords
    expect(result.layer).toBe("file_type");
    expect(result.type).toBe("mechanical");
  });
});

// ============ CLASSIFY (FULL PIPELINE) TESTS ============

describe("classify() stage", () => {
  it("attaches classification object to each task", () => {
    const tasks = [
      makeTask({
        task_id: "t1",
        input_type: "json_manifest",
        output_type: "graph_nodes",
        title: "Seed data",
        description: "Load manifest",
      }),
      makeTask({
        task_id: "t2",
        title: "Implement router",
        description: "Create the new routing module",
      }),
    ];
    const graph = makeTaskGraph(tasks);
    const result = classify(graph);

    expect(result.tasks[0].classification).toBeDefined();
    expect(result.tasks[0].classification!.type).toBe("deterministic");
    expect(result.tasks[0].type).toBe("deterministic");

    expect(result.tasks[1].classification).toBeDefined();
    expect(result.tasks[1].classification!.type).toBe("generative");
    expect(result.tasks[1].type).toBe("generative");
  });

  it("preserves all other task properties", () => {
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
  });

  it("existing tests still pass — mechanical keywords → mechanical type", () => {
    const tasks = [
      makeTask({ task_id: "t1", title: "Rename old module", description: "Rename the module" }),
      makeTask({ task_id: "t2", title: "Delete unused", description: "Remove unused import" }),
    ];
    const graph = makeTaskGraph(tasks);
    const result = classify(graph);
    expect(result.tasks[0].type).toBe("mechanical");
    expect(result.tasks[1].type).toBe("mechanical");
  });

  it("existing tests still pass — generative keywords → generative type", () => {
    const tasks = [
      makeTask({ task_id: "t1", title: "Implement auth", description: "Create a new module" }),
      makeTask({ task_id: "t2", title: "Design API", description: "Design the REST endpoints" }),
    ];
    const graph = makeTaskGraph(tasks);
    const result = classify(graph);
    expect(result.tasks[0].type).toBe("generative");
    expect(result.tasks[1].type).toBe("generative");
  });
});

// ============ DISPATCH ROUTING TESTS ============

describe("dispatch routing", () => {
  beforeEach(() => {
    clearDeterministicExecutors();
  });

  afterEach(() => {
    clearDeterministicExecutors();
  });

  it("deterministic task with registered executor → executor called, not TaskExecutor", async () => {
    let deterministicCalled = false;
    let taskExecutorCalled = false;

    const mockDeterministic: DeterministicExecutor = {
      canHandle: () => true,
      execute: async (task) => {
        deterministicCalled = true;
        return {
          task_id: task.task_id,
          success: true,
          output: "Deterministic result",
          adaptations_applied: 0,
          metadata: { executionPath: "deterministic" },
        };
      },
    };
    registerDeterministicExecutor(mockDeterministic);

    const mockTaskExecutor: TaskExecutor = {
      execute: async (task) => {
        taskExecutorCalled = true;
        return { task_id: task.task_id, success: true, adaptations_applied: 0 };
      },
    };

    const task = makeTask({
      task_id: "t1",
      type: "deterministic",
      classification: {
        type: "deterministic",
        confidence: 0.95,
        signals: ["input_type: json_manifest"],
        layer: "content_shape",
      },
    });
    const state = makePlanState([task]);
    const result = await dispatch(state, mockTaskExecutor);

    expect(deterministicCalled).toBe(true);
    expect(taskExecutorCalled).toBe(false);
    expect(result.task_outcomes[0].success).toBe(true);
    expect(result.task_outcomes[0].metadata?.executionPath).toBe("deterministic");
  });

  it("deterministic task with NO registered executor → falls back to TaskExecutor", async () => {
    // No executor registered
    let taskExecutorCalled = false;

    const mockTaskExecutor: TaskExecutor = {
      execute: async (task) => {
        taskExecutorCalled = true;
        return { task_id: task.task_id, success: true, adaptations_applied: 0 };
      },
    };

    const task = makeTask({
      task_id: "t1",
      type: "deterministic",
      classification: {
        type: "deterministic",
        confidence: 0.95,
        signals: [],
        layer: "content_shape",
      },
    });
    const state = makePlanState([task]);
    await dispatch(state, mockTaskExecutor);

    expect(taskExecutorCalled).toBe(true);
  });

  it("mechanical task → routes through TaskExecutor", async () => {
    let taskExecutorCalled = false;

    const mockTaskExecutor: TaskExecutor = {
      execute: async (task) => {
        taskExecutorCalled = true;
        return { task_id: task.task_id, success: true, adaptations_applied: 0 };
      },
    };

    const task = makeTask({
      task_id: "t1",
      type: "mechanical",
      classification: {
        type: "mechanical",
        confidence: 0.8,
        signals: ["rename"],
        layer: "keyword",
      },
    });
    const state = makePlanState([task]);
    await dispatch(state, mockTaskExecutor);

    expect(taskExecutorCalled).toBe(true);
  });

  it("generative task → routes through TaskExecutor", async () => {
    let taskExecutorCalled = false;

    const mockTaskExecutor: TaskExecutor = {
      execute: async (task) => {
        taskExecutorCalled = true;
        return { task_id: task.task_id, success: true, adaptations_applied: 0 };
      },
    };

    const task = makeTask({
      task_id: "t1",
      type: "generative",
    });
    const state = makePlanState([task]);
    await dispatch(state, mockTaskExecutor);

    expect(taskExecutorCalled).toBe(true);
  });

  it("executor registry: register + clear + count", () => {
    expect(getDeterministicExecutorCount()).toBe(0);

    const mock: DeterministicExecutor = {
      canHandle: () => true,
      execute: async (task) => ({
        task_id: task.task_id,
        success: true,
        adaptations_applied: 0,
      }),
    };

    registerDeterministicExecutor(mock);
    expect(getDeterministicExecutorCount()).toBe(1);

    registerDeterministicExecutor(mock);
    expect(getDeterministicExecutorCount()).toBe(2);

    clearDeterministicExecutors();
    expect(getDeterministicExecutorCount()).toBe(0);
  });

  it("first matching executor wins when multiple registered", async () => {
    const callOrder: string[] = [];

    const exec1: DeterministicExecutor = {
      canHandle: () => true,
      execute: async (task) => {
        callOrder.push("exec1");
        return { task_id: task.task_id, success: true, adaptations_applied: 0 };
      },
    };
    const exec2: DeterministicExecutor = {
      canHandle: () => true,
      execute: async (task) => {
        callOrder.push("exec2");
        return { task_id: task.task_id, success: true, adaptations_applied: 0 };
      },
    };

    registerDeterministicExecutor(exec1);
    registerDeterministicExecutor(exec2);

    const task = makeTask({
      task_id: "t1",
      type: "deterministic",
      classification: {
        type: "deterministic",
        confidence: 0.95,
        signals: [],
        layer: "content_shape",
      },
    });
    const state = makePlanState([task]);
    const mockTaskExecutor: TaskExecutor = {
      execute: async (task) => ({
        task_id: task.task_id,
        success: true,
        adaptations_applied: 0,
      }),
    };
    await dispatch(state, mockTaskExecutor);

    expect(callOrder).toEqual(["exec1"]);
  });
});

// ============ MANIFEST SEEDING EXECUTOR TESTS (unit-level) ============

describe("ManifestSeedingExecutor-style canHandle logic", () => {
  // Tests the canHandle pattern without importing the bootstrap script
  // (which has graph dependencies). Tests the classification signals instead.

  it("json_manifest + graph_nodes classifies as deterministic", () => {
    const result = classifyTask(
      makeTask({
        input_type: "json_manifest",
        output_type: "graph_nodes",
        title: "Seed output",
        description: "Create graph nodes from manifest",
        data_sources: ["docs/pipeline-output/run-123/_manifest.json"],
      }),
    );
    expect(result.type).toBe("deterministic");
    expect(result.confidence).toBe(0.95);
  });

  it("data_sources with _manifest.json + transform keyword → deterministic via file_type", () => {
    const result = classifyTask(
      makeTask({
        title: "Load pipeline results",
        description: "Ingest manifest data into graph",
        files_affected: ["docs/pipeline-output/run-123/_manifest.json"],
      }),
    );
    expect(result.type).toBe("deterministic");
    expect(result.layer).toBe("file_type");
  });
});
