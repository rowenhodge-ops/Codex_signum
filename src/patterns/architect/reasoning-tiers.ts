/**
 * Reasoning Tier Selection — maps ModelExecutorContext to a reasoning tier.
 *
 * Research integration (RTR framework):
 * - Deep: decomposition, multi-document analysis, novel problem-solving
 * - Moderate: coding, agentic tool-use, well-defined multi-step problems
 * - Light: data extraction, summarization, classification
 *
 * Consumers use this to configure their own model pools per tier.
 * Core provides the selection logic; consumers provide the model instances.
 */

import type { ModelExecutorContext } from "./types.js";

export type ReasoningTier = "deep" | "moderate" | "light";

/**
 * Map a ModelExecutorContext to a reasoning tier.
 * Planning tasks always get deep reasoning.
 * Coding tasks vary by complexity.
 * Unknown tasks default to moderate.
 */
export function selectReasoningTier(context?: ModelExecutorContext): ReasoningTier {
  if (!context) return "moderate";

  // Planning tasks (DECOMPOSE) always get deep reasoning
  if (context.taskType === "planning") return "deep";

  // Coding tasks vary by complexity
  if (context.taskType === "coding") {
    if (context.complexity === "complex") return "deep";
    if (context.complexity === "simple") return "light";
    return "moderate";
  }

  // Review tasks use moderate
  if (context.taskType === "review") return "moderate";

  // General/unknown: use quality requirement as tiebreaker
  if (context.qualityRequirement !== undefined) {
    if (context.qualityRequirement >= 0.8) return "deep";
    if (context.qualityRequirement <= 0.4) return "light";
  }

  return "moderate";
}
