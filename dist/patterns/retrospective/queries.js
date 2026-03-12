// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Retrospective Cypher queries.
 *
 * All executeRead via runQuery(..., "READ") — no writes in this file.
 * Labels and property names verified against actual schema in:
 *   src/graph/queries.ts (Decision, Observation, ContextCluster, Bloom)
 *   src/graph/write-observation.ts (ThresholdEvent)
 *   src/graph/schema.ts (constraints and indexes)
 *
 * Schema notes (verified 2026-03-02, M-7C):
 *   Decision: status='completed' after outcome recorded, success: boolean
 *   Observation: value (raw), metric, timestamp, retained — NO conditionedValue
 *   ThresholdEvent: patternId, previousBand, newBand, direction, phiLEffective
 *   Bloom: phiL (effective), phiLTrend (from updateBloomPhiL)
 *   ContextCluster: id, taskType, complexity, domain
 *   Relationships: (d)-[:IN_CONTEXT]->(cc), (o)-[:OBSERVED_IN]->(b),
 *                  (te)-[:THRESHOLD_CROSSED_BY]->(b), (d)-[:ROUTED_TO]->(s)
 *
 * @module codex-signum-core/patterns/retrospective/queries
 */
import { runQuery } from "../../graph/client.js";
/** Overall decision count and success rate in window */
export async function queryOverallSuccess(windowHours) {
    const result = await runQuery(`MATCH (d:Decision)
     WHERE d.timestamp > datetime() - duration({ hours: $windowHours })
       AND d.status = 'completed'
     RETURN
       count(d) AS total,
       CASE WHEN count(d) = 0 THEN 0.0
            ELSE toFloat(sum(CASE WHEN d.success = true THEN 1 ELSE 0 END)) / count(d)
       END AS successRate`, { windowHours }, "READ");
    const row = result.records[0];
    return {
        total: row?.get("total") ?? 0,
        successRate: row?.get("successRate") ?? 0,
    };
}
/** Thompson convergence per context cluster */
export async function queryConvergence(windowHours) {
    const result = await runQuery(`MATCH (d:Decision)-[:IN_CONTEXT]->(cc:ContextCluster)
     WHERE d.timestamp > datetime() - duration({ hours: $windowHours })
       AND d.status = 'completed'
     WITH cc,
          count(d) AS total,
          sum(CASE WHEN d.success = true THEN 1 ELSE 0 END) AS successes,
          collect(d.selectedSeedId) AS seedIds
     WITH cc, total,
          CASE WHEN total = 0 THEN 0.0
               ELSE toFloat(successes) / total
          END AS successRate,
          seedIds
     UNWIND seedIds AS sid
     WITH cc, total, successRate, sid, count(*) AS seedCount
     ORDER BY seedCount DESC
     WITH cc, total, successRate,
          collect(sid)[0] AS topSeed,
          collect(seedCount)[0] AS topSeedCount
     RETURN
       cc.id AS contextClusterId,
       total AS decisionCount,
       successRate,
       topSeed AS topSeedId,
       toFloat(topSeedCount) / total AS topSeedSelectionRate`, { windowHours }, "READ");
    return result.records.map((r) => ({
        contextClusterId: r.get("contextClusterId"),
        decisionCount: r.get("decisionCount") ?? 0,
        successRate: r.get("successRate") ?? 0,
        topSeedId: r.get("topSeedId") ?? "unknown",
        topSeedSelectionRate: r.get("topSeedSelectionRate") ?? 0,
        status: deriveConvergenceStatus(r.get("decisionCount") ?? 0, r.get("successRate") ?? 0, r.get("topSeedSelectionRate") ?? 0),
    }));
}
/** Stage-level observation quality per bloom (uses raw value, not conditioned) */
export async function queryStageHealth(windowHours, bloomIds) {
    const result = await runQuery(`MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom)
     WHERE o.timestamp > datetime() - duration({ hours: $windowHours })
       AND o.retained = true
       AND ($bloomIds IS NULL OR b.id IN $bloomIds)
       AND o.metric CONTAINS '.'
     WITH b.id AS bloomId,
          split(o.metric, '.')[0] AS stageName,
          o.value AS val
     RETURN
       bloomId,
       stageName,
       count(val) AS observationCount,
       avg(val) AS avgValue,
       CASE WHEN count(val) = 0 THEN 0.0
            ELSE toFloat(sum(CASE WHEN val < 0.6 THEN 1 ELSE 0 END)) / count(val)
       END AS refinementRate
     ORDER BY bloomId, stageName`, { windowHours, bloomIds: bloomIds ?? null }, "READ");
    return result.records.map((r) => ({
        bloomId: r.get("bloomId"),
        stageName: r.get("stageName"),
        observationCount: r.get("observationCount") ?? 0,
        avgValue: r.get("avgValue") ?? 0,
        refinementRate: r.get("refinementRate") ?? 0,
    }));
}
/** ThresholdEvents (degradation) in window */
export async function queryDegradation(windowHours) {
    const result = await runQuery(`MATCH (te:ThresholdEvent)-[:THRESHOLD_CROSSED_BY]->(b:Bloom)
     WHERE te.timestamp > datetime() - duration({ hours: $windowHours })
     WITH b.id AS bloomId,
          count(te) AS eventCount,
          collect(te.newBand) AS bands,
          b.phiL AS currentPhiL,
          collect(te.previousBand) AS previousBands
     RETURN
       bloomId,
       eventCount,
       bands,
       currentPhiL,
       previousBands[0] AS firstPreviousBand`, { windowHours }, "READ");
    return result.records.map((r) => {
        const bands = r.get("bands") ?? [];
        const currentPhiL = r.get("currentPhiL") ?? 0;
        return {
            bloomId: r.get("bloomId"),
            eventCount: r.get("eventCount") ?? 0,
            lowestBandReached: worstBand(bands),
            recovered: currentPhiL >= 0.5,
        };
    });
}
// ============ PURE FUNCTIONS ============
/** Pure function — classify convergence from metrics */
export function deriveConvergenceStatus(decisionCount, successRate, topSeedSelectionRate) {
    if (decisionCount < 10)
        return "insufficient_data";
    if (successRate >= 0.8 && topSeedSelectionRate >= 0.6)
        return "converging";
    if (successRate < 0.5 || topSeedSelectionRate < 0.3)
        return "diverging";
    return "stable";
}
/**
 * Pure function — worst health band from a list.
 * Order: algedonic (worst) → critical → degraded → healthy → trusted → optimal (best)
 */
export function worstBand(bands) {
    const order = [
        "algedonic",
        "critical",
        "degraded",
        "healthy",
        "trusted",
        "optimal",
    ];
    for (const b of order) {
        if (bands.includes(b))
            return b;
    }
    return "unknown";
}
//# sourceMappingURL=queries.js.map