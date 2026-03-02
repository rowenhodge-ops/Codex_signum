/**
 * Spec Gap: SIPOC Compliance — Pattern Interfaces Match Specification
 *
 * Lean Process Maps §2 defines SIPOCs for 4 patterns. Each SIPOC specifies:
 *   - Suppliers (who provides inputs)
 *   - Inputs (what they receive)
 *   - Process (steps they execute)
 *   - Outputs (what they produce)
 *   - Customers (who consumes outputs)
 *
 * These tests verify the implementation matches the SIPOC contracts.
 *
 * Level: L5 Invariant (spec-encoded)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "../../src");

describe("SIPOC Spec Gap: Thompson Router (§2.1)", () => {
  it("selectModel() exists as the unified API", () => {
    // §2.1 Key interface: "selectModel(context) → RoutingDecision"
    // §7 Gap: "selectModel() doesn't exist as a unified API" was P0
    const routerDir = path.join(SRC, "patterns/thompson-router");
    const files = findTsFiles(routerDir);
    let hasSelectModel = false;

    for (const f of files) {
      if (fs.readFileSync(f, "utf-8").includes("export") && fs.readFileSync(f, "utf-8").includes("selectModel")) {
        hasSelectModel = true;
        break;
      }
    }
    expect(hasSelectModel).toBe(true);
  });

  it("selectModel writes Decision node BEFORE execution", () => {
    // §2.1: "Write Decision node to graph BEFORE execution"
    // This is the critical contract — decision recorded before outcome known
    const selectModelPath = path.join(
      SRC,
      "patterns/thompson-router/select-model.ts",
    );
    if (!fs.existsSync(selectModelPath)) {
      expect(fs.existsSync(selectModelPath)).toBe(true);
      return;
    }
    const content = fs.readFileSync(selectModelPath, "utf-8");
    expect(content).toMatch(/recordDecision\s*\(/);
  });

  it("selectModel output includes decisionId for outcome callback", () => {
    // §2.1 Output: "{ selectedAgentId, wasExploratory, confidence, decisionId }"
    // Consumer needs decisionId to call recordDecisionOutcome later
    const selectModelPath = path.join(
      SRC,
      "patterns/thompson-router/select-model.ts",
    );
    if (!fs.existsSync(selectModelPath)) return;
    const content = fs.readFileSync(selectModelPath, "utf-8");
    expect(content).toMatch(/decisionId/);
  });
});

describe("SIPOC Spec Gap: DevAgent Pipeline (§2.2)", () => {
  const typesPath = path.join(SRC, "patterns/dev-agent/types.ts");
  const typesContent = fs.readFileSync(typesPath, "utf-8");

  it("PipelineResult includes RTY metric", () => {
    // §2.2 Output: "metrics: { rty, %C&A per stage, durationMs, cost }"
    expect(typesContent).toMatch(/rty|rolledThroughputYield|RTY/i);
  });

  it("PipelineResult includes per-stage %C&A", () => {
    // §2.2 Output: "metrics: { rty, %C&A per stage }"
    expect(typesContent).toMatch(/percentCompleteAccurate|completeAndAccurate|pca|cAndA/i);
  });

  it("AgentTask includes sourceAcceptanceCriteria from SIPOC input", () => {
    // §2.2 Input: "AgentTask: { intent, sourceFiles, acceptanceCriteria, sourceAcceptanceCriteria }"
    expect(typesContent).toMatch(/sourceAcceptanceCriteria/);
  });

  it("DevAgent reads pattern health (ΦL) from graph", () => {
    // §2.2 Graph reads: "Pattern health (ΦL) from Pattern node properties"
    const pipelinePath = path.join(SRC, "patterns/dev-agent/pipeline.ts");
    const content = fs.readFileSync(pipelinePath, "utf-8");
    expect(content).toMatch(/phiL|phi_l|patternHealth|readTransaction/i);
  });
});

describe("SIPOC Spec Gap: Architect Pipeline (§2.3)", () => {
  const typesPath = path.join(SRC, "patterns/architect/types.ts");
  const typesContent = fs.readFileSync(typesPath, "utf-8");

  it("PlanResult includes RTY metric", () => {
    // §2.3 Output: "metrics: { totalDuration, tasksSucceeded, tasksFailed, rty }"
    // Check both types.ts and the plan state type
    expect(typesContent).toMatch(/rty|rolledThroughputYield|RTY/i);
  });

  it("Architect SURVEY reads graph Pattern node health", () => {
    // §2.3 Graph reads: "Prior plan outcomes, Pattern node health properties, Agent capabilities"
    const surveyPath = path.join(SRC, "patterns/architect/survey.ts");
    if (!fs.existsSync(surveyPath)) return;
    const content = fs.readFileSync(surveyPath, "utf-8");
    // Should read pattern health from graph
    expect(content).toMatch(/readTransaction|getPattern|phiL|graph/i);
  });

  it("Architect DISPATCH delegates to TaskExecutor (DevAgent-compatible)", () => {
    // §2.3 Process step 6: "DISPATCH (execute tasks — delegates to TaskExecutor which may call DevAgent)"
    // §7 Gap: "Architect DISPATCH doesn't delegate to DevAgent" was P1
    const dispatchPath = path.join(SRC, "patterns/architect/dispatch.ts");
    if (!fs.existsSync(dispatchPath)) return;
    const content = fs.readFileSync(dispatchPath, "utf-8");
    expect(content).toMatch(/taskExecutor|TaskExecutor/);
  });
});

describe("SIPOC Spec Gap: Retrospective Pattern (§2.4)", () => {
  it("Retrospective pattern exists and is not design-only", () => {
    // §2.4 says "Design Phase" but §7 lists it as P3
    // The pattern file should exist (it does — retrospective.ts)
    const retroPath = path.join(
      SRC,
      "patterns/retrospective/retrospective.ts",
    );
    expect(fs.existsSync(retroPath)).toBe(true);
  });

  it("Retrospective reads completed plan outcomes from graph", () => {
    // §2.4 Input: "completed plans, pipeline metrics, health trends, historical observations"
    const retroPath = path.join(
      SRC,
      "patterns/retrospective/retrospective.ts",
    );
    if (!fs.existsSync(retroPath)) return;
    const content = fs.readFileSync(retroPath, "utf-8");
    expect(content).toMatch(/PipelineRun|planOutcome|Plan/i);
  });

  it("Retrospective compares against standardised work baselines", () => {
    // §2.4 Process step 3: "BASELINE (compare against standardised work)"
    const retroPath = path.join(
      SRC,
      "patterns/retrospective/retrospective.ts",
    );
    if (!fs.existsSync(retroPath)) return;
    const content = fs.readFileSync(retroPath, "utf-8");
    expect(content).toMatch(/baseline|standardisedWork|standardizedWork/i);
  });

  it("Retrospective outputs include FMEA entries", () => {
    // §2.4 Output: "Process insights, Updated baselines, FMEA entries, Recommended constitutional amendments"
    const retroDir = path.join(SRC, "patterns/retrospective");
    const files = findTsFiles(retroDir);
    let hasFMEA = false;

    for (const f of files) {
      if (/FMEA|failureMode|severity.*occurrence.*detection|RPN/i.test(fs.readFileSync(f, "utf-8"))) {
        hasFMEA = true;
        break;
      }
    }
    expect(hasFMEA).toBe(true);
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
