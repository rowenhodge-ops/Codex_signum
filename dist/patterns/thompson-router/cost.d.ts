/** Task category cost configuration */
export interface TaskCostConfig {
    costSensitivity: number;
    referenceCost: number;
}
/** Default cost configs by task category */
export declare const TASK_COST_DEFAULTS: Record<string, TaskCostConfig>;
/**
 * Compute cost-adjusted quality reward.
 */
export declare function computeCostAdjustedReward(rawQuality: number, actualCost: number, taskCategory: string, costConfig?: TaskCostConfig): number;
//# sourceMappingURL=cost.d.ts.map