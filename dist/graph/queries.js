// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery, writeTransaction } from "./client.js";
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
// ============ BLOOM QUERIES ============
export async function createBloom(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`MERGE (b:Bloom { id: $id })
       ON CREATE SET
         b.name = $name,
         b.description = $description,
         b.state = $state,
         b.morphemeKinds = $morphemeKinds,
         b.domain = $domain,
         b.createdAt = datetime(),
         b.observationCount = 0,
         b.connectionCount = 0
       ON MATCH SET
         b.name = $name,
         b.description = $description,
         b.state = $state,
         b.morphemeKinds = $morphemeKinds,
         b.domain = $domain,
         b.updatedAt = datetime()`, {
            ...props,
            description: props.description ?? null,
            state: props.state ?? "created",
            morphemeKinds: props.morphemeKinds ?? [],
            domain: props.domain ?? null,
        });
    });
}
export async function getBloom(id) {
    const result = await runQuery("MATCH (b:Bloom { id: $id }) RETURN b", { id }, "READ");
    return result.records[0] ?? null;
}
export async function updateBloomState(id, state) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (b:Bloom { id: $id })
       SET b.state = $state, b.updatedAt = datetime()`, { id, state });
    });
}
/** Increment bloom connection count and recalculate state */
export async function connectBlooms(fromId, toId, relType, properties) {
    const propsString = properties
        ? `, ${Object.entries(properties)
            .map(([k, v]) => `r.${k} = ${JSON.stringify(v)}`)
            .join(", ")}`
        : "";
    await writeTransaction(async (tx) => {
        // Create the relationship
        await tx.run(`MATCH (a:Bloom { id: $fromId }), (b:Bloom { id: $toId })
       MERGE (a)-[r:${relType}]->(b)
       ON CREATE SET r.createdAt = datetime()${propsString}
       WITH a, b
       SET a.connectionCount = coalesce(a.connectionCount, 0) + 1,
           b.connectionCount = coalesce(b.connectionCount, 0) + 1`, { fromId, toId });
    });
}
// ============ DECISION QUERIES ============
export async function recordDecision(props) {
    await writeTransaction(async (tx) => {
        // Create Decision node
        await tx.run(`CREATE (d:Decision {
         id: $id,
        selectedSeedId: $selectedSeedId,
         taskType: $taskType,
         complexity: $complexity,
         domain: $domain,
         wasExploratory: $wasExploratory,
         qualityRequirement: $qualityRequirement,
         costCeiling: $costCeiling,
         runId: $runId,
         taskId: $taskId,
         timestamp: datetime(),
         status: 'pending'
       })
       WITH d
       MATCH (s:Seed { id: $selectedSeedId })
       MERGE (d)-[:ROUTED_TO]->(s)
       WITH d
       OPTIONAL MATCH (b:Bloom { id: $madeByBloomId })
       FOREACH (_ IN CASE WHEN b IS NOT NULL THEN [1] ELSE [] END |
         MERGE (d)-[:ORIGINATED_FROM]->(b)
       )
       WITH d
       OPTIONAL MATCH (cc:ContextCluster { id: $contextClusterId })
       FOREACH (_ IN CASE WHEN cc IS NOT NULL THEN [1] ELSE [] END |
         MERGE (d)-[:IN_CONTEXT]->(cc)
       )`, {
            ...props,
            domain: props.domain ?? null,
            madeByBloomId: props.madeByBloomId ?? null,
            contextClusterId: props.contextClusterId ?? null,
            qualityRequirement: props.qualityRequirement ?? null,
            costCeiling: props.costCeiling ?? null,
            runId: props.runId ?? null,
            taskId: props.taskId ?? null,
        });
    });
}
export async function recordDecisionOutcome(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (d:Decision { id: $decisionId })
       SET d.status = 'completed',
           d.success = $success,
           d.qualityScore = $qualityScore,
           d.durationMs = $durationMs,
           d.cost = $cost,
           d.inputTokens = $inputTokens,
           d.outputTokens = $outputTokens,
           d.thinkingTokens = $thinkingTokens,
           d.errorType = $errorType,
           d.notes = $notes,
           d.completedAt = datetime()`, {
            ...props,
            cost: props.cost ?? null,
            inputTokens: props.inputTokens ?? null,
            outputTokens: props.outputTokens ?? null,
            thinkingTokens: props.thinkingTokens ?? null,
            errorType: props.errorType ?? null,
            notes: props.notes ?? null,
        });
    });
}
/** Get recent decisions for a context cluster (Thompson Sampling) */
export async function getDecisionsForCluster(clusterId, limit = 100) {
    const result = await runQuery(`MATCH (d:Decision)-[:IN_CONTEXT]->(cc:ContextCluster { id: $clusterId })
     WHERE d.status = 'completed'
     MATCH (d)-[:ROUTED_TO]->(s:Seed)
     RETURN d, s
     ORDER BY d.timestamp DESC
     LIMIT toInteger($limit)`, { clusterId, limit }, "READ");
    return result.records;
}
/** Compute Thompson Sampling arm stats for a context cluster */
export async function getArmStatsForCluster(clusterId) {
    const result = await runQuery(`MATCH (d:Decision)-[:IN_CONTEXT]->(cc:ContextCluster { id: $clusterId })
     WHERE d.status = 'completed'
     MATCH (d)-[:ROUTED_TO]->(s:Seed)
     WITH s,
          count(d) AS totalTrials,
          sum(CASE WHEN d.success THEN 1 ELSE 0 END) AS successes,
          sum(CASE WHEN NOT d.success THEN 1 ELSE 0 END) AS failures,
          avg(COALESCE(d.adjustedQuality, d.qualityScore)) AS avgQuality,
         avg(d.durationMs) AS avgLatencyMs,
         avg(COALESCE(d.cost, 0)) AS avgCost,
         sum(COALESCE(d.cost, 0)) AS totalCost
     RETURN s.id AS seedId,
            successes + 1 AS alpha,
            failures + 1 AS beta,
            totalTrials,
            avgQuality,
           avgLatencyMs,
           avgCost,
           totalCost
     ORDER BY avgQuality DESC`, { clusterId }, "READ");
    return result.records.map((r) => ({
        seedId: r.get("seedId"),
        alpha: r.get("alpha"),
        beta: r.get("beta"),
        totalTrials: r.get("totalTrials"),
        avgQuality: r.get("avgQuality"),
        avgLatencyMs: r.get("avgLatencyMs"),
        avgCost: r.get("avgCost"),
        totalCost: r.get("totalCost"),
    }));
}
// ============ OBSERVATION QUERIES ============
export async function recordObservation(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`CREATE (o:Observation {
         id: $id,
         metric: $metric,
         value: $value,
         unit: $unit,
         context: $context,
         timestamp: datetime(),
         retained: true
       })
       WITH o
       MATCH (b:Bloom { id: $sourceBloomId })
       MERGE (o)-[:OBSERVED_IN]->(b)
       SET b.observationCount = coalesce(b.observationCount, 0) + 1`, {
            ...props,
            unit: props.unit ?? null,
            context: props.context ?? null,
        });
    });
}
/** Get observations for ΦL computation — recent, for a given bloom */
export async function getObservationsForBloom(bloomId, limit = 50) {
    const result = await runQuery(`MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN o
     ORDER BY o.timestamp DESC
     LIMIT $limit`, { bloomId, limit }, "READ");
    return result.records;
}
/** Count observations for maturity calculation */
export async function countObservationsForBloom(bloomId) {
    const result = await runQuery(`MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN count(o) AS count`, { bloomId }, "READ");
    return result.records[0]?.get("count") ?? 0;
}
// ============ DISTILLATION QUERIES ============
export async function createDistillation(props) {
    await writeTransaction(async (tx) => {
        // Create distillation node
        await tx.run(`CREATE (di:Distillation {
         id: $id,
         pattern: $pattern,
         confidence: $confidence,
         observationCount: $observationCount,
         insight: $insight,
         createdAt: datetime()
       })`, props);
        // Link to source observations
        for (const obsId of props.sourceObservationIds) {
            await tx.run(`MATCH (di:Distillation { id: $distId }), (o:Observation { id: $obsId })
         MERGE (di)-[:DISTILLED_FROM]->(o)`, { distId: props.id, obsId });
        }
    });
}
// ============ CONTEXT CLUSTER QUERIES ============
export async function ensureContextCluster(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`MERGE (cc:ContextCluster { id: $id })
       ON CREATE SET
         cc.taskType = $taskType,
         cc.complexity = $complexity,
         cc.domain = $domain,
         cc.createdAt = datetime()`, {
            ...props,
            domain: props.domain ?? null,
        });
    });
}
// ============ TOPOLOGY QUERIES ============
/**
 * Get the degree of a bloom node (number of relationships).
 * Used for topology-aware dampening: γ_effective = min(0.7, 0.8/(k-1))
 */
