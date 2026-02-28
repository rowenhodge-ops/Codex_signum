// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { Debounce } from "./Debounce.js";
import { HampelFilter } from "./HampelFilter.js";
import { EWMASmoother } from "./EWMASmoother.js";
import { CUSUMMonitor } from "./CUSUMMonitor.js";
import { MACDDetector } from "./MACDDetector.js";
import { HysteresisGate } from "./HysteresisGate.js";
import { TrendRegression } from "./TrendRegression.js";
import { NelsonRules } from "./NelsonRules.js";
import type {
  SignalEvent,
  ConditionedSignal,
  SignalAlert,
  StageConfig,
} from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";

/** Default threshold center for health metrics (Healthy/Degraded boundary) */
const HEALTH_THRESHOLD = 0.5;

export class SignalPipeline {
  private debounce: Debounce;
  private hampel: HampelFilter;
  private ewma: EWMASmoother;
  private cusum: CUSUMMonitor;
  private macd: MACDDetector;
  private hysteresis: HysteresisGate;
  private trend: TrendRegression;
  private nelson: NelsonRules;
  private eventCounter: Map<string, number> = new Map();

  constructor(config: StageConfig = DEFAULT_CONFIG) {
    this.debounce = new Debounce(
      config.debounce.windowMs,
      config.debounce.persistenceCount,
    );
    this.hampel = new HampelFilter(config.hampel.windowSize, config.hampel.k);
    this.ewma = new EWMASmoother(
      config.ewma.alphaLeaf,
      config.ewma.alphaDefault,
      config.ewma.alphaHub,
    );
    this.cusum = new CUSUMMonitor(
      config.cusum.h,
      config.cusum.k,
      config.cusum.firEnabled,
    );
    this.macd = new MACDDetector(config.macd.fastAlpha, config.macd.slowAlpha);
    this.hysteresis = new HysteresisGate(config.hysteresis.bandMultiplier);
    this.trend = new TrendRegression(
      config.trend.windowSize,
      config.trend.warningHorizonEvents,
    );
    this.nelson = new NelsonRules();
  }

  /**
   * Process a raw health event through the full 7-stage pipeline.
   * Returns the conditioned signal with all computed fields and any alerts.
   */
  process(event: SignalEvent): ConditionedSignal {
    const key = `${event.agentId}:${event.dimension}`;
    const alerts: SignalAlert[] = [];

    // Track event index per key
    const idx = (this.eventCounter.get(key) ?? 0) + 1;
    this.eventCounter.set(key, idx);

    // ── Stage 1: Debounce ────────────────────────────────────────────
    const passedDebounce = this.debounce.process(
      event.agentId,
      event.dimension,
      event.rawValue,
      event.timestamp,
    );
    if (!passedDebounce) {
      return {
        ...event,
        smoothedValue: event.rawValue,
        cusumStatistic: 0,
        macdValue: 0,
        macdSignal: 0,
        trendSlope: 0,
        trendProjection: event.rawValue,
        alerts: [],
        filtered: true,
      };
    }

    // ── Stage 2: Hampel ──────────────────────────────────────────────
    const hampelResult = this.hampel.process(key, event.rawValue);
    const postHampel = hampelResult.value;

    // ── Stage 3: EWMA ────────────────────────────────────────────────
    const smoothedValue = this.ewma.process(
      key,
      postHampel,
      event.topologyRole ?? "default",
    );

    // Update hysteresis noise estimate with smoothed value
    this.hysteresis.updateNoiseEstimate(key, smoothedValue);

    // ── Stage 4: CUSUM ───────────────────────────────────────────────
    const cusumResult = this.cusum.process(key, smoothedValue);
    if (cusumResult.alarm) {
      alerts.push({
        type: "cusum_shift",
        severity: "warning",
        message: `CUSUM ${cusumResult.direction} shift detected (upper=${cusumResult.upperCusum.toFixed(2)}, lower=${cusumResult.lowerCusum.toFixed(2)})`,
      });
    }

    // ── Stage 5: MACD ────────────────────────────────────────────────
    const macdResult = this.macd.process(key, smoothedValue);
    if (macdResult.crossover === "bearish") {
      alerts.push({
        type: "macd_divergence",
        severity: "warning",
        message: `MACD bearish crossover — rapid degradation (histogram=${macdResult.histogram.toFixed(4)})`,
      });
    }

    // ── Stage 6: Hysteresis ──────────────────────────────────────────
    const hystResult = this.hysteresis.process(
      key,
      smoothedValue,
      HEALTH_THRESHOLD,
    );
    if (hystResult.transitioned && hystResult.alarm) {
      alerts.push({
        type: "hysteresis_alarm",
        severity: "critical",
        message: `Hysteresis alarm triggered — value ${smoothedValue.toFixed(4)} below tLow=${hystResult.tLow.toFixed(4)}`,
      });
    }

    // ── Stage 7: Trend ───────────────────────────────────────────────
    const trendResult = this.trend.process(key, smoothedValue, idx);
    if (trendResult.warning) {
      alerts.push({
        type: "trend_warning",
        severity: "warning",
        message: `Trend projects threshold breach in ${trendResult.eventsToThreshold} events (slope=${trendResult.slope.toFixed(6)})`,
      });
    }

    // ── Nelson Rules ─────────────────────────────────────────────────
    const nelsonAlerts = this.nelson.process(key, smoothedValue);
    alerts.push(...nelsonAlerts);

    return {
      ...event,
      smoothedValue,
      cusumStatistic: Math.max(cusumResult.upperCusum, cusumResult.lowerCusum),
      macdValue: macdResult.macdLine,
      macdSignal: macdResult.signalLine,
      trendSlope: trendResult.slope,
      trendProjection: trendResult.projectedValueAtHorizon,
      alerts,
      filtered: false,
    };
  }

  /**
   * Initialize a new agent in all stages.
   * Call when a new agent/pattern is first seen.
   */
  initializeAgent(
    agentId: string,
    dimension: string,
    baseline: number,
  ): void {
    const key = `${agentId}:${dimension}`;
    this.cusum.initializeAgent(key, baseline);
    this.nelson.setBaseline(key, baseline, baseline * 0.1 || 0.05);
  }
}
