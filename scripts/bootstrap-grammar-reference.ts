#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * M-9.7a Grammar Reference Bootstrap — Bill of Materials in Graph
 *
 * Populates Neo4j with the complete Codex Signum grammar reference:
 * - Grammar Reference Bloom (top-level container)
 * - Category Blooms (morphemes, axioms, grammar-rules, state-dimensions, etc.)
 * - Element Seeds per category (every grammar primitive from the v4.3 spec)
 * - DEPENDS_ON relationships (axiom DAG)
 * - VIOLATES relationships (anti-patterns → axioms)
 * - SCOPED_TO relationship (grammar-ref → M-9.7a milestone)
 *
 * Idempotent: uses MERGE, not CREATE. Safe to run multiple times.
 *
 * Usage: npx tsx scripts/bootstrap-grammar-reference.ts
 */

import { pathToFileURL } from "node:url";
import {
  closeDriver,
  writeTransaction,
  migrateSchema,
} from "../src/graph/index.js";
import { RELATIONSHIP_TYPES } from "../src/graph/schema.js";

// ── Data ────────────────────────────────────────────────────────────────────

const GRAMMAR_REF_ID = "grammar-ref-v4.3";

interface GrammarElement {
  id: string;
  seedType: string;
  name: string;
  description: string;
  specSource: string;
  implementationStatus: "complete" | "partial" | "types-only" | "not-started" | "aspirational";
  implementationNotes: string;
  codeLocation: string | null;
}

interface CategoryData {
  id: string;
  name: string;
  elements: GrammarElement[];
}

