# Codex Signum — Core Library

## For Claude Code (and any coding agent)

This is the core library for the Codex Signum protocol — a semantic encoding where **state is structural**. Consumer applications (like DND-Manager) import from this package. This repo is the single source of truth for all grammar-level infrastructure.

---

## Architecture

```
src/
├── computation/           # State dimension calculators
│   ├── phi-l.ts           # ΦL — health score (4-factor: axiom_compliance, provenance, success_rate, temporal_stability)
│   ├── psi-h.ts           # ΨH — harmonic signature (λ₂ structural coherence + TV_G runtime friction)
│   ├── epsilon-r.ts       # εR — exploration rate with imperative gradient + spectral calibration
│   ├── dampening.ts       # Topology-aware cascade dampening: γ_effective = min(0.7, 0.8/(k-1))
│   ├── maturity.ts        # Network maturity index (4 normalized factors, each weighted 0.25)
│   ├── aggregation.ts     # Hierarchical health aggregation (node → pattern → bloom → system)
│   ├── hierarchical-health.ts  # Recursive bottom-up health walk
│   ├── adaptive-thresholds.ts  # Maturity-indexed thresholds (Young/Maturing/Mature bands)
│   ├── structural-review.ts    # 5 diagnostic computations (global λ₂, spectral gap, hub dependency, friction, dampening)
│   ├── structural-triggers.ts  # 6 event triggers for structural review
│   ├── immune-response.ts      # Wire triggers → review (event-driven, not scheduled)
│   ├── signals/           # 7-stage signal conditioning pipeline
│   │   ├── SignalPipeline.ts   # Orchestrator
│   │   ├── Debounce.ts         # Stage 1: 100ms, 2-3 event persistence
│   │   ├── HampelFilter.ts     # Stage 2: 7-point window, k=3
│   │   ├── EWMASmoother.ts     # Stage 3: α=0.25 leaves, 0.15 default, 0.08 hubs
│   │   ├── CUSUMMonitor.ts     # Stage 4: h ≈ 4-5
│   │   ├── MACDDetector.ts     # Stage 5: fast α=0.25, slow α=0.04
│   │   ├── HysteresisGate.ts   # Stage 6: band ≥ 2× V_pp
│   │   ├── TrendRegression.ts  # Stage 7: Theil-Sen, 30-50 events
│   │   ├── NelsonRules.ts      # Rules 1, 2, 7
│   │   ├── types.ts
│   │   └── index.ts
│   └── metrics/           # OpEx metrics (RTY, feedback effectiveness)
│
├── patterns/              # Reference patterns
│   ├── architect/         # 7-stage planning pipeline (SURVEY→DECOMPOSE→CLASSIFY→SEQUENCE→GATE→DISPATCH→ADAPT)
│   │   ├── types.ts       # Full pipeline types + ModelExecutor + TaskExecutor interfaces
│   │   ├── survey.ts      # SURVEY (35KB, spec cross-reference, pure filesystem)
│   │   ├── decompose.ts   # DECOMPOSE (LLM via ModelExecutor interface)
│   │   ├── decompose-prompt.ts # Prompt builder for DECOMPOSE
│   │   ├── parallel-decompose.ts  # Best-of-N decompose + scorePlan() (Self-MoA, log(N) quality)
│   │   ├── classify.ts    # CLASSIFY (mechanical vs generative, pure computation)
│   │   ├── sequence.ts    # SEQUENCE (topological sort + critical path)
│   │   ├── gate.ts        # GATE (human approval — mandatory in V1)
│   │   ├── dispatch.ts    # DISPATCH (calls TaskExecutor per task)
│   │   ├── adapt.ts       # ADAPT (failure classification + replanning)
│   │   ├── architect.ts   # executePlan() orchestrator (supports Best-of-N via ArchitectConfig)
│   │   ├── reasoning-tiers.ts     # selectReasoningTier() — RTR framework (deep/moderate/light)
│   │   ├── mock-model-executor.ts # Generic mock ModelExecutor for testing
│   │   ├── mock-task-executor.ts  # Generic mock TaskExecutor for testing
│   │   ├── RULES.md       # Architect constitutional rules
│   │   └── index.ts
│   ├── dev-agent/         # SCOPE → EXECUTE → REVIEW → VALIDATE pipeline
│   │   ├── types.ts       # AgentTask, PipelineResult, DevAgentModelExecutor
│   │   ├── pipeline.ts    # Pipeline with lifecycle hooks (afterStage, afterPipeline)
│   │   └── index.ts
│   ├── thompson-router/   # Thompson sampling model selection
│   └── observer/          # Validation & testing (may be stub)
│
├── resilience/            # Circuit breaker, retry logic
│   └── circuit-breaker.ts # MUST use: exponential backoff + full jitter + 5-10 half-open probes
│
├── constitutional/        # Governance layer
│   ├── rule-engine.ts     # Constitutional rule evaluation
│   ├── evolution.ts       # Amendment mechanism (may be stub — Tier 1/2/3 taxonomy)
│   └── cascade-prevention.ts  # propagateDegradation() with topology-aware dampening
│
├── memory/                # Four-stratum memory operations
│   ├── compaction.ts      # Stratum 2: continuous exponential decay, weight = e^(-λ × age)
│   ├── distillation.ts    # Stratum 3: performance profiles, routing hints, threshold calibration
│   └── flow-coordinator.ts # Upward compression + downward enrichment
│
├── graph/                 # Neo4j connection, schema, queries
│   ├── client.ts
│   ├── schema.ts
│   └── queries.ts
│
├── types/                 # Core type definitions
│   ├── morphemes.ts       # Seed, Line, Bloom, Resonator, Grid, Helix
│   ├── state-dimensions.ts # ΦL, ΨH, εR composite types
│   ├── constitutional.ts  # Rule types, amendment taxonomy
│   └── memory.ts          # Four-stratum memory types
│
└── index.ts               # Barrel export — EVERYTHING public goes through here

tests/                     # All tests
dist/                      # Compiled output — COMMITTED to repo
```

