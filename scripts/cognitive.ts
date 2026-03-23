// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Cognitive Bloom CLI
 *
 * Runs a self-survey cycle against a target Bloom.
 * Produces an Intent Seed that can be fed to the Architect.
 *
 * Usage:
 *   npx tsx scripts/cognitive.ts survey architect
 *   npx tsx scripts/cognitive.ts survey architect --cycle=1
 *   npx tsx scripts/cognitive.ts survey architect --with-llm
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { readTransaction, closeDriver } from "../src/graph/client.js";
import { runCognitiveCycle } from "../src/patterns/cognitive/index.js";
import type { CognitiveIntent } from "../src/patterns/cognitive/types.js";

// ── .env auto-loader ──────────────────────────────────────────────────────

const ENV_KEYS = [
  "ANTHROPIC_API_KEY",
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

// ── CLI ───────────────────────────────────────────────────────────────────

function printUsage(): void {
  console.log(`
Codex Signum -- Cognitive Bloom CLI

Usage:
  npx tsx scripts/cognitive.ts survey <bloomId>

Options:
  --cycle=N      Force cycle number (default: auto-increment from Observation Grid)
  --with-llm     Enable LLM substrate for topological gap reasoning
  --scopes=a,b   Comma-separated definition scopes to check (default: ecosystem,architect)

Examples:
  npx tsx scripts/cognitive.ts survey architect
  npx tsx scripts/cognitive.ts survey architect --cycle=1
  npx tsx scripts/cognitive.ts survey architect --with-llm --scopes=ecosystem,architect,dev-agent
`);
}

interface CliArgs {
  command: "survey";
  targetBloomId: string;
  cycleNumber: number | null;
  withLlm: boolean;
  scopes: string[];
}

function parseArgs(): CliArgs | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return null;
  }

  const command = args[0];
  if (command !== "survey") {
    console.error(`Unknown command: ${command}. Only "survey" is supported.`);
    return null;
  }

  const targetBloomId = args[1];
  if (!targetBloomId) {
    console.error("Missing target Bloom ID. Usage: npx tsx scripts/cognitive.ts survey <bloomId>");
    return null;
  }

  let cycleNumber: number | null = null;
  let withLlm = false;
  let scopes = ["ecosystem", "architect"];

  for (const arg of args.slice(2)) {
    if (arg === "--with-llm") withLlm = true;
    else if (arg.startsWith("--cycle=")) {
      cycleNumber = parseInt(arg.split("=")[1], 10);
      if (isNaN(cycleNumber) || cycleNumber < 1) cycleNumber = null;
    } else if (arg.startsWith("--scopes=")) {
      scopes = arg.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  return { command, targetBloomId, cycleNumber, withLlm, scopes };
}

/**
 * Auto-detect cycle number from the Observation Grid.
 */
async function getNextCycleNumber(): Promise<number> {
  try {
    const maxCycle = await readTransaction(async (tx) => {
      const res = await tx.run(
        `MATCH (g:Grid {id: 'grid:cognitive-observations'})-[:CONTAINS]->(obs:Seed)
         WHERE obs.seedType = 'observation' AND obs.cycleNumber IS NOT NULL
         RETURN max(obs.cycleNumber) AS maxCycle`,
      );
      if (res.records.length === 0) return 0;
      return (res.records[0].get("maxCycle") as number) ?? 0;
    });
    return maxCycle + 1;
  } catch {
    return 1;
  }
}

/**
 * Read config Seeds from the Cognitive Bloom.
 */
async function readConfigSeeds(): Promise<{
  maxChanges: number;
  priorityWeights: { constitutional: number; lambda2: number; phiL: number };
}> {
  try {
    const config = await readTransaction(async (tx) => {
      const bounds = await tx.run(
        `MATCH (s:Seed {id: 'config:cognitive:cycle-bounds'})
         RETURN s.maxChangesPerIntent AS maxChanges`,
      );
      const weights = await tx.run(
        `MATCH (s:Seed {id: 'config:cognitive:priority-weights'})
         RETURN s.constitutionalWeight AS cw, s.lambda2Weight AS lw, s.phiLWeight AS pw`,
      );
      return {
        maxChanges: bounds.records[0]?.get("maxChanges") as number ?? 5,
        cw: weights.records[0]?.get("cw") as number ?? 0.5,
        lw: weights.records[0]?.get("lw") as number ?? 0.3,
        pw: weights.records[0]?.get("pw") as number ?? 0.2,
      };
    });
    return {
      maxChanges: config.maxChanges,
      priorityWeights: {
        constitutional: config.cw,
        lambda2: config.lw,
        phiL: config.pw,
      },
    };
  } catch {
    // Defaults if Config Seeds not found
    return {
      maxChanges: 5,
      priorityWeights: { constitutional: 0.5, lambda2: 0.3, phiL: 0.2 },
    };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cliArgs = parseArgs();
  if (!cliArgs) {
    printUsage();
    process.exit(1);
  }

  loadEnv();

  const SEP = "═".repeat(60);
  console.log("\n" + SEP);
  console.log("  CODEX SIGNUM -- COGNITIVE BLOOM SURVEY");
  console.log(SEP);
  console.log(`\n  Target: ${cliArgs.targetBloomId}`);
  console.log(`  Scopes: ${cliArgs.scopes.join(", ")}`);
  console.log(`  LLM:    ${cliArgs.withLlm ? "enabled" : "disabled"}`);

  // Resolve cycle number
  const cycleNumber = cliArgs.cycleNumber ?? await getNextCycleNumber();
  console.log(`  Cycle:  ${cycleNumber}`);

  // Read config
  const config = await readConfigSeeds();
  console.log(`  Max changes: ${config.maxChanges}`);
  console.log(`  Weights: constitutional=${config.priorityWeights.constitutional}, lambda2=${config.priorityWeights.lambda2}, phiL=${config.priorityWeights.phiL}`);

  // Optional ModelExecutor for topological reasoning
  let modelExecutor;
  if (cliArgs.withLlm) {
    try {
      const { createBootstrapModelExecutor } = await import("./bootstrap-executor.js");
      modelExecutor = createBootstrapModelExecutor({ vertexAvailable: false });
      console.log("  ModelExecutor: bootstrap (Anthropic)");
    } catch (err) {
      console.warn(`  ModelExecutor: failed to create (${err instanceof Error ? err.message : String(err)})`);
      console.warn("  Continuing without LLM -- topological gaps will be advisory only.");
    }
  }

  // Run cycle
  console.log("\n── CYCLE " + cycleNumber + " ─────────────────────────────────────────────");
  const intent = await runCognitiveCycle({
    targetBloomId: cliArgs.targetBloomId,
    definitionScopes: cliArgs.scopes,
    cycleNumber,
    maxChanges: config.maxChanges,
    priorityWeights: config.priorityWeights,
    modelExecutor,
  });

  if (intent) {
    // Write intent to file
    const outputDir = resolve(process.cwd(), "docs/cognitive-output");
    mkdirSync(outputDir, { recursive: true });
    const outputFile = resolve(outputDir, `intent-${cycleNumber}.json`);
    writeFileSync(outputFile, JSON.stringify(intent, null, 2), "utf-8");

    console.log("\n" + SEP);
    console.log("  INTENT PRODUCED");
    console.log(SEP);
    console.log(`  File: docs/cognitive-output/intent-${cycleNumber}.json`);
    console.log(`  Type: ${intent.gapType}`);
    console.log(`  Changes: ${intent.proposedChanges.length}`);
    console.log(`  Pre-survey: lambda2=${intent.preSurveyLambda2}, psiH=${intent.preSurveyPsiH}`);
    console.log("");
    console.log("  Feed to Architect:");
    console.log(`    npx tsx scripts/architect.ts plan --intent-file=docs/cognitive-output/intent-${cycleNumber}.json`);
  } else {
    console.log("\n" + SEP);
    console.log("  NO GAPS FOUND");
    console.log(SEP);
    console.log("  Topology matches constitution. No intent produced.");
  }

  console.log("");
}

main()
  .catch((err: unknown) => {
    console.error("\nCognitive survey failed:", err);
    process.exit(1);
  })
  .finally(() => {
    void closeDriver();
  });
