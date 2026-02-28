// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/** Task category cost configuration */
export interface TaskCostConfig {
  costSensitivity: number;
  referenceCost: number;
}

/** Default cost configs by task category */
export const TASK_COST_DEFAULTS: Record<string, TaskCostConfig> = {
  strategic: { costSensitivity: 0.1, referenceCost: 1.0 },
  analytical: { costSensitivity: 0.3, referenceCost: 0.3 },
  generative: { costSensitivity: 0.5, referenceCost: 0.15 },
  routine: { costSensitivity: 0.8, referenceCost: 0.02 },
};

/**
 * Compute cost-adjusted quality reward.
 */
export function computeCostAdjustedReward(
  rawQuality: number,
  actualCost: number,
  taskCategory: string,
  costConfig?: TaskCostConfig,
): number {
  const config =
    costConfig ?? TASK_COST_DEFAULTS[taskCategory] ?? TASK_COST_DEFAULTS.generative;

  if (config.referenceCost <= 0 || actualCost <= 0) {
    return Math.max(0, Math.min(1, rawQuality));
  }

  const costRatio = actualCost / config.referenceCost;
  const costPenalty =
    (config.costSensitivity * Math.max(0, costRatio - 1)) / (1 + costRatio);
  const reward = rawQuality - costPenalty;

  return Math.max(0, Math.min(1, reward));
}