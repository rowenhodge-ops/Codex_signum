// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum - Architect Pattern
 *
 * 7-stage pipeline: SURVEY → DECOMPOSE → CLASSIFY → SEQUENCE → GATE → DISPATCH → ADAPT
 *
 * @module codex-signum-core/patterns/architect
 */

// Existing survey (core's rich spec cross-reference version)
export {
  survey,
  extractClaims,
  discoverDocumentSources,
  parseHypotheses,
} from "./survey.js";

// Pipeline stages
export { classify } from "./classify.js";
export { sequence } from "./sequence.js";
export { gate } from "./gate.js";
export { adapt } from "./adapt.js";
export { decompose, validateFilePaths } from "./decompose.js";
export { buildDecomposePrompt, getDirectoryListing } from "./decompose-prompt.js";
export { dispatch, type DispatchOptions } from "./dispatch.js";
export { executePlan } from "./architect.js";

// Parallel decompose (Best-of-N strategy)
export { parallelDecompose, scorePlan } from "./parallel-decompose.js";
export type { ParallelDecomposeOptions, ScoredPlan } from "./parallel-decompose.js";

// Reasoning tier selection (RTR framework)
export { selectReasoningTier } from "./reasoning-tiers.js";
export type { ReasoningTier } from "./reasoning-tiers.js";

// Mock executors for testing
export { createMockModelExecutor } from "./mock-model-executor.js";
export type { MockModelExecutorOptions } from "./mock-model-executor.js";
export { createMockTaskExecutor } from "./mock-task-executor.js";
export type { MockTaskExecutorOptions } from "./mock-task-executor.js";

// Types — SURVEY (core's rich types)
export type {
  BlindSpot,
  DocumentSource,
  ExtractedClaim,
  GapItem,
  SpecAssertion,
  SurveyInput,
  SurveyOutput,
  TrackedHypothesis,
} from "./types.js";

// Types — Pipeline
export type {
  AdaptationScope,
  ComplexityEstimate,
  Dependency,
  EffortEstimate,
  ExecutionPlan,
  GateDecision,
  GateResponse,
  ModelExecutor,
  ModelExecutorContext,
  ModelExecutorResult,
  Phase,
  PipelineSurveyOutput,
  PlanQualityMetrics,
  PlanState,
  PlanStatus,
  Task,
  TaskExecutionContext,
  TaskExecutor,
  TaskGraph,
  TaskOutcome,
  TaskType,
} from "./types.js";

// Types — Stage results
export type { AdaptationResult } from "./adapt.js";
export type { GateOptions } from "./gate.js";
export type { ArchitectConfig } from "./architect.js";

// Constants
export {
  MAX_ADAPTATIONS_PER_PLAN,
  MAX_TASKS_PER_PLAN,
  MANDATORY_HUMAN_GATE,
} from "./types.js";
