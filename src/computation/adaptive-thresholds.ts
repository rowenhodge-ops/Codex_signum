/**
 * Codex Signum — Adaptive Threshold Resolver
 *
 * Replaces fixed thresholds with maturity-driven values.
 * A young network where mean ΦL is 0.6 is healthy.
 * A mature network at ΦL 0.6 is sick.
 *
 * Uses LINEAR INTERPOLATION between band anchor points for smooth transitions.
 * Hard band boundaries cause threshold-crossing oscillation — a system at
 * MI = 0.299 and MI = 0.301 should have nearly identical thresholds.
 *
 * @see codex-signum-v3.0.md §State Dimensions
 * @see engineering-bridge-v2.0.md §Part 2 "Adaptive thresholds — maturity-indexed"
 * @module codex-signum-core/computation/adaptive-thresholds
 */

// ============ TYPES ============

export interface ThresholdSet {
  /** ΦL above this = healthy */
  phiL_healthy: number;
  /** ΦL below this = degraded */
  phiL_degraded: number;
  /** εR within this range = stable */
  epsilonR_stable: { min: number; max: number };
  /** ΨH combined above this = dissonant */
  psiH_dissonance: number;
}

// ============ SPEC VALUES ============

// From v3.0 §State Dimensions and Engineering Bridge §Part 2:
//
// | Threshold         | Young (MI < 0.3) | Maturing (0.3–0.7) | Mature (MI > 0.7) |
// |-------------------|------------------|---------------------|-------------------|
// | ΦL healthy        | > 0.6            | > 0.7               | > 0.8             |
// | ΦL degraded       | < 0.4            | < 0.5               | < 0.6             |
// | εR stable range   | 0.10–0.40        | 0.05–0.30           | 0.01–0.15         |
// | ΨH dissonance     | > 0.25           | > 0.20              | > 0.15            |

const YOUNG: ThresholdSet = {
  phiL_healthy: 0.6,
  phiL_degraded: 0.4,
  epsilonR_stable: { min: 0.10, max: 0.40 },
  psiH_dissonance: 0.25,
};

const MATURING: ThresholdSet = {
  phiL_healthy: 0.7,
  phiL_degraded: 0.5,
  epsilonR_stable: { min: 0.05, max: 0.30 },
  psiH_dissonance: 0.20,
};

const MATURE: ThresholdSet = {
  phiL_healthy: 0.8,
  phiL_degraded: 0.6,
  epsilonR_stable: { min: 0.01, max: 0.15 },
  psiH_dissonance: 0.15,
};

// ============ INTERPOLATION ============

/** Anchor points — centers of each band */
const YOUNG_ANCHOR = 0.15;
const MATURING_ANCHOR = 0.5;
const MATURE_ANCHOR = 0.85;

/** Linear interpolation clamped to [0, 1] */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Interpolate between two threshold sets */
function lerpThresholds(a: ThresholdSet, b: ThresholdSet, t: number): ThresholdSet {
  return {
    phiL_healthy: lerp(a.phiL_healthy, b.phiL_healthy, t),
    phiL_degraded: lerp(a.phiL_degraded, b.phiL_degraded, t),
    epsilonR_stable: {
      min: lerp(a.epsilonR_stable.min, b.epsilonR_stable.min, t),
      max: lerp(a.epsilonR_stable.max, b.epsilonR_stable.max, t),
    },
    psiH_dissonance: lerp(a.psiH_dissonance, b.psiH_dissonance, t),
  };
}

// ============ COMPUTATION ============

/**
 * Resolve thresholds from a maturity index value.
 *
 * Linear interpolation between band anchor points for smooth transitions.
 * Band anchors are at MI = 0.15 (young center), 0.5 (maturing center), 0.85 (mature center).
 * Below 0.15 → young values. Above 0.85 → mature values.
 * Between anchors → linear interpolation.
 */
export function getThresholds(maturityIndex: number): ThresholdSet {
  if (maturityIndex <= YOUNG_ANCHOR) {
    return { ...YOUNG, epsilonR_stable: { ...YOUNG.epsilonR_stable } };
  }

  if (maturityIndex >= MATURE_ANCHOR) {
    return { ...MATURE, epsilonR_stable: { ...MATURE.epsilonR_stable } };
  }

  if (maturityIndex <= MATURING_ANCHOR) {
    // Interpolate young → maturing
    const t = (maturityIndex - YOUNG_ANCHOR) / (MATURING_ANCHOR - YOUNG_ANCHOR);
    return lerpThresholds(YOUNG, MATURING, t);
  }

  // Interpolate maturing → mature
  const t = (maturityIndex - MATURING_ANCHOR) / (MATURE_ANCHOR - MATURING_ANCHOR);
  return lerpThresholds(MATURING, MATURE, t);
}

/**
 * Classify a ΦL value against maturity-indexed thresholds.
 * Returns 'healthy', 'degraded', or 'intermediate'.
 */
export function classifyPhiLHealth(
  phiL_effective: number,
  maturityIndex: number,
): "healthy" | "intermediate" | "degraded" {
  const thresholds = getThresholds(maturityIndex);
  if (phiL_effective >= thresholds.phiL_healthy) return "healthy";
  if (phiL_effective <= thresholds.phiL_degraded) return "degraded";
  return "intermediate";
}

/**
 * Classify εR value against maturity-indexed thresholds.
 * Returns 'rigid', 'stable', 'adaptive', or 'unstable'.
 */
export function classifyEpsilonRAdaptive(
  epsilonR: number,
  maturityIndex: number,
): "rigid" | "stable" | "adaptive" | "unstable" {
  const thresholds = getThresholds(maturityIndex);
  if (epsilonR <= 0) return "rigid";
  if (epsilonR >= thresholds.epsilonR_stable.min && epsilonR <= thresholds.epsilonR_stable.max) {
    return "stable";
  }
  if (epsilonR < thresholds.epsilonR_stable.min) return "rigid";
  // Above stable max but below some unstable threshold
  // If it's only slightly above, it's adaptive. If way above, it's unstable.
  // Use 2× stable max as the unstable boundary (consistent with εR spike trigger)
  if (epsilonR <= 2 * thresholds.epsilonR_stable.max) return "adaptive";
  return "unstable";
}

/**
 * Check if ΨH indicates dissonance at the current maturity level.
 */
export function isDissonant(
  psiH_combined: number,
  maturityIndex: number,
): boolean {
  const thresholds = getThresholds(maturityIndex);
  return psiH_combined > thresholds.psiH_dissonance;
}
