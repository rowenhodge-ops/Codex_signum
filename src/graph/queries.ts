/**
 * Codex Signum — Neo4j Graph Queries
 *
 * Reusable query builders for creating, reading, and relating
 * Codex entities in Neo4j. All state mutations flow through here.
 *
 * @module codex-signum-core/graph/queries
 */

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery, writeTransaction } from "./client.js";

// ============ TYPES ============

/** Properties for creating an Agent node */
export interface AgentProps {
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

/** Properties for creating/updating a Pattern node */
export interface PatternProps {
  id: string;
  name: string;
  description?: string;
  state?: string; // IntegrationState
  morphemeKinds?: string[]; // which morpheme types compose this pattern
  domain?: string;
}

/** Properties for recording a Decision */
export interface DecisionProps {
  id: string;
  taskType: string;
  complexity: "trivial" | "moderate" | "complex" | "critical";
  domain?: string;
  selectedAgentId: string;
  madeByPatternId?: string;
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
  sourcePatternId: string;
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
  agentId: string;
  alpha: number; // successes + 1
  beta: number; // failures + 1
  totalTrials: number;
  avgQuality: number;
  avgLatencyMs: number;
  avgCost: number;
  totalCost: number;
}

// ============ AGENT QUERIES ============

export async function createAgent(props: AgentProps): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (a:Agent { id: $id })
       ON CREATE SET
         a.name = $name,
         a.provider = $provider,
         a.model = $model,
         a.baseModelId = $baseModelId,
         a.thinkingMode = $thinkingMode,
         a.thinkingParameter = $thinkingParameter,
         a.capabilities = $capabilities,
         a.supportsAdaptiveThinking = $supportsAdaptiveThinking,
         a.supportsExtendedThinking = $supportsExtendedThinking,
         a.supportsInterleavedThinking = $supportsInterleavedThinking,
         a.supportsPrefilling = $supportsPrefilling,
         a.supportsStructuredOutputs = $supportsStructuredOutputs,
         a.supportsWebSearch = $supportsWebSearch,
         a.supportsComputerUse = $supportsComputerUse,
         a.maxContextWindow = $maxContextWindow,
         a.maxOutputTokens = $maxOutputTokens,
         a.costPer1kInput = $costPer1kInput,
         a.costPer1kOutput = $costPer1kOutput,
         a.avgLatencyMs = $avgLatencyMs,
         a.costPer1kTokens = $costPer1kTokens,
         a.status = $status,
         a.region = $region,
         a.endpoint = $endpoint,
         a.lastProbed = $lastProbed,
         a.lastUsed = $lastUsed,
         a.probeFailures = 0,
         a.createdAt = datetime()
       ON MATCH SET
         a.name = $name,
         a.provider = $provider,
         a.model = $model,
         a.baseModelId = $baseModelId,
         a.thinkingMode = $thinkingMode,
         a.thinkingParameter = COALESCE($thinkingParameter, a.thinkingParameter),
         a.capabilities = COALESCE($capabilities, a.capabilities),
         a.supportsAdaptiveThinking = COALESCE($supportsAdaptiveThinking, a.supportsAdaptiveThinking),
         a.supportsExtendedThinking = COALESCE($supportsExtendedThinking, a.supportsExtendedThinking),
         a.supportsInterleavedThinking = COALESCE($supportsInterleavedThinking, a.supportsInterleavedThinking),
         a.supportsPrefilling = COALESCE($supportsPrefilling, a.supportsPrefilling),
         a.supportsStructuredOutputs = COALESCE($supportsStructuredOutputs, a.supportsStructuredOutputs),
         a.supportsWebSearch = COALESCE($supportsWebSearch, a.supportsWebSearch),
         a.supportsComputerUse = COALESCE($supportsComputerUse, a.supportsComputerUse),
         a.maxContextWindow = COALESCE($maxContextWindow, a.maxContextWindow),
         a.maxOutputTokens = COALESCE($maxOutputTokens, a.maxOutputTokens),
         a.costPer1kInput = COALESCE($costPer1kInput, a.costPer1kInput),
         a.costPer1kOutput = COALESCE($costPer1kOutput, a.costPer1kOutput),
         a.avgLatencyMs = COALESCE($avgLatencyMs, a.avgLatencyMs),
         a.costPer1kTokens = COALESCE($costPer1kTokens, a.costPer1kTokens),
         a.status = COALESCE($status, a.status),
         a.region = COALESCE($region, a.region),
         a.endpoint = COALESCE($endpoint, a.endpoint),
         a.lastProbed = COALESCE($lastProbed, a.lastProbed),
         a.lastUsed = COALESCE($lastUsed, a.lastUsed),
         a.probeFailures = COALESCE($probeFailures, a.probeFailures),
         a.updatedAt = datetime()`,
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

export async function getAgent(id: string): Promise<Neo4jRecord | null> {
  const result = await runQuery(
    "MATCH (a:Agent { id: $id }) RETURN a",
    { id },
    "READ",
  );
  return result.records[0] ?? null;
}

export async function listActiveAgents(): Promise<Neo4jRecord[]> {
  const result = await runQuery(
    "MATCH (a:Agent) WHERE a.status = 'active' RETURN a ORDER BY a.avgLatencyMs ASC",
    {},
    "READ",
  );
  return result.records;
}

export async function listActiveAgentsByCapability(requirements: {
  supportsAdaptiveThinking?: boolean;
  supportsExtendedThinking?: boolean;
  supportsInterleavedThinking?: boolean;
  supportsStructuredOutputs?: boolean;
  maxCostPer1kOutput?: number;
}): Promise<Neo4jRecord[]> {
  const conditions = ["a.status = 'active'"];
  const params: Record<string, unknown> = {};

  if (requirements.supportsAdaptiveThinking) {
    conditions.push("a.supportsAdaptiveThinking = true");
  }
  if (requirements.supportsExtendedThinking) {
    conditions.push("a.supportsExtendedThinking = true");
  }
  if (requirements.supportsInterleavedThinking) {
    conditions.push("a.supportsInterleavedThinking = true");
  }
  if (requirements.supportsStructuredOutputs) {
    conditions.push("a.supportsStructuredOutputs = true");
  }
  if (requirements.maxCostPer1kOutput !== undefined) {
    conditions.push("a.costPer1kOutput <= $maxCost");
    params.maxCost = requirements.maxCostPer1kOutput;
  }

  const result = await runQuery(
    `MATCH (a:Agent) WHERE ${conditions.join(" AND ")} RETURN a ORDER BY a.avgLatencyMs ASC`,
    params,
    "READ",
  );
  return result.records;
}

// ============ PATTERN QUERIES ============

export async function createPattern(props: PatternProps): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (p:Pattern { id: $id })
       ON CREATE SET
         p.name = $name,
         p.description = $description,
         p.state = $state,
         p.morphemeKinds = $morphemeKinds,
         p.domain = $domain,
         p.createdAt = datetime(),
         p.observationCount = 0,
         p.connectionCount = 0
       ON MATCH SET
         p.name = $name,
         p.description = $description,
         p.state = $state,
         p.morphemeKinds = $morphemeKinds,
         p.domain = $domain,
         p.updatedAt = datetime()`,
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

export async function getPattern(id: string): Promise<Neo4jRecord | null> {
  const result = await runQuery(
    "MATCH (p:Pattern { id: $id }) RETURN p",
    { id },
    "READ",
  );
  return result.records[0] ?? null;
}

export async function updatePatternState(
  id: string,
  state: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (p:Pattern { id: $id })
       SET p.state = $state, p.updatedAt = datetime()`,
      { id, state },
    );
  });
}

/** Increment pattern connection count and recalculate state */
export async function connectPatterns(
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
      `MATCH (a:Pattern { id: $fromId }), (b:Pattern { id: $toId })
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
        selectedAgentId: $selectedAgentId,
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
       MATCH (a:Agent { id: $selectedAgentId })
       MERGE (d)-[:SELECTED]->(a)
       WITH d
       OPTIONAL MATCH (p:Pattern { id: $madeByPatternId })
       FOREACH (_ IN CASE WHEN p IS NOT NULL THEN [1] ELSE [] END |
         MERGE (d)-[:MADE_BY]->(p)
       )
       WITH d
       OPTIONAL MATCH (cc:ContextCluster { id: $contextClusterId })
       FOREACH (_ IN CASE WHEN cc IS NOT NULL THEN [1] ELSE [] END |
         MERGE (d)-[:IN_CONTEXT]->(cc)
       )`,
      {
        ...props,
        domain: props.domain ?? null,
        madeByPatternId: props.madeByPatternId ?? null,
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
     MATCH (d)-[:SELECTED]->(a:Agent)
     RETURN d, a
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
     MATCH (d)-[:SELECTED]->(a:Agent)
     WITH a,
          count(d) AS totalTrials,
          sum(CASE WHEN d.success THEN 1 ELSE 0 END) AS successes,
          sum(CASE WHEN NOT d.success THEN 1 ELSE 0 END) AS failures,
          avg(d.qualityScore) AS avgQuality,
         avg(d.durationMs) AS avgLatencyMs,
         avg(COALESCE(d.cost, 0)) AS avgCost,
         sum(COALESCE(d.cost, 0)) AS totalCost
     RETURN a.id AS agentId,
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
    agentId: r.get("agentId"),
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
       MATCH (p:Pattern { id: $sourcePatternId })
       MERGE (o)-[:OBSERVED_BY]->(p)
       SET p.observationCount = coalesce(p.observationCount, 0) + 1`,
      {
        ...props,
        unit: props.unit ?? null,
        context: props.context ?? null,
      },
    );
  });
}

