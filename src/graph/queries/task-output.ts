// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery, writeTransaction } from "../client.js";

// ============ TYPES ============

/** Properties for a TaskOutput node (Stratum 2 — individual task result) */
export interface TaskOutputProps {
  id: string; // `${runId}_${taskId}`
  runId: string; // links to PipelineRun
  taskId: string; // t1, t2, etc.
  title: string;
  taskType: string; // "generative" | "mechanical" | "analytical"
  modelUsed: string; // model ID from routing decision
  provider: string;
  outputLength: number; // chars
  durationMs: number;
  qualityScore?: number; // if available from quality assessment
  hallucinationFlagCount: number;
  status: "succeeded" | "failed";
}

// ============ TASK OUTPUT QUERIES ============

/** Create a TaskOutput node and link to its PipelineRun */
export async function createTaskOutput(
  props: TaskOutputProps,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `CREATE (to:TaskOutput {
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
       MERGE (pr)-[:PRODUCED]->(to)`,
      {
        ...props,
        qualityScore: props.qualityScore ?? null,
      },
    );
  });
}

/** Get all TaskOutputs for a PipelineRun */
export async function getTaskOutputsForRun(
  runId: string,
): Promise<Neo4jRecord[]> {
  const result = await runQuery(
    `MATCH (pr:PipelineRun { id: $runId })-[:PRODUCED]->(to:TaskOutput)
     RETURN to
     ORDER BY to.taskId ASC`,
    { runId },
    "READ",
  );
  return result.records;
}

/** Query TaskOutputs by model pattern with optional quality threshold */
export async function queryTaskOutputsByModel(
  modelPattern: string,
  minQuality?: number,
): Promise<Neo4jRecord[]> {
  const qualityFilter =
    minQuality !== undefined
      ? " AND to.qualityScore >= $minQuality"
      : "";
  const result = await runQuery(
    `MATCH (pr:PipelineRun)-[:PRODUCED]->(to:TaskOutput)
     WHERE to.modelUsed CONTAINS $modelPattern${qualityFilter}
     RETURN to, pr
     ORDER BY to.createdAt DESC`,
    { modelPattern, minQuality: minQuality ?? null },
    "READ",
  );
  return result.records;
}

/** Update the qualityScore on an existing TaskOutput node */
export async function updateTaskOutputQuality(
  taskOutputId: string,
  qualityScore: number,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (to:TaskOutput { id: $taskOutputId })
       SET to.qualityScore = $qualityScore`,
      { taskOutputId, qualityScore },
    );
  });
}

/** Get a single TaskOutput by ID */
export async function getTaskOutput(
  taskOutputId: string,
): Promise<Neo4jRecord | null> {
  const result = await runQuery(
    "MATCH (to:TaskOutput { id: $taskOutputId }) RETURN to",
    { taskOutputId },
    "READ",
  );
  return result.records[0] ?? null;
}
