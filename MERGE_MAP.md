# MERGE MAP — Phase G-0 Reconnaissance

> **Generated**: 2026-02-24
> **Core Repo**: `@codex-signum/core` (Codex_signum) — branch: `main`
> **Consumer Repo**: DND-Manager — branch: `main` (primary), `phase-4/pipeline-supercharge` (working)
> **Purpose**: Map what exists in both repos for reconciliation

---

## Section 1: Component Inventory

### 1.1 Computation Layer

| Component | Core Location | DND Location | Source of Truth | What DND Adds | Merge Strategy |
|-----------|---------------|-------------|-----------------|---------------|----------------|
| **ΦL Computation** | `src/computation/phi-l.ts` | `agent/health/HealthComputer.ts` | Core (base) | Temporal stability ring buffer (20-value sliding window), `MAX_EXPECTED_VARIANCE` normalization, `ringBufferSnapshot` debugging output | **EXTEND_CORE** |
| **ΨH Computation** | `src/computation/psi-h.ts` | `agent/health/HarmonicResonance.ts` | Core (base) | EWMA trend tracking (α=0.15), `PsiHDecomposition` with `friction_transient` + `friction_durable`, 20-value history buffer, baseline stabilization (≥5 obs) | **EXTEND_CORE** |
| **εR Computation** | `src/computation/epsilon-r.ts` | `agent/health/ExplorationTracker.ts` | Core (complete) | Thin wrapper only — extracts `wasExploratory` from decisions, no new logic | **ALREADY_IN_CORE** |
| **Dampening** | `src/computation/dampening.ts` | — | Core | Nothing — not replicated in DND | **ALREADY_IN_CORE** |
| **Maturity** | `src/computation/maturity.ts` | — | Core | Nothing — not replicated in DND | **ALREADY_IN_CORE** |
| **Signal Conditioning (orchestrator)** | `src/computation/signal-conditioning.ts` | — | Core | Nothing — DND's `SignalPipeline` is a different concept (see Signals below) | **ALREADY_IN_CORE** |

### 1.2 Signal Processing Layer

| Component | Core Location | DND Location | Source of Truth | What DND Adds | Merge Strategy |
|-----------|---------------|-------------|-----------------|---------------|----------------|
| **7-Stage Signal Pipeline** | — | `agent/signals/SignalPipeline.ts` | DND (only copy) | Full 7-stage pipeline: Debounce → Hampel → EWMA → CUSUM → MACD → Hysteresis → Trend | **COPY_TO_CORE** |
| **Debounce** | — | `agent/signals/Debounce.ts` | DND | 100ms window, 3 persistence count | **COPY_TO_CORE** |
| **Hampel Filter** | — | `agent/signals/HampelFilter.ts` | DND | 7-window, k=3, MAD consistency factor | **COPY_TO_CORE** |
| **EWMA Smoother** | — | `agent/signals/EWMASmoother.ts` | DND | Topology-aware alphas (leaf=0.25, default=0.15, hub=0.08) | **COPY_TO_CORE** |
| **CUSUM Monitor** | — | `agent/signals/CUSUMMonitor.ts` | DND | h=5, k=0.5, FIR enabled | **COPY_TO_CORE** |
| **MACD Detector** | — | `agent/signals/MACDDetector.ts` | DND | fast=0.25, slow=0.04, bullish/bearish crossover | **COPY_TO_CORE** |
| **Hysteresis Gate** | — | `agent/signals/HysteresisGate.ts` | DND | Dual-threshold with Vpp noise estimation, 50-buffer | **COPY_TO_CORE** |
| **Trend Regression** | — | `agent/signals/TrendRegression.ts` | DND | Theil-Sen robust estimator, 40-window, 20-event horizon | **COPY_TO_CORE** |
| **Nelson Rules** | — | `agent/signals/NelsonRules.ts` | DND | Rules 1, 2, 7 (3σ outlier, 9-same-side, 15-within-1σ) | **COPY_TO_CORE** |
| **Signal Types** | — | `agent/signals/types.ts` | DND | `SignalEvent`, `ConditionedSignal`, `SignalAlert`, `StageConfig`, `DEFAULT_CONFIG` | **COPY_TO_CORE** |

### 1.3 Patterns Layer

