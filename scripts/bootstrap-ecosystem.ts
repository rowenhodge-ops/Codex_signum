#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * M-9.8 Ecosystem Bootstrap — Roadmap in Graph
 *
 * Reads the roadmap markdown and populates Neo4j with:
 * - Roadmap Bloom (top-level container)
 * - Milestone Blooms (M-1 through M-19)
 * - Sub-milestone Blooms (M-9.1 through M-9.8, etc.)
 * - Hypothesis Helix nodes (H-1, H-2, H-5)
 * - CONTAINS relationships (roadmap → milestones → sub-milestones)
 * - OBSERVES relationships (hypotheses → milestones)
 *
 * Idempotent: uses MERGE, not CREATE. Safe to run multiple times.
 *
 * Usage: npx tsx scripts/bootstrap-ecosystem.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import {
  closeDriver,
  writeTransaction,
  migrateSchema,
} from "../src/graph/index.js";
import { RELATIONSHIP_TYPES } from "../src/graph/schema.js";

// ── Milestone Data ──────────────────────────────────────────────────────────

interface MilestoneData {
  id: string;
  name: string;
  status: string;
  phiL: number;
  sequence: number;
  type: "milestone" | "sub-milestone";
  parentId?: string;
  commitSha?: string;
  testCount?: number;
  description?: string;
}

interface HypothesisData {
  id: string;
  claim: string;
  paper: string;
  status: string;
  evidenceStrength: number;
  observesMilestone: string;
}

function statusToPhiL(status: string): number {
  switch (status) {
    case "complete": return 0.9;
    case "active": return 0.5;
    case "next": return 0.5;
    case "planned": return 0.3;
    case "vision": return 0.1;
    default: return 0.3;
  }
}

/**
 * Parse milestone structure from the roadmap.
 * Uses hardcoded data extracted from roadmap-v7 — the roadmap has consistent
 * structure but is not machine-parseable without fragile regex.
 */
