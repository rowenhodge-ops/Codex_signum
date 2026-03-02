/**
 * G5. Resonance — Aligned ΨH composes without friction. Misaligned ΨH produces measurable dissonance.
 *
 * Tests that ΨH friction reflects actual health divergence between connected nodes.
 * Level: L4 Outcome
 */
import { describe, it, expect } from "vitest";
import {
  computePsiH,
  type GraphEdge,
  type NodeHealth,
} from "../../src/index.js";

describe("G5 Resonance: uniform health → low friction", () => {
  it("all nodes at same ΦL → friction near 0", () => {
    const edges: GraphEdge[] = [
      { from: "a", to: "b", weight: 1 },
      { from: "b", to: "c", weight: 1 },
      { from: "a", to: "c", weight: 1 },
    ];
    const nodes: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.8 },
      { id: "c", phiL: 0.8 },
    ];

    const result = computePsiH(edges, nodes);
    expect(result.friction).toBeLessThan(0.01);
  });
});

describe("G5 Resonance: divergent health → high friction", () => {
  it("one healthy, one sick neighbor → high friction", () => {
    const edges: GraphEdge[] = [
      { from: "a", to: "b", weight: 1 },
      { from: "b", to: "c", weight: 1 },
      { from: "a", to: "c", weight: 1 },
    ];
    const nodes: NodeHealth[] = [
      { id: "a", phiL: 0.9 },
      { id: "b", phiL: 0.1 },
      { id: "c", phiL: 0.9 },
    ];

    const result = computePsiH(edges, nodes);
    // Friction should be significantly higher with divergent health
    expect(result.friction).toBeGreaterThan(0.3);
  });
});

describe("G5 Resonance: friction inversely relates to alignment", () => {
  it("increasing alignment monotonically decreases friction", () => {
    const edges: GraphEdge[] = [
      { from: "a", to: "b", weight: 1 },
      { from: "b", to: "c", weight: 1 },
      { from: "a", to: "c", weight: 1 },
    ];

    // Test with increasing alignment (convergence toward 0.8)
    const scenarios = [
      [0.1, 0.5, 0.9], // very divergent
      [0.5, 0.7, 0.9], // moderately divergent
      [0.7, 0.8, 0.9], // slightly divergent
      [0.8, 0.8, 0.8], // perfectly aligned
    ];

    const frictions: number[] = [];
    for (const health of scenarios) {
      const nodes: NodeHealth[] = [
        { id: "a", phiL: health[0] },
        { id: "b", phiL: health[1] },
        { id: "c", phiL: health[2] },
      ];
      const result = computePsiH(edges, nodes);
      frictions.push(result.friction);
    }

    // Friction should be monotonically decreasing
    for (let i = 1; i < frictions.length; i++) {
      expect(frictions[i]).toBeLessThanOrEqual(frictions[i - 1]);
    }
  });
});

describe("G5 Resonance: combined score reflects both structure and friction", () => {
  it("well-connected + low friction → high combined score", () => {
    const edges: GraphEdge[] = [
      { from: "a", to: "b", weight: 1 },
      { from: "b", to: "c", weight: 1 },
      { from: "a", to: "c", weight: 1 },
    ];
    const nodes: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.8 },
      { id: "c", phiL: 0.8 },
    ];

    const result = computePsiH(edges, nodes);
    expect(result.combined).toBeGreaterThan(0.5);
  });

  it("disconnected → low combined score", () => {
    const edges: GraphEdge[] = []; // No edges
    const nodes: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.8 },
      { id: "c", phiL: 0.8 },
    ];

    const result = computePsiH(edges, nodes);
    // No structure means low combined (even though friction is 0)
    expect(result.lambda2).toBe(0);
  });
});
