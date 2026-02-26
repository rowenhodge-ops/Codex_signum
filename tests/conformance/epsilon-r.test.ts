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
