// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { runQuery } from "../client.js";
/**
 * Get an overview of all milestones in the ecosystem graph.
 * Returns milestone Blooms with child counts and test counts.
 */
export async function getMilestoneOverview() {
    const result = await runQuery(`MATCH (b:Bloom)
     WHERE b.type IN ['milestone', 'sub-milestone']
     OPTIONAL MATCH (b)-[:CONTAINS]->(child:Bloom)
     OPTIONAL MATCH (test:Seed)-[:SCOPED_TO]->(b)
     RETURN b.id AS id, b.name AS name, b.type AS type,
            b.status AS status, b.phiL AS phiL, b.sequence AS sequence,
            b.parentId AS parentId,
            count(DISTINCT child) AS childCount,
            count(DISTINCT test) AS testCount
     ORDER BY b.sequence`, {}, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        type: r.get("type"),
        status: r.get("status"),
        phiL: r.get("phiL") ?? 0,
        sequence: r.get("sequence") ?? 0,
        parentId: r.get("parentId"),
        childCount: typeof r.get("childCount") === "number" ? r.get("childCount") : 0,
        testCount: typeof r.get("testCount") === "number" ? r.get("testCount") : 0,
    }));
}
/**
 * Get all future-scoped test Seeds targeting a specific milestone.
 * Returns test Seed nodes connected via SCOPED_TO.
 */
export async function getFutureTestsForMilestone(milestoneId) {
    const result = await runQuery(`MATCH (s:Seed)-[:SCOPED_TO]->(b:Bloom { id: $milestoneId })
     WHERE s.seedType = 'test'
     OPTIONAL MATCH (suite:Bloom)-[:CONTAINS]->(s)
     RETURN s.id AS id, s.name AS name, s.status AS status,
            suite.id AS suiteId
     ORDER BY s.id`, { milestoneId }, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        status: r.get("status"),
        suiteId: r.get("suiteId") ?? "",
    }));
}
/**
 * Get all hypothesis Helix nodes with their observed milestone.
 * Returns hypothesis data with OBSERVES relationship targets.
 */
export async function getHypothesisStatus() {
    const result = await runQuery(`MATCH (h:Helix { type: 'hypothesis' })-[:OBSERVES]->(b:Bloom)
     RETURN h.id AS id, h.claim AS claim, h.status AS status,
            h.evidenceStrength AS evidenceStrength,
            b.id AS observesMilestone
     ORDER BY h.id`, {}, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        claim: r.get("claim"),
        status: r.get("status"),
        evidenceStrength: r.get("evidenceStrength") ?? 0,
        observesMilestone: r.get("observesMilestone"),
    }));
}
/**
 * Get grammar elements, optionally filtered by category (seedType).
 * Answers: "What morphemes/axioms/rules exist and what's their implementation status?"
 */
export async function getGrammarElements(category) {
    const whereClause = category
        ? "WHERE s.seedType = $category"
        : "";
    const result = await runQuery(`MATCH (:Bloom {type: 'grammar-reference'})-[:CONTAINS]->(:Bloom {type: 'grammar-category'})-[:CONTAINS]->(s:Seed)
     ${whereClause}
     RETURN s.id AS id, s.seedType AS seedType, s.name AS name,
            s.description AS description, s.specSource AS specSource,
            s.implementationStatus AS implementationStatus,
            s.implementationNotes AS implementationNotes,
            s.codeLocation AS codeLocation
     ORDER BY s.seedType, s.id`, category ? { category } : {}, "READ");
    return result.records.map((r) => ({
        id: r.get("id"),
        seedType: r.get("seedType"),
        name: r.get("name"),
        description: r.get("description"),
        specSource: r.get("specSource"),
        implementationStatus: r.get("implementationStatus"),
        implementationNotes: r.get("implementationNotes"),
        codeLocation: r.get("codeLocation") ?? null,
    }));
}
/**
 * Get implementation coverage summary for all grammar elements.
 * Answers: "How much of the grammar is implemented?"
 */
