# Codex Signum — Canonical Roadmap & Milestone Taxonomy v8

**Version:** 8.1
**Date:** 2026-03-12
**Status:** Living document — update as milestones complete

---

## Why This Version

v7 aligned the roadmap with v5.0 spec contracts. v8 reconciles the entire roadmap with v5.0, which was canonised to repo on 2026-03-12. v5.0 introduced three major new concepts (Line Conductivity, Remedy Archive, Dimensional Profiles), removed A5 (Reversibility), renamed Correction → Refinement, and eliminated the Ontology section. The Morpheme Identity Map v1.0 was produced, identifying two graph mistypings (Agent→Resonator, PipelineRun→Bloom). The Concurrent Pattern Topology was reconciled to v3.

Key changes:
1. **M-16 rescoped.** Was "v4.3 Spec Canonicalisation" — now complete (v5.0 canonised at `e1f6d88`). M-16 becomes **Constitutional Bloom Establishment** — building the organisational core in the graph.
2. **M-17 rescoped.** Engineering Bridge v2.1 → v3.0. Must absorb superposition mechanics, Line conductivity implementation, conductivity caching, signal conditioning as named Resonators.
3. **New requirements.** R-27 through R-38 added for v5.0 fabric work: Constitutional Bloom, INSTANTIATES wiring, morpheme retyping, creation layer enforcement, Correction→Refinement codebase rename, pattern design revisions.
4. **Spec references.** v4.3 → v5.0 throughout. 9 axioms → 8. 5 strata → 4. Correction → Refinement.
5. **State Dimension Gap contracts.** Updated to v5.0 formulas. Line conductivity Layers 1-3 added as new vertical wiring requirement.

**Changelog:**
**v8.1 (2026-03-16):** Reconciliation pass. M-17.1/M-17.2 stamped complete. M-8.INT reverted to active (premature stamp). R-27/R-28 restored from M-9.6 completion report. R-40–R-45 restored from quick-reference-plan (dropped during v8 rewrite). M-20 (Topology Observation Helix) and M-21 (Bridge Grid Instantiation) added. Circular dependency M-16.4→M-16.2 removed. 6 stale R-item statuses corrected. 9 R-items relabelled Bloom→Seed.
**v8 (2026-03-12):** v5.0 reconciliation. M-16 rescoped (spec canonisation done → Constitutional Bloom establishment). M-17 rescoped (Bridge v2.1 → v3.0). Spec refs v4.3 → v5.0. 8 axioms (A5 removed). 4 memory strata. Correction→Refinement. New requirements R-46–R-57. Morpheme Identity Map and Concurrent Pattern Topology v3 committed.
**v7 (2026-03-05):** Spec alignment pass against v5.0. State Dimension Gap updated with v4.3 contracts (4-factor ΦL, dampening formula, cascade mechanics, 6 event triggers). M-9.5 Dimension 2 updated with spec contract requirements for `@future` tests. M-9.V exit criteria made spec-precise. M-17.4 vertical wiring requirements enumerated. Spec references updated v3.0 → v4.3. No milestone sequence or scope changes.
**v6.3 (2026-03-04):** M-9.4 ✅, M-9.VA ✅ (gate PASS), M-9.VA-FIX ✅ (5 bugs), M-9.VA-V ✅ (post-fix verified). Tests: 1182. R-13 closed. State dimension gap documented. M-9.8 promoted (→ after M-9.5). M-9.5 ⏳.
**v6.2 (2026-03-04):** M-9.1–9.3 stamped ✅. M-9.VA structure defined (Part 1/Part 2 split). Agent annotations added.
**v6.1 (2026-03-04):** M-9.1 stamped ✅. Test baseline 1101.
**v6.0 (2026-03-04):** M-9.VA checkpoint introduced. M-9.7 split into 7a/7b. Gate failure path defined.

**Rule:** All future sessions, prompts, and context transfers reference milestones by their M-number. This document is the single source of truth for project sequencing.

---

## Milestone Taxonomy

**M-{N}** — Major milestone (sequential, permanent, append-only)
**M-{N}.{x}** — Sub-milestone within a major milestone

| Symbol | Meaning |
|--------|--------|
| ✅ | Complete |
| 🔄 | Active / in progress |
| ⏳ | Next up (unblocked) |
| 📋 | Planned (blocked by predecessor) |
| 💡 | Vision (design not started) |

---

## Agent Annotations

Every task declares who does the heavy lifting:

| Tag | Meaning |
|-----|---------|
| 🏗️ **Architect** | Architect pattern pipeline (SURVEY→DECOMPOSE→...→ADAPT). Analytical, multi-task, cross-reference work. |
| 🔧 **DevAgent** | DevAgent pattern (SCOPE→EXECUTE→REVIEW→VALIDATE). Scoped coding tasks with clear acceptance criteria. |
| 🏗️+🔧 **Architect→DevAgent** | Architect plans, DevAgent executes sub-tasks. The integration path (M-8.INT). |
| 👤 **Ro** | Human architect decision. Review, approval, strategic judgment. |
| 🤖 **Agent** | Direct agent execution (Claude Code / Codex 5.3). Well-scoped, mechanical work. |

Until M-8.INT is complete, the agent (Claude Code) executes both Architect and DevAgent work manually via prompts. The tags indicate the *intended* routing once M-8.INT automates it.

---

## Test Gate Policy

### Gate success

Gate success is achieved when all in-scope tests pass, or when the architect (Ro) explicitly risk-accepts specific failures with documented rationale.

### Gate failure

When a gate fails:
1. The agent **stops execution** and surfaces the failure to Ro with: which tests failed, what changed, and whether the failure indicates a code bug or a test assumption that needs updating.
2. Ro decides: (a) fix the implementation within the milestone, (b) fix the test if it encodes a stale assumption, or (c) risk-accept with documented rationale.
3. The agent does not proceed past a failed gate without Ro's explicit decision.

### Two categories of tests

**In-scope tests** — tests for functionality that exists or is being built in the current milestone. These are what the gate evaluates.

**Future-requirement tests** — tests that encode spec requirements for functionality not yet built. These are:
- Marked with a `@future(M-{N})` annotation or placed in a `tests/future/` directory
- Expected to fail. Their failure proves the requirement isn't satisfied yet.
- Never modified to pass prematurely. If a future test gets rewritten to verify current behaviour instead of spec behaviour, that's a governance violation.
- Excluded from the gate evaluation. Run separately as a progress indicator.
- Promoted to in-scope when their milestone begins. At M-9 start, all `@future(M-9)` tests become in-scope and must pass by M-9 end.

### Gate rules

1. Every milestone sub-task ends with `npx tsc --noEmit` passing (type safety is universal, not scoped).
2. In-scope tests pass. Do not `.skip()` or `.todo()` to achieve this.
3. Future-requirement tests are run but do not block. Their failure count is logged as a "remaining work" metric.
4. If a milestone's changes cause a previously-passing in-scope test to fail, that failure is resolved within the milestone.
5. Test count is not a metric. In-scope pass rate at each phase boundary is.
6. **The agent's guiding principle:** make the code satisfy the test, not the test satisfy the code. If a test fails because the implementation doesn't match the spec, fix the implementation. If the implementation can't be fixed because it's future work, the test belongs in `@future`, not `.skip()`.

---

## Agent Model Selection

**Task-level routing** is handled by the Thompson router within pipeline execution. Thompson selects the best model for each individual task based on posterior quality distributions. No change needed.

**Session-level routing** is the architect's (Ro's) decision until M-8.INT automates it via CLASSIFY:

| Session Type | Recommended Model | Rationale |
|-------------|-------------------|-----------|
| Architectural judgment (planning, spec review, design decisions) | Opus | Emergent insight (Bridge View Principle was Opus). Worth the fabrication risk with proper governance. |
| Well-scoped implementation (execute a specific prompt, wire a specific component) | Sonnet | Reduced inventiveness = reduced fabrication. The prompt provides the architecture, the agent provides the labour. |
| Mechanical tasks (rename, format, config, migration) | Sonnet or Haiku | Speed matters more than depth. Low fabrication risk because scope is narrow. |
| Exploratory research (literature review, comparison analysis) | Opus | Needs to synthesise across sources and identify non-obvious connections. |

**After M-8.INT:** CLASSIFY handles this automatically. The Architect examines the intent, classifies the task profile, and selects the appropriate execution path including model tier. The human provides intent, not model selection.

---

## Critical Path Summary

