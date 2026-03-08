// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery, writeTransaction } from "../client.js";

// ============ TYPES ============

/** Properties for recording a Decision */
export interface DecisionProps {
  id: string;
  taskType: string;
  complexity: "trivial" | "moderate" | "complex" | "critical";
  domain?: string;
  selectedSeedId: string;
  madeByBloomId?: string;
  wasExploratory: boolean;
  contextClusterId?: string;
  qualityRequirement?: number;
  costCeiling?: number;
  /** Pipeline run ID — enables human feedback queries */
  runId?: string;
  /** Task ID within the pipeline run — enables per-task feedback */
  taskId?: string;
}

/** Properties for recording a Decision Outcome */
export interface DecisionOutcomeProps {
  decisionId: string;
  success: boolean;
  qualityScore: number;
  durationMs: number;
  cost?: number;
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
  errorType?: string;
  notes?: string;
  infrastructure?: boolean;
}

/** Properties for a Context Cluster (Thompson Sampling) */
export interface ContextClusterProps {
  id: string;
  taskType: string;
  complexity: string;
  domain?: string;
}

// ============ DECISION QUERIES ============

export async function recordDecision(props: DecisionProps): Promise<void> {
  await writeTransaction(async (tx) => {
    // Create Decision node
    await tx.run(
      `CREATE (d:Decision {
         id: $id,
        selectedSeedId: $selectedSeedId,
         taskType: $taskType,
         complexity: $complexity,
         domain: $domain,
         wasExploratory: $wasExploratory,
         qualityRequirement: $qualityRequirement,
         costCeiling: $costCeiling,
         runId: $runId,
         taskId: $taskId,
         timestamp: datetime(),
         status: 'pending'
       })
       WITH d
       MATCH (s:Seed { id: $selectedSeedId })
       MERGE (d)-[:ROUTED_TO]->(s)
       WITH d
       OPTIONAL MATCH (b:Bloom { id: $madeByBloomId })
       FOREACH (_ IN CASE WHEN b IS NOT NULL THEN [1] ELSE [] END |
         MERGE (d)-[:ORIGINATED_FROM]->(b)
       )
       WITH d
       OPTIONAL MATCH (cc:ContextCluster { id: $contextClusterId })
       FOREACH (_ IN CASE WHEN cc IS NOT NULL THEN [1] ELSE [] END |
         MERGE (d)-[:IN_CONTEXT]->(cc)
       )`,
      {
        ...props,
        domain: props.domain ?? null,
        madeByBloomId: props.madeByBloomId ?? null,
        contextClusterId: props.contextClusterId ?? null,
        qualityRequirement: props.qualityRequirement ?? null,
        costCeiling: props.costCeiling ?? null,
        runId: props.runId ?? null,
        taskId: props.taskId ?? null,
      },
    );
  });
}

export async function recordDecisionOutcome(
  props: DecisionOutcomeProps,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (d:Decision { id: $decisionId })
       SET d.status = 'completed',
           d.success = $success,
           d.qualityScore = $qualityScore,
           d.durationMs = $durationMs,
           d.cost = $cost,
           d.inputTokens = $inputTokens,
           d.outputTokens = $outputTokens,
           d.thinkingTokens = $thinkingTokens,
           d.errorType = $errorType,
           d.notes = $notes,
           d.infrastructure = $infrastructure,
           d.completedAt = datetime()`,
      {
        ...props,
        cost: props.cost ?? null,
        inputTokens: props.inputTokens ?? null,
        outputTokens: props.outputTokens ?? null,
        thinkingTokens: props.thinkingTokens ?? null,
        errorType: props.errorType ?? null,
        notes: props.notes ?? null,
        infrastructure: props.infrastructure ?? null,
      },
    );
  });
}

/** Get recent decisions for a context cluster (Thompson Sampling) */
export async function getDecisionsForCluster(
  clusterId: string,
  limit: number = 100,
): Promise<Neo4jRecord[]> {
  const result = await runQuery(
    `MATCH (d:Decision)-[:IN_CONTEXT]->(cc:ContextCluster { id: $clusterId })
     WHERE d.status = 'completed' AND (d.infrastructure IS NULL OR d.infrastructure = false)
     MATCH (d)-[:ROUTED_TO]->(s:Seed)
     RETURN d, s
     ORDER BY d.timestamp DESC
     LIMIT toInteger($limit)`,
    { clusterId, limit },
    "READ",
  );
  return result.records;
}

// ============ CONTEXT CLUSTER QUERIES ============

export async function ensureContextCluster(
  props: ContextClusterProps,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (cc:ContextCluster { id: $id })
       ON CREATE SET
         cc.taskType = $taskType,
         cc.complexity = $complexity,
         cc.domain = $domain,
         cc.createdAt = datetime()`,
      {
        ...props,
        domain: props.domain ?? null,
      },
    );
  });
}

// ============ DECISION LIFECYCLE QUERIES ============

/**
 * Update the qualityScore on an existing Decision node.
 * This is the surgical update path for when the task executor
 * computes real quality after the Thompson router's initial
 * outcome recording (which uses a default 0.7).
 */
export async function updateDecisionQuality(
  decisionId: string,
  qualityScore: number,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (d:Decision { id: $decisionId })
       SET d.qualityScore = $qualityScore`,
      { decisionId, qualityScore },
    );
  });
}

/**
 * Find the Decision node that routed a specific task by bloom and model.
 * Returns the Decision ID if found, undefined if not.
 * Uses madeByBloomId + selectedSeedId + timestamp range for matching.
 */
export async function findDecisionForTask(
  bloomId: string,
  modelSeedId: string,
  afterTimestamp: string,
): Promise<string | undefined> {
  const result = await runQuery(
    `MATCH (d:Decision)
     WHERE d.selectedSeedId = $modelSeedId
       AND ($bloomId IS NULL OR d.madeByBloomId IS NULL OR d.madeByBloomId = $bloomId)
       AND d.timestamp >= datetime($afterTimestamp)
     RETURN d.id AS id
     ORDER BY d.timestamp DESC
     LIMIT 1`,
    { bloomId: bloomId ?? null, modelSeedId, afterTimestamp },
    "READ",
  );
  return result.records[0]?.get("id") ?? undefined;
}

/** Link a Decision node to the PipelineRun it was made during */
export async function linkDecisionToPipelineRun(
  decisionId: string,
  runId: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (d:Decision { id: $decisionId }),
             (pr:PipelineRun { id: $runId })
       MERGE (d)-[:DECIDED_DURING]->(pr)`,
      { decisionId, runId },
    );
  });
}

/** Get all Decision nodes linked to a PipelineRun */
export async function getDecisionsForRun(
  runId: string,
): Promise<Neo4jRecord[]> {
  const result = await runQuery(
    `MATCH (d:Decision)-[:DECIDED_DURING]->(pr:PipelineRun { id: $runId })
     RETURN d
     ORDER BY d.timestamp ASC`,
    { runId },
    "READ",
  );
  return result.records;
}
