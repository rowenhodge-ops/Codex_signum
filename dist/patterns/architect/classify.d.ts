/**
 * CLASSIFY stage — assigns type (mechanical vs generative) to each task.
 *
 * Heuristic classification based on keyword analysis of task descriptions.
 * Defaults to "generative" (safer — gets full pipeline validation).
 *
 * Moved from DND-Manager agent/patterns/architect/classify.ts.
 * Verdict: GENERIC — pure computation, no DND imports.
 */
import type { TaskGraph } from "./types.js";
export declare function classify(taskGraph: TaskGraph): TaskGraph;
//# sourceMappingURL=classify.d.ts.map