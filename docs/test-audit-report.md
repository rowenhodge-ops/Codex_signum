# Test Audit Report — Codex Signum Core

**Date:** 2026-03-03
**Previous Baseline:** 841 tests passing, 50 test files, 214 barrel exports
**New Baseline:** 1054 tests passing, 72 test files, 214 barrel exports
**New tests added:** 213

## Phase Summary

| Phase | Category | Files | Tests | Status |
|-------|----------|-------|-------|--------|
| 1 | Audit (this report) | 1 | — | Complete |
| 2 | Axiom enforcement (A2–A10) | 9 | 77 | All passing |
| 3 | Grammar rule enforcement (G1–G5) | 5 | 30 | All passing |
| 4 | Anti-pattern detection | 4 | 50 | All passing |
| 5 | Pattern pipeline governance | 4 | 56 | All passing |
| **Total** | | **22 new files** | **213 new tests** | **All passing** |

## New Test Files

### tests/axioms/ (Phase 2 — 77 tests)

| File | Axiom | Tests | Level | What It Enforces |
|------|-------|-------|-------|-----------------|
| transparency.test.ts | A2 | 9 | L2/L5 | ΦL exposes factors/weights/raw/maturity/effective/trend; ΨH exposes lambda2/friction/combined; εR exposes all dimensions; Thompson route() includes reasoning+confidence |
| fidelity.test.ts | A3 | 6 | L4/L5 | 100x determinism for computePhiL, computePsiH, computeDampening; signal pipeline explicit state; Math.random() absent from computation/ |
| visible-state.test.ts | A4 | 10 | L2/L5 | Schema defines Bloom/Observation/ThresholdEvent/Decision/HumanFeedback; graph queries write to Bloom nodes; no console.log in computation |
| minimal-authority.test.ts | A5 | 9 | L5 | Architect stages don't import neo4j-driver/node:net/node:http/@anthropic-ai/openai; Thompson takes explicit inputs; DevAgent stages receive explicit inputs |
| provenance.test.ts | A6 | 7 | L2/L5 | ObservationProps requires sourceBloomId; DecisionProps requires selectedSeedId; ConstitutionalRule requires rationale+evidencedBy |
| reversibility.test.ts | A7 | 9 | L2/L5 | writeThresholdEvent uses CREATE not MERGE; schema defines uniqueness constraints; ring buffer preserves history; immutable state updates |
| semantic-stability.test.ts | A8 | 9 | L2/L5 | Barrel exports both old and new names; migration uses SET not delete+recreate; exactly 6 morpheme kinds; exactly 5 grammar rules |
| comprehension-primacy.test.ts | A9 | 8 | L2/L5 | ΦL returns structured object with named factors; ΨH returns decomposed coherence; εR returns context-rich data; no bare number health |
| adaptive-pressure.test.ts | A10 | 10 | L4/L5 | εR floor always > 0; critical warning on εR=0; Thompson betaSample produces variance; posteriors shift after outcomes; exploitation converges |

### tests/grammar/ (Phase 3 — 30 tests)

| File | Rule | Tests | Level | What It Enforces |
|------|------|-------|-------|-----------------|
| proximity.test.ts | G1 | 8 | L2/L5 | No generic CONNECTED_TO; schema uses ROUTED_TO/ORIGINATED_FROM/OBSERVED_IN/THRESHOLD_CROSSED_BY; queries use typed relationships |
| orientation.test.ts | G2 | 5 | L3/L5 | executePlan transitions through 7 stages in order; gate is structurally mandatory (never skipped); classify→sequence ordering; gate autoApprove returns approve |
| containment.test.ts | G3 | 8 | L2/L5 | Propagation stops at depth 2; CASCADE_LIMIT=2; pattern directories have index.ts barrels; no cross-pattern imports bypassing barrels |
| flow.test.ts | G4 | 4 | L5 | route() throws on all-inactive; never selects inactive model; single active always selected; IntegrationState defines 7 lifecycle states |
| resonance.test.ts | G5 | 5 | L4/L5 | Uniform health → low friction; divergent health → high friction; increasing alignment monotonically decreases friction; combined score reflects structure+friction |

