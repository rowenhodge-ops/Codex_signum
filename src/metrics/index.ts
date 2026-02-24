/**
 * Codex Signum — Pipeline Metrics
 *
 * RTY (Rolled Throughput Yield) and feedback effectiveness metrics
 * for measuring pipeline health and correction loop quality.
 *
 * @module codex-signum-core/metrics
 */

// RTY and %C&A
export {
  computePercentCA,
  computeRTY,
  stageResultsToAttempts,
} from "./rty.js";
export type {
  PercentCAResult,
  RtyResult,
  StageAttempt,
} from "./rty.js";

// Feedback effectiveness
export {
  computeFeedbackEffectiveness,
} from "./feedback-effectiveness.js";
export type {
  FeedbackEffectivenessResult,
} from "./feedback-effectiveness.js";
