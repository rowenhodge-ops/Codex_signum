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
import { instantiateMorpheme } from "../../graph/instantiation.js";
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
            const result = await tx.run(`MATCH (g:Grid {id: 'grid:violation:ecosystem'})-[:CONTAINS]->(v:Seed)
         WHERE v.status = 'active'
         RETURN v.id AS id, v.checkId AS checkId, v.targetNodeId AS targetNodeId,
                v.severity AS severity, v.evidence AS evidence, v.createdAt AS createdAt
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
                `${report.intents.length} intents produced.`,
            seedType: "observation",
            status: "recorded",
            bloomCount: report.ecosystemState.totalBlooms,
            violationCount: report.activeViolations.total,
            milestoneUnblockedCount: report.milestoneState.unblocked.length,
            constitutionalGapCount: report.constitutionalGaps,
            intentCount: report.intents.length,
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
 * constitutional delta across pattern Blooms, and produces a ranked, categorised
 * list of intents with structural justification.
 *
 * All ranking is deterministic — derived from graph properties, no LLM.
 */
export async function runPlanningCycle() {
    const startTime = Date.now();
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
    // Step 3: Read milestone state
    console.log("  [Planning] Step 3: Reading milestone state...");
    const milestones = await readMilestoneState();
    console.log(`  [Planning] ${milestones.total} milestones ` +
        `(${milestones.complete} complete, ${milestones.active} active, ${milestones.planned} planned, ` +
        `${milestones.unblocked.length} unblocked)`);
    // Step 4: Constitutional delta across pattern Blooms
    console.log("  [Planning] Step 4: Computing constitutional delta...");
    const definitions = await queryTransformationDefinitions();
    const gaps = await computeScopedDelta(definitions);
    const constitutionalGaps = gaps.filter((g) => g.gapType === "constitutional").length;
    console.log(`  [Planning] ${gaps.length} gaps (${constitutionalGaps} constitutional)`);
    // Step 5 + 6: Build intents from all sources, categorise, score
    console.log("  [Planning] Step 5-6: Building and scoring intents...");
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
    // Sort by priority score (descending)
    intents.sort((a, b) => b.priorityScore - a.priorityScore);
    // Step 7: Group by category
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
// Re-export scoring for testing
export { scorePlanningIntent, inferScopesForBloom, categoriseMilestone };
//# sourceMappingURL=planning.js.map