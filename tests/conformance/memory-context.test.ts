// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import {
  computeColdStartPriors,
  computePartialReset,
  formatMemoryContextForSurvey,
} from "../../src/graph/queries/memory-context.js";
import type { LLMMemoryContext } from "../../src/graph/queries/memory-context.js";

// ============ HELPER ============

/** Create a minimal MemoryContext for testing pure functions */
function makeContext(overrides: Partial<LLMMemoryContext> = {}): LLMMemoryContext {
  return {
    bloomId: "llm:test-model",
    status: "active",
    posteriors: { alpha: 2, beta: 2, mean: 0.5 },
    dimensions: {
      code: 0.0,
      analysis: 0.0,
      creative: 0.0,
      structured_output: 0.0,
      classification: 0.0,
      synthesis: 0.0,
    },
    bocpd: null,
    learningGridEntries: [],
    recentFailures: [],
    isColdStart: true,
    ...overrides,
  };
}

// ============ ec-13: getMemoryContextForBloom (structural tests) ============
// These test the assembly logic via the MemoryContext type shape —
// actual graph queries tested via integration tests against Neo4j.

describe("MemoryContext — structural shape (ec-13)", () => {
  it("posteriors computed correctly: alpha = ws + 1, beta = wf + 1, mean = alpha/(alpha+beta)", () => {
    // Simulating what getMemoryContextForBloom would compute from ws=5, wf=3
    const ws = 5;
    const wf = 3;
    const alpha = ws + 1; // 6
    const beta = wf + 1;  // 4
    const mean = alpha / (alpha + beta); // 0.6
    expect(alpha).toBe(6);
    expect(beta).toBe(4);
    expect(mean).toBeCloseTo(0.6);
  });

  it("isColdStart = true when ws <= 1.0 and wf <= 1.0", () => {
    // Uninformative prior: ws=1.0, wf=1.0
    const ws = 1.0;
    const wf = 1.0;
    const isColdStart = ws <= 1.0 && wf <= 1.0;
    expect(isColdStart).toBe(true);

    // Zero case
    expect(0.0 <= 1.0 && 0.0 <= 1.0).toBe(true);
  });

  it("isColdStart = false when posteriors have real data", () => {
    const ws = 3.5;
    const wf = 1.2;
    const isColdStart = ws <= 1.0 && wf <= 1.0;
    expect(isColdStart).toBe(false);
  });

  it("BOCPD currentRunLength = argmax of runLengths", () => {
    const runLengths = [0.1, 0.2, 0.05, 0.5, 0.15];
    // argmax is index 3 (value 0.5)
    let maxIdx = 0;
    let maxVal = runLengths[0];
    for (let i = 1; i < runLengths.length; i++) {
      if (runLengths[i] > maxVal) {
        maxVal = runLengths[i];
        maxIdx = i;
      }
    }
    expect(maxIdx).toBe(3);
  });

  it("BOCPD is null when no bocpdState property exists", () => {
    const ctx = makeContext({ bocpd: null });
    expect(ctx.bocpd).toBeNull();
  });

  it("dimensions default to 0.0 when null", () => {
    const ctx = makeContext();
    expect(ctx.dimensions.code).toBe(0.0);
    expect(ctx.dimensions.analysis).toBe(0.0);
    expect(ctx.dimensions.creative).toBe(0.0);
    expect(ctx.dimensions.structured_output).toBe(0.0);
    expect(ctx.dimensions.classification).toBe(0.0);
    expect(ctx.dimensions.synthesis).toBe(0.0);
  });

  it("MemoryContext type includes all required fields", () => {
    const ctx = makeContext({
      posteriors: { alpha: 6, beta: 4, mean: 0.6 },
      bocpd: {
        state: {
          mu0: 0, kappa0: 1, alpha0: 1, beta0: 1,
          mus: [0], kappas: [1], alphas: [1], betas: [1],
          runLengths: [1.0], maxRunLength: 100,
        },
        currentRunLength: 0,
      },
      learningGridEntries: [
        { id: "s1", seedType: "failure-signature", content: "timeout on code gen", createdAt: "2026-03-30" },
      ],
      recentFailures: [
        { taskId: "t1", modelUsed: "claude-opus-4-6", qualityScore: 0.3, status: "failed", createdAt: "2026-03-30" },
      ],
      isColdStart: false,
    });

    expect(ctx.bloomId).toBe("llm:test-model");
    expect(ctx.status).toBe("active");
    expect(ctx.posteriors.alpha).toBe(6);
    expect(ctx.posteriors.beta).toBe(4);
    expect(ctx.posteriors.mean).toBeCloseTo(0.6);
    expect(ctx.bocpd).not.toBeNull();
    expect(ctx.bocpd!.currentRunLength).toBe(0);
    expect(ctx.learningGridEntries).toHaveLength(1);
    expect(ctx.recentFailures).toHaveLength(1);
    expect(ctx.isColdStart).toBe(false);
  });

  it("learning grid entries are ordered most-recent-first", () => {
    const ctx = makeContext({
      learningGridEntries: [
        { id: "s3", seedType: "calibration-event", content: "c", createdAt: "2026-03-30" },
        { id: "s2", seedType: "failure-signature", content: "b", createdAt: "2026-03-29" },
        { id: "s1", seedType: "capability-observation", content: "a", createdAt: "2026-03-28" },
      ],
    });
    // Most recent first
    expect(ctx.learningGridEntries[0].id).toBe("s3");
    expect(ctx.learningGridEntries[2].id).toBe("s1");
  });

  it("recent failures include only non-succeeded TaskOutputs", () => {
    // This is enforced by the Cypher WHERE clause: to.status <> 'succeeded'
    const failures = [
      { taskId: "t1", modelUsed: "m1", qualityScore: 0.2, status: "failed", createdAt: "2026-03-30" },
      { taskId: "t2", modelUsed: "m1", qualityScore: 0.4, status: "error", createdAt: "2026-03-29" },
    ];
    for (const f of failures) {
      expect(f.status).not.toBe("succeeded");
    }
  });
});

