import type { BloomSurvey, GapSeed, TransformationDef } from "./types.js";
/**
 * Query all transformation-level and bloom-level definitions from the Constitutional Bloom.
 */
export declare function queryTransformationDefinitions(): Promise<TransformationDef[]>;
/**
 * Compute the delta between a BloomSurvey and the constitutional definitions.
 *
 * Constitutional gaps (mandatory):
 * - Definition exists but no active instance INSTANTIATES it
 * - Instance exists but expected FLOWS_TO Lines are missing
 * - Stage Bloom has zero internal Resonators
 *
 * Topological gaps (advisory):
 * - lambda2 = 0 (disconnected components)
 * - lambda2 below maturity-indexed threshold
 * - Purely sequential chain topology (CPT v3 targets DAG)
 *
 * @param survey - BloomSurvey from the Structural Survey Resonator
 * @param definitions - All transformation/bloom definitions from Constitutional Bloom
 * @param scope - Which definition scopes to check
 */
export declare function computeConstitutionalDelta(survey: BloomSurvey, definitions: TransformationDef[], scope: string[]): GapSeed[];
//# sourceMappingURL=constitutional-delta.d.ts.map