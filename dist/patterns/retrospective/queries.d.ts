import type { HealthBand } from "../../types/threshold-event.js";
import type { ConvergenceReading, StageReading, DegradationReading } from "./types.js";
/** Overall decision count and success rate in window */
export declare function queryOverallSuccess(windowHours: number): Promise<{
    total: number;
    successRate: number;
}>;
/** Thompson convergence per context cluster */
export declare function queryConvergence(windowHours: number): Promise<ConvergenceReading[]>;
/** Stage-level observation quality per bloom (uses raw value, not conditioned) */
export declare function queryStageHealth(windowHours: number, bloomIds: string[] | undefined): Promise<StageReading[]>;
/** ThresholdEvents (degradation) in window */
export declare function queryDegradation(windowHours: number): Promise<DegradationReading[]>;
/** Pure function — classify convergence from metrics */
export declare function deriveConvergenceStatus(decisionCount: number, successRate: number, topSeedSelectionRate: number): ConvergenceReading["status"];
/**
 * Pure function — worst health band from a list.
 * Order: algedonic (worst) → critical → degraded → healthy → trusted → optimal (best)
 */
export declare function worstBand(bands: string[]): HealthBand | "unknown";
//# sourceMappingURL=queries.d.ts.map