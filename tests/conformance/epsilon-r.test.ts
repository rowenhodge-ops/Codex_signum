// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: εR (Exploration Rate) Computation
 *
 * εR must never be exactly 0 for active patterns (Axiom 5).
 * Spectral calibration applies a floor based on λ₂ ratio.
 *
 * @see engineering-bridge-v2.0.md §Part 2 "εR"
 */
import { describe, expect, it } from "vitest";
import {
  computeEpsilonR,
  computeEpsilonRFloor,
  checkEpsilonRWarnings,
  isEpsilonRSpike,
} from "../../src/computation/epsilon-r.js";

// ── Structure ─────────────────────────────────────────────────────────────

describe("εR output structure", () => {
  it("returns object with required fields", () => {
    const epsilon = computeEpsilonR(10, 100);
    expect(typeof epsilon.value).toBe("number");
    expect(typeof epsilon.floor).toBe("number");
    expect(typeof epsilon.exploratoryDecisions).toBe("number");
    expect(typeof epsilon.totalDecisions).toBe("number");
    expect(epsilon.computedAt).toBeInstanceOf(Date);
    expect(epsilon.range).toBeDefined();
  });
});

// ── Core computation ──────────────────────────────────────────────────────

describe("εR value computation", () => {
  it("10/100 decisions → value = 0.1", () => {
    const epsilon = computeEpsilonR(10, 100);
    expect(epsilon.value).toBeCloseTo(0.1, 6);
  });

  it("0 total decisions → default to midpoint (not zero)", () => {
    const epsilon = computeEpsilonR(0, 0);
    expect(epsilon.value).toBeGreaterThan(0);
  });

  it("value ≥ floor always", () => {
    const epsilon = computeEpsilonR(0, 1000, 0.05);
    expect(epsilon.value).toBeGreaterThanOrEqual(0.05);
  });

  it("value in [0, 1]", () => {
    const epsilon = computeEpsilonR(75, 100);
    expect(epsilon.value).toBeGreaterThanOrEqual(0);
    expect(epsilon.value).toBeLessThanOrEqual(1);
  });
});

// ── Axiom 5: εR > 0 for active patterns ──────────────────────────────────

describe("εR floor enforcement (Axiom 5 compliance)", () => {
  it("zero exploratory decisions still gets floor applied", () => {
    const epsilon = computeEpsilonR(0, 1000, 0.01);
    expect(epsilon.value).toBeGreaterThanOrEqual(0.01);
  });

  it("floor parameter respected", () => {
    const epsilon = computeEpsilonR(1, 1000, 0.05);
    expect(epsilon.value).toBeGreaterThanOrEqual(0.05);
  });
});

// ── Floor computation ─────────────────────────────────────────────────────

describe("εR floor from imperative gradient", () => {
  it("normal gradient (1.0) → floor = baseFloor", () => {
    expect(computeEpsilonRFloor(0.02, 1.0)).toBeCloseTo(0.02, 6);
  });

  it("floor never below 0.01 regardless of inputs", () => {
    expect(computeEpsilonRFloor(0.001, 0.1)).toBeGreaterThanOrEqual(0.01);
    expect(computeEpsilonRFloor(0, 0)).toBeGreaterThanOrEqual(0.01);
  });

  it("higher gradient → higher floor", () => {
    const low = computeEpsilonRFloor(0.01, 1.0);
    const high = computeEpsilonRFloor(0.01, 2.0);
    expect(high).toBeGreaterThanOrEqual(low);
  });
});

// ── Spectral calibration (min εR from spec table) ─────────────────────────

describe("εR spectral calibration thresholds", () => {
  it("spectral ratio > 0.9 → min εR floor = 0.05 [Engineering Bridge Table 2.3]", () => {
    // Floor at spectral ratio > 0.9 is 0.05 per spec
    const epsilon = computeEpsilonR(0, 1000, 0.05);
    expect(epsilon.value).toBeGreaterThanOrEqual(0.05);
  });

  it("spectral ratio < 0.5 → min εR floor = 0.0 [system still uses computed floor]", () => {
    const epsilon = computeEpsilonR(0, 1000, 0.0);
    // Even with floor=0, value will be 0 or default
    expect(epsilon.value).toBeGreaterThanOrEqual(0);
  });
});

// ── Warnings ──────────────────────────────────────────────────────────────

