# Codex Signum Implementation Plan

## From Theory to Working System

**Version:** 2.0  
**Date:** February 22, 2026  
**Purpose:** Living roadmap for building Codex Signum — updated to reflect actual progress, completed work, and refined tactical phases

---

## Executive Summary

Codex Signum is a substrate-agnostic semantic protocol where system state is encoded structurally rather than monitored externally. This plan tracks the journey from theoretical framework to working implementation.

**Strategic approach:**
1. Start with existing working code (smart router + DevAgent pipeline) — ✅ Done
2. Incrementally add Signum protocols (Neo4j graph state, Thompson routing, health dimensions) — ✅ Done
3. Build SURVEY for self-supervised construction — ✅ Done
4. Reconcile consumer app to use core exclusively — ✅ Done
5. Supercharge pipeline with full model roster, OpEx metrics, and structural governance loops — 🔄 In Progress
6. Implement additional patterns (Architect, Retrospective, Research) — 📋 Planned
7. Validate hypotheses empirically — 📋 Planned

**Two repositories:**
- `Codex_signum` — Core library (`@codex-signum/core`). Computation, governance, routing, pattern infrastructure.
- `DND-Manager` — Consumer application. D&D character sheet manager serving as the first Codex-governed agent system.

**Licensing:** AGPL v3 dual-licensing (open source + commercial)

---

## What Has Been Built

### Phase 1: Core Library (Complete ✅)

The `@codex-signum/core` library implements the full theoretical framework:

**Health Dimensions:**
- `computePhiL()` — System Vitality (ΦL). All 4 factors: task completion, quality assessment, cost efficiency, correction efficiency. Composite weighted: 0.35 / 0.30 / 0.20 / 0.15.
- `computePsiH()` — Harmonic Resonance (ΨH). Spectral: λ₂ algebraic connectivity from graph Laplacian. Temporal: total variation of governance metric over sliding window.
- `computeEpsilonR()` — Exploration Rate. Ratio of exploratory to total decisions over observation window.
- `computeDampening()` — Cascade prevention with CASCADE_LIMIT=2, HYSTERESIS=2.5×.
- `computeMaturity()` — Information-theoretic maturity with Shannon entropy.
- Signal conditioning orchestrator — Debounce, Hampel, EWMA, CUSUM, MACD, hysteresis, trend regression.

**Governance:**
- `evaluateConstitution()` — Constitutional rule evaluation against axioms.
- `propagateDegradation()` — Cascade propagation through pattern dependency graph.
- `route()` / `selectModel()` — Thompson sampling with Bayesian posterior updates.

**Patterns:**
- `DevAgent` — Staged pipeline (SCOPE → EXECUTE → REVIEW → VALIDATE) with correction helix.
- `Architect.survey()` — SURVEY stage: filesystem analysis, gap detection, duplication identification. Pure function, no LLM, deterministic.
- `SurveyOutput` type system — Structured gap analysis with confidence scoring.

**Infrastructure:**
- Neo4j schema: Agent, Decision, Execution, Observation, PipelineRun, ConstitutionalRule nodes.
- TypeScript throughout. Vitest for testing.
- `dist/` committed as build artifact. No prepare script (critical npm compatibility fix).

**Repo state:** `main` at `4cd0ecc`. Exports all computation, governance, routing, and pattern functions.

### Phase 2: SURVEY Foundation + Consumer Integration (Complete ✅)

Used the Architect pattern's SURVEY stage to self-supervise construction:

