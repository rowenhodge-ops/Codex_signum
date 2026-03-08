#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — DevAgent Self-Hosting CLI
 *
 * Runs coding tasks through SCOPE → EXECUTE → REVIEW → VALIDATE
 * with Thompson Sampling routing per stage.
 *
 * Usage:
 *   npx tsx scripts/dev-agent.ts run "<task description>" [options]
 *
 * Options:
 *   --files=<paths>        Comma-separated files to scope the task to
 *   --complexity=<level>   trivial|moderate|complex|critical (default: moderate)
 *   --domain=<domain>      Task domain for Thompson routing (default: refactor)
 *   --preset=<preset>      full|lite|quick|generate (default: full)
 *   --dry-run              Show what would execute without making changes
 *   --milestone=<label>    Label for commit messages
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { ALL_ARMS } from "../src/bootstrap.js";
import { DevAgent } from "../src/patterns/dev-agent/pipeline.js";
import {
  DEFAULT_DEVAGENT_CONFIG,
  PIPELINE_PRESETS,
} from "../src/patterns/dev-agent/types.js";
import type { AgentTask, PipelineStage } from "../src/patterns/dev-agent/types.js";
import type { RoutableModel } from "../src/patterns/thompson-router/types.js";
import { closeDriver, getDriver } from "../src/graph/client.js";
import {
  getArmStatsForCluster,
  recordDecision,
  recordDecisionOutcome,
  ensureContextCluster,
} from "../src/graph/queries.js";
import { createDevAgentExecutor } from "./bootstrap-devagent-executor.js";
import { verifyProviderAuth, getAvailableProviders, classifyProvider } from "./bootstrap-executor.js";
import { checkVertexAuth } from "./vertex-auth.js";

// ── .env auto-loader (shared with architect.ts) ─────────────────────────

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
  if (existsSync(envPath)) {
    const totalLoaded = loadEnvFile(envPath);
    if (totalLoaded > 0) {
      console.log(`  Loaded ${totalLoaded} env var(s) from .env`);
    }
  }

  // Also try ../DND-Manager/.env (common dev setup)
  const dndEnvPath = resolve(repoPath, "../DND-Manager/.env");
  if (existsSync(dndEnvPath)) {
    const loaded = loadEnvFile(dndEnvPath);
    if (loaded > 0) {
      console.log(`  Loaded ${loaded} env var(s) from ../DND-Manager/.env`);
    }
  }
}

// ── CLI parsing ─────────────────────────────────────────────────────────

interface CliArgs {
  command: "run";
  taskDescription: string;
  files: string[];
  complexity: "trivial" | "moderate" | "complex" | "critical";
  domain: string;
  preset: string;
  dryRun: boolean;
  milestone?: string;
}

function parseArgs(): CliArgs | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return null;
  }

  if (args[0] !== "run") {
    console.error(`Unknown command: ${args[0]}`);
    return null;
  }

  const taskDescription = args[1];
  if (!taskDescription) {
    console.error("Error: task description is required");
    return null;
  }

  const rest = args.slice(2);

  function parseArg(prefix: string): string | undefined {
    const arg = rest.find((a) => a.startsWith(prefix));
    return arg?.slice(prefix.length);
  }

  const files = parseArg("--files=")?.split(",").map((f) => f.trim()) ?? [];
  const complexity = (parseArg("--complexity=") ?? "moderate") as CliArgs["complexity"];
  const domain = parseArg("--domain=") ?? "refactor";
  const preset = parseArg("--preset=") ?? "full";
  const milestone = parseArg("--milestone=");
  const dryRun = rest.includes("--dry-run");

  return { command: "run", taskDescription, files, complexity, domain, preset, dryRun, milestone };
}

