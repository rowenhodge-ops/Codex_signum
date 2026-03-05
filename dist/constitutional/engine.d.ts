/**
 * Codex Signum — Constitutional Engine
 *
 * Evaluates and enforces axioms + constitutional rules.
 * NOTE: Still evaluates 10 fields (including Symbiosis) for interface compatibility.
 * v4.3 canonical count is 9 (Symbiosis absorbed into A2+A9). Structural migration pending.
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
import type { ArchitectureDecisionRecord, AxiomCompliance, ConstitutionalRule, RuleEvaluation } from "../types/constitutional.js";
import type { EpsilonR, PhiL, PsiH } from "../types/state-dimensions.js";
/** Context for evaluating constitutional compliance */
export interface ComplianceContext {
    phiL?: PhiL;
    psiH?: PsiH;
    epsilonR?: EpsilonR;
    cascadeDepth?: number;
    reviewModelDiffersFromExecute?: boolean;
    memoryStratumFlow?: string;
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
/**
 * Evaluate axioms against the current context.
 *
 * This is a structural check — it verifies that the system
 * is operating within its own rules.
 */
export declare function evaluateAxioms(context: ComplianceContext): AxiomCompliance;
/**
 * Evaluate a set of constitutional rules against the current context.
 */
export declare function evaluateRules(rules: ConstitutionalRule[], context: ComplianceContext): RuleEvaluation[];
/**
 * Evaluate a single constitutional rule.
 */
export declare function evaluateRule(rule: ConstitutionalRule, context: ComplianceContext): RuleEvaluation;
/**
 * Run a complete constitutional evaluation.
 *
 * Returns axiom compliance, rule evaluations, and overall status.
 */
export declare function evaluateConstitution(rules: ConstitutionalRule[], context: ComplianceContext): ConstitutionalEvaluation;
/**
 * Create an Architecture Decision Record.
 *
 * ADRs are permanent records of significant decisions
 * and their rationale plus observed outcomes.
 */
export declare function createADR(params: {
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
}): ArchitectureDecisionRecord;
//# sourceMappingURL=engine.d.ts.map