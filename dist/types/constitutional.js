/**
 * Codex Signum — Constitutional Rule Types
 *
 * Rules live in the graph as ConstitutionalRule nodes.
 * Not in YAML, not in JSON config files.
 * RULES.md files in pattern directories are documentation —
 * the rules themselves live in the graph.
 *
 * @see codex-signum-v3.0.md §Constitutional Evolution
 * @see codex-signum-implementation-README.md §Non-Negotiable Constraints
 * @module codex-signum-core/types/constitutional
 */
/**
 * Compute axiom compliance fraction (0.0–1.0).
 */
export function computeAxiomComplianceFraction(axioms) {
    const values = Object.values(axioms);
    const satisfied = values.filter(Boolean).length;
    return satisfied / values.length;
}
//# sourceMappingURL=constitutional.js.map