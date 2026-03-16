# Codex Signum — Core Library

## For Claude Code (and any coding agent)

---

## ⚠️ Neo4j Connection — READ THIS FIRST

**The env var is `NEO4J_USER`, not `NEO4J_USERNAME`.** This has caused repeated failures across multiple sessions. The driver in `src/graph/client.ts` reads `NEO4J_USER`. If your script or .env uses `NEO4J_USERNAME`, add this fallback:

```typescript
if (process.env.NEO4J_USERNAME && !process.env.NEO4J_USER) {
  process.env.NEO4J_USER = process.env.NEO4J_USERNAME;
}
```

Required env vars: `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`. The `.env` file lives at repo root; fallback: `../DND-Manager/.env`. See `docs/NEO4J_CONNECTION.md` for full details.

---

## ⛔ MANDATORY: Pipeline-First Execution

**ALL milestone work MUST be executed through the Architect or DevAgent pipeline.**

You are NOT PERMITTED to execute manual task lists as raw sequential instructions. If you receive a prompt structured as sequential tasks (Task 0, Task 1, Task 2...), you MUST:

1. **STOP.** Do not execute the tasks directly.
2. **Extract the intent** from the prompt.
3. **Invoke the pipeline:**
   - Analytical/documentation work: `npx tsx scripts/architect.ts plan "<intent>" [flags]`
   - Coding tasks: `npx tsx scripts/dev-agent.ts run "<task>" --files=<paths> [flags]`
4. **Let the pipeline run** through its stages. Do not short-circuit, skip stages, or "help" by doing work outside the pipeline.

**Only exceptions — must be explicitly tagged in the prompt:**

| Tag | Meaning | Example |
|-----|---------|--------|
| `[PIPELINE-PREP]` | Modifying the pipeline itself, or wiring prerequisites the pipeline needs before it can run | Updating CLAUDE.md governance, wiring `graphEnabled`, extending verify-graph-state.ts |
| `[NO-PIPELINE]` | Pure mechanical work with no analytical component | File renames, config edits, formatting fixes |

**If the pipeline fails, fix the pipeline. Do not do the work manually.**

**Why this rule exists:** The Architect and DevAgent pipelines write structural records to Neo4j (PipelineRun, TaskOutput, Decision, Observation nodes). Thompson posteriors update from outcomes. The system learns from its own execution. When work bypasses the pipeline, the system is blind to what happened — no structural representation, no learning, no quality assessment. Every manual bypass makes the system's thesis ("state is structural") false for that piece of work.

**This is not a guideline. It is a structural enforcement rule. Violation is the single most damaging anti-pattern for this repo.**

---

## ⛔ MANDATORY: Graph-Native Data Creation

All data written to Neo4j MUST follow Codex morpheme semantics. The graph is not a database — it is the structural encoding of system state. Every node, every relationship, every property must be legible, connected, and faithful to what it represents.

### The Five Rules

**Rule 1: Seed first, then evolve.**
Every piece of data enters the graph as a Seed. A Seed is "an atomic unit, datum, coherent unit" (v5.0 spec). It MUST have:

- `id` — unique identifier
- `seedType` — what kind of datum this is (e.g. "exit-criterion", "backlog", "test", "pipeline-output")
- `content` — the actual data. A Seed with only an id and name is a bare stub, not a datum. Bare stubs violate A1 (Fidelity).
- `status` — current state
- `createdAt` — provenance timestamp (A4)

Seeds evolve by gaining relationships (Lines), being contained by Blooms, accumulating Observations, or being transformed by Resonators. They are never created in isolation with the expectation that "we'll fill it in later."

**Rule 2: No node without a relationship.**
A node with zero relationships is structurally invisible. Per the spec: "A Seed with no inbound or outbound Lines is Dormant — present but not participating in any flow." Dormant Seeds are acceptable ONLY when they genuinely represent latent capability awaiting connection. A backlog item that has a known target milestone is NOT dormant — it should have a SCOPED_TO relationship.

Every node creation MUST be accompanied by at least one relationship creation in the same transaction:

