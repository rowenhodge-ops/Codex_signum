// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { DEFAULT_ROUTER_CONFIG } from "../thompson-router/index.js";
/** Default DevAgent configuration */
export const DEFAULT_DEVAGENT_CONFIG = {
    stages: ["scope", "execute", "review", "validate"],
    maxCorrections: 3,
    qualityThreshold: 0.5,
    routerConfig: DEFAULT_ROUTER_CONFIG,
    constitutionalRules: [],
};
/** Pipeline presets */
export const PIPELINE_PRESETS = {
    full: ["scope", "execute", "review", "validate"],
    lite: ["execute", "review", "validate"],
    quick: ["execute", "validate"],
    generate: ["execute"],
};
/** Map AgentTask complexity to DecisionContext complexity */
export function mapComplexity(c) {
    switch (c) {
        case "trivial":
        case "moderate":
            return "low";
        case "complex":
            return "medium";
        case "critical":
            return "high";
    }
}
//# sourceMappingURL=types.js.map