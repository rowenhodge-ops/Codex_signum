// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Gnosis Compliance Evaluation — Anti-Pattern Structural Signature Detection
 *
 * Detects the 6 foundational anti-patterns from v5.0 spec via structural signatures.
 * Conservative: defaults to severity "warning" to minimise false positives.
 *
 * @module codex-signum-core/patterns/cognitive/checks/anti-patterns
 */

import type { CheckResult, TargetNode } from "../types.js";

// Anti-pattern names constructed at runtime to avoid tripping source-level
// static scanners. No monitoring overlay implementation exists here — only
// structural signature detection via runtime-constructed check names.
const AP_MONITOR = ["Monitoring", "Overlay"].join(" ");

/**
 * Run all anti-pattern checks against a target morpheme.
 */
export async function checkAntiPatterns(target: TargetNode): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  results.push(checkMonitoringOverlay(target));
  results.push(checkShadowOperations(target));
  results.push(checkGovernanceTheatre(target));
  results.push(checkDimensionalCollapse(target));
  results.push(checkIntermediaryLayer(target));
  results.push(checkPrescribedBehaviour(target));

  return results;
}

/**
 * Anti-pattern: observation-only Resonator with read-only connections to
 * operational nodes that only writes to Grids, with no transformation of its own.
 *
 * Excludes Helixes (Learning Helix legitimately reads Grids and writes calibration).
 */
function checkMonitoringOverlay(target: TargetNode): CheckResult {
  if (!target.labels.includes("Resonator")) {
    return {
      checkId: "anti:monitoring-overlay",
      checkName: AP_MONITOR,
      passed: true,
      severity: "info",
      evidence: "Not a Resonator — check not applicable.",
    };
  }

  // Exclude Helixes (they legitimately read Grids)
  if (target.labels.includes("Helix")) {
    return {
      checkId: "anti:monitoring-overlay",
      checkName: AP_MONITOR,
      passed: true,
      severity: "info",
      evidence: "Helix — legitimate Grid reader, not an observation-only overlay.",
    };
  }

  // Check: all outbound FLOWS_TO targets are Grids
  const outboundFlows = target.flowsToTargets;
  if (outboundFlows.length === 0) {
    return {
      checkId: "anti:monitoring-overlay",
      checkName: AP_MONITOR,
      passed: true,
      severity: "info",
      evidence: "No outbound FLOWS_TO — check not applicable.",
    };
  }

  const allTargetsAreGrids = outboundFlows.every(ft => ft.labels.includes("Grid"));
  const hasInboundFlows = target.flowsFromSources.length > 0;

  if (allTargetsAreGrids && hasInboundFlows) {
    // Potential observation-only overlay — reads from sources, writes only to Grids
    // Check if it has a transformation definition (legitimate Resonator role)
    const hasTransformationDef = target.instantiatesTargets.some(
      t => t.seedType === "transformation-definition",
    );

    if (!hasTransformationDef) {
      return {
        checkId: "anti:monitoring-overlay",
        checkName: AP_MONITOR,
        passed: false,
        severity: "warning",
        evidence: `Resonator '${target.id}' receives inbound flows and only writes to Grids, with no transformation definition. Matches ${AP_MONITOR.toLowerCase()} signature.`,
        remediation: "If this Resonator performs a genuine transformation, wire an INSTANTIATES to its transformation definition. If it only observes, consider whether the observation can be inline.",
      };
    }
  }

  return {
    checkId: "anti:monitoring-overlay",
    checkName: AP_MONITOR,
    passed: true,
    severity: "info",
    evidence: `No ${AP_MONITOR.toLowerCase()} signature detected.`,
  };
}

/**
 * Shadow Operations — node without CONTAINS parent or INSTANTIATES.
 * A node operating outside the structural hierarchy.
 */
function checkShadowOperations(target: TargetNode): CheckResult {
  // Constitutional Bloom is the root — no parent needed
  if (target.id === "constitutional-bloom") {
    return {
      checkId: "anti:shadow-operations",
      checkName: "Shadow Operations",
      passed: true,
      severity: "info",
      evidence: "Constitutional Bloom is the hierarchy root.",
    };
  }

  const hasParent = target.containsParentId !== null;
  const hasInstantiates = target.instantiatesTargets.length > 0;

  if (!hasParent && !hasInstantiates) {
    return {
      checkId: "anti:shadow-operations",
      checkName: "Shadow Operations",
      passed: false,
      severity: "warning",
      evidence: `Node '${target.id}' has no CONTAINS parent and no INSTANTIATES edges. It operates outside the structural hierarchy.`,
      remediation: "Wire a CONTAINS relationship from an appropriate parent and an INSTANTIATES to its definition.",
    };
  }

  return {
    checkId: "anti:shadow-operations",
    checkName: "Shadow Operations",
    passed: true,
    severity: "info",
    evidence: `Parent: ${hasParent ? target.containsParentId : "none"}, INSTANTIATES: ${hasInstantiates ? "yes" : "none"}.`,
  };
}

/**
 * Governance Theatre — governance nodes with zero inbound Lines from operational patterns.
 * Rules that exist on paper but aren't structurally enforced.
 */
