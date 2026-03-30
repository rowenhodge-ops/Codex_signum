// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { runQuery } from "../client.js";

// ============ TYPES ============

/** Thompson Sampling arm stats */
export interface ArmStats {
  seedId: string;
  alpha: number; // successes + 1
  beta: number; // failures + 1
  totalTrials: number;
  avgQuality: number;
  avgLatencyMs: number;
  avgCost: number;
  totalCost: number;
}

// ============ TEMPORAL DECAY (M-10.1) ============

/** Default half-life for model-performance context (~2.5 days in ms) */
export const DEFAULT_HALF_LIFE_MS = 216_000_000;

/**
 * Compute temporal decay factor: γ = e^(-λ × Δt) where λ = ln(2) / halfLifeMs.
 * Returns 1.0 when elapsedMs is 0, decays toward 0 as time passes.
 */
export function computeTemporalDecay(halfLifeMs: number, elapsedMs: number): number {
  if (halfLifeMs <= 0) return 0;
  if (elapsedMs <= 0) return 1;
  const lambda = Math.LN2 / halfLifeMs;
  return Math.exp(-lambda * elapsedMs);
}

// ============ DECAY-WEIGHTED POSTERIORS (M-10.1 §5) ============

/** γ-recursive Beta posterior read from node properties */
export interface DecayWeightedPosterior {
  alpha: number;   // weightedSuccesses + 1 (Laplace prior)
  beta: number;    // weightedFailures  + 1 (Laplace prior)
}

/**
 * Read γ-recursive decay-weighted posteriors from a Bloom or Resonator node.
 *
 * Returns Beta(α, β) where α = weightedSuccesses + 1 and β = weightedFailures + 1.
 * Missing node or missing properties → uniform Beta(1, 1).
 *
 * @param bloomId - Node ID (Bloom or Resonator)
 * @param _armId - Reserved for future per-arm decomposition
 */
export async function getDecayWeightedPosteriors(
  bloomId: string,
  _armId?: string,
): Promise<DecayWeightedPosterior> {
  const result = await runQuery(
    `MATCH (n {id: $bloomId})
     WHERE n:Bloom OR n:Resonator
     RETURN COALESCE(n.weightedSuccesses, 0.0) AS ws,
            COALESCE(n.weightedFailures, 0.0) AS wf`,
    { bloomId },
    "READ",
  );

  if (result.records.length === 0) {
    return { alpha: 1, beta: 1 }; // Uniform prior — no node found
  }

  const ws = Number(result.records[0].get("ws"));
  const wf = Number(result.records[0].get("wf"));
  return { alpha: ws + 1, beta: wf + 1 };
}

// ============ ARM STATS QUERIES ============

/** Compute Thompson Sampling arm stats for a context cluster */
export async function getArmStatsForCluster(
  clusterId: string,
): Promise<ArmStats[]> {
  const result = await runQuery(
    `MATCH (d:Decision)-[:IN_CONTEXT]->(cc:ContextCluster { id: $clusterId })
     WHERE d.status = 'completed'
     MATCH (d)-[:ROUTED_TO]->(s:Seed)
     WITH s,
          count(d) AS totalTrials,
          sum(CASE WHEN d.success THEN 1 ELSE 0 END) AS successes,
          sum(CASE WHEN NOT d.success THEN 1 ELSE 0 END) AS failures,
          avg(COALESCE(d.adjustedQuality, d.qualityScore)) AS avgQuality,
         avg(d.durationMs) AS avgLatencyMs,
         avg(COALESCE(d.cost, 0)) AS avgCost,
         sum(COALESCE(d.cost, 0)) AS totalCost
     RETURN s.id AS seedId,
            successes + 1 AS alpha,
            failures + 1 AS beta,
            totalTrials,
            avgQuality,
           avgLatencyMs,
           avgCost,
           totalCost
     ORDER BY avgQuality DESC`,
    { clusterId },
    "READ",
  );
  return result.records.map((r) => ({
    seedId: r.get("seedId"),
    alpha: r.get("alpha"),
    beta: r.get("beta"),
    totalTrials: r.get("totalTrials"),
    avgQuality: r.get("avgQuality"),
    avgLatencyMs: r.get("avgLatencyMs"),
    avgCost: r.get("avgCost"),
    totalCost: r.get("totalCost"),
  }));
}
