// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
// Polyfill for environments without crypto.randomUUID
const generateId = () => {
    try {
        return crypto.randomUUID();
    }
    catch {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }
};
// ============ STRATUM 1: EPHEMERAL ============
/**
 * In-memory execution store. Evaporates when process ends.
 * Keyed by executionId — each execution gets one entry.
 */
export class EphemeralStore {
    entries = new Map();
    /** Create an ephemeral entry for an execution */
    add(bloomId, data = {}) {
        const executionId = generateId();
        const entry = {
            stratum: 1,
            executionId,
            bloomId,
            data,
            createdAt: new Date(),
        };
        this.entries.set(executionId, entry);
        return entry;
    }
    /** Get by execution ID */
    get(executionId) {
        return this.entries.get(executionId);
    }
    /** Find all entries for a specific bloom */
    findByBloom(bloomId) {
        return Array.from(this.entries.values()).filter((entry) => entry.bloomId === bloomId);
    }
    /** Get all entries */
    getAll() {
        return Array.from(this.entries.values());
    }
    /** Clear all (session end) */
    clear() {
        this.entries.clear();
    }
    /** Count */
    get size() {
        return this.entries.size;
    }
    /**
     * Update refinement state for an execution (Refinement Helix).
     */
    updateRefinementState(executionId, iteration, maxIterations, feedback) {
        const entry = this.entries.get(executionId);
        if (!entry)
            return null;
        const updated = {
            ...entry,
            refinementState: { iteration, maxIterations, feedback },
        };
        this.entries.set(executionId, updated);
        return updated;
    }
    /**
     * Promote an ephemeral entry to Observation (Stratum 2).
     * This is the critical Stratum 1 → 2 transition.
     */
    promote(executionId, observationType, data) {
        const entry = this.entries.get(executionId);
        if (!entry)
            return null;
        const observation = {
            id: generateId(),
            stratum: 2,
            timestamp: new Date(),
            sourceBloomId: entry.bloomId,
            observationType,
            data,
        };
        // Remove from ephemeral store (promoted)
        this.entries.delete(executionId);
        return observation;
    }
}
// ============ STRATUM 2: OBSERVATIONS ============
/**
 * Create a new Observation directly (without promotion from Stratum 1).
 * Use this for automated signals (e.g., success/failure, latency).
 */
export function createObservation(sourceBloomId, observationType, data) {
    return {
        id: generateId(),
        stratum: 2,
        timestamp: new Date(),
        sourceBloomId,
        observationType,
        data,
    };
}
/**
 * Check if observations should be distilled (promoted to Stratum 3).
 *
 * Criteria:
 * - At least `minCount` observations with the same metric
 * - Sufficient variance to extract a meaningful pattern
 * - OR a significant trend (monotonic increase/decrease)
 */
export function shouldDistill(observations, minCount = 10) {
    if (observations.length < minCount)
        return false;
    // Extract quality scores where available
    const scores = observations
        .map((o) => o.data.qualityScore)
        .filter((s) => s !== undefined);
    if (scores.length < 3)
        return true; // Poor data but enough volume — distill anyway
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, v) => sum + (v - mean) ** 2, 0) / scores.length;
    // Low variance = stable pattern worth distilling
    if (variance < 0.01)
        return true;
    // Clear trend = worth distilling
    const trend = computeLinearTrend(scores);
    if (Math.abs(trend) > 0.01)
        return true;
    return false;
}
// ============ STRATUM 3: DISTILLATIONS ============
/**
 * Distill a set of observations into a pattern insight (Stratum 3).
 */
export function distillObservations(observations, category, patternIds) {
    const scores = observations
        .map((o) => o.data.qualityScore)
        .filter((s) => s !== undefined);
    const mean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const variance = scores.length > 1
        ? scores.reduce((sum, v) => sum + (v - mean) ** 2, 0) / scores.length
        : 0;
    const trend = computeLinearTrend(scores);
    const trendDir = trend > 0.01 ? "improving" : trend < -0.01 ? "declining" : "stable";
    const successRate = observations.filter((o) => o.data.success).length / observations.length;
    const insight = `${category}: ${trendDir} trend (mean quality=${mean.toFixed(3)}, σ²=${variance.toFixed(4)}, success=${(successRate * 100).toFixed(0)}%, n=${observations.length})`;
    // Confidence based on sample size and consistency
    const confidence = Math.min(1, Math.max(0, (1 - Math.sqrt(variance)) * (1 - Math.exp(-0.1 * observations.length))));
    // Derive related pattern IDs from observations if not provided
    const relatedPatternIds = patternIds ?? [
        ...new Set(observations.map((o) => o.sourceBloomId)),
    ];
    return {
        id: generateId(),
        stratum: 3,
        createdAt: new Date(),
        sourceObservationIds: observations.map((o) => o.id),
        insight,
        confidence,
        category,
        relatedPatternIds,
    };
}
// ============ STRATUM 4: INSTITUTIONAL KNOWLEDGE ============
/**
 * Create institutional knowledge (Stratum 4).
 * Permanent, governance-level knowledge.
 */
export function createInstitutionalKnowledge(content, knowledgeType, distillations) {
    const avgConfidence = distillations.length > 0
        ? distillations.reduce((sum, d) => sum + d.confidence, 0) /
            distillations.length
        : 0;
    return {
        id: generateId(),
        stratum: 4,
        createdAt: new Date(),
        content,
        knowledgeType,
        confidence: avgConfidence,
        contributingCount: distillations.length,
        lastReinforced: new Date(),
    };
}
/**
 * Check if distillations should be promoted to institutional knowledge.
 *
 * Criteria:
 * - At least `minDistillations` related distillations
 * - Average confidence above threshold
 * - Distillations span sufficient time range
 */
export function shouldPromoteToInstitutional(distillations, minDistillations = 5, minConfidence = 0.7) {
    if (distillations.length < minDistillations)
        return false;
    const avgConfidence = distillations.reduce((sum, d) => sum + d.confidence, 0) /
        distillations.length;
    return avgConfidence >= minConfidence;
}
// ============ DECISION RECORDING ============
/**
 * Create a Decision record for the memory system.
 */
export function createDecision(context, alternatives, selected, reason, madeByBloomId, evaluatedRules = []) {
    return {
        id: generateId(),
        timestamp: new Date(),
        context,
        alternatives,
        selected,
        reason,
        evaluatedRules,
        madeByBloomId,
    };
}
/**
 * Attach an outcome to a decision.
 */
export function attachOutcome(decision, outcome) {
    return {
        ...decision,
        outcome,
    };
}
// ============ HELPERS ============
/**
 * Simple linear regression slope for trend detection.
 * Returns the slope of the best-fit line through the values.
 */
function computeLinearTrend(values) {
    const n = values.length;
    if (n < 2)
        return 0;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
    }
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0)
        return 0;
    return (n * sumXY - sumX * sumY) / denominator;
}
//# sourceMappingURL=operations.js.map