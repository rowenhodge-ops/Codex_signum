// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { PSI_H_WEIGHTS } from "../types/state-dimensions.js";
// ============ FACTORY ============
/**
 * Create a default PsiHState for a new Bloom.
 * Uses intermediate window size (40) and default EWMA alpha (0.15).
 */
export function createDefaultPsiHState() {
    return {
        ringBuffer: [],
        maxSize: 40,
        alpha: 0.15,
        trend: undefined,
        baseline: undefined,
    };
}
// ============ CORE COMPUTATION ============
/**
 * Compute ΨH from graph structure and ΦL signals.
 *
 * @param edges — Adjacency list of the pattern graph
 * @param nodeHealths — ΦL values for each node
 * @returns Complete PsiH structure
 */
export function computePsiH(edges, nodeHealths) {
    if (nodeHealths.length === 0) {
        return {
            lambda2: 0,
            friction: 1,
            combined: 0,
            computedAt: new Date(),
        };
    }
    if (nodeHealths.length === 1) {
        return {
            lambda2: 0,
            friction: 0,
            combined: PSI_H_WEIGHTS.runtime, // No friction for singleton
            computedAt: new Date(),
        };
    }
    // Build node index map
    const nodeIds = nodeHealths.map((n) => n.id);
    const nodeIndex = new Map(nodeIds.map((id, i) => [id, i]));
    const n = nodeIds.length;
    // Build adjacency + degree matrix
    const { laplacian } = buildLaplacian(n, edges, nodeIndex);
    // Compute λ₂ (Fiedler eigenvalue)
    const lambda2 = computeFiedlerEigenvalue(laplacian, n);
    // Compute Graph Total Variation
    const friction = computeGraphTotalVariation(edges, nodeIndex, nodeHealths);
    // Normalise λ₂ to [0, 1]
    // Theoretical max for n nodes is n (complete graph). Use pragmatic ceiling.
    const lambda2Normalized = Math.min(1, lambda2 / Math.max(n, 2));
    // Combined score
    const combined = PSI_H_WEIGHTS.structural * lambda2Normalized +
        PSI_H_WEIGHTS.runtime * (1 - friction);
    return {
        lambda2,
        friction,
        combined,
        computedAt: new Date(),
    };
}
// ============ GRAPH LAPLACIAN ============
/**
 * Build the graph Laplacian matrix L = D - A.
 * D = degree matrix (diagonal), A = weighted adjacency.
 *
 * Returns a flat array representing the n×n matrix (row-major).
 */
export function buildLaplacian(n, edges, nodeIndex) {
    const laplacian = new Float64Array(n * n); // zero-initialized
    const degrees = new Float64Array(n);
    for (const edge of edges) {
        const i = nodeIndex.get(edge.from);
        const j = nodeIndex.get(edge.to);
        if (i === undefined || j === undefined)
            continue;
        const w = Math.abs(edge.weight) || 1;
        // Adjacency (off-diagonal, negative in Laplacian)
        laplacian[i * n + j] -= w;
        laplacian[j * n + i] -= w;
        // Degree (diagonal)
        degrees[i] += w;
        degrees[j] += w;
    }
    // Set diagonal to degree sum
    for (let k = 0; k < n; k++) {
        laplacian[k * n + k] = degrees[k];
    }
    return { laplacian, degrees };
}
// ============ FIEDLER EIGENVALUE (λ₂) ============
/**
 * Compute the second-smallest eigenvalue of the Laplacian (Fiedler value).
 *
 * Uses inverse power iteration with deflation against the known
 * smallest eigenvector (constant vector, eigenvalue 0).
 *
 * For small graphs (<50 nodes) this converges quickly.
 * At scale, a proper sparse solver (e.g., ARPACK) should replace this.
 *
 * @param laplacian — n×n Laplacian matrix (row-major Float64Array)
 * @param n — Number of nodes
 * @param maxIterations — Maximum power iterations
 * @param tolerance — Convergence threshold
 */
export function computeFiedlerEigenvalue(laplacian, n, maxIterations = 200, tolerance = 1e-8) {
    if (n <= 1)
        return 0;
    if (n === 2) {
        // For 2-node graph, λ₂ = trace / n or directly from Laplacian
        return laplacian[0]; // Both diagonal elements equal for undirected
    }
    // Power iteration for smallest *non-trivial* eigenvalue.
    // We use shifted inverse iteration: find λ₂ by iterating on (L + σI)^(-1)
    // with deflation of the trivial eigenvector.
    // For simplicity and correctness at small scale, use QR-like approach:
    // Compute all eigenvalues and pick the second smallest.
    // This is O(n³) but n < 50 is the expected scale.
    const eigenvalues = computeAllEigenvalues(laplacian, n);
    eigenvalues.sort((a, b) => a - b);
    // λ₁ ≈ 0 (connected graph), λ₂ is what we want
    return eigenvalues.length >= 2 ? Math.max(0, eigenvalues[1]) : 0;
}
/**
 * Compute all eigenvalues of a symmetric matrix using Jacobi eigenvalue algorithm.
 *
 * Robust for small symmetric matrices. O(n³) per sweep, typically 5-10 sweeps.
 */
