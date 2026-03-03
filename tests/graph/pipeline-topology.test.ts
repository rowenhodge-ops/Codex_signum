// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import type { PipelineRunProps, TaskOutputProps } from "../../src/graph/queries.js";
import {
  ARCHITECT_STAGES,
  createPipelineRun,
  completePipelineRun,
  getPipelineRun,
  listPipelineRuns,
  createTaskOutput,
  getTaskOutputsForRun,
  queryTaskOutputsByModel,
  ensureArchitectResonators,
  linkTaskOutputToStage,
} from "../../src/graph/queries.js";

// ============ SCHEMA TESTS ============

describe("Pipeline Topology — Schema", () => {
  describe("ARCHITECT_STAGES constant", () => {
    it("has exactly 7 canonical stages", () => {
      expect(ARCHITECT_STAGES).toHaveLength(7);
    });

    it("contains all canonical stage names in order", () => {
      expect(ARCHITECT_STAGES).toEqual([
        "SURVEY",
        "DECOMPOSE",
        "CLASSIFY",
        "SEQUENCE",
        "GATE",
        "DISPATCH",
        "ADAPT",
      ]);
    });

    it("is readonly", () => {
      // TypeScript enforces this at compile time via `as const`.
      // At runtime, verify the array is frozen-like (values are immutable strings).
      expect(typeof ARCHITECT_STAGES[0]).toBe("string");
    });
  });

  describe("PipelineRunProps interface", () => {
    it("accepts a fully-specified PipelineRunProps object", () => {
      const run: PipelineRunProps = {
        id: "run-001",
        intent: "Audit specification compliance",
        bloomId: "bloom-architect",
        taskCount: 5,
        startedAt: "2026-03-04T10:00:00Z",
        completedAt: "2026-03-04T10:15:00Z",
        durationMs: 900000,
        modelDiversity: 3,
        overallQuality: 0.85,
        status: "completed",
      };
      expect(run.id).toBe("run-001");
      expect(run.intent).toBe("Audit specification compliance");
      expect(run.bloomId).toBe("bloom-architect");
      expect(run.taskCount).toBe(5);
      expect(run.startedAt).toBe("2026-03-04T10:00:00Z");
      expect(run.status).toBe("completed");
    });

    it("accepts PipelineRunProps with only required fields", () => {
      const run: PipelineRunProps = {
        id: "run-002",
        intent: "Gap analysis",
        bloomId: "bloom-architect",
        taskCount: 3,
        startedAt: "2026-03-04T11:00:00Z",
        status: "running",
      };
      expect(run.completedAt).toBeUndefined();
      expect(run.durationMs).toBeUndefined();
      expect(run.modelDiversity).toBeUndefined();
      expect(run.overallQuality).toBeUndefined();
    });

    it("enforces valid status values at type level", () => {
      const statuses: PipelineRunProps["status"][] = [
        "running",
        "completed",
        "failed",
      ];
      expect(statuses).toHaveLength(3);
    });
  });

  describe("TaskOutputProps interface", () => {
    it("accepts a fully-specified TaskOutputProps object", () => {
      const output: TaskOutputProps = {
        id: "run-001_t1",
        runId: "run-001",
        taskId: "t1",
        title: "Review ΦL computation",
        taskType: "generative",
        modelUsed: "claude-opus-4-6",
        provider: "anthropic",
        outputLength: 4500,
        durationMs: 12000,
        qualityScore: 0.9,
        hallucinationFlagCount: 0,
        status: "succeeded",
      };
      expect(output.id).toBe("run-001_t1");
      expect(output.runId).toBe("run-001");
      expect(output.taskId).toBe("t1");
      expect(output.title).toBe("Review ΦL computation");
      expect(output.taskType).toBe("generative");
      expect(output.modelUsed).toBe("claude-opus-4-6");
      expect(output.provider).toBe("anthropic");
      expect(output.outputLength).toBe(4500);
      expect(output.durationMs).toBe(12000);
      expect(output.qualityScore).toBe(0.9);
      expect(output.hallucinationFlagCount).toBe(0);
      expect(output.status).toBe("succeeded");
    });

    it("accepts TaskOutputProps without optional qualityScore", () => {
      const output: TaskOutputProps = {
        id: "run-001_t2",
        runId: "run-001",
        taskId: "t2",
        title: "Rename variable",
        taskType: "mechanical",
        modelUsed: "gemini-2.0-flash",
        provider: "google",
        outputLength: 200,
        durationMs: 3000,
        hallucinationFlagCount: 0,
        status: "succeeded",
      };
      expect(output.qualityScore).toBeUndefined();
    });

    it("enforces valid status values at type level", () => {
      const statuses: TaskOutputProps["status"][] = [
        "succeeded",
        "failed",
      ];
      expect(statuses).toHaveLength(2);
    });
  });
});

// ============ EXPORT EXISTENCE TESTS ============

describe("Pipeline Topology — Exports", () => {
  it("exports createPipelineRun as a function", () => {
    expect(typeof createPipelineRun).toBe("function");
  });

  it("exports completePipelineRun as a function", () => {
    expect(typeof completePipelineRun).toBe("function");
  });

  it("exports getPipelineRun as a function", () => {
    expect(typeof getPipelineRun).toBe("function");
  });

  it("exports listPipelineRuns as a function", () => {
    expect(typeof listPipelineRuns).toBe("function");
  });

  it("exports createTaskOutput as a function", () => {
    expect(typeof createTaskOutput).toBe("function");
  });

  it("exports getTaskOutputsForRun as a function", () => {
    expect(typeof getTaskOutputsForRun).toBe("function");
  });

  it("exports queryTaskOutputsByModel as a function", () => {
    expect(typeof queryTaskOutputsByModel).toBe("function");
  });

  it("exports ensureArchitectResonators as a function", () => {
    expect(typeof ensureArchitectResonators).toBe("function");
  });

  it("exports linkTaskOutputToStage as a function", () => {
    expect(typeof linkTaskOutputToStage).toBe("function");
  });

  it("exports ARCHITECT_STAGES as an array", () => {
    expect(Array.isArray(ARCHITECT_STAGES)).toBe(true);
  });
});

// ============ BARREL RE-EXPORT TESTS ============

describe("Pipeline Topology — Package-level barrel re-exports", () => {
  it("re-exports all pipeline topology symbols from package root", async () => {
    const root = await import("../../src/index.js");

    // Functions
    expect(typeof root.createPipelineRun).toBe("function");
    expect(typeof root.completePipelineRun).toBe("function");
    expect(typeof root.getPipelineRun).toBe("function");
    expect(typeof root.listPipelineRuns).toBe("function");
    expect(typeof root.createTaskOutput).toBe("function");
    expect(typeof root.getTaskOutputsForRun).toBe("function");
    expect(typeof root.queryTaskOutputsByModel).toBe("function");
    expect(typeof root.ensureArchitectResonators).toBe("function");
    expect(typeof root.linkTaskOutputToStage).toBe("function");

    // Constant
    expect(Array.isArray(root.ARCHITECT_STAGES)).toBe(true);
    expect(root.ARCHITECT_STAGES).toHaveLength(7);
  });
});

// ============ SCHEMA STATEMENT TESTS ============

describe("Pipeline Topology — Schema statements", () => {
  it("schema module exports migrateSchema function", async () => {
    const schema = await import("../../src/graph/schema.js");
    expect(typeof schema.migrateSchema).toBe("function");
    expect(typeof schema.verifySchema).toBe("function");
  });
});
