/**
 * Codex Signum — Structural Review Diagnostics (Pure Computation)
 *
 * Five diagnostic computations. Expensive, on-demand — not continuous monitoring.
 * Run when triggers fire. Compute aggregate spectral properties of the full graph.
 *
 * @see codex-signum-v3.0.md §Event-Triggered Structural Review
 * @module codex-signum-core/computation/structural-review
 */
import { buildLaplacian, computeAllEigenvalues, computeFiedlerEigenvalue, computeGraphTotalVariation, } from "./psi-h.js";
import { computeDampening } from "./dampening.js";
// ============ DIAGNOSTICS ============
/**
 * Diagnostic 1: Global λ₂ — algebraic connectivity.
 * Reuses computeFiedlerEigenvalue from psi-h.ts but on the FULL active graph.
 */
export function computeGlobalLambda2(edges, nodeIds) {
    if (nodeIds.length <= 1)
        return 0;
    const nodeIndex = new Map(nodeIds.map((id, i) => [id, i]));
    const n = nodeIds.length;
    const { laplacian } = buildLaplacian(n, edges, nodeIndex);
    return computeFiedlerEigenvalue(laplacian, n);
}
/**
 * Diagnostic 2: Spectral gap = λₙ / λ₂.
 * High spectral gap indicates structural imbalance (tight clusters with loose bridges).
 * Compute ALL eigenvalues and return ratio of largest to second-smallest.
 */
export function computeSpectralGap(edges, nodeIds) {
    if (nodeIds.length <= 1)
        return 0;
    const nodeIndex = new Map(nodeIds.map((id, i) => [id, i]));
    const n = nodeIds.length;
    const { laplacian } = buildLaplacian(n, edges, nodeIndex);
    const eigenvalues = computeAllEigenvalues(laplacian, n);
    eigenvalues.sort((a, b) => a - b);
    // λ₁ ≈ 0 (connected graph), λ₂ is second, λₙ is last
    const lambda2 = eigenvalues.length >= 2 ? Math.max(0, eigenvalues[1]) : 0;
    const lambdaN = eigenvalues.length >= 1 ? eigenvalues[eigenvalues.length - 1] : 0;
    if (lambda2 < 1e-10)
        return Infinity; // Disconnected graph
    return lambdaN / lambda2;
}
/**
 * Diagnostic 3: Hub dependency — nodes whose removal causes largest λ₂ drop.
 * O(n × eigenvalue_computation). Expensive but on-demand.
 */
export function computeHubDependencies(edges, nodeIds, globalLambda2, topK = 5) {
    if (nodeIds.length <= 2 || globalLambda2 <= 0)
        return [];
    const results = [];
    // Compute degree for each node
    const degreeMap = new Map();
    for (const id of nodeIds)
        degreeMap.set(id, 0);
    for (const edge of edges) {
        degreeMap.set(edge.from, (degreeMap.get(edge.from) ?? 0) + 1);
        degreeMap.set(edge.to, (degreeMap.get(edge.to) ?? 0) + 1);
    }
    // Sort by degree descending — high-degree nodes are most likely to be critical hubs.
    // Only test top candidates to limit O(n × eigenvalue) cost.
    const candidateCount = Math.min(nodeIds.length, topK * 2);
    const sortedByDegree = [...nodeIds].sort((a, b) => (degreeMap.get(b) ?? 0) - (degreeMap.get(a) ?? 0));
    const candidates = sortedByDegree.slice(0, candidateCount);
    for (const nodeId of candidates) {
        // Remove node and its edges
        const remainingIds = nodeIds.filter((id) => id !== nodeId);
        if (remainingIds.length <= 1)
            continue;
        const remainingEdges = edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
        const lambda2Without = computeGlobalLambda2(remainingEdges, remainingIds);
        const lambda2Drop = Math.max(0, globalLambda2 - lambda2Without);
        results.push({
            nodeId,
            degree: degreeMap.get(nodeId) ?? 0,
            lambda2WithoutNode: lambda2Without,
            lambda2Drop,
            criticality: globalLambda2 > 0 ? lambda2Drop / globalLambda2 : 0,
        });
    }
    // Sort by criticality (highest first), return top K
    results.sort((a, b) => b.criticality - a.criticality);
    return results.slice(0, topK);
}
/**
 * Diagnostic 4: Friction distribution across all active compositions.
 * Global TV_G + per-edge breakdown + statistical summary + top hotspots.
 */
