// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { readTransaction } from "../../graph/client.js";
import { evaluate } from "./evaluation.js";
/** Gnosis Bloom ID — discovered dynamically, cached per process */
let gnosisBloomIdCache = null;
/**
 * Discover the Gnosis (Cognitive) Bloom's ID from the graph.
 */
async function discoverGnosisBloomId() {
    if (gnosisBloomIdCache)
        return gnosisBloomIdCache;
    try {
        const result = await readTransaction(async (tx) => {
            const res = await tx.run(`MATCH (g:Bloom)-[:INSTANTIATES]->(def:Seed {id: 'def:bloom:cognitive'})
         RETURN g.id AS id`);
            return res.records[0]?.get("id") ?? null;
        });
        gnosisBloomIdCache = result;
        return result;
    }
    catch {
        return null;
    }
}
/**
 * Evaluate all morphemes within a Bloom's CONTAINS tree.
 *
 * @param bloomId - Root Bloom to sweep
 * @param options - { maxDepth, includeComplete }
 * @returns SweepResult with per-morpheme evaluations
 */
export async function sweep(bloomId, options) {
    const startMs = Date.now();
    const maxDepth = options?.maxDepth ?? 3;
    const includeComplete = options?.includeComplete ?? false;
    // Discover Gnosis Bloom to enforce recursion boundary
    const gnosisBloomId = await discoverGnosisBloomId();
    // Query all morphemes in the CONTAINS tree
    const morphemeIds = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (root:Bloom {id: $bloomId})-[:CONTAINS*1..${maxDepth}]->(child)
       ${includeComplete ? "" : "WHERE child.status <> 'complete' OR child.status IS NULL"}
       RETURN DISTINCT child.id AS id`, { bloomId });
        return res.records.map(r => r.get("id"));
    });
    // Filter out Gnosis's own children (recursion boundary)
    let gnosisChildIds = new Set();
    if (gnosisBloomId) {
        const gnosisChildren = await readTransaction(async (tx) => {
            const res = await tx.run(`MATCH (g:Bloom {id: $gnosisBloomId})-[:CONTAINS*1..5]->(child)
         RETURN DISTINCT child.id AS id`, { gnosisBloomId });
            return res.records.map(r => r.get("id"));
        });
        gnosisChildIds = new Set(gnosisChildren);
    }
    // Also exclude Constitutional Bloom internals
    const cbChildIds = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS*1..5]->(child)
       RETURN DISTINCT child.id AS id`);
        return new Set(res.records.map(r => r.get("id")));
    });
    const filteredIds = morphemeIds.filter(id => !gnosisChildIds.has(id) && !cbChildIds.has(id));
    // Evaluate each morpheme
    const results = [];
    for (const id of filteredIds) {
        const result = await evaluate(id, "explicit_sweep");
        results.push(result);
    }
    const passCount = results.filter(r => r.overallVerdict === "pass").length;
    const violationCount = results.filter(r => r.overallVerdict === "violation").length;
    const warningCount = results.filter(r => r.overallVerdict === "warning").length;
    return {
        scopeBloomId: bloomId,
        evaluatedCount: results.length,
        passCount,
        violationCount,
        warningCount,
        results,
        processingTimeMs: Date.now() - startMs,
    };
}
//# sourceMappingURL=sweep.js.map