// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery } from "../client.js";
import { computeMaturityFactor } from "../../computation/maturity.js";
import { computeUsageSuccessRate } from "../../computation/phi-l.js";
import { healthBand } from "../../computation/health-band.js";
// ============ PIPELINE ANALYTICS QUERIES ============
/**
 * Get ΦL and observation counts for each Architect pipeline stage Bloom.
 * Answers: "which pipeline stage is performing best/worst?"
 */
export async function getPipelineStageHealth(architectBloomId) {
    const result = await runQuery(`MATCH (b:Bloom { id: $bloomId })-[:CONTAINS]->(r:Stage)
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
/** Get performance stats per pipeline stage (Stage Bloom-level) */
export async function getStagePerformance(architectBloomId) {
    const result = await runQuery(`MATCH (b:Bloom { id: $bloomId })-[:CONTAINS]->(r:Stage)-[:PROCESSED]->(to:TaskOutput)
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
// ============ M-22.2: PATTERN HEALTH CONTEXT ASSEMBLY ============
/**
 * Query the graph for all data needed to construct PatternHealthContext.
 * This is the bridge between graph state and the ΦL computation chain.
 *
 * Returns null if the Bloom doesn't exist or has no observations yet
 * (cold start — conditioning-only mode still works via the null check
 * in writeObservation).
 *
 * V1 factor mapping:
 *   axiomCompliance  = 1.0 (assume compliant until Assayer wired)
 *   provenanceClarity = fraction of recent TaskOutputs with provenance fields
 *   usageSuccessRate  = succeeded / total from TaskOutput nodes
 *   temporalStability = computed from PhiLState ring buffer (persisted on Bloom)
 */
export async function assemblePatternHealthContext(bloomId) {
    // Single query: bloom properties + observation count + degree + children count + task success/total
    const result = await runQuery(`MATCH (b:Bloom { id: $bloomId })
     OPTIONAL MATCH (o:Observation)-[:OBSERVED_IN]->(b)
     WHERE o.retained = true
     WITH b, count(o) AS obsCount
     OPTIONAL MATCH (b)-[r]-()
     WITH b, obsCount, count(r) AS connCount
     OPTIONAL MATCH (b)-[:CONTAINS]->(child)
     WITH b, obsCount, connCount, count(child) AS childCount
     OPTIONAL MATCH (to:TaskOutput)-[:PRODUCED_BY]->(pr:PipelineRun)-[:EXECUTED_IN]->(b)
     WITH b, obsCount, connCount, childCount,
          count(to) AS totalTasks,
          count(CASE WHEN to.status = 'succeeded' THEN 1 END) AS succeededTasks,
          count(CASE WHEN to.modelUsed IS NOT NULL AND to.provider IS NOT NULL AND to.runId IS NOT NULL THEN 1 END) AS withProvenance
     RETURN b.phiL AS phiL,
            b.healthBand AS healthBand,
            b.phiLState AS phiLState,
            b.commitSha AS commitSha,
            obsCount, connCount, childCount,
            totalTasks, succeededTasks, withProvenance`, { bloomId }, "READ");
    if (result.records.length === 0)
        return null;
    const rec = result.records[0];
    const obsCount = Number(rec.get("obsCount"));
    const connCount = Number(rec.get("connCount"));
    const childCount = Number(rec.get("childCount"));
    const totalTasks = Number(rec.get("totalTasks"));
    const succeededTasks = Number(rec.get("succeededTasks"));
    const withProvenance = Number(rec.get("withProvenance"));
    const previousPhiL = rec.get("phiL") != null ? Number(rec.get("phiL")) : undefined;
    const storedBand = rec.get("healthBand");
    const phiLStateJson = rec.get("phiLState");
    const commitSha = rec.get("commitSha");
    // Cold start: no observations yet — return null for conditioning-only mode
    if (obsCount === 0)
        return null;
    // Deserialise PhiLState ring buffer (persisted as JSON on Bloom)
    let phiLState;
    if (phiLStateJson) {
        try {
            phiLState = JSON.parse(phiLStateJson);
        }
        catch {
            // Corrupted state — will be re-created
        }
    }
    // ── Factor computation (V1) ──────────────────────────────────────────
    // axiomCompliance: V1 default = 1.0 (assume compliant until Assayer wired)
    const axiomCompliance = 1.0;
    // provenanceClarity: fraction of TaskOutputs with provenance fields present
    // Also check if the Bloom itself has commitSha
    let provenanceClarity;
    if (totalTasks > 0) {
        const bloomProvenance = commitSha != null ? 1 : 0;
        // Weight: 80% task provenance + 20% bloom provenance
        provenanceClarity = 0.8 * (withProvenance / totalTasks) + 0.2 * bloomProvenance;
    }
    else {
        provenanceClarity = commitSha != null ? 0.5 : 0.3; // Some credit for bloom-level provenance
    }
    // usageSuccessRate: from TaskOutput success/total
    const usageSuccessRate = computeUsageSuccessRate(succeededTasks, totalTasks);
    // temporalStability: from ring buffer if available, else 0.5 (moderate default)
    let temporalStability = 0.5;
    if (phiLState && phiLState.ringBuffer.length >= 2) {
        const mean = phiLState.ringBuffer.reduce((a, b) => a + b, 0) / phiLState.ringBuffer.length;
        const variance = phiLState.ringBuffer.reduce((sum, v) => sum + (v - mean) ** 2, 0) / phiLState.ringBuffer.length;
        const MAX_EXPECTED_VARIANCE = 0.04;
        temporalStability = Math.max(0, Math.min(1, 1 - variance / MAX_EXPECTED_VARIANCE));
    }
    // ── Maturity + topology ──────────────────────────────────────────────
    const maturityIndex = computeMaturityFactor(obsCount, connCount);
    // Topology role heuristic
    const topologyRole = childCount > 5 ? "hub" : childCount <= 1 ? "leaf" : "default";
    // Derive previousBand from stored value or from previousPhiL
    let previousBand = storedBand;
    if (!previousBand && previousPhiL !== undefined) {
        previousBand = healthBand(previousPhiL, maturityIndex);
    }
    return {
        factors: {
            axiomCompliance,
            provenanceClarity,
            usageSuccessRate,
            temporalStability,
        },
        observationCount: obsCount,
        connectionCount: connCount,
        previousPhiL,
        previousBand,
        maturityIndex,
        topologyRole,
        degree: childCount,
    };
}
//# sourceMappingURL=health.js.map