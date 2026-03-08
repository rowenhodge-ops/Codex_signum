/**
 * Get immediate children of a container node.
 * Returns child IDs with their stored ΦL, connection count, observation count, and degree.
 */
export declare function getContainedChildren(containerId: string): Promise<Array<{
    id: string;
    phiL: number;
    observationCount: number;
    connectionCount: number;
    degree: number;
}>>;
/**
 * Get the full containment tree rooted at a node.
 * Returns { nodeId → parentId } map and leaf nodes.
 * Uses variable-length CONTAINS path traversal.
 * Leaf nodes have no outgoing CONTAINS relationships.
 */
export declare function getContainmentTree(rootId: string): Promise<{
    parentMap: Map<string, string | null>;
    leafNodes: string[];
    allNodes: string[];
}>;
/**
 * Get edges WITHIN a container's subgraph (for ΨH computation at that level).
 * Returns only edges where both endpoints are children of the container.
 */
export declare function getSubgraphEdges(containerId: string): Promise<Array<{
    from: string;
    to: string;
    weight: number;
}>>;
/**
 * Get all container nodes (nodes with outgoing CONTAINS relationships).
 * Returns containers ordered by depth (deepest first — for bottom-up walk).
 */
export declare function getContainersBottomUp(): Promise<Array<{
    id: string;
    depth: number;
}>>;
//# sourceMappingURL=topology.d.ts.map