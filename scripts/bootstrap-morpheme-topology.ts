#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * M-9.7b Morpheme Topology Bootstrap — Runtime Structure in Graph
 *
 * Populates Neo4j with the system's runtime topology mapped to morphemes:
 * - Pattern Blooms (Architect, DevAgent, Thompson Router)
 * - Pipeline stage Blooms (7 Architect + 4 DevAgent + 7 Signal)
 * - Signal Pipeline Bloom (container for signal stages)
 * - FLOWS_TO relationships (data flow / Line morpheme)
 * - CONTAINS relationships (Bloom → Stage Bloom containment)
 * - Thompson learning Helix (temporal evolution)
 * - Compliance corpus Grid (placeholder)
 * - OBSERVES relationship (Helix → Router Bloom)
 * - INSTANTIATES relationships (runtime nodes → grammar reference Seeds)
 * - SCOPED_TO relationship (pattern Blooms → M-9.7b milestone)
 *
 * Idempotent: uses MERGE, not CREATE. Safe to run multiple times.
 *
 * Usage: npx tsx scripts/bootstrap-morpheme-topology.ts
 */

import { pathToFileURL } from "node:url";
import {
  closeDriver,
  writeTransaction,
  migrateSchema,
} from "../src/graph/index.js";
import { RELATIONSHIP_TYPES } from "../src/graph/schema.js";

// ── Data ────────────────────────────────────────────────────────────────────

interface ResonatorData {
  id: string;
  role: string;
  patternId: string;
  name: string;
  description: string;
}

interface FlowData {
  fromId: string;
  toId: string;
}

// ── Pattern Blooms ──

const PATTERN_BLOOMS = [
  {
    id: "pattern:architect",
    name: "Architect Pattern",
    type: "pattern",
    description: "7-stage planning pipeline: SURVEY → DECOMPOSE → CLASSIFY → SEQUENCE → GATE → DISPATCH → ADAPT",
    grammarRef: "morpheme:bloom",
  },
  {
    id: "pattern:dev-agent",
    name: "DevAgent Pattern",
    type: "pattern",
    description: "4-stage coding pipeline: SCOPE → EXECUTE → REVIEW → VALIDATE",
    grammarRef: "morpheme:bloom",
  },
  {
    id: "pattern:thompson-router",
    name: "Thompson Router Pattern",
    type: "pattern",
    description: "Thompson sampling model selection — bounded process for routing decisions",
    grammarRef: "morpheme:bloom",
  },
];

const SIGNAL_PIPELINE_BLOOM = {
  id: "pipeline:signal",
  name: "Signal Conditioning Pipeline",
  type: "pipeline",
  description: "7-stage signal conditioning: Debounce → Hampel → EWMA → CUSUM → MACD → Hysteresis → Trend",
  grammarRef: "morpheme:bloom",
};

// ── Architect Resonators ──

const ARCHITECT_RESONATORS: ResonatorData[] = [
  { id: "resonator:architect:survey", role: "survey", patternId: "pattern:architect", name: "SURVEY", description: "Document discovery, claim extraction, gap analysis" },
  { id: "resonator:architect:decompose", role: "decompose", patternId: "pattern:architect", name: "DECOMPOSE", description: "LLM-driven task decomposition from intent" },
  { id: "resonator:architect:classify", role: "classify", patternId: "pattern:architect", name: "CLASSIFY", description: "Mechanical vs generative classification" },
  { id: "resonator:architect:sequence", role: "sequence", patternId: "pattern:architect", name: "SEQUENCE", description: "Topological sort + critical path" },
  { id: "resonator:architect:gate", role: "gate", patternId: "pattern:architect", name: "GATE", description: "Human approval gate (mandatory in V1)" },
  { id: "resonator:architect:dispatch", role: "dispatch", patternId: "pattern:architect", name: "DISPATCH", description: "Task execution via TaskExecutor" },
  { id: "resonator:architect:adapt", role: "adapt", patternId: "pattern:architect", name: "ADAPT", description: "Failure classification + replanning" },
];

// ── DevAgent Resonators ──

const DEVAGENT_RESONATORS: ResonatorData[] = [
  { id: "resonator:dev-agent:scope", role: "scope", patternId: "pattern:dev-agent", name: "SCOPE", description: "Task scoping and file discovery" },
  { id: "resonator:dev-agent:execute", role: "execute", patternId: "pattern:dev-agent", name: "EXECUTE", description: "Code generation via model" },
  { id: "resonator:dev-agent:review", role: "review", patternId: "pattern:dev-agent", name: "REVIEW", description: "Cross-model code review" },
  { id: "resonator:dev-agent:validate", role: "validate", patternId: "pattern:dev-agent", name: "VALIDATE", description: "Quality assessment and gating" },
];

