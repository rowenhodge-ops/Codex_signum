# Codex Signum — Canonical Roadmap & Milestone Taxonomy

**Version:** 5.0
**Date:** 2026-03-03
**Status:** Living document — update as milestones complete

---

## Why This Version

Roadmap v4 marked M-8C.1–3 as complete. They were not. Pipeline output still goes to disk as markdown. Decisions are recorded to Neo4j but task outputs don't become Observation nodes. Memory operations are stubs. The system's thesis — "state is structural" — is not satisfied by its own pipeline. v5 corrects the record, introduces M-9 as the structural compliance milestone, establishes a **test gate policy** (no phase advances with failing tests), and integrates the v4.0 spec draft, Assayer pattern, and updated Engineering Bridge into the critical path.

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
| 🧊 | Ice box (deprioritised, not on critical path) |

---

## Test Gate Policy

### Gate success

Gate success is achieved when all in-scope tests pass, or when the architect (Ro) explicitly risk-accepts specific failures with documented rationale.

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

### Model Recommendations by Milestone

| Milestone | Recommended Model | Rationale |
|-----------|------------------|-----------|
| M-8.QG | Sonnet 4.6 | Well-scoped implementation: context caps, allowlists, verification gates. Clear acceptance criteria. |
| M-9.1 | Sonnet 4.6 | Schema creation — mechanical, well-defined. |
| M-9.2 | Sonnet 4.6 | Wiring executor to graph — implementation against known interfaces. |
| M-9.3 | Sonnet 4.6 | Decision lifecycle completion — following existing patterns in queries.ts. |
| M-9.4 | Sonnet 4.6 | Memory persistence — implementing stubs with known type signatures. |
| M-9.5 | Sonnet 4.6 or Codex 5.3 | Test reconciliation — mechanical categorisation and fixing. High volume, low ambiguity. |
| M-9.6 | Sonnet 4.6 | Model bootstrap entry — config + auth verification. |
| M-9.7 | Opus 4.6 | Morpheme mapping + 3D vis — architectural judgment about what maps to what. Grammar reference creation. |
| M-9.8 | Opus 4.6 | Ecosystem bootstrap — structural design decisions about how the roadmap becomes graph topology. |
| M-9.V | Opus 4.6 | Verification — needs to assess quality of structural output, not just run tests. |
| M-16.1 | N/A (Ro) | Architect review — human decision. |
| M-16.2 | Sonnet 4.6 | Axiom renumbering — mechanical refactor with clear scope. |
| M-16.3 | Opus 4.6 | Compliance corpus structure — needs to understand what belongs in the corpus and why. |
| M-16.4 | Sonnet 4.6 | Governance updates — updating CLAUDE.md, ELIMINATED_ENTITIES. Well-scoped. |
| M-17.1 | Opus 4.6 | Formula audit — needs to understand whether formulas match implementation and spec intent. |
| M-17.2 | Opus 4.6 | Bridge View Principle — architectural constraint codification. |
| M-17.3 | Opus 4.6 | Build experience addendum — synthesising 6 months of implementation learning. |
| M-17.4 | Opus 4.6 + Sonnet 4.6 | Opus for verification/gap identification, Sonnet for implementation fixes found. |
| M-8.INT | Opus 4.6 | Routing logic design — core architectural decisions about how patterns compose. |
| M-13 | Codex 5.3 or Sonnet 4.6 | UI implementation — frontend work with clear design inputs from 3D vis. |
| M-18 | Opus 4.6 | Assayer pipeline — complex pattern implementation requiring spec comprehension. |
| M-10 | Sonnet 4.6 | Memory operations — implementing against designed interfaces. |
| M-11 | Opus 4.6 | Research pattern — needs synthesis capability. |
| M-12 | Opus 4.6 | Constitutional evolution — governance mechanism with safety implications. |
| M-14 | Opus 4.6 | Self-recursive learning — the most architecturally complex milestone. |
| M-15 | Opus 4.6 | Federation protocol — trust boundary design. |

