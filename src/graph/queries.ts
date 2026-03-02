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
           d.completedAt = datetime()`,
      {
        ...props,
        cost: props.cost ?? null,
        inputTokens: props.inputTokens ?? null,
        outputTokens: props.outputTokens ?? null,
        thinkingTokens: props.thinkingTokens ?? null,
        errorType: props.errorType ?? null,
        notes: props.notes ?? null,
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
     WHERE d.status = 'completed'
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
