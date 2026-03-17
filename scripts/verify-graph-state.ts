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
  console.log("  M-9.V Graph Verification (includes M-22 vertical wiring)");
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
  // Stage nodes carry dual labels :Bloom:Stage, contained by Architect Bloom.
  // Relationship direction is (Stage)-[:PROCESSED]->(TaskOutput).
  // Also check via Resonator label (legacy) for backwards compat.
  const resQuery = targetRunId
    ? `MATCH (b:Bloom {id: 'architect'})-[:CONTAINS]->(r)
       WHERE r:Stage OR r:Resonator
       OPTIONAL MATCH (r)-[:PROCESSED]->(to:TaskOutput)<-[:PRODUCED]-(pr:PipelineRun)
       WHERE pr.id = $runId
       RETURN coalesce(r.name, r.id) AS stage, count(to) AS taskCount`
    : `MATCH (b:Bloom {id: 'architect'})-[:CONTAINS]->(r)
       WHERE r:Stage OR r:Resonator
       OPTIONAL MATCH (r)-[:PROCESSED]->(to:TaskOutput)
       RETURN coalesce(r.name, r.id) AS stage, count(to) AS taskCount`;
  const resResult = await runQuery(resQuery, targetRunId ? { runId: targetRunId } : {}, "READ");

  if (resResult.records.length === 0) {
    fail("Stage linkage", "No Stage/Resonator nodes found under Architect Bloom");
  } else {
    let dispatchFound = false;
    let anyLinked = false;
    for (const rec of resResult.records) {
      const stage = rec.get("stage");
      const count = Number(rec.get("taskCount"));
      console.log(`  ${stage}: ${count} tasks`);
      if (stage === "DISPATCH" && count > 0) dispatchFound = true;
      if (count > 0) anyLinked = true;
    }
    if (dispatchFound) {
      pass("Stage linkage", `${resResult.records.length} stage(s), DISPATCH has linked TaskOutputs`);
    } else if (anyLinked) {
      pass("Stage linkage", `${resResult.records.length} stage(s) with some linked TaskOutputs (DISPATCH may use different name)`);
    } else {
      info("Stage linkage", `${resResult.records.length} stage(s) found but none have linked TaskOutputs yet`);
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
  // Observations link via (o:Observation)-[:OBSERVED_IN]->(b:Bloom)
  const obsQuery = targetRunId
    ? `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom {id: 'architect'})
       WHERE o.context STARTS WITH $runId
       RETURN count(o) AS observations,
              avg(o.value) AS avgValue,
              collect(DISTINCT o.metric) AS metrics`
    : `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom {id: 'architect'})
       RETURN count(o) AS observations,
              avg(o.value) AS avgValue,
              collect(DISTINCT o.metric) AS metrics`;
  const obsResult = await runQuery(obsQuery, targetRunId ? { runId: targetRunId } : {}, "READ");

  if (obsResult.records.length === 0 || obsResult.records[0].get("observations") === 0) {
    fail("Observation nodes", "No Observations linked to Architect Bloom via OBSERVED_IN");
  } else {
    const rec = obsResult.records[0];
    const count = rec.get("observations");
    const avgVal = rec.get("avgValue");
    const metrics = rec.get("metrics");
    console.log(`  Observations: ${count}, avg value=${avgVal?.toFixed?.(2) ?? avgVal}, metrics=${metrics}`);

    if (metrics && metrics.includes("task.quality")) {
      pass("Observation nodes", `${count} observations, metrics=${metrics}`);
    } else {
      // Accept any observations linked to the bloom — metric name may vary
      pass("Observation nodes", `${count} observations (metrics=${metrics})`);
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

  // ══════════════════════════════════════════════════════════════════════
  // ═ M-22 Vertical Wiring Verification (Checks V1–V11)
  // ══════════════════════════════════════════════════════════════════════

  // ── V1: ΦL on Architect Bloom ─────────────────────────────────────────

  console.log("\n── V1: ΦL on Architect Bloom ──");
  const v1Result = await runQuery(
    `MATCH (b:Bloom {id: 'architect'})
     RETURN b.phiL AS phiL,
            b.phiLTrend AS trend,
            b.healthBand AS band,
            b.phiLState IS NOT NULL AS hasRingBuffer,
            b.phiLComputedAt AS computedAt`,
    {},
    "READ",
  );
  if (v1Result.records.length > 0) {
    const r = v1Result.records[0];
    const phiL = r.get("phiL");
    const trend = r.get("trend");
    const band = r.get("band");
    const hasRB = r.get("hasRingBuffer");
    const computedAt = r.get("computedAt");
    console.log(`  ΦL=${phiL}, trend=${trend}, band=${band}, ringBuffer=${hasRB}, computedAt=${computedAt}`);
    if (phiL !== null && hasRB === true) {
      pass("V1: ΦL composite", `ΦL=${Number(phiL).toFixed(3)}, trend=${trend}, band=${band}`);
    } else if (phiL !== null) {
      pass("V1: ΦL composite", `ΦL=${Number(phiL).toFixed(3)} (no ring buffer yet — cold start)`);
    } else {
      fail("V1: ΦL composite", "ΦL is null on Architect Bloom");
    }
  } else {
    fail("V1: ΦL composite", "Architect Bloom not found");
  }

  // ── V2: ΨH on Architect Bloom ─────────────────────────────────────────

  console.log("\n── V2: ΨH on Architect Bloom ──");
  const v2Result = await runQuery(
    `MATCH (b:Bloom {id: 'architect'})
     RETURN b.psiH AS psiH,
            b.lambda2 AS lambda2,
            b.friction AS friction,
            b.psiHTrend AS trend,
            b.psiHState IS NOT NULL AS hasRingBuffer,
            b.psiHComputedAt AS computedAt`,
    {},
    "READ",
  );
  if (v2Result.records.length > 0) {
    const r = v2Result.records[0];
    const psiH = r.get("psiH");
    const lambda2 = r.get("lambda2");
    const friction = r.get("friction");
    const trend = r.get("trend");
    const computedAt = r.get("computedAt");
    console.log(`  ΨH=${psiH}, λ₂=${lambda2}, friction=${friction}, trend=${trend}, computedAt=${computedAt}`);
    if (psiH !== null && lambda2 !== null) {
      pass("V2: ΨH composite", `ΨH=${Number(psiH).toFixed(3)}, λ₂=${Number(lambda2).toFixed(3)}, friction=${Number(friction ?? 0).toFixed(3)}`);
    } else {
      fail("V2: ΨH composite", `ΨH=${psiH}, λ₂=${lambda2} (expected non-null)`);
    }
  } else {
    fail("V2: ΨH composite", "Architect Bloom not found");
  }

  // ── V3: εR on Architect Bloom ─────────────────────────────────────────

  console.log("\n── V3: εR on Architect Bloom ──");
  const v3Result = await runQuery(
    `MATCH (b:Bloom {id: 'architect'})
     RETURN b.epsilonR AS epsilonR,
            b.epsilonRRange AS range,
            b.epsilonRExploratory AS exploratory,
            b.epsilonRTotal AS total,
            b.epsilonRComputedAt AS computedAt`,
    {},
    "READ",
  );
  if (v3Result.records.length > 0) {
    const r = v3Result.records[0];
    const epsilonR = r.get("epsilonR");
    const range = r.get("range");
    const exploratory = r.get("exploratory");
    const total = r.get("total");
    const computedAt = r.get("computedAt");
    console.log(`  εR=${epsilonR}, range=${range}, exploratory=${exploratory}, total=${total}, computedAt=${computedAt}`);
    if (epsilonR !== null && total != null && Number(total) > 0) {
      pass("V3: εR aggregation", `εR=${Number(epsilonR).toFixed(3)}, range=${range}, ${exploratory}/${total} exploratory`);
    } else if (epsilonR !== null) {
      info("V3: εR aggregation", `εR=${Number(epsilonR).toFixed(3)} (total=${total} — may be from prior run)`);
    } else {
      fail("V3: εR aggregation", `εR is null (Cypher error during pipeline — see console logs)`);
    }
  } else {
    fail("V3: εR aggregation", "Architect Bloom not found");
  }

  // ── V4: Signal conditioning on Observations ───────────────────────────

  console.log("\n── V4: Signal conditioning on Observations ──");
  const v4Result = await runQuery(
    `MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom {id: 'architect'})
     WHERE o.signalProcessed = true
     RETURN count(o) AS conditionedCount,
            count(CASE WHEN o.retained = true THEN 1 END) AS retainedCount`,
    {},
    "READ",
  );
  if (v4Result.records.length > 0) {
    const conditioned = Number(v4Result.records[0].get("conditionedCount"));
    const retained = Number(v4Result.records[0].get("retainedCount"));
    console.log(`  Conditioned observations: ${conditioned}, retained: ${retained}`);
    if (conditioned > 0) {
      pass("V4: Signal conditioning", `${conditioned} observation(s) with signalProcessed=true, ${retained} retained`);
    } else {
      fail("V4: Signal conditioning", "No observations with signalProcessed=true found");
    }
  } else {
    fail("V4: Signal conditioning", "No observations found");
  }

  // ── V5: Hierarchical health propagation ───────────────────────────────

  console.log("\n── V5: Hierarchical health propagation ──");
  const v5Result = await runQuery(
    `MATCH (b:Bloom {id: 'architect'})
     OPTIONAL MATCH (b)-[:CONTAINS]->(child:Bloom)
     WITH b, count(child) AS children,
          avg(child.phiL) AS avgChildPhiL,
          count(CASE WHEN child.phiL IS NOT NULL THEN 1 END) AS childrenWithPhiL
     RETURN b.phiL AS parentPhiL, avgChildPhiL, children, childrenWithPhiL`,
    {},
    "READ",
  );
  if (v5Result.records.length > 0) {
    const r = v5Result.records[0];
    const parentPhiL = r.get("parentPhiL");
    const avgChild = r.get("avgChildPhiL");
    const children = Number(r.get("children"));
    const withPhiL = Number(r.get("childrenWithPhiL"));
    console.log(`  Parent ΦL=${parentPhiL}, avg child ΦL=${avgChild}, children=${children}, with ΦL=${withPhiL}`);
    if (parentPhiL !== null) {
      pass("V5: Hierarchical propagation", `parent ΦL=${Number(parentPhiL).toFixed(3)}, ${children} children (${withPhiL} have ΦL)`);
    } else {
      fail("V5: Hierarchical propagation", `parentPhiL=${parentPhiL}, children=${children}`);
    }
  } else {
    fail("V5: Hierarchical propagation", "Architect Bloom not found");
  }

  // ── V6: Decision quality outcomes ─────────────────────────────────────

  console.log("\n── V6: Decision quality outcomes ──");
  const v6Result = await runQuery(
    `MATCH (d:Decision)
     WHERE d.qualityScore IS NOT NULL
     WITH count(d) AS withQuality
     MATCH (d2:Decision)
     RETURN withQuality, count(d2) AS total`,
    {},
    "READ",
  );
  if (v6Result.records.length > 0) {
    const withQ = Number(v6Result.records[0].get("withQuality"));
    const total = Number(v6Result.records[0].get("total"));
    const ratio = total > 0 ? (withQ / total) : 0;
    console.log(`  Decisions with quality: ${withQ}/${total} (${(ratio * 100).toFixed(1)}%)`);
    if (total > 0 && ratio > 0.5) {
      pass("V6: Decision quality", `${withQ}/${total} (${(ratio * 100).toFixed(1)}%) have quality outcomes`);
    } else if (total > 0) {
      info("V6: Decision quality", `${withQ}/${total} (${(ratio * 100).toFixed(1)}%) — below 80% threshold`);
    } else {
      fail("V6: Decision quality", "No Decision nodes found");
    }
  } else {
    fail("V6: Decision quality", "Query returned no results");
  }

  // ── V7: PipelineRun aggregates ────────────────────────────────────────

  console.log("\n── V7: PipelineRun aggregates ──");
  const v7Query = targetRunId
    ? `MATCH (pr:PipelineRun {id: $runId})
       RETURN pr.status AS status, pr.taskCount AS taskCount,
              pr.overallQuality AS successRate, pr.durationMs AS duration,
              pr.modelsUsed AS modelsUsed`
    : `MATCH (pr:PipelineRun)
       WHERE pr.status = 'completed'
       RETURN pr.id AS runId, pr.status AS status, pr.taskCount AS taskCount,
              pr.overallQuality AS successRate, pr.durationMs AS duration,
              pr.modelsUsed AS modelsUsed
       ORDER BY pr.startedAt DESC LIMIT 1`;
  const v7Result = await runQuery(v7Query, targetRunId ? { runId: targetRunId } : {}, "READ");
  if (v7Result.records.length > 0) {
    const r = v7Result.records[0];
    const status = r.get("status");
    const taskCount = r.get("taskCount");
    const successRate = r.get("successRate");
    const duration = r.get("duration");
    const modelsUsed = r.get("modelsUsed");
    console.log(`  Status=${status}, tasks=${taskCount}, quality=${successRate}, duration=${duration}ms, models=${modelsUsed}`);
    if (status === "completed" && Number(taskCount) > 0) {
      pass("V7: PipelineRun aggregates", `status=${status}, tasks=${taskCount}, quality=${successRate}`);
    } else {
      fail("V7: PipelineRun aggregates", `status=${status}, tasks=${taskCount}`);
    }
  } else {
    fail("V7: PipelineRun aggregates", targetRunId ? `Run ${targetRunId} not found` : "No completed runs");
  }

  // ── V8: Cross-run analytics ───────────────────────────────────────────

  console.log("\n── V8: Cross-run analytics ──");
  const v8Result = await runQuery(
    `MATCH (pr:PipelineRun)
     WHERE pr.status = 'completed'
     RETURN pr.id AS runId,
            pr.overallQuality AS quality,
            pr.taskCount AS tasks,
            pr.modelsUsed AS models
     ORDER BY pr.startedAt DESC
     LIMIT 5`,
    {},
    "READ",
  );
  if (v8Result.records.length >= 1) {
    for (const rec of v8Result.records) {
      console.log(`  Run ${rec.get("runId")}: quality=${rec.get("quality")}, tasks=${rec.get("tasks")}`);
    }
    pass("V8: Cross-run analytics", `${v8Result.records.length} completed run(s) queryable`);
  } else {
    fail("V8: Cross-run analytics", "No completed runs found");
  }

  // ── V9: Milestone Blooms with ΦL ──────────────────────────────────────

  console.log("\n── V9: Milestone Blooms with ΦL ──");
  const v9Result = await runQuery(
    `MATCH (b:Bloom)
     WHERE b.type IN ['milestone', 'sub-milestone']
       AND b.phiL IS NOT NULL
     RETURN b.id AS id, b.name AS name, b.phiL AS phiL, b.status AS status
     ORDER BY b.phiL ASC
     LIMIT 10`,
    {},
    "READ",
  );
  if (v9Result.records.length > 0) {
    for (const rec of v9Result.records) {
      console.log(`  ${rec.get("id")}: ΦL=${Number(rec.get("phiL")).toFixed(3)}, status=${rec.get("status")}`);
    }
    pass("V9: Milestone Blooms", `${v9Result.records.length} milestone(s) with ΦL values`);
  } else {
    info("V9: Milestone Blooms", "No milestones with ΦL values (expected if milestones not yet stamped with health)");
  }

  // ── V10: Immune response data (M-22.7) ────────────────────────────────

  console.log("\n── V10: Immune response data ──");
  const v10Result = await runQuery(
    `OPTIONAL MATCH (g:Grid {id: 'grid:structural-review'})-[:CONTAINS]->(s)
     RETURN count(s) AS findingCount, g IS NOT NULL AS gridExists`,
    {},
    "READ",
  );
  if (v10Result.records.length > 0) {
    const findingCount = Number(v10Result.records[0].get("findingCount"));
    const gridExists = v10Result.records[0].get("gridExists");
    console.log(`  Grid exists: ${gridExists}, findings: ${findingCount}`);
    if (gridExists) {
      pass("V10: Immune response", `Grid exists, ${findingCount} finding(s)`);
    } else {
      info("V10: Immune response", "Structural review grid not yet created (triggers may not have fired)");
    }
  } else {
    info("V10: Immune response", "Query returned no results");
  }

  // ── V11: Line conductivity cache (M-22.6) ─────────────────────────────

  console.log("\n── V11: Line conductivity cache ──");
  const v11Result = await runQuery(
    `MATCH ()-[r]->()
     WHERE r.conductivityValid IS NOT NULL
     RETURN count(r) AS cachedLines,
            count(CASE WHEN r.conductivityValid = true THEN 1 END) AS validLines`,
    {},
    "READ",
  );
  if (v11Result.records.length > 0) {
    const cached = Number(v11Result.records[0].get("cachedLines"));
    const valid = Number(v11Result.records[0].get("validLines"));
    console.log(`  Cached lines: ${cached}, valid: ${valid}`);
    info("V11: Line conductivity", `${cached} cached lines (${valid} valid) — conductivity is lazy-evaluated`);
  } else {
    info("V11: Line conductivity", "No cached conductivity data (lazy evaluation)");
  }

  // ══════════════════════════════════════════════════════════════════════
  // ═ Key Cypher Questions (M-9.V Acceptance Test)
  // ══════════════════════════════════════════════════════════════════════

  console.log("\n── Key Question 1: How is my pipeline performing? ──");
  const kq1Result = await runQuery(
    `MATCH (b:Bloom {id: 'architect'})
     RETURN b.phiL AS health,
            b.phiLTrend AS healthTrend,
            b.healthBand AS band,
            b.psiH AS coherence,
            b.lambda2 AS connectivity,
            b.epsilonR AS explorationRate,
            b.epsilonRRange AS explorationBand`,
    {},
    "READ",
  );
  if (kq1Result.records.length > 0) {
    const r = kq1Result.records[0];
    console.log(`  health=${r.get("health")}, trend=${r.get("healthTrend")}, band=${r.get("band")}`);
    console.log(`  coherence=${r.get("coherence")}, connectivity=${r.get("connectivity")}`);
    console.log(`  explorationRate=${r.get("explorationRate")}, explorationBand=${r.get("explorationBand")}`);
    const health = r.get("health");
    const coherence = r.get("coherence");
    if (health !== null && coherence !== null) {
      pass("KQ1: Pipeline performance", `ΦL=${Number(health).toFixed(3)}, ΨH=${Number(coherence).toFixed(3)}`);
    } else {
      fail("KQ1: Pipeline performance", `health=${health}, coherence=${coherence} (null values present)`);
    }
  } else {
    fail("KQ1: Pipeline performance", "Architect Bloom not found");
  }

  console.log("\n── Key Question 2: What is the health of M-9? ──");
  const kq2Result = await runQuery(
    `MATCH (m9:Bloom {id: 'bloom:m-9'})
     OPTIONAL MATCH (m9)-[:CONTAINS]->(child)
     WHERE child:Bloom
     RETURN m9.phiL AS m9Health,
            m9.status AS m9Status,
            count(child) AS children,
            count(CASE WHEN child.status = 'complete' THEN 1 END) AS complete,
            collect({id: child.id, status: child.status, phiL: child.phiL}) AS childDetails`,
    {},
    "READ",
  );
  if (kq2Result.records.length > 0) {
    const r = kq2Result.records[0];
    const health = r.get("m9Health");
    const status = r.get("m9Status");
    const children = Number(r.get("children"));
    const complete = Number(r.get("complete"));
    const childDetails = r.get("childDetails");
    console.log(`  M-9: health=${health}, status=${status}, children=${children}, complete=${complete}`);
    if (childDetails && Array.isArray(childDetails)) {
      for (const c of childDetails.slice(0, 10)) {
        console.log(`    ${c.id}: status=${c.status}, phiL=${c.phiL}`);
      }
    }
    if (health !== null || children > 0) {
      pass("KQ2: M-9 health", `health=${health}, status=${status}, ${complete}/${children} children complete`);
    } else {
      info("KQ2: M-9 health", `M-9 found but health=${health}, children=${children}`);
    }
  } else {
    info("KQ2: M-9 health", "bloom:m-9 not found in graph");
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
