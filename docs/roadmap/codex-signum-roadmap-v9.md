# Codex Signum — Canonical Roadmap & Implementation Plan v9

**Version:** 9.1
**Date:** 2026-03-16
**HEAD:** `cada796`
**Tests:** 1564 passing, 0 failing, 19 todo
**Exports:** 277
**Graph:** ~2,530 nodes, zero structural violations
**Status:** Living document — update as milestones complete

---

## Why This Version

v8.1 reconciled the roadmap after v5.0 canonisation but was written while M-16 and M-17 were still in progress. v9.0 reflected the completion of both. v9.1 reflects M-21 (Bridge Grid Instantiation) completion — the Bridge v3.0 is now queryable graph data, and the `SPECIFIED_BY` Line type is available for implementation-to-spec traceability.

**Key changes from v9.0:**
1. **M-21 complete.** 27 spec Seeds, 18 REFERENCES Lines, Bridge Grid live. DEPENDS_ON wired to M-17 (`M-17` node ID). Pending Ro's stamp.
2. **R-58/R-59/R-60 in graph.** Created via `instantiateMorpheme()`. Backlog: 48 total, 17 complete, 31 planned.
3. **New Line types.** `REFERENCES` and `SPECIFIED_BY` added to `VALID_LINE_TYPES` in instantiation protocol.
4. **Critical path shifted.** Next up: M-9.5 (Test Reconciliation) or M-8.INT (Architect Adaptive Routing).
5. **M-20 unblocked.** Hard dep M-17.4 now satisfied. Status 💡 → 📋.
6. **Node ID convention noted.** M-17 uses `M-17`, M-21 uses `bloom:m-21`. Legacy inconsistency documented.

**Changelog:**
**v9.1 (2026-03-16):** M-21 ✅ (27 Seeds, 18 Lines, Grid live, DEPENDS_ON wired). R-58/R-59/R-60 in graph. REFERENCES + SPECIFIED_BY Line types. M-20 unblocked (💡→📋). HEAD `cada796`.
**v9.0 (2026-03-16):** M-16 ✅, M-17 ✅. Full reconciliation. Identity Map v2.0 + v5.0b. R-58/R-59/R-60 defined. Tests 1564.
**v8.1 (2026-03-16):** Reconciliation pass. M-20/M-21 added.
**v8 (2026-03-12):** v5.0 reconciliation. M-16/M-17 rescoped. R-46–R-57.

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

## Critical Path Summary

```
M-16   ✅  Constitutional Bloom + Fabric
 │         Constitutional Bloom, INSTANTIATES wiring, instantiation protocol,
 │         governance Resonators, multi-label retyping, creation layer enforcement.
 │
M-17   ✅  Engineering Bridge v3.0
 │         32 delta findings. Bridge View Principle. Line conductivity.
 │         Superposition. Event-driven model. Vertical wiring spec.
 │
M-21   ✅  Bridge Grid Instantiation (pending stamp)
 │         27 spec Seeds, 18 REFERENCES Lines, SPECIFIED_BY enabled.
 │         Bridge content queryable by Cypher.
 │
 ├─── Choose next ───
 │
M-8.INT 🔄  Architect Adaptive Routing (2/7 children complete)
 │         CLASSIFY→route. Per-task FMEA advisory. Agent becomes substrate.
 │         Prerequisites: R-40 (structured DECOMPOSE), R-58 (morpheme retyping)
 │
 ├─── TEST GATE ───
 │
M-13   📋  UI (graph vis + Opus chat)
 │
 ╔═══════════════════════════════════════════════════════
 ║  UNBLOCKED PARALLEL TRACKS
 ╚═══════════════════════════════════════════════════════
 │
M-9.5  ⏳  Test Reconciliation (18 .todo() → real @future tests)
 │         Palate cleanser. Independent of critical path.
 │
M-9.8  📋  Ecosystem Bootstrap (roadmap in graph, hypothesis Helixes)
 │         After M-9.5.
 │
M-20   📋  Topology Observation Helix (system self-model)
 │         Hard deps satisfied (M-9.8 ✅, M-17 ✅). Design needed.
 │
 ╔═══════════════════════════════════════════════════════
 ║  POST-CRITICAL-PATH — core capabilities
 ╚═══════════════════════════════════════════════════════
 │
M-18   📋  Assayer implementation (4 stages, 4 modes, compliance corpus)
M-10   📋  Memory operations (full compaction, distillation, institutional)
M-11   📋  Research pattern ┐
M-12   📋  Constitutional evolution ┘ parallel
M-14   📋  Self-recursive learning L1-L3
M-15   📋  Pattern Exchange Protocol (federation)
 │
 ╔═══════════════════════════════════════════════════════
 ║  LONG-HORIZON TRACKS
 ╚═══════════════════════════════════════════════════════
 │
M-19   📋  Hypothesis tracking + research pipeline
```