export function computeFrictionDistribution(edges, nodeHealths, topHotspots = 10) {
    const nodeIndex = new Map(nodeHealths.map((n, i) => [n.id, i]));
    const globalFriction = computeGraphTotalVariation(edges, nodeIndex, nodeHealths);
    // Build per-edge friction values
    const phiLMap = new Map(nodeHealths.map((nh) => [nh.id, nh.phiL]));
    const edgeFrictions = [];
    for (const edge of edges) {
        const phiI = phiLMap.get(edge.from) ?? 0.5;
        const phiJ = phiLMap.get(edge.to) ?? 0.5;
        const friction = Math.abs(phiI - phiJ);
        edgeFrictions.push({ from: edge.from, to: edge.to, friction });
    }
    // Sort by friction descending for hotspots
    edgeFrictions.sort((a, b) => b.friction - a.friction);
    const hotspots = edgeFrictions.slice(0, topHotspots);
    // Statistics
    const frictionValues = edgeFrictions.map((e) => e.friction);
    const stats = computeStats(frictionValues);
    return { globalFriction, hotspots, stats };
}
/**
 * Diagnostic 5: Dampening assessment — is current γ appropriate?
 * Flag nodes where γ > 0.5 with degree > 3 (potential over-propagation risk).
 */
export function assessDampening(edges, nodeIds) {
    // Compute degree for each node
    const degreeMap = new Map();
    for (const id of nodeIds)
        degreeMap.set(id, 0);
    for (const edge of edges) {
        degreeMap.set(edge.from, (degreeMap.get(edge.from) ?? 0) + 1);
        degreeMap.set(edge.to, (degreeMap.get(edge.to) ?? 0) + 1);
    }
    const riskNodes = [];
    let totalGamma = 0;
    for (const nodeId of nodeIds) {
        const degree = degreeMap.get(nodeId) ?? 0;
        const currentGamma = computeDampening(degree);
        totalGamma += currentGamma;
        // Risk: high γ on a well-connected node can over-propagate
        if (currentGamma > 0.5 && degree > 3) {
            // Recommended: scale down more aggressively for high-degree nodes
            const recommendedGamma = Math.min(0.5, 0.8 / (degree - 1));
            riskNodes.push({ nodeId, degree, currentGamma, recommendedGamma });
        }
    }
    const meanGamma = nodeIds.length > 0 ? totalGamma / nodeIds.length : 0;
    const adequate = riskNodes.length === 0;
    return { adequate, riskNodes, meanGamma };
}
/**
 * Run all 5 diagnostics and return the combined result.
 */
export function runStructuralReview(edges, nodeHealths, triggers) {
    const nodeIds = nodeHealths.map((n) => n.id);
    const globalLambda2 = computeGlobalLambda2(edges, nodeIds);
    const spectralGap = computeSpectralGap(edges, nodeIds);
    const hubDependencies = computeHubDependencies(edges, nodeIds, globalLambda2);
    const frictionDistribution = computeFrictionDistribution(edges, nodeHealths);
    const dampeningAssessment = assessDampening(edges, nodeIds);
    return {
        computedAt: new Date(),
        triggers,
        globalLambda2,
        spectralGap,
        hubDependencies,
        frictionDistribution,
        dampeningAssessment,
    };
}
// ============ HELPERS ============
function computeStats(values) {
    if (values.length === 0)
        return { mean: 0, median: 0, stddev: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const stddev = Math.sqrt(variance);
    return { mean, median, stddev };
}
//# sourceMappingURL=structural-review.js.map