// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Gnosis Compliance Evaluation — structural cognition faculty.
 *
 * Deterministic structural checks against grammar, axioms, and anti-patterns.
 * No LLM invocation. Pure Cypher queries.
 *
 * Recursion boundary: Violation Seeds and observation Seeds are written
 * via raw Cypher, not through instantiateMorpheme(). Same structural
 * justification as recordInstantiationObservation() — the governance
 * layer observing itself, one level only.
 *
 * @module codex-signum-core/patterns/cognitive/evaluation
 */

import type { EvaluationResult, EvaluationTrigger, CheckResult, TargetNode } from "./types.js";
import { readTransaction, writeTransaction } from "../../graph/client.js";
import { checkGrammar } from "./checks/grammar.js";
import { checkAxioms } from "./checks/axioms.js";
import { checkAntiPatterns } from "./checks/anti-patterns.js";

/** Morpheme type label → type key mapping */
const LABEL_TO_TYPE: Record<string, string> = {
  Seed: "seed",
  Bloom: "bloom",
  Resonator: "resonator",
  Grid: "grid",
  Helix: "helix",
};

/**
 * Evaluate a single morpheme for structural compliance.
 *
 * @param targetId - ID of the morpheme to evaluate
 * @param trigger - What triggered this evaluation
 * @returns EvaluationResult with per-check findings
 */
export async function evaluate(
  targetId: string,
  trigger: EvaluationTrigger,
): Promise<EvaluationResult> {
  const startMs = Date.now();

  // 1. Read the target morpheme — labels, properties, relationships
  const targetNode = await readTargetNode(targetId);
  if (!targetNode) {
    return {
      targetId,
      targetType: "unknown",
      trigger,
      checks: [{
        checkId: "PRE",
        checkName: "Target exists",
        passed: false,
        severity: "error",
        evidence: `Node '${targetId}' not found in graph`,
      }],
      overallVerdict: "violation",
      violationCount: 1,
      warningCount: 0,
      processingTimeMs: Date.now() - startMs,
    };
  }

  // 2. Run all check suites
  const grammarResults = await checkGrammar(targetNode);
  const axiomResults = await checkAxioms(targetNode);
  const antiPatternResults = await checkAntiPatterns(targetNode);

  const allChecks = [...grammarResults, ...axiomResults, ...antiPatternResults];

  // 3. Aggregate
  const violationCount = allChecks.filter(
    c => !c.passed && (c.severity === "error" || c.severity === "critical"),
  ).length;
  const warningCount = allChecks.filter(
    c => !c.passed && c.severity === "warning",
  ).length;

  const overallVerdict = violationCount > 0 ? "violation"
    : warningCount > 0 ? "warning"
    : "pass";

  const result: EvaluationResult = {
    targetId,
    targetType: targetNode.morphemeType,
    trigger,
    checks: allChecks,
    overallVerdict,
    violationCount,
    warningCount,
    processingTimeMs: Date.now() - startMs,
  };

  // 4. Record observation (raw Cypher — recursion boundary)
  await recordEvaluationObservation(result);

  // 5. Record violations (raw Cypher — recursion boundary)
  for (const check of allChecks) {
    if (!check.passed && (check.severity === "error" || check.severity === "critical")) {
      await recordViolation(targetId, check);
    }
  }

  return result;
}

/**
 * Read a morpheme's full structural context in sequential WITH-chained collections.
 * Avoids Cartesian product from multiple OPTIONAL MATCH in a single RETURN.
 */
export async function readTargetNode(targetId: string): Promise<TargetNode | null> {
  return readTransaction(async (tx) => {
    // Step 1: Node identity + parent
    const baseResult = await tx.run(
      `MATCH (n {id: $targetId})
       OPTIONAL MATCH (parent)-[:CONTAINS]->(n)
       RETURN n AS node,
              labels(n) AS labels,
              properties(n) AS props,
              parent.id AS parentId,
              CASE
                WHEN parent:Bloom THEN 'bloom'
                WHEN parent:Grid THEN 'grid'
                WHEN parent:Resonator THEN 'resonator'
                WHEN parent:Helix THEN 'helix'
                WHEN parent:Seed THEN 'seed'
                ELSE null
              END AS parentType`,
      { targetId },
    );

    if (baseResult.records.length === 0) return null;

    const rec = baseResult.records[0];
    const labels = rec.get("labels") as string[];
    const props = rec.get("props") as Record<string, unknown>;
    const parentId = rec.get("parentId") as string | null;
    const parentType = rec.get("parentType") as string | null;

    // Determine morpheme type from labels
    let morphemeType = "unknown";
    for (const label of labels) {
      if (LABEL_TO_TYPE[label]) {
        morphemeType = LABEL_TO_TYPE[label];
        break;
      }
    }

    // Step 2: Children
    const childResult = await tx.run(
      `MATCH (n {id: $targetId})-[:CONTAINS]->(child)
       RETURN DISTINCT child.id AS id, labels(child) AS labels`,
      { targetId },
    );
    const containsChildren = childResult.records.map(r => ({
      id: r.get("id") as string,
      labels: r.get("labels") as string[],
    }));

    // Step 3: INSTANTIATES targets
    const instResult = await tx.run(
      `MATCH (n {id: $targetId})-[:INSTANTIATES]->(inst)
       RETURN DISTINCT inst.id AS id, inst.name AS name, inst.seedType AS seedType`,
      { targetId },
    );
    const instantiatesTargets = instResult.records.map(r => ({
      id: r.get("id") as string,
      name: r.get("name") as string,
      seedType: r.get("seedType") as string | undefined,
    }));

    // Step 4: FLOWS_TO targets with containment parent
    const ftResult = await tx.run(
      `MATCH (n {id: $targetId})-[:FLOWS_TO]->(ft)
       OPTIONAL MATCH (ftParent:Bloom)-[:CONTAINS]->(ft)
       RETURN DISTINCT ft.id AS id, labels(ft) AS labels, ftParent.id AS parentId`,
      { targetId },
    );
    const flowsToTargets = ftResult.records.map(r => ({
      id: r.get("id") as string,
      labels: r.get("labels") as string[],
      containsParentId: r.get("parentId") as string | undefined,
    }));

    // Step 5: FLOWS_TO sources (inbound) with containment parent
    const ffResult = await tx.run(
      `MATCH (n {id: $targetId})<-[:FLOWS_TO]-(ff)
       OPTIONAL MATCH (ffParent:Bloom)-[:CONTAINS]->(ff)
       RETURN DISTINCT ff.id AS id, labels(ff) AS labels, ffParent.id AS parentId`,
      { targetId },
    );
    const flowsFromSources = ffResult.records.map(r => ({
      id: r.get("id") as string,
      labels: r.get("labels") as string[],
      containsParentId: r.get("parentId") as string | undefined,
    }));

    // Step 6: All relationship types
    const relResult = await tx.run(
      `MATCH (n {id: $targetId})-[r]-()
       RETURN DISTINCT type(r) AS relType`,
      { targetId },
    );
    const allRelationshipTypes = relResult.records.map(r => r.get("relType") as string);

    return {
      id: targetId,
      morphemeType,
      labels,
      properties: props,
      containsParentId: parentId,
      containsParentType: parentType,
      containsChildren,
      instantiatesTargets,
      flowsToTargets,
      flowsFromSources,
      allRelationshipTypes,
    };
  });
}

