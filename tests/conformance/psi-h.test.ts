// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: ΨH (Harmonic Signature) Computation
 *
 * ΨH is RELATIONAL — computed from subgraph λ₂, not averaged from children.
 * Formula: ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)
 *
 * @see engineering-bridge-v2.0.md §Part 2 "ΨH"
 */
import { describe, expect, it } from "vitest";
import { computePsiH, computePsiHWithState, createDefaultPsiHState } from "../../src/computation/psi-h.js";
import type { GraphEdge, NodeHealth } from "../../src/computation/psi-h.js";
import { PSI_H_WEIGHTS } from "../../src/types/state-dimensions.js";
import type { PsiHState } from "../../src/types/state-dimensions.js";

const triangleEdges: GraphEdge[] = [
  { from: "a", to: "b", weight: 1 },
  { from: "b", to: "c", weight: 1 },
  { from: "a", to: "c", weight: 1 },
];

// ── Spec weights ───────────────────────────────────────────────────────────

describe("ΨH spec weights", () => {
  it("structural weight = 0.4", () => {
    expect(PSI_H_WEIGHTS.structural).toBeCloseTo(0.4, 4);
  });

  it("runtime weight = 0.6", () => {
    expect(PSI_H_WEIGHTS.runtime).toBeCloseTo(0.6, 4);
  });

  it("weights sum to 1.0", () => {
    expect(PSI_H_WEIGHTS.structural + PSI_H_WEIGHTS.runtime).toBeCloseTo(1.0, 8);
  });
});

// ── Structure ─────────────────────────────────────────────────────────────

describe("ΨH output structure", () => {
  it("returns object with required fields", () => {
    const health: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.7 },
      { id: "c", phiL: 0.9 },
    ];
    const psi = computePsiH(triangleEdges, health);
    expect(typeof psi.lambda2).toBe("number");
    expect(typeof psi.friction).toBe("number");
    expect(typeof psi.combined).toBe("number");
    expect(psi.computedAt).toBeInstanceOf(Date);
  });

  it("combined is in [0, 1]", () => {
    const health: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.7 },
    ];
    const edges: GraphEdge[] = [{ from: "a", to: "b", weight: 1 }];
    const psi = computePsiH(edges, health);
    expect(psi.combined).toBeGreaterThanOrEqual(0);
    expect(psi.combined).toBeLessThanOrEqual(1);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────

describe("ΨH edge cases", () => {
  it("empty nodes → returns zero combined", () => {
    const psi = computePsiH([], []);
    expect(psi.combined).toBe(0);
    expect(psi.lambda2).toBe(0);
  });

  it("single node → no friction (singleton)", () => {
    const psi = computePsiH([], [{ id: "a", phiL: 0.8 }]);
    expect(psi.friction).toBe(0);
  });
});

// ── Relational property ───────────────────────────────────────────────────

describe("ΨH is relational (not averaged from children)", () => {
  it("uniform ΦL across connected nodes → low friction", () => {
    const uniformHealth: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.8 },
      { id: "c", phiL: 0.8 },
    ];
    const psi = computePsiH(triangleEdges, uniformHealth);
    expect(psi.friction).toBeCloseTo(0, 4);
  });

  it("divergent ΦL across connected nodes → higher friction", () => {
    const divergentHealth: NodeHealth[] = [
      { id: "a", phiL: 0.1 },
      { id: "b", phiL: 0.9 },
      { id: "c", phiL: 0.1 },
    ];
    const psi = computePsiH(triangleEdges, divergentHealth);
    expect(psi.friction).toBeGreaterThan(0.4);
  });
});

// ── λ₂ ────────────────────────────────────────────────────────────────────

describe("ΨH λ₂ property", () => {
  it("connected graph → positive λ₂", () => {
    const health: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.7 },
      { id: "c", phiL: 0.9 },
    ];
    const psi = computePsiH(triangleEdges, health);
    expect(psi.lambda2).toBeGreaterThan(0);
  });

  it("disconnected nodes → λ₂ = 0", () => {
    const health: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.7 },
    ];
    const psi = computePsiH([], health);
    expect(psi.lambda2).toBeCloseTo(0, 4);
  });
});