| Component | Core Location | DND Location | Source of Truth | What DND Adds | Merge Strategy |
|-----------|---------------|-------------|-----------------|---------------|----------------|
| **Architect Types** | `src/patterns/architect/types.ts` | `agent/patterns/architect/types.ts` | **Both** — different type systems | DND has: `Task`, `TaskGraph`, `Phase`, `Dependency`, `ExecutionPlan`, `GateResponse`, `PlanState`. Core has: `SurveyInput`, `SurveyOutput`, `GapItem`, `BlindSpot` | **SPLIT** |
| **Survey** | `src/patterns/architect/survey.ts` | `agent/patterns/architect/survey.ts` | **Both** — different implementations | Core: spec-cross-reference, import detection, duplication analysis. DND: simpler filesystem + git + Neo4j query | **SPLIT** |
| **Decompose** | — | `agent/patterns/architect/decompose.ts` | DND | LLM-based task decomposition from intent + survey | **COPY_TO_CORE** |
| **Decompose Prompt** | — | `agent/patterns/architect/decompose-prompt.ts` | DND | Prompt template for decomposition | **COPY_TO_CORE** |
| **Classify** | — | `agent/patterns/architect/classify.ts` | DND | Keyword heuristic: mechanical vs generative | **COPY_TO_CORE** |
| **Sequence** | — | `agent/patterns/architect/sequence.ts` | DND | Kahn's topological sort + critical path | **COPY_TO_CORE** |
| **Gate** | — | `agent/patterns/architect/gate.ts` | DND | Human approval via readline | **COPY_TO_CORE** |
| **Dispatch** | — | `agent/patterns/architect/dispatch.ts` | DND | Task orchestration (currently stubbed) | **COPY_TO_CORE** |
| **Adapt** | — | `agent/patterns/architect/adapt.ts` | DND | Failure classification + replanning heuristics | **COPY_TO_CORE** |
| **Architect Orchestrator** | — | `agent/patterns/architect/architect.ts` | DND | 7-stage pipeline: Survey→Decompose→Classify→Sequence→Gate→Dispatch→Adapt | **COPY_TO_CORE** |
| **Architect LLM** | — | `agent/patterns/architect/llm.ts` | DND | Thompson-routed LLM call via DND executor | **SPLIT** |
| **DevAgent Pipeline** | `src/patterns/dev-agent/pipeline.ts` | — | Core | Full pipeline orchestration with correction helix | **ALREADY_IN_CORE** |
| **Observer** | `src/patterns/observer/observer.ts` | — | Core | Feedback at 3 scales (correction/learning/evolutionary) | **ALREADY_IN_CORE** |
| **Thompson Router** | `src/patterns/thompson-router/` | — | Core | Full Beta sampling + cost-adjusted routing | **ALREADY_IN_CORE** |

### 1.4 Infrastructure Layer

