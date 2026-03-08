/** Properties for a Distillation */
export interface DistillationProps {
    id: string;
    pattern: string;
    confidence: number;
    observationCount: number;
    sourceObservationIds: string[];
    insight: string;
}
/** Properties for a structured distillation with performance profile and routing hints */
export interface StructuredDistillationProps {
    id: string;
    bloomId: string;
    confidence: number;
    observationCount: number;
    sourceObservationIds: string[];
    insight: string;
    meanPhiL: number;
    phiLTrend: string;
    phiLVariance: number;
    successRate: number;
    windowStart: string;
    windowEnd: string;
    preferredModels: string;
    avoidModels: string;
}
export declare function createDistillation(props: DistillationProps): Promise<void>;
/**
 * Get IDs of active (non-superseded) distillations.
 * A distillation is active if it has no supersededAt property.
 * Used by identifyCompactable() when preserveActiveDistillationSources is true.
 */
export declare function getActiveDistillationIds(bloomId?: string): Promise<Set<string>>;
/**
 * Create a structured distillation node with performance profile and routing hints.
 * Creates DISTILLED_FROM relationships to source observations.
 * Links to the bloom via bloomId property.
 */
export declare function createStructuredDistillation(props: StructuredDistillationProps): Promise<void>;
/**
 * Get distillations for a bloom, ordered by creation date (newest first).
 * Optionally filter for active-only (not superseded).
 */
export declare function getDistillationsForBloom(bloomId: string, activeOnly?: boolean): Promise<Array<{
    id: string;
    confidence: number;
    createdAt: Date;
    supersededAt: Date | null;
    observationCount: number;
    insight: string;
}>>;
/**
 * Mark a distillation as superseded (replaced by a newer one).
 * Sets supersededAt timestamp.
 */
export declare function supersededDistillation(distillationId: string): Promise<void>;
//# sourceMappingURL=distillation.d.ts.map