import type { Record as Neo4jRecord } from "neo4j-driver";
/** Properties for creating/updating a Bloom node (scoped composition of morphemes) */
export interface BloomProps {
    id: string;
    name: string;
    type: string;
    status: string;
    content?: string;
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
 *
 * Optional healthBand and phiLState params added for M-22.2:
 * - healthBand: persisted for band-crossing detection across runs
 * - phiLState: JSON-serialised ring buffer for temporal stability
 */
export declare function updateBloomPhiL(bloomId: string, phiL: number, trend: "improving" | "stable" | "declining", healthBandValue?: string, phiLStateJson?: string): Promise<void>;
/**
 * Create a Bloom AND wire it to a parent via the Instantiation Protocol.
 * G3: containment is parent→child. Non-root Blooms MUST have a parent.
 *
 * Delegates to instantiateMorpheme() which enforces:
 * - Morpheme hygiene (all required properties present)
 * - Grammatical shape (parent can contain bloom)
 * - Atomic CONTAINS + INSTANTIATES wiring
 * - Observation recording in the Instantiation Resonator's Grid
 */
export declare function createContainedBloom(props: BloomProps, parentId: string, relationship?: 'CONTAINS' | 'HAS_MILESTONE' | 'HAS_PHASE' | 'HAS_STAGE'): Promise<void>;
/**
 * Update a Bloom's status via the Mutation Resonator with parent status recalculation.
 * G3 health derivation: parent status = f(children), not manual assignment.
 *
 * Delegates to updateMorpheme() which enforces:
 * - Property preservation (cannot remove required properties)
 * - Relationship preservation (INSTANTIATES maintained)
 * - Parent status propagation
 * - Observation recording in the Mutation Resonator's Grid
 */
export declare function updateBloomStatus(bloomId: string, status: string, options?: {
    phiL?: number;
    commitSha?: string;
    testCount?: number;
}): Promise<void>;
/**
 * Persist computed ΨH, temporal decomposition, and PsiHState on a Bloom node.
 * Follows the same JSON-property pattern as updateBloomPhiL for PhiLState.
 */
export declare function updateBloomPsiH(bloomId: string, psiHCombined: number, lambda2: number, friction: number, psiHTrend: number, psiHStateJson: string): Promise<void>;
/**
 * Persist computed εR on a Bloom node.
 * Follows the same property pattern as updateBloomPhiL and updateBloomPsiH.
 */
export declare function updateBloomEpsilonR(bloomId: string, epsilonR: number, range: string, exploratoryCount: number, totalCount: number): Promise<void>;
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