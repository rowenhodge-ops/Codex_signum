// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Neo4j Graph Queries
 *
 * Reusable query builders for creating, reading, and relating
 * Codex entities in Neo4j. All state mutations flow through here.
 *
 * M-7C: Uses morpheme-native names (Seed, Bloom, ROUTED_TO, etc.)
 *
 * @module codex-signum-core/graph/queries
 */

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery, writeTransaction } from "./client.js";

// ============ TYPES ============

/** Properties for creating a Seed node (compute substrate — LLM model instance) */
export interface SeedProps {
  // === Identity ===
  id: string;
  name: string;
  provider: string;
  model: string;
  baseModelId: string;

  // === Configuration Arm ===
  thinkingMode: "adaptive" | "extended" | "none" | "default";
  thinkingParameter?: string;

  // === Capabilities ===
  capabilities?: string[];
  supportsAdaptiveThinking?: boolean;
  supportsExtendedThinking?: boolean;
  supportsInterleavedThinking?: boolean;
  supportsPrefilling?: boolean;
  supportsStructuredOutputs?: boolean;
  supportsWebSearch?: boolean;
  supportsComputerUse?: boolean;

  // === Context Limits ===
  maxContextWindow?: number;
  maxOutputTokens?: number;

  // === Cost ===
  costPer1kInput?: number;
  costPer1kOutput?: number;
  avgLatencyMs?: number;
  costPer1kTokens?: number;

  // === Performance ===
  status?: "active" | "inactive" | "degraded" | "retired";

  // === Infrastructure ===
  region?: string;
  endpoint?: string;

  // === Sentinel ===
  lastProbed?: string;
  lastUsed?: string;
  probeFailures?: number;
}

/** Properties for creating/updating a Bloom node (scoped composition of morphemes) */
export interface BloomProps {
  id: string;
  name: string;
  description?: string;
  state?: string; // IntegrationState
  morphemeKinds?: string[]; // which morpheme types compose this bloom
  domain?: string;
}

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

/** Properties for recording an Observation */
export interface ObservationProps {
  id: string;
  sourceBloomId: string;
  metric: string;
  value: number;
  unit?: string;
  context?: string;
}

/** Properties for a Distillation */
export interface DistillationProps {
  id: string;
  pattern: string;
  confidence: number;
  observationCount: number;
  sourceObservationIds: string[];
  insight: string;
}

/** Properties for a Context Cluster (Thompson Sampling) */
export interface ContextClusterProps {
  id: string;
  taskType: string;
  complexity: string;
  domain?: string;
}

/** Thompson Sampling arm stats */
export interface ArmStats {
  seedId: string;
  alpha: number; // successes + 1
  beta: number; // failures + 1
  totalTrials: number;
  avgQuality: number;
  avgLatencyMs: number;
  avgCost: number;
  totalCost: number;
}

// ============ PIPELINE TOPOLOGY TYPES ============

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

// ============ SEED QUERIES ============

