// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import {
  CORPUS_GRID_ID,
  ELIMINATED_ENTITIES,
  DETECTION_HEURISTICS,
  BRIDGE_VIEW_PRINCIPLE,
} from "../../scripts/bootstrap-compliance-corpus.js";
import type { EliminatedEntity, DetectionHeuristic } from "../../scripts/bootstrap-compliance-corpus.js";
import { getCategories, getAntiPatternViolations } from "../../scripts/bootstrap-grammar-reference.js";

// ── Corpus Grid Data Validation (no Neo4j required) ─────────────────────────

describe("Compliance Corpus — Grid Identity", () => {
  it("corpus Grid ID is grid:compliance-corpus", () => {
    expect(CORPUS_GRID_ID).toBe("grid:compliance-corpus");
  });
});

describe("Compliance Corpus — Grammar Seed Counts", () => {
  const categories = getCategories();

  it("axioms category has 8 elements (v5.0 — A5 removed)", () => {
    const axioms = categories.find((c) => c.id === "cat:axioms")!;
    expect(axioms.elements).toHaveLength(8);
  });

  it("grammar-rules category has 5 elements", () => {
    const rules = categories.find((c) => c.id === "cat:grammar-rules")!;
    expect(rules.elements).toHaveLength(5);
  });

  it("anti-patterns category has 10 canonical + 8 implementation incidents", () => {
    const canonical = categories.find((c) => c.id === "cat:anti-patterns")!;
    expect(canonical.elements).toHaveLength(10);
    const incidents = categories.find((c) => c.id === "cat:implementation-incidents")!;
    expect(incidents.elements).toHaveLength(8);
  });
});

describe("Compliance Corpus — Eliminated Entities", () => {
  it("has exactly 7 eliminated entities", () => {
    expect(ELIMINATED_ENTITIES).toHaveLength(7);
  });

  it("all eliminated entities have required fields", () => {
    for (const entity of ELIMINATED_ENTITIES) {
      expect(entity.id).toMatch(/^eliminated:/);
      expect(entity.name).toBeTruthy();
      expect(entity.deletedIn).toBeTruthy();
      expect(entity.reason).toBeTruthy();
    }
  });

  it("IDs are unique", () => {
    const ids = ELIMINATED_ENTITIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes Observer (ce0ef96)", () => {
    const observer = ELIMINATED_ENTITIES.find((e) => e.id === "eliminated:observer");
    expect(observer).toBeDefined();
    expect(observer!.deletedIn).toBe("ce0ef96");
  });

  it("includes Model Sentinel (M-8C)", () => {
    const sentinel = ELIMINATED_ENTITIES.find((e) => e.id === "eliminated:model-sentinel");
    expect(sentinel).toBeDefined();
    expect(sentinel!.deletedIn).toBe("M-8C");
  });

  it("includes Symbiosis axiom (v4.0)", () => {
    const symbiosis = ELIMINATED_ENTITIES.find((e) => e.id === "eliminated:symbiosis-axiom");
    expect(symbiosis).toBeDefined();
    expect(symbiosis!.deletedIn).toBe("v4.0");
  });

  it("EliminatedEntity type has correct shape", () => {
    const entity: EliminatedEntity = ELIMINATED_ENTITIES[0];
    expect(typeof entity.id).toBe("string");
    expect(typeof entity.name).toBe("string");
    expect(typeof entity.deletedIn).toBe("string");
    expect(typeof entity.reason).toBe("string");
  });
});

