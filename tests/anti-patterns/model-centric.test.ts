/**
 * Anti-Pattern: Model-Centric Thinking — the system must not hardcode model assumptions.
 *
 * Tests verify that:
 * - Dampening is NEVER a fixed constant (always computed from topology)
 * - Circuit breaker uses exponential backoff + jitter (not fixed cooldown)
 * - Hysteresis ratio is 2.5× (not 1.5×)
 * - Health is NEVER a bare number (always composite ΦL)
 * - Compaction uses exponential decay (not fixed window)
 * Level: L5 Invariant
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import {
  computeGammaEffective,
  CASCADE_LIMIT,
  HYSTERESIS_RATIO,
} from "../../src/computation/dampening.js";

describe("Model-Centric: dampening is NEVER a fixed constant", () => {
  it("computeGammaEffective varies with degree", () => {
    const gamma1 = computeGammaEffective(1);
    const gamma2 = computeGammaEffective(2);
    const gamma5 = computeGammaEffective(5);
    const gamma10 = computeGammaEffective(10);

    // Must differ for different degrees
    expect(gamma1).not.toBe(gamma2);
    expect(gamma2).not.toBe(gamma5);
    expect(gamma5).not.toBe(gamma10);

    // Higher degree → lower gamma (more dampening)
    expect(gamma1).toBeGreaterThan(gamma2);
    expect(gamma2).toBeGreaterThan(gamma5);
  });

  it("gamma is always ≤ 0.7 (subcriticality budget)", () => {
    for (let k = 1; k <= 100; k++) {
      const gamma = computeGammaEffective(k);
      expect(gamma).toBeLessThanOrEqual(0.7);
    }
  });

  it("no hardcoded γ=0.7 assignment in dampening source", () => {
    const content = fs.readFileSync("src/computation/dampening.ts", "utf-8");
    // Should not have `gamma = 0.7` or `γ = 0.7` as a fixed assignment
    // The SAFETY_BUDGET = 0.8 and cap are fine — we're checking for fixed gamma
    expect(content).not.toMatch(/gamma\s*=\s*0\.7\s*[;,]/);
  });
});

describe("Model-Centric: circuit breaker uses exponential backoff + jitter", () => {
  const cbContent = fs.readFileSync("src/resilience/circuit-breaker.ts", "utf-8");

  it("circuit breaker computes cooldown with exponential factor", () => {
    // Must contain exponential backoff pattern (** or Math.pow or base * factor^count)
    expect(cbContent).toMatch(/1\.5\s*\*\*|Math\.pow.*1\.5|tripCount/);
  });

  it("circuit breaker uses random jitter (not fixed cooldown)", () => {
    expect(cbContent).toContain("Math.random");
  });

  it("circuit breaker has half-open probe mechanism", () => {
    // Must reference half-open state or probes
    expect(cbContent).toMatch(/half.?open|halfOpen|probe/i);
  });

  it("no fixed cooldown constant used directly", () => {
    // Should not have a simple `cooldown = 5000` or similar fixed pattern
    // The base cooldown exists but must be multiplied by exponential factor
    expect(cbContent).not.toMatch(/cooldown\s*=\s*\d{4,}\s*;/);
  });
});

describe("Model-Centric: hysteresis ratio is 2.5×", () => {
  it("HYSTERESIS_RATIO exported constant equals 2.5", () => {
    expect(HYSTERESIS_RATIO).toBe(2.5);
  });

  it("hysteresis ratio is not 1.5 anywhere in dampening source", () => {
    const content = fs.readFileSync("src/computation/dampening.ts", "utf-8");
    // Must not contain HYSTERESIS_RATIO = 1.5
    expect(content).not.toMatch(/HYSTERESIS_RATIO\s*=\s*1\.5/);
  });
});

describe("Model-Centric: CASCADE_LIMIT is 2", () => {
  it("CASCADE_LIMIT exported constant equals 2", () => {
    expect(CASCADE_LIMIT).toBe(2);
  });

  it("cascade limit is never > 2 in source", () => {
    const content = fs.readFileSync("src/computation/dampening.ts", "utf-8");
    const limitMatch = content.match(/CASCADE_LIMIT\s*=\s*(\d+)/);
    expect(limitMatch).not.toBeNull();
    expect(Number.parseInt(limitMatch![1], 10)).toBe(2);
  });
});

describe("Model-Centric: health is NEVER a bare number", () => {
  it("computePhiL returns an object with required composite fields", () => {
    const content = fs.readFileSync("src/computation/phi-l.ts", "utf-8");
    // Return type must include structured fields (camelCase per TypeScript convention)
    expect(content).toContain("factors");
    expect(content).toContain("weights");
    expect(content).toContain("effective");
    expect(content).toContain("maturityFactor");
  });

  it("PhiL type is not just 'number'", () => {
    const types = fs.readFileSync("src/types/state-dimensions.ts", "utf-8");
    // PhiL must be an interface/type with fields, not a type alias to number
    expect(types).not.toMatch(/type\s+PhiL\s*=\s*number/);
    expect(types).toMatch(/(?:interface|type)\s+PhiL\s*(?:=\s*\{|\{)/);
  });
});

describe("Model-Centric: compaction uses exponential decay (not fixed window)", () => {
  const compactionContent = fs.readFileSync("src/memory/compaction.ts", "utf-8");

  it("compaction uses exponential decay formula", () => {
    // Must contain e^(-λ × age) or Math.exp(-lambda * age) pattern
    expect(compactionContent).toMatch(/Math\.exp|exponential|decay/i);
  });

  it("compaction does NOT use fixed retention window", () => {
    // Should not have a simple `if (age > WINDOW_SIZE) delete` pattern
    expect(compactionContent).not.toMatch(
      /retentionWindow|RETENTION_WINDOW|fixedWindow|FIXED_WINDOW/,
    );
  });
});
