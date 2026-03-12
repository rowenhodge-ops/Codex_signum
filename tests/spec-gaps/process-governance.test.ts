/**
 * Spec Gap: Process Governance — NFR-G1 through G8, RTY, %C&A, Poka-yoke
 *
 * Lean Process Maps §4.2 defines 8 non-functional requirements for graph integrity.
 * §5.1 defines measurable outcomes (RTY > 0.8, %C&A per stage).
 * OpEx Addendum §3 defines poka-yoke hierarchy and Jidoka mapping.
 *
 * Level: L5 Invariant (spec-encoded)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "../../src");

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

describe("NFR-G1: No orphaned Decision nodes", () => {
  it("a reconciliation function exists to mark abandoned decisions", () => {
    // §4.2 NFR-G1: "Orphaned decisions poison Thompson arm stats.
    //  Reconciliation: MATCH (d:Decision) WHERE d.outcome IS NULL
    //  AND d.createdAt < datetime() - duration('PT24H') SET d.outcome = 'ABANDONED'"
    const allFiles = findTsFiles(SRC);
    let hasReconciliation = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (/ABANDONED|orphan.*decision|reconcil.*decision/i.test(content)) {
        hasReconciliation = true;
        break;
      }
    }
    expect(hasReconciliation).toBe(true);
  });
});

describe("NFR-G3: Every Observation has a source pattern", () => {
  it("recordObservation enforces source pattern link", () => {
    // §4.2 NFR-G3: "Observation nodes MUST link to their source Pattern via [:OBSERVED_BY]"
    const queriesPath = path.join(SRC, "graph/queries.ts");
    const content = fs.readFileSync(queriesPath, "utf-8");
    expect(content).toMatch(/OBSERVED_BY|OBSERVED_IN/);
  });
});

describe("NFR-G4: Decision → Observation chain complete", () => {
  it("Decision outcome recording creates corresponding Observation", () => {
    // §4.2 NFR-G4: "If a Decision node exists, there MUST be a corresponding Observation"
    // This means recordDecisionOutcome should also create an Observation node
    // OR the consumer should create both in the same transaction
    const allFiles = findTsFiles(SRC);
    let hasChainedWrite = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (
        content.includes("recordDecisionOutcome") &&
        (content.includes("recordObservation") || content.includes("writeObservation"))
      ) {
        hasChainedWrite = true;
        break;
      }
    }
    expect(hasChainedWrite).toBe(true);
  });
});

describe("NFR-G5: Pattern nodes carry conditioned health only", () => {
  it("updateBloomPhiL writes conditioned (not raw) values", () => {
    // §4.2 NFR-G5: "Pattern node health properties are ALWAYS the output
    //  of inline conditioning functions"
    // writeObservation calls conditionValue → computePhiL → updateBloomPhiL
    // This chain ensures conditioning happens inline
    const writeObsPath = path.join(SRC, "graph/write-observation.ts");
    if (!fs.existsSync(writeObsPath)) {
      expect(fs.existsSync(writeObsPath)).toBe(true);
      return;
    }
    const content = fs.readFileSync(writeObsPath, "utf-8");

    // Must call conditionValue before updating health
    expect(content).toMatch(/conditionValue/);
    expect(content).toMatch(/computePhiL/);
    expect(content).toMatch(/updateBloomPhiL/);
  });
});

describe("NFR-G8: Schema convergence — single schema", () => {
  it("no legacy Execution/Model/Stage node types in schema", () => {
    // §4.2 NFR-G8: "DND-Manager's legacy schema (Execution, Model, Stage nodes)
    //  must be migrated to Codex schema"
    const schemaPath = path.join(SRC, "graph/schema.ts");
    const content = fs.readFileSync(schemaPath, "utf-8");

    // Should not reference legacy node types
    expect(content).not.toMatch(/:Execution\b/);
    expect(content).not.toMatch(/:Model\b/);
    expect(content).not.toMatch(/:Stage\b/);
  });
});

describe("Process Governance Spec Gap: RTY measurement exists", () => {
  it("RTY (Rolled Throughput Yield) is computed somewhere in src/", () => {
    // §5.1 UC-1: "RTY > 0.8, zero rework loops beyond refinement helix"
    // There should be a function that computes RTY from stage %C&A
    const allFiles = findTsFiles(SRC);
    let hasRTY = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (/computeRTY|rolledThroughputYield|rty.*=.*product|rty.*reduce/i.test(content)) {
        hasRTY = true;
        break;
      }
    }
    expect(hasRTY).toBe(true);
  });

  it("%C&A (Percent Complete and Accurate) is tracked per stage", () => {
    // §5.1: "%C&A per stage" is a key measurable
    const allFiles = findTsFiles(SRC);
    let hasPCA = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (/percentComplete|completeAndAccurate|%C&A|pca.*stage/i.test(content)) {
        hasPCA = true;
        break;
      }
    }
    expect(hasPCA).toBe(true);
  });
});

describe("Process Governance Spec Gap: Poka-yoke hierarchy", () => {
  it("poka-yoke taxonomy implemented (prevention > detection > warning)", () => {
    // OpEx Addendum §3: "Poka-yoke taxonomy: prevention > detection > warning"
    // Prevention = schema validation (compile-time type checks)
    // Detection = REVIEW stage validation
    // Warning = degradation alerts
    // There should be explicit poka-yoke classification somewhere
    const allFiles = findTsFiles(SRC);
    let hasPokayoke = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (/poka.?yoke|prevention.*detection.*warning|error.*prevention/i.test(content)) {
        hasPokayoke = true;
        break;
      }
    }
    expect(hasPokayoke).toBe(true);
  });
});

describe("Process Governance Spec Gap: PipelineRun node type", () => {
  it("PipelineRun node type exists in graph schema", () => {
    // §4.1: "PipelineRun: graph-feeder (inline, after pipeline completes)"
    // This node should exist in the schema
    const schemaPath = path.join(SRC, "graph/schema.ts");
    const content = fs.readFileSync(schemaPath, "utf-8");
    expect(content).toMatch(/PipelineRun/);
  });

  it("PipelineRun creation query exists in graph/queries.ts", () => {
    const queriesPath = path.join(SRC, "graph/queries.ts");
    const content = fs.readFileSync(queriesPath, "utf-8");
    expect(content).toMatch(/PipelineRun|pipelineRun/);
  });
});

describe("Process Governance Spec Gap: HumanFeedback node type", () => {
  it("HumanFeedback node type exists in graph schema", () => {
    // §4.1: "HumanFeedback: Human (via feedback CLI, writes directly to graph)"
    const schemaPath = path.join(SRC, "graph/schema.ts");
    const content = fs.readFileSync(schemaPath, "utf-8");
    expect(content).toMatch(/HumanFeedback/);
  });

  it("HumanFeedback creation query exists in graph/queries.ts", () => {
    // §5.1 UC-5: "CLI writes HumanFeedback node directly to graph"
    const queriesPath = path.join(SRC, "graph/queries.ts");
    const content = fs.readFileSync(queriesPath, "utf-8");
    expect(content).toMatch(/HumanFeedback/);
  });
});