---

## Non-Negotiable Rules

### 1. This is a LIBRARY, not an application

Core is substrate-agnostic. It does NOT know about:
- DND-Manager, D&D, character sheets
- Specific LLM providers (Anthropic, OpenAI, Mistral, Google)
- Specific databases beyond abstract graph interfaces
- Any consumer application's business logic

If you find yourself importing from a consumer app — **STOP. You are going the wrong direction.**

### 2. dist/ is committed. There is NO prepare script.

```bash
npm run build       # Compiles to dist/
git add dist/       # ALWAYS commit dist/ after building
git commit          # Consumers install from GitHub and use committed dist/
```

**DO NOT** add a `prepare` script to package.json. npm runs `prepare` automatically when a consumer installs a GitHub dependency, which would rebuild dist/ from source during install and overwrite the committed files. This bug cost hours to diagnose. See commit `4cd0ecc`.

### 3. State Is Structural — No Monitoring Overlays

The graph is the single source of truth. Do NOT create:
- Separate health databases or JSON caches
- SQLite tables for monitoring data
- Log files as state stores
- Any parallel state outside the graph

**DO NOT PROPOSE** any of the following — these are recurring LLM paradigm violations that directly contradict "state is structural":
- Observation pipelines or monitoring overlays (Prometheus, Grafana, DataDog patterns)
- Dashboard wrapper functions that read from the graph and present via a separate layer
- Computed views or aggregation functions that sit between the graph and consumers
- "codexStats" grammar sections or health snapshot utilities
- Any system where you query the graph, transform the result, and store/present it separately

The graph IS the monitoring infrastructure. Observations flow through execution, not through a separate instrumentation layer. If you need to know system state, write a Cypher query. If the Cypher query is complex, it's still a Cypher query — not a wrapper function.

### 4. ΦL Is ALWAYS a Composite

ΦL is never `health: number`. It is always a structured object with raw factors, weights, maturity_factor, and effective score. If you see a bare number being passed as health, it's wrong.

### 5. Dampening Is NEVER Fixed

