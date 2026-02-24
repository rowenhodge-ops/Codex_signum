export interface SignalEvent {
    agentId: string;
    dimension: "phiL" | "psiH" | "epsilonR";
    rawValue: number;
    timestamp: number;
    topologyRole?: "leaf" | "hub" | "default";
}
export interface ConditionedSignal extends SignalEvent {
    smoothedValue: number;
    cusumStatistic: number;
    macdValue: number;
    macdSignal: number;
    trendSlope: number;
    trendProjection: number;
    alerts: SignalAlert[];
    filtered: boolean;
}
export interface SignalAlert {
    type: "cusum_shift" | "macd_divergence" | "hysteresis_alarm" | "trend_warning" | "nelson_rule";
    severity: "info" | "warning" | "critical";
    message: string;
    ruleId?: string;
}
export interface StageConfig {
    debounce: {
        windowMs: number;
        persistenceCount: number;
    };
    hampel: {
        windowSize: number;
        k: number;
    };
    ewma: {
        alphaLeaf: number;
        alphaDefault: number;
        alphaHub: number;
    };
    cusum: {
        h: number;
        k: number;
        firEnabled: boolean;
    };
    macd: {
        fastAlpha: number;
        slowAlpha: number;
    };
    hysteresis: {
        bandMultiplier: number;
    };
    trend: {
        windowSize: number;
        warningHorizonEvents: number;
    };
}
export declare const DEFAULT_CONFIG: StageConfig;
//# sourceMappingURL=types.d.ts.map