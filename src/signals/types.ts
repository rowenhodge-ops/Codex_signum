export interface SignalEvent {
  agentId: string;
  dimension: "phiL" | "psiH" | "epsilonR";
  rawValue: number;
  timestamp: number; // Date.now()
  topologyRole?: "leaf" | "hub" | "default";
}

export interface ConditionedSignal extends SignalEvent {
  smoothedValue: number; // After EWMA
  cusumStatistic: number; // Current CUSUM accumulator
  macdValue: number; // MACD line value
  macdSignal: number; // Signal line (EWMA of MACD)
  trendSlope: number; // Linear regression slope
  trendProjection: number; // Projected value at warning horizon
  alerts: SignalAlert[]; // Any triggered alerts
  filtered: boolean; // Was this event debounced/Hampel-rejected?
}

export interface SignalAlert {
  type:
    | "cusum_shift"
    | "macd_divergence"
    | "hysteresis_alarm"
    | "trend_warning"
    | "nelson_rule";
  severity: "info" | "warning" | "critical";
  message: string;
  ruleId?: string; // e.g. 'nelson_1', 'nelson_2', 'nelson_7'
}

export interface StageConfig {
  debounce: { windowMs: number; persistenceCount: number };
  hampel: { windowSize: number; k: number };
  ewma: { alphaLeaf: number; alphaDefault: number; alphaHub: number };
  cusum: { h: number; k: number; firEnabled: boolean };
  macd: { fastAlpha: number; slowAlpha: number };
  hysteresis: { bandMultiplier: number };
  trend: { windowSize: number; warningHorizonEvents: number };
}

export const DEFAULT_CONFIG: StageConfig = {
  debounce: { windowMs: 100, persistenceCount: 3 },
  hampel: { windowSize: 7, k: 3 },
  ewma: { alphaLeaf: 0.25, alphaDefault: 0.15, alphaHub: 0.08 },
  cusum: { h: 5, k: 0.5, firEnabled: true },
  macd: { fastAlpha: 0.25, slowAlpha: 0.04 },
  hysteresis: { bandMultiplier: 2 },
  trend: { windowSize: 40, warningHorizonEvents: 20 },
};
