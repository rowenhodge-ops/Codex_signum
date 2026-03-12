// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery, writeTransaction } from "../client.js";
import { instantiateMorpheme, createLine } from "../instantiation.js";
// ============ SEED QUERIES ============
export async function createSeed(props) {
    // A1: auto-derive content from model configuration if not provided
    const content = props.content ?? `${props.provider}/${props.model} [${props.thinkingMode}]`;
    await writeTransaction(async (tx) => {
        await tx.run(`MERGE (s:Seed { id: $id })
       ON CREATE SET
         s.name = $name,
         s.seedType = COALESCE($seedType, 'model'),
         s.content = $content,
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
         s.content = $content,
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
            content,
            seedType: "model",
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
// ============ DATA SEED CREATION (R-39) ============
/**
 * Create or update a data Seed node.
 * Throws on empty content (A1 violation: a Seed is "a datum, coherent unit").
 */
export async function createDataSeed(props) {
    if (!props.content || props.content.trim() === '') {
        throw new Error(`A1 violation: Seed ${props.id} has no content. ` +
            `A Seed is "a datum, coherent unit" — it must contain data.`);
    }
    const { id, name, seedType, content, status, description, phiL, ...rest } = props;
    // Filter out index-signature keys that are already handled
    const extraKeys = Object.keys(rest).filter(k => typeof rest[k] !== 'undefined');
    await writeTransaction(async (tx) => {
        await tx.run(`MERGE (s:Seed { id: $id })
       ON CREATE SET
         s.name = $name,
         s.seedType = $seedType,
         s.content = $content,
         s.status = $status,
         s.description = $description,
         s.phiL = $phiL,
         s.createdAt = datetime()
       ON MATCH SET
         s.name = $name,
         s.content = $content,
         s.status = $status,
         s.description = COALESCE($description, s.description),
         s.phiL = COALESCE($phiL, s.phiL),
         s.updatedAt = datetime()`, { id, name, seedType, content, status, description: description ?? null, phiL: phiL ?? null });
        // Write additional properties if present
        if (extraKeys.length > 0) {
            const safeParams = { id };
            const setClauses = [];
            for (const k of extraKeys) {
                const paramName = `extra_${k}`;
                safeParams[paramName] = rest[k];
                setClauses.push(`s.\`${k}\` = $${paramName}`);
            }
            await tx.run(`MATCH (s:Seed { id: $id }) SET ${setClauses.join(', ')}`, safeParams);
        }
    });
}
/**
 * Create a data Seed AND wire it to a parent Bloom via the Instantiation Protocol.
 * G3: containment is parent→child. The parent declares what it contains.
 *
 * Delegates to instantiateMorpheme() which enforces:
 * - Morpheme hygiene (all required properties present)
 * - Grammatical shape (parent can contain seed)
 * - Atomic CONTAINS + INSTANTIATES wiring
 * - Observation recording in the Instantiation Resonator's Grid
 */
export async function createContainedDataSeed(props, parentBloomId, relationship = 'CONTAINS') {
    if (!props.content || props.content.trim() === '') {
        throw new Error(`A1 violation: Seed ${props.id} has no content. ` +
            `A Seed is "a datum, coherent unit" — it must contain data.`);
    }
    // Delegate to the Instantiation Resonator — CONTAINS + INSTANTIATES wired atomically
    const { id, name, seedType, content, status, description, phiL, ...rest } = props;
    const properties = {
        id, name, seedType, content, status,
        ...(description !== undefined ? { description } : {}),
        ...(phiL !== undefined ? { phiL } : {}),
        ...rest,
    };
    const result = await instantiateMorpheme("seed", properties, parentBloomId);
    if (!result.success) {
        throw new Error(result.error ?? "Instantiation failed");
    }
    // If SCOPED_TO, also create the scoping Line (in addition to CONTAINS from protocol)
    if (relationship === 'SCOPED_TO') {
        const lineResult = await createLine(props.id, parentBloomId, "SCOPED_TO");
        if (!lineResult.success) {
            throw new Error(lineResult.error ?? "SCOPED_TO line creation failed");
        }
    }
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