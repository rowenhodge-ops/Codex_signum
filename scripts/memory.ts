/**
 * M-10.5: Memory CLI
 *
 * Three commands:
 *   memory status [bloomId]     — summary table or per-Bloom detail
 *   memory posteriors [bloomId] — detailed alpha/beta/dimensions
 *   memory recalibrate <bloomId> — partial posterior reset (30% retention)
 *
 * Usage:
 *   npx tsx scripts/memory.ts status
 *   npx tsx scripts/memory.ts posteriors llm:claude-opus-4-6
 *   npx tsx scripts/memory.ts recalibrate llm:claude-opus-4-6
 */

import path from "path";
import fs from "fs";
import { closeDriver, runQuery } from "../src/graph/client.js";
import {
  getMemoryContextForBloom,
  computePartialReset,
  formatMemoryContextForSurvey,
} from "../src/graph/queries/memory-context.js";
import { updateMorpheme } from "../src/graph/instantiation.js";
import type { LLMMemoryContext } from "../src/graph/queries/memory-context.js";

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

async function getAllLLMBloomIds(): Promise<string[]> {
  const result = await runQuery(
    `MATCH (b:Bloom) WHERE b.id STARTS WITH 'llm:' RETURN b.id AS id ORDER BY b.id`,
    {},
    "READ",
  );
  return result.records.map((r) => String(r.get("id")));
}

function pad(s: string, len: number): string {
  return s.length >= len ? s.substring(0, len) : s + " ".repeat(len - s.length);
}

// ─── Commands ───────────────────────────────────────────────────────

async function cmdStatus(bloomId?: string) {
  if (bloomId) {
    // Single-Bloom detail
    const ctx = await getMemoryContextForBloom(bloomId);
    if (!ctx) {
      console.error(`No Bloom found: ${bloomId}`);
      process.exit(1);
    }
    printDetail(ctx);
    return;
  }

  // Summary table
  const ids = await getAllLLMBloomIds();
  if (ids.length === 0) {
    console.log("No LLM Blooms found.");
    return;
  }

  const contexts: LLMMemoryContext[] = [];
  for (const id of ids) {
    const ctx = await getMemoryContextForBloom(id);
    if (ctx) contexts.push(ctx);
  }

  // Table header
  console.log();
  console.log(
    pad("Bloom ID", 32) +
    pad("Mean", 8) +
    pad("Alpha", 8) +
    pad("Beta", 8) +
    pad("Cold?", 7) +
    pad("BOCPD RL", 10) +
    pad("Grid", 6) +
    pad("Fails", 6),
  );
  console.log("-".repeat(85));

  // Sort by posterior mean descending
  contexts.sort((a, b) => b.posteriors.mean - a.posteriors.mean);

  for (const ctx of contexts) {
    const bocpdRL = ctx.bocpd?.currentRunLength !== null && ctx.bocpd?.currentRunLength !== undefined
      ? String(ctx.bocpd.currentRunLength)
      : "-";
    console.log(
      pad(ctx.bloomId, 32) +
      pad(ctx.posteriors.mean.toFixed(3), 8) +
      pad(ctx.posteriors.alpha.toFixed(1), 8) +
      pad(ctx.posteriors.beta.toFixed(1), 8) +
      pad(ctx.isColdStart ? "yes" : "no", 7) +
      pad(bocpdRL, 10) +
      pad(String(ctx.learningGridEntries.length), 6) +
      pad(String(ctx.recentFailures.length), 6),
    );
  }

  console.log();
  console.log(formatMemoryContextForSurvey(contexts));
}

async function cmdPosteriors(bloomId?: string) {
  const ids = bloomId ? [bloomId] : await getAllLLMBloomIds();

  for (const id of ids) {
    const ctx = await getMemoryContextForBloom(id);
    if (!ctx) {
      console.error(`No Bloom found: ${id}`);
      continue;
    }

    console.log(`\n=== ${id} ===`);
    console.log(`  Posteriors: alpha=${ctx.posteriors.alpha.toFixed(3)}, beta=${ctx.posteriors.beta.toFixed(3)}, mean=${ctx.posteriors.mean.toFixed(4)}`);
    console.log(`  Cold start: ${ctx.isColdStart}`);
    console.log(`  Dimensions:`);
    for (const [dim, val] of Object.entries(ctx.dimensions)) {
      console.log(`    ${pad(dim, 20)} ${val.toFixed(4)}`);
    }
    if (ctx.bocpd) {
      console.log(`  BOCPD: run_length=${ctx.bocpd.currentRunLength ?? "null"}, state=${ctx.bocpd.state ? "present" : "null"}`);
    } else {
      console.log(`  BOCPD: no state`);
    }
  }
}

