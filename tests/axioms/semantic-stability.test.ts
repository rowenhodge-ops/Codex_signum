/**
 * A8. Semantic Stability — Morpheme types unchanged. Composition extends, never mutates.
 *
 * Tests that deprecated aliases exist, barrel exports only grow, and
 * core type interfaces maintain stable shapes.
 * Level: L2 Contract + L5 Invariant
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";

describe("A8 Semantic Stability: backward-compat aliases for M-7C renames", () => {
  it("barrel exports both new and deprecated names for Agent→Seed rename", () => {
    const indexContent = fs.readFileSync("src/index.ts", "utf-8");
    // New name
    expect(indexContent).toContain("bootstrapSeeds");
    // Deprecated alias
    expect(indexContent).toContain("bootstrapAgents");
  });

  it("barrel exports both new and deprecated names for Pattern→Bloom rename", () => {
    const indexContent = fs.readFileSync("src/index.ts", "utf-8");
    // New name
    expect(indexContent).toContain("bootstrapBlooms");
    // Deprecated alias
    expect(indexContent).toContain("bootstrapPatterns");
  });

  it("barrel exports both CORE_BLOOMS and CORE_PATTERNS", () => {
    const indexContent = fs.readFileSync("src/index.ts", "utf-8");
    expect(indexContent).toContain("CORE_BLOOMS");
    expect(indexContent).toContain("CORE_PATTERNS");
  });
});

describe("A8 Semantic Stability: migrateToMorphemeLabels preserves data", () => {
  it("migration function exists and renames labels (not deletes+recreates)", () => {
    const schemaContent = fs.readFileSync("src/graph/schema.ts", "utf-8");
    expect(schemaContent).toContain("migrateToMorphemeLabels");
    // Uses SET n:NewLabel REMOVE n:OldLabel — preserves node identity
    expect(schemaContent).toContain("SET n:");
    expect(schemaContent).toContain("REMOVE n:");
  });
});

describe("A8 Semantic Stability: core type interfaces have stable shapes", () => {
  const stateTypesContent = fs.readFileSync("src/types/state-dimensions.ts", "utf-8");

  it("PhiL has all required composite fields", () => {
    expect(stateTypesContent).toContain("factors: PhiLFactors");
    expect(stateTypesContent).toContain("weights: PhiLWeights");
    expect(stateTypesContent).toContain("raw: number");
    expect(stateTypesContent).toContain("maturityFactor: number");
    expect(stateTypesContent).toContain("effective: number");
    expect(stateTypesContent).toContain("trend: PhiLTrend");
    expect(stateTypesContent).toContain("observationCount: number");
    expect(stateTypesContent).toContain("connectionCount: number");
    expect(stateTypesContent).toContain("computedAt: Date");
  });

  it("PsiH has all required composite fields", () => {
    expect(stateTypesContent).toContain("lambda2: number");
    expect(stateTypesContent).toContain("friction: number");
    expect(stateTypesContent).toContain("combined: number");
    expect(stateTypesContent).toContain("computedAt: Date");
  });

  it("EpsilonR has all required composite fields", () => {
    expect(stateTypesContent).toContain("value: number");
    expect(stateTypesContent).toContain("range: EpsilonRRange");
    expect(stateTypesContent).toContain("exploratoryDecisions: number");
    expect(stateTypesContent).toContain("totalDecisions: number");
    expect(stateTypesContent).toContain("floor: number");
  });
});

describe("A8 Semantic Stability: morpheme types are immutable", () => {
  const morphemeContent = fs.readFileSync("src/types/morphemes.ts", "utf-8");

  it("exactly 6 morpheme kinds (cannot add or remove without spec change)", () => {
    const kinds = morphemeContent.match(/"(seed|line|bloom|resonator|grid|helix)"/g) ?? [];
    const uniqueKinds = new Set(kinds.map((k) => k.replace(/"/g, "")));
    expect(uniqueKinds.size).toBe(6);
  });

  it("GrammarCompliance has exactly 5 grammar rules (G1-G5)", () => {
    const grammarRules = morphemeContent.match(/G\d_\w+:\s*boolean/g) ?? [];
    expect(grammarRules.length).toBe(5);
  });
});
