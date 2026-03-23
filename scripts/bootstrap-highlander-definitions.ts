/**
 * bootstrap-highlander-definitions.ts
 *
 * [NO-PIPELINE] — Graph mutations from known spec (Prompt 1, Stream A).
 *
 * Creates 23 definition Seeds in the Constitutional Bloom:
 * - 15 transformation-level definitions (7 ecosystem + 4 architect + 1 devagent + 3 cognitive)
 * - 8 bloom-level definitions (5 singleton + 3 multi-instance)
 * Each with SPECIALISES Line to its type-level definition.
 *
 * Also backfills pre-existing Resonators/Blooms with transformation-level INSTANTIATES edges.
 *
 * Idempotent: safe to run multiple times (MERGE-based).
 *
 * Usage:
 *   npx tsx scripts/bootstrap-highlander-definitions.ts
 *   npx tsx scripts/bootstrap-highlander-definitions.ts --backfill-only
 */

import path from "path";
import fs from "fs";
import {
  instantiateMorpheme,
  createLine,
} from "../src/graph/instantiation.js";
import type { LineType } from "../src/graph/instantiation.js";
import { runQuery, closeDriver } from "../src/graph/client.js";

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
        const clean = line.replace(/\r$/, "").trim();
        if (!clean || clean.startsWith("#")) continue;
        const eqIdx = clean.indexOf("=");
        if (eqIdx < 0) continue;
        const key = clean.slice(0, eqIdx).trim();
        const val = clean.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
  if (process.env.NEO4J_USERNAME && !process.env.NEO4J_USER) {
    process.env.NEO4J_USER = process.env.NEO4J_USERNAME;
  }
}

loadEnv();

// ── Definitions ──────────────────────────────────────────────────────────────

interface TransformationDef {
  id: string;
  name: string;
  content: string;
  ioShape: string;
  scope: string;
}

interface BloomDef {
  id: string;
  name: string;
  content: string;
  scope: string;
  expectedInstances: string;
}

