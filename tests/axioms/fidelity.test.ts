/**
 * A3. Fidelity — Same structural inputs → identical outputs.
 *
 * Tests determinism of all computation modules and absence of hidden randomness.
 * Level: L5 Invariant
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  computePhiL,
  computePsiH,
  computeDampening,
  computeGammaEffective,
  type PhiLFactors,
  type GraphEdge,
  type NodeHealth,
  SignalPipeline,
} from "../../src/index.js";

describe("A3 Fidelity: computePhiL determinism", () => {
  const factors: PhiLFactors = {
    axiomCompliance: 0.85,
    provenanceClarity: 0.7,
    usageSuccessRate: 0.9,
    temporalStability: 0.75,
  };

  it("100 consecutive calls with identical inputs produce identical results", () => {
    const results = Array.from({ length: 100 }, () =>
      computePhiL(factors, 20, 5, 0.6),
    );
    const first = results[0];
    for (let i = 1; i < results.length; i++) {
      expect(results[i].raw).toBe(first.raw);
      expect(results[i].maturityFactor).toBe(first.maturityFactor);
      expect(results[i].effective).toBe(first.effective);
      expect(results[i].factors).toEqual(first.factors);
    }
  });
});

describe("A3 Fidelity: computePsiH determinism", () => {
  const edges: GraphEdge[] = [
    { from: "a", to: "b", weight: 1 },
    { from: "b", to: "c", weight: 1 },
    { from: "a", to: "c", weight: 1 },
  ];
  const nodes: NodeHealth[] = [
    { id: "a", phiL: 0.8 },
    { id: "b", phiL: 0.6 },
    { id: "c", phiL: 0.9 },
  ];

  it("100 calls produce identical lambda2, friction, and combined", () => {
    const results = Array.from({ length: 100 }, () =>
      computePsiH(edges, nodes),
    );
    const first = results[0];
    for (let i = 1; i < results.length; i++) {
      expect(results[i].lambda2).toBe(first.lambda2);
      expect(results[i].friction).toBe(first.friction);
      expect(results[i].combined).toBe(first.combined);
    }
  });
});

describe("A3 Fidelity: computeDampening determinism", () => {
  it("same degree always produces same gamma", () => {
    for (const degree of [1, 2, 3, 5, 10, 20]) {
      const results = Array.from({ length: 50 }, () =>
        computeDampening(degree),
      );
      const first = results[0];
      for (const r of results) {
        expect(r).toBe(first);
      }
    }
  });
});

describe("A3 Fidelity: signal pipeline explicit state", () => {
  it("two independent pipelines with same inputs produce same conditioned output", () => {
    const pipeline1 = new SignalPipeline();
    const pipeline2 = new SignalPipeline();

    const inputs = [0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45];
    const results1: number[] = [];
    const results2: number[] = [];

    for (const v of inputs) {
      const r1 = pipeline1.process(v, "default");
      const r2 = pipeline2.process(v, "default");
      results1.push(r1.conditioned);
      results2.push(r2.conditioned);
    }

    expect(results1).toEqual(results2);
  });
});

describe("A3 Fidelity: no Math.random in computation modules", () => {
  it("src/computation/ contains no Math.random() calls", () => {
    const computationDir = path.resolve("src/computation");
    const files = getAllTsFiles(computationDir);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const hasMathRandom = content.includes("Math.random");
      if (hasMathRandom) {
        throw new Error(
          `Math.random found in computation module ${path.relative(".", file)}. ` +
          `Only Thompson sampling (src/patterns/thompson-router/) may use randomness.`,
        );
      }
    }
  });

  it("Thompson sampler in src/patterns/thompson-router/ IS the sole permitted randomness", () => {
    const samplerPath = path.resolve("src/patterns/thompson-router/sampler.ts");
    expect(fs.existsSync(samplerPath)).toBe(true);
    const content = fs.readFileSync(samplerPath, "utf-8");
    expect(content).toContain("Math.random");
  });
});

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}
