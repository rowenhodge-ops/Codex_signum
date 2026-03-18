// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * M-23.3: Graph Remediation — Fix Existing Violations
 *
 * Fixes: 87 stamp violations, 6 orphan R-items, 8 dormant pipeline Seeds,
 * 196 missing INSTANTIATES, 8 scope mismatches, 4 phiL overrides.
 *
 * Uses ONLY instantiation protocol functions (updateMorpheme, createLine,
 * instantiateMorpheme, stampBloomComplete) with two documented exceptions:
 * - Phase F: bulk INSTANTIATES backfill (M-16.1 Phase A precedent)
 * - Phase G: raw SCOPED_TO removal (deleteLine() doesn't exist yet → R-61)
 *
 * Idempotent: running twice produces the same result.
 */

import {
  updateMorpheme,
  createLine,
  instantiateMorpheme,
  stampBloomComplete,
} from "../src/graph/instantiation.js";
import { runQuery, closeDriver } from "../src/graph/client.js";
import { computeAndPersistPsiH } from "../src/graph/queries/health.js";

// ═══════════════════════════════════════════════════════════════════

async function phaseA_M9V_ExitCriteria(): Promise<void> {
  console.log("── Phase A: M-9.V Exit Criteria → Complete ──");

  const ecResult = await runQuery(
    `MATCH (b:Bloom {id: 'M-9.V'})-[:CONTAINS]->(ec:Seed)
     WHERE ec.seedType = 'exit-criterion' AND ec.status <> 'complete'
     RETURN ec.id AS ecId ORDER BY ec.id`,
    {},
    "READ",
  );

  if (ecResult.records.length === 0) {
    console.log("  ✅ All M-9.V exit criteria already complete");
    return;
  }

  console.log(`  Found ${ecResult.records.length} incomplete exit criteria`);
  for (const rec of ecResult.records) {
    const ecId = rec.get("ecId") as string;
    const mr = await updateMorpheme(ecId, { status: "complete" });
    console.log(`  ${mr.success ? "✅" : "❌"} ${ecId} → complete${mr.error ? ": " + mr.error : ""}`);
  }

  // Verification
  const verify = await runQuery(
    `MATCH (b:Bloom {id: 'M-9.V'})-[:CONTAINS]->(ec:Seed)
     WHERE ec.seedType = 'exit-criterion' AND ec.status <> 'complete'
     RETURN count(*) AS remaining`,
    {},
    "READ",
  );
  const remaining = verify.records[0]?.get("remaining") ?? -1;
  console.log(`  Verification: ${remaining === 0 ? "✅" : "❌"} ${remaining} remaining\n`);
}

// ═══════════════════════════════════════════════════════════════════

async function phaseB_BloomTypeClassification(): Promise<void> {
  console.log("── Phase B: Bloom Type Classification ──");

  // Constitutional Bloom
  const cbResult = await runQuery(
    `MATCH (b:Bloom {id: 'constitutional-bloom'}) RETURN b.type AS type`,
    {},
    "READ",
  );
  const cbType = cbResult.records[0]?.get("type");
  if (cbType === "definitional") {
    console.log("  ✅ constitutional-bloom already type=definitional");
  } else {
    const mr = await updateMorpheme("constitutional-bloom", { type: "definitional" });
    console.log(`  ${mr.success ? "✅" : "❌"} constitutional-bloom → type=definitional${mr.error ? ": " + mr.error : ""}`);
  }

  // FSM layers
  const fsmLayers = [
    "fsm:layer-0-session",
    "fsm:layer-1-architect",
    "fsm:layer-2-devagent",
    "fsm:layer-3-graph",
    "fsm:layer-4-router",
  ];
  for (const id of fsmLayers) {
    const existing = await runQuery(
      `MATCH (b:Bloom {id: $id}) RETURN b.type AS type`,
      { id },
      "READ",
    );
    const existingType = existing.records[0]?.get("type");
    if (existingType === "analytical") {
      console.log(`  ✅ ${id} already type=analytical`);
    } else if (existing.records.length === 0) {
      console.log(`  ⚠️  ${id} not found — skipping`);
    } else {
      const mr = await updateMorpheme(id, { type: "analytical" });
      console.log(`  ${mr.success ? "✅" : "❌"} ${id} → type=analytical${mr.error ? ": " + mr.error : ""}`);
    }
  }
  console.log();
}

// ═══════════════════════════════════════════════════════════════════

async function phaseC_PhiLReconciliation(): Promise<void> {
  console.log("── Phase C: phiL Reconciliation ──");

  const mismatchResult = await runQuery(
    `MATCH (parent:Bloom)-[:CONTAINS]->(child)
     WHERE parent.id STARTS WITH 'M-'
       AND (child:Bloom OR (child:Seed AND child.seedType = 'exit-criterion'))
     WITH parent,
          count(child) AS total,
          count(CASE WHEN child.status = 'complete' THEN 1 END) AS done,
          toFloat(count(CASE WHEN child.status = 'complete' THEN 1 END)) /
            toFloat(count(child)) AS derivedPhiL
     WHERE parent.phiL <> derivedPhiL OR parent.phiL IS NULL
     RETURN parent.id AS id, parent.status AS status, parent.phiL AS currentPhiL,
            derivedPhiL, total, done
     ORDER BY parent.id`,
    {},
    "READ",
  );

  if (mismatchResult.records.length === 0) {
    console.log("  ✅ All milestone phiL values match derived values");
    console.log();
    return;
  }

  console.log(`  Found ${mismatchResult.records.length} phiL mismatches:`);
  for (const rec of mismatchResult.records) {
    const id = rec.get("id") as string;
    const status = rec.get("status") as string;
    const current = rec.get("currentPhiL");
    const derived = rec.get("derivedPhiL") as number;
    const total = rec.get("total");
    const done = rec.get("done");

    console.log(`  ${id}: status=${status}, phiL=${current} → derived=${derived.toFixed(3)} (${done}/${total})`);

    if (status === "complete" && done === total) {
      // All children complete → use stampBloomComplete with force
      console.log(`    → stampBloomComplete(force=true)`);
      const sr = await stampBloomComplete({ bloomId: id, force: true });
      console.log(`    ${sr.success ? "✅" : "❌"} derivedPhiL=${sr.derivedPhiL}${sr.error ? " error: " + sr.error : ""}`);
      if (sr.warnings.length > 0) {
        for (const w of sr.warnings) console.log(`    ⚠️  ${w}`);
      }
    } else {
      // Not complete — just fix phiL
      console.log(`    → updateMorpheme(phiL=${derived.toFixed(4)})`);
      const mr = await updateMorpheme(id, { phiL: derived });
      console.log(`    ${mr.success ? "✅" : "❌"}${mr.error ? " " + mr.error : ""}`);
    }
  }
  console.log();
}

// ═══════════════════════════════════════════════════════════════════

async function phaseD_OrphanRItemWiring(): Promise<void> {
  console.log("── Phase D: Orphan R-Item Wiring ──");

  const orphanResult = await runQuery(
    `MATCH (s:Seed)
     WHERE s.id STARTS WITH 'R-'
       AND NOT EXISTS { MATCH (s)-[]-() }
     RETURN s.id AS id, s.name AS name, s.content AS content
     ORDER BY s.id`,
    {},
    "READ",
  );

  if (orphanResult.records.length === 0) {
    console.log("  ✅ No orphan R-items");
    console.log();
    return;
  }

  console.log(`  Found ${orphanResult.records.length} orphan R-items:`);

  // Scoping decisions based on content analysis
  const scopeMap: Record<string, { scope: string; complete?: boolean }> = {
    "R-32": { scope: "M-8.INT" },
    "R-33": { scope: "M-8.INT" },
    "R-34": { scope: "M-8.INT" },
    "R-35": { scope: "M-8.INT" },
    "R-37": { scope: "M-8.INT", complete: true }, // composite indexes — already done
    "R-38": { scope: "M-8.INT" }, // data lifecycle — long-term, park in M-8.INT for now
  };

  for (const rec of orphanResult.records) {
    const id = rec.get("id") as string;
    const name = rec.get("name") as string;
    const content = String(rec.get("content") || "").substring(0, 100);
    console.log(`  ${id} — ${name}`);
    console.log(`    Content: ${content}`);

    const mapping = scopeMap[id];
    if (!mapping) {
      console.log(`    ⚠️  No scope mapping — skipping (flag for Ro)`);
      continue;
    }

    // Check target milestone exists
    const targetExists = await runQuery(
      `MATCH (b:Bloom {id: $targetId}) RETURN b.id`,
      { targetId: mapping.scope },
      "READ",
    );
    if (targetExists.records.length === 0) {
      console.log(`    ⚠️  Target ${mapping.scope} not found — skipping`);
      continue;
    }

    // Wire SCOPED_TO
    const lr = await createLine(id, mapping.scope, "SCOPED_TO");
    console.log(`    ${lr.success ? "✅" : "❌"} SCOPED_TO → ${mapping.scope}`);

    // Backfill INSTANTIATES
    const ir = await createLine(id, "def:morpheme:seed", "INSTANTIATES");
    console.log(`    ${ir.success ? "✅" : "❌"} INSTANTIATES → def:morpheme:seed`);

    // Mark complete if needed
    if (mapping.complete) {
      const mr = await updateMorpheme(id, { status: "complete" });
      console.log(`    ${mr.success ? "✅" : "❌"} status → complete`);
    }
  }

  // Verification
  const verify = await runQuery(
    `MATCH (s:Seed)
     WHERE s.id STARTS WITH 'R-'
       AND NOT EXISTS { MATCH (s)-[]-() }
     RETURN count(*) AS remaining`,
    {},
    "READ",
  );
  const remaining = verify.records[0]?.get("remaining") ?? -1;
  console.log(`  Verification: ${remaining === 0 ? "✅" : "❌"} ${remaining} orphans remaining\n`);
}

// ═══════════════════════════════════════════════════════════════════

async function phaseE_DormantPipelineOutputs(): Promise<void> {
  console.log("── Phase E: Dormant Pipeline-Output Seeds ──");

  const dormantResult = await runQuery(
    `MATCH (s:Seed)
     WHERE s.seedType = 'pipeline-output'
       AND NOT EXISTS { MATCH (s)-[]-() }
     RETURN s.id AS id, s.name AS name
     ORDER BY s.id`,
    {},
    "READ",
  );

  if (dormantResult.records.length === 0) {
    console.log("  ✅ No dormant pipeline-output Seeds");
    console.log();
    return;
  }

  console.log(`  Found ${dormantResult.records.length} dormant pipeline-output Seeds`);

  // Find the matching PipelineRun
  const prResult = await runQuery(
    `MATCH (pr:Bloom)
     WHERE pr.id CONTAINS '2026-03-17' AND 'PipelineRun' IN labels(pr)
     RETURN pr.id AS id
     LIMIT 1`,
    {},
    "READ",
  );

  if (prResult.records.length === 0) {
    // Try broader search
    const prBroad = await runQuery(
      `MATCH (pr:Bloom)
       WHERE 'PipelineRun' IN labels(pr)
       RETURN pr.id AS id ORDER BY pr.id DESC LIMIT 3`,
      {},
      "READ",
    );
    if (prBroad.records.length > 0) {
      console.log("  Available PipelineRun Blooms:");
      for (const r of prBroad.records) console.log(`    ${r.get("id")}`);
    }

    // Try to match by timestamp prefix from seed IDs
    const sampleId = dormantResult.records[0]?.get("id") as string;
    const prefix = sampleId?.split(":")[0]; // e.g., "2026-03-17T19-15-16"
    if (prefix) {
      const prefixMatch = await runQuery(
        `MATCH (pr:Bloom)
         WHERE pr.id STARTS WITH $prefix AND 'PipelineRun' IN labels(pr)
         RETURN pr.id AS id LIMIT 1`,
        { prefix },
        "READ",
      );
      if (prefixMatch.records.length > 0) {
        const prId = prefixMatch.records[0].get("id") as string;
        console.log(`  Found PipelineRun by prefix match: ${prId}`);
        for (const rec of dormantResult.records) {
          const seedId = rec.get("id") as string;
          const lr = await createLine(prId, seedId, "CONTAINS");
          const ir = await createLine(seedId, "def:morpheme:seed", "INSTANTIATES");
          console.log(`  ${lr.success ? "✅" : "❌"} ${prId} -[:CONTAINS]-> ${seedId}`);
        }
        console.log();
        return;
      }
    }

    console.log("  ⚠️  No matching PipelineRun found — wiring to DISPATCH stage instead");
    // Try DISPATCH stage as fallback
    const dispatchResult = await runQuery(
      `MATCH (s:Stage {name: 'DISPATCH'}) RETURN s.id AS id LIMIT 1`,
      {},
      "READ",
    );
    if (dispatchResult.records.length > 0) {
      const dispatchId = dispatchResult.records[0].get("id") as string;
      for (const rec of dormantResult.records) {
        const seedId = rec.get("id") as string;
        const lr = await createLine(dispatchId, seedId, "CONTAINS");
        const ir = await createLine(seedId, "def:morpheme:seed", "INSTANTIATES");
        console.log(`  ${lr.success ? "✅" : "❌"} ${dispatchId} -[:CONTAINS]-> ${seedId}`);
      }
    } else {
      console.log("  ⚠️  No DISPATCH stage found either — skipping (flag for Ro)");
    }
  } else {
    const prId = prResult.records[0].get("id") as string;
    console.log(`  Wiring to PipelineRun: ${prId}`);
    for (const rec of dormantResult.records) {
      const seedId = rec.get("id") as string;
      const lr = await createLine(prId, seedId, "CONTAINS");
      const ir = await createLine(seedId, "def:morpheme:seed", "INSTANTIATES");
      console.log(`  ${lr.success ? "✅" : "❌"} ${prId} -[:CONTAINS]-> ${seedId}`);
    }
  }
  console.log();
}

// ═══════════════════════════════════════════════════════════════════

async function phaseF_InstantiatesBackfill(): Promise<void> {
  console.log("── Phase F: INSTANTIATES Backfill (Bootstrap Exception) ──");
  // Bootstrap exception: bulk INSTANTIATES backfill.
  // See M-16.1 Phase A precedent — one-time migration, not ongoing writes.

  const missingResult = await runQuery(
    `MATCH (n)
     WHERE (n:Seed OR n:Bloom OR n:Resonator OR n:Grid OR n:Helix)
       AND NOT EXISTS { MATCH (n)-[:INSTANTIATES]->() }
       AND n.id IS NOT NULL
     RETURN n.id AS nodeId, labels(n) AS nodeLabels
     ORDER BY n.id`,
    {},
    "READ",
  );

  if (missingResult.records.length === 0) {
    console.log("  ✅ All nodes have INSTANTIATES wiring");
    console.log();
    return;
  }

  console.log(`  Found ${missingResult.records.length} nodes missing INSTANTIATES`);

  const LABEL_TO_DEF: Record<string, string> = {
    Seed: "def:morpheme:seed",
    Bloom: "def:morpheme:bloom",
    Resonator: "def:morpheme:resonator",
    Grid: "def:morpheme:grid",
    Helix: "def:morpheme:helix",
  };

  const wiring: Array<{ nodeId: string; defId: string }> = [];
  let skipped = 0;
  for (const rec of missingResult.records) {
    const nodeId = String(rec.get("nodeId"));
    const labels: string[] = rec.get("nodeLabels");
    const morphemeLabel = ["Bloom", "Seed", "Resonator", "Grid", "Helix"].find(
      (l) => labels.includes(l),
    );
    if (!morphemeLabel) {
      skipped++;
      continue;
    }
    wiring.push({ nodeId, defId: LABEL_TO_DEF[morphemeLabel] });
  }

  if (wiring.length > 0) {
    await runQuery(
      `UNWIND $wiring AS item
       MATCH (n {id: item.nodeId}), (def:Seed {id: item.defId})
       MERGE (n)-[:INSTANTIATES]->(def)`,
      { wiring },
      "WRITE",
    );
    console.log(`  ✅ Wired ${wiring.length} INSTANTIATES edges (${skipped} skipped — no morpheme label)`);
  }

  // Phase F-2: Backfill INSTANTIATES on observation Seeds created by the
  // instantiation/mutation/line Resonators during this run (they use raw CREATE,
  // not instantiateMorpheme, so they don't get INSTANTIATES automatically).
  const obsBackfill = await runQuery(
    `MATCH (n:Seed)
     WHERE NOT EXISTS { MATCH (n)-[:INSTANTIATES]->() }
       AND n.id IS NOT NULL
       AND (n.id STARTS WITH 'obs:' OR n.seedType = 'observation')
     WITH collect({nodeId: n.id, defId: 'def:morpheme:seed'}) AS wiring
     UNWIND wiring AS item
     MATCH (n {id: item.nodeId}), (def:Seed {id: item.defId})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(*) AS wired`,
    {},
    "WRITE",
  );
  const obsWired = obsBackfill.records[0]?.get("wired") ?? 0;
  if (obsWired > 0) {
    console.log(`  ✅ Backfilled ${obsWired} observation INSTANTIATES (Resonator recording gap)`);
  }

  // Verification
  const verify = await runQuery(
    `MATCH (n)
     WHERE (n:Seed OR n:Bloom OR n:Resonator OR n:Grid OR n:Helix)
       AND NOT EXISTS { MATCH (n)-[:INSTANTIATES]->() }
       AND n.id IS NOT NULL
     RETURN count(*) AS remaining`,
    {},
    "READ",
  );
  const remaining = verify.records[0]?.get("remaining") ?? -1;
  console.log(`  Verification: ${remaining === 0 ? "✅" : "⚠️ "} ${remaining} remaining\n`);
}

// ═══════════════════════════════════════════════════════════════════

async function phaseG_RItemRescoping(): Promise<void> {
  console.log("── Phase G: R-Item Rescoping ──");

  const scopeResult = await runQuery(
    `MATCH (s:Seed)-[:SCOPED_TO]->(m:Bloom)
     WHERE s.id STARTS WITH 'R-' AND s.status = 'planned' AND m.status = 'complete'
     RETURN s.id AS id, s.name AS name, m.id AS currentScope
     ORDER BY s.id`,
    {},
    "READ",
  );

  if (scopeResult.records.length === 0) {
    console.log("  ✅ No planned R-items scoped to complete milestones");
  } else {
    console.log(`  Found ${scopeResult.records.length} planned R-items on complete milestones:`);

    // Proposed rescoping — verify content before applying
    const rescopeMap: Record<string, { newScope?: string; complete?: boolean; reason: string; newContent?: string }> = {
      "R-02": { newScope: "M-12", reason: "Axiom dependency DAG → Constitutional Evolution" },
      "R-03": { newScope: "M-8.INT", reason: "Anti-pattern table update → mechanical pipeline work" },
      "R-09": { complete: true, reason: "v5.0 resolved error morpheme question", newContent: "Resolved by v5.0 — errors are regions of state dimension space, not separate morphemes. See v5.0 §Dimensional Collapse anti-pattern." },
      "R-12": { newScope: "M-18", reason: "Level 5 spec-compliant tests need the Assayer" },
      "R-14": { complete: true, reason: "M-9.7b is complete — R-14 was its deliverable" },
      "R-52": { newScope: "M-8.INT", reason: "Design Doc Sprint → pre-M-8.INT" },
      "R-53": { newScope: "M-8.INT", reason: "Design Doc Sprint → pre-M-8.INT" },
      "R-59": { newScope: "M-8.INT", reason: "Design Doc Sprint → pre-M-8.INT" },
    };

    for (const rec of scopeResult.records) {
      const id = rec.get("id") as string;
      const name = rec.get("name") as string;
      const currentScope = rec.get("currentScope") as string;
      const mapping = rescopeMap[id];

      console.log(`  ${id} — ${name} (currently → ${currentScope})`);

      if (!mapping) {
        console.log(`    ⚠️  No rescope mapping — skipping (flag for Ro)`);
        continue;
      }

      console.log(`    Reason: ${mapping.reason}`);

      if (mapping.complete) {
        // Mark as complete
        const updates: Record<string, unknown> = { status: "complete" };
        if (mapping.newContent) updates.content = mapping.newContent;
        const mr = await updateMorpheme(id, updates);
        console.log(`    ${mr.success ? "✅" : "❌"} → complete${mr.error ? ": " + mr.error : ""}`);
      } else if (mapping.newScope) {
        // Verify new scope exists
        const targetExists = await runQuery(
          `MATCH (b:Bloom {id: $targetId}) RETURN b.id`,
          { targetId: mapping.newScope },
          "READ",
        );
        if (targetExists.records.length === 0) {
          console.log(`    ⚠️  Target ${mapping.newScope} not found — skipping`);
          continue;
        }

        // Remove old SCOPED_TO (raw Cypher — deleteLine() doesn't exist yet)
        // Gap documented: R-61 (deleteLine function) created in this script
        await runQuery(
          `MATCH (s:Seed {id: $seedId})-[r:SCOPED_TO]->(m:Bloom {id: $oldScope}) DELETE r`,
          { seedId: id, oldScope: currentScope },
          "WRITE",
        );

        // Add new SCOPED_TO
        const lr = await createLine(id, mapping.newScope, "SCOPED_TO");
        console.log(`    ${lr.success ? "✅" : "❌"} SCOPED_TO → ${mapping.newScope}${lr.error ? ": " + lr.error : ""}`);
      }
    }
  }

  // Create R-61 backlog item for deleteLine()
  console.log("\n  Creating R-61 (deleteLine function backlog item)...");
  const r61Exists = await runQuery(
    `MATCH (s:Seed {id: 'R-61'}) RETURN s.id`,
    {},
    "READ",
  );
  if (r61Exists.records.length > 0) {
    console.log("  ✅ R-61 already exists");
  } else {
    const ir = await instantiateMorpheme(
      "seed",
      {
        id: "R-61",
        name: "deleteLine() function for instantiation protocol",
        content:
          "The instantiation protocol has createLine() but no deleteLine(). Phase G of M-23.3 used raw Cypher for SCOPED_TO removal. Add a governed deleteLine() function that validates the removal, records an observation, and invalidates conductivity cache.",
        seedType: "backlog",
        status: "planned",
      },
      "roadmap-v7",
    );
    console.log(`  ${ir.success ? "✅" : "❌"} R-61 created${ir.error ? ": " + ir.error : ""}`);
    if (ir.success) {
      const lr = await createLine("R-61", "M-8.INT", "SCOPED_TO");
      console.log(`  ${lr.success ? "✅" : "❌"} R-61 SCOPED_TO → M-8.INT`);
    }
  }

  // Verification
  const verify = await runQuery(
    `MATCH (s:Seed)-[:SCOPED_TO]->(m:Bloom)
     WHERE s.id STARTS WITH 'R-' AND s.status = 'planned' AND m.status = 'complete'
     RETURN count(*) AS remaining`,
    {},
    "READ",
  );
  const remaining = verify.records[0]?.get("remaining") ?? -1;
  console.log(`  Verification: ${remaining === 0 ? "✅" : "⚠️ "} ${remaining} scope mismatches remaining\n`);
}

// ═══════════════════════════════════════════════════════════════════

async function phaseH_StateRecomputation(): Promise<void> {
  console.log("── Phase H: Post-Remediation State Dimension Recomputation ──");

  // Recompute ΨH on key Blooms
  const bloomsToRecompute = ["roadmap-v7", "M-9", "M-16", "M-17", "M-8", "M-8.INT", "M-23"];

  for (const bloomId of bloomsToRecompute) {
    try {
      const psiH = await computeAndPersistPsiH(bloomId);
      console.log(
        `  ${bloomId} ΨH: ${psiH ? psiH.combined.toFixed(3) : "null (no children edges)"}`,
      );
    } catch (e) {
      console.log(`  ${bloomId} ΨH failed: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log();
}

// ═══════════════════════════════════════════════════════════════════

async function phaseI_CreateM23Milestone(): Promise<void> {
  console.log("── Phase I: Create M-23 Milestone Structure ──");

  const existsResult = await runQuery(
    `MATCH (b:Bloom {id: 'M-23'}) RETURN b.id`,
    {},
    "READ",
  );

  if (existsResult.records.length > 0) {
    console.log("  ✅ M-23 already exists — skipping creation");
    console.log();
    return;
  }

  // M-23 parent Bloom
  let ir = await instantiateMorpheme(
    "bloom",
    {
      id: "M-23",
      name: "Graph Hygiene + Stamp Enforcement",
      content:
        "Neo4j pre-flight guard, stampBloomComplete() structural enforcement with inline state dimension recomputation, and graph remediation of 87 stamp violations, 196 INSTANTIATES gaps, 6 orphans, and 8 scope mismatches.",
      type: "milestone",
      status: "active",
    },
    "roadmap-v7",
  );
  console.log(`  ${ir.success ? "✅" : "❌"} M-23 created${ir.error ? ": " + ir.error : ""}`);

  // M-23.1
  ir = await instantiateMorpheme(
    "bloom",
    {
      id: "M-23.1",
      name: "Neo4j Pre-Flight Guard",
      content:
        "Env var validation in getDriver() with NEO4J_USERNAME wrong-name detection. Session database parameter fix. Fails loudly instead of silent hang.",
      type: "sub-milestone",
      status: "complete",
    },
    "M-23",
  );
  console.log(`  ${ir.success ? "✅" : "❌"} M-23.1 created`);

  // M-23.2
  ir = await instantiateMorpheme(
    "bloom",
    {
      id: "M-23.2",
      name: "Stamp Enforcement — stampBloomComplete()",
      content:
        "Structural stamp function: exit criteria pre-flight, derived phiL from relevant children only, INSTANTIATES backfill, inline state dimension recomputation. Prevents all future stamp violations at write time.",
      type: "sub-milestone",
      status: "complete",
    },
    "M-23",
  );
  console.log(`  ${ir.success ? "✅" : "❌"} M-23.2 created`);

  // M-23.3
  ir = await instantiateMorpheme(
    "bloom",
    {
      id: "M-23.3",
      name: "Graph Remediation",
      content:
        "Fix existing violations: 87 complete-Blooms-with-pending-children, 196 missing INSTANTIATES, 6 orphan R-items, 8 dormant pipeline Seeds, 8 scope mismatches, 4 phiL overrides. Post-remediation state dimension recomputation.",
      type: "sub-milestone",
      status: "active",
    },
    "M-23",
  );
  console.log(`  ${ir.success ? "✅" : "❌"} M-23.3 created`);

  // Exit criteria
  const exitCriteria = [
    { id: "M-23:ec-1", content: "Neo4j pre-flight guard fires on missing env vars — no silent hangs" },
    { id: "M-23:ec-2", content: "Every driver.session() passes { database: NEO4J_DATABASE }" },
    { id: "M-23:ec-3", content: "stampBloomComplete() enforces exit criteria completion before stamp" },
    { id: "M-23:ec-4", content: "phiL derives from relevant children only (Blooms + exit criteria, not observation Seeds)" },
    { id: "M-23:ec-5", content: "Inline state dimension recomputation fires on every stamp — no stale window" },
    { id: "M-23:ec-6", content: "Zero complete Blooms with non-complete children (excluding definitional/analytical)" },
    { id: "M-23:ec-7", content: "Zero nodes missing INSTANTIATES wiring" },
    { id: "M-23:ec-8", content: "Zero orphaned R-items (every R-* has at least one relationship)" },
    { id: "M-23:ec-9", content: "Zero planned R-items scoped to complete milestones" },
  ];

  for (const ec of exitCriteria) {
    ir = await instantiateMorpheme(
      "seed",
      {
        id: ec.id,
        name: ec.id,
        content: ec.content,
        seedType: "exit-criterion",
        status: "pending",
      },
      "M-23",
    );
    console.log(`  ${ir.success ? "✅" : "❌"} ${ec.id}`);
  }

  // Dependencies
  const lr = await createLine("M-23", "M-9", "DEPENDS_ON");
  console.log(`  ${lr.success ? "✅" : "❌"} M-23 DEPENDS_ON M-9`);

  // Verification
  const verify = await runQuery(
    `MATCH (b:Bloom {id: 'M-23'})-[:CONTAINS]->(child)
     RETURN child.id AS id, labels(child) AS labels, child.status AS status
     ORDER BY child.id`,
    {},
    "READ",
  );
  console.log(`  Verification: ${verify.records.length} children created`);
  for (const r of verify.records) {
    console.log(`    ${r.get("id")} [${r.get("status")}] (${r.get("labels")})`);
  }
  console.log();
}

// ═══════════════════════════════════════════════════════════════════

async function postRemediationDiagnostic(): Promise<void> {
  console.log("── Post-Remediation Diagnostic ──");

  // 1. Complete Blooms with non-complete children (excluding definitional/analytical)
  const v1 = await runQuery(
    `MATCH (b:Bloom)-[:CONTAINS]->(child)
     WHERE b.status = 'complete'
       AND child.status <> 'complete'
       AND NOT b.type IN ['definitional', 'analytical']
     RETURN count(DISTINCT b) AS violations`,
    {},
    "READ",
  );
  const stampViolations = v1.records[0]?.get("violations") ?? -1;
  console.log(`  Stamp violations: ${stampViolations === 0 ? "✅ 0" : "❌ " + stampViolations}`);

  // 2. Orphaned R-items
  const v2 = await runQuery(
    `MATCH (s:Seed)
     WHERE s.id STARTS WITH 'R-'
       AND NOT EXISTS { MATCH (s)-[]-() }
     RETURN count(*) AS orphans`,
    {},
    "READ",
  );
  const orphans = v2.records[0]?.get("orphans") ?? -1;
  console.log(`  Orphaned R-items: ${orphans === 0 ? "✅ 0" : "❌ " + orphans}`);

  // 3. Missing INSTANTIATES
  const v3 = await runQuery(
    `MATCH (n)
     WHERE (n:Seed OR n:Bloom OR n:Resonator OR n:Grid OR n:Helix)
       AND NOT EXISTS { MATCH (n)-[:INSTANTIATES]->() }
       AND n.id IS NOT NULL
     RETURN count(*) AS missing`,
    {},
    "READ",
  );
  const missing = v3.records[0]?.get("missing") ?? -1;
  console.log(`  Missing INSTANTIATES: ${missing === 0 ? "✅ 0" : "⚠️  " + missing}`);

  // 4. Planned R-items on complete milestones
  const v4 = await runQuery(
    `MATCH (s:Seed)-[:SCOPED_TO]->(m:Bloom)
     WHERE s.id STARTS WITH 'R-' AND s.status = 'planned' AND m.status = 'complete'
     RETURN count(*) AS mismatches`,
    {},
    "READ",
  );
  const mismatches = v4.records[0]?.get("mismatches") ?? -1;
  console.log(`  Scope mismatches: ${mismatches === 0 ? "✅ 0" : "❌ " + mismatches}`);

  console.log();
}

// ═══════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Codex Graph Remediation (M-23.3)");
  console.log("═══════════════════════════════════════════════════════════\n");

  await phaseA_M9V_ExitCriteria();
  await phaseB_BloomTypeClassification();
  await phaseC_PhiLReconciliation();
  await phaseD_OrphanRItemWiring();
  await phaseE_DormantPipelineOutputs();
  await phaseF_InstantiatesBackfill();
  await phaseG_RItemRescoping();
  await phaseH_StateRecomputation();
  await phaseI_CreateM23Milestone();
  await postRemediationDiagnostic();

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Remediation complete");
  console.log("═══════════════════════════════════════════════════════════");

  await closeDriver();
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
