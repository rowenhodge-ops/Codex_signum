#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * M-10.3 LLM Bloom Reclassification — Bootstrap Script
 *
 * Creates LLM Bloom boundaries around Thompson-routed model families.
 * Each LLM Bloom contains:
 *   - Arm nodes (Agent:Resonator) — configuration variants
 *   - LLM Invocation Resonator child
 *   - Learning Helix child
 *   - Learning Grid child
 *   - Schema gate Config Seed child
 *
 * Molecule Principle: any composition that accumulates structural
 * self-knowledge requires a Bloom boundary.
 *
 * Idempotent: checks for existing nodes before creating.
 *
 * Usage: npx tsx scripts/bootstrap-llm-blooms.ts
 */

import path from "path";
import fs from "fs";
import {
  closeDriver,
  readTransaction,
  instantiateMorpheme,
  updateMorpheme,
  createLine,
} from "../src/graph/index.js";

// ─── Load environment ───────────────────────────────────────────────

function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../DND-Manager/.env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const clean = line.replace(/\r$/, "");
        const match = clean.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (match) {
          const [, key, rawVal] = match;
          const val = rawVal.replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
  if (process.env.NEO4J_USERNAME && !process.env.NEO4J_USER) {
    process.env.NEO4J_USER = process.env.NEO4J_USERNAME;
  }
}

loadEnv();

// ─── Types ──────────────────────────────────────────────────────────

interface ArmGroup {
  baseModelId: string;
  armIds: string[];
  statuses: string[];
  allRetired: boolean;
}

// ─── Counters ───────────────────────────────────────────────────────

const stats = {
  bloomsCreated: 0,
  bloomsSkipped: 0,
  armsWired: 0,
  resonatorsCreated: 0,
  helixesCreated: 0,
  gridsCreated: 0,
  configsCreated: 0,
  flowsToCreated: 0,
  errors: [] as string[],
};

// ─── Helpers ────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`  ${msg}`);
}

function logError(msg: string) {
  console.error(`  ✗ ${msg}`);
  stats.errors.push(msg);
}

async function nodeExists(id: string): Promise<boolean> {
  return readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (n {id: $id}) RETURN n.id LIMIT 1`,
      { id },
    );
    return res.records.length > 0;
  });
}

// ─── Step 1: Discover Thompson-routed arms ──────────────────────────

async function discoverArmGroups(): Promise<ArmGroup[]> {
  return readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (a:Agent:Resonator)
      WHERE a.baseModelId IS NOT NULL
      RETURN a.baseModelId AS baseModel,
             collect(a.id) AS armIds,
             collect(a.status) AS statuses
      ORDER BY a.baseModelId
    `);
    return res.records.map((r) => {
      const statuses = r.get("statuses") as string[];
      return {
        baseModelId: r.get("baseModel") as string,
        armIds: r.get("armIds") as string[],
        statuses,
        allRetired: statuses.every((s) => s === "retired"),
      };
    });
  });
}

// ─── Step 2: Create Constitutional Definition ───────────────────────

async function ensureDefinition(): Promise<boolean> {
  const defId = "def:bloom:llm-model";

  if (await nodeExists(defId)) {
    log(`✓ ${defId} already exists — skipping`);
    return true;
  }

  const result = await instantiateMorpheme(
    "seed",
    {
      id: defId,
      name: "LLM Model Bloom Definition",
      seedType: "bloom-definition",
      status: "active",
      content:
        "LLM model scope containing arm nodes (configuration variants as Agent:Resonator children), an LLM Invocation Resonator child, a Learning Helix child, and a bounded Learning Grid child. The Bloom boundary is the membrane of the model accumulated self-knowledge: Thompson posteriors, dimensional affinities, failure signatures. Molecule Principle (proposed G7): any composition that accumulates structural self-knowledge requires a Bloom boundary. Ecosystem-scoped — shared across Architect and DevAgent patterns.",
    },
    "constitutional-bloom",
  );

  if (!result.success) {
    logError(`Failed to create ${defId}: ${result.error}`);
    return false;
  }
  log(`✓ Created ${defId}`);
  return true;
}

// ─── Step 3: Create LLM Bloom + children per baseModelId ────────────

