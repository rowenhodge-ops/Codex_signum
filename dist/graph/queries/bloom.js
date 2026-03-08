// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery, writeTransaction } from "../client.js";
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
//# sourceMappingURL=bloom.js.map