/**
 * Codex Signum — SAFETY INVARIANT: Subcriticality
 *
 * γ_effective MUST always be ≤ 0.7 for all node degrees ≥ 1.
 * This is a CRITICAL safety constraint. Values above 0.7 cause
 * supercritical cascade propagation (amplification, not dampening).
 *
 * Formula: γ_effective = min(0.7, 0.8 / (k - 1))
 *
 * If this test FAILS, dampening.ts has a bug that allows supercritical
 * propagation. This is a Phase 3 fix priority.
 *
 * Source: Engineering Bridge v2.0 §Part 3 "Topology-Aware Dampening"
 */
import { describe, expect, it } from "vitest";
import { computeDampening } from "../../src/computation/dampening.js";

describe("SAFETY: γ_effective ≤ 0.7 for all degrees (subcriticality invariant)", () => {
  const MAX_GAMMA = 0.7;

  it("degree 1 (leaf) → γ = 0.7 (at cap, not above)", () => {
    const gamma = computeDampening(1);
    expect(gamma).toBeLessThanOrEqual(MAX_GAMMA + 1e-10);
    expect(gamma).toBeCloseTo(MAX_GAMMA, 6);
  });

  it("degree 2 → γ ≤ 0.7", () => {
    expect(computeDampening(2)).toBeLessThanOrEqual(MAX_GAMMA + 1e-10);
  });

  it("degree 3 → γ ≤ 0.7", () => {
    expect(computeDampening(3)).toBeLessThanOrEqual(MAX_GAMMA + 1e-10);
  });

  it("degree 5 → γ ≤ 0.7", () => {
    expect(computeDampening(5)).toBeLessThanOrEqual(MAX_GAMMA + 1e-10);
  });

  it("degree 10 → γ ≤ 0.7", () => {
    expect(computeDampening(10)).toBeLessThanOrEqual(MAX_GAMMA + 1e-10);
  });

  it("degree 50 (high connectivity) → γ ≤ 0.7", () => {
    expect(computeDampening(50)).toBeLessThanOrEqual(MAX_GAMMA + 1e-10);
  });

  it("degree 100 (extreme hub) → γ ≤ 0.7", () => {
    expect(computeDampening(100)).toBeLessThanOrEqual(MAX_GAMMA + 1e-10);
  });

  it("EXHAUSTIVE: degrees 1–100 all produce γ ≤ 0.7", () => {
    for (let k = 1; k <= 100; k++) {
      const gamma = computeDampening(k);
      expect(gamma).toBeLessThanOrEqual(MAX_GAMMA + 1e-10);
      expect(gamma).toBeGreaterThanOrEqual(0);
    }
  });

  it("FORMULA: degree k → γ = min(0.7, 0.8/(k-1)) for k > 1", () => {
    for (let k = 2; k <= 20; k++) {
      const expected = Math.min(0.7, 0.8 / (k - 1));
      const actual = computeDampening(k);
      expect(actual).toBeCloseTo(expected, 10);
    }
  });
});
