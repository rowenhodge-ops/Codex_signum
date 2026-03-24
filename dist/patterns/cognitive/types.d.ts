/**
 * Codex Signum — Cognitive Bloom Types
 *
 * Types for the self-knowledge pattern: structural survey, constitutional delta,
 * intent synthesis, and cycle orchestration.
 *
 * @module codex-signum-core/patterns/cognitive
 */
/** Survey of a single Bloom's topology */
export interface BloomSurvey {
    bloomId: string;
    bloomName: string;
    /** Spectral properties */
    lambda2: number;
    psiH: number;
    phiL: number;
    /** Children with their internal state */
    children: Array<{
        id: string;
        name: string;
        labels: string[];
        status: string;
        phiL: number | null;
        psiH: number | null;
        internalMorphemes: Array<{
            id: string;
            name: string;
            labels: string[];
            transformationDefId: string | null;
        }>;
    }>;
    /** Lines between children (inter-edges that affect lambda2) */
    interChildLines: Array<{
        sourceId: string;
        targetId: string;
        type: string;
    }>;
    /** INSTANTIATES edges from all nodes in scope to transformation/bloom definitions */
    instantiatesEdges: Array<{
        fromId: string;
        fromName: string;
        toDefId: string;
        defName: string;
        defSeedType: string;
    }>;
}
/** A gap between current topology and constitutional target */
export interface GapSeed {
    gapId: string;
    gapType: "constitutional" | "topological";
    description: string;
    severity: "mandatory" | "advisory";
    /** For constitutional gaps: which definition is uninstantiated */
    missingDefId?: string;
    missingDefName?: string;
    /** For topological gaps: what spectral improvement is expected */
    expectedLambda2Delta?: number;
    /** For missing Lines: source and target */
    missingLineSource?: string;
    missingLineTarget?: string;
    missingLineType?: string;
}
/** An Intent Seed produced by the Cognitive Bloom for Architect consumption */
export interface CognitiveIntent {
    intentId: string;
    source: "cognitive-bloom";
    cycleNumber: number;
    timestamp: string;
    /** Gap classification */
    gapType: "constitutional" | "topological" | "mixed";
    /** The delta -- what changes are proposed */
    proposedChanges: Array<{
        changeType: "create_resonator" | "create_bloom" | "create_line" | "mutate";
        targetDefId?: string;
        description: string;
        a6Justification?: string;
    }>;
    /** Pre-survey spectral state (for post-cycle comparison) */
    preSurveyLambda2: number;
    preSurveyPsiH: number;
    /** Always true for Cognitive Bloom intents -- forces human GATE */
    governanceModifying: true;
}
/** Transformation definitions from the Constitutional Bloom */
export interface TransformationDef {
    id: string;
    name: string;
    seedType: string;
    ioShape: string;
    scope: string;
}
/** What triggered this evaluation */
export type EvaluationTrigger = "inline_instantiation" | "inline_mutation" | "explicit_evaluate" | "explicit_sweep";
/** Single check result */
export interface CheckResult {
    checkId: string;
    checkName: string;
    passed: boolean;
    severity: "info" | "warning" | "error" | "critical";
    evidence: string;
    remediation?: string;
}
/** Full evaluation result for a single morpheme */
export interface EvaluationResult {
    targetId: string;
    targetType: string;
    trigger: EvaluationTrigger;
    checks: CheckResult[];
    overallVerdict: "pass" | "warning" | "violation";
    violationCount: number;
    warningCount: number;
    processingTimeMs: number;
}
/** Sweep result for batch evaluation */
export interface SweepResult {
    scopeBloomId: string;
    evaluatedCount: number;
    passCount: number;
    violationCount: number;
    warningCount: number;
    results: EvaluationResult[];
    processingTimeMs: number;
}
/** Structural context of a morpheme — read once, used by all check suites */
export interface TargetNode {
    id: string;
    morphemeType: string;
    labels: string[];
    properties: Record<string, unknown>;
    containsParentId: string | null;
    containsParentType: string | null;
    containsChildren: Array<{
        id: string;
        labels: string[];
    }>;
    instantiatesTargets: Array<{
        id: string;
        name: string;
        seedType?: string;
    }>;
    flowsToTargets: Array<{
        id: string;
        labels: string[];
        containsParentId?: string;
    }>;
    flowsFromSources: Array<{
        id: string;
        labels: string[];
        containsParentId?: string;
    }>;
    allRelationshipTypes: string[];
}
//# sourceMappingURL=types.d.ts.map