// ── Signal Resonators ──

const SIGNAL_RESONATORS: ResonatorData[] = [
  { id: "resonator:signal:debounce", role: "debounce", patternId: "pipeline:signal", name: "Debounce", description: "Stage 1: 100ms, 2-3 event persistence" },
  { id: "resonator:signal:hampel", role: "hampel", patternId: "pipeline:signal", name: "Hampel Filter", description: "Stage 2: 7-point window, k=3" },
  { id: "resonator:signal:ewma", role: "ewma", patternId: "pipeline:signal", name: "EWMA Smoother", description: "Stage 3: α=0.25 leaves, 0.15 default, 0.08 hubs" },
  { id: "resonator:signal:cusum", role: "cusum", patternId: "pipeline:signal", name: "CUSUM Monitor", description: "Stage 4: h ≈ 4-5" },
  { id: "resonator:signal:macd", role: "macd", patternId: "pipeline:signal", name: "MACD Detector", description: "Stage 5: fast α=0.25, slow α=0.04" },
  { id: "resonator:signal:hysteresis", role: "hysteresis", patternId: "pipeline:signal", name: "Hysteresis Gate", description: "Stage 6: band ≥ 2× V_pp" },
  { id: "resonator:signal:trend", role: "trend", patternId: "pipeline:signal", name: "Trend Regression", description: "Stage 7: Theil-Sen, 30-50 events" },
];

// ── FLOWS_TO edges ──

function getArchitectFlows(): FlowData[] {
  const stages = ARCHITECT_RESONATORS;
  const flows: FlowData[] = [];
  // Forward chain: SURVEY → DECOMPOSE → ... → ADAPT
  for (let i = 0; i < stages.length - 1; i++) {
    flows.push({ fromId: stages[i].id, toId: stages[i + 1].id });
  }
  // Return edge: ADAPT → SURVEY (replanning)
  flows.push({ fromId: stages[stages.length - 1].id, toId: stages[0].id });
  return flows;
}

function getDevAgentFlows(): FlowData[] {
  const stages = DEVAGENT_RESONATORS;
  const flows: FlowData[] = [];
  for (let i = 0; i < stages.length - 1; i++) {
    flows.push({ fromId: stages[i].id, toId: stages[i + 1].id });
  }
  return flows;
}

function getSignalFlows(): FlowData[] {
  const stages = SIGNAL_RESONATORS;
  const flows: FlowData[] = [];
  for (let i = 0; i < stages.length - 1; i++) {
    flows.push({ fromId: stages[i].id, toId: stages[i + 1].id });
  }
  return flows;
}

// ── Graph Write Helpers ──

async function mergePatternBloom(bloom: typeof PATTERN_BLOOMS[0]): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (b:Bloom {id: $id})
       ON CREATE SET
         b.name = $name,
         b.type = $type,
         b.description = $description,
         b.createdAt = datetime()
       ON MATCH SET
         b.name = $name,
         b.type = $type,
         b.description = $description,
         b.updatedAt = datetime()`,
      { id: bloom.id, name: bloom.name, type: bloom.type, description: bloom.description },
    );
  });
}

async function mergeResonator(r: ResonatorData): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (r:Resonator {id: $id})
       ON CREATE SET
         r.role = $role,
         r.patternId = $patternId,
         r.name = $name,
         r.description = $description,
         r.createdAt = datetime()
       ON MATCH SET
         r.role = $role,
         r.patternId = $patternId,
         r.name = $name,
         r.description = $description,
         r.updatedAt = datetime()`,
      { id: r.id, role: r.role, patternId: r.patternId, name: r.name, description: r.description },
    );
  });
}

async function mergeContains(parentId: string, childId: string): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (parent:Bloom {id: $parentId})
       MATCH (child:Resonator {id: $childId})
       MERGE (parent)-[:${RELATIONSHIP_TYPES.CONTAINS}]->(child)`,
      { parentId, childId },
    );
  });
}

async function mergeFlowsTo(fromId: string, toId: string): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (a:Resonator {id: $fromId})
       MATCH (b:Resonator {id: $toId})
       MERGE (a)-[:${RELATIONSHIP_TYPES.FLOWS_TO}]->(b)`,
      { fromId, toId },
    );
  });
}

