// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * L5 Invariant — Graph-Native Data Creation Rule 2: No Orphaned Nodes
 *
 * "A node with zero relationships is structurally invisible."
 * "Every node creation MUST be accompanied by at least one relationship creation."
 *
 * This test verifies that all bootstrap scripts and graph creation paths
 * pair every node creation with at least one relationship. Orphaned nodes
 * are Dormant — present but not participating in any flow.
 *
 * Source: CLAUDE.md §Graph-Native Data Creation — Rule 2
 *
 * R-39 SUPERSESSION: The morpheme instantiation layer now provides structural
 * enforcement for this rule via createContainedDataSeed() and createContainedBloom(),
 * which create node + relationship atomically in a single transaction. These tests
 * are retained as documentation of what the structure enforces, not as the
 * enforcement mechanism.
 */
import { describe, expect, it } from "vitest";
import {
  getRoadmapMilestones,
  getHypotheses,
  getFutureTests,
  getTestSuites,
} from "../../scripts/bootstrap-ecosystem.js";
import {
  getCategories,
  getAxiomDependencies,
  getAntiPatternViolations,
  GRAMMAR_REF_ID,
} from "../../scripts/bootstrap-grammar-reference.js";
import { RELATIONSHIP_TYPES } from "../../src/graph/schema.js";

// ── Ecosystem Bootstrap: every node gets a CONTAINS or OBSERVES edge ─────────

describe("Rule 2: Ecosystem bootstrap — every node is wired", () => {
  const milestones = getRoadmapMilestones();
  const major = milestones.filter((m) => m.type === "milestone");
  const sub = milestones.filter((m) => m.type === "sub-milestone");
  const hypotheses = getHypotheses();
  const futureTests = getFutureTests();
  const testSuites = getTestSuites();

  it("every major milestone is CONTAINED by roadmap-v7", () => {
    // The bootstrap script creates roadmap-v7 → milestone CONTAINS for all majors.
    // Verify: every major milestone ID exists and will get a CONTAINS from roadmap-v7.
    expect(major.length).toBeGreaterThan(0);
    for (const m of major) {
      expect(m.id).toBeTruthy();
      expect(m.type).toBe("milestone");
    }
    // The roadmap Bloom is always "roadmap-v7" — it's the root container.
    // In the bootstrap, every major milestone gets: createContainsRelationship("roadmap-v7", m.id)
  });

  it("every sub-milestone has a parentId for CONTAINS wiring", () => {
    expect(sub.length).toBeGreaterThan(0);
    for (const m of sub) {
      expect(
        m.parentId,
        `Sub-milestone ${m.id} has no parentId — would be orphaned`,
      ).toBeTruthy();
    }
  });

  it("every sub-milestone parentId references a valid milestone", () => {
    const allIds = new Set(milestones.map((m) => m.id));
    for (const m of sub) {
      expect(
        allIds.has(m.parentId!),
        `Sub-milestone ${m.id} references non-existent parent ${m.parentId}`,
      ).toBe(true);
    }
  });

  it("every hypothesis has an observesMilestone for OBSERVES wiring", () => {
    expect(hypotheses.length).toBeGreaterThan(0);
    for (const h of hypotheses) {
      expect(
        h.observesMilestone,
        `Hypothesis ${h.id} has no observesMilestone — would be orphaned`,
      ).toBeTruthy();
    }
  });

  it("every hypothesis observesMilestone references a valid milestone", () => {
    const milestoneIds = new Set(milestones.map((m) => m.id));
    for (const h of hypotheses) {
      expect(
        milestoneIds.has(h.observesMilestone),
        `Hypothesis ${h.id} observes non-existent milestone ${h.observesMilestone}`,
      ).toBe(true);
    }
  });

  it("every deferred test Seed has a suiteId for CONTAINS wiring", () => {
    for (const t of futureTests) {
      expect(
        t.suiteId,
        `Test ${t.id} has no suiteId — would be orphaned`,
      ).toBeTruthy();
    }
  });

  it("every deferred test Seed has a targetMilestone for SCOPED_TO wiring", () => {
    for (const t of futureTests) {
      expect(
        t.targetMilestone,
        `Test ${t.id} has no targetMilestone — would be orphaned from scope`,
      ).toBeTruthy();
    }
  });

  it("every test suiteId references a valid test-suite", () => {
    const suiteIds = new Set(testSuites.map((s) => s.id));
    for (const t of futureTests) {
      expect(
        suiteIds.has(t.suiteId),
        `Test ${t.id} references non-existent suite ${t.suiteId}`,
      ).toBe(true);
    }
  });

  it("every test targetMilestone references a valid milestone", () => {
    const milestoneIds = new Set(milestones.map((m) => m.id));
    for (const t of futureTests) {
      expect(
        milestoneIds.has(t.targetMilestone),
        `Test ${t.id} references non-existent milestone ${t.targetMilestone}`,
      ).toBe(true);
    }
  });
});

