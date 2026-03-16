# EXECUTE (claude-opus-4:extended:16k)

Quality: 0.70 | Duration: 92663ms

The solution involves modifying three existing files (`src/graph/queries.ts`, `scripts/bootstrap-task-executor.ts`, `scripts/bootstrap-devagent-executor.ts`) and adding a new test file (`tests/pipeline-output-seed.test.ts`).

The core idea is to introduce a new type of `Seed` node in the graph, `seedType: "pipeline-output"`, to represent the raw output of pipeline tasks or DevAgent stages. These Seeds are linked to their respective `PipelineRun` via a `CONTAINS` relationship, carrying an `order` property to preserve sequence. All graph write operations are made non-fatal, wrapped in `try/catch` blocks that log warnings on failure, ensuring that graph issues do not block the main pipeline execution flow.

---

### 1. `src/graph/queries.ts` (Modified)

This file will contain the new interface for pipeline output seeds and the two new graph utility functions.

```typescript
// src/graph/queries.ts

import { writeTransaction } from "./client"; // Assuming client.ts provides writeTransaction

/**
 * Properties for a pipeline-output Seed node.
 * This is distinct from SeedProps used for LLM model instances,
 * as it captures specific details of a pipeline task's output.
 */
export interface PipelineOutputSeedProps {
  id: string;
  name: string;
  seedType: "pipeline-output"; // Discriminator for this type of Seed
  content: string;
  qualityScore: number | null; // Nullable for when quality is not applicable or measured (e.g., failure)
  modelId: string | null; // Model that generated the output, null if not applicable (e.g., failure)
  charCount: number;
  durationMs: number;
  runId: string;
  taskId: string;
  order: number;
}

/**
 * Creates or updates a Seed node representing a pipeline output.
 * Uses MERGE to ensure idempotency. Properties are explicitly set
 * to handle `createdAt`/`updatedAt` and clear definition.
 *
 * @param props The properties of the pipeline output seed.
 * @returns A promise that resolves when the seed is created/updated.
 */
export async function createPipelineOutputSeed(
  props: PipelineOutputSeedProps
): Promise<void> {
  const query = `
    MERGE (s:Seed {id: $props.id})
    ON CREATE SET
        s.name = $props.name,
        s.seedType = $props.seedType,
        s.content = $props.content,
        s.qualityScore = $props.qualityScore,
        s.modelId = $props.modelId,
        s.charCount = $props.charCount,
        s.durationMs = $props.durationMs,
        s.runId = $props.runId,
        s.taskId = $props.taskId,
        s.order = $props.order,
        s.createdAt = datetime()
    ON MATCH SET
        s.name = $props.name,
        s.seedType = $props.seedType,
        s.content = $props.content,
        s.qualityScore = $props.qualityScore,
        s.modelId = $props.modelId,
        s.charCount = $props.charCount,
        s.durationMs = $props.durationMs,
        s.runId = $props.runId,
        s.taskId = $props.taskId,
        s.order = $props.order,
        s.updatedAt = datetime()
  `;
  await writeTransaction(query, { props });
}

/**
 * Creates a CONTAINS relationship from a PipelineRun node to a Seed node.
 * This relationship includes an 'order' property to preserve sequence.
 * The relationship itself is also idempotent via MERGE.
 *
 * @param seedId The ID of the Seed node.
 * @param runId The ID of the PipelineRun node.
 * @param order The 0-based order of the seed within the pipeline run.
 * @returns A promise that resolves when the relationship is created.
 */
export async function linkSeedToPipelineRun(
  seedId: string,
  runId: string,
  order: number
): Promise<void> {
  const query = `
    MATCH (pr:PipelineRun {id: $runId}), (s:Seed {id: $seedId})
    MERGE (pr)-[r:CONTAINS]->(s)
    ON CREATE SET r.order = $order, r.createdAt = datetime()
    ON MATCH SET r.order = $order, r.updatedAt = datetime()
  `;
  await writeTransaction(query, { seedId, runId, order });
}
```

---

### 2. `scripts/bootstrap-task-executor.ts` (Modified)

This file executes individual pipeline tasks. The changes will be inside the main task loop, after the task output is written to a file, to capture its details in the graph.

