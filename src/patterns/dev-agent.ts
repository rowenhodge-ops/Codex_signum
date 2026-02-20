/**
 * Codex Signum — DevAgent Pipeline
 *
 * The DevAgent is a Bloom morpheme — it composes Seeds (models),
 * Lines (pipelines), and Resonators (router) into a complete
 * development agent that processes tasks through a staged pipeline.
 *
 * Pipeline stages:
 *   SCOPE → EXECUTE → REVIEW → VALIDATE
 *
 * Each stage is a separate model invocation managed by the Thompson Router.
 * The Correction Helix (≤3 iterations) handles quality issues.
 *
 * @see codex-signum-v3.0.md §Bloom morpheme
 * @see engineering-bridge-v2.0.md §Part 7 "DevAgent"
 * @module codex-signum-core/patterns/dev-agent
 */

import type {
  ComplianceContext,
  ConstitutionalEvaluation,
} from "../constitutional/engine.js";
import { evaluateConstitution } from "../constitutional/index.js";
import type { ArmStats } from "../graph/queries.js";
import {
  EphemeralStore,
  attachOutcome,
  createDecision,
  createObservation,
} from "../memory/index.js";
import type { ConstitutionalRule } from "../types/constitutional.js";
import type {
  Decision,
  DecisionContext,
  DecisionOutcome,
} from "../types/memory.js";
import type {
  RoutableModel,
  RoutingContext,
  ThompsonRouterConfig,
} from "./thompson-router.js";
import { DEFAULT_ROUTER_CONFIG, route } from "./thompson-router.js";

/** Map AgentTask complexity to DecisionContext complexity */
function mapComplexity(
  c: "trivial" | "moderate" | "complex" | "critical",
): "low" | "medium" | "high" {
  switch (c) {
    case "trivial":
    case "moderate":
      return "low";
    case "complex":
      return "medium";
    case "critical":
      return "high";
  }
}

// ============ TYPES ============

/** Pipeline stage names */
export type PipelineStage = "scope" | "execute" | "review" | "validate";

/** Task submitted to the DevAgent */
export interface AgentTask {
  id: string;
  prompt: string;
  taskType: string;
  complexity: "trivial" | "moderate" | "complex" | "critical";
  domain?: string;
  qualityRequirement?: number;
  latencyBudgetMs?: number;
  costCeiling?: number;
}

/** Result from a single pipeline stage */
export interface StageResult {
  stage: PipelineStage;
  modelId: string;
  output: string;
  qualityScore: number;
  durationMs: number;
  wasExploratory: boolean;
  correctionIteration: number;
}

/** Complete pipeline result */
export interface PipelineResult {
  taskId: string;
  stages: StageResult[];
  finalOutput: string;
  totalDurationMs: number;
  totalCost: number;
  overallQuality: number;
  correctionCount: number;
  constitutionalCompliance: ConstitutionalEvaluation | null;
  decisions: Decision[];
}

/** Model executor — the actual model invocation function */
export type ModelExecutor = (
  modelId: string,
  prompt: string,
  stage: PipelineStage,
) => Promise<{ output: string; durationMs: number; cost: number }>;

/** Quality assessor — evaluates output quality */
export type QualityAssessor = (
  output: string,
  stage: PipelineStage,
  task: AgentTask,
) => Promise<number>;

/** DevAgent configuration */
export interface DevAgentConfig {
  /** Which stages to include (e.g., skip scope for "lite" mode) */
  stages: PipelineStage[];
  /** Max correction iterations per stage */
  maxCorrections: number;
  /** Minimum quality to pass a stage */
  qualityThreshold: number;
  /** Router configuration */
  routerConfig: ThompsonRouterConfig;
  /** Constitutional rules to enforce */
  constitutionalRules: ConstitutionalRule[];
}

/** Default DevAgent configuration */
export const DEFAULT_DEVAGENT_CONFIG: DevAgentConfig = {
  stages: ["scope", "execute", "review", "validate"],
  maxCorrections: 3,
  qualityThreshold: 0.5,
  routerConfig: DEFAULT_ROUTER_CONFIG,
  constitutionalRules: [],
};

