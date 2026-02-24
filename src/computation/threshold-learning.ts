/**
 * Codex Signum — Threshold Learning Hooks (Pure Computation)
 *
 * "Thresholds are learnable parameters. When a 'healthy' pattern subsequently
 * fails, the threshold was too permissive. When a 'degraded' pattern recovers
 * without intervention, the threshold was too aggressive."
 *
 * This module records outcomes structurally. The actual learning algorithm
 * is future work — but data collection starts NOW so there's something to
 * learn from.
 *
 * Persistence: The consumer calls recordObservation() from graph/queries.ts
 * to persist. Core provides pure computation functions only.
 *
 * @see codex-signum-v3.0.md §State Dimensions
 * @module codex-signum-core/computation/threshold-learning
 */

// ============ TYPES ============

export type ThresholdType =
  | "phiL_healthy"
  | "phiL_degraded"
  | "epsilonR_stable"
  | "psiH_dissonance";

export type ThresholdOutcomeType =
  | "false_positive"
  | "false_negative"
  | "oscillation"
  | "correct";

export interface ThresholdOutcome {
  /** Which threshold was evaluated */
  thresholdType: ThresholdType;
  /** The threshold value at the time */
  thresholdValue: number;
  /** The measured value that was classified */
  measuredValue: number;
  /** The maturity index at the time */
  maturityIndex: number;
  /** What actually happened */
  outcomeType: ThresholdOutcomeType;
  /** When this was recorded */
  timestamp: Date;
  /** Optional detail */
  detail?: string;
}

// ============ RECORDING ============

/**
 * Record a threshold outcome for future calibration learning.
 *
 * - false_positive: flagged as degraded, recovered without intervention
 * - false_negative: rated as healthy, subsequently failed
 * - oscillation: component flapped across threshold boundary 3+ times in window
 * - correct: threshold classification matched actual outcome
 *
 * Records are stored as Observation nodes in the graph with metric="threshold_outcome".
 * This is the data pipeline for the future calibration meta-process.
 */
export function createThresholdOutcome(
  thresholdType: ThresholdType,
  thresholdValue: number,
  measuredValue: number,
  maturityIndex: number,
  outcomeType: ThresholdOutcomeType,
  detail?: string,
): ThresholdOutcome {
  return {
    thresholdType,
    thresholdValue,
    measuredValue,
    maturityIndex,
    outcomeType,
    timestamp: new Date(),
    detail,
  };
}

/**
 * Detect oscillation: a component crossing the same threshold boundary
 * 3+ times within a time window.
 *
 * @param recentClassifications — Time-ordered array of { timestamp, classification }
 * @param windowMs — Time window to check (default: 1 hour)
 * @param minCrossings — Minimum crossings to flag (default: 3)
 */
export function detectOscillation(
  recentClassifications: Array<{ timestamp: Date; classification: string }>,
  windowMs: number = 60 * 60 * 1000,
  minCrossings: number = 3,
): boolean {
  if (recentClassifications.length < 2) return false;

  // Filter to entries within the time window
  const now = recentClassifications[recentClassifications.length - 1].timestamp.getTime();
  const windowStart = now - windowMs;
  const inWindow = recentClassifications.filter(
    (c) => c.timestamp.getTime() >= windowStart,
  );

  if (inWindow.length < 2) return false;

  // Count boundary crossings: consecutive entries with different classifications
  let crossings = 0;
  for (let i = 1; i < inWindow.length; i++) {
    if (inWindow[i].classification !== inWindow[i - 1].classification) {
      crossings++;
    }
  }

  return crossings >= minCrossings;
}