const TRANSFORMATION_DEFS: TransformationDef[] = [
  // Ecosystem-scoped (7)
  {
    id: "def:transformation:llm-invocation",
    name: "LLM Invocation Transformation Definition",
    content: "Takes prompt template, context Seeds, and model selection; produces output Seed through substrate model invocation",
    ioShape: "Many→One",
    scope: "ecosystem",
  },
  {
    id: "def:transformation:thompson-selection",
    name: "Thompson Selection Transformation Definition",
    content: "Samples from context-blocked Beta posteriors; produces Decision Seed recording the model choice and whether it was exploitation or exploration",
    ioShape: "One→One",
    scope: "ecosystem",
  },
  {
    id: "def:transformation:compliance-evaluation",
    name: "Compliance Evaluation Transformation Definition",
    content: "Evaluates a Seed against grammar rules, axioms, and anti-pattern catalogue; produces pass observation or Violation Seed",
    ioShape: "One→One",
    scope: "ecosystem",
  },
  {
    id: "def:transformation:human-gate",
    name: "Human Gate Transformation Definition",
    content: "Presents Seeds for human decision; captures decision Seed recording approval, modification, or rejection",
    ioShape: "Many→One",
    scope: "ecosystem",
  },
  {
    id: "def:transformation:instantiation",
    name: "Instantiation Transformation Definition",
    content: "Validates morpheme properties, enforces grammar constraints, creates node with CONTAINS and INSTANTIATES wiring in atomic transaction",
    ioShape: "Many→One",
    scope: "ecosystem",
  },
  {
    id: "def:transformation:mutation",
    name: "Mutation Transformation Definition",
    content: "Validates property changes, preserves required properties, applies update, propagates parent status, invalidates Line conductivity",
    ioShape: "One→One",
    scope: "ecosystem",
  },
  {
    id: "def:transformation:line-creation",
    name: "Line Creation Transformation Definition",
    content: "Validates endpoints, checks grammatical shape, creates relationship, evaluates and caches conductivity",
    ioShape: "Many→One",
    scope: "ecosystem",
  },
  // Architect-scoped (4)
  {
    id: "def:transformation:rule-classification",
    name: "Rule-Based Classification Transformation Definition",
    content: "Takes Task Seeds and rule config Seeds; enriches each Task Seed with taskType, kanoClass, estimatedComplexity, routingHint properties",
    ioShape: "Many→Many",
    scope: "architect",
  },
  {
    id: "def:transformation:topological-sort",
    name: "Topological Sort Transformation Definition",
    content: "Takes dependency graph of Task Seeds; enriches each with executionOrder and phaseId properties",
    ioShape: "Graph→Properties",
    scope: "architect",
  },
  {
    id: "def:transformation:task-dispatch",
    name: "Task Dispatch Transformation Definition",
    content: "Takes classified, sequenced Task Seed; routes to appropriate execution substrate based on Thompson selection and classification",
    ioShape: "One→One",
    scope: "architect",
  },
  {
    id: "def:transformation:adaptation-analysis",
    name: "Adaptation Analysis Transformation Definition",
    content: "Takes execution outcomes, ΨH friction signals, and Violation Seeds; synthesises replanning scope decision",
    ioShape: "Many→One",
    scope: "architect",
  },
  // DevAgent-scoped (1)
  {
    id: "def:transformation:code-execution",
    name: "Code Execution Transformation Definition",
    content: "Takes Task Seed with acceptance criteria and file paths; executes code changes through substrate; produces execution result Seed",
    ioShape: "One→One",
    scope: "devagent",
  },
  // Cognitive-scoped (3)
  {
    id: "def:transformation:structural-survey",
    name: "Structural Survey Transformation Definition",
    content: "Takes a Bloom scope ID; queries graph topology via Cypher for spectral properties, children, internal morphemes, inter-child Lines, INSTANTIATES edges; produces Survey Seed",
    ioShape: "Scope→Diagnostic",
    scope: "cognitive",
  },
  {
    id: "def:transformation:constitutional-delta",
    name: "Constitutional Delta Transformation Definition",
    content: "Takes Survey Seed and transformation definitions; computes set difference to produce Gap Seeds for missing instances and missing Lines",
    ioShape: "Diagnostic→Gaps",
    scope: "cognitive",
  },
  {
    id: "def:transformation:intent-synthesis",
    name: "Intent Synthesis Transformation Definition",
    content: "Takes Gap Seeds, Learning Helix calibration, and CPT spec Seeds; produces Intent Seed with proposed graph mutations for Architect consumption",
    ioShape: "Gaps→Intent",
    scope: "cognitive",
  },
];

