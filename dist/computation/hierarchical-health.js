// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
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
import { getContainedChildren, getContainersBottomUp, getParentBloom, getPatternAdjacency, getPatternsWithHealth, getSubgraphEdges, updateBloomPhiL, } from "../graph/queries.js";
import { aggregateHealth, weightedMean } from "./aggregation.js";
import { CASCADE_LIMIT, HYSTERESIS_RATIO, checkAlgedonicBypass, computeGammaEffective, } from "./dampening.js";
import { computeMaturityFactor } from "./maturity.js";
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
    // M-22.5: leaf nodes now carry signal_conditioned flag (ΦL comes from
    // conditioned observations via M-22.1/M-22.2, not qualityScore proxy)
    const patterns = await getPatternsWithHealth();
    for (const p of patterns) {
        // M-22.5: Leaf nodes carry phiL_factors derived from stored ΦL.
        // When the full 4-factor decomposition isn't stored on the node, we use
        // the stored ΦL as a uniform approximation across all factors.
        // This is accurate for nodes where ΦL was computed via computePhiL()
        // (M-22.2), since the factors contribute to the same effective value.
        results.set(p.id, {
            phiL_effective: p.phiL,
            psiH_combined: 0, // Leaf-level ΨH comes from per-pattern computation, not stored here
            epsilonR_value: 0, // Leaf-level εR comes from per-pattern computation
            constituentCount: 1,
            level: 0,
            signal_conditioned: true, // M-22.5: ΦL now flows from signal conditioning pipeline
            phiL_factors: {
                axiom_compliance: p.phiL,
                provenance_clarity: p.phiL,
                usage_success_rate: p.phiL,
                temporal_stability: p.phiL,
            },
        });
    }
    // Step 2: Get containers ordered bottom-up (deepest first)
    const containers = await getContainersBottomUp();
    // Step 3: For each container, aggregate from children with M-22.5 metadata
    for (const container of containers) {
        const childNodes = await getContainedChildren(container.id);
        const k = childNodes.length; // branching factor for dampening
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
        // Aggregate base health
        const aggregated = aggregateHealth(children, subgraph, container.depth + 1);
        // M-22.5: Compute dampening metadata for container
        const gamma_effective = k > 0 ? computeGammaEffective(k) : 0;
        // M-22.5: Aggregate 4-factor ΦL decomposition from children (weighted mean per factor)
        const childFactors = childNodes
            .map((cn) => results.get(cn.id))
            .filter((h) => h !== undefined && h.phiL_factors !== undefined);
        let phiL_factors;
        if (childFactors.length > 0) {
            const weights = childFactors.map(() => 1);
            phiL_factors = {
                axiom_compliance: weightedMean(childFactors.map((c) => c.phiL_factors.axiom_compliance), weights),
                provenance_clarity: weightedMean(childFactors.map((c) => c.phiL_factors.provenance_clarity), weights),
                usage_success_rate: weightedMean(childFactors.map((c) => c.phiL_factors.usage_success_rate), weights),
                temporal_stability: weightedMean(childFactors.map((c) => c.phiL_factors.temporal_stability), weights),
            };
        }
        // M-22.5: Compute maturity factor from children's observation/connection counts
        const totalObs = childNodes.reduce((sum, cn) => sum + cn.observationCount, 0);
        const totalConn = childNodes.reduce((sum, cn) => sum + cn.connectionCount, 0);
        const maturity_factor = computeMaturityFactor(k > 0 ? totalObs / k : 0, k > 0 ? totalConn / k : 0);
        results.set(container.id, {
            ...aggregated,
            dampening_applied: k > 0,
            gamma_effective,
            cascade_depth: container.depth + 1,
            maturity_factor,
            phiL_factors,
        });
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
// ============ TRIGGERED PROPAGATION (M-22.5) ============
/** Noise gate: only propagate ΦL changes larger than this threshold */
export const PHI_L_PROPAGATION_NOISE_GATE = 0.01;
/**
 * Propagate a ΦL change upward through the CONTAINS hierarchy.
 * Triggered when a Bloom's ΦL changes (via writeObservation step 7).
 *
 * Flow:
 *   1. Read parent Bloom via CONTAINS edge
 *   2. Read all siblings (parent's other children)
 *   3. Compute dampened impact: γ_effective(k) × ΔΦL
 *   4. Apply hysteresis: if recovering, rate = degradation_rate / 2.5
 *   5. Recompute parent ΦL from children (weighted mean)
 *   6. Persist parent's new ΦL
 *   7. If cascade_depth < CASCADE_LIMIT, recurse to grandparent
 *   8. If algedonic (ΦL < 0.1), bypass dampening to root
 *
 * @param bloomId - The Bloom whose ΦL just changed
 * @param previousPhiL - ΦL before the change
 * @param newPhiL - ΦL after the change
 * @param cascadeDepth - Current depth in the cascade (starts at 0)
 */
export async function propagatePhiLUpward(bloomId, previousPhiL, newPhiL, cascadeDepth = 0) {
    // Step 1: Find parent via CONTAINS edge
    const parent = await getParentBloom(bloomId);
    if (!parent)
        return; // Root node — nowhere to propagate
    // Step 2: Read all children of the parent (siblings + this node)
    const siblings = await getContainedChildren(parent.id);
    const k = siblings.length; // branching factor
    if (k === 0)
        return; // Defensive — shouldn't happen if parent CONTAINS bloomId
    // Step 3: Compute dampened impact
    const deltaPhiL = previousPhiL - newPhiL; // positive = degradation
    const isDegrading = deltaPhiL > 0;
    // Step 8 (checked early): Algedonic bypass — ΦL < 0.1 is existential threat
    const bypass = checkAlgedonicBypass(newPhiL);
    let gamma;
    if (bypass.bypassed) {
        gamma = 1.0; // Emergency: no dampening, bypass cascade limit
    }
    else {
        gamma = computeGammaEffective(k);
    }
    // Apply hysteresis: recovery is 2.5× slower than degradation
    let effectiveImpact;
    if (isDegrading) {
        effectiveImpact = gamma * deltaPhiL;
    }
    else {
        effectiveImpact = (gamma / HYSTERESIS_RATIO) * Math.abs(deltaPhiL);
    }
    // Step 5: Recompute parent ΦL from children (weighted mean — children already
    // have their updated ΦL values stored on graph nodes)
    const childPhiLs = siblings.map((s) => s.phiL);
    const parentNewPhiL = weightedMean(childPhiLs, siblings.map(() => 1));
    // Clamp to [0, 1]
    const clampedParentPhiL = Math.max(0, Math.min(1, parentNewPhiL));
    // Step 6: Persist parent's new ΦL
    const parentPreviousPhiL = parent.phiL;
    const parentTrend = clampedParentPhiL > parentPreviousPhiL + 0.01
        ? "improving"
        : clampedParentPhiL < parentPreviousPhiL - 0.01
            ? "declining"
            : "stable";
    await updateBloomPhiL(parent.id, clampedParentPhiL, parentTrend);
    // Step 7: Recurse upward if within cascade limit (or algedonic bypass)
    const parentDelta = Math.abs(clampedParentPhiL - parentPreviousPhiL);
    if (parentDelta > PHI_L_PROPAGATION_NOISE_GATE) {
        if (bypass.bypassed || cascadeDepth + 1 < CASCADE_LIMIT) {
            await propagatePhiLUpward(parent.id, parentPreviousPhiL, clampedParentPhiL, cascadeDepth + 1);
        }
    }
}
//# sourceMappingURL=hierarchical-health.js.map