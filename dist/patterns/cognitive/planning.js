// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Gnosis Planning Cycle — ecosystem-wide structural prioritisation.
 *
 * Reads: topology (multi-Bloom survey), violations, milestones, constitutional gaps.
 * Produces: PlanningReport with ranked, categorised intents.
 *
 * All prioritisation is structural — no LLM. Priority derives from:
 * 1. Violation severity (critical > error > warning)
 * 2. Constitutional gap (mandatory > advisory)
 * 3. λ₂ improvement potential
 * 4. ΦL uplift (lowest ΦL = highest priority)
 * 5. Dependency unblocking (intents that unblock other intents score higher)
 *
 * @module codex-signum-core/patterns/cognitive/planning
 */
import { readTransaction } from "../../graph/client.js";
import { surveyBloomTopology } from "./structural-survey.js";
import { queryTransformationDefinitions, computeConstitutionalDelta } from "./constitutional-delta.js";
import { instantiateMorpheme, updateMorpheme } from "../../graph/instantiation.js";
import { getMemoryContextForBloom, formatMemoryContextForSurvey } from "../../graph/queries/memory-context.js";
import { BOCPDDetector } from "../../signals/BOCPDDetector.js";
// ─── Step 1: Ecosystem Survey ─────────────────────────────────────
async function surveyEcosystem() {
    return readTransaction(async (tx) => {
        const bloomResult = await tx.run(`MATCH (b:Bloom)
       WHERE b.status IN ['active', 'planned']
       OPTIONAL MATCH (b)-[:CONTAINS]->(child)
       WITH b, count(child) AS childCount
       RETURN b.id AS id, b.name AS name,
              coalesce(b.phiL, 0.0) AS phiL,
              coalesce(b.psiH, 0.0) AS psiH,
              coalesce(b.lambda2, 0.0) AS lambda2,
              b.status AS status,
              childCount
       ORDER BY phiL ASC`);
        const bloomStates = bloomResult.records.map((r) => ({
            id: r.get("id"),
            name: r.get("name") ?? r.get("id"),
            phiL: asNumber(r.get("phiL")),
            psiH: asNumber(r.get("psiH")),
            lambda2: asNumber(r.get("lambda2")),
            status: r.get("status") ?? "active",
            childCount: asNumber(r.get("childCount")),
        }));
        const countsResult = await tx.run(`MATCH (n)
       WHERE n:Resonator OR n:Grid OR n:Helix
       RETURN
         count(CASE WHEN n:Resonator THEN 1 END) AS resonators,
         count(CASE WHEN n:Grid THEN 1 END) AS grids,
         count(CASE WHEN n:Helix THEN 1 END) AS helixes`);
        const countsRec = countsResult.records[0];
        return {
            bloomStates,
            totalResonators: countsRec ? asNumber(countsRec.get("resonators")) : 0,
            totalGrids: countsRec ? asNumber(countsRec.get("grids")) : 0,
            totalHelixes: countsRec ? asNumber(countsRec.get("helixes")) : 0,
        };
    });
}
// ─── Step 2: Read Violations ──────────────────────────────────────
async function readViolations() {
    try {
        const violations = await readTransaction(async (tx) => {
            // Handles both CE violations (checkId, targetNodeId) and
            // A6 Highlander violations (transformationDefId, attemptedNodeId)
            const result = await tx.run(`MATCH (g:Grid {id: 'grid:violation:ecosystem'})-[:CONTAINS]->(v:Seed)
         WHERE v.status = 'active'
         RETURN v.id AS id,
                coalesce(v.checkId, CASE WHEN v.id STARTS WITH 'violation:a6:' THEN 'A6' ELSE 'unknown' END) AS checkId,
                coalesce(v.targetNodeId, v.attemptedNodeId, 'unknown') AS targetNodeId,
                v.severity AS severity,
                coalesce(v.evidence, v.content, '') AS evidence,
                v.createdAt AS createdAt
         ORDER BY
           CASE v.severity WHEN 'critical' THEN 0 WHEN 'error' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
           v.createdAt DESC`);
            return result.records.map((r) => ({
                id: r.get("id"),
                checkId: r.get("checkId") ?? "unknown",
                targetNodeId: r.get("targetNodeId") ?? "unknown",
                severity: r.get("severity") ?? "warning",
                evidence: r.get("evidence") ?? "",
            }));
        });
        const bySeverity = {
            critical: violations.filter((v) => v.severity === "critical").length,
            error: violations.filter((v) => v.severity === "error").length,
            warning: violations.filter((v) => v.severity === "warning").length,
        };
        return { total: violations.length, bySeverity, top: violations };
    }
    catch {
        // Violation Grid may not exist yet — non-fatal
        return { total: 0, bySeverity: { critical: 0, error: 0, warning: 0 }, top: [] };
    }
}
// ─── Step 2.5a: Read LLM Memory State (Stream 2) ────────────────
async function readLLMMemoryState() {
    try {
        const llmBlooms = await readTransaction(async (tx) => {
            const result = await tx.run(`MATCH (b:Bloom) WHERE b.id STARTS WITH 'llm:' AND b.status = 'active'
         RETURN b.id AS id ORDER BY b.id`);
            return result.records.map((r) => r.get("id"));
        });
        const contexts = [];
        for (const bloomId of llmBlooms) {
            try {
                const ctx = await getMemoryContextForBloom(bloomId);
                if (ctx)
                    contexts.push(ctx);
            }
            catch { /* non-fatal */ }
        }
        // Infrastructure failures = cold start + recent failures (stale endpoints, not dead models)
        const infrastructureFailures = contexts
            .filter((c) => c.isColdStart && c.recentFailures.length > 0)
            .map((c) => c.bloomId);
        const driftingModels = contexts
            .filter((c) => c.bocpd?.currentRunLength !== null &&
            c.bocpd?.currentRunLength !== undefined &&
            c.bocpd.currentRunLength < 3)
            .map((c) => c.bloomId);
        const topPerformers = contexts
            .filter((c) => !c.isColdStart)
            .sort((a, b) => b.posteriors.mean - a.posteriors.mean)
            .slice(0, 5)
            .map((c) => c.bloomId);
        const summary = formatMemoryContextForSurvey(contexts);
        return { contexts, infrastructureFailures, driftingModels, topPerformers, summary };
    }
    catch {
        return { contexts: [], infrastructureFailures: [], driftingModels: [], topPerformers: [], summary: "" };
    }
}
// ─── Step 0: Read Previous Planning Observation (Stream 3a) ──────
async function readPreviousPlanningObservation() {
    try {
        return await readTransaction(async (tx) => {
            const res = await tx.run(`MATCH (g:Grid {id: 'grid:cognitive-observations'})-[:CONTAINS]->(s:Seed)
         WHERE s.seedType = 'observation' AND s.name = 'Planning Cycle Observation'
         RETURN s.violationCount AS violations, s.constitutionalGapCount AS gaps,
                s.intentCount AS intents, s.createdAt AS timestamp
         ORDER BY s.createdAt DESC
         LIMIT 1`);
            if (res.records.length === 0)
                return null;
            const r = res.records[0];
            return {
                previousViolations: asNumber(r.get("violations")),
                previousGaps: asNumber(r.get("gaps")),
                previousIntents: asNumber(r.get("intents")),
                previousTimestamp: String(r.get("timestamp") ?? ""),
            };
        });
    }
    catch {
        return null;
    }
}
// ─── Step 3.5: Read Existing Backlog (Stream 3b) ─────────────────
async function readExistingBacklog() {
    try {
        return await readTransaction(async (tx) => {
            const intentResult = await tx.run(`MATCH (cb:Bloom {id: 'cognitive-bloom'})-[:CONTAINS]->(i:Seed)
         WHERE i.seedType = 'intent' AND i.status IN ['proposed', 'approved', 'active']
         RETURN i.id AS id, i.name AS name, coalesce(i.category, 'unknown') AS category,
                coalesce(i.priorityScore, 0) AS priorityScore, i.status AS status
         ORDER BY i.priorityScore DESC`);
            const activeIntents = intentResult.records.map((r) => ({
                id: r.get("id"),
                name: r.get("name") ?? "",
                category: r.get("category"),
                priorityScore: asNumber(r.get("priorityScore")),
                status: r.get("status"),
            }));
            const rResult = await tx.run(`MATCH (s:Seed)
         WHERE s.id =~ 'R-\\\\d+' AND s.status IN ['planned', 'active']
         RETURN s.id AS id, s.name AS name, s.status AS status
         ORDER BY s.id`);
            const rItems = rResult.records.map((r) => ({
                id: r.get("id"),
                name: r.get("name") ?? "",
                status: r.get("status"),
            }));
            return { activeIntents, rItems };
        });
    }
    catch {
        return { activeIntents: [], rItems: [] };
    }
}
// ─── Step 2.7: Structural Drift Detection (Stream 4) ────────────
async function detectStructuralDrift(bloomStates) {
    const drifts = [];
    const DRIFT_THRESHOLD = 0.7;
    const patternBlooms = bloomStates.filter((b) => !b.id.startsWith("M-") &&
        !/^\d{4}-\d{2}-/.test(b.id) &&
        b.status === "active");
    const detector = new BOCPDDetector();
    for (const bloom of patternBlooms) {
        try {
            const stateResult = await readTransaction(async (tx) => {
                const res = await tx.run(`MATCH (b:Bloom {id: $bloomId})
           RETURN b.bocpdState_phiL AS phiLState, b.bocpdState_lambda2 AS lambda2State`, { bloomId: bloom.id });
                return res.records[0] ?? null;
            });
            if (!stateResult)
                continue;
            // ΦL drift
            if (bloom.phiL > 0) {
                const phiLStateJson = stateResult.get("phiLState");
                const phiLState = phiLStateJson ? JSON.parse(phiLStateJson) : detector.initialState();
                const { signal, nextState } = detector.update(bloom.phiL, phiLState);
                if (signal.changePointProbability >= DRIFT_THRESHOLD) {
                    drifts.push({ bloomId: bloom.id, metric: "phiL", changePointProbability: signal.changePointProbability });
                }
                try {
                    await updateMorpheme(bloom.id, { bocpdState_phiL: JSON.stringify(nextState) });
                }
                catch { /* non-fatal */ }
            }
            // λ₂ drift
            if (bloom.lambda2 > 0) {
                const lambda2StateJson = stateResult.get("lambda2State");
                const lambda2State = lambda2StateJson ? JSON.parse(lambda2StateJson) : detector.initialState();
                const { signal, nextState } = detector.update(bloom.lambda2, lambda2State);
                if (signal.changePointProbability >= DRIFT_THRESHOLD) {
                    drifts.push({ bloomId: bloom.id, metric: "lambda2", changePointProbability: signal.changePointProbability });
                }
                try {
                    await updateMorpheme(bloom.id, { bocpdState_lambda2: JSON.stringify(nextState) });
                }
                catch { /* non-fatal */ }
            }
        }
        catch { /* non-fatal per-bloom */ }
    }
    return drifts;
}
// ─── CE Scope Detection (Stream 8) ──────────────────────────────
async function findUnwiredBlooms() {
    try {
        const result = await readTransaction(async (tx) => {
            const res = await tx.run(`MATCH (b:Bloom)
         WHERE b.status IN ['active', 'planned']
           AND NOT (b)-[:FLOWS_TO]->(:Resonator {id: 'resonator:compliance-evaluation'})
           AND NOT b.id = 'constitutional-bloom'
           AND NOT b.id STARTS WITH 'M-'
           AND NOT b.id =~ '\\\\d{4}-\\\\d{2}-.*'
         RETURN b.id AS id`);
            return res.records.map((r) => r.get("id"));
        });
        return result;
    }
    catch {
        return [];
    }
}
// ─── Intent Persistence (Stream 5) ──────────────────────────────
async function persistIntents(intents) {
    const stats = { total: 0, created: 0, updated: 0, resolved: 0, enriched: 0 };
    // Read existing intent Seeds for idempotency
    const existingIntents = await readTransaction(async (tx) => {
        const res = await tx.run(`MATCH (cb:Bloom {id: 'cognitive-bloom'})-[:CONTAINS]->(i:Seed {seedType: 'intent'})
       WHERE i.status IN ['proposed', 'approved', 'active']
       RETURN i.id AS id, coalesce(i.proposedCycleCount, 1) AS cycleCount`);
        return new Map(res.records.map((r) => [r.get("id"), asNumber(r.get("cycleCount"))]));
    });
    // Build set of current intent IDs for resolved detection
    const currentIntentIds = new Set(intents.map((i) => i.intentId));
    // Mark existing intents that are no longer in the current set as resolved
    for (const [existingId] of existingIntents) {
        if (!currentIntentIds.has(existingId)) {
            try {
                await updateMorpheme(existingId, { status: "resolved" });
                stats.resolved++;
            }
            catch { /* non-fatal */ }
        }
    }
    // Persist current intents
    for (let i = 0; i < intents.length; i++) {
        const intent = intents[i];
        if ((i + 1) % 50 === 0) {
            console.log(`  [Planning] Persisting intent ${i + 1}/${intents.length}...`);
        }
        try {
            if (existingIntents.has(intent.intentId)) {
                // Update existing — bump cycle count, update score
                const oldCycleCount = existingIntents.get(intent.intentId) ?? 1;
                await updateMorpheme(intent.intentId, {
                    priorityScore: intent.priorityScore,
                    proposedCycleCount: oldCycleCount + 1,
                    category: intent.category,
                    architectIntent: intent.architectIntent ?? "",
                });
                stats.updated++;
            }
            else {
                // Create new intent Seed
                await instantiateMorpheme("seed", {
                    id: intent.intentId,
                    name: intent.description.slice(0, 200),
                    content: intent.description,
                    seedType: "intent",
                    status: "proposed",
                    category: intent.category,
                    priorityScore: intent.priorityScore,
                    architectIntent: intent.architectIntent ?? "",
                    proposedCycleCount: 1,
                }, "cognitive-bloom");
                stats.created++;
                // Wire SCOPED_TO if target Bloom exists
                if (intent.justification.phiLTarget) {
                    try {
                        const { createLine } = await import("../../graph/instantiation.js");
                        await createLine(intent.intentId, intent.justification.phiLTarget, "SCOPED_TO", {
                            label: "intent-scope",
                        });
                    }
                    catch { /* target may not exist — non-fatal */ }
                }
                // Wire REFERENCES if constitutional definition
                if (intent.targetDefId) {
                    try {
                        const { createLine } = await import("../../graph/instantiation.js");
                        await createLine(intent.intentId, intent.targetDefId, "REFERENCES", {
                            label: "intent-reference",
                        });
                    }
                    catch { /* def may not exist — non-fatal */ }
                }
            }
            stats.total++;
        }
        catch {
            // Individual persist failure is non-fatal
        }
    }
    return stats;
}
// ─── Step 3: Read Milestone State ─────────────────────────────────
async function readMilestoneState() {
    try {
        return await readTransaction(async (tx) => {
            // All milestones for counts
            const allResult = await tx.run(`MATCH (b:Bloom)
         WHERE b.id STARTS WITH 'M-' OR b.type IN ['milestone', 'sub-milestone']
         RETURN b.status AS status, count(*) AS cnt`);
            let total = 0, complete = 0, active = 0, planned = 0;
            for (const r of allResult.records) {
                const s = r.get("status");
                const c = asNumber(r.get("cnt"));
                total += c;
                if (s === "complete")
                    complete += c;
                else if (s === "active")
                    active += c;
                else if (s === "planned")
                    planned += c;
            }
            // Unblocked milestones with structural context
            const unblockedResult = await tx.run(`MATCH (b:Bloom)
         WHERE (b.id STARTS WITH 'M-' OR b.type IN ['milestone', 'sub-milestone'])
           AND b.status IN ['active', 'planned']
         OPTIONAL MATCH (b)-[:CONTAINS]->(child)
         WHERE child:Bloom OR (child:Seed AND child.seedType = 'exit-criterion')
         WITH b,
              count(child) AS total,
              count(CASE WHEN child.status = 'complete' THEN 1 END) AS done
         OPTIONAL MATCH (prereq:Bloom)-[:DEPENDS_ON]->(b)
         WHERE prereq.status <> 'complete'
         WITH b, total, done,
              collect(DISTINCT prereq.id) AS blockedBy
         RETURN b.id AS id, b.name AS name,
                coalesce(b.phiL, 0.0) AS phiL,
                done AS childrenComplete, total AS childrenTotal,
                blockedBy
         ORDER BY size(blockedBy) ASC, b.phiL ASC`);
            const unblocked = unblockedResult.records
                .filter((r) => {
                const blocked = r.get("blockedBy");
                return !blocked || blocked.length === 0;
            })
                .map((r) => ({
                id: r.get("id"),
                name: r.get("name") ?? r.get("id"),
                phiL: asNumber(r.get("phiL")),
                childrenComplete: asNumber(r.get("childrenComplete")),
                childrenTotal: asNumber(r.get("childrenTotal")),
                blockedBy: [],
            }));
            return { total, complete, active, planned, unblocked };
        });
    }
    catch {
        return { total: 0, complete: 0, active: 0, planned: 0, unblocked: [] };
    }
}
// ─── Step 4: Constitutional Delta (Scoped) ────────────────────────
async function computeScopedDelta(definitions) {
    // Dynamic scope: survey all Blooms that have bloom-level INSTANTIATES
    const patternBlooms = await readTransaction(async (tx) => {
        const result = await tx.run(`MATCH (b:Bloom)-[:INSTANTIATES]->(def:Seed)
       WHERE def.seedType = 'bloom-definition'
         AND b.status IN ['active', 'planned']
         AND NOT b.id STARTS WITH 'M-'
         AND NOT b.id =~ '\\\\d{4}-\\\\d{2}-.*'
       RETURN b.id AS id`);
        return result.records.map((r) => r.get("id"));
    });
    const allGaps = [];
    for (const bloomId of patternBlooms) {
        try {
            const survey = await surveyBloomTopology(bloomId);
            const relevantScopes = inferScopesForBloom(bloomId, definitions);
            const scopedDefs = definitions.filter((d) => relevantScopes.includes(d.scope));
            const gaps = computeConstitutionalDelta(survey, scopedDefs, relevantScopes);
            allGaps.push(...gaps);
        }
        catch {
            // Survey failure on a Bloom is non-fatal — log and continue
            console.warn(`  [Planning] Survey failed for ${bloomId}, skipping`);
        }
    }
    return allGaps;
}
/**
 * Infer which definition scopes are relevant for a given Bloom ID.
 * Maps Bloom identity to scope names based on naming conventions + definitions.
 */