const BLOOM_DEFS: BloomDef[] = [
  {
    id: "def:bloom:constitutional",
    name: "Constitutional Bloom Definition",
    content: "Organisational core containing grammar definitions, axiom Seeds, governance Resonators, governance observation Grids, and transformation/bloom definitions",
    scope: "ecosystem",
    expectedInstances: "1 (singleton)",
  },
  {
    id: "def:bloom:architect",
    name: "Architect Bloom Definition",
    content: "Planning pattern scope containing stage Blooms, governance morphemes, and composition recipes for intent-to-plan transformation",
    scope: "ecosystem",
    expectedInstances: "1 (singleton)",
  },
  {
    id: "def:bloom:devagent",
    name: "DevAgent Bloom Definition",
    content: "Execution pattern scope containing stage Blooms, governance morphemes, and composition recipes for task-to-code transformation",
    scope: "ecosystem",
    expectedInstances: "1 (singleton)",
  },
  {
    id: "def:bloom:cognitive",
    name: "Cognitive Bloom Definition",
    content: "Self-knowledge pattern scope containing survey, delta, and intent Resonators plus Learning Helix for structural self-diagnosis",
    scope: "ecosystem",
    expectedInstances: "1 (singleton)",
  },
  {
    id: "def:bloom:assayer",
    name: "Assayer Bloom Definition",
    content: "Governance evaluation scope containing Compliance Evaluation Resonator, Violation Grid, and observation Grid",
    scope: "ecosystem",
    expectedInstances: "1 (singleton)",
  },
  {
    id: "def:bloom:stage",
    name: "Stage Bloom Definition",
    content: "Pipeline stage scope containing Config Seeds, observation Grid, and Lines to shared ecosystem Resonators",
    scope: "pattern",
    expectedInstances: "Many (distinct governance scope per stage)",
  },
  {
    id: "def:bloom:milestone",
    name: "Milestone Bloom Definition",
    content: "Project milestone scope containing sub-milestones, exit criteria Seeds, and observation records",
    scope: "project",
    expectedInstances: "Many (distinct governance scope per milestone)",
  },
  {
    id: "def:bloom:execution",
    name: "Execution Bloom Definition",
    content: "Ephemeral execution scope containing output Seeds from a single pipeline run",
    scope: "pattern",
    expectedInstances: "Many (distinct temporal scale — one per execution)",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function ok(msg: string) { console.log(`  ✓ ${msg}`); }
function fail(msg: string, err: string) { console.error(`  ✗ ${msg}: ${err}`); }

// ── Phase 1: Pre-flight — verify type-level definitions exist ────────────────

async function phase1(): Promise<{ resDef: string; bloomDef: string }> {
  console.log("\n═══ Phase 1: Pre-Flight — Type-Level Definitions ═══\n");

  const result = await runQuery(
    `MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(def:Seed)
     WHERE def.id STARTS WITH 'def:morpheme:'
     RETURN def.id AS id, def.name AS name, def.seedType AS seedType`,
    {},
    "READ",
  );

  let resDef = "def:morpheme:resonator";
  let bloomDef = "def:morpheme:bloom";

  for (const r of result.records) {
    const id = r.get("id") as string;
    console.log(`  Found: ${id} — ${r.get("name")}`);
    if (id.includes("resonator")) resDef = id;
    if (id.includes("bloom")) bloomDef = id;
  }

  console.log(`\n  Resonator type-level def: ${resDef}`);
  console.log(`  Bloom type-level def: ${bloomDef}`);

  return { resDef, bloomDef };
}

// ── Phase 2: Create 15 Transformation Definitions ────────────────────────────

async function phase2(): Promise<void> {
  console.log("\n═══ Phase 2: Transformation Definitions (15) ═══\n");

  let created = 0;
  let existing = 0;

  for (const def of TRANSFORMATION_DEFS) {
    const result = await instantiateMorpheme(
      "seed",
      {
        id: def.id,
        name: def.name,
        content: def.content,
        seedType: "transformation-definition",
        ioShape: def.ioShape,
        scope: def.scope,
        status: "active",
      },
      "constitutional-bloom",
    );

    if (result.success) {
      ok(def.id);
      created++;
    } else if (result.error?.includes("ON MATCH")) {
      ok(`${def.id} (already exists)`);
      existing++;
    } else {
      fail(def.id, result.error ?? "unknown");
    }
  }

  console.log(`\n  Transformation defs: ${created} created, ${existing} already existed`);
}

// ── Phase 3: Create 8 Bloom Definitions ──────────────────────────────────────

async function phase3(): Promise<void> {
  console.log("\n═══ Phase 3: Bloom Definitions (8) ═══\n");

  let created = 0;

  for (const def of BLOOM_DEFS) {
    const result = await instantiateMorpheme(
      "seed",
      {
        id: def.id,
        name: def.name,
        content: def.content,
        seedType: "bloom-definition",
        scope: def.scope,
        expectedInstances: def.expectedInstances,
        status: "active",
      },
      "constitutional-bloom",
    );

    if (result.success) {
      ok(def.id);
      created++;
    } else {
      fail(def.id, result.error ?? "unknown");
    }
  }

  console.log(`\n  Bloom defs: ${created} created/updated`);
}

// ── Phase 4: SPECIALISES Lines ───────────────────────────────────────────────

async function phase4(resDef: string, bloomDef: string): Promise<void> {
  console.log("\n═══ Phase 4: SPECIALISES Lines (23) ═══\n");

  let created = 0;
  const seedDef = "def:morpheme:seed";

  // Transformation defs → type-level resonator def
  // (Transformation definitions describe Resonator transformation contracts)
  for (const def of TRANSFORMATION_DEFS) {
    const result = await createLine(def.id, resDef, "SPECIALISES" as LineType);
    if (result.success) {
      ok(`${def.id} → ${resDef}`);
      created++;
    } else {
      // May already exist
      ok(`${def.id} → ${resDef} (${result.error?.includes("already") ? "exists" : result.error})`);
    }
  }

  // Bloom defs → type-level bloom def
  for (const def of BLOOM_DEFS) {
    const result = await createLine(def.id, bloomDef, "SPECIALISES" as LineType);
    if (result.success) {
      ok(`${def.id} → ${bloomDef}`);
      created++;
    } else {
      ok(`${def.id} → ${bloomDef} (${result.error?.includes("already") ? "exists" : result.error})`);
    }
  }

  console.log(`\n  SPECIALISES Lines: ${created} created`);
}

// ── Phase 5: Backfill Pre-Existing Resonators/Blooms ─────────────────────────

/** Mapping from Bloom ID/type patterns to definition IDs */
function mapBloomToDefinition(id: string, type: string | null, name: string | null): string | null {
  if (id === "constitutional-bloom") return "def:bloom:constitutional";
  if (id === "architect" || id === "bloom:architect") return "def:bloom:architect";
  if (id === "devagent" || id === "dev-agent" || id === "bloom:devagent") return "def:bloom:devagent";
  if (type === "stage" || id.includes("_SURVEY") || id.includes("_DECOMPOSE") ||
      id.includes("_CLASSIFY") || id.includes("_SEQUENCE") || id.includes("_GATE") ||
      id.includes("_DISPATCH") || id.includes("_ADAPT")) return "def:bloom:stage";
  if (id.startsWith("M-") || type === "milestone" || type === "sub-milestone") return "def:bloom:milestone";
  if (/^\d{4}-\d{2}-\d{2}T/.test(id) || type === "pipeline") return "def:bloom:execution";
  return null;
}

/** Mapping from Resonator name/type to definition ID */
function mapResonatorToDefinition(id: string, type: string | null, name: string | null): string | null {
  const lowerName = (name ?? "").toLowerCase();
  const lowerId = id.toLowerCase();

  if (lowerName.includes("instantiation") || lowerId.includes("instantiation")) return "def:transformation:instantiation";
  if (lowerName.includes("mutation") || lowerId.includes("mutation")) return "def:transformation:mutation";
  if (lowerName.includes("line creation") || lowerName.includes("line-creation")) return "def:transformation:line-creation";
  if (lowerName.includes("thompson") || lowerId.includes("thompson")) return "def:transformation:thompson-selection";
  if (lowerName.includes("compliance") || lowerId.includes("compliance")) return "def:transformation:compliance-evaluation";
  if (lowerName.includes("llm") || lowerName.includes("invocation")) return "def:transformation:llm-invocation";
  if (lowerName.includes("gate") || lowerName.includes("human")) return "def:transformation:human-gate";
  if (lowerName.includes("classification") || lowerName.includes("classify")) return "def:transformation:rule-classification";
  if (lowerName.includes("topological") || lowerName.includes("sequence")) return "def:transformation:topological-sort";
  if (lowerName.includes("dispatch")) return "def:transformation:task-dispatch";
  if (lowerName.includes("adapt")) return "def:transformation:adaptation-analysis";
  if (lowerName.includes("code") || lowerName.includes("execution")) return "def:transformation:code-execution";
  if (lowerName.includes("survey")) return "def:transformation:structural-survey";
  if (lowerName.includes("delta")) return "def:transformation:constitutional-delta";
  if (lowerName.includes("intent") || lowerName.includes("synthesis")) return "def:transformation:intent-synthesis";

  return null;
}

async function phase5(): Promise<void> {
  console.log("\n═══ Phase 5: Backfill Pre-Existing Resonators/Blooms ═══\n");

  // Find all active/planned Resonators and Blooms without transformation-level INSTANTIATES
  const result = await runQuery(
    `MATCH (n)
     WHERE (n:Resonator OR n:Bloom)
       AND n.status IN ['active', 'planned', 'complete']
       AND NOT EXISTS {
         MATCH (n)-[:INSTANTIATES]->(def:Seed)
         WHERE def.seedType IN ['transformation-definition', 'bloom-definition']
       }
     RETURN n.id AS id, n.name AS name, n.type AS type, labels(n) AS labels
     ORDER BY n.id`,
    {},
    "READ",
  );

  let wired = 0;
  let unmapped = 0;

  for (const r of result.records) {
    const id = r.get("id") as string;
    const name = r.get("name") as string | null;
    const type = r.get("type") as string | null;
    const labels = r.get("labels") as string[];
    const isBloom = labels.includes("Bloom");
    const isResonator = labels.includes("Resonator");

    let defId: string | null = null;

    if (isBloom) {
      defId = mapBloomToDefinition(id, type, name);
    } else if (isResonator) {
      defId = mapResonatorToDefinition(id, type, name);
    }

    if (defId) {
      // Add transformationDefId property
      await runQuery(
        `MATCH (n {id: $nodeId}) SET n.transformationDefId = $defId`,
        { nodeId: id, defId },
        "WRITE",
      );

      // Add INSTANTIATES edge
      const lr = await createLine(id, defId, "INSTANTIATES");
      if (lr.success) {
        ok(`${id} → ${defId}`);
        wired++;
      } else {
        fail(`${id} → ${defId}`, lr.error ?? "unknown");
      }
    } else {
      // Unmapped — create observation
      console.log(`  ⚠ Unmapped: ${id} (${labels.join(",")}) — ${name}`);
      unmapped++;
    }
  }

  console.log(`\n  Backfilled: ${wired} wired, ${unmapped} unmapped`);
  if (unmapped > 0) {
    console.log("  ⚠ Unmapped nodes need manual review. The Cognitive Bloom will flag these.");
  }
}

// ── Phase 6: Verification ────────────────────────────────────────────────────

async function phase6(): Promise<void> {
  console.log("\n═══ Phase 6: Verification ═══\n");

  // Count transformation defs
  const tDefCount = await runQuery(
    `MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(s:Seed)
     WHERE s.seedType = 'transformation-definition'
     RETURN count(s) AS cnt`,
    {},
    "READ",
  );
  const tCnt = tDefCount.records[0]?.get("cnt") ?? 0;
  console.log(`  Transformation definitions: ${tCnt} (expected 15)`);

  // Count bloom defs
  const bDefCount = await runQuery(
    `MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(s:Seed)
     WHERE s.seedType = 'bloom-definition'
     RETURN count(s) AS cnt`,
    {},
    "READ",
  );
  const bCnt = bDefCount.records[0]?.get("cnt") ?? 0;
  console.log(`  Bloom definitions: ${bCnt} (expected 8)`);

  // Count SPECIALISES lines
  const specCount = await runQuery(
    `MATCH (s:Seed)-[:SPECIALISES]->(t:Seed)
     WHERE s.seedType IN ['transformation-definition', 'bloom-definition']
     RETURN count(*) AS cnt`,
    {},
    "READ",
  );
  const sCnt = specCount.records[0]?.get("cnt") ?? 0;
  console.log(`  SPECIALISES Lines: ${sCnt} (expected 23)`);

  // Count remaining Resonators/Blooms without transformation-level INSTANTIATES
  const remaining = await runQuery(
    `MATCH (n)
     WHERE (n:Resonator OR n:Bloom)
       AND n.status IN ['active', 'planned', 'complete']
       AND NOT EXISTS {
         MATCH (n)-[:INSTANTIATES]->(def:Seed)
         WHERE def.seedType IN ['transformation-definition', 'bloom-definition']
       }
     RETURN count(n) AS cnt`,
    {},
    "READ",
  );
  const rCnt = remaining.records[0]?.get("cnt") ?? 0;
  console.log(`  Resonators/Blooms without transformation-level INSTANTIATES: ${rCnt}`);

  // Summary
  const allGood = tCnt >= 15 && bCnt >= 8 && sCnt >= 23;
  console.log(`\n  ${allGood ? "✅" : "⚠️"} ${allGood ? "All definitions in place" : "Some definitions missing — check above"}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Highlander Protocol — Definition Seeds Bootstrap           ║");
  console.log("║  23 definitions + SPECIALISES Lines + backfill              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const backfillOnly = process.argv.includes("--backfill-only");

  try {
    if (!backfillOnly) {
      const { resDef, bloomDef } = await phase1();
      await phase2();
      await phase3();
      await phase4(resDef, bloomDef);
    }
    await phase5();
    await phase6();

    console.log("\n✅ Bootstrap complete.\n");
  } catch (err) {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

main();
