import type { PipelineSurveyOutput, TaskGraph, ModelExecutor } from "./types.js";
/**
 * Validate that every files_affected path in the task graph exists on disk.
 * Returns warnings for non-existent paths. Does NOT strip them — the DECOMPOSE
 * model needs to learn which paths are real through Thompson feedback.
 */
export declare function validateFilePaths(taskGraph: TaskGraph, repoPath: string): string[];
export declare function decompose(intent: string, survey: PipelineSurveyOutput, modelExecutor: ModelExecutor, repoPath?: string): Promise<TaskGraph>;
//# sourceMappingURL=decompose.d.ts.map