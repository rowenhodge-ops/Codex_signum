/**
 * Codex Signum — Graph Module Barrel Export
 *
 * @module codex-signum-core/graph
 */
export { getDriver, getSession, closeDriver, runQuery, writeTransaction, readTransaction, healthCheck, } from "./client.js";
export { migrateSchema, verifySchema, seedConstitutionalRules, } from "./schema.js";
export { createAgent, getAgent, listActiveAgents, listActiveAgentsByCapability, createPattern, getPattern, updatePatternState, connectPatterns, recordDecision, recordDecisionOutcome, getDecisionsForCluster, getArmStatsForCluster, recordObservation, getObservationsForPattern, countObservationsForPattern, createDistillation, ensureContextCluster, getPatternDegree, getPatternAdjacency, getPatternsWithHealth, updatePatternPhiL, } from "./queries.js";
export type { AgentProps, PatternProps, DecisionProps, DecisionOutcomeProps, ObservationProps, DistillationProps, ContextClusterProps, ArmStats, } from "./queries.js";
export { writeObservation, writeThresholdEvent, } from "./write-observation.js";
export type { PatternHealthContext, WriteObservationResult, } from "./write-observation.js";
//# sourceMappingURL=index.d.ts.map