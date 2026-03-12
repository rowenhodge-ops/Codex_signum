// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Distillation, Observation, Decision } from "../../types/memory.js";
import type { EpsilonR } from "../../types/state-dimensions.js";
import type { PipelineResult } from "../dev-agent/index.js";

/** An event that the Observer can process */
export interface ObservableEvent {
  type:
    | "pipeline_complete"
    | "decision_made"
    | "quality_assessed"
    | "error_occurred"
    | "refinement_triggered";
  timestamp: Date;
  data: Record<string, unknown>;
}

/** Observer state — accumulated within a session */
export interface ObserverState {
  observations: Observation[];
  distillations: Distillation[];
  decisionsThisSession: Decision[];
  pipelineResults: PipelineResult[];
  epsilonR: EpsilonR;
  sessionStartedAt: Date;
}

/** Feedback recommendation from the Observer */
export interface FeedbackRecommendation {
  scale: "refinement" | "learning" | "evolutionary";
  action: string;
  confidence: number;
  evidence: string[];
}

// ── Graph-backed observation ──────────────────────────────────────────────

/**
 * Observation mode: in-memory (default) or graph-backed (queries Neo4j).
 */
export type ObserverMode = "in-memory" | "graph-backed";

/**
 * GraphObserver interface — queries state dimensions from the Neo4j graph
 * rather than computing from in-memory accumulated events.
 *
 * Allows the Observer to query historical trajectories, distributions, and
 * relational metrics that span beyond the current session.
 *
 * @see engineering-bridge-v2.0.md §Part 8
 */
export interface GraphObserver {
  /**
   * Query the ΦL trajectory for a node over a sliding window.
   * @param nodeId — Graph node ID
   * @param windowSize — Number of recent samples
   * @returns Ordered ΦL values (oldest first)
   */
  queryPhiLTrajectory(
    nodeId: string,
    windowSize: number,
  ): Promise<number[]>;

  /**
   * Query the εR distribution for a node.
   * @param nodeId — Graph node ID
   * @returns Array of recent εR values
   */
  queryEpsilonRDistribution(nodeId: string): Promise<number[]>;

  /**
   * Query ΨH and eigengap for a subgraph.
   * @param subgraphId — Pattern or cluster ID
   * @returns ΨH composite and Fiedler eigengap
   */
  queryPsiH(
    subgraphId: string,
  ): Promise<{ psiH: number; eigengap: number }>;

  /**
   * Query aggregated decision success rates for a pattern.
   * @param patternId — Pattern ID
   * @returns Per-model success stats
   */
  queryDecisionAggregation(
    patternId: string,
  ): Promise<Array<{ modelId: string; successRate: number; count: number }>>;

  /**
   * Query cascade paths reachable from a node.
   * @param nodeId — Source node ID
   * @returns Paths with max γ at each hop
   */
  queryCascadePaths(
    nodeId: string,
  ): Promise<Array<{ path: string[]; maxGamma: number }>>;
}