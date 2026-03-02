# Audit Exploration Floor Implementation

> Task ID: t3
> Model: claude-opus-4-6:adaptive:medium
> Duration: 72334ms
> Output chars: 9713
> Timestamp: 2026-03-02T01:06:44.636Z

---

# Audit: Exploration Floor Implementation

**Task:** t3 — Verify exploration floor implementation against Engineering Bridge spec Part 2
**Files Examined:** `src/patterns/thompson-router/sampler.ts`, `docs/specs/05_codex-signum-engineering-bridge-v2_0.md`
**Date:** 2025-01-31

---

## Executive Summary

**The exploration floor is not implemented.** The provided Thompson router codebase contains only low-level statistical sampling primitives (`sampleBeta`, `sampleGamma`, `randn`). None of the three spec-mandated exploration floor mechanisms are present in any form. This is not a minor deviation — it is a complete absence of a safety-critical feature that the spec explicitly ties to CAS vulnerability mitigation (Lock-In and Path Dependence, Watchpoint #4).

---

## Spec Requirements (What Must Exist)

The Engineering Bridge spec Part 2 defines the exploration floor in three layers of increasing sophistication. All three are normative.

### Layer 1: Base Floor (Hard Minimum)

> **CAS Watchpoint #4:** "εR minimum floor (never zero); challenge seeds for mature networks"

> **Critical rule:** "High ΦL with zero εR is a warning, not a success."

A `base_εR` parameter must exist and must be strictly greater than zero. The system must never converge to a state where one model receives 100% of selections.

### Layer 2: Imperative Gradient Modulation

```
εR_floor = base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient))
```

- `gradient_sensitivity` recommended range: 0.05–0.15
- When Ω gradients are positive (system improving), the correction term is zero and the floor equals `base_εR`
- When Ω gradients are negative (system degrading), the floor rises, forcing more exploration

### Layer 3: Spectral Calibration (Complementary Signal)

```
εR_floor = max(
    base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient)),
    min_εR_for_spectral_state(spectral_ratio)
)
```

| Spectral Ratio | Minimum εR |
|---|---|
| > 0.9 | 0.05 |
| 0.7–0.9 | 0.02 |
| 0.5–0.7 | 0.01 |
| < 0.5 | 0.0 |

The final floor is the **maximum** of the gradient-modulated floor and the spectral-state minimum. This ensures that even when Ω gradients are positive, a high spectral ratio (indicating structural alignment) still enforces a 5% exploration minimum.

---

## Current Implementation (What Actually Exists)

### `sampler.ts` — Complete Analysis

The file provides three functions:

| Function | Purpose | Exploration Floor Relevance |
|---|---|---|
| `sampleBeta(alpha, beta)` | Draw from Beta(α, β) | **None.** Pure statistical primitive. |
| `sampleGamma(shape, scale)` | Draw from Gamma distribution (Marsaglia & Tsang) | **None.** Internal dependency of `sampleBeta`. |
| `randn()` | Standard normal via Box-Muller | **None.** Internal dependency of `sampleGamma`. |

There is:

- **No `base_εR` parameter** — not as a constant, not as a configurable value, not as a function argument.
- **No gradient sensitivity parameter** — no `gradient_sensitivity` variable, no Ω gradient input.
- **No spectral ratio lookup** — no spectral ratio input, no lookup table, no `min_εR_for_spectral_state` function.
- **No floor enforcement mechanism** — no clamping, no epsilon-greedy mixing, no minimum probability guarantee.
- **No εR tracking** — no counting of exploratory vs. total decisions.

### Where the Floor Would Need to Live

In a Thompson sampling router, the exploration floor could be implemented at several points:

1. **Pre-sampling:** Clamp Beta parameters so no model's posterior is so concentrated that its selection probability drops below `εR_floor / n_models`. *Not implemented.*

2. **Post-sampling (epsilon-greedy hybrid):** With probability `εR_floor`, select uniformly at random; otherwise, select the Thompson sample winner. *Not implemented.*

3. **Post-selection accounting:** Track `exploratory_decisions / total_decisions` over a rolling window and dynamically adjust when the ratio falls below floor. *Not implemented.*

The spec's language ("force minimum exploration" for εR = 0.0) most naturally maps to approach (2) — an epsilon-greedy wrapper around Thompson sampling — but any of the three approaches would satisfy the requirement. None are present.

---

## Detailed Findings

### Finding 1: CRITICAL — No Exploration Floor Exists

**Severity:** Critical
**Evidence:** Complete absence in `sampler.ts`. No floor-related code, parameters, or data structures.
**Spec violation:** Part 2 (εR section), Part 6 Watchpoint #4.
**Risk:** Without a floor, the Thompson router can converge to always selecting a single model. If that model degrades in ways not captured by the Beta update (e.g., subtle quality drift), the system has no mechanism to discover alternatives. This is the exact "lock-in and path dependence" failure mode the spec warns about.

### Finding 2: CRITICAL — No Ω Gradient Input Path

**Severity:** Critical
**Evidence:** `sampleBeta` takes only `alpha` and `beta`. There is no mechanism for the sampler (or any calling code visible in the provided files) to receive Ω aggregate gradient information.
**Spec violation:** Part 2, εR imperative gradient modulation formula.
**Risk:** During system degradation (negative Ω gradient), the spec requires the exploration floor to **rise**, actively forcing the router to try alternatives. Without this, the router may continue exploiting a degrading model while alternatives exist.

### Finding 3: HIGH — No Spectral Calibration Integration Point

**Severity:** High
**Evidence:** No spectral ratio input, no lookup table matching the spec's four-tier mapping.
**Spec violation:** Part 2, εR spectral calibration formula.
**Risk:** The spectral calibration provides a structural health signal independent of the Ω gradient. Even in steady-state (positive Ω gradients), a high spectral ratio (>0.9) should enforce 5% minimum exploration. This secondary signal is entirely absent.

### Finding 4: MEDIUM — No εR Observability

**Severity:** Medium
**Evidence:** No counter or tracker for exploratory vs. total decisions.
**Spec violation:** Part 2 definition (`εR = exploratory_decisions / total_decisions`), Part 1 (state is structural — εR must be derivable from the graph).
**Risk:** Even if a floor were implemented, there is no way to observe the current εR value, verify it against maturity-indexed thresholds, or trigger structural reviews when εR spikes (Part 8 trigger condition).

### Finding 5: LOW — Sampler Primitives Are Sound

**Severity:** Informational (positive finding)
**Evidence:** The Gamma sampling uses the Marsaglia & Tsang method with correct rejection criteria. The Beta sampling via `X/(X+Y)` where X~Gamma(α,1) and Y~Gamma(β,1) is mathematically correct. Box-Muller transform is standard. Parameter validation (`alpha <= 0 || beta <= 0`) is present.
**Assessment:** When the exploration floor is implemented, the underlying sampling machinery is a correct foundation.

---

## Gap Analysis Summary

| Spec Requirement | Status | Notes |
|---|---|---|
| `base_εR` parameter (> 0) | ❌ Missing | No constant, config, or argument |
| `εR_floor = base_εR + gradient_sensitivity × max(0, -Ω_gradient)` | ❌ Missing | No gradient input path |
| `gradient_sensitivity` ∈ [0.05, 0.15] | ❌ Missing | No parameter |
| Spectral ratio → minimum εR lookup | ❌ Missing | No lookup table or function |
| `εR_floor = max(gradient_floor, spectral_floor)` | ❌ Missing | Neither component exists |
| εR tracking (exploratory / total) | ❌ Missing | No counters |
| "High ΦL with zero εR is a warning" | ❌ Missing | No warning mechanism |
| εR ≠ 0 enforcement (Watchpoint #4) | ❌ Missing | No enforcement |
| Beta/Gamma sampling correctness | ✅ Present | Sound implementation |

---

## Recommendations

1. **Implement the exploration floor as a wrapper around Thompson sampling.** The most natural approach: in `selectModel()`, with probability `εR_floor`, select uniformly at random among candidate models; otherwise, select the Thompson sample winner. This cleanly separates the floor from the sampling primitives.

2. **Define the floor computation as a dedicated function** with signature approximating:
   ```
   computeExplorationFloor(baseεR, ΩAggregateGradient, gradientSensitivity, spectralRatio) → number
   ```
   This makes the spec's two-layer max formula explicit and testable in isolation.

3. **Add εR tracking** — a simple rolling-window counter of `{exploratory: number, total: number}` that can be queried to produce the current εR value. This feeds the structural review trigger (Part 8) and the εR range table (Part 2).

4. **Wire the Ω gradient input.** This requires the router to receive or compute the aggregate Ω gradient from the broader system. Define the interface even if the upstream signal isn't available yet — use a default of 0.0 (no correction) until integration is complete.

5. **Add the spectral ratio lookup table** as a pure function matching the spec's four-tier mapping. Even if spectral analysis isn't yet computed upstream, the lookup function should exist and be tested.

6. **Emit a warning event** when εR = 0.0 is detected in the rolling window, per the spec's "High ΦL with zero εR is a warning, not a success" rule.

---

## Conclusion

The exploration floor is **entirely unimplemented**. The sampler provides correct Beta distribution primitives, but none of the three spec-mandated floor mechanisms (base floor, gradient modulation, spectral calibration) exist. This leaves the Thompson router vulnerable to the lock-in failure mode that the spec's CAS Watchpoint #4 explicitly identifies as a structural risk requiring mitigation. Implementation of the full εR floor computation is required before the router can be considered spec-compliant.