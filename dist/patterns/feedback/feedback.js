// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/** Refinement scale: immediate issues in recent pipeline runs. */
export function checkRefinementScale(state) {
    const recs = [];
    const recent = state.pipelineResults.slice(-5);
    const avgRefinements = recent.reduce((sum, r) => sum + r.refinementCount, 0) /
        Math.max(1, recent.length);
    if (avgRefinements > 2) {
        recs.push({
            scale: "refinement",
            action: "High refinement rate detected. Consider: 1) Improving prompts, 2) Adjusting quality threshold, 3) Routing to stronger models.",
            confidence: 0.8,
            evidence: [
                `Average refinements per pipeline: ${avgRefinements.toFixed(1)}`,
                `Sample size: ${recent.length} recent pipelines`,
            ],
        });
    }
    for (const stage of ["scope", "execute", "review", "validate"]) {
        const stageResults = recent.flatMap((r) => r.stages.filter((s) => s.stage === stage));
        const avgQuality = stageResults.reduce((sum, s) => sum + s.qualityScore, 0) /
            Math.max(1, stageResults.length);
        if (stageResults.length >= 3 && avgQuality < 0.5) {
            recs.push({
                scale: "refinement",
                action: `Stage '${stage}' consistently underperforming (avg quality: ${avgQuality.toFixed(2)}). Route to different model or improve stage prompt.`,
                confidence: 0.7,
                evidence: stageResults.map((s) => `${s.modelId}: q=${s.qualityScore.toFixed(2)}`),
            });
        }
    }
    return recs;
}
/** Learning scale: session-level patterns. */
export function checkLearningScale(state) {
    const recs = [];
    if (state.epsilonR.range === "rigid") {
        recs.push({
            scale: "learning",
            action: "Exploration rate is too low (rigid). Force exploration to discover potentially better model assignments.",
            confidence: 0.9,
            evidence: [
                `εR = ${state.epsilonR.value.toFixed(3)}`,
                `Exploratory: ${state.epsilonR.exploratoryDecisions}/${state.epsilonR.totalDecisions}`,
            ],
        });
    }
    if (state.epsilonR.range === "unstable") {
        recs.push({
            scale: "learning",
            action: "Exploration rate is too high (unstable). Decisions are inconsistent — allow more exploitation.",
            confidence: 0.8,
            evidence: [
                `εR = ${state.epsilonR.value.toFixed(3)}`,
                `Exploratory: ${state.epsilonR.exploratoryDecisions}/${state.epsilonR.totalDecisions}`,
            ],
        });
    }
    const modelUsage = new Map();
    for (const decision of state.decisionsThisSession) {
        modelUsage.set(decision.selected, (modelUsage.get(decision.selected) ?? 0) + 1);
    }
    if (state.decisionsThisSession.length >= 10) {
        for (const [modelId, count] of modelUsage) {
            const fraction = count / state.decisionsThisSession.length;
            if (fraction > 0.8) {
                recs.push({
                    scale: "learning",
                    action: `Model '${modelId}' dominates routing (${(fraction * 100).toFixed(0)}% of decisions). Consider forcing exploration of alternatives.`,
                    confidence: 0.7,
                    evidence: [
                        `${modelId}: ${count}/${state.decisionsThisSession.length} decisions`,
                    ],
                });
            }
        }
    }
    return recs;
}
/** Evolutionary scale: cross-session patterns (from distillations). */
export function checkEvolutionaryScale(state) {
    const recs = [];
    if (state.distillations.length >= 5) {
        const avgConfidence = state.distillations.reduce((sum, d) => sum + d.confidence, 0) /
            state.distillations.length;
        if (avgConfidence > 0.7) {
            recs.push({
                scale: "evolutionary",
                action: `${state.distillations.length} distillations with high confidence (${avgConfidence.toFixed(2)}). Consider promoting to institutional knowledge.`,
                confidence: avgConfidence,
                evidence: state.distillations.map((d) => `${d.category}: ${d.insight.slice(0, 80)}...`),
            });
        }
    }
    return recs;
}
//# sourceMappingURL=feedback.js.map