| Component | Core Location | DND Location | Source of Truth | What DND Adds | Merge Strategy |
|-----------|---------------|-------------|-----------------|---------------|----------------|
| **Neo4j Client** | `src/graph/client.ts` | `agent/graph/client.ts` | Core | DND has a local copy; unclear if identical or diverged | **ALREADY_IN_CORE** |
| **Graph Schema** | `src/graph/schema.ts` | — | Core | 52 Cypher statements, 13 constraints, 8+ indexes | **ALREADY_IN_CORE** |
| **Graph Queries** | `src/graph/queries.ts` | — | Core | 30+ CRUD functions for all entities | **ALREADY_IN_CORE** |
| **Constitutional Engine** | `src/constitutional/engine.ts` | — | Core | 10-axiom evaluation, rule evaluation, ADR creation | **ALREADY_IN_CORE** |
| **Memory Operations** | `src/memory/operations.ts` | — | Core | 4-stratum topology, EphemeralStore class | **ALREADY_IN_CORE** |
| **Bootstrap (Agent Seeding)** | `src/bootstrap.ts` | — | Core | 33 agent definitions, synthetic prior seeding | **ALREADY_IN_CORE** |
| **Circuit Breaker** | — | `agent/adapters/circuit-breaker.ts` | DND | Provider-level failure protection (3 failures → open, 5min cooldown) | **STAYS_IN_DND** |
| **Model Registry** | — | `agent/routing/models.ts` | DND | 24 active models with costs, thinking configs, stage pools | **STAYS_IN_DND** |
| **Codex Bridge** | — | `agent/codex-bridge.ts` | DND | Attunement layer: DND concrete types ↔ Core abstract types | **STAYS_IN_DND** |
| **Routing Bridge** | — | `agent/routing/codexBridge.ts` | DND | `routeTask()`, `routeAndExecute()`, `recordOutcome()` | **STAYS_IN_DND** |
| **Executor Adapter** | — | `agent/adapters/executor.ts` | DND | `createDndExecutor()` — maps core's ModelExecutor to native clients | **STAYS_IN_DND** |
| **Assessor Adapter** | — | `agent/adapters/assessor.ts` | DND | `createDndAssessor()` — heuristic quality scoring | **STAYS_IN_DND** |
| **Graph Feeder** | — | `agent/adapters/graph-feeder.ts` | DND | afterPipeline hook: ΦL/ΨH/εR → Neo4j, cascade wiring, signal conditioning | **STAYS_IN_DND** |
| **Hallucination Collector** | — | `agent/adapters/hallucination-collector.ts` | DND | 9 Firebase-specific hallucination patterns | **STAYS_IN_DND** |
| **Hygiene Scanner** | — | `agent/health/HygieneScanner.ts` | DND | 6-check Neo4j diagnostic scanner | **SPLIT** |
| **Provider Clients** | — | `agent/providers/*.ts` | DND | Anthropic, Gemini, Mistral, DeepSeek, Codestral native SDK wrappers | **STAYS_IN_DND** |
| **Metrics (RTY, %C&A)** | — | `agent/metrics/rty.ts` | DND | Rolled Throughput Yield, % Complete & Accurate | **COPY_TO_CORE** |
| **Metrics (Feedback Eff.)** | — | `agent/metrics/feedback-effectiveness.ts` | DND | Feedback effectiveness computation | **COPY_TO_CORE** |

---

## Section 2: Interface Boundaries

### 2.1 SPLIT: Architect Types (`types.ts`)

**Core defines:**
- `SurveyInput`, `SurveyOutput`, `GapItem`, `BlindSpot`, `SpecAssertion`
- `KNOWN_CORE_FUNCTIONS`, `SKIP_DIRS`, `CODE_EXTENSIONS`

**DND defines (additional):**
- `Task`, `TaskGraph`, `Phase`, `Dependency`, `ExecutionPlan`
- `GateResponse`, `TaskOutcome`, `PlanState`, `PlanQualityMetrics`
- `TaskType`, `EffortEstimate`, `ComplexityEstimate`, `GateDecision`, `AdaptationScope`, `PlanStatus`
- `MAX_ADAPTATIONS_PER_PLAN`, `MAX_TASKS_PER_PLAN`, `MANDATORY_HUMAN_GATE`

**Resolution:** Core should absorb DND's types for the full architect pipeline. Core's `SurveyOutput` is the survey-stage output; DND's types extend the pipeline to all 7 stages.

### 2.2 SPLIT: Survey (`survey.ts`)

**Core's version** (262 lines):
- Deep implementation with specification cross-referencing
- Parameter assertion extraction from spec documents
- Architectural requirement checking
- Import detection with `KNOWN_CORE_FUNCTIONS` matching
- Duplication detection against core exports
- Returns `SurveyOutput` with `codebaseState`, `graphState`, `gapAnalysis`, `confidence`, `blindSpots`

**DND's version** (simpler):
- Filesystem + git + Neo4j query
- Hardcoded key directories: `["agent", "services", "components", "types", "src"]`
- Returns `SurveyOutput` with `codebase_state`, `graph_state`, `gap_analysis`, `confidence`, `blind_spots`

**Resolution:** Core's survey is more sophisticated. DND's survey should either:
1. Call core's `survey()` with DND-specific config, OR
2. Be replaced entirely by core's version (DND adds nothing beyond key dir list)

**Interface boundary:** `SurveyInput` (already in core) — consumer passes `repoPath` and `specificationRefs`.

### 2.3 SPLIT: Architect LLM (`llm.ts`)

