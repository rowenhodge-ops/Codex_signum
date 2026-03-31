/**
 * M-10.5: Schema Gate Consolidation + Structural Instantiation
 *
 * Stream 1: Consolidate 27 per-LLM Config Seeds → 1 constitutional Config Seed
 * Stream 4a-c: Instantiate G7 Molecule Principle + Property Evolution Governance
 *
 * [NO-PIPELINE] — mechanical graph mutation.
 * All writes via instantiateMorpheme() and createLine(). MERGE-based, idempotent.
 *
 * Usage:
 *   npx tsx scripts/m10-5-graph-setup.ts
 */

import path from "path";
import fs from "fs";
import { readTransaction, closeDriver, runQuery } from "../src/graph/client.js";
import {
  instantiateMorpheme,
  createLine,
  deleteLine,
  updateMorpheme,
} from "../src/graph/instantiation.js";

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

// ─── Helpers ────────────────────────────────────────────────────────

function ok(label: string) {
  console.log(`  \u2713 ${label}`);
}

function fail(label: string, error: string) {
  console.error(`  \u2717 ${label}: ${error}`);
}

// ─── Stream 1: Schema Gate Consolidation ────────────────────────────

async function stream1() {
  console.log("\n=== Stream 1: Schema Gate Consolidation ===\n");

  // 1.1: Diagnostic — find all per-LLM Config Seeds
  const diagResult = await runQuery(
    `MATCH (llm:Bloom)-[:CONTAINS]->(config:Seed)
     WHERE llm.id STARTS WITH 'llm:' AND config.id STARTS WITH 'config:schema-gate:'
     RETURN config.content AS content, count(config) AS copies`,
    {},
    "READ",
  );
  console.log("  Diagnostic: per-LLM Config Seed content groups:");
  for (const rec of diagResult.records) {
    const content = String(rec.get("content") ?? "").substring(0, 80);
    const copies = Number(rec.get("copies"));
    console.log(`    ${copies} copies: "${content}..."`);
  }

  // 1.2: Create constitutional-scope Config Seed
  const configId = "config:schema-gate:learning";
  const configResult = await instantiateMorpheme("seed", {
    id: configId,
    name: "Learning Grid Schema Gate",
    seedType: "config",
    status: "active",
    content:
      "Typed entry requirements for LLM Learning Grids. Only these Seed types may enter: " +
      "failure-signature (requires errorCode: string, taskType: string, contextSize: number), " +
      "calibration-event (requires dimension: string, beforeValue: number, afterValue: number), " +
      "capability-observation (requires taskType: string, capability: string, evidence: string). " +
      "All other operational data goes to structural properties on the Bloom.",
  }, "constitutional-bloom");

  if (configResult.success) {
    ok(`Created/merged ${configId}`);
  } else {
    fail(`${configId}`, configResult.error ?? "unknown");
  }

  // 1.3: Wire FLOWS_TO from constitutional Config Seed to each LLM Bloom's Learning Helix
  const helixResult = await runQuery(
    `MATCH (llm:Bloom)-[:CONTAINS]->(h:Helix)
     WHERE llm.id STARTS WITH 'llm:'
     RETURN h.id AS helixId`,
    {},
    "READ",
  );

  for (const rec of helixResult.records) {
    const helixId = String(rec.get("helixId"));
    const lineResult = await createLine(configId, helixId, "FLOWS_TO");
    if (lineResult.success) {
      ok(`FLOWS_TO ${configId} -> ${helixId}`);
    } else if (lineResult.error?.includes("already exists")) {
      ok(`FLOWS_TO ${configId} -> ${helixId} (already exists)`);
    } else {
      fail(`FLOWS_TO -> ${helixId}`, lineResult.error ?? "unknown");
    }
  }

  // 1.4: Archive per-LLM Config Seeds (except the new constitutional one)
  const perLlmResult = await runQuery(
    `MATCH (llm:Bloom)-[:CONTAINS]->(config:Seed)
     WHERE llm.id STARTS WITH 'llm:'
       AND config.id STARTS WITH 'config:schema-gate:'
       AND config.id <> 'config:schema-gate:learning'
       AND NOT config:Archived
     RETURN llm.id AS bloomId, config.id AS configId`,
    {},
    "READ",
  );

  let archived = 0;
  for (const rec of perLlmResult.records) {
    const bloomId = String(rec.get("bloomId"));
    const seedId = String(rec.get("configId"));

    // Sever CONTAINS edge
    const delResult = await deleteLine(bloomId, seedId, "CONTAINS");
    if (delResult.success) {
      ok(`Severed CONTAINS ${bloomId} -> ${seedId}`);
    } else {
      fail(`Sever CONTAINS ${bloomId} -> ${seedId}`, delResult.error ?? "unknown");
    }

    // Archive the Seed
    const archResult = await updateMorpheme(seedId, {}, undefined, ["Archived"]);
    if (archResult.success) {
      ok(`Archived ${seedId}`);
      archived++;
    } else {
      fail(`Archive ${seedId}`, archResult.error ?? "unknown");
    }
  }
  console.log(`\n  Stream 1 summary: ${archived} per-LLM Config Seeds archived`);
}