/** Pipeline presets */
export const PIPELINE_PRESETS: Record<string, PipelineStage[]> = {
  full: ["scope", "execute", "review", "validate"],
  lite: ["execute", "review", "validate"],
  quick: ["execute", "validate"],
  generate: ["execute"],
};

// ============ DEVAGENT ============

/**
 * The DevAgent — runs tasks through a staged pipeline
 * with Thompson Sampling routing and Correction Helix.
 */
export class DevAgent {
  private config: DevAgentConfig;
  private memory: EphemeralStore;
  private models: RoutableModel[];
  private armStats: Map<string, ArmStats[]>; // clusterId → stats
  private decisionCount: number;
  private executor: ModelExecutor;
  private assessor: QualityAssessor;

  constructor(
    models: RoutableModel[],
    executor: ModelExecutor,
    assessor: QualityAssessor,
    config: Partial<DevAgentConfig> = {},
  ) {
    this.config = { ...DEFAULT_DEVAGENT_CONFIG, ...config };
    this.memory = new EphemeralStore();
    this.models = models;
    this.armStats = new Map();
    this.decisionCount = 0;
    this.executor = executor;
    this.assessor = assessor;
  }

  /**
   * Run a task through the pipeline.
   */
  async run(task: AgentTask): Promise<PipelineResult> {
    const startTime = Date.now();
    const stages: StageResult[] = [];
    const decisions: Decision[] = [];
    let totalCost = 0;
    let correctionCount = 0;

    // Add task to ephemeral memory
    this.memory.add("devagent:pipeline", {
      prompt: task.prompt,
      taskType: task.taskType,
      complexity: task.complexity,
    });

    // Run each stage
    let previousOutput = task.prompt;
    for (const stage of this.config.stages) {
      const stageResult = await this.runStage(
        stage,
        previousOutput,
        task,
        decisions,
      );
      stages.push(stageResult);
      totalCost += 0; // Cost tracked at executor level
      correctionCount += stageResult.correctionIteration;
      previousOutput = stageResult.output;
    }

    // Overall quality = last stage's quality (validate or review)
    const overallQuality =
      stages.length > 0 ? stages[stages.length - 1].qualityScore : 0;

    // Constitutional compliance check
    let constitutionalCompliance: ConstitutionalEvaluation | null = null;
    if (this.config.constitutionalRules.length > 0) {
      const complianceContext: ComplianceContext = {
        correctionIterations: correctionCount,
      };
      constitutionalCompliance = evaluateConstitution(
        this.config.constitutionalRules,
        complianceContext,
      );
    }

    return {
      taskId: task.id,
      stages,
      finalOutput: previousOutput,
      totalDurationMs: Date.now() - startTime,
      totalCost,
      overallQuality,
      correctionCount,
      constitutionalCompliance,
      decisions,
    };
  }

