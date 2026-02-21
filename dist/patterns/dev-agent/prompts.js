/**
 * Build the prompt for each pipeline stage.
 */
export function buildStagePrompt(stage, input, task, correctionIteration) {
    const correctionNote = correctionIteration > 0
        ? "\n\n[CORRECTION " +
            correctionIteration +
            "]: Previous output did not meet quality threshold. Improve the response."
        : "";
    switch (stage) {
        case "scope":
            return [
                "SCOPE ANALYSIS — Define what needs to be done.",
                `Task type: ${task.taskType} | Complexity: ${task.complexity}`,
                task.domain ? `Domain: ${task.domain}` : "",
                `\nTask:\n${input}`,
                "\nProvide: 1) Clear scope boundaries, 2) Key requirements, 3) Risk factors.",
                correctionNote,
            ]
                .filter(Boolean)
                .join("\n");
        case "execute":
            return [
                "EXECUTION — Generate the solution.",
                `Task type: ${task.taskType} | Complexity: ${task.complexity}`,
                `\nInput:\n${input}`,
                correctionNote,
            ]
                .filter(Boolean)
                .join("\n");
        case "review":
            return [
                "CODE REVIEW — Assess the following output for quality, correctness, and edge cases.",
                `Task type: ${task.taskType} | Domain: ${task.domain ?? "general"}`,
                `Quality requirement: ${(task.qualityRequirement ?? 0.7) * 100}%`,
                `\nOutput to review:\n${input}`,
                "\nProvide: 1) Issues found, 2) Suggestions, 3) Quality assessment (0-1).",
                correctionNote,
            ]
                .filter(Boolean)
                .join("\n");
        case "validate":
            return [
                "VALIDATION — Verify architecture compliance and correctness.",
                `Task type: ${task.taskType}`,
                `\nOutput to validate:\n${input}`,
                "\nCheck: 1) Architecture compliance, 2) Rule conformance, 3) Completeness.",
                correctionNote,
            ]
                .filter(Boolean)
                .join("\n");
    }
}
//# sourceMappingURL=prompts.js.map