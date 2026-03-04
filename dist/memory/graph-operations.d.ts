/**
 * Codex Signum — Graph-Backed Memory Operations
 *
 * Bridge layer that wires pure memory functions (compaction.ts, distillation.ts,
 * flow.ts, operations.ts) to the Neo4j graph via graph query functions.
 *
 * Each function:
 * 1. Reads data from Neo4j using graph queries
 * 2. Passes it through the appropriate pure function
 * 3. Writes results back to Neo4j
 *
 * All functions are NON-FATAL: if Neo4j is down or any query fails,
 * they log a warning and return a no-op result. The pipeline must never
 * crash because memory persistence failed.
 *
 * @see codex-signum-v3.0.md §Memory Topology
 * @module codex-signum-core/memory/graph-operations
 */
import { type CompactionConfig } from "./compaction.js";
import { type PerformanceProfile, type RoutingHints } from "./distillation.js";
export interface CompactionResult {
    observationsEvaluated: number;
    observationsDeleted: number;
    error?: string;
}
export interface DistillationResult {
    distillationId: string;
    observationCount: number;
    performanceProfile: PerformanceProfile;
    routingHints: RoutingHints;
    supersededDistillationIds: string[];
}
export interface MemoryProcessingResult {
    compaction: CompactionResult | null;
    distillation: DistillationResult | null;
    error?: string;
}
/**
 * Run compaction for a bloom's observations.
 * Fetches compactable observations from Neo4j, runs identifyCompactable(),
 * deletes the safe-to-remove ones.
 *
 * Non-fatal: returns error result instead of throwing.
 */
export declare function runCompaction(bloomId: string, config?: Partial<CompactionConfig>): Promise<CompactionResult>;
/**
 * Check if distillation should trigger for a bloom, and if so, run it.
 * Fetches observations, checks shouldDistill(), runs distillPerformanceProfile()
 * and distillRoutingHints(), persists results, supersedes old distillations.
 *
 * Returns null if distillation was not triggered.
 * Non-fatal: returns null + logs warning on error.
 */
export declare function checkAndDistill(bloomId: string): Promise<DistillationResult | null>;
/**
 * Run the full upward memory flow after a task execution.
 * This is what the executor calls after each task when graphEnabled.
 *
 * 1. Compute upward flow (should we distill? promote to institutional?)
 * 2. If distillation triggered, run checkAndDistill()
 * 3. Opportunistic compaction (every Nth call)
 *
 * Non-fatal: if any step fails, logs warning and continues.
 */
export declare function processMemoryAfterExecution(bloomId: string, executionResult: {
    modelId: string;
    success: boolean;
    qualityScore?: number;
    durationMs: number;
    failureSignature?: string;
}): Promise<MemoryProcessingResult>;
/**
 * Reset the execution counter (for testing purposes).
 * @internal
 */
export declare function _resetExecutionCounter(): void;
//# sourceMappingURL=graph-operations.d.ts.map