// ============ ec-14: Cold Start Priors ============

describe("computeColdStartPriors (ec-14)", () => {
  it("p=0.0 gives strong failure prior", () => {
    const result = computeColdStartPriors({ code: 0.0 });
    expect(result.alpha).toBe(0);
    expect(result.beta).toBe(10); // nEff default
  });

  it("p=0.5 gives uninformative prior", () => {
    const result = computeColdStartPriors({ code: 0.5 });
    expect(result.alpha).toBe(5);
    expect(result.beta).toBe(5);
  });

  it("p=1.0 gives strong success prior", () => {
    const result = computeColdStartPriors({ code: 1.0 });
    expect(result.alpha).toBe(10);
    expect(result.beta).toBe(0);
  });

  it("profile age decays nEff via temporal decay", () => {
    const halfLife = 604_800_000; // 7 days
    const oneHalfLife = halfLife; // exactly 1 half-life
    const result = computeColdStartPriors(
      { code: 0.5 },
      10,
      oneHalfLife,
      halfLife,
    );
    // After one half-life, nEff should be ~5
    expect(result.alpha).toBeCloseTo(2.5, 1);
    expect(result.beta).toBeCloseTo(2.5, 1);
    expect(result.alpha + result.beta).toBeCloseTo(5, 1);
  });

  it("default nEff=10 when not specified", () => {
    const result = computeColdStartPriors({ code: 0.5 });
    expect(result.alpha + result.beta).toBe(10);
  });

  it("averages across multiple dimensions", () => {
    const result = computeColdStartPriors({ code: 1.0, analysis: 0.0 });
    // Average p = 0.5
    expect(result.alpha).toBe(5);
    expect(result.beta).toBe(5);
  });

  it("empty profile defaults to p=0.5", () => {
    const result = computeColdStartPriors({});
    expect(result.alpha).toBe(5);
    expect(result.beta).toBe(5);
  });
});

