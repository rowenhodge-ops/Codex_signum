/**
 * Update the roadmap graph to reflect v8 changes using ONLY the Instantiation Protocol.
 *
 * Phase C of M-16 Constitutional Bloom:
 * - Updates M-16 (rescoped) and M-17 (rescoped) via updateMorpheme()
 * - Creates M-16.1–M-16.6 and M-17.1–M-17.6 sub-milestones via instantiateMorpheme()
 * - Creates R-46–R-57 requirement Seeds via instantiateMorpheme()
 * - Wires INSTANTIATES for all existing M-16/M-17 nodes
 * - Wires doc Seeds for new specifications
 *
 * NO RAW CYPHER. All writes through the governance Resonators.
 *
 * @see docs/roadmap/codex-signum-roadmap-v8.md
 */

import {
  instantiateMorpheme,
  updateMorpheme,
  createLine,
} from "../src/graph/instantiation.js";
import type { MorphemeType, LineType } from "../src/graph/instantiation.js";
import { closeDriver } from "../src/graph/client.js";
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

// ─── Helpers ────────────────────────────────────────────────────────

async function ensureMorpheme(
  type: MorphemeType,
  props: Record<string, unknown>,
  parentId: string,
): Promise<void> {
  const result = await instantiateMorpheme(type, props, parentId);
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
  console.log(`  ✓ updated ${nodeId}`);
}

// ─── Step 1: Rescope M-16 ──────────────────────────────────────────

async function rescopeM16() {
  console.log("\n═══ Step 1: Rescope M-16 ═══\n");

  await updateNode("M-16", {
    name: "Constitutional Bloom Establishment + Fabric",
    content:
      "v5.0 is canonised. The Morpheme Identity Map identifies the correct typings. " +
      "The Concurrent Pattern Topology defines the execution model. Now the graph needs " +
      "the organisational core — the Constitutional Bloom that every instance connects to " +
      "via INSTANTIATES. Includes morpheme retyping, creation layer enforcement, and " +
      "codebase rename to v5.0 terminology.",
    status: "active",
    description:
      "Constitutional Bloom establishment + morpheme retyping + INSTANTIATES wiring + creation layer enforcement",
  });
}

// ─── Step 2: Create M-16.1–M-16.6 sub-milestones ───────────────────

async function createM16SubMilestones() {
  console.log("\n═══ Step 2: M-16 Sub-Milestones ═══\n");

  // M-16.1: Constitutional Bloom creation (COMPLETE — Phase A)
  await ensureMorpheme(
    "bloom",
    {
      id: "M-16.1",
      name: "Constitutional Bloom Creation",
      type: "sub-milestone",
      status: "complete",
      content:
        "Constitutional Bloom creation — morpheme definitions, axioms, grammar rules, " +
        "imperatives, state dimensions, anti-patterns, escalation trajectories. " +
        "Pure mechanical graph mutation from v5.0 §Constitutional Coupling. " +
        "1 Bloom + 41 Seeds + 3 Resonators + 3 Grids = 48 morpheme instances.",
      phiL: 0.9,
      completedAt: new Date().toISOString(),
    },
    "M-16",
  );

  // M-16.2 already exists with old scope — update it
  await updateNode("M-16.2", {
    name: "INSTANTIATES Wiring",
    content:
      "Every existing node gets an INSTANTIATES Line to its definition in the Constitutional Bloom. " +
      "Makes Line conductivity Layer 1 (morpheme hygiene) enforceable.",
    status: "planned",
    description:
      "INSTANTIATES wiring — every node connects to Constitutional Bloom",
  });

  // M-16.3 already exists with old scope — update it
  await updateNode("M-16.3", {
    name: "Morpheme Retyping",
    content:
      "Per Morpheme Identity Map v1.0: Agent→Resonator, PipelineRun→Bloom, " +
      "Decision→Seed, Observation→Seed. Update all query functions and TypeScript interfaces.",
    status: "planned",
    description:
      "Morpheme retyping per Identity Map: Agent→Resonator, PipelineRun→Bloom",
  });

  // M-16.4 already exists with old scope — update it
  await updateNode("M-16.4", {
    name: "Creation Layer Enforcement",
    content:
      "Every createContained* function atomically creates the INSTANTIATES Line. " +
      "New createContainedResonator function. After this, creating a morpheme without " +
      "connecting it to the constitution becomes structurally impossible. " +
      "Three governance Resonators enforce all writes: Instantiation, Mutation, Line Creation.",
    status: "complete",
    phiL: 0.9,
    completedAt: new Date().toISOString(),
  });

  // M-16.5: Codebase rename (new)
  await ensureMorpheme(
    "bloom",
    {
      id: "M-16.5",
      name: "Codebase Rename — Correction→Refinement",
      type: "sub-milestone",
      status: "planned",
      content:
        "Correction→Refinement in types, tests, docs, CLAUDE.md. ~30 references. " +
        "v5.0 renamed Correction to Refinement throughout.",
    },
    "M-16",
  );

  // M-16.6: Governance docs update (new)
  await ensureMorpheme(
    "bloom",
    {
      id: "M-16.6",
      name: "Governance Docs Update",
      type: "sub-milestone",
      status: "planned",
      content:
        "CLAUDE.md: 8 axioms, v5.0 refs, Refinement terminology, updated anti-pattern table. " +
        "ELIMINATED_ENTITIES: add 'Correction' as eliminated term.",
    },
    "M-16",
  );
}

