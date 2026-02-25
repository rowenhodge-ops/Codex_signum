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
/**
 * Build the decompose prompt from intent and survey output.
 * Returns a single string to send to the LLM.
 */
export declare function buildDecomposePrompt(intent: string, survey: PipelineSurveyOutput): string;
//# sourceMappingURL=decompose-prompt.d.ts.map