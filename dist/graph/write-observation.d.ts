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
import type { PropagationNode, PropagationResult } from "../computation/dampening.js";
import type { ObservationProps } from "./queries.js";
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
export declare function writeObservation(observation: ObservationProps, context: PatternHealthContext, pipeline: SignalPipeline): Promise<WriteObservationResult>;
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
export declare function writeThresholdEvent(bloomId: string, previousBand: HealthBand, newBand: HealthBand, phiLEffective: number, maturityIndex: number): Promise<ThresholdEvent>;
//# sourceMappingURL=write-observation.d.ts.map