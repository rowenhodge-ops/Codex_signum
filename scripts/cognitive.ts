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
import { runPlanningCycle } from "../src/patterns/cognitive/planning.js";
import type { CognitiveIntent } from "../src/patterns/cognitive/types.js";
import type { PlanningReport, IntentCategory } from "../src/patterns/cognitive/planning-types.js";

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
Codex Signum -- Gnosis Cognitive Bloom CLI

Usage:
  npx tsx scripts/cognitive.ts survey <bloomId>     Survey topology + produce intent
  npx tsx scripts/cognitive.ts evaluate <nodeId>     Evaluate one morpheme for compliance
  npx tsx scripts/cognitive.ts sweep <bloomId>       Sweep all children for compliance
  npx tsx scripts/cognitive.ts plan                  Ecosystem-wide planning report

Survey options:
  --cycle=N      Force cycle number (default: auto-increment from Observation Grid)
  --with-llm     Enable LLM substrate for topological gap reasoning
  --scopes=a,b   Comma-separated definition scopes to check (default: ecosystem,architect)

Sweep options:
  --depth=N      Max containment depth (default: 3)
  --include-complete   Include completed morphemes (default: skip)

Plan options:
  --category=X   Filter intents by category (infrastructure, pattern-topology, governance, substrate-grounding)
  --top=N        Show only top N intents (default: all)
  --output=json  Output JSON only (no console summary)

Examples:
  npx tsx scripts/cognitive.ts survey architect
  npx tsx scripts/cognitive.ts evaluate resonator:compliance-evaluation
  npx tsx scripts/cognitive.ts sweep architect --depth=5
  npx tsx scripts/cognitive.ts plan --top=5
  npx tsx scripts/cognitive.ts plan --category=governance