### tests/anti-patterns/ (Phase 4 — 50 tests)

| File | Anti-Pattern | Tests | Level | What It Enforces |
|------|-------------|-------|-------|-----------------|
| dimensional-collapse.test.ts | Dimensional Collapse | 12 | L5 | AxiomCompliance has 10 fields; MorphemeKind has 6 variants; 7 architect stages; 5 grammar rules; no eliminated files; no codexStats; ELIMINATED_ENTITIES ≥10; hallucination detector checks axiom/stage counts |
| shadow-system.test.ts | Shadow System | 12 | L5 | No SQLite/Redis/localStorage in src/; no JSON state writes; no class Observer; no new Observer; GraphObserver is interface not class; no mutable module state in computation/; no Math.random in computation/; no Prometheus/Grafana/dashboard |
| infrastructure-first.test.ts | Infrastructure-First | 11 | L5 | No LLM SDK imports in src/; no fetch() in src/; no neo4j-driver outside graph/; no MongoDB/PostgreSQL; no DND-Manager imports; no consumer types; ModelExecutor/TaskExecutor/DevAgentModelExecutor are interfaces/types not classes; no prepare script |
| model-centric.test.ts | Model-Centric | 15 | L5 | computeGammaEffective varies with degree; γ ≤ 0.7 always; no hardcoded γ=0.7; circuit breaker exponential backoff+jitter+half-open; HYSTERESIS_RATIO=2.5; CASCADE_LIMIT=2; PhiL composite not number; compaction exponential decay |

### tests/patterns/ (Phase 5 — 56 tests)

| File | Pattern | Tests | Level | What It Enforces |
|------|---------|-------|-------|-----------------|
| architect-pipeline-governance.test.ts | Architect | 12 | L3/L4 | executePlan completes with mocks; dryRun completes; classify preserves all tasks and IDs; sequence respects hard dependencies; reasoning tiers enforce RTR (planning→deep, simple→light, complex→deep) |
| thompson-router-governance.test.ts | Thompson Router | 15 | L3/L5 | Inactive models never selected; empty models throw; routing decisions include required fields; beta sampling variance; arm stats neutral prior; alpha/beta update on success/failure; DEFAULT_ROUTER_CONFIG completeness |
| devagent-pipeline-governance.test.ts | DevAgent | 15 | L3/L4 | 4 stages run in order; each stage produces output+quality; Thompson routing per stage; correction helix executes retries; PIPELINE_PRESETS valid (full/lite/quick/generate); DEFAULT_DEVAGENT_CONFIG correct; lifecycle hooks called |
| retrospective-governance.test.ts | Retrospective | 14 | L2/L5 | Reads from graph/client; uses graph queries not computation; no computation imports; no local caches; Promise.all concurrency; only writes DistilledInsight; writeInsights opt-in; diverging-only writes; type contracts; no LLM dependency |

## Coverage Matrix — Post-Audit

### Axioms

| Axiom | Pre-Audit Coverage | Post-Audit Coverage | Structural Enforcement |
|-------|-------------------|--------------------|-----------------------|
| A1. Symbiosis | — (excluded) | — | — |
| A2. Transparency | L1 constitutional-engine | L1 + **L2/L5 structural** | Every computed signal exposes decomposition |
| A3. Fidelity | L1 constitutional-engine | L1 + **L4/L5 determinism** | 100x identical outputs, no hidden state |
| A4. Visible State | L1/L2 phi-l, write-observation | L1/L2 + **L2/L5 structural** | Graph nodes verified, no shadow state |
| A5. Minimal Authority | L1 constitutional-engine | L1 + **L5 structural** | Import boundary enforcement |
| A6. Provenance | L1/L2 data-provenance | L1/L2 + **L2/L5 structural** | Required origin fields on all types |
| A7. Reversibility | L1 constitutional-engine | L1 + **L2/L5 structural** | CREATE not MERGE, append-only, immutable |
| A8. Semantic Stability | L1/L2 constitutional-evolution | L1/L2 + **L2/L5 structural** | Deprecated aliases preserved, exact counts |
| A9. Comprehension Primacy | L1/L2 phi-l | L1/L2 + **L2/L5 structural** | No bare number health anywhere |
| A10. Adaptive Pressure | L1/L4/L5 epsilon-r | L1/L4/L5 + **L4/L5 structural** | εR floor, posterior convergence |

