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
/** Noise gate: only propagate ΦL changes larger than this threshold */
export declare const PHI_L_PROPAGATION_NOISE_GATE = 0.01;
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
export declare function propagatePhiLUpward(bloomId: string, previousPhiL: number, newPhiL: number, cascadeDepth?: number): Promise<void>;
//# sourceMappingURL=hierarchical-health.d.ts.map