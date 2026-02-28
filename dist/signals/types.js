// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
export const DEFAULT_CONFIG = {
    debounce: { windowMs: 100, persistenceCount: 3 },
    hampel: { windowSize: 7, k: 3 },
    ewma: { alphaLeaf: 0.25, alphaDefault: 0.15, alphaHub: 0.08 },
    cusum: { h: 5, k: 0.5, firEnabled: true },
    macd: { fastAlpha: 0.25, slowAlpha: 0.04 },
    hysteresis: { bandMultiplier: 2 },
    trend: { windowSize: 40, warningHorizonEvents: 20 },
};
//# sourceMappingURL=types.js.map