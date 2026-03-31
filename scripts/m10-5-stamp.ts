/**
 * M-10.5 + M-10 Stamp Script
 *
 * [NO-PIPELINE] — mechanical graph mutation.
 * 1. Create M-10.5 exit criteria Seeds
 * 2. Stamp M-10.5 complete
 * 3. Stamp parent M-10 complete (all 5 sub-milestones done)
 *
 * Usage:
 *   npx tsx scripts/m10-5-stamp.ts
 */

import path from "path";
import fs from "fs";
import { closeDriver } from "../src/graph/client.js";
import {
  instantiateMorpheme,
  stampBloomComplete,
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

// ─── Exit Criteria ──────────────────────────────────────────────────

const ecs = [
  {
    id: "M-10.5:ec-15",
    name: "End-to-end path verified",
    content:
      "End-to-end memory chain verified via integration tests: cold start \u2192 \u03B3-recursive posterior update " +
      "(computeTemporalDecay + inline ws/wf update) \u2192 BOCPD drift detection (BOCPDDetector.update + hybrid trigger " +
      "at 0.7) \u2192 partial reset if drift (computePartialReset 30% retention) \u2192 Thompson reads structural posteriors " +
      "(getDecayWeightedPosteriors from Bloom properties) \u2192 SURVEY reads memory context (getMemoryContextForBloom \u2192 " +
      "formatMemoryContextForSurvey). Shadow memory system killed: processMemoryAfterExecution, runCompaction, " +
      "checkAndDistill all throw [DEPRECATED]. Pipeline rewired to updateStructuralMemoryAfterExecution which resolves " +
      "arm ID \u2192 LLM Bloom and updates THAT Bloom\u2019s posteriors.",
  },
  {
    id: "M-10.5:ec-16",
    name: "CLI operational",
    content:
      "scripts/memory.ts CLI with three commands: memory status [bloomId] (summary table of all 27 LLM Blooms sorted " +
      "by posterior mean, or per-Bloom detail with dimensions/BOCPD/grid entries/failures), memory posteriors [bloomId] " +
      "(detailed alpha/beta/dimensions), memory recalibrate <bloomId> (partial posterior reset with 30% retention via " +
      "computePartialReset + BOCPD state clear). All verified live against Neo4j.",
  },
  {
    id: "M-10.5:ec-17",
    name: "Spec revisions structurally instantiated",
    content:
      "def:grammar:g7-molecule-principle (status: proposed) and def:governance:property-evolution (status: active) " +
      "instantiated as definition Seeds in Constitutional Bloom. Schema gate consolidated: 27 identical per-LLM " +
      "config:schema-gate:* Seeds archived via addLabels Archived + CONTAINS severed via deleteLine. One constitutional " +
      "config:schema-gate:learning created with FLOWS_TO Lines to 27 Learning Helixes. 5 human-readable projection " +
      "documents in docs/specs/drafts/ (memory topology rewrite, G7 molecule principle, property evolution governance, " +
      "Bridge v3.0 Part 7 delta, MIM v3.0 delta) \u2014 each carries header noting graph is source of truth.",
  },
];

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  try {
    // Step 1: Create exit criteria Seeds
    console.log("\n=== Step 1: Create M-10.5 Exit Criteria ===\n");
    for (const ec of ecs) {
      const result = await instantiateMorpheme("seed", {
        id: ec.id,
        name: ec.name,
        seedType: "exit-criterion",
        status: "complete",
        content: ec.content,
      }, "M-10.5");

      if (result.success) {
        console.log(`  \u2713 ${ec.id}: ${ec.name}`);
      } else {
        console.error(`  \u2717 ${ec.id}: ${result.error}`);
      }
    }

    // Step 2: Stamp M-10.5
    console.log("\n=== Step 2: Stamp M-10.5 Complete ===\n");
    const m105Result = await stampBloomComplete({
      bloomId: "M-10.5",
      commitSha: "8f03809",
      testCount: 1781,
    });
    console.log("M-10.5 stamp:", JSON.stringify(m105Result, null, 2));

    if (!m105Result.success) {
      console.error("\nM-10.5 stamp FAILED. Aborting M-10 stamp.");
      return;
    }

    // Step 3: Stamp parent M-10
    console.log("\n=== Step 3: Stamp M-10 Complete ===\n");
    const m10Result = await stampBloomComplete({
      bloomId: "M-10",
      commitSha: "8f03809",
      testCount: 1781,
    });
    console.log("M-10 stamp:", JSON.stringify(m10Result, null, 2));
  } finally {
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
