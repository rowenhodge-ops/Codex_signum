/**
 * M-22: Vertical Wiring — Graph Setup
 *
 * Creates the M-22 milestone Bloom, 7 sub-milestone Blooms,
 * DEPENDS_ON chains, and SPECIFIED_BY Lines to Bridge Grid spec Seeds.
 *
 * [NO-PIPELINE] — mechanical graph mutation.
 * All writes via instantiateMorpheme() and createLine(). MERGE-based, idempotent.
 *
 * Usage:
 *   npx tsx scripts/m22-vertical-wiring-setup.ts
 */

import path from "path";
import fs from "fs";
import { readTransaction, closeDriver } from "../src/graph/client.js";
import {
  instantiateMorpheme,
  createLine,
} from "../src/graph/instantiation.js";

// ─── Load environment ───────────────────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────────────

function ok(label: string) {
  console.log(`  ✓ ${label}`);
}

function fail(label: string, error: string) {
  console.error(`  ✗ ${label}: ${error}`);
}

async function nodeExists(id: string): Promise<boolean> {
  const result = await readTransaction(async (tx) => {
    const res = await tx.run(
      "MATCH (n {id: $id}) RETURN count(n) AS cnt",
      { id },
    );
    const cnt = res.records[0]?.get("cnt");
    return typeof cnt === "object" && cnt !== null ? cnt.toNumber() : Number(cnt);
  });
  return (result ?? 0) > 0;
}

// ─── Constants ──────────────────────────────────────────────────────

const PARENT_BLOOM = "constitutional-bloom";
const M22_ID = "bloom:m-22";
const M17_ID = "M-17";

interface SubMilestoneDef {
  id: string;
  name: string;
  content: string;
}

const SUB_MILESTONES: SubMilestoneDef[] = [
  {
    id: "bloom:m-22.1",
    name: "M-22.1: Signal Conditioning → Execution Path",
    content:
      "Connect 7 signal conditioning Resonators in src/computation/signals/ to pipeline observation stream. Raw observations enter Debounce→Hampel→EWMA→CUSUM→MACD→Hysteresis→Trend chain. Conditioned output feeds ΦL computation.",
  },
  {
    id: "bloom:m-22.2",
    name: "M-22.2: ΦL from Pipeline",
    content:
      "Replace qualityScore proxy with real 4-factor ΦL composite (axiom_compliance, provenance_clarity, usage_success_rate, temporal_stability). Fed by conditioned signals from M-22.1. Ring buffer state per topology-dependent window sizes. Maturity modifier applied.",
  },
  {
    id: "bloom:m-22.3",
    name: "M-22.3: ΨH for Pipeline",
    content:
      "Live λ₂ + TV_G computation on Architect Bloom and composition subgraphs. Temporal decomposition (EWMA trend, friction_transient, friction_durable). Harmonic profile stored on Bloom. Three outputs from one Laplacian eigendecomposition.",
  },
  {
    id: "bloom:m-22.4",
    name: "M-22.4: εR Bloom Aggregation",
    content:
      "Composition-scope εR from Decision Seeds within containment. exploratory_decisions/total_decisions at Bloom scope. Upward propagation via simple averaging. Structural review trigger when above maturity-indexed bound (Young 0.40, Maturing 0.30, Mature 0.15).",
  },
  {
    id: "bloom:m-22.5",
    name: "M-22.5: Hierarchical Health Propagation",
    content:
      "Dampened ΦL through CONTAINS Lines. γ_effective = min(0.7, 0.8/k). CASCADE_LIMIT=2. Asymmetric rate: recovery at γ/2.5. Algedonic bypass at ΦL < 0.1. Triggered by live pipeline state changes via Mutation Resonator.",
  },
  {
    id: "bloom:m-22.6",
    name: "M-22.6: Line Conductivity Implementation",
    content:
      "Three-layer circuit model. Layer 1: morpheme hygiene (content, status, phiL, INSTANTIATES — binary). Layer 2: grammatical shape (connection type valid per G2/G3/G4 — binary). Layer 3: contextual fitness (friction from dimensional profiles — continuous). Cached on Line, invalidated on endpoint change.",
  },
  {
    id: "bloom:m-22.7",
    name: "M-22.7: Event-Triggered Structural Review",
    content:
      "Wire 6 triggers to Structural Review Resonator: λ₂ drop on composition change, friction spike (TV_G > 0.5 sustained), cascade at 2nd level, εR spike above range, ΦL velocity > 0.05/day, Ω gradient inversion. Output: diagnostic Seeds to Structural Review Grid.",
  },
];

// SPECIFIED_BY wiring: sub-milestone → spec seed
const SPECIFIED_BY_LINES: { source: string; target: string; label: string }[] = [
  { source: "bloom:m-22.1", target: "spec:bridge:signal-conditioning", label: "Signal conditioning spec" },
  { source: "bloom:m-22.2", target: "spec:bridge:phi-l", label: "ΦL computation spec" },
  { source: "bloom:m-22.3", target: "spec:bridge:psi-h", label: "ΨH computation spec" },
  { source: "bloom:m-22.4", target: "spec:bridge:composition-epsilon-r", label: "Composition εR spec" },
  { source: "bloom:m-22.5", target: "spec:bridge:degradation-cascade", label: "Degradation cascade spec" },
  { source: "bloom:m-22.6", target: "spec:bridge:line-conductivity", label: "Line conductivity spec" },
  { source: "bloom:m-22.7", target: "spec:bridge:structural-review", label: "Structural review spec" },
];

