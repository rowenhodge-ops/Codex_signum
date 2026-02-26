/**
 * Codex Signum — Conformance Tests: ΨH (Harmonic Signature) Computation
 *
 * ΨH is RELATIONAL — computed from subgraph λ₂, not averaged from children.
 * Formula: ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)
 *
 * @see engineering-bridge-v2.0.md §Part 2 "ΨH"
 */
import { describe, expect, it } from "vitest";
import { computePsiH } from "../../src/computation/psi-h.js";
import type { GraphEdge, NodeHealth } from "../../src/computation/psi-h.js";
import { PSI_H_WEIGHTS } from "../../src/types/state-dimensions.js";

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