function getRoadmapMilestones(): MilestoneData[] {
  const milestones: MilestoneData[] = [
    // ── Completed milestones ──
    { id: "M-1", name: "Foundation", status: "complete", phiL: 0.9, sequence: 1, type: "milestone",
      description: "Neo4j schema, type system, ΦL/ΨH/εR computation, dampening, cascade prevention, adaptive thresholds, constitutional rule engine, memory types" },
    { id: "M-2", name: "Signal Conditioning", status: "complete", phiL: 0.9, sequence: 2, type: "milestone",
      description: "7-stage pipeline. Nelson Rules. Structural review + triggers. Immune response." },
    { id: "M-4", name: "Patterns in Core", status: "complete", phiL: 0.9, sequence: 4, type: "milestone",
      description: "Thompson Router, DevAgent, Architect — live in core library" },
    { id: "M-5", name: "Architect Bootstrap", status: "complete", phiL: 0.9, sequence: 5, type: "milestone",
      description: "SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT" },
    { id: "M-6", name: "Thompson Sampling Integration", status: "complete", phiL: 0.9, sequence: 6, type: "milestone",
      description: "Live model selection via Bayesian posterior updates. Decision nodes in graph." },
    { id: "M-7", name: "First Self-Examination", status: "complete", phiL: 0.9, sequence: 7, type: "milestone",
      description: "Dampening fix, observer removal, reconciliation between spec and code" },
    { id: "M-7B", name: "Spec Review & Axiom Uplift", status: "complete", phiL: 0.9, sequence: 7.2, type: "milestone",
      description: "Three pipeline runs. Bridge View Principle, Dimensional Collapse, Axiom Dependency Declaration." },
    { id: "M-7C", name: "Grammar Refactor", status: "complete", phiL: 0.9, sequence: 7.3, type: "milestone",
      description: "Agent → Seed, Pattern → Bloom, relationship renames, ELIMINATED_ENTITIES" },
    { id: "M-8", name: "Optimisation Runs", status: "complete", phiL: 0.9, sequence: 8, type: "milestone",
      description: "R0-R3 reviews, human feedback CLI, DevAgent self-hosting CLI" },
    { id: "M-8A", name: "Report Consolidation & Compliance Review", status: "complete", phiL: 0.9, sequence: 8.1, type: "milestone" },
    { id: "M-8B", name: "Comprehensive Lean Review", status: "complete", phiL: 0.9, sequence: 8.2, type: "milestone" },
    { id: "M-8C", name: "Codex-Native Topology Refactor", status: "complete", phiL: 0.9, sequence: 8.3, type: "milestone" },
    { id: "M-8.QG", name: "Quality Gates", status: "complete", phiL: 0.9, sequence: 8.5, type: "milestone" },

    // ── M-9: Structural Compliance (active) ──
    { id: "M-9", name: "Structural Compliance", status: "active", phiL: 0.5, sequence: 9, type: "milestone",
      description: "The system's thesis is 'state is structural.' This milestone makes it true for the pipeline itself." },

    // Sub-milestones of M-9 Part 1
    { id: "M-9.1", name: "Neo4j Schema for Pipeline Topology", status: "complete", phiL: 0.9, sequence: 9.1, type: "sub-milestone", parentId: "M-9",
      commitSha: "7d70666", testCount: 1101 },
    { id: "M-9.2", name: "Pipeline Executor Writes to Graph", status: "complete", phiL: 0.9, sequence: 9.2, type: "sub-milestone", parentId: "M-9",
      commitSha: "b4a0850", testCount: 1108 },
    { id: "M-9.3", name: "Decision Lifecycle Completion", status: "complete", phiL: 0.9, sequence: 9.3, type: "sub-milestone", parentId: "M-9",
      commitSha: "3815dee", testCount: 1133 },
    { id: "M-9.4", name: "Memory Persistence as Intended", status: "complete", phiL: 0.9, sequence: 9.4, type: "sub-milestone", parentId: "M-9",
      commitSha: "3f86f2e", testCount: 1176 },
    { id: "M-9.VA", name: "Partial Verification", status: "complete", phiL: 0.9, sequence: 9.41, type: "sub-milestone", parentId: "M-9" },
    { id: "M-9.VA-FIX", name: "Pipeline Self-Diagnostic Bug Fixes", status: "complete", phiL: 0.9, sequence: 9.42, type: "sub-milestone", parentId: "M-9",
      commitSha: "1e1d4d5", testCount: 1182 },
    { id: "M-9.VA-V", name: "Post-Fix Verification", status: "complete", phiL: 0.9, sequence: 9.43, type: "sub-milestone", parentId: "M-9",
      commitSha: "d4facec", testCount: 1182 },

    // Sub-milestones of M-9 Part 2
    { id: "M-9.5", name: "Test Reconciliation", status: "complete", phiL: 0.9, sequence: 9.5, type: "sub-milestone", parentId: "M-9",
      commitSha: "8547edd", testCount: 1196 },
    { id: "M-9.8", name: "Ecosystem Bootstrap", status: "active", phiL: 0.5, sequence: 9.8, type: "sub-milestone", parentId: "M-9",
      description: "Roadmap in graph, hypothesis Helixes, SURVEY reads from Neo4j" },
    { id: "M-9.6", name: "Model Expansion — Llama 4", status: "planned", phiL: 0.3, sequence: 9.6, type: "sub-milestone", parentId: "M-9" },
    { id: "M-9.7a", name: "Grammar Reference Document", status: "planned", phiL: 0.3, sequence: 9.71, type: "sub-milestone", parentId: "M-9" },
    { id: "M-9.7b", name: "Morpheme Mapping + 3D Topology Vis", status: "planned", phiL: 0.3, sequence: 9.72, type: "sub-milestone", parentId: "M-9" },

    // M-9.V: Full Verification
    { id: "M-9.V", name: "Full Verification Run", status: "planned", phiL: 0.3, sequence: 9.9, type: "sub-milestone", parentId: "M-9" },

    // ── Post-M-9 milestones ──
    { id: "M-16", name: "v4.3 Spec Canonicalisation", status: "planned", phiL: 0.3, sequence: 16, type: "milestone",
      description: "Axiom reduction, Assayer types, governance" },
    { id: "M-17", name: "Engineering Bridge v2.1", status: "planned", phiL: 0.3, sequence: 17, type: "milestone",
      description: "Stale formulas, Bridge View Principle, deferred computations" },
    { id: "M-8.INT", name: "Architect Adaptive Routing", status: "planned", phiL: 0.3, sequence: 8.6, type: "milestone",
      description: "CLASSIFY→route. Per-task FMEA advisory. Agent becomes substrate." },
    { id: "M-13", name: "UI", status: "planned", phiL: 0.3, sequence: 13, type: "milestone",
      description: "Graph vis + Opus chat — the agent gets a face" },
    { id: "M-18", name: "Assayer Implementation", status: "planned", phiL: 0.3, sequence: 18, type: "milestone",
      description: "4 stages, 4 modes, compliance corpus, FMEA" },
    { id: "M-10", name: "Memory Operations", status: "planned", phiL: 0.3, sequence: 10, type: "milestone",
      description: "Full compaction, distillation, institutional knowledge" },
    { id: "M-11", name: "Research Pattern", status: "planned", phiL: 0.3, sequence: 11, type: "milestone",
      description: "Systematic evidence synthesis" },
    { id: "M-12", name: "Constitutional Evolution", status: "planned", phiL: 0.3, sequence: 12, type: "milestone",
      description: "Evidence-based amendment mechanism" },
    { id: "M-14", name: "Self-Recursive Learning L1-L3", status: "planned", phiL: 0.3, sequence: 14, type: "milestone",
      description: "The system evolves itself" },
    { id: "M-15", name: "Pattern Exchange Protocol", status: "planned", phiL: 0.3, sequence: 15, type: "milestone",
      description: "Federated deployment sharing" },
    { id: "M-19", name: "Hypothesis Tracking + Research Pipeline", status: "planned", phiL: 0.3, sequence: 19, type: "milestone",
      description: "Helix nodes, evidence accumulation, paper readiness" },
  ];

  return milestones;
}

