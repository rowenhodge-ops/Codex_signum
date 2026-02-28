// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Constitutional Amendment Lifecycle
 *
 * Tests the propose → experiment → evaluate → vote → ratify → active lifecycle.
 * Covers rate limits, cooling periods, experiment durations, gradient checks,
 * consensus thresholds, and valid state transitions.
 *
 * @see codex-signum-v3.0.md §Constitutional Evolution
 * @see engineering-bridge-v2.0.md §Part 8
 */
import { describe, expect, it } from "vitest";
import {
  TIER_CONFIG,
  checkConsensus,
  evaluateAmendment,
  proposeAmendment,
  transitionAmendment,
} from "../../src/constitutional/evolution.js";
import type { Amendment, Vote } from "../../src/constitutional/evolution.js";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeAmendment(
  overrides: Partial<Amendment> = {},
): Amendment {
  return {
    id: "test_amendment_1",
    tier: 1,
    description: "Test amendment",
    state: "proposed",
    proposedAt: new Date(),
    ...overrides,
  };
}

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

// ── TIER_CONFIG constants ─────────────────────────────────────────────────

describe("TIER_CONFIG — tier constraints", () => {
  it("Tier 1: maxSimultaneous=5, coolingMonths=0, experimentMonths=3, consensus=67%", () => {
    expect(TIER_CONFIG[1].maxSimultaneous).toBe(5);
    expect(TIER_CONFIG[1].coolingMonths).toBe(0);
    expect(TIER_CONFIG[1].experimentMonths).toBe(3);
    expect(TIER_CONFIG[1].consensusThreshold).toBeCloseTo(0.67, 2);
  });

  it("Tier 2: maxSimultaneous=3, coolingMonths=3, experimentMonths=6, consensus=80%", () => {
    expect(TIER_CONFIG[2].maxSimultaneous).toBe(3);
    expect(TIER_CONFIG[2].coolingMonths).toBe(3);
    expect(TIER_CONFIG[2].experimentMonths).toBe(6);
    expect(TIER_CONFIG[2].consensusThreshold).toBeCloseTo(0.8, 2);
  });

  it("Tier 3: maxSimultaneous=1, coolingMonths=12, experimentMonths=12, consensus=90%", () => {
    expect(TIER_CONFIG[3].maxSimultaneous).toBe(1);
    expect(TIER_CONFIG[3].coolingMonths).toBe(12);
    expect(TIER_CONFIG[3].experimentMonths).toBe(12);
    expect(TIER_CONFIG[3].consensusThreshold).toBeCloseTo(0.9, 2);
  });
});

// ── proposeAmendment ──────────────────────────────────────────────────────

describe("proposeAmendment", () => {
  it("Tier 1 proposal succeeds when no active amendments", () => {
    const result = proposeAmendment(1, "adjust ΦL weight", []);
    expect(result).not.toBeInstanceOf(Error);
    const a = result as Amendment;
    expect(a.tier).toBe(1);
    expect(a.state).toBe("proposed");
    expect(a.description).toBe("adjust ΦL weight");
  });

  it("Tier 1 rate limit: 5 active → 6th rejected", () => {
    const active: Amendment[] = Array.from({ length: 5 }, (_, i) =>
      makeAmendment({ id: `a${i}`, tier: 1, state: "experimenting" }),
    );
    const result = proposeAmendment(1, "new proposal", active);
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toMatch(/rate limit/i);
  });

  it("Tier 2 rate limit: 3 active → 4th rejected", () => {
    const active: Amendment[] = Array.from({ length: 3 }, (_, i) =>
      makeAmendment({ id: `a${i}`, tier: 2, state: "voting" }),
    );
    const result = proposeAmendment(2, "new Tier 2 proposal", active);
    expect(result).toBeInstanceOf(Error);
  });

  it("Tier 3 rate limit: 1 active → 2nd rejected", () => {
    const active: Amendment[] = [makeAmendment({ tier: 3, state: "evaluating" })];
    const result = proposeAmendment(3, "foundational change", active);
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toMatch(/rate limit/i);
  });

  it("Tier 1 no cooling period — proposal succeeds immediately after prior ratification", () => {
    const result = proposeAmendment(1, "param tweak", [], new Date());
    expect(result).not.toBeInstanceOf(Error);
  });

  it("Tier 3 cooling period: 12 months required — fails if last ratified 5 months ago", () => {
    const lastRatified = monthsAgo(5);
    const result = proposeAmendment(3, "foundational change", [], lastRatified);
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toMatch(/cooling period/i);
  });

  it("Tier 3 cooling period: passes if last ratified 13 months ago", () => {
    const lastRatified = monthsAgo(13);
    const result = proposeAmendment(3, "foundational change", [], lastRatified);
    expect(result).not.toBeInstanceOf(Error);
  });

  it("Tier 2 cooling period: 3 months required — fails if last ratified 2 months ago", () => {
    const lastRatified = monthsAgo(2);
    const result = proposeAmendment(2, "structural change", [], lastRatified);
    expect(result).toBeInstanceOf(Error);
  });

  it("rejected/active amendments do not count toward rate limit", () => {
    const amendments: Amendment[] = [
      makeAmendment({ tier: 1, state: "rejected" }),
      makeAmendment({ tier: 1, state: "active" }),
      makeAmendment({ tier: 1, state: "reverted" }),
    ];
    const result = proposeAmendment(1, "valid new proposal", amendments);
    expect(result).not.toBeInstanceOf(Error);
  });
});

