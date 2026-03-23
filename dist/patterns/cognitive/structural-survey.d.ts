import type { BloomSurvey } from "./types.js";
/**
 * Survey a Bloom's topology: children, inter-child Lines, spectral properties,
 * and INSTANTIATES edges. Purely deterministic -- Cypher queries only.
 *
 * @param bloomId - The Bloom to survey
 * @returns BloomSurvey with full topology snapshot
 * @throws Error if the target Bloom does not exist
 */
export declare function surveyBloomTopology(bloomId: string): Promise<BloomSurvey>;
//# sourceMappingURL=structural-survey.d.ts.map