async function bootstrapLLMBloom(group: ArmGroup): Promise<void> {
  const { baseModelId, armIds, allRetired } = group;
  const bloomId = `llm:${baseModelId}`;
  const bloomStatus = allRetired ? "retired" : "active";

  // 3a: Create LLM Bloom (idempotent check)
  if (await nodeExists(bloomId)) {
    log(`✓ ${bloomId} already exists — skipping creation`);
    stats.bloomsSkipped++;
  } else {
    const bloomResult = await instantiateMorpheme(
      "bloom",
      {
        id: bloomId,
        name: `LLM Bloom: ${baseModelId}`,
        type: "llm-model",
        status: bloomStatus,
        content: `LLM model scope for ${baseModelId}. Contains ${armIds.length} configuration arm(s). Molecule Principle: accumulated self-knowledge (posteriors, dimensional affinities, failure signatures) requires a Bloom boundary.`,
      },
      "ecosystem",
      {
        transformationDefId: "def:bloom:llm-model",
        a6Justification: "distinct_governance_scope",
      },
    );

    if (!bloomResult.success) {
      logError(`Failed to create ${bloomId}: ${bloomResult.error}`);
      return;
    }
    log(`✓ Created ${bloomId} (status: ${bloomStatus})`);
    stats.bloomsCreated++;

    // 3h: Set dimensional properties + uninformative priors
    const dimResult = await updateMorpheme(bloomId, {
      phiL_code: 0.0,
      phiL_analysis: 0.0,
      phiL_creative: 0.0,
      phiL_structured_output: 0.0,
      phiL_classification: 0.0,
      phiL_synthesis: 0.0,
      weightedSuccesses: 1.0,
      weightedFailures: 1.0,
    });
    if (!dimResult.success) {
      logError(`Failed to set dimensions on ${bloomId}: ${dimResult.error}`);
    }
  }

  // 3c: Wire CONTAINS from LLM Bloom to each arm
  for (const armId of armIds) {
    const lineResult = await createLine(bloomId, armId, "CONTAINS");
    if (lineResult.success) {
      stats.armsWired++;
    }
    // Duplicate CONTAINS is not an error — createLine may report it
  }

  // 3d: LLM Invocation Resonator
  const resonatorId = `resonator:llm-invocation:${baseModelId}`;
  if (!(await nodeExists(resonatorId))) {
    const res = await instantiateMorpheme(
      "resonator",
      {
        id: resonatorId,
        name: `LLM Invocation: ${baseModelId}`,
        type: "llm-invocation",
        status: bloomStatus,
        content: `LLM invocation transformation for ${baseModelId}. Takes prompt + context + model selection, produces output.`,
      },
      bloomId,
      {
        transformationDefId: "def:transformation:llm-invocation",
        a6Justification: "distinct_governance_scope",
      },
    );
    if (res.success) {
      stats.resonatorsCreated++;
      log(`  ✓ Resonator: ${resonatorId}`);
    } else {
      logError(`Failed to create ${resonatorId}: ${res.error}`);
    }
  }

  // 3e: Learning Helix
  const helixId = `helix:learning:${baseModelId}`;
  if (!(await nodeExists(helixId))) {
    const res = await instantiateMorpheme(
      "helix",
      {
        id: helixId,
        name: `Learning Helix: ${baseModelId}`,
        mode: "learning",
        status: bloomStatus,
        content: `Learning helix for ${baseModelId}. Schema-gated entry: only failure-signature, calibration-event, and capability-observation Seeds may enter the Learning Grid.`,
      },
      bloomId,
      {
        transformationDefId: "def:helix:learning",
        a6Justification: "distinct_governance_scope",
      },
    );
    if (res.success) {
      stats.helixesCreated++;
      log(`  ✓ Helix: ${helixId}`);
    } else {
      logError(`Failed to create ${helixId}: ${res.error}`);
    }
  }

  // 3f: Learning Grid
  const gridId = `grid:learning:${baseModelId}`;
  if (!(await nodeExists(gridId))) {
    const res = await instantiateMorpheme(
      "grid",
      {
        id: gridId,
        name: `Learning Grid: ${baseModelId}`,
        type: "observation",
        status: bloomStatus,
        content: `Bounded learning grid for ${baseModelId}. Max ~50 Seeds. Ring buffer: oldest archived when exceeded. Helix schema gate controls entry.`,
      },
      bloomId,
      {
        transformationDefId: "def:grid:observation",
        a6Justification: "distinct_governance_scope",
      },
    );
    if (res.success) {
      stats.gridsCreated++;
      log(`  ✓ Grid: ${gridId}`);
    } else {
      logError(`Failed to create ${gridId}: ${res.error}`);
    }
  }

  // 3g: Schema gate Config Seed
  const configId = `config:schema-gate:${baseModelId}`;
  if (!(await nodeExists(configId))) {
    const res = await instantiateMorpheme(
      "seed",
      {
        id: configId,
        name: `Schema Gate: ${baseModelId}`,
        seedType: "config",
        status: "active",
        content:
          "Typed entry requirements for Learning Grid. Only these Seed types may enter: failure-signature (requires errorCode: string, taskType: string, contextSize: number), calibration-event (requires dimension: string, beforeValue: number, afterValue: number), capability-observation (requires taskType: string, capability: string, evidence: string). All other operational data goes to structural properties on the Bloom.",
      },
      bloomId,
    );
    if (res.success) {
      stats.configsCreated++;
      log(`  ✓ Config: ${configId}`);
    } else {
      logError(`Failed to create ${configId}: ${res.error}`);
    }
  }
}

