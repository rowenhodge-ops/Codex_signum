// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

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
  /** Original acceptance criteria from the source requirement (e.g., from a plan document).
   *  Used by VALIDATE to check provenance — did we build what was originally asked for? */
  sourceAcceptanceCriteria?: string[];
  /** Reference to where the original requirement came from (e.g., "phase-b-plan.md#B-4") */
  sourceReference?: string;
}

/** Result from a single pipeline stage */
export interface StageResult {
  stage: PipelineStage;
  modelId: string;
  output: string;
  qualityScore: number;
  durationMs: number;
  wasExploratory: boolean;
  refinementIteration: number;
}

/** Complete pipeline result */
export interface PipelineResult {
  taskId: string;
  stages: StageResult[];
  finalOutput: string;
  totalDurationMs: number;
  totalCost: number;
  overallQuality: number;
  refinementCount: number;
  constitutionalCompliance: ConstitutionalEvaluation | null;
  decisions: Decision[];
  /** Source requirement provenance tracking.
   *  Present when task included sourceAcceptanceCriteria. */
  provenanceCheck?: {
    sourceReference?: string;
    /** Acceptance criteria from the source that were satisfied */
    sourceCriteriaMet: string[];
    /** Criteria that were intentionally waived with rationale */
    sourceCriteriaWaived: Array<{ criterion: string; rationale: string }>;
    /** True if SCOPE reframed the task in a way that diverges from the original source */
    scopeDiverged: boolean;
  };
}

/** Model executor — the actual model invocation function (dev-agent pipeline) */
export type DevAgentModelExecutor = (
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
  maxRefinements: number;
  qualityThreshold: number;
  routerConfig: ThompsonRouterConfig;
  constitutionalRules: ConstitutionalRule[];
  /** Called after each pipeline stage completes. Errors are caught and logged, not propagated. */
  afterStage?: (
    stage: PipelineStage,
    result: StageResult,
    task: AgentTask,
  ) => Promise<void>;
  /** Called after the full pipeline completes, before returning the result. Errors are caught and logged. */
  afterPipeline?: (result: PipelineResult, task: AgentTask) => Promise<void>;
}

/** Default DevAgent configuration */
export const DEFAULT_DEVAGENT_CONFIG: DevAgentConfig = {
  stages: ["scope", "execute", "review", "validate"],
  maxRefinements: 3,
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