export async function getGrammarCoverage() {
    const result = await runQuery(`MATCH (:Bloom {type: 'grammar-reference'})-[:CONTAINS]->(:Bloom {type: 'grammar-category'})-[:CONTAINS]->(s:Seed)
     RETURN s.implementationStatus AS status, count(s) AS cnt`, {}, "READ");
    const counts = {};
    let total = 0;
    for (const r of result.records) {
        const status = r.get("status");
        const cnt = r.get("cnt");
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
/**
 * Get axiom dependency chains (DAG).
 * Answers: "What axioms depend on A2 Visible State?"
 */
export async function getAxiomDependencies(axiomId) {
    const whereClause = axiomId ? "WHERE a.id = $axiomId" : "";
    const result = await runQuery(`MATCH (a:Seed {seedType: 'axiom'})
     ${whereClause}
     OPTIONAL MATCH (a)-[:DEPENDS_ON]->(dep:Seed {seedType: 'axiom'})
     OPTIONAL MATCH (rev:Seed {seedType: 'axiom'})-[:DEPENDS_ON]->(a)
     RETURN a.id AS axiomId, a.name AS axiomName,
            collect(DISTINCT dep.id) AS dependsOn,
            collect(DISTINCT rev.id) AS dependedOnBy
     ORDER BY a.id`, axiomId ? { axiomId } : {}, "READ");
    return result.records.map((r) => ({
        axiomId: r.get("axiomId"),
        axiomName: r.get("axiomName"),
        dependsOn: r.get("dependsOn").filter(Boolean),
        dependedOnBy: r.get("dependedOnBy").filter(Boolean),
    }));
}
/**
 * Get anti-pattern to axiom VIOLATES mappings.
 * Answers: "Which anti-patterns violate A2?"
 */
export async function getAntiPatternViolations(axiomId) {
    const whereClause = axiomId ? "WHERE ax.id = $axiomId" : "";
    const result = await runQuery(`MATCH (ap:Seed {seedType: 'anti-pattern'})-[:VIOLATES]->(ax:Seed {seedType: 'axiom'})
     ${whereClause}
     RETURN ap.id AS antiPatternId, ap.name AS antiPatternName,
            ax.id AS violatesAxiom, ax.name AS violatesAxiomName,
            ap.implementationStatus AS implementationStatus
     ORDER BY ax.id, ap.id`, axiomId ? { axiomId } : {}, "READ");
    return result.records.map((r) => ({
        antiPatternId: r.get("antiPatternId"),
        antiPatternName: r.get("antiPatternName"),
        violatesAxiom: r.get("violatesAxiom"),
        violatesAxiomName: r.get("violatesAxiomName"),
        implementationStatus: r.get("implementationStatus"),
    }));
}
/**
 * Get all patterns with their stages (Resonators) and data flows.
 * Returns the runtime topology of each pattern.
 *
 * @param patternId - Optional filter for a specific pattern
 */
export async function getPatternTopology(patternId) {
    const whereClause = patternId ? "WHERE p.id = $patternId" : "";
    const stageResult = await runQuery(`MATCH (p:Bloom)-[:CONTAINS]->(r:Resonator)
     ${whereClause}
     RETURN p.id AS patternId, p.name AS patternName, p.type AS patternType,
            r.id AS stageId, r.role AS role, r.name AS stageName
     ORDER BY p.id, r.id`, patternId ? { patternId } : {}, "READ");
    const flowResult = await runQuery(`MATCH (r1:Resonator)-[:FLOWS_TO]->(r2:Resonator)
     ${patternId ? "WHERE r1.patternId = $patternId" : ""}
     RETURN r1.id AS fromId, r2.id AS toId, r1.patternId AS patternId`, patternId ? { patternId } : {}, "READ");
    // Group by pattern
    const patterns = new Map();
    for (const r of stageResult.records) {
        const pid = r.get("patternId");
        if (!patterns.has(pid)) {
            patterns.set(pid, {
                patternId: pid,
                patternName: r.get("patternName"),
                patternType: r.get("patternType"),
                stages: [],
                flows: [],
            });
        }
        patterns.get(pid).stages.push({
            id: r.get("stageId"),
            role: r.get("role"),
            name: r.get("stageName"),
        });
    }
    for (const r of flowResult.records) {
        const pid = r.get("patternId");
        if (patterns.has(pid)) {
            patterns.get(pid).flows.push({
                from: r.get("fromId"),
                to: r.get("toId"),
            });
        }
    }
    return Array.from(patterns.values());
}
/**
 * Get the full graph topology for visualisation.
 * Returns all morpheme nodes (Bloom, Seed, Resonator, Helix, Grid)
 * and their relationships.
 */
export async function getVisualisationTopology() {
    // Get all morpheme nodes
    const nodeResult = await runQuery(`MATCH (n)
     WHERE n:Bloom OR n:Seed OR n:Resonator OR n:Helix OR n:Grid
     RETURN n.id AS id,
            labels(n)[0] AS label,
            COALESCE(n.type, n.seedType, '') AS type,
            COALESCE(n.name, n.id) AS name,
            properties(n) AS props
     ORDER BY labels(n)[0], n.id`, {}, "READ");
    // Get all relationships between morpheme nodes
    const relResult = await runQuery(`MATCH (a)-[r]->(b)
     WHERE (a:Bloom OR a:Seed OR a:Resonator OR a:Helix OR a:Grid)
       AND (b:Bloom OR b:Seed OR b:Resonator OR b:Helix OR b:Grid)
     RETURN a.id AS fromId, b.id AS toId, type(r) AS relType
     ORDER BY type(r), a.id`, {}, "READ");
    const nodes = nodeResult.records.map((r) => ({
        id: r.get("id"),
        label: r.get("label"),
        type: r.get("type"),
        name: r.get("name"),
        properties: r.get("props"),
    }));
    const relationships = relResult.records.map((r) => ({
        from: r.get("fromId"),
        to: r.get("toId"),
        type: r.get("relType"),
    }));
    return { nodes, relationships };
}
/**
 * Get INSTANTIATES mappings — which runtime elements are instances
 * of which grammar definitions.
 */
export async function getGrammarInstances() {
    const result = await runQuery(`MATCH (instance)-[:INSTANTIATES]->(def:Seed {seedType: 'morpheme'})
     RETURN instance.id AS instanceId,
            labels(instance)[0] AS instanceLabel,
            def.id AS grammarElementId,
            def.name AS grammarElementName
     ORDER BY def.name, instance.id`, {}, "READ");
    return result.records.map((r) => ({
        instanceId: r.get("instanceId"),
        instanceLabel: r.get("instanceLabel"),
        grammarElementId: r.get("grammarElementId"),
        grammarElementName: r.get("grammarElementName"),
    }));
}
//# sourceMappingURL=ecosystem.js.map