import type { Record as Neo4jRecord } from "neo4j-driver";
/** Properties for recording an Observation */
export interface ObservationProps {
    id: string;
    sourceBloomId: string;
    metric: string;
    value: number;
    unit?: string;
    context?: string;
}
export declare function recordObservation(props: ObservationProps): Promise<void>;
/** Get observations for ΦL computation — recent, for a given bloom */
export declare function getObservationsForBloom(bloomId: string, limit?: number): Promise<Neo4jRecord[]>;
/** Count observations for maturity calculation */
export declare function countObservationsForBloom(bloomId: string): Promise<number>;
/**
 * Fetch observations for a bloom in the shape that identifyCompactable() needs.
 * Returns CompactableObservation-shaped data: id, timestamp, signalProcessed,
 * and list of distillation IDs that include this observation via DISTILLED_FROM.
 */
export declare function getCompactableObservations(bloomId: string, limit?: number): Promise<Array<{
    id: string;
    timestamp: Date;
    signalProcessed: boolean;
    includedInDistillationIds: string[];
}>>;
/**
 * Bulk-delete observations by ID list. Used after identifyCompactable()
 * returns the safe-to-remove IDs. DETACH DELETE removes both the node
 * and its relationships.
 */
export declare function deleteObservations(ids: string[]): Promise<number>;
/**
 * Fetch observations for a bloom with fields needed by distillPerformanceProfile()
 * and distillRoutingHints(). Returns the full observation data — callers map to
 * the specific PerformanceObservation or RoutingObservation shape.
 */
export declare function getObservationsForDistillation(bloomId: string, limit?: number): Promise<Array<{
    id: string;
    timestamp: Date;
    success: boolean;
    qualityScore: number | null;
    durationMs: number | null;
    modelUsed: string | null;
    failureSignature: string | null;
    context: string | null;
}>>;
/** @deprecated Use getObservationsForBloom */
export declare const getObservationsForPattern: typeof getObservationsForBloom;
/** @deprecated Use countObservationsForBloom */
export declare const countObservationsForPattern: typeof countObservationsForBloom;
//# sourceMappingURL=observation.d.ts.map