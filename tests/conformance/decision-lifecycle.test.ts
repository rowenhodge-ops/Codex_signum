// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import type {
  DecisionProps,
  DecisionOutcomeProps,
  ContextClusterProps,
  ArmStats,
} from "../../src/graph/queries.js";
import {
  CORE_BLOOMS,
  bootstrapBlooms,
} from "../../src/bootstrap.js";

// ── Contract: DecisionProps ──

describe("DecisionProps — contract shape", () => {
  it("accepts all required fields", () => {
    const props: DecisionProps = {
      id: "test-dec-001",
      taskType: "code_generation",
      complexity: "complex",
      selectedSeedId: "claude-opus-4-6:adaptive:max",
      wasExploratory: false,
    };
    expect(props.id).toBeTruthy();
    expect(props.selectedSeedId).toBeTruthy();
    expect(["trivial", "moderate", "complex", "critical"]).toContain(
      props.complexity,
    );
  });

  it("accepts optional fields", () => {
    const props: DecisionProps = {
      id: "test-dec-002",
      taskType: "code_generation",
      complexity: "moderate",
      selectedSeedId: "claude-sonnet-4-6:adaptive:high",
      wasExploratory: true,
      domain: "core",
      madeByBloomId: "thompson-router",
      contextClusterId: "code_generation:moderate:core",
      qualityRequirement: 0.8,
    };
    expect(props.domain).toBe("core");
    expect(props.madeByBloomId).toBe("thompson-router");
    expect(props.contextClusterId).toBeTruthy();
    expect(props.qualityRequirement).toBeGreaterThanOrEqual(0);
    expect(props.qualityRequirement).toBeLessThanOrEqual(1);
  });

  it("complexity enum covers all valid values", () => {
    const valid: DecisionProps["complexity"][] = [
      "trivial",
      "moderate",
      "complex",
      "critical",
    ];
    expect(valid).toHaveLength(4);
  });
});

// ── Contract: DecisionOutcomeProps ──

describe("DecisionOutcomeProps — contract shape", () => {
  it("accepts all required fields", () => {
    const props: DecisionOutcomeProps = {
      decisionId: "test-dec-001",
      success: true,
      qualityScore: 0.85,
      durationMs: 12000,
    };
    expect(props.decisionId).toBeTruthy();
    expect(typeof props.success).toBe("boolean");
    expect(props.qualityScore).toBeGreaterThanOrEqual(0);
    expect(props.qualityScore).toBeLessThanOrEqual(1);
    expect(props.durationMs).toBeGreaterThan(0);
  });

  it("accepts optional token and cost fields", () => {
    const props: DecisionOutcomeProps = {
      decisionId: "test-dec-001",
      success: true,
      qualityScore: 0.9,
      durationMs: 5000,
      cost: 0.05,
      inputTokens: 1500,
      outputTokens: 800,
      thinkingTokens: 4000,
      errorType: undefined,
      notes: "Synthetic prior for bootstrap",
    };
    expect(props.cost).toBe(0.05);
    expect(props.inputTokens).toBe(1500);
    expect(props.thinkingTokens).toBe(4000);
  });

  it("accepts failure outcome with errorType", () => {
    const props: DecisionOutcomeProps = {
      decisionId: "test-dec-003",
      success: false,
      qualityScore: 0.1,
      durationMs: 30000,
      errorType: "timeout",
      notes: "Model timed out during generation",
    };
    expect(props.success).toBe(false);
    expect(props.errorType).toBe("timeout");
  });
});

// ── Contract: ArmStats ──

