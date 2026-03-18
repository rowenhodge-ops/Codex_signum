// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * L5 Invariant — Graph-Native Data Creation Rule 5: State Derives from Structure
 *
 * "phiL on a parent Bloom derives from its children (complete ratio),
 *  not from a hardcoded value."
 * "status on a parent Bloom derives from its children
 *  (all-complete/some-complete/none), not from manual SET."
 * "The only exception is leaf nodes (Seeds, terminal Blooms with no children)
 *  where status is set directly."
 *
 * Source: CLAUDE.md §Graph-Native Data Creation — Rule 5
 *
 * R-39 SUPERSESSION: The morpheme instantiation layer now provides structural
 * enforcement for this rule via updateBloomStatus(), which includes inline
 * parent status recalculation from children in the same transaction. Manual
 * parent status assignment is replaced by derived computation. These tests
 * are retained as documentation of what the structure enforces, not as the
 * enforcement mechanism.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getRoadmapMilestones,
  statusToPhiL,
} from "../../scripts/bootstrap-ecosystem.js";

// ── statusToPhiL mapping correctness ─────────────────────────────────────────

describe("Rule 5: statusToPhiL — canonical status → phiL mapping", () => {
  it("complete → 0.9", () => {
    expect(statusToPhiL("complete")).toBe(0.9);
  });

  it("active → 0.5", () => {
    expect(statusToPhiL("active")).toBe(0.5);
  });

  it("planned → 0.3", () => {
    expect(statusToPhiL("planned")).toBe(0.3);
  });

  it("vision → 0.1", () => {
    expect(statusToPhiL("vision")).toBe(0.1);
  });

  it("unknown status defaults to 0.3 (not 0 or 1)", () => {
    expect(statusToPhiL("unknown")).toBe(0.3);
    expect(statusToPhiL("")).toBe(0.3);
  });
});

// ── Leaf milestone phiL consistency ──────────────────────────────────────────

describe("Rule 5: Leaf milestones — phiL matches their own status", () => {
  const milestones = getRoadmapMilestones();

  it("every leaf milestone has phiL consistent with its status", () => {
    // Leaf milestones = those that have no children in the milestone data.
    const parentIds = new Set(
      milestones.filter((m) => m.parentId).map((m) => m.parentId!),
    );
    const leaves = milestones.filter((m) => !parentIds.has(m.id));

    expect(leaves.length).toBeGreaterThan(0);
    for (const m of leaves) {
      const expectedPhiL = statusToPhiL(m.status);
      expect(
        m.phiL,
        `Leaf milestone ${m.id} (status='${m.status}') has phiL=${m.phiL}, expected ${expectedPhiL}`,
      ).toBe(expectedPhiL);
    }
  });

  it("complete leaf milestones have phiL = 0.9", () => {
    const parentIds = new Set(
      milestones.filter((m) => m.parentId).map((m) => m.parentId!),
    );
    const completeLeaves = milestones.filter(
      (m) => !parentIds.has(m.id) && m.status === "complete",
    );

    for (const m of completeLeaves) {
      expect(m.phiL, `${m.id} should have phiL=0.9 for status=complete`).toBe(0.9);
    }
  });

  it("planned leaf milestones have phiL = 0.3", () => {
    const parentIds = new Set(
      milestones.filter((m) => m.parentId).map((m) => m.parentId!),
    );
    const plannedLeaves = milestones.filter(
      (m) => !parentIds.has(m.id) && m.status === "planned",
    );

    for (const m of plannedLeaves) {
      expect(m.phiL, `${m.id} should have phiL=0.3 for status=planned`).toBe(0.3);
    }
  });
});

// ── Parent milestone state derivation ────────────────────────────────────────

