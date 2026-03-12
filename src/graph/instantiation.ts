// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Morpheme Instantiation Protocol — governance Resonator enforcement layer.
 *
 * ALL morpheme creation and modification flows through exactly three functions:
 * - instantiateMorpheme() — creates a morpheme via the Instantiation Resonator
 * - updateMorpheme()      — updates a morpheme via the Mutation Resonator
 * - createLine()          — creates a Line via the Line Creation Resonator
 *
 * After Phase B, no raw Cypher creates or mutates morpheme nodes ever again.
 *
 * @see docs/specs/instantiation-mutation-resonator-design.md
 * @see docs/specs/cs-v5.0.md §Constitutional Coupling
 */

import { writeTransaction, readTransaction } from "./client.js";

// ─── Types ──────────────────────────────────────────────────────────

export type MorphemeType = "seed" | "bloom" | "resonator" | "grid" | "helix";

/** Neo4j label for each morpheme type */
const LABEL_MAP: Record<MorphemeType, string> = {
  seed: "Seed",
  bloom: "Bloom",
  resonator: "Resonator",
  grid: "Grid",
  helix: "Helix",
};

/** Required properties per morpheme type */
const REQUIRED_PROPERTIES: Record<MorphemeType, string[]> = {
  seed: ["id", "name", "content", "seedType", "status"],
  bloom: ["id", "name", "content", "type", "status"],
  resonator: ["id", "name", "content", "type", "status"],
  grid: ["id", "name", "content", "type", "status"],
  helix: ["id", "name", "content", "mode", "status"],
};

/** Constitutional Bloom definition ID for each morpheme type */
const DEFINITION_MAP: Record<MorphemeType, string> = {
  seed: "def:morpheme:seed",
  bloom: "def:morpheme:bloom",
  resonator: "def:morpheme:resonator",
  grid: "def:morpheme:grid",
  helix: "def:morpheme:helix",
};

/** Valid containment: which types can contain which */
const VALID_CONTAINERS: Record<string, MorphemeType[]> = {
  bloom: ["seed", "bloom", "resonator", "grid", "helix"],
  grid: ["seed"],
};

/** Valid Line relationship types and their direction semantics */
const VALID_LINE_TYPES = [
  "CONTAINS",
  "FLOWS_TO",
  "INSTANTIATES",
  "DEPENDS_ON",
  "OBSERVES",
  "SCOPED_TO",
  "VIOLATES",
  "ROUTED_TO",
  "ORIGINATED_FROM",
  "IN_CONTEXT",
  "DECIDED_DURING",
  "OBSERVED_IN",
  "DISTILLED_FROM",
  "EXECUTED_IN",
  "PRODUCED",
  "PROCESSED",
] as const;

export type LineType = (typeof VALID_LINE_TYPES)[number];

// ─── Result types ───────────────────────────────────────────────────

export interface InstantiationResult {
  success: boolean;
  nodeId?: string;
  error?: string;
}

export interface MutationResult {
  success: boolean;
  nodeId?: string;
  error?: string;
}

export interface LineCreationResult {
  success: boolean;
  sourceId?: string;
  targetId?: string;
  lineType?: string;
  error?: string;
}

// ─── Instantiation Resonator ────────────────────────────────────────

/**
 * Create a morpheme instance via the Instantiation Resonator.
 *
 * Atomic transaction: node creation + CONTAINS wiring + INSTANTIATES wiring.
 * Records observation in the Instantiation Resonator's Grid.
 *
 * @param morphemeType - One of: seed, bloom, resonator, grid, helix
 * @param properties - All properties for the node (must include required fields)
 * @param parentId - The Bloom (or Grid for seeds) that will CONTAIN this morpheme
 */
