import type { HighlanderOptions } from "../instantiation.js";
export interface ResonatorProps {
    id: string;
    name: string;
    content: string;
    type: string;
    status: string;
    [key: string]: unknown;
}
/**
 * Create a Resonator AND wire it to a parent Bloom via the Instantiation Protocol.
 * Delegates to instantiateMorpheme() for hygiene, containment, and INSTANTIATES wiring.
 */
export declare function createContainedResonator(props: ResonatorProps, parentBloomId: string, highlander?: HighlanderOptions): Promise<void>;
/** Ensure the 7 Architect stage Blooms exist and are contained in the Architect Bloom */
export declare function ensureArchitectStages(architectBloomId: string): Promise<void>;
/** @deprecated Use ensureArchitectStages instead */
export declare const ensureArchitectResonators: typeof ensureArchitectStages;
/** Link a TaskOutput to the Stage Bloom for its assigned stage */
export declare function linkTaskOutputToStage(taskOutputId: string, stageId: string): Promise<void>;
//# sourceMappingURL=resonator.d.ts.map