// ─── Stream 4a-c: Structural Instantiation ──────────────────────────

async function stream4() {
  console.log("\n=== Stream 4a-c: Structural Instantiation ===\n");

  // 4a: G7 Molecule Principle
  const g7Result = await instantiateMorpheme("seed", {
    id: "def:grammar:g7-molecule-principle",
    name: "G7: Molecule Principle (proposed)",
    seedType: "definition",
    status: "proposed",
    content:
      "G7 \u2014 Molecule Principle: A composition that accumulates structural self-knowledge " +
      "requires a Bloom boundary. Self-knowledge is defined as accumulated operational state: " +
      "Thompson posteriors (weightedSuccesses, weightedFailures), dimensional affinities " +
      "(phiL_code, phiL_analysis, etc.), failure signatures (Learning Grid entries), and drift " +
      "detection state (bocpdState). Identity properties (id, name, status) and derived properties " +
      "(\u03A6L, \u03A8H, \u03B5R) are NOT self-knowledge \u2014 they do not accumulate across executions. " +
      "G7 is independent of G3: a composition can satisfy G3 (containment creates scope) while " +
      "violating G7 (bare Resonators accumulating state without Bloom boundaries). Evidence: " +
      "27 LLM Blooms created in M-10.3 to resolve this violation.",
  }, "constitutional-bloom");

  if (g7Result.success) {
    ok("Created/merged def:grammar:g7-molecule-principle");
  } else {
    fail("def:grammar:g7-molecule-principle", g7Result.error ?? "unknown");
  }

  // 4b: Property Evolution Governance
  const peResult = await instantiateMorpheme("seed", {
    id: "def:governance:property-evolution",
    name: "Property Evolution Governance",
    seedType: "definition",
    status: "active",
    content:
      "Dimensional properties on Bloom nodes are governed by the constitutional dimension set " +
      "(config:dimensional-phi-profiles). The allowed dimensions are: code, analysis, creative, " +
      "structured_output, classification, synthesis. All initialised at 0.0 on creation \u2014 " +
      "0.0 means no evidence, not absence. New dimensions require a Gnosis-mediated constitutional " +
      "amendment cycle \u2014 not ad hoc property additions. \u03B3-recursive update rule: " +
      "\u03B1_new = \u03B3 \u00D7 \u03B1_old + outcome. \u03BB per context from Config Seeds " +
      "(config:lambda:*). The decay IS the forgetting \u2014 \u03B3 = e^(\u2212\u03BB) unifies " +
      "memory decay with Discounted Thompson Sampling.",
  }, "constitutional-bloom");

  if (peResult.success) {
    ok("Created/merged def:governance:property-evolution");
  } else {
    fail("def:governance:property-evolution", peResult.error ?? "unknown");
  }

  // 4c: Verify
  const verifyResult = await runQuery(
    `MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(d:Seed)
     WHERE d.id IN ['def:grammar:g7-molecule-principle', 'def:governance:property-evolution']
     RETURN d.id AS id, d.status AS status, d.name AS name`,
    {},
    "READ",
  );

  console.log("\n  Verification:");
  for (const rec of verifyResult.records) {
    ok(`${rec.get("id")} [${rec.get("status")}] — ${rec.get("name")}`);
  }
  if (verifyResult.records.length < 2) {
    fail("Verification", `Expected 2 definition Seeds, found ${verifyResult.records.length}`);
  }
}

// ─── Verification ───────────────────────────────────────────────────

async function verify() {
  console.log("\n=== Final Verification ===\n");

  // Schema gate consolidation
  const activeConfigs = await runQuery(
    `MATCH (config:Seed)
     WHERE config.id STARTS WITH 'config:schema-gate:' AND NOT config:Archived
     RETURN config.id AS id`,
    {},
    "READ",
  );
  console.log("  Active schema-gate Config Seeds:");
  for (const rec of activeConfigs.records) {
    console.log(`    ${rec.get("id")}`);
  }
  if (activeConfigs.records.length === 1) {
    ok("Exactly 1 active schema-gate Config Seed (expected)");
  } else {
    fail("Schema gate", `Expected 1, found ${activeConfigs.records.length}`);
  }

  // Archived count
  const archivedConfigs = await runQuery(
    `MATCH (config:Seed:Archived)
     WHERE config.id STARTS WITH 'config:schema-gate:'
     RETURN count(config) AS cnt`,
    {},
    "READ",
  );
  const archivedCount = Number(archivedConfigs.records[0]?.get("cnt") ?? 0);
  console.log(`  Archived per-LLM Config Seeds: ${archivedCount}`);
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  try {
    await stream1();
    await stream4();
    await verify();
  } finally {
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
