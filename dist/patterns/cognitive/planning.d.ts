import type { LLMMemoryContext } from "../../graph/queries/memory-context.js";
import type { ModelExecutor } from "../architect/types.js";
import type { TransformationDef } from "./types.js";
import type { PlanningReport, PlanningIntent, IntentCategory, BloomStateEntry, PersistedIntentStats } from "./planning-types.js";
declare function readLLMMemoryState(): Promise<{
    contexts: LLMMemoryContext[];
    infrastructureFailures: string[];
    driftingModels: string[];
    topPerformers: string[];
    summary: string;
}>;
declare function readExistingBacklog(): Promise<{
    activeIntents: Array<{
        id: string;
        name: string;
        category: string;
        priorityScore: number;
        status: string;
    }>;
    rItems: Array<{
        id: string;
        name: string;
        status: string;
    }>;
}>;
declare function detectStructuralDrift(bloomStates: BloomStateEntry[]): Promise<Array<{
    bloomId: string;
    metric: string;
    changePointProbability: number;
}>>;
declare function findUnwiredBlooms(): Promise<string[]>;
declare function persistIntents(intents: PlanningIntent[]): Promise<PersistedIntentStats>;
/**
 * Infer which definition scopes are relevant for a given Bloom ID.
 * Maps Bloom identity to scope names based on naming conventions + definitions.
 */
declare function inferScopesForBloom(bloomId: string, definitions: TransformationDef[]): string[];
declare function categoriseMilestone(name: string): IntentCategory;
declare function scorePlanningIntent(intent: PlanningIntent): number;
/**
 * Run the Gnosis Planning Cycle — ecosystem-wide structural prioritisation.
 *
 * Surveys all active Blooms, reads violations and milestone state, computes
 * constitutional delta across pattern Blooms, reads LLM memory and existing
 * backlog, detects structural drift via BOCPD, and produces a ranked,
 * categorised list of intents with structural justification.
 *
 * All ranking is deterministic — derived from graph properties, no LLM.
 * LLM enrichment of top-N intents is optional (requires modelExecutor).
 *
 * @param modelExecutor - Optional: Thompson-routed model for intent enrichment
 * @param enrichTopN - Number of top intents to enrich (default: 10)
 */
export declare function runPlanningCycle(modelExecutor?: ModelExecutor, enrichTopN?: number): Promise<PlanningReport>;
export { scorePlanningIntent, inferScopesForBloom, categoriseMilestone, readLLMMemoryState, readExistingBacklog, detectStructuralDrift, findUnwiredBlooms, persistIntents };
//# sourceMappingURL=planning.d.ts.map