/**
 * Codex Signum — SURVEY Stage Implementation
 *
 * A pure function that reads filesystem and git state to produce a
 * structured audit of a repository's alignment with @codex-signum/core.
 *
 * Does NOT call any LLM. Does NOT require Neo4j. Is deterministic
 * given the same filesystem state.
 *
 * @module codex-signum-core/patterns/architect
 */
import type { BlindSpot, DocumentSource, ExtractedClaim, SurveyInput, SurveyOutput } from "./types.js";
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
//# sourceMappingURL=survey.d.ts.map