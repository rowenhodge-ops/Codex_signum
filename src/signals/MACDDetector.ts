// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

export interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number; // macdLine - signalLine
  crossover: "bullish" | "bearish" | "none";
}

export class MACDDetector {
  private fastEWMA: Map<string, number> = new Map();
  private slowEWMA: Map<string, number> = new Map();
  private signalLineState: Map<string, number> = new Map();
  private prevHistogram: Map<string, number> = new Map();

  constructor(
    private fastAlpha: number = 0.25,
    private slowAlpha: number = 0.04,
    private signalAlpha: number = 0.15,
  ) {}

  process(key: string, value: number): MACDResult {
    // Update fast EWMA
    const prevFast = this.fastEWMA.get(key) ?? value;
    const fast = this.fastAlpha * value + (1 - this.fastAlpha) * prevFast;
    this.fastEWMA.set(key, fast);

    // Update slow EWMA
    const prevSlow = this.slowEWMA.get(key) ?? value;
    const slow = this.slowAlpha * value + (1 - this.slowAlpha) * prevSlow;
    this.slowEWMA.set(key, slow);

    // MACD line = fast - slow
    const macdLine = fast - slow;

    // Signal line = EWMA of MACD line
    const prevSignal = this.signalLineState.get(key) ?? macdLine;
    const signalLine =
      this.signalAlpha * macdLine + (1 - this.signalAlpha) * prevSignal;
    this.signalLineState.set(key, signalLine);

    // Histogram
    const histogram = macdLine - signalLine;

    // Detect crossover
    const prevHist = this.prevHistogram.get(key) ?? 0;
    let crossover: "bullish" | "bearish" | "none" = "none";
    if (prevHist <= 0 && histogram > 0) {
      crossover = "bullish"; // MACD crosses above signal → improving
    } else if (prevHist >= 0 && histogram < 0) {
      crossover = "bearish"; // MACD crosses below signal → degrading
    }
    this.prevHistogram.set(key, histogram);

    return { macdLine, signalLine, histogram, crossover };
  }
}