function getCategories(): CategoryData[] {
  return [
    {
      id: "cat:morphemes",
      name: "Morphemes",
      elements: [
        { id: "morpheme:seed", seedType: "morpheme", name: "Seed (•)", description: "Origin, instance, datum, coherent unit", specSource: "v4.3 §The Six Morphemes", implementationStatus: "complete", implementationNotes: "Type + Neo4j label + graph operations", codeLocation: "src/types/morphemes.ts" },
        { id: "morpheme:line", seedType: "morpheme", name: "Line (→)", description: "Flow, transformation, direction", specSource: "v4.3 §The Six Morphemes", implementationStatus: "partial", implementationNotes: "Represented as Neo4j relationships; no dedicated Line type", codeLocation: "src/types/morphemes.ts" },
        { id: "morpheme:bloom", seedType: "morpheme", name: "Bloom (○)", description: "Scope, boundary, context", specSource: "v4.3 §The Six Morphemes", implementationStatus: "complete", implementationNotes: "Type + Neo4j label + graph operations", codeLocation: "src/types/morphemes.ts" },
        { id: "morpheme:resonator", seedType: "morpheme", name: "Resonator (Δ)", description: "Transformation, decision, routing", specSource: "v4.3 §The Six Morphemes", implementationStatus: "partial", implementationNotes: "Type + Neo4j label; pipeline stage wiring (M-9.2)", codeLocation: "src/types/morphemes.ts" },
        { id: "morpheme:grid", seedType: "morpheme", name: "Grid (□)", description: "Network, schema, knowledge structure", specSource: "v4.3 §The Six Morphemes", implementationStatus: "types-only", implementationNotes: "Type defined; no graph operations yet", codeLocation: "src/types/morphemes.ts" },
        { id: "morpheme:helix", seedType: "morpheme", name: "Helix (🌀)", description: "Recursion, iteration, temporal flow, learning", specSource: "v4.3 §The Six Morphemes", implementationStatus: "partial", implementationNotes: "Type + Neo4j label; hypothesis helixes (M-9.8)", codeLocation: "src/types/morphemes.ts" },
      ],
    },
    {
      id: "cat:axioms",
      name: "Axioms",
      elements: [
        { id: "axiom:A1-fidelity", seedType: "axiom", name: "A1 Fidelity", description: "Representation must match actual state", specSource: "v4.3 §Axioms — Structural", implementationStatus: "complete", implementationNotes: "Constitutional rule engine + ΦL computation", codeLocation: "src/constitutional/rule-engine.ts" },
        { id: "axiom:A2-visible-state", seedType: "axiom", name: "A2 Visible State", description: "Health expressed in structural properties, never hidden", specSource: "v4.3 §Axioms — Structural", implementationStatus: "complete", implementationNotes: "Graph-native health on Bloom/Seed nodes", codeLocation: "src/constitutional/rule-engine.ts" },
        { id: "axiom:A3-transparency", seedType: "axiom", name: "A3 Transparency", description: "Every signal must be interpretable by its receiver", specSource: "v4.3 §Axioms — Structural", implementationStatus: "complete", implementationNotes: "ΦL composite structure (never bare number)", codeLocation: "src/constitutional/rule-engine.ts" },
        { id: "axiom:A4-provenance", seedType: "axiom", name: "A4 Provenance", description: "Every element carries the signature of its origin", specSource: "v4.3 §Axioms — Traceability", implementationStatus: "complete", implementationNotes: "Decision provenance chain (M-9.3)", codeLocation: "src/constitutional/rule-engine.ts" },
        { id: "axiom:A5-reversibility", seedType: "axiom", name: "A5 Reversibility", description: "Prior states must be reconstructable", specSource: "v4.3 §Axioms — Traceability", implementationStatus: "partial", implementationNotes: "Observation history retained; full state reconstruction not yet implemented", codeLocation: "src/constitutional/rule-engine.ts" },
        { id: "axiom:A6-minimal-authority", seedType: "axiom", name: "A6 Minimal Authority", description: "A pattern requests only the resources its purpose requires", specSource: "v4.3 §Axioms — Traceability", implementationStatus: "partial", implementationNotes: "Constitutional rule exists; enforcement is advisory", codeLocation: "src/constitutional/rule-engine.ts" },
        { id: "axiom:A7-semantic-stability", seedType: "axiom", name: "A7 Semantic Stability", description: "The six morphemes are immutable across all versions", specSource: "v4.3 §Axioms — Comprehension", implementationStatus: "complete", implementationNotes: "Morpheme types frozen; hallucination detector guards entity names", codeLocation: "src/constitutional/rule-engine.ts" },
        { id: "axiom:A8-adaptive-pressure", seedType: "axiom", name: "A8 Adaptive Pressure", description: "Patterns evolve through feedback; learning is structural and visible", specSource: "v4.3 §Axioms — Comprehension", implementationStatus: "complete", implementationNotes: "Thompson sampling + εR computation + human feedback", codeLocation: "src/constitutional/rule-engine.ts" },
        { id: "axiom:A9-comprehension-primacy", seedType: "axiom", name: "A9 Comprehension Primacy", description: "When efficiency and understanding conflict, understanding wins", specSource: "v4.3 §Axioms — Comprehension", implementationStatus: "partial", implementationNotes: "Design principle; no mechanical enforcement", codeLocation: "src/constitutional/rule-engine.ts" },
      ],
    },
    {
      id: "cat:grammar-rules",
      name: "Grammar Rules",
      elements: [
        { id: "rule:G1-proximity", seedType: "grammar-rule", name: "G1 Proximity", description: "Connection requires explicit intent; proximity alone is insufficient", specSource: "v4.3 §Grammar Rules", implementationStatus: "complete", implementationNotes: "Graph requires explicit relationship creation", codeLocation: null },
        { id: "rule:G2-orientation", seedType: "grammar-rule", name: "G2 Orientation", description: "Direction encodes flow (toward/away/parallel/bidirectional)", specSource: "v4.3 §Grammar Rules", implementationStatus: "partial", implementationNotes: "Neo4j relationships are directed; parallel/bidirectional not yet modeled", codeLocation: null },
        { id: "rule:G3-containment", seedType: "grammar-rule", name: "G3 Containment", description: "Enclosure creates scope; intentional effects need explicit Lines", specSource: "v4.3 §Grammar Rules", implementationStatus: "complete", implementationNotes: "CONTAINS relationships + hierarchical health aggregation", codeLocation: null },
        { id: "rule:G4-flow", seedType: "grammar-rule", name: "G4 Flow", description: "Light movement is data transfer; speed=urgency, brightness=volume", specSource: "v4.3 §Grammar Rules", implementationStatus: "not-started", implementationNotes: "Aspirational visual encoding; no runtime flow tracking yet", codeLocation: null },
        { id: "rule:G5-resonance", seedType: "grammar-rule", name: "G5 Resonance", description: "Harmonically aligned ΨH enables implicit composition", specSource: "v4.3 §Grammar Rules", implementationStatus: "partial", implementationNotes: "ΨH computed; resonance-based composition not yet implemented", codeLocation: null },
      ],
    },
    {
      id: "cat:state-dimensions",
      name: "State Dimensions",
      elements: [
        { id: "dim:phiL", seedType: "state-dimension", name: "ΦL Luminosity", description: "Pattern health: axiom_compliance(0.4) + provenance(0.2) + success_rate(0.2) + temporal_stability(0.2)", specSource: "v4.3 §State Dimensions, Bridge §Part 2", implementationStatus: "complete", implementationNotes: "Computation complete; pipeline feeding not yet wired", codeLocation: "src/computation/phi-l.ts" },
        { id: "dim:psiH", seedType: "state-dimension", name: "ΨH Harmonic Signature", description: "Relational coherence: 0.4×normalize(λ₂) + 0.6×(1-friction)", specSource: "v4.3 §State Dimensions, Bridge §Part 2", implementationStatus: "complete", implementationNotes: "Computation complete; pipeline feeding not yet wired", codeLocation: "src/computation/psi-h.ts" },
        { id: "dim:epsilonR", seedType: "state-dimension", name: "εR Exploration Rate", description: "Adaptive capacity: exploratory_decisions/total_decisions with imperative gradient", specSource: "v4.3 §State Dimensions, Bridge §Part 2", implementationStatus: "complete", implementationNotes: "Computation complete with spectral calibration; pipeline feeding not yet wired", codeLocation: "src/computation/epsilon-r.ts" },
      ],
    },
    {
      id: "cat:heuristic-imperatives",
      name: "Heuristic Imperatives",
      elements: [
        { id: "imp:omega1", seedType: "heuristic-imperative", name: "Ω₁ Reduce Suffering", description: "System minimises harm in participants, affected systems, and broader environment", specSource: "v4.3 §Heuristic Imperatives", implementationStatus: "aspirational", implementationNotes: "Design principle; gradient computation not implemented", codeLocation: null },
        { id: "imp:omega2", seedType: "heuristic-imperative", name: "Ω₂ Increase Prosperity", description: "System distributes capability, rewards contribution, expands access", specSource: "v4.3 §Heuristic Imperatives", implementationStatus: "aspirational", implementationNotes: "Design principle; gradient computation not implemented", codeLocation: null },
        { id: "imp:omega3", seedType: "heuristic-imperative", name: "Ω₃ Increase Understanding", description: "System makes invisible visible, complex comprehensible, opaque transparent", specSource: "v4.3 §Heuristic Imperatives", implementationStatus: "aspirational", implementationNotes: "Design principle; deepest embedding via A9 Comprehension Primacy", codeLocation: null },
      ],
    },
    {
      id: "cat:anti-patterns",
      name: "Anti-Patterns",
      elements: [
        { id: "ap:shadow-system", seedType: "anti-pattern", name: "Shadow System", description: "Separate entity that stores state outside the graph", specSource: "v4.3 §Structural Integrity, CLAUDE.md", implementationStatus: "complete", implementationNotes: "Detected by hallucination system", codeLocation: null },
        { id: "ap:dimensional-collapse", seedType: "anti-pattern", name: "Dimensional Collapse", description: "Multi-dimensional signal collapsed to single scalar/flag/binary", specSource: "v4.3 §Structural Integrity, CLAUDE.md", implementationStatus: "complete", implementationNotes: "Detected by hallucination system; ΦL type enforces composite", codeLocation: null },
        { id: "ap:infrastructure-first", seedType: "anti-pattern", name: "Infrastructure-First", description: "Building infrastructure before the grammar needs it", specSource: "CLAUDE.md", implementationStatus: "complete", implementationNotes: "Pre-edit guard in bootstrap task executor", codeLocation: null },
        { id: "ap:model-centric", seedType: "anti-pattern", name: "Model-Centric Thinking", description: "LLM provider details leak into substrate-agnostic grammar", specSource: "CLAUDE.md", implementationStatus: "complete", implementationNotes: "Detected by hallucination system; ELIMINATED_ENTITIES list", codeLocation: null },
        { id: "ap:monitoring-overlay", seedType: "anti-pattern", name: "Monitoring Overlay", description: "Separate observation/monitoring entity between execution and graph", specSource: "v4.3 §Structural Integrity, CLAUDE.md", implementationStatus: "complete", implementationNotes: "Observer deleted (ce0ef96); CLAUDE.md rule; lean maps corrected", codeLocation: null },
        { id: "ap:prescribed-behaviour", seedType: "anti-pattern", name: "Prescribed Behaviour", description: "Patterns dictating what other patterns do instead of structural pressure", specSource: "v4.3 §Structural Integrity", implementationStatus: "partial", implementationNotes: "Design principle; no mechanical enforcement", codeLocation: null },
        { id: "ap:bridge-drift", seedType: "anti-pattern", name: "Bridge Drift", description: "Implementation diverges from Engineering Bridge parameters", specSource: "CLAUDE.md", implementationStatus: "partial", implementationNotes: "SURVEY research-divergence detection; not all parameters checked", codeLocation: null },
        { id: "ap:manual-analysis-bypass", seedType: "anti-pattern", name: "Manual Analysis Bypass", description: "Agent does analytical work manually instead of using Architect pipeline", specSource: "CLAUDE.md", implementationStatus: "complete", implementationNotes: "CLAUDE.md rules; pipeline operational", codeLocation: null },
        { id: "ap:fixed-dampening", seedType: "anti-pattern", name: "Fixed Dampening γ=0.7", description: "Using constant γ instead of topology-aware γ_effective = min(0.7, 0.8/k)", specSource: "CLAUDE.md, Bridge §Part 3", implementationStatus: "complete", implementationNotes: "Safety tests enforce; subcriticality.test.ts", codeLocation: null },
        { id: "ap:bare-number-health", seedType: "anti-pattern", name: "Bare Number Health", description: "Passing ΦL as a bare number instead of PhiLOutput composite", specSource: "CLAUDE.md", implementationStatus: "complete", implementationNotes: "TypeScript type system enforces PhiLOutput", codeLocation: null },
        { id: "ap:static-retention", seedType: "anti-pattern", name: "Static Retention Window", description: "Fixed-window compaction instead of continuous exponential decay", specSource: "CLAUDE.md, Bridge §Part 7", implementationStatus: "complete", implementationNotes: "Compaction tests verify exponential decay", codeLocation: null },
        { id: "ap:fixed-circuit-breaker", seedType: "anti-pattern", name: "Fixed Circuit Breaker Cooldown", description: "Constant cooldown instead of exponential backoff + full jitter", specSource: "CLAUDE.md, Bridge §Part 3", implementationStatus: "complete", implementationNotes: "Conformance tests verify backoff + jitter", codeLocation: null },
      ],
    },
    {
      id: "cat:operational-records",
      name: "Operational Records",
      elements: [
        { id: "op:decision", seedType: "operational-record", name: "Decision", description: "Routing choice with provenance and outcome tracking", specSource: "v4.3 §Operational Records", implementationStatus: "complete", implementationNotes: "Graph writes live (M-9.3); Thompson reads outcomes", codeLocation: "src/graph/queries.ts" },
        { id: "op:observation", seedType: "operational-record", name: "Observation", description: "Execution record: success/failure, latency, quality score", specSource: "v4.3 §Memory Topology — Stratum 2", implementationStatus: "complete", implementationNotes: "Graph writes live (M-9.1); inline conditioning", codeLocation: "src/graph/queries.ts" },
        { id: "op:threshold-event", seedType: "operational-record", name: "ThresholdEvent", description: "Health band crossing event (healthy→degraded, etc.)", specSource: "v4.3 §State Dimensions", implementationStatus: "complete", implementationNotes: "Written by inline write-observation path", codeLocation: "src/graph/write-observation.ts" },
        { id: "op:pipeline-run", seedType: "operational-record", name: "PipelineRun", description: "End-to-end pipeline execution record with stage timing", specSource: "v4.3 §Operational Records", implementationStatus: "complete", implementationNotes: "Graph writes live (M-9.2); analytics queries", codeLocation: "src/graph/queries.ts" },
        { id: "op:task-output", seedType: "operational-record", name: "TaskOutput", description: "Individual task result within a pipeline run", specSource: "v4.3 §Operational Records", implementationStatus: "complete", implementationNotes: "Graph writes live (M-9.2); linked to PipelineRun + Resonator stage", codeLocation: "src/graph/queries.ts" },
      ],
    },
    {
      id: "cat:memory-strata",
      name: "Memory Strata",
      elements: [
        { id: "stratum:1-ephemeral", seedType: "stratum", name: "Stratum 1: Ephemeral", description: "Execution context — working memory discarded on completion", specSource: "v4.3 §Memory Topology", implementationStatus: "types-only", implementationNotes: "Type defined; runtime memory is JS-native, not graph-persisted", codeLocation: "src/types/memory.ts" },
        { id: "stratum:2-observations", seedType: "stratum", name: "Stratum 2: Observational", description: "Execution records with exponential decay weighting", specSource: "v4.3 §Memory Topology", implementationStatus: "complete", implementationNotes: "Types + write paths + compaction (M-9.4)", codeLocation: "src/memory/compaction.ts" },
        { id: "stratum:3-distillations", seedType: "stratum", name: "Stratum 3: Distilled", description: "Cross-component insights: performance profiles, routing hints, threshold calibration", specSource: "v4.3 §Memory Topology", implementationStatus: "complete", implementationNotes: "Types + distillation bridge (M-9.4)", codeLocation: "src/memory/distillation.ts" },
        { id: "stratum:4-institutional", seedType: "stratum", name: "Stratum 4: Institutional", description: "Network-wide ecosystem knowledge transcending individual components", specSource: "v4.3 §Memory Topology", implementationStatus: "partial", implementationNotes: "Types defined; content population target for M-10", codeLocation: "src/types/memory.ts" },
      ],
    },
  ];
}

