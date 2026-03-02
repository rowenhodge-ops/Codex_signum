/**
 * Spec Gap: Learning Loop — Execute → Observe → Learn → Improve
 *
 * Lean Process Maps §3.2 "Learning Feedback Loop":
 *   "Execution completes → graph-feeder.afterPipeline() → conditionValue →
 *    MERGE Observation → computePhiL → SET pattern health → checkThreshold →
 *    recordDecisionOutcome → Thompson arms updated → better selection next time"
 *
 * CURRENT VIOLATION:
 *   The loop is broken at multiple points:
 *   1. DevAgent decisions never become Decision graph nodes
 *      → Thompson has no quality signal from DevAgent stage routing
 *   2. DevAgent observations never become Observation graph nodes
 *      → Retrospective has nothing to read
 *   3. No graph-feeder hook wires afterPipeline to graph writes
 *      → The entire "inline conditioning" path is unconnected
 *   4. Architect doesn't record plan-level Decision nodes
 *      → No learning from plan quality over time
 *
 * Level: L5 Invariant (spec-encoded)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "../../src");
const SCRIPTS = path.resolve(__dirname, "../../scripts");

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

describe("Learning Loop Spec Gap: DevAgent feeds Thompson posteriors", () => {
  const pipelinePath = path.join(SRC, "patterns/dev-agent/pipeline.ts");
  const pipelineContent = fs.readFileSync(pipelinePath, "utf-8");

  it("DevAgent calls recordDecisionOutcome after each stage", () => {
    // §3.2: "recordDecisionOutcome(decisionId, quality) → Thompson arm stats updated"
    // Current: attachOutcome() only modifies in-memory Decision object
    expect(pipelineContent).toMatch(/recordDecisionOutcome\s*\(/);
  });

  it("DevAgent uses selectModel() not raw route() for graph-integrated routing", () => {
    // §2.2 SIPOC: Thompson Router is a supplier to DevAgent
    // selectModel() writes Decision to graph BEFORE execution (§2.1)
    // route() is the in-memory-only function with no graph persistence
    const usesSelectModel = /selectModel\s*\(/.test(pipelineContent);
    const usesRawRoute = /\broute\s*\(/.test(pipelineContent);

    // Should use selectModel (graph-integrated), not raw route (in-memory only)
    expect(usesSelectModel).toBe(true);
    // If using raw route, that's the gap — decisions never reach graph
    if (usesRawRoute && !usesSelectModel) {
      expect(usesRawRoute).toBe(false);
    }
  });
});

describe("Learning Loop Spec Gap: Architect feeds graph-feeder", () => {
  const architectPath = path.join(SRC, "patterns/architect/architect.ts");
  const architectContent = fs.readFileSync(architectPath, "utf-8");

  it("Architect DECOMPOSE uses selectModel() for Thompson-integrated routing", () => {
    // §3.1: "DECOMPOSE calls → Thompson Router → selectModel() returns
    //  RoutingDecision + writes Decision node to graph"
    // Current: Architect delegates to ModelExecutor interface (consumer provides)
    // The spec says the core orchestrator should use selectModel()
    const usesSelectModel = /selectModel/.test(architectContent);
    expect(usesSelectModel).toBe(true);
  });

  it("Architect records plan-level outcomes to graph", () => {
    // §3.1: "Graph contains: complete execution trace (queryable via Cypher)"
    // Current: executePlan returns PlanState JS object, nothing persisted
    const writesToGraph =
      /writeTransaction|recordObservation|recordDecision/.test(
        architectContent,
      );
    expect(writesToGraph).toBe(true);
  });
});

describe("Learning Loop Spec Gap: graph-feeder afterPipeline hook exists", () => {
  it("a graph-feeder implementation exists that calls conditionValue + computePhiL inline", () => {
    // §3.2: "graph-feeder.afterPipeline() → conditionValue → computePhiL → SET pattern health"
    // This is the consumer-side hook. In the self-hosting case (scripts/),
    // there should be a graph-feeder that wires afterPipeline to graph writes.
    const allFiles = [
      ...findTsFiles(SRC),
      ...findTsFiles(SCRIPTS),
    ];

    let hasGraphFeeder = false;
    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (
        content.includes("afterPipeline") &&
        (content.includes("conditionValue") ||
          content.includes("writeObservation") ||
          content.includes("computePhiL"))
      ) {
        hasGraphFeeder = true;
        break;
      }
    }

    expect(hasGraphFeeder).toBe(true);
  });

  it("afterStage hook in some consumer calls recordObservation per stage", () => {
    // §2.2: "graph-feeder writes Observation nodes per stage"
    const allFiles = [
      ...findTsFiles(SRC),
      ...findTsFiles(SCRIPTS),
    ];

    let hasStageObservation = false;
    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (
        content.includes("afterStage") &&
        (content.includes("recordObservation") ||
          content.includes("writeObservation"))
      ) {
        hasStageObservation = true;
        break;
      }
    }

    expect(hasStageObservation).toBe(true);
  });
});

describe("Learning Loop Spec Gap: Retrospective can read DevAgent data", () => {
  it("retrospective queries Decision nodes that DevAgent creates", () => {
    // §2.4: Retrospective GATHERS from "completed plans, pipeline metrics,
    // health trends, historical observations — all already persisted by executing patterns"
    // But if DevAgent never writes Decision/Observation nodes, retrospective reads nothing.
    //
    // Test: the retrospective queries reference node types that DevAgent actually creates.
    const retroPath = path.join(
      SRC,
      "patterns/retrospective/retrospective.ts",
    );
    if (!fs.existsSync(retroPath)) {
      expect(fs.existsSync(retroPath)).toBe(true);
      return;
    }
    const retroContent = fs.readFileSync(retroPath, "utf-8");

    // Retrospective should query Decision nodes
    const queriesDecisions = /Decision|ROUTED_TO|decision/i.test(retroContent);
    // DevAgent should write those Decision nodes (checked in other test files)
    // This test just verifies the retrospective EXPECTS them
    expect(queriesDecisions).toBe(true);
  });
});
