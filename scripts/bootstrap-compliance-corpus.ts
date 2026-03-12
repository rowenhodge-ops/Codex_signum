#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * M-16.3.3 Compliance Corpus Bootstrap — Populate Grid with Canonical Spec Data
 *
 * Populates the compliance corpus Grid (grid:compliance-corpus, created in M-9.7b)
 * with canonical spec data the Assayer can query at runtime:
 *
 * 1. CONTAINS relationships from corpus Grid to existing grammar Seeds (axioms, rules, anti-patterns)
 * 2. Eliminated entity Seeds (historical entities removed from the codebase)
 * 3. Bridge View Principle compliance rule Seed
 * 4. Detection heuristic enrichment on anti-pattern Seeds
 * 5. Corpus Grid status updated from placeholder to populated
 *
 * Idempotent: uses MERGE, not CREATE. Safe to run multiple times.
 *
 * Usage: npx tsx scripts/bootstrap-compliance-corpus.ts
 */

import { pathToFileURL } from "node:url";
import {
  closeDriver,
  writeTransaction,
  migrateSchema,
} from "../src/graph/index.js";
import { RELATIONSHIP_TYPES } from "../src/graph/schema.js";
import { getCategories, getAntiPatternViolations } from "./bootstrap-grammar-reference.js";

// ── Data ────────────────────────────────────────────────────────────────────

const CORPUS_GRID_ID = "grid:compliance-corpus";

interface EliminatedEntity {
  id: string;
  name: string;
  deletedIn: string;
  reason: string;
}

const ELIMINATED_ENTITIES: EliminatedEntity[] = [
  { id: "eliminated:observer", name: "Observer", deletedIn: "ce0ef96", reason: "Shadow system anti-pattern — created monitoring overlay between execution and graph" },
  { id: "eliminated:model-sentinel", name: "Model Sentinel", deletedIn: "M-8C", reason: "Monitoring overlay — separate entity tracking model health outside graph" },
  { id: "eliminated:signal-pipeline-entity", name: "Signal Pipeline (as entity)", deletedIn: "M-8A", reason: "Not a separate entity — signal conditioning is inline computation during writes" },
  { id: "eliminated:health-computation-entity", name: "Health Computation (as entity)", deletedIn: "M-8A", reason: "Not a separate entity — health is computed inline on graph writes, not routed through intermediary" },
  { id: "eliminated:symbiosis-axiom", name: "Symbiosis (Axiom)", deletedIn: "v4.0", reason: "Absorbed into A2 Visible State + A9 Comprehension Primacy at v4.0 spec revision" },
  { id: "eliminated:correction-helix", name: "Correction (Helix mode)", deletedIn: "v5.0", reason: "Renamed to Refinement — correction implies fault-fixing, refinement captures iterative improvement" },
  { id: "eliminated:a5-reversibility", name: "A5 Reversibility (Axiom)", deletedIn: "v5.0", reason: "Derived from A4 Provenance + memory topology, not independent — removed to reduce axiom set to 8" },
];

interface DetectionHeuristic {
  antiPatternId: string;
  detectionHeuristic: string;
}

const DETECTION_HEURISTICS: DetectionHeuristic[] = [
  { antiPatternId: "ap:shadow-system", detectionHeuristic: "Look for: new files storing state (JSON, SQLite, .log as state), imports of external state stores not going through graph client, variables named 'cache', 'store', 'db' outside graph/" },
  { antiPatternId: "ap:dimensional-collapse", detectionHeuristic: "Look for: ΦL passed as bare number, health/score as single scalar, boolean healthy/unhealthy flags replacing composite dimensions" },
  { antiPatternId: "ap:infrastructure-first", detectionHeuristic: "Look for: new directories/files for features not yet needed by grammar, config files for unused integrations, abstractions with single implementation" },
  { antiPatternId: "ap:model-centric", detectionHeuristic: "Look for: provider SDK imports in src/ (not scripts/), model-specific logic in substrate-agnostic code, hardcoded model names in core types" },
  { antiPatternId: "ap:monitoring-overlay", detectionHeuristic: "Look for: classes named Observer/Monitor/Collector/Evaluator/Auditor, separate read-transform-present pipelines, dashboard/stats aggregation functions" },
  { antiPatternId: "ap:prescribed-behaviour", detectionHeuristic: "Look for: pattern A directly calling pattern B's methods, cross-pattern imperative control flow, conditional logic based on other pattern's internal state" },
  { antiPatternId: "ap:bridge-drift", detectionHeuristic: "Look for: hardcoded constants that should come from Bridge parameters, formula implementations diverging from §Part 2-10, parameter values not matching the 16-parameter table" },
  { antiPatternId: "ap:manual-analysis-bypass", detectionHeuristic: "Look for: agent performing analytical work inline when Architect pipeline is operational, manual gap analysis instead of running reconcile.ts" },
  { antiPatternId: "ap:fixed-dampening", detectionHeuristic: "Look for: γ = 0.7 literal, dampening without topology awareness, missing min(0.7, 0.8/k) computation" },
  { antiPatternId: "ap:bare-number-health", detectionHeuristic: "Look for: health: number, phiL: number, functions accepting/returning bare number where PhiLOutput is required" },
  { antiPatternId: "ap:static-retention", detectionHeuristic: "Look for: fixed time windows for data retention, age > N deletion instead of exponential decay weighting, missing weight = e^(-λ × age)" },
  { antiPatternId: "ap:fixed-circuit-breaker", detectionHeuristic: "Look for: constant cooldown values, missing exponential backoff, missing jitter/randomization in retry timing" },
  { antiPatternId: "ap:intermediary-layer", detectionHeuristic: "Look for: wrapper functions that read from graph, transform, and re-present; adapter layers between graph queries and consumers; computed views that sit between graph and callers" },
  { antiPatternId: "ap:governance-theatre", detectionHeuristic: "Look for: constitutional rules with no enforcement path, compliance checks that log but don't block, rules documented in CLAUDE.md with no corresponding code or test" },
  { antiPatternId: "ap:defensive-filtering", detectionHeuristic: "Look for: signal suppression before threshold checks, filtering low-confidence observations before write, clamping values to avoid triggering alerts" },
  { antiPatternId: "ap:skilled-incompetence", detectionHeuristic: "Look for: technically passing tests that don't test the right thing, pipeline runs that complete but produce no learning, correct code that defeats the purpose of the pattern it implements" },
  { antiPatternId: "ap:undiscussable-accumulation", detectionHeuristic: "Look for: TODO/FIXME comments older than 2 milestones, known gaps in reconcile.ts output that persist across runs, test skip annotations without tracked resolution" },
  { antiPatternId: "ap:pathological-autopoiesis", detectionHeuristic: "Look for: system adding complexity to justify its own existence, pipeline stages that only serve the pipeline, metrics optimised for pipeline success rather than user value" },
];

