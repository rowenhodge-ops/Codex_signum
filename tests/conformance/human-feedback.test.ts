// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Human Feedback — Conformance Tests (M-8.4)
 *
 * Tests the feedback recording, quality adjustment, calibration metrics,
 * and Thompson integration. Mocks the graph client layer.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock graph client ──────────────────────────────────────────────────────

const mockRun = vi.fn().mockResolvedValue({ records: [] });

const mockTx = {
  run: mockRun,
};

vi.mock("../../src/graph/client.js", () => ({
  writeTransaction: vi.fn().mockImplementation(async (fn: Function) => {
    return fn(mockTx);
  }),
  runQuery: vi.fn().mockResolvedValue({ records: [] }),
  getDriver: vi.fn(),
  closeDriver: vi.fn(),
}));

const { writeTransaction, runQuery } = await import(
  "../../src/graph/client.js"
);

const {
  recordHumanFeedback,
  getHumanFeedbackForRun,
  listPendingFeedbackRuns,
  getCalibrationMetrics,
} = await import("../../src/graph/queries.js");

// ── Helpers ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockRun.mockResolvedValue({ records: [] });
  vi.mocked(runQuery).mockResolvedValue({ records: [] } as any);
});

// ── Tests ────────────────────────────────────────────────────────────────

describe("recordHumanFeedback()", () => {
  it("creates a HumanFeedback node for accept verdict", async () => {
    await recordHumanFeedback({
      id: "hf-test-1",
      runId: "run-abc",
      verdict: "accept",
      reason: "Good analysis",
    });

    // Should call writeTransaction
    expect(writeTransaction).toHaveBeenCalledOnce();

    // First tx.run creates the HumanFeedback node
    expect(mockRun).toHaveBeenCalled();
    const firstCall = mockRun.mock.calls[0];
    expect(firstCall[0]).toContain("CREATE (hf:HumanFeedback");
    expect(firstCall[1]).toMatchObject({
      id: "hf-test-1",
      runId: "run-abc",
      verdict: "accept",
      reason: "Good analysis",
    });

    // Second tx.run marks decisions as human-validated (accept path)
    const acceptCall = mockRun.mock.calls[1];
    expect(acceptCall[0]).toContain("humanOverride = 'accepted'");
    expect(acceptCall[1]).toMatchObject({
      runId: "run-abc",
      feedbackId: "hf-test-1",
    });
  });

  it("applies quality penalty on reject verdict", async () => {
    await recordHumanFeedback({
      id: "hf-test-2",
      runId: "run-def",
      verdict: "reject",
      reason: "Hallucinated axiom names",
    });

    // Second tx.run applies penalty (reject path)
    const rejectCall = mockRun.mock.calls[1];
    expect(rejectCall[0]).toContain("humanOverride = 'rejected'");
    expect(rejectCall[0]).toContain("adjustedQuality = d.qualityScore * 0.5");
    expect(rejectCall[1]).toMatchObject({
      runId: "run-def",
      feedbackId: "hf-test-2",
    });
  });

  it("applies per-task verdicts on partial feedback", async () => {
    await recordHumanFeedback({
      id: "hf-test-3",
      runId: "run-ghi",
      verdict: "partial",
      reason: "Mixed results",
      taskVerdicts: [
        { taskId: "t1", verdict: "accept" },
        { taskId: "t2", verdict: "reject", reason: "Wrong formula" },
      ],
    });

    // First call: HumanFeedback node (verdict=partial, no global accept/reject)
    const createCall = mockRun.mock.calls[0];
    expect(createCall[1]).toMatchObject({ verdict: "partial" });

    // Should have per-task calls (t1 accept, t2 reject)
    // Partial doesn't trigger global accept/reject, only taskVerdicts
    const taskCalls = mockRun.mock.calls.slice(1);
    expect(taskCalls.length).toBe(2);

    // t1 accept
    const t1Call = taskCalls[0];
    expect(t1Call[0]).toContain("humanOverride = 'accepted'");
    expect(t1Call[1]).toMatchObject({ taskId: "t1" });

    // t2 reject
    const t2Call = taskCalls[1];
    expect(t2Call[0]).toContain("humanOverride = 'rejected'");
    expect(t2Call[0]).toContain("adjustedQuality");
    expect(t2Call[1]).toMatchObject({ taskId: "t2" });
  });

  it("handles missing reason gracefully", async () => {
    await recordHumanFeedback({
      id: "hf-test-4",
      runId: "run-jkl",
      verdict: "accept",
    });

    const createCall = mockRun.mock.calls[0];
    expect(createCall[1]).toMatchObject({ reason: null });
  });

  it("handles empty taskVerdicts gracefully", async () => {
    await recordHumanFeedback({
      id: "hf-test-5",
      runId: "run-mno",
      verdict: "partial",
      taskVerdicts: [],
    });

    // Only the create call, no task-specific calls
    // Create + no global accept/reject (partial) = 1 call
    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});

describe("getHumanFeedbackForRun()", () => {
  it("returns null when no feedback exists", async () => {
    vi.mocked(runQuery).mockResolvedValue({ records: [] } as any);
    const result = await getHumanFeedbackForRun("run-nonexistent");
    expect(result).toBeNull();
  });

  it("returns feedback record when it exists", async () => {
    const mockRecord = {
      get: (key: string) =>
        key === "hf"
          ? { properties: { runId: "run-xyz", verdict: "accept" } }
          : undefined,
    };
    vi.mocked(runQuery).mockResolvedValue({
      records: [mockRecord],
    } as any);

    const result = await getHumanFeedbackForRun("run-xyz");
    expect(result).not.toBeNull();
    expect(result!.get("hf").properties.verdict).toBe("accept");
  });
});

describe("listPendingFeedbackRuns()", () => {
  it("returns empty array when no pending runs", async () => {
    vi.mocked(runQuery).mockResolvedValue({ records: [] } as any);
    const result = await listPendingFeedbackRuns();
    expect(result).toEqual([]);
  });

  it("returns pending runs with correct shape", async () => {
    const mockRecords = [
      {
        get: (key: string) => {
          if (key === "runId") return "run-123";
          if (key === "taskCount") return 5;
          if (key === "timestamp") return "2026-03-02T10:00:00Z";
          return undefined;
        },
      },
    ];
    vi.mocked(runQuery).mockResolvedValue({
      records: mockRecords,
    } as any);

    const result = await listPendingFeedbackRuns();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      runId: "run-123",
      taskCount: 5,
      timestamp: "2026-03-02T10:00:00Z",
    });
  });
});

