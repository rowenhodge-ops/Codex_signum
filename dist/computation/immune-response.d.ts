import type { TriggerInputState, TriggeredEvent } from "./structural-triggers.js";
import type { StructuralReviewResult } from "./structural-review.js";
export interface Recommendation {
    diagnostic: string;
    action: string;
    severity: string;
}
/**
 * Assemble TriggerInputState from live graph state.
 * Reads all data needed for the 6 trigger conditions from Neo4j.
 *
 * This is the bridge between graph state and the immune system.
 * After M-22.1–M-22.6, all required data is live on Bloom nodes.
 *
 * Uses safe defaults for missing data — absent data never fires triggers.
 */
export declare function assembleTriggerState(bloomId: string): Promise<TriggerInputState>;
/**
 * Persist triggered events as ThresholdEvent nodes in the graph.
 * Each trigger firing is a distinct event (CREATE, not MERGE).
 *
 * @returns IDs of created ThresholdEvent nodes
 */
export declare function persistTriggeredEvents(bloomId: string, triggers: TriggeredEvent[]): Promise<string[]>;
/**
 * Persist structural review results as a finding Seed in the Structural Review Grid.
 * The Grid is MERGEd (idempotent). Each finding is CREATEd (distinct event).
 *
 * @returns The observation/finding Seed ID
 */
export declare function persistReviewResults(bloomId: string, review: StructuralReviewResult, triggers: TriggeredEvent[], triggerEventIds: string[]): Promise<string>;
/**
 * The immune response: check triggers, run review if needed, persist results.
 *
 * Usage:
 * ```
 * const result = await evaluateAndReviewIfNeeded(triggerState, 'bloom-id');
 * if (result) {
 *   // structural issues detected — result contains diagnostics + recommendations
 * }
 * ```
 *
 * @param state — Current trigger input values (from assembleTriggerState or caller)
 * @param bloomId — Optional: when provided, results persist to graph as ThresholdEvent + finding Seeds
 * @returns StructuralReviewResult with recommendations if any trigger fired, null if healthy
 */
export declare function evaluateAndReviewIfNeeded(state: TriggerInputState, bloomId?: string): Promise<{
    triggers: (TriggeredEvent & {
        thresholdEventId?: string;
    })[];
    review: StructuralReviewResult & {
        persistedObservationId?: string;
        recommendations?: Recommendation[];
    };
} | null>;
//# sourceMappingURL=immune-response.d.ts.map