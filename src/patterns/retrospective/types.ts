// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Retrospective types.
 *
 * runRetrospective() queries the graph and returns structured insights.
 * No LLM. No pipeline. No writes except an optional DistilledInsight node.
 * The graph already contains the answers — this just surfaces them.
 *
 * @module codex-signum-core/patterns/retrospective/types
 */

import type { HealthBand } from "../../types/threshold-event.js";

export interface RetrospectiveOptions {
  /** How far back to query (hours). Default: 24 */
  windowHours?: number;
  /** Limit to specific patterns. Default: all */
  patternIds?: string[];
  /**
   * If true, write a DistilledInsight node to graph for high-signal findings.
   * Default: false. The caller decides whether to persist insights.
   */
  writeInsights?: boolean;
}

/** Thompson convergence per context cluster */
export interface ConvergenceReading {
  contextClusterId: string;
  decisionCount: number;
  /** successes / total in window */
  successRate: number;
  /** Most-selected agent */
  topAgentId: string;
  /** Fraction of decisions going to top agent */
  topAgentSelectionRate: number;
  /**
   * Converging = success rate high AND top agent stabilising.
   * Diverging = success rate low OR agent churn across decisions.
   */
  status: "converging" | "stable" | "diverging" | "insufficient_data";
}

/** Stage health per pattern */
export interface StageReading {
  patternId: string;
  stageName: string;
  observationCount: number;
  /** Average raw observation value in window */
  avgValue: number;
  /** Fraction of observations below 0.6 quality */
  correctionRate: number;
}

/** Degradation events in window */
export interface DegradationReading {
  patternId: string;
  eventCount: number;
  /** Worst band crossed in window */
  lowestBandReached: HealthBand | "unknown";
  /** Did phiL return to previous band by end of window? */
  recovered: boolean;
}

/** Top-level output of runRetrospective() */
export interface RetrospectiveInsights {
  windowHours: number;
  queriedAt: string;
  totalDecisions: number;
  overallSuccessRate: number;
  convergence: ConvergenceReading[];
  stages: StageReading[];
  degradation: DegradationReading[];
  /** IDs of DistilledInsight nodes written, if writeInsights: true */
  insightNodeIds: string[];
}
