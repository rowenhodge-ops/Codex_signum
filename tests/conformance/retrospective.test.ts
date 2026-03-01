// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Conformance Tests: Phase 3b Retrospective
 *
 * Tests pure functions (deriveConvergenceStatus, worstBand) directly,
 * and verifies runRetrospective orchestration with graph layer mocked.
 *
 * All graph access mocked via vi.mock on ../../src/graph/client.js.
 * Tests verify query wiring and pure function correctness.
 *
 * @module codex-signum-core/tests/conformance/retrospective
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  deriveConvergenceStatus,
  worstBand,
} from "../../src/patterns/retrospective/queries.js";
import type { HealthBand } from "../../src/types/threshold-event.js";

// ============================================================
// Group 1: deriveConvergenceStatus() — pure (5 tests)
// ============================================================

describe("deriveConvergenceStatus()", () => {
  it("returns insufficient_data when decisionCount < 10", () => {
    expect(deriveConvergenceStatus(5, 0.9, 0.8)).toBe("insufficient_data");
  });

  it("returns insufficient_data at boundary (9 decisions)", () => {
    expect(deriveConvergenceStatus(9, 0.95, 0.95)).toBe("insufficient_data");
  });

  it("returns converging when successRate >= 0.8 and topAgentRate >= 0.6", () => {
    expect(deriveConvergenceStatus(50, 0.85, 0.7)).toBe("converging");
  });

  it("returns diverging when successRate < 0.5", () => {
    expect(deriveConvergenceStatus(50, 0.4, 0.5)).toBe("diverging");
  });

  it("returns diverging when topSeedSelectionRate < 0.3 (agent churn)", () => {
    expect(deriveConvergenceStatus(50, 0.75, 0.2)).toBe("diverging");
  });

  it("returns stable for middle-ground values", () => {
    expect(deriveConvergenceStatus(50, 0.65, 0.45)).toBe("stable");
  });

  it("returns converging at exact boundaries (0.8, 0.6)", () => {
    expect(deriveConvergenceStatus(10, 0.8, 0.6)).toBe("converging");
  });

  it("returns diverging when both conditions met (low success AND low agent rate)", () => {
    expect(deriveConvergenceStatus(50, 0.3, 0.1)).toBe("diverging");
  });
});

// ============================================================
// Group 2: worstBand() — pure (5 tests)
// ============================================================

describe("worstBand()", () => {
  it("returns algedonic when present", () => {
    expect(worstBand(["healthy", "algedonic", "degraded"])).toBe("algedonic");
  });

  it("returns critical when algedonic absent but critical present", () => {
    expect(worstBand(["healthy", "critical", "trusted"])).toBe("critical");
  });

  it("returns worst band from degraded + trusted", () => {
    expect(worstBand(["trusted", "degraded"])).toBe("degraded");
  });

  it("returns unknown for empty list", () => {
    expect(worstBand([])).toBe("unknown");
  });

  it("returns optimal when only optimal present", () => {
    expect(worstBand(["optimal"])).toBe("optimal");
  });

  it("handles all 6 bands — returns algedonic as worst", () => {
    const allBands: HealthBand[] = [
      "optimal",
      "trusted",
      "healthy",
      "degraded",
      "critical",
      "algedonic",
    ];
    expect(worstBand(allBands)).toBe("algedonic");
  });

  it("returns unknown for unrecognised band names", () => {
    expect(worstBand(["bogus", "invalid"])).toBe("unknown");
  });
});

// ============================================================
// Group 3: runRetrospective() — orchestration (graph mocked)
// ============================================================

// Mock the graph client layer
vi.mock("../../src/graph/client.js", () => ({
  runQuery: vi.fn().mockResolvedValue({ records: [] }),
  writeTransaction: vi.fn().mockImplementation(async (fn: Function) => {
    const mockTx = {
      run: vi.fn().mockResolvedValue({ records: [] }),
    };
    return fn(mockTx);
  }),
}));

// Import AFTER mocks are set up
const { runQuery } = await import("../../src/graph/client.js");
const { runRetrospective } = await import(
  "../../src/patterns/retrospective/retrospective.js"
);
const queries = await import(
  "../../src/patterns/retrospective/queries.js"
);