describe("Rule 5: Parent milestones — status derives from children", () => {
  const milestones = getRoadmapMilestones();

  it("M-9 (parent with mixed children) has status=active and phiL=0.5", () => {
    const m9 = milestones.find((m) => m.id === "M-9");
    expect(m9).toBeDefined();
    // M-9 has some complete and some planned sub-milestones
    const children = milestones.filter((m) => m.parentId === "M-9");
    const completeCount = children.filter((c) => c.status === "complete").length;
    const plannedCount = children.filter((c) => c.status === "planned").length;

    // Verify M-9 has both complete and non-complete children
    expect(completeCount).toBeGreaterThan(0);
    expect(plannedCount).toBeGreaterThan(0);

    // Therefore M-9 should be 'active' (some complete, not all)
    expect(m9!.status).toBe("active");
    // And phiL should be 0.5 (the statusToPhiL for 'active')
    expect(m9!.phiL).toBe(0.5);
  });

  it("parent status follows derivation rules: all-complete→complete, some→active, none→planned", () => {
    // Identify all parent milestones (those that have children)
    const childrenByParent = new Map<string, typeof milestones>();
    for (const m of milestones) {
      if (m.parentId) {
        const siblings = childrenByParent.get(m.parentId) ?? [];
        siblings.push(m);
        childrenByParent.set(m.parentId, siblings);
      }
    }

    for (const [parentId, children] of childrenByParent) {
      const parent = milestones.find((m) => m.id === parentId);
      if (!parent) continue;

      const allComplete = children.every((c) => c.status === "complete");
      const someComplete = children.some((c) => c.status === "complete");
      const noneComplete = !someComplete;

      if (allComplete) {
        // Parent should be complete
        expect(
          parent.status,
          `${parentId}: all ${children.length} children complete, but parent status='${parent.status}'`,
        ).toBe("complete");
        expect(parent.phiL).toBe(0.9);
      } else if (someComplete) {
        // Parent should be active
        expect(
          parent.status,
          `${parentId}: mixed children (${children.filter((c) => c.status === "complete").length}/${children.length} complete), but parent status='${parent.status}'`,
        ).toBe("active");
        expect(parent.phiL).toBe(0.5);
      } else if (noneComplete) {
        // Parent should be planned
        expect(
          ["planned", "next"],
          `${parentId}: no children complete, but parent status='${parent.status}'`,
        ).toContain(parent.status);
        expect(parent.phiL).toBe(statusToPhiL(parent.status));
      }
    }
  });
});

// ── Stamp protocol Step 3 exists in CLAUDE.md ────────────────────────────────

describe("Rule 5: CLAUDE.md stamp protocol — stampBloomComplete() documented (M-23.2)", () => {
  const claudeContent = readFileSync(
    join(process.cwd(), "CLAUDE.md"),
    "utf-8",
  );

  it("stamp protocol references stampBloomComplete()", () => {
    // M-23.2: stamp enforcement is now structural via stampBloomComplete()
    expect(claudeContent).toContain("stampBloomComplete()");
    expect(claudeContent).toContain("src/graph/instantiation.ts");
  });

  it("documents that phiL derives from relevant children only", () => {
    expect(claudeContent).toContain("relevant children only");
    expect(claudeContent).toContain("exit-criterion");
  });

  it("documents inline state dimension recomputation", () => {
    expect(claudeContent).toContain("propagatePhiLUpward");
    expect(claudeContent).toContain("computeAndPersistPsiH");
    expect(claudeContent).toContain("NON-FATAL");
  });
});

// ── Bootstrap script consistency: no manual parent status assignment ──────────

describe("Rule 5: Bootstrap data — no conflicting manual parent status", () => {
  const milestones = getRoadmapMilestones();

  it("parent milestone phiL values match the derivation formula", () => {
    // Collect parents and their derived status
    const childrenByParent = new Map<string, typeof milestones>();
    for (const m of milestones) {
      if (m.parentId) {
        const siblings = childrenByParent.get(m.parentId) ?? [];
        siblings.push(m);
        childrenByParent.set(m.parentId, siblings);
      }
    }

    for (const [parentId, children] of childrenByParent) {
      const parent = milestones.find((m) => m.id === parentId);
      if (!parent) continue;

      const total = children.length;
      const done = children.filter((c) => c.status === "complete").length;

      let expectedPhiL: number;
      if (done === total) {
        expectedPhiL = 0.9;
      } else if (done > 0) {
        expectedPhiL = 0.5;
      } else {
        expectedPhiL = 0.3;
      }

      expect(
        parent.phiL,
        `${parentId}: children ${done}/${total} complete → expected phiL=${expectedPhiL}, got ${parent.phiL}`,
      ).toBe(expectedPhiL);
    }
  });

  it("no parent milestone has phiL=0.9 when children are not all complete", () => {
    const childrenByParent = new Map<string, typeof milestones>();
    for (const m of milestones) {
      if (m.parentId) {
        const siblings = childrenByParent.get(m.parentId) ?? [];
        siblings.push(m);
        childrenByParent.set(m.parentId, siblings);
      }
    }

    for (const [parentId, children] of childrenByParent) {
      const parent = milestones.find((m) => m.id === parentId);
      if (!parent) continue;

      const allComplete = children.every((c) => c.status === "complete");
      if (!allComplete) {
        expect(
          parent.phiL,
          `${parentId} has phiL=0.9 but not all children are complete`,
        ).not.toBe(0.9);
      }
    }
  });
});
