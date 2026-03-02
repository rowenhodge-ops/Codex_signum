# Document Divergences

> Task ID: t9
> Model: claude-opus-4-6:adaptive:low
> Duration: 74969ms
> Output chars: 13560
> Timestamp: 2026-03-02T01:21:28.769Z

---

# ΦL Divergence Report: Spec vs. Implementation

**Task:** t9 — Document Divergences
**Spec Reference:** `docs/specs/05_codex-signum-engineering-bridge-v2_0.md`, Part 2
**Code Reference:** `src/computation/phi-l.ts` (and delegated modules)
**Date:** Synthesized from pipeline tasks t1–t8

---

## Classification Key

| Severity | Meaning |
|----------|---------|
| 🔴 **Unverified** | Cannot confirm compliance — external file not reviewed |
| 🟡 **Divergent** | Code deviates from spec in observable behavior |
| 🟢 **Compliant** | Code matches spec |
| ⚪ **Documentation-only** | No behavioral impact; documentation gap |

---

## 1. Verified Compliant Areas (No Divergence)

These areas were confirmed to match the spec exactly. Listed for completeness.

| Aspect | Spec Requirement | Code Implementation | Status |
|--------|-----------------|---------------------|--------|
| Factor count | Exactly 4 factors | 4 factors in `computeRawPhiL` | 🟢 |
| Factor 1 identity | `axiom_compliance` | `axiomCompliance` | 🟢 |
| Factor 2 identity | `provenance_clarity` | `provenanceClarity` | 🟢 |
| Factor 3 identity | `usage_success_rate` | `usageSuccessRate` | 🟢 |
| Factor 4 identity | `temporal_stability` | `temporalStability` | 🟢 |
| No extraneous factors | Only the 4 specified factors contribute | Confirmed — no 5th term | 🟢 |
| Combination method | Weighted linear sum | `Σ(wᵢ × fᵢ)` in `computeRawPhiL` | 🟢 |
| Weight sum constraint | `w₁ + w₂ + w₃ + w₄ = 1.0` | Enforced in `validateWeights` (±0.001 tolerance) | 🟢 |
| Factor domain | Each factor ∈ [0, 1] | Validated per-factor with range check | 🟢 |
| Maturity application method | `ΦL_effective = ΦL_raw × maturity_factor` | `effective = raw * maturityFactor` | 🟢 |
| Maturity application position | Post-multiplication on the combined raw score, not per-factor | Single multiplication after weighted sum | 🟢 |
| Maturity parameters passed | `observations` and `connections` | `observationCount` and `connectionCount` | 🟢 |
| Maturity factor exposed | N/A (spec implies auditability via Axiom 4) | Returned as named field in result object | 🟢 |
| Window sizes — leaf | 10–20 | `{ min: 10, max: 20, default: 20 }` | 🟢 |
| Window sizes — intermediate | 30–50 | `{ min: 30, max: 50, default: 40 }` | 🟢 |
| Window sizes — root | 50–100 | `{ min: 50, max: 100, default: 75 }` | 🟢 |
| Bridge View Principle | No variables introduced without Codex grounding | All variables trace to spec-defined morpheme states or axiom parameters | 🟢 |

---

## 2. Divergences

### D-1: Default Weight Values — Unverified

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 **Unverified** |
| **Spec requirement** | `w₁ = 0.4, w₂ = 0.2, w₃ = 0.2, w₄ = 0.2` (Part 2, "Recommended weights") |
| **Code location** | `DEFAULT_PHI_L_WEIGHTS` imported from `src/types/state-dimensions.ts` |
| **Evidence** | `import { DEFAULT_PHI_L_WEIGHTS } from "../types/state-dimensions.js";` — the numeric values are not defined in `phi-l.ts` |
| **What is known** | The weight *structure* is correct (4 named fields, 1:1 with factors). The sum-to-1.0 constraint is enforced. But the actual default numeric values cannot be confirmed. |
| **Risk** | If `DEFAULT_PHI_L_WEIGHTS` assigns, e.g., equal weights `{0.25, 0.25, 0.25, 0.25}`, the spec's intentional dominance of `axiom_compliance` (double-weighted at 0.4) would be silently violated. |
| **Resolution required** | Inspect `src/types/state-dimensions.ts` and confirm the export is exactly: `{ axiomCompliance: 0.4, provenanceClarity: 0.2, usageSuccessRate: 0.2, temporalStability: 0.2 }` |

---

