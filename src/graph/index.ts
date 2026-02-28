// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

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
  listActiveAgentsByCapability,
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

// Inline conditioning write path
export {
  writeObservation,
  writeThresholdEvent,
} from "./write-observation.js";
export type {
  PatternHealthContext,
  WriteObservationResult,
} from "./write-observation.js";