```
M-8.QG ✅  Quality gates (context caps, source verification, entity allowlists)
 │
 ├─── TEST GATE ───
 │
M-9    ✅  Structural compliance (Part 1: .1-.4 — schema + wiring)
 │         Pipeline writes to graph ✅. Decisions complete lifecycle ✅.
 │         Memory persistence bridge ✅. qualityScore as ΦL proxy ✅.
 │         ⚠️ BUT: ΦL/ΨH/εR not computed from live data — raw observations only.
 │         ⚠️ No hierarchical health aggregation (node → pattern → bloom → system).
 │         ⚠️ Signal conditioning pipeline not connected to execution path.
 │
 ├─── TEST GATE ───
 │
M-9.VA ✅  Partial verification — 14 tasks, 5 models. Gate PASS.
 │         Pipeline self-diagnostic identified 17 issues (5 critical, 12 deferred).
 │
M-9.VA-FIX ✅  5 critical bugs from self-diagnostic
 │         bloomId mismatch, Decision provenance, stale model, quality buckets, orphaned tasks.
 │
M-9.VA-V ✅  Post-fix verification — 10/10 tasks, 6 models, 100% success.
 │         Quality 0.76–0.88 continuous. ~2× speed from structural correctness.
 │
 ├─── TEST GATE ───
 │
M-9    ⏳  Structural compliance (Part 2: .5-.8 — reconciliation + topology + bootstrap)
 │         .5 Test reconciliation + @future conversion                ⏳
 │         .8 Ecosystem bootstrap (roadmap in graph, hypothesis Helixes) ⏳ ← PROMOTED
 │         .6 Model expansion (Llama 4 via Vertex)                    📋
 │         .7a Grammar reference + Lean cleanup                       📋
 │         .7b Morpheme mapping + 3D topology vis                     📋
 │
 ├─── TEST GATE ───
 │
M-9.V  📋  Full verification — end-to-end structural compliance confirmed
 │         Includes: ΦL on milestone Blooms, cross-run analytics, ecosystem queryable.
 │
 ├─── TEST GATE ───
 │
M-16   📋  Constitutional Bloom establishment + morpheme retyping + INSTANTIATES wiring
 │
 ├─── TEST GATE ───
 │
M-17   🔄  Engineering Bridge v3.0 (Line conductivity, superposition, event-driven model, deferred computations)
 │         M-17.1 ✅, M-17.2 ✅, M-17.3–M-17.6 remaining.
 │         ⚠️ This is where ΦL/ΨH/εR computation gaps get documented and fixed.
 │
 ├─── TEST GATE ───
 │
M-21   📋  Bridge Grid Instantiation (spec as queryable graph data)
 │
 ├─── TEST GATE ───
 │
M-8.INT 📋  Architect adaptive routing + agent-as-trigger
 │         CLASSIFY→route. Per-task FMEA advisory. Agent becomes substrate.
 │
 ├─── TEST GATE ───
 │
M-13   📋  UI (graph vis + Opus chat — the agent gets a face)
 │
 ╔═══════════════════════════════════════════════════════
 ║  POST-CRITICAL-PATH — core capabilities
 ╚═══════════════════════════════════════════════════════
 │
M-18   📋  Assayer implementation (4 stages, 4 modes, compliance corpus, FMEA)
 │
 ├─── TEST GATE ───
 │
M-10   📋  Memory operations (full compaction, distillation, institutional knowledge)
 │
 ├─── TEST GATE ───
 │
 ├──── M-11 📋  Research pattern (systematic evidence synthesis)  ┐ parallel
 ├──── M-12 📋  Constitutional evolution (evidence-based amendment) ┘
 │       │
 │       ├─── TEST GATE ───
 │       │
 │       M-14 📋  Self-recursive learning L1-L3 (the system evolves itself)
 │               │
 │               ├─── TEST GATE ───
 │               │
 │               M-15 📋  Pattern Exchange Protocol (federated deployment)
 │
 ╔═══════════════════════════════════════════════════════
 ║  PARALLEL TRACKS
 ╚═══════════════════════════════════════════════════════
 │
M-19   📋  Hypothesis tracking + research pipeline
           Helix nodes created at M-9.8 (now second in Part 2)
           Evidence accumulates from M-9 onwards (automatic)
           Paper readiness assessed from M-11 onwards
           Sandbox pattern from M-13 onwards
 │
M-20   💡  Topology Observation Helix (starts after M-17.4, accumulates indefinitely)
           The system's self-model. Captures topology deltas for empirical discovery.
           Hard deps: M-9.8 ✅, M-17.4. Soft deps: M-10, M-14, M-19.
```

**Every transition through a TEST GATE requires:** gate success per Test Gate Policy. Gate failure → surface to Ro.

---

## The State Dimension Gap

**This section exists because the gap is easy to miss.** The critical path shows M-9 Part 1 ✅, which sounds like the structural thesis is satisfied. It is not. Here's what's connected and what isn't.

### What works (tested, running in production)

| Layer | What | Status |
|-------|------|--------|
| Graph schema | PipelineRun, TaskOutput, Decision, Observation, Resonator, Bloom nodes | ✅ M-9.1 |
| Pipeline → graph | Every task writes TaskOutput + Decision + Observation to Neo4j | ✅ M-9.2 |
| Decision lifecycle | Quality scores flow back to Decision nodes. Thompson reads them. | ✅ M-9.3 |
| Memory bridge | Compaction + distillation checks fire after execution | ✅ M-9.4 |
| Thompson routing | Bayesian posterior updates from real quality data across 20+ models | ✅ M-6 + M-9.3 |
| Human feedback | `feedback.ts` → adjustedQuality on PipelineRun → Thompson reads it | ✅ M-8.4 + M-9.VA-FIX |

### What exists but isn't connected

| Layer | What | Where it lives | What's missing |
|-------|------|----------------|----------------|
| **ΦL computation** | 4-factor composite (axiom_compliance, provenance, usage_success, temporal_stability) | `src/computation/phi-l.ts` | Not fed from pipeline Observations. Pipeline uses `qualityScore` as proxy. |
| **ΨH computation** | λ₂ (structural coherence) + TV_G (runtime friction), EWMA trend, transient/durable decomposition | `src/computation/psi-h.ts` | Not computed for pipeline morphemes. No live λ₂ on the Architect Bloom. |
| **εR computation** | Exploration rate with imperative gradient modulation floor, spectral calibration | `src/computation/epsilon-r.ts` | Computed per-decision but not aggregated to Bloom level. |
| **Signal conditioning** | 7-stage pipeline (debounce→Hampel→EWMA→CUSUM→MACD→hysteresis→threshold) | `src/computation/signals/` | Not connected to execution path. Pipeline writes raw observations, doesn't condition them. |
| **Hierarchical health** | Node → pattern → bloom → system aggregation with topology-aware dampening | Spec: v5.0 §Degradation Cascade Mechanics | Not implemented. ΦL computed per-execution, not aggregated upward. No dampening on propagation path. |
| **Event-triggered review** | 6 trigger types: (1) λ₂ drop on composition change, (2) friction spike (TV_G crosses threshold), (3) cascade activation (degradation reaches 2-level limit), (4) εR spike at composition level, (5) ΦL velocity anomaly (ecosystem-wide shift > 0.05/day), (6) Ω gradient inversion | Spec: v5.0 §Event-Triggered Structural Review | Not wired. ThresholdEvents exist for ΦL boundaries but the 6 spec triggers are not. |
| **Dampening** | Topology-aware with CASCADE_LIMIT=2, HYSTERESIS=2.5× | `src/computation/dampening.ts` | Working in computation layer. Not triggered by live pipeline state changes. |
| **Maturity index** | 4-factor composite (observation_depth, connection_density, component_age, ecosystem_ΦL) | `src/computation/maturity.ts` | Working. Feeds ΦL_effective but only when ΦL is actually computed. |

### The vertical wiring problem

The pipeline writes raw data at the bottom. The computation modules process data in the middle. The hierarchical aggregation propagates results to the top. But there's no vertical connection:

```
     SYSTEM ΦL / ΨH / εR                    ← NOT IMPLEMENTED
          ↑ aggregation (topology-aware dampening, γ_effective)
     BLOOM ΦL / ΨH / εR                     ← NOT COMPUTED
          ↑ aggregation (CASCADE_LIMIT=2, HYSTERESIS=2.5×)
     PATTERN ΦL / ΨH / εR                   ← NOT COMPUTED
          ↑ signal conditioning (7-stage pipeline)
     RAW OBSERVATIONS (qualityScore proxy)   ← THIS IS WHERE WE ARE
          ↑ pipeline writes
     TASK EXECUTION                          ← WORKING

Propagation direction (per v5.0 spec):
  - UPWARD through containment (component → Bloom/Grid)
  - FORWARD through Lines (producer → consumer)
  - NOT backward through Lines, NOT sideways through Resonance
```

### Spec contracts the vertical wiring must satisfy (v5.0)

These contracts define what `@future` tests (M-9.5) must assert and what M-9.V must verify. They are enumerated here because the v6.3 gap description identified *that* a gap exists but not *what the spec requires* to close it.

**ΦL must be the 4-factor composite, not qualityScore:**
```
ΦL = w₁ × axiom_compliance + w₂ × provenance_clarity +
     w₃ × usage_success_rate + w₄ × temporal_stability
where w₁ + w₂ + w₃ + w₄ = 1.0
```
Adjusted by maturity modifier: `ΦL_effective = ΦL_raw × (1 - e^(-k₁ × observations)) × (1 - e^(-k₂ × connections))`. The pipeline currently writes `qualityScore` as a stand-in. The real ΦL requires all four factors computed from Observation data.

**Propagation must be dampened, not raw:**
```
impact_at_container = component_ΦL_drop × component_weight × γ_effective(k)
γ_effective = min(γ_base, safety_budget / k)
```
Where `γ_base = 0.7`, `safety_budget = 0.8`, `k` = branching factor. Guarantees spectral radius `μ = k × γ ≤ 0.8 < 1` (subcritical) for all topologies. Cascade limit = 2 containment levels. Algedonic bypass at `ΦL < 0.1` (`γ = 1.0`). Recovery at `2.5×` slower rate (hysteresis).

**6 event triggers must fire from live pipeline state:**
1. λ₂ drop on composition change (structural coherence weakened)
2. Friction spike — TV_G crosses threshold, sustained beyond Refinement Helix temporal constant
3. Cascade activation — degradation reaches 2-level limit
4. εR spike at composition level (confidence collapsed)
5. ΦL velocity anomaly — ecosystem-wide shift > 0.05/day
6. Ω gradient inversion — any imperative gradient turns negative after sustained positive

**ΨH requires two-component computation from live graph:**
- Component 1: λ₂ (Fiedler value of composition subgraph Laplacian)
- Component 2: TV_G (Graph Total Variation measuring signal propagation smoothness)
- `ΨH = structural_weight × normalize(λ₂) + runtime_weight × (1 - friction)`

**Where this gets fixed:** M-17.4 documents the interface between computation layer and execution layer. M-9.V verifies the connection works. The implementation likely spans M-9.V through M-10, with M-17 providing the specification.

---

## Completed Milestones (for reference)

### M-1: Foundation ✅
Neo4j schema, type system, ΦL/ΨH/εR computation, dampening, cascade prevention, adaptive thresholds, constitutional rule engine, memory types.

### M-2: Signal Conditioning ✅
7-stage pipeline. Nelson Rules. Structural review + triggers. Immune response. **Do not modify** unless fixing a specific documented bug.

