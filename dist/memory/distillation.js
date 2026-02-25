/**
 * Codex Signum — Enhanced Distillation
 *
 * Richer distillation that produces actionable insights for routing,
 * threshold calibration, and failure avoidance.
 *
 * Three distillation types:
 * 1. Performance profile — mean ΦL, trend, variance, failure modes
 * 2. Routing hints — which models work well for this pattern/context
 * 3. Threshold calibration — evidence for adaptive threshold adjustment
 *
 * These are COMPLEMENTARY to the existing distillObservations() in operations.ts.
 * They produce structured insights rather than freeform text.
 *
 * @see codex-signum-v3.0.md §Memory Topology, Stratum 3
 * @module codex-signum-core/memory/distillation
 */
// ============ DISTILLATION FUNCTIONS ============
/**
 * Extract a performance profile from observations.
 * Pure function — observations in, profile out.
 */
export function distillPerformanceProfile(componentId, observations) {
    if (observations.length === 0) {
        return {
            componentId,
            meanPhiL: 0,
            phiLTrend: "stable",
            phiLVariance: 0,
            commonFailureModes: [],
            successRate: 0,
            observationCount: 0,
            windowStart: new Date(),
            windowEnd: new Date(),
        };
    }
    // Sort by timestamp for trend computation
    const sorted = [...observations].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    // ΦL statistics
    const phiLValues = sorted
        .map((o) => o.phiL)
        .filter((v) => v !== undefined);
    const meanPhiL = phiLValues.length > 0
        ? phiLValues.reduce((a, b) => a + b, 0) / phiLValues.length
        : 0;
    const phiLVariance = phiLValues.length > 1
        ? phiLValues.reduce((sum, v) => sum + (v - meanPhiL) ** 2, 0) /
            phiLValues.length
        : 0;
    const phiLTrend = computeTrendDirection(phiLValues);
    // Success rate
    const successCount = sorted.filter((o) => o.success).length;
    const successRate = successCount / sorted.length;
    // Failure mode extraction
    const failureCounts = new Map();
    for (const obs of sorted) {
        if (!obs.success && obs.failureSignature) {
            const existing = failureCounts.get(obs.failureSignature);
            if (existing) {
                existing.count++;
                existing.lastSeen = obs.timestamp;
            }
            else {
                failureCounts.set(obs.failureSignature, {
                    count: 1,
                    lastSeen: obs.timestamp,
                });
            }
        }
    }
    const windowStart = sorted[0].timestamp;
    const windowEnd = sorted[sorted.length - 1].timestamp;
    const windowMs = windowEnd.getTime() - windowStart.getTime();
    // Normalize to per-window frequency (avoid division by zero)
    const windowDivisor = windowMs > 0 ? windowMs : 1;
    const commonFailureModes = Array.from(failureCounts.entries())
        .map(([signature, { count, lastSeen }]) => ({
        signature,
        frequency: count / (windowDivisor / (24 * 60 * 60 * 1000)), // per day
        lastSeen,
    }))
        .sort((a, b) => b.frequency - a.frequency);
    return {
        componentId,
        meanPhiL,
        phiLTrend,
        phiLVariance,
        commonFailureModes,
        successRate,
        observationCount: sorted.length,
        windowStart,
        windowEnd,
    };
}
/**
 * Extract routing hints from observations with model attribution.
 * Pure function — observations in, hints out.
 */
export function distillRoutingHints(componentId, observations, minSampleSize = 5) {
    if (observations.length === 0) {
        return {
            componentId,
            preferredModels: [],
            avoidModels: [],
            contextSensitivities: [],
        };
    }
    // Group by model
    const modelStats = new Map();
    for (const obs of observations) {
        let stats = modelStats.get(obs.modelId);
        if (!stats) {
            stats = { successes: 0, total: 0, qualityScores: [] };
            modelStats.set(obs.modelId, stats);
        }
        stats.total++;
        if (obs.success)
            stats.successes++;
        if (obs.qualityScore !== undefined)
            stats.qualityScores.push(obs.qualityScore);
    }
    // Preferred models: high success rate with sufficient sample
    const preferredModels = [];
    const avoidModels = [];
    for (const [modelId, stats] of modelStats) {
        if (stats.total < minSampleSize)
            continue;
        const successRate = stats.successes / stats.total;
        const meanQuality = stats.qualityScores.length > 0
            ? stats.qualityScores.reduce((a, b) => a + b, 0) /
                stats.qualityScores.length
            : 0;
        const failureRate = 1 - successRate;
        if (successRate >= 0.7) {
            preferredModels.push({
                modelId,
                successRate,
                meanQuality,
                sampleSize: stats.total,
            });
        }
        if (failureRate >= 0.5) {
            avoidModels.push({
                modelId,
                failureRate,
                reason: `High failure rate (${(failureRate * 100).toFixed(0)}%) over ${stats.total} observations`,
            });
        }
    }
    // Sort preferred by success rate descending
    preferredModels.sort((a, b) => b.successRate - a.successRate);
    // Context sensitivities: group by context, find best model per context
    const contextModelStats = new Map();
    for (const obs of observations) {
        if (!obs.context)
            continue;
        let contextMap = contextModelStats.get(obs.context);
        if (!contextMap) {
            contextMap = new Map();
            contextModelStats.set(obs.context, contextMap);
        }
        let stats = contextMap.get(obs.modelId);
        if (!stats) {
            stats = { successes: 0, total: 0 };
            contextMap.set(obs.modelId, stats);
        }
        stats.total++;
        if (obs.success)
            stats.successes++;
    }
    const contextSensitivities = [];
    for (const [context, models] of contextModelStats) {
        let bestModel = "";
        let bestRate = -1;
        let bestEvidence = 0;
        for (const [modelId, stats] of models) {
            if (stats.total < Math.max(2, minSampleSize / 2))
                continue;
            const rate = stats.successes / stats.total;
            if (rate > bestRate) {
                bestRate = rate;
                bestModel = modelId;
                bestEvidence = stats.total;
            }
        }
        if (bestModel) {
            contextSensitivities.push({
                context,
                bestModel,
                evidence: bestEvidence,
            });
        }
    }
    return {
        componentId,
        preferredModels,
        avoidModels,
        contextSensitivities,
    };
}
/**
 * Extract threshold calibration data from observations + alert history.
 * Pure function — used by threshold-learning.ts from G-6.
 */
