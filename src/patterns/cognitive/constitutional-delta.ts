// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Constitutional Delta Resonator
 *
 * Computes the set difference between current topology and constitutional target.
 * Produces Gap Seeds for missing instances, missing Lines, and topology mismatches.
 *
 * Instantiation: resonator:constitutional-delta
 * Definition: def:transformation:constitutional-delta
 * I/O Shape: Diagnostic->Gaps (distribution)
 *
 * @module codex-signum-core/patterns/cognitive/constitutional-delta
 */

import { readTransaction } from "../../graph/client.js";
import type { BloomSurvey, GapSeed, TransformationDef } from "./types.js";

/**
 * Query all transformation-level and bloom-level definitions from the Constitutional Bloom.
 */
export async function queryTransformationDefinitions(): Promise<TransformationDef[]> {
  return readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(def:Seed)
       WHERE def.seedType IN ['transformation-definition', 'bloom-definition']
         AND def.status = 'active'
       RETURN def.id AS id, def.name AS name, def.seedType AS seedType,
              def.ioShape AS ioShape, def.scope AS scope`,
    );
    return res.records.map((r) => ({
      id: r.get("id") as string,
      name: (r.get("name") as string) ?? "",
      seedType: (r.get("seedType") as string) ?? "",
      ioShape: (r.get("ioShape") as string) ?? "",
      scope: (r.get("scope") as string) ?? "",
    }));
  });
}

/**
 * Compute the delta between a BloomSurvey and the constitutional definitions.
 *
 * Constitutional gaps (mandatory):
 * - Definition exists but no active instance INSTANTIATES it
 * - Instance exists but expected FLOWS_TO Lines are missing
 * - Stage Bloom has zero internal Resonators
 *
 * Topological gaps (advisory):
 * - lambda2 = 0 (disconnected components)
 * - lambda2 below maturity-indexed threshold
 * - Purely sequential chain topology (CPT v3 targets DAG)
 *
 * @param survey - BloomSurvey from the Structural Survey Resonator
 * @param definitions - All transformation/bloom definitions from Constitutional Bloom
 * @param scope - Which definition scopes to check
 */
export function computeConstitutionalDelta(
  survey: BloomSurvey,
  definitions: TransformationDef[],
  scope: string[],
): GapSeed[] {
  const gaps: GapSeed[] = [];
  let gapCounter = 0;

  const nextGapId = (): string => {
    gapCounter++;
    return `gap:${survey.bloomId}:${gapCounter}`;
  };

  // Collect all instantiated definition IDs from the survey
  const instantiatedDefIds = new Set(
    survey.instantiatesEdges.map((e) => e.toDefId),
  );

  // 1. MISSING INSTANCES (constitutional -- mandatory)
  const scopedDefs = definitions.filter((d) => scope.includes(d.scope));
  for (const def of scopedDefs) {
    if (!instantiatedDefIds.has(def.id)) {
      gaps.push({
        gapId: nextGapId(),
        gapType: "constitutional",
        description: `Definition '${def.name}' (${def.id}) has no active instance with INSTANTIATES edge.`,
        severity: "mandatory",
        missingDefId: def.id,
        missingDefName: def.name,
      });
    }
  }

  // 2. EMPTY STAGES (constitutional -- mandatory)
  // Children that are Blooms but have zero internal morphemes
  for (const child of survey.children) {
    if (child.labels.includes("Bloom") && child.internalMorphemes.length === 0) {
      gaps.push({
        gapId: nextGapId(),
        gapType: "constitutional",
        description: `Stage Bloom '${child.name}' (${child.id}) has no internal morphemes.`,
        severity: "mandatory",
      });
    }
  }

  // 3. MISSING LINES -- children with zero FLOWS_TO to any ecosystem Resonator
  // Detect children that have no inter-child Lines at all (isolated stages)
  const connectedChildIds = new Set<string>();
  for (const line of survey.interChildLines) {
    connectedChildIds.add(line.sourceId);
    connectedChildIds.add(line.targetId);
  }
  for (const child of survey.children) {
    if (!connectedChildIds.has(child.id) && survey.children.length > 1) {
      gaps.push({
        gapId: nextGapId(),
        gapType: "constitutional",
        description: `Stage '${child.name}' (${child.id}) has no FLOWS_TO or DEPENDS_ON Lines to other children.`,
        severity: "mandatory",
        missingLineSource: child.id,
        missingLineType: "FLOWS_TO",
      });
    }
  }

  // 4. TOPOLOGICAL GAPS (advisory)
  if (survey.lambda2 === 0 && survey.children.length > 1) {
    gaps.push({
      gapId: nextGapId(),
      gapType: "topological",
      description: `lambda2=0: disconnected components. Stages have no inter-edges.`,
      severity: "advisory",
      expectedLambda2Delta: 0.1,
    });
  } else if (survey.lambda2 > 0 && survey.lambda2 < 0.1) {
    gaps.push({
      gapId: nextGapId(),
      gapType: "topological",
      description: `lambda2=${survey.lambda2}: below threshold. Weak connectivity.`,
      severity: "advisory",
      expectedLambda2Delta: 0.1 - survey.lambda2,
    });
  }

  // Check for purely sequential chain topology
  if (survey.children.length > 2 && survey.interChildLines.length > 0) {
    const outDegree = new Map<string, number>();
    const inDegree = new Map<string, number>();
    for (const line of survey.interChildLines) {
      outDegree.set(line.sourceId, (outDegree.get(line.sourceId) ?? 0) + 1);
      inDegree.set(line.targetId, (inDegree.get(line.targetId) ?? 0) + 1);
    }
    const isChain = [...outDegree.values()].every((d) => d <= 1)
      && [...inDegree.values()].every((d) => d <= 1);
    if (isChain) {
      gaps.push({
        gapId: nextGapId(),
        gapType: "topological",
        description: "Topology is a linear chain. CPT v3 targets data dependency DAG.",
        severity: "advisory",
      });
    }
  }

  // 5. SORT: constitutional mandatory first, then topological advisory
  gaps.sort((a, b) => {
    if (a.gapType !== b.gapType) {
      return a.gapType === "constitutional" ? -1 : 1;
    }
    if (a.severity !== b.severity) {
      return a.severity === "mandatory" ? -1 : 1;
    }
    // Within constitutional: missing instances before missing Lines
    if (a.missingDefId && !b.missingDefId) return -1;
    if (!a.missingDefId && b.missingDefId) return 1;
    return 0;
  });

  return gaps;
}
