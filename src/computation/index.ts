/**
 * Codex Signum — Computation Module Barrel Export
 *
 * @module codex-signum-core/computation
 */

// ΦL — Health
export {
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
} from "./epsilon-r.js";

// Dampening
export {
  CASCADE_LIMIT,
  HYSTERESIS_RATIO,
  computeDampening,
  computeDegradationImpact,
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
