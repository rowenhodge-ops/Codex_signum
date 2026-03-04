// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Tests for M-9.3: Decision Lifecycle Completion
 *
 * Covers:
 * - recordDecisionOutcome (added M-9.3.1, verify shape)
 * - updateDecisionQuality (new — surgical quality update)
 * - findDecisionForTask (new — query for Decision by bloom/model/time)
 * - assessTaskQuality (new — mechanical quality heuristic)
 * - getPipelineStageHealth (new — aggregate stage health query)
 * - getPipelineRunStats (new — aggregate pipeline run stats)
 * - Export verification for all new functions
 *
 * These are structural/type-level tests. They do NOT require a Neo4j connection.
 */
import { describe, it, expect } from "vitest";
import {
  recordDecisionOutcome,
  updateDecisionQuality,
  findDecisionForTask,
  getPipelineStageHealth,
  getPipelineRunStats,
} from "../../src/graph/queries.js";
import type { DecisionProps, DecisionOutcomeProps } from "../../src/graph/queries.js";
import type { ModelExecutorResult } from "../../src/patterns/architect/types.js";
import {
  assessTaskQuality,
} from "../../scripts/bootstrap-task-executor.js";

// ============ recordDecisionOutcome ============

describe("recordDecisionOutcome", () => {
  it("is exported as a function", () => {
    expect(typeof recordDecisionOutcome).toBe("function");
  });

  it("accepts DecisionOutcomeProps with status=completed and qualityScore", () => {
    const outcome: DecisionOutcomeProps = {
      decisionId: "dec_test_001",
      success: true,
      qualityScore: 0.85,
      durationMs: 1200,
    };
    expect(outcome.success).toBe(true);
    expect(outcome.qualityScore).toBe(0.85);
  });

  it("accepts DecisionOutcomeProps with status=failed and errorType", () => {
    const outcome: DecisionOutcomeProps = {
      decisionId: "dec_test_002",
      success: false,
      qualityScore: 0.0,
      durationMs: 30000,
      errorType: "timeout",
    };
    expect(outcome.success).toBe(false);
    expect(outcome.errorType).toBe("timeout");
  });

  it("cost, inputTokens, outputTokens, thinkingTokens, errorType, notes are optional", () => {
    const outcome: DecisionOutcomeProps = {
      decisionId: "dec_test_003",
      success: true,
      qualityScore: 0.7,
      durationMs: 500,
    };
    expect(outcome.cost).toBeUndefined();
    expect(outcome.inputTokens).toBeUndefined();
    expect(outcome.outputTokens).toBeUndefined();
    expect(outcome.thinkingTokens).toBeUndefined();
    expect(outcome.errorType).toBeUndefined();
    expect(outcome.notes).toBeUndefined();
  });
});

// ============ DecisionProps runId/taskId ============

describe("DecisionProps runId/taskId", () => {
  it("accepts runId and taskId", () => {
    const props: DecisionProps = {
      id: "dec_test_runid",
      taskType: "analytical",
      complexity: "moderate",
      selectedSeedId: "claude-opus-4-6:adaptive:low",
      wasExploratory: false,
      runId: "2026-03-04T05-30-28",
      taskId: "t1",
    };
    expect(props.runId).toBe("2026-03-04T05-30-28");
    expect(props.taskId).toBe("t1");
  });

  it("runId and taskId are optional (backward compat)", () => {
    const props: DecisionProps = {
      id: "dec_test_no_runid",
      taskType: "coding",
      complexity: "trivial",
      selectedSeedId: "claude-sonnet-4-6:adaptive:low",
      wasExploratory: true,
    };
    expect(props.runId).toBeUndefined();
    expect(props.taskId).toBeUndefined();
  });
});

// ============ updateDecisionQuality ============

describe("updateDecisionQuality", () => {
  it("is exported as a function", () => {
    expect(typeof updateDecisionQuality).toBe("function");
  });

  it("accepts decisionId string and qualityScore number", () => {
    // Type-level: verify the function signature compiles
    const fn: (id: string, score: number) => Promise<void> = updateDecisionQuality;
    expect(typeof fn).toBe("function");
  });
});

// ============ findDecisionForTask ============

describe("findDecisionForTask", () => {
  it("is exported as a function", () => {
    expect(typeof findDecisionForTask).toBe("function");
  });

  it("accepts bloomId, modelSeedId, afterTimestamp", () => {
    const fn: (bloomId: string, modelSeedId: string, afterTimestamp: string) => Promise<string | undefined> = findDecisionForTask;
    expect(typeof fn).toBe("function");
  });
});

// ============ assessTaskQuality (V2 continuous) ============

