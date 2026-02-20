/**
 * Codex Signum — Thompson Router (Resonator)
 *
 * The router is a Resonator morpheme: it transforms decision contexts
 * into model selections using Thompson Sampling with contextual clustering.
 *
 * Key principles:
 * - Every routing decision = (context, model, quality, cost) — Axiom 4
 * - Thompson Sampling provides principled exploration/exploitation balance
 * - Context clusters enable transfer learning across similar tasks
 * - εR floor prevents exploitation collapse
 *
 * Thompson Sampling:
 *   For each arm (model), maintain Beta(α, β) distribution.
 *   α = successes + 1, β = failures + 1
 *   To select: sample θ ~ Beta(α, β) for each arm, pick highest θ.
 *   This naturally balances exploration (wide distributions) with
 *   exploitation (peaked distributions).
 *
 * @see codex-signum-v3.0.md §Resonator morpheme
 * @see engineering-bridge-v2.0.md §Part 6 "Thompson Router"
 * @module codex-signum-core/patterns/thompson-router
 */

import type { ArmStats } from "../graph/queries.js";

// ============ TYPES ============

/** A model available for routing */
export interface RoutableModel {
  id: string;
  name: string;
  provider: string;
  avgLatencyMs: number;
  costPer1kTokens: number;
  capabilities: string[];
  status: "active" | "inactive" | "degraded";
}

/** Context for a routing decision */
export interface RoutingContext {
  taskType: string;
  complexity: "trivial" | "moderate" | "complex" | "critical";
  domain?: string;
  qualityRequirement: number; // 0.0–1.0
  latencyBudgetMs?: number;
  costCeiling?: number;
}

/** Result of a routing decision */
export interface RoutingDecision {
  selectedModelId: string;
  wasExploratory: boolean;
  confidence: number;
  sampledValues: Map<string, number>; // model → sampled θ
  contextClusterId: string;
  reasoning: string;
}

/** Configuration for the Thompson Router */
export interface ThompsonRouterConfig {
  /** Minimum exploration fraction (εR floor) */
  epsilonFloor: number;
  /** Force exploration every N decisions */
  forceExploreEvery: number;
  /** Quality threshold below which to re-sample */
  qualityFloor: number;
  /** Latency penalty factor (penalizes slow models) */
  latencyPenaltyFactor: number;
  /** Cost penalty factor (penalizes expensive models) */
  costPenaltyFactor: number;
}

/** Default router configuration */
export const DEFAULT_ROUTER_CONFIG: ThompsonRouterConfig = {
  epsilonFloor: 0.01,
  forceExploreEvery: 20,
  qualityFloor: 0.5,
  latencyPenaltyFactor: 0.0001, // Penalty per ms
  costPenaltyFactor: 0.01, // Penalty per unit cost
};

// ============ THOMPSON SAMPLING ============

/**
 * Sample from a Beta distribution using the Jöhnk algorithm.
 *
 * Beta(α, β) is the conjugate prior for Bernoulli trials.
 * Samples represent "belief" about the true success probability.
 */
export function sampleBeta(alpha: number, beta: number): number {
  if (alpha <= 0 || beta <= 0) {
    throw new Error(`Beta parameters must be positive: α=${alpha}, β=${beta}`);
  }

  // Use the Gamma-based sampling approach (more numerically stable)
  const x = sampleGamma(alpha, 1);
  const y = sampleGamma(beta, 1);
  return x / (x + y);
}

/**
 * Sample from Gamma(shape, scale) distribution.
 * Uses Marsaglia and Tsang's method for shape >= 1,
 * with Ahrens-Dieter for shape < 1.
 */
function sampleGamma(shape: number, scale: number): number {
  if (shape < 1) {
    // Ahrens-Dieter method for shape < 1
    const u = Math.random();
    return sampleGamma(shape + 1, scale) * Math.pow(u, 1 / shape);
  }

  // Marsaglia and Tsang's method for shape >= 1
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number;
    let v: number;
    do {
      x = randn();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * (x * x) * (x * x)) {
      return d * v * scale;
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v * scale;
    }
  }
}

