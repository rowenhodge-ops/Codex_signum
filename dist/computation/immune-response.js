/**
 * Codex Signum — Immune Response Orchestration
 *
 * Wires triggers to diagnostics. This is the entry point consumers call.
 * Check triggers → if any fire → run expensive structural review.
 *
 * @see codex-signum-v3.0.md §Event-Triggered Structural Review
 * @module codex-signum-core/computation/immune-response
 */
import { checkStructuralTriggers } from "./structural-triggers.js";
import { runStructuralReview } from "./structural-review.js";
import { getPatternAdjacency, getPatternsWithHealth } from "../graph/queries.js";
/**
 * The immune response: check triggers, run review if needed.
 *
 * Usage:
 * ```
 * const result = await evaluateAndReviewIfNeeded(triggerState);
 * if (result) {
 *   // structural issues detected — result contains diagnostics
 *   // feed into Scale 2/3 feedback topology
 * }
 * ```
 *
 * @param state — Current trigger input values (caller assembles from live system)
 * @returns StructuralReviewResult if any trigger fired, null if system is healthy
 */
export async function evaluateAndReviewIfNeeded(state) {
    // Step 1: Check all trigger conditions
    const triggers = checkStructuralTriggers(state);
    // Step 2: If no triggers → system is healthy, no review needed
    if (triggers.length === 0)
        return null;
    // Step 3: Triggers fired — fetch graph data and run diagnostics
    const adjacency = await getPatternAdjacency();
    const patternsWithHealth = await getPatternsWithHealth();
    // Convert to GraphEdge[] and NodeHealth[]
    const edges = adjacency.map((a) => ({
        from: a.from,
        to: a.to,
        weight: a.weight,
    }));
    const nodeHealths = patternsWithHealth.map((p) => ({
        id: p.id,
        phiL: p.phiL,
    }));
    // Step 4: Run full structural review
    const review = runStructuralReview(edges, nodeHealths, triggers.map((t) => t.trigger));
    return { triggers, review };
}
//# sourceMappingURL=immune-response.js.map