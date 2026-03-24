// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Cognitive Bloom Pattern Barrel Export
 * @module codex-signum-core/patterns/cognitive
 */

export { surveyBloomTopology } from "./structural-survey.js";
export { queryTransformationDefinitions, computeConstitutionalDelta } from "./constitutional-delta.js";
export { synthesizeIntent } from "./intent-synthesis.js";
export { runCognitiveCycle } from "./cognitive-cycle.js";

// Planning faculty
export { runPlanningCycle, scorePlanningIntent, inferScopesForBloom, categoriseMilestone } from "./planning.js";

// Compliance Evaluation faculty
export { evaluate, readTargetNode } from "./evaluation.js";
export { sweep } from "./sweep.js";
export { checkGrammar } from "./checks/grammar.js";
export { checkAxioms } from "./checks/axioms.js";
export { checkAntiPatterns } from "./checks/anti-patterns.js";

export type {
  BloomSurvey,
  GapSeed,
  CognitiveIntent,
  TransformationDef,
  // Compliance Evaluation types
  EvaluationTrigger,
  EvaluationResult,
  CheckResult,
  SweepResult,
  TargetNode,
} from "./types.js";
export type { CognitiveCycleOptions } from "./cognitive-cycle.js";

// Planning types
export type {
  IntentCategory,
  PlanningIntent,
  PlanningReport,
  BloomStateEntry,
  ViolationEntry,
  MilestoneEntry,
} from "./planning-types.js";
