// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { writeTransaction } from "../client.js";
// ============ PIPELINE OUTPUT QUERIES ============
/**
 * Create or update a Seed node representing a pipeline output.
 * Uses MERGE for idempotency.
 */
export async function createPipelineOutputSeed(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`MERGE (s:Seed { id: $id })
       ON CREATE SET
         s.name = $name,
         s.seedType = $seedType,
         s.content = $content,
         s.qualityScore = $qualityScore,
         s.modelId = $modelId,
         s.charCount = $charCount,
         s.durationMs = $durationMs,
         s.runId = $runId,
         s.taskId = $taskId,
         s.\`order\` = $order,
         s.createdAt = datetime()
       ON MATCH SET
         s.content = $content,
         s.qualityScore = $qualityScore,
         s.modelId = $modelId,
         s.charCount = $charCount,
         s.durationMs = $durationMs,
         s.updatedAt = datetime()`, {
            id: props.id,
            name: props.name,
            seedType: props.seedType,
            content: props.content,
            qualityScore: props.qualityScore,
            modelId: props.modelId,
            charCount: props.charCount,
            durationMs: props.durationMs,
            runId: props.runId,
            taskId: props.taskId,
            order: props.order,
        });
    });
}
/**
 * Create a CONTAINS relationship from a PipelineRun to a Seed.
 * Returns true if the relationship was created, false if either node is missing.
 */
export async function linkSeedToPipelineRun(seedId, runId, order) {
    const result = await writeTransaction(async (tx) => {
        return await tx.run(`MATCH (pr:PipelineRun { id: $runId }), (s:Seed { id: $seedId })
       MERGE (pr)-[r:CONTAINS]->(s)
       ON CREATE SET r.\`order\` = $order, r.createdAt = datetime()
       ON MATCH SET r.\`order\` = $order, r.updatedAt = datetime()
       RETURN pr.id AS linked`, { seedId, runId, order });
    });
    return (result.records?.length ?? 0) > 0;
}
/**
 * Shared helper: create a pipeline output Seed and link it to its PipelineRun.
 * Non-fatal — logs a warning on failure, never throws.
 * (REVIEW correction: DRY helper used by both Architect and DevAgent paths)
 */
export async function tryCreateAndLinkSeed(props) {
    try {
        await createPipelineOutputSeed(props);
        const linked = await linkSeedToPipelineRun(props.id, props.runId, props.order);
        if (!linked) {
            console.warn(`  [GRAPH] ⚠️  Seed ${props.id} created but PipelineRun ${props.runId} not found for CONTAINS link`);
        }
    }
    catch (err) {
        console.warn(`  [GRAPH] ⚠️  Failed to create/link pipeline output Seed ${props.id}: ${err instanceof Error ? err.message : err}`);
    }
}
//# sourceMappingURL=pipeline-output.js.map