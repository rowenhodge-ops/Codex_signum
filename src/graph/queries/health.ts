// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery } from "../client.js";
import type { PatternHealthContext } from "../write-observation.js";
import type { PhiLState } from "../../types/state-dimensions.js";
import type { GraphEdge, NodeHealth } from "../../computation/psi-h.js";
import { computePsiHWithState, createDefaultPsiHState } from "../../computation/psi-h.js";
import type { PsiH, PsiHState } from "../../types/state-dimensions.js";
import { computeMaturityFactor } from "../../computation/maturity.js";
import { computeUsageSuccessRate } from "../../computation/phi-l.js";
import { healthBand } from "../../computation/health-band.js";
import { updateBloomPsiH } from "./bloom.js";

// ============ PIPELINE ANALYTICS QUERIES ============

/**
 * Get ΦL and observation counts for each Architect pipeline stage Bloom.
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
    `MATCH (b:Bloom { id: $bloomId })-[:CONTAINS]->(r:Stage)
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

/** Get performance stats per pipeline stage (Stage Bloom-level) */
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
    `MATCH (b:Bloom { id: $bloomId })-[:CONTAINS]->(r:Stage)-[:PROCESSED]->(to:TaskOutput)
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

// ============ M-22.2: PATTERN HEALTH CONTEXT ASSEMBLY ============

/**
 * Query the graph for all data needed to construct PatternHealthContext.
 * This is the bridge between graph state and the ΦL computation chain.
 *
 * Returns null if the Bloom doesn't exist or has no observations yet
 * (cold start — conditioning-only mode still works via the null check
 * in writeObservation).
 *
 * V1 factor mapping:
 *   axiomCompliance  = 1.0 (assume compliant until Assayer wired)
 *   provenanceClarity = fraction of recent TaskOutputs with provenance fields
 *   usageSuccessRate  = succeeded / total from TaskOutput nodes
 *   temporalStability = computed from PhiLState ring buffer (persisted on Bloom)
 */
export async function assemblePatternHealthContext(
  bloomId: string,
): Promise<PatternHealthContext | null> {
  // Single query: bloom properties + observation count + degree + children count + task success/total
  const result = await runQuery(
    `MATCH (b:Bloom { id: $bloomId })
     OPTIONAL MATCH (o:Observation)-[:OBSERVED_IN]->(b)
     WHERE o.retained = true
     WITH b, count(o) AS obsCount
     OPTIONAL MATCH (b)-[r]-()
     WITH b, obsCount, count(r) AS connCount
     OPTIONAL MATCH (b)-[:CONTAINS]->(child)
     WITH b, obsCount, connCount, count(child) AS childCount
     OPTIONAL MATCH (to:TaskOutput)-[:PRODUCED_BY]->(pr:PipelineRun)-[:EXECUTED_IN]->(b)
     WITH b, obsCount, connCount, childCount,
          count(to) AS totalTasks,
          count(CASE WHEN to.status = 'succeeded' THEN 1 END) AS succeededTasks,
          count(CASE WHEN to.modelUsed IS NOT NULL AND to.provider IS NOT NULL AND to.runId IS NOT NULL THEN 1 END) AS withProvenance
     RETURN b.phiL AS phiL,
            b.healthBand AS healthBand,
            b.phiLState AS phiLState,
            b.commitSha AS commitSha,
            obsCount, connCount, childCount,
            totalTasks, succeededTasks, withProvenance`,
    { bloomId },
    "READ",
  );

  if (result.records.length === 0) return null;

  const rec = result.records[0];
  const obsCount = Number(rec.get("obsCount"));
  const connCount = Number(rec.get("connCount"));
  const childCount = Number(rec.get("childCount"));
  const totalTasks = Number(rec.get("totalTasks"));
  const succeededTasks = Number(rec.get("succeededTasks"));
  const withProvenance = Number(rec.get("withProvenance"));
  const previousPhiL: number | undefined = rec.get("phiL") != null ? Number(rec.get("phiL")) : undefined;
  const storedBand: string | null = rec.get("healthBand");
  const phiLStateJson: string | null = rec.get("phiLState");
  const commitSha: string | null = rec.get("commitSha");

  // Cold start: no observations yet — return null for conditioning-only mode
  if (obsCount === 0) return null;

  // Deserialise PhiLState ring buffer (persisted as JSON on Bloom)
  let phiLState: PhiLState | undefined;
  if (phiLStateJson) {
    try {
      phiLState = JSON.parse(phiLStateJson) as PhiLState;
    } catch {
      // Corrupted state — will be re-created
    }
  }

  // ── Factor computation (V1) ──────────────────────────────────────────

  // axiomCompliance: V1 default = 1.0 (assume compliant until Assayer wired)
  const axiomCompliance = 1.0;

  // provenanceClarity: fraction of TaskOutputs with provenance fields present
  // Also check if the Bloom itself has commitSha
  let provenanceClarity: number;
  if (totalTasks > 0) {
    const bloomProvenance = commitSha != null ? 1 : 0;
    // Weight: 80% task provenance + 20% bloom provenance
    provenanceClarity = 0.8 * (withProvenance / totalTasks) + 0.2 * bloomProvenance;
  } else {
    provenanceClarity = commitSha != null ? 0.5 : 0.3; // Some credit for bloom-level provenance
  }

  // usageSuccessRate: from TaskOutput success/total
  const usageSuccessRate = computeUsageSuccessRate(succeededTasks, totalTasks);

  // temporalStability: from ring buffer if available, else 0.5 (moderate default)
  let temporalStability = 0.5;
  if (phiLState && phiLState.ringBuffer.length >= 2) {
    const mean = phiLState.ringBuffer.reduce((a, b) => a + b, 0) / phiLState.ringBuffer.length;
    const variance = phiLState.ringBuffer.reduce((sum, v) => sum + (v - mean) ** 2, 0) / phiLState.ringBuffer.length;
    const MAX_EXPECTED_VARIANCE = 0.04;
    temporalStability = Math.max(0, Math.min(1, 1 - variance / MAX_EXPECTED_VARIANCE));
  }

  // ── Maturity + topology ──────────────────────────────────────────────

  const maturityIndex = computeMaturityFactor(obsCount, connCount);

  // Topology role heuristic
  const topologyRole: "hub" | "leaf" | "default" =
    childCount > 5 ? "hub" : childCount <= 1 ? "leaf" : "default";

  // Derive previousBand from stored value or from previousPhiL
  let previousBand = storedBand as PatternHealthContext["previousBand"];
  if (!previousBand && previousPhiL !== undefined) {
    previousBand = healthBand(previousPhiL, maturityIndex);
  }

  return {
    factors: {
      axiomCompliance,
      provenanceClarity,
      usageSuccessRate,
      temporalStability,
    },
    observationCount: obsCount,
    connectionCount: connCount,
    previousPhiL,
    previousBand,
    maturityIndex,
    topologyRole,
    degree: childCount,
  };
}

// ============ M-22.3: COMPOSITION SUBGRAPH EXTRACTION ============

/**
 * Extract the subgraph for ΨH computation on a specific Bloom composition.
 * Returns only edges between nodes CONTAINED by the target Bloom,
 * and health values for those contained nodes.
 *
 * Returns null if the Bloom has no children (ΨH undefined for empty composition).
 */
export async function getCompositionSubgraph(
  bloomId: string,
): Promise<{
  edges: GraphEdge[];
  nodeHealths: NodeHealth[];
} | null> {
  const result = await runQuery(
    `MATCH (parent:Bloom {id: $bloomId})-[:CONTAINS]->(child)
     WITH collect(child) AS children, collect(child.id) AS childIds
     UNWIND children AS c
     OPTIONAL MATCH (c)-[r]-(other)
     WHERE other.id IN childIds AND id(c) < id(other)
     RETURN c.id AS nodeId, COALESCE(c.phiL, 0.5) AS phiL,
            type(r) AS relType, other.id AS otherId,
            COALESCE(r.weight, 1.0) AS weight`,
    { bloomId },
    "READ",
  );

  if (result.records.length === 0) return null;

  // Deduplicate nodes and collect edges
  const nodeMap = new Map<string, number>();
  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];
  const nodeHealths: NodeHealth[] = [];

  for (const rec of result.records) {
    const nodeId = String(rec.get("nodeId"));
    const phiL = Number(rec.get("phiL"));

    // Add node (deduplicated)
    if (!nodeMap.has(nodeId)) {
      nodeMap.set(nodeId, phiL);
      nodeHealths.push({ id: nodeId, phiL });
    }

    // Add edge if present (deduplicated by from-to pair)
    const otherId = rec.get("otherId");
    if (otherId != null) {
      const edgeKey = `${nodeId}->${String(otherId)}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          from: nodeId,
          to: String(otherId),
          weight: Number(rec.get("weight")),
        });
      }
    }
  }

  // No children found
  if (nodeHealths.length === 0) return null;

  return { edges, nodeHealths };
}