export async function createSeed(props: SeedProps): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (s:Seed { id: $id })
       ON CREATE SET
         s.name = $name,
         s.provider = $provider,
         s.model = $model,
         s.baseModelId = $baseModelId,
         s.thinkingMode = $thinkingMode,
         s.thinkingParameter = $thinkingParameter,
         s.capabilities = $capabilities,
         s.supportsAdaptiveThinking = $supportsAdaptiveThinking,
         s.supportsExtendedThinking = $supportsExtendedThinking,
         s.supportsInterleavedThinking = $supportsInterleavedThinking,
         s.supportsPrefilling = $supportsPrefilling,
         s.supportsStructuredOutputs = $supportsStructuredOutputs,
         s.supportsWebSearch = $supportsWebSearch,
         s.supportsComputerUse = $supportsComputerUse,
         s.maxContextWindow = $maxContextWindow,
         s.maxOutputTokens = $maxOutputTokens,
         s.costPer1kInput = $costPer1kInput,
         s.costPer1kOutput = $costPer1kOutput,
         s.avgLatencyMs = $avgLatencyMs,
         s.costPer1kTokens = $costPer1kTokens,
         s.status = $status,
         s.region = $region,
         s.endpoint = $endpoint,
         s.lastProbed = $lastProbed,
         s.lastUsed = $lastUsed,
         s.probeFailures = 0,
         s.createdAt = datetime()
       ON MATCH SET
         s.name = $name,
         s.provider = $provider,
         s.model = $model,
         s.baseModelId = $baseModelId,
         s.thinkingMode = $thinkingMode,
         s.thinkingParameter = COALESCE($thinkingParameter, s.thinkingParameter),
         s.capabilities = COALESCE($capabilities, s.capabilities),
         s.supportsAdaptiveThinking = COALESCE($supportsAdaptiveThinking, s.supportsAdaptiveThinking),
         s.supportsExtendedThinking = COALESCE($supportsExtendedThinking, s.supportsExtendedThinking),
         s.supportsInterleavedThinking = COALESCE($supportsInterleavedThinking, s.supportsInterleavedThinking),
         s.supportsPrefilling = COALESCE($supportsPrefilling, s.supportsPrefilling),
         s.supportsStructuredOutputs = COALESCE($supportsStructuredOutputs, s.supportsStructuredOutputs),
         s.supportsWebSearch = COALESCE($supportsWebSearch, s.supportsWebSearch),
         s.supportsComputerUse = COALESCE($supportsComputerUse, s.supportsComputerUse),
         s.maxContextWindow = COALESCE($maxContextWindow, s.maxContextWindow),
         s.maxOutputTokens = COALESCE($maxOutputTokens, s.maxOutputTokens),
         s.costPer1kInput = COALESCE($costPer1kInput, s.costPer1kInput),
         s.costPer1kOutput = COALESCE($costPer1kOutput, s.costPer1kOutput),
         s.avgLatencyMs = COALESCE($avgLatencyMs, s.avgLatencyMs),
         s.costPer1kTokens = COALESCE($costPer1kTokens, s.costPer1kTokens),
         s.status = COALESCE($status, s.status),
         s.region = COALESCE($region, s.region),
         s.endpoint = COALESCE($endpoint, s.endpoint),
         s.lastProbed = COALESCE($lastProbed, s.lastProbed),
         s.lastUsed = COALESCE($lastUsed, s.lastUsed),
         s.probeFailures = COALESCE($probeFailures, s.probeFailures),
         s.updatedAt = datetime()`,
      {
        ...props,
        baseModelId: props.baseModelId,
        thinkingMode: props.thinkingMode,
        thinkingParameter: props.thinkingParameter ?? null,
        supportsAdaptiveThinking: props.supportsAdaptiveThinking ?? null,
        supportsExtendedThinking: props.supportsExtendedThinking ?? null,
        supportsInterleavedThinking: props.supportsInterleavedThinking ?? null,
        supportsPrefilling: props.supportsPrefilling ?? null,
        supportsStructuredOutputs: props.supportsStructuredOutputs ?? null,
        supportsWebSearch: props.supportsWebSearch ?? null,
        supportsComputerUse: props.supportsComputerUse ?? null,
        maxContextWindow: props.maxContextWindow ?? null,
        maxOutputTokens: props.maxOutputTokens ?? null,
        costPer1kInput: props.costPer1kInput ?? null,
        costPer1kOutput: props.costPer1kOutput ?? null,
        avgLatencyMs: props.avgLatencyMs ?? null,
        costPer1kTokens: props.costPer1kTokens ?? null,
        status: props.status ?? "active",
        capabilities: props.capabilities ?? [],
        region: props.region ?? null,
        endpoint: props.endpoint ?? null,
        lastProbed: props.lastProbed ?? null,
        lastUsed: props.lastUsed ?? null,
        probeFailures: props.probeFailures ?? null,
      },
    );
  });
}

export async function getSeed(id: string): Promise<Neo4jRecord | null> {
  const result = await runQuery(
    "MATCH (s:Seed { id: $id }) RETURN s",
    { id },
    "READ",
  );
  return result.records[0] ?? null;
}

export async function listActiveSeeds(): Promise<Neo4jRecord[]> {
  const result = await runQuery(
    "MATCH (s:Seed) WHERE s.status = 'active' RETURN s ORDER BY s.avgLatencyMs ASC",
    {},
    "READ",
  );
  return result.records;
}

export async function listActiveSeedsByCapability(requirements: {
  supportsAdaptiveThinking?: boolean;
  supportsExtendedThinking?: boolean;
  supportsInterleavedThinking?: boolean;
  supportsStructuredOutputs?: boolean;
  maxCostPer1kOutput?: number;
}): Promise<Neo4jRecord[]> {
  const conditions = ["s.status = 'active'"];
  const params: Record<string, unknown> = {};

  if (requirements.supportsAdaptiveThinking) {
    conditions.push("s.supportsAdaptiveThinking = true");
  }
  if (requirements.supportsExtendedThinking) {
    conditions.push("s.supportsExtendedThinking = true");
  }
  if (requirements.supportsInterleavedThinking) {
    conditions.push("s.supportsInterleavedThinking = true");
  }
  if (requirements.supportsStructuredOutputs) {
    conditions.push("s.supportsStructuredOutputs = true");
  }
  if (requirements.maxCostPer1kOutput !== undefined) {
    conditions.push("s.costPer1kOutput <= $maxCost");
    params.maxCost = requirements.maxCostPer1kOutput;
  }

  const result = await runQuery(
    `MATCH (s:Seed) WHERE ${conditions.join(" AND ")} RETURN s ORDER BY s.avgLatencyMs ASC`,
    params,
    "READ",
  );
  return result.records;
}

// ============ BLOOM QUERIES ============

export async function createBloom(props: BloomProps): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (b:Bloom { id: $id })
       ON CREATE SET
         b.name = $name,
         b.description = $description,
         b.state = $state,
         b.morphemeKinds = $morphemeKinds,
         b.domain = $domain,
         b.createdAt = datetime(),
         b.observationCount = 0,
         b.connectionCount = 0
       ON MATCH SET
         b.name = $name,
         b.description = $description,
         b.state = $state,
         b.morphemeKinds = $morphemeKinds,
         b.domain = $domain,
         b.updatedAt = datetime()`,
      {
        ...props,
        description: props.description ?? null,
        state: props.state ?? "created",
        morphemeKinds: props.morphemeKinds ?? [],
        domain: props.domain ?? null,
      },
    );
  });
}

export async function getBloom(id: string): Promise<Neo4jRecord | null> {
  const result = await runQuery(
    "MATCH (b:Bloom { id: $id }) RETURN b",
    { id },
    "READ",
  );
  return result.records[0] ?? null;
}