describe("Compliance Corpus — Bridge View Principle", () => {
  it("has correct ID", () => {
    expect(BRIDGE_VIEW_PRINCIPLE.id).toBe("rule:bridge-view-principle");
  });

  it("has seedType compliance-rule", () => {
    expect(BRIDGE_VIEW_PRINCIPLE.seedType).toBe("compliance-rule");
  });

  it("has name Bridge View Principle", () => {
    expect(BRIDGE_VIEW_PRINCIPLE.name).toBe("Bridge View Principle");
  });

  it("description mentions pure function of grammar-defined morpheme states", () => {
    expect(BRIDGE_VIEW_PRINCIPLE.description).toContain("pure function");
    expect(BRIDGE_VIEW_PRINCIPLE.description).toContain("grammar-defined morpheme states");
  });

  it("has status canonical", () => {
    expect(BRIDGE_VIEW_PRINCIPLE.status).toBe("canonical");
  });

  it("specSource references M-8A t15 analysis", () => {
    expect(BRIDGE_VIEW_PRINCIPLE.specSource).toContain("M-8A t15");
  });
});

describe("Compliance Corpus — Detection Heuristics", () => {
  it("has exactly 18 detection heuristics (one per anti-pattern)", () => {
    expect(DETECTION_HEURISTICS).toHaveLength(18);
  });

  it("all heuristics have required fields", () => {
    for (const h of DETECTION_HEURISTICS) {
      expect(h.antiPatternId).toMatch(/^ap:/);
      expect(h.detectionHeuristic).toBeTruthy();
      expect(h.detectionHeuristic.length).toBeGreaterThan(20);
    }
  });

  it("anti-pattern IDs are unique in heuristics", () => {
    const ids = DETECTION_HEURISTICS.map((h) => h.antiPatternId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every anti-pattern from grammar reference has a detection heuristic", () => {
    const categories = getCategories();
    const apIds = [
      ...categories.find((c) => c.id === "cat:anti-patterns")!.elements.map((e) => e.id),
      ...categories.find((c) => c.id === "cat:implementation-incidents")!.elements.map((e) => e.id),
    ];
    const heuristicIds = new Set(DETECTION_HEURISTICS.map((h) => h.antiPatternId));

    for (const apId of apIds) {
      expect(heuristicIds.has(apId)).toBe(true);
    }
  });

  it("shadow-system heuristic mentions state stores", () => {
    const h = DETECTION_HEURISTICS.find((h) => h.antiPatternId === "ap:shadow-system");
    expect(h).toBeDefined();
    expect(h!.detectionHeuristic).toContain("state");
  });

  it("dimensional-collapse heuristic mentions bare number", () => {
    const h = DETECTION_HEURISTICS.find((h) => h.antiPatternId === "ap:dimensional-collapse");
    expect(h).toBeDefined();
    expect(h!.detectionHeuristic).toContain("bare number");
  });

  it("DetectionHeuristic type has correct shape", () => {
    const h: DetectionHeuristic = DETECTION_HEURISTICS[0];
    expect(typeof h.antiPatternId).toBe("string");
    expect(typeof h.detectionHeuristic).toBe("string");
  });
});

describe("Compliance Corpus — Consistency Checks", () => {
  it("all heuristic anti-pattern IDs exist in grammar reference", () => {
    const categories = getCategories();
    const apIds = new Set([
      ...categories.find((c) => c.id === "cat:anti-patterns")!.elements.map((e) => e.id),
      ...categories.find((c) => c.id === "cat:implementation-incidents")!.elements.map((e) => e.id),
    ]);

    for (const h of DETECTION_HEURISTICS) {
      expect(apIds.has(h.antiPatternId)).toBe(true);
    }
  });

  it("eliminated entity IDs don't clash with existing grammar element IDs", () => {
    const categories = getCategories();
    const allIds = new Set(categories.flatMap((c) => c.elements.map((e) => e.id)));

    for (const entity of ELIMINATED_ENTITIES) {
      expect(allIds.has(entity.id)).toBe(false);
    }
  });

  it("Bridge View Principle ID doesn't clash with existing grammar rule IDs", () => {
    const categories = getCategories();
    const ruleIds = new Set(
      categories.find((c) => c.id === "cat:grammar-rules")!.elements.map((e) => e.id),
    );
    expect(ruleIds.has(BRIDGE_VIEW_PRINCIPLE.id)).toBe(false);
  });
});