### M-4: Patterns in Core ✅
Thompson Router, DevAgent, Architect — live in the core library.

### M-5: Architect Bootstrap ✅
SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT.

### M-6: Thompson Sampling Integration ✅
Live model selection via Bayesian posterior updates. Decision nodes in graph.

### M-7: First Self-Examination ✅
Dampening fix, observer removal, reconciliation between spec and code.

### M-7B: Spec Review & Axiom Uplift ✅
Three pipeline runs. Key findings: Bridge View Principle, Dimensional Collapse, Axiom Dependency Declaration.

### M-8A: Report Consolidation & Compliance Review ✅
4 validated, 6 reframed, 2 rejected.

### M-8B: Comprehensive Lean Review ✅
SIPOCs, NFRs, gap analysis, value stream. Produced FR-1 through FR-15.

### M-8C: Codex-Native Topology Refactor ✅ (PARTIAL — see corrections below)
Pre-flight auth gate, file context injection, directory metadata, jidoka escalation, hallucination detection — all complete. **Baselines at M-8C.V:** 813 tests, 193 exports, commit `20812f5`.

**Corrections from v4 roadmap:**
| Sub | v4 Claimed | Actual Status |
|-----|-----------|---------------|
| M-8C.1 | ✅ Pipeline output as graph nodes | ❌ Output goes to `docs/pipeline-output/` as markdown files |
| M-8C.2 | ✅ Multi-dimensional Thompson learning | ⚠️ Quality scoring exists but full multi-objective (quality × cost × latency) not wired |
| M-8C.3 | ✅ Cross-run graph queries | ❌ No graph nodes to query — depends on M-8C.1 |

These became M-9.1–9.4.

### M-7C: Grammar Refactor ✅
Agent → Seed, Pattern → Bloom, relationship renames, ELIMINATED_ENTITIES updated.

### M-8: Optimisation Runs ✅ (infrastructure + first data)
| Sub | Description | Status |
|-----|-------------|--------|
| M-8.R0 | Architect review of M-7C refactor | ✅ |
| M-8.R1 | Axiom consistency review | ✅ (context starvation — models fabricated axiom names) |
| M-8.R2 | Thompson router audit | ✅ (false negatives from single-file scope) |
| M-8.R3 | ΦL computation verification | ✅ (clean — properly scoped context) |
| M-8.4 | Human feedback CLI | ✅ |
| M-8.DA | DevAgent self-hosting CLI | ✅ |

**Key finding from R1-R3:** Pipeline works when context is properly scoped. Fabrication occurs when source material is truncated or missing. This directly motivated M-8.QG.

### M-8.QG: Quality Gates ✅
Context caps increased, source verification gate, canonical entity allowlists, cross-task consistency. **Exit:** 1080 tests, commit `e26f467`.

**Current test baseline (as of M-9.VA-V, 2026-03-04):**

| Metric | Count |
|--------|-------|
| Total tests | 1182 |
| Passed | 1163 |
| Failed | 0 |
| Skipped | 1 |
| Todo (future-scope) | 18 |
| Exports | ~242 |

**Todo tests (future-scope — governance gap, must be converted in M-9.5):**
- `dev-agent.test.ts` — 7 todos (DevAgent.run() integration)
- `hierarchical-health.test.ts` — 6 todos (computeHierarchicalHealth Neo4j integration)
- `immune-response.test.ts` — 5 todos (evaluateAndReviewIfNeeded orchestration)

**Governance gap:** These 18 `.todo()` tests are registered by Vitest but never execute. Per Test Gate Policy, future-requirement tests should be real implementations that run and fail, annotated with `@future(M-N)`, and reported as a remaining-work metric. M-9.5 converts all 18 to real failing tests with a separate vitest filter/script.

---

## Active Milestones

### M-9: Structural Compliance ⏳

*The system's thesis is "state is structural." This milestone makes it true for the pipeline itself. Pipeline output becomes graph nodes. Task outputs feed ΦL. Decisions complete their lifecycle. Memory strata populate from real execution data.*

**Why this is the critical blocker:** Every feature downstream — cross-run learning, Thompson multi-objective optimisation, Retrospective pattern, self-recursive learning — requires structured data in the graph. Without M-9, the system computes health correctly for models and patterns but has no health data for its own analytical output. The pipeline is the system's most complex pattern, and it's the only one not structurally represented.

**Structure:** M-9 is split into two parts with verification checkpoints between them. Part 1 (M-9.1–9.4) wires the pipeline to the graph. M-9.VA verifies, M-9.VA-FIX patches, M-9.VA-V confirms. Part 2 (M-9.5–9.8) reconciles tests, expands models, maps the grammar, and bootstraps the ecosystem.

---

#### Part 1: Schema + Wiring (M-9.1–9.4) — COMPLETE

##### M-9.1: Neo4j Schema for Pipeline Topology ✅

Resonator nodes for each pipeline stage (SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT). PipelineRun nodes (Stratum 2). TaskOutput nodes (Stratum 2). Lines connecting Resonator → PipelineRun → TaskOutput. Bloom for the Architect pattern containing its Resonators.

**Status:** ✅ Complete. Commits `df76a6a`→`7d70666`. +21 tests (→ 1101). Schema constraints (2), indexes (6), CRUD functions (9), `ARCHITECT_STAGES` constant. `verifySchema()` updated (15 constraints, 14 indexes). Relationship types: `EXECUTED_IN`, `PRODUCED`, `CONTAINS`, `PROCESSED`.

##### M-9.2: Pipeline Executor Writes to Graph ✅

Each task execution writes a TaskOutput node with the task result, model used, quality score, and hallucination detection results. PipelineRun node created at plan start, updated at plan end with aggregate stats. Markdown files remain as human-readable cache; the graph is the source of truth. Opt-in via `graphEnabled` flag. All graph writes non-fatal (try/catch with warn).

**Status:** ✅ Complete. Commits `9680893`→`b4a0850`. +7 tests (→ 1108). Async writeManifest.

##### M-9.3: Decision Lifecycle Completion ✅

Decision → Outcome: Task quality scores flow back to the Decision node that selected the model. This closes the Thompson learning loop with real quality data. TaskOutput → Observation: Each TaskOutput generates an Observation that feeds ΦL computation for the Architect Bloom (currently as proxy — see State Dimension Gap). Uses `recordObservation()` not `writeObservation()` — executor lacks PatternHealthContext, ΦL recomputation deferred to M-9.VA/M-9.V.

**Status:** ✅ Complete. Commits `3a7261d`→`3815dee`. +25 tests (→ 1133). `updateDecisionQuality`, `assessTaskQuality`, `recordObservation` per task, `getPipelineStageHealth`/`getPipelineRunStats`.

##### M-9.4: Memory Persistence as Intended ✅

Stratum 2 (Observations) persist via `writeObservation()` with exponential decay (`e^(-λ × age)`, 14-day half-life). Stratum 3 (Distillations) trigger on structural conditions (observation count + variance detection). `processMemoryAfterExecution()` bridges the executor to the memory layer. Stratum 4 (Institutional Knowledge) write path exists but not in scope — M-10 territory. `qualityScore` used as ΦL proxy in distillation — pragmatic bridge until full conditioning context available.

**Status:** ✅ Complete. Commits `af18c87`→`3f86f2e`. +43 tests (→ 1176). 7 graph queries (compaction + distillation), 3 bridge functions (`runCompaction()`, `checkAndDistill()`, `processMemoryAfterExecution()`), barrel exports updated.

---

#### M-9.VA: Partial Verification ✅

*Run the Architect pipeline against the graph-wired system. Confirm the structural wiring from M-9.1–9.4 works before building Part 2 on top of it.*

**Execution:** Single DevAgent session — prep → run → verify → document.

**Phase A (Prep) ✅:** `graphEnabled: true` + `architectBloomId: "architect"` wired (`6e48908`). `processMemoryAfterExecution()` wired into executor (success + failure paths). `verify-graph-state.ts` extended with 8 M-9 verification queries + `--run-id` filter.

**Phase B (Run) ✅:** Live pipeline run with analytical intent ("deep review of M-9.1–9.4 structural wiring"). 14 tasks across 5 models (Claude Opus 4.6, Claude Sonnet 4.5, Gemini 2.5 Pro, Gemini 2.5 Flash, Mistral Large). Thompson sampling routed all tasks. 115K chars total output.

**Phase C (Verify) ✅:** Verification script confirmed: PipelineRun node completed (14 tasks, quality 0.64, 5 models). 14/14 TaskOutput nodes with quality scores. 9/14 TaskOutputs linked to DISPATCH (5 orphaned — fixed in M-9.VA-FIX). 14 Decision nodes with non-null qualityScore. 14 Observation nodes linked to Architect Bloom. Analytics queries return data. Distillation triggered (1 distillation, 14 observations). Compaction ran (0 pruned — all recent).

**Phase D (Document) ✅:** Gate decision: PASS.

**Deep review findings (pipeline self-diagnostic):** The pipeline's own analytical output identified 17 issues in the structural wiring. 5 classified as critical (M-9.VA-FIX), 12 absorbed into M-9.5. This self-diagnostic capability — the pipeline producing root cause analysis of its own architecture from its own structural output — is the strongest validation of "state is structural" to date.

**Exit criteria:** ✅ The system can answer "how is my pipeline performing?" from a Cypher query, not from reading markdown files. 1176 tests passing at verification time.

---

#### M-9.VA-FIX: Pipeline Self-Diagnostic Bug Fixes ✅

*5 critical bugs identified by the pipeline's own analytical output during M-9.VA verification.*

