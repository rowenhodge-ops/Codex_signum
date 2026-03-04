// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Architect Pattern Types
 * @module codex-signum-core/patterns/architect
 */

/** A specific claim extracted from a document */
export interface ExtractedClaim {
  /** The claim text (surrounding context, ~200 chars) */
  text: string;
  /** What type of claim */
  type: "formula" | "threshold" | "architectural" | "recommendation" | "warning";
  /** Approximate line number in source */
  lineNumber: number;
}

/** A documentation source discovered by SURVEY */
export interface DocumentSource {
  /** Relative path from repo root */
  path: string;
  /** Document title (first heading or filename) */
  title: string;
  /** Full content (capped at ~8000 chars) */
  content: string;
  /** Extracted claims: formulas, thresholds, architectural assertions */
  extractedClaims: ExtractedClaim[];
}

/** A tracked hypothesis from docs/hypotheses/ */
export interface TrackedHypothesis {
  /** Hypothesis ID (e.g., "H-001") */
  id: string;
  /** Source research paper and section */
  source: string;
  /** The claim being tracked */
  claim: string;
  /** Validation status */
  status:
    | "proposed"
    | "validated"
    | "partially-validated"
    | "invalidated"
    | "superseded"
    | "deferred";
  /** File path of the hypothesis document */
  filePath: string;
}

/** Input to the SURVEY stage */
export interface SurveyInput {
  /** Absolute path to the repository root */
  repoPath: string;
  /** Paths to specification/design markdown files to cross-reference */
  specificationRefs: string[];
  /** Optional: what the user intends to build (provides focus for gap analysis) */
  intent?: string;
  /** Optional: Neo4j driver session for graph state inspection */
  graphClient?: import("neo4j-driver").Session | null;
  /** Paths to scan for documentation (defaults to ['docs/specs/', 'docs/research/'] relative to repoPath) */
  docsPaths?: string[];
  /** Path to hypotheses directory (defaults to 'docs/hypotheses/' relative to repoPath) */
  hypothesesPath?: string;
}

/** A single gap between specification and implementation */
export interface GapItem {
  id: string;
  description: string;
  severity: "critical" | "warning" | "info";
  /** Which spec document and section this gap relates to */
  specRef?: string;
  /** Which code file(s) this gap relates to */
  codeRef?: string[];
  /** Category for grouping */
  category: "duplication" | "missing" | "mismatch" | "drift" | "structural" | "research-divergence";
}

/** Something SURVEY couldn't determine */
export interface BlindSpot {
  description: string;
  /** What additional information would resolve this */
  resolution: string;
}

/** Output from the SURVEY stage */
export interface SurveyOutput {
  /** Unique ID for this survey run */
  surveyId: string;
  /** When the survey was performed */
  timestamp: Date;
  /** The intent that was provided (if any) */
  intent?: string;

  codebaseState: {
    /** Summarised directory tree (top 2-3 levels) */
    directorySummary: string[];
    /** Key files found (package.json, tsconfig.json, barrel index.ts) */
    keyFiles: Record<string, string>;
    /** Recent git commits (--oneline format) */
    recentCommits: string[];
    /** Map of files that import from @codex-signum/core */
    coreImports: Record<string, string[]>;
    /** Files detected as duplicating core functionality */
    duplications: Array<{
      localFile: string;
      duplicates: string;
      confidence: "high" | "medium" | "low";
    }>;
    /** Entry point files (CLI scripts, main files) */
    entryPoints: string[];
  };

  graphState: {
    /** Bloom health readings: bloom id → ΦL value */
    bloomHealth: Record<string, number>;
    /** Number of active (unresolved) cascade events */
    activeCascades: number;
    /** Recent threshold events (last 7 days) */
    thresholdEvents: string[];
    /** Constitutional alerts from graph */
    constitutionalAlerts: string[];
  } | null;

  gapAnalysis: {
    /** Components/functions confirmed to exist and work */
    whatExists: string[];
    /** Components the spec requires but code doesn't have */
    whatNeedsBuilding: string[];
    /** Components the spec requires that code has incorrectly */
    whatNeedsFixing: string[];
    /** Structured gap items with references */
    gaps: GapItem[];
  };

  /** All documentation sources discovered and parsed */
  documentSources: DocumentSource[];
  /** Tracked hypotheses from docs/hypotheses/ */
  hypotheses: TrackedHypothesis[];
  /** 0.0-1.0: how confident SURVEY is in its assessment */
  confidence: number;
  /** What SURVEY couldn't determine */
  blindSpots: BlindSpot[];
}

/** Parsed assertion from a specification document */
export interface SpecAssertion {
  /** The assertion text (e.g., "HYSTERESIS_RATIO = 2.5") */
  assertion: string;
  /** Source file and approximate location */
  source: string;
  /** Category: parameter value, interface requirement, architectural rule */
  category: "parameter" | "interface" | "architecture" | "behaviour";
}

