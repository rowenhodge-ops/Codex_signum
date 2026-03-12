// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import type {
  AntiPatternMatch,
  AxiomResult,
  ClaimDependency,
  ClaimValidation,
  ComplianceResult,
  InvocationMode,
  PostFlightResult,
  ProposalType,
  StructuralClaim,
} from "../../src/index.js";

// ── Type Shape Tests (compile-time + runtime validation) ─────────────────────

describe("Assayer Types — ProposalType union", () => {
  it("accepts all expected members", () => {
    const types: ProposalType[] = [
      "code_change",
      "spec_edit",
      "architecture_decision",
      "process_change",
      "prompt_template",
    ];
    expect(types).toHaveLength(5);
  });
});

describe("Assayer Types — InvocationMode union", () => {
  it("accepts all expected members", () => {
    const modes: InvocationMode[] = [
      "advisory",
      "gate",
      "post_flight",
      "historical",
    ];
    expect(modes).toHaveLength(4);
  });
});

describe("Assayer Types — StructuralClaim shape", () => {
  it("has required fields", () => {
    const claim: StructuralClaim = {
      claimId: "c-001",
      description: "Introduces a new pattern",
      claimType: "entity_introduction",
      affectedMorphemes: ["Bloom", "Resonator"],
      affectedAxioms: ["A2"],
      evidence: "Creates new Bloom node with CONTAINS relationships",
    };
    expect(claim.claimId).toBe("c-001");
    expect(claim.claimType).toBe("entity_introduction");
    expect(claim.affectedMorphemes).toHaveLength(2);
    expect(claim.affectedAxioms).toHaveLength(1);
  });

  it("accepts all claim types", () => {
    const types: StructuralClaim["claimType"][] = [
      "entity_introduction",
      "flow_establishment",
      "boundary_modification",
      "construct_replacement",
      "concept_declaration",
    ];
    expect(types).toHaveLength(5);
  });
});

describe("Assayer Types — ClaimDependency shape", () => {
  it("has required fields", () => {
    const dep: ClaimDependency = {
      from: "c-001",
      to: "c-002",
      relationship: "enables",
    };
    expect(dep.from).toBe("c-001");
    expect(dep.relationship).toBe("enables");
  });

  it("accepts all relationship types", () => {
    const rels: ClaimDependency["relationship"][] = [
      "enables",
      "conflicts_with",
      "modifies_same_scope",
    ];
    expect(rels).toHaveLength(3);
  });
});

describe("Assayer Types — AxiomResult shape", () => {
  it("has required fields", () => {
    const result: AxiomResult = {
      axiom: "A2",
      axiomName: "Visible State",
      satisfied: true,
      evidence: "State changes are reflected in graph properties",
      confidence: 0.95,
    };
    expect(result.axiom).toBe("A2");
    expect(result.satisfied).toBe(true);
    expect(result.confidence).toBe(0.95);
  });
});

describe("Assayer Types — AntiPatternMatch shape", () => {
  it("has required fields", () => {
    const match: AntiPatternMatch = {
      antiPattern: "shadow-system",
      matchConfidence: 0.85,
      evidence: "Creates separate JSON cache outside graph",
      structuralSimilarity: 0.9,
    };
    expect(match.antiPattern).toBe("shadow-system");
    expect(match.matchConfidence).toBe(0.85);
  });
});

describe("Assayer Types — ClaimValidation shape", () => {
  it("has required fields", () => {
    const validation: ClaimValidation = {
      claimId: "c-001",
      grammarExpressible: true,
      grammarMapping: "Bloom → CONTAINS → Resonator",
      grammarIssues: [],
      axiomResults: [
        {
          axiom: "A2",
          axiomName: "Visible State",
          satisfied: true,
          evidence: "Graph properties updated",
          confidence: 0.9,
        },
      ],
      antiPatternMatches: [],
      overallSeverity: "clear",
      refinementPossible: false,
      refinementSuggestion: null,
    };
    expect(validation.grammarExpressible).toBe(true);
    expect(validation.overallSeverity).toBe("clear");
    expect(validation.axiomResults).toHaveLength(1);
  });

  it("accepts all severity levels", () => {
    const severities: ClaimValidation["overallSeverity"][] = [
      "clear",
      "minor",
      "major",
      "critical",
    ];
    expect(severities).toHaveLength(4);
  });
});

describe("Assayer Types — ComplianceResult shape", () => {
  it("has all required fields", () => {
    const result: ComplianceResult = {
      proposalId: "prop-001",
      proposalType: "code_change",
      invocationMode: "gate",
      claims: [],
      validations: [],
      compoundEffects: [],
      overallVerdict: "compliant",
      confidence: 0.92,
      processingTimeMs: 1250,
    };
    expect(result.proposalId).toBe("prop-001");
    expect(result.overallVerdict).toBe("compliant");
    expect(result.processingTimeMs).toBe(1250);
  });

  it("accepts all verdict levels", () => {
    const verdicts: ComplianceResult["overallVerdict"][] = [
      "compliant",
      "minor_issues",
      "major_issues",
      "non_compliant",
    ];
    expect(verdicts).toHaveLength(4);
  });
});

describe("Assayer Types — PostFlightResult shape", () => {
  it("extends ComplianceResult with runId and retrospective insights", () => {
    const result: PostFlightResult = {
      proposalId: "prop-001",
      proposalType: "code_change",
      invocationMode: "post_flight",
      claims: [],
      validations: [],
      compoundEffects: [],
      overallVerdict: "minor_issues",
      confidence: 0.88,
      processingTimeMs: 3400,
      runId: "run-abc-123",
      retrospectiveInsights: [
        {
          pattern: "Recurring axiom A2 violations in code_change proposals",
          frequency: 3,
          recommendation: "Add pre-commit check for graph state visibility",
        },
      ],
    };
    expect(result.runId).toBe("run-abc-123");
    expect(result.retrospectiveInsights).toHaveLength(1);
    expect(result.retrospectiveInsights[0].frequency).toBe(3);
  });
});

describe("Assayer Types — Barrel re-exports", () => {
  it("all types are importable from package root", async () => {
    // Dynamic import verifies the barrel chain works at runtime
    const root = await import("../../src/index.js");
    // Types are erased at runtime, so we verify the module loads without error
    expect(root).toBeDefined();
  });

  it("all types are importable from patterns barrel", async () => {
    const patterns = await import("../../src/patterns/index.js");
    expect(patterns).toBeDefined();
  });

  it("all types are importable from assayer barrel", async () => {
    const assayer = await import("../../src/patterns/assayer/index.js");
    expect(assayer).toBeDefined();
  });
});
