import type { ArmStats } from "../../graph/queries.js";
import type { RoutableModel, RoutingContext, RoutingDecision, ThompsonRouterConfig } from "./types.js";
/**
 * Make a routing decision using Thompson Sampling.
 */
export declare function route(context: RoutingContext, models: RoutableModel[], armStats: ArmStats[], decisionCount?: number, config?: ThompsonRouterConfig): RoutingDecision;
/**
 * Build a deterministic context cluster ID from the routing context.
 */
export declare function buildContextClusterId(context: RoutingContext): string;
//# sourceMappingURL=router.d.ts.map