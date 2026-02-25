/**
 * Codex Signum — Hierarchical Health Orchestration
 *
 * Wires graph queries to aggregation functions. NOT pure — calls graph/queries.
 * But still core logic that computes health at every level of the
 * containment hierarchy.
 *
 * Algorithm:
 * 1. Get all leaf nodes — their health is already computed per-execution
 * 2. Get all containers ordered bottom-up (deepest first)
 * 3. For each container, aggregate from children
 * 4. Return health at every level
 *
 * @see codex-signum-v3.0.md §Blooms fractal
 * @see attunement-v0.2.md §Identity
 * @module codex-signum-core/computation/hierarchical-health
 */
import { getContainedChildren, getContainersBottomUp, getPatternAdjacency, getPatternsWithHealth, getSubgraphEdges, } from "../graph/queries.js";
import { aggregateHealth } from "./aggregation.js";
/**
 * Compute health at every level of the containment hierarchy.
 *
 * Bottom-up walk: deepest containers first, so children are already
 * computed when we reach their parent.
 *
 * @returns Map from nodeId to aggregated health
 */
export async function computeHierarchicalHealth() {
    const results = new Map();
    // Step 1: Get all leaf-level health (patterns with stored ΦL)
    const patterns = await getPatternsWithHealth();
    for (const p of patterns) {
        results.set(p.id, {
            phiL_effective: p.phiL,
            psiH_combined: 0, // Leaf-level ΨH comes from per-pattern computation, not stored here
            epsilonR_value: 0, // Leaf-level εR comes from per-pattern computation
            constituentCount: 1,
            level: 0,
        });
    }
    // Step 2: Get containers ordered bottom-up (deepest first)
    const containers = await getContainersBottomUp();
    // Step 3: For each container, aggregate from children
    for (const container of containers) {
        const childNodes = await getContainedChildren(container.id);
        // Build children health from already-computed results
        const children = [];
        for (const child of childNodes) {
            const childHealth = results.get(child.id);
            if (childHealth) {
                children.push({
                    id: child.id,
                    phiL_effective: childHealth.phiL_effective,
                    psiH_combined: childHealth.psiH_combined,
                    epsilonR_value: childHealth.epsilonR_value,
                    weight: 1, // Equal weight for all children
                });
            }
        }
        // Get subgraph edges for ΨH computation at this level
        const edges = await getSubgraphEdges(container.id);
        const subgraph = edges.length > 0
            ? {
                edges,
                nodeHealths: children.map((c) => ({
                    id: c.id,
                    phiL: c.phiL_effective,
                })),
            }
            : null;
        // Aggregate
        const aggregated = aggregateHealth(children, subgraph, container.depth + 1);
        results.set(container.id, aggregated);
    }
    return results;
}
/**
 * Compute system-level health — the top of the hierarchy.
 * Aggregates ALL active patterns into a single system health score.
 * This is what the structural review examines for ecosystem-wide ΦL velocity.
 */
export async function computeSystemHealth() {
    // Get all patterns with their health
    const patterns = await getPatternsWithHealth();
    // Get full graph adjacency for ΨH
    const edges = await getPatternAdjacency();
    // Build children from all active patterns (equal weight)
    const children = patterns.map((p) => ({
        id: p.id,
        phiL_effective: p.phiL,
        psiH_combined: 0, // Will be computed from full graph subgraph
        epsilonR_value: 0, // System εR comes from aggregate decisions
        weight: 1,
    }));
    // Build subgraph input from full adjacency
    const subgraph = {
        edges,
        nodeHealths: patterns.map((p) => ({ id: p.id, phiL: p.phiL })),
    };
    // Find max depth among containers (if any)
    const containers = await getContainersBottomUp();
    const maxDepth = containers.length > 0
        ? Math.max(...containers.map((c) => c.depth))
        : 0;
    return aggregateHealth(children, subgraph, maxDepth + 1);
}
//# sourceMappingURL=hierarchical-health.js.map