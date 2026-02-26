/**
 * Mock ModelExecutor — returns pre-built TaskGraph JSON for testing.
 * Enables full pipeline execution without API keys.
 *
 * The response format matches what core's decompose() parseTaskGraph() expects:
 * - tasks array with task_id, title, description, phase (minimum required)
 * - phases array with phase_id, title, tasks
 * - dependencies array
 * - estimated_total_effort string
 * - assumptions array
 */

import type {
  ModelExecutor,
  ModelExecutorContext,
  ModelExecutorResult,
} from "./types.js";

export interface MockModelExecutorOptions {
  /** Number of tasks to generate (default: 3) */
  taskCount?: number;
  /** Whether to simulate LLM failure (default: false) */
  simulateFailure?: boolean;
  /** Artificial latency in ms (default: 50) */
  latencyMs?: number;
  /** Custom response text (overrides auto-generation) */
  customResponse?: string;
}

export function createMockModelExecutor(
  options: MockModelExecutorOptions = {},
): ModelExecutor {
  const {
    taskCount = 3,
    simulateFailure = false,
    latencyMs = 50,
    customResponse,
  } = options;

  return {
    async execute(
      prompt: string,
      _context?: ModelExecutorContext,
    ): Promise<ModelExecutorResult> {
      await new Promise((r) => setTimeout(r, latencyMs));

      if (simulateFailure) {
        throw new Error("Mock LLM failure: simulated API error");
      }

      const text = customResponse ?? generateTaskGraphJson(taskCount, prompt);

      return {
        text,
        modelId: "mock-model-v1",
        durationMs: latencyMs,
        wasExploratory: false,
      };
    },
  };
}

function generateTaskGraphJson(count: number, prompt: string): string {
  const tasks = Array.from({ length: count }, (_, i) => ({
    task_id: `task_${i + 1}`,
    title: `Task ${i + 1}: ${i === 0 ? "Setup" : i === count - 1 ? "Verify" : `Implement step ${i}`}`,
    description: `Auto-generated task ${i + 1} for intent: ${prompt.slice(0, 80)}`,
    acceptance_criteria: [
      `Task ${i + 1} completes successfully`,
      "tsc --noEmit passes",
    ],
    type: i === 0 ? "mechanical" : "generative",
    phase: "phase_1",
    estimated_complexity: i === 0 ? "trivial" : "medium",
    files_affected: [`src/placeholder-${i + 1}.ts`],
    specification_refs: [],
    verification: "npx tsc --noEmit",
    commit_message: `feat: task ${i + 1} complete`,
  }));

  const dependencies = tasks.slice(1).map((t, i) => ({
    from: tasks[i].task_id,
    to: t.task_id,
    type: "hard",
  }));

  const graph = {
    tasks,
    dependencies,
    phases: [
      {
        phase_id: "phase_1",
        title: "Implementation",
        description: "Main implementation phase",
        tasks: tasks.map((t) => t.task_id),
        gate: "human",
        gate_criteria: "All tasks pass verification",
      },
    ],
    estimated_total_effort:
      count <= 2 ? "small" : count <= 5 ? "medium" : "large",
    assumptions: ["Mock executor — no real file modifications"],
  };

  return JSON.stringify(graph, null, 2);
}
