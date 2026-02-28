/**
 * Codex Signum — Conformance Tests: State Dimensions
 *
 * Verifies ΦL, ΨH, εR computations match spec formulas.
 */
import { describe, expect, it } from "vitest";
import {
  CASCADE_LIMIT,
  HYSTERESIS_RATIO,
  computeDampening,
  computeDegradationImpact,
  computeRecoveryRate,
  propagateDegradation,
  type PropagationNode,
} from "../../src/computation/dampening.js";
import {
  checkEpsilonRWarnings,
  computeEpsilonR,
  computeEpsilonRFloor,
} from "../../src/computation/epsilon-r.js";
import {
  classifyMaturity,
  computeMaturityFactor,
  computeMaturityIndex,
} from "../../src/computation/maturity.js";
import {
  computeAxiomComplianceFactor,
  computePhiL,
  computePhiLWithState,
  computeRawPhiL,
  computeTemporalStability,
  computeTemporalStabilityFromState,
  computeUsageSuccessRate,
} from "../../src/computation/phi-l.js";
import {
  computePsiH,
  computePsiHWithState,
  decomposePsiH,
  type GraphEdge,
  type NodeHealth,
} from "../../src/computation/psi-h.js";
import type { PhiLFactors } from "../../src/types/state-dimensions.js";
import {
  DEFAULT_PHI_L_WEIGHTS,
  EPSILON_R_THRESHOLDS,
  classifyEpsilonR,
  createPhiLState,
  createPsiHState,
} from "../../src/types/state-dimensions.js";