```typescript
// scripts/bootstrap-task-executor.ts (Illustrative changes within existing structure)

import { writeFileSync } from "fs";
import { join } from "path";
// ... other existing imports (e.g., for createPipelineRun, linkTaskOutputToStage, etc.)

// NEW IMPORTS:
import {
  createPipelineOutputSeed,
  linkSeedToPipelineRun,
  PipelineOutputSeedProps,
} from "../src/graph/queries";

// Assume these interfaces/types are already defined or mocked for context:
interface Task {
  task_id: string;
  title: string;
  modelId?: string; // modelId might be directly on Task config
}

interface Manifest {
  tasks: Task[];
  // ...
}

interface ExecutionResult {
  text: string;
  durationMs: number;
  modelId: string | null; // Model that generated the output
  cost: number;
  // ...
}

// Assume assessTaskQuality and failedQuality are defined elsewhere
declare const assessTaskQuality: (result: ExecutionResult) => Promise<number>;
declare const failedQuality: number; // typically 0

export async function bootstrapTaskExecutor(
  manifest: Manifest,
  // ... existing parameters
  outputPathRoot: string,
  currentRunId: string,
  // ... other context or dependencies
): Promise<void> {
  const manifestTasks: Task[] = manifest.tasks;

  // ... existing setup logic (e.g., createPipelineRun)

  for (let i = 0; i < manifestTasks.length; i++) { // `i` is the 0-based order
    const task = manifestTasks[i];
    // ... existing pre-task execution logic

    let executionResult: ExecutionResult | null = null;
    let taskQualityScore: number | null = null;

    try {
      // --- Existing code for task execution ---
      // Example: executionResult = await executeLLMTask(task, ...);
      // Example: taskQualityScore = await assessTaskQuality(executionResult);

      // (SIMULATED existing task execution for illustration)
      executionResult = {
        text: `This is the raw LLM output for task ${task.task_id}.`,
        durationMs: 123,
        modelId: task.modelId || "unknown-model",
        cost: 0.01,
      };
      taskQualityScore = await assessTaskQuality(executionResult); // Assume quality assessed

      const outputContent = `# ${task.title}\n\n${executionResult.text}`; // Full markdown content
      const taskOutputPath = join(outputPathRoot, `${task.task_id}.md`);

      // Existing: Write task output to markdown file
      writeFileSync(taskOutputPath, outputContent, "utf-8");
      console.log(`Output written to ${taskOutputPath}`);

      // --- NEW CODE START: Graph Seed creation (Success Path) ---
      try {
        const seedId = `${currentRunId}:${task.task_id}`;
        const seedProps: PipelineOutputSeedProps = {
          id: seedId,
          name: task.title,
          seedType: "pipeline-output",
          content: executionResult.text, // R3: raw LLM output text
          qualityScore: taskQualityScore,
          modelId: executionResult.modelId,
          charCount: executionResult.text.length,
          durationMs: executionResult.durationMs,
          runId: currentRunId,
          taskId: task.task_id,
          order: i, // R4: 0-based order from loop counter
        };
        await createPipelineOutputSeed(seedProps);
        await linkSeedToPipelineRun(seedId, currentRunId, seedProps.order);
        console.log(`[Graph] Seed created and linked for task ${task.task_id} (success).`);
      } catch (graphError) {
        // R6: Non-fatal graph write failure
        console.warn(
          `[WARN] Graph: Failed to create Seed or link to PipelineRun for task ${task.task_id} (success):`,
          (graphError as Error).message
        );
      }
      // --- NEW CODE END ---

      // ... existing post-success logic (e.g., linkTaskOutputToStage, update task status)

    } catch (error) {
      // --- Existing catch block (Failure Path) ---
      const errorMessage = (error as Error).message || "Unknown error";
      const errorContent = `## Task Failed: ${task.title}\n\n${errorMessage}`;
      const taskOutputPath = join(outputPathRoot, `${task.task_id}.md`);

      // Existing: Write failed task output to markdown file
      writeFileSync(taskOutputPath, errorContent, "utf-8");
      console.error(`Task ${task.task_id} failed:`, errorMessage);

      // --- NEW CODE START: Graph Seed creation (Failure Path) ---
      try {
        const seedId = `${currentRunId}:${task.task_id}`;
        const seedProps: PipelineOutputSeedProps = {
          id: seedId,
          name: task.title,
          seedType: "pipeline-output",
          content: errorMessage, // R3: Error message as content
          qualityScore: failedQuality, // R: Use predefined failedQuality (0)
          modelId: task.modelId || null, // Best available model ID from task config
          charCount: errorMessage.length,
          durationMs: 0, // Duration is 0 as execution failed
          runId: currentRunId,
          taskId: task.task_id,
          order: i, // R4: 0-based order
        };
        await createPipelineOutputSeed(seedProps);
        await linkSeedToPipelineRun(seedId, currentRunId, seedProps.order);
        console.log(`[Graph] Seed created and linked for task ${task.task_id} (failure).`);
      } catch (graphError) {
        // R6: Non-fatal graph write failure
        console.warn(
          `[WARN] Graph: Failed to create Seed or link to PipelineRun for failed task ${task.task_id}:`,
          (graphError as Error).message
        );
      }
      // --- NEW CODE END ---

      // ... existing post-failure logic (e.g., update task status to 'failed')
    }
  }
  // ... existing cleanup logic
}
```

---

### 3. `scripts/bootstrap-devagent-executor.ts` (Modified)

This file defines the DevAgent execution logic. The changes will involve modifying the `createDevAgentExecutor` factory to accept graph configuration and then integrating the seed creation within the returned executor function.

```typescript
// scripts/bootstrap-devagent-executor.ts (Illustrative changes within existing structure)

