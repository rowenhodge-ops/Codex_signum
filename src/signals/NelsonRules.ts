import type { SignalAlert } from "./types.js";

const RULE_2_CONSECUTIVE = 9;
const RULE_7_CONSECUTIVE = 15;

export class NelsonRules {
  private buffer: Map<string, number[]> = new Map();
  private stats: Map<string, { mean: number; stddev: number }> = new Map();

  /**
   * Process a conditioned value and check all three rules.
   * Baseline stats (mean, stddev) should be set from historical stable data.
   */
  process(key: string, value: number): SignalAlert[] {
    const stat = this.stats.get(key);
    if (!stat || stat.stddev === 0) {
      // No baseline set — track values but can't evaluate rules
      this.appendToBuffer(key, value);
      return [];
    }

    this.appendToBuffer(key, value);
    const alerts: SignalAlert[] = [];

    const r1 = this.checkRule1(value, stat.mean, stat.stddev);
    if (r1) alerts.push(r1);

    const r2 = this.checkRule2(key, value, stat.mean);
    if (r2) alerts.push(r2);

    const r7 = this.checkRule7(key, value, stat.mean, stat.stddev);
    if (r7) alerts.push(r7);

    return alerts;
  }

  setBaseline(key: string, mean: number, stddev: number): void {
    this.stats.set(key, { mean, stddev });
  }

  /**
   * Rule 1: One point beyond 3σ — catastrophic failure detection
   */
  private checkRule1(
    value: number,
    mean: number,
    sigma: number,
  ): SignalAlert | null {
    if (Math.abs(value - mean) > 3 * sigma) {
      return {
        type: "nelson_rule",
        severity: "critical",
        message: `Nelson Rule 1: value ${value.toFixed(4)} is beyond 3σ from mean ${mean.toFixed(4)}`,
        ruleId: "nelson_1",
      };
    }
    return null;
  }

  /**
   * Rule 2: Nine consecutive same-side points — sustained shift detection
   */
  private checkRule2(
    key: string,
    _value: number,
    mean: number,
  ): SignalAlert | null {
    const buf = this.buffer.get(key);
    if (!buf || buf.length < RULE_2_CONSECUTIVE) return null;

    const recent = buf.slice(-RULE_2_CONSECUTIVE);
    const allAbove = recent.every((v) => v > mean);
    const allBelow = recent.every((v) => v < mean);

    if (allAbove || allBelow) {
      const side = allAbove ? "above" : "below";
      return {
        type: "nelson_rule",
        severity: "warning",
        message: `Nelson Rule 2: ${RULE_2_CONSECUTIVE} consecutive points ${side} mean (${mean.toFixed(4)})`,
        ruleId: "nelson_2",
      };
    }
    return null;
  }

  /**
   * Rule 7: Fifteen points within 1σ — zombie/stale agent detection
   */
  private checkRule7(
    key: string,
    _value: number,
    mean: number,
    sigma: number,
  ): SignalAlert | null {
    const buf = this.buffer.get(key);
    if (!buf || buf.length < RULE_7_CONSECUTIVE) return null;

    const recent = buf.slice(-RULE_7_CONSECUTIVE);
    const allWithin1Sigma = recent.every(
      (v) => Math.abs(v - mean) < sigma,
    );

    if (allWithin1Sigma) {
      return {
        type: "nelson_rule",
        severity: "info",
        message: `Nelson Rule 7: ${RULE_7_CONSECUTIVE} consecutive points within 1σ — possible stale/zombie agent`,
        ruleId: "nelson_7",
      };
    }
    return null;
  }

  private appendToBuffer(key: string, value: number): void {
    let buf = this.buffer.get(key);
    if (!buf) {
      buf = [];
      this.buffer.set(key, buf);
    }
    buf.push(value);
    // Keep buffer bounded
    if (buf.length > 100) {
      buf.splice(0, buf.length - 100);
    }
  }
}