describe("ΦL (Pattern Health)", () => {
  const healthyFactors: PhiLFactors = {
    axiomCompliance: 0.9,
    provenanceClarity: 0.8,
    usageSuccessRate: 0.85,
    temporalStability: 0.95,
  };

  it("computes raw ΦL as weighted composite", () => {
    const raw = computeRawPhiL(healthyFactors, DEFAULT_PHI_L_WEIGHTS);
    // 0.4(0.9) + 0.2(0.8) + 0.2(0.85) + 0.2(0.95) = 0.36 + 0.16 + 0.17 + 0.19 = 0.88
    expect(raw).toBeCloseTo(0.88, 2);
  });

  it("applies maturity modifier", () => {
    const phiL = computePhiL(healthyFactors, 100, 5);
    expect(phiL.effective).toBeLessThan(phiL.raw);
    expect(phiL.effective).toBeGreaterThan(0);
    expect(phiL.maturityFactor).toBeGreaterThan(0.85);
  });

  it("weights always sum to 1.0", () => {
    const w = DEFAULT_PHI_L_WEIGHTS;
    const sum =
      w.axiomCompliance +
      w.provenanceClarity +
      w.usageSuccessRate +
      w.temporalStability;
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it("throws for out-of-range factors", () => {
    expect(() =>
      computePhiL(
        {
          axiomCompliance: 1.5,
          provenanceClarity: 0.5,
          usageSuccessRate: 0.5,
          temporalStability: 0.5,
        },
        100,
        5,
      ),
    ).toThrow("must be a number in [0, 1]");
  });

  it("computes trend from history", () => {
    const phiL = computePhiL(healthyFactors, 100, 5);
    expect(phiL.trend).toBe("stable");
  });

  it("detects improving trend when previous was lower", () => {
    const phiL = computePhiL(healthyFactors, 100, 5, 0.3);
    expect(phiL.trend).toBe("improving");
  });

  it("computes axiom compliance factor", () => {
    expect(
      computeAxiomComplianceFactor({ a: true, b: true, c: false }),
    ).toBeCloseTo(0.667, 2);
  });

  it("computes usage success rate", () => {
    expect(computeUsageSuccessRate(8, 10)).toBeCloseTo(0.8, 4);
    expect(computeUsageSuccessRate(0, 0)).toBe(0);
  });

  it("computes temporal stability", () => {
    expect(computeTemporalStability([0.8, 0.8, 0.8, 0.8])).toBeGreaterThan(0.9);
    expect(computeTemporalStability([0.8, 0.9])).toBe(0.5);
  });
});

describe("ΦL Stateful Computation (Ring Buffer)", () => {
  it("createPhiLState returns empty buffer with default maxSize", () => {
    const state = createPhiLState();
    expect(state.ringBuffer).toEqual([]);
    expect(state.maxSize).toBe(20);
  });

  it("createPhiLState accepts custom maxSize", () => {
    const state = createPhiLState(10);
    expect(state.maxSize).toBe(10);
  });

  it("returns 0.5 stability with fewer than 2 observations", () => {
    const state = createPhiLState();
    const { stability, updatedState } = computeTemporalStabilityFromState(state, 0.8);
    expect(stability).toBe(0.5);
    expect(updatedState.ringBuffer).toEqual([0.8]);
  });

  it("returns high stability for constant values", () => {
    let state = createPhiLState();
    // Push 5 identical values
    for (let i = 0; i < 5; i++) {
      const result = computeTemporalStabilityFromState(state, 0.8);
      state = result.updatedState;
    }
    const { stability } = computeTemporalStabilityFromState(state, 0.8);
    expect(stability).toBeGreaterThan(0.99);
  });

  it("returns low stability for high-variance values", () => {
    let state = createPhiLState();
    // Alternate between extremes
    const values = [0.1, 0.9, 0.1, 0.9, 0.1, 0.9];
    for (const v of values) {
      const result = computeTemporalStabilityFromState(state, v);
      state = result.updatedState;
    }
    const { stability } = computeTemporalStabilityFromState(state, 0.1);
    expect(stability).toBeLessThan(0.1);
  });

  it("respects maxSize — ring buffer does not grow beyond limit", () => {
    let state = createPhiLState(5);
    for (let i = 0; i < 10; i++) {
      const result = computeTemporalStabilityFromState(state, 0.5 + i * 0.01);
      state = result.updatedState;
    }
    expect(state.ringBuffer.length).toBe(5);
  });

  it("does not mutate input state (immutable update)", () => {
    const state = createPhiLState();
    const original = { ...state, ringBuffer: [...state.ringBuffer] };
    computeTemporalStabilityFromState(state, 0.8);
    expect(state.ringBuffer).toEqual(original.ringBuffer);
  });

  it("computePhiLWithState integrates stability from state", () => {
    let state = createPhiLState();
    // Build up a buffer with stable values
    for (let i = 0; i < 5; i++) {
      const result = computePhiLWithState(
        { axiomCompliance: 0.9, provenanceClarity: 0.8, usageSuccessRate: 0.85 },
        100, 5, state, 0.8,
      );
      state = result.updatedState;
    }
    const { phiL, updatedState } = computePhiLWithState(
      { axiomCompliance: 0.9, provenanceClarity: 0.8, usageSuccessRate: 0.85 },
      100, 5, state, 0.8,
    );
    expect(phiL.factors.temporalStability).toBeGreaterThan(0.9);
    expect(phiL.effective).toBeGreaterThan(0);
    expect(updatedState.ringBuffer.length).toBeGreaterThan(0);
  });

  it("computePhiLWithState does not break existing computePhiL", () => {
    // Existing function still works identically
    const phiL = computePhiL(
      { axiomCompliance: 0.9, provenanceClarity: 0.8, usageSuccessRate: 0.85, temporalStability: 0.95 },
      100, 5,
    );
    expect(phiL.effective).toBeGreaterThan(0);
    expect(phiL.trend).toBe("stable");
  });
});

describe("ΨH Temporal Decomposition (Stateless)", () => {
  it("createPsiHState returns default values", () => {
    const state = createPsiHState();
    expect(state.ringBuffer).toEqual([]);
    expect(state.maxSize).toBe(20);
    expect(state.alpha).toBe(0.15);
    expect(state.trend).toBeUndefined();
    expect(state.baseline).toBeUndefined();
  });

  it("first decomposition sets trend to instant value", () => {
    const state = createPsiHState();
    const { decomposition, updatedState } = decomposePsiH(state, 0.7);
    expect(decomposition.psiH_instant).toBe(0.7);
    expect(decomposition.psiH_trend).toBe(0.7);
    expect(decomposition.friction_transient).toBe(0);
    expect(decomposition.friction_durable).toBe(0);
    expect(updatedState.trend).toBe(0.7);
    expect(updatedState.baseline).toBeUndefined(); // <5 observations
  });

  it("EWMA trend converges toward repeated values", () => {
    let state = createPsiHState();
    // Push 10 values at 0.8
    for (let i = 0; i < 10; i++) {
      const result = decomposePsiH(state, 0.8);
      state = result.updatedState;
    }
    expect(state.trend).toBeCloseTo(0.8, 2);
  });

  it("baseline is established after 5 observations", () => {
    let state = createPsiHState();
    for (let i = 0; i < 4; i++) {
      const result = decomposePsiH(state, 0.7);
      state = result.updatedState;
    }
    expect(state.baseline).toBeUndefined();

    const { updatedState } = decomposePsiH(state, 0.7);
    expect(updatedState.baseline).toBeDefined();
    expect(updatedState.baseline).toBeCloseTo(0.7, 2);
  });

  it("friction_transient reflects sudden change", () => {
    let state = createPsiHState();
    // Establish stable trend
    for (let i = 0; i < 10; i++) {
      const result = decomposePsiH(state, 0.8);
      state = result.updatedState;
    }
    // Sudden spike
    const { decomposition } = decomposePsiH(state, 0.3);
    expect(decomposition.friction_transient).toBeGreaterThan(0.3);
  });

  it("friction_durable reflects trend drift from baseline", () => {
    let state = createPsiHState();
    // Establish baseline at ~0.8
    for (let i = 0; i < 10; i++) {
      const result = decomposePsiH(state, 0.8);
      state = result.updatedState;
    }
    // Now shift to 0.4 for many cycles
    for (let i = 0; i < 20; i++) {
      const result = decomposePsiH(state, 0.4);
      state = result.updatedState;
    }
    const { decomposition } = decomposePsiH(state, 0.4);
    expect(decomposition.friction_durable).toBeGreaterThan(0.2);
  });

  it("ring buffer respects maxSize", () => {
    let state = createPsiHState(5);
    for (let i = 0; i < 10; i++) {
      const result = decomposePsiH(state, 0.5 + i * 0.01);
      state = result.updatedState;
    }
    expect(state.ringBuffer.length).toBe(5);
  });

  it("does not mutate input state (immutable update)", () => {
    const state = createPsiHState();
    const originalRingBuffer = [...state.ringBuffer];
    decomposePsiH(state, 0.7);
    expect(state.ringBuffer).toEqual(originalRingBuffer);
    expect(state.trend).toBeUndefined();
  });

  it("computePsiHWithState integrates decomposition", () => {
    const edges: GraphEdge[] = [
      { from: "a", to: "b", weight: 1 },
      { from: "b", to: "c", weight: 1 },
    ];
    const nodeHealths: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.85 },
      { id: "c", phiL: 0.9 },
    ];
    let state = createPsiHState();

    const { psiH, decomposition, updatedState } = computePsiHWithState(edges, nodeHealths, state);
    expect(psiH.combined).toBeGreaterThan(0);
    expect(decomposition.psiH_instant).toBe(psiH.combined);
    expect(updatedState.ringBuffer.length).toBe(1);
  });
});

