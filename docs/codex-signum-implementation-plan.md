# Codex Signum Implementation Plan

## From Theory to Working Self-Sustaining System

**Version:** 2.0
**Date:** 22 February 2026
**Purpose:** Living roadmap tracking what's built, what's in progress, and what remains to reach the self-sustaining milestone where the system plans and executes its own development.

---

## Executive Summary

Codex Signum is a substrate-agnostic semantic protocol where system state is encoded structurally rather than monitored externally. AI models are interchangeable substrate; governance emerges from structural properties. After 18+ months of theoretical development and ~3 months of active implementation, the system has a working core, a functional consumer application, and is entering its most critical phase: the pipeline supercharge that transforms a 4-model proof-of-concept into a 20+ model self-improving system.

**Repos:**
- `Codex_signum` (core library) — `@codex-signum/core`, main at `4cd0ecc`
- `DND-Manager` (consumer app) — AI agent pipeline for D&D character management, main at `d5ef6801`

**Stack:** TypeScript, Neo4j (graph DB), SQLite (observability backend)

**Critical path to self-sustaining operation:**
```
Pipeline Supercharge (current)
  → Tier 1: Wire existing core exports
    → Tier 2: ΦL/ΨH refinements
      → Tier 3: Architect pattern completion
        → INFLECTION: system plans and executes its own development
```

---

## Current State: What's Built

### Core Library (`Codex_signum`)

| Component | Status | Notes |
|---|---|---|
| Neo4j graph schema | ✅ Complete | Agent, Pattern, Decision, Observation, PipelineRun nodes |
| Thompson sampling router | ✅ Complete | `route()`, `selectModel()` API, Beta posterior updates |
| ΦL (System Vitality) | ✅ Complete | Composite persistence, full signal processing pipeline (Debounce → Hampel → EWMA → CUSUM → MACD → Hysteresis → Trend) |
| ΨH (Harmonic Resonance) | ✅ Complete | Spectral computation via λ₂ + TV_G. Currently degenerate at 0.000 with single active pattern node — will become valuable as graph grows |
| εR (Exploration Rate) | ✅ Complete | Exploration tracking from Decision nodes |
| DevAgent pipeline | ✅ Complete | SCOPE → EXECUTE → REVIEW → VALIDATE with correction loops |
| SURVEY (Architect pattern) | ✅ Complete | Built, validated against manual audit. `survey()` exported from core |
| Constitutional layer | ✅ Complete | Rule engine, evaluation, axiom checking |
| Degradation cascade | ✅ Exported, not wired | `propagateDegradation()` — exported but consumer doesn't call it |
| Stage tracing | ✅ Complete | PipelineRun nodes, afterStage/afterPipeline hooks |
| Temporal stability | ✅ Exported, not wired | `computeTemporalStability()` — same situation as degradation |

### Consumer Application (`DND-Manager`)

| Component | Status | Notes |
|---|---|---|
| CodexBridge | ✅ Complete | Single entry point from DND-Manager into core |
| Adapter layer | ✅ Complete | Executor, assessor, graph-feeder adapters |
| Model registry (`models.ts`) | ⚠️ Stale | Has model configs but missing Claude 4.6 family, Gemini 3.x, Mistral updates |
| Native clients (`nativeClients.ts`) | ❌ Bottleneck | `ALL_MODELS` frozen pre-Dec 2025. Only 4 models executable despite 20 defined |
| `mapToNativeModelId()` | ❌ Duplicated | Two competing copies in `hybridAgent.ts` and `smartRouter.ts` |
| `ModelRouter.ts` | ⚠️ Hardcoded | Overrides `models.ts` stage assignments with Claude-only defaults |
| Thompson state | ❌ JSON file | `thompson-state.json` — should be in Neo4j |
| OutputValidator | ✅ Exists, not wired | 9 hallucination patterns, correct implementation, but not called by new pipeline. Bridge hardcodes `hallucinationsDetected: []` |
| Graph-feeder | ✅ Partial | Writes PipelineRun/Decision/Observation nodes, computes ΦL/εR/ΨH. Missing: hallucination persistence, degradation propagation, threshold events |