// ... existing imports

// NEW IMPORTS:
import {
  createPipelineOutputSeed,
  linkSeedToPipelineRun,
  PipelineOutputSeedProps,
} from "../src/graph/queries";

// Existing interfaces/types for DevAgent
interface DevAgentExecutorResult {
  output: string;
  durationMs: number;
  cost: number;
}

export interface DevAgentModelExecutor {
  (
    modelId: string,
    prompt: string,
    stage: string,
  ): Promise<DevAgentExecutorResult>;
}

// NEW: Interface for DevAgent-specific graph configuration
export interface DevAgentGraphConfig {
  runId: string;
  graphEnabled?: boolean; // Optional flag to enable/disable graph writes
}

/**
 * Factory function to create a DevAgent executor.
 * Modified to accept an optional graphConfig for pipeline output seed integration.
 *
 * @param callModelDirect The function used to call the LLM directly.
 * @param graphConfig Optional configuration for graph integration.
 * @returns An instance of DevAgentModelExecutor.
 */
export function createDevAgentExecutor(
  callModelDirect: (
    modelId: string,
    prompt: string
  ) => Promise<{ output: string; durationMs: number; cost: number; modelIdUsed: string }>, // Assuming callModelDirect returns modelIdUsed
  graphConfig?: DevAgentGraphConfig // R9: NEW OPTIONAL PARAMETER
): DevAgentModelExecutor {
  let orderCounter = 0; // R9: Closure-captured for auto-incrementing order within this run

  return async (
    modelId: string,
    prompt: string,
    stage: string,
  ): Promise<DevAgentExecutorResult> => {
    // ... existing pre-execution logic

    let output = "";
    let durationMs = 0;
    let cost = 0;
    let modelIdUsed = modelId; // Default to requested, updated if callModelDirect returns actual

    try {
      const result = await callModelDirect(modelId, prompt);
      output = result.output;
      durationMs = result.durationMs;
      cost = result.cost;
      modelIdUsed = result.modelIdUsed; // Capture the actual model used
    } catch (error) {
      console.error(`DevAgent executor failed for stage ${stage}:`, error);
      // Existing behavior: re-throw or handle failure.
      throw error;
    }

    // --- NEW CODE START: Graph Seed creation (DevAgent Success Path) ---
    // R9: Only proceed if graphConfig is provided and enabled
    if (graphConfig?.graphEnabled && graphConfig.runId) {
      try {
        const currentOrder = orderCounter++; // Get current order, then increment for the next call
        const seedId = `${graphConfig.runId}:${stage}:${currentOrder}`; // R1: Unique ID for DevAgent outputs
        const seedProps: PipelineOutputSeedProps = {
          id: seedId,
          name: `DevAgent ${stage} output`, // R9: Name derived from stage
          seedType: "pipeline-output",
          content: output, // R3: raw LLM output text from DevAgent
          qualityScore: 1.0, // Rationale: Assuming DevAgent successful output implies good quality
          modelId: modelIdUsed,
          charCount: output.length,
          durationMs: durationMs,
          runId: graphConfig.runId,
          taskId: stage, // R9: Task ID is the stage name
          order: currentOrder, // R9: Closure-captured order
        };
        await createPipelineOutputSeed(seedProps);
        await linkSeedToPipelineRun(seedId, graphConfig.runId, seedProps.order);
        console.log(`[Graph] Seed created and linked for DevAgent stage ${stage}.`);
      } catch (graphError) {
        // R6: Non-fatal graph write failure
        console.warn(
          `[WARN] Graph: Failed to create DevAgent Seed or link to PipelineRun for stage ${stage}:`,
          (graphError as Error).message
        );
      }
    }
    // --- NEW CODE END ---

    return { output, durationMs, cost }; // Existing return
  };
}
```

---

### 4. `tests/pipeline-output-seed.test.ts` (New File)

This new test file will verify the correct behavior of seed creation, relationship linking, and non-fatal error handling for both `bootstrapTaskExecutor` and `createDevAgentExecutor`.

```typescript
// tests/pipeline-output-seed.test.ts

