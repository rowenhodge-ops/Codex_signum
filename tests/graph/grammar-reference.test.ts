// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import {
  getCategories,
  getAxiomDependencies,
  getAntiPatternViolations,
  getMorphemeVisualProps,
  GRAMMAR_REF_ID,
} from "../../scripts/bootstrap-grammar-reference.js";
import type { GrammarElement, CategoryData, MorphemeVisualProps } from "../../scripts/bootstrap-grammar-reference.js";
import { RELATIONSHIP_TYPES } from "../../src/graph/schema.js";
import type {
  GrammarElementEntry,
  GrammarCoverageEntry,
  AxiomDependencyEntry,
  AntiPatternViolationEntry,
} from "../../src/graph/queries.js";
import type { SurveyOutput } from "../../src/patterns/architect/types.js";

// ── Data Validation Tests (no Neo4j required) ──────────────────────────────

describe("Grammar Reference Bootstrap — Category Data", () => {
  const categories = getCategories();

  it("returns 8 categories", () => {
    expect(categories).toHaveLength(8);
  });

  it("category IDs follow the cat: prefix pattern", () => {
    for (const cat of categories) {
      expect(cat.id).toMatch(/^cat:/);
      expect(cat.name).toBeTruthy();
      expect(cat.elements.length).toBeGreaterThan(0);
    }
  });

  it("includes all expected category IDs", () => {
    const ids = categories.map((c) => c.id);
    expect(ids).toContain("cat:morphemes");
    expect(ids).toContain("cat:axioms");
    expect(ids).toContain("cat:grammar-rules");
    expect(ids).toContain("cat:state-dimensions");
    expect(ids).toContain("cat:heuristic-imperatives");
    expect(ids).toContain("cat:anti-patterns");
    expect(ids).toContain("cat:operational-records");
    expect(ids).toContain("cat:memory-strata");
  });

  it("category IDs are unique", () => {
    const ids = categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Grammar Reference Bootstrap — Element Seeds", () => {
  const categories = getCategories();
  const allElements = categories.flatMap((c) => c.elements);

  it("has exactly 47 grammar element Seeds", () => {
    // 6 morphemes + 9 axioms + 5 grammar rules + 3 state dims + 3 imperatives
    // + 12 anti-patterns + 5 operational records + 4 memory strata = 47
    expect(allElements).toHaveLength(47);
  });

  it("all element IDs are unique", () => {
    const ids = allElements.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all elements have required properties", () => {
    for (const el of allElements) {
      expect(el.id).toBeTruthy();
      expect(el.seedType).toBeTruthy();
      expect(el.name).toBeTruthy();
      expect(el.description).toBeTruthy();
      expect(el.specSource).toBeTruthy();
      expect(el.implementationStatus).toBeTruthy();
      expect(el.implementationNotes).toBeTruthy();
      expect([
        "complete",
        "partial",
        "types-only",
        "not-started",
        "aspirational",
      ]).toContain(el.implementationStatus);
    }
  });

  it("element IDs match their seedType prefix", () => {
    for (const el of allElements) {
      const prefix = el.id.split(":")[0];
      // Prefix should relate to seedType (e.g., morpheme:seed → seedType=morpheme)
      // Anti-pattern prefix is 'ap', stratum prefix is 'stratum', etc.
      const expectedPrefixes: Record<string, string> = {
        morpheme: "morpheme",
        axiom: "axiom",
        "grammar-rule": "rule",
        "state-dimension": "dim",
        "heuristic-imperative": "imp",
        "anti-pattern": "ap",
        "operational-record": "op",
        stratum: "stratum",
      };
      expect(prefix).toBe(expectedPrefixes[el.seedType]);
    }
  });
});

describe("Grammar Reference Bootstrap — Morphemes", () => {
  const categories = getCategories();
  const morphemes = categories.find((c) => c.id === "cat:morphemes")!;

  it("has exactly 6 morphemes", () => {
    expect(morphemes.elements).toHaveLength(6);
  });

  it("includes all six morpheme names", () => {
    const names = morphemes.elements.map((e) => e.id);
    expect(names).toContain("morpheme:seed");
    expect(names).toContain("morpheme:line");
    expect(names).toContain("morpheme:bloom");
    expect(names).toContain("morpheme:resonator");
    expect(names).toContain("morpheme:grid");
    expect(names).toContain("morpheme:helix");
  });
});

describe("Grammar Reference Bootstrap — Axioms", () => {
  const categories = getCategories();
  const axioms = categories.find((c) => c.id === "cat:axioms")!;

  it("has exactly 9 axioms (post v4.0 — Symbiosis removed)", () => {
    expect(axioms.elements).toHaveLength(9);
  });

  it("axiom IDs are A1 through A9", () => {
    const ids = axioms.elements.map((e) => e.id);
    expect(ids).toContain("axiom:A1-fidelity");
    expect(ids).toContain("axiom:A2-visible-state");
    expect(ids).toContain("axiom:A3-transparency");
    expect(ids).toContain("axiom:A4-provenance");
    expect(ids).toContain("axiom:A5-reversibility");
    expect(ids).toContain("axiom:A6-minimal-authority");
    expect(ids).toContain("axiom:A7-semantic-stability");
    expect(ids).toContain("axiom:A8-adaptive-pressure");
    expect(ids).toContain("axiom:A9-comprehension-primacy");
  });
});

describe("Grammar Reference Bootstrap — Axiom DAG", () => {
  const deps = getAxiomDependencies();

  it("has exactly 8 dependency edges", () => {
    // A1→A2, A1→A3, A4→A2, A5→A4, A7→A2, A8→A2, A8→A3, A9→A3
    expect(deps).toHaveLength(8);
  });

  it("A1 Fidelity depends on A2 and A3", () => {
    const a1Deps = deps.filter((d) => d.from === "axiom:A1-fidelity");
    expect(a1Deps).toHaveLength(2);
    const targets = a1Deps.map((d) => d.to);
    expect(targets).toContain("axiom:A2-visible-state");
    expect(targets).toContain("axiom:A3-transparency");
  });

  it("A5 Reversibility depends on A4 Provenance", () => {
    const a5Deps = deps.filter((d) => d.from === "axiom:A5-reversibility");
    expect(a5Deps).toHaveLength(1);
    expect(a5Deps[0].to).toBe("axiom:A4-provenance");
  });

  it("A6 Minimal Authority has no dependencies", () => {
    const a6Deps = deps.filter((d) => d.from === "axiom:A6-minimal-authority");
    expect(a6Deps).toHaveLength(0);
  });

  it("foundation axioms (A2, A3, A6) are never in the 'from' position", () => {
    const fromIds = deps.map((d) => d.from);
    expect(fromIds).not.toContain("axiom:A2-visible-state");
    expect(fromIds).not.toContain("axiom:A3-transparency");
    expect(fromIds).not.toContain("axiom:A6-minimal-authority");
  });

  it("all referenced axiom IDs exist in the axiom category", () => {
    const categories = getCategories();
    const axiomIds = new Set(
      categories.find((c) => c.id === "cat:axioms")!.elements.map((e) => e.id),
    );
    for (const dep of deps) {
      expect(axiomIds.has(dep.from)).toBe(true);
      expect(axiomIds.has(dep.to)).toBe(true);
    }
  });
});

describe("Grammar Reference Bootstrap — Anti-Pattern Violations", () => {
  const violations = getAntiPatternViolations();

  it("has exactly 12 violation mappings", () => {
    expect(violations).toHaveLength(12);
  });

  it("every anti-pattern has exactly one VIOLATES target", () => {
    const categories = getCategories();
    const apIds = categories
      .find((c) => c.id === "cat:anti-patterns")!
      .elements.map((e) => e.id);

    // Every anti-pattern should appear exactly once
    const violatingIds = violations.map((v) => v.antiPatternId);
    for (const id of apIds) {
      expect(violatingIds.filter((v) => v === id)).toHaveLength(1);
    }
  });

  it("all referenced IDs exist in their respective categories", () => {
    const categories = getCategories();
    const axiomIds = new Set(
      categories.find((c) => c.id === "cat:axioms")!.elements.map((e) => e.id),
    );
    const apIds = new Set(
      categories.find((c) => c.id === "cat:anti-patterns")!.elements.map((e) => e.id),
    );

    for (const v of violations) {
      expect(apIds.has(v.antiPatternId)).toBe(true);
      expect(axiomIds.has(v.axiomId)).toBe(true);
    }
  });

  it("monitoring overlay violates A2 Visible State", () => {
    const overlay = violations.find((v) => v.antiPatternId === "ap:monitoring-overlay");
    expect(overlay).toBeDefined();
    expect(overlay!.axiomId).toBe("axiom:A2-visible-state");
  });

  it("dimensional collapse violates A3 Transparency", () => {
    const dc = violations.find((v) => v.antiPatternId === "ap:dimensional-collapse");
    expect(dc).toBeDefined();
    expect(dc!.axiomId).toBe("axiom:A3-transparency");
  });
});

describe("Grammar Reference Bootstrap — Memory Strata", () => {
  const categories = getCategories();
  const strata = categories.find((c) => c.id === "cat:memory-strata")!;

  it("has exactly 4 strata (per v4.3 spec)", () => {
    // v4.3 spec defines 4 strata: Ephemeral, Observational, Distilled, Institutional
    expect(strata.elements).toHaveLength(4);
  });

  it("strata are numbered 1 through 4", () => {
    const ids = strata.elements.map((e) => e.id);
    expect(ids).toContain("stratum:1-ephemeral");
    expect(ids).toContain("stratum:2-observations");
    expect(ids).toContain("stratum:3-distillations");
    expect(ids).toContain("stratum:4-institutional");
  });
});

describe("Grammar Reference Bootstrap — Implementation Coverage", () => {
  const categories = getCategories();
  const allElements = categories.flatMap((c) => c.elements);

  it("all status values are from the allowed set", () => {
    const allowed = new Set(["complete", "partial", "types-only", "not-started", "aspirational"]);
    for (const el of allElements) {
      expect(allowed.has(el.implementationStatus)).toBe(true);
    }
  });

  it("has a mix of implementation statuses (not all one status)", () => {
    const statuses = new Set(allElements.map((e) => e.implementationStatus));
    expect(statuses.size).toBeGreaterThan(1);
  });

  it("complete elements outnumber not-started + aspirational", () => {
    const complete = allElements.filter((e) => e.implementationStatus === "complete").length;
    const unbuilt = allElements.filter(
      (e) => e.implementationStatus === "not-started" || e.implementationStatus === "aspirational",
    ).length;
    expect(complete).toBeGreaterThan(unbuilt);
  });
});

describe("Grammar Reference Bootstrap — Schema", () => {
  it("RELATIONSHIP_TYPES includes DEPENDS_ON", () => {
    expect(RELATIONSHIP_TYPES.DEPENDS_ON).toBe("DEPENDS_ON");
  });

  it("RELATIONSHIP_TYPES includes VIOLATES", () => {
    expect(RELATIONSHIP_TYPES.VIOLATES).toBe("VIOLATES");
  });

  it("GRAMMAR_REF_ID is grammar-ref-v4.3", () => {
    expect(GRAMMAR_REF_ID).toBe("grammar-ref-v4.3");
  });
});

describe("Grammar Reference Bootstrap — Grammar Rules", () => {
  const categories = getCategories();
  const rules = categories.find((c) => c.id === "cat:grammar-rules")!;

  it("has exactly 5 grammar rules", () => {
    expect(rules.elements).toHaveLength(5);
  });

  it("rules are G1 through G5", () => {
    const ids = rules.elements.map((e) => e.id);
    expect(ids).toContain("rule:G1-proximity");
    expect(ids).toContain("rule:G2-orientation");
    expect(ids).toContain("rule:G3-containment");
    expect(ids).toContain("rule:G4-flow");
    expect(ids).toContain("rule:G5-resonance");
  });
});

describe("Grammar Reference Bootstrap — State Dimensions", () => {
  const categories = getCategories();
  const dims = categories.find((c) => c.id === "cat:state-dimensions")!;

  it("has exactly 3 state dimensions", () => {
    expect(dims.elements).toHaveLength(3);
  });

  it("includes ΦL, ΨH, εR", () => {
    const ids = dims.elements.map((e) => e.id);
    expect(ids).toContain("dim:phiL");
    expect(ids).toContain("dim:psiH");
    expect(ids).toContain("dim:epsilonR");
  });
});

describe("Grammar Reference Bootstrap — Heuristic Imperatives", () => {
  const categories = getCategories();
  const imps = categories.find((c) => c.id === "cat:heuristic-imperatives")!;

  it("has exactly 3 heuristic imperatives", () => {
    expect(imps.elements).toHaveLength(3);
  });

  it("includes Ω₁, Ω₂, Ω₃", () => {
    const ids = imps.elements.map((e) => e.id);
    expect(ids).toContain("imp:omega1");
    expect(ids).toContain("imp:omega2");
    expect(ids).toContain("imp:omega3");
  });
});

describe("Grammar Reference Bootstrap — Operational Records", () => {
  const categories = getCategories();
  const ops = categories.find((c) => c.id === "cat:operational-records")!;

  it("has exactly 5 operational record types", () => {
    expect(ops.elements).toHaveLength(5);
  });

  it("all operational records are implementation-complete", () => {
    for (const el of ops.elements) {
      expect(el.implementationStatus).toBe("complete");
    }
  });
});

// ── Query Type Shape Tests (no Neo4j required) ───────────────────────────────

describe("Grammar Reference — Query types are correctly exported", () => {
  it("GrammarElementEntry has required fields", () => {
    // Type-level check: construct a valid entry
    const entry: GrammarElementEntry = {
      id: "test:id",
      seedType: "test",
      name: "Test",
      description: "Test entry",
      specSource: "test",
      implementationStatus: "complete",
      implementationNotes: "test",
      codeLocation: null,
    };
    expect(entry.id).toBe("test:id");
    expect(entry.codeLocation).toBeNull();
  });

  it("GrammarCoverageEntry has required fields", () => {
    const entry: GrammarCoverageEntry = {
      total: 47,
      complete: 20,
      partial: 10,
      typesOnly: 5,
      notStarted: 5,
      aspirational: 7,
    };
    expect(entry.total).toBe(47);
  });

  it("AxiomDependencyEntry has required fields", () => {
    const entry: AxiomDependencyEntry = {
      axiomId: "axiom:A1-fidelity",
      axiomName: "A1 Fidelity",
      dependsOn: ["axiom:A2-visible-state"],
      dependedOnBy: [],
    };
    expect(entry.dependsOn).toHaveLength(1);
  });

  it("AntiPatternViolationEntry has required fields", () => {
    const entry: AntiPatternViolationEntry = {
      antiPatternId: "ap:shadow-system",
      antiPatternName: "Shadow System",
      violatesAxiom: "axiom:A2-visible-state",
      violatesAxiomName: "A2 Visible State",
      implementationStatus: "complete",
    };
    expect(entry.violatesAxiom).toBe("axiom:A2-visible-state");
  });
});

describe("Grammar Reference — SURVEY graphState type compatibility", () => {
  it("SurveyOutput.graphState includes grammar coverage fields", () => {
    // Type-level check: verify the graphState shape includes M-9.7a fields
    const graphState: NonNullable<SurveyOutput["graphState"]> = {
      bloomHealth: {},
      activeCascades: 0,
      thresholdEvents: [],
      constitutionalAlerts: [],
      grammarCoverage: {
        total: 47,
        complete: 20,
        partial: 10,
        typesOnly: 5,
        notStarted: 5,
        aspirational: 7,
      },
      antiPatternViolations: [
        {
          antiPatternId: "ap:shadow-system",
          antiPatternName: "Shadow System",
          violatesAxiom: "axiom:A2-visible-state",
          violatesAxiomName: "A2 Visible State",
          implementationStatus: "complete",
        },
      ],
    };
    expect(graphState.grammarCoverage!.total).toBe(47);
    expect(graphState.antiPatternViolations).toHaveLength(1);
  });

  it("grammar fields are optional (backward compatible)", () => {
    // Existing code that doesn't set grammar fields should still work
    const graphState: NonNullable<SurveyOutput["graphState"]> = {
      bloomHealth: {},
      activeCascades: 0,
      thresholdEvents: [],
      constitutionalAlerts: [],
    };
    expect(graphState.grammarCoverage).toBeUndefined();
    expect(graphState.antiPatternViolations).toBeUndefined();
  });
});

// ── Morpheme Visual Enrichment Tests (M-16.3.2) ─────────────────────────────

describe("Grammar Reference — Morpheme Visual Properties", () => {
  const visProps = getMorphemeVisualProps();
  const morphemeIds = [
    "morpheme:seed",
    "morpheme:line",
    "morpheme:bloom",
    "morpheme:resonator",
    "morpheme:grid",
    "morpheme:helix",
  ];

  it("provides visual properties for all 6 morphemes", () => {
    expect(Object.keys(visProps)).toHaveLength(6);
    for (const id of morphemeIds) {
      expect(visProps[id]).toBeDefined();
    }
  });

  it("all morpheme visual props have baseShape", () => {
    for (const id of morphemeIds) {
      expect(visProps[id].baseShape).toBeTruthy();
    }
  });

  it("all morpheme visual props have minSizePx and detailThresholdPx", () => {
    for (const id of morphemeIds) {
      expect(typeof visProps[id].minSizePx).toBe("number");
      expect(typeof visProps[id].detailThresholdPx).toBe("number");
      expect(visProps[id].detailThresholdPx).toBeGreaterThan(visProps[id].minSizePx);
    }
  });

  it("all morpheme visual props have state dimension encodings", () => {
    for (const id of morphemeIds) {
      expect(visProps[id].phiL_encoding).toBeTruthy();
      expect(visProps[id].psiH_encoding).toBeTruthy();
      expect(visProps[id].epsilonR_encoding).toBeTruthy();
    }
  });

  it("all morpheme visual props have defaultHue", () => {
    for (const id of morphemeIds) {
      expect(visProps[id].defaultHue).toBeTruthy();
    }
  });

  // Spot checks against vis research data (§2.1 table)
  it("Seed has baseShape=circle, minSizePx=4", () => {
    expect(visProps["morpheme:seed"].baseShape).toBe("circle");
    expect(visProps["morpheme:seed"].minSizePx).toBe(4);
  });

  it("Line has baseShape=directed-edge, minSizePx=1", () => {
    expect(visProps["morpheme:line"].baseShape).toBe("directed-edge");
    expect(visProps["morpheme:line"].minSizePx).toBe(1);
  });

  it("Bloom has detailThresholdPx=60", () => {
    expect(visProps["morpheme:bloom"].detailThresholdPx).toBe(60);
  });

  it("Resonator has baseShape=triangle, minSizePx=8", () => {
    expect(visProps["morpheme:resonator"].baseShape).toBe("triangle");
    expect(visProps["morpheme:resonator"].minSizePx).toBe(8);
  });

  it("Grid has baseShape=square, detailThresholdPx=30", () => {
    expect(visProps["morpheme:grid"].baseShape).toBe("square");
    expect(visProps["morpheme:grid"].detailThresholdPx).toBe(30);
  });

  it("Helix has baseShape=spiral, minSizePx=12", () => {
    expect(visProps["morpheme:helix"].baseShape).toBe("spiral");
    expect(visProps["morpheme:helix"].minSizePx).toBe(12);
  });

  it("shapes are all distinct (pre-attentive requirement)", () => {
    const shapes = morphemeIds.map((id) => visProps[id].baseShape);
    expect(new Set(shapes).size).toBe(6);
  });

  it("MorphemeVisualProps type has correct shape", () => {
    const props: MorphemeVisualProps = visProps["morpheme:seed"];
    expect(props.baseShape).toBe("circle");
    expect(props.rendering).toBeTruthy();
    expect(typeof props.minSizePx).toBe("number");
    expect(typeof props.detailThresholdPx).toBe("number");
    expect(props.phiL_encoding).toBeTruthy();
    expect(props.psiH_encoding).toBeTruthy();
    expect(props.epsilonR_encoding).toBeTruthy();
    expect(props.defaultHue).toBeTruthy();
  });
});

describe("Grammar Reference — Barrel re-exports", () => {
  it("query functions are exported from graph barrel", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.getGrammarElements).toBe("function");
    expect(typeof graphModule.getGrammarCoverage).toBe("function");
    expect(typeof graphModule.getAxiomDependencies).toBe("function");
    expect(typeof graphModule.getAntiPatternViolations).toBe("function");
  });

  it("query functions are exported from package root", async () => {
    const root = await import("../../src/index.js");
    expect(typeof root.getGrammarElements).toBe("function");
    expect(typeof root.getGrammarCoverage).toBe("function");
    expect(typeof root.getAxiomDependencies).toBe("function");
    expect(typeof root.getAntiPatternViolations).toBe("function");
  });
});
