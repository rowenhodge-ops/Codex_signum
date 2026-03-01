import type { PipelineSurveyOutput } from "./types.js";
/**
 * Get a listing of relevant files in the repository.
 * Scans docs/specs/, docs/research/, docs/lean/, docs/hypotheses/, and src/.
 */
export declare function getDirectoryListing(repoPath: string): string;
/**
 * Build the decompose prompt from intent and survey output.
 * When repoPath is provided, includes a directory listing so the LLM
 * can reference real file paths in files_affected.
 */
export declare function buildDecomposePrompt(intent: string, survey: PipelineSurveyOutput, repoPath?: string): string;
//# sourceMappingURL=decompose-prompt.d.ts.map