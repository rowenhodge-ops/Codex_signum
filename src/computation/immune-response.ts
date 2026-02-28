// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

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
import type { TriggerInputState, TriggeredEvent } from "./structural-triggers.js";
import { runStructuralReview } from "./structural-review.js";
import type { StructuralReviewResult } from "./structural-review.js";
import { getPatternAdjacency, getPatternsWithHealth } from "../graph/queries.js";
import type { GraphEdge, NodeHealth } from "./psi-h.js";

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
export async function evaluateAndReviewIfNeeded(
  state: TriggerInputState,
): Promise<{
  triggers: TriggeredEvent[];
  review: StructuralReviewResult;
} | null> {
  // Step 1: Check all trigger conditions
  const triggers = checkStructuralTriggers(state);

  // Step 2: If no triggers → system is healthy, no review needed
  if (triggers.length === 0) return null;

  // Step 3: Triggers fired — fetch graph data and run diagnostics
  const adjacency = await getPatternAdjacency();
  const patternsWithHealth = await getPatternsWithHealth();

  // Convert to GraphEdge[] and NodeHealth[]
  const edges: GraphEdge[] = adjacency.map((a) => ({
    from: a.from,
    to: a.to,
    weight: a.weight,
  }));

  const nodeHealths: NodeHealth[] = patternsWithHealth.map((p) => ({
    id: p.id,
    phiL: p.phiL,
  }));

  // Step 4: Run full structural review
  const review = runStructuralReview(
    edges,
    nodeHealths,
    triggers.map((t) => t.trigger),
  );

  return { triggers, review };
}