---

## Critical Path

```
M-8.QG ⏳  Quality gates (context caps, source verification, entity allowlists)
 │
M-9    📋  Structural compliance
 │         .1 Schema (Resonator, PipelineRun, TaskOutput nodes)
 │         .2 Pipeline writes to graph
 │         .3 Decision lifecycle (outcomes → Observations → ΦL)
 │         .4 Memory persistence (Strata 2-3)
 │         .5 Test reconciliation
 │         .6 Model expansion (Llama 4)
 │         .7 Complete morpheme mapping + 3D topology visualisation
 │         .8 Ecosystem bootstrap (roadmap in graph, Architect reads from Neo4j)
 │         ── TEST GATE ──
 │
M-9.V  📋  Verification — pipeline run against restructured system
 │         ── TEST GATE ──
 │
M-16   📋  v4.0 Spec canonicalisation
 │         .1 Ro review
 │         .2 Axiom reduction in code
 │         .3 Assayer types + corpus
 │         .4 Governance updates
 │         ── TEST GATE ──
 │
M-17   📋  Engineering Bridge v2.1
 │         ── TEST GATE ──
 │
M-8.INT 📋  Architect adaptive routing (CLASSIFY→route, agent-as-trigger)
 │         ── TEST GATE ──
 │
M-13   📋  UI (graph vis + Opus chat — agent becomes browser, not CLI)
 │         ── TEST GATE ──
 │
M-18   📋  Assayer implementation (full pipeline, all invocation modes)
 │         ── TEST GATE ──
 │
M-10   📋  Memory operations (full compaction, distillation, institutional knowledge)
 │         ── TEST GATE ──
 │
M-11   📋  Research pattern          ┐
M-12   📋  Constitutional evolution   ├─ parallel after M-10
 │         ── TEST GATE ──           ┘
 │
M-14   📋  Self-recursive learning L1-L3
 │         ── TEST GATE ──
 │
M-15   📋  Pattern Exchange Protocol (federated deployment)

M-19   📋  Hypothesis tracking (parallel — starts at M-9.7, accumulates throughout)
```

---

## Completed Milestones (for reference)

### M-1: Foundation ✅
Neo4j schema, type system, ΦL/ΨH/εR computation, dampening, cascade prevention, adaptive thresholds, constitutional rule engine, memory types.

### M-2: Signal Conditioning ✅
7-stage pipeline. Nelson Rules. Structural review + triggers. Immune response. **Do not modify** unless fixing a specific documented bug.

### M-3: DND-Manager Consumer Wiring ✅ (mostly) 🧊
Complete through M-3.9. DND at `c4a5d06` — 361 tests. Core dependency stale. Ice-boxed until after M-13.

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

---

## Active Milestones

### M-8.QG: Quality Gates ⏳

*Scaffolding-level fixes for known pipeline output quality issues. Prerequisite for M-9 — no point writing bad output to the graph.*

| Sub | Description | Status |
|-----|-------------|--------|
| M-8.QG.1 | Increase per-task context caps (current truncation causes fabrication) | ⏳ |
| M-8.QG.2 | Source verification gate (task must cite actual source, not inferred) | ⏳ |
| M-8.QG.3 | Canonical entity allowlists (axiom names, stage names, morpheme names) | ⏳ |
| M-8.QG.4 | Cross-task consistency check strengthening | ⏳ |

**Exit criteria:** Pipeline run where zero tasks fabricate axiom names or cite nonexistent sources. All tests pass.

---

### M-9: Structural Compliance 📋

*The system's thesis is "state is structural." This milestone makes it true for the pipeline itself. Pipeline output becomes graph nodes. Task outputs feed ΦL. Decisions complete their lifecycle. Memory strata populate from real execution data.*

**Why this is the critical blocker:** Every feature downstream — cross-run learning, Thompson multi-objective optimisation, Retrospective pattern, self-recursive learning — requires structured data in the graph. Without M-9, the system computes health correctly for models and patterns but has no health data for its own analytical output. The pipeline is the system's most complex pattern, and it's the only one not structurally represented.