describe("runRetrospective()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all 4 queries return empty results
    vi.spyOn(queries, "queryOverallSuccess").mockResolvedValue({
      total: 0,
      successRate: 0,
    });
    vi.spyOn(queries, "queryConvergence").mockResolvedValue([]);
    vi.spyOn(queries, "queryStageHealth").mockResolvedValue([]);
    vi.spyOn(queries, "queryDegradation").mockResolvedValue([]);
  });

  it("runs all 4 queries (overall, convergence, stages, degradation)", async () => {
    await runRetrospective({ windowHours: 24 });
    expect(queries.queryOverallSuccess).toHaveBeenCalledOnce();
    expect(queries.queryConvergence).toHaveBeenCalledOnce();
    expect(queries.queryStageHealth).toHaveBeenCalledOnce();
    expect(queries.queryDegradation).toHaveBeenCalledOnce();
  });

  it("passes windowHours to all queries (defaults to 24)", async () => {
    await runRetrospective({});
    expect(queries.queryOverallSuccess).toHaveBeenCalledWith(24);
    expect(queries.queryConvergence).toHaveBeenCalledWith(24);
    expect(queries.queryStageHealth).toHaveBeenCalledWith(24, undefined);
    expect(queries.queryDegradation).toHaveBeenCalledWith(24);
  });

  it("passes custom windowHours", async () => {
    await runRetrospective({ windowHours: 48 });
    expect(queries.queryOverallSuccess).toHaveBeenCalledWith(48);
    expect(queries.queryConvergence).toHaveBeenCalledWith(48);
  });

  it("passes bloomIds to queryStageHealth", async () => {
    await runRetrospective({ bloomIds: ["p1", "p2"] });
    expect(queries.queryStageHealth).toHaveBeenCalledWith(24, ["p1", "p2"]);
  });

  it("returns structured insights with all fields populated", async () => {
    vi.spyOn(queries, "queryOverallSuccess").mockResolvedValue({
      total: 100,
      successRate: 0.85,
    });
    const result = await runRetrospective({ windowHours: 12 });
    expect(result.windowHours).toBe(12);
    expect(result.queriedAt).toBeTruthy();
    expect(result.totalDecisions).toBe(100);
    expect(result.overallSuccessRate).toBe(0.85);
    expect(result.convergence).toEqual([]);
    expect(result.stages).toEqual([]);
    expect(result.degradation).toEqual([]);
    expect(result.insightNodeIds).toEqual([]);
  });

  it("does NOT write DistilledInsight when writeInsights is false (default)", async () => {
    vi.spyOn(queries, "queryConvergence").mockResolvedValue([
      {
        contextClusterId: "cc-1",
        decisionCount: 50,
        successRate: 0.3,
        topSeedId: "a1",
        topSeedSelectionRate: 0.2,
        status: "diverging",
      },
    ]);
    const { writeTransaction: mockWrite } = await import(
      "../../src/graph/client.js"
    );
    const result = await runRetrospective({});
    expect(mockWrite).not.toHaveBeenCalled();
    expect(result.insightNodeIds).toEqual([]);
  });

  it("writes DistilledInsight for diverging clusters when writeInsights: true", async () => {
    vi.spyOn(queries, "queryConvergence").mockResolvedValue([
      {
        contextClusterId: "cc-div",
        decisionCount: 50,
        successRate: 0.3,
        topSeedId: "a1",
        topSeedSelectionRate: 0.2,
        status: "diverging",
      },
    ]);
    const { writeTransaction: mockWrite } = await import(
      "../../src/graph/client.js"
    );
    const result = await runRetrospective({ writeInsights: true });
    expect(mockWrite).toHaveBeenCalledOnce();
    expect(result.insightNodeIds).toHaveLength(1);
    expect(result.insightNodeIds[0]).toContain("insight-cc-div-");
  });

  it("does NOT write DistilledInsight for converging clusters even with writeInsights: true", async () => {
    vi.spyOn(queries, "queryConvergence").mockResolvedValue([
      {
        contextClusterId: "cc-conv",
        decisionCount: 50,
        successRate: 0.9,
        topSeedId: "a1",
        topSeedSelectionRate: 0.8,
        status: "converging",
      },
    ]);
    const { writeTransaction: mockWrite } = await import(
      "../../src/graph/client.js"
    );
    const result = await runRetrospective({ writeInsights: true });
    expect(mockWrite).not.toHaveBeenCalled();
    expect(result.insightNodeIds).toEqual([]);
  });

  it("writes multiple DistilledInsights for multiple diverging clusters", async () => {
    vi.spyOn(queries, "queryConvergence").mockResolvedValue([
      {
        contextClusterId: "cc-div-1",
        decisionCount: 50,
        successRate: 0.3,
        topSeedId: "a1",
        topSeedSelectionRate: 0.2,
        status: "diverging",
      },
      {
        contextClusterId: "cc-stable",
        decisionCount: 50,
        successRate: 0.7,
        topSeedId: "a2",
        topSeedSelectionRate: 0.5,
        status: "stable",
      },
      {
        contextClusterId: "cc-div-2",
        decisionCount: 50,
        successRate: 0.4,
        topSeedId: "a3",
        topSeedSelectionRate: 0.25,
        status: "diverging",
      },
    ]);
    const { writeTransaction: mockWrite } = await import(
      "../../src/graph/client.js"
    );
    const result = await runRetrospective({ writeInsights: true });
    expect(mockWrite).toHaveBeenCalledTimes(2);
    expect(result.insightNodeIds).toHaveLength(2);
    expect(result.insightNodeIds[0]).toContain("cc-div-1");
    expect(result.insightNodeIds[1]).toContain("cc-div-2");
  });

  it("returns queriedAt as ISO timestamp", async () => {
    const before = new Date().toISOString();
    const result = await runRetrospective({});
    const after = new Date().toISOString();
    expect(result.queriedAt >= before).toBe(true);
    expect(result.queriedAt <= after).toBe(true);
  });
});
