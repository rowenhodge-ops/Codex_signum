/**
 * Gnosis Compliance Evaluation — structural cognition faculty.
 *
 * Deterministic structural checks against grammar, axioms, and anti-patterns.
 * No LLM invocation. Pure Cypher queries.
 *
 * Recursion boundary: Violation Seeds and observation Seeds are written
 * via raw Cypher, not through instantiateMorpheme(). Same structural
 * justification as recordInstantiationObservation() — the governance
 * layer observing itself, one level only.
 *
 * @module codex-signum-core/patterns/cognitive/evaluation
 */
import type { EvaluationResult, EvaluationTrigger, TargetNode } from "./types.js";
/**
 * Evaluate a single morpheme for structural compliance.
 *
 * @param targetId - ID of the morpheme to evaluate
 * @param trigger - What triggered this evaluation
 * @returns EvaluationResult with per-check findings
 */
export declare function evaluate(targetId: string, trigger: EvaluationTrigger): Promise<EvaluationResult>;
/**
 * Read a morpheme's full structural context in sequential WITH-chained collections.
 * Avoids Cartesian product from multiple OPTIONAL MATCH in a single RETURN.
 */
export declare function readTargetNode(targetId: string): Promise<TargetNode | null>;
//# sourceMappingURL=evaluation.d.ts.map