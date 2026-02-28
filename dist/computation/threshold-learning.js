// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
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
export function createThresholdOutcome(thresholdType, thresholdValue, measuredValue, maturityIndex, outcomeType, detail) {
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
export function detectOscillation(recentClassifications, windowMs = 60 * 60 * 1000, minCrossings = 3) {
    if (recentClassifications.length < 2)
        return false;
    // Filter to entries within the time window
    const now = recentClassifications[recentClassifications.length - 1].timestamp.getTime();
    const windowStart = now - windowMs;
    const inWindow = recentClassifications.filter((c) => c.timestamp.getTime() >= windowStart);
    if (inWindow.length < 2)
        return false;
    // Count boundary crossings: consecutive entries with different classifications
    let crossings = 0;
    for (let i = 1; i < inWindow.length; i++) {
        if (inWindow[i].classification !== inWindow[i - 1].classification) {
            crossings++;
        }
    }
    return crossings >= minCrossings;
}
//# sourceMappingURL=threshold-learning.js.map