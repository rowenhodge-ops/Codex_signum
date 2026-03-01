// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Bootstrap DevAgent Executor — calls LLMs directly for self-hosting.
 * Implements DevAgentModelExecutor and QualityAssessor (V1 mechanical).
 *
 * Reuses provider call infrastructure from bootstrap-executor.ts.
 *
 * NOT part of the npm package. Dev tooling only.
 */

import type { SeedProps } from "../src/graph/queries.js";
import type {
  DevAgentModelExecutor,
  QualityAssessor,
  PipelineStage,
  AgentTask,
} from "../src/patterns/dev-agent/types.js";
import {
  callModelDirect,
  classifyProvider,
  getAvailableProviders,
} from "./bootstrap-executor.js";

/**
 * Create a DevAgent model executor using raw fetch().
 * The executor calls models directly by ID — DevAgent's own Thompson
 * routing selects the model, this executor just invokes it.
 */
export function createDevAgentExecutor(
  arms: SeedProps[],
  vertexAvailable: boolean = false,
): { executor: DevAgentModelExecutor; assessor: QualityAssessor } {
  // Build lookup from model ID → SeedProps for provider dispatch
  const armMap = new Map<string, SeedProps>();
  for (const arm of arms) {
    armMap.set(arm.id, arm);
  }

  const availableProviders = getAvailableProviders(vertexAvailable);

  const executor: DevAgentModelExecutor = async (
    modelId: string,
    prompt: string,
    stage: PipelineStage,
  ) => {
    const arm = armMap.get(modelId);
    if (!arm) {
      throw new Error(
        `Model ${modelId} not found in configured arms. Available: ${[...armMap.keys()].join(", ")}`,
      );
    }

    const providerClass = classifyProvider(arm.provider);
    if (!availableProviders.has(providerClass)) {
      throw new Error(
        `No API key for provider ${providerClass} (model: ${modelId}). Available providers: ${[...availableProviders].join(", ")}`,
      );
    }

    console.log(
      `  [DevAgent:${stage}] Calling ${modelId} (${arm.provider} → ${providerClass})`,
    );

    const result = await callModelDirect(
      {
        provider: arm.provider,
        apiModelString: arm.model,
        thinkingMode: arm.thinkingMode,
        thinkingParameter: arm.thinkingParameter,
      },
      prompt,
      vertexAvailable,
    );

    return {
      output: result.text,
      durationMs: result.durationMs,
      cost: 0, // Cost tracking is future work
    };
  };

  const assessor: QualityAssessor = async (
    output: string,
    stage: PipelineStage,
    task: AgentTask,
  ): Promise<number> => {
    // V1 Mechanical quality assessment (no LLM-as-judge)
    // Avoids LLM-evaluating-LLM circularity for coding tasks.
    // Human feedback via feedback.ts provides calibration signal.

    if (!output || output.trim().length === 0) return 0.0;

    let score = 0.3; // Baseline: non-empty output

    // Length check — very short outputs are suspect
    const charCount = output.trim().length;
    if (charCount > 100) score += 0.1;
    if (charCount > 500) score += 0.1;

    // Stage-specific heuristics
    switch (stage) {
      case "scope":
        // Scope should reference the task
        if (output.toLowerCase().includes("scope")) score += 0.1;
        if (output.toLowerCase().includes("file")) score += 0.1;
        break;

      case "execute":
        // Execute should contain code-like patterns
        if (output.includes("```") || output.includes("function")) score += 0.1;
        if (output.includes("import") || output.includes("export")) score += 0.1;
        break;

      case "review":
        // Review should identify issues or confirm quality
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
        // Validate should reference acceptance criteria
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
  };

  return { executor, assessor };
}
