#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * M-9.5 Task 0: Clean up stale graph nodes from pre-fix pipeline runs.
 *
 * Removes:
 * 1. Stale Seed node for claude-opus-4-1:extended:16k (model retired in M-9.VA-FIX)
 * 2. Stale bloom_architect_* Resonator nodes (phantom nodes from old architectBloomId bug)
 *
 * Safe to run multiple times — matches defensively, reports what was deleted.
 */

import { writeTransaction, closeDriver } from "../src/graph/client.js";

async function main() {
  console.log("=== M-9.5 Stale Node Cleanup ===\n");

  let totalDeleted = 0;

  // 1. Remove stale claude-opus-4-1 Seed node
  try {
    await writeTransaction(async (tx) => {
      const result = await tx.run(
        `MATCH (s:Seed)
         WHERE s.id STARTS WITH 'claude-opus-4-1'
         DETACH DELETE s
         RETURN count(*) AS deleted`,
      );
      const deleted = result.records[0]?.get("deleted") ?? 0;
      if (deleted > 0) {
        console.log(`  [DELETED] ${deleted} stale claude-opus-4-1 Seed node(s)`);
        totalDeleted += deleted;
      } else {
        console.log("  [CLEAN] No claude-opus-4-1 Seed nodes found");
      }
    });
  } catch (err) {
    console.warn("  [WARN] Failed to clean claude-opus-4-1 Seed:", err);
  }

  // 2. Remove stale bloom_architect_* Resonator nodes
  try {
    await writeTransaction(async (tx) => {
      const result = await tx.run(
        `MATCH (r:Resonator)
         WHERE r.id STARTS WITH 'bloom_architect_'
         DETACH DELETE r
         RETURN count(*) AS deleted`,
      );
      const deleted = result.records[0]?.get("deleted") ?? 0;
      if (deleted > 0) {
        console.log(`  [DELETED] ${deleted} stale bloom_architect_* Resonator node(s)`);
        totalDeleted += deleted;
      } else {
        console.log("  [CLEAN] No bloom_architect_* Resonator nodes found");
      }
    });
  } catch (err) {
    console.warn("  [WARN] Failed to clean bloom_architect_* Resonators:", err);
  }

  // 3. Also clean the phantom bloom_architect Bloom node if it still exists
  try {
    await writeTransaction(async (tx) => {
      const result = await tx.run(
        `MATCH (b:Bloom { id: "bloom_architect" })
         DETACH DELETE b
         RETURN count(*) AS deleted`,
      );
      const deleted = result.records[0]?.get("deleted") ?? 0;
      if (deleted > 0) {
        console.log(`  [DELETED] phantom Bloom "bloom_architect" node`);
        totalDeleted += deleted;
      } else {
        console.log('  [CLEAN] No phantom "bloom_architect" Bloom node found');
      }
    });
  } catch (err) {
    console.warn("  [WARN] Failed to clean phantom bloom_architect Bloom:", err);
  }

  console.log(`\n  Total nodes removed: ${totalDeleted}`);
  if (totalDeleted === 0) {
    console.log("  Nothing to clean — graph is already tidy.");
  }

  await closeDriver();
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
