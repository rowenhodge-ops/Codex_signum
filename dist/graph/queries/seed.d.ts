import type { Record as Neo4jRecord } from "neo4j-driver";
/** Properties for creating a Seed node (compute substrate — LLM model instance) */
export interface SeedProps {
    id: string;
    name: string;
    provider: string;
    model: string;
    baseModelId: string;
    thinkingMode: "adaptive" | "extended" | "none" | "default";
    thinkingParameter?: string;
    content?: string;
    capabilities?: string[];
    supportsAdaptiveThinking?: boolean;
    supportsExtendedThinking?: boolean;
    supportsInterleavedThinking?: boolean;
    supportsPrefilling?: boolean;
    supportsStructuredOutputs?: boolean;
    supportsWebSearch?: boolean;
    supportsComputerUse?: boolean;
    maxContextWindow?: number;
    maxOutputTokens?: number;
    costPer1kInput?: number;
    costPer1kOutput?: number;
    avgLatencyMs?: number;
    costPer1kTokens?: number;
    status?: "active" | "inactive" | "degraded" | "retired";
    region?: string;
    endpoint?: string;
    lastProbed?: string;
    lastUsed?: string;
    probeFailures?: number;
}
/**
 * Properties for creating a data Seed node.
 * Used for: exit criteria, backlog items, grammar elements, test markers,
 * and any non-substrate Seed that represents data rather than compute.
 *
 * v4.3 §Seed: "Origin, instance, datum, coherent unit."
 * A Seed without content is not a Seed — it's a label (A1 violation).
 */
export interface DataSeedProps {
    id: string;
    name: string;
    seedType: string;
    content: string;
    status: string;
    description?: string;
    phiL?: number;
    [key: string]: unknown;
}
export declare function createSeed(props: SeedProps): Promise<void>;
export declare function getSeed(id: string): Promise<Neo4jRecord | null>;
export declare function listActiveSeeds(): Promise<Neo4jRecord[]>;
export declare function listActiveSeedsByCapability(requirements: {
    supportsAdaptiveThinking?: boolean;
    supportsExtendedThinking?: boolean;
    supportsInterleavedThinking?: boolean;
    supportsStructuredOutputs?: boolean;
    maxCostPer1kOutput?: number;
}): Promise<Neo4jRecord[]>;
/**
 * Create or update a data Seed node.
 * Throws on empty content (A1 violation: a Seed is "a datum, coherent unit").
 */
export declare function createDataSeed(props: DataSeedProps): Promise<void>;
/**
 * Create a data Seed AND wire it to a parent Bloom — atomically in one transaction.
 * G3: containment is parent→child. The parent declares what it contains.
 */
export declare function createContainedDataSeed(props: DataSeedProps, parentBloomId: string, relationship?: 'CONTAINS' | 'SCOPED_TO'): Promise<void>;
/** @deprecated Use SeedProps */
export type AgentProps = SeedProps;
/** @deprecated Use createSeed */
export declare const createAgent: typeof createSeed;
/** @deprecated Use getSeed */
export declare const getAgent: typeof getSeed;
/** @deprecated Use listActiveSeeds */
export declare const listActiveAgents: typeof listActiveSeeds;
/** @deprecated Use listActiveSeedsByCapability */
export declare const listActiveAgentsByCapability: typeof listActiveSeedsByCapability;
//# sourceMappingURL=seed.d.ts.map