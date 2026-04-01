// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Morpheme Instantiation Protocol — governance Resonator enforcement layer.
 *
 * ALL morpheme creation and modification flows through exactly four functions:
 * - instantiateMorpheme()  — creates a morpheme via the Instantiation Resonator
 * - updateMorpheme()       — updates a morpheme via the Mutation Resonator
 * - createLine()           — creates a Line via the Line Creation Resonator
 * - stampBloomComplete()   — stamps a Bloom complete with derived phiL + inline recomputation
 *
 * After Phase B, no raw Cypher creates or mutates morpheme nodes ever again.
 *
 * @see docs/specs/instantiation-mutation-resonator-design.md
 * @see docs/specs/cs-v5.0.md §Constitutional Coupling
 */
import { writeTransaction, readTransaction, runQuery } from "./client.js";
import { invalidateLineConductivity, evaluateAndCacheLineConductivity } from "./queries/conductivity.js";
import { propagatePhiLUpward } from "../computation/hierarchical-health.js";
import { computeAndPersistPsiH } from "./queries/health.js";
import { assembleTriggerState } from "../computation/immune-response.js";
// NOTE: verifyStamp lives in queries/bloom.ts which imports from instantiation.ts.
// To avoid circular import, stamp verification is inlined below.
import { getParentBloom } from "./queries/topology.js";
/** Neo4j label for each morpheme type */
const LABEL_MAP = {
    seed: "Seed",
    bloom: "Bloom",
    resonator: "Resonator",
    grid: "Grid",
    helix: "Helix",
};
/** Required properties per morpheme type */
const REQUIRED_PROPERTIES = {
    seed: ["id", "name", "content", "seedType", "status"],
    bloom: ["id", "name", "content", "type", "status"],
    resonator: ["id", "name", "content", "type", "status"],
    grid: ["id", "name", "content", "type", "status"],
    helix: ["id", "name", "content", "mode", "status"],
};
/** Constitutional Bloom definition ID for each morpheme type */
const DEFINITION_MAP = {
    seed: "def:morpheme:seed",
    bloom: "def:morpheme:bloom",
    resonator: "def:morpheme:resonator",
    grid: "def:morpheme:grid",
    helix: "def:morpheme:helix",
};
/** Valid containment: which types can contain which */
export const VALID_CONTAINERS = {
    bloom: ["seed", "bloom", "resonator", "grid", "helix"],
    grid: ["seed"],
};
/** Valid Line relationship types and their direction semantics */
export const VALID_LINE_TYPES = [
    "CONTAINS",
    "FLOWS_TO",
    "INSTANTIATES",
    "DEPENDS_ON",
    "OBSERVES",
    "SCOPED_TO",
    "VIOLATES",
    "ROUTED_TO",
    "ORIGINATED_FROM",
    "IN_CONTEXT",
    "DECIDED_DURING",
    "OBSERVED_IN",
    "DISTILLED_FROM",
    "EXECUTED_IN",
    "PRODUCED",
    "PROCESSED",
    "REFERENCES",
    "SPECIFIED_BY",
    "SPECIALISES",
    "SUPERSEDED_BY",
];
/** Closed allowlist of labels that updateMorpheme() can add via addLabels parameter (M-10.1 §7) */
export const VALID_ADD_LABELS = ["Archived"];
export const VALID_SEED_SUBTYPES = [
    'Observation', 'Decision', 'TaskOutput', 'Distillation',
];
const VALID_A6_JUSTIFICATIONS = [
    "distinct_learned_state",
    "distinct_governance_scope",
    "distinct_temporal_scale",
];
// ─── Instantiation Resonator ────────────────────────────────────────
/**
 * Create a morpheme instance via the Instantiation Resonator.
 *
 * Atomic transaction: node creation + CONTAINS wiring + INSTANTIATES wiring.
 * Records observation in the Instantiation Resonator's Grid.
 *
 * @param morphemeType - One of: seed, bloom, resonator, grid, helix
 * @param properties - All properties for the node (must include required fields)
 * @param parentId - The Bloom (or Grid for seeds) that will CONTAIN this morpheme
 */