export async function updateBloomState(
  id: string,
  state: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (b:Bloom { id: $id })
       SET b.state = $state, b.updatedAt = datetime()`,
      { id, state },
    );
  });
}

/** Increment bloom connection count and recalculate state */
export async function connectBlooms(
  fromId: string,
  toId: string,
  relType: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const propsString = properties
    ? `, ${Object.entries(properties)
        .map(([k, v]) => `r.${k} = ${JSON.stringify(v)}`)
        .join(", ")}`
    : "";

  await writeTransaction(async (tx) => {
    // Create the relationship
    await tx.run(
      `MATCH (a:Bloom { id: $fromId }), (b:Bloom { id: $toId })
       MERGE (a)-[r:${relType}]->(b)
       ON CREATE SET r.createdAt = datetime()${propsString}
       WITH a, b
       SET a.connectionCount = coalesce(a.connectionCount, 0) + 1,
           b.connectionCount = coalesce(b.connectionCount, 0) + 1`,
      { fromId, toId },
    );
  });
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

/** Compute Thompson Sampling arm stats for a context cluster */
export async function getArmStatsForCluster(
  clusterId: string,
): Promise<ArmStats[]> {
  const result = await runQuery(
    `MATCH (d:Decision)-[:IN_CONTEXT]->(cc:ContextCluster { id: $clusterId })
     WHERE d.status = 'completed'
     MATCH (d)-[:ROUTED_TO]->(s:Seed)
     WITH s,
          count(d) AS totalTrials,
          sum(CASE WHEN d.success THEN 1 ELSE 0 END) AS successes,
          sum(CASE WHEN NOT d.success THEN 1 ELSE 0 END) AS failures,
          avg(COALESCE(d.adjustedQuality, d.qualityScore)) AS avgQuality,
         avg(d.durationMs) AS avgLatencyMs,
         avg(COALESCE(d.cost, 0)) AS avgCost,
         sum(COALESCE(d.cost, 0)) AS totalCost
     RETURN s.id AS seedId,
            successes + 1 AS alpha,
            failures + 1 AS beta,
            totalTrials,
            avgQuality,
           avgLatencyMs,
           avgCost,
           totalCost
     ORDER BY avgQuality DESC`,
    { clusterId },
    "READ",
  );
  return result.records.map((r) => ({
    seedId: r.get("seedId"),
    alpha: r.get("alpha"),
    beta: r.get("beta"),
    totalTrials: r.get("totalTrials"),
    avgQuality: r.get("avgQuality"),
    avgLatencyMs: r.get("avgLatencyMs"),
    avgCost: r.get("avgCost"),
    totalCost: r.get("totalCost"),
  }));
}

// ============ OBSERVATION QUERIES ============

export async function recordObservation(
  props: ObservationProps,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `CREATE (o:Observation {
         id: $id,
         metric: $metric,
         value: $value,
         unit: $unit,
         context: $context,
         timestamp: datetime(),
         retained: true
       })
       WITH o
       MATCH (b:Bloom { id: $sourceBloomId })
       MERGE (o)-[:OBSERVED_IN]->(b)
       SET b.observationCount = coalesce(b.observationCount, 0) + 1`,
      {
        ...props,
        unit: props.unit ?? null,
        context: props.context ?? null,
      },
    );
  });
}

/** Get observations for ΦL computation — recent, for a given bloom */
export async function getObservationsForBloom(
  bloomId: string,
  limit: number = 50,
): Promise<Neo4jRecord[]> {
  const result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN o
     ORDER BY o.timestamp DESC
     LIMIT $limit`,
    { bloomId, limit },
    "READ",
  );
  return result.records;
}

/** Count observations for maturity calculation */
export async function countObservationsForBloom(
  bloomId: string,
): Promise<number> {
  const result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN count(o) AS count`,
    { bloomId },
    "READ",
  );
  return result.records[0]?.get("count") ?? 0;
}

// ============ DISTILLATION QUERIES ============

export async function createDistillation(
  props: DistillationProps,
): Promise<void> {
  await writeTransaction(async (tx) => {
    // Create distillation node
    await tx.run(
      `CREATE (di:Distillation {
         id: $id,
         pattern: $pattern,
         confidence: $confidence,
         observationCount: $observationCount,
         insight: $insight,
         createdAt: datetime()
       })`,
      props,
    );

    // Link to source observations
    for (const obsId of props.sourceObservationIds) {
      await tx.run(
        `MATCH (di:Distillation { id: $distId }), (o:Observation { id: $obsId })
         MERGE (di)-[:DISTILLED_FROM]->(o)`,
        { distId: props.id, obsId },
      );
    }
  });
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

// ============ TOPOLOGY QUERIES ============

/**
 * Get the degree of a bloom node (number of relationships).
 * Used for topology-aware dampening: γ_effective = min(0.7, 0.8/(k-1))
 */
export async function getBloomDegree(bloomId: string): Promise<number> {
  const result = await runQuery(
    `MATCH (b:Bloom { id: $bloomId })
     OPTIONAL MATCH (b)-[r]-()
     RETURN count(r) AS degree`,
    { bloomId },
    "READ",
  );
  return result.records[0]?.get("degree") ?? 0;
}

/**
 * Get the adjacency list for blooms.
 * Used for ΨH (spectral analysis) computations.
 */
export async function getBloomAdjacency(): Promise<
  Array<{ from: string; to: string; weight: number }>
> {
  const result = await runQuery(
    `MATCH (a:Bloom)-[r]->(b:Bloom)
     RETURN a.id AS fromId, b.id AS toId, coalesce(r.weight, 1.0) AS weight`,
    {},
    "READ",
  );
  return result.records.map((rec) => ({
    from: rec.get("fromId"),
    to: rec.get("toId"),
    weight: rec.get("weight"),
  }));
}

/**
 * Get all blooms with their phi-L values.
 * Used for Graph Total Variation computation in ΨH.
 */
export async function getBloomsWithHealth(): Promise<
  Array<{ id: string; phiL: number; state: string; degree: number }>
> {
  const result = await runQuery(
    `MATCH (b:Bloom)
     OPTIONAL MATCH (b)-[r]-()
     WITH b, count(r) AS degree
     RETURN b.id AS id,
            coalesce(b.phiL, 0.5) AS phiL,
            coalesce(b.state, 'created') AS state,
            degree
     ORDER BY b.id`,
    {},
    "READ",
  );
  return result.records.map((rec) => ({
    id: rec.get("id"),
    phiL: rec.get("phiL"),
    state: rec.get("state"),
    degree: rec.get("degree"),
  }));
}

/**
 * Store computed ΦL on a bloom node.
 */
export async function updateBloomPhiL(
  bloomId: string,
  phiL: number,
  trend: "improving" | "stable" | "declining",
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (b:Bloom { id: $bloomId })
       SET b.phiL = $phiL,
           b.phiLTrend = $trend,
           b.phiLComputedAt = datetime()`,
      { bloomId, phiL, trend },
    );
  });
}

// ============ CONTAINMENT HIERARCHY QUERIES ============

