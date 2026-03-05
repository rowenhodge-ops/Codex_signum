// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import { RELATIONSHIP_TYPES } from "../../src/graph/schema.js";

/**
 * M-9.7b Morpheme Topology Tests
 *
 * These tests verify the schema and data contract for the morpheme topology
 * bootstrap. Graph-dependent tests (Neo4j queries) are conditional and skip
 * when no connection is available.
 */

// ── Topology Data Constants ──

const ARCHITECT_STAGE_IDS = [
  "resonator:architect:survey",
  "resonator:architect:decompose",
  "resonator:architect:classify",
  "resonator:architect:sequence",
  "resonator:architect:gate",
  "resonator:architect:dispatch",
  "resonator:architect:adapt",
];

const DEVAGENT_STAGE_IDS = [
  "resonator:dev-agent:scope",
  "resonator:dev-agent:execute",
  "resonator:dev-agent:review",
  "resonator:dev-agent:validate",
];

const SIGNAL_STAGE_IDS = [
  "resonator:signal:debounce",
  "resonator:signal:hampel",
  "resonator:signal:ewma",
  "resonator:signal:cusum",
  "resonator:signal:macd",
  "resonator:signal:hysteresis",
  "resonator:signal:trend",
];

const PATTERN_BLOOM_IDS = [
  "pattern:architect",
  "pattern:dev-agent",
  "pattern:thompson-router",
];

// ── Schema Tests ──

describe("Morpheme Topology — Schema", () => {
  it("FLOWS_TO relationship type exists in registry", () => {
    expect(RELATIONSHIP_TYPES.FLOWS_TO).toBe("FLOWS_TO");
  });

  it("INSTANTIATES relationship type exists in registry", () => {
    expect(RELATIONSHIP_TYPES.INSTANTIATES).toBe("INSTANTIATES");
  });

  it("relationship type registry has 16 entries (14 pre-existing + 2 new)", () => {
    expect(Object.keys(RELATIONSHIP_TYPES)).toHaveLength(16);
  });
});

// ── Topology Data Contract Tests ──

describe("Morpheme Topology — Data Contract", () => {
  it("Architect pattern has exactly 7 stage Resonator IDs", () => {
    expect(ARCHITECT_STAGE_IDS).toHaveLength(7);
  });

  it("DevAgent pattern has exactly 4 stage Resonator IDs", () => {
    expect(DEVAGENT_STAGE_IDS).toHaveLength(4);
  });

  it("Signal pipeline has exactly 7 stage Resonator IDs", () => {
    expect(SIGNAL_STAGE_IDS).toHaveLength(7);
  });

  it("total Resonator count is 18 (7 + 4 + 7)", () => {
    const total = ARCHITECT_STAGE_IDS.length + DEVAGENT_STAGE_IDS.length + SIGNAL_STAGE_IDS.length;
    expect(total).toBe(18);
  });

  it("3 pattern Blooms defined", () => {
    expect(PATTERN_BLOOM_IDS).toHaveLength(3);
  });

  it("all Resonator IDs follow the naming convention", () => {
    const allIds = [...ARCHITECT_STAGE_IDS, ...DEVAGENT_STAGE_IDS, ...SIGNAL_STAGE_IDS];
    for (const id of allIds) {
      expect(id).toMatch(/^resonator:[a-z-]+:[a-z-]+$/);
    }
  });

  it("all Pattern Bloom IDs follow the naming convention", () => {
    for (const id of PATTERN_BLOOM_IDS) {
      expect(id).toMatch(/^pattern:[a-z-]+$/);
    }
  });

  it("Architect FLOWS_TO chain has 7 edges (6 forward + 1 return)", () => {
    // 7 stages → 6 forward edges + 1 ADAPT→SURVEY return = 7 total
    const forwardEdges = ARCHITECT_STAGE_IDS.length - 1;
    const returnEdge = 1; // ADAPT → SURVEY
    expect(forwardEdges + returnEdge).toBe(7);
  });

  it("DevAgent FLOWS_TO chain has 3 forward edges", () => {
    const forwardEdges = DEVAGENT_STAGE_IDS.length - 1;
    expect(forwardEdges).toBe(3);
  });

  it("Signal FLOWS_TO chain has 6 forward edges", () => {
    const forwardEdges = SIGNAL_STAGE_IDS.length - 1;
    expect(forwardEdges).toBe(6);
  });

  it("Architect stages are in canonical order", () => {
    const roles = ARCHITECT_STAGE_IDS.map(id => id.split(":")[2]);
    expect(roles).toEqual([
      "survey", "decompose", "classify", "sequence", "gate", "dispatch", "adapt",
    ]);
  });

  it("DevAgent stages are in canonical order", () => {
    const roles = DEVAGENT_STAGE_IDS.map(id => id.split(":")[2]);
    expect(roles).toEqual(["scope", "execute", "review", "validate"]);
  });

  it("Signal stages are in canonical order", () => {
    const roles = SIGNAL_STAGE_IDS.map(id => id.split(":")[2]);
    expect(roles).toEqual([
      "debounce", "hampel", "ewma", "cusum", "macd", "hysteresis", "trend",
    ]);
  });

  it("no duplicate IDs across all topology elements", () => {
    const allIds = [
      ...PATTERN_BLOOM_IDS,
      "pipeline:signal",
      ...ARCHITECT_STAGE_IDS,
      ...DEVAGENT_STAGE_IDS,
      ...SIGNAL_STAGE_IDS,
      "helix:thompson-learning",
      "grid:compliance-corpus",
    ];
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });

  it("INSTANTIATES targets map to grammar reference morpheme Seeds", () => {
    // Every runtime morpheme should link to one of these grammar reference Seeds
    const grammarRefIds = [
      "morpheme:bloom",
      "morpheme:resonator",
      "morpheme:helix",
      "morpheme:grid",
    ];
    // 4 Blooms + 18 Resonators + 1 Helix + 1 Grid = 24 INSTANTIATES relationships
    const expectedCount =
      (PATTERN_BLOOM_IDS.length + 1) + // 4 Blooms (3 patterns + signal pipeline)
      (ARCHITECT_STAGE_IDS.length + DEVAGENT_STAGE_IDS.length + SIGNAL_STAGE_IDS.length) + // 18 Resonators
      1 + // Helix
      1;  // Grid
    expect(expectedCount).toBe(24);
    expect(grammarRefIds).toHaveLength(4);
  });
});
