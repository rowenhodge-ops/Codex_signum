// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Immune Response Orchestration
 *
 * evaluateAndReviewIfNeeded() requires graph queries (not pure).
 * Tests for pure trigger logic live in structural-triggers.test.ts.
 * Tests here verify the orchestration contract, types, and persistence.
 *
 * M-22.7 wires the full event-triggered structural review pipeline:
 * assembleTriggerState → 6 triggers → structural review → 5 diagnostics
 * → graph persistence → observable structural signals.
 *
 * @see cs-v5.0.md §Event-Triggered Structural Review
 * @see codex-signum-engineering-bridge-v3_0.md §Part 8 "Structural Review"
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
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
  refinementHelixTemporalConstant: 100,
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

// ── M-22.7: Event-Triggered Structural Review ─────────────────────────────
// These tests verify the immune response orchestration pipeline wired in M-22.7.

// Mock graph modules
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

vi.mock("../../src/graph/client.js", () => {
  const mockTx = {
    run: vi.fn().mockResolvedValue({ records: [] }),
  };
  return {
    runQuery: vi.fn().mockResolvedValue({ records: [] }),
    writeTransaction: vi.fn().mockImplementation(async (fn: (tx: typeof mockTx) => Promise<void>) => {
      await fn(mockTx);
    }),
    getDriver: vi.fn(),
    getSession: vi.fn(),
  };
});

describe("evaluateAndReviewIfNeeded — M-22.7 orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assembleTriggerState exists and is callable", async () => {
    const immuneModule = await import("../../src/computation/immune-response.js");
    expect((immuneModule as Record<string, unknown>).assembleTriggerState).toBeDefined();
    expect(typeof (immuneModule as Record<string, unknown>).assembleTriggerState).toBe("function");
  });

  it("review result persists to graph as structural Observation", async () => {
    const { evaluateAndReviewIfNeeded } = await import(
      "../../src/computation/immune-response.js"
    );
    const unhealthyState: TriggerInputState = {
      ...healthyState,
      currentLambda2: 0.05,
      previousLambda2: 0.9,
    };
    const result = await evaluateAndReviewIfNeeded(unhealthyState, "test-bloom");

    expect(result).not.toBeNull();
    const review = result!.review as StructuralReviewResult & {
      persistedObservationId?: string;
    };
    expect(review.persistedObservationId).toBeDefined();
    expect(typeof review.persistedObservationId).toBe("string");
  });

  it("review result contains all 5 diagnostics with actionable recommendations", async () => {
    const { evaluateAndReviewIfNeeded } = await import(
      "../../src/computation/immune-response.js"
    );
    const triggerState: TriggerInputState = {
      ...healthyState,
      currentCascadeDepth: 2,
    };
    const result = await evaluateAndReviewIfNeeded(triggerState, "test-bloom");

    expect(result).not.toBeNull();
    const review = result!.review as StructuralReviewResult & {
      recommendations?: Array<{ diagnostic: string; action: string; severity: string }>;
    };
    expect(review.recommendations).toBeDefined();
    expect(Array.isArray(review.recommendations)).toBe(true);
    expect(review.recommendations!.length).toBeGreaterThan(0);
    for (const rec of review.recommendations!) {
      expect(rec.diagnostic).toBeDefined();
      expect(rec.action).toBeDefined();
      expect(rec.severity).toBeDefined();
    }
  });

  it("fired triggers produce ThresholdEvent references", async () => {
    const { evaluateAndReviewIfNeeded } = await import(
      "../../src/computation/immune-response.js"
    );
    const multiTriggerState: TriggerInputState = {
      ...healthyState,
      currentCascadeDepth: 2,
      ecosystemPhiLVelocity: -0.08,
    };
    const result = await evaluateAndReviewIfNeeded(multiTriggerState, "test-bloom");

    expect(result).not.toBeNull();
    const triggers = result!.triggers as Array<{
      trigger: string;
      thresholdEventId?: string;
    }>;
    for (const trigger of triggers) {
      expect(trigger.thresholdEventId).toBeDefined();
      expect(typeof trigger.thresholdEventId).toBe("string");
    }
  });

  it("does not query graph if no triggers fire (early exit)", async () => {
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

// ── M-22.7: Live Immune Response (new tests) ─────────────────────────────

describe("M-22.7: assembleTriggerState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns valid TriggerInputState from graph state", async () => {
    const { runQuery } = await import("../../src/graph/client.js");
    const phiLState = JSON.stringify({ ringBuffer: [0.6, 0.65, 0.7, 0.72, 0.75], maxSize: 20 });
    vi.mocked(runQuery).mockResolvedValueOnce({
      records: [{
        get: (key: string) => {
          const data: Record<string, unknown> = {
            lambda2: 0.42,
            prevLambda2: 0.38,
            friction: 0.15,
            epsilonR: 0.12,
            phiL: 0.75,
            phiLState,
            connCount: 5,
            obsCount: 10,
          };
          return data[key] ?? null;
        },
      }],
    } as never);

    const { assembleTriggerState } = await import("../../src/computation/immune-response.js");
    const state = await assembleTriggerState("test-bloom");

    expect(state.currentLambda2).toBe(0.42);
    expect(state.previousLambda2).toBe(0.38);
    expect(state.currentFriction).toBe(0.15);
    expect(state.compositionEpsilonR).toBe(0.12);
    expect(state.epsilonRStableRange).toBeDefined();
    expect(state.epsilonRStableRange.min).toBeLessThan(state.epsilonRStableRange.max);
    expect(state.ecosystemPhiLVelocity).toBeCloseTo(0.75 - 0.72, 5);
    expect(state.omegaGradientHistory).toHaveLength(4);
  });

  it("returns safe defaults when data is null", async () => {
    const { runQuery } = await import("../../src/graph/client.js");
    vi.mocked(runQuery).mockResolvedValueOnce({
      records: [{
        get: () => null,
      }],
    } as never);

    const { assembleTriggerState } = await import("../../src/computation/immune-response.js");
    const state = await assembleTriggerState("empty-bloom");

    // Defaults should not fire any triggers
    const triggers = checkStructuralTriggers(state);
    expect(triggers).toHaveLength(0);
  });

  it("returns safe defaults when bloom not found", async () => {
    const { runQuery } = await import("../../src/graph/client.js");
    vi.mocked(runQuery).mockResolvedValueOnce({ records: [] } as never);

    const { assembleTriggerState } = await import("../../src/computation/immune-response.js");
    const state = await assembleTriggerState("nonexistent-bloom");

    const triggers = checkStructuralTriggers(state);
    expect(triggers).toHaveLength(0);
  });
});

