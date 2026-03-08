import type { Record as Neo4jRecord } from "neo4j-driver";
/** Properties for a TaskOutput node (Stratum 2 — individual task result) */
export interface TaskOutputProps {
    id: string;
    runId: string;
    taskId: string;
    title: string;
    taskType: string;
    modelUsed: string;
    provider: string;
    outputLength: number;
    durationMs: number;
    qualityScore?: number;
    hallucinationFlagCount: number;
    status: "succeeded" | "failed";
}
/** Create a TaskOutput node and link to its PipelineRun */
export declare function createTaskOutput(props: TaskOutputProps): Promise<void>;
/** Get all TaskOutputs for a PipelineRun */
export declare function getTaskOutputsForRun(runId: string): Promise<Neo4jRecord[]>;
/** Query TaskOutputs by model pattern with optional quality threshold */
export declare function queryTaskOutputsByModel(modelPattern: string, minQuality?: number): Promise<Neo4jRecord[]>;
/** Update the qualityScore on an existing TaskOutput node */
export declare function updateTaskOutputQuality(taskOutputId: string, qualityScore: number): Promise<void>;
/** Get a single TaskOutput by ID */
export declare function getTaskOutput(taskOutputId: string): Promise<Neo4jRecord | null>;
//# sourceMappingURL=task-output.d.ts.map