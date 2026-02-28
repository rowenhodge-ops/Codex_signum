// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Thompson Sampling Router
 *
 * Verifies the Beta/Gamma sampler and routing decision structure.
 *
 * @see codex-signum-v3.0.md §Thompson Router
 */
import { describe, expect, it } from "vitest";
import { sampleBeta, sampleGamma } from "../../src/patterns/thompson-router/sampler.js";
import { route } from "../../src/patterns/thompson-router/router.js";
import { DEFAULT_ROUTER_CONFIG } from "../../src/patterns/thompson-router/types.js";
import type { RoutableModel, RoutingContext } from "../../src/patterns/thompson-router/types.js";

// ── Samplers ──────────────────────────────────────────────────────────────

describe("sampleBeta — statistical properties", () => {
  it("returns value in [0, 1]", () => {
    for (let i = 0; i < 50; i++) {
      const v = sampleBeta(1, 1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("Beta(1, 1) → approximately uniform [0, 1]", () => {
    const samples: number[] = [];
    for (let i = 0; i < 200; i++) samples.push(sampleBeta(1, 1));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    // Mean of Beta(1,1) = 0.5; allow generous tolerance for stochastic test
    expect(mean).toBeGreaterThan(0.3);
    expect(mean).toBeLessThan(0.7);
  });

  it("Beta(10, 1) → concentrated near 1 (high mean)", () => {
    const samples: number[] = [];
    for (let i = 0; i < 200; i++) samples.push(sampleBeta(10, 1));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    // Mean of Beta(10,1) = 10/11 ≈ 0.909
    expect(mean).toBeGreaterThan(0.7);
  });

  it("Beta(1, 10) → concentrated near 0 (low mean)", () => {
    const samples: number[] = [];
    for (let i = 0; i < 200; i++) samples.push(sampleBeta(1, 10));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    // Mean of Beta(1,10) = 1/11 ≈ 0.091
    expect(mean).toBeLessThan(0.3);
  });

  it("throws for non-positive parameters", () => {
    expect(() => sampleBeta(0, 1)).toThrow();
    expect(() => sampleBeta(1, 0)).toThrow();
    expect(() => sampleBeta(-1, 1)).toThrow();
  });
});

describe("sampleGamma — statistical properties", () => {
  it("returns positive value", () => {
    for (let i = 0; i < 20; i++) {
      expect(sampleGamma(1, 1)).toBeGreaterThan(0);
    }
  });

  it("Gamma(1, 1) mean ≈ 1 (exponential distribution)", () => {
    const samples: number[] = [];
    for (let i = 0; i < 500; i++) samples.push(sampleGamma(1, 1));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeGreaterThan(0.5);
    expect(mean).toBeLessThan(2.0);
  });
});

// ── route() ───────────────────────────────────────────────────────────────

describe("route() — routing decision", () => {
  const models: RoutableModel[] = [
    { id: "m1", provider: "anthropic", status: "active", avgLatencyMs: 500, costPer1kTokens: 0.003, capabilities: [] },
    { id: "m2", provider: "anthropic", status: "active", avgLatencyMs: 800, costPer1kTokens: 0.015, capabilities: [] },
  ];

  const context: RoutingContext = {
    taskType: "generation",
  };

  it("returns a routing decision with a selectedModelId", () => {
    const decision = route(context, models, []);
    expect(decision.selectedModelId).toBeDefined();
    expect(["m1", "m2"]).toContain(decision.selectedModelId);
  });

  it("throws if no models provided", () => {
    expect(() => route(context, [], [])).toThrow();
  });

  it("throws if no active models", () => {
    const inactive: RoutableModel[] = [
      { ...models[0], status: "degraded" },
      { ...models[1], status: "inactive" },
    ];
    expect(() => route(context, inactive, [])).toThrow();
  });

  it("single active model → always selects it", () => {
    for (let i = 0; i < 10; i++) {
      const decision = route(context, [models[0]], []);
      expect(decision.selectedModelId).toBe("m1");
    }
  });
});

// ── DEFAULT_ROUTER_CONFIG ─────────────────────────────────────────────────

describe("DEFAULT_ROUTER_CONFIG", () => {
  it("has forceExploreEvery defined", () => {
    expect(typeof DEFAULT_ROUTER_CONFIG.forceExploreEvery).toBe("number");
    expect(DEFAULT_ROUTER_CONFIG.forceExploreEvery).toBeGreaterThan(0);
  });

  it("has latency and cost penalty factors", () => {
    expect(typeof DEFAULT_ROUTER_CONFIG.latencyPenaltyFactor).toBe("number");
    expect(typeof DEFAULT_ROUTER_CONFIG.costPenaltyFactor).toBe("number");
  });
});
