// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Type Structure
 *
 * Verifies that type shapes conform to the Codex Signum v3.0 spec.
 * These are structural/compile-time tests that verify the type system
 * enforces spec invariants at the TypeScript level.
 */
import { describe, expect, it } from "vitest";
import type {
  ArchitectureDecisionRecord,
  AxiomCompliance,
  ConstitutionalRule,
  RuleEvaluation,
} from "../../src/types/constitutional.js";
import { computeAxiomComplianceFraction } from "../../src/types/constitutional.js";
import type {
  Decision,
  DecisionContext,
  DecisionOutcome,
  Distillation,
  EphemeralMemory,
  InstitutionalKnowledge,
  Observation,
} from "../../src/types/memory.js";
import type {
  IntegrationState,
  MorphemeKind,
} from "../../src/types/morphemes.js";
import type { EpsilonR, PhiL, PsiH } from "../../src/types/state-dimensions.js";
import {
  DEFAULT_PHI_L_WEIGHTS,
  EPSILON_R_THRESHOLDS,
  classifyEpsilonR,
} from "../../src/types/state-dimensions.js";

// ============ MORPHEMES ============

describe("Morpheme Kinds (6 types)", () => {
  it("has exactly 6 morpheme kinds", () => {
    // TypeScript union is compile-time, but we verify the constant array
    const kinds: MorphemeKind[] = [
      "Seed",
      "Line",
      "Bloom",
      "Resonator",
      "Grid",
      "Helix",
    ];
    expect(kinds).toHaveLength(6);
  });

  it("has integration states covering full lifecycle", () => {
    const states: IntegrationState[] = [
      "dormant",
      "integrating",
      "active",
      "degraded",
      "archived",
    ];
    expect(states).toHaveLength(5);
  });
});

// ============ STATE DIMENSIONS ============

