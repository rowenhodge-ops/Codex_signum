// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

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

import type { CompactionConfig } from "./compaction.js";
import type { PerformanceProfile, RoutingHints } from "./distillation.js";

// ============ RESULT TYPES ============

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

// ============ COMPACTION ============

/**
 * @deprecated M-10 structural memory paradigm replaces Grid-based compaction.
 * Use `updateStructuralMemoryAfterExecution()` from `src/graph/queries/memory-context.ts` instead.
 * Calling this function throws — DETACH DELETE destroys A4 provenance data.
 */
export async function runCompaction(
  _bloomId: string,
  _config?: Partial<CompactionConfig>,
): Promise<CompactionResult> {
  throw new Error(
    "[DEPRECATED] runCompaction() uses DETACH DELETE which destroys A4 provenance data. " +
    "Use updateStructuralMemoryAfterExecution() from src/graph/queries/memory-context.ts instead. " +
    "See M-10 structural memory paradigm.",
  );
}

// ============ DISTILLATION ============

/**
 * @deprecated M-10 structural memory paradigm replaces Grid-based distillation.
 * Use `updateStructuralMemoryAfterExecution()` from `src/graph/queries/memory-context.ts` instead.
 * Calling this function throws.
 */
export async function checkAndDistill(
  _bloomId: string,
): Promise<DistillationResult | null> {
  throw new Error(
    "[DEPRECATED] checkAndDistill() writes Distillation Seeds to Grid and supersedes old data. " +
    "Use updateStructuralMemoryAfterExecution() from src/graph/queries/memory-context.ts instead. " +
    "See M-10 structural memory paradigm.",
  );
}

// ============ FULL MEMORY FLOW ============

/**
 * @deprecated M-10 structural memory paradigm replaces the upward-flow memory model.
 * Use `updateStructuralMemoryAfterExecution()` from `src/graph/queries/memory-context.ts` instead.
 * Calling this function throws.
 */
export async function processMemoryAfterExecution(
  _bloomId: string,
  _executionResult: {
    modelId: string;
    success: boolean;
    qualityScore?: number;
    durationMs: number;
    failureSignature?: string;
  },
): Promise<MemoryProcessingResult> {
  throw new Error(
    "[DEPRECATED] processMemoryAfterExecution() runs compaction (DETACH DELETE) and distillation " +
    "that destroy A4 provenance data. Use updateStructuralMemoryAfterExecution() from " +
    "src/graph/queries/memory-context.ts instead. See M-10 structural memory paradigm.",
  );
}