/**
 * Get immediate children of a container node.
 * Returns child IDs with their stored ΦL, connection count, observation count, and degree.
 */
export async function getContainedChildren(
  containerId: string,
): Promise<
  Array<{
    id: string;
    phiL: number;
    observationCount: number;
    connectionCount: number;
    degree: number;
  }>
> {
  const result = await runQuery(
    `MATCH (parent { id: $containerId })-[:CONTAINS]->(child)
     OPTIONAL MATCH (child)-[r]-()
     WITH child, count(r) AS degree
     RETURN child.id AS id,
            coalesce(child.phiL, 0.5) AS phiL,
            coalesce(child.observationCount, 0) AS observationCount,
            coalesce(child.connectionCount, 0) AS connectionCount,
            degree
     ORDER BY child.id`,
    { containerId },
    "READ",
  );
  return result.records.map((rec) => ({
    id: rec.get("id"),
    phiL: rec.get("phiL"),
    observationCount: rec.get("observationCount"),
    connectionCount: rec.get("connectionCount"),
    degree: rec.get("degree"),
  }));
}

/**
 * Get the full containment tree rooted at a node.
 * Returns { nodeId → parentId } map and leaf nodes.
 * Uses variable-length CONTAINS path traversal.
 * Leaf nodes have no outgoing CONTAINS relationships.
 */
export async function getContainmentTree(
  rootId: string,
): Promise<{
  parentMap: Map<string, string | null>;
  leafNodes: string[];
  allNodes: string[];
}> {
  // Get all nodes in the containment tree with their parent
  const result = await runQuery(
    `MATCH path = (root { id: $rootId })-[:CONTAINS*0..]->(node)
     WITH node,
          CASE WHEN length(path) = 0 THEN null
               ELSE nodes(path)[-2].id
          END AS parentId
     OPTIONAL MATCH (node)-[:CONTAINS]->()
     WITH node.id AS nodeId, parentId, count(*) AS childCount,
          CASE WHEN (node)-[:CONTAINS]->() THEN false ELSE true END AS isLeaf
     RETURN nodeId, parentId, isLeaf
     ORDER BY nodeId`,
    { rootId },
    "READ",
  );

  const parentMap = new Map<string, string | null>();
  const leafNodes: string[] = [];
  const allNodes: string[] = [];

  for (const rec of result.records) {
    const nodeId = rec.get("nodeId") as string;
    const parentId = rec.get("parentId") as string | null;
    const isLeaf = rec.get("isLeaf") as boolean;

    parentMap.set(nodeId, parentId);
    allNodes.push(nodeId);
    if (isLeaf) {
      leafNodes.push(nodeId);
    }
  }

  return { parentMap, leafNodes, allNodes };
}

/**
 * Get edges WITHIN a container's subgraph (for ΨH computation at that level).
 * Returns only edges where both endpoints are children of the container.
 */
export async function getSubgraphEdges(
  containerId: string,
): Promise<Array<{ from: string; to: string; weight: number }>> {
  const result = await runQuery(
    `MATCH (parent { id: $containerId })-[:CONTAINS]->(a),
           (parent)-[:CONTAINS]->(b),
           (a)-[r]->(b)
     WHERE type(r) <> 'CONTAINS'
     RETURN a.id AS fromId, b.id AS toId, coalesce(r.weight, 1.0) AS weight`,
    { containerId },
    "READ",
  );
  return result.records.map((rec) => ({
    from: rec.get("fromId"),
    to: rec.get("toId"),
    weight: rec.get("weight"),
  }));
}

/**
 * Get all container nodes (nodes with outgoing CONTAINS relationships).
 * Returns containers ordered by depth (deepest first — for bottom-up walk).
 */
export async function getContainersBottomUp(): Promise<
  Array<{
    id: string;
    depth: number;
  }>
> {
  // Find all containers and compute their depth from the root.
  // Depth = longest path from any root to this container via CONTAINS.
  // Deepest first enables bottom-up aggregation.
  const result = await runQuery(
    `MATCH (container)-[:CONTAINS]->()
     WITH DISTINCT container
     OPTIONAL MATCH path = ()-[:CONTAINS*]->(container)
     WITH container.id AS id,
          CASE WHEN path IS NULL THEN 0 ELSE length(path) END AS pathLen
     WITH id, max(pathLen) AS depth
     RETURN id, depth
     ORDER BY depth DESC, id`,
    {},
    "READ",
  );
  return result.records.map((rec) => ({
    id: rec.get("id"),
    depth: rec.get("depth"),
  }));
}

// ============ HUMAN FEEDBACK QUERIES ============

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

// ============ PIPELINE TOPOLOGY QUERIES ============

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
         pr.startedAt = $startedAt,
         pr.completedAt = $completedAt,
         pr.durationMs = $durationMs,
         pr.modelDiversity = $modelDiversity,
         pr.overallQuality = $overallQuality,
         pr.status = $status,
         pr.createdAt = datetime()
       ON MATCH SET
         pr.completedAt = COALESCE($completedAt, pr.completedAt),
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
           pr.completedAt = $completedAt,
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

/** Ensure the 7 Architect stage Resonators exist and are contained in the Architect Bloom */
export async function ensureArchitectResonators(
  architectBloomId: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    for (const stage of ARCHITECT_STAGES) {
      await tx.run(
        `MERGE (r:Resonator { id: $resonatorId })
         ON CREATE SET
           r.name = $stage,
           r.stage = $stage,
           r.createdAt = datetime()
         WITH r
         MATCH (b:Bloom { id: $bloomId })
         MERGE (b)-[:CONTAINS]->(r)`,
        {
          resonatorId: `${architectBloomId}_${stage}`,
          stage,
          bloomId: architectBloomId,
        },
      );
    }
  });
}

