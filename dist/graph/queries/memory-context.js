// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * M-10.4: Cross-Stratum Query Interface — assembles memory context
 * from LLM Bloom structural state for Thompson routing and SURVEY.
 *
 * Read-only queries against structures created by M-10.1–M-10.3.
 *
 * @module codex-signum-core/graph/queries/memory-context
 */
import { runQuery } from "../client.js";
import { computeTemporalDecay, DEFAULT_HALF_LIFE_MS } from "./arm-stats.js";
import { updateMorpheme } from "../instantiation.js";
import { BOCPDDetector } from "../../signals/BOCPDDetector.js";
// ============ CORE QUERY ============
/**
 * Assemble full memory context for an LLM Bloom.
 * Returns null if the Bloom doesn't exist.
 */
export async function getMemoryContextForBloom(bloomId) {
    // Query 1: Bloom structural properties
    const bloomResult = await runQuery(`MATCH (b:Bloom {id: $bloomId})
     RETURN b.status AS status,
            b.phiL_code AS phiL_code,
            b.phiL_analysis AS phiL_analysis,
            b.phiL_creative AS phiL_creative,
            b.phiL_structured_output AS phiL_structured_output,
            b.phiL_classification AS phiL_classification,
            b.phiL_synthesis AS phiL_synthesis,
            b.weightedSuccesses AS ws,
            b.weightedFailures AS wf,
            b.bocpdState AS bocpdState`, { bloomId }, "READ");
    if (bloomResult.records.length === 0)
        return null;
    const rec = bloomResult.records[0];
    const status = String(rec.get("status") ?? "active");
    const ws = Number(rec.get("ws") ?? 0);
    const wf = Number(rec.get("wf") ?? 0);
    const bocpdStateJson = rec.get("bocpdState") ?? null;
    // Posteriors
    const alpha = ws + 1;
    const beta = wf + 1;
    const mean = alpha / (alpha + beta);
    // Dimensions (default 0.0 for null)
    const dimensions = {
        code: Number(rec.get("phiL_code") ?? 0),
        analysis: Number(rec.get("phiL_analysis") ?? 0),
        creative: Number(rec.get("phiL_creative") ?? 0),
        structured_output: Number(rec.get("phiL_structured_output") ?? 0),
        classification: Number(rec.get("phiL_classification") ?? 0),
        synthesis: Number(rec.get("phiL_synthesis") ?? 0),
    };
    // BOCPD state
    let bocpd = null;
    if (bocpdStateJson) {
        try {
            const state = JSON.parse(bocpdStateJson);
            let currentRunLength = null;
            if (state.runLengths && state.runLengths.length > 0) {
                currentRunLength = argmax(state.runLengths);
            }
            bocpd = { state, currentRunLength };
        }
        catch {
            bocpd = { state: null, currentRunLength: null };
        }
    }
    // Cold start: at uninformative prior when no real observations yet
    const isColdStart = ws <= 1.0 && wf <= 1.0;
    // Query 2: Learning Grid recent entries (most recent 10, non-archived)
    const gridResult = await runQuery(`MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(g:Grid)-[:CONTAINS]->(s:Seed)
     WHERE NOT s:Archived
     RETURN s.id AS id, s.seedType AS seedType, s.content AS content, s.createdAt AS createdAt
     ORDER BY s.createdAt DESC
     LIMIT 10`, { bloomId }, "READ");
    const learningGridEntries = gridResult.records.map((r) => ({
        id: String(r.get("id")),
        seedType: String(r.get("seedType") ?? ""),
        content: String(r.get("content") ?? ""),
        createdAt: String(r.get("createdAt") ?? ""),
    }));
    // Query 3: Recent failed TaskOutputs associated with this model's arms
    const failureResult = await runQuery(`MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(arm:Agent:Resonator)
     MATCH (to:TaskOutput)
     WHERE to.modelUsed = arm.model AND to.status <> 'succeeded'
     RETURN to.id AS taskId, to.modelUsed AS modelUsed,
            COALESCE(to.qualityScore, 0.0) AS qualityScore,
            to.status AS status, to.createdAt AS createdAt
     ORDER BY to.createdAt DESC
     LIMIT 5`, { bloomId }, "READ");
    const recentFailures = failureResult.records.map((r) => ({
        taskId: String(r.get("taskId")),
        modelUsed: String(r.get("modelUsed")),
        qualityScore: Number(r.get("qualityScore")),
        status: String(r.get("status")),
        createdAt: String(r.get("createdAt") ?? ""),
    }));
    return {
        bloomId,
        status,
        posteriors: { alpha, beta, mean },
        dimensions,
        bocpd,
        learningGridEntries,
        recentFailures,
        isColdStart,
    };
}
// ============ COLD START PRIORS (ec-14) ============
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
export function computeColdStartPriors(dimensionalProfile, nEff = 10, profileAgeMs, halfLifeMs = 604_800_000) {
    // Average across all provided dimensions
    const values = Object.values(dimensionalProfile);
    const p = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0.5;
    // Decay nEff if profile age is provided
    let nEffective = nEff;
    if (profileAgeMs !== undefined && profileAgeMs > 0) {
        nEffective = nEff * computeTemporalDecay(halfLifeMs, profileAgeMs);
    }
    return {
        alpha: p * nEffective,
        beta: (1 - p) * nEffective,
    };
}
// ============ PARTIAL RESET ============
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
export function computePartialReset(currentAlpha, currentBeta, retentionFactor = 0.3) {
    return {
        alpha: 1 + (currentAlpha - 1) * retentionFactor,
        beta: 1 + (currentBeta - 1) * retentionFactor,
    };
}
// ============ SURVEY FORMATTING ============
/**
 * Format memory contexts for injection into SURVEY stage.
 * Returns a concise text summary of model performance state.
 *
 * Does NOT modify survey.ts — provides a function the survey stage
 * can call when it wants model context.
 */
