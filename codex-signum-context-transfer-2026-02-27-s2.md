# Codex Signum Context Transfer — 2026-02-27 Session 2

## Previous sessions
- **2026-02-25 Session 1** (`codex-signum-context-transfer-2026-02-25.md`): Phase D prompt, context transfer v3
- **2026-02-25 Session 2** (`codex-signum-context-transfer-2026-02-25-s2.md`): G-4/5/6 completion, G-7/8 prompt generation
- **2026-02-25 Session 3** (`codex-signum-context-transfer-2026-02-25-s3.md`): Spec fidelity corrections, G-9 prompt, architectural decisions
- **2026-02-25 Session 4** (`codex-signum-context-transfer-2026-02-25-s4.md`): G-9 DND thinning, architect pattern reconnection
- **2026-02-26 Session 1** (`codex-signum-context-transfer-2026-02-26.md`): Core completeness review, governance deployment, spec alignment polish
- **2026-02-26 Session 2** (`codex-signum-context-transfer-2026-02-26-s2.md`): Survey broadening, reconciliation, Phase 3 fix prompt
- **2026-02-27 Session 1** (`codex-signum-context-transfer-2026-02-27.md`): Test governance (G-10), morpheme topology discovery, Phase 3 fix execution
- **2026-02-27 Session 2** (this document): Lean process mapping, Observer elimination, Phase 0 prompt

---

## What Happened — 2026-02-27 Session 2

This session spanned four consecutive chats, forming a single continuous arc: from "what's next after parallel-decompose?" through to a complete implementation roadmap with its first coding prompt pushed to the repo. The through-line was a question about operational readiness — getting 20+ models working, patterns composable, everything live — that became an exercise in mapping the system's actual process flows and discovering, through that mapping, that we'd been carrying a fundamental architectural violation since the project's inception.

### 1. The Question That Started It All

Ro's opening message, after confirming the parallel-decompose PR (#9) had landed:

> "What's next? All patterns (pipelines) need to be tested with actual APIs, we need all 20+ models available and working, all patterns modular and being accessed as required by each other e.g. router available for anything requiring an LLM, devagent for anything requiring coding, all models should be their own seed (node)."

This was the first time Ro framed the target state so concretely: not "finish Phase G" or "fix the tests," but *make the whole system operational*. Models as nodes, patterns as composable services, everything tested live. The gap between current state (580 unit/conformance tests, mocked execution) and that target required mapping — not just a task list, but understanding the actual process flows.

### 2. Lean Process Maps v1 — The Initial Mapping

To bridge that gap, we produced `codex-signum-lean-process-maps-v2.md` (the "v2" in the filename reflects that this IS the corrected version — v1 was never saved separately because the audit happened in the same work session).

The initial mapping took a Lean/Six Sigma approach: SIPOC diagrams for each pattern, cross-cutting process flows, a dependency matrix, and an implementation sequence. It covered:

- **§2: Pattern SIPOCs** — Thompson Router (§2.1), DevAgent Pipeline (§2.2), Architect Pipeline (§2.3), Retrospective Pattern (§2.4)
- **§3: Cross-Cutting Process Flows** — Decision Loop, Learning Feedback Loop, Cascade Propagation, Constitutional Gate
- **§4: Node Type Reference** with Cypher schemas
- **§5: NFR mappings** — Non-functional requirements with their structural implementations
- **§6: Dependency Matrix** — pattern-to-pattern interaction map
- **§7: Gap Analysis** — what exists vs. what's missing
- **§8: Implementation Sequence** — a phased plan (Phase 0 through Phase 3)

This was comprehensive and grounded in the existing codebase. But it contained a fundamental flaw.

### 3. The Axiom Audit — Finding the Observer Anti-Pattern ⚠️

Before pushing the lean process maps to the repo, we ran them through a systematic axiom audit — testing every pattern, flow, and node type against all 10 Codex axioms, all 5 grammar rules, and the anti-pattern table.

**The audit found 8 violations, and they all traced to a single root cause: the Observer pattern was described as a separate monitoring entity.**

The v1 mapping had:
- An **Observer pattern** in §2 with its own SIPOC (collector → evaluator → graph writer)
- A **Signal Pipeline** as cross-cutting infrastructure (separate from execution)
- **Health Computation** as infrastructure (separate from graph writes)
- Data flowing through intermediaries: `execution → Observer → Signal Pipeline → Health Computation → graph`

