// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Graph queries for Line conductivity evaluation and caching.
 *
 * Assembles EndpointState from the graph, evaluates conductivity via pure
 * computation functions, and persists the result as cached properties on
 * Line relationships.
 *
 * @see src/computation/conductivity.ts (pure evaluation functions)
 * @see cs-v5.0.md §Line (Conductivity)
 */
import { runQuery, writeTransaction } from "../client.js";
import { evaluateConductivity } from "../../computation/conductivity.js";
// ─── Label → MorphemeType mapping ───────────────────────────────────
const LABEL_TO_TYPE = {
    Seed: "seed",
    Bloom: "bloom",
    Resonator: "resonator",
    Grid: "grid",
    Helix: "helix",
};
function labelsToMorphemeType(labels) {
    for (const label of labels) {
        const mapped = LABEL_TO_TYPE[label];
        if (mapped)
            return mapped;
    }
    return "unknown";
}
// ─── Endpoint State Assembly ────────────────────────────────────────
/**
 * Query endpoint state for conductivity evaluation.
 * Reads both endpoints of a Line in a single Cypher query.
 */
export async function getLineEndpointStates(sourceId, targetId) {
    const result = await runQuery(`MATCH (s {id: $sourceId}), (t {id: $targetId})
     OPTIONAL MATCH (s)-[:INSTANTIATES]->(:Seed)
     WITH s, t, count(*) > 0 AS sHasInst
     OPTIONAL MATCH (t)-[:INSTANTIATES]->(:Seed)
     WITH s, t, sHasInst, count(*) > 0 AS tHasInst
     RETURN s.id AS sId, s.content AS sContent, s.status AS sStatus,
            s.phiL AS sPhiL, labels(s) AS sLabels, sHasInst,
            t.id AS tId, t.content AS tContent, t.status AS tStatus,
            t.phiL AS tPhiL, labels(t) AS tLabels, tHasInst`, { sourceId, targetId }, "READ");
    if (result.records.length === 0)
        return null;
    const rec = result.records[0];
    const sLabels = rec.get("sLabels");
    const tLabels = rec.get("tLabels");
    const source = {
        id: String(rec.get("sId")),
        content: rec.get("sContent"),
        status: rec.get("sStatus"),
        phiL: rec.get("sPhiL") != null ? Number(rec.get("sPhiL")) : null,
        hasInstantiates: Boolean(rec.get("sHasInst")),
        morphemeType: labelsToMorphemeType(sLabels),
    };
    const target = {
        id: String(rec.get("tId")),
        content: rec.get("tContent"),
        status: rec.get("tStatus"),
        phiL: rec.get("tPhiL") != null ? Number(rec.get("tPhiL")) : null,
        hasInstantiates: Boolean(rec.get("tHasInst")),
        morphemeType: labelsToMorphemeType(tLabels),
    };
    return { source, target };
}
// ─── Evaluate and Cache ─────────────────────────────────────────────
/**
 * Evaluate conductivity for a specific Line and cache the result.
 * Reads endpoint state from graph, evaluates all 3 layers, persists on the relationship.
 */
export async function evaluateAndCacheLineConductivity(sourceId, targetId, lineType, taskClass) {
    const endpoints = await getLineEndpointStates(sourceId, targetId);
    if (!endpoints)
        return null;
    const result = evaluateConductivity(endpoints.source, endpoints.target, lineType, taskClass);
    // Persist conductivity on the Line relationship
    await writeTransaction(async (tx) => {
        // Use dynamic relationship type via APOC-free pattern:
        // Match all relationships between the two nodes, filter by type
        await tx.run(`MATCH (s {id: $sourceId})-[r]->(t {id: $targetId})
       WHERE type(r) = $lineType
       SET r.conductivity = $conducts,
           r.friction = $effectiveFriction,
           r.conductivityLayer1 = $layer1Passes,
           r.conductivityLayer2 = $layer2Passes,
           r.conductivityLayer3Friction = $layer3Friction,
           r.conductivityEvaluatedAt = datetime(),
           r.conductivityValid = true`, {
            sourceId,
            targetId,
            lineType,
            conducts: result.conducts,
            effectiveFriction: result.effectiveFriction,
            layer1Passes: result.layer1.passes,
            layer2Passes: result.layer2.passes,
            layer3Friction: result.layer3.friction,
        });
    });
    return result;
}
/**
 * Invalidate conductivity cache on all Lines touching a node.
 * Marks connected Lines as stale — lazy invalidation.
 */
export async function invalidateLineConductivity(nodeId) {
    await runQuery(`MATCH (n {id: $nodeId})-[r]-()
     WHERE r.conductivityEvaluatedAt IS NOT NULL
     SET r.conductivityValid = false`, { nodeId }, "WRITE");
}
//# sourceMappingURL=conductivity.js.map