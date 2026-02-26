/**
 * Codex Signum — Conformance Tests: Stratum 3 Distillation
 *
 * Verifies the three distillation output types:
 * performance profile, routing hints, threshold calibration data.
 *
 * @see engineering-bridge-v2.0.md §Part 7 "Memory sizing"
 */
import { describe, expect, it } from "vitest";
import type {
  PerformanceProfile,
  RoutingHints,
  ThresholdCalibrationData,
} from "../../src/memory/distillation.js";

// ── Type shape conformance ─────────────────────────────────────────────────
// These tests verify the type contracts are correct by constructing valid objects.
// If the types change in ways that break the spec, these tests catch it.

describe("PerformanceProfile shape", () => {
  it("accepts valid performance profile", () => {
    const profile: PerformanceProfile = {
      componentId: "seed-abc",
      meanPhiL: 0.72,
      phiLTrend: "stable",
      phiLVariance: 0.01,
      commonFailureModes: [
        { signature: "timeout", frequency: 0.05, lastSeen: new Date() },
      ],
      successRate: 0.92,
      observationCount: 150,
      windowStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      windowEnd: new Date(),
    };
    expect(profile.componentId).toBe("seed-abc");
    expect(profile.meanPhiL).toBeGreaterThan(0);
    expect(["improving", "stable", "declining"]).toContain(profile.phiLTrend);
    expect(profile.successRate).toBeLessThanOrEqual(1);
  });

  it("phiLTrend accepts all three values", () => {
    const trends: PerformanceProfile["phiLTrend"][] = ["improving", "stable", "declining"];
    expect(trends).toHaveLength(3);
  });
});

describe("RoutingHints shape", () => {
  it("accepts valid routing hints", () => {
    const hints: RoutingHints = {
      componentId: "line-xyz",
      preferredModels: [
        { modelId: "claude-3-5-sonnet", successRate: 0.95, meanQuality: 0.88, sampleSize: 50 },
      ],
      avoidModels: [
        { modelId: "gpt-4o", failureRate: 0.3, reason: "high timeout rate" },
      ],
      contextSensitivities: [
        { context: "large files", bestModel: "claude-3-5-sonnet", evidence: 12 },
      ],
    };
    expect(hints.componentId).toBeDefined();
    expect(hints.preferredModels.length).toBeGreaterThanOrEqual(0);
    expect(hints.avoidModels.length).toBeGreaterThanOrEqual(0);
  });
});

describe("ThresholdCalibrationData shape", () => {
  it("accepts valid threshold calibration data", () => {
    const cal: ThresholdCalibrationData = {
      componentId: "bloom-001",
      falsePositiveRate: 0.08,
      falseNegativeRate: 0.03,
      recommendedPhiLHealthy: 0.72,
      recommendedPhiLDegraded: 0.48,
      evidenceCount: 200,
      confidenceScore: 0.85,
      lastUpdated: new Date(),
    };
    expect(cal.falsePositiveRate).toBeGreaterThanOrEqual(0);
    expect(cal.falseNegativeRate).toBeGreaterThanOrEqual(0);
    expect(cal.confidenceScore).toBeLessThanOrEqual(1);
  });
});