export async function getBloomDegree(bloomId) {
    const result = await runQuery(`MATCH (b:Bloom { id: $bloomId })
     OPTIONAL MATCH (b)-[r]-()
     RETURN count(r) AS degree`, { bloomId }, "READ");
    return result.records[0]?.get("degree") ?? 0;
}
/**
 * Get the adjacency list for blooms.
 * Used for ΨH (spectral analysis) computations.
 */
export async function getBloomAdjacency() {
    const result = await runQuery(`MATCH (a:Bloom)-[r]->(b:Bloom)
     RETURN a.id AS fromId, b.id AS toId, coalesce(r.weight, 1.0) AS weight`, {}, "READ");
    return result.records.map((rec) => ({
        from: rec.get("fromId"),
        to: rec.get("toId"),
        weight: rec.get("weight"),
    }));
}
/**
 * Get all blooms with their phi-L values.
 * Used for Graph Total Variation computation in ΨH.
 */
export async function getBloomsWithHealth() {
    const result = await runQuery(`MATCH (b:Bloom)
     OPTIONAL MATCH (b)-[r]-()
     WITH b, count(r) AS degree
     RETURN b.id AS id,
            coalesce(b.phiL, 0.5) AS phiL,
            coalesce(b.state, 'created') AS state,
            degree
     ORDER BY b.id`, {}, "READ");
    return result.records.map((rec) => ({
        id: rec.get("id"),
        phiL: rec.get("phiL"),
        state: rec.get("state"),
        degree: rec.get("degree"),
    }));
}
/**
 * Store computed ΦL on a bloom node.
 */
