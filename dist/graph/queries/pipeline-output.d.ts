/**
 * Properties for a pipeline-output Seed node.
 * Distinct from SeedProps (LLM model instances) — this captures
 * the content output of a pipeline task or DevAgent stage.
 */
export interface PipelineOutputSeedProps {
    id: string;
    name: string;
    seedType: "pipeline-output";
    content: string;
    qualityScore: number | null;
    modelId: string | null;
    charCount: number;
    durationMs: number;
    runId: string;
    taskId: string;
    order: number;
}
/**
 * Create or update a Seed node representing a pipeline output.
 * Uses MERGE for idempotency.
 */
export declare function createPipelineOutputSeed(props: PipelineOutputSeedProps): Promise<void>;
/**
 * Create a CONTAINS relationship from a PipelineRun to a Seed.
 * Returns true if the relationship was created, false if either node is missing.
 */
export declare function linkSeedToPipelineRun(seedId: string, runId: string, order: number): Promise<boolean>;
/**
 * Shared helper: create a pipeline output Seed and link it to its PipelineRun.
 * Non-fatal — logs a warning on failure, never throws.
 * (REVIEW correction: DRY helper used by both Architect and DevAgent paths)
 */
export declare function tryCreateAndLinkSeed(props: PipelineOutputSeedProps): Promise<void>;
//# sourceMappingURL=pipeline-output.d.ts.map