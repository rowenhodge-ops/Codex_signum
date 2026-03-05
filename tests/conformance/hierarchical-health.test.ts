// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Hierarchical Health Orchestration
 *
 * computeHierarchicalHealth() is NOT pure — it calls graph/queries.ts.
 * Full integration tests require a live Neo4j connection.
 *
 * These tests verify the pure helper functions and the structural contract.
 * @future(M-9.V) tests assert the full v4.3 spec vertical compute flow:
 *   raw observations → signal conditioning → 4-factor ΦL → topology-aware
 *   dampening → cascade-limited aggregation → system health.
 *
 * @see codex-signum-v4_3-draft.md §Formal Calculations, §Degradation Cascade Mechanics
 * @see engineering-bridge-v2.0.md §Part 2 "Hierarchical Aggregation"
 */
import { describe, expect, it, vi } from "vitest";
import { aggregateHealth } from "../../src/computation/aggregation.js";
import type { AggregateHealth, ChildHealth } from "../../src/computation/aggregation.js";
import { computeGammaEffective, SAFETY_BUDGET, CASCADE_LIMIT } from "../../src/computation/dampening.js";

// ── Pure computation (aggregateHealth from aggregation.ts) ─────────────────
// hierarchical-health.ts orchestrates aggregateHealth across graph levels.
// Test the pure computation that it delegates to.

describe("aggregateHealth — pure function underneath hierarchical walk", () => {
  it("empty children: returns zeroed health", () => {
    const result = aggregateHealth([], null, 0);
    expect(result.phiL_effective).toBe(0);
    expect(result.constituentCount).toBe(0);
  });

  it("single child: phiL_effective matches child", () => {
    const child: ChildHealth = {
      id: "leaf-1",
      phiL_effective: 0.85,
      psiH_combined: 0.7,
      epsilonR_value: 0.15,
      weight: 1,
    };
    const result = aggregateHealth([child], null, 1);
    expect(result.phiL_effective).toBeCloseTo(0.85, 6);
  });

  it("two equal-weight children: phiL_effective is mean", () => {
    const children: ChildHealth[] = [
      { id: "c1", phiL_effective: 0.9, psiH_combined: 0.8, epsilonR_value: 0.1, weight: 1 },
      { id: "c2", phiL_effective: 0.6, psiH_combined: 0.5, epsilonR_value: 0.2, weight: 1 },
    ];
    const result = aggregateHealth(children, null, 1);
    expect(result.phiL_effective).toBeCloseTo(0.75, 6);
  });

  it("result phiL_effective in [0, 1]", () => {
    const children: ChildHealth[] = [
      { id: "c1", phiL_effective: 0.8, psiH_combined: 0.7, epsilonR_value: 0.12, weight: 1 },
    ];
    const result = aggregateHealth(children, null, 1);
    expect(result.phiL_effective).toBeGreaterThanOrEqual(0);
    expect(result.phiL_effective).toBeLessThanOrEqual(1);
  });
});

// ── @future(M-9.V): Vertical Compute Flow ────────────────────────────────
// These tests assert the v4.3 spec contracts for the full health hierarchy.
// They are expected to FAIL until M-9.V wires the vertical compute stack.
//
// The spec requires (v4.3 §Formal Calculations, §Degradation Cascade):
// 1. ΦL is a 4-factor composite (axiom_compliance, provenance_clarity,
//    usage_success_rate, temporal_stability), NOT a qualityScore proxy
// 2. Maturity modifier: ΦL_effective = ΦL_raw × maturity_factor
//    where maturity_factor = (1 - e^(-k₁ × observations)) × (1 - e^(-k₂ × connections))
// 3. Dampening: γ_effective = min(γ_base, safety_budget / k) per level
// 4. Cascade limit: propagation stops at depth 2
// 5. Hysteresis: recovery = degradation rate / 2.5
// 6. Aggregation: node → pattern → bloom → system (bottom-up)