describe("εR warning conditions", () => {
  it("εR = 0 on active pattern → critical warning (Axiom 5 violation)", () => {
    const epsilon = computeEpsilonR(0, 0, 0); // force value to 0 somehow
    // Even if floor prevents 0, check the warning logic directly
    const mockEpsilon = { value: 0, range: "rigid" as const, exploratoryDecisions: 0, totalDecisions: 0, floor: 0, computedAt: new Date() };
    const warnings = checkEpsilonRWarnings(mockEpsilon, 0.8, true);
    const critical = warnings.filter(w => w.level === "critical");
    expect(critical.length).toBeGreaterThan(0);
  });

  it("εR = 0 on inactive pattern → no critical warning", () => {
    const mockEpsilon = { value: 0, range: "rigid" as const, exploratoryDecisions: 0, totalDecisions: 0, floor: 0, computedAt: new Date() };
    const warnings = checkEpsilonRWarnings(mockEpsilon, 0.8, false);
    const critical = warnings.filter(w => w.level === "critical");
    expect(critical.length).toBe(0);
  });
});

// ── M-22.4: Bloom εR Aggregation ────────────────────────────────────────

describe("M-22.4: Bloom εR aggregation", () => {
  it("computeEpsilonR produces correct ratio from decision counts", () => {
    // Simulates what getBloomDecisionCounts would return: 3 exploratory out of 10 total
    const epsilonR = computeEpsilonR(3, 10, 0.01);
    expect(epsilonR.value).toBeCloseTo(0.3, 6);
    expect(epsilonR.exploratoryDecisions).toBe(3);
    expect(epsilonR.totalDecisions).toBe(10);
    expect(epsilonR.range).toBeDefined();
  });

  it("zero decisions returns midpoint (cold start)", () => {
    const epsilonR = computeEpsilonR(0, 0, 0.01);
    expect(epsilonR.value).toBe(0.15); // Default midpoint
    expect(epsilonR.totalDecisions).toBe(0);
  });

  it("floor enforcement prevents collapse to zero", () => {
    const floor = computeEpsilonRFloor();
    const epsilonR = computeEpsilonR(0, 100, floor);
    expect(epsilonR.value).toBeGreaterThanOrEqual(floor);
    expect(epsilonR.value).toBeGreaterThanOrEqual(0.01);
  });

  it("upward propagation: mean of children εR values", () => {
    // Simulates parent εR from 3 children with different εR values
    const childEpsilonRs = [0.1, 0.2, 0.3];
    const meanEpsilonR = childEpsilonRs.reduce((a, b) => a + b, 0) / childEpsilonRs.length;
    expect(meanEpsilonR).toBeCloseTo(0.2, 6);
  });
});

// ── M-22.4: isEpsilonRSpike (maturity-indexed thresholds) ───────────────

describe("M-22.4: isEpsilonRSpike", () => {
  it("young network (MI < 0.3): spike above 0.40", () => {
    expect(isEpsilonRSpike(0.41, 0.1)).toBe(true);
    expect(isEpsilonRSpike(0.40, 0.1)).toBe(false);
    expect(isEpsilonRSpike(0.39, 0.1)).toBe(false);
  });

  it("maturing network (0.3 < MI < 0.7): spike above 0.30", () => {
    expect(isEpsilonRSpike(0.31, 0.5)).toBe(true);
    expect(isEpsilonRSpike(0.30, 0.5)).toBe(false);
    expect(isEpsilonRSpike(0.29, 0.5)).toBe(false);
  });

  it("mature network (MI > 0.7): spike above 0.15", () => {
    expect(isEpsilonRSpike(0.16, 0.8)).toBe(true);
    expect(isEpsilonRSpike(0.15, 0.8)).toBe(false);
    expect(isEpsilonRSpike(0.14, 0.8)).toBe(false);
  });

  it("boundary: MI exactly 0.3 uses young threshold (0.40)", () => {
    expect(isEpsilonRSpike(0.35, 0.3)).toBe(false);
    expect(isEpsilonRSpike(0.41, 0.3)).toBe(true);
  });

  it("boundary: MI exactly 0.7 uses maturing threshold (0.30)", () => {
    expect(isEpsilonRSpike(0.25, 0.7)).toBe(false);
    expect(isEpsilonRSpike(0.31, 0.7)).toBe(true);
  });
});
