# Codex Signum — Canonical Roadmap & Milestone Taxonomy v6.2

**Version:** 6.2
**Date:** 2026-03-04
**Status:** Living document — update as milestones complete

---

## Why This Version

v5 was the "pause and get the plan right" version — test gate policy, Bridge View Principle detail, grammar reference, milestone un-ice-boxing, M-19 hypothesis tracking. v6 applies structural review findings to the plan itself:

1. **M-9 is too large.** Eight sub-milestones spanning schema, executor rewiring, decision lifecycle, memory persistence, test reconciliation, model expansion, grammar inventory, 3D visualisation, and ecosystem bootstrap. v6 inserts a partial verification checkpoint (M-9.VA) after M-9.1–9.4, splitting the tunnel into two visible halves.
2. **M-9.7 is two milestones pretending to be one.** Grammar reference (documentation inventory) and 3D topology visualisation (Three.js implementation) are different kinds of work with different failure modes. Split into M-9.7a and M-9.7b so the grammar reference isn't blocked by visualisation snags.
3. **Gate failure path undefined.** v5 described gate success clearly but not what happens when a gate fails. v6 adds the failure protocol: surface to Ro for decision.
4. **Agent annotations missing.** Every task now declares which agent (Architect pattern, DevAgent, or Ro) does the heavy lifting. This feeds directly into M-8.INT's routing design and makes session planning concrete.
5. **Test baseline updated.** Codex_signum core: 1073 tests (1048 passed, 6 failed, 1 skipped, 18 todo). 6 pre-existing failures to resolve or risk-accept before M-8.QG gate.

**v6.1 (2026-03-04):** M-8.QG stamped ✅. M-9.1, M-9.2 stamped ✅. Test baseline 1108. M-9.3 promoted to ⏳.

**v6.2 (2026-03-04):** M-9.3 stamped ✅. Test baseline 1133 (1114 passed, 0 failed, 1 skipped, 18 todo), 234 exports. M-9.4 promoted to ⏳. M-9.VA pre-requisites expanded with ΦL conditioning deferral note (Observations use `recordObservation()`, not `writeObservation()` — conditioning cascade must be triggered or deferred during verification). R-13 partially closed.

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
| 🤖 **Sonnet** | Direct agent execution (Claude Code / Codex 5.3). Well-scoped, mechanical work. |
| 🤖+🏗️ **Agent+Architect** | Agent executes with Architect pattern providing analytical support. |

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

The agent (CLI, Codex 5.3, or future UI) needs model selection at two levels:

**Task-level routing** is handled by the Thompson router within pipeline execution. This already works — Thompson selects the best model for each individual task based on posterior quality distributions. No change needed.

**Session-level routing** is the architect's (Ro's) decision until M-8.INT automates it via CLASSIFY:

| Session Type | Recommended Model | Rationale |
|-------------|-------------------|-----------|
| Architectural judgment (planning, spec review, design decisions) | Opus | Emergent insight (Bridge View Principle was Opus). Worth the fabrication risk with proper governance. |
| Well-scoped implementation (execute a specific prompt, wire a specific component) | Sonnet | Reduced inventiveness = reduced fabrication. The prompt provides the architecture, the agent provides the labour. |
| Mechanical tasks (rename, format, config, migration) | Sonnet or Haiku | Speed matters more than depth. Low fabrication risk because scope is narrow. |
| Exploratory research (literature review, comparison analysis) | Opus | Needs to synthesise across sources and identify non-obvious connections. |

**After M-8.INT:** CLASSIFY handles this automatically. The Architect examines the intent, classifies the task profile, and selects the appropriate execution path including model tier. The human provides intent, not model selection.

**Current practical guidance:** When writing prompts for the agent, match the model to the cognitive demand. A prompt that says "wire bootstrap-task-executor.ts to create TaskOutput nodes using the existing writeObservation path" is Sonnet work. A prompt that says "review the morpheme mapping for completeness and identify structural gaps" is Opus work.

---

## Critical Path Summary

```
M-8.QG ✅  Quality gates
 │
 ├─── TEST GATE ───
 │
M-9    🔄  Structural compliance (Part 1: .1-.4 — schema + wiring)
 │         .1 ✅  .2 ✅  .3 ✅  .4 ⏳
 │
 ├─── TEST GATE ───
 │
M-9.VA 📋  Partial verification — pipeline run against graph-wired system
 │
 ├─── TEST GATE ───
 │
M-9    📋  Structural compliance (Part 2: .5-.8 — reconciliation + topology + bootstrap)
 │
 ├─── TEST GATE ───
 │
M-9.V  📋  Full verification — end-to-end structural compliance confirmed
 │
 ├─── TEST GATE ───
 │
M-16   📋  v4.0 Spec canonicalisation
 │
 ├─── TEST GATE ───
 │
M-17   📋  Engineering Bridge v2.1
 │
 ├─── TEST GATE ───
 │
M-8.INT 📋  Architect adaptive routing + agent-as-trigger
 │
 ├─── TEST GATE ───
 │
M-13   📋  UI (graph vis + Opus chat)
 │
 ╔═══════════════════════════════════════════════════════
 ║  POST-CRITICAL-PATH — core capabilities
 ╚═══════════════════════════════════════════════════════
 │
M-18   📋  Assayer implementation
 │
 ├─── TEST GATE ───
 │
M-10   📋  Memory operations
 │
 ├─── TEST GATE ───
 │
 ├──── M-11 📋  Research pattern        ┐ parallel
 ├──── M-12 📋  Constitutional evolution ┘
 │       │
 │       ├─── TEST GATE ───
 │       │
 │       M-14 📋  Self-recursive learning L1-L3
 │               │
 │               ├─── TEST GATE ───
 │               │
 │               M-15 📋  Pattern Exchange Protocol
 │
 ╔═══════════════════════════════════════════════════════
 ║  PARALLEL TRACK — starts at M-9.7a, accumulates throughout
 ╚═══════════════════════════════════════════════════════
 │
M-19   📋  Hypothesis tracking + research pipeline
```

**Every transition through a TEST GATE requires:** gate success per Test Gate Policy. Gate failure → surface to Ro.

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
Pre-flight auth gate, file context injection, directory metadata, jidoka escalation, hallucination detection — all complete. **Baselines at M-8C.V:** 813 tests, 193 exports, commit `20812f5`. **Current (post M-9.3):** 1133 tests (1114 passed, 0 failed, 1 skipped, 18 todo), 234 exports.

**Corrections from v4 roadmap:**
| Sub | v4 Claimed | Actual Status |
|-----|-----------|---------------|
| M-8C.1 | ✅ Pipeline output as graph nodes | ❌ Output goes to `docs/pipeline-output/` as markdown files |
| M-8C.2 | ✅ Multi-dimensional Thompson learning | ⚠️ Quality scoring exists but full multi-objective (quality × cost × latency) not wired |
| M-8C.3 | ✅ Cross-run graph queries | ❌ No graph nodes to query — depends on M-8C.1 |

These are now M-9.1–9.4.

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

**Key finding from R1-R3:** Pipeline works when context is properly scoped. Fabrication occurs when source material is truncated or missing. This directly motivates M-8.QG.

**Current test baseline (as of M-9.3, 2026-03-04):**

