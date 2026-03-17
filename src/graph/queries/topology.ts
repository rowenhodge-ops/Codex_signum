// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { runQuery } from "../client.js";

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
 * Get the parent Bloom of a given node via CONTAINS edge.
 * Returns null if the node has no parent (i.e., it is a root).
 */
export async function getParentBloom(
  childId: string,
): Promise<{ id: string; phiL: number; degree: number } | null> {
  const result = await runQuery(
    `MATCH (parent:Bloom)-[:CONTAINS]->(child {id: $childId})
     OPTIONAL MATCH (parent)-[r]-()
     WITH parent, count(r) AS degree
     RETURN parent.id AS id,
            coalesce(parent.phiL, 0.5) AS phiL,
            degree
     LIMIT 1`,
    { childId },
    "READ",
  );
  if (result.records.length === 0) return null;
  const rec = result.records[0];
  return {
    id: rec.get("id"),
    phiL: rec.get("phiL"),
    degree: rec.get("degree"),
  };
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
