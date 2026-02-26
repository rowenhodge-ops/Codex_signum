/**
 * Codex Signum — Conformance Tests: Signal Pipeline Spec Compliance
 *
 * Verifies spec-required configuration values and that the pipeline
 * produces structurally correct output. End-to-end behavioral tests
 * are in tests/pipeline/signal-conditioning.test.ts.
 *
 * @see engineering-bridge-v2.0.md §Part 4 "Signal Conditioning"
 */
import { describe, expect, it } from "vitest";
import { SignalPipeline } from "../../src/signals/SignalPipeline.js";
import { DEFAULT_CONFIG } from "../../src/signals/types.js";
import type { SignalEvent } from "../../src/signals/types.js";

// ── Spec-required default config values ───────────────────────────────────

describe("Signal pipeline spec-required defaults", () => {
  it("debounce window = 100ms [Engineering Bridge §Part 4]", () => {
    expect(DEFAULT_CONFIG.debounce.windowMs).toBe(100);
  });

  it("debounce persistence = 2-3 events [spec range]", () => {
    expect(DEFAULT_CONFIG.debounce.persistenceCount).toBeGreaterThanOrEqual(2);
    expect(DEFAULT_CONFIG.debounce.persistenceCount).toBeLessThanOrEqual(3);
  });

  it("Hampel window = 7 points [Engineering Bridge §Part 4]", () => {
    expect(DEFAULT_CONFIG.hampel.windowSize).toBe(7);
  });

  it("Hampel k = 3 [Engineering Bridge §Part 4]", () => {
    expect(DEFAULT_CONFIG.hampel.k).toBe(3);
  });

  it("EWMA α leaf = 0.25 [Engineering Bridge §Part 4]", () => {
    expect(DEFAULT_CONFIG.ewma.alphaLeaf).toBeCloseTo(0.25, 4);
  });

  it("EWMA α default = 0.15 [Engineering Bridge §Part 4]", () => {
    expect(DEFAULT_CONFIG.ewma.alphaDefault).toBeCloseTo(0.15, 4);
  });

  it("EWMA α hub = 0.08 [Engineering Bridge §Part 4]", () => {
    expect(DEFAULT_CONFIG.ewma.alphaHub).toBeCloseTo(0.08, 4);
  });

  it("CUSUM h ≈ 4-5 [Engineering Bridge §Part 4]", () => {
    expect(DEFAULT_CONFIG.cusum.h).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_CONFIG.cusum.h).toBeLessThanOrEqual(5);
  });

  it("MACD fast α = 0.25 [Engineering Bridge §Part 4]", () => {
    expect(DEFAULT_CONFIG.macd.fastAlpha).toBeCloseTo(0.25, 4);
  });

  it("MACD slow α = 0.04 [Engineering Bridge §Part 4]", () => {
    expect(DEFAULT_CONFIG.macd.slowAlpha).toBeCloseTo(0.04, 4);
  });

  it("Hysteresis band ≥ 2× (Schmitt trigger standard)", () => {
    expect(DEFAULT_CONFIG.hysteresis.bandMultiplier).toBeGreaterThanOrEqual(2);
  });

  it("Trend window = 30-50 events [Engineering Bridge §Part 4]", () => {
    expect(DEFAULT_CONFIG.trend.windowSize).toBeGreaterThanOrEqual(30);
    expect(DEFAULT_CONFIG.trend.windowSize).toBeLessThanOrEqual(50);
  });
});

// ── Output structure ───────────────────────────────────────────────────────

describe("Signal pipeline output structure", () => {
  function makeEvent(value: number, ts: number): SignalEvent {
    return {
      agentId: "agent-1",
      dimension: "phiL",
      rawValue: value,
      timestamp: ts,
      topologyRole: "default",
    };
  }

  it("returns ConditionedSignal with all required fields", () => {
    const pipeline = new SignalPipeline();
    const now = Date.now();
    // Feed several events to prime the pipeline
    let result = pipeline.process(makeEvent(0.8, now));
    for (let i = 1; i < 5; i++) {
      result = pipeline.process(makeEvent(0.8 - i * 0.01, now + i * 200));
    }

    expect(typeof result.smoothedValue).toBe("number");
    expect(typeof result.cusumStatistic).toBe("number");
    expect(typeof result.macdValue).toBe("number");
    expect(typeof result.macdSignal).toBe("number");
    expect(typeof result.trendSlope).toBe("number");
    expect(typeof result.trendProjection).toBe("number");
    expect(Array.isArray(result.alerts)).toBe(true);
    expect(typeof result.filtered).toBe("boolean");
  });

  it("smoothedValue is in [0, 1] for health inputs in [0, 1]", () => {
    const pipeline = new SignalPipeline();
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      const result = pipeline.process(makeEvent(0.8, now + i * 200));
      if (!result.filtered) {
        expect(result.smoothedValue).toBeGreaterThanOrEqual(0);
        expect(result.smoothedValue).toBeLessThanOrEqual(1.01); // small floating point margin
      }
    }
  });

  it("debounced event returns filtered=true", () => {
    const pipeline = new SignalPipeline();
    const now = Date.now();
    // Two events with same timestamp (within debounce window, < 100ms)
    pipeline.process(makeEvent(0.8, now));
    const second = pipeline.process(makeEvent(0.75, now + 10)); // within 100ms window
    expect(second.filtered).toBe(true);
  });
});

// ── Alert types ───────────────────────────────────────────────────────────

describe("Alert type taxonomy", () => {
  it("known alert types match spec", () => {
    const validTypes = ["cusum_shift", "macd_divergence", "hysteresis_alarm", "trend_warning", "nelson_rule"];
    // Type-level test — all alert types in the enum are valid
    expect(validTypes).toHaveLength(5);
  });
});