| Metric | Count |
|--------|-------|
| Total tests | 1133 |
| Passed | 1114 |
| Failed | 0 |
| Skipped | 1 |
| Todo (future-scope) | 18 |
| Exports | 234 |

**Todo tests (future-scope, `@future` candidates):**
- `dev-agent.test.ts:91-97` — 7 todos
- `hierarchical-health.test.ts:65-70` — 6 todos
- `immune-response.test.ts:93-97` — 5 todos

**6 pre-existing failures resolved by M-8.QG.0.** All in-scope tests passing as of M-9.3.

---

## Active Milestones

### M-8.QG: Quality Gates ✅

*Scaffolding-level fixes for known pipeline output quality issues. Prerequisite for M-9 — no point writing bad output to the graph.*

| Sub | Description | Agent | Model | Status |
|-----|-------------|-------|-------|--------|
| M-8.QG.0 | Resolve or risk-accept 6 pre-existing test failures (5 failed test files) | 🔧 DevAgent | Sonnet 4.6 | ✅ |
| M-8.QG.1 | Increase per-task context caps (current truncation causes fabrication) | 🔧 DevAgent | Sonnet 4.6 | ✅ |
| M-8.QG.2 | Source verification gate (task must cite actual source, not inferred) | 🔧 DevAgent | Sonnet 4.6 | ✅ |
| M-8.QG.3 | Canonical entity allowlists (axiom names, stage names, morpheme names) | 🔧 DevAgent | Sonnet 4.6 | ✅ |
| M-8.QG.4 | Cross-task consistency check strengthening | 🔧 DevAgent | Sonnet 4.6 | ✅ |

**Exit criteria:** Pipeline run where zero tasks fabricate axiom names or cite nonexistent sources. All tests pass. ✅ Achieved — commits `f09d4d3` through `e26f467`.

**Gate failure → surface to Ro.**

---

### M-9: Structural Compliance 🔄

*The system's thesis is "state is structural." This milestone makes it true for the pipeline itself. Pipeline output becomes graph nodes. Task outputs feed ΦL. Decisions complete their lifecycle. Memory strata populate from real execution data.*

**Why this is the critical blocker:** Every feature downstream — cross-run learning, Thompson multi-objective optimisation, Retrospective pattern, self-recursive learning — requires structured data in the graph. Without M-9, the system computes health correctly for models and patterns but has no health data for its own analytical output. The pipeline is the system's most complex pattern, and it's the only one not structurally represented.

**Structure:** M-9 is split into two parts with a partial verification checkpoint (M-9.VA) between them. Part 1 (M-9.1–9.4) wires the pipeline to the graph. Part 2 (M-9.5–9.8) reconciles tests, expands models, maps the grammar, and bootstraps the ecosystem. The partial verification confirms the structural wiring works before building on top of it.

---

#### Part 1: Schema + Wiring (M-9.1–9.4)

##### M-9.1: Neo4j Schema for Pipeline Topology

Create the morpheme topology for the pipeline itself:

- **Resonator nodes** for each pipeline stage (SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT). These are the atomic processing units of the Architect pattern.
- **PipelineRun nodes** (Stratum 2 — execution instances). Each `executePlan()` invocation creates one. Properties: runId, intent, timestamp, taskCount, duration, modelDiversity, overallQuality.
- **TaskOutput nodes** (Stratum 2 — individual task results). Each dispatched task creates one. Properties: taskId, title, modelUsed, outputLength, qualityScore, hallucinationFlags, duration.
- **Lines** connecting Resonator → PipelineRun → TaskOutput to encode the execution flow.
- **Bloom** for the Architect pattern containing its Resonators.

Schema must support: "show me all runs where DECOMPOSE used Gemini and quality was above threshold" as a Cypher query.

| Agent | Model |
|-------|-------|
| 🔧 DevAgent | Sonnet 4.6 |

**Test gate:** Schema creation tests pass. Node creation/query round-trips verified. ✅ Achieved — commits `df76a6a` through `7d70666`. 21 new tests.

##### M-9.2: Pipeline Executor Writes to Graph

Modify `bootstrap-task-executor.ts` (and any other executors) to write TaskOutput nodes to Neo4j instead of (or in addition to) markdown files on disk.

- Each task execution writes a TaskOutput node with the task result, model used, quality score, and hallucination detection results.
- PipelineRun node created at plan start, updated at plan end with aggregate stats.
- Markdown files can remain as a human-readable cache, but the graph is the source of truth.
- The write path uses `writeObservation()` or equivalent — inline, not a separate pipeline.

| Agent | Model |
|-------|-------|
| 🔧 DevAgent | Sonnet 4.6 |

**Test gate:** Integration test that runs a mock pipeline and verifies TaskOutput nodes exist in Neo4j with correct properties and relationships. ✅ Achieved — commits `9680893` through `b4a0850`. 7 new tests.

##### M-9.3: Decision Lifecycle Completion

Currently, Thompson routing decisions are recorded to Neo4j (`recordDecision` in queries.ts), but the lifecycle is incomplete:

- **Decision → Outcome:** Task quality scores must flow back to the Decision node that selected the model. This closes the Thompson learning loop with real quality data, not just "did the API call succeed."
- **TaskOutput → Observation:** Each TaskOutput should generate an Observation that feeds ΦL computation for the Architect Bloom. This is how the pipeline's own health becomes structurally visible.
- **Aggregate ΦL for pipeline stages:** DECOMPOSE's ΦL should reflect the quality distribution of its outputs across runs. A stage that consistently produces high-quality decompositions has high ΦL. One that hallucinates file paths has declining ΦL. This is the Assayer's future data source.

| Agent | Model |
|-------|-------|
| 🔧 DevAgent | Sonnet 4.6 |

**Test gate:** Decision nodes have outcome data. Observation nodes exist for pipeline tasks. ΦL computes for the Architect Bloom from real data. ✅ Achieved — commits `3a7261d` through `3a86151`. 25 new tests, all passing. Note: Observations use `recordObservation()` not `writeObservation()` — ΦL recomputation deferred to M-9.VA (see pre-requisites).

##### M-9.4: Memory Persistence as Intended

Memory operations (compaction, distillation) are currently stubs (`src/memory/`). The type system exists but operations don't execute. This milestone implements the minimum viable memory path:

- **Stratum 2 (Observations):** Pipeline execution data flows through `writeObservation()` and persists. Observation weight decays exponentially per spec (`e^(-λ × age)`, 14-day half-life default).
- **Stratum 3 (Distillations):** Cross-run patterns distilled from accumulated Observations. "Opus consistently outperforms Mistral-small on analytical tasks" is a Distillation, not a markdown note. Distillation triggers on structural conditions (sufficient observation count + variance detection), not timers.
- **Stratum 4 (Institutional Knowledge):** Not in scope for M-9 — this is M-10 territory. But the write path must exist so Strata 2-3 data doesn't dead-end.

| Agent | Model |
|-------|-------|
| 🔧 DevAgent | Sonnet 4.6 |

**Test gate:** Observations persist and decay correctly. Distillation trigger fires when conditions are met. Memory queries return expected results. All existing memory tests still pass.

---

#### M-9.VA: Partial Verification 📋

*Run the Architect pipeline against the graph-wired system. Confirm the structural wiring from M-9.1–9.4 works before building Part 2 on top of it.*

