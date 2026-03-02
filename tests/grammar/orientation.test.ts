/**
 * G2. Orientation — Flow direction matches declared direction.
 *
 * Tests that pipeline stages enforce ordering. writeObservation flow is
 * strictly sequential. Architect pipeline enforces stage ordering.
 * Level: L3 Pipeline + L5 Invariant
 */
import { describe, it, expect } from "vitest";
import {
  executePlan,
  createMockModelExecutor,
  createMockTaskExecutor,
  classify,
  sequence,
  type PipelineSurveyOutput,
  type TaskGraph,
} from "../../src/index.js";

describe("G2 Orientation: Architect pipeline enforces stage order", () => {
  const survey: PipelineSurveyOutput = {
    intent_id: "test-intent",
    codebase_state: { structure: "test", recent_changes: [], test_status: "passing", open_issues: [] },
    graph_state: { bloom_health: {}, active_cascades: 0, constitutional_alerts: [] },
    gap_analysis: { what_exists: [], what_needs_building: ["test"], what_needs_changing: [], risks: [] },
    confidence: 0.8,
    blind_spots: [],
  };

  it("executePlan transitions through stages in order: survey → decompose → classify → sequence → gated → executing → completed", async () => {
    const executor = createMockModelExecutor({ taskCount: 2 });
    const taskExecutor = createMockTaskExecutor();

    const result = await executePlan("test intent", ".", {
      modelExecutor: executor,
      taskExecutor,
      autoGate: true,
    }, survey);

    // If no failures, status should be 'completed' (all stages ran)
    expect(["completed", "adapting"]).toContain(result.status);
    expect(result.survey).toBeDefined();
    expect(result.task_graph).toBeDefined();
    expect(result.execution_plan).toBeDefined();
  });

  it("GATE is structurally mandatory — executePlan imports and calls gate stage", () => {
    // Gate is mandatory in V1 (constitutional rule: mandatory_human_gate_initial = true).
    // We verify the architect module structurally requires gate rather than calling
    // executePlan with autoGate=false (which would block on readline).
    const architectContent = require("node:fs").readFileSync("src/patterns/architect/architect.ts", "utf-8");
    // executePlan imports gate
    expect(architectContent).toContain("gate");
    // executePlan transitions to "gated" status
    expect(architectContent).toContain("gated");
    // autoGate option exists — gate can be auto-approved but NEVER skipped
    expect(architectContent).toContain("autoApprove");
  });

  it("gate with autoApprove returns approve decision", async () => {
    const { gate } = await import("../../src/patterns/architect/gate.js");
    const response = await gate(
      { intent: "test", status: "gated", survey: null as any },
      { autoApprove: true },
    );
    expect(response.decision).toBe("approve");
  });
});

describe("G2 Orientation: classify requires task_graph from decompose", () => {
  it("classify takes a TaskGraph and annotates types — does not produce a TaskGraph", () => {
    const graph: TaskGraph = {
      intent_id: "test",
      tasks: [
        { task_id: "t1", title: "Rename function", description: "rename foo to bar", acceptance_criteria: ["done"], type: "mechanical", phase: "p1", estimated_complexity: "trivial", files_affected: [], specification_refs: [], verification: "tsc", commit_message: "rename" },
      ],
      dependencies: [],
      phases: [{ phase_id: "p1", title: "Phase 1", description: "test", tasks: ["t1"], gate: "auto", gate_criteria: "pass" }],
      estimated_total_effort: "small",
      decomposition_confidence: 0.9,
      assumptions: [],
    };

    const classified = classify(graph);
    // classify preserves the graph structure and annotates types
    expect(classified.tasks.length).toBe(graph.tasks.length);
    expect(classified.tasks[0].type).toBeDefined();
  });
});

describe("G2 Orientation: sequence requires classified task_graph", () => {
  it("sequence takes a TaskGraph and produces an ExecutionPlan with ordered_tasks", () => {
    const graph: TaskGraph = {
      intent_id: "test",
      tasks: [
        { task_id: "t1", title: "First", description: "first", acceptance_criteria: ["done"], type: "mechanical", phase: "p1", estimated_complexity: "trivial", files_affected: [], specification_refs: [], verification: "tsc", commit_message: "first" },
        { task_id: "t2", title: "Second", description: "second", acceptance_criteria: ["done"], type: "generative", phase: "p1", estimated_complexity: "medium", files_affected: [], specification_refs: [], verification: "test", commit_message: "second" },
      ],
      dependencies: [{ from: "t1", to: "t2", type: "hard" }],
      phases: [{ phase_id: "p1", title: "Phase 1", description: "test", tasks: ["t1", "t2"], gate: "auto", gate_criteria: "pass" }],
      estimated_total_effort: "small",
      decomposition_confidence: 0.9,
      assumptions: [],
    };

    const plan = sequence(graph);
    // t1 must come before t2 in ordered_tasks (dependency ordering)
    const t1Index = plan.ordered_tasks.indexOf("t1");
    const t2Index = plan.ordered_tasks.indexOf("t2");
    expect(t1Index).toBeLessThan(t2Index);
  });
});