export async function instantiateMorpheme(
  morphemeType: MorphemeType,
  properties: Record<string, unknown>,
  parentId: string,
): Promise<InstantiationResult> {
  const nodeId = properties.id as string | undefined;

  // ── Step 1: Morpheme hygiene check ──
  const required = REQUIRED_PROPERTIES[morphemeType];
  for (const prop of required) {
    const val = properties[prop];
    if (val === undefined || val === null || val === "") {
      const error = `Instantiation rejected: ${morphemeType} missing required property '${prop}'. id=${nodeId ?? "unknown"}`;
      await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
      return { success: false, error };
    }
  }

  // Content must be non-empty (applies to ALL morpheme types)
  const content = properties.content as string;
  if (!content || content.trim() === "") {
    const error = `Instantiation rejected: ${morphemeType} '${nodeId}' has empty content. Every morpheme carries meaning (A1).`;
    await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
    return { success: false, error };
  }

  // ── Step 2: Grammatical shape check ──
  // Verify the parent can contain this morpheme type
  const parentType = await getNodeMorphemeType(parentId);
  if (!parentType) {
    const error = `Instantiation rejected: parent '${parentId}' does not exist.`;
    await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
    return { success: false, error };
  }

  const allowedChildren = VALID_CONTAINERS[parentType];
  if (!allowedChildren) {
    const error = `Instantiation rejected: '${parentType}' cannot contain any morphemes. Only Blooms and Grids can contain.`;
    await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
    return { success: false, error };
  }

  if (!allowedChildren.includes(morphemeType)) {
    const error = `Instantiation rejected: '${parentType}' cannot contain '${morphemeType}'. Allowed: ${allowedChildren.join(", ")}.`;
    await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
    return { success: false, error };
  }

  // ── Steps 3-5: Create node + CONTAINS + INSTANTIATES (atomic) ──
  const label = LABEL_MAP[morphemeType];
  const definitionId = DEFINITION_MAP[morphemeType];

  try {
    await writeTransaction(async (tx) => {
      // Build SET clause from properties
      const propEntries = Object.entries(properties).filter(
        ([, v]) => v !== undefined,
      );
      const setCreateParts: string[] = [];
      const setMatchParts: string[] = [];
      const params: Record<string, unknown> = {
        nodeId: nodeId,
        parentId,
        definitionId,
      };

      for (const [key, value] of propEntries) {
        const paramKey = `prop_${key}`;
        params[paramKey] = value;
        if (key === "id") continue; // id is in MERGE clause
        setCreateParts.push(`n.${key} = $${paramKey}`);
        setMatchParts.push(`n.${key} = $${paramKey}`);
      }
      setCreateParts.push("n.createdAt = datetime()");
      setMatchParts.push("n.updatedAt = datetime()");

      // Create/merge the node
      await tx.run(
        `MERGE (n:${label} {id: $nodeId})
         ON CREATE SET ${setCreateParts.join(", ")}
         ON MATCH SET ${setMatchParts.join(", ")}`,
        params,
      );

      // Wire CONTAINS: parent→child (G3)
      await tx.run(
        `MATCH (p {id: $parentId}), (n:${label} {id: $nodeId})
         MERGE (p)-[:CONTAINS]->(n)`,
        { parentId, nodeId },
      );

      // Wire INSTANTIATES: instance→definition
      await tx.run(
        `MATCH (n:${label} {id: $nodeId}), (def:Seed {id: $definitionId})
         MERGE (n)-[:INSTANTIATES]->(def)`,
        { nodeId, definitionId },
      );
    });

    // ── Step 7: Record observation ──
    await recordInstantiationObservation(morphemeType, nodeId!, parentId, true);
    return { success: true, nodeId: nodeId! };
  } catch (err) {
    const error = `Instantiation failed: ${err instanceof Error ? err.message : String(err)}`;
    await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
    return { success: false, error };
  }
}

// ─── Mutation Resonator ─────────────────────────────────────────────

/**
 * Update a morpheme's properties via the Mutation Resonator.
 *
 * Preserves required properties, prevents orphaning, maintains provenance.
 * Cannot change morpheme type (INSTANTIATES is preserved).
 *
 * @param nodeId - ID of the morpheme to update
 * @param updates - Properties to update (cannot remove required properties)
 * @param newParentId - Optional: reparent the morpheme (new CONTAINS before old removed)
 */
