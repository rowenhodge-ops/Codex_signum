/**
 * A2. Transparency — Every computed signal has a human-readable explanation path.
 *
 * Tests that Codex never produces a result without exposing the reasoning behind it.
 * Level: L5 Invariant + L2 Contract
 */
import { describe, it, expect } from "vitest";
import {
  computePhiL,
  computePsiH,
  computeEpsilonR,
  DEFAULT_PHI_L_WEIGHTS,
  type PhiLFactors,
  type GraphEdge,
  type NodeHealth,
  route,
  buildContextClusterId,
  type RoutableModel,
  DEFAULT_ROUTER_CONFIG,
  freshArmStats,
} from "../../src/index.js";

describe("A2 Transparency: ΦL explanation path", () => {
  const factors: PhiLFactors = {
    axiomCompliance: 0.9,
    provenanceClarity: 0.8,
    usageSuccessRate: 0.7,
    temporalStability: 0.6,
  };

  it("computePhiL exposes all four named factors individually", () => {
    const result = computePhiL(factors, 10, 3);
    expect(result.factors).toEqual(factors);
    expect(result.factors.axiomCompliance).toBe(0.9);
    expect(result.factors.provenanceClarity).toBe(0.8);
    expect(result.factors.usageSuccessRate).toBe(0.7);
    expect(result.factors.temporalStability).toBe(0.6);
  });

  it("computePhiL exposes weights so the weighting is inspectable", () => {
    const result = computePhiL(factors, 10, 3);
    expect(result.weights).toBeDefined();
    expect(result.weights.axiomCompliance).toBe(0.4);
    expect(result.weights.provenanceClarity).toBe(0.2);
    expect(result.weights.usageSuccessRate).toBe(0.2);
    expect(result.weights.temporalStability).toBe(0.2);
  });

  it("computePhiL exposes raw (pre-maturity), maturityFactor, and effective separately", () => {
    const result = computePhiL(factors, 10, 3);
    expect(typeof result.raw).toBe("number");
    expect(typeof result.maturityFactor).toBe("number");
    expect(typeof result.effective).toBe("number");
    // effective = raw * maturityFactor (verifiable)
    expect(result.effective).toBeCloseTo(result.raw * result.maturityFactor, 10);
  });

  it("computePhiL exposes trend direction", () => {
    const result = computePhiL(factors, 10, 3, 0.5);
    expect(["improving", "stable", "declining"]).toContain(result.trend);
  });
});

describe("A2 Transparency: ΨH explanation path", () => {
  const edges: GraphEdge[] = [
    { from: "a", to: "b", weight: 1 },
    { from: "b", to: "c", weight: 1 },
  ];
  const nodes: NodeHealth[] = [
    { id: "a", phiL: 0.8 },
    { id: "b", phiL: 0.7 },
    { id: "c", phiL: 0.9 },
  ];

  it("computePsiH exposes lambda2, friction, and combined separately", () => {
    const result = computePsiH(edges, nodes);
    expect(typeof result.lambda2).toBe("number");
    expect(typeof result.friction).toBe("number");
    expect(typeof result.combined).toBe("number");
  });

  it("combined is derivable from lambda2 and friction (verifiable formula)", () => {
    const result = computePsiH(edges, nodes);
    const n = nodes.length;
    const lambda2Normalized = Math.min(1, result.lambda2 / Math.max(n, 2));
    const expected = 0.4 * lambda2Normalized + 0.6 * (1 - result.friction);
    expect(result.combined).toBeCloseTo(expected, 10);
  });
});

describe("A2 Transparency: εR explanation path", () => {
  it("computeEpsilonR exposes value, range, exploratory/total decisions, and floor", () => {
    const result = computeEpsilonR(5, 50, 0.02);
    expect(typeof result.value).toBe("number");
    expect(typeof result.range).toBe("string");
    expect(result.exploratoryDecisions).toBe(5);
    expect(result.totalDecisions).toBe(50);
    expect(result.floor).toBe(0.02);
  });
});

describe("A2 Transparency: Thompson routing reasoning", () => {
  const models: RoutableModel[] = [
    { id: "m1", name: "Model 1", provider: "test", avgLatencyMs: 100, costPer1kTokens: 0.01, capabilities: ["analysis"], status: "active" },
    { id: "m2", name: "Model 2", provider: "test", avgLatencyMs: 200, costPer1kTokens: 0.02, capabilities: ["analysis"], status: "active" },
  ];

  it("route() result includes non-empty reasoning string", () => {
    const ctx = { taskType: "analysis", complexity: "moderate" as const, qualityRequirement: 0.7 };
    const decision = route(ctx, models, [], 0, DEFAULT_ROUTER_CONFIG);
    expect(typeof decision.reasoning).toBe("string");
    expect(decision.reasoning.length).toBeGreaterThan(0);
  });

  it("route() result includes confidence and sampled values for all models", () => {
    const ctx = { taskType: "analysis", complexity: "moderate" as const, qualityRequirement: 0.7 };
    const decision = route(ctx, models, [], 0, DEFAULT_ROUTER_CONFIG);
    expect(typeof decision.confidence).toBe("number");
    expect(decision.sampledValues.size).toBe(models.length);
  });
});
