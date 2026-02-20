/**
 * Codex Signum — Patterns Module Barrel Export
 * @module codex-signum-core/patterns
 */

// Thompson Router
export {
  DEFAULT_ROUTER_CONFIG,
  buildContextClusterId,
  route,
  sampleBeta,
} from "./thompson-router.js";
export type {
  RoutableModel,
  RoutingContext,
  RoutingDecision,
  ThompsonRouterConfig,
} from "./thompson-router.js";

// DevAgent Pipeline
export {
  DEFAULT_DEVAGENT_CONFIG,
  DevAgent,
  PIPELINE_PRESETS,
} from "./dev-agent.js";
export type {
  AgentTask,
  DevAgentConfig,
  ModelExecutor,
  PipelineResult,
  PipelineStage,
  QualityAssessor,
  StageResult,
} from "./dev-agent.js";

// Observer
export { Observer } from "./observer.js";
export type {
  FeedbackRecommendation,
  ObservableEvent,
  ObserverState,
} from "./observer.js";