### Key Metrics (as of February 2026)

- **Pipeline executions:** ~180
- **Models actively routing:** 4 (of 20 defined)
- **Thompson arm convergence:** ~9 observations per model×task-type cell (needs ~30+ for meaningful convergence)
- **ΦL:** ~0.742 (healthy band)
- **ΨH:** 0.000 (degenerate — single pattern node, expected)
- **εR:** ~0.15

---

## In Progress: Pipeline Supercharge

**Document:** `pipeline-supercharge-v1.md` (detailed implementation prompt)
**Branch:** `phase-4/pipeline-supercharge`
**Scope:** 6 phases, 35 tasks

This is the highest-leverage work in the entire roadmap. Every subsequent tier depends on having a fully operational pipeline generating meaningful data across all models.

### Phase 1: Fix Model Registry (5 tasks)
Unlock all 20+ models by updating `models.ts` to the confirmed February 2026 roster, making `nativeClients.ts` derive from it (not maintain a parallel registry), consolidating the duplicate `mapToNativeModelId()`, and aligning `ModelRouter.ts` defaults.

### Phase 2: Wire Hallucination Detection (3 tasks)
The OutputValidator exists and works. Wire it into the assessor (low quality score → core's correction loop retries), create a HallucinationCollector with afterStage hook (side-channel accumulation since core's StageResult is substrate-agnostic), and persist hallucination counts to Neo4j.

### Phase 3: Error Classification + Circuit Breaker (3 tasks)
Classify infrastructure errors (GCP auth, rate limits, network) vs model quality errors. Skip Thompson arm updates for infrastructure failures. Implement provider-level circuit breaker (CLOSED → OPEN → HALF_OPEN) to prevent cascading failures from hammering a down provider.

### Phase 4: OpEx Metrics (5 tasks)
Production-grade observability from Lean Six Sigma:
- **Rolled Throughput Yield (RTY):** Multiplies per-stage first-pass yields. Exposes hidden rework invisible to aggregate ΦL.
- **%C&A (Percent Complete & Accurate):** Per-stage leading indicator for RTY.
- **Context-blocked posteriors:** Separate Thompson Beta distributions per model × task-type cell (DOE blocking principle).
- **Cost forecasting:** Estimate execution cost before routing — first leading indicator in the system.
- **Exploration floor:** 5% minimum traffic per eligible model to prevent cold-start premature convergence.

### Phase 5: Wire Core Exports + New Capabilities (8 tasks)
- Wire `propagateDegradation()` from core
- Implement ThresholdEvent nodes on ΦL boundary crossings
- Track feedback effectiveness across correction cycles
- Replace JSON-backed Thompson state with graph-native core wrapper
- Reconcile orphaned Decision nodes (~150 dangling)
- Add human feedback CLI for validator calibration (precision/recall on the quality gate)
- Wire constitutional violations into ΦL as negative observations (governance through structure)
- Update codexStats with all new metric sections

### Phase 6: Verification + Contract Tests (6 tasks)
Full TypeScript check, core dependency behavioral contract tests, SURVEY run, codexStats verification, final commit and PR.

### What Pipeline Supercharge Unlocks
- 20+ models competing via Thompson Sampling (was 4)
- Hallucination detection surfaced in results and Neo4j (was swallowed)
- Infrastructure errors don't poison arm stats (was penalising models for GCP failures)
- Circuit breaker prevents cascading provider failures
- RTY exposes hidden rework, %C&A identifies bottleneck stages
- Cost forecasting as the first leading indicator (all other metrics are lagging)
- Context-blocked posteriors enable model specialisation discovery
- Human feedback loop enables validator calibration
- Constitutional violations compound into ΦL degradation (structural governance)
- All state in Neo4j — no JSON files violating "State Is Structural"

---

## Tier 1: Wire Existing Core Exports (Days, Post-Supercharge)

These are capabilities the core already exports but the consumer doesn't call. Low effort, high value.

