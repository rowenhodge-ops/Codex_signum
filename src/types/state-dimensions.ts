// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — State Dimension Type Definitions
 *
 * Every morpheme carries three state properties:
 * - ΦL (Luminance Schema) — Health
 * - ΨH (Harmonic Signature) — Relational coherence
 * - εR (Exploration Rate) — Adaptive capacity
 *
 * These are NEVER single numbers. They are always composite structures.
 *
 * @see codex-signum-v3.0.md §State Dimensions
 * @see engineering-bridge-v2.0.md §Part 2
 * @module codex-signum-core/types/state-dimensions
 */

// ============ ΦL — LUMINANCE SCHEMA (Health) ============

/**
 * ΦL raw factor inputs.
 * These are the four observable factors that compose ΦL.
 * The factors are FIXED — they define what ΦL measures.
 */
export interface PhiLFactors {
  /** Fraction of 10 axioms satisfied (binary per axiom, 0.0–1.0) */
  axiomCompliance: number;
  /** Can origin be traced? (0.0 = unknown, 1.0 = full chain documented) */
  provenanceClarity: number;
  /** Fraction of invocations completing without error */
  usageSuccessRate: number;
  /** Consistency of ΦL over the observation window */
  temporalStability: number;
}

/**
 * ΦL weights — configurable per deployment context.
 * Must sum to 1.0.
 *
 * Recommended defaults: axiom=0.4, provenance=0.2, success=0.2, stability=0.2
 */
export interface PhiLWeights {
  axiomCompliance: number;
  provenanceClarity: number;
  usageSuccessRate: number;
  temporalStability: number;
}

/** Default ΦL weights per Engineering Bridge v2.0 §Part 2 */
export const DEFAULT_PHI_L_WEIGHTS: PhiLWeights = {
  axiomCompliance: 0.4,
  provenanceClarity: 0.2,
  usageSuccessRate: 0.2,
  temporalStability: 0.2,
};

/**
 * ΦL trend direction — derived from slope of ΦL over observation window.
 */
export type PhiLTrend = "improving" | "stable" | "declining";

/**
 * ΦL — Health Score (Luminance Schema)
 *
 * NEVER a single number. Always this composite structure.
 * If you see `health: number` or `phi_l: number` anywhere — it's wrong. Fix it.
 *
 * @see engineering-bridge-v2.0.md §Part 2 "Computing ΦL"
 */
export interface PhiL {
  /** The four raw factor values (0.0–1.0 each) */
  factors: PhiLFactors;
  /** Weighting applied to each factor */
  weights: PhiLWeights;
  /** Raw weighted sum before maturity adjustment */
  raw: number;
  /**
   * Maturity factor: (1 - e^(-k₁ × observations)) × (1 - e^(-k₂ × connections))
   * At 50+ observations and 3+ connections, approaches 1.0.
   * At 0 observations or 0 connections, approaches 0.
   */
  maturityFactor: number;
  /** Effective ΦL = raw × maturityFactor */
  effective: number;
  /** Trend of ΦL over observation window */
  trend: PhiLTrend;
  /** Number of observations backing this score */
  observationCount: number;
  /** Number of active connections */
  connectionCount: number;
  /** Timestamp of last computation */
  computedAt: Date;
}

// ============ ΦL STATE (Stateless Ring Buffer) ============

/**
 * External state for ΦL temporal stability computation.
 *
 * Core is stateless — callers own and persist this state between runs.
 * Pass it into `computePhiLWithState()` and store the returned updated state.
 *
 * @see HealthComputer.ts in DND-Manager for the original stateful version.
 */
export interface PhiLState {
  /** Ring buffer of recent ΦL effective values (most recent last) */
  ringBuffer: number[];
  /** Maximum buffer capacity (default 20) */
  maxSize: number;
}

/**
 * Create a fresh PhiLState with default settings.
 *
 * @param maxSize — Ring buffer capacity (default 20, matching DND convention)
 */
export function createPhiLState(maxSize: number = 20): PhiLState {
  return { ringBuffer: [], maxSize };
}

// ============ ΨH — HARMONIC SIGNATURE (Relational Coherence) ============

/**
 * ΨH — Harmonic Signature
 *
 * Two-component metric grounded in the graph's own properties.
 * NEVER a similarity score or a single assigned number.
 *
 * Component 1: Structural Coherence (λ₂) — Fiedler eigenvalue of graph Laplacian
 * Component 2: Runtime Friction (TV_G) — Graph Total Variation
 *
 * @see codex-signum-v3.0.md §ΨH
 * @see engineering-bridge-v2.0.md §Part 2 "ΨH"
 */
export interface PsiH {
  /**
   * λ₂ — Fiedler eigenvalue (algebraic connectivity of graph Laplacian).
   * Near 0 = fragile (single point of failure).
   * High = robust (densely connected).
   * Relative to composition size.
   */
  lambda2: number;
  /**
   * TV_G — Graph Total Variation (signal smoothness).
   * Normalised to [0, 1].
   * < 0.2 = resonant. > 0.8 = dissonant.
   */
  friction: number;
  /**
   * Composite: 0.4 × normalize(λ₂) + 0.6 × (1 - friction)
   * Runtime friction weighted higher (reflects actual operational coherence).
   */
  combined: number;
  /** Timestamp of last computation */
  computedAt: Date;
}

/** Recommended ΨH component weights per Engineering Bridge v2.0 */
export const PSI_H_WEIGHTS = {
  structural: 0.4,
  runtime: 0.6,
} as const;

/** ΨH friction thresholds */
export const PSI_H_FRICTION_THRESHOLDS = {
  resonant: 0.2,
  working: 0.5,
  strained: 0.8,
  /** Above 0.8 = dissonant — composition is fighting itself */
  dissonant: 1.0,
} as const;

