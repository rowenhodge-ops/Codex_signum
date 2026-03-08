// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * L5 Invariant — Graph-Native Data Creation Rule 3: Containment Direction
 *
 * "Containment is parent → child. Always."
 * "(parent)-[:CONTAINS]->(child) ✅"
 * "(child)-[:PART_OF]->(parent) ❌ NEVER"
 * "(child)-[:BELONGS_TO]->(parent) ❌ NEVER"
 *
 * This test performs static analysis of the codebase to verify:
 * 1. PART_OF and BELONGS_TO relationship types do not exist anywhere
 * 2. All CONTAINS relationships in the schema registry use parent→child
 * 3. The RELATIONSHIP_TYPES registry does not include reverse containment
 *
 * Source: CLAUDE.md §Graph-Native Data Creation — Rule 3
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { RELATIONSHIP_TYPES } from "../../src/graph/schema.js";

// ── Helper: recursively collect .ts files ────────────────────────────────────

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory() && entry !== "node_modules" && entry !== "dist" && entry !== ".git") {
          results.push(...collectTsFiles(fullPath));
        } else if (stat.isFile() && (entry.endsWith(".ts") || entry.endsWith(".js")) && !entry.endsWith(".d.ts")) {
          results.push(fullPath);
        }
      } catch {
        // Skip inaccessible entries
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return results;
}

// ── Registry Enforcement: PART_OF and BELONGS_TO must not exist ──────────────

describe("Rule 3: RELATIONSHIP_TYPES registry — no reverse containment", () => {
  const allTypes = Object.values(RELATIONSHIP_TYPES);

  it("PART_OF is not a registered relationship type", () => {
    expect(allTypes).not.toContain("PART_OF");
  });

  it("BELONGS_TO is not a registered relationship type", () => {
    expect(allTypes).not.toContain("BELONGS_TO");
  });

  it("CONTAINS is the only containment relationship type", () => {
    // Only one relationship type should encode containment semantics
    const containmentTypes = allTypes.filter(
      (t) => t === "CONTAINS" || t === "PART_OF" || t === "BELONGS_TO" || t === "MEMBER_OF",
    );
    expect(containmentTypes).toEqual(["CONTAINS"]);
  });

  it("CONTAINS is registered as a string constant", () => {
    expect(RELATIONSHIP_TYPES.CONTAINS).toBe("CONTAINS");
    expect(typeof RELATIONSHIP_TYPES.CONTAINS).toBe("string");
  });
});

// ── Static Analysis: no PART_OF or BELONGS_TO in source code ─────────────────