| # | Bug | Fix | Commit | Tests |
|---|-----|-----|--------|-------|
| 1 | `architectBloomId` = `"bloom_architect"` but Bloom node ID = `"architect"` → phantom Bloom, broken EXECUTED_IN/OBSERVED_IN | Standardise to `"architect"`, remove fuzzy matching, add phantom cleanup | `8b20029` | 1176 |
| 2 | `DecisionProps` missing `runId`/`taskId` → `recordHumanFeedback` WHERE clause always returns zero rows → human feedback loop completely broken | Add `runId?`/`taskId?` to `DecisionProps`, thread through `SelectModelRequest` → `selectModel` → `recordDecision`, update executor call sites | `aa61e92` | 1178 (+2) |
| 3 | Stale `claude-opus-4-1` model seed → 404, wasting Thompson samples | Remove seed entry, clean Thompson prior regex | `bc57d1a` | 1178 |
| 4 | `assessTaskQuality` producing discrete buckets (0.40/0.50/0.70) → Thompson learning signal near-zero | V2 continuous scoring: logistic duration (sigmoid @ 60s), linear length ramp (0–15K chars), proportional hallucination penalty | `7603762` | 1180 (+2) |
| 5 | Failed tasks not linked to DISPATCH Resonator → 5/14 TaskOutputs orphaned from topology | Call `linkTaskOutputToStage` on failure path | `2e93194` | 1182 (+2) |
| 6 | Verification report inaccuracies | 5 corrections applied | `1e1d4d5` | 1182 |

**Silver lining:** None of these five items threatened architecture, milestone sequence, or core thesis. Every fix was wiring, not design flaw. The system foundations held.

**Remaining 12 issues absorbed into M-9.5:** 11 missing query functions, 3 missing NOT NULL constraints, relationship type registry, dead read edge case, consistency check contradictions.

---

#### M-9.VA-V: Post-Fix Verification ✅

*Re-run pipeline to confirm M-9.VA-FIX corrections in production.*

**Run:** `2026-03-04T09-26-32`. 10 tasks, 6 models (Opus 4.5, Opus 4.6, Sonnet 4, Haiku 4.5), 100% success rate.

| Fix | Result |
|-----|--------|
| bloomId = "architect" | ✅ No phantom. EXECUTED_IN → `architect`. |
| Decision runId/taskId | ✅ 11/11 non-null. |
| Stale opus-4-1 removed | ✅ Zero routing. Inert Seed persists (cleanup in M-9.5). |
| Continuous quality scores | ✅ stddev=0.0397, 10 unique values, range 0.76–0.88. |
| Failed tasks → DISPATCH | ✅ (partial) 10/10 linked. No failures to test failure path. |

**Performance vs M-9.VA:** 100% success (was 64%), quality avg ~0.82 (was 0.49), ~2× speed. All gains from structural correctness, not optimisation.

**Exit criteria:** ✅ All 5 fixes verified. 1182 tests. `verify-graph-state.ts` 7/7. Commit `d4facec`.

---

#### Part 2: Reconciliation + Bootstrap + Topology (M-9.5, 9.8, 9.6, 9.7)

**Reordered in v6.3:** M-9.8 (Ecosystem Bootstrap) promoted to immediately after M-9.5. Rationale: the roadmap is the project's most-edited artifact and the only one not structurally represented. Every hour spent hand-editing this markdown document instead of mutating the graph is the system failing to eat its own dogfood. The grammar reference (M-9.7a) was originally the "bill of materials" for M-9.8, but the morpheme mapping table already exists — Bloom for milestones, Seed for tasks, Observation for test results. M-9.8 can proceed with known types. M-9.7a becomes a completeness pass afterward.

##### M-9.5: Test Reconciliation ⏳

The structural changes in M-9.1–9.4 and fixes in M-9.VA-FIX have established the graph wiring. The reconciliation task now has four dimensions:

**Dimension 1: In-scope test reconciliation.** Run full test suite, catalogue any failures from structural changes. Categorise each: (a) test assumed old write path — update, (b) test verified stub behaviour that's now real — update, (c) genuine regression — fix code. Resolve all within milestone.

**Dimension 2: Convert 18 `.todo()` tests to real `@future(M-N)` tests.**

| File | Count | Target Milestone | Spec contracts to assert |
|------|-------|-----------------|--------------------------|
| `tests/conformance/dev-agent.test.ts` | 7 | `@future(M-10)` — DevAgent.run() integration | Correction helix, constitutional check, lifecycle hooks, Thompson memory |
| `tests/conformance/hierarchical-health.test.ts` | 6 | `@future(M-9.V)` — computeHierarchicalHealth Neo4j integration | **Per v5.0 spec:** 4-factor ΦL computation (not qualityScore proxy), topology-aware dampening (`γ_effective`), CASCADE_LIMIT=2, hysteresis 2.5× on recovery, upward aggregation through containment + forward through Lines. See §State Dimension Gap "Spec contracts" for formulas. |
| `tests/conformance/immune-response.test.ts` | 5 | `@future(M-18)` — evaluateAndReviewIfNeeded orchestration | **Per v5.0 spec:** 6 event-triggered structural review triggers (λ₂ drop, friction spike, cascade activation, εR spike, ΦL velocity anomaly, Ω gradient inversion) → structural review → diagnostic output. See §State Dimension Gap "Spec contracts" for trigger definitions. |

Each `.todo()` becomes a real test that uses mock graph layer, asserts the contract that *should* exist when the target milestone completes (per v5.0 spec, not per current implementation), is annotated with `@future(M-N)`. The agent must read the v5.0 spec sections: "Formal Calculations", "Degradation Cascade Mechanics", and "Event-Triggered Structural Review" before writing these tests.

**Dimension 3: `@future` test runner.** Vitest configuration or script that runs only `@future` tests, reports failure count as remaining-work metric, does NOT block the gate.

**Dimension 4: Absorb 12 M-9.VA-FIX deferred items.** 11 missing query functions, 3 missing NOT NULL constraints, relationship type registry, dead read edge case, verification report cleanup.

| Agent | Model |
|-------|-------|
| 🤖 Agent (mechanical) | Sonnet 4.6 or Codex 5.3 |

**Exit criteria:** Gate success. 18 future tests converted. Separate `@future` runner reports remaining-work count. 12 deferred items resolved.

##### M-9.8: Ecosystem Bootstrap — Operating in the Codex ⏳ (after M-9.5)

The transition from building the system to building *with* the system. **Promoted from end of Part 2 to immediately after M-9.5** — this is the single highest-leverage change for project sustainability.

**What goes into the graph:**
- This roadmap becomes a Bloom containing milestone Blooms. `@future(M-{N})` becomes a `SCOPED_TO` relationship.
- Process maps and SIPOCs become Institutional Knowledge (Stratum 4).
- FMEA records become Institutional Knowledge (Stratum 4).
- Assayer compliance corpus becomes a Grid.
- Test results become Observations on test Seeds. Test suite pass rates become ΦL on test Blooms. Phase health becomes ΦL on milestone Blooms.
- Hypothesis Helix nodes for H-1, H-2, H-5 (trackable now — see M-19).

**What changes about how we work:**
- Architect SURVEY reads the roadmap from the graph, not markdown.
- Plan edits are graph mutations.
- "Where are we?" answered by `MATCH (m:Bloom {type: "milestone"}) RETURN m.name, m.phiL, m.status ORDER BY m.sequence`.
- **No more multi-hour markdown editing sessions that lose detail through rewrite.**

**What doesn't change yet:**
- Architect still needs human trigger (agent CLI). Autonomous dispatch is M-8.INT.
- Assayer is types only until M-18. But Grid structure exists for when it activates.

| Agent | Model |
|-------|-------|
| 🏗️ Architect (structural design) | Opus 4.6 |
| 🔧 DevAgent (graph wiring) | Sonnet 4.6 |
| 👤 Ro (SIPOC validation) | — |

**Exit criteria:** Roadmap queryable from graph. Test Seeds connect to milestone Blooms. Architect SURVEY reads from Neo4j. Pipeline run against roadmap produces structural output.

##### M-9.6: Model Expansion — Llama 4 📋

Add Llama 4 (Meta) to the Thompson router via Vertex AI Model Garden. Seed with uniform priors — Thompson exploration begins automatically. Bootstrap entry + pre-flight auth verification, not infrastructure work. Gemma deferred until deploy infrastructure justified.

| Agent | Model |
|-------|-------|
| 🔧 DevAgent | Sonnet 4.6 |

**Exit criteria:** Llama 4 Seed node in Neo4j. Pre-flight auth passes. Thompson routes to it on exploratory selections.

##### M-9.7a: Grammar Reference Document 📋

**There is currently no single document listing every structural element in the Codex grammar and its implementation status.** The vocabulary is scattered across v5.0 spec (draft), Engineering Bridge, Lean process maps (stale), and CLAUDE.md. Before mapping anything to morphemes, produce a canonical grammar reference:

| Category | Elements | Source | Implementation Status |
|----------|----------|--------|-----------------------|
| Morphemes (6) | Seed, Line, Bloom, Resonator, Grid, Helix | v5.0 §The Six Morphemes | Graph labels ✅, full structural identity varies |
| State dimensions (3) | ΦL (luminosity), ΨH (harmonic signature), εR (exploration rate) | v5.0 §State Dimensions + §Formal Calculations | Computation ✅, pipeline feeding ❌ (see State Dimension Gap) |
| Grammar rules (5) | G1 Proximity, G2 Orientation, G3 Containment, G4 Flow, G5 Resonance | v5.0 §Grammar | Tests exist, structural enforcement partial |
| Axioms (8) | A1 Fidelity through A4, A6 through A9 Comprehension Primacy (A5 removed) | v5.0 §Axioms | Constitutional rules ✅, test coverage varies |
| Anti-patterns (10) | Monitoring Overlay through Pathological Autopoiesis | v5.0 §Anti-Patterns, CLAUDE.md | Detection ✅ (hallucination system), structural prevention partial |
| Heuristic imperatives (3) | Ω₁ reduce suffering, Ω₂ increase prosperity, Ω₃ increase understanding | v5.0 §Heuristic Imperatives | Defined ✅, gradient computation ❌ (aspirational) |
| Operational records | Decision, Observation, ThresholdEvent, PipelineRun, TaskOutput | Bridge, schema.ts | ✅ All operational records now write to graph (M-9.1–9.4) |
| Strata (4) | Ephemeral→Observational→Distilled→Institutional | v5.0 §Memory Topology | Types ✅, Strata 2-3 bridge ✅ (M-9.4), Stratum 4 ❌ (M-10) |

