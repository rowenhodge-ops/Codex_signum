/**
 * M-16.3 — Morpheme Retyping (Multi-Label) Migration
 *
 * Adds morpheme labels to all specialised nodes (Option B — additive).
 * Wires INSTANTIATES from every node to the Constitutional Bloom definitions.
 * Backfills content on nodes that lack it.
 *
 * IMPORTANT: Content must be backfilled BEFORE adding morpheme labels,
 * because Neo4j has a NOT NULL constraint on Seed.content (and potentially others).
 *
 * [NO-PIPELINE] — mechanical migration, idempotent (MERGE everywhere), safe to re-run.
 *
 * Usage: npx tsx scripts/migrate-morpheme-labels.ts
 */

import { runQuery, closeDriver } from "../src/graph/client.js";
import path from "path";
import fs from "fs";

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

// ─── Migration helpers ──────────────────────────────────────────────

async function runMigrationStep(
  description: string,
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<number> {
  console.log(`  ${description}...`);
  const result = await runQuery(cypher, params, "WRITE");
  const count = result.records[0]?.get("migrated") ?? 0;
  console.log(`    → ${count} nodes migrated`);
  return count;
}

// ─── Phase 1: Content backfill (BEFORE adding labels) ───────────────
// Neo4j has NOT NULL constraints on Seed.content, Bloom.content, etc.
// Content must exist before we can add the morpheme label.

async function phase1_contentBackfill() {
  console.log("\n═══ Phase 1: Content backfill (pre-label) ═══\n");

  await runMigrationStep(
    "Decisions: derive content from routing properties",
    `MATCH (n:Decision)
     WHERE n.content IS NULL
     SET n.content = 'Decision: ' + COALESCE(n.taskType, 'unknown') + ' routed to ' + COALESCE(n.selectedSeedId, 'unknown') + ' [' + COALESCE(n.complexity, 'unknown') + ']'
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "Observations: derive content from metric + value",
    `MATCH (n:Observation)
     WHERE n.content IS NULL
     SET n.content = 'Observation: ' + COALESCE(n.metric, 'unknown') + ' = ' + COALESCE(toString(n.value), '?')
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "PipelineRuns: derive from intent",
    `MATCH (n:PipelineRun)
     WHERE n.content IS NULL
     SET n.content = 'Pipeline execution: ' + COALESCE(n.intent, 'unknown intent')
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "TaskOutputs: derive from title + model",
    `MATCH (n:TaskOutput)
     WHERE n.content IS NULL
     SET n.content = 'Task output: ' + COALESCE(n.title, 'untitled') + ' via ' + COALESCE(n.modelUsed, 'unknown model')
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "ThresholdEvents: derive from type/metric",
    `MATCH (n:ThresholdEvent)
     WHERE n.content IS NULL
     SET n.content = 'Threshold event: ' + COALESCE(n.eventType, COALESCE(n.metric, 'unknown'))
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "HumanFeedback: derive from runId",
    `MATCH (n:HumanFeedback)
     WHERE n.content IS NULL
     SET n.content = 'Human feedback for run ' + COALESCE(n.runId, 'unknown')
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "ConstitutionalRules: derive from name + rationale",
    `MATCH (n:ConstitutionalRule)
     WHERE n.content IS NULL
     SET n.content = COALESCE(n.name, 'Unknown rule') + ': ' + COALESCE(n.rationale, '')
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "ContextClusters: derive from taskType + complexity",
    `MATCH (n:ContextCluster)
     WHERE n.content IS NULL
     SET n.content = 'Thompson context cluster: ' + COALESCE(n.taskType, 'unknown') + ' [' + COALESCE(n.complexity, 'any') + ']'
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "Agent nodes: derive from name + provider",
    `MATCH (n:Agent)
     WHERE n.content IS NULL
     SET n.content = 'LLM model: ' + COALESCE(n.name, n.id) + ' (' + COALESCE(n.provider, 'unknown') + ')'
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "Execution nodes: derive from taskType + prompt",
    `MATCH (n:Execution)
     WHERE n.content IS NULL
     SET n.content = 'DevAgent execution: ' + COALESCE(n.taskType, 'unknown') + ' — ' + COALESCE(substring(n.prompt, 0, 100), 'no prompt')
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "Stage nodes: derive from name + model",
    `MATCH (n:Stage)
     WHERE n.content IS NULL
     SET n.content = 'Pipeline stage: ' + COALESCE(n.name, 'unknown') + ' via ' + COALESCE(n.model, 'unknown model')
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "Pattern nodes: derive from id + description",
    `MATCH (n:Pattern)
     WHERE n.content IS NULL
     SET n.content = 'Pattern: ' + COALESCE(n.name, n.id) + COALESCE(' — ' + n.description, '')
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "Model nodes: derive from id + provider",
    `MATCH (n:Model)
     WHERE n.content IS NULL
     SET n.content = 'Model reference: ' + COALESCE(n.id, 'unknown') + ' (' + COALESCE(n.provider, 'unknown') + ')'
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "TaskType nodes: derive from name",
    `MATCH (n:TaskType)
     WHERE n.content IS NULL
     SET n.content = 'Task type classification: ' + COALESCE(n.name, 'unknown')
     RETURN count(n) AS migrated`,
  );

  // Backfill ALL required Seed properties: content (done above), seedType, status, name
  // Neo4j constraints: seed_content_required, seed_seedtype_required, seed_status_required
  console.log("\n  Backfilling Seed-required properties (seedType, status, name)...\n");

  // Nodes heading to :Seed — need seedType, status, name
  const seedTargets = [
    { label: "Decision", seedType: "decision", defaultStatus: "completed", nameExpr: "'Decision ' + COALESCE(n.id, 'unknown')" },
    { label: "Observation", seedType: "observation", defaultStatus: "recorded", nameExpr: "'Observation ' + COALESCE(n.id, 'unknown')" },
    { label: "TaskOutput", seedType: "task-output", defaultStatus: "succeeded", nameExpr: "COALESCE(n.title, 'TaskOutput ' + COALESCE(n.id, 'unknown'))" },
    { label: "HumanFeedback", seedType: "human-feedback", defaultStatus: "recorded", nameExpr: "'HumanFeedback ' + COALESCE(n.id, 'unknown')" },
    { label: "ThresholdEvent", seedType: "threshold-event", defaultStatus: "recorded", nameExpr: "'ThresholdEvent ' + COALESCE(n.id, 'unknown')" },
    { label: "ConstitutionalRule", seedType: "constitutional-rule", defaultStatus: "active", nameExpr: "COALESCE(n.name, 'Rule ' + COALESCE(n.id, 'unknown'))" },
    { label: "TaskType", seedType: "classification", defaultStatus: "active", nameExpr: "COALESCE(n.name, 'TaskType ' + COALESCE(n.id, 'unknown'))" },
  ];

  for (const { label, seedType, defaultStatus, nameExpr } of seedTargets) {
    await runMigrationStep(
      `${label}: ensure seedType + status + name`,
      `MATCH (n:${label})
       SET n.seedType = COALESCE(n.seedType, '${seedType}'),
           n.status = COALESCE(n.status, '${defaultStatus}'),
           n.name = COALESCE(n.name, ${nameExpr})
       RETURN count(n) AS migrated`,
    );
  }

  // Backfill Bloom-required properties: type, status, name, content (content done above)
  // Neo4j constraints: bloom_status_required, bloom_type_required
  console.log("\n  Backfilling Bloom-required properties (type, status, name)...\n");

  const bloomTargets = [
    { label: "PipelineRun", type: "execution", defaultStatus: "completed", nameExpr: "'PipelineRun ' + COALESCE(n.id, 'unknown')" },
    { label: "Execution", type: "execution", defaultStatus: "completed", nameExpr: "'Execution ' + COALESCE(n.id, 'unknown')" },
    { label: "Pattern", type: "pattern", defaultStatus: "active", nameExpr: "COALESCE(n.name, 'Pattern ' + COALESCE(n.id, 'unknown'))" },
  ];

  for (const { label, type, defaultStatus, nameExpr } of bloomTargets) {
    await runMigrationStep(
      `${label}: ensure type + status + name`,
      `MATCH (n:${label})
       SET n.type = COALESCE(n.type, '${type}'),
           n.status = COALESCE(n.status, '${defaultStatus}'),
           n.name = COALESCE(n.name, ${nameExpr})
       RETURN count(n) AS migrated`,
    );
  }

  // Backfill Resonator-bound: Agent, Stage, Model — need content (done), type, status, name
  console.log("\n  Backfilling Resonator-required properties...\n");

  const resonatorTargets = [
    { label: "Agent", type: "model", defaultStatus: "active", nameExpr: "COALESCE(n.name, n.id)" },
    { label: "Stage", type: "stage", defaultStatus: "completed", nameExpr: "COALESCE(n.name, 'Stage ' + COALESCE(n.id, 'unknown'))" },
    { label: "Model", type: "model", defaultStatus: "active", nameExpr: "COALESCE(n.name, COALESCE(n.id, 'unknown'))" },
  ];

  for (const { label, type, defaultStatus, nameExpr } of resonatorTargets) {
    await runMigrationStep(
      `${label}: ensure type + status + name`,
      `MATCH (n:${label})
       SET n.type = COALESCE(n.type, '${type}'),
           n.status = COALESCE(n.status, '${defaultStatus}'),
           n.name = COALESCE(n.name, ${nameExpr})
       RETURN count(n) AS migrated`,
    );
  }

  // Grid-bound: ContextCluster — need name, type, status
  console.log("\n  Backfilling Grid-required properties...\n");

  await runMigrationStep(
    "ContextCluster: ensure type + status + name",
    `MATCH (n:ContextCluster)
     SET n.type = COALESCE(n.type, 'thompson-context'),
         n.status = COALESCE(n.status, 'active'),
         n.name = COALESCE(n.name, 'ContextCluster ' + COALESCE(n.id, COALESCE(n.taskType, 'unknown')))
     RETURN count(n) AS migrated`,
  );
}

// ─── Phase 2: Add morpheme labels ───────────────────────────────────

async function phase2_addMorphemeLabels() {
  console.log("\n═══ Phase 2: Add morpheme labels ═══\n");

  // --- Seed retypings ---

  await runMigrationStep(
    "Decision → Seed:Decision",
    `MATCH (n:Decision)
     WHERE NOT n:Seed
     SET n:Seed, n.seedType = COALESCE(n.seedType, 'decision')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:seed'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "Observation → Seed:Observation",
    `MATCH (n:Observation)
     WHERE NOT n:Seed
     SET n:Seed, n.seedType = COALESCE(n.seedType, 'observation')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:seed'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "TaskOutput → Seed:TaskOutput",
    `MATCH (n:TaskOutput)
     WHERE NOT n:Seed
     SET n:Seed, n.seedType = COALESCE(n.seedType, 'task-output')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:seed'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "HumanFeedback → Seed:HumanFeedback",
    `MATCH (n:HumanFeedback)
     WHERE NOT n:Seed
     SET n:Seed, n.seedType = COALESCE(n.seedType, 'human-feedback')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:seed'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "ThresholdEvent → Seed:ThresholdEvent",
    `MATCH (n:ThresholdEvent)
     WHERE NOT n:Seed
     SET n:Seed, n.seedType = COALESCE(n.seedType, 'threshold-event')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:seed'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "ConstitutionalRule → Seed:ConstitutionalRule",
    `MATCH (n:ConstitutionalRule)
     WHERE NOT n:Seed
     SET n:Seed, n.seedType = COALESCE(n.seedType, 'constitutional-rule')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:seed'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "TaskType → Seed:TaskType",
    `MATCH (n:TaskType)
     WHERE NOT n:Seed
     SET n:Seed, n.seedType = COALESCE(n.seedType, 'classification')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:seed'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  // --- Bloom retypings ---

  await runMigrationStep(
    "PipelineRun → Bloom:PipelineRun",
    `MATCH (n:PipelineRun)
     WHERE NOT n:Bloom
     SET n:Bloom, n.type = COALESCE(n.type, 'execution')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:bloom'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "Execution → Bloom:Execution",
    `MATCH (n:Execution)
     WHERE NOT n:Bloom
     SET n:Bloom, n.type = COALESCE(n.type, 'execution')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:bloom'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  // Pattern → Bloom:Pattern — but some Pattern nodes are legacy duplicates
  // of existing Bloom nodes (same id). Skip those to avoid uniqueness violations.
  await runMigrationStep(
    "Pattern → Bloom:Pattern (skip id-conflicting duplicates)",
    `MATCH (n:Pattern)
     WHERE NOT n:Bloom
     AND NOT EXISTS { MATCH (b:Bloom {id: n.id}) }
     SET n:Bloom, n.type = COALESCE(n.type, 'pattern')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:bloom'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  // Pattern nodes that conflict with existing Blooms (same id, different node):
  // These are legacy duplicates. The canonical nodes are the Blooms.
  // Skip them — they can't receive :Bloom (id conflict) and the Blooms can't
  // receive :Pattern (Pattern uniqueness constraint). Noted for cleanup.
  console.log("  NOTE: 4 legacy Pattern nodes conflict with existing Blooms (thompson-router, dev-agent, architect, model-sentinel).");
  console.log("        Skipped — canonical Bloom nodes already exist. Consider cleaning up legacy Pattern nodes.");

  // --- Resonator retypings ---

  await runMigrationStep(
    "Agent → Resonator:Agent (LLM models are transformers per MIM)",
    `MATCH (n:Agent)
     WHERE NOT n:Resonator
     SET n:Resonator, n.type = COALESCE(n.type, 'model')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:resonator'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "Stage → Resonator:Stage (pipeline stages transform per MIM)",
    `MATCH (n:Stage)
     WHERE NOT n:Resonator
     SET n:Resonator, n.type = COALESCE(n.type, 'stage')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:resonator'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  await runMigrationStep(
    "Model → Resonator:Model",
    `MATCH (n:Model)
     WHERE NOT n:Resonator
     SET n:Resonator, n.type = COALESCE(n.type, 'model')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:resonator'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );

  // --- Grid retypings ---

  await runMigrationStep(
    "ContextCluster → Grid:ContextCluster",
    `MATCH (n:ContextCluster)
     WHERE NOT n:Grid
     SET n:Grid, n.type = COALESCE(n.type, 'thompson-context')
     WITH n
     MATCH (def:Seed {id: 'def:morpheme:grid'})
     MERGE (n)-[:INSTANTIATES]->(def)
     RETURN count(n) AS migrated`,
  );
}

// ─── Phase 3: Wire INSTANTIATES for existing morpheme nodes ─────────

async function phase3_wireExistingMorphemes() {
  console.log("\n═══ Phase 3: Wire INSTANTIATES for existing morpheme-labelled nodes ═══\n");

  await runMigrationStep(
    "Existing Seeds lacking INSTANTIATES",
    `MATCH (s:Seed)
     WHERE NOT (s)-[:INSTANTIATES]->()
     WITH s
     MATCH (def:Seed {id: 'def:morpheme:seed'})
     MERGE (s)-[:INSTANTIATES]->(def)
     RETURN count(s) AS migrated`,
  );

  await runMigrationStep(
    "Existing Blooms lacking INSTANTIATES (excluding constitutional-bloom)",
    `MATCH (b:Bloom)
     WHERE NOT (b)-[:INSTANTIATES]->()
     AND b.id <> 'constitutional-bloom'
     WITH b
     MATCH (def:Seed {id: 'def:morpheme:bloom'})
     MERGE (b)-[:INSTANTIATES]->(def)
     RETURN count(b) AS migrated`,
  );

  await runMigrationStep(
    "Existing Resonators lacking INSTANTIATES",
    `MATCH (r:Resonator)
     WHERE NOT (r)-[:INSTANTIATES]->()
     WITH r
     MATCH (def:Seed {id: 'def:morpheme:resonator'})
     MERGE (r)-[:INSTANTIATES]->(def)
     RETURN count(r) AS migrated`,
  );

  await runMigrationStep(
    "Existing Grids lacking INSTANTIATES",
    `MATCH (g:Grid)
     WHERE NOT (g)-[:INSTANTIATES]->()
     WITH g
     MATCH (def:Seed {id: 'def:morpheme:grid'})
     MERGE (g)-[:INSTANTIATES]->(def)
     RETURN count(g) AS migrated`,
  );

  await runMigrationStep(
    "Existing Helixes lacking INSTANTIATES",
    `MATCH (h:Helix)
     WHERE NOT (h)-[:INSTANTIATES]->()
     WITH h
     MATCH (def:Seed {id: 'def:morpheme:helix'})
     MERGE (h)-[:INSTANTIATES]->(def)
     RETURN count(h) AS migrated`,
  );
}

// ─── Verification ───────────────────────────────────────────────────

async function verify() {
  console.log("\n═══ Verification ═══\n");

  // 1. Every non-definition morpheme node should have INSTANTIATES
  console.log("  Checking: all morpheme nodes have INSTANTIATES...");
  const r1 = await runQuery(
    `MATCH (n)
     WHERE (n:Seed OR n:Bloom OR n:Resonator OR n:Grid OR n:Helix)
     AND NOT (n)-[:INSTANTIATES]->()
     AND n.id <> 'constitutional-bloom'
     AND NOT n.seedType = 'definition'
     RETURN n.id AS id, labels(n) AS labels, n.name AS name
     ORDER BY n.id`,
    {},
    "READ",
  );
  if (r1.records.length === 0) {
    console.log("    ✓ All morpheme nodes have INSTANTIATES");
  } else {
    console.log(`    ✗ ${r1.records.length} nodes lack INSTANTIATES:`);
    for (const rec of r1.records.slice(0, 10)) {
      console.log(`      ${rec.get("id")} ${JSON.stringify(rec.get("labels"))}`);
    }
    if (r1.records.length > 10) {
      console.log(`      ... and ${r1.records.length - 10} more`);
    }
  }

  // 2. Multi-labelled node counts
  console.log("\n  Multi-labelled node counts:");
  const dualLabelQueries = [
    ["Seed:Decision", "MATCH (n:Seed:Decision) RETURN count(n) AS count"],
    ["Seed:Observation", "MATCH (n:Seed:Observation) RETURN count(n) AS count"],
    ["Bloom:PipelineRun", "MATCH (n:Bloom:PipelineRun) RETURN count(n) AS count"],
    ["Seed:TaskOutput", "MATCH (n:Seed:TaskOutput) RETURN count(n) AS count"],
    ["Grid:ContextCluster", "MATCH (n:Grid:ContextCluster) RETURN count(n) AS count"],
    ["Seed:ConstitutionalRule", "MATCH (n:Seed:ConstitutionalRule) RETURN count(n) AS count"],
    ["Seed:ThresholdEvent", "MATCH (n:Seed:ThresholdEvent) RETURN count(n) AS count"],
    ["Seed:HumanFeedback", "MATCH (n:Seed:HumanFeedback) RETURN count(n) AS count"],
    ["Resonator:Agent", "MATCH (n:Resonator:Agent) RETURN count(n) AS count"],
    ["Bloom:Execution", "MATCH (n:Bloom:Execution) RETURN count(n) AS count"],
    ["Resonator:Stage", "MATCH (n:Resonator:Stage) RETURN count(n) AS count"],
    ["Bloom:Pattern", "MATCH (n:Bloom:Pattern) RETURN count(n) AS count"],
    ["Resonator:Model", "MATCH (n:Resonator:Model) RETURN count(n) AS count"],
    ["Seed:TaskType", "MATCH (n:Seed:TaskType) RETURN count(n) AS count"],
  ];

  for (const [label, query] of dualLabelQueries) {
    const r = await runQuery(query, {}, "READ");
    const count = r.records[0]?.get("count") ?? 0;
    if (count > 0) {
      console.log(`    ${label}: ${count}`);
    }
  }

  // 3. No nodes without content
  console.log("\n  Checking: no morpheme nodes without content...");
  const r3 = await runQuery(
    `MATCH (n)
     WHERE (n:Seed OR n:Bloom OR n:Resonator OR n:Grid OR n:Helix)
     AND (n.content IS NULL OR n.content = '')
     RETURN n.id AS id, labels(n) AS labels, n.name AS name
     LIMIT 20`,
    {},
    "READ",
  );
  if (r3.records.length === 0) {
    console.log("    ✓ All morpheme nodes have content");
  } else {
    console.log(`    ✗ ${r3.records.length} nodes lack content:`);
    for (const rec of r3.records) {
      console.log(`      ${rec.get("id")} ${JSON.stringify(rec.get("labels"))} name=${rec.get("name")}`);
    }
  }

  // 4. Final label distribution
  console.log("\n  Final label distribution:");
  const r4 = await runQuery(
    `MATCH (n) UNWIND labels(n) AS label RETURN label, count(*) AS count ORDER BY count DESC`,
    {},
    "READ",
  );
  for (const rec of r4.records) {
    console.log(`    ${rec.get("label")}: ${rec.get("count")}`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  M-16.3 Morpheme Retyping Migration (Option B)   ║");
  console.log("║  Additive multi-labelling — no labels removed     ║");
  console.log("╚═══════════════════════════════════════════════════╝");

  await phase1_contentBackfill();
  await phase2_addMorphemeLabels();
  await phase3_wireExistingMorphemes();
  await verify();

  await closeDriver();
  console.log("\n✓ Migration complete.");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
