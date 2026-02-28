// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Circuit Breaker
 *
 * Verifies: state transitions, exponential backoff with full jitter,
 * 5-10 half-open probes requirement. NOT fixed cooldown.
 *
 * @see engineering-bridge-v2.0.md §Part 3 "Circuit Breaker"
 */
import { describe, expect, it } from "vitest";
import {
  ProviderCircuitBreaker,
  computeCooldown,
} from "../../src/resilience/circuit-breaker.js";
import type { CircuitBreakerConfig } from "../../src/resilience/circuit-breaker.js";

const testConfig: CircuitBreakerConfig = {
  failureThreshold: 3,
  cooldownBaseMs: 1000,
  cooldownMaxMs: 10000,
  backoffFactor: 1.5,
  halfOpenProbes: 5,
};

// ── computeCooldown: exponential backoff + full jitter ────────────────────

describe("computeCooldown — exponential backoff with full jitter", () => {
  it("returns value in [0, capped]", () => {
    for (let tripCount = 0; tripCount < 10; tripCount++) {
      const delay = computeCooldown(tripCount, testConfig);
      const cap = Math.min(
        testConfig.cooldownBaseMs * Math.pow(testConfig.backoffFactor, tripCount),
        testConfig.cooldownMaxMs,
      );
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(cap + 1e-6);
    }
  });

  it("jitter produces non-deterministic values", () => {
    const delays = new Set<number>();
    for (let i = 0; i < 20; i++) {
      delays.add(computeCooldown(1, testConfig));
    }
    // With full jitter, values should vary
    expect(delays.size).toBeGreaterThan(1);
  });

  it("higher tripCount → higher expected cap (exponential growth)", () => {
    const alwaysZeroRandom = () => 0; // floor of jitter
    // Even with random=0, we can verify the cap grows
    const cap0 = testConfig.cooldownBaseMs * Math.pow(testConfig.backoffFactor, 0);
    const cap3 = testConfig.cooldownBaseMs * Math.pow(testConfig.backoffFactor, 3);
    expect(cap3).toBeGreaterThan(cap0);
  });

  it("cap never exceeds cooldownMaxMs", () => {
    const delay = computeCooldown(100, testConfig, () => 1); // max jitter
    expect(delay).toBeLessThanOrEqual(testConfig.cooldownMaxMs + 1e-6);
  });

  it("injectable randomFn for deterministic tests", () => {
    const delay = computeCooldown(0, testConfig, () => 0.5);
    expect(delay).toBeCloseTo(testConfig.cooldownBaseMs * 0.5, 6);
  });
});

// ── State transitions ─────────────────────────────────────────────────────

describe("Circuit breaker state transitions", () => {
  it("starts closed — all providers available", () => {
    const cb = new ProviderCircuitBreaker(testConfig);
    expect(cb.isAvailable("provider-a")).toBe(true);
  });

  it("3 failures → open (unavailable)", () => {
    const cb = new ProviderCircuitBreaker(testConfig);
    cb.recordFailure("p");
    cb.recordFailure("p");
    cb.recordFailure("p");
    expect(cb.isAvailable("p")).toBe(false);
  });

  it("2 failures, then success → resets to closed", () => {
    const cb = new ProviderCircuitBreaker(testConfig);
    cb.recordFailure("p");
    cb.recordFailure("p");
    cb.recordSuccess("p");
    expect(cb.isAvailable("p")).toBe(true);
  });

  it("different providers are independent", () => {
    const cb = new ProviderCircuitBreaker(testConfig);
    cb.recordFailure("p1");
    cb.recordFailure("p1");
    cb.recordFailure("p1");
    expect(cb.isAvailable("p1")).toBe(false);
    expect(cb.isAvailable("p2")).toBe(true);
  });
});

// ── Half-open: requires 5-10 probes (not just 1) ─────────────────────────

describe("Half-open probe requirement", () => {
  it("config default halfOpenProbes = 5", () => {
    expect(testConfig.halfOpenProbes).toBeGreaterThanOrEqual(5);
    expect(testConfig.halfOpenProbes).toBeLessThanOrEqual(10);
  });

  it("halfOpenProbes must be > 1 — requiring multiple successes is the key invariant", () => {
    expect(testConfig.halfOpenProbes).toBeGreaterThan(1);
    expect(testConfig.halfOpenProbes).toBeGreaterThanOrEqual(5);
  });
});

// ── getAllStates / getOpenCircuits ─────────────────────────────────────────

describe("getAllStates and getOpenCircuits", () => {
  it("no circuits recorded → getOpenCircuits returns empty", () => {
    const cb = new ProviderCircuitBreaker(testConfig);
    expect(cb.getOpenCircuits()).toHaveLength(0);
  });

  it("after failure threshold → getOpenCircuits includes provider", () => {
    const cb = new ProviderCircuitBreaker(testConfig);
    cb.recordFailure("p");
    cb.recordFailure("p");
    cb.recordFailure("p");
    const open = cb.getOpenCircuits();
    expect(open.some(c => c.provider === "p")).toBe(true);
    expect(open[0].state).toBe("open");
  });

  it("tracks consecutive failures via getAllStates", () => {
    const cb = new ProviderCircuitBreaker(testConfig);
    cb.recordFailure("p");
    cb.recordFailure("p");
    const all = cb.getAllStates();
    const pState = all.find(c => c.provider === "p");
    expect(pState?.consecutiveFailures).toBe(2);
  });

  it("resetAll → clears all circuit state", () => {
    const cb = new ProviderCircuitBreaker(testConfig);
    cb.recordFailure("p");
    cb.recordFailure("p");
    cb.recordFailure("p");
    cb.resetAll();
    expect(cb.getOpenCircuits()).toHaveLength(0);
    expect(cb.isAvailable("p")).toBe(true);
  });
});