This reference becomes the seed for M-16.3's Assayer compliance corpus. It's the "bill of materials" for M-9.7b's morpheme mapping and M-9.8's ecosystem bootstrap.

**Lean process maps status:** M-8B audit found 8 violations (Observer as separate entity was root cause). Corrections agreed but documents not updated. Fix as part of this task — remove Observer, Signal Pipeline, and Health Computation as separate boxes. This is Stratum 4 Institutional Knowledge cleanup.

| Agent | Model |
|-------|-------|
| 🏗️ Architect | Opus 4.6 |

**Exit criteria:** Single canonical document listing every grammar element with implementation status. Lean process maps corrected per audit findings.

##### M-9.7b: Morpheme Mapping + 3D Topology Visualisation 📋

With the grammar reference from M-9.7a as the bill of materials, map every system element to its morpheme type and produce an interactive 3D visualisation:

| Element | Morpheme / Node Type | Rationale |
|---------|---------------------|-----------|
| Pipeline stages (SURVEY, DECOMPOSE, etc.) | Resonator | Atomic processing units within a pattern |
| Data flows between stages | Line | Carry data between Resonators |
| Test suites | Bloom | Scoped compositions of test Seeds |
| Individual tests | Seed (seedType: "validator") | Atomic validation units with pass/fail Observations |
| Milestones/phases | Bloom | Scoped compositions containing task and test Seeds |
| Tasks within milestones | Seed (seedType: "task") | Atomic work units |
| Compliance corpus | Grid | Read-only structural reference (Assayer reads at runtime) |
| Thompson learning loops | Helix | Learning cycles that refine over time |
| Signal conditioning stages | Resonator | Already functional, need graph representation |
| The roadmap itself | Bloom containing milestone Blooms | The plan is a structural entity, not a document |
| Process maps / SIPOCs | Institutional Knowledge (Stratum 4) | Design documents consumed by SURVEY, not runtime morphemes |
| FMEA records | Institutional Knowledge (Stratum 4) | Written by Architect, reconciled by Assayer post-flight |

**3D topology visualisation:** Interactive HTML (Three.js or equivalent) showing morpheme topology — Blooms as containers, Seeds as nodes, Lines as connections, Helixes as spirals, Grids as reference planes. Temporary scaffolding until M-13 UI replaces it.

| Agent | Model |
|-------|-------|
| 🏗️ Architect (mapping) | Opus 4.6 |
| 🔧 DevAgent (schema + vis) | Sonnet 4.6 |

**Exit criteria:** Every element mapped to Neo4j node type with at least one instance. Cypher answers "which tests are scoped to M-9?" and "what is the ΦL of the M-9 milestone Bloom?" 3D vis renders from live graph data.

---

### M-9.V: Full Verification Run 📋

*Run the Architect pipeline against the fully restructured system. Verify that output goes to graph, decisions complete their lifecycle, the system can query its own execution history, and the ecosystem bootstrap is structurally sound.*

- TaskOutput nodes created for every task
- PipelineRun has aggregate stats
- Decision nodes have quality outcomes
- Observation nodes feed real 4-factor ΦL computation (v5.0: `w₁ × axiom_compliance + w₂ × provenance_clarity + w₃ × usage_success_rate + w₄ × temporal_stability`, adjusted by maturity modifier) — not qualityScore proxy
- Signal conditioning (7-stage pipeline) runs on live Observation data, not raw values
- Hierarchical health aggregates upward with topology-aware dampening (`γ_effective = min(γ_base, safety_budget / k)`, CASCADE_LIMIT=2, hysteresis 2.5×)
- ΨH computed from live graph properties (λ₂ + TV_G)
- Cross-run Cypher returns meaningful results ("compare this run's quality to last 3")
- Milestone Blooms queryable with correct ΦL
- Human feedback recorded and verified
- All 6 `@future(M-9.V)` hierarchical-health tests from M-9.5 now pass (promoted to in-scope)

| Agent | Model |
|-------|-------|
| 🏗️ Architect | Thompson-routed |
| 👤 Ro | Review, accept/reject |

**Exit criteria:** "How is my pipeline performing?" and "What is the health of M-9?" answerable from Cypher, not markdown.

---

### M-16: Constitutional Bloom Establishment + Fabric 📋

*v5.0 is canonised (`e1f6d88`). The Morpheme Identity Map identifies the correct typings. The Concurrent Pattern Topology defines the execution model. Now the graph needs the organisational core — the Constitutional Bloom that every instance connects to via INSTANTIATES.*

| Sub | Description | Agent | Model |
|-----|-------------|-------|-------|
| M-16.1 | Constitutional Bloom creation — morpheme definitions, axioms, grammar rules, imperatives, state dimensions, anti-patterns, escalation trajectories | 🤖 Agent `[NO-PIPELINE]` | Sonnet 4.6 |
| M-16.2 | INSTANTIATES wiring — every existing node gets an INSTANTIATES Line to its definition in the Constitutional Bloom | 🤖 Agent `[NO-PIPELINE]` | Sonnet 4.6 |
| M-16.3 | Morpheme retyping — Agent→Resonator, PipelineRun→Bloom, Decision→Seed, Observation→Seed per Identity Map | 🤖 Agent `[NO-PIPELINE]` | Sonnet 4.6 |
| M-16.4 | Creation layer enforcement — atomic INSTANTIATES in every creation function, `createContainedResonator` added | 🔧 DevAgent | Sonnet 4.6 |
| M-16.5 | Codebase rename — Correction→Refinement in types, tests, docs, CLAUDE.md | 🤖 Agent `[NO-PIPELINE]` | Sonnet 4.6 |
| M-16.6 | Governance docs update — CLAUDE.md (8 axioms, v5.0 refs, Refinement terminology), ELIMINATED_ENTITIES | 🤖 Agent | Sonnet 4.6 |

**M-16.1: Constitutional Bloom creation.** `[NO-PIPELINE]` — pure mechanical graph mutation from v5.0 §Constitutional Coupling. Creates one Bloom node containing: 6 morpheme definition Seeds, 8 axiom Seeds (A1–A4, A6–A9), 5 grammar rule Seeds (G1–G5), 3 imperative Seeds (Ω₁–Ω₃), 3 state dimension definition Seeds (ΦL, ΨH, εR), 10 anti-pattern catalogue Seeds, 6 escalation trajectory Seeds. Every Seed has content, provenance, seedType, status: "active". All MERGE-based, idempotent. CONTAINS relationships from the Constitutional Bloom to each Seed.

**M-16.2: INSTANTIATES wiring.** Every existing node gets an INSTANTIATES Line to the appropriate morpheme definition Seed in the Constitutional Bloom. This makes Line conductivity Layer 1 (morpheme hygiene) enforceable.

**M-16.3: Morpheme retyping.** Per Morpheme Identity Map v1.0: `Agent` → `Resonator`, `PipelineRun` → `Bloom`, `Decision` → `Seed`, `Observation` → `Seed`. Update all query functions and TypeScript interfaces.

**M-16.4: Creation layer enforcement.** Every `createContained*` function atomically creates the INSTANTIATES Line. New `createContainedResonator` function. After this, creating a morpheme without connecting it to the constitution becomes structurally impossible.

**M-16.5: Codebase rename.** Correction → Refinement in types, test names, CLAUDE.md. ~30 references.

**M-16.6: Governance docs.** CLAUDE.md: 8 axioms, v5.0 ref, Refinement terminology, updated anti-pattern table. ELIMINATED_ENTITIES: add "Correction" as eliminated term.

**Exit criteria:** Constitutional Bloom exists in Neo4j with all definition Seeds. Every node has INSTANTIATES. All mistypings corrected. Creation functions enforce INSTANTIATES atomically. Codebase uses v5.0 terminology.

---

### M-17: Engineering Bridge v3.0 🔄

*The Engineering Bridge is stale (v2.0 predates v5.0). Three formulas identified as incorrect in M-8A. v5.0 moved superposition mechanics here. Line conductivity needs implementation detail. Signal conditioning stages need morpheme grounding. Build experience from 6 months not captured.*

| Sub | Description | Agent | Model |
|-----|-------------|-------|-------|
| M-17.1 | Stale formula audit + v5.0 absorption | 🏗️ Architect | Opus 4.6 |
| M-17.2 | Bridge View Principle codification | 🏗️ Architect | Opus 4.6 |
| M-17.3 | Line conductivity implementation detail (3-layer evaluation in Neo4j/TypeScript, caching, invalidation) | 🏗️ Architect | Opus 4.6 |
| M-17.4 | Superposition operational mechanics (from v5.0 — instance lifecycle, collapse, persistence) | 🏗️ Architect | Opus 4.6 |
| M-17.5 | Event-driven execution model (from Concurrent Pattern Topology v3 — TypeScript event handlers, Neo4j write sequencing, concurrency) | 🏗️+🔧 | Opus + Sonnet |
| M-17.6 | Build experience addendum + deferred computation details | 🏗️ Architect | Opus 4.6 |

**M-17.1:** Review all Bridge formulas against v5.0 and implementation. Fix 3 known stale formulas. Absorb v5.0 concepts not in Bridge v2.0: Line conductivity (conceptual), Remedy Archive mechanics, dimensional profiles, Refinement (not Correction) terminology. Apply Bridge View Principle: every formula is a pure function of grammar-defined morpheme states and axiom-defined parameters.

**M-17.2: Bridge View Principle Codification.** Discovered during M-8A t15:

> "Every Engineering Bridge formula MUST be expressible as a pure function of grammar-defined morpheme states and axiom-defined parameters. No Bridge formula may introduce state, thresholds, entities, or temporal behavior not grounded in the symbolic grammar."

