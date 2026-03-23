/**
 * Intent Synthesis Resonator
 *
 * Transforms Gap Seeds into Intent Seeds for Architect consumption.
 *
 * - Constitutional gaps -> deterministic intent (missing instance -> create intent)
 * - Topological gaps -> LLM substrate (via shared LLM Invocation Resonator) for
 *   reasoning about which edges to add
 *
 * Instantiation: resonator:intent-synthesis
 * Definition: def:transformation:intent-synthesis
 * I/O Shape: Gaps->Intent (compression)
 *
 * @module codex-signum-core/patterns/cognitive/intent-synthesis
 */
import type { GapSeed, CognitiveIntent } from "./types.js";
import type { ModelExecutor } from "../architect/types.js";
/**
 * Synthesise an Intent Seed from Gap Seeds.
 *
 * @param gaps - Gap Seeds from Constitutional Delta Resonator
 * @param cycleNumber - Which survey cycle this is (for tracking)
 * @param preLambda2 - lambda2 before this cycle (for post-cycle comparison)
 * @param prePsiH - PsiH before this cycle
 * @param maxChanges - Max proposed changes per intent (from Config Seed)
 * @param priorityWeights - From Config Seed, calibrated by Learning Helix
 * @param modelExecutor - Optional: LLM substrate for topological gap reasoning
 * @param cptSpecContent - Optional: CPT v3 spec Seed content for topological context
 * @param knownNodeIds - Optional: set of valid node IDs for hallucination guard
 */
export declare function synthesizeIntent(gaps: GapSeed[], cycleNumber: number, preLambda2: number, prePsiH: number, maxChanges: number, priorityWeights: {
    constitutional: number;
    lambda2: number;
    phiL: number;
}, modelExecutor?: ModelExecutor, cptSpecContent?: string, knownNodeIds?: Set<string>): Promise<CognitiveIntent>;
//# sourceMappingURL=intent-synthesis.d.ts.map