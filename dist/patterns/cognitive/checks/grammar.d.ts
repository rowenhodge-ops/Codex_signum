/**
 * Gnosis Compliance Evaluation — Grammar Rule Checks (G1–G5 + G6-highlander)
 *
 * Deterministic structural checks against the v5.0 grammar.
 * No LLM invocation. Pure structural inspection of TargetNode context.
 *
 * @module codex-signum-core/patterns/cognitive/checks/grammar
 */
import type { CheckResult, TargetNode } from "../types.js";
/**
 * Run all grammar rule checks against a target morpheme.
 */
export declare function checkGrammar(target: TargetNode): Promise<CheckResult[]>;
//# sourceMappingURL=grammar.d.ts.map