This single principle resolved nine M-8A recommendations (F-2, F-4, F-7, AI-03, AI-07, AI-09, C-03, C-07, C-10). Codification means: normative constraint in spec, compliance test definition, Assayer corpus entry, retroactive audit, CLAUDE.md constraint. This is the highest-value single architectural constraint discovered in the project.

**M-17.3: Line Conductivity Implementation.** v5.0 defines the three-layer circuit model conceptually. The Bridge must specify: how each layer evaluates in Neo4j (Cypher patterns for hygiene check, shape validation, friction computation), TypeScript interfaces for conductivity results, caching strategy (re-evaluate on endpoint property change, cache between), invalidation triggers, and the relationship between conductivity and the existing signal conditioning pipeline.

**M-17.4: Superposition Operational Mechanics.** v5.0 moved superposition mechanics from the spec to the Engineering Bridge. Must specify: instance creation lifecycle, concurrent execution governance per instance, collapse Resonator mechanics (selection vs. racing vs. synthesis), non-selected output persistence as Stratum 2 records, interaction with Thompson sampling posteriors.

**M-17.5: Event-Driven Execution Model.** From Concurrent Pattern Topology v3 §What Changes From the Current Implementation. Must specify: TypeScript event handler architecture for Resonator activation on graph events, Neo4j write sequencing (atomic per-Resonator transactions), concurrency management, how the orchestrator (`hybridAgent.ts`) dissolves into data dependency resolution. This is the Bridge-level specification that enables the CPT's concurrent model.

**M-17.6: Build Experience + Deferred Computations.** Document build experience — Thompson informed priors, context-blocked posteriors, exploration decay, hallucination detection, governance files. Plus deferred computation details:

| Computation | Implementation | Bridge Documented |
|-------------|---------------|-------------------|
| ΨH temporal decomposition (EWMA trend, friction_transient, friction_durable) | ✅ G-1.2/G-1.3 | ❌ |
| ΨH hypothetical state (projected ΨH for proposed changes) | ⚠️ Verify | ❌ |
| εR spectral calibration table (spectral ratio → minimum εR floor) | ⚠️ Verify | ❌ |
| εR floor = max(gradient_term, spectral_term) | ⚠️ Verify | ❌ |
| Signal conditioning stage parameters (all 7 stages) | ✅ G-2 | Partial |
| ΦL temporal_stability (4th factor, ring buffer) | ✅ G-1.1 | ❌ |

**This is also where the State Dimension Gap gets addressed.** The vertical wiring from pipeline observations → signal conditioning → ΦL/ΨH/εR computation → hierarchical aggregation needs to be specified in the Bridge before it can be implemented.

The vertical wiring interface must specify (per v5.0 spec):

| Interface Point | From | To | What flows |
|----------------|------|-----|------------|
| Observation → Conditioning | `src/graph/queries.ts` (raw Observations) | `src/computation/signals/` (7-stage pipeline) | Raw metric values enter debounce→Hampel→EWMA→CUSUM→MACD→hysteresis→threshold |
| Conditioning → ΦL | Signal conditioning output | `src/computation/phi-l.ts` | Conditioned values feed 4-factor ΦL |
| ΦL → Maturity | Raw ΦL | `src/computation/maturity.ts` | `ΦL_effective = ΦL_raw × maturity_factor` |
| Node → Container | Component ΦL_effective | Parent Bloom ΦL | Dampened propagation: `γ_effective = min(0.7, 0.8/k)`, CASCADE_LIMIT=2, algedonic bypass at ΦL < 0.1 |
| Graph → ΨH | Live graph Laplacian | `src/computation/psi-h.ts` | λ₂ + TV_G → two-component ΨH |
| Line → Conductivity | Endpoint properties | Line conductivity cache | 3-layer evaluation: hygiene, grammar, contextual fitness |
| State changes → Event triggers | ΦL/ΨH/εR changes | Event-triggered structural review | 6 triggers per v5.0 §Event-Triggered Structural Review |
| Recovery → Hysteresis | Improving ΦL | Dampening layer | Recovery at 2.5× slower rate than degradation |

---

### M-8.INT: Architect Adaptive Routing 📋

*The Architect's CLASSIFY stage becomes the routing decision point:*

| Task Profile | Route |
|-------------|-------|
| Complex analytical (spec review, architecture assessment) | Full Architect pipeline: SURVEY→DECOMPOSE→...→ADAPT |
| Scoped coding task with clear acceptance criteria | CLASSIFY → Assayer advisory (per-task FMEA) → DevAgent → Assayer gate |
| Structural validation (does this change comply?) | CLASSIFY → Assayer (advisory or gate mode) |
| Simple mechanical (rename, format, config change) | Straight to Thompson router → model execution |
| Post-session audit | Assayer post-flight mode (aggregate validation + FMEA reconciliation) |

**Per-task FMEA advisory** fills the gap between plan-level FMEA and post-flight reconciliation. Before dispatch, Assayer advisory answers: "given this task and the compliance corpus, what are the likely failure modes?"

The agent becomes trigger and monitor: human provides intent → agent triggers Architect → Architect CLASSIFYs and routes → agent monitors → human provides feedback. The agent doesn't decide how, what model, or if compliant. The agent is substrate.

| Sub | Description | Agent | Model |
|-----|-------------|-------|-------|
| M-8.INT.1 | CLASSIFY routing logic | 🏗️+🔧 | Opus 4.6 |
| M-8.INT.2 | Architect DISPATCH → DevAgent SCOPE handoff | 🔧 DevAgent | Sonnet 4.6 |
| M-8.INT.3 | DevAgent results → Architect REVIEW feedback | 🔧 DevAgent | Sonnet 4.6 |
| M-8.INT.4 | Assayer invocation (advisory + gate) | 🏗️+🔧 | Opus 4.6 |
| M-8.INT.5 | Agent-as-trigger interface | 🔧 DevAgent | Sonnet 4.6 |
| M-8.INT.6 | Model retirement preserves capabilities (R-10) | 🔧 DevAgent | Sonnet 4.6 |

**Exit criteria:** Human provides intent string. Architect produces plan. DevAgent executes coding tasks. Assayer evaluates validation tasks. Results flow through graph. Agent surfaces results.

---

### M-13: UI 📋

*Graph visualisation + Opus chat interface. Lens on the graph, not a layer above it.* Blocked by M-9 (needs real structured data). Interaction design informed by M-9.7b 3D vis.

---

## Post-Critical-Path Milestones

*These are core system capabilities, not optional features. They are sequenced after M-13 because they depend on M-9 (structural foundation), M-16 (spec), and M-8.INT (pattern integration). But they are committed work, not deferred aspirations.*

### M-18: Assayer Pattern Implementation 📋

Full four-stage pipeline (CLASSIFY→DECOMPOSE→VALIDATE→SYNTHESISE), four invocation modes (advisory, gate, post-flight, historical), compliance corpus management, DevAgent gate integration. Design complete at `docs/specs/09_codex-signum-assayer-pattern-design.md`. Depends on M-16.3 (types) and M-9 (structured data for historical mode).

**Why first after critical path:** The Assayer is quality enforcement. Every subsequent milestone benefits from structural compliance checking.

### M-10: Memory Operations 📋

Full compaction, distillation flow coordinator. M-9.4 implements the minimum viable path (Strata 2-3 write/read). M-10 completes:
- Stratum 2 compaction (λ-decay with configurable half-life, batch processing)
- Stratum 3 distillation triggers (observation count + variance → pattern extraction)
- Stratum 4 institutional knowledge write path (codified design wisdom from Distillations)
- Memory flow coordinator (structural process, not cron job)
- Cross-stratum queries (Architect SURVEY reads across all strata)

Prerequisite for self-recursive learning Level 1+.

### M-11: Research Pattern 📋

Systematic literature review and evidence synthesis as a governed pattern. Design at `docs/specs/codex-signum-research-pattern-design.md`. Depends on M-10 (findings → Institutional Knowledge) and M-18 (Assayer validates claims).

### M-12: Constitutional Evolution 📋

Amendment mechanism with evidence-based thresholds. Types exist in `src/constitutional/evolution.ts`. v4.0 adds evidence-based thresholds:
- Tier 1 (parameter tuning): low consensus, short cooling
- Tier 2 (structural change): high consensus, medium cooling
- Tier 3 (axiom/grammar change): near-unanimous, long cooling + mandatory evidence review

Depends on M-10 (proposals → Institutional Knowledge) and M-18 (Assayer validates).

### M-14: Self-Recursive Learning (Levels 1-3) 📋

- **Level 1:** Thompson posteriors update from real quality data (✅ partially — M-9.3)
- **Level 2:** Distillations from cross-run patterns inform future planning (M-10)
- **Level 3:** Constitutional amendments proposed from accumulated evidence (M-12)

Culmination of "state is structural" — the system evolves structurally based on structural evidence.

### M-15: Pattern Exchange Protocol 📋

Federated deployment sharing. Spec at `docs/specs/codex-signum-pattern-exchange-protocol.md`. Multiple Codex instances share patterns, posteriors, Distillations without centralisation. Depends on M-12 (constitutional stability) and M-14 (local learning works first).

---

### M-19: Hypothesis Tracking + Research Pipeline 📋

*The system generates data that supports at least five publishable research papers. But only if we track hypotheses structurally from the start.*

**Why activate early (alongside M-9):** Every pipeline run generates evidence. If tracking waits until M-11, months of data are lost. Hypothesis Helixes created at M-9.7a/M-9.8, accumulating from M-9 onwards.

**Hypotheses as Helixes:**

| Hypothesis | Paper | Data Source | Status |
|-----------|-------|-------------|--------|
| H-1: Context-blocked posteriors outperform global posteriors | Paper 1 (Thompson) | Decision outcomes across context types | Can track now (M-9.3 closed lifecycle) |
| H-2: Bias-as-strength outperforms naive best-overall selection | Paper 1 | Per-context posterior convergence rates | Can track now |
| H-3: Evidence-based constitutional evolution maintains stability | Paper 2 | Amendment proposals, stability periods | Needs M-12 |
| H-4: Structural state encoding yields ~8-10x monitoring coverage | Paper 3 (perceptual) | UI interaction studies | Needs M-13 |
| H-5: Structural learning persists across complete model substitution | Paper 4 (structural intelligence) | Model swap experiments | Can design now, test after M-9 |
| H-6: Safety-as-gradient couples capability with safety | Paper 5 (heuristic imperatives) | Meta-imperative gradient trajectories | Needs M-14 |

