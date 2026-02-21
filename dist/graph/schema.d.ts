/**
 * Codex Signum — Neo4j Schema
 *
 * Node labels, relationships, constraints, and indexes
 * that encode the Codex grammar as a graph structure.
 *
 * "The Neo4j graph is the single source of truth."
 *
 * @see codex-signum-implementation-README.md §TASK 1
 * @module codex-signum-core/graph/schema
 */
/**
 * Apply the full Codex schema to Neo4j.
 * Idempotent — safe to run multiple times.
 */
export declare function migrateSchema(): Promise<{
    applied: number;
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