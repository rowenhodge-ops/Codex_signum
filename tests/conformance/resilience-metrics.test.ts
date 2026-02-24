/**
 * Codex Signum — Conformance Tests: Resilience & Metrics
 *
 * Verifies circuit breaker behavior, RTY computation, and feedback effectiveness.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ProviderCircuitBreaker } from "../../src/resilience/circuit-breaker.js";
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

  it("resets to closed on success", () => {
    const breaker = new ProviderCircuitBreaker();
    breaker.recordFailure("anthropic");
    breaker.recordFailure("anthropic");
    breaker.recordFailure("anthropic");
    expect(breaker.isAvailable("anthropic")).toBe(false);
    breaker.recordSuccess("anthropic");
    expect(breaker.isAvailable("anthropic")).toBe(true);
  });

  it("transitions to half_open after cooldown", () => {
    vi.useFakeTimers();
    try {
      const breaker = new ProviderCircuitBreaker({ cooldownMs: 1000 });
      breaker.recordFailure("vertex");
      breaker.recordFailure("vertex");
      breaker.recordFailure("vertex");
      expect(breaker.isAvailable("vertex")).toBe(false);

      vi.advanceTimersByTime(1001);
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
});

describe("RTY (Rolled Throughput Yield)", () => {
  it("returns 1.0 for empty stages", () => {
    const result = computeRTY([]);
    expect(result.rty).toBe(1);
  });

  it("computes perfect RTY for first-pass stages", () => {
    const attempts: StageAttempt[] = [
      { stage: "scope", modelId: "m1", qualityScore: 0.9, correctionIteration: 0 },
      { stage: "execute", modelId: "m2", qualityScore: 0.8, correctionIteration: 0 },
    ];
    const result = computeRTY(attempts);
    expect(result.rty).toBeCloseTo(0.72, 4); // 0.9 * 0.8
    expect(result.stageYields.scope).toBeCloseTo(0.9, 4);
    expect(result.stageYields.execute).toBeCloseTo(0.8, 4);
  });

  it("applies 30% penalty for corrected stages", () => {
    const attempts: StageAttempt[] = [
      { stage: "scope", modelId: "m1", qualityScore: 0.8, correctionIteration: 1 },
    ];
    const result = computeRTY(attempts);
    expect(result.rty).toBeCloseTo(0.56, 4); // 0.8 * 0.7
  });

  it("stageResultsToAttempts converts correctly", () => {
    const stages = [
      { stage: "scope" as const, modelId: "m1", qualityScore: 0.8, durationMs: 100, content: "" },
      { stage: "execute" as const, modelId: "m2", qualityScore: 0.3, durationMs: 200, content: "" },
    ];
    const attempts = stageResultsToAttempts(stages);
    expect(attempts[0].correctionIteration).toBe(0); // 0.8 >= 0.5
    expect(attempts[1].correctionIteration).toBe(1); // 0.3 < 0.5
  });
});

describe("%C&A (Percent Correct & Accurate)", () => {
  it("returns 100% overall for empty stages", () => {
    const result = computePercentCA([]);
    expect(result.overall).toBe(100);
  });

  it("computes correct per-stage and overall", () => {
    const attempts: StageAttempt[] = [
      { stage: "scope", modelId: "m1", qualityScore: 0.9, correctionIteration: 0 },
      { stage: "execute", modelId: "m2", qualityScore: 0.8, correctionIteration: 1 },
    ];
    const result = computePercentCA(attempts);
    expect(result.perStage.scope).toBe(90); // 0.9 * 100
    expect(result.perStage.execute).toBe(40); // 0.8 * 50
    expect(result.overall).toBe(50); // 1/2 first-pass
  });
});

describe("Feedback Effectiveness", () => {
  it("returns 1.0 when no corrections occurred", () => {
    const stages = [
      { stage: "scope" as const, modelId: "m1", qualityScore: 0.9, durationMs: 100, content: "" },
    ];
    const result = computeFeedbackEffectiveness(stages, 0);
    expect(result.effectiveness).toBe(1.0);
    expect(result.correctedStages).toBe(0);
  });

  it("computes effectiveness correctly", () => {
    const stages = [
      { stage: "scope" as const, modelId: "m1", qualityScore: 0.8, durationMs: 100, content: "" },
      { stage: "execute" as const, modelId: "m2", qualityScore: 0.3, durationMs: 200, content: "" },
    ];
    // 2 corrections, 1 low-quality stage remaining → 1 improved
    const result = computeFeedbackEffectiveness(stages, 2);
    expect(result.correctedStages).toBe(2);
    expect(result.improvedStages).toBe(1);
    expect(result.effectiveness).toBe(0.5);
  });

  it("returns 0 effectiveness when all corrections failed", () => {
    const stages = [
      { stage: "scope" as const, modelId: "m1", qualityScore: 0.3, durationMs: 100, content: "" },
      { stage: "execute" as const, modelId: "m2", qualityScore: 0.2, durationMs: 200, content: "" },
    ];
    const result = computeFeedbackEffectiveness(stages, 2);
    expect(result.effectiveness).toBe(0);
  });
});
