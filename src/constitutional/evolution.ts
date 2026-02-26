/**
 * Codex Signum — Constitutional Amendment Lifecycle
 *
 * Implements the 8-state amendment lifecycle:
 *   proposed → experimenting → evaluating → voting → ratified → active
 *   (or rejected/reverted at any stage)
 *
 * Amendment tiers determine rate limits, cooling periods, experiment durations,
 * and consensus thresholds. Tier 3 changes require the strongest safeguards.
 *
 * @see codex-signum-v3.0.md §Constitutional Evolution
 * @see engineering-bridge-v2.0.md §Part 8
 * @module codex-signum-core/constitutional/evolution
 */

import type { AmendmentTier } from "../types/constitutional.js";

// ============ TYPES ============

/**
 * Full lifecycle state for a constitutional amendment.
 * Extends AmendmentStatus with voting, active, and rejected states.
 */
export type AmendmentLifecycleState =
  | "proposed"
  | "experimenting"
  | "evaluating"
  | "voting"
  | "ratified"
  | "active"
  | "rejected"
  | "reverted";

/**
 * A constitutional amendment in the lifecycle.
 */
export interface Amendment {
  id: string;
  tier: AmendmentTier;
  /** Human-readable description of the proposed change */
  description: string;
  state: AmendmentLifecycleState;
  /** When this amendment was proposed */
  proposedAt: Date;
  /** When the experiment started (null until experimenting state) */
  experimentStartedAt?: Date;
  /** When ratification occurred (null until ratified) */
  ratifiedAt?: Date;
  /** Observed gradients during evaluation (must all be positive for passage) */
  observedGradients?: {
    phiL: number;
    psiH: number;
    omega: number;
  };
}

/**
 * A vote cast on an amendment.
 */
export interface Vote {
  voterId: string;
  approved: boolean;
  castAt: Date;
}

// ============ TIER CONFIGURATION ============

/**
 * Per-tier constraints for the amendment lifecycle.
 *
 * | Tier | Max Simultaneous | Cooling (months) | Experiment (months) | Consensus |
 * |  1   |        5         |        0         |          3          |   67%     |
 * |  2   |        3         |        3         |          6          |   80%     |
 * |  3   |        1         |       12         |         12          |   90%     |
 */
export const TIER_CONFIG = {
  1: {
    maxSimultaneous: 5,
    coolingMonths: 0,
    experimentMonths: 3,
    consensusThreshold: 0.67,
  },
  2: {
    maxSimultaneous: 3,
    coolingMonths: 3,
    experimentMonths: 6,
    consensusThreshold: 0.8,
  },
  3: {
    maxSimultaneous: 1,
    coolingMonths: 12,
    experimentMonths: 12,
    consensusThreshold: 0.9,
  },
} as const;

// ============ VALID STATE TRANSITIONS ============

/** Allowed next states for each lifecycle state. */
const VALID_TRANSITIONS: Readonly<
  Record<AmendmentLifecycleState, AmendmentLifecycleState[]>
> = {
  proposed: ["experimenting", "rejected"],
  experimenting: ["evaluating", "rejected", "reverted"],
  evaluating: ["voting", "rejected", "reverted"],
  voting: ["ratified", "rejected"],
  ratified: ["active", "reverted"],
  active: ["reverted"],
  rejected: [],
  reverted: [],
};

// ============ HELPERS ============

function monthsBetween(a: Date, b: Date): number {
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;
  return (b.getTime() - a.getTime()) / msPerMonth;
}

// ============ LIFECYCLE FUNCTIONS ============

/**
 * Propose a new amendment.
 *
 * Validates:
 * - Max simultaneous amendments per tier (5/3/1)
 * - Cooling period since last same-tier ratification (0/3/12 months)
 *
 * @param tier — Amendment tier (1, 2, or 3)
 * @param description — Human-readable description of the change
 * @param existingAmendments — All active amendments in the system
 * @param lastRatifiedAt — When the last same-tier amendment was ratified (if any)
 * @returns The new Amendment in "proposed" state, or an Error if validation fails
 */
