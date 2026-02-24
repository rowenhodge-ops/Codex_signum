export interface MACDResult {
    macdLine: number;
    signalLine: number;
    histogram: number;
    crossover: "bullish" | "bearish" | "none";
}
export declare class MACDDetector {
    private fastAlpha;
    private slowAlpha;
    private signalAlpha;
    private fastEWMA;
    private slowEWMA;
    private signalLineState;
    private prevHistogram;
    constructor(fastAlpha?: number, slowAlpha?: number, signalAlpha?: number);
    process(key: string, value: number): MACDResult;
}
//# sourceMappingURL=MACDDetector.d.ts.map