// ============ ΨH STATE (Stateless Temporal Decomposition) ============

/**
 * Temporal decomposition of ΨH into transient and durable friction.
 *
 * - psiH_instant: point-in-time combined value
 * - psiH_trend: EWMA-smoothed trend
 * - friction_transient: short-term deviation from trend
 * - friction_durable: trend drift from established baseline
 */
export interface PsiHDecomposition {
  psiH_instant: number;
  psiH_trend: number;
  friction_transient: number;
  friction_durable: number;
}

/**
 * External state for ΨH temporal decomposition.
 *
 * Core is stateless — callers own and persist this state between runs.
 * Pass it into `computePsiHWithState()` and store the returned updated state.
 *
 * @see HarmonicResonance.ts in DND-Manager for the original stateful version.
 */
export interface PsiHState {
  /** Ring buffer of recent ΨH combined values (most recent last) */
  ringBuffer: number[];
  /** Maximum buffer capacity (default 20) */
  maxSize: number;
  /** EWMA smoothing factor (default 0.15) */
  alpha: number;
  /** Current EWMA trend value (undefined until first observation) */
  trend: number | undefined;
  /** Baseline trend value (set after ≥5 observations) */
  baseline: number | undefined;
}

/**
 * Create a fresh PsiHState with default settings.
 *
 * @param maxSize — Ring buffer capacity (default 20)
 * @param alpha — EWMA smoothing factor (default 0.15)
 */
export function createPsiHState(
  maxSize: number = 20,
  alpha: number = 0.15,
): PsiHState {
  return {
    ringBuffer: [],
    maxSize,
    alpha,
    trend: undefined,
    baseline: undefined,
  };
}

// ============ εR — EXPLORATION RATE (Adaptive Capacity) ============

/**
 * εR range classification.
 */
export type EpsilonRRange = "rigid" | "stable" | "adaptive" | "unstable";

/**
 * εR — Exploration Rate
 *
 * The fraction of decisions that sample from uncertain alternatives
 * rather than exploiting known-best options.
 *
 * High ΦL with zero εR is a WARNING, not a success.
 *
 * @see codex-signum-v3.0.md §εR
 * @see engineering-bridge-v2.0.md §Part 2 "εR"
 */
export interface EpsilonR {
  /** Current exploration rate (0.0–1.0) */
  value: number;
  /** Classified range */
  range: EpsilonRRange;
  /** Exploratory decisions in current window */
  exploratoryDecisions: number;
  /** Total decisions in current window */
  totalDecisions: number;
  /** Floor derived from imperative gradients and spectral calibration */
  floor: number;
  /** Timestamp of last computation */
  computedAt: Date;
}

/**
 * εR range thresholds per v3.0 spec.
 */
export const EPSILON_R_THRESHOLDS = {
  rigid: 0.0,
  stableMin: 0.01,
  stableMax: 0.1,
  adaptiveMin: 0.1,
  adaptiveMax: 0.3,
  /** Above 0.30 = unstable */
  unstable: 0.3,
} as const;

/**
 * Classify εR value into a range.
 */
export function classifyEpsilonR(value: number): EpsilonRRange {
  if (value <= EPSILON_R_THRESHOLDS.rigid) return "rigid";
  if (value <= EPSILON_R_THRESHOLDS.stableMax) return "stable";
  if (value <= EPSILON_R_THRESHOLDS.adaptiveMax) return "adaptive";
  return "unstable";
}

// ============ MATURITY INDEX ============

/**
 * Network maturity index — modulates thresholds.
 * A young network where mean ΦL is 0.6 is healthy.
 * A mature network where mean ΦL is 0.6 is sick.
 *
 * @see engineering-bridge-v2.0.md §Part 2 "Adaptive thresholds"
 */
export interface MaturityIndex {
  /** Composite maturity score (0.0–1.0) */
  value: number;
  /** Maturity classification */
  classification: "young" | "maturing" | "mature";
  /** Component factors */
  factors: {
    /** Normalised mean observation depth across all components */
    meanObservationDepth: number;
    /** Normalised connection density */
    connectionDensity: number;
    /** Normalised mean component age */
    meanComponentAge: number;
    /** Normalised mean ΦL across ecosystem */
    meanPhiLEcosystem: number;
  };
  /** Maturity-indexed thresholds */
  thresholds: {
    phiLHealthy: number;
    phiLDegraded: number;
    epsilonRStableMin: number;
    epsilonRStableMax: number;
    psiHDissonance: number;
  };
}

/**
 * Maturity-indexed threshold tables per Engineering Bridge v2.0.
 */
export const MATURITY_THRESHOLDS = {
  young: {
    phiLHealthy: 0.6,
    phiLDegraded: 0.4,
    epsilonRStableMin: 0.1,
    epsilonRStableMax: 0.4,
    psiHDissonance: 0.25,
  },
  maturing: {
    phiLHealthy: 0.7,
    phiLDegraded: 0.5,
    epsilonRStableMin: 0.05,
    epsilonRStableMax: 0.3,
    psiHDissonance: 0.2,
  },
  mature: {
    phiLHealthy: 0.8,
    phiLDegraded: 0.6,
    epsilonRStableMin: 0.01,
    epsilonRStableMax: 0.15,
    psiHDissonance: 0.15,
  },
} as const;

// ============ COMBINED STATE ============

/**
 * The three state dimensions combined.
 * Every morpheme carries this.
 */
export interface StateDimensions {
  phiL: PhiL;
  psiH: PsiH;
  epsilonR: EpsilonR;
}
