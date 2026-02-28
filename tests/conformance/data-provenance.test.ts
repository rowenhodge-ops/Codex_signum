// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { beforeEach, describe, expect, it, vi } from "vitest";
import { selectModel } from "../../src/patterns/thompson-router/index.js";
import type { ArmStats } from "../../src/graph/queries.js";

const mocks = vi.hoisted(() => ({
  listActiveAgentsByCapability: vi.fn(),
  listActiveAgents: vi.fn(),
  ensureContextCluster: vi.fn(),
  getArmStatsForCluster: vi.fn(),
  recordDecision: vi.fn(),
  recordDecisionOutcome: vi.fn(),
}));

vi.mock("../../src/graph/index.js", () => ({
  listActiveAgentsByCapability: mocks.listActiveAgentsByCapability,
  listActiveAgents: mocks.listActiveAgents,
  ensureContextCluster: mocks.ensureContextCluster,
  getArmStatsForCluster: mocks.getArmStatsForCluster,
  recordDecision: mocks.recordDecision,
  recordDecisionOutcome: mocks.recordDecisionOutcome,
}));

function makeAgentRecord(properties: Record<string, unknown>) {
  return {
    get: (key: string) => {
      if (key === "a") return { properties };
      return undefined;
    },
  };
}

describe("Data provenance contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureContextCluster.mockResolvedValue(undefined);
    mocks.recordDecision.mockResolvedValue(undefined);
    mocks.recordDecisionOutcome.mockResolvedValue(undefined);
  });

  it("arm stats read from graph before sampling — no default priors invented", async () => {
    const graphStats: ArmStats[] = [
      {
        agentId: "agent-from-graph",
        alpha: 25,
        beta: 3,
        totalTrials: 26,
        avgQuality: 0.92,
        avgLatencyMs: 4000,
        avgCost: 0.03,
        totalCost: 0.78,
      },
    ];
    mocks.getArmStatsForCluster.mockResolvedValue(graphStats);
    mocks.listActiveAgentsByCapability.mockResolvedValue([
      makeAgentRecord({
        id: "agent-from-graph",
        name: "Graph Agent",
        provider: "test",
        model: "test-model",
        baseModelId: "test-base",
        thinkingMode: "default",
        status: "active",
        avgLatencyMs: 4000,
        costPer1kOutput: 0.01,
        capabilities: ["code_generation"],
      }),
    ]);

    const result = await selectModel({
      taskType: "code_generation",
      complexity: "moderate",
    });

    // Verify the graph was queried for arm stats (not freshly initialized)
    expect(mocks.getArmStatsForCluster).toHaveBeenCalledTimes(1);
    // The selected agent must match what was available from the graph
    expect(result.selectedAgentId).toBe("agent-from-graph");
  });

  it("selectModel records the agentId that was actually selected", async () => {
    mocks.getArmStatsForCluster.mockResolvedValue([]);
    mocks.listActiveAgentsByCapability.mockResolvedValue([
      makeAgentRecord({
        id: "exactly-this-id",
        name: "Exact Agent",
        provider: "exact",
        model: "exact-model",
        baseModelId: "exact-base",
        thinkingMode: "default",
        status: "active",
        avgLatencyMs: 1000,
        costPer1kOutput: 0.005,
        capabilities: [],
      }),
    ]);

    const result = await selectModel({
      taskType: "review",
      complexity: "trivial",
    });

    // The Decision node's agentId must match what Thompson sampling returned
    const decisionArgs = mocks.recordDecision.mock.calls[0][0];
    expect(decisionArgs.selectedAgentId).toBe(result.selectedAgentId);
    expect(result.selectedAgentId).toBe("exactly-this-id");
  });

  it("recordOutcome durationMs matches what caller provided exactly", async () => {
    mocks.getArmStatsForCluster.mockResolvedValue([]);
    mocks.listActiveAgentsByCapability.mockResolvedValue([
      makeAgentRecord({
        id: "duration-test",
        name: "Duration Test",
        provider: "test",
        model: "test-model",
        baseModelId: "test-base",
        thinkingMode: "default",
        status: "active",
        avgLatencyMs: 1000,
        costPer1kOutput: 0.005,
        capabilities: [],
      }),
    ]);

    const result = await selectModel({
      taskType: "code_generation",
      complexity: "moderate",
    });

    // Caller provides exact durationMs — no rounding or smoothing on Decision record
    const exactDuration = 1234.5678;
    await result.recordOutcome({
      success: true,
      durationMs: exactDuration,
      qualityScore: 0.77,
    });

    const outcomeArgs = mocks.recordDecisionOutcome.mock.calls[0][0];
    // Raw Decision record must preserve exact caller value (EWMA is for ArmStats, not Decision)
    expect(outcomeArgs.durationMs).toBe(exactDuration);
    expect(outcomeArgs.qualityScore).toBe(0.77);
  });
});
