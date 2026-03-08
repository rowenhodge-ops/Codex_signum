// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery, writeTransaction } from "../client.js";

// ============ TYPES ============

/** Properties for recording an Observation */
export interface ObservationProps {
  id: string;
  sourceBloomId: string;
  metric: string;
  value: number;
  unit?: string;
  context?: string;
}

// ============ OBSERVATION QUERIES ============

export async function recordObservation(
  props: ObservationProps,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `CREATE (o:Observation {
         id: $id,
         metric: $metric,
         value: $value,
         unit: $unit,
         context: $context,
         timestamp: datetime(),
         retained: true
       })
       WITH o
       MATCH (b:Bloom { id: $sourceBloomId })
       MERGE (o)-[:OBSERVED_IN]->(b)
       SET b.observationCount = coalesce(b.observationCount, 0) + 1`,
      {
        ...props,
        unit: props.unit ?? null,
        context: props.context ?? null,
      },
    );
  });
}

/** Get observations for ΦL computation — recent, for a given bloom */
export async function getObservationsForBloom(
  bloomId: string,
  limit: number = 50,
): Promise<Neo4jRecord[]> {
  const result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN o
     ORDER BY o.timestamp DESC
     LIMIT $limit`,
    { bloomId, limit },
    "READ",
  );
  return result.records;
}

/** Count observations for maturity calculation */
export async function countObservationsForBloom(
  bloomId: string,
): Promise<number> {
  const result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN count(o) AS count`,
    { bloomId },
    "READ",
  );
  return result.records[0]?.get("count") ?? 0;
}

// ============ MEMORY PERSISTENCE QUERIES (M-9.4) ============

/**
 * Fetch observations for a bloom in the shape that identifyCompactable() needs.
 * Returns CompactableObservation-shaped data: id, timestamp, signalProcessed,
 * and list of distillation IDs that include this observation via DISTILLED_FROM.
 */
export async function getCompactableObservations(
  bloomId: string,
  limit: number = 500,
): Promise<
  Array<{
    id: string;
    timestamp: Date;
    signalProcessed: boolean;
    includedInDistillationIds: string[];
  }>
> {
  const result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     OPTIONAL MATCH (di:Distillation)-[:DISTILLED_FROM]->(o)
     WITH o, collect(di.id) AS distillationIds
     RETURN o.id AS id,
            o.timestamp AS timestamp,
            coalesce(o.signalProcessed, false) AS signalProcessed,
            distillationIds
     ORDER BY o.timestamp ASC
     LIMIT $limit`,
    { bloomId, limit },
    "READ",
  );
  return result.records.map((r) => ({
    id: r.get("id"),
    timestamp: new Date(r.get("timestamp")),
    signalProcessed: r.get("signalProcessed"),
    includedInDistillationIds: r.get("distillationIds").filter((id: unknown) => id != null),
  }));
}

/**
 * Bulk-delete observations by ID list. Used after identifyCompactable()
 * returns the safe-to-remove IDs. DETACH DELETE removes both the node
 * and its relationships.
 */
export async function deleteObservations(
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const result = await writeTransaction(async (tx) => {
    return tx.run(
      `MATCH (o:Observation)
       WHERE o.id IN $ids
       DETACH DELETE o
       RETURN count(*) AS deleted`,
      { ids },
    );
  });
  return result.records[0]?.get("deleted") ?? 0;
}

/**
 * Fetch observations for a bloom with fields needed by distillPerformanceProfile()
 * and distillRoutingHints(). Returns the full observation data — callers map to
 * the specific PerformanceObservation or RoutingObservation shape.
 */
export async function getObservationsForDistillation(
  bloomId: string,
  limit: number = 500,
): Promise<
  Array<{
    id: string;
    timestamp: Date;
    success: boolean;
    qualityScore: number | null;
    durationMs: number | null;
    modelUsed: string | null;
    failureSignature: string | null;
    context: string | null;
  }>
> {
  const result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
     WHERE o.retained = true
     RETURN o.id AS id,
            o.timestamp AS timestamp,
            coalesce(o.success, true) AS success,
            o.qualityScore AS qualityScore,
            o.durationMs AS durationMs,
            o.modelUsed AS modelUsed,
            o.failureSignature AS failureSignature,
            o.context AS context
     ORDER BY o.timestamp ASC
     LIMIT $limit`,
    { bloomId, limit },
    "READ",
  );
  return result.records.map((r) => ({
    id: r.get("id"),
    timestamp: new Date(r.get("timestamp")),
    success: r.get("success"),
    qualityScore: r.get("qualityScore"),
    durationMs: r.get("durationMs"),
    modelUsed: r.get("modelUsed"),
    failureSignature: r.get("failureSignature"),
    context: r.get("context"),
  }));
}

// ============ BACKWARD COMPATIBILITY (remove in M-8) ============

/** @deprecated Use getObservationsForBloom */
export const getObservationsForPattern = getObservationsForBloom;
/** @deprecated Use countObservationsForBloom */
export const countObservationsForPattern = countObservationsForBloom;
