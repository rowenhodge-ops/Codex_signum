/**
 * Codex Signum — Neo4j Graph Queries
 *
 * Reusable query builders for creating, reading, and relating
 * Codex entities in Neo4j. All state mutations flow through here.
 *
 * M-7C: Uses morpheme-native names (Seed, Bloom, ROUTED_TO, etc.)
 *
 * @module codex-signum-core/graph/queries
 */
import type { Record as Neo4jRecord } from "neo4j-driver";
/** Properties for creating a Seed node (compute substrate — LLM model instance) */
export interface SeedProps {
    id: string;
    name: string;
    provider: string;
    model: string;
    baseModelId: string;
    thinkingMode: "adaptive" | "extended" | "none" | "default";
    thinkingParameter?: string;
    capabilities?: string[];
    supportsAdaptiveThinking?: boolean;
    supportsExtendedThinking?: boolean;
    supportsInterleavedThinking?: boolean;
    supportsPrefilling?: boolean;
    supportsStructuredOutputs?: boolean;
    supportsWebSearch?: boolean;
    supportsComputerUse?: boolean;
    maxContextWindow?: number;
    maxOutputTokens?: number;
    costPer1kInput?: number;
    costPer1kOutput?: number;
    avgLatencyMs?: number;
    costPer1kTokens?: number;
    status?: "active" | "inactive" | "degraded" | "retired";
    region?: string;
    endpoint?: string;
    lastProbed?: string;
    lastUsed?: string;
    probeFailures?: number;
}
/** Properties for creating/updating a Bloom node (scoped composition of morphemes) */
export interface BloomProps {
    id: string;
    name: string;
    description?: string;
    state?: string;
    morphemeKinds?: string[];
    domain?: string;
}
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
}
/** Properties for recording an Observation */
export interface ObservationProps {
    id: string;
    sourceBloomId: string;
    metric: string;
    value: number;
    unit?: string;
    context?: string;
}
/** Properties for a Distillation */
export interface DistillationProps {
    id: string;
    pattern: string;
    confidence: number;
    observationCount: number;
    sourceObservationIds: string[];
    insight: string;
}
/** Properties for a Context Cluster (Thompson Sampling) */
export interface ContextClusterProps {
    id: string;
    taskType: string;
    complexity: string;
    domain?: string;
}
/** Thompson Sampling arm stats */
export interface ArmStats {
    seedId: string;
    alpha: number;
    beta: number;
    totalTrials: number;
    avgQuality: number;
    avgLatencyMs: number;
    avgCost: number;
    totalCost: number;
}
/** Properties for a PipelineRun node (Stratum 2 — execution instance) */
export interface PipelineRunProps {
    id: string;
    intent: string;
    bloomId: string;
    taskCount: number;
    startedAt: string;
    completedAt?: string;
    durationMs?: number;
    modelDiversity?: number;
    overallQuality?: number;
    status: "running" | "completed" | "failed";
}
/** Properties for a TaskOutput node (Stratum 2 — individual task result) */
export interface TaskOutputProps {
    id: string;
    runId: string;
    taskId: string;
    title: string;
    taskType: string;
    modelUsed: string;
    provider: string;
    outputLength: number;
    durationMs: number;
    qualityScore?: number;
    hallucinationFlagCount: number;
    status: "succeeded" | "failed";
}
export declare function createSeed(props: SeedProps): Promise<void>;
export declare function getSeed(id: string): Promise<Neo4jRecord | null>;
export declare function listActiveSeeds(): Promise<Neo4jRecord[]>;
export declare function listActiveSeedsByCapability(requirements: {
    supportsAdaptiveThinking?: boolean;
    supportsExtendedThinking?: boolean;
    supportsInterleavedThinking?: boolean;
    supportsStructuredOutputs?: boolean;
    maxCostPer1kOutput?: number;
}): Promise<Neo4jRecord[]>;
export declare function createBloom(props: BloomProps): Promise<void>;
export declare function getBloom(id: string): Promise<Neo4jRecord | null>;
export declare function updateBloomState(id: string, state: string): Promise<void>;
/** Increment bloom connection count and recalculate state */
export declare function connectBlooms(fromId: string, toId: string, relType: string, properties?: Record<string, unknown>): Promise<void>;
export declare function recordDecision(props: DecisionProps): Promise<void>;
export declare function recordDecisionOutcome(props: DecisionOutcomeProps): Promise<void>;
/** Get recent decisions for a context cluster (Thompson Sampling) */
export declare function getDecisionsForCluster(clusterId: string, limit?: number): Promise<Neo4jRecord[]>;
/** Compute Thompson Sampling arm stats for a context cluster */
export declare function getArmStatsForCluster(clusterId: string): Promise<ArmStats[]>;
export declare function recordObservation(props: ObservationProps): Promise<void>;
/** Get observations for ΦL computation — recent, for a given bloom */
export declare function getObservationsForBloom(bloomId: string, limit?: number): Promise<Neo4jRecord[]>;
/** Count observations for maturity calculation */
export declare function countObservationsForBloom(bloomId: string): Promise<number>;
export declare function createDistillation(props: DistillationProps): Promise<void>;
export declare function ensureContextCluster(props: ContextClusterProps): Promise<void>;
/**
 * Get the degree of a bloom node (number of relationships).
 * Used for topology-aware dampening: γ_effective = min(0.7, 0.8/(k-1))
 */
