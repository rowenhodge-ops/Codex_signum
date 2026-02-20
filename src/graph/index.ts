/**
 * Codex Signum — Graph Module Barrel Export
 *
 * @module codex-signum-core/graph
 */

export {
  getDriver,
  getSession,
  closeDriver,
  runQuery,
  writeTransaction,
  readTransaction,
  healthCheck,
} from "./client.js";
export {
  migrateSchema,
  verifySchema,
  seedConstitutionalRules,
} from "./schema.js";
export {
  // Agents
  createAgent,
  getAgent,
  listActiveAgents,
  // Patterns
  createPattern,
  getPattern,
  updatePatternState,
  connectPatterns,
  // Decisions
  recordDecision,
  recordDecisionOutcome,
  getDecisionsForCluster,
  getArmStatsForCluster,
  // Observations
  recordObservation,
  getObservationsForPattern,
  countObservationsForPattern,
  // Distillations
  createDistillation,
  // Context Clusters
  ensureContextCluster,
  // Topology
  getPatternDegree,
  getPatternAdjacency,
  getPatternsWithHealth,
  updatePatternPhiL,
} from "./queries.js";

// Re-export query types
export type {
  AgentProps,
  PatternProps,
  DecisionProps,
  DecisionOutcomeProps,
  ObservationProps,
  DistillationProps,
  ContextClusterProps,
  ArmStats,
} from "./queries.js";
