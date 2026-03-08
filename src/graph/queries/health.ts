// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery } from "../client.js";

// ============ PIPELINE ANALYTICS QUERIES ============

/**
 * Get ΦL and observation counts for each Architect pipeline stage Resonator.
 * Answers: "which pipeline stage is performing best/worst?"
 */
export async function getPipelineStageHealth(
  architectBloomId: string,
): Promise<Array<{
  stage: string;
  resonatorId: string;
  phiL: number;
  observationCount: number;
}>> {
  const result = await runQuery(
    `MATCH (b:Bloom { id: $bloomId })-[:CONTAINS]->(r:Resonator)
     OPTIONAL MATCH (r)-[:PROCESSED]->(to:TaskOutput)
     RETURN r.name AS stage, r.id AS resonatorId,
            COALESCE(r.phiL, 0.0) AS phiL, count(to) AS observationCount
     ORDER BY r.name`,
    { bloomId: architectBloomId },
    "READ",
  );
  return result.records.map((rec) => ({
    stage: String(rec.get("stage")),
    resonatorId: String(rec.get("resonatorId")),
    phiL: Number(rec.get("phiL")),
    observationCount: Number(rec.get("observationCount")),
  }));
}

/**
 * Get aggregate pipeline run statistics from the graph.
 * Answers: "how is my pipeline performing over time?"
 */
export async function getPipelineRunStats(
  architectBloomId: string,
  limit: number = 20,
): Promise<Array<{
  runId: string;
  intent: string;
  taskCount: number;
  overallQuality: number;
  modelDiversity: number;
  durationMs: number;
  startedAt: string;
}>> {
  const result = await runQuery(
    `MATCH (pr:PipelineRun)-[:EXECUTED_IN]->(b:Bloom { id: $bloomId })
     WHERE pr.status = 'completed'
     RETURN pr.id AS runId, pr.intent AS intent,
            COALESCE(pr.taskCount, 0) AS taskCount,
            COALESCE(pr.overallQuality, 0.0) AS overallQuality,
            COALESCE(pr.modelDiversity, 0) AS modelDiversity,
            COALESCE(pr.durationMs, 0) AS durationMs,
            pr.startedAt AS startedAt
     ORDER BY pr.startedAt DESC
     LIMIT toInteger($limit)`,
    { bloomId: architectBloomId, limit },
    "READ",
  );
  return result.records.map((rec) => ({
    runId: String(rec.get("runId")),
    intent: String(rec.get("intent")),
    taskCount: Number(rec.get("taskCount")),
    overallQuality: Number(rec.get("overallQuality")),
    modelDiversity: Number(rec.get("modelDiversity")),
    durationMs: Number(rec.get("durationMs")),
    startedAt: String(rec.get("startedAt")),
  }));
}

/** Get compaction history for a bloom — observation deletion audit trail */
export async function getCompactionHistory(
  bloomId: string,
  limit: number = 50,
): Promise<Array<{
  distillationId: string;
  observationCount: number;
  confidence: number;
  createdAt: Date;
}>> {
  const result = await runQuery(
    `MATCH (di:Distillation)
     WHERE di.bloomId = $bloomId AND di.supersededAt IS NULL
     RETURN di.id AS distillationId,
            di.observationCount AS observationCount,
            di.confidence AS confidence,
            di.createdAt AS createdAt
     ORDER BY di.createdAt DESC
     LIMIT toInteger($limit)`,
    { bloomId, limit },
    "READ",
  );
  return result.records.map((r) => ({
    distillationId: r.get("distillationId"),
    observationCount: Number(r.get("observationCount")),
    confidence: Number(r.get("confidence")),
    createdAt: new Date(r.get("createdAt")),
  }));
}

/** Get aggregate model performance across all pipeline runs */
export async function getModelPerformance(
  limit: number = 20,
): Promise<Array<{
  modelUsed: string;
  provider: string;
  taskCount: number;
  avgQuality: number;
  avgDurationMs: number;
  successRate: number;
}>> {
  const result = await runQuery(
    `MATCH (to:TaskOutput)
     WITH to.modelUsed AS modelUsed,
          to.provider AS provider,
          count(to) AS taskCount,
          avg(COALESCE(to.qualityScore, 0.0)) AS avgQuality,
          avg(to.durationMs) AS avgDurationMs,
          toFloat(count(CASE WHEN to.status = 'succeeded' THEN 1 END)) / count(to) AS successRate
     RETURN modelUsed, provider, taskCount, avgQuality, avgDurationMs, successRate
     ORDER BY taskCount DESC
     LIMIT toInteger($limit)`,
    { limit },
    "READ",
  );
  return result.records.map((r) => ({
    modelUsed: String(r.get("modelUsed")),
    provider: String(r.get("provider")),
    taskCount: Number(r.get("taskCount")),
    avgQuality: Number(r.get("avgQuality")),
    avgDurationMs: Number(r.get("avgDurationMs")),
    successRate: Number(r.get("successRate")),
  }));
}

/** Get performance stats per pipeline stage (Resonator-level) */
export async function getStagePerformance(
  architectBloomId: string,
): Promise<Array<{
  stage: string;
  taskCount: number;
  avgQuality: number;
  avgDurationMs: number;
  successRate: number;
}>> {
  const result = await runQuery(
    `MATCH (b:Bloom { id: $bloomId })-[:CONTAINS]->(r:Resonator)-[:PROCESSED]->(to:TaskOutput)
     WITH r.name AS stage,
          count(to) AS taskCount,
          avg(COALESCE(to.qualityScore, 0.0)) AS avgQuality,
          avg(to.durationMs) AS avgDurationMs,
          toFloat(count(CASE WHEN to.status = 'succeeded' THEN 1 END)) / count(to) AS successRate
     RETURN stage, taskCount, avgQuality, avgDurationMs, successRate
     ORDER BY stage`,
    { bloomId: architectBloomId },
    "READ",
  );
  return result.records.map((r) => ({
    stage: String(r.get("stage")),
    taskCount: Number(r.get("taskCount")),
    avgQuality: Number(r.get("avgQuality")),
    avgDurationMs: Number(r.get("avgDurationMs")),
    successRate: Number(r.get("successRate")),
  }));
}

/** Compare two pipeline runs side-by-side */
export async function getRunComparison(
  runIdA: string,
  runIdB: string,
): Promise<{
  runA: { id: string; intent: string; taskCount: number; overallQuality: number; durationMs: number; status: string } | null;
  runB: { id: string; intent: string; taskCount: number; overallQuality: number; durationMs: number; status: string } | null;
}> {
  const extractRun = (rec: Neo4jRecord | undefined) => {
    if (!rec) return null;
    const pr = rec.get("pr");
    return {
      id: String(pr.properties.id),
      intent: String(pr.properties.intent),
      taskCount: Number(pr.properties.taskCount ?? 0),
      overallQuality: Number(pr.properties.overallQuality ?? 0),
      durationMs: Number(pr.properties.durationMs ?? 0),
      status: String(pr.properties.status),
    };
  };
  const resultA = await runQuery(
    "MATCH (pr:PipelineRun { id: $runId }) RETURN pr",
    { runId: runIdA },
    "READ",
  );
  const resultB = await runQuery(
    "MATCH (pr:PipelineRun { id: $runId }) RETURN pr",
    { runId: runIdB },
    "READ",
  );
  return {
    runA: extractRun(resultA.records[0]),
    runB: extractRun(resultB.records[0]),
  };
}
