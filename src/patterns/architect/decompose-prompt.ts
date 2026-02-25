/**
 * decompose-prompt.ts — Prompt construction for DECOMPOSE stage.
 *
 * Builds a structured prompt that instructs the LLM to produce a TaskGraph
 * from intent + survey output. Response format is JSON.
 *
 * Moved from DND-Manager agent/patterns/architect/decompose-prompt.ts.
 * Verdict: GENERIC — pure prompt building, no DND imports.
 */

import type { PipelineSurveyOutput } from "./types.js";
import { MAX_TASKS_PER_PLAN } from "./types.js";

/**
 * Build the decompose prompt from intent and survey output.
 * Returns a single string to send to the LLM.
 */
export function buildDecomposePrompt(
  intent: string,
  survey: PipelineSurveyOutput,
): string {
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

## Your Task

Decompose the intent into a task graph. Respond with ONLY a JSON object (no markdown fences, no explanation) matching this structure:

{
  "tasks": [
    {
      "task_id": "string — unique, e.g. t1, t2",
      "title": "string — short imperative title",
      "description": "string — what to do and why",
      "acceptance_criteria": ["string — testable criterion"],
      "type": "mechanical | generative",
      "phase": "string — phase_id this belongs to",
      "estimated_complexity": "trivial | low | medium | high",
      "files_affected": ["string — relative file paths"],
      "specification_refs": ["string — doc references if any"],
      "verification": "string — command to verify (e.g. npx tsc --noEmit)",
      "commit_message": "string — conventional commit message"
    }
  ],
  "dependencies": [
    { "from": "task_id", "to": "task_id", "type": "hard | soft" }
  ],
  "phases": [
    {
      "phase_id": "string",
      "title": "string",
      "description": "string",
      "tasks": ["task_id", "task_id"],
      "gate": "auto | human",
      "gate_criteria": "string"
    }
  ],
  "estimated_total_effort": "small | medium | large | epic",
  "assumptions": ["string — assumptions made during decomposition"]
}

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
- If the intent is ambiguous, state assumptions explicitly.`;
}