| Task | Description | Dependency |
|---|---|---|
| T1-1 | Wire `propagateDegradation()` | Covered in Supercharge Task 5.1 |
| T1-2 | Wire `computeTemporalStability()` | Core exports, graph-feeder doesn't call |
| T1-3 | ThresholdEvent nodes | Covered in Supercharge Task 5.2 |
| T1-4 | Feedback effectiveness metric | Covered in Supercharge Task 5.3 |
| T1-5 | Replace JSON Thompson state with graph state | Covered in Supercharge Task 5.4 |

**Note:** Most of Tier 1 is absorbed into the Pipeline Supercharge Phase 5. After supercharge, the remaining item is `computeTemporalStability()`.

---

## Tier 2: Codex-Level OpEx Refinements (Weeks)

These require changes to the core's computation modules. Each is a discrete enhancement to the health dimension algebra.

| Task | Description | OpEx Lineage | Effort |
|---|---|---|---|
| T2-1 | **ΦL centering + spread decomposition** — Split into bias (Cpk, systematic off-target) vs variance (Cp, scatter). High variance centered performance needs different intervention than low variance systematic bias. Currently conflated. | Lean Six Sigma process capability (Cp/Cpk) | Medium |
| T2-2 | **Western Electric / Nelson pattern rules** — Add pattern-based degradation detection: 7 consecutive points trending, 2 of 3 beyond 2σ, 8 consecutive on one side of center. Catches degradation before threshold crossing. Additive to existing EWMA/CUSUM. | SPC Western Electric Rules | Low-Medium |
| T2-3 | **ΨH temporal decomposition (FDIS)** — When meaningful (with more pattern nodes): frequency (how often patterns align), duration (persistence), intensity (coupling strength), scope (participant count). Turns single number into diagnostic vector. | Signal processing, FDIS analysis | Medium |
| T2-4 | **ΨH hypothetical state computation** — Make ΨH projectable against proposed states. "What happens to ecosystem health if we deploy this amendment?" Structural impact assessment. | Lean Six Sigma what-if analysis | Medium |
| T2-5 | **Fragility awareness in ΦL** — Patterns that haven't been stress-tested present as structurally fragile. Makes failure-mode coverage visible in health encoding. Untested ≠ healthy. | FMEA (Failure Mode and Effects Analysis) | Low |
| T2-6 | **Minimum stability periods for constitutional evolution** — Prevents amendment oscillation. Ecosystem needs time to reveal genuine structural impact vs transient compliance spike. | Shingo stability principle | Low |
| T2-7 | **State dimension soundness constraint** — ΦL/ΨH/εR must be deterministic, reproducible from observable structure, with no hidden dependencies. Formal verification that health computation is pure function of graph state. | Engineering discipline | Medium |
| T2-8 | **Anti-hallucination as epistemic honesty** — Reframe from quality assurance to Fidelity axiom (A3) enforcement. Patterns that never acknowledge uncertainty should structurally present as less healthy. Assessor penalizes confident claims on ambiguous tasks. | Codex Axiom A3 (Fidelity) | Low |

**Prerequisite:** Pipeline Supercharge must be complete so these refinements operate on meaningful data (20+ models, real RTY/feedback signals) rather than in vacuum.

---

## Tier 3: Architect Pattern Completion (Self-Sustaining Milestone)

SURVEY exists and is validated. The remaining 7 stages transform the system from "needs a human to write implementation prompts" to "plans and executes its own development."

| Stage | Function | Inputs | Outputs | Status |
|---|---|---|---|---|
| SURVEY | Audit codebase against spec | Spec docs + codebase | SurveyOutput with gaps | ✅ Built |
| DECOMPOSE | Break SurveyOutput into tasks | SurveyOutput | TaskGraph with dependencies | ❌ Design complete |
| CLASSIFY | Label tasks as mechanical vs generative | TaskGraph | ClassifiedTaskGraph | ❌ Design complete |
| SEQUENCE | Topological sort with phase boundaries | ClassifiedTaskGraph | OrderedPlan | ❌ Design complete |
| GATE | Human approval checkpoint | OrderedPlan | Approved/Modified/Aborted | ❌ Design complete |
| DISPATCH | Execute tasks via DevAgent | ApprovedPlan | Results + git operations | ❌ Design complete |
| ADAPT | Handle failures, replan | FailedTask + context | RevisedPlan | ❌ Design complete |

