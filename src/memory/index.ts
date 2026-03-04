// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Memory Module Barrel Export
 * @module codex-signum-core/memory
 */

// Operations (Stratum 1-4 CRUD)
export {
  EphemeralStore,
  attachOutcome,
  createDecision,
  createInstitutionalKnowledge,
  createObservation,
  distillObservations,
  shouldDistill,
  shouldPromoteToInstitutional,
} from "./operations.js";

// Compaction (Stratum 2 lifecycle)
export {
  DEFAULT_COMPACTION_CONFIG,
  computeCompactionStats,
  computeObservationWeight,
  computePracticalWindow,
  identifyCompactable,
} from "./compaction.js";
export type {
  CompactableObservation,
  CompactionConfig,
  CompactionStats,
} from "./compaction.js";

// Enhanced Distillation (Stratum 3 insights)
export {
  distillPerformanceProfile,
  distillRoutingHints,
  distillThresholdCalibration,
} from "./distillation.js";
export type {
  PerformanceObservation,
  PerformanceProfile,
  RoutingHints,
  RoutingObservation,
  ThresholdCalibrationData,
  ThresholdObservation,
} from "./distillation.js";

// Memory Flow Coordinator
export { computeDownwardFlow, computeUpwardFlow } from "./flow.js";
export type {
  DownwardFlowInput,
  MemoryContext,
  UpwardFlowInput,
  UpwardFlowResult,
} from "./flow.js";

// Graph-backed memory operations (M-9.4)
export {
  runCompaction,
  checkAndDistill,
  processMemoryAfterExecution,
} from "./graph-operations.js";
export type {
  CompactionResult,
  DistillationResult,
  MemoryProcessingResult,
} from "./graph-operations.js";
