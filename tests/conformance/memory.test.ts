// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Memory Compaction, Distillation, Flow
 *
 * Tests for G-7 memory lifecycle operations:
 * - Compaction (continuous exponential decay)
 * - Enhanced distillation (performance profiles, routing hints, threshold calibration)
 * - Memory flow coordinator (upward compression + downward enrichment)
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMPACTION_CONFIG,
  computeCompactionStats,
  computeObservationWeight,
  computePracticalWindow,
  identifyCompactable,
} from "../../src/memory/compaction.js";
import type {
  CompactableObservation,
  CompactionConfig,
} from "../../src/memory/compaction.js";
import {
  distillPerformanceProfile,
  distillRoutingHints,
  distillThresholdCalibration,
} from "../../src/memory/distillation.js";
import { computeDownwardFlow, computeUpwardFlow } from "../../src/memory/flow.js";
import type { PerformanceProfile, RoutingHints } from "../../src/memory/distillation.js";

// ============ HELPERS ============

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number, fromDate?: Date): Date {
  const base = fromDate ?? new Date();
  return new Date(base.getTime() - days * DAY_MS);
}

function makeObservation(
  id: string,
  daysOld: number,
  opts: {
    signalProcessed?: boolean;
    distillationIds?: string[];
    now?: Date;
  } = {},
): CompactableObservation {
  const now = opts.now ?? new Date();
  return {
    id,
    timestamp: daysAgo(daysOld, now),
    signalProcessed: opts.signalProcessed ?? true,
    includedInDistillationIds: opts.distillationIds ?? ["dist-1"],
  };
}

// ============ COMPACTION: EXPONENTIAL DECAY ============

describe("computeObservationWeight", () => {
  it("returns 1.0 at age 0", () => {
    expect(computeObservationWeight(0, DEFAULT_COMPACTION_CONFIG.decayConstant)).toBe(
      1.0,
    );
  });

  it("returns 0.5 at age = half-life", () => {
    const halfLifeMs = Math.LN2 / DEFAULT_COMPACTION_CONFIG.decayConstant;
    const weight = computeObservationWeight(
      halfLifeMs,
      DEFAULT_COMPACTION_CONFIG.decayConstant,
    );
    expect(weight).toBeCloseTo(0.5, 6);
  });

  it("returns ~ 0.01 at age = practical window (within floating point tolerance)", () => {
    const practicalWindow = computePracticalWindow(DEFAULT_COMPACTION_CONFIG);
    const weight = computeObservationWeight(
      practicalWindow,
      DEFAULT_COMPACTION_CONFIG.decayConstant,
    );
    // At the exact practical window, weight should be ≈ compactionThreshold
    // Allow floating point tolerance
    expect(weight).toBeCloseTo(DEFAULT_COMPACTION_CONFIG.compactionThreshold, 10);
  });

  it("returns < 0.01 at age > practical window", () => {
    const practicalWindow = computePracticalWindow(DEFAULT_COMPACTION_CONFIG);
    // Go 10% beyond the practical window to avoid floating point edge
    const weight = computeObservationWeight(
      practicalWindow * 1.1,
      DEFAULT_COMPACTION_CONFIG.decayConstant,
    );
    expect(weight).toBeLessThan(DEFAULT_COMPACTION_CONFIG.compactionThreshold);
  });

  it("is monotonically decreasing with age", () => {
    const lambda = DEFAULT_COMPACTION_CONFIG.decayConstant;
    let prevWeight = 1.0;
    for (let days = 1; days <= 100; days++) {
      const weight = computeObservationWeight(days * DAY_MS, lambda);
      expect(weight).toBeLessThan(prevWeight);
      prevWeight = weight;
    }
  });

  it("returns 1.0 for negative age", () => {
    expect(computeObservationWeight(-1000, DEFAULT_COMPACTION_CONFIG.decayConstant)).toBe(
      1.0,
    );
  });
});

describe("computePracticalWindow", () => {
  it("returns -ln(threshold) / λ", () => {
    const config = DEFAULT_COMPACTION_CONFIG;
    const expected = -Math.log(config.compactionThreshold) / config.decayConstant;
    expect(computePracticalWindow(config)).toBeCloseTo(expected, 0);
  });

  it("with default config → ~93 days (-ln(0.01) / λ with 14-day half-life)", () => {
    const windowMs = computePracticalWindow(DEFAULT_COMPACTION_CONFIG);
    const windowDays = windowMs / DAY_MS;
    // -ln(0.01) / (ln(2) / (14 days)) = ln(100) × 14/ln(2) ≈ 93.0 days
    expect(windowDays).toBeCloseTo(93.0, 0);
  });
});

