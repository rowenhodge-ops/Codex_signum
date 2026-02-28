// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Structural Review Trigger Detection (Pure Computation)
 *
 * Six trigger conditions for event-driven structural review.
 * Each is a pure function — takes current state, returns boolean.
 *
 * "Structural review is triggered by events the system already produces,
 * not by schedule."
 *
 * @see codex-signum-v3.0.md §Event-Triggered Structural Review
 * @module codex-signum-core/computation/structural-triggers
 */

import { CASCADE_LIMIT } from "./dampening.js";

// ============ TYPES ============

export interface TriggerInputState {
  /** Current λ₂ of the full active graph */
  currentLambda2: number;
  /** λ₂ from before the most recent composition change */
  previousLambda2: number;
  /** Current graph total variation (friction) */
  currentFriction: number;
  /** Correction Helix temporal constant (how long Scale 1 correction takes) */
  correctionHelixTemporalConstant: number;
  /** Duration the friction has been above threshold (same units as temporal constant) */
  frictionDuration: number;
  /** Current cascade depth (from most recent degradation event) */
  currentCascadeDepth: number;
  /** εR at the composition (Bloom) level */
  compositionEpsilonR: number;
  /** Maturity-indexed εR stable range */
  epsilonRStableRange: { min: number; max: number };
  /** Ecosystem-wide ΦL velocity (rate of change per day) */
  ecosystemPhiLVelocity: number;
  /** Recent imperative gradient values (most recent last, at least 5 values) */
  omegaGradientHistory: number[];
}

export interface TriggeredEvent {
  trigger:
    | "lambda2_drop_on_formation"
    | "friction_spike"
    | "cascade_activation"
    | "epsilon_r_spike"
    | "phi_l_velocity_anomaly"
    | "omega_gradient_inversion";
  severity: "warning" | "critical";
  detail: string;
}

// ============ INDIVIDUAL TRIGGERS ============

/**
 * Trigger 1: λ₂ dropped when a new composition was formed.
 * "New component weakens connectivity."
 *
 * Fires when λ₂ decreases by > 20% relative to previous.
 * Severity: critical if λ₂ drops below 0.1 (near-disconnection).
 */
export function checkLambda2Drop(
  previousLambda2: number,
  currentLambda2: number,
): TriggeredEvent | null {
  if (previousLambda2 <= 0) return null; // No meaningful previous value

  const relativeDrop = (previousLambda2 - currentLambda2) / previousLambda2;
  if (relativeDrop <= 0.2) return null;

  const severity = currentLambda2 < 0.1 ? "critical" : "warning";
  return {
    trigger: "lambda2_drop_on_formation",
    severity,
    detail: `λ₂ dropped ${(relativeDrop * 100).toFixed(1)}% from ${previousLambda2.toFixed(4)} to ${currentLambda2.toFixed(4)}${severity === "critical" ? " — near-disconnection" : ""}`,
  };
}

/**
 * Trigger 2: Friction spike sustained beyond Correction Helix temporal constant.
 * "Runtime friction crosses threshold, sustained beyond Scale 1 correction time."
 *
 * Fires when friction > 0.5 AND duration > correctionHelixTemporalConstant.
 * Severity: warning if friction < 0.8, critical if ≥ 0.8.
 */
export function checkFrictionSpike(
  currentFriction: number,
  frictionDuration: number,
  correctionHelixTemporalConstant: number,
): TriggeredEvent | null {
  if (currentFriction <= 0.5) return null;
  if (frictionDuration <= correctionHelixTemporalConstant) return null;

  const severity = currentFriction >= 0.8 ? "critical" : "warning";
  return {
    trigger: "friction_spike",
    severity,
    detail: `Friction ${currentFriction.toFixed(3)} sustained for ${frictionDuration.toFixed(1)} (threshold: ${correctionHelixTemporalConstant.toFixed(1)})`,
  };
}

/**
 * Trigger 3: Cascade activation — degradation reached the 2-level limit.
 * "A degradation event maxed out the safety boundary."
 *
 * Fires when cascadeDepth >= CASCADE_LIMIT (2).
 * Always critical — the safety mechanism activated.
 */
export function checkCascadeActivation(
  cascadeDepth: number,
): TriggeredEvent | null {
  if (cascadeDepth < CASCADE_LIMIT) return null;

  return {
    trigger: "cascade_activation",
    severity: "critical",
    detail: `Cascade depth ${cascadeDepth} reached limit of ${CASCADE_LIMIT}`,
  };
}