function getHypotheses(): HypothesisData[] {
  return [
    {
      id: "H-1",
      claim: "Context-blocked posteriors outperform global posteriors",
      paper: "Paper 1 (Thompson context-blocking)",
      status: "proposed",
      evidenceStrength: 0.1,
      observesMilestone: "M-9",
    },
    {
      id: "H-2",
      claim: "Bias-as-strength outperforms naive best-overall selection",
      paper: "Paper 1 (Thompson context-blocking)",
      status: "proposed",
      evidenceStrength: 0.1,
      observesMilestone: "M-9",
    },
    {
      id: "H-5",
      claim: "Structural learning persists across complete model substitution",
      paper: "Paper 4 (Structural intelligence)",
      status: "proposed",
      evidenceStrength: 0.1,
      observesMilestone: "M-10",
    },
  ];
}

// ── Graph Writes ────────────────────────────────────────────────────────────

async function createRoadmapBloom(): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (b:Bloom {id: $id})
       ON CREATE SET
         b.name = $name,
         b.type = $type,
         b.version = $version,
         b.status = $status,
         b.phiL = $phiL,
         b.createdAt = datetime()
       ON MATCH SET
         b.version = $version,
         b.status = $status,
         b.updatedAt = datetime()`,
      {
        id: "roadmap-v7",
        name: "Codex Signum Canonical Roadmap",
        type: "roadmap",
        version: 7,
        status: "active",
        phiL: 0.5,
      },
    );
  });
}

async function createMilestoneBloom(m: MilestoneData): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (b:Bloom {id: $id})
       ON CREATE SET
         b.name = $name,
         b.type = $type,
         b.status = $status,
         b.phiL = $phiL,
         b.sequence = $sequence,
         b.description = $description,
         b.commitSha = $commitSha,
         b.testCount = $testCount,
         b.createdAt = datetime()
       ON MATCH SET
         b.name = $name,
         b.status = $status,
         b.phiL = $phiL,
         b.sequence = $sequence,
         b.description = $description,
         b.commitSha = $commitSha,
         b.testCount = $testCount,
         b.updatedAt = datetime()`,
      {
        id: m.id,
        name: m.name,
        type: m.type,
        status: m.status,
        phiL: m.phiL,
        sequence: m.sequence,
        description: m.description ?? null,
        commitSha: m.commitSha ?? null,
        testCount: m.testCount ?? null,
      },
    );
  });
}