- Seed → CONTAINS from parent Bloom
- Seed → SCOPED_TO target Bloom (if applicable)
- Bloom → CONTAINS from parent Bloom (G3 containment)
- Bloom → DEPENDS_ON prerequisite Bloom (if dependency exists)

**Rule 3: Containment is parent → child. Always.**
G3 (Containment): "A Bloom enclosing other morphemes defines scope." The parent declares what it contains.

- `(parent)-[:CONTAINS]->(child)` ✅
- `(child)-[:PART_OF]->(parent)` ❌ NEVER
- `(child)-[:BELONGS_TO]->(parent)` ❌ NEVER

No exceptions. No "it's the same thing in reverse." Direction encodes semantics (G2). Parent → child is scope declaration. Child → parent is a different semantic (provenance, attribution) that uses different relationship types.

**Rule 4: Blooms define scope through what they CONTAIN, not through properties.**
A Bloom's scope is the set of morphemes it contains. A Bloom with `scope: "do X, Y, Z"` as a string property but no child Seeds for X, Y, Z is not a scope boundary — it's a label with a description. The graph structure must be self-describing:

- Milestone exit criteria → Seed nodes CONTAINED by the milestone Bloom
- Milestone sub-tasks → Bloom nodes CONTAINED by the milestone Bloom
- Milestone dependencies → DEPENDS_ON Lines between Blooms

If you need to know "what does this milestone require?", the answer is a CONTAINS traversal, not a property read.

**Rule 5: State dimensions derive from structure, not manual assignment.**

- `phiL` on a parent Bloom derives from its children (complete ratio), not from a hardcoded value
- `status` on a parent Bloom derives from its children (all-complete/some-complete/none), not from manual SET
- The only exception is leaf nodes (Seeds, terminal Blooms with no children) where status is set directly by the stamp operation

### Milestone Bloom Stamp Protocol

Every sub-milestone stamp is THREE operations, not one. Missing any step breaks the structural hierarchy.

Step 1 — Stamp the sub-milestone:

```cypher
MERGE (b:Bloom {id: $subMilestoneId})
SET b.status = 'complete', b.phiL = 0.9,
    b.commitSha = $commitSha, b.testCount = $testCount,
    b.completedAt = datetime()
```

Step 2 — Wire to parent (MANDATORY — without this edge the sub-milestone is structurally invisible):

```cypher
MATCH (parent:Bloom {id: $parentId}), (b:Bloom {id: $subMilestoneId})
MERGE (parent)-[:CONTAINS]->(b)
```

Step 3 — Recalculate parent status from children:

```cypher
MATCH (child:Bloom)<-[:CONTAINS]-(parent:Bloom {id: $parentId})
WITH parent,
     count(child) AS total,
     count(CASE WHEN child.status = 'complete' THEN 1 END) AS done
SET parent.status = CASE
      WHEN done = total THEN 'complete'
      WHEN done > 0 THEN 'active'
      ELSE 'planned' END,
    parent.phiL = CASE
      WHEN done = total THEN 0.9
      WHEN done > 0 THEN 0.5
      ELSE 0.3 END,
    parent.updatedAt = datetime()
```

Gate rule: Bloom stamps require Ro's in-session review before execution.

### Backlog Seed Creation Protocol

Every backlog refinement (R-N) enters the graph as:

```cypher
MERGE (s:Seed {id: $id})
SET s.seedType = "backlog",
    s.name = $name,
    s.content = $description,    // MANDATORY — what this item actually is
    s.status = $status,
    s.target = $targetMilestone,
    s.createdAt = datetime()

// Wire to target milestone if one exists
WITH s
MATCH (m:Bloom {id: $targetMilestone})
MERGE (s)-[:SCOPED_TO]->(m)
```

### Exit Criteria Seed Creation Protocol

Every exit criterion for a milestone enters the graph as:

```cypher
MERGE (s:Seed {id: $milestoneId + ':ec-' + $number})
SET s.seedType = "exit-criterion",
    s.content = $criterionText,    // MANDATORY — what must be true for completion
    s.status = $status,
    s.createdAt = datetime()

// Wire to parent milestone
WITH s
MATCH (m:Bloom {id: $milestoneId})
MERGE (m)-[:CONTAINS]->(s)
```

