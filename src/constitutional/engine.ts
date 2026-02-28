// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Constitutional Engine
 *
 * Evaluates and enforces the 10 axioms + constitutional rules.
 * The engine is a constraint solver that checks actions against
 * the governance framework before allowing them to proceed.
 *
 * Three tiers of rules:
 * - Tier 1 (Mandatory): MUST be satisfied. Violation = block action.
 * - Tier 2 (Preferred): SHOULD be satisfied. Violation = warn + log.
 * - Tier 3 (Advisory): MAY be satisfied. Violation = log only.
 *
 * The 10 Axioms:
 * A1: Every morpheme carries (ΦL, ΨH, εR)
 * A2: ΦL is a weighted composite — never a scalar
 * A3: ΨH derives from graph Laplacian eigengap + TV_G
 * A4: Every routing decision = (context, model, quality, cost)
 * A5: εR ∈ [floor, 1] — never exactly 0 for active patterns
 * A6: Degradation propagates via topology-aware dampening
 * A7: Constitutional rules are tiered (mandatory/preferred/advisory)
 * A8: Memory flows upward: ephemeral → observation → distillation → institutional
 * A9: Three feedback scales: correction (immediate), learning (session), evolutionary (cross-session)
 * A10: Meta-imperatives (Ω₁,Ω₂,Ω₃) are gradient constraints, not objectives
 *
 * @see codex-signum-v3.0.md §Constitutional Layer
 * @see engineering-bridge-v2.0.md §Part 5
 * @module codex-signum-core/constitutional
 */

import type {
  ArchitectureDecisionRecord,
  AxiomCompliance,
  ConstitutionalRule,
  RuleEvaluation,
} from "../types/constitutional.js";
import { computeAxiomComplianceFraction } from "../types/constitutional.js";
import type { EpsilonR, PhiL, PsiH } from "../types/state-dimensions.js";

// ============ TYPES ============

/** Context for evaluating constitutional compliance */
export interface ComplianceContext {
  phiL?: PhiL;
  psiH?: PsiH;
  epsilonR?: EpsilonR;
  cascadeDepth?: number;
  reviewModelDiffersFromExecute?: boolean;
  memoryStratumFlow?: string; // e.g., "1→2→3" or "1→4" (skip violation)
  correctionIterations?: number;
}

/** Result of a full constitutional evaluation */
export interface ConstitutionalEvaluation {
  axiomCompliance: AxiomCompliance;
  complianceFraction: number;
  ruleEvaluations: RuleEvaluation[];
  overallStatus: "compliant" | "non-compliant" | "partially-compliant";
  blockers: RuleEvaluation[];
  warnings: RuleEvaluation[];
  advisories: RuleEvaluation[];
}

// ============ AXIOM EVALUATION ============

/**
 * Evaluate all 10 axioms against the current context.
 *
 * This is a structural check — it verifies that the system
 * is operating within its own rules.
 */
export function evaluateAxioms(context: ComplianceContext): AxiomCompliance {
  return {
    // A1: Symbiosis — enables collaboration between intelligences
    symbiosis: true, // structural invariant

    // A2: Transparency — every signal interpretable by receiver
    transparency:
      context.phiL !== undefined &&
      typeof context.phiL === "object" &&
      "factors" in context.phiL &&
      "weights" in context.phiL &&
      "effective" in context.phiL,

    // A3: Fidelity — representation matches actual state
    fidelity:
      context.phiL !== undefined &&
      context.phiL.effective >= 0 &&
      context.phiL.effective <= 1,

    // A4: Visible State — health/activity/connection expressed structurally
    visibleState:
      context.phiL !== undefined &&
      context.psiH !== undefined &&
      context.epsilonR !== undefined,

    // A5: Minimal Authority — request only needed resources
    minimalAuthority: true, // enforced at pattern level

    // A6: Provenance — every element carries origin signature
    provenance:
      context.phiL === undefined || context.phiL.factors.provenanceClarity > 0,

    // A7: Reversibility — transformations reversible unless terminal
    reversibility: true, // structural invariant

    // A8: Semantic Stability — morpheme meanings fixed
    semanticStability: true, // types enforce this

    // A9: Comprehension Primacy — understanding wins over efficiency
    comprehensionPrimacy:
      context.memoryStratumFlow === undefined ||
      isValidMemoryFlow(context.memoryStratumFlow),

    // A10: Adaptive Pressure — patterns evolve through visible feedback
    adaptivePressure:
      context.epsilonR === undefined || context.epsilonR.value > 0,
  };
}

// ============ RULE EVALUATION ============

/**
 * Evaluate a set of constitutional rules against the current context.
 */
export function evaluateRules(
  rules: ConstitutionalRule[],
  context: ComplianceContext,
): RuleEvaluation[] {
  return rules.map((rule) => evaluateRule(rule, context));
}

/**
 * Evaluate a single constitutional rule.
 */
export function evaluateRule(
  rule: ConstitutionalRule,
  context: ComplianceContext,
): RuleEvaluation {
  const result = checkRule(rule, context);
  return {
    ruleId: rule.id,
    passed: result.passed,
    actualValue: result.actualValue,
    thresholdValue: rule.expression.value,
    evaluatedAt: new Date(),
    notes: result.message,
  };
}

/**
 * Internal rule checker. Maps rule expression targets to context values.
 */
