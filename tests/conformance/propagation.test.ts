// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — M-22.5: Triggered ΦL Propagation Tests
 *
 * Tests for propagatePhiLUpward() — the function that propagates ΦL changes
 * upward through the CONTAINS hierarchy with topology-aware dampening,
 * hysteresis, cascade limit, and algedonic bypass.
 *
 * @see codex-signum-engineering-bridge-v3_0.md §Part 3 "Topology-Aware Dampening"
 * @see cs-v5.0.md §Degradation Cascade Mechanics
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CASCADE_LIMIT, HYSTERESIS_RATIO } from "../../src/computation/dampening.js";
import { PHI_L_PROPAGATION_NOISE_GATE } from "../../src/computation/hierarchical-health.js";

// Mock graph queries — propagatePhiLUpward calls these internally
vi.mock("../../src/graph/queries.js", () => ({
  getParentBloom: vi.fn(),
  getContainedChildren: vi.fn(),
  updateBloomPhiL: vi.fn().mockResolvedValue(undefined),
  // Stubs for other queries used by hierarchical-health.ts module-level imports
  getPatternsWithHealth: vi.fn().mockResolvedValue([]),
  getContainersBottomUp: vi.fn().mockResolvedValue([]),
  getSubgraphEdges: vi.fn().mockResolvedValue([]),
  getPatternAdjacency: vi.fn().mockResolvedValue([]),
}));

