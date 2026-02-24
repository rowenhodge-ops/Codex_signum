/** Default threshold for health metrics — below this value triggers alarm */
const DEFAULT_THRESHOLD = 0.5;

export interface TrendResult {
  slope: number;
  intercept: number;
  projectedValueAtHorizon: number;
  eventsToThreshold: number | null; // null if slope is flat or positive (improving)
  warning: boolean;
}

export class TrendRegression {
  private buffer: Map<string, { values: number[]; indices: number[] }> =
    new Map();

  constructor(
    private windowSize: number = 40,
    private warningHorizonEvents: number = 20,
  ) {}

  process(
    key: string,
    value: number,
    eventIndex: number,
    threshold: number = DEFAULT_THRESHOLD,
  ): TrendResult {
    let buf = this.buffer.get(key);
    if (!buf) {
      buf = { values: [], indices: [] };
      this.buffer.set(key, buf);
    }

    buf.values.push(value);
    buf.indices.push(eventIndex);

    // Trim to window
    while (buf.values.length > this.windowSize) {
      buf.values.shift();
      buf.indices.shift();
    }

    // Need at least 3 points for regression
    if (buf.values.length < 3) {
      return {
        slope: 0,
        intercept: value,
        projectedValueAtHorizon: value,
        eventsToThreshold: null,
        warning: false,
      };
    }

    const { slope, intercept } = this.computeTheilSenSlope(
      buf.values,
      buf.indices,
    );

    // Project value at warning horizon
    const lastIndex = buf.indices[buf.indices.length - 1];
    const horizonIndex = lastIndex + this.warningHorizonEvents;
    const projectedValueAtHorizon = slope * horizonIndex + intercept;

    // Calculate events to threshold (only if slope is negative = degrading)
    let eventsToThreshold: number | null = null;
    let warning = false;

    if (slope < -1e-10) {
      // Slope is negative — compute when value hits threshold
      // threshold = slope * (lastIndex + N) + intercept
      // N = (threshold - intercept - slope * lastIndex) / slope
      const currentProjected = slope * lastIndex + intercept;
      if (currentProjected > threshold) {
        eventsToThreshold = Math.ceil(
          (threshold - currentProjected) / slope,
        );
        warning =
          eventsToThreshold > 0 &&
          eventsToThreshold <= this.warningHorizonEvents;
      }
    }

    return {
      slope,
      intercept,
      projectedValueAtHorizon,
      eventsToThreshold,
      warning,
    };
  }

  /**
   * Theil-Sen estimator: median of all pairwise slopes.
   * Robust to up to 29.3% corrupted data points.
   */
  private computeTheilSenSlope(
    values: number[],
    indices: number[],
  ): { slope: number; intercept: number } {
    const n = values.length;
    const slopes: number[] = [];

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = indices[j] - indices[i];
        if (dx !== 0) {
          slopes.push((values[j] - values[i]) / dx);
        }
      }
    }

    if (slopes.length === 0) {
      return { slope: 0, intercept: values[0] };
    }

    slopes.sort((a, b) => a - b);
    const mid = Math.floor(slopes.length / 2);
    const slope =
      slopes.length % 2 === 0
        ? (slopes[mid - 1] + slopes[mid]) / 2
        : slopes[mid];

    // Intercept: median of (y_i - slope * x_i)
    const intercepts = values.map((v, i) => v - slope * indices[i]);
    intercepts.sort((a, b) => a - b);
    const iMid = Math.floor(intercepts.length / 2);
    const intercept =
      intercepts.length % 2 === 0
        ? (intercepts[iMid - 1] + intercepts[iMid]) / 2
        : intercepts[iMid];

    return { slope, intercept };
  }
}
