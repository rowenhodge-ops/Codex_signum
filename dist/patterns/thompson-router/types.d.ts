/** A model available for routing */
export interface RoutableModel {
    id: string;
    name: string;
    provider: string;
    avgLatencyMs: number;
    costPer1kTokens: number;
    capabilities: string[];
    status: "active" | "inactive" | "degraded" | "retired";
}
/** Context for a routing decision */
export interface RoutingContext {
    taskType: string;
    complexity: "trivial" | "moderate" | "complex" | "critical";
    domain?: string;
    qualityRequirement: number;
    latencyBudgetMs?: number;
    costCeiling?: number;
}
/** Result of a routing decision */
export interface RoutingDecision {
    selectedModelId: string;
    wasExploratory: boolean;
    confidence: number;
    sampledValues: Map<string, number>;
    contextClusterId: string;
    reasoning: string;
}
/** Configuration for the Thompson Router */
export interface ThompsonRouterConfig {
    epsilonFloor: number;
    forceExploreEvery: number;
    qualityFloor: number;
    latencyPenaltyFactor: number;
    costPenaltyFactor: number;
}
/** Default router configuration */
export declare const DEFAULT_ROUTER_CONFIG: ThompsonRouterConfig;
/** Input to selectModel — what the caller needs */
export interface SelectModelRequest {
    taskType: string;
    complexity: "trivial" | "moderate" | "complex" | "critical";
    domain?: string;
    qualityRequirement?: number;
    latencyBudgetMs?: number;
    costCeiling?: number;
    callerPatternId?: string;
    requiresAdaptiveThinking?: boolean;
    requiresExtendedThinking?: boolean;
    requiresInterleavedThinking?: boolean;
    requiresStructuredOutput?: boolean;
    maxCostPer1kOutput?: number;
    /** Pipeline run ID — threaded to Decision node for human feedback */
    runId?: string;
    /** Task ID within the pipeline run */
    taskId?: string;
}
/** Output from selectModel — what the caller gets */
export interface SelectModelResult {
    selectedSeedId: string;
    baseModelId: string;
    thinkingMode: string;
    thinkingParameter?: string;
    provider: string;
    apiModelString: string;
    wasExploratory: boolean;
    confidence: number;
    decisionId: string;
    contextClusterId: string;
    reasoning: string;
    /**
     * Record the outcome of executing against the selected seed.
     * Updates the Decision node with outcome metrics and is idempotent
     * (calling twice is safe — second call is a no-op).
     */
    recordOutcome: (outcome: import("./arm-stats.js").OutcomeRecord) => Promise<void>;
}
//# sourceMappingURL=types.d.ts.map