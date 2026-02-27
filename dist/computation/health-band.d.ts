/**
 * Codex Signum -- Health Band Classification (6-Band)
 *
 * Pure function: ΦL effective + maturity index --> HealthBand.
 *
 * Refines the 3-band classifyPhiLHealth() from adaptive-thresholds.ts
 * into the full 6-band operational classification required by the spec.
 *
 * Band boundaries are MATURITY-INDEXED -- not fixed constants.
 * The algedonic threshold (0.1) is fixed and constitutional.
 *
 * @see engineering-bridge-v2.0.md §Part 2 "Adaptive thresholds"
 * @see engineering-bridge-v2.0.md §Part 3 "Algedonic bypass" (ALGEDONIC_THRESHOLD = 0.1)
 * @module codex-signum-core/computation/health-band
 */
import type { HealthBand } from "../types/threshold-event.js";
/**
 * Classify a ΦL effective value into one of 6 health bands.
 *
 * Band logic (evaluated worst-to-best for early return on emergencies):
 *   1. ΦL < ALGEDONIC_THRESHOLD (0.1)                    --> "algedonic"
 *   2. ΦL < phiL_degraded (maturity-indexed)              --> "critical"
 *   3. ΦL < midpoint(phiL_degraded, phiL_healthy)         --> "degraded"
 *   4. ΦL < phiL_healthy (maturity-indexed)               --> "healthy"
 *   5. ΦL >= OPTIMAL_THRESHOLD (0.9)                      --> "optimal"
 *   6. Otherwise (between phiL_healthy and 0.9)           --> "trusted"
 *
 * @param phiLEffective - The effective ΦL value (0.0--1.0)
 * @param maturityIndex - Network maturity index (0.0--1.0)
 * @returns The 6-band HealthBand classification
 */
export declare function healthBand(phiLEffective: number, maturityIndex: number): HealthBand;
/**
 * Ordinal value of a health band for direction comparison.
 * Higher = healthier.
 */
export declare function bandOrdinal(band: HealthBand): number;
//# sourceMappingURL=health-band.d.ts.map