// ─── Step 3: Rescope M-17 + create sub-milestones ───────────────────

async function rescopeM17() {
  console.log("\n═══ Step 3: Rescope M-17 + Sub-Milestones ═══\n");

  await updateNode("M-17", {
    name: "Engineering Bridge v3.0",
    content:
      "The Engineering Bridge is stale (v2.0 predates v5.0). Three formulas identified as " +
      "incorrect in M-8A. v5.0 moved superposition mechanics here. Line conductivity needs " +
      "implementation detail. Signal conditioning stages need morpheme grounding. " +
      "Build experience from 6 months not captured.",
    status: "planned",
    description:
      "Engineering Bridge v3.0: Line conductivity, superposition, event-driven model, deferred computations",
  });

  // M-17.1: Stale formula audit
  await ensureMorpheme(
    "bloom",
    {
      id: "M-17.1",
      name: "Stale Formula Audit + v5.0 Absorption",
      type: "sub-milestone",
      status: "planned",
      content:
        "Review all Bridge formulas against v5.0 and implementation. Fix 3 known stale formulas. " +
        "Absorb v5.0 concepts not in Bridge v2.0: Line conductivity, Remedy Archive mechanics, " +
        "dimensional profiles, Refinement terminology. Apply Bridge View Principle.",
    },
    "M-17",
  );

  // M-17.2: Bridge View Principle
  await ensureMorpheme(
    "bloom",
    {
      id: "M-17.2",
      name: "Bridge View Principle Codification",
      type: "sub-milestone",
      status: "planned",
      content:
        "Every Engineering Bridge formula MUST be expressible as a pure function of grammar-defined " +
        "morpheme states and axiom-defined parameters. No Bridge formula may introduce state, " +
        "thresholds, entities, or temporal behavior not grounded in the symbolic grammar. " +
        "Discovered during M-8A t15. Highest-value single architectural constraint.",
    },
    "M-17",
  );

  // M-17.3: Line conductivity
  await ensureMorpheme(
    "bloom",
    {
      id: "M-17.3",
      name: "Line Conductivity Implementation Detail",
      type: "sub-milestone",
      status: "planned",
      content:
        "v5.0 defines the three-layer circuit model conceptually. Bridge must specify: " +
        "how each layer evaluates in Neo4j (Cypher patterns for hygiene check, shape validation, " +
        "friction computation), TypeScript interfaces for conductivity results, caching strategy " +
        "(re-evaluate on endpoint property change), invalidation triggers.",
    },
    "M-17",
  );

  // M-17.4: Superposition mechanics
  await ensureMorpheme(
    "bloom",
    {
      id: "M-17.4",
      name: "Superposition Operational Mechanics",
      type: "sub-milestone",
      status: "planned",
      content:
        "Instance creation lifecycle, concurrent execution governance per instance, " +
        "collapse Resonator mechanics (selection vs racing vs synthesis), non-selected output " +
        "persistence as Stratum 2 records, interaction with Thompson sampling posteriors.",
    },
    "M-17",
  );

  // M-17.5: Event-driven execution model
  await ensureMorpheme(
    "bloom",
    {
      id: "M-17.5",
      name: "Event-Driven Execution Model",
      type: "sub-milestone",
      status: "planned",
      content:
        "TypeScript event handler architecture for Resonator activation on graph events, " +
        "Neo4j write sequencing (atomic per-Resonator transactions), concurrency management, " +
        "how the orchestrator dissolves into data dependency resolution. " +
        "From Concurrent Pattern Topology v3.",
    },
    "M-17",
  );

  // M-17.6: Build experience + deferred computations
  await ensureMorpheme(
    "bloom",
    {
      id: "M-17.6",
      name: "Build Experience Addendum + Deferred Computations",
      type: "sub-milestone",
      status: "planned",
      content:
        "Document build experience: Thompson informed priors, context-blocked posteriors, " +
        "exploration decay, hallucination detection, governance files. Plus deferred computation " +
        "details: ΨH temporal decomposition, εR spectral calibration, signal conditioning " +
        "stage parameters. This is where the State Dimension Gap gets addressed.",
    },
    "M-17",
  );
}

