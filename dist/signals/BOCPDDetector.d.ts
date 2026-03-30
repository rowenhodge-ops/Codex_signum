/**
 * Codex Signum — Bayesian Online Change Point Detection (BOCPD)
 *
 * Implements Adams & MacKay 2007 with Normal-Inverse-Gamma (NIG) conjugate
 * prior for online detection of distributional shifts in low-volume metric
 * streams. Stateless between calls — caller owns state persistence.
 *
 * @module codex-signum-core/signals/BOCPDDetector
 */
import type { BOCPDConfig, BOCPDSignal, BOCPDState } from "./types.js";
export declare class BOCPDDetector {
    private readonly config;
    constructor(config?: Partial<BOCPDConfig>);
    private validate;
    /** Create a fresh initial state from the detector's config. */
    initialState(): BOCPDState;
    /** Reset to fresh initial state. */
    reset(): BOCPDState;
    /**
     * Process a single observation. Returns the BOCPD signal and the next state.
     *
     * Algorithm (Adams & MacKay 2007):
     * 1. Compute predictive probability π(x|r) for each run-length hypothesis
     * 2. Growth probabilities: growth[r] = R[r-1] × π(x|r-1) × (1 - H)
     * 3. Change-point mass: cp = Σ R[r] × π(x|r) × H
     * 4. Normalise the new run-length distribution
     * 5. Update NIG sufficient statistics for each run-length
     * 6. Truncate if arrays exceed maxRunLength
     */
    update(value: number, state: BOCPDState): {
        signal: BOCPDSignal;
        nextState: BOCPDState;
    };
}
//# sourceMappingURL=BOCPDDetector.d.ts.map