async function mergeHelix(id: string, type: string, name: string, description: string): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (h:Helix {id: $id})
       ON CREATE SET
         h.type = $type,
         h.name = $name,
         h.description = $description,
         h.createdAt = datetime()
       ON MATCH SET
         h.type = $type,
         h.name = $name,
         h.description = $description,
         h.updatedAt = datetime()`,
      { id, type, name, description },
    );
  });
}

async function mergeGrid(id: string, type: string, name: string, description: string): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (g:Grid {id: $id})
       ON CREATE SET
         g.type = $type,
         g.name = $name,
         g.description = $description,
         g.createdAt = datetime()
       ON MATCH SET
         g.type = $type,
         g.name = $name,
         g.description = $description,
         g.updatedAt = datetime()`,
      { id, type, name, description },
    );
  });
}

async function mergeObserves(fromId: string, fromLabel: string, toId: string, toLabel: string): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (a:${fromLabel} {id: $fromId})
       MATCH (b:${toLabel} {id: $toId})
       MERGE (a)-[:${RELATIONSHIP_TYPES.OBSERVES}]->(b)`,
      { fromId, toId },
    );
  });
}

async function mergeInstantiates(instanceId: string, instanceLabel: string, grammarRefId: string): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (instance:${instanceLabel} {id: $instanceId})
       MATCH (def:Seed {id: $grammarRefId})
       MERGE (instance)-[:${RELATIONSHIP_TYPES.INSTANTIATES}]->(def)`,
      { instanceId, grammarRefId },
    );
  });
}

