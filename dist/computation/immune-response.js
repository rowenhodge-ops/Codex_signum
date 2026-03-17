// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Codex Signum — Immune Response Orchestration
 *
 * Wires triggers to diagnostics. This is the entry point consumers call.
 * Check triggers → if any fire → run expensive structural review → persist.
 *
 * M-22.7: assembleTriggerState reads live graph data into TriggerInputState.
 * Triggered events persist as ThresholdEvent nodes.
 * Diagnostic findings persist as Seeds in the Structural Review Grid.
 *
 * @see codex-signum-v3.0.md §Event-Triggered Structural Review
 * @see engineering-bridge-v3.0.md §Part 8 "Structural Review"
 * @module codex-signum-core/computation/immune-response
 */
import { checkStructuralTriggers } from "./structural-triggers.js";
import { runStructuralReview } from "./structural-review.js";
import { getPatternAdjacency, getPatternsWithHealth } from "../graph/queries.js";
import { runQuery, writeTransaction } from "../graph/client.js";
import { getThresholds } from "./adaptive-thresholds.js";
import { computeMaturityFactor } from "./maturity.js";
/**
 * Derive actionable recommendations from 5 diagnostics.
 */
function deriveRecommendations(review) {
    const recs = [];
    if (review.globalLambda2 < 0.1) {
        recs.push({
            diagnostic: "globalLambda2",
            action: "Graph is near-disconnected. Add cross-cluster Lines to restore algebraic connectivity.",
            severity: "critical",
        });
    }
    else if (review.globalLambda2 < 0.3) {
        recs.push({
            diagnostic: "globalLambda2",
            action: "Low algebraic connectivity. Consider adding redundant Lines between weakly connected components.",
            severity: "warning",
        });
    }
    if (review.spectralGap > 10) {
        recs.push({
            diagnostic: "spectralGap",
            action: "High spectral gap indicates structural imbalance. Redistribute connections to reduce hub dominance.",
            severity: "warning",
        });
    }
    for (const hub of review.hubDependencies) {
        if (hub.criticality > 0.5) {
            recs.push({
                diagnostic: "hubDependencies",
                action: `Node ${hub.nodeId} is a critical dependency (removing it drops λ₂ by ${(hub.criticality * 100).toFixed(0)}%). Add redundant paths around it.`,
                severity: hub.criticality > 0.8 ? "critical" : "warning",
            });
        }
    }
    if (review.frictionDistribution.globalFriction > 0.5) {
        recs.push({
            diagnostic: "frictionDistribution",
            action: `Global friction ${review.frictionDistribution.globalFriction.toFixed(3)} is high. Review hotspots: ${review.frictionDistribution.hotspots.slice(0, 3).map(h => `${h.from}→${h.to}`).join(", ")}.`,
            severity: review.frictionDistribution.globalFriction > 0.8 ? "critical" : "warning",
        });
    }
    if (!review.dampeningAssessment.adequate) {
        recs.push({
            diagnostic: "dampeningAssessment",
            action: `Dampening inadequate for ${review.dampeningAssessment.riskNodes.length} node(s). Adjust γ from ${review.dampeningAssessment.riskNodes[0]?.currentGamma.toFixed(2) ?? "?"} to ${review.dampeningAssessment.riskNodes[0]?.recommendedGamma.toFixed(2) ?? "?"}.`,
            severity: "warning",
        });
    }
    // Always include at least one recommendation if triggers fired
    if (recs.length === 0) {
        recs.push({
            diagnostic: "general",
            action: "All diagnostics within normal parameters. Continue monitoring.",
            severity: "info",
        });
    }
    return recs;
}
// ============ STATE ASSEMBLY (M-22.7) ============
/**
 * Assemble TriggerInputState from live graph state.
 * Reads all data needed for the 6 trigger conditions from Neo4j.
 *
 * This is the bridge between graph state and the immune system.
 * After M-22.1–M-22.6, all required data is live on Bloom nodes.
 *
 * Uses safe defaults for missing data — absent data never fires triggers.
 */
