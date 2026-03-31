import type { BOCPDState } from "../../signals/types.js";
/** Assembled memory context for a single LLM Bloom */
export interface LLMMemoryContext {
    /** LLM Bloom ID */
    bloomId: string;
    /** Bloom status */
    status: string;
    /** Structural posteriors — γ-recursive Thompson state */
    posteriors: {
        alpha: number;
        beta: number;
        mean: number;
    };
    /** Dimensional ΦL profiles — per-task-type affinity */
    dimensions: {
        code: number;
        analysis: number;
        creative: number;
        structured_output: number;
        classification: number;
        synthesis: number;
    };
    /** BOCPD drift detection state (null if no state persisted yet) */
    bocpd: {
        state: BOCPDState | null;
        /** Most probable run length from last observation */
        currentRunLength: number | null;
    } | null;
    /** Recent Learning Grid entries (most recent first, max ~10) */
    learningGridEntries: Array<{
        id: string;
        seedType: string;
        content: string;
        createdAt: string;
    }>;
    /** Recent qualitative failure context from PipelineRun TaskOutputs */
    recentFailures: Array<{
        taskId: string;
        modelUsed: string;
        qualityScore: number;
        status: string;
        createdAt: string;
    }>;
    /** Cold start indicator — true if posteriors are at uninformative prior */
    isColdStart: boolean;
}
/**
 * Assemble full memory context for an LLM Bloom.
 * Returns null if the Bloom doesn't exist.
 */
export declare function getMemoryContextForBloom(bloomId: string): Promise<LLMMemoryContext | null>;
/**
 * Compute informative cold-start priors from dimensional ΦL profiles.
 *
 * Uses the dimensional affinity `p` (0.0–1.0) to shape a Beta prior:
 * - p = 0.0 → Beta(0, nEff) — strong failure prior (unknown model)
 * - p = 0.5 → Beta(nEff/2, nEff/2) — uninformative
 * - p = 1.0 → Beta(nEff, 0) — strong success prior
 *
 * Profile age decays nEff via temporal decay (older profiles → weaker prior).
 *
 * @param dimensionalProfile - Task-type affinity values (0.0–1.0)
 * @param nEff - Effective sample size for the prior (default 10)
 * @param profileAgeMs - Age of the profile in ms (optional — decays nEff)
 * @param halfLifeMs - Half-life for age decay (default ~7 days)
 */
export declare function computeColdStartPriors(dimensionalProfile: Record<string, number>, nEff?: number, profileAgeMs?: number, halfLifeMs?: number): {
    alpha: number;
    beta: number;
};
/**
 * Compute partial posterior reset for model changes (API updates, provider changes).
 *
 * Retains a fraction of the learned signal, shrinking toward the uninformative
 * Beta(1, 1) prior. Useful when posteriors are partially stale but not worthless.
 *
 * @param currentAlpha - Current posterior alpha
 * @param currentBeta - Current posterior beta
 * @param retentionFactor - Fraction of signal to retain (default 0.3)
 */
export declare function computePartialReset(currentAlpha: number, currentBeta: number, retentionFactor?: number): {
    alpha: number;
    beta: number;
};
/**
 * Format memory contexts for injection into SURVEY stage.
 * Returns a concise text summary of model performance state.
 *
 * Does NOT modify survey.ts — provides a function the survey stage
 * can call when it wants model context.
 */
export declare function formatMemoryContextForSurvey(contexts: LLMMemoryContext[]): string;
/** Result of post-execution structural memory update */
export interface StructuralMemoryResult {
    posteriorUpdated: boolean;
    bocpdFired: boolean;
    llmBloomId: string | null;
    error?: string;
}
/**
 * Update structural memory after a pipeline task execution.
 *
 * Resolves the LLM Bloom from the model/arm ID, then:
 * 1. γ-recursive posterior update (weightedSuccesses / weightedFailures)
 * 2. BOCPD drift detection on qualityScore (if provided)
 * 3. Partial reset if drift fires
 *
 * **Concurrency note:** Performs a read-modify-write cycle on Bloom properties.
 * Safe for single-threaded sequential pipeline execution. If concurrent dispatches
 * are ever introduced, the read-compute-write needs to become an atomic Cypher SET
 * with inline computation or use a compare-and-swap pattern.
 *
 * Non-fatal: catches all errors. The pipeline must never crash because memory failed.
 *
 * @param _architectBloomId - Architect Bloom ID (for context/logging, not updated)
 * @param outcome - Execution outcome
 */
export declare function updateStructuralMemoryAfterExecution(_architectBloomId: string, outcome: {
    modelId: string;
    success: boolean;
    qualityScore?: number;
    durationMs: number;
}): Promise<StructuralMemoryResult>;
//# sourceMappingURL=memory-context.d.ts.map