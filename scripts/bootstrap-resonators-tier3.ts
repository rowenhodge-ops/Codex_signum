// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Tier-3 Resonator Instantiation
 *
 * Creates the Adaptation Analysis Resonator (last missing transformation Resonator)
 * and wires FLOWS_TO from ADAPT stage.
 *
 * Source: Cognitive Bloom cycle 5 intent
 * Idempotent -- safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-resonators-tier3.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { runQuery, closeDriver } from "../src/graph/client.js";
import { instantiateMorpheme, createLine } from "../src/graph/instantiation.js";

// ── .env auto-loader ──────────────────────────────────────────────────────

const ENV_KEYS = [
  "NEO4J_URI", "NEO4J_USER", "NEO4J_USERNAME", "NEO4J_PASSWORD", "NEO4J_DATABASE",
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

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();

  const SEP = "─".repeat(60);
  console.log("\n" + SEP);
  console.log("  TIER-3 RESONATOR: ADAPTATION ANALYSIS");
  console.log(SEP);

  // Create Resonator
  console.log("\n── Creating Resonator ───────────────────────────────────");
  const result = await instantiateMorpheme(
    "resonator",
    {
      id: "resonator:adaptation-analysis",
      name: "Adaptation Analysis Resonator",
      content: "Architect pattern Resonator for failure analysis and replanning. Takes execution outcomes, psiH friction signals, and Violation Seeds; synthesises replanning scope decision.",
      type: "adaptation-analysis",
      status: "active",
    },
    "architect",
    {
      transformationDefId: "def:transformation:adaptation-analysis",
      a6Justification: "distinct_governance_scope",  // Model agents have INSTANTIATES but are not governance Resonators
    },
  );

  if (result.success) {
    console.log(`  [ok] resonator:adaptation-analysis (parent: architect)`);
  } else if (result.composed) {
    console.log(`  [compose] composed to existing: ${result.composed.existingId}`);
  } else {
    console.error(`  [FAIL] ${result.error}`);
  }

  // Discover ADAPT stage
  console.log("\n── Discovering ADAPT stage ──────────────────────────────");
  const stageResult = await runQuery(
    `MATCH (architect:Bloom {id: 'architect'})-[:CONTAINS]->(stage)
     RETURN stage.id AS id, stage.name AS name
     ORDER BY stage.id`,
    {}, "READ",
  );

  const adaptStage = stageResult.records.find((r) => {
    const id = (r.get("id") as string).toUpperCase();
    const name = (r.get("name") as string).toUpperCase();
    return id.includes("ADAPT") || name.includes("ADAPT");
  });

  if (!adaptStage) {
    console.error("  [FAIL] ADAPT stage not found");
    console.log(`  Available: ${stageResult.records.map((r) => r.get("id")).join(", ")}`);
  } else {
    const adaptId = adaptStage.get("id") as string;
    console.log(`  Found: ${adaptId}`);

    // Wire ADAPT → adaptation-analysis
    console.log("\n── Wiring FLOWS_TO ──────────────────────────────────────");
    const lineResult = await createLine(adaptId, "resonator:adaptation-analysis", "FLOWS_TO", {
      label: "stage-to-adaptation-analysis",
      description: "ADAPT uses Adaptation Analysis Resonator",
    });
    if (lineResult.success) {
      console.log(`  [ok] ${adaptId} -> resonator:adaptation-analysis`);
    } else {
      console.log(`  [warn] ${lineResult.error}`);
    }

    // Check if ADAPT → llm-invocation already exists
    const existingAdaptLlm = await runQuery(
      `MATCH (adapt {id: $adaptId})-[:FLOWS_TO]->(llm:Resonator {id: 'resonator:llm-invocation'})
       RETURN count(*) AS cnt`,
      { adaptId }, "READ",
    );
    if ((existingAdaptLlm.records[0]?.get("cnt") ?? 0) === 0) {
      const llmResult = await createLine(adaptId, "resonator:llm-invocation", "FLOWS_TO", {
        label: "stage-to-llm-invocation",
        description: "ADAPT uses LLM Invocation for replanning analysis",
      });
      if (llmResult.success) {
        console.log(`  [ok] ${adaptId} -> resonator:llm-invocation (was missing)`);
      } else {
        console.log(`  [warn] ${adaptId} -> resonator:llm-invocation: ${llmResult.error}`);
      }
    } else {
      console.log(`  [skip] ${adaptId} -> resonator:llm-invocation (already wired)`);
    }
  }

  // Verification
  console.log("\n── Verification ─────────────────────────────────────────");

  const adapt = await runQuery(
    `MATCH (r:Resonator {id: 'resonator:adaptation-analysis'})-[:INSTANTIATES]->(def:Seed {id: 'def:transformation:adaptation-analysis'})
     RETURN r.id, r.status`,
    {}, "READ",
  );
  console.log(`  Adaptation Analysis exists: ${adapt.records.length > 0 ? "yes" : "NO"}`);

  const adaptFlows = await runQuery(
    `MATCH (stage)-[:FLOWS_TO]->(r:Resonator {id: 'resonator:adaptation-analysis'})
     RETURN stage.id AS stageId`,
    {}, "READ",
  );
  console.log(`  FLOWS_TO from: ${adaptFlows.records.map((r) => r.get("stageId")).join(", ") || "none"}`);

  const bloomDefs = await runQuery(
    `MATCH (instance:Bloom)-[:INSTANTIATES]->(def:Seed)
     WHERE def.seedType = 'bloom-definition' AND instance.status IN ['active', 'planned']
     RETURN instance.id AS bloomId, def.id AS defId`,
    {}, "READ",
  );
  console.log(`  Bloom instances with bloom-definition INSTANTIATES: ${bloomDefs.records.length}`);
  for (const r of bloomDefs.records) {
    console.log(`    ${r.get("bloomId")} -> ${r.get("defId")}`);
  }

  console.log("\n" + SEP);
  console.log("  COMPLETE");
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