### DEPENDS_ON Direction Convention

Dependency edges follow forward flow: `(prerequisite)-[:DEPENDS_ON]->(dependent)`.

"M-9 DEPENDS_ON M-9.V" means M-9 must complete before M-9.V can begin. The critical path reads top-to-bottom as prerequisite → dependent.

---

This is the core library for the Codex Signum protocol — a semantic encoding where **state is structural**. Consumer applications (like DND-Manager) import from this package. This repo is the single source of truth for all grammar-level infrastructure.

---

## Architecture

```
src/
├── computation/           # State dimension calculators
│   ├── phi-l.ts           # ΦL — health score (4-factor: axiom_compliance, provenance, success_rate, temporal_stability)
│   ├── psi-h.ts           # ΨH — harmonic signature (λ₂ structural coherence + TV_G runtime friction)
│   ├── epsilon-r.ts       # εR — exploration rate with imperative gradient + spectral calibration
│   ├── dampening.ts       # Topology-aware cascade dampening: γ_effective = min(0.7, 0.8/k) [budget-capped]
│   ├── maturity.ts        # Network maturity index (4 normalized factors, each weighted 0.25)
│   ├── aggregation.ts     # Hierarchical health aggregation (node → pattern → bloom → system)
│   ├── hierarchical-health.ts  # Recursive bottom-up health walk
│   ├── adaptive-thresholds.ts  # Maturity-indexed thresholds (Young/Maturing/Mature bands)
│   ├── structural-review.ts    # 5 diagnostic computations (global λ₂, spectral gap, hub dependency, friction, dampening)
│   ├── structural-triggers.ts  # 6 event triggers for structural review
│   ├── immune-response.ts      # Wire triggers → review (event-driven, not scheduled)
│   ├── signals/           # 7-stage signal conditioning pipeline
│   │   ├── SignalPipeline.ts   # Orchestrator
│   │   ├── Debounce.ts         # Stage 1: 100ms, 2-3 event persistence
│   │   ├── HampelFilter.ts     # Stage 2: 7-point window, k=3
│   │   ├── EWMASmoother.ts     # Stage 3: α=0.25 leaves, 0.15 default, 0.08 hubs
│   │   ├── CUSUMMonitor.ts     # Stage 4: h ≈ 4-5
│   │   ├── MACDDetector.ts     # Stage 5: fast α=0.25, slow α=0.04
│   │   ├── HysteresisGate.ts   # Stage 6: band ≥ 2× V_pp
│   │   ├── TrendRegression.ts  # Stage 7: Theil-Sen, 30-50 events
│   │   ├── NelsonRules.ts      # Rules 1, 2, 7
│   │   ├── types.ts
│   │   └── index.ts
│   └── metrics/           # OpEx metrics (RTY, feedback effectiveness)
│
├── patterns/              # Reference patterns
│   ├── architect/         # 7-stage planning pipeline (SURVEY→DECOMPOSE→CLASSIFY→SEQUENCE→GATE→DISPATCH→ADAPT)
│   ├── dev-agent/         # SCOPE → EXECUTE → REVIEW → VALIDATE pipeline
│   ├── thompson-router/   # Thompson sampling model selection
│   ├── assayer/           # Structural integrity verification (v5.0 Assayer pattern)
│   └── feedback/          # Feedback functions + types (formerly observer/)
│
├── resilience/            # Circuit breaker, retry logic
│   └── circuit-breaker.ts # MUST use: exponential backoff + full jitter + 5-10 half-open probes
│
├── constitutional/        # Governance layer
│   ├── engine.ts          # Constitutional rule + axiom evaluation
│   ├── evolution.ts       # Amendment mechanism (may be stub — Tier 1/2/3 taxonomy)
│   └── index.ts
│
├── memory/                # Four-stratum memory operations
│   ├── compaction.ts      # Stratum 2: continuous exponential decay, weight = e^(-λ × age)
│   ├── distillation.ts    # Stratum 3: performance profiles, routing hints, threshold calibration
│   └── flow.ts            # Upward compression + downward enrichment
│
├── graph/                 # Neo4j connection, schema, queries
│   ├── client.ts          # ⚠️ Reads NEO4J_USER (not NEO4J_USERNAME) — see top of this file
│   ├── schema.ts
│   ├── queries.ts
│   └── instantiation.ts   # Morpheme instantiation protocol — ALL writes through here
│
├── types/                 # Core type definitions
│   ├── morphemes.ts       # Seed, Line, Bloom, Resonator, Grid, Helix
│   ├── state-dimensions.ts # ΦL, ΨH, εR composite types
│   ├── constitutional.ts  # Rule types, amendment taxonomy
│   └── memory.ts          # Four-stratum memory types
│
├── index.ts               # Barrel export — EVERYTHING public goes through here

scripts/                   # Self-hosting CLI (NOT part of the library — consumer-grade tooling)
├── architect.ts           # `npx tsx scripts/architect.ts plan "<intent>"` — full pipeline
├── reconcile.ts           # `npx tsx scripts/reconcile.ts` — gap analysis (no LLM, pure filesystem)
├── bootstrap-executor.ts  # ModelExecutor using raw fetch() — reads API keys from env
├── bootstrap-task-executor.ts # TaskExecutor V1 — context injection, synthesis, jidoka, consistency
├── seed-agents.ts         # Seed nodes in Neo4j for bootstrap models
├── verify-graph-state.ts  # Graph state verification
├── verify-select-model.ts # Thompson selection verification
└── m21-bridge-grid.ts     # M-21: Bridge Grid instantiation (idempotent)

docs/                      # Specification corpus, research papers, hypothesis registry
├── NEO4J_CONNECTION.md    # ⚠️ Neo4j env var documentation (NEO4J_USER, not NEO4J_USERNAME)
├── specs/                 # Canonical specifications
│   ├── cs-v5.0.md                                 # v5.0 canonical spec (8 axioms, G1–G5)
│   ├── codex-signum-engineering-bridge-v3_0.md     # Bridge v3.0 (implementation authority)
│   ├── 05_codex-signum-engineering-bridge-v2_0.md  # Bridge v2.0 (preserved)
│   ├── codex-signum-morpheme-identity-map-v2.md    # Morpheme Identity Map v2.0
│   ├── codex-signum-morpheme-identity-map.md       # Morpheme Identity Map v1.0 (preserved)
│   ├── codex-signum-v5_0b-statistical-assessment.md # v5.0b supplement
│   ├── concurrent-pattern-topology-v3.md           # Concurrent execution model
│   ├── instantiation-mutation-resonator-design.md  # Governance Resonator design
│   └── m17-1-bridge-delta-report.md                # M-17.1 delta report
├── roadmap/               # Canonical roadmap
├── milestones/            # Milestone completion prompts
├── research/              # Research papers (short-named copies for SURVEY consumption)
└── hypotheses/            # Tracked scientific claims with evidence trails
```

