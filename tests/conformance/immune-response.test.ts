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
 * @future(M-18) tests assert the full event-triggered structural review
 * pipeline: 6 trigger types → structural review → 5 diagnostic computations
 * → graph persistence → observable structural signals.
 *
 * @see codex-signum-v4_3-draft.md §Event-Triggered Structural Review
 * @see engineering-bridge-v2.0.md §Part 8 "Structural Review"
 */
import { describe, expect, it, vi } from "vitest";
import {
  checkStructuralTriggers,
} from "../../src/computation/structural-triggers.js";
import type { TriggerInputState } from "../../src/computation/structural-triggers.js";
import type { StructuralReviewResult } from "../../src/computation/structural-review.js";

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

// ── @future(M-18): Event-Triggered Structural Review ─────────────────────
// These tests assert the v4.3 spec contracts for the immune response
// orchestration. Expected to FAIL until M-18 wires the full pipeline.
//
// v4.3 §Event-Triggered Structural Review specifies:
// - 6 trigger types automatically assembled from live system state
// - Triggers feed into structural review (5 diagnostics)
// - Review results persist to graph as ThresholdEvent/Observation
// - Trigger input state assembled from real graph state (not caller-provided)
// - System automatically detects when to run review (not explicitly called)

describe("evaluateAndReviewIfNeeded — @future(M-18) orchestration", () => {
  // Mock the graph queries module for controlled testing
  vi.mock("../../src/graph/queries.js", () => ({
    getPatternAdjacency: vi.fn().mockResolvedValue([
      { from: "bloom-a", to: "bloom-b", weight: 1.0 },
      { from: "bloom-b", to: "bloom-c", weight: 0.8 },
      { from: "bloom-a", to: "bloom-c", weight: 0.5 },
    ]),
    getPatternsWithHealth: vi.fn().mockResolvedValue([
      { id: "bloom-a", phiL: 0.9, state: "active", degree: 2 },
      { id: "bloom-b", phiL: 0.3, state: "active", degree: 2 },
      { id: "bloom-c", phiL: 0.7, state: "active", degree: 2 },
    ]),
  }));

  it("@future(M-18) assembles TriggerInputState from live graph state automatically", async () => {
    // Per v4.3 spec: the immune response system should automatically
    // assemble TriggerInputState from the live graph. Currently the caller
    // must construct this state manually. M-18 should provide:
    // assembleTriggerState(): Promise<TriggerInputState>
    // that queries the graph for λ₂, friction, cascade depth, εR, ΦL velocity, Ω gradients
    const immuneModule = await import("../../src/computation/immune-response.js");

    // Per spec: automatic state assembly function must exist
    expect((immuneModule as Record<string, unknown>).assembleTriggerState).toBeDefined();
    expect(typeof (immuneModule as Record<string, unknown>).assembleTriggerState).toBe("function");
  });

  it("@future(M-18) review result persists to graph as structural Observation", async () => {
    const { evaluateAndReviewIfNeeded } = await import(
      "../../src/computation/immune-response.js"
    );
    const unhealthyState: TriggerInputState = {
      ...healthyState,
      currentLambda2: 0.05,
      previousLambda2: 0.9,
    };
    const result = await evaluateAndReviewIfNeeded(unhealthyState);

    expect(result).not.toBeNull();
    // Per v4.3 spec: structural review results must persist to graph
    // The review result should include a reference to the persisted Observation
    const review = result!.review as StructuralReviewResult & {
      persistedObservationId?: string;
    };
    expect(review.persistedObservationId).toBeDefined();
    expect(typeof review.persistedObservationId).toBe("string");
  });

  it("@future(M-18) review result contains all 5 diagnostics with actionable recommendations", async () => {
    const { evaluateAndReviewIfNeeded } = await import(
      "../../src/computation/immune-response.js"
    );
    const triggerState: TriggerInputState = {
      ...healthyState,
      currentCascadeDepth: 2,
    };
    const result = await evaluateAndReviewIfNeeded(triggerState);

    expect(result).not.toBeNull();
    const review = result!.review as StructuralReviewResult & {
      recommendations?: Array<{ diagnostic: string; action: string; severity: string }>;
    };
    // Per v4.3 spec: review MUST include actionable recommendations
    // derived from the 5 diagnostics, not just raw numbers
    expect(review.recommendations).toBeDefined();
    expect(Array.isArray(review.recommendations)).toBe(true);
    expect(review.recommendations!.length).toBeGreaterThan(0);
    // Each recommendation should reference a diagnostic and suggest action
    for (const rec of review.recommendations!) {
      expect(rec.diagnostic).toBeDefined();
      expect(rec.action).toBeDefined();
      expect(rec.severity).toBeDefined();
    }
  });

  it("@future(M-18) fired triggers produce ThresholdEvent nodes in graph", async () => {
    const { evaluateAndReviewIfNeeded } = await import(
      "../../src/computation/immune-response.js"
    );
    const multiTriggerState: TriggerInputState = {
      ...healthyState,
      currentCascadeDepth: 2,
      ecosystemPhiLVelocity: -0.08,
    };
    const result = await evaluateAndReviewIfNeeded(multiTriggerState);

    expect(result).not.toBeNull();
    // Per v4.3 spec: each fired trigger should produce a ThresholdEvent
    // persisted to the graph with trigger type, timestamp, and severity
    const triggers = result!.triggers as Array<{
      trigger: string;
      thresholdEventId?: string;
    }>;
    for (const trigger of triggers) {
      expect(trigger.thresholdEventId).toBeDefined();
      expect(typeof trigger.thresholdEventId).toBe("string");
    }
  });

  it("@future(M-18) does not query graph if no triggers fire (early exit)", async () => {
    const queries = await import("../../src/graph/queries.js");
    vi.mocked(queries.getPatternAdjacency).mockClear();
    vi.mocked(queries.getPatternsWithHealth).mockClear();

    const { evaluateAndReviewIfNeeded } = await import(
      "../../src/computation/immune-response.js"
    );
    const result = await evaluateAndReviewIfNeeded(healthyState);

    expect(result).toBeNull();
    // Graph queries should NOT have been called — early exit
    expect(queries.getPatternAdjacency).not.toHaveBeenCalled();
    expect(queries.getPatternsWithHealth).not.toHaveBeenCalled();
  });
});
