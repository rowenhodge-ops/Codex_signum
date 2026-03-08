// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery, writeTransaction } from "../client.js";
// ============ TASK OUTPUT QUERIES ============
/** Create a TaskOutput node and link to its PipelineRun */
export async function createTaskOutput(props) {
    await writeTransaction(async (tx) => {
        await tx.run(`CREATE (to:TaskOutput {
         id: $id,
         runId: $runId,
         taskId: $taskId,
         title: $title,
         taskType: $taskType,
         modelUsed: $modelUsed,
         provider: $provider,
         outputLength: $outputLength,
         durationMs: $durationMs,
         qualityScore: $qualityScore,
         hallucinationFlagCount: $hallucinationFlagCount,
         status: $status,
         createdAt: datetime()
       })
       WITH to
       MATCH (pr:PipelineRun { id: $runId })
       MERGE (pr)-[:PRODUCED]->(to)`, {
            ...props,
            qualityScore: props.qualityScore ?? null,
        });
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