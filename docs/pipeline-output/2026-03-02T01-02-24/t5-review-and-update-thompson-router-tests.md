# Review and Update Thompson Router Tests

> Task ID: t5
> Model: claude-opus-4-6:adaptive:high
> Duration: 96578ms
> Output chars: 13822
> Timestamp: 2026-03-02T01:09:50.506Z

---

# Thompson Router Test Gap Analysis

**Task:** t5 — Review and Update Thompson Router Tests  
**Source Material:** Audit findings t1–t4, existing test files, Engineering Bridge spec Part 2  
**Date:** 2025-01-31

---

## 1. Existing Test Coverage Map

Before identifying gaps, here is what the two existing test files already cover:

| Test Area | `thompson-router.test.ts` | `thompson-sampling.test.ts` | Combined Coverage |
|---|---|---|---|
| `sampleBeta` range [0,1] | ✅ | ✅ | Redundant — consolidate |
| `sampleBeta` distribution means | ✅ (3 cases) | ✅ (2 cases) | Redundant — consolidate |
| `sampleBeta` rejects bad params | ✅ | ✅ | Redundant — consolidate |
| `sampleGamma` basic properties | ✅ | — | Adequate |
| `route()` returns valid selection | ✅ | ✅ | Adequate |
| Throws on empty / inactive models | ✅ | ✅ | Redundant — consolidate |
| Single-model determinism | ✅ | — | Adequate |
| Exploitation of high-posterior arm | — | ✅ | Adequate |
| Exploration of uncertain arm | — | ✅ | Adequate |
| Uniform prior explores all arms | — | ✅ | Adequate |
| `buildContextClusterId` format | — | ✅ (2 cases) | Adequate |
| `DEFAULT_ROUTER_CONFIG` fields | ✅ | — | Superficial |

**Observation:** There is significant duplication between the two files. The `thompson-sampling.test.ts` file is generally more thorough. Recommend consolidating into a single canonical test file or clearly separating responsibilities (sampler unit tests vs. routing integration tests).

---

## 2. Critical Test Gaps — Mapped to Audit Findings

### Gap 1: Exploration Floor Not Tested (Audit t3 — CRITICAL)

**What the spec requires:**
Three layers of floor enforcement: base floor (`base_εR > 0`), gradient modulation, and spectral calibration. The spec explicitly states `εR = 0.0 → Warning. Force minimum exploration.`

**What is tested:** Nothing. Zero tests for any floor behavior.

**Required test cases:**

| Test Case | Purpose | Verifies |
|---|---|---|
| Dominant model cannot achieve 100% selection over N trials | Ensures base floor exists | base_εR > 0 |
| With tight posteriors (e.g., α=500, β=5 vs α=5, β=500), underdog still selected occasionally | Floor prevents convergence to single arm | CAS Watchpoint #4 |
| `forceExploreEvery` triggers forced exploration at configured interval | Verifies the existing config parameter actually works | Periodic exploration |
| `wasExploratory` flag is `true` when exploration is forced | Observability of floor mechanism | εR tracking correctness |
| Given N decisions, `exploratory_decisions / total_decisions >= base_εR` | Aggregate εR never drops below floor | Floor invariant |

**Evidence from t3:** *"There is no `base_εR` parameter — not as a constant, not as a configurable value, not as a function argument... No floor enforcement mechanism — no clamping, no epsilon-greedy mixing, no minimum probability guarantee."*

**Recommendation:** These tests will initially **fail** because the implementation lacks the floor. Write the tests first as spec-conformance assertions. They serve as both regression tests and as acceptance criteria for the implementation fix.

---

### Gap 2: Gradient-Modulated Floor Not Tested (Audit t3 — CRITICAL)

**What the spec requires:**
```
εR_floor = base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient))
```

**What is tested:** Nothing. No test passes Ω gradient information to `route()`.

**Required test cases:**

| Test Case | Purpose |
|---|---|
| Negative Ω gradient → εR floor rises above base | Degradation triggers more exploration |
| Positive Ω gradient → εR floor equals base (correction term is zero) | Healthy system doesn't over-explore |
| `gradient_sensitivity` within [0.05, 0.15] in default config | Config conformance |
| Ω gradient of -1.0 with sensitivity 0.1 → floor increases by 0.1 | Formula correctness |

**Prerequisite:** The `route()` function signature may need to accept Ω gradient as an input parameter, or the test must verify that `route()` retrieves it internally. Current `route()` signature: `route(context, models, stats, decisionCount?, config?)` — no gradient parameter exists.

**Recommendation:** Add a test that explicitly asserts the `route()` function either (a) accepts an Ω gradient parameter, or (b) can retrieve it from graph state. This structural test documents the expected interface change.

