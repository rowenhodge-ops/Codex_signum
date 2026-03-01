// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * decompose-prompt.ts — Prompt construction for DECOMPOSE stage.
 *
 * Builds a structured prompt that instructs the LLM to produce a TaskGraph
 * from intent + survey output. Response format is JSON.
 *
 * Moved from DND-Manager agent/patterns/architect/decompose-prompt.ts.
 * Verdict: GENERIC — pure prompt building, no DND imports.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { PipelineSurveyOutput } from "./types.js";
import { MAX_TASKS_PER_PLAN } from "./types.js";

/**
 * Walk directories and collect .ts and .md file paths.
 * Returns paths relative to repoPath, using forward slashes.
 */
function walkDir(dir: string, base: string, maxDepth: number): string[] {
  if (maxDepth <= 0) return [];
  const paths: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        paths.push(...walkDir(fullPath, base, maxDepth - 1));
      } else if (entry.endsWith(".ts") || entry.endsWith(".md")) {
        paths.push(relative(base, fullPath).replace(/\\/g, "/"));
      }
    }
  } catch { /* directory not readable */ }
  return paths;
}

/**
 * Get a listing of relevant files in the repository.
 * Scans docs/specs/, docs/research/, docs/lean/, docs/hypotheses/, and src/.
 */
export function getDirectoryListing(repoPath: string): string {
  const dirs = ["docs/specs", "docs/research", "docs/lean", "docs/hypotheses", "src"];
  const allPaths: string[] = [];

  for (const dir of dirs) {
    const fullDir = join(repoPath, dir);
    allPaths.push(...walkDir(fullDir, repoPath, 4));
  }

  allPaths.sort();
  return allPaths.join("\n") || "(directory listing unavailable)";
}

/**
 * Build the decompose prompt from intent and survey output.
 * When repoPath is provided, includes a directory listing so the LLM
 * can reference real file paths in files_affected.
 */
export function buildDecomposePrompt(
  intent: string,
  survey: PipelineSurveyOutput,
  repoPath?: string,
): string {
  const directorySection = repoPath
    ? `\n## Available Files\n\nThe following files exist in the repository. When assigning files_affected to tasks,\nONLY use paths from this list. Do NOT invent file paths.\n\n${getDirectoryListing(repoPath)}\n`
    : "";

  return `You are a software architect decomposing a development intent into an executable task graph.

## Intent
${intent}

## Current System State

### Codebase Structure
${survey.codebase_state.structure}

### Recent Changes
${survey.codebase_state.recent_changes.slice(0, 10).join("\n")}

### Build Status: ${survey.codebase_state.test_status}

### Graph State
- Pattern health: ${JSON.stringify(survey.graph_state.pattern_health)}
- Active cascades: ${survey.graph_state.active_cascades}
- Constitutional alerts: ${survey.graph_state.constitutional_alerts.join("; ") || "none"}

### Gap Analysis
- Exists: ${survey.gap_analysis.what_exists.join(", ") || "none identified"}
- Needs building: ${survey.gap_analysis.what_needs_building.join(", ") || "none identified"}
- Needs changing: ${survey.gap_analysis.what_needs_changing.join(", ") || "none identified"}
- Risks: ${survey.gap_analysis.risks.join(", ") || "none identified"}

### Survey Blind Spots
${survey.blind_spots.join("\n") || "none"}
${directorySection}
## Your Task

Decompose the intent into a task graph.

CRITICAL RESPONSE FORMAT RULES:
- Your response must be ONLY a JSON object.
- The first character of your response must be { and the last must be }.
- Do NOT wrap the JSON in markdown code fences.
- Do NOT include any explanation, preamble, or postamble text.
- Do NOT include comments inside the JSON.

The JSON must match this exact structure:

{"tasks":[{"task_id":"t1","title":"Short imperative title","description":"What to do and why","acceptance_criteria":["Testable criterion"],"type":"mechanical","phase":"phase_1","estimated_complexity":"medium","files_affected":["src/example.ts"],"specification_refs":["doc reference"],"verification":"npx tsc --noEmit","commit_message":"fix: description"}],"dependencies":[{"from":"t1","to":"t2","type":"hard"}],"phases":[{"phase_id":"phase_1","title":"Phase title","description":"Phase description","tasks":["t1"],"gate":"human","gate_criteria":"Human reviews output"}],"estimated_total_effort":"medium","assumptions":["Assumption 1"]}

Field reference:
- task_id: unique string (e.g. t1, t2, t3)
- type: "mechanical" (renames, moves, deletions) or "generative" (creative code generation)
- estimated_complexity: "trivial" | "low" | "medium" | "high"
- dependencies.type: "hard" (blocking) or "soft" (beneficial but not blocking)
- phases.gate: "auto" or "human"
- estimated_total_effort: "small" | "medium" | "large" | "epic"

## Constraints
- Maximum ${MAX_TASKS_PER_PLAN} tasks.
- Each task should be ONE file, ONE concern, ONE commit.
- Mark tasks as "mechanical" if they're renames, moves, import fixes, deletions.
- Mark tasks as "generative" if they require creative code generation.
- Include hard dependencies where task B cannot start until task A completes.
- Use soft dependencies where task B benefits from task A but could proceed independently.
- Every task must have a verification command.
- Group tasks into phases with human gates between phases.
- Be conservative with complexity estimates — prefer overestimating.
- If the intent is ambiguous, state assumptions explicitly.
- Every task_id referenced in dependencies and phases.tasks MUST exist in the tasks array.`;
}
