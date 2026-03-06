// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import type { ArmStats } from "../../src/graph/queries.js";
import {
  freshArmStats,
  updateArmStats,
} from "../../src/patterns/thompson-router/arm-stats.js";

describe("updateArmStats — Beta posterior update", () => {
  it("increments alpha on success outcome", () => {
    const before: ArmStats = {
      seedId: "test-agent",
      alpha: 6,
      beta: 3,
      totalTrials: 7,
      avgQuality: 0.8,
      avgLatencyMs: 100,
      avgCost: 0.05,
      totalCost: 0.35,
    };
    const after = updateArmStats(before, {
      success: true,
      durationMs: 90,
    });
    expect(after.alpha).toBe(7);
    expect(after.beta).toBe(3);
    expect(after.totalTrials).toBe(8);
  });

  it("increments beta on failure outcome", () => {
    const before: ArmStats = {
      seedId: "test-agent",
      alpha: 6,
      beta: 3,
      totalTrials: 7,
      avgQuality: 0.8,
      avgLatencyMs: 100,
      avgCost: 0.05,
      totalCost: 0.35,
    };
    const after = updateArmStats(before, {
      success: false,
      durationMs: 5000,
    });
    expect(after.alpha).toBe(6);
    expect(after.beta).toBe(4);
    expect(after.totalTrials).toBe(8);
  });

  it("preserves seedId through update", () => {
    const before = freshArmStats("my-agent-id");
    const after = updateArmStats(before, {
      success: true,
      durationMs: 100,
    });
    expect(after.seedId).toBe("my-agent-id");
  });

  it("maintains alpha + beta - 2 = totalTrials invariant", () => {
    let stats = freshArmStats("invariant-test");
    // Fresh: alpha=1, beta=1, totalTrials=0 → 1+1-2=0 ✓
    expect(stats.alpha + stats.beta - 2).toBe(stats.totalTrials);

    // 3 successes, 2 failures
    for (const success of [true, true, false, true, false]) {
      stats = updateArmStats(stats, { success, durationMs: 100 });
      expect(stats.alpha + stats.beta - 2).toBe(stats.totalTrials);
    }
    expect(stats.alpha).toBe(4); // 3 successes + 1 prior
    expect(stats.beta).toBe(3); // 2 failures + 1 prior
    expect(stats.totalTrials).toBe(5);
  });
});

describe("updateArmStats — EWMA smoothing", () => {
  it("EWMA updates avgLatencyMs (λ=0.1)", () => {
    const before: ArmStats = {
      seedId: "test",
      alpha: 11,
      beta: 2,
      totalTrials: 11,
      avgQuality: 0.8,
      avgLatencyMs: 100,
      avgCost: 0.05,
      totalCost: 0.55,
    };
    const after = updateArmStats(
      before,
      { success: true, durationMs: 200 },
      0.1,
    );
    // EWMA: 0.1 * 200 + 0.9 * 100 = 110
    expect(after.avgLatencyMs).toBeCloseTo(110);
  });

  it("EWMA updates avgQuality when qualityScore provided", () => {
    const before: ArmStats = {
      seedId: "test",
      alpha: 11,
      beta: 2,
      totalTrials: 11,
      avgQuality: 0.8,
      avgLatencyMs: 100,
      avgCost: 0.05,
      totalCost: 0.55,
    };
    const after = updateArmStats(
      before,
      { success: true, durationMs: 100, qualityScore: 0.6 },
      0.1,
    );
    // EWMA: 0.1 * 0.6 + 0.9 * 0.8 = 0.78
    expect(after.avgQuality).toBeCloseTo(0.78);
  });

  it("preserves avgQuality when qualityScore not provided", () => {
    const before: ArmStats = {
      seedId: "test",
      alpha: 11,
      beta: 2,
      totalTrials: 11,
      avgQuality: 0.8,
      avgLatencyMs: 100,
      avgCost: 0.05,
      totalCost: 0.55,
    };
    const after = updateArmStats(before, { success: true, durationMs: 100 });
    expect(after.avgQuality).toBe(0.8);
  });

  it("EWMA updates avgCost when cost provided", () => {
    const before: ArmStats = {
      seedId: "test",
      alpha: 11,
      beta: 2,
      totalTrials: 11,
      avgQuality: 0.8,
      avgLatencyMs: 100,
      avgCost: 0.05,
      totalCost: 0.55,
    };
    const after = updateArmStats(
      before,
      { success: true, durationMs: 100, cost: 0.10 },
      0.1,
    );
    // EWMA: 0.1 * 0.10 + 0.9 * 0.05 = 0.055
    expect(after.avgCost).toBeCloseTo(0.055);
    expect(after.totalCost).toBeCloseTo(0.65);
  });

  it("uses raw value (not EWMA) for first observation", () => {
    const before = freshArmStats("first-obs");
    const after = updateArmStats(
      before,
      { success: true, durationMs: 250, qualityScore: 0.9, cost: 0.03 },
      0.1,
    );
    // First observation should use raw value, not EWMA
    expect(after.avgLatencyMs).toBe(250);
    expect(after.avgQuality).toBe(0.9);
    expect(after.avgCost).toBe(0.03);
  });
});

describe("freshArmStats", () => {
  it("creates uniform Beta(1,1) prior", () => {
    const stats = freshArmStats("new-agent");
    expect(stats.seedId).toBe("new-agent");
    expect(stats.alpha).toBe(1);
    expect(stats.beta).toBe(1);
    expect(stats.totalTrials).toBe(0);
    expect(stats.avgQuality).toBe(0);
    expect(stats.avgLatencyMs).toBe(0);
    expect(stats.avgCost).toBe(0);
    expect(stats.totalCost).toBe(0);
  });
});

describe("OutcomeRecord — infrastructure flag", () => {
  it("infrastructure field is optional and defaults to undefined", () => {
    const before = freshArmStats("infra-test");
    const outcome = { success: false, durationMs: 0, errorType: "api_error" };
    // Should not have infrastructure field by default
    expect(outcome).not.toHaveProperty("infrastructure");
    // updateArmStats still works (alpha/beta update happens)
    const after = updateArmStats(before, outcome);
    expect(after.beta).toBe(2); // failure increments beta
  });

  it("infrastructure: true is accepted on OutcomeRecord", () => {
    const outcome = {
      success: false,
      durationMs: 0,
      errorType: "api_error",
      infrastructure: true,
      notes: "HTTP 404 model not found",
    };
    // The flag exists on the record
    expect(outcome.infrastructure).toBe(true);
    // updateArmStats is a pure function — it always updates alpha/beta.
    // Infrastructure filtering happens at the graph query layer
    // (getArmStatsForCluster excludes infrastructure decisions).
    const before = freshArmStats("infra-test");
    const after = updateArmStats(before, outcome);
    expect(after.beta).toBe(2); // Pure function still increments
  });

  it("infrastructure: false is accepted on OutcomeRecord", () => {
    const outcome = {
      success: false,
      durationMs: 100,
      errorType: "api_error",
      infrastructure: false,
      notes: "HTTP 400 invalid parameter",
    };
    expect(outcome.infrastructure).toBe(false);
  });
});
