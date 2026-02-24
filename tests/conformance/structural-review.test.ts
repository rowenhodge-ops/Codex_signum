/**
 * Codex Signum — Conformance Tests: Structural Review Diagnostics
 *
 * Verifies the five diagnostic computations per v3.0 §Event-Triggered Structural Review.
 */
import { describe, expect, it } from "vitest";
import {
  assessDampening,
  computeFrictionDistribution,
  computeGlobalLambda2,
  computeHubDependencies,
  computeSpectralGap,
  runStructuralReview,
} from "../../src/computation/structural-review.js";
import type { GraphEdge, NodeHealth } from "../../src/computation/psi-h.js";

// ============ TEST GRAPHS ============

/** Triangle graph: 3 nodes, fully connected */
const triangleEdges: GraphEdge[] = [
  { from: "a", to: "b", weight: 1 },
  { from: "b", to: "c", weight: 1 },
  { from: "a", to: "c", weight: 1 },
];
const triangleNodes = ["a", "b", "c"];
const triangleHealth: NodeHealth[] = [
  { id: "a", phiL: 0.8 },
  { id: "b", phiL: 0.85 },
  { id: "c", phiL: 0.9 },
];

/** Star graph: center hub connected to 4 leaves */
const starEdges: GraphEdge[] = [
  { from: "hub", to: "l1", weight: 1 },
  { from: "hub", to: "l2", weight: 1 },
  { from: "hub", to: "l3", weight: 1 },
  { from: "hub", to: "l4", weight: 1 },
];
const starNodes = ["hub", "l1", "l2", "l3", "l4"];
const starHealth: NodeHealth[] = [
  { id: "hub", phiL: 0.8 },
  { id: "l1", phiL: 0.7 },
  { id: "l2", phiL: 0.75 },
  { id: "l3", phiL: 0.65 },
  { id: "l4", phiL: 0.9 },
];

/** Chain graph: 5 nodes in a line */
const chainEdges: GraphEdge[] = [
  { from: "n1", to: "n2", weight: 1 },
  { from: "n2", to: "n3", weight: 1 },
  { from: "n3", to: "n4", weight: 1 },
  { from: "n4", to: "n5", weight: 1 },
];
const chainNodes = ["n1", "n2", "n3", "n4", "n5"];

/** Complete graph: 4 nodes, all connected */
const completeEdges: GraphEdge[] = [
  { from: "a", to: "b", weight: 1 },
  { from: "a", to: "c", weight: 1 },
  { from: "a", to: "d", weight: 1 },
  { from: "b", to: "c", weight: 1 },
  { from: "b", to: "d", weight: 1 },
  { from: "c", to: "d", weight: 1 },
];
const completeNodes = ["a", "b", "c", "d"];

describe("Diagnostic 1: Global λ₂", () => {
  it("computes positive λ₂ for connected graph", () => {
    const lambda2 = computeGlobalLambda2(triangleEdges, triangleNodes);
    expect(lambda2).toBeGreaterThan(0);
  });

  it("returns 0 for disconnected graph (no edges)", () => {
    const lambda2 = computeGlobalLambda2([], ["a", "b", "c"]);
    expect(lambda2).toBeCloseTo(0, 4);
  });

  it("returns 0 for single node", () => {
    expect(computeGlobalLambda2([], ["a"])).toBe(0);
  });

  it("complete graph has higher λ₂ than chain", () => {
    const lambda2Complete = computeGlobalLambda2(completeEdges, completeNodes);
    const lambda2Chain = computeGlobalLambda2(chainEdges, chainNodes);
    expect(lambda2Complete).toBeGreaterThan(lambda2Chain);
  });
});

describe("Diagnostic 2: Spectral gap", () => {
  it("returns finite value for connected graph", () => {
    const gap = computeSpectralGap(triangleEdges, triangleNodes);
    expect(gap).toBeGreaterThan(0);
    expect(isFinite(gap)).toBe(true);
  });

  it("returns Infinity for disconnected graph", () => {
    const gap = computeSpectralGap([], ["a", "b"]);
    expect(gap).toBe(Infinity);
  });

  it("chain graph has higher spectral gap than complete graph", () => {
    // Chain: more imbalanced (endpoints differ from middle)
    // Complete: uniform connectivity
    const gapChain = computeSpectralGap(chainEdges, chainNodes);
    const gapComplete = computeSpectralGap(completeEdges, completeNodes);
    expect(gapChain).toBeGreaterThan(gapComplete);
  });
});

