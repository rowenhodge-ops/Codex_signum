// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Synthesise an Intent Seed from Gap Seeds.
 *
 * @param gaps - Gap Seeds from Constitutional Delta Resonator
 * @param cycleNumber - Which survey cycle this is (for tracking)
 * @param preLambda2 - lambda2 before this cycle (for post-cycle comparison)
 * @param prePsiH - PsiH before this cycle
 * @param maxChanges - Max proposed changes per intent (from Config Seed)
 * @param priorityWeights - From Config Seed, calibrated by Learning Helix
 * @param modelExecutor - Optional: LLM substrate for topological gap reasoning
 * @param cptSpecContent - Optional: CPT v3 spec Seed content for topological context
 * @param knownNodeIds - Optional: set of valid node IDs for hallucination guard
 */
export async function synthesizeIntent(gaps, cycleNumber, preLambda2, prePsiH, maxChanges, priorityWeights, modelExecutor, cptSpecContent, knownNodeIds) {
    const timestamp = new Date().toISOString();
    // Empty gaps -- no intent needed
    if (gaps.length === 0) {
        return {
            intentId: `cognitive-intent-${cycleNumber}-${Date.now()}`,
            source: "cognitive-bloom",
            cycleNumber,
            timestamp,
            gapType: "constitutional",
            proposedChanges: [],
            preSurveyLambda2: preLambda2,
            preSurveyPsiH: prePsiH,
            governanceModifying: true,
        };
    }
    // Separate gap types
    const constitutionalGaps = gaps.filter((g) => g.gapType === "constitutional");
    const topologicalGaps = gaps.filter((g) => g.gapType === "topological");
    // Constitutional gaps -> deterministic intents
    const proposedChanges = [];
    for (const gap of constitutionalGaps) {
        if (gap.missingDefId) {
            // Missing instance -> propose creation
            const changeType = gap.missingDefId.includes("bloom")
                ? "create_bloom"
                : "create_resonator";
            proposedChanges.push({
                changeType,
                targetDefId: gap.missingDefId,
                description: `Create instance of ${gap.missingDefName ?? gap.missingDefId}`,
            });
        }
        else if (gap.missingLineSource) {
            // Missing Line -> propose wiring
            proposedChanges.push({
                changeType: "create_line",
                description: `Wire ${gap.missingLineType ?? "FLOWS_TO"} from ${gap.missingLineSource}${gap.missingLineTarget ? ` to ${gap.missingLineTarget}` : ""}`,
            });
        }
        else {
            // Empty stage or other structural gap
            proposedChanges.push({
                changeType: "create_resonator",
                description: gap.description,
            });
        }
    }
    // Topological gaps -> LLM-assisted intents (only if modelExecutor provided)
    if (topologicalGaps.length > 0 && modelExecutor) {
        const topologicalIntents = await synthesizeTopologicalIntents(topologicalGaps, modelExecutor, cptSpecContent, knownNodeIds);
        proposedChanges.push(...topologicalIntents);
    }
    else if (topologicalGaps.length > 0) {
        // No LLM -- record topological gaps as advisory descriptions
        for (const gap of topologicalGaps) {
            proposedChanges.push({
                changeType: "mutate",
                description: `[Advisory] ${gap.description}`,
            });
        }
    }
    // Score and truncate
    const scored = proposedChanges.map((change, i) => {
        const isConstitutional = i < constitutionalGaps.length;
        const gap = gaps[Math.min(i, gaps.length - 1)];
        const score = (isConstitutional ? priorityWeights.constitutional : 0) +
            ((gap?.expectedLambda2Delta ?? 0) * priorityWeights.lambda2) +
            (0 * priorityWeights.phiL); // phiL delta not known pre-execution
        return { change, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const truncated = scored.slice(0, maxChanges).map((s) => s.change);
    // Determine gap type
    const gapType = constitutionalGaps.length > 0 && topologicalGaps.length > 0
        ? "mixed"
        : constitutionalGaps.length > 0
            ? "constitutional"
            : "topological";
    return {
        intentId: `cognitive-intent-${cycleNumber}-${Date.now()}`,
        source: "cognitive-bloom",
        cycleNumber,
        timestamp,
        gapType,
        proposedChanges: truncated,
        preSurveyLambda2: preLambda2,
        preSurveyPsiH: prePsiH,
        governanceModifying: true,
    };
}
/**
 * Use LLM substrate to reason about topological gap resolution.
 * Validates all proposed node IDs against knownNodeIds to prevent hallucinations.
 */
async function synthesizeTopologicalIntents(gaps, modelExecutor, cptSpecContent, knownNodeIds) {
    const gapDescriptions = gaps.map((g) => `- ${g.description}`).join("\n");
    const nodeIdList = knownNodeIds ? Array.from(knownNodeIds).join(", ") : "(unknown)";
    const prompt = `You are reasoning about graph topology improvements for a Codex Signum ecosystem.

Current topological gaps:
${gapDescriptions}

Known node IDs in scope (ONLY use these as source/target for proposed edges):
${nodeIdList}

${cptSpecContent ? `CPT v3 spec context:\n${cptSpecContent.slice(0, 4000)}\n` : ""}

Propose specific FLOWS_TO Lines that would improve graph coherence (lambda2).
For each proposed Line, provide:
1. source_id: (must be from the known node ID list)
2. target_id: (must be from the known node ID list)
3. description: why this edge improves coherence

Respond in JSON array format:
[{"source_id": "...", "target_id": "...", "description": "..."}]

If no Lines would help, respond with an empty array: []`;
    try {
        const result = await modelExecutor.execute(prompt, {
            taskType: "analytical",
            complexity: "moderate",
        });
        // Parse LLM response
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch)
            return [];
        const proposed = JSON.parse(jsonMatch[0]);
        // Validate against known node IDs -- drop hallucinated references
        const validated = [];
        for (const p of proposed) {
            if (knownNodeIds) {
                if (!knownNodeIds.has(p.source_id)) {
                    console.warn(`  [Cognitive] Dropped hallucinated source_id: ${p.source_id}`);
                    continue;
                }
                if (!knownNodeIds.has(p.target_id)) {
                    console.warn(`  [Cognitive] Dropped hallucinated target_id: ${p.target_id}`);
                    continue;
                }
            }
            validated.push({
                changeType: "create_line",
                description: `FLOWS_TO from ${p.source_id} to ${p.target_id}: ${p.description}`,
            });
        }
        return validated;
    }
    catch (err) {
        console.warn(`  [Cognitive] LLM topological reasoning failed: ${err instanceof Error ? err.message : String(err)}`);
        return [];
    }
}
//# sourceMappingURL=intent-synthesis.js.map