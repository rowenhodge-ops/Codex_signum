// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

#!/usr/bin/env npx tsx
/**
 * Codex Signum — Agent Seeding Script
 *
 * Thin wrapper around src/bootstrap.ts for convenience.
 * Seeds Agent nodes, Pattern nodes, and informed priors in Neo4j.
 *
 * Usage:
 *   npx tsx scripts/seed-agents.ts          # Skip if already seeded
 *   npx tsx scripts/seed-agents.ts --force  # Re-seed even if agents exist
 *
 * Requires:
 *   - Neo4j running (bolt://localhost:7687)
 */
import {
  bootstrapAgents,
  bootstrapPatterns,
  seedInformedPriors,
} from "../src/bootstrap.js";
import {
  closeDriver,
  getDecisionsForCluster,
  migrateSchema,
  seedConstitutionalRules,
} from "../src/graph/index.js";

async function main(): Promise<void> {
  const force = process.argv.includes("--force");

  console.log("🌱 Codex Signum — Agent Seeding\n");

  try {
    const schema = await migrateSchema();
    if (schema.errors.length > 0) {
      throw new Error(`Schema migration errors: ${schema.errors.join(" | ")}`);
    }
    console.log(`Schema statements applied: ${schema.applied}`);

    const seededRules = await seedConstitutionalRules();
    console.log(`Constitutional rules seeded: ${seededRules}`);

    await bootstrapAgents(force);
    await bootstrapPatterns(force);

    if (
      force ||
      (await getDecisionsForCluster("strategic:moderate:general", 1))
        .length === 0
    ) {
      await seedInformedPriors();
    }

    console.log("\n✅ Seeding complete.");
  } catch (err) {
    console.error("\n❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

main();
