import type { SeedProps, BloomProps } from "./graph/queries.js";
export declare const ALL_ARMS: SeedProps[];
export declare function bootstrapSeeds(force?: boolean): Promise<number>;
export declare const CORE_BLOOMS: BloomProps[];
export declare function bootstrapBlooms(force?: boolean): Promise<number>;
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
/** @deprecated Use bootstrapSeeds */
export declare const bootstrapAgents: typeof bootstrapSeeds;
/** @deprecated Use bootstrapBlooms */
export declare const bootstrapPatterns: typeof bootstrapBlooms;
/** @deprecated Use CORE_BLOOMS */
export declare const CORE_PATTERNS: BloomProps[];
//# sourceMappingURL=bootstrap.d.ts.map