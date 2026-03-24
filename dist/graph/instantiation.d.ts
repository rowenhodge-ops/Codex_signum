export type MorphemeType = "seed" | "bloom" | "resonator" | "grid" | "helix";
/** Valid containment: which types can contain which */
export declare const VALID_CONTAINERS: Record<string, MorphemeType[]>;
/** Valid Line relationship types and their direction semantics */
export declare const VALID_LINE_TYPES: readonly ["CONTAINS", "FLOWS_TO", "INSTANTIATES", "DEPENDS_ON", "OBSERVES", "SCOPED_TO", "VIOLATES", "ROUTED_TO", "ORIGINATED_FROM", "IN_CONTEXT", "DECIDED_DURING", "OBSERVED_IN", "DISTILLED_FROM", "EXECUTED_IN", "PRODUCED", "PROCESSED", "REFERENCES", "SPECIFIED_BY", "SPECIALISES"];
export type LineType = (typeof VALID_LINE_TYPES)[number];
/** Specialisation sub-type for Seeds — adds a secondary Neo4j label */
export type SeedSubType = 'Observation' | 'Decision' | 'TaskOutput' | 'Distillation';
export declare const VALID_SEED_SUBTYPES: readonly string[];
/** Options for seed specialisation (fifth parameter) */
export interface InstantiationOptions {
    /** Secondary Neo4j label for Option B multi-label retyping.
     *  Only valid when morphemeType === 'seed'. */
    subType?: SeedSubType;
}
/** A6 justification for creating a second instance of the same transformation */
export type A6Justification = "distinct_learned_state" | "distinct_governance_scope" | "distinct_temporal_scale";
/** Options for Highlander Protocol enforcement */
export interface HighlanderOptions {
    /** ID of transformation-level or bloom-level definition Seed.
     *  MANDATORY for morphemeType 'resonator' or 'bloom'. */
    transformationDefId?: string;
    /** A6 justification for creating a new instance when one already exists.
     *  If absent and existing instance found → compose (wire FLOWS_TO to existing). */
    a6Justification?: A6Justification;
    /** Source node for compose FLOWS_TO Line.
     *  Required when composition is the outcome (existing found, no justification). */
    requestingContextId?: string;
}
/** Result when composition occurs instead of creation */
export interface ComposeResult {
    composed: true;
    existingId: string;
    existingName: string;
    lineCreated: boolean;
    lineError?: string;
}
export interface InstantiationResult {
    success: boolean;
    nodeId?: string;
    composed?: ComposeResult;
    error?: string;
    /** Gnosis Compliance Evaluation result (if in scope, non-fatal) */
    evaluationResult?: import("../patterns/cognitive/types.js").EvaluationResult;
}
export interface MutationResult {
    success: boolean;
    verified?: boolean;
    nodeId?: string;
    error?: string;
    /** Gnosis Compliance Evaluation result (if in scope, non-fatal) */
    evaluationResult?: import("../patterns/cognitive/types.js").EvaluationResult;
}
export interface LineCreationResult {
    success: boolean;
    sourceId?: string;
    targetId?: string;
    lineType?: string;
    error?: string;
}
/**
 * Create a morpheme instance via the Instantiation Resonator.
 *
 * Atomic transaction: node creation + CONTAINS wiring + INSTANTIATES wiring.
 * Records observation in the Instantiation Resonator's Grid.
 *
 * @param morphemeType - One of: seed, bloom, resonator, grid, helix
 * @param properties - All properties for the node (must include required fields)
 * @param parentId - The Bloom (or Grid for seeds) that will CONTAIN this morpheme
 */
export declare function instantiateMorpheme(morphemeType: MorphemeType, properties: Record<string, unknown>, parentId: string, highlander?: HighlanderOptions, options?: InstantiationOptions): Promise<InstantiationResult>;
/**
 * Update a morpheme's properties via the Mutation Resonator.
 *
 * Preserves required properties, prevents orphaning, maintains provenance.
 * Cannot change morpheme type (INSTANTIATES is preserved).
 *
 * @param nodeId - ID of the morpheme to update
 * @param updates - Properties to update (cannot remove required properties)
 * @param newParentId - Optional: reparent the morpheme (new CONTAINS before old removed)
 */
export declare function updateMorpheme(nodeId: string, updates: Record<string, unknown>, newParentId?: string): Promise<MutationResult>;
/**
 * Create a Line (relationship) via the Line Creation Resonator.
 *
 * Validates endpoint existence, morpheme hygiene, grammatical shape,
 * and direction rules.
 *
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @param lineType - Relationship type (e.g., CONTAINS, FLOWS_TO, DEPENDS_ON)
 * @param properties - Optional properties for the relationship
 */
export declare function createLine(sourceId: string, targetId: string, lineType: LineType, properties?: Record<string, unknown>): Promise<LineCreationResult>;
export interface StampOptions {
    /** The Bloom ID to stamp as complete */
    bloomId: string;
    /** Commit SHA that completed this Bloom */
    commitSha?: string;
    /** Test count at completion */
    testCount?: number;
    /** Force: stamp all non-complete exit criteria as complete first.
     *  Use ONLY when external verification proves they pass (e.g., M-9.V). */
    force?: boolean;
}
export interface StampResult {
    success: boolean;
    verified?: boolean;
    bloomId: string;
    derivedPhiL?: number;
    /** ΨH recomputed on the stamped Bloom after stamp */
    psiH?: {
        combined: number;
        lambda2: number;
        friction: number;
    } | null;
    /** ΨH recomputed on the parent Bloom after stamp */
    parentPsiH?: {
        combined: number;
        lambda2: number;
        friction: number;
    } | null;
    warnings: string[];
    error?: string;
}
/**
 * Stamp a Bloom as complete with structural enforcement.
 *
 * Enforces the three-step stamp protocol from CLAUDE.md:
 * 1. Exit criteria must be complete (or force-stamped)
 * 2. phiL derives from relevant children only (child Blooms + exit-criterion Seeds)
 * 3. Parent status recalculates from children
 *
 * After the stamp, inline state dimension recomputation:
 * - ΦL propagates upward through CONTAINS hierarchy
 * - ΨH recomputes on the stamped Bloom and its parent
 * - εR recomputes for pipeline/pattern Blooms
 * - Event triggers checked
 *
 * All recomputation is NON-FATAL — failures produce warnings, not errors.
 *
 * @see CLAUDE.md §Bloom Stamp Protocol
 */
export declare function stampBloomComplete(options: StampOptions): Promise<StampResult>;
/**
 * Revert a complete Bloom back to active status.
 * Delegates to updateMorpheme() — Step 5 propagates upward.
 */
export declare function revertBloomToActive(bloomId: string): Promise<MutationResult>;
//# sourceMappingURL=instantiation.d.ts.map