---

### Gap 3: Spectral Calibration Not Tested (Audit t3 — HIGH)

**What the spec requires:**

| Spectral Ratio | Minimum εR |
|---|---|
| > 0.9 | 0.05 |
| 0.7–0.9 | 0.02 |
| 0.5–0.7 | 0.01 |
| < 0.5 | 0.0 |

**What is tested:** Nothing.

**Required test cases:**

| Test Case | Purpose |
|---|---|
| Spectral ratio 0.95 → εR floor ≥ 0.05 even with positive Ω gradient | Spectral override of gradient floor |
| Spectral ratio 0.3 → spectral component contributes 0.0 to floor | Low spectral ratio doesn't inflate floor |
| Final floor is `max(gradient_floor, spectral_floor)` | Correct composition of the two signals |

**Recommendation:** These tests require either a `spectralRatio` parameter on the routing interface or a mock/stub for the spectral state query. Either approach should be documented in the test as the expected integration point.

---

### Gap 4: Context Cluster Granularity Incomplete (Audit t2 — MEDIUM)

**What the spec requires:** Granularity along node topology type, computed maturity index, and spectral ratio — in addition to the existing taskType, complexity, domain.

**What is tested:** Only the current three-dimension format.

**Required test cases:**

| Test Case | Purpose |
|---|---|
| `buildContextClusterId` includes node topology type when provided | Topology-aware clustering |
| Different topology types produce different cluster IDs | Window size differentiation |
| Cluster ID is stable/deterministic for identical inputs (existing, keep) | Regression |
| Missing optional fields use documented defaults (existing for domain, extend to topology) | Default handling |

**Assessment from t2:** *"The three dimensions (taskType, complexity, domain) capture the primary routing context... The non-compliance is in how finely and on what dimensions clusters are defined."*

**Recommendation:** The existing `buildContextClusterId` tests are a good foundation. Extend them to assert on the additional dimensions once the implementation is updated. In the interim, add a documentation comment in the test file noting the known granularity gap.

---

### Gap 5: Maturity Index Not Tested (Audit t1, t2 — MEDIUM)

**What the spec requires:**
```
maturity_index = min(1.0,
    0.25 × normalize(mean_observation_depth) +
    0.25 × normalize(connection_density) +
    0.25 × normalize(mean_component_age) +
    0.25 × normalize(mean_ΦL_ecosystem)
)
```

**What is tested:** Nothing. `decisionCount` is used as a partial proxy but never validated against the four-factor formula.

**Required test cases:**

| Test Case | Purpose |
|---|---|
| Maturity index computation with known inputs produces expected output | Formula correctness |
| MI < 0.3 → εR stable range 0.10–0.40 | Young system threshold |
| MI 0.3–0.7 → εR stable range 0.05–0.30 | Maturing system threshold |
| MI > 0.7 → εR stable range 0.01–0.15 | Mature system threshold |
| All four components contribute equally (0.25 weight each) | Weight balance |

**Prerequisite:** A `computeMaturityIndex()` function or equivalent must exist. Currently absent from the codebase.

---

### Gap 6: `wasExploratory` Flag and εR Observability (Audit t3 — MEDIUM)

**What the spec requires:** Decisions must be tagged as exploratory or exploitative to compute `εR = exploratory_decisions / total_decisions`.

**What is tested:** The `wasExploratory` field is referenced in the `selectModel()` code (per t1) but **no test verifies its correctness**.

**Required test cases:**

| Test Case | Purpose |
|---|---|
| Forced exploration decisions have `wasExploratory: true` | Flag correctness |
| Standard Thompson-selected decisions have `wasExploratory: false` (unless forced) | Flag correctness |
| Over N decisions, the ratio of `wasExploratory: true` approximates the actual εR | Observability |

---

### Gap 7: `DEFAULT_ROUTER_CONFIG` Completeness (Audit t1, t3 — MEDIUM)

**What is tested:** Only `forceExploreEvery`, `latencyPenaltyFactor`, and `costPenaltyFactor` existence checks.

**What should be tested:**

| Config Field | Spec Requirement | Current Test |
|---|---|---|
| `forceExploreEvery` | Periodic exploration trigger | ✅ Existence only |
| `latencyPenaltyFactor` | Penalize high-latency models | ✅ Existence only |
| `costPenaltyFactor` | Penalize high-cost models | ✅ Existence only |
| `base_εR` | Minimum exploration floor | ❌ Not tested |
| `gradient_sensitivity` | Ω gradient modulation factor [0.05–0.15] | ❌ Not tested |
| `spectral_εR_thresholds` | Four-tier spectral ratio → min εR mapping | ❌ Not tested |
| `maturity_bands` | MI → εR range mapping | ❌ Not tested |

