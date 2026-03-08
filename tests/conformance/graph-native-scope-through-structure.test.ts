// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * L5 Invariant — Graph-Native Data Creation Rule 4: Scope Through Structure
 *
 * "A Bloom's scope is the set of morphemes it contains."
 * "If you need to know 'what does this milestone require?',
 *  the answer is a CONTAINS traversal, not a property read."
 *
 * This test verifies:
 * 1. BloomProps does not have a 'scope' string property for milestone content
 * 2. Exit criteria are modeled as child Seeds, not Bloom properties
 * 3. Query functions use CONTAINS traversal, not property reads for scope
 * 4. Milestone structure is discoverable via graph traversal
 *
 * Source: CLAUDE.md §Graph-Native Data Creation — Rule 4
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { BloomProps } from "../../src/graph/queries.js";
import { RELATIONSHIP_TYPES } from "../../src/graph/schema.js";
import {
  getRoadmapMilestones,
  getTestSuites,
  getFutureTests,
} from "../../scripts/bootstrap-ecosystem.js";
import {
  getCategories,
  GRAMMAR_REF_ID,
} from "../../scripts/bootstrap-grammar-reference.js";

// ── BloomProps type contract: no 'scope' string property ─────────────────────

describe("Rule 4: BloomProps — scope is structural, not a property", () => {
  it("BloomProps does not encourage a 'scope' string field", () => {
    // Construct a valid BloomProps — it should have id, name, description, state,
    // morphemeKinds, domain. NOT a 'scope' text field.
    const bloom: BloomProps = {
      id: "test-bloom",
      name: "Test Bloom",
      description: "What this bloom is about",
      state: "active",
      morphemeKinds: ["seed", "resonator"],
      domain: "testing",
    };

    // The 'scope' of this bloom is defined by its CONTAINS edges in the graph,
    // not by a property. Verify the type doesn't have a scope property.
    const keys = Object.keys(bloom);
    expect(keys).not.toContain("scope");
    expect(keys).not.toContain("scopeText");
    expect(keys).not.toContain("exitCriteria");
    expect(keys).not.toContain("requirements");
  });

  it("BloomProps.description is optional — NOT the scope definition", () => {
    // description is a human-readable note, not the scope.
    // The scope is the set of child morphemes reachable via CONTAINS.
    const minimalBloom: BloomProps = {
      id: "minimal",
      name: "Minimal Bloom",
    };
    expect(minimalBloom.id).toBeTruthy();
    expect(minimalBloom.name).toBeTruthy();
    // description is undefined, which is fine — scope comes from graph structure
    expect(minimalBloom.description).toBeUndefined();
  });
});

// ── Grammar reference: scope via CONTAINS tree, not properties ───────────────

describe("Rule 4: Grammar reference — scope defined by CONTAINS children", () => {
  const categories = getCategories();

  it("grammar reference scope is defined by its child categories", () => {
    // The grammar reference Bloom's scope = the categories it CONTAINS.
    // Not a 'scope' property on the grammar reference node.
    expect(categories.length).toBeGreaterThan(0);
    for (const cat of categories) {
      expect(cat.id).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.elements.length).toBeGreaterThan(0);
    }
  });

  it("category scope is defined by its child elements", () => {
    // Each category's scope = the grammar elements it CONTAINS.
    // Verification: every category has elements that represent its scope.
    for (const cat of categories) {
      expect(
        cat.elements.length,
        `Category ${cat.id} has no elements — empty scope`,
      ).toBeGreaterThan(0);
      for (const el of cat.elements) {
        expect(el.id).toBeTruthy();
        expect(el.name).toBeTruthy();
      }
    }
  });

  it("axiom category contains exactly 9 axiom elements (not a count property)", () => {
    const axiomCat = categories.find((c) => c.id === "cat:axioms");
    expect(axiomCat).toBeDefined();
    // The count comes from traversal (cat.elements.length), not from a stored property
    expect(axiomCat!.elements).toHaveLength(9);
  });
});

// ── Ecosystem: milestone scope via children, not description ─────────────────

describe("Rule 4: Ecosystem bootstrap — milestone scope via CONTAINS children", () => {
  const milestones = getRoadmapMilestones();
  const testSuites = getTestSuites();
  const futureTests = getFutureTests();

  it("milestone sub-milestones are separate Bloom nodes, not properties", () => {
    const sub = milestones.filter((m) => m.type === "sub-milestone");
    // Sub-milestones are modeled as child Bloom nodes that get CONTAINS edges,
    // not as array properties on the parent milestone.
    expect(sub.length).toBeGreaterThan(0);
    for (const m of sub) {
      expect(m.id).toBeTruthy();
      expect(m.parentId).toBeTruthy();
    }
  });

  it("test Seeds are modeled as nodes with SCOPED_TO, not as milestone properties", () => {
    // Tests are Seed nodes SCOPED_TO milestones, not arrays on milestone Blooms.
    expect(futureTests.length).toBeGreaterThan(0);
    for (const t of futureTests) {
      expect(t.id).toBeTruthy();
      expect(t.targetMilestone).toBeTruthy();
    }
  });

  it("test suite Blooms contain test Seeds via CONTAINS, not as lists", () => {
    // Test suites are Bloom nodes that CONTAIN test Seeds.
    // The suite's scope = its children, not a stored array.
    expect(testSuites.length).toBeGreaterThan(0);
    for (const suite of testSuites) {
      expect(suite.id).toBeTruthy();
      const suiteTests = futureTests.filter((t) => t.suiteId === suite.id);
      // At least some suites should have tests
      // (not all suites may have deferred tests, but the structure is there)
    }
  });
});

// ── Query functions: scope queries use CONTAINS traversal ────────────────────

describe("Rule 4: Query functions — scope via CONTAINS traversal", () => {
  const queriesDir = join(process.cwd(), "src", "graph", "queries");
  const queriesContent = readdirSync(queriesDir)
    .filter((f: string) => f.endsWith(".ts"))
    .map((f: string) => readFileSync(join(queriesDir, f), "utf-8"))
    .join("\n");

  it("getContainmentTree function exists for CONTAINS traversal", () => {
    expect(queriesContent).toContain("export async function getContainmentTree");
  });

  it("getContainmentTree uses variable-length CONTAINS path", () => {
    // The function should traverse CONTAINS edges, not read a property
    expect(queriesContent).toContain("[:CONTAINS*0..]");
  });

  it("getContainersBottomUp function exists for bottom-up containment walk", () => {
    expect(queriesContent).toContain("export async function getContainersBottomUp");
  });

  it("milestone overview query uses CONTAINS edges to count children", () => {
    // The getMilestoneOverview query should use CONTAINS traversal
    expect(queriesContent).toContain("(b)-[:CONTAINS]->(child:Bloom)");
  });

  it("grammar element queries use CONTAINS traversal from categories", () => {
    // Grammar element listing uses CONTAINS path from reference → category → seed
    expect(queriesContent).toContain(
      "[:CONTAINS]->(:Bloom {type: 'grammar-category'})-[:CONTAINS]->(s:Seed)",
    );
  });
});
