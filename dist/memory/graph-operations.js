// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
// ============ COMPACTION ============
/**
 * @deprecated M-10 structural memory paradigm replaces Grid-based compaction.
 * Use `updateStructuralMemoryAfterExecution()` from `src/graph/queries/memory-context.ts` instead.
 * Calling this function throws — DETACH DELETE destroys A4 provenance data.
 */
export async function runCompaction(_bloomId, _config) {
    throw new Error("[DEPRECATED] runCompaction() uses DETACH DELETE which destroys A4 provenance data. " +
        "Use updateStructuralMemoryAfterExecution() from src/graph/queries/memory-context.ts instead. " +
        "See M-10 structural memory paradigm.");
}
// ============ DISTILLATION ============
/**
 * @deprecated M-10 structural memory paradigm replaces Grid-based distillation.
 * Use `updateStructuralMemoryAfterExecution()` from `src/graph/queries/memory-context.ts` instead.
 * Calling this function throws.
 */
export async function checkAndDistill(_bloomId) {
    throw new Error("[DEPRECATED] checkAndDistill() writes Distillation Seeds to Grid and supersedes old data. " +
        "Use updateStructuralMemoryAfterExecution() from src/graph/queries/memory-context.ts instead. " +
        "See M-10 structural memory paradigm.");
}
// ============ FULL MEMORY FLOW ============
/**
 * @deprecated M-10 structural memory paradigm replaces the upward-flow memory model.
 * Use `updateStructuralMemoryAfterExecution()` from `src/graph/queries/memory-context.ts` instead.
 * Calling this function throws.
 */
export async function processMemoryAfterExecution(_bloomId, _executionResult) {
    throw new Error("[DEPRECATED] processMemoryAfterExecution() runs compaction (DETACH DELETE) and distillation " +
        "that destroy A4 provenance data. Use updateStructuralMemoryAfterExecution() from " +
        "src/graph/queries/memory-context.ts instead. See M-10 structural memory paradigm.");
}
//# sourceMappingURL=graph-operations.js.map