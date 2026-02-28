// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { conditionValue } from "../computation/condition-value.js";
import { healthBand, bandOrdinal } from "../computation/health-band.js";
import { computePhiL } from "../computation/phi-l.js";
import { ALGEDONIC_THRESHOLD, propagateDegradation, } from "../computation/dampening.js";
import { recordObservation, updatePatternPhiL } from "./queries.js";
import { writeTransaction } from "./client.js";
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
export async function writeObservation(observation, context, pipeline) {
    // Step 1: Record the raw observation in the graph
    await recordObservation(observation);
    // Step 2: Condition the value through the 7-stage signal pipeline (INLINE)
    const conditioned = conditionValue(pipeline, observation.sourcePatternId, observation.metric, observation.value, context.topologyRole);
    // Step 3: Recompute ΦL with updated observation count
    const phiL = computePhiL(context.factors, context.observationCount + 1, // This observation increments the count
    context.connectionCount, context.previousPhiL);
    // Step 4: Classify health band (maturity-indexed, 6-band)
    const band = healthBand(phiL.effective, context.maturityIndex);
    // Step 5: Detect band crossing --> write immutable ThresholdEvent
    let thresholdEvent = null;
    if (context.previousBand !== undefined && context.previousBand !== band) {
        thresholdEvent = await writeThresholdEvent(observation.sourcePatternId, context.previousBand, band, phiL.effective, context.maturityIndex);
    }
    // Step 6: Update pattern's stored ΦL on the Pattern node
    await updatePatternPhiL(observation.sourcePatternId, phiL.effective, phiL.trend);
    // Step 7: Algedonic cascade -- if ΦL < 0.1, propagate with full severity
    let cascadeResult = null;
    if (phiL.effective < ALGEDONIC_THRESHOLD &&
        context.neighbors !== undefined &&
        context.neighbors.size > 0) {
        const severity = (context.previousPhiL ?? 0.5) - phiL.effective;
        if (severity > 0) {
            cascadeResult = propagateDegradation(observation.sourcePatternId, severity, context.neighbors);
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
 * @param patternId - Pattern that crossed the threshold
 * @param previousBand - Band before crossing
 * @param newBand - Band after crossing
 * @param phiLEffective - Current ΦL effective value
 * @param maturityIndex - Current maturity index
 * @returns The created ThresholdEvent
 */
export async function writeThresholdEvent(patternId, previousBand, newBand, phiLEffective, maturityIndex) {
    const direction = bandOrdinal(newBand) > bandOrdinal(previousBand)
        ? "improving"
        : "degrading";
    const event = {
        id: `te-${patternId}-${Date.now()}`,
        patternId,
        previousBand,
        newBand,
        phiLEffective,
        maturityIndex,
        direction,
        timestamp: new Date(),
    };
    // Write immutable ThresholdEvent node + relationship to Pattern
    await writeTransaction(async (tx) => {
        await tx.run(`CREATE (te:ThresholdEvent {
         id: $id,
         patternId: $patternId,
         previousBand: $previousBand,
         newBand: $newBand,
         phiLEffective: $phiLEffective,
         maturityIndex: $maturityIndex,
         direction: $direction,
         timestamp: datetime()
       })
       WITH te
       MATCH (p:Pattern { id: $patternId })
       CREATE (te)-[:THRESHOLD_CROSSED_BY]->(p)`, {
            id: event.id,
            patternId: event.patternId,
            previousBand: event.previousBand,
            newBand: event.newBand,
            phiLEffective: event.phiLEffective,
            maturityIndex: event.maturityIndex,
            direction: event.direction,
        });
    });
    return event;
}
//# sourceMappingURL=write-observation.js.map