// ─── Step 4: Create R-46–R-57 requirement Seeds ────────────────────

async function createRequirements() {
  console.log("\n═══ Step 4: R-46–R-57 Requirement Seeds ═══\n");

  const requirements: Array<{
    id: string;
    name: string;
    content: string;
    target: string;
    status: string;
  }> = [
    {
      id: "R-46",
      name: "Constitutional Bloom creation",
      content:
        "Constitutional Bloom creation — organisational core in Neo4j with morpheme definitions, " +
        "axioms, grammar rules, imperatives, state dimensions, anti-patterns, escalation trajectories.",
      target: "M-16.1",
      status: "complete",
    },
    {
      id: "R-47",
      name: "INSTANTIATES wiring",
      content:
        "Every existing node gets an INSTANTIATES Line to its definition in the Constitutional Bloom. " +
        "Source: v5.0 §Constitutional Coupling.",
      target: "M-16.2",
      status: "planned",
    },
    {
      id: "R-48",
      name: "Agent→Resonator retyping",
      content:
        "Agent→Resonator retyping — LLMs are transformers (Resonators), not data (Seeds). " +
        "Source: Morpheme Identity Map v1.0.",
      target: "M-16.3",
      status: "planned",
    },
    {
      id: "R-49",
      name: "PipelineRun→Bloom retyping",
      content:
        "PipelineRun→Bloom retyping — pipeline executions are scope boundaries (Blooms), " +
        "not data Seeds. Source: Morpheme Identity Map v1.0.",
      target: "M-16.3",
      status: "planned",
    },
    {
      id: "R-50",
      name: "Creation layer enforcement",
      content:
        "Atomic INSTANTIATES in every creation function. All graph writes flow through governance " +
        "Resonators. No raw Cypher after Phase B. Source: v5.0 + Identity Map.",
      target: "M-16.4",
      status: "complete",
    },
    {
      id: "R-51",
      name: "Correction→Refinement codebase rename",
      content:
        "Correction→Refinement in types, tests, docs, CLAUDE.md. ~30 references. " +
        "Source: v5.0 terminology change.",
      target: "M-16.5",
      status: "planned",
    },
    {
      id: "R-52",
      name: "Architect pattern design revision",
      content:
        "Architect pattern design revision: v3.0→v5.0 spec refs, concurrent execution model, " +
        "morpheme identity corrections. Source: Concurrent Pattern Topology v3.",
      target: "M-16",
      status: "planned",
    },
    {
      id: "R-53",
      name: "DevAgent pattern design revision",
      content:
        "DevAgent pattern design revision: v5.0 spec refs, concurrent execution model alignment. " +
        "Source: Concurrent Pattern Topology v3.",
      target: "M-16",
      status: "planned",
    },
    {
      id: "R-54",
      name: "Line conductivity implementation specification",
      content:
        "Three-layer evaluation in Neo4j/TypeScript: morpheme hygiene, grammatical shape, " +
        "contextual fitness. Caching and invalidation strategy. Source: v5.0 §Line Conductivity.",
      target: "M-17.3",
      status: "planned",
    },
    {
      id: "R-55",
      name: "Superposition operational mechanics",
      content:
        "Instance lifecycle, collapse Resonator mechanics, non-selected output persistence, " +
        "Thompson posterior interaction. Source: v5.0 §Superposition (moved from spec to Bridge).",
      target: "M-17.4",
      status: "planned",
    },
    {
      id: "R-56",
      name: "Event-driven execution model specification",
      content:
        "TypeScript event handlers, Neo4j write sequencing, concurrency management. " +
        "Source: Concurrent Pattern Topology v3.",
      target: "M-17.5",
      status: "planned",
    },
    {
      id: "R-57",
      name: "R-39 live migration",
      content:
        "Run migrate-seed-content.ts against live Neo4j to apply R-39 structural enforcement " +
        "(content required on all Seeds). Source: M-9.8 prep.",
      target: "M-16",
      status: "planned",
    },
  ];

  // Create each requirement as a Seed contained by the roadmap Bloom
  for (const req of requirements) {
    await ensureMorpheme(
      "seed",
      {
        id: req.id,
        name: req.name,
        seedType: "requirement",
        content: req.content,
        status: req.status,
        target: req.target,
      },
      "roadmap-v7",
    );

    // Wire SCOPED_TO the target milestone
    await ensureLine(req.id, req.target, "SCOPED_TO");
  }
}

