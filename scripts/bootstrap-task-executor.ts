// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Bootstrap TaskExecutor — executes tasks via LLM, writes output to
 * docs/pipeline-output/ (NEVER to source files).
 *
 * The `files_affected` field on each task is treated as READ context —
 * those files are included in the LLM prompt so the model can reason
 * about them. Output always goes to a timestamped pipeline-output dir.
 *
 * NOT part of the npm package. Dev tooling only.
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  ModelExecutor,
  Task,
  TaskExecutionContext,
  TaskExecutor,
  TaskOutcome,
} from "../src/patterns/architect/types.js";

// ── Pre-flight checks ──────────────────────────────────────────────────────

export function runPreflightChecks(repoPath: string): void {
  // Verify we're in the right repo
  try {
    const remotes = execSync("git remote -v", {
      cwd: repoPath,
      encoding: "utf-8",
    });
    if (!remotes.includes("Codex_signum") && !remotes.includes("codex-signum")) {
      console.warn(
        "⚠️  Warning: git remote does not appear to be Codex_signum. Continuing anyway.",
      );
    }
  } catch {
    throw new Error("Pre-flight failed: not a git repository");
  }

  // Verify working tree is clean
  try {
    const status = execSync("git status --porcelain", {
      cwd: repoPath,
      encoding: "utf-8",
    });
    if (status.trim().length > 0) {
      throw new Error(
        `Pre-flight failed: working tree is not clean.\n${status}`,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Pre-flight")) throw err;
    throw new Error("Pre-flight failed: could not check git status");
  }

  // Verify TypeScript compiles
  try {
    execSync("npx tsc --noEmit", {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    throw new Error("Pre-flight failed: TypeScript compilation errors");
  }

  console.log("✅ Pre-flight checks passed.");
}

// ── Output isolation helpers ────────────────────────────────────────────────

/** Generate a run ID from the plan ID (timestamp-based) */
function deriveRunId(planId: string): string {
  // planId is "plan_<timestamp>", extract and format the timestamp
  const tsMatch = planId.match(/plan_(\d+)/);
  if (tsMatch) {
    const date = new Date(Number(tsMatch[1]));
    return date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  }
  // Fallback: generate from current time
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

/** Build a safe output filename from a task */
function getOutputPath(task: Task, runId: string, repoPath: string): string {
  const outputDir = join(repoPath, "docs", "pipeline-output", runId);
  mkdirSync(outputDir, { recursive: true });

  const safeName = task.task_id + "-" +
    (task.title ?? "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

  return join(outputDir, safeName + ".md");
}

/** Read files_affected as context for the LLM prompt */
function readFileContext(task: Task, repoPath: string): string {
  if (!task.files_affected.length) return "";

  let context = "";
  for (const filePath of task.files_affected) {
    const fullPath = join(repoPath, filePath);
    try {
      const content = readFileSync(fullPath, "utf-8");
      // Cap per-file context at 8000 chars to stay within prompt limits
      const capped = content.length > 8000
        ? content.slice(0, 8000) + "\n... (truncated at 8000 chars)"
        : content;
      context += `\n\n--- File: ${filePath} ---\n${capped}`;
    } catch {
      context += `\n\n--- File: ${filePath} --- (not found, skipping)`;
    }
  }
  return context;
}

// ── Run manifest ────────────────────────────────────────────────────────────

interface ManifestTask {
  taskId: string;
  title: string;
  type: string;
  model: string;
  status: "succeeded" | "failed";
  durationMs: number;
  outputFile: string;
  outputChars: number;
}

interface RunManifest {
  runId: string;
  intent: string;
  startedAt: string;
  completedAt: string;
  tasks: ManifestTask[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    totalDurationMs: number;
    totalOutputChars: number;
    modelsUsed: string[];
  };
}

// ── TaskExecutor implementation ─────────────────────────────────────────────

export interface BootstrapTaskExecutorBundle {
  executor: TaskExecutor;
  /** Write the run manifest after all tasks complete */
  writeManifest(): void;
}

export function createBootstrapTaskExecutor(
  modelExecutor: ModelExecutor,
): BootstrapTaskExecutorBundle {
  // Manifest accumulator — written after all tasks complete
  const manifestTasks: ManifestTask[] = [];
  let currentRunId: string | null = null;
  let currentIntent: string = "";
  let currentRepoPath: string = "";
  let runStartedAt: string = "";

  const executor: TaskExecutor = {
    async execute(
      task: Task,
      context: TaskExecutionContext,
    ): Promise<TaskOutcome> {
      const { repoPath, dryRun } = context;

      // Initialize run tracking on first task
      if (!currentRunId) {
        currentRunId = deriveRunId(context.planId);
        currentIntent = context.intent;
        currentRepoPath = repoPath;
        runStartedAt = new Date().toISOString();
      }

      console.log(`\n  📋 Task: ${task.title} [${task.task_id}]`);
      console.log(`     Type: ${task.type}, Complexity: ${task.estimated_complexity}`);
      console.log(`     Files: ${task.files_affected.join(", ") || "(none specified)"}`);

      if (dryRun) {
        console.log("     [DRY RUN] Skipping execution.");
        return {
          task_id: task.task_id,
          success: true,
          output: "[dry-run] Task would be executed here.",
          adaptations_applied: 0,
        };
      }

      try {
        // Generate analysis via LLM
        const prompt = buildTaskPrompt(task, context);
        const result = await modelExecutor.execute(prompt, {
          taskType: task.type === "mechanical" ? "coding" : "coding",
          complexity:
            task.estimated_complexity === "trivial"
              ? "simple"
              : task.estimated_complexity === "high"
                ? "complex"
                : "moderate",
        });

        console.log(
          `     LLM response: ${result.text.length} chars from ${result.modelId} (${result.durationMs}ms)`,
        );

        // Write output to pipeline-output/ (NEVER to source files)
        const outputPath = getOutputPath(task, currentRunId, repoPath);

        const isMechanical = task.type === "mechanical";
        const header = isMechanical
          ? [
              `# PROPOSED CODE CHANGE: ${task.title}`,
              ``,
              `> **This is a proposed change generated by the Architect pipeline.**`,
              `> It has NOT been applied. A human must review and apply it manually.`,
              `> Target files: ${task.files_affected.join(", ") || "(none)"}`,
            ]
          : [
              `# ${task.title}`,
            ];

        const outputContent = [
          ...header,
          ``,
          `> Task ID: ${task.task_id}`,
          `> Model: ${result.modelId}`,
          `> Duration: ${result.durationMs}ms`,
          `> Output chars: ${result.text.length}`,
          `> Timestamp: ${new Date().toISOString()}`,
          ``,
          `---`,
          ``,
          result.text,
        ].join("\n");

        writeFileSync(outputPath, outputContent, "utf-8");
        console.log(`     Output written to: ${outputPath}`);

        // Track for manifest
        manifestTasks.push({
          taskId: task.task_id,
          title: task.title,
          type: task.type,
          model: result.modelId,
          status: "succeeded",
          durationMs: result.durationMs,
          outputFile: outputPath.replace(repoPath + "/", "").replace(repoPath + "\\", ""),
          outputChars: result.text.length,
        });

        // TODO: mechanical task auto-apply (see architect spec)
        // Future: for mechanical tasks, apply the change to a git branch,
        // run tests, and auto-merge if green. For now, all output goes to
        // pipeline-output for human review.

        return {
          task_id: task.task_id,
          success: true,
          output: result.text.slice(0, 2000),
          adaptations_applied: 0,
        };
      } catch (err) {
        manifestTasks.push({
          taskId: task.task_id,
          title: task.title,
          type: task.type,
          model: "unknown",
          status: "failed",
          durationMs: 0,
          outputFile: "",
          outputChars: 0,
        });

        return {
          task_id: task.task_id,
          success: false,
          error: err instanceof Error ? err.message : String(err),
          adaptations_applied: 0,
        };
      }
    },
  };

  function writeManifest(): void {
    if (!currentRunId || !currentRepoPath) return;

    const outputDir = join(currentRepoPath, "docs", "pipeline-output", currentRunId);
    mkdirSync(outputDir, { recursive: true });

    const modelsUsed = [...new Set(manifestTasks.map((t) => t.model).filter((m) => m !== "unknown"))];

    const manifest: RunManifest = {
      runId: currentRunId,
      intent: currentIntent,
      startedAt: runStartedAt,
      completedAt: new Date().toISOString(),
      tasks: manifestTasks,
      summary: {
        total: manifestTasks.length,
        succeeded: manifestTasks.filter((t) => t.status === "succeeded").length,
        failed: manifestTasks.filter((t) => t.status === "failed").length,
        totalDurationMs: manifestTasks.reduce((sum, t) => sum + t.durationMs, 0),
        totalOutputChars: manifestTasks.reduce((sum, t) => sum + t.outputChars, 0),
        modelsUsed,
      },
    };

    const manifestPath = join(outputDir, "_manifest.json");
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    console.log(`  [DISPATCH] Manifest written to: ${manifestPath}`);
  }

  return { executor, writeManifest };
}

function buildTaskPrompt(task: Task, context: TaskExecutionContext): string {
  const fileContext = readFileContext(task, context.repoPath);

  const isMechanical = task.type === "mechanical";
  const instructions = isMechanical
    ? [
        `## Instructions`,
        `Produce the code changes needed to complete this task.`,
        `Show the full file content for each file that needs to change.`,
        `Do NOT modify signal conditioning (src/computation/signals/).`,
        `Use .js extensions on all relative imports.`,
      ]
    : [
        `## Instructions`,
        `Provide your analysis as a structured markdown document.`,
        `Focus on findings, evidence, and recommendations.`,
        `Do NOT output code changes or file rewrites — only analysis.`,
      ];

  return [
    `You are executing a task in the Codex Signum core library.`,
    ``,
    `## Intent`,
    context.intent,
    ``,
    `## Task`,
    `**${task.title}** (${task.task_id})`,
    task.description,
    ``,
    `## Acceptance Criteria`,
    ...task.acceptance_criteria.map((c) => `- ${c}`),
    ``,
    `## Specification References`,
    ...task.specification_refs.map((r) => `- ${r}`),
    ``,
    `## Verification`,
    task.verification,
    ``,
    ...(fileContext
      ? [
          `## Relevant Files (read as context)`,
          fileContext,
          ``,
        ]
      : []),
    ...instructions,
  ].join("\n");
}