import { jest } from '@jest/globals';
import { join } from 'path';

// Mock the graph query functions and file system writes
jest.mock("../src/graph/queries", () => ({
  createPipelineOutputSeed: jest.fn(),
  linkSeedToPipelineRun: jest.fn(),
}));
jest.mock("fs", () => ({
  writeFileSync: jest.fn(),
}));

// Mock console.warn for failure isolation tests
const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

// Import the actual functions to be tested (or their mocked wrappers if needed)
import { bootstrapTaskExecutor } from "../scripts/bootstrap-task-executor";
import { createDevAgentExecutor, DevAgentGraphConfig, DevAgentModelExecutor } from "../scripts/bootstrap-devagent-executor";
import { PipelineOutputSeedProps } from '../src/graph/queries';

// Cast mocked functions for type safety in tests
const mockCreatePipelineOutputSeed = jest.mocked<typeof import("../src/graph/queries").createPipelineOutputSeed>(require("../src/graph/queries").createPipelineOutputSeed);
const mockLinkSeedToPipelineRun = jest.mocked<typeof import("../src/graph/queries").linkSeedToPipelineRun>(require("../src/graph/queries").linkSeedToPipelineRun);
const mockWriteFileSync = jest.mocked<typeof import("fs").writeFileSync>(require("fs").writeFileSync);


