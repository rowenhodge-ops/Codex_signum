// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery, writeTransaction } from "../client.js";
import { instantiateMorpheme } from "../instantiation.js";
import type { HighlanderOptions } from "../instantiation.js";

// ============ TYPES ============

/**
 * PipelineRun nodes carry dual labels: :Bloom:PipelineRun
 * INSTANTIATES → def:morpheme:bloom + def:bloom:execution
 * Specialisation label :PipelineRun retained for constraint scoping and query performance.
 * type = 'pipeline'
 *
 * Created through instantiateMorpheme() with Highlander Protocol.
 * a6Justification: distinct_temporal_scale — every run is a unique temporal instance.
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
export async function createPipelineRun(
  props: PipelineRunProps,
): Promise<void> {
  const highlander: HighlanderOptions = {
    transformationDefId: "def:bloom:execution",
    a6Justification: "distinct_temporal_scale",
  };

  const result = await instantiateMorpheme(
    "bloom",
    {
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
    },
    props.bloomId,
    highlander,
  );

  if (!result.success) {
    throw new Error(`PipelineRun creation failed: ${result.error}`);
  }

  // Add :PipelineRun specialisation label for query performance + constraint scoping
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (pr:Bloom {id: $id}) SET pr:PipelineRun`,
      { id: props.id },
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
