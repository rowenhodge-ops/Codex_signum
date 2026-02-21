/**
 * Codex Signum — Memory Strata Operations
 *
 * Four strata, each with distinct retention and promotion rules:
 *
 * Stratum 1: Ephemeral  — In-session context (evaporates at session end)
 * Stratum 2: Observation — RETAINED. Raw signals that feed ΦL.
 * Stratum 3: Distillation — Extracted patterns from multiple observations
 * Stratum 4: Institutional — Permanent governance knowledge
 *
 * Promotion flows upward: 1 → 2 (on significance) → 3 (on pattern) → 4 (on consensus)
 * Stratum 2 is the INFLECTION POINT — everything below evaporates, above persists.
 *
 * @see codex-signum-v3.0.md §Memory Topology
 * @see engineering-bridge-v2.0.md §Part 4 "Memory Topology"
 * @module codex-signum-core/memory
 */
import type { Decision, DecisionContext, DecisionOutcome, Distillation, DistillationCategory, EphemeralMemory, InstitutionalKnowledge, InstitutionalKnowledgeType, Observation, ObservationData, ObservationType } from "../types/memory.js";
/**
 * In-memory execution store. Evaporates when process ends.
 * Keyed by executionId — each execution gets one entry.
 */
export declare class EphemeralStore {
    private entries;
    /** Create an ephemeral entry for an execution */
    add(patternId: string, data?: Record<string, unknown>): EphemeralMemory;
    /** Get by execution ID */
    get(executionId: string): EphemeralMemory | undefined;
    /** Find all entries for a specific pattern */
    findByPattern(patternId: string): EphemeralMemory[];
    /** Get all entries */
    getAll(): EphemeralMemory[];
    /** Clear all (session end) */
    clear(): void;
    /** Count */
    get size(): number;
    /**
     * Update correction state for an execution (Correction Helix).
     */
    updateCorrectionState(executionId: string, iteration: number, maxIterations: number, feedback: string[]): EphemeralMemory | null;
    /**
     * Promote an ephemeral entry to Observation (Stratum 2).
     * This is the critical Stratum 1 → 2 transition.
     */
    promote(executionId: string, observationType: ObservationType, data: ObservationData): Observation | null;
}
/**
 * Create a new Observation directly (without promotion from Stratum 1).
 * Use this for automated signals (e.g., success/failure, latency).
 */
export declare function createObservation(sourcePatternId: string, observationType: ObservationType, data: ObservationData): Observation;
/**
 * Check if observations should be distilled (promoted to Stratum 3).
 *
 * Criteria:
 * - At least `minCount` observations with the same metric
 * - Sufficient variance to extract a meaningful pattern
 * - OR a significant trend (monotonic increase/decrease)
 */
export declare function shouldDistill(observations: Observation[], minCount?: number): boolean;
/**
 * Distill a set of observations into a pattern insight (Stratum 3).
 */
export declare function distillObservations(observations: Observation[], category: DistillationCategory, patternIds?: string[]): Distillation;
/**
 * Create institutional knowledge (Stratum 4).
 * Permanent, governance-level knowledge.
 */
export declare function createInstitutionalKnowledge(content: string, knowledgeType: InstitutionalKnowledgeType, distillations: Distillation[]): InstitutionalKnowledge;
/**
 * Check if distillations should be promoted to institutional knowledge.
 *
 * Criteria:
 * - At least `minDistillations` related distillations
 * - Average confidence above threshold
 * - Distillations span sufficient time range
 */
export declare function shouldPromoteToInstitutional(distillations: Distillation[], minDistillations?: number, minConfidence?: number): boolean;
/**
 * Create a Decision record for the memory system.
 */
export declare function createDecision(context: DecisionContext, alternatives: string[], selected: string, reason: string, madeByPatternId: string, evaluatedRules?: string[]): Decision;
/**
 * Attach an outcome to a decision.
 */
export declare function attachOutcome(decision: Decision, outcome: DecisionOutcome): Decision;
//# sourceMappingURL=operations.d.ts.map