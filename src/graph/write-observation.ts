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
 *   3. Persist conditioned values on the Observation node
 *   --- Steps 4-7 require PatternHealthContext (optional) ---
 *   4. computePhiL() -- recompute ΦL composite
 *   5. healthBand() -- classify into 6-band
 *   6. Detect band crossing --> CREATE immutable ThresholdEvent
 *   7. updatePatternPhiL() -- SET health on Pattern node
 *   8. Algedonic ΦL < 0.1 --> propagateDegradation() with dampening
 *
 * When context is omitted, steps 1-3 run (conditioning only).
 * When context is provided, the full chain runs (conditioning + ΦL + cascade).
 *
 * @module codex-signum-core/graph/write-observation
 */

import type { SignalPipeline } from "../signals/SignalPipeline.js";
import type { ConditionedSignal } from "../signals/types.js";
import type { PhiL, PhiLFactors, PhiLState } from "../types/state-dimensions.js";
import type { HealthBand, ThresholdEvent } from "../types/threshold-event.js";
import { conditionValue } from "../computation/condition-value.js";
import { healthBand, bandOrdinal } from "../computation/health-band.js";
import { computePhiL } from "../computation/phi-l.js";
import {
  ALGEDONIC_THRESHOLD,
  propagateDegradation,
} from "../computation/dampening.js";
import {
  propagatePhiLUpward,
  PHI_L_PROPAGATION_NOISE_GATE,
} from "../computation/hierarchical-health.js";
import type {
  PropagationNode,
  PropagationResult,
} from "../computation/dampening.js";
import {
  recordObservation,
  updateBloomPhiL,
  updateObservationConditioned,
} from "./queries.js";
import { writeTransaction } from "./client.js";
import type { ObservationProps } from "./queries.js";

// ============ TYPES ============

/**
 * Context the caller provides about the pattern's current health state.
 *
 * The consumer's graph-feeder already has this data from prior queries.
 * Accepting it here avoids hidden graph queries inside writeObservation,
 * keeping the function testable without mocking the graph layer internals.
 *
 * Optional — when omitted, writeObservation() runs conditioning only
 * (steps 1-3). ΦL recomputation, band classification, and cascade
 * propagation require this context.
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
  /** PhiLState ring buffer for temporal stability persistence (M-22.2) */
  phiLState?: PhiLState;
}

/**
 * Result of a writeObservation call.
 *
 * phiL, band, thresholdEvent, and cascadeResult are null when
 * PatternHealthContext was not provided (conditioning-only mode).
 */
export interface WriteObservationResult {
  /** The conditioned signal from the 7-stage pipeline */
  conditioned: ConditionedSignal;
  /** The recomputed ΦL composite (null when context not provided) */
  phiL: PhiL | null;
  /** Current health band classification (null when context not provided) */
  band: HealthBand | null;
  /** ThresholdEvent if a band crossing was detected, null otherwise */
  thresholdEvent: ThresholdEvent | null;
  /** Cascade propagation result if triggered, null otherwise */
  cascadeResult: PropagationResult | null;
}

// ============ CORE FUNCTION ============

/**
 * Record an observation with inline conditioning and optional ΦL recomputation.
 *
 * This is the single entry point for observation writes. Consumers should
 * use this instead of raw recordObservation().
 *
 * Signal conditioning (7-stage pipeline) ALWAYS runs — this is the M-22.1
 * vertical wiring. Conditioned values are persisted on the Observation node.
 *
 * ΦL recomputation, band classification, and cascade propagation only run
 * when PatternHealthContext is provided. Without context, the function
 * records + conditions the observation and returns.
 *
 * The SignalPipeline instance MUST be reused across calls to maintain
 * EWMA/CUSUM/trend accumulator state.
 *
 * @param observation - Raw observation properties (value = raw metric value)
 * @param pipeline - Signal pipeline instance (caller owns lifecycle, must reuse)
 * @param context - Pattern health context (optional — when provided, full chain runs)
 * @returns WriteObservationResult
 */
export async function writeObservation(
  observation: ObservationProps,
  pipeline: SignalPipeline,
  context?: PatternHealthContext,
): Promise<WriteObservationResult> {
  // Step 1: Record the raw observation in the graph
  await recordObservation(observation);

  // Step 2: Condition the value through the 7-stage signal pipeline (INLINE)
  const conditioned = conditionValue(
    pipeline,
    observation.sourceBloomId,
    observation.metric,
    observation.value,
    context?.topologyRole,
  );

  // Step 3: Persist conditioned values on the Observation node
  await updateObservationConditioned(observation.id, {
    smoothedValue: conditioned.smoothedValue,
    trendSlope: conditioned.trendSlope,
    trendProjection: conditioned.trendProjection,
    cusumStatistic: conditioned.cusumStatistic,
    macdValue: conditioned.macdValue,
    macdSignal: conditioned.macdSignal,
    filtered: conditioned.filtered,
    alertCount: conditioned.alerts.length,
  });

  // --- Without context, conditioning is all we do ---
  if (!context) {
    return {
      conditioned,
      phiL: null,
      band: null,
      thresholdEvent: null,
      cascadeResult: null,
    };
  }

  // Step 4: Recompute ΦL with updated observation count
  const phiL = computePhiL(
    context.factors,
    context.observationCount + 1, // This observation increments the count
    context.connectionCount,
    context.previousPhiL,
  );

  // Step 5: Classify health band (maturity-indexed, 6-band)
  const band = healthBand(phiL.effective, context.maturityIndex);

  // Step 6: Detect band crossing --> write immutable ThresholdEvent
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

  // Step 7: Update bloom's stored ΦL on the Bloom node
  // M-22.2: also persist healthBand (for cross-run band-crossing detection)
  // and updated PhiLState ring buffer (for temporal stability)
  let updatedPhiLStateJson: string | undefined;
  if (context.phiLState) {
    // Push new effective value into ring buffer (immutable update)
    const buf = [...context.phiLState.ringBuffer, phiL.effective];
    if (buf.length > context.phiLState.maxSize) buf.shift();
    const updatedState: PhiLState = { ...context.phiLState, ringBuffer: buf };
    updatedPhiLStateJson = JSON.stringify(updatedState);
  }

  await updateBloomPhiL(
    observation.sourceBloomId,
    phiL.effective,
    phiL.trend,
    band,
    updatedPhiLStateJson,
  );

  // Step 7b: Propagate ΦL change upward through containment hierarchy (M-22.5)
  if (context.previousPhiL !== undefined) {
    const delta = Math.abs(phiL.effective - context.previousPhiL);
    if (delta > PHI_L_PROPAGATION_NOISE_GATE) {
      await propagatePhiLUpward(
        observation.sourceBloomId,
        context.previousPhiL,
        phiL.effective,
      );
    }
  }

  // Step 8: Algedonic cascade -- if ΦL < 0.1, propagate with full severity
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
