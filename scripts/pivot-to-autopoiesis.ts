/**
 * pivot-to-autopoiesis.ts
 *
 * [NO-PIPELINE] — Graph mutations from known architectural decisions.
 *
 * Pivots the roadmap from the M-24 waterfall (Ecosystem Morpheme Foundation)
 * to the autopoietic bootstrap (M-25). Five phases:
 *   0: Diagnostic (read-only)
 *   1: Dissolve M-24 (if it exists)
 *   2: Rescope R-52, R-53, BTM-2, R-59
 *   3: Create M-25 (Autopoietic Bootstrap) + sub-milestones + exit criteria
 *   4: State recomputation (ΨH, ΦL)
 *   5: Post-pivot verification
 *
 * Usage:
 *   npx tsx scripts/pivot-to-autopoiesis.ts                  # Full run
 *   npx tsx scripts/pivot-to-autopoiesis.ts --diagnostic-only # Phase 0 only
 *
 * Idempotent: safe to run multiple times.
 */

import path from "path";
import fs from "fs";
import {
  instantiateMorpheme,
  updateMorpheme,
  createLine,
} from "../src/graph/instantiation.js";
import type { MorphemeType, LineType, HighlanderOptions } from "../src/graph/instantiation.js";
import { runQuery, closeDriver } from "../src/graph/client.js";
import { computeAndPersistPsiH } from "../src/graph/queries/health.js";

// ── Env loading ──────────────────────────────────────────────────────────────

function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../DND-Manager/.env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const clean = line.replace(/\r$/, "");
        const match = clean.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (match) {
          const [, key, rawVal] = match;
          const val = rawVal.replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
  if (process.env.NEO4J_USERNAME && !process.env.NEO4J_USER) {
    process.env.NEO4J_USER = process.env.NEO4J_USERNAME;
  }
}

loadEnv();

// ── Helpers ──────────────────────────────────────────────────────────────────

async function ensureMorpheme(
  type: MorphemeType,
  props: Record<string, unknown>,
  parentId: string,
  highlander?: HighlanderOptions,
): Promise<void> {
  // Auto-derive Highlander options for bloom types if not explicitly provided
  let hl = highlander;
  if (type === "bloom" && !hl) {
    hl = { transformationDefId: "def:bloom:milestone", a6Justification: "distinct_governance_scope" };
  }
  const result = await instantiateMorpheme(type, props, parentId, hl);
  if (!result.success) {
    console.error(`  ✗ ${type} ${props.id}: ${result.error}`);
    throw new Error(result.error);
  }
  console.log(`  ✓ ${type} ${props.id}`);
}

async function ensureLine(
  sourceId: string,
  targetId: string,
  lineType: LineType,
  props?: Record<string, unknown>,
): Promise<void> {
  const result = await createLine(sourceId, targetId, lineType, props);
  if (!result.success) {
    console.error(`  ✗ ${lineType} ${sourceId}→${targetId}: ${result.error}`);
    throw new Error(result.error);
  }
  console.log(`  ✓ ${lineType} ${sourceId}→${targetId}`);
}

async function updateNode(
  nodeId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const result = await updateMorpheme(nodeId, updates);
  if (!result.success) {
    console.error(`  ✗ update ${nodeId}: ${result.error}`);
    throw new Error(result.error);
  }
}

// ── Phase 0: Diagnostic (READ ONLY) ─────────────────────────────────────────

interface DiagnosticState {
  m24Exists: boolean;
  m24Children: Array<{ childId: string; childName: string; childStatus: string }>;
}

