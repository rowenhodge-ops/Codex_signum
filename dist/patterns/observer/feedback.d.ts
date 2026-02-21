import type { FeedbackRecommendation, ObserverState } from "./types.js";
/** Correction scale: immediate issues in recent pipeline runs. */
export declare function checkCorrectionScale(state: ObserverState): FeedbackRecommendation[];
/** Learning scale: session-level patterns. */
export declare function checkLearningScale(state: ObserverState): FeedbackRecommendation[];
/** Evolutionary scale: cross-session patterns (from distillations). */
export declare function checkEvolutionaryScale(state: ObserverState): FeedbackRecommendation[];
//# sourceMappingURL=feedback.d.ts.map