export declare function getBloomDegree(bloomId: string): Promise<number>;
/**
 * Get the adjacency list for blooms.
 * Used for ΨH (spectral analysis) computations.
 */
export declare function getBloomAdjacency(): Promise<Array<{
    from: string;
    to: string;
    weight: number;
}>>;
/**
 * Get all blooms with their phi-L values.
 * Used for Graph Total Variation computation in ΨH.
 */
export declare function getBloomsWithHealth(): Promise<Array<{
    id: string;
    phiL: number;
    state: string;
    degree: number;
}>>;
/**
 * Store computed ΦL on a bloom node.
 */
export declare function updateBloomPhiL(bloomId: string, phiL: number, trend: "improving" | "stable" | "declining"): Promise<void>;
/**
 * Get immediate children of a container node.
 * Returns child IDs with their stored ΦL, connection count, observation count, and degree.
 */
export declare function getContainedChildren(containerId: string): Promise<Array<{
    id: string;
    phiL: number;
    observationCount: number;
    connectionCount: number;
    degree: number;
}>>;
/**
 * Get the full containment tree rooted at a node.
 * Returns { nodeId → parentId } map and leaf nodes.
 * Uses variable-length CONTAINS path traversal.
 * Leaf nodes have no outgoing CONTAINS relationships.
 */
export declare function getContainmentTree(rootId: string): Promise<{
    parentMap: Map<string, string | null>;
    leafNodes: string[];
    allNodes: string[];
}>;
/**
 * Get edges WITHIN a container's subgraph (for ΨH computation at that level).
 * Returns only edges where both endpoints are children of the container.
 */
export declare function getSubgraphEdges(containerId: string): Promise<Array<{
    from: string;
    to: string;
    weight: number;
}>>;
/**
 * Get all container nodes (nodes with outgoing CONTAINS relationships).
 * Returns containers ordered by depth (deepest first — for bottom-up walk).
 */
export declare function getContainersBottomUp(): Promise<Array<{
    id: string;
    depth: number;
}>>;
/** Properties for recording human feedback on a pipeline run */
export interface HumanFeedbackProps {
    id: string;
    runId: string;
    verdict: "accept" | "reject" | "partial";
    reason?: string;
    taskVerdicts?: Array<{
        taskId: string;
        verdict: "accept" | "reject";
        reason?: string;
    }>;
}
/** Calibration metrics comparing human verdicts to LLM quality scores */
export interface CalibrationMetrics {
    totalRuns: number;
    accepted: number;
    rejected: number;
    partial: number;
    acceptRate: number;
    /** How often LLM quality > 0.7 matches human accept */
    validatorPrecision: number;
    /** How often human accept matches LLM quality > 0.7 */
    validatorRecall: number;
}
/**
 * Record human feedback for a pipeline run.
 * When verdict is "reject", applies quality penalty to Decision nodes
 * so Thompson posteriors incorporate human signal.
 */
