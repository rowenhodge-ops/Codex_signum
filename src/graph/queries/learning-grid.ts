// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Learning Grid queries — ring buffer enforcement for bounded observation Grids.
 *
 * M-10.3: LLM Bloom Reclassification — each LLM Bloom contains a Learning Grid
 * with a ~50 Seed cap. Oldest Seeds get the :Archived label when exceeded.
 *
 * @module codex-signum-core/graph/queries/learning-grid
 */

import { readTransaction } from "../client.js";
import { updateMorpheme } from "../instantiation.js";

/**
 * Enforce ring buffer on a Learning Grid by archiving oldest Seeds
 * when the non-archived count exceeds maxSeeds.
 *
 * Uses updateMorpheme() with addLabels: ['Archived'] — the only
 * mutation path allowed by the Instantiation Protocol.
 *
 * @param gridId - The Grid node ID to enforce
 * @param maxSeeds - Maximum non-archived Seeds allowed (default 50)
 * @returns Count of Seeds archived in this call
 */
export async function enforceGridRingBuffer(
  gridId: string,
  maxSeeds: number = 50,
): Promise<{ archived: number }> {
  // Step 1: Find non-archived Seed children ordered by createdAt ASC
  const seeds = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (g {id: $gridId})-[:CONTAINS]->(s:Seed)
       WHERE NOT s:Archived
       RETURN s.id AS id, s.createdAt AS createdAt
       ORDER BY s.createdAt ASC`,
      { gridId },
    );
    return res.records.map((r) => ({
      id: r.get("id") as string,
      createdAt: r.get("createdAt"),
    }));
  });

  // Step 2: If within limit, no-op
  if (seeds.length <= maxSeeds) {
    return { archived: 0 };
  }

  // Step 3: Archive the oldest (count - maxSeeds) Seeds
  const toArchive = seeds.slice(0, seeds.length - maxSeeds);
  let archived = 0;

  for (const seed of toArchive) {
    const result = await updateMorpheme(seed.id, {}, undefined, ["Archived"]);
    if (result.success) {
      archived++;
    }
  }

  return { archived };
}
