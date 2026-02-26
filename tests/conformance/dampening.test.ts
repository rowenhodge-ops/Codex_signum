/**
 * Codex Signum — Conformance Tests: Topology-Aware Dampening
 *
 * Tests the API contract for dampening.ts.
 * Safety invariants (subcriticality, cascade limit, hysteresis) are in tests/safety/.
 *
 * @see engineering-bridge-v2.0.md §Part 3 "Topology-Aware Dampening"
 */
import { describe, expect, it } from "vitest";
import {
  CASCADE_LIMIT,
  HYSTERESIS_RATIO,
  computeDampening,
  computeDegradationImpact,
  computeRecoveryRate,
  propagateDegradation,
} from "../../src/computation/dampening.js";
import type { PropagationNode } from "../../src/computation/dampening.js";

// ── Constants ─────────────────────────────────────────────────────────────

describe("Dampening spec constants", () => {
  it("CASCADE_LIMIT = 2", () => {
    expect(CASCADE_LIMIT).toBe(2);
  });

  it("HYSTERESIS_RATIO = 2.5", () => {
    expect(HYSTERESIS_RATIO).toBeCloseTo(2.5, 6);
  });
});

// ── computeDampening ──────────────────────────────────────────────────────

describe("computeDampening — formula γ = min(0.7, 0.8/(k-1))", () => {
  it("degree 1 (leaf) → γ = 0.7 (max)", () => {
    expect(computeDampening(1)).toBeCloseTo(0.7, 6);
  });

  it("degree 2 → γ = min(0.7, 0.8/1) = 0.7 (cap)", () => {
    expect(computeDampening(2)).toBeCloseTo(0.7, 6);
  });

  it("degree 3 → γ = 0.8/2 = 0.4", () => {
    expect(computeDampening(3)).toBeCloseTo(0.4, 6);
  });

  it("degree 5 → γ = 0.8/4 = 0.2", () => {
    expect(computeDampening(5)).toBeCloseTo(0.2, 6);
  });

  it("degree 9 → γ = 0.8/8 = 0.1", () => {
    expect(computeDampening(9)).toBeCloseTo(0.1, 6);
  });

  it("γ is always ≤ 0.7 (never exceeds cap)", () => {
    for (const degree of [1, 2, 3, 5, 10, 100]) {
      expect(computeDampening(degree)).toBeLessThanOrEqual(0.7 + 1e-10);
    }
  });

  it("higher degree → lower or equal dampening", () => {
    expect(computeDampening(5)).toBeLessThanOrEqual(computeDampening(3));
    expect(computeDampening(10)).toBeLessThanOrEqual(computeDampening(5));
  });
});

// ── computeDegradationImpact ──────────────────────────────────────────────

describe("computeDegradationImpact", () => {
  it("cascade level 1 → applies dampening", () => {
    const impact = computeDegradationImpact(3, 0.5, 1);
    // degree 3 → γ = 0.4; impact = 0.4 × 0.5 = 0.2
    expect(impact).toBeCloseTo(0.2, 6);
  });

  it("cascade level 2 (limit) → still applies", () => {
    const impact = computeDegradationImpact(3, 0.5, 2);
    expect(impact).toBeGreaterThan(0);
  });

  it("cascade level 3 (beyond limit) → zero impact", () => {
    const impact = computeDegradationImpact(3, 0.5, 3);
    expect(impact).toBe(0);
  });

  it("negative severity → zero impact", () => {
    const impact = computeDegradationImpact(3, -0.1, 1);
    expect(impact).toBe(0);
  });
});

// ── computeRecoveryRate ───────────────────────────────────────────────────

describe("computeRecoveryRate — hysteresis 2.5×", () => {
  it("degradation 0.5 → recovery 0.2", () => {
    expect(computeRecoveryRate(0.5)).toBeCloseTo(0.2, 6);
  });

  it("recovery is always slower than degradation (rate < input)", () => {
    expect(computeRecoveryRate(1.0)).toBeLessThan(1.0);
    expect(computeRecoveryRate(0.4)).toBeLessThan(0.4);
  });

  it("handles negative input (absolute value)", () => {
    expect(computeRecoveryRate(-0.5)).toBeCloseTo(0.2, 6);
  });
});

// ── propagateDegradation ──────────────────────────────────────────────────

describe("propagateDegradation — BFS with cascade limit", () => {
  function makeNodes(): Map<string, PropagationNode> {
    return new Map([
      ["a", { id: "a", phiL: 0.9, degree: 2, neighbors: ["b", "c"] }],
      ["b", { id: "b", phiL: 0.8, degree: 2, neighbors: ["a", "c"] }],
      ["c", { id: "c", phiL: 0.7, degree: 2, neighbors: ["a", "b"] }],
    ]);
  }

  it("source node gets reduced ΦL", () => {
    const result = propagateDegradation("a", 0.3, makeNodes());
    const newPhiL = result.updatedPhiL.get("a");
    expect(newPhiL).toBeDefined();
    expect(newPhiL!).toBeCloseTo(0.6, 6); // 0.9 - 0.3
  });

  it("propagates to direct neighbors", () => {
    const result = propagateDegradation("a", 0.3, makeNodes());
    expect(result.nodesAffected).toBeGreaterThan(1);
  });

  it("maxCascadeDepth ≤ CASCADE_LIMIT", () => {
    const result = propagateDegradation("a", 0.3, makeNodes());
    expect(result.maxCascadeDepth).toBeLessThanOrEqual(CASCADE_LIMIT);
  });

  it("non-existent source → no changes", () => {
    const result = propagateDegradation("z", 0.3, makeNodes());
    expect(result.updatedPhiL.size).toBe(0);
    expect(result.nodesAffected).toBe(0);
  });
});