**Generic part (→ core):**
- `ArchitectLLMOptions`, `LLMCallResult` interfaces
- `createArchitectLLM(router, executor, options)` — generic factory

**DND-specific part (→ stays):**
- Imports from `../../adapters/executor.js` (createDndExecutor)
- Imports from `../../routing/models.js` (AVAILABLE_MODELS)
- Imports from `../../codex-bridge.js` (toRoutableModels)

**Interface boundary:**
```typescript
// Core defines:
interface LLMExecutor {
  (modelId: string, prompt: string, stage: string): Promise<{ output: string; durationMs: number; cost: number }>
}
// Consumer provides implementation via DI
```

### 2.4 SPLIT: Hygiene Scanner (`HygieneScanner.ts`)

**Generic part (→ core):**
- `HygieneIssue`, `HygieneScanResult` types
- Check pattern: name, severity, node identification
- Checks 1-3 (dormant seeds, stale observations, broken lines) are graph-generic

**DND-specific part (→ stays or adapts):**
- Checks 4-6 reference DND-specific graph patterns (containment leaks, resonance drift, orphan inflation)
- Hard import of `runQuery` from DND's graph client

**Interface boundary:**
```typescript
// Core defines:
interface HygieneCheck {
  name: string;
  run(queryFn: QueryRunner): Promise<HygieneIssue[]>;
}
// Consumer registers checks; core provides framework + common checks
```

---

## Section 3: Import Rewiring

Files in DND-Manager that import from local modules that will move to core:

### 3.1 Signals (all move to core)

| DND File | Current Import | Rewire To |
|----------|---------------|-----------|
| `agent/adapters/graph-feeder.ts` | `../signals/index.js` → `SignalPipeline` | `@codex-signum/core` |
| `agent/signals/index.ts` | `./SignalPipeline.js` + `./types.js` | Becomes core's barrel |

### 3.2 Health (HealthComputer + HarmonicResonance merge into core)

| DND File | Current Import | Rewire To |
|----------|---------------|-----------|
| `agent/adapters/graph-feeder.ts` | `../health/HealthComputer.js` → `computePhiLFromExecution` | `@codex-signum/core` (extended phi-l) |
| `agent/adapters/graph-feeder.ts` | `../health/HarmonicResonance.js` → `computePsiHFromGraph` | `@codex-signum/core` (extended psi-h) |
| `agent/adapters/graph-feeder.ts` | `../health/ExplorationTracker.js` → `computeEpsilonRFromDecisions` | Remove — use `computeEpsilonR` from core directly |
| `agent/health/index.ts` | `./HealthComputer.js`, `./HarmonicResonance.js`, `./ExplorationTracker.js` | Delete barrel — functions move to core |

### 3.3 Architect Pattern (generic stages move to core)

| DND File | Current Import | Rewire To |
|----------|---------------|-----------|
| `agent/patterns/architect/architect.ts` | `./survey.js`, `./decompose.js`, `./classify.js`, `./sequence.js`, `./gate.js`, `./dispatch.js`, `./adapt.js` | All become `@codex-signum/core` imports |
| `agent/patterns/architect/decompose.ts` | `./llm.js` → `createArchitectLLM` | Core provides generic; DND injects executor |
| `agent/patterns/architect/llm.ts` | `../../adapters/executor.js`, `../../routing/models.js`, `../../codex-bridge.js` | Stays in DND as DI adapter |
| `agent/scripts/architect.ts` | `../patterns/architect/architect.js` → `executePlan` | `@codex-signum/core` |

### 3.4 Metrics (move to core)

| DND File | Current Import | Rewire To |
|----------|---------------|-----------|
| `agent/adapters/graph-feeder.ts` | `../metrics/rty.js` → `computeRTY`, `computePercentCA`, `stageResultsToAttempts` | `@codex-signum/core` |
| `agent/adapters/graph-feeder.ts` | `../metrics/feedback-effectiveness.js` → `computeFeedbackEffectiveness` | `@codex-signum/core` |

---

## Section 4: Not Built Anywhere

Components required by v3.0 spec / Engineering Bridge that exist in **neither** repo:

