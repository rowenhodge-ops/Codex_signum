// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import "dotenv/config";
import { runQuery, closeDriver } from "../src/graph/client.js";

// ── Argument parsing ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const runIdArg = args.find((a) => a.startsWith("--run-id="));
const targetRunId = runIdArg?.split("=")[1];

// ── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  name: string;
  status: "PASS" | "FAIL" | "INFO" | "DEFERRED";
  detail: string;
}

const results: CheckResult[] = [];

function pass(name: string, detail: string) {
  results.push({ name, status: "PASS", detail });
  console.log(`  ✅ [PASS] ${name}: ${detail}`);
}

function fail(name: string, detail: string) {
  results.push({ name, status: "FAIL", detail });
  console.log(`  ❌ [FAIL] ${name}: ${detail}`);
}

function info(name: string, detail: string) {
  results.push({ name, status: "INFO", detail });
  console.log(`  ℹ️  [INFO] ${name}: ${detail}`);
}

function deferred(name: string, detail: string) {
  results.push({ name, status: "DEFERRED", detail });
  console.log(`  ⏳ [DEFERRED] ${name}: ${detail}`);
}

// ── Verification checks ─────────────────────────────────────────────────────

async function verify() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  M-9.VA Graph Verification");
  if (targetRunId) {
    console.log(`  Target run: ${targetRunId}`);
  } else {
    console.log("  Target run: most recent");
  }
  console.log("══════════════════════════════════════════════════════════════\n");

  // ── Check 0: Constitutional rules (baseline) ────────────────────────────

  console.log("── Check 0: Constitutional Rules (baseline) ──");
  const rules = await runQuery(
    "MATCH (r:ConstitutionalRule) RETURN r.name AS name, r.status AS status",
    {},
    "READ",
  );
  if (rules.records.length >= 10) {
    pass("Constitutional rules", `${rules.records.length} rules found`);
  } else {
    fail("Constitutional rules", `Expected ≥10, found ${rules.records.length}`);
  }

  // ── Check 1: PipelineRun nodes exist ────────────────────────────────────

  console.log("\n── Check 1: PipelineRun nodes ──");
  // Note: PipelineRun stores bloomId as a property, not as a relationship to Bloom
  // Exact match — no fuzzy matching (bloom_architect phantom was fixed in M-9.VA-FIX)
  const prQuery = targetRunId
    ? `MATCH (pr:PipelineRun)
       WHERE pr.id = $runId
       OPTIONAL MATCH (b:Bloom) WHERE b.id = pr.bloomId
       RETURN pr.id AS runId, pr.intent AS intent, pr.status AS status,
              pr.taskCount AS tasks, pr.overallQuality AS quality,
              coalesce(b.name, pr.bloomId) AS bloom
       ORDER BY pr.startedAt DESC LIMIT 5`
    : `MATCH (pr:PipelineRun)
       OPTIONAL MATCH (b:Bloom) WHERE b.id = pr.bloomId
       RETURN pr.id AS runId, pr.intent AS intent, pr.status AS status,
              pr.taskCount AS tasks, pr.overallQuality AS quality,
              coalesce(b.name, pr.bloomId) AS bloom
       ORDER BY pr.startedAt DESC LIMIT 5`;
  const prResult = await runQuery(prQuery, targetRunId ? { runId: targetRunId } : {}, "READ");

  if (prResult.records.length === 0) {
    fail("PipelineRun nodes", "No PipelineRun nodes found");
  } else {
    const first = prResult.records[0];
    const status = first.get("status");
    const tasks = first.get("tasks");
    const quality = first.get("quality");
    const bloom = first.get("bloom");
    const runId = first.get("runId");

    console.log(`  Run: ${runId}`);
    console.log(`  Status: ${status}, Tasks: ${tasks}, Quality: ${quality}, Bloom: ${bloom}`);

    if (status === "completed" && tasks > 0) {
      pass("PipelineRun nodes", `${prResult.records.length} run(s), latest: status=${status}, tasks=${tasks}, quality=${quality}`);
    } else {
      fail("PipelineRun nodes", `Latest run: status=${status}, tasks=${tasks} (expected completed with tasks > 0)`);
    }
  }

  // ── Check 2: TaskOutput nodes with correct relationships ────────────────

  console.log("\n── Check 2: TaskOutput nodes ──");
  const toQuery = targetRunId
    ? `MATCH (pr:PipelineRun)-[:PRODUCED]->(to:TaskOutput)
       WHERE pr.id = $runId
       RETURN pr.id AS runId, count(to) AS taskOutputs,
              avg(to.qualityScore) AS avgQuality,
              collect(DISTINCT to.modelUsed) AS models`
    : `MATCH (pr:PipelineRun)-[:PRODUCED]->(to:TaskOutput)
       WHERE pr.status = 'completed'
       WITH pr, to ORDER BY pr.startedAt DESC
       WITH pr, count(to) AS taskOutputs,
              avg(to.qualityScore) AS avgQuality,
              collect(DISTINCT to.modelUsed) AS models
       LIMIT 1
       RETURN pr.id AS runId, taskOutputs, avgQuality, models`;
  const toResult = await runQuery(toQuery, targetRunId ? { runId: targetRunId } : {}, "READ");

  if (toResult.records.length === 0) {
    fail("TaskOutput nodes", "No TaskOutput nodes found for pipeline run");
  } else {
    const rec = toResult.records[0];
    const count = rec.get("taskOutputs");
    const avgQ = rec.get("avgQuality");
    const models = rec.get("models");

    console.log(`  TaskOutputs: ${count}, Avg quality: ${avgQ?.toFixed?.(2) ?? avgQ}, Models: ${models}`);

    if (count > 0 && avgQ !== null) {
      pass("TaskOutput nodes", `${count} outputs, avg quality=${avgQ?.toFixed?.(2) ?? avgQ}, models=${models}`);
    } else {
      fail("TaskOutput nodes", `count=${count}, avgQuality=${avgQ}`);
    }
  }

  // ── Check 3: TaskOutputs linked to Stage Blooms ─────────────────────

  console.log("\n── Check 3: Stage Bloom linkage ──");
  // Note: relationship direction is (Stage)-[:PROCESSED]->(TaskOutput)
  const resQuery = targetRunId
    ? `MATCH (r:Stage)-[:PROCESSED]->(to:TaskOutput)<-[:PRODUCED]-(pr:PipelineRun)
       WHERE pr.id = $runId
       RETURN r.name AS stage, count(to) AS taskCount`
    : `MATCH (r:Stage)-[:PROCESSED]->(to:TaskOutput)
       RETURN r.name AS stage, count(to) AS taskCount`;
  const resResult = await runQuery(resQuery, targetRunId ? { runId: targetRunId } : {}, "READ");

  if (resResult.records.length === 0) {
    fail("Stage linkage", "No TaskOutputs linked to any Stage Bloom");
  } else {
    let dispatchFound = false;
    for (const rec of resResult.records) {
      const stage = rec.get("stage");
      const count = rec.get("taskCount");
      console.log(`  ${stage}: ${count} tasks`);
      if (stage === "DISPATCH") dispatchFound = true;
    }
    if (dispatchFound) {
      pass("Stage linkage", `${resResult.records.length} stage(s) with linked TaskOutputs`);
    } else {
      fail("Stage linkage", "DISPATCH Stage has no linked TaskOutputs");
    }
  }

  // ── Check 4: Decision nodes with quality outcomes ───────────────────────

  console.log("\n── Check 4: Decision quality scores ──");
  // Note: Decision nodes from Thompson routing don't carry a runId context.
  // We check for any Decisions with non-null qualityScore as evidence the Thompson loop closed.
  const decQuery = `MATCH (d:Decision)
       WHERE d.qualityScore IS NOT NULL
       RETURN count(d) AS decisionsWithQuality,
              avg(d.qualityScore) AS avgQuality,
              min(d.qualityScore) AS minQuality,
              max(d.qualityScore) AS maxQuality`;
  const decResult = await runQuery(decQuery, {}, "READ");

  if (decResult.records.length === 0 || decResult.records[0].get("decisionsWithQuality") === 0) {
    fail("Decision quality", "No Decision nodes with non-null qualityScore");
  } else {
    const rec = decResult.records[0];
    const count = rec.get("decisionsWithQuality");
    const avg = rec.get("avgQuality");
    const min = rec.get("minQuality");
    const max = rec.get("maxQuality");
    console.log(`  Decisions with quality: ${count}, avg=${avg?.toFixed?.(2) ?? avg}, min=${min?.toFixed?.(2) ?? min}, max=${max?.toFixed?.(2) ?? max}`);
    pass("Decision quality", `${count} decisions, avg=${avg?.toFixed?.(2) ?? avg}`);
  }

  // ── Check 5: Observation nodes linked to Architect Bloom ────────────────

  console.log("\n── Check 5: Observation nodes ──");
  // Note: Observations store sourceBloomId as a property, not as a relationship.
  // architectBloomId was standardised to "architect" in M-9.VA-FIX.
  const obsQuery = targetRunId
    ? `MATCH (o:Observation)
       WHERE o.context STARTS WITH $runId
       RETURN count(o) AS observations,
              avg(o.value) AS avgValue,
              collect(DISTINCT o.metric) AS metrics`
    : `MATCH (o:Observation)
       WHERE o.sourceBloomId IS NOT NULL
       RETURN count(o) AS observations,
              avg(o.value) AS avgValue,
              collect(DISTINCT o.metric) AS metrics`;
  const obsResult = await runQuery(obsQuery, targetRunId ? { runId: targetRunId } : {}, "READ");

  if (obsResult.records.length === 0 || obsResult.records[0].get("observations") === 0) {
    fail("Observation nodes", "No Observations linked to Architect Bloom");
  } else {
    const rec = obsResult.records[0];
    const count = rec.get("observations");
    const avgVal = rec.get("avgValue");
    const metrics = rec.get("metrics");
    console.log(`  Observations: ${count}, avg value=${avgVal?.toFixed?.(2) ?? avgVal}, metrics=${metrics}`);

    if (metrics && metrics.includes("task.quality")) {
      pass("Observation nodes", `${count} observations, metrics=${metrics}`);
    } else {
      fail("Observation nodes", `${count} observations but missing 'task.quality' metric (found: ${metrics})`);
    }
  }

  // ── Check 6: Analytics queries return data ──────────────────────────────

  console.log("\n── Check 6: Analytics queries ──");
  // Note: relationship direction is (Resonator)-[:PROCESSED]->(TaskOutput)
  const analyticsQuery = targetRunId
    ? `MATCH (r:Resonator {name: 'DISPATCH'})-[:PROCESSED]->(to:TaskOutput)<-[:PRODUCED]-(pr:PipelineRun)
       WHERE pr.id = $runId
       RETURN r.name AS stage,
              count(to) AS totalTasks,
              avg(to.qualityScore) AS avgQuality,
              sum(CASE WHEN to.status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded`
    : `MATCH (r:Resonator {name: 'DISPATCH'})-[:PROCESSED]->(to:TaskOutput)
       RETURN r.name AS stage,
              count(to) AS totalTasks,
              avg(to.qualityScore) AS avgQuality,
              sum(CASE WHEN to.status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded`;
  const analyticsResult = await runQuery(analyticsQuery, targetRunId ? { runId: targetRunId } : {}, "READ");

  if (analyticsResult.records.length === 0) {
    fail("Analytics queries", "DISPATCH stage analytics returned no rows");
  } else {
    const rec = analyticsResult.records[0];
    const total = rec.get("totalTasks");
    const avgQ = rec.get("avgQuality");
    const succeeded = rec.get("succeeded");
    console.log(`  DISPATCH: ${total} tasks, ${succeeded} succeeded, avg quality=${avgQ?.toFixed?.(2) ?? avgQ}`);

    if (total > 0) {
      pass("Analytics queries", `${total} tasks in DISPATCH, ${succeeded} succeeded`);
    } else {
      fail("Analytics queries", "DISPATCH has 0 tasks");
    }
  }

  // ── Check 7: HumanFeedback node ────────────────────────────────────────

  console.log("\n── Check 7: HumanFeedback ──");
  const hfQuery = targetRunId
    ? `MATCH (hf:HumanFeedback)-[:FEEDBACK_FOR]->(pr:PipelineRun)
       WHERE pr.id = $runId
       RETURN hf.verdict AS verdict, hf.reason AS reason, pr.id AS runId`
    : `MATCH (hf:HumanFeedback)-[:FEEDBACK_FOR]->(pr:PipelineRun)
       RETURN hf.verdict AS verdict, hf.reason AS reason, pr.id AS runId
       ORDER BY hf.timestamp DESC LIMIT 5`;
  const hfResult = await runQuery(hfQuery, targetRunId ? { runId: targetRunId } : {}, "READ");

  if (hfResult.records.length === 0) {
    deferred("HumanFeedback", "No HumanFeedback nodes found — requires Ro to run feedback.ts");
  } else {
    const rec = hfResult.records[0];
    const verdict = rec.get("verdict");
    const reason = rec.get("reason");
    console.log(`  Verdict: ${verdict}, Reason: ${reason}`);
    pass("HumanFeedback", `verdict=${verdict}`);
  }

  // ── Check 8: Memory persistence (distillation) ─────────────────────────

  console.log("\n── Check 8: Memory persistence (distillation) ──");
  const distQuery = `MATCH (d:Distillation) RETURN count(d) AS distillations`;
  const distResult = await runQuery(distQuery, {}, "READ");
  const distCount = distResult.records[0]?.get("distillations") ?? 0;
  console.log(`  Distillation nodes: ${distCount}`);

  if (distCount > 0) {
    info("Memory persistence", `${distCount} Distillation node(s) found — memory pipeline active`);
  } else {
    info("Memory persistence", "No Distillation nodes — expected if <10 observations with sufficient variance");
  }

  // ── Cleanup: Remove phantom "bloom_architect" Bloom if it exists ──────

  console.log("\n── Cleanup: phantom Bloom nodes ──");
  const phantomResult = await runQuery(
    `MATCH (b:Bloom { id: "bloom_architect" })
     WHERE NOT EXISTS { MATCH (b)<-[:CONTAINS]-() }
     DETACH DELETE b
     RETURN count(b) AS deleted`,
    {},
  );
  const phantomDeleted = phantomResult.records[0]?.get("deleted") ?? 0;
  if (phantomDeleted > 0) {
    console.log(`  [CLEANUP] Deleted phantom Bloom node "bloom_architect" (${phantomDeleted} removed)`);
  } else {
    console.log("  No phantom Bloom nodes found");
  }

  // ── Summary ────────────────────────────────────────────────────────────

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("══════════════════════════════════════════════════════════════");

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const deferred_count = results.filter((r) => r.status === "DEFERRED").length;
  const info_count = results.filter((r) => r.status === "INFO").length;

  for (const r of results) {
    const icon =
      r.status === "PASS" ? "✅" :
      r.status === "FAIL" ? "❌" :
      r.status === "DEFERRED" ? "⏳" : "ℹ️ ";
    console.log(`  ${icon} ${r.name}: ${r.detail}`);
  }

  console.log(`\n  ${passed} passed, ${failed} failed, ${deferred_count} deferred, ${info_count} info`);
  const required = results.filter((r) => r.status !== "INFO" && r.status !== "DEFERRED");
  const requiredPassed = required.filter((r) => r.status === "PASS").length;
  console.log(`  Required: ${requiredPassed}/${required.length} passed`);

  if (failed > 0) {
    console.log("\n  ❌ GATE: FAIL — required checks did not pass");
  } else {
    console.log("\n  ✅ GATE: PASS — all required checks passed");
  }
  console.log("══════════════════════════════════════════════════════════════");

  await closeDriver();

  if (failed > 0) {
    process.exit(1);
  }
}

verify().catch(async (err) => {
  console.error("FATAL:", err);
  await closeDriver().catch(() => {});
  process.exit(1);
});