  /**
   * Run a single pipeline stage with Correction Helix.
   */
  private async runStage(
    stage: PipelineStage,
    input: string,
    task: AgentTask,
    decisions: Decision[],
  ): Promise<StageResult> {
    let bestResult: StageResult | null = null;

    for (
      let correction = 0;
      correction <= this.config.maxCorrections;
      correction++
    ) {
      // Route to a model for this stage
      const routingContext: RoutingContext = {
        taskType: `${task.taskType}:${stage}`,
        complexity: task.complexity,
        domain: task.domain,
        qualityRequirement: task.qualityRequirement ?? 0.7,
        latencyBudgetMs: task.latencyBudgetMs,
        costCeiling: task.costCeiling,
      };

      const clusterId = `${routingContext.taskType}:${routingContext.complexity}`;
      const stats = this.armStats.get(clusterId) ?? [];

      const routingDecision = route(
        routingContext,
        this.models,
        stats,
        this.decisionCount++,
        this.config.routerConfig,
      );

      // Build the prompt for this stage
      const stagePrompt = buildStagePrompt(stage, input, task, correction);

      // Execute the model
      const { output, durationMs, cost } = await this.executor(
        routingDecision.selectedModelId,
        stagePrompt,
        stage,
      );

      // Assess quality
      const qualityScore = await this.assessor(output, stage, task);

      // Record decision
      const decisionContext: DecisionContext = {
        taskType: `${task.taskType}:${stage}`,
        complexity: mapComplexity(task.complexity),
        domain: task.domain ?? "general",
        qualityRequirement: task.qualityRequirement ?? 0.7,
        costCeiling: task.costCeiling,
      };
      const decision = createDecision(
        decisionContext,
        this.models.map((m) => m.id),
        routingDecision.selectedModelId,
        routingDecision.reasoning,
        "devagent:pipeline",
      );

      const outcome: DecisionOutcome = {
        success: qualityScore >= this.config.qualityThreshold,
        qualityScore,
        durationMs,
        cost,
        wasExploratory: routingDecision.wasExploratory,
        recordedAt: new Date(),
      };

      decisions.push(attachOutcome(decision, outcome));

      // Record observation
      createObservation(`devagent:${stage}`, "execution_outcome", {
        success: qualityScore >= this.config.qualityThreshold,
        qualityScore,
        durationMs,
        cost,
        modelUsed: routingDecision.selectedModelId,
      });
      this.memory.add(`devagent:${stage}`, {
        quality: qualityScore,
        model: routingDecision.selectedModelId,
        correction,
      });

      const result: StageResult = {
        stage,
        modelId: routingDecision.selectedModelId,
        output,
        qualityScore,
        durationMs,
        wasExploratory: routingDecision.wasExploratory,
        correctionIteration: correction,
      };

      // If quality passes, we're done
      if (qualityScore >= this.config.qualityThreshold) {
        return result;
      }

      // Track best result for fallback
      if (!bestResult || qualityScore > bestResult.qualityScore) {
        bestResult = result;
      }
    }

    // Max corrections reached — return best available + signal degraded
    this.memory.add(`devagent:${stage}`, {
      degraded: true,
      maxCorrections: this.config.maxCorrections,
    });

    return bestResult!;
  }

  /**
   * Load arm stats from an external source (e.g., Neo4j).
   */
  loadArmStats(clusterId: string, stats: ArmStats[]): void {
    this.armStats.set(clusterId, stats);
  }

  /**
   * Get the ephemeral memory store.
   */
  getMemory(): EphemeralStore {
    return this.memory;
  }
}

// ============ PROMPT BUILDERS ============

/**
 * Build the prompt for each pipeline stage.
 */
function buildStagePrompt(
  stage: PipelineStage,
  input: string,
  task: AgentTask,
  correctionIteration: number,
): string {
  const correctionNote =
    correctionIteration > 0
      ? `\n\n[CORRECTION ${correctionIteration}]: Previous output did not meet quality threshold. Improve the response.`
      : "";

  switch (stage) {
    case "scope":
      return [
        `SCOPE ANALYSIS — Define what needs to be done.`,
        `Task type: ${task.taskType} | Complexity: ${task.complexity}`,
        task.domain ? `Domain: ${task.domain}` : "",
        `\nTask:\n${input}`,
        `\nProvide: 1) Clear scope boundaries, 2) Key requirements, 3) Risk factors.`,
        correctionNote,
      ]
        .filter(Boolean)
        .join("\n");

    case "execute":
      return [
        `EXECUTION — Generate the solution.`,
        `Task type: ${task.taskType} | Complexity: ${task.complexity}`,
        `\nInput:\n${input}`,
        correctionNote,
      ]
        .filter(Boolean)
        .join("\n");

    case "review":
      return [
        `CODE REVIEW — Assess the following output for quality, correctness, and edge cases.`,
        `Task type: ${task.taskType} | Domain: ${task.domain ?? "general"}`,
        `Quality requirement: ${(task.qualityRequirement ?? 0.7) * 100}%`,
        `\nOutput to review:\n${input}`,
        `\nProvide: 1) Issues found, 2) Suggestions, 3) Quality assessment (0-1).`,
        correctionNote,
      ]
        .filter(Boolean)
        .join("\n");

    case "validate":
      return [
        `VALIDATION — Verify architecture compliance and correctness.`,
        `Task type: ${task.taskType}`,
        `\nOutput to validate:\n${input}`,
        `\nCheck: 1) Architecture compliance, 2) Rule conformance, 3) Completeness.`,
        correctionNote,
      ]
        .filter(Boolean)
        .join("\n");
  }
}
