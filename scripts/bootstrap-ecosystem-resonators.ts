// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Ecosystem Resonator Instantiation
 *
 * Creates the 5 ecosystem-scoped shared Resonator instances that the
 * Cognitive Bloom's first survey cycle (intent-1.json) diagnosed as missing.
 *
 * Then wires FLOWS_TO Lines from Architect stage Blooms to the shared
 * Resonators, which should make lambda2 go from 0 to nonzero.
 *
 * Idempotent -- safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-ecosystem-resonators.ts
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

// ── Resonator definitions ─────────────────────────────────────────────────

const ECOSYSTEM_RESONATORS = [
  {
    id: "resonator:llm-invocation",
    name: "LLM Invocation Resonator",
    content: "Shared ecosystem Resonator for LLM model invocation. Takes prompt template + context Seeds + model selection; produces output Seed.",
    type: "llm-invocation",
    transformationDefId: "def:transformation:llm-invocation",
  },
  {
    id: "resonator:thompson-selection",
    name: "Thompson Selection Resonator",
    content: "Shared ecosystem Resonator for Thompson sampling model selection. Samples from context-blocked Beta posteriors; produces Decision Seed.",
    type: "thompson-selection",
    transformationDefId: "def:transformation:thompson-selection",
  },
  {
    id: "resonator:compliance-evaluation",
    name: "Compliance Evaluation Resonator",
    content: "Shared ecosystem Resonator for compliance evaluation (Assayer). Evaluates Seeds against grammar rules and axioms; produces pass observation or Violation Seed.",
    type: "compliance-evaluation",
    transformationDefId: "def:transformation:compliance-evaluation",
  },
  {
    id: "resonator:human-gate",
    name: "Human Gate Resonator",
    content: "Shared ecosystem Resonator for human decision gates. Presents Seeds for human approval; captures Decision Seed.",
    type: "human-gate",
    transformationDefId: "def:transformation:human-gate",
  },
  {
    id: "resonator:instantiation",
    name: "Instantiation Resonator",
    content: "Shared ecosystem Resonator for morpheme instantiation. Validates properties, enforces grammar, creates node with CONTAINS + INSTANTIATES in atomic transaction.",
    type: "instantiation",
    transformationDefId: "def:transformation:instantiation",
  },
];

// Wiring map: which Architect stages consume which shared Resonators
const STAGE_WIRING: Record<string, string[]> = {
  "resonator:thompson-selection": ["DECOMPOSE", "DISPATCH"],
  "resonator:llm-invocation": ["SURVEY", "DECOMPOSE", "DISPATCH", "ADAPT"],
  "resonator:human-gate": ["GATE"],
  "resonator:compliance-evaluation": ["CLASSIFY", "ADAPT"],
  "resonator:instantiation": ["DISPATCH"],
};

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

/**
 * Find a stage Bloom matching the given stage name.
 * Tries: stageType/pipelineStage property, name match, id match.
 */
