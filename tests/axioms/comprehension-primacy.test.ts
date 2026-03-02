/**
 * A9. Comprehension Primacy — When a choice exists between efficient-but-opaque
 * and slower-but-readable, the readable path is taken.
 *
 * Tests that every health function returns structured objects, not bare numbers.
 * This is the anti-Dimensional Collapse axiom.
 * Level: L5 Invariant
 */
import { describe, it, expect } from "vitest";
import {
  computePhiL,
  computePsiH,
  computeEpsilonR,
  type PhiLFactors,
  type GraphEdge,
  type NodeHealth,
} from "../../src/index.js";

describe("A9 Comprehension Primacy: ΦL returns structured, decomposed result", () => {
  const factors: PhiLFactors = {
    axiomCompliance: 0.8,
    provenanceClarity: 0.7,
    usageSuccessRate: 0.9,
    temporalStability: 0.6,
  };

  it("result includes named factors, not just a scalar", () => {
    const result = computePhiL(factors, 10, 3);
    // Must have both the scalar AND the decomposition
    expect(typeof result.effective).toBe("number");
    expect(typeof result.factors.axiomCompliance).toBe("number");
    expect(typeof result.factors.provenanceClarity).toBe("number");
    expect(typeof result.factors.usageSuccessRate).toBe("number");
    expect(typeof result.factors.temporalStability).toBe("number");
    // The effective value alone is insufficient — the decomposition is required
    expect(Object.keys(result).length).toBeGreaterThan(3);
  });

  it("result includes trend, raw, maturityFactor — all dimensions preserved", () => {
    const result = computePhiL(factors, 10, 3);
    expect(result).toHaveProperty("trend");
    expect(result).toHaveProperty("raw");
    expect(result).toHaveProperty("maturityFactor");
    expect(result).toHaveProperty("computedAt");
  });
});

describe("A9 Comprehension Primacy: ΨH returns decomposed coherence", () => {
  const edges: GraphEdge[] = [
    { from: "a", to: "b", weight: 1 },
    { from: "b", to: "c", weight: 1 },
  ];
  const nodes: NodeHealth[] = [
    { id: "a", phiL: 0.8 },
    { id: "b", phiL: 0.7 },
    { id: "c", phiL: 0.9 },
  ];

  it("result includes lambda2, friction, combined — not just combined", () => {
    const result = computePsiH(edges, nodes);
    expect(result).toHaveProperty("lambda2");
    expect(result).toHaveProperty("friction");
    expect(result).toHaveProperty("combined");
    expect(result).toHaveProperty("computedAt");
  });
});

describe("A9 Comprehension Primacy: εR returns context-rich exploration data", () => {
  it("result includes value, range, decisions, floor — not just value", () => {
    const result = computeEpsilonR(5, 50, 0.02);
    expect(result).toHaveProperty("value");
    expect(result).toHaveProperty("range");
    expect(result).toHaveProperty("exploratoryDecisions");
    expect(result).toHaveProperty("totalDecisions");
    expect(result).toHaveProperty("floor");
    expect(result).toHaveProperty("computedAt");
  });

  it("range classification preserves dimensional context", () => {
    const rigid = computeEpsilonR(0, 100, 0.0);
    const stable = computeEpsilonR(5, 100, 0.01);
    const adaptive = computeEpsilonR(15, 100, 0.01);
    const unstable = computeEpsilonR(40, 100, 0.01);

    // All four have the range property set to different values
    expect(rigid.range).toBe("rigid");
    expect(stable.range).toBe("stable");
    expect(adaptive.range).toBe("adaptive");
    expect(unstable.range).toBe("unstable");
  });
});

describe("A9 Comprehension Primacy: no health function returns bare number", () => {
  it("computePhiL returns object, not number", () => {
    const result = computePhiL(
      { axiomCompliance: 1, provenanceClarity: 1, usageSuccessRate: 1, temporalStability: 1 },
      10, 3,
    );
    expect(typeof result).toBe("object");
    expect(typeof result).not.toBe("number");
  });

  it("computePsiH returns object, not number", () => {
    const result = computePsiH([], [{ id: "a", phiL: 0.5 }]);
    expect(typeof result).toBe("object");
    expect(typeof result).not.toBe("number");
  });

  it("computeEpsilonR returns object, not number", () => {
    const result = computeEpsilonR(1, 10);
    expect(typeof result).toBe("object");
    expect(typeof result).not.toBe("number");
  });
});