**Hypothesis Helix properties:**
- ΦL reflects evidence strength (bright = strong confirming, dim = contradictory)
- εR reflects evidence sufficiency (high = still exploring, low = settled)
- ΨH reflects coherence with other hypotheses (reinforce or conflict?)

**Research papers as Blooms:**

| Paper | Claim | Venues | Dependencies |
|-------|-------|--------|--------------|
| 1. Thompson context-blocking | Context-blocked posteriors improve selection | ICML systems, MLSys, AAAI | H-1, H-2, M-9 |
| 2. Constitutional evolution | Governance rules evolve under formal constraints | AAAI, FAccT | H-3, M-12 |
| 3. State is structural (perceptual) | Graph topology + pre-attentive = 8-10x coverage | CHI, IEEE VIS | H-4, M-13 |
| 4. Structural intelligence | Learning in topology, not weights | AI Journal, Minds and Machines | H-5, M-10, M-14 |
| 5. Heuristic imperatives | Safety as generative gradient, not boundary | NeurIPS safety workshop | H-6, M-14 |

**The sandbox pattern:** Standardised evaluation running consistent tasks against models, measuring against axioms not benchmarks. Generates Paper 1 data and feeds codexsignum.com dashboard. A Bloom containing evaluation Seeds, run periodically and on new model availability.

**The flywheel:** Pattern → data → recursive learning → improved patterns → better data. Emergent from M-9 + M-10 operating correctly. Only emerges if hypothesis tracking starts early enough.

**Implementation:** M-9.8 (now second in Part 2): Create H-1, H-2, H-5 Helixes alongside roadmap bootstrap. M-9 onwards: automatic accumulation. M-11: formalised paper drafting. M-13: sandbox + dashboard.

**Exit criteria:** Hypothesis Helixes in Neo4j with Observations. Evidence accumulation automatic. Cypher answers "what is the current evidence strength for H-1?"

---

### M-20: Topology Observation Helix 💡

*The system's self-model. A Learning Helix that captures topology deltas across the entire graph over time, enabling empirical mathematical discovery from the system's own behaviour.*

**Why it matters:** The Codex assembles its mathematical identity from five traditions (weighted composites, spectral graph theory, Bayesian inference, SPC, exponential decay). M-20 is the instrument that can discover whether simpler or more elegant mathematics emerges from the system's own empirical signature.

**Hard dependencies:** M-9.8 ✅ (graph has topology to observe), M-17.4 (state dimensions connected — without this, topology has structure but no state)
**Soft dependencies:** M-10 (memory compaction for unbounded snapshots), M-14 (self-recursive learning acts on discoveries), M-19 (topology observations as hypothesis evidence)

| Sub | Description | Model | Dependencies |
|-----|-------------|-------|--------------|
| M-20.1 | Schema design — topology delta capture format, storage budget | 🏗️ Opus | M-9.8 ✅ |
| M-20.2 | Helix implementation — observation pattern wired into post-execution hooks | 🔧 Sonnet | M-20.1, M-17.4 |
| M-20.3 | Accumulation phase — run N executions with full capture. No analysis. | 🤖 Automated | M-20.2 |
| M-20.4 | Analysis tooling — dimensionality reduction, trajectory vis, manifold detection | 🏗️ Opus + 👤 Ro | M-20.3 |
| M-20.5 | Discovery — identify structural patterns, candidate simplifications | 🏗️ Opus + 👤 Ro | M-20.4 |
| M-20.6 | Integration — discovered formulas → spec candidates, feed M-12 if constitutional | 🏗️ Opus + 👤 Ro | M-20.5 |

**Date proposed:** 2026-03-05. **Status:** 💡 Vision (not yet in graph — awaits M-17.4).

---

### M-21: Bridge Grid Instantiation 📋

*The Engineering Bridge v3.0 as a queryable Grid of specification Seeds in the graph. Each Part/subsection becomes one Seed. Cross-references become Lines. The Assayer reads specs structurally; Thompson reads parameter config from graph.*

**Why it matters:** Closes the gap between specification documents and the graph. Currently the Bridge is a markdown file; after M-21, every specification section is a first-class graph node with observation history, SPECIFIED_BY Lines to implementations, and structural queryability.

**Hard dependencies:** M-17 (produces the Bridge v3.0 content), M-16 ✅ (instantiation protocol for creating Seeds)
**Sequenced before:** M-13 (visualisation renders the spec graph)

| Sub | Description | Model |
|-----|-------------|-------|
| M-21.1 | Section inventory — map every Bridge section heading to a Seed name | 🏗️ Opus |
| M-21.2 | Grid instantiation — create Bridge Grid containing Part Seeds, each containing subsection Seeds | 🔧 Sonnet |
| M-21.3 | Cross-reference Lines — explicit named cross-references in the Bridge become Lines between Seeds | 🔧 Sonnet |
| M-21.4 | SPECIFIED_BY wiring — link spec Seeds to implementation functions/modules | 🔧 Sonnet |
| M-21.5 | Verification — every Bridge section is queryable by Cypher, no orphaned Seeds | 🔧 Sonnet |

**Date proposed:** 2026-03-15. **Status:** 📋 Planned (awaits M-17 completion).

---

## Validated Refinements Backlog

| # | Refinement | Source | Implement At | Status |
|---|-----------|--------|-------------|--------|
| R-01 | Bridge View Principle — codify in Engineering Bridge spec | M-8A t15 | M-17.2 | ✅ `6b4822f` |
| R-02 | Axiom Dependency Declaration — DAG annotation | M-8A t14 | M-16.1 | 📋 |
| R-03 | Dimensional Collapse — add to anti-pattern table in CLAUDE.md | M-8A | M-16.4 | 📋 |
| R-04 | DECOMPOSE spec limits — CTQs for good decomposition | Session | M-8C | ✅ (via jidoka) |
| R-05 | %C&A per pipeline stage | Session (LSS) | M-8C | ✅ (via quality assessor) |
| R-06 | Parallel execution — Phase 1/3 concurrent | M-8A | Future | 📋 |
| R-07 | Hallucinated axiom names → detection catch | M-8A | M-8C | ✅ |
| R-08 | Thompson exploration on process tweaks | Session | Future | 📋 |
| R-09 | Error morpheme resolution | M-8A | M-16.1 (v4.0 resolves) | 📋 |
| R-10 | Model retirement should preserve capabilities | Sonnet incident | M-8.INT.6 | 📋 |
| R-11 | Pre-flight auth data-driven | M-8.R1 launch | M-8.FIX3 | ✅ |
| R-12 | Spec-compliant tests (Level 5) | Test audit | M-9.5 + M-16.2 | 📋 |
| R-13 | Decisions & memory saved as intended | M-9 discovery | M-9.3 ✅ + M-9.4 ✅ + M-9.VA ✅ | ✅ Closed |
| R-14 | Complete morpheme mapping + 3D topology visualisation | v5 session | M-9.7b | 📋 |
| R-15 | Ecosystem bootstrap (roadmap in graph, Architect reads from Neo4j) | v5 session | M-9.8 | 📋 |
| R-16 | Agent-as-trigger (agent becomes substrate, Architect routes) | v5 session | M-8.INT | 📋 |
| R-17 | Llama 4 model expansion via Vertex | v5 session | M-9.6 | 📋 |
| R-18 | Per-task FMEA advisory (Assayer pre-DISPATCH) | v5 session | M-8.INT.4 | 📋 |
| R-19 | Grammar reference document (canonical inventory) | v5 session | M-9.7a | 📋 |
| R-20 | Lean process maps v2 correction (remove Observer/Signal/Health as separate entities) | M-8B audit | M-9.7a | 📋 |
| R-21 | Hypothesis Helix nodes (H-1 through H-6) created at ecosystem bootstrap | v5 session | M-9.8 (promoted) | 📋 |
| R-22 | Research paper Bloom structure (5 papers, venues, dependencies) | v5 session | M-11 | 📋 |
| R-23 | Sandbox evaluation pattern (standardised model testing against axioms) | v5 session | M-13 | 📋 |
| R-24 | Flywheel validation (evidence that pattern additions compound learning) | v5 session | M-14 | 📋 |
| R-25 | Convert 18 `.todo()` tests to real `@future(M-N)` failing tests + add separate runner | M-9.VA-FIX review | M-9.5 | ⏳ |
| R-26 | `assessTaskQuality` failed-with-zero-output gets max hallucination bonus (0.20) — semantically odd | M-9.VA-FIX review | Future (quality heuristic refinement) | 📋 |
| R-27 | Deployable model substrate — GPU provisioning for Llama, Gemma, Mixtral etc. | M-9.6 completion | M-14+ | 📋 |
| R-28 | Anti-drift fine-tuning recipe — SFT, contrastive negatives, DPO/ORPO | M-9.6 completion | M-14+ | 📋 |
| R-29 | DECOMPOSE synthesis detection — auto-generate synthesis task when intent needs consolidated output | M-17 run | M-8.INT | 📋 |
| R-30 | Consolidation detail preservation — synthesis merges preserving all detail | M-17 run | M-8.INT | 📋 |
| R-31 | Deterministic task classification — three-layer CLASSIFY, three-way DISPATCH | M-8 session | M-8.INT | ✅ `8570bad` |
| R-32 | Data ingestion as Seeds — seed first, classify and transform later | M-8 session | Design session | 📋 |
| R-33 | Typed containment relationships — HAS_STAGE, HAS_MILESTONE, HAS_PHASE | Graph mgmt | M-9.8 | 📋 Deferred |
| R-34 | Query module decomposition — split queries.ts god file | Graph mgmt | Housekeeping | ✅ `6ffd17f` |
| R-35 | Native temporal types — ISO strings → Neo4j datetime() | Graph mgmt | Schema evolution | ✅ `017fe37` |
| R-36 | Pipeline output decomposition — markdown → structural Seeds | Graph mgmt | After R-31 | 📋 |
| R-37 | Composite indexes for query patterns | Graph mgmt | Bundle w/ R-35 | ✅ `b79a354` |
| R-38 | Structural data lifecycle — archival, lifecycle states | Graph mgmt | Scale warrants | 📋 |
| R-39 | Morpheme Instantiation Layer — write layer speaks Codex grammar | Quick ref plan | M-16.4 | ✅ = M-16.4 |
| R-40 | Structured DECOMPOSE Input — JSON blocks, not serialized prose | Quick ref plan | M-8.INT | 📋 |
| R-41 | Conditional DevAgent SCOPE Bypass — skip LLM re-interpretation | Quick ref plan | M-8.INT | 📋 |
| R-42 | Hybrid Prompt Template — JSON header + prose body | Quick ref plan | M-8.INT | 📋 |
| R-43 | Tool-Use DECOMPOSE Output — Anthropic tool API for typed TaskGraph | Quick ref plan | M-8.INT | 📋 |
| R-44 | Graph-Derived Context Transfer — SURVEY --mode=context-transfer | Quick ref plan | M-8.INT | 📋 |
| R-45 | Structured Corrections + Deterministic VALIDATE | Quick ref plan | M-8.INT | 📋 |
| R-46 | Constitutional Bloom creation — organisational core in Neo4j | v5.0 canonisation | M-16.1 | ⏳ |
| R-47 | INSTANTIATES wiring — every node connects to Constitutional Bloom | v5.0 §Constitutional Coupling | M-16.2 | ✅ |
| R-48 | Agent→Resonator retyping (LLMs are transformers, not data) | Morpheme Identity Map v1.0 | M-16.3 | 📋 |
| R-49 | PipelineRun→Bloom retyping (executions are scope boundaries) | Morpheme Identity Map v1.0 | M-16.3 | 📋 |
| R-50 | Creation layer enforcement — atomic INSTANTIATES in all creation functions | v5.0 + Identity Map | M-16.4 | 📋 |
| R-51 | Correction→Refinement codebase rename | v5.0 terminology | M-16.5 | ✅ `bb8f451` |
| R-52 | Architect pattern design revision (v3.0→v5.0, concurrent model, morpheme identity) | Concurrent Pattern Topology v3 | Post-M-16 | 📋 |
| R-53 | DevAgent pattern design revision (v5.0, concurrent model) | Concurrent Pattern Topology v3 | Post-M-16 | 📋 |
| R-54 | Line conductivity implementation specification in Engineering Bridge | v5.0 §Line Conductivity | M-17.3 | 📋 |
| R-55 | Superposition operational mechanics in Engineering Bridge | v5.0 §Superposition (moved from spec) | M-17.4 | 📋 |
| R-56 | Event-driven execution model specification | Concurrent Pattern Topology v3 | M-17.5 | 📋 |
| R-57 | R-39 live migration (migrate-seed-content.ts against live Neo4j) | M-9.8 prep | Pre-M-16 | ⏳ |

