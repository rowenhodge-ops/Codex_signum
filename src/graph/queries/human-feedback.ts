// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery, writeTransaction } from "../client.js";

// ============ TYPES ============

/** Properties for recording human feedback on a pipeline run */
export interface HumanFeedbackProps {
  id: string;
  runId: string;
  verdict: "accept" | "reject" | "partial";
  reason?: string;
  taskVerdicts?: Array<{
    taskId: string;
    verdict: "accept" | "reject";
    reason?: string;
  }>;
}

/** Calibration metrics comparing human verdicts to LLM quality scores */
export interface CalibrationMetrics {
  totalRuns: number;
  accepted: number;
  rejected: number;
  partial: number;
  acceptRate: number;
  /** How often LLM quality > 0.7 matches human accept */
  validatorPrecision: number;
  /** How often human accept matches LLM quality > 0.7 */
  validatorRecall: number;
}

// ============ HUMAN FEEDBACK QUERIES ============

/**
 * Record human feedback for a pipeline run.
 * When verdict is "reject", applies quality penalty to Decision nodes
 * so Thompson posteriors incorporate human signal.
 */
export async function recordHumanFeedback(
  props: HumanFeedbackProps,
): Promise<void> {
  await writeTransaction(async (tx) => {
    // Create HumanFeedback node
    await tx.run(
      `CREATE (hf:HumanFeedback {
         id: $id,
         runId: $runId,
         verdict: $verdict,
         reason: $reason,
         timestamp: datetime()
       })`,
      {
        id: props.id,
        runId: props.runId,
        verdict: props.verdict,
        reason: props.reason ?? null,
      },
    );

    // Apply quality penalties based on verdict.
    // Rejection flips d.success to false so Thompson's Beta(alpha, beta)
    // posteriors incorporate the human signal — without this, the 0.5x quality
    // penalty only affected avgQuality (presentation-order), not the actual
    // Beta sampling that drives model selection.
    if (props.verdict === "reject") {
      await tx.run(
        `MATCH (d:Decision)
         WHERE d.runId = $runId AND d.success = true
         SET d.humanOverride = 'rejected',
             d.success = false,
             d.adjustedQuality = d.qualityScore * 0.5,
             d.humanFeedbackId = $feedbackId`,
        { runId: props.runId, feedbackId: props.id },
      );
    } else if (props.verdict === "accept") {
      // Confirm LLM scores — mark as human-validated
      await tx.run(
        `MATCH (d:Decision)
         WHERE d.runId = $runId AND d.status = 'completed'
         SET d.humanOverride = 'accepted',
             d.humanFeedbackId = $feedbackId`,
        { runId: props.runId, feedbackId: props.id },
      );
    }

    // Apply per-task verdicts if provided (for partial feedback)
    if (props.taskVerdicts) {
      for (const tv of props.taskVerdicts) {
        if (tv.verdict === "reject") {
          await tx.run(
            `MATCH (d:Decision)
             WHERE d.runId = $runId AND d.taskId = $taskId AND d.success = true
             SET d.humanOverride = 'rejected',
                 d.success = false,
                 d.adjustedQuality = d.qualityScore * 0.5,
                 d.humanFeedbackId = $feedbackId`,
            { runId: props.runId, taskId: tv.taskId, feedbackId: props.id },
          );
        } else {
          await tx.run(
            `MATCH (d:Decision)
             WHERE d.runId = $runId AND d.taskId = $taskId
             SET d.humanOverride = 'accepted',
                 d.humanFeedbackId = $feedbackId`,
            { runId: props.runId, taskId: tv.taskId, feedbackId: props.id },
          );
        }
      }
    }
  });
}

/** Get human feedback for a specific run */
export async function getHumanFeedbackForRun(
  runId: string,
): Promise<Neo4jRecord | null> {
  const result = await runQuery(
    `MATCH (hf:HumanFeedback { runId: $runId })
     RETURN hf
     ORDER BY hf.timestamp DESC
     LIMIT 1`,
    { runId },
    "READ",
  );
  return result.records[0] ?? null;
}

/** List pipeline runs that have no human feedback */
export async function listPendingFeedbackRuns(): Promise<
  Array<{ runId: string; taskCount: number; timestamp: string }>
> {
  const result = await runQuery(
    `MATCH (d:Decision)
     WHERE d.runId IS NOT NULL AND d.status = 'completed'
     WITH d.runId AS runId, count(d) AS taskCount, max(d.timestamp) AS lastTimestamp
     WHERE NOT EXISTS {
       MATCH (hf:HumanFeedback { runId: runId })
     }
     RETURN runId, taskCount, toString(lastTimestamp) AS timestamp
     ORDER BY lastTimestamp DESC
     LIMIT 20`,
    {},
    "READ",
  );
  return result.records.map((r) => ({
    runId: r.get("runId"),
    taskCount: r.get("taskCount"),
    timestamp: r.get("timestamp"),
  }));
}

/** Compute calibration metrics: human verdict vs LLM quality scores */
export async function getCalibrationMetrics(): Promise<CalibrationMetrics> {
  const result = await runQuery(
    `MATCH (hf:HumanFeedback)
     WITH hf.verdict AS verdict, count(hf) AS cnt
     RETURN verdict, cnt`,
    {},
    "READ",
  );

  let accepted = 0;
  let rejected = 0;
  let partial = 0;
  for (const r of result.records) {
    const v = r.get("verdict") as string;
    const c = r.get("cnt") as number;
    if (v === "accept") accepted = c;
    else if (v === "reject") rejected = c;
    else if (v === "partial") partial = c;
  }
  const totalRuns = accepted + rejected + partial;

  // Compute validator precision and recall
  // Precision: of decisions where LLM scored quality > 0.7, how many did human accept?
  // Recall: of decisions human accepted, how many had LLM quality > 0.7?
  const precRecall = await runQuery(
    `MATCH (d:Decision)
     WHERE d.humanOverride IS NOT NULL AND d.qualityScore IS NOT NULL
     WITH d,
          CASE WHEN d.qualityScore > 0.7 THEN true ELSE false END AS llmPositive,
          CASE WHEN d.humanOverride = 'accepted' THEN true ELSE false END AS humanPositive
     RETURN
       sum(CASE WHEN llmPositive AND humanPositive THEN 1 ELSE 0 END) AS truePositive,
       sum(CASE WHEN llmPositive AND NOT humanPositive THEN 1 ELSE 0 END) AS falsePositive,
       sum(CASE WHEN NOT llmPositive AND humanPositive THEN 1 ELSE 0 END) AS falseNegative`,
    {},
    "READ",
  );

  const tp = (precRecall.records[0]?.get("truePositive") as number) ?? 0;
  const fp = (precRecall.records[0]?.get("falsePositive") as number) ?? 0;
  const fn = (precRecall.records[0]?.get("falseNegative") as number) ?? 0;

  return {
    totalRuns,
    accepted,
    rejected,
    partial,
    acceptRate: totalRuns > 0 ? accepted / totalRuns : 0,
    validatorPrecision: tp + fp > 0 ? tp / (tp + fp) : 0,
    validatorRecall: tp + fn > 0 ? tp / (tp + fn) : 0,
  };
}
