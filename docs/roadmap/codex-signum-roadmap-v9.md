# Codex Signum — Canonical Roadmap & Implementation Plan v9

**Version:** 9.2
**Date:** 2026-03-16
**HEAD:** `ad03f08`
**Tests:** 1564 passing, 0 failing, 19 todo
**Exports:** 277
**Graph:** ~2,530 nodes, zero structural violations
**Status:** Living document — update as milestones complete

---

## Why This Version

v9.1 reflected M-21 completion. v9.2 adds **M-22 (Vertical Wiring)** — a dedicated milestone to close the State Dimension Gap. The gap between specified computations (Bridge v3.0) and live pipeline integration had no milestone owner. Seven implementation items were floating between "specified" and "verified" with nothing to carry them. M-22 fixes this.

**Key changes from v9.1:**
1. **M-22 created.** Vertical Wiring — 7 sub-milestones connecting the computation layer to the live pipeline. Spec: Bridge v3.0 vertical wiring interface (8-row contract). Hard deps: M-16 ✅, M-17 ✅.
2. **Critical path updated.** M-22 sequenced after M-8.INT (needs stage Blooms from R-58) and before M-9.V (which verifies the wiring works).
3. **State Dimension Gap section updated.** "What's specified but not connected" now has a milestone owner: M-22.
4. **M-21 stamped complete.** phiL 0.9, `7216ceb`.

**Changelog:**
**v9.2 (2026-03-16):** M-22 (Vertical Wiring) added with 7 sub-milestones. M-21 stamped ✅. Critical path updated: M-8.INT → M-22 → M-9.V.
**v9.1 (2026-03-16):** M-21 ✅. R-58/R-59/R-60 in graph. REFERENCES + SPECIFIED_BY. M-20 unblocked.
**v9.0 (2026-03-16):** M-16 ✅, M-17 ✅. Full reconciliation. Tests 1564.

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
 │
M-17   ✅  Engineering Bridge v3.0
 │
M-21   ✅  Bridge Grid Instantiation
 │
 ├─── Choose next ───
 │
M-8.INT 🔄  Architect Adaptive Routing (2/7 children complete)
 │         Includes R-58 (stage Blooms) — prerequisite for M-22
 │
 ├─── TEST GATE ───
 │
M-22   📋  Vertical Wiring (connect computation layer to live pipeline)
 │         7 sub-milestones. Closes the State Dimension Gap.
 │         Spec: Bridge v3.0 vertical wiring interface (8-row contract).
 │
 ├─── TEST GATE ───
 │
M-9.V  📋  Full Verification Run (proves wiring works end-to-end)
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
 │
M-9.8  📋  Ecosystem Bootstrap (roadmap in graph, hypothesis Helixes)
 │
M-20   📋  Topology Observation Helix (system self-model)
 │
 ╔═══════════════════════════════════════════════════════
 ║  POST-CRITICAL-PATH — core capabilities
 ╚═══════════════════════════════════════════════════════
 │
M-18   📋  Assayer implementation
M-10   📋  Memory operations
M-11   📋  Research pattern ┐
M-12   📋  Constitutional evolution ┘ parallel
M-14   📋  Self-recursive learning L1-L3
M-15   📋  Pattern Exchange Protocol
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
- `hierarchical-health.test.ts` — 6 todos (computeHierarchicalHealth Neo4j) → `@future(M-22.5)`
- `immune-response.test.ts` — 5 todos (evaluateAndReviewIfNeeded) → `@future(M-22.7)`
- 1 additional todo from M-16 additions

---

## Completed Milestones

### M-1 through M-8.QG: Foundation through Quality Gates ✅

*(Unchanged from v8.1 — see v8.1 for full details)*

### M-9 Part 1: Schema + Wiring (M-9.1–9.4) ✅

Pipeline writes to graph. Decisions complete lifecycle. Memory persistence bridge operational. Thompson reads real quality data.

### M-9.VA / M-9.VA-FIX / M-9.VA-V: Verification Cycle ✅

Pipeline self-diagnostic. 5 critical bugs fixed. Post-fix: 100% success, quality 0.76–0.88, ~2× speed.

### M-16: Constitutional Bloom + Fabric ✅

