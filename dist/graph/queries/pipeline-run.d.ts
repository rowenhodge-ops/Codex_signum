import type { Record as Neo4jRecord } from "neo4j-driver";
/**
 * PipelineRun nodes carry dual labels: :Bloom:PipelineRun
 * INSTANTIATES → def:morpheme:bloom + def:bloom:execution
 * Specialisation label :PipelineRun retained for constraint scoping and query performance.
 * type = 'pipeline'
 *
 * Created through instantiateMorpheme() with Highlander Protocol.
 * a6Justification: distinct_temporal_scale — every run is a unique temporal instance.
 */
/** Properties for a PipelineRun node (Stratum 2 — execution instance) */
export interface PipelineRunProps {
    id: string;
    intent: string;
    bloomId: string;
    taskCount: number;
    startedAt: string;
    completedAt?: string;
    durationMs?: number;
    modelDiversity?: number;
    overallQuality?: number;
    status: "running" | "completed" | "failed";
}
/** Canonical Architect pipeline stages */
export declare const ARCHITECT_STAGES: readonly ["SURVEY", "DECOMPOSE", "CLASSIFY", "SEQUENCE", "GATE", "DISPATCH", "ADAPT"];
/**
 * Create a PipelineRun node through the Instantiation Protocol.
 *
 * Uses instantiateMorpheme('bloom') with:
 * - transformationDefId: def:bloom:execution
 * - a6Justification: distinct_temporal_scale (every run is unique)
 * - Parent: props.bloomId (the Architect Bloom)
 *
 * After instantiation, adds the :PipelineRun specialisation label.
 */
export declare function createPipelineRun(props: PipelineRunProps): Promise<void>;
/** Update a PipelineRun when it completes */
export declare function completePipelineRun(runId: string, completedAt: string, durationMs: number, overallQuality: number, modelDiversity: number, taskCount?: number): Promise<void>;
/** Get a specific PipelineRun by ID */
export declare function getPipelineRun(runId: string): Promise<Neo4jRecord | null>;
/** List recent PipelineRuns for a Bloom, ordered by startedAt DESC */
export declare function listPipelineRuns(bloomId: string, limit?: number): Promise<Neo4jRecord[]>;
/** Mark a PipelineRun as failed with an error message */
export declare function failPipelineRun(runId: string, error: string): Promise<void>;
//# sourceMappingURL=pipeline-run.d.ts.map