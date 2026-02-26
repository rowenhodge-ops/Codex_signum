/**
 * Codex Signum — Computation Module Barrel Export
 *
 * @module codex-signum-core/computation
 */

// ΦL — Health
export {
  PHI_L_WINDOW_SIZES,
  computeAxiomComplianceFactor,
  computePhiL,
  computePhiLWithState,
  computeRawPhiL,
  computeTemporalStability,
  computeTemporalStabilityFromState,
  computeTrend,
  computeUsageSuccessRate,
} from "./phi-l.js";

// Maturity
export {
  classifyMaturity,
  computeMaturityFactor,
  computeMaturityIndex,
} from "./maturity.js";

// ΨH — Harmonic Signature
export {
  buildLaplacian,
  computeAllEigenvalues,
  computeFiedlerEigenvalue,
  computeGraphTotalVariation,
  computePsiH,
  computePsiHWithState,
  decomposePsiH,
} from "./psi-h.js";
export type { GraphEdge, NodeHealth } from "./psi-h.js";

// εR — Exploration Rate
export {
  checkEpsilonRWarnings,
  computeEpsilonR,
  computeEpsilonRFloor,
  minEpsilonRForSpectralState,
} from "./epsilon-r.js";

// Dampening
export {
  ALGEDONIC_THRESHOLD,
  CASCADE_LIMIT,
  HYSTERESIS_RATIO,
  SAFETY_BUDGET,
  checkAlgedonicBypass,
  computeDampening,
  computeDegradationImpact,
  computeGammaEffective,
  computeHubDampening,
  computeRecoveryDelay,
  computeRecoveryRate,
  propagateDegradation,
} from "./dampening.js";
export type { PropagationNode, PropagationResult } from "./dampening.js";

// Signal Conditioning Pipeline
export {
  computeNetworkState,
  computePatternState,
} from "./signal-conditioning.js";
export type {
  NetworkStateResult,
  PatternSignalInput,
  PatternStateResult,
} from "./signal-conditioning.js";

// Aggregation
export { aggregateHealth, weightedMean } from "./aggregation.js";
export type { AggregateHealth, ChildHealth, SubgraphInput } from "./aggregation.js";

// Hierarchical health
export { computeHierarchicalHealth, computeSystemHealth } from "./hierarchical-health.js";

// Structural triggers
export {
  checkStructuralTriggers,
  checkLambda2Drop,
  checkFrictionSpike,
  checkCascadeActivation,
  checkEpsilonRSpike,
  checkPhiLVelocityAnomaly,
  checkOmegaGradientInversion,
} from "./structural-triggers.js";
export type { TriggerInputState, TriggeredEvent } from "./structural-triggers.js";

// Structural review
export {
  runStructuralReview,
  computeGlobalLambda2,
  computeSpectralGap,
  computeHubDependencies,
  computeFrictionDistribution,
  assessDampening,
} from "./structural-review.js";
export type {
  StructuralReviewResult,
  HubDependency,
  FrictionDistribution,
  DampeningAssessment,
} from "./structural-review.js";

// Immune response
export { evaluateAndReviewIfNeeded } from "./immune-response.js";

// Adaptive thresholds
export { getThresholds, classifyPhiLHealth, classifyEpsilonRAdaptive, isDissonant } from "./adaptive-thresholds.js";
export type { ThresholdSet } from "./adaptive-thresholds.js";

// Threshold learning
export { createThresholdOutcome, detectOscillation } from "./threshold-learning.js";
export type { ThresholdOutcome, ThresholdOutcomeType, ThresholdType } from "./threshold-learning.js";
