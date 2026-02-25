/**
 * DECOMPOSE stage — transforms survey output + intent into a TaskGraph.
 *
 * Calls an LLM via the injected ModelExecutor to produce a real
 * task decomposition. Falls back to stub on LLM or parse failure.
 *
 * Moved from DND-Manager agent/patterns/architect/decompose.ts.
 * Verdict: SPLIT — removed DND-specific `createArchitectLLM` import,
 * refactored to accept ModelExecutor as a parameter.
 */
import type { PipelineSurveyOutput, TaskGraph, ModelExecutor } from "./types.js";
export declare function decompose(intent: string, survey: PipelineSurveyOutput, modelExecutor: ModelExecutor): Promise<TaskGraph>;
//# sourceMappingURL=decompose.d.ts.map