// Internal dependency chain (prerequisite → dependent)
const DEPENDS_ON_LINES: { source: string; target: string; label: string }[] = [
  { source: "bloom:m-22.1", target: "bloom:m-22.2", label: "ΦL needs conditioned signals" },
  { source: "bloom:m-22.1", target: "bloom:m-22.3", label: "ΨH partially needs conditioned signals" },
  { source: "bloom:m-22.1", target: "bloom:m-22.4", label: "εR needs Decision Seeds from conditioned pipeline" },
  { source: "bloom:m-22.2", target: "bloom:m-22.5", label: "Hierarchical health needs ΦL to propagate" },
  { source: "bloom:m-22.2", target: "bloom:m-22.6", label: "Conductivity Layer 3 needs ΦL for dimensional profiles" },
  { source: "bloom:m-22.5", target: "bloom:m-22.7", label: "Event triggers need all three state dimensions" },
  { source: "bloom:m-22.3", target: "bloom:m-22.7", label: "Event triggers need ΨH" },
  { source: "bloom:m-22.4", target: "bloom:m-22.7", label: "Event triggers need εR" },
];

// ─── Phase 0: Idempotency Check ─────────────────────────────────────

async function phase0(): Promise<boolean> {
  console.log("\n═══ Phase 0: Idempotency Check ═══\n");
  const exists = await nodeExists(M22_ID);
  if (exists) {
    console.log("  M-22 Bloom already exists. Script is idempotent — continuing to verify/update.");
    return true;
  }
  console.log("  M-22 Bloom does not exist. Proceeding with creation.");
  return false;
}

// ─── Phase 1: Create M-22 Parent Bloom ──────────────────────────────

async function phase1(): Promise<void> {
  console.log("\n═══ Phase 1: M-22 Milestone Bloom ═══\n");

  const result = await instantiateMorpheme(
    "bloom",
    {
      id: M22_ID,
      name: "M-22: Vertical Wiring",
      content:
        "Connect the computation layer to the live pipeline. Close the State Dimension Gap. Seven sub-milestones wiring signal conditioning, ΦL, ΨH, εR, hierarchical health, Line conductivity, and event-triggered review.",
      type: "milestone",
      status: "planned",
      phiL: 0.0,
    },
    PARENT_BLOOM,
  );

  if (result.success) {
    ok(`Bloom '${M22_ID}' (parent: ${PARENT_BLOOM})`);
  } else {
    fail("M-22 Bloom", result.error ?? "unknown");
  }
}

// ─── Phase 2: Wire DEPENDS_ON from M-17 (prerequisite) to M-22 ─────

async function phase2(): Promise<void> {
  console.log("\n═══ Phase 2: External DEPENDS_ON ═══\n");

  const m17Exists = await nodeExists(M17_ID);
  if (m17Exists) {
    const result = await createLine(
      M17_ID,
      M22_ID,
      "DEPENDS_ON",
      { label: "Vertical wiring requires Bridge v3.0 spec" },
    );
    if (result.success) {
      ok(`DEPENDS_ON: ${M17_ID} → ${M22_ID}`);
    } else {
      fail("DEPENDS_ON M-17→M-22", result.error ?? "unknown");
    }
  } else {
    console.log(`  ⚠ ${M17_ID} not found — skipping DEPENDS_ON wire`);
  }
}

// ─── Phase 3: Create 7 Sub-Milestone Blooms ─────────────────────────

async function phase3(): Promise<void> {
  console.log("\n═══ Phase 3: Sub-Milestone Blooms (7) ═══\n");

  let created = 0;
  let failed = 0;

  for (const sub of SUB_MILESTONES) {
    const result = await instantiateMorpheme(
      "bloom",
      {
        id: sub.id,
        name: sub.name,
        content: sub.content,
        type: "milestone",
        status: "planned",
        phiL: 0.0,
      },
      M22_ID,
    );

    if (result.success) {
      ok(sub.id);
      created++;
    } else {
      fail(sub.id, result.error ?? "unknown");
      failed++;
    }
  }

  console.log(`\n  Sub-milestones: ${created} created/updated, ${failed} failed`);
}

// ─── Phase 4: SPECIFIED_BY Lines ────────────────────────────────────

async function phase4(): Promise<void> {
  console.log("\n═══ Phase 4: SPECIFIED_BY Lines (7) ═══\n");

  let created = 0;
  let failed = 0;

  for (const line of SPECIFIED_BY_LINES) {
    const result = await createLine(
      line.source,
      line.target,
      "SPECIFIED_BY",
      { label: line.label },
    );

    if (result.success) {
      ok(`${line.source} → ${line.target}`);
      created++;
    } else {
      fail(`${line.source} → ${line.target}`, result.error ?? "unknown");
      failed++;
    }
  }

  console.log(`\n  SPECIFIED_BY Lines: ${created} created, ${failed} failed`);
}

