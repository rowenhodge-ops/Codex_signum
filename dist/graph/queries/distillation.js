// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery, writeTransaction } from "../client.js";
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
//# sourceMappingURL=distillation.js.map