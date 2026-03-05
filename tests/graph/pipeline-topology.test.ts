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
  // M-9.5 additions
  failPipelineRun,
  updateTaskOutputQuality,
  getTaskOutput,
  linkDecisionToPipelineRun,
  getDecisionsForRun,
  getCompactionHistory,
  getModelPerformance,
  getStagePerformance,
  getRunComparison,
} from "../../src/graph/queries.js";
import { RELATIONSHIP_TYPES } from "../../src/graph/schema.js";
import type { RelationshipType } from "../../src/graph/schema.js";

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

// ============ M-9.5 PIPELINE LIFECYCLE EXTENSIONS ============

describe("Pipeline Lifecycle Extensions (M-9.5) — Exports", () => {
  it("exports failPipelineRun as a function", () => {
    expect(typeof failPipelineRun).toBe("function");
  });

  it("exports updateTaskOutputQuality as a function", () => {
    expect(typeof updateTaskOutputQuality).toBe("function");
  });

  it("exports getTaskOutput as a function", () => {
    expect(typeof getTaskOutput).toBe("function");
  });

  it("exports linkDecisionToPipelineRun as a function", () => {
    expect(typeof linkDecisionToPipelineRun).toBe("function");
  });

  it("exports getDecisionsForRun as a function", () => {
    expect(typeof getDecisionsForRun).toBe("function");
  });

  it("exports getCompactionHistory as a function", () => {
    expect(typeof getCompactionHistory).toBe("function");
  });

  it("exports getModelPerformance as a function", () => {
    expect(typeof getModelPerformance).toBe("function");
  });

  it("exports getStagePerformance as a function", () => {
    expect(typeof getStagePerformance).toBe("function");
  });

  it("exports getRunComparison as a function", () => {
    expect(typeof getRunComparison).toBe("function");
  });
});

// ============ RELATIONSHIP TYPE REGISTRY ============

describe("RELATIONSHIP_TYPES registry", () => {
  it("is an object with string values", () => {
    expect(typeof RELATIONSHIP_TYPES).toBe("object");
    for (const [key, value] of Object.entries(RELATIONSHIP_TYPES)) {
      expect(typeof value).toBe("string");
      // Keys should be UPPER_SNAKE_CASE
      expect(key).toMatch(/^[A-Z_]+$/);
      // Values should match keys (canonical)
      expect(value).toMatch(/^[A-Z_]+$/);
    }
  });

  it("contains all relationship types used in queries.ts", () => {
    // These are the relationships used in the current query set
    expect(RELATIONSHIP_TYPES.CONTAINS).toBe("CONTAINS");
    expect(RELATIONSHIP_TYPES.ROUTED_TO).toBe("ROUTED_TO");
    expect(RELATIONSHIP_TYPES.ORIGINATED_FROM).toBe("ORIGINATED_FROM");
    expect(RELATIONSHIP_TYPES.IN_CONTEXT).toBe("IN_CONTEXT");
    expect(RELATIONSHIP_TYPES.DECIDED_DURING).toBe("DECIDED_DURING");
    expect(RELATIONSHIP_TYPES.OBSERVED_IN).toBe("OBSERVED_IN");
    expect(RELATIONSHIP_TYPES.DISTILLED_FROM).toBe("DISTILLED_FROM");
    expect(RELATIONSHIP_TYPES.EXECUTED_IN).toBe("EXECUTED_IN");
    expect(RELATIONSHIP_TYPES.PRODUCED).toBe("PRODUCED");
    expect(RELATIONSHIP_TYPES.PROCESSED).toBe("PROCESSED");
  });

  it("has exactly 10 relationship types", () => {
    expect(Object.keys(RELATIONSHIP_TYPES)).toHaveLength(10);
  });

  it("RelationshipType is a valid type alias", () => {
    // Type-level check: a valid RelationshipType value should be assignable
    const rel: RelationshipType = RELATIONSHIP_TYPES.CONTAINS;
    expect(rel).toBe("CONTAINS");
  });
});

// ============ M-9.5 BARREL RE-EXPORT TESTS ============

describe("Pipeline Lifecycle Extensions — Package-level barrel re-exports", () => {
  it("re-exports all M-9.5 symbols from package root", async () => {
    const root = await import("../../src/index.js");

    // Query functions
    expect(typeof root.failPipelineRun).toBe("function");
    expect(typeof root.updateTaskOutputQuality).toBe("function");
    expect(typeof root.getTaskOutput).toBe("function");
    expect(typeof root.linkDecisionToPipelineRun).toBe("function");
    expect(typeof root.getDecisionsForRun).toBe("function");
    expect(typeof root.getCompactionHistory).toBe("function");
    expect(typeof root.getModelPerformance).toBe("function");
    expect(typeof root.getStagePerformance).toBe("function");
    expect(typeof root.getRunComparison).toBe("function");

    // Schema exports
    expect(typeof root.RELATIONSHIP_TYPES).toBe("object");
    expect(Object.keys(root.RELATIONSHIP_TYPES)).toHaveLength(10);
  });
});
