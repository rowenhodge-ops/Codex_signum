// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — εR Computation (Exploration Rate)
 *
 * εR measures the fraction of decisions that sample uncertain alternatives
 * rather than exploiting known-best options. High ΦL with zero εR is a WARNING.
 *
 * Key principle: εR must never be exactly 0 for active patterns.
 *
 * @see codex-signum-v3.0.md §εR
 * @see engineering-bridge-v2.0.md §Part 2 "εR"
 * @module codex-signum-core/computation/epsilon-r
 */

import type { EpsilonR } from "../types/state-dimensions.js";
import {
  classifyEpsilonR,
  EPSILON_R_THRESHOLDS,
} from "../types/state-dimensions.js";

// ============ CORE COMPUTATION ============

/**
 * Compute εR from decision history.
 *
 * @param exploratoryDecisions — Number of exploratory decisions in the window
 * @param totalDecisions — Total decisions in the window
 * @param floor — Minimum εR floor (from imperative gradients / spectral calibration)
 */
export function computeEpsilonR(
  exploratoryDecisions: number,
  totalDecisions: number,
  floor: number = EPSILON_R_THRESHOLDS.stableMin,
): EpsilonR {
  let value: number;

  if (totalDecisions === 0) {
    // No decisions yet — default to adaptive range midpoint
    value = 0.15;
  } else {
    value = exploratoryDecisions / totalDecisions;
  }

  // Enforce floor — εR must never be exactly 0 for active patterns
  value = Math.max(value, floor);

  return {
    value,
    range: classifyEpsilonR(value),
    exploratoryDecisions,
    totalDecisions,
    floor,
    computedAt: new Date(),
  };
}

/**
 * Spectral calibration table (Engineering Bridge §Part 2).
 *
 * Maps spectral ratio to minimum εR floor.
 * Higher spectral concentration → more mandatory exploration.
 *
 * | Spectral Ratio | Minimum εR |
 * |     > 0.9      |    0.05    |
 * |   0.7 – 0.9    |    0.02    |
 * |   0.5 – 0.7    |    0.01    |
 * |     < 0.5      |    0.0     |
 */
export function minEpsilonRForSpectralState(spectralRatio: number): number {
  if (spectralRatio > 0.9) return 0.05;
  if (spectralRatio >= 0.7) return 0.02;
  if (spectralRatio >= 0.5) return 0.01;
  return 0.0;
}

/**
 * Compute the εR floor from imperative gradients and spectral calibration.
 *
 * The floor prevents εR from collapsing to zero even when
 * the Thompson Router is exploiting a dominant arm.
 *
 * εR_floor = max(
 *   base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient)),
 *   min_εR_for_spectral_state(spectral_ratio)
 * )
 *
 * @param baseFloor — Default minimum (0.01 per spec)
 * @param imperativeGradient — Ω_aggregate_gradient. Negative = declining health → more exploration.
 *   (1.0 = normal, >1.0 = increased pressure from Ω₃ Increase Understanding)
 * @param spectralRatio — Optional spectral concentration ratio (0-1). Higher = more concentrated.
 * @param gradientSensitivity — How strongly negative gradients inflate the floor (default 0.1)
 */
export function computeEpsilonRFloor(
  baseFloor: number = 0.01,
  imperativeGradient: number = 1.0,
  spectralRatio?: number,
  gradientSensitivity: number = 0.1,
): number {
  // Gradient-based floor: base + sensitivity × max(0, -gradient)
  const gradientFloor =
    baseFloor +
    gradientSensitivity * Math.max(0, -imperativeGradient);

  // Spectral calibration floor (if ratio provided)
  const spectralFloor =
    spectralRatio !== undefined
      ? minEpsilonRForSpectralState(spectralRatio)
      : 0;

  // Absolute minimum floor of 0.01 — εR must never fully collapse for active patterns
  return Math.max(gradientFloor, spectralFloor, 0.01);
}

/**
 * Check if εR is in a warning state.
 *
 * WARNING conditions:
 * - εR = 0 with active pattern → Constitutional violation
 * - εR > 0.3 for non-young network → Instability risk
 * - High ΦL + low εR → Over-optimization, needs exploration
 */
export function checkEpsilonRWarnings(
  epsilonR: EpsilonR,
  phiLEffective: number,
  isPatternActive: boolean,
): Array<{ level: "warning" | "critical"; message: string }> {
  const warnings: Array<{ level: "warning" | "critical"; message: string }> =
    [];

  // Critical: zero εR on active pattern
  if (epsilonR.value === 0 && isPatternActive) {
    warnings.push({
      level: "critical",
      message:
        "εR is exactly 0 on active pattern. Constitutional violation (Axiom 5).",
    });
  }

  // Warning: high ΦL + low εR = over-optimization
  if (phiLEffective > 0.8 && epsilonR.value < 0.02) {
    warnings.push({
      level: "warning",
      message: `High ΦL (${phiLEffective.toFixed(2)}) with near-zero εR (${epsilonR.value.toFixed(3)}). Over-optimized — increase exploration.`,
    });
  }

  // Warning: unstable εR
  if (epsilonR.range === "unstable") {
    warnings.push({
      level: "warning",
      message: `εR is unstable (${epsilonR.value.toFixed(2)} > 0.30). Too much exploration — decisions are inconsistent.`,
    });
  }

  return warnings;
}
