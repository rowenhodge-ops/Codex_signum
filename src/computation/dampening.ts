/**
 * Codex Signum — Topology-Aware Dampening
 *
 * When a morpheme degrades, the degradation signal propagates
 * through the graph — but DAMPENED by topology.
 *
 * Formula:
 *   γ_effective = min(0.7, 0.8 / (k - 1))
 *
 * Where k = degree of the receiving node.
 * Highly-connected nodes dampen more (they have more context to absorb shocks).
 *
 * Constitutional constraint: cascade limit = 2 levels max.
 * Recovery is 2.5× slower than degradation (hysteresis).
 *
 * @see engineering-bridge-v2.0.md §Part 3 "Topology-Aware Dampening"
 * @module codex-signum-core/computation/dampening
 */

// ============ CONSTANTS ============

/** Maximum propagation depth (constitutional constraint) */
export const CASCADE_LIMIT = 2;

/** Recovery is this many times slower than degradation */
export const HYSTERESIS_RATIO = 2.5;

/** Maximum dampening factor (cap from spec) */
const MAX_GAMMA = 0.7;

/** Numerator for degree-based dampening */
const GAMMA_NUMERATOR = 0.8;

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
 * γ_effective = min(0.7, 0.8 / (k - 1))
 *
 * @param degree — Number of connections (k)
 * @returns Dampening factor in [0, MAX_GAMMA]
 */
export function computeDampening(degree: number): number {
  if (degree <= 1) return MAX_GAMMA; // Leaf node — max impact
  return Math.min(MAX_GAMMA, GAMMA_NUMERATOR / (degree - 1));
}

/**
 * Hub dampening: γ_base / √k (Engineering Bridge §Part 3).
 *
 * Hubs (high-degree nodes) use √k instead of (k-1) to prevent
 * over-dampening that would mask genuine problems.
 *
 * | Hub degree | γ_base/degree (wrong) | γ_base/√k (correct) |
 * |     5      |       0.14            |        0.31          |
 * |    10      |       0.07            |        0.22          |
 * |    20      |       0.035           |        0.16          |
 *
 * @param degree — Number of connections (k)
 * @param gammaBase — Base dampening factor (default MAX_GAMMA = 0.7)
 * @returns Hub-specific dampening factor
 */
export function computeHubDampening(
  degree: number,
  gammaBase: number = MAX_GAMMA,
): number {
  if (degree <= 1) return gammaBase;
  return gammaBase / Math.sqrt(degree);
}

/**
 * Compute effective dampening, selecting hub or standard formula.
 *
 * Standard nodes use min(0.7, 0.8/(k-1)).
 * Hub nodes (degree > hubThreshold) use γ_base/√k to avoid over-dampening.
 *
 * @param degree — Number of connections (k)
 * @param hubThreshold — Degree above which hub dampening applies (default 4)
 * @returns Effective dampening factor
 */
export function computeGammaEffective(
  degree: number,
  hubThreshold: number = 4,
): number {
  if (degree > hubThreshold) {
    return computeHubDampening(degree);
  }
  return computeDampening(degree);
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

  const gamma = computeDampening(neighborDegree);
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
  const queue: Array<{
    nodeId: string;
    cascadeLevel: number;
    incomingSeverity: number;
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

  // Algedonic bypass: ΦL < 0.1 → emergency escalation, γ = 1.0
  const bypass = checkAlgedonicBypass(newSourcePhiL);
  if (bypass.bypassed) {
    algedonicBypass = true;
  }

  // Seed neighbors
  for (const neighborId of source.neighbors) {
    if (!visited.has(neighborId)) {
      queue.push({
        nodeId: neighborId,
        cascadeLevel: 1,
        incomingSeverity: severity,
      });
    }
  }

  while (queue.length > 0) {
    const { nodeId, cascadeLevel, incomingSeverity } = queue.shift()!;

    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    // Algedonic bypass ignores cascade limit — emergency signals reach root
    if (!algedonicBypass && cascadeLevel > CASCADE_LIMIT) {
      cascadeLimitReached = true;
      continue;
    }

    const node = nodes.get(nodeId);
    if (!node) continue;

    // Compute dampened impact
    let impact: number;
    if (algedonicBypass) {
      // Emergency: γ = 1.0, no dampening
      impact = Math.max(0, incomingSeverity);
    } else {
      // Use hub dampening for high-degree nodes
      const gamma = computeGammaEffective(node.degree);
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