### Supporting Infrastructure

| Component | Description | Status |
|---|---|---|
| CLI | `codex plan`, `codex plan status`, `codex plan approve` | ❌ Not started |
| Learning Helix | Task template accumulation from successful decompositions | ❌ Not started |
| Git integration | Branch per task, commit per completion, PR on plan completion | ❌ Not started |

### Self-Sustaining Milestone Definition

**After Tier 3 is complete:**
- The system can run `SURVEY` on itself, detect gaps, decompose them into tasks, get human approval, and execute the fixes via DevAgent
- Handoff documents between sessions become unnecessary — the Architect pattern IS the handoff
- The system plans and executes Tier 4+ work itself (with human gates)
- Implementation prompts like `pipeline-supercharge-v1.md` are generated by the system, not written by hand

**This is the inflection point.** Everything before Tier 3 is building the machine. Everything after Tier 3 is the machine building itself.

---

## Tier 4: Remaining Patterns (Built BY Architect)

These patterns are fully designed but unbuilt. After Tier 3, the Architect pattern plans and executes their construction.

### Retrospective Pattern
**Trigger conditions:** ThresholdEvent accumulation, εR rigidity (exploration rate stuck), feedback effectiveness drops below 0.3
**Pipeline:** COLLECT → ANALYZE → SYNTHESIZE → RECOMMEND
**When to build:** After Architect has completed 10+ plans (needs enough execution history to analyze)

### Research Pattern
**Pipeline:** FRAME → INVESTIGATE → CRITIQUE → MAP → INTEGRATE
**Trigger:** Retrospective gap signals or human curiosity prompts
**When to build:** After Retrospective has identified knowledge gaps worth investigating

### Model Sentinel Pattern
**Function:** Auto-discovery of new models, probe-based health checking, automatic Agent node creation in Neo4j
**Why it matters:** Eliminates model registry drift permanently. No more stale `models.ts` — the Sentinel discovers, probes, and registers models on its own.
**When to build:** After the Architect proves stable on 5+ successful plans

---

## Tier 5: Validation & Network Effects

### Pattern Exchange Protocol (Attunement)
The "HTTP equivalent" for sharing patterns between Codex Signum instances. Enables organic network effects where increased usage drives evolution and improvement.

**Key design decisions (from `codex-signum-attunement-v0_2.md`):**
- Discovery via well-known endpoints
- Pattern manifests with health dimensions
- Trust bootstrapping through structural properties
- Amendment propagation across instances

### Hypothesis Testing
5 core hypotheses with >1000 data points each, pre-registered analysis plan:

| # | Hypothesis | Metric | Threshold |
|---|---|---|---|
| H1 | Constitutional evolution improves performance over time | Quality, cost, reliability | p < 0.05 on ≥2 of 4 metrics |
| H2 | Spectral metrics (λ₂) predict system stability | Correlation between λ₂ changes and instability events | Leading indicator by measurable interval |
| H3 | Context-blocked routing outperforms flat routing | Cost at equivalent quality, or quality at equivalent cost | Treatment beats control |
| H4 | Constitutional governance overhead scales sub-linearly | Decision latency vs agent count | Better than O(N²) |
| H5 | Dampening/hysteresis prevents cascade failures | Recovery time, propagation depth | 2x faster recovery, 50% depth reduction |

### Visualization Dashboard
Visual representation of graph state, health dimensions, routing decisions. Makes abstract concepts (constitutional evolution, harmonic resonance) tangible and observable.

---

## Critical Path Diagram