function findStage(
  stages: Array<{ id: string; name: string; stageType: string | null }>,
  stageName: string,
): { id: string; name: string } | null {
  const upper = stageName.toUpperCase();

  // 1. Match on stageType or pipelineStage property
  const byProp = stages.find(
    (s) => s.stageType?.toUpperCase() === upper,
  );
  if (byProp) return byProp;

  // 2. Match on name
  const byName = stages.find(
    (s) => s.name.toUpperCase().includes(upper),
  );
  if (byName) return byName;

  // 3. Match on id
  const byId = stages.find(
    (s) => s.id.toUpperCase().includes(upper),
  );
  if (byId) return byId;

  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();

  const SEP = "─".repeat(60);
  console.log("\n" + SEP);
  console.log("  ECOSYSTEM RESONATOR INSTANTIATION");
  console.log(SEP);

  // Discover parent
  console.log("\n── Parent discovery ─────────────────────────────────────");
  const ecosystemExists = await runQuery(
    `MATCH (e:Bloom {id: 'ecosystem'}) RETURN e.id AS id, e.status AS status`,
    {}, "READ",
  );
  const parentId = ecosystemExists.records.length > 0 ? "ecosystem" : "constitutional-bloom";
  console.log(`  Parent: ${parentId}`);

  // Create Resonators
  console.log("\n── Creating ecosystem Resonators ────────────────────────");
  for (const res of ECOSYSTEM_RESONATORS) {
    const result = await instantiateMorpheme(
      "resonator",
      {
        id: res.id,
        name: res.name,
        content: res.content,
        type: res.type,
        status: "active",
      },
      parentId,
      { transformationDefId: res.transformationDefId },
    );
    logResult(res.id, result);
  }

  // Discover Architect stages (may be :Bloom or :Resonator depending on bootstrap vintage)
  console.log("\n── Discovering Architect stages ─────────────────────────");
  const stageResult = await runQuery(
    `MATCH (architect:Bloom {id: 'architect'})-[:CONTAINS]->(stage)
     RETURN stage.id AS id, stage.name AS name,
            stage.stageType AS stageType, stage.pipelineStage AS pipelineStage,
            labels(stage) AS labels
     ORDER BY stage.id`,
    {}, "READ",
  );

  const stages = stageResult.records.map((r) => ({
    id: r.get("id") as string,
    name: (r.get("name") as string) ?? "",
    stageType: (r.get("stageType") as string | null) ?? (r.get("pipelineStage") as string | null),
  }));

  console.log(`  Discovered ${stages.length} Architect stages:`);
  for (const s of stages) {
    console.log(`    ${s.id} — ${s.name}${s.stageType ? ` [${s.stageType}]` : ""}`);
  }

  // Wire FLOWS_TO from stages to shared Resonators
  console.log("\n── Wiring FLOWS_TO Lines ────────────────────────────────");
  let wiringCount = 0;
  let wiringFailed = 0;

  for (const [resonatorId, stageNames] of Object.entries(STAGE_WIRING)) {
    for (const stageName of stageNames) {
      const stage = findStage(stages, stageName);
      if (stage) {
        const result = await createLine(stage.id, resonatorId, "FLOWS_TO", {
          label: `stage-to-${resonatorId.split(":").pop()}`,
          description: `${stage.name} uses ${resonatorId}`,
        });
        if (result.success) {
          console.log(`  [ok] ${stage.id} -> ${resonatorId}`);
          wiringCount++;
        } else {
          console.log(`  [warn] ${stage.id} -> ${resonatorId}: ${result.error}`);
          wiringFailed++;
        }
      } else {
        console.log(`  [MISS] Stage ${stageName} not found — skipping wiring to ${resonatorId}`);
        console.log(`         Available stages: ${stages.map((s) => s.id).join(", ")}`);
        wiringFailed++;
      }
    }
  }

  // Verification
  console.log("\n── Verification ─────────────────────────────────────────");

  // 1. Count ecosystem Resonators with transformation-level INSTANTIATES
  const resCnt = await runQuery(
    `MATCH (r:Resonator)-[:INSTANTIATES]->(def:Seed)
     WHERE def.seedType = 'transformation-definition' AND def.scope = 'ecosystem'
     RETURN count(DISTINCT r) AS cnt`,
    {}, "READ",
  );
  console.log(`  Ecosystem Resonators with INSTANTIATES: ${resCnt.records[0]?.get("cnt")}`);

  // 2. Check FLOWS_TO Lines from Architect children to shared ecosystem Resonators
  const flowsCnt = await runQuery(
    `MATCH (architect:Bloom {id: 'architect'})-[:CONTAINS]->(stage)
     MATCH (stage)-[:FLOWS_TO]->(res:Resonator)
     WHERE res.id STARTS WITH 'resonator:'
     RETURN count(*) AS cnt`,
    {}, "READ",
  );
  console.log(`  Stage->Resonator FLOWS_TO Lines: ${flowsCnt.records[0]?.get("cnt")}`);

  // 3. Check lambda2 on Architect Bloom
  const architectState = await runQuery(
    `MATCH (a:Bloom {id: 'architect'})
     RETURN a.lambda2 AS lambda2, a.psiH AS psiH, a.phiL AS phiL`,
    {}, "READ",
  );
  if (architectState.records.length > 0) {
    const r = architectState.records[0];
    console.log(`  Architect: lambda2=${r.get("lambda2")}, psiH=${r.get("psiH")}, phiL=${r.get("phiL")}`);
  }

  // Summary
  console.log("\n" + SEP);
  console.log(`  COMPLETE: ${wiringCount} Lines wired, ${wiringFailed} skipped/failed`);
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