export async function updateBloomPhiL(bloomId, phiL, trend) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (b:Bloom { id: $bloomId })
       SET b.phiL = $phiL,
           b.phiLTrend = $trend,
           b.phiLComputedAt = datetime()`, { bloomId, phiL, trend });
    });
}
// ============ CONTAINMENT HIERARCHY QUERIES ============
/**
 * Get immediate children of a container node.
 * Returns child IDs with their stored ΦL, connection count, observation count, and degree.
 */
export async function getContainedChildren(containerId) {
    const result = await runQuery(`MATCH (parent { id: $containerId })-[:CONTAINS]->(child)
     OPTIONAL MATCH (child)-[r]-()
     WITH child, count(r) AS degree
     RETURN child.id AS id,
            coalesce(child.phiL, 0.5) AS phiL,
            coalesce(child.observationCount, 0) AS observationCount,
            coalesce(child.connectionCount, 0) AS connectionCount,
            degree
     ORDER BY child.id`, { containerId }, "READ");
    return result.records.map((rec) => ({
        id: rec.get("id"),
        phiL: rec.get("phiL"),
        observationCount: rec.get("observationCount"),
        connectionCount: rec.get("connectionCount"),
        degree: rec.get("degree"),
    }));
}
/**
 * Get the full containment tree rooted at a node.
 * Returns { nodeId → parentId } map and leaf nodes.
 * Uses variable-length CONTAINS path traversal.
 * Leaf nodes have no outgoing CONTAINS relationships.
 */
export async function getContainmentTree(rootId) {
    // Get all nodes in the containment tree with their parent
    const result = await runQuery(`MATCH path = (root { id: $rootId })-[:CONTAINS*0..]->(node)
     WITH node,
          CASE WHEN length(path) = 0 THEN null
               ELSE nodes(path)[-2].id
          END AS parentId
     OPTIONAL MATCH (node)-[:CONTAINS]->()
     WITH node.id AS nodeId, parentId, count(*) AS childCount,
          CASE WHEN (node)-[:CONTAINS]->() THEN false ELSE true END AS isLeaf
     RETURN nodeId, parentId, isLeaf
     ORDER BY nodeId`, { rootId }, "READ");
    const parentMap = new Map();
    const leafNodes = [];
    const allNodes = [];
    for (const rec of result.records) {
        const nodeId = rec.get("nodeId");
        const parentId = rec.get("parentId");
        const isLeaf = rec.get("isLeaf");
        parentMap.set(nodeId, parentId);
        allNodes.push(nodeId);
        if (isLeaf) {
            leafNodes.push(nodeId);
        }
    }
    return { parentMap, leafNodes, allNodes };
}
/**
 * Get edges WITHIN a container's subgraph (for ΨH computation at that level).
 * Returns only edges where both endpoints are children of the container.
 */
export async function getSubgraphEdges(containerId) {
    const result = await runQuery(`MATCH (parent { id: $containerId })-[:CONTAINS]->(a),
           (parent)-[:CONTAINS]->(b),
           (a)-[r]->(b)
     WHERE type(r) <> 'CONTAINS'
     RETURN a.id AS fromId, b.id AS toId, coalesce(r.weight, 1.0) AS weight`, { containerId }, "READ");
    return result.records.map((rec) => ({
        from: rec.get("fromId"),
        to: rec.get("toId"),
        weight: rec.get("weight"),
    }));
}
/**
 * Get all container nodes (nodes with outgoing CONTAINS relationships).
 * Returns containers ordered by depth (deepest first — for bottom-up walk).
 */
export async function getContainersBottomUp() {
    // Find all containers and compute their depth from the root.
    // Depth = longest path from any root to this container via CONTAINS.
    // Deepest first enables bottom-up aggregation.
    const result = await runQuery(`MATCH (container)-[:CONTAINS]->()
     WITH DISTINCT container
     OPTIONAL MATCH path = ()-[:CONTAINS*]->(container)
     WITH container.id AS id,
          CASE WHEN path IS NULL THEN 0 ELSE length(path) END AS pathLen
     WITH id, max(pathLen) AS depth
     RETURN id, depth
     ORDER BY depth DESC, id`, {}, "READ");
    return result.records.map((rec) => ({
        id: rec.get("id"),
        depth: rec.get("depth"),
    }));
}
/**
 * Record human feedback for a pipeline run.
 * When verdict is "reject", applies quality penalty to Decision nodes
 * so Thompson posteriors incorporate human signal.
 */
export async function recordHumanFeedback(props) {
    await writeTransaction(async (tx) => {
        // Create HumanFeedback node
        await tx.run(`CREATE (hf:HumanFeedback {
         id: $id,
         runId: $runId,
         verdict: $verdict,
         reason: $reason,
         timestamp: datetime()
       })`, {
            id: props.id,
            runId: props.runId,
            verdict: props.verdict,
            reason: props.reason ?? null,
        });
        // Apply quality penalties based on verdict.
        // Rejection flips d.success to false so Thompson's Beta(alpha, beta)
        // posteriors incorporate the human signal — without this, the 0.5x quality
        // penalty only affected avgQuality (presentation-order), not the actual
        // Beta sampling that drives model selection.
        if (props.verdict === "reject") {
            await tx.run(`MATCH (d:Decision)
         WHERE d.runId = $runId AND d.success = true
         SET d.humanOverride = 'rejected',
             d.success = false,
             d.adjustedQuality = d.qualityScore * 0.5,
             d.humanFeedbackId = $feedbackId`, { runId: props.runId, feedbackId: props.id });
        }
        else if (props.verdict === "accept") {
            // Confirm LLM scores — mark as human-validated
            await tx.run(`MATCH (d:Decision)
         WHERE d.runId = $runId AND d.status = 'completed'
         SET d.humanOverride = 'accepted',
             d.humanFeedbackId = $feedbackId`, { runId: props.runId, feedbackId: props.id });
        }
        // Apply per-task verdicts if provided (for partial feedback)
        if (props.taskVerdicts) {
            for (const tv of props.taskVerdicts) {
                if (tv.verdict === "reject") {
                    await tx.run(`MATCH (d:Decision)
             WHERE d.runId = $runId AND d.taskId = $taskId AND d.success = true
             SET d.humanOverride = 'rejected',
                 d.success = false,
                 d.adjustedQuality = d.qualityScore * 0.5,
                 d.humanFeedbackId = $feedbackId`, { runId: props.runId, taskId: tv.taskId, feedbackId: props.id });
                }
                else {
                    await tx.run(`MATCH (d:Decision)
             WHERE d.runId = $runId AND d.taskId = $taskId
             SET d.humanOverride = 'accepted',
                 d.humanFeedbackId = $feedbackId`, { runId: props.runId, taskId: tv.taskId, feedbackId: props.id });
                }
            }
        }
    });
}
/** Get human feedback for a specific run */
export async function getHumanFeedbackForRun(runId) {
    const result = await runQuery(`MATCH (hf:HumanFeedback { runId: $runId })
     RETURN hf
     ORDER BY hf.timestamp DESC
     LIMIT 1`, { runId }, "READ");
    return result.records[0] ?? null;
}
/** List pipeline runs that have no human feedback */
export async function listPendingFeedbackRuns() {
    const result = await runQuery(`MATCH (d:Decision)
     WHERE d.runId IS NOT NULL AND d.status = 'completed'
     WITH d.runId AS runId, count(d) AS taskCount, max(d.timestamp) AS lastTimestamp
     WHERE NOT EXISTS {
       MATCH (hf:HumanFeedback { runId: runId })
     }
     RETURN runId, taskCount, toString(lastTimestamp) AS timestamp
     ORDER BY lastTimestamp DESC
     LIMIT 20`, {}, "READ");
    return result.records.map((r) => ({
        runId: r.get("runId"),
        taskCount: r.get("taskCount"),
        timestamp: r.get("timestamp"),
    }));
}
/** Compute calibration metrics: human verdict vs LLM quality scores */
export async function getCalibrationMetrics() {
    const result = await runQuery(`MATCH (hf:HumanFeedback)
     WITH hf.verdict AS verdict, count(hf) AS cnt
     RETURN verdict, cnt`, {}, "READ");
    let accepted = 0;
    let rejected = 0;
    let partial = 0;
    for (const r of result.records) {
        const v = r.get("verdict");
        const c = r.get("cnt");
        if (v === "accept")
            accepted = c;
        else if (v === "reject")
            rejected = c;
        else if (v === "partial")
            partial = c;
    }
    const totalRuns = accepted + rejected + partial;
    // Compute validator precision and recall
    // Precision: of decisions where LLM scored quality > 0.7, how many did human accept?
    // Recall: of decisions human accepted, how many had LLM quality > 0.7?
    const precRecall = await runQuery(`MATCH (d:Decision)
     WHERE d.humanOverride IS NOT NULL AND d.qualityScore IS NOT NULL
     WITH d,
          CASE WHEN d.qualityScore > 0.7 THEN true ELSE false END AS llmPositive,
          CASE WHEN d.humanOverride = 'accepted' THEN true ELSE false END AS humanPositive
     RETURN
       sum(CASE WHEN llmPositive AND humanPositive THEN 1 ELSE 0 END) AS truePositive,
       sum(CASE WHEN llmPositive AND NOT humanPositive THEN 1 ELSE 0 END) AS falsePositive,
       sum(CASE WHEN NOT llmPositive AND humanPositive THEN 1 ELSE 0 END) AS falseNegative`, {}, "READ");
    const tp = precRecall.records[0]?.get("truePositive") ?? 0;
    const fp = precRecall.records[0]?.get("falsePositive") ?? 0;
    const fn = precRecall.records[0]?.get("falseNegative") ?? 0;
    return {
        totalRuns,
        accepted,
        rejected,
        partial,
        acceptRate: totalRuns > 0 ? accepted / totalRuns : 0,
        validatorPrecision: tp + fp > 0 ? tp / (tp + fp) : 0,
        validatorRecall: tp + fn > 0 ? tp / (tp + fn) : 0,
    };
}
// ============ PIPELINE TOPOLOGY QUERIES ============
/** Canonical Architect pipeline stages */
export const ARCHITECT_STAGES = [
    "SURVEY",
    "DECOMPOSE",
    "CLASSIFY",
    "SEQUENCE",
    "GATE",
    "DISPATCH",
    "ADAPT",
];
/** Create or update a PipelineRun node */
export async function createPipelineRun(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`MERGE (pr:PipelineRun { id: $id })
       ON CREATE SET
         pr.intent = $intent,
         pr.bloomId = $bloomId,
         pr.taskCount = $taskCount,
         pr.startedAt = $startedAt,
         pr.completedAt = $completedAt,
         pr.durationMs = $durationMs,
         pr.modelDiversity = $modelDiversity,
         pr.overallQuality = $overallQuality,
         pr.status = $status,
         pr.createdAt = datetime()
       ON MATCH SET
         pr.completedAt = COALESCE($completedAt, pr.completedAt),
         pr.durationMs = COALESCE($durationMs, pr.durationMs),
         pr.overallQuality = COALESCE($overallQuality, pr.overallQuality),
         pr.modelDiversity = COALESCE($modelDiversity, pr.modelDiversity),
         pr.status = $status,
         pr.updatedAt = datetime()
       WITH pr
       MATCH (b:Bloom { id: $bloomId })
       MERGE (pr)-[:EXECUTED_IN]->(b)`, {
            ...props,
            completedAt: props.completedAt ?? null,
            durationMs: props.durationMs ?? null,
            modelDiversity: props.modelDiversity ?? null,
            overallQuality: props.overallQuality ?? null,
        });
    });
}
/** Update a PipelineRun when it completes */
export async function completePipelineRun(runId, completedAt, durationMs, overallQuality, modelDiversity, taskCount) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (pr:PipelineRun { id: $runId })
       SET pr.status = 'completed',
           pr.completedAt = $completedAt,
           pr.durationMs = $durationMs,
           pr.overallQuality = $overallQuality,
           pr.modelDiversity = $modelDiversity,
           pr.taskCount = COALESCE($taskCount, pr.taskCount),
           pr.updatedAt = datetime()`, { runId, completedAt, durationMs, overallQuality, modelDiversity, taskCount: taskCount ?? null });
    });
}
/** Get a specific PipelineRun by ID */
export async function getPipelineRun(runId) {
    const result = await runQuery("MATCH (pr:PipelineRun { id: $runId }) RETURN pr", { runId }, "READ");
    return result.records[0] ?? null;
}
/** List recent PipelineRuns for a Bloom, ordered by startedAt DESC */
export async function listPipelineRuns(bloomId, limit = 20) {
    const result = await runQuery(`MATCH (pr:PipelineRun { bloomId: $bloomId })
     RETURN pr
     ORDER BY pr.startedAt DESC
     LIMIT toInteger($limit)`, { bloomId, limit }, "READ");
    return result.records;
}
/** Create a TaskOutput node and link to its PipelineRun */
export async function createTaskOutput(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`CREATE (to:TaskOutput {
         id: $id,
         runId: $runId,
         taskId: $taskId,
         title: $title,
         taskType: $taskType,
         modelUsed: $modelUsed,
         provider: $provider,
         outputLength: $outputLength,
         durationMs: $durationMs,
         qualityScore: $qualityScore,
         hallucinationFlagCount: $hallucinationFlagCount,
         status: $status,
         createdAt: datetime()
       })
       WITH to
       MATCH (pr:PipelineRun { id: $runId })
       MERGE (pr)-[:PRODUCED]->(to)`, {
            ...props,
            qualityScore: props.qualityScore ?? null,
        });
    });
}
/** Get all TaskOutputs for a PipelineRun */
export async function getTaskOutputsForRun(runId) {
    const result = await runQuery(`MATCH (pr:PipelineRun { id: $runId })-[:PRODUCED]->(to:TaskOutput)
     RETURN to
     ORDER BY to.taskId ASC`, { runId }, "READ");
    return result.records;
}
/** Query TaskOutputs by model pattern with optional quality threshold */
export async function queryTaskOutputsByModel(modelPattern, minQuality) {
    const qualityFilter = minQuality !== undefined
        ? " AND to.qualityScore >= $minQuality"
        : "";
    const result = await runQuery(`MATCH (pr:PipelineRun)-[:PRODUCED]->(to:TaskOutput)
     WHERE to.modelUsed CONTAINS $modelPattern${qualityFilter}
     RETURN to, pr
     ORDER BY to.createdAt DESC`, { modelPattern, minQuality: minQuality ?? null }, "READ");
    return result.records;
}
/** Ensure the 7 Architect stage Resonators exist and are contained in the Architect Bloom */
export async function ensureArchitectResonators(architectBloomId) {
    await writeTransaction(async (tx) => {
        for (const stage of ARCHITECT_STAGES) {
            await tx.run(`MERGE (r:Resonator { id: $resonatorId })
         ON CREATE SET
           r.name = $stage,
           r.stage = $stage,
           r.createdAt = datetime()
         WITH r
         MATCH (b:Bloom { id: $bloomId })
         MERGE (b)-[:CONTAINS]->(r)`, {
                resonatorId: `${architectBloomId}_${stage}`,
                stage,
                bloomId: architectBloomId,
            });
        }
    });
}
/** Link a TaskOutput to the Resonator for its assigned stage */
export async function linkTaskOutputToStage(taskOutputId, resonatorId) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (to:TaskOutput { id: $taskOutputId }),
             (r:Resonator { id: $resonatorId })
       MERGE (r)-[:PROCESSED]->(to)`, { taskOutputId, resonatorId });
    });
}
// ============ DECISION LIFECYCLE QUERIES ============
/**
 * Update the qualityScore on an existing Decision node.
 * This is the surgical update path for when the task executor
 * computes real quality after the Thompson router's initial
 * outcome recording (which uses a default 0.7).
 */
export async function updateDecisionQuality(decisionId, qualityScore) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (d:Decision { id: $decisionId })
       SET d.qualityScore = $qualityScore`, { decisionId, qualityScore });
    });
}
/**
 * Find the Decision node that routed a specific task by bloom and model.
 * Returns the Decision ID if found, undefined if not.
 * Uses madeByBloomId + selectedSeedId + timestamp range for matching.
 */
