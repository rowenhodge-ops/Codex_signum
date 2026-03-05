// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: DevAgent Pipeline
 *
 * DevAgent requires a ModelExecutor and QualityAssessor — both are
 * interfaces that callers implement. Full pipeline tests use mocks.
 *
 * Pure tests here verify configuration and type contracts.
 * @future(M-10) tests assert the full pipeline integration contract.
 *
 * @see patterns/dev-agent/types.ts
 */
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_DEVAGENT_CONFIG, mapComplexity } from "../../src/patterns/dev-agent/types.js";
import type { AgentTask, DevAgentModelExecutor, QualityAssessor } from "../../src/patterns/dev-agent/types.js";
import type { ConstitutionalRule } from "../../src/types/constitutional.js";
import { DevAgent } from "../../src/patterns/dev-agent/pipeline.js";
import type { RoutableModel } from "../../src/patterns/thompson-router/index.js";

// ── DEFAULT_DEVAGENT_CONFIG ────────────────────────────────────────────────

describe("DEFAULT_DEVAGENT_CONFIG", () => {
  it("has defined quality threshold", () => {
    expect(typeof DEFAULT_DEVAGENT_CONFIG.qualityThreshold).toBe("number");
    expect(DEFAULT_DEVAGENT_CONFIG.qualityThreshold).toBeGreaterThan(0);
    expect(DEFAULT_DEVAGENT_CONFIG.qualityThreshold).toBeLessThanOrEqual(1);
  });

  it("has defined max corrections count (maxCorrections)", () => {
    expect(typeof DEFAULT_DEVAGENT_CONFIG.maxCorrections).toBe("number");
    expect(DEFAULT_DEVAGENT_CONFIG.maxCorrections).toBeGreaterThanOrEqual(1);
  });

  it("has pipeline stages defined", () => {
    expect(Array.isArray(DEFAULT_DEVAGENT_CONFIG.stages)).toBe(true);
    expect(DEFAULT_DEVAGENT_CONFIG.stages.length).toBeGreaterThan(0);
  });

  it("default stages include all 4 phases: scope, execute, review, validate", () => {
    expect(DEFAULT_DEVAGENT_CONFIG.stages).toContain("scope");
    expect(DEFAULT_DEVAGENT_CONFIG.stages).toContain("execute");
    expect(DEFAULT_DEVAGENT_CONFIG.stages).toContain("review");
    expect(DEFAULT_DEVAGENT_CONFIG.stages).toContain("validate");
  });
});

// ── mapComplexity ──────────────────────────────────────────────────────────

describe("mapComplexity", () => {
  it("trivial → low", () => {
    expect(mapComplexity("trivial")).toBe("low");
  });

  it("moderate → low", () => {
    expect(mapComplexity("moderate")).toBe("low");
  });

  it("complex → medium", () => {
    expect(mapComplexity("complex")).toBe("medium");
  });

  it("critical → high", () => {
    expect(mapComplexity("critical")).toBe("high");
  });
});

// ── Type contracts ────────────────────────────────────────────────────────

describe("AgentTask shape", () => {
  it("accepts valid task object with required fields", () => {
    const task: AgentTask = {
      id: "task-001",
      prompt: "Implement the ΦL computation",
      taskType: "implementation",
      complexity: "moderate",
    };
    expect(task.id).toBeDefined();
    expect(task.prompt).toBeDefined();
    expect(task.complexity).toBeDefined();
  });

  it("complexity enum values are the valid set", () => {
    const validComplexities: AgentTask["complexity"][] = ["trivial", "moderate", "complex", "critical"];
    expect(validComplexities).toHaveLength(4);
  });
});

// ── Pipeline integration (@future(M-10) — requires executor mock) ────────
// These tests assert the DevAgent pipeline contracts that must hold when
// the full pipeline is wired with graph persistence, correction helix,
// constitutional checks, lifecycle hooks, and Thompson Sampling memory.

/** Mock models for Thompson routing */
const mockModels: RoutableModel[] = [
  {
    id: "mock-model-1",
    name: "Mock Model 1",
    provider: "test",
    costPer1kTokens: 0.01,
    avgLatencyMs: 100,
    capabilities: ["code_generation"],
    status: "active",
  },
];

/** Mock executor that returns deterministic output */
const mockExecutor: DevAgentModelExecutor = async (_modelId, _prompt, _stage) => ({
  output: "mock output for testing",
  durationMs: 50,
  cost: 0.001,
});

/** Mock assessor returning configurable quality */
const createMockAssessor = (quality: number): QualityAssessor =>
  async (_output, _stage, _task) => quality;

const mockTask: AgentTask = {
  id: "test-task-001",
  prompt: "Test task prompt",
  taskType: "implementation",
  complexity: "moderate",
};