| Component | Spec Reference | Status | Notes |
|-----------|---------------|--------|-------|
| **Hierarchical Health Aggregation** | v3.0 §Scale Integration | NOT BUILT | ΦL aggregation across Scale 1 (morpheme) → Scale 2 (pattern) → Scale 3 (ecosystem). Currently flat — each pattern has its own ΦL but no roll-up. |
| **Event-Triggered Structural Review** | Engineering Bridge §Part 4 | NOT BUILT | 6 triggers (new pattern, degradation, cascade, threshold crossing, constitutional violation, maturity transition) → 5 diagnostics (impact analysis, dependency check, constitutional review, optimization scan, recommendation generation). HygieneScanner covers ~2 of 5 diagnostics. |
| **Maturity-Indexed Adaptive Thresholds** | v3.0 §Maturity Index | PARTIALLY BUILT | Core has `MATURITY_THRESHOLDS` constant with per-classification values. But no dynamic threshold adjustment — thresholds are static per maturity class, not continuously adapted. |
| **Memory Strata Operations (full)** | v3.0 §Memory Topology | PARTIALLY BUILT | Core has `EphemeralStore`, `createObservation`, `distillObservations`, `createInstitutionalKnowledge`. Missing: **compaction** (Stratum 2 pruning), **strata migration scheduling**, **institutional reinforcement/decay**. |
| **Constitutional Evolution Mechanism** | v3.0 §Constitutional Layer | NOT BUILT | Rules exist as Neo4j nodes with status tracking. Missing: **amendment proposal**, **experimentation period**, **evaluation**, **ratification/revert cycle**. `AmendmentStatus` type exists but no workflow. |
| **Cross-Scale Feedback Wiring** | v3.0 §Feedback Loops | NOT BUILT | Scale 1→2→3 upward feedback + downward pressure. Currently: Observer generates recommendations but no automated execution. Feedback is logged, not actuated. |
| **Calibration Meta-Process** | Engineering Bridge §Part 5 | NOT BUILT | Periodic recalibration of ΦL weights, εR thresholds, dampening constants based on accumulated institutional knowledge. No auto-tuning exists. |
| **Spectral Calibration for εR** | v3.0 §εR | NOT BUILT | Core has `computeEpsilonRFloor` with imperative gradient modulation. But spectral analysis (frequency-domain εR calibration) is absent. |

---

## Section 5: Dead Code

Files in DND-Manager that appear unused, superseded, or archived:

| File | Status | Reason |
|------|--------|--------|
| `agent/health/ExplorationTracker.ts` | **SUPERSEDED** | Thin wrapper around `computeEpsilonR` from core. Graph-feeder can call core directly. No unique logic. |
| `agent/health/index.ts` | **WILL BECOME MINIMAL** | After HealthComputer and HarmonicResonance logic moves to core, only HygieneScanner remains. Barrel becomes trivial. |
| `agent/graph/client.ts` | **POTENTIAL DUPLICATE** | DND has its own graph client. Core also has `src/graph/client.ts`. Need to verify if DND's is a fork or just re-exports core's. If duplicate, delete DND's. |
| `agent/graph/Tracer.ts` | **UNKNOWN** | Not referenced in any catalogue above. May be legacy LangSmith tracing code from pre-native-SDK era. Needs verification. |
| `_tmp_mistral.mjs` | **DEAD** | Temporary file in DND root (untracked). Safe to delete. |
| `build-phase1.log`, `build-report.log`, `test-report.log` | **DEAD** | Untracked log files in Codex_signum root. Safe to delete. |

---

## Section 6: Risk Assessment

### EXTEND_CORE (merge DND additions into core)

| Component | Risk | Notes |
|-----------|------|-------|
| **ΦL temporal stability** (HealthComputer → phi-l.ts) | **MEDIUM** | Requires adding ring buffer state management to core's currently-stateless phi-l.ts. Core's `computePhiL` is pure; DND adds module-level `Map<string, number[]>` state. Design decision: make stateful wrapper or add optional state parameter. |
| **ΨH decomposition** (HarmonicResonance → psi-h.ts) | **MEDIUM** | Same pattern: adds 3 module-level Maps for trend/baseline/history. Core's `computePsiH` is pure. Need to decide: separate `PsiHTracker` class vs optional decomposition parameter. |

### COPY_TO_CORE (wholesale move)

