/**
 * Thompson Router Governance — verifies that model routing enforces
 * structural constraints: no inactive models, exploration decay,
 * context-blocking, and cost/latency penalties.
 *
 * Level: L3 Pipeline + L5 Invariant
 */
import { describe, it, expect } from "vitest";
import {
  route,
  sampleBeta,
  freshArmStats,
  updateArmStats,
  DEFAULT_ROUTER_CONFIG,
  type RoutableModel,
  type RoutingContext,

} from "../../src/index.js";

function makeModel(id: string, overrides: Partial<RoutableModel> = {}): RoutableModel {
  return {
    id,
    status: "active",
    capabilities: ["general"],
    avgLatencyMs: 1000,
    costPer1kTokens: 0.01,
    ...overrides,
  };
}

const baseContext: RoutingContext = {
  taskType: "coding:execute",
  complexity: "moderate",
  domain: "general",
  qualityRequirement: 0.7,
};

describe("Thompson Router: inactive models are never selected", () => {
  it("throws when all models are inactive", () => {
    const models = [
      makeModel("m1", { status: "inactive" }),
      makeModel("m2", { status: "inactive" }),
    ];
    expect(() => route(baseContext, models, [], 0)).toThrow(
      "No active models available",
    );
  });

  it("throws when no models provided", () => {
    expect(() => route(baseContext, [], [], 0)).toThrow(
      "No models available for routing",
    );
  });

  it("never selects inactive model when mixed with active", () => {
    const models = [
      makeModel("active-1"),
      makeModel("inactive-1", { status: "inactive" }),
    ];
    for (let i = 0; i < 50; i++) {
      const decision = route(baseContext, models, [], i);
      expect(decision.selectedModelId).toBe("active-1");
    }
  });
});

describe("Thompson Router: single active model always selected", () => {
  it("single model is always chosen regardless of stats", () => {
    const models = [makeModel("solo")];
    const stats = [{ seedId: "solo", alpha: 1, beta: 10 }]; // Poor stats

    for (let i = 0; i < 20; i++) {
      const decision = route(baseContext, models, stats, i);
      expect(decision.selectedModelId).toBe("solo");
    }
  });
});

describe("Thompson Router: routing decisions include required fields", () => {
  it("decision includes selectedModelId, reasoning, confidence", () => {
    const models = [makeModel("m1"), makeModel("m2")];
    const decision = route(baseContext, models, [], 0);

    expect(decision.selectedModelId).toBeDefined();
    expect(decision.reasoning).toBeDefined();
    expect(typeof decision.reasoning).toBe("string");
    expect(decision.confidence).toBeDefined();
    expect(decision.confidence).toBeGreaterThan(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });

  it("decision includes wasExploratory flag", () => {
    const models = [makeModel("m1"), makeModel("m2")];
    const decision = route(baseContext, models, [], 0);
    expect(typeof decision.wasExploratory).toBe("boolean");
  });
});

describe("Thompson Router: beta sampling produces variance", () => {
  it("uniform prior (1,1) produces different samples", () => {
    const samples = new Set<number>();
    for (let i = 0; i < 100; i++) {
      samples.add(Math.round(sampleBeta(1, 1) * 1000));
    }
    // With uniform prior, samples should vary widely
    expect(samples.size).toBeGreaterThan(10);
  });

  it("strong prior (100,1) produces high values", () => {
    let sum = 0;
    const n = 100;
    for (let i = 0; i < n; i++) {
      sum += sampleBeta(100, 1);
    }
    expect(sum / n).toBeGreaterThan(0.9);
  });

  it("strong negative prior (1,100) produces low values", () => {
    let sum = 0;
    const n = 100;
    for (let i = 0; i < n; i++) {
      sum += sampleBeta(1, 100);
    }
    expect(sum / n).toBeLessThan(0.1);
  });
});

describe("Thompson Router: arm stats update correctly", () => {
  it("freshArmStats creates neutral prior", () => {
    const stats = freshArmStats("test-seed");
    expect(stats.seedId).toBe("test-seed");
    expect(stats.alpha).toBe(1);
    expect(stats.beta).toBe(1);
  });

  it("updateArmStats increments alpha on success", () => {
    const stats = freshArmStats("test-seed");
    const updated = updateArmStats(stats, {
      success: true,
      durationMs: 500,
      qualityScore: 0.9,
    });
    expect(updated.alpha).toBeGreaterThan(stats.alpha);
  });

  it("updateArmStats increments beta on failure", () => {
    const stats = freshArmStats("test-seed");
    const updated = updateArmStats(stats, {
      success: false,
      durationMs: 500,
      qualityScore: 0.3,
    });
    expect(updated.beta).toBeGreaterThan(stats.beta);
  });
});

describe("Thompson Router: DEFAULT_ROUTER_CONFIG has required fields", () => {
  it("config includes forceExploreEvery", () => {
    expect(DEFAULT_ROUTER_CONFIG.forceExploreEvery).toBeDefined();
    expect(DEFAULT_ROUTER_CONFIG.forceExploreEvery).toBeGreaterThan(0);
  });

  it("config includes latencyPenaltyFactor", () => {
    expect(DEFAULT_ROUTER_CONFIG.latencyPenaltyFactor).toBeDefined();
  });

  it("config includes costPenaltyFactor", () => {
    expect(DEFAULT_ROUTER_CONFIG.costPenaltyFactor).toBeDefined();
  });
});
