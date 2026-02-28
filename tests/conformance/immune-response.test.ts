// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Immune Response Orchestration
 *
 * evaluateAndReviewIfNeeded() requires graph queries (not pure).
 * Tests for pure trigger logic live in structural-triggers.test.ts.
 * Tests here verify the orchestration contract and types.
 *
 * @see engineering-bridge-v2.0.md §Part 8 "Structural Review"
 */
import { describe, expect, it } from "vitest";
import {
  checkStructuralTriggers,
} from "../../src/computation/structural-triggers.js";
import type { TriggerInputState } from "../../src/computation/structural-triggers.js";

// ── Trigger firing (pure, testable without graph) ─────────────────────────

/** Minimal healthy state — no trigger conditions satisfied */
const healthyState: TriggerInputState = {
  currentLambda2: 0.5,
  previousLambda2: 0.5,           // No λ₂ drop
  currentFriction: 0.1,           // ≤ 0.5 — friction spike won't fire
  correctionHelixTemporalConstant: 100,
  frictionDuration: 0,            // No sustained friction
  currentCascadeDepth: 0,         // < CASCADE_LIMIT (2)
  compositionEpsilonR: 0.1,       // ≤ stableRange.max (0.30)
  epsilonRStableRange: { min: 0.05, max: 0.3 },
  ecosystemPhiLVelocity: 0,       // |velocity| ≤ 0.05
  omegaGradientHistory: [0.1, 0.1, 0.1, 0.1], // All positive — no inversion
};

describe("checkStructuralTriggers — immune trigger conditions", () => {
  it("healthy state → no triggers fire", () => {
    const triggers = checkStructuralTriggers(healthyState);
    expect(triggers).toHaveLength(0);
  });

  it("significant λ₂ drop → triggers fire", () => {
    const state: TriggerInputState = {
      ...healthyState,
      currentLambda2: 0.1,
      previousLambda2: 0.9, // 88.9% drop > 20% threshold
    };
    const triggers = checkStructuralTriggers(state);
    expect(triggers.length).toBeGreaterThan(0);
    expect(triggers[0].trigger).toBe("lambda2_drop_on_formation");
  });

  it("cascade depth ≥ 2 → cascade_activation fires", () => {
    const state: TriggerInputState = {
      ...healthyState,
      currentCascadeDepth: 2, // At CASCADE_LIMIT
    };
    const triggers = checkStructuralTriggers(state);
    expect(triggers.some(t => t.trigger === "cascade_activation")).toBe(true);
  });

  it("εR spike beyond stable range → epsilon_r_spike fires", () => {
    const state: TriggerInputState = {
      ...healthyState,
      compositionEpsilonR: 0.5, // > stableRange.max (0.30)
    };
    const triggers = checkStructuralTriggers(state);
    expect(triggers.some(t => t.trigger === "epsilon_r_spike")).toBe(true);
  });

  it("ΦL velocity anomaly > 0.05/day → phi_l_velocity_anomaly fires", () => {
    const state: TriggerInputState = {
      ...healthyState,
      ecosystemPhiLVelocity: -0.08, // |velocity| = 0.08 > 0.05
    };
    const triggers = checkStructuralTriggers(state);
    expect(triggers.some(t => t.trigger === "phi_l_velocity_anomaly")).toBe(true);
  });

  it("Ω gradient inversion after sustained positive → omega_gradient_inversion fires", () => {
    const state: TriggerInputState = {
      ...healthyState,
      omegaGradientHistory: [0.2, 0.3, 0.4, 0.5, -0.2], // Positive then negative
    };
    const triggers = checkStructuralTriggers(state);
    expect(triggers.some(t => t.trigger === "omega_gradient_inversion")).toBe(true);
  });
});

// ── Integration (requires Neo4j) ──────────────────────────────────────────

describe("evaluateAndReviewIfNeeded (integration — requires Neo4j)", () => {
  it.todo("returns null when no triggers fire (healthy system)");
  it.todo("returns review result when at least one trigger fires");
  it.todo("review result contains all 5 diagnostics");
  it.todo("fired trigger IDs are included in result");
  it.todo("does not query graph if no triggers fire (early exit)");
});
