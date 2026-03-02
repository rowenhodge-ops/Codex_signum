// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Canonical Observation Writer with Inline Conditioning
 *
 * writeObservation() is the single entry point for recording observations
 * with inline health computation. There is no Observer, no collector, no
 * pipeline. These are function calls that happen as part of the write.
 *
 * Flow:
 *   1. Record raw Observation node (with rawValue preserved)
 *   2. conditionValue() -- 7-stage signal pipeline inline
 *   3. computePhiL() -- recompute ΦL composite
 *   4. healthBand() -- classify into 6-band
 *   5. Detect band crossing --> CREATE immutable ThresholdEvent
 *   6. updatePatternPhiL() -- SET health on Pattern node
 *   7. Algedonic ΦL < 0.1 --> propagateDegradation() with dampening
 *
 * @module codex-signum-core/graph/write-observation
 */

import type { SignalPipeline } from "../signals/SignalPipeline.js";
import type { ConditionedSignal } from "../signals/types.js";
import type { PhiL, PhiLFactors } from "../types/state-dimensions.js";
import type { HealthBand, ThresholdEvent } from "../types/threshold-event.js";
import { conditionValue } from "../computation/condition-value.js";
import { healthBand, bandOrdinal } from "../computation/health-band.js";
import { computePhiL } from "../computation/phi-l.js";
import {
  ALGEDONIC_THRESHOLD,
  propagateDegradation,
} from "../computation/dampening.js";
import type {
  PropagationNode,
  PropagationResult,
} from "../computation/dampening.js";
import { recordObservation, updateBloomPhiL } from "./queries.js";
import { writeTransaction } from "./client.js";
import type { ObservationProps } from "./queries.js";

// ============ TYPES ============

/**
 * Context the caller provides about the pattern's current health state.
 *
 * The consumer's graph-feeder already has this data from prior queries.
 * Accepting it here avoids hidden graph queries inside writeObservation,
 * keeping the function testable without mocking the graph layer internals.
 */
export interface PatternHealthContext {
  /** Current ΦL factors for recomputation */
  factors: PhiLFactors;
  /** Number of retained observations (pre-increment; this write adds 1) */
  observationCount: number;
  /** Number of active graph connections */
  connectionCount: number;
  /** Previous ΦL effective value (for trend detection) */
  previousPhiL?: number;
  /** Previous health band (for crossing detection) */
  previousBand?: HealthBand;
  /** Network maturity index (0.0--1.0) */
  maturityIndex: number;
  /** Topology role of this pattern */
  topologyRole?: "leaf" | "hub" | "default";
  /** Pattern degree (for dampening computation) */
  degree: number;
  /** Neighbor map for cascade propagation (required only if algedonic path possible) */
  neighbors?: Map<string, PropagationNode>;
}

/**
 * Result of a writeObservation call.
 */
export interface WriteObservationResult {
  /** The conditioned signal from the 7-stage pipeline */
  conditioned: ConditionedSignal;
  /** The recomputed ΦL composite */
  phiL: PhiL;
  /** Current health band classification */
  band: HealthBand;
  /** ThresholdEvent if a band crossing was detected, null otherwise */
  thresholdEvent: ThresholdEvent | null;
  /** Cascade propagation result if triggered, null otherwise */
  cascadeResult: PropagationResult | null;
}

// ============ CORE FUNCTION ============

/**
 * Record an observation with inline conditioning, ΦL recomputation,
 * band crossing detection, and cascade propagation.
 *
 * This is the canonical write path. Consumers should use this
 * instead of raw recordObservation() + manual health computation.
 *
 * @param observation - Raw observation properties (value = raw metric value)
 * @param context - Pattern health context (caller provides)
 * @param pipeline - Signal pipeline instance (caller owns lifecycle, must reuse)
 * @returns WriteObservationResult
 */