### Constitutional Bloom

The Constitutional Bloom is the organisational core of the graph. It contains the 41 definition Seeds (axioms A1–A4, A6–A9; grammar rules G1–G5; morpheme definitions) and governance Resonators that enforce structural invariants. All other Blooms derive their compliance context from Constitutional CONTAINS edges. Bootstrapped via `scripts/bootstrap-constitutional-bloom.ts`.

### Dispatch Routing

DISPATCH routes tasks based on CLASSIFY output. Classification is layered:

| Layer | Signal | What It Detects |
|-------|--------|----------------|
| 1. Content-shape | `input_type` + `output_type` from DECOMPOSE | Structured data transforms, code-to-code transforms |
| 2. File-type | `files_affected` extensions + operation keywords | Structured data files with transform ops, source code with rename/move ops |
| 3. Keyword | Title + description keyword matching | Generative vs mechanical based on action verbs |

Routing table:

| Task Type | Confidence | Execution Path |
|-----------|-----------|----------------|
| deterministic | any (with registered executor) | DeterministicExecutor — no LLM, script execution |
| deterministic | any (no executor) | Falls back to generative LLM |
| mechanical | ≥ 0.6 | DevAgent: SCOPE → EXECUTE → REVIEW → VALIDATE |
| mechanical | < 0.6 | LLM (single call — uncertain classification) |
| generative | any | LLM (single call via Thompson) |

