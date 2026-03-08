// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import type { Record as Neo4jRecord } from "neo4j-driver";
import { runQuery } from "../client.js";

// ============ ECOSYSTEM QUERIES (M-9.8) ============

/** Milestone overview entry from the ecosystem graph */
export interface MilestoneOverviewEntry {
  id: string;
  name: string;
  type: "milestone" | "sub-milestone";
  status: string;
  phiL: number;
  sequence: number;
  parentId?: string;
  childCount: number;
  testCount: number;
}

/**
 * Get an overview of all milestones in the ecosystem graph.
 * Returns milestone Blooms with child counts and test counts.
 */
export async function getMilestoneOverview(): Promise<MilestoneOverviewEntry[]> {
  const result = await runQuery(
    `MATCH (b:Bloom)
     WHERE b.type IN ['milestone', 'sub-milestone']
     OPTIONAL MATCH (b)-[:CONTAINS]->(child:Bloom)
     OPTIONAL MATCH (test:Seed)-[:SCOPED_TO]->(b)
     RETURN b.id AS id, b.name AS name, b.type AS type,
            b.status AS status, b.phiL AS phiL, b.sequence AS sequence,
            b.parentId AS parentId,
            count(DISTINCT child) AS childCount,
            count(DISTINCT test) AS testCount
     ORDER BY b.sequence`,
    {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    id: r.get("id") as string,
    name: r.get("name") as string,
    type: r.get("type") as "milestone" | "sub-milestone",
    status: r.get("status") as string,
    phiL: (r.get("phiL") as number) ?? 0,
    sequence: (r.get("sequence") as number) ?? 0,
    parentId: r.get("parentId") as string | undefined,
    childCount: typeof r.get("childCount") === "number" ? (r.get("childCount") as number) : 0,
    testCount: typeof r.get("testCount") === "number" ? (r.get("testCount") as number) : 0,
  }));
}

/** Future test entry from the ecosystem graph */
export interface FutureTestEntry {
  id: string;
  name: string;
  status: string;
  suiteId: string;
}

/**
 * Get all future-scoped test Seeds targeting a specific milestone.
 * Returns test Seed nodes connected via SCOPED_TO.
 */
export async function getFutureTestsForMilestone(
  milestoneId: string,
): Promise<FutureTestEntry[]> {
  const result = await runQuery(
    `MATCH (s:Seed)-[:SCOPED_TO]->(b:Bloom { id: $milestoneId })
     WHERE s.seedType = 'test'
     OPTIONAL MATCH (suite:Bloom)-[:CONTAINS]->(s)
     RETURN s.id AS id, s.name AS name, s.status AS status,
            suite.id AS suiteId
     ORDER BY s.id`,
    { milestoneId },
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    id: r.get("id") as string,
    name: r.get("name") as string,
    status: r.get("status") as string,
    suiteId: (r.get("suiteId") as string) ?? "",
  }));
}

/** Hypothesis status entry from the ecosystem graph */
export interface HypothesisStatusEntry {
  id: string;
  claim: string;
  status: string;
  evidenceStrength: number;
  observesMilestone: string;
}

/**
 * Get all hypothesis Helix nodes with their observed milestone.
 * Returns hypothesis data with OBSERVES relationship targets.
 */
export async function getHypothesisStatus(): Promise<HypothesisStatusEntry[]> {
  const result = await runQuery(
    `MATCH (h:Helix { type: 'hypothesis' })-[:OBSERVES]->(b:Bloom)
     RETURN h.id AS id, h.claim AS claim, h.status AS status,
            h.evidenceStrength AS evidenceStrength,
            b.id AS observesMilestone
     ORDER BY h.id`,
    {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    id: r.get("id") as string,
    claim: r.get("claim") as string,
    status: r.get("status") as string,
    evidenceStrength: (r.get("evidenceStrength") as number) ?? 0,
    observesMilestone: r.get("observesMilestone") as string,
  }));
}

// ============ GRAMMAR REFERENCE QUERIES (M-9.7a) ============

/** Grammar element entry from the graph */
export interface GrammarElementEntry {
  id: string;
  seedType: string;
  name: string;
  description: string;
  specSource: string;
  implementationStatus: string;
  implementationNotes: string;
  codeLocation: string | null;
}

/**
 * Get grammar elements, optionally filtered by category (seedType).
 * Answers: "What morphemes/axioms/rules exist and what's their implementation status?"
 */
export async function getGrammarElements(
  category?: string,
): Promise<GrammarElementEntry[]> {
  const whereClause = category
    ? "WHERE s.seedType = $category"
    : "";
  const result = await runQuery(
    `MATCH (:Bloom {type: 'grammar-reference'})-[:CONTAINS]->(:Bloom {type: 'grammar-category'})-[:CONTAINS]->(s:Seed)
     ${whereClause}
     RETURN s.id AS id, s.seedType AS seedType, s.name AS name,
            s.description AS description, s.specSource AS specSource,
            s.implementationStatus AS implementationStatus,
            s.implementationNotes AS implementationNotes,
            s.codeLocation AS codeLocation
     ORDER BY s.seedType, s.id`,
    category ? { category } : {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    id: r.get("id") as string,
    seedType: r.get("seedType") as string,
    name: r.get("name") as string,
    description: r.get("description") as string,
    specSource: r.get("specSource") as string,
    implementationStatus: r.get("implementationStatus") as string,
    implementationNotes: r.get("implementationNotes") as string,
    codeLocation: (r.get("codeLocation") as string) ?? null,
  }));
}

