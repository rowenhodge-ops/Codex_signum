/**
 * Architect Orchestrator — manages the full plan lifecycle.
 *
 * Pipeline: SURVEY → DECOMPOSE → CLASSIFY → SEQUENCE → GATE → DISPATCH → ADAPT
 *
 * Moved from DND-Manager agent/patterns/architect/architect.ts.
 * Verdict: SPLIT — refactored to accept ModelExecutor and TaskExecutor
 * as injected dependencies. Uses core's survey function.
 *
 * Note: The SURVEY stage is handled by core's existing survey.ts.
 * The orchestrator accepts a PipelineSurveyOutput to bridge between
 * core's richer SurveyOutput and the pipeline's simpler format.
 */
import type { PlanState, PipelineSurveyOutput, ModelExecutor, TaskExecutor } from "./types.js";
export interface ArchitectConfig {
    modelExecutor: ModelExecutor;
    taskExecutor: TaskExecutor;
    /** If true, auto-approve at GATE stage */
    autoGate?: boolean;
}
/**
 * Execute a full architect plan.
 *
 * The caller is responsible for:
 * 1. Running SURVEY (via core's survey function or their own)
 * 2. Converting the result to PipelineSurveyOutput
 * 3. Passing it here along with the executors
 *
 * If no survey is provided, the pipeline starts from DECOMPOSE
 * with a minimal survey stub.
 */
export declare function executePlan(intent: string, repoPath: string, config: ArchitectConfig, surveyOutput?: PipelineSurveyOutput): Promise<PlanState>;
//# sourceMappingURL=architect.d.ts.map