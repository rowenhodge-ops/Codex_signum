#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Migration: Convert string timestamps to Neo4j native datetime() types.
 *
 * Idempotent — datetime() on an already-native value passes through unchanged.
 * Safe to run multiple times.
 *
 * Usage: npx tsx scripts/migrate-temporal-types.ts
 */

import { writeTransaction, closeDriver } from "../src/graph/client.js";

interface MigrationTarget {
  label: string;
  properties: string[];
}

const TARGETS: MigrationTarget[] = [
  { label: "PipelineRun", properties: ["startedAt", "completedAt"] },
  { label: "TaskOutput", properties: ["createdAt"] },
  { label: "Decision", properties: ["timestamp", "completedAt"] },
  { label: "Observation", properties: ["timestamp"] },
  { label: "Distillation", properties: ["createdAt", "supersededAt", "windowStart", "windowEnd"] },
  { label: "Seed", properties: ["createdAt", "updatedAt"] },
  { label: "Bloom", properties: ["createdAt", "updatedAt"] },
  { label: "Resonator", properties: ["createdAt"] },
  { label: "ContextCluster", properties: ["createdAt"] },
  { label: "HumanFeedback", properties: ["timestamp"] },
  { label: "ConstitutionalRule", properties: ["createdAt"] },
  { label: "ThresholdEvent", properties: ["timestamp"] },
];

async function migrate(): Promise<void> {
  console.log("=== Temporal Type Migration ===\n");

  let totalMigrated = 0;

  for (const target of TARGETS) {
    for (const prop of target.properties) {
      try {
        const result = await writeTransaction(async (tx) => {
          // datetime() is idempotent — if already native, no-op.
          // We filter for non-null values to avoid errors.
          return tx.run(
            `MATCH (n:${target.label})
             WHERE n.${prop} IS NOT NULL
             SET n.${prop} = datetime(n.${prop})
             RETURN count(n) AS migrated`,
          );
        });
        const count = result.records[0]?.get("migrated") ?? 0;
        if (count > 0) {
          console.log(`  ${target.label}.${prop}: ${count} nodes migrated`);
          totalMigrated += count;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // datetime() on an already-native value is fine; some other errors may occur
        // for nodes that don't have the property or have incompatible types
        if (msg.includes("Cannot construct date time from")) {
          console.log(`  ${target.label}.${prop}: skipped (already native or incompatible)`);
        } else {
          console.error(`  ${target.label}.${prop}: ERROR — ${msg}`);
        }
      }
    }
  }

  console.log(`\n  Total: ${totalMigrated} property values migrated`);
  await closeDriver();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
