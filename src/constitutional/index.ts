// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Constitutional Module Barrel Export
 * @module codex-signum-core/constitutional
 */

export {
  createADR,
  evaluateAxioms,
  evaluateConstitution,
  evaluateRule,
  evaluateRules,
} from "./engine.js";
export type { ComplianceContext, ConstitutionalEvaluation } from "./engine.js";

// Amendment lifecycle
export {
  TIER_CONFIG,
  checkConsensus,
  evaluateAmendment,
  proposeAmendment,
  transitionAmendment,
} from "./evolution.js";
export type {
  Amendment,
  AmendmentLifecycleState,
  Vote,
} from "./evolution.js";