/** Axiom DAG: axiomId → list of axiomIds it depends on. From v4.3 §Axiom Dependency Structure. */
function getAxiomDependencies(): Array<{ from: string; to: string }> {
  return [
    // A1 depends on A2, A3
    { from: "axiom:A1-fidelity", to: "axiom:A2-visible-state" },
    { from: "axiom:A1-fidelity", to: "axiom:A3-transparency" },
    // A4 depends on A2
    { from: "axiom:A4-provenance", to: "axiom:A2-visible-state" },
    // A5 depends on A4
    { from: "axiom:A5-reversibility", to: "axiom:A4-provenance" },
    // A7 depends on A2
    { from: "axiom:A7-semantic-stability", to: "axiom:A2-visible-state" },
    // A8 depends on A2, A3
    { from: "axiom:A8-adaptive-pressure", to: "axiom:A2-visible-state" },
    { from: "axiom:A8-adaptive-pressure", to: "axiom:A3-transparency" },
    // A9 depends on A3
    { from: "axiom:A9-comprehension-primacy", to: "axiom:A3-transparency" },
  ];
}

/** Anti-pattern → axiom VIOLATES mapping. From v4.3 §Structural Integrity + CLAUDE.md. */
function getAntiPatternViolations(): Array<{ antiPatternId: string; axiomId: string }> {
  return [
    { antiPatternId: "ap:shadow-system", axiomId: "axiom:A2-visible-state" },
    { antiPatternId: "ap:dimensional-collapse", axiomId: "axiom:A3-transparency" },
    { antiPatternId: "ap:infrastructure-first", axiomId: "axiom:A6-minimal-authority" },
    { antiPatternId: "ap:model-centric", axiomId: "axiom:A7-semantic-stability" },
    { antiPatternId: "ap:monitoring-overlay", axiomId: "axiom:A2-visible-state" },
    { antiPatternId: "ap:prescribed-behaviour", axiomId: "axiom:A7-semantic-stability" },
    { antiPatternId: "ap:bridge-drift", axiomId: "axiom:A7-semantic-stability" },
    { antiPatternId: "ap:manual-analysis-bypass", axiomId: "axiom:A8-adaptive-pressure" },
    { antiPatternId: "ap:fixed-dampening", axiomId: "axiom:A1-fidelity" },
    { antiPatternId: "ap:bare-number-health", axiomId: "axiom:A3-transparency" },
    { antiPatternId: "ap:static-retention", axiomId: "axiom:A8-adaptive-pressure" },
    { antiPatternId: "ap:fixed-circuit-breaker", axiomId: "axiom:A1-fidelity" },
  ];
}

