/**
 * Codex Signum — Maturity Index Computation
 *
 * Maturity modulates EVERYTHING. A young network with ΦL=0.6 is healthy.
 * A mature network at ΦL=0.6 is sick. This module computes the maturity
 * factor and classifies the network.
 *
 * Maturity factor formula:
 *   m = (1 - e^(-k₁ × observations)) × (1 - e^(-k₂ × connections))
 *
 * Where k₁ = 0.05, k₂ = 0.5 (spec defaults)
 * At 50+ observations and 3+ connections, m approaches 1.0.
 * At 0 observations or 0 connections, m approaches 0.
 *
 * @see engineering-bridge-v2.0.md §Part 2 "Maturity factor"
 * @module codex-signum-core/computation/maturity
 */
import type { MaturityIndex } from "../types/state-dimensions.js";
/**
 * Compute the maturity factor for a single pattern.
 *
 * m = (1 - e^(-k₁ × observations)) × (1 - e^(-k₂ × connections))
 *
 * @param observationCount — Number of retained observations
 * @param connectionCount — Number of active graph edges
 * @returns Maturity factor in [0, 1]
 */
export declare function computeMaturityFactor(observationCount: number, connectionCount: number): number;
/**
 * Compute the full maturity index for the network.
 *
 * @param patterns — Array of { observationCount, connectionCount, age, phiL }
 */
export declare function computeMaturityIndex(patterns: Array<{
    observationCount: number;
    connectionCount: number;
    ageMs: number;
    phiL: number;
}>): MaturityIndex;
/**
 * Classify maturity value into a category.
 */
export declare function classifyMaturity(value: number): "young" | "maturing" | "mature";
//# sourceMappingURL=maturity.d.ts.map