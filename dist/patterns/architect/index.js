// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Codex Signum - Architect Pattern
 *
 * 7-stage pipeline: SURVEY → DECOMPOSE → CLASSIFY → SEQUENCE → GATE → DISPATCH → ADAPT
 *
 * @module codex-signum-core/patterns/architect
 */
// Existing survey (core's rich spec cross-reference version)
export { survey, extractClaims, discoverDocumentSources, parseHypotheses, } from "./survey.js";
// Pipeline stages
export { classify } from "./classify.js";
export { sequence } from "./sequence.js";
export { gate } from "./gate.js";
export { adapt } from "./adapt.js";
export { decompose, validateFilePaths } from "./decompose.js";
export { buildDecomposePrompt, getDirectoryListing } from "./decompose-prompt.js";
export { dispatch } from "./dispatch.js";
export { executePlan } from "./architect.js";
// Parallel decompose (Best-of-N strategy)
export { parallelDecompose, scorePlan } from "./parallel-decompose.js";
// Reasoning tier selection (RTR framework)
export { selectReasoningTier } from "./reasoning-tiers.js";
// Mock executors for testing
export { createMockModelExecutor } from "./mock-model-executor.js";
export { createMockTaskExecutor } from "./mock-task-executor.js";
// Constants
export { MAX_ADAPTATIONS_PER_PLAN, MAX_TASKS_PER_PLAN, MANDATORY_HUMAN_GATE, } from "./types.js";
// Quality gates — hallucination detection and source verification
export { detectUnsourcedReferences } from "./hallucination-detection.js";
export { DOCUMENT_NAME_MAP, extractPathReferences, resolveDocumentReferences, } from "./canonical-references.js";
//# sourceMappingURL=index.js.map