/** Link a TaskOutput to the Resonator for its assigned stage */
export async function linkTaskOutputToStage(
  taskOutputId: string,
  resonatorId: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (to:TaskOutput { id: $taskOutputId }),
             (r:Resonator { id: $resonatorId })
       MERGE (r)-[:PROCESSED]->(to)`,
      { taskOutputId, resonatorId },
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

// ============ BACKWARD COMPATIBILITY (remove in M-8) ============

/** @deprecated Use SeedProps */
export type AgentProps = SeedProps;
/** @deprecated Use BloomProps */
export type PatternProps = BloomProps;
/** @deprecated Use createSeed */
export const createAgent = createSeed;
/** @deprecated Use getSeed */
export const getAgent = getSeed;
/** @deprecated Use listActiveSeeds */
export const listActiveAgents = listActiveSeeds;
/** @deprecated Use listActiveSeedsByCapability */
export const listActiveAgentsByCapability = listActiveSeedsByCapability;
/** @deprecated Use createBloom */
export const createPattern = createBloom;
/** @deprecated Use getBloom */
export const getPattern = getBloom;
/** @deprecated Use updateBloomState */
export const updatePatternState = updateBloomState;
/** @deprecated Use connectBlooms */
export const connectPatterns = connectBlooms;
/** @deprecated Use getBloomDegree */
export const getPatternDegree = getBloomDegree;
/** @deprecated Use getBloomAdjacency */
export const getPatternAdjacency = getBloomAdjacency;
/** @deprecated Use getBloomsWithHealth */
export const getPatternsWithHealth = getBloomsWithHealth;
/** @deprecated Use updateBloomPhiL */
export const updatePatternPhiL = updateBloomPhiL;
/** @deprecated Use getObservationsForBloom */
export const getObservationsForPattern = getObservationsForBloom;
/** @deprecated Use countObservationsForBloom */
export const countObservationsForPattern = countObservationsForBloom;

// ============ MEMORY PERSISTENCE QUERIES (M-9.4) ============

/**
 * Fetch observations for a bloom in the shape that identifyCompactable() needs.
 * Returns CompactableObservation-shaped data: id, timestamp, signalProcessed,
 * and list of distillation IDs that include this observation via DISTILLED_FROM.
 */
export async function getCompactableObservations(
  bloomId: string,
  limit: number = 500,
): Promise<
  Array<{
    id: string;
    timestamp: Date;
    signalProcessed: boolean;
    includedInDistillationIds: string[];
  }>
> {
  const result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     OPTIONAL MATCH (di:Distillation)-[:DISTILLED_FROM]->(o)
     WITH o, collect(di.id) AS distillationIds
     RETURN o.id AS id,
            o.timestamp AS timestamp,
            coalesce(o.signalProcessed, false) AS signalProcessed,
            distillationIds
     ORDER BY o.timestamp ASC
     LIMIT $limit`,
    { bloomId, limit },
    "READ",
  );
  return result.records.map((r) => ({
    id: r.get("id"),
    timestamp: new Date(r.get("timestamp")),
    signalProcessed: r.get("signalProcessed"),
    includedInDistillationIds: r.get("distillationIds").filter((id: unknown) => id != null),
  }));
}

/**
 * Bulk-delete observations by ID list. Used after identifyCompactable()
 * returns the safe-to-remove IDs. DETACH DELETE removes both the node
 * and its relationships.
 */
export async function deleteObservations(
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const result = await writeTransaction(async (tx) => {
    return tx.run(
      `MATCH (o:Observation)
       WHERE o.id IN $ids
       DETACH DELETE o
       RETURN count(*) AS deleted`,
      { ids },
    );
  });
  return result.records[0]?.get("deleted") ?? 0;
}

/**
 * Get IDs of active (non-superseded) distillations.
 * A distillation is active if it has no supersededAt property.
 * Used by identifyCompactable() when preserveActiveDistillationSources is true.
 */
export async function getActiveDistillationIds(
  bloomId?: string,
): Promise<Set<string>> {
  const cypher = bloomId
    ? `MATCH (di:Distillation)
       WHERE di.supersededAt IS NULL AND di.bloomId = $bloomId
       RETURN di.id AS id`
    : `MATCH (di:Distillation)
       WHERE di.supersededAt IS NULL
       RETURN di.id AS id`;
  const result = await runQuery(cypher, { bloomId: bloomId ?? null }, "READ");
  return new Set(result.records.map((r) => r.get("id")));
}

/**
 * Fetch observations for a bloom with fields needed by distillPerformanceProfile()
 * and distillRoutingHints(). Returns the full observation data — callers map to
 * the specific PerformanceObservation or RoutingObservation shape.
 */
export async function getObservationsForDistillation(
  bloomId: string,
  limit: number = 500,
): Promise<
  Array<{
    id: string;
    timestamp: Date;
    success: boolean;
    qualityScore: number | null;
    durationMs: number | null;
    modelUsed: string | null;
    failureSignature: string | null;
    context: string | null;
  }>
