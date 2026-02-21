/**
 * Codex Signum — Topology-Aware Dampening
 *
 * When a morpheme degrades, the degradation signal propagates
 * through the graph — but DAMPENED by topology.
 *
 * Formula:
 *   γ_effective = min(0.7, 0.8 / (k - 1))
 *
 * Where k = degree of the receiving node.
 * Highly-connected nodes dampen more (they have more context to absorb shocks).
 *
 * Constitutional constraint: cascade limit = 2 levels max.
 * Recovery is 2.5× slower than degradation (hysteresis).
 *
 * @see engineering-bridge-v2.0.md §Part 3 "Topology-Aware Dampening"
 * @module codex-signum-core/computation/dampening
 */
/** Maximum propagation depth (constitutional constraint) */
export declare const CASCADE_LIMIT = 2;
/** Recovery is this many times slower than degradation */
export declare const HYSTERESIS_RATIO = 2.5;
/**
 * Compute the effective dampening factor for a node.
 *
 * γ_effective = min(0.7, 0.8 / (k - 1))
 *
 * @param degree — Number of connections (k)
 * @returns Dampening factor in [0, MAX_GAMMA]
 */
export declare function computeDampening(degree: number): number;
/**
 * Compute the ΦL impact on a neighbor from a degradation event.
 *
 * impact = γ_effective × degradation_severity
 *
 * Where degradation_severity = previous_phiL - current_phiL (positive for degradation)
 *
 * @param neighborDegree — Degree of the neighbor receiving the signal
 * @param degradationSeverity — Magnitude of ΦL drop (positive number)
 * @param cascadeLevel — Current cascade depth (1-indexed)
 * @returns ΦL reduction to apply to the neighbor, or 0 if cascade limit reached
 */
export declare function computeDegradationImpact(neighborDegree: number, degradationSeverity: number, cascadeLevel: number): number;
/**
 * Compute the ΦL recovery rate for a node.
 * Recovery is 2.5× slower than degradation (hysteresis).
 *
 * recoveryRate = degradationRate / HYSTERESIS_RATIO
 *
 * @param degradationRate — How fast the node degraded (ΦL units / tick)
 * @returns Recovery rate (ΦL units / tick)
 */
export declare function computeRecoveryRate(degradationRate: number): number;
/** A node in the propagation simulation */
export interface PropagationNode {
    id: string;
    phiL: number;
    degree: number;
    neighbors: string[];
}
/** Result of a propagation step */
export interface PropagationResult {
    /** Node ID → new ΦL value */
    updatedPhiL: Map<string, number>;
    /** Number of nodes affected */
    nodesAffected: number;
    /** Maximum cascade depth reached */
    maxCascadeDepth: number;
    /** Whether cascade limit was hit */
    cascadeLimitReached: boolean;
}
/**
 * Propagate a degradation event through the graph.
 *
 * Starts from a source node and propagates outward,
 * respecting cascadeLimit=2 and topology-aware dampening.
 *
 * @param sourceId — The node that degraded
 * @param severity — Magnitude of ΦL drop (positive)
 * @param nodes — Map of all nodes in the graph
 */
export declare function propagateDegradation(sourceId: string, severity: number, nodes: Map<string, PropagationNode>): PropagationResult;
//# sourceMappingURL=dampening.d.ts.map