// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Patterns
 *
 * Tests Thompson Router (Resonator), DevAgent pipeline presets,
 * and Observer feedback mechanics.
 */
import { describe, expect, it } from "vitest";
import type { ArmStats } from "../../src/graph/queries.js";
import {
  buildContextClusterId,
  DEFAULT_ROUTER_CONFIG,
  route,
  sampleBeta,
  type RoutableModel,
  type RoutingContext,
} from "../../src/patterns/thompson-router/index.js";

// ============ THOMPSON SAMPLING ============

describe("sampleBeta", () => {
  it("returns values in [0, 1]", () => {
    for (let i = 0; i < 100; i++) {
      const sample = sampleBeta(2, 5);
      expect(sample).toBeGreaterThanOrEqual(0);
      expect(sample).toBeLessThanOrEqual(1);
    }
  });

  it("with uniform prior (1,1), mean ≈ 0.5", () => {
    const samples = Array.from({ length: 1000 }, () => sampleBeta(1, 1));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeCloseTo(0.5, 1); // Within 0.1 of 0.5
  });

  it("with strong success prior (100,1), mean ≈ 1.0", () => {
    const samples = Array.from({ length: 200 }, () => sampleBeta(100, 1));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeGreaterThan(0.95);
  });

  it("with strong failure prior (1,100), mean ≈ 0.0", () => {
    const samples = Array.from({ length: 200 }, () => sampleBeta(1, 100));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeLessThan(0.05);
  });

  it("throws for non-positive parameters", () => {
    expect(() => sampleBeta(0, 1)).toThrow();
    expect(() => sampleBeta(1, -1)).toThrow();
  });
});

// ============ ROUTING ============

const testModels: RoutableModel[] = [
  {
    id: "gemini-flash",
    name: "Gemini 2.5 Flash",
    provider: "vertex-ai",
    baseModelId: "gemini-2.5-flash",
    thinkingMode: "default",
    avgLatencyMs: 3000,
    costPer1kTokens: 0.001,
    capabilities: ["code_generation", "review"],
    status: "active",
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku 3.5",
    provider: "anthropic",
    baseModelId: "claude-haiku-3-5",
    thinkingMode: "extended",
    avgLatencyMs: 7000,
    costPer1kTokens: 0.002,
    capabilities: ["code_generation", "review"],
    status: "active",
  },
  {
    id: "mistral-medium",
    name: "Mistral Medium 3",
    provider: "vertex-ai",
    baseModelId: "mistral-medium-3",
    thinkingMode: "default",
    avgLatencyMs: 2700,
    costPer1kTokens: 0.001,
    capabilities: ["code_generation"],
    status: "active",
  },
];

const testContext: RoutingContext = {
  taskType: "code_generation",
  complexity: "moderate",
  qualityRequirement: 0.8,
};

describe("route", () => {
  it("selects from active models only", () => {
    const modelsWithInactive = [
      ...testModels,
      {
        id: "inactive-model",
        name: "Inactive",
        provider: "test",
        avgLatencyMs: 100,
        costPer1kTokens: 0,
        capabilities: [],
        status: "inactive" as const,
      },
    ];

    const armStats: ArmStats[] = [];
    const decision = route(testContext, modelsWithInactive, armStats);

    expect(decision.selectedModelId).not.toBe("inactive-model");
  });

  it("returns all required decision fields", () => {
    const decision = route(testContext, testModels, []);
    expect(decision.selectedModelId).toBeDefined();
    expect(typeof decision.wasExploratory).toBe("boolean");
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
    expect(decision.contextClusterId).toBe("code_generation:moderate:general");
    expect(decision.reasoning).toContain("code_generation");
    expect(decision.sampledValues.size).toBe(3);
  });

  it("favors high-alpha model (exploitation)", () => {
    // Give gemini-flash very strong track record
    const armStats: ArmStats[] = [
      {
        seedId: "gemini-flash",
        alpha: 100,
        beta: 2,
        totalTrials: 100,
        avgQuality: 0.95,
        avgLatencyMs: 3000,
      },
      {
        seedId: "claude-haiku",
        alpha: 5,
        beta: 10,
        totalTrials: 13,
        avgQuality: 0.4,
        avgLatencyMs: 7000,
      },
      {
        seedId: "mistral-medium",
        alpha: 3,
        beta: 3,
        totalTrials: 4,
        avgQuality: 0.5,
        avgLatencyMs: 2700,
      },
    ];

    // Run multiple times — should mostly pick gemini-flash
    let geminiCount = 0;
    for (let i = 0; i < 50; i++) {
      const d = route(testContext, testModels, armStats, i);
      if (d.selectedModelId === "gemini-flash") geminiCount++;
    }
    // Should be selected most of the time (>70%)
    expect(geminiCount).toBeGreaterThan(35);
  });

  it("throws for empty model list", () => {
    expect(() => route(testContext, [], [])).toThrow("No models available");
  });

  it("throws for all inactive models", () => {
    const inactiveOnly = testModels.map((m) => ({
      ...m,
      status: "inactive" as const,
    }));
    expect(() => route(testContext, inactiveOnly, [])).toThrow(
      "No active models",
    );
  });
});

describe("buildContextClusterId", () => {
  it("builds deterministic cluster ID", () => {
    expect(
      buildContextClusterId({
        taskType: "code_generation",
        complexity: "complex",
        qualityRequirement: 0.9,
      }),
    ).toBe("code_generation:complex:general");
  });

  it("includes domain when provided", () => {
    expect(
      buildContextClusterId({
        taskType: "review",
        complexity: "trivial",
        domain: "typescript",
        qualityRequirement: 0.8,
      }),
    ).toBe("review:trivial:typescript");
  });
});

// ============ DEFAULT CONFIG ============

describe("DEFAULT_ROUTER_CONFIG", () => {
  it("has εR floor > 0 (Axiom 5)", () => {
    expect(DEFAULT_ROUTER_CONFIG.epsilonFloor).toBeGreaterThan(0);
  });

  it("has force-explore interval", () => {
    expect(DEFAULT_ROUTER_CONFIG.forceExploreEvery).toBeGreaterThan(0);
  });

  it("has quality floor", () => {
    expect(DEFAULT_ROUTER_CONFIG.qualityFloor).toBeGreaterThan(0);
    expect(DEFAULT_ROUTER_CONFIG.qualityFloor).toBeLessThanOrEqual(1);
  });
});

// ============ PIPELINE PRESETS ============

describe("PIPELINE_PRESETS", () => {
  // Dynamic import to avoid pulling in complex dependencies
  it("exports pipeline presets from dev-agent", async () => {
    const { PIPELINE_PRESETS } =
      await import("../../src/patterns/dev-agent/index.js");
    expect(PIPELINE_PRESETS).toBeDefined();
    expect(typeof PIPELINE_PRESETS).toBe("object");

    // Should have common pipeline configurations
    const keys = Object.keys(PIPELINE_PRESETS);
    expect(keys.length).toBeGreaterThan(0);
  });
});
