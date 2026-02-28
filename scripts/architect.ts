// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

#!/usr/bin/env npx tsx
/**
 * Codex Signum — Architect Self-Hosting CLI
 *
 * Runs the Architect pattern against this repository.
 *
 * Usage:
 *   npx tsx scripts/architect.ts plan "<intent>"
 *   npx tsx scripts/architect.ts plan "<intent>" --auto-gate --dry-run
 *   npx tsx scripts/architect.ts plan "<intent>" --decompose-n=3
 *
 * Requires:
 *   - Neo4j running (bolt://localhost:7687)
 *   - API keys in environment (ANTHROPIC_API_KEY, etc.)
 *   - Agent nodes seeded (run: npx tsx src/bootstrap.ts)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { closeDriver } from "../src/graph/index.js";
import { executePlan } from "../src/patterns/architect/architect.js";
import { survey } from "../src/patterns/architect/survey.js";
import type { PipelineSurveyOutput } from "../src/patterns/architect/types.js";
import { createBootstrapModelExecutor } from "./bootstrap-executor.js";
import {
  createBootstrapTaskExecutor,
  runPreflightChecks,
} from "./bootstrap-task-executor.js";
import { checkVertexAuth } from "./vertex-auth.js";

// ── .env auto-loader ─────────────────────────────────────────────────────────

const ENV_KEYS = [
  "ANTHROPIC_API_KEY",
  "GOOGLE_CLOUD_PROJECT",
  "GOOGLE_API_KEY",
  "NEO4J_URI",
  "NEO4J_USER",
  "NEO4J_USERNAME",
  "NEO4J_PASSWORD",
  "NEO4J_DATABASE",
];

function loadEnvFile(filePath: string): number {
  if (!existsSync(filePath)) return 0;
  let loaded = 0;
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, value] = match;
      const normalizedValue = value.replace(/^["']|["']$/g, "").trim();

      if (key === "NEO4J_USERNAME" && !process.env.NEO4J_USER) {
        process.env.NEO4J_USER = normalizedValue;
        loaded++;
      }

      if (ENV_KEYS.includes(key) && !process.env[key]) {
        process.env[key] = normalizedValue;
        loaded++;
      }
    }
  } catch { /* ignore read errors */ }
  return loaded;
}

function loadEnv(repoPath: string): void {
  const envPath = resolve(repoPath, ".env");

  if (!existsSync(envPath)) {
    console.warn("  ⚠️  No .env file found in repository root.");
    console.warn("     Create one with at minimum: ANTHROPIC_API_KEY=sk-...");
    console.warn("     See .env.example for all supported variables.");
    return;
  }

  const totalLoaded = loadEnvFile(envPath);
  if (totalLoaded > 0) {
    console.log(`  Loaded ${totalLoaded} env var(s) from .env`);
  }
}

// ── CLI argument parsing ────────────────────────────────────────────────────

function printUsage(): void {
  console.log(`
Codex Signum — Architect Self-Hosting CLI

Usage:
  npx tsx scripts/architect.ts plan "<intent>"

Options:
  --auto-gate       Skip human approval at GATE stage
  --dry-run         Tasks execute but make no real changes
  --decompose-n=N   Best-of-N decompose attempts (default: 1)

Examples:
  npx tsx scripts/architect.ts plan "Add hub-aware dampening to cascade propagation"
  npx tsx scripts/architect.ts plan "Fix hysteresis ratio" --auto-gate --dry-run
  npx tsx scripts/architect.ts plan "Implement memory compaction" --decompose-n=3
`);
}

interface CliArgs {
  command: "plan";
  intent: string;
  autoGate: boolean;
  dryRun: boolean;
  decomposeN: number;
}

function parseArgs(): CliArgs | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return null;
  }

  const command = args[0];
  if (command !== "plan") {
    console.error(`Unknown command: ${command}. Only "plan" is supported.`);
    return null;
  }

  const intent = args[1];
  if (!intent) {
    console.error('Missing intent. Usage: npx tsx scripts/architect.ts plan "<intent>"');
    return null;
  }

  let autoGate = false;
  let dryRun = false;
  let decomposeN = 1;

  for (const arg of args.slice(2)) {
    if (arg === "--auto-gate") autoGate = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--decompose-n=")) {
      decomposeN = parseInt(arg.split("=")[1], 10);
      if (isNaN(decomposeN) || decomposeN < 1) decomposeN = 1;
    }
  }

  return { command, intent, autoGate, dryRun, decomposeN };
}

// ── Survey → PipelineSurveyOutput conversion ────────────────────────────────

