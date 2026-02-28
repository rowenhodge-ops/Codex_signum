// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { evaluateConstitution } from "../../constitutional/index.js";
import { EphemeralStore, attachOutcome, createDecision, createObservation, } from "../../memory/index.js";
import { route } from "../thompson-router/index.js";
import { buildStagePrompt } from "./prompts.js";
import { DEFAULT_DEVAGENT_CONFIG, mapComplexity, } from "./types.js";
/**
 * The DevAgent — runs tasks through a staged pipeline
 * with Thompson Sampling routing and Correction Helix.
 */
export class DevAgent {
    config;
    memory;
    models;
    armStats;
    decisionCount;
    executor;
    assessor;
    constructor(models, executor, assessor, config = {}) {
        this.config = { ...DEFAULT_DEVAGENT_CONFIG, ...config };
        this.memory = new EphemeralStore();
        this.models = models;
        this.armStats = new Map();
        this.decisionCount = 0;
        this.executor = executor;
        this.assessor = assessor;
    }
    async run(task) {
        const startTime = Date.now();
        const stages = [];
        const decisions = [];
        let totalCost = 0;
        let correctionCount = 0;
        this.memory.add("devagent:pipeline", {
            prompt: task.prompt,
            taskType: task.taskType,
            complexity: task.complexity,
        });
        let previousOutput = task.prompt;
        for (const stage of this.config.stages) {
            const stageResult = await this.runStage(stage, previousOutput, task, decisions);
            stages.push(stageResult);
            totalCost += 0;
            correctionCount += stageResult.correctionIteration;
            previousOutput = stageResult.output;
            if (this.config.afterStage) {
                try {
                    await this.config.afterStage(stage, stageResult, task);
                }
                catch (err) {
                    console.warn(`[DevAgent] afterStage hook error (${stage}):`, err);
                }
            }
        }
        const overallQuality = stages.length > 0 ? stages[stages.length - 1].qualityScore : 0;
        let constitutionalCompliance = null;
        if (this.config.constitutionalRules.length > 0) {
            const complianceContext = {
                correctionIterations: correctionCount,
            };
            constitutionalCompliance = evaluateConstitution(this.config.constitutionalRules, complianceContext);
        }
        const result = {
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
        if (this.config.afterPipeline) {
            try {
                await this.config.afterPipeline(result, task);
            }
            catch (err) {
                console.warn(`[DevAgent] afterPipeline hook error:`, err);
            }
        }
        return result;
    }
    async runStage(stage, input, task, decisions) {
        let bestResult = null;
        for (let correction = 0; correction <= this.config.maxCorrections; correction++) {
            const routingContext = {
                taskType: `${task.taskType}:${stage}`,
                complexity: task.complexity,
                domain: task.domain,
                qualityRequirement: task.qualityRequirement ?? 0.7,
                latencyBudgetMs: task.latencyBudgetMs,
                costCeiling: task.costCeiling,
            };
            const clusterId = `${routingContext.taskType}:${routingContext.complexity}`;
            const stats = this.armStats.get(clusterId) ?? [];
            const routingDecision = route(routingContext, this.models, stats, this.decisionCount++, this.config.routerConfig);
            const stagePrompt = buildStagePrompt(stage, input, task, correction);
            const { output, durationMs, cost } = await this.executor(routingDecision.selectedModelId, stagePrompt, stage);
            const qualityScore = await this.assessor(output, stage, task);
            const decisionContext = {
                taskType: `${task.taskType}:${stage}`,
                complexity: mapComplexity(task.complexity),
                domain: task.domain ?? "general",
                qualityRequirement: task.qualityRequirement ?? 0.7,
                costCeiling: task.costCeiling,
            };
            const decision = createDecision(decisionContext, this.models.map((m) => m.id), routingDecision.selectedModelId, routingDecision.reasoning, "devagent:pipeline");
            const outcome = {
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
                correction,
            });
            const result = {
                stage,
                modelId: routingDecision.selectedModelId,
                output,
                qualityScore,
                durationMs,
                wasExploratory: routingDecision.wasExploratory,
                correctionIteration: correction,
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
            maxCorrections: this.config.maxCorrections,
        });
        return bestResult;
    }
    loadArmStats(clusterId, stats) {
        this.armStats.set(clusterId, stats);
    }
    getMemory() {
        return this.memory;
    }
}
//# sourceMappingURL=pipeline.js.map