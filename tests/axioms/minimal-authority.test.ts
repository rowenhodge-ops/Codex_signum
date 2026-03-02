/**
 * A5. Minimal Authority — Patterns request only declared dependencies.
 *
 * Tests that pattern stages use only explicit inputs, not ambient global state.
 * Level: L2 Contract
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("A5 Minimal Authority: Architect stages import only declared modules", () => {
  const architectDir = path.resolve("src/patterns/architect");

  const stageFiles = [
    "survey.ts",
    "decompose.ts",
    "classify.ts",
    "sequence.ts",
    "gate.ts",
    "dispatch.ts",
    "adapt.ts",
  ];

  // Forbidden imports for core library pattern stages
  // Forbidden imports for core library pattern stages
  // NOTE: survey.ts legitimately uses node:child_process (execSync for git)
  // and node:fs (filesystem scanning). These are declared dependencies for SURVEY.
  const forbiddenImports = [
    "neo4j-driver", // Stages should not directly import Neo4j
    "node:net",
    "node:http",
    "@anthropic-ai",
    "openai",
    "google-auth",
  ];

  // survey.ts has additional permitted imports (filesystem + git)
  const surveyPermitted = ["node:child_process", "node:fs", "node:path"];

  for (const file of stageFiles) {
    it(`${file} does not import forbidden ambient dependencies`, () => {
      const filePath = path.join(architectDir, file);
      if (!fs.existsSync(filePath)) return; // Some stages may not exist yet
      const content = fs.readFileSync(filePath, "utf-8");
      for (const forbidden of forbiddenImports) {
        expect(content).not.toContain(`from "${forbidden}`);
        expect(content).not.toContain(`from '${forbidden}`);
        expect(content).not.toContain(`require("${forbidden}`);
      }
    });
  }
});

describe("A5 Minimal Authority: Thompson router takes explicit inputs", () => {
  it("route() signature requires explicit arms and context — no global state", () => {
    const routerPath = path.resolve("src/patterns/thompson-router/router.ts");
    const content = fs.readFileSync(routerPath, "utf-8");
    // route function takes context, models, armStats, decisionCount, config
    expect(content).toMatch(/export\s+function\s+route\s*\(/);
    // Must not import or reference any global/module-level state maps
    expect(content).not.toContain("globalStats");
    expect(content).not.toContain("moduleState");
  });
});

describe("A5 Minimal Authority: DevAgent stages receive explicit inputs", () => {
  const pipelinePath = path.resolve("src/patterns/dev-agent/pipeline.ts");

  it("DevAgent.runStage() takes explicit stage, input, task, decisions — no hidden queries", () => {
    const content = fs.readFileSync(pipelinePath, "utf-8");
    // runStage has explicit parameters
    expect(content).toMatch(/runStage\s*\(\s*stage/);
    // No direct Neo4j imports
    expect(content).not.toContain('from "neo4j-driver"');
  });
});
