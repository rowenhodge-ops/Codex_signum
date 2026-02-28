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