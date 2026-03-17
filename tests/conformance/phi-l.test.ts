// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: ΦL (Luminance) Computation
 *
 * ΦL is ALWAYS composite. Never a bare number.
 * Verifies: 4-factor weights, maturity adjustment, trend computation.
 * @see engineering-bridge-v2.0.md §Part 2 "Computing ΦL"
 */
import { describe, expect, it } from "vitest";
import { computePhiL, computePhiLWithState } from "../../src/computation/phi-l.js";
import { DEFAULT_PHI_L_WEIGHTS, createPhiLState } from "../../src/types/state-dimensions.js";
import type { PhiLFactors, PhiLState } from "../../src/types/state-dimensions.js";

const perfectFactors: PhiLFactors = {
  axiomCompliance: 1.0,
  provenanceClarity: 1.0,
  usageSuccessRate: 1.0,
  temporalStability: 1.0,
};

const zeroFactors: PhiLFactors = {
  axiomCompliance: 0.0,
  provenanceClarity: 0.0,
  usageSuccessRate: 0.0,
  temporalStability: 0.0,
};

// ── Structure ─────────────────────────────────────────────────────────────

describe("ΦL is always composite (never bare number)", () => {
  it("returns object with required fields", () => {
    const phi = computePhiL(perfectFactors, 100, 5);
    expect(typeof phi).toBe("object");
    expect(typeof phi.effective).toBe("number");
    expect(phi.factors).toBeDefined();
    expect(phi.weights).toBeDefined();
    expect(typeof phi.raw).toBe("number");
    expect(typeof phi.maturityFactor).toBe("number");
    expect(phi.computedAt).toBeInstanceOf(Date);
  });

  it("returns all four factors unchanged", () => {
    const phi = computePhiL(perfectFactors, 10, 2);
    expect(phi.factors.axiomCompliance).toBe(1.0);
    expect(phi.factors.provenanceClarity).toBe(1.0);
    expect(phi.factors.usageSuccessRate).toBe(1.0);
    expect(phi.factors.temporalStability).toBe(1.0);
  });
});

// ── Weights (spec: 0.4, 0.2, 0.2, 0.2) ───────────────────────────────────

describe("ΦL spec weights", () => {
  it("default weights match spec: axiomCompliance=0.4, others=0.2", () => {
    expect(DEFAULT_PHI_L_WEIGHTS.axiomCompliance).toBeCloseTo(0.4, 4);
    expect(DEFAULT_PHI_L_WEIGHTS.provenanceClarity).toBeCloseTo(0.2, 4);
    expect(DEFAULT_PHI_L_WEIGHTS.usageSuccessRate).toBeCloseTo(0.2, 4);
    expect(DEFAULT_PHI_L_WEIGHTS.temporalStability).toBeCloseTo(0.2, 4);
  });

  it("weights sum to 1.0", () => {
    const sum = Object.values(DEFAULT_PHI_L_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 8);
  });

  it("axiomCompliance has highest weight (dominates raw score)", () => {
    const highAxiom = computePhiL(
      { axiomCompliance: 1.0, provenanceClarity: 0.0, usageSuccessRate: 0.0, temporalStability: 0.0 },
      100, 5,
    );
    const highOther = computePhiL(
      { axiomCompliance: 0.0, provenanceClarity: 1.0, usageSuccessRate: 0.0, temporalStability: 0.0 },
      100, 5,
    );
    expect(highAxiom.raw).toBeGreaterThan(highOther.raw);
  });
});

// ── Raw score ─────────────────────────────────────────────────────────────

describe("ΦL raw score", () => {
  it("perfect factors → raw = 1.0", () => {
    const phi = computePhiL(perfectFactors, 100, 5);
    expect(phi.raw).toBeCloseTo(1.0, 6);
  });

  it("zero factors → raw = 0.0", () => {
    const phi = computePhiL(zeroFactors, 100, 5);
    expect(phi.raw).toBeCloseTo(0.0, 6);
  });

  it("raw is in [0, 1]", () => {
    const phi = computePhiL(
      { axiomCompliance: 0.6, provenanceClarity: 0.5, usageSuccessRate: 0.7, temporalStability: 0.4 },
      50, 3,
    );
    expect(phi.raw).toBeGreaterThanOrEqual(0);
    expect(phi.raw).toBeLessThanOrEqual(1);
  });
});

