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

// ============ assessTaskQuality ============

describe("assessTaskQuality", () => {
  it("returns 0.5 baseline for minimal successful output", () => {
    // Short output (≤200), no hallucinations, succeeded, slow (≥60s)
    const score = assessTaskQuality(50, 0, "succeeded", 120000);
    // base=0.5, +0.2 (no hallucinations), no length bonus, no speed bonus
    expect(score).toBe(0.7);
  });

  it("returns higher score for long clean fast output", () => {
    // >200 chars, 0 hallucination flags, succeeded, fast
    const score = assessTaskQuality(5000, 0, "succeeded", 5000);
    // base=0.5 + 0.2 (length) + 0.2 (no hallucinations) + 0.1 (fast) = 1.0
    expect(score).toBeCloseTo(1.0, 10);
  });

  it("penalizes failed tasks", () => {
    // status === "failed" → -0.3
    const score = assessTaskQuality(0, 0, "failed", 0);
    // base=0.5 + 0.2 (no hallucinations) + 0.1 (fast) - 0.3 (failed) = 0.5
    expect(score).toBeCloseTo(0.5, 10);
  });

  it("penalizes hallucination flags", () => {
    // hallucinationFlagCount = 2 → -0.2
    const score = assessTaskQuality(5000, 2, "succeeded", 5000);
    // base=0.5 + 0.2 (length) - 0.2 (hallucinations=2) + 0.1 (fast) = 0.6
    // Note: hallucinationFlagCount > 0, so no +0.2 clean bonus
    expect(score).toBeCloseTo(0.6, 10);
  });

  it("clamps to [0, 1] range", () => {
    // Best case can't exceed 1.0
    const best = assessTaskQuality(10000, 0, "succeeded", 100);
    expect(best).toBeLessThanOrEqual(1.0);
    expect(best).toBeGreaterThanOrEqual(0.0);

    // Worst case: failed, lots of hallucinations, but clamps to 0
    const worst = assessTaskQuality(0, 10, "failed", 120000);
    expect(worst).toBeGreaterThanOrEqual(0.0);
    expect(worst).toBeLessThanOrEqual(1.0);
  });

  it("hallucination penalty caps at -0.3", () => {
    // 5 flags → penalty = min(5 * 0.1, 0.3) = 0.3
    const fiveFlags = assessTaskQuality(5000, 5, "succeeded", 5000);
    const tenFlags = assessTaskQuality(5000, 10, "succeeded", 5000);
    // Both should have same penalty (-0.3 cap)
    expect(fiveFlags).toBe(tenFlags);
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