/** Get observations for ΦL computation — recent, for a given pattern */
export async function getObservationsForPattern(
  patternId: string,
  limit: number = 50,
): Promise<Neo4jRecord[]> {
  const result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_BY]->(p:Pattern { id: $patternId })
     WHERE o.retained = true
     RETURN o
     ORDER BY o.timestamp DESC
     LIMIT $limit`,
    { patternId, limit },
    "READ",
  );
  return result.records;
}

/** Count observations for maturity calculation */
export async function countObservationsForPattern(
  patternId: string,
): Promise<number> {
  const result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_BY]->(p:Pattern { id: $patternId })
     WHERE o.retained = true
     RETURN count(o) AS count`,
    { patternId },
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
 * Get the degree of a pattern node (number of relationships).
 * Used for topology-aware dampening: γ_effective = min(0.7, 0.8/(k-1))
 */
export async function getPatternDegree(patternId: string): Promise<number> {
  const result = await runQuery(
    `MATCH (p:Pattern { id: $patternId })
     OPTIONAL MATCH (p)-[r]-()
     RETURN count(r) AS degree`,
    { patternId },
    "READ",
  );
  return result.records[0]?.get("degree") ?? 0;
}

/**
 * Get the adjacency list for patterns.
 * Used for ΨH (spectral analysis) computations.
 */
export async function getPatternAdjacency(): Promise<
  Array<{ from: string; to: string; weight: number }>
> {
  const result = await runQuery(
    `MATCH (a:Pattern)-[r]->(b:Pattern)
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
 * Get all patterns with their phi-L values.
 * Used for Graph Total Variation computation in ΨH.
 */
export async function getPatternsWithHealth(): Promise<
  Array<{ id: string; phiL: number; state: string; degree: number }>
> {
  const result = await runQuery(
    `MATCH (p:Pattern)
     OPTIONAL MATCH (p)-[r]-()
     WITH p, count(r) AS degree
     RETURN p.id AS id,
            coalesce(p.phiL, 0.5) AS phiL,
            coalesce(p.state, 'created') AS state,
            degree
     ORDER BY p.id`,
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
 * Store computed ΦL on a pattern node.
 */
export async function updatePatternPhiL(
  patternId: string,
  phiL: number,
  trend: "improving" | "stable" | "declining",
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (p:Pattern { id: $patternId })
       SET p.phiL = $phiL,
           p.phiLTrend = $trend,
           p.phiLComputedAt = datetime()`,
      { patternId, phiL, trend },
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