export async function updateMorpheme(
  nodeId: string,
  updates: Record<string, unknown>,
  newParentId?: string,
): Promise<MutationResult> {
  // ── Step 1: Existence check ──
  const nodeInfo = await getNodeInfo(nodeId);
  if (!nodeInfo) {
    const error = `Mutation rejected: node '${nodeId}' does not exist.`;
    await recordMutationObservation(nodeId, false, error);
    return { success: false, error };
  }

  const morphemeType = nodeInfo.morphemeType;

  // ── Step 2: Property preservation check ──
  const required = REQUIRED_PROPERTIES[morphemeType];
  for (const prop of required) {
    if (prop in updates) {
      const val = updates[prop];
      if (val === null || val === undefined || val === "") {
        const error = `Mutation rejected: cannot remove required property '${prop}' from ${morphemeType} '${nodeId}'.`;
        await recordMutationObservation(nodeId, false, error);
        return { success: false, error };
      }
    }
  }

  // Content-specific check
  if ("content" in updates) {
    const content = updates.content as string;
    if (!content || content.trim() === "") {
      const error = `Mutation rejected: cannot set empty content on ${morphemeType} '${nodeId}'. Every morpheme carries meaning (A1).`;
      await recordMutationObservation(nodeId, false, error);
      return { success: false, error };
    }
  }

  // ── Step 3: Relationship preservation check ──
  if (newParentId) {
    // Verify new parent exists and can contain this type
    const newParentType = await getNodeMorphemeType(newParentId);
    if (!newParentType) {
      const error = `Mutation rejected: new parent '${newParentId}' does not exist.`;
      await recordMutationObservation(nodeId, false, error);
      return { success: false, error };
    }

    const allowedChildren = VALID_CONTAINERS[newParentType];
    if (!allowedChildren || !allowedChildren.includes(morphemeType)) {
      const error = `Mutation rejected: '${newParentType}' cannot contain '${morphemeType}'.`;
      await recordMutationObservation(nodeId, false, error);
      return { success: false, error };
    }
  }

  try {
    const label = LABEL_MAP[morphemeType];

    await writeTransaction(async (tx) => {
      // ── Step 3 cont'd: Reparent if requested ──
      if (newParentId) {
        // Wire new CONTAINS first (never orphan, even transiently)
        await tx.run(
          `MATCH (p {id: $newParentId}), (n:${label} {id: $nodeId})
           MERGE (p)-[:CONTAINS]->(n)`,
          { newParentId, nodeId },
        );
        // Remove old CONTAINS
        await tx.run(
          `MATCH (oldParent)-[r:CONTAINS]->(n:${label} {id: $nodeId})
           WHERE oldParent.id <> $newParentId
           DELETE r`,
          { nodeId, newParentId },
        );
      }

      // ── Step 4: Apply update ──
      const propEntries = Object.entries(updates).filter(
        ([k, v]) => v !== undefined && k !== "id",
      );
      if (propEntries.length > 0) {
        const setClauses: string[] = [];
        const params: Record<string, unknown> = { nodeId };
        for (const [key, value] of propEntries) {
          const paramKey = `upd_${key}`;
          params[paramKey] = value;
          setClauses.push(`n.${key} = $${paramKey}`);
        }
        setClauses.push("n.updatedAt = datetime()");
        await tx.run(
          `MATCH (n:${label} {id: $nodeId}) SET ${setClauses.join(", ")}`,
          params,
        );
      }

      // ── Step 5: Propagate parent status ──
      await tx.run(
        `MATCH (parent)-[:CONTAINS]->(n:${label} {id: $nodeId})
         WHERE parent:Bloom
         WITH parent
         MATCH (parent)-[:CONTAINS]->(child)
         WHERE child:Bloom OR child:Seed
         WITH parent,
              count(child) AS total,
              count(CASE WHEN child.status = 'complete' THEN 1 END) AS done
         SET parent.status = CASE
               WHEN done = total THEN 'complete'
               WHEN done > 0 THEN 'active'
               ELSE parent.status END,
             parent.phiL = CASE
               WHEN total > 0 THEN toFloat(done) / toFloat(total)
               ELSE parent.phiL END,
             parent.updatedAt = datetime()`,
        { nodeId },
      );
    });

    await recordMutationObservation(nodeId, true);
    return { success: true, nodeId };
  } catch (err) {
    const error = `Mutation failed: ${err instanceof Error ? err.message : String(err)}`;
    await recordMutationObservation(nodeId, false, error);
    return { success: false, error };
  }
}

