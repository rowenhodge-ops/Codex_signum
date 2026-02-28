// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Hierarchical Health Aggregation
 *
 * Verifies aggregation semantics from v3.0 spec:
 * - ΦL = weighted mean of children
 * - ΨH = computed from subgraph (relational, NOT averaged)
 * - εR = weighted mean of children
 */
import { describe, expect, it } from "vitest";
import {
  aggregateHealth,
  weightedMean,
  type ChildHealth,
  type SubgraphInput,
} from "../../src/computation/aggregation.js";

describe("weightedMean", () => {
  it("computes simple average for equal weights", () => {
    expect(weightedMean([0.8, 0.6], [1, 1])).toBeCloseTo(0.7, 10);
  });

  it("computes weighted average for unequal weights", () => {
    // 0.8 * 3 + 0.4 * 1 = 2.4 + 0.4 = 2.8; / 4 = 0.7
    expect(weightedMean([0.8, 0.4], [3, 1])).toBeCloseTo(0.7, 10);
  });

  it("returns 0 for empty arrays", () => {
    expect(weightedMean([], [])).toBe(0);
  });

  it("returns 0 if all weights are zero", () => {
    expect(weightedMean([0.5, 0.8], [0, 0])).toBe(0);
  });

  it("returns 0 for mismatched array lengths", () => {
    expect(weightedMean([0.5, 0.8], [1])).toBe(0);
  });
});

describe("aggregateHealth", () => {
  it("single child → inherits parent health", () => {
    const children: ChildHealth[] = [
      { id: "a", phiL_effective: 0.8, psiH_combined: 0.7, epsilonR_value: 0.1, weight: 1 },
    ];
    const result = aggregateHealth(children, null, 1);
    expect(result.phiL_effective).toBe(0.8);
    expect(result.psiH_combined).toBe(0.7);
    expect(result.epsilonR_value).toBe(0.1);
    expect(result.constituentCount).toBe(1);
    expect(result.level).toBe(1);
  });

  it("equal-weight children → simple average ΦL and εR", () => {
    const children: ChildHealth[] = [
      { id: "a", phiL_effective: 0.8, psiH_combined: 0.6, epsilonR_value: 0.2, weight: 1 },
      { id: "b", phiL_effective: 0.6, psiH_combined: 0.4, epsilonR_value: 0.1, weight: 1 },
    ];
    const result = aggregateHealth(children, null, 1);
    expect(result.phiL_effective).toBeCloseTo(0.7, 10);
    expect(result.epsilonR_value).toBeCloseTo(0.15, 10);
    expect(result.constituentCount).toBe(2);
  });

  it("unequal-weight children → weighted average", () => {
    const children: ChildHealth[] = [
      { id: "a", phiL_effective: 0.9, psiH_combined: 0.8, epsilonR_value: 0.05, weight: 3 },
      { id: "b", phiL_effective: 0.3, psiH_combined: 0.2, epsilonR_value: 0.25, weight: 1 },
    ];
    const result = aggregateHealth(children, null, 2);

    // ΦL: (0.9*3 + 0.3*1) / 4 = 3.0/4 = 0.75
    expect(result.phiL_effective).toBeCloseTo(0.75, 10);
    // εR: (0.05*3 + 0.25*1) / 4 = 0.4/4 = 0.1
    expect(result.epsilonR_value).toBeCloseTo(0.1, 10);
    expect(result.level).toBe(2);
  });

  it("ΨH computed from subgraph (not averaged) when subgraph provided", () => {
    const children: ChildHealth[] = [
      { id: "a", phiL_effective: 0.8, psiH_combined: 0.2, epsilonR_value: 0.1, weight: 1 },
      { id: "b", phiL_effective: 0.85, psiH_combined: 0.3, epsilonR_value: 0.1, weight: 1 },
      { id: "c", phiL_effective: 0.9, psiH_combined: 0.1, epsilonR_value: 0.1, weight: 1 },
    ];

    // Triangle graph — well-connected, low friction
    const subgraph: SubgraphInput = {
      edges: [
        { from: "a", to: "b", weight: 1 },
        { from: "b", to: "c", weight: 1 },
        { from: "a", to: "c", weight: 1 },
      ],
      nodeHealths: [
        { id: "a", phiL: 0.8 },
        { id: "b", phiL: 0.85 },
        { id: "c", phiL: 0.9 },
      ],
    };

    const result = aggregateHealth(children, subgraph, 1);

    // ΨH should be computed fresh from subgraph, NOT the average of 0.2, 0.3, 0.1
    const childPsiHAvg = (0.2 + 0.3 + 0.1) / 3; // = 0.2
    // For a triangle with similar ΦL values, λ₂ > 0 and friction is low → combined should be > average
    expect(result.psiH_combined).not.toBeCloseTo(childPsiHAvg, 1);
    expect(result.psiH_combined).toBeGreaterThan(0);
    expect(result.psiH_combined).toBeLessThanOrEqual(1);
  });

  it("ΨH falls back to weighted mean when no subgraph data", () => {
    const children: ChildHealth[] = [
      { id: "a", phiL_effective: 0.8, psiH_combined: 0.6, epsilonR_value: 0.1, weight: 1 },
      { id: "b", phiL_effective: 0.7, psiH_combined: 0.4, epsilonR_value: 0.1, weight: 1 },
    ];
    const result = aggregateHealth(children, null, 1);
    // Fallback: weighted mean of children ΨH = (0.6+0.4)/2 = 0.5
    expect(result.psiH_combined).toBeCloseTo(0.5, 10);
  });

  it("zero children → defensive zeroed result", () => {
    const result = aggregateHealth([], null, 0);
    expect(result.phiL_effective).toBe(0);
    expect(result.psiH_combined).toBe(0);
    expect(result.epsilonR_value).toBe(0);
    expect(result.constituentCount).toBe(0);
    expect(result.level).toBe(0);
  });

  it("sets constituentCount and level correctly", () => {
    const children: ChildHealth[] = [
      { id: "a", phiL_effective: 0.5, psiH_combined: 0.5, epsilonR_value: 0.1, weight: 1 },
      { id: "b", phiL_effective: 0.5, psiH_combined: 0.5, epsilonR_value: 0.1, weight: 1 },
      { id: "c", phiL_effective: 0.5, psiH_combined: 0.5, epsilonR_value: 0.1, weight: 1 },
      { id: "d", phiL_effective: 0.5, psiH_combined: 0.5, epsilonR_value: 0.1, weight: 1 },
    ];
    const result = aggregateHealth(children, null, 3);
    expect(result.constituentCount).toBe(4);
    expect(result.level).toBe(3);
  });

  it("ΨH subgraph with empty edges falls back to weighted mean", () => {
    const children: ChildHealth[] = [
      { id: "a", phiL_effective: 0.8, psiH_combined: 0.6, epsilonR_value: 0.1, weight: 1 },
      { id: "b", phiL_effective: 0.7, psiH_combined: 0.4, epsilonR_value: 0.1, weight: 1 },
    ];
    const subgraph: SubgraphInput = {
      edges: [],
      nodeHealths: [
        { id: "a", phiL: 0.8 },
        { id: "b", phiL: 0.7 },
      ],
    };
    const result = aggregateHealth(children, subgraph, 1);
    // Empty edges → falls back to weighted mean
    expect(result.psiH_combined).toBeCloseTo(0.5, 10);
  });
});
