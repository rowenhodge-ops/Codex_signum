// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Cognitive Bloom Graph Bootstrap
 *
 * Instantiates all Cognitive Bloom morphemes in Neo4j via the Highlander Protocol.
 * Idempotent -- safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-cognitive-bloom.ts
 *
 * Requires:
 *   - Neo4j running with Constitutional Bloom + transformation definitions (Prompt 1)
 *   - Highlander Protocol enforced in instantiation.ts
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

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();

  const SEP = "─".repeat(60);
  console.log("\n" + SEP);
  console.log("  COGNITIVE BLOOM BOOTSTRAP");
  console.log(SEP);

  // Discover parent: where does the Architect Bloom live?
  console.log("\n── Discovering parent scope ──────────────────────────────");
  const parentResult = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (architect:Bloom {id: 'architect'})<-[:CONTAINS]-(parent)
       RETURN parent.id AS parentId`,
    );
    return res.records[0]?.get("parentId") as string | undefined;
  });
  const ecosystemParentId = parentResult ?? "constitutional-bloom";
  console.log(`  Parent for Cognitive Bloom: ${ecosystemParentId}`);

  // A.1: Cognitive Bloom
  console.log("\n── A.1: Cognitive Bloom ──────────────────────────────────");
  check("Cognitive Bloom", await instantiateMorpheme("bloom", {
    id: "cognitive-bloom",
    name: "Cognitive Bloom",
    content: "Self-knowledge pattern scope containing structural survey, constitutional delta, and intent synthesis Resonators plus Learning Helix for structural self-diagnosis of the Codex Signum ecosystem.",
    type: "pattern",
    status: "active",
  }, ecosystemParentId,
    { transformationDefId: "def:bloom:cognitive" },
  ));

  // A.2: Structural Survey Resonator
  console.log("\n── A.2: Structural Survey Resonator ─────────────────────");
  check("Structural Survey Resonator", await instantiateMorpheme("resonator", {
    id: "resonator:structural-survey",
    name: "Structural Survey Resonator",
    content: "Takes a Bloom scope ID; queries graph topology via Cypher for spectral properties (lambda2, psiH, phiL), children, internal morphemes, inter-child Lines, INSTANTIATES edges; produces Survey Seed. Deterministic -- no LLM substrate.",
    type: "structural-survey",
    status: "active",
  }, "cognitive-bloom",
    { transformationDefId: "def:transformation:structural-survey" },
  ));

  // A.3: Constitutional Delta Resonator
  console.log("\n── A.3: Constitutional Delta Resonator ──────────────────");
  check("Constitutional Delta Resonator", await instantiateMorpheme("resonator", {
    id: "resonator:constitutional-delta",
    name: "Constitutional Delta Resonator",
    content: "Takes Survey Seed and transformation/bloom definitions from Constitutional Bloom; computes set difference to produce Gap Seeds for missing instances and missing Lines. Deterministic set operations -- no LLM substrate.",
    type: "constitutional-delta",
    status: "active",
  }, "cognitive-bloom",
    { transformationDefId: "def:transformation:constitutional-delta" },
  ));

  // A.4: Intent Synthesis Resonator
  console.log("\n── A.4: Intent Synthesis Resonator ──────────────────────");
  check("Intent Synthesis Resonator", await instantiateMorpheme("resonator", {
    id: "resonator:intent-synthesis",
    name: "Intent Synthesis Resonator",
    content: "Takes Gap Seeds, Learning Helix calibration, and CPT spec Seeds; produces Intent Seed with proposed graph mutations. Deterministic for constitutional gaps (missing instance -> create intent). Uses shared LLM Invocation Resonator (via FLOWS_TO) for topological gaps where reasoning about edge placement exceeds set operations.",
    type: "intent-synthesis",
    status: "active",
  }, "cognitive-bloom",
    { transformationDefId: "def:transformation:intent-synthesis" },
  ));

  // A.5: Learning Helix
  console.log("\n── A.5: Learning Helix ──────────────────────────────────");
  check("Cognitive Learning Helix", await instantiateMorpheme("helix", {
    id: "helix:cognitive-learning",
    name: "Cognitive Learning Helix",
    content: "Scale 2 cross-cycle learning. Reads Cognitive Bloom Observation Grid and Architect/DevAgent Observation Grids via FLOWS_TO Lines. Calibrates Intent Resonator priority weights: which gaps improve lambda2 when closed, how many changes per cycle is optimal, when to stop. Hooks into Distilled Memory Grid for long-term pattern recognition.",
    mode: "learning",
    status: "active",
  }, "cognitive-bloom"));

  // A.6: Observation Grid
  console.log("\n── A.6: Observation Grid ────────────────────────────────");
  check("Cognitive Observation Grid", await instantiateMorpheme("grid", {
    id: "grid:cognitive-observations",
    name: "Cognitive Bloom Observation Grid",
    content: "Records per-cycle survey results: what was found (Survey Seed summary), what was proposed (Intent Seed summary), what was executed (Architect outcome), what changed (post-cycle lambda2 delta). Justified consumer: Learning Helix.",
    type: "observation",
    status: "active",
  }, "cognitive-bloom"));

  // A.7: Config Seeds
  console.log("\n── A.7: Config Seeds ────────────────────────────────────");
  check("Config: Target Scope", await instantiateMorpheme("seed", {
    id: "config:cognitive:target-scope",
    name: "Cognitive Bloom Target Scope",
    content: "Initial survey target: Architect Bloom (id: architect). Expandable to DevAgent, Assayer, full ecosystem as the Cognitive Bloom matures. Each target is surveyed independently per cycle.",
    seedType: "config",
    status: "active",
    targetBloomId: "architect",
  }, "cognitive-bloom"));

  check("Config: Cycle Bounds", await instantiateMorpheme("seed", {
    id: "config:cognitive:cycle-bounds",
    name: "Cognitive Bloom Cycle Bounds",
    content: "Max changes per intent: 5 (prevents oversized deltas). Max cycles before forced GATE review: 3 (even if no individual change triggers GATE). Configurable -- the Learning Helix may adjust these over time.",
    seedType: "config",
    status: "active",
    maxChangesPerIntent: 5,
    maxCyclesBeforeGate: 3,
  }, "cognitive-bloom"));

  check("Config: Priority Weights", await instantiateMorpheme("seed", {
    id: "config:cognitive:priority-weights",
    name: "Cognitive Bloom Priority Weights",
    content: "Gap prioritisation weights. Constitutional completeness: 0.5 (mandatory gaps first). lambda2 improvement: 0.3 (connectivity gains). phiL improvement: 0.2 (health gains). Calibrated by Learning Helix.",
    seedType: "config",
    status: "active",
    constitutionalWeight: 0.5,
    lambda2Weight: 0.3,
    phiLWeight: 0.2,
  }, "cognitive-bloom"));

  // A.8: Lines
  console.log("\n── A.8: Lines ───────────────────────────────────────────");

  // Cognitive Bloom -> Architect Bloom (Intent Seeds flow to Architect)
  check("FLOWS_TO: cognitive-bloom -> architect", await createLine(
    "cognitive-bloom", "architect", "FLOWS_TO", {
      label: "intent-delivery",
      description: "Intent Seeds from Cognitive Bloom flow to Architect for planning and execution",
    },
  ));

  // Cognitive Bloom -> Constitutional Bloom (reads definitions)
  check("FLOWS_TO: cognitive-bloom -> constitutional-bloom", await createLine(
    "cognitive-bloom", "constitutional-bloom", "FLOWS_TO", {
      label: "constitutional-read",
      description: "Cognitive Bloom reads transformation/bloom definitions and CPT spec Seeds for delta computation",
    },
  ));

  // Internal chain: Survey -> Delta -> Intent
  check("FLOWS_TO: survey -> delta", await createLine(
    "resonator:structural-survey", "resonator:constitutional-delta", "FLOWS_TO", {
      label: "survey-to-delta",
      description: "Survey Seed flows from Structural Survey to Constitutional Delta for gap computation",
    },
  ));

  check("FLOWS_TO: delta -> intent", await createLine(
    "resonator:constitutional-delta", "resonator:intent-synthesis", "FLOWS_TO", {
      label: "gaps-to-intent",
      description: "Gap Seeds flow from Constitutional Delta to Intent Synthesis for intent generation",
    },
  ));

  // Learning Helix reads observation Grid
  check("FLOWS_TO: observations -> learning", await createLine(
    "grid:cognitive-observations", "helix:cognitive-learning", "FLOWS_TO", {
      label: "observations-to-learning",
      description: "Cycle observations feed the Learning Helix for priority calibration",
    },
  ));

  // Learning Helix calibrates Intent Resonator
  check("FLOWS_TO: learning -> intent", await createLine(
    "helix:cognitive-learning", "resonator:intent-synthesis", "FLOWS_TO", {
      label: "calibration",
      description: "Learning Helix priority calibration flows to Intent Synthesis",
    },
  ));

  // Intent Resonator -> shared LLM Invocation Resonator (if it exists)
  console.log("\n── A.8 (conditional): LLM Invocation wiring ─────────────");
  const llmInvocationExists = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (r)-[:INSTANTIATES]->(def:Seed {id: 'def:transformation:llm-invocation'})
       WHERE r.status IN ['active', 'planned']
       RETURN r.id AS id LIMIT 1`,
    );
    return res.records.length > 0 ? (res.records[0].get("id") as string) : null;
  });

  if (llmInvocationExists) {
    check("FLOWS_TO: intent -> llm-invocation", await createLine(
      "resonator:intent-synthesis", llmInvocationExists, "FLOWS_TO", {
        label: "topological-reasoning",
        description: "Intent Resonator uses LLM Invocation Resonator for topological gap reasoning",
      },
    ));
  } else {
    console.log("  [skip] LLM Invocation Resonator instance not found.");
    console.log("         First Cognitive Bloom survey cycle will diagnose this as a gap");
    console.log("         and propose creating it -- the system's first act of self-knowledge.");
  }

  // Summary
  console.log("\n" + SEP);
  console.log("  COGNITIVE BLOOM BOOTSTRAP COMPLETE");
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
