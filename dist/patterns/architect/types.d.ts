/**
 * Codex Signum — Architect Pattern Types
 * @module codex-signum-core/patterns/architect
 */
/** Input to the SURVEY stage */
export interface SurveyInput {
    /** Absolute path to the repository root */
    repoPath: string;
    /** Paths to specification/design markdown files to cross-reference */
    specificationRefs: string[];
    /** Optional: what the user intends to build (provides focus for gap analysis) */
    intent?: string;
    /** Optional: Neo4j driver session for graph state inspection */
    graphClient?: import("neo4j-driver").Session | null;
}
/** A single gap between specification and implementation */
export interface GapItem {
    id: string;
    description: string;
    severity: "critical" | "warning" | "info";
    /** Which spec document and section this gap relates to */
    specRef?: string;
    /** Which code file(s) this gap relates to */
    codeRef?: string[];
    /** Category for grouping */
    category: "duplication" | "missing" | "mismatch" | "drift" | "structural";
}
/** Something SURVEY couldn't determine */
export interface BlindSpot {
    description: string;
    /** What additional information would resolve this */
    resolution: string;
}
/** Output from the SURVEY stage */
export interface SurveyOutput {
    /** Unique ID for this survey run */
    surveyId: string;
    /** When the survey was performed */
    timestamp: Date;
    /** The intent that was provided (if any) */
    intent?: string;
    codebaseState: {
        /** Summarised directory tree (top 2-3 levels) */
        directorySummary: string[];
        /** Key files found (package.json, tsconfig.json, barrel index.ts) */
        keyFiles: Record<string, string>;
        /** Recent git commits (--oneline format) */
        recentCommits: string[];
        /** Map of files that import from @codex-signum/core */
        coreImports: Record<string, string[]>;
        /** Files detected as duplicating core functionality */
        duplications: Array<{
            localFile: string;
            duplicates: string;
            confidence: "high" | "medium" | "low";
        }>;
        /** Entry point files (CLI scripts, main files) */
        entryPoints: string[];
    };
    graphState: {
        /** Pattern health readings: pattern id → ΦL value */
        patternHealth: Record<string, number>;
        /** Number of active (unresolved) cascade events */
        activeCascades: number;
        /** Recent threshold events (last 7 days) */
        thresholdEvents: string[];
        /** Constitutional alerts from graph */
        constitutionalAlerts: string[];
    } | null;
    gapAnalysis: {
        /** Components/functions confirmed to exist and work */
        whatExists: string[];
        /** Components the spec requires but code doesn't have */
        whatNeedsBuilding: string[];
        /** Components the spec requires that code has incorrectly */
        whatNeedsFixing: string[];
        /** Structured gap items with references */
        gaps: GapItem[];
    };
    /** 0.0-1.0: how confident SURVEY is in its assessment */
    confidence: number;
    /** What SURVEY couldn't determine */
    blindSpots: BlindSpot[];
}
/** Parsed assertion from a specification document */
export interface SpecAssertion {
    /** The assertion text (e.g., "HYSTERESIS_RATIO = 2.5") */
    assertion: string;
    /** Source file and approximate location */
    source: string;
    /** Category: parameter value, interface requirement, architectural rule */
    category: "parameter" | "interface" | "architecture" | "behaviour";
}
//# sourceMappingURL=types.d.ts.map