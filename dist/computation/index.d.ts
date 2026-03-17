/**
 * Codex Signum — Computation Module Barrel Export
 *
 * @module codex-signum-core/computation
 */
export { PHI_L_WINDOW_SIZES, computeAxiomComplianceFactor, computePhiL, computePhiLWithState, computeRawPhiL, computeTemporalStability, computeTemporalStabilityFromState, computeTrend, computeUsageSuccessRate, } from "./phi-l.js";
export { classifyMaturity, computeMaturityFactor, computeMaturityIndex, } from "./maturity.js";
export { buildLaplacian, computeAllEigenvalues, computeFiedlerEigenvalue, computeGraphTotalVariation, computePsiH, computePsiHWithState, createDefaultPsiHState, decomposePsiH, } from "./psi-h.js";
export type { GraphEdge, NodeHealth } from "./psi-h.js";
export { checkEpsilonRWarnings, computeEpsilonR, computeEpsilonRFloor, isEpsilonRSpike, minEpsilonRForSpectralState, } from "./epsilon-r.js";
export { ALGEDONIC_THRESHOLD, CASCADE_LIMIT, HYSTERESIS_RATIO, SAFETY_BUDGET, checkAlgedonicBypass, computeDampening, computeDegradationImpact, computeGammaEffective, computeRecoveryDelay, computeRecoveryRate, propagateDegradation, } from "./dampening.js";
export type { PropagationNode, PropagationResult } from "./dampening.js";
export { computeNetworkState, computePatternState, } from "./signal-conditioning.js";
export type { NetworkStateResult, PatternSignalInput, PatternStateResult, } from "./signal-conditioning.js";
export { aggregateHealth, weightedMean } from "./aggregation.js";
export type { AggregateHealth, ChildHealth, SubgraphInput } from "./aggregation.js";
export { computeHierarchicalHealth, computeSystemHealth } from "./hierarchical-health.js";
export { checkStructuralTriggers, checkLambda2Drop, checkFrictionSpike, checkCascadeActivation, checkEpsilonRSpike, checkPhiLVelocityAnomaly, checkOmegaGradientInversion, } from "./structural-triggers.js";
export type { TriggerInputState, TriggeredEvent } from "./structural-triggers.js";
export { runStructuralReview, computeGlobalLambda2, computeSpectralGap, computeHubDependencies, computeFrictionDistribution, assessDampening, } from "./structural-review.js";
export type { StructuralReviewResult, HubDependency, FrictionDistribution, DampeningAssessment, } from "./structural-review.js";
export { evaluateAndReviewIfNeeded } from "./immune-response.js";
export { getThresholds, classifyPhiLHealth, classifyEpsilonRAdaptive, isDissonant } from "./adaptive-thresholds.js";
export type { ThresholdSet } from "./adaptive-thresholds.js";
export { createThresholdOutcome, detectOscillation } from "./threshold-learning.js";
export type { ThresholdOutcome, ThresholdOutcomeType, ThresholdType } from "./threshold-learning.js";
export { healthBand, bandOrdinal } from "./health-band.js";
export { conditionValue } from "./condition-value.js";
//# sourceMappingURL=index.d.ts.map