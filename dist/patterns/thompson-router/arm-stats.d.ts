/**
 * Codex Signum — Arm Stats Update (Pure Function)
 *
 * Incremental update of Thompson Sampling arm statistics
 * after an execution outcome. Handles Beta posterior update
 * and EWMA smoothing for duration/quality/cost metrics.
 *
 * @module codex-signum-core/patterns/thompson-router/arm-stats
 */
import type { ArmStats } from "../../graph/queries.js";
/** Outcome record provided by the caller after execution completes. */
export interface OutcomeRecord {
    /** Did the execution succeed? */
    success: boolean;
    /** Wall-clock execution time in milliseconds */
    durationMs: number;
    /** Quality score [0,1] — caller-assessed */
    qualityScore?: number;
    /** Cost of this execution (e.g., API cost) */
    cost?: number;
    /** Error type string if success=false */
    errorType?: string;
    /** Optional notes */
    notes?: string;
    /**
     * Infrastructure failure — the model was not at fault.
     * When true, the Decision node is written for audit trail but
     * alpha/beta posteriors are NOT updated.
     */
    infrastructure?: boolean;
}
/**
 * Update ArmStats after an outcome (pure function).
 *
 * Beta distribution update:
 *   success → alpha += 1  (alpha = successes + 1 prior)
 *   failure → beta  += 1  (beta  = failures  + 1 prior)
 *
 * EWMA update (default λ = 0.1):
 *   avgLatencyMs = λ × durationMs  + (1-λ) × prev
 *   avgQuality   = λ × qualityScore + (1-λ) × prev  (if qualityScore provided)
 *   avgCost      = λ × cost         + (1-λ) × prev  (if cost provided)
 *
 * totalTrials always increments by 1.
 * totalCost accumulates the raw cost.
 */
export declare function updateArmStats(current: ArmStats, outcome: OutcomeRecord, ewmaLambda?: number): ArmStats;
/**
 * Create a fresh ArmStats with uniform Beta(1,1) prior.
 * Used when a seed has no prior observations in a cluster.
 */
export declare function freshArmStats(seedId: string): ArmStats;
//# sourceMappingURL=arm-stats.d.ts.map