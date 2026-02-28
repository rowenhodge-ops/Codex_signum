export interface TriggerInputState {
    /** Current λ₂ of the full active graph */
    currentLambda2: number;
    /** λ₂ from before the most recent composition change */
    previousLambda2: number;
    /** Current graph total variation (friction) */
    currentFriction: number;
    /** Correction Helix temporal constant (how long Scale 1 correction takes) */
    correctionHelixTemporalConstant: number;
    /** Duration the friction has been above threshold (same units as temporal constant) */
    frictionDuration: number;
    /** Current cascade depth (from most recent degradation event) */
    currentCascadeDepth: number;
    /** εR at the composition (Bloom) level */
    compositionEpsilonR: number;
    /** Maturity-indexed εR stable range */
    epsilonRStableRange: {
        min: number;
        max: number;
    };
    /** Ecosystem-wide ΦL velocity (rate of change per day) */
    ecosystemPhiLVelocity: number;
    /** Recent imperative gradient values (most recent last, at least 5 values) */
    omegaGradientHistory: number[];
}
export interface TriggeredEvent {
    trigger: "lambda2_drop_on_formation" | "friction_spike" | "cascade_activation" | "epsilon_r_spike" | "phi_l_velocity_anomaly" | "omega_gradient_inversion";
    severity: "warning" | "critical";
    detail: string;
}
/**
 * Trigger 1: λ₂ dropped when a new composition was formed.
 * "New component weakens connectivity."
 *
 * Fires when λ₂ decreases by > 20% relative to previous.
 * Severity: critical if λ₂ drops below 0.1 (near-disconnection).
 */
export declare function checkLambda2Drop(previousLambda2: number, currentLambda2: number): TriggeredEvent | null;
/**
 * Trigger 2: Friction spike sustained beyond Correction Helix temporal constant.
 * "Runtime friction crosses threshold, sustained beyond Scale 1 correction time."
 *
 * Fires when friction > 0.5 AND duration > correctionHelixTemporalConstant.
 * Severity: warning if friction < 0.8, critical if ≥ 0.8.
 */
export declare function checkFrictionSpike(currentFriction: number, frictionDuration: number, correctionHelixTemporalConstant: number): TriggeredEvent | null;
/**
 * Trigger 3: Cascade activation — degradation reached the 2-level limit.
 * "A degradation event maxed out the safety boundary."
 *
 * Fires when cascadeDepth >= CASCADE_LIMIT (2).
 * Always critical — the safety mechanism activated.
 */
export declare function checkCascadeActivation(cascadeDepth: number): TriggeredEvent | null;
/**
 * Trigger 4: εR spike at composition level — beyond maturity-indexed stable range.
 * "Composition has lost confidence and is exploring heavily."
 *
 * Fires when compositionEpsilonR > stableRange.max.
 * Severity: warning if < 2× max, critical if ≥ 2× max.
 */
export declare function checkEpsilonRSpike(compositionEpsilonR: number, stableRange: {
    min: number;
    max: number;
}): TriggeredEvent | null;
/**
 * Trigger 5: ΦL velocity anomaly — ecosystem-wide ΦL shifting too fast.
 * "Something systemic is happening."
 *
 * Fires when |ecosystemPhiLVelocity| > 0.05 per day (spec value).
 * Severity: warning if < 0.1/day, critical if ≥ 0.1/day.
 * Fires for BOTH rapid improvement and rapid degradation.
 */
export declare function checkPhiLVelocityAnomaly(ecosystemPhiLVelocity: number): TriggeredEvent | null;
/**
 * Trigger 6: Ω gradient inversion — imperative gradient turns negative after sustained positive.
 * "A meta-imperative was being satisfied, and now it's degrading."
 *
 * Fires when: last 3+ values were positive AND current value is negative.
 * Requires at least 4 values in history.
 * Severity: warning if mild inversion, critical if gradient < -0.1.
 */
export declare function checkOmegaGradientInversion(gradientHistory: number[]): TriggeredEvent | null;
/**
 * Evaluate all six trigger conditions.
 * Returns all triggered events (may be multiple simultaneously).
 */
export declare function checkStructuralTriggers(state: TriggerInputState): TriggeredEvent[];
//# sourceMappingURL=structural-triggers.d.ts.map