---

## Current Test Baseline

| Metric | Count |
|--------|-------|
| Total tests | 1564 |
| Passed | 1564 |
| Failed | 0 |
| Todo (future-scope) | 19 |
| Exports | 277 |

**Todo tests (governance gap — must be converted in M-9.5):**
- `dev-agent.test.ts` — 7 todos (DevAgent.run() integration) → `@future(M-10)`
- `hierarchical-health.test.ts` — 6 todos (computeHierarchicalHealth Neo4j) → `@future(M-9.V)`
- `immune-response.test.ts` — 5 todos (evaluateAndReviewIfNeeded) → `@future(M-18)`
- 1 additional todo from M-16 additions

---

## Completed Milestones

### M-1 through M-8.QG: Foundation through Quality Gates ✅

*(Unchanged from v8.1 — see v8.1 for full details)*

Foundation (M-1), Signal Conditioning (M-2), Patterns in Core (M-4), Architect Bootstrap (M-5), Thompson Integration (M-6), Self-Examination (M-7), Spec Review (M-7B), Report Consolidation (M-8A), Lean Review (M-8B), Topology Refactor (M-8C), Grammar Refactor (M-7C), Optimisation Runs (M-8), Quality Gates (M-8.QG).

### M-9 Part 1: Schema + Wiring (M-9.1–9.4) ✅

Pipeline writes to graph. Decisions complete lifecycle. Memory persistence bridge operational. Thompson reads real quality data. 1182 tests at M-9.VA-V completion.

### M-9.VA / M-9.VA-FIX / M-9.VA-V: Verification Cycle ✅

Pipeline self-diagnostic. 5 critical bugs fixed. Post-fix: 100% success, quality 0.76–0.88, ~2× speed from structural correctness.

### M-16: Constitutional Bloom + Fabric ✅

| Sub | Description | Status | Commit |
|-----|-------------|--------|--------|
| M-16.1 | Constitutional Bloom creation (morpheme defs, axioms, grammar rules, imperatives, anti-patterns) | ✅ | `8c47152` |
| M-16.2 | INSTANTIATES wiring (every node → Constitutional Bloom) | ✅ | `3dab633` |
| M-16.3 | Governance Resonator definitions in Constitutional Bloom | ✅ | `1215ee4` |
| M-16.4 | Instantiation Protocol — ALL graph writes through `instantiateMorpheme()`, `updateMorpheme()`, `createLine()` | ✅ | `34cedb5` |
| M-16.5 | Option B multi-label retyping (`:Decision` → `:Seed:Decision`, additive, no labels removed) | ✅ | `bb8f451` |
| M-16.6 | Content enforcement for ALL morpheme types | ✅ | `97cfa76` |

**Key architectural outcomes:**
- **Compliance-as-Monitoring anti-pattern killed.** 7 instances removed. Instantiation protocol makes violations structurally impossible.
- **Three governance Resonators** in Constitutional Bloom (Instantiation, Mutation, Line Creation).
- **Content required on ALL morpheme types.**
- **Option B multi-label retyping.** Additive only, backward compatible.

