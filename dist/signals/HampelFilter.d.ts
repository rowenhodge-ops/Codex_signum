export declare class HampelFilter {
    private windowSize;
    private k;
    private buffer;
    constructor(windowSize?: number, k?: number);
    /**
     * Process a value. Returns { value, isOutlier }.
     * If outlier, value is replaced with window median.
     * If not enough data in buffer yet, pass through unchanged.
     */
    process(key: string, rawValue: number): {
        value: number;
        isOutlier: boolean;
    };
    private computeMedian;
    private computeMAD;
}
//# sourceMappingURL=HampelFilter.d.ts.map