describe("identifyCompactable", () => {
  const now = new Date("2026-02-25T00:00:00Z");

  it("compacts observations below weight threshold + signal processed + distilled", () => {
    const obs = [makeObservation("old-1", 100, { now })];
    const result = identifyCompactable(obs, new Set(), now);
    expect(result).toEqual(["old-1"]);
  });

  it("retains observations above weight threshold (still contributing)", () => {
    const obs = [makeObservation("recent-1", 1, { now })];
    const result = identifyCompactable(obs, new Set(), now);
    expect(result).toEqual([]);
  });

  it("retains observations with unprocessed signals regardless of weight", () => {
    const obs = [makeObservation("old-unprocessed", 100, { signalProcessed: false, now })];
    const result = identifyCompactable(obs, new Set(), now);
    expect(result).toEqual([]);
  });

  it("retains observations never included in any distillation regardless of weight", () => {
    const obs = [makeObservation("old-undistilled", 100, { distillationIds: [], now })];
    const result = identifyCompactable(obs, new Set(), now);
    expect(result).toEqual([]);
  });

  it("with preserveActiveDistillationSources: true → active sources retained", () => {
    const obs = [
      makeObservation("old-active", 100, { distillationIds: ["active-dist"], now }),
    ];
    const result = identifyCompactable(obs, new Set(["active-dist"]), now, {
      preserveActiveDistillationSources: true,
    });
    expect(result).toEqual([]);
  });

  it("with preserveActiveDistillationSources: false → active sources compacted", () => {
    const obs = [
      makeObservation("old-active", 100, { distillationIds: ["active-dist"], now }),
    ];
    const result = identifyCompactable(obs, new Set(["active-dist"]), now, {
      preserveActiveDistillationSources: false,
    });
    expect(result).toEqual(["old-active"]);
  });

  it("different λ values produce different compaction sets (proves dynamism)", () => {
    // Observation at 20 days old
    const obs = [makeObservation("mid-age", 20, { now })];

    // Aggressive compaction (7-day half-life)
    const aggressiveλ = Math.LN2 / (7 * DAY_MS);
    const aggressive = identifyCompactable(obs, new Set(), now, {
      decayConstant: aggressiveλ,
    });

    // Conservative compaction (30-day half-life)
    const conservativeλ = Math.LN2 / (30 * DAY_MS);
    const conservative = identifyCompactable(obs, new Set(), now, {
      decayConstant: conservativeλ,
    });

    // With 7-day half-life, 20 days old → weight ≈ 0.14 — could be below/above threshold
    // With 30-day half-life, 20 days old → weight ≈ 0.63 — well above threshold
    expect(conservative).toEqual([]); // Still contributing, retained
    // Aggressive may or may not compact at 20 days; test that they differ
    // At 7-day half-life, practical window ≈ 46 days. 20 days → weight ≈ 0.14 > 0.01
    // Let's test at 50 days instead for clear difference
    const obs50 = [makeObservation("old-50", 50, { now })];
    const agg50 = identifyCompactable(obs50, new Set(), now, {
      decayConstant: aggressiveλ,
    });
    const con50 = identifyCompactable(obs50, new Set(), now, {
      decayConstant: conservativeλ,
    });
    // 7-day half-life at 50 days: weight ≈ 0.0073 < 0.01 → compactable
    expect(agg50).toEqual(["old-50"]);
    // 30-day half-life at 50 days: weight ≈ 0.31 > 0.01 → retained
    expect(con50).toEqual([]);
  });

  it("same observations, same config, different now → different compaction results", () => {
    const timestamp = new Date("2026-01-01T00:00:00Z");
    const obs: CompactableObservation[] = [
      {
        id: "obs-1",
        timestamp,
        signalProcessed: true,
        includedInDistillationIds: ["dist-1"],
      },
    ];

    // At 20 days after creation
    const now20 = new Date(timestamp.getTime() + 20 * DAY_MS);
    const result20 = identifyCompactable(obs, new Set(), now20);

    // At 200 days after creation
    const now200 = new Date(timestamp.getTime() + 200 * DAY_MS);
    const result200 = identifyCompactable(obs, new Set(), now200);

    expect(result20).toEqual([]); // Still contributing
    expect(result200).toEqual(["obs-1"]); // Decayed beyond threshold
  });

  it("respects batchSize limit", () => {
    const obs = Array.from({ length: 600 }, (_, i) =>
      makeObservation(`obs-${i}`, 100, { now }),
    );
    const result = identifyCompactable(obs, new Set(), now, { batchSize: 10 });
    expect(result.length).toBeLessThanOrEqual(10);
  });
});

