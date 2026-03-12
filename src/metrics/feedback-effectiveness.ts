// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Feedback Effectiveness Metric
 *
 * Measures how well the refinement loop is working.
 * effectiveness = improved_stages / corrected_stages
 *
 * - A "refined stage" is one that triggered the refinement loop (qualityScore < 0.5)
 * - An "improved stage" is a refined stage whose final qualityScore ended >= 0.5
 * - If no refinements occurred, effectiveness = 1.0 (nothing needed fixing)
 * - Low effectiveness (< 0.3) signals the refinement loop isn't helping
 *
 * Origin: consumer agent/metrics/feedback-effectiveness.ts.
 *
 * @module codex-signum-core/metrics/feedback-effectiveness
 */

import type { StageResult } from "../patterns/dev-agent/types.js";

export interface FeedbackEffectivenessResult {
  /** Ratio of improved refined stages to total refined stages. [0, 1] */
  effectiveness: number;
  /** Number of stages that triggered refinement loops */
  correctedStages: number;
  /** Number of refined stages that improved to >= 0.5 */
  improvedStages: number;
}

export function computeFeedbackEffectiveness(
  stages: StageResult[],
  refinementCount: number,
): FeedbackEffectivenessResult {
  if (refinementCount === 0) {
    return { effectiveness: 1.0, correctedStages: 0, improvedStages: 0 };
  }

  const lowQualityStages = stages.filter((s) => s.qualityScore < 0.5);
  const correctedStages = Math.min(refinementCount, stages.length);
  const improvedStages =
    correctedStages > 0
      ? Math.max(0, correctedStages - lowQualityStages.length)
      : 0;

  const effectiveness =
    correctedStages > 0 ? improvedStages / correctedStages : 1.0;

  return { effectiveness, correctedStages, improvedStages };
}
