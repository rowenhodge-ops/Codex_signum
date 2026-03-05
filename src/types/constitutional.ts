// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Constitutional Rule Types
 *
 * Rules live in the graph as ConstitutionalRule nodes.
 * Not in YAML, not in JSON config files.
 * RULES.md files in pattern directories are documentation —
 * the rules themselves live in the graph.
 *
 * @see codex-signum-v3.0.md §Constitutional Evolution
 * @see codex-signum-implementation-README.md §Non-Negotiable Constraints
 * @module codex-signum-core/types/constitutional
 */

// ============ AMENDMENT TAXONOMY ============

/**
 * Amendment tier — determines threshold for change.
 *
 * Tier 1: Parameter refinement (default values, weights)
 * Tier 2: Structural refinement (axiom language, grammar exceptions)
 * Tier 3: Foundational change (morphemes, axioms, grammar rules)
 */
export type AmendmentTier = 1 | 2 | 3;

/**
 * Amendment status lifecycle.
 */
export type AmendmentStatus =
  | "proposed"
  | "experimenting"
  | "evaluating"
  | "ratified"
  | "deprecated"
  | "reverted";

/**
 * Rule status in the graph.
 */
export type RuleStatus = "active" | "deprecated" | "proposed";

// ============ CONSTITUTIONAL RULE ============

/**
 * A constitutional rule — lives as a node in the Neo4j graph.
 * Rules constrain pattern behavior through GOVERNS relationships.
 */
export interface ConstitutionalRule {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Amendment tier (1=parameter, 2=structural, 3=foundational) */
  tier: AmendmentTier;
  /** Current status */
  status: RuleStatus;
  /**
   * Rule expression — a structured constraint.
   * Not a programming language expression, but a structured constraint definition.
   */
  expression: RuleExpression;
  /** Which patterns this rule governs (by pattern ID) */
  governsPatterns: string[];
  /** Human-readable rationale */
  rationale: string;
  /** Creation timestamp */
  createdAt: Date;
  /** ID of rule this evolved from (if any) */
  evolvedFrom?: string;
  /** Evidence backing this rule (Distillation node IDs) */
  evidencedBy: string[];
}

/**
 * Structured rule expression.
 * Rules express constraints on pattern behavior.
 */
export interface RuleExpression {
  /** What this rule constrains */
  target: RuleTarget;
  /** The constraint type */
  constraint: RuleConstraint;
  /** The threshold/value */
  value: number | string | boolean;
  /** Optional secondary value (for range constraints) */
  maxValue?: number;
  /** Priority level */
  priority: "mandatory" | "preferred" | "advisory";
}

export type RuleTarget =
  | "quality_threshold"
  | "cost_ceiling"
  | "min_phi_l"
  | "max_consecutive_failures"
  | "min_epsilon_r"
  | "max_epsilon_r"
  | "cascade_limit"
  | "hysteresis_ratio"
  | "review_model_differs"
  | "max_correction_iterations"
  | "min_provenance_clarity"
  | "custom";

export type RuleConstraint =
  | "min"
  | "max"
  | "equals"
  | "not_equals"
  | "range"
  | "boolean";

// ============ RULE EVALUATION ============

/**
 * Result of evaluating a constitutional rule against a decision.
 */
export interface RuleEvaluation {
  /** The rule being evaluated */
  ruleId: string;
  /** Whether the rule was satisfied */
  passed: boolean;
  /** The actual value observed */
  actualValue: number | string | boolean;
  /** The threshold from the rule */
  thresholdValue: number | string | boolean;
  /** Timestamp of evaluation */
  evaluatedAt: Date;
  /** Optional notes */
  notes?: string;
}

// ============ ARCHITECTURE DECISION RECORD ============

/**
 * Every constitutional rule change is recorded structurally.
 * Not a report. Not a document. A graph structure.
 *
 * @see reference-patterns-design.md §Architecture Decision Records
 */
export interface ArchitectureDecisionRecord {
  /** Unique identifier */
  decisionId: string;
  /** When this decision was made */
  timestamp: Date;
  /** What prompted this change */
  context: string;
  /** What alternatives were considered */
  alternativesConsidered: string[];
  /** What was selected */
  selected: string;
  /** Why this was chosen */
  rationale: string;
  /** Which ConstitutionalRule nodes are affected */
  affectedRules: string[];
  /** Expected impact on state dimensions */
  expectedImpact: {
    phiL: "improve" | "neutral" | "degrade";
    psiH: "improve" | "neutral" | "degrade";
    epsilonR: "increase" | "neutral" | "decrease";
  };
  /** Filled in after minimum stability period */
  observedImpact?: {
    phiLDelta: number;
    psiHDelta: number;
    epsilonRDelta: number;
    assessment: "confirmed" | "neutral" | "reverted";
  };
}

// ============ AXIOM COMPLIANCE ============

/**
 * Axiom compliance. Binary compliance per axiom.
 * NOTE: Interface retains 10 fields (including Symbiosis) for backward compatibility.
 * v4.3 canonical count is 9 (Symbiosis absorbed into A2+A9). Structural migration pending.
 */
export interface AxiomCompliance {
  /** A1: Symbiosis — enables collaboration between intelligences */
  symbiosis: boolean;
  /** A2: Transparency — every signal interpretable by receiver */
  transparency: boolean;
  /** A3: Fidelity — representation matches actual state */
  fidelity: boolean;
  /** A4: Visible State — health/activity/connection expressed structurally */
  visibleState: boolean;
  /** A5: Minimal Authority — request only needed resources */
  minimalAuthority: boolean;
  /** A6: Provenance — every element carries origin signature */
  provenance: boolean;
  /** A7: Reversibility — transformations reversible unless terminal */
  reversibility: boolean;
  /** A8: Semantic Stability — morpheme meanings fixed */
  semanticStability: boolean;
  /** A9: Comprehension Primacy — understanding wins over efficiency */
  comprehensionPrimacy: boolean;
  /** A10: Adaptive Pressure — patterns evolve through visible feedback */
  adaptivePressure: boolean;
}

/**
 * Compute axiom compliance fraction (0.0–1.0).
 */
export function computeAxiomComplianceFraction(
  axioms: AxiomCompliance,
): number {
  const values = Object.values(axioms);
  const satisfied = values.filter(Boolean).length;
  return satisfied / values.length;
}