// ─── Step 5: Wire INSTANTIATES for existing M-16/M-17 nodes ────────

async function wireInstantiates() {
  console.log("\n═══ Step 5: INSTANTIATES Wiring ═══\n");

  // Blooms → def:morpheme:bloom
  const blooms = [
    "M-16",
    "M-16.2",
    "M-16.3",
    "M-16.4",
    "M-17",
    "roadmap-v7",
  ];
  for (const id of blooms) {
    await ensureLine(id, "def:morpheme:bloom", "INSTANTIATES");
  }

  // Seeds → def:morpheme:seed
  const seeds = [
    "M-16:ec-1",
    "M-16:ec-2",
    "M-16:ec-3",
    "M-16:ec-4",
    "M-17:ec-1",
    "M-17:ec-2",
    "M-17:ec-3",
    "M-17:ec-4",
  ];
  for (const id of seeds) {
    await ensureLine(id, "def:morpheme:seed", "INSTANTIATES");
  }
}

// ─── Step 6: Wire DEPENDS_ON between milestones ────────────────────

async function wireDependencies() {
  console.log("\n═══ Step 6: DEPENDS_ON Wiring ═══\n");

  // M-16 DEPENDS_ON M-17 (M-16 must complete before M-17 can begin)
  await ensureLine("M-16", "M-17", "DEPENDS_ON");

  // M-16.1 is prerequisite for M-16.4 (need Constitutional Bloom before creation layer)
  await ensureLine("M-16.1", "M-16.4", "DEPENDS_ON");

  // M-16.4 is prerequisite for M-16.2 (need creation layer before wiring all nodes)
  await ensureLine("M-16.4", "M-16.2", "DEPENDS_ON");
}

// ─── Step 7: Create doc Seeds ──────────────────────────────────────

async function createDocSeeds() {
  console.log("\n═══ Step 7: Doc Seeds ═══\n");

  // v5.0 spec canonisation
  await ensureMorpheme(
    "seed",
    {
      id: "doc:cs-v5.0",
      name: "Codex Signum v5.0 Specification",
      seedType: "document",
      content:
        "Canonical Codex Signum specification v5.0. Introduces Line Conductivity, " +
        "Remedy Archive, Dimensional Profiles. Removes A5 (Reversibility). " +
        "Renames Correction→Refinement. Eliminates Ontology section. " +
        "Canonised at commit e1f6d88.",
      status: "active",
      commitSha: "e1f6d88",
    },
    "constitutional-bloom",
  );

  // Morpheme Identity Map
  await ensureMorpheme(
    "seed",
    {
      id: "doc:morpheme-identity-map",
      name: "Morpheme Identity Map v1.0",
      seedType: "document",
      content:
        "Maps domain concepts to morpheme types via dimensional channel test. " +
        "Identifies mistypings: Agent→Resonator, PipelineRun→Bloom. " +
        "Valid containment rules table. Canonised at commit 524b25be.",
      status: "active",
      commitSha: "524b25b",
    },
    "constitutional-bloom",
  );

  // Instantiation design doc
  await ensureMorpheme(
    "seed",
    {
      id: "doc:instantiation-resonator-design",
      name: "Instantiation + Mutation Resonator Design",
      seedType: "document",
      content:
        "Design specification for the three governance Resonators: Instantiation, Mutation, " +
        "and Line Creation. ALL morpheme creation and modification flows through exactly three " +
        "Resonators. No exceptions. No backdoors. The structure enforces itself.",
      status: "active",
    },
    "constitutional-bloom",
  );
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  Phase C: Update Roadmap Graph via Instantiation Protocol ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  try {
    await rescopeM16();
    await createM16SubMilestones();
    await rescopeM17();
    await createRequirements();
    await wireInstantiates();
    await wireDependencies();
    await createDocSeeds();

    console.log("\n═══ Phase C Complete ═══\n");
    console.log("All roadmap graph updates written through governance Resonators.");
    console.log("No raw Cypher used. Every write is observed and provenance-traced.");
  } catch (err) {
    console.error("\n✗ Phase C failed:", err);
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

main();
