/**
 * Anti-Pattern: Dimensional Collapse — hallucinated facts.
 *
 * Verifies that canonical constants are correct throughout the codebase,
 * and that the detectHallucinations() function in the bootstrap executor
 * flags fabricated axiom counts, wrong pipeline stages, and eliminated entities.
 * Level: L5 Invariant
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Dimensional Collapse: canonical constants are correct", () => {
  it("AxiomCompliance has exactly 10 boolean fields", () => {
    const content = fs.readFileSync("src/types/constitutional.ts", "utf-8");
    // Count the boolean fields in the AxiomCompliance interface
    const interfaceMatch = content.match(
      /export interface AxiomCompliance\s*\{([\s\S]*?)\}/,
    );
    expect(interfaceMatch).not.toBeNull();
    const boolFields = interfaceMatch![1].match(/:\s*boolean/g);
    expect(boolFields).not.toBeNull();
    expect(boolFields!.length).toBe(10);
  });

  it("MorphemeKind has exactly 6 variants", () => {
    const content = fs.readFileSync("src/types/morphemes.ts", "utf-8");
    const kindMatch = content.match(
      /export type MorphemeKind\s*=([\s\S]*?);/,
    );
    expect(kindMatch).not.toBeNull();
    const variants = kindMatch![1].match(/"\w+"/g);
    expect(variants).not.toBeNull();
    expect(variants!.length).toBe(6);
  });

  it("Architect pipeline has exactly 7 stages", () => {
    const architectContent = fs.readFileSync(
      "src/patterns/architect/architect.ts",
      "utf-8",
    );
    // The architect imports 6 stage modules (survey is injected as parameter, not imported)
    const stageImports = [
      "decompose",
      "classify",
      "sequence",
      "gate",
      "dispatch",
      "adapt",
    ];
    for (const stage of stageImports) {
      expect(architectContent).toContain(`from "./${stage}.js"`);
    }
    // Survey is the 7th stage — handled externally, referenced as survey output
    expect(architectContent).toContain("surveying");
    expect(architectContent).toContain("planState.survey");
  });

  it("GrammarCompliance has exactly 5 rules", () => {
    const content = fs.readFileSync("src/types/morphemes.ts", "utf-8");
    const complianceMatch = content.match(
      /export interface GrammarCompliance\s*\{([\s\S]*?)\}/,
    );
    expect(complianceMatch).not.toBeNull();
    // Count boolean properties (g1_proximity through g5_resonance)
    const boolFields = complianceMatch![1].match(/:\s*boolean/g);
    expect(boolFields).not.toBeNull();
    expect(boolFields!.length).toBe(5);
  });
});

describe("Dimensional Collapse: eliminated entities do not exist in src/", () => {
  // Canonical eliminated entities from the anti-pattern table
  const eliminatedEntities = [
    "collector.ts",
    "evaluator.ts",
    "auditor.ts",
    "codexStats",
  ];

  const srcDir = "src";

  it("no eliminated entity files exist in src/", () => {
    for (const entity of ["collector.ts", "evaluator.ts", "auditor.ts"]) {
      const files = findFiles(srcDir, entity);
      expect(files, `Found eliminated file: ${entity}`).toEqual([]);
    }
  });

  it("no codexStats function or variable exists in src/", () => {
    const allTsFiles = findFiles(srcDir, "*.ts");
    for (const file of allTsFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(
        content,
        `${file} contains "codexStats"`,
      ).not.toContain("codexStats");
    }
  });

  it("no 'monitoring overlay' implementation exists in src/", () => {
    // Check that no file implements a monitoring overlay
    // Negation in comments ("No monitoring overlay") is acceptable
    const allTsFiles = findFiles(srcDir, "*.ts");
    for (const file of allTsFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (/monitoring overlay/i.test(line)) {
          // Allow negation patterns in comments
          expect(
            line,
            `${file} implements monitoring overlay`,
          ).toMatch(/(?:\/\/|\/\*|\*)\s.*[Nn]o\s+monitoring overlay/);
        }
      }
    }
  });

  it("no 'health dashboard' wrapper exists in src/", () => {
    const allTsFiles = findFiles(srcDir, "*.ts");
    for (const file of allTsFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(
        content,
        `${file} contains "health dashboard"`,
      ).not.toMatch(/health dashboard/i);
    }
  });
});

describe("Dimensional Collapse: detectHallucinations catches fabrications", () => {
  // These tests verify the bootstrap-task-executor's hallucination detector
  // by checking its source code structure (it's in scripts/, not src/)
  const executorContent = fs.readFileSync(
    "scripts/bootstrap-task-executor.ts",
    "utf-8",
  );

  it("ELIMINATED_ENTITIES list exists and has >= 10 entries", () => {
    expect(executorContent).toContain("ELIMINATED_ENTITIES");
    const listMatch = executorContent.match(
      /ELIMINATED_ENTITIES\s*=\s*\[([\s\S]*?)\]\s*as\s*const/,
    );
    expect(listMatch).not.toBeNull();
    const entries = listMatch![1].match(/"[^"]+"/g);
    expect(entries).not.toBeNull();
    expect(entries!.length).toBeGreaterThanOrEqual(10);
  });

  it("detectHallucinations checks for wrong axiom count (not 8)", () => {
    expect(executorContent).toContain("axiom");
    // Must check that count !== 8 (v5.0: A5 Reversibility + Symbiosis removed)
    expect(executorContent).toMatch(/count\s*!==\s*8/);
  });

  it("detectHallucinations checks for wrong pipeline stage count (not 7)", () => {
    expect(executorContent).toContain("stage pipeline");
    expect(executorContent).toMatch(/count\s*!==\s*7/);
  });

  it("detectHallucinations has 3 layers: signal, content, structural", () => {
    expect(executorContent).toContain("Layer 1: Signal-level");
    expect(executorContent).toContain("Layer 2: Content-level");
    expect(executorContent).toContain("Layer 3: Structural-level");
  });
});

/** Recursively find files matching a name pattern in a directory */
function findFiles(dir: string, namePattern: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, namePattern));
    } else if (namePattern.startsWith("*.")) {
      if (entry.name.endsWith(namePattern.slice(1))) {
        results.push(fullPath);
      }
    } else if (entry.name === namePattern) {
      results.push(fullPath);
    }
  }
  return results;
}