describe("ΦL Type Structure", () => {
  it("requires all mandated fields", () => {
    const phiL: PhiL = {
      effective: 0.85,
      raw: 0.9,
      maturityFactor: 0.94,
      factors: {
        axiomCompliance: 0.9,
        provenanceClarity: 0.9,
        usageSuccessRate: 0.85,
        temporalStability: 0.8,
      },
      weights: DEFAULT_PHI_L_WEIGHTS,
      trend: "stable",
      observationCount: 50,
      connectionCount: 5,
      computedAt: new Date(),
    };
    expect(phiL.effective).toBeLessThanOrEqual(phiL.raw);
  });

  it("weights sum to 1.0", () => {
    const w = DEFAULT_PHI_L_WEIGHTS;
    const sum =
      w.axiomCompliance +
      w.provenanceClarity +
      w.usageSuccessRate +
      w.temporalStability;
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe("ΨH Type Structure", () => {
  it("requires combined, lambda2, friction, computedAt", () => {
    const psiH: PsiH = {
      combined: 0.75,
      lambda2: 1.2,
      friction: 0.15,
      computedAt: new Date(),
    };
    expect(psiH.combined).toBeGreaterThanOrEqual(0);
    expect(psiH.lambda2).toBeGreaterThanOrEqual(0);
    expect(psiH.friction).toBeGreaterThanOrEqual(0);
  });
});

describe("εR Type Structure", () => {
  it("requires value, decisions, floor, range, computedAt", () => {
    const epsilonR: EpsilonR = {
      value: 0.15,
      exploratoryDecisions: 3,
      totalDecisions: 20,
      floor: 0.02,
      range: "adaptive",
      computedAt: new Date(),
    };
    expect(epsilonR.value).toBe(
      epsilonR.exploratoryDecisions / epsilonR.totalDecisions,
    );
  });

  it("classification covers all ranges", () => {
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
});

// ============ CONSTITUTIONAL ============

describe("AxiomCompliance", () => {
  it("has exactly 10 boolean fields (10 axioms)", () => {
    const axioms: AxiomCompliance = {
      symbiosis: true,
      transparency: true,
      fidelity: true,
      visibleState: true,
      minimalAuthority: true,
      provenance: true,
      reversibility: true,
      semanticStability: true,
      comprehensionPrimacy: true,
      adaptivePressure: true,
    };
    expect(Object.keys(axioms)).toHaveLength(10);
    expect(computeAxiomComplianceFraction(axioms)).toBe(1.0);
  });

  it("computes fraction correctly for partial compliance", () => {
    const axioms: AxiomCompliance = {
      symbiosis: true,
      transparency: false,
      fidelity: true,
      visibleState: false,
      minimalAuthority: true,
      provenance: true,
      reversibility: true,
      semanticStability: true,
      comprehensionPrimacy: false,
      adaptivePressure: true,
    };
    expect(computeAxiomComplianceFraction(axioms)).toBeCloseTo(0.7, 4);
  });
});

describe("ConstitutionalRule Expression Nesting", () => {
  it("has nested expression with target, constraint, value", () => {
    const rule: ConstitutionalRule = {
      id: "test-rule",
      name: "Test Rule",
      tier: 1,
      status: "active",
      expression: {
        target: "cascade_limit",
        constraint: "max",
        value: 2,
        priority: "mandatory",
      },
      governsPatterns: ["router-v1"],
      rationale: "Prevent cascade storms",
      createdAt: new Date(),
      evidencedBy: [],
    };

    expect(rule.expression.target).toBe("cascade_limit");
    expect(rule.expression.constraint).toBe("max");
    expect(rule.expression.value).toBe(2);
    expect(rule.expression.priority).toBe("mandatory");
  });
});

describe("RuleEvaluation", () => {
  it("uses actualValue/thresholdValue (not name/tier/message)", () => {
    const eval_: RuleEvaluation = {
      ruleId: "cascade-limit",
      passed: true,
      actualValue: 1,
      thresholdValue: 2,
      evaluatedAt: new Date(),
      notes: "Within cascade limit",
    };
    expect(eval_.actualValue).toBeLessThanOrEqual(
      eval_.thresholdValue as number,
    );
  });
});

describe("ArchitectureDecisionRecord", () => {
  it("uses decisionId, alternativesConsidered, selected", () => {
    const adr: ArchitectureDecisionRecord = {
      decisionId: "adr-001",
      timestamp: new Date(),
      context: "SDK migration",
      alternativesConsidered: ["LangChain", "Native SDKs"],
      selected: "Native SDKs",
      rationale: "Fewer deps",
      affectedRules: ["rule-1"],
      expectedImpact: {
        phiL: "improve",
        psiH: "neutral",
        epsilonR: "increase",
      },
    };
    expect(adr.decisionId).toBe("adr-001");
    expect(adr.alternativesConsidered).toHaveLength(2);
    expect(adr.selected).toBe("Native SDKs");
  });
});

// ============ MEMORY STRATA ============

describe("Memory Strata Types", () => {
  it("Stratum 1: EphemeralMemory has executionId/bloomId/data", () => {
    const e: EphemeralMemory = {
      stratum: 1,
      executionId: "exec-001",
      bloomId: "router-v1",
      data: { model: "gemini" },
      createdAt: new Date(),
    };
    expect(e.stratum).toBe(1);
    expect(e.executionId).toBeDefined();
    expect(e.bloomId).toBeDefined();
  });

  it("Stratum 2: Observation has observationType/data:ObservationData", () => {
    const o: Observation = {
      id: "obs-001",
      stratum: 2,
      timestamp: new Date(),
      sourceBloomId: "router-v1",
      observationType: "execution_outcome",
      data: {
        success: true,
        durationMs: 350,
        qualityScore: 0.9,
      },
    };
    expect(o.stratum).toBe(2);
    expect(o.data.success).toBe(true);
  });

  it("Stratum 3: Distillation has category/relatedPatternIds", () => {
    const d: Distillation = {
      id: "dist-001",
      stratum: 3,
      createdAt: new Date(),
      sourceObservationIds: ["obs-001", "obs-002"],
      insight: "Model performs well on code gen",
      confidence: 0.85,
      category: "performance_profile",
      relatedPatternIds: ["router-v1"],
    };
    expect(d.stratum).toBe(3);
    expect(d.category).toBe("performance_profile");
  });

  it("Stratum 4: InstitutionalKnowledge has knowledgeType/contributingCount", () => {
    const ik: InstitutionalKnowledge = {
      id: "ik-001",
      stratum: 4,
      createdAt: new Date(),
      content: "Gemini Flash is optimal for moderate code tasks",
      knowledgeType: "composition_archetype",
      confidence: 0.9,
      contributingCount: 15,
      lastReinforced: new Date(),
    };
    expect(ik.stratum).toBe(4);
    expect(ik.knowledgeType).toBe("composition_archetype");
  });
});

describe("Decision Type Structure", () => {
  it("has alternatives/selected/reason/madeByBloomId", () => {
    const d: Decision = {
      id: "dec-001",
      timestamp: new Date(),
      context: { taskType: "code_generation", complexity: "medium" },
      alternatives: ["gemini-flash", "claude-haiku", "mistral-medium"],
      selected: "gemini-flash",
      reason: "Fastest for moderate complexity",
      evaluatedRules: ["rule-1"],
      madeByBloomId: "router-v1",
    };
    expect(d.alternatives).toHaveLength(3);
    expect(d.selected).toBe("gemini-flash");
    expect(d.madeByBloomId).toBe("router-v1");
  });

  it("DecisionContext.complexity uses low/medium/high", () => {
    const complexities: DecisionContext["complexity"][] = [
      "low",
      "medium",
      "high",
    ];
    expect(complexities).toHaveLength(3);
  });

  it("DecisionOutcome requires recordedAt", () => {
    const outcome: DecisionOutcome = {
      success: true,
      qualityScore: 0.92,
      durationMs: 1500,
      recordedAt: new Date(),
    };
    expect(outcome.recordedAt).toBeInstanceOf(Date);
  });
});