| Sub | Description | Commit |
|-----|-------------|--------|
| M-16.1 | Constitutional Bloom creation | `8c47152` |
| M-16.2 | INSTANTIATES wiring | `3dab633` |
| M-16.3 | Governance Resonator definitions | `1215ee4` |
| M-16.4 | Instantiation Protocol | `34cedb5` |
| M-16.5 | Option B multi-label retyping | `bb8f451` |
| M-16.6 | Content enforcement | `97cfa76` |

### M-17: Engineering Bridge v3.0 ✅

| Sub | Description | Commit |
|-----|-------------|--------|
| M-17.1 | Delta report (32 findings) | `5fa3146` |
| M-17.2 | Bridge View Principle + formula fixes | `6b4822f` |
| M-17.3 | Terminology + new sections + glossary | `192d841` |
| M-17.4 | Superposition operational mechanics | `abde0d3` |
| M-17.5 | Event-driven model + signal conditioning + shape derivation | `c5e4ee1` |
| M-17.6 | Build experience + deferred computations + vertical wiring | `5a6845f` |

### M-21: Bridge Grid Instantiation ✅

| Deliverable | Count |
|-------------|-------|
| `grid:bridge-v3` Grid | 1 |
| Spec Seeds (`spec:bridge:*`) | 27 |
| REFERENCES Lines | 18 |
| `bloom:m-21` Milestone Bloom | 1 (stamped complete, phiL 0.9) |

Commit `7216ceb`. Code: `REFERENCES` + `SPECIFIED_BY` Line types, `scripts/m21-bridge-grid.ts`.

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
| M-9.V | Full verification run — **now sequenced after M-22** | 📋 |

**Note:** M-9.V's exit criteria include "Observation nodes feed real 4-factor ΦL computation" and "hierarchical health aggregates upward with topology-aware dampening" — these require M-22. M-9.V verifies what M-22 builds.

### M-8.INT: Architect Adaptive Routing 🔄

2 of 7 children complete. Prerequisites: R-40, R-58, R-41, R-42.

**R-58 (morpheme retyping) is the bridge to M-22.** R-58 converts pipeline stages from Resonators to Blooms (per Identity Map v2.0). M-22 then wires the computation layer into those stage Blooms. Without stage Blooms, there's nowhere for stage-level ΦL/ΨH/εR to live.

---

## Planned Milestones

### M-22: Vertical Wiring 📋

*Connect the computation layer to the live pipeline. Close the State Dimension Gap. Every item in the "What's specified but not connected" table gets a sub-milestone.*

**Spec:** Bridge v3.0 vertical wiring interface (8-row contract, M-17.6)
**Hard deps:** M-16 ✅ (instantiation protocol), M-17 ✅ (spec complete), M-8.INT/R-58 (stage Blooms exist)
**Sequenced before:** M-9.V (which verifies the wiring works)

| Sub | Description | Spec Source | Agent | Model |
|-----|-------------|-------------|-------|-------|
| M-22.1 | Signal conditioning → execution path. Connect 7 Resonators in `src/computation/signals/` to pipeline observation stream. Conditioned signals feed downstream computations. | Bridge Part 4, vertical row 1 | 🔧 DevAgent | Sonnet |
| M-22.2 | ΦL from pipeline. Replace `qualityScore` proxy with real 4-factor composite (axiom_compliance, provenance_clarity, usage_success_rate, temporal_stability) fed by conditioned signals from M-22.1. Ring buffer state. Maturity modifier. | Bridge Part 2 (ΦL), vertical rows 2–3 | 🔧 DevAgent | Sonnet |
| M-22.3 | ΨH for pipeline. Live λ₂ + TV_G computation on Architect Bloom and composition subgraphs. Temporal decomposition (EWMA trend, friction_transient, friction_durable). Harmonic profile stored on Bloom. | Bridge Part 2 (ΨH), vertical row 5 | 🏗️+🔧 | Opus + Sonnet |
| M-22.4 | εR Bloom aggregation. Composition-scope εR from Decision Seeds within containment. Upward propagation via averaging. Structural review trigger when above maturity-indexed bound. | Bridge Part 2 (εR, composition-scope), vertical row 5 | 🔧 DevAgent | Sonnet |
| M-22.5 | Hierarchical health propagation. Dampened ΦL through CONTAINS Lines: `γ_effective = min(0.7, 0.8/k)`. CASCADE_LIMIT=2. Asymmetric rate: recovery at γ/2.5. Algedonic bypass at ΦL < 0.1. Triggered by live pipeline state changes. | Bridge Part 3, vertical row 4 + row 8 | 🏗️+🔧 | Opus + Sonnet |
| M-22.6 | Line conductivity implementation. 3-layer circuit model: Layer 1 (morpheme hygiene, binary), Layer 2 (grammatical shape, binary), Layer 3 (contextual fitness, continuous friction from dimensional profiles). Cached on Line, invalidated on endpoint change. | Bridge Line Conductivity Part, vertical row 6 | 🏗️+🔧 | Opus + Sonnet |
| M-22.7 | Event-triggered structural review. 6 triggers wired: λ₂ drop, friction spike (TV_G > 0.5), cascade at 2nd level, εR spike, ΦL velocity > 0.05/day, Ω gradient inversion. Output: diagnostic Seeds to Structural Review Grid. | Bridge Part 8, vertical row 7 | 🔧 DevAgent | Sonnet |