describe("getCalibrationMetrics()", () => {
  it("returns zero metrics when no feedback exists", async () => {
    vi.mocked(runQuery).mockResolvedValue({ records: [] } as any);
    const metrics = await getCalibrationMetrics();
    expect(metrics).toMatchObject({
      totalRuns: 0,
      accepted: 0,
      rejected: 0,
      partial: 0,
      acceptRate: 0,
      validatorPrecision: 0,
      validatorRecall: 0,
    });
  });

  it("computes accept rate correctly", async () => {
    vi.mocked(runQuery)
      .mockResolvedValueOnce({
        records: [
          {
            get: (key: string) =>
              key === "verdict" ? "accept" : key === "cnt" ? 7 : undefined,
          },
          {
            get: (key: string) =>
              key === "verdict" ? "reject" : key === "cnt" ? 3 : undefined,
          },
        ],
      } as any)
      .mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === "truePositive") return 5;
              if (key === "falsePositive") return 2;
              if (key === "falseNegative") return 1;
              return 0;
            },
          },
        ],
      } as any);

    const metrics = await getCalibrationMetrics();
    expect(metrics.totalRuns).toBe(10);
    expect(metrics.accepted).toBe(7);
    expect(metrics.rejected).toBe(3);
    expect(metrics.acceptRate).toBeCloseTo(0.7);
    // precision = 5 / (5+2) = 0.714
    expect(metrics.validatorPrecision).toBeCloseTo(5 / 7);
    // recall = 5 / (5+1) = 0.833
    expect(metrics.validatorRecall).toBeCloseTo(5 / 6);
  });
});

describe("HumanFeedbackProps type", () => {
  it("requires id, runId, and verdict", () => {
    // Type-level check — these all compile
    const accept: Parameters<typeof recordHumanFeedback>[0] = {
      id: "hf-1",
      runId: "run-1",
      verdict: "accept",
    };
    const reject: Parameters<typeof recordHumanFeedback>[0] = {
      id: "hf-2",
      runId: "run-2",
      verdict: "reject",
      reason: "bad",
    };
    const partial: Parameters<typeof recordHumanFeedback>[0] = {
      id: "hf-3",
      runId: "run-3",
      verdict: "partial",
      taskVerdicts: [{ taskId: "t1", verdict: "accept" }],
    };
    expect(accept.verdict).toBe("accept");
    expect(reject.verdict).toBe("reject");
    expect(partial.verdict).toBe("partial");
  });
});

describe("Thompson integration", () => {
  it("getArmStatsForCluster reads adjustedQuality when present", async () => {
    // This is a structural check — the query in queries.ts should use COALESCE
    const { getArmStatsForCluster } = await import(
      "../../src/graph/queries.js"
    );

    // Mock the runQuery to capture the Cypher query
    vi.mocked(runQuery).mockResolvedValue({ records: [] } as any);
    await getArmStatsForCluster("test-cluster");

    const [cypher] = vi.mocked(runQuery).mock.calls[0];
    // The query MUST use COALESCE(d.adjustedQuality, d.qualityScore)
    expect(cypher).toContain("COALESCE(d.adjustedQuality, d.qualityScore)");
  });
});