describe("computeCompactionStats", () => {
  const now = new Date("2026-02-25T00:00:00Z");

  it("counts are accurate across all retained categories", () => {
    const obs: CompactableObservation[] = [
      makeObservation("recent", 1, { now }), // above threshold
      makeObservation("unprocessed", 100, { signalProcessed: false, now }), // unprocessed
      makeObservation("undistilled", 100, { distillationIds: [], now }), // never distilled
      makeObservation("active-src", 100, { distillationIds: ["active"], now }), // active source
      makeObservation("compactable", 100, { now }), // compactable
    ];

    const stats = computeCompactionStats(obs, new Set(["active"]), now, {
      preserveActiveDistillationSources: true,
    });

    expect(stats.evaluated).toBe(5);
    expect(stats.compactable).toBe(1);
    expect(stats.retained.aboveWeightThreshold).toBe(1);
    expect(stats.retained.unprocessedSignal).toBe(1);
    expect(stats.retained.neverDistilled).toBe(1);
    expect(stats.retained.activeDistillationSource).toBe(1);
  });

  it("diagnostics include correct practical window", () => {
    const obs = [makeObservation("obs-1", 10, { now })];
    const stats = computeCompactionStats(obs, new Set(), now);

    const expectedWindow = computePracticalWindow(DEFAULT_COMPACTION_CONFIG);
    expect(stats.diagnostics.practicalWindowMs).toBeCloseTo(expectedWindow, 0);
    expect(stats.diagnostics.practicalWindowDays).toBeCloseTo(
      expectedWindow / DAY_MS,
      1,
    );
  });

  it("diagnostics include weight distribution", () => {
    const obs = [
      makeObservation("recent", 1, { now }),
      makeObservation("old", 100, { now }),
    ];
    const stats = computeCompactionStats(obs, new Set(), now);

    expect(stats.diagnostics.weightDistribution.min).toBeLessThan(
      stats.diagnostics.weightDistribution.max,
    );
    expect(stats.diagnostics.weightDistribution.mean).toBeGreaterThan(0);
  });

  it("handles empty observation set", () => {
    const stats = computeCompactionStats([], new Set(), now);
    expect(stats.evaluated).toBe(0);
    expect(stats.compactable).toBe(0);
    expect(stats.diagnostics.weightDistribution.min).toBe(0);
    expect(stats.diagnostics.weightDistribution.max).toBe(0);
    expect(stats.diagnostics.weightDistribution.mean).toBe(0);
  });
});

// ============ ENHANCED DISTILLATION ============

describe("distillPerformanceProfile", () => {
  it("computes correct mean, trend, variance", () => {
    const observations = Array.from({ length: 20 }, (_, i) => ({
      timestamp: daysAgo(20 - i),
      phiL: 0.7 + i * 0.01, // Improving trend: 0.7 → 0.89
      success: true,
    }));

    const profile = distillPerformanceProfile("comp-1", observations);

    expect(profile.componentId).toBe("comp-1");
    expect(profile.meanPhiL).toBeCloseTo(0.795, 2);
    expect(profile.phiLTrend).toBe("improving");
    expect(profile.phiLVariance).toBeGreaterThan(0);
    expect(profile.successRate).toBe(1.0);
    expect(profile.observationCount).toBe(20);
  });

  it("extracts failure mode frequencies", () => {
    const observations = [
      { timestamp: daysAgo(10), phiL: 0.3, success: false, failureSignature: "timeout" },
      { timestamp: daysAgo(9), phiL: 0.3, success: false, failureSignature: "timeout" },
      { timestamp: daysAgo(8), phiL: 0.3, success: false, failureSignature: "oom" },
      { timestamp: daysAgo(7), phiL: 0.8, success: true },
      { timestamp: daysAgo(6), phiL: 0.8, success: true },
    ];

    const profile = distillPerformanceProfile("comp-2", observations);

    expect(profile.commonFailureModes.length).toBe(2);
    const timeoutMode = profile.commonFailureModes.find(
      (f) => f.signature === "timeout",
    );
    expect(timeoutMode).toBeDefined();
    expect(timeoutMode!.frequency).toBeGreaterThan(0);
    expect(profile.successRate).toBeCloseTo(0.4, 2);
  });

  it("returns sensible defaults for empty observation set", () => {
    const profile = distillPerformanceProfile("comp-empty", []);

    expect(profile.meanPhiL).toBe(0);
    expect(profile.phiLTrend).toBe("stable");
    expect(profile.phiLVariance).toBe(0);
    expect(profile.commonFailureModes).toEqual([]);
    expect(profile.successRate).toBe(0);
    expect(profile.observationCount).toBe(0);
  });

  it("detects declining trend", () => {
    const observations = Array.from({ length: 20 }, (_, i) => ({
      timestamp: daysAgo(20 - i),
      phiL: 0.9 - i * 0.02, // Declining: 0.9 → 0.52
      success: true,
    }));

    const profile = distillPerformanceProfile("comp-decline", observations);
    expect(profile.phiLTrend).toBe("declining");
  });

  it("detects stable trend", () => {
    const observations = Array.from({ length: 20 }, (_, i) => ({
      timestamp: daysAgo(20 - i),
      phiL: 0.75 + (Math.random() * 0.001 - 0.0005), // Essentially flat
      success: true,
    }));

    const profile = distillPerformanceProfile("comp-stable", observations);
    expect(profile.phiLTrend).toBe("stable");
  });
});