**SURVEY capabilities (merged in PR #1 at `718b339b`):**
- Filesystem scanning with pattern matching against specs
- Gap detection: missing implementations, unmet spec requirements
- Duplication identification: local files that duplicate core exports
- Confidence scoring per finding
- Structured output format consumed by downstream tooling

**Consumer integration (PR #2 on DND-Manager):**
- SURVEY runner script (`agent/scripts/survey.ts`)
- Reconciliation task generator (`agent/scripts/generate-reconciliation-tasks.ts`)
- Full survey output: 14 gaps found (4 critical, 9 warnings, 1 info)
- 5 duplications identified (3 high confidence, 1 medium, 1 low)
- 13 reconciliation tasks generated across 5 phases

### Phase 3: Reconciliation (Complete ✅)

Executed the SURVEY-generated reconciliation plan:

**What was reconciled:**
- Extracted ModelExecutor adapter from hybridAgent.ts
- Extracted QualityAssessor adapter from hybridAgent.ts
- Created afterPipeline graph-feeder hook (computes ΦL/ΨH/εR → Neo4j)
- Wired CodexBridge as single entry point from consumer into core
- Deleted local health duplicates (ExplorationTracker.ts, HarmonicResonance.ts, HealthComputer.ts)
- Archived hybridAgent.ts
- Wired propagateDegradation cascade from core

**Branch:** `phase-3/reconciliation` — pushed at `a532c50`

**Key architectural decisions:**
- CodexBridge (`agent/codex-bridge.ts`) is the ONLY integration point
- All health computation imported from core — zero local reimplementation
- Neo4j is the sole persistence layer for agent state (no JSON files)
- `models.ts` is single source of truth for model configuration

### Phase 3.5: Initial Pipeline Optimization (Complete ✅)

Fixed two observability gaps discovered during pipeline analysis:

**Hallucination detection wiring:**
- OutputValidator (9 patterns) was disconnected from new pipeline
- Wired into assessor adapter — hallucinations now detected per-stage
- HallucinationCollector aggregates across pipeline run
- Hallucination data persisted to Neo4j via afterStage hook

**Error classification:**
- Infrastructure errors (auth failures, timeouts, rate limits) distinguished from quality failures
- Infrastructure errors skip Thompson arm updates (don't penalise model for GCP outage)
- Error taxonomy: `INFRASTRUCTURE_ERROR` vs `QUALITY_FAILURE` vs `UNKNOWN`

**Branch:** `phase-3/reconciliation` (continued)
**Prompt document:** `copilot-pipeline-optimization.md`

---

## What Is Being Built Now

### Phase 4: Pipeline Supercharge (In Progress 🔄)

**Branch:** `phase-4/pipeline-supercharge` (from current main or phase-3 head)
**Prompt document:** `docs/pipeline-supercharge-v2.md` (1,460 lines, 35 tasks across 6 sub-phases)

This is the transformation from 4-model proof-of-concept to 20+ model self-improving system with production-grade observability, circuit breaking, human feedback loops, and structural governance.

#### Sub-Phase 4.1: Fix the Model Registry (5 tasks)

Expand from 4 hardcoded models to full confirmed roster:

| Provider | Models | API Pattern |
|---|---|---|
| Anthropic | Opus 4.5, Sonnet 4.5, Haiku 4.5 | Direct `/v1/messages` |
| Google | Gemini 2.0 Flash, Flash-Lite, Pro (Experimental) | Vertex AI |
| OpenAI | GPT-4o, GPT-4o Mini, o3-mini | Direct `/v1/chat/completions` |
| Mistral | Large, Small, Codestral | Direct `/v1/chat/completions` |
| DeepSeek | Chat (V3), Reasoner (R1) | OpenAI-compatible |

- `models.ts` becomes single source of truth with capability tags, cost tiers, context windows
- `nativeClients.ts` derives client map from models.ts (not vice versa)
- Single `mapToNativeModelId()` function, single location
- ModelRouter aligned — only models in models.ts are routable
- Verification: all models callable with identity prompt

#### Sub-Phase 4.2: Wire Hallucination Detection (3 tasks)

- OutputValidator wired into assessor adapter
- HallucinationCollector with afterStage hook
- Hallucination observations persisted to Neo4j as Observation nodes
- Pattern: `(Observation {type: 'hallucination'})-[:OBSERVED]->(Agent)`

#### Sub-Phase 4.3: Classify Infrastructure Errors + Circuit Breaker (3 tasks)

- Error taxonomy: infrastructure vs quality failures
- Infrastructure errors excluded from Thompson posterior updates
- **Provider-level circuit breaker** (NEW):
  - States: CLOSED → OPEN (after 3 consecutive failures) → HALF_OPEN (5min cooldown) → CLOSED
  - Filters candidates before Thompson sampling
  - Prevents cascading failure pattern (e.g., 3 rapid Mistral auth failures)
  - Optional Neo4j persistence for observability
  - OpEx lineage: Jidoka (autonomation — detect abnormality and stop)

#### Sub-Phase 4.4: OpEx Metrics (5 tasks)

- **Rolled Throughput Yield (RTY):** First-pass yield across all pipeline stages. Probability of defect-free traversal.
- **%Complete & Accurate (%C&A):** Per-stage downstream acceptance rate. Leading indicator of waste.
- **Context-blocked posteriors:** Thompson arms partitioned by stage type. Planning model ≠ code generation model.
- **Three-layer pre-filtering (poka-yoke):**
  - Layer 1: Capability-based (stage requirements, context window minimums)
  - Layer 2: **Cost forecasting** (NEW) — First leading indicator in system. `estimateOutputTokens()` heuristic by stage × complexity. Reject candidates exceeding cost ceiling BEFORE execution.
  - Layer 3: **Exploration floor** (NEW) — 5% minimum exploration rate per model. Prevents Thompson cold-start premature convergence when jumping from 4 to 20+ models.

#### Sub-Phase 4.5: Wire Core Exports — Tier 1 Integration (8 tasks)

- Wire `propagateDegradation()` in afterPipeline hook
- Implement threshold events with maturity-indexed boundaries + debouncing
- Track feedback effectiveness (Scale 1 Loop: correction success rate)
- Replace JSON-backed Thompson state with Neo4j graph state
- Comprehensive `codexStats` output showing all metrics
- **Orphaned Decision reconciliation** (NEW) — Cypher cleanup for Decision nodes with no PRODUCED relationship. Prevents ΦL denominator skew.
- **Human feedback signal** (NEW) — CLI: `npx tsx agent/scripts/feedback.ts <runId> accept|reject [reason]`. Enables validator precision/recall computation. Optional retroactive Thompson arm re-weighting.
- **Constitutional violations → ΦL** (NEW) — Violations create negative Observation nodes. Repeated violations compound into ΦL degradation. "Dimmed, not blacklisted."

#### Sub-Phase 4.6: Final Verification + Contract Tests (6 tasks)

- Full TypeScript check + build
- **Core dependency contract tests** (NEW) — Behavioral contracts for `@codex-signum/core` exports. Catches silent semantic drift on dependency bumps.
- SURVEY re-run with expanded checks
- codexStats verification (circuit breaker status, validator calibration, orphan count)
- Contract test execution
- Final commit

**What Phase 4 unlocks (16 capabilities):**
1. 20+ models available to Thompson sampling (was 4)
2. Per-stage hallucination detection with Neo4j persistence
3. Infrastructure vs quality error classification
4. Circuit breaker prevents cascading provider failures
5. RTY measures first-pass pipeline quality
6. %C&A per stage measures downstream acceptance
7. Context-blocked posteriors (stage-aware routing)
8. Cost forecasting (first leading indicator)
9. Exploration floor prevents cold-start convergence
10. Graph-backed Thompson state (no JSON files)
11. Threshold events with maturity-indexed boundaries
12. Feedback effectiveness tracking (Scale 1 Loop)
13. Human feedback signal enables validator calibration
14. Constitutional violations feed ΦL (structural governance)
15. Orphan reconciliation keeps graph clean
16. Contract tests catch core drift

**Files touched:** ~20 files (6 new, 14 modified)

---

## What Comes Next

### Phase 5: Architect Pattern Completion (Estimated: 8-10 tasks)

**Branch:** `phase-5/architect-complete`
**Spec:** `codex-signum-architect-pattern-design.md`

SURVEY exists and works. The remaining Architect stages need implementation:

- **DECOMPOSE:** SurveyOutput + intent → TaskGraph. Decomposes work into typed tasks with dependencies.
- **CLASSIFY:** Mechanical (file ops, compiler verification) vs generative (full DevAgent pipeline). Different execution strategies per type.
- **SEQUENCE:** Topological sort with phase boundaries. Easy wins first within phases.
- **GATE:** Mandatory human approval initially. Plan summary, critical path, risks, blind spots. Approve / Modify / Abort.
- **DISPATCH:** Feed tasks to DevAgent one at a time. Git workflow: branch per phase, commit per task, PR on completion.
- **ADAPT:** Failure classification + replanning. Triage scope: retry, local replan, or full redecomposition.
- **CLI:** `codex plan`, `codex plan status`, `codex plan approve`

**Success criteria:** A real task executes end-to-end through the Architect: intent → SURVEY → DECOMPOSE → GATE → DISPATCH → committed code.

**After this, the system is self-sustaining.** Future development is planned and executed through the Architect, not through manual handoff documents.

### Phase 6: Additional Patterns (Estimated: 3-4 weeks)

**Specs:** `codex-signum-retrospective-pattern-design.md`, `codex-signum-research-pattern-design.md`, `codex-signum-reference-patterns-design.md`

These patterns stress-test whether Codex Signum generalises beyond routing and development:

**Retrospective Pattern:** Fires on threshold event accumulation, εR rigidity, or feedback effectiveness drop. Reads across all pattern Grids to detect systemic issues.

**Research Pattern:** Knowledge graph construction from academic sources. Source credibility constitutional rules. Citation verification and bias detection.

**Reference Patterns:** Existing working code formalised as canonical Codex patterns with Pattern Exchange Protocol metadata.

**Success criteria:** At least 2 patterns share the constitutional layer. Cross-pattern governance demonstrably works.

### Phase 7: Pattern Exchange Protocol (Estimated: 2-3 weeks)

**Spec:** `codex-signum-pattern-exchange-protocol.md`

The "HTTP equivalent" for Codex Signum pattern sharing. Pattern metadata format, import/export mechanism, version compatibility, trust attestation chain. This is the commercialisation enabler.

### Phase 8: Visualisation + Dashboard (Estimated: 2 weeks)

Constitutional state dashboard, agent interaction graph, decision trace viewer, ΦL/ΨH/εR time-series with threshold events, RTY and %C&A trend lines. Technology: React + D3.js or Neo4j Bloom.

### Phase 9: Scientific Validation Framework (Ongoing, parallel)

**Core hypotheses:**
- H1: Constitutional evolution improves performance over time
- H2: Spectral metrics (λ₂) predict system stability
- H3: Hierarchical routing extracts value from unreliable models
- H4: Governance overhead scales sub-linearly with agent count
- H5: Dampening + hysteresis mechanisms contain cascade failures

**Success criteria:** 5 hypotheses tested with >1000 data points each. At least 3 validated (p < 0.05). Results reproducible.

---

## Architectural Invariants

These rules hold across all phases. Every Copilot/Claude session MUST include this context:

```
ARCHITECTURAL CONTEXT:
- This project uses Neo4j (neo4j-driver). There is NO Firebase/Firestore in the agent layer.
- All integer Cypher parameters MUST use neo4j.int().
- Health computation (ΦL, ΨH, εR, dampening) lives in @codex-signum/core.
  Consumer apps import from core. They NEVER reimplement locally.
- The CodexBridge (agent/codex-bridge.ts) is the ONLY entry point
  from DND-Manager into core. hybridAgent.ts is retired.
- models.ts is the SINGLE source of truth for model config. nativeClients.ts derives from it.
- Every task MUST commit and push to remote on completion.
- dist/ is committed in Codex_signum. There is no prepare script. Do not add one.
- Do NOT touch the Codex_signum repository unless explicitly instructed.
- No state in JSON files. If it persists, it goes to Neo4j.
```

**Design principles:**
- "State is structural" — no separation between representation and observability
- "Anything mandated is in the structure" — governance emerges from structural properties
- "Dimmed, not blacklisted" — proportional, continuous responses rather than binary cutoffs
- "Leading indicators over lagging" — cost forecasting, %C&A, exploration floor
- Event-triggered reviews over periodic ones
- OpEx lineage: Jidoka, poka-yoke, 5S, kaizen, DOE principles applied to AI governance

---

## Operational Excellence Mapping

| Mechanism | OpEx Principle | Source |
|---|---|---|
| Circuit breaker | Jidoka (autonomation) | Toyota Production System |
| Pre-filtering (poka-yoke) | Mistake-proofing | Shingo |
| Cost forecasting | Leading indicators | Balanced Scorecard |
| RTY | Rolled Throughput Yield | Six Sigma |
| %C&A | Percent Complete & Accurate | Lean |
| Exploration floor | Design of Experiments | DOE |
| Orphan reconciliation | 5S (workplace organisation) | Lean |
| Human feedback | Kaizen (continuous improvement) | TPS |
| Constitutional violations → ΦL | Structural governance | Codex Signum (novel) |
| Threshold events | Andon (signal board) | TPS |
| Dampening + hysteresis | Cascade prevention | Control theory |

---

## Timeline and Current Status

### Completed (Months 1-3)
- ✅ Core library: all health dimensions, governance, routing, patterns
- ✅ Neo4j schema and persistence layer
- ✅ Thompson sampling router with Bayesian posteriors
- ✅ DevAgent pipeline with correction helix
- ✅ SURVEY stage of Architect pattern
- ✅ Consumer app reconciliation (deduplicated, CodexBridge wired)
- ✅ Initial observability (hallucination detection, error classification)
- ✅ Phase B observability infrastructure (stage tracing, ΦL persistence, PipelineRun nodes)

### In Progress (Current Sprint)
- 🔄 Pipeline Supercharge (Phase 4) — 35 tasks across 6 sub-phases
- 🔄 Full model roster expansion (4 → 20+ models)
- 🔄 Circuit breaker, cost forecasting, exploration floor
- 🔄 Human feedback loops and validator calibration

### Upcoming
- 📋 Phase 5: Architect pattern completion (DECOMPOSE → DISPATCH)
- 📋 Phase 6: Additional patterns (Retrospective, Research)
- 📋 Phase 7: Pattern Exchange Protocol
- 📋 Phase 8: Visualisation dashboard
- 📋 Phase 9: Scientific validation framework

### Checkpoints
- **End of Phase 4:** Full self-improving pipeline. 20+ models. All OpEx metrics. Human feedback loop. Constitutional violations feeding governance.
- **End of Phase 5:** Self-sustaining development. The Architect plans and executes its own construction.
- **End of Phase 6:** Multi-pattern governance validated. Framework demonstrably generalises.
- **End of Phase 7:** Pattern exchange operational. Network effects possible.

---

## Risk Register

### Technical Risks

**R1: Neo4j performance at scale**
- Impact: High | Probability: Medium
- Mitigation: Async logging, batch writes, proper indexing. Orphan reconciliation prevents graph bloat.
- Status: Active monitoring. 329 Decision nodes, 180 Execution nodes current.

**R2: Thompson cold-start with 20+ models**
- Impact: High | Probability: High
- Mitigation: Exploration floor (5% minimum per model). Context-blocked posteriors. Cost ceiling pre-filtering.
- Status: Addressed in Phase 4 design. Not yet implemented.

**R3: Copilot scope drift during implementation**
- Impact: Medium | Probability: High (observed repeatedly)
- Mitigation: Architectural context injection, explicit constraints per session, commit-per-task discipline, fresh sessions.
- Status: Actively managed.

**R4: Constitutional violations accumulate without consequence**
- Impact: High | Probability: Medium
- Mitigation: Phase 4 wires violations into ΦL as negative observations.
- Status: Designed, not yet implemented.

**R5: Core dependency drift**
- Impact: High | Probability: Medium
- Mitigation: Contract tests (Phase 4.6). Pinned SHA dependency. SURVEY detects interface mismatches.
- Status: Consumer pinned to `#4cd0ecc`. Contract tests designed.

### Strategic Risks

**R6: Framework too complex for adoption**
- Impact: Medium | Probability: Medium
- Mitigation: "Von Neumann probe" strategy — the forge creates high-quality applications. Users see quality first, protocol second.

**R7: Time/resource constraints**
- Impact: High | Probability: Medium
- Mitigation: Modular phases, each delivers value independently.

---

## Lessons Learned

### npm prepare Script Bug
`"prepare": "npm run build"` in package.json causes npm to rebuild `dist/` during GitHub dependency install. Fix: remove prepare script, commit `dist/` directly. Applied in `4cd0ecc`.

### Copilot Verification Loop
After encountering failures, Copilot runs excessive verification commands creating "learned helplessness." Countermeasures: fresh session, "VERIFIED STATE — do not re-check" prefix, max one verification per step.

### Copilot Scope Drift
Copilot modifies files outside stated scope. Countermeasure: architectural constraints at top of every prompt, explicit "Do NOT touch [repo]" instructions, code review on every commit.

### Context Window as Failure Signal Amplifier
Long sessions accumulate error context that biases subsequent generations. Counter: smaller scopes per session, continuation prompts with clean state.

### What Worked Well
- Commit-per-task discipline enables async review
- SURVEY-generated reconciliation tasks had high completion rate
- Pre-written implementations in prompts dramatically improve Copilot execution quality
- Minimal scope per session + continuation prompts = reliable execution

---

## Key Documents Index

| Document | Purpose | Location |
|---|---|---|
| `codex-signum-v3_0.md` | Core protocol spec v3.0 | Claude project |
| `codex-signum-v3_1-adaptive-imperative-boundaries.md` | Adaptive imperative boundaries | Claude project |
| `codex-signum-engineering-bridge-v2_0.md` | Implementation bridge: theory → code | Claude project |
| `codex-signum-implementation-README.md` | 10 constraints + anti-patterns | Claude project |
| `codex-signum-opex-addendum-v2.md` | OpEx synthesis: Lean/Six Sigma/Shingo mappings | Claude project |
| `codex-signum-phase-b-plan.md` | Phase B observability task specs | Claude project |
| `codex-signum-audit-v3.md` | Alignment audit methodology | Claude project |
| `codex-signum-reconciliation-plan-v2.md` | SURVEY-first reconciliation strategy | Claude project |
| `thompson-router-architecture.md` | Thompson sampling router design | Claude project |
| `codex-signum-architect-pattern-design.md` | Architect pattern (SURVEY → DISPATCH) | Claude project |
| `codex-signum-research-pattern-design.md` | Research pattern design | Claude project |
| `codex-signum-retrospective-pattern-design.md` | Retrospective pattern design | Claude project |
| `codex-signum-reference-patterns-design.md` | Router + DevAgent formalisation | Claude project |
| `codex-signum-pattern-exchange-protocol.md` | Pattern Exchange Protocol spec | Claude project |
| `codex-signum-research-index.md` | Index of 10+ research validation papers | Claude project |
| `pipeline-supercharge-v2.md` | Phase 4 implementation prompt (35 tasks) | `docs/` in repo |
| `copilot-pipeline-optimization.md` | Phase 3.5 implementation prompt | Claude project |

---

## GitHub Repositories

- **Codex_signum:** `github.com/rowenhodge-ops/Codex_signum` (main at `4cd0ecc`)
- **DND-Manager:** `github.com/rowenhodge-ops/DND-Manager` (main at `d5ef6801`)
- **Open PR:** DND-Manager PR #2 (`phase-2/survey-driven-reconciliation` → main)

---

## Appendix A: Core Hypotheses

### H1: Constitutional Evolution Improves Performance Over Time
Systems with evolving constitutions outperform static-rule systems on quality, cost, and reliability. Baseline: fixed rules. Treatment: constitutional evolution enabled. Duration: 1000+ decisions. Success: p < 0.05 improvement on at least 2 of 4 metrics.

### H2: Spectral Metrics Predict System Stability
Graph Laplacian spectral properties (particularly λ₂) correlate with and predict system reliability. Success: λ₂ changes precede instability events (leading indicator validation).

### H3: Hierarchical Routing Reduces Hallucination Impact
Hierarchical routing with meta-learning extracts value from unreliable-but-fast models. Success: lower cost at equivalent quality, or higher quality at equivalent cost.

### H4: Framework Scales to N Agents
Constitutional governance overhead scales sub-linearly with agent count. Success: empirical scaling better than O(N²).

### H5: Dampening + Hysteresis Prevents Cascade Failures
Systems with dampening mechanisms recover faster and contain damage better. Success: 2× faster recovery, 50%+ cascade depth reduction.

---

## Appendix B: Alignment with Existing Work

**Builds on:** Anthropic's Constitutional AI, Olfati-Saber's spectral consensus, Pihlakas' homeostatic AI, TDA for neural networks.

**Differs from:** AutoGen/LangGraph/CrewAI (choreography, not governance), ETHOS/Institutional AI (mechanism design, not constitutional evolution).

**Advances:** Integration thesis (spectral + cybernetic + constitutional + topological). Constitutional evolution with formal mechanisms. Working implementation over theory.

**Positioned beneath:** ISO 42001. Codex Signum provides the technical implementation layer that governance frameworks specify but don't operationalise. EU AI Act enforcement creates market demand.

---

## Appendix C: Open Research Questions

1. Constitutional evolution dynamics: stable equilibria? Convergence guarantees?
2. Spectral governance properties: which metrics actually predict behaviour?
3. Multi-agent coordination comparison: vs consensus algorithms, game-theoretic mechanisms
4. Scalability limits: at what agent count does the framework degrade?
5. Generalisation boundaries: which system types benefit? Which don't?
6. Human-AI collaboration: how should constitutional governance interact with human oversight?
7. Adversarial robustness: can agents game the constitutional layer?
8. Emergent behaviour: what patterns emerge that weren't designed in?
9. Cold-start convergence: how quickly do Thompson posteriors stabilise with exploration floor?
10. Cross-pattern governance interference: do rules for one pattern affect others?