describe("DevAgent.run() (integration — @future(M-10))", () => {
  it("@future(M-10) successful run returns PipelineResult with all 4 stages completed", async () => {
    const agent = new DevAgent(mockModels, mockExecutor, createMockAssessor(0.8));
    const result = await agent.run(mockTask);

    // Pipeline should complete with all 4 stages
    expect(result.stages).toHaveLength(4);
    expect(result.taskId).toBe(mockTask.id);
    // Overall quality should reflect the assessor's score
    expect(result.overallQuality).toBeGreaterThanOrEqual(0.5);
    // Correction count should be 0 when quality passes on first attempt
    expect(result.correctionCount).toBe(0);
    // Decisions should be recorded for Thompson Sampling memory
    expect(result.decisions.length).toBeGreaterThanOrEqual(4);
    // Each decision should have an outcome attached
    for (const decision of result.decisions) {
      expect(decision.outcome).toBeDefined();
      expect(decision.outcome!.qualityScore).toBeGreaterThan(0);
    }
  });

  it("@future(M-10) quality below threshold triggers correction helix", async () => {
    // First call returns low quality, subsequent calls return passing quality
    let callCount = 0;
    const improvingAssessor: QualityAssessor = async () => {
      callCount++;
      return callCount <= 1 ? 0.2 : 0.8; // First attempt fails, second passes
    };

    const agent = new DevAgent(mockModels, mockExecutor, improvingAssessor);
    const result = await agent.run({ ...mockTask, id: "correction-test" });

    // Should have correction iterations > 0
    expect(result.correctionCount).toBeGreaterThan(0);
    // Final output should still be from a passing stage
    expect(result.overallQuality).toBeGreaterThanOrEqual(0.5);
  });

  it("@future(M-10) max retries reached returns failure result with best available", async () => {
    // Always return low quality to exhaust corrections
    const agent = new DevAgent(mockModels, mockExecutor, createMockAssessor(0.1), {
      maxCorrections: 2,
    });
    const result = await agent.run({ ...mockTask, id: "max-retry-test" });

    // Should have exhausted correction budget
    expect(result.correctionCount).toBeGreaterThan(0);
    // Overall quality reflects best available (still low)
    expect(result.overallQuality).toBeLessThan(0.5);
    // Pipeline should still produce stages (not crash)
    expect(result.stages.length).toBeGreaterThan(0);
  });

  it("@future(M-10) constitutional check fires and result includes compliance evaluation", async () => {
    const rule: ConstitutionalRule = {
      id: "rule-max-correction-iterations",
      name: "Correction Helix Bound",
      tier: 1,
      status: "active",
      expression: {
        target: "max_correction_iterations",
        constraint: "max",
        value: 3,
        priority: "mandatory",
      },
      governsPatterns: [],
      evidencedBy: [],
    };

    const agent = new DevAgent(mockModels, mockExecutor, createMockAssessor(0.8), {
      constitutionalRules: [rule],
    });
    const result = await agent.run({ ...mockTask, id: "constitution-test" });

    // Constitutional compliance should be populated
    expect(result.constitutionalCompliance).not.toBeNull();
    expect(result.constitutionalCompliance!.overallStatus).toBeDefined();
    expect(result.constitutionalCompliance!.ruleEvaluations).toBeDefined();
    expect(result.constitutionalCompliance!.ruleEvaluations.length).toBeGreaterThan(0);
  });

  it("@future(M-10) afterStage lifecycle hook is called for each stage", async () => {
    const hookCalls: string[] = [];
    const agent = new DevAgent(mockModels, mockExecutor, createMockAssessor(0.8), {
      afterStage: async (stage, _result, _task) => {
        hookCalls.push(stage);
      },
    });
    await agent.run({ ...mockTask, id: "hook-test" });

    // Should be called once per stage
    expect(hookCalls).toEqual(["scope", "execute", "review", "validate"]);
  });

  it("@future(M-10) afterPipeline lifecycle hook is called with full result", async () => {
    const hookSpy = vi.fn();
    const agent = new DevAgent(mockModels, mockExecutor, createMockAssessor(0.8), {
      afterPipeline: async (result, task) => {
        hookSpy(result.taskId, task.id, result.stages.length);
      },
    });
    await agent.run({ ...mockTask, id: "pipeline-hook-test" });

    expect(hookSpy).toHaveBeenCalledOnce();
    expect(hookSpy).toHaveBeenCalledWith("pipeline-hook-test", "pipeline-hook-test", 4);
  });

  it("@future(M-10) memory records decision and outcome for Thompson Sampling", async () => {
    const agent = new DevAgent(mockModels, mockExecutor, createMockAssessor(0.8));
    const result = await agent.run({ ...mockTask, id: "memory-test" });

    // Each stage should produce a Decision with an attached outcome
    expect(result.decisions.length).toBe(4); // one per stage
    for (const decision of result.decisions) {
      // Decision should reference the model used
      expect(decision.selected).toBe("mock-model-1");
      // Outcome should be attached
      expect(decision.outcome).toBeDefined();
      expect(decision.outcome!.success).toBe(true);
      expect(decision.outcome!.qualityScore).toBe(0.8);
      expect(decision.outcome!.durationMs).toBeGreaterThan(0);
    }

    // Memory store should have observations
    const memory = agent.getMemory();
    expect(memory.size).toBeGreaterThan(0);
  });
});
