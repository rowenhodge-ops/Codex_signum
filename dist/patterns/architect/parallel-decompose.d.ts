/**
 * Parallel Decompose — Best-of-N strategy for plan quality.
 *
 * Research integration:
 * - Best-of-N: generate N decompositions, score each, pick best (log(N) improvement)
 * - Self-MoA: same strong model N times > mixing different models
 * - Short-m@k: take first M completions from K parallel runs (future: async race)
 *
 * Scoring heuristic evaluates:
 * - Decomposition confidence (from LLM response parse quality)
 * - Task count reasonableness (not too few, not too many)
 * - Coverage of survey gaps (do tasks address what_needs_building?)
 * - Internal consistency (no orphaned tasks, dependencies make sense)
 *
 * Falls back to single decompose when N=1 or all attempts fail.
 */
import type { PipelineSurveyOutput, TaskGraph, ModelExecutor } from "./types.js";
export interface ParallelDecomposeOptions {
    /** Number of parallel decompose attempts (default: 3) */
    n?: number;
    /** Run attempts in parallel (true) or sequential (false, default) */
    parallel?: boolean;
}
export interface ScoredPlan {
    graph: TaskGraph;
    score: number;
    breakdown: {
        confidence: number;
        taskCountScore: number;
        coverageScore: number;
        consistencyScore: number;
    };
}
/**
 * Run decompose N times and return the best-scoring plan.
 */
export declare function parallelDecompose(intent: string, survey: PipelineSurveyOutput, modelExecutor: ModelExecutor, options?: ParallelDecomposeOptions, repoPath?: string): Promise<TaskGraph>;
/**
 * Score a TaskGraph on quality heuristics.
 * Returns 0-1 composite score.
 */
export declare function scorePlan(graph: TaskGraph, survey: PipelineSurveyOutput, _intent: string): ScoredPlan;
//# sourceMappingURL=parallel-decompose.d.ts.map