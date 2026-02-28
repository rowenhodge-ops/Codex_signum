// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Threshold Event Types
 *
 * ThresholdEvent is an immutable structural record of a health band crossing.
 * Created (never merged) when a pattern's ΦL transitions between health bands.
 *
 * The 6-band classification refines the 3-band classifyPhiLHealth() in
 * adaptive-thresholds.ts by splitting the spectrum into operational-grade
 * bands including the algedonic emergency threshold.
 *
 * @see engineering-bridge-v2.0.md §Part 2 "Adaptive thresholds"
 * @see engineering-bridge-v2.0.md §Part 3 "Algedonic bypass"
 * @module codex-signum-core/types/threshold-event
 */

/**
 * 6-band health classification.
 *
 * Ordered from healthiest to most critical:
 *   optimal > trusted > healthy > degraded > critical > algedonic
 *
 * Band boundaries (maturity-indexed via getThresholds()):
 *   optimal:   ΦL >= 0.9
 *   trusted:   ΦL >= phiL_healthy (maturity-indexed)
 *   healthy:   ΦL >= midpoint(phiL_degraded, phiL_healthy)
 *   degraded:  ΦL >= phiL_degraded (maturity-indexed)
 *   critical:  ΦL >= ALGEDONIC_THRESHOLD (0.1)
 *   algedonic: ΦL < ALGEDONIC_THRESHOLD (0.1)
 */
export type HealthBand =
  | "optimal"
  | "trusted"
  | "healthy"
  | "degraded"
  | "critical"
  | "algedonic";

/**
 * Immutable record of a health band crossing.
 *
 * Written to the graph as a CREATE (never MERGE) -- each crossing
 * is a distinct structural event. Consumers query these for
 * threshold learning data and audit trails.
 */
export interface ThresholdEvent {
  /** Unique event identifier */
  id: string;
  /** Pattern that crossed the threshold */
  patternId: string;
  /** Previous health band before crossing */
  previousBand: HealthBand;
  /** New health band after crossing */
  newBand: HealthBand;
  /** ΦL effective value at the time of crossing */
  phiLEffective: number;
  /** Maturity index at the time of crossing */
  maturityIndex: number;
  /** Direction of crossing */
  direction: "improving" | "degrading";
  /** Timestamp of the crossing event */
  timestamp: Date;
}
