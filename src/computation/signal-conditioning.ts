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

import type {
  EpsilonR,
  MaturityIndex,
  PhiL,
  PsiH,
} from "../types/state-dimensions.js";
import { computeEpsilonR } from "./epsilon-r.js";
import { computeMaturityIndex } from "./maturity.js";
import {
  computeAxiomComplianceFactor,
  computePhiL,
  computeTemporalStability,
  computeUsageSuccessRate,
} from "./phi-l.js";
import type { GraphEdge, NodeHealth } from "./psi-h.js";
import { computePsiH } from "./psi-h.js";

// ============ TYPES ============

/** Raw inputs for computing state dimensions of a single pattern */
export interface PatternSignalInput {
  patternId: string;
  /** Axiom compliance record (10 booleans) */
  axiomCompliance: Record<string, boolean>;
  /** Provenance clarity score [0, 1] */
  provenanceClarity: number;
  /** Success/failure counts in observation window */
  successCount: number;
  totalInvocations: number;
  /** Recent ΦL history for stability computation */
  recentPhiLValues: number[];
  /** Previous ΦL effective value (for trend) */
  previousPhiL?: number;
  /** Observation count */
  observationCount: number;
  /** Connection count (degree) */
  connectionCount: number;
  /** Age in milliseconds */
  ageMs: number;
  /** Exploratory decisions in window */
  exploratoryDecisions: number;
  /** Total decisions in window */
  totalDecisions: number;
  /** εR floor */
  epsilonRFloor?: number;
}

/** Full state computation result for a pattern */
export interface PatternStateResult {
  patternId: string;
  phiL: PhiL;
  epsilonR: EpsilonR;
}

/** Full network state computation result */
export interface NetworkStateResult {
  /** Per-pattern state dimensions */
  patterns: Map<string, PatternStateResult>;
  /** Network-wide ΨH */
  psiH: PsiH;
  /** Network maturity */
  maturity: MaturityIndex;
  /** Computation metadata */
  computedAt: Date;
  durationMs: number;
}

// ============ SINGLE PATTERN ============

/**
 * Compute state dimensions for a single pattern.
 * Does NOT compute ΨH (that requires the full graph).
 */
export function computePatternState(
  input: PatternSignalInput,
): PatternStateResult {
  // Build ΦL factors
  const axiomComplianceFactor = computeAxiomComplianceFactor(
    input.axiomCompliance,
  );
  const usageSuccessRate = computeUsageSuccessRate(
    input.successCount,
    input.totalInvocations,
  );
  const temporalStability = computeTemporalStability(input.recentPhiLValues);

  const phiL = computePhiL(
    {
      axiomCompliance: axiomComplianceFactor,
      provenanceClarity: input.provenanceClarity,
      usageSuccessRate,
      temporalStability,
    },
    input.observationCount,
    input.connectionCount,
    input.previousPhiL,
  );

  const epsilonR = computeEpsilonR(
    input.exploratoryDecisions,
    input.totalDecisions,
    input.epsilonRFloor,
  );

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
export function computeNetworkState(
  inputs: PatternSignalInput[],
  edges: GraphEdge[],
): NetworkStateResult {
  const start = Date.now();

  // 1. Compute per-pattern ΦL and εR
  const patternResults = new Map<string, PatternStateResult>();
  for (const input of inputs) {
    patternResults.set(input.patternId, computePatternState(input));
  }

  // 2. Compute network-wide ΨH
  const nodeHealths: NodeHealth[] = inputs.map((input) => ({
    id: input.patternId,
    phiL: patternResults.get(input.patternId)!.phiL.effective,
  }));

  const psiH = computePsiH(edges, nodeHealths);

  // 3. Compute maturity index
  const maturityInputs = inputs.map((input) => ({
    observationCount: input.observationCount,
    connectionCount: input.connectionCount,
    ageMs: input.ageMs,
    phiL: patternResults.get(input.patternId)!.phiL.effective,
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
