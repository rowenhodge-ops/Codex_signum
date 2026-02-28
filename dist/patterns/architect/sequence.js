// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
export function sequence(taskGraph) {
    const ordered = topologicalSort(taskGraph);
    // Build phase boundaries
    const phaseBoundaries = {};
    ordered.forEach((taskId, index) => {
        const task = taskGraph.tasks.find((t) => t.task_id === taskId);
        if (task && !(task.phase in phaseBoundaries)) {
            phaseBoundaries[task.phase] = index;
        }
    });
    // Identify critical path (longest dependency chain)
    const criticalPath = findCriticalPath(taskGraph);
    return {
        intent_id: taskGraph.intent_id,
        ordered_tasks: ordered,
        phase_boundaries: phaseBoundaries,
        critical_path: criticalPath,
        estimated_duration: estimateDuration(taskGraph),
    };
}
function topologicalSort(graph) {
    // Kahn's algorithm
    const inDegree = new Map();
    const adjacency = new Map();
    // Initialize
    for (const task of graph.tasks) {
        inDegree.set(task.task_id, 0);
        adjacency.set(task.task_id, []);
    }
    // Build adjacency + in-degree
    for (const dep of graph.dependencies) {
        adjacency.get(dep.from)?.push(dep.to);
        inDegree.set(dep.to, (inDegree.get(dep.to) ?? 0) + 1);
    }
    // Queue nodes with in-degree 0
    const queue = [];
    for (const [taskId, degree] of inDegree) {
        if (degree === 0)
            queue.push(taskId);
    }
    // Sort: within same priority level, order by complexity ascending
    const complexityOrder = {
        trivial: 0,
        low: 1,
        medium: 2,
        high: 3,
    };
    queue.sort((a, b) => {
        const taskA = graph.tasks.find((t) => t.task_id === a);
        const taskB = graph.tasks.find((t) => t.task_id === b);
        return ((complexityOrder[taskA?.estimated_complexity ?? "medium"] ?? 2) -
            (complexityOrder[taskB?.estimated_complexity ?? "medium"] ?? 2));
    });
    const result = [];
    while (queue.length > 0) {
        const current = queue.shift();
        result.push(current);
        for (const neighbor of adjacency.get(current) ?? []) {
            const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0)
                queue.push(neighbor);
        }
    }
    if (result.length !== graph.tasks.length) {
        throw new Error("Circular dependency detected in task graph");
    }
    return result;
}
function findCriticalPath(graph) {
    // Simplified: find the longest chain through dependencies.
    // For foundation, return all tasks (conservative).
    return graph.tasks.map((t) => t.task_id);
}
function estimateDuration(graph) {
    const complexityMinutes = {
        trivial: 2,
        low: 5,
        medium: 15,
        high: 30,
    };
    const totalMinutes = graph.tasks.reduce((sum, t) => sum + (complexityMinutes[t.estimated_complexity] ?? 15), 0);
    if (totalMinutes < 60)
        return `~${totalMinutes} minutes`;
    return `~${Math.round((totalMinutes / 60) * 10) / 10} hours`;
}
//# sourceMappingURL=sequence.js.map