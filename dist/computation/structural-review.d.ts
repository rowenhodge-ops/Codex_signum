/**
 * Codex Signum — Structural Review Diagnostics (Pure Computation)
 *
 * Five diagnostic computations. Expensive, on-demand — not continuous monitoring.
 * Run when triggers fire. Compute aggregate spectral properties of the full graph.
 *
 * @see codex-signum-v3.0.md §Event-Triggered Structural Review
 * @module codex-signum-core/computation/structural-review
 */
import { type GraphEdge, type NodeHealth } from "./psi-h.js";
export interface StructuralReviewResult {
    /** When this review was computed */
    computedAt: Date;
    /** Which triggers caused this review */
    triggers: string[];
    /** Diagnostic 1: algebraic connectivity of the full active graph */
    globalLambda2: number;
    /** Diagnostic 2: λₙ / λ₂ — structural balance. High = imbalanced */
    spectralGap: number;
    /** Diagnostic 3: nodes whose removal causes largest λ₂ drop */
    hubDependencies: HubDependency[];
    /** Diagnostic 4: TV_G across all active compositions */
    frictionDistribution: FrictionDistribution;
    /** Diagnostic 5: whether current γ is appropriate for actual topology */
    dampeningAssessment: DampeningAssessment;
}
export interface HubDependency {
    nodeId: string;
    degree: number;
    /** λ₂ of the graph with this node removed */
    lambda2WithoutNode: number;
    /** How much λ₂ drops when this node is removed (absolute) */
    lambda2Drop: number;
    /** Criticality: lambda2Drop / globalLambda2 */
    criticality: number;
}
export interface FrictionDistribution {
    /** Overall TV_G across the full graph */
    globalFriction: number;
    /** Top friction hotspots: edges with highest |ΦL_i - ΦL_j| */
    hotspots: Array<{
        from: string;
        to: string;
        friction: number;
    }>;
    /** Mean, median, stddev of per-edge friction */
    stats: {
        mean: number;
        median: number;
        stddev: number;
    };
}
export interface DampeningAssessment {
    /** Whether current cascade safety is adequate */
    adequate: boolean;
    /** Nodes where γ_effective may be too high (risk of over-propagation) */
    riskNodes: Array<{
        nodeId: string;
        degree: number;
        currentGamma: number;
        recommendedGamma: number;
    }>;
    /** Mean γ across all nodes */
    meanGamma: number;
}
/**
 * Diagnostic 1: Global λ₂ — algebraic connectivity.
 * Reuses computeFiedlerEigenvalue from psi-h.ts but on the FULL active graph.
 */
export declare function computeGlobalLambda2(edges: GraphEdge[], nodeIds: string[]): number;
/**
 * Diagnostic 2: Spectral gap = λₙ / λ₂.
 * High spectral gap indicates structural imbalance (tight clusters with loose bridges).
 * Compute ALL eigenvalues and return ratio of largest to second-smallest.
 */
export declare function computeSpectralGap(edges: GraphEdge[], nodeIds: string[]): number;
/**
 * Diagnostic 3: Hub dependency — nodes whose removal causes largest λ₂ drop.
 * O(n × eigenvalue_computation). Expensive but on-demand.
 */
export declare function computeHubDependencies(edges: GraphEdge[], nodeIds: string[], globalLambda2: number, topK?: number): HubDependency[];
/**
 * Diagnostic 4: Friction distribution across all active compositions.
 * Global TV_G + per-edge breakdown + statistical summary + top hotspots.
 */
export declare function computeFrictionDistribution(edges: GraphEdge[], nodeHealths: NodeHealth[], topHotspots?: number): FrictionDistribution;
/**
 * Diagnostic 5: Dampening assessment — is current γ appropriate?
 * Flag nodes where γ > 0.5 with degree > 3 (potential over-propagation risk).
 */
export declare function assessDampening(edges: GraphEdge[], nodeIds: string[]): DampeningAssessment;
/**
 * Run all 5 diagnostics and return the combined result.
 */
export declare function runStructuralReview(edges: GraphEdge[], nodeHealths: NodeHealth[], triggers: string[]): StructuralReviewResult;
//# sourceMappingURL=structural-review.d.ts.map