export type MorphemeType = "seed" | "bloom" | "resonator" | "grid" | "helix";
/** Valid Line relationship types and their direction semantics */
declare const VALID_LINE_TYPES: readonly ["CONTAINS", "FLOWS_TO", "INSTANTIATES", "DEPENDS_ON", "OBSERVES", "SCOPED_TO", "VIOLATES", "ROUTED_TO", "ORIGINATED_FROM", "IN_CONTEXT", "DECIDED_DURING", "OBSERVED_IN", "DISTILLED_FROM", "EXECUTED_IN", "PRODUCED", "PROCESSED", "REFERENCES", "SPECIFIED_BY"];
export type LineType = (typeof VALID_LINE_TYPES)[number];
export interface InstantiationResult {
    success: boolean;
    nodeId?: string;
    error?: string;
}
export interface MutationResult {
    success: boolean;
    nodeId?: string;
    error?: string;
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
export declare function instantiateMorpheme(morphemeType: MorphemeType, properties: Record<string, unknown>, parentId: string): Promise<InstantiationResult>;
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
export {};
//# sourceMappingURL=instantiation.d.ts.map