| Component | Risk | Notes |
|-----------|------|-------|
| **Signal Pipeline** (all 10 files) | **LOW** | Zero DND-specific imports. Pure signal processing. Copy as-is to `src/signals/` or `src/computation/signals/`. Only risk: choosing the right barrel export structure. |
| **Architect stages** (8 generic files) | **LOW** | No DND imports except `llm.ts`. Copy classify, sequence, gate, adapt, dispatch, architect, decompose, decompose-prompt as-is. |
| **Metrics** (rty.ts, feedback-effectiveness.ts) | **LOW** | Need to verify imports are clean. Likely pure computation. |

### SPLIT (extract generic, keep DND-specific)

| Component | Risk | Notes |
|-----------|------|-------|
| **Architect types.ts** | **LOW** | Core absorbs DND's additional types. No breaking changes — additive only. |
| **Architect survey.ts** | **MEDIUM** | Core already has a more sophisticated version. Need to reconcile two `SurveyOutput` shapes (core uses camelCase, DND uses snake_case). Breaking change potential. |
| **Architect llm.ts** | **MEDIUM** | Requires defining `LLMExecutor` interface in core. DND keeps concrete implementation. Moderate refactoring. |
| **Hygiene Scanner** | **MEDIUM** | Need to define `HygieneCheck` interface. Some checks are graph-generic, others reference DND-specific patterns. |

### STAYS_IN_DND

| Component | Risk | Notes |
|-----------|------|-------|
| Circuit Breaker, Model Registry, Codex Bridge, Provider Clients, Graph Feeder, etc. | **N/A** | No merge needed. These are correctly consumer-specific. |

---

## Appendix A: Core Export Surface (`src/index.ts`)

Core currently exports **200+ items** across 6 modules:

- **Types** (80+): All morpheme, state-dimension, constitutional, memory types
- **Computation** (20+): `computePhiL`, `computePsiH`, `computeEpsilonR`, `computeDampening`, `propagateDegradation`, `computeNetworkState`, etc.
- **Graph** (33): Client, schema, 30+ query functions, 8 entity types
- **Memory** (9): `EphemeralStore` class, 8 operation functions
- **Constitutional** (7): `evaluateConstitution`, `evaluateAxioms`, `evaluateRules`, `createADR`, etc.
- **Patterns** (20+): `DevAgent`, `Observer`, `survey`, `route`, `selectModel`, `sampleBeta`, etc.
- **Bootstrap** (3): `ALL_ARMS`, `bootstrapAgents`, `seedInformedPriors`

## Appendix B: DND-Manager Agent Directory Structure

