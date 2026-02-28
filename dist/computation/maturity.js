// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { MATURITY_THRESHOLDS } from "../types/state-dimensions.js";
// ============ CONSTANTS ============
/** Decay constant for observation depth */
const K1_OBSERVATION = 0.05;
/** Decay constant for connection count */
const K2_CONNECTION = 0.5;
/** Maturity classification boundaries (spec: Young < 0.3, Maturing 0.3–0.7, Mature > 0.7) */
const MATURITY_YOUNG_THRESHOLD = 0.3;
const MATURITY_MATURE_THRESHOLD = 0.7;
// ============ CORE COMPUTATION ============
/**
 * Compute the maturity factor for a single pattern.
 *
 * m = (1 - e^(-k₁ × observations)) × (1 - e^(-k₂ × connections))
 *
 * @param observationCount — Number of retained observations
 * @param connectionCount — Number of active graph edges
 * @returns Maturity factor in [0, 1]
 */
export function computeMaturityFactor(observationCount, connectionCount) {
    const observationComponent = 1 - Math.exp(-K1_OBSERVATION * Math.max(0, observationCount));
    const connectionComponent = 1 - Math.exp(-K2_CONNECTION * Math.max(0, connectionCount));
    return observationComponent * connectionComponent;
}
/**
 * Compute the full maturity index for the network.
 *
 * @param patterns — Array of { observationCount, connectionCount, age, phiL }
 */
export function computeMaturityIndex(patterns) {
    if (patterns.length === 0) {
        return emptyMaturityIndex();
    }
    // Compute factor components
    const meanObservationDepth = normalizeObservationDepth(mean(patterns.map((p) => p.observationCount)));
    const connectionDensity = normalizeConnectionDensity(mean(patterns.map((p) => p.connectionCount)), patterns.length);
    const meanComponentAge = normalizeAge(mean(patterns.map((p) => p.ageMs)));
    const meanPhiLEcosystem = mean(patterns.map((p) => p.phiL));
    // Composite value — equal-weighted average of factors (spec: 0.25 × 4)
    const value = 0.25 * meanObservationDepth +
        0.25 * connectionDensity +
        0.25 * meanComponentAge +
        0.25 * meanPhiLEcosystem;
    // Classification
    const classification = classifyMaturity(value);
    // Get maturity-indexed thresholds
    const thresholds = MATURITY_THRESHOLDS[classification];
    return {
        value,
        classification,
        factors: {
            meanObservationDepth,
            connectionDensity,
            meanComponentAge,
            meanPhiLEcosystem,
        },
        thresholds,
    };
}
// ============ CLASSIFICATION ============
/**
 * Classify maturity value into a category.
 */
export function classifyMaturity(value) {
    if (value < MATURITY_YOUNG_THRESHOLD)
        return "young";
    if (value >= MATURITY_MATURE_THRESHOLD)
        return "mature";
    return "maturing";
}
// ============ NORMALIZATION HELPERS ============
/**
 * Normalize mean observation count to [0, 1].
 * Uses same exponential curve as maturity factor.
 * At 100 observations, approaches ~0.99.
 */
function normalizeObservationDepth(meanObservations) {
    return 1 - Math.exp(-0.03 * meanObservations);
}
/**
 * Normalize connection density relative to pattern count.
 * density = meanConnections / (patternCount - 1) for graphs,
 * clamped to [0, 1].
 */
function normalizeConnectionDensity(meanConnections, patternCount) {
    if (patternCount <= 1)
        return 0;
    const density = meanConnections / (patternCount - 1);
    return Math.min(1, density);
}
/**
 * Normalize mean age.
 * Uses asymptotic approach: at 30 days, ~0.95.
 */
function normalizeAge(meanAgeMs) {
    const days = meanAgeMs / (1000 * 60 * 60 * 24);
    return 1 - Math.exp(-0.1 * days);
}
/** Simple mean of number array */
function mean(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((acc, v) => acc + v, 0) / values.length;
}
/**
 * Return an empty/default maturity index for networks with no patterns.
 */
function emptyMaturityIndex() {
    return {
        value: 0,
        classification: "young",
        factors: {
            meanObservationDepth: 0,
            connectionDensity: 0,
            meanComponentAge: 0,
            meanPhiLEcosystem: 0,
        },
        thresholds: MATURITY_THRESHOLDS.young,
    };
}
//# sourceMappingURL=maturity.js.map