// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Codex Signum — Patterns Module Barrel Export
 * @module codex-signum-core/patterns
 */
// Thompson Router
export { computeCostAdjustedReward, DEFAULT_ROUTER_CONFIG, buildContextClusterId, freshArmStats, route, sampleBeta, selectModel, TASK_COST_DEFAULTS, updateArmStats, } from "./thompson-router/index.js";
// DevAgent Pipeline
export { DEFAULT_DEVAGENT_CONFIG, DevAgent, PIPELINE_PRESETS, } from "./dev-agent/index.js";
// Feedback functions + types (formerly observer — Observer class removed per state-is-structural axiom)
export { checkRefinementScale, checkLearningScale, checkEvolutionaryScale, } from "./feedback/index.js";
// Architect Pattern — SURVEY + Pipeline stages
export { survey, extractClaims, discoverDocumentSources, parseHypotheses, classify, classifyTask, sequence, gate, adapt, decompose, buildDecomposePrompt, dispatch, registerDeterministicExecutor, clearDeterministicExecutors, getDeterministicExecutorCount, MECHANICAL_CONFIDENCE_THRESHOLD, executePlan, parallelDecompose, scorePlan, selectReasoningTier, createMockModelExecutor, createMockTaskExecutor, MAX_ADAPTATIONS_PER_PLAN, MAX_TASKS_PER_PLAN, MANDATORY_HUMAN_GATE, 
// Quality gates — source verification
detectUnsourcedReferences, DOCUMENT_NAME_MAP, extractPathReferences, resolveDocumentReferences, validateFilePaths, getDirectoryListing, } from "./architect/index.js";
// Retrospective — deterministic graph queries, no LLM
export { runRetrospective, deriveConvergenceStatus, worstBand, } from "./retrospective/index.js";
//# sourceMappingURL=index.js.map