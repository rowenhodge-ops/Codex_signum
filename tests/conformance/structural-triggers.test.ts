// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Structural Review Triggers
 *
 * Verifies the six trigger conditions per v3.0 §Event-Triggered Structural Review.
 */
import { describe, expect, it } from "vitest";
import {
  checkCascadeActivation,
  checkEpsilonRSpike,
  checkFrictionSpike,
  checkLambda2Drop,
  checkOmegaGradientInversion,
  checkPhiLVelocityAnomaly,
  checkStructuralTriggers,
  type TriggerInputState,
} from "../../src/computation/structural-triggers.js";

describe("Trigger 1: λ₂ drop on formation", () => {
  it("fires warning on 25% drop", () => {
    const result = checkLambda2Drop(1.0, 0.75);
    expect(result).not.toBeNull();
    expect(result!.trigger).toBe("lambda2_drop_on_formation");
    expect(result!.severity).toBe("warning");
  });

  it("fires critical when λ₂ drops below 0.1", () => {
    const result = checkLambda2Drop(1.0, 0.05);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe("critical");
  });

  it("does NOT fire on 10% drop", () => {
    const result = checkLambda2Drop(1.0, 0.9);
    expect(result).toBeNull();
  });

  it("does NOT fire on exactly 20% drop (boundary)", () => {
    const result = checkLambda2Drop(1.0, 0.8);
    expect(result).toBeNull();
  });

  it("does NOT fire if previous λ₂ was 0", () => {
    const result = checkLambda2Drop(0, 0.5);
    expect(result).toBeNull();
  });

  it("does NOT fire if λ₂ increased", () => {
    const result = checkLambda2Drop(0.5, 0.8);
    expect(result).toBeNull();
  });
});

describe("Trigger 2: Friction spike", () => {
  it("fires when high friction sustained beyond temporal constant", () => {
    const result = checkFrictionSpike(0.6, 100, 50);
    expect(result).not.toBeNull();
    expect(result!.trigger).toBe("friction_spike");
    expect(result!.severity).toBe("warning");
  });

  it("fires critical when friction ≥ 0.8", () => {
    const result = checkFrictionSpike(0.85, 100, 50);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe("critical");
  });

  it("does NOT fire when friction ≤ 0.5", () => {
    const result = checkFrictionSpike(0.5, 100, 50);
    expect(result).toBeNull();
  });

  it("does NOT fire when duration ≤ temporal constant", () => {
    const result = checkFrictionSpike(0.7, 50, 50);
    expect(result).toBeNull();
  });

  it("does NOT fire with short duration despite high friction", () => {
    const result = checkFrictionSpike(0.9, 10, 100);
    expect(result).toBeNull();
  });
});

describe("Trigger 3: Cascade activation", () => {
  it("fires critical at cascade depth 2 (= CASCADE_LIMIT)", () => {
    const result = checkCascadeActivation(2);
    expect(result).not.toBeNull();
    expect(result!.trigger).toBe("cascade_activation");
    expect(result!.severity).toBe("critical");
  });

  it("fires critical at cascade depth > 2", () => {
    const result = checkCascadeActivation(3);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe("critical");
  });

  it("does NOT fire at cascade depth 1", () => {
    const result = checkCascadeActivation(1);
    expect(result).toBeNull();
  });

  it("does NOT fire at cascade depth 0", () => {
    const result = checkCascadeActivation(0);
    expect(result).toBeNull();
  });
});

describe("Trigger 4: εR spike", () => {
  it("fires warning when εR above stable max", () => {
    const result = checkEpsilonRSpike(0.35, { min: 0.05, max: 0.3 });
    expect(result).not.toBeNull();
    expect(result!.trigger).toBe("epsilon_r_spike");
    expect(result!.severity).toBe("warning");
  });

  it("fires critical when εR ≥ 2× stable max", () => {
    const result = checkEpsilonRSpike(0.6, { min: 0.05, max: 0.3 });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe("critical");
  });

  it("does NOT fire when εR within stable range", () => {
    const result = checkEpsilonRSpike(0.2, { min: 0.05, max: 0.3 });
    expect(result).toBeNull();
  });

  it("does NOT fire when εR exactly at max", () => {
    const result = checkEpsilonRSpike(0.3, { min: 0.05, max: 0.3 });
    expect(result).toBeNull();
  });
});