export async function findDecisionForTask(bloomId, modelSeedId, afterTimestamp) {
    const result = await runQuery(`MATCH (d:Decision)
     WHERE d.selectedSeedId = $modelSeedId
       AND ($bloomId IS NULL OR d.madeByBloomId IS NULL OR d.madeByBloomId = $bloomId)
       AND d.timestamp >= datetime($afterTimestamp)
     RETURN d.id AS id
     ORDER BY d.timestamp DESC
     LIMIT 1`, { bloomId: bloomId ?? null, modelSeedId, afterTimestamp }, "READ");
    return result.records[0]?.get("id") ?? undefined;
}
// ============ PIPELINE ANALYTICS QUERIES ============
/**
 * Get ΦL and observation counts for each Architect pipeline stage Resonator.
 * Answers: "which pipeline stage is performing best/worst?"
 */
export async function getPipelineStageHealth(architectBloomId) {
    const result = await runQuery(`MATCH (b:Bloom { id: $bloomId })-[:CONTAINS]->(r:Resonator)
     OPTIONAL MATCH (r)-[:PROCESSED]->(to:TaskOutput)
     RETURN r.name AS stage, r.id AS resonatorId,
            COALESCE(r.phiL, 0.0) AS phiL, count(to) AS observationCount
     ORDER BY r.name`, { bloomId: architectBloomId }, "READ");
    return result.records.map((rec) => ({
        stage: String(rec.get("stage")),
        resonatorId: String(rec.get("resonatorId")),
        phiL: Number(rec.get("phiL")),
        observationCount: Number(rec.get("observationCount")),
    }));
}
/**
 * Get aggregate pipeline run statistics from the graph.
 * Answers: "how is my pipeline performing over time?"
 */