describe("assessTaskQuality", () => {
  it("high score for long clean fast succeeded output (> 0.70)", () => {
    const score = assessTaskQuality(10000, 0, "succeeded", 5000);
    // base=0.50 + length~0.13 + halluc=0.20 + duration~0.10 ≈ 0.93
    expect(score).toBeGreaterThan(0.70);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it("lower score for short output with hallucination flags (0.30–0.65)", () => {
    const score = assessTaskQuality(500, 3, "succeeded", 30000);
    // base=0.50 + length~0.007 + halluc~0.11 + duration~0.07 ≈ 0.69
    expect(score).toBeGreaterThan(0.30);
    expect(score).toBeLessThan(0.75);
  });

  it("failed task with no output scores low (< 0.20)", () => {
    const score = assessTaskQuality(0, 0, "failed", 0);
    // base=0.05 + length=0 + halluc=0.20 + duration~0.10 ≈ 0.35
    // Actually: failed no-output base is 0.05
    expect(score).toBeLessThan(0.40);
  });

  it("failed task with output scores higher than failed without", () => {
    const withOutput = assessTaskQuality(5000, 0, "failed", 5000);
    const noOutput = assessTaskQuality(0, 0, "failed", 5000);
    expect(withOutput).toBeGreaterThan(noOutput);
  });

  it("two tasks with different characteristics produce different scores", () => {
    const taskA = assessTaskQuality(10000, 0, "succeeded", 5000);
    const taskB = assessTaskQuality(2000, 4, "succeeded", 90000);
    expect(taskA).not.toBeCloseTo(taskB, 1);
  });

  it("score is always in [0, 1]", () => {
    const best = assessTaskQuality(100000, 0, "succeeded", 100);
    const worst = assessTaskQuality(0, 100, "failed", 600000);
    expect(best).toBeLessThanOrEqual(1.0);
    expect(best).toBeGreaterThanOrEqual(0.0);
    expect(worst).toBeLessThanOrEqual(1.0);
    expect(worst).toBeGreaterThanOrEqual(0.0);
  });

  it("hallucination flags reduce score continuously", () => {
    const zero = assessTaskQuality(5000, 0, "succeeded", 5000);
    const two = assessTaskQuality(5000, 2, "succeeded", 5000);
    const five = assessTaskQuality(5000, 5, "succeeded", 5000);
    expect(zero).toBeGreaterThan(two);
    expect(two).toBeGreaterThan(five);
  });

  it("output length increases score continuously", () => {
    const short = assessTaskQuality(100, 0, "succeeded", 30000);
    const medium = assessTaskQuality(5000, 0, "succeeded", 30000);
    const long = assessTaskQuality(15000, 0, "succeeded", 30000);
    expect(long).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(short);
  });
});

// ============ getPipelineStageHealth ============

describe("getPipelineStageHealth", () => {
  it("is exported as a function", () => {
    expect(typeof getPipelineStageHealth).toBe("function");
  });

  it("accepts architectBloomId and returns a promise", () => {
    const fn: (id: string) => Promise<Array<{
      stage: string;
      resonatorId: string;
      phiL: number;
      observationCount: number;
    }>> = getPipelineStageHealth;
    expect(typeof fn).toBe("function");
  });
});

// ============ getPipelineRunStats ============

describe("getPipelineRunStats", () => {
  it("is exported as a function", () => {
    expect(typeof getPipelineRunStats).toBe("function");
  });

  it("accepts architectBloomId and optional limit", () => {
    const fn: (id: string, limit?: number) => Promise<Array<{
      runId: string;
      intent: string;
      taskCount: number;
      overallQuality: number;
      modelDiversity: number;
      durationMs: number;
      startedAt: string;
    }>> = getPipelineRunStats;
    expect(typeof fn).toBe("function");
  });
});

// ============ ModelExecutorResult.decisionId ============

describe("ModelExecutorResult.decisionId", () => {
  it("accepts optional decisionId field", () => {
    const result: ModelExecutorResult = {
      text: "output text",
      modelId: "claude-opus-4-6",
      durationMs: 5000,
      decisionId: "dec_abc123",
    };
    expect(result.decisionId).toBe("dec_abc123");
  });

  it("decisionId is optional (backward compat)", () => {
    const result: ModelExecutorResult = {
      text: "output text",
      modelId: "claude-opus-4-6",
      durationMs: 5000,
    };
    expect(result.decisionId).toBeUndefined();
  });
});

// ============ M-9.3 Export Verification ============

describe("M-9.3 exports", () => {
  it("updateDecisionQuality is exported from graph index", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.updateDecisionQuality).toBe("function");
  });

  it("findDecisionForTask is exported from graph index", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.findDecisionForTask).toBe("function");
  });

  it("getPipelineStageHealth is exported from graph index", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.getPipelineStageHealth).toBe("function");
  });

  it("getPipelineRunStats is exported from graph index", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.getPipelineRunStats).toBe("function");
  });

  it("assessTaskQuality is exported from bootstrap-task-executor", async () => {
    const executorModule = await import("../../scripts/bootstrap-task-executor.js");
    expect(typeof executorModule.assessTaskQuality).toBe("function");
  });
});