**Pre-requisites (confirmed during M-9.3 review):**
1. `scripts/architect.ts` must add `{ graphEnabled: true, architectBloomId: "architect" }` to `createBootstrapTaskExecutor()` call
2. **ΦL conditioning deferral:** M-9.3 writes Observations via `recordObservation()` (raw graph write), not `writeObservation()` (full conditioning path). The bootstrap executor lacks `PatternHealthContext` and `SignalPipeline` instances. Observations exist in the graph and are linked to the Architect Bloom, but ΦL is not recomputed inline. Verification must either: (a) trigger a conditioning pass over accumulated Observations after the pipeline run, or (b) accept that ΦL recomputation is deferred until a full graph-feeder context runs.

- Architect pipeline run with analytical intent (similar to M-8.R1)
- Verify: TaskOutput nodes created in Neo4j for every task
- Verify: PipelineRun node has aggregate stats
- Verify: Decision nodes have quality outcomes
- Verify: Observation nodes exist and feed ΦL computation (subject to pre-requisite #2)
- Human feedback recorded via CLI, verified in graph

| Agent | Model |
|-------|-------|
| 🏗️ Architect (live pipeline run) | Thompson-routed (multi-model) |
| 👤 Ro | Review results, accept/reject |

**Exit criteria:** The system can answer "how is my pipeline performing?" from a Cypher query, not from reading markdown files.

**Test gate:** All in-scope tests pass after verification run. Gate failure → surface to Ro.

---

#### Part 2: Reconciliation + Topology + Bootstrap (M-9.5–9.8)

##### M-9.5: Test Reconciliation

The structural changes in M-9.1–9.4 will break tests that assume:
- Pipeline output is markdown files
- No TaskOutput/PipelineRun nodes exist in the graph
- Memory operations are no-ops

These failures prove the structural changes landed. The reconciliation task:
1. Run full test suite, catalogue all failures.
2. Categorise each failure: (a) test assumed old write path — update test to verify new write path, (b) test verified stub behaviour that's now real — update test to verify real behaviour, (c) genuine regression — fix code.
3. Resolve all in-scope failures within the milestone.
4. Any `@future` tests whose milestone is M-9 are now promoted to in-scope and must pass.
5. Any test that can't be made to pass reveals a gap in M-9.1–9.4 implementation. Fix the implementation, not the test.

| Agent | Model |
|-------|-------|
| 🤖 Agent (mechanical) | Sonnet 4.6 or Codex 5.3 |

**Exit criteria:** Gate success per Test Gate Policy. Future-requirement tests for later milestones logged but not blocking.

##### M-9.6: Model Expansion — Llama 4

Add Llama 4 (Meta) to the Thompson router via Vertex AI Model Garden. Seed with uniform priors — Thompson exploration begins automatically. This is a bootstrap entry + pre-flight auth verification, not infrastructure work.

Gemma is mostly deploy-required (87/89 entries need GPU provisioning). The two serverless entries (ShieldGemma, T5Gemma) are specialised. Gemma expansion deferred until deploy infrastructure is justified by workload. Llama 4 on Vertex serverless is the immediate win.

| Agent | Model |
|-------|-------|
| 🔧 DevAgent | Sonnet 4.6 |

**Exit criteria:** Llama 4 Seed node in Neo4j. Pre-flight auth passes. Thompson routes to it on exploratory selections. Gate success per policy.

##### M-9.7a: Grammar Reference Document

**There is currently no single document listing every structural element in the Codex grammar and its implementation status.** The vocabulary is scattered across v3.0 spec, v4.0 draft, Engineering Bridge, Lean process maps (stale), and CLAUDE.md. Before mapping anything to morphemes, produce a canonical grammar reference:

| Category | Elements | Source | Implementation Status |
|----------|----------|--------|-----------------------|
| Morphemes (6) | Seed, Line, Bloom, Resonator, Grid, Helix | v3.0 §Morphemes, v4.0 §Morphemes | Graph labels ✅, full structural identity varies |
| State dimensions (3) | ΦL (luminosity), ΨH (harmonic signature), εR (exploration rate) | v3.0 §State Dimensions, Bridge §Part 2 | Computation ✅, pipeline nodes to compute ON ❌ (M-9.1–9.4 gap) |
| Grammar rules (5) | G1 Proximity, G2 Orientation, G3 Containment, G4 Flow, G5 Resonance | v3.0/v4.0 §Grammar | Tests exist, structural enforcement partial |
| Axioms (9, post v4.0) | A1 Fidelity through A9 Comprehension Primacy | v4.0 §Axioms | Constitutional rules ✅, test coverage varies |
| Anti-patterns (10+) | Shadow system, dimensional collapse, etc. | CLAUDE.md, v4.0 | Detection ✅ (hallucination system), structural prevention partial |
| Meta-imperatives (3) | Ω₁ reduce suffering, Ω₂ increase prosperity, Ω₃ increase understanding | v3.0/v4.0 §Meta-Imperatives | Defined ✅, gradient computation ❌ (aspirational) |
| Operational records | Decision, Observation, ThresholdEvent, PipelineRun, TaskOutput | Bridge, schema.ts | Partial — Decisions ✅, Observations ✅, pipeline records ❌ (M-9.1–9.4) |
| Strata (5) | Raw→Observations→Distillations→InstitutionalKnowledge→Constitutional | v3.0 §Memory, v4.0 §Memory | Types ✅, write paths partial (M-9.4 + M-10) |

This reference becomes the seed for M-16.3's Assayer compliance corpus. It also serves as the "bill of materials" for M-9.7b's morpheme mapping and M-9.8's ecosystem bootstrap.

**Lean process maps status:** The M-8B audit found 8 violations (Observer as separate entity was the root cause). Corrections agreed but documents not updated. The stale Lean documents should be corrected as part of this task — remove Observer, Signal Pipeline, and Health Computation as separate boxes. Replace with inline descriptions. Update dependency matrix. This is Stratum 4 Institutional Knowledge cleanup.

| Agent | Model |
|-------|-------|
| 🏗️ Architect | Opus 4.6 |

**Exit criteria:** Single canonical document listing every grammar element with implementation status. Lean process maps corrected per audit findings.

##### M-9.7b: Morpheme Mapping + 3D Topology Visualisation

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
| Process maps / SIPOCs | Institutional Knowledge (Stratum 4) | Design documents consumed by humans and SURVEY, not by the running system. Not morphemes — they describe how things should be wired, they don't wire them. |
| FMEA records | Institutional Knowledge (Stratum 4) | Failure mode analysis per plan/task. Written by Architect, reconciled by Assayer post-flight, queried by SURVEY for future plans. |

**3D topology visualisation:** Produce an interactive HTML visualisation (Three.js or equivalent) showing the morpheme topology in 3D — Blooms as containers, Seeds as nodes within them, Lines as connections across Blooms, Helixes as spiralling learning paths, Grids as reference planes alongside. This is a working blueprint that prevents dimensional collapse during implementation. It's temporary scaffolding until M-13 UI replaces it, but it makes the shape of the system visible to both human and agent.

This mapping must be accompanied by:
- Neo4j schema additions for new node types and relationships
- The 3D visualisation generated from the actual graph state

| Agent | Model |
|-------|-------|
| 🏗️ Architect (mapping decisions) | Opus 4.6 |
| 🔧 DevAgent (schema + vis implementation) | Sonnet 4.6 |

**Exit criteria:** Every element in the table above has a corresponding node type in Neo4j with at least one instance created. Relationships connect them per the grammar. A Cypher query can answer: "which tests are scoped to M-9?" and "what is the ΦL of the M-9 milestone Bloom?" 3D visualisation renders from live graph data. Gate success per policy.

##### M-9.8: Ecosystem Bootstrap — Operating in the Codex

This is the transition from building the system to building *with* the system.

**What goes into the graph:**
- This roadmap (v6) becomes a Bloom containing milestone Blooms. Each milestone Bloom contains its task Seeds and test Seeds. The `@future(M-{N})` annotation becomes a `SCOPED_TO` relationship between a test Seed and a milestone Bloom.
- Existing process maps and SIPOCs become Institutional Knowledge nodes (Stratum 4) — design reference that the Architect's SURVEY can query, but not runtime morphemes. They describe how things should be wired, they don't wire them.
- FMEA records become Institutional Knowledge nodes (Stratum 4) — written by the Architect during planning, reconciled by the Assayer post-flight, queried by SURVEY for future plans.
- The Assayer compliance corpus (from M-16.3) becomes a Grid — the structure is defined here so it's ready when the corpus populates.
- Test results become Observations on test Seeds. Test suite pass rates become ΦL on test Blooms. Phase health becomes ΦL on milestone Blooms.

**What this changes about how we work:**
- The Architect pattern reads the roadmap from the graph, not from a markdown file. SURVEY queries milestone status, test health, and known gaps.
- Plan edits are graph mutations, not document edits. When the Architect recommends reprioritising a milestone, that's a graph update.
- Future test counts are Cypher queries, not prose in a document.
- "Where are we?" is answered by `MATCH (m:Bloom {type: "milestone"}) RETURN m.name, m.phiL, m.status ORDER BY m.sequence` — not by reading a markdown file.

**What this does NOT change yet:**
- The Architect still needs a human to trigger execution (agent CLI or equivalent). Autonomous dispatch is M-8.INT.
- The Assayer pattern is types only until M-18. But the compliance corpus Grid structure exists for when it activates.
- SIPOCs and process maps need to be authored — this is intellectual work, not just schema creation. The Architect can draft them, Ro validates.

| Agent | Model |
|-------|-------|
| 🏗️ Architect (structural design) | Opus 4.6 |
| 🔧 DevAgent (graph wiring) | Sonnet 4.6 |
| 👤 Ro (SIPOC validation) | — |

**Exit criteria:** The roadmap is queryable from the graph. Test Seeds connect to milestone Blooms. The Architect's SURVEY stage reads project state from Neo4j. A pipeline run against the roadmap produces structural output. Gate success per policy.

---

### M-9.V: Full Verification Run 📋

*Run the Architect pipeline against the fully restructured system. Verify that output goes to graph, decisions complete their lifecycle, the system can query its own execution history, and the ecosystem bootstrap is structurally sound.*

- Architect pipeline run with analytical intent (similar to M-8.R1)
- Verify: TaskOutput nodes created in Neo4j for every task
- Verify: PipelineRun node has aggregate stats
- Verify: Decision nodes have quality outcomes
- Verify: Observation nodes feed ΦL computation
- Verify: Cross-run Cypher query returns meaningful results ("compare this run's quality distribution to the last 3 runs")
- Verify: Milestone Blooms queryable with correct ΦL
- Human feedback recorded via CLI, verified in graph

| Agent | Model |
|-------|-------|
| 🏗️ Architect (live pipeline run) | Thompson-routed (multi-model) |
| 👤 Ro | Review results, accept/reject |

**Exit criteria:** The system can answer "how is my pipeline performing?" and "what is the health of M-9?" from Cypher queries, not from reading markdown files.

**Test gate:** All tests pass after verification run. Gate failure → surface to Ro.

---

### M-16: v4.0 Spec Canonicalisation 📋

*The v4.0 spec draft exists (`codex-signum-v4_0-draft.md`). This milestone makes it canonical and propagates changes through the codebase.*

| Sub | Description | Agent | Model | Status |
|-----|-------------|-------|-------|--------|
| M-16.1 | Ro review pass on v4.0 draft | 👤 Ro | — | 📋 |
| M-16.2 | Axiom reduction (10→9) applied to codebase | 🤖 Agent (mechanical) | Sonnet 4.6 | 📋 |
| M-16.3 | Assayer types + compliance corpus structure | 🏗️ Architect (corpus design) + 🔧 DevAgent (types) | Opus 4.6 + Sonnet 4.6 | 📋 |
| M-16.4 | Governance updates (CLAUDE.md, ELIMINATED_ENTITIES, hallucination detection) | 🤖 Agent (mechanical) | Sonnet 4.6 | 📋 |

#### M-16.1: Ro Review Pass

Ro reviews v4.0 draft. Decisions on:
- Axiom reduction (10→9, A1 Symbiosis absorbed into A2 and A9)
- v3.1 addendum absorption
- OpEx refinements
- Assayer as fifth reference pattern
- Evidence-based Constitutional Evolution

No code changes. Output: approved v4.0 spec or annotated revision notes.

#### M-16.2: Axiom Reduction Applied to Codebase

- Renumber axioms (or apply DAG-informed ordering)
- Remove Symbiosis as standalone axiom from constitutional rules, type definitions, test references
- Update CLAUDE.md axiom table
- Update ELIMINATED_ENTITIES with old axiom references
- Update hallucination detection allowlists

**Test gate:** All axiom-referencing tests updated and passing.

#### M-16.3: Assayer Pattern Type Definitions

- Create `src/patterns/assayer/types.ts` with: ProposalType, StructuralClaim, ClaimValidation, ComplianceResult, PostFlightResult
- Create `src/patterns/assayer/corpus.ts` with compliance corpus structure (read-only mirror of canonical spec)
- This is types and corpus only — full pipeline implementation is future work (M-18)
- Compliance corpus populated from v4.0 spec: morphemes, axioms, grammar rules, state dimensions, meta-imperatives, anti-patterns, eliminated entities

**Test gate:** Type definitions compile. Corpus populates from spec. Corpus version matches spec version.

#### M-16.4: Governance Updates

- CLAUDE.md: updated axiom table, anti-pattern table, Assayer references
- ELIMINATED_ENTITIES: old axiom names, Symbiosis references
- Hallucination detection: updated axiom count (9 not 10), updated allowlists
- v3.0/v3.1 spec files: add supersession notices pointing to v4.0

**Test gate:** All tests pass. Hallucination detection correctly flags references to 10 axioms. Gate failure → surface to Ro.

---

### M-17: Engineering Bridge v2.1 📋

*The Engineering Bridge is stale. Three formulas identified as incorrect in M-8A. Build experience from 6 months of implementation not captured. v3.1 computation details deferred from v2.0 never delivered.*

| Sub | Description | Agent | Model | Status |
|-----|-------------|-------|-------|--------|
| M-17.1 | Stale formula audit | 🏗️ Architect | Opus 4.6 | 📋 |
| M-17.2 | Bridge View Principle codification | 🏗️ Architect | Opus 4.6 | 📋 |
| M-17.3 | Build experience addendum | 🏗️ Architect | Opus 4.6 | 📋 |
| M-17.4 | Deferred computation details — verify + document | 🏗️ Architect (verify) + 🔧 DevAgent (fix gaps) | Opus 4.6 + Sonnet 4.6 | 📋 |

#### M-17.1: Stale Formula Audit
Review all Bridge formulas against actual implementation. Fix the 3 known stale formulas from M-8A findings. Apply Bridge View Principle: every formula must be a pure function of grammar-defined morpheme states and axiom-defined parameters.

#### M-17.2: Bridge View Principle Codification

The Bridge View Principle was discovered by the pipeline during M-8A t15 analysis:

> "Every Engineering Bridge formula MUST be expressible as a pure function of grammar-defined morpheme states and axiom-defined parameters. No Bridge formula may introduce state, thresholds, entities, or temporal behavior not grounded in the symbolic grammar."

This single principle resolved nine separate M-8A recommendations (F-2, F-4, F-7, AI-03, AI-07, AI-09, C-03, C-07, C-10) — each proposed adding some new parameter, threshold, or entity. The principle says: if it's not in the grammar, the Bridge can't use it.

Codification means:
- Add the Bridge View Principle as a normative constraint in the Engineering Bridge spec (section header, not buried in prose)
- Define the compliance test: for each formula, enumerate its inputs. Every input must trace to either a grammar-defined morpheme state (ΦL, ΨH, εR, node properties, relationship properties) or an axiom-defined parameter (cascade limit, hysteresis ratio, dampening constants). If any input doesn't trace, the formula violates the principle.
- Add the principle to the Assayer compliance corpus (M-16.3) so it becomes a structural rule that can be checked programmatically
- Retroactive audit: verify every existing Bridge formula complies. Document violations and either (a) add the missing input to the grammar, or (b) rewrite the formula to use grammar-defined inputs
- Add to CLAUDE.md as an architectural constraint — agents authoring Bridge formulas must satisfy this principle

This is the highest-value single architectural constraint discovered in the project. It eliminates an entire class of scope creep where Bridge formulas gradually introduce ad-hoc state that isn't governable through the grammar.

#### M-17.3: Build Experience Addendum
Document what was learned building with the spec:
- Thompson sampling: informed priors, context-blocked posteriors, exploration decay
- Hallucination detection: three-layer system, ELIMINATED_ENTITIES, Jidoka escalation
- Governance files: CLAUDE.md as persistent agent context, hook-based structural enforcement
- Convergence data: real pipeline run statistics (model selection distributions, quality distributions, ADAPT trigger rates)

#### M-17.4: Deferred Computation Details

v3.1 computation details promised in Bridge v2.0 were never documented, but most were *implemented* during Phase G core reconciliation:

| Computation | Implementation Status | Bridge Documentation Status |
|-------------|----------------------|---------------------------|
| ΨH temporal decomposition (EWMA trend, friction_transient, friction_durable) | ✅ Built in G-1.2/G-1.3 | ❌ Not in Bridge |
| ΨH hypothetical state computation (projected ΨH for proposed changes) | ⚠️ Verify — may be in structural-review.ts | ❌ Not in Bridge |
| εR spectral calibration table (spectral ratio → minimum εR floor) | ⚠️ Verify — flagged twice in completeness review | ❌ Not in Bridge |
| εR floor = max(gradient_term, spectral_term) | ⚠️ Verify | ❌ Not in Bridge |
| Signal conditioning stage parameters (all 7 stages) | ✅ Built in G-2 | Partial — Bridge §Part 4 has some, not all |
| ΦL temporal_stability (4th factor, ring buffer) | ✅ Built in G-1.1 | ❌ Not in Bridge |

**The code is ahead of the spec.** This is still a problem — future agents building from the stale Bridge will create drift. This task brings the Bridge into alignment with the implementation.

**Action items:**
1. Document all implemented computation details in Bridge v2.1
2. Verify the ⚠️ items — if εR spectral calibration isn't fully wired, implement it (this is how the system ensures minimum exploration rates based on spectral state — it should be capturing this data with every run)
3. If ΨH hypothetical state computation isn't implemented, add it as a future task (M-10 territory) but document the intended interface in the Bridge
4. Ensure every formula in the Bridge passes the Bridge View Principle audit from M-17.2

**Test gate:** Any implementation gaps found during verification get fixed, with corresponding tests. Documentation-only changes don't require new tests. Gate failure → surface to Ro.

---

### M-8.INT: Architect Adaptive Routing 📋

*Previously "Architect ↔ DevAgent Integration." Expanded to include routing intelligence — the Architect knowing when to run full pipeline, partial pipeline, or route directly to DevAgent/Assayer.*

The Architect's CLASSIFY stage becomes the routing decision point:

| Task Profile | Route |
|-------------|-------|
| Complex analytical (spec review, architecture assessment) | Full Architect pipeline: SURVEY→DECOMPOSE→...→ADAPT |
| Scoped coding task with clear acceptance criteria | Architect CLASSIFY → Assayer advisory (per-task FMEA) → DevAgent SCOPE→EXECUTE→REVIEW→VALIDATE → Assayer gate |
| Structural validation (does this change comply?) | Architect CLASSIFY → Assayer (advisory or gate mode) |
| Simple mechanical (rename, format, config change) | Straight to Thompson router → model execution |
| Post-session audit | Assayer post-flight mode (aggregate validation + FMEA reconciliation) |

**Per-task FMEA advisory** is the gap between plan-level FMEA (Architect generates during SURVEY) and session-level FMEA reconciliation (Assayer post-flight). Before a task dispatches, the Assayer advisory mode answers: "given this task's scope and the compliance corpus, what are the likely failure modes and their detection signatures?" This gives the DevAgent (or human) specific things to watch for during execution, not just structural compliance after the fact.

This means the agent (CLI, Codex 5.3, or future UI) becomes a trigger and monitor:
1. Human provides intent ("implement M-9.2")
2. Agent triggers Architect
3. Architect CLASSIFYs, routes appropriately
4. Agent monitors execution, surfaces results
5. Human provides feedback (accept/reject/adjust)

The agent doesn't decide *how* to implement. The Architect does. The agent doesn't decide *what model to use*. Thompson does. The agent doesn't decide *if the change is compliant*. The Assayer does. The agent is the substrate that runs these patterns.

| Sub | Description | Agent | Model | Status |
|-----|-------------|-------|-------|--------|
| M-8.INT.1 | CLASSIFY routing logic (task profile → execution path) | 🏗️ Architect (design) + 🔧 DevAgent (implement) | Opus 4.6 | 📋 |
| M-8.INT.2 | Architect DISPATCH → DevAgent SCOPE handoff | 🔧 DevAgent | Sonnet 4.6 | 📋 |
| M-8.INT.3 | DevAgent results → Architect REVIEW feedback loop | 🔧 DevAgent | Sonnet 4.6 | 📋 |
| M-8.INT.4 | Assayer invocation from CLASSIFY (advisory) and REVIEW (gate) | 🏗️+🔧 Architect→DevAgent | Opus 4.6 | 📋 |
| M-8.INT.5 | Agent-as-trigger interface (intent in → structured execution → results out) | 🔧 DevAgent | Sonnet 4.6 | 📋 |
| M-8.INT.6 | Model retirement should preserve capabilities (R-10) | 🔧 DevAgent | Sonnet 4.6 | 📋 |

**Exit criteria:** Human provides intent string. Architect produces plan. For coding tasks, DevAgent executes. For validation tasks, Assayer evaluates. Results flow back through the graph. Agent surfaces results. Gate success per policy. Gate failure → surface to Ro.

---

### M-13: UI 📋

*Graph visualisation + Opus chat interface. Lens on the graph, not a layer above it.*

| Agent | Model |
|-------|-------|
| 🔧 DevAgent (frontend) | Codex 5.3 or Sonnet 4.6 |
| 🏗️ Architect (interaction design from M-9.7b 3D vis) | Opus 4.6 |

Blocked by M-9 (needs real structured data to visualise).

---

## Post-Critical-Path Milestones

*These are core system capabilities, not optional features. They are sequenced after M-13 because they depend on the structural foundation (M-9), spec canonicalisation (M-16), and pattern integration (M-8.INT). But they are committed work, not deferred aspirations.*

### M-18: Assayer Pattern Implementation 📋

*Full four-stage pipeline (CLASSIFY→DECOMPOSE→VALIDATE→SYNTHESISE), four invocation modes (advisory, gate, post-flight, historical), compliance corpus management, DevAgent gate integration.*

Design complete at `docs/specs/09_codex-signum-assayer-pattern-design.md`. Depends on M-16.3 (type definitions and corpus structure) and M-9 (structured data for historical mode).

**Why first after critical path:** The Assayer is the quality enforcement mechanism. Every subsequent milestone benefits from having structural compliance checking active. Memory operations (M-10), constitutional evolution (M-12), and self-recursive learning (M-14) all introduce complex structural changes that the Assayer should be validating.

| Agent | Model |
|-------|-------|
| 🏗️ Architect (pipeline design validation) | Opus 4.6 |
| 🔧 DevAgent (implementation) | Sonnet 4.6 |

### M-10: Memory Operations 📋

*Full compaction, distillation flow coordinator. M-9.4 implements the minimum viable path (Strata 2-3 write/read). M-10 completes it with the full lifecycle.*

- Stratum 2 compaction (λ-decay with configurable half-life, batch processing of aged Observations)
- Stratum 3 distillation triggers (sufficient observation count + variance detection → pattern extraction)
- Stratum 4 institutional knowledge write path (codified design wisdom from accumulated Distillations)
- Memory flow coordinator (orchestrates compaction → distillation → institutionalisation as a structural process, not a cron job)
- Cross-stratum queries (Architect SURVEY reads across all strata to inform planning)

Prerequisite for self-recursive learning Level 1+.

| Agent | Model |
|-------|-------|
| 🔧 DevAgent | Sonnet 4.6 |

### M-11: Research Pattern 📋

*Systematic literature review and evidence synthesis as a governed pattern.*

Design exists at `docs/specs/codex-signum-research-pattern-design.md`. The Research pattern is how the system validates its own theoretical foundations — the 12 research papers feeding the spec were produced ad-hoc. The Research pattern governs that process structurally.

Depends on M-10 (research findings become Institutional Knowledge) and M-18 (Assayer validates research claims against compliance corpus).

| Agent | Model |
|-------|-------|
| 🏗️ Architect (pattern design) | Opus 4.6 |
| 🔧 DevAgent (implementation) | Sonnet 4.6 |

### M-12: Constitutional Evolution 📋

*Amendment mechanism with evidence-based thresholds.*

Types exist in `src/constitutional/evolution.ts`. v4.0 spec adds evidence-based thresholds replacing the arbitrary consensus values in v3.0. Three tiers:
- Tier 1 (parameter tuning): low consensus, short cooling period
- Tier 2 (structural change): high consensus, medium cooling period
- Tier 3 (axiom/grammar change): near-unanimous consensus, long cooling period with mandatory evidence review

Depends on M-10 (amendment proposals are Institutional Knowledge) and M-18 (Assayer validates that proposed amendments don't violate higher-tier constraints).

| Agent | Model |
|-------|-------|
| 🏗️ Architect (governance design) | Opus 4.6 |
| 🔧 DevAgent (implementation) | Sonnet 4.6 |

### M-14: Self-Recursive Learning (Levels 1-3) 📋

*The system learns from its own operation and improves its own governance.*

- **Level 1:** Thompson posteriors update from real quality data (partially exists, completed by M-9.3)
- **Level 2:** Distillations from cross-run patterns inform future planning (depends on M-10)
- **Level 3:** Constitutional amendments proposed from accumulated evidence (depends on M-12)

This is the culmination of the "state is structural" thesis — the system doesn't just represent its state structurally, it *evolves* structurally based on accumulated structural evidence.

| Agent | Model |
|-------|-------|
| 🏗️ Architect (learning architecture) | Opus 4.6 |
| 🔧 DevAgent (implementation) | Sonnet 4.6 |

### M-15: Pattern Exchange Protocol 📋

*Federated deployment sharing across Codex instances.*

Spec exists at `docs/specs/codex-signum-pattern-exchange-protocol.md`. This is how multiple Codex deployments share learned patterns, Thompson posteriors, and Distillations without centralised coordination. Relevant for multi-team and multi-organisation adoption.

Depends on M-12 (constitutional evolution must be stable before patterns can be exchanged across trust boundaries) and M-14 (self-recursive learning must work locally before it works across federation).

| Agent | Model |
|-------|-------|
| 🏗️ Architect (trust boundary design) | Opus 4.6 |
| 🔧 DevAgent (implementation) | Sonnet 4.6 |

---

### M-19: Hypothesis Tracking + Research Pipeline 📋

*Captured from `codex-signum-lightning-in-a-bottle.md`. The system generates data that supports at least five publishable research papers. But only if we track hypotheses structurally from the start.*

**Why this should activate early (alongside M-9):** Every pipeline run generates evidence for or against specific claims. If hypothesis tracking waits until M-11 (Research Pattern), we lose months of operational data that can never be recaptured. The hypothesis Helixes should be created as part of M-9.7a/M-9.8 ecosystem bootstrap and start accumulating Observations immediately.

**Hypotheses as Helixes:**

A hypothesis is a testable claim that accumulates evidence over time. That's a Helix — a learning cycle where each relevant Observation either strengthens or weakens the claim.

| Hypothesis | Paper | Data Source | Status |
|-----------|-------|-------------|--------|
| H-1: Context-blocked posteriors outperform global posteriors for model selection | Paper 1 (Thompson sampling) | Thompson decision outcomes across context types | Can track now — M-9.3 closes decision lifecycle |
| H-2: Bias-as-strength (exploiting model tendencies in matched contexts) outperforms naive best-overall selection | Paper 1 | Thompson per-context posterior convergence rates | Can track now |
| H-3: Evidence-based constitutional evolution maintains stability while enabling adaptation | Paper 2 | Amendment proposals, stability periods, consensus outcomes | Needs M-12 |
| H-4: Structural state encoding yields ~8-10x monitoring coverage vs serial log reading | Paper 3 (perceptual) | Future UI interaction studies | Needs M-13 |
| H-5: Structural learning (graph topology) persists across complete model substitution | Paper 4 (structural intelligence) | Model swap experiments with preserved posteriors | Can design now, test after M-9 |
| H-6: Safety-as-gradient (imperatives as exploration topology) couples capability with safety | Paper 5 (heuristic imperatives) | Meta-imperative gradient trajectories over time | Needs M-14 |

**Hypothesis Helix properties:**
- ΦL reflects evidence strength (bright = strong confirming evidence, dim = contradictory or insufficient)
- εR reflects evidence sufficiency (high = still exploring/insufficient data, low = settled)
- ΨH reflects coherence with other hypotheses (do they reinforce or conflict?)

**Research papers as Blooms:**

Each paper is a Bloom containing its hypothesis Helixes, data Seeds (pipeline run results, statistical analyses), and narrative structure. A paper is "ready for drafting" when its constituent hypotheses are sufficiently bright (ΦL above threshold) with low exploration rate (εR below threshold, meaning sufficient evidence).

| Paper | Claim | Venue Candidates | Dependencies |
|-------|-------|-----------------|--------------|
| 1. Thompson context-blocking | Narrow systems contribution — context-blocked posteriors improve selection | ICML systems, MLSys, AAAI applied AI | H-1, H-2, M-9 (structured decision data) |
| 2. Constitutional evolution | Governance rules that evolve under formal constraints | AAAI, FAccT, AI governance workshops | H-3, M-12 |
| 3. Perceptual state encoding | Human comprehension of 3D structural state vs traditional dashboards | CHI, CSCW, IEEE VIS | H-4, M-13 |
| 4. Structural intelligence | Learning that survives complete substrate replacement | NeurIPS, ICML, JMLR | H-5, M-14 |
| 5. Safety-as-gradient | Heuristic imperatives as exploration topology coupling safety with capability | AAAI Safety, FAccT, AI Ethics | H-6, M-14 |

**Activation timeline:**

| Phase | When | What | Agent |
|-------|------|------|-------|
| Helix creation | M-9.7a/M-9.8 | Create H-1 through H-6 as Helix nodes in Neo4j | 🔧 DevAgent |
| Evidence accumulation | M-9 onwards | Pipeline runs generate Observations that feed relevant Helixes (automatic) | 🏗️ Architect (automatic via pipeline) |
| Paper readiness assessment | M-11 onwards | Research pattern evaluates Helix ΦL/εR for drafting triggers | 🏗️ Architect |
| Sandbox evaluation | M-13 onwards | Standardised model testing against Codex axioms (not benchmarks) | 🏗️+🔧 Architect→DevAgent |
| Paper drafting | When ready | Constituent hypotheses bright + low εR → draft | 🏗️ Architect + 👤 Ro |

---

## Model Recommendations by Milestone

| Milestone | Model | Rationale |
|-----------|-------|-----------|
| M-8.QG | Sonnet 4.6 | Well-scoped implementation: context caps, allowlists, verification gates. Clear acceptance criteria. |
| M-9.1 | Sonnet 4.6 | Schema creation — mechanical, well-defined. |
| M-9.2 | Sonnet 4.6 | Wiring executor to graph — implementation against known interfaces. |
| M-9.3 | Sonnet 4.6 | Decision lifecycle completion — following existing patterns in queries.ts. |
| M-9.4 | Sonnet 4.6 | Memory persistence — implementing stubs with known type signatures. |
| M-9.VA | Thompson-routed | Live pipeline run — multi-model. |
| M-9.5 | Sonnet 4.6 or Codex 5.3 | Test reconciliation — mechanical categorisation and fixing. High volume, low ambiguity. |
| M-9.6 | Sonnet 4.6 | Model bootstrap entry — config + auth verification. |
| M-9.7a | Opus 4.6 | Grammar reference — architectural judgment about what maps to what. Inventory + Lean cleanup. |
| M-9.7b | Opus 4.6 + Sonnet 4.6 | Morpheme mapping (Opus) + 3D vis implementation (Sonnet). |
| M-9.8 | Opus 4.6 | Ecosystem bootstrap — structural design decisions about how the roadmap becomes graph topology. |
| M-9.V | Thompson-routed | Live pipeline run — multi-model. |
| M-16.1 | N/A (Ro) | Architect review — human decision. |
| M-16.2 | Sonnet 4.6 | Axiom renumbering — mechanical refactor with clear scope. |
| M-16.3 | Opus 4.6 + Sonnet 4.6 | Compliance corpus structure (Opus) + type definitions (Sonnet). |
| M-16.4 | Sonnet 4.6 | Governance updates — updating CLAUDE.md, ELIMINATED_ENTITIES. Well-scoped. |
| M-17.1 | Opus 4.6 | Formula audit — needs to understand whether formulas match implementation and spec intent. |
| M-17.2 | Opus 4.6 | Bridge View Principle — architectural constraint codification. |
| M-17.3 | Opus 4.6 | Build experience addendum — synthesising 6 months of implementation learning. |
| M-17.4 | Opus 4.6 + Sonnet 4.6 | Opus for verification/gap identification, Sonnet for implementation fixes found. |
| M-8.INT | Opus 4.6 | Routing logic design — core architectural decisions about how patterns compose. |
| M-13 | Codex 5.3 or Sonnet 4.6 | UI implementation — frontend work with clear design inputs from 3D vis. |
| M-18 | Opus 4.6 + Sonnet 4.6 | Assayer pipeline — complex pattern requiring spec comprehension (Opus) + implementation (Sonnet). |
| M-10 | Sonnet 4.6 | Memory operations — implementing against designed interfaces. |
| M-11 | Opus 4.6 | Research pattern — needs synthesis capability. |
| M-12 | Opus 4.6 | Constitutional evolution — governance mechanism with safety implications. |
| M-14 | Opus 4.6 | Self-recursive learning — the most architecturally complex milestone. |
| M-15 | Opus 4.6 | Federation protocol — trust boundary design. |

---

## Validated Refinements Backlog

| # | Refinement | Source | Implement At | Status |
|---|-----------|--------|-------------|--------|
| R-01 | Bridge View Principle — codify in Engineering Bridge spec | M-8A t15 | M-17.2 | 📋 |
| R-02 | Axiom Dependency Declaration — DAG annotation | M-8A t14 | M-16.1 | 📋 |
| R-03 | Dimensional Collapse — add to anti-pattern table in CLAUDE.md | M-8A | M-16.4 | 📋 |
| R-04 | DECOMPOSE spec limits — CTQs for good decomposition | Session | M-8C | ✅ (via jidoka) |
| R-05 | %C&A per pipeline stage | Session (LSS) | M-8C | ✅ (via quality assessor) |
| R-06 | Parallel execution — Phase 1/3 concurrent | M-8A | Future | 📋 |
| R-07 | Hallucinated axiom names → detection catch | M-8A | M-8C | ✅ |
| R-08 | Thompson exploration on process tweaks | Session | Future | 📋 |
| R-09 | Error morpheme resolution | M-8A | M-16.1 (v4.0 resolves this) | 📋 |
| R-10 | Model retirement should preserve capabilities | Sonnet incident | M-8.INT | 📋 |
| R-11 | Pre-flight auth data-driven | M-8.R1 launch | M-8.FIX3 | ✅ |
| R-12 | Spec-compliant tests (Level 5) | Test audit | M-9.5 + M-16.2 | 📋 |
| R-13 | Decisions & memory saved as intended | M-9 discovery | M-9.3 ✅ (decision quality) + M-9.4 ⏳ (memory persistence) | 🔄 |
| R-14 | Complete morpheme mapping + 3D topology visualisation | This session | M-9.7b | 📋 |
| R-15 | Ecosystem bootstrap (roadmap in graph, Architect reads from Neo4j) | This session | M-9.8 | 📋 |
| R-16 | Agent-as-trigger (agent becomes substrate, Architect routes) | This session | M-8.INT | 📋 |
| R-17 | Llama 4 model expansion via Vertex | This session | M-9.6 | 📋 |
| R-18 | Per-task FMEA advisory (Assayer pre-DISPATCH) | This session | M-8.INT.4 | 📋 |
| R-19 | Grammar reference document (canonical inventory of all structural elements) | v5 session | M-9.7a | 📋 |
| R-20 | Lean process maps v2 correction (remove Observer/Signal/Health as separate entities, update dep matrix) | M-8B audit | M-9.7a | 📋 |
| R-21 | Hypothesis Helix nodes (H-1 through H-6) created at ecosystem bootstrap | v5 session | M-9.8 | 📋 |
| R-22 | Research paper Bloom structure (5 papers, venues, dependencies) | v5 session | M-11 | 📋 |
| R-23 | Sandbox evaluation pattern (standardised model testing against axioms) | v5 session | M-13 | 📋 |
| R-24 | Flywheel validation (evidence that pattern additions compound learning) | v5 session | M-14 | 📋 |

---

## Dependency Graph

```
M-8.QG ✅  Quality gates (context caps, source verification, entity allowlists)
 │         🔧 DevAgent — Sonnet 4.6
 │
 ├─── TEST GATE ───
 │
M-9 Part 1  🔄  Structural compliance — schema + wiring
 │         .1 Schema (Resonator, PipelineRun, TaskOutput)     🔧 DevAgent  ✅
 │         .2 Pipeline writes to graph                        🔧 DevAgent  ✅
 │         .3 Decision lifecycle completion                   🔧 DevAgent  ✅
 │         .4 Memory persistence (Strata 2-3)                 🔧 DevAgent  ⏳
 │
 ├─── TEST GATE ───
 │
M-9.VA  📋  Partial verification — live pipeline run
 │         🏗️ Architect + 👤 Ro
 │
 ├─── TEST GATE ───
 │
M-9 Part 2  📋  Structural compliance — reconciliation + topology + bootstrap
 │         .5 Test reconciliation                             🤖 Agent (mechanical)
 │         .6 Model expansion (Llama 4)                       🔧 DevAgent
 │         .7a Grammar reference + Lean cleanup               🏗️ Architect
 │         .7b Morpheme mapping + 3D topology vis             🏗️ Architect + 🔧 DevAgent
 │         .8 Ecosystem bootstrap                             🏗️ Architect + 🔧 DevAgent + 👤 Ro
 │
 ├─── TEST GATE ───
 │
M-9.V  📋  Full verification run
 │         🏗️ Architect + 👤 Ro
 │
 ├─── TEST GATE ───
 │
M-16   📋  v4.0 spec canonical
 │         .1 Ro review                                       👤 Ro
 │         .2 Axiom reduction                                 🤖 Agent
 │         .3 Assayer types + corpus                          🏗️ Architect + 🔧 DevAgent
 │         .4 Governance updates                              🤖 Agent
 │
 ├─── TEST GATE ───
 │
M-17   📋  Engineering Bridge v2.1
 │         .1 Stale formula audit                             🏗️ Architect
 │         .2 Bridge View Principle                           🏗️ Architect
 │         .3 Build experience addendum                       🏗️ Architect
 │         .4 Deferred computation details                    🏗️ Architect + 🔧 DevAgent
 │
 ├─── TEST GATE ───
 │
M-8.INT 📋  Architect adaptive routing + agent-as-trigger
 │         .1 CLASSIFY routing logic                          🏗️ Architect + 🔧 DevAgent
 │         .2 Architect→DevAgent handoff                      🔧 DevAgent
 │         .3 DevAgent→Architect feedback loop                🔧 DevAgent
 │         .4 Assayer invocation (advisory + gate)            🏗️+🔧 Architect→DevAgent
 │         .5 Agent-as-trigger interface                      🔧 DevAgent
 │         .6 Model retirement preservation                   🔧 DevAgent
 │           After this point, the agent triggers the Architect.
 │           The Architect routes to DevAgent, Assayer, or Thompson.
 │           The agent monitors and surfaces results.
 │
 ├─── TEST GATE ───
 │
M-13   📋  UI (graph vis + Opus chat — the agent gets a face)
 │         🔧 DevAgent (frontend) + 🏗️ Architect (interaction design)
 │
 ╔═══════════════════════════════════════════════════════
 ║  POST-CRITICAL-PATH — core capabilities
 ╚═══════════════════════════════════════════════════════
 │
M-18   📋  Assayer implementation                            🏗️ Architect + 🔧 DevAgent
 │
 ├─── TEST GATE ───
 │
M-10   📋  Memory operations                                🔧 DevAgent
 │
 ├─── TEST GATE ───
 │
 ├──── M-11 📋  Research pattern                             🏗️ Architect + 🔧 DevAgent
 │
 ├──── M-12 📋  Constitutional evolution                     🏗️ Architect + 🔧 DevAgent
 │       │
 │       ├─── TEST GATE ───
 │       │
 │       M-14 📋  Self-recursive learning L1-L3              🏗️ Architect + 🔧 DevAgent
 │               │
 │               ├─── TEST GATE ───
 │               │
 │               M-15 📋  Pattern Exchange Protocol          🏗️ Architect + 🔧 DevAgent
 │
 ╔═══════════════════════════════════════════════════════
 ║  PARALLEL TRACK — starts at M-9.7a, accumulates throughout
 ╚═══════════════════════════════════════════════════════

M-19   📋  Hypothesis tracking + research pipeline
           Helix nodes created at M-9.7a/M-9.8               🔧 DevAgent
           Evidence accumulates from M-9 onwards (automatic)  🏗️ Architect
           Paper readiness assessed from M-11 onwards         🏗️ Architect
           Sandbox pattern from M-13 onwards                  🏗️+🔧 Architect→DevAgent
```

**Every transition through a TEST GATE requires:** gate success per Test Gate Policy. Gate failure → surface to Ro.

---

## Design Documents Produced

| Document | Description | Status |
|----------|-------------|--------|
| `codex-signum-v4_0-draft.md` | v4.0 spec: 9 axioms, OpEx, Assayer, evidence-based evolution | Draft — awaiting Ro review |
| `09_codex-signum-assayer-pattern-design.md` | Structural validation pattern: 4 stages, 4+1 invocation modes, 3-layer checking | Complete |

---

*This document (v6.2) is the single source of truth for project sequencing until M-9.8 completes, at which point the graph becomes the source of truth and this document becomes a snapshot. All future prompts and context transfers reference M-numbers. M-9 first. Everything else is building on sand until state is actually structural.*