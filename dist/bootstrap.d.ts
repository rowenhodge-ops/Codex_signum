import type { AgentProps, PatternProps } from "./graph/queries.js";
export declare const ALL_ARMS: AgentProps[];
export declare function bootstrapAgents(force?: boolean): Promise<number>;
export declare const CORE_PATTERNS: PatternProps[];
export declare function bootstrapPatterns(force?: boolean): Promise<number>;
export declare function seedInformedPriors(): Promise<number>;
/**
 * Seed strong informed priors for the analytical context cluster.
 *
 * Target: Opus 4.6 arms dominate analytical task selection (~70-80%),
 * Opus 4.5 arms fill ~15-20%, everything else ~2-5% combined.
 *
 * Uses synthetic Decision nodes with IDs prefixed "analytical_prior_"
 * to distinguish from baseline bootstrap decisions. Idempotent: clears
 * old analytical_prior_ decisions before reseeding.
 */
export declare function seedAnalyticalPriors(): Promise<number>;
//# sourceMappingURL=bootstrap.d.ts.map