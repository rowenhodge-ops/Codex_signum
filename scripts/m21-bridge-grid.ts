/**
 * M-21: Bridge Grid Instantiation
 *
 * Instantiates Engineering Bridge v3.0 as a Grid of spec Seeds in Neo4j.
 * Each Part/section = one Seed. Cross-references = REFERENCES Lines.
 *
 * [NO-PIPELINE] — mechanical graph mutation.
 * All writes via instantiateMorpheme() and createLine(). MERGE-based, idempotent.
 *
 * Usage:
 *   npx tsx scripts/m21-bridge-grid.ts
 */

import path from "path";
import fs from "fs";
import { readTransaction, writeTransaction } from "../src/graph/client.js";
import {
  instantiateMorpheme,
  createLine,
} from "../src/graph/instantiation.js";
import type { HighlanderOptions } from "../src/graph/instantiation.js";
import { closeDriver } from "../src/graph/client.js";

const MILESTONE_HIGHLANDER: HighlanderOptions = {
  transformationDefId: "def:bloom:milestone",
  a6Justification: "distinct_governance_scope",
};

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

async function findTopLevelBloom(): Promise<string | null> {
  // Look for known top-level Bloom candidates
  const candidates = [
    "bloom:codex-signum",
    "constitutional-bloom",
    "bloom:project-root",
  ];
  for (const id of candidates) {
    if (await nodeExists(id)) return id;
  }
  // Fall back: any Bloom with no parent Bloom
  const result = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (b:Bloom)
      WHERE NOT ()-[:CONTAINS]->(b)
      RETURN b.id AS id LIMIT 1
    `);
    return res.records[0]?.get("id") as string | undefined;
  });
  return result ?? null;
}

// ─── Phase 0: Idempotency check ─────────────────────────────────────

async function phase0(): Promise<boolean> {
  console.log("\n═══ Phase 0: Idempotency Check ═══\n");
  const exists = await nodeExists("grid:bridge-v3");
  if (exists) {
    console.log("  Grid 'grid:bridge-v3' already exists. Script is idempotent — continuing to verify/update.");
    return true;
  }
  console.log("  Grid does not exist. Proceeding with creation.");
  return false;
}

// ─── Phase 1: Bridge Grid ────────────────────────────────────────────

async function phase1(parentBloomId: string): Promise<void> {
  console.log("\n═══ Phase 1: Bridge Grid ═══\n");

  const result = await instantiateMorpheme(
    "grid",
    {
      id: "grid:bridge-v3",
      name: "Engineering Bridge v3.0 Grid",
      content:
        "Queryable graph representation of the Engineering Bridge v3.0 specification. Each section is a Seed. Cross-references between sections are Lines. Enables SPECIFIED_BY Lines from implementations to spec sections and parameter lookup by Resonators.",
      type: "spec-grid",
      status: "active",
      version: "3.0",
      sourceDocument: "docs/specs/codex-signum-engineering-bridge-v3_0.md",
      sourceSha: "72afa5e278563abf64e9e1f031937a99bf2463d5",
      companionSpec: "v5.0 (e1f6d88)",
    },
    parentBloomId,
  );

  if (result.success) {
    ok(`Grid 'grid:bridge-v3' (parent: ${parentBloomId})`);
  } else {
    fail("Grid creation", result.error ?? "unknown");
  }
}

// ─── Phase 2: Spec Seeds ─────────────────────────────────────────────

interface SeedDef {
  id: string;
  name: string;
  content: string;
  bridgePart: string;
  bridgeSection?: string;
}

const SEEDS: SeedDef[] = [
  {
    id: "spec:bridge:foundational-principle",
    name: "Part 1: Foundational Principle — State Is Structural",
    content:
      "The graph database is the single source of truth for both component relationships and component health. No separate health databases, monitoring tables, or status caches. The advantage is perceptual (pre-attentive parallel processing), not information-theoretic (Shannon entropy is representation-agnostic). Full-precision backing stores alongside visual encoding.",
    bridgePart: "1",
  },
  {
    id: "spec:bridge:bridge-view-principle",
    name: "Bridge View Principle",
    content:
      "Every Bridge formula MUST be a pure function of grammar-defined morpheme states and axiom-defined parameters. No formula may introduce state, thresholds, entities, or temporal behaviour not grounded in the symbolic grammar. Audit criterion: f(morpheme_states, axiom_parameters, topology) → result. Discovered in M-8A t15; resolved nine recommendations.",
    bridgePart: "1.1",
  },
  {
    id: "spec:bridge:phi-l",
    name: "Part 2: ΦL — Health Score",
    content:
      "Four-factor weighted composite (0.0–1.0): axiom_compliance (w₁=0.4), provenance_clarity (w₂=0.2), usage_success_rate (w₃=0.2), temporal_stability (w₄=0.2). Adjusted by maturity modifier: (1-e^(-k₁×obs))×(1-e^(-k₂×conn)). Recency weighting: e^(-λ×age). Topology-dependent sliding windows (10–20 leaf, 30–50 mid, 50–100 root). Maturity-indexed adaptive thresholds.",
    bridgePart: "2",
  },
  {
    id: "spec:bridge:psi-h",
    name: "Part 2: ΨH — Harmonic Signature (Two-Component)",
    content:
      "Two-component metric: structural coherence (λ₂ from graph Laplacian) weighted 0.4, runtime friction (TV_G = Σ aᵢⱼ×(xᵢ-xⱼ)²) weighted 0.6. Composite: ΨH = 0.4×normalize(λ₂) + 0.6×(1-friction). Key diagnostic: high λ₂ + high friction = components should work together but operationally don't. Pre-composition resonance check on proposed subgraph λ₂.",
    bridgePart: "2",
  },
  {
    id: "spec:bridge:psi-h-temporal",
    name: "Part 2: ΨH Temporal Decomposition",
    content:
      "Separates transient operational friction from durable structural misalignment. Implementation: three components — psiH_trend (EWMA, α=0.15), friction_transient (|instant-trend|), friction_durable (|trend-baseline|). Spec target: four dimensions — frequency, duration, intensity, scope of resonant episodes. Baseline after 5 observations. Ring buffer state management.",
    bridgePart: "2",
  },
  {
    id: "spec:bridge:psi-h-hypothetical",
    name: "Part 2: ΨH Hypothetical State (Projectable)",
    content:
      "ΨH is projectable — computable against proposed states. computePsiH() accepts arbitrary edges and nodeHealths arrays. Implementation status: partial — computation infrastructure exists but no dedicated hypothetical API. Missing: ergonomic function taking current graph + proposed mutations → projected ΨH.",
    bridgePart: "2",
  },
  {
    id: "spec:bridge:epsilon-r",
    name: "Part 2: εR — Exploration Rate",
    content:
      "εR = exploratory_decisions / total_decisions over rolling window. High ΦL with zero εR is a warning. Floor from imperative gradient modulation: base_εR + (gradient_sensitivity × max(0, -Ω_gradient)). Spectral calibration complement: min_εR mapped from spectral ratio (>0.9→0.05, 0.7-0.9→0.02, 0.5-0.7→0.01, <0.5→0.0). Floor always wins over decay.",
    bridgePart: "2",
  },
  {
    id: "spec:bridge:composition-epsilon-r",
    name: "Part 2: Composition-Scope εR",
    content:
      "εR aggregated at Bloom scope: exploratory/total decisions within containment. Triggers structural review when above maturity-indexed bound (Young 0.40, Maturing 0.30, Mature 0.15). Propagates upward via simple averaging (no dampening — εR is observation rate, not health signal). Weighted variant available for mature deployments.",
    bridgePart: "2",
  },
  {
    id: "spec:bridge:dimensional-profiles",
    name: "Part 2: Dimensional Profiles — Partitioned ΦL",
    content:
      "Composite ΦL decomposed by task classification tag on observation Seeds (e.g. ΦL_code, ΦL_reasoning). Same four-factor formula on filtered partition. Ephemeral computation (query, not stored). Thompson router reads dimensional profiles for task-specific selection. Profiles feed Line conductivity Layer 3 contextual fitness.",
    bridgePart: "2",
  },
  {
    id: "spec:bridge:degradation-cascade",
    name: "Part 3: Degradation Cascade — CONTAINS Line Properties",
    content:
      "All cascade mechanics are CONTAINS Line properties. Attenuation: γ_effective = min(γ_base=0.7, safety_budget=0.8/k). Guarantees spectral radius μ ≤ 0.8 < 1 for all k ≥ 1. Depth limit: 2 levels (non-negotiable primary safety mechanism). Asymmetric rate: recovery at γ/2.5. Algedonic bypass: γ→1.0 when child ΦL < 0.1. Recovery: linear delay with cap, exponential backoff with full jitter for retries, half-open state for recovery probes.",
    bridgePart: "3",
  },
  {
    id: "spec:bridge:line-conductivity",
    name: "Line Conductivity — Three-Layer Circuit Model",
    content:
      "Determines whether signals flow before conditioning. Layer 1 (morpheme hygiene): binary — content non-empty, status present, phiL present, INSTANTIATES intact. Layer 2 (grammatical shape): binary — connection type valid for both endpoint morpheme types per G2/G3/G4. Layer 3 (contextual fitness): continuous friction = 1 - min(ΦL_source[task], ΦL_target[task]). Cached on Line, invalidated on endpoint property change or new observation.",
    bridgePart: "3.5",
  },
  {
    id: "spec:bridge:governance-resonators",
    name: "Governance Resonators — Instantiation, Mutation, Line Creation",
    content:
      "Three Resonators as siblings within the Constitutional Bloom, each with own observation Grid. Instantiation: validates content, required properties, containment legality; creates node + INSTANTIATES + CONTAINS atomically. Mutation: validates property preservation, auto-propagates parent status. Line Creation: evaluates conductivity at write time (Layers 1-2 must pass). ALL graph writes route through these three. Structural fix for Compliance-as-Monitoring anti-pattern.",
    bridgePart: "3.6",
  },
  {
    id: "spec:bridge:superposition",
    name: "Superposition Operational Mechanics",
    content:
      "Six subsections: S.1 grammar fact (multiple instances permitted), S.2 instance creation (separate Bloom per instance with own governance morphemes, bounded by εR budget), S.3 concurrent governance (independent evaluation per instance), S.4 collapse mechanics (three modes: Selection/Racing/Synthesis with distinct ΦL semantics), S.5 persistence (instances → Stratum 2, non-selected outputs feed Scale 2 learning), S.6 interaction with existing mechanisms (conductivity, governance Resonators, cascade, profiles, remedy, conditioning, structural review, Thompson).",
    bridgePart: "4",
  },
  {
    id: "spec:bridge:event-driven",
    name: "Event-Driven Execution Model",
    content:
      "Five subsections: E.1 orchestrator dissolves (hybridAgent.ts is Intermediary Layer anti-pattern; topology replaces orchestration), E.2 Resonator activation contract (activates when ALL input Lines carry data), E.3 Neo4j write sequencing (atomic per-Resonator transactions, not per-pipeline), E.4 concurrency (READ COMMITTED for append-only writes, SERIALIZABLE for property mutations), E.5 migration path (4 stages from batch write to full concurrent model).",
    bridgePart: "4.5",
  },
  {
    id: "spec:bridge:signal-conditioning",
    name: "Part 4: Signal Conditioning — Seven Resonators within a Bloom",
    content:
      "Seven named Resonators within a Signal Conditioning Bloom: Debounce (100ms), Hampel (MAD outlier rejection, k=3), EWMA (α=0.25 leaf/0.15 default/0.08 hub), CUSUM (mean shift, h≈4-5), MACD (rate-of-change, fast α=0.25 minus slow α=0.04), Hysteresis (band ≥ 2×V_pp), Trend (linear fit 30-50 events). Each has own ΦL and observation Grid. Hampel is cross-run only. Early warning: variance increase, autocorrelation increase, cross-component correlation rise.",
    bridgePart: "4",
  },
  {
    id: "spec:bridge:visual-encoding",
    name: "Part 5: Visual Encoding Constraints",
    content:
      "Six visual channels from two computations: state dimensions (ΦL→brightness, εR→saturation, activity→pulsation freq) and eigendecomposition (harmonic profile→hue, v₂→pulsation phase, v₂/v₃/v₄→spatial position). SAFETY CRITICAL: pulsation 0.5-3 Hz only (8-15 Hz = epilepsy risk). Saturation ceiling εR/0.3. Phase from normalize(v₂)×2π. Working memory 3-4 objects (not Miller 7±2). Morpheme shape derivation: Resonator from I/O ratio, Grid from internal topology, Helix from iteration behaviour, Bloom from interface Line count.",
    bridgePart: "5",
  },
  {
    id: "spec:bridge:cas-watchpoints",
    name: "Part 6: Seven CAS Vulnerability Watchpoints",
    content:
      "Seven architectural vulnerabilities with structural defences and limitations: (1) Emergence — Structural Review Resonator; limited to known signatures. (2) Cascading failures — dampening formula + depth limit + algedonic bypass; black swan gap. (3) Co-evolution — ΨH temporal decomposition; slow drift gap. (4) Lock-in — εR floor; ecosystem-level convergence gap. (5) Parasitic patterns — Threat Archive + Ω gradient inversion; novel topology gap. (6) Inadequate measurement — Structural Signatures + Line hygiene; self-referential gap. (7) Environmental shift — dimensional profiles + εR spike; requires measurable dimensions.",
    bridgePart: "6",
  },
  {
    id: "spec:bridge:memory-strata",
    name: "Part 7: Memory Strata as Morpheme Compositions",
    content:
      "Memory operations ARE morpheme operations. Recency weighting = Line property (e^(-λ×age)). Compaction = Resonator operation (sever Lines when weight < 0.01, routes through Mutation Resonator). Distillation = Resonator between Grids (Stratum 2→3 lossy compression, own ΦL from prediction accuracy). Contextual enrichment = downward Lines from Stratum 3/4 to Stratum 1/2. Sizing: ~78MB for 100 active components. Stratum 2 bounded by compaction window.",
    bridgePart: "7",
  },
  {
    id: "spec:bridge:immune-memory-repair",
    name: "Part 7: Immune Memory Repair — Remedy Archive",
    content:
      "Remedy Archive Grid in Stratum 3 alongside Threat Archive. Contains compensatory pattern Seeds (friction profile + morpheme configuration + confidence). Remedy Matching Resonator reads friction profiles from Lines exceeding threshold. Three output paths: strong match (instantiate), partial match (speculative), no match (escalate). Compensatory morpheme lifecycle: birth→trial→survival/dissipation. Runaway bounded by εR budget, ΦL drag, G3 containment, archive-only constraint. Cold start: archive empty, all friction escalates initially.",
    bridgePart: "7",
  },
  {
    id: "spec:bridge:structural-review",
    name: "Part 8: Structural Review — Resonator Identity and Diagnostic Outputs",
    content:
      "Structural Review Resonator within Ecosystem Governance Bloom. Seven triggers: λ₂ drop, friction spike (TV_G > 0.5 sustained), cascade at 2nd level, εR spike above range, ΦL velocity > 0.05/day, Ω gradient inversion, operator trigger. Five diagnostics: global λ₂, spectral gap (λ₃/λ₂), hub dependency (max betweenness/mean), friction distribution (TV_G histogram), dampening topology (γ_effective and μ per Bloom).",
    bridgePart: "8",
  },
  {
    id: "spec:bridge:adversarial-resilience",
    name: "Part 9: Adversarial Resilience Parameters",
    content:
      "Ecosystem Stress Resonator within Ecosystem Governance Bloom. Five anomaly signals: node creation rate (>3σ), connection formation rate (disproportionate), mean ΦL velocity (>0.1/day), ΨH variance collapse, federation gossip spike. Four bulkhead responses as Line property and Resonator config changes: federation isolation, acceptance rate limiting, cascade dampening override (γ×0.5), provenance weighting increase. Recovery deliberately slow (2.5× hysteresis).",
    bridgePart: "9",
  },
  {
    id: "spec:bridge:pattern-guidance",
    name: "Part 10: Pattern-Level Guidance",
    content:
      "Pattern design guidance (not spec). RTY = Π(stage_success_rate) — reveals hidden rework. Error classification: prevention→detection→mitigation→escape (Poka-Yoke levels). Failure mode analysis maps failure modes to ΦL/εR/ΨH signal patterns: model degradation (success drops, εR may spike, friction up), data drift (stability drops, εR should spike), integration failure (axiom compliance drops, λ₂ may drop), capacity exhaustion (stability drops, latency variance).",
    bridgePart: "10",
  },
  {
    id: "spec:bridge:build-experience-thompson",
    name: "Build Experience — Thompson Sampling and Pipeline Governance",
    content:
      "Empirical parameter recommendations from 6 months. Thompson priors: new model Beta(1,1), known model from history, version update ×0.5 decay. Context-blocked posteriors: separate Beta per (model, task_class) — ARE the Thompson analogue of dimensional profiles. Exploration decay: max(0.01, 1/log(obs+1)), floor always wins. Hallucination detection: Layer 1 ELIMINATED_ENTITIES (string match), Layer 2 grammar/Assayer, Layer 3 Jidoka stop-the-line. CLAUDE.md as textual projection of Constitutional Bloom.",
    bridgePart: "11",
  },
  {
    id: "spec:bridge:deferred-computations",
    name: "Deferred Computation Details",
    content:
      "Four computations verified against source: (1) ΦL temporal_stability — CV-based stateless and variance-based stateful paths with ring buffer, topology-dependent window sizes. (2) εR spectral calibration — minEpsilonRForSpectralState() maps spectral ratio to minimum εR. (3) εR floor formula — max of imperative gradient term, spectral term, and 0.01 absolute minimum. (4) ΨH hypothetical state — partial: infrastructure accepts arbitrary inputs but no ergonomic hypothetical API.",
    bridgePart: "12",
  },
  {
    id: "spec:bridge:vertical-wiring",
    name: "Vertical Wiring Specification",
    content:
      "8-row interface contract: observation→conditioning, conditioning→ΦL, ΦL→maturity, node→container (dampened CONTAINS), graph→ΨH (Laplacian), Line→conductivity (3-layer cache), state changes→events (6 triggers to Structural Review), recovery→hysteresis (γ/2.5). Each row is producer-consumer contract. All interfaces are morpheme-to-morpheme data flows through Lines.",
    bridgePart: "13",
  },
  {
    id: "spec:bridge:anti-patterns",
    name: "Anti-Patterns (Bridge-Specific)",
    content:
      "Implementation anti-patterns specific to Bridge computations: separate monitoring database (cache OK, graph authoritative), morpheme labels on code (type IS structure, not a label), assigned resonance (ΨH is computed from λ₂+TV_G, never assigned), silent routing around failure (adaptation must be visible per A2), forced revival of archived components, immediate blacklisting (use gradual selection pressure via ΦL).",
    bridgePart: "14",
  },
  {
    id: "spec:bridge:glossary",
    name: "Glossary",
    content:
      "Engineering equivalents for all Codex terms used in Bridge v3.0. Maps morphemes to implementation concepts (Seed=atomic data unit, Line=connection with conductivity, Bloom=scope boundary, Resonator=transformation, Grid=persistent data structure, Helix=feedback loop). Maps state dimensions, cascade parameters, conductivity layers, governance Resonators, memory operations, Thompson parameters, and all new v3.0 concepts.",
    bridgePart: "15",
  },
];

async function phase2(): Promise<void> {
  console.log("\n═══ Phase 2: Spec Seeds (27) ═══\n");

  let created = 0;
  let failed = 0;

  for (const seed of SEEDS) {
    const result = await instantiateMorpheme(
      "seed",
      {
        id: seed.id,
        name: seed.name,
        content: seed.content,
        seedType: "spec",
        status: "active",
        bridgePart: seed.bridgePart,
        ...(seed.bridgeSection ? { bridgeSection: seed.bridgeSection } : {}),
      },
      "grid:bridge-v3",
    );

    if (result.success) {
      ok(`${seed.id}`);
      created++;
    } else {
      fail(seed.id, result.error ?? "unknown");
      failed++;
    }
  }

  console.log(`\n  Seeds: ${created} created/updated, ${failed} failed`);
}

// ─── Phase 3: Cross-Reference Lines ─────────────────────────────────

interface LineDef {
  num: string;
  source: string;
  target: string;
  label: string;
}

const LINES: LineDef[] = [
  {
    num: "L-01",
    source: "spec:bridge:line-conductivity",
    target: "spec:bridge:degradation-cascade",
    label: "Conductivity evaluation inserts between cascade propagation and signal conditioning",
  },
  {
    num: "L-02",
    source: "spec:bridge:line-conductivity",
    target: "spec:bridge:signal-conditioning",
    label: "Conductive Lines feed signals into the conditioning pipeline",
  },
  {
    num: "L-03",
    source: "spec:bridge:line-conductivity",
    target: "spec:bridge:dimensional-profiles",
    label: "Layer 3 reads dimensional profiles from observation Grids",
  },
  {
    num: "L-04",
    source: "spec:bridge:line-conductivity",
    target: "spec:bridge:governance-resonators",
    label: "Line Creation Resonator evaluates conductivity at write time",
  },
  {
    num: "L-05",
    source: "spec:bridge:governance-resonators",
    target: "spec:bridge:superposition",
    label: "All instance Bloom creation routes through Instantiation Resonator",
  },
  {
    num: "L-06",
    source: "spec:bridge:governance-resonators",
    target: "spec:bridge:immune-memory-repair",
    label: "All compensatory morpheme creation routes through Instantiation Resonator",
  },
  {
    num: "L-07",
    source: "spec:bridge:governance-resonators",
    target: "spec:bridge:memory-strata",
    label: "Compaction Resonator routes Line severing through Mutation Resonator",
  },
  {
    num: "L-08",
    source: "spec:bridge:dimensional-profiles",
    target: "spec:bridge:build-experience-thompson",
    label: "Context-blocked posteriors ARE Thompson analogue of dimensional profiles",
  },
  {
    num: "L-09",
    source: "spec:bridge:dimensional-profiles",
    target: "spec:bridge:line-conductivity",
    label: "Profiles feed Layer 3 contextual fitness computation",
  },
  {
    num: "L-10",
    source: "spec:bridge:superposition",
    target: "spec:bridge:line-conductivity",
    label: "Instance output Lines evaluated for conductivity at all three layers",
  },
  {
    num: "L-11",
    source: "spec:bridge:superposition",
    target: "spec:bridge:degradation-cascade",
    label: "Instance ΦL propagates through CONTAINS Lines with standard dampening",
  },
  {
    num: "L-12",
    source: "spec:bridge:superposition",
    target: "spec:bridge:signal-conditioning",
    label: "Instance observation streams enter conditioning chain independently",
  },
  {
    num: "L-13",
    source: "spec:bridge:superposition",
    target: "spec:bridge:structural-review",
    label: "Instance creation triggers λ₂ recomputation and may activate structural review",
  },
  {
    num: "L-14",
    source: "spec:bridge:superposition",
    target: "spec:bridge:immune-memory-repair",
    label: "Repeated instance failure triggers remedy matching via friction signal",
  },
  {
    num: "L-15",
    source: "spec:bridge:immune-memory-repair",
    target: "spec:bridge:line-conductivity",
    label: "Friction profiles come from Lines exceeding Layer 3 threshold",
  },
  {
    num: "L-16",
    source: "spec:bridge:structural-review",
    target: "spec:bridge:composition-epsilon-r",
    label: "εR spike at composition level triggers structural review",
  },
  {
    num: "L-17",
    source: "spec:bridge:vertical-wiring",
    target: "spec:bridge:signal-conditioning",
    label: "Observation→conditioning is first vertical interface point",
  },
  {
    num: "L-18",
    source: "spec:bridge:vertical-wiring",
    target: "spec:bridge:structural-review",
    label: "State changes→events is seventh vertical interface point (6 triggers)",
  },
];

async function phase3(): Promise<void> {
  console.log("\n═══ Phase 3: Cross-Reference Lines (18) ═══\n");

  let created = 0;
  let failed = 0;

  for (const line of LINES) {
    const result = await createLine(
      line.source,
      line.target,
      "REFERENCES",
      { label: line.label, direction: "forward" },
    );

    if (result.success) {
      ok(`${line.num}: ${line.source} → ${line.target}`);
      created++;
    } else {
      fail(`${line.num}`, result.error ?? "unknown");
      failed++;
    }
  }

  console.log(`\n  Lines: ${created} created, ${failed} failed`);
}

// ─── Phase 4: M-21 Bloom ─────────────────────────────────────────────

async function phase4(parentBloomId: string): Promise<void> {
  console.log("\n═══ Phase 4: M-21 Milestone Bloom ═══\n");

  const bloomResult = await instantiateMorpheme(
    "bloom",
    {
      id: "bloom:m-21",
      name: "M-21: Bridge Grid Instantiation",
      content:
        "Bridge v3.0 instantiated as a Grid of spec Seeds, queryable by Cypher. Each Part/section = one Seed. Cross-references between sections = Lines. Enables SPECIFIED_BY Lines from implementations to spec sections.",
      type: "milestone",
      status: "active",
      phiL: 0.0,
    },
    parentBloomId,
    MILESTONE_HIGHLANDER,
  );

  if (bloomResult.success) {
    ok("Bloom 'bloom:m-21'");
  } else {
    fail("M-21 Bloom", bloomResult.error ?? "unknown");
  }

  // Wire DEPENDS_ON from M-21 to M-17
  const m17Exists = await nodeExists("bloom:m-17");
  if (m17Exists) {
    const lineResult = await createLine(
      "bloom:m-21",
      "bloom:m-17",
      "DEPENDS_ON",
      { label: "Bridge Grid requires completed Bridge v3.0" },
    );
    if (lineResult.success) {
      ok("DEPENDS_ON: bloom:m-21 → bloom:m-17");
    } else {
      fail("DEPENDS_ON M-17", lineResult.error ?? "unknown");
    }
  } else {
    console.log("  ⚠ bloom:m-17 not found — skipping DEPENDS_ON wire");
  }
}

// ─── Phase 5: Verification ───────────────────────────────────────────

async function phase5(): Promise<void> {
  console.log("\n═══ Phase 5: Verification ═══\n");

  // 5.1 Grid and Seeds
  const seedCount = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (g:Grid {id: 'grid:bridge-v3'})-[:CONTAINS]->(s:Seed)
      WHERE s.seedType = 'spec'
      RETURN count(s) AS cnt, g.name AS gridName
    `);
    const cnt = res.records[0]?.get("cnt");
    const gridName = res.records[0]?.get("gridName");
    return {
      count: typeof cnt === "object" && cnt !== null ? cnt.toNumber() : Number(cnt ?? 0),
      gridName: gridName as string,
    };
  });
  const seedPass = seedCount.count === 27;
  console.log(`  5.1 Seeds: ${seedCount.count}/27 ${seedPass ? "✓" : "✗"} (grid: ${seedCount.gridName ?? "not found"})`);

  // 5.2 Seeds with empty content
  const emptyContent = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (g:Grid {id: 'grid:bridge-v3'})-[:CONTAINS]->(s:Seed)
      WHERE s.content IS NULL OR s.content = ''
      RETURN count(s) AS cnt
    `);
    const cnt = res.records[0]?.get("cnt");
    return typeof cnt === "object" && cnt !== null ? cnt.toNumber() : Number(cnt ?? 0);
  });
  console.log(`  5.2 Empty content: ${emptyContent} ${emptyContent === 0 ? "✓" : "✗"}`);

  // 5.3 Cross-reference Lines
  const lineCount = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (s1:Seed)-[r:REFERENCES]->(s2:Seed)
      WHERE s1.id STARTS WITH 'spec:bridge:' AND s2.id STARTS WITH 'spec:bridge:'
      RETURN count(r) AS cnt
    `);
    const cnt = res.records[0]?.get("cnt");
    return typeof cnt === "object" && cnt !== null ? cnt.toNumber() : Number(cnt ?? 0);
  });
  const linePass = lineCount === 18;
  console.log(`  5.3 REFERENCES Lines: ${lineCount}/18 ${linePass ? "✓" : "✗"}`);

  // 5.4 INSTANTIATES wiring
  const wiredCount = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (s:Seed)-[:INSTANTIATES]->(def)
      WHERE s.id STARTS WITH 'spec:bridge:'
      RETURN count(s) AS cnt
    `);
    const cnt = res.records[0]?.get("cnt");
    return typeof cnt === "object" && cnt !== null ? cnt.toNumber() : Number(cnt ?? 0);
  });
  const instantiatesPass = wiredCount === 27;
  console.log(`  5.4 INSTANTIATES wired: ${wiredCount}/27 ${instantiatesPass ? "✓" : "✗"}`);

  // 5.5 M-21 Bloom
  const m21 = await readTransaction(async (tx) => {
    const res = await tx.run(`
      MATCH (b:Bloom {id: 'bloom:m-21'})
      OPTIONAL MATCH (b)-[:DEPENDS_ON]->(dep)
      RETURN b.name AS name, b.status AS status, dep.id AS depId
    `);
    return res.records[0]
      ? {
          name: res.records[0].get("name"),
          status: res.records[0].get("status"),
          depId: res.records[0].get("depId"),
        }
      : null;
  });
  if (m21) {
    console.log(
      `  5.5 M-21 Bloom: '${m21.name}' status=${m21.status} depends_on=${m21.depId ?? "none"} ✓`,
    );
  } else {
    console.log("  5.5 M-21 Bloom: NOT FOUND ✗");
  }

  // Summary
  const allPass =
    seedPass &&
    emptyContent === 0 &&
    linePass &&
    instantiatesPass &&
    m21 !== null;

  console.log(`\n  Overall: ${allPass ? "ALL CHECKS PASSED ✓" : "SOME CHECKS FAILED ✗"}`);
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("M-21: Bridge Grid Instantiation");
  console.log("=================================");
  console.log("Source: docs/specs/codex-signum-engineering-bridge-v3_0.md");
  console.log("SHA: 72afa5e278563abf64e9e1f031937a99bf2463d5\n");

  try {
    // Phase 0: Idempotency check
    const alreadyExists = await phase0();

    // Find parent Bloom
    const parentBloomId = await findTopLevelBloom();
    if (!parentBloomId) {
      console.error("ERROR: No top-level Bloom found. Cannot create Grid.");
      console.error(
        "Run bootstrap-constitutional-bloom.ts first to establish the constitutional Bloom.",
      );
      process.exit(1);
    }
    console.log(`\n  Using parent Bloom: '${parentBloomId}'`);

    if (!alreadyExists) {
      await phase1(parentBloomId);
    } else {
      console.log("\n═══ Phase 1: Grid already exists — skipping creation ═══");
    }

    await phase2();
    await phase3();
    await phase4(parentBloomId);
    await phase5();
  } finally {
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