**Dependency chain within M-22:**

```
M-22.1 (conditioning)
 ├──→ M-22.2 (ΦL — needs conditioned signals)
 │     └──→ M-22.5 (hierarchical health — needs ΦL to propagate)
 │           └──→ M-22.7 (event triggers — needs all three dimensions)
 ├──→ M-22.3 (ΨH — partially independent, needs graph topology)
 │     └──→ M-22.7
 └──→ M-22.4 (εR — needs Decision Seeds)
       └──→ M-22.7

M-22.6 (conductivity — partially independent, needs ΦL for Layer 3)
 └── depends on M-22.2
```

**Exit criteria:** All 8 vertical wiring interface rows connected. `qualityScore` proxy eliminated. ΦL computed from 4 factors on live pipeline data. ΨH computed from graph Laplacian. εR aggregated at Bloom scope. Hierarchical health propagates with dampening. 6 event triggers fire from live state changes. Line conductivity evaluates at all 3 layers. All `@future(M-22.*)` tests from M-9.5 now pass.

**What this changes about the thesis:** After M-22, "state is structural" is no longer aspirational for the pipeline — ΦL, ΨH, and εR are live computed structural properties of pipeline morphemes, not proxies. The system's own health is visible in its own graph.

### M-13: UI 📋

Graph visualisation + Opus chat interface. **M-22 provides live state dimensions for the visualisation to render.** Without M-22, the UI would show structure but not health — bright topology with no luminance variation.

### M-18: Assayer Pattern Implementation 📋

Full four-stage pipeline, four invocation modes, compliance corpus. Identity Map v2.0 reclassifies the Assayer as a Bloom.

### M-10: Memory Operations 📋

Full compaction, distillation flow coordinator. Bridge v3.0 Part 7 specifies memory strata as morpheme compositions.

### M-11: Research Pattern 📋
### M-12: Constitutional Evolution 📋
### M-14: Self-Recursive Learning L1-L3 📋
### M-15: Pattern Exchange Protocol 📋

### M-19: Hypothesis Tracking + Research Pipeline 📋

### M-20: Topology Observation Helix 📋

Hard deps met (M-9.8, M-17). Design session needed. **M-22 would produce live state dimension data for M-20 to observe** — soft dependency.

---

## The State Dimension Gap → M-22

The gap between raw pipeline observations and computed state dimensions has a milestone owner: **M-22 (Vertical Wiring)**.

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

### What M-22 connects

| Layer | Bridge v3.0 Spec | Implementation | M-22 Sub |
|-------|-------------------|----------------|----------|
| Signal conditioning | Part 4 (7 Resonators) | `src/computation/signals/` exists | **M-22.1** |
| ΦL 4-factor composite | Part 2 (ring buffers, maturity) | `phi-l.ts` exists | **M-22.2** |
| ΨH two-component | Part 2 (λ₂ + TV_G) | `psi-h.ts` exists | **M-22.3** |
| εR Bloom aggregation | Part 2 (composition-scope) | `epsilon-r.ts` exists | **M-22.4** |
| Hierarchical health | Part 3 (dampening, cascade, hysteresis) | `dampening.ts` exists | **M-22.5** |
| Line conductivity | Line Conductivity Part (3-layer) | Not implemented | **M-22.6** |
| Event-triggered review | Part 8 (6 triggers) | Not wired | **M-22.7** |