`);
}

interface CliArgs {
  command: "survey" | "evaluate" | "sweep" | "plan";
  targetId: string;
  cycleNumber: number | null;
  withLlm: boolean;
  scopes: string[];
  depth: number;
  includeComplete: boolean;
  planCategory: IntentCategory | null;
  planTop: number | null;
  planOutputJson: boolean;
}

function parseArgs(): CliArgs | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return null;
  }

  const command = args[0] as string;
  if (command !== "survey" && command !== "evaluate" && command !== "sweep" && command !== "plan") {
    console.error(`Unknown command: ${command}. Supported: survey, evaluate, sweep, plan`);
    return null;
  }

  // plan command doesn't require a targetId
  const targetId = command === "plan" ? "" : args[1];
  if (command !== "plan" && !targetId) {
    console.error(`Missing target ID. Usage: npx tsx scripts/cognitive.ts ${command} <id>`);
    return null;
  }

  let cycleNumber: number | null = null;
  let withLlm = false;
  let scopes = ["ecosystem", "architect"];
  let depth = 3;
  let includeComplete = false;
  let planCategory: IntentCategory | null = null;
  let planTop: number | null = null;
  let planOutputJson = false;

  const optArgs = command === "plan" ? args.slice(1) : args.slice(2);
  for (const arg of optArgs) {
    if (arg === "--with-llm") withLlm = true;
    else if (arg === "--include-complete") includeComplete = true;
    else if (arg === "--output=json") planOutputJson = true;
    else if (arg.startsWith("--cycle=")) {
      cycleNumber = parseInt(arg.split("=")[1], 10);
      if (isNaN(cycleNumber) || cycleNumber < 1) cycleNumber = null;
    } else if (arg.startsWith("--scopes=")) {
      scopes = arg.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith("--depth=")) {
      depth = parseInt(arg.split("=")[1], 10);
      if (isNaN(depth) || depth < 1) depth = 3;
    } else if (arg.startsWith("--category=")) {
      const cat = arg.split("=")[1] as IntentCategory;
      const valid: IntentCategory[] = ["infrastructure", "pattern-topology", "governance", "substrate-grounding"];
      if (valid.includes(cat)) planCategory = cat;
    } else if (arg.startsWith("--top=")) {
      planTop = parseInt(arg.split("=")[1], 10);
      if (isNaN(planTop) || planTop < 1) planTop = null;
    }
  }

  return {
    command: command as CliArgs["command"],
    targetId, cycleNumber, withLlm, scopes, depth, includeComplete,
    planCategory, planTop, planOutputJson,
  };
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

  // ── Evaluate command ─────────────────────────────────────────────
  if (cliArgs.command === "evaluate") {
    const { evaluate } = await import("../src/patterns/cognitive/evaluation.js");
    console.log("\n" + SEP);
    console.log("  CODEX SIGNUM -- GNOSIS COMPLIANCE EVALUATION");
    console.log(SEP);
    console.log(`\n  Target: ${cliArgs.targetId}`);

    const result = await evaluate(cliArgs.targetId, "explicit_evaluate");

    console.log(`\n  Verdict: ${result.overallVerdict.toUpperCase()}`);
    console.log(`  Type: ${result.targetType}`);
    console.log(`  Violations: ${result.violationCount}, Warnings: ${result.warningCount}`);
    console.log(`  Time: ${result.processingTimeMs}ms`);
    console.log(`\n  Checks (${result.checks.length}):`);
    for (const check of result.checks) {
      const icon = check.passed ? "  [pass]" : check.severity === "warning" ? "  [WARN]" : "  [FAIL]";
      console.log(`    ${icon} ${check.checkId}: ${check.checkName}`);
      if (!check.passed) {
        console.log(`           ${check.evidence}`);
        if (check.remediation) console.log(`           Fix: ${check.remediation}`);
      }
    }
    console.log("");
    return;
  }

  // ── Sweep command ────────────────────────────────────────────────
  if (cliArgs.command === "sweep") {
    const { sweep } = await import("../src/patterns/cognitive/sweep.js");
    console.log("\n" + SEP);
    console.log("  CODEX SIGNUM -- GNOSIS COMPLIANCE SWEEP");
    console.log(SEP);
    console.log(`\n  Scope Bloom: ${cliArgs.targetId}`);
    console.log(`  Max depth: ${cliArgs.depth}`);
    console.log(`  Include complete: ${cliArgs.includeComplete}`);

    const result = await sweep(cliArgs.targetId, {
      maxDepth: cliArgs.depth,
      includeComplete: cliArgs.includeComplete,
    });

    console.log(`\n  Evaluated: ${result.evaluatedCount}`);
    console.log(`  Pass: ${result.passCount}, Violations: ${result.violationCount}, Warnings: ${result.warningCount}`);
    console.log(`  Time: ${result.processingTimeMs}ms`);

    // Show violations and warnings
    const issues = result.results.filter(r => r.overallVerdict !== "pass");
    if (issues.length > 0) {
      console.log(`\n  Issues (${issues.length}):`);
      for (const r of issues) {
        console.log(`\n    ${r.targetId} (${r.targetType}): ${r.overallVerdict.toUpperCase()}`);
        for (const check of r.checks.filter(c => !c.passed)) {
          console.log(`      [${check.severity}] ${check.checkId}: ${check.evidence}`);
        }
      }
    }
    console.log("");
    return;
  }

  // ── Plan command ───────────────────────────────────────────────
  if (cliArgs.command === "plan") {
    if (cliArgs.planOutputJson) {
      // JSON-only mode — suppress console logs from planning internals
    } else {
      console.log("\n" + SEP);
      console.log("  CODEX SIGNUM -- GNOSIS PLANNING REPORT");
      console.log(SEP);
    }

    const report = await runPlanningCycle();

    // Apply filters
    let filteredIntents = report.intents;
    if (cliArgs.planCategory) {
      filteredIntents = filteredIntents.filter((i) => i.category === cliArgs.planCategory);
    }
    if (cliArgs.planTop) {
      filteredIntents = filteredIntents.slice(0, cliArgs.planTop);
    }

    // Write JSON output
    const outputDir = resolve(process.cwd(), "docs/gnosis-output");
    mkdirSync(outputDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFile = resolve(outputDir, `plan-${ts}.json`);
    writeFileSync(outputFile, JSON.stringify(report, null, 2), "utf-8");

    if (cliArgs.planOutputJson) {
      // JSON to stdout for piping
      console.log(JSON.stringify(report, null, 2));
    } else {
      // Human-readable console output
      console.log("");
      console.log(`  Ecosystem: ${report.ecosystemState.totalBlooms} Blooms, ` +
        `${report.ecosystemState.totalResonators} Resonators, ` +
        `${report.ecosystemState.totalGrids} Grids, ` +
        `${report.ecosystemState.totalHelixes} Helixes`);
      console.log(`  Violations: ${report.activeViolations.total} active ` +
        `(${report.activeViolations.bySeverity.critical} critical, ` +
        `${report.activeViolations.bySeverity.error} error, ` +
        `${report.activeViolations.bySeverity.warning} warning)`);
      console.log(`  Milestones: ${report.milestoneState.complete}/${report.milestoneState.total} complete, ` +
        `${report.milestoneState.unblocked.length} unblocked`);
      console.log(`  Constitutional gaps: ${report.constitutionalGaps}`);

      if (filteredIntents.length > 0) {
        const label = cliArgs.planCategory
          ? `TOP INTENTS [${cliArgs.planCategory}]`
          : "TOP INTENTS (ranked by structural priority)";
        console.log(`\n  --- ${label} ---\n`);

        for (let i = 0; i < filteredIntents.length; i++) {
          const intent = filteredIntents[i];
          const parts: string[] = [];
          if (intent.justification.violationSeverity) {
            parts.push(`Violation: ${intent.justification.violationSeverity}`);
          }
          if (intent.justification.gapType) {
            parts.push(`Gap: ${intent.justification.gapType}`);
          }
          if (intent.justification.lambda2Delta) {
            parts.push(`lambda2 delta: +${intent.justification.lambda2Delta.toFixed(2)}`);
          }
          if (intent.justification.unblocks && intent.justification.unblocks.length > 0) {
            parts.push(`Unblocks: ${intent.justification.unblocks.join(", ")}`);
          }
          console.log(`  ${i + 1}. [${intent.category}] ${intent.description}`);
          console.log(`     Score: ${intent.priorityScore} | ${parts.join(" | ")}`);
          if (intent.architectIntent) {
            console.log(`     Intent: ${intent.architectIntent}`);
          }
          console.log("");
        }
      } else {
        console.log("\n  No intents found.");
      }

      // Category distribution
      const cats = report.byCategory;
      const catNames: IntentCategory[] = ["governance", "pattern-topology", "infrastructure", "substrate-grounding"];
      const totalIntents = report.intents.length || 1;
      console.log("  --- BY CATEGORY ---\n");
      for (const cat of catNames) {
        const count = cats[cat].length;
        const pct = Math.round((count / totalIntents) * 100);
        const filled = Math.round(pct / 5);
        const bar = "\u2588".repeat(filled) + "\u2591".repeat(20 - filled);
        console.log(`  ${cat.padEnd(22)} (${count}): ${bar} ${pct}%`);
      }

      console.log(`\n  Full report: ${outputFile}`);
      console.log(`  Time: ${report.processingTimeMs}ms`);
    }

    console.log("");
    return;
  }

  // ── Survey command (existing) ────────────────────────────────────
  console.log("\n" + SEP);
  console.log("  CODEX SIGNUM -- COGNITIVE BLOOM SURVEY");
  console.log(SEP);
  console.log(`\n  Target: ${cliArgs.targetId}`);
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
    targetBloomId: cliArgs.targetId,
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
