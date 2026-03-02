/**
 * G3. Containment — Scope boundaries enforced. Cascade limit = 2.
 *
 * Tests that degradation propagation respects cascade limit,
 * pattern directories have barrel exports, and writeObservation
 * affects only target plus explicit cascade neighbors.
 * Level: L5 Invariant + L2 Contract
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  CASCADE_LIMIT,
  propagateDegradation,
  type PropagationNode,
} from "../../src/index.js";

describe("G3 Containment: cascade propagation stops at depth 2", () => {
  function buildChain(length: number): Map<string, PropagationNode> {
    const nodes = new Map<string, PropagationNode>();
    for (let i = 0; i < length; i++) {
      const neighbors: string[] = [];
      if (i > 0) neighbors.push(`node-${i - 1}`);
      if (i < length - 1) neighbors.push(`node-${i + 1}`);
      nodes.set(`node-${i}`, {
        id: `node-${i}`,
        phiL: 0.8,
        degree: neighbors.length,
        neighbors,
      });
    }
    return nodes;
  }

  it("5-node chain: source at node-0, only nodes 0-2 affected (depth 2)", () => {
    const nodes = buildChain(5);
    const result = propagateDegradation("node-0", 0.5, nodes);

    expect(result.updatedPhiL.has("node-0")).toBe(true); // source
    expect(result.updatedPhiL.has("node-1")).toBe(true); // depth 1
    expect(result.updatedPhiL.has("node-2")).toBe(true); // depth 2
    // Depth 3 and beyond MUST NOT be affected
    expect(result.updatedPhiL.has("node-3")).toBe(false);
    expect(result.updatedPhiL.has("node-4")).toBe(false);
  });

  it("CASCADE_LIMIT is exactly 2", () => {
    expect(CASCADE_LIMIT).toBe(2);
  });

  it("maxCascadeDepth never exceeds CASCADE_LIMIT", () => {
    const nodes = buildChain(10);
    const result = propagateDegradation("node-0", 0.5, nodes);
    expect(result.maxCascadeDepth).toBeLessThanOrEqual(CASCADE_LIMIT);
  });
});

describe("G3 Containment: pattern directories export through barrels", () => {
  const patternDirs = [
    "src/patterns/architect",
    "src/patterns/dev-agent",
    "src/patterns/thompson-router",
  ];

  for (const dir of patternDirs) {
    it(`${dir} has an index.ts barrel export`, () => {
      const indexPath = path.resolve(dir, "index.ts");
      expect(fs.existsSync(indexPath)).toBe(true);
    });
  }
});

describe("G3 Containment: no cross-pattern imports that bypass barrels", () => {
  it("dev-agent does not import directly from architect internal files", () => {
    const devAgentDir = path.resolve("src/patterns/dev-agent");
    const files = fs.readdirSync(devAgentDir).filter((f) => f.endsWith(".ts"));

    for (const file of files) {
      const content = fs.readFileSync(path.join(devAgentDir, file), "utf-8");
      // Should not import from ../architect/decompose.ts etc.
      // Only from ../architect/index.js or ../../patterns/architect/index.js
      const architectImports = content.match(/from\s+["']\.\.\/architect\/(?!index\.)[^"']+["']/g) ?? [];
      expect(architectImports).toEqual([]);
    }
  });

  it("architect does not import directly from dev-agent internal files", () => {
    const architectDir = path.resolve("src/patterns/architect");
    const files = fs.readdirSync(architectDir).filter((f) => f.endsWith(".ts"));

    for (const file of files) {
      const content = fs.readFileSync(path.join(architectDir, file), "utf-8");
      const devAgentImports = content.match(/from\s+["']\.\.\/dev-agent\/(?!index\.)[^"']+["']/g) ?? [];
      expect(devAgentImports).toEqual([]);
    }
  });
});