All paths record outcomes. Thompson learns from generative and mechanical paths. Deterministic paths record TaskOutcome for audit but don't update Thompson posteriors (no model selection involved).

---

## Non-Negotiable Rules

### 1. This is a LIBRARY, not an application

Core is substrate-agnostic. It does NOT know about:
- DND-Manager, D&D, character sheets
- Specific LLM providers (Anthropic, OpenAI, Mistral, Google)
- Specific databases beyond abstract graph interfaces
- Any consumer application's business logic

If you find yourself importing from a consumer app — **STOP. You are going the wrong direction.**

The `scripts/` directory is an exception: it provides self-hosting tooling for running the Architect pattern on core itself. These scripts use raw `fetch()` for LLM calls and read API keys from environment variables — they demonstrate the pattern without pulling in provider SDKs. Scripts are NOT part of the library's public API.

### 2. dist/ is committed. There is NO prepare script.

```bash
npm run build       # Compiles to dist/
git add dist/       # ALWAYS commit dist/ after building
git commit          # Consumers install from GitHub and use committed dist/
```

**DO NOT** add a `prepare` script to package.json. npm runs `prepare` automatically when a consumer installs a GitHub dependency, which would rebuild dist/ from source during install and overwrite the committed files. This bug cost hours to diagnose. See commit `4cd0ecc`.

### 3. State Is Structural — No Monitoring Overlays

The graph is the single source of truth. Do NOT create:
- Separate health databases or JSON caches
- SQLite tables for monitoring data
- Log files as state stores
- Any parallel state outside the graph

The graph IS the monitoring infrastructure. If you need to know system state, write a Cypher query.

### 4. ΦL Is ALWAYS a Composite

ΦL is never `health: number`. It is always a structured object with raw factors, weights, maturity_factor, and effective score.

### 5. Dampening Is NEVER Fixed

`γ = 0.7` everywhere is WRONG. Always compute from topology:
```
γ_effective = min(0.7, 0.8 / k)    # budget-capped, guarantees μ = k×γ ≤ 0.8 < 1
```

### 6. Hysteresis = 2.5×

Recovery is 2.5× slower than degradation. Not 1.5×.

### 7. Cascade Limit = 2

Degradation propagates at most 2 containment levels. This is the primary safety mechanism.

### 8. Signal Pipeline Is Complete — Don't Modify

The 7-stage signal conditioning pipeline in `src/computation/signals/` was built across 15 carefully audited commits, verified against Engineering Bridge §Part 4. Do not modify it unless fixing a specific documented bug.

### 9. .js Extensions on ALL Relative Imports

```typescript
import { computePhiL } from "./phi-l.js";   // CORRECT
import { computePhiL } from "./phi-l";      // WRONG — will fail at runtime
```

### 10. Commit + Push After Every Task

Every discrete task produces a commit with a descriptive message and pushes to remote.

### 11. Substrate-Agnostic Logic Belongs in Core

If a function uses only core types and any consumer would benefit from it, it belongs here — not in a consumer repo.

### 12. Docs Corpus Is SURVEY's Source of Truth

The `docs/` directory is not documentation for humans — it is the **specification corpus that SURVEY reads**.

---

## Specification References

| Question | Reference |
|---|---|
| What are the morphemes, axioms, grammar rules? | `cs-v5.0.md` (v5.0 canonical — 8 axioms, A5 removed) |
| How to compute ΦL, ΨH, εR? | Engineering Bridge v3.0 Part 2 |
| Dampening, cascade, hysteresis parameters? | Engineering Bridge v3.0 Part 3 |
| Signal conditioning pipeline? | Engineering Bridge v3.0 Part 4 |
| Visual encoding safety? | Engineering Bridge v3.0 Part 5 |
| CAS vulnerability watchpoints? | Engineering Bridge v3.0 Part 6 |
| Memory sizing? | Engineering Bridge v3.0 Part 7 |
| Structural review triggers + diagnostics? | Engineering Bridge v3.0 Part 8 |
| Adversarial resilience? | Engineering Bridge v3.0 Part 9 |
| RTY, error classification, failure modes? | Engineering Bridge v3.0 Part 10 |
| Morpheme type assignment? | Morpheme Identity Map v2.0 |
| Architect pattern design? | `codex-signum-architect-pattern-design.md` |
| Lean process maps? | `codex-signum-lean-process-maps-v2.md` |
| Research corpus index? | `codex-signum-research-index.md` |
| Assayer pattern? | `09_codex-signum-assayer-pattern-design.md` |