describe("Pipeline Output Seed Integration", () => {
  const mockRunId = "test-run-456";
  const mockOutputPathRoot = "/tmp/test-output";

  beforeEach(() => {
    jest.clearAllMocks(); // Clears all mock call counts and return values
    consoleWarnSpy.mockClear(); // Clear console.warn spy
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore(); // Restore original console.warn
  });

  // --- Mocking internals of bootstrapTaskExecutor for testing graph calls ---
  // This helper mimics the relevant logic within bootstrapTaskExecutor without
  // fully re-implementing its entire execution flow. It focuses on the points
  // where graph functions are called.
  interface MockTask { task_id: string; title: string; modelId?: string; }
  interface MockExecutionResult { text: string; durationMs: number; modelId: string | null; cost: number; }
  const mockBootstrapTaskExecutorCore = async (
    tasks: MockTask[],
    runId: string,
    outputPath: string,
    taskExecutionFn: (task: MockTask) => Promise<MockExecutionResult | never>, // Can resolve or throw
    assessQualityFn: (result: MockExecutionResult) => number = () => 0.9,
    failedQualityValue: number = 0
  ) => {
    // This part simulates the loop and error handling structure
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      let executionResult: MockExecutionResult | null = null;
      let qualityScore: number | null = null;
      let caughtError: Error | null = null;

      try {
        executionResult = await taskExecutionFn(task);
        qualityScore = assessQualityFn(executionResult);

        // Simulate file write for success path
        const outputContent = `# ${task.title}\n\n${executionResult.text}`;
        mockWriteFileSync(join(outputPath, `${task.task_id}.md`), outputContent, "utf-8");

        // --- Actual integration point for success path ---
        try {
          const seedId = `${runId}:${task.task_id}`;
          const seedProps: PipelineOutputSeedProps = {
            id: seedId, name: task.title, seedType: "pipeline-output",
            content: executionResult.text, qualityScore: qualityScore,
            modelId: executionResult.modelId, charCount: executionResult.text.length,
            durationMs: executionResult.durationMs, runId: runId, taskId: task.task_id, order: i,
          };
          await mockCreatePipelineOutputSeed(seedProps);
          await mockLinkSeedToPipelineRun(seedId, runId, seedProps.order);
        } catch (graphError) {
          console.warn(`[WARN] Graph: Failed to create Seed or link... (mock):`, (graphError as Error).message);
        }

      } catch (error: any) {
        caughtError = error;
        // Simulate file write for failure path
        const errorMessage = caughtError.message || "Unknown error";
        const errorContent = `## Task Failed: ${task.title}\n\n${errorMessage}`;
        mockWriteFileSync(join(outputPath, `${task.task_id}.md`), errorContent, "utf-8");

        // --- Actual integration point for failure path ---
        try {
          const seedId = `${runId}:${task.task_id}`;
          const seedProps: PipelineOutputSeedProps = {
            id: seedId, name: task.title, seedType: "pipeline-output",
            content: errorMessage, qualityScore: failedQualityValue,
            modelId: task.modelId || null, charCount: errorMessage.length,
            durationMs: 0, runId: runId, taskId: task.task_id, order: i,
          };
          await mockCreatePipelineOutputSeed(seedProps);
          await mockLinkSeedToPipelineRun(seedId, runId, seedProps.order);
        } catch (graphError) {
          console.warn(`[WARN] Graph: Failed to create Seed or link... (mock):`, (graphError as Error).message);
        }
      }
    }
  };

  describe("bootstrapTaskExecutor integration", () => {
    const mockTasks: MockTask[] = [
      { task_id: "task-001", title: "First Task Title", modelId: "gpt-4" },
      { task_id: "task-002", title: "Second Task Title", modelId: "claude-3-opus" },
    ];
    const mockSuccessResult = (task: MockTask): MockExecutionResult => ({
      text: `Mock output for ${task.title}.`, durationMs: 250, modelId: task.modelId!, cost: 0.005
    });
    const mockFailedQuality = 0; // As per requirement

    test("R1, R2, R3, R4, R5: Seed created with correct properties and CONTAINS relationship (success path)", async () => {
      const task = mockTasks[0];
      const result = mockSuccessResult(task);
      const expectedQuality = 0.9;

      await mockBootstrapTaskExecutorCore(
        [task], mockRunId, mockOutputPathRoot, async () => result, () => expectedQuality
      );

      expect(mockCreatePipelineOutputSeed).toHaveBeenCalledTimes(1);
      expect(mockCreatePipelineOutputSeed).toHaveBeenCalledWith({
        id: `${mockRunId}:${task.task_id}`,
        name: task.title,
        seedType: "pipeline-output",
        content: result.text,
        qualityScore: expectedQuality,
        modelId: result.modelId,
        charCount: result.text.length,
        durationMs: result.durationMs,
        runId: mockRunId,
        taskId: task.task_id,
        order: 0,
      } as PipelineOutputSeedProps); // Cast for type check

      expect(mockLinkSeedToPipelineRun).toHaveBeenCalledTimes(1);
      expect(mockLinkSeedToPipelineRun).toHaveBeenCalledWith(
        `${mockRunId}:${task.task_id}`, mockRunId, 0
      );
    });

    test("R1, R2, R3, R4, R5: Seed created with correct properties and CONTAINS relationship (failure path)", async () => {
      const task = mockTasks[1];
      const errorMessage = `Task execution failed for ${task.title}.`;

      await mockBootstrapTaskExecutorCore(
        [task], mockRunId, mockOutputPathRoot, async () => { throw new Error(errorMessage); }, undefined, mockFailedQuality
      );

      expect(mockCreatePipelineOutputSeed).toHaveBeenCalledTimes(1);
      expect(mockCreatePipelineOutputSeed).toHaveBeenCalledWith({
        id: `${mockRunId}:${task.task_id}`,
        name: task.title,
        seedType: "pipeline-output",
        content: errorMessage, // Content is error message on failure
        qualityScore: mockFailedQuality, // Quality score for failure
        modelId: task.modelId,
        charCount: errorMessage.length,
        durationMs: 0, // Duration is 0 on failure
        runId: mockRunId,
        taskId: task.task_id,
        order: 0,
      } as PipelineOutputSeedProps);

      expect(mockLinkSeedToPipelineRun).toHaveBeenCalledTimes(1);
      expect(mockLinkSeedToPipelineRun).toHaveBeenCalledWith(
        `${mockRunId}:${task.task_id}`, mockRunId, 0
      );
    });

    test("R6, R7: Graph write failure does not prevent pipeline execution (success path)", async () => {
      mockCreatePipelineOutputSeed.mockImplementationOnce(() => {
        throw new Error("Mock graph write failure (create)");
      });

      const task = mockTasks[0];
      const result = mockSuccessResult(task);

      // The key is that mockBootstrapTaskExecutorCore does not throw here
      await expect(
        mockBootstrapTaskExecutorCore([task], mockRunId, mockOutputPathRoot, async () => result)
      ).resolves.not.toThrow();

      expect(mockCreatePipelineOutputSeed).toHaveBeenCalledTimes(1);
      expect(mockLinkSeedToPipelineRun).toHaveBeenCalledTimes(0); // Link not called if create fails
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[WARN] Graph: Failed to create Seed or link... (mock):`),
        expect.stringContaining("Mock graph write failure (create)")
      );
      // Verify other crucial operations still happened (e.g., markdown write)
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(mockOutputPathRoot, `${task.task_id}.md`),
        expect.stringContaining(result.text),
        "utf-8"
      );
    });

    test("R6, R7: Graph write failure does not prevent pipeline execution (failure path)", async () => {
      mockCreatePipelineOutputSeed.mockImplementationOnce(() => {
        throw new Error("Mock graph write failure (create) in failure path");
      });

      const task = mockTasks[1];
      const errorMessage = `Task execution failed for ${task.title}.`;

      await expect(
        mockBootstrapTaskExecutorCore([task], mockRunId, mockOutputPathRoot, async () => { throw new Error(errorMessage); })
      ).resolves.not.toThrow();

      expect(mockCreatePipelineOutputSeed).toHaveBeenCalledTimes(1);
      expect(mockLinkSeedToPipelineRun).toHaveBeenCalledTimes(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[WARN] Graph: Failed to create Seed or link... (mock):`),
        expect.stringContaining("Mock graph write failure (create) in failure path")
      );
      // Verify other crucial operations still happened (e.g., failed markdown write)
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(mockOutputPathRoot, `${task.task_id}.md`),
        expect.stringContaining(errorMessage),
        "utf-8"
      );
    });
  });

  describe("createDevAgentExecutor integration", () => {
    const mockCallModelDirect = jest.fn();
    const mockStage1 = "planning";
    const mockStage2 = "execution";
    const mockModelId = "gpt-4o";
    const mockPrompt1 = "Generate plan.";
    const mockOutput1 = "DevAgent plan output.";
    const mockOutput2 = "DevAgent execution output.";
    const mockDuration1 = 150;
    const mockDuration2 = 300;
    const mockCost1 = 0.03;
    const mockCost2 = 0.05;

    beforeEach(() => {
      mockCallModelDirect.mockClear();
    });

    test("R9: DevAgent Seed created with correct properties, CONTAINS relationship, and incremental order", async () => {
      mockCallModelDirect
        .mockResolvedValueOnce({
          output: mockOutput1, durationMs: mockDuration1, cost: mockCost1, modelIdUsed: mockModelId,
        })
        .mockResolvedValueOnce({
          output: mockOutput2, durationMs: mockDuration2, cost: mockCost2, modelIdUsed: mockModelId,
        });

      const graphConfig: DevAgentGraphConfig = { runId: mockRunId, graphEnabled: true };
      const devAgentExecutor = createDevAgentExecutor(mockCallModelDirect, graphConfig);

      // First call
      await devAgentExecutor(mockModelId, mockPrompt1, mockStage1);

      expect(mockCallModelDirect).toHaveBeenCalledTimes(1);
      expect(mockCreatePipelineOutputSeed).toHaveBeenCalledTimes(1);
      expect(mockCreatePipelineOutputSeed).toHaveBeenCalledWith({
        id: `${mockRunId}:${mockStage1}:0`, // stage + order
        name: `DevAgent ${mockStage1} output`,
        seedType: "pipeline-output",
        content: mockOutput1,
        qualityScore: 1.0,
        modelId: mockModelId,
        charCount: mockOutput1.length,
        durationMs: mockDuration1,
        runId: mockRunId,
        taskId: mockStage1,
        order: 0,
      } as PipelineOutputSeedProps);
      expect(mockLinkSeedToPipelineRun).toHaveBeenCalledTimes(1);
      expect(mockLinkSeedToPipelineRun).toHaveBeenCalledWith(
        `${mockRunId}:${mockStage1}:0`, mockRunId, 0
      );

      // Second call, verifying order increment
      await devAgentExecutor(mockModelId, "Execute task.", mockStage2);

      expect(mockCallModelDirect).toHaveBeenCalledTimes(2);
      expect(mockCreatePipelineOutputSeed).toHaveBeenCalledTimes(2);
      expect(mockCreatePipelineOutputSeed).toHaveBeenNthCalledWith(2, {
        id: `${mockRunId}:${mockStage2}:1`, // Incremented order
        name: `DevAgent ${mockStage2} output`,
        seedType: "pipeline-output",
        content: mockOutput2,
        qualityScore: 1.0,
        modelId: mockModelId,
        charCount: mockOutput2.length,
        durationMs: mockDuration2,
        runId: mockRunId,
        taskId: mockStage2,
        order: 1, // Order is 1
      } as PipelineOutputSeedProps);
      expect(mockLinkSeedToPipelineRun).toHaveBeenCalledTimes(2);
      expect(mockLinkSeedToPipelineRun).toHaveBeenNthCalledWith(2,
        `${mockRunId}:${mockStage2}:1`, mockRunId, 1
      );
    });

    test("DevAgent: graph write failure does not prevent executor from returning", async () => {
      mockCreatePipelineOutputSeed.mockImplementationOnce(() => {
        throw new Error("DevAgent mock graph write failure");
      });
      mockCallModelDirect.mockResolvedValueOnce({
        output: mockOutput1, durationMs: mockDuration1, cost: mockCost1, modelIdUsed: mockModelId,
      });

      const devAgentExecutor = createDevAgentExecutor(mockCallModelDirect, {
        runId: mockRunId,
        graphEnabled: true,
      });

      // The executor itself should not throw the graph error, but return its result
      await expect(devAgentExecutor(mockModelId, mockPrompt1, mockStage1)).resolves.toEqual({
        output: mockOutput1,
        durationMs: mockDuration1,
        cost: mockCost1,
      });

      expect(mockCreatePipelineOutputSeed).toHaveBeenCalledTimes(1);
      expect(mockLinkSeedToPipelineRun).toHaveBeenCalledTimes(0); // Link not called if create fails
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[WARN] Graph: Failed to create DevAgent Seed or link to PipelineRun for stage ${mockStage1}`),
        expect.stringContaining("DevAgent mock graph write failure")
      );
    });

    test("DevAgent: no graph config or graphEnabled false disables graph writes", async () => {
      mockCallModelDirect.mockResolvedValue({
        output: mockOutput1, durationMs: mockDuration1, cost: mockCost1, modelIdUsed: mockModelId,
      });

      // Test case 1: No graphConfig provided
      const devAgentExecutorNoConfig = createDevAgentExecutor(mockCallModelDirect);
      await devAgentExecutorNoConfig(mockModelId, mockPrompt1, mockStage1);
      expect(mockCreatePipelineOutputSeed).not.toHaveBeenCalled();
      expect(mockLinkSeedToPipelineRun).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      jest.clearAllMocks(); // Reset mocks for next test case

      // Test case 2: graphEnabled explicitly false
      const devAgentExecutorDisabled = createDevAgentExecutor(mockCallModelDirect, {
        runId: mockRunId,
        graphEnabled: false,
      });
      await devAgentExecutorDisabled(mockModelId, mockPrompt1, mockStage1);
      expect(mockCreatePipelineOutputSeed).not.toHaveBeenCalled();
      expect(mockLinkSeedToPipelineRun).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
```