export function formatMemoryContextForSurvey(contexts) {
    if (contexts.length === 0)
        return "";
    const lines = ["## Model Memory Context"];
    // Sort by posterior mean descending
    const sorted = [...contexts].sort((a, b) => b.posteriors.mean - a.posteriors.mean);
    for (const ctx of sorted) {
        const coldTag = ctx.isColdStart ? " [cold start]" : "";
        lines.push(`- **${ctx.bloomId}**: posterior mean=${ctx.posteriors.mean.toFixed(3)}` +
            ` (α=${ctx.posteriors.alpha.toFixed(1)}, β=${ctx.posteriors.beta.toFixed(1)})${coldTag}`);
        // Flag drift detections
        if (ctx.bocpd?.currentRunLength !== null && ctx.bocpd?.currentRunLength !== undefined) {
            if (ctx.bocpd.currentRunLength < 3) {
                lines.push(`  ⚠ Recent drift detected (run length = ${ctx.bocpd.currentRunLength})`);
            }
        }
        // Note recent learning grid entries
        if (ctx.learningGridEntries.length > 0) {
            lines.push(`  ${ctx.learningGridEntries.length} learning grid entries`);
        }
        // Note recent failures
        if (ctx.recentFailures.length > 0) {
            lines.push(`  ${ctx.recentFailures.length} recent failure(s)`);
        }
    }
    return lines.join("\n");
}
// ============ POST-EXECUTION STRUCTURAL MEMORY ============
/** BOCPD drift threshold — hybrid trigger (Engineering Bridge §Part 8) */
const BOCPD_DRIFT_THRESHOLD = 0.7;
/** Retention factor for partial reset on drift detection */
const DRIFT_RESET_RETENTION = 0.3;
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
export async function updateStructuralMemoryAfterExecution(_architectBloomId, outcome) {
    try {
        // ── Step 1: Resolve LLM Bloom from arm/model ID ──
        // result.modelId = selectedSeedId (arm ID like "claude-opus-4-6:adaptive:max")
        const resolveResult = await runQuery(`MATCH (llm:Bloom)-[:CONTAINS]->(arm:Agent:Resonator {id: $modelId})
       RETURN DISTINCT llm.id AS llmBloomId
       LIMIT 1`, { modelId: outcome.modelId }, "READ");
        if (resolveResult.records.length === 0) {
            // Edge case: model not yet reclassified into LLM Bloom
            console.warn(`[MEMORY] No LLM Bloom found for modelId="${outcome.modelId}" — skipping posterior update`);
            return { posteriorUpdated: false, bocpdFired: false, llmBloomId: null };
        }
        const llmBloomId = String(resolveResult.records[0].get("llmBloomId"));
        // ── Step 2: Read current posteriors + BOCPD state from LLM Bloom ──
        const stateResult = await runQuery(`MATCH (b:Bloom {id: $llmBloomId})
       RETURN COALESCE(b.weightedSuccesses, 0.0) AS ws,
              COALESCE(b.weightedFailures, 0.0) AS wf,
              b.bocpdState AS bocpdState,
              b.lastObservationAt AS lastObsAt`, { llmBloomId }, "READ");
        if (stateResult.records.length === 0) {
            return {
                posteriorUpdated: false,
                bocpdFired: false,
                llmBloomId,
                error: `LLM Bloom "${llmBloomId}" resolved but not found on read`,
            };
        }
        const rec = stateResult.records[0];
        const wsOld = Number(rec.get("ws"));
        const wfOld = Number(rec.get("wf"));
        const bocpdStateJson = rec.get("bocpdState") ?? null;
        const lastObsAt = rec.get("lastObsAt") ?? null;
        // ── Step 3: γ-recursive posterior update ──
        // Compute elapsed time since last observation for decay
        let gamma = 1.0; // No decay if no prior observation
        if (lastObsAt) {
            const elapsed = Date.now() - new Date(lastObsAt).getTime();
            gamma = computeTemporalDecay(DEFAULT_HALF_LIFE_MS, elapsed);
        }
        const wsNew = gamma * wsOld + (outcome.success ? 1 : 0);
        const wfNew = gamma * wfOld + (outcome.success ? 0 : 1);
        const updates = {
            weightedSuccesses: wsNew,
            weightedFailures: wfNew,
            lastObservationAt: new Date().toISOString(),
        };
        // ── Step 4: BOCPD drift detection ──
        let bocpdFired = false;
        if (outcome.qualityScore !== undefined) {
            const detector = new BOCPDDetector(); // default config
            let state;
            if (bocpdStateJson) {
                try {
                    state = JSON.parse(bocpdStateJson);
                }
                catch {
                    state = detector.initialState();
                }
            }
            else {
                state = detector.initialState();
            }
            const { signal, nextState } = detector.update(outcome.qualityScore, state);
            if (signal.changePointProbability >= BOCPD_DRIFT_THRESHOLD) {
                // Drift detected — partial reset posteriors
                bocpdFired = true;
                const reset = computePartialReset(wsNew + 1, wfNew + 1, DRIFT_RESET_RETENTION);
                updates.weightedSuccesses = reset.alpha - 1; // Convert back from Beta params
                updates.weightedFailures = reset.beta - 1;
                updates.bocpdState = JSON.stringify(detector.initialState()); // Reset BOCPD
                console.warn(`[MEMORY] BOCPD drift on ${llmBloomId}: P(cp)=${signal.changePointProbability.toFixed(4)} ≥ ${BOCPD_DRIFT_THRESHOLD} — posteriors reset (${DRIFT_RESET_RETENTION * 100}% retention)`);
            }
            else {
                updates.bocpdState = JSON.stringify(nextState);
            }
        }
        // ── Step 5: Persist ──
        await updateMorpheme(llmBloomId, updates);
        return { posteriorUpdated: true, bocpdFired, llmBloomId };
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn(`[MEMORY] updateStructuralMemoryAfterExecution failed: ${msg}`);
        return {
            posteriorUpdated: false,
            bocpdFired: false,
            llmBloomId: null,
            error: msg,
        };
    }
}
// ============ INTERNAL HELPERS ============
/** Return the index of the maximum value in an array */
function argmax(arr) {
    let maxIdx = 0;
    let maxVal = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > maxVal) {
            maxVal = arr[i];
            maxIdx = i;
        }
    }
    return maxIdx;
}
//# sourceMappingURL=memory-context.js.map