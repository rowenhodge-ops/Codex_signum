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
/**
 * Full lifecycle state for a constitutional amendment.
 * Extends AmendmentStatus with voting, active, and rejected states.
 */
export type AmendmentLifecycleState = "proposed" | "experimenting" | "evaluating" | "voting" | "ratified" | "active" | "rejected" | "reverted";
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
/**
 * Per-tier constraints for the amendment lifecycle.
 *
 * | Tier | Max Simultaneous | Cooling (months) | Experiment (months) | Consensus |
 * |  1   |        5         |        0         |          3          |   67%     |
 * |  2   |        3         |        3         |          6          |   80%     |
 * |  3   |        1         |       12         |         12          |   90%     |
 */
export declare const TIER_CONFIG: {
    readonly 1: {
        readonly maxSimultaneous: 5;
        readonly coolingMonths: 0;
        readonly experimentMonths: 3;
        readonly consensusThreshold: 0.67;
    };
    readonly 2: {
        readonly maxSimultaneous: 3;
        readonly coolingMonths: 3;
        readonly experimentMonths: 6;
        readonly consensusThreshold: 0.8;
    };
    readonly 3: {
        readonly maxSimultaneous: 1;
        readonly coolingMonths: 12;
        readonly experimentMonths: 12;
        readonly consensusThreshold: 0.9;
    };
};
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
export declare function proposeAmendment(tier: AmendmentTier, description: string, existingAmendments: Amendment[], lastRatifiedAt?: Date): Amendment | Error;
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
export declare function evaluateAmendment(amendment: Amendment, now?: Date): {
    passed: boolean;
    reasons: string[];
};
/**
 * Check whether consensus has been reached for an amendment.
 *
 * Thresholds: Tier 1 = 67%, Tier 2 = 80%, Tier 3 = 90%
 *
 * @param amendment — The amendment being voted on
 * @param votes — All votes cast
 * @returns { reached, approval } — approval is the fraction of yes votes
 */
export declare function checkConsensus(amendment: Amendment, votes: Vote[]): {
    reached: boolean;
    approval: number;
};
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
export declare function transitionAmendment(amendment: Amendment, targetState: AmendmentLifecycleState): Amendment | Error;
//# sourceMappingURL=evolution.d.ts.map