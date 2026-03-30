// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

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

interface MetricEntry {
  detector: BOCPDDetector;
  state: BOCPDState;
}

export class BOCPDRegistry {
  private readonly defaultConfig: Partial<BOCPDConfig>;
  private readonly metrics: Map<string, MetricEntry> = new Map();

  constructor(defaultConfig?: Partial<BOCPDConfig>) {
    this.defaultConfig = defaultConfig ? { ...defaultConfig } : {};
  }

  /** Get or create a detector for the given metric. Config is only used on first call. */
  getOrCreate(metricName: string, config?: Partial<BOCPDConfig>): BOCPDDetector {
    const entry = this.metrics.get(metricName);
    if (entry) return entry.detector;

    const merged = { ...this.defaultConfig, ...config };
    const detector = new BOCPDDetector(merged);
    this.metrics.set(metricName, { detector, state: detector.initialState() });
    return detector;
  }

  /** Observe a value for the named metric. Auto-creates detector with defaults if needed. */
  observe(metricName: string, value: number): BOCPDSignal {
    this.getOrCreate(metricName);
    const entry = this.metrics.get(metricName)!;
    const { signal, nextState } = entry.detector.update(value, entry.state);
    entry.state = nextState;
    return signal;
  }

  /** Get the current persisted state for a metric, or undefined if not tracked. */
  getState(metricName: string): BOCPDState | undefined {
    return this.metrics.get(metricName)?.state;
  }

  /** Load state for a metric (e.g. from deserialised Bloom property). Creates detector if needed. */
  setState(metricName: string, state: BOCPDState): void {
    const detector = this.getOrCreate(metricName);
    const entry = this.metrics.get(metricName)!;
    // Preserve the existing detector instance, update state only
    entry.state = state;
  }

  /** Reset a single metric to initial state. No-op if metric is not tracked. */
  reset(metricName: string): void {
    const entry = this.metrics.get(metricName);
    if (!entry) return;
    entry.state = entry.detector.reset();
  }

  /** Reset all tracked metrics to initial state. Detector instances are preserved. */
  resetAll(): void {
    for (const [, entry] of this.metrics) {
      entry.state = entry.detector.reset();
    }
  }
}
