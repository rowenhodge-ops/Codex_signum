/**
 * Codex Signum — Patterns Module Barrel Export
 * @module codex-signum-core/patterns
 */
export { computeCostAdjustedReward, DEFAULT_ROUTER_CONFIG, buildContextClusterId, freshArmStats, route, sampleBeta, selectModel, TASK_COST_DEFAULTS, updateArmStats, } from "./thompson-router/index.js";
export type { OutcomeRecord, RoutableModel, RoutingContext, RoutingDecision, SelectModelRequest, SelectModelResult, TaskCostConfig, ThompsonRouterConfig, } from "./thompson-router/index.js";
export { DEFAULT_DEVAGENT_CONFIG, DevAgent, PIPELINE_PRESETS, } from "./dev-agent/index.js";
export type { AgentTask, DevAgentConfig, DevAgentModelExecutor, PipelineResult, PipelineStage, QualityAssessor, StageResult, } from "./dev-agent/index.js";
export { checkCorrectionScale, checkLearningScale, checkEvolutionaryScale, } from "./feedback/index.js";
export type { FeedbackRecommendation, GraphObserver, ObservableEvent, ObserverMode, ObserverState, } from "./feedback/index.js";
export { survey, extractClaims, discoverDocumentSources, parseHypotheses, classify, sequence, gate, adapt, decompose, buildDecomposePrompt, dispatch, executePlan, parallelDecompose, scorePlan, selectReasoningTier, createMockModelExecutor, createMockTaskExecutor, MAX_ADAPTATIONS_PER_PLAN, MAX_TASKS_PER_PLAN, MANDATORY_HUMAN_GATE, detectUnsourcedReferences, DOCUMENT_NAME_MAP, extractPathReferences, resolveDocumentReferences, validateFilePaths, getDirectoryListing, } from "./architect/index.js";
export type { BlindSpot, DocumentSource, ExtractedClaim, GapItem, SpecAssertion, SurveyInput, SurveyOutput, TrackedHypothesis, AdaptationScope, ComplexityEstimate, Dependency, EffortEstimate, ExecutionPlan, GateDecision, GateResponse, ModelExecutor, ModelExecutorContext, ModelExecutorResult, Phase, PipelineSurveyOutput, PlanQualityMetrics, PlanState, PlanStatus, Task, TaskExecutionContext, TaskExecutor, TaskGraph, TaskOutcome, TaskType, AdaptationResult, GateOptions, ArchitectConfig, ParallelDecomposeOptions, ScoredPlan, ReasoningTier, MockModelExecutorOptions, HallucinationFlag, MockTaskExecutorOptions, } from "./architect/index.js";
export { runRetrospective, deriveConvergenceStatus, worstBand, } from "./retrospective/index.js";
export type { RetrospectiveOptions, RetrospectiveInsights, ConvergenceReading, StageReading, DegradationReading, } from "./retrospective/index.js";
//# sourceMappingURL=index.d.ts.map