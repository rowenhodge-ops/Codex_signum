// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Gnosis Planning Cycle Types
 *
 * Ecosystem-wide structural prioritisation. The planning cycle reads topology,
 * violations, milestones, and constitutional gaps to produce a ranked list of
 * intents grouped into four categories from roadmap v12.
 *
 * All prioritisation is structural — no LLM. Priority derives from violation
 * severity, gap type, λ₂ contribution, ΦL uplift, and dependency unblocking.
 *
 * @module codex-signum-core/patterns/cognitive/planning-types
 */

/** The four intent categories from roadmap v12 */
export type IntentCategory =
  | "infrastructure"        // Neo4j constraints, pipeline poka-yoke, Thompson fixes
  | "pattern-topology"      // R-52/R-53 composition, wiring gaps, Bloom boundaries
  | "governance"            // CE wiring, agent-as-trigger, adversarial perimeter
  | "substrate-grounding";  // LLM constitutional priming, grounding chain

/** A single prioritised intent */
export interface PlanningIntent {
  /** Unique ID for this intent */
  intentId: string;
  /** Category bucket */
  category: IntentCategory;
  /** Human-readable description of the work */
  description: string;
  /** Structural priority score (higher = do first) */
  priorityScore: number;
  /** What structural properties justify this priority */
  justification: {
    /** Does this close an active violation? Which severity? */
    violationSeverity?: "critical" | "error" | "warning";
    violationCount?: number;
    /** Expected λ₂ improvement (from gap analysis) */
    lambda2Delta?: number;
    /** Which Bloom's ΦL would improve? Current value? */
    phiLTarget?: string;
    phiLCurrent?: number;
    /** Does this unblock other intents? Which ones? */
    unblocks?: string[];
    /** Is this a constitutional gap (mandatory) or topological (advisory)? */
    gapType: "constitutional" | "topological" | "violation" | "milestone";
  };
  /** If from constitutional delta: which definition ID */
  targetDefId?: string;
  /** If from violation: which violation Seed ID */
  violationId?: string;
  /** If from milestone: which milestone Bloom ID */
  milestoneId?: string;
  /** Intent string ready for Architect consumption */
  architectIntent?: string;
}

/** Per-Bloom spectral summary in ecosystem state */
export interface BloomStateEntry {
  id: string;
  name: string;
  phiL: number;
  psiH: number;
  lambda2: number;
  status: string;
  childCount: number;
}

/** Active violation summary entry */
export interface ViolationEntry {
  id: string;
  checkId: string;
  targetNodeId: string;
  severity: string;
  evidence: string;
}

/** Unblocked milestone entry */
export interface MilestoneEntry {
  id: string;
  name: string;
  phiL: number;
  childrenComplete: number;
  childrenTotal: number;
  blockedBy: string[];
}

/** Persistence statistics for intent Seeds */
export interface PersistedIntentStats {
  /** Total intents persisted */
  total: number;
  /** Newly created intent Seeds */
  created: number;
  /** Updated existing intent Seeds (re-plan) */
  updated: number;
  /** Intent Seeds marked resolved (gap no longer exists) */
  resolved: number;
  /** Intents enriched by LLM (top-N) */
  enriched: number;
}

/** Full planning report */
export interface PlanningReport {
  /** When this report was generated */
  timestamp: string;
  /** Ecosystem-level spectral snapshot */
  ecosystemState: {
    totalBlooms: number;
    totalResonators: number;
    totalGrids: number;
    totalHelixes: number;
    /** Per-Bloom spectral summary */
    bloomStates: BloomStateEntry[];
  };
  /** Active violations from the Violation Grid */
  activeViolations: {
    total: number;
    bySeverity: { critical: number; error: number; warning: number };
    /** Top violations by recency/severity */
    top: ViolationEntry[];
  };
  /** Unblocked milestones with structural context */
  milestoneState: {
    total: number;
    complete: number;
    active: number;
    planned: number;
    /** Milestones that could start (prerequisites met) */
    unblocked: MilestoneEntry[];
  };
  /** Constitutional gaps from delta computation */
  constitutionalGaps: number;
  /** LLM model memory state (from structural posteriors) */
  modelMemory: {
    totalModels: number;
    activeModels: number;
    infrastructureFailures: string[];
    driftingModels: string[];
    topPerformers: string[];
    summary: string;
  };
  /** Cross-cycle delta (null on first run) */
  previousCycleDelta: {
    previousTimestamp: string;
    violationDelta: number;
    gapDelta: number;
    intentDelta: number;
  } | null;
  /** Existing backlog summary */
  existingBacklog: {
    activeIntents: number;
    approvedIntents: number;
    proposedIntents: number;
    rItems: number;
  };
  /** BOCPD structural drift detections */
  structuralDrifts: Array<{ bloomId: string; metric: string; changePointProbability: number }>;
  /** Blooms without FLOWS_TO to Compliance Evaluation */
  unwiredBlooms: string[];
  /** Intent persistence statistics (null if persistence not run) */
  persistenceStats: PersistedIntentStats | null;
  /** Ranked intents across all categories */
  intents: PlanningIntent[];
  /** Intents grouped by category (same data, different view) */
  byCategory: Record<IntentCategory, PlanningIntent[]>;
  /** Total processing time */
  processingTimeMs: number;
}