#### M-9.1: Neo4j Schema for Pipeline Topology

Create the morpheme topology for the pipeline itself:

- **Resonator nodes** for each pipeline stage (SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT). These are the atomic processing units of the Architect pattern.
- **PipelineRun nodes** (Stratum 2 — execution instances). Each `executePlan()` invocation creates one. Properties: runId, intent, timestamp, taskCount, duration, modelDiversity, overallQuality.
- **TaskOutput nodes** (Stratum 2 — individual task results). Each dispatched task creates one. Properties: taskId, title, modelUsed, outputLength, qualityScore, hallucinationFlags, duration.
- **Lines** connecting Resonator → PipelineRun → TaskOutput to encode the execution flow.
- **Bloom** for the Architect pattern containing its Resonators.

Schema must support: "show me all runs where DECOMPOSE used Gemini and quality was above threshold" as a Cypher query.

**Test gate:** Schema creation tests pass. Node creation/query round-trips verified.

#### M-9.2: Pipeline Executor Writes to Graph

Modify `bootstrap-task-executor.ts` (and any other executors) to write TaskOutput nodes to Neo4j instead of (or in addition to) markdown files on disk.

- Each task execution writes a TaskOutput node with the task result, model used, quality score, and hallucination detection results.
- PipelineRun node created at plan start, updated at plan end with aggregate stats.
- Markdown files can remain as a human-readable cache, but the graph is the source of truth.
- The write path uses `writeObservation()` or equivalent — inline, not a separate pipeline.

**Test gate:** Integration test that runs a mock pipeline and verifies TaskOutput nodes exist in Neo4j with correct properties and relationships.

#### M-9.3: Decision Lifecycle Completion

Currently, Thompson routing decisions are recorded to Neo4j (`recordDecision` in queries.ts), but the lifecycle is incomplete:

- **Decision → Outcome:** Task quality scores must flow back to the Decision node that selected the model. This closes the Thompson learning loop with real quality data, not just "did the API call succeed."
- **TaskOutput → Observation:** Each TaskOutput should generate an Observation that feeds ΦL computation for the Architect Bloom. This is how the pipeline's own health becomes structurally visible.
- **Aggregate ΦL for pipeline stages:** DECOMPOSE's ΦL should reflect the quality distribution of its outputs across runs. A stage that consistently produces high-quality decompositions has high ΦL. One that hallucinates file paths has declining ΦL. This is the Assayer's future data source.

**Test gate:** Decision nodes have outcome data. Observation nodes exist for pipeline tasks. ΦL computes for the Architect Bloom from real data.

#### M-9.4: Memory Persistence as Intended

Memory operations (compaction, distillation) are currently stubs (`src/memory/`). The type system exists but operations don't execute. This milestone implements the minimum viable memory path:

- **Stratum 2 (Observations):** Pipeline execution data flows through `writeObservation()` and persists. Observation weight decays exponentially per spec (`e^(-λ × age)`, 14-day half-life default).
- **Stratum 3 (Distillations):** Cross-run patterns distilled from accumulated Observations. "Opus consistently outperforms Mistral-small on analytical tasks" is a Distillation, not a markdown note. Distillation triggers on structural conditions (sufficient observation count + variance detection), not timers.
- **Stratum 4 (Institutional Knowledge):** Not in scope for M-9 — this is M-10 territory. But the write path must exist so Strata 2-3 data doesn't dead-end.

**Test gate:** Observations persist and decay correctly. Distillation trigger fires when conditions are met. Memory queries return expected results. All existing memory tests still pass.

#### M-9.5: Test Reconciliation

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

**Exit criteria:** Gate success per Test Gate Policy. Future-requirement tests for later milestones logged but not blocking.

#### M-9.6: Model Expansion — Llama 4