```
Pipeline Supercharge (35 tasks, ~1-2 weeks with Copilot)
  │
  ├── unlocks: 20+ models generating real Thompson data
  ├── unlocks: RTY + %C&A exposing hidden rework
  ├── unlocks: circuit breaker preventing cascade failures
  ├── unlocks: human feedback loop calibrating validator
  ├── unlocks: context-blocked posteriors for real learning
  │
  ▼
Tier 1: Wire remaining core exports (~days)
  │
  ├── unlocks: degradation cascade actually firing
  ├── unlocks: temporal stability tracking
  │
  ▼
Tier 2: ΦL/ΨH refinements (~2-3 weeks)
  │
  ├── unlocks: diagnostic-quality health signals
  ├── unlocks: ΨH becoming meaningful as patterns multiply
  │
  ▼
Tier 3: Architect pattern completion (~3-4 weeks)
  │
  └── ★ INFLECTION: system is self-sustaining
       │
       ├── Tier 4: Retrospective + Research + Sentinel
       │   (built BY Architect, with human gates)
       │
       └── Tier 5: Attunement + Validation + Dashboard
           (system plans these itself)
```

**Timeline estimate:** Pipeline Supercharge + Tiers 1-3 = 6-10 weeks of part-time work with AI assistance.

---

## Known Gaps & Design Decisions

### Answered Questions (decisions made)

| Question | Decision | Rationale |
|---|---|---|
| Where does hallucination detection live? | Adapter layer, not core | Core is substrate-agnostic. Hallucination patterns are DND-specific (Firestore SDK, wrong collections). |
| Are constitutional checks blocking or advisory? | Advisory → structural | Violations feed ΦL as negative observations. Repeated violations compound. "Dimmed, not blacklisted." |
| How does Thompson handle cold start with 20+ models? | Exploration floor (5% min) | Prevents premature convergence on local optimum while posteriors are wide. |
| Where is Thompson state stored? | Neo4j (graph-native) | JSON file violates "State Is Structural." Fresh start with uniform priors is desirable with new model roster. |
| How does the system handle provider outages? | Circuit breaker | CLOSED → OPEN (3 consecutive failures) → HALF_OPEN (5min cooldown probe) → CLOSED. Prevents cascade failures. |
| How is the quality gate calibrated? | Human feedback signal | CLI-based accept/reject → HumanFeedback nodes → validator precision/recall computation. |

### Open Questions (for Tier 2+)

| Question | Target Tier | Notes |
|---|---|---|
| What ΨH values indicate healthy vs pathological resonance? | Tier 2 | Need more pattern nodes before ΨH is meaningful |
| How should amendment stability periods be calibrated? | Tier 2 | Start with 7 days, adjust based on observed evolution dynamics |
| What's the right granularity for FDIS decomposition of ΨH? | Tier 2 | Depends on graph density — may be premature with <5 patterns |
| Can the Architect pattern self-improve its own DECOMPOSE stage? | Tier 3 | Learning Helix accumulates templates — needs 10+ plans to be useful |
| How does Attunement bootstrap trust between unknown instances? | Tier 5 | Initial design uses structural properties, may need cryptographic identity |

---

## Risk Register

### Active Risks

| Risk | Severity | Likelihood | Mitigation | Status |
|---|---|---|---|---|
| **Copilot reverts to Firestore patterns** | High | Medium | Architectural context injection in every session. Hard rule: Neo4j only. | Mitigated — context injection proven effective |
| **Thompson cold-start with 20+ models** | Medium | High | 5% exploration floor + context blocking | Addressed in Pipeline Supercharge Phase 4 |
| **Core dependency drift** | Medium | Medium | Contract tests, SHA pinning | Addressed in Pipeline Supercharge Phase 6 |
| **Provider outages poison arm stats** | High | High | Error classification + circuit breaker | Addressed in Pipeline Supercharge Phase 3 |
| **Orphaned Decision nodes skew ΦL** | Low | Certain | Reconciliation query, ABANDONED outcome | Addressed in Pipeline Supercharge Phase 5 |
| **No leading indicators** | Medium | Certain | Cost forecasting before routing | Addressed in Pipeline Supercharge Phase 4 |