describe("Maturity Factor", () => {
  it("returns 0 when either observations or connections is 0", () => {
    expect(computeMaturityFactor(0, 5)).toBe(0);
    expect(computeMaturityFactor(100, 0)).toBe(0);
    expect(computeMaturityFactor(0, 0)).toBe(0);
  });

  it("approaches 1.0 with high observations AND connections", () => {
    expect(computeMaturityFactor(100, 5)).toBeGreaterThan(0.85);
    expect(computeMaturityFactor(500, 10)).toBeGreaterThan(0.99);
  });

  it("follows two-component formula", () => {
    const m = computeMaturityFactor(50, 3);
    const expected = (1 - Math.exp(-0.05 * 50)) * (1 - Math.exp(-0.5 * 3));
    expect(m).toBeCloseTo(expected, 4);
  });

  it("classifyMaturity returns correct stages (spec: 0.3/0.7 boundaries)", () => {
    expect(classifyMaturity(0.2)).toBe("young");
    expect(classifyMaturity(0.29)).toBe("young");
    expect(classifyMaturity(0.3)).toBe("maturing");
    expect(classifyMaturity(0.5)).toBe("maturing");
    expect(classifyMaturity(0.69)).toBe("maturing");
    expect(classifyMaturity(0.7)).toBe("mature");
    expect(classifyMaturity(0.9)).toBe("mature");
  });

  it("computeMaturityIndex accepts pattern array", () => {
    const patterns = [
      { observationCount: 50, connectionCount: 3, ageMs: 86400000, phiL: 0.8 },
      { observationCount: 30, connectionCount: 2, ageMs: 43200000, phiL: 0.7 },
    ];
    const mi = computeMaturityIndex(patterns);
    expect(mi.value).toBeGreaterThan(0);
    expect(mi.value).toBeLessThanOrEqual(1);
    expect(["young", "maturing", "mature"]).toContain(mi.classification);
    expect(mi.thresholds).toBeDefined();
    expect(mi.thresholds.phiLHealthy).toBeGreaterThan(0);
  });
});

