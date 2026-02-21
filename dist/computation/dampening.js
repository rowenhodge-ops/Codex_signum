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
// ============ CORE COMPUTATION ============
/**
 * Compute the effective dampening factor for a node.
 *
 * γ_effective = min(0.7, 0.8 / (k - 1))
 *
 * @param degree — Number of connections (k)
 * @returns Dampening factor in [0, MAX_GAMMA]
 */
export function computeDampening(degree) {
    if (degree <= 1)
        return MAX_GAMMA; // Leaf node — max impact
    return Math.min(MAX_GAMMA, GAMMA_NUMERATOR / (degree - 1));
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
export function computeDegradationImpact(neighborDegree, degradationSeverity, cascadeLevel) {
    // Constitutional limit: max 2 levels of cascade
    if (cascadeLevel > CASCADE_LIMIT)
        return 0;
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
export function computeRecoveryRate(degradationRate) {
    return Math.abs(degradationRate) / HYSTERESIS_RATIO;
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
export function propagateDegradation(sourceId, severity, nodes) {
    const updatedPhiL = new Map();
    let nodesAffected = 0;
    let maxCascadeDepth = 0;
    let cascadeLimitReached = false;
    // BFS with cascade tracking
    const queue = [];
    const visited = new Set();
    visited.add(sourceId);
    // The source node itself
    const source = nodes.get(sourceId);
    if (!source)
        return { updatedPhiL, nodesAffected, maxCascadeDepth, cascadeLimitReached };
    const newSourcePhiL = Math.max(0, source.phiL - severity);
    updatedPhiL.set(sourceId, newSourcePhiL);
    nodesAffected++;
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
        const { nodeId, cascadeLevel, incomingSeverity } = queue.shift();
        if (visited.has(nodeId))
            continue;
        visited.add(nodeId);
        if (cascadeLevel > CASCADE_LIMIT) {
            cascadeLimitReached = true;
            continue;
        }
        const node = nodes.get(nodeId);
        if (!node)
            continue;
        // Compute dampened impact
        const impact = computeDegradationImpact(node.degree, incomingSeverity, cascadeLevel);
        if (impact < 0.001)
            continue; // Below noise threshold
        const newPhiL = Math.max(0, node.phiL - impact);
        updatedPhiL.set(nodeId, newPhiL);
        nodesAffected++;
        maxCascadeDepth = Math.max(maxCascadeDepth, cascadeLevel);
        // Propagate to this node's neighbors (next cascade level)
        if (cascadeLevel < CASCADE_LIMIT) {
            for (const next of node.neighbors) {
                if (!visited.has(next)) {
                    queue.push({
                        nodeId: next,
                        cascadeLevel: cascadeLevel + 1,
                        incomingSeverity: impact, // dampened severity for next hop
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
    };
}
//# sourceMappingURL=dampening.js.map