describe("computeHierarchicalHealth — @future(M-9.V) vertical compute", () => {
  // Mock the graph queries module to provide controlled topology
  vi.mock("../../src/graph/queries.js", () => ({
    getPatternsWithHealth: vi.fn().mockResolvedValue([
      { id: "seed-1", phiL: 0.9, state: "active", degree: 1 },
      { id: "seed-2", phiL: 0.3, state: "active", degree: 2 },
      { id: "seed-3", phiL: 0.7, state: "active", degree: 1 },
    ]),
    getContainersBottomUp: vi.fn().mockResolvedValue([
      { id: "pattern-alpha", depth: 0 },
      { id: "bloom-core", depth: 1 },
    ]),
    getContainedChildren: vi.fn().mockImplementation(async (containerId: string) => {
      if (containerId === "pattern-alpha") {
        return [
          { id: "seed-1", phiL: 0.9, observationCount: 50, connectionCount: 3 },
          { id: "seed-2", phiL: 0.3, observationCount: 20, connectionCount: 1 },
        ];
      }
      if (containerId === "bloom-core") {
        return [
          { id: "pattern-alpha", phiL: 0.6, observationCount: 35, connectionCount: 2 },
          { id: "seed-3", phiL: 0.7, observationCount: 40, connectionCount: 2 },
        ];
      }
      return [];
    }),
    getSubgraphEdges: vi.fn().mockResolvedValue([]),
    getPatternAdjacency: vi.fn().mockResolvedValue([]),
  }));

  it("@future(M-9.V) bottom-up walk computes deepest containers first", async () => {
    const { computeHierarchicalHealth } = await import(
      "../../src/computation/hierarchical-health.js"
    );
    const results = await computeHierarchicalHealth();

    // pattern-alpha (depth 0) should be computed before bloom-core (depth 1)
    expect(results.has("pattern-alpha")).toBe(true);
    expect(results.has("bloom-core")).toBe(true);
    // bloom-core's health depends on pattern-alpha being already computed
    const bloomHealth = results.get("bloom-core")!;
    expect(bloomHealth.level).toBeGreaterThan(results.get("pattern-alpha")!.level);
  });

  it("@future(M-9.V) health includes 4-factor ΦL decomposition with maturity modifier", async () => {
    const { computeHierarchicalHealth } = await import(
      "../../src/computation/hierarchical-health.js"
    );
    const results = await computeHierarchicalHealth();

    // v4.3 spec: ΦL = w₁×axiom_compliance + w₂×provenance_clarity +
    //   w₃×usage_success_rate + w₄×temporal_stability
    // ΦL_effective = ΦL_raw × maturity_factor
    // maturity_factor = (1 - e^(-k₁ × observations)) × (1 - e^(-k₂ × connections))
    //
    // The AggregateHealth result MUST include the 4-factor decomposition
    // and maturity modifier — not just a bare phiL_effective number.
    // This is the primary vertical compute gap.
    const patternHealth = results.get("pattern-alpha")! as AggregateHealth & {
      phiL_factors?: {
        axiom_compliance: number;
        provenance_clarity: number;
        usage_success_rate: number;
        temporal_stability: number;
      };
      maturity_factor?: number;
    };

    // Per spec: aggregate health MUST carry the 4-factor decomposition
    expect(patternHealth.phiL_factors).toBeDefined();
    expect(patternHealth.phiL_factors!.axiom_compliance).toBeGreaterThanOrEqual(0);
    expect(patternHealth.phiL_factors!.provenance_clarity).toBeGreaterThanOrEqual(0);
    expect(patternHealth.phiL_factors!.usage_success_rate).toBeGreaterThanOrEqual(0);
    expect(patternHealth.phiL_factors!.temporal_stability).toBeGreaterThanOrEqual(0);

    // Per spec: maturity modifier MUST be computed and present
    expect(patternHealth.maturity_factor).toBeDefined();
    expect(patternHealth.maturity_factor!).toBeGreaterThan(0);
    expect(patternHealth.maturity_factor!).toBeLessThanOrEqual(1);
  });

  it("@future(M-9.V) aggregation applies topology-aware dampening to propagation", async () => {
    const { computeHierarchicalHealth } = await import(
      "../../src/computation/hierarchical-health.js"
    );
    const results = await computeHierarchicalHealth();

    // v4.3 spec: impact_at_container = component_ΦL_drop × weight × γ_effective(k)
    // γ_effective = min(γ_base, safety_budget / k)
    // For pattern-alpha with k=2: γ = min(0.7, 0.8/2) = 0.4
    //
    // Currently aggregateHealth does a weighted mean WITHOUT dampening.
    // The spec requires the propagated ΦL_drop to be dampened by γ_effective.
    // With seed-1 (ΦL=0.9) and seed-2 (ΦL=0.3), raw mean = 0.6.
    // With dampening, the degradation from seed-2 should be attenuated:
    // The dampened result should differ from the raw mean.
    const patternHealth = results.get("pattern-alpha")! as AggregateHealth & {
      dampening_applied?: boolean;
      gamma_effective?: number;
    };

    // Per spec: aggregation must track that dampening was applied
    expect(patternHealth.dampening_applied).toBe(true);
    // Per spec: effective dampening factor for k=2 should be 0.4
    expect(patternHealth.gamma_effective).toBeCloseTo(0.4, 2);
  });

  it("@future(M-9.V) cascade limit enforced: propagation stops at depth 2", async () => {
    // v4.3 spec: CASCADE_LIMIT = 2
    expect(CASCADE_LIMIT).toBe(2);

    // Verify the dampening formula guarantees subcriticality for all k
    for (const k of [1, 2, 3, 5, 10, 50]) {
      const gamma = computeGammaEffective(k);
      const mu = k * gamma;
      expect(mu).toBeLessThanOrEqual(SAFETY_BUDGET);
      expect(mu).toBeLessThan(1);
    }

    // Per spec: the hierarchical walk must track propagation depth
    // and stop at CASCADE_LIMIT. The result should include depth info.
    const { computeHierarchicalHealth } = await import(
      "../../src/computation/hierarchical-health.js"
    );
    const results = await computeHierarchicalHealth();
    const bloomHealth = results.get("bloom-core")! as AggregateHealth & {
      cascade_depth?: number;
    };

    // Per spec: cascade depth must be tracked and limited
    expect(bloomHealth.cascade_depth).toBeDefined();
    expect(bloomHealth.cascade_depth!).toBeLessThanOrEqual(CASCADE_LIMIT);
  });

  it("@future(M-9.V) leaf node health includes signal-conditioned ΦL", async () => {
    const { computeHierarchicalHealth } = await import(
      "../../src/computation/hierarchical-health.js"
    );
    const results = await computeHierarchicalHealth();

    // Per spec: leaf node ΦL should be computed from signal-conditioned
    // observations, not raw qualityScore proxy.
    // Currently: leaf health is stored phiL from getPatternsWithHealth()
    // which is the qualityScore proxy. Real vertical compute requires
    // raw observations → 7-stage signal conditioning → 4-factor ΦL.
    const seed1 = results.get("seed-1")! as AggregateHealth & {
      signal_conditioned?: boolean;
    };

    expect(seed1).toBeDefined();
    expect(seed1.phiL_effective).toBeGreaterThanOrEqual(0);
    // Per spec: the value must come from signal conditioning, not proxy
    expect(seed1.signal_conditioned).toBe(true);
  });

  it("@future(M-9.V) empty graph returns empty map", async () => {
    // Override mocks for this test
    const queries = await import("../../src/graph/queries.js");
    vi.mocked(queries.getPatternsWithHealth).mockResolvedValueOnce([]);
    vi.mocked(queries.getContainersBottomUp).mockResolvedValueOnce([]);

    const { computeHierarchicalHealth } = await import(
      "../../src/computation/hierarchical-health.js"
    );
    const results = await computeHierarchicalHealth();
    expect(results.size).toBe(0);
  });
});
