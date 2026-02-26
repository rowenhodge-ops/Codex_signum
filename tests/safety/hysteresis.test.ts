/**
 * Codex Signum — SAFETY INVARIANT: Hysteresis Ratio 2.5×
 *
 * Recovery MUST be 2.5× slower than degradation (HYSTERESIS_RATIO = 2.5).
 * This is the Schmitt trigger engineering standard.
 * A ratio of 1.5× is WRONG and was a historical bug in this codebase.
 *
 * If this test FAILS, dampening.ts uses the wrong hysteresis ratio.
 *
 * Source: Engineering Bridge v2.0 §Part 3 "Recovery Model"
 */
import { describe, expect, it } from "vitest";
import {
  HYSTERESIS_RATIO,
  computeRecoveryRate,
} from "../../src/computation/dampening.js";

describe("SAFETY: HYSTERESIS_RATIO = 2.5 (Schmitt trigger standard)", () => {
  it("HYSTERESIS_RATIO constant = 2.5", () => {
    expect(HYSTERESIS_RATIO).toBeCloseTo(2.5, 6);
  });

  it("HYSTERESIS_RATIO is NOT 1.5 (historical bug)", () => {
    expect(HYSTERESIS_RATIO).not.toBeCloseTo(1.5, 1);
  });

  it("HYSTERESIS_RATIO is NOT 2.0 (incorrect)", () => {
    expect(HYSTERESIS_RATIO).not.toBeCloseTo(2.0, 1);
  });
});

describe("SAFETY: recovery rate = degradation rate / 2.5", () => {
  it("degradationRate 0.5 → recoveryRate = 0.2 (0.5 / 2.5)", () => {
    expect(computeRecoveryRate(0.5)).toBeCloseTo(0.2, 6);
  });

  it("degradationRate 1.0 → recoveryRate = 0.4 (1.0 / 2.5)", () => {
    expect(computeRecoveryRate(1.0)).toBeCloseTo(0.4, 6);
  });

  it("degradationRate 0.25 → recoveryRate = 0.1 (0.25 / 2.5)", () => {
    expect(computeRecoveryRate(0.25)).toBeCloseTo(0.1, 6);
  });

  it("recovery is ALWAYS slower than degradation by exactly 2.5×", () => {
    const rates = [0.1, 0.2, 0.3, 0.5, 0.8, 1.0];
    for (const rate of rates) {
      const recovery = computeRecoveryRate(rate);
      expect(recovery * HYSTERESIS_RATIO).toBeCloseTo(rate, 8);
    }
  });

  it("recovery is never faster than degradation", () => {
    const rates = [0.1, 0.5, 1.0];
    for (const rate of rates) {
      expect(computeRecoveryRate(rate)).toBeLessThan(rate);
    }
  });
});

describe("SAFETY: HysteresisGate bandMultiplier ≥ 2×", () => {
  it("DEFAULT_CONFIG.hysteresis.bandMultiplier ≥ 2 (Schmitt trigger standard)", async () => {
    const { DEFAULT_CONFIG } = await import("../../src/signals/types.js");
    expect(DEFAULT_CONFIG.hysteresis.bandMultiplier).toBeGreaterThanOrEqual(2);
  });
});
