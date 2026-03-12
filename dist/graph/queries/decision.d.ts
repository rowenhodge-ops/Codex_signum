import type { Record as Neo4jRecord } from "neo4j-driver";
/**
 * Decision nodes carry dual labels: :Seed:Decision
 * INSTANTIATES → def:morpheme:seed
 * Specialisation label :Decision retained for constraint scoping and query performance.
 * seedType = 'decision'
 */
/** Properties for recording a Decision */
export interface DecisionProps {
    id: string;
    taskType: string;
    complexity: "trivial" | "moderate" | "complex" | "critical";
    domain?: string;
    selectedSeedId: string;
    madeByBloomId?: string;
    wasExploratory: boolean;
    contextClusterId?: string;
    qualityRequirement?: number;
    costCeiling?: number;
    /** Pipeline run ID — enables human feedback queries */
    runId?: string;
    /** Task ID within the pipeline run — enables per-task feedback */
    taskId?: string;
}
/** Properties for recording a Decision Outcome */
export interface DecisionOutcomeProps {
    decisionId: string;
    success: boolean;
    qualityScore: number;
    durationMs: number;
    cost?: number;
    inputTokens?: number;
    outputTokens?: number;
    thinkingTokens?: number;
    errorType?: string;
    notes?: string;
    infrastructure?: boolean;
}
/** Properties for a Context Cluster (Thompson Sampling) */
export interface ContextClusterProps {
    id: string;
    taskType: string;
    complexity: string;
    domain?: string;
}
export declare function recordDecision(props: DecisionProps): Promise<void>;
export declare function recordDecisionOutcome(props: DecisionOutcomeProps): Promise<void>;
/** Get recent decisions for a context cluster (Thompson Sampling) */
export declare function getDecisionsForCluster(clusterId: string, limit?: number): Promise<Neo4jRecord[]>;
export declare function ensureContextCluster(props: ContextClusterProps): Promise<void>;
/**
 * Update the qualityScore on an existing Decision node.
 * This is the surgical update path for when the task executor
 * computes real quality after the Thompson router's initial
 * outcome recording (which uses a default 0.7).
 */
export declare function updateDecisionQuality(decisionId: string, qualityScore: number): Promise<void>;
/**
 * Find the Decision node that routed a specific task by bloom and model.
 * Returns the Decision ID if found, undefined if not.
 * Uses madeByBloomId + selectedSeedId + timestamp range for matching.
 */
export declare function findDecisionForTask(bloomId: string, modelSeedId: string, afterTimestamp: string): Promise<string | undefined>;
/** Link a Decision node to the PipelineRun it was made during */
export declare function linkDecisionToPipelineRun(decisionId: string, runId: string): Promise<void>;
/** Get all Decision nodes linked to a PipelineRun */
export declare function getDecisionsForRun(runId: string): Promise<Neo4jRecord[]>;
//# sourceMappingURL=decision.d.ts.map