// ============ PIPELINE TYPES (Architect pattern) ============
// These types support the 7-stage Architect pipeline:
// SURVEY → DECOMPOSE → CLASSIFY → SEQUENCE → GATE → DISPATCH → ADAPT

export type TaskType = "mechanical" | "generative";
export type EffortEstimate = "small" | "medium" | "large" | "epic";
export type ComplexityEstimate = "trivial" | "low" | "medium" | "high";
export type GateDecision = "approve" | "modify" | "abort";
export type AdaptationScope = "task" | "phase" | "plan";
export type PlanStatus =
  | "surveying"
  | "decomposing"
  | "classifying"
  | "sequencing"
  | "gated"
  | "executing"
  | "adapting"
  | "completed"
  | "aborted";

export interface Task {
  task_id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  type: TaskType;
  phase: string;
  estimated_complexity: ComplexityEstimate;
  files_affected: string[];
  specification_refs: string[];
  verification: string;
  commit_message: string;
}

export interface Dependency {
  from: string; // task_id
  to: string; // task_id
  type: "hard" | "soft";
}

export interface Phase {
  phase_id: string;
  title: string;
  description: string;
  tasks: string[]; // task_ids
  gate: "auto" | "human";
  gate_criteria: string;
}

export interface TaskGraph {
  intent_id: string;
  tasks: Task[];
  dependencies: Dependency[];
  phases: Phase[];
  estimated_total_effort: EffortEstimate;
  decomposition_confidence: number;
  assumptions: string[];
}

/**
 * Pipeline-specific survey output — simpler than core's SurveyOutput.
 * Used by DECOMPOSE and other pipeline stages that don't need
 * the full spec cross-reference capabilities of core's survey.
 */
export interface PipelineSurveyOutput {
  intent_id: string;
  codebase_state: {
    structure: string;
    recent_changes: string[];
    test_status: "passing" | "failing" | "unknown";
    open_issues: string[];
  };
  graph_state: {
    bloom_health: Record<string, number>;
    active_cascades: number;
    constitutional_alerts: string[];
  };
  gap_analysis: {
    what_exists: string[];
    what_needs_building: string[];
    what_needs_changing: string[];
    risks: string[];
  };
  confidence: number;
  blind_spots: string[];
}

export interface ExecutionPlan {
  intent_id: string;
  ordered_tasks: string[];
  phase_boundaries: Record<string, number>; // phase_id → index
  critical_path: string[];
  estimated_duration: string;
}

export interface GateResponse {
  decision: GateDecision;
  modifications?: string;
  reason?: string;
}

export interface TaskOutcome {
  task_id: string;
  success: boolean;
  output?: string;
  error?: string;
  adaptations_applied: number;
}

export interface PlanState {
  plan_id: string;
  intent: string;
  status: PlanStatus;
  survey?: PipelineSurveyOutput;
  task_graph?: TaskGraph;
  execution_plan?: ExecutionPlan;
  task_outcomes: TaskOutcome[];
  adaptations_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlanQualityMetrics {
  plan_success_rate: number;
  adaptation_rate: number;
  task_first_pass_rate: number;
  dependency_accuracy: number;
  missing_dependency_rate: number;
}

// Constitutional constants
export const MAX_ADAPTATIONS_PER_PLAN = 5;
export const MAX_TASKS_PER_PLAN = 30;
export const MANDATORY_HUMAN_GATE = true;

// ============ EXECUTOR INTERFACES ============

/**
 * ModelExecutor — substrate-agnostic LLM calling interface.
 * Consumers inject their own implementation (which models, which providers,
 * how to call them). Core's Architect stages call this for any LLM interaction.
 */
export interface ModelExecutor {
  execute(
    prompt: string,
    context?: ModelExecutorContext,
  ): Promise<ModelExecutorResult>;
}

export interface ModelExecutorContext {
  /** What type of task this is for (routing hint) */
  taskType?: "planning" | "coding" | "review" | "analytical" | "general";
  /** Complexity hint for model selection */
  complexity?: "simple" | "moderate" | "complex";
  /** Quality requirement (0-1) */
  qualityRequirement?: number;
}

export interface ModelExecutorResult {
  text: string;
  modelId: string;
  durationMs: number;
  wasExploratory?: boolean;
  provider?: string;
  thinkingMode?: string;
  thinkingParameter?: string;
  /** Decision ID from Thompson routing (for outcome quality updates) */
  decisionId?: string;
}

/**
 * TaskExecutor — substrate-agnostic task execution interface.
 * Consumers provide how tasks actually get done (file edits, git commits, etc.).
 * Core's DISPATCH stage calls this for each task.
 */
export interface TaskExecutor {
  execute(
    task: Task,
    context: TaskExecutionContext,
  ): Promise<TaskOutcome>;
}

export interface TaskExecutionContext {
  repoPath: string;
  dryRun: boolean;
  /** Previous task outcomes (for dependency context) */
  previousOutcomes: TaskOutcome[];
  /** Plan-level context */
  planId: string;
  intent: string;
}
