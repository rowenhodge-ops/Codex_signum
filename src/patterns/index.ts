/**
 * Codex Signum — Patterns Module Barrel Export
 * @module codex-signum-core/patterns
 */

// Thompson Router
export {
  computeCostAdjustedReward,
  DEFAULT_ROUTER_CONFIG,
  buildContextClusterId,
  freshArmStats,
  route,
  sampleBeta,
  selectModel,
  TASK_COST_DEFAULTS,
  updateArmStats,
} from "./thompson-router/index.js";
export type {
  OutcomeRecord,
  RoutableModel,
  RoutingContext,
  RoutingDecision,
  SelectModelRequest,
  SelectModelResult,
  TaskCostConfig,
  ThompsonRouterConfig,
} from "./thompson-router/index.js";

// DevAgent Pipeline
export {
  DEFAULT_DEVAGENT_CONFIG,
  DevAgent,
  PIPELINE_PRESETS,
} from "./dev-agent/index.js";
export type {
  AgentTask,
  DevAgentConfig,
  DevAgentModelExecutor,
  PipelineResult,
  PipelineStage,
  QualityAssessor,
  StageResult,
} from "./dev-agent/index.js";

// Observer
export { Observer } from "./observer/index.js";
export type {
  FeedbackRecommendation,
  GraphObserver,
  ObservableEvent,
  ObserverMode,
  ObserverState,
} from "./observer/index.js";

// Architect Pattern — SURVEY + Pipeline stages
export {
  survey,
  extractClaims,
  discoverDocumentSources,
  parseHypotheses,
  classify,
  sequence,
  gate,
  adapt,
  decompose,
  buildDecomposePrompt,
  dispatch,
  executePlan,
  parallelDecompose,
  scorePlan,
  selectReasoningTier,
  createMockModelExecutor,
  createMockTaskExecutor,
  MAX_ADAPTATIONS_PER_PLAN,
  MAX_TASKS_PER_PLAN,
  MANDATORY_HUMAN_GATE,
} from "./architect/index.js";
export type {
  // Survey types (core's rich types)
  BlindSpot,
  DocumentSource,
  ExtractedClaim,
  GapItem,
  SpecAssertion,
  SurveyInput,
  SurveyOutput,
  TrackedHypothesis,
  // Pipeline types
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
  // Stage results
  AdaptationResult,
  GateOptions,
  ArchitectConfig,
  // Parallel decompose
  ParallelDecomposeOptions,
  ScoredPlan,
  // Reasoning tiers
  ReasoningTier,
  // Mock executors
  MockModelExecutorOptions,
  MockTaskExecutorOptions,
} from "./architect/index.js";

// Retrospective — deterministic graph queries, no LLM
export {
  runRetrospective,
  deriveConvergenceStatus,
  worstBand,
} from "./retrospective/index.js";
export type {
  RetrospectiveOptions,
  RetrospectiveInsights,
  ConvergenceReading,
  StageReading,
  DegradationReading,
} from "./retrospective/index.js";