> {
  const result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN o.id AS id,
            o.timestamp AS timestamp,
            coalesce(o.success, true) AS success,
            o.qualityScore AS qualityScore,
            o.durationMs AS durationMs,
            o.modelUsed AS modelUsed,
            o.failureSignature AS failureSignature,
            o.context AS context
     ORDER BY o.timestamp ASC
     LIMIT $limit`,
    { bloomId, limit },
    "READ",
  );
  return result.records.map((r) => ({
    id: r.get("id"),
    timestamp: new Date(r.get("timestamp")),
    success: r.get("success"),
    qualityScore: r.get("qualityScore"),
    durationMs: r.get("durationMs"),
    modelUsed: r.get("modelUsed"),
    failureSignature: r.get("failureSignature"),
    context: r.get("context"),
  }));
}

/** Properties for a structured distillation with performance profile and routing hints */
export interface StructuredDistillationProps {
  id: string;
  bloomId: string;
  confidence: number;
  observationCount: number;
  sourceObservationIds: string[];
  insight: string;
  // Performance profile fields
  meanPhiL: number;
  phiLTrend: string;
  phiLVariance: number;
  successRate: number;
  windowStart: string; // ISO timestamp
  windowEnd: string; // ISO timestamp
  // Routing hints (serialized JSON)
  preferredModels: string; // JSON string
  avoidModels: string; // JSON string
}

/**
 * Create a structured distillation node with performance profile and routing hints.
 * Creates DISTILLED_FROM relationships to source observations.
 * Links to the bloom via bloomId property.
 */
export async function createStructuredDistillation(
  props: StructuredDistillationProps,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `CREATE (di:Distillation {
         id: $id,
         bloomId: $bloomId,
         confidence: $confidence,
         observationCount: $observationCount,
         insight: $insight,
         meanPhiL: $meanPhiL,
         phiLTrend: $phiLTrend,
         phiLVariance: $phiLVariance,
         successRate: $successRate,
         windowStart: $windowStart,
         windowEnd: $windowEnd,
         preferredModels: $preferredModels,
         avoidModels: $avoidModels,
         createdAt: datetime()
       })`,
      props,
    );

    // Create DISTILLED_FROM relationships to source observations
    if (props.sourceObservationIds.length > 0) {
      await tx.run(
        `MATCH (di:Distillation { id: $distId })
         UNWIND $obsIds AS obsId
         MATCH (o:Observation { id: obsId })
         MERGE (di)-[:DISTILLED_FROM]->(o)`,
        { distId: props.id, obsIds: props.sourceObservationIds },
      );
    }
  });
}

/**
 * Get distillations for a bloom, ordered by creation date (newest first).
 * Optionally filter for active-only (not superseded).
 */
export async function getDistillationsForBloom(
  bloomId: string,
  activeOnly: boolean = false,
): Promise<
  Array<{
    id: string;
    confidence: number;
    createdAt: Date;
    supersededAt: Date | null;
    observationCount: number;
    insight: string;
  }>
> {
  const whereClause = activeOnly
    ? "WHERE di.bloomId = $bloomId AND di.supersededAt IS NULL"
    : "WHERE di.bloomId = $bloomId";
  const result = await runQuery(
    `MATCH (di:Distillation)
     ${whereClause}
     RETURN di.id AS id,
            di.confidence AS confidence,
            di.createdAt AS createdAt,
            di.supersededAt AS supersededAt,
            di.observationCount AS observationCount,
            di.insight AS insight
     ORDER BY di.createdAt DESC`,
    { bloomId },
    "READ",
  );
  return result.records.map((r) => ({
    id: r.get("id"),
    confidence: r.get("confidence"),
    createdAt: new Date(r.get("createdAt")),
    supersededAt: r.get("supersededAt") ? new Date(r.get("supersededAt")) : null,
    observationCount: r.get("observationCount"),
    insight: r.get("insight"),
  }));
}

/**
 * Mark a distillation as superseded (replaced by a newer one).
 * Sets supersededAt timestamp.
 */
export async function supersededDistillation(
  distillationId: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (di:Distillation { id: $id })
       SET di.supersededAt = datetime()`,
      { id: distillationId },
    );
  });
}

// ============ ECOSYSTEM QUERIES (M-9.8) ============

/** Milestone overview entry from the ecosystem graph */
export interface MilestoneOverviewEntry {
  id: string;
  name: string;
  type: "milestone" | "sub-milestone";
  status: string;
  phiL: number;
  sequence: number;
  parentId?: string;
  childCount: number;
  testCount: number;
}

/**
 * Get an overview of all milestones in the ecosystem graph.
 * Returns milestone Blooms with child counts and test counts.
 */
export async function getMilestoneOverview(): Promise<MilestoneOverviewEntry[]> {
  const result = await runQuery(
    `MATCH (b:Bloom)
     WHERE b.type IN ['milestone', 'sub-milestone']
     OPTIONAL MATCH (b)-[:CONTAINS]->(child:Bloom)
     OPTIONAL MATCH (test:Seed)-[:SCOPED_TO]->(b)
     RETURN b.id AS id, b.name AS name, b.type AS type,
            b.status AS status, b.phiL AS phiL, b.sequence AS sequence,
            b.parentId AS parentId,
            count(DISTINCT child) AS childCount,
            count(DISTINCT test) AS testCount
     ORDER BY b.sequence`,
    {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    id: r.get("id") as string,
    name: r.get("name") as string,
    type: r.get("type") as "milestone" | "sub-milestone",
    status: r.get("status") as string,
    phiL: (r.get("phiL") as number) ?? 0,
    sequence: (r.get("sequence") as number) ?? 0,
    parentId: r.get("parentId") as string | undefined,
    childCount: typeof r.get("childCount") === "number" ? (r.get("childCount") as number) : 0,
    testCount: typeof r.get("testCount") === "number" ? (r.get("testCount") as number) : 0,
  }));
}

/** Future test entry from the ecosystem graph */
export interface FutureTestEntry {
  id: string;
  name: string;
  status: string;
  suiteId: string;
}

/**
 * Get all future-scoped test Seeds targeting a specific milestone.
 * Returns test Seed nodes connected via SCOPED_TO.
 */
export async function getFutureTestsForMilestone(
  milestoneId: string,
): Promise<FutureTestEntry[]> {
  const result = await runQuery(
    `MATCH (s:Seed)-[:SCOPED_TO]->(b:Bloom { id: $milestoneId })
     WHERE s.seedType = 'test'
     OPTIONAL MATCH (suite:Bloom)-[:CONTAINS]->(s)
     RETURN s.id AS id, s.name AS name, s.status AS status,
            suite.id AS suiteId
     ORDER BY s.id`,
    { milestoneId },
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    id: r.get("id") as string,
    name: r.get("name") as string,
    status: r.get("status") as string,
    suiteId: (r.get("suiteId") as string) ?? "",
  }));
}

/** Hypothesis status entry from the ecosystem graph */
export interface HypothesisStatusEntry {
  id: string;
  claim: string;
  status: string;
  evidenceStrength: number;
  observesMilestone: string;
}

