// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { DEFAULT_BOCPD_CONFIG } from "./types.js";
/**
 * Lanczos log-gamma approximation (g=7, n=9 coefficients).
 * Accurate to ~15 digits for Re(z) > 0.5.
 */
function logGamma(z) {
    if (z < 0.5) {
        // Reflection formula: Γ(z)Γ(1-z) = π/sin(πz)
        return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
    }
    z -= 1;
    const g = 7;
    const c = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7,
    ];
    let x = c[0];
    for (let i = 1; i < g + 2; i++) {
        x += c[i] / (z + i);
    }
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
/** Numerically stable log-sum-exp over an array of log values. */
function logSumExp(logValues) {
    if (logValues.length === 0)
        return -Infinity;
    const maxVal = Math.max(...logValues);
    if (maxVal === -Infinity)
        return -Infinity;
    let sum = 0;
    for (const lv of logValues) {
        sum += Math.exp(lv - maxVal);
    }
    return maxVal + Math.log(sum);
}
/**
 * Log-density of the Student-t distribution.
 * Used as the predictive density for the NIG conjugate model.
 */
function logStudentTPdf(x, mu, sigma2, nu) {
    // Student-t: p(x | mu, sigma2, nu) =
    //   Γ((nu+1)/2) / (Γ(nu/2) * sqrt(nu*pi*sigma2)) * (1 + (x-mu)^2/(nu*sigma2))^(-(nu+1)/2)
    const halfNuPlus1 = (nu + 1) / 2;
    const halfNu = nu / 2;
    const z = (x - mu) * (x - mu) / (nu * sigma2);
    return (logGamma(halfNuPlus1) -
        logGamma(halfNu) -
        0.5 * Math.log(nu * Math.PI * sigma2) -
        halfNuPlus1 * Math.log(1 + z));
}
export class BOCPDDetector {
    config;
    constructor(config) {
        this.config = { ...DEFAULT_BOCPD_CONFIG, ...config };
        this.validate();
    }
    validate() {
        const { alpha0, beta0, kappa0, hazardRate, maxRunLength } = this.config;
        if (alpha0 <= 0)
            throw new RangeError(`alpha0 must be > 0, got ${alpha0}`);
        if (beta0 <= 0)
            throw new RangeError(`beta0 must be > 0, got ${beta0}`);
        if (kappa0 <= 0)
            throw new RangeError(`kappa0 must be > 0, got ${kappa0}`);
        if (hazardRate <= 0 || hazardRate >= 1) {
            throw new RangeError(`hazardRate must be in (0, 1), got ${hazardRate}`);
        }
        if (maxRunLength <= 0 || !Number.isInteger(maxRunLength)) {
            throw new RangeError(`maxRunLength must be a positive integer, got ${maxRunLength}`);
        }
    }
    /** Create a fresh initial state from the detector's config. */
    initialState() {
        const { mu0, kappa0, alpha0, beta0, maxRunLength } = this.config;
        return {
            mu0,
            kappa0,
            alpha0,
            beta0,
            mus: [mu0],
            kappas: [kappa0],
            alphas: [alpha0],
            betas: [beta0],
            runLengths: [1.0], // All probability mass on run-length 0
            maxRunLength,
        };
    }
    /** Reset to fresh initial state. */
    reset() {
        return this.initialState();
    }
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
    update(value, state) {
        const H = this.config.hazardRate;
        const logH = Math.log(H);
        const log1mH = Math.log(1 - H);
        const n = state.runLengths.length;
        // Step 1: Compute predictive log-probabilities for each existing run-length
        const logPredProbs = new Array(n);
        for (let r = 0; r < n; r++) {
            const nu = 2 * state.alphas[r];
            const sigma2 = (state.betas[r] * (state.kappas[r] + 1)) /
                (state.alphas[r] * state.kappas[r]);
            logPredProbs[r] = logStudentTPdf(value, state.mus[r], sigma2, nu);
        }
        // Step 2–3: Message passing entirely in log-space to avoid underflow.
        // logJoint[r] = log(R[r]) + logPred[r] — the unnormalised joint for each run-length.
        const logJoint = new Array(n);
        for (let r = 0; r < n; r++) {
            logJoint[r] = Math.log(Math.max(state.runLengths[r], 1e-300)) + logPredProbs[r];
        }
        // New log-probabilities (unnormalised): n+1 entries
        const newLogProbs = new Array(n + 1);
        // Change-point mass (run-length = 0): cp = Σ exp(logJoint[r] + logH)
        newLogProbs[0] = logSumExp(logJoint.map(lj => lj + logH));
        // Growth: run-length r+1 from run-length r surviving
        for (let r = 0; r < n; r++) {
            newLogProbs[r + 1] = logJoint[r] + log1mH;
        }
        // Step 4: Normalise in log-space
        const logTotal = logSumExp(newLogProbs);
        const newRunLengths = new Array(n + 1);
        for (let i = 0; i < n + 1; i++) {
            newRunLengths[i] = Math.exp(newLogProbs[i] - logTotal);
        }
        // Change-point probability: cumulative mass on "young" run-lengths.
        // In Adams & MacKay, P(r=0) = hazardRate always. The actual change-point
        // signal is the concentration of mass on short run-lengths after a
        // distributional shift. We define cp-probability as Σ P(r ≤ W) where W
        // is an adaptive window (25% of the distribution length, capped at 50).
        // Under stability, most mass is at high r → young mass is small.
        // After a shift, mass migrates to low r at one step per observation →
        // window must be large enough to contain the new regime's MAP.
        const shortWindow = Math.max(1, Math.min(Math.ceil(newRunLengths.length / 4), 50));
        let changePointProbability = 0;
        for (let i = 0; i < shortWindow && i < newRunLengths.length; i++) {
            changePointProbability += newRunLengths[i];
        }
        // Step 5: Update NIG sufficient statistics
        // New run-length 0 gets the prior; existing run-lengths get updated posteriors
        const newMus = new Array(n + 1);
        const newKappas = new Array(n + 1);
        const newAlphas = new Array(n + 1);
        const newBetas = new Array(n + 1);
        // Run-length 0: reset to prior
        newMus[0] = state.mu0;
        newKappas[0] = state.kappa0;
        newAlphas[0] = state.alpha0;
        newBetas[0] = state.beta0;
        // Run-lengths 1..n: NIG incremental update
        for (let r = 0; r < n; r++) {
            const kappaOld = state.kappas[r];
            const muOld = state.mus[r];
            const kappaNew = kappaOld + 1;
            const muNew = (kappaOld * muOld + value) / kappaNew;
            const alphaNew = state.alphas[r] + 0.5;
            const betaNew = state.betas[r] + (kappaOld * (value - muOld) * (value - muOld)) / (2 * kappaNew);
            newMus[r + 1] = muNew;
            newKappas[r + 1] = kappaNew;
            newAlphas[r + 1] = alphaNew;
            newBetas[r + 1] = betaNew;
        }
        // Step 6: Truncate if exceeding maxRunLength
        const maxRL = state.maxRunLength;
        let finalRunLengths = newRunLengths;
        let finalMus = newMus;
        let finalKappas = newKappas;
        let finalAlphas = newAlphas;
        let finalBetas = newBetas;
        if (finalRunLengths.length > maxRL) {
            finalRunLengths = finalRunLengths.slice(0, maxRL);
            finalMus = finalMus.slice(0, maxRL);
            finalKappas = finalKappas.slice(0, maxRL);
            finalAlphas = finalAlphas.slice(0, maxRL);
            finalBetas = finalBetas.slice(0, maxRL);
            // Renormalise after truncation
            let truncTotal = 0;
            for (let i = 0; i < finalRunLengths.length; i++) {
                truncTotal += finalRunLengths[i];
            }
            if (truncTotal > 0) {
                for (let i = 0; i < finalRunLengths.length; i++) {
                    finalRunLengths[i] /= truncTotal;
                }
            }
        }
        // MAP run-length estimate
        let mapRunLength = 0;
        let mapProb = 0;
        for (let i = 0; i < finalRunLengths.length; i++) {
            if (finalRunLengths[i] > mapProb) {
                mapProb = finalRunLengths[i];
                mapRunLength = i;
            }
        }
        const nextState = {
            mu0: state.mu0,
            kappa0: state.kappa0,
            alpha0: state.alpha0,
            beta0: state.beta0,
            mus: finalMus,
            kappas: finalKappas,
            alphas: finalAlphas,
            betas: finalBetas,
            runLengths: finalRunLengths,
            maxRunLength: state.maxRunLength,
        };
        const signal = {
            value,
            runLength: mapRunLength,
            changePointProbability,
        };
        return { signal, nextState };
    }
}
//# sourceMappingURL=BOCPDDetector.js.map