/**
 * Trigger 4: εR spike at composition level — beyond maturity-indexed stable range.
 * "Composition has lost confidence and is exploring heavily."
 *
 * Fires when compositionEpsilonR > stableRange.max.
 * Severity: warning if < 2× max, critical if ≥ 2× max.
 */
export function checkEpsilonRSpike(
  compositionEpsilonR: number,
  stableRange: { min: number; max: number },
): TriggeredEvent | null {
  if (compositionEpsilonR <= stableRange.max) return null;

  const severity = compositionEpsilonR >= 2 * stableRange.max ? "critical" : "warning";
  return {
    trigger: "epsilon_r_spike",
    severity,
    detail: `εR ${compositionEpsilonR.toFixed(3)} exceeds stable max ${stableRange.max.toFixed(3)}${severity === "critical" ? " (≥2× threshold)" : ""}`,
  };
}

/**
 * Trigger 5: ΦL velocity anomaly — ecosystem-wide ΦL shifting too fast.
 * "Something systemic is happening."
 *
 * Fires when |ecosystemPhiLVelocity| > 0.05 per day (spec value).
 * Severity: warning if < 0.1/day, critical if ≥ 0.1/day.
 * Fires for BOTH rapid improvement and rapid degradation.
 */
export function checkPhiLVelocityAnomaly(
  ecosystemPhiLVelocity: number,
): TriggeredEvent | null {
  const absVelocity = Math.abs(ecosystemPhiLVelocity);
  if (absVelocity <= 0.05) return null;

  const severity = absVelocity >= 0.1 ? "critical" : "warning";
  const direction = ecosystemPhiLVelocity > 0 ? "improving" : "degrading";
  return {
    trigger: "phi_l_velocity_anomaly",
    severity,
    detail: `ΦL velocity ${ecosystemPhiLVelocity.toFixed(4)}/day (${direction}) exceeds threshold`,
  };
}

/**
 * Trigger 6: Ω gradient inversion — imperative gradient turns negative after sustained positive.
 * "A meta-imperative was being satisfied, and now it's degrading."
 *
 * Fires when: last 3+ values were positive AND current value is negative.
 * Requires at least 4 values in history.
 * Severity: warning if mild inversion, critical if gradient < -0.1.
 */
export function checkOmegaGradientInversion(
  gradientHistory: number[],
): TriggeredEvent | null {
  if (gradientHistory.length < 4) return null;

  const current = gradientHistory[gradientHistory.length - 1];
  if (current >= 0) return null;

  // Check if last 3+ values before current were positive
  const preceding = gradientHistory.slice(-4, -1);
  const allPrecedingPositive = preceding.every((v) => v > 0);
  if (!allPrecedingPositive) return null;

  const severity = current < -0.1 ? "critical" : "warning";
  return {
    trigger: "omega_gradient_inversion",
    severity,
    detail: `Ω gradient inverted to ${current.toFixed(4)} after sustained positive trend`,
  };
}

// ============ COMBINED CHECK ============

/**
 * Evaluate all six trigger conditions.
 * Returns all triggered events (may be multiple simultaneously).
 */
export function checkStructuralTriggers(
  state: TriggerInputState,
): TriggeredEvent[] {
  const events: TriggeredEvent[] = [];

  const lambda2 = checkLambda2Drop(state.previousLambda2, state.currentLambda2);
  if (lambda2) events.push(lambda2);

  const friction = checkFrictionSpike(
    state.currentFriction,
    state.frictionDuration,
    state.correctionHelixTemporalConstant,
  );
  if (friction) events.push(friction);

  const cascade = checkCascadeActivation(state.currentCascadeDepth);
  if (cascade) events.push(cascade);

  const epsilonR = checkEpsilonRSpike(
    state.compositionEpsilonR,
    state.epsilonRStableRange,
  );
  if (epsilonR) events.push(epsilonR);

  const phiLVelocity = checkPhiLVelocityAnomaly(state.ecosystemPhiLVelocity);
  if (phiLVelocity) events.push(phiLVelocity);

  const omegaInversion = checkOmegaGradientInversion(state.omegaGradientHistory);
  if (omegaInversion) events.push(omegaInversion);

  return events;
}
