// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import {
  isSynthesisTask,
  checkConsistency,
  MAX_PRIOR_OUTPUT_CHARS,
  CANONICAL_AXIOM_NAMES,
  CANONICAL_PIPELINE_STAGES,
} from "../../scripts/bootstrap-task-executor.js";
import type { Task } from "../../src/patterns/architect/types.js";

// ── Helpers ──────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    task_id: "t1",
    title: "Test task",
    description: "A test task",
    acceptance_criteria: ["criterion"],
    type: "generative",
    phase: "phase_1",
    estimated_complexity: "medium",
    files_affected: [],
    specification_refs: [],
    verification: "npx tsc --noEmit",
    commit_message: "test",
    ...overrides,
  };
}

// ── isSynthesisTask tests ────────────────────────────────────────────────

describe("isSynthesisTask", () => {
  it("detects consolidation in description", () => {
    const task = makeTask({ description: "Consolidate findings from all prior tasks" });
    expect(isSynthesisTask(task, false)).toBe(true);
  });

  it("detects synthesize in acceptance criteria", () => {
    const task = makeTask({
      description: "Write a report",
      acceptance_criteria: ["Synthesize all upstream analyses into a coherent narrative"],
    });
    expect(isSynthesisTask(task, false)).toBe(true);
  });

  it("detects final report pattern", () => {
    const task = makeTask({ description: "Produce the final report for the milestone" });
    expect(isSynthesisTask(task, false)).toBe(true);
  });

  it("detects summary of pattern", () => {
    const task = makeTask({ description: "Provide a summary of all analyses performed" });
    expect(isSynthesisTask(task, false)).toBe(true);
  });

  it("detects across all pattern", () => {
    const task = makeTask({ description: "Compare metrics across all task outputs" });
    expect(isSynthesisTask(task, false)).toBe(true);
  });

  it("returns true for last phase even without synthesis keywords", () => {
    const task = makeTask({ description: "Just a normal task" });
    expect(isSynthesisTask(task, true)).toBe(true);
  });

  it("returns false for non-synthesis, non-last-phase task", () => {
    const task = makeTask({ description: "Analyze the dampening parameter" });
    expect(isSynthesisTask(task, false)).toBe(false);
  });
});

// ── checkConsistency tests ───────────────────────────────────────────────

describe("checkConsistency", () => {
  it("returns no issues for consistent outputs", () => {
    const outputs = new Map([
      ["t1", { title: "Task 1", output: "Coverage: 85%. All good." }],
      ["t2", { title: "Task 2", output: "Coverage: 87%. Still good." }],
    ]);

    const report = checkConsistency(outputs);

    expect(report.issues).toHaveLength(0);
    expect(report.taskCount).toBe(2);
  });

  it("detects metric divergence (>20% relative difference)", () => {
    const outputs = new Map([
      ["t1", { title: "Task 1", output: "Compliance: 90%" }],
      ["t2", { title: "Task 2", output: "Compliance: 50%" }],
    ]);

    const report = checkConsistency(outputs);

    const divergences = report.issues.filter((i) => i.type === "metric-divergence");
    expect(divergences.length).toBeGreaterThanOrEqual(1);
    expect(divergences[0].tasks).toContain("t1");
    expect(divergences[0].tasks).toContain("t2");
  });

  it("does not flag small metric differences", () => {
    const outputs = new Map([
      ["t1", { title: "Task 1", output: "Score: 80%" }],
      ["t2", { title: "Task 2", output: "Score: 85%" }],
    ]);

    const report = checkConsistency(outputs);

    const divergences = report.issues.filter((i) => i.type === "metric-divergence");
    expect(divergences).toHaveLength(0);
  });

  it("detects wrong pipeline stage names", () => {
    const outputs = new Map([
      ["t1", { title: "Task 1", output: "stage 3: VALIDATE is critical" }],
    ]);

    const report = checkConsistency(outputs);

    const wrongStages = report.issues.filter((i) => i.type === "wrong-stage-name");
    expect(wrongStages.length).toBeGreaterThanOrEqual(1);
    expect(wrongStages[0].description).toContain("VALIDATE");
  });

  it("does not flag canonical stage names", () => {
    const outputs = new Map([
      ["t1", { title: "Task 1", output: "stage 1: SURVEY scans the codebase" }],
      ["t2", { title: "Task 2", output: "stage 7: ADAPT handles failures" }],
    ]);

    const report = checkConsistency(outputs);

    const wrongStages = report.issues.filter((i) => i.type === "wrong-stage-name");
    expect(wrongStages).toHaveLength(0);
  });

  it("handles empty task outputs", () => {
    const outputs = new Map<string, { title: string; output: string }>();

    const report = checkConsistency(outputs);

    expect(report.issues).toHaveLength(0);
    expect(report.taskCount).toBe(0);
  });

  it("detects entity existence contradiction across tasks", () => {
    const outputs = new Map([
      ["t1", { title: "Task 1", output: "The `readFileContext` function exists and is used for injection." }],
      ["t2", { title: "Task 2", output: "The `readFileContext` function does not exist in this version." }],
    ]);

    const report = checkConsistency(outputs);

    const contradictions = report.issues.filter((i) => i.type === "entity-existence-contradiction");
    expect(contradictions.length).toBeGreaterThanOrEqual(1);
    expect(contradictions[0].description).toContain("readFileContext");
    expect(contradictions[0].tasks).toContain("t1");
    expect(contradictions[0].tasks).toContain("t2");
  });

  it("does not flag entity mentioned with existence claim in only one task", () => {
    const outputs = new Map([
      ["t1", { title: "Task 1", output: "The `detectHallucinations` function exists." }],
      ["t2", { title: "Task 2", output: "No mention of the entity here." }],
    ]);

    const report = checkConsistency(outputs);

    const contradictions = report.issues.filter((i) => i.type === "entity-existence-contradiction");
    expect(contradictions).toHaveLength(0);
  });

  it("does not flag when only one task makes both claims (no cross-task contradiction)", () => {
    const outputs = new Map([
      ["t1", { title: "Task 1", output: "The `legacyFn` was removed — it does not exist in the new version." }],
    ]);

    const report = checkConsistency(outputs);

    const contradictions = report.issues.filter((i) => i.type === "entity-existence-contradiction");
    expect(contradictions).toHaveLength(0);
  });
});

// ── Constants tests ──────────────────────────────────────────────────────

describe("canonical constants", () => {
  it("has exactly 9 axiom names (v4.3: Symbiosis removed)", () => {
    expect(CANONICAL_AXIOM_NAMES).toHaveLength(9);
  });

  it("has exactly 7 pipeline stages", () => {
    expect(CANONICAL_PIPELINE_STAGES).toHaveLength(7);
  });

  it("output cap is 6000 chars", () => {
    expect(MAX_PRIOR_OUTPUT_CHARS).toBe(6000);
  });
});