### Residual Risks (Post-Supercharge)

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **ΨH degenerate indefinitely** | Low | Low | Grows naturally as Retrospective + Research patterns are built |
| **Architect pattern DECOMPOSE produces bad task graphs** | Medium | Medium | Human GATE stage, Learning Helix over time |
| **Neo4j performance at scale** | Medium | Low | Async writes, batch operations, proper indexing. Free tier sufficient for current scale. |
| **Framework too complex for practitioners** | Medium | Medium | Open source under AGPL v3. Focus on outcomes (better builds) not theory. |
| **Someone publishes similar work** | Low | Low | Unique integration thesis. Release early to establish priority. |

---

## Licensing & Strategic Context

**License:** AGPL v3 dual-licensing (open source + commercial)
**Domain:** codexsignum.com (owned)
**Target market gap:** Between governance frameworks (ISO 42001) and operational tooling. EU AI Act enforcement drives demand.

**Dual objectives:**
1. Establish clear IP ownership for potential consultancy commercialisation
2. Professional portfolio showcase demonstrating novel architectural thinking

**Strategic reframing (von Neumann probe):** The Codex is a forge that creates high-quality applications based on Codex principles and sends them into the world. Immediate value through better builds without requiring users to adopt the protocol. Organic return connections when people see quality and want to understand the process.

---

## Reference Documents

| Document | Purpose |
|---|---|
| `codex-signum-v3_0.md` | The specification (v3.0) |
| `codex-signum-v3_1-adaptive-imperative-boundaries.md` | Adaptive imperative boundaries extension |
| `codex-signum-engineering-bridge-v2_0.md` | Engineering constraints mapping theory → implementation |
| `pipeline-supercharge-v1.md` | Detailed implementation prompt for current sprint (35 tasks) |
| `codex-signum-implementation-README.md` | Build instructions for developers/agents |
| `codex-signum-context-transfer-2026-02-22.md` | Session continuity context |
| `codex-signum-audit-v3.md` | Comprehensive alignment audit |
| `codex-signum-opex-addendum-v2.md` | Operational Excellence synthesis |
| `thompson-router-architecture.md` | Thompson routing architecture (models as Agent nodes) |
| `codex-signum-research-index.md` | Research provenance and literature review index |
| `codex-signum-attunement-v0_2.md` | Pattern Exchange Protocol design |
| `copilot-pipeline-optimization.md` | Original pipeline optimization doc (superseded by pipeline-supercharge-v1.md) |

### Pattern Design Documents

| Document | Pattern | Status |
|---|---|---|
| `codex-signum-architect-pattern-design.md` | Architect (SURVEY→DECOMPOSE→...→ADAPT) | Design complete, SURVEY built |
| `codex-signum-research-pattern-design.md` | Research (FRAME→INVESTIGATE→...→INTEGRATE) | Design complete |
| `codex-signum-retrospective-pattern-design.md` | Retrospective (COLLECT→ANALYZE→...→RECOMMEND) | Design complete |
| `codex-signum-reference-patterns-design.md` | Reference patterns catalogue | Design complete |

---

## Appendix A: Confirmed Model Roster (February 2026)

### Anthropic (Direct API)
| ID | API String | Status |
|---|---|---|
| claude-opus-4-6 | `claude-opus-4-6` | Active — flagship |
| claude-sonnet-4-6 | `claude-sonnet-4-6` | Active |
| claude-opus-4-5 | `claude-opus-4-5-20251101` | Active |
| claude-sonnet-4-5 | `claude-sonnet-4-5-20250929` | Active |
| claude-haiku-4-5 | `claude-haiku-4-5-20251001` | Active — fast/cheap |
| claude-opus-4-1 | `claude-opus-4-1-20250620` | Active (legacy) |
| claude-opus-4 | `claude-opus-4-20250514` | Active (legacy) |
| claude-sonnet-4 | `claude-sonnet-4-20250514` | Active (legacy) |

