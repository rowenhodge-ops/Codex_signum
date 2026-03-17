import type { PatternHealthContext } from "../write-observation.js";
import type { GraphEdge, NodeHealth } from "../../computation/psi-h.js";
import type { PsiH } from "../../types/state-dimensions.js";
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
/**
 * Query the graph for all data needed to construct PatternHealthContext.
 * This is the bridge between graph state and the ΦL computation chain.
 *
 * Returns null if the Bloom doesn't exist or has no observations yet
 * (cold start — conditioning-only mode still works via the null check
 * in writeObservation).
 *
 * V1 factor mapping:
 *   axiomCompliance  = 1.0 (assume compliant until Assayer wired)
 *   provenanceClarity = fraction of recent TaskOutputs with provenance fields
 *   usageSuccessRate  = succeeded / total from TaskOutput nodes
 *   temporalStability = computed from PhiLState ring buffer (persisted on Bloom)
 */
export declare function assemblePatternHealthContext(bloomId: string): Promise<PatternHealthContext | null>;
/**
 * Extract the subgraph for ΨH computation on a specific Bloom composition.
 * Returns only edges between nodes CONTAINED by the target Bloom,
 * and health values for those contained nodes.
 *
 * Returns null if the Bloom has no children (ΨH undefined for empty composition).
 */
export declare function getCompositionSubgraph(bloomId: string): Promise<{
    edges: GraphEdge[];
    nodeHealths: NodeHealth[];
} | null>;
/**
 * Compute ΨH for a Bloom composition and persist the result on the Bloom node.
 * Uses the stateful variant for temporal decomposition (EWMA trend + ring buffer).
 *
 * Flow:
 *   1. Extract composition subgraph (children + inter-edges)
 *   2. Read existing PsiHState from Bloom (JSON property)
 *   3. Compute ΨH with temporal decomposition
 *   4. Persist ΨH, decomposition, and updated state on Bloom
 *
 * Call after pipeline runs or topology changes (not inside writeObservation).
 *
 * @returns PsiH result, or null if the Bloom has no children
 */
export declare function computeAndPersistPsiH(bloomId: string): Promise<PsiH | null>;
//# sourceMappingURL=health.d.ts.map