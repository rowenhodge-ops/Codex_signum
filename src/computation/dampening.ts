/**
 * Codex Signum — Topology-Aware Dampening
 *
 * When a morpheme degrades, the degradation signal propagates
 * through the graph — but DAMPENED by topology.
 *
 * Budget-capped formula (Phase 3 correction):
 *   γ_effective = min(γ_base, 0.8 / k)
 *
 * Where k = degree of the receiving node.
 * Guarantees spectral radius μ = k × γ ≤ 0.8 < 1 for ALL k ≥ 1.
 *
 * Constitutional constraint: cascade limit = 2 levels max.
 * Recovery is 2.5× slower than degradation (hysteresis).
 *
 * @see engineering-bridge-v2.0.md §Part 3 "Topology-Aware Dampening"
 * @see parameter-validation.md — budget-capped min(γ_base, s/k) with s≤0.8
 * @module codex-signum-core/computation/dampening
 */

// ============ CONSTANTS ============

/** Maximum propagation depth (constitutional constraint) */
export const CASCADE_LIMIT = 2;

/** Recovery is this many times slower than degradation */
export const HYSTERESIS_RATIO = 2.5;

/** Maximum dampening factor (cap from spec) */
const MAX_GAMMA = 0.7;

/** @deprecated Legacy numerator — use SAFETY_BUDGET with computeGammaEffective instead */
const GAMMA_NUMERATOR = 0.8;

/**
 * Safety budget for budget-capped dampening.
 * γ_effective(k) = min(γ_base, SAFETY_BUDGET / k)
 * Guarantees μ = k × γ ≤ SAFETY_BUDGET < 1 for all k ≥ 1.
 */
export const SAFETY_BUDGET = 0.8;

/** ΦL threshold for algedonic bypass — existential threat escalation */
export const ALGEDONIC_THRESHOLD = 0.1;

/** Recovery delay linear scaling factor per failure */
const RECOVERY_DELAY_FACTOR = 0.2;

/** Maximum recovery delay multiplier (cap) */
const RECOVERY_DELAY_CAP_MULTIPLIER = 10;

// ============ CORE COMPUTATION ============

/**
 * Compute the effective dampening factor for a node.
 *
 * Now delegates to budget-capped formula: γ_effective = min(0.7, 0.8 / k)
 *
 * @deprecated Use computeGammaEffective(degree) directly. This function is
 * retained for backward compatibility but now uses the budget-capped formula.
 * The original 0.8/(k-1) formula was supercritical for k≥2 (μ = k×γ > 1).
 *
 * @param degree — Number of connections (k)
 * @returns Dampening factor in [0, MAX_GAMMA]
 */
export function computeDampening(degree: number): number {
  return computeGammaEffective(degree);
}

/**
 * Budget-capped effective dampening (Engineering Bridge §Part 3, Phase 3 correction).
 *
 * γ_effective(k) = min(γ_base, SAFETY_BUDGET / k)
 *
 * This replaces the previous √k hub formula, which produced supercritical cascades
 * (spectral radius μ = k × γ > 1) for branching factor k ≥ 3.
 *
 * Budget-capped guarantees μ ≤ SAFETY_BUDGET = 0.8 < 1 for ALL k ≥ 1:
 *   k=1:  min(0.7, 0.8/1)  = 0.7   μ = 0.7
 *   k=2:  min(0.7, 0.8/2)  = 0.4   μ = 0.8
 *   k=5:  min(0.7, 0.8/5)  = 0.16  μ = 0.8
 *   k=10: min(0.7, 0.8/10) = 0.08  μ = 0.8
 *
 * @param k — Number of connections (degree)
 * @param gammaBase — Base dampening cap (default MAX_GAMMA = 0.7)
 * @returns Effective dampening factor
 */
export function computeGammaEffective(
  k: number,
  gammaBase: number = MAX_GAMMA,
): number {
  const safek = Math.max(1, k);
  return Math.min(gammaBase, SAFETY_BUDGET / safek);
}