export async function instantiateMorpheme(morphemeType, properties, parentId, highlander, options) {
    const nodeId = properties.id;
    // ── Step 1: Morpheme hygiene check ──
    const required = REQUIRED_PROPERTIES[morphemeType];
    for (const prop of required) {
        const val = properties[prop];
        if (val === undefined || val === null || val === "") {
            const error = `Instantiation rejected: ${morphemeType} missing required property '${prop}'. id=${nodeId ?? "unknown"}`;
            await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
            return { success: false, error };
        }
    }
    // Content must be non-empty (applies to ALL morpheme types)
    const content = properties.content;
    if (!content || content.trim() === "") {
        const error = `Instantiation rejected: ${morphemeType} '${nodeId}' has empty content. Every morpheme carries meaning (A1).`;
        await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
        return { success: false, error };
    }
    // ── Step 2: Grammatical shape check ──
    // Verify the parent can contain this morpheme type
    const parentType = await getNodeMorphemeType(parentId);
    if (!parentType) {
        const error = `Instantiation rejected: parent '${parentId}' does not exist.`;
        await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
        return { success: false, error };
    }
    const allowedChildren = VALID_CONTAINERS[parentType];
    if (!allowedChildren) {
        const error = `Instantiation rejected: '${parentType}' cannot contain any morphemes. Only Blooms and Grids can contain.`;
        await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
        return { success: false, error };
    }
    if (!allowedChildren.includes(morphemeType)) {
        const error = `Instantiation rejected: '${parentType}' cannot contain '${morphemeType}'. Allowed: ${allowedChildren.join(", ")}.`;
        await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
        return { success: false, error };
    }
    // ── Step 2.3: Seed sub-type validation ──
    if (options?.subType) {
        if (morphemeType !== "seed") {
            const error = `Instantiation rejected: subType '${options.subType}' is only valid for seeds, not '${morphemeType}'. id=${nodeId ?? "unknown"}`;
            await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
            return { success: false, error };
        }
        if (!VALID_SEED_SUBTYPES.includes(options.subType)) {
            const error = `Instantiation rejected: invalid subType '${options.subType}'. Valid: ${VALID_SEED_SUBTYPES.join(", ")}. id=${nodeId ?? "unknown"}`;
            await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
            return { success: false, error };
        }
    }
    // ── Step 2.5: Highlander Protocol (Resonator/Bloom/Grid/Helix) ──
    if (morphemeType === "resonator" || morphemeType === "bloom" || morphemeType === "grid" || morphemeType === "helix") {
        if (!highlander?.transformationDefId) {
            const error = `Instantiation rejected: ${morphemeType} creation requires transformationDefId (Highlander Protocol, A6 Minimal Authority). id=${nodeId ?? "unknown"}`;
            await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
            return { success: false, error };
        }
        // Validate the definition exists in the Constitutional Bloom
        const defExists = await readTransaction(async (tx) => {
            const res = await tx.run(`MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(def:Seed {id: $defId})
         WHERE def.status = 'active'
         RETURN def.id`, { defId: highlander.transformationDefId });
            return res.records.length > 0;
        });
        if (!defExists) {
            const error = `Instantiation rejected: transformation definition '${highlander.transformationDefId}' does not exist in Constitutional Bloom. id=${nodeId ?? "unknown"}`;
            await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
            return { success: false, error };
        }
        // Pre-creation uniqueness query
        const existingInstances = await readTransaction(async (tx) => {
            const res = await tx.run(`MATCH (existing)-[:INSTANTIATES]->(def:Seed {id: $defId})
         WHERE (existing:Resonator OR existing:Bloom OR existing:Grid OR existing:Helix)
           AND existing.status IN ['active', 'planned']
         RETURN existing.id AS id, existing.name AS name`, { defId: highlander.transformationDefId });
            return res.records.map((r) => ({
                id: r.get("id"),
                name: r.get("name"),
            }));
        });
        if (existingInstances.length > 0) {
            const existing = existingInstances[0];
            if (highlander.a6Justification) {
                // Validate justification is one of the three valid values
                if (!VALID_A6_JUSTIFICATIONS.includes(highlander.a6Justification)) {
                    const error = `Instantiation rejected: invalid A6 justification '${highlander.a6Justification}'. Valid: ${VALID_A6_JUSTIFICATIONS.join(", ")}. id=${nodeId ?? "unknown"}`;
                    await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
                    return { success: false, error };
                }
                // Justified new instance — store justification, fall through to creation
                properties.a6Justification = highlander.a6Justification;
                properties.transformationDefId = highlander.transformationDefId;
            }
            else if (highlander.requestingContextId) {
                // Compose: wire FLOWS_TO to existing instance
                try {
                    const lineResult = await createLine(highlander.requestingContextId, existing.id, "FLOWS_TO", { label: "composed", composedAt: new Date().toISOString() });
                    return {
                        success: true,
                        composed: {
                            composed: true,
                            existingId: existing.id,
                            existingName: existing.name,
                            lineCreated: lineResult.success,
                            lineError: lineResult.success ? undefined : lineResult.error,
                        },
                    };
                }
                catch (err) {
                    return {
                        success: true,
                        composed: {
                            composed: true,
                            existingId: existing.id,
                            existingName: existing.name,
                            lineCreated: false,
                            lineError: err instanceof Error ? err.message : String(err),
                        },
                    };
                }
            }
            else {
                // Neither justification nor context → hard reject + Violation Seed
                const violationContent = `${morphemeType} creation for '${properties.name ?? nodeId}' rejected. Active instance '${existing.id}' already INSTANTIATES definition '${highlander.transformationDefId}'. Provide A6 justification (distinct_learned_state, distinct_governance_scope, distinct_temporal_scale) or requestingContextId for composition.`;
                // Bootstrap Violation Grid if needed, then record violation
                try {
                    await ensureViolationGrid();
                    const violationId = `violation:a6:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    await writeTransaction(async (tx) => {
                        await tx.run(`MATCH (g:Grid {id: 'grid:violation:ecosystem'})
               CREATE (v:Seed {
                 id: $violationId,
                 seedType: 'violation',
                 name: $name,
                 content: $content,
                 status: 'active',
                 severity: 'error',
                 transformationDefId: $defId,
                 existingInstanceId: $existingId,
                 attemptedNodeId: $attemptedId,
                 createdAt: datetime()
               })
               WITH g, v
               MERGE (g)-[:CONTAINS]->(v)`, {
                            violationId,
                            name: `A6 Violation: Unjustified duplication of ${existing.name}`,
                            content: violationContent,
                            defId: highlander.transformationDefId,
                            existingId: existing.id,
                            attemptedId: nodeId ?? "unknown",
                        });
                    });
                }
                catch {
                    // Violation recording is non-fatal
                }
                const error = `Instantiation rejected: Active instance '${existing.id}' already INSTANTIATES '${highlander.transformationDefId}'. Provide a6Justification or requestingContextId. id=${nodeId ?? "unknown"}`;
                await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
                return { success: false, error };
            }
        }
        else {
            // First instance — store transformationDefId, fall through to creation
            properties.transformationDefId = highlander.transformationDefId;
        }
    }
    // ── Steps 3-5: Create node + CONTAINS + INSTANTIATES (atomic) ──
    const label = LABEL_MAP[morphemeType];
    const definitionId = DEFINITION_MAP[morphemeType];
    try {
        await writeTransaction(async (tx) => {
            // Build SET clause from properties
            const propEntries = Object.entries(properties).filter(([, v]) => v !== undefined);
            const setCreateParts = [];
            const setMatchParts = [];
            const params = {
                nodeId: nodeId,
                parentId,
                definitionId,
            };
            for (const [key, value] of propEntries) {
                const paramKey = `prop_${key}`;
                params[paramKey] = value;
                if (key === "id")
                    continue; // id is in MERGE clause
                setCreateParts.push(`n.${key} = $${paramKey}`);
                setMatchParts.push(`n.${key} = $${paramKey}`);
            }
            setCreateParts.push("n.createdAt = datetime()");
            setMatchParts.push("n.updatedAt = datetime()");
            // Create/merge the node
            await tx.run(`MERGE (n:${label} {id: $nodeId})
         ON CREATE SET ${setCreateParts.join(", ")}
         ON MATCH SET ${setMatchParts.join(", ")}`, params);
            // Wire CONTAINS: parent→child (G3)
            await tx.run(`MATCH (p {id: $parentId}), (n:${label} {id: $nodeId})
         MERGE (p)-[:CONTAINS]->(n)`, { parentId, nodeId });
            // Wire INSTANTIATES: instance→type-level definition
            await tx.run(`MATCH (n:${label} {id: $nodeId}), (def:Seed {id: $definitionId})
         MERGE (n)-[:INSTANTIATES]->(def)`, { nodeId, definitionId });
            // Wire INSTANTIATES: instance→transformation-level definition (Highlander)
            if (highlander?.transformationDefId) {
                await tx.run(`MATCH (n:${label} {id: $nodeId}), (tdef:Seed {id: $tdefId})
           MERGE (n)-[:INSTANTIATES]->(tdef)`, { nodeId, tdefId: highlander.transformationDefId });
            }
            // Wire secondary label for seed sub-types (Option B multi-label retyping)
            if (morphemeType === "seed" && options?.subType) {
                await tx.run(`MATCH (n:Seed {id: $nodeId}) SET n:${options.subType}`, { nodeId });
            }
        });
        // ── Step 7: Record observation ──
        await recordInstantiationObservation(morphemeType, nodeId, parentId, true);
        // ── Step 8: Gnosis Compliance Evaluation (structural cognition, non-fatal) ──
        let evaluationResult;
        try {
            if (await isInEvaluationScope(parentId, nodeId)) {
                const { evaluate } = await import("../patterns/cognitive/evaluation.js");
                evaluationResult = await evaluate(nodeId, "inline_instantiation");
            }
        }
        catch {
            // Evaluation is non-fatal — Gnosis may not be bootstrapped yet
        }
        return { success: true, nodeId: nodeId, evaluationResult };
    }
    catch (err) {
        const error = `Instantiation failed: ${err instanceof Error ? err.message : String(err)}`;
        await recordInstantiationObservation(morphemeType, nodeId ?? "unknown", parentId, false, error);
        return { success: false, error };
    }
}
// ─── Mutation Resonator ─────────────────────────────────────────────
/**
 * Update a morpheme's properties via the Mutation Resonator.
 *
 * Preserves required properties, prevents orphaning, maintains provenance.
 * Cannot change morpheme type (INSTANTIATES is preserved).
 *
 * @param nodeId - ID of the morpheme to update
 * @param updates - Properties to update (cannot remove required properties)
 * @param newParentId - Optional: reparent the morpheme (new CONTAINS before old removed)
 */
export async function updateMorpheme(nodeId, updates, newParentId, addLabels) {
    // ── Step 1: Existence check ──
    const nodeInfo = await getNodeInfo(nodeId);
    if (!nodeInfo) {
        const error = `Mutation rejected: node '${nodeId}' does not exist.`;
        await recordMutationObservation(nodeId, false, error);
        return { success: false, error };
    }
    const morphemeType = nodeInfo.morphemeType;
    // ── Step 2: Property preservation check ──
    const required = REQUIRED_PROPERTIES[morphemeType];
    for (const prop of required) {
        if (prop in updates) {
            const val = updates[prop];
            if (val === null || val === undefined || val === "") {
                const error = `Mutation rejected: cannot remove required property '${prop}' from ${morphemeType} '${nodeId}'.`;
                await recordMutationObservation(nodeId, false, error);
                return { success: false, error };
            }
        }
    }
    // Content-specific check
    if ("content" in updates) {
        const content = updates.content;
        if (!content || content.trim() === "") {
            const error = `Mutation rejected: cannot set empty content on ${morphemeType} '${nodeId}'. Every morpheme carries meaning (A1).`;
            await recordMutationObservation(nodeId, false, error);
            return { success: false, error };
        }
    }
    // ── Step 2.5: Retirement guard (Resonator/Bloom only) ──
    if ((morphemeType === "resonator" || morphemeType === "bloom") &&
        (updates.status === "retired" || updates.status === "archived")) {
        const consumers = await readTransaction(async (tx) => {
            const res = await tx.run(`MATCH (n {id: $nodeId})-[:FLOWS_TO]->(consumer)
         WHERE consumer.status IN ['active', 'planned']
         RETURN consumer.id AS id, consumer.name AS name`, { nodeId });
            return res.records.map((r) => ({
                id: r.get("id"),
                name: r.get("name"),
            }));
        });
        if (consumers.length > 0) {
            const consumerList = consumers.map((c) => c.id).join(", ");
            const error = `Mutation rejected: cannot retire '${nodeId}' — ${consumers.length} active consumer(s) still wired via FLOWS_TO: ${consumerList}. Remove consumer Lines first (scope reduction, not deletion).`;
            await recordMutationObservation(nodeId, false, error);
            return { success: false, error };
        }
    }
    // ── Step 2.7: Label allowlist validation (M-10.1 §7) ──
    if (addLabels && addLabels.length > 0) {
        const invalid = addLabels.filter(l => !VALID_ADD_LABELS.includes(l));
        if (invalid.length > 0) {
            const error = `Mutation rejected: label(s) ${invalid.join(", ")} not in allowlist [${VALID_ADD_LABELS.join(", ")}].`;
            await recordMutationObservation(nodeId, false, error);
            return { success: false, error };
        }
    }
    // ── Step 3: Relationship preservation check ──
    if (newParentId) {
        // Verify new parent exists and can contain this type
        const newParentType = await getNodeMorphemeType(newParentId);
        if (!newParentType) {
            const error = `Mutation rejected: new parent '${newParentId}' does not exist.`;
            await recordMutationObservation(nodeId, false, error);
            return { success: false, error };
        }
        const allowedChildren = VALID_CONTAINERS[newParentType];
        if (!allowedChildren || !allowedChildren.includes(morphemeType)) {
            const error = `Mutation rejected: '${newParentType}' cannot contain '${morphemeType}'.`;
            await recordMutationObservation(nodeId, false, error);
            return { success: false, error };
        }
    }
    try {
        const label = LABEL_MAP[morphemeType];
        await writeTransaction(async (tx) => {
            // ── Step 3 cont'd: Reparent if requested ──
            if (newParentId) {
                // Wire new CONTAINS first (never orphan, even transiently)
                await tx.run(`MATCH (p {id: $newParentId}), (n:${label} {id: $nodeId})
           MERGE (p)-[:CONTAINS]->(n)`, { newParentId, nodeId });
                // Remove old CONTAINS
                await tx.run(`MATCH (oldParent)-[r:CONTAINS]->(n:${label} {id: $nodeId})
           WHERE oldParent.id <> $newParentId
           DELETE r`, { nodeId, newParentId });
            }
            // ── Step 4: Apply update ──
            const propEntries = Object.entries(updates).filter(([k, v]) => v !== undefined && k !== "id");
            if (propEntries.length > 0) {
                const setClauses = [];
                const params = { nodeId };
                for (const [key, value] of propEntries) {
                    const paramKey = `upd_${key}`;
                    params[paramKey] = value;
                    setClauses.push(`n.${key} = $${paramKey}`);
                }
                setClauses.push("n.updatedAt = datetime()");
                await tx.run(`MATCH (n:${label} {id: $nodeId}) SET ${setClauses.join(", ")}`, params);
            }
            // ── Step 4.5: Apply labels (M-10.1 §7) ──
            if (addLabels && addLabels.length > 0) {
                const labelClause = addLabels.map(l => `n:${l}`).join(", ");
                await tx.run(`MATCH (n:${label} {id: $nodeId}) SET ${labelClause}`, { nodeId });
            }
            // ── Step 5: Propagate parent status ──
            await tx.run(`MATCH (parent)-[:CONTAINS]->(n:${label} {id: $nodeId})
         WHERE parent:Bloom
         WITH parent
         MATCH (parent)-[:CONTAINS]->(child)
         WHERE child:Bloom OR child:Seed
         WITH parent,
              count(child) AS total,
              count(CASE WHEN child.status = 'complete' THEN 1 END) AS done
         SET parent.status = CASE
               WHEN done = total THEN 'complete'
               WHEN done > 0 THEN 'active'
               ELSE parent.status END,
             parent.phiL = CASE
               WHEN total > 0 THEN toFloat(done) / toFloat(total)
               ELSE parent.phiL END,
             parent.updatedAt = datetime()`, { nodeId });
        });
        // ── Step 6: Read-back verification ──
        const verified = await readTransaction(async (tx) => {
            const res = await tx.run(`MATCH (n {id: $nodeId}) RETURN properties(n) AS props, labels(n) AS nodeLabels`, { nodeId });
            if (res.records.length === 0)
                return undefined;
            return {
                props: res.records[0].get("props"),
                nodeLabels: res.records[0].get("nodeLabels"),
            };
        });
        if (!verified) {
            const error = `Mutation verification failed: node '${nodeId}' not found after write.`;
            await recordMutationObservation(nodeId, false, error);
            return { success: false, error };
        }
        // Check that every update actually landed
        const mismatches = [];
        for (const [key, expectedValue] of Object.entries(updates)) {
            if (key === "id")
                continue;
            const actualValue = verified.props[key];
            // Compare with type coercion for numeric values (Neo4j may return Integer objects)
            if (String(actualValue) !== String(expectedValue)) {
                mismatches.push(`${key}: expected '${expectedValue}', got '${actualValue}'`);
            }
        }
        // Verify labels were applied
        if (addLabels && addLabels.length > 0) {
            const missingLabels = addLabels.filter(l => !verified.nodeLabels.includes(l));
            if (missingLabels.length > 0) {
                mismatches.push(`labels missing: ${missingLabels.join(", ")}`);
            }
        }
        if (mismatches.length > 0) {
            const error = `Mutation verification failed: properties did not persist on '${nodeId}': ${mismatches.join("; ")}`;
            await recordMutationObservation(nodeId, false, error);
            return { success: false, error };
        }
        // M-22.6: Invalidate conductivity cache on connected Lines
        try {
            await invalidateLineConductivity(nodeId);
        }
        catch {
            // Conductivity invalidation is non-fatal
        }
        await recordMutationObservation(nodeId, true);
        // ── Step 6.5: Gnosis Compliance Evaluation (structural cognition, non-fatal) ──
        let evaluationResult;
        try {
            if (await isInEvaluationScope(nodeId, nodeId)) {
                const { evaluate } = await import("../patterns/cognitive/evaluation.js");
                evaluationResult = await evaluate(nodeId, "inline_mutation");
            }
        }
        catch {
            // Evaluation is non-fatal
        }
        return { success: true, verified: true, nodeId, evaluationResult };
    }
    catch (err) {
        const error = `Mutation failed: ${err instanceof Error ? err.message : String(err)}`;
        await recordMutationObservation(nodeId, false, error);
        return { success: false, error };
    }
}
// ─── Line Creation Resonator ────────────────────────────────────────
/**
 * Create a Line (relationship) via the Line Creation Resonator.
 *
 * Validates endpoint existence, morpheme hygiene, grammatical shape,
 * and direction rules.
 *
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @param lineType - Relationship type (e.g., CONTAINS, FLOWS_TO, DEPENDS_ON)
 * @param properties - Optional properties for the relationship
 */
export async function createLine(sourceId, targetId, lineType, properties) {
    // ── Step 1: Endpoint existence check ──
    const sourceExists = await nodeExists(sourceId);
    if (!sourceExists) {
        const error = `Line creation rejected: source '${sourceId}' does not exist.`;
        await recordLineObservation(sourceId, targetId, lineType, false, error);
        return { success: false, error };
    }
    const targetExists = await nodeExists(targetId);
    if (!targetExists) {
        const error = `Line creation rejected: target '${targetId}' does not exist.`;
        await recordLineObservation(sourceId, targetId, lineType, false, error);
        return { success: false, error };
    }
    // ── Steps 2-3: Morpheme hygiene + grammatical shape ──
    // Validate the line type is recognized
    if (!VALID_LINE_TYPES.includes(lineType)) {
        const error = `Line creation rejected: unknown line type '${lineType}'.`;
        await recordLineObservation(sourceId, targetId, lineType, false, error);
        return { success: false, error };
    }
    // CONTAINS: verify source can contain target's type
    if (lineType === "CONTAINS") {
        const sourceType = await getNodeMorphemeType(sourceId);
        const targetType = await getNodeMorphemeType(targetId);
        if (sourceType && targetType) {
            const allowed = VALID_CONTAINERS[sourceType];
            if (!allowed || !allowed.includes(targetType)) {
                const error = `Line creation rejected: '${sourceType}' cannot CONTAIN '${targetType}'.`;
                await recordLineObservation(sourceId, targetId, lineType, false, error);
                return { success: false, error };
            }
        }
    }
    // ── Steps 5-6: Create the Line ──
    try {
        await writeTransaction(async (tx) => {
            const propParts = ["r.createdAt = datetime()"];
            const params = { sourceId, targetId };
            if (properties) {
                for (const [key, value] of Object.entries(properties)) {
                    if (value !== undefined) {
                        const paramKey = `lp_${key}`;
                        params[paramKey] = value;
                        propParts.push(`r.${key} = $${paramKey}`);
                    }
                }
            }
            await tx.run(`MATCH (s {id: $sourceId}), (t {id: $targetId})
         MERGE (s)-[r:${lineType}]->(t)
         ON CREATE SET ${propParts.join(", ")}`, params);
        });
        // M-22.6: Evaluate conductivity on new Lines
        try {
            await evaluateAndCacheLineConductivity(sourceId, targetId, lineType);
        }
        catch {
            // Conductivity evaluation is non-fatal
        }
        await recordLineObservation(sourceId, targetId, lineType, true);
        return { success: true, sourceId, targetId, lineType };
    }
    catch (err) {
        const error = `Line creation failed: ${err instanceof Error ? err.message : String(err)}`;
        await recordLineObservation(sourceId, targetId, lineType, false, error);
        return { success: false, error };
    }
}
/**
 * Delete a Line (relationship) via the Mutation Resonator.
 *
 * Mirrors createLine() pattern: validate → delete → invalidate cache → record observation.
 *
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @param lineType - Relationship type to delete
 */
export async function deleteLine(sourceId, targetId, lineType) {
    // ── Step 1: Validate line type ──
    if (!VALID_LINE_TYPES.includes(lineType)) {
        const error = `Line deletion rejected: unknown line type '${lineType}'.`;
        await recordLineObservation(sourceId, targetId, lineType, false, error);
        return { success: false, error };
    }
    // ── Step 2: Verify the relationship exists ──
    const exists = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (s {id: $sourceId})-[r:${lineType}]->(t {id: $targetId})
       RETURN type(r) AS rType`, { sourceId, targetId });
        return res.records.length > 0;
    });
    if (!exists) {
        const error = `Line deletion rejected: no ${lineType} relationship from '${sourceId}' to '${targetId}'.`;
        await recordLineObservation(sourceId, targetId, lineType, false, error);
        return { success: false, error };
    }
    // ── Step 3: Delete the relationship ──
    try {
        await writeTransaction(async (tx) => {
            await tx.run(`MATCH (s {id: $sourceId})-[r:${lineType}]->(t {id: $targetId})
         DELETE r`, { sourceId, targetId });
        });
        // ── Step 4: Invalidate conductivity cache (M-22.6) ──
        if (lineType === "FLOWS_TO") {
            try {
                await invalidateLineConductivity(sourceId);
                await invalidateLineConductivity(targetId);
            }
            catch {
                // Non-fatal
            }
        }
        // ── Step 5: Record observation ──
        await recordLineObservation(sourceId, targetId, `DELETE:${lineType}`, true);
        return { success: true, sourceId, targetId, lineType };
    }
    catch (err) {
        const error = `Line deletion failed: ${err instanceof Error ? err.message : String(err)}`;
        await recordLineObservation(sourceId, targetId, `DELETE:${lineType}`, false, error);
        return { success: false, error };
    }
}
/**
 * Classify a Bloom's stamp behaviour.
 * Priority: type property > ID-pattern heuristic.
 */
function classifyBloomType(id, typeProperty) {
    // Check type property first
    if (typeProperty) {
        const t = typeProperty.toLowerCase();
        if (t === "milestone" || t === "sub-milestone")
            return "milestone";
        if (t === "definitional")
            return "definitional";
        if (t === "analytical")
            return "analytical";
        if (t === "pipeline")
            return "pipeline";
    }
    // Fall back to ID heuristics
    if (id.startsWith("M-"))
        return "milestone";
    if (id === "constitutional-bloom")
        return "definitional";
    if (id.startsWith("fsm:"))
        return "analytical";
    // Timestamp pattern (e.g., 2026-03-17T19-15-16)
    if (/^\d{4}-\d{2}-\d{2}T/.test(id))
        return "pipeline";
    return "milestone"; // default
}
/**
 * Stamp a Bloom as complete with structural enforcement.
 *
 * Enforces the three-step stamp protocol from CLAUDE.md:
 * 1. Exit criteria must be complete (or force-stamped)
 * 2. phiL derives from relevant children only (child Blooms + exit-criterion Seeds)
 * 3. Parent status recalculates from children
 *
 * After the stamp, inline state dimension recomputation:
 * - ΦL propagates upward through CONTAINS hierarchy
 * - ΨH recomputes on the stamped Bloom and its parent
 * - εR recomputes for pipeline/pattern Blooms
 * - Event triggers checked
 *
 * All recomputation is NON-FATAL — failures produce warnings, not errors.
 *
 * @see CLAUDE.md §Bloom Stamp Protocol
 */
export async function stampBloomComplete(options) {
    const { bloomId, commitSha, testCount, force = false } = options;
    const warnings = [];
    // ── Step 1: Bloom existence and type check ──
    const bloomResult = await runQuery(`MATCH (b:Bloom {id: $bloomId})
     RETURN b.id AS id, b.status AS status, b.type AS type, b.phiL AS phiL`, { bloomId }, "READ");
    if (bloomResult.records.length === 0) {
        return { success: false, bloomId, warnings: [], error: `Bloom '${bloomId}' does not exist.` };
    }
    const currentStatus = bloomResult.records[0].get("status");
    const typeProperty = bloomResult.records[0].get("type");
    const previousPhiL = bloomResult.records[0].get("phiL") ?? 0.3;
    // Idempotent: already complete → return success with warning
    if (currentStatus === "complete") {
        warnings.push(`Bloom '${bloomId}' is already complete — no-op.`);
        return { success: true, bloomId, derivedPhiL: previousPhiL, warnings };
    }
    // ── Step 2: Bloom type classification ──
    const bloomType = classifyBloomType(bloomId, typeProperty);
    // For non-milestone types, skip Steps 3-4, stamp directly
    if (bloomType !== "milestone") {
        const updates = {
            status: "complete",
            completedAt: new Date().toISOString(),
        };
        if (commitSha)
            updates.commitSha = commitSha;
        if (testCount !== undefined)
            updates.testCount = testCount;
        const mutResult = await updateMorpheme(bloomId, updates);
        if (!mutResult.success) {
            return { success: false, bloomId, warnings, error: mutResult.error };
        }
        // Non-milestone types keep their existing phiL (not derived from children)
        return { success: true, verified: mutResult.verified, bloomId, derivedPhiL: previousPhiL, warnings };
    }
    // ── Step 3: Exit criteria pre-flight check (milestone only) ──
    const ecResult = await runQuery(`MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(ec:Seed)
     WHERE ec.seedType = 'exit-criterion' AND ec.status <> 'complete'
     RETURN ec.id AS ecId, ec.status AS status, ec.content AS content`, { bloomId }, "READ");
    if (ecResult.records.length > 0) {
        if (!force) {
            const ecList = ecResult.records.map((r) => `  ${r.get("ecId")} [${r.get("status")}] — ${String(r.get("content") || "").substring(0, 70)}`);
            return {
                success: false,
                bloomId,
                warnings,
                error: `Cannot stamp '${bloomId}' complete — ${ecResult.records.length} exit criteria are not complete:\n${ecList.join("\n")}\nUse force=true to override.`,
            };
        }
        // Force: stamp each non-complete exit criterion
        for (const rec of ecResult.records) {
            const ecId = rec.get("ecId");
            const mr = await updateMorpheme(ecId, { status: "complete" });
            if (mr.success) {
                warnings.push(`Force-stamped exit criterion: ${ecId}`);
            }
            else {
                warnings.push(`Failed to force-stamp ${ecId}: ${mr.error}`);
            }
        }
    }
    // ── Step 4: Backlog scope check ──
    const backlogResult = await runQuery(`MATCH (s:Seed)-[:SCOPED_TO]->(b:Bloom {id: $bloomId})
     WHERE s.id STARTS WITH 'R-' AND s.status = 'planned'
     RETURN s.id AS seedId, s.name AS name`, { bloomId }, "READ");
    if (backlogResult.records.length > 0) {
        for (const r of backlogResult.records) {
            warnings.push(`Planned backlog item still scoped: ${r.get("seedId")} — ${r.get("name")}`);
        }
    }
    // ── Step 5: INSTANTIATES check + backfill ──
    const instantiatesResult = await runQuery(`MATCH (b:Bloom {id: $bloomId})
     OPTIONAL MATCH (b)-[:CONTAINS]->(child)
     WITH b, collect(child) AS children
     WITH [b] + children AS nodes
     UNWIND nodes AS node
     WITH node
     WHERE NOT EXISTS { MATCH (node)-[:INSTANTIATES]->() }
     RETURN node.id AS nodeId, labels(node) AS nodeLabels`, { bloomId }, "READ");
    for (const r of instantiatesResult.records) {
        const nodeId = r.get("nodeId");
        const labels = r.get("nodeLabels");
        // Determine morpheme type from labels
        let mType = null;
        for (const label of labels) {
            const lower = label.toLowerCase();
            if (lower in LABEL_MAP) {
                mType = lower;
                break;
            }
        }
        if (mType) {
            const defId = DEFINITION_MAP[mType];
            try {
                await createLine(nodeId, defId, "INSTANTIATES");
                warnings.push(`Backfilled INSTANTIATES: ${nodeId} → ${defId}`);
            }
            catch {
                warnings.push(`Failed to backfill INSTANTIATES for ${nodeId}`);
            }
        }
    }
    // ── Step 6: Derive phiL from RELEVANT children ──
    const derivationResult = await runQuery(`MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(child)
     WHERE child:Bloom OR (child:Seed AND child.seedType = 'exit-criterion')
     WITH count(child) AS total,
          count(CASE WHEN child.status = 'complete' THEN 1 END) AS done
     RETURN total, done, CASE WHEN total > 0 THEN toFloat(done) / toFloat(total) ELSE 1.0 END AS derivedPhiL`, { bloomId }, "READ");
    const derivedPhiL = derivationResult.records[0]?.get("derivedPhiL") ?? 1.0;
    // ── Step 7: Stamp the Bloom via updateMorpheme() ──
    const updates = {
        status: "complete",
        phiL: derivedPhiL,
        completedAt: new Date().toISOString(),
    };
    if (commitSha)
        updates.commitSha = commitSha;
    if (testCount !== undefined)
        updates.testCount = testCount;
    const mutResult = await updateMorpheme(bloomId, updates);
    if (!mutResult.success) {
        return { success: false, bloomId, warnings, error: mutResult.error };
    }
    // ── Step 8: Inline state dimension recomputation (all NON-FATAL) ──
    // Step 8a: ΦL propagation upward
    try {
        await propagatePhiLUpward(bloomId, previousPhiL, derivedPhiL);
    }
    catch (e) {
        warnings.push(`ΦL propagation failed: ${e instanceof Error ? e.message : e} — stamp succeeded but parent ΦL may be stale`);
    }
    // Step 8b: ΨH recomputation on the stamped Bloom
    let selfPsiH = null;
    try {
        const psiH = await computeAndPersistPsiH(bloomId);
        if (psiH) {
            selfPsiH = { combined: psiH.combined, lambda2: psiH.lambda2, friction: psiH.friction };
        }
    }
    catch (e) {
        warnings.push(`ΨH recomputation on ${bloomId} failed: ${e instanceof Error ? e.message : e}`);
    }
    // Step 8c: ΨH recomputation on the PARENT Bloom
    let parentPsiH = null;
    try {
        const parent = await getParentBloom(bloomId);
        if (parent) {
            const psiH = await computeAndPersistPsiH(parent.id);
            if (psiH) {
                parentPsiH = { combined: psiH.combined, lambda2: psiH.lambda2, friction: psiH.friction };
            }
        }
    }
    catch (e) {
        warnings.push(`ΨH recomputation on parent failed: ${e instanceof Error ? e.message : e}`);
    }
    // Step 8d: εR recomputation skipped for milestone Blooms —
    // they don't have Thompson Decision history. Pipeline/pattern Blooms
    // would compute εR here, but those types exit early in Step 2.
    // Step 8e: Line conductivity — already handled by updateMorpheme() via M-22.6
    // Step 8f: Event trigger check
    try {
        await assembleTriggerState(bloomId);
    }
    catch {
        // Trigger check is non-fatal
    }
    // ── Step 9: Read-back verification (inlined to avoid circular import with bloom.ts) ──
    let verified = false;
    try {
        const vResult = await runQuery(`MATCH (b:Bloom {id: $bloomId}) RETURN b.status AS status, b.phiL AS phiL`, { bloomId }, "READ");
        const vStatus = vResult.records[0]?.get("status");
        const vPhiL = vResult.records[0]?.get("phiL");
        if (vStatus === "complete" && vPhiL !== null) {
            verified = true;
        }
        else {
            warnings.push(`Verification: status='${vStatus}', phiL=${vPhiL} — expected complete with derived phiL`);
        }
    }
    catch (e) {
        warnings.push(`Verification failed: ${e instanceof Error ? e.message : e}`);
    }
    return {
        success: true,
        verified,
        bloomId,
        derivedPhiL,
        psiH: selfPsiH,
        parentPsiH,
        warnings,
    };
}
// ─── Revert Utility ─────────────────────────────────────────────────
/**
 * Revert a complete Bloom back to active status.
 * Delegates to updateMorpheme() — Step 5 propagates upward.
 */
export async function revertBloomToActive(bloomId) {
    return updateMorpheme(bloomId, { status: "active" });
}
// ─── Helper functions ───────────────────────────────────────────────
/**
 * Determine a node's morpheme type from its Neo4j label.
 */
async function getNodeMorphemeType(nodeId) {
    const result = await readTransaction(async (tx) => {
        const res = await tx.run("MATCH (n {id: $nodeId}) RETURN labels(n) AS labels", { nodeId });
        return res.records[0]?.get("labels");
    });
    if (!result || result.length === 0)
        return null;
    // Map Neo4j labels to morpheme types
    for (const label of result) {
        const lower = label.toLowerCase();
        if (lower in LABEL_MAP)
            return lower;
    }
    return null;
}
/**
 * Get node info: morpheme type and label.
 */
async function getNodeInfo(nodeId) {
    const morphemeType = await getNodeMorphemeType(nodeId);
    if (!morphemeType)
        return null;
    return { morphemeType, label: LABEL_MAP[morphemeType] };
}
/**
 * Ensure the ecosystem-level Violation Grid exists in the Constitutional Bloom.
 * Bootstraps it if needed. Used by the Highlander Protocol to record A6 violations.
 */
async function ensureViolationGrid() {
    const exists = await nodeExists("grid:violation:ecosystem");
    if (!exists) {
        await writeTransaction(async (tx) => {
            await tx.run(`MERGE (g:Grid {id: 'grid:violation:ecosystem'})
         ON CREATE SET
           g.name = 'Ecosystem Violation Grid',
           g.type = 'violation',
           g.content = 'Receives Violation Seeds from Highlander Protocol enforcement and future Assayer evaluations.',
           g.status = 'active',
           g.createdAt = datetime()
         WITH g
         MATCH (cb:Bloom {id: 'constitutional-bloom'})
         MERGE (cb)-[:CONTAINS]->(g)`, {});
        });
    }
}
/**
 * Determine if a morpheme is in Gnosis Compliance Evaluation scope.
 *
 * Three checks in sequence (combined into a single Cypher query per check):
 * 1. Recursion boundary — never evaluate Gnosis's own children
 * 2. Constitutional Bloom exclusion — internal definition/observation Seeds
 * 3. Scope check — parent Bloom must have FLOWS_TO to resonator:compliance-evaluation
 *
 * @param contextId - The parent/context node ID (parentId for instantiation, nodeId for mutation)
 * @param targetId - The node to evaluate
 */
async function isInEvaluationScope(contextId, targetId) {
    try {
        return await readTransaction(async (tx) => {
            // 1. Recursion boundary — never evaluate Gnosis's own children
            const gnosisCheck = await tx.run(`OPTIONAL MATCH (gnosis:Bloom)-[:INSTANTIATES]->(def:Seed {id: 'def:bloom:cognitive'})
         WITH gnosis
         WHERE gnosis IS NOT NULL
         OPTIONAL MATCH (gnosis)-[:CONTAINS*1..5]->(child)
         WHERE child.id = $targetId
         RETURN count(child) > 0 AS isGnosisInternal`, { targetId });
            if (gnosisCheck.records[0]?.get("isGnosisInternal") === true)
                return false;
            // 2. Exclude Constitutional Bloom internals
            const cbCheck = await tx.run(`OPTIONAL MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS*1..5]->(child)
         WHERE child.id = $targetId
         RETURN count(child) > 0 AS isCbInternal`, { targetId });
            if (cbCheck.records[0]?.get("isCbInternal") === true)
                return false;
            // 3. Scope check — walk up from contextId to find parent Bloom with FLOWS_TO
            const scopeCheck = await tx.run(`OPTIONAL MATCH (parent:Bloom)-[:CONTAINS*1..5]->(cn {id: $contextId})
         WHERE (parent)-[:FLOWS_TO]->(:Resonator {id: 'resonator:compliance-evaluation'})
         RETURN count(parent) > 0 AS inScope`, { contextId });
            return scopeCheck.records[0]?.get("inScope") === true;
        });
    }
    catch {
        // If scope check fails (Gnosis not bootstrapped, etc.), default to not in scope
        return false;
    }
}
/**
 * Check if a node exists.
 */
async function nodeExists(nodeId) {
    const result = await readTransaction(async (tx) => {
        const res = await tx.run("MATCH (n {id: $nodeId}) RETURN count(n) AS cnt", { nodeId });
        const cnt = res.records[0]?.get("cnt");
        return typeof cnt === "object" && cnt !== null ? cnt.toNumber() : cnt;
    });
    return (result ?? 0) > 0;
}
// ─── Observation recording ──────────────────────────────────────────
/**
 * Record a creation event in the Instantiation Resonator's observation Grid.
 */
async function recordInstantiationObservation(morphemeType, nodeId, parentId, success, error) {
    try {
        const obsId = `obs:instantiation:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await writeTransaction(async (tx) => {
            await tx.run(`MERGE (g:Grid {id: 'grid:instantiation-observations'})
         CREATE (obs:Seed {
           id: $obsId,
           seedType: 'observation',
           name: $name,
           content: $content,
           status: 'recorded',
           morphemeType: $morphemeType,
           targetNodeId: $nodeId,
           parentId: $parentId,
           success: $success,
           error: $error,
           createdAt: datetime()
         })
         WITH g, obs
         MERGE (g)-[:CONTAINS]->(obs)`, {
                obsId,
                name: `${success ? "Created" : "Rejected"} ${morphemeType} ${nodeId}`,
                content: success
                    ? `Successfully created ${morphemeType} '${nodeId}' in parent '${parentId}'.`
                    : `Rejected ${morphemeType} '${nodeId}': ${error}`,
                morphemeType,
                nodeId,
                parentId,
                success,
                error: error ?? null,
            });
        });
    }
    catch {
        // Observation recording is non-fatal
    }
}
/**
 * Record a mutation event in the Mutation Resonator's observation Grid.
 */
async function recordMutationObservation(nodeId, success, error) {
    try {
        const obsId = `obs:mutation:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await writeTransaction(async (tx) => {
            await tx.run(`MERGE (g:Grid {id: 'grid:mutation-observations'})
         CREATE (obs:Seed {
           id: $obsId,
           seedType: 'observation',
           name: $name,
           content: $content,
           status: 'recorded',
           targetNodeId: $nodeId,
           success: $success,
           error: $error,
           createdAt: datetime()
         })
         WITH g, obs
         MERGE (g)-[:CONTAINS]->(obs)`, {
                obsId,
                name: `${success ? "Updated" : "Rejected update"} ${nodeId}`,
                content: success
                    ? `Successfully updated '${nodeId}'.`
                    : `Rejected update to '${nodeId}': ${error}`,
                nodeId,
                success,
                error: error ?? null,
            });
        });
    }
    catch {
        // Observation recording is non-fatal
    }
}
/**
 * Record a line creation event in the Line Creation Resonator's observation Grid.
 */
async function recordLineObservation(sourceId, targetId, lineType, success, error) {
    try {
        const obsId = `obs:line:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await writeTransaction(async (tx) => {
            await tx.run(`MERGE (g:Grid {id: 'grid:line-creation-observations'})
         CREATE (obs:Seed {
           id: $obsId,
           seedType: 'observation',
           name: $name,
           content: $content,
           status: 'recorded',
           sourceId: $sourceId,
           targetId: $targetId,
           lineType: $lineType,
           success: $success,
           error: $error,
           createdAt: datetime()
         })
         WITH g, obs
         MERGE (g)-[:CONTAINS]->(obs)`, {
                obsId,
                name: `${success ? "Created" : "Rejected"} ${lineType} ${sourceId}→${targetId}`,
                content: success
                    ? `Successfully created ${lineType} from '${sourceId}' to '${targetId}'.`
                    : `Rejected ${lineType} from '${sourceId}' to '${targetId}': ${error}`,
                sourceId,
                targetId,
                lineType,
                success,
                error: error ?? null,
            });
        });
    }
    catch {
        // Observation recording is non-fatal
    }
}
// ─── Definition Retirement ──────────────────────────────────────
/**
 * Retire a constitutional definition that has been superseded.
 *
 * Lifecycle operation like stampBloomComplete() — enforces invariants
 * structurally so absorption/supersession can't be forgotten.
 *
 * 1. Validates definition Seed exists and is 'active'
 * 2. Validates superseding morpheme exists
 * 3. Sets status: 'retired' via updateMorpheme()
 * 4. Creates SUPERSEDED_BY Line from retired def to absorbing morpheme
 * 5. Returns any active instances still pointing at this definition
 */
export async function retireDefinition(defId, supersededById, reason) {
    const defNode = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (d:Seed {id: $defId})
       WHERE d.seedType IN ['transformation-definition', 'bloom-definition',
                             'grid-definition', 'helix-definition']
       RETURN d.status AS status`, { defId });
        return res.records[0] ?? null;
    });
    if (!defNode) {
        throw new Error(`retireDefinition: definition '${defId}' not found`);
    }
    if (defNode.get("status") !== "active") {
        throw new Error(`retireDefinition: definition '${defId}' is not active (status: ${defNode.get("status")})`);
    }
    const superseder = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (n {id: $supersededById}) RETURN n.id AS id`, { supersededById });
        return res.records[0] ?? null;
    });
    if (!superseder) {
        throw new Error(`retireDefinition: superseding morpheme '${supersededById}' not found`);
    }
    await updateMorpheme(defId, {
        status: "retired",
        retiredReason: reason,
        retiredAt: new Date().toISOString(),
        supersededBy: supersededById,
    });
    await createLine(defId, supersededById, "SUPERSEDED_BY", {
        label: "definition-retirement",
        reason,
    });
    const orphans = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (n)-[:INSTANTIATES]->(d:Seed {id: $defId})
       WHERE n.status IN ['active', 'planned']
       RETURN n.id AS id`, { defId });
        return res.records.map((r) => r.get("id"));
    });
    return { retired: true, orphanedInstances: orphans };
}
//# sourceMappingURL=instantiation.js.map