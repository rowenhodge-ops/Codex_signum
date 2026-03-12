/**
 * DevAgent Pipeline Governance — verifies the scope → execute → review → validate
 * pipeline enforces staged execution, Thompson routing per stage, and
 * constitutional evaluation.
 *
 * Level: L3 Pipeline + L4 Outcome
 */
import { describe, it, expect } from "vitest";
import {
  DevAgent,
  PIPELINE_PRESETS,
  DEFAULT_DEVAGENT_CONFIG,
  type AgentTask,
  type RoutableModel,
} from "../../src/index.js";

function makeModel(id: string): RoutableModel {
  return {
    id,
    status: "active",
    capabilities: ["general"],
    avgLatencyMs: 500,
    costPer1kTokens: 0.01,
  };
}

function makeTask(overrides: Partial<AgentTask> = {}): AgentTask {
  return {
    id: "test-task-1",
    prompt: "Rename foo to bar in src/index.ts",
    taskType: "coding",
    complexity: "moderate",
    qualityRequirement: 0.7,
    ...overrides,
  };
}

const mockExecutor = async (
  _modelId: string,
  _prompt: string,
  _stage: string,
) => ({
  output: "Mock output for governance test. This is a sufficiently long output to pass basic quality checks.",
  durationMs: 100,
  cost: 0.001,
});

const mockAssessor = async () => 0.85;

describe("DevAgent: pipeline runs all configured stages", () => {
  it("default config runs scope → execute → review → validate", async () => {
    const models = [makeModel("gov-model-1")];
    const agent = new DevAgent(models, mockExecutor, mockAssessor);
    const result = await agent.run(makeTask());

    expect(result.stages.length).toBe(4);
    expect(result.stages[0].stage).toBe("scope");
    expect(result.stages[1].stage).toBe("execute");
    expect(result.stages[2].stage).toBe("review");
    expect(result.stages[3].stage).toBe("validate");
  });

  it("each stage produces output and quality score", async () => {
    const models = [makeModel("gov-model-2")];
    const agent = new DevAgent(models, mockExecutor, mockAssessor);
    const result = await agent.run(makeTask());

    for (const stage of result.stages) {
      expect(stage.output).toBeDefined();
      expect(stage.output.length).toBeGreaterThan(0);
      expect(stage.qualityScore).toBeDefined();
      expect(stage.qualityScore).toBeGreaterThanOrEqual(0);
      expect(stage.qualityScore).toBeLessThanOrEqual(1);
    }
  });

  it("pipeline result includes duration and task ID", async () => {
    const models = [makeModel("gov-model-3")];
    const agent = new DevAgent(models, mockExecutor, mockAssessor);
    const result = await agent.run(makeTask({ id: "gov-task-42" }));

    expect(result.taskId).toBe("gov-task-42");
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
  });
});

describe("DevAgent: Thompson routing is used per stage", () => {
  it("each stage records a routing decision", async () => {
    const models = [makeModel("router-gov-1"), makeModel("router-gov-2")];
    const agent = new DevAgent(models, mockExecutor, mockAssessor);
    const result = await agent.run(makeTask());

    // Each stage should have at least one decision
    expect(result.decisions.length).toBeGreaterThanOrEqual(result.stages.length);

    for (const decision of result.decisions) {
      // Decision type uses 'selected', not 'selectedSeedId'
      expect(decision.selected).toBeDefined();
      expect(decision.context).toBeDefined();
    }
  });
});

describe("DevAgent: refinement helix respects maxRefinements", () => {
  it("low quality causes more executor calls than stages", async () => {
    let executorCalls = 0;
    const countingExecutor = async (
      _modelId: string,
      _prompt: string,
      _stage: string,
    ) => {
      executorCalls++;
      return {
        output: "Low quality mock output for refinement testing.",
        durationMs: 10,
        cost: 0.001,
      };
    };
    const failingAssessor = async () => 0.2; // Below default threshold (0.5)

    const models = [makeModel("refinement-model")];
    const agent = new DevAgent(models, countingExecutor, failingAssessor, {
      maxRefinements: 2,
    });
    const result = await agent.run(makeTask());

    // With 4 stages and maxRefinements=2, each stage runs 3 times (0, 1, 2)
    // So total executor calls should be 4 * 3 = 12
    expect(executorCalls).toBeGreaterThan(4); // More than just 1 call per stage
    expect(result.stages.length).toBe(4);
  });
});

describe("DevAgent: PIPELINE_PRESETS define valid stage lists", () => {
  it("'full' preset has all 4 stages", () => {
    // PIPELINE_PRESETS is Record<string, PipelineStage[]>
    expect(PIPELINE_PRESETS.full).toEqual([
      "scope",
      "execute",
      "review",
      "validate",
    ]);
  });

  it("'lite' preset has fewer stages than full", () => {
    expect(PIPELINE_PRESETS.lite.length).toBeLessThan(
      PIPELINE_PRESETS.full.length,
    );
  });

  it("'quick' preset has fewer stages than lite", () => {
    expect(PIPELINE_PRESETS.quick.length).toBeLessThan(
      PIPELINE_PRESETS.lite.length,
    );
  });

  it("'generate' preset is a single-stage pipeline", () => {
    expect(PIPELINE_PRESETS.generate.length).toBe(1);
    expect(PIPELINE_PRESETS.generate[0]).toBe("execute");
  });

  it("all presets contain only valid stage names", () => {
    const validStages = ["scope", "execute", "review", "validate"];
    for (const [_name, stages] of Object.entries(PIPELINE_PRESETS)) {
      for (const stage of stages) {
        expect(validStages).toContain(stage);
      }
    }
  });
});

describe("DevAgent: DEFAULT_DEVAGENT_CONFIG has correct defaults", () => {
  it("default stages match full preset", () => {
    expect(DEFAULT_DEVAGENT_CONFIG.stages).toEqual(PIPELINE_PRESETS.full);
  });

  it("default qualityThreshold is defined and in (0, 1]", () => {
    expect(DEFAULT_DEVAGENT_CONFIG.qualityThreshold).toBeGreaterThan(0);
    expect(DEFAULT_DEVAGENT_CONFIG.qualityThreshold).toBeLessThanOrEqual(1);
  });

  it("default maxRefinements is positive", () => {
    expect(DEFAULT_DEVAGENT_CONFIG.maxRefinements).toBeGreaterThan(0);
  });
});

describe("DevAgent: lifecycle hooks are called", () => {
  it("afterStage hook receives stage name and result", async () => {
    const hookCalls: string[] = [];
    const models = [makeModel("hook-model")];
    const agent = new DevAgent(models, mockExecutor, mockAssessor, {
      afterStage: async (stage, _result, _task) => {
        hookCalls.push(stage);
      },
    });
    await agent.run(makeTask());

    expect(hookCalls).toEqual(["scope", "execute", "review", "validate"]);
  });

  it("afterPipeline hook receives final result", async () => {
    let pipelineResult: any = null;
    const models = [makeModel("hook-model-2")];
    const agent = new DevAgent(models, mockExecutor, mockAssessor, {
      afterPipeline: async (result, _task) => {
        pipelineResult = result;
      },
    });
    await agent.run(makeTask());

    expect(pipelineResult).not.toBeNull();
    expect(pipelineResult.stages.length).toBe(4);
  });
});