async function cmdRecalibrate(bloomId: string) {
  if (!bloomId) {
    console.error("Usage: memory recalibrate <bloomId>");
    process.exit(1);
  }

  const ctx = await getMemoryContextForBloom(bloomId);
  if (!ctx) {
    console.error(`No Bloom found: ${bloomId}`);
    process.exit(1);
  }

  const before = { alpha: ctx.posteriors.alpha, beta: ctx.posteriors.beta, mean: ctx.posteriors.mean };
  const reset = computePartialReset(before.alpha, before.beta, 0.3);
  const afterMean = reset.alpha / (reset.alpha + reset.beta);

  console.log(`\nRecalibrating ${bloomId} (30% retention):`);
  console.log(`  Before: alpha=${before.alpha.toFixed(3)}, beta=${before.beta.toFixed(3)}, mean=${before.mean.toFixed(4)}`);
  console.log(`  After:  alpha=${reset.alpha.toFixed(3)}, beta=${reset.beta.toFixed(3)}, mean=${afterMean.toFixed(4)}`);

  // Write back: alpha = ws + 1, beta = wf + 1 → ws = alpha - 1, wf = beta - 1
  const result = await updateMorpheme(bloomId, {
    weightedSuccesses: reset.alpha - 1,
    weightedFailures: reset.beta - 1,
    bocpdState: null, // Reset BOCPD state on recalibrate
  });

  if (result.success) {
    console.log(`  \u2713 Posteriors reset. BOCPD state cleared.`);
  } else {
    console.error(`  \u2717 Failed: ${result.error}`);
    process.exit(1);
  }
}

function printDetail(ctx: LLMMemoryContext) {
  console.log(`\n=== ${ctx.bloomId} ===`);
  console.log(`  Status: ${ctx.status}`);
  console.log(`  Cold start: ${ctx.isColdStart}`);
  console.log(`  Posteriors: alpha=${ctx.posteriors.alpha.toFixed(3)}, beta=${ctx.posteriors.beta.toFixed(3)}, mean=${ctx.posteriors.mean.toFixed(4)}`);
  console.log(`  Dimensions:`);
  for (const [dim, val] of Object.entries(ctx.dimensions)) {
    console.log(`    ${pad(dim, 20)} ${val.toFixed(4)}`);
  }
  if (ctx.bocpd) {
    console.log(`  BOCPD: run_length=${ctx.bocpd.currentRunLength ?? "null"}`);
  }
  if (ctx.learningGridEntries.length > 0) {
    console.log(`  Learning Grid (${ctx.learningGridEntries.length} entries):`);
    for (const e of ctx.learningGridEntries.slice(0, 5)) {
      console.log(`    [${e.seedType}] ${e.content.substring(0, 80)}`);
    }
  }
  if (ctx.recentFailures.length > 0) {
    console.log(`  Recent failures (${ctx.recentFailures.length}):`);
    for (const f of ctx.recentFailures) {
      console.log(`    ${f.taskId}: ${f.status} (q=${f.qualityScore.toFixed(2)}, model=${f.modelUsed})`);
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const [command, arg] = process.argv.slice(2);

  if (!command || !["status", "posteriors", "recalibrate"].includes(command)) {
    console.log("Usage: npx tsx scripts/memory.ts <command> [bloomId]");
    console.log("  status [bloomId]       Summary table or per-Bloom detail");
    console.log("  posteriors [bloomId]   Detailed alpha/beta/dimensions");
    console.log("  recalibrate <bloomId>  Partial posterior reset (30% retention)");
    process.exit(1);
  }

  try {
    switch (command) {
      case "status":
        await cmdStatus(arg);
        break;
      case "posteriors":
        await cmdPosteriors(arg);
        break;
      case "recalibrate":
        await cmdRecalibrate(arg);
        break;
    }
  } finally {
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
