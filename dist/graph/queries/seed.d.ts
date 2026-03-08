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