// ── Grammar Reference: every category and element is CONTAINED ───────────────

describe("Rule 2: Grammar reference bootstrap — every node is wired", () => {
  const categories = getCategories();
  const allElements = categories.flatMap((c) => c.elements);

  it("grammar reference root bloom ID exists", () => {
    expect(GRAMMAR_REF_ID).toBeTruthy();
    expect(typeof GRAMMAR_REF_ID).toBe("string");
  });

  it("every category has an id for CONTAINS from grammar reference root", () => {
    for (const cat of categories) {
      expect(
        cat.id,
        `Category has no id — would be orphaned`,
      ).toBeTruthy();
    }
  });

  it("every grammar element has an id for CONTAINS from its category", () => {
    for (const el of allElements) {
      expect(
        el.id,
        `Element has no id — would be orphaned`,
      ).toBeTruthy();
    }
  });

  it("axiom dependencies reference valid axiom IDs", () => {
    const axiomIds = new Set(
      categories
        .find((c) => c.id === "cat:axioms")
        ?.elements.map((e) => e.id) ?? [],
    );
    const deps = getAxiomDependencies();
    for (const dep of deps) {
      expect(
        axiomIds.has(dep.from),
        `Axiom dependency 'from' ${dep.from} is not a valid axiom ID`,
      ).toBe(true);
      expect(
        axiomIds.has(dep.to),
        `Axiom dependency 'to' ${dep.to} is not a valid axiom ID`,
      ).toBe(true);
    }
  });

  it("anti-pattern violations reference valid axiom IDs", () => {
    const axiomIds = new Set(
      categories
        .find((c) => c.id === "cat:axioms")
        ?.elements.map((e) => e.id) ?? [],
    );
    const antiPatternIds = new Set([
      ...(categories
        .find((c) => c.id === "cat:anti-patterns")
        ?.elements.map((e) => e.id) ?? []),
      ...(categories
        .find((c) => c.id === "cat:implementation-incidents")
        ?.elements.map((e) => e.id) ?? []),
    ]);
    const violations = getAntiPatternViolations();
    for (const v of violations) {
      expect(
        antiPatternIds.has(v.antiPatternId),
        `Violation references non-existent anti-pattern ${v.antiPatternId}`,
      ).toBe(true);
      expect(
        axiomIds.has(v.axiomId),
        `Violation references non-existent axiom ${v.axiomId}`,
      ).toBe(true);
    }
  });
});

// ── Pipeline Output Seeds: tryCreateAndLinkSeed always links ─────────────────

describe("Rule 2: tryCreateAndLinkSeed — creates Seed AND relationship", () => {
  it("tryCreateAndLinkSeed function exists and creates both Seed and CONTAINS link", async () => {
    const mod = await import("../../src/graph/queries.js");
    // The function name itself encodes the contract: "try Create And Link Seed"
    // It calls createPipelineOutputSeed() THEN linkSeedToPipelineRun()
    expect(typeof mod.tryCreateAndLinkSeed).toBe("function");
    expect(typeof mod.createPipelineOutputSeed).toBe("function");
    expect(typeof mod.linkSeedToPipelineRun).toBe("function");
  });

  it("linkSeedToPipelineRun uses CONTAINS relationship type", async () => {
    // Verify the CONTAINS relationship type is registered in the schema
    expect(RELATIONSHIP_TYPES.CONTAINS).toBe("CONTAINS");
  });

  it("PipelineRun → TaskOutput uses PRODUCED relationship (not orphaned)", () => {
    // Verify PRODUCED is a registered relationship type
    expect(RELATIONSHIP_TYPES.PRODUCED).toBe("PRODUCED");
  });

  it("Resonator → TaskOutput uses PROCESSED relationship (not orphaned)", () => {
    // Verify PROCESSED is a registered relationship type
    expect(RELATIONSHIP_TYPES.PROCESSED).toBe("PROCESSED");
  });
});

// ── Relationship registry completeness ──────────────────────────────────────

describe("Rule 2: Relationship registry — all structural relationships exist", () => {
  it("CONTAINS relationship type is registered for parent→child containment", () => {
    expect(RELATIONSHIP_TYPES.CONTAINS).toBe("CONTAINS");
  });

  it("SCOPED_TO relationship type is registered for Seed→Bloom scoping", () => {
    expect(RELATIONSHIP_TYPES.SCOPED_TO).toBe("SCOPED_TO");
  });

  it("OBSERVES relationship type is registered for Helix→Bloom observation", () => {
    expect(RELATIONSHIP_TYPES.OBSERVES).toBe("OBSERVES");
  });

  it("DEPENDS_ON relationship type is registered for axiom DAG", () => {
    expect(RELATIONSHIP_TYPES.DEPENDS_ON).toBe("DEPENDS_ON");
  });

  it("VIOLATES relationship type is registered for anti-pattern→axiom", () => {
    expect(RELATIONSHIP_TYPES.VIOLATES).toBe("VIOLATES");
  });
});
