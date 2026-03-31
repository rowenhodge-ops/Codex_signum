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
import { computeTemporalDecay } from "./arm-stats.js";
import type { BOCPDState } from "../../signals/types.js";

// ============ TYPES ============

/** Assembled memory context for a single LLM Bloom */
export interface LLMMemoryContext {
  /** LLM Bloom ID */
  bloomId: string;
  /** Bloom status */
  status: string;

  /** Structural posteriors — γ-recursive Thompson state */
  posteriors: {
    alpha: number;   // weightedSuccesses + 1
    beta: number;    // weightedFailures + 1
    mean: number;    // alpha / (alpha + beta) — posterior mean
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

// ============ CORE QUERY ============

/**
 * Assemble full memory context for an LLM Bloom.
 * Returns null if the Bloom doesn't exist.
 */
export async function getMemoryContextForBloom(
  bloomId: string,
): Promise<LLMMemoryContext | null> {
  // Query 1: Bloom structural properties
  const bloomResult = await runQuery(
    `MATCH (b:Bloom {id: $bloomId})
     RETURN b.status AS status,
            b.phiL_code AS phiL_code,
            b.phiL_analysis AS phiL_analysis,
            b.phiL_creative AS phiL_creative,
            b.phiL_structured_output AS phiL_structured_output,
            b.phiL_classification AS phiL_classification,
            b.phiL_synthesis AS phiL_synthesis,
            b.weightedSuccesses AS ws,
            b.weightedFailures AS wf,
            b.bocpdState AS bocpdState`,
    { bloomId },
    "READ",
  );

  if (bloomResult.records.length === 0) return null;

  const rec = bloomResult.records[0];
  const status = String(rec.get("status") ?? "active");
  const ws = Number(rec.get("ws") ?? 0);
  const wf = Number(rec.get("wf") ?? 0);
  const bocpdStateJson: string | null = rec.get("bocpdState") ?? null;

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
  let bocpd: LLMMemoryContext["bocpd"] = null;
  if (bocpdStateJson) {
    try {
      const state = JSON.parse(bocpdStateJson) as BOCPDState;
      let currentRunLength: number | null = null;
      if (state.runLengths && state.runLengths.length > 0) {
        currentRunLength = argmax(state.runLengths);
      }
      bocpd = { state, currentRunLength };
    } catch {
      bocpd = { state: null, currentRunLength: null };
    }
  }

  // Cold start: at uninformative prior when no real observations yet
  const isColdStart = ws <= 1.0 && wf <= 1.0;

  // Query 2: Learning Grid recent entries (most recent 10, non-archived)
  const gridResult = await runQuery(
    `MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(g:Grid)-[:CONTAINS]->(s:Seed)
     WHERE NOT s:Archived
     RETURN s.id AS id, s.seedType AS seedType, s.content AS content, s.createdAt AS createdAt
     ORDER BY s.createdAt DESC
     LIMIT 10`,
    { bloomId },
    "READ",
  );

  const learningGridEntries = gridResult.records.map((r) => ({
    id: String(r.get("id")),
    seedType: String(r.get("seedType") ?? ""),
    content: String(r.get("content") ?? ""),
    createdAt: String(r.get("createdAt") ?? ""),
  }));

  // Query 3: Recent failed TaskOutputs associated with this model's arms
  const failureResult = await runQuery(
    `MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(arm:Agent:Resonator)
     MATCH (to:TaskOutput)
     WHERE to.modelUsed = arm.model AND to.status <> 'succeeded'
     RETURN to.id AS taskId, to.modelUsed AS modelUsed,
            COALESCE(to.qualityScore, 0.0) AS qualityScore,
            to.status AS status, to.createdAt AS createdAt
     ORDER BY to.createdAt DESC
     LIMIT 5`,
    { bloomId },
    "READ",
  );

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
export function computeColdStartPriors(
  dimensionalProfile: Record<string, number>,
  nEff: number = 10,
  profileAgeMs?: number,
  halfLifeMs: number = 604_800_000, // ~7 days
): { alpha: number; beta: number } {
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
export function computePartialReset(
  currentAlpha: number,
  currentBeta: number,
  retentionFactor: number = 0.3,
): { alpha: number; beta: number } {
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
export function formatMemoryContextForSurvey(
  contexts: LLMMemoryContext[],
): string {
  if (contexts.length === 0) return "";

  const lines: string[] = ["## Model Memory Context"];

  // Sort by posterior mean descending
  const sorted = [...contexts].sort(
    (a, b) => b.posteriors.mean - a.posteriors.mean,
  );

  for (const ctx of sorted) {
    const coldTag = ctx.isColdStart ? " [cold start]" : "";
    lines.push(
      `- **${ctx.bloomId}**: posterior mean=${ctx.posteriors.mean.toFixed(3)}` +
      ` (α=${ctx.posteriors.alpha.toFixed(1)}, β=${ctx.posteriors.beta.toFixed(1)})${coldTag}`,
    );

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

// ============ INTERNAL HELPERS ============

/** Return the index of the maximum value in an array */
function argmax(arr: number[]): number {
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
