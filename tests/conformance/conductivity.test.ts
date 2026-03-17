// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Line Conductivity (Three-Layer Circuit Model)
 *
 * Tests the pure computation functions for conductivity evaluation.
 * All functions under test are pure — no graph mocks needed.
 *
 * @see src/computation/conductivity.ts
 * @see cs-v5.0.md §Line (Conductivity)
 * @see codex-signum-engineering-bridge-v3_0.md §Line Conductivity
 */
import { describe, expect, it } from "vitest";
import {
  evaluateLayer1,
  evaluateLayer2,
  evaluateLayer3,
  evaluateConductivity,
} from "../../src/computation/conductivity.js";
import type { EndpointState } from "../../src/computation/conductivity.js";

// ─── Helpers ────────────────────────────────────────────────────────

function makeEndpoint(overrides: Partial<EndpointState> = {}): EndpointState {
  return {
    id: "test-node",
    content: "Some content",
    status: "active",
    phiL: 0.8,
    hasInstantiates: true,
    morphemeType: "seed",
    ...overrides,
  };
}

// ─── Layer 1: Morpheme Hygiene ──────────────────────────────────────

describe("evaluateLayer1 — morpheme hygiene", () => {
  it("passes when both endpoints have all properties", () => {
    const source = makeEndpoint({ id: "s1" });
    const target = makeEndpoint({ id: "t1" });
    const result = evaluateLayer1(source, target);
    expect(result.passes).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("fails when source has empty content", () => {
    const source = makeEndpoint({ id: "s1", content: "" });
    const target = makeEndpoint({ id: "t1" });
    const result = evaluateLayer1(source, target);
    expect(result.passes).toBe(false);
    expect(result.failures.some((f) => f.endpointId === "s1" && f.check === "content")).toBe(true);
  });

  it("fails when source has null content", () => {
    const source = makeEndpoint({ id: "s1", content: null });
    const target = makeEndpoint({ id: "t1" });
    const result = evaluateLayer1(source, target);
    expect(result.passes).toBe(false);
    expect(result.failures.some((f) => f.check === "content")).toBe(true);
  });

  it("fails when target has no status", () => {
    const source = makeEndpoint({ id: "s1" });
    const target = makeEndpoint({ id: "t1", status: null });
    const result = evaluateLayer1(source, target);
    expect(result.passes).toBe(false);
    expect(result.failures.some((f) => f.endpointId === "t1" && f.check === "status")).toBe(true);
  });

  it("fails when source has no phiL", () => {
    const source = makeEndpoint({ id: "s1", phiL: null });
    const target = makeEndpoint({ id: "t1" });
    const result = evaluateLayer1(source, target);
    expect(result.passes).toBe(false);
    expect(result.failures.some((f) => f.endpointId === "s1" && f.check === "phiL")).toBe(true);
  });

  it("fails when target has no INSTANTIATES", () => {
    const source = makeEndpoint({ id: "s1" });
    const target = makeEndpoint({ id: "t1", hasInstantiates: false });
    const result = evaluateLayer1(source, target);
    expect(result.passes).toBe(false);
    expect(result.failures.some((f) => f.endpointId === "t1" && f.check === "instantiates")).toBe(true);
  });

  it("reports multiple failures across both endpoints", () => {
    const source = makeEndpoint({ id: "s1", content: "", phiL: null });
    const target = makeEndpoint({ id: "t1", status: null, hasInstantiates: false });
    const result = evaluateLayer1(source, target);
    expect(result.passes).toBe(false);
    expect(result.failures.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── Layer 2: Grammatical Shape ─────────────────────────────────────

describe("evaluateLayer2 — grammatical shape", () => {
  it("CONTAINS passes for valid Bloom → Seed", () => {
    const source = makeEndpoint({ morphemeType: "bloom" });
    const target = makeEndpoint({ morphemeType: "seed" });
    const result = evaluateLayer2(source, target, "CONTAINS");
    expect(result.passes).toBe(true);
  });

  it("CONTAINS passes for valid Bloom → Bloom", () => {
    const source = makeEndpoint({ morphemeType: "bloom" });
    const target = makeEndpoint({ morphemeType: "bloom" });
    const result = evaluateLayer2(source, target, "CONTAINS");
    expect(result.passes).toBe(true);
  });

  it("CONTAINS passes for valid Grid → Seed", () => {
    const source = makeEndpoint({ morphemeType: "grid" });
    const target = makeEndpoint({ morphemeType: "seed" });
    const result = evaluateLayer2(source, target, "CONTAINS");
    expect(result.passes).toBe(true);
  });

  it("CONTAINS fails for invalid parent type (Resonator containing Bloom)", () => {
    const source = makeEndpoint({ morphemeType: "resonator" });
    const target = makeEndpoint({ morphemeType: "bloom" });
    const result = evaluateLayer2(source, target, "CONTAINS");
    expect(result.passes).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("CONTAINS fails for Grid containing Bloom (Grid can only contain Seeds)", () => {
    const source = makeEndpoint({ morphemeType: "grid" });
    const target = makeEndpoint({ morphemeType: "bloom" });
    const result = evaluateLayer2(source, target, "CONTAINS");
    expect(result.passes).toBe(false);
  });

  it("DEPENDS_ON passes for Bloom → Bloom", () => {
    const source = makeEndpoint({ morphemeType: "bloom" });
    const target = makeEndpoint({ morphemeType: "bloom" });
    const result = evaluateLayer2(source, target, "DEPENDS_ON");
    expect(result.passes).toBe(true);
  });

  it("DEPENDS_ON fails for Seed → Bloom", () => {
    const source = makeEndpoint({ morphemeType: "seed" });
    const target = makeEndpoint({ morphemeType: "bloom" });
    const result = evaluateLayer2(source, target, "DEPENDS_ON");
    expect(result.passes).toBe(false);
  });

  it("INSTANTIATES passes when target is Seed", () => {
    const source = makeEndpoint({ morphemeType: "bloom" });
    const target = makeEndpoint({ morphemeType: "seed" });
    const result = evaluateLayer2(source, target, "INSTANTIATES");
    expect(result.passes).toBe(true);
  });

  it("INSTANTIATES fails when target is Bloom", () => {
    const source = makeEndpoint({ morphemeType: "bloom" });
    const target = makeEndpoint({ morphemeType: "bloom" });
    const result = evaluateLayer2(source, target, "INSTANTIATES");
    expect(result.passes).toBe(false);
  });

  it("FLOWS_TO passes by default (generic connection)", () => {
    const source = makeEndpoint({ morphemeType: "seed" });
    const target = makeEndpoint({ morphemeType: "bloom" });
    const result = evaluateLayer2(source, target, "FLOWS_TO");
    expect(result.passes).toBe(true);
  });

  it("SCOPED_TO passes by default (generic connection)", () => {
    const source = makeEndpoint({ morphemeType: "seed" });
    const target = makeEndpoint({ morphemeType: "bloom" });
    const result = evaluateLayer2(source, target, "SCOPED_TO");
    expect(result.passes).toBe(true);
  });
});

// ─── Layer 3: Contextual Fitness ────────────────────────────────────

describe("evaluateLayer3 — contextual fitness", () => {
  it("both healthy (0.9) → low friction", () => {
    const source = makeEndpoint({ phiL: 0.9 });
    const target = makeEndpoint({ phiL: 0.9 });
    const result = evaluateLayer3(source, target);
    expect(result.friction).toBeCloseTo(0.1, 6);
  });

  it("one degraded (0.2) → high friction", () => {
    const source = makeEndpoint({ phiL: 0.9 });
    const target = makeEndpoint({ phiL: 0.2 });
    const result = evaluateLayer3(source, target);
    expect(result.friction).toBeCloseTo(0.8, 6);
  });

  it("both perfect (1.0) → zero friction", () => {
    const source = makeEndpoint({ phiL: 1.0 });
    const target = makeEndpoint({ phiL: 1.0 });
    const result = evaluateLayer3(source, target);
    expect(result.friction).toBeCloseTo(0.0, 6);
  });

  it("both zero (0.0) → maximum friction", () => {
    const source = makeEndpoint({ phiL: 0.0 });
    const target = makeEndpoint({ phiL: 0.0 });
    const result = evaluateLayer3(source, target);
    expect(result.friction).toBeCloseTo(1.0, 6);
  });

  it("defaults to 0.5 when ΦL is null → moderate friction", () => {
    const source = makeEndpoint({ phiL: null });
    const target = makeEndpoint({ phiL: null });
    const result = evaluateLayer3(source, target);
    expect(result.friction).toBeCloseTo(0.5, 6);
  });

  it("one null, one healthy → friction from the null default", () => {
    const source = makeEndpoint({ phiL: null });
    const target = makeEndpoint({ phiL: 0.9 });
    const result = evaluateLayer3(source, target);
    // min(0.5, 0.9) = 0.5, friction = 1.0 - 0.5 = 0.5
    expect(result.friction).toBeCloseTo(0.5, 6);
  });

  it("preserves taskClass in result", () => {
    const source = makeEndpoint({ phiL: 0.8 });
    const target = makeEndpoint({ phiL: 0.7 });
    const result = evaluateLayer3(source, target, "analytical");
    expect(result.taskClass).toBe("analytical");
  });

  it("friction is always in [0, 1]", () => {
    for (const sPhiL of [0, 0.1, 0.5, 0.9, 1.0]) {
      for (const tPhiL of [0, 0.1, 0.5, 0.9, 1.0]) {
        const result = evaluateLayer3(
          makeEndpoint({ phiL: sPhiL }),
          makeEndpoint({ phiL: tPhiL }),
        );
        expect(result.friction).toBeGreaterThanOrEqual(0);
        expect(result.friction).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ─── evaluateConductivity — Orchestrator ────────────────────────────

describe("evaluateConductivity — three-layer orchestrator", () => {
  it("dark when Layer 1 fails (effectiveFriction = 1.0)", () => {
    const source = makeEndpoint({ id: "s1", content: "" }); // Layer 1 fail
    const target = makeEndpoint({ id: "t1" });
    const result = evaluateConductivity(source, target, "FLOWS_TO");
    expect(result.conducts).toBe(false);
    expect(result.effectiveFriction).toBe(1.0);
    expect(result.layer1.passes).toBe(false);
  });

  it("dark when Layer 2 fails (effectiveFriction = 1.0)", () => {
    const source = makeEndpoint({ id: "s1", morphemeType: "seed" });
    const target = makeEndpoint({ id: "t1", morphemeType: "bloom" });
    const result = evaluateConductivity(source, target, "DEPENDS_ON"); // needs Bloom→Bloom
    expect(result.conducts).toBe(false);
    expect(result.effectiveFriction).toBe(1.0);
    expect(result.layer2.passes).toBe(false);
  });

  it("dark when both Layer 1 and Layer 2 fail", () => {
    const source = makeEndpoint({ id: "s1", content: "", morphemeType: "seed" });
    const target = makeEndpoint({ id: "t1", morphemeType: "bloom" });
    const result = evaluateConductivity(source, target, "DEPENDS_ON");
    expect(result.conducts).toBe(false);
    expect(result.effectiveFriction).toBe(1.0);
  });

  it("conducts with friction when both layers pass", () => {
    const source = makeEndpoint({ id: "s1", phiL: 0.9, morphemeType: "bloom" });
    const target = makeEndpoint({ id: "t1", phiL: 0.7, morphemeType: "seed" });
    const result = evaluateConductivity(source, target, "CONTAINS");
    expect(result.conducts).toBe(true);
    expect(result.effectiveFriction).toBeCloseTo(0.3, 6); // 1.0 - min(0.9, 0.7)
    expect(result.layer1.passes).toBe(true);
    expect(result.layer2.passes).toBe(true);
  });

  it("conducts with low friction when both healthy", () => {
    const source = makeEndpoint({ id: "s1", phiL: 0.95, morphemeType: "bloom" });
    const target = makeEndpoint({ id: "t1", phiL: 0.9, morphemeType: "bloom" });
    const result = evaluateConductivity(source, target, "DEPENDS_ON");
    expect(result.conducts).toBe(true);
    expect(result.effectiveFriction).toBeCloseTo(0.1, 6);
  });

  it("Layer 3 friction still computed even when line is dark", () => {
    const source = makeEndpoint({ id: "s1", content: "", phiL: 0.9 });
    const target = makeEndpoint({ id: "t1", phiL: 0.8 });
    const result = evaluateConductivity(source, target, "FLOWS_TO");
    expect(result.conducts).toBe(false);
    expect(result.effectiveFriction).toBe(1.0); // dark overrides
    // But Layer 3 is still computed independently
    expect(result.layer3.friction).toBeCloseTo(0.2, 6);
  });

  it("evaluatedAt is a Date", () => {
    const source = makeEndpoint({ id: "s1" });
    const target = makeEndpoint({ id: "t1" });
    const result = evaluateConductivity(source, target, "FLOWS_TO");
    expect(result.evaluatedAt).toBeInstanceOf(Date);
  });

  it("taskClass propagated to Layer 3", () => {
    const source = makeEndpoint({ id: "s1" });
    const target = makeEndpoint({ id: "t1" });
    const result = evaluateConductivity(source, target, "FLOWS_TO", "mechanical");
    expect(result.layer3.taskClass).toBe("mechanical");
  });
});
