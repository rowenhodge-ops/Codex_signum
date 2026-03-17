/** State of one endpoint of a Line, assembled from the graph. */
export interface EndpointState {
    id: string;
    content?: string | null;
    status?: string | null;
    phiL?: number | null;
    hasInstantiates: boolean;
    morphemeType: string;
}
/** Layer 1: morpheme hygiene — does the endpoint satisfy its morpheme contract? */
export interface HygieneResult {
    passes: boolean;
    /** Which checks failed (empty if passes) */
    failures: HygieneFailure[];
}
export interface HygieneFailure {
    endpointId: string;
    check: "content" | "status" | "phiL" | "instantiates";
    message: string;
}
/** Layer 2: grammatical shape — is this connection valid for both endpoints? */
export interface ShapeResult {
    passes: boolean;
    reason?: string;
}
/** Layer 3: contextual fitness — dimensional friction */
export interface FitnessResult {
    /** Friction value 0–1. 0 = perfect alignment. 1 = total mismatch. */
    friction: number;
    /** Task classification used for dimensional lookup (if available) */
    taskClass?: string;
}
/** Complete conductivity evaluation for a Line */
export interface ConductivityResult {
    layer1: HygieneResult;
    layer2: ShapeResult;
    layer3: FitnessResult;
    /** Line conducts if Layer 1 AND Layer 2 pass */
    conducts: boolean;
    /** Effective friction: 1.0 if dark (non-conducting), else Layer 3 friction */
    effectiveFriction: number;
    /** Timestamp of evaluation */
    evaluatedAt: Date;
}
/**
 * Layer 1: Check both endpoints satisfy their morpheme contract.
 *
 * Checks per endpoint:
 *   - content is non-empty
 *   - status is present
 *   - phiL is present (not null/undefined)
 *   - INSTANTIATES Line to Constitutional Bloom definition exists
 *
 * All checks are binary. One failure → Layer 1 fails.
 */
export declare function evaluateLayer1(source: EndpointState, target: EndpointState): HygieneResult;
/**
 * Layer 2: Check the connection type is grammatically valid for both endpoints.
 *
 * Uses VALID_CONTAINERS from instantiation.ts for CONTAINS validation.
 * Uses direction rules from G2 for other relationship types.
 *
 *   - CONTAINS: source must be bloom|grid, target type must be in allowed list
 *   - DEPENDS_ON: both must be Blooms (dependency is between scope boundaries)
 *   - INSTANTIATES: target must be a Seed (definition Seed in Constitutional Bloom)
 *   - Other types: pass by default (generic connections)
 */
export declare function evaluateLayer2(source: EndpointState, target: EndpointState, lineType: string): ShapeResult;
/**
 * Layer 3: Compute dimensional friction between endpoints.
 *
 * V1: friction = 1.0 - min(ΦL_source, ΦL_target)
 *
 * When ΦL is null/undefined on either endpoint, default to 0.5 (moderate assumption).
 * Unknown endpoints get moderate friction, not zero or maximum.
 *
 * Returns friction in [0, 1]. Low friction = healthy connection.
 * High friction = compensation candidate.
 */
export declare function evaluateLayer3(source: EndpointState, target: EndpointState, taskClass?: string): FitnessResult;
/**
 * Evaluate conductivity for a Line by composing all three layers.
 *
 * Pure function — takes pre-assembled endpoint state.
 * The graph query to assemble state is separate.
 */
export declare function evaluateConductivity(source: EndpointState, target: EndpointState, lineType: string, taskClass?: string): ConductivityResult;
//# sourceMappingURL=conductivity.d.ts.map