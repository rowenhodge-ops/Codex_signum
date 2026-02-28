/**
 * Health state at any level — the three state dimensions.
 * Used for both leaf nodes and aggregated containers.
 */
export interface AggregateHealth {
    phiL_effective: number;
    psiH_combined: number;
    epsilonR_value: number;
    /** Number of constituent nodes this aggregation covers */
    constituentCount: number;
    /** Level in the hierarchy (0 = leaf) */
    level: number;
}
/**
 * Input for a single child in the aggregation.
 */
export interface ChildHealth {
    id: string;
    phiL_effective: number;
    psiH_combined: number;
    epsilonR_value: number;
    /** Weight of this child in the container (default: equal weight) */
    weight: number;
}
/**
 * Input for ΨH computation at container level.
 * ΨH is RELATIONAL — computed from the container's own subgraph,
 * NOT averaged from children.
 */
export interface SubgraphInput {
    edges: Array<{
        from: string;
        to: string;
        weight: number;
    }>;
    nodeHealths: Array<{
        id: string;
        phiL: number;
    }>;
}
/**
 * Compute a weighted mean of values with corresponding weights.
 * Returns 0 if no values or all weights are zero.
 */
export declare function weightedMean(values: number[], weights: number[]): number;
/**
 * Aggregate health from children to container.
 *
 * ΦL at container = weighted mean of children's ΦL_effective.
 *   Dampening applies to CHANGE propagation, not steady-state aggregation.
 *
 * ΨH at container = computed from the container's OWN subgraph.
 *   NOT averaged from children. ΨH is relational — it's about how the
 *   children relate to each other, not what they individually report.
 *   Falls back to weighted mean if no subgraph data is available.
 *
 * εR at container = weighted mean of children's εR.
 *   Reflects whether constituents are collectively exploring or exploiting.
 *
 * @param children — Health states of all children
 * @param subgraph — Edges and node healths for ΨH computation (optional if not available)
 * @param level — Hierarchy level (0 = leaf, higher = closer to root)
 */
export declare function aggregateHealth(children: ChildHealth[], subgraph: SubgraphInput | null, level: number): AggregateHealth;
//# sourceMappingURL=aggregation.d.ts.map