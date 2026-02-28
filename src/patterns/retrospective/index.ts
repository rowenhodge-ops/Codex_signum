// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Retrospective Module Barrel Export
 * @module codex-signum-core/patterns/retrospective
 */

export { runRetrospective } from "./retrospective.js";
export { deriveConvergenceStatus, worstBand } from "./queries.js";
export type {
  RetrospectiveOptions,
  RetrospectiveInsights,
  ConvergenceReading,
  StageReading,
  DegradationReading,
} from "./types.js";