/**
 * Record an evaluation observation in the Gnosis evaluation observation Grid.
 * Raw Cypher — recursion boundary.
 */
async function recordEvaluationObservation(result: EvaluationResult): Promise<void> {
  try {
    const obsId = `obs:eval:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await writeTransaction(async (tx) => {
      await tx.run(
        `MERGE (g:Grid {id: 'grid:gnosis-evaluation-observations'})
         ON CREATE SET
           g.name = 'Gnosis Evaluation Observations',
           g.type = 'observation',
           g.content = 'Receives observation Seeds from Gnosis Compliance Evaluation faculty.',
           g.status = 'active',
           g.createdAt = datetime()
         CREATE (obs:Seed {
           id: $obsId,
           seedType: 'observation',
           name: $name,
           content: $content,
           status: 'recorded',
           targetNodeId: $targetId,
           targetType: $targetType,
           trigger: $trigger,
           verdict: $verdict,
           violationCount: $violationCount,
           warningCount: $warningCount,
           processingTimeMs: $processingTimeMs,
           createdAt: datetime()
         })
         WITH g, obs
         MERGE (g)-[:CONTAINS]->(obs)`,
        {
          obsId,
          name: `Evaluation: ${result.targetId} → ${result.overallVerdict}`,
          content: `Evaluated '${result.targetId}' (${result.targetType}), trigger: ${result.trigger}. ` +
            `Verdict: ${result.overallVerdict}. Violations: ${result.violationCount}, Warnings: ${result.warningCount}. ` +
            `Checks: ${result.checks.length} total, ${result.checks.filter(c => c.passed).length} passed. ` +
            `Time: ${result.processingTimeMs}ms.`,
          targetId: result.targetId,
          targetType: result.targetType,
          trigger: result.trigger,
          verdict: result.overallVerdict,
          violationCount: result.violationCount,
          warningCount: result.warningCount,
          processingTimeMs: result.processingTimeMs,
        },
      );
    });
  } catch {
    // Observation recording is non-fatal
  }
}

/**
 * Record a Violation Seed in the ecosystem Violation Grid.
 * Raw Cypher — recursion boundary.
 */
async function recordViolation(targetId: string, check: CheckResult): Promise<void> {
  try {
    const violationId = `violation:eval:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await writeTransaction(async (tx) => {
      await tx.run(
        `MERGE (g:Grid {id: 'grid:violation:ecosystem'})
         ON CREATE SET
           g.name = 'Ecosystem Violation Grid',
           g.type = 'violation',
           g.content = 'Receives Violation Seeds from Highlander Protocol enforcement and Gnosis Compliance Evaluation.',
           g.status = 'active',
           g.createdAt = datetime()
         CREATE (v:Seed {
           id: $violationId,
           seedType: 'violation',
           name: $name,
           content: $content,
           status: 'active',
           severity: $severity,
           checkId: $checkId,
           checkName: $checkName,
           targetNodeId: $targetId,
           evidence: $evidence,
           remediation: $remediation,
           createdAt: datetime()
         })
         WITH g, v
         MERGE (g)-[:CONTAINS]->(v)`,
        {
          violationId,
          name: `${check.checkId} violation on ${targetId}`,
          content: `Compliance violation: ${check.checkName} (${check.checkId}) failed on '${targetId}'. ` +
            `Evidence: ${check.evidence}` +
            (check.remediation ? ` Remediation: ${check.remediation}` : ""),
          severity: check.severity,
          checkId: check.checkId,
          checkName: check.checkName,
          targetId,
          evidence: check.evidence,
          remediation: check.remediation ?? null,
        },
      );
    });
  } catch {
    // Violation recording is non-fatal
  }
}