### M-17: Engineering Bridge v3.0 ✅

| Sub | Description | Status | Commit |
|-----|-------------|--------|--------|
| M-17.1 | Delta report (32 findings: 7 formula fixes, 9 terminology, 7 reframings, 9 new sections) | ✅ | `5fa3146` |
| M-17.2 | Bridge View Principle + F-1–F-7 formula fixes (critical: dampening k-1→k) | ✅ | `6b4822f` |
| M-17.3 | Terminology + reframing + new sections + glossary | ✅ | `192d841` |
| M-17.4 | Superposition operational mechanics (S.1–S.6) | ✅ | `abde0d3` |
| M-17.5 | Event-driven execution model + signal conditioning + structural review + shape derivation | ✅ | `c5e4ee1` |
| M-17.6 | Build experience + memory as morphemes + CAS defences + deferred computations + vertical wiring | ✅ | `5a6845f` |

**Key architectural outcomes:**
- **Bridge View Principle** governs all formulas: `f(morpheme_states, axiom_parameters, topology) → result`
- **Vertical wiring specified.** 8-row interface contract.
- **Event-driven model.** Orchestrator dissolves into topology. 4-stage migration path.

### M-21: Bridge Grid Instantiation ✅ (pending stamp)

Executed as single `[NO-PIPELINE]` prompt. Commit `7216ceb`.

| Deliverable | Count | Status |
|-------------|-------|--------|
| `grid:bridge-v3` Grid (parented to `constitutional-bloom`) | 1 | ✅ active |
| Spec Seeds (id prefix `spec:bridge:`) | 27 | ✅ All with content, all INSTANTIATES-wired |
| REFERENCES Lines (cross-references between sections) | 18 | ✅ All with labels |
| `bloom:m-21` Milestone Bloom | 1 | ✅ active |
| DEPENDS_ON `M-17` → `bloom:m-21` | 1 | ✅ Wired |

**Code changes:**
- `src/graph/instantiation.ts` — `REFERENCES` and `SPECIFIED_BY` added to `VALID_LINE_TYPES`
- `scripts/m21-bridge-grid.ts` — idempotent instantiation script (697 lines)

**What M-21 enables:**
- `SPECIFIED_BY` Lines from implementation functions to spec Seeds
- Parameter lookup via Cypher (Resonators read spec Seed content)
- Completeness queries ("which spec sections have no implementations?")
- Impact analysis ("if I change dampening, what implementations are affected?")

---

## Active Milestones

### M-9 Part 2: Reconciliation + Bootstrap + Topology ⏳

| Sub | Description | Status |
|-----|-------------|--------|
| M-9.5 | Test reconciliation — 18 `.todo()` → real `@future(M-N)` tests + separate runner | ⏳ |
| M-9.8 | Ecosystem bootstrap — roadmap in graph, hypothesis Helixes | 📋 (after 9.5) |
| M-9.6 | Model expansion — Llama 4 via Vertex | 📋 |
| M-9.7a | Grammar reference document | 📋 |
| M-9.7b | Morpheme mapping + 3D topology vis | 📋 |
| M-9.V | Full verification run | 📋 |

*(Detailed descriptions unchanged from v8.1)*

### M-8.INT: Architect Adaptive Routing 🔄

2 of 7 children complete. CLASSIFY routing logic, Architect→DevAgent handoff, DevAgent→Architect feedback, Assayer invocation, agent-as-trigger interface, model retirement.

**Prerequisites now clearer after M-16/M-17/M-21:**
- R-40 (structured DECOMPOSE input) — JSON blocks, not serialised prose
- R-58 (morpheme retyping from Identity Map v2.0) — Agent→Resonator, PipelineRun→Bloom, stages→stage Blooms
- R-41 (conditional DevAgent SCOPE bypass)
- R-42 (hybrid prompt template)

---

## Planned Milestones

### M-13: UI 📋