export async function assembleTriggerState(bloomId) {
    // Single query for most fields
    const result = await runQuery(`MATCH (b:Bloom {id: $bloomId})
     OPTIONAL MATCH (b)-[r]-()
     WITH b, count(r) AS connCount
     OPTIONAL MATCH (o:Observation)-[:OBSERVED_IN]->(b)
     WHERE o.retained = true
     WITH b, connCount, count(o) AS obsCount
     RETURN b.lambda2 AS lambda2,
            b.previousLambda2 AS prevLambda2,
            b.friction AS friction,
            b.epsilonR AS epsilonR,
            b.phiL AS phiL,
            b.phiLState AS phiLState,
            connCount, obsCount`, { bloomId }, "READ");
    // Safe defaults — absent data doesn't fire triggers
    const defaults = {
        currentLambda2: 0.5,
        previousLambda2: 0.5,
        currentFriction: 0,
        refinementHelixTemporalConstant: 100,
        frictionDuration: 0,
        currentCascadeDepth: 0,
        compositionEpsilonR: 0.1,
        epsilonRStableRange: { min: 0.10, max: 0.40 },
        ecosystemPhiLVelocity: 0,
        omegaGradientHistory: [0, 0, 0, 0],
    };
    if (result.records.length === 0)
        return defaults;
    const rec = result.records[0];
    const lambda2 = rec.get("lambda2");
    const prevLambda2 = rec.get("prevLambda2");
    const friction = rec.get("friction");
    const epsilonR = rec.get("epsilonR");
    const phiLStateJson = rec.get("phiLState");
    const obsCount = Number(rec.get("obsCount"));
    const connCount = Number(rec.get("connCount"));
    // Compute maturity-indexed εR stable range
    const maturityIndex = computeMaturityFactor(obsCount, connCount);
    const thresholds = getThresholds(maturityIndex);
    // Parse PhiLState ring buffer for velocity computation
    let ecosystemPhiLVelocity = 0;
    let omegaGradientHistory = [0, 0, 0, 0];
    if (phiLStateJson) {
        try {
            const phiLState = JSON.parse(phiLStateJson);
            if (phiLState.ringBuffer.length >= 2) {
                const buf = phiLState.ringBuffer;
                // V1 approximation: velocity = last - secondLast (per observation interval)
                ecosystemPhiLVelocity = buf[buf.length - 1] - buf[buf.length - 2];
                // Derive Ω gradient history from consecutive differences in ring buffer
                if (buf.length >= 5) {
                    const diffs = [];
                    for (let i = buf.length - 4; i < buf.length; i++) {
                        diffs.push(buf[i] - buf[i - 1]);
                    }
                    omegaGradientHistory = diffs;
                }
            }
        }
        catch {
            // Corrupted state — use defaults
        }
    }
    return {
        currentLambda2: lambda2 != null ? Number(lambda2) : defaults.currentLambda2,
        previousLambda2: prevLambda2 != null ? Number(prevLambda2) : lambda2 != null ? Number(lambda2) : defaults.previousLambda2,
        currentFriction: friction != null ? Number(friction) : defaults.currentFriction,
        refinementHelixTemporalConstant: 100, // V1 default — no live Refinement Helix yet
        frictionDuration: 0, // V1 default — no friction duration tracking yet
        currentCascadeDepth: 0, // V1 default — read from most recent propagation event when available
        compositionEpsilonR: epsilonR != null ? Number(epsilonR) : defaults.compositionEpsilonR,
        epsilonRStableRange: thresholds.epsilonR_stable,
        ecosystemPhiLVelocity,
        omegaGradientHistory,
    };
}
// ============ PERSISTENCE (M-22.7) ============
/**
 * Persist triggered events as ThresholdEvent nodes in the graph.
 * Each trigger firing is a distinct event (CREATE, not MERGE).
 *
 * @returns IDs of created ThresholdEvent nodes
 */
export async function persistTriggeredEvents(bloomId, triggers) {
    const ids = [];
    const now = new Date().getTime();
    await writeTransaction(async (tx) => {
        for (let i = 0; i < triggers.length; i++) {
            const t = triggers[i];
            const id = `te-${t.trigger}-${bloomId}-${now}-${i}`;
            ids.push(id);
            await tx.run(`CREATE (te:ThresholdEvent:Seed {
           id: $id,
           seedType: 'trigger-event',
           name: $name,
           content: $detail,
           trigger: $trigger,
           severity: $severity,
           bloomId: $bloomId,
           status: 'recorded',
           createdAt: datetime()
         })
         WITH te
         MATCH (b:Bloom {id: $bloomId})
         CREATE (te)-[:OBSERVED_IN]->(b)`, {
                id,
                name: t.trigger,
                detail: t.detail,
                trigger: t.trigger,
                severity: t.severity,
                bloomId,
            });
        }
    });
    return ids;
}
/**
 * Persist structural review results as a finding Seed in the Structural Review Grid.
 * The Grid is MERGEd (idempotent). Each finding is CREATEd (distinct event).
 *
 * @returns The observation/finding Seed ID
 */
