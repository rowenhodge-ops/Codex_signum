/**
 * Parallel Decompose — Best-of-N strategy for plan quality.
 *
 * Research integration:
 * - Best-of-N: generate N decompositions, score each, pick best (log(N) improvement)
 * - Self-MoA: same strong model N times > mixing different models
 * - Short-m@k: take first M completions from K parallel runs (future: async race)
 *
 * Scoring heuristic evaluates:
 * - Decomposition confidence (from LLM response parse quality)
 * - Task count reasonableness (not too few, not too many)
 * - Coverage of survey gaps (do tasks address what_needs_building?)
 * - Internal consistency (no orphaned tasks, dependencies make sense)
 *
 * Falls back to single decompose when N=1 or all attempts fail.
 */

import type {
  PipelineSurveyOutput,
  TaskGraph,
  ModelExecutor,
} from "./types.js";
import { decompose } from "./decompose.js";

export interface ParallelDecomposeOptions {
  /** Number of parallel decompose attempts (default: 3) */
  n?: number;
  /** Run attempts in parallel (true) or sequential (false, default) */
  parallel?: boolean;
}

export interface ScoredPlan {
  graph: TaskGraph;
  score: number;
  breakdown: {
    confidence: number;
    taskCountScore: number;
    coverageScore: number;
    consistencyScore: number;
  };
}

/**
 * Run decompose N times and return the best-scoring plan.
 */
export async function parallelDecompose(
  intent: string,
  survey: PipelineSurveyOutput,
  modelExecutor: ModelExecutor,
  options: ParallelDecomposeOptions = {},
): Promise<TaskGraph> {
  const { n = 3, parallel = false } = options;

  // Single attempt — just call decompose directly
  if (n <= 1) {
    return decompose(intent, survey, modelExecutor);
  }

  console.log(
    `  🔀 Parallel decompose: generating ${n} plans (${parallel ? "parallel" : "sequential"})...`,
  );

  // Generate N decompositions
  let graphs: TaskGraph[];
  if (parallel) {
    const attempts = Array.from({ length: n }, () =>
      decompose(intent, survey, modelExecutor).catch(() => null),
    );
    const results = await Promise.all(attempts);
    graphs = results.filter((g): g is TaskGraph => g !== null);
  } else {
    graphs = [];
    for (let i = 0; i < n; i++) {
      try {
        const graph = await decompose(intent, survey, modelExecutor);
        graphs.push(graph);
        console.log(
          `    Plan ${i + 1}/${n}: ${graph.tasks.length} tasks, confidence ${(graph.decomposition_confidence * 100).toFixed(0)}%`,
        );
      } catch {
        console.log(`    Plan ${i + 1}/${n}: failed`);
      }
    }
  }

  // If all failed, fall back to single attempt (which returns stub on failure)
  if (graphs.length === 0) {
    console.log(
      "  ⚠️ All parallel attempts failed — falling back to single decompose",
    );
    return decompose(intent, survey, modelExecutor);
  }

  // Score each plan
  const scored = graphs.map((graph) => scorePlan(graph, survey, intent));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Log results
  console.log(
    `  📊 Plan scores: [${scored.map((s) => s.score.toFixed(2)).join(", ")}]`,
  );
  console.log(
    `  ✅ Selected plan: ${scored[0].graph.tasks.length} tasks, score ${scored[0].score.toFixed(2)}`,
  );
  if (scored.length > 1) {
    const delta = scored[0].score - scored[scored.length - 1].score;
    console.log(
      `     Spread: ${delta.toFixed(2)} (${delta > 0.2 ? "high variance — plans differed significantly" : "low variance — consistent decomposition"})`,
    );
  }

  return scored[0].graph;
}

/**
 * Score a TaskGraph on quality heuristics.
 * Returns 0-1 composite score.
 */
export function scorePlan(
  graph: TaskGraph,
  survey: PipelineSurveyOutput,
  _intent: string,
): ScoredPlan {
  // 1. Decomposition confidence (0-1, from parse quality)
  const confidence = graph.decomposition_confidence;

  // 2. Task count reasonableness (prefer 3-8 tasks, penalise extremes)
  const taskCount = graph.tasks.length;
  let taskCountScore: number;
  if (taskCount >= 3 && taskCount <= 8) {
    taskCountScore = 1.0;
  } else if (taskCount === 1 || taskCount === 2) {
    taskCountScore = 0.4; // Suspiciously few
  } else if (taskCount >= 9 && taskCount <= 12) {
    taskCountScore = 0.7; // Acceptable but complex
  } else {
    taskCountScore = 0.3; // Either 0 or >12
  }

  // 3. Coverage: do tasks address the survey's what_needs_building?
  const needsBuilding = survey.gap_analysis.what_needs_building;
  let coverageScore = 1.0;
  if (needsBuilding.length > 0) {
    const taskText = graph.tasks
      .map((t) => `${t.title} ${t.description}`)
      .join(" ")
      .toLowerCase();
    const covered = needsBuilding.filter((need) =>
      taskText.includes(need.toLowerCase().split(" ")[0]),
    ).length;
    coverageScore = covered / needsBuilding.length;
  }

  // 4. Internal consistency
  let consistencyScore = 1.0;
  const taskIds = new Set(graph.tasks.map((t) => t.task_id));

  // Check for orphaned dependencies
  const orphanedDeps = graph.dependencies.filter(
    (d) => !taskIds.has(d.from) || !taskIds.has(d.to),
  );
  if (orphanedDeps.length > 0) {
    consistencyScore -= 0.3;
  }

  // Check all tasks belong to declared phases
  const phaseTaskIds = new Set(graph.phases.flatMap((p) => p.tasks));
  const unassigned = graph.tasks.filter(
    (t) => !phaseTaskIds.has(t.task_id),
  );
  if (unassigned.length > 0) {
    consistencyScore -= 0.2;
  }

  // Check phases aren't empty
  const emptyPhases = graph.phases.filter((p) => p.tasks.length === 0);
  if (emptyPhases.length > 0) {
    consistencyScore -= 0.1;
  }

  consistencyScore = Math.max(0, consistencyScore);

  // Weighted composite (confidence matters most, then consistency)
  const score =
    confidence * 0.35 +
    taskCountScore * 0.2 +
    coverageScore * 0.2 +
    consistencyScore * 0.25;

  return {
    graph,
    score,
    breakdown: { confidence, taskCountScore, coverageScore, consistencyScore },
  };
}