// ─── Line Creation Resonator ────────────────────────────────────────

/**
 * Create a Line (relationship) via the Line Creation Resonator.
 *
 * Validates endpoint existence, morpheme hygiene, grammatical shape,
 * and direction rules.
 *
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @param lineType - Relationship type (e.g., CONTAINS, FLOWS_TO, DEPENDS_ON)
 * @param properties - Optional properties for the relationship
 */
export async function createLine(
  sourceId: string,
  targetId: string,
  lineType: LineType,
  properties?: Record<string, unknown>,
): Promise<LineCreationResult> {
  // ── Step 1: Endpoint existence check ──
  const sourceExists = await nodeExists(sourceId);
  if (!sourceExists) {
    const error = `Line creation rejected: source '${sourceId}' does not exist.`;
    await recordLineObservation(sourceId, targetId, lineType, false, error);
    return { success: false, error };
  }

  const targetExists = await nodeExists(targetId);
  if (!targetExists) {
    const error = `Line creation rejected: target '${targetId}' does not exist.`;
    await recordLineObservation(sourceId, targetId, lineType, false, error);
    return { success: false, error };
  }

  // ── Steps 2-3: Morpheme hygiene + grammatical shape ──
  // Validate the line type is recognized
  if (!VALID_LINE_TYPES.includes(lineType)) {
    const error = `Line creation rejected: unknown line type '${lineType}'.`;
    await recordLineObservation(sourceId, targetId, lineType, false, error);
    return { success: false, error };
  }

  // CONTAINS: verify source can contain target's type
  if (lineType === "CONTAINS") {
    const sourceType = await getNodeMorphemeType(sourceId);
    const targetType = await getNodeMorphemeType(targetId);
    if (sourceType && targetType) {
      const allowed = VALID_CONTAINERS[sourceType];
      if (!allowed || !allowed.includes(targetType)) {
        const error = `Line creation rejected: '${sourceType}' cannot CONTAIN '${targetType}'.`;
        await recordLineObservation(sourceId, targetId, lineType, false, error);
        return { success: false, error };
      }
    }
  }

  // ── Steps 5-6: Create the Line ──
  try {
    await writeTransaction(async (tx) => {
      const propParts: string[] = ["r.createdAt = datetime()"];
      const params: Record<string, unknown> = { sourceId, targetId };

      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          if (value !== undefined) {
            const paramKey = `lp_${key}`;
            params[paramKey] = value;
            propParts.push(`r.${key} = $${paramKey}`);
          }
        }
      }

      await tx.run(
        `MATCH (s {id: $sourceId}), (t {id: $targetId})
         MERGE (s)-[r:${lineType}]->(t)
         ON CREATE SET ${propParts.join(", ")}`,
        params,
      );
    });

    await recordLineObservation(sourceId, targetId, lineType, true);
    return { success: true, sourceId, targetId, lineType };
  } catch (err) {
    const error = `Line creation failed: ${err instanceof Error ? err.message : String(err)}`;
    await recordLineObservation(sourceId, targetId, lineType, false, error);
    return { success: false, error };
  }
}

// ─── Helper functions ───────────────────────────────────────────────

/**
 * Determine a node's morpheme type from its Neo4j label.
 */
async function getNodeMorphemeType(
  nodeId: string,
): Promise<MorphemeType | null> {
  const result = await readTransaction(async (tx) => {
    const res = await tx.run(
      "MATCH (n {id: $nodeId}) RETURN labels(n) AS labels",
      { nodeId },
    );
    return res.records[0]?.get("labels") as string[] | undefined;
  });

  if (!result || result.length === 0) return null;

  // Map Neo4j labels to morpheme types
  for (const label of result) {
    const lower = label.toLowerCase();
    if (lower in LABEL_MAP) return lower as MorphemeType;
  }
  return null;
}

/**
 * Get node info: morpheme type and label.
 */
async function getNodeInfo(
  nodeId: string,
): Promise<{ morphemeType: MorphemeType; label: string } | null> {
  const morphemeType = await getNodeMorphemeType(nodeId);
  if (!morphemeType) return null;
  return { morphemeType, label: LABEL_MAP[morphemeType] };
}

/**
 * Check if a node exists.
 */
