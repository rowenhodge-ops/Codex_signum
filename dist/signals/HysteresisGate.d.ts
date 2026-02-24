export interface HysteresisResult {
    alarm: boolean;
    transitioned: boolean;
    tLow: number;
    tHigh: number;
}
export declare class HysteresisGate {
    private bandMultiplier;
    private alarmState;
    private noiseEstimate;
    constructor(bandMultiplier?: number);
    /**
     * @param thresholdCenter - The nominal threshold (e.g. 0.5 for Healthy/Degraded boundary)
     */
    process(key: string, smoothedValue: number, thresholdCenter: number): HysteresisResult;
    /**
     * Track filtered signal values to estimate Vpp (peak-to-peak noise).
     * Call this with each post-EWMA value.
     */
    updateNoiseEstimate(key: string, value: number): void;
    private getVpp;
}
//# sourceMappingURL=HysteresisGate.d.ts.map