/** Grammar implementation coverage summary */
export interface GrammarCoverageEntry {
  total: number;
  complete: number;
  partial: number;
  typesOnly: number;
  notStarted: number;
  aspirational: number;
}

/**
 * Get implementation coverage summary for all grammar elements.
 * Answers: "How much of the grammar is implemented?"
 */
export async function getGrammarCoverage(): Promise<GrammarCoverageEntry> {
  const result = await runQuery(
    `MATCH (:Bloom {type: 'grammar-reference'})-[:CONTAINS]->(:Bloom {type: 'grammar-category'})-[:CONTAINS]->(s:Seed)
     RETURN s.implementationStatus AS status, count(s) AS cnt`,
    {},
    "READ",
  );
  const counts: Record<string, number> = {};
  let total = 0;
  for (const r of result.records) {
    const status = r.get("status") as string;
    const cnt = r.get("cnt") as number;
    counts[status] = cnt;
    total += cnt;
  }
  return {
    total,
    complete: counts["complete"] ?? 0,
    partial: counts["partial"] ?? 0,
    typesOnly: counts["types-only"] ?? 0,
    notStarted: counts["not-started"] ?? 0,
    aspirational: counts["aspirational"] ?? 0,
  };
}

/** Axiom dependency chain entry */
export interface AxiomDependencyEntry {
  axiomId: string;
  axiomName: string;
  dependsOn: string[];
  dependedOnBy: string[];
}

/**
 * Get axiom dependency chains (DAG).
 * Answers: "What axioms depend on A2 Visible State?"
 */
export async function getAxiomDependencies(
  axiomId?: string,
): Promise<AxiomDependencyEntry[]> {
  const whereClause = axiomId ? "WHERE a.id = $axiomId" : "";
  const result = await runQuery(
    `MATCH (a:Seed {seedType: 'axiom'})
     ${whereClause}
     OPTIONAL MATCH (a)-[:DEPENDS_ON]->(dep:Seed {seedType: 'axiom'})
     OPTIONAL MATCH (rev:Seed {seedType: 'axiom'})-[:DEPENDS_ON]->(a)
     RETURN a.id AS axiomId, a.name AS axiomName,
            collect(DISTINCT dep.id) AS dependsOn,
            collect(DISTINCT rev.id) AS dependedOnBy
     ORDER BY a.id`,
    axiomId ? { axiomId } : {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    axiomId: r.get("axiomId") as string,
    axiomName: r.get("axiomName") as string,
    dependsOn: (r.get("dependsOn") as string[]).filter(Boolean),
    dependedOnBy: (r.get("dependedOnBy") as string[]).filter(Boolean),
  }));
}

/** Anti-pattern violation entry */
export interface AntiPatternViolationEntry {
  antiPatternId: string;
  antiPatternName: string;
  violatesAxiom: string;
  violatesAxiomName: string;
  implementationStatus: string;
}

/**
 * Get anti-pattern to axiom VIOLATES mappings.
 * Answers: "Which anti-patterns violate A2?"
 */
export async function getAntiPatternViolations(
  axiomId?: string,
): Promise<AntiPatternViolationEntry[]> {
  const whereClause = axiomId ? "WHERE ax.id = $axiomId" : "";
  const result = await runQuery(
    `MATCH (ap:Seed {seedType: 'anti-pattern'})-[:VIOLATES]->(ax:Seed {seedType: 'axiom'})
     ${whereClause}
     RETURN ap.id AS antiPatternId, ap.name AS antiPatternName,
            ax.id AS violatesAxiom, ax.name AS violatesAxiomName,
            ap.implementationStatus AS implementationStatus
     ORDER BY ax.id, ap.id`,
    axiomId ? { axiomId } : {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    antiPatternId: r.get("antiPatternId") as string,
    antiPatternName: r.get("antiPatternName") as string,
    violatesAxiom: r.get("violatesAxiom") as string,
    violatesAxiomName: r.get("violatesAxiomName") as string,
    implementationStatus: r.get("implementationStatus") as string,
  }));
}

// ============ MORPHEME TOPOLOGY QUERIES (M-9.7b) ============

/** Pattern topology entry — a pattern with its stages and data flows */
export interface PatternTopologyEntry {
  patternId: string;
  patternName: string;
  patternType: string;
  stages: Array<{ id: string; role: string; name: string }>;
  flows: Array<{ from: string; to: string }>;
}

/**
 * Get all patterns with their stages (Resonators) and data flows.
 * Returns the runtime topology of each pattern.
 *
 * @param patternId - Optional filter for a specific pattern
 */