Every one of these violated **Axiom 10** (no observation pipelines), **Anti-pattern #1** (monitoring overlays), and the core principle that state IS structural — not something a separate entity observes and records.

**The 8 specific violations:**

| # | Location | Violation | Axiom |
|---|---|---|---|
| 1 | §2 Observer SIPOC | Observer as pattern = monitoring overlay | A10, Anti-pattern #1 |
| 2 | §3.2 Learning Loop | Observer "collects" before graph write | A10 |
| 3 | §3.2 Flow diagram | Execution → Observer → Signal Pipeline chain | A10, Anti-pattern #1 |
| 4 | §5 NFR-G5 | `_raw` suffix on conditioned values | G5 (morpheme composition) |
| 5 | §5 NFR-G6 | Signal Pipeline as standalone infrastructure | A10 |
| 6 | §5 NFR-G7 | Health Computation as standalone infrastructure | A10 |
| 7 | §6 Dependency Matrix | 11 columns (4 were shadow patterns) | A10 |
| 8 | §3.3 Cascade Flow | Observer intermediary in cascade trigger | A10 |

### 4. The Corrected Architecture — Observer Eliminated

The corrected v2 eliminates Observer entirely. The key insight:

**Correct flow:** `execution → conditionValue() [inline] → graph.write()`
**Wrong flow:** `execution → Observer → Signal Pipeline → Health Computation → graph`

In the corrected architecture:
- **Signal conditioning** (`conditionValue()`) is a pure function called inline during the graph write path — it's a function call, not a routed pipeline
- **Health computation** (`computePhiL()`) is triggered by the write, not collected by an observer
- **The graph IS the observation store** — no collector, no intermediary
- **The Retrospective pattern** (§2.4) replaces the evaluator/auditor role, but it reads FROM the graph — it never intercepts writes

This correction rippled through the entire document:
- Observer SIPOC deleted, replaced by Retrospective pattern SIPOC
- All flow diagrams redrawn without intermediaries
- Signal Pipeline and Health Computation removed as infrastructure entries
- Dependency matrix simplified from 11 columns to 7
- NFR-G5 fixed (raw values stored on Observation nodes, conditioned values on Pattern nodes — no `_raw` suffix)

### 5. Documents Pushed to Repo

Three documents committed to `rowenhodge-ops/Codex_signum` main:

| Commit | File | Size | Content |
|---|---|---|---|
| `c067104` | `codex-signum-lean-process-maps-v2.md` | 36KB | Complete corrected lean process maps |
| `30cfdc8` | `lean-process-maps-audit.md` | 13KB | Full violation analysis with corrections |
| `cf03184` → `d07c85f` | `docs/phase-0-graph-foundation-prompt.md` | 17KB | Coding session prompt for Phase 0 |

Note: `cf03184` pushed Phase 0 to root; Ro moved it to `docs/` in `d07c85f`.

### 6. Observer Contamination — Reconciliation Scan

A project knowledge search revealed Observer pattern contamination in three existing documents:

**1. `codex-signum-implementation-README.md`** — TASK 5 section
- Describes Observer as a full pattern with `collector.ts`, `evaluator.ts`, `auditor.ts`
- Describes Observer monitoring the graph on a schedule
- **Needs:** Supersession note → lean-process-maps-v2 §2.4 and §3.2

**2. `phase-3-reconciliation-fixes.md`** — Fix 3 section
- Proposes `GraphObserver` interface as an improvement to Observer
- This "improves" a pattern that shouldn't exist
- **Needs:** Supersession note — no Observer class, no GraphObserver interface

**3. `finish-architect-pattern-prompt.md`** — Step 4 section
- Proposes adding `GraphObserver` interface to Observer class
- **Needs:** Supersession note or removal — skip this step entirely

