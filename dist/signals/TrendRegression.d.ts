export interface TrendResult {
    slope: number;
    intercept: number;
    projectedValueAtHorizon: number;
    eventsToThreshold: number | null;
    warning: boolean;
}
export declare class TrendRegression {
    private windowSize;
    private warningHorizonEvents;
    private buffer;
    constructor(windowSize?: number, warningHorizonEvents?: number);
    process(key: string, value: number, eventIndex: number, threshold?: number): TrendResult;
    /**
     * Theil-Sen estimator: median of all pairwise slopes.
     * Robust to up to 29.3% corrupted data points.
     */
    private computeTheilSenSlope;
}
//# sourceMappingURL=TrendRegression.d.ts.map