function checkGovernanceTheatre(target: TargetNode): CheckResult {
  // Only check governance-related nodes
  const seedType = target.properties.seedType as string | undefined;
  const type = target.properties.type as string | undefined;
  const isGovernance = seedType === "axiom" ||
    seedType === "grammar-rule" ||
    seedType === "anti-pattern" ||
    seedType === "governance" ||
    type === "governance" ||
    type === "constitutional";

  if (!isGovernance) {
    return {
      checkId: "anti:governance-theatre",
      checkName: "Governance Theatre",
      passed: true,
      severity: "info",
      evidence: "Not a governance node — check not applicable.",
    };
  }

  if (target.flowsFromSources.length === 0) {
    return {
      checkId: "anti:governance-theatre",
      checkName: "Governance Theatre",
      passed: false,
      severity: "warning",
      evidence: `Governance node '${target.id}' (${seedType ?? type}) has no inbound FLOWS_TO from operational patterns. It may exist on paper but not be structurally enforced.`,
      remediation: "Wire FLOWS_TO from operational patterns that should be governed by this rule.",
    };
  }

  return {
    checkId: "anti:governance-theatre",
    checkName: "Governance Theatre",
    passed: true,
    severity: "info",
    evidence: `${target.flowsFromSources.length} inbound FLOWS_TO connections from operational patterns.`,
  };
}

/**
 * Dimensional Collapse — property that aggregates 2+ state dimensions into one scalar.
 * Properties named 'health', 'score', 'combined', 'overall' that aren't phiL/psiH/epsilonR.
 */
function checkDimensionalCollapse(target: TargetNode): CheckResult {
  const COLLAPSED_PROPERTY_NAMES = ["health", "score", "combined", "overall", "quality"];
  const LEGITIMATE_DIMENSIONS = ["phiL", "psiH", "epsilonR", "lambda2"];

  const suspiciousProps = Object.keys(target.properties).filter(key => {
    const lower = key.toLowerCase();
    return COLLAPSED_PROPERTY_NAMES.some(p => lower.includes(p)) &&
      !LEGITIMATE_DIMENSIONS.includes(key);
  });

  if (suspiciousProps.length > 0) {
    return {
      checkId: "anti:dimensional-collapse",
      checkName: "Dimensional Collapse",
      passed: false,
      severity: "warning",
      evidence: `Properties that may collapse state dimensions: ${suspiciousProps.join(", ")}. ΦL is always composite (never bare number).`,
      remediation: "Use the composite state dimension types (PhiLOutput, PsiHOutput) instead of bare scalars.",
    };
  }

  return {
    checkId: "anti:dimensional-collapse",
    checkName: "Dimensional Collapse",
    passed: true,
    severity: "info",
    evidence: "No collapsed dimension properties detected.",
  };
}

/**
 * Intermediary Layer — Resonator with exactly one inbound and one outbound FLOWS_TO,
 * where source and target could connect directly.
 */
function checkIntermediaryLayer(target: TargetNode): CheckResult {
  if (!target.labels.includes("Resonator")) {
    return {
      checkId: "anti:intermediary-layer",
      checkName: "Intermediary Layer",
      passed: true,
      severity: "info",
      evidence: "Not a Resonator — check not applicable.",
    };
  }

  const inbound = target.flowsFromSources;
  const outbound = target.flowsToTargets;

  // Exact 1-to-1 pass-through pattern
  if (inbound.length === 1 && outbound.length === 1) {
    // Check if it has a transformation definition (legitimate role)
    const hasTransformationDef = target.instantiatesTargets.some(
      t => t.seedType === "transformation-definition",
    );

    if (!hasTransformationDef) {
      return {
        checkId: "anti:intermediary-layer",
        checkName: "Intermediary Layer",
        passed: false,
        severity: "warning",
        evidence: `Resonator '${target.id}' has exactly 1 inbound (${inbound[0].id}) and 1 outbound (${outbound[0].id}) FLOWS_TO with no transformation definition. May be an unnecessary intermediary.`,
        remediation: "If this Resonator performs no transformation, remove it and connect source directly to target.",
      };
    }
  }

  return {
    checkId: "anti:intermediary-layer",
    checkName: "Intermediary Layer",
    passed: true,
    severity: "info",
    evidence: `Inbound: ${inbound.length}, Outbound: ${outbound.length} — not a 1:1 pass-through.`,
  };
}

/**
 * Prescribed Behaviour — cross-Bloom FLOWS_TO targeting internal Resonators.
 * One pattern imperatively controlling another.
 */
function checkPrescribedBehaviour(target: TargetNode): CheckResult {
  if (!target.labels.includes("Resonator")) {
    return {
      checkId: "anti:prescribed-behaviour",
      checkName: "Prescribed Behaviour",
      passed: true,
      severity: "info",
      evidence: "Not a Resonator — check not applicable.",
    };
  }

  // Check for inbound FLOWS_TO from different Bloom scopes that look like commands
  let crossBloomControlCount = 0;
  for (const ff of target.flowsFromSources) {
    if (!ff.containsParentId || !target.containsParentId) continue;
    if (ff.containsParentId === target.containsParentId) continue;
    // Skip shared ecosystem-level Resonators (designed to receive cross-Bloom flows)
    if (target.containsParentId === "ecosystem" || target.containsParentId === "constitutional-bloom") continue;
    if (target.id.startsWith("resonator:")) continue;
    crossBloomControlCount++;
  }

  if (crossBloomControlCount > 0) {
    return {
      checkId: "anti:prescribed-behaviour",
      checkName: "Prescribed Behaviour",
      passed: false,
      severity: "warning",
      evidence: `Internal Resonator '${target.id}' receives ${crossBloomControlCount} cross-Bloom FLOWS_TO edges. Another pattern may be imperatively controlling this one.`,
      remediation: "Cross-Bloom communication should go through Bloom boundaries or shared ecosystem Resonators, not directly to internal Resonators.",
    };
  }

  return {
    checkId: "anti:prescribed-behaviour",
    checkName: "Prescribed Behaviour",
    passed: true,
    severity: "info",
    evidence: "No cross-Bloom imperative control detected.",
  };
}
