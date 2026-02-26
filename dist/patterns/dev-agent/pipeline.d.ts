import type { ArmStats } from "../../graph/queries.js";
import { EphemeralStore } from "../../memory/index.js";
import { type AgentTask, type DevAgentConfig, type DevAgentModelExecutor, type PipelineResult, type QualityAssessor, type RoutableModel } from "./types.js";
/**
 * The DevAgent — runs tasks through a staged pipeline
 * with Thompson Sampling routing and Correction Helix.
 */
export declare class DevAgent {
    private config;
    private memory;
    private models;
    private armStats;
    private decisionCount;
    private executor;
    private assessor;
    constructor(models: RoutableModel[], executor: DevAgentModelExecutor, assessor: QualityAssessor, config?: Partial<DevAgentConfig>);
    run(task: AgentTask): Promise<PipelineResult>;
    private runStage;
    loadArmStats(clusterId: string, stats: ArmStats[]): void;
    getMemory(): EphemeralStore;
}
//# sourceMappingURL=pipeline.d.ts.map