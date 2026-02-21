import { v4 as uuid } from "uuid";
import { ensureContextCluster, getArmStatsForCluster, listActiveAgents, listActiveAgentsByCapability, recordDecision, } from "../../graph/index.js";
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
    let agentRecords = await listActiveAgentsByCapability(capabilityFilter);
    if (agentRecords.length === 0) {
        const allActive = await listActiveAgents();
        if (allActive.length === 0) {
            throw new Error("No active agents in graph. Run bootstrap first.");
        }
        agentRecords = allActive;
    }
    const models = agentRecords.map((record) => {
        const agent = record.get("a").properties;
        return {
            id: String(agent.id),
            name: String(agent.name ?? agent.id),
            provider: String(agent.provider ?? "unknown"),
            avgLatencyMs: Number(agent.avgLatencyMs ?? 0),
            costPer1kTokens: Number(agent.costPer1kTokens ?? agent.costPer1kOutput ?? agent.costPer1kInput ?? 0),
            capabilities: Array.isArray(agent.capabilities)
                ? agent.capabilities.map((value) => String(value))
                : [],
            status: String(agent.status ?? "active"),
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
        selectedAgentId: decision.selectedModelId,
        madeByPatternId: request.callerPatternId,
        wasExploratory: decision.wasExploratory,
        contextClusterId,
        qualityRequirement: request.qualityRequirement,
        costCeiling: request.costCeiling,
    });
    const selectedAgent = agentRecords.find((record) => String(record.get("a").properties.id) === decision.selectedModelId);
    const agentProps = selectedAgent?.get("a").properties ?? {};
    return {
        selectedAgentId: decision.selectedModelId,
        baseModelId: String(agentProps.baseModelId ?? "") || String(agentProps.model ?? "") || decision.selectedModelId,
        thinkingMode: String(agentProps.thinkingMode ?? "default"),
        thinkingParameter: agentProps.thinkingParameter !== undefined
            ? String(agentProps.thinkingParameter)
            : undefined,
        provider: String(agentProps.provider ?? "unknown"),
        apiModelString: String(agentProps.model ?? "") ||
            String(agentProps.baseModelId ?? "") ||
            decision.selectedModelId,
        wasExploratory: decision.wasExploratory,
        confidence: decision.confidence,
        decisionId,
        contextClusterId: decision.contextClusterId,
        reasoning: decision.reasoning,
    };
}
//# sourceMappingURL=select-model.js.map