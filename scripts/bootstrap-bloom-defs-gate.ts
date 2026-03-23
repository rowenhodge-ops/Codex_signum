// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Bloom-Definition INSTANTIATES Fix + GATE Wiring + lambda2 Recompute
 *
 * Phase 0: Diagnostic (READ ONLY)
 * Stream A: Wire missing bloom-definition INSTANTIATES edges
 * Stream B: Wire GATE stage to resonator:human-gate
 * Stream C: Recompute lambda2 on Architect Bloom
 *
 * Source: Cognitive Bloom cycle 7 intent
 * Idempotent -- safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-bloom-defs-gate.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { runQuery, closeDriver } from "../src/graph/client.js";
import { createLine } from "../src/graph/instantiation.js";
import { computeAndPersistPsiH } from "../src/graph/queries/health.js";

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
  console.log("  BLOOM-DEFINITION INSTANTIATES + GATE WIRING");
  console.log(SEP);

  // ── Phase 0: Diagnostic (READ ONLY) ────────────────────────────────
  console.log("\n── Phase 0: Diagnostic ──\n");

  // 1. Check INSTANTIATES edges on target Blooms
  const targetBlooms = ["constitutional-bloom", "architect", "devagent", "dev-agent"];
  for (const bloomId of targetBlooms) {
    const result = await runQuery(
      `MATCH (b:Bloom {id: $bloomId})
       OPTIONAL MATCH (b)-[:INSTANTIATES]->(def:Seed)
       RETURN b.id AS id, b.status AS status, b.type AS type,
              collect({defId: def.id, defSeedType: def.seedType}) AS instantiates`,
      { bloomId }, "READ",
    );
    if (result.records.length > 0) {
      const r = result.records[0];
      console.log(`  ${r.get("id")} [status=${r.get("status")}, type=${r.get("type")}]`);
      const edges = r.get("instantiates") as Array<{ defId: string | null; defSeedType: string | null }>;
      for (const e of edges) {
        if (e.defId) console.log(`    -> ${e.defId} (${e.defSeedType})`);
      }
      if (edges.every((e) => !e.defId)) console.log(`    -> NO INSTANTIATES edges`);
    } else {
      console.log(`  ${bloomId} — NOT FOUND`);
    }
  }

  // 2. System-wide bloom-definition INSTANTIATES
  const surveyUnion = await runQuery(
    `MATCH (instance:Bloom)-[:INSTANTIATES]->(def:Seed)
     WHERE def.seedType = 'bloom-definition'
       AND instance.status IN ['active', 'planned']
     RETURN instance.id AS bloomId, instance.status AS status, def.id AS defId
     ORDER BY instance.id`,
    {}, "READ",
  );
  console.log(`\n  System-wide bloom-definition INSTANTIATES: ${surveyUnion.records.length}`);
  for (const r of surveyUnion.records) {
    console.log(`    ${r.get("bloomId")} [${r.get("status")}] -> ${r.get("defId")}`);
  }

  // 3. Bloom-level definitions in Constitutional Bloom
  const bloomDefs = await runQuery(
    `MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(def:Seed)
     WHERE def.seedType = 'bloom-definition'
     RETURN def.id AS id, def.name AS name, def.status AS status
     ORDER BY def.id`,
    {}, "READ",
  );
  console.log(`\n  Bloom definitions in Constitutional Bloom: ${bloomDefs.records.length}`);
  for (const r of bloomDefs.records) {
    console.log(`    ${r.get("id")} [${r.get("status")}] — ${r.get("name")}`);
  }

  // 4. GATE stage wiring
  const gateStage = await runQuery(
    `MATCH (architect:Bloom {id: 'architect'})-[:CONTAINS]->(stage)
     WHERE stage.id CONTAINS 'GATE' OR toUpper(stage.name) CONTAINS 'GATE'
     OPTIONAL MATCH (stage)-[:FLOWS_TO]->(target)
     RETURN stage.id AS id, stage.name AS name,
            collect(target.id) AS flowsTo`,
    {}, "READ",
  );
  console.log(`\n  GATE stage:`);
  for (const r of gateStage.records) {
    const flows = r.get("flowsTo") as string[];
    console.log(`    ${r.get("id")} — ${r.get("name")}`);
    console.log(`    FLOWS_TO: ${flows.length > 0 ? flows.join(", ") : "NONE (isolated)"}`);
  }

  console.log("\n── Phase 0 complete ──\n");

  // ── Stream A: Wire missing bloom-definition INSTANTIATES edges ─────
  console.log("── Stream A: Bloom-definition INSTANTIATES wiring ──\n");

  const BLOOM_DEF_MAP: Array<{ bloomId: string; defId: string }> = [
    { bloomId: "constitutional-bloom", defId: "def:bloom:constitutional" },
    { bloomId: "architect", defId: "def:bloom:architect" },
    { bloomId: "devagent", defId: "def:bloom:devagent" },
  ];

  // Resolved map — handles alternate IDs
  const resolvedMap: Array<{ bloomId: string; defId: string }> = [];

  for (const { bloomId, defId } of BLOOM_DEF_MAP) {
    // Check if bloom exists
    const bloomExists = await runQuery(
      `MATCH (b:Bloom {id: $bloomId}) RETURN b.id AS id`, { bloomId }, "READ",
    );

    let resolvedBloomId = bloomId;
    if (bloomExists.records.length === 0) {
      // Try alternate IDs
      const alternates = bloomId === "devagent" ? ["dev-agent", "devAgent"] : [];
      let found = false;
      for (const alt of alternates) {
        const altExists = await runQuery(
          `MATCH (b:Bloom {id: $altId}) RETURN b.id AS id`, { altId: alt }, "READ",
        );
        if (altExists.records.length > 0) {
          resolvedBloomId = alt;
          found = true;
          console.log(`  ${bloomId} not found, using alternate: ${alt}`);
          break;
        }
      }
      if (!found) {
        console.log(`  [skip] ${bloomId} not found (no alternates matched)`);
        continue;
      }
    }

    // Check if definition exists
    const defExists = await runQuery(
      `MATCH (def:Seed {id: $defId}) RETURN def.id AS id`, { defId }, "READ",
    );
    if (defExists.records.length === 0) {
      console.log(`  [skip] Definition ${defId} not found`);
      continue;
    }

    // Check if edge already exists
    const edgeExists = await runQuery(
      `MATCH (b:Bloom {id: $bloomId})-[:INSTANTIATES]->(def:Seed {id: $defId})
       RETURN count(*) AS cnt`,
      { bloomId: resolvedBloomId, defId }, "READ",
    );
    const cnt = edgeExists.records[0]?.get("cnt") ?? 0;

    if (cnt > 0) {
      console.log(`  [exists] ${resolvedBloomId} -> ${defId}`);
    } else {
      const result = await createLine(resolvedBloomId, defId, "INSTANTIATES");
      if (result.success) {
        console.log(`  [ok] ${resolvedBloomId} -> ${defId} (created)`);
      } else {
        console.log(`  [FAIL] ${resolvedBloomId} -> ${defId}: ${result.error}`);
      }
    }

    // Set transformationDefId property if missing
    await runQuery(
      `MATCH (b:Bloom {id: $bloomId})
       WHERE b.transformationDefId IS NULL
       SET b.transformationDefId = $defId`,
      { bloomId: resolvedBloomId, defId }, "WRITE",
    );

    resolvedMap.push({ bloomId: resolvedBloomId, defId });
  }

  // ── Stream B: Wire GATE stage to resonator:human-gate ──────────────
  console.log("\n── Stream B: GATE stage wiring ──\n");

  const gateResult = await runQuery(
    `MATCH (architect:Bloom {id: 'architect'})-[:CONTAINS]->(stage)
     WHERE stage.id CONTAINS 'GATE' OR toUpper(stage.name) CONTAINS 'GATE'
     RETURN stage.id AS id, stage.name AS name`,
    {}, "READ",
  );

  if (gateResult.records.length > 0) {
    const gateId = gateResult.records[0].get("id") as string;
    const humanGateResult = await createLine(gateId, "resonator:human-gate", "FLOWS_TO", {
      label: "stage-to-human-gate",
      description: "GATE stage uses Human Gate Resonator",
    });
    if (humanGateResult.success) {
      console.log(`  [ok] ${gateId} -> resonator:human-gate`);
    } else {
      console.log(`  [warn] ${gateId} -> resonator:human-gate: ${humanGateResult.error}`);
    }
  } else {
    console.log("  [skip] GATE stage not found in Architect");
  }

  // ── Stream C: Recompute lambda2 on Architect Bloom ─────────────────
  console.log("\n── Stream C: lambda2 recompute ──\n");

  try {
    const psiH = await computeAndPersistPsiH("architect");
    if (psiH) {
      console.log(`  Architect psiH: ${psiH.combined.toFixed(3)} (lambda2=${psiH.lambda2.toFixed(3)}, friction=${psiH.friction.toFixed(3)})`);
    } else {
      console.log("  [warn] computeAndPersistPsiH returned null");
    }
  } catch (err) {
    console.log(`  [warn] psiH recompute failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── Verification ───────────────────────────────────────────────────
  console.log("\n── Verification ──\n");

  // 1. Bloom-definition INSTANTIATES
  for (const { bloomId, defId } of resolvedMap) {
    const check = await runQuery(
      `MATCH (b:Bloom {id: $bloomId})-[:INSTANTIATES]->(def:Seed {id: $defId})
       RETURN count(*) AS cnt`,
      { bloomId, defId }, "READ",
    );
    console.log(`  ${bloomId} -> ${defId}: ${(check.records[0]?.get("cnt") ?? 0) > 0 ? "yes" : "NO"}`);
  }

  // 2. GATE wiring
  const gateCheck = await runQuery(
    `MATCH (stage)-[:FLOWS_TO]->(r:Resonator {id: 'resonator:human-gate'})
     WHERE stage.id CONTAINS 'GATE' OR toUpper(stage.name) CONTAINS 'GATE'
     RETURN stage.id AS stageId`,
    {}, "READ",
  );
  console.log(`  GATE -> resonator:human-gate: ${gateCheck.records.length > 0 ? "yes" : "NO"}`);

  // 3. lambda2 recomputed
  const lambda2Check = await runQuery(
    `MATCH (b:Bloom {id: 'architect'}) RETURN b.lambda2 AS lambda2, b.psiH AS psiH`,
    {}, "READ",
  );
  const lambda2 = lambda2Check.records[0]?.get("lambda2");
  console.log(`  Architect lambda2: ${lambda2} ${lambda2 > 0 ? "(nonzero)" : "(still 0)"}`);

  // 4. System-wide bloom-definition count
  const bloomDefCount = await runQuery(
    `MATCH (instance:Bloom)-[:INSTANTIATES]->(def:Seed)
     WHERE def.seedType = 'bloom-definition'
       AND instance.status IN ['active', 'planned']
     RETURN count(DISTINCT instance) AS cnt`,
    {}, "READ",
  );
  console.log(`  Bloom instances with bloom-definition INSTANTIATES: ${bloomDefCount.records[0]?.get("cnt")}`);

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
