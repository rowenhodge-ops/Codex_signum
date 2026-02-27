import { beforeEach, describe, expect, it, vi } from "vitest";
import { selectModel } from "../../src/patterns/thompson-router/index.js";

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

function setupSingleAgent() {
  mocks.listActiveAgentsByCapability.mockResolvedValue([
    makeAgentRecord({
      id: "test-agent:adaptive:high",
      name: "Test Agent",
      provider: "test-provider",
      model: "test-model",
      baseModelId: "test-base",
      thinkingMode: "adaptive",
      status: "active",
      avgLatencyMs: 3000,
      costPer1kOutput: 0.01,
      capabilities: ["code_generation"],
    }),
  ]);
}

describe("Decision node lifecycle via recordOutcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureContextCluster.mockResolvedValue(undefined);
    mocks.getArmStatsForCluster.mockResolvedValue([]);
    mocks.recordDecision.mockResolvedValue(undefined);
    mocks.recordDecisionOutcome.mockResolvedValue(undefined);
  });

  it("creates Decision node with status=pending on selectModel()", async () => {
    setupSingleAgent();

    const result = await selectModel({
      taskType: "code_generation",
      complexity: "moderate",
    });

    // Decision node was created via recordDecision
    expect(mocks.recordDecision).toHaveBeenCalledTimes(1);
    const callArgs = mocks.recordDecision.mock.calls[0][0];
    expect(callArgs.id).toContain("dec_");
    expect(callArgs.selectedAgentId).toBe("test-agent:adaptive:high");
    expect(callArgs.taskType).toBe("code_generation");
    expect(callArgs.complexity).toBe("moderate");

    // Result includes the decisionId and recordOutcome callback
    expect(result.decisionId).toContain("dec_");
    expect(typeof result.recordOutcome).toBe("function");
  });

  it("recordOutcome updates Decision to completed with metrics", async () => {
    setupSingleAgent();

    const result = await selectModel({
      taskType: "code_generation",
      complexity: "moderate",
    });

    await result.recordOutcome({
      success: true,
      durationMs: 120,
      qualityScore: 0.9,
    });

    expect(mocks.recordDecisionOutcome).toHaveBeenCalledTimes(1);
    const outcomeArgs = mocks.recordDecisionOutcome.mock.calls[0][0];
    expect(outcomeArgs.decisionId).toBe(result.decisionId);
    expect(outcomeArgs.success).toBe(true);
    expect(outcomeArgs.durationMs).toBe(120);
    expect(outcomeArgs.qualityScore).toBe(0.9);
  });

  it("recordOutcome with failure sets errorType", async () => {
    setupSingleAgent();

    const result = await selectModel({
      taskType: "code_generation",
      complexity: "complex",
    });

    await result.recordOutcome({
      success: false,
      durationMs: 5000,
      errorType: "timeout",
      notes: "Model timed out",
    });

    expect(mocks.recordDecisionOutcome).toHaveBeenCalledTimes(1);
    const outcomeArgs = mocks.recordDecisionOutcome.mock.calls[0][0];
    expect(outcomeArgs.success).toBe(false);
    expect(outcomeArgs.errorType).toBe("timeout");
    expect(outcomeArgs.notes).toBe("Model timed out");
  });

  it("recordOutcome is idempotent — second call is a no-op", async () => {
    setupSingleAgent();

    const result = await selectModel({
      taskType: "code_generation",
      complexity: "moderate",
    });

    // First call records the outcome
    await result.recordOutcome({ success: true, durationMs: 100 });
    expect(mocks.recordDecisionOutcome).toHaveBeenCalledTimes(1);

    // Second call is a no-op
    await result.recordOutcome({ success: false, durationMs: 200 });
    expect(mocks.recordDecisionOutcome).toHaveBeenCalledTimes(1);
  });

  it("recordOutcome passes cost data when provided", async () => {
    setupSingleAgent();

    const result = await selectModel({
      taskType: "code_generation",
      complexity: "moderate",
    });

    await result.recordOutcome({
      success: true,
      durationMs: 300,
      qualityScore: 0.85,
      cost: 0.042,
    });

    const outcomeArgs = mocks.recordDecisionOutcome.mock.calls[0][0];
    expect(outcomeArgs.cost).toBe(0.042);
    expect(outcomeArgs.qualityScore).toBe(0.85);
    expect(outcomeArgs.durationMs).toBe(300);
  });

  it("recordOutcome defaults qualityScore for success when not provided", async () => {
    setupSingleAgent();

    const result = await selectModel({
      taskType: "code_generation",
      complexity: "moderate",
    });

    await result.recordOutcome({ success: true, durationMs: 100 });

    const outcomeArgs = mocks.recordDecisionOutcome.mock.calls[0][0];
    expect(outcomeArgs.qualityScore).toBe(0.5); // default for success
  });

  it("recordOutcome defaults qualityScore for failure when not provided", async () => {
    setupSingleAgent();

    const result = await selectModel({
      taskType: "code_generation",
      complexity: "moderate",
    });

    await result.recordOutcome({ success: false, durationMs: 5000 });

    const outcomeArgs = mocks.recordDecisionOutcome.mock.calls[0][0];
    expect(outcomeArgs.qualityScore).toBe(0.0); // default for failure
  });
});