### D-2: Maturity Factor Formula — Unverified

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 **Unverified** |
| **Spec requirement** | `maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))` |
| **Code location** | `computeMaturityFactor` imported from `src/computation/maturity.ts` |
| **Evidence** | `import { computeMaturityFactor } from "./maturity.js";` — the formula body is not in `phi-l.ts` |
| **What is known** | The `phi-l.ts` JSDoc header documents the correct formula. The function receives the correct two parameters (`observationCount`, `connectionCount`). The return value is correctly used as a multiplicative factor. But the actual implementation — the exponential constants `0.05` and `0.5`, the product structure (not sum), and edge-case handling (0 → 0) — cannot be confirmed. |
| **Risk** | Incorrect constants would shift the maturity curve, causing components to mature too quickly or too slowly. An additive (rather than multiplicative) combination of the two terms would eliminate the spec's AND-gate behavior (both observations AND connections required). |
| **Resolution required** | Inspect `src/computation/maturity.ts` and confirm: (a) formula is `(1 - Math.exp(-0.05 * observations)) * (1 - Math.exp(-0.5 * connections))`; (b) the two terms are multiplied; (c) `observations = 0` OR `connections = 0` yields 0. |

---

### D-3: `axiom_compliance` — Flexible Axiom Count vs. Spec's Fixed 10

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 **Divergent** |
| **Spec requirement** | "Fraction of **10 axioms** satisfied (binary per axiom)" — denominator is explicitly 10 |
| **Code implementation** | `computeAxiomComplianceFactor` divides by `axiomKeys.length` (the number of keys passed in) |
| **Evidence** | `return satisfied / axiomKeys.length;` — dynamic denominator, not fixed at 10 |
| **Behavioral difference** | If a caller passes fewer than 10 axioms (e.g., 5 out of 10, all satisfied), the code returns `5/5 = 1.0` whereas the spec implies `5/10 = 0.5`. If a caller passes more than 10, the fraction scale changes. |
| **Assessment** | This is a defensible generalization — the code is future-proof if the axiom count changes. However, the spec is explicit: the denominator is 10. The current code does not enforce this. |
| **Recommendation** | Either (a) add a validation that `axiomKeys.length === 10` with a clear error if not, or (b) document this as an intentional generalization with a comment referencing the spec's "10 axioms" and explaining why the code generalizes it. Option (b) is preferred if the axiom set may evolve. |

---

