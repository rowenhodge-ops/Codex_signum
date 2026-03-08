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
export declare function classifyTask(task: Task): ClassificationResult;
/**
 * CLASSIFY stage entry point — classifies all tasks in a TaskGraph.
 * Attaches both `type` and `classification` to each task.
 */
export declare function classify(taskGraph: TaskGraph): TaskGraph;
//# sourceMappingURL=classify.d.ts.map