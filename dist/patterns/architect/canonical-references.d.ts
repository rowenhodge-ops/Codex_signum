/**
 * Canonical reference constants for the Codex Signum specification corpus.
 *
 * Maps common natural-language references to their canonical file paths
 * in docs/specs/. Used by source verification to detect unsourced references
 * (claims about spec content when the spec was not in the task's context).
 *
 * @module codex-signum-core/patterns/architect/canonical-references
 */
/**
 * Maps natural-language document references to their canonical paths.
 * Keys are lowercased for case-insensitive matching.
 * Values are repo-relative paths (docs/specs/...).
 */
export declare const DOCUMENT_NAME_MAP: Record<string, string>;
/**
 * Extract all file path references from LLM output text.
 *
 * Matches:
 * - docs/specs/... style paths
 * - src/... style paths
 * - Backtick-quoted paths
 */
export declare function extractPathReferences(output: string): string[];
/**
 * Extract document name references from LLM output and resolve to file paths.
 *
 * Uses DOCUMENT_NAME_MAP for known references. Only mapped names are checked —
 * unknown document references do not produce signals (to avoid false positives).
 */
export declare function resolveDocumentReferences(output: string): string[];
//# sourceMappingURL=canonical-references.d.ts.map