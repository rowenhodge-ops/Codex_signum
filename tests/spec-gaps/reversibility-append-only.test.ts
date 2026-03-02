/**
 * Spec Gap: A7 Reversibility — Pipeline Output Must Be Append-Only Graph Events
 *
 * Codex v3.0 A7: "State changes must be reversible. History is preserved,
 *   not overwritten."
 *
 * Engineering Bridge: Uses CREATE (not MERGE) for events. ThresholdEvents,
 *   Observations, and Decisions are append-only — you can always walk back
 *   through the event history.
 *
 * CURRENT VIOLATION:
 *   bootstrap-task-executor.ts writes pipeline output to:
 *     docs/pipeline-output/<runId>/<taskId>.md
 *     docs/pipeline-output/<runId>/_manifest.json
 *
 *   These are filesystem files, not graph events. They can be deleted,
 *   overwritten, or corrupted. They have no ORIGINATED_FROM or
 *   THRESHOLD_CROSSED_BY relationships. They are not reversible
 *   in any structural sense.
 *
 *   The manifest JSON pattern (writeFileSync with JSON.stringify)
 *   is exactly the "JSON state writes" anti-pattern from the codebase rules.
 *
 * THESE TESTS WILL FAIL. They encode what the spec requires.
 *
 * Level: L5 Invariant (spec-encoded)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const SCRIPTS = path.join(ROOT, "scripts");

describe("A7 Spec Gap: Pipeline output must be graph events, not filesystem files", () => {
  it("bootstrap-task-executor.ts does not use writeFileSync for state", () => {
    const executorPath = path.join(SCRIPTS, "bootstrap-task-executor.ts");
    if (!fs.existsSync(executorPath)) {
      // File must exist for the pipeline to function
      expect(fs.existsSync(executorPath)).toBe(true);
      return;
    }

    const content = fs.readFileSync(executorPath, "utf-8");

    // writeFileSync for pipeline output = mutable filesystem state
    // Spec requires: append-only graph events (CREATE, not file writes)
    const hasWriteFileSync = /writeFileSync\s*\(/.test(content);
    expect(hasWriteFileSync).toBe(false);
  });

  it("no pattern file in src/ uses writeFileSync", () => {
    const patternsDir = path.join(ROOT, "src/patterns");
    const files = findTsFiles(patternsDir);

    const violations: string[] = [];
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (/writeFileSync\s*\(/.test(content)) {
        violations.push(path.relative(ROOT, filePath));
      }
    }

    expect(violations).toEqual([]);
  });

  it("pipeline output directory pattern does not exist in source code", () => {
    // docs/pipeline-output/ is a shadow state store — spec says state is structural
    // If the code references this path, it's routing state outside the graph
    const executorPath = path.join(SCRIPTS, "bootstrap-task-executor.ts");
    if (!fs.existsSync(executorPath)) return;

    const content = fs.readFileSync(executorPath, "utf-8");

    // Should not reference a filesystem output directory for pipeline state
    const hasPipelineOutputDir = /pipeline-output/.test(content);
    expect(hasPipelineOutputDir).toBe(false);
  });
});

describe("A7 Spec Gap: Manifest files are not graph events", () => {
  it("no script creates _manifest.json files", () => {
    const scriptFiles = findTsFiles(SCRIPTS);

    const violations: string[] = [];
    for (const filePath of scriptFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (/_manifest\.json/.test(content) && /writeFileSync|writeFile/.test(content)) {
        violations.push(path.relative(ROOT, filePath));
      }
    }

    // Spec requires: execution manifests should be graph nodes
    // (e.g., PipelineRun node with relationships to Decision and Observation nodes)
    expect(violations).toEqual([]);
  });

  it("task outputs are recorded as graph Observations, not .md files", () => {
    const executorPath = path.join(SCRIPTS, "bootstrap-task-executor.ts");
    if (!fs.existsSync(executorPath)) return;

    const content = fs.readFileSync(executorPath, "utf-8");

    // Writing .md files for task output = filesystem state
    const writesMarkdownFiles = /\.md['"`].*writeFileSync|writeFileSync.*\.md['"`]/.test(content);
    const usesGraphObservation = /recordObservation|writeObservation/.test(content);

    expect(writesMarkdownFiles).toBe(false);
    expect(usesGraphObservation).toBe(true);
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
