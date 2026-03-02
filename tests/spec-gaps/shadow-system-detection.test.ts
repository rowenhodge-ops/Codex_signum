/**
 * Spec Gap: Shadow System — No Parallel State Outside the Graph
 *
 * CLAUDE.md: "The graph is the single source of truth. Do NOT create:
 *   - Separate health databases or JSON caches
 *   - Log files as state stores
 *   - Any parallel state outside the graph"
 *
 * Codex v3.0 §State Is Structural: The graph IS the monitoring
 *   infrastructure. Observations flow through execution, not through
 *   a separate instrumentation layer.
 *
 * CURRENT VIOLATION:
 *   docs/pipeline-output/ is a filesystem-based state store:
 *     - _manifest.json contains per-task model/duration/status
 *     - <taskId>.md files contain execution output
 *     - These parallel the Decision/Observation graph nodes that SHOULD exist
 *
 *   This is the textbook Shadow System anti-pattern: query the graph
 *   (or in this case, skip the graph entirely), transform the result,
 *   and store/present it separately.
 *
 *   The DevAgent's EphemeralStore is another shadow system — it accumulates
 *   stage results in an in-memory map that is never persisted to the graph.
 *
 * THESE TESTS WILL FAIL. They encode what the spec requires.
 *
 * Level: L5 Invariant (spec-encoded)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "src");
const SCRIPTS = path.join(ROOT, "scripts");

describe("Shadow System Spec Gap: No filesystem state stores in pipeline", () => {
  it("scripts/ does not create output directories for pipeline state", () => {
    const scriptFiles = findTsFiles(SCRIPTS);

    const violations: string[] = [];
    for (const filePath of scriptFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      // mkdirSync + pipeline-output anywhere in the same file = filesystem state store
      if (/mkdirSync/.test(content) && /pipeline-output/.test(content)) {
        violations.push(path.relative(ROOT, filePath));
      }
    }

    expect(violations).toEqual([]);
  });

  it("scripts/ does not use JSON.stringify + writeFileSync for manifests", () => {
    const scriptFiles = findTsFiles(SCRIPTS);

    const violations: string[] = [];
    for (const filePath of scriptFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (
        /JSON\.stringify/.test(content) &&
        /writeFileSync/.test(content) &&
        /manifest|_manifest/.test(content)
      ) {
        violations.push(path.relative(ROOT, filePath));
      }
    }

    // Pipeline manifests should be graph nodes, not JSON files
    expect(violations).toEqual([]);
  });
});

describe("Shadow System Spec Gap: DevAgent state reaches the graph", () => {
  const pipelinePath = path.join(SRC, "patterns/dev-agent/pipeline.ts");
  const pipelineContent = fs.readFileSync(pipelinePath, "utf-8");

  it("DevAgent does not rely solely on EphemeralStore for decision state", () => {
    // EphemeralStore is an in-memory map — it's not the graph
    // DevAgent should write decisions to the graph, not just memory.add()
    const usesEphemeralStore = /this\.memory\.add\(/.test(pipelineContent);
    const usesGraphWrite =
      /recordDecision|recordObservation|writeTransaction|writeObservation/.test(
        pipelineContent,
      );

    // It's fine to use EphemeralStore for working memory, but it MUST ALSO
    // write to the graph for persistence (A4) and provenance (A6)
    if (usesEphemeralStore) {
      expect(usesGraphWrite).toBe(true);
    }
  });

  it("DevAgent stage results are not just array pushes", () => {
    // Current: stages.push(stageResult) → JS array → PipelineResult → consumer
    // Spec: each stage result should become an Observation in the graph
    // with OBSERVED_IN relationship to the pattern Bloom
    const usesGraphObservation =
      /recordObservation|writeObservation/.test(pipelineContent);

    expect(usesGraphObservation).toBe(true);
  });
});

describe("Shadow System Spec Gap: Architect state reaches the graph", () => {
  const architectPath = path.join(SRC, "patterns/architect/architect.ts");
  const architectContent = fs.readFileSync(architectPath, "utf-8");

  it("executePlan() writes stage transitions to the graph", () => {
    // Currently: planState.status = "decomposing" (JS assignment)
    // Spec: each status transition should be a graph event
    const writesStatus =
      /writeTransaction|recordObservation|writeObservation/.test(
        architectContent,
      );

    expect(writesStatus).toBe(true);
  });

  it("executePlan() does not accumulate all state in a single JS object", () => {
    // Current: everything lives in `planState: PlanState` — a JS object
    // returned to the caller. If the process crashes, all state is lost.
    // Spec: state should be in the graph, recoverable after crashes
    const importsGraph = /from\s+["'].*graph/.test(architectContent);

    expect(importsGraph).toBe(true);
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
