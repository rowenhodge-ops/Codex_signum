import type { SignalAlert } from "./types.js";
export declare class NelsonRules {
    private buffer;
    private stats;
    /**
     * Process a conditioned value and check all three rules.
     * Baseline stats (mean, stddev) should be set from historical stable data.
     */
    process(key: string, value: number): SignalAlert[];
    setBaseline(key: string, mean: number, stddev: number): void;
    /**
     * Rule 1: One point beyond 3σ — catastrophic failure detection
     */
    private checkRule1;
    /**
     * Rule 2: Nine consecutive same-side points — sustained shift detection
     */
    private checkRule2;
    /**
     * Rule 7: Fifteen points within 1σ — zombie/stale agent detection
     */
    private checkRule7;
    private appendToBuffer;
}
//# sourceMappingURL=NelsonRules.d.ts.map