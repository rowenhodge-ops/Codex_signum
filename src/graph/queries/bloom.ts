// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery, writeTransaction } from "../client.js";
import { instantiateMorpheme, updateMorpheme, createLine } from "../instantiation.js";
import type { LineType } from "../instantiation.js";

// ============ TYPES ============

/** Properties for creating/updating a Bloom node (scoped composition of morphemes) */
export interface BloomProps {
  id: string;
  name: string;
  type: string;              // REQUIRED — milestone, sub-milestone, pattern, etc.
  status: string;            // REQUIRED — planned, active, complete, created
  content?: string;          // Morpheme content (A1: every morpheme carries meaning). Falls back to description.
  description?: string;
  morphemeKinds?: string[];  // which morpheme types compose this bloom
  domain?: string;
  phiL?: number;
  [key: string]: unknown;
}

// ============ BLOOM QUERIES ============

export async function createBloom(props: BloomProps): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (b:Bloom { id: $id })
       ON CREATE SET
         b.name = $name,
         b.type = $type,
         b.status = $status,
         b.description = $description,
         b.morphemeKinds = $morphemeKinds,
         b.domain = $domain,
         b.phiL = $phiL,
         b.createdAt = datetime(),
         b.observationCount = 0,
         b.connectionCount = 0
       ON MATCH SET
         b.name = $name,
         b.type = $type,
         b.status = $status,
         b.description = $description,
         b.morphemeKinds = $morphemeKinds,
         b.domain = $domain,
         b.phiL = COALESCE($phiL, b.phiL),
         b.updatedAt = datetime()`,
      {
        ...props,
        type: props.type,
        status: props.status,
        description: props.description ?? null,
        morphemeKinds: props.morphemeKinds ?? [],
        domain: props.domain ?? null,
        phiL: props.phiL ?? null,
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

/**
 * @deprecated Use updateBloomStatus() instead — this function bypasses the Mutation Resonator
 * (no parent status propagation, no observation recording, no read-back verification).
 */
export async function updateBloomState(
  id: string,
  state: string,
): Promise<void> {
  console.warn(`⚠️ DEPRECATED: updateBloomState('${id}') called — use updateBloomStatus() instead. This path bypasses the Mutation Resonator.`);
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (b:Bloom { id: $id })
       SET b.status = $state, b.updatedAt = datetime()`,
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
            coalesce(b.status, b.state, 'created') AS state,
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
 *
 * Optional healthBand and phiLState params added for M-22.2:
 * - healthBand: persisted for band-crossing detection across runs
 * - phiLState: JSON-serialised ring buffer for temporal stability
 */
