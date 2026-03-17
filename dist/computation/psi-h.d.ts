/**
 * Codex Signum — ΨH Computation (Harmonic Signature)
 *
 * ΨH is relational coherence. Two components:
 *
 * 1. Structural Coherence (λ₂) — Fiedler eigenvalue of graph Laplacian
 *    Near 0 = fragile. High = robust. Computed from graph adjacency.
 *
 * 2. Runtime Friction (TV_G) — Graph Total Variation
 *    How "smooth" are ΦL values across connected nodes?
 *    Low = resonant (neighbors agree). High = dissonant (neighbors disagree).
 *
 * Combined: 0.4 × normalize(λ₂) + 0.6 × (1 - friction)
 * Runtime friction weighted higher — reflects actual operational coherence.
 *
 * @see codex-signum-v3.0.md §ΨH
 * @see engineering-bridge-v2.0.md §Part 2 "ΨH"
 * @module codex-signum-core/computation/psi-h
 */
import type { PsiH, PsiHDecomposition, PsiHState } from "../types/state-dimensions.js";
/** An edge in the adjacency representation */
export interface GraphEdge {
    from: string;
    to: string;
    weight: number;
}
/** A node with its ΦL value */
export interface NodeHealth {
    id: string;
    phiL: number;
}
/**
 * Create a default PsiHState for a new Bloom.
 * Uses intermediate window size (40) and default EWMA alpha (0.15).
 */
export declare function createDefaultPsiHState(): PsiHState;
/**
 * Compute ΨH from graph structure and ΦL signals.
 *
 * @param edges — Adjacency list of the pattern graph
 * @param nodeHealths — ΦL values for each node
 * @returns Complete PsiH structure
 */
export declare function computePsiH(edges: GraphEdge[], nodeHealths: NodeHealth[]): PsiH;
/**
 * Build the graph Laplacian matrix L = D - A.
 * D = degree matrix (diagonal), A = weighted adjacency.
 *
 * Returns a flat array representing the n×n matrix (row-major).
 */
export declare function buildLaplacian(n: number, edges: GraphEdge[], nodeIndex: Map<string, number>): {
    laplacian: Float64Array;
    degrees: Float64Array;
};
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
export declare function computeFiedlerEigenvalue(laplacian: Float64Array, n: number, maxIterations?: number, tolerance?: number): number;
/**
 * Compute all eigenvalues of a symmetric matrix using Jacobi eigenvalue algorithm.
 *
 * Robust for small symmetric matrices. O(n³) per sweep, typically 5-10 sweeps.
 */
export declare function computeAllEigenvalues(matrix: Float64Array, n: number, maxSweeps?: number): number[];
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
export declare function computeGraphTotalVariation(edges: GraphEdge[], nodeIndex: Map<string, number>, nodeHealths: NodeHealth[]): number;
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
export declare function decomposePsiH(state: PsiHState, psiH_instant: number): {
    decomposition: PsiHDecomposition;
    updatedState: PsiHState;
};
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
export declare function computePsiHWithState(edges: GraphEdge[], nodeHealths: NodeHealth[], state: PsiHState): {
    psiH: PsiH;
    decomposition: PsiHDecomposition;
    updatedState: PsiHState;
};
//# sourceMappingURL=psi-h.d.ts.map