**Not contaminated:** `thompson-router-architecture.md` (references Model Sentinel, which is clean — it probes external APIs, doesn't monitor internal execution).

The Phase 0 prompt (Task 5) includes the exact supersession text for all three documents plus a CLAUDE.md anti-pattern table update.

### 7. Phase 0 Prompt — Graph Foundation

The Phase 0 coding session prompt was produced and pushed. It covers 5 tasks:

**Task 1: Verify Agent Seeding** — confirm `seedAgents.ts` populates Agent nodes from `models.ts` with all `AgentProps` fields mapped. Includes the full mapping template.

**Task 2: Schema Migration** — eliminate the dual schema problem. DND-Manager's `Tracer.ts` writes `Execution/Model/Stage` (legacy) while core defines `Decision/Agent/Observation` (Codex). Four sub-steps: audit legacy, create migration Cypher, update Tracer.ts to write Codex schema, remove legacy schema creation from `client.ts`. Key rule: do NOT delete legacy nodes — add Codex labels alongside them.

**Task 3: Register Pattern Nodes** — ensure 4 Pattern nodes exist (thompson-router, dev-agent, architect, model-sentinel) using core's `createPattern()`.

**Task 4: Decision Lifecycle Test** — verify end-to-end: create cluster → record decision → record outcome → query arm stats. This validates the Thompson Sampling foundation.

**Task 5: Document Reconciliation** — add supersession notices to the 3 contaminated documents + update CLAUDE.md anti-pattern table.

Each task has verification queries, commit messages, and explicit "do NOT" guardrails to prevent scope creep into Phase 1/2.

---

## Current Repository State

### Codex_signum (core)
- **Main HEAD:** `d07c85f` (docs: move phase-0-graph-foundation-prompt into docs/)
- **Tests:** 580 passing, 3 intentionally failing (algedonic bypass)
- **Governance:** CLAUDE.md + hooks ✅ (test taxonomy + data provenance + substrate-agnostic rule)
- **New reference docs:**
  - `codex-signum-lean-process-maps-v2.md` (36KB) — axiom-compliant process maps
  - `lean-process-maps-audit.md` (13KB) — violation analysis
  - `docs/phase-0-graph-foundation-prompt.md` (17KB) — Phase 0 coding prompt
- **Phase 3 fixes:** Committed at `4a21115` (budget-capped dampening, constitutional evolution, observer interface — note: the `GraphObserver` type from this commit is now superseded by the Observer elimination; it can be removed or left as dead code)
- **Parallel decompose:** Merged PR #3 at `e3c75a7` (23 pipeline integration tests, 650 total at time of merge)
- **Governance retrospective:** Applied at `93f6b44` (4 new architect files, rules 11+, anti-patterns 9-10)

### DND-Manager
- **Main HEAD:** `75e8a3b` (unchanged since last session)
- **Tests:** 2204/2205 passing
- **Governance:** CLAUDE.md + hooks ✅
- **Core dependency:** Stale — needs `npm install github:rowenhodge-ops/Codex_signum#main`
- **Known issue:** `origin` remote may still point to wrong repo (verify before pushing)

---

## Known Issues (Carry Forward)

### 1. DND-Manager core dependency stale
The DND-Manager's `@codex-signum/core` dependency doesn't include Phase 3 fixes, parallel decompose, or the governance updates. Phase 0 Task 1 (seedAgents verification) will fail until this is updated.
**Fix:** `npm install github:rowenhodge-ops/Codex_signum#main`

### 2. DND-Manager remote misconfiguration
`origin` may point to `Codex_signum.git`. Verify with `git remote -v` before pushing.

### 3. GraphObserver type in core is now dead code
Phase 3 fixes (commit `4a21115`) added a `GraphObserver` type and `ObserverMode` type. These are superseded by the Observer elimination. They're harmless as types (no runtime cost) but should be cleaned up to avoid confusion.

### 4. Algedonic bypass not implemented
3 safety tests intentionally failing. The lean process maps v2 don't address this directly — it's a Phase 3 fix item that predates this work.

### 5. Observer contamination in 3 documents
Supersession notes defined but not yet applied. Phase 0 Task 5 handles this.

### 6. CRITICAL: Morpheme topology not in graph schema
From Session 1 — the fundamental architectural gap. The lean process maps v2 operate within the current Agent/Decision/Pattern/Observation schema. The morpheme schema (Seed, Line, Bloom, Resonator, Grid, Helix as primary structural language) remains a future phase. The lean process maps are compatible with either schema — they describe process flows, not node types.

---

## Implementation Roadmap (from lean-process-maps-v2 §8)

### Phase 0: Graph Foundation (1 session) ← PROMPT READY
- Extend/verify AgentProps schema and seeding
- Schema migration: Execution→Decision, Model→Agent
- Register Pattern nodes
- Verify Decision lifecycle
- Document reconciliation
- **Gate:** `MATCH (a:Agent) RETURN count(a)` ≥ 20, `MATCH (p:Pattern) RETURN count(p)` = 4

### Phase 1: selectModel() + Decision Loop (1 session)
- Create `selectModel()` in core (wraps: query agents → filter → arm stats → route → record)
- Wire Decision outcome callback in consumer's graph-feeder
- **Gate:** call selectModel → Decision node written → outcome recorded → arm stats updated

### Phase 2: DevAgent Live (1 session)
- Wire ModelExecutor to `selectModel()` (per-stage routing)
- Wire graph-feeder to call `conditionValue()` + `computePhiL()` inline during writes
- Wire graph-feeder to write Observation + PipelineRun nodes in Codex schema
- **Gate:** run single task → all stages route through Thompson → conditioned metrics in graph

### Phase 3: Full Pattern Composition (1-2 sessions)
- Architect calls DevAgent for coding tasks
- DevAgent calls Thompson for model selection
- Retrospective reads from graph on schedule or event trigger
- **Gate:** architect plans a task → devagent executes → Thompson selects models → results observable in graph

---

## What's Next: Immediate

### Execute Phase 0
The prompt is at `docs/phase-0-graph-foundation-prompt.md` in the Codex_signum repo. Feed it to Claude Code.

**Prerequisites before running:**
1. Update DND-Manager core dependency: `npm install github:rowenhodge-ops/Codex_signum#main`
2. Verify DND-Manager remote: `git remote -v`
3. Ensure Neo4j is running

**Expected outcomes:**
- 20+ Agent nodes in graph with full capability metadata
- 4 Pattern nodes (thompson-router, dev-agent, architect, model-sentinel)
- Legacy Execution/Stage nodes gain Codex labels (Decision/Observation)
- Tracer.ts writes Codex schema going forward
- 3 documents gain Observer supersession notices
- All existing tests still pass

### After Phase 0: Produce Phase 1 Prompt
Once Phase 0 is verified, generate the `selectModel()` + Decision Loop prompt. This is where Thompson Sampling becomes live — real model selection, real decisions recorded in the graph, real arm stats updating from outcomes.

---

## Lessons Learned — This Session

### The Observer Was Hiding in Plain Sight

The Observer pattern was introduced early in the project's history as a natural way to "watch the system." It felt right — systems need monitoring, monitoring needs a pattern, patterns get SIPOCs and implementations. But the entire premise violated the founding axiom: **state is structural**. If the graph IS the state, then writing to the graph IS observation. There is no separate step of "observing what happened" — the write path IS the observation. An Observer pattern is, literally, a redundant copy of what the graph already does.

The insidious part: the Observer kept getting *improved*. Phase 3 added `GraphObserver` — making the Observer graph-backed. The finish-architect prompt added GraphObserver to the Observer class. Each improvement made it harder to see that the foundation was wrong, because the improvements were locally sensible. "The Observer should read from the graph" is a good idea *if the Observer should exist*. It shouldn't.

### Lean Process Mapping as Architectural Validation

The lean process maps weren't originally intended as an audit tool. They were supposed to be implementation documentation — SIPOCs and flow diagrams to guide coding agents. But the act of mapping every process flow forced confrontation with the question "what actually happens at each step?" and that confrontation exposed the Observer as an intermediary that had no structural justification.

This suggests a meta-practice: **before implementing, map the process flows against the axioms**. If a flow requires an entity that exists purely to mediate between two other entities that could communicate directly (in this case, execution and graph), that entity is likely an anti-pattern.

### Anti-Patterns Compound

The Observer violation didn't stay contained. It spawned: a Signal Pipeline (infrastructure for the Observer to route through), a Health Computation layer (infrastructure for the Signal Pipeline to feed into), a dependency matrix with 11 columns instead of 7, and three separate documents each proposing "improvements" to the wrong architecture. Every document that referenced Observer became a vector for the anti-pattern to propagate. The supersession notices are damage control — the real fix is the corrected architecture in v2.

### The Narrative Matters

The retrospective (Theme 8) recommended that context transfers should become "a protocol, not a document" — graph-derived state with no prose. That recommendation is technically correct and will be the right answer once the system can generate its own context snapshots. But right now, the narrative IS the institutional memory. "The Observer was eliminated because it violated Axiom 10" is a fact. The story of *how* it was discovered — through lean process mapping, not through testing — is the kind of knowledge that prevents the next anti-pattern from being introduced. The narrative captures not just what changed but why, and the "why" is what makes the learning transferable.

---

## Architecture Context (for prompting AI assistants)

```
CRITICAL CONSTRAINTS — include in every session prompt:
- Both repos have CLAUDE.md + hooks. Claude Code reads CLAUDE.md at session start.
- Codex_signum core has 580 tests passing (3 intentional failures — algedonic bypass)
- Test governance: 5 levels (Unit, Contract, Pipeline, Outcome, Safety) + Codex conformance
- Data provenance rule: ALL metrics must cite source. No estimated numbers presented as system output.
- Read source before writing tests (Rule 11 in CLAUDE.md)
- dist/ is committed in Codex_signum. No prepare script. Do not add one.
- DND-Manager origin remote may be misconfigured. Verify before pushing.
- Every task MUST commit and push to remote on completion.

OBSERVER ELIMINATION (NEW):
- Observer is NOT a pattern. It was eliminated as an Axiom 10 violation.
- Observations are written INLINE by the consumer's graph-feeder during execution.
- conditionValue() and computePhiL() are pure functions called in the write path.
- No collector, no intermediary, no monitoring overlay.
- Do NOT create observer.ts, collector.ts, evaluator.ts, or any monitoring infrastructure.
- The Retrospective pattern reads FROM graph (does not intercept writes).
- See lean-process-maps-audit.md for the full violation analysis.
- See lean-process-maps-v2.md for the corrected architecture.

SCHEMA:
- Core defines: Agent, Pattern, Decision, Observation, ContextCluster, etc.
- DND-Manager legacy defines: Execution, Model, Stage, ToolCall, Hallucination
- Phase 0 migrates legacy → Codex (adds labels, doesn't delete)
- Do NOT create parallel registries or duplicate schema definitions

FUTURE CONSTRAINT (post Phase 1):
- Morpheme topology will become the primary graph schema
- Current Agent/Decision/Pattern/Observation schema will be migrated
- Observability = Cypher queries against the graph. Reports produced by LLM on demand.
```

---

## Dampening Formula Evolution (Reference — Carry Forward)

| Version | Formula | Origin | Problem |
|---|---|---|---|
| v1 (original) | `min(0.7, 0.8/(k-1))` | Engineering Bridge | Doesn't guarantee subcriticality for k ≥ 3 |
| v2 (Session 5 polish) | `γ_base/√k` for hubs, v1 for standard | Spectral normalization | "Dangerously inadequate" — μ > 1 for k ≥ 3 |
| **v3 (Phase 3)** | `min(γ_base, 0.8/k)` for ALL nodes | Safety Analysis + Parameter Validation papers | **Only formula guaranteeing subcriticality for all topologies** |

---

## Constitutional Evolution Status (Reference — Carry Forward)

Before Phase 3:
- `AmendmentTier` type exists (just the type, no logic)
- No `src/constitutional/evolution.ts` implementation

After Phase 3 (committed at `4a21115`):
- Full lifecycle: propose → experiment → evaluate → vote → ratify
- Tier thresholds: 1 (90%/67%/3mo), 2 (95%/80%/6mo), 3 (99%/90%/12mo)
- Rate limits: max 5/3/1 simultaneous per tier
- Cooling periods: 0/3/12 months per tier

---

## Commit Log — Today (2026-02-27, Both Sessions)

| Commit | Repo | Description |
|---|---|---|
| `d07c85f` | Codex_signum | docs: move phase-0-graph-foundation-prompt into docs/ |
| `cf03184` | Codex_signum | docs: add Phase 0 coding session prompt |
| `30cfdc8` | Codex_signum | docs: add lean process maps axiom audit |
| `c067104` | Codex_signum | docs: add audited lean process maps v2 (with content) |
| `3fd82b0` | Codex_signum | docs: add audited lean process maps v2 + axiom audit |
| `93f6b44` | Codex_signum | docs: update governance from context transfer retrospective |
| `e3c75a7` | Codex_signum | feat(architect): add parallel decompose, mock executors, reasoning tiers (PR #3) |
| `4a21115` | Codex_signum | build: Phase 3 fixes — budget-capped dampening, constitutional evolution |
