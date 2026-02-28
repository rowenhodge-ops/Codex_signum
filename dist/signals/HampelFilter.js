// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/** Consistency constant for MAD under Gaussian assumptions: 1/Φ⁻¹(3/4) */
const MAD_CONSISTENCY = 1.4826;
export class HampelFilter {
    windowSize;
    k;
    buffer = new Map();
    constructor(windowSize = 7, k = 3) {
        this.windowSize = windowSize;
        this.k = k;
    }
    /**
     * Process a value. Returns { value, isOutlier }.
     * If outlier, value is replaced with window median.
     * If not enough data in buffer yet, pass through unchanged.
     */
    process(key, rawValue) {
        let buf = this.buffer.get(key);
        if (!buf) {
            buf = [];
            this.buffer.set(key, buf);
        }
        // Add to ring buffer
        buf.push(rawValue);
        if (buf.length > this.windowSize) {
            buf.shift();
        }
        // Need at least 3 points for a meaningful median/MAD
        if (buf.length < 3) {
            return { value: rawValue, isOutlier: false };
        }
        const median = this.computeMedian(buf);
        const mad = this.computeMAD(buf, median);
        // If MAD is zero (all values identical), no outlier detection possible
        if (mad === 0) {
            const isOutlier = rawValue !== median;
            return {
                value: isOutlier ? median : rawValue,
                isOutlier,
            };
        }
        const threshold = this.k * MAD_CONSISTENCY * mad;
        const isOutlier = Math.abs(rawValue - median) > threshold;
        if (isOutlier) {
            // Replace outlier in buffer with median
            buf[buf.length - 1] = median;
            return { value: median, isOutlier: true };
        }
        return { value: rawValue, isOutlier: false };
    }
    computeMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }
    computeMAD(values, median) {
        const deviations = values.map((v) => Math.abs(v - median));
        return this.computeMedian(deviations);
    }
}
//# sourceMappingURL=HampelFilter.js.map