export function proposeAmendment(
  tier: AmendmentTier,
  description: string,
  existingAmendments: Amendment[],
  lastRatifiedAt?: Date,
): Amendment | Error {
  const config = TIER_CONFIG[tier];

  // Rate limit: max simultaneous active amendments per tier
  const active = existingAmendments.filter(
    (a) =>
      a.tier === tier &&
      !["rejected", "reverted", "active"].includes(a.state),
  );
  if (active.length >= config.maxSimultaneous) {
    return new Error(
      `Tier ${tier} rate limit: max ${config.maxSimultaneous} simultaneous amendments (${active.length} active)`,
    );
  }

  // Cooling period: must wait N months since last same-tier ratification
  if (config.coolingMonths > 0 && lastRatifiedAt) {
    const elapsed = monthsBetween(lastRatifiedAt, new Date());
    if (elapsed < config.coolingMonths) {
      const remaining = (config.coolingMonths - elapsed).toFixed(1);
      return new Error(
        `Tier ${tier} cooling period: ${remaining} months remaining since last ratification`,
      );
    }
  }

  return {
    id: `amendment_${Date.now()}_t${tier}`,
    tier,
    description,
    state: "proposed",
    proposedAt: new Date(),
  };
}

/**
 * Evaluate whether an amendment has met experiment requirements.
 *
 * Checks:
 * - Minimum experiment duration (3/6/12 months per tier)
 * - All three gradients (ΦL, ΨH, Ω) are positive
 *
 * @param amendment — The amendment to evaluate (must be in "evaluating" state)
 * @param now — Current time (injectable for testing)
 * @returns { passed, reasons } — reasons lists any failed requirements
 */
export function evaluateAmendment(
  amendment: Amendment,
  now: Date = new Date(),
): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!amendment.experimentStartedAt) {
    reasons.push("Experiment has not started yet");
    return { passed: false, reasons };
  }

  const config = TIER_CONFIG[amendment.tier];
  const elapsed = monthsBetween(amendment.experimentStartedAt, now);

  if (elapsed < config.experimentMonths) {
    const remaining = (config.experimentMonths - elapsed).toFixed(1);
    reasons.push(
      `Minimum experiment duration not met: ${remaining} months remaining (Tier ${amendment.tier} requires ${config.experimentMonths} months)`,
    );
  }

  if (!amendment.observedGradients) {
    reasons.push("No observed gradients — cannot evaluate performance");
  } else {
    const { phiL, psiH, omega } = amendment.observedGradients;
    if (phiL <= 0) {
      reasons.push(`ΦL gradient is not positive (${phiL.toFixed(4)}) — health not improving`);
    }
    if (psiH <= 0) {
      reasons.push(`ΨH gradient is not positive (${psiH.toFixed(4)}) — structural coherence not improving`);
    }
    if (omega <= 0) {
      reasons.push(`Ω gradient is not positive (${omega.toFixed(4)}) — imperative alignment not improving`);
    }
  }

  return { passed: reasons.length === 0, reasons };
}

/**
 * Check whether consensus has been reached for an amendment.
 *
 * Thresholds: Tier 1 = 67%, Tier 2 = 80%, Tier 3 = 90%
 *
 * @param amendment — The amendment being voted on
 * @param votes — All votes cast
 * @returns { reached, approval } — approval is the fraction of yes votes
 */
export function checkConsensus(
  amendment: Amendment,
  votes: Vote[],
): { reached: boolean; approval: number } {
  if (votes.length === 0) {
    return { reached: false, approval: 0 };
  }

  const approvals = votes.filter((v) => v.approved).length;
  const approval = approvals / votes.length;
  const threshold = TIER_CONFIG[amendment.tier].consensusThreshold;

  return { reached: approval >= threshold, approval };
}

/**
 * Transition an amendment to a new lifecycle state.
 *
 * Validates that the transition is legal (no skipping states).
 * Also sets derived timestamps when entering key states.
 *
 * @param amendment — The amendment to transition
 * @param targetState — The desired next state
 * @returns Updated Amendment, or Error if transition is invalid
 */
export function transitionAmendment(
  amendment: Amendment,
  targetState: AmendmentLifecycleState,
): Amendment | Error {
  const allowed = VALID_TRANSITIONS[amendment.state];

  if (!allowed.includes(targetState)) {
    return new Error(
      `Invalid transition: ${amendment.state} → ${targetState}. ` +
        `Allowed from "${amendment.state}": [${allowed.join(", ")}]`,
    );
  }

  const updated: Amendment = { ...amendment, state: targetState };

  // Set derived timestamps on key transitions
  if (targetState === "experimenting" && !updated.experimentStartedAt) {
    updated.experimentStartedAt = new Date();
  }
  if (targetState === "ratified") {
    updated.ratifiedAt = new Date();
  }

  return updated;
}