export async function writeObservation(
  observation: ObservationProps,
  context: PatternHealthContext,
  pipeline: SignalPipeline,
): Promise<WriteObservationResult> {
  // Step 1: Record the raw observation in the graph
  await recordObservation(observation);

  // Step 2: Condition the value through the 7-stage signal pipeline (INLINE)
  const conditioned = conditionValue(
    pipeline,
    observation.sourceBloomId,
    observation.metric,
    observation.value,
    context.topologyRole,
  );

  // Step 3: Recompute ΦL with updated observation count
  const phiL = computePhiL(
    context.factors,
    context.observationCount + 1, // This observation increments the count
    context.connectionCount,
    context.previousPhiL,
  );

  // Step 4: Classify health band (maturity-indexed, 6-band)
  const band = healthBand(phiL.effective, context.maturityIndex);

  // Step 5: Detect band crossing --> write immutable ThresholdEvent
  let thresholdEvent: ThresholdEvent | null = null;
  if (context.previousBand !== undefined && context.previousBand !== band) {
    thresholdEvent = await writeThresholdEvent(
      observation.sourceBloomId,
      context.previousBand,
      band,
      phiL.effective,
      context.maturityIndex,
    );
  }

  // Step 6: Update bloom's stored ΦL on the Bloom node
  await updateBloomPhiL(
    observation.sourceBloomId,
    phiL.effective,
    phiL.trend,
  );

  // Step 7: Algedonic cascade -- if ΦL < 0.1, propagate with full severity
  let cascadeResult: PropagationResult | null = null;
  if (
    phiL.effective < ALGEDONIC_THRESHOLD &&
    context.neighbors !== undefined &&
    context.neighbors.size > 0
  ) {
    const severity = (context.previousPhiL ?? 0.5) - phiL.effective;
    if (severity > 0) {
      cascadeResult = propagateDegradation(
        observation.sourceBloomId,
        severity,
        context.neighbors,
      );
    }
  }

  return {
    conditioned,
    phiL,
    band,
    thresholdEvent,
    cascadeResult,
  };
}

// ============ THRESHOLD EVENT ============

/**
 * Create and persist an immutable ThresholdEvent.
 *
 * Uses CREATE (not MERGE) -- each crossing is a distinct structural event.
 * The ThresholdEvent node links to the pattern via THRESHOLD_CROSSED_BY.
 *
 * @param bloomId - Bloom that crossed the threshold
 * @param previousBand - Band before crossing
 * @param newBand - Band after crossing
 * @param phiLEffective - Current ΦL effective value
 * @param maturityIndex - Current maturity index
 * @returns The created ThresholdEvent
 */
export async function writeThresholdEvent(
  bloomId: string,
  previousBand: HealthBand,
  newBand: HealthBand,
  phiLEffective: number,
  maturityIndex: number,
): Promise<ThresholdEvent> {
  const direction: "improving" | "degrading" =
    bandOrdinal(newBand) > bandOrdinal(previousBand)
      ? "improving"
      : "degrading";

  const event: ThresholdEvent = {
    id: `te-${bloomId}-${Date.now()}`,
    bloomId,
    previousBand,
    newBand,
    phiLEffective,
    maturityIndex,
    direction,
    timestamp: new Date(),
  };

  // Write immutable ThresholdEvent node + relationship to Bloom
  await writeTransaction(async (tx) => {
    await tx.run(
      `CREATE (te:ThresholdEvent {
         id: $id,
         bloomId: $bloomId,
         previousBand: $previousBand,
         newBand: $newBand,
         phiLEffective: $phiLEffective,
         maturityIndex: $maturityIndex,
         direction: $direction,
         timestamp: datetime()
       })
       WITH te
       MATCH (b:Bloom { id: $bloomId })
       CREATE (te)-[:THRESHOLD_CROSSED_BY]->(b)`,
      {
        id: event.id,
        bloomId: event.bloomId,
        previousBand: event.previousBand,
        newBand: event.newBand,
        phiLEffective: event.phiLEffective,
        maturityIndex: event.maturityIndex,
        direction: event.direction,
      },
    );
  });

  return event;
}