Graph visualisation + Opus chat interface. Confirmed stack: custom Three.js with InstancedMesh (desktop 3D), Sigma.js v3 or Cytoscape.js (mobile 2D), CSS2DRenderer for text labels, fCoSE + ELK.js hybrid layout in Web Worker, Firebase Hosting + Cloud Run (australia-southeast1). **M-21 provides the spec graph data for the Bridge view.**

### M-18: Assayer Pattern Implementation 📋

Full four-stage pipeline, four invocation modes, compliance corpus. **Identity Map v2.0 reclassifies the Assayer as a Bloom** — contains evaluation Resonator, config Seeds, observation Grid, and Statistical Assessment Resonator instance.

### M-10: Memory Operations 📋

Full compaction, distillation flow coordinator. **Bridge v3.0 Part 7** specifies memory strata as morpheme compositions.

### M-11: Research Pattern 📋
### M-12: Constitutional Evolution 📋
### M-14: Self-Recursive Learning L1-L3 📋
### M-15: Pattern Exchange Protocol 📋

*(Descriptions unchanged from v8.1)*

### M-19: Hypothesis Tracking + Research Pipeline 📋

In graph since M-9.8 ecosystem bootstrap. Helix nodes for H-1 through H-6.

### M-20: Topology Observation Helix 📋

The system's self-model. Learning Helix capturing topology deltas for empirical mathematical discovery. Designed 2026-03-05.

**Hard deps:** M-9.8 ✅ (graph has topology), M-17 ✅ (state dimensions specified). **Both satisfied.**
**Soft deps:** M-10 (memory compaction), M-14 (self-recursive learning), M-19 (hypothesis evidence).
**Status:** 📋 Planned — hard deps met, design session needed.

---

## The State Dimension Gap (Updated for Bridge v3.0)

The gap between raw pipeline observations and computed state dimensions still exists in the implementation. **Bridge v3.0 now fully specifies the vertical wiring** (M-17.6, 8-row interface contract), so the specification is complete — implementation remains.

### What works (tested, running)

| Layer | Status |
|-------|--------|
| Graph schema (all morpheme types, Constitutional Bloom, INSTANTIATES) | ✅ M-16 |
| Pipeline → graph (TaskOutput + Decision + Observation to Neo4j) | ✅ M-9 |
| Decision lifecycle (quality → Thompson) | ✅ M-9.3 |
| Memory bridge (compaction + distillation) | ✅ M-9.4 |
| Thompson routing (Bayesian posteriors, 20+ models) | ✅ M-6 |
| Instantiation protocol (all writes governed) | ✅ M-16.4 |
| Bridge as queryable graph (spec sections as Seeds) | ✅ M-21 |

### What's specified but not connected

| Layer | Bridge v3.0 Spec | Implementation |
|-------|-------------------|----------------|
| ΦL 4-factor composite | Part 2 (with ring buffers, maturity modifier) | `phi-l.ts` exists, not fed from pipeline |
| ΨH two-component | Part 2 (λ₂ + TV_G, temporal decomposition) | `psi-h.ts` exists, not computed for pipeline |
| εR with floor | Part 2 (imperative gradient + spectral calibration) | `epsilon-r.ts` exists, not aggregated to Bloom |
| Signal conditioning | Part 4 (7 named Resonators in Signal Conditioning Bloom) | `src/computation/signals/` exists, not connected |
| Hierarchical health | Part 3 (dampening, cascade limit, hysteresis) | `dampening.ts` exists, not triggered by live state |
| Event-triggered review | Part 8 (6 triggers → Structural Review Resonator) | Not wired |
| Line conductivity | Line Conductivity Part (3-layer circuit model) | Not implemented |

### Vertical wiring interface (from Bridge v3.0 M-17.6)

