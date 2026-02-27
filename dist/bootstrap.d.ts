import type { AgentProps, PatternProps } from "./graph/queries.js";
export declare const ALL_ARMS: AgentProps[];
export declare function bootstrapAgents(force?: boolean): Promise<number>;
export declare const CORE_PATTERNS: PatternProps[];
export declare function bootstrapPatterns(force?: boolean): Promise<number>;
export declare function seedInformedPriors(): Promise<number>;
//# sourceMappingURL=bootstrap.d.ts.map