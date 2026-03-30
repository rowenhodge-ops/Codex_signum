// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: BOCPD Drift Detection (M-10.2)
 *
 * Verifies BOCPDDetector (Adams & MacKay 2007), BOCPDRegistry,
 * hybrid trigger, and JSON persistence round-trip.
 */
import { describe, expect, it } from "vitest";
import { BOCPDDetector } from "../../src/signals/BOCPDDetector.js";
import { BOCPDRegistry } from "../../src/signals/BOCPDRegistry.js";
import { evaluateBOCPDTrigger } from "../../src/computation/structural-triggers.js";
import type { BOCPDState } from "../../src/signals/types.js";

// ============ BOCPDDetector ============

describe("BOCPDDetector", () => {
  it("stationary sequence keeps low change-point probability", () => {
    const detector = new BOCPDDetector({ hazardRate: 1 / 100 });
    let state = detector.initialState();

    // Feed 50 observations from a stable distribution around 0
    const rng = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      const value = gaussianSample(rng, 0, 1);
      const { nextState } = detector.update(value, state);
      state = nextState;
    }

    // After settling, change-point probability should be low
    const { signal } = detector.update(gaussianSample(rng, 0, 1), state);
    expect(signal.changePointProbability).toBeLessThan(0.3);
    expect(signal.runLength).toBeGreaterThan(10);
  });

  it("detects mean shift with high change-point probability", () => {
    const detector = new BOCPDDetector({ hazardRate: 1 / 50 });
    let state = detector.initialState();

    // Phase 1: 40 observations from N(0, 1)
    const rng = mulberry32(123);
    for (let i = 0; i < 40; i++) {
      const { nextState } = detector.update(gaussianSample(rng, 0, 1), state);
      state = nextState;
    }

    // Phase 2: shift to N(5, 1) — large mean shift
    let maxCp = 0;
    for (let i = 0; i < 10; i++) {
      const { signal, nextState } = detector.update(gaussianSample(rng, 5, 1), state);
      state = nextState;
      if (signal.changePointProbability > maxCp) {
        maxCp = signal.changePointProbability;
      }
    }

    // At least one observation should have detected the shift
    expect(maxCp).toBeGreaterThan(0.5);
  });

  it("reset() returns state equal to initialState()", () => {
    const detector = new BOCPDDetector();
    let state = detector.initialState();

    // Feed some observations
    for (let i = 0; i < 10; i++) {
      const { nextState } = detector.update(i * 0.5, state);
      state = nextState;
    }

    // State should differ from initial
    expect(state.runLengths.length).toBeGreaterThan(1);

    // Reset should match initial
    const resetState = detector.reset();
    const freshState = detector.initialState();
    expect(resetState).toEqual(freshState);
  });

  it("arrays never exceed maxRunLength", () => {
    const maxRL = 20;
    const detector = new BOCPDDetector({ maxRunLength: maxRL, hazardRate: 1 / 100 });
    let state = detector.initialState();

    // Feed more observations than maxRunLength
    const rng = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      const { nextState } = detector.update(gaussianSample(rng, 0, 1), state);
      state = nextState;
      expect(state.runLengths.length).toBeLessThanOrEqual(maxRL);
      expect(state.mus.length).toBeLessThanOrEqual(maxRL);
      expect(state.kappas.length).toBeLessThanOrEqual(maxRL);
      expect(state.alphas.length).toBeLessThanOrEqual(maxRL);
      expect(state.betas.length).toBeLessThanOrEqual(maxRL);
    }
  });

  it("run-length distribution sums to ~1.0 after each update", () => {
    const detector = new BOCPDDetector();
    let state = detector.initialState();

    const rng = mulberry32(99);
    for (let i = 0; i < 30; i++) {
      const { nextState } = detector.update(gaussianSample(rng, 0, 1), state);
      state = nextState;
      const sum = state.runLengths.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 6);
    }
  });

  describe("constructor validation", () => {
    it("throws RangeError for alpha0 <= 0", () => {
      expect(() => new BOCPDDetector({ alpha0: 0 })).toThrow(RangeError);
      expect(() => new BOCPDDetector({ alpha0: -1 })).toThrow(RangeError);
    });

    it("throws RangeError for beta0 <= 0", () => {
      expect(() => new BOCPDDetector({ beta0: 0 })).toThrow(RangeError);
    });

    it("throws RangeError for kappa0 <= 0", () => {
      expect(() => new BOCPDDetector({ kappa0: 0 })).toThrow(RangeError);
    });

    it("throws RangeError for hazardRate outside (0, 1)", () => {
      expect(() => new BOCPDDetector({ hazardRate: 0 })).toThrow(RangeError);
      expect(() => new BOCPDDetector({ hazardRate: 1 })).toThrow(RangeError);
      expect(() => new BOCPDDetector({ hazardRate: -0.1 })).toThrow(RangeError);
    });

    it("throws RangeError for maxRunLength <= 0 or non-integer", () => {
      expect(() => new BOCPDDetector({ maxRunLength: 0 })).toThrow(RangeError);
      expect(() => new BOCPDDetector({ maxRunLength: 1.5 })).toThrow(RangeError);
    });
  });
});