async function mergeScopedTo(fromId: string, milestoneId: string): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (b:Bloom {id: $fromId})
       MATCH (m:Bloom {id: $milestoneId})
       MERGE (b)-[:${RELATIONSHIP_TYPES.SCOPED_TO}]->(m)`,
      { fromId, milestoneId },
    );
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🏗️  M-9.7b Morpheme Topology Bootstrap — Runtime Structure in Graph\n");

  // Ensure schema is up to date
  const schema = await migrateSchema();
  if (schema.errors.length > 0) {
    console.error("Schema errors:", schema.errors);
  }
  console.log(`Schema: ${schema.applied} statements applied\n`);

  // ── 1. Pattern Blooms ──
  for (const bloom of PATTERN_BLOOMS) {
    try {
      await mergePatternBloom(bloom);
      console.log(`✅ Pattern Bloom: ${bloom.id} (${bloom.name})`);
    } catch (err) {
      console.warn(`⚠ Failed to create Pattern Bloom ${bloom.id}:`, err);
    }
  }

  // Signal Pipeline Bloom
  try {
    await mergePatternBloom(SIGNAL_PIPELINE_BLOOM);
    console.log(`✅ Pipeline Bloom: ${SIGNAL_PIPELINE_BLOOM.id} (${SIGNAL_PIPELINE_BLOOM.name})`);
  } catch (err) {
    console.warn(`⚠ Failed to create Signal Pipeline Bloom:`, err);
  }

  // ── 2. Resonators ──
  const allResonators = [...ARCHITECT_RESONATORS, ...DEVAGENT_RESONATORS, ...SIGNAL_RESONATORS];
  for (const r of allResonators) {
    try {
      await mergeResonator(r);
    } catch (err) {
      console.warn(`⚠ Failed to create Resonator ${r.id}:`, err);
    }
  }
  console.log(`✅ Resonators: ${allResonators.length} (7 Architect + 4 DevAgent + 7 Signal)`);

  // ── 3. CONTAINS relationships ──
  let containsCount = 0;
  for (const r of ARCHITECT_RESONATORS) {
    try {
      await mergeContains("pattern:architect", r.id);
      containsCount++;
    } catch (err) {
      console.warn(`⚠ Failed to link ${r.id} to pattern:architect:`, err);
    }
  }
  for (const r of DEVAGENT_RESONATORS) {
    try {
      await mergeContains("pattern:dev-agent", r.id);
      containsCount++;
    } catch (err) {
      console.warn(`⚠ Failed to link ${r.id} to pattern:dev-agent:`, err);
    }
  }
  for (const r of SIGNAL_RESONATORS) {
    try {
      await mergeContains("pipeline:signal", r.id);
      containsCount++;
    } catch (err) {
      console.warn(`⚠ Failed to link ${r.id} to pipeline:signal:`, err);
    }
  }
  console.log(`✅ CONTAINS relationships: ${containsCount}`);

  // ── 4. FLOWS_TO relationships ──
  const allFlows = [...getArchitectFlows(), ...getDevAgentFlows(), ...getSignalFlows()];
  let flowCount = 0;
  for (const flow of allFlows) {
    try {
      await mergeFlowsTo(flow.fromId, flow.toId);
      flowCount++;
    } catch (err) {
      console.warn(`⚠ Failed to create FLOWS_TO ${flow.fromId} → ${flow.toId}:`, err);
    }
  }
  console.log(`✅ FLOWS_TO relationships: ${flowCount} (7 Architect + 3 DevAgent + 6 Signal)`);

  // ── 5. Thompson Learning Helix ──
  try {
    await mergeHelix(
      "helix:thompson-learning",
      "learning",
      "Thompson Learning Loop",
      "Temporal evolution — posteriors refine across executions via Bayesian updates",
    );
    console.log("✅ Helix: helix:thompson-learning");
  } catch (err) {
    console.warn("⚠ Failed to create Thompson Helix:", err);
  }

  // ── 6. Compliance Corpus Grid ──
  try {
    await mergeGrid(
      "grid:compliance-corpus",
      "compliance",
      "Compliance Corpus",
      "Reference structure — placeholder until M-16.3 populates with assayer rules",
    );
    console.log("✅ Grid: grid:compliance-corpus");
  } catch (err) {
    console.warn("⚠ Failed to create Compliance Grid:", err);
  }

  // ── 7. OBSERVES: Thompson Helix → Thompson Router Bloom ──
  try {
    await mergeObserves("helix:thompson-learning", "Helix", "pattern:thompson-router", "Bloom");
    console.log("✅ OBSERVES: helix:thompson-learning → pattern:thompson-router");
  } catch (err) {
    console.warn("⚠ Failed to create OBSERVES relationship:", err);
  }

  // ── 8. INSTANTIATES: Runtime nodes → Grammar reference Seeds ──
  let instantiatesCount = 0;

  // Pattern Blooms instantiate the Bloom morpheme
  for (const bloom of [...PATTERN_BLOOMS, SIGNAL_PIPELINE_BLOOM]) {
    try {
      await mergeInstantiates(bloom.id, "Bloom", bloom.grammarRef);
      instantiatesCount++;
    } catch (err) {
      console.warn(`⚠ Failed to create INSTANTIATES for ${bloom.id}:`, err);
    }
  }

  // Resonators instantiate the Resonator morpheme
  for (const r of allResonators) {
    try {
      await mergeInstantiates(r.id, "Resonator", "morpheme:resonator");
      instantiatesCount++;
    } catch (err) {
      console.warn(`⚠ Failed to create INSTANTIATES for ${r.id}:`, err);
    }
  }

  // Thompson Helix instantiates the Helix morpheme
  try {
    await mergeInstantiates("helix:thompson-learning", "Helix", "morpheme:helix");
    instantiatesCount++;
  } catch (err) {
    console.warn("⚠ Failed to create INSTANTIATES for helix:thompson-learning:", err);
  }

  // Compliance Grid instantiates the Grid morpheme
  try {
    await mergeInstantiates("grid:compliance-corpus", "Grid", "morpheme:grid");
    instantiatesCount++;
  } catch (err) {
    console.warn("⚠ Failed to create INSTANTIATES for grid:compliance-corpus:", err);
  }

  console.log(`✅ INSTANTIATES relationships: ${instantiatesCount}`);

  // ── 9. SCOPED_TO: Pattern Blooms → M-9.7b milestone ──
  for (const bloom of PATTERN_BLOOMS) {
    try {
      await mergeScopedTo(bloom.id, "M-9.7b");
      console.log(`✅ SCOPED_TO: ${bloom.id} → M-9.7b`);
    } catch (err) {
      console.warn(`⚠ Failed to create SCOPED_TO for ${bloom.id} (M-9.7b milestone may not exist):`, err);
    }
  }

  // ── Summary ──
  console.log("\n── Summary ──");
  console.log(`Pattern Blooms:    ${PATTERN_BLOOMS.length + 1} (3 patterns + 1 signal pipeline)`);
  console.log(`Resonators:        ${allResonators.length}`);
  console.log(`CONTAINS:          ${containsCount}`);
  console.log(`FLOWS_TO:          ${flowCount}`);
  console.log(`INSTANTIATES:      ${instantiatesCount}`);
  console.log(`Helix:             1 (Thompson learning)`);
  console.log(`Grid:              1 (compliance corpus placeholder)`);
  console.log("\nDone.");

  await closeDriver();
}

// ── Entry point ──
const isMainModule =
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