export async function persistReviewResults(bloomId, review, triggers, triggerEventIds) {
    const id = `srf-${bloomId}-${new Date().getTime()}`;
    const content = [
        `Structural review triggered by ${triggers.length} event(s): ${triggers.map(t => t.trigger).join(", ")}.`,
        `Global λ₂ = ${review.globalLambda2.toFixed(4)} (${review.globalLambda2 < 0.1 ? "CRITICAL: near-disconnection" : "connected"}).`,
        `Spectral gap = ${review.spectralGap.toFixed(2)} (${review.spectralGap > 10 ? "imbalanced" : "balanced"}).`,
        `Hub dependencies: ${review.hubDependencies.length} critical nodes (top: ${review.hubDependencies[0]?.nodeId ?? "none"}).`,
        `Friction: global TV_G = ${review.frictionDistribution.globalFriction.toFixed(3)}, ${review.frictionDistribution.hotspots.length} hotspots.`,
        `Dampening: ${review.dampeningAssessment.adequate ? "adequate" : `${review.dampeningAssessment.riskNodes.length} risk nodes identified`}.`,
    ].join(" ");
    await writeTransaction(async (tx) => {
        // Ensure Structural Review Grid exists (idempotent)
        await tx.run(`MERGE (g:Grid {id: 'grid:structural-review'})
       ON CREATE SET g.name = 'Structural Review Grid',
                     g.content = 'Contains diagnostic findings from event-triggered structural reviews.',
                     g.type = 'structural-review',
                     g.status = 'active',
                     g.createdAt = datetime()`);
        // Create the finding Seed (distinct per review)
        await tx.run(`CREATE (s:Seed {
         id: $id,
         seedType: 'structural-review-finding',
         name: $name,
         content: $content,
         status: 'recorded',
         bloomId: $bloomId,
         globalLambda2: $globalLambda2,
         spectralGap: $spectralGap,
         globalFriction: $globalFriction,
         dampeningAdequate: $dampeningAdequate,
         triggerCount: $triggerCount,
         triggerEventIds: $triggerEventIds,
         createdAt: datetime()
       })
       WITH s
       MATCH (g:Grid {id: 'grid:structural-review'})
       MERGE (g)-[:CONTAINS]->(s)`, {
            id,
            name: `Structural review for ${bloomId}`,
            content,
            bloomId,
            globalLambda2: review.globalLambda2,
            spectralGap: review.spectralGap,
            globalFriction: review.frictionDistribution.globalFriction,
            dampeningAdequate: review.dampeningAssessment.adequate,
            triggerCount: triggers.length,
            triggerEventIds,
        });
    });
    return id;
}
// ============ ORCHESTRATION ============
/**
 * The immune response: check triggers, run review if needed, persist results.
 *
 * Usage:
 * ```
 * const result = await evaluateAndReviewIfNeeded(triggerState, 'bloom-id');
 * if (result) {
 *   // structural issues detected — result contains diagnostics + recommendations
 * }
 * ```
 *
 * @param state — Current trigger input values (from assembleTriggerState or caller)
 * @param bloomId — Optional: when provided, results persist to graph as ThresholdEvent + finding Seeds
 * @returns StructuralReviewResult with recommendations if any trigger fired, null if healthy
 */
export async function evaluateAndReviewIfNeeded(state, bloomId) {
    // Step 1: Check all trigger conditions
    const triggers = checkStructuralTriggers(state);
    // Step 2: If no triggers → system is healthy, no review needed
    if (triggers.length === 0)
        return null;
    // Step 3: Triggers fired — fetch graph data and run diagnostics
    const adjacency = await getPatternAdjacency();
    const patternsWithHealth = await getPatternsWithHealth();
    // Convert to GraphEdge[] and NodeHealth[]
    const edges = adjacency.map((a) => ({
        from: a.from,
        to: a.to,
        weight: a.weight,
    }));
    const nodeHealths = patternsWithHealth.map((p) => ({
        id: p.id,
        phiL: p.phiL,
    }));
    // Step 4: Run full structural review
    const review = runStructuralReview(edges, nodeHealths, triggers.map((t) => t.trigger));
    // Step 5: Derive actionable recommendations from diagnostics
    const recommendations = deriveRecommendations(review);
    // Step 6: Persist results to graph (M-22.7)
    let persistedObservationId;
    const augmentedTriggers = triggers.map((t) => ({ ...t }));
    if (bloomId) {
        try {
            const triggerEventIds = await persistTriggeredEvents(bloomId, triggers);
            // Attach ThresholdEvent IDs to triggers
            for (let i = 0; i < augmentedTriggers.length; i++) {
                augmentedTriggers[i].thresholdEventId = triggerEventIds[i];
            }
            persistedObservationId = await persistReviewResults(bloomId, review, triggers, triggerEventIds);
        }
        catch (err) {
            // Persistence failure should not break the immune response
            // The diagnostics still return — just without graph persistence
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`[IMMUNE] ⚠️  Persistence failed: ${msg}`);
        }
    }
    return {
        triggers: augmentedTriggers,
        review: {
            ...review,
            persistedObservationId,
            recommendations,
        },
    };
}
//# sourceMappingURL=immune-response.js.map