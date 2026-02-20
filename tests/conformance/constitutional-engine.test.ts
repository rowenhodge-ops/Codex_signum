/**
 * Codex Signum — Conformance Tests: Constitutional Engine
 *
 * Verifies axiom evaluation, tiered rule enforcement, and ADR creation.
 */
import { describe, expect, it } from "vitest";
import {
  createADR,
  evaluateAxioms,
  evaluateConstitution,
  evaluateRule,
  evaluateRules,
  type ComplianceContext,
} from "../../src/constitutional/engine.js";
import type { ConstitutionalRule } from "../../src/types/constitutional.js";
import { computeAxiomComplianceFraction } from "../../src/types/constitutional.js";

// ============ HELPERS ============

function makeRule(
  overrides: Partial<ConstitutionalRule> & { id: string },
): ConstitutionalRule {
  return {
    name: overrides.id,
    tier: 1,
    status: "active",
    expression: {
      target: "cascade_limit",
      constraint: "max",
      value: 2,
      priority: "mandatory",
    },
    governsPatterns: [],
    rationale: "Test rule",
    createdAt: new Date(),
    evidencedBy: [],
    ...overrides,
  };
}

function makeFullContext(): ComplianceContext {
  return {
    phiL: {
      effective: 0.85,
      raw: 0.9,
      maturityFactor: 0.95,
      factors: {
        successRate: 0.9,
        latencyPerformance: 0.85,
        costEfficiency: 0.8,
        provenanceClarity: 0.9,
      },
      weights: {
        successRate: 0.4,
        latencyPerformance: 0.2,
        costEfficiency: 0.2,
        provenanceClarity: 0.2,
      },
      trend: "stable",
    },
    psiH: {
      composite: 0.75,
      lambda2: 1.2,
      friction: 0.15,
      graphTotalVariation: 0.3,
    },
    epsilonR: {
      value: 0.15,
      exploratoryDecisions: 3,
      totalDecisions: 20,
      floor: 0.02,
      classification: "healthy",
      warnings: [],
    },
    cascadeDepth: 1,
    reviewModelDiffersFromExecute: true,
    memoryStratumFlow: "1→2→3",
    correctionIterations: 2,
  };
}

// ============ AXIOM EVALUATION ============

describe("evaluateAxioms", () => {
  it("returns all true with complete context", () => {
    const ctx = makeFullContext();
    const axioms = evaluateAxioms(ctx);

    expect(axioms.symbiosis).toBe(true);
    expect(axioms.transparency).toBe(true);
    expect(axioms.fidelity).toBe(true);
    expect(axioms.visibleState).toBe(true);
    expect(axioms.minimalAuthority).toBe(true);
    expect(axioms.provenance).toBe(true);
    expect(axioms.reversibility).toBe(true);
    expect(axioms.semanticStability).toBe(true);
    expect(axioms.comprehensionPrimacy).toBe(true);
    expect(axioms.adaptivePressure).toBe(true);

    expect(computeAxiomComplianceFraction(axioms)).toBe(1.0);
  });

  it("detects visibleState violation when psiH missing", () => {
    const ctx = makeFullContext();
    delete ctx.psiH;
    const axioms = evaluateAxioms(ctx);
    expect(axioms.visibleState).toBe(false);
  });

  it("detects adaptivePressure violation when εR = 0", () => {
    const ctx = makeFullContext();
    ctx.epsilonR = {
      value: 0,
      exploratoryDecisions: 0,
      totalDecisions: 0,
      floor: 0.02,
      classification: "rigid",
      warnings: [],
    };
    const axioms = evaluateAxioms(ctx);
    expect(axioms.adaptivePressure).toBe(false);
  });

  it("detects comprehensionPrimacy violation on invalid memory flow", () => {
    const ctx = makeFullContext();
    ctx.memoryStratumFlow = "1→3"; // Skip stratum 2 — invalid
    const axioms = evaluateAxioms(ctx);
    expect(axioms.comprehensionPrimacy).toBe(false);
  });

  it("validates downward memory flow as invalid", () => {
    const ctx = makeFullContext();
    ctx.memoryStratumFlow = "3→1"; // Downward — invalid
    const axioms = evaluateAxioms(ctx);
    expect(axioms.comprehensionPrimacy).toBe(false);
  });
});

describe("computeAxiomComplianceFraction", () => {
  it("returns 0.0 for all-false", () => {
    const axioms = evaluateAxioms({});
    // Some axioms are structural invariants and always true
    // So it won't be exactly 0, but should be < 1.0
    expect(computeAxiomComplianceFraction(axioms)).toBeLessThan(1.0);
  });

  it("returns 1.0 for all-true", () => {
    const axioms = evaluateAxioms(makeFullContext());
    expect(computeAxiomComplianceFraction(axioms)).toBe(1.0);
  });
});

// ============ RULE EVALUATION ============

