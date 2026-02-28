// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
export function classify(taskGraph) {
    const classifiedTasks = taskGraph.tasks.map((task) => ({
        ...task,
        type: classifyTask(task),
    }));
    return { ...taskGraph, tasks: classifiedTasks };
}
function classifyTask(task) {
    // Heuristic classification based on the design spec:
    // - File renames, moves, import updates → mechanical
    // - New files, architecture changes → generative
    const description = (task.description + " " + task.title).toLowerCase();
    const mechanicalKeywords = [
        "rename",
        "move",
        "import",
        "re-export",
        "reexport",
        "update path",
        "fix typo",
        "delete",
        "remove unused",
    ];
    const generativeKeywords = [
        "create",
        "implement",
        "design",
        "architect",
        "build",
        "add feature",
        "new module",
        "refactor",
    ];
    const mechanicalScore = mechanicalKeywords.filter((k) => description.includes(k)).length;
    const generativeScore = generativeKeywords.filter((k) => description.includes(k)).length;
    // Default to generative (safer — gets full pipeline validation)
    if (mechanicalScore > generativeScore)
        return "mechanical";
    return "generative";
}
//# sourceMappingURL=classify.js.map