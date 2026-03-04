// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { v4 as uuid } from "uuid";
import { ensureContextCluster, getArmStatsForCluster, listActiveSeeds, listActiveSeedsByCapability, recordDecision, recordDecisionOutcome, } from "../../graph/index.js";
import { buildContextClusterId, route } from "./router.js";
import { DEFAULT_ROUTER_CONFIG } from "./types.js";
/**
 * Select a model for a task.
 */
export async function selectModel(request, config = DEFAULT_ROUTER_CONFIG) {
    const capabilityFilter = {};
    if (request.requiresAdaptiveThinking)
        capabilityFilter.supportsAdaptiveThinking = true;
    if (request.requiresExtendedThinking)
        capabilityFilter.supportsExtendedThinking = true;
    if (request.requiresInterleavedThinking)
        capabilityFilter.supportsInterleavedThinking = true;
    if (request.requiresStructuredOutput)
        capabilityFilter.supportsStructuredOutputs = true;
    if (request.maxCostPer1kOutput !== undefined)
        capabilityFilter.maxCostPer1kOutput = request.maxCostPer1kOutput;
    let seedRecords = await listActiveSeedsByCapability(capabilityFilter);
    if (seedRecords.length === 0) {
        const allActive = await listActiveSeeds();
        if (allActive.length === 0) {
            throw new Error("No active seeds in graph. Run bootstrap first.");
        }
        seedRecords = allActive;
    }
    const models = seedRecords.map((record) => {
        const seed = record.get("s").properties;
        return {
            id: String(seed.id),
            name: String(seed.name ?? seed.id),
            provider: String(seed.provider ?? "unknown"),
            avgLatencyMs: Number(seed.avgLatencyMs ?? 0),
            costPer1kTokens: Number(seed.costPer1kTokens ?? seed.costPer1kOutput ?? seed.costPer1kInput ?? 0),
            capabilities: Array.isArray(seed.capabilities)
                ? seed.capabilities.map((value) => String(value))
                : [],
            status: String(seed.status ?? "active"),
        };
    });
    const context = {
        taskType: request.taskType,
        complexity: request.complexity,
        domain: request.domain,
        qualityRequirement: request.qualityRequirement ?? 0.7,
        latencyBudgetMs: request.latencyBudgetMs,
        costCeiling: request.costCeiling,
    };
    const contextClusterId = buildContextClusterId(context);
    await ensureContextCluster({
        id: contextClusterId,
        taskType: request.taskType,
        complexity: request.complexity,
        domain: request.domain,
    });
    const armStats = await getArmStatsForCluster(contextClusterId);
    const decisionCount = armStats.reduce((sum, stat) => sum + stat.totalTrials, 0);
    const decision = route(context, models, armStats, decisionCount, config);
    const decisionId = `dec_${uuid()}`;
    await recordDecision({
        id: decisionId,
        taskType: request.taskType,
        complexity: request.complexity,
        domain: request.domain,
        selectedSeedId: decision.selectedModelId,
        madeByBloomId: request.callerPatternId,
        wasExploratory: decision.wasExploratory,
        contextClusterId,
        qualityRequirement: request.qualityRequirement,
        costCeiling: request.costCeiling,
        runId: request.runId,
        taskId: request.taskId,
    });
    const selectedSeed = seedRecords.find((record) => String(record.get("s").properties.id) === decision.selectedModelId);
    const seedProps = selectedSeed?.get("s").properties ?? {};
    // Idempotency flag — prevents double-recording in the same session.
    let outcomeRecorded = false;
    const recordOutcome = async (outcome) => {
        if (outcomeRecorded)
            return;
        outcomeRecorded = true;
        await recordDecisionOutcome({
            decisionId,
            success: outcome.success,
            qualityScore: outcome.qualityScore ?? (outcome.success ? 0.5 : 0.0),
            durationMs: outcome.durationMs,
            cost: outcome.cost,
            errorType: outcome.errorType,
            notes: outcome.notes,
        });
    };
    return {
        selectedSeedId: decision.selectedModelId,
        baseModelId: String(seedProps.baseModelId ?? "") || String(seedProps.model ?? "") || decision.selectedModelId,
        thinkingMode: String(seedProps.thinkingMode ?? "default"),
        thinkingParameter: seedProps.thinkingParameter !== undefined
            ? String(seedProps.thinkingParameter)
            : undefined,
        provider: String(seedProps.provider ?? "unknown"),
        apiModelString: String(seedProps.model ?? "") ||
            String(seedProps.baseModelId ?? "") ||
            decision.selectedModelId,
        wasExploratory: decision.wasExploratory,
        confidence: decision.confidence,
        decisionId,
        contextClusterId: decision.contextClusterId,
        reasoning: decision.reasoning,
        recordOutcome,
    };
}
//# sourceMappingURL=select-model.js.map