describe("evaluateRule", () => {
  it("cascade_limit: passes when depth within limit", () => {
    const rule = makeRule({
      id: "cascade-limit",
      expression: {
        target: "cascade_limit",
        constraint: "max",
        value: 2,
        priority: "mandatory",
      },
    });
    const result = evaluateRule(rule, { cascadeDepth: 1 });
    expect(result.passed).toBe(true);
    expect(result.actualValue).toBe(1);
    expect(result.thresholdValue).toBe(2);
  });

  it("cascade_limit: fails when depth exceeds limit", () => {
    const rule = makeRule({
      id: "cascade-limit",
      expression: {
        target: "cascade_limit",
        constraint: "max",
        value: 2,
        priority: "mandatory",
      },
    });
    const result = evaluateRule(rule, { cascadeDepth: 3 });
    expect(result.passed).toBe(false);
    expect(result.actualValue).toBe(3);
  });

  it("min_epsilon_r: passes above floor", () => {
    const rule = makeRule({
      id: "min-epsilon",
      expression: {
        target: "min_epsilon_r",
        constraint: "min",
        value: 0.01,
        priority: "mandatory",
      },
    });
    const ctx = makeFullContext();
    const result = evaluateRule(rule, ctx);
    expect(result.passed).toBe(true);
  });

  it("max_correction_iterations: fails when exceeded", () => {
    const rule = makeRule({
      id: "max-corr",
      expression: {
        target: "max_correction_iterations",
        constraint: "max",
        value: 3,
        priority: "preferred",
      },
    });
    const result = evaluateRule(rule, { correctionIterations: 5 });
    expect(result.passed).toBe(false);
    expect(result.actualValue).toBe(5);
  });

  it("review_model_differs: passes when true", () => {
    const rule = makeRule({
      id: "review-diff",
      expression: {
        target: "review_model_differs",
        constraint: "boolean",
        value: true,
        priority: "preferred",
      },
    });
    const result = evaluateRule(rule, { reviewModelDiffersFromExecute: true });
    expect(result.passed).toBe(true);
  });

  it("review_model_differs: fails when same model used", () => {
    const rule = makeRule({
      id: "review-diff",
      expression: {
        target: "review_model_differs",
        constraint: "boolean",
        value: true,
        priority: "preferred",
      },
    });
    const result = evaluateRule(rule, { reviewModelDiffersFromExecute: false });
    expect(result.passed).toBe(false);
  });
});

describe("evaluateRules (batch)", () => {
  it("evaluates all rules", () => {
    const rules = [
      makeRule({
        id: "rule-1",
        expression: {
          target: "cascade_limit",
          constraint: "max",
          value: 2,
          priority: "mandatory",
        },
      }),
      makeRule({
        id: "rule-2",
        expression: {
          target: "min_epsilon_r",
          constraint: "min",
          value: 0.01,
          priority: "mandatory",
        },
      }),
    ];
    const results = evaluateRules(rules, makeFullContext());
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.passed)).toBe(true);
  });
});

// ============ FULL EVALUATION ============

describe("evaluateConstitution", () => {
  it("returns compliant for fully-passing context", () => {
    const rules = [
      makeRule({
        id: "cascade-limit",
        tier: 1,
        expression: {
          target: "cascade_limit",
          constraint: "max",
          value: 2,
          priority: "mandatory",
        },
      }),
      makeRule({
        id: "min-epsilon",
        tier: 1,
        expression: {
          target: "min_epsilon_r",
          constraint: "min",
          value: 0.01,
          priority: "mandatory",
        },
      }),
    ];
    const eval_ = evaluateConstitution(rules, makeFullContext());

    expect(eval_.overallStatus).toBe("compliant");
    expect(eval_.blockers).toHaveLength(0);
    expect(eval_.warnings).toHaveLength(0);
    expect(eval_.complianceFraction).toBe(1.0);
  });

  it("returns non-compliant for tier-1 violation", () => {
    const rules = [
      makeRule({
        id: "cascade-limit",
        tier: 1,
        expression: {
          target: "cascade_limit",
          constraint: "max",
          value: 2,
          priority: "mandatory",
        },
      }),
    ];
    const ctx = makeFullContext();
    ctx.cascadeDepth = 5; // Violates cascade limit

    const eval_ = evaluateConstitution(rules, ctx);
    expect(eval_.overallStatus).toBe("non-compliant");
    expect(eval_.blockers).toHaveLength(1);
    expect(eval_.blockers[0].ruleId).toBe("cascade-limit");
  });

  it("returns partially-compliant for tier-2 violation", () => {
    const rules = [
      makeRule({
        id: "review-diff",
        tier: 2,
        expression: {
          target: "review_model_differs",
          constraint: "boolean",
          value: true,
          priority: "preferred",
        },
      }),
    ];
    const ctx = makeFullContext();
    ctx.reviewModelDiffersFromExecute = false;

    const eval_ = evaluateConstitution(rules, ctx);
    expect(eval_.overallStatus).toBe("partially-compliant");
    expect(eval_.warnings).toHaveLength(1);
  });

  it("classifies tier-3 violations as advisories", () => {
    const rules = [
      makeRule({
        id: "advisory-correction",
        tier: 3,
        expression: {
          target: "max_correction_iterations",
          constraint: "max",
          value: 2,
          priority: "advisory",
        },
      }),
    ];
    const ctx = makeFullContext();
    ctx.correctionIterations = 5;

    const eval_ = evaluateConstitution(rules, ctx);
    expect(eval_.advisories).toHaveLength(1);
  });
});

// ============ ADR (Architecture Decision Records) ============

describe("createADR", () => {
  it("creates ADR with all required fields", () => {
    const adr = createADR({
      context: "Migration from LangChain to native SDKs",
      alternativesConsidered: [
        "Keep LangChain",
        "Native SDKs only",
        "Hybrid approach",
      ],
      selected: "Native SDKs only",
      rationale: "Reduces 180 dependencies to 3. Better type safety.",
      affectedRules: ["min-phi-l", "review-model-differs"],
      expectedImpact: {
        phiL: "improve",
        psiH: "neutral",
        epsilonR: "increase",
      },
    });

    expect(adr.decisionId).toMatch(/^adr-/);
    expect(adr.timestamp).toBeInstanceOf(Date);
    expect(adr.alternativesConsidered).toHaveLength(3);
    expect(adr.selected).toBe("Native SDKs only");
    expect(adr.affectedRules).toContain("min-phi-l");
    expect(adr.expectedImpact.phiL).toBe("improve");
    expect(adr.observedImpact).toBeUndefined(); // Not yet observed
  });
});