describe("distillRoutingHints", () => {
  it("identifies preferred and avoided models", () => {
    const observations = [
      // Model A: 8/10 success = 80% → preferred
      ...Array.from({ length: 8 }, () => ({
        modelId: "model-a",
        success: true,
        qualityScore: 0.9,
      })),
      ...Array.from({ length: 2 }, () => ({
        modelId: "model-a",
        success: false,
      })),
      // Model B: 2/10 success = 20% → avoid
      ...Array.from({ length: 2 }, () => ({
        modelId: "model-b",
        success: true,
        qualityScore: 0.5,
      })),
      ...Array.from({ length: 8 }, () => ({
        modelId: "model-b",
        success: false,
      })),
    ];

    const hints = distillRoutingHints("comp-1", observations);

    expect(hints.preferredModels.length).toBeGreaterThan(0);
    expect(hints.preferredModels[0].modelId).toBe("model-a");
    expect(hints.preferredModels[0].successRate).toBeCloseTo(0.8, 2);

    expect(hints.avoidModels.length).toBeGreaterThan(0);
    expect(hints.avoidModels[0].modelId).toBe("model-b");
    expect(hints.avoidModels[0].failureRate).toBeCloseTo(0.8, 2);
  });

  it("requires minimum sample size", () => {
    const observations = [
      { modelId: "model-rare", success: true, qualityScore: 1.0 },
      { modelId: "model-rare", success: true, qualityScore: 1.0 },
    ];

    const hints = distillRoutingHints("comp-1", observations, 5);

    // Not enough samples → should not appear in preferred or avoid
    expect(hints.preferredModels).toEqual([]);
    expect(hints.avoidModels).toEqual([]);
  });

  it("returns empty for empty observation set", () => {
    const hints = distillRoutingHints("comp-empty", []);
    expect(hints.preferredModels).toEqual([]);
    expect(hints.avoidModels).toEqual([]);
    expect(hints.contextSensitivities).toEqual([]);
  });

  it("identifies context sensitivities", () => {
    const observations = [
      ...Array.from({ length: 6 }, () => ({
        modelId: "model-a",
        success: true,
        context: "high complexity",
      })),
      ...Array.from({ length: 6 }, () => ({
        modelId: "model-b",
        success: false,
        context: "high complexity",
      })),
    ];

    const hints = distillRoutingHints("comp-ctx", observations, 3);

    expect(hints.contextSensitivities.length).toBeGreaterThan(0);
    const highComplexity = hints.contextSensitivities.find(
      (c) => c.context === "high complexity",
    );
    expect(highComplexity).toBeDefined();
    expect(highComplexity!.bestModel).toBe("model-a");
  });
});

