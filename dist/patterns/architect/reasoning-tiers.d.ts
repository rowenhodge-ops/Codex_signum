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
export declare function selectReasoningTier(context?: ModelExecutorContext): ReasoningTier;
//# sourceMappingURL=reasoning-tiers.d.ts.map