**Recommendation:** Extend the `DEFAULT_ROUTER_CONFIG` test block to assert the existence and valid ranges of all spec-mandated parameters. This serves as a contract test — if someone removes a required config field, the test fails immediately.

---

## 3. Edge Case and Regression Tests Missing

These are not directly tied to a single audit finding but emerge from the synthesis of t1–t4:

| Scenario | Why It Matters |
|---|---|
| **Pathological convergence:** All 1000 stats on one model (α=1000, β=5), zero stats on others | Tests whether floor prevents permanent lock-in (CAS Watchpoint #4) |
| **Model degradation mid-stream:** Model had good stats, then quality drops | Tests whether Ω gradient modulation increases exploration |
| **New model added to pool:** Existing models have rich posteriors, new model has Beta(1,1) | Tests whether Thompson's natural uncertainty bonus gives new models a chance |
| **All models equally good:** Alpha/beta ratios identical across all arms | Tests whether the router distributes load approximately evenly |
| **Context cluster cold start:** First decision in a new cluster | Tests that prior is correctly initialized (Beta(1,1) per spec) |

---

## 4. Structural Recommendations

### R1: Consolidate Test Files

The duplication between `thompson-router.test.ts` and `thompson-sampling.test.ts` creates maintenance burden and obscures coverage gaps. Recommended structure:

```
tests/conformance/thompson-router/
  ├── sampler.test.ts          — sampleBeta, sampleGamma unit tests (one copy)
  ├── context-cluster.test.ts  — buildContextClusterId, granularity
  ├── routing.test.ts          — route() selection behavior
  ├── exploration-floor.test.ts — εR floor: base, gradient, spectral
  └── config.test.ts           — DEFAULT_ROUTER_CONFIG contract
```

### R2: Separate "Currently Passing" from "Spec Conformance" Tests

Several required tests will fail against the current implementation because features are missing (exploration floor, maturity index, spectral calibration). These should be organized clearly:

- **`describe("spec conformance — exploration floor")`** — tests that assert spec requirements; expected to fail until implementation catches up
- **`describe.skip("pending implementation — spectral calibration")`** — tests for features with no implementation entry point yet

This makes the test suite a living conformance tracker rather than a binary pass/fail gate.

### R3: Add Stochastic Test Utilities

Multiple tests require statistical assertions (mean within tolerance, minimum selection frequency). Extract shared helpers:

- `assertMeanInRange(samples, expectedMean, tolerance)` 
- `assertSelectionFrequency(modelId, decisions, minRate, maxRate)`
- `runNTrials(n, fn)` — collect N routing decisions for statistical analysis

This reduces boilerplate and makes tolerance thresholds consistent across tests.

---

## 5. Priority-Ordered Test Addition Plan

| Priority | Test Group | Audit Finding | Expected Result |
|---|---|---|---|
| **P0** | Exploration floor — base εR never zero | t3 Critical | ❌ Will fail (not implemented) |
| **P0** | Pathological convergence — dominant arm doesn't lock out alternatives | t3 Critical, CAS WP#4 | ❌ Will fail (no floor) |
| **P0** | `wasExploratory` flag correctness | t3 Medium | ⚠️ May pass if flag exists but floor doesn't |
| **P1** | `DEFAULT_ROUTER_CONFIG` includes `base_εR` | t3 Critical | ❌ Will fail |
| **P1** | `forceExploreEvery` actually triggers exploration | t1 | ⚠️ Untested behavior |
| **P1** | Gradient-modulated floor formula | t3 Critical | ❌ Will fail (no input path) |
| **P2** | Spectral calibration four-tier mapping | t3 High | ❌ Will fail (not implemented) |
| **P2** | Context cluster includes topology type | t2 Medium | ❌ Will fail |
| **P2** | Maturity index computation | t1, t2 Medium | ❌ Will fail (function doesn't exist) |
| **P3** | Consolidate duplicate tests | Maintenance | ✅ Refactor only |
| **P3** | New model cold start behavior | t4 | ✅ Should pass (Beta(1,1) prior) |

---

## 6. Summary

The existing test suite validates that Thompson sampling **works as a statistical mechanism** — Beta distributions sample correctly, routing selects from active models, and context clusters are deterministically formed. This is necessary but not sufficient.

**What is entirely untested is whether the router is safe.** The three audit-critical findings — exploration floor absence, gradient modulation absence, and spectral calibration absence — have zero test coverage. This means the implementation could (and per t3, does) violate the spec's most emphasized safety property: that εR must never reach zero.

The highest-impact action is adding the P0 exploration floor tests. Even if they fail initially, they convert the spec requirements into executable assertions and prevent any future regression where someone accidentally removes floor logic.