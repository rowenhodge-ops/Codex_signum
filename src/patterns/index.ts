/**
 * Codex Signum — Patterns Module Barrel Export
 * @module codex-signum-core/patterns
 */

// Thompson Router
export {
  computeCostAdjustedReward,
  DEFAULT_ROUTER_CONFIG,
  buildContextClusterId,
  route,
  sampleBeta,
  selectModel,
  TASK_COST_DEFAULTS,
} from "./thompson-router/index.js";
export type {
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
  ModelExecutor,
  PipelineResult,
  PipelineStage,
  QualityAssessor,
  StageResult,
} from "./dev-agent/index.js";

// Observer
export { Observer } from "./observer/index.js";
export type {
  FeedbackRecommendation,
  ObservableEvent,
  ObserverState,
} from "./observer/index.js";

// Architect Pattern
export { survey } from "./architect/index.js";
export type {
  BlindSpot,
  GapItem,
  SpecAssertion,
  SurveyInput,
  SurveyOutput,
} from "./architect/index.js";
