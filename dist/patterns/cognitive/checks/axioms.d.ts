/**
 * Gnosis Compliance Evaluation — Axiom Checks (A1–A4, A6–A9)
 *
 * Deterministic structural proxies for axiom compliance.
 * Semantic evaluation (e.g., content accuracy) is out of scope — that requires LLM reasoning.
 *
 * @module codex-signum-core/patterns/cognitive/checks/axioms
 */
import type { CheckResult, TargetNode } from "../types.js";
/**
 * Run all axiom checks against a target morpheme.
 */
export declare function checkAxioms(target: TargetNode): Promise<CheckResult[]>;
//# sourceMappingURL=axioms.d.ts.map