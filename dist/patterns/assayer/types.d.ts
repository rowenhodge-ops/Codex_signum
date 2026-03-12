/**
 * Codex Signum — Assayer Pattern Types
 *
 * Structural validation pattern: 4 stages (CLASSIFY → DECOMPOSE → VALIDATE → SYNTHESISE),
 * 4 invocation modes (advisory, gate, post-flight, historical).
 *
 * Types only — full pipeline implementation is M-18.
 * Design: docs/specs/09_codex-signum-assayer-pattern-design.md
 *
 * @module codex-signum-core/patterns/assayer
 */
/** What kind of proposal is being assessed */
export type ProposalType = "code_change" | "spec_edit" | "architecture_decision" | "process_change" | "prompt_template";
/** How the Assayer was invoked — determines response behaviour */
export type InvocationMode = "advisory" | "gate" | "post_flight" | "historical";
/** A single structural claim extracted from a proposal */
export interface StructuralClaim {
    claimId: string;
    description: string;
    claimType: "entity_introduction" | "flow_establishment" | "boundary_modification" | "construct_replacement" | "concept_declaration";
    affectedMorphemes: string[];
    affectedAxioms: string[];
    evidence: string;
}
/** Dependency between claims within a proposal */
export interface ClaimDependency {
    from: string;
    to: string;
    relationship: "enables" | "conflicts_with" | "modifies_same_scope";
}
/** Per-axiom validation result */
export interface AxiomResult {
    axiom: string;
    axiomName: string;
    satisfied: boolean;
    evidence: string;
    confidence: number;
}
/** Anti-pattern match result */
export interface AntiPatternMatch {
    antiPattern: string;
    matchConfidence: number;
    evidence: string;
    structuralSimilarity: number;
}
/** Per-claim validation result */
export interface ClaimValidation {
    claimId: string;
    grammarExpressible: boolean;
    grammarMapping: string | null;
    grammarIssues: Array<{
        rule: string;
        description: string;
        severity: "minor" | "major" | "critical";
    }>;
    axiomResults: AxiomResult[];
    antiPatternMatches: AntiPatternMatch[];
    overallSeverity: "clear" | "minor" | "major" | "critical";
    refinementPossible: boolean;
    refinementSuggestion: string | null;
}
/** Full compliance assessment output */
export interface ComplianceResult {
    proposalId: string;
    proposalType: ProposalType;
    invocationMode: InvocationMode;
    claims: StructuralClaim[];
    validations: ClaimValidation[];
    compoundEffects: Array<{
        description: string;
        interactingClaims: string[];
        severity: "minor" | "major" | "critical";
    }>;
    overallVerdict: "compliant" | "minor_issues" | "major_issues" | "non_compliant";
    confidence: number;
    processingTimeMs: number;
}
/** Post-flight analysis result (retrospective mode) */
export interface PostFlightResult extends ComplianceResult {
    runId: string;
    retrospectiveInsights: Array<{
        pattern: string;
        frequency: number;
        recommendation: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map