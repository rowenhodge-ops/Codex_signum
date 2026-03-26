#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * M-10 Memory Operations — Intent Seed Creation
 *
 * Creates the M-10 intent Seed in the Gnosis (Cognitive) Bloom capturing
 * the structural memory paradigm shift. [NO-PIPELINE] — pure graph mutation.
 *
 * Idempotent: uses Protocol MERGE semantics.
 *
 * Usage: npx tsx scripts/bootstrap-m10-intent.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { readTransaction, closeDriver } from "../src/graph/client.js";
import { instantiateMorpheme, createLine } from "../src/graph/instantiation.js";
import type { InstantiationResult, LineCreationResult } from "../src/graph/instantiation.js";

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

function check(label: string, result: InstantiationResult | LineCreationResult): void {
  if (result.success) {
    const composed = "composed" in result && result.composed;
    if (composed) {
      console.log(`  [ok] ${label} (composed with existing: ${composed.existingId})`);
    } else {
      console.log(`  [ok] ${label}`);
    }
  } else {
    console.error(`  [FAIL] ${label}: ${result.error}`);
  }
}

// ── Intent content ────────────────────────────────────────────────────────

const INTENT_CONTENT = `PARADIGM SHIFT: The topology IS the memory. Observation Grids for operational state are monitoring overlays — the system records what it already knows to read it back. The structural pattern: execution outcomes update properties on the Bloom that executed via γ-recursive formulas (α_new = γ × α_old + outcome). The γ = e^(−λ) identity unifies memory decay with Discounted Thompson Sampling — the memory system IS the bandit's adaptation mechanism.

FIVE SUB-MILESTONES:
M-10.1: Structural Memory Foundation — γ-recursive posteriors on Bloom nodes, constitutional dimension set (phiL_code, phiL_analysis, etc. all at 0.0), per-context λ Config Seeds, wire ΦL and Thompson to structural properties, deleteLine in Protocol (R-61), updateMorpheme addLabels extension.
M-10.2: BOCPD Drift Detection — Bayesian Online Change Point Detection for low-volume streams, triggers dimensional property recalibration when distribution shifts.
M-10.3: LLM Bloom Reclassification — LLM Resonators become Blooms (molecule principle: accumulated self-knowledge requires Bloom boundary). Ecosystem-scoped. Contains: Invocation Resonator + Learning Helix + Learning Grid (bounded, schema-gated). ~25 model/agent nodes reclassified.
M-10.4: Cross-Stratum Query Interface — getMemoryContextForBloom() reads structural properties + qualitative failure context from provenance trail. Thompson cold start from dimensional profiles.
M-10.5: Integration + CLI + Spec Revision Drafts — end-to-end verification, CLI, v5.0/Bridge/MIM rewrite drafts including G7 (Molecule Principle).

MOLECULE PRINCIPLE (proposed G7): A composition that accumulates structural self-knowledge requires a Bloom boundary. Accumulated operational state (posteriors, dimensional affinities, failure signatures, BOCPD state) = self-knowledge. Identity properties (id, name, status) and derived properties (ΦL, ΨH, εR) ≠ self-knowledge. The Bloom boundary is the membrane of self-knowledge.

LLM BLOOM ARCHITECTURE: Ecosystem-scoped. Shared across patterns. One Bloom per model. Contains Invocation Resonator (bare, stateless, def:transformation:llm-invocation with a6:distinct_governance_scope), Learning Helix (schema gate), Learning Grid (bounded ~50 Seeds: failure-signatures, calibration-events, capability-observations only). All constitutional dimensions initialised at 0.0.

SPEC CHANGES REQUIRED: v5.0 §Memory Topology full rewrite. v5.0 new §G7 Molecule Principle. v5.0 new §Property Evolution Governance. Bridge v3.0 Part 7 full rewrite. MIM v3.0 (LLM reclassification + molecule principle).

WHAT IS NOT M-10: Immune memory repair loop (LLM weakness mitigation via temporary Resonators — future milestone using M-10 infrastructure). Vector search (competitive gap, separate milestone). Calibration meta-process (M-14). Predictive Sampling (premature).`;

// ── REFERENCES targets ────────────────────────────────────────────────────