// ─── Step 4: Wire FLOWS_TO from Thompson-invoking stages ────────────

async function wireFlowsTo(activeBaseModelIds: string[]): Promise<void> {
  const thompsonStages = [
    "architect_SURVEY",
    "architect_DECOMPOSE",
    "architect_DISPATCH",
    "architect_ADAPT",
  ];

  for (const stageId of thompsonStages) {
    if (!(await nodeExists(stageId))) {
      logError(`Stage ${stageId} does not exist — skipping FLOWS_TO wiring`);
      continue;
    }
    for (const baseModelId of activeBaseModelIds) {
      const bloomId = `llm:${baseModelId}`;
      const result = await createLine(stageId, bloomId, "FLOWS_TO");
      if (result.success) {
        stats.flowsToCreated++;
      }
    }
    log(`✓ FLOWS_TO from ${stageId} → ${activeBaseModelIds.length} active LLM Blooms`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("\n═══ M-10.3 LLM Bloom Reclassification ═══\n");

  try {
    // Step 1: Discover
    console.log("Step 1: Discovering Thompson-routed arms...");
    const groups = await discoverArmGroups();
    console.log(`  Found ${groups.length} baseModelIds with ${groups.reduce((n, g) => n + g.armIds.length, 0)} total arms\n`);

    // Step 2: Constitutional definition
    console.log("Step 2: Ensuring constitutional definition...");
    const defOk = await ensureDefinition();
    if (!defOk) {
      console.error("\n✗ Cannot proceed without constitutional definition.");
      process.exit(1);
    }
    console.log();

    // Step 3: Create LLM Blooms
    console.log("Step 3: Creating LLM Blooms + children...");
    for (const group of groups) {
      console.log(`\n  ── ${group.baseModelId} (${group.armIds.length} arms, ${group.allRetired ? "retired" : "active"}) ──`);
      await bootstrapLLMBloom(group);
    }
    console.log();

    // Step 4: FLOWS_TO wiring
    const activeIds = groups.filter((g) => !g.allRetired).map((g) => g.baseModelId);
    console.log(`Step 4: Wiring FLOWS_TO from Thompson stages → ${activeIds.length} active LLM Blooms...`);
    await wireFlowsTo(activeIds);
    console.log();

    // Step 5: Summary
    console.log("═══ Summary ═══");
    console.log(`  LLM Blooms created:   ${stats.bloomsCreated}`);
    console.log(`  LLM Blooms skipped:   ${stats.bloomsSkipped}`);
    console.log(`  Arms wired:           ${stats.armsWired}`);
    console.log(`  Resonators created:   ${stats.resonatorsCreated}`);
    console.log(`  Helixes created:      ${stats.helixesCreated}`);
    console.log(`  Grids created:        ${stats.gridsCreated}`);
    console.log(`  Config Seeds created: ${stats.configsCreated}`);
    console.log(`  FLOWS_TO Lines:       ${stats.flowsToCreated}`);

    if (stats.errors.length > 0) {
      console.log(`\n  ✗ Errors (${stats.errors.length}):`);
      for (const err of stats.errors) {
        console.log(`    - ${err}`);
      }
      process.exit(1);
    } else {
      console.log("\n  ✓ All operations completed successfully.");
    }
  } catch (err) {
    console.error("\n✗ Bootstrap failed:", err);
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

main();