export declare function recordHumanFeedback(props: HumanFeedbackProps): Promise<void>;
/** Get human feedback for a specific run */
export declare function getHumanFeedbackForRun(runId: string): Promise<Neo4jRecord | null>;
/** List pipeline runs that have no human feedback */
export declare function listPendingFeedbackRuns(): Promise<Array<{
    runId: string;
    taskCount: number;
    timestamp: string;
}>>;
/** Compute calibration metrics: human verdict vs LLM quality scores */
export declare function getCalibrationMetrics(): Promise<CalibrationMetrics>;
/** Canonical Architect pipeline stages */
export declare const ARCHITECT_STAGES: readonly ["SURVEY", "DECOMPOSE", "CLASSIFY", "SEQUENCE", "GATE", "DISPATCH", "ADAPT"];
/** Create or update a PipelineRun node */
export declare function createPipelineRun(props: PipelineRunProps): Promise<void>;
/** Update a PipelineRun when it completes */
export declare function completePipelineRun(runId: string, completedAt: string, durationMs: number, overallQuality: number, modelDiversity: number, taskCount?: number): Promise<void>;
/** Get a specific PipelineRun by ID */
export declare function getPipelineRun(runId: string): Promise<Neo4jRecord | null>;
/** List recent PipelineRuns for a Bloom, ordered by startedAt DESC */
export declare function listPipelineRuns(bloomId: string, limit?: number): Promise<Neo4jRecord[]>;
/** Create a TaskOutput node and link to its PipelineRun */
export declare function createTaskOutput(props: TaskOutputProps): Promise<void>;
/** Get all TaskOutputs for a PipelineRun */
export declare function getTaskOutputsForRun(runId: string): Promise<Neo4jRecord[]>;
/** Query TaskOutputs by model pattern with optional quality threshold */
export declare function queryTaskOutputsByModel(modelPattern: string, minQuality?: number): Promise<Neo4jRecord[]>;
/** Ensure the 7 Architect stage Resonators exist and are contained in the Architect Bloom */
export declare function ensureArchitectResonators(architectBloomId: string): Promise<void>;
/** Link a TaskOutput to the Resonator for its assigned stage */
export declare function linkTaskOutputToStage(taskOutputId: string, resonatorId: string): Promise<void>;
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
/**
 * Get ΦL and observation counts for each Architect pipeline stage Resonator.
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
/** Mark a PipelineRun as failed with an error message */
export declare function failPipelineRun(runId: string, error: string): Promise<void>;
/** Update the qualityScore on an existing TaskOutput node */
export declare function updateTaskOutputQuality(taskOutputId: string, qualityScore: number): Promise<void>;
/** Get a single TaskOutput by ID */
export declare function getTaskOutput(taskOutputId: string): Promise<Neo4jRecord | null>;
/** Link a Decision node to the PipelineRun it was made during */
export declare function linkDecisionToPipelineRun(decisionId: string, runId: string): Promise<void>;
/** Get all Decision nodes linked to a PipelineRun */
export declare function getDecisionsForRun(runId: string): Promise<Neo4jRecord[]>;
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
/** Get performance stats per pipeline stage (Resonator-level) */
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
/** @deprecated Use SeedProps */
export type AgentProps = SeedProps;
/** @deprecated Use BloomProps */
export type PatternProps = BloomProps;
/** @deprecated Use createSeed */
export declare const createAgent: typeof createSeed;
/** @deprecated Use getSeed */
export declare const getAgent: typeof getSeed;
/** @deprecated Use listActiveSeeds */
export declare const listActiveAgents: typeof listActiveSeeds;
/** @deprecated Use listActiveSeedsByCapability */
export declare const listActiveAgentsByCapability: typeof listActiveSeedsByCapability;
/** @deprecated Use createBloom */
export declare const createPattern: typeof createBloom;
/** @deprecated Use getBloom */
export declare const getPattern: typeof getBloom;
/** @deprecated Use updateBloomState */
export declare const updatePatternState: typeof updateBloomState;
/** @deprecated Use connectBlooms */
export declare const connectPatterns: typeof connectBlooms;
/** @deprecated Use getBloomDegree */
export declare const getPatternDegree: typeof getBloomDegree;
/** @deprecated Use getBloomAdjacency */
export declare const getPatternAdjacency: typeof getBloomAdjacency;
/** @deprecated Use getBloomsWithHealth */
export declare const getPatternsWithHealth: typeof getBloomsWithHealth;
/** @deprecated Use updateBloomPhiL */
export declare const updatePatternPhiL: typeof updateBloomPhiL;
/** @deprecated Use getObservationsForBloom */
export declare const getObservationsForPattern: typeof getObservationsForBloom;
/** @deprecated Use countObservationsForBloom */
export declare const countObservationsForPattern: typeof countObservationsForBloom;
/**
 * Fetch observations for a bloom in the shape that identifyCompactable() needs.
 * Returns CompactableObservation-shaped data: id, timestamp, signalProcessed,
 * and list of distillation IDs that include this observation via DISTILLED_FROM.
 */
export declare function getCompactableObservations(bloomId: string, limit?: number): Promise<Array<{
    id: string;
    timestamp: Date;
    signalProcessed: boolean;
    includedInDistillationIds: string[];
}>>;
/**
 * Bulk-delete observations by ID list. Used after identifyCompactable()
 * returns the safe-to-remove IDs. DETACH DELETE removes both the node
 * and its relationships.
 */
export declare function deleteObservations(ids: string[]): Promise<number>;
/**
 * Get IDs of active (non-superseded) distillations.
 * A distillation is active if it has no supersededAt property.
 * Used by identifyCompactable() when preserveActiveDistillationSources is true.
 */
export declare function getActiveDistillationIds(bloomId?: string): Promise<Set<string>>;
/**
 * Fetch observations for a bloom with fields needed by distillPerformanceProfile()
 * and distillRoutingHints(). Returns the full observation data — callers map to
 * the specific PerformanceObservation or RoutingObservation shape.
 */