`γ = 0.7` everywhere is WRONG. Always compute from topology:
```
γ_effective = min(0.7, 0.8 / (k - 1))    for k > 1
```
Hub dampening uses `γ_base / √k` (NOT `γ_base / degree`).

### 6. Hysteresis = 2.5×

Recovery is 2.5× slower than degradation. Not 1.5×. This was corrected by research validation.

### 7. Cascade Limit = 2

Degradation propagates at most 2 containment levels. This is the primary safety mechanism. Never increase without a foundational amendment.

### 8. Signal Pipeline Is Complete — Don't Modify

The 7-stage signal conditioning pipeline in `src/computation/signals/` was built across 15 carefully audited commits, verified against Engineering Bridge §Part 4. Do not modify it unless fixing a specific documented bug.

### 9. .js Extensions on ALL Relative Imports

Every relative import MUST use `.js` extension:
```typescript
// CORRECT
import { computePhiL } from "./phi-l.js";

// WRONG — will fail at runtime
import { computePhiL } from "./phi-l";
```

### 10. Commit + Push After Every Task

Every discrete task produces a commit with a descriptive message and pushes to remote. Never accumulate uncommitted work across tasks.

### 11. Substrate-Agnostic Logic Belongs in Core

If a function uses only core types (`TaskGraph`, `PipelineSurveyOutput`, `ModelExecutor`, etc.) and any consumer would benefit from it, it belongs here — not in a consumer repo. The test: does the function import anything from outside `@codex-signum/core`? If no, it's core infrastructure.

This rule exists because the most expensive architectural mistake in the project's history was placing `parallelDecompose()` and `scorePlan()` in DND-Manager instead of core. The correction required a two-repo, two-session refactor. When in doubt, put it in core.

Conversely, if a function constructs provider-specific clients (Thompson router instances, native SDK wrappers), checks consumer-specific state (git remotes, working directories), or uses consumer-specific types — it stays in the consumer.

---

## Architect Pattern — executePlan() Configuration

The `executePlan()` orchestrator accepts an `ArchitectConfig` with these options:

```typescript
interface ArchitectConfig {
  modelExecutor: ModelExecutor;     // Consumer provides: how to call LLMs
  taskExecutor: TaskExecutor;       // Consumer provides: how to execute tasks
  autoGate?: boolean;               // Skip human approval (default: false)
  decomposeAttempts?: number;       // Best-of-N decompose attempts (default: 1)
  parallelDecompose?: boolean;      // Run attempts concurrently (default: false)
  dryRun?: boolean;                 // Tasks execute but make no real changes (default: false)
}
```

When `decomposeAttempts > 1`, core runs decompose N times, scores each plan on confidence, task count reasonableness, gap coverage, and internal consistency, then selects the best. Research basis: Best-of-N gives log(N) quality improvement; Self-MoA shows same strong model N times outperforms mixing different models.

Consumers call `executePlan(intent, repoPath, config, surveyOutput?)` — core owns the full orchestration loop (SURVEY → DECOMPOSE → CLASSIFY → SEQUENCE → GATE → DISPATCH → ADAPT). Consumers should **never re-implement the stage sequence** — inject behavior through executors and config, not by calling individual stages.

---

## Specification References

When in doubt about how something should be computed:

| Question | Reference |
|---|---|
| What are the morphemes, axioms, grammar rules? | `codex-signum-v3_0.md` |
| How to compute ΦL, ΨH, εR? | Engineering Bridge v2.0 §Part 2 |
| Dampening, cascade, hysteresis parameters? | Engineering Bridge v2.0 §Part 3 |
| Signal conditioning pipeline? | Engineering Bridge v2.0 §Part 4 |
| Visual encoding safety? | Engineering Bridge v2.0 §Part 5 |
| CAS vulnerability watchpoints? | Engineering Bridge v2.0 §Part 6 |
| Memory sizing? | Engineering Bridge v2.0 §Part 7 |
| Structural review triggers + diagnostics? | Engineering Bridge v2.0 §Part 8 |
| Adversarial resilience? | Engineering Bridge v2.0 §Part 9 |
| RTY, error classification, failure modes? | Engineering Bridge v2.0 §Part 10 |
| Architect pattern design? | `codex-signum-architect-pattern-design.md` |

