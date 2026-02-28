// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * GATE stage — presents the plan and collects human approval.
 *
 * Every plan requires human gate approval in V1
 * (constitutional rule: mandatory_human_gate_initial = true).
 *
 * Uses readline for terminal interaction. Supports auto-gate mode
 * for automated/testing scenarios.
 *
 * Moved from DND-Manager agent/patterns/architect/gate.ts.
 * Verdict: GENERIC — no DND imports.
 */

import type { PlanState, GateResponse } from "./types.js";
import * as readline from "readline";

export interface GateOptions {
  /** If true, automatically approve without prompting */
  autoApprove?: boolean;
}

export async function gate(
  planState: PlanState,
  options?: GateOptions,
): Promise<GateResponse> {
  // Auto-gate mode: approve without interaction
  if (options?.autoApprove) {
    return { decision: "approve" };
  }

  // Display plan summary to terminal
  presentPlan(planState);

  // Collect human decision
  const decision = await promptUser(
    "\nProceed with this plan? [approve / modify / abort]: ",
  );

  if (decision.startsWith("a") && !decision.startsWith("ab")) {
    return { decision: "approve" };
  } else if (decision.startsWith("m")) {
    const modifications = await promptUser("Describe modifications: ");
    return { decision: "modify", modifications };
  } else {
    const reason = await promptUser("Reason for abort (optional): ");
    return { decision: "abort", reason: reason || "User aborted" };
  }
}

function presentPlan(planState: PlanState): void {
  const { task_graph, execution_plan } = planState;
  if (!task_graph || !execution_plan) {
    console.log("\n⚠️  No plan to present.");
    return;
  }

  console.log("\n" + "═".repeat(60));
  console.log(`  ARCHITECT PLAN: ${planState.intent}`);
  console.log("═".repeat(60));
  console.log(`  Status: ${planState.status}`);
  console.log(`  Tasks: ${task_graph.tasks.length}`);
  console.log(`  Phases: ${task_graph.phases.length}`);
  console.log(`  Effort: ${task_graph.estimated_total_effort}`);
  console.log(`  Duration: ${execution_plan.estimated_duration}`);
  console.log(
    `  Confidence: ${(task_graph.decomposition_confidence * 100).toFixed(0)}%`,
  );

  if (task_graph.assumptions.length > 0) {
    console.log(`\n  Assumptions:`);
    task_graph.assumptions.forEach((a) => console.log(`    • ${a}`));
  }

  console.log(`\n  Tasks:`);
  execution_plan.ordered_tasks.forEach((taskId, i) => {
    const task = task_graph.tasks.find((t) => t.task_id === taskId);
    if (task) {
      const typeTag = task.type === "mechanical" ? "⚙️" : "🧠";
      console.log(
        `    ${i + 1}. ${typeTag} ${task.title} [${task.estimated_complexity}]`,
      );
    }
  });

  console.log("\n" + "═".repeat(60));
}

function promptUser(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}
