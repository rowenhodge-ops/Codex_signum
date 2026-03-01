// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { ArmStats } from "../../graph/queries.js";
import { sampleBeta } from "./sampler.js";
import type {
  RoutableModel,
  RoutingContext,
  RoutingDecision,
  ThompsonRouterConfig,
} from "./types.js";
import { DEFAULT_ROUTER_CONFIG } from "./types.js";

/**
 * Make a routing decision using Thompson Sampling.
 */
export function route(
  context: RoutingContext,
  models: RoutableModel[],
  armStats: ArmStats[],
  decisionCount: number = 0,
  config: ThompsonRouterConfig = DEFAULT_ROUTER_CONFIG,
): RoutingDecision {
  if (models.length === 0) {
    throw new Error("No models available for routing");
  }

  const activeModels = models.filter((m) => m.status === "active");
  if (activeModels.length === 0) {
    throw new Error("No active models available");
  }

  const statsMap = new Map(armStats.map((s) => [s.seedId, s]));
  const contextClusterId = buildContextClusterId(context);

  const forceExplore =
    decisionCount > 0 && decisionCount % config.forceExploreEvery === 0;

  const sampledValues = new Map<string, number>();
  const adjustedScores = new Map<string, number>();

  for (const model of activeModels) {
    const stats = statsMap.get(model.id);
    const alpha = stats?.alpha ?? 1;
    const beta = stats?.beta ?? 1;

    let theta = sampleBeta(alpha, beta);

    if (context.latencyBudgetMs && model.avgLatencyMs > 0) {
      const latencyExcess = Math.max(
        0,
        model.avgLatencyMs - context.latencyBudgetMs,
      );
      theta -= latencyExcess * config.latencyPenaltyFactor;
    }

    if (context.costCeiling && model.costPer1kTokens > 0) {
      const costExcess = Math.max(0, model.costPer1kTokens - context.costCeiling);
      theta -= costExcess * config.costPenaltyFactor;
    }

    sampledValues.set(model.id, theta);
    adjustedScores.set(model.id, theta);
  }

  let selectedId = activeModels[0].id;
  let bestScore = -Infinity;

  for (const [modelId, score] of adjustedScores) {
    if (score > bestScore) {
      bestScore = score;
      selectedId = modelId;
    }
  }

  const bestMeanModel = findBestMeanModel(activeModels, statsMap);
  let wasExploratory = selectedId !== bestMeanModel;

  if (forceExplore && activeModels.length > 1) {
    const nonBest = activeModels.filter((m) => m.id !== bestMeanModel);
    const randomIndex = Math.floor(Math.random() * nonBest.length);
    selectedId = nonBest[randomIndex].id;
    wasExploratory = true;
  }

  const selectedStats = statsMap.get(selectedId);
  const confidence =
    selectedStats && selectedStats.totalTrials > 0
      ? computeConfidence(selectedStats.alpha, selectedStats.beta)
      : 0.1;

  return {
    selectedModelId: selectedId,
    wasExploratory,
    confidence,
    sampledValues,
    contextClusterId,
    reasoning: buildReasoning(
      selectedId,
      wasExploratory,
      forceExplore,
      confidence,
      context,
    ),
  };
}

/**
 * Build a deterministic context cluster ID from the routing context.
 */
export function buildContextClusterId(context: RoutingContext): string {
  return `${context.taskType}:${context.complexity}:${context.domain ?? "general"}`;
}

function findBestMeanModel(
  models: RoutableModel[],
  stats: Map<string, ArmStats>,
): string {
  let bestId = models[0].id;
  let bestMean = -Infinity;

  for (const model of models) {
    const s = stats.get(model.id);
    if (!s) continue;
    const mean = s.alpha / (s.alpha + s.beta);
    if (mean > bestMean) {
      bestMean = mean;
      bestId = model.id;
    }
  }

  return bestId;
}

function computeConfidence(alpha: number, beta: number): number {
  const sum = alpha + beta;
  const variance = (alpha * beta) / (sum * sum * (sum + 1));
  const normalizedVariance = Math.min(1, variance / 0.083);
  return 1 - normalizedVariance;
}

function buildReasoning(
  selectedId: string,
  wasExploratory: boolean,
  forceExplore: boolean,
  confidence: number,
  context: RoutingContext,
): string {
  const parts: string[] = [];

  parts.push(
    `Selected ${selectedId} for ${context.taskType} (${context.complexity})`,
  );

  if (forceExplore) {
    parts.push("forced exploration (periodic)");
  } else if (wasExploratory) {
    parts.push("exploratory (Thompson sampling selected non-dominant arm)");
  } else {
    parts.push("exploitative (best known model)");
  }

  parts.push(`confidence: ${(confidence * 100).toFixed(1)}%`);

  if (context.latencyBudgetMs) {
    parts.push(`latency budget: ${context.latencyBudgetMs}ms`);
  }

  return parts.join(" | ");
}