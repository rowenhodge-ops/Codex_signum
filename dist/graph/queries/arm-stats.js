// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery } from "../client.js";
// ============ ARM STATS QUERIES ============
/** Compute Thompson Sampling arm stats for a context cluster */
export async function getArmStatsForCluster(clusterId) {
    const result = await runQuery(`MATCH (d:Decision)-[:IN_CONTEXT]->(cc:ContextCluster { id: $clusterId })
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
     ORDER BY avgQuality DESC`, { clusterId }, "READ");
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
//# sourceMappingURL=arm-stats.js.map