Add Llama 4 (Meta) to the Thompson router via Vertex AI Model Garden. Seed with uniform priors — Thompson exploration begins automatically. This is a bootstrap entry + pre-flight auth verification, not infrastructure work.

Gemma is mostly deploy-required (87/89 entries need GPU provisioning). The two serverless entries (ShieldGemma, T5Gemma) are specialised. Gemma expansion deferred until deploy infrastructure is justified by workload. Llama 4 on Vertex serverless is the immediate win.

**Exit criteria:** Llama 4 Seed node in Neo4j. Pre-flight auth passes. Thompson routes to it on exploratory selections. Gate success per policy.

#### M-9.7: Complete Morpheme Mapping + Topology Visualisation

**Recommended model:** Opus 4.6

M-7C renamed Agent→Seed and Pattern→Bloom. That was the graph labels. This task completes the mapping for everything the system manages and produces an interactive 3D visualisation of the result.

**First deliverable: Grammar Reference.** There is currently no single document listing every structural element in the Codex grammar and its implementation status. The vocabulary is scattered across v3.0 spec, v4.0 draft, Engineering Bridge, Lean process maps (stale), and CLAUDE.md. Before mapping anything to morphemes, produce a canonical grammar reference:

| Category | Elements | Source | Implementation Status |
|----------|----------|--------|-----------------------|
| Morphemes (6) | Seed, Line, Bloom, Resonator, Grid, Helix | v3.0 §Morphemes, v4.0 §Morphemes | Graph labels ✅, full structural identity varies |
| State dimensions (3) | ΦL (luminosity), ΨH (harmonic signature), εR (exploration rate) | v3.0 §State Dimensions, Bridge §Part 2 | Computation ✅, pipeline nodes to compute ON ❌ (M-9 gap) |
| Grammar rules (5) | G1 Proximity, G2 Orientation, G3 Containment, G4 Flow, G5 Resonance | v3.0/v4.0 §Grammar | Tests exist, structural enforcement partial |
| Axioms (9, post v4.0) | A1 Fidelity through A9 Comprehension Primacy | v4.0 §Axioms | Constitutional rules ✅, test coverage varies |
| Anti-patterns (10+) | Shadow system, dimensional collapse, etc. | CLAUDE.md, v4.0 | Detection ✅ (hallucination system), structural prevention partial |
| Meta-imperatives (3) | Ω₁ reduce suffering, Ω₂ increase prosperity, Ω₃ increase understanding | v3.0/v4.0 §Meta-Imperatives | Defined ✅, gradient computation ❌ (aspirational) |
| Operational records | Decision, Observation, ThresholdEvent, PipelineRun, TaskOutput | Bridge, schema.ts | Partial — Decisions ✅, Observations ✅, pipeline records ❌ (M-9) |
| Strata (5) | Raw→Observations→Distillations→InstitutionalKnowledge→Constitutional | v3.0 §Memory, v4.0 §Memory | Types ✅, write paths partial (M-9.4 + M-10) |

This reference becomes the seed for M-16.3's Assayer compliance corpus. It also serves as the "bill of materials" for the morpheme mapping — you can't map what you haven't inventoried.

**ΦL/ΨH/εR on pipeline performance — why you've never seen it:** The computation code works. It computes health for model Seeds and pattern Blooms. But the pipeline has no nodes in the graph to compute health *on*. No PipelineRun, no TaskOutput, no Observations from analytical output. Once M-9.1–9.3 completes, the query `MATCH (b:Bloom {name: "Architect"}) RETURN b.phiL, b.psiH, b.epsilonR` becomes answerable for the first time.

**Lean process maps status:** The M-8B audit found 8 violations (Observer as separate entity was the root cause). Corrections agreed but documents not updated. The stale Lean documents should be corrected as part of this task — remove Observer, Signal Pipeline, and Health Computation as separate boxes. Replace with inline descriptions. Update dependency matrix. This is Stratum 4 Institutional Knowledge cleanup.

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
- SIPOC diagrams for major flows (as Stratum 4 Institutional Knowledge — design reference, not runtime morphemes)

