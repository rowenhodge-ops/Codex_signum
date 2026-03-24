// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery, writeTransaction } from "../client.js";
import { instantiateMorpheme } from "../instantiation.js";
// ============ TASK OUTPUT QUERIES ============
/** Create a TaskOutput node and link to its PipelineRun */
export async function createTaskOutput(props) {
    // Create TaskOutput Seed through Instantiation Protocol
    // Parent = the PipelineRun Bloom
    const result = await instantiateMorpheme("seed", {
        id: props.id,
        name: `task:${props.taskId}:${props.title.slice(0, 50)}`,
        content: `Task output: ${props.title} [${props.taskType}] via ${props.modelUsed} (${props.status})`,
        seedType: "task-output",
        status: props.status === "succeeded" ? "active" : "failed",
        runId: props.runId,
        taskId: props.taskId,
        title: props.title,
        taskType: props.taskType,
        modelUsed: props.modelUsed,
        provider: props.provider,
        outputLength: props.outputLength,
        durationMs: props.durationMs,
        qualityScore: props.qualityScore ?? null,
        hallucinationFlagCount: props.hallucinationFlagCount,
    }, props.runId, undefined, { subType: "TaskOutput" });
    if (!result.success) {
        throw new Error(`TaskOutput creation failed: ${result.error}`);
    }
    // Domain-specific wiring: PRODUCED relationship from PipelineRun
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (pr:PipelineRun {id: $runId}), (to:TaskOutput {id: $id})
       MERGE (pr)-[:PRODUCED]->(to)`, { runId: props.runId, id: props.id });
    });
}
/** Get all TaskOutputs for a PipelineRun */
export async function getTaskOutputsForRun(runId) {
    const result = await runQuery(`MATCH (pr:PipelineRun { id: $runId })-[:PRODUCED]->(to:TaskOutput)
     RETURN to
     ORDER BY to.taskId ASC`, { runId }, "READ");
    return result.records;
}
/** Query TaskOutputs by model pattern with optional quality threshold */
export async function queryTaskOutputsByModel(modelPattern, minQuality) {
    const qualityFilter = minQuality !== undefined
        ? " AND to.qualityScore >= $minQuality"
        : "";
    const result = await runQuery(`MATCH (pr:PipelineRun)-[:PRODUCED]->(to:TaskOutput)
     WHERE to.modelUsed CONTAINS $modelPattern${qualityFilter}
     RETURN to, pr
     ORDER BY to.createdAt DESC`, { modelPattern, minQuality: minQuality ?? null }, "READ");
    return result.records;
}
/** Update the qualityScore on an existing TaskOutput node */
export async function updateTaskOutputQuality(taskOutputId, qualityScore) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (to:TaskOutput { id: $taskOutputId })
       SET to.qualityScore = $qualityScore`, { taskOutputId, qualityScore });
    });
}
/** Get a single TaskOutput by ID */
export async function getTaskOutput(taskOutputId) {
    const result = await runQuery("MATCH (to:TaskOutput { id: $taskOutputId }) RETURN to", { taskOutputId }, "READ");
    return result.records[0] ?? null;
}
//# sourceMappingURL=task-output.js.map