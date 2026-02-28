// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * runRetrospective — query graph, return structured insights.
 *
 * Pure read. No LLM. No pipeline stages. No monitoring overlay.
 * The graph already contains the answers.
 *
 * Optionally writes a DistilledInsight node if writeInsights: true
 * and any convergence cluster is "diverging" (high signal, worth persisting).
 *
 * @module codex-signum-core/patterns/retrospective/retrospective
 */
import { writeTransaction } from "../../graph/client.js";
import { queryOverallSuccess, queryConvergence, queryStageHealth, queryDegradation, } from "./queries.js";
export async function runRetrospective(opts = {}) {
    const { windowHours = 24, patternIds, writeInsights = false } = opts;
    const [overall, convergence, stages, degradation] = await Promise.all([
        queryOverallSuccess(windowHours),
        queryConvergence(windowHours),
        queryStageHealth(windowHours, patternIds),
        queryDegradation(windowHours),
    ]);
    const insightNodeIds = [];
    if (writeInsights) {
        const diverging = convergence.filter((c) => c.status === "diverging");
        for (const cluster of diverging) {
            const id = await writeDistilledInsight(cluster, windowHours);
            insightNodeIds.push(id);
        }
    }
    return {
        windowHours,
        queriedAt: new Date().toISOString(),
        totalDecisions: overall.total,
        overallSuccessRate: overall.successRate,
        convergence,
        stages,
        degradation,
        insightNodeIds,
    };
}
async function writeDistilledInsight(cluster, windowHours) {
    const id = `insight-${cluster.contextClusterId}-${Date.now()}`;
    await writeTransaction(async (tx) => {
        await tx.run(`MERGE (di:DistilledInsight { id: $id })
       SET di.contextClusterId = $contextClusterId,
           di.successRate      = $successRate,
           di.windowHours      = $windowHours,
           di.recordedAt       = datetime(),
           di.category         = 'convergence_diverging'`, {
            id,
            contextClusterId: cluster.contextClusterId,
            successRate: cluster.successRate,
            windowHours,
        });
    });
    return id;
}
//# sourceMappingURL=retrospective.js.map