### Vertical wiring interface (from Bridge v3.0 M-17.6)

| Interface | From → To | M-22 Sub |
|-----------|-----------|----------|
| Observation → Conditioning | Raw Seeds → Signal Conditioning Bloom | M-22.1 |
| Conditioning → ΦL | Trend Resonator output → 4-factor formula | M-22.2 |
| ΦL → Maturity | Raw ΦL → maturity modifier → ΦL_effective | M-22.2 |
| Node → Container | Component ΦL → parent Bloom (dampened) | M-22.5 |
| Graph → ΨH | Laplacian → λ₂ + TV_G | M-22.3 |
| Line → Conductivity | Endpoint properties → 3-layer evaluation | M-22.6 |
| State → Events | ΦL/ΨH/εR changes → 6 triggers | M-22.7 |
| Recovery → Hysteresis | Improving ΦL → γ/2.5 | M-22.5 |

---

## New Spec Documents (Sessions 2–3)

### Morpheme Identity Map v2.0

**Path:** `docs/specs/codex-signum-morpheme-identity-map-v2.md`
**Commit:** `dff5d9c`

**The constituent test:** "Does this object have things inside it that need containment? If yes, it's a Bloom."

**5 reclassifications:** Pipeline stages, Assayer, Signal conditioning chain, Immune memory, Initium stages — all Resonator → Bloom.

**4 current graph mistypings** → R-58. **8 cascading document updates** → R-59.

### v5.0b Statistical Assessment Resonator

**Path:** `docs/specs/codex-signum-v5_0b-statistical-assessment.md`
**Commit:** `dff5d9c`

Reusable analytical Resonator for uncertainty quantification. 5-phase implementation. → R-60.

---

## Validated Refinements Backlog

### Complete

| # | Refinement | Completed At |
|---|-----------|-------------|
| R-01 | Bridge View Principle codified | M-17.2 `6b4822f` |
| R-04 | DECOMPOSE spec limits (CTQs) | M-8C |
| R-05 | %C&A per pipeline stage | M-8C |
| R-07 | Hallucinated axiom names detection | M-8C |
| R-11 | Pre-flight auth data-driven | M-8.FIX3 |
| R-13 | Decisions & memory saved | M-9.3 + M-9.4 + M-9.VA |
| R-31 | Deterministic task classification | `8570bad` |
| R-34 | Query module decomposition | `6ffd17f` |
| R-35 | Native temporal types | `017fe37` |
| R-37 | Composite indexes | `b79a354` |
| R-39 | Morpheme Instantiation Layer | M-16.4 `34cedb5` |
| R-46 | Constitutional Bloom creation | M-16.1 `8c47152` |
| R-47 | INSTANTIATES wiring | M-16.2 `3dab633` |
| R-50 | Creation layer enforcement | M-16.4 `34cedb5` |
| R-51 | Correction→Refinement rename | M-16.5 `bb8f451` |
| R-54 | Line conductivity spec | M-17.3 `192d841` |
| R-55 | Superposition mechanics spec | M-17.4 `abde0d3` |
| R-56 | Event-driven model spec | M-17.5 `c5e4ee1` |

### Planned

| # | Refinement | Target |
|---|-----------|--------|
| R-02 | Axiom Dependency Declaration | M-16.1 |
| R-03 | Dimensional Collapse → CLAUDE.md | M-16.4 |
| R-06 | Parallel execution | Future |
| R-08 | Thompson exploration on process tweaks | Future |
| R-09 | Error morpheme resolution | v5.0 resolves |
| R-10 | Model retirement preserves capabilities | M-8.INT.6 |
| R-12 | Spec-compliant tests (Level 5) | M-9.5 |
| R-14 | Morpheme mapping + 3D vis | M-9.7b |
| R-15 | Ecosystem bootstrap | M-9.8 |
| R-16 | Agent-as-trigger | M-8.INT |
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
| R-38 | Structural data lifecycle | Scale warrants |
| R-40 | Structured DECOMPOSE Input | M-8.INT |
| R-41 | Conditional DevAgent SCOPE Bypass | M-8.INT |
| R-42 | Hybrid Prompt Template | M-8.INT |
| R-43 | Tool-Use DECOMPOSE Output | M-8.INT |
| R-44 | Graph-Derived Context Transfer | M-8.INT |
| R-45 | Structured Corrections + VALIDATE | M-8.INT |
| R-48 | Agent→Resonator retyping | Absorbed into R-58 |
| R-49 | PipelineRun→Bloom retyping | Absorbed into R-58 |
| R-52 | Architect pattern design revision | Post-M-16 |
| R-53 | DevAgent pattern design revision | Post-M-16 |
| R-57 | R-39 live migration script | Absorbed into M-16 |
| R-58 | Morpheme retyping from Identity Map v2.0 | M-8.INT |
| R-59 | Cascading document updates (7 docs) | Post-M-17 |
| R-60 | Statistical Assessment Resonator Phase 1 | M-8.INT |

