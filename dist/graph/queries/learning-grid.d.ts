/**
 * Enforce ring buffer on a Learning Grid by archiving oldest Seeds
 * when the non-archived count exceeds maxSeeds.
 *
 * Uses updateMorpheme() with addLabels: ['Archived'] — the only
 * mutation path allowed by the Instantiation Protocol.
 *
 * @param gridId - The Grid node ID to enforce
 * @param maxSeeds - Maximum non-archived Seeds allowed (default 50)
 * @returns Count of Seeds archived in this call
 */
export declare function enforceGridRingBuffer(gridId: string, maxSeeds?: number): Promise<{
    archived: number;
}>;
//# sourceMappingURL=learning-grid.d.ts.map