// ── Graph write helpers ─────────────────────────────────────────────────────

async function createGrammarRefBloom(): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (b:Bloom {id: $id})
       ON CREATE SET
         b.name = $name,
         b.type = "grammar-reference",
         b.specVersion = "v4.3",
         b.description = $description,
         b.createdAt = datetime()
       ON MATCH SET
         b.name = $name,
         b.specVersion = "v4.3",
         b.description = $description,
         b.updatedAt = datetime()`,
      {
        id: GRAMMAR_REF_ID,
        name: "Grammar Reference v4.3",
        description: "Canonical bill of materials for the Codex Signum grammar",
      },
    );
  });
}

async function createCategoryBloom(cat: CategoryData): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (b:Bloom {id: $id})
       ON CREATE SET
         b.name = $name,
         b.type = "grammar-category",
         b.elementCount = $elementCount,
         b.createdAt = datetime()
       ON MATCH SET
         b.name = $name,
         b.elementCount = $elementCount,
         b.updatedAt = datetime()`,
      {
        id: cat.id,
        name: cat.name,
        elementCount: cat.elements.length,
      },
    );
  });
}

async function createElementSeed(el: GrammarElement): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MERGE (s:Seed {id: $id})
       ON CREATE SET
         s.seedType = $seedType,
         s.name = $name,
         s.description = $description,
         s.specSource = $specSource,
         s.implementationStatus = $implementationStatus,
         s.implementationNotes = $implementationNotes,
         s.codeLocation = $codeLocation,
         s.createdAt = datetime()
       ON MATCH SET
         s.name = $name,
         s.description = $description,
         s.specSource = $specSource,
         s.implementationStatus = $implementationStatus,
         s.implementationNotes = $implementationNotes,
         s.codeLocation = $codeLocation,
         s.updatedAt = datetime()`,
      {
        id: el.id,
        seedType: el.seedType,
        name: el.name,
        description: el.description,
        specSource: el.specSource,
        implementationStatus: el.implementationStatus,
        implementationNotes: el.implementationNotes,
        codeLocation: el.codeLocation ?? null,
      },
    );
  });
}

async function createContainsRel(parentId: string, childId: string): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (parent:Bloom {id: $parentId})
       MATCH (child {id: $childId})
       WHERE child:Bloom OR child:Seed
       MERGE (parent)-[:${RELATIONSHIP_TYPES.CONTAINS}]->(child)`,
      { parentId, childId },
    );
  });
}

