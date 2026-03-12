/**
 * Spec Gap: Morpheme Lifecycle — All 6 Types Must Be Creatable and Persistable
 *
 * Codex v3.0 defines 6 morphemes: Seed (•), Line (→), Bloom (○),
 * Resonator (Δ), Grid (□), Helix (🌀).
 *
 * CURRENT STATE:
 *   - Seed: type ✓, creation ✓, graph persistence ✓, schema ✓
 *   - Bloom: type ✓, creation ✓, graph persistence ✓, schema ✓
 *   - Line: type ✓, creation ✗, persistence ✗, schema ✗
 *   - Resonator: type ✓, creation ✗, persistence ✗, schema constraint only
 *   - Grid: type ✓, creation ✗, persistence ✗, schema constraint only
 *   - Helix: type ✓, creation ✗, persistence ✗, schema constraint only
 *
 * Lean Process Maps §1: "Each [pattern] is a Bloom (○) in Codex terms"
 *   Thompson Router is Resonator (Δ), DevAgent uses Helix (🌀)
 *
 * Level: L5 Invariant (spec-encoded)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "../../src");
const queriesPath = path.join(SRC, "graph/queries.ts");
const queriesContent = fs.readFileSync(queriesPath, "utf-8");
const schemaPath = path.join(SRC, "graph/schema.ts");
const schemaContent = fs.readFileSync(schemaPath, "utf-8");

describe("Morpheme Spec Gap: Line (→) has full lifecycle", () => {
  it("createLine() function exists in graph/queries.ts", () => {
    expect(queriesContent).toMatch(/export\s+(async\s+)?function\s+createLine/);
  });

  it("Line nodes have a uniqueness constraint in schema", () => {
    expect(schemaContent).toMatch(/line.*unique|Line.*UNIQUE/i);
  });

  it("Line creation uses proper Cypher CREATE", () => {
    expect(queriesContent).toMatch(/CREATE\s*\(.*:Line/);
  });
});

describe("Morpheme Spec Gap: Resonator (Δ) has full lifecycle", () => {
  it("createResonator() function exists in graph/queries.ts", () => {
    // §1: Thompson Router IS a Resonator
    expect(queriesContent).toMatch(
      /export\s+(async\s+)?function\s+createResonator/,
    );
  });

  it("Resonator creation uses proper Cypher CREATE", () => {
    expect(queriesContent).toMatch(/CREATE\s*\(.*:Resonator/);
  });

  it("Resonator has indexes beyond just uniqueness constraint", () => {
    // Seed and Bloom have multiple indexes. Resonator has only a constraint.
    expect(schemaContent).toMatch(/INDEX.*resonator|resonator.*INDEX/i);
  });
});

describe("Morpheme Spec Gap: Grid (□) has full lifecycle", () => {
  it("createGrid() function exists in graph/queries.ts", () => {
    // Lean Process Maps §2.4: Retrospective writes baselines to Grid nodes
    expect(queriesContent).toMatch(
      /export\s+(async\s+)?function\s+createGrid/,
    );
  });

  it("Grid creation uses proper Cypher CREATE", () => {
    expect(queriesContent).toMatch(/CREATE\s*\(.*:Grid/);
  });

  it("Grid has indexes beyond just uniqueness constraint", () => {
    expect(schemaContent).toMatch(/INDEX.*grid|grid.*INDEX/i);
  });
});

describe("Morpheme Spec Gap: Helix (🌀) has full lifecycle", () => {
  it("createHelix() function exists in graph/queries.ts", () => {
    // §1: DevAgent uses Helix for refinement/learning loops
    expect(queriesContent).toMatch(
      /export\s+(async\s+)?function\s+createHelix/,
    );
  });

  it("Helix creation uses proper Cypher CREATE", () => {
    expect(queriesContent).toMatch(/CREATE\s*\(.*:Helix/);
  });

  it("Helix has indexes beyond just uniqueness constraint", () => {
    expect(schemaContent).toMatch(/INDEX.*helix|helix.*INDEX/i);
  });
});

describe("Morpheme Spec Gap: State transitions are validated", () => {
  it("IntegrationState transitions are enforced (not arbitrary SET)", () => {
    // morphemes.ts defines: created → dormant → connected → active → [degraded → recovering | archived]
    // Currently: updateBloomState(id, state) accepts arbitrary state string
    // Spec requires: illegal transitions rejected (e.g., archived → active)
    const allFiles = findTsFiles(SRC);
    let hasTransitionValidation = false;

    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (
        /validTransition|legalTransition|allowedTransition|TRANSITION_MAP/.test(
          content,
        )
      ) {
        hasTransitionValidation = true;
        break;
      }
    }

    expect(hasTransitionValidation).toBe(true);
  });

  it("Seed maturation path exists (Seed → connected → active via Lines)", () => {
    // The spec lifecycle: created → dormant → connected (Lines attach) → active
    // There should be a function that transitions a Seed when Lines form
    const allFiles = findTsFiles(SRC);
    let hasMaturationPath = false;

    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (
        /matureSeed|activateSeed|connectSeed|seedMaturation/.test(content) ||
        (/Seed/.test(content) &&
          /connected|dormant/.test(content) &&
          /transition|promote|mature/.test(content))
      ) {
        hasMaturationPath = true;
        break;
      }
    }

    expect(hasMaturationPath).toBe(true);
  });
});

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findTsFiles(fullPath));
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts"))
      results.push(fullPath);
  }
  return results;
}