describe("distillThresholdCalibration", () => {
  it("detects false positive rate", () => {
    const observations = [
      // 3 false positives: alert fired, no intervention needed
      ...Array.from({ length: 3 }, (_, i) => ({
        timestamp: daysAgo(10 - i),
        phiL: 0.6,
        alertFired: true,
        interventionNeeded: false,
      })),
      // 2 true positives: alert fired, intervention needed
      ...Array.from({ length: 2 }, (_, i) => ({
        timestamp: daysAgo(7 - i),
        phiL: 0.3,
        alertFired: true,
        interventionNeeded: true,
      })),
    ];

    const calibration = distillThresholdCalibration("comp-fp", observations);
    expect(calibration.falsePositiveRate).toBeCloseTo(0.6, 2); // 3/5
  });

  it("detects false negative rate", () => {
    const observations = [
      // 2 false negatives: intervention needed, no alert
      ...Array.from({ length: 2 }, (_, i) => ({
        timestamp: daysAgo(10 - i),
        phiL: 0.4,
        alertFired: false,
        interventionNeeded: true,
      })),
      // 3 true negatives: no alert, no intervention
      ...Array.from({ length: 3 }, (_, i) => ({
        timestamp: daysAgo(7 - i),
        phiL: 0.8,
        alertFired: false,
        interventionNeeded: false,
      })),
    ];

    const calibration = distillThresholdCalibration("comp-fn", observations);
    expect(calibration.falseNegativeRate).toBeCloseTo(1.0, 2); // 2/2 interventions missed
  });

  it("returns sensible defaults for empty observation set", () => {
    const calibration = distillThresholdCalibration("comp-empty", []);
    expect(calibration.falsePositiveRate).toBe(0);
    expect(calibration.falseNegativeRate).toBe(0);
    expect(calibration.suggestedAdjustments).toEqual([]);
  });

  it("suggests threshold adjustments when rates are high", () => {
    const observations = [
      // Many false positives with ΦL data
      ...Array.from({ length: 8 }, (_, i) => ({
        timestamp: daysAgo(20 - i),
        phiL: 0.55 + i * 0.01,
        alertFired: true,
        interventionNeeded: false,
      })),
      // A few true positives
      ...Array.from({ length: 2 }, (_, i) => ({
        timestamp: daysAgo(10 - i),
        phiL: 0.2,
        alertFired: true,
        interventionNeeded: true,
      })),
    ];

    const calibration = distillThresholdCalibration("comp-adj", observations);
    expect(calibration.falsePositiveRate).toBeGreaterThan(0.2);
    expect(calibration.suggestedAdjustments.length).toBeGreaterThan(0);
  });
});

// ============ MEMORY FLOW COORDINATOR ============

describe("computeUpwardFlow", () => {
  it("creates observation from execution result", () => {
    const result = computeUpwardFlow({
      execution: {
        patternId: "pattern-1",
        modelId: "gemini-flash",
        success: true,
        qualityScore: 0.85,
        durationMs: 1500,
      },
      existingObservationCount: 0,
      existingDistillations: [],
    });

    expect(result.observation.stratum).toBe(2);
    expect(result.observation.sourcePatternId).toBe("pattern-1");
    expect(result.observation.data.success).toBe(true);
    expect(result.observation.data.qualityScore).toBe(0.85);
    expect(result.observation.data.modelUsed).toBe("gemini-flash");
  });

  it("triggers distillation when observation count exceeds threshold", () => {
    const result = computeUpwardFlow({
      execution: {
        patternId: "pattern-1",
        modelId: "gemini-flash",
        success: true,
        durationMs: 1000,
      },
      existingObservationCount: 9, // This will make it 10 (the threshold)
      existingDistillations: [],
    });

    expect(result.shouldDistill).toBe(true);
  });

  it("does not trigger distillation below threshold", () => {
    const result = computeUpwardFlow({
      execution: {
        patternId: "pattern-1",
        modelId: "gemini-flash",
        success: true,
        durationMs: 1000,
      },
      existingObservationCount: 5,
      existingDistillations: [],
    });

    expect(result.shouldDistill).toBe(false);
  });

  it("triggers institutional promotion when distillation count + confidence sufficient", () => {
    const result = computeUpwardFlow({
      execution: {
        patternId: "pattern-1",
        modelId: "gemini-flash",
        success: true,
        durationMs: 1000,
      },
      existingObservationCount: 100,
      existingDistillations: [
        { id: "d1", confidence: 0.8, createdAt: daysAgo(30) },
        { id: "d2", confidence: 0.9, createdAt: daysAgo(25) },
        { id: "d3", confidence: 0.75, createdAt: daysAgo(20) },
        { id: "d4", confidence: 0.85, createdAt: daysAgo(15) },
        { id: "d5", confidence: 0.8, createdAt: daysAgo(10) },
      ],
    });

    expect(result.shouldPromoteToInstitutional).toBe(true);
  });

  it("does not trigger institutional promotion with low confidence", () => {
    const result = computeUpwardFlow({
      execution: {
        patternId: "pattern-1",
        modelId: "gemini-flash",
        success: true,
        durationMs: 1000,
      },
      existingObservationCount: 100,
      existingDistillations: [
        { id: "d1", confidence: 0.3, createdAt: daysAgo(30) },
        { id: "d2", confidence: 0.4, createdAt: daysAgo(25) },
        { id: "d3", confidence: 0.2, createdAt: daysAgo(20) },
        { id: "d4", confidence: 0.35, createdAt: daysAgo(15) },
        { id: "d5", confidence: 0.3, createdAt: daysAgo(10) },
      ],
    });

    expect(result.shouldPromoteToInstitutional).toBe(false);
  });

  it("captures failure signature in observation context", () => {
    const result = computeUpwardFlow({
      execution: {
        patternId: "pattern-1",
        modelId: "gemini-flash",
        success: false,
        durationMs: 30000,
        failureSignature: "timeout",
      },
      existingObservationCount: 5,
      existingDistillations: [],
    });

    expect(result.observation.data.success).toBe(false);
    expect(result.observation.data.context).toEqual({
      failureSignature: "timeout",
    });
  });
});