**The Engineering Bridge v3.0 is the implementation authority.** If you need to know *what* to build, read the Bridge. If you need to know *why*, read the Codex v5.0.

---

## Key Parameters (from Engineering Bridge v3.0)

### ΦL Weights
```
axiom_compliance:    0.4
provenance_clarity:  0.2
usage_success_rate:  0.2
temporal_stability:  0.2
```

### ΨH Composite
```
ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)
```

### εR Spectral Calibration
| Spectral Ratio | Minimum εR |
|---|---|
| > 0.9 | 0.05 |
| 0.7–0.9 | 0.02 |
| 0.5–0.7 | 0.01 |
| < 0.5 | 0.0 |

### Adaptive Thresholds (Maturity-Indexed)
| Threshold | Young (MI < 0.3) | Maturing (0.3–0.7) | Mature (MI > 0.7) |
|---|---|---|---|
| ΦL healthy | > 0.6 | > 0.7 | > 0.8 |
| ΦL degraded | < 0.4 | < 0.5 | < 0.6 |
| εR stable range | 0.10–0.40 | 0.05–0.30 | 0.01–0.15 |
| ΨH dissonance | > 0.25 | > 0.20 | > 0.15 |

### Circuit Breaker
```
cooldown = random(0, min(base × 1.5^tripCount, 300_000ms))   # Full jitter
halfOpenProbes = 5-10                                          # Successes to close
```

### Algedonic Bypass
```
if (ΦL < 0.1) → γ = 1.0   # Emergency escalation, bypass all dampening
```

---

## Test Governance

### Regression Baselines

| Metric | Baseline | Source |
|---|---|---|
| Tests passing | 1564 | `npm test` at HEAD |
| Barrel exports | 277 | `node -e "const c = require('./dist'); console.log(Object.keys(c).length)"` |

### Safety Invariants (Level 5)

| Invariant | Test File | Spec Source |
| --- | --- | --- |
| Subcriticality: γ_effective ≤ 0.7 for all degree ≥ 1 | `tests/safety/subcriticality.test.ts` | Engineering Bridge §Part 3 |
| Cascade limit: propagation stops at depth 2 | `tests/safety/cascade-limit.test.ts` | Engineering Bridge §Part 3 |
| Hysteresis: recovery rate = degradation rate / 2.5 | `tests/safety/hysteresis.test.ts` | Engineering Bridge §Part 3 |
| Algedonic bypass: ΦL < 0.1 forces γ = 1.0 | `tests/safety/algedonic-bypass.test.ts` | Engineering Bridge §Part 3 |

---

## Anti-Patterns (v5.0 Taxonomy + Incidents)

The v5.0 spec defines 10 canonical anti-patterns. All graph-writing agents must avoid these:

1. **Monitoring Overlay** — separate observation/dashboard layer outside the graph
2. **Intermediary Layer** — wrapper functions between graph and consumers
3. **Dimensional Collapse** — reducing composite state dimensions to bare scalars
4. **Prescribed Behaviour** — one pattern imperatively controlling another
5. **Governance Theatre** — rules that exist on paper but aren't structurally enforced
6. **Shadow Operations** — work that bypasses the pipeline (manual analysis bypass)
7. **Defensive Filtering** — suppressing signals to avoid triggering thresholds
8. **Skilled Incompetence** — technically correct actions that undermine system learning
9. **Undiscussable Accumulation** — known issues left unaddressed until crisis
10. **Pathological Autopoiesis** — system optimising for self-preservation over purpose

### Incidents This Repo Has Encountered

