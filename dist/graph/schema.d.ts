/**
 * Canonical registry of all relationship types used in the graph.
 * Queries MUST use these constants — never inline relationship type strings.
 * Adding a new relationship type requires adding it here first.
 */
export declare const RELATIONSHIP_TYPES: {
    readonly CONTAINS: "CONTAINS";
    readonly ROUTED_TO: "ROUTED_TO";
    readonly ORIGINATED_FROM: "ORIGINATED_FROM";
    readonly IN_CONTEXT: "IN_CONTEXT";
    readonly DECIDED_DURING: "DECIDED_DURING";
    readonly OBSERVED_IN: "OBSERVED_IN";
    readonly DISTILLED_FROM: "DISTILLED_FROM";
    readonly EXECUTED_IN: "EXECUTED_IN";
    readonly PRODUCED: "PRODUCED";
    readonly PROCESSED: "PROCESSED";
    readonly SCOPED_TO: "SCOPED_TO";
    readonly OBSERVES: "OBSERVES";
    readonly DEPENDS_ON: "DEPENDS_ON";
    readonly VIOLATES: "VIOLATES";
};
export type RelationshipType = typeof RELATIONSHIP_TYPES[keyof typeof RELATIONSHIP_TYPES];
/**
 * Apply the full Codex schema to Neo4j.
 * Idempotent — safe to run multiple times.
 */
export declare function migrateSchema(): Promise<{
    applied: number;
    errors: string[];
}>;
/**
 * M-7C migration: rename pre-Codex node labels to morpheme-native names.
 * Idempotent — safe to run multiple times.
 * Run AFTER migrateSchema() on existing databases.
 *
 * Label renames: Agent → Seed, Pattern → Bloom
 * Relationship renames: SELECTED → ROUTED_TO, MADE_BY → ORIGINATED_FROM, OBSERVED_BY → OBSERVED_IN
 * Property renames: selectedAgentId → selectedSeedId, madeByPatternId → madeByBloomId, sourcePatternId → sourceBloomId
 */
export declare function migrateToMorphemeLabels(): Promise<{
    renamed: string[];
    skipped: string[];
    errors: string[];
}>;
/**
 * Drop legacy pre-M-7C constraints and indexes.
 * Run AFTER migrateToMorphemeLabels() succeeds.
 * Idempotent — safe to run if constraints don't exist.
 */
export declare function cleanupLegacySchema(): Promise<{
    dropped: string[];
    errors: string[];
}>;
/**
 * Verify schema is in place by checking constraint count.
 */
export declare function verifySchema(): Promise<{
    constraintCount: number;
    indexCount: number;
    healthy: boolean;
}>;
/**
 * Seed the graph with foundational constitutional rules.
 * These are the non-negotiable constraints from the spec.
 */
export declare function seedConstitutionalRules(): Promise<number>;
//# sourceMappingURL=schema.d.ts.map