// ── M-22.3: Pipeline ΨH Wiring ──────────────────────────────────────────

describe("M-22.3: createDefaultPsiHState factory", () => {
  it("returns state with maxSize=40 and alpha=0.15", () => {
    const state = createDefaultPsiHState();
    expect(state.maxSize).toBe(40);
    expect(state.alpha).toBe(0.15);
    expect(state.ringBuffer).toEqual([]);
    expect(state.trend).toBeUndefined();
    expect(state.baseline).toBeUndefined();
  });
});

describe("M-22.3: ΨH with single-node composition", () => {
  it("single child, no inter-edges → λ₂=0, friction=0", () => {
    const edges: GraphEdge[] = [];
    const nodeHealths: NodeHealth[] = [{ id: "child-1", phiL: 0.7 }];
    const psi = computePsiH(edges, nodeHealths);
    expect(psi.lambda2).toBe(0);
    expect(psi.friction).toBe(0);
    // combined = 0.4 × 0 + 0.6 × (1 - 0) = 0.6
    expect(psi.combined).toBeCloseTo(PSI_H_WEIGHTS.runtime, 4);
  });
});

describe("M-22.3: computePsiHWithState ring buffer growth", () => {
  it("ring buffer grows across successive calls", () => {
    const edges: GraphEdge[] = [
      { from: "a", to: "b", weight: 1 },
      { from: "b", to: "c", weight: 1 },
    ];
    const nodeHealths: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.7 },
      { id: "c", phiL: 0.9 },
    ];

    // First call
    const state1 = createDefaultPsiHState();
    const result1 = computePsiHWithState(edges, nodeHealths, state1);
    expect(result1.updatedState.ringBuffer.length).toBe(1);
    expect(result1.psiH.combined).toBeGreaterThan(0);

    // Second call with updated state
    const result2 = computePsiHWithState(edges, nodeHealths, result1.updatedState);
    expect(result2.updatedState.ringBuffer.length).toBe(2);

    // Trend should be defined after first call
    expect(result2.updatedState.trend).toBeDefined();
  });

  it("ring buffer respects maxSize", () => {
    const edges: GraphEdge[] = [{ from: "a", to: "b", weight: 1 }];
    const nodeHealths: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.7 },
    ];

    // Start with a state whose buffer is already at capacity
    let state: PsiHState = {
      ringBuffer: new Array(40).fill(0.5),
      maxSize: 40,
      alpha: 0.15,
      trend: 0.5,
      baseline: 0.5,
    };

    const result = computePsiHWithState(edges, nodeHealths, state);
    // Buffer should not exceed maxSize
    expect(result.updatedState.ringBuffer.length).toBe(40);
  });
});

describe("M-22.3: computePsiHWithState temporal decomposition", () => {
  it("produces valid decomposition fields", () => {
    const edges: GraphEdge[] = [
      { from: "a", to: "b", weight: 1 },
      { from: "a", to: "c", weight: 1 },
    ];
    const nodeHealths: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.6 },
      { id: "c", phiL: 0.9 },
    ];

    const state = createDefaultPsiHState();
    const { psiH, decomposition } = computePsiHWithState(edges, nodeHealths, state);

    expect(decomposition.psiH_instant).toBe(psiH.combined);
    expect(typeof decomposition.psiH_trend).toBe("number");
    expect(typeof decomposition.friction_transient).toBe("number");
    expect(typeof decomposition.friction_durable).toBe("number");
    // On first call, transient friction = |instant - trend| ≈ 0 (trend initialises to instant)
    expect(decomposition.friction_transient).toBeCloseTo(0, 4);
    // On first call, durable friction = 0 (baseline not yet established)
    expect(decomposition.friction_durable).toBe(0);
  });
});
