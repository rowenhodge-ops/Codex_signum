export declare class EWMASmoother {
    private alphaLeaf;
    private alphaDefault;
    private alphaHub;
    private state;
    constructor(alphaLeaf?: number, alphaDefault?: number, alphaHub?: number);
    process(key: string, rawValue: number, topologyRole?: "leaf" | "hub" | "default"): number;
    private getAlpha;
    getCurrentValue(key: string): number | undefined;
}
//# sourceMappingURL=EWMASmoother.d.ts.map