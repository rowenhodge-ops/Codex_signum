/**
 * Architect Pipeline Governance — verifies the 7-stage pipeline enforces
 * structural constraints end-to-end.
 *
 * Uses mock executors so no LLM calls are made.
 * Level: L3 Pipeline + L4 Outcome
 */
import { describe, it, expect } from "vitest";
import {
  executePlan,
  createMockModelExecutor,
  createMockTaskExecutor,
  classify,
  sequence,
  selectReasoningTier,
  type PipelineSurveyOutput,
  type TaskGraph,
  type ArchitectConfig,
} from "../../src/index.js";

const survey: PipelineSurveyOutput = {
  intent_id: "gov-test",
  codebase_state: {
    structure: "test",
    recent_changes: [],
    test_status: "passing",
    open_issues: [],
  },
  graph_state: {
    bloom_health: {},
    active_cascades: 0,
    constitutional_alerts: [],
  },
  gap_analysis: {
    what_exists: [],
    what_needs_building: ["governance test"],
    what_needs_changing: [],
    risks: [],
  },
  confidence: 0.9,
  blind_spots: [],
};

describe("Architect Pipeline: full pipeline completes with mock executors", () => {
  it("executePlan reaches 'completed' status with autoGate", async () => {
    const executor = createMockModelExecutor({ taskCount: 3 });
    const taskExecutor = createMockTaskExecutor();

    const result = await executePlan("governance test", ".", {
      modelExecutor: executor,
      taskExecutor,
      autoGate: true,
    }, survey);

    expect(result.status).toBe("completed");
    expect(result.task_graph).toBeDefined();
    expect(result.execution_plan).toBeDefined();
    expect(result.task_graph!.tasks.length).toBeGreaterThan(0);
  });

  it("executePlan with dryRun still completes all stages", async () => {
    const executor = createMockModelExecutor({ taskCount: 2 });
    const taskExecutor = createMockTaskExecutor();

    const result = await executePlan("dry run test", ".", {
      modelExecutor: executor,
      taskExecutor,
      autoGate: true,
      dryRun: true,
    }, survey);

    expect(["completed", "adapting"]).toContain(result.status);
  });
});

describe("Architect Pipeline: classify preserves and annotates tasks", () => {
  const graph: TaskGraph = {
    intent_id: "classify-gov",
    tasks: [
      {
        task_id: "t1",
        title: "Rename variable",
        description: "Rename foo to bar",
        acceptance_criteria: ["done"],
        type: "mechanical",
        phase: "p1",
        estimated_complexity: "trivial",
        files_affected: [],
        specification_refs: [],
        verification: "tsc",
        commit_message: "rename",
      },
      {
        task_id: "t2",
        title: "Design new API",
        description: "Create REST endpoints",
        acceptance_criteria: ["endpoints exist"],
        type: "generative",
        phase: "p1",
        estimated_complexity: "complex",
        files_affected: [],
        specification_refs: [],
        verification: "test",
        commit_message: "api",
      },
    ],
    dependencies: [],
    phases: [{
      phase_id: "p1",
      title: "Phase 1",
      description: "test",
      tasks: ["t1", "t2"],
      gate: "auto",
      gate_criteria: "pass",
    }],
    estimated_total_effort: "medium",
    decomposition_confidence: 0.85,
    assumptions: [],
  };

  it("classify preserves all tasks — does not drop any", () => {
    const classified = classify(graph);
    expect(classified.tasks.length).toBe(graph.tasks.length);
  });

  it("classify preserves task IDs", () => {
    const classified = classify(graph);
    const ids = classified.tasks.map((t) => t.task_id);
    expect(ids).toContain("t1");
    expect(ids).toContain("t2");
  });

  it("every classified task has a defined type", () => {
    const classified = classify(graph);
    for (const task of classified.tasks) {
      expect(task.type).toBeDefined();
      expect(["mechanical", "generative"]).toContain(task.type);
    }
  });
});

describe("Architect Pipeline: sequence respects dependencies", () => {
  it("hard dependency orders tasks correctly", () => {
    const graph: TaskGraph = {
      intent_id: "seq-gov",
      tasks: [
        { task_id: "a", title: "A", description: "a", acceptance_criteria: ["done"], type: "mechanical", phase: "p1", estimated_complexity: "trivial", files_affected: [], specification_refs: [], verification: "tsc", commit_message: "a" },
        { task_id: "b", title: "B", description: "b", acceptance_criteria: ["done"], type: "mechanical", phase: "p1", estimated_complexity: "trivial", files_affected: [], specification_refs: [], verification: "tsc", commit_message: "b" },
        { task_id: "c", title: "C", description: "c", acceptance_criteria: ["done"], type: "mechanical", phase: "p1", estimated_complexity: "trivial", files_affected: [], specification_refs: [], verification: "tsc", commit_message: "c" },
      ],
      dependencies: [
        { from: "a", to: "b", type: "hard" },
        { from: "b", to: "c", type: "hard" },
      ],
      phases: [{ phase_id: "p1", title: "Phase 1", description: "test", tasks: ["a", "b", "c"], gate: "auto", gate_criteria: "pass" }],
      estimated_total_effort: "small",
      decomposition_confidence: 0.9,
      assumptions: [],
    };

    const plan = sequence(graph);
    const aIdx = plan.ordered_tasks.indexOf("a");
    const bIdx = plan.ordered_tasks.indexOf("b");
    const cIdx = plan.ordered_tasks.indexOf("c");

    expect(aIdx).toBeLessThan(bIdx);
    expect(bIdx).toBeLessThan(cIdx);
  });

  it("sequence includes all tasks in ordered_tasks", () => {
    const graph: TaskGraph = {
      intent_id: "seq-gov-2",
      tasks: [
        { task_id: "x", title: "X", description: "x", acceptance_criteria: ["done"], type: "generative", phase: "p1", estimated_complexity: "medium", files_affected: [], specification_refs: [], verification: "test", commit_message: "x" },
      ],
      dependencies: [],
      phases: [{ phase_id: "p1", title: "Phase 1", description: "test", tasks: ["x"], gate: "auto", gate_criteria: "pass" }],
      estimated_total_effort: "small",
      decomposition_confidence: 0.9,
      assumptions: [],
    };

    const plan = sequence(graph);
    expect(plan.ordered_tasks).toContain("x");
  });
});

describe("Architect Pipeline: reasoning tiers enforce RTR framework", () => {
  it("planning tasks always get deep reasoning", () => {
    expect(selectReasoningTier({ taskType: "planning" })).toBe("deep");
  });

  it("simple coding tasks get light reasoning", () => {
    expect(
      selectReasoningTier({ taskType: "coding", complexity: "simple" }),
    ).toBe("light");
  });

  it("complex coding tasks get deep reasoning", () => {
    expect(
      selectReasoningTier({ taskType: "coding", complexity: "complex" }),
    ).toBe("deep");
  });

  it("no context defaults to moderate", () => {
    expect(selectReasoningTier()).toBe("moderate");
  });

  it("high quality requirement elevates to deep", () => {
    expect(
      selectReasoningTier({ taskType: "general", qualityRequirement: 0.9 }),
    ).toBe("deep");
  });
});