### Google (Vertex AI)
| ID | API String | Status |
|---|---|---|
| gemini-3.1-pro | `gemini-3.1-pro-preview` | Active — newest |
| gemini-3-pro | `gemini-3-pro-preview` | Active |
| gemini-3-flash | `gemini-3-flash-preview` | Active |
| gemini-2.5-pro | `gemini-2.5-pro-preview-05-06` | Active |
| gemini-2.5-flash | `gemini-2.5-flash-preview-05-20` | Active — fast/cheap |
| gemini-2.0-flash-lite | `gemini-2.0-flash-lite-001` | Active — cheapest |

### Mistral (Vertex AI rawPredict)
| ID | API String | Status |
|---|---|---|
| mistral-medium-3 | `mistral-medium-3` | Active |
| codestral-2 | `codestral-2` | Active — code specialist |
| mistral-small | `mistral-small-2503` | Active — fast/cheap |

### Retired
`claude-3-haiku`, `claude-3-5-haiku`, `claude-3-7-sonnet`, `claude-3-opus`, `claude-3-5-sonnet`

---

## Appendix B: OpEx Concept Mapping

The Codex Signum operational excellence whitepaper maps 30 major concepts from Lean Six Sigma, Shingo Model, and Business Architecture:
- 16 direct translations
- 12 novel adaptations extending OpEx to pattern ecosystems
- 2 with no clear antecedent (Resonator morpheme harmonic analysis)
- Over 90% grounded in established operational excellence theory

Key implementations in the pipeline supercharge:

| OpEx Concept | Codex Implementation | Phase |
|---|---|---|
| Rolled Throughput Yield | `computeRTY()` — per-stage first-pass yield multiplication | Supercharge 4.1 |
| %Complete & Accurate | Per-stage correction iteration tracking | Supercharge 4.3 |
| Design of Experiments blocking | Context-blocked Thompson posteriors | Supercharge 4.4 |
| Poka-yoke (error prevention) | Capability pre-filtering before Thompson | Supercharge 4.5 |
| Jidoka (autonomation) | Circuit breaker — system detects own abnormality and stops | Supercharge 3.3 |
| Process capability (Cp/Cpk) | ΦL centering + spread decomposition | Tier 2-1 |
| Western Electric Rules | Pattern-based degradation detection | Tier 2-2 |
| FMEA | Fragility awareness in ΦL | Tier 2-5 |
| Value Stream Mapping | Pipeline stage flow with RTY visibility | Supercharge 4.1-4.3 |

---

## Appendix C: Lessons Learned

### Technical Lessons
1. **npm `prepare` script breaks GitHub dependency installs.** The core's `package.json` had `"prepare": "npm run build"` which rebuilt `dist/` from source during consumer app install, overwriting committed architect files. Root cause of a multi-day verification loop. Fix: remove prepare script, commit dist/.
2. **Copilot generates Firestore code by default.** Training data bias. Requires explicit architectural context injection in every session to prevent reversion.
3. **Two competing `mapToNativeModelId()` functions** arose independently in `hybridAgent.ts` and `smartRouter.ts`. Neither is wrong; they just diverged. Single source of truth enforcement needed.
4. **Thompson sampling with <30 observations per cell is noise.** The Mistral deprioritisation observed was sampling artifact, not genuine quality signal. Cold-start requires exploration floor protection.

### Architectural Lessons
1. **"State Is Structural" must be enforced, not aspirational.** JSON files for Thompson state violate the core principle and create drift between graph truth and operational state.
2. **Substrate-agnostic core means hallucination detection belongs in the adapter layer.** DND-specific patterns (Firestore SDK checks) are not core grammar.
3. **Advisory governance is observability sugar.** Constitutional violations that are logged but not structural have zero impact on system behavior. Feed them into ΦL.
4. **Well-designed patterns thrive under structural selective pressure.** Poorly-designed ones naturally degrade. Governance emerges from structure rather than prescription.

### Process Lessons
1. **The "test and learn" philosophy beats ideology.** Event-triggered reviews outperform periodic ceremonies.
2. **Spend more time improving how work gets done than thinking about new things to build.** Pipeline quality compounds; feature breadth doesn't.
3. **The von Neumann probe reframing unlocks adoption.** People don't need to adopt the protocol — they just need to see the quality of what it produces.

---

**End of Plan**