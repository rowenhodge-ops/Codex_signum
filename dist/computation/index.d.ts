/**
 * Codex Signum — Computation Module Barrel Export
 *
 * @module codex-signum-core/computation
 */
export { computeAxiomComplianceFactor, computePhiL, computePhiLWithState, computeRawPhiL, computeTemporalStability, computeTemporalStabilityFromState, computeTrend, computeUsageSuccessRate, } from "./phi-l.js";
export { classifyMaturity, computeMaturityFactor, computeMaturityIndex, } from "./maturity.js";
export { buildLaplacian, computeAllEigenvalues, computeFiedlerEigenvalue, computeGraphTotalVariation, computePsiH, computePsiHWithState, decomposePsiH, } from "./psi-h.js";
export type { GraphEdge, NodeHealth } from "./psi-h.js";
export { checkEpsilonRWarnings, computeEpsilonR, computeEpsilonRFloor, } from "./epsilon-r.js";
export { CASCADE_LIMIT, HYSTERESIS_RATIO, computeDampening, computeDegradationImpact, computeRecoveryRate, propagateDegradation, } from "./dampening.js";
export type { PropagationNode, PropagationResult } from "./dampening.js";
export { computeNetworkState, computePatternState, } from "./signal-conditioning.js";
export type { NetworkStateResult, PatternSignalInput, PatternStateResult, } from "./signal-conditioning.js";
//# sourceMappingURL=index.d.ts.map