function inferScopesForBloom(bloomId, definitions) {
    const scopes = new Set(["ecosystem"]);
    // Extract scope hints from the bloom ID
    const id = bloomId.toLowerCase();
    if (id.includes("architect"))
        scopes.add("architect");
    if (id.includes("cognitive") || id.includes("gnosis"))
        scopes.add("cognitive");
    if (id.includes("dev-agent") || id.includes("devagent"))
        scopes.add("dev-agent");
    if (id.includes("thompson"))
        scopes.add("thompson");
    if (id.includes("assayer"))
        scopes.add("assayer");
    // Also check if any definition scope matches part of the bloom ID
    const uniqueScopes = new Set(definitions.map((d) => d.scope));
    for (const scope of uniqueScopes) {
        if (id.includes(scope.toLowerCase())) {
            scopes.add(scope);
        }
    }
    return Array.from(scopes);
}
// ─── Step 5: Categorise ───────────────────────────────────────────
function categoriseViolation(checkId) {
    if (checkId.startsWith("G"))
        return "governance";
    if (checkId.startsWith("A"))
        return "governance";
    if (checkId.startsWith("anti:"))
        return "governance";
    return "governance";
}
function categoriseGap(gap) {
    if (gap.missingLineType)
        return "pattern-topology";
    if (gap.missingDefId)
        return "pattern-topology";
    if (gap.gapType === "topological")
        return "pattern-topology";
    return "governance";
}
function categoriseMilestone(name) {
    const lower = (name ?? "").toLowerCase();
    if (lower.includes("pipeline") || lower.includes("thompson") ||
        lower.includes("constraint") || lower.includes("poka-yoke") ||
        lower.includes("infra"))
        return "infrastructure";
    if (lower.includes("pattern") || lower.includes("topology") ||
        lower.includes("wiring") || lower.includes("composition"))
        return "pattern-topology";
    if (lower.includes("governance") || lower.includes("compliance") ||
        lower.includes("constitutional"))
        return "governance";
    if (lower.includes("grounding") || lower.includes("priming") ||
        lower.includes("substrate") || lower.includes("llm"))
        return "substrate-grounding";
    // Default to infrastructure for unclassifiable milestones
    return "infrastructure";
}
// ─── Step 6: Score and Rank ───────────────────────────────────────
function scorePlanningIntent(intent) {
    let score = 0;
    // Violation severity weight
    if (intent.justification.violationSeverity === "critical")
        score += 100;
    if (intent.justification.violationSeverity === "error")
        score += 50;
    if (intent.justification.violationSeverity === "warning")
        score += 10;
    // Constitutional gap weight (mandatory = high)
    if (intent.justification.gapType === "constitutional")
        score += 40;
    if (intent.justification.gapType === "violation")
        score += 30;
    // λ₂ improvement potential
    score += (intent.justification.lambda2Delta ?? 0) * 20;
    // ΦL uplift (lower current ΦL = higher priority)
    if (intent.justification.phiLCurrent !== undefined) {
        score += (1 - intent.justification.phiLCurrent) * 15;
    }
    // Dependency unblocking multiplier
    const unblockCount = intent.justification.unblocks?.length ?? 0;
    if (unblockCount > 0)
        score *= 1 + unblockCount * 0.2;
    return Math.round(score * 100) / 100;
}
// ─── Intent Builders ──────────────────────────────────────────────
function violationToIntent(v) {
    const category = categoriseViolation(v.checkId);
    const intent = {
        intentId: `plan:violation:${v.id}`,
        category,
        description: `Fix ${v.checkId} violation on ${v.targetNodeId}: ${v.evidence}`,
        priorityScore: 0,
        justification: {
            violationSeverity: v.severity,
            violationCount: 1,
            gapType: "violation",
        },
        violationId: v.id,
    };
    intent.priorityScore = scorePlanningIntent(intent);
    intent.architectIntent = `[Gnosis Planning] ${category}: Fix ${v.checkId} violation on ${v.targetNodeId} — ${v.evidence}`;
    return intent;
}
function gapToIntent(gap) {
    const category = categoriseGap(gap);
    const intent = {
        intentId: `plan:gap:${gap.gapId}`,
        category,
        description: gap.description,
        priorityScore: 0,
        justification: {
            lambda2Delta: gap.expectedLambda2Delta,
            gapType: gap.gapType,
        },
        targetDefId: gap.missingDefId,
    };
    intent.priorityScore = scorePlanningIntent(intent);
    intent.architectIntent = `[Gnosis Planning] ${category}: ${gap.description}`;
    return intent;
}
function milestoneToIntent(m) {
    const category = categoriseMilestone(m.name);
    const progress = m.childrenTotal > 0
        ? `${m.childrenComplete}/${m.childrenTotal} children complete`
        : "no children tracked";
    const intent = {
        intentId: `plan:milestone:${m.id}`,
        category,
        description: `Advance ${m.id} (${m.name}): ${progress}, ΦL=${m.phiL}`,
        priorityScore: 0,
        justification: {
            phiLTarget: m.id,
            phiLCurrent: m.phiL,
            gapType: "milestone",
        },
        milestoneId: m.id,
    };
    intent.priorityScore = scorePlanningIntent(intent);
    intent.architectIntent = `[Gnosis Planning] ${category}: Advance ${m.id} — ${m.name} (${progress})`;
    return intent;
}
// ─── Step 8: Record Observation ───────────────────────────────────
async function recordPlanningObservation(report) {
    try {
        await instantiateMorpheme("seed", {
            id: `obs:planning:${Date.now()}`,
            name: "Planning Cycle Observation",
            content: `Planning report: ${report.ecosystemState.totalBlooms} Blooms surveyed, ` +
                `${report.activeViolations.total} violations, ` +
                `${report.milestoneState.unblocked.length} unblocked milestones, ` +
                `${report.constitutionalGaps} constitutional gaps, ` +
                `${report.intents.length} intents produced. ` +
                `Models: ${report.modelMemory.totalModels} total, ${report.modelMemory.infrastructureFailures.length} infra-failures. ` +
                `Drifts: ${report.structuralDrifts.length}. Unwired: ${report.unwiredBlooms.length}.`,
            seedType: "observation",
            status: "recorded",
            bloomCount: report.ecosystemState.totalBlooms,
            violationCount: report.activeViolations.total,
            milestoneUnblockedCount: report.milestoneState.unblocked.length,
            constitutionalGapCount: report.constitutionalGaps,
            intentCount: report.intents.length,
            modelCount: report.modelMemory.totalModels,
            infraFailureCount: report.modelMemory.infrastructureFailures.length,
            driftCount: report.structuralDrifts.length,
            unwiredCount: report.unwiredBlooms.length,
            persistedCount: report.persistenceStats?.total ?? 0,
            processingTimeMs: report.processingTimeMs,
        }, "grid:cognitive-observations");
    }
    catch {
        // Observation recording is non-fatal
    }
}
// ─── Utilities ────────────────────────────────────────────────────
/** Safely convert Neo4j integer or float to JS number */
function asNumber(val) {
    if (val === null || val === undefined)
        return 0;
    if (typeof val === "number")
        return val;
    if (typeof val === "object" && val !== null && "toNumber" in val) {
        return val.toNumber();
    }
    const n = Number(val);
    return isNaN(n) ? 0 : n;
}
// ─── Main Entry Point ─────────────────────────────────────────────
/**
 * Run the Gnosis Planning Cycle — ecosystem-wide structural prioritisation.
 *
 * Surveys all active Blooms, reads violations and milestone state, computes
 * constitutional delta across pattern Blooms, reads LLM memory and existing
 * backlog, detects structural drift via BOCPD, and produces a ranked,
 * categorised list of intents with structural justification.
 *
 * All ranking is deterministic — derived from graph properties, no LLM.
 * LLM enrichment of top-N intents is optional (requires modelExecutor).
 *
 * @param modelExecutor - Optional: Thompson-routed model for intent enrichment
 * @param enrichTopN - Number of top intents to enrich (default: 10)
 */