**The Engineering Bridge is the implementation authority.** If you need to know *what* to build, read the Bridge. If you need to know *why*, read the Codex v3.0.

---

## Key Parameters (from Engineering Bridge)

### ΦL Weights
```
axiom_compliance:    0.4
provenance_clarity:  0.2
usage_success_rate:  0.2
temporal_stability:  0.2
```

### ΨH Composite
```
ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)
```

### εR Spectral Calibration
| Spectral Ratio | Minimum εR |
|---|---|
| > 0.9 | 0.05 |
| 0.7–0.9 | 0.02 |
| 0.5–0.7 | 0.01 |
| < 0.5 | 0.0 |

### Adaptive Thresholds (Maturity-Indexed)
| Threshold | Young (MI < 0.3) | Maturing (0.3–0.7) | Mature (MI > 0.7) |
|---|---|---|---|
| ΦL healthy | > 0.6 | > 0.7 | > 0.8 |
| ΦL degraded | < 0.4 | < 0.5 | < 0.6 |
| εR stable range | 0.10–0.40 | 0.05–0.30 | 0.01–0.15 |
| ΨH dissonance | > 0.25 | > 0.20 | > 0.15 |

### Circuit Breaker
```
cooldown = random(0, min(base × 1.5^tripCount, 300_000ms))   # Full jitter
halfOpenProbes = 5-10                                          # Successes to close
```

### Recovery Model
```
recovery_delay = base_delay × (1 + 0.2 × failure_count)
capped at: 10 × base_delay
```

### Algedonic Bypass
```
if (ΦL < 0.1) → γ = 1.0   # Emergency escalation, bypass all dampening
```

---

## Files That DO NOT EXIST — Never Reference These

- ~~`src/health/`~~ → Health computation is in `src/computation/`
- ~~`src/agent/`~~ → There is no agent directory, patterns are in `src/patterns/`
- ~~`src/config/`~~ → No config directory
- ~~`src/utils/firebase.ts`~~ → Firebase does not exist in this project
- ~~`src/monitoring/`~~ → Monitoring is structural, not separate
- ~~`src/services/`~~ → No services directory
- ~~`core/` at repo root~~ → Source is in `src/`, not `core/`

If you need to find where something lives:
```bash
find src -name "*.ts" -type f | sort
grep -rn "export.*functionName" src/ --include="*.ts"
```

---

## Build & Verification

```bash
# Type check (run after every edit)
npx tsc --noEmit

# Run tests
npm test

# Build (ALWAYS do before committing)
npm run build

# Commit dist (ALWAYS after build)
git add dist/
git commit -m "build: description"

# Verify barrel exports
node -e "const c = require('./dist'); console.log(Object.keys(c).length, 'exports')"
```

---

## What NOT to Change