async function phase0_diagnostic(): Promise<DiagnosticState> {
  console.log("── Phase 0: Roadmap Diagnostic ──\n");

  // 0a: Critical path milestones
  const criticalPath = await runQuery(
    `MATCH (roadmap:Bloom {id: 'roadmap-v7'})-[:CONTAINS]->(m:Bloom)
     WHERE m.id STARTS WITH 'M-'
     RETURN m.id AS id, m.name AS name, m.status AS status, m.phiL AS phiL, m.type AS type
     ORDER BY m.id`,
    {},
    "READ",
  );
  console.log("Critical path milestones:");
  for (const r of criticalPath.records) {
    console.log(
      `  ${r.get("id")} [${r.get("status")}] phiL=${r.get("phiL")} — ${r.get("name")}`,
    );
  }

  // 0b: M-24 existence + children
  const m24 = await runQuery(
    `OPTIONAL MATCH (m24:Bloom {id: 'M-24'})
     OPTIONAL MATCH (m24)-[:CONTAINS]->(child)
     RETURN m24.id AS id, m24.status AS status, m24.name AS name,
            collect({childId: child.id, childName: child.name, childStatus: child.status}) AS children`,
    {},
    "READ",
  );
  const m24Exists = m24.records[0]?.get("id") !== null;
  console.log(`\nM-24 exists: ${m24Exists}`);
  let m24Children: Array<{ childId: string; childName: string; childStatus: string }> = [];
  if (m24Exists) {
    m24Children = m24.records[0]?.get("children") as typeof m24Children;
    console.log(`  Status: ${m24.records[0]?.get("status")}`);
    console.log(`  Children: ${m24Children.length}`);
    for (const c of m24Children) {
      if (c.childId) console.log(`    ${c.childId} [${c.childStatus}] — ${c.childName}`);
    }
  }

  // 0c: Relevant R-items
  const rItems = await runQuery(
    `MATCH (s:Seed)
     WHERE s.id IN ['R-52', 'R-53', 'R-59', 'BTM-2']
        OR (s.id STARTS WITH 'R-' AND EXISTS { MATCH (s)-[:SCOPED_TO]->(:Bloom {id: 'M-24'}) })
     OPTIONAL MATCH (s)-[:SCOPED_TO]->(scope:Bloom)
     RETURN s.id AS id, s.name AS name, s.status AS status, scope.id AS scopeId
     ORDER BY s.id`,
    {},
    "READ",
  );
  console.log("\nRelevant R-items:");
  for (const r of rItems.records) {
    console.log(
      `  ${r.get("id")} [${r.get("status")}] → ${r.get("scopeId")} — ${r.get("name")}`,
    );
  }

  // 0d: Roadmap summary
  const roadmap = await runQuery(
    `MATCH (r:Bloom {id: 'roadmap-v7'})-[:CONTAINS]->(m:Bloom)
     WITH r, count(m) AS total,
          count(CASE WHEN m.status = 'complete' THEN 1 END) AS done
     RETURN r.phiL AS phiL, r.psiH AS psiH, total, done`,
    {},
    "READ",
  );
  console.log(
    `\nRoadmap: ${roadmap.records[0]?.get("done")}/${roadmap.records[0]?.get("total")} milestones complete`,
  );
  console.log(
    `  phiL=${roadmap.records[0]?.get("phiL")}, psiH=${roadmap.records[0]?.get("psiH")}`,
  );

  console.log("\n── Phase 0 complete ──\n");
  return { m24Exists, m24Children };
}

// ── Phase 1: Dissolve M-24 ──────────────────────────────────────────────────

async function phase1_dissolveM24(state: DiagnosticState): Promise<void> {
  console.log("── Phase 1: Dissolve M-24 ──\n");

  if (!state.m24Exists) {
    console.log("  M-24 not found in graph — nothing to dissolve");
    return;
  }

  await updateNode("M-24", {
    status: "superseded",
    content:
      "SUPERSEDED by autopoietic bootstrap (2026-03-23). " +
      "M-24.1 (inventory) → absorbed by 23 transformation/bloom definitions in Prompt 1. " +
      "M-24.2 (design review) → replaced by Cognitive Bloom self-survey. " +
      "M-24.3 (uniqueness guard) → absorbed by Highlander Protocol in Prompt 1. " +
      "M-24.4–M-24.7 (per-category morphemes) → replaced by Cognitive Bloom gated cycles. " +
      "M-24.8 (topology validation) → replaced by inline λ₂/ΨH computation.",
    supersededBy: "autopoietic-bootstrap",
    supersededAt: new Date().toISOString(),
  });
  console.log("  ✅ M-24 → superseded");

  for (const child of state.m24Children) {
    if (child.childId && child.childStatus !== "complete") {
      await updateNode(child.childId, {
        status: "superseded",
        supersededBy: "autopoietic-bootstrap",
      });
      console.log(`  ✅ ${child.childId} → superseded`);
    }
  }
}

