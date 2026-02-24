/**
 * Codex Signum — Signal Conditioning Pipeline
 *
 * 7-stage signal processing pipeline for health metric conditioning:
 * 1. Debounce — suppress duplicate/noise events
 * 2. Hampel Filter — outlier detection and replacement
 * 3. EWMA Smoother — exponentially weighted moving average (topology-aware α)
 * 4. CUSUM Monitor — cumulative sum change-point detection
 * 5. MACD Detector — Moving Average Convergence Divergence
 * 6. Hysteresis Gate — noise-adaptive threshold with deadband
 * 7. Trend Regression — Theil-Sen slope with projection
 *
 * Plus: Nelson Rules (1, 2, 7) run in parallel for SPC alerting.
 *
 * Ported from DND-Manager agent/signals/ — zero external dependencies.
 * Core is stateless: callers instantiate SignalPipeline and own its lifecycle.
 *
 * @module codex-signum-core/signals
 */
export { SignalPipeline } from "./SignalPipeline.js";
export { CUSUMMonitor } from "./CUSUMMonitor.js";
export type { CUSUMResult } from "./CUSUMMonitor.js";
export { Debounce } from "./Debounce.js";
export { EWMASmoother } from "./EWMASmoother.js";
export { HampelFilter } from "./HampelFilter.js";
export { HysteresisGate } from "./HysteresisGate.js";
export type { HysteresisResult } from "./HysteresisGate.js";
export { MACDDetector } from "./MACDDetector.js";
export type { MACDResult } from "./MACDDetector.js";
export { NelsonRules } from "./NelsonRules.js";
export { TrendRegression } from "./TrendRegression.js";
export type { TrendResult } from "./TrendRegression.js";
export type { ConditionedSignal, SignalAlert, SignalEvent, StageConfig, } from "./types.js";
export { DEFAULT_CONFIG } from "./types.js";
//# sourceMappingURL=index.d.ts.map