function printUsage(): void {
  console.log(`
Codex Signum - DevAgent Self-Hosting CLI

Usage:
  npx tsx scripts/dev-agent.ts run "<task description>" [options]

Options:
  --files=<paths>        Comma-separated files to scope the task to
  --complexity=<level>   trivial|moderate|complex|critical (default: moderate)
  --domain=<domain>      Task domain for Thompson routing (default: refactor)
  --preset=<preset>      full|lite|quick|generate (default: full)
  --dry-run              Show what would execute without making changes
  --milestone=<label>    Milestone label for commit messages

Examples:
  npx tsx scripts/dev-agent.ts run "Rename AgentProps to SeedProps" --files=src/graph/queries.ts
  npx tsx scripts/dev-agent.ts run "Add HumanFeedback constraint" --complexity=trivial --preset=lite
  npx tsx scripts/dev-agent.ts run "Implement feedback CLI" --domain=feature --preset=full
`);
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const cliArgs = parseArgs();
  if (!cliArgs) {
    printUsage();
    process.exit(1);
  }

  const repoPath = process.cwd();

  // Load env
  console.log("\n=== DevAgent Pipeline ===\n");
  loadEnv(repoPath);

  // Pre-flight: check Vertex availability
  const vertexAvailable = await checkVertexAuth();

  // Pre-flight: verify providers
  const authResult = verifyProviderAuth(
    vertexAvailable,
    ALL_ARMS.map((a) => ({ provider: a.provider, status: a.status ?? "active" })),
  );

  console.log(
    `\nProviders: ${authResult.availableModelCount}/${authResult.totalModelCount} models available`,
  );
  for (const p of authResult.providers) {
    console.log(
      `  ${p.available ? "\u2705" : "\u274c"} ${p.provider}${p.error ? ` (${p.error})` : ""}`,
    );
  }

  if (authResult.availableModelCount === 0) {
    console.error("\nNo models available. Set API keys in .env or environment.");
    process.exit(1);
  }

  // Build routable models from ALL_ARMS (filtered to available providers)
  const availableProviders = getAvailableProviders(vertexAvailable);
  const models: RoutableModel[] = ALL_ARMS
    .filter((arm) => {
      const pc = classifyProvider(arm.provider);
      // Must be active, have available provider, AND have code_generation capability
      return (arm.status ?? "active") === "active"
        && availableProviders.has(pc)
        && (arm.capabilities ?? []).includes("code_generation");
    })
    .map((arm) => ({
      id: arm.id,
      name: arm.name,
      provider: arm.provider,
      avgLatencyMs: arm.avgLatencyMs ?? 5000,
      costPer1kTokens: arm.costPer1kTokens ?? (arm.costPer1kInput ?? 0) + (arm.costPer1kOutput ?? 0),
      capabilities: arm.capabilities ?? [],
      status: (arm.status ?? "active") as RoutableModel["status"],
    }));

  console.log(`\nAvailable models: ${models.length} (filtered to code_generation capable)`);

  // Resolve preset
  const stages = PIPELINE_PRESETS[cliArgs.preset] ?? PIPELINE_PRESETS.full;
  console.log(`Pipeline: ${stages.join(" -> ")} (preset: ${cliArgs.preset})`);

  // Read file contents for context injection
  let fileContext = "";
  if (cliArgs.files.length > 0) {
    const FILE_CAP = 32_000; // 32K per file cap (matches Architect analytical cap)
    const TOTAL_CAP = 120_000; // 120K total budget
    let totalChars = 0;

    for (const filePath of cliArgs.files) {
      const resolved = resolve(repoPath, filePath);
      if (!existsSync(resolved)) {
        console.warn(`  Warning: file not found: ${filePath}`);
        continue;
      }
      try {
        let content = readFileSync(resolved, "utf-8");
        if (content.length > FILE_CAP) {
          content = content.slice(0, FILE_CAP) + `\n\n[... truncated at ${FILE_CAP} chars]`;
        }
        if (totalChars + content.length > TOTAL_CAP) {
          console.warn(`  Warning: total file context budget (${TOTAL_CAP} chars) reached, skipping ${filePath}`);
          break;
        }
        fileContext += `\n\n=== FILE: ${filePath} ===\n${content}\n=== END: ${filePath} ===\n`;
        totalChars += content.length;
        console.log(`  Injected: ${filePath} (${content.length} chars)`);
      } catch (err) {
        console.warn(`  Warning: could not read ${filePath}: ${err}`);
      }
    }
  }

  // Build task
  const taskPrompt = fileContext
    ? `${cliArgs.taskDescription}\n\n--- REFERENCE FILES ---\n${fileContext}\n--- END REFERENCE FILES ---`
    : cliArgs.taskDescription;

  const task: AgentTask = {
    id: `da-${Date.now()}`,
    prompt: taskPrompt,
    taskType: cliArgs.domain,
    complexity: cliArgs.complexity,
    domain: cliArgs.domain,
    qualityRequirement: 0.7,
    sourceAcceptanceCriteria: cliArgs.files.length > 0
      ? [`Changes scoped to: ${cliArgs.files.join(", ")}`]
      : undefined,
  };

  if (cliArgs.dryRun) {
    console.log("\n[DRY RUN] Would execute:");
    console.log(JSON.stringify(task, null, 2));
    console.log(`\nModels available: ${models.map((m) => m.id).join(", ")}`);
    process.exit(0);
  }

  // Create executor and assessor
  const { executor, assessor } = createDevAgentExecutor(ALL_ARMS, vertexAvailable);

  // Create DevAgent with lifecycle hooks
  const agent = new DevAgent(models, executor, assessor, {
    ...DEFAULT_DEVAGENT_CONFIG,
    stages,
    afterStage: async (stage, result, _task) => {
      console.log(
        `\n  [${stage.toUpperCase()}] Model: ${result.modelId} | Quality: ${result.qualityScore.toFixed(2)} | ${result.durationMs}ms`,
      );
      if (result.correctionIteration > 0) {
        console.log(
          `    Correction iteration ${result.correctionIteration}`,
        );
      }
    },
  });

  // Load Thompson priors from graph (if Neo4j available)
  let graphAvailable = false;
  try {
    getDriver();
    graphAvailable = true;

    for (const stage of stages) {
      const clusterId = `${cliArgs.domain}:${stage}:${cliArgs.complexity}`;
      const stats = await getArmStatsForCluster(clusterId);
      if (stats.length > 0) {
        agent.loadArmStats(clusterId, stats);
        console.log(
          `  Thompson priors loaded: ${stats.length} arms for ${clusterId}`,
        );
      }
    }
  } catch {
    console.log("  Neo4j unavailable — uniform Thompson priors");
  }

  // Run pipeline
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Task: ${cliArgs.taskDescription}`);
  console.log(`Files: ${cliArgs.files.join(", ") || "(none specified)"}`);
  console.log(`Complexity: ${cliArgs.complexity} | Domain: ${cliArgs.domain}`);
  console.log("=".repeat(50));

  const result = await agent.run(task);

  // Report results
  console.log(`\n${"=".repeat(50)}`);
  console.log("RESULT");
  console.log("=".repeat(50));
  console.log(`Quality: ${result.overallQuality.toFixed(2)}`);
  console.log(`Corrections: ${result.correctionCount}`);
  console.log(`Duration: ${result.totalDurationMs}ms`);
  console.log(
    `Stages: ${result.stages.map((s) => `${s.stage}(${s.modelId})`).join(" -> ")}`,
  );

  // Write output to docs/pipeline-output/
  const runId = task.id;
  const outputDir = join(repoPath, "docs", "pipeline-output", runId);
  mkdirSync(outputDir, { recursive: true });

  // Write final output
  writeFileSync(
    join(outputDir, "output.md"),
    `# DevAgent Output: ${cliArgs.taskDescription}\n\n${result.finalOutput}`,
  );

  // Write per-stage outputs
  for (const stage of result.stages) {
    writeFileSync(
      join(outputDir, `${stage.stage}.md`),
      `# ${stage.stage.toUpperCase()} (${stage.modelId})\n\nQuality: ${stage.qualityScore.toFixed(2)} | Duration: ${stage.durationMs}ms\n\n${stage.output}`,
    );
  }

  // Write manifest
  const manifest = {
    runId,
    pipeline: "dev-agent",
    task: cliArgs.taskDescription,
    preset: cliArgs.preset,
    complexity: cliArgs.complexity,
    domain: cliArgs.domain,
    files: cliArgs.files,
    overallQuality: result.overallQuality,
    correctionCount: result.correctionCount,
    totalDurationMs: result.totalDurationMs,
    stages: result.stages.map((s) => ({
      stage: s.stage,
      modelId: s.modelId,
      qualityScore: s.qualityScore,
      durationMs: s.durationMs,
      wasExploratory: s.wasExploratory,
      correctionIteration: s.correctionIteration,
    })),
    milestone: cliArgs.milestone,
    timestamp: new Date().toISOString(),
  };
  writeFileSync(join(outputDir, "_manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\nOutput: ${outputDir}`);

  // Record decisions to graph (Thompson learning)
  if (graphAvailable) {
    for (const decision of result.decisions) {
      try {
        const clusterId = `${decision.context.domain}:${decision.context.taskType.split(":").pop()}:${decision.context.complexity}`;
        await ensureContextCluster({
          id: clusterId,
          taskType: decision.context.taskType,
          complexity: decision.context.complexity,
          domain: decision.context.domain,
        });
        await recordDecision({
          id: decision.id,
          taskType: decision.context.taskType,
          complexity: decision.context.complexity as "trivial" | "moderate" | "complex" | "critical",
          domain: decision.context.domain,
          selectedSeedId: decision.selected,
          wasExploratory: decision.outcome?.wasExploratory ?? false,
          contextClusterId: clusterId,
        });
        if (decision.outcome) {
          await recordDecisionOutcome({
            decisionId: decision.id,
            success: decision.outcome.success,
            qualityScore: decision.outcome.qualityScore,
            durationMs: decision.outcome.durationMs,
            cost: decision.outcome.cost,
          });
        }
      } catch (err) {
        console.warn(`  Warning: failed to record decision ${decision.id}:`, err);
      }
    }
    console.log(`  Recorded ${result.decisions.length} decisions to graph`);
  }

  console.log(`\nRun ID: ${runId}`);
  console.log(`Provide feedback: npx tsx scripts/feedback.ts <accept|reject> ${runId}`);

  if (graphAvailable) {
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
