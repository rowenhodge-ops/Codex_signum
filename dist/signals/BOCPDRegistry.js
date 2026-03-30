// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { BOCPDDetector } from "./BOCPDDetector.js";
export class BOCPDRegistry {
    defaultConfig;
    metrics = new Map();
    constructor(defaultConfig) {
        this.defaultConfig = defaultConfig ? { ...defaultConfig } : {};
    }
    /** Get or create a detector for the given metric. Config is only used on first call. */
    getOrCreate(metricName, config) {
        const entry = this.metrics.get(metricName);
        if (entry)
            return entry.detector;
        const merged = { ...this.defaultConfig, ...config };
        const detector = new BOCPDDetector(merged);
        this.metrics.set(metricName, { detector, state: detector.initialState() });
        return detector;
    }
    /** Observe a value for the named metric. Auto-creates detector with defaults if needed. */
    observe(metricName, value) {
        this.getOrCreate(metricName);
        const entry = this.metrics.get(metricName);
        const { signal, nextState } = entry.detector.update(value, entry.state);
        entry.state = nextState;
        return signal;
    }
    /** Get the current persisted state for a metric, or undefined if not tracked. */
    getState(metricName) {
        return this.metrics.get(metricName)?.state;
    }
    /** Load state for a metric (e.g. from deserialised Bloom property). Creates detector if needed. */
    setState(metricName, state) {
        const detector = this.getOrCreate(metricName);
        const entry = this.metrics.get(metricName);
        // Preserve the existing detector instance, update state only
        entry.state = state;
    }
    /** Reset a single metric to initial state. No-op if metric is not tracked. */
    reset(metricName) {
        const entry = this.metrics.get(metricName);
        if (!entry)
            return;
        entry.state = entry.detector.reset();
    }
    /** Reset all tracked metrics to initial state. Detector instances are preserved. */
    resetAll() {
        for (const [, entry] of this.metrics) {
            entry.state = entry.detector.reset();
        }
    }
}
//# sourceMappingURL=BOCPDRegistry.js.map