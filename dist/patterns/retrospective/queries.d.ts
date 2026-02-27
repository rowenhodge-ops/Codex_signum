/**
 * Retrospective Cypher queries.
 *
 * All executeRead via runQuery(..., "READ") — no writes in this file.
 * Labels and property names verified against actual schema in:
 *   src/graph/queries.ts (Decision, Observation, ContextCluster, Pattern)
 *   src/graph/write-observation.ts (ThresholdEvent)
 *   src/graph/schema.ts (constraints and indexes)
 *
 * Schema notes (verified 2026-02-28):
 *   Decision: status='completed' after outcome recorded, success: boolean
 *   Observation: value (raw), metric, timestamp, retained — NO conditionedValue
 *   ThresholdEvent: patternId, previousBand, newBand, direction, phiLEffective
 *   Pattern: phiL (effective), phiLTrend (from updatePatternPhiL)
 *   ContextCluster: id, taskType, complexity, domain
 *   Relationships: (d)-[:IN_CONTEXT]->(cc), (o)-[:OBSERVED_BY]->(p),
 *                  (te)-[:THRESHOLD_CROSSED_BY]->(p), (d)-[:SELECTED]->(a)
 *
 * @module codex-signum-core/patterns/retrospective/queries
 */
import type { HealthBand } from "../../types/threshold-event.js";
import type { ConvergenceReading, StageReading, DegradationReading } from "./types.js";
/** Overall decision count and success rate in window */
export declare function queryOverallSuccess(windowHours: number): Promise<{
    total: number;
    successRate: number;
}>;
/** Thompson convergence per context cluster */
export declare function queryConvergence(windowHours: number): Promise<ConvergenceReading[]>;
/** Stage-level observation quality per pattern (uses raw value, not conditioned) */
export declare function queryStageHealth(windowHours: number, patternIds: string[] | undefined): Promise<StageReading[]>;
/** ThresholdEvents (degradation) in window */
export declare function queryDegradation(windowHours: number): Promise<DegradationReading[]>;
/** Pure function — classify convergence from metrics */
export declare function deriveConvergenceStatus(decisionCount: number, successRate: number, topAgentSelectionRate: number): ConvergenceReading["status"];
/**
 * Pure function — worst health band from a list.
 * Order: algedonic (worst) → critical → degraded → healthy → trusted → optimal (best)
 */
export declare function worstBand(bands: string[]): HealthBand | "unknown";
//# sourceMappingURL=queries.d.ts.map