/**
 * Spec Gap: Constitutional Evaluation Results Must Be Persisted
 *
 * Lean Process Maps §4.1: "ConstitutionalRule: Bootstrap / Amendment process"
 * OpEx Addendum §3: "ADRs for governance changes"
 *
 * CURRENT VIOLATION:
 *   - evaluateConstitution() is called by DevAgent (pipeline.ts:108) but the
 *     ConstitutionalEvaluation result lives in PipelineResult.constitutionalCompliance
 *     and is never written to the graph
 *   - createADR() creates ArchitectureDecisionRecord objects — never persisted
 *   - Amendment lifecycle (evolution.ts) manages state transitions but
 *     Amendment objects are never graph nodes
 *   - Constitutional evaluation should GATE decisions — does the DevAgent
 *     actually block on blocker-tier violations?
 *
 * Level: L5 Invariant (spec-encoded)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "../../src");

describe("Constitutional Spec Gap: Evaluation results reach the graph", () => {
  const pipelinePath = path.join(SRC, "patterns/dev-agent/pipeline.ts");
  const pipelineContent = fs.readFileSync(pipelinePath, "utf-8");

  it("DevAgent writes ConstitutionalEvaluation to graph after evaluation", () => {
    // pipeline.ts calls evaluateConstitution() at line ~108
    // The result goes into PipelineResult.constitutionalCompliance (JS object)
    // Spec requires: evaluation result persisted as graph node
    const writesEvaluation =
      /recordConstitutionalEvaluation|writeTransaction.*constitutional/i.test(
        pipelineContent,
      );
    expect(writesEvaluation).toBe(true);
  });

  it("DevAgent blocks pipeline on Tier 1 (blocker) constitutional violations", () => {
    // OpEx Addendum §3: Tier 1 = blockers (mandatory)
    // If evaluateConstitution returns blockers, pipeline should abort
    const checksBlockers =
      /blocker|tier.*1|mandatory.*violation|compliance\.passed\s*===\s*false/i.test(
        pipelineContent,
      );
    expect(checksBlockers).toBe(true);
  });
});

describe("Constitutional Spec Gap: Amendment lifecycle persists to graph", () => {
  const evolutionPath = path.join(SRC, "constitutional/evolution.ts");
  const evolutionContent = fs.readFileSync(evolutionPath, "utf-8");

  it("evolution.ts imports from graph/ for persistence", () => {
    // Amendments should be graph nodes (ConstitutionalRule node type in §4.1)
    expect(evolutionContent).toMatch(/from\s+["'].*graph/);
  });

  it("proposeAmendment writes Amendment node to graph", () => {
    expect(evolutionContent).toMatch(
      /writeTransaction|recordAmendment|CREATE.*Amendment/,
    );
  });

  it("transitionAmendment updates Amendment node in graph", () => {
    expect(evolutionContent).toMatch(
      /writeTransaction|updateAmendment|SET.*Amendment/,
    );
  });
});

describe("Constitutional Spec Gap: ADRs are persisted", () => {
  const enginePath = path.join(SRC, "constitutional/engine.ts");
  if (!fs.existsSync(enginePath)) return;
  const engineContent = fs.readFileSync(enginePath, "utf-8");

  it("createADR() result is written to graph somewhere in src/", () => {
    // Search all src/ files for code that calls createADR AND writes result
    const srcFiles = findTsFiles(SRC);
    let hasPersistedADR = false;

    for (const filePath of srcFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (
        content.includes("createADR(") &&
        (content.includes("writeTransaction") ||
          content.includes("recordADR"))
      ) {
        hasPersistedADR = true;
        break;
      }
    }

    expect(hasPersistedADR).toBe(true);
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