| Interface | From → To |
|-----------|-----------|
| Observation → Conditioning | Raw Seeds → Signal Conditioning Bloom (7 Resonators) |
| Conditioning → ΦL | Trend Resonator output → 4-factor formula |
| ΦL → Maturity | Raw ΦL → maturity modifier → ΦL_effective |
| Node → Container | Component ΦL → parent Bloom (dampened: γ_effective) |
| Graph → ΨH | Laplacian → λ₂ + TV_G → two-component ΨH |
| Line → Conductivity | Endpoint properties → 3-layer evaluation → cached |
| State → Events | ΦL/ΨH/εR changes → 6 event triggers → Structural Review |
| Recovery → Hysteresis | Improving ΦL → asymmetric attenuation (γ/2.5) |

**Where this gets implemented:** M-9.V (verification), M-8.INT (pipeline stages become stage Blooms per Identity Map v2.0), and potentially a dedicated "vertical wiring" milestone.

---

## Validated Refinements Backlog

### Complete

| # | Refinement | Completed At |
|---|-----------|-------------|
| R-01 | Bridge View Principle codified | M-17.2 `6b4822f` |
| R-04 | DECOMPOSE spec limits (CTQs) | M-8C (via jidoka) |
| R-05 | %C&A per pipeline stage | M-8C (via quality assessor) |
| R-07 | Hallucinated axiom names detection | M-8C |
| R-11 | Pre-flight auth data-driven | M-8.FIX3 |
| R-13 | Decisions & memory saved | M-9.3 + M-9.4 + M-9.VA |
| R-31 | Deterministic task classification | `8570bad` |
| R-34 | Query module decomposition | `6ffd17f` |
| R-35 | Native temporal types | `017fe37` |
| R-37 | Composite indexes | `b79a354` |
| R-39 | Morpheme Instantiation Layer | M-16.4 = `34cedb5` |
| R-46 | Constitutional Bloom creation | M-16.1 `8c47152` |
| R-47 | INSTANTIATES wiring | M-16.2 `3dab633` |
| R-50 | Creation layer enforcement (atomic INSTANTIATES) | M-16.4 `34cedb5` |
| R-51 | Correction→Refinement rename | M-16.5 `bb8f451` |
| R-54 | Line conductivity spec in Bridge | M-17.3 `192d841` |
| R-55 | Superposition mechanics in Bridge | M-17.4 `abde0d3` |
| R-56 | Event-driven execution model spec | M-17.5 `c5e4ee1` |

### Planned

| # | Refinement | Target |
|---|-----------|--------|
| R-02 | Axiom Dependency Declaration (DAG annotation) | M-16.1 |
| R-03 | Dimensional Collapse → anti-pattern table in CLAUDE.md | M-16.4 |
| R-06 | Parallel execution (Phase 1/3 concurrent) | Future |
| R-08 | Thompson exploration on process tweaks | Future |
| R-09 | Error morpheme resolution | M-16.1 (v5.0 resolves) |
| R-10 | Model retirement preserves capabilities | M-8.INT.6 |
| R-12 | Spec-compliant tests (Level 5) | M-9.5 + M-16.2 |
| R-14 | Morpheme mapping + 3D topology vis | M-9.7b |
| R-15 | Ecosystem bootstrap (roadmap in graph) | M-9.8 |
| R-16 | Agent-as-trigger (agent becomes substrate) | M-8.INT |
| R-17 | Llama 4 model expansion | M-9.6 |
| R-18 | Per-task FMEA advisory | M-8.INT.4 |
| R-19 | Grammar reference document | M-9.7a |
| R-20 | Lean process maps v2 correction | M-9.7a |
| R-21 | Hypothesis Helix nodes | M-9.8 |
| R-22 | Research paper Bloom structure | M-11 |
| R-23 | Sandbox evaluation pattern | M-13 |
| R-24 | Flywheel validation | M-14 |
| R-25 | Convert 18 `.todo()` to `@future(M-N)` | M-9.5 |
| R-26 | assessTaskQuality zero-output bonus | Future |
| R-27 | Deployable model substrate (GPU) | M-14+ |
| R-28 | Anti-drift fine-tuning recipe | M-14+ |
| R-29 | DECOMPOSE synthesis detection | M-8.INT |
| R-30 | Consolidation detail preservation | M-8.INT |
| R-32 | Data ingestion as Seeds | Design session |
| R-33 | Typed containment relationships | Deferred |
| R-36 | Pipeline output → structural Seeds | After R-31 |
| R-38 | Structural data lifecycle (archival) | Scale warrants |
| R-40 | Structured DECOMPOSE Input (JSON blocks) | M-8.INT |
| R-41 | Conditional DevAgent SCOPE Bypass | M-8.INT |
| R-42 | Hybrid Prompt Template (JSON header + prose) | M-8.INT |
| R-43 | Tool-Use DECOMPOSE Output (Anthropic tool API) | M-8.INT |
| R-44 | Graph-Derived Context Transfer (SURVEY --mode=context-transfer) | M-8.INT |
| R-45 | Structured Corrections + Deterministic VALIDATE | M-8.INT |
| R-48 | Agent→Resonator retyping | Absorbed into R-58 |
| R-49 | PipelineRun→Bloom retyping | Absorbed into R-58 |
| R-52 | Architect pattern design revision (v5.0, concurrent model) | Post-M-16 |
| R-53 | DevAgent pattern design revision | Post-M-16 |
| R-57 | R-39 live migration script | Absorbed into M-16 |
| R-58 | Morpheme retyping from Identity Map v2.0 | M-8.INT |
| R-59 | Cascading document updates from v2.0 reclassifications (7 docs) | Post-M-17 |
| R-60 | Statistical Assessment Resonator Phase 1: CI on Thompson posteriors | M-8.INT |

