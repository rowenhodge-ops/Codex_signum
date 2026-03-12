#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Post M-16.3 Anti-Pattern Sweep — Graph Cleanup
 *
 * Removes stale nodes from Neo4j that correspond to source-level fixes:
 * 1. model-sentinel Bloom and Pattern nodes (eliminated anti-pattern)
 * 2. Legacy Pattern duplicates (thompson-router, dev-agent, architect)
 * 3. axiom:A5-reversibility grammar reference Seed (removed in v5.0)
 * 4. Rename grammar-ref-v4.3 → grammar-ref-v5.0 (or delete if rename fails)
 *
 * Idempotent: safe to run multiple times. Handles missing nodes gracefully.
 *
 * Usage: npx tsx scripts/cleanup-anti-pattern-sweep.ts
 */

import { pathToFileURL } from "node:url";
import {
  closeDriver,
  writeTransaction,
  migrateSchema,
} from "../src/graph/index.js";

async function runCleanup(label: string, cypher: string): Promise<number> {
  try {
    const result = await writeTransaction(async (tx) => {
      return tx.run(cypher);
    });
    const counters = result.summary.counters.updates();
    const deleted = counters.nodesDeleted + counters.relationshipsDeleted;
    const updated = counters.propertiesSet;
    if (deleted > 0 || updated > 0) {
      console.log(`  ✅ ${label}: ${deleted} deleted, ${updated} properties updated`);
    } else {
      console.log(`  ⏭  ${label}: nothing to do (already clean)`);
    }
    return deleted + updated;
  } catch (err) {
    console.warn(`  ⚠ ${label}: ${err instanceof Error ? err.message : err}`);
    return 0;
  }
}

async function main(): Promise<void> {
  console.log("🧹 Anti-Pattern Sweep — Graph Cleanup\n");

  const schema = await migrateSchema();
  if (schema.errors.length > 0) {
    console.error("Schema errors:", schema.errors);
  }
  console.log(`Schema: ${schema.applied} statements applied\n`);

  let totalChanges = 0;

  // 1. Delete model-sentinel Bloom and Pattern nodes
  totalChanges += await runCleanup(
    "Delete model-sentinel (all labels)",
    `MATCH (n {id: 'model-sentinel'}) DETACH DELETE n`,
  );

  // 2. Delete legacy Pattern duplicates where a Bloom with the same id exists
  //    These were created before M-16.3 migration added :Bloom labels
  totalChanges += await runCleanup(
    "Delete legacy Pattern duplicates (thompson-router, dev-agent, architect)",
    `MATCH (p:Pattern)
     WHERE NOT p:Bloom
     AND EXISTS { MATCH (b:Bloom {id: p.id}) }
     DETACH DELETE p`,
  );

  // 3. Delete A5 Reversibility grammar reference Seed
  totalChanges += await runCleanup(
    "Delete axiom:A5-reversibility Seed",
    `MATCH (s:Seed {id: 'axiom:A5-reversibility'}) DETACH DELETE s`,
  );

  // 4. Rename grammar-ref-v4.3 → grammar-ref-v5.0
  //    If v5.0 already exists, delete the old v4.3 node instead
  totalChanges += await runCleanup(
    "Rename grammar-ref-v4.3 → grammar-ref-v5.0",
    `MATCH (b:Bloom {id: 'grammar-ref-v4.3'})
     WHERE NOT EXISTS { MATCH (:Bloom {id: 'grammar-ref-v5.0'}) }
     SET b.id = 'grammar-ref-v5.0',
         b.name = 'Grammar Reference v5.0',
         b.specVersion = 'v5.0',
         b.updatedAt = datetime()`,
  );

  // 4b. If rename couldn't happen because v5.0 already exists, delete old v4.3
  totalChanges += await runCleanup(
    "Delete stale grammar-ref-v4.3 (if v5.0 already exists)",
    `MATCH (old:Bloom {id: 'grammar-ref-v4.3'})
     WHERE EXISTS { MATCH (:Bloom {id: 'grammar-ref-v5.0'}) }
     DETACH DELETE old`,
  );

  // 5. Update compliance corpus specVersion to v5.0
  totalChanges += await runCleanup(
    "Update compliance corpus specVersion to v5.0",
    `MATCH (g:Grid {id: 'grid:compliance-corpus'})
     WHERE g.specVersion <> 'v5.0' OR g.specVersion IS NULL
     SET g.specVersion = 'v5.0', g.updatedAt = datetime()`,
  );

  console.log(`\n── Summary: ${totalChanges} total changes ──`);
  console.log("\nVerify with:");
  console.log("  MATCH (n {id: 'model-sentinel'}) RETURN n  // should be empty");
  console.log("  MATCH (s:Seed {id: 'axiom:A5-reversibility'}) RETURN s  // should be empty");
  console.log("  MATCH (b:Bloom {id: 'grammar-ref-v5.0'}) RETURN b.name, b.specVersion");
  console.log("  MATCH (p:Pattern) WHERE NOT p:Bloom RETURN p  // should be empty");
}

const invokedPath = process.argv[1];
const isDirectRun = invokedPath
  ? import.meta.url === pathToFileURL(invokedPath).href
  : false;

if (isDirectRun) {
  main()
    .catch((err) => {
      console.error("Cleanup failed:", err);
      process.exit(1);
    })
    .finally(() => closeDriver());
}

export { main as cleanupAntiPatternSweep };