---

## Cumulative M-9 Progress

| Sub | Status | Tests Added | Commits | Key Deliverables |
|-----|--------|-------------|---------|------------------|
| M-9.1 Schema | ✅ | +21 (→ 1101) | `df76a6a`→`7d70666` | PipelineRun, TaskOutput, Resonator + relationships |
| M-9.2 Executor wiring | ✅ | +7 (→ 1108) | `9680893`→`b4a0850` | Opt-in graphEnabled, non-fatal writes, async writeManifest |
| M-9.3 Decision lifecycle | ✅ | +25 (→ 1133) | `3a7261d`→`3815dee` | Quality feedback, Observations, analytics queries |
| M-9.4 Memory persistence | ✅ | +43 (→ 1176) | `af18c87`→`3f86f2e` | Compaction, distillation, memory bridge functions |
| M-9.VA Verification | ✅ | — | → report | 14 tasks, 5 models, gate PASS, 17 issues found |
| M-9.VA-FIX Bug fixes | ✅ | +6 (→ 1182) | `8b20029`→`1e1d4d5` | bloomId, DecisionProps, stale seed, quality, linkage |
| M-9.VA-V Post-fix | ✅ | — | `d4facec` | 10/10 tasks, 6 models, all fixes confirmed, ~2× speed |
| M-9.5 Test reconciliation | ⏳ | — | — | @future conversion, deferred items, runner |
| M-9.8 Ecosystem bootstrap | ⏳ (after 9.5) | — | — | Roadmap in graph, hypothesis Helixes |
| M-9.6 Model expansion | 📋 | — | — | Llama 4 via Vertex |
| M-9.7a Grammar reference | 📋 | — | — | Canonical inventory + Lean cleanup |
| M-9.7b Morpheme mapping | 📋 | — | — | Neo4j mapping + 3D vis |

---

## Running Log

| # | Date | Entry |
|---|------|-------|
| R-14 | 2026-03-03 | M-8C.V baseline: 813 tests, 193 exports. M-8.QG complete (1080 tests). M-9.1 complete (1101 tests, 230 exports). |
| R-15 | 2026-03-04 | M-9.4 complete (3f86f2e). +43 tests (1176 total). Memory persistence bridge operational. |
| R-16 | 2026-03-04 | M-9.VA complete. Gate PASS. 14 tasks, 5 models. Pipeline self-diagnostic: 17 issues (5 critical, 12 deferred). 115K chars output. |
| R-17 | 2026-03-04 | M-9.VA-FIX complete (1e1d4d5). 5 fixes, +6 tests (1182). Human feedback loop unblocked. Thompson signal restored. |
| R-18 | 2026-03-04 | M-9.VA-V complete (d4facec). Post-fix PASS. 10/10 tasks, 6 models, 100% success (was 64%). Quality 0.76–0.88 continuous. ~2× speed from structural correctness. |
| R-19 | 2026-03-04 | M-9.8 (Ecosystem Bootstrap) promoted to immediately after M-9.5 in Part 2 sequence. Rationale: roadmap is project's most-edited artifact and only one not structurally represented. Every hand-edit is the system failing its own thesis. New Part 2 order: 9.5 → 9.8 → 9.6 → 9.7a → 9.7b. |
| R-20 | 2026-03-05 | v7: Spec alignment pass. v4.3 review found 4 omissions in State Dimension Gap (ΦL 4-factor formula, dampening mechanics, event trigger enumeration, propagation direction). Corrected. M-9.5/M-9.V/M-17.4 updated with spec contracts. Spec refs v3.0 → v4.3. M-16 updated to reference v4.3. |
| R-21 | 2026-03-12 | v5.0 spec canonised (`e1f6d88`). Morpheme Identity Map v1.0 committed (`524b25be`). Concurrent Pattern Topology reconciled to v3 (Correction→Refinement, A5 removed, Line conductivity/Remedy Archive/Dimensional Profiles enriched, section refs). M-16 rescoped from spec canonisation to Constitutional Bloom establishment. M-17 rescoped to Engineering Bridge v3.0. New requirements R-46–R-57. Roadmap v8 produced. |
| R-22 | 2026-03-16 | v8.1: Reconciliation pass. M-17.1/M-17.2 stamped complete. M-8.INT reverted to active (premature stamp). R-27/R-28 restored from M-9.6 completion report. R-40–R-45 restored from quick-reference-plan (dropped during v8 rewrite). M-20 (Topology Observation Helix) and M-21 (Bridge Grid Instantiation) added. Circular dependency M-16.4→M-16.2 removed. 6 stale R-item statuses corrected. 9 R-items relabelled Bloom→Seed. |

---

## Design Documents Produced

| Document | Description | Status |
|----------|-------------|--------|
| `cs-v5.0.md` | v5.0 spec: 8 axioms (A5 removed), Line Conductivity, Remedy Archive, Dimensional Profiles, Refinement terminology. Grounded in Ashby, Maturana, Senge, Meadows, Shannon. | Canonical — `e1f6d88` |
| `codex-signum-morpheme-identity-map.md` | 17 agentic domain concept → morpheme type mappings. Dimensional channel test. Immune pattern implications. Migration notes. | Canonical — `524b25be` |
| `concurrent-pattern-topology.md` | v3: Concurrent execution model. v5.0 reconciled. Line conductivity reducing Assayer scope. Remedy Archive as parallel intervention. Dimensional profiles in Thompson routing. | Draft v3 — awaiting commit |
| `codex-signum-v4_3-draft.md` | v4.3 spec (superseded by v5.0) | Superseded |
| `09_codex-signum-assayer-pattern-design.md` | Structural validation pattern: 4 stages, 4+1 invocation modes, 3-layer checking | Complete (needs v5.0 pass) |
| `06_codex-signum-architect-pattern-design.md` | Architect pattern: 7-stage planning pipeline | Complete (needs v5.0 pass — R-52) |

---

## Historical Phase Mapping

| Old Name | Canonical Milestone |
|----------|-------------------|
| DND Phase A-F | M-3 sub-milestones |
| Phase G / Core Reconciliation | M-4 |
| Roadmap Phase A-F | M-5 through M-15 |
| Pipeline supercharge Phases 1-5 | M-3.2 through M-3.9 |
| Phase G0-G8 | M-4 sub-milestones |
| M-9 (DND reconnection, v3/v4 roadmaps) | M-9-DND 🧊 (renumbered, ice-boxed until after M-16) |

---

*This document is the single source of truth for project sequencing until M-9.8 completes, at which point the graph becomes the source of truth and this document becomes a snapshot. All future prompts and context transfers reference M-numbers. The v5.0 spec defines the contracts. This roadmap defines the sequence. The Constitutional Bloom first. Everything else is building on sand until the organisational core exists in the graph.*
