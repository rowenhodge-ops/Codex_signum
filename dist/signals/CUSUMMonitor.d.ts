export interface CUSUMResult {
    upperCusum: number;
    lowerCusum: number;
    alarm: boolean;
    direction: "up" | "down" | "none";
}
export declare class CUSUMMonitor {
    private h;
    private k;
    private firEnabled;
    private state;
    constructor(h?: number, k?: number, firEnabled?: boolean);
    process(key: string, value: number): CUSUMResult;
    initializeAgent(key: string, baseline: number): void;
}
//# sourceMappingURL=CUSUMMonitor.d.ts.map