describe("ΨH (Harmonic Signature)", () => {
  it("returns healthy values for well-connected topology", () => {
    const edges: GraphEdge[] = [
      { from: "a", to: "b", weight: 1 },
      { from: "b", to: "c", weight: 1 },
      { from: "a", to: "c", weight: 1 },
    ];
    const nodeHealths: NodeHealth[] = [
      { id: "a", phiL: 0.8 },
      { id: "b", phiL: 0.9 },
      { id: "c", phiL: 0.85 },
    ];

    const psiH = computePsiH(edges, nodeHealths);
    expect(psiH.combined).toBeGreaterThanOrEqual(0);
    expect(psiH.combined).toBeLessThanOrEqual(1);
    expect(psiH.lambda2).toBeGreaterThan(0);
  });

  it("handles disconnected graph (λ₂ ≈ 0)", () => {
    const edges: GraphEdge[] = [];
    const nodeHealths: NodeHealth[] = [
      { id: "a", phiL: 0.5 },
      { id: "b", phiL: 0.5 },
    ];

    const psiH = computePsiH(edges, nodeHealths);
    expect(psiH.lambda2).toBeCloseTo(0, 4);
  });

  it("has friction in [0, 1]", () => {
    const edges: GraphEdge[] = [{ from: "a", to: "b", weight: 1 }];
    const nodeHealths: NodeHealth[] = [
      { id: "a", phiL: 0.3 },
      { id: "b", phiL: 0.9 },
    ];

    const psiH = computePsiH(edges, nodeHealths);
    expect(psiH.friction).toBeGreaterThanOrEqual(0);
    expect(psiH.friction).toBeLessThanOrEqual(1);
  });

  it("returns zero combined for empty graph", () => {
    const psiH = computePsiH([], []);
    expect(psiH.combined).toBe(0);
    expect(psiH.friction).toBe(1);
  });
});