// ── evaluateAmendment ─────────────────────────────────────────────────────

describe("evaluateAmendment", () => {
  it("fails if experiment has not started", () => {
    const a = makeAmendment({ state: "evaluating" });
    const { passed, reasons } = evaluateAmendment(a);
    expect(passed).toBe(false);
    expect(reasons.some((r) => /experiment/i.test(r))).toBe(true);
  });

  it("Tier 1: fails if experiment ran for only 2 months (needs 3)", () => {
    const a = makeAmendment({
      tier: 1,
      state: "evaluating",
      experimentStartedAt: monthsAgo(2),
      observedGradients: { phiL: 0.01, psiH: 0.01, omega: 0.01 },
    });
    const { passed, reasons } = evaluateAmendment(a);
    expect(passed).toBe(false);
    expect(reasons.some((r) => /duration/i.test(r))).toBe(true);
  });

  it("Tier 1: passes if experiment ran 4 months with all positive gradients", () => {
    const a = makeAmendment({
      tier: 1,
      state: "evaluating",
      experimentStartedAt: monthsAgo(4),
      observedGradients: { phiL: 0.05, psiH: 0.02, omega: 0.01 },
    });
    const { passed } = evaluateAmendment(a);
    expect(passed).toBe(true);
  });

  it("fails if ΦL gradient is not positive", () => {
    const a = makeAmendment({
      tier: 1,
      state: "evaluating",
      experimentStartedAt: monthsAgo(4),
      observedGradients: { phiL: -0.01, psiH: 0.02, omega: 0.01 },
    });
    const { passed, reasons } = evaluateAmendment(a);
    expect(passed).toBe(false);
    expect(reasons.some((r) => /ΦL/u.test(r))).toBe(true);
  });

  it("fails if ΨH gradient is not positive", () => {
    const a = makeAmendment({
      tier: 1,
      state: "evaluating",
      experimentStartedAt: monthsAgo(4),
      observedGradients: { phiL: 0.05, psiH: 0, omega: 0.01 },
    });
    const { passed, reasons } = evaluateAmendment(a);
    expect(passed).toBe(false);
    expect(reasons.some((r) => /ΨH/u.test(r))).toBe(true);
  });

  it("fails if Ω gradient is not positive", () => {
    const a = makeAmendment({
      tier: 1,
      state: "evaluating",
      experimentStartedAt: monthsAgo(4),
      observedGradients: { phiL: 0.05, psiH: 0.02, omega: -0.1 },
    });
    const { passed, reasons } = evaluateAmendment(a);
    expect(passed).toBe(false);
    expect(reasons.some((r) => /Ω/u.test(r))).toBe(true);
  });

  it("requires ALL three gradients positive — partial pass still fails", () => {
    const a = makeAmendment({
      tier: 1,
      state: "evaluating",
      experimentStartedAt: monthsAgo(4),
      observedGradients: { phiL: 0.05, psiH: 0.02, omega: 0 },
    });
    const { passed } = evaluateAmendment(a);
    expect(passed).toBe(false);
  });
});

// ── checkConsensus ────────────────────────────────────────────────────────

