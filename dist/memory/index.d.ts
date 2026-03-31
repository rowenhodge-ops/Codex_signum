/**
 * Codex Signum — Memory Module Barrel Export
 * @module codex-signum-core/memory
 */
export { EphemeralStore, attachOutcome, createDecision, createInstitutionalKnowledge, createObservation, distillObservations, shouldDistill, shouldPromoteToInstitutional, } from "./operations.js";
export { DEFAULT_COMPACTION_CONFIG, computeCompactionStats, computeObservationWeight, computePracticalWindow, identifyCompactable, } from "./compaction.js";
export type { CompactableObservation, CompactionConfig, CompactionStats, } from "./compaction.js";
export { distillPerformanceProfile, distillRoutingHints, distillThresholdCalibration, } from "./distillation.js";
export type { PerformanceObservation, PerformanceProfile, RoutingHints, RoutingObservation, ThresholdCalibrationData, ThresholdObservation, } from "./distillation.js";
export { computeDownwardFlow, computeUpwardFlow } from "./flow.js";
export type { DownwardFlowInput, MemoryContext, UpwardFlowInput, UpwardFlowResult, } from "./flow.js";
/** @deprecated */ export { runCompaction } from "./graph-operations.js";
/** @deprecated */ export { checkAndDistill } from "./graph-operations.js";
/** @deprecated */ export { processMemoryAfterExecution } from "./graph-operations.js";
export type { CompactionResult, DistillationResult, MemoryProcessingResult, } from "./graph-operations.js";
//# sourceMappingURL=index.d.ts.map