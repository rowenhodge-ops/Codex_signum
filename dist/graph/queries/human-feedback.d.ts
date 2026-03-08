import type { Record as Neo4jRecord } from "neo4j-driver";
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
//# sourceMappingURL=human-feedback.d.ts.map