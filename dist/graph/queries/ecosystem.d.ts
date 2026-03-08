/** Milestone overview entry from the ecosystem graph */
export interface MilestoneOverviewEntry {
    id: string;
    name: string;
    type: "milestone" | "sub-milestone";
    status: string;
    phiL: number;
    sequence: number;
    parentId?: string;
    childCount: number;
    testCount: number;
}
/**
 * Get an overview of all milestones in the ecosystem graph.
 * Returns milestone Blooms with child counts and test counts.
 */
export declare function getMilestoneOverview(): Promise<MilestoneOverviewEntry[]>;
/** Future test entry from the ecosystem graph */
export interface FutureTestEntry {
    id: string;
    name: string;
    status: string;
    suiteId: string;
}
/**
 * Get all future-scoped test Seeds targeting a specific milestone.
 * Returns test Seed nodes connected via SCOPED_TO.
 */
export declare function getFutureTestsForMilestone(milestoneId: string): Promise<FutureTestEntry[]>;
/** Hypothesis status entry from the ecosystem graph */
export interface HypothesisStatusEntry {
    id: string;
    claim: string;
    status: string;
    evidenceStrength: number;
    observesMilestone: string;
}
/**
 * Get all hypothesis Helix nodes with their observed milestone.
 * Returns hypothesis data with OBSERVES relationship targets.
 */
export declare function getHypothesisStatus(): Promise<HypothesisStatusEntry[]>;
/** Grammar element entry from the graph */
export interface GrammarElementEntry {
    id: string;
    seedType: string;
    name: string;
    description: string;
    specSource: string;
    implementationStatus: string;
    implementationNotes: string;
    codeLocation: string | null;
}
/**
 * Get grammar elements, optionally filtered by category (seedType).
 * Answers: "What morphemes/axioms/rules exist and what's their implementation status?"
 */
export declare function getGrammarElements(category?: string): Promise<GrammarElementEntry[]>;
/** Grammar implementation coverage summary */
export interface GrammarCoverageEntry {
    total: number;
    complete: number;
    partial: number;
    typesOnly: number;
    notStarted: number;
    aspirational: number;
}
/**
 * Get implementation coverage summary for all grammar elements.
 * Answers: "How much of the grammar is implemented?"
 */
export declare function getGrammarCoverage(): Promise<GrammarCoverageEntry>;
/** Axiom dependency chain entry */
export interface AxiomDependencyEntry {
    axiomId: string;
    axiomName: string;
    dependsOn: string[];
    dependedOnBy: string[];
}
/**
 * Get axiom dependency chains (DAG).
 * Answers: "What axioms depend on A2 Visible State?"
 */
export declare function getAxiomDependencies(axiomId?: string): Promise<AxiomDependencyEntry[]>;
/** Anti-pattern violation entry */
export interface AntiPatternViolationEntry {
    antiPatternId: string;
    antiPatternName: string;
    violatesAxiom: string;
    violatesAxiomName: string;
    implementationStatus: string;
}
/**
 * Get anti-pattern to axiom VIOLATES mappings.
 * Answers: "Which anti-patterns violate A2?"
 */
export declare function getAntiPatternViolations(axiomId?: string): Promise<AntiPatternViolationEntry[]>;
/** Pattern topology entry — a pattern with its stages and data flows */
export interface PatternTopologyEntry {
    patternId: string;
    patternName: string;
    patternType: string;
    stages: Array<{
        id: string;
        role: string;
        name: string;
    }>;
    flows: Array<{
        from: string;
        to: string;
    }>;
}
/**
 * Get all patterns with their stages (Resonators) and data flows.
 * Returns the runtime topology of each pattern.
 *
 * @param patternId - Optional filter for a specific pattern
 */
export declare function getPatternTopology(patternId?: string): Promise<PatternTopologyEntry[]>;
/** Visualisation node entry */
export interface VisNodeEntry {
    id: string;
    label: string;
    type: string;
    name: string;
    properties: Record<string, unknown>;
}
/** Visualisation relationship entry */
export interface VisRelationshipEntry {
    from: string;
    to: string;
    type: string;
}
/** Full visualisation topology */
export interface VisualisationTopology {
    nodes: VisNodeEntry[];
    relationships: VisRelationshipEntry[];
}
/**
 * Get the full graph topology for visualisation.
 * Returns all morpheme nodes (Bloom, Seed, Resonator, Helix, Grid)
 * and their relationships.
 */
export declare function getVisualisationTopology(): Promise<VisualisationTopology>;
/** Grammar instance mapping entry */
export interface GrammarInstanceEntry {
    instanceId: string;
    instanceLabel: string;
    grammarElementId: string;
    grammarElementName: string;
}
/**
 * Get INSTANTIATES mappings — which runtime elements are instances
 * of which grammar definitions.
 */
export declare function getGrammarInstances(): Promise<GrammarInstanceEntry[]>;
//# sourceMappingURL=ecosystem.d.ts.map