**Exit criteria:** Every element in the table above has a corresponding node type in Neo4j with at least one instance created. Relationships connect them per the grammar. A Cypher query can answer: "which tests are scoped to M-9?" and "what is the ΦL of the M-9 milestone Bloom?" 3D visualisation renders from live graph data. Gate success per policy.

#### M-9.8: Ecosystem Bootstrap — Operating in the Codex

This is the transition from building the system to building *with* the system.

**What goes into the graph:**
- This roadmap (v5) becomes a Bloom containing milestone Blooms. Each milestone Bloom contains its task Seeds and test Seeds. The `@future(M-{N})` annotation becomes a `SCOPED_TO` relationship between a test Seed and a milestone Bloom.
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

**Exit criteria:** The roadmap is queryable from the graph. Test Seeds connect to milestone Blooms. The Architect's SURVEY stage reads project state from Neo4j. A pipeline run against the roadmap produces structural output. Gate success per policy.

---

### M-9.V: Verification Run 📋

*Run the Architect pipeline against the restructured system. Verify that output goes to graph, decisions complete their lifecycle, and the system can query its own execution history.*

- Architect pipeline run with analytical intent (similar to M-8.R1)
- Verify: TaskOutput nodes created in Neo4j for every task
- Verify: PipelineRun node has aggregate stats
- Verify: Decision nodes have quality outcomes
- Verify: Observation nodes feed ΦL computation
- Verify: Cross-run Cypher query returns meaningful results ("compare this run's quality distribution to the last 3 runs")
- Human feedback recorded via CLI, verified in graph

**Exit criteria:** The system can answer "how is my pipeline performing?" from a Cypher query, not from reading markdown files.

**Test gate:** All tests pass after verification run.

---

### M-16: v4.0 Spec Canonicalisation 📋

*The v4.0 spec draft exists (`codex-signum-v4_0-draft.md`). This milestone makes it canonical and propagates changes through the codebase.*

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

**Test gate:** All tests pass. Hallucination detection correctly flags references to 10 axioms.

---

### M-17: Engineering Bridge v2.1 📋

*The Engineering Bridge is stale. Three formulas identified as incorrect in M-8A. Build experience from 6 months of implementation not captured. v3.1 computation details deferred from v2.0 never delivered.*

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

**Test gate:** Any implementation gaps found during verification get fixed, with corresponding tests. Documentation-only changes don't require new tests.

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

| Sub | Description | Status |
|-----|-------------|--------|
| M-8.INT.1 | CLASSIFY routing logic (task profile → execution path) | 📋 |
| M-8.INT.2 | Architect DISPATCH → DevAgent SCOPE handoff | 📋 |
| M-8.INT.3 | DevAgent results → Architect REVIEW feedback loop | 📋 |
| M-8.INT.4 | Assayer invocation from CLASSIFY (advisory) and REVIEW (gate) | 📋 |
| M-8.INT.5 | Agent-as-trigger interface (intent in → structured execution → results out) | 📋 |
| M-8.INT.6 | Model retirement should preserve capabilities (R-10) | 📋 |

**Exit criteria:** Human provides intent string. Architect produces plan. For coding tasks, DevAgent executes. For validation tasks, Assayer evaluates. Results flow back through the graph. Agent surfaces results. Gate success per policy.

---

### M-13: UI 📋

*Graph visualisation + Opus chat interface. Lens on the graph, not a layer above it.*

Blocked by M-9 (needs real structured data to visualise).

---

## Post-Critical-Path Milestones

*These are core system capabilities, not optional features. They are sequenced after M-13 because they depend on the structural foundation (M-9), spec canonicalisation (M-16), and pattern integration (M-8.INT). But they are committed work, not deferred aspirations.*

### M-18: Assayer Pattern Implementation 📋

*Full four-stage pipeline (CLASSIFY→DECOMPOSE→VALIDATE→SYNTHESISE), four invocation modes (advisory, gate, post-flight, historical), compliance corpus management, DevAgent gate integration.*

