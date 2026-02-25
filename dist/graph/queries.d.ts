/**
 * Codex Signum — Neo4j Graph Queries
 *
 * Reusable query builders for creating, reading, and relating
 * Codex entities in Neo4j. All state mutations flow through here.
 *
 * @module codex-signum-core/graph/queries
 */
import type { Record as Neo4jRecord } from "neo4j-driver";
/** Properties for creating an Agent node */
export interface AgentProps {
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
/** Properties for creating/updating a Pattern node */
export interface PatternProps {
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
    selectedAgentId: string;
    madeByPatternId?: string;
    wasExploratory: boolean;
    contextClusterId?: string;
    qualityRequirement?: number;
    costCeiling?: number;
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
    sourcePatternId: string;
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
    agentId: string;
    alpha: number;
    beta: number;
    totalTrials: number;
    avgQuality: number;
    avgLatencyMs: number;
    avgCost: number;
    totalCost: number;
}
export declare function createAgent(props: AgentProps): Promise<void>;
export declare function getAgent(id: string): Promise<Neo4jRecord | null>;
export declare function listActiveAgents(): Promise<Neo4jRecord[]>;
export declare function listActiveAgentsByCapability(requirements: {
    supportsAdaptiveThinking?: boolean;
    supportsExtendedThinking?: boolean;
    supportsInterleavedThinking?: boolean;
    supportsStructuredOutputs?: boolean;
    maxCostPer1kOutput?: number;
}): Promise<Neo4jRecord[]>;
export declare function createPattern(props: PatternProps): Promise<void>;
export declare function getPattern(id: string): Promise<Neo4jRecord | null>;
export declare function updatePatternState(id: string, state: string): Promise<void>;
/** Increment pattern connection count and recalculate state */
export declare function connectPatterns(fromId: string, toId: string, relType: string, properties?: Record<string, unknown>): Promise<void>;
export declare function recordDecision(props: DecisionProps): Promise<void>;
export declare function recordDecisionOutcome(props: DecisionOutcomeProps): Promise<void>;
/** Get recent decisions for a context cluster (Thompson Sampling) */
export declare function getDecisionsForCluster(clusterId: string, limit?: number): Promise<Neo4jRecord[]>;
/** Compute Thompson Sampling arm stats for a context cluster */
export declare function getArmStatsForCluster(clusterId: string): Promise<ArmStats[]>;
export declare function recordObservation(props: ObservationProps): Promise<void>;
/** Get observations for ΦL computation — recent, for a given pattern */
export declare function getObservationsForPattern(patternId: string, limit?: number): Promise<Neo4jRecord[]>;
/** Count observations for maturity calculation */
export declare function countObservationsForPattern(patternId: string): Promise<number>;
export declare function createDistillation(props: DistillationProps): Promise<void>;
export declare function ensureContextCluster(props: ContextClusterProps): Promise<void>;
/**
 * Get the degree of a pattern node (number of relationships).
 * Used for topology-aware dampening: γ_effective = min(0.7, 0.8/(k-1))
 */
export declare function getPatternDegree(patternId: string): Promise<number>;
/**
 * Get the adjacency list for patterns.
 * Used for ΨH (spectral analysis) computations.
 */
export declare function getPatternAdjacency(): Promise<Array<{
    from: string;
    to: string;
    weight: number;
}>>;
/**
 * Get all patterns with their phi-L values.
 * Used for Graph Total Variation computation in ΨH.
 */
export declare function getPatternsWithHealth(): Promise<Array<{
    id: string;
    phiL: number;
    state: string;
    degree: number;
}>>;
/**
 * Store computed ΦL on a pattern node.
 */
export declare function updatePatternPhiL(patternId: string, phiL: number, trend: "improving" | "stable" | "degrading"): Promise<void>;
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
//# sourceMappingURL=queries.d.ts.map