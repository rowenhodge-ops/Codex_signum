// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Structural Survey Resonator
 *
 * Queries a Bloom's graph topology and produces a BloomSurvey.
 * All data comes from Neo4j via Cypher -- no LLM substrate.
 *
 * Instantiation: resonator:structural-survey
 * Definition: def:transformation:structural-survey
 * I/O Shape: Scope->Diagnostic (compression)
 *
 * @module codex-signum-core/patterns/cognitive/structural-survey
 */
import { readTransaction } from "../../graph/client.js";
/**
 * Survey a Bloom's topology: children, inter-child Lines, spectral properties,
 * and INSTANTIATES edges. Purely deterministic -- Cypher queries only.
 *
 * @param bloomId - The Bloom to survey
 * @returns BloomSurvey with full topology snapshot
 * @throws Error if the target Bloom does not exist
 */
export async function surveyBloomTopology(bloomId) {
    // 1. BLOOM IDENTITY + SPECTRAL PROPERTIES
    const bloom = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (b:Bloom {id: $bloomId})
       RETURN b.id AS id, b.name AS name,
              b.lambda2 AS lambda2, b.psiH AS psiH, b.phiL AS phiL`, { bloomId });
        if (res.records.length === 0)
            return null;
        const r = res.records[0];
        return {
            id: r.get("id"),
            name: r.get("name") ?? bloomId,
            lambda2: r.get("lambda2") ?? 0,
            psiH: r.get("psiH") ?? 0,
            phiL: r.get("phiL") ?? 0,
        };
    });
    if (!bloom) {
        throw new Error(`Target Bloom '${bloomId}' does not exist in graph.`);
    }
    // 2. CHILDREN WITH INTERNAL MORPHEMES + INSTANTIATES
    const children = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(child)
       OPTIONAL MATCH (child)-[:CONTAINS]->(internal)
       OPTIONAL MATCH (internal)-[:INSTANTIATES]->(def:Seed)
         WHERE def.seedType IN ['transformation-definition', 'bloom-definition']
       RETURN child.id AS childId, child.name AS childName, labels(child) AS childLabels,
              child.status AS childStatus, child.phiL AS childPhiL, child.psiH AS childPsiH,
              collect(DISTINCT CASE WHEN internal IS NOT NULL THEN {
                id: internal.id, name: internal.name, labels: labels(internal),
                transformationDefId: def.id
              } ELSE NULL END) AS internalMorphemes`, { bloomId });
        const childMap = new Map();
        for (const r of res.records) {
            const childId = r.get("childId");
            if (!childMap.has(childId)) {
                const rawInternal = r.get("internalMorphemes") ?? [];
                childMap.set(childId, {
                    id: childId,
                    name: r.get("childName") ?? childId,
                    labels: r.get("childLabels") ?? [],
                    status: r.get("childStatus") ?? "unknown",
                    phiL: r.get("childPhiL"),
                    psiH: r.get("childPsiH"),
                    internalMorphemes: rawInternal
                        .filter((m) => m !== null)
                        .map((m) => ({
                        id: m.id,
                        name: m.name ?? "",
                        labels: m.labels ?? [],
                        transformationDefId: m.transformationDefId ?? null,
                    })),
                });
            }
        }
        return Array.from(childMap.values());
    });
    // 3. INTER-CHILD LINES (direct edges between children)
    const directLines = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(child1)
       MATCH (b)-[:CONTAINS]->(child2)
       WHERE child1 <> child2
       MATCH (child1)-[line]->(child2)
       WHERE type(line) IN ['FLOWS_TO', 'DEPENDS_ON']
       RETURN child1.id AS sourceId, child2.id AS targetId, type(line) AS type`, { bloomId });
        return res.records.map((r) => ({
            sourceId: r.get("sourceId"),
            targetId: r.get("targetId"),
            type: r.get("type"),
        }));
    });
    // Also detect Lines through shared hubs outside the Bloom
    const hubLines = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(child1)
       MATCH (b)-[:CONTAINS]->(child2)
       WHERE child1 <> child2
       MATCH (child1)-[:FLOWS_TO]->(shared)<-[:FLOWS_TO]-(child2)
       WHERE NOT (b)-[:CONTAINS]->(shared)
       RETURN DISTINCT child1.id AS sourceId, child2.id AS targetId,
              'FLOWS_TO_VIA_HUB' AS type`, { bloomId });
        return res.records.map((r) => ({
            sourceId: r.get("sourceId"),
            targetId: r.get("targetId"),
            type: r.get("type"),
        }));
    });
    const interChildLines = [...directLines, ...hubLines];
    // 4. INSTANTIATES EDGES (transformation-level only)
    // Includes nodes reachable via FLOWS_TO from children (shared ecosystem Resonators)
    const instantiatesEdges = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (b:Bloom {id: $bloomId})-[:CONTAINS*1..2]->(node)
       MATCH (node)-[:INSTANTIATES]->(def:Seed)
       WHERE def.seedType IN ['transformation-definition', 'bloom-definition']
       RETURN DISTINCT node.id AS fromId, node.name AS fromName,
              def.id AS toDefId, def.name AS defName, def.seedType AS defSeedType
       UNION
       MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(child)-[:FLOWS_TO]->(shared)
       WHERE NOT (b)-[:CONTAINS]->(shared)
       MATCH (shared)-[:INSTANTIATES]->(def:Seed)
       WHERE def.seedType IN ['transformation-definition', 'bloom-definition']
       RETURN DISTINCT shared.id AS fromId, shared.name AS fromName,
              def.id AS toDefId, def.name AS defName, def.seedType AS defSeedType`, { bloomId });
        return res.records.map((r) => ({
            fromId: r.get("fromId"),
            fromName: r.get("fromName") ?? "",
            toDefId: r.get("toDefId"),
            defName: r.get("defName") ?? "",
            defSeedType: r.get("defSeedType") ?? "",
        }));
    });
    return {
        bloomId: bloom.id,
        bloomName: bloom.name,
        lambda2: bloom.lambda2,
        psiH: bloom.psiH,
        phiL: bloom.phiL,
        children,
        interChildLines,
        instantiatesEdges,
    };
}
//# sourceMappingURL=structural-survey.js.map