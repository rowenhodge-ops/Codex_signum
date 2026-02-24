import type { SignalEvent, ConditionedSignal, StageConfig } from "./types.js";
export declare class SignalPipeline {
    private debounce;
    private hampel;
    private ewma;
    private cusum;
    private macd;
    private hysteresis;
    private trend;
    private nelson;
    private eventCounter;
    constructor(config?: StageConfig);
    /**
     * Process a raw health event through the full 7-stage pipeline.
     * Returns the conditioned signal with all computed fields and any alerts.
     */
    process(event: SignalEvent): ConditionedSignal;
    /**
     * Initialize a new agent in all stages.
     * Call when a new agent/pattern is first seen.
     */
    initializeAgent(agentId: string, dimension: string, baseline: number): void;
}
//# sourceMappingURL=SignalPipeline.d.ts.map