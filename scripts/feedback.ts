#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Human Feedback CLI — breaks LLM-evaluating-LLM circularity.
 *
 * Usage:
 *   npx tsx scripts/feedback.ts accept <runId> ["optional reason"]
 *   npx tsx scripts/feedback.ts reject <runId> "reason required"
 *   npx tsx scripts/feedback.ts partial <runId> --accept=t1,t3 --reject=t2,t4 "reason"
 *   npx tsx scripts/feedback.ts calibrate
 *   npx tsx scripts/feedback.ts pending
 *
 * Thompson reads adjustedQuality (human-calibrated) when available,
 * falls back to qualityScore (LLM-only). Over time, this creates a
 * calibration signal that corrects systematic LLM scoring biases.
 */

import {
  recordHumanFeedback,
  getCalibrationMetrics,
  listPendingFeedbackRuns,
  getHumanFeedbackForRun,
} from "../src/graph/queries.js";
import type { HumanFeedbackProps } from "../src/graph/queries.js";
import { getDriver, closeDriver } from "../src/graph/client.js";

function generateId(): string {
  return `hf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseTaskVerdicts(
  args: string[],
): HumanFeedbackProps["taskVerdicts"] | undefined {
  const acceptArg = args.find((a) => a.startsWith("--accept="));
  const rejectArg = args.find((a) => a.startsWith("--reject="));

  if (!acceptArg && !rejectArg) return undefined;

  const verdicts: NonNullable<HumanFeedbackProps["taskVerdicts"]> = [];

  if (acceptArg) {
    const taskIds = acceptArg.replace("--accept=", "").split(",");
    for (const taskId of taskIds) {
      verdicts.push({ taskId: taskId.trim(), verdict: "accept" });
    }
  }

  if (rejectArg) {
    const taskIds = rejectArg.replace("--reject=", "").split(",");
    for (const taskId of taskIds) {
      verdicts.push({ taskId: taskId.trim(), verdict: "reject" });
    }
  }

  return verdicts.length > 0 ? verdicts : undefined;
}

function extractReason(args: string[]): string | undefined {
  // Reason is any arg that doesn't start with --
  const reasonParts = args.filter(
    (a) => !a.startsWith("--accept=") && !a.startsWith("--reject="),
  );
  return reasonParts.length > 0 ? reasonParts.join(" ") : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    printUsage();
    process.exit(1);
  }

  // Ensure driver is connected
  getDriver();

  try {
    switch (command) {
      case "accept": {
        const runId = args[1];
        if (!runId) {
          console.error("Error: runId is required for accept");
          process.exit(1);
        }
        const reason = extractReason(args.slice(2));
        await recordHumanFeedback({
          id: generateId(),
          runId,
          verdict: "accept",
          reason,
        });
        console.log(`\u2705 Run ${runId} accepted${reason ? `: ${reason}` : ""}`);
        break;
      }

      case "reject": {
        const runId = args[1];
        if (!runId) {
          console.error("Error: runId is required for reject");
          process.exit(1);
        }
        const reason = extractReason(args.slice(2));
        if (!reason) {
          console.error("Error: rejection requires a reason");
          console.error("Usage: feedback.ts reject <runId> \"reason\"");
          process.exit(1);
        }
        await recordHumanFeedback({
          id: generateId(),
          runId,
          verdict: "reject",
          reason,
        });
        console.log(`\u274c Run ${runId} rejected: ${reason}`);
        break;
      }

      case "partial": {
        const runId = args[1];
        if (!runId) {
          console.error("Error: runId is required for partial");
          process.exit(1);
        }
        const restArgs = args.slice(2);
        const taskVerdicts = parseTaskVerdicts(restArgs);
        const reason = extractReason(restArgs);
        if (!taskVerdicts) {
          console.error(
            "Error: partial requires --accept=t1,t2 and/or --reject=t3,t4",
          );
          process.exit(1);
        }
        await recordHumanFeedback({
          id: generateId(),
          runId,
          verdict: "partial",
          reason,
          taskVerdicts,
        });
        const accepted = taskVerdicts.filter(
          (t) => t.verdict === "accept",
        ).length;
        const rejected = taskVerdicts.filter(
          (t) => t.verdict === "reject",
        ).length;
        console.log(
          `\u2696\ufe0f Run ${runId} partial: ${accepted} accepted, ${rejected} rejected`,
        );
        break;
      }

      case "calibrate": {
        const metrics = await getCalibrationMetrics();
        console.log("\n\u2550\u2550\u2550 CALIBRATION METRICS \u2550\u2550\u2550");
        console.log(`Total runs with feedback: ${metrics.totalRuns}`);
        console.log(
          `  Accepted: ${metrics.accepted}  Rejected: ${metrics.rejected}  Partial: ${metrics.partial}`,
        );
        console.log(
          `Accept rate: ${(metrics.acceptRate * 100).toFixed(1)}%`,
        );
        console.log(
          `Validator precision: ${(metrics.validatorPrecision * 100).toFixed(1)}%`,
        );
        console.log(
          `Validator recall: ${(metrics.validatorRecall * 100).toFixed(1)}%`,
        );
        if (metrics.totalRuns === 0) {
          console.log(
            "\nNo feedback recorded yet. Run pipeline and provide feedback to start calibrating.",
          );
        }
        break;
      }

      case "pending": {
        const runs = await listPendingFeedbackRuns();
        if (runs.length === 0) {
          console.log("No runs awaiting feedback.");
        } else {
          console.log("\n\u23f3 RUNS AWAITING FEEDBACK");
          console.log("-".repeat(60));
          for (const run of runs) {
            console.log(
              `  ${run.runId}  (${run.taskCount} tasks, ${run.timestamp})`,
            );
          }
          console.log(
            `\n${runs.length} run(s) awaiting feedback.`,
          );
          console.log(
            "Usage: feedback.ts <accept|reject|partial> <runId> [reason]",
          );
        }
        break;
      }

      case "status": {
        const runId = args[1];
        if (!runId) {
          console.error("Error: runId is required for status");
          process.exit(1);
        }
        const feedback = await getHumanFeedbackForRun(runId);
        if (feedback) {
          const hf = feedback.get("hf");
          console.log(`Run ${runId}: ${hf.properties.verdict}`);
          if (hf.properties.reason) {
            console.log(`  Reason: ${hf.properties.reason}`);
          }
          console.log(`  Recorded: ${hf.properties.timestamp}`);
        } else {
          console.log(`Run ${runId}: no feedback recorded`);
        }
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } finally {
    await closeDriver();
  }
}

function printUsage() {
  console.log(`
Human Feedback CLI — breaks LLM-evaluating-LLM circularity

Usage:
  feedback.ts accept <runId> ["optional reason"]
  feedback.ts reject <runId> "reason required"
  feedback.ts partial <runId> --accept=t1,t3 --reject=t2,t4 "reason"
  feedback.ts calibrate
  feedback.ts pending
  feedback.ts status <runId>
`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