Design complete at `docs/specs/09_codex-signum-assayer-pattern-design.md`. Depends on M-16.3 (type definitions and corpus structure) and M-9 (structured data for historical mode).

**Why first after critical path:** The Assayer is the quality enforcement mechanism. Every subsequent milestone benefits from having structural compliance checking active. Memory operations (M-10), constitutional evolution (M-12), and self-recursive learning (M-14) all introduce complex structural changes that the Assayer should be validating.

### M-10: Memory Operations 📋

*Full compaction, distillation flow coordinator. M-9.4 implements the minimum viable path (Strata 2-3 write/read). M-10 completes it with the full lifecycle.*

- Stratum 2 compaction (λ-decay with configurable half-life, batch processing of aged Observations)
- Stratum 3 distillation triggers (sufficient observation count + variance detection → pattern extraction)
- Stratum 4 institutional knowledge write path (codified design wisdom from accumulated Distillations)
- Memory flow coordinator (orchestrates compaction → distillation → institutionalisation as a structural process, not a cron job)
- Cross-stratum queries (Architect SURVEY reads across all strata to inform planning)

Prerequisite for self-recursive learning Level 1+.

### M-11: Research Pattern 📋

*Systematic literature review and evidence synthesis as a governed pattern.*

Design exists at `docs/specs/codex-signum-research-pattern-design.md`. The Research pattern is how the system validates its own theoretical foundations — the 12 research papers feeding the spec were produced ad-hoc. The Research pattern governs that process structurally.

Depends on M-10 (research findings become Institutional Knowledge) and M-18 (Assayer validates research claims against compliance corpus).

### M-12: Constitutional Evolution 📋

*Amendment mechanism with evidence-based thresholds.*

Types exist in `src/constitutional/evolution.ts`. v4.0 spec adds evidence-based thresholds replacing the arbitrary consensus values in v3.0. Three tiers:
- Tier 1 (parameter tuning): low consensus, short cooling period
- Tier 2 (structural change): high consensus, medium cooling period
- Tier 3 (axiom/grammar change): near-unanimous consensus, long cooling period with mandatory evidence review

