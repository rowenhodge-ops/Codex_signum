// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type {
  ComplianceContext,
  ConstitutionalEvaluation,
} from "../../constitutional/engine.js";
import { evaluateConstitution } from "../../constitutional/index.js";
import type { ArmStats } from "../../graph/queries.js";
import {
  EphemeralStore,
  attachOutcome,
  createDecision,
  createObservation,
} from "../../memory/index.js";
import type {
  Decision,
  DecisionContext,
  DecisionOutcome,
} from "../../types/memory.js";
import type { RoutingContext } from "../thompson-router/index.js";
import { route } from "../thompson-router/index.js";
import { buildStagePrompt } from "./prompts.js";
import {
  DEFAULT_DEVAGENT_CONFIG,
  mapComplexity,
  type AgentTask,
  type DevAgentConfig,
  type DevAgentModelExecutor,
  type PipelineResult,
  type QualityAssessor,
  type RoutableModel,
  type StageResult,
} from "./types.js";

/**
 * The DevAgent — runs tasks through a staged pipeline
 * with Thompson Sampling routing and Refinement Helix.
 */
export class DevAgent {
  private config: DevAgentConfig;
  private memory: EphemeralStore;
  private models: RoutableModel[];
  private armStats: Map<string, ArmStats[]>;
  private decisionCount: number;
  private executor: DevAgentModelExecutor;
  private assessor: QualityAssessor;

  constructor(
    models: RoutableModel[],
    executor: DevAgentModelExecutor,
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

  async run(task: AgentTask): Promise<PipelineResult> {
    const startTime = Date.now();
    const stages: StageResult[] = [];
    const decisions: Decision[] = [];
    let totalCost = 0;
    let refinementCount = 0;

    this.memory.add("devagent:pipeline", {
      prompt: task.prompt,
      taskType: task.taskType,
      complexity: task.complexity,
    });

    let previousOutput = task.prompt;
    for (const stage of this.config.stages) {
      const stageResult = await this.runStage(
        stage,
        previousOutput,
        task,
        decisions,
      );
      stages.push(stageResult);
      totalCost += 0;
      refinementCount += stageResult.refinementIteration;
      previousOutput = stageResult.output;

      if (this.config.afterStage) {
        try {
          await this.config.afterStage(stage, stageResult, task);
        } catch (err) {
          console.warn(`[DevAgent] afterStage hook error (${stage}):`, err);
        }
      }
    }

    const overallQuality =
      stages.length > 0 ? stages[stages.length - 1].qualityScore : 0;

    let constitutionalCompliance: ConstitutionalEvaluation | null = null;
    if (this.config.constitutionalRules.length > 0) {
      const complianceContext: ComplianceContext = {
        refinementIterations: refinementCount,
      };
      constitutionalCompliance = evaluateConstitution(
        this.config.constitutionalRules,
        complianceContext,
      );
    }

    const result: PipelineResult = {
      taskId: task.id,
      stages,
      finalOutput: previousOutput,
      totalDurationMs: Date.now() - startTime,
      totalCost,
      overallQuality,
      refinementCount,
      constitutionalCompliance,
      decisions,
    };

    if (this.config.afterPipeline) {
      try {
        await this.config.afterPipeline(result, task);
      } catch (err) {
        console.warn(`[DevAgent] afterPipeline hook error:`, err);
      }
    }

    return result;
  }

  private async runStage(
    stage: StageResult["stage"],
    input: string,
    task: AgentTask,
    decisions: Decision[],
  ): Promise<StageResult> {
    let bestResult: StageResult | null = null;

    for (
      let refinement = 0;
      refinement <= this.config.maxRefinements;
      refinement++
    ) {
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

      const stagePrompt = buildStagePrompt(stage, input, task, refinement);
      const { output, durationMs, cost } = await this.executor(
        routingDecision.selectedModelId,
        stagePrompt,
        stage,
      );

      const qualityScore = await this.assessor(output, stage, task);

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
        refinement,
      });

      const result: StageResult = {
        stage,
        modelId: routingDecision.selectedModelId,
        output,
        qualityScore,
        durationMs,
        wasExploratory: routingDecision.wasExploratory,
        refinementIteration: refinement,
      };

      if (qualityScore >= this.config.qualityThreshold) {
        return result;
      }

      if (!bestResult || qualityScore > bestResult.qualityScore) {
        bestResult = result;
      }
    }

    this.memory.add(`devagent:${stage}`, {
      degraded: true,
      maxRefinements: this.config.maxRefinements,
    });

    return bestResult!;
  }

  loadArmStats(clusterId: string, stats: ArmStats[]): void {
    this.armStats.set(clusterId, stats);
  }

  getMemory(): EphemeralStore {
    return this.memory;
  }
}
