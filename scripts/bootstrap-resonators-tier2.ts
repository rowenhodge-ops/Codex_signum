// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Tier-2 Resonator Instantiation
 *
 * Creates the 5 Resonator instances from Cognitive Bloom cycle 3/4 intent:
 *   - 2 ecosystem-scoped: Mutation, Line Creation
 *   - 3 architect-scoped: Rule Classification, Topological Sort, Task Dispatch
 *
 * Then wires FLOWS_TO Lines from Architect stages.
 * Idempotent -- safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-resonators-tier2.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { runQuery, closeDriver } from "../src/graph/client.js";
import { instantiateMorpheme, createLine } from "../src/graph/instantiation.js";
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

function logResult(label: string, result: InstantiationResult): void {
  if (result.success) {
    if (result.composed) {
      console.log(`  [compose] ${label} — composed to existing: ${result.composed.existingId}`);
    } else {
      console.log(`  [ok] ${label}`);
    }
  } else {
    console.error(`  [FAIL] ${label}: ${result.error}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();

  const SEP = "─".repeat(60);
  console.log("\n" + SEP);
  console.log("  TIER-2 RESONATOR INSTANTIATION");
  console.log("  Source: Cognitive Bloom cycle 3 intent");
  console.log(SEP);

  // Parent discovery
  console.log("\n── Parent discovery ─────────────────────────────────────");
  const ecosystemExists = await runQuery(
    `MATCH (e:Bloom {id: 'ecosystem'}) RETURN e.id AS id`,
    {}, "READ",
  );
  const ecosystemParentId = ecosystemExists.records.length > 0 ? "ecosystem" : "constitutional-bloom";
  console.log(`  Ecosystem parent: ${ecosystemParentId}`);

  const architectExists = await runQuery(
    `MATCH (a:Bloom {id: 'architect'}) RETURN a.id AS id`,
    {}, "READ",
  );
  if (architectExists.records.length === 0) {
    throw new Error("Architect Bloom not found — cannot parent architect-scoped Resonators");
  }
  const architectParentId = "architect";
  console.log(`  Architect parent: ${architectParentId}`);

  // Create Resonators
  console.log("\n── Creating Resonators ──────────────────────────────────");

  const RESONATORS = [
    // Ecosystem-scoped
    {
      id: "resonator:mutation",
      name: "Mutation Resonator",
      content: "Shared ecosystem Resonator for morpheme mutation. Validates property changes, preserves required properties, applies update, propagates parent status, invalidates Line conductivity.",
      type: "mutation",
      transformationDefId: "def:transformation:mutation",
      parentId: ecosystemParentId,
    },
    {
      id: "resonator:line-creation",
      name: "Line Creation Resonator",
      content: "Shared ecosystem Resonator for Line creation. Validates endpoints, checks grammatical shape, creates relationship, evaluates and caches conductivity.",
      type: "line-creation",
      transformationDefId: "def:transformation:line-creation",
      parentId: ecosystemParentId,
    },
    // Architect-scoped
    {
      id: "resonator:rule-classification",
      name: "Rule-Based Classification Resonator",
      content: "Architect pattern Resonator for deterministic task classification. Takes Task Seeds and rule config Seeds; enriches each with taskType, kanoClass, estimatedComplexity, routingHint.",
      type: "rule-classification",
      transformationDefId: "def:transformation:rule-classification",
      parentId: architectParentId,
    },
    {
      id: "resonator:topological-sort",
      name: "Topological Sort Resonator",
      content: "Architect pattern Resonator for task sequencing. Takes dependency graph of Task Seeds; enriches each with executionOrder and phaseId.",
      type: "topological-sort",
      transformationDefId: "def:transformation:topological-sort",
      parentId: architectParentId,
    },
    {
      id: "resonator:task-dispatch",
      name: "Task Dispatch Resonator",
      content: "Architect pattern Resonator for task routing to execution substrate. Takes classified, sequenced Task Seed; routes based on Thompson selection and classification.",
      type: "task-dispatch",
      transformationDefId: "def:transformation:task-dispatch",
      parentId: architectParentId,
    },
  ];

  for (const res of RESONATORS) {
    const result = await instantiateMorpheme(
      "resonator",
      {
        id: res.id,
        name: res.name,
        content: res.content,
        type: res.type,
        status: "active",
      },
      res.parentId,
      { transformationDefId: res.transformationDefId },
    );
    logResult(`${res.id} (parent: ${res.parentId})`, result);
  }

  // Discover Architect stages
  console.log("\n── Discovering Architect stages ─────────────────────────");
  const stageResult = await runQuery(
    `MATCH (architect:Bloom {id: 'architect'})-[:CONTAINS]->(stage)
     RETURN stage.id AS id, stage.name AS name
     ORDER BY stage.id`,
    {}, "READ",
  );

  console.log(`  Discovered ${stageResult.records.length} Architect stages:`);
  for (const r of stageResult.records) {
    console.log(`    ${r.get("id")} — ${r.get("name")}`);
  }

  // Wire FLOWS_TO
  console.log("\n── Wiring FLOWS_TO Lines ────────────────────────────────");

  const STAGE_WIRING: Record<string, string[]> = {
    "resonator:mutation": ["DISPATCH", "ADAPT"],
    "resonator:line-creation": ["DISPATCH"],
    "resonator:rule-classification": ["CLASSIFY"],
    "resonator:topological-sort": ["SEQUENCE"],
    "resonator:task-dispatch": ["DISPATCH"],
  };

  let wiringCount = 0;
  let wiringMissed = 0;

  for (const [resonatorId, stageNames] of Object.entries(STAGE_WIRING)) {
    for (const stageName of stageNames) {
      const stageRecord = stageResult.records.find((r) => {
        const id = (r.get("id") as string).toUpperCase();
        const name = (r.get("name") as string).toUpperCase();
        return id.includes(stageName) || name.includes(stageName);
      });

      if (stageRecord) {
        const stageId = stageRecord.get("id") as string;
        const result = await createLine(stageId, resonatorId, "FLOWS_TO", {
          label: `stage-to-${resonatorId.split(":").pop()}`,
          description: `${stageRecord.get("name")} uses ${resonatorId}`,
        });
        if (result.success) {
          console.log(`  [ok] ${stageId} -> ${resonatorId}`);
          wiringCount++;
        } else {
          console.log(`  [warn] ${stageId} -> ${resonatorId}: ${result.error}`);
        }
      } else {
        console.log(`  [MISS] Stage "${stageName}" not found — available: ${stageResult.records.map((r) => r.get("id")).join(", ")}`);
        wiringMissed++;
      }
    }
  }

  // Verification
  console.log("\n── Verification ─────────────────────────────────────────");

  const totalRes = await runQuery(
    `MATCH (r:Resonator)-[:INSTANTIATES]->(def:Seed)
     WHERE def.seedType = 'transformation-definition'
     RETURN count(DISTINCT r) AS cnt`,
    {}, "READ",
  );
  console.log(`  Total Resonators with transformation-level INSTANTIATES: ${totalRes.records[0]?.get("cnt")}`);

  const parentBreakdown = await runQuery(
    `MATCH (parent)-[:CONTAINS]->(r:Resonator)
     WHERE r.id STARTS WITH 'resonator:'
     RETURN parent.id AS parentId, collect(r.id) AS resonators
     ORDER BY parent.id`,
    {}, "READ",
  );
  for (const r of parentBreakdown.records) {
    const resonators = r.get("resonators") as string[];
    console.log(`  ${r.get("parentId")}: ${resonators.join(", ")}`);
  }

  const flowsCnt = await runQuery(
    `MATCH ()-[:FLOWS_TO]->(res:Resonator)
     WHERE res.id STARTS WITH 'resonator:'
     RETURN count(*) AS cnt`,
    {}, "READ",
  );
  console.log(`  Total FLOWS_TO Lines to Resonators: ${flowsCnt.records[0]?.get("cnt")}`);

  // Summary
  console.log("\n" + SEP);
  console.log(`  COMPLETE: ${wiringCount} Lines wired, ${wiringMissed} missed`);
  console.log(SEP + "\n");
}

main()
  .catch((err: unknown) => {
    console.error("\nBootstrap failed:", err);
    process.exit(1);
  })
  .finally(() => {
    void closeDriver();
  });
