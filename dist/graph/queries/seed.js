// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery, writeTransaction } from "../client.js";
// ============ SEED QUERIES ============
export async function createSeed(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`MERGE (s:Seed { id: $id })
       ON CREATE SET
         s.name = $name,
         s.provider = $provider,
         s.model = $model,
         s.baseModelId = $baseModelId,
         s.thinkingMode = $thinkingMode,
         s.thinkingParameter = $thinkingParameter,
         s.capabilities = $capabilities,
         s.supportsAdaptiveThinking = $supportsAdaptiveThinking,
         s.supportsExtendedThinking = $supportsExtendedThinking,
         s.supportsInterleavedThinking = $supportsInterleavedThinking,
         s.supportsPrefilling = $supportsPrefilling,
         s.supportsStructuredOutputs = $supportsStructuredOutputs,
         s.supportsWebSearch = $supportsWebSearch,
         s.supportsComputerUse = $supportsComputerUse,
         s.maxContextWindow = $maxContextWindow,
         s.maxOutputTokens = $maxOutputTokens,
         s.costPer1kInput = $costPer1kInput,
         s.costPer1kOutput = $costPer1kOutput,
         s.avgLatencyMs = $avgLatencyMs,
         s.costPer1kTokens = $costPer1kTokens,
         s.status = $status,
         s.region = $region,
         s.endpoint = $endpoint,
         s.lastProbed = $lastProbed,
         s.lastUsed = $lastUsed,
         s.probeFailures = 0,
         s.createdAt = datetime()
       ON MATCH SET
         s.name = $name,
         s.provider = $provider,
         s.model = $model,
         s.baseModelId = $baseModelId,
         s.thinkingMode = $thinkingMode,
         s.thinkingParameter = COALESCE($thinkingParameter, s.thinkingParameter),
         s.capabilities = COALESCE($capabilities, s.capabilities),
         s.supportsAdaptiveThinking = COALESCE($supportsAdaptiveThinking, s.supportsAdaptiveThinking),
         s.supportsExtendedThinking = COALESCE($supportsExtendedThinking, s.supportsExtendedThinking),
         s.supportsInterleavedThinking = COALESCE($supportsInterleavedThinking, s.supportsInterleavedThinking),
         s.supportsPrefilling = COALESCE($supportsPrefilling, s.supportsPrefilling),
         s.supportsStructuredOutputs = COALESCE($supportsStructuredOutputs, s.supportsStructuredOutputs),
         s.supportsWebSearch = COALESCE($supportsWebSearch, s.supportsWebSearch),
         s.supportsComputerUse = COALESCE($supportsComputerUse, s.supportsComputerUse),
         s.maxContextWindow = COALESCE($maxContextWindow, s.maxContextWindow),
         s.maxOutputTokens = COALESCE($maxOutputTokens, s.maxOutputTokens),
         s.costPer1kInput = COALESCE($costPer1kInput, s.costPer1kInput),
         s.costPer1kOutput = COALESCE($costPer1kOutput, s.costPer1kOutput),
         s.avgLatencyMs = COALESCE($avgLatencyMs, s.avgLatencyMs),
         s.costPer1kTokens = COALESCE($costPer1kTokens, s.costPer1kTokens),
         s.status = COALESCE($status, s.status),
         s.region = COALESCE($region, s.region),
         s.endpoint = COALESCE($endpoint, s.endpoint),
         s.lastProbed = COALESCE($lastProbed, s.lastProbed),
         s.lastUsed = COALESCE($lastUsed, s.lastUsed),
         s.probeFailures = COALESCE($probeFailures, s.probeFailures),
         s.updatedAt = datetime()`, {
            ...props,
            baseModelId: props.baseModelId,
            thinkingMode: props.thinkingMode,
            thinkingParameter: props.thinkingParameter ?? null,
            supportsAdaptiveThinking: props.supportsAdaptiveThinking ?? null,
            supportsExtendedThinking: props.supportsExtendedThinking ?? null,
            supportsInterleavedThinking: props.supportsInterleavedThinking ?? null,
            supportsPrefilling: props.supportsPrefilling ?? null,
            supportsStructuredOutputs: props.supportsStructuredOutputs ?? null,
            supportsWebSearch: props.supportsWebSearch ?? null,
            supportsComputerUse: props.supportsComputerUse ?? null,
            maxContextWindow: props.maxContextWindow ?? null,
            maxOutputTokens: props.maxOutputTokens ?? null,
            costPer1kInput: props.costPer1kInput ?? null,
            costPer1kOutput: props.costPer1kOutput ?? null,
            avgLatencyMs: props.avgLatencyMs ?? null,
            costPer1kTokens: props.costPer1kTokens ?? null,
            status: props.status ?? "active",
            capabilities: props.capabilities ?? [],
            region: props.region ?? null,
            endpoint: props.endpoint ?? null,
            lastProbed: props.lastProbed ?? null,
            lastUsed: props.lastUsed ?? null,
            probeFailures: props.probeFailures ?? null,
        });
    });
}
export async function getSeed(id) {
    const result = await runQuery("MATCH (s:Seed { id: $id }) RETURN s", { id }, "READ");
    return result.records[0] ?? null;
}
export async function listActiveSeeds() {
    const result = await runQuery("MATCH (s:Seed) WHERE s.status = 'active' RETURN s ORDER BY s.avgLatencyMs ASC", {}, "READ");
    return result.records;
}
export async function listActiveSeedsByCapability(requirements) {
    const conditions = ["s.status = 'active'"];
    const params = {};
    if (requirements.supportsAdaptiveThinking) {
        conditions.push("s.supportsAdaptiveThinking = true");
    }
    if (requirements.supportsExtendedThinking) {
        conditions.push("s.supportsExtendedThinking = true");
    }
    if (requirements.supportsInterleavedThinking) {
        conditions.push("s.supportsInterleavedThinking = true");
    }
    if (requirements.supportsStructuredOutputs) {
        conditions.push("s.supportsStructuredOutputs = true");
    }
    if (requirements.maxCostPer1kOutput !== undefined) {
        conditions.push("s.costPer1kOutput <= $maxCost");
        params.maxCost = requirements.maxCostPer1kOutput;
    }
    const result = await runQuery(`MATCH (s:Seed) WHERE ${conditions.join(" AND ")} RETURN s ORDER BY s.avgLatencyMs ASC`, params, "READ");
    return result.records;
}
/** @deprecated Use createSeed */
export const createAgent = createSeed;
/** @deprecated Use getSeed */
export const getAgent = getSeed;
/** @deprecated Use listActiveSeeds */
export const listActiveAgents = listActiveSeeds;
/** @deprecated Use listActiveSeedsByCapability */
export const listActiveAgentsByCapability = listActiveSeedsByCapability;
//# sourceMappingURL=seed.js.map