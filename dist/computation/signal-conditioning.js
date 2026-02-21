/**
 * Codex Signum — Signal Conditioning Pipeline
 *
 * Orchestrates the full state dimension computation cycle:
 * 1. Gather observations from Neo4j
 * 2. Compute ΦL for each pattern
 * 3. Compute ΨH from graph structure
 * 4. Compute εR from decision history
 * 5. Apply dampening for degradation events
 * 6. Write results back to graph
 *
 * This is the "heartbeat" of the Codex — run periodically or after events.
 *
 * @module codex-signum-core/computation/signal-conditioning
 */
import { computeEpsilonR } from "./epsilon-r.js";
import { computeMaturityIndex } from "./maturity.js";
import { computeAxiomComplianceFactor, computePhiL, computeTemporalStability, computeUsageSuccessRate, } from "./phi-l.js";
import { computePsiH } from "./psi-h.js";
// ============ SINGLE PATTERN ============
/**
 * Compute state dimensions for a single pattern.
 * Does NOT compute ΨH (that requires the full graph).
 */
export function computePatternState(input) {
    // Build ΦL factors
    const axiomComplianceFactor = computeAxiomComplianceFactor(input.axiomCompliance);
    const usageSuccessRate = computeUsageSuccessRate(input.successCount, input.totalInvocations);
    const temporalStability = computeTemporalStability(input.recentPhiLValues);
    const phiL = computePhiL({
        axiomCompliance: axiomComplianceFactor,
        provenanceClarity: input.provenanceClarity,
        usageSuccessRate,
        temporalStability,
    }, input.observationCount, input.connectionCount, input.previousPhiL);
    const epsilonR = computeEpsilonR(input.exploratoryDecisions, input.totalDecisions, input.epsilonRFloor);
    return {
        patternId: input.patternId,
        phiL,
        epsilonR,
    };
}
// ============ FULL NETWORK ============
/**
 * Compute state dimensions for the entire network.
 *
 * This is the full signal conditioning cycle.
 */
export function computeNetworkState(inputs, edges) {
    const start = Date.now();
    // 1. Compute per-pattern ΦL and εR
    const patternResults = new Map();
    for (const input of inputs) {
        patternResults.set(input.patternId, computePatternState(input));
    }
    // 2. Compute network-wide ΨH
    const nodeHealths = inputs.map((input) => ({
        id: input.patternId,
        phiL: patternResults.get(input.patternId).phiL.effective,
    }));
    const psiH = computePsiH(edges, nodeHealths);
    // 3. Compute maturity index
    const maturityInputs = inputs.map((input) => ({
        observationCount: input.observationCount,
        connectionCount: input.connectionCount,
        ageMs: input.ageMs,
        phiL: patternResults.get(input.patternId).phiL.effective,
    }));
    const maturity = computeMaturityIndex(maturityInputs);
    return {
        patterns: patternResults,
        psiH,
        maturity,
        computedAt: new Date(),
        durationMs: Date.now() - start,
    };
}
//# sourceMappingURL=signal-conditioning.js.map