```
agent/
├── adapters/
│   ├── assessor.ts          ← QualityAssessor implementation
│   ├── circuit-breaker.ts   ← Provider-level circuit breaker
│   ├── executor.ts          ← ModelExecutor implementation
│   ├── graph-feeder.ts      ← afterPipeline hook (ΦL/ΨH/εR → Neo4j)
│   └── hallucination-collector.ts ← Firebase hallucination patterns
├── codex-bridge.ts          ← Main attunement layer to core
├── core/
│   ├── index.ts             ← Local pipeline types barrel
│   ├── PipelineConfig.ts    ← Stage timeouts, backoff config
│   └── types.ts             ← StageResult, PipelineResult, etc.
├── evaluation/
│   ├── ComplexityClassifier.ts
│   ├── ConfidenceSignal.ts
│   ├── OutputValidator.ts   ← Hallucination pattern detection
│   └── index.ts
├── graph/
│   ├── client.ts            ← Local Neo4j client (possibly duplicate of core)
│   ├── index.ts
│   └── Tracer.ts            ← Possibly dead (LangSmith legacy?)
├── health/
│   ├── ExplorationTracker.ts ← SUPERSEDED (thin core wrapper)
│   ├── HarmonicResonance.ts  ← EXTEND_CORE target
│   ├── HealthComputer.ts     ← EXTEND_CORE target
│   ├── HygieneScanner.ts     ← SPLIT target
│   └── index.ts
├── metrics/
│   ├── feedback-effectiveness.ts ← COPY_TO_CORE target
│   └── rty.ts                    ← COPY_TO_CORE target
├── patterns/
│   └── architect/
│       ├── adapt.ts          ← COPY_TO_CORE
│       ├── architect.ts      ← COPY_TO_CORE
│       ├── classify.ts       ← COPY_TO_CORE
│       ├── decompose.ts      ← COPY_TO_CORE
│       ├── decompose-prompt.ts ← COPY_TO_CORE
│       ├── dispatch.ts       ← COPY_TO_CORE
│       ├── gate.ts           ← COPY_TO_CORE
│       ├── llm.ts            ← SPLIT (DND-SPECIFIC)
│       ├── sequence.ts       ← COPY_TO_CORE
│       ├── survey.ts         ← SPLIT (core has own version)
│       └── types.ts          ← SPLIT (core absorbs additions)
├── providers/
│   ├── anthropic.ts          ← STAYS_IN_DND
│   ├── codestral.ts          ← STAYS_IN_DND
│   ├── deepseek.ts           ← STAYS_IN_DND
│   ├── gemini.ts             ← STAYS_IN_DND
│   ├── index.ts              ← STAYS_IN_DND
│   ├── mistral.ts            ← STAYS_IN_DND
│   ├── mistralAgent.ts       ← STAYS_IN_DND
│   └── registry.ts           ← STAYS_IN_DND
├── routing/
│   ├── codexBridge.ts        ← STAYS_IN_DND
│   ├── index.ts              ← STAYS_IN_DND
│   └── models.ts             ← STAYS_IN_DND (deployment-specific)
├── scripts/
│   ├── architect.ts          ← Rewire import after merge
│   ├── codexStats.ts
│   ├── feedback.ts
│   └── reconcileOrphans.ts
└── signals/
    ├── CUSUMMonitor.ts       ← COPY_TO_CORE
    ├── Debounce.ts           ← COPY_TO_CORE
    ├── EWMASmoother.ts       ← COPY_TO_CORE
    ├── HampelFilter.ts       ← COPY_TO_CORE
    ├── HysteresisGate.ts     ← COPY_TO_CORE
    ├── MACDDetector.ts       ← COPY_TO_CORE
    ├── NelsonRules.ts        ← COPY_TO_CORE
    ├── SignalPipeline.ts     ← COPY_TO_CORE
    ├── TrendRegression.ts    ← COPY_TO_CORE
    ├── index.ts              ← COPY_TO_CORE
    └── types.ts              ← COPY_TO_CORE
```

## Appendix C: Core Test Coverage

| Test File | Coverage |
|-----------|---------|
| `tests/conformance/state-dimensions.test.ts` | ΦL, ΨH, εR, maturity computations |
| `tests/conformance/patterns.test.ts` | Thompson router, DevAgent presets, Observer feedback |
| `tests/conformance/constitutional-engine.test.ts` | Axiom evaluation, rule evaluation |
| `tests/conformance/memory-operations.test.ts` | EphemeralStore, observations, distillation, promotion |
| `tests/conformance/bootstrap.test.ts` | Agent seeding, informed priors |
| `tests/conformance/select-model.test.ts` | Model selection integration |
| `tests/conformance/type-conformance.test.ts` | Type structure verification |
| `tests/architect/survey-validation.ts` | Survey function validation |

## Appendix D: Key Constants Comparison

| Constant | Core Value | DND Value | Match? |
|----------|-----------|-----------|--------|
| CASCADE_LIMIT | 2 | 2 (uses core) | ✅ |
| HYSTERESIS_RATIO | 2.5 | 2.5 (uses core) | ✅ |
| ΦL weights (axiom/prov/usage/stability) | 0.4/0.2/0.2/0.2 | 0.4/0.2/0.2/0.2 (uses core) | ✅ |
| ΨH weights (structural/runtime) | 0.4/0.6 | 0.4/0.6 (uses core) | ✅ |
| εR floor | 0.01 | 0.01 (uses core) | ✅ |
| EWMA α (ΨH trend) | — | 0.15 (DND only) | N/A |
| Ring buffer size (ΦL history) | — | 20 (DND only) | N/A |
| Signal pipeline stages | — | 7 (DND only) | N/A |
| Nelson Rules implemented | — | 1, 2, 7 (DND only) | N/A |

---

*This is reconnaissance. Reality documented, not assumptions. Stop here.*