async function createDependsOnRel(fromId: string, toId: string): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (a:Seed {id: $fromId})
       MATCH (b:Seed {id: $toId})
       MERGE (a)-[:${RELATIONSHIP_TYPES.DEPENDS_ON}]->(b)`,
      { fromId, toId },
    );
  });
}

async function createViolatesRel(antiPatternId: string, axiomId: string): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (ap:Seed {id: $antiPatternId})
       MATCH (ax:Seed {id: $axiomId})
       MERGE (ap)-[:${RELATIONSHIP_TYPES.VIOLATES}]->(ax)`,
      { antiPatternId, axiomId },
    );
  });
}

async function createScopedToRel(fromId: string, milestoneId: string): Promise<void> {
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
  console.log("📖 M-9.7a Grammar Reference Bootstrap — Bill of Materials in Graph\n");

  // Ensure schema is up to date
  const schema = await migrateSchema();
  if (schema.errors.length > 0) {
    console.error("Schema errors:", schema.errors);
  }
  console.log(`Schema: ${schema.applied} statements applied\n`);

  const categories = getCategories();
  let totalSeeds = 0;

  // 1. Create grammar reference Bloom
  await createGrammarRefBloom();
  console.log(`✅ Grammar Reference Bloom: ${GRAMMAR_REF_ID}`);

  // 2. Create category Blooms + element Seeds
  for (const cat of categories) {
    await createCategoryBloom(cat);
    for (const el of cat.elements) {
      try {
        await createElementSeed(el);
      } catch (err) {
        console.warn(`  ⚠ Failed to create Seed ${el.id}:`, err);
      }
    }
    totalSeeds += cat.elements.length;
    console.log(`✅ Category: ${cat.name} (${cat.elements.length} elements)`);
  }

  // 3. CONTAINS: grammar-ref → categories
  for (const cat of categories) {
    await createContainsRel(GRAMMAR_REF_ID, cat.id);
  }
  console.log(`✅ CONTAINS: ${GRAMMAR_REF_ID} → ${categories.length} categories`);

  // 4. CONTAINS: category → elements
  let containsCount = categories.length; // from step 3
  for (const cat of categories) {
    for (const el of cat.elements) {
      try {
        await createContainsRel(cat.id, el.id);
        containsCount++;
      } catch (err) {
        console.warn(`  ⚠ Failed CONTAINS ${cat.id} → ${el.id}:`, err);
      }
    }
  }
  console.log(`✅ CONTAINS: categories → ${totalSeeds} element Seeds`);

  // 5. DEPENDS_ON: axiom DAG
  const deps = getAxiomDependencies();
  for (const dep of deps) {
    try {
      await createDependsOnRel(dep.from, dep.to);
    } catch (err) {
      console.warn(`  ⚠ Failed DEPENDS_ON ${dep.from} → ${dep.to}:`, err);
    }
  }
  console.log(`✅ DEPENDS_ON: ${deps.length} axiom dependencies`);

  // 6. VIOLATES: anti-patterns → axioms
  const violations = getAntiPatternViolations();
  for (const v of violations) {
    try {
      await createViolatesRel(v.antiPatternId, v.axiomId);
    } catch (err) {
      console.warn(`  ⚠ Failed VIOLATES ${v.antiPatternId} → ${v.axiomId}:`, err);
    }
  }
  console.log(`✅ VIOLATES: ${violations.length} anti-pattern → axiom mappings`);

  // 7. SCOPED_TO: grammar-ref → M-9.7a milestone (if exists)
  try {
    await createScopedToRel(GRAMMAR_REF_ID, "M-9.7a");
    console.log(`✅ SCOPED_TO: ${GRAMMAR_REF_ID} → M-9.7a`);
  } catch (err) {
    console.warn("  ⚠ M-9.7a milestone Bloom not found in graph (SCOPED_TO skipped)");
  }

  // Summary
  console.log("\n── Summary ──");
  console.log(`  Bloom nodes: ${1 + categories.length} (1 grammar-ref + ${categories.length} categories)`);
  console.log(`  Seed nodes: ${totalSeeds}`);
  console.log(`  CONTAINS relationships: ${containsCount}`);
  console.log(`  DEPENDS_ON relationships: ${deps.length}`);
  console.log(`  VIOLATES relationships: ${violations.length}`);
  console.log(`  SCOPED_TO relationships: 1 (to M-9.7a)`);
  console.log(`\nDone. Verify with:`);
  console.log(`  MATCH (ref:Bloom {type: 'grammar-reference'})-[:CONTAINS]->(cat:Bloom)-[:CONTAINS]->(s:Seed) RETURN cat.id, count(s) ORDER BY cat.id`);
  console.log(`  MATCH (a:Seed {seedType: 'axiom'})-[:DEPENDS_ON]->(b:Seed) RETURN a.id, b.id`);
  console.log(`  MATCH (ap:Seed {seedType: 'anti-pattern'})-[:VIOLATES]->(ax:Seed) RETURN ap.name, ax.name`);
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
  getCategories,
  getAxiomDependencies,
  getAntiPatternViolations,
  GRAMMAR_REF_ID,
  createGrammarRefBloom,
  createCategoryBloom,
  createElementSeed,
  createContainsRel,
  createDependsOnRel,
  createViolatesRel,
  createScopedToRel,
};
export type { GrammarElement, CategoryData };