export function distillThresholdCalibration(componentId, observations) {
    if (observations.length === 0) {
        return {
            componentId,
            falsePositiveRate: 0,
            falseNegativeRate: 0,
            suggestedAdjustments: [],
        };
    }
    // False positives: alert fired but no intervention was needed
    const alertsFired = observations.filter((o) => o.alertFired);
    const falsePositives = alertsFired.filter((o) => !o.interventionNeeded);
    const falsePositiveRate = alertsFired.length > 0 ? falsePositives.length / alertsFired.length : 0;
    // False negatives: intervention needed but no alert fired
    const interventionsNeeded = observations.filter((o) => o.interventionNeeded);
    const falseNegatives = interventionsNeeded.filter((o) => !o.alertFired);
    const falseNegativeRate = interventionsNeeded.length > 0
        ? falseNegatives.length / interventionsNeeded.length
        : 0;
    // Suggested adjustments based on ΦL values at alert boundaries
    const suggestedAdjustments = [];
    const phiLValues = observations
        .filter((o) => o.phiL !== undefined)
        .map((o) => ({ phiL: o.phiL, alertFired: o.alertFired, interventionNeeded: o.interventionNeeded }));
    if (phiLValues.length >= 5) {
        // Find ΦL at false positive boundary — alerts that weren't needed
        const fpPhiL = phiLValues
            .filter((o) => o.alertFired && !o.interventionNeeded)
            .map((o) => o.phiL);
        // Find ΦL at false negative boundary — missed interventions
        const fnPhiL = phiLValues
            .filter((o) => !o.alertFired && o.interventionNeeded)
            .map((o) => o.phiL);
        if (fpPhiL.length > 0 && falsePositiveRate > 0.2) {
            const meanFpPhiL = fpPhiL.reduce((a, b) => a + b, 0) / fpPhiL.length;
            suggestedAdjustments.push({
                threshold: "phiL_degraded",
                currentValue: 0.5, // Assumed default — caller should provide actual
                suggestedValue: meanFpPhiL * 0.9, // Lower threshold to reduce false positives
                evidence: `${fpPhiL.length} false positives at mean ΦL=${meanFpPhiL.toFixed(3)}`,
                confidence: Math.min(1, fpPhiL.length / 10),
            });
        }
        if (fnPhiL.length > 0 && falseNegativeRate > 0.2) {
            const meanFnPhiL = fnPhiL.reduce((a, b) => a + b, 0) / fnPhiL.length;
            suggestedAdjustments.push({
                threshold: "phiL_healthy",
                currentValue: 0.7, // Assumed default — caller should provide actual
                suggestedValue: meanFnPhiL * 1.1, // Raise threshold to catch more problems
                evidence: `${fnPhiL.length} false negatives at mean ΦL=${meanFnPhiL.toFixed(3)}`,
                confidence: Math.min(1, fnPhiL.length / 10),
            });
        }
    }
    return {
        componentId,
        falsePositiveRate,
        falseNegativeRate,
        suggestedAdjustments,
    };
}
// ============ HELPERS ============
/**
 * Compute trend direction from a sequence of values.
 * Uses simple linear regression slope.
 */
function computeTrendDirection(values) {
    if (values.length < 2)
        return "stable";
    const n = values.length;
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
        return "stable";
    const slope = (n * sumXY - sumX * sumY) / denominator;
    if (slope > 0.01)
        return "improving";
    if (slope < -0.01)
        return "declining";
    return "stable";
}
//# sourceMappingURL=distillation.js.map