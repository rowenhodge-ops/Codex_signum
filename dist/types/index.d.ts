/**
 * Codex Signum Core — Type Barrel Exports
 *
 * Re-exports all type definitions from the core type system.
 */
export type { Bloom, BloomShape, GrammarCompliance, Grid, GridType, Helix, HelixMode, IntegrationState, Line, LineDirection, Morpheme, MorphemeBase, MorphemeKind, Resonator, ResonatorOrientation, Seed, } from "./morphemes.js";
export type { EpsilonR, EpsilonRRange, MaturityIndex, PhiL, PhiLFactors, PhiLState, PhiLTrend, PhiLWeights, PsiH, PsiHDecomposition, PsiHState, StateDimensions, } from "./state-dimensions.js";
export { DEFAULT_PHI_L_WEIGHTS, EPSILON_R_THRESHOLDS, MATURITY_THRESHOLDS, PSI_H_FRICTION_THRESHOLDS, PSI_H_WEIGHTS, classifyEpsilonR, createPhiLState, createPsiHState, } from "./state-dimensions.js";
export type { AmendmentStatus, AmendmentTier, ArchitectureDecisionRecord, AxiomCompliance, ConstitutionalRule, RuleConstraint, RuleEvaluation, RuleExpression, RuleStatus, RuleTarget, } from "./constitutional.js";
export { computeAxiomComplianceFraction } from "./constitutional.js";
export type { Decision, DecisionContext, DecisionOutcome, Distillation, DistillationCategory, EphemeralMemory, InstitutionalKnowledge, InstitutionalKnowledgeType, MemoryStratum, Observation, ObservationData, ObservationType, } from "./memory.js";
export type { HealthBand, ThresholdEvent } from "./threshold-event.js";
//# sourceMappingURL=index.d.ts.map