const REFERENCE_TARGETS = [
  "def:morpheme:bloom",
  "def:morpheme:resonator",
  "def:transformation:llm-invocation",
  "def:helix:learning",
  "def:grid:observation",
];

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();

  const SEP = "─".repeat(60);
  console.log(SEP);
  console.log("M-10 Intent Seed — Structural Memory Paradigm");
  console.log(SEP);

  // Step 1: Find the Gnosis (Cognitive) Bloom ID
  console.log("\n▸ Step 1: Locating Gnosis Bloom...");
  const gnosisResult = await readTransaction(async (tx) => {
    const result = await tx.run(
      `MATCH (g:Bloom)-[:INSTANTIATES]->(def:Seed {id: 'def:bloom:cognitive'})
       RETURN g.id AS id`
    );
    return result.records.map((r) => r.get("id") as string);
  });

  if (!gnosisResult || gnosisResult.length === 0) {
    console.error("  [FAIL] Gnosis Bloom not found — does def:bloom:cognitive exist?");
    await closeDriver();
    process.exit(1);
  }

  const gnosisBloomId = gnosisResult[0];
  console.log(`  [ok] Gnosis Bloom: ${gnosisBloomId}`);

  // Step 2: Create the intent Seed
  console.log("\n▸ Step 2: Creating M-10 intent Seed...");
  const intentResult = await instantiateMorpheme("seed", {
    id: "intent:m10:structural-memory-paradigm",
    name: "M-10 Structural Memory Paradigm",
    content: INTENT_CONTENT,
    seedType: "intent",
    status: "active",
    category: "infrastructure",
    dimension: "strata",
    priority: "high",
    milestoneId: "M-10",
  }, gnosisBloomId);

  check("intent:m10:structural-memory-paradigm", intentResult);

  if (!intentResult.success && !intentResult.composed) {
    console.error("\n  Intent seed creation failed — aborting.");
    await closeDriver();
    process.exit(1);
  }

  // Step 3: Wire REFERENCES lines
  console.log("\n▸ Step 3: Wiring REFERENCES lines...");
  for (const targetId of REFERENCE_TARGETS) {
    const lineResult = await createLine(
      "intent:m10:structural-memory-paradigm",
      targetId,
      "REFERENCES",
    );
    check(`REFERENCES → ${targetId}`, lineResult);
  }

  // Step 4: Wire SCOPED_TO M-10 milestone
  console.log("\n▸ Step 4: Wiring SCOPED_TO M-10...");
  const scopeResult = await createLine(
    "intent:m10:structural-memory-paradigm",
    "M-10",
    "SCOPED_TO",
  );
  check("SCOPED_TO → M-10", scopeResult);

  // Step 5: Verify
  console.log("\n▸ Step 5: Verification...");
  const verifyResult = await readTransaction(async (tx) => {
    const result = await tx.run(
      `MATCH (i:Seed {id: 'intent:m10:structural-memory-paradigm'})-[r]->(target)
       RETURN type(r) AS rel, target.id AS targetId
       UNION
       MATCH (parent)-[r:CONTAINS]->(i:Seed {id: 'intent:m10:structural-memory-paradigm'})
       RETURN type(r) AS rel, parent.id AS targetId`
    );
    return result.records.map((r) => ({
      rel: r.get("rel") as string,
      targetId: r.get("targetId") as string,
    }));
  });

  console.log(`  Found ${verifyResult.length} relationships:`);
  for (const { rel, targetId } of verifyResult) {
    console.log(`    ${rel} → ${targetId}`);
  }

  // Expected: 1 CONTAINS (from Gnosis), 1 INSTANTIATES (to def:morpheme:seed),
  //           5 REFERENCES, 1 SCOPED_TO = 8 total
  const expectedMin = 7; // CONTAINS comes from parent, shown in reverse query
  if (verifyResult.length >= expectedMin) {
    console.log(`\n  ✓ Verification passed (${verifyResult.length} relationships)`);
  } else {
    console.log(`\n  ⚠ Expected at least ${expectedMin} relationships, found ${verifyResult.length}`);
  }

  console.log("\n" + SEP);
  console.log("Done. Intent seed created in Gnosis Bloom.");
  console.log(SEP);

  await closeDriver();
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await closeDriver();
  process.exit(1);
});
