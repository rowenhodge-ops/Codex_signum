// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Codex Signum Core — Main Package Entrypoint
 *
 * Re-exports all types, computations, graph utilities,
 * and pattern implementations.
 */
// ── Types ──
export * from "./types/index.js";
// ── Graph ──
export * from "./graph/index.js";
// ── Computation ──
export * from "./computation/index.js";
// ── Memory ──
export * from "./memory/index.js";
// ── Constitutional ──
export * from "./constitutional/index.js";
// ── Signals ──
export * from "./signals/index.js";
// ── Resilience ──
export * from "./resilience/index.js";
// ── Metrics ──
export * from "./metrics/index.js";
// ── Patterns ──
export * from "./patterns/index.js";
// ── Bootstrap ──
export { ALL_ARMS, CORE_BLOOMS, bootstrapSeeds, bootstrapBlooms, seedAnalyticalPriors, seedInformedPriors, 
// Backward compatibility aliases (deprecated)
bootstrapAgents, bootstrapPatterns, CORE_PATTERNS, } from "./bootstrap.js";
//# sourceMappingURL=index.js.map