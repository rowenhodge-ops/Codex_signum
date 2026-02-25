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
export interface PerformanceProfile {
    componentId: string;
    meanPhiL: number;
    phiLTrend: "improving" | "stable" | "declining";
    phiLVariance: number;
    commonFailureModes: Array<{
        signature: string;
        frequency: number;
        lastSeen: Date;
    }>;
    successRate: number;
    observationCount: number;
    windowStart: Date;
    windowEnd: Date;
}
export interface RoutingHints {
    componentId: string;
    preferredModels: Array<{
        modelId: string;
        successRate: number;
        meanQuality: number;
        sampleSize: number;
    }>;
    avoidModels: Array<{
        modelId: string;
        failureRate: number;
        reason: string;
    }>;
    contextSensitivities: Array<{
        context: string;
        bestModel: string;
        evidence: number;
    }>;
}
export interface ThresholdCalibrationData {
    componentId: string;
    /** False positives: degraded alerts that resolved without intervention */
    falsePositiveRate: number;
    /** False negatives: failures that occurred without prior alert */
    falseNegativeRate: number;
    /** Suggested threshold adjustments based on evidence */
    suggestedAdjustments: Array<{
        threshold: string;
        currentValue: number;
        suggestedValue: number;
        evidence: string;
        confidence: number;
    }>;
}
export interface PerformanceObservation {
    timestamp: Date;
    phiL?: number;
    success: boolean;
    failureSignature?: string;
    qualityScore?: number;
}
export interface RoutingObservation {
    modelId: string;
    success: boolean;
    qualityScore?: number;
    context?: string;
}
export interface ThresholdObservation {
    timestamp: Date;
    phiL?: number;
    alertFired: boolean;
    interventionNeeded: boolean;
}
/**
 * Extract a performance profile from observations.
 * Pure function — observations in, profile out.
 */
export declare function distillPerformanceProfile(componentId: string, observations: PerformanceObservation[]): PerformanceProfile;
/**
 * Extract routing hints from observations with model attribution.
 * Pure function — observations in, hints out.
 */
export declare function distillRoutingHints(componentId: string, observations: RoutingObservation[], minSampleSize?: number): RoutingHints;
/**
 * Extract threshold calibration data from observations + alert history.
 * Pure function — used by threshold-learning.ts from G-6.
 */
export declare function distillThresholdCalibration(componentId: string, observations: ThresholdObservation[]): ThresholdCalibrationData;
//# sourceMappingURL=distillation.d.ts.map