function toPipelineSurveyOutput(
  surveyResult: Awaited<ReturnType<typeof survey>>,
  intent: string,
): PipelineSurveyOutput {
  return {
    intent_id: surveyResult.surveyId,
    codebase_state: {
      structure: surveyResult.codebaseState.directorySummary.join("\n"),
      recent_changes: surveyResult.codebaseState.recentCommits,
      test_status: "passing" as const,
      open_issues: [],
    },
    graph_state: {
      pattern_health: surveyResult.graphState?.patternHealth ?? {},
      active_cascades: surveyResult.graphState?.activeCascades ?? 0,
      constitutional_alerts:
        surveyResult.graphState?.constitutionalAlerts ?? [],
    },
    gap_analysis: {
      what_exists: surveyResult.gapAnalysis.whatExists,
      what_needs_building: surveyResult.gapAnalysis.whatNeedsBuilding,
      what_needs_changing: surveyResult.gapAnalysis.whatNeedsFixing,
      risks: surveyResult.gapAnalysis.gaps
        .filter((g) => g.severity === "critical")
        .map((g) => g.description),
    },
    confidence: surveyResult.confidence,
    blind_spots: surveyResult.blindSpots.map((bs) => bs.description),
  };

  void intent; // acknowledged — used in surveyId context
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cliArgs = parseArgs();
  if (!cliArgs) {
    printUsage();
    process.exit(1);
  }

  const repoPath = process.cwd();
  const SEP = "═".repeat(70);

  console.log("\n" + SEP);
  console.log("  CODEX SIGNUM — ARCHITECT SELF-HOSTING");
  console.log(SEP);
  console.log(`\n  Intent: ${cliArgs.intent}`);
  console.log(`  Mode:   ${cliArgs.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`  Gate:   ${cliArgs.autoGate ? "AUTO" : "HUMAN"}`);
  console.log(`  DecomposeN: ${cliArgs.decomposeN}`);

  // Load API keys from .env files (only sets vars not already in environment)
  console.log("\n── Environment ─────────────────────────────────────────────");
  loadEnv(repoPath);
  const keyStatus = (k: string) => process.env[k] ? "set" : "MISSING";
  console.log(`  ANTHROPIC_API_KEY: ${keyStatus("ANTHROPIC_API_KEY")}`);
  console.log(`  Vertex AI: (checked below)`);

  // Pre-flight
  console.log("\n── Pre-flight ──────────────────────────────────────────────");
  runPreflightChecks(repoPath);

  // Vertex AI auth check (soft requirement — pipeline runs without it)
  console.log("\n── Vertex AI Auth ──────────────────────────────────────────");
  const vertexAvailable = await checkVertexAuth();
  if (!vertexAvailable) {
    console.log("  ⚠️  Continuing without Vertex AI models (Anthropic only)");
  }

  // SURVEY
  console.log("\n── SURVEY ──────────────────────────────────────────────────");
  const surveyResult = await survey({
    repoPath,
    specificationRefs: [
      "docs/specs/codex-signum-v3_0.md",
      "docs/specs/codex-signum-engineering-bridge-v2_0.md",
      "docs/specs/codex-signum-architect-pattern-design.md",
    ],
    docsPaths: ["docs/specs/", "docs/research/"],
    hypothesesPath: "docs/hypotheses/",
    intent: cliArgs.intent,
  });

  console.log(`  Documents: ${surveyResult.documentSources.length}`);
  console.log(`  Hypotheses: ${surveyResult.hypotheses.length}`);
  console.log(`  Gaps: ${surveyResult.gapAnalysis.gaps.length}`);
  console.log(`  Confidence: ${(surveyResult.confidence * 100).toFixed(0)}%`);
  console.log(`  Blind spots: ${surveyResult.blindSpots.length}`);

  const pipelineSurvey = toPipelineSurveyOutput(surveyResult, cliArgs.intent);

  // Create executors
  const modelExecutor = createBootstrapModelExecutor({ vertexAvailable });
  const taskExecutor = createBootstrapTaskExecutor(modelExecutor);

  // Execute plan
  console.log("\n── EXECUTE PLAN ────────────────────────────────────────────");
  const planState = await executePlan(cliArgs.intent, repoPath, {
    modelExecutor,
    taskExecutor,
    autoGate: cliArgs.autoGate,
    decomposeAttempts: cliArgs.decomposeN,
    parallelDecompose: cliArgs.decomposeN > 1,
    dryRun: cliArgs.dryRun,
  }, pipelineSurvey);

  // Results
  const succeeded = planState.task_outcomes.filter((t) => t.success).length;
  const failed = planState.task_outcomes.filter((t) => !t.success).length;

  console.log("\n" + SEP);
  console.log("  RESULTS");
  console.log(SEP);
  console.log(`  Status: ${planState.status}`);
  console.log(`  Tasks:  ${planState.task_outcomes.length} total (${succeeded} succeeded, ${failed} failed)`);
  console.log(`  Adaptations: ${planState.adaptations_count}`);
  console.log(SEP + "\n");

  if (planState.status === "completed") {
    process.exit(0);
  } else if (planState.status === "aborted") {
    process.exit(1);
  } else {
    process.exit(2);
  }
}

main()
  .catch((err: unknown) => {
    console.error("\n❌ Architect failed:", err);
    process.exit(1);
  })
  .finally(() => {
    void closeDriver();
  });
