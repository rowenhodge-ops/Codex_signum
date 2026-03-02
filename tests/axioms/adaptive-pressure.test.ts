/**
 * A10. Adaptive Pressure — εR > 0 system-wide. Thompson posteriors update.
 * Learning observable in graph.
 *
 * Tests exploration floor, warning system, Thompson posterior shifting,
 * and human feedback penalty.
 * Level: L4 Outcome + L5 Invariant
 */
import { describe, it, expect } from "vitest";
import {
  computeEpsilonR,
  computeEpsilonRFloor,
  checkEpsilonRWarnings,
  sampleBeta,
  updateArmStats,
  freshArmStats,
  route,
  DEFAULT_ROUTER_CONFIG,
  type RoutableModel,
} from "../../src/index.js";

describe("A10 Adaptive Pressure: εR floor enforcement", () => {
  it("computeEpsilonRFloor always returns > 0", () => {
    // Even with zero imperative gradient and no spectral ratio
    const floor = computeEpsilonRFloor(0.01, 0, undefined);
    expect(floor).toBeGreaterThan(0);
  });

  it("computeEpsilonRFloor never drops below 0.01", () => {
    const testCases = [
      { base: 0, gradient: 0 },
      { base: 0, gradient: 1 },
      { base: 0.001, gradient: 0 },
    ];
    for (const tc of testCases) {
      const floor = computeEpsilonRFloor(tc.base, tc.gradient);
      expect(floor).toBeGreaterThanOrEqual(0.01);
    }
  });
});

describe("A10 Adaptive Pressure: warning system fires on constitutional violation", () => {
  it("εR=0 on active pattern fires critical warning", () => {
    const eR = computeEpsilonR(0, 100, 0);
    // Force value to 0 for testing (normally floor prevents this)
    const forcedZero = { ...eR, value: 0 };
    const warnings = checkEpsilonRWarnings(forcedZero, 0.8, true);
    expect(warnings.some((w) => w.level === "critical")).toBe(true);
  });

  it("εR=0 on inactive pattern does NOT fire", () => {
    const eR = computeEpsilonR(0, 100, 0);
    const forcedZero = { ...eR, value: 0 };
    const warnings = checkEpsilonRWarnings(forcedZero, 0.8, false);
    expect(warnings.some((w) => w.level === "critical")).toBe(false);
  });
});

describe("A10 Adaptive Pressure: Thompson betaSample produces variance", () => {
  it("uniform prior (1,1) produces different values across 50 samples", () => {
    const samples = Array.from({ length: 50 }, () => sampleBeta(1, 1));
    const unique = new Set(samples);
    expect(unique.size).toBeGreaterThan(5);
  });

  it("strong posterior (50,5) still produces some variance", () => {
    const samples = Array.from({ length: 50 }, () => sampleBeta(50, 5));
    const unique = new Set(samples);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe("A10 Adaptive Pressure: Thompson posterior shifts after outcome sequence", () => {
  it("5 successes increase alpha, shifting posterior upward", () => {
    let stats = freshArmStats("test-seed");
    const initialAlpha = stats.alpha;

    for (let i = 0; i < 5; i++) {
      stats = updateArmStats(stats, {
        success: true,
        qualityScore: 0.9,
        durationMs: 100,
        cost: 0.01,
      });
    }

    expect(stats.alpha).toBe(initialAlpha + 5);
    expect(stats.beta).toBe(1); // No failures
    expect(stats.totalTrials).toBe(5);
  });

  it("5 failures increase beta, shifting posterior downward", () => {
    let stats = freshArmStats("test-seed");
    const initialBeta = stats.beta;

    for (let i = 0; i < 5; i++) {
      stats = updateArmStats(stats, {
        success: false,
        qualityScore: 0.2,
        durationMs: 200,
        cost: 0.02,
      });
    }

    expect(stats.beta).toBe(initialBeta + 5);
    expect(stats.alpha).toBe(1); // No successes
  });

  it("mixed outcomes (5 success, 5 fail) produce distinct posterior from uniform", () => {
    let stats = freshArmStats("test-seed");

    for (let i = 0; i < 5; i++) {
      stats = updateArmStats(stats, { success: true, qualityScore: 0.9, durationMs: 100, cost: 0.01 });
    }
    for (let i = 0; i < 5; i++) {
      stats = updateArmStats(stats, { success: false, qualityScore: 0.2, durationMs: 200, cost: 0.02 });
    }

    // Posterior is now Beta(6, 6) — distinct from prior Beta(1,1)
    expect(stats.alpha).toBe(6);
    expect(stats.beta).toBe(6);
    expect(stats.totalTrials).toBe(10);
  });
});

describe("A10 Adaptive Pressure: Thompson selects successful models more often", () => {
  it("model with 10 successes selected >80% of the time vs model with 0", () => {
    const models: RoutableModel[] = [
      { id: "strong", name: "Strong", provider: "test", avgLatencyMs: 100, costPer1kTokens: 0.01, capabilities: ["analysis"], status: "active" },
      { id: "weak", name: "Weak", provider: "test", avgLatencyMs: 100, costPer1kTokens: 0.01, capabilities: ["analysis"], status: "active" },
    ];

    const statsForStrong = freshArmStats("strong");
    let strong = statsForStrong;
    for (let i = 0; i < 10; i++) {
      strong = updateArmStats(strong, { success: true, qualityScore: 0.95, durationMs: 100, cost: 0.01 });
    }

    const weak = freshArmStats("weak"); // uniform prior

    const ctx = { taskType: "analysis", complexity: "moderate" as const, qualityRequirement: 0.7 };

    let strongCount = 0;
    for (let i = 0; i < 100; i++) {
      const decision = route(ctx, models, [strong, weak], i, DEFAULT_ROUTER_CONFIG);
      if (decision.selectedModelId === "strong") strongCount++;
    }

    expect(strongCount).toBeGreaterThan(80);
  });
});