/**
 * Get all hypothesis Helix nodes with their observed milestone.
 * Returns hypothesis data with OBSERVES relationship targets.
 */
export async function getHypothesisStatus(): Promise<HypothesisStatusEntry[]> {
  const result = await runQuery(
    `MATCH (h:Helix { type: 'hypothesis' })-[:OBSERVES]->(b:Bloom)
     RETURN h.id AS id, h.claim AS claim, h.status AS status,
            h.evidenceStrength AS evidenceStrength,
            b.id AS observesMilestone
     ORDER BY h.id`,
    {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    id: r.get("id") as string,
    claim: r.get("claim") as string,
    status: r.get("status") as string,
    evidenceStrength: (r.get("evidenceStrength") as number) ?? 0,
    observesMilestone: r.get("observesMilestone") as string,
  }));
}

// ============ GRAMMAR REFERENCE QUERIES (M-9.7a) ============

/** Grammar element entry from the graph */
export interface GrammarElementEntry {
  id: string;
  seedType: string;
  name: string;
  description: string;
  specSource: string;
  implementationStatus: string;
  implementationNotes: string;
  codeLocation: string | null;
}

/**
 * Get grammar elements, optionally filtered by category (seedType).
 * Answers: "What morphemes/axioms/rules exist and what's their implementation status?"
 */
export async function getGrammarElements(
  category?: string,
): Promise<GrammarElementEntry[]> {
  const whereClause = category
    ? "WHERE s.seedType = $category"
    : "";
  const result = await runQuery(
    `MATCH (:Bloom {type: 'grammar-reference'})-[:CONTAINS]->(:Bloom {type: 'grammar-category'})-[:CONTAINS]->(s:Seed)
     ${whereClause}
     RETURN s.id AS id, s.seedType AS seedType, s.name AS name,
            s.description AS description, s.specSource AS specSource,
            s.implementationStatus AS implementationStatus,
            s.implementationNotes AS implementationNotes,
            s.codeLocation AS codeLocation
     ORDER BY s.seedType, s.id`,
    category ? { category } : {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    id: r.get("id") as string,
    seedType: r.get("seedType") as string,
    name: r.get("name") as string,
    description: r.get("description") as string,
    specSource: r.get("specSource") as string,
    implementationStatus: r.get("implementationStatus") as string,
    implementationNotes: r.get("implementationNotes") as string,
    codeLocation: (r.get("codeLocation") as string) ?? null,
  }));
}

/** Grammar implementation coverage summary */
export interface GrammarCoverageEntry {
  total: number;
  complete: number;
  partial: number;
  typesOnly: number;
  notStarted: number;
  aspirational: number;
}

/**
 * Get implementation coverage summary for all grammar elements.
 * Answers: "How much of the grammar is implemented?"
 */
export async function getGrammarCoverage(): Promise<GrammarCoverageEntry> {
  const result = await runQuery(
    `MATCH (:Bloom {type: 'grammar-reference'})-[:CONTAINS]->(:Bloom {type: 'grammar-category'})-[:CONTAINS]->(s:Seed)
     RETURN s.implementationStatus AS status, count(s) AS cnt`,
    {},
    "READ",
  );
  const counts: Record<string, number> = {};
  let total = 0;
  for (const r of result.records) {
    const status = r.get("status") as string;
    const cnt = r.get("cnt") as number;
    counts[status] = cnt;
    total += cnt;
  }
  return {
    total,
    complete: counts["complete"] ?? 0,
    partial: counts["partial"] ?? 0,
    typesOnly: counts["types-only"] ?? 0,
    notStarted: counts["not-started"] ?? 0,
    aspirational: counts["aspirational"] ?? 0,
  };
}

/** Axiom dependency chain entry */
export interface AxiomDependencyEntry {
  axiomId: string;
  axiomName: string;
  dependsOn: string[];
  dependedOnBy: string[];
}

/**
 * Get axiom dependency chains (DAG).
 * Answers: "What axioms depend on A2 Visible State?"
 */
export async function getAxiomDependencies(
  axiomId?: string,
): Promise<AxiomDependencyEntry[]> {
  const whereClause = axiomId ? "WHERE a.id = $axiomId" : "";
  const result = await runQuery(
    `MATCH (a:Seed {seedType: 'axiom'})
     ${whereClause}
     OPTIONAL MATCH (a)-[:DEPENDS_ON]->(dep:Seed {seedType: 'axiom'})
     OPTIONAL MATCH (rev:Seed {seedType: 'axiom'})-[:DEPENDS_ON]->(a)
     RETURN a.id AS axiomId, a.name AS axiomName,
            collect(DISTINCT dep.id) AS dependsOn,
            collect(DISTINCT rev.id) AS dependedOnBy
     ORDER BY a.id`,
    axiomId ? { axiomId } : {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    axiomId: r.get("axiomId") as string,
    axiomName: r.get("axiomName") as string,
    dependsOn: (r.get("dependsOn") as string[]).filter(Boolean),
    dependedOnBy: (r.get("dependedOnBy") as string[]).filter(Boolean),
  }));
}

/** Anti-pattern violation entry */
export interface AntiPatternViolationEntry {
  antiPatternId: string;
  antiPatternName: string;
  violatesAxiom: string;
  violatesAxiomName: string;
  implementationStatus: string;
}

/**
 * Get anti-pattern to axiom VIOLATES mappings.
 * Answers: "Which anti-patterns violate A2?"
 */
export async function getAntiPatternViolations(
  axiomId?: string,
): Promise<AntiPatternViolationEntry[]> {
  const whereClause = axiomId ? "WHERE ax.id = $axiomId" : "";
  const result = await runQuery(
    `MATCH (ap:Seed {seedType: 'anti-pattern'})-[:VIOLATES]->(ax:Seed {seedType: 'axiom'})
     ${whereClause}
     RETURN ap.id AS antiPatternId, ap.name AS antiPatternName,
            ax.id AS violatesAxiom, ax.name AS violatesAxiomName,
            ap.implementationStatus AS implementationStatus
     ORDER BY ax.id, ap.id`,
    axiomId ? { axiomId } : {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    antiPatternId: r.get("antiPatternId") as string,
    antiPatternName: r.get("antiPatternName") as string,
    violatesAxiom: r.get("violatesAxiom") as string,
    violatesAxiomName: r.get("violatesAxiomName") as string,
    implementationStatus: r.get("implementationStatus") as string,
  }));
}

