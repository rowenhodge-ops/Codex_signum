# Codex Signum — Canonical Roadmap & Milestone Taxonomy

**Version:** 4.0
**Date:** 2026-03-02
**Status:** Living document — update as milestones complete

---

## Why This Document Exists

The project accumulated three overlapping "Phase A-G" naming schemes across context transfers. This document replaces all prior phase naming with a single canonical milestone taxonomy using M-numbers.

**Rule:** All future sessions, prompts, and context transfers reference milestones by their M-number. "Phase B" is retired as ambiguous. If you need to reference historical work, use the historical mapping table at the end.

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
| 🧊 | Ice box (deprioritised, not on critical path) |

---

## Active Sequence

This is the critical path. Work proceeds in this order.

```
M-7   ✅  First self-examination
 │
M-7B  ✅  Spec review via pipeline (3 runs, 35 tasks, ~400K chars)
 │
M-8A  ✅  Report consolidation + axiom/anti-pattern compliance review
 │
M-8B  ✅  Comprehensive lean review + refactor requirements
 │
M-8C  ✅  Codex-native topology refactor (pre-flight, file injection, jidoka, hallucination detection)
 │
M-7C  ✅  Grammar refactor (Seed/Bloom morpheme-native codebase)
 │
M-8   🔄  Optimisation runs + infrastructure  ← ACTIVE
 │
M-8.INT ⏳  Architect ↔ DevAgent integration (hybrid dispatch)
 │
M-13  📋  UI (graph vis + Opus chat)
```

Everything else is ice-boxed until this sequence completes.

---

## The Milestones

### M-1: Foundation ✅
*Core library with grammar-level infrastructure.*

Neo4j schema, type system, ΦL/ΨH/εR computation, dampening (topology-aware, budget-capped), cascade prevention (depth-2, hysteresis 2.5×), adaptive thresholds (maturity-indexed), constitutional rule engine, memory types.

**Core at:** `7672101` — 763 tests, 193 exports.

---

### M-2: Signal Conditioning ✅
*7-stage pipeline: Debounce → Hampel → EWMA → CUSUM → MACD → Hysteresis → Trend. Nelson Rules. Structural review + triggers. Immune response.*

15 audited commits. Verified against Engineering Bridge §Part 4. **Do not modify** unless fixing a specific documented bug.

---

### M-3: DND-Manager Consumer Wiring ✅ (mostly) 🧊
*First consumer wired: routing, hooks, health, governance.*

Complete through M-3.9. DND at `c4a5d06` — 361 tests. Core dependency stale at `35ef4e2`.

**Ice-boxed.** DND reconnection deferred until after M-13.

---

### M-4: Patterns in Core ✅
*Thompson Router, DevAgent, Architect — live in the core library.*

---

### M-5: Architect Bootstrap ✅
*Pipeline infrastructure: SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT.*

---

### M-6: Thompson Sampling Integration ✅
*Live model selection via Bayesian posterior updates. Decision nodes in graph.*

---

### M-7: First Self-Examination ✅
*Dampening fix, observer removal, reconciliation between spec and code.*

---

### M-7B: Spec Review & Axiom Uplift ✅
*The pipeline reviews its own specification.*

Three Architect pipeline runs producing systematic spec analysis:

| Sub | Description | Status |
|-----|-------------|--------|
| M-7B.1 | Run 1: Uniform priors, 8 tasks, first live execution | ✅ 33% Opus |
| M-7B.2 | Run 2: Opus DECOMPOSE, 18 tasks, implementation-grounded | ✅ 94% Opus |
| M-7B.3 | Run 3: Gemini DECOMPOSE, 11 tasks, cross-document scope | ✅ 100% Opus |
| M-7B.4 | Informed priors implementation | ✅ |
| M-7B.5 | Auto-commit pipeline output with manifests | ✅ |
| M-7B.6 | 404-retry, streaming, Vertex auth infrastructure | ✅ |

---

### M-8A: Report Consolidation & Compliance Review ✅
*Consolidate M-7B findings, test every recommendation against axioms/grammar/anti-patterns.*

Two runs. Run 1 partial (file context gap). Run 2 full success — 4 validated, 6 reframed, 2 rejected.

**Validated discoveries:** Bridge View Principle, Dimensional Collapse as dominant anti-pattern, Axiom Dependency Declaration.

---

### M-8B: Comprehensive Lean Review ✅
*Bidirectional validation of SIPOCs, NFRs, gap analysis, value stream. Produced refactor requirements.*

---

### M-8C: Codex-Native Topology Refactor ✅
*Implemented M-8B's functional and non-functional requirements.*