### Grammar Rules

| Rule | Pre-Audit Coverage | Post-Audit Coverage |
|------|-------------------|--------------------|
| G1. Proximity | L2 write-observation | L2 + **L2/L5 typed relationships** |
| G2. Orientation | L3 architect-pipeline | L3 + **L3/L5 stage ordering** |
| G3. Containment | L1/L5 cascade, subcriticality | L1/L5 + **L2/L5 import isolation** |
| G4. Flow | **None** | **L5 inactive model rejection** |
| G5. Resonance | L1/L5 psi-h, aggregation | L1/L5 + **L4/L5 friction monotonicity** |

### Anti-Patterns

| Anti-Pattern | Pre-Audit | Post-Audit |
|-------------|-----------|------------|
| Dimensional Collapse | L1/L2 hallucination detection | **L5 canonical constants + codebase-wide scan** |
| Shadow System | L1 hallucination detection | **L5 comprehensive codebase scan (no parallel state stores, no Observer class, no monitoring overlays)** |
| Infrastructure-First | None | **L5 complete import boundary enforcement** |
| Model-Centric | None | **L5 topology-dependent dampening, exponential backoff, composite health** |
| Manual Analysis Bypass | N/A (process) | N/A |

### Patterns

| Pattern | Pre-Audit | Post-Audit |
|---------|-----------|------------|
| Architect | L1/L2/L3 | L1/L2/L3 + **L3/L4 governance (full pipeline, classify, sequence, RTR)** |
| Thompson Router | L1/L2/L4 | L1/L2/L4 + **L3/L5 governance (inactive rejection, arm updates, config)** |
| DevAgent | L1/L2/L3 (7 todo) | L1/L2/L3 + **L3/L4 governance (stage order, corrections, presets, hooks)** |
| Retrospective | L1/L2 | L1/L2 + **L2/L5 governance (graph-only reads, no LLM, type contracts)** |

## Level Distribution — Before & After

| Level | Before (describe blocks) | After (describe blocks) | Change |
|-------|-------------------------|------------------------|--------|
| L1 Unit | ~75 (56%) | ~75 (42%) | — |
| L2 Contract | ~35 (26%) | ~55 (31%) | +20 |
| L3 Pipeline | ~8 (6%) | ~16 (9%) | +8 |
| L4 Outcome | ~2 (1.5%) | ~8 (4.5%) | +6 |
| L5 Invariant | ~14 (10.5%) | ~24 (13.5%) | +10 |

The structural enforcement ratio (L3-L5) increased from **~18% to ~27%** of describe blocks.

## Remaining Gaps

1. **A1 Symbiosis** — excluded per instruction (requires multi-agent integration)
2. **Morpheme composition tests** — Grid and Helix have type-level coverage only, no functional tests
3. **Learning loop closure** — no test that retrospective output is consumable by Architect SURVEY
4. **HumanFeedback penalty** — no router-level test that rejection applies 0.5× quality penalty
5. **DevAgent todo tests** — 7 skipped tests in existing conformance remain unimplemented
6. **Cross-platform case sensitivity** — docs/Research/ vs docs/research/ not tested (known issue)

## Confidence Assessment

- **Axioms**: 9/10 structurally enforced (A1 excluded) — **HIGH**
- **Grammar Rules**: 5/5 tested, G4 newly covered — **HIGH**
- **Anti-Patterns**: 4/5 testable anti-patterns covered (Manual Bypass is process-level) — **HIGH**
- **Pattern Governance**: 4/4 patterns with governance tests — **HIGH**
- **Overall**: The test suite now enforces Codex structural invariants, not just computational correctness. The "nails hold the house together."