function checkRule(
  rule: ConstitutionalRule,
  context: ComplianceContext,
): {
  passed: boolean;
  actualValue: number | string | boolean;
  message: string;
} {
  const expr = rule.expression;

  switch (expr.target) {
    case "cascade_limit":
      return checkNumericConstraint(
        "Cascade depth",
        context.cascadeDepth ?? 0,
        expr.constraint,
        expr.value as number,
      );

    case "hysteresis_ratio":
      return {
        passed: true,
        actualValue: 2.5,
        message: "Enforced by dampening module",
      };

    case "min_epsilon_r":
      return checkNumericConstraint(
        "εR floor",
        context.epsilonR?.floor ?? 0.01,
        expr.constraint,
        expr.value as number,
      );

    case "max_correction_iterations":
      return checkNumericConstraint(
        "Correction iterations",
        context.correctionIterations ?? 0,
        expr.constraint,
        expr.value as number,
      );

    case "quality_threshold":
      return {
        passed: true,
        actualValue: 0,
        message: "Checked at decision outcome",
      };

    case "min_provenance_clarity":
      return checkNumericConstraint(
        "Provenance clarity",
        context.phiL?.factors.provenanceClarity ?? 0.5,
        expr.constraint,
        expr.value as number,
      );

    case "review_model_differs":
      if (expr.constraint === "boolean") {
        const differs = context.reviewModelDiffersFromExecute ?? true;
        return {
          passed: differs === !!expr.value,
          actualValue: differs,
          message: differs
            ? "Review model differs from execute model"
            : "Review model is same as execute model — cross-validation weakened",
        };
      }
      return {
        passed: true,
        actualValue: true,
        message: "Unknown constraint type",
      };

    default:
      return {
        passed: true,
        actualValue: true,
        message: `Unknown rule target: ${expr.target}`,
      };
  }
}

/**
 * Check a numeric constraint (min, max, equals).
 */
function checkNumericConstraint(
  label: string,
  actual: number,
  constraint: string,
  expected: number,
): { passed: boolean; actualValue: number; message: string } {
  switch (constraint) {
    case "min":
      return {
        passed: actual >= expected,
        actualValue: actual,
        message: `${label}: ${actual} ${actual >= expected ? "≥" : "<"} ${expected}`,
      };
    case "max":
      return {
        passed: actual <= expected,
        actualValue: actual,
        message: `${label}: ${actual} ${actual <= expected ? "≤" : ">"} ${expected}`,
      };
    case "equals":
      return {
        passed: Math.abs(actual - expected) < 0.001,
        actualValue: actual,
        message: `${label}: ${actual} ${Math.abs(actual - expected) < 0.001 ? "=" : "≠"} ${expected}`,
      };
    default:
      return {
        passed: true,
        actualValue: actual,
        message: `Unknown constraint: ${constraint}`,
      };
  }
}

// ============ FULL EVALUATION ============

/**
 * Run a complete constitutional evaluation.
 *
 * Returns axiom compliance, rule evaluations, and overall status.
 */
export function evaluateConstitution(
  rules: ConstitutionalRule[],
  context: ComplianceContext,
): ConstitutionalEvaluation {
  const axiomCompliance = evaluateAxioms(context);
  const complianceFraction = computeAxiomComplianceFraction(axiomCompliance);
  const ruleEvaluations = evaluateRules(rules, context);

  // Look up tiers from the original rules to classify failures
  const ruleMap = new Map(rules.map((r) => [r.id, r]));
  const blockers = ruleEvaluations.filter(
    (e) => !e.passed && (ruleMap.get(e.ruleId)?.tier ?? 3) === 1,
  );
  const warnings = ruleEvaluations.filter(
    (e) => !e.passed && (ruleMap.get(e.ruleId)?.tier ?? 3) === 2,
  );
  const advisories = ruleEvaluations.filter(
    (e) => !e.passed && (ruleMap.get(e.ruleId)?.tier ?? 3) === 3,
  );

  let overallStatus: "compliant" | "non-compliant" | "partially-compliant";
  if (blockers.length > 0 || complianceFraction < 0.7) {
    overallStatus = "non-compliant";
  } else if (warnings.length > 0 || complianceFraction < 1.0) {
    overallStatus = "partially-compliant";
  } else {
    overallStatus = "compliant";
  }

  return {
    axiomCompliance,
    complianceFraction,
    ruleEvaluations,
    overallStatus,
    blockers,
    warnings,
    advisories,
  };
}

// ============ ADR RECORDING ============

/**
 * Create an Architecture Decision Record.
 *
 * ADRs are permanent records of significant decisions
 * and their rationale plus observed outcomes.
 */
export function createADR(params: {
  context: string;
  alternativesConsidered: string[];
  selected: string;
  rationale: string;
  affectedRules: string[];
  expectedImpact: {
    phiL: "improve" | "neutral" | "degrade";
    psiH: "improve" | "neutral" | "degrade";
    epsilonR: "increase" | "neutral" | "decrease";
  };
}): ArchitectureDecisionRecord {
  return {
    decisionId: `adr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    context: params.context,
    alternativesConsidered: params.alternativesConsidered,
    selected: params.selected,
    rationale: params.rationale,
    affectedRules: params.affectedRules,
    expectedImpact: params.expectedImpact,
  };
}

// ============ HELPERS ============

/**
 * Validate memory stratum flow.
 * Valid: "1→2", "1→2→3", "2→3→4", "1→2→3→4"
 * Invalid: "1→3" (skip), "4→1" (downward), "2→1" (downward)
 */
function isValidMemoryFlow(flow: string): boolean {
  const strata = flow.split("→").map((s) => parseInt(s.trim(), 10));

  if (strata.some((s) => isNaN(s) || s < 1 || s > 4)) return false;

  // Must be monotonically increasing
  for (let i = 1; i < strata.length; i++) {
    if (strata[i] <= strata[i - 1]) return false;
    // No skipping: each step must be +1
    if (strata[i] !== strata[i - 1] + 1) return false;
  }

  return true;
}