export async function getPipelineRunStats(architectBloomId, limit = 20) {
    const result = await runQuery(`MATCH (pr:PipelineRun)-[:EXECUTED_IN]->(b:Bloom { id: $bloomId })
     WHERE pr.status = 'completed'
     RETURN pr.id AS runId, pr.intent AS intent,
            COALESCE(pr.taskCount, 0) AS taskCount,
            COALESCE(pr.overallQuality, 0.0) AS overallQuality,
            COALESCE(pr.modelDiversity, 0) AS modelDiversity,
            COALESCE(pr.durationMs, 0) AS durationMs,
            pr.startedAt AS startedAt
     ORDER BY pr.startedAt DESC
     LIMIT toInteger($limit)`, { bloomId: architectBloomId, limit }, "READ");
    return result.records.map((rec) => ({
        runId: String(rec.get("runId")),
        intent: String(rec.get("intent")),
        taskCount: Number(rec.get("taskCount")),
        overallQuality: Number(rec.get("overallQuality")),
        modelDiversity: Number(rec.get("modelDiversity")),
        durationMs: Number(rec.get("durationMs")),
        startedAt: String(rec.get("startedAt")),
    }));
}
// ============ PIPELINE LIFECYCLE EXTENSIONS (M-9.5) ============
/** Mark a PipelineRun as failed with an error message */
export async function failPipelineRun(runId, error) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (pr:PipelineRun { id: $runId })
       SET pr.status = 'failed',
           pr.error = $error,
           pr.completedAt = datetime(),
           pr.updatedAt = datetime()`, { runId, error });
    });
}
/** Update the qualityScore on an existing TaskOutput node */
export async function updateTaskOutputQuality(taskOutputId, qualityScore) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (to:TaskOutput { id: $taskOutputId })
       SET to.qualityScore = $qualityScore`, { taskOutputId, qualityScore });
    });
}
/** Get a single TaskOutput by ID */
export async function getTaskOutput(taskOutputId) {
    const result = await runQuery("MATCH (to:TaskOutput { id: $taskOutputId }) RETURN to", { taskOutputId }, "READ");
    return result.records[0] ?? null;
}
/** Link a Decision node to the PipelineRun it was made during */
export async function linkDecisionToPipelineRun(decisionId, runId) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (d:Decision { id: $decisionId }),
             (pr:PipelineRun { id: $runId })
       MERGE (d)-[:DECIDED_DURING]->(pr)`, { decisionId, runId });
    });
}
/** Get all Decision nodes linked to a PipelineRun */
export async function getDecisionsForRun(runId) {
    const result = await runQuery(`MATCH (d:Decision)-[:DECIDED_DURING]->(pr:PipelineRun { id: $runId })
     RETURN d
     ORDER BY d.timestamp ASC`, { runId }, "READ");
    return result.records;
}
/** Get compaction history for a bloom — observation deletion audit trail */
export async function getCompactionHistory(bloomId, limit = 50) {
    const result = await runQuery(`MATCH (di:Distillation)
     WHERE di.bloomId = $bloomId AND di.supersededAt IS NULL
     RETURN di.id AS distillationId,
            di.observationCount AS observationCount,
            di.confidence AS confidence,
            di.createdAt AS createdAt
     ORDER BY di.createdAt DESC
     LIMIT toInteger($limit)`, { bloomId, limit }, "READ");
    return result.records.map((r) => ({
        distillationId: r.get("distillationId"),
        observationCount: Number(r.get("observationCount")),
        confidence: Number(r.get("confidence")),
        createdAt: new Date(r.get("createdAt")),
    }));
}
/** Get aggregate model performance across all pipeline runs */
export async function getModelPerformance(limit = 20) {
    const result = await runQuery(`MATCH (to:TaskOutput)
     WITH to.modelUsed AS modelUsed,
          to.provider AS provider,
          count(to) AS taskCount,
          avg(COALESCE(to.qualityScore, 0.0)) AS avgQuality,
          avg(to.durationMs) AS avgDurationMs,
          toFloat(count(CASE WHEN to.status = 'succeeded' THEN 1 END)) / count(to) AS successRate
     RETURN modelUsed, provider, taskCount, avgQuality, avgDurationMs, successRate
     ORDER BY taskCount DESC
     LIMIT toInteger($limit)`, { limit }, "READ");
    return result.records.map((r) => ({
        modelUsed: String(r.get("modelUsed")),
        provider: String(r.get("provider")),
        taskCount: Number(r.get("taskCount")),
        avgQuality: Number(r.get("avgQuality")),
        avgDurationMs: Number(r.get("avgDurationMs")),
        successRate: Number(r.get("successRate")),
    }));
}
/** Get performance stats per pipeline stage (Resonator-level) */
export async function getStagePerformance(architectBloomId) {
    const result = await runQuery(`MATCH (b:Bloom { id: $bloomId })-[:CONTAINS]->(r:Resonator)-[:PROCESSED]->(to:TaskOutput)
     WITH r.name AS stage,
          count(to) AS taskCount,
          avg(COALESCE(to.qualityScore, 0.0)) AS avgQuality,
          avg(to.durationMs) AS avgDurationMs,
          toFloat(count(CASE WHEN to.status = 'succeeded' THEN 1 END)) / count(to) AS successRate
     RETURN stage, taskCount, avgQuality, avgDurationMs, successRate
     ORDER BY stage`, { bloomId: architectBloomId }, "READ");
    return result.records.map((r) => ({
        stage: String(r.get("stage")),
        taskCount: Number(r.get("taskCount")),
        avgQuality: Number(r.get("avgQuality")),
        avgDurationMs: Number(r.get("avgDurationMs")),
        successRate: Number(r.get("successRate")),
    }));
}
/** Compare two pipeline runs side-by-side */
export async function getRunComparison(runIdA, runIdB) {
    const extractRun = (rec) => {
        if (!rec)
            return null;
        const pr = rec.get("pr");
        return {
            id: String(pr.properties.id),
            intent: String(pr.properties.intent),
            taskCount: Number(pr.properties.taskCount ?? 0),
            overallQuality: Number(pr.properties.overallQuality ?? 0),
            durationMs: Number(pr.properties.durationMs ?? 0),
            status: String(pr.properties.status),
        };
    };
    const resultA = await runQuery("MATCH (pr:PipelineRun { id: $runId }) RETURN pr", { runId: runIdA }, "READ");
    const resultB = await runQuery("MATCH (pr:PipelineRun { id: $runId }) RETURN pr", { runId: runIdB }, "READ");
    return {
        runA: extractRun(resultA.records[0]),
        runB: extractRun(resultB.records[0]),
    };
}
/** @deprecated Use createSeed */
export const createAgent = createSeed;
/** @deprecated Use getSeed */
export const getAgent = getSeed;
/** @deprecated Use listActiveSeeds */
export const listActiveAgents = listActiveSeeds;
/** @deprecated Use listActiveSeedsByCapability */
export const listActiveAgentsByCapability = listActiveSeedsByCapability;
/** @deprecated Use createBloom */
export const createPattern = createBloom;
/** @deprecated Use getBloom */
export const getPattern = getBloom;
/** @deprecated Use updateBloomState */
export const updatePatternState = updateBloomState;
/** @deprecated Use connectBlooms */
export const connectPatterns = connectBlooms;
/** @deprecated Use getBloomDegree */
export const getPatternDegree = getBloomDegree;
/** @deprecated Use getBloomAdjacency */
export const getPatternAdjacency = getBloomAdjacency;
/** @deprecated Use getBloomsWithHealth */
export const getPatternsWithHealth = getBloomsWithHealth;
/** @deprecated Use updateBloomPhiL */
export const updatePatternPhiL = updateBloomPhiL;
/** @deprecated Use getObservationsForBloom */
export const getObservationsForPattern = getObservationsForBloom;
/** @deprecated Use countObservationsForBloom */
export const countObservationsForPattern = countObservationsForBloom;
// ============ MEMORY PERSISTENCE QUERIES (M-9.4) ============
/**
 * Fetch observations for a bloom in the shape that identifyCompactable() needs.
 * Returns CompactableObservation-shaped data: id, timestamp, signalProcessed,
 * and list of distillation IDs that include this observation via DISTILLED_FROM.
 */
export async function getCompactableObservations(bloomId, limit = 500) {
    const result = await runQuery(`MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     OPTIONAL MATCH (di:Distillation)-[:DISTILLED_FROM]->(o)
     WITH o, collect(di.id) AS distillationIds
     RETURN o.id AS id,
            o.timestamp AS timestamp,
            coalesce(o.signalProcessed, false) AS signalProcessed,
            distillationIds
     ORDER BY o.timestamp ASC
     LIMIT $limit`, { bloomId, limit }, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        timestamp: new Date(r.get("timestamp")),
        signalProcessed: r.get("signalProcessed"),
        includedInDistillationIds: r.get("distillationIds").filter((id) => id != null),
    }));
}
/**
 * Bulk-delete observations by ID list. Used after identifyCompactable()
 * returns the safe-to-remove IDs. DETACH DELETE removes both the node
 * and its relationships.
 */
export async function deleteObservations(ids) {
    if (ids.length === 0)
        return 0;
    const result = await writeTransaction(async (tx) => {
        return tx.run(`MATCH (o:Observation)
       WHERE o.id IN $ids
       DETACH DELETE o
       RETURN count(*) AS deleted`, { ids });
    });
    return result.records[0]?.get("deleted") ?? 0;
}
/**
 * Get IDs of active (non-superseded) distillations.
 * A distillation is active if it has no supersededAt property.
 * Used by identifyCompactable() when preserveActiveDistillationSources is true.
 */
export async function getActiveDistillationIds(bloomId) {
    const cypher = bloomId
        ? `MATCH (di:Distillation)
       WHERE di.supersededAt IS NULL AND di.bloomId = $bloomId
       RETURN di.id AS id`
        : `MATCH (di:Distillation)
       WHERE di.supersededAt IS NULL
       RETURN di.id AS id`;
    const result = await runQuery(cypher, { bloomId: bloomId ?? null }, "READ");
    return new Set(result.records.map((r) => r.get("id")));
}
/**
 * Fetch observations for a bloom with fields needed by distillPerformanceProfile()
 * and distillRoutingHints(). Returns the full observation data — callers map to
 * the specific PerformanceObservation or RoutingObservation shape.
 */
export async function getObservationsForDistillation(bloomId, limit = 500) {
    const result = await runQuery(`MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN o.id AS id,
            o.timestamp AS timestamp,
            coalesce(o.success, true) AS success,
            o.qualityScore AS qualityScore,
            o.durationMs AS durationMs,
            o.modelUsed AS modelUsed,
            o.failureSignature AS failureSignature,
            o.context AS context
     ORDER BY o.timestamp ASC
     LIMIT $limit`, { bloomId, limit }, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        timestamp: new Date(r.get("timestamp")),
        success: r.get("success"),
        qualityScore: r.get("qualityScore"),
        durationMs: r.get("durationMs"),
        modelUsed: r.get("modelUsed"),
        failureSignature: r.get("failureSignature"),
        context: r.get("context"),
    }));
}
/**
 * Create a structured distillation node with performance profile and routing hints.
 * Creates DISTILLED_FROM relationships to source observations.
 * Links to the bloom via bloomId property.
 */
export async function createStructuredDistillation(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`CREATE (di:Distillation {
         id: $id,
         bloomId: $bloomId,
         confidence: $confidence,
         observationCount: $observationCount,
         insight: $insight,
         meanPhiL: $meanPhiL,
         phiLTrend: $phiLTrend,
         phiLVariance: $phiLVariance,
         successRate: $successRate,
         windowStart: $windowStart,
         windowEnd: $windowEnd,
         preferredModels: $preferredModels,
         avoidModels: $avoidModels,
         createdAt: datetime()
       })`, props);
        // Create DISTILLED_FROM relationships to source observations
        if (props.sourceObservationIds.length > 0) {
            await tx.run(`MATCH (di:Distillation { id: $distId })
         UNWIND $obsIds AS obsId
         MATCH (o:Observation { id: obsId })
         MERGE (di)-[:DISTILLED_FROM]->(o)`, { distId: props.id, obsIds: props.sourceObservationIds });
        }
    });
}
/**
 * Get distillations for a bloom, ordered by creation date (newest first).
 * Optionally filter for active-only (not superseded).
 */
export async function getDistillationsForBloom(bloomId, activeOnly = false) {
    const whereClause = activeOnly
        ? "WHERE di.bloomId = $bloomId AND di.supersededAt IS NULL"
        : "WHERE di.bloomId = $bloomId";
    const result = await runQuery(`MATCH (di:Distillation)
     ${whereClause}
     RETURN di.id AS id,
            di.confidence AS confidence,
            di.createdAt AS createdAt,
            di.supersededAt AS supersededAt,
            di.observationCount AS observationCount,
            di.insight AS insight
     ORDER BY di.createdAt DESC`, { bloomId }, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        confidence: r.get("confidence"),
        createdAt: new Date(r.get("createdAt")),
        supersededAt: r.get("supersededAt") ? new Date(r.get("supersededAt")) : null,
        observationCount: r.get("observationCount"),
        insight: r.get("insight"),
    }));
}
/**
 * Mark a distillation as superseded (replaced by a newer one).
 * Sets supersededAt timestamp.
 */
export async function supersededDistillation(distillationId) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (di:Distillation { id: $id })
       SET di.supersededAt = datetime()`, { id: distillationId });
    });
}
/**
 * Get an overview of all milestones in the ecosystem graph.
 * Returns milestone Blooms with child counts and test counts.
 */
