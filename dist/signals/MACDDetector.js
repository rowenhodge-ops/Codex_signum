export class MACDDetector {
    fastAlpha;
    slowAlpha;
    signalAlpha;
    fastEWMA = new Map();
    slowEWMA = new Map();
    signalLineState = new Map();
    prevHistogram = new Map();
    constructor(fastAlpha = 0.25, slowAlpha = 0.04, signalAlpha = 0.15) {
        this.fastAlpha = fastAlpha;
        this.slowAlpha = slowAlpha;
        this.signalAlpha = signalAlpha;
    }
    process(key, value) {
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
        const signalLine = this.signalAlpha * macdLine + (1 - this.signalAlpha) * prevSignal;
        this.signalLineState.set(key, signalLine);
        // Histogram
        const histogram = macdLine - signalLine;
        // Detect crossover
        const prevHist = this.prevHistogram.get(key) ?? 0;
        let crossover = "none";
        if (prevHist <= 0 && histogram > 0) {
            crossover = "bullish"; // MACD crosses above signal → improving
        }
        else if (prevHist >= 0 && histogram < 0) {
            crossover = "bearish"; // MACD crosses below signal → degrading
        }
        this.prevHistogram.set(key, histogram);
        return { macdLine, signalLine, histogram, crossover };
    }
}
//# sourceMappingURL=MACDDetector.js.map