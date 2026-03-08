// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * CLASSIFY stage — three-layer task classification.
 *
 * Layer 1: Content-shape detection (input_type + output_type from DECOMPOSE)
 * Layer 2: File-type + operation detection (files_affected extensions + keywords)
 * Layer 3: Keyword heuristics (fallback, expanded from original)
 *
 * Each layer returns a ClassificationResult with type, confidence, signals, and layer.
 * Higher layers take priority — Layer 1 trumps 2, Layer 2 trumps 3.
 */

import type { TaskGraph, Task, ClassificationResult } from "./types.js";

/**
 * Classify a single task through the three-layer pipeline.
 * Exported for direct use and testing.
 */
export function classifyTask(task: Task): ClassificationResult {
  // Layer 1: Content-shape detection (highest priority)
  const contentShape = classifyByContentShape(task);
  if (contentShape) return contentShape;

  // Layer 2: File-type + operation detection
  const fileType = classifyByFileType(task);
  if (fileType) return fileType;

  // Layer 3: Keyword heuristics (fallback)
  return classifyByKeywords(task);
}

// --- Layer 1: Content-shape ---

function classifyByContentShape(task: Task): ClassificationResult | null {
  if (!task.input_type) return null;

  const signals: string[] = [];

  // Structured input + structured output = deterministic
  if (
    task.input_type === "json_manifest" &&
    (task.output_type === "graph_nodes" || task.output_type === "source_code")
  ) {
    signals.push(`input_type: ${task.input_type}`, `output_type: ${task.output_type}`);
    return { type: "deterministic", confidence: 0.95, signals, layer: "content_shape" };
  }

  // Structured input but prose output — needs LLM for the output side
  if (task.input_type === "json_manifest" && task.output_type === "document") {
    signals.push(
      `input_type: ${task.input_type}`,
      `output_type: ${task.output_type} (needs LLM for prose)`,
    );
    return { type: "generative", confidence: 0.7, signals, layer: "content_shape" };
  }

  // Source code in + source code out → mechanical
  if (task.input_type === "source_code" && task.output_type === "source_code") {
    signals.push(`input_type: ${task.input_type}`, `output_type: ${task.output_type}`);
    return { type: "mechanical", confidence: 0.8, signals, layer: "content_shape" };
  }

  return null; // Content-shape present but inconclusive — fall through
}

// --- Layer 2: File-type + operation ---

function classifyByFileType(task: Task): ClassificationResult | null {
  const files = task.files_affected ?? [];
  if (files.length === 0) return null;

  const signals: string[] = [];
  const desc = (task.description + " " + task.title).toLowerCase();

  const structuredDataFiles = files.filter((f) =>
    /\.(json|csv|yaml|yml|toml)$/i.test(f),
  );
  const sourceFiles = files.filter((f) =>
    /\.(ts|js|tsx|jsx|py|rs|go)$/i.test(f),
  );

  // All files are structured data AND description suggests transform → deterministic
  if (structuredDataFiles.length > 0 && sourceFiles.length === 0) {
    const transformSignals = [
      "seed", "ingest", "load", "import", "parse", "transform", "migrate",
    ];
    const matched = transformSignals.filter((k) => desc.includes(k));
    if (matched.length > 0) {
      signals.push(
        `structured data files: ${structuredDataFiles.join(", ")}`,
        `transform signals: ${matched.join(", ")}`,
      );
      return { type: "deterministic", confidence: 0.8, signals, layer: "file_type" };
    }
  }

  // Source files with rename/move operations → mechanical
  if (sourceFiles.length > 0) {
    const mechanicalOps = [
      "rename", "move", "re-export", "update path", "update import",
      "fix typo", "delete", "remove unused", "deprecate", "alias", "barrel",
    ];
    const matched = mechanicalOps.filter((k) => desc.includes(k));
    if (matched.length > 0) {
      signals.push(
        `source files: ${sourceFiles.length}`,
        `mechanical ops: ${matched.join(", ")}`,
      );
      return {
        type: "mechanical",
        confidence: matched.length / (matched.length + 1),
        signals,
        layer: "file_type",
      };
    }
  }

  return null; // File types present but inconclusive
}

// --- Layer 3: Keyword heuristics ---

function classifyByKeywords(task: Task): ClassificationResult {
  const description = (task.description + " " + task.title).toLowerCase();

  const mechanicalSignals: string[] = [];
  const generativeSignals: string[] = [];

  const mechanicalKeywords = [
    "rename", "move", "import", "re-export", "reexport", "update path",
    "fix typo", "delete", "remove unused", "deprecate",
    "alias", "barrel", "update import", "copy", "format", "lint",
  ];
  const generativeKeywords = [
    "create", "implement", "design", "architect", "build",
    "add feature", "new module", "analyze", "review", "audit",
    "verify", "compare", "assess", "synthesize", "evaluate",
    "write", "document", "explain", "research", "refactor",
  ];

  for (const kw of mechanicalKeywords) {
    if (description.includes(kw)) mechanicalSignals.push(kw);
  }
  for (const kw of generativeKeywords) {
    if (description.includes(kw)) generativeSignals.push(kw);
  }

  const mechanicalScore = mechanicalSignals.length;
  const generativeScore = generativeSignals.length;
  const total = mechanicalScore + generativeScore;

  if (total === 0) {
    return {
      type: "generative",
      confidence: 0.5,
      signals: ["no keywords matched — defaulting to generative"],
      layer: "default",
    };
  }

  if (mechanicalScore > generativeScore) {
    return {
      type: "mechanical",
      confidence: mechanicalScore / total,
      signals: mechanicalSignals,
      layer: "keyword",
    };
  }

  return {
    type: "generative",
    confidence: generativeScore / total,
    signals: generativeSignals,
    layer: "keyword",
  };
}

/**
 * CLASSIFY stage entry point — classifies all tasks in a TaskGraph.
 * Attaches both `type` and `classification` to each task.
 */
export function classify(taskGraph: TaskGraph): TaskGraph {
  const classifiedTasks = taskGraph.tasks.map((task) => {
    const classification = classifyTask(task);
    return {
      ...task,
      type: classification.type,
      classification,
    };
  });

  return { ...taskGraph, tasks: classifiedTasks };
}
