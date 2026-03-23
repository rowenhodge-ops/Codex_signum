// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery, writeTransaction } from "../client.js";
import { instantiateMorpheme } from "../instantiation.js";
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
/**
 * Create a PipelineRun node through the Instantiation Protocol.
 *
 * Uses instantiateMorpheme('bloom') with:
 * - transformationDefId: def:bloom:execution
 * - a6Justification: distinct_temporal_scale (every run is unique)
 * - Parent: props.bloomId (the Architect Bloom)
 *
 * After instantiation, adds the :PipelineRun specialisation label.
 */
export async function createPipelineRun(props) {
    const highlander = {
        transformationDefId: "def:bloom:execution",
        a6Justification: "distinct_temporal_scale",
    };
    const result = await instantiateMorpheme("bloom", {
        id: props.id,
        name: `Pipeline Run ${props.id}`,
        content: `Architect pipeline execution: ${props.intent.slice(0, 200)}`,
        type: "pipeline",
        status: props.status,
        intent: props.intent,
        bloomId: props.bloomId,
        taskCount: props.taskCount,
        startedAt: props.startedAt,
        ...(props.completedAt ? { completedAt: props.completedAt } : {}),
        ...(props.durationMs != null ? { durationMs: props.durationMs } : {}),
        ...(props.modelDiversity != null ? { modelDiversity: props.modelDiversity } : {}),
        ...(props.overallQuality != null ? { overallQuality: props.overallQuality } : {}),
    }, props.bloomId, highlander);
    if (!result.success) {
        throw new Error(`PipelineRun creation failed: ${result.error}`);
    }
    // Add :PipelineRun specialisation label for query performance + constraint scoping
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (pr:Bloom {id: $id}) SET pr:PipelineRun`, { id: props.id });
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