// ── Maturity adjustment ───────────────────────────────────────────────────

describe("ΦL maturity adjustment", () => {
  it("zero observations → maturityFactor = 0", () => {
    const phi = computePhiL(perfectFactors, 0, 0);
    expect(phi.maturityFactor).toBeCloseTo(0, 6);
    expect(phi.effective).toBeCloseTo(0, 6);
  });

  it("many observations + connections → maturityFactor approaches 1", () => {
    const phi = computePhiL(perfectFactors, 1000, 50);
    expect(phi.maturityFactor).toBeGreaterThan(0.9);
    expect(phi.effective).toBeGreaterThan(0.9);
  });

  it("maturityFactor in [0, 1]", () => {
    const phi = computePhiL(perfectFactors, 20, 3);
    expect(phi.maturityFactor).toBeGreaterThanOrEqual(0);
    expect(phi.maturityFactor).toBeLessThanOrEqual(1);
  });

  it("effective ≤ raw (maturity only reduces, never inflates)", () => {
    const phi = computePhiL(perfectFactors, 30, 4);
    expect(phi.effective).toBeLessThanOrEqual(phi.raw + 1e-10);
  });
});

// ── Trend ─────────────────────────────────────────────────────────────────

describe("ΦL trend", () => {
  it("no previousPhiL → trend is one of the valid values", () => {
    const phi = computePhiL(perfectFactors, 50, 5);
    expect(["improving", "stable", "declining"]).toContain(phi.trend);
  });

  it("effective higher than previous → improving trend", () => {
    const phi = computePhiL(perfectFactors, 200, 20, 0.1);
    // effective will be high (near 1.0), previous was 0.1 → improving
    expect(phi.trend).toBe("improving");
  });

  it("effective lower than previous → declining trend", () => {
    const phi = computePhiL(zeroFactors, 200, 20, 0.9);
    // effective near 0, previous was 0.9 → declining
    expect(phi.trend).toBe("declining");
  });
});

// ── M-22.2: computePhiLWithState round-trip ──────────────────────────────

describe("computePhiLWithState — ring buffer round-trip (M-22.2)", () => {
  it("returns updated state with new buffer entry", () => {
    const state = createPhiLState(20);
    const factors = { axiomCompliance: 0.9, provenanceClarity: 0.8, usageSuccessRate: 0.85 };
    const { phiL, updatedState } = computePhiLWithState(factors, 10, 3, state, 0.7);

    expect(phiL).toBeDefined();
    expect(phiL.effective).toBeGreaterThan(0);
    expect(updatedState.ringBuffer.length).toBe(1);
    expect(updatedState.ringBuffer[0]).toBe(0.7); // previousPhiL pushed into buffer
  });

  it("ring buffer grows with successive calls", () => {
    let state = createPhiLState(5);
    const factors = { axiomCompliance: 0.9, provenanceClarity: 0.8, usageSuccessRate: 0.85 };

    for (let i = 0; i < 3; i++) {
      const prev = 0.5 + i * 0.1;
      const result = computePhiLWithState(factors, 10 + i, 3, state, prev);
      state = result.updatedState;
    }

    expect(state.ringBuffer.length).toBe(3);
  });

  it("ring buffer caps at maxSize", () => {
    let state = createPhiLState(3); // small buffer
    const factors = { axiomCompliance: 0.9, provenanceClarity: 0.8, usageSuccessRate: 0.85 };

    for (let i = 0; i < 5; i++) {
      const result = computePhiLWithState(factors, 10, 3, state, 0.5 + i * 0.05);
      state = result.updatedState;
    }

    expect(state.ringBuffer.length).toBe(3);
    expect(state.maxSize).toBe(3);
  });

  it("temporal stability is computed from state (not hardcoded)", () => {
    // Build a buffer with stable values → high temporal stability
    const stableState: PhiLState = { ringBuffer: [0.7, 0.71, 0.69, 0.7, 0.7], maxSize: 20 };
    const factors = { axiomCompliance: 0.9, provenanceClarity: 0.8, usageSuccessRate: 0.85 };
    const { phiL } = computePhiLWithState(factors, 20, 5, stableState, 0.7);

    // With very low variance, temporal stability should be high
    expect(phiL.factors.temporalStability).toBeGreaterThan(0.8);
  });
});
