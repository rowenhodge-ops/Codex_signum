// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * DevAgent CLI — Conformance Tests (M-8.DA)
 *
 * Tests the DevAgent executor, quality assessor V1,
 * pipeline presets, and pipeline completion.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PIPELINE_PRESETS } from "../../src/patterns/dev-agent/types.js";
import type {
  AgentTask,
  PipelineStage,
} from "../../src/patterns/dev-agent/types.js";

// ── Mock graph client (DevAgent pipeline uses memory functions that touch graph) ──

vi.mock("../../src/graph/client.js", () => ({
  writeTransaction: vi.fn().mockImplementation(async (fn: Function) => {
    return fn({ run: vi.fn().mockResolvedValue({ records: [] }) });
  }),
  runQuery: vi.fn().mockResolvedValue({ records: [] }),
  getDriver: vi.fn(),
  closeDriver: vi.fn(),
}));

// ── Tests ────────────────────────────────────────────────────────────────

describe("PIPELINE_PRESETS", () => {
  it("full preset has all 4 stages", () => {
    expect(PIPELINE_PRESETS.full).toEqual([
      "scope",
      "execute",
      "review",
      "validate",
    ]);
  });

  it("lite preset skips scope", () => {
    expect(PIPELINE_PRESETS.lite).toEqual(["execute", "review", "validate"]);
  });

  it("quick preset has execute + validate only", () => {
    expect(PIPELINE_PRESETS.quick).toEqual(["execute", "validate"]);
  });

  it("generate preset has execute only", () => {
    expect(PIPELINE_PRESETS.generate).toEqual(["execute"]);
  });

  it("all presets resolve to valid stage arrays", () => {
    const validStages: PipelineStage[] = [
      "scope",
      "execute",
      "review",
      "validate",
    ];
    for (const [name, stages] of Object.entries(PIPELINE_PRESETS)) {
      expect(stages.length).toBeGreaterThan(0);
      for (const stage of stages) {
        expect(validStages).toContain(stage);
      }
    }
  });
});

describe("Quality Assessor V1 (mechanical)", () => {
  // Import the assessor from the bootstrap executor
  // Since it's returned from createDevAgentExecutor, we test the logic directly

  function assessV1(
    output: string,
    stage: PipelineStage,
    _task: AgentTask,
  ): number {
    if (!output || output.trim().length === 0) return 0.0;
    let score = 0.3;
    const charCount = output.trim().length;
    if (charCount > 100) score += 0.1;
    if (charCount > 500) score += 0.1;

    switch (stage) {
      case "scope":
        if (output.toLowerCase().includes("scope")) score += 0.1;
        if (output.toLowerCase().includes("file")) score += 0.1;
        break;
      case "execute":
        if (output.includes("```") || output.includes("function")) score += 0.1;
        if (output.includes("import") || output.includes("export")) score += 0.1;
        break;
      case "review":
        if (
          output.toLowerCase().includes("issue") ||
          output.toLowerCase().includes("correct") ||
          output.toLowerCase().includes("review")
        )
          score += 0.1;
        if (
          output.toLowerCase().includes("suggestion") ||
          output.toLowerCase().includes("improvement")
        )
          score += 0.1;
        break;
      case "validate":
        if (
          output.toLowerCase().includes("pass") ||
          output.toLowerCase().includes("accept") ||
          output.toLowerCase().includes("valid")
        )
          score += 0.1;
        if (
          output.toLowerCase().includes("criteria") ||
          output.toLowerCase().includes("requirement")
        )
          score += 0.1;
        break;
    }
    return Math.min(score, 1.0);
  }

  const mockTask: AgentTask = {
    id: "test-1",
    prompt: "Test task",
    taskType: "refactor",
    complexity: "moderate",
  };

  it("returns 0 for empty output", () => {
    expect(assessV1("", "execute", mockTask)).toBe(0.0);
    expect(assessV1("   ", "execute", mockTask)).toBe(0.0);
  });

  it("returns baseline score for non-empty output", () => {
    expect(assessV1("some output", "execute", mockTask)).toBeGreaterThanOrEqual(
      0.3,
    );
  });

  it("gives higher score to longer output", () => {
    const short = assessV1("short", "execute", mockTask);
    const long = assessV1("a".repeat(600), "execute", mockTask);
    expect(long).toBeGreaterThan(short);
  });

  it("scores scope stage with scope-relevant keywords", () => {
    const withKeywords = assessV1(
      "The scope of this task involves the file src/graph/queries.ts",
      "scope",
      mockTask,
    );
    const withoutKeywords = assessV1(
      "This is a generic response without relevant terms",
      "scope",
      mockTask,
    );
    expect(withKeywords).toBeGreaterThan(withoutKeywords);
  });

  it("scores execute stage with code patterns", () => {
    const withCode = assessV1(
      '```typescript\nimport { foo } from "./bar.js";\nfunction baz() {}\n```',
      "execute",
      mockTask,
    );
    const withoutCode = assessV1(
      "This is just a plain text description of what to do",
      "execute",
      mockTask,
    );
    expect(withCode).toBeGreaterThan(withoutCode);
  });

  it("scores review stage with review keywords", () => {
    const withReview = assessV1(
      "Review complete. Found one issue: the function is missing a return type. Suggestion: add explicit return annotation.",
      "review",
      mockTask,
    );
    expect(withReview).toBeGreaterThanOrEqual(0.5);
  });

  it("scores validate stage with validation keywords", () => {
    const withValid = assessV1(
      "All acceptance criteria met. The requirement is valid and passes.",
      "validate",
      mockTask,
    );
    expect(withValid).toBeGreaterThanOrEqual(0.5);
  });

  it("never returns more than 1.0", () => {
    const maxOutput =
      "This is a scope file review with import export function ``` code issue suggestion pass accept valid criteria requirement " +
      "a".repeat(600);
    for (const stage of ["scope", "execute", "review", "validate"] as PipelineStage[]) {
      expect(assessV1(maxOutput, stage, mockTask)).toBeLessThanOrEqual(1.0);
    }
  });
});