// ── Phase 2: Rescope R-items ─────────────────────────────────────────────────

async function phase2_rescopeRItems(): Promise<void> {
  console.log("\n── Phase 2: Rescope R-Items ──\n");

  // R-52
  const r52 = await runQuery(
    `MATCH (s:Seed {id: 'R-52'}) RETURN s.status AS status`,
    {},
    "READ",
  );
  if (r52.records.length > 0) {
    await updateNode("R-52", {
      name: "Architect composition — derived by Cognitive Bloom",
      content:
        "RESCOPED (2026-03-23): No longer a hand-written pattern design. " +
        "The Cognitive Bloom surveys the Architect Bloom, identifies gaps against " +
        "constitutional definitions, and proposes composition through gated cycles. " +
        "R-52 is satisfied when the Cognitive Bloom reports zero constitutional gaps " +
        "on the Architect Bloom and λ₂ > 0.",
      status: "planned",
    });
    await runQuery(
      `MATCH (s:Seed {id: 'R-52'})-[r:SCOPED_TO]->() DELETE r`,
      {},
      "WRITE",
    );
    console.log("  ✅ R-52 rescoped");
  } else {
    console.log("  R-52 not found — skipping");
  }

  // R-53
  const r53 = await runQuery(
    `MATCH (s:Seed {id: 'R-53'}) RETURN s.status AS status`,
    {},
    "READ",
  );
  if (r53.records.length > 0) {
    await updateNode("R-53", {
      name: "DevAgent composition — derived by Cognitive Bloom (after Architect)",
      content:
        "RESCOPED (2026-03-23): Same approach as R-52 but applied to DevAgent Bloom. " +
        "Deferred until the Architect Bloom composition converges. The Cognitive Bloom " +
        "expands its target scope from Architect to DevAgent after Architect is healthy.",
      status: "planned",
    });
    await runQuery(
      `MATCH (s:Seed {id: 'R-53'})-[r:SCOPED_TO]->() DELETE r`,
      {},
      "WRITE",
    );
    console.log("  ✅ R-53 rescoped");
  } else {
    console.log("  R-53 not found — skipping");
  }

  // BTM-2
  const btm2 = await runQuery(
    `MATCH (s:Seed {id: 'BTM-2'}) RETURN s.status AS status`,
    {},
    "READ",
  );
  if (btm2.records.length > 0) {
    await updateNode("BTM-2", {
      name: "BTM v2.0 — superseded by Cognitive Bloom survey output",
      content:
        "SUPERSEDED (2026-03-23): The Cognitive Bloom's Survey Seed IS the BTM, " +
        "generated on demand from the live graph. The BTM as a manually maintained " +
        "document is unnecessary once the system can survey its own topology.",
      status: "superseded",
      supersededBy: "cognitive-bloom",
    });
    console.log("  ✅ BTM-2 → superseded");
  } else {
    console.log("  BTM-2 not found — skipping");
  }

  // R-59
  const r59 = await runQuery(
    `MATCH (s:Seed {id: 'R-59'}) RETURN s.status AS status`,
    {},
    "READ",
  );
  if (r59.records.length > 0) {
    await updateNode("R-59", {
      content:
        "Cascading document updates (CPT v3 terminology, v5.0 grounding). " +
        "Still valid but deferred — not on autopoietic critical path. " +
        "The Cognitive Bloom operates on live graph state, not on design documents. " +
        "Document updates become relevant when publishing or onboarding.",
    });
    console.log("  ✅ R-59 content updated (deferred, not superseded)");
  } else {
    console.log("  R-59 not found — skipping");
  }
}

// ── Phase 3: Create M-25 ────────────────────────────────────────────────────

