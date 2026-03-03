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
  // Seeds (formerly Agents)
  createSeed,
  getSeed,
  listActiveSeeds,
  listActiveSeedsByCapability,
  // Blooms (formerly Patterns)
  createBloom,
  getBloom,
  updateBloomState,
  connectBlooms,
  // Decisions
  recordDecision,
  recordDecisionOutcome,
  getDecisionsForCluster,
  getArmStatsForCluster,
  // Observations
  recordObservation,
  getObservationsForBloom,
  countObservationsForBloom,
  // Distillations
  createDistillation,
  // Context Clusters
  ensureContextCluster,
  // Human Feedback
  recordHumanFeedback,
  getHumanFeedbackForRun,
  listPendingFeedbackRuns,
  getCalibrationMetrics,
  // Pipeline Topology
  ARCHITECT_STAGES,
  createPipelineRun,
  completePipelineRun,
  getPipelineRun,
  listPipelineRuns,
  createTaskOutput,
  getTaskOutputsForRun,
  queryTaskOutputsByModel,
  ensureArchitectResonators,
  linkTaskOutputToStage,
  // Topology
  getBloomDegree,
  getBloomAdjacency,
  getBloomsWithHealth,
  updateBloomPhiL,
  // Backward compatibility aliases (deprecated)
  createAgent,
  getAgent,
  listActiveAgents,
  listActiveAgentsByCapability,
  createPattern,
  getPattern,
  updatePatternState,
  connectPatterns,
  getObservationsForPattern,
  countObservationsForPattern,
  getPatternDegree,
  getPatternAdjacency,
  getPatternsWithHealth,
  updatePatternPhiL,
} from "./queries.js";

// Re-export query types
export type {
  SeedProps,
  BloomProps,
  DecisionProps,
  DecisionOutcomeProps,
  ObservationProps,
  DistillationProps,
  ContextClusterProps,
  ArmStats,
  HumanFeedbackProps,
  CalibrationMetrics,
  PipelineRunProps,
  TaskOutputProps,
  // Backward compatibility aliases (deprecated)
  AgentProps,
  PatternProps,
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
