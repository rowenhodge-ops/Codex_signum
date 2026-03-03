// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  readFileContext,
  MAX_TOTAL_CONTEXT_CHARS,
} from "../../scripts/bootstrap-task-executor.js";
import { getDirectoryListing } from "../../src/patterns/architect/decompose-prompt.js";
import { validateFilePaths } from "../../src/patterns/architect/decompose.js";
import type { Task, TaskGraph } from "../../src/patterns/architect/types.js";

// ── Helpers ──────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    task_id: "t1",
    title: "Test task",
    description: "A test task",
    acceptance_criteria: ["criterion"],
    type: "generative",
    phase: "phase_1",
    estimated_complexity: "medium",
    files_affected: [],
    specification_refs: [],
    verification: "npx tsc --noEmit",
    commit_message: "test",
    ...overrides,
  };
}

// ── Temp directory for filesystem tests ─────────────────────────────────

let tempDir: string;

beforeAll(() => {
  tempDir = mkdtempSync(join(tmpdir(), "codex-test-"));

  // Create a fake repo structure
  mkdirSync(join(tempDir, "src"), { recursive: true });
  mkdirSync(join(tempDir, "docs", "specs"), { recursive: true });
  mkdirSync(join(tempDir, "docs", "research"), { recursive: true });

  writeFileSync(join(tempDir, "src", "index.ts"), "export {};", "utf-8");
  writeFileSync(join(tempDir, "src", "phi-l.ts"), "// phi-l computation\n".repeat(100), "utf-8");
  writeFileSync(
    join(tempDir, "docs", "specs", "codex-v3.md"),
    "# Codex v3\n" + "Content line.\n".repeat(3000), // ~42KB (fits within 48K cap)
    "utf-8",
  );
  writeFileSync(
    join(tempDir, "docs", "specs", "large-spec.md"),
    "# Large Spec\n" + "x".repeat(55000), // ~55KB (exceeds 48K cap)
    "utf-8",
  );
  writeFileSync(
    join(tempDir, "docs", "research", "safety.md"),
    "# Safety Analysis\nSome content.",
    "utf-8",
  );
});

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ── readFileContext tests ────────────────────────────────────────────────

