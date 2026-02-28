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