export function computeAllEigenvalues(matrix, n, maxSweeps = 50) {
    // Work on a copy
    const A = new Float64Array(matrix);
    for (let sweep = 0; sweep < maxSweeps; sweep++) {
        // Find largest off-diagonal element
        let maxOffDiag = 0;
        let p = 0;
        let q = 1;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const absVal = Math.abs(A[i * n + j]);
                if (absVal > maxOffDiag) {
                    maxOffDiag = absVal;
                    p = i;
                    q = j;
                }
            }
        }
        // Convergence check
        if (maxOffDiag < 1e-12)
            break;
        // Compute Jacobi rotation
        const app = A[p * n + p];
        const aqq = A[q * n + q];
        const apq = A[p * n + q];
        const theta = (aqq - app) / (2 * apq);
        const t = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(1 + t * t);
        const s = t * c;
        // Apply rotation
        A[p * n + p] = app - t * apq;
        A[q * n + q] = aqq + t * apq;
        A[p * n + q] = 0;
        A[q * n + p] = 0;
        for (let r = 0; r < n; r++) {
            if (r === p || r === q)
                continue;
            const arp = A[r * n + p];
            const arq = A[r * n + q];
            A[r * n + p] = c * arp - s * arq;
            A[p * n + r] = A[r * n + p];
            A[r * n + q] = s * arp + c * arq;
            A[q * n + r] = A[r * n + q];
        }
    }
    // Extract diagonal (eigenvalues)
    const eigenvalues = [];
    for (let i = 0; i < n; i++) {
        eigenvalues.push(A[i * n + i]);
    }
    return eigenvalues;
}
// ============ GRAPH TOTAL VARIATION ============
/**
 * Compute Graph Total Variation (signal smoothness).
 *
 * TV_G = (1/|E|) × Σ_{(i,j)∈E} |f(i) - f(j)|
 *
 * Where f is the ΦL signal on nodes.
 * Normalised so TV_G ∈ [0, 1] (since ΦL ∈ [0, 1]).
 *
 * Low TV_G (<0.2) = resonant — neighbors have similar health.
 * High TV_G (>0.8) = dissonant — neighbors disagree on health.
 */
export function computeGraphTotalVariation(edges, nodeIndex, nodeHealths) {
    if (edges.length === 0)
        return 0;
    // Build ΦL lookup
    const phiLMap = new Map(nodeHealths.map((nh) => [nodeIndex.get(nh.id), nh.phiL]));
    let totalVariation = 0;
    let edgeCount = 0;
    for (const edge of edges) {
        const i = nodeIndex.get(edge.from);
        const j = nodeIndex.get(edge.to);
        if (i === undefined || j === undefined)
            continue;
        const phiI = phiLMap.get(i) ?? 0.5;
        const phiJ = phiLMap.get(j) ?? 0.5;
        totalVariation += Math.abs(phiI - phiJ) * (edge.weight || 1);
        edgeCount++;
    }
    if (edgeCount === 0)
        return 0;
    // Normalise: max possible variation is 1.0 per edge (if ΦL range is [0,1])
    return Math.min(1, totalVariation / edgeCount);
}
// ============ STATEFUL TEMPORAL DECOMPOSITION ============
/** Minimum observations before baseline is established */
const BASELINE_MIN_OBSERVATIONS = 5;
/**
 * Decompose ΨH into transient and durable friction components.
 *
 * Stateless equivalent of DND-Manager's HarmonicResonance EWMA decomposition.
 * The caller owns and persists the PsiHState between runs.
 *
 * - psiH_instant: current point-in-time combined value
 * - psiH_trend: EWMA-smoothed trend (α=state.alpha, default 0.15)
 * - friction_transient: |instant - trend| (short-term deviation)
 * - friction_durable: |trend - baseline| (long-term drift)
 *
 * @param state — Current PsiHState
 * @param psiH_instant — Current ΨH combined value
 * @returns { decomposition, updatedState }
 */
export function decomposePsiH(state, psiH_instant) {
    // Clone ring buffer (immutable update)
    const ringBuffer = [...state.ringBuffer, psiH_instant];
    if (ringBuffer.length > state.maxSize) {
        ringBuffer.shift();
    }
    // Compute EWMA trend
    const prevTrend = state.trend ?? psiH_instant;
    const psiH_trend = state.alpha * psiH_instant + (1 - state.alpha) * prevTrend;
    // Transient friction: deviation of instant from trend
    const friction_transient = Math.abs(psiH_instant - psiH_trend);
    // Durable friction: how far the trend has shifted from baseline
    let baseline = state.baseline;
    if (baseline === undefined && ringBuffer.length >= BASELINE_MIN_OBSERVATIONS) {
        baseline = psiH_trend;
    }
    const friction_durable = baseline !== undefined
        ? Math.abs(psiH_trend - baseline)
        : 0;
    const updatedState = {
        ...state,
        ringBuffer,
        trend: psiH_trend,
        baseline,
    };
    return {
        decomposition: {
            psiH_instant,
            psiH_trend,
            friction_transient,
            friction_durable,
        },
        updatedState,
    };
}
/**
 * Compute ΨH with integrated temporal decomposition state management.
 *
 * Wraps `computePsiH` with EWMA trend tracking and friction classification.
 * The caller provides a PsiHState; the function returns the updated state
 * alongside both the raw PsiH and its temporal decomposition.
 *
 * @param edges — Graph adjacency
 * @param nodeHealths — ΦL values for each node
 * @param state — Current PsiHState for temporal decomposition
 * @returns { psiH, decomposition, updatedState }
 */
export function computePsiHWithState(edges, nodeHealths, state) {
    const psiH = computePsiH(edges, nodeHealths);
    const { decomposition, updatedState } = decomposePsiH(state, psiH.combined);
    return { psiH, decomposition, updatedState };
}
//# sourceMappingURL=psi-h.js.map