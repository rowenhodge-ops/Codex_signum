// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Cognitive Bloom -- Single Survey Cycle
 *
 * Runs: Survey -> Delta -> Intent -> Record Observation
 * Produces: CognitiveIntent (or null if no gaps found)
 *
 * This is NOT a pipeline stage. It's the Cognitive Bloom's operational cycle.
 * The output Intent Seed flows to the Architect through normal intent delivery.
 *
 * @module codex-signum-core/patterns/cognitive/cognitive-cycle
 */
import { surveyBloomTopology } from "./structural-survey.js";
import { queryTransformationDefinitions, computeConstitutionalDelta } from "./constitutional-delta.js";
import { synthesizeIntent } from "./intent-synthesis.js";
import { instantiateMorpheme } from "../../graph/instantiation.js";
/**
 * Run a single Cognitive Bloom survey cycle.
 *
 * Survey -> Delta -> Intent -> Record Observation
 *
 * @returns CognitiveIntent or null if no gaps found
 */
export async function runCognitiveCycle(options) {
    const { targetBloomId, definitionScopes, cycleNumber, maxChanges, priorityWeights, modelExecutor, cptSpecContent } = options;
    // 1. SURVEY
    console.log(`  [Cognitive] Surveying ${targetBloomId}...`);
    let survey;
    try {
        survey = await surveyBloomTopology(targetBloomId);
    }
    catch (err) {
        console.error(`  [Cognitive] Survey failed: ${err instanceof Error ? err.message : String(err)}`);
        return null;
    }
    console.log(`  [Cognitive] lambda2=${survey.lambda2}, psiH=${survey.psiH}, phiL=${survey.phiL}`);
    console.log(`  [Cognitive] Children: ${survey.children.length}, Inter-child Lines: ${survey.interChildLines.length}`);
    // 2. DELTA
    console.log(`  [Cognitive] Computing constitutional delta...`);
    const definitions = await queryTransformationDefinitions();
    const scopedDefs = definitions.filter((d) => definitionScopes.includes(d.scope));
    const gaps = computeConstitutionalDelta(survey, scopedDefs, definitionScopes);
    const constitutionalCount = gaps.filter((g) => g.gapType === "constitutional").length;
    const topologicalCount = gaps.filter((g) => g.gapType === "topological").length;
    console.log(`  [Cognitive] Gaps: ${constitutionalCount} constitutional, ${topologicalCount} topological`);
    if (gaps.length === 0) {
        console.log(`  [Cognitive] No gaps found. Topology matches constitution.`);
        await recordCycleObservation(cycleNumber, survey, gaps, null);
        return null;
    }
    // Build known node ID set for hallucination guard
    const knownNodeIds = new Set();
    knownNodeIds.add(survey.bloomId);
    for (const child of survey.children) {
        knownNodeIds.add(child.id);
        for (const m of child.internalMorphemes) {
            knownNodeIds.add(m.id);
        }
    }
    // 3. INTENT
    console.log(`  [Cognitive] Synthesizing intent (max ${maxChanges} changes)...`);
    const intent = await synthesizeIntent(gaps, cycleNumber, survey.lambda2, survey.psiH, maxChanges, priorityWeights, modelExecutor, cptSpecContent, knownNodeIds);
    console.log(`  [Cognitive] Intent: ${intent.proposedChanges.length} proposed changes (${intent.gapType})`);
    for (const change of intent.proposedChanges) {
        console.log(`    - ${change.changeType}: ${change.description}`);
    }
    // 4. RECORD OBSERVATION (justified: Learning Helix reads this)
    await recordCycleObservation(cycleNumber, survey, gaps, intent);
    return intent;
}
/**
 * Record a cycle observation in the Cognitive Bloom's Observation Grid.
 * Through the Instantiation Resonator -- no raw graph writes.
 */
async function recordCycleObservation(cycleNumber, survey, gaps, intent) {
    try {
        await instantiateMorpheme("seed", {
            id: `obs:cognitive:cycle-${cycleNumber}-${Date.now()}`,
            name: `Cognitive Cycle ${cycleNumber} Observation`,
            content: `Surveyed ${survey.bloomId}: lambda2=${survey.lambda2}, psiH=${survey.psiH}, phiL=${survey.phiL}. ` +
                `Found ${gaps.length} gaps (${gaps.filter((g) => g.gapType === "constitutional").length} constitutional, ` +
                `${gaps.filter((g) => g.gapType === "topological").length} topological). ` +
                (intent ? `Proposed ${intent.proposedChanges.length} changes.` : "No intent produced."),
            seedType: "observation",
            status: "recorded",
            cycleNumber,
            preLambda2: survey.lambda2,
            prePsiH: survey.psiH,
            prePhiL: survey.phiL,
            gapCount: gaps.length,
            proposedChangeCount: intent?.proposedChanges.length ?? 0,
        }, "grid:cognitive-observations");
    }
    catch {
        // Observation recording is non-fatal
    }
}
//# sourceMappingURL=cognitive-cycle.js.map