describe("checkConsensus", () => {
  const makeVotes = (approved: number, total: number): Vote[] =>
    Array.from({ length: total }, (_, i) => ({
      voterId: `voter_${i}`,
      approved: i < approved,
      castAt: new Date(),
    }));

  it("Tier 1: 67% threshold — 7/10 approvals passes", () => {
    const a = makeAmendment({ tier: 1 });
    const { reached, approval } = checkConsensus(a, makeVotes(7, 10));
    expect(reached).toBe(true);
    expect(approval).toBeCloseTo(0.7, 2);
  });

  it("Tier 1: 67% threshold — 6/10 approvals fails", () => {
    const a = makeAmendment({ tier: 1 });
    const { reached } = checkConsensus(a, makeVotes(6, 10));
    expect(reached).toBe(false);
  });

  it("Tier 2: 80% threshold — 8/10 approvals passes", () => {
    const a = makeAmendment({ tier: 2 });
    const { reached } = checkConsensus(a, makeVotes(8, 10));
    expect(reached).toBe(true);
  });

  it("Tier 2: 80% threshold — 7/10 approvals fails", () => {
    const a = makeAmendment({ tier: 2 });
    const { reached } = checkConsensus(a, makeVotes(7, 10));
    expect(reached).toBe(false);
  });

  it("Tier 3: 90% threshold — 9/10 approvals passes", () => {
    const a = makeAmendment({ tier: 3 });
    const { reached } = checkConsensus(a, makeVotes(9, 10));
    expect(reached).toBe(true);
  });

  it("Tier 3: 90% threshold — 8/10 approvals fails", () => {
    const a = makeAmendment({ tier: 3 });
    const { reached } = checkConsensus(a, makeVotes(8, 10));
    expect(reached).toBe(false);
  });

  it("no votes → consensus not reached", () => {
    const a = makeAmendment({ tier: 1 });
    const { reached, approval } = checkConsensus(a, []);
    expect(reached).toBe(false);
    expect(approval).toBe(0);
  });
});

// ── transitionAmendment ───────────────────────────────────────────────────

describe("transitionAmendment — valid state transitions only", () => {
  it("proposed → experimenting (valid)", () => {
    const a = makeAmendment({ state: "proposed" });
    const result = transitionAmendment(a, "experimenting");
    expect(result).not.toBeInstanceOf(Error);
    expect((result as Amendment).state).toBe("experimenting");
  });

  it("proposed → experimenting sets experimentStartedAt", () => {
    const a = makeAmendment({ state: "proposed" });
    const result = transitionAmendment(a, "experimenting") as Amendment;
    expect(result.experimentStartedAt).toBeDefined();
  });

  it("experimenting → evaluating (valid)", () => {
    const a = makeAmendment({ state: "experimenting" });
    const result = transitionAmendment(a, "evaluating");
    expect(result).not.toBeInstanceOf(Error);
  });

  it("evaluating → voting (valid)", () => {
    const a = makeAmendment({ state: "evaluating" });
    const result = transitionAmendment(a, "voting");
    expect(result).not.toBeInstanceOf(Error);
  });

  it("voting → ratified (valid)", () => {
    const a = makeAmendment({ state: "voting" });
    const result = transitionAmendment(a, "ratified");
    expect(result).not.toBeInstanceOf(Error);
    expect((result as Amendment).ratifiedAt).toBeDefined();
  });

  it("ratified → active (valid)", () => {
    const a = makeAmendment({ state: "ratified" });
    const result = transitionAmendment(a, "active");
    expect(result).not.toBeInstanceOf(Error);
  });

  it("proposed → ratified (INVALID — must not skip states)", () => {
    const a = makeAmendment({ state: "proposed" });
    const result = transitionAmendment(a, "ratified");
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toMatch(/invalid transition/i);
  });

  it("proposed → active (INVALID)", () => {
    const a = makeAmendment({ state: "proposed" });
    const result = transitionAmendment(a, "active");
    expect(result).toBeInstanceOf(Error);
  });

  it("experimenting → voting (INVALID — must go through evaluating)", () => {
    const a = makeAmendment({ state: "experimenting" });
    const result = transitionAmendment(a, "voting");
    expect(result).toBeInstanceOf(Error);
  });

  it("rejected → any state (INVALID — terminal state)", () => {
    const a = makeAmendment({ state: "rejected" });
    expect(transitionAmendment(a, "proposed")).toBeInstanceOf(Error);
    expect(transitionAmendment(a, "experimenting")).toBeInstanceOf(Error);
    expect(transitionAmendment(a, "active")).toBeInstanceOf(Error);
  });

  it("any stage → rejected (valid escape hatch)", () => {
    for (const state of ["proposed", "experimenting", "evaluating", "voting"] as const) {
      const a = makeAmendment({ state });
      expect(transitionAmendment(a, "rejected")).not.toBeInstanceOf(Error);
    }
  });
});