describe("readFileContext (FR-10)", () => {
  it("uses higher char cap (48K) for analytical (generative) tasks", () => {
    const task = makeTask({
      type: "generative",
      files_affected: ["docs/specs/codex-v3.md"],
    });

    const context = readFileContext(task, tempDir);

    // The file is ~42KB. With 48K cap, it fits entirely (no truncation).
    expect(context).toContain("--- File: docs/specs/codex-v3.md ---");
    // 42KB < 48K cap, so the file should NOT be truncated
    expect(context).not.toContain("truncated at 8000 chars");
    expect(context.length).toBeGreaterThan(8000);
    expect(context.length).toBeLessThanOrEqual(MAX_TOTAL_CONTEXT_CHARS + 5000);
  });

  it("uses lower char cap (8K) for mechanical tasks", () => {
    const task = makeTask({
      type: "mechanical",
      files_affected: ["docs/specs/codex-v3.md"],
    });

    const context = readFileContext(task, tempDir);

    expect(context).toContain("truncated at 8000 chars");
    expect(context.length).toBeLessThan(9000);
  });

  it("marks missing files as defects, not skips", () => {
    const task = makeTask({
      files_affected: ["nonexistent/file.ts"],
    });

    const context = readFileContext(task, tempDir);

    expect(context).toContain("NOT FOUND");
    expect(context).toContain("defect in DECOMPOSE");
    expect(context).not.toContain("skipping");
  });

  it("respects total context budget of 120K chars", () => {
    // Create many files to exceed budget
    const files: string[] = [];
    for (let i = 0; i < 10; i++) {
      const name = `bulk-${i}.ts`;
      writeFileSync(
        join(tempDir, "src", name),
        "x".repeat(20000),
        "utf-8",
      );
      files.push(`src/${name}`);
    }

    const task = makeTask({
      type: "generative",
      files_affected: files,
    });

    const context = readFileContext(task, tempDir);

    // Some files should be skipped due to total limit
    expect(context).toContain("total context limit reached");
    expect(context.length).toBeLessThanOrEqual(MAX_TOTAL_CONTEXT_CHARS + 5000); // with overhead
  });

  it("returns empty string for tasks with no files_affected", () => {
    const task = makeTask({ files_affected: [] });

    const context = readFileContext(task, tempDir);

    expect(context).toBe("");
  });

  it("truncates analytical files at 48K (not 32K)", () => {
    const task = makeTask({
      type: "generative",
      files_affected: ["docs/specs/large-spec.md"],
    });

    const context = readFileContext(task, tempDir);

    // 55KB file should be truncated at 48000, not at 32000
    expect(context).toContain("truncated at 48000 chars");
    expect(context).not.toContain("truncated at 32000 chars");
    expect(context.length).toBeGreaterThan(32000);
    expect(context.length).toBeLessThanOrEqual(48200); // 48K + header overhead
  });

  it("prioritises docs/specs/ files before src/ files", () => {
    const task = makeTask({
      type: "generative",
      // Intentionally ordered src first — prioritisation should reorder
      files_affected: ["src/phi-l.ts", "docs/specs/codex-v3.md", "docs/research/safety.md"],
    });

    const context = readFileContext(task, tempDir);

    // docs/specs should appear before src in the output
    const specsPos = context.indexOf("--- File: docs/specs/codex-v3.md ---");
    const srcPos = context.indexOf("--- File: src/phi-l.ts ---");
    const researchPos = context.indexOf("--- File: docs/research/safety.md ---");

    expect(specsPos).toBeGreaterThanOrEqual(0);
    expect(srcPos).toBeGreaterThanOrEqual(0);
    expect(researchPos).toBeGreaterThanOrEqual(0);

    // specs before research, research before src
    expect(specsPos).toBeLessThan(researchPos);
    expect(researchPos).toBeLessThan(srcPos);
  });

  it("context degradation: returned context contains truncation marker when files are truncated", () => {
    const task = makeTask({
      type: "generative",
      files_affected: ["docs/specs/large-spec.md"],
    });

    const context = readFileContext(task, tempDir);

    // The returned context string contains the marker that the warning system checks
    const truncatedCount = (context.match(/\(truncated at/g) ?? []).length;
    expect(truncatedCount).toBe(1);
  });

  it("context degradation: returned context contains skip marker when budget is exhausted", () => {
    const files: string[] = [];
    for (let i = 0; i < 10; i++) {
      const name = `skip-test-${i}.ts`;
      writeFileSync(join(tempDir, "src", name), "x".repeat(20000), "utf-8");
      files.push(`src/${name}`);
    }

    const task = makeTask({
      type: "generative",
      files_affected: files,
    });

    const context = readFileContext(task, tempDir);

    const skippedCount = (context.match(/\(skipped: total context limit reached\)/g) ?? []).length;
    expect(skippedCount).toBeGreaterThan(0);
  });
});

// ── getDirectoryListing tests ───────────────────────────────────────────

describe("getDirectoryListing (FR-11)", () => {
  it("returns valid file paths from the repository", () => {
    const listing = getDirectoryListing(tempDir);

    expect(listing).toContain("src/index.ts");
    expect(listing).toContain("src/phi-l.ts");
    expect(listing).toContain("docs/specs/codex-v3.md");
    expect(listing).toContain("docs/research/safety.md");
  });

  it("uses forward slashes in paths", () => {
    const listing = getDirectoryListing(tempDir);

    // No backslashes (Windows paths) in the listing
    expect(listing).not.toContain("\\");
  });

  it("returns placeholder for non-existent repo path", () => {
    const listing = getDirectoryListing("/nonexistent/path");

    expect(listing).toBe("(directory listing unavailable)");
  });
});

// ── validateFilePaths tests ─────────────────────────────────────────────

describe("validateFilePaths", () => {
  it("returns no warnings for valid paths", () => {
    const graph: TaskGraph = {
      intent_id: "test",
      tasks: [
        makeTask({ files_affected: ["src/index.ts", "docs/specs/codex-v3.md"] }),
      ],
      dependencies: [],
      phases: [],
      estimated_total_effort: "small",
      decomposition_confidence: 0.8,
      assumptions: [],
    };

    const warnings = validateFilePaths(graph, tempDir);

    expect(warnings).toHaveLength(0);
  });

  it("catches non-existent paths", () => {
    const graph: TaskGraph = {
      intent_id: "test",
      tasks: [
        makeTask({
          task_id: "t1",
          files_affected: ["src/index.ts", "src/nonexistent.ts"],
        }),
        makeTask({
          task_id: "t2",
          files_affected: ["docs/specs/made-up-file.md"],
        }),
      ],
      dependencies: [],
      phases: [],
      estimated_total_effort: "small",
      decomposition_confidence: 0.8,
      assumptions: [],
    };

    const warnings = validateFilePaths(graph, tempDir);

    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain("t1");
    expect(warnings[0]).toContain("src/nonexistent.ts");
    expect(warnings[1]).toContain("t2");
    expect(warnings[1]).toContain("docs/specs/made-up-file.md");
  });

  it("returns empty array for tasks with no files", () => {
    const graph: TaskGraph = {
      intent_id: "test",
      tasks: [makeTask({ files_affected: [] })],
      dependencies: [],
      phases: [],
      estimated_total_effort: "small",
      decomposition_confidence: 0.8,
      assumptions: [],
    };

    const warnings = validateFilePaths(graph, tempDir);

    expect(warnings).toHaveLength(0);
  });
});
