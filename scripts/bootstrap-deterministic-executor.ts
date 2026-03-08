// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * ManifestSeedingExecutor — first concrete DeterministicExecutor.
 *
 * Handles the pattern: read a _manifest.json → create pipeline output
 * Seed nodes in the graph. This replaces the M-17 use case where an LLM
 * was sent JSON manifest data and hallucinated the contents.
 *
 * NOT part of the npm package. Dev tooling only.
 */

import { readFileSync, existsSync } from "node:fs";
import type {
  DeterministicExecutor,
  Task,
  TaskExecutionContext,
  TaskOutcome,
} from "../src/patterns/architect/types.js";
import { tryCreateAndLinkSeed } from "../src/graph/queries.js";
import type { PipelineOutputSeedProps } from "../src/graph/queries.js";

export class ManifestSeedingExecutor implements DeterministicExecutor {
  canHandle(task: Task): boolean {
    // Handles tasks where input is a JSON manifest and output is graph nodes
    if (task.input_type === "json_manifest" && task.output_type === "graph_nodes") {
      return true;
    }

    // Fallback: check data_sources for _manifest.json files
    const sources = task.data_sources ?? [];
    return sources.some((s) => s.endsWith("_manifest.json"));
  }

  async execute(task: Task, context: TaskExecutionContext): Promise<TaskOutcome> {
    const startTime = Date.now();

    try {
      const manifestPath = this.findManifestPath(task);
      if (!manifestPath) {
        return this.failureOutcome(
          task,
          "No manifest path found in task data_sources or files_affected",
          startTime,
        );
      }

      if (!existsSync(manifestPath)) {
        return this.failureOutcome(
          task,
          `Manifest file not found: ${manifestPath}`,
          startTime,
        );
      }

      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      const runId = manifest.runId ?? context.runId ?? context.planId;

      let seeded = 0;
      let failed = 0;
      const errors: string[] = [];

      const tasks: Array<{ taskId: string; title: string; outputFile?: string }> =
        manifest.tasks ?? [];

      for (let i = 0; i < tasks.length; i++) {
        const entry = tasks[i];
        try {
          let content = "";
          if (entry.outputFile) {
            try {
              content = readFileSync(entry.outputFile, "utf-8");
            } catch {
              content = `(output file not readable: ${entry.outputFile})`;
            }
          }

          const seedProps: PipelineOutputSeedProps = {
            id: `${runId}:${entry.taskId}`,
            name: entry.title,
            seedType: "pipeline-output",
            content,
            qualityScore: null,
            modelId: null, // Deterministic — no model
            charCount: content.length,
            durationMs: 0,
            runId,
            taskId: entry.taskId,
            order: i,
          };

          await tryCreateAndLinkSeed(seedProps);
          seeded++;
        } catch (err) {
          failed++;
          errors.push(`${entry.taskId}: ${(err as Error).message}`);
        }
      }

      const output = `Seeded ${seeded}/${seeded + failed} entries from manifest.${
        errors.length > 0 ? " Errors: " + errors.join("; ") : ""
      }`;

      return {
        task_id: task.task_id,
        success: failed === 0,
        output,
        adaptations_applied: 0,
        metadata: {
          executionPath: "deterministic",
          executor: "ManifestSeedingExecutor",
          seeded,
          failed,
          durationMs: Date.now() - startTime,
        },
      };
    } catch (err) {
      return this.failureOutcome(task, (err as Error).message, startTime);
    }
  }

  private findManifestPath(task: Task): string | null {
    // Check data_sources first
    const sources = task.data_sources ?? [];
    const fromSources = sources.find(
      (s) => s.endsWith("_manifest.json") || s.endsWith("manifest.json"),
    );
    if (fromSources) return fromSources;

    // Check files_affected as fallback
    const files = task.files_affected ?? [];
    return (
      files.find(
        (f) => f.endsWith("_manifest.json") || f.endsWith("manifest.json"),
      ) ?? null
    );
  }

  private failureOutcome(
    task: Task,
    error: string,
    startTime: number,
  ): TaskOutcome {
    return {
      task_id: task.task_id,
      success: false,
      output: `Deterministic execution failed: ${error}`,
      adaptations_applied: 0,
      metadata: {
        executionPath: "deterministic",
        executor: "ManifestSeedingExecutor",
        error,
        durationMs: Date.now() - startTime,
      },
    };
  }
}
