/**
 * Gnosis Compliance Evaluation — Anti-Pattern Structural Signature Detection
 *
 * Detects the 6 foundational anti-patterns from v5.0 spec via structural signatures.
 * Conservative: defaults to severity "warning" to minimise false positives.
 *
 * @module codex-signum-core/patterns/cognitive/checks/anti-patterns
 */
import type { CheckResult, TargetNode } from "../types.js";
/**
 * Run all anti-pattern checks against a target morpheme.
 */
export declare function checkAntiPatterns(target: TargetNode): Promise<CheckResult[]>;
//# sourceMappingURL=anti-patterns.d.ts.map