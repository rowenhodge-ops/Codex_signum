/**
 * Codex Signum - Architect Pattern
 *
 * 7-stage pipeline: SURVEY → DECOMPOSE → CLASSIFY → SEQUENCE → GATE → DISPATCH → ADAPT
 *
 * @module codex-signum-core/patterns/architect
 */
export { survey, extractClaims, discoverDocumentSources, parseHypotheses, } from "./survey.js";
export { classify } from "./classify.js";
export { sequence } from "./sequence.js";
export { gate } from "./gate.js";
export { adapt } from "./adapt.js";
export { decompose, validateFilePaths } from "./decompose.js";
export { buildDecomposePrompt, getDirectoryListing } from "./decompose-prompt.js";
export { dispatch, type DispatchOptions } from "./dispatch.js";
export { executePlan } from "./architect.js";
export { parallelDecompose, scorePlan } from "./parallel-decompose.js";
export type { ParallelDecomposeOptions, ScoredPlan } from "./parallel-decompose.js";
export { selectReasoningTier } from "./reasoning-tiers.js";
export type { ReasoningTier } from "./reasoning-tiers.js";
export { createMockModelExecutor } from "./mock-model-executor.js";
export type { MockModelExecutorOptions } from "./mock-model-executor.js";
export { createMockTaskExecutor } from "./mock-task-executor.js";
export type { MockTaskExecutorOptions } from "./mock-task-executor.js";
export type { BlindSpot, DocumentSource, ExtractedClaim, GapItem, SpecAssertion, SurveyInput, SurveyOutput, TrackedHypothesis, } from "./types.js";
export type { AdaptationScope, ComplexityEstimate, Dependency, EffortEstimate, ExecutionPlan, GateDecision, GateResponse, ModelExecutor, ModelExecutorContext, ModelExecutorResult, Phase, PipelineSurveyOutput, PlanQualityMetrics, PlanState, PlanStatus, Task, TaskExecutionContext, TaskExecutor, TaskGraph, TaskOutcome, TaskType, } from "./types.js";
export type { AdaptationResult } from "./adapt.js";
export type { GateOptions } from "./gate.js";
export type { ArchitectConfig } from "./architect.js";
export { MAX_ADAPTATIONS_PER_PLAN, MAX_TASKS_PER_PLAN, MANDATORY_HUMAN_GATE, } from "./types.js";
export { detectUnsourcedReferences } from "./hallucination-detection.js";
export type { HallucinationFlag } from "./hallucination-detection.js";
export { DOCUMENT_NAME_MAP, extractPathReferences, resolveDocumentReferences, } from "./canonical-references.js";
//# sourceMappingURL=index.d.ts.map