export declare function getObservationsForDistillation(bloomId: string, limit?: number): Promise<Array<{
    id: string;
    timestamp: Date;
    success: boolean;
    qualityScore: number | null;
    durationMs: number | null;
    modelUsed: string | null;
    failureSignature: string | null;
    context: string | null;
}>>;
/** Properties for a structured distillation with performance profile and routing hints */
export interface StructuredDistillationProps {
    id: string;
    bloomId: string;
    confidence: number;
    observationCount: number;
    sourceObservationIds: string[];
    insight: string;
    meanPhiL: number;
    phiLTrend: string;
    phiLVariance: number;
    successRate: number;
    windowStart: string;
    windowEnd: string;
    preferredModels: string;
    avoidModels: string;
}
/**
 * Create a structured distillation node with performance profile and routing hints.
 * Creates DISTILLED_FROM relationships to source observations.
 * Links to the bloom via bloomId property.
 */
export declare function createStructuredDistillation(props: StructuredDistillationProps): Promise<void>;
/**
 * Get distillations for a bloom, ordered by creation date (newest first).
 * Optionally filter for active-only (not superseded).
 */
export declare function getDistillationsForBloom(bloomId: string, activeOnly?: boolean): Promise<Array<{
    id: string;
    confidence: number;
    createdAt: Date;
    supersededAt: Date | null;
    observationCount: number;
    insight: string;
}>>;
/**
 * Mark a distillation as superseded (replaced by a newer one).
 * Sets supersededAt timestamp.
 */
export declare function supersededDistillation(distillationId: string): Promise<void>;
/** Milestone overview entry from the ecosystem graph */
export interface MilestoneOverviewEntry {
    id: string;
    name: string;
    type: "milestone" | "sub-milestone";
    status: string;
    phiL: number;
    sequence: number;
    parentId?: string;
    childCount: number;
    testCount: number;
}
/**
 * Get an overview of all milestones in the ecosystem graph.
 * Returns milestone Blooms with child counts and test counts.
 */
export declare function getMilestoneOverview(): Promise<MilestoneOverviewEntry[]>;
/** Future test entry from the ecosystem graph */
export interface FutureTestEntry {
    id: string;
    name: string;
    status: string;
    suiteId: string;
}
/**
 * Get all future-scoped test Seeds targeting a specific milestone.
 * Returns test Seed nodes connected via SCOPED_TO.
 */
export declare function getFutureTestsForMilestone(milestoneId: string): Promise<FutureTestEntry[]>;
/** Hypothesis status entry from the ecosystem graph */
export interface HypothesisStatusEntry {
    id: string;
    claim: string;
    status: string;
    evidenceStrength: number;
    observesMilestone: string;
}
/**
 * Get all hypothesis Helix nodes with their observed milestone.
 * Returns hypothesis data with OBSERVES relationship targets.
 */
export declare function getHypothesisStatus(): Promise<HypothesisStatusEntry[]>;
/** Grammar element entry from the graph */
export interface GrammarElementEntry {
    id: string;
    seedType: string;
    name: string;
    description: string;
    specSource: string;
    implementationStatus: string;
    implementationNotes: string;
    codeLocation: string | null;
}
/**
 * Get grammar elements, optionally filtered by category (seedType).
 * Answers: "What morphemes/axioms/rules exist and what's their implementation status?"
 */
export declare function getGrammarElements(category?: string): Promise<GrammarElementEntry[]>;
/** Grammar implementation coverage summary */
export interface GrammarCoverageEntry {
    total: number;
    complete: number;
    partial: number;
    typesOnly: number;
    notStarted: number;
    aspirational: number;
}
/**
 * Get implementation coverage summary for all grammar elements.
 * Answers: "How much of the grammar is implemented?"
 */
export declare function getGrammarCoverage(): Promise<GrammarCoverageEntry>;
/** Axiom dependency chain entry */
export interface AxiomDependencyEntry {
    axiomId: string;
    axiomName: string;
    dependsOn: string[];
    dependedOnBy: string[];
}
/**
 * Get axiom dependency chains (DAG).
 * Answers: "What axioms depend on A2 Visible State?"
 */
export declare function getAxiomDependencies(axiomId?: string): Promise<AxiomDependencyEntry[]>;
/** Anti-pattern violation entry */
export interface AntiPatternViolationEntry {
    antiPatternId: string;
    antiPatternName: string;
    violatesAxiom: string;
    violatesAxiomName: string;
    implementationStatus: string;
}
/**
 * Get anti-pattern to axiom VIOLATES mappings.
 * Answers: "Which anti-patterns violate A2?"
 */
export declare function getAntiPatternViolations(axiomId?: string): Promise<AntiPatternViolationEntry[]>;
//# sourceMappingURL=queries.d.ts.map