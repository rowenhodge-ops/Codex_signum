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
/** Thresholds for upward flow decisions */
const DISTILLATION_THRESHOLD = 10; // observations before first distillation
const DISTILLATION_INTERVAL = 5; // re-distill every N new observations
const INSTITUTIONAL_MIN_DISTILLATIONS = 5;
const INSTITUTIONAL_MIN_CONFIDENCE = 0.7;
/**
 * Compute what upward flow actions should happen after an execution.
 *
 * Upward: execution completes → write observation → check distillation trigger
 *         → check institutional promotion
 */
export function computeUpwardFlow(input) {
    const { execution, existingObservationCount, existingDistillations } = input;
    // Create observation from execution result
    const data = {
        success: execution.success,
        durationMs: execution.durationMs,
        qualityScore: execution.qualityScore,
        modelUsed: execution.modelId,
        context: execution.failureSignature
            ? { failureSignature: execution.failureSignature }
            : execution.context
                ? { context: execution.context }
                : undefined,
    };
    const observation = {
        id: generateId(),
        stratum: 2,
        timestamp: new Date(),
        sourceBloomId: execution.patternId,
        observationType: "execution_outcome",
        data,
    };
    // New count includes this observation
    const newCount = existingObservationCount + 1;
    // Distillation trigger: enough observations accumulated
    const shouldDistill = newCount >= DISTILLATION_THRESHOLD &&
        (existingDistillations.length === 0 ||
            (newCount - DISTILLATION_THRESHOLD) % DISTILLATION_INTERVAL === 0);
    // Institutional promotion: enough distillations with sufficient confidence
    let shouldPromoteToInstitutional = false;
    if (existingDistillations.length >= INSTITUTIONAL_MIN_DISTILLATIONS) {
        const avgConfidence = existingDistillations.reduce((sum, d) => sum + d.confidence, 0) /
            existingDistillations.length;
        shouldPromoteToInstitutional =
            avgConfidence >= INSTITUTIONAL_MIN_CONFIDENCE;
    }
    return {
        observation,
        shouldDistill,
        shouldPromoteToInstitutional,
    };
}
/**
 * Compute the downward flow — synthesize available insights into
 * actionable context for a component.
 *
 * Downward: gather distilled insights + institutional knowledge →
 *           produce enriched context
 */
export function computeDownwardFlow(input) {
    const { componentId, distilledInsights, routingHints, institutionalKnowledge, } = input;
    // Performance summary from distilled insights
    let performanceSummary;
    if (distilledInsights.length === 0) {
        performanceSummary = `No performance data available for ${componentId}`;
    }
    else {
        const latest = distilledInsights[distilledInsights.length - 1];
        performanceSummary =
            `${componentId}: ΦL=${latest.meanPhiL.toFixed(3)} (${latest.phiLTrend}), ` +
                `success=${(latest.successRate * 100).toFixed(0)}%, ` +
                `n=${latest.observationCount}`;
    }
    // Model suggestions from routing hints
    const modelSuggestions = [];
    for (const hints of routingHints) {
        for (const preferred of hints.preferredModels) {
            modelSuggestions.push({
                modelId: preferred.modelId,
                reason: `${(preferred.successRate * 100).toFixed(0)}% success rate over ${preferred.sampleSize} observations`,
            });
        }
    }
    // Known failure modes from performance profiles
    const knownFailureModes = [];
    for (const profile of distilledInsights) {
        for (const failure of profile.commonFailureModes) {
            knownFailureModes.push({
                signature: failure.signature,
                mitigation: `Seen ${failure.frequency.toFixed(1)}/day — consider retry or alternative model`,
            });
        }
    }
    // Threshold hints from institutional knowledge
    const thresholdHints = [];
    for (const ik of institutionalKnowledge) {
        if (ik.knowledgeType === "environment_adaptation") {
            thresholdHints.push({
                threshold: "phiL_healthy",
                suggestedValue: 0.7,
                confidence: ik.confidence,
            });
        }
    }
    // Context confidence based on evidence depth
    const evidenceFactors = [
        distilledInsights.length > 0 ? 0.3 : 0,
        routingHints.length > 0 ? 0.3 : 0,
        institutionalKnowledge.length > 0 ? 0.2 : 0,
        // Bonus for volume
        Math.min(0.2, distilledInsights.reduce((sum, p) => sum + p.observationCount, 0) /
            100 *
            0.2),
    ];
    const contextConfidence = evidenceFactors.reduce((a, b) => a + b, 0);
    return {
        performanceSummary,
        modelSuggestions,
        knownFailureModes,
        thresholdHints,
        contextConfidence,
    };
}
//# sourceMappingURL=flow.js.map