| Anti-Pattern | What Went Wrong | Prevention |
|---|---|---|
| Fixed dampening γ=0.7 | Supercritical for branching factor ≥ 2 | Always compute γ_effective from topology |
| Fixed circuit breaker cooldown | Spec requires exponential backoff + jitter | Use `computeCooldown(tripCount, config)` |
| `prepare` script in package.json | Rebuilt dist/ during consumer `npm install` | Removed in `4cd0ecc`, never re-add |
| Bare `number` as health score | ΦL must always be composite structure | Use `PhiLOutput` type, never bare number |
| Substrate-agnostic logic in consumer | `parallelDecompose()` placed in DND instead of core | If it uses only core types → it belongs in core |
| Observation pipelines / monitoring overlays | State is structural — graph-feeder writes inline | Do NOT create collector.ts, evaluator.ts, or auditor.ts |
| **⛔ Manual analysis bypass** | Agent executes sequential task lists instead of pipeline | Pipeline-First Execution rule (top of this document) |
| Dimensional Collapse (hallucinated facts) | LLM fabricates axiom names, wrong counts | `detectHallucinations()` — 8 axioms (v5.0), 7 stages, `ELIMINATED_ENTITIES` |
| **Orphaned sub-milestone** | Bloom stamped with no CONTAINS edge to parent | The edge IS the containment, not the naming convention |
| **Bare stub Seed** | Seed created with no content, no relationships | A1 Fidelity: data has content. Every Seed must have content. |
| **Compliance-as-Monitoring** | Tests that scan graph for violations after creation | Fix the creation layer. Instantiation protocol prevents non-compliance. |
| **Source-only sweep** | Sweep scoped from GitHub without querying Neo4j | Graph is source of truth. Always query Neo4j first. |
| **NEO4J_USERNAME vs NEO4J_USER** | Scripts fail auth using wrong env var name | Always use `NEO4J_USER`. Add fallback. See `docs/NEO4J_CONNECTION.md`. |

### Graph-First Sweep Methodology

Any task that involves cleaning up, auditing, or sweeping graph state MUST follow this order:

1. **Query Neo4j first** — run diagnostic Cypher to discover all labels, counts, orphans, stale entities
2. **Cross-reference against source** — compare what exists in the graph against what the source code creates
3. **Fix source** — remove or correct anything in source that would recreate the problem
4. **Fix graph** — clean up everything the diagnostic scan found
5. **Verify** — re-run the diagnostic scan to confirm zero violations

**Never scope a sweep from source code alone.** The graph shows what *was created* across every previous run.

---

## Build & Verification

```bash
git config core.hooksPath .githooks   # One-time setup
npx tsc --noEmit                      # Type check (after every edit)
npm test                              # Run tests
npm run build                         # Build (ALWAYS before committing)
git add dist/                         # Commit dist (ALWAYS after build)
```

---

## Pipeline Execution Protocol

When running the Architect pipeline or any long-running LLM-backed process, use asynchronous supervision — never block synchronously waiting for completion.

### Launch with Output Capture

```bash
npx tsx scripts/architect.ts plan "<intent>" [flags] 2>&1 | tee /tmp/architect-run.log
```

Report to the user at each stage transition. Do NOT wait until the entire pipeline completes.

### Stall Detection

During extended thinking, heartbeat logs appear every 15 seconds. If heartbeats are arriving, the model is alive — do NOT interrupt. If heartbeats stop AND no output for 120 seconds, check process liveness and network connections.

---

## Files That DO NOT EXIST — Never Reference These

- ~~`src/health/`~~ → Health computation is in `src/computation/`
- ~~`src/agent/`~~ → Patterns are in `src/patterns/`
- ~~`src/config/`~~ → No config directory
- ~~`src/monitoring/`~~ → Monitoring is structural, not separate
- ~~`src/services/`~~ → No services directory
- ~~`core/` at repo root~~ → Source is in `src/`, not `core/`

---

## What NOT to Change

- **Morphemes, axioms, grammar rules** — immutable (v5.0 §Semantic Stability)
- **Signal conditioning pipeline** — 15 audited commits, verified against spec
- **Graph schema** — stable, extend only if adding new node types
- **Existing test expectations** — unless a fix changes behavior to match spec
- **package.json `prepare` script** — DO NOT ADD ONE
- **Hypothesis IDs** — H-{NNN} numbers are permanent identifiers