export async function getPatternTopology(
  patternId?: string,
): Promise<PatternTopologyEntry[]> {
  const whereClause = patternId ? "WHERE p.id = $patternId" : "";
  const stageResult = await runQuery(
    `MATCH (p:Bloom)-[:CONTAINS]->(r:Resonator)
     ${whereClause}
     RETURN p.id AS patternId, p.name AS patternName, p.type AS patternType,
            r.id AS stageId, r.role AS role, r.name AS stageName
     ORDER BY p.id, r.id`,
    patternId ? { patternId } : {},
    "READ",
  );

  const flowResult = await runQuery(
    `MATCH (r1:Resonator)-[:FLOWS_TO]->(r2:Resonator)
     ${patternId ? "WHERE r1.patternId = $patternId" : ""}
     RETURN r1.id AS fromId, r2.id AS toId, r1.patternId AS patternId`,
    patternId ? { patternId } : {},
    "READ",
  );

  // Group by pattern
  const patterns = new Map<string, PatternTopologyEntry>();

  for (const r of stageResult.records) {
    const pid = r.get("patternId") as string;
    if (!patterns.has(pid)) {
      patterns.set(pid, {
        patternId: pid,
        patternName: r.get("patternName") as string,
        patternType: r.get("patternType") as string,
        stages: [],
        flows: [],
      });
    }
    patterns.get(pid)!.stages.push({
      id: r.get("stageId") as string,
      role: r.get("role") as string,
      name: r.get("stageName") as string,
    });
  }

  for (const r of flowResult.records) {
    const pid = r.get("patternId") as string;
    if (patterns.has(pid)) {
      patterns.get(pid)!.flows.push({
        from: r.get("fromId") as string,
        to: r.get("toId") as string,
      });
    }
  }

  return Array.from(patterns.values());
}

/** Visualisation node entry */
export interface VisNodeEntry {
  id: string;
  label: string;
  type: string;
  name: string;
  properties: Record<string, unknown>;
}

/** Visualisation relationship entry */
export interface VisRelationshipEntry {
  from: string;
  to: string;
  type: string;
}

/** Full visualisation topology */
export interface VisualisationTopology {
  nodes: VisNodeEntry[];
  relationships: VisRelationshipEntry[];
}

/**
 * Get the full graph topology for visualisation.
 * Returns all morpheme nodes (Bloom, Seed, Resonator, Helix, Grid)
 * and their relationships.
 */
export async function getVisualisationTopology(): Promise<VisualisationTopology> {
  // Get all morpheme nodes
  const nodeResult = await runQuery(
    `MATCH (n)
     WHERE n:Bloom OR n:Seed OR n:Resonator OR n:Helix OR n:Grid
     RETURN n.id AS id,
            labels(n)[0] AS label,
            COALESCE(n.type, n.seedType, '') AS type,
            COALESCE(n.name, n.id) AS name,
            properties(n) AS props
     ORDER BY labels(n)[0], n.id`,
    {},
    "READ",
  );

  // Get all relationships between morpheme nodes
  const relResult = await runQuery(
    `MATCH (a)-[r]->(b)
     WHERE (a:Bloom OR a:Seed OR a:Resonator OR a:Helix OR a:Grid)
       AND (b:Bloom OR b:Seed OR b:Resonator OR b:Helix OR b:Grid)
     RETURN a.id AS fromId, b.id AS toId, type(r) AS relType
     ORDER BY type(r), a.id`,
    {},
    "READ",
  );

  const nodes: VisNodeEntry[] = nodeResult.records.map((r: Neo4jRecord) => ({
    id: r.get("id") as string,
    label: r.get("label") as string,
    type: r.get("type") as string,
    name: r.get("name") as string,
    properties: r.get("props") as Record<string, unknown>,
  }));

  const relationships: VisRelationshipEntry[] = relResult.records.map(
    (r: Neo4jRecord) => ({
      from: r.get("fromId") as string,
      to: r.get("toId") as string,
      type: r.get("relType") as string,
    }),
  );

  return { nodes, relationships };
}

/** Grammar instance mapping entry */
export interface GrammarInstanceEntry {
  instanceId: string;
  instanceLabel: string;
  grammarElementId: string;
  grammarElementName: string;
}

/**
 * Get INSTANTIATES mappings — which runtime elements are instances
 * of which grammar definitions.
 */
export async function getGrammarInstances(): Promise<GrammarInstanceEntry[]> {
  const result = await runQuery(
    `MATCH (instance)-[:INSTANTIATES]->(def:Seed {seedType: 'morpheme'})
     RETURN instance.id AS instanceId,
            labels(instance)[0] AS instanceLabel,
            def.id AS grammarElementId,
            def.name AS grammarElementName
     ORDER BY def.name, instance.id`,
    {},
    "READ",
  );
  return result.records.map((r: Neo4jRecord) => ({
    instanceId: r.get("instanceId") as string,
    instanceLabel: r.get("instanceLabel") as string,
    grammarElementId: r.get("grammarElementId") as string,
    grammarElementName: r.get("grammarElementName") as string,
  }));
}
