import type { CognitiveIntent } from "./types.js";
import type { ModelExecutor } from "../architect/types.js";
export interface CognitiveCycleOptions {
    /** Which Bloom to survey */
    targetBloomId: string;
    /** Which definition scopes to check (e.g., ['ecosystem', 'architect']) */
    definitionScopes: string[];
    /** Cycle number (increments each run) */
    cycleNumber: number;
    /** Max changes per intent */
    maxChanges: number;
    /** Priority weights from Config Seed */
    priorityWeights: {
        constitutional: number;
        lambda2: number;
        phiL: number;
    };
    /** Optional LLM substrate for topological reasoning */
    modelExecutor?: ModelExecutor;
    /** Optional CPT spec content for topological context */
    cptSpecContent?: string;
}
/**
 * Run a single Cognitive Bloom survey cycle.
 *
 * Survey -> Delta -> Intent -> Record Observation
 *
 * @returns CognitiveIntent or null if no gaps found
 */
export declare function runCognitiveCycle(options: CognitiveCycleOptions): Promise<CognitiveIntent | null>;
//# sourceMappingURL=cognitive-cycle.d.ts.map