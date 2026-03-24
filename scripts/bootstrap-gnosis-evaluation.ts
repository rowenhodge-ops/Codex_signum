// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Bootstrap: Gnosis Compliance Evaluation Faculty — Graph Wiring
 *
 * [NO-PIPELINE] — pure graph mutations, no analytical component.
 *
 * Performs:
 *   A1. Discover Gnosis Bloom ID
 *   A2. Reparent Compliance Evaluation Resonator into Gnosis
 *   A3. Reparent Violation Grid into Gnosis
 *   A4. Create evaluation Config Seeds
 *   A5. Wire REFERENCES Lines to Constitutional Bloom content
 *   A6. Wire FLOWS_TO Lines from Architect stage Blooms
 *   A7. Retire def:bloom:assayer
 *   A8. Verification queries
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-gnosis-evaluation.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  runQuery,
  closeDriver,
} from "../src/graph/client.js";
import {
  instantiateMorpheme,
  updateMorpheme,
  createLine,
} from "../src/graph/instantiation.js";

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

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();

  const SEP = "═".repeat(60);
  console.log("\n" + SEP);
  console.log("  BOOTSTRAP: GNOSIS COMPLIANCE EVALUATION FACULTY");
  console.log(SEP);

  // ── A1: Discover Gnosis Bloom ID ──────────────────────────────────
  console.log("\n── A1: Discover Gnosis Bloom ID ────────────────────────────");

  const gnosisResult = await runQuery(
    `MATCH (g:Bloom)-[:INSTANTIATES]->(def:Seed {id: 'def:bloom:cognitive'})
     RETURN g.id AS id`,
    {},
    "READ",
  );

  if (gnosisResult.records.length === 0) {
    console.error("  [FAIL] Gnosis Bloom not found. Has bootstrap-ecosystem been run?");
    process.exit(1);
  }

  const gnosisBloomId = gnosisResult.records[0].get("id") as string;
  console.log(`  [ok] Gnosis Bloom: ${gnosisBloomId}`);

  // ── A2: Reparent Compliance Evaluation Resonator ──────────────────
  console.log("\n── A2: Reparent Compliance Evaluation Resonator ────────────");

  const ceResCheck = await runQuery(
    `MATCH (parent)-[:CONTAINS]->(r:Resonator {id: 'resonator:compliance-evaluation'})
     RETURN parent.id AS parentId`,
    {},
    "READ",
  );

  if (ceResCheck.records.length === 0) {
    console.log("  [SKIP] resonator:compliance-evaluation not found in graph.");
  } else {
    const currentParent = ceResCheck.records[0].get("parentId") as string;
    if (currentParent === gnosisBloomId) {
      console.log(`  [ok] Already contained by ${gnosisBloomId}.`);
    } else {
      console.log(`  Reparenting from '${currentParent}' to '${gnosisBloomId}'...`);
      const reparent = await updateMorpheme("resonator:compliance-evaluation", {}, gnosisBloomId);
      if (reparent.success) {
        console.log(`  [ok] Reparented resonator:compliance-evaluation into ${gnosisBloomId}.`);
      } else {
        console.error(`  [FAIL] ${reparent.error}`);
      }
    }
  }

  // ── A3: Reparent Violation Grid ───────────────────────────────────
  console.log("\n── A3: Reparent Violation Grid ─────────────────────────────");

  const vgCheck = await runQuery(
    `MATCH (parent)-[:CONTAINS]->(g:Grid {id: 'grid:violation:ecosystem'})
     RETURN parent.id AS parentId`,
    {},
    "READ",
  );

  if (vgCheck.records.length === 0) {
    console.log("  [SKIP] grid:violation:ecosystem not found in graph.");
  } else {
    const currentParent = vgCheck.records[0].get("parentId") as string;
    if (currentParent === gnosisBloomId) {
      console.log(`  [ok] Already contained by ${gnosisBloomId}.`);
    } else {
      console.log(`  Reparenting from '${currentParent}' to '${gnosisBloomId}'...`);
      const reparent = await updateMorpheme("grid:violation:ecosystem", {}, gnosisBloomId);
      if (reparent.success) {
        console.log(`  [ok] Reparented grid:violation:ecosystem into ${gnosisBloomId}.`);
      } else {
        console.error(`  [FAIL] ${reparent.error}`);
      }
    }
  }

  // ── A4: Create evaluation Config Seeds ────────────────────────────
  console.log("\n── A4: Create evaluation Config Seeds ─────────────────────");

  const configRules = await instantiateMorpheme("seed", {
    id: "config:gnosis:evaluation-rules",
    name: "Compliance Evaluation Rules",
    content: "Configuration for structural compliance checks. grammarRules: ['G1','G2','G3','G4','G5','G6-highlander']. axioms: ['A1','A2','A3','A4','A6','A7','A8','A9']. antiPatterns: ['monitoring-overlay','intermediary-layer','dimensional-collapse','prescribed-behaviour','governance-theatre','shadow-operations']. G6-highlander is operationally enforced but not yet codified in v5.0 — spec amendment pending. All checks are deterministic Cypher queries. LLM evaluation fires discretely for ambiguous findings only.",
    seedType: "config",
    status: "active",
  }, gnosisBloomId);

  if (configRules.success) {
    console.log(`  [ok] config:gnosis:evaluation-rules → ${gnosisBloomId}`);
  } else if (configRules.error?.includes("ON MATCH")) {
    console.log("  [ok] config:gnosis:evaluation-rules already exists (idempotent).");
  } else {
    console.log(`  [ok] config:gnosis:evaluation-rules: ${configRules.nodeId ?? "merged"}`);
  }

  const configScope = await instantiateMorpheme("seed", {
    id: "config:gnosis:evaluation-scope",
    name: "Evaluation Scope Configuration",
    content: "Topology-driven scope for inline evaluation. A morpheme is evaluated when its parent Bloom has a FLOWS_TO Line to resonator:compliance-evaluation. Explicit invocation (evaluate, sweep) bypasses scope filtering. Recursion boundary: morphemes CONTAINED by the Gnosis Bloom itself are never evaluated — prevents infinite recursion. This includes grid:violation:ecosystem, grid:cognitive-observations, all Gnosis Config Seeds, and all Gnosis Resonators.",
    seedType: "config",
    status: "active",
  }, gnosisBloomId);

  if (configScope.success) {
    console.log(`  [ok] config:gnosis:evaluation-scope → ${gnosisBloomId}`);
  } else {
    console.log(`  [ok] config:gnosis:evaluation-scope: ${configScope.nodeId ?? "merged"}`);
  }

  // ── A5: Wire REFERENCES Lines ─────────────────────────────────────
  console.log("\n── A5: Wire REFERENCES Lines to Constitutional Bloom ──────");

  const constitutionalSeeds = await runQuery(
    `MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(s:Seed)
     WHERE s.seedType IN ['axiom', 'grammar-rule', 'anti-pattern']
     RETURN s.id AS id, s.name AS name, s.seedType AS seedType`,
    {},
    "READ",
  );

  if (constitutionalSeeds.records.length === 0) {
    console.log("  [GAP] No axiom/grammar/anti-pattern Seeds found with expected seedTypes.");
    console.log("  Constitutional content may be stored as spec-section Seeds from M-21.");
    console.log("  REFERENCES Lines can be wired once content is decomposed into individual Seeds.");
  } else {
    let wiredCount = 0;
    for (const rec of constitutionalSeeds.records) {
      const seedId = rec.get("id") as string;

      // Check if REFERENCES Line already exists
      const existsCheck = await runQuery(
        `MATCH (g:Bloom {id: $gnosisBloomId})-[:REFERENCES]->(s:Seed {id: $seedId})
         RETURN count(*) AS cnt`,
        { gnosisBloomId, seedId },
        "READ",
      );
      const cnt = existsCheck.records[0]?.get("cnt");
      const exists = (typeof cnt === "object" && cnt !== null) ? cnt.toNumber?.() > 0 : cnt > 0;

      if (!exists) {
        const line = await createLine(gnosisBloomId, seedId, "REFERENCES", {
          label: "constitutional-reference",
        });
        if (line.success) {
          console.log(`  [ok] REFERENCES: ${gnosisBloomId} → ${seedId}`);
          wiredCount++;
        } else {
          console.error(`  [FAIL] REFERENCES ${seedId}: ${line.error}`);
        }
      } else {
        console.log(`  [ok] REFERENCES: ${gnosisBloomId} → ${seedId} (already exists)`);
      }
    }
    console.log(`  Wired ${wiredCount} new REFERENCES Lines.`);
  }

  // ── A6: Wire FLOWS_TO Lines from Architect stages ─────────────────
  console.log("\n── A6: Wire FLOWS_TO Lines from Architect stages ──────────");

  const stages = await runQuery(
    `MATCH (a:Bloom {id: 'architect'})-[:CONTAINS]->(stage:Bloom)
     WHERE NOT (stage)-[:FLOWS_TO]->(:Resonator {id: 'resonator:compliance-evaluation'})
     RETURN stage.id AS id, stage.name AS name`,
    {},
    "READ",
  );

  if (stages.records.length === 0) {
    console.log("  [ok] All Architect stages already wired (or Architect Bloom not found).");
  } else {
    for (const rec of stages.records) {
      const stageId = rec.get("id") as string;
      const stageName = rec.get("name") as string;
      const line = await createLine(stageId, "resonator:compliance-evaluation", "FLOWS_TO", {
        label: "stage-to-evaluation",
        description: `${stageName} output evaluated by Gnosis Compliance Evaluation`,
      });
      if (line.success) {
        console.log(`  [ok] FLOWS_TO: ${stageId} → resonator:compliance-evaluation`);
      } else {
        console.error(`  [FAIL] FLOWS_TO ${stageId}: ${line.error}`);
      }
    }
  }

  // ── A7: Retire def:bloom:assayer ──────────────────────────────────
  console.log("\n── A7: Retire def:bloom:assayer ────────────────────────────");

  const assayerCheck = await runQuery(
    `MATCH (d:Seed {id: 'def:bloom:assayer'})
     RETURN d.status AS status`,
    {},
    "READ",
  );

  if (assayerCheck.records.length === 0) {
    console.log("  [SKIP] def:bloom:assayer not found in graph.");
  } else {
    const status = assayerCheck.records[0].get("status") as string;
    if (status === "retired") {
      console.log("  [ok] Already retired.");
    } else {
      const retire = await updateMorpheme("def:bloom:assayer", {
        status: "retired",
        content: "RETIRED — Assayer absorbed into Gnosis Bloom as a faculty. The Compliance Evaluation Resonator (def:transformation:compliance-evaluation) remains active inside Gnosis. The separate Assayer Bloom will never be instantiated.",
      });
      if (retire.success) {
        console.log("  [ok] def:bloom:assayer retired.");
      } else {
        console.error(`  [FAIL] ${retire.error}`);
      }
    }
  }

  // ── A8: Verification queries ──────────────────────────────────────
  console.log("\n── A8: Verification ────────────────────────────────────────");

  const checks = [
    {
      name: "Compliance Evaluation Resonator in Gnosis",
      query: `MATCH (g:Bloom {id: $gnosisBloomId})-[:CONTAINS]->(r:Resonator {id: 'resonator:compliance-evaluation'}) RETURN count(r) AS cnt`,
    },
    {
      name: "Violation Grid in Gnosis",
      query: `MATCH (g:Bloom {id: $gnosisBloomId})-[:CONTAINS]->(vg:Grid {id: 'grid:violation:ecosystem'}) RETURN count(vg) AS cnt`,
    },
    {
      name: "Evaluation Config Seeds in Gnosis",
      query: `MATCH (g:Bloom {id: $gnosisBloomId})-[:CONTAINS]->(s:Seed)
              WHERE s.id IN ['config:gnosis:evaluation-rules', 'config:gnosis:evaluation-scope']
              RETURN count(s) AS cnt`,
    },
    {
      name: "REFERENCES Lines to Constitutional content",
      query: `MATCH (g:Bloom {id: $gnosisBloomId})-[:REFERENCES]->(s:Seed) RETURN count(s) AS cnt`,
    },
    {
      name: "FLOWS_TO Lines from Architect stages",
      query: `MATCH (stage)-[:FLOWS_TO]->(r:Resonator {id: 'resonator:compliance-evaluation'}) RETURN count(stage) AS cnt`,
    },
    {
      name: "def:bloom:assayer retired",
      query: `MATCH (d:Seed {id: 'def:bloom:assayer'}) RETURN d.status AS cnt`,
    },
  ];

  let allPass = true;
  for (const check of checks) {
    const result = await runQuery(check.query, { gnosisBloomId }, "READ");
    const cnt = result.records[0]?.get("cnt");
    const value = typeof cnt === "object" && cnt !== null && typeof cnt.toNumber === "function"
      ? cnt.toNumber()
      : cnt;
    const pass = value && value !== 0 && value !== "active"; // "retired" for the assayer check
    const icon = (check.name === "def:bloom:assayer retired")
      ? (value === "retired" ? "  [pass]" : "  [FAIL]")
      : (value > 0 ? "  [pass]" : "  [FAIL]");
    console.log(`${icon} ${check.name}: ${value}`);
    if (check.name === "def:bloom:assayer retired" && value !== "retired") allPass = false;
    else if (check.name !== "def:bloom:assayer retired" && (!value || value === 0)) allPass = false;
  }

  console.log("\n" + SEP);
  if (allPass) {
    console.log("  ALL VERIFICATION CHECKS PASSED");
  } else {
    console.log("  SOME VERIFICATION CHECKS FAILED — review output above");
  }
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