describe("εR (Exploration Rate)", () => {
  it("returns adaptive default when no decisions have been made", () => {
    const epsilonR = computeEpsilonR(0, 0);
    expect(epsilonR.value).toBe(0.15);
    expect(epsilonR.totalDecisions).toBe(0);
  });

  it("computes correct ratio", () => {
    const epsilonR = computeEpsilonR(3, 10);
    expect(epsilonR.value).toBeCloseTo(0.3, 4);
    expect(epsilonR.exploratoryDecisions).toBe(3);
    expect(epsilonR.totalDecisions).toBe(10);
  });

  it("enforces floor", () => {
    const epsilonR = computeEpsilonR(0, 100, 0.01);
    expect(epsilonR.value).toBe(0.01);
  });

  it("classifies ranges correctly", () => {
    expect(classifyEpsilonR(0.0)).toBe("rigid");
    expect(classifyEpsilonR(0.05)).toBe("stable");
    expect(classifyEpsilonR(0.15)).toBe("adaptive");
    expect(classifyEpsilonR(0.5)).toBe("unstable");
  });

  it("thresholds are properly ordered", () => {
    expect(EPSILON_R_THRESHOLDS.rigid).toBeLessThan(
      EPSILON_R_THRESHOLDS.stableMin,
    );
    expect(EPSILON_R_THRESHOLDS.stableMax).toBeLessThanOrEqual(
      EPSILON_R_THRESHOLDS.adaptiveMax,
    );
    expect(EPSILON_R_THRESHOLDS.adaptiveMax).toBeLessThanOrEqual(
      EPSILON_R_THRESHOLDS.unstable,
    );
  });

  it("computeEpsilonRFloor returns positive value", () => {
    const floor = computeEpsilonRFloor(0.01, 1.0);
    expect(floor).toBeGreaterThanOrEqual(0.01);
    const higherFloor = computeEpsilonRFloor(0.01, 2.0);
    expect(higherFloor).toBeGreaterThanOrEqual(floor);
  });

  it("checkEpsilonRWarnings detects over-optimization", () => {
    const epsilonR = computeEpsilonR(0, 100, 0.005);
    const warnings = checkEpsilonRWarnings(epsilonR, 0.95, true);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.message.includes("ΦL"))).toBe(true);
  });

  it("checkEpsilonRWarnings detects zero εR on active pattern", () => {
    const epsilonR = {
      value: 0,
      range: "rigid" as const,
      exploratoryDecisions: 0,
      totalDecisions: 0,
      floor: 0,
      computedAt: new Date(),
    };
    const warnings = checkEpsilonRWarnings(epsilonR, 0.5, true);
    expect(warnings.some((w) => w.level === "critical")).toBe(true);
  });
});

describe("Topology-Aware Dampening", () => {
  it("computes γ_effective = min(0.7, 0.8/k) [budget-capped]", () => {
    expect(computeDampening(1)).toBeCloseTo(0.7, 4);
    expect(computeDampening(2)).toBeCloseTo(0.4, 4);
    expect(computeDampening(3)).toBeCloseTo(0.8 / 3, 4);
    expect(computeDampening(5)).toBeCloseTo(0.16, 4);
  });

  it("respects cascade limit constant", () => {
    expect(CASCADE_LIMIT).toBe(2);
    expect(computeDegradationImpact(2, 0.5, 3)).toBe(0);
    expect(computeDegradationImpact(2, 0.5, 2)).toBeGreaterThan(0);
  });

  it("recovery is 2.5× slower than degradation", () => {
    expect(HYSTERESIS_RATIO).toBe(2.5);
    expect(computeRecoveryRate(0.5)).toBeCloseTo(0.5 / 2.5, 4);
  });

  it("propagates through graph with proper dampening", () => {
    const nodes = new Map<string, PropagationNode>([
      ["A", { id: "A", phiL: 0.8, degree: 1, neighbors: ["B"] }],
      ["B", { id: "B", phiL: 0.8, degree: 2, neighbors: ["A", "C"] }],
      ["C", { id: "C", phiL: 0.8, degree: 2, neighbors: ["B", "D"] }],
      ["D", { id: "D", phiL: 0.8, degree: 1, neighbors: ["C"] }],
    ]);

    const result = propagateDegradation("A", 0.5, nodes);

    expect(result.updatedPhiL.get("A")).toBeCloseTo(0.3, 4);
    expect(result.updatedPhiL.has("B")).toBe(true);
    expect(result.updatedPhiL.get("B")!).toBeLessThan(0.8);
    expect(result.updatedPhiL.has("C")).toBe(true);
    expect(result.updatedPhiL.has("D")).toBe(false); // cascade stopped at level 2
    // cascadeLimitReached is false because guard prevents enqueuing past limit
    expect(result.maxCascadeDepth).toBeLessThanOrEqual(CASCADE_LIMIT);
  });
});