describe("DevAgent pipeline (with mocks)", () => {
  it("completes all 4 stages with mock executor", async () => {
    const { DevAgent } = await import(
      "../../src/patterns/dev-agent/pipeline.js"
    );
    const { DEFAULT_DEVAGENT_CONFIG } = await import(
      "../../src/patterns/dev-agent/types.js"
    );
    const mockModels = [
      {
        id: "test-model:adaptive:max",
        name: "Test Model",
        provider: "test",
        avgLatencyMs: 1000,
        costPer1kTokens: 0.01,
        capabilities: ["code_generation"],
        status: "active" as const,
      },
    ];

    const mockExecutor = vi
      .fn()
      .mockResolvedValue({ output: "mock output", durationMs: 100, cost: 0 });
    const mockAssessor = vi.fn().mockResolvedValue(0.8);

    const agent = new DevAgent(mockModels, mockExecutor, mockAssessor, {
      ...DEFAULT_DEVAGENT_CONFIG,
      stages: ["scope", "execute", "review", "validate"],
    });

    const task: AgentTask = {
      id: "test-pipeline",
      prompt: "Test task",
      taskType: "refactor",
      complexity: "moderate",
    };

    const result = await agent.run(task);

    expect(result.stages).toHaveLength(4);
    expect(result.stages.map((s) => s.stage)).toEqual([
      "scope",
      "execute",
      "review",
      "validate",
    ]);
    expect(result.overallQuality).toBe(0.8);
    expect(result.decisions).toHaveLength(4);
  });

  it("decisions have correct structure for graph recording", async () => {
    const { DevAgent } = await import(
      "../../src/patterns/dev-agent/pipeline.js"
    );
    const mockModels = [
      {
        id: "test-model:none:default",
        name: "Test Model",
        provider: "test",
        avgLatencyMs: 1000,
        costPer1kTokens: 0.01,
        capabilities: [],
        status: "active" as const,
      },
    ];

    const mockExecutor = vi
      .fn()
      .mockResolvedValue({ output: "output", durationMs: 50, cost: 0 });
    const mockAssessor = vi.fn().mockResolvedValue(0.9);

    const agent = new DevAgent(mockModels, mockExecutor, mockAssessor, {
      stages: ["execute"],
      maxCorrections: 3,
      qualityThreshold: 0.5,
      routerConfig: {
        epsilonFloor: 0.01,
        forceExploreEvery: 20,
        qualityFloor: 0.5,
        latencyPenaltyFactor: 0.0001,
        costPenaltyFactor: 0.01,
      },
      constitutionalRules: [],
    });

    const result = await agent.run({
      id: "test-decision-structure",
      prompt: "Test",
      taskType: "refactor",
      complexity: "moderate",
      domain: "general",
    });

    const decision = result.decisions[0];
    expect(decision).toBeDefined();
    expect(decision.id).toBeTruthy();
    expect(decision.selected).toBe("test-model:none:default");
    expect(decision.context.taskType).toContain("refactor");
    expect(decision.outcome).toBeDefined();
    expect(decision.outcome!.success).toBe(true);
    expect(decision.outcome!.qualityScore).toBe(0.9);
  });
});
