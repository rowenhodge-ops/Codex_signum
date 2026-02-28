import type { BlindSpot, DocumentSource, ExtractedClaim, SurveyInput, SurveyOutput, TrackedHypothesis } from "./types.js";
/**
 * SURVEY — The Architect's reconnaissance stage.
 *
 * Reads the filesystem and git history of a repository and produces a
 * structured gap analysis comparing the codebase state against known
 * @codex-signum/core architectural expectations.
 */
export declare function survey(input: SurveyInput): Promise<SurveyOutput>;
/**
 * Extract typed claims from a document's content.
 *
 * Catches formulas (Greek letters, math notation), thresholds (numeric bounds),
 * warnings (dangerous patterns, supercritical flags), recommendations
 * (fix suggestions), and architectural assertions.
 *
 * Exported for testing.
 */
export declare function extractClaims(content: string, _sourcePath: string): ExtractedClaim[];
/**
 * Discover all .md files under the given docs paths, read them (capped at 16000 chars),
 * extract a title, and run claim extraction on each.
 */
export declare function discoverDocumentSources(repoPath: string, docsPaths: string[], blindSpots: BlindSpot[]): DocumentSource[];
/**
 * Parse hypothesis files from docs/hypotheses/.
 * Returns structured hypothesis records for gap analysis.
 *
 * Exported for testing.
 */
export declare function parseHypotheses(repoPath: string, hypothesesPath: string): TrackedHypothesis[];
//# sourceMappingURL=survey.d.ts.map