// ============ BOCPDRegistry ============

describe("BOCPDRegistry", () => {
  it("getOrCreate returns same instance for same metric", () => {
    const registry = new BOCPDRegistry();
    const d1 = registry.getOrCreate("phiL");
    const d2 = registry.getOrCreate("phiL");
    expect(d1).toBe(d2);
  });

  it("observations on metric A do not affect metric B", () => {
    const registry = new BOCPDRegistry();

    // Feed many observations to A
    for (let i = 0; i < 20; i++) {
      registry.observe("A", i * 2);
    }

    // B should still be at initial state
    const stateB = registry.getState("B");
    expect(stateB).toBeUndefined();

    // Create B and check it's fresh
    registry.observe("B", 0);
    const stateBAfter = registry.getState("B")!;
    expect(stateBAfter.runLengths.length).toBe(2); // initial 1 + first observation
  });

  it("reset(A) does not affect B", () => {
    const registry = new BOCPDRegistry();
    registry.observe("A", 1);
    registry.observe("A", 2);
    registry.observe("B", 1);
    registry.observe("B", 2);

    const stateBBefore = registry.getState("B")!;
    const bRunLengths = [...stateBBefore.runLengths];

    registry.reset("A");

    const stateAAfter = registry.getState("A")!;
    const stateBAfter = registry.getState("B")!;

    // A was reset — single run-length entry
    expect(stateAAfter.runLengths.length).toBe(1);
    // B unchanged
    expect(stateBAfter.runLengths).toEqual(bRunLengths);
  });

  it("resetAll resets all metrics to initial state", () => {
    const registry = new BOCPDRegistry();
    registry.observe("X", 10);
    registry.observe("X", 20);
    registry.observe("Y", 30);

    registry.resetAll();

    const stateX = registry.getState("X")!;
    const stateY = registry.getState("Y")!;
    expect(stateX.runLengths.length).toBe(1);
    expect(stateY.runLengths.length).toBe(1);
    expect(stateX.runLengths[0]).toBe(1.0);
    expect(stateY.runLengths[0]).toBe(1.0);
  });

  it("reset on unknown metric is a no-op", () => {
    const registry = new BOCPDRegistry();
    expect(() => registry.reset("nonexistent")).not.toThrow();
  });

  it("setState loads persisted state", () => {
    const registry = new BOCPDRegistry();
    registry.observe("m", 1); // create the entry

    const custom: BOCPDState = {
      mu0: 0, kappa0: 1, alpha0: 1, beta0: 1,
      mus: [0, 0.5], kappas: [1, 2], alphas: [1, 1.5], betas: [1, 1.2],
      runLengths: [0.3, 0.7],
      maxRunLength: 500,
    };
    registry.setState("m", custom);

    expect(registry.getState("m")).toEqual(custom);
  });
});

// ============ Hybrid BOCPD Trigger ============

