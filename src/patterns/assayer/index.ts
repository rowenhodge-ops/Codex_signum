// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * @deprecated Assayer is now a Gnosis faculty.
 * Import from '../cognitive/index.js' instead.
 *
 * Types re-exported for backward compatibility only.
 * The Assayer Bloom definition (def:bloom:assayer) is retired.
 * The Compliance Evaluation Resonator lives inside the Gnosis Bloom.
 */

// Legacy Assayer types — preserved for backward compatibility
export type {
  ProposalType,
  InvocationMode,
  StructuralClaim,
  ClaimDependency,
  AxiomResult,
  AntiPatternMatch,
  ClaimValidation,
  ComplianceResult,
  PostFlightResult,
} from "./types.js";

// New: evaluation functions from Gnosis cognitive faculty
export { evaluate } from "../cognitive/evaluation.js";
export { sweep } from "../cognitive/sweep.js";
export type { EvaluationResult, SweepResult, CheckResult } from "../cognitive/types.js";