describe("computeDownwardFlow", () => {
  it("synthesizes context from available insights", () => {
    const profile: PerformanceProfile = {
      componentId: "comp-1",
      meanPhiL: 0.82,
      phiLTrend: "improving",
      phiLVariance: 0.005,
      commonFailureModes: [
        { signature: "timeout", frequency: 0.5, lastSeen: daysAgo(2) },
      ],
      successRate: 0.92,
      observationCount: 50,
      windowStart: daysAgo(30),
      windowEnd: new Date(),
    };

    const hints: RoutingHints = {
      componentId: "comp-1",
      preferredModels: [
        { modelId: "gemini-flash", successRate: 0.95, meanQuality: 0.88, sampleSize: 40 },
      ],
      avoidModels: [],
      contextSensitivities: [],
    };

    const context = computeDownwardFlow({
      componentId: "comp-1",
      distilledInsights: [profile],
      routingHints: [hints],
      institutionalKnowledge: [
        {
          content: "Use longer timeouts for complex tasks",
          confidence: 0.8,
          knowledgeType: "environment_adaptation",
        },
      ],
    });

    expect(context.performanceSummary).toContain("0.820");
    expect(context.performanceSummary).toContain("improving");
    expect(context.modelSuggestions.length).toBe(1);
    expect(context.modelSuggestions[0].modelId).toBe("gemini-flash");
    expect(context.knownFailureModes.length).toBe(1);
    expect(context.knownFailureModes[0].signature).toBe("timeout");
    expect(context.contextConfidence).toBeGreaterThan(0.5);
  });

  it("handles empty inputs gracefully", () => {
    const context = computeDownwardFlow({
      componentId: "comp-empty",
      distilledInsights: [],
      routingHints: [],
      institutionalKnowledge: [],
    });

    expect(context.performanceSummary).toContain("No performance data");
    expect(context.modelSuggestions).toEqual([]);
    expect(context.knownFailureModes).toEqual([]);
    expect(context.contextConfidence).toBe(0);
  });

  it("context confidence reflects evidence depth", () => {
    // Minimal evidence
    const minimal = computeDownwardFlow({
      componentId: "comp-1",
      distilledInsights: [],
      routingHints: [],
      institutionalKnowledge: [
        { content: "test", confidence: 0.5, knowledgeType: "anti_pattern" },
      ],
    });

    // Rich evidence
    const rich = computeDownwardFlow({
      componentId: "comp-1",
      distilledInsights: [
        {
          componentId: "comp-1",
          meanPhiL: 0.8,
          phiLTrend: "stable",
          phiLVariance: 0.01,
          commonFailureModes: [],
          successRate: 0.9,
          observationCount: 100,
          windowStart: daysAgo(30),
          windowEnd: new Date(),
        },
      ],
      routingHints: [
        {
          componentId: "comp-1",
          preferredModels: [
            { modelId: "m1", successRate: 0.9, meanQuality: 0.85, sampleSize: 50 },
          ],
          avoidModels: [],
          contextSensitivities: [],
        },
      ],
      institutionalKnowledge: [
        { content: "test", confidence: 0.8, knowledgeType: "composition_archetype" },
      ],
    });

    expect(rich.contextConfidence).toBeGreaterThan(minimal.contextConfidence);
  });
});