/**
 * Hub dampening — deprecated, routes to computeGammaEffective.
 *
 * The √k formula caused supercritical cascades for k ≥ 3.
 * Use computeGammaEffective() directly.
 *
 * @deprecated Use computeGammaEffective(degree, gammaBase) instead.
 */
export function computeHubDampening(
  degree: number,
  gammaBase: number = MAX_GAMMA,
): number {
  return computeGammaEffective(degree, gammaBase);
}

/**
 * Algedonic bypass check (Engineering Bridge §Part 3).
 *
 * Any component with ΦL < 0.1 is an existential threat.
 * Signal propagates to root with γ = 1.0, bypassing all dampening.
 *
 * @param componentPhiL — The ΦL of the degrading component
 * @returns { gamma: 1.0, bypassed: true } if bypass triggered, else { gamma, bypassed: false }
 */
export function checkAlgedonicBypass(componentPhiL: number): {
  gamma: number;
  bypassed: boolean;
} {
  if (componentPhiL < ALGEDONIC_THRESHOLD) {
    return { gamma: 1.0, bypassed: true };
  }
  return { gamma: 0, bypassed: false };
}

/**
 * Recovery delay model (Engineering Bridge §Part 3).
 *
 * recovery_delay = base_delay × (1 + 0.2 × failure_count)
 * capped at: 10 × base_delay
 *
 * @param baseDelayMs — Base delay in milliseconds
 * @param failureCount — Number of prior failures
 * @returns Recovery delay in milliseconds
 */
export function computeRecoveryDelay(
  baseDelayMs: number,
  failureCount: number,
): number {
  const scaled =
    baseDelayMs * (1 + RECOVERY_DELAY_FACTOR * Math.max(0, failureCount));
  return Math.min(scaled, RECOVERY_DELAY_CAP_MULTIPLIER * baseDelayMs);
}

/**
 * Compute the ΦL impact on a neighbor from a degradation event.
 *
 * impact = γ_effective × degradation_severity
 *
 * Where degradation_severity = previous_phiL - current_phiL (positive for degradation)
 *
 * @param neighborDegree — Degree of the neighbor receiving the signal
 * @param degradationSeverity — Magnitude of ΦL drop (positive number)
 * @param cascadeLevel — Current cascade depth (1-indexed)
 * @returns ΦL reduction to apply to the neighbor, or 0 if cascade limit reached
 */
export function computeDegradationImpact(
  neighborDegree: number,
  degradationSeverity: number,
  cascadeLevel: number,
): number {
  // Constitutional limit: max 2 levels of cascade
  if (cascadeLevel > CASCADE_LIMIT) return 0;

  const gamma = computeGammaEffective(neighborDegree);
  return gamma * Math.max(0, degradationSeverity);
}

/**
 * Compute the ΦL recovery rate for a node.
 * Recovery is 2.5× slower than degradation (hysteresis).
 *
 * recoveryRate = degradationRate / HYSTERESIS_RATIO
 *
 * @param degradationRate — How fast the node degraded (ΦL units / tick)
 * @returns Recovery rate (ΦL units / tick)
 */
export function computeRecoveryRate(degradationRate: number): number {
  return Math.abs(degradationRate) / HYSTERESIS_RATIO;
}

// ============ PROPAGATION ENGINE ============

/** A node in the propagation simulation */
export interface PropagationNode {
  id: string;
  phiL: number;
  degree: number;
  neighbors: string[];
}

/** Result of a propagation step */
export interface PropagationResult {
  /** Node ID → new ΦL value */
  updatedPhiL: Map<string, number>;
  /** Number of nodes affected */
  nodesAffected: number;
  /** Maximum cascade depth reached */
  maxCascadeDepth: number;
  /** Whether cascade limit was hit */
  cascadeLimitReached: boolean;
  /** Whether algedonic bypass was triggered (ΦL < 0.1) */
  algedonicBypass: boolean;
}