const BRIDGE_VIEW_PRINCIPLE = {
  id: "rule:bridge-view-principle",
  seedType: "compliance-rule",
  name: "Bridge View Principle",
  description: "Every Engineering Bridge formula MUST be expressible as a pure function of grammar-defined morpheme states and axiom-defined parameters.",
  specSource: "M-8A t15 analysis, M-17.2",
  status: "canonical",
};

// ── Graph write helpers ─────────────────────────────────────────────────────

async function linkCorpusToSeeds(seedIds: string[]): Promise<number> {
  let linked = 0;
  for (const seedId of seedIds) {
    try {
      await writeTransaction(async (tx) => {
        await tx.run(
          `MATCH (g:Grid {id: $gridId})
           MATCH (s:Seed {id: $seedId})
           MERGE (g)-[:${RELATIONSHIP_TYPES.CONTAINS}]->(s)`,
          { gridId: CORPUS_GRID_ID, seedId },
        );
      });
      linked++;
    } catch (err) {
      console.warn(`  ⚠ Failed to link corpus → ${seedId}:`, err);
    }
  }
  return linked;
}

async function createEliminatedEntitySeed(entity: EliminatedEntity): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (s:Seed {id: $id})
       ON CREATE SET
         s.seedType = "eliminated-entity",
         s.name = $name,
         s.deletedIn = $deletedIn,
         s.reason = $reason,
         s.specSource = "CLAUDE.md §Anti-Patterns",
         s.implementationStatus = "complete",
         s.implementationNotes = "Entity removed from codebase; retained in corpus for Assayer detection",
         s.createdAt = datetime()
       ON MATCH SET
         s.name = $name,
         s.deletedIn = $deletedIn,
         s.reason = $reason,
         s.updatedAt = datetime()`,
      {
        id: entity.id,
        name: entity.name,
        deletedIn: entity.deletedIn,
        reason: entity.reason,
      },
    );
  });
}

async function createBridgeViewPrincipleSeed(): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (s:Seed {id: $id})
       ON CREATE SET
         s.seedType = $seedType,
         s.name = $name,
         s.description = $description,
         s.specSource = $specSource,
         s.status = $status,
         s.implementationStatus = "complete",
         s.implementationNotes = "Normative constraint; Assayer VALIDATE checks against this rule",
         s.createdAt = datetime()
       ON MATCH SET
         s.name = $name,
         s.description = $description,
         s.specSource = $specSource,
         s.status = $status,
         s.updatedAt = datetime()`,
      BRIDGE_VIEW_PRINCIPLE,
    );
  });
}