export async function runPlanningCycle(modelExecutor, enrichTopN = 10) {
    const startTime = Date.now();
    // Step 0: Read previous planning observation (cross-cycle delta)
    console.log("  [Planning] Step 0: Reading previous planning cycle...");
    const previousObs = await readPreviousPlanningObservation();
    if (previousObs) {
        console.log(`  [Planning] Previous cycle: ${previousObs.previousViolations} violations, ` +
            `${previousObs.previousGaps} gaps, ${previousObs.previousIntents} intents`);
    }
    else {
        console.log("  [Planning] No previous cycle found (first run)");
    }
    // Step 1: Ecosystem survey
    console.log("  [Planning] Step 1: Surveying ecosystem...");
    const ecosystem = await surveyEcosystem();
    console.log(`  [Planning] ${ecosystem.bloomStates.length} active/planned Blooms, ` +
        `${ecosystem.totalResonators} Resonators, ${ecosystem.totalGrids} Grids, ${ecosystem.totalHelixes} Helixes`);
    // Step 2: Read violations
    console.log("  [Planning] Step 2: Reading violations...");
    const violations = await readViolations();
    console.log(`  [Planning] ${violations.total} active violations ` +
        `(${violations.bySeverity.critical} critical, ${violations.bySeverity.error} error, ${violations.bySeverity.warning} warning)`);
    // Step 2.5: Read LLM memory state (Stream 2)
    console.log("  [Planning] Step 2.5: Reading LLM memory state...");
    const memoryState = await readLLMMemoryState();
    console.log(`  [Planning] ${memoryState.contexts.length} LLM models, ` +
        `${memoryState.infrastructureFailures.length} infra-failures, ` +
        `${memoryState.driftingModels.length} drifting`);
    // Step 2.7: Structural drift detection (Stream 4)
    console.log("  [Planning] Step 2.7: Detecting structural drift (BOCPD)...");
    const structuralDrifts = await detectStructuralDrift(ecosystem.bloomStates);
    console.log(`  [Planning] ${structuralDrifts.length} structural drifts detected`);
    // Step 3: Read milestone state
    console.log("  [Planning] Step 3: Reading milestone state...");
    const milestones = await readMilestoneState();
    console.log(`  [Planning] ${milestones.total} milestones ` +
        `(${milestones.complete} complete, ${milestones.active} active, ${milestones.planned} planned, ` +
        `${milestones.unblocked.length} unblocked)`);
    // Step 3.5: Read existing backlog (Stream 3b)
    console.log("  [Planning] Step 3.5: Reading existing backlog...");
    const backlog = await readExistingBacklog();
    console.log(`  [Planning] Backlog: ${backlog.activeIntents.length} intent Seeds, ` +
        `${backlog.rItems.length} R-items`);
    // Step 4: Constitutional delta across pattern Blooms
    console.log("  [Planning] Step 4: Computing constitutional delta...");
    const definitions = await queryTransformationDefinitions();
    const gaps = await computeScopedDelta(definitions);
    const constitutionalGaps = gaps.filter((g) => g.gapType === "constitutional").length;
    console.log(`  [Planning] ${gaps.length} gaps (${constitutionalGaps} constitutional)`);
    // Step 5: Build intents from all sources, categorise, score
    console.log("  [Planning] Step 5: Building and scoring intents...");
    const intents = [];
    // Violations → intents
    for (const v of violations.top) {
        intents.push(violationToIntent(v));
    }
    // Constitutional/topological gaps → intents
    for (const gap of gaps) {
        intents.push(gapToIntent(gap));
    }
    // Unblocked milestones → intents
    for (const m of milestones.unblocked) {
        intents.push(milestoneToIntent(m));
    }
    // Infrastructure failure models → poka-yoke intents (Stream 2)
    for (const model of memoryState.infrastructureFailures) {
        intents.push({
            intentId: `plan:memory:infra-failure:${model}`,
            category: "infrastructure",
            description: `Model ${model}: infrastructure failures (likely stale API endpoint). ` +
                `Poka-yoke fix: updateStructuralMemoryAfterExecution() must classify failures — ` +
                `infrastructure errors (404/429/auth/timeout) must NOT update posteriors.`,
            priorityScore: 0,
            justification: {
                gapType: "topological",
                phiLTarget: model,
                phiLCurrent: 0,
            },
        });
    }
    // Drifting models → investigation intents (Stream 2)
    for (const model of memoryState.driftingModels) {
        intents.push({
            intentId: `plan:memory:drift:${model}`,
            category: "infrastructure",
            description: `BOCPD drift on ${model}: quality change point detected. Review recent outputs, consider recalibration.`,
            priorityScore: 0,
            justification: {
                gapType: "topological",
                phiLTarget: model,
            },
        });
    }
    // Structural drifts → governance intents (Stream 4)
    for (const drift of structuralDrifts) {
        intents.push({
            intentId: `plan:drift:${drift.bloomId}:${drift.metric}`,
            category: "governance",
            description: `Structural drift on ${drift.bloomId} (${drift.metric}): change point P=${drift.changePointProbability.toFixed(2)}. Investigate cause.`,
            priorityScore: 0,
            justification: {
                gapType: "topological",
                phiLTarget: drift.bloomId,
            },
        });
    }
    // R-items → intents (Stream 3b)
    for (const r of backlog.rItems) {
        const category = categoriseMilestone(r.name);
        intents.push({
            intentId: `plan:backlog:${r.id}`,
            category,
            description: `Backlog ${r.id}: ${r.name} (status: ${r.status})`,
            priorityScore: 0,
            justification: {
                gapType: "milestone",
            },
        });
    }
    // CE scope detection → governance intents (Stream 8)
    const unwiredBlooms = await findUnwiredBlooms();
    for (const bloomId of unwiredBlooms) {
        intents.push({
            intentId: `plan:unwired:${bloomId}`,
            category: "governance",
            description: `Bloom ${bloomId} has no FLOWS_TO to resonator:compliance-evaluation. Wire or justify exclusion.`,
            priorityScore: 0,
            justification: {
                gapType: "topological",
                phiLTarget: bloomId,
            },
        });
    }
    // Score all intents
    for (const intent of intents) {
        if (intent.priorityScore === 0) {
            intent.priorityScore = scorePlanningIntent(intent);
        }
    }
    // Backlog boost: active/approved intents get 1.5× score, stale proposed get 0.8×
    const existingIntentStatuses = new Map(backlog.activeIntents.map((i) => [i.id, i.status]));
    for (const intent of intents) {
        const existingStatus = existingIntentStatuses.get(intent.intentId);
        if (existingStatus === "active" || existingStatus === "approved") {
            intent.priorityScore = Math.round(intent.priorityScore * 1.5 * 100) / 100;
        }
    }
    // Sort by priority score (descending)
    intents.sort((a, b) => b.priorityScore - a.priorityScore);
    // Step 6: Group by category
    const byCategory = {
        infrastructure: [],
        "pattern-topology": [],
        governance: [],
        "substrate-grounding": [],
    };
    for (const intent of intents) {
        byCategory[intent.category].push(intent);
    }
    console.log(`  [Planning] ${intents.length} intents produced`);
    // Step 7: Persist all scored intents as Seeds (Stream 5)
    console.log("  [Planning] Step 7: Persisting intent Seeds...");
    const persistenceStats = await persistIntents(intents);
    console.log(`  [Planning] Persisted: ${persistenceStats.total} total ` +
        `(${persistenceStats.created} new, ${persistenceStats.updated} updated, ${persistenceStats.resolved} resolved)`);
    // Compute cross-cycle delta
    const previousCycleDelta = previousObs ? {
        previousTimestamp: previousObs.previousTimestamp,
        violationDelta: violations.total - previousObs.previousViolations,
        gapDelta: constitutionalGaps - previousObs.previousGaps,
        intentDelta: intents.length - previousObs.previousIntents,
    } : null;
    // Backlog summary
    const backlogCounts = {
        activeIntents: backlog.activeIntents.filter((i) => i.status === "active").length,
        approvedIntents: backlog.activeIntents.filter((i) => i.status === "approved").length,
        proposedIntents: backlog.activeIntents.filter((i) => i.status === "proposed").length,
        rItems: backlog.rItems.length,
    };
    const processingTimeMs = Date.now() - startTime;
    const report = {
        timestamp: new Date().toISOString(),
        ecosystemState: {
            totalBlooms: ecosystem.bloomStates.length,
            totalResonators: ecosystem.totalResonators,
            totalGrids: ecosystem.totalGrids,
            totalHelixes: ecosystem.totalHelixes,
            bloomStates: ecosystem.bloomStates,
        },
        activeViolations: violations,
        milestoneState: milestones,
        constitutionalGaps,
        modelMemory: {
            totalModels: memoryState.contexts.length,
            activeModels: memoryState.contexts.filter((c) => !c.isColdStart).length,
            infrastructureFailures: memoryState.infrastructureFailures,
            driftingModels: memoryState.driftingModels,
            topPerformers: memoryState.topPerformers,
            summary: memoryState.summary,
        },
        previousCycleDelta,
        existingBacklog: backlogCounts,
        structuralDrifts,
        unwiredBlooms,
        persistenceStats,
        intents,
        byCategory,
        processingTimeMs,
    };
    // Step 8: Record observation
    console.log("  [Planning] Step 8: Recording observation...");
    await recordPlanningObservation(report);
    console.log(`  [Planning] Complete in ${processingTimeMs}ms`);
    return report;
}
// Re-export for testing and CLI
export { scorePlanningIntent, inferScopesForBloom, categoriseMilestone, readLLMMemoryState, readExistingBacklog, detectStructuralDrift, findUnwiredBlooms, persistIntents };
//# sourceMappingURL=planning.js.map