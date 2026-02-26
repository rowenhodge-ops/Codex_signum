/**
 * Codex Signum — SAFETY INVARIANT: Cascade Limit
 *
 * Degradation propagation MUST stop at depth 2 (CASCADE_LIMIT = 2).
 * This is the primary safety mechanism preventing system-wide failures.
 * Propagation at depth 3+ would violate the constitutional cascade limit.
 *
 * If this test FAILS, dampening.ts allows cascade propagation beyond the
 * constitutional limit of 2 containment levels.
 *
 * Source: Engineering Bridge v2.0 §Part 3 "Cascade Limit = 2"
 */
import { describe, expect, it } from "vitest";
import {
  CASCADE_LIMIT,
  computeDegradationImpact,
  propagateDegradation,
} from "../../src/computation/dampening.js";
import type { PropagationNode } from "../../src/computation/dampening.js";

describe("SAFETY: CASCADE_LIMIT = 2 (constitutional constraint)", () => {
  it("CASCADE_LIMIT constant = 2", () => {
    expect(CASCADE_LIMIT).toBe(2);
  });

  it("computeDegradationImpact at level 3 → 0 (no propagation beyond limit)", () => {
    expect(computeDegradationImpact(3, 0.5, 3)).toBe(0);
  });

  it("computeDegradationImpact at level 4 → 0", () => {
    expect(computeDegradationImpact(3, 0.5, 4)).toBe(0);
  });

  it("computeDegradationImpact at level 10 → 0", () => {
    expect(computeDegradationImpact(3, 0.5, 10)).toBe(0);
  });

  it("computeDegradationImpact at level 1 → non-zero (propagates)", () => {
    expect(computeDegradationImpact(3, 0.5, 1)).toBeGreaterThan(0);
  });

  it("computeDegradationImpact at level 2 → non-zero (propagates)", () => {
    expect(computeDegradationImpact(3, 0.5, 2)).toBeGreaterThan(0);
  });
});

describe("SAFETY: propagateDegradation respects cascade limit in BFS", () => {
  function makeLinearChain(length: number): Map<string, PropagationNode> {
    const nodes = new Map<string, PropagationNode>();
    for (let i = 0; i < length; i++) {
      const id = `n${i}`;
      nodes.set(id, {
        id,
        phiL: 0.8,
        degree: i === 0 ? 1 : i === length - 1 ? 1 : 2,
        neighbors: [
          ...(i > 0 ? [`n${i - 1}`] : []),
          ...(i < length - 1 ? [`n${i + 1}`] : []),
        ],
      });
    }
    return nodes;
  }

  it("linear chain of 5: propagation depth ≤ 2", () => {
    const nodes = makeLinearChain(5);
    const result = propagateDegradation("n0", 0.5, nodes);
    // n0 (source) + n1 (depth 1) + n2 (depth 2) = max 3 nodes
    // n3, n4 at depth 3+ must NOT be affected
    expect(result.maxCascadeDepth).toBeLessThanOrEqual(CASCADE_LIMIT);
  });

  it("n3 in linear chain is NOT affected (depth 3 from n0)", () => {
    const nodes = makeLinearChain(5);
    const result = propagateDegradation("n0", 0.5, nodes);
    expect(result.updatedPhiL.has("n3")).toBe(false);
  });

  it("n4 in linear chain is NOT affected (depth 4 from n0)", () => {
    const nodes = makeLinearChain(5);
    const result = propagateDegradation("n0", 0.5, nodes);
    expect(result.updatedPhiL.has("n4")).toBe(false);
  });

  it("large star graph: hub degradation stops at depth 2", () => {
    // 3-level graph: hub → l1 (depth 1) → l1x (depth 2) → l1xa (depth 3)
    // Depth 1 and 2 ARE within CASCADE_LIMIT=2 and must be affected.
    // Depth 3 nodes (l1xa) exceed the limit and must NOT be affected.
    const nodes = new Map<string, PropagationNode>();
    nodes.set("hub", { id: "hub", phiL: 0.8, degree: 4, neighbors: ["l1", "l2", "l3", "l4"] });
    const leaves = ["l1", "l2", "l3", "l4"];
    for (const l of leaves) {
      nodes.set(l, {
        id: l,
        phiL: 0.8,
        degree: 2,
        neighbors: ["hub", `${l}x`],
      });
      // depth-2 nodes (within CASCADE_LIMIT)
      nodes.set(`${l}x`, {
        id: `${l}x`,
        phiL: 0.8,
        degree: 2,
        neighbors: [l, `${l}xa`],
      });
      // depth-3 nodes (beyond CASCADE_LIMIT — must NOT propagate here)
      nodes.set(`${l}xa`, {
        id: `${l}xa`,
        phiL: 0.8,
        degree: 1,
        neighbors: [`${l}x`],
      });
    }

    const result = propagateDegradation("hub", 0.5, nodes);
    expect(result.maxCascadeDepth).toBeLessThanOrEqual(CASCADE_LIMIT);

    // Depth-2 nodes (l1x) ARE within cascade limit — they MUST be affected
    for (const l of leaves) {
      expect(result.updatedPhiL.has(`${l}x`)).toBe(true);
    }

    // Depth-3 nodes (l1xa) are beyond CASCADE_LIMIT=2 and must NOT be affected
    for (const l of leaves) {
      expect(result.updatedPhiL.has(`${l}xa`)).toBe(false);
    }
  });
});