async function nodeExists(nodeId: string): Promise<boolean> {
  const result = await readTransaction(async (tx) => {
    const res = await tx.run(
      "MATCH (n {id: $nodeId}) RETURN count(n) AS cnt",
      { nodeId },
    );
    const cnt = res.records[0]?.get("cnt");
    return typeof cnt === "object" && cnt !== null ? cnt.toNumber() : cnt;
  });
  return (result ?? 0) > 0;
}

// ─── Observation recording ──────────────────────────────────────────

/**
 * Record a creation event in the Instantiation Resonator's observation Grid.
 */
async function recordInstantiationObservation(
  morphemeType: string,
  nodeId: string,
  parentId: string,
  success: boolean,
  error?: string,
): Promise<void> {
  try {
    const obsId = `obs:instantiation:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await writeTransaction(async (tx) => {
      await tx.run(
        `MERGE (g:Grid {id: 'grid:instantiation-observations'})
         CREATE (obs:Seed {
           id: $obsId,
           seedType: 'observation',
           name: $name,
           content: $content,
           status: 'recorded',
           morphemeType: $morphemeType,
           targetNodeId: $nodeId,
           parentId: $parentId,
           success: $success,
           error: $error,
           createdAt: datetime()
         })
         WITH g, obs
         MERGE (g)-[:CONTAINS]->(obs)`,
        {
          obsId,
          name: `${success ? "Created" : "Rejected"} ${morphemeType} ${nodeId}`,
          content: success
            ? `Successfully created ${morphemeType} '${nodeId}' in parent '${parentId}'.`
            : `Rejected ${morphemeType} '${nodeId}': ${error}`,
          morphemeType,
          nodeId,
          parentId,
          success,
          error: error ?? null,
        },
      );
    });
  } catch {
    // Observation recording is non-fatal
  }
}

/**
 * Record a mutation event in the Mutation Resonator's observation Grid.
 */
async function recordMutationObservation(
  nodeId: string,
  success: boolean,
  error?: string,
): Promise<void> {
  try {
    const obsId = `obs:mutation:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await writeTransaction(async (tx) => {
      await tx.run(
        `MERGE (g:Grid {id: 'grid:mutation-observations'})
         CREATE (obs:Seed {
           id: $obsId,
           seedType: 'observation',
           name: $name,
           content: $content,
           status: 'recorded',
           targetNodeId: $nodeId,
           success: $success,
           error: $error,
           createdAt: datetime()
         })
         WITH g, obs
         MERGE (g)-[:CONTAINS]->(obs)`,
        {
          obsId,
          name: `${success ? "Updated" : "Rejected update"} ${nodeId}`,
          content: success
            ? `Successfully updated '${nodeId}'.`
            : `Rejected update to '${nodeId}': ${error}`,
          nodeId,
          success,
          error: error ?? null,
        },
      );
    });
  } catch {
    // Observation recording is non-fatal
  }
}

/**
 * Record a line creation event in the Line Creation Resonator's observation Grid.
 */
async function recordLineObservation(
  sourceId: string,
  targetId: string,
  lineType: string,
  success: boolean,
  error?: string,
): Promise<void> {
  try {
    const obsId = `obs:line:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await writeTransaction(async (tx) => {
      await tx.run(
        `MERGE (g:Grid {id: 'grid:line-creation-observations'})
         CREATE (obs:Seed {
           id: $obsId,
           seedType: 'observation',
           name: $name,
           content: $content,
           status: 'recorded',
           sourceId: $sourceId,
           targetId: $targetId,
           lineType: $lineType,
           success: $success,
           error: $error,
           createdAt: datetime()
         })
         WITH g, obs
         MERGE (g)-[:CONTAINS]->(obs)`,
        {
          obsId,
          name: `${success ? "Created" : "Rejected"} ${lineType} ${sourceId}→${targetId}`,
          content: success
            ? `Successfully created ${lineType} from '${sourceId}' to '${targetId}'.`
            : `Rejected ${lineType} from '${sourceId}' to '${targetId}': ${error}`,
          sourceId,
          targetId,
          lineType,
          success,
          error: error ?? null,
        },
      );
    });
  } catch {
    // Observation recording is non-fatal
  }
}
