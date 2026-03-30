/**
 * Codex Signum — BOCPD Per-Metric Registry
 *
 * Coordinates one BOCPDDetector + cached state per metric name.
 * State can be loaded from / saved to Bloom properties via JSON serialisation.
 *
 * @module codex-signum-core/signals/BOCPDRegistry
 */
import type { BOCPDConfig, BOCPDSignal, BOCPDState } from "./types.js";
import { BOCPDDetector } from "./BOCPDDetector.js";
export declare class BOCPDRegistry {
    private readonly defaultConfig;
    private readonly metrics;
    constructor(defaultConfig?: Partial<BOCPDConfig>);
    /** Get or create a detector for the given metric. Config is only used on first call. */
    getOrCreate(metricName: string, config?: Partial<BOCPDConfig>): BOCPDDetector;
    /** Observe a value for the named metric. Auto-creates detector with defaults if needed. */
    observe(metricName: string, value: number): BOCPDSignal;
    /** Get the current persisted state for a metric, or undefined if not tracked. */
    getState(metricName: string): BOCPDState | undefined;
    /** Load state for a metric (e.g. from deserialised Bloom property). Creates detector if needed. */
    setState(metricName: string, state: BOCPDState): void;
    /** Reset a single metric to initial state. No-op if metric is not tracked. */
    reset(metricName: string): void;
    /** Reset all tracked metrics to initial state. Detector instances are preserved. */
    resetAll(): void;
}
//# sourceMappingURL=BOCPDRegistry.d.ts.map