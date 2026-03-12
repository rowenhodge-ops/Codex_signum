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
export declare function createContainedResonator(props: ResonatorProps, parentBloomId: string): Promise<void>;
/** Ensure the 7 Architect stage Resonators exist and are contained in the Architect Bloom */
export declare function ensureArchitectResonators(architectBloomId: string): Promise<void>;
/** Link a TaskOutput to the Resonator for its assigned stage */
export declare function linkTaskOutputToStage(taskOutputId: string, resonatorId: string): Promise<void>;
//# sourceMappingURL=resonator.d.ts.map