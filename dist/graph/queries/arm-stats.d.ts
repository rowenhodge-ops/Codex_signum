/** Thompson Sampling arm stats */
export interface ArmStats {
    seedId: string;
    alpha: number;
    beta: number;
    totalTrials: number;
    avgQuality: number;
    avgLatencyMs: number;
    avgCost: number;
    totalCost: number;
}
/** Compute Thompson Sampling arm stats for a context cluster */
export declare function getArmStatsForCluster(clusterId: string): Promise<ArmStats[]>;
//# sourceMappingURL=arm-stats.d.ts.map