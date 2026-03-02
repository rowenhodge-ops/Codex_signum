/**
 * Spec Gap: A6 Provenance — Every Decision Must Have a Graph-Persisted Trail
 *
 * Codex v3.0 A6: "Every transformation must carry its provenance —
 *   the origin, the reasoning, and the evidence that justified it."
 *
 * Engineering Bridge: Decision nodes carry ROUTED_TO (which Seed),
 *   ORIGINATED_FROM (which Bloom), IN_CONTEXT (which cluster).
 *   These relationships form the provenance trail.
 *
 * CURRENT VIOLATION:
 *   DevAgent's decisions use createDecision() which produces a JS object
 *   with {id, selected, reason, madeByBloomId} — but these fields never
 *   become graph properties. The provenance exists only in ephemeral memory.
 *
 *   Only selectModel() (Thompson router) calls recordDecision() which
 *   creates the Decision → ROUTED_TO → Seed → ORIGINATED_FROM → Bloom chain.
 *   The DevAgent and Architect bypass this entirely.
 *
 * THESE TESTS WILL FAIL. They encode what the spec requires.
 *
 * Level: L5 Invariant (spec-encoded)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "../../src");

describe("A6 Spec Gap: All pattern decisions must create graph provenance trails", () => {
  it("every call to createDecision() in patterns/ is paired with recordDecision()", () => {
    // Find all files in src/patterns/ that call createDecision()
    const patternsDir = path.join(SRC, "patterns");
    const patternFiles = findTsFiles(patternsDir);

    const violations: string[] = [];

    for (const filePath of patternFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const callsCreate = content.includes("createDecision(");
      const callsRecord = content.includes("recordDecision(");

      if (callsCreate && !callsRecord) {
        violations.push(path.relative(SRC, filePath));
      }
    }

    // Spec requires: every createDecision must be accompanied by recordDecision
    // Current violations: patterns/dev-agent/pipeline.ts
    expect(violations).toEqual([]);
  });

  it("every call to createObservation() in patterns/ is paired with a graph write", () => {
    const patternsDir = path.join(SRC, "patterns");
    const patternFiles = findTsFiles(patternsDir);

    const violations: string[] = [];

    for (const filePath of patternFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const callsCreate = content.includes("createObservation(");
      const callsGraphWrite =
        content.includes("recordObservation(") ||
        content.includes("writeObservation(") ||
        content.includes("writeTransaction(");

      if (callsCreate && !callsGraphWrite) {
        violations.push(path.relative(SRC, filePath));
      }
    }

    expect(violations).toEqual([]);
  });

  it("architect executePlan() records ORIGINATED_FROM provenance for each stage", () => {
    // Each architect stage that makes a decision should record which Bloom
    // originated the decision (A6 provenance chain)
    const architectPath = path.join(SRC, "patterns/architect/architect.ts");
    const content = fs.readFileSync(architectPath, "utf-8");

    // Must use recordDecision which creates ORIGINATED_FROM relationship
    expect(content).toMatch(/ORIGINATED_FROM|recordDecision/);
  });
});

describe("A6 Spec Gap: DevAgent decisions carry provenance to the graph", () => {
  const pipelinePath = path.join(SRC, "patterns/dev-agent/pipeline.ts");
  const pipelineContent = fs.readFileSync(pipelinePath, "utf-8");

  it("decisions include contextClusterId for graph provenance", () => {
    // recordDecision() requires contextClusterId to create IN_CONTEXT relationship
    // createDecision() has no concept of context clusters — it's pure memory
    // The DevAgent should build a clusterId and pass it to recordDecision()
    expect(pipelineContent).toMatch(/contextClusterId/);
  });

  it("decision outcomes are recorded via recordDecisionOutcome()", () => {
    // After execution, the outcome (success, quality, duration) must be
    // SET on the Decision node in the graph — not just attached in memory
    // Current state: uses attachOutcome() which returns a new JS object
    expect(pipelineContent).toMatch(/recordDecisionOutcome\s*\(/);
  });
});

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}