**R-58/R-59/R-60 status:** In graph as Seeds via `instantiateMorpheme()`. Backlog totals: 48 total, 17 complete, 31 planned.

---

## Milestone Numbering (Canonical)

| M# | Name | Status | Notes |
|----|------|--------|-------|
| M-1 | Foundation | ✅ | |
| M-2 | Signal Conditioning | ✅ | |
| M-3 | *(gap — ice-boxed DND reconnection, renamed M-9-DND)* | 🧊 | |
| M-4 | Patterns in Core | ✅ | |
| M-5 | Architect Bootstrap | ✅ | |
| M-6 | Thompson Integration | ✅ | |
| M-7 | Self-Examination | ✅ | |
| M-7B | Spec Review | ✅ | |
| M-7C | Grammar Refactor | ✅ | |
| M-8 | Optimisation Runs | ✅ | |
| M-8A | Report Consolidation | ✅ | |
| M-8B | Lean Review | ✅ | |
| M-8C | Topology Refactor | ✅ | |
| M-8.QG | Quality Gates | ✅ | |
| M-8.INT | Architect Adaptive Routing | 🔄 | 2/7 children |
| M-9 | Structural Compliance | 🔄 | Part 1 ✅, Part 2 ⏳ |
| M-10 | Memory Operations | 📋 | |
| M-11 | Research Pattern | 📋 | |
| M-12 | Constitutional Evolution | 📋 | |
| M-13 | UI | 📋 | After M-21 ✅ |
| M-14 | Self-Recursive Learning | 📋 | |
| M-15 | Pattern Exchange Protocol | 📋 | |
| M-16 | Constitutional Bloom + Fabric | ✅ | `8c47152`→`8b22a43` |
| M-17 | Engineering Bridge v3.0 | ✅ | `5fa3146`→`5a6845f` |
| M-18 | Assayer Implementation | 📋 | |
| M-19 | Hypothesis Tracking + Research Pipeline | 📋 | In graph since M-9.8 |
| M-20 | Topology Observation Helix | 📋 | Hard deps met, design needed |
| M-21 | Bridge Grid Instantiation | ✅ | `7216ceb`, pending stamp |

---

## Design Documents Produced

