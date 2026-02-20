import type { ConstitutionalEvaluation } from "../../constitutional/engine.js";
import type { ArmStats } from "../../graph/queries.js";
import type { ConstitutionalRule } from "../../types/constitutional.js";
import type { Decision } from "../../types/memory.js";
import type {
  RoutableModel,
  ThompsonRouterConfig,
} from "../thompson-router/index.js";
import { DEFAULT_ROUTER_CONFIG } from "../thompson-router/index.js";

/** Pipeline stage names */
export type PipelineStage = "scope" | "execute" | "review" | "validate";

/** Task submitted to the DevAgent */
export interface AgentTask {
  id: string;
  prompt: string;
  taskType: string;
  complexity: "trivial" | "moderate" | "complex" | "critical";
  domain?: string;
  qualityRequirement?: number;
  latencyBudgetMs?: number;
  costCeiling?: number;
}

/** Result from a single pipeline stage */
export interface StageResult {
  stage: PipelineStage;
  modelId: string;
  output: string;
  qualityScore: number;
  durationMs: number;
  wasExploratory: boolean;
  correctionIteration: number;
}

/** Complete pipeline result */
export interface PipelineResult {
  taskId: string;
  stages: StageResult[];
  finalOutput: string;
  totalDurationMs: number;
  totalCost: number;
  overallQuality: number;
  correctionCount: number;
  constitutionalCompliance: ConstitutionalEvaluation | null;
  decisions: Decision[];
}

/** Model executor — the actual model invocation function */
export type ModelExecutor = (
  modelId: string,
  prompt: string,
  stage: PipelineStage,
) => Promise<{ output: string; durationMs: number; cost: number }>;

/** Quality assessor — evaluates output quality */
export type QualityAssessor = (
  output: string,
  stage: PipelineStage,
  task: AgentTask,
) => Promise<number>;

/** DevAgent configuration */
export interface DevAgentConfig {
  stages: PipelineStage[];
  maxCorrections: number;
  qualityThreshold: number;
  routerConfig: ThompsonRouterConfig;
  constitutionalRules: ConstitutionalRule[];
}

/** Default DevAgent configuration */
export const DEFAULT_DEVAGENT_CONFIG: DevAgentConfig = {
  stages: ["scope", "execute", "review", "validate"],
  maxCorrections: 3,
  qualityThreshold: 0.5,
  routerConfig: DEFAULT_ROUTER_CONFIG,
  constitutionalRules: [],
};

/** Pipeline presets */
export const PIPELINE_PRESETS: Record<string, PipelineStage[]> = {
  full: ["scope", "execute", "review", "validate"],
  lite: ["execute", "review", "validate"],
  quick: ["execute", "validate"],
  generate: ["execute"],
};

/** Map AgentTask complexity to DecisionContext complexity */
export function mapComplexity(
  c: "trivial" | "moderate" | "complex" | "critical",
): "low" | "medium" | "high" {
  switch (c) {
    case "trivial":
    case "moderate":
      return "low";
    case "complex":
      return "medium";
    case "critical":
      return "high";
  }
}

export type { ArmStats, RoutableModel };