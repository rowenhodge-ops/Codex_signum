// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery, writeTransaction } from "../client.js";

// ============ TYPES ============

/**
 * PipelineRun nodes carry dual labels: :Bloom:PipelineRun
 * INSTANTIATES → def:morpheme:bloom
 * Specialisation label :PipelineRun retained for constraint scoping and query performance.
 * type = 'execution'
 */

/** Properties for a PipelineRun node (Stratum 2 — execution instance) */
export interface PipelineRunProps {
  id: string; // runId from bootstrap-task-executor
  intent: string; // what the pipeline was asked to do
  bloomId: string; // which Bloom (Architect pattern) owns this run
  taskCount: number;
  startedAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp (set when run completes)
  durationMs?: number;
  modelDiversity?: number; // count of distinct models used
  overallQuality?: number; // aggregate quality score (0-1)
  status: "running" | "completed" | "failed";
}

/** Canonical Architect pipeline stages */
export const ARCHITECT_STAGES = [
  "SURVEY",
  "DECOMPOSE",
  "CLASSIFY",
  "SEQUENCE",
  "GATE",
  "DISPATCH",
  "ADAPT",
] as const;

// ============ PIPELINE RUN QUERIES ============

/** Create or update a PipelineRun node */
export async function createPipelineRun(
  props: PipelineRunProps,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (pr:PipelineRun { id: $id })
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
       MERGE (pr)-[:EXECUTED_IN]->(b)`,
      {
        ...props,
        completedAt: props.completedAt ?? null,
        durationMs: props.durationMs ?? null,
        modelDiversity: props.modelDiversity ?? null,
        overallQuality: props.overallQuality ?? null,
      },
    );
  });
}

/** Update a PipelineRun when it completes */
export async function completePipelineRun(
  runId: string,
  completedAt: string,
  durationMs: number,
  overallQuality: number,
  modelDiversity: number,
  taskCount?: number,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (pr:PipelineRun { id: $runId })
       SET pr.status = 'completed',
           pr.completedAt = datetime($completedAt),
           pr.durationMs = $durationMs,
           pr.overallQuality = $overallQuality,
           pr.modelDiversity = $modelDiversity,
           pr.taskCount = COALESCE($taskCount, pr.taskCount),
           pr.updatedAt = datetime()`,
      { runId, completedAt, durationMs, overallQuality, modelDiversity, taskCount: taskCount ?? null },
    );
  });
}

/** Get a specific PipelineRun by ID */
export async function getPipelineRun(
  runId: string,
): Promise<Neo4jRecord | null> {
  const result = await runQuery(
    "MATCH (pr:PipelineRun { id: $runId }) RETURN pr",
    { runId },
    "READ",
  );
  return result.records[0] ?? null;
}

/** List recent PipelineRuns for a Bloom, ordered by startedAt DESC */
export async function listPipelineRuns(
  bloomId: string,
  limit: number = 20,
): Promise<Neo4jRecord[]> {
  const result = await runQuery(
    `MATCH (pr:PipelineRun { bloomId: $bloomId })
     RETURN pr
     ORDER BY pr.startedAt DESC
     LIMIT toInteger($limit)`,
    { bloomId, limit },
    "READ",
  );
  return result.records;
}

// ============ PIPELINE LIFECYCLE EXTENSIONS (M-9.5) ============

/** Mark a PipelineRun as failed with an error message */
export async function failPipelineRun(
  runId: string,
  error: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (pr:PipelineRun { id: $runId })
       SET pr.status = 'failed',
           pr.error = $error,
           pr.completedAt = datetime(),
           pr.updatedAt = datetime()`,
      { runId, error },
    );
  });
}
