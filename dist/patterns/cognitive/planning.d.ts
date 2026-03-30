import type { TransformationDef } from "./types.js";
import type { PlanningReport, PlanningIntent, IntentCategory } from "./planning-types.js";
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
 * constitutional delta across pattern Blooms, and produces a ranked, categorised
 * list of intents with structural justification.
 *
 * All ranking is deterministic — derived from graph properties, no LLM.
 */
export declare function runPlanningCycle(): Promise<PlanningReport>;
export { scorePlanningIntent, inferScopesForBloom, categoriseMilestone };
//# sourceMappingURL=planning.d.ts.map