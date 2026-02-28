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
        console.log(`  DECOMPOSE: Model ${result.modelId} returned ${result.text.length} chars (${result.durationMs}ms)`);
        const parsed = parseTaskGraph(result.text, intentId);
        if (parsed) {
            console.log(`  DECOMPOSE: Parsed ${parsed.tasks.length} tasks in ${parsed.phases.length} phases (confidence: ${parsed.decomposition_confidence.toFixed(2)})`);
            return parsed;
        }
        console.error(`  DECOMPOSE: parseTaskGraph returned null. First 500 chars of response:\n${result.text.slice(0, 500)}`);
    }
    catch (err) {
        console.error(`  DECOMPOSE: LLM call failed:`, err instanceof Error ? err.message : err);
    }
    // Fallback: return stub
    console.warn(`  DECOMPOSE: Falling back to stub plan.`);
    return createStubTaskGraph(intent, intentId);
}
/**
 * Extract JSON from an LLM response that may contain preamble text,
 * markdown code fences, or postamble text.
 */
function extractJSON(text) {
    const trimmed = text.trim();
    // Try 1: Direct parse (pure JSON)
    try {
        JSON.parse(trimmed);
        return trimmed;
    }
    catch { /* not pure JSON */ }
    // Try 2: Extract from markdown code fence (anywhere in text)
    const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
        try {
            JSON.parse(fenceMatch[1].trim());
            return fenceMatch[1].trim();
        }
        catch { /* fence content wasn't valid JSON */ }
    }
    // Try 3: Find the outermost JSON object
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        const candidate = trimmed.slice(firstBrace, lastBrace + 1);
        try {
            JSON.parse(candidate);
            return candidate;
        }
        catch { /* not valid JSON between braces */ }
    }
    // Try 4: Find a bare JSON array (some models return tasks array directly)
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
        const candidate = trimmed.slice(firstBracket, lastBracket + 1);
        try {
            const parsed = JSON.parse(candidate);
            if (Array.isArray(parsed)) {
                return JSON.stringify({ tasks: parsed, phases: [], dependencies: [] });
            }
        }
        catch { /* not valid JSON array */ }
    }
    throw new Error(`Could not extract JSON from LLM response (${text.length} chars). First 300 chars: ${text.slice(0, 300)}`);
}
/**
 * Parse raw LLM text into a TaskGraph.
 * Handles: raw JSON, JSON in markdown fences, preamble/postamble text, and partial responses.
 * Returns null if parsing fails.
 */
function parseTaskGraph(raw, intentId) {
    try {
        const jsonStr = extractJSON(raw);
        console.log(`  DECOMPOSE: Extracted JSON (${jsonStr.length} chars from ${raw.length} chars raw)`);
        const data = JSON.parse(jsonStr);
        // Validate required fields exist
        if (!Array.isArray(data.tasks) || data.tasks.length === 0) {
            console.error(`  DECOMPOSE: No tasks array in parsed JSON. Keys: ${Object.keys(data).join(", ")}`);
            return null;
        }
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
        // Validate phases — synthesize a default if LLM omitted them
        let validPhases;
        if (Array.isArray(data.phases) && data.phases.length > 0) {
            validPhases = data.phases
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
        }
        else {
            // Synthesize a single default phase containing all tasks
            validPhases = [{
                    phase_id: "phase_1",
                    title: "Execution",
                    description: "Auto-generated phase (LLM did not provide phases)",
                    tasks: validTasks.map((t) => t.task_id),
                    gate: "human",
                    gate_criteria: "Human reviews phase output",
                }];
            console.warn(`  DECOMPOSE: No phases in LLM response — synthesized default phase for ${validTasks.length} tasks`);
        }
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
    catch (err) {
        console.error(`  DECOMPOSE: parseTaskGraph failed:`, err instanceof Error ? err.message : err);
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