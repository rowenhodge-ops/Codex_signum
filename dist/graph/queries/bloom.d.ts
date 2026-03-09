import type { Record as Neo4jRecord } from "neo4j-driver";
/** Properties for creating/updating a Bloom node (scoped composition of morphemes) */
export interface BloomProps {
    id: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    morphemeKinds?: string[];
    domain?: string;
    phiL?: number;
    [key: string]: unknown;
}
export declare function createBloom(props: BloomProps): Promise<void>;
export declare function getBloom(id: string): Promise<Neo4jRecord | null>;
export declare function updateBloomState(id: string, state: string): Promise<void>;
/** Increment bloom connection count and recalculate state */
export declare function connectBlooms(fromId: string, toId: string, relType: string, properties?: Record<string, unknown>): Promise<void>;
/**
 * Get the degree of a bloom node (number of relationships).
 * Used for topology-aware dampening: γ_effective = min(0.7, 0.8/(k-1))
 */
export declare function getBloomDegree(bloomId: string): Promise<number>;
/**
 * Get the adjacency list for blooms.
 * Used for ΨH (spectral analysis) computations.
 */
export declare function getBloomAdjacency(): Promise<Array<{
    from: string;
    to: string;
    weight: number;
}>>;
/**
 * Get all blooms with their phi-L values.
 * Used for Graph Total Variation computation in ΨH.
 */
export declare function getBloomsWithHealth(): Promise<Array<{
    id: string;
    phiL: number;
    state: string;
    degree: number;
}>>;
/**
 * Store computed ΦL on a bloom node.
 */
export declare function updateBloomPhiL(bloomId: string, phiL: number, trend: "improving" | "stable" | "declining"): Promise<void>;
/** @deprecated Use BloomProps */
export type PatternProps = BloomProps;
/** @deprecated Use createBloom */
export declare const createPattern: typeof createBloom;
/** @deprecated Use getBloom */
export declare const getPattern: typeof getBloom;
/** @deprecated Use updateBloomState */
export declare const updatePatternState: typeof updateBloomState;
/** @deprecated Use connectBlooms */
export declare const connectPatterns: typeof connectBlooms;
/** @deprecated Use getBloomDegree */
export declare const getPatternDegree: typeof getBloomDegree;
/** @deprecated Use getBloomAdjacency */
export declare const getPatternAdjacency: typeof getBloomAdjacency;
/** @deprecated Use getBloomsWithHealth */
export declare const getPatternsWithHealth: typeof getBloomsWithHealth;
/** @deprecated Use updateBloomPhiL */
export declare const updatePatternPhiL: typeof updateBloomPhiL;
//# sourceMappingURL=bloom.d.ts.map