/**
 * Standard normal sample using Box-Muller transform.
 */
function randn(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ============ CORE ROUTING ============

/**
 * Make a routing decision using Thompson Sampling.
 *
 * @param context — The task context
 * @param models — Available models
 * @param armStats — Historical performance per model (from graph)
 * @param decisionCount — Total decisions made so far (for force-explore)
 * @param config — Router configuration
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

  // Filter to active models only
  const activeModels = models.filter((m) => m.status === "active");
  if (activeModels.length === 0) {
    throw new Error("No active models available");
  }

  // Build stats lookup
  const statsMap = new Map(armStats.map((s) => [s.agentId, s]));

  // Context cluster for decision tracking
  const contextClusterId = buildContextClusterId(context);

  // Check if we should force exploration
  const forceExplore =
    decisionCount > 0 && decisionCount % config.forceExploreEvery === 0;

  // For each model, compute Thompson sample + adjustments
  const sampledValues = new Map<string, number>();
  const adjustedScores = new Map<string, number>();

  for (const model of activeModels) {
    const stats = statsMap.get(model.id);
    const alpha = stats?.alpha ?? 1; // Prior: 1 success
    const beta = stats?.beta ?? 1; // Prior: 1 failure

    // Sample from posterior Beta distribution
    let theta = sampleBeta(alpha, beta);

    // Apply latency penalty
    if (context.latencyBudgetMs && model.avgLatencyMs > 0) {
      const latencyExcess = Math.max(
        0,
        model.avgLatencyMs - context.latencyBudgetMs,
      );
      theta -= latencyExcess * config.latencyPenaltyFactor;
    }

    // Apply cost penalty
    if (context.costCeiling && model.costPer1kTokens > 0) {
      const costExcess = Math.max(
        0,
        model.costPer1kTokens - context.costCeiling,
      );
      theta -= costExcess * config.costPenaltyFactor;
    }

    sampledValues.set(model.id, theta);
    adjustedScores.set(model.id, theta);
  }

  // Select model with highest adjusted Thompson sample
  let selectedId = activeModels[0].id;
  let bestScore = -Infinity;

  for (const [modelId, score] of adjustedScores) {
    if (score > bestScore) {
      bestScore = score;
      selectedId = modelId;
    }
  }

  // Determine if this was exploratory
  // Exploration = selecting a model that is NOT the one with highest mean reward
  const bestMeanModel = findBestMeanModel(activeModels, statsMap);
  let wasExploratory = selectedId !== bestMeanModel;

  // If forcing exploration, explicitly pick a non-best model
  if (forceExplore && activeModels.length > 1) {
    const nonBest = activeModels.filter((m) => m.id !== bestMeanModel);
    const randomIndex = Math.floor(Math.random() * nonBest.length);
    selectedId = nonBest[randomIndex].id;
    wasExploratory = true;
  }

  // Compute confidence (inverse of posterior variance)
  const selectedStats = statsMap.get(selectedId);
  const confidence =
    selectedStats && selectedStats.totalTrials > 0
      ? computeConfidence(selectedStats.alpha, selectedStats.beta)
      : 0.1; // Low confidence with no data

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

// ============ HELPERS ============

/**
 * Build a deterministic context cluster ID from the routing context.
 */
export function buildContextClusterId(context: RoutingContext): string {
  return `${context.taskType}:${context.complexity}:${context.domain ?? "general"}`;
}

/**
 * Find the model with highest historical mean reward.
 */
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

/**
 * Compute confidence from Beta distribution parameters.
 *
 * Confidence = 1 - normalized_variance
 * Variance of Beta(α,β) = αβ / ((α+β)²(α+β+1))
 * Max variance (at α=β=1) = 1/12 ≈ 0.083
 */
function computeConfidence(alpha: number, beta: number): number {
  const sum = alpha + beta;
  const variance = (alpha * beta) / (sum * sum * (sum + 1));
  // Normalize: max variance is ~0.083 (uniform prior)
  const normalizedVariance = Math.min(1, variance / 0.083);
  return 1 - normalizedVariance;
}

/**
 * Build human-readable reasoning for the routing decision.
 */
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