- **Morphemes, axioms, grammar rules** — these are immutable (v3.0 §Semantic Stability)
- **Signal conditioning pipeline** — 15 audited commits, verified against spec
- **Graph schema** — stable, extend only if adding new node types
- **Existing test expectations** — unless a fix changes behavior to match spec
- **package.json `prepare` script** — DO NOT ADD ONE (see rule #2)

---

## Test Governance

### Test Levels

| Level | Name | Scope | Location |
| --- | --- | --- | --- |
| 1 | Unit | Single function, deterministic, pure computation | `tests/conformance/` |
| 2 | Contract | Module API shape, type safety, export completeness | `tests/conformance/` |
| 3 | Pipeline | Multi-stage sequential flow, data propagation | `tests/pipeline/` |
| 4 | Outcome | End-to-end behavioral correctness with realistic inputs | `tests/conformance/` |
| 5 | Safety | Invariants that must never be violated, spec-encoded | `tests/safety/` |

Level 5 tests encode what the **spec requires**, not what the code currently does. If the implementation is wrong, safety tests FAIL — this is correct behavior. Tests-before-fix is the right order.

### Safety Invariants (Level 5)

| Invariant | Test File | Spec Source |
| --- | --- | --- |
| Subcriticality: γ_effective ≤ 0.7 for all degree ≥ 1 | `tests/safety/subcriticality.test.ts` | Engineering Bridge §Part 3 |
| Cascade limit: propagation stops at depth 2 | `tests/safety/cascade-limit.test.ts` | Engineering Bridge §Part 3 |
| Hysteresis: recovery rate = degradation rate / 2.5 | `tests/safety/hysteresis.test.ts` | Engineering Bridge §Part 3 |
| Algedonic bypass: ΦL < 0.1 forces γ = 1.0 | `tests/safety/algedonic-bypass.test.ts` | Engineering Bridge §Part 3 |

### Codex Conformance Coverage

Conformance tests (`tests/conformance/`) must cover these Codex dimensions:

- **State dimensions**: ΦL composite structure (never bare number), ΨH relational computation, εR spectral calibration
- **Morphemes**: Seed, Line, Bloom, Resonator, Grid, Helix — type shape and axiom compliance
- **Adaptive thresholds**: Young/Maturing/Mature bands with smooth interpolation
- **Signal pipeline**: All 7 stages spec-compliant (Debounce → Hampel → EWMA → CUSUM → MACD → Hysteresis → Trend)
- **Memory operations**: Exponential decay compaction (not fixed window), distillation, flow
- **Constitutional engine**: Rule evaluation, cascade prevention, amendment taxonomy
- **Resilience**: Circuit breaker with exponential backoff + jitter (not fixed cooldown)
- **Patterns**: Architect 7-stage pipeline, dev-agent pipeline, Thompson router

### Data Provenance Rule

All numbers cited in documentation, comments, code, or reports MUST:

- Cite their source (spec section, test output, or system measurement)
- Be marked `[estimated]` if produced by approximation rather than system output
- Never be presented as system output if they were estimated by inspection

### Pipeline Test Coverage Gate

The pre-commit gate warns (not blocks) if `src/signals/` was modified but `tests/pipeline/` has no `*.test.ts` files.

---

## Anti-Patterns This Repo Has Encountered

These are real bugs that have occurred in past sessions. Hooks exist to catch them.

| Anti-Pattern | What Went Wrong | Prevention |
|---|---|---|
| Fixed dampening γ=0.7 | Supercritical for branching factor ≥ 2 | Always compute γ_effective from topology |
| Fixed circuit breaker cooldown | Spec requires exponential backoff + jitter | Use `computeCooldown(tripCount, config)` |
| ModelExecutor name collision | Both dev-agent and architect exported same name | dev-agent uses `DevAgentModelExecutor` |
| `prepare` script in package.json | Rebuilt dist/ during consumer `npm install` | Removed in `4cd0ecc`, never re-add |
| Averaging children's ΨH | ΨH is relational — compute from subgraph λ₂ | `aggregateHealth` computes ΨH from graph |
| Static retention window for compaction | Spec uses continuous exponential decay | `weight = e^(-λ × age)`, not fixed window |
| Hysteresis ratio 1.5× | Below Schmitt trigger engineering standards | Corrected to 2.5× per research validation |
| Bare `number` as health score | ΦL must always be composite structure | Use `PhiLOutput` type, never bare number |
| Consumer re-implements core orchestration | DND called classify/sequence/gate/dispatch/adapt individually instead of `executePlan()` | Consumers call `executePlan()` with config — inject behavior through executors, not by re-implementing the stage loop |
| Substrate-agnostic logic in consumer | `parallelDecompose()` and `scorePlan()` placed in DND instead of core | If it uses only core types and any consumer benefits → it belongs in core (Rule 11) |
| Observation pipelines / monitoring overlays (e.g., Observer pattern) | State is structural — graph-feeder writes observations inline | `conditionValue()` and `computePhiL()` are pure functions called during writes, not routed through intermediaries. Do NOT create collector.ts, evaluator.ts, or auditor.ts |
