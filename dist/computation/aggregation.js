// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Codex Signum — Hierarchical Health Aggregation (Pure Computation)
 *
 * Computes health at every level of the containment hierarchy.
 * Node → Pattern → Bloom → System. Each level aggregates from constituents.
 *
 * Pure functions — no graph dependency. Data in, results out.
 *
 * Aggregation semantics (from v3.0 spec):
 * - ΦL at container = weighted mean of children's ΦL_effective
 * - ΨH at container = computed from the container's OWN subgraph (NOT averaged)
 * - εR at container = weighted mean of children's εR
 *
 * @see codex-signum-v3.0.md §State Dimensions, §Blooms fractal
 * @see attunement-v0.2.md §Identity
 * @module codex-signum-core/computation/aggregation
 */
import { computePsiH } from "./psi-h.js";
// ============ HELPERS ============
/**
 * Compute a weighted mean of values with corresponding weights.
 * Returns 0 if no values or all weights are zero.
 */
export function weightedMean(values, weights) {
    if (values.length === 0 || values.length !== weights.length)
        return 0;
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < values.length; i++) {
        weightedSum += values[i] * weights[i];
        totalWeight += weights[i];
    }
    if (totalWeight === 0)
        return 0;
    return weightedSum / totalWeight;
}
// ============ AGGREGATION ============
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
export function aggregateHealth(children, subgraph, level) {
    // Edge case: no children — return zeroed-out health (defensive)
    if (children.length === 0) {
        return {
            phiL_effective: 0,
            psiH_combined: 0,
            epsilonR_value: 0,
            constituentCount: 0,
            level,
        };
    }
    // Edge case: single child — inherit directly
    if (children.length === 1) {
        return {
            phiL_effective: children[0].phiL_effective,
            psiH_combined: children[0].psiH_combined,
            epsilonR_value: children[0].epsilonR_value,
            constituentCount: 1,
            level,
        };
    }
    const weights = children.map((c) => c.weight);
    // ΦL: weighted mean (no dampening — dampening is for delta propagation, not snapshot aggregation)
    const phiL_effective = weightedMean(children.map((c) => c.phiL_effective), weights);
    // ΨH: compute from subgraph if available, otherwise fall back to weighted mean
    let psiH_combined;
    if (subgraph && subgraph.edges.length > 0 && subgraph.nodeHealths.length > 0) {
        const psiH = computePsiH(subgraph.edges, subgraph.nodeHealths);
        psiH_combined = psiH.combined;
    }
    else {
        // Graceful degradation: weighted mean of children's ΨH
        psiH_combined = weightedMean(children.map((c) => c.psiH_combined), weights);
    }
    // εR: weighted mean
    const epsilonR_value = weightedMean(children.map((c) => c.epsilonR_value), weights);
    return {
        phiL_effective,
        psiH_combined,
        epsilonR_value,
        constituentCount: children.length,
        level,
    };
}
//# sourceMappingURL=aggregation.js.map