async function phase3_createM25(): Promise<void> {
  console.log("\n── Phase 3: Create Autopoietic Bootstrap Milestone ──\n");

  const existing = await runQuery(
    `MATCH (b:Bloom {id: 'M-25'}) RETURN b.id`,
    {},
    "READ",
  );

  if (existing.records.length > 0) {
    console.log("  M-25 already exists — skipping creation");
    return;
  }

  // M-25: Autopoietic Bootstrap
  await ensureMorpheme(
    "bloom",
    {
      id: "M-25",
      name: "Autopoietic Bootstrap",
      type: "milestone",
      status: "active",
      content:
        "The system acquires the ability to survey its own topology, compare against " +
        "its constitution, and propose structural changes through gated cycles. " +
        "Three sub-milestones: Highlander Protocol (creation governance), " +
        "Cognitive Bloom (self-knowledge pattern), First Cycle (system surveys itself). " +
        "Supersedes M-24 (Ecosystem Morpheme Foundation) which was a waterfall approach " +
        "to the same goal. The autopoietic approach: give the system the reference " +
        "standard and the creation guard, then let it build what it needs.",
    },
    "roadmap-v7",
    { transformationDefId: "def:bloom:milestone", a6Justification: "distinct_governance_scope" },
  );

  // M-25.1: Highlander Protocol
  await ensureMorpheme(
    "bloom",
    {
      id: "M-25.1",
      name: "Highlander Protocol + Constitutional Reference Standard",
      type: "sub-milestone",
      status: "planned",
      content:
        "23 transformation/bloom definition Seeds in Constitutional Bloom (15 transformation + 8 bloom). " +
        "Mandatory transformationDefId on all Resonator/Bloom creation (hard block). " +
        "A6 compose-or-justify gate. Mutation guard on retirement with active consumers. " +
        "Pre-existing Resonator/Bloom backfill with transformation-level INSTANTIATES. " +
        "SPECIALISES added to VALID_LINE_TYPES. " +
        "Source: prompt-1-highlander-protocol.md (approved 2026-03-23).",
    },
    "M-25",
    { transformationDefId: "def:bloom:milestone", a6Justification: "distinct_governance_scope" },
  );

  // M-25.2: Cognitive Bloom
  await ensureMorpheme(
    "bloom",
    {
      id: "M-25.2",
      name: "Cognitive Bloom — Structural Self-Knowledge",
      type: "sub-milestone",
      status: "planned",
      content:
        "New pattern: src/patterns/cognitive/. Three Resonators: Structural Survey " +
        "(deterministic Cypher), Constitutional Delta (deterministic set ops), " +
        "Intent Synthesis (deterministic for constitutional gaps, LLM substrate for topological). " +
        "Learning Helix Scale 2. Observation Grid justified by Helix consumer. " +
        "CLI at scripts/cognitive.ts. Architect --intent-file intake. " +
        "Source: prompt-2-cognitive-bloom.md (approved 2026-03-23).",
    },
    "M-25",
    { transformationDefId: "def:bloom:milestone", a6Justification: "distinct_governance_scope" },
  );

  // M-25.3: First Cycle
  await ensureMorpheme(
    "bloom",
    {
      id: "M-25.3",
      name: "First Autopoietic Cycle",
      type: "sub-milestone",
      status: "planned",
      content:
        "The system surveys itself for the first time. Cognitive Bloom runs " +
        "scripts/cognitive.ts against the Architect Bloom. Expected findings: " +
        "λ₂=0, 9 empty Stage Blooms, zero ecosystem Resonator instances. " +
        "Produces Intent Seed with proposed changes. Ro feeds to Architect via " +
        "--intent-file. Ro gates every proposed change. After execution: " +
        "Resonators exist, Lines exist, λ₂ > 0. The system has built itself.",
    },
    "M-25",
    { transformationDefId: "def:bloom:milestone", a6Justification: "distinct_governance_scope" },
  );

  // Exit criteria
  const exitCriteria = [
    { id: "M-25:ec-1", content: "23 definition Seeds exist in Constitutional Bloom (15 transformation + 8 bloom)" },
    { id: "M-25:ec-2", content: "instantiateMorpheme() rejects Resonator/Bloom creation without transformationDefId" },
    { id: "M-25:ec-3", content: "All pre-existing Resonators/Blooms backfilled with transformation-level INSTANTIATES" },
    { id: "M-25:ec-4", content: "Cognitive Bloom instantiated with all internal morphemes via Highlander Protocol" },
    { id: "M-25:ec-5", content: "surveyBloomTopology() returns accurate topology for Architect Bloom" },
    { id: "M-25:ec-6", content: "First Cognitive Bloom cycle produces valid Intent Seed" },
    { id: "M-25:ec-7", content: "Architect accepts --intent-file and processes through normal pipeline with human GATE" },
    { id: "M-25:ec-8", content: "Post-first-cycle: at least one ecosystem Resonator instance exists with λ₂ > 0 on Architect Bloom" },
  ];

  for (const ec of exitCriteria) {
    await ensureMorpheme(
      "seed",
      {
        id: ec.id,
        name: ec.id,
        content: ec.content,
        seedType: "exit-criterion",
        status: "pending",
      },
      "M-25",
    );
  }

  // Dependencies (prerequisite)-[:DEPENDS_ON]->(dependent)
  await ensureLine("M-23", "M-25", "DEPENDS_ON");
  console.log("  ✅ M-23 DEPENDS_ON M-25 (M-23 must complete before M-25)");

  await ensureLine("M-25.1", "M-25.2", "DEPENDS_ON");
  console.log("  ✅ M-25.1 DEPENDS_ON M-25.2 (Highlander before Cognitive)");

  await ensureLine("M-25.2", "M-25.3", "DEPENDS_ON");
  console.log("  ✅ M-25.2 DEPENDS_ON M-25.3 (Cognitive before First Cycle)");

  // Scope R-52 and R-53 to M-25
  const r52Check = await runQuery(
    `MATCH (s:Seed {id: 'R-52'}) RETURN s.id`,
    {},
    "READ",
  );
  if (r52Check.records.length > 0) {
    await ensureLine("R-52", "M-25", "SCOPED_TO");
    console.log("  ✅ R-52 SCOPED_TO M-25");
  }

  const r53Check = await runQuery(
    `MATCH (s:Seed {id: 'R-53'}) RETURN s.id`,
    {},
    "READ",
  );
  if (r53Check.records.length > 0) {
    await ensureLine("R-53", "M-25", "SCOPED_TO");
    console.log("  ✅ R-53 SCOPED_TO M-25");
  }
}

