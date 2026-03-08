// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery, writeTransaction } from "../client.js";
/** Canonical Architect pipeline stages */
export const ARCHITECT_STAGES = [
    "SURVEY",
    "DECOMPOSE",
    "CLASSIFY",
    "SEQUENCE",
    "GATE",
    "DISPATCH",
    "ADAPT",
];
// ============ PIPELINE RUN QUERIES ============
/** Create or update a PipelineRun node */
export async function createPipelineRun(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`MERGE (pr:PipelineRun { id: $id })
       ON CREATE SET
         pr.intent = $intent,
         pr.bloomId = $bloomId,
         pr.taskCount = $taskCount,
         pr.startedAt = datetime($startedAt),
         pr.completedAt = CASE WHEN $completedAt IS NOT NULL THEN datetime($completedAt) ELSE null END,
         pr.durationMs = $durationMs,
         pr.modelDiversity = $modelDiversity,
         pr.overallQuality = $overallQuality,
         pr.status = $status,
         pr.createdAt = datetime()
       ON MATCH SET
         pr.completedAt = COALESCE(CASE WHEN $completedAt IS NOT NULL THEN datetime($completedAt) ELSE null END, pr.completedAt),
         pr.durationMs = COALESCE($durationMs, pr.durationMs),
         pr.overallQuality = COALESCE($overallQuality, pr.overallQuality),
         pr.modelDiversity = COALESCE($modelDiversity, pr.modelDiversity),
         pr.status = $status,
         pr.updatedAt = datetime()
       WITH pr
       MATCH (b:Bloom { id: $bloomId })
       MERGE (pr)-[:EXECUTED_IN]->(b)`, {
            ...props,
            completedAt: props.completedAt ?? null,
            durationMs: props.durationMs ?? null,
            modelDiversity: props.modelDiversity ?? null,
            overallQuality: props.overallQuality ?? null,
        });
    });
}
/** Update a PipelineRun when it completes */
export async function completePipelineRun(runId, completedAt, durationMs, overallQuality, modelDiversity, taskCount) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (pr:PipelineRun { id: $runId })
       SET pr.status = 'completed',
           pr.completedAt = datetime($completedAt),
           pr.durationMs = $durationMs,
           pr.overallQuality = $overallQuality,
           pr.modelDiversity = $modelDiversity,
           pr.taskCount = COALESCE($taskCount, pr.taskCount),
           pr.updatedAt = datetime()`, { runId, completedAt, durationMs, overallQuality, modelDiversity, taskCount: taskCount ?? null });
    });
}
/** Get a specific PipelineRun by ID */
export async function getPipelineRun(runId) {
    const result = await runQuery("MATCH (pr:PipelineRun { id: $runId }) RETURN pr", { runId }, "READ");
    return result.records[0] ?? null;
}
/** List recent PipelineRuns for a Bloom, ordered by startedAt DESC */
export async function listPipelineRuns(bloomId, limit = 20) {
    const result = await runQuery(`MATCH (pr:PipelineRun { bloomId: $bloomId })
     RETURN pr
     ORDER BY pr.startedAt DESC
     LIMIT toInteger($limit)`, { bloomId, limit }, "READ");
    return result.records;
}
// ============ PIPELINE LIFECYCLE EXTENSIONS (M-9.5) ============
/** Mark a PipelineRun as failed with an error message */
export async function failPipelineRun(runId, error) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (pr:PipelineRun { id: $runId })
       SET pr.status = 'failed',
           pr.error = $error,
           pr.completedAt = datetime(),
           pr.updatedAt = datetime()`, { runId, error });
    });
}
//# sourceMappingURL=pipeline-run.js.map