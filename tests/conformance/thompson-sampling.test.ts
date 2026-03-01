// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import type { ArmStats } from "../../src/graph/queries.js";
import { sampleBeta } from "../../src/patterns/thompson-router/sampler.js";
import { route, buildContextClusterId } from "../../src/patterns/thompson-router/router.js";
import type { RoutableModel, RoutingContext } from "../../src/patterns/thompson-router/types.js";

// ── Helpers ──

function makeModel(id: string, overrides?: Partial<RoutableModel>): RoutableModel {
  return {
    id,
    name: id,
    provider: "test",
    avgLatencyMs: 1000,
    costPer1kTokens: 0.01,
    capabilities: [],
    status: "active",
    ...overrides,
  };
}

function makeStats(seedId: string, alpha: number, beta: number, overrides?: Partial<ArmStats>): ArmStats {
  return {
    seedId,
    alpha,
    beta,
    totalTrials: alpha + beta - 2,
    avgQuality: 0.5,
    avgLatencyMs: 1000,
    avgCost: 0.01,
    totalCost: (alpha + beta - 2) * 0.01,
    ...overrides,
  };
}

const defaultContext: RoutingContext = {
  taskType: "code_generation",
  complexity: "moderate",
  qualityRequirement: 0.7,
};

// ── Thompson Sampling Selection ──

describe("Thompson sampling selection", () => {
  it("selects from available agents with uniform prior (all agents explored)", () => {
    const models = [
      makeModel("agent-a"),
      makeModel("agent-b"),
      makeModel("agent-c"),
    ];
    // No prior stats — all start at Beta(1,1) uniform
    const selected = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const decision = route(defaultContext, models, [], 0);
      selected.add(decision.selectedModelId);
    }
    // With uniform prior, all 3 agents should be selected at least once in 100 trials
    expect(selected.size).toBe(3);
  });

  it("exploits high-success agent when its posterior is tight", () => {
    const models = [makeModel("agent-good"), makeModel("agent-bad")];
    const stats = [
      makeStats("agent-good", 50, 5), // ~91% success rate, tight posterior
      makeStats("agent-bad", 5, 50),  // ~9% success rate, tight posterior
    ];
    let goodCount = 0;
    for (let i = 0; i < 1000; i++) {
      const decision = route(defaultContext, models, stats, i);
      if (decision.selectedModelId === "agent-good") goodCount++;
    }
    // Agent-good should be selected > 85% of the time
    expect(goodCount / 1000).toBeGreaterThan(0.85);
  });

  it("explores uncertain agents occasionally (exploration vs exploitation)", () => {
    const models = [makeModel("well-known"), makeModel("uncertain")];
    const stats = [
      makeStats("well-known", 100, 10), // Well-characterized ~91%
      makeStats("uncertain", 2, 2),       // Very uncertain ~50%
    ];
    let uncertainCount = 0;
    for (let i = 0; i < 200; i++) {
      const decision = route(defaultContext, models, stats, i);
      if (decision.selectedModelId === "uncertain") uncertainCount++;
    }
    // Uncertain agent should be selected at least sometimes due to high variance
    expect(uncertainCount).toBeGreaterThan(0);
  });

  it("throws when no models are available", () => {
    expect(() => route(defaultContext, [], [])).toThrow(
      "No models available for routing",
    );
  });

  it("throws when no active models are available", () => {
    const inactiveModels = [
      makeModel("retired-1", { status: "retired" }),
      makeModel("degraded-1", { status: "inactive" }),
    ];
    expect(() => route(defaultContext, inactiveModels, [])).toThrow(
      "No active models available",
    );
  });
});

// ── Beta Sampling ──

describe("sampleBeta correctness", () => {
  it("produces values in [0, 1]", () => {
    for (let i = 0; i < 100; i++) {
      const sample = sampleBeta(1, 1);
      expect(sample).toBeGreaterThanOrEqual(0);
      expect(sample).toBeLessThanOrEqual(1);
    }
  });

  it("Beta(1,1) mean is approximately 0.5", () => {
    let sum = 0;
    const N = 10000;
    for (let i = 0; i < N; i++) {
      sum += sampleBeta(1, 1);
    }
    const mean = sum / N;
    // Theoretical mean of Beta(1,1) = 0.5
    expect(mean).toBeCloseTo(0.5, 1);
  });

  it("Beta(50,5) mean is approximately 0.909", () => {
    let sum = 0;
    const N = 10000;
    for (let i = 0; i < N; i++) {
      sum += sampleBeta(50, 5);
    }
    const mean = sum / N;
    // Theoretical mean = 50/(50+5) ≈ 0.909
    expect(mean).toBeCloseTo(50 / 55, 1);
  });

  it("rejects non-positive parameters", () => {
    expect(() => sampleBeta(0, 1)).toThrow();
    expect(() => sampleBeta(1, 0)).toThrow();
    expect(() => sampleBeta(-1, 1)).toThrow();
  });
});

// ── Context Cluster ID ──

describe("buildContextClusterId", () => {
  it("builds deterministic ID from context", () => {
    const id = buildContextClusterId({
      taskType: "code_generation",
      complexity: "complex",
      domain: "core",
      qualityRequirement: 0.8,
    });
    expect(id).toBe("code_generation:complex:core");
  });

  it("uses 'general' for undefined domain", () => {
    const id = buildContextClusterId({
      taskType: "review",
      complexity: "moderate",
      qualityRequirement: 0.7,
    });
    expect(id).toBe("review:moderate:general");
  });
});
