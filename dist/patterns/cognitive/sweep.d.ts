/**
 * Gnosis Compliance Evaluation — Batch Sweep
 *
 * Evaluates all morphemes within a Bloom's CONTAINS tree.
 * Used for backlog scanning and structural health assessment.
 *
 * @module codex-signum-core/patterns/cognitive/sweep
 */
import type { SweepResult } from "./types.js";
/**
 * Evaluate all morphemes within a Bloom's CONTAINS tree.
 *
 * @param bloomId - Root Bloom to sweep
 * @param options - { maxDepth, includeComplete }
 * @returns SweepResult with per-morpheme evaluations
 */
export declare function sweep(bloomId: string, options?: {
    maxDepth?: number;
    includeComplete?: boolean;
}): Promise<SweepResult>;
//# sourceMappingURL=sweep.d.ts.map