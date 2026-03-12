// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Memory Topology Types
 *
 * Four strata of memory with different granularity, retention, and access.
 * Information flows upward through distillation (lossy compression)
 * and downward through application (contextual enrichment).
 *
 * @see codex-signum-v3.0.md §Memory Topology
 * @module codex-signum-core/types/memory
 */

// ============ MEMORY STRATA ============

/**
 * Stratum levels.
 * 1 = Ephemeral (execution context)
 * 2 = Observational (execution records) — RETAINED
 * 3 = Distilled (lessons learned)
 * 4 = Institutional (ecosystem knowledge)
 */
export type MemoryStratum = 1 | 2 | 3 | 4;

// ============ STRATUM 1: EPHEMERAL ============

/**
 * Ephemeral memory — lives only during a single execution.
 * Working memory: input data, intermediate results, retry state.
 * Not shared. Not persisted.
 */
export interface EphemeralMemory {
  stratum: 1;
  /** Which execution this belongs to */
  executionId: string;
  /** The bloom instance running this execution */
  bloomId: string;
  /** Working data (anything needed during execution) */
  data: Record<string, unknown>;
  /** Refinement helix state (if in retry loop) */
  refinementState?: {
    iteration: number;
    maxIterations: number;
    feedback: string[];
  };
  /** Created when execution starts */
  createdAt: Date;
  /** Expires when execution completes */
  expiresAt?: Date;
}

// ============ STRATUM 2: OBSERVATIONAL ============

/**
 * Observation — a single recorded event from an execution.
 * These accumulate and are the raw material for ΦL.
 *
 * CRITICAL: Stratum 2 data is RETAINED. Not ephemeral.
 * Compaction to Stratum 3 summarises but does NOT delete
 * raw observations until storage policy dictates.
 *
 * @see engineering-bridge-v2.0.md §Non-Negotiable Constraints #7
 */
export interface Observation {
  /** Unique identifier */
  id: string;
  stratum: 2;
  /** Timestamp of observation */
  timestamp: Date;
  /** Which bloom produced this observation */
  sourceBloomId: string;
  /** Type of observation */
  observationType: ObservationType;
  /** The observation data */
  data: ObservationData;
  /** Recency weight (decays with age) */
  recencyWeight?: number;
}

export type ObservationType =
  | "execution_outcome"
  | "routing_decision"
  | "constitutional_check"
  | "feedback_event"
  | "degradation_event"
  | "recovery_event"
  | "cascade_event"
  | "refinement_loop"
  | "exploration_event";

/**
 * Observation data — varies by type but always includes outcome.
 */
export interface ObservationData {
  /** Did this succeed? */
  success: boolean;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Quality score if applicable (0.0–1.0) */
  qualityScore?: number;
  /** Cost incurred */
  cost?: number;
  /** Model used (if routing decision) */
  modelUsed?: string;
  /** Tokens consumed */
  tokensUsed?: number;
  /** Poka-yoke error level (if error) */
  errorLevel?: "prevention" | "detection" | "mitigation" | "escape";
  /** Additional context */
  context?: Record<string, unknown>;
}

// ============ STRATUM 3: DISTILLED ============

/**
 * Distillation — cross-component insights from observational patterns.
 * Lossy compression: smaller than input, more actionable meaning.
 *
 * Lifecycle: supersession → confidence decay → relevance pruning
 */
export interface Distillation {
  /** Unique identifier */
  id: string;
  stratum: 3;
  /** When this insight was distilled */
  createdAt: Date;
  /** IDs of observations this was distilled from */
  sourceObservationIds: string[];
  /** The extracted insight */
  insight: string;
  /** Confidence in this distillation (0.0–1.0) */
  confidence: number;
  /** Category of insight */
  category: DistillationCategory;
  /** Which composition/pattern this relates to */
  relatedPatternIds: string[];
  /** Has this been superseded by a newer distillation? */
  supersededBy?: string;
}

export type DistillationCategory =
  | "performance_profile"
  | "failure_signature"
  | "composition_heuristic"
  | "threshold_calibration"
  | "model_preference"
  | "capability_expectation";

// ============ STRATUM 4: INSTITUTIONAL ============

/**
 * Institutional memory — ecosystem-wide knowledge.
 * Transcends individual components. Decays only through explicit obsolescence.
 */
export interface InstitutionalKnowledge {
  /** Unique identifier */
  id: string;
  stratum: 4;
  /** When this knowledge was synthesised */
  createdAt: Date;
  /** The knowledge content */
  content: string;
  /** Type of institutional knowledge */
  knowledgeType: InstitutionalKnowledgeType;
  /** Confidence (0.0–1.0) */
  confidence: number;
  /** How many instances/observations contributed */
  contributingCount: number;
  /** Last reinforced */
  lastReinforced: Date;
}

export type InstitutionalKnowledgeType =
  | "composition_archetype"
  | "failure_mode_common"
  | "environment_adaptation"
  | "evolution_pattern"
  | "anti_pattern";

// ============ DECISION ============

/**
 * A decision node — every routing decision, constitutional check,
 * and feedback outcome. Written to the graph with full context.
 *
 * This IS the system's memory. Not optional logging.
 *
 * @see codex-signum-implementation-README.md §Non-Negotiable Constraints #8
 */
export interface Decision {
  /** Unique identifier */
  id: string;
  /** When this decision was made */
  timestamp: Date;
  /** Context that informed the decision */
  context: DecisionContext;
  /** What alternatives existed */
  alternatives: string[];
  /** What was selected */
  selected: string;
  /** Why it was selected */
  reason: string;
  /** Which constitutional rules were evaluated */
  evaluatedRules: string[];
  /** The outcome (when known) */
  outcome?: DecisionOutcome;
  /** Which bloom made this decision */
  madeByBloomId: string;
}

export interface DecisionContext {
  /** Task type being routed */
  taskType: string;
  /** Complexity classification */
  complexity: "low" | "medium" | "high";
  /** Domain */
  domain: string;
  /** Quality requirement (0.0–1.0) */
  qualityRequirement: number;
  /** Max latency allowed in ms */
  latencyBudgetMs?: number;
  /** Max cost allowed */
  costCeiling?: number;
}

export interface DecisionOutcome {
  /** Did the selected option succeed? */
  success: boolean;
  /** Quality of the result */
  qualityScore: number;
  /** Actual duration */
  durationMs: number;
  /** Actual cost */
  cost: number;
  /** Tokens used */
  tokensUsed?: number;
  /** Was this an exploratory decision? */
  wasExploratory: boolean;
  /** Time of outcome recording */
  recordedAt: Date;
}
