/**
 * Bootstrap TaskExecutor — executes tasks via LLM + file operations.
 * Uses the ModelExecutor for LLM calls, applies changes to filesystem.
 *
 * NOT part of the npm package. Dev tooling only.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
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

// ── TaskExecutor implementation ─────────────────────────────────────────────

export function createBootstrapTaskExecutor(
  modelExecutor: ModelExecutor,
): TaskExecutor {
  return {
    async execute(
      task: Task,
      context: TaskExecutionContext,
    ): Promise<TaskOutcome> {
      const { repoPath, dryRun } = context;

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
        // Generate implementation via LLM
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

        // Write LLM output to target files (analytical tasks produce docs)
        if (task.files_affected.length > 0) {
          const targetFile = task.files_affected[0];
          const fullPath = join(repoPath, targetFile);
          mkdirSync(dirname(fullPath), { recursive: true });
          writeFileSync(fullPath, result.text, "utf-8");
          console.log(`     Wrote: ${targetFile} (${result.text.length} chars)`);
        }

        // Verify TypeScript still compiles (if any files were changed)
        try {
          execSync("npx tsc --noEmit", {
            cwd: repoPath,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
          });
        } catch {
          return {
            task_id: task.task_id,
            success: false,
            error: "TypeScript compilation failed after task execution",
            adaptations_applied: 0,
          };
        }

        // Verify tests still pass
        try {
          execSync("npm test", {
            cwd: repoPath,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
            timeout: 120_000,
          });
        } catch {
          return {
            task_id: task.task_id,
            success: false,
            error: "Tests failed after task execution",
            adaptations_applied: 0,
          };
        }

        return {
          task_id: task.task_id,
          success: true,
          output: result.text.slice(0, 2000),
          adaptations_applied: 0,
        };
      } catch (err) {
        return {
          task_id: task.task_id,
          success: false,
          error: err instanceof Error ? err.message : String(err),
          adaptations_applied: 0,
        };
      }
    },
  };
}

function buildTaskPrompt(task: Task, context: TaskExecutionContext): string {
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
    `## Files Affected`,
    ...task.files_affected.map((f) => `- ${f}`),
    ``,
    `## Specification References`,
    ...task.specification_refs.map((r) => `- ${r}`),
    ``,
    `## Verification`,
    task.verification,
    ``,
    `## Commit Message`,
    task.commit_message,
    ``,
    `## Instructions`,
    `Produce the code changes needed to complete this task.`,
    `Show the full file content for each file that needs to change.`,
    `Do NOT modify signal conditioning (src/computation/signals/).`,
    `Use .js extensions on all relative imports.`,
  ].join("\n");
}