async function createContainsRelationship(
  parentId: string,
  childId: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (parent:Bloom {id: $parentId})
       MATCH (child:Bloom {id: $childId})
       MERGE (parent)-[:${RELATIONSHIP_TYPES.CONTAINS}]->(child)`,
      { parentId, childId },
    );
  });
}

async function createHypothesisHelix(h: HypothesisData): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (hx:Helix {id: $id})
       ON CREATE SET
         hx.type = "hypothesis",
         hx.claim = $claim,
         hx.paper = $paper,
         hx.status = $status,
         hx.evidenceStrength = $evidenceStrength,
         hx.observationCount = 0,
         hx.createdAt = datetime()
       ON MATCH SET
         hx.claim = $claim,
         hx.paper = $paper,
         hx.status = $status,
         hx.updatedAt = datetime()`,
      {
        id: h.id,
        claim: h.claim,
        paper: h.paper,
        status: h.status,
        evidenceStrength: h.evidenceStrength,
      },
    );
  });
}

async function createObservesRelationship(
  helixId: string,
  milestoneId: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (hx:Helix {id: $helixId})
       MATCH (m:Bloom {id: $milestoneId})
       MERGE (hx)-[:${RELATIONSHIP_TYPES.OBSERVES}]->(m)`,
      { helixId, milestoneId },
    );
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🌐 M-9.8 Ecosystem Bootstrap — Roadmap in Graph\n");

  // Ensure schema is up to date
  const schema = await migrateSchema();
  if (schema.errors.length > 0) {
    console.error("Schema errors:", schema.errors);
  }
  console.log(`Schema: ${schema.applied} statements applied\n`);

  // 1. Create roadmap Bloom
  await createRoadmapBloom();
  console.log("✅ Roadmap Bloom: roadmap-v7");

  // 2. Create milestone + sub-milestone Blooms
  const milestones = getRoadmapMilestones();
  const majorMilestones = milestones.filter((m) => m.type === "milestone");
  const subMilestones = milestones.filter((m) => m.type === "sub-milestone");

  for (const m of milestones) {
    await createMilestoneBloom(m);
  }
  console.log(`✅ Milestones: ${majorMilestones.length} major, ${subMilestones.length} sub-milestones`);

  // 3. CONTAINS: roadmap → major milestones
  for (const m of majorMilestones) {
    await createContainsRelationship("roadmap-v7", m.id);
  }
  console.log(`✅ CONTAINS: roadmap-v7 → ${majorMilestones.length} milestones`);

  // 4. CONTAINS: milestone → sub-milestones
  for (const m of subMilestones) {
    if (m.parentId) {
      await createContainsRelationship(m.parentId, m.id);
    }
  }
  console.log(`✅ CONTAINS: milestones → ${subMilestones.length} sub-milestones`);

  // 5. Create hypothesis Helixes
  const hypotheses = getHypotheses();
  for (const h of hypotheses) {
    await createHypothesisHelix(h);
  }
  console.log(`✅ Hypothesis Helixes: ${hypotheses.length} (${hypotheses.map((h) => h.id).join(", ")})`);

  // 6. OBSERVES: hypothesis → milestone
  for (const h of hypotheses) {
    await createObservesRelationship(h.id, h.observesMilestone);
  }
  console.log(`✅ OBSERVES: hypotheses → milestones`);

  // Summary
  console.log("\n── Summary ──");
  console.log(`  Bloom nodes: ${1 + milestones.length} (1 roadmap + ${majorMilestones.length} milestones + ${subMilestones.length} sub-milestones)`);
  console.log(`  Helix nodes: ${hypotheses.length}`);
  console.log(`  CONTAINS relationships: ${majorMilestones.length + subMilestones.length}`);
  console.log(`  OBSERVES relationships: ${hypotheses.length}`);
  console.log("\nDone. Verify with:");
  console.log("  MATCH (m:Bloom {type: 'milestone'}) RETURN m.id, m.phiL, m.status ORDER BY m.sequence");
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
  getRoadmapMilestones,
  getHypotheses,
  statusToPhiL,
  createRoadmapBloom,
  createMilestoneBloom,
  createContainsRelationship,
  createHypothesisHelix,
  createObservesRelationship,
};
export type { MilestoneData, HypothesisData };