| Document | Path | Status |
|----------|------|--------|
| v5.0 spec | `docs/specs/cs-v5.0.md` | Canonical `e1f6d88` |
| Engineering Bridge v3.0 | `docs/specs/codex-signum-engineering-bridge-v3_0.md` | Canonical `5a6845f` |
| Engineering Bridge v2.0 | `docs/specs/05_codex-signum-engineering-bridge-v2_0.md` | Preserved |
| Morpheme Identity Map v2.0 | `docs/specs/codex-signum-morpheme-identity-map-v2.md` | Canonical `dff5d9c` |
| Morpheme Identity Map v1.0 | `docs/specs/codex-signum-morpheme-identity-map.md` | Preserved `524b25be` |
| v5.0b Statistical Assessment | `docs/specs/codex-signum-v5_0b-statistical-assessment.md` | Draft `dff5d9c` |
| Concurrent Pattern Topology v3 | `docs/specs/concurrent-pattern-topology-v3.md` | Draft `9c68eb1` |
| M-17.1 Delta Report | `docs/specs/m17-1-bridge-delta-report.md` | Canonical `5fa3146` |
| Instantiation/Mutation Design | `docs/specs/instantiation-mutation-resonator-design.md` | Canonical `bc95c654` |
| Assayer Pattern Design | `docs/specs/09_codex-signum-assayer-pattern-design.md` | Needs v5.0 pass (R-52) |
| Architect Pattern Design | `docs/specs/06_codex-signum-architect-pattern-design.md` | Needs v5.0 pass (R-52) |

---

## Running Log

| # | Date | Entry |
|---|------|-------|
| R-14–R-21 | 2026-03-03–05 | *(See v8.1 for entries R-14 through R-21)* |
| R-22 | 2026-03-16 | v8.1 reconciliation. 16 anomalies fixed, 19 R-items restored. |
| R-23 | 2026-03-16 | M-16 complete. Constitutional Bloom, instantiation protocol, governance Resonators. Tests: 1564. |
| R-24 | 2026-03-16 | M-17 complete. Bridge v3.0 final. All 32 delta findings. Version: 3.0-draft → 3.0. |
| R-25 | 2026-03-16 | Identity Map v2.0 + v5.0b committed at `dff5d9c`. R-58/R-59/R-60 defined. |
| R-26 | 2026-03-16 | R-58/R-59/R-60 created in graph. Backlog: 48 total, 17 complete, 31 planned. |
| R-27 | 2026-03-16 | M-21 complete. 27 spec Seeds, 18 REFERENCES Lines, Bridge Grid live. Commit `7216ceb`. DEPENDS_ON wired. REFERENCES + SPECIFIED_BY Line types added. |

---

## Key Learnings (Accumulated)

### Anti-Pattern Sweep Methodology
ALWAYS start with Neo4j diagnostic queries. The graph is the source of truth — never scope from GitHub alone.

### Verification Methodology
Use `get_file_contents` for existence verification; `search_code` only for discovery. GitHub search index lags. Compare file SHA hashes.

### Compliance-as-Monitoring Is an Anti-Pattern
Structural enforcement (instantiation protocol) makes violations impossible. Seven instances killed.

### Constituent Test (from Identity Map v2.0)
"Does this object have things inside it that need containment? If yes, it's a Bloom." Caught 5 systematic mistypings.

### DEPENDS_ON Direction
`(prerequisite)-[:DEPENDS_ON]->(dependent)` — from what must complete to what it unblocks.

### Node ID Conventions
Legacy inconsistency: M-17 uses `M-17`, M-21 uses `bloom:m-21`. Different bootstrap eras. Always query for actual IDs when wiring between milestones.

### Context Transfers Belong in Project Knowledge
Not the public repo. Never commit context transfers to `Codex_signum`.

---

*This document is the single source of truth for project sequencing until M-9.8 completes, at which point the graph becomes the source of truth and this document becomes a snapshot. The v5.0 spec defines the contracts. The Engineering Bridge v3.0 defines the computations. This roadmap defines the sequence. The constitutional foundation is built. The engineering specification is complete. The Bridge is queryable. Everything from here is implementation.*