// ============ MORPHEME TOPOLOGY QUERIES (M-9.7b) ============

/** Pattern topology entry — a pattern with its stages and data flows */
export interface PatternTopologyEntry {
  patternId: string;
  patternName: string;
  patternType: string;
  stages: Array<{ id: string; role: string; name: string }>;
  flows: Array<{ from: string; to: string }>;
}

/**
 * Get all patterns with their stages (Resonators) and data flows.
 * Returns the runtime topology of each pattern.
 *
 * @param patternId - Optional filter for a specific pattern
 */
export async function getPatternTopology(
  patternId?: string,
): Promise<PatternTopologyEntry[]> {
  const whereClause = patternId ? "WHERE p.id = $patternId" : "";
  const stageResult = await runQuery(
    `MATCH (p:Bloom)-[:CONTAINS]->(r:Resonator)
     ${whereClause}
     RETURN p.id AS patternId, p.name AS patternName, p.type AS patternType,
            r.id AS stageId, r.role AS role, r.name AS stageName
     ORDER BY p.id, r.id`,
    patternId ? { patternId } : {},
    "READ",
  );

  const flowResult = await runQuery(
    `MATCH (r1:Resonator)-[:FLOWS_TO]->(r2:Resonator)
     ${patternId ? "WHERE r1.patternId = $patternId" : ""}
     RETURN r1.id AS fromId, r2.id AS toId, r1.patternId AS patternId`,
    patternId ? { patternId } : {},
    "READ",
  );

  // Group by pattern
  const patterns = new Map<string, PatternTopologyEntry>();

  for (const r of stageResult.records) {
    const pid = r.get("patternId") as string;
    if (!patterns.has(pid)) {
      patterns.set(pid, {
        patternId: pid,
        patternName: r.get("patternName") as string,
        patternType: r.get("patternType") as string,
        stages: [],
        flows: [],
      });
    }
    patterns.get(pid)!.stages.push({
      id: r.get("stageId") as string,
      role: r.get("role") as string,
      name: r.get("stageName") as string,
    });
  }

  for (const r of flowResult.records) {
    const pid = r.get("patternId") as string;
    if (patterns.has(pid)) {
      patterns.get(pid)!.flows.push({
        from: r.get("fromId") as string,
        to: r.get("toId") as string,
      });
    }
  }

  return Array.from(patterns.values());
}

/** Visualisation node entry */
export interface VisNodeEntry {
  id: string;
  label: string;
  type: string;
  name: string;
  properties: Record<string, unknown>;
}

/** Visualisation relationship entry */
export interface VisRelationshipEntry {
  from: string;
  to: string;
  type: string;
}

/** Full visualisation topology */
export interface VisualisationTopology {
  nodes: VisNodeEntry[];
  relationships: VisRelationshipEntry[];
}

/**
 * Get the full graph topology for visualisation.
 * Returns all morpheme nodes (Bloom, Seed, Resonator, Helix, Grid)
 * and their relationships.
 */
export async function getVisualisationTopology(): Promise<VisualisationTopology> {
  // Get all morpheme nodes
  const nodeResult = await runQuery(
    `MATCH (n)
     WHERE n:Bloom OR n:Seed OR n:Resonator OR n:Helix OR n:Grid
     RETURN n.id AS id,
            labels(n)[0] AS label,
            COALESCE(n.type, n.seedType, '') AS type,
            COALESCE(n.name, n.id) AS name,
            properties(n) AS props
     ORDER BY labels(n)[0], n.id`,
    {},
    "READ",
  );

  // Get all relationships between morpheme nodes
  const relResult = await runQuery(
    `MATCH (a)-[r]->(b)
     WHERE (a:Bloom OR a:Seed OR a:Resonator OR a:Helix OR a:Grid)
       AND (b:Bloom OR b:Seed OR b:Resonator OR b:Helix OR b:Grid)
     RETURN a.id AS fromId, b.id AS toId, type(r) AS relType
     ORDER BY type(r), a.id`,
    {},
    "READ",
  );

  const nodes: VisNodeEntry[] = nodeResult.records.map((r: Neo4jRecord) => ({
    id: r.get("id") as string,
    label: r.get("label") as string,
    type: r.get("type") as string,
    name: r.get("name") as string,
    properties: r.get("props") as Record<string, unknown>,
  }));

  const relationships: VisRelationshipEntry[] = relResult.records.map(
    (r: Neo4jRecord) => ({
      from: r.get("fromId") as string,
      to: r.get("toId") as string,
      type: r.get("relType") as string,
    }),
  );

  return { nodes, relationships };
}

/** Grammar instance mapping entry */
export interface GrammarInstanceEntry {
  instanceId: string;
  instanceLabel: string;
  grammarElementId: string;
  grammarElementName: string;
}

/**
 * Get INSTANTIATES mappings — which runtime elements are instances
 * of which grammar definitions.
 */
export async function getGrammarInstances(): Promise<GrammarInstanceEntry[]> {
  const result = await runQuery(
    `MATCH (instance)-[:INSTANTIATES]->(def:Seed {seedType: 'morpheme'})
     RETURN instance.id AS instanceId,
            labels(instance)[0] AS instanceLabel,
            def.id AS grammarElementId,
            def.name AS grammarElementName
     ORDER BY def.name, instance.id`,
    {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    instanceId: r.get("instanceId") as string,
    instanceLabel: r.get("instanceLabel") as string,
    grammarElementId: r.get("grammarElementId") as string,
    grammarElementName: r.get("grammarElementName") as string,
  }));
}
