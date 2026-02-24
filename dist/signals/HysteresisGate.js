const VPP_BUFFER_SIZE = 50;
export class HysteresisGate {
    bandMultiplier;
    alarmState = new Map();
    noiseEstimate = new Map();
    constructor(bandMultiplier = 2) {
        this.bandMultiplier = bandMultiplier;
    }
    /**
     * @param thresholdCenter - The nominal threshold (e.g. 0.5 for Healthy/Degraded boundary)
     */
    process(key, smoothedValue, thresholdCenter) {
        const vpp = this.getVpp(key);
        const band = this.bandMultiplier * vpp;
        // Minimum band to prevent zero-width hysteresis
        const effectiveBand = Math.max(band, 0.01);
        const tLow = thresholdCenter - effectiveBand / 2;
        const tHigh = thresholdCenter + effectiveBand / 2;
        const wasInAlarm = this.alarmState.get(key) ?? false;
        let alarm;
        if (wasInAlarm) {
            // Currently in alarm — only clear if value rises above tHigh
            alarm = smoothedValue < tHigh;
        }
        else {
            // Not in alarm — only trigger if value drops below tLow
            alarm = smoothedValue < tLow;
        }
        this.alarmState.set(key, alarm);
        const transitioned = alarm !== wasInAlarm;
        return { alarm, transitioned, tLow, tHigh };
    }
    /**
     * Track filtered signal values to estimate Vpp (peak-to-peak noise).
     * Call this with each post-EWMA value.
     */
    updateNoiseEstimate(key, value) {
        let state = this.noiseEstimate.get(key);
        if (!state) {
            state = { vpp: 0, values: [] };
            this.noiseEstimate.set(key, state);
        }
        state.values.push(value);
        if (state.values.length > VPP_BUFFER_SIZE) {
            state.values.shift();
        }
        if (state.values.length >= 3) {
            const min = Math.min(...state.values);
            const max = Math.max(...state.values);
            state.vpp = max - min;
        }
    }
    getVpp(key) {
        return this.noiseEstimate.get(key)?.vpp ?? 0;
    }
}
//# sourceMappingURL=HysteresisGate.js.map