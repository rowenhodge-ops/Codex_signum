/**
 * Codex Signum — Computation Module Barrel Export
 *
 * @module codex-signum-core/computation
 */
// ΦL — Health
export { computeAxiomComplianceFactor, computePhiL, computeRawPhiL, computeTemporalStability, computeTrend, computeUsageSuccessRate, } from "./phi-l.js";
// Maturity
export { classifyMaturity, computeMaturityFactor, computeMaturityIndex, } from "./maturity.js";
// ΨH — Harmonic Signature
export { buildLaplacian, computeAllEigenvalues, computeFiedlerEigenvalue, computeGraphTotalVariation, computePsiH, } from "./psi-h.js";
// εR — Exploration Rate
export { checkEpsilonRWarnings, computeEpsilonR, computeEpsilonRFloor, } from "./epsilon-r.js";
// Dampening
export { CASCADE_LIMIT, HYSTERESIS_RATIO, computeDampening, computeDegradationImpact, computeRecoveryRate, propagateDegradation, } from "./dampening.js";
// Signal Conditioning Pipeline
export { computeNetworkState, computePatternState, } from "./signal-conditioning.js";
//# sourceMappingURL=index.js.map