// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeCostAdjustedReward,
  selectModel,
} from "../../src/patterns/thompson-router/index.js";

const mocks = vi.hoisted(() => ({
  listActiveAgentsByCapability: vi.fn(),
  listActiveAgents: vi.fn(),
  ensureContextCluster: vi.fn(),
  getArmStatsForCluster: vi.fn(),
  recordDecision: vi.fn(),
}));

vi.mock("../../src/graph/index.js", () => ({
  listActiveAgentsByCapability: mocks.listActiveAgentsByCapability,
  listActiveAgents: mocks.listActiveAgents,
  ensureContextCluster: mocks.ensureContextCluster,
  getArmStatsForCluster: mocks.getArmStatsForCluster,
  recordDecision: mocks.recordDecision,
}));

function makeAgentRecord(properties: Record<string, unknown>) {
  return {
    get: (key: string) => {
      if (key === "a") return { properties };
      return undefined;
    },
  };
}

describe("selectModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureContextCluster.mockResolvedValue(undefined);
    mocks.getArmStatsForCluster.mockResolvedValue([]);
    mocks.recordDecision.mockResolvedValue(undefined);
  });

  it("throws when no agents are available", async () => {
    mocks.listActiveAgentsByCapability.mockResolvedValue([]);
    mocks.listActiveAgents.mockResolvedValue([]);

    await expect(
      selectModel({
        taskType: "code_generation",
        complexity: "moderate",
      }),
    ).rejects.toThrow("No active agents in graph");
  });

  it("returns required selection fields", async () => {
    mocks.listActiveAgentsByCapability.mockResolvedValue([
      makeAgentRecord({
        id: "gemini-2.5-flash:default",
        name: "Gemini 2.5 Flash",
        provider: "vertex-ai",
        model: "gemini-2.5-flash",
        baseModelId: "gemini-2.5-flash",
        thinkingMode: "default",
        status: "active",
        avgLatencyMs: 1000,
        costPer1kOutput: 0.0006,
        capabilities: ["code_generation"],
      }),
    ]);

    const result = await selectModel({
      taskType: "code_generation",
      complexity: "moderate",
      callerPatternId: "dev-agent",
    });

    expect(result.selectedAgentId).toBe("gemini-2.5-flash:default");
    expect(result.baseModelId).toBe("gemini-2.5-flash");
    expect(result.provider).toBe("vertex-ai");
    expect(result.apiModelString).toBe("gemini-2.5-flash");
    expect(result.decisionId).toContain("dec_");
    expect(result.contextClusterId).toBe("code_generation:moderate:general");
    expect(typeof result.wasExploratory).toBe("boolean");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("applies capability filtering requirements", async () => {
    mocks.listActiveAgentsByCapability.mockResolvedValue([
      makeAgentRecord({
        id: "claude-sonnet-4-6:adaptive:high",
        name: "Claude Sonnet 4.6",
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        baseModelId: "claude-sonnet-4-6",
        thinkingMode: "adaptive",
        status: "active",
        avgLatencyMs: 4000,
        costPer1kOutput: 0.015,
        capabilities: ["code_generation", "review"],
      }),
    ]);

    await selectModel({
      taskType: "review",
      complexity: "complex",
      requiresAdaptiveThinking: true,
      requiresStructuredOutput: true,
      maxCostPer1kOutput: 0.02,
    });

    expect(mocks.listActiveAgentsByCapability).toHaveBeenCalledWith({
      supportsAdaptiveThinking: true,
      supportsStructuredOutputs: true,
      maxCostPer1kOutput: 0.02,
    });
  });
});

describe("computeCostAdjustedReward", () => {
  it("returns values bounded to [0, 1]", () => {
    for (const value of [
      computeCostAdjustedReward(1.2, 0.01, "routine"),
      computeCostAdjustedReward(-0.2, 0.01, "routine"),
      computeCostAdjustedReward(0.6, 100, "routine"),
    ]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("applies zero penalty when under budget", () => {
    const reward = computeCostAdjustedReward(0.8, 0.005, "routine");
    expect(reward).toBeCloseTo(0.8, 6);
  });

  it("increases penalty for over-budget calls", () => {
    const nearBudget = computeCostAdjustedReward(0.8, 0.02, "routine");
    const overBudget = computeCostAdjustedReward(0.8, 0.2, "routine");
    expect(overBudget).toBeLessThan(nearBudget);
  });
});