async function enrichAntiPatternDetection(heuristic: DetectionHeuristic): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (s:Seed {id: $id})
       SET s.detectionHeuristic = $heuristic,
           s.updatedAt = datetime()`,
      { id: heuristic.antiPatternId, heuristic: heuristic.detectionHeuristic },
    );
  });
}

async function updateCorpusGridStatus(): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (g:Grid {id: $id})
       SET g.status = "populated",
           g.specVersion = "v5.0",
           g.description = "Compliance corpus — canonical spec data for Assayer VALIDATE queries",
           g.populatedAt = datetime(),
           g.updatedAt = datetime()`,
      { id: CORPUS_GRID_ID },
    );
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("📖 M-16.3.3 Compliance Corpus Bootstrap — Populate Grid\n");

  // Ensure schema is up to date
  const schema = await migrateSchema();
  if (schema.errors.length > 0) {
    console.error("Schema errors:", schema.errors);
  }
  console.log(`Schema: ${schema.applied} statements applied\n`);

  // 1. Link existing grammar Seeds to the corpus Grid
  const categories = getCategories();
  const axiomIds = categories.find((c) => c.id === "cat:axioms")!.elements.map((e) => e.id);
  const ruleIds = categories.find((c) => c.id === "cat:grammar-rules")!.elements.map((e) => e.id);
  const apIds = categories.find((c) => c.id === "cat:anti-patterns")!.elements.map((e) => e.id);

  const axiomLinked = await linkCorpusToSeeds(axiomIds);
  console.log(`✅ Corpus CONTAINS: ${axiomLinked} axiom Seeds`);

  const ruleLinked = await linkCorpusToSeeds(ruleIds);
  console.log(`✅ Corpus CONTAINS: ${ruleLinked} grammar-rule Seeds`);

  const apLinked = await linkCorpusToSeeds(apIds);
  console.log(`✅ Corpus CONTAINS: ${apLinked} anti-pattern Seeds`);

  // 2. Create eliminated entity Seeds + link to corpus
  const eliminatedIds: string[] = [];
  for (const entity of ELIMINATED_ENTITIES) {
    try {
      await createEliminatedEntitySeed(entity);
      eliminatedIds.push(entity.id);
    } catch (err) {
      console.warn(`  ⚠ Failed to create eliminated entity ${entity.id}:`, err);
    }
  }
  const elimLinked = await linkCorpusToSeeds(eliminatedIds);
  console.log(`✅ Eliminated entities: ${eliminatedIds.length} created, ${elimLinked} linked to corpus`);

  // 3. Create Bridge View Principle compliance rule Seed + link to corpus
  try {
    await createBridgeViewPrincipleSeed();
    await linkCorpusToSeeds([BRIDGE_VIEW_PRINCIPLE.id]);
    console.log(`✅ Bridge View Principle: ${BRIDGE_VIEW_PRINCIPLE.id}`);
  } catch (err) {
    console.warn("  ⚠ Failed to create Bridge View Principle:", err);
  }

  // 4. Enrich anti-pattern Seeds with detection heuristics
  let enrichedCount = 0;
  for (const heuristic of DETECTION_HEURISTICS) {
    try {
      await enrichAntiPatternDetection(heuristic);
      enrichedCount++;
    } catch (err) {
      console.warn(`  ⚠ Failed to enrich ${heuristic.antiPatternId}:`, err);
    }
  }
  console.log(`✅ Detection heuristics: ${enrichedCount} anti-patterns enriched`);

  // 5. Update corpus Grid status
  try {
    await updateCorpusGridStatus();
    console.log(`✅ Corpus Grid status: populated, specVersion: v5.0`);
  } catch (err) {
    console.warn("  ⚠ Failed to update corpus Grid status:", err);
  }

  // Summary
  console.log("\n── Summary ──");
  console.log(`  Corpus Grid: ${CORPUS_GRID_ID}`);
  console.log(`  CONTAINS: ${axiomLinked} axioms + ${ruleLinked} grammar-rules + ${apLinked} anti-patterns + ${elimLinked} eliminated + 1 compliance-rule`);
  console.log(`  Eliminated entities: ${eliminatedIds.length}`);
  console.log(`  Detection heuristics: ${enrichedCount}`);
  console.log(`  Status: populated, specVersion: v5.0`);
  console.log(`\nVerify with:`);
  console.log(`  MATCH (g:Grid {id: "grid:compliance-corpus"}) RETURN g.status, g.specVersion`);
  console.log(`  MATCH (g:Grid {id: "grid:compliance-corpus"})-[:CONTAINS]->(s) RETURN labels(s), s.seedType, count(s) ORDER BY s.seedType`);
  console.log(`  MATCH (s:Seed {seedType: "eliminated-entity"}) RETURN s.id, s.name`);
}

const invokedPath = process.argv[1];
const isDirectRun = invokedPath
  ? import.meta.url === pathToFileURL(invokedPath).href
  : false;

if (isDirectRun) {
  main()
    .catch((err) => {
      console.error("Bootstrap failed:", err);
      process.exit(1);
    })
    .finally(() => closeDriver());
}

export {
  CORPUS_GRID_ID,
  ELIMINATED_ENTITIES,
  DETECTION_HEURISTICS,
  BRIDGE_VIEW_PRINCIPLE,
  linkCorpusToSeeds,
  createEliminatedEntitySeed,
  createBridgeViewPrincipleSeed,
  enrichAntiPatternDetection,
  updateCorpusGridStatus,
};
export type { EliminatedEntity, DetectionHeuristic };
