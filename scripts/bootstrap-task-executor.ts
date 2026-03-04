// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Bootstrap TaskExecutor — executes tasks via LLM, writes output to
 * docs/pipeline-output/ (NEVER to source files).
 *
 * The `files_affected` field on each task is treated as READ context —
 * those files are included in the LLM prompt so the model can reason
 * about them. Output always goes to a timestamped pipeline-output dir.
 *
 * NOT part of the npm package. Dev tooling only.
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  ModelExecutor,
  Task,
  TaskExecutionContext,
  TaskExecutor,
  TaskOutcome,
} from "../src/patterns/architect/types.js";
import { detectUnsourcedReferences } from "../src/patterns/architect/hallucination-detection.js";
import {
  createPipelineRun,
  completePipelineRun,
  createTaskOutput,
  ensureArchitectResonators,
  linkTaskOutputToStage,
  updateDecisionQuality,
  recordObservation,
} from "../src/graph/queries.js";

// ── Pre-flight checks ──────────────────────────────────────────────────────

export function runPreflightChecks(repoPath: string): void {
  // Verify we're in the right repo
  try {
    const remotes = execSync("git remote -v", {
      cwd: repoPath,
      encoding: "utf-8",
    });
    if (!remotes.includes("Codex_signum") && !remotes.includes("codex-signum")) {
      console.warn(
        "⚠️  Warning: git remote does not appear to be Codex_signum. Continuing anyway.",
      );
    }
  } catch {
    throw new Error("Pre-flight failed: not a git repository");
  }

  // Verify working tree is clean
  try {
    const status = execSync("git status --porcelain", {
      cwd: repoPath,
      encoding: "utf-8",
    });
    if (status.trim().length > 0) {
      throw new Error(
        `Pre-flight failed: working tree is not clean.\n${status}`,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Pre-flight")) throw err;
    throw new Error("Pre-flight failed: could not check git status");
  }

  // Verify TypeScript compiles
  try {
    execSync("npx tsc --noEmit", {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    throw new Error("Pre-flight failed: TypeScript compilation errors");
  }

  console.log("✅ Pre-flight checks passed.");
}

// ── Output isolation helpers ────────────────────────────────────────────────

/** Generate a run ID from the plan ID (timestamp-based) */
function deriveRunId(planId: string): string {
  // planId is "plan_<timestamp>", extract and format the timestamp
  const tsMatch = planId.match(/plan_(\d+)/);
  if (tsMatch) {
    const date = new Date(Number(tsMatch[1]));
    return date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  }
  // Fallback: generate from current time
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

/** Build a safe output filename from a task */
function getOutputPath(task: Task, runId: string, repoPath: string): string {
  const outputDir = join(repoPath, "docs", "pipeline-output", runId);
  mkdirSync(outputDir, { recursive: true });

  const safeName = task.task_id + "-" +
    (task.title ?? "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

  return join(outputDir, safeName + ".md");
}

/** Max total chars across all files for context injection */
export const MAX_TOTAL_CONTEXT_CHARS = 120_000;

/**
 * Priority rank for file prioritisation: lower number = included first.
 * Spec files get highest priority so they are never truncated by budget exhaustion.
 */
function filePriority(filePath: string): number {
  if (filePath.startsWith("docs/specs/")) return 0;
  if (filePath.startsWith("docs/")) return 1;
  if (filePath.startsWith("src/")) return 2;
  return 3;
}

/**
 * Read files_affected as context for the LLM prompt.
 *
 * Analytical tasks (generative) get a higher per-file cap (48K) because
 * specification documents are 10-40KB. Mechanical tasks keep the 8K cap
 * since code files are typically shorter.
 *
 * Files are processed in priority order: docs/specs/ → docs/ → src/ → other.
 * This ensures primary reference documents get full context before implementation
 * files consume the budget.
 */
export function readFileContext(task: Task, repoPath: string): string {
  if (!task.files_affected.length) return "";

  // Analytical tasks get more context (specs are 10-40KB). Increased 32K→48K
  // after R1 optimisation run showed context starvation causing fabrication.
  const perFileCap = task.type === "mechanical" ? 8000 : 48000;

  // Prioritise: specs first, then docs, then src, then other.
  const prioritised = [...task.files_affected].sort(
    (a, b) => filePriority(a) - filePriority(b),
  );

  let context = "";
  let totalChars = 0;

  for (const filePath of prioritised) {
    if (totalChars >= MAX_TOTAL_CONTEXT_CHARS) {
      context += `\n\n--- File: ${filePath} --- (skipped: total context limit reached)`;
      continue;
    }
    const fullPath = join(repoPath, filePath);
    try {
      const content = readFileSync(fullPath, "utf-8");
      const remaining = MAX_TOTAL_CONTEXT_CHARS - totalChars;
      const cap = Math.min(perFileCap, remaining);
      const capped = content.length > cap
        ? content.slice(0, cap) + `\n... (truncated at ${cap} chars)`
        : content;
      context += `\n\n--- File: ${filePath} ---\n${capped}`;
      totalChars += capped.length;
    } catch {
      context += `\n\n--- File: ${filePath} --- (NOT FOUND — this is a defect in DECOMPOSE)`;
    }
  }
  return context;
}

// ── Run manifest ────────────────────────────────────────────────────────────

export interface ManifestTask {
  taskId: string;
  title: string;
  type: string;
  model: string;
  provider: string;
  thinkingMode: string;
  thinkingParameter: string | undefined;
  status: "succeeded" | "failed";
  durationMs: number;
  outputFile: string;
  outputChars: number;
}

export interface RunManifest {
  runId: string;
  intent: string;
  startedAt: string;
  completedAt: string;
  tasks: ManifestTask[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    totalDurationMs: number;
    totalOutputChars: number;
    modelsUsed: string[];
  };
}

// ── TaskExecutor implementation ─────────────────────────────────────────────

/** Opt-in configuration for graph writes alongside markdown output */
export interface BootstrapExecutorConfig {
  /** If true, pipeline run data will be written to the graph */
  graphEnabled?: boolean;
  /** Bloom ID for the Architect pattern (required if graphEnabled) */
  architectBloomId?: string;
}

export interface BootstrapTaskExecutorBundle {
  executor: TaskExecutor;
  /** Write the run manifest after all tasks complete and return it */
  writeManifest(): Promise<RunManifest | null>;
}

/** Max chars of prior-task output injected per task for synthesis context */
export const MAX_PRIOR_OUTPUT_CHARS = 6000;

/** Detect whether a task is a synthesis/consolidation task that needs prior outputs */
export function isSynthesisTask(task: Task, isLastPhase: boolean): boolean {
  const synthesisPattern = /consolidat|synthesiz|final.report|summary.of|across.all/i;
  const text = `${task.description} ${task.acceptance_criteria.join(" ")}`;
  return synthesisPattern.test(text) || isLastPhase;
}

/** Canonical reference constants for consistency checking */
export const CANONICAL_AXIOM_NAMES = [
  "Symbiosis", "Transparency", "Fidelity", "Visible State",
  "Minimal Authority", "Provenance", "Reversibility",
  "Semantic Stability", "Comprehension Primacy", "Adaptive Pressure",
] as const;

export const CANONICAL_PIPELINE_STAGES = [
  "SURVEY", "DECOMPOSE", "CLASSIFY", "SEQUENCE", "GATE", "DISPATCH", "ADAPT",
] as const;

/** Canonical morpheme names (post-M-7C: Agent→Seed, Pattern→Bloom) */
export const CANONICAL_MORPHEME_NAMES = [
  "Seed", "Line", "Bloom", "Resonator", "Grid", "Helix",
] as const;

export interface ConsistencyIssue {
  type: "metric-divergence" | "wrong-axiom-name" | "wrong-stage-name" | "entity-existence-contradiction";
  description: string;
  tasks: string[];
}

export interface ConsistencyReport {
  issues: ConsistencyIssue[];
  checkedAt: string;
  taskCount: number;
}

/**
 * Scan all task outputs for consistency issues:
 * 1. Percentage values with same label but >20% relative difference
 * 2. Axiom names not matching the canonical 10
 * 3. Pipeline stage names not in SURVEY/DECOMPOSE/.../ADAPT
 */
export function checkConsistency(
  taskOutputs: Map<string, { title: string; output: string }>,
): ConsistencyReport {
  const issues: ConsistencyIssue[] = [];

  // 1. Metric divergence: find "label: NN%" patterns and compare
  const metricsByLabel = new Map<string, { value: number; taskId: string }[]>();
  const pctPattern = /([A-Za-z][A-Za-z_ -]{2,30}):\s*(\d{1,3}(?:\.\d+)?)%/g;

  for (const [taskId, { output }] of taskOutputs) {
    let match: RegExpExecArray | null;
    while ((match = pctPattern.exec(output)) !== null) {
      const label = match[1].trim().toLowerCase();
      const value = parseFloat(match[2]);
      if (!metricsByLabel.has(label)) metricsByLabel.set(label, []);
      metricsByLabel.get(label)!.push({ value, taskId });
    }
  }

  for (const [label, entries] of metricsByLabel) {
    if (entries.length < 2) continue;
    const values = entries.map((e) => e.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min > 0 && (max - min) / min > 0.2) {
      issues.push({
        type: "metric-divergence",
        description: `"${label}" ranges from ${min}% to ${max}% across tasks (>${((max - min) / min * 100).toFixed(0)}% relative difference)`,
        tasks: entries.map((e) => e.taskId),
      });
    }
  }

  // 2. Wrong axiom names
  const axiomPattern = /axiom[s]?\s*(?:of\s+)?[:\-–]?\s*["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  const canonicalLower = new Set(CANONICAL_AXIOM_NAMES.map((a) => a.toLowerCase()));

  for (const [taskId, { output }] of taskOutputs) {
    let match: RegExpExecArray | null;
    while ((match = axiomPattern.exec(output)) !== null) {
      const found = match[1].trim();
      if (!canonicalLower.has(found.toLowerCase())) {
        issues.push({
          type: "wrong-axiom-name",
          description: `Non-canonical axiom name "${found}" (not in the 10 canonical axioms)`,
          tasks: [taskId],
        });
      }
    }
  }

  // 3. Wrong pipeline stage names
  const stagePattern = /(?:stage|phase|step)\s*(?:\d+\s*)?[:\-–]?\s*["']?([A-Z]{3,})/g;
  const canonicalStages = new Set(CANONICAL_PIPELINE_STAGES as unknown as string[]);

  for (const [taskId, { output }] of taskOutputs) {
    let match: RegExpExecArray | null;
    while ((match = stagePattern.exec(output)) !== null) {
      const found = match[1];
      if (!canonicalStages.has(found) && /^[A-Z]+$/.test(found)) {
        issues.push({
          type: "wrong-stage-name",
          description: `Non-canonical pipeline stage "${found}" (not in SURVEY/.../ADAPT)`,
          tasks: [taskId],
        });
      }
    }
  }

  // 4. Entity existence contradictions
  // Detect when the same backtick-quoted entity is claimed to exist in one task
  // and to be absent/removed in another (proximity heuristic: same line).
  const entityStates = new Map<string, { state: "exists" | "absent"; taskId: string }[]>();
  const existsPattern = /\b(?:exists?|is\s+defined|is\s+present|was\s+(?:created|added))\b/i;
  const absentPattern = /\b(?:does\s+not\s+exist|not\s+found|no\s+longer\s+exists?|was\s+removed|was\s+deleted|missing|is\s+absent)\b/i;

  for (const [taskId, { output }] of taskOutputs) {
    for (const line of output.split("\n")) {
      const hasAbsent = absentPattern.test(line);
      const hasExists = !hasAbsent && existsPattern.test(line);
      if (!hasAbsent && !hasExists) continue;

      const localPattern = /`([^`\n]{1,80})`/g;
      let bMatch: RegExpExecArray | null;
      while ((bMatch = localPattern.exec(line)) !== null) {
        const entity = bMatch[1].trim();
        if (!entity || /^\d+$/.test(entity)) continue;
        const state: "exists" | "absent" = hasAbsent ? "absent" : "exists";
        if (!entityStates.has(entity)) entityStates.set(entity, []);
        entityStates.get(entity)!.push({ state, taskId });
      }
    }
  }

  for (const [entity, entries] of entityStates) {
    const existsTasks = [...new Set(entries.filter((e) => e.state === "exists").map((e) => e.taskId))];
    const absentTasks = [...new Set(entries.filter((e) => e.state === "absent").map((e) => e.taskId))];
    // Only flag when different tasks make contradictory claims
    if (existsTasks.length > 0 && absentTasks.length > 0 &&
        existsTasks.some((t) => !absentTasks.includes(t))) {
      issues.push({
        type: "entity-existence-contradiction",
        description: `"${entity}" claimed as existing in [${existsTasks.join(", ")}] but absent in [${absentTasks.join(", ")}]`,
        tasks: [...new Set([...existsTasks, ...absentTasks])],
      });
    }
  }

  return {
    issues,
    checkedAt: new Date().toISOString(),
    taskCount: taskOutputs.size,
  };
}

// ── Jidoka / Andon Cord — Hallucination Detection ─────────────────────────

/** Entities that have been eliminated from the codebase and should not appear in outputs */
export const ELIMINATED_ENTITIES = [
  // Pre-M-7C entity names (graph labels renamed to morpheme-native names)
  "Agent node", "Pattern node",
  ":Agent", ":Pattern",
  "AgentProps", "PatternProps",
  "createAgent", "getAgent", "listActiveAgents",
  "createPattern", "getPattern", "updatePatternState",
  // Original eliminated entities (monitoring overlay anti-pattern)
  "Observer pattern",
  "Model Sentinel",
  "collector.ts",
  "evaluator.ts",
  "auditor.ts",
  "GraphObserver",
  "codexStats",
  "health dashboard",
  "monitoring overlay",
] as const;

export interface HallucinationFlag {
  level: "signal" | "content" | "structural";
  severity: "warning" | "error";
  description: string;
}

/**
 * Three-layer hallucination detection on LLM task output.
 *
 * Signal-level: output too short, empty, or error-like
 * Content-level: references eliminated entities, fabricated names
 * Structural-level: acceptance criteria sections missing from output
 */
export function detectHallucinations(
  output: string,
  task: Task,
): HallucinationFlag[] {
  const flags: HallucinationFlag[] = [];

  // ── Layer 1: Signal-level ──────────────────────────────────────────────
  if (!output || output.trim().length === 0) {
    flags.push({
      level: "signal",
      severity: "error",
      description: "Empty output from LLM",
    });
    return flags; // No point checking content/structure on empty output
  }

  if (output.trim().length < 200) {
    flags.push({
      level: "signal",
      severity: "warning",
      description: `Suspiciously short output (${output.trim().length} chars)`,
    });
  }

  const errorPatterns = /^(error|Error:|I cannot|I'm unable|I apologize|Sorry,)/m;
  if (errorPatterns.test(output)) {
    flags.push({
      level: "signal",
      severity: "warning",
      description: "Output begins with error-like pattern",
    });
  }

  // ── Layer 2: Content-level ─────────────────────────────────────────────
  for (const entity of ELIMINATED_ENTITIES) {
    if (output.toLowerCase().includes(entity.toLowerCase())) {
      flags.push({
        level: "content",
        severity: "warning",
        description: `References eliminated entity "${entity}"`,
      });
    }
  }

  // Check for wrong axiom count (common hallucination: "9 axioms" or "12 axioms")
  const axiomCountMatch = output.match(/(\d+)\s+axioms?/i);
  if (axiomCountMatch) {
    const count = parseInt(axiomCountMatch[1], 10);
    if (count !== 10) {
      flags.push({
        level: "content",
        severity: "warning",
        description: `Claims ${count} axioms (canonical count is 10)`,
      });
    }
  }

  // Check for wrong pipeline stage count
  const stageCountMatch = output.match(/(\d+)[\s-]+stage pipeline/i);
  if (stageCountMatch) {
    const count = parseInt(stageCountMatch[1], 10);
    if (count !== 7) {
      flags.push({
        level: "content",
        severity: "warning",
        description: `Claims ${count}-stage pipeline (canonical count is 7)`,
      });
    }
  }

  // ── Layer 3: Structural-level ──────────────────────────────────────────
  // Check if acceptance criteria keywords appear in output
  for (const criterion of task.acceptance_criteria) {
    // Extract key nouns/phrases from criterion (words > 5 chars)
    const keyTerms = criterion.match(/[A-Za-z]{6,}/g);
    if (!keyTerms || keyTerms.length === 0) continue;

    // If none of the key terms from a criterion appear in output, flag it
    const found = keyTerms.some((term) =>
      output.toLowerCase().includes(term.toLowerCase()),
    );
    if (!found) {
      flags.push({
        level: "structural",
        severity: "warning",
        description: `Acceptance criterion may not be addressed: "${criterion.slice(0, 80)}"`,
      });
    }
  }

  return flags;
}

/**
 * Compute a quality score for a task output.
 * V1: mechanical heuristic (no LLM-as-judge).
 *
 * Scoring:
 *   base = 0.5 (output exists and is non-empty)
 *   +0.2 if output length > 200 chars (substantive response)
 *   +0.2 if hallucinationFlagCount === 0 (clean output)
 *   +0.1 if duration < 60000ms (responsive model)
 *   -0.3 if status === "failed"
 *   -0.1 per hallucination flag (up to -0.3)
 *   clamped to [0, 1]
 */
export function assessTaskQuality(
  outputLength: number,
  hallucinationFlagCount: number,
  status: "succeeded" | "failed",
  durationMs: number,
): number {
  let score = 0.5;

  if (outputLength > 200) score += 0.2;
  if (hallucinationFlagCount === 0) score += 0.2;
  if (durationMs < 60000) score += 0.1;
  if (status === "failed") score -= 0.3;

  // Penalty per hallucination flag, capped at -0.3
  const hallucinationPenalty = Math.min(hallucinationFlagCount * 0.1, 0.3);
  score -= hallucinationPenalty;

  return Math.max(0, Math.min(1, score));
}

export function createBootstrapTaskExecutor(
  modelExecutor: ModelExecutor,
  config?: BootstrapExecutorConfig,
): BootstrapTaskExecutorBundle {
  // Manifest accumulator — written after all tasks complete
  const manifestTasks: ManifestTask[] = [];
  // Cross-task output accumulator for synthesis injection
  const taskOutputs = new Map<string, { title: string; output: string; model: string }>();
  let currentRunId: string | null = null;
  let currentIntent: string = "";
  let currentRepoPath: string = "";
  let runStartedAt: string = "";
  let totalPhases: string[] = [];

  const executor: TaskExecutor = {
    async execute(
      task: Task,
      context: TaskExecutionContext,
    ): Promise<TaskOutcome> {
      const { repoPath, dryRun } = context;

      // Initialize run tracking on first task
      if (!currentRunId) {
        currentRunId = deriveRunId(context.planId);
        currentIntent = context.intent;
        currentRepoPath = repoPath;
        runStartedAt = new Date().toISOString();

        // Initialize graph tracking if enabled
        if (config?.graphEnabled && config.architectBloomId) {
          try {
            await ensureArchitectResonators(config.architectBloomId);
            await createPipelineRun({
              id: currentRunId,
              intent: currentIntent,
              bloomId: config.architectBloomId,
              taskCount: 0, // updated on completion
              startedAt: runStartedAt,
              status: "running",
            });
            console.log(`  [GRAPH] PipelineRun ${currentRunId} created`);
          } catch (err) {
            console.warn(`  [GRAPH] ⚠️  Failed to create PipelineRun: ${err instanceof Error ? err.message : err}`);
          }
        }
      }
      // Track phases seen for synthesis detection (last phase = synthesis candidate)
      if (!totalPhases.includes(task.phase)) {
        totalPhases.push(task.phase);
      }

      console.log(`\n  📋 Task: ${task.title} [${task.task_id}]`);
      console.log(`     Type: ${task.type}, Complexity: ${task.estimated_complexity}`);
      console.log(`     Files: ${task.files_affected.join(", ") || "(none specified)"}`);

      if (dryRun) {
        console.log("     [DRY RUN] Skipping execution.");
        return {
          task_id: task.task_id,
          success: true,
          output: "[dry-run] Task would be executed here.",
          adaptations_applied: 0,
        };
      }

      try {
        // Generate analysis via LLM
        const isLastPhase = totalPhases.length > 1 &&
          task.phase === totalPhases[totalPhases.length - 1];
        const prompt = buildTaskPrompt(task, context, taskOutputs, isLastPhase);
        const result = await modelExecutor.execute(prompt, {
          taskType: task.type === "mechanical" ? "coding" : "analytical",
          complexity:
            task.estimated_complexity === "trivial"
              ? "simple"
              : task.estimated_complexity === "high"
                ? "complex"
                : "moderate",
        });

        console.log(
          `     LLM response: ${result.text.length} chars from ${result.modelId} (${result.durationMs}ms)`,
        );

        // Jidoka: hallucination detection on raw output
        const hallucinationFlags = detectHallucinations(result.text, task);

        // Source verification: flag references to documents not in context
        const sourceFlags = detectUnsourcedReferences(result.text, task.task_id, task.files_affected);
        hallucinationFlags.push(...sourceFlags);

        if (hallucinationFlags.length > 0) {
          const errors = hallucinationFlags.filter((f) => f.severity === "error");
          const warnings = hallucinationFlags.filter((f) => f.severity === "warning");
          if (errors.length > 0) {
            console.log(`     🔴 ${errors.length} hallucination error(s) detected`);
          }
          if (warnings.length > 0) {
            console.log(`     🟡 ${warnings.length} hallucination warning(s) detected`);
          }
          for (const flag of hallucinationFlags) {
            console.log(`       [${flag.level}/${flag.severity}] ${flag.description}`);
          }
        }

        // Write output to pipeline-output/ (NEVER to source files)
        const outputPath = getOutputPath(task, currentRunId, repoPath);

        const isMechanical = task.type === "mechanical";
        const header = isMechanical
          ? [
              `# PROPOSED CODE CHANGE: ${task.title}`,
              ``,
              `> **This is a proposed change generated by the Architect pipeline.**`,
              `> It has NOT been applied. A human must review and apply it manually.`,
              `> Target files: ${task.files_affected.join(", ") || "(none)"}`,
            ]
          : [
              `# ${task.title}`,
            ];

        const hallucinationSection = hallucinationFlags.length > 0
          ? [
              ``,
              `> **⚠️ Hallucination flags (${hallucinationFlags.length}):**`,
              ...hallucinationFlags.map((f) => `> - [${f.level}/${f.severity}] ${f.description}`),
            ]
          : [];

        const outputContent = [
          ...header,
          ``,
          `> Task ID: ${task.task_id}`,
          `> Model: ${result.modelId}`,
          `> Duration: ${result.durationMs}ms`,
          `> Output chars: ${result.text.length}`,
          `> Timestamp: ${new Date().toISOString()}`,
          ...hallucinationSection,
          ``,
          `---`,
          ``,
          result.text,
        ].join("\n");

        writeFileSync(outputPath, outputContent, "utf-8");
        console.log(`     Output written to: ${outputPath}`);

        // Track for manifest
        manifestTasks.push({
          taskId: task.task_id,
          title: task.title,
          type: task.type,
          model: result.modelId,
          provider: result.provider ?? "unknown",
          thinkingMode: result.thinkingMode ?? "default",
          thinkingParameter: result.thinkingParameter,
          status: "succeeded",
          durationMs: result.durationMs,
          outputFile: outputPath.replace(repoPath + "/", "").replace(repoPath + "\\", ""),
          outputChars: result.text.length,
        });

        // Store output for cross-task injection (capped)
        taskOutputs.set(task.task_id, {
          title: task.title,
          output: result.text.slice(0, MAX_PRIOR_OUTPUT_CHARS),
          model: result.modelId,
        });

        // Quality assessment (V1 mechanical heuristic)
        const qualityScore = assessTaskQuality(
          result.text.length,
          hallucinationFlags.length,
          "succeeded",
          result.durationMs,
        );

        // Write TaskOutput to graph if enabled
        if (config?.graphEnabled && currentRunId) {
          try {
            const taskOutputId = `${currentRunId}_${task.task_id}`;
            await createTaskOutput({
              id: taskOutputId,
              runId: currentRunId,
              taskId: task.task_id,
              title: task.title,
              taskType: task.type,
              modelUsed: result.modelId,
              provider: result.provider ?? "unknown",
              outputLength: result.text.length,
              durationMs: result.durationMs,
              qualityScore,
              hallucinationFlagCount: hallucinationFlags.length,
              status: "succeeded",
            });

            // Link to DISPATCH Resonator (the stage that runs tasks)
            if (config.architectBloomId) {
              const resonatorId = `${config.architectBloomId}_DISPATCH`;
              await linkTaskOutputToStage(taskOutputId, resonatorId);
            }

            // Update Decision node with real quality score (closes Thompson learning loop)
            if (result.decisionId) {
              try {
                await updateDecisionQuality(result.decisionId, qualityScore);
              } catch (err3) {
                console.warn(`     [GRAPH] ⚠️  Failed to update Decision quality: ${err3 instanceof Error ? err3.message : err3}`);
              }
            }

            // Record Observation node in graph via recordObservation() (raw write — ΦL recomputation deferred)
            if (config.architectBloomId) {
              try {
                await recordObservation({
                  id: `obs_${taskOutputId}`,
                  sourceBloomId: config.architectBloomId,
                  metric: "task.quality",
                  value: qualityScore,
                  context: `${currentRunId}/${task.task_id}`,
                });
              } catch (err4) {
                console.warn(`     [GRAPH] ⚠️  Failed to write Observation: ${err4 instanceof Error ? err4.message : err4}`);
              }
            }

            console.log(`     [GRAPH] TaskOutput ${taskOutputId} written (quality=${qualityScore.toFixed(2)})`);
          } catch (err2) {
            console.warn(`     [GRAPH] ⚠️  Failed to write TaskOutput: ${err2 instanceof Error ? err2.message : err2}`);
          }
        }

        return {
          task_id: task.task_id,
          success: true,
          output: result.text.slice(0, 2000),
          adaptations_applied: 0,
        };
      } catch (err) {
        manifestTasks.push({
          taskId: task.task_id,
          title: task.title,
          type: task.type,
          model: "unknown",
          provider: "unknown",
          thinkingMode: "unknown",
          thinkingParameter: undefined,
          status: "failed",
          durationMs: 0,
          outputFile: "",
          outputChars: 0,
        });

        // Write failed TaskOutput to graph if enabled
        const failedQuality = assessTaskQuality(0, 0, "failed", 0);
        if (config?.graphEnabled && currentRunId) {
          try {
            await createTaskOutput({
              id: `${currentRunId}_${task.task_id}`,
              runId: currentRunId,
              taskId: task.task_id,
              title: task.title,
              taskType: task.type,
              modelUsed: "unknown",
              provider: "unknown",
              outputLength: 0,
              durationMs: 0,
              qualityScore: failedQuality,
              hallucinationFlagCount: 0,
              status: "failed",
            });

            // Write failure Observation to graph
            if (config.architectBloomId) {
              try {
                await recordObservation({
                  id: `obs_${currentRunId}_${task.task_id}`,
                  sourceBloomId: config.architectBloomId,
                  metric: "task.quality",
                  value: failedQuality,
                  context: `${currentRunId}/${task.task_id}`,
                });
              } catch {
                // Swallow — already in error path
              }
            }
          } catch {
            // Swallow — already in error path
          }
        }

        return {
          task_id: task.task_id,
          success: false,
          error: err instanceof Error ? err.message : String(err),
          adaptations_applied: 0,
        };
      }
    },
  };

  async function writeManifest(): Promise<RunManifest | null> {
    if (!currentRunId || !currentRepoPath) return null;

    const outputDir = join(currentRepoPath, "docs", "pipeline-output", currentRunId);
    mkdirSync(outputDir, { recursive: true });

    const modelsUsed = [...new Set(manifestTasks.map((t) => t.model).filter((m) => m !== "unknown"))];

    const manifest: RunManifest = {
      runId: currentRunId,
      intent: currentIntent,
      startedAt: runStartedAt,
      completedAt: new Date().toISOString(),
      tasks: manifestTasks,
      summary: {
        total: manifestTasks.length,
        succeeded: manifestTasks.filter((t) => t.status === "succeeded").length,
        failed: manifestTasks.filter((t) => t.status === "failed").length,
        totalDurationMs: manifestTasks.reduce((sum, t) => sum + t.durationMs, 0),
        totalOutputChars: manifestTasks.reduce((sum, t) => sum + t.outputChars, 0),
        modelsUsed,
      },
    };

    const manifestPath = join(outputDir, "_manifest.json");
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    console.log(`  [DISPATCH] Manifest written to: ${manifestPath}`);

    // Run post-dispatch consistency check
    if (taskOutputs.size > 0) {
      const report = checkConsistency(taskOutputs);
      const reportPath = join(outputDir, "_consistency-check.json");
      writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
      if (report.issues.length > 0) {
        console.warn(`  [DISPATCH] ⚠️  ${report.issues.length} consistency issue(s) found — see ${reportPath}`);
        for (const issue of report.issues) {
          console.warn(`    - [${issue.type}] ${issue.description}`);
        }
      } else {
        console.log(`  [DISPATCH] ✅ Consistency check passed (${report.taskCount} tasks)`);
      }
    }

    // Complete PipelineRun in graph if enabled
    if (config?.graphEnabled && currentRunId) {
      try {
        const successRate = manifest.summary.total > 0
          ? manifest.summary.succeeded / manifest.summary.total
          : 0;

        await completePipelineRun(
          currentRunId,
          manifest.completedAt,
          manifest.summary.totalDurationMs,
          successRate,
          modelsUsed.length,
          manifest.summary.total,
        );
        console.log(`  [GRAPH] PipelineRun ${currentRunId} completed (quality=${successRate.toFixed(2)}, models=${modelsUsed.length}, tasks=${manifest.summary.total})`);
      } catch (err) {
        console.warn(`  [GRAPH] ⚠️  Failed to complete PipelineRun: ${err instanceof Error ? err.message : err}`);
      }
    }

    return manifest;
  }

  return { executor, writeManifest };
}

function buildTaskPrompt(
  task: Task,
  context: TaskExecutionContext,
  priorOutputs: Map<string, { title: string; output: string; model: string }>,
  isLastPhase: boolean,
): string {
  const fileContext = readFileContext(task, context.repoPath);

  // Warn when context is significantly degraded (truncated or skipped files).
  // Visible in pipeline output so operators can widen scope or split the task.
  if (fileContext) {
    const requestedFiles = task.files_affected.length;
    const truncatedFiles = (fileContext.match(/\(truncated at/g) ?? []).length;
    const skippedFiles = (fileContext.match(/\(skipped: total context limit reached\)/g) ?? []).length;
    if (truncatedFiles > 0 || skippedFiles > 0) {
      console.warn(
        `  ⚠️  Context degradation [${task.task_id}]: ${truncatedFiles} truncated, ` +
        `${skippedFiles} skipped of ${requestedFiles} files (${fileContext.length} chars used of ${MAX_TOTAL_CONTEXT_CHARS} budget)`,
      );
    }
  }

  const isMechanical = task.type === "mechanical";
  const instructions = isMechanical
    ? [
        `## Instructions`,
        `Produce the code changes needed to complete this task.`,
        `Show the full file content for each file that needs to change.`,
        `Do NOT modify signal conditioning (src/computation/signals/).`,
        `Use .js extensions on all relative imports.`,
      ]
    : [
        `## Instructions`,
        `Provide your analysis as a structured markdown document.`,
        `Focus on findings, evidence, and recommendations.`,
        `Do NOT output code changes or file rewrites — only analysis.`,
      ];

  // Build prior-task context for synthesis tasks
  const synthesisContext: string[] = [];
  if (priorOutputs.size > 0 && isSynthesisTask(task, isLastPhase)) {
    synthesisContext.push(`## Prior Task Outputs (for synthesis/consolidation)`);
    synthesisContext.push(`The following are outputs from earlier tasks in this pipeline run.`);
    synthesisContext.push(`Use them as source material — do NOT simply repeat them.`);
    synthesisContext.push(``);
    for (const [taskId, { title, output }] of priorOutputs) {
      synthesisContext.push(`### ${taskId}: ${title}`);
      synthesisContext.push(output);
      synthesisContext.push(``);
    }
  }

  return [
    `You are executing a task in the Codex Signum core library.`,
    ``,
    `## Intent`,
    context.intent,
    ``,
    `## Task`,
    `**${task.title}** (${task.task_id})`,
    task.description,
    ``,
    `## Acceptance Criteria`,
    ...task.acceptance_criteria.map((c) => `- ${c}`),
    ``,
    `## Specification References`,
    ...task.specification_refs.map((r) => `- ${r}`),
    ``,
    `## Verification`,
    task.verification,
    ``,
    ...(fileContext
      ? [
          `## Relevant Files (read as context)`,
          fileContext,
          ``,
        ]
      : []),
    ...synthesisContext,
    ...instructions,
  ].join("\n");
}
