// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

export interface SignalEvent {
  agentId: string;
  dimension: "phiL" | "psiH" | "epsilonR";
  rawValue: number;
  timestamp: number; // Date.now()
  topologyRole?: "leaf" | "hub" | "default";
}

export interface ConditionedSignal extends SignalEvent {
  smoothedValue: number; // After EWMA
  cusumStatistic: number; // Current CUSUM accumulator
  macdValue: number; // MACD line value
  macdSignal: number; // Signal line (EWMA of MACD)
  trendSlope: number; // Linear regression slope
  trendProjection: number; // Projected value at warning horizon
  alerts: SignalAlert[]; // Any triggered alerts
  filtered: boolean; // Was this event debounced/Hampel-rejected?
}

export interface SignalAlert {
  type:
    | "cusum_shift"
    | "macd_divergence"
    | "hysteresis_alarm"
    | "trend_warning"
    | "nelson_rule";
  severity: "info" | "warning" | "critical";
  message: string;
  ruleId?: string; // e.g. 'nelson_1', 'nelson_2', 'nelson_7'
}

export interface StageConfig {
  debounce: { windowMs: number; persistenceCount: number };
  hampel: { windowSize: number; k: number };
  ewma: { alphaLeaf: number; alphaDefault: number; alphaHub: number };
  cusum: { h: number; k: number; firEnabled: boolean };
  macd: { fastAlpha: number; slowAlpha: number };
  hysteresis: { bandMultiplier: number };
  trend: { windowSize: number; warningHorizonEvents: number };
}

export const DEFAULT_CONFIG: StageConfig = {
  debounce: { windowMs: 100, persistenceCount: 3 },
  hampel: { windowSize: 7, k: 3 },
  ewma: { alphaLeaf: 0.25, alphaDefault: 0.15, alphaHub: 0.08 },
  cusum: { h: 5, k: 0.5, firEnabled: true },
  macd: { fastAlpha: 0.25, slowAlpha: 0.04 },
  hysteresis: { bandMultiplier: 2 },
  trend: { windowSize: 40, warningHorizonEvents: 20 },
};

// ============ BOCPD — Bayesian Online Change Point Detection ============

/** Result of a single BOCPD observation step. */
export interface BOCPDSignal {
  /** The observed value that was processed */
  value: number;
  /** Most probable run length (MAP estimate) */
  runLength: number;
  /** Probability that the most recent observation is a change point */
  changePointProbability: number;
}

/**
 * Persisted Normal-Inverse-Gamma (NIG) state for BOCPD.
 * Four parallel arrays hold per-run-length posterior hyperparameters.
 * Serialised to JSON for Bloom property persistence.
 */
export interface BOCPDState {
  /** Original prior hyperparameters (for reset) */
  mu0: number;
  kappa0: number;
  alpha0: number;
  beta0: number;
  /** Per-run-length NIG posterior arrays */
  mus: number[];
  kappas: number[];
  alphas: number[];
  betas: number[];
  /** Run-length probability distribution */
  runLengths: number[];
  /** Maximum run length (array size cap) */
  maxRunLength: number;
}

/** Configuration for a BOCPDDetector instance. */
export interface BOCPDConfig {
  /** Prior mean (default: 0) */
  mu0: number;
  /** Prior precision scaling (default: 1) */
  kappa0: number;
  /** Prior shape (default: 1) */
  alpha0: number;
  /** Prior rate (default: 1) */
  beta0: number;
  /** Constant hazard rate — P(change point) per step (default: 1/250) */
  hazardRate: number;
  /** Hard cap on run-length array size (default: 500) */
  maxRunLength: number;
}

export const DEFAULT_BOCPD_CONFIG: BOCPDConfig = {
  mu0: 0,
  kappa0: 1,
  alpha0: 1,
  beta0: 1,
  hazardRate: 1 / 250,
  maxRunLength: 500,
};
