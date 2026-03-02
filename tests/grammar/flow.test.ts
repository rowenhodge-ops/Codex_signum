/**
 * G4. Flow — Active Lines carry data. Dormant Lines carry nothing.
 *
 * Tests that Bloom state field determines activity, and that
 * Thompson routing only selects active Seeds.
 * Level: L2 Contract + L5 Invariant
 */
import { describe, it, expect } from "vitest";
import {
  route,
  DEFAULT_ROUTER_CONFIG,
  type RoutableModel,
} from "../../src/index.js";

describe("G4 Flow: Thompson routing only selects active Seeds", () => {
  it("route() throws when all models are inactive", () => {
    const models: RoutableModel[] = [
      { id: "m1", name: "Model 1", provider: "test", avgLatencyMs: 100, costPer1kTokens: 0.01, capabilities: ["analysis"], status: "inactive" },
      { id: "m2", name: "Model 2", provider: "test", avgLatencyMs: 200, costPer1kTokens: 0.02, capabilities: ["analysis"], status: "retired" },
    ];
    const ctx = { taskType: "analysis", complexity: "moderate" as const, qualityRequirement: 0.7 };

    expect(() => route(ctx, models, [], 0, DEFAULT_ROUTER_CONFIG)).toThrow();
  });

  it("route() never selects a model with status !== 'active'", () => {
    const models: RoutableModel[] = [
      { id: "active-1", name: "Active", provider: "test", avgLatencyMs: 100, costPer1kTokens: 0.01, capabilities: ["analysis"], status: "active" },
      { id: "inactive-1", name: "Inactive", provider: "test", avgLatencyMs: 50, costPer1kTokens: 0.001, capabilities: ["analysis"], status: "inactive" },
      { id: "degraded-1", name: "Degraded", provider: "test", avgLatencyMs: 80, costPer1kTokens: 0.005, capabilities: ["analysis"], status: "degraded" },
    ];
    const ctx = { taskType: "analysis", complexity: "moderate" as const, qualityRequirement: 0.7 };

    // Run 50 times to catch any probabilistic selection of inactive models
    for (let i = 0; i < 50; i++) {
      const decision = route(ctx, models, [], i, DEFAULT_ROUTER_CONFIG);
      expect(decision.selectedModelId).not.toBe("inactive-1");
      expect(decision.selectedModelId).not.toBe("degraded-1");
    }
  });

  it("single active model is always selected", () => {
    const models: RoutableModel[] = [
      { id: "solo", name: "Solo Active", provider: "test", avgLatencyMs: 100, costPer1kTokens: 0.01, capabilities: ["analysis"], status: "active" },
    ];
    const ctx = { taskType: "analysis", complexity: "moderate" as const, qualityRequirement: 0.7 };

    for (let i = 0; i < 10; i++) {
      const decision = route(ctx, models, [], i, DEFAULT_ROUTER_CONFIG);
      expect(decision.selectedModelId).toBe("solo");
    }
  });
});

describe("G4 Flow: IntegrationState lifecycle is defined", () => {
  it("morpheme types define the full lifecycle", () => {
    const fs = require("node:fs");
    const content = fs.readFileSync("src/types/morphemes.ts", "utf-8");

    // All 7 integration states must be defined
    expect(content).toContain('"created"');
    expect(content).toContain('"dormant"');
    expect(content).toContain('"connected"');
    expect(content).toContain('"active"');
    expect(content).toContain('"degraded"');
    expect(content).toContain('"recovering"');
    expect(content).toContain('"archived"');
  });
});