export async function updateBloomPhiL(
  bloomId: string,
  phiL: number,
  trend: "improving" | "stable" | "declining",
  healthBandValue?: string,
  phiLStateJson?: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (b:Bloom { id: $bloomId })
       SET b.phiL = $phiL,
           b.phiLTrend = $trend,
           b.phiLComputedAt = datetime()
       WITH b
       WHERE $healthBand IS NOT NULL
       SET b.healthBand = $healthBand
       WITH b
       WHERE $phiLState IS NOT NULL
       SET b.phiLState = $phiLState`,
      { bloomId, phiL, trend, healthBand: healthBandValue ?? null, phiLState: phiLStateJson ?? null },
    );
  });
}

// ============ ATOMIC CREATION + STATUS DERIVATION (R-39) ============

/**
 * Create a Bloom AND wire it to a parent via the Instantiation Protocol.
 * G3: containment is parent→child. Non-root Blooms MUST have a parent.
 *
 * Delegates to instantiateMorpheme() which enforces:
 * - Morpheme hygiene (all required properties present)
 * - Grammatical shape (parent can contain bloom)
 * - Atomic CONTAINS + INSTANTIATES wiring
 * - Observation recording in the Instantiation Resonator's Grid
 */
export async function createContainedBloom(
  props: BloomProps,
  parentId: string,
  relationship: 'CONTAINS' | 'HAS_MILESTONE' | 'HAS_PHASE' | 'HAS_STAGE' = 'CONTAINS',
): Promise<void> {
  // content is required by the protocol; fall back to description for backward compat
  const content = props.content ?? props.description ?? '';
  const { id, name, type, status, description, morphemeKinds, domain, phiL, ...rest } = props;

  const properties: Record<string, unknown> = {
    id, name, type, status, content,
    ...(description !== undefined ? { description } : {}),
    ...(morphemeKinds !== undefined ? { morphemeKinds } : {}),
    ...(domain !== undefined ? { domain } : {}),
    ...(phiL !== undefined ? { phiL } : {}),
    ...rest,
    observationCount: 0,
    connectionCount: 0,
  };

  const result = await instantiateMorpheme("bloom", properties, parentId);
  if (!result.success) {
    throw new Error(result.error ?? "Bloom instantiation failed");
  }

  // If a non-CONTAINS relationship was requested, also create that Line
  if (relationship !== 'CONTAINS') {
    const lineResult = await createLine(parentId, props.id, relationship as LineType);
    if (!lineResult.success) {
      throw new Error(lineResult.error ?? `${relationship} line creation failed`);
    }
  }
}

/**
 * Update a Bloom's status via the Mutation Resonator with parent status recalculation.
 * G3 health derivation: parent status = f(children), not manual assignment.
 *
 * Delegates to updateMorpheme() which enforces:
 * - Property preservation (cannot remove required properties)
 * - Relationship preservation (INSTANTIATES maintained)
 * - Parent status propagation
 * - Observation recording in the Mutation Resonator's Grid
 */
export async function updateBloomStatus(
  bloomId: string,
  status: string,
  options?: { phiL?: number; commitSha?: string; testCount?: number },
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (options?.phiL !== undefined) updates.phiL = options.phiL;
  if (options?.commitSha !== undefined) updates.commitSha = options.commitSha;
  if (options?.testCount !== undefined) updates.testCount = options.testCount;

  const result = await updateMorpheme(bloomId, updates);
  if (!result.success) {
    throw new Error(result.error ?? "Bloom status update failed");
  }
}

// ============ STAMP VERIFICATION ============

/**
 * Diagnostic result from verifyStamp() — caller decides whether to throw.
 */
export interface StampVerification {
  childId: string;
  childStatus: string | null;
  childPhiL: number | null;
  childCommitSha: string | null;
  parentId: string | null;
  parentStatus: string | null;
  parentChildCount: number;
  parentCompleteCount: number;
  containsEdgeExists: boolean;
  issues: string[];
}

/**
 * Verify that a Bloom stamp persisted correctly.
 * Checks: child status, parent CONTAINS edge, parent status derivation.
 *
 * Call this AFTER updateBloomStatus() to confirm persistence.
 * Returns a diagnostic object — throw on failure is caller's decision.
 */
export async function verifyStamp(
  bloomId: string,
  expectedStatus: string,
  expectedParentId?: string,
): Promise<StampVerification> {
  const result = await runQuery(
    `MATCH (b:Bloom {id: $bloomId})
     OPTIONAL MATCH (parent)-[:CONTAINS]->(b)
     WHERE parent:Bloom
     WITH b, parent
     OPTIONAL MATCH (parent)-[:CONTAINS]->(sibling)
     WHERE sibling:Bloom OR sibling:Seed
     WITH b, parent,
          count(sibling) AS totalChildren,
          count(CASE WHEN sibling.status = 'complete' THEN 1 END) AS completeChildren,
          parent IS NOT NULL AS hasParent
     RETURN b.status AS childStatus,
            b.phiL AS childPhiL,
            b.commitSha AS childCommitSha,
            parent.id AS parentId,
            parent.status AS parentStatus,
            totalChildren,
            completeChildren,
            hasParent`,
    { bloomId },
    "READ",
  );

  const rec = result.records[0];
  const issues: string[] = [];

  if (!rec) {
    return {
      childId: bloomId,
      childStatus: null,
      childPhiL: null,
      childCommitSha: null,
      parentId: null,
      parentStatus: null,
      parentChildCount: 0,
      parentCompleteCount: 0,
      containsEdgeExists: false,
      issues: [`Node '${bloomId}' does not exist in graph`],
    };
  }

  const childStatus = rec.get("childStatus");
  const parentId = rec.get("parentId");
  const hasParent = rec.get("hasParent");
  const parentStatus = rec.get("parentStatus");
  const totalChildren = rec.get("totalChildren") ?? 0;
  const completeChildren = rec.get("completeChildren") ?? 0;

  if (childStatus !== expectedStatus) {
    issues.push(`Child status is '${childStatus}', expected '${expectedStatus}'`);
  }

  if (expectedParentId && parentId !== expectedParentId) {
    issues.push(`Parent is '${parentId}', expected '${expectedParentId}'`);
  }

  if (!hasParent) {
    issues.push(`No CONTAINS edge found — node is structurally orphaned`);
  }

  // Check parent status derivation
  if (hasParent && totalChildren > 0) {
    const expectedParentStatus = completeChildren === totalChildren
      ? "complete"
      : completeChildren > 0
        ? "active"
        : "planned";
    if (parentStatus !== expectedParentStatus) {
      issues.push(
        `Parent status is '${parentStatus}', expected '${expectedParentStatus}' ` +
        `(${completeChildren}/${totalChildren} children complete)`,
      );
    }
  }

  return {
    childId: bloomId,
    childStatus,
    childPhiL: rec.get("childPhiL"),
    childCommitSha: rec.get("childCommitSha"),
    parentId,
    parentStatus,
    parentChildCount: totalChildren,
    parentCompleteCount: completeChildren,
    containsEdgeExists: hasParent,
    issues,
  };
}

// ============ M-22.3: ΨH PERSISTENCE ============

/**
 * Persist computed ΨH, temporal decomposition, and PsiHState on a Bloom node.
 * Follows the same JSON-property pattern as updateBloomPhiL for PhiLState.
 */
export async function updateBloomPsiH(
  bloomId: string,
  psiHCombined: number,
  lambda2: number,
  friction: number,
  psiHTrend: number,
  psiHStateJson: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (b:Bloom { id: $bloomId })
       SET b.previousLambda2 = b.lambda2,
           b.psiH = $psiH,
           b.lambda2 = $lambda2,
           b.friction = $friction,
           b.psiHTrend = $psiHTrend,
           b.psiHState = $psiHState,
           b.psiHComputedAt = datetime()`,
      {
        bloomId,
        psiH: psiHCombined,
        lambda2,
        friction,
        psiHTrend,
        psiHState: psiHStateJson,
      },
    );
  });
}

// ============ M-22.4: εR PERSISTENCE ============

/**
 * Persist computed εR on a Bloom node.
 * Follows the same property pattern as updateBloomPhiL and updateBloomPsiH.
 */
export async function updateBloomEpsilonR(
  bloomId: string,
  epsilonR: number,
  range: string,
  exploratoryCount: number,
  totalCount: number,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (b:Bloom { id: $bloomId })
       SET b.epsilonR = $epsilonR,
           b.epsilonRRange = $range,
           b.epsilonRExploratory = $exploratoryCount,
           b.epsilonRTotal = $totalCount,
           b.epsilonRComputedAt = datetime()`,
      { bloomId, epsilonR, range, exploratoryCount, totalCount },
    );
  });
}

// ============ BACKWARD COMPATIBILITY (remove in M-8) ============

/** @deprecated Use BloomProps */
export type PatternProps = BloomProps;
/** @deprecated Use createBloom */
export const createPattern = createBloom;
/** @deprecated Use getBloom */
export const getPattern = getBloom;
/** @deprecated Use updateBloomStatus() — updatePatternState and updateBloomState both bypass the Mutation Resonator. */
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