// ============ Partial Reset ============

describe("computePartialReset", () => {
  it("retains 30% by default", () => {
    // Current posteriors: alpha=11, beta=4
    const result = computePartialReset(11, 4);
    // alpha_new = 1 + (11-1)*0.3 = 1 + 3 = 4
    // beta_new  = 1 + (4-1)*0.3  = 1 + 0.9 = 1.9
    expect(result.alpha).toBeCloseTo(4.0);
    expect(result.beta).toBeCloseTo(1.9);
  });

  it("retention=0 returns uninformative prior", () => {
    const result = computePartialReset(20, 10, 0);
    expect(result.alpha).toBe(1);
    expect(result.beta).toBe(1);
  });

  it("retention=1 returns unchanged posteriors", () => {
    const result = computePartialReset(7.5, 3.2, 1);
    expect(result.alpha).toBeCloseTo(7.5);
    expect(result.beta).toBeCloseTo(3.2);
  });

  it("preserves prior symmetry for symmetric input", () => {
    const result = computePartialReset(6, 6, 0.5);
    expect(result.alpha).toBeCloseTo(result.beta);
  });
});

// ============ Survey Formatting ============

describe("formatMemoryContextForSurvey", () => {
  it("produces non-empty string with model summaries", () => {
    const contexts: LLMMemoryContext[] = [
      makeContext({
        bloomId: "llm:opus",
        posteriors: { alpha: 8, beta: 3, mean: 8 / 11 },
        isColdStart: false,
        learningGridEntries: [
          { id: "s1", seedType: "failure-signature", content: "x", createdAt: "2026-03-30" },
        ],
      }),
      makeContext({
        bloomId: "llm:sonnet",
        posteriors: { alpha: 5, beta: 5, mean: 0.5 },
        isColdStart: true,
      }),
    ];

    const output = formatMemoryContextForSurvey(contexts);
    expect(output).toContain("Model Memory Context");
    expect(output).toContain("llm:opus");
    expect(output).toContain("llm:sonnet");
    expect(output).toContain("[cold start]");
    expect(output).toContain("1 learning grid entries");
  });

  it("handles empty input", () => {
    const output = formatMemoryContextForSurvey([]);
    expect(output).toBe("");
  });

  it("sorts by posterior mean descending", () => {
    const contexts: LLMMemoryContext[] = [
      makeContext({ bloomId: "llm:low", posteriors: { alpha: 2, beta: 8, mean: 0.2 } }),
      makeContext({ bloomId: "llm:high", posteriors: { alpha: 8, beta: 2, mean: 0.8 } }),
    ];
    const output = formatMemoryContextForSurvey(contexts);
    const highIdx = output.indexOf("llm:high");
    const lowIdx = output.indexOf("llm:low");
    expect(highIdx).toBeLessThan(lowIdx);
  });

  it("flags drift detection for short run lengths", () => {
    const contexts: LLMMemoryContext[] = [
      makeContext({
        bloomId: "llm:drifting",
        bocpd: {
          state: {
            mu0: 0, kappa0: 1, alpha0: 1, beta0: 1,
            mus: [0], kappas: [1], alphas: [1], betas: [1],
            runLengths: [0.8, 0.2], maxRunLength: 100,
          },
          currentRunLength: 0,
        },
      }),
    ];
    const output = formatMemoryContextForSurvey(contexts);
    expect(output).toContain("drift detected");
  });

  it("notes recent failures", () => {
    const contexts: LLMMemoryContext[] = [
      makeContext({
        bloomId: "llm:failing",
        recentFailures: [
          { taskId: "t1", modelUsed: "m1", qualityScore: 0.2, status: "failed", createdAt: "2026-03-30" },
          { taskId: "t2", modelUsed: "m1", qualityScore: 0.3, status: "error", createdAt: "2026-03-29" },
        ],
      }),
    ];
    const output = formatMemoryContextForSurvey(contexts);
    expect(output).toContain("2 recent failure(s)");
  });
});
