/**
 * Codex Signum — Conformance Tests: Stratum 2 Compaction
 *
 * Verifies continuous exponential decay: weight = e^(-λ × age)
 * NOT fixed retention window. Key anti-pattern to prevent.
 *
 * @see engineering-bridge-v2.0.md §Part 7 "Memory sizing"
 */
import { describe, expect, it } from "vitest";
import {
  computeObservationWeight,
  computePracticalWindow,
  identifyCompactable,
  DEFAULT_COMPACTION_CONFIG,
} from "../../src/memory/compaction.js";
import type { CompactionConfig, CompactableObservation } from "../../src/memory/compaction.js";

// ── Exponential decay formula ─────────────────────────────────────────────

describe("computeObservationWeight — weight = e^(-λ × age)", () => {
  it("age = 0 → weight = 1.0 (fresh observation)", () => {
    expect(computeObservationWeight(0, 1e-9)).toBeCloseTo(1.0, 6);
  });

  it("weight strictly decreases with age", () => {
    const lambda = DEFAULT_COMPACTION_CONFIG.decayConstant;
    const w1 = computeObservationWeight(1000, lambda);
    const w2 = computeObservationWeight(100000, lambda);
    const w3 = computeObservationWeight(10000000, lambda);
    expect(w2).toBeLessThan(w1);
    expect(w3).toBeLessThan(w2);
  });

  it("weight in (0, 1] for positive age", () => {
    const w = computeObservationWeight(86400000, DEFAULT_COMPACTION_CONFIG.decayConstant);
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThanOrEqual(1);
  });

  it("14-day half-life: weight at 14 days ≈ 0.5", () => {
    // λ = ln(2) / (14 × 24 × 60 × 60 × 1000)
    const lambda = Math.LN2 / (14 * 24 * 60 * 60 * 1000);
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    expect(computeObservationWeight(fourteenDaysMs, lambda)).toBeCloseTo(0.5, 4);
  });

  it("negative age → treated as 0 (returns 1.0)", () => {
    expect(computeObservationWeight(-1000, 1e-9)).toBeCloseTo(1.0, 6);
  });
});

// ── Default config ────────────────────────────────────────────────────────

describe("DEFAULT_COMPACTION_CONFIG", () => {
  it("compactionThreshold = 0.01 (spec recommendation)", () => {
    expect(DEFAULT_COMPACTION_CONFIG.compactionThreshold).toBeCloseTo(0.01, 6);
  });

  it("uses 14-day half-life by default", () => {
    const expectedLambda = Math.LN2 / (14 * 24 * 60 * 60 * 1000);
    expect(DEFAULT_COMPACTION_CONFIG.decayConstant).toBeCloseTo(expectedLambda, 20);
  });

  it("batchSize = 500", () => {
    expect(DEFAULT_COMPACTION_CONFIG.batchSize).toBe(500);
  });
});

// ── computePracticalWindow ────────────────────────────────────────────────

describe("computePracticalWindow", () => {
  it("returns finite positive value", () => {
    const window = computePracticalWindow(DEFAULT_COMPACTION_CONFIG);
    expect(window).toBeGreaterThan(0);
    expect(isFinite(window)).toBe(true);
  });

  it("window > 14 days (at 14-day half-life, threshold 0.01)", () => {
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const window = computePracticalWindow(DEFAULT_COMPACTION_CONFIG);
    expect(window).toBeGreaterThan(fourteenDaysMs);
  });

  it("weight at practical window edge ≈ compactionThreshold", () => {
    const window = computePracticalWindow(DEFAULT_COMPACTION_CONFIG);
    const weightAtWindow = computeObservationWeight(
      window,
      DEFAULT_COMPACTION_CONFIG.decayConstant,
    );
    expect(weightAtWindow).toBeCloseTo(DEFAULT_COMPACTION_CONFIG.compactionThreshold, 4);
  });
});

// ── identifyCompactable ───────────────────────────────────────────────────

describe("identifyCompactable — safety conditions", () => {
  const now = new Date();
  const veryOldDate = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000); // 200 days ago

  const oldObs: CompactableObservation = {
    id: "obs-1",
    timestamp: veryOldDate,
    signalProcessed: true,
    includedInDistillationIds: ["dist-1"],
  };

  it("old processed observation → compactable", () => {
    const result = identifyCompactable([oldObs], new Set<string>(), now);
    expect(result).toContain("obs-1");
  });

  it("fresh observation → NOT compactable (weight above threshold)", () => {
    const freshObs: CompactableObservation = {
      id: "obs-fresh",
      timestamp: now,
      signalProcessed: true,
      includedInDistillationIds: ["dist-1"],
    };
    const result = identifyCompactable([freshObs], new Set<string>(), now);
    expect(result).not.toContain("obs-fresh");
  });

  it("unprocessed signal → NOT compactable (even if old)", () => {
    const unprocessed: CompactableObservation = {
      id: "obs-unproc",
      timestamp: veryOldDate,
      signalProcessed: false,
      includedInDistillationIds: ["dist-1"],
    };
    const result = identifyCompactable([unprocessed], new Set<string>(), now);
    expect(result).not.toContain("obs-unproc");
  });

  it("no distillation → NOT compactable (even if old and processed)", () => {
    const noDistill: CompactableObservation = {
      id: "obs-nodist",
      timestamp: veryOldDate,
      signalProcessed: true,
      includedInDistillationIds: [],
    };
    const result = identifyCompactable([noDistill], new Set<string>(), now);
    expect(result).not.toContain("obs-nodist");
  });

  it("empty observations → empty result", () => {
    const result = identifyCompactable([], new Set<string>(), now);
    expect(result).toHaveLength(0);
  });
});