describe("M-22.7: persistTriggeredEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates ThresholdEvent nodes for each trigger", async () => {
    const { writeTransaction } = await import("../../src/graph/client.js");
    const txRunCalls: Array<{ query: string; params: Record<string, unknown> }> = [];
    vi.mocked(writeTransaction).mockImplementation(async (fn) => {
      const mockTx = {
        run: vi.fn().mockImplementation((query: string, params: Record<string, unknown>) => {
          txRunCalls.push({ query, params });
          return { records: [] };
        }),
      };
      await fn(mockTx as never);
    });

    const { persistTriggeredEvents } = await import("../../src/computation/immune-response.js");
    const ids = await persistTriggeredEvents("bloom-1", [
      { trigger: "cascade_activation", severity: "critical", detail: "Cascade depth 2" },
      { trigger: "phi_l_velocity_anomaly", severity: "warning", detail: "|velocity| = 0.08" },
    ]);

    expect(ids).toHaveLength(2);
    expect(txRunCalls).toHaveLength(2);
    expect(txRunCalls[0].query).toContain("ThresholdEvent");
    expect(txRunCalls[0].params.trigger).toBe("cascade_activation");
    expect(txRunCalls[1].params.trigger).toBe("phi_l_velocity_anomaly");
  });
});

describe("M-22.7: persistReviewResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates finding Seed in Structural Review Grid", async () => {
    const { writeTransaction } = await import("../../src/graph/client.js");
    const txRunCalls: Array<{ query: string; params: Record<string, unknown> }> = [];
    vi.mocked(writeTransaction).mockImplementation(async (fn) => {
      const mockTx = {
        run: vi.fn().mockImplementation((query: string, params: Record<string, unknown>) => {
          txRunCalls.push({ query, params });
          return { records: [] };
        }),
      };
      await fn(mockTx as never);
    });

    const { persistReviewResults } = await import("../../src/computation/immune-response.js");
    const mockReview: StructuralReviewResult = {
      computedAt: new Date(),
      triggers: ["cascade_activation"],
      globalLambda2: 0.05,
      spectralGap: 12.5,
      hubDependencies: [{ nodeId: "hub-1", degree: 8, lambda2WithoutNode: 0.01, lambda2Drop: 0.04, criticality: 0.8 }],
      frictionDistribution: { globalFriction: 0.35, hotspots: [], stats: { mean: 0.2, median: 0.15, stddev: 0.1 } },
      dampeningAssessment: { adequate: true, riskNodes: [], meanGamma: 0.4 },
    };

    const id = await persistReviewResults(
      "bloom-1",
      mockReview,
      [{ trigger: "cascade_activation", severity: "critical", detail: "test" }],
      ["te-1"],
    );

    expect(typeof id).toBe("string");
    expect(id).toContain("srf-bloom-1");
    // Should have 2 calls: MERGE grid + CREATE finding
    expect(txRunCalls).toHaveLength(2);
    expect(txRunCalls[0].query).toContain("grid:structural-review");
    expect(txRunCalls[1].query).toContain("structural-review-finding");
    expect(txRunCalls[1].params.globalLambda2).toBe(0.05);
  });
});

describe("M-22.7: evaluateAndReviewIfNeeded persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists when bloomId provided", async () => {
    const { writeTransaction } = await import("../../src/graph/client.js");
    vi.mocked(writeTransaction).mockImplementation(async (fn) => {
      const mockTx = { run: vi.fn().mockResolvedValue({ records: [] }) };
      await fn(mockTx as never);
    });

    const { evaluateAndReviewIfNeeded } = await import("../../src/computation/immune-response.js");
    const result = await evaluateAndReviewIfNeeded(
      { ...healthyState, currentCascadeDepth: 2 },
      "bloom-persist",
    );

    expect(result).not.toBeNull();
    expect(result!.review.persistedObservationId).toBeDefined();
    expect(writeTransaction).toHaveBeenCalled();
  });

  it("skips persistence when bloomId omitted", async () => {
    const { writeTransaction } = await import("../../src/graph/client.js");
    vi.mocked(writeTransaction).mockClear();

    const { evaluateAndReviewIfNeeded } = await import("../../src/computation/immune-response.js");
    const result = await evaluateAndReviewIfNeeded(
      { ...healthyState, currentCascadeDepth: 2 },
    );

    expect(result).not.toBeNull();
    expect(result!.review.persistedObservationId).toBeUndefined();
    // writeTransaction should NOT be called for persistence
    expect(writeTransaction).not.toHaveBeenCalled();
  });
});