Depends on M-10 (amendment proposals are Institutional Knowledge) and M-18 (Assayer validates that proposed amendments don't violate higher-tier constraints).

### M-14: Self-Recursive Learning (Levels 1-3) 📋

*The system learns from its own operation and improves its own governance.*

- **Level 1:** Thompson posteriors update from real quality data (partially exists, completed by M-9.3)
- **Level 2:** Distillations from cross-run patterns inform future planning (depends on M-10)
- **Level 3:** Constitutional amendments proposed from accumulated evidence (depends on M-12)

This is the culmination of the "state is structural" thesis — the system doesn't just represent its state structurally, it *evolves* structurally based on accumulated structural evidence.

### M-15: Pattern Exchange Protocol 📋

*Federated deployment sharing across Codex instances.*

Spec exists at `docs/specs/codex-signum-pattern-exchange-protocol.md`. This is how multiple Codex deployments share learned patterns, Thompson posteriors, and Distillations without centralised coordination. Relevant for multi-team and multi-organisation adoption.

Depends on M-12 (constitutional evolution must be stable before patterns can be exchanged across trust boundaries) and M-14 (self-recursive learning must work locally before it works across federation).

### M-19: Hypothesis Tracking + Research Pipeline 📋

*Captured from `codex-signum-lightning-in-a-bottle.md`. The system generates data that supports at least five publishable research papers. But only if we track hypotheses structurally from the start.*

**Why this should activate early (alongside M-9):** Every pipeline run generates evidence for or against specific claims. If hypothesis tracking waits until M-11 (Research Pattern), we lose months of operational data that can never be recaptured. The hypothesis Helixes should be created as part of M-9.7/M-9.8 ecosystem bootstrap and start accumulating Observations immediately.

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
| 3. State is structural (perceptual) | Graph topology + pre-attentive processing = 8-10x coverage | CHI, CSCW, IEEE VIS | H-4, M-13 (UI data) |
| 4. Structural intelligence | Learning in topology, not weights — distributed cognition | AI Journal, Minds and Machines | H-5, M-10 (memory), M-14 (self-recursive) |
| 5. Heuristic imperatives as exploration topology | Safety as generative gradient, not restrictive boundary | NeurIPS AI safety workshop | H-6, M-14 |

**The sandbox pattern (from lightning doc):**

A standardised evaluation pattern that runs consistent tasks against models, measuring performance against Codex axioms rather than arbitrary benchmarks. This generates the empirical data for Paper 1 and feeds the codexsignum.com live dashboard. The sandbox is a Bloom containing evaluation Seeds, run periodically and on new model availability. It's the Thompson router's training ground.

**The flywheel (from lightning doc):**

Every pattern added generates data → data feeds recursive learning → learning improves patterns → improved patterns generate better data. This is the compounding effect. It depends entirely on M-9 (data captured structurally) and M-10 (memory operations complete the accumulation cycle). The flywheel isn't a milestone — it's an emergent property of the system operating correctly. But it only emerges if hypothesis tracking starts early enough to capture the compounding.

**Implementation approach:**
- M-9.7/M-9.8: Create hypothesis Helix nodes for H-1, H-2, H-5 (trackable now). Define the schema for linking Observations to hypotheses.
- M-9 onwards: Pipeline runs automatically generate Observations that feed relevant hypothesis Helixes.
- M-11 (Research Pattern): Formalises the paper drafting pipeline. But the data has been accumulating since M-9.
- M-13 (UI): The sandbox evaluation pattern and live dashboard become possible.

**Exit criteria:** Hypothesis Helixes exist in Neo4j with at least one Observation each. Evidence accumulation is automatic (pipeline runs feed hypotheses). A Cypher query can answer: "what is the current evidence strength for H-1?"

---

## Ice Box 🧊

### M-9-DND: DND-Manager Reconnection 🧊
Bump core SHA, reconcile interfaces, integration tests. Blocked by M-16 (v4.0 changes interfaces). Previously M-9 in v3/v4 roadmaps — renumbered to avoid collision with structural compliance milestone.

---

## Design Documents Produced (This Session)

| Document | Description | Status |
|----------|-------------|--------|
| `codex-signum-v4_0-draft.md` | v4.0 spec: 9 axioms, OpEx, Assayer, evidence-based evolution | Draft — awaiting Ro review |
| `09_codex-signum-assayer-pattern-design.md` | Structural validation pattern: 4 stages, 4 invocation modes, 3-layer checking, per-task FMEA | Complete |
| `codex-signum-lightning-in-a-bottle.md` | Vision doc: 5 research papers, flywheel, sandbox, hypothesis framework | Reference — captured in M-19 |

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
| R-13 | Decisions & memory saved as intended | M-9 discovery | M-9.3 + M-9.4 | 📋 |
| R-14 | Complete morpheme mapping + 3D topology visualisation | This session | M-9.7 | 📋 |
| R-15 | Ecosystem bootstrap (roadmap in graph, Architect reads from Neo4j) | This session | M-9.8 | 📋 |
| R-16 | Agent-as-trigger (agent becomes substrate, Architect routes) | This session | M-8.INT | 📋 |
| R-17 | Llama 4 model expansion via Vertex | This session | M-9.6 | 📋 |
| R-18 | Per-task FMEA advisory (Assayer pre-DISPATCH) | This session | M-8.INT.4 | 📋 |
| R-19 | Grammar reference document (canonical inventory of all structural elements) | This session | M-9.7 | 📋 |
| R-20 | Lean process maps v2 correction (remove Observer/Signal/Health as separate entities, update dep matrix) | M-8B audit | M-9.7 | 📋 |
| R-21 | Hypothesis Helix nodes (H-1 through H-6) created at ecosystem bootstrap | Lightning doc | M-9.7/M-9.8 | 📋 |
| R-22 | Research paper Bloom structure (5 papers, venues, dependencies) | Lightning doc | M-11 | 📋 |
| R-23 | Sandbox evaluation pattern (standardised model testing against axioms) | Lightning doc | M-13 | 📋 |
| R-24 | Flywheel validation (evidence that pattern additions compound learning) | Lightning doc | M-14 | 📋 |

---

## Dependency Graph

```
M-8.QG ⏳  Quality gates (context caps, source verification, entity allowlists)
 │
 ├─── TEST GATE ───
 │
M-9    📋  Structural compliance
 │         .1 Schema (Resonator, PipelineRun, TaskOutput)
 │         .2 Pipeline writes to graph
 │         .3 Decision lifecycle completion
 │         .4 Memory persistence (Strata 2-3)
 │         .5 Test reconciliation
 │         .6 Model expansion (Llama 4)
 │         .7 Complete morpheme mapping + 3D topology visualisation
 │         .8 Ecosystem bootstrap (roadmap in graph, FMEA + SIPOCs as Institutional Knowledge)
 │
 ├─── TEST GATE ───
 │
M-9.V  📋  Verification run
 │
 ├─── TEST GATE ───
 │
M-16   📋  v4.0 spec canonical
 │
 ├─── TEST GATE ───
 │
M-17   📋  Engineering Bridge v2.1
 │
 ├─── TEST GATE ───
 │
M-8.INT 📋  Architect adaptive routing + agent-as-trigger
 │           After this point, the agent triggers the Architect.
 │           The Architect routes to DevAgent, Assayer, or Thompson.
 │           The agent monitors and surfaces results.
 │
 ├─── TEST GATE ───
 │
M-13   📋  UI (graph vis + Opus chat — the agent gets a face)
 │
 ╔═══════════════════════════════════════════════════════
 ║  POST-CRITICAL-PATH — core capabilities
 ╚═══════════════════════════════════════════════════════
 │
M-18   📋  Assayer implementation (quality enforcement for everything below)
 │
 ├─── TEST GATE ───
 │
M-10   📋  Memory operations (full compaction, distillation, institutional knowledge)
 │
 ├─── TEST GATE ───
 │
 ├──── M-11 📋  Research pattern (systematic evidence synthesis)
 │
 ├──── M-12 📋  Constitutional evolution (evidence-based amendment)
 │       │
 │       ├─── TEST GATE ───
 │       │
 │       M-14 📋  Self-recursive learning L1-L3 (the system evolves itself)
 │               │
 │               ├─── TEST GATE ───
 │               │
 │               M-15 📋  Pattern Exchange Protocol (federated deployment)

 ╔═══════════════════════════════════════════════════════
 ║  PARALLEL TRACK — starts at M-9.7, accumulates throughout
 ╚═══════════════════════════════════════════════════════

M-19   📋  Hypothesis tracking + research pipeline
           Helix nodes created at M-9.7/M-9.8
           Evidence accumulates from M-9 onwards (automatic)
           Paper readiness assessed from M-11 onwards
           Sandbox pattern from M-13 onwards
```

**Every transition through a TEST GATE requires:** gate success per Test Gate Policy.

---

## Historical Phase Mapping

| Old Name | Canonical Milestone |
|----------|-------------------|
| DND Phase A-F | M-3 sub-milestones |
| Phase G / Core Reconciliation | M-4 |
| Roadmap Phase A-F | M-5 through M-15 |
| Pipeline supercharge Phases 1-5 | M-3.2 through M-3.9 |
| Phase G0-G8 | M-4 sub-milestones |
| M-9 (DND reconnection, v3/v4 roadmaps) | M-9-DND (renumbered) |

---

*This document is the single source of truth for project sequencing until M-9.8 completes, at which point the graph becomes the source of truth and this document becomes a snapshot. All future prompts and context transfers reference M-numbers. M-9 first. Everything else is building on sand until state is actually structural.*