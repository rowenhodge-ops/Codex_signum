// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Source verification — detect when LLM output references documents
 * that were not provided as context for the task.
 *
 * Complements the three-layer hallucination detection in
 * scripts/bootstrap-task-executor.ts by addressing the root cause of R1
 * failures: tasks making claims about spec content without having read the spec.
 *
 * @module codex-signum-core/patterns/architect/hallucination-detection
 */

import { extractPathReferences, resolveDocumentReferences } from "./canonical-references.js";

/** Detection signal returned by source verification */
export interface HallucinationFlag {
  level: "signal" | "content" | "structural";
  severity: "warning" | "error";
  description: string;
}

/**
 * Verify that documents referenced in task output were actually provided
 * as context (via files_affected → readFileContext).
 *
 * Returns a flag for each referenced document that was NOT in providedFiles.
 * Only path references and mapped document-name references are checked.
 * Unknown document mentions do NOT produce signals (avoids false positives).
 *
 * @param output - Raw LLM output text
 * @param taskId - Task identifier (for descriptive messages)
 * @param providedFiles - Files that were actually included in the task prompt
 */
export function detectUnsourcedReferences(
  output: string,
  taskId: string,
  providedFiles: string[],
): HallucinationFlag[] {
  if (!output || !output.trim()) return [];

  const flags: HallucinationFlag[] = [];
  const providedSet = new Set(providedFiles);

  // Check explicit file path references in output
  const pathRefs = extractPathReferences(output);
  for (const ref of pathRefs) {
    if (!providedSet.has(ref)) {
      flags.push({
        level: "content",
        severity: "warning",
        description: `Task ${taskId} references "${ref}" but this file was not in its context`,
      });
    }
  }

  // Check document name references via known mapping
  const resolvedRefs = resolveDocumentReferences(output);
  for (const resolvedPath of resolvedRefs) {
    // Skip if already flagged via path detection
    if (pathRefs.includes(resolvedPath)) continue;
    if (!providedSet.has(resolvedPath)) {
      flags.push({
        level: "content",
        severity: "warning",
        description: `Task ${taskId} references a document ("${resolvedPath}") that was not in its context`,
      });
    }
  }

  return flags;
}