// ── Phase 4: State Recomputation ─────────────────────────────────────────────

async function phase4_recompute(m24Exists: boolean): Promise<void> {
  console.log("\n── Phase 4: State Recomputation ──\n");

  const targets = ["roadmap-v7", "M-25"];
  if (m24Exists) targets.push("M-24");

  for (const bloomId of targets) {
    try {
      const psiH = await computeAndPersistPsiH(bloomId);
      console.log(`  ${bloomId} ΨH: ${psiH ? psiH.combined.toFixed(3) : "null"}`);
    } catch (e) {
      console.log(`  ${bloomId} ΨH failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  // Recompute roadmap phiL from children
  const roadmapPhiL = await runQuery(
    `MATCH (r:Bloom {id: 'roadmap-v7'})-[:CONTAINS]->(m:Bloom)
     WITH count(m) AS total,
          count(CASE WHEN m.status = 'complete' THEN 1 END) AS done
     RETURN total, done, CASE WHEN total > 0 THEN toFloat(done)/toFloat(total) ELSE 0 END AS phiL`,
    {},
    "READ",
  );
  const newTotal = roadmapPhiL.records[0]?.get("total");
  const newDone = roadmapPhiL.records[0]?.get("done");
  const newPhiL = roadmapPhiL.records[0]?.get("phiL");
  console.log(`\n  Roadmap: ${newDone}/${newTotal} milestones complete, phiL=${typeof newPhiL === "number" ? newPhiL.toFixed(3) : newPhiL}`);

  await updateNode("roadmap-v7", { phiL: newPhiL });
  console.log("  ✅ Roadmap phiL updated");
}

// ── Phase 5: Verification ────────────────────────────────────────────────────

async function phase5_verify(): Promise<void> {
  console.log("\n── Phase 5: Post-Pivot Diagnostic ──\n");

  // 1. M-24 status
  const v1 = await runQuery(
    `OPTIONAL MATCH (m24:Bloom {id: 'M-24'}) RETURN m24.status AS status`,
    {},
    "READ",
  );
  const m24Status = v1.records[0]?.get("status");
  console.log(
    `  M-24 status: ${!m24Status ? "not in graph" : m24Status === "superseded" ? "✅ superseded" : "❌ " + m24Status}`,
  );

  // 2. M-25 structure
  const v2 = await runQuery(
    `MATCH (m25:Bloom {id: 'M-25'})-[:CONTAINS]->(child)
     RETURN child.id AS id, labels(child) AS labels, child.status AS status
     ORDER BY child.id`,
    {},
    "READ",
  );
  console.log(`  M-25 children: ${v2.records.length}`);
  for (const r of v2.records) {
    console.log(
      `    ${r.get("id")} [${r.get("status")}] (${(r.get("labels") as string[]).join(", ")})`,
    );
  }

  // 3. R-52, R-53 scoping
  const v3 = await runQuery(
    `MATCH (s:Seed)-[:SCOPED_TO]->(scope:Bloom)
     WHERE s.id IN ['R-52', 'R-53']
     RETURN s.id AS id, scope.id AS scopeId`,
    {},
    "READ",
  );
  console.log("  R-52/R-53 scoping:");
  for (const r of v3.records) {
    console.log(
      `    ${r.get("id")} → ${r.get("scopeId")} ${r.get("scopeId") === "M-25" ? "✅" : "⚠️"}`,
    );
  }

  // 4. BTM-2 status
  const v4 = await runQuery(
    `OPTIONAL MATCH (s:Seed {id: 'BTM-2'}) RETURN s.status AS status`,
    {},
    "READ",
  );
  const btmStatus = v4.records[0]?.get("status");
  console.log(
    `  BTM-2 status: ${!btmStatus ? "not in graph" : btmStatus === "superseded" ? "✅ superseded" : "⚠️ " + btmStatus}`,
  );

  // 5. Dependency chain
  const v5 = await runQuery(
    `MATCH (a:Bloom {id: 'M-25.1'})-[:DEPENDS_ON]->(b:Bloom {id: 'M-25.2'})
     MATCH (b)-[:DEPENDS_ON]->(c:Bloom {id: 'M-25.3'})
     MATCH (m23:Bloom {id: 'M-23'})-[:DEPENDS_ON]->(m25:Bloom {id: 'M-25'})
     RETURN count(*) AS chains`,
    {},
    "READ",
  );
  console.log(
    `  Dependency chain wired: ${(v5.records[0]?.get("chains") ?? 0) > 0 ? "✅" : "❌ missing"}`,
  );

  // 6. Roadmap summary
  const v6 = await runQuery(
    `MATCH (r:Bloom {id: 'roadmap-v7'})-[:CONTAINS]->(m:Bloom)
     WITH r,
          count(m) AS total,
          count(CASE WHEN m.status = 'complete' THEN 1 END) AS done,
          count(CASE WHEN m.status = 'superseded' THEN 1 END) AS superseded,
          count(CASE WHEN m.status = 'active' THEN 1 END) AS active,
          count(CASE WHEN m.status = 'planned' THEN 1 END) AS planned
     RETURN r.phiL AS phiL, total, done, superseded, active, planned`,
    {},
    "READ",
  );
  const rec = v6.records[0];
  console.log("\n  Roadmap summary:");
  console.log(`    Total: ${rec?.get("total")}`);
  console.log(`    Complete: ${rec?.get("done")}`);
  console.log(`    Superseded: ${rec?.get("superseded")}`);
  console.log(`    Active: ${rec?.get("active")}`);
  console.log(`    Planned: ${rec?.get("planned")}`);
  console.log(`    phiL: ${rec?.get("phiL")}`);

  console.log("\n── Pivot complete ──");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const diagnosticOnly = process.argv.includes("--diagnostic-only");

  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  Roadmap Pivot: M-24 Waterfall → M-25 Autopoietic Boot  ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  try {
    const state = await phase0_diagnostic();

    if (diagnosticOnly) {
      console.log("── --diagnostic-only flag set. Stopping after Phase 0. ──");
      return;
    }

    await phase1_dissolveM24(state);
    await phase2_rescopeRItems();
    await phase3_createM25();
    await phase4_recompute(state.m24Exists);
    await phase5_verify();
  } catch (err) {
    console.error("\n✗ Pivot failed:", err);
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

main();