export async function getMilestoneOverview() {
    const result = await runQuery(`MATCH (b:Bloom)
     WHERE b.type IN ['milestone', 'sub-milestone']
     OPTIONAL MATCH (b)-[:CONTAINS]->(child:Bloom)
     OPTIONAL MATCH (test:Seed)-[:SCOPED_TO]->(b)
     RETURN b.id AS id, b.name AS name, b.type AS type,
            b.status AS status, b.phiL AS phiL, b.sequence AS sequence,
            b.parentId AS parentId,
            count(DISTINCT child) AS childCount,
            count(DISTINCT test) AS testCount
     ORDER BY b.sequence`, {}, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        type: r.get("type"),
        status: r.get("status"),
        phiL: r.get("phiL") ?? 0,
        sequence: r.get("sequence") ?? 0,
        parentId: r.get("parentId"),
        childCount: typeof r.get("childCount") === "number" ? r.get("childCount") : 0,
        testCount: typeof r.get("testCount") === "number" ? r.get("testCount") : 0,
    }));
}
/**
 * Get all future-scoped test Seeds targeting a specific milestone.
 * Returns test Seed nodes connected via SCOPED_TO.
 */
export async function getFutureTestsForMilestone(milestoneId) {
    const result = await runQuery(`MATCH (s:Seed)-[:SCOPED_TO]->(b:Bloom { id: $milestoneId })
     WHERE s.seedType = 'test'
     OPTIONAL MATCH (suite:Bloom)-[:CONTAINS]->(s)
     RETURN s.id AS id, s.name AS name, s.status AS status,
            suite.id AS suiteId
     ORDER BY s.id`, { milestoneId }, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        status: r.get("status"),
        suiteId: r.get("suiteId") ?? "",
    }));
}
/**
 * Get all hypothesis Helix nodes with their observed milestone.
 * Returns hypothesis data with OBSERVES relationship targets.
 */
