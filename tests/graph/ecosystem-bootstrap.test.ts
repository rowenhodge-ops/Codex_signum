// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import {
  getRoadmapMilestones,
  getHypotheses,
  statusToPhiL,
} from "../../scripts/bootstrap-ecosystem.js";
import type {
  MilestoneData,
  HypothesisData,
} from "../../scripts/bootstrap-ecosystem.js";
import { RELATIONSHIP_TYPES } from "../../src/graph/schema.js";

// ── Data Validation Tests (no Neo4j required) ──────────────────────────────

describe("Ecosystem Bootstrap — Milestone Data", () => {
  const milestones = getRoadmapMilestones();
  const major = milestones.filter((m) => m.type === "milestone");
  const sub = milestones.filter((m) => m.type === "sub-milestone");

  it("returns milestone data with correct structure", () => {
    expect(milestones.length).toBeGreaterThan(0);
    for (const m of milestones) {
      expect(m.id).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.status).toBeTruthy();
      expect(typeof m.phiL).toBe("number");
      expect(m.phiL).toBeGreaterThanOrEqual(0);
      expect(m.phiL).toBeLessThanOrEqual(1);
      expect(typeof m.sequence).toBe("number");
      expect(["milestone", "sub-milestone"]).toContain(m.type);
    }
  });

  it("includes all major milestones from roadmap", () => {
    const majorIds = major.map((m) => m.id);
    // Core milestones from roadmap
    expect(majorIds).toContain("M-1");
    expect(majorIds).toContain("M-9");
    expect(majorIds).toContain("M-16");
    expect(majorIds).toContain("M-19");
  });

  it("includes M-9 sub-milestones", () => {
    const subIds = sub.map((m) => m.id);
    expect(subIds).toContain("M-9.1");
    expect(subIds).toContain("M-9.5");
    expect(subIds).toContain("M-9.8");
    expect(subIds).toContain("M-9.V");
  });

  it("all sub-milestones reference a valid parent", () => {
    const allIds = new Set(milestones.map((m) => m.id));
    for (const m of sub) {
      expect(m.parentId).toBeTruthy();
      expect(allIds.has(m.parentId!)).toBe(true);
    }
  });

  it("major milestones do not have a parentId", () => {
    for (const m of major) {
      expect(m.parentId).toBeUndefined();
    }
  });

  it("milestone IDs are unique", () => {
    const ids = milestones.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("completed milestones have phiL = 0.9", () => {
    const complete = milestones.filter((m) => m.status === "complete");
    for (const m of complete) {
      expect(m.phiL).toBe(0.9);
    }
  });

  it("planned milestones have phiL = 0.3", () => {
    const planned = milestones.filter((m) => m.status === "planned");
    for (const m of planned) {
      expect(m.phiL).toBe(0.3);
    }
  });

  it("sub-milestones with commit SHAs are complete", () => {
    const withSha = sub.filter((m) => m.commitSha);
    for (const m of withSha) {
      expect(m.status).toBe("complete");
    }
  });
});

describe("Ecosystem Bootstrap — Hypothesis Data", () => {
  const hypotheses = getHypotheses();

  it("returns 3 hypotheses (H-1, H-2, H-5)", () => {
    expect(hypotheses).toHaveLength(3);
    const ids = hypotheses.map((h) => h.id);
    expect(ids).toContain("H-1");
    expect(ids).toContain("H-2");
    expect(ids).toContain("H-5");
  });

  it("each hypothesis has required properties", () => {
    for (const h of hypotheses) {
      expect(h.id).toBeTruthy();
      expect(h.claim).toBeTruthy();
      expect(h.paper).toBeTruthy();
      expect(h.status).toBe("proposed");
      expect(h.evidenceStrength).toBe(0.1);
      expect(h.observesMilestone).toBeTruthy();
    }
  });

  it("H-1 and H-2 observe M-9, H-5 observes M-10", () => {
    const h1 = hypotheses.find((h) => h.id === "H-1")!;
    const h2 = hypotheses.find((h) => h.id === "H-2")!;
    const h5 = hypotheses.find((h) => h.id === "H-5")!;
    expect(h1.observesMilestone).toBe("M-9");
    expect(h2.observesMilestone).toBe("M-9");
    expect(h5.observesMilestone).toBe("M-10");
  });
});

describe("Ecosystem Bootstrap — statusToPhiL mapping", () => {
  it("maps status symbols to correct phiL values", () => {
    expect(statusToPhiL("complete")).toBe(0.9);
    expect(statusToPhiL("active")).toBe(0.5);
    expect(statusToPhiL("next")).toBe(0.5);
    expect(statusToPhiL("planned")).toBe(0.3);
    expect(statusToPhiL("vision")).toBe(0.1);
  });

  it("defaults to 0.3 for unknown status", () => {
    expect(statusToPhiL("unknown")).toBe(0.3);
  });
});

describe("Ecosystem Bootstrap — Relationship Types", () => {
  it("SCOPED_TO relationship type is registered", () => {
    expect(RELATIONSHIP_TYPES.SCOPED_TO).toBe("SCOPED_TO");
  });

  it("OBSERVES relationship type is registered", () => {
    expect(RELATIONSHIP_TYPES.OBSERVES).toBe("OBSERVES");
  });
});

describe("Ecosystem Bootstrap — Idempotency design", () => {
  it("all milestone IDs follow M-{N} or M-{N}.{x} pattern", () => {
    const milestones = getRoadmapMilestones();
    for (const m of milestones) {
      expect(m.id).toMatch(/^M-\d+[A-Za-z]?(\.[0-9A-Za-z]+)?(-[A-Z]+)*$/);
    }
  });

  it("hypothesis IDs follow H-{N} pattern", () => {
    const hypotheses = getHypotheses();
    for (const h of hypotheses) {
      expect(h.id).toMatch(/^H-\d+$/);
    }
  });
});