**R-58/R-59/R-60:** In graph as Seeds. Backlog: 48 total, 17 complete, 31 planned.

---

## Milestone Numbering (Canonical)

| M# | Name | Status | Notes |
|----|------|--------|-------|
| M-1 | Foundation | ✅ | |
| M-2 | Signal Conditioning | ✅ | |
| M-3 | *(gap — ice-boxed DND)* | 🧊 | |
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
| M-13 | UI | 📋 | After M-22 |
| M-14 | Self-Recursive Learning | 📋 | |
| M-15 | Pattern Exchange Protocol | 📋 | |
| M-16 | Constitutional Bloom + Fabric | ✅ | `8c47152`→`8b22a43` |
| M-17 | Engineering Bridge v3.0 | ✅ | `5fa3146`→`5a6845f` |
| M-18 | Assayer Implementation | 📋 | |
| M-19 | Hypothesis Tracking | 📋 | |
| M-20 | Topology Observation Helix | 📋 | Hard deps met |
| M-21 | Bridge Grid Instantiation | ✅ | `7216ceb` |
| **M-22** | **Vertical Wiring** | **📋** | **Closes State Dimension Gap** |

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

---

## Running Log

| # | Date | Entry |
|---|------|-------|
| R-14–R-21 | 2026-03-03–05 | *(See v8.1)* |
| R-22 | 2026-03-16 | v8.1 reconciliation. 16 anomalies fixed, 19 R-items restored. |
| R-23 | 2026-03-16 | M-16 complete. Tests: 1564. |
| R-24 | 2026-03-16 | M-17 complete. Bridge v3.0 final. |
| R-25 | 2026-03-16 | Identity Map v2.0 + v5.0b committed. R-58/R-59/R-60 defined. |
| R-26 | 2026-03-16 | R-58/R-59/R-60 created in graph. Backlog: 48/17/31. |
| R-27 | 2026-03-16 | M-21 complete. 27 Seeds, 18 Lines. REFERENCES + SPECIFIED_BY Line types. |
| R-28 | 2026-03-16 | M-21 stamped complete (phiL 0.9). Constitutional Bloom parent recalculated. |
| R-29 | 2026-03-16 | M-22 (Vertical Wiring) added to roadmap. 7 sub-milestones. Closes State Dimension Gap. |

---

## Key Learnings (Accumulated)

### Anti-Pattern Sweep Methodology
ALWAYS start with Neo4j diagnostic queries. The graph is the source of truth.

### Verification Methodology
Use `get_file_contents` for existence verification; `search_code` only for discovery. Compare SHA hashes.

### Compliance-as-Monitoring Is an Anti-Pattern
Structural enforcement makes violations impossible. Seven instances killed.

### Constituent Test (Identity Map v2.0)
"Does this object have things inside it that need containment? If yes, it's a Bloom."

### DEPENDS_ON Direction
`(prerequisite)-[:DEPENDS_ON]->(dependent)` — from what must complete to what it unblocks.

### Node ID Conventions
Legacy inconsistency: `M-17` vs `bloom:m-21`. Always query for actual IDs.

### Context Transfers Belong in Project Knowledge
Not the public repo.

---

*The v5.0 spec defines the contracts. The Engineering Bridge v3.0 defines the computations. The Bridge Grid makes the spec queryable. M-22 connects the computations to the live pipeline. M-9.V proves the connection works. This roadmap defines the sequence.*
