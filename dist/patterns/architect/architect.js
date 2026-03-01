// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { decompose } from "./decompose.js";
import { parallelDecompose } from "./parallel-decompose.js";
import { classify } from "./classify.js";
import { sequence } from "./sequence.js";
import { gate } from "./gate.js";
import { dispatch } from "./dispatch.js";
import { adapt } from "./adapt.js";
/**
 * Execute a full architect plan.
 *
 * The caller is responsible for:
 * 1. Running SURVEY (via core's survey function or their own)
 * 2. Converting the result to PipelineSurveyOutput
 * 3. Passing it here along with the executors
 *
 * If no survey is provided, the pipeline starts from DECOMPOSE
 * with a minimal survey stub.
 */
export async function executePlan(intent, repoPath, config, surveyOutput) {
    const planId = `plan_${Date.now()}`;
    // Create initial plan state
    let planState = {
        plan_id: planId,
        intent,
        status: "surveying",
        task_outcomes: [],
        adaptations_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    // 1. SURVEY — use provided output or create minimal stub
    planState.survey = surveyOutput ?? createMinimalSurvey(intent);
    planState.status = "decomposing";
    planState.updated_at = new Date().toISOString();
    // 2. DECOMPOSE (repoPath enables directory listing + file path validation)
    const decomposeAttempts = config.decomposeAttempts ?? 1;
    if (decomposeAttempts > 1) {
        planState.task_graph = await parallelDecompose(intent, planState.survey, config.modelExecutor, { n: decomposeAttempts, parallel: config.parallelDecompose ?? false }, repoPath);
    }
    else {
        planState.task_graph = await decompose(intent, planState.survey, config.modelExecutor, repoPath);
    }
    planState.status = "classifying";
    planState.updated_at = new Date().toISOString();
    // 3. CLASSIFY
    planState.task_graph = classify(planState.task_graph);
    planState.status = "sequencing";
    planState.updated_at = new Date().toISOString();
    // 4. SEQUENCE
    planState.execution_plan = sequence(planState.task_graph);
    planState.status = "gated";
    planState.updated_at = new Date().toISOString();
    // 5. GATE
    const gateResponse = await gate(planState, {
        autoApprove: config.autoGate,
    });
    if (gateResponse.decision === "abort") {
        planState.status = "aborted";
        planState.updated_at = new Date().toISOString();
        return planState;
    }
    if (gateResponse.decision === "modify") {
        // Full modification loop not yet implemented
        planState.status = "aborted";
        planState.updated_at = new Date().toISOString();
        return planState;
    }
    // 6. DISPATCH
    planState = await dispatch(planState, config.taskExecutor, {
        repoPath,
        dryRun: config.dryRun,
    });
    planState.updated_at = new Date().toISOString();
    // 7. Check for failures → ADAPT
    const failures = planState.task_outcomes.filter((o) => !o.success);
    if (failures.length > 0) {
        for (const failure of failures) {
            const result = adapt(planState, failure);
            if (result.should_halt) {
                planState.status = "aborted";
                break;
            }
            if (result.modified_plan) {
                planState = result.modified_plan;
            }
        }
    }
    return planState;
}
function createMinimalSurvey(intent) {
    return {
        intent_id: `intent_${Date.now()}`,
        codebase_state: {
            structure: "(no survey performed)",
            recent_changes: [],
            test_status: "unknown",
            open_issues: [],
        },
        graph_state: {
            pattern_health: {},
            active_cascades: 0,
            constitutional_alerts: [],
        },
        gap_analysis: {
            what_exists: [],
            what_needs_building: [intent],
            what_needs_changing: [],
            risks: ["No survey performed — operating blind"],
        },
        confidence: 0.1,
        blind_spots: ["Full survey not performed"],
    };
}
//# sourceMappingURL=architect.js.map