### D-4: `temporal_stability` — Two Competing Implementations

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 **Divergent** |
| **Spec requirement** | "Consistency of ΦL over the observation window" — "Low variance = stable." No specific formula prescribed, but the intent is singular: one method to compute stability from ΦL variance. |
| **Code implementation** | Two distinct functions exist: |
| | **`computeTemporalStability`** — uses coefficient of variation: `1 - (stddev / mean)` |
| | **`computeTemporalStabilityFromState`** — uses normalized variance: `1 - (variance / MAX_EXPECTED_VARIANCE)` where `MAX_EXPECTED_VARIANCE = 0.04` |
| **Evidence** | Both functions are exported from `phi-l.ts`. Both produce a value in [0, 1]. They will produce *different* values for the same input data. |
| **Behavioral difference** | For ΦL values with mean = 0.8 and stddev = 0.1: CV method yields `1 - (0.1/0.8) = 0.875`; variance method yields `1 - (0.01/0.04) = 0.75`. A 12.5 percentage-point difference in the temporal_stability factor, which at weight 0.2 contributes a 2.5 percentage-point difference in raw ΦL. |
| **Risk** | Consumers may use different functions, producing inconsistent ΦL values for the same component. There is no clear canonical choice documented in the code. |
| **Recommendation** | Designate one implementation as canonical and deprecate or remove the other. If the CV-based approach is preferred (it's scale-invariant), document why. If the variance-based approach is preferred (it uses a fixed reference scale), document the rationale for `MAX_EXPECTED_VARIANCE = 0.04`. Either way, the spec allows implementation freedom here — but having two competing implementations is an internal consistency problem. |

---

### D-5: Maturity Factor Edge-Case Documentation Missing

| Field | Detail |
|-------|--------|
| **Severity** | ⚪ **Documentation-only** |
| **Spec statement** | "At 50+ observations and 3+ connections, maturity_factor approaches 1.0. At 0 observations or 0 connections, it approaches 0." |
| **Code state** | The `phi-l.ts` JSDoc header reproduces the formula but does not document the edge-case behavior (zero-forcing, saturation thresholds). |
| **Risk** | No behavioral risk — the math handles edge cases automatically. However, a developer reading only the code may not immediately understand the zero-forcing property or the saturation milestones. |
| **Recommendation** | Add a brief edge-case note to the JSDoc, e.g.: `At 0 observations OR 0 connections → 0. At 50+ obs AND 3+ conn → ≈1.0.` |

---

### D-6: Recency Weighting — Not Visible in `phi-l.ts`

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 **Unverified** |
| **Spec requirement** | `observation_weight = e^(-λ × age)` applied to observations used for `usage_success_rate` and `temporal_stability`, with compaction at weight < 0.01 |
| **Code state** | `phi-l.ts` does not contain recency weighting logic. It computes `usage_success_rate` and `temporal_stability` from values passed *to* it. The weighting may exist upstream in the observation pipeline, ring buffer implementation, or factor computation callers. |
| **Risk** | If recency weighting is not implemented anywhere in the pipeline, recent and old observations contribute equally — violating the spec's requirement that observations decay exponentially with age. |
| **Resolution required** | Trace the observation pipeline to confirm recency weighting is applied before factors reach `computePhiL`. This is outside the scope of `phi-l.ts` review but is a spec requirement that must be satisfied somewhere in the system. |

---

### D-7: Sliding Window Subtract-on-Evict — Not Visible in `phi-l.ts`

| Field | Detail |
|-------|--------|
| **Severity** | ⚪ **Documentation-only / Architectural** |
| **Spec requirement** | "Use count-based ring buffers with subtract-on-evict for O(1) snapshot retrieval" |
| **Code state** | `phi-l.ts` references `PHI_L_WINDOW_SIZES` and a `computePhiLWithState` variant that uses a ring buffer. The ring buffer implementation itself is not in `phi-l.ts`. |
| **Assessment** | The window *sizes* match the spec (verified above). The O(1) subtract-on-evict mechanism is an implementation detail that belongs in the ring buffer module, not in `phi-l.ts`. No divergence in `phi-l.ts` itself, but the ring buffer module should be checked for spec compliance. |

---

## 3. Divergence Summary Matrix

| ID | Description | Severity | Spec Section | Resolution |
|----|------------|----------|-------------|------------|
| D-1 | Default weight values not confirmed | 🔴 Unverified | Part 2, "Recommended weights" | Review `src/types/state-dimensions.ts` |
| D-2 | Maturity factor formula not confirmed | 🔴 Unverified | Part 2, "Maturity modifier" | Review `src/computation/maturity.ts` |
| D-3 | Axiom compliance uses dynamic denominator, spec says 10 | 🟡 Divergent | Part 2, factor table | Enforce 10 or document generalization |
| D-4 | Two competing temporal_stability formulas | 🟡 Divergent | Part 2, factor table | Designate canonical implementation |
| D-5 | Maturity edge-case documentation absent | ⚪ Docs only | Part 2, "Maturity modifier" | Add JSDoc note |
| D-6 | Recency weighting not visible in phi-l.ts | 🔴 Unverified | Part 2, "Recency weighting" | Trace observation pipeline |
| D-7 | Ring buffer mechanism not in phi-l.ts | ⚪ Architectural | Part 2, "Sliding window" | Review ring buffer module |

---

## 4. Risk Assessment

### What is solid

The **structural architecture** of ΦL computation is correct. The four-factor weighted-sum formula, the multiplicative maturity application, the factor validation, and the window size constants all match the spec. The code does not introduce any variables or concepts not grounded in the Codex grammar (Bridge View Principle compliance).

### What requires immediate attention

**D-1 and D-2** are blocking. The two most important numeric aspects of the ΦL computation — the default weights and the maturity factor formula — are delegated to external files that were not reviewed. Until these are confirmed, spec compliance cannot be asserted.

### What should be addressed in a follow-up

**D-3** (axiom count flexibility) and **D-4** (dual temporal stability implementations) are behavioral divergences that could produce different ΦL values than a strict spec reading would expect. Neither is catastrophic, but both create ambiguity about what the "correct" ΦL for a given component state actually is.

**D-6** (recency weighting) is an architectural concern — the spec requires it, `phi-l.ts` doesn't implement it, and it may or may not exist elsewhere. This needs a pipeline-level trace.

---

## 5. Recommended Next Steps

1. **Review `src/types/state-dimensions.ts`** → Resolve D-1 (confirm weight values `0.4, 0.2, 0.2, 0.2`)
2. **Review `src/computation/maturity.ts`** → Resolve D-2 (confirm formula constants `0.05`, `0.5` and multiplicative structure)
3. **Decide on axiom count handling** → Resolve D-3 (enforce 10 or document generalization)
4. **Designate canonical temporal stability function** → Resolve D-4 (one function, deprecate the other)
5. **Trace observation pipeline for recency weighting** → Resolve D-6 (confirm `e^(-λ × age)` is applied upstream)
6. **Add edge-case documentation** → Resolve D-5 (minor, low-effort)