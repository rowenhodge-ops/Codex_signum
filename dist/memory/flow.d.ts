/**
 * Codex Signum — Memory Flow Coordinator
 *
 * Coordinates the upward flow (lossy compression from execution → observation →
 * distillation → institutional) and downward flow (contextual enrichment from
 * institutional → distilled → better defaults).
 *
 * All functions are pure — they compute what SHOULD happen.
 * Callers (graph-feeder, bridges) are responsible for persistence.
 *
 * @see codex-signum-v3.0.md §Memory Topology
 * @module codex-signum-core/memory/flow
 */
import type { Observation } from "../types/memory.js";
import type { PerformanceProfile, RoutingHints } from "./distillation.js";
export interface UpwardFlowInput {
    /** The execution that just completed */
    execution: {
        bloomId: string;
        modelId: string;
        success: boolean;
        qualityScore?: number;
        durationMs: number;
        failureSignature?: string;
        context?: string;
    };
    /** Existing observations for this pattern (for distillation trigger check) */
    existingObservationCount: number;
    /** Existing distillations for this pattern (for institutional promotion check) */
    existingDistillations: Array<{
        id: string;
        confidence: number;
        createdAt: Date;
    }>;
}
export interface UpwardFlowResult {
    /** The observation to persist */
    observation: Observation;
    /** Whether distillation should be triggered */
    shouldDistill: boolean;
    /** Whether institutional promotion should be triggered */
    shouldPromoteToInstitutional: boolean;
}
/**
 * Compute what upward flow actions should happen after an execution.
 *
 * Upward: execution completes → write observation → check distillation trigger
 *         → check institutional promotion
 */
export declare function computeUpwardFlow(input: UpwardFlowInput): UpwardFlowResult;
export interface DownwardFlowInput {
    /** The component requesting context */
    componentId: string;
    /** Available distilled insights for this component */
    distilledInsights: PerformanceProfile[];
    /** Available routing hints */
    routingHints: RoutingHints[];
    /** Relevant institutional knowledge */
    institutionalKnowledge: Array<{
        content: string;
        confidence: number;
        knowledgeType: string;
    }>;
}
export interface MemoryContext {
    /** Performance context for decision-making */
    performanceSummary: string;
    /** Model routing suggestions */
    modelSuggestions: Array<{
        modelId: string;
        reason: string;
    }>;
    /** Known failure modes to watch for */
    knownFailureModes: Array<{
        signature: string;
        mitigation: string;
    }>;
    /** Threshold calibration hints */
    thresholdHints: Array<{
        threshold: string;
        suggestedValue: number;
        confidence: number;
    }>;
    /** Confidence in this context (based on evidence depth) */
    contextConfidence: number;
}
/**
 * Compute the downward flow — synthesize available insights into
 * actionable context for a component.
 *
 * Downward: gather distilled insights + institutional knowledge →
 *           produce enriched context
 */
export declare function computeDownwardFlow(input: DownwardFlowInput): MemoryContext;
//# sourceMappingURL=flow.d.ts.map