export async function getHypothesisStatus() {
    const result = await runQuery(`MATCH (h:Helix { type: 'hypothesis' })-[:OBSERVES]->(b:Bloom)
     RETURN h.id AS id, h.claim AS claim, h.status AS status,
            h.evidenceStrength AS evidenceStrength,
            b.id AS observesMilestone
     ORDER BY h.id`, {}, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        claim: r.get("claim"),
        status: r.get("status"),
        evidenceStrength: r.get("evidenceStrength") ?? 0,
        observesMilestone: r.get("observesMilestone"),
    }));
}
/**
 * Get grammar elements, optionally filtered by category (seedType).
 * Answers: "What morphemes/axioms/rules exist and what's their implementation status?"
 */
export async function getGrammarElements(category) {
    const whereClause = category
        ? "WHERE s.seedType = $category"
        : "";
    const result = await runQuery(`MATCH (:Bloom {type: 'grammar-reference'})-[:CONTAINS]->(:Bloom {type: 'grammar-category'})-[:CONTAINS]->(s:Seed)
     ${whereClause}
     RETURN s.id AS id, s.seedType AS seedType, s.name AS name,
            s.description AS description, s.specSource AS specSource,
            s.implementationStatus AS implementationStatus,
            s.implementationNotes AS implementationNotes,
            s.codeLocation AS codeLocation
     ORDER BY s.seedType, s.id`, category ? { category } : {}, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        seedType: r.get("seedType"),
        name: r.get("name"),
        description: r.get("description"),
        specSource: r.get("specSource"),
        implementationStatus: r.get("implementationStatus"),
        implementationNotes: r.get("implementationNotes"),
        codeLocation: r.get("codeLocation") ?? null,
    }));
}
/**
 * Get implementation coverage summary for all grammar elements.
 * Answers: "How much of the grammar is implemented?"
 */
