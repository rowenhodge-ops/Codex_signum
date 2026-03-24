// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery, writeTransaction } from "../client.js";
import { instantiateMorpheme } from "../instantiation.js";
// ============ OBSERVATION QUERIES ============
export async function recordObservation(props) {
    // Create Observation Seed through Instantiation Protocol
    const result = await instantiateMorpheme("seed", {
        id: props.id,
        name: `obs:${props.metric}`,
        content: `Observation: ${props.metric}=${props.value}${props.context ? ` in ${props.context}` : ""}`,
        seedType: "observation",
        status: "active",
        metric: props.metric,
        value: props.value,
        unit: props.unit ?? null,
        context: props.context ?? null,
        timestamp: new Date().toISOString(),
        retained: true,
    }, props.sourceBloomId, undefined, { subType: "Observation" });
    if (!result.success) {
        throw new Error(`Observation creation failed: ${result.error}`);
    }
    // Domain-specific wiring: OBSERVED_IN + counter update
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (o:Observation {id: $id}), (b:Bloom {id: $bloomId})
       MERGE (o)-[:OBSERVED_IN]->(b)
       SET b.observationCount = coalesce(b.observationCount, 0) + 1`, { id: props.id, bloomId: props.sourceBloomId });
    });
}
/** Get observations for ΦL computation — recent, for a given bloom */
export async function getObservationsForBloom(bloomId, limit = 50) {
    const result = await runQuery(`MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN o
     ORDER BY o.timestamp DESC
     LIMIT toInteger($limit)`, { bloomId, limit }, "READ");
    return result.records;
}
/** Count observations for maturity calculation */
export async function countObservationsForBloom(bloomId) {
    const result = await runQuery(`MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN count(o) AS count`, { bloomId }, "READ");
    return result.records[0]?.get("count") ?? 0;
}
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
     LIMIT toInteger($limit)`, { bloomId, limit }, "READ");
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
     LIMIT toInteger($limit)`, { bloomId, limit }, "READ");
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
 * Update an Observation node with conditioned values from the 7-stage
 * signal pipeline. Called after recordObservation() + conditionValue().
 */
export async function updateObservationConditioned(observationId, values) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (o:Observation {id: $id})
       SET o.smoothedValue = $smoothedValue,
           o.trendSlope = $trendSlope,
           o.trendProjection = $trendProjection,
           o.cusumStatistic = $cusumStatistic,
           o.macdValue = $macdValue,
           o.macdSignal = $macdSignal,
           o.filtered = $filtered,
           o.alertCount = $alertCount,
           o.signalProcessed = true`, { id: observationId, ...values });
    });
}
// ============ BACKWARD COMPATIBILITY (remove in M-8) ============
/** @deprecated Use getObservationsForBloom */
export const getObservationsForPattern = getObservationsForBloom;
/** @deprecated Use countObservationsForBloom */
export const countObservationsForPattern = countObservationsForBloom;
//# sourceMappingURL=observation.js.map