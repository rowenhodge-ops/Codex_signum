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
import type { AggregateHealth } from "./aggregation.js";
/**
 * Compute health at every level of the containment hierarchy.
 *
 * Bottom-up walk: deepest containers first, so children are already
 * computed when we reach their parent.
 *
 * @returns Map from nodeId to aggregated health
 */
export declare function computeHierarchicalHealth(): Promise<Map<string, AggregateHealth>>;
/**
 * Compute system-level health — the top of the hierarchy.
 * Aggregates ALL active patterns into a single system health score.
 * This is what the structural review examines for ecosystem-wide ΦL velocity.
 */
export declare function computeSystemHealth(): Promise<AggregateHealth>;
//# sourceMappingURL=hierarchical-health.d.ts.map