// ─── Phase 5: Internal DEPENDS_ON Chain ─────────────────────────────

async function phase5(): Promise<void> {
  console.log("\n═══ Phase 5: Internal DEPENDS_ON Chain (8) ═══\n");

  let created = 0;
  let failed = 0;

  for (const line of DEPENDS_ON_LINES) {
    const result = await createLine(
      line.source,
      line.target,
      "DEPENDS_ON",
      { label: line.label },
    );

    if (result.success) {
      ok(`${line.source} → ${line.target}`);
      created++;
    } else {
      fail(`${line.source} → ${line.target}`, result.error ?? "unknown");
      failed++;
    }
  }

  console.log(`\n  DEPENDS_ON Lines: ${created} created, ${failed} failed`);
}

// ─── Phase 6: Verification ──────────────────────────────────────────

async function phase6(): Promise<void> {
  console.log("\n═══ Phase 6: Verification ═══\n");

  // 6.1 M-22 children
  const children = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (m:Bloom {id: 'bloom:m-22'})-[:CONTAINS]->(child)
      RETURN child.id AS id, child.name AS name, child.status AS status
      ORDER BY child.id
    `);
    return res.records.map((r) => ({
      id: r.get("id"),
      name: r.get("name"),
      status: r.get("status"),
    }));
  });
  const childPass = children.length === 7;
  console.log(`  6.1 Children: ${children.length}/7 ${childPass ? "✓" : "✗"}`);
  children.forEach((c) => console.log(`      ${c.id} | ${c.status}`));

  // 6.2 DEPENDS_ON edges (external + internal)
  const deps = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (prereq)-[:DEPENDS_ON]->(dep)
      WHERE dep.id = 'bloom:m-22' OR prereq.id STARTS WITH 'bloom:m-22'
      RETURN prereq.id AS from, dep.id AS to
      ORDER BY prereq.id, dep.id
    `);
    return res.records.map((r) => ({
      from: r.get("from"),
      to: r.get("to"),
    }));
  });
  const depPass = deps.length === 9; // 1 external + 8 internal
  console.log(`\n  6.2 DEPENDS_ON edges: ${deps.length}/9 ${depPass ? "✓" : "✗"}`);
  deps.forEach((d) => console.log(`      ${d.from} → ${d.to}`));

  // 6.3 SPECIFIED_BY Lines
  const specLines = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (m)-[:SPECIFIED_BY]->(spec)
      WHERE m.id STARTS WITH 'bloom:m-22.'
      RETURN m.id AS milestoneId, spec.id AS specId
      ORDER BY m.id
    `);
    return res.records.map((r) => ({
      milestoneId: r.get("milestoneId"),
      specId: r.get("specId"),
    }));
  });
  const specPass = specLines.length === 7;
  console.log(`\n  6.3 SPECIFIED_BY Lines: ${specLines.length}/7 ${specPass ? "✓" : "✗"}`);
  specLines.forEach((s) => console.log(`      ${s.milestoneId} → ${s.specId}`));

  // 6.4 INSTANTIATES edges
  const instantiates = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (n)-[:INSTANTIATES]->(def)
      WHERE n.id = 'bloom:m-22' OR n.id STARTS WITH 'bloom:m-22.'
      RETURN n.id AS nodeId, def.id AS defId
      ORDER BY n.id
    `);
    return res.records.map((r) => ({
      nodeId: r.get("nodeId"),
      defId: r.get("defId"),
    }));
  });
  const instPass = instantiates.length === 8; // M-22 + 7 subs
  console.log(`\n  6.4 INSTANTIATES: ${instantiates.length}/8 ${instPass ? "✓" : "✗"}`);

  // 6.5 Parent containment for M-22 itself
  const parent = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (parent)-[:CONTAINS]->(b:Bloom {id: 'bloom:m-22'})
      RETURN parent.id AS parentId, parent.name AS parentName
    `);
    return res.records[0]
      ? { id: res.records[0].get("parentId"), name: res.records[0].get("parentName") }
      : null;
  });
  const parentPass = parent?.id === PARENT_BLOOM;
  console.log(`\n  6.5 Parent: ${parent?.id ?? "none"} ${parentPass ? "✓" : "✗"}`);

  // Summary
  const allPass = childPass && depPass && specPass && instPass && parentPass;
  console.log(`\n  Overall: ${allPass ? "ALL CHECKS PASSED ✓" : "SOME CHECKS FAILED ✗"}`);
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("M-22: Vertical Wiring — Graph Setup");
  console.log("====================================");
  console.log(`Parent: ${PARENT_BLOOM}`);
  console.log(`Prerequisite: ${M17_ID}\n`);

  try {
    const alreadyExists = await phase0();

    if (!alreadyExists) {
      await phase1();
    } else {
      console.log("\n═══ Phase 1: M-22 already exists — skipping creation ═══");
    }

    await phase2();
    await phase3();
    await phase4();
    await phase5();
    await phase6();
  } finally {
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
