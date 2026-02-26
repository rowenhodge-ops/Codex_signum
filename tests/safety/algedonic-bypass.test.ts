/**
 * Codex Signum — SAFETY INVARIANT: Algedonic Bypass
 *
 * When ΦL < 0.1, dampening MUST be bypassed: γ = 1.0 (emergency escalation).
 * This enables immediate full-strength propagation for critical degradation events,
 * bypassing all topology-aware attenuation.
 *
 * The algedonic channel is an emergency pathway that overrides normal dampening.
 * Without this, critical failures in one part of the system can be silenced
 * before reaching governance layers.
 *
 * If this test FAILS, the algedonic bypass is not implemented in the system.
 * This is a Phase 3 fix to add this check to computeDegradationImpact.
 *
 * Source: Engineering Bridge v2.0 §Part 3 "Algedonic Bypass"
 */
import { describe, expect, it } from "vitest";
import {
  computeDampening,
  propagateDegradation,
} from "../../src/computation/dampening.js";
import type { PropagationNode } from "../../src/computation/dampening.js";

/**
 * Algedonic bypass: when the SOURCE node has ΦL < 0.1, the degradation
 * signal propagates at full strength (γ = 1.0) regardless of topology.
 *
 * Implementation note: this requires checking the source ΦL before applying
 * topology-aware dampening. If not yet implemented, these tests will FAIL —
 * which is correct. They define the target behaviour.
 */

describe("SAFETY: algedonic bypass — ΦL < 0.1 forces full propagation", () => {
  function makeNodes(sourcePhiL: number): Map<string, PropagationNode> {
    return new Map([
      // High-degree hub (would normally dampen heavily)
      ["source", { id: "source", phiL: sourcePhiL, degree: 10, neighbors: ["n1", "n2", "n3"] }],
      ["n1", { id: "n1", phiL: 0.8, degree: 2, neighbors: ["source"] }],
      ["n2", { id: "n2", phiL: 0.75, degree: 2, neighbors: ["source"] }],
      ["n3", { id: "n3", phiL: 0.9, degree: 2, neighbors: ["source"] }],
    ]);
  }

  it("normal ΦL (0.8): high-degree hub → dampened propagation", () => {
    const nodes = makeNodes(0.8);
    const result = propagateDegradation("source", 0.5, nodes);
    const n1New = result.updatedPhiL.get("n1");
    if (n1New !== undefined) {
      // With degree 10: γ = 0.8/9 ≈ 0.089; impact = 0.089 × 0.5 ≈ 0.044
      // n1 old = 0.8; n1 new ≈ 0.756 (dampened)
      const impact = 0.8 - n1New;
      expect(impact).toBeLessThan(0.5); // Significantly less than severity
    }
  });

  it("critical ΦL (0.05 < 0.1): algedonic bypass → full propagation (γ = 1.0)", () => {
    const nodes = makeNodes(0.05);
    const result = propagateDegradation("source", 0.5, nodes);
    const n1New = result.updatedPhiL.get("n1");
    if (n1New !== undefined) {
      // With bypass: impact = 1.0 × 0.5 = 0.5; n1 new = 0.8 - 0.5 = 0.3
      const impact = 0.8 - n1New;
      // Impact should be close to full severity (0.5), not dampened
      expect(impact).toBeCloseTo(0.5, 1);
    } else {
      // If algedonic bypass not yet implemented, this will fail with
      // a clear message about what Phase 3 needs to fix
      expect(n1New).toBeDefined();
    }
  });

  it("boundary ΦL (0.09 < 0.1): algedonic bypass active", () => {
    const nodes = makeNodes(0.09);
    const result = propagateDegradation("source", 0.4, nodes);
    const n1New = result.updatedPhiL.get("n1");
    if (n1New !== undefined) {
      const impact = 0.8 - n1New;
      // With bypass: impact ≈ 0.4; with dampening (degree 10): impact ≈ 0.035
      // Should be > 0.3 to confirm bypass is active
      expect(impact).toBeGreaterThan(0.3);
    } else {
      expect(n1New).toBeDefined();
    }
  });

  it("boundary ΦL (0.10 = exactly at threshold): normal dampening (no bypass)", () => {
    const nodes = makeNodes(0.10);
    const result = propagateDegradation("source", 0.5, nodes);
    const n1New = result.updatedPhiL.get("n1");
    if (n1New !== undefined) {
      const impact = 0.8 - n1New;
      // At exactly 0.10 (not < 0.10), normal dampening applies
      // With degree 10: γ ≈ 0.089; impact ≈ 0.044
      expect(impact).toBeLessThan(0.2);
    }
  });
});
