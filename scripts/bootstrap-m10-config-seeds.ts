#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * M-10.1 §2–3 — Config Seed Bootstrap: Dimensional Profiles + Lambda Decay
 *
 * Creates:
 *   1. config:dimensional-phi-profiles — 6 constitutional dimensions (all 0.0)
 *   2. config:lambda:model-performance  — half-life ~2.5 days (216,000,000 ms)
 *   3. config:lambda:schema-definition  — half-life ~90 days  (7,776,000,000 ms)
 *   4. config:lambda:threat-archive     — half-life ~21 days  (1,814,400,000 ms)
 *   5. config:lambda:remedy-archive     — half-life ~90 days  (7,776,000,000 ms)
 *
 * All Seeds created through instantiateMorpheme() Protocol — not raw Cypher.
 * Parent: constitutional-bloom (infrastructure config).
 *
 * [NO-PIPELINE] — pure graph mutation, idempotent.
 *
 * Usage: npx tsx scripts/bootstrap-m10-config-seeds.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { readTransaction, closeDriver } from "../src/graph/client.js";
import { instantiateMorpheme } from "../src/graph/instantiation.js";
import type { InstantiationResult } from "../src/graph/instantiation.js";

// ── .env auto-loader ──────────────────────────────────────────────────────

const ENV_KEYS = [
  "NEO4J_URI",
  "NEO4J_USER",
  "NEO4J_USERNAME",
  "NEO4J_PASSWORD",
  "NEO4J_DATABASE",
];

function loadEnv(): void {
  const envPaths = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../DND-Manager/.env"),
  ];
  for (const envPath of envPaths) {
    if (!existsSync(envPath)) continue;
    try {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, value] = match;
        const normalizedValue = value.replace(/^["']|["']$/g, "").trim();
        if (key === "NEO4J_USERNAME" && !process.env.NEO4J_USER) {
          process.env.NEO4J_USER = normalizedValue;
        }
        if (ENV_KEYS.includes(key) && !process.env[key]) {
          process.env[key] = normalizedValue;
        }
      }
    } catch { /* ignore */ }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function check(label: string, result: InstantiationResult): void {
  if (result.success) {
    const composed = result.composed;
    if (composed) {
      console.log(`  [ok] ${label} (composed with existing: ${composed.existingId})`);
    } else {
      console.log(`  [ok] ${label}`);
    }
  } else {
    console.error(`  [FAIL] ${label}: ${result.error}`);
  }
}

// ── Config Seed definitions ──────────────────────────────────────────────

const PARENT_ID = "constitutional-bloom";

/** Constitutional dimension set — 6 dimensions, all initialised at 0.0 */
const DIMENSIONAL_SEED = {
  id: "config:dimensional-phi-profiles",
  name: "Dimensional ΦL Profiles",
  seedType: "config",
  status: "active",
  content: JSON.stringify({
    description: "Constitutional dimension set for per-context ΦL profiling. Each dimension tracks independent health across cognitive modes.",
    dimensions: {
      code: 0.0,
      analysis: 0.0,
      creative: 0.0,
      structured_output: 0.0,
      classification: 0.0,
      synthesis: 0.0,
    },
  }),
  category: "infrastructure",
};

/** Lambda decay Config Seeds — one per temporal context */
const LAMBDA_SEEDS = [
  {
    id: "config:lambda:model-performance",
    name: "Lambda: Model Performance",
    halfLifeMs: 216_000_000,        // ~2.5 days
    description: "Decay rate for model performance posteriors. Short half-life ensures rapid adaptation to model quality changes.",
  },
  {
    id: "config:lambda:schema-definition",
    name: "Lambda: Schema Definition",
    halfLifeMs: 7_776_000_000,      // ~90 days
    description: "Decay rate for schema-level definitions. Long half-life preserves structural knowledge stability.",
  },
  {
    id: "config:lambda:threat-archive",
    name: "Lambda: Threat Archive",
    halfLifeMs: 1_814_400_000,      // ~21 days
    description: "Decay rate for threat/failure signatures. Medium half-life balances vigilance with forgetting resolved threats.",
  },
  {
    id: "config:lambda:remedy-archive",
    name: "Lambda: Remedy Archive",
    halfLifeMs: 7_776_000_000,      // ~90 days
    description: "Decay rate for remedy/fix patterns. Long half-life preserves institutional knowledge of successful interventions.",
  },
];

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();

  const SEP = "─".repeat(60);
  console.log(SEP);
  console.log("M-10.1 Config Seed Bootstrap — Dimensional + Lambda Decay");
  console.log(SEP);

  // Verify parent exists
  console.log("\n▸ Step 1: Verifying constitutional-bloom exists...");
  const parentExists = await readTransaction(async (tx) => {
    const result = await tx.run(
      `MATCH (b:Bloom {id: $id}) RETURN b.id AS id`,
      { id: PARENT_ID },
    );
    return result.records.length > 0;
  });

  if (!parentExists) {
    console.error("  [FAIL] constitutional-bloom not found. Run bootstrap-constitutional-bloom.ts first.");
    await closeDriver();
    process.exit(1);
  }
  console.log("  [ok] constitutional-bloom found");

  // Step 2: Dimensional Config Seed
  console.log("\n▸ Step 2: Creating dimensional-phi-profiles Config Seed...");
  const dimResult = await instantiateMorpheme("seed", DIMENSIONAL_SEED, PARENT_ID);
  check("config:dimensional-phi-profiles", dimResult);

  // Step 3: Lambda decay Config Seeds
  console.log("\n▸ Step 3: Creating lambda decay Config Seeds...");
  for (const seed of LAMBDA_SEEDS) {
    const result = await instantiateMorpheme("seed", {
      id: seed.id,
      name: seed.name,
      seedType: "config",
      status: "active",
      content: JSON.stringify({
        description: seed.description,
        halfLifeMs: seed.halfLifeMs,
        lambdaPerMs: Math.LN2 / seed.halfLifeMs,
      }),
      category: "infrastructure",
      halfLifeMs: seed.halfLifeMs,
    }, PARENT_ID);
    check(seed.id, result);
  }

  // Step 4: Verification
  console.log("\n▸ Step 4: Verification...");
  const configs = await readTransaction(async (tx) => {
    const result = await tx.run(
      `MATCH (b:Bloom {id: $parentId})-[:CONTAINS]->(c:Seed)
       WHERE c.seedType = 'config' AND c.id STARTS WITH 'config:'
       RETURN c.id AS id, c.status AS status
       ORDER BY c.id`,
      { parentId: PARENT_ID },
    );
    return result.records.map((r) => ({
      id: r.get("id") as string,
      status: r.get("status") as string,
    }));
  });

  console.log(`  Found ${configs.length} config Seed(s) in constitutional-bloom:`);
  for (const c of configs) {
    console.log(`    ${c.id} (${c.status})`);
  }

  const expected = [DIMENSIONAL_SEED.id, ...LAMBDA_SEEDS.map(s => s.id)];
  const missing = expected.filter(id => !configs.some(c => c.id === id));
  if (missing.length > 0) {
    console.error(`  [WARN] Missing: ${missing.join(", ")}`);
  } else {
    console.log("  [ok] All 5 Config Seeds verified.");
  }

  console.log(`\n${SEP}`);
  console.log("Done.");
  await closeDriver();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