export async function getGrammarCoverage() {
    const result = await runQuery(`MATCH (:Bloom {type: 'grammar-reference'})-[:CONTAINS]->(:Bloom {type: 'grammar-category'})-[:CONTAINS]->(s:Seed)
     RETURN s.implementationStatus AS status, count(s) AS cnt`, {}, "READ");
    const counts = {};
    let total = 0;
    for (const r of result.records) {
        const status = r.get("status");
        const cnt = r.get("cnt");
        counts[status] = cnt;
        total += cnt;
    }
    return {
        total,
        complete: counts["complete"] ?? 0,
        partial: counts["partial"] ?? 0,
        typesOnly: counts["types-only"] ?? 0,
        notStarted: counts["not-started"] ?? 0,
        aspirational: counts["aspirational"] ?? 0,
    };
}
/**
 * Get axiom dependency chains (DAG).
 * Answers: "What axioms depend on A2 Visible State?"
 */
export async function getAxiomDependencies(axiomId) {
    const whereClause = axiomId ? "WHERE a.id = $axiomId" : "";
    const result = await runQuery(`MATCH (a:Seed {seedType: 'axiom'})
     ${whereClause}
     OPTIONAL MATCH (a)-[:DEPENDS_ON]->(dep:Seed {seedType: 'axiom'})
     OPTIONAL MATCH (rev:Seed {seedType: 'axiom'})-[:DEPENDS_ON]->(a)
     RETURN a.id AS axiomId, a.name AS axiomName,
            collect(DISTINCT dep.id) AS dependsOn,
            collect(DISTINCT rev.id) AS dependedOnBy
     ORDER BY a.id`, axiomId ? { axiomId } : {}, "READ");
    return result.records.map((r) => ({
        axiomId: r.get("axiomId"),
        axiomName: r.get("axiomName"),
        dependsOn: r.get("dependsOn").filter(Boolean),
        dependedOnBy: r.get("dependedOnBy").filter(Boolean),
    }));
}
/**
 * Get anti-pattern to axiom VIOLATES mappings.
 * Answers: "Which anti-patterns violate A2?"
 */
export async function getAntiPatternViolations(axiomId) {
    const whereClause = axiomId ? "WHERE ax.id = $axiomId" : "";
    const result = await runQuery(`MATCH (ap:Seed {seedType: 'anti-pattern'})-[:VIOLATES]->(ax:Seed {seedType: 'axiom'})
     ${whereClause}
     RETURN ap.id AS antiPatternId, ap.name AS antiPatternName,
            ax.id AS violatesAxiom, ax.name AS violatesAxiomName,
            ap.implementationStatus AS implementationStatus
     ORDER BY ax.id, ap.id`, axiomId ? { axiomId } : {}, "READ");
    return result.records.map((r) => ({
        antiPatternId: r.get("antiPatternId"),
        antiPatternName: r.get("antiPatternName"),
        violatesAxiom: r.get("violatesAxiom"),
        violatesAxiomName: r.get("violatesAxiomName"),
        implementationStatus: r.get("implementationStatus"),
    }));
}
//# sourceMappingURL=queries.js.map