describe("evaluateBOCPDTrigger", () => {
  it("fires when changePointProbability >= threshold", () => {
    const registry = new BOCPDRegistry({ hazardRate: 1 / 50 });

    // Build up a stable baseline at 0
    const rng = mulberry32(42);
    for (let i = 0; i < 40; i++) {
      registry.observe("test", gaussianSample(rng, 0, 1));
    }

    // Inject a large shift
    let fired = false;
    for (let i = 0; i < 10; i++) {
      const result = evaluateBOCPDTrigger(
        { metricName: "test", changePointThreshold: 0.5, registry },
        gaussianSample(rng, 10, 1),
      );
      if (result.fired) {
        fired = true;
        expect(result.changePointProbability).toBeGreaterThanOrEqual(0.5);
        expect(result.recalibrated).toBe(true);
        expect(result.detail).toContain("drift detected");
        break;
      }
    }
    expect(fired).toBe(true);
  });

  it("does not fire when stable", () => {
    const registry = new BOCPDRegistry({ hazardRate: 1 / 100 });

    const rng = mulberry32(77);
    for (let i = 0; i < 30; i++) {
      registry.observe("stable", gaussianSample(rng, 0, 1));
    }

    const result = evaluateBOCPDTrigger(
      { metricName: "stable", changePointThreshold: 0.7, registry },
      gaussianSample(rng, 0, 1),
    );
    expect(result.fired).toBe(false);
    expect(result.recalibrated).toBe(false);
    expect(result.detail).toContain("stable");
  });

  it("self-stabilises — next observation after fire returns low probability", () => {
    const registry = new BOCPDRegistry({ hazardRate: 1 / 20 });

    // Build baseline then shift
    const rng = mulberry32(55);
    for (let i = 0; i < 30; i++) {
      registry.observe("reset-test", gaussianSample(rng, 0, 1));
    }

    // Force a fire by injecting extreme values
    let didFire = false;
    for (let i = 0; i < 15; i++) {
      const result = evaluateBOCPDTrigger(
        { metricName: "reset-test", changePointThreshold: 0.3, registry },
        20, // extreme outlier
      );
      if (result.fired) {
        didFire = true;
        break;
      }
    }
    expect(didFire).toBe(true);

    // Next observation after reset should have low change-point probability
    const afterReset = evaluateBOCPDTrigger(
      { metricName: "reset-test", changePointThreshold: 0.3, registry },
      20, // same value — now it's the baseline
    );
    // With fresh prior, a single observation can't trigger high cp
    expect(afterReset.changePointProbability).toBeLessThan(0.5);
  });
});

// ============ Persistence Round-Trip ============

describe("BOCPDState JSON persistence", () => {
  it("JSON.stringify → JSON.parse round-trip preserves state exactly", () => {
    const detector = new BOCPDDetector();
    let state = detector.initialState();

    const rng = mulberry32(314);
    for (let i = 0; i < 25; i++) {
      const { nextState } = detector.update(gaussianSample(rng, 0, 1), state);
      state = nextState;
    }

    const serialised = JSON.stringify(state);
    const deserialised: BOCPDState = JSON.parse(serialised);

    expect(deserialised).toEqual(state);
    expect(deserialised.mus.length).toBe(state.mus.length);
    expect(deserialised.runLengths.length).toBe(state.runLengths.length);
  });

  it("edge values survive round-trip", () => {
    const state: BOCPDState = {
      mu0: 0, kappa0: 1e-10, alpha0: 1e-8, beta0: 1e12,
      mus: [1e-300, 1e300],
      kappas: [Number.MIN_VALUE, Number.MAX_VALUE],
      alphas: [0.001, 999999],
      betas: [0.001, 999999],
      runLengths: [0.999, 0.001],
      maxRunLength: 500,
    };

    const roundTripped: BOCPDState = JSON.parse(JSON.stringify(state));
    expect(roundTripped.kappas[0]).toBe(state.kappas[0]);
    expect(roundTripped.kappas[1]).toBe(state.kappas[1]);
    expect(roundTripped.mus[0]).toBe(state.mus[0]);
    expect(roundTripped.mus[1]).toBe(state.mus[1]);
  });

  it("initial state (single-element arrays) round-trips", () => {
    const detector = new BOCPDDetector();
    const state = detector.initialState();

    const roundTripped: BOCPDState = JSON.parse(JSON.stringify(state));
    expect(roundTripped).toEqual(state);
    expect(roundTripped.runLengths).toEqual([1.0]);
  });
});

// ============ Test Helpers ============

/** Mulberry32 PRNG — deterministic, seeded. */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller Gaussian sample from a seeded PRNG. */
function gaussianSample(rng: () => number, mean: number, stddev: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}