/**
 * Compute ΨH for a Bloom composition and persist the result on the Bloom node.
 * Uses the stateful variant for temporal decomposition (EWMA trend + ring buffer).
 *
 * Flow:
 *   1. Extract composition subgraph (children + inter-edges)
 *   2. Read existing PsiHState from Bloom (JSON property)
 *   3. Compute ΨH with temporal decomposition
 *   4. Persist ΨH, decomposition, and updated state on Bloom
 *
 * Call after pipeline runs or topology changes (not inside writeObservation).
 *
 * @returns PsiH result, or null if the Bloom has no children
 */
export async function computeAndPersistPsiH(
  bloomId: string,
): Promise<PsiH | null> {
  // Step 1: Extract composition subgraph
  const subgraph = await getCompositionSubgraph(bloomId);
  if (!subgraph) return null;

  // Step 2: Read existing PsiHState from Bloom (JSON property, same pattern as PhiLState)
  const stateResult = await runQuery(
    `MATCH (b:Bloom {id: $bloomId}) RETURN b.psiHState AS psiHState`,
    { bloomId },
    "READ",
  );

  let state: PsiHState;
  const stateJson: string | null = stateResult.records[0]?.get("psiHState") ?? null;
  if (stateJson) {
    try {
      state = JSON.parse(stateJson) as PsiHState;
    } catch {
      state = createDefaultPsiHState();
    }
  } else {
    state = createDefaultPsiHState();
  }

  // Step 3: Compute ΨH with temporal decomposition
  const { psiH, decomposition, updatedState } = computePsiHWithState(
    subgraph.edges,
    subgraph.nodeHealths,
    state,
  );

  // Step 4: Persist on Bloom
  await updateBloomPsiH(
    bloomId,
    psiH.combined,
    psiH.lambda2,
    psiH.friction,
    decomposition.psiH_trend,
    JSON.stringify(updatedState),
  );

  return psiH;
}