describe("Trigger 5: ΦL velocity anomaly", () => {
  it("fires warning for velocity 0.06/day", () => {
    const result = checkPhiLVelocityAnomaly(0.06);
    expect(result).not.toBeNull();
    expect(result!.trigger).toBe("phi_l_velocity_anomaly");
    expect(result!.severity).toBe("warning");
  });

  it("fires critical for velocity 0.12/day", () => {
    const result = checkPhiLVelocityAnomaly(0.12);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe("critical");
  });

  it("fires for negative velocity (degradation)", () => {
    const result = checkPhiLVelocityAnomaly(-0.08);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe("warning");
  });

  it("does NOT fire for velocity 0.03/day", () => {
    const result = checkPhiLVelocityAnomaly(0.03);
    expect(result).toBeNull();
  });

  it("does NOT fire for exactly 0.05/day (boundary)", () => {
    const result = checkPhiLVelocityAnomaly(0.05);
    expect(result).toBeNull();
  });
});

describe("Trigger 6: Ω gradient inversion", () => {
  it("fires when positive gradient inverts to negative", () => {
    const result = checkOmegaGradientInversion([0.1, 0.2, 0.15, -0.05]);
    expect(result).not.toBeNull();
    expect(result!.trigger).toBe("omega_gradient_inversion");
    expect(result!.severity).toBe("warning");
  });

  it("fires critical when gradient < -0.1", () => {
    const result = checkOmegaGradientInversion([0.1, 0.2, 0.15, -0.15]);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe("critical");
  });

  it("does NOT fire when gradient stays positive", () => {
    const result = checkOmegaGradientInversion([0.1, 0.2, 0.3, 0.4]);
    expect(result).toBeNull();
  });

  it("does NOT fire with fewer than 4 values", () => {
    const result = checkOmegaGradientInversion([0.1, 0.2, -0.1]);
    expect(result).toBeNull();
  });

  it("does NOT fire when preceding values are mixed", () => {
    const result = checkOmegaGradientInversion([0.1, -0.2, 0.15, -0.05]);
    expect(result).toBeNull();
  });
});

describe("checkStructuralTriggers (combined)", () => {
  it("returns multiple simultaneous triggers", () => {
    const state: TriggerInputState = {
      previousLambda2: 1.0,
      currentLambda2: 0.05, // λ₂ drop + near-disconnection
      currentFriction: 0.9, // friction spike
      frictionDuration: 200,
      correctionHelixTemporalConstant: 100,
      currentCascadeDepth: 2, // cascade activation
      compositionEpsilonR: 0.2,
      epsilonRStableRange: { min: 0.05, max: 0.3 },
      ecosystemPhiLVelocity: 0.03,
      omegaGradientHistory: [0.1, 0.2, 0.3],
    };

    const events = checkStructuralTriggers(state);
    expect(events.length).toBeGreaterThanOrEqual(3);

    const triggerNames = events.map((e) => e.trigger);
    expect(triggerNames).toContain("lambda2_drop_on_formation");
    expect(triggerNames).toContain("friction_spike");
    expect(triggerNames).toContain("cascade_activation");
  });

  it("returns empty array when system is healthy", () => {
    const state: TriggerInputState = {
      previousLambda2: 1.0,
      currentLambda2: 0.95,
      currentFriction: 0.2,
      frictionDuration: 10,
      correctionHelixTemporalConstant: 100,
      currentCascadeDepth: 0,
      compositionEpsilonR: 0.1,
      epsilonRStableRange: { min: 0.05, max: 0.3 },
      ecosystemPhiLVelocity: 0.01,
      omegaGradientHistory: [0.1, 0.15, 0.2, 0.25],
    };

    const events = checkStructuralTriggers(state);
    expect(events).toHaveLength(0);
  });
});