describe("ArmStats — contract shape", () => {
  it("has Thompson prior structure (alpha/beta >= 1)", () => {
    const stats: ArmStats = {
      seedId: "claude-opus-4-6:adaptive:max",
      alpha: 4,
      beta: 2,
      totalTrials: 5,
      avgQuality: 0.75,
      avgLatencyMs: 12000,
      avgCost: 0.05,
      totalCost: 0.25,
    };
    // Thompson: alpha = successes + 1, beta = failures + 1
    expect(stats.alpha).toBeGreaterThanOrEqual(1);
    expect(stats.beta).toBeGreaterThanOrEqual(1);
    expect(stats.totalTrials).toBe(5);
  });

  it("fresh agent has uniform prior (alpha=1, beta=1)", () => {
    const fresh: ArmStats = {
      seedId: "new-model:none",
      alpha: 1,
      beta: 1,
      totalTrials: 0,
      avgQuality: 0,
      avgLatencyMs: 0,
      avgCost: 0,
      totalCost: 0,
    };
    expect(fresh.alpha).toBe(1);
    expect(fresh.beta).toBe(1);
    expect(fresh.totalTrials).toBe(0);
  });

  it("alpha + beta - 2 equals totalTrials", () => {
    const stats: ArmStats = {
      seedId: "test",
      alpha: 8,
      beta: 3,
      totalTrials: 9,
      avgQuality: 0.78,
      avgLatencyMs: 5000,
      avgCost: 0.02,
      totalCost: 0.18,
    };
    // alpha = successes+1, beta = failures+1
    // successes + failures = totalTrials
    // (alpha-1) + (beta-1) = totalTrials
    expect(stats.alpha - 1 + (stats.beta - 1)).toBe(stats.totalTrials);
  });
});

// ── Contract: ContextClusterProps ──

describe("ContextClusterProps — contract shape", () => {
  it("accepts required fields", () => {
    const props: ContextClusterProps = {
      id: "code_generation:complex:core",
      taskType: "code_generation",
      complexity: "complex",
    };
    expect(props.id).toContain(props.taskType);
    expect(props.id).toContain(props.complexity);
  });

  it("accepts optional domain", () => {
    const props: ContextClusterProps = {
      id: "planning:moderate:infrastructure",
      taskType: "planning",
      complexity: "moderate",
      domain: "infrastructure",
    };
    expect(props.domain).toBe("infrastructure");
  });
});

// ── Contract: CORE_BLOOMS ──

describe("CORE_BLOOMS registry", () => {
  it("has exactly 4 patterns", () => {
    expect(CORE_BLOOMS).toHaveLength(4);
  });

  it("contains the 4 expected pattern IDs", () => {
    const ids = CORE_BLOOMS.map((p) => p.id);
    expect(ids).toContain("thompson-router");
    expect(ids).toContain("dev-agent");
    expect(ids).toContain("architect");
    expect(ids).toContain("model-sentinel");
  });

  it("all patterns have required fields", () => {
    for (const p of CORE_BLOOMS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.morphemeKinds).toBeDefined();
      expect(p.morphemeKinds!.length).toBeGreaterThan(0);
      expect(p.domain).toBe("core");
    }
  });

  it("model-sentinel is in design state", () => {
    const sentinel = CORE_BLOOMS.find((p) => p.id === "model-sentinel");
    expect(sentinel).toBeDefined();
    expect(sentinel!.state).toBe("design");
  });

  it("bootstrapBlooms is a function", () => {
    expect(typeof bootstrapBlooms).toBe("function");
  });
});

// ── Integration: Decision lifecycle (requires Neo4j) ──

describe.skipIf(!process.env.NEO4J_URI)(
  "Decision lifecycle — integration (Neo4j required)",
  () => {
    it("round-trips: cluster → decision → outcome → arm stats", async () => {
      const {
        ensureContextCluster,
        recordDecision,
        recordDecisionOutcome,
        getArmStatsForCluster,
      } = await import("../../src/graph/index.js");

      const clusterId = `test-lifecycle-${Date.now()}`;

      await ensureContextCluster({
        id: clusterId,
        taskType: "code_generation",
        complexity: "complex",
      });

      const decisionId = `test-dec-${Date.now()}`;
      await recordDecision({
        id: decisionId,
        taskType: "code_generation",
        complexity: "complex",
        selectedSeedId: "claude-opus-4-6:adaptive:max",
        wasExploratory: false,
        contextClusterId: clusterId,
      });

      await recordDecisionOutcome({
        decisionId,
        success: true,
        qualityScore: 0.85,
        durationMs: 12000,
        cost: 0.05,
      });

      const stats = await getArmStatsForCluster(clusterId);
      const arm = stats.find(
        (s) => s.seedId === "claude-opus-4-6:adaptive:max",
      );
      expect(arm).toBeDefined();
      expect(arm!.alpha).toBe(2); // 1 success + 1 prior
      expect(arm!.beta).toBe(1); // 0 failures + 1 prior
      expect(arm!.totalTrials).toBe(1);
    });
  },
);
