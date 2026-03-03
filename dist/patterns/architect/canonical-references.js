// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
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
export const DOCUMENT_NAME_MAP = {
    // Core protocol
    "v3.0 spec": "docs/specs/01_codex-signum-v3_0.md",
    "v3.0": "docs/specs/01_codex-signum-v3_0.md",
    "codex v3.0": "docs/specs/01_codex-signum-v3_0.md",
    "codex-signum-v3_0": "docs/specs/01_codex-signum-v3_0.md",
    // Engineering Bridge (implementation authority)
    "engineering bridge": "docs/specs/05_codex-signum-engineering-bridge-v2_0.md",
    "bridge v2.0": "docs/specs/05_codex-signum-engineering-bridge-v2_0.md",
    "bridge": "docs/specs/05_codex-signum-engineering-bridge-v2_0.md",
    "engineering bridge v2.0": "docs/specs/05_codex-signum-engineering-bridge-v2_0.md",
    // Adaptive imperative boundaries
    "v3.1": "docs/specs/02_codex-signum-v3_1-adaptive-imperative-boundaries.md",
    "v3.1 spec": "docs/specs/02_codex-signum-v3_1-adaptive-imperative-boundaries.md",
    "adaptive imperative boundaries": "docs/specs/02_codex-signum-v3_1-adaptive-imperative-boundaries.md",
    // Lean process maps
    "lean process maps": "docs/specs/03_codex-signum-lean-process-maps-v2.md",
    "lean maps": "docs/specs/03_codex-signum-lean-process-maps-v2.md",
    // OpEx addendum
    "opex addendum": "docs/specs/04_codex-signum-opex-addendum-v2.md",
    "opex": "docs/specs/04_codex-signum-opex-addendum-v2.md",
    // Architect pattern
    "architect pattern": "docs/specs/06_codex-signum-architect-pattern-design.md",
    "architect design": "docs/specs/06_codex-signum-architect-pattern-design.md",
    // Research pattern
    "research pattern": "docs/specs/07_codex-signum-research-pattern-design.md",
    // Attunement
    "attunement": "docs/specs/08_codex-signum-attunement-v0_2.md",
    "attunement spec": "docs/specs/08_codex-signum-attunement-v0_2.md",
    // Reference patterns (un-numbered but tracked)
    "reference patterns": "docs/specs/codex-signum-reference-patterns-design.md",
    "pattern exchange": "docs/specs/codex-signum-pattern-exchange-protocol.md",
    "research index": "docs/specs/codex-signum-research-index.md",
};
/**
 * Extract all file path references from LLM output text.
 *
 * Matches:
 * - docs/specs/... style paths
 * - src/... style paths
 * - Backtick-quoted paths
 */
export function extractPathReferences(output) {
    const paths = [];
    const pathPattern = /(?:`([^`]+\.(?:ts|md|js))`|(?:docs\/|src\/)[\w./-]+)/g;
    let match;
    while ((match = pathPattern.exec(output)) !== null) {
        paths.push(match[1] ?? match[0]);
    }
    return [...new Set(paths)];
}
/**
 * Extract document name references from LLM output and resolve to file paths.
 *
 * Uses DOCUMENT_NAME_MAP for known references. Only mapped names are checked —
 * unknown document references do not produce signals (to avoid false positives).
 */
export function resolveDocumentReferences(output) {
    const resolved = [];
    const lowerOutput = output.toLowerCase();
    for (const [ref, path] of Object.entries(DOCUMENT_NAME_MAP)) {
        if (lowerOutput.includes(ref.toLowerCase())) {
            resolved.push(path);
        }
    }
    return [...new Set(resolved)];
}
//# sourceMappingURL=canonical-references.js.map