describe("Diagnostic 3: Hub dependency", () => {
  it("star topology → center node has highest criticality", () => {
    const lambda2 = computeGlobalLambda2(starEdges, starNodes);
    const hubs = computeHubDependencies(starEdges, starNodes, lambda2);

    expect(hubs.length).toBeGreaterThan(0);
    expect(hubs[0].nodeId).toBe("hub");
    expect(hubs[0].criticality).toBeGreaterThan(0);
  });

  it("returns empty for single-node or two-node graph", () => {
    expect(computeHubDependencies([], ["a"], 0)).toHaveLength(0);
    expect(
      computeHubDependencies([{ from: "a", to: "b", weight: 1 }], ["a", "b"], 0.5),
    ).toHaveLength(0);
  });

  it("respects topK parameter", () => {
    const lambda2 = computeGlobalLambda2(starEdges, starNodes);
    const hubs = computeHubDependencies(starEdges, starNodes, lambda2, 2);
    expect(hubs.length).toBeLessThanOrEqual(2);
  });

  it("sorted by criticality descending", () => {
    const lambda2 = computeGlobalLambda2(starEdges, starNodes);
    const hubs = computeHubDependencies(starEdges, starNodes, lambda2);
    for (let i = 1; i < hubs.length; i++) {
      expect(hubs[i - 1].criticality).toBeGreaterThanOrEqual(hubs[i].criticality);
    }
  });
});

describe("Diagnostic 4: Friction distribution", () => {
  it("uniform ΦL → low friction", () => {
    const uniformHealth: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.8 },
      { id: "c", phiL: 0.8 },
    ];
    const dist = computeFrictionDistribution(triangleEdges, uniformHealth);
    expect(dist.globalFriction).toBeCloseTo(0, 4);
    expect(dist.stats.mean).toBeCloseTo(0, 4);
  });

  it("alternating ΦL → high friction", () => {
    const altHealth: NodeHealth[] = [
      { id: "a", phiL: 0.1 },
      { id: "b", phiL: 0.9 },
      { id: "c", phiL: 0.1 },
    ];
    const dist = computeFrictionDistribution(triangleEdges, altHealth);
    expect(dist.globalFriction).toBeGreaterThan(0.5);
    expect(dist.stats.mean).toBeGreaterThan(0.5);
  });

  it("returns hotspots sorted by friction descending", () => {
    const dist = computeFrictionDistribution(triangleEdges, triangleHealth);
    for (let i = 1; i < dist.hotspots.length; i++) {
      expect(dist.hotspots[i - 1].friction).toBeGreaterThanOrEqual(
        dist.hotspots[i].friction,
      );
    }
  });

  it("stats contain mean, median, stddev", () => {
    const dist = computeFrictionDistribution(triangleEdges, triangleHealth);
    expect(typeof dist.stats.mean).toBe("number");
    expect(typeof dist.stats.median).toBe("number");
    expect(typeof dist.stats.stddev).toBe("number");
    expect(dist.stats.stddev).toBeGreaterThanOrEqual(0);
  });

  it("handles empty edges", () => {
    const dist = computeFrictionDistribution([], triangleHealth);
    expect(dist.globalFriction).toBe(0);
    expect(dist.hotspots).toHaveLength(0);
  });
});

describe("Diagnostic 5: Dampening assessment", () => {
  it("low-degree nodes are not flagged", () => {
    // Triangle: all nodes have degree 2
    const assessment = assessDampening(triangleEdges, triangleNodes);
    expect(assessment.riskNodes).toHaveLength(0);
    expect(assessment.adequate).toBe(true);
  });

  it("computes mean γ across all nodes", () => {
    const assessment = assessDampening(triangleEdges, triangleNodes);
    expect(assessment.meanGamma).toBeGreaterThan(0);
    expect(assessment.meanGamma).toBeLessThanOrEqual(0.7);
  });

  it("handles empty graph", () => {
    const assessment = assessDampening([], []);
    expect(assessment.adequate).toBe(true);
    expect(assessment.meanGamma).toBe(0);
    expect(assessment.riskNodes).toHaveLength(0);
  });
});

describe("runStructuralReview (combined)", () => {
  it("runs all 5 diagnostics and returns combined result", () => {
    const result = runStructuralReview(
      triangleEdges,
      triangleHealth,
      ["lambda2_drop_on_formation"],
    );

    expect(result.computedAt).toBeInstanceOf(Date);
    expect(result.triggers).toContain("lambda2_drop_on_formation");
    expect(result.globalLambda2).toBeGreaterThan(0);
    expect(typeof result.spectralGap).toBe("number");
    expect(Array.isArray(result.hubDependencies)).toBe(true);
    expect(result.frictionDistribution).toBeDefined();
    expect(result.dampeningAssessment).toBeDefined();
  });

  it("handles star graph correctly", () => {
    const result = runStructuralReview(
      starEdges,
      starHealth,
      ["cascade_activation"],
    );

    expect(result.globalLambda2).toBeGreaterThan(0);
    // Star has clear hub dependency
    if (result.hubDependencies.length > 0) {
      expect(result.hubDependencies[0].nodeId).toBe("hub");
    }
  });
});
