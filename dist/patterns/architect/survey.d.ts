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
import type { SurveyInput, SurveyOutput } from "./types.js";
/**
 * SURVEY — The Architect's reconnaissance stage.
 *
 * Reads the filesystem and git history of a repository and produces a
 * structured gap analysis comparing the codebase state against known
 * @codex-signum/core architectural expectations.
 */
export declare function survey(input: SurveyInput): Promise<SurveyOutput>;
//# sourceMappingURL=survey.d.ts.map