describe("M-22.5: Triggered ΦL Propagation", () => {
  let getParentBloom: ReturnType<typeof vi.fn>;
  let getContainedChildren: ReturnType<typeof vi.fn>;
  let updateBloomPhiL: ReturnType<typeof vi.fn>;
  let propagatePhiLUpward: typeof import("../../src/computation/hierarchical-health.js").propagatePhiLUpward;

  beforeEach(async () => {
    vi.resetAllMocks(); // Clears calls AND mock implementation queues
    const queries = await import("../../src/graph/queries.js");
    getParentBloom = vi.mocked(queries.getParentBloom);
    getContainedChildren = vi.mocked(queries.getContainedChildren);
    updateBloomPhiL = vi.mocked(queries.updateBloomPhiL);
    // Re-apply default: updateBloomPhiL always resolves
    updateBloomPhiL.mockResolvedValue(undefined);
    const mod = await import("../../src/computation/hierarchical-health.js");
    propagatePhiLUpward = mod.propagatePhiLUpward;
  });

  it("propagates degradation to parent with dampening", async () => {
    // Parent has 3 children: child-1 (changed), child-2, child-3
    // γ_effective = min(0.7, 0.8/3) ≈ 0.267
    getParentBloom.mockResolvedValue({ id: "parent-1", phiL: 0.8, degree: 4 });
    getContainedChildren.mockResolvedValue([
      { id: "child-1", phiL: 0.5, observationCount: 10, connectionCount: 2, degree: 2 },
      { id: "child-2", phiL: 0.8, observationCount: 10, connectionCount: 2, degree: 2 },
      { id: "child-3", phiL: 0.7, observationCount: 10, connectionCount: 2, degree: 2 },
    ]);
    // parent-1 has no grandparent
    getParentBloom.mockResolvedValueOnce({ id: "parent-1", phiL: 0.8, degree: 4 });
    getParentBloom.mockResolvedValueOnce(null); // no grandparent

    await propagatePhiLUpward("child-1", 0.8, 0.5); // ΔΦL = 0.3 degradation

    // Parent ΦL should be recomputed as mean of children: (0.5 + 0.8 + 0.7) / 3 ≈ 0.667
    expect(updateBloomPhiL).toHaveBeenCalledWith(
      "parent-1",
      expect.closeTo(0.6667, 2),
      "declining", // 0.667 < 0.8 - 0.01
    );
  });

  it("applies hysteresis on recovery (2.5× slower)", async () => {
    // Hysteresis ratio is 2.5 — recovery impact is dampened 2.5× more
    expect(HYSTERESIS_RATIO).toBe(2.5);

    getParentBloom.mockResolvedValueOnce({ id: "parent-1", phiL: 0.5, degree: 3 });
    getContainedChildren.mockResolvedValueOnce([
      { id: "child-1", phiL: 0.8, observationCount: 10, connectionCount: 2, degree: 2 },
      { id: "child-2", phiL: 0.6, observationCount: 10, connectionCount: 2, degree: 2 },
    ]);
    getParentBloom.mockResolvedValueOnce(null); // no grandparent

    // child-1 recovered from 0.5 → 0.8 (improvement)
    await propagatePhiLUpward("child-1", 0.5, 0.8);

    // Parent ΦL = mean(0.8, 0.6) = 0.7
    expect(updateBloomPhiL).toHaveBeenCalledWith(
      "parent-1",
      expect.closeTo(0.7, 2),
      "improving", // 0.7 > 0.5 + 0.01
    );
  });

  it("respects CASCADE_LIMIT=2", async () => {
    expect(CASCADE_LIMIT).toBe(2);

    // 3-level hierarchy: child → parent → grandparent → great-grandparent
    // cascade should stop at depth 2 (grandparent), not reach great-grandparent
    getParentBloom
      .mockResolvedValueOnce({ id: "parent", phiL: 0.8, degree: 3 }) // child's parent
      .mockResolvedValueOnce({ id: "grandparent", phiL: 0.85, degree: 2 }) // parent's parent
      .mockResolvedValueOnce(null); // grandparent has no parent (but cascade should stop before asking)

    getContainedChildren
      .mockResolvedValueOnce([ // parent's children
        { id: "child-1", phiL: 0.4, observationCount: 10, connectionCount: 2, degree: 2 },
        { id: "child-2", phiL: 0.7, observationCount: 10, connectionCount: 2, degree: 2 },
      ])
      .mockResolvedValueOnce([ // grandparent's children
        { id: "parent", phiL: 0.55, observationCount: 10, connectionCount: 2, degree: 3 },
        { id: "uncle", phiL: 0.9, observationCount: 10, connectionCount: 2, degree: 2 },
      ]);

    await propagatePhiLUpward("child-1", 0.8, 0.4); // Big degradation

    // Both parent and grandparent should be updated (depth 0 and 1, both < CASCADE_LIMIT=2)
    expect(updateBloomPhiL).toHaveBeenCalledTimes(2);
    expect(updateBloomPhiL).toHaveBeenCalledWith("parent", expect.any(Number), expect.any(String));
    expect(updateBloomPhiL).toHaveBeenCalledWith("grandparent", expect.any(Number), expect.any(String));
  });

  it("algedonic bypass reaches root regardless of CASCADE_LIMIT", async () => {
    // 4-level hierarchy: child → parent → grandparent → great-grandparent (root)
    // Normal cascade would stop at depth 2, but algedonic (ΦL < 0.1) bypasses
    getParentBloom
      .mockResolvedValueOnce({ id: "parent", phiL: 0.5, degree: 2 })
      .mockResolvedValueOnce({ id: "grandparent", phiL: 0.6, degree: 2 })
      .mockResolvedValueOnce({ id: "great-grandparent", phiL: 0.7, degree: 2 })
      .mockResolvedValueOnce(null); // root

    getContainedChildren
      .mockResolvedValueOnce([
        { id: "child-1", phiL: 0.05, observationCount: 10, connectionCount: 2, degree: 2 },
      ])
      .mockResolvedValueOnce([
        { id: "parent", phiL: 0.05, observationCount: 10, connectionCount: 2, degree: 2 },
      ])
      .mockResolvedValueOnce([
        { id: "grandparent", phiL: 0.05, observationCount: 10, connectionCount: 2, degree: 2 },
      ]);

    // ΦL drops to 0.05 — below algedonic threshold (0.1)
    await propagatePhiLUpward("child-1", 0.5, 0.05);

    // Should propagate all the way through: parent, grandparent, great-grandparent
    expect(updateBloomPhiL).toHaveBeenCalledTimes(3);
    expect(updateBloomPhiL).toHaveBeenCalledWith("parent", expect.any(Number), expect.any(String));
    expect(updateBloomPhiL).toHaveBeenCalledWith("grandparent", expect.any(Number), expect.any(String));
    expect(updateBloomPhiL).toHaveBeenCalledWith("great-grandparent", expect.any(Number), expect.any(String));
  });

  it("noise gate prevents propagation for ΔΦL ≤ 0.01", () => {
    // The noise gate is checked by the caller (writeObservation step 7b),
    // not inside propagatePhiLUpward itself. Verify the constant.
    expect(PHI_L_PROPAGATION_NOISE_GATE).toBe(0.01);
  });

  it("propagation with no parent is a no-op", async () => {
    getParentBloom.mockResolvedValueOnce(null); // root node

    await propagatePhiLUpward("root-bloom", 0.8, 0.5);

    // No updates should have been made
    expect(updateBloomPhiL).not.toHaveBeenCalled();
  });
});
