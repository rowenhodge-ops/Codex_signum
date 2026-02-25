/**
 * DECOMPOSE stage — transforms survey output + intent into a TaskGraph.
 *
 * Calls an LLM via the injected ModelExecutor to produce a real
 * task decomposition. Falls back to stub on LLM or parse failure.
 *
 * Moved from DND-Manager agent/patterns/architect/decompose.ts.
 * Verdict: SPLIT — removed DND-specific `createArchitectLLM` import,
 * refactored to accept ModelExecutor as a parameter.
 */
import { MAX_TASKS_PER_PLAN } from "./types.js";
import { buildDecomposePrompt } from "./decompose-prompt.js";
export async function decompose(intent, survey, modelExecutor) {
    const intentId = survey.intent_id;
    try {
        const prompt = buildDecomposePrompt(intent, survey);
        const result = await modelExecutor.execute(prompt, {
            taskType: "planning",
            complexity: "complex",
            qualityRequirement: 0.7,
        });
        const parsed = parseTaskGraph(result.text, intentId);
        if (parsed) {
            return parsed;
        }
    }
    catch {
        // LLM decomposition failed — fall through to stub
    }
    // Fallback: return stub
    return createStubTaskGraph(intent, intentId);
}
/**
 * Parse raw LLM text into a TaskGraph.
 * Handles: raw JSON, JSON in markdown fences, and partial responses.
 * Returns null if parsing fails.
 */
function parseTaskGraph(raw, intentId) {
    try {
        // Strip markdown code fences if present
        let jsonStr = raw.trim();
        if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr
                .replace(/^```(?:json)?\s*\n?/, "")
                .replace(/\n?```\s*$/, "");
        }
        const data = JSON.parse(jsonStr);
        // Validate required fields exist
        if (!Array.isArray(data.tasks) || data.tasks.length === 0)
            return null;
        if (!Array.isArray(data.phases) || data.phases.length === 0)
            return null;
        // Enforce MAX_TASKS constraint
        if (data.tasks.length > MAX_TASKS_PER_PLAN) {
            data.tasks = data.tasks.slice(0, MAX_TASKS_PER_PLAN);
        }
        // Validate each task has required fields
        const validTasks = data.tasks
            .filter((t) => t.task_id && t.title && t.description && t.phase)
            .map((t) => ({
            task_id: String(t.task_id),
            title: String(t.title),
            description: String(t.description),
            acceptance_criteria: Array.isArray(t.acceptance_criteria)
                ? t.acceptance_criteria.map(String)
                : [String(t.acceptance_criteria ?? "Task completed")],
            type: t.type === "mechanical"
                ? "mechanical"
                : "generative",
            phase: String(t.phase),
            estimated_complexity: validateComplexity(t.estimated_complexity),
            files_affected: Array.isArray(t.files_affected)
                ? t.files_affected.map(String)
                : [],
            specification_refs: Array.isArray(t.specification_refs)
                ? t.specification_refs.map(String)
                : [],
            verification: String(t.verification ?? "npx tsc --noEmit"),
            commit_message: String(t.commit_message ?? t.title),
        }));
        if (validTasks.length === 0)
            return null;
        const validTaskIds = new Set(validTasks.map((t) => t.task_id));
        // Validate phases
        const validPhases = data.phases
            .filter((p) => p.phase_id && p.title)
            .map((p) => ({
            phase_id: String(p.phase_id),
            title: String(p.title),
            description: String(p.description ?? ""),
            tasks: Array.isArray(p.tasks)
                ? p.tasks.map(String).filter((id) => validTaskIds.has(id))
                : [],
            gate: p.gate === "auto" ? "auto" : "human",
            gate_criteria: String(p.gate_criteria ?? "Human reviews phase output"),
        }));
        // Validate dependencies — only keep those referencing valid tasks
        const validDeps = Array.isArray(data.dependencies)
            ? data.dependencies
                .filter((d) => validTaskIds.has(String(d.from)) && validTaskIds.has(String(d.to)))
                .map((d) => ({
                from: String(d.from),
                to: String(d.to),
                type: d.type === "soft" ? "soft" : "hard",
            }))
            : [];
        // Compute confidence based on how cleanly the LLM responded
        const rawTaskCount = data.tasks.length;
        const validRatio = validTasks.length / Math.max(rawTaskCount, 1);
        const confidence = Math.min(0.9, validRatio * 0.8 + 0.1);
        return {
            intent_id: intentId,
            tasks: validTasks,
            dependencies: validDeps,
            phases: validPhases,
            estimated_total_effort: validateEffort(data.estimated_total_effort),
            decomposition_confidence: confidence,
            assumptions: Array.isArray(data.assumptions)
                ? data.assumptions.map(String)
                : [],
        };
    }
    catch {
        return null;
    }
}
function validateComplexity(value) {
    const valid = ["trivial", "low", "medium", "high"];
    return valid.includes(String(value))
        ? String(value)
        : "medium";
}
function validateEffort(value) {
    const valid = ["small", "medium", "large", "epic"];
    return valid.includes(String(value))
        ? String(value)
        : "medium";
}
/**
 * Stub fallback — returns a placeholder TaskGraph when LLM fails.
 */
function createStubTaskGraph(intent, intentId) {
    const tasks = [
        {
            task_id: `${intentId}_t1`,
            title: "Placeholder task — LLM decomposition failed",
            description: `Decompose intent: "${intent}" — LLM call failed or response didn't parse. Run architect again.`,
            acceptance_criteria: [
                "LLM produces structured TaskGraph from intent + survey",
            ],
            type: "generative",
            phase: "phase_1",
            estimated_complexity: "high",
            files_affected: [],
            specification_refs: [],
            verification: "npx tsc --noEmit",
            commit_message: "Retry LLM decomposition",
        },
    ];
    const phases = [
        {
            phase_id: "phase_1",
            title: "Retry",
            description: "LLM decomposition failed — stub placeholder",
            tasks: [tasks[0].task_id],
            gate: "human",
            gate_criteria: "Human reviews placeholder plan",
        },
    ];
    return {
        intent_id: intentId,
        tasks,
        dependencies: [],
        phases,
        estimated_total_effort: "medium",
        decomposition_confidence: 0.1,
        assumptions: ["LLM decomposition failed — returning stub"],
    };
}
//# sourceMappingURL=decompose.js.map