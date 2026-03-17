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
import type { PropagationNode, PropagationResult } from "../computation/dampening.js";
import type { ObservationProps } from "./queries.js";
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
export declare function writeObservation(observation: ObservationProps, pipeline: SignalPipeline, context?: PatternHealthContext): Promise<WriteObservationResult>;
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