/**
 * Get ΦL and observation counts for each Architect pipeline stage Bloom.
 * Answers: "which pipeline stage is performing best/worst?"
 */
export declare function getPipelineStageHealth(architectBloomId: string): Promise<Array<{
    stage: string;
    resonatorId: string;
    phiL: number;
    observationCount: number;
}>>;
/**
 * Get aggregate pipeline run statistics from the graph.
 * Answers: "how is my pipeline performing over time?"
 */
export declare function getPipelineRunStats(architectBloomId: string, limit?: number): Promise<Array<{
    runId: string;
    intent: string;
    taskCount: number;
    overallQuality: number;
    modelDiversity: number;
    durationMs: number;
    startedAt: string;
}>>;
/** Get compaction history for a bloom — observation deletion audit trail */
export declare function getCompactionHistory(bloomId: string, limit?: number): Promise<Array<{
    distillationId: string;
    observationCount: number;
    confidence: number;
    createdAt: Date;
}>>;
/** Get aggregate model performance across all pipeline runs */
export declare function getModelPerformance(limit?: number): Promise<Array<{
    modelUsed: string;
    provider: string;
    taskCount: number;
    avgQuality: number;
    avgDurationMs: number;
    successRate: number;
}>>;
/** Get performance stats per pipeline stage (Stage Bloom-level) */
export declare function getStagePerformance(architectBloomId: string): Promise<Array<{
    stage: string;
    taskCount: number;
    avgQuality: number;
    avgDurationMs: number;
    successRate: number;
}>>;
/** Compare two pipeline runs side-by-side */
export declare function getRunComparison(runIdA: string, runIdB: string): Promise<{
    runA: {
        id: string;
        intent: string;
        taskCount: number;
        overallQuality: number;
        durationMs: number;
        status: string;
    } | null;
    runB: {
        id: string;
        intent: string;
        taskCount: number;
        overallQuality: number;
        durationMs: number;
        status: string;
    } | null;
}>;
//# sourceMappingURL=health.d.ts.map