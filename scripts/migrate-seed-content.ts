#!/usr/bin/env tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0

/**
 * R-39 Migration: Backfill content, seedType, status on existing Seeds
 * and type, status on existing Blooms.
 *
 * Run BEFORE enabling property existence constraints.
 * Idempotent — safe to run multiple times.
 *
 * Usage: npx tsx scripts/migrate-seed-content.ts
 */

import { runQuery, writeTransaction, closeDriver } from "../src/graph/client.js";

async function migrateSeedContent(): Promise<void> {
  console.log("=== R-39 Migration: Backfill morpheme properties ===\n");

  // ── Seeds: backfill content ──
  const contentlessSeeds = await runQuery(
    `MATCH (s:Seed) WHERE s.content IS NULL OR s.content = ''
     RETURN s.id AS id, s.name AS name, s.description AS description,
            s.seedType AS seedType, s.provider AS provider, s.model AS model,
            s.thinkingMode AS thinkingMode, s.status AS status`,
    {},
    "READ",
  );

  let seedsFixed = 0;
  for (const record of contentlessSeeds.records) {
    const id = record.get("id");
    const name = record.get("name");
    const description = record.get("description");
    const seedType = record.get("seedType");
    const provider = record.get("provider");
    const model = record.get("model");
    const thinkingMode = record.get("thinkingMode");

    // Derive content deterministically
    let content: string;
    if (provider && model) {
      // Model Seed — derive from configuration
      content = `${provider}/${model} [${thinkingMode ?? "default"}]`;
    } else if (description) {
      content = description;
    } else if (name && seedType) {
      content = `${seedType}: ${name}`;
    } else if (name) {
      content = name;
    } else {
      content = `Seed ${id}`;
    }

    await writeTransaction(async (tx) => {
      await tx.run(
        `MATCH (s:Seed { id: $id })
         SET s.content = $content,
             s.seedType = COALESCE(s.seedType, $seedType),
             s.status = COALESCE(s.status, $status)`,
        {
          id,
          content,
          seedType: seedType ?? "unknown",
          status: record.get("status") ?? "active",
        },
      );
    });
    seedsFixed++;
    console.log(`  ✅ Seed ${id}: content = "${content.slice(0, 60)}..."`);
  }

  // ── Seeds: backfill seedType ──
  const typelessSeeds = await runQuery(
    `MATCH (s:Seed) WHERE s.seedType IS NULL
     RETURN s.id AS id, s.provider AS provider`,
    {},
    "READ",
  );

  let seedTypesFixed = 0;
  for (const record of typelessSeeds.records) {
    const id = record.get("id");
    const provider = record.get("provider");
    const seedType = provider ? "model" : "unknown";

    await writeTransaction(async (tx) => {
      await tx.run(
        `MATCH (s:Seed { id: $id }) SET s.seedType = $seedType`,
        { id, seedType },
      );
    });
    seedTypesFixed++;
  }

  // ── Seeds: backfill status ──
  const statuslessSeeds = await runQuery(
    `MATCH (s:Seed) WHERE s.status IS NULL
     RETURN s.id AS id`,
    {},
    "READ",
  );

  let seedStatusFixed = 0;
  for (const record of statuslessSeeds.records) {
    const id = record.get("id");
    await writeTransaction(async (tx) => {
      await tx.run(
        `MATCH (s:Seed { id: $id }) SET s.status = 'active'`,
        { id },
      );
    });
    seedStatusFixed++;
  }

  // ── Blooms: backfill type ──
  const typelessBlooms = await runQuery(
    `MATCH (b:Bloom) WHERE b.type IS NULL
     RETURN b.id AS id, b.name AS name, b.sequence AS sequence`,
    {},
    "READ",
  );

  let bloomTypesFixed = 0;
  for (const record of typelessBlooms.records) {
    const id: string = record.get("id");
    const sequence = record.get("sequence");

    // Derive type from existing properties
    let type: string;
    if (id.startsWith("M-") && id.includes(".")) {
      type = "sub-milestone";
    } else if (id.startsWith("M-") || sequence != null) {
      type = "milestone";
    } else if (id.startsWith("R-")) {
      type = "roadmap";
    } else {
      type = "pattern";
    }

    await writeTransaction(async (tx) => {
      await tx.run(
        `MATCH (b:Bloom { id: $id }) SET b.type = $type`,
        { id, type },
      );
    });
    bloomTypesFixed++;
    console.log(`  ✅ Bloom ${id}: type = "${type}"`);
  }

  // ── Blooms: backfill status (from state if present, else 'created') ──
  const statuslessBlooms = await runQuery(
    `MATCH (b:Bloom) WHERE b.status IS NULL
     RETURN b.id AS id, b.state AS state`,
    {},
    "READ",
  );

  let bloomStatusFixed = 0;
  for (const record of statuslessBlooms.records) {
    const id = record.get("id");
    const state = record.get("state");
    const status = state ?? "created";

    await writeTransaction(async (tx) => {
      await tx.run(
        `MATCH (b:Bloom { id: $id }) SET b.status = $status`,
        { id, status },
      );
    });
    bloomStatusFixed++;
  }

  // ── Summary ──
  console.log("\n=== Migration Summary ===");
  console.log(`  Seeds — content backfilled: ${seedsFixed}`);
  console.log(`  Seeds — seedType backfilled: ${seedTypesFixed}`);
  console.log(`  Seeds — status backfilled: ${seedStatusFixed}`);
  console.log(`  Blooms — type backfilled: ${bloomTypesFixed}`);
  console.log(`  Blooms — status backfilled: ${bloomStatusFixed}`);

  // ── Verify ──
  const remaining = await runQuery(
    `MATCH (s:Seed) WHERE s.content IS NULL OR s.seedType IS NULL OR s.status IS NULL
     RETURN count(s) AS seedGaps
     UNION ALL
     MATCH (b:Bloom) WHERE b.type IS NULL OR b.status IS NULL
     RETURN count(b) AS seedGaps`,
    {},
    "READ",
  );

  const gaps = remaining.records.reduce(
    (sum, r) => sum + (r.get("seedGaps")?.toNumber?.() ?? r.get("seedGaps") ?? 0),
    0,
  );

  if (gaps === 0) {
    console.log("\n✅ All morphemes have required properties. Safe to enable constraints.");
  } else {
    console.log(`\n⚠️  ${gaps} morphemes still missing properties. Investigate before enabling constraints.`);
  }

  await closeDriver();
}

migrateSeedContent().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
