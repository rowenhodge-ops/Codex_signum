/**
 * Retrospective types.
 *
 * runRetrospective() queries the graph and returns structured insights.
 * No LLM. No pipeline. No writes except an optional DistilledInsight node.
 * The graph already contains the answers — this just surfaces them.
 *
 * @module codex-signum-core/patterns/retrospective/types
 */
import type { HealthBand } from "../../types/threshold-event.js";
export interface RetrospectiveOptions {
    /** How far back to query (hours). Default: 24 */
    windowHours?: number;
    /** Limit to specific blooms. Default: all */
    bloomIds?: string[];
    /**
     * If true, write a DistilledInsight node to graph for high-signal findings.
     * Default: false. The caller decides whether to persist insights.
     */
    writeInsights?: boolean;
}
/** Thompson convergence per context cluster */
export interface ConvergenceReading {
    contextClusterId: string;
    decisionCount: number;
    /** successes / total in window */
    successRate: number;
    /** Most-selected seed */
    topSeedId: string;
    /** Fraction of decisions going to top seed */
    topSeedSelectionRate: number;
    /**
     * Converging = success rate high AND top seed stabilising.
     * Diverging = success rate low OR seed churn across decisions.
     */
    status: "converging" | "stable" | "diverging" | "insufficient_data";
}
/** Stage health per bloom */
export interface StageReading {
    bloomId: string;
    stageName: string;
    observationCount: number;
    /** Average raw observation value in window */
    avgValue: number;
    /** Fraction of observations below 0.6 quality */
    refinementRate: number;
}
/** Degradation events in window */
export interface DegradationReading {
    bloomId: string;
    eventCount: number;
    /** Worst band crossed in window */
    lowestBandReached: HealthBand | "unknown";
    /** Did phiL return to previous band by end of window? */
    recovered: boolean;
}
/** Top-level output of runRetrospective() */
export interface RetrospectiveInsights {
    windowHours: number;
    queriedAt: string;
    totalDecisions: number;
    overallSuccessRate: number;
    convergence: ConvergenceReading[];
    stages: StageReading[];
    degradation: DegradationReading[];
    /** IDs of DistilledInsight nodes written, if writeInsights: true */
    insightNodeIds: string[];
}
//# sourceMappingURL=types.d.ts.map