| Sub | Description | Status |
|-----|-------------|--------|
| M-8C.1 | Pipeline output as graph nodes with health dimensions | ✅ |
| M-8C.2 | Multi-dimensional Thompson learning | ✅ |
| M-8C.3 | Cross-run graph queries | ✅ |
| M-8C.5 | Pre-flight auth gate | ✅ |
| M-8C.6 | File context injection at DISPATCH | ✅ |
| M-8C.7 | Directory metadata at DECOMPOSE | ✅ |
| M-8C.8 | Jidoka escalation chain | ✅ |
| M-8C.V | Verification pass | ✅ (`20812f5`) |

**Baselines at M-8C.V:** 813 tests, 193 exports. Specs: Bridge v2.0.1, Codex v3.0.1.

---

### M-7C: Grammar Refactor ✅
*Refactor the core TypeScript into Codex-native morphemes and grammar.*

| Sub | Description | Status |
|-----|-------------|--------|
| M-7C.1 | Mapping: current TypeScript entities → Codex morphemes | ✅ |
| M-7C.2 | Node type renaming (Agent → Seed, Pattern → Bloom) | ✅ |
| M-7C.3 | Relationship renaming to match grammar rules | ✅ |
| M-7C.5 | CLAUDE.md updated with new entity names | ✅ |
| M-7C.6 | Neo4j schema migration (graph node/relationship labels) | ✅ |
| M-7C.7 | All tests updated — same count, new names | ✅ |
| M-7C.8 | ELIMINATED_ENTITIES updated with old graph labels | ✅ |
| M-7C.9 | Reconcile verified (82% confidence, pre-existing gap) | ✅ |

**Baselines at M-7C close:** 841 tests, 214 exports. TypeScript clean.

---

### M-8: Optimisation Runs & Infrastructure 🔄
*Repeated Architect cycles generating real data. Thompson learning accumulates. Human feedback calibrates.*

| Sub | Description | Status |
|-----|-------------|--------|
| M-8.4 | Human feedback CLI (breaks LLM-evaluating-LLM circularity) | ✅ |
| M-8.DA | DevAgent self-hosting CLI (Thompson-routed coding pipeline) | ✅ |
| M-8.R0 | Architect review of M-7C grammar refactor (20 tasks, 206K chars) | ✅ |
| M-8.FIX | Vertex AI Gemini 3.x endpoint fix (global, not us-central1) | ✅ |
| M-8.FIX2 | Mistral region correction (europe-west4, not us-central1) | ✅ |
| M-8.R1 | Run 1: Axiom consistency review (analytical profile) | ⏳ |
| M-8.R2 | Run 2: Thompson router audit (mixed profile) | 📋 |
| M-8.R3 | Run 3: ΦL computation verification (structural profile) | 📋 |
| M-8.1 | Multiple runs with varied intents (4+ total) | 🔄 |
| M-8.2 | Thompson posteriors accumulate across task types | 🔄 |
| M-8.3 | Context-blocked posteriors differentiate task categories | 📋 |
| M-8.5 | Exploration decay validates H-011 | 📋 (needs 20+ runs) |
| M-8.6 | Performance profiling — identify bottlenecks | 📋 |
| M-8.7 | Hypothesis H-012 validation (minimum N for Thompson) | 📋 (needs N≥20/cluster) |

**Infrastructure changes in M-8:**
- HiTL gate: feedback CLI requires TTY + "confirm" for verdicts
- Rejection penalty: `d.success = false` on reject (wired to Beta posterior, not just cosmetic)
- patternId → bloomId: clean rename across 16 source + 6 test files
- Vertex endpoint: Gemini 3.x → global, Mistral → europe-west4

**Current baselines:** 841 tests, 214 exports. TypeScript clean.

---

### M-8.INT: Architect ↔ DevAgent Integration ⏳
*Connect the Architect and DevAgent pipelines through unified dispatch.*

| Sub | Description | Status |
|-----|-------------|--------|
| M-8.INT.1 | CLASSIFY confidence scoring (type + confidence + signals) | ⏳ |
| M-8.INT.2 | Hybrid task executor (mechanical → DevAgent, generative → LLM) | ⏳ |
| M-8.INT.3 | Thompson learning across execution paths | ⏳ |
| M-8.INT.4 | Manifest enhancement with execution path metadata | ⏳ |
| M-8.INT.5 | Vertex `getVertexLocation()` dynamic endpoint routing | ⏳ |
| M-8.INT.6 | Tests + CLAUDE.md documentation | ⏳ |

**Depends on:** M-8.DA ✅, M-8.4 ✅, M-8.R1-R3 (preferred but not blocking)

---

### M-13: UI — Graph Visualisation & Opus Chat 📋
*A window into the graph. Chat interface for running Cyphers and asking questions via Opus 4.6 with extended thinking.*

| Sub | Description | Status |
|-----|-------------|--------|
| M-13.1 | Tech stack selection (likely React + Neo4j browser driver) | 📋 |
| M-13.2 | Live graph topology rendering | 📋 |
| M-13.3 | Pattern health visualisation (ΦL/ΨH/εR over time) | 📋 |
| M-13.4 | Natural language → Cypher via Opus 4.6 thinking | 📋 |
| M-13.5 | Free-form Q&A about graph state | 📋 |
| M-13.6 | Thompson arm stats dashboard | 📋 |
| M-13.7 | Architect run history visualisation | 📋 |
| M-13.8 | Constitutional state viewer | 📋 |

**Design principle:** This is a *lens* on the graph, not a *layer above* it. Every view is a Cypher query. No intermediate data store.

---

## Ice Box 🧊

### M-9: DND-Manager Reconnection 🧊
Bump core SHA, reconcile interfaces, integration tests. Blocked by M-7C (now complete) but deferred until after M-13.

### M-10: Memory Operations 🧊
Compaction, distillation, flow coordinator. Prerequisite for self-recursive learning Level 1+.

### M-11: Research Pattern 🧊
Design from first principles. Spec exists at `docs/specs/codex-signum-research-pattern-design.md`.

### M-12: Constitutional Evolution 🧊
Amendment mechanism. Types exist in `src/constitutional/evolution.ts`.

### M-14: Self-Recursive Learning (Level 1-3) 🧊
Depends on M-10 (memory) and M-8 (data accumulation).

### M-15: Pattern Exchange Protocol 🧊
Federated deployment. Spec exists at `docs/specs/codex-signum-pattern-exchange-protocol.md`.

---

## Validated Refinements Backlog

| # | Refinement | Source | Implement At | Status |
|---|-----------|--------|-------------|--------|
| R-01 | Bridge View Principle — codify in Engineering Bridge spec | M-8A t15 | Now (spec edit) | ⏳ |
| R-02 | Axiom Dependency Declaration — DAG annotation | M-8A t14 | Post-M-8B | 📋 |
| R-03 | Dimensional Collapse — anti-pattern table in CLAUDE.md | M-8A | Now (doc edit) | ⏳ |
| R-04 | DECOMPOSE spec limits — CTQs for good decomposition | Session | M-8C | ✅ (via jidoka) |
| R-05 | %C&A per pipeline stage | Session (LSS) | M-8C | ✅ (via quality assessor) |
| R-06 | Parallel execution — Phase 1/3 concurrent | M-8A | Future | 📋 |
| R-07 | Hallucinated axiom names → detection catch | M-8A | M-8C | ✅ |
| R-08 | Thompson exploration on process tweaks | Session | Future | 📋 |
| R-09 | Error morpheme resolution | M-8A | Future | 📋 |
| R-10 | Model retirement should preserve capabilities | Sonnet incident | M-8.INT | ⏳ |

---

## Historical Phase Mapping

For reading old context transfers and prompts:

| Old Name | Canonical Milestone |
|----------|-------------------|
| DND Phase A | M-3.1 |
| DND Phase B | M-3.4 through M-3.9 |
| DND Phase C | M-2 (moved to core) |
| DND Phase D | M-4.1 through M-4.5 |
| Phase G / Core Reconciliation | M-4 |
| Roadmap Phase A | M-5 |
| Roadmap Phase B | M-7 |
| Roadmap Phase C | M-8 |
| Pipeline supercharge Phases 1-5 | M-3.2 through M-3.9 |
| Phase G0-G8 | M-4 sub-milestones |

---

## Dependency Graph (Active Path Only)

```
M-7   ✅  First self-examination
 │
M-7B  ✅  Spec review + axiom uplift (3 runs, 35 tasks)
 │
M-8A  ✅  Report consolidation + compliance review (2 runs, 31 tasks)
 │
M-8B  ✅  Comprehensive lean review + refactor requirements
 │
M-8C  ✅  Codex-native topology refactor (pre-flight, jidoka, hallucination detection)
 │
M-7C  ✅  Grammar refactor (Seed/Bloom morpheme-native codebase)
 │
M-8   🔄  Optimisation runs + infrastructure (R0 ✅, R1-R3 ⏳, HiTL ✅, DevAgent CLI ✅)
 │
M-8.INT ⏳  Architect ↔ DevAgent unified dispatch
 │
M-13  📋  UI (graph vis + Opus chat)
```

---

*This document is the single source of truth for project sequencing. All future prompts and context transfers reference M-numbers.*