describe("Rule 3: Source code — no PART_OF or BELONGS_TO anywhere", () => {
  const srcFiles = collectTsFiles(join(process.cwd(), "src"));
  const scriptFiles = collectTsFiles(join(process.cwd(), "scripts"));
  const allFiles = [...srcFiles, ...scriptFiles];

  it("found source files to scan", () => {
    expect(allFiles.length).toBeGreaterThan(10);
  });

  it("no source file contains PART_OF as a relationship type", () => {
    const violations: string[] = [];
    for (const file of allFiles) {
      const content = readFileSync(file, "utf-8");
      // Match PART_OF used as a relationship type in Cypher or constants
      // Exclude: comments documenting the anti-pattern, test files
      if (content.includes("PART_OF") && !file.includes("test")) {
        // Check if it's in a comment or in actual code
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (
            line.includes("PART_OF") &&
            !line.trimStart().startsWith("//") &&
            !line.trimStart().startsWith("*") &&
            !line.trimStart().startsWith("/*")
          ) {
            violations.push(`${file}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }
    expect(
      violations,
      `PART_OF found in source code (Rule 3 violation):\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("no source file contains BELONGS_TO as a relationship type", () => {
    const violations: string[] = [];
    for (const file of allFiles) {
      const content = readFileSync(file, "utf-8");
      if (content.includes("BELONGS_TO") && !file.includes("test")) {
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (
            line.includes("BELONGS_TO") &&
            !line.trimStart().startsWith("//") &&
            !line.trimStart().startsWith("*") &&
            !line.trimStart().startsWith("/*")
          ) {
            violations.push(`${file}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }
    expect(
      violations,
      `BELONGS_TO found in source code (Rule 3 violation):\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});

// ── CONTAINS direction in Cypher queries ─────────────────────────────────────

describe("Rule 3: Cypher queries — CONTAINS arrow direction is always parent→child", () => {
  // Read all query module files to verify all CONTAINS usage
  const queriesDir = join(process.cwd(), "src", "graph", "queries");
  const queriesContent = readdirSync(queriesDir)
    .filter((f: string) => f.endsWith(".ts"))
    .map((f: string) => readFileSync(join(queriesDir, f), "utf-8"))
    .join("\n");

  it("all CONTAINS Cypher patterns use forward arrow (->)", () => {
    const lines = queriesContent.split("\n");
    const containsLines: Array<{ lineNum: number; content: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Find lines with CONTAINS in Cypher context (backtick strings or template literals)
      if (line.includes("CONTAINS") && !line.trimStart().startsWith("//") && !line.trimStart().startsWith("*")) {
        containsLines.push({ lineNum: i + 1, content: line.trim() });
      }
    }

    // At least some CONTAINS usage should exist
    expect(containsLines.length).toBeGreaterThan(0);

    // Check for reverse arrows: <-[:CONTAINS]- would be child→parent (WRONG)
    const reverseArrows = containsLines.filter(
      (l) => l.content.includes("<-[:CONTAINS]-") || l.content.includes("<-[r:CONTAINS]-"),
    );
    expect(
      reverseArrows,
      `Reverse CONTAINS arrows found (Rule 3 violation):\n${reverseArrows.map((l) => `  L${l.lineNum}: ${l.content}`).join("\n")}`,
    ).toHaveLength(0);
  });

  it("no Cypher creates (child)-[:CONTAINS]->(parent) reverse pattern", () => {
    // The bootstrap scripts also create CONTAINS — check them too
    const ecosystemContent = readFileSync(
      join(process.cwd(), "scripts", "bootstrap-ecosystem.ts"),
      "utf-8",
    );
    const grammarContent = readFileSync(
      join(process.cwd(), "scripts", "bootstrap-grammar-reference.ts"),
      "utf-8",
    );

    for (const [name, content] of [
      ["queries.ts", queriesContent],
      ["bootstrap-ecosystem.ts", ecosystemContent],
      ["bootstrap-grammar-reference.ts", grammarContent],
    ]) {
      // Check: no reverse CONTAINS arrows in Cypher
      const reversePattern = /<-\[:.*CONTAINS.*\]-/;
      const lines = content.split("\n");
      const violations: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (reversePattern.test(lines[i])) {
          violations.push(`${name}:${i + 1}: ${lines[i].trim()}`);
        }
      }
      expect(
        violations,
        `Reverse CONTAINS in ${name}:\n${violations.join("\n")}`,
      ).toHaveLength(0);
    }
  });
});

// ── Ecosystem bootstrap: CONTAINS always goes parent→child ───────────────────

describe("Rule 3: Ecosystem bootstrap — createContainsRelationship(parentId, childId)", () => {
  it("createContainsRelationship function is exported", async () => {
    const mod = await import("../../scripts/bootstrap-ecosystem.js");
    expect(typeof mod.createContainsRelationship).toBe("function");
  });

  it("function signature names parameters as parentId, childId (semantic enforcement)", () => {
    // Read the source to verify parameter names encode the semantic direction
    const content = readFileSync(
      join(process.cwd(), "scripts", "bootstrap-ecosystem.ts"),
      "utf-8",
    );
    expect(content).toContain("async function createContainsRelationship(");
    expect(content).toContain("parentId: string");
    expect(content).toContain("childId: string");
    // Verify the Cypher uses parent on the left of the arrow
    expect(content).toContain("parent:Bloom {id: $parentId}");
  });
});
