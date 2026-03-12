// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Resilience & Metrics
 *
 * Verifies circuit breaker behavior, RTY computation, and feedback effectiveness.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  ProviderCircuitBreaker,
  computeCooldown,
} from "../../src/resilience/circuit-breaker.js";
import {
  computeRTY,
  computePercentCA,
  stageResultsToAttempts,
  type StageAttempt,
} from "../../src/metrics/rty.js";
import { computeFeedbackEffectiveness } from "../../src/metrics/feedback-effectiveness.js";

describe("ProviderCircuitBreaker", () => {
  it("starts in closed state — all providers available", () => {
    const breaker = new ProviderCircuitBreaker();
    expect(breaker.isAvailable("anthropic")).toBe(true);
    expect(breaker.isAvailable("vertex")).toBe(true);
    expect(breaker.getAllStates()).toHaveLength(0);
  });

  it("opens after 3 consecutive failures (default threshold)", () => {
    const breaker = new ProviderCircuitBreaker();
    breaker.recordFailure("anthropic");
    breaker.recordFailure("anthropic");
    expect(breaker.isAvailable("anthropic")).toBe(true); // 2 < 3
    breaker.recordFailure("anthropic");
    expect(breaker.isAvailable("anthropic")).toBe(false); // 3 >= 3 → open
  });

  it("half-open requires multiple probe successes to close", () => {
    vi.useFakeTimers();
    try {
      const breaker = new ProviderCircuitBreaker({
        cooldownBaseMs: 1000,
        cooldownMaxMs: 10_000,
        halfOpenProbes: 5,
      });

      // Trip open
      for (let i = 0; i < 3; i++) breaker.recordFailure("anthropic");
      expect(breaker.isAvailable("anthropic")).toBe(false);

      // Advance past max cooldown to guarantee half-open
      vi.advanceTimersByTime(10_001);
      expect(breaker.isAvailable("anthropic")).toBe(true); // half_open

      // 4 successes: still half-open, not yet closed
      for (let i = 0; i < 4; i++) breaker.recordSuccess("anthropic");
      const states = breaker.getAllStates();
      const circuit = states.find((s) => s.provider === "anthropic")!;
      expect(circuit.state).toBe("half_open");
      expect(circuit.halfOpenSuccesses).toBe(4);

      // 5th success → closed
      breaker.recordSuccess("anthropic");
      const afterClose = breaker
        .getAllStates()
        .find((s) => s.provider === "anthropic")!;
      expect(afterClose.state).toBe("closed");
      expect(afterClose.tripCount).toBe(0); // reset on full recovery
      expect(afterClose.halfOpenSuccesses).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("half-open failure re-opens and increments tripCount", () => {
    vi.useFakeTimers();
    try {
      const breaker = new ProviderCircuitBreaker({
        cooldownBaseMs: 1000,
        cooldownMaxMs: 10_000,
        halfOpenProbes: 5,
      });

      // Trip open once
      for (let i = 0; i < 3; i++) breaker.recordFailure("vertex");
      vi.advanceTimersByTime(10_001);
      expect(breaker.isAvailable("vertex")).toBe(true); // half_open

      // 2 successes, then a failure
      breaker.recordSuccess("vertex");
      breaker.recordSuccess("vertex");
      breaker.recordFailure("vertex"); // re-open

      const circuit = breaker
        .getAllStates()
        .find((s) => s.provider === "vertex")!;
      expect(circuit.state).toBe("open");
      expect(circuit.tripCount).toBe(2); // opened once initially (trip 1), then half-open failure (trip 2)
      expect(circuit.halfOpenSuccesses).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("resets to closed on success (from closed state)", () => {
    const breaker = new ProviderCircuitBreaker();
    breaker.recordFailure("anthropic");
    breaker.recordFailure("anthropic");
    // Still closed (2 < 3), record success resets
    breaker.recordSuccess("anthropic");
    expect(breaker.isAvailable("anthropic")).toBe(true);
    const circuit = breaker
      .getAllStates()
      .find((s) => s.provider === "anthropic")!;
    expect(circuit.consecutiveFailures).toBe(0);
  });

  it("transitions to half_open after cooldown", () => {
    vi.useFakeTimers();
    try {
      const breaker = new ProviderCircuitBreaker({
        cooldownBaseMs: 1000,
        cooldownMaxMs: 10_000,
      });
      breaker.recordFailure("vertex");
      breaker.recordFailure("vertex");
      breaker.recordFailure("vertex");
      expect(breaker.isAvailable("vertex")).toBe(false);

      // Advance past max cooldown to guarantee transition
      vi.advanceTimersByTime(10_001);
      expect(breaker.isAvailable("vertex")).toBe(true); // half_open probe
    } finally {
      vi.useRealTimers();
    }
  });

  it("accepts custom failure threshold", () => {
    const breaker = new ProviderCircuitBreaker({ failureThreshold: 5 });
    for (let i = 0; i < 4; i++) breaker.recordFailure("vertex");
    expect(breaker.isAvailable("vertex")).toBe(true); // 4 < 5
    breaker.recordFailure("vertex");
    expect(breaker.isAvailable("vertex")).toBe(false); // 5 >= 5
  });

  it("filterAvailable removes open providers", () => {
    const breaker = new ProviderCircuitBreaker();
    for (let i = 0; i < 3; i++) breaker.recordFailure("anthropic");
    const candidates = [
      { id: "a", provider: "anthropic" },
      { id: "b", provider: "vertex" },
      { id: "c", provider: "anthropic" },
    ];
    const available = breaker.filterAvailable(candidates);
    expect(available).toHaveLength(1);
    expect(available[0].provider).toBe("vertex");
  });

  it("getOpenCircuits returns only open/half_open", () => {
    const breaker = new ProviderCircuitBreaker();
    breaker.recordSuccess("vertex");
    for (let i = 0; i < 3; i++) breaker.recordFailure("anthropic");
    const open = breaker.getOpenCircuits();
    expect(open).toHaveLength(1);
    expect(open[0].provider).toBe("anthropic");
  });

  it("resetAll clears all circuits", () => {
    const breaker = new ProviderCircuitBreaker();
    for (let i = 0; i < 3; i++) breaker.recordFailure("anthropic");
    breaker.resetAll();
    expect(breaker.isAvailable("anthropic")).toBe(true);
    expect(breaker.getAllStates()).toHaveLength(0);
  });

  it("does not affect unrelated providers", () => {
    const breaker = new ProviderCircuitBreaker();
    for (let i = 0; i < 3; i++) breaker.recordFailure("anthropic");
    expect(breaker.isAvailable("anthropic")).toBe(false);
    expect(breaker.isAvailable("vertex")).toBe(true);
  });

  it("tripCount resets after successful half-open → closed transition", () => {
    vi.useFakeTimers();
    try {
      const breaker = new ProviderCircuitBreaker({
        cooldownBaseMs: 1000,
        cooldownMaxMs: 10_000,
        halfOpenProbes: 5,
      });

      // Trip open twice (open → half-open fail → open again)
      for (let i = 0; i < 3; i++) breaker.recordFailure("anthropic");
      vi.advanceTimersByTime(10_001);
      breaker.isAvailable("anthropic"); // transition to half_open
      breaker.recordFailure("anthropic"); // re-open, tripCount = 2

      // Now recover fully
      vi.advanceTimersByTime(10_001);
      breaker.isAvailable("anthropic"); // half_open again
      for (let i = 0; i < 5; i++) breaker.recordSuccess("anthropic");

      const circuit = breaker
        .getAllStates()
        .find((s) => s.provider === "anthropic")!;
      expect(circuit.state).toBe("closed");
      expect(circuit.tripCount).toBe(0); // fully reset
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("computeCooldown", () => {
  const config = {
    failureThreshold: 3,
    cooldownBaseMs: 1000,
    cooldownMaxMs: 5000,
    backoffFactor: 1.5,
    halfOpenProbes: 5,
  };

  it("increases exponentially with trip count", () => {
    // With randomFn = 1 (max), we can test the ceiling
    const maxRandom = () => 1;
    const cd0 = computeCooldown(0, config, maxRandom); // 1000 * 1.5^0 = 1000
    const cd1 = computeCooldown(1, config, maxRandom); // 1000 * 1.5^1 = 1500
    const cd2 = computeCooldown(2, config, maxRandom); // 1000 * 1.5^2 = 2250
    const cd3 = computeCooldown(3, config, maxRandom); // 1000 * 1.5^3 = 3375

    expect(cd0).toBeCloseTo(1000, 0);
    expect(cd1).toBeCloseTo(1500, 0);
    expect(cd2).toBeCloseTo(2250, 0);
    expect(cd3).toBeCloseTo(3375, 0);
    // Verify exponential growth
    expect(cd1).toBeGreaterThan(cd0);
    expect(cd2).toBeGreaterThan(cd1);
    expect(cd3).toBeGreaterThan(cd2);
  });

  it("caps at cooldownMaxMs", () => {
    const maxRandom = () => 1;
    const cd10 = computeCooldown(10, config, maxRandom); // 1000 * 1.5^10 = 57665 → capped at 5000
    expect(cd10).toBe(5000);
  });

  it("full jitter: cooldown is randomized and <= capped value", () => {
    for (let i = 0; i < 100; i++) {
      const cd = computeCooldown(2, config);
      const capped = Math.min(
        config.cooldownBaseMs * Math.pow(config.backoffFactor, 2),
        config.cooldownMaxMs,
      );
      expect(cd).toBeGreaterThanOrEqual(0);
      expect(cd).toBeLessThanOrEqual(capped);
    }
  });

  it("returns 0 when randomFn returns 0", () => {
    expect(computeCooldown(5, config, () => 0)).toBe(0);
  });
});

describe("RTY (Rolled Throughput Yield)", () => {
  it("returns 1.0 for empty stages", () => {
    const result = computeRTY([]);
    expect(result.rty).toBe(1);
  });

  it("computes perfect RTY for first-pass stages", () => {
    const attempts: StageAttempt[] = [
      {
        stage: "scope",
        modelId: "m1",
        qualityScore: 0.9,
        refinementIteration: 0,
      },
      {
        stage: "execute",
        modelId: "m2",
        qualityScore: 0.8,
        refinementIteration: 0,
      },
    ];
    const result = computeRTY(attempts);
    expect(result.rty).toBeCloseTo(0.72, 4); // 0.9 * 0.8
    expect(result.stageYields.scope).toBeCloseTo(0.9, 4);
    expect(result.stageYields.execute).toBeCloseTo(0.8, 4);
  });

  it("applies 30% penalty for corrected stages", () => {
    const attempts: StageAttempt[] = [
      {
        stage: "scope",
        modelId: "m1",
        qualityScore: 0.8,
        refinementIteration: 1,
      },
    ];
    const result = computeRTY(attempts);
    expect(result.rty).toBeCloseTo(0.56, 4); // 0.8 * 0.7
  });

  it("stageResultsToAttempts converts correctly", () => {
    const stages = [
      {
        stage: "scope" as const,
        modelId: "m1",
        qualityScore: 0.8,
        durationMs: 100,
        content: "",
      },
      {
        stage: "execute" as const,
        modelId: "m2",
        qualityScore: 0.3,
        durationMs: 200,
        content: "",
      },
    ];
    const attempts = stageResultsToAttempts(stages);
    expect(attempts[0].refinementIteration).toBe(0); // 0.8 >= 0.5
    expect(attempts[1].refinementIteration).toBe(1); // 0.3 < 0.5
  });
});

describe("%C&A (Percent Correct & Accurate)", () => {
  it("returns 100% overall for empty stages", () => {
    const result = computePercentCA([]);
    expect(result.overall).toBe(100);
  });

  it("computes correct per-stage and overall", () => {
    const attempts: StageAttempt[] = [
      {
        stage: "scope",
        modelId: "m1",
        qualityScore: 0.9,
        refinementIteration: 0,
      },
      {
        stage: "execute",
        modelId: "m2",
        qualityScore: 0.8,
        refinementIteration: 1,
      },
    ];
    const result = computePercentCA(attempts);
    expect(result.perStage.scope).toBe(90); // 0.9 * 100
    expect(result.perStage.execute).toBe(40); // 0.8 * 50
    expect(result.overall).toBe(50); // 1/2 first-pass
  });
});

describe("Feedback Effectiveness", () => {
  it("returns 1.0 when no refinements occurred", () => {
    const stages = [
      {
        stage: "scope" as const,
        modelId: "m1",
        qualityScore: 0.9,
        durationMs: 100,
        content: "",
      },
    ];
    const result = computeFeedbackEffectiveness(stages, 0);
    expect(result.effectiveness).toBe(1.0);
    expect(result.correctedStages).toBe(0);
  });

  it("computes effectiveness correctly", () => {
    const stages = [
      {
        stage: "scope" as const,
        modelId: "m1",
        qualityScore: 0.8,
        durationMs: 100,
        content: "",
      },
      {
        stage: "execute" as const,
        modelId: "m2",
        qualityScore: 0.3,
        durationMs: 200,
        content: "",
      },
    ];
    // 2 refinements, 1 low-quality stage remaining → 1 improved
    const result = computeFeedbackEffectiveness(stages, 2);
    expect(result.correctedStages).toBe(2);
    expect(result.improvedStages).toBe(1);
    expect(result.effectiveness).toBe(0.5);
  });

  it("returns 0 effectiveness when all refinements failed", () => {
    const stages = [
      {
        stage: "scope" as const,
        modelId: "m1",
        qualityScore: 0.3,
        durationMs: 100,
        content: "",
      },
      {
        stage: "execute" as const,
        modelId: "m2",
        qualityScore: 0.2,
        durationMs: 200,
        content: "",
      },
    ];
    const result = computeFeedbackEffectiveness(stages, 2);
    expect(result.effectiveness).toBe(0);
  });
});