/**
 * Propagate a degradation event through the graph.
 *
 * Starts from a source node and propagates outward,
 * respecting cascadeLimit=2 and topology-aware dampening.
 *
 * @param sourceId — The node that degraded
 * @param severity — Magnitude of ΦL drop (positive)
 * @param nodes — Map of all nodes in the graph
 */
export function propagateDegradation(
  sourceId: string,
  severity: number,
  nodes: Map<string, PropagationNode>,
): PropagationResult {
  const updatedPhiL = new Map<string, number>();
  let nodesAffected = 0;
  let maxCascadeDepth = 0;
  let cascadeLimitReached = false;
  let algedonicBypass = false;

  // BFS with cascade tracking
  // senderDegree: degree of the node that emitted this signal (used for γ computation)
  const queue: Array<{
    nodeId: string;
    cascadeLevel: number;
    incomingSeverity: number;
    senderDegree: number;
  }> = [];
  const visited = new Set<string>();
  visited.add(sourceId);

  // The source node itself
  const source = nodes.get(sourceId);
  if (!source)
    return {
      updatedPhiL,
      nodesAffected,
      maxCascadeDepth,
      cascadeLimitReached,
      algedonicBypass,
    };

  const newSourcePhiL = Math.max(0, source.phiL - severity);
  updatedPhiL.set(sourceId, newSourcePhiL);
  nodesAffected++;

  // Algedonic bypass: check ORIGINAL ΦL (before this degradation event).
  // A node already at ΦL < 0.1 is an existential threat — signal bypasses all dampening.
  const bypass = checkAlgedonicBypass(source.phiL);
  if (bypass.bypassed) {
    algedonicBypass = true;
  }

  // Seed neighbors — source is the sender, so use source.degree for γ
  for (const neighborId of source.neighbors) {
    if (!visited.has(neighborId)) {
      queue.push({
        nodeId: neighborId,
        cascadeLevel: 1,
        incomingSeverity: severity,
        senderDegree: source.degree,
      });
    }
  }

  while (queue.length > 0) {
    const { nodeId, cascadeLevel, incomingSeverity, senderDegree } =
      queue.shift()!;

    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    // Algedonic bypass ignores cascade limit — emergency signals reach root
    if (!algedonicBypass && cascadeLevel > CASCADE_LIMIT) {
      cascadeLimitReached = true;
      continue;
    }

    const node = nodes.get(nodeId);
    if (!node) continue;

    // Compute dampened impact.
    // γ is computed from the SENDER's degree: a hub distributes energy across
    // many connections, so each receives a proportionally smaller fraction.
    let impact: number;
    if (algedonicBypass) {
      // Emergency: γ = 1.0, no dampening
      impact = Math.max(0, incomingSeverity);
    } else {
      const gamma = computeGammaEffective(senderDegree);
      impact = gamma * Math.max(0, incomingSeverity);
    }

    if (impact < 0.001) continue; // Below noise threshold

    const newPhiL = Math.max(0, node.phiL - impact);
    updatedPhiL.set(nodeId, newPhiL);
    nodesAffected++;
    maxCascadeDepth = Math.max(maxCascadeDepth, cascadeLevel);

    // Propagate to this node's neighbors (next cascade level)
    // Algedonic bypass: no cascade limit; normal: respect limit
    if (algedonicBypass || cascadeLevel < CASCADE_LIMIT) {
      for (const next of node.neighbors) {
        if (!visited.has(next)) {
          queue.push({
            nodeId: next,
            cascadeLevel: cascadeLevel + 1,
            incomingSeverity: impact,
            senderDegree: node.degree, // this node is now the sender
          });
        }
      }
    }
  }

  return {
    updatedPhiL,
    nodesAffected,
    maxCascadeDepth,
    cascadeLimitReached,
    algedonicBypass,
  };
}
