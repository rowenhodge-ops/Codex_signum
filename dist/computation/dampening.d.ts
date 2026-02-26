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
 * Safety budget for budget-capped dampening.
 * γ_effective(k) = min(γ_base, SAFETY_BUDGET / k)
 * Guarantees μ = k × γ ≤ SAFETY_BUDGET < 1 for all k ≥ 1.
 */
export declare const SAFETY_BUDGET = 0.8;
/** ΦL threshold for algedonic bypass — existential threat escalation */
export declare const ALGEDONIC_THRESHOLD = 0.1;
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
 * Budget-capped effective dampening (Engineering Bridge §Part 3, Phase 3 correction).
 *
 * γ_effective(k) = min(γ_base, SAFETY_BUDGET / k)
 *
 * This replaces the previous √k hub formula, which produced supercritical cascades
 * (spectral radius μ = k × γ > 1) for branching factor k ≥ 3.
 *
 * Budget-capped guarantees μ ≤ SAFETY_BUDGET = 0.8 < 1 for ALL k ≥ 1:
 *   k=1:  min(0.7, 0.8/1)  = 0.7   μ = 0.7
 *   k=2:  min(0.7, 0.8/2)  = 0.4   μ = 0.8
 *   k=5:  min(0.7, 0.8/5)  = 0.16  μ = 0.8
 *   k=10: min(0.7, 0.8/10) = 0.08  μ = 0.8
 *
 * @param k — Number of connections (degree)
 * @param gammaBase — Base dampening cap (default MAX_GAMMA = 0.7)
 * @returns Effective dampening factor
 */
export declare function computeGammaEffective(k: number, gammaBase?: number): number;
/**
 * Hub dampening — deprecated, routes to computeGammaEffective.
 *
 * The √k formula caused supercritical cascades for k ≥ 3.
 * Use computeGammaEffective() directly.
 *
 * @deprecated Use computeGammaEffective(degree, gammaBase) instead.
 */
export declare function computeHubDampening(degree: number, gammaBase?: number): number;
/**
 * Algedonic bypass check (Engineering Bridge §Part 3).
 *
 * Any component with ΦL < 0.1 is an existential threat.
 * Signal propagates to root with γ = 1.0, bypassing all dampening.
 *
 * @param componentPhiL — The ΦL of the degrading component
 * @returns { gamma: 1.0, bypassed: true } if bypass triggered, else { gamma, bypassed: false }
 */
export declare function checkAlgedonicBypass(componentPhiL: number): {
    gamma: number;
    bypassed: boolean;
};
/**
 * Recovery delay model (Engineering Bridge §Part 3).
 *
 * recovery_delay = base_delay × (1 + 0.2 × failure_count)
 * capped at: 10 × base_delay
 *
 * @param baseDelayMs — Base delay in milliseconds
 * @param failureCount — Number of prior failures
 * @returns Recovery delay in milliseconds
 */
export declare function computeRecoveryDelay(baseDelayMs: number, failureCount: number): number;
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
    /** Whether algedonic bypass was triggered (ΦL < 0.1) */
    algedonicBypass: boolean;
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