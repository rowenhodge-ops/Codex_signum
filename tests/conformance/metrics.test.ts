// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: OpEx Metrics (RTY + Feedback Effectiveness)
 *
 * Verifies: RTY = product of per-stage yields, %C&A computation.
 *
 * @see engineering-bridge-v2.0.md §Part 10 "RTY, error classification"
 */
import { describe, expect, it } from "vitest";
import {
  computeRTY,
  computePercentCA,
  stageResultsToAttempts,
} from "../../src/metrics/rty.js";
import type { StageAttempt } from "../../src/metrics/rty.js";
import type { StageResult } from "../../src/patterns/dev-agent/types.js";

// ── computeRTY ────────────────────────────────────────────────────────────

describe("computeRTY — Rolled Throughput Yield", () => {
  it("empty stages → RTY = 1 (vacuous)", () => {
    const result = computeRTY([]);
    expect(result.rty).toBeCloseTo(1, 6);
  });

  it("single stage, quality 1.0, no refinement → RTY = 1.0", () => {
    const attempts: StageAttempt[] = [
      { stage: "SCOPE", modelId: "m1", qualityScore: 1, refinementIteration: 0 },
    ];
    const result = computeRTY(attempts);
    expect(result.rty).toBeCloseTo(1, 6);
  });

  it("single stage, quality 0.8, no refinement → RTY = 0.8", () => {
    const attempts: StageAttempt[] = [
      { stage: "SCOPE", modelId: "m1", qualityScore: 0.8, refinementIteration: 0 },
    ];
    const result = computeRTY(attempts);
    expect(result.rty).toBeCloseTo(0.8, 6);
  });

  it("two stages, 0.8 and 0.9 → RTY = 0.72", () => {
    const attempts: StageAttempt[] = [
      { stage: "SCOPE", modelId: "m1", qualityScore: 0.8, refinementIteration: 0 },
      { stage: "EXECUTE", modelId: "m1", qualityScore: 0.9, refinementIteration: 0 },
    ];
    const result = computeRTY(attempts);
    expect(result.rty).toBeCloseTo(0.72, 4);
  });

  it("refinement needed → 30% penalty on quality score", () => {
    const firstPass: StageAttempt[] = [
      { stage: "S", modelId: "m1", qualityScore: 0.8, refinementIteration: 0 },
    ];
    const withRefinement: StageAttempt[] = [
      { stage: "S", modelId: "m1", qualityScore: 0.8, refinementIteration: 1 },
    ];
    expect(computeRTY(firstPass).rty).toBeGreaterThan(computeRTY(withRefinement).rty);
    // With refinement: 0.8 × 0.7 = 0.56
    expect(computeRTY(withRefinement).rty).toBeCloseTo(0.56, 4);
  });

  it("RTY in [0, 1]", () => {
    const attempts: StageAttempt[] = [
      { stage: "A", modelId: "m", qualityScore: 0.5, refinementIteration: 0 },
      { stage: "B", modelId: "m", qualityScore: 0.6, refinementIteration: 0 },
      { stage: "C", modelId: "m", qualityScore: 0.7, refinementIteration: 0 },
    ];
    const { rty } = computeRTY(attempts);
    expect(rty).toBeGreaterThanOrEqual(0);
    expect(rty).toBeLessThanOrEqual(1);
  });

  it("per-stage yields are returned", () => {
    const attempts: StageAttempt[] = [
      { stage: "SCOPE", modelId: "m1", qualityScore: 0.9, refinementIteration: 0 },
      { stage: "EXECUTE", modelId: "m1", qualityScore: 0.85, refinementIteration: 0 },
    ];
    const result = computeRTY(attempts);
    expect(result.stageYields["SCOPE"]).toBeCloseTo(0.9, 4);
    expect(result.stageYields["EXECUTE"]).toBeCloseTo(0.85, 4);
  });
});

// ── computePercentCA ──────────────────────────────────────────────────────

describe("computePercentCA — Percent Correct & Accurate", () => {
  it("all first-pass → overall = 100 (percent)", () => {
    const attempts: StageAttempt[] = [
      { stage: "A", modelId: "m", qualityScore: 0.9, refinementIteration: 0 },
      { stage: "B", modelId: "m", qualityScore: 0.85, refinementIteration: 0 },
    ];
    const result = computePercentCA(attempts);
    expect(result.overall).toBeCloseTo(100, 4);
  });

  it("half with refinements → overall = 50 (percent)", () => {
    const attempts: StageAttempt[] = [
      { stage: "A", modelId: "m", qualityScore: 0.9, refinementIteration: 0 },
      { stage: "B", modelId: "m", qualityScore: 0.8, refinementIteration: 1 },
    ];
    const result = computePercentCA(attempts);
    expect(result.overall).toBeCloseTo(50, 4);
  });

  it("empty → returns defined result", () => {
    const result = computePercentCA([]);
    expect(result).toBeDefined();
  });
});

// ── stageResultsToAttempts ────────────────────────────────────────────────

describe("stageResultsToAttempts", () => {
  it("quality >= 0.5 → refinementIteration = 0", () => {
    const stages: StageResult[] = [
      { stage: "scope", modelId: "m", output: "ok", qualityScore: 0.8,
        durationMs: 100, wasExploratory: false, refinementIteration: 0 },
    ];
    const result = stageResultsToAttempts(stages);
    expect(result[0].refinementIteration).toBe(0);
  });

  it("quality < 0.5 → refinementIteration = 1", () => {
    const stages: StageResult[] = [
      { stage: "scope", modelId: "m", output: "bad", qualityScore: 0.3,
        durationMs: 100, wasExploratory: false, refinementIteration: 1 },
    ];
    const result = stageResultsToAttempts(stages);
    expect(result[0].refinementIteration).toBe(1);
  });
});
