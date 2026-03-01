# Engineering Bridge Formula Cross-Reference

> Task ID: t4
> Model: claude-opus-4-6:adaptive:low
> Duration: 76399ms
> Output chars: 13267
> Timestamp: 2026-03-01T00:39:11.260Z

---

# Engineering Bridge Formula Cross-Reference Report

**Task:** t4 — Cross-reference Engineering Bridge formulas against implementation
**Spec reviewed:** `docs/specs/05_codex-signum-engineering-bridge-v2_0.md` (v2.0)
**Date:** 2025-07-09

---

## Executive Summary

The Engineering Bridge specification defines **at least 10 distinct formulas and computational procedures** across the visible portion of the document (the spec was truncated at ~8,000 characters; additional formulas likely exist in Parts 3–end covering signal conditioning, pulsation safety limits, CAS vulnerability watchpoints, and visual encoding constraints, all mentioned in the changelog but not visible). **No implementation source files were provided as context for this review.** Consequently, every formula is reported as **implementation: unverified / not located**. This is itself the most critical finding.

---

## Formula Inventory

### Formula 1: ΦL — Health Score (Composite)

| Attribute | Detail |
|---|---|
| **Spec location** | Part 2, "ΦL – Health Score" |
| **Definition** | `ΦL = w₁ × axiom_compliance + w₂ × provenance_clarity + w₃ × usage_success_rate + w₄ × temporal_stability` where `w₁+w₂+w₃+w₄ = 1.0` |
| **Recommended parameters** | w₁=0.4, w₂=0.2, w₃=0.2, w₄=0.2 |
| **Implementation location** | ⚠️ **Not located.** No source files provided. |
| **Discrepancies** | Cannot assess. |

**Spec-internal note:** The factor table specifies `axiom_compliance` as "Fraction of 10 axioms satisfied (binary per axiom)" and notes it now subsumes the former `grammar_alignment_factor`. This migration from v1.0 is a potential source of implementation drift if any v1.0 code was written — verify that no residual `grammar_alignment_factor` variable exists separately.

---

### Formula 2: ΦL Maturity Modifier

| Attribute | Detail |
|---|---|
| **Spec location** | Part 2, "Maturity modifier" |
| **Definition** | `ΦL_effective = ΦL_raw × maturity_factor` where `maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))` |
| **Boundary behavior** | At 50+ observations and 3+ connections → ~1.0; at 0 observations or 0 connections → 0.0 |
| **Implementation location** | ⚠️ **Not located.** |
| **Discrepancies** | Cannot assess. |

**Design quality note:** The two exponential terms are multiplied, meaning *either* zero observations *or* zero connections drives the entire effective score to zero. This is a strong constraint — a fully healthy but brand-new node with 0 observations reads as ΦL_effective=0.0 regardless of other factors. Implementations should be checked for whether this causes false-alarm cascading in newly instantiated subgraphs.

---

### Formula 3: Recency Weighting

| Attribute | Detail |
|---|---|
| **Spec location** | Part 2, "Recency weighting" |
| **Definition** | `observation_weight = e^(-λ × age)` |
| **Parameters** | λ set by domain; compaction threshold at weight < 0.01 |
| **Implementation location** | ⚠️ **Not located.** |
| **Discrepancies** | Cannot assess. |

**Spec-internal note:** The spec says "Set λ based on rate of change" and gives qualitative guidance (days-to-weeks for model performance, months for schema). No default λ value is provided. An implementation must either hard-code a domain-specific λ or expose it as configuration. This is an **under-specified parameter** that will lead to divergent implementations.

---

### Formula 4: Sliding Window — Subtract-on-Evict Ring Buffer

| Attribute | Detail |
|---|---|
| **Spec location** | Part 2, "Sliding window implementation" |
| **Definition** | Count-based ring buffers with subtract-on-evict for O(1) snapshot retrieval; topology-dependent window sizes (Leaf: 10–20, Intermediate: 30–50, Root: 50–100) |
| **Implementation location** | ⚠️ **Not located.** |
| **Discrepancies** | Cannot assess. |

**Note:** This is an algorithmic prescription rather than a formula, but it directly constrains implementation data structures. It should have a corresponding ring-buffer class or equivalent.

---

### Formula 5: Maturity Index (Adaptive Thresholds)

| Attribute | Detail |
|---|---|
| **Spec location** | Part 2, "Adaptive thresholds — maturity-indexed" |
| **Definition** | `maturity_index = min(1.0, 0.25 × normalize(mean_observation_depth) + 0.25 × normalize(connection_density) + 0.25 × normalize(mean_component_age) + 0.25 × normalize(mean_ΦL_ecosystem))` |
| **Implementation location** | ⚠️ **Not located.** |
| **Discrepancies** | Cannot assess. |

**Spec-internal note:** The `normalize()` function is not defined anywhere in the visible spec. This is an **ambiguity**: does it mean min-max normalization across the current graph? Z-score? Sigmoid? Implementations will diverge without clarification. Additionally, `mean_ΦL_ecosystem` creates a circular dependency if the maturity index is needed to compute ΦL thresholds which are needed to assess ΦL health across the ecosystem. The spec should clarify bootstrapping order.

---

### Formula 6: ΨH Component 1 — Structural Coherence (λ₂ / Fiedler Value)

| Attribute | Detail |
|---|---|
| **Spec location** | Part 2, "ΨH – Harmonic Signature", Component 1 |
| **Definition** | `L = D - A` (graph Laplacian); `λ₂ = second-smallest eigenvalue of L` |
| **Normalization** | "Normalise by dividing by the expected λ₂ for a composition of that size and maturity" |
| **Implementation location** | ⚠️ **Not located.** |
| **Discrepancies** | Cannot assess. |

**Spec-internal note:** The "expected λ₂ for a composition of that size and maturity" is not defined. For a random graph of *n* nodes and edge probability *p*, the expected λ₂ is well-studied (≈ np − √(2np(1−p)log n) for Erdős–Rényi). But real compositions are not random graphs. Without a reference distribution or lookup table, "normalize" is **under-specified**. An implementation will need to either (a) use an empirical baseline, (b) use a theoretical model for the expected graph family, or (c) skip normalization — each producing different ΨH values.

---

### Formula 7: ΨH Component 2 — Runtime Friction (TV_G)

| Attribute | Detail |
|---|---|
| **Spec location** | Part 2, "ΨH – Harmonic Signature", Component 2 |
| **Definition** | `TV_G(x) = Σ_{(i,j)∈E} a_ij × (x_i - x_j)²` then `friction = mean([TV_G(x) / max_TV_G(x) for x in monitored_signals])` |
| **Monitored signals** | latency, confidence, success rate, ΦL |
| **Implementation location** | ⚠️ **Not located.** |
| **Discrepancies** | Cannot assess. |

**Spec-internal note:** `max_TV_G(x)` is the theoretical maximum total variation for signal *x* on graph *G*. This equals `Σ_{(i,j)∈E} a_ij × (range_of_x)²` when the signal is maximally contrasting across every edge. If all edge weights `a_ij = 1` and signal range is [0,1], this simplifies to |E|. But the spec does not define edge weights for composition graphs. Also, computing TV_G for ΦL as a monitored signal creates another potential circularity (ΨH depends on ΦL; if ΦL depends on ΨH elsewhere in the full spec, this is circular).

---

### Formula 8: Composite ΨH

| Attribute | Detail |
|---|---|
| **Spec location** | Part 2, "Composite ΨH" |
| **Definition** | `ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)` |
| **Rationale** | Runtime friction weighted higher because it reflects actual operational coherence |
| **Implementation location** | ⚠️ **Not located.** |
| **Discrepancies** | Cannot assess. |

**Spec-internal note:** `normalize(λ₂)` inherits the ambiguity from Formula 6.

---

### Formula 9: εR — Exploration Rate

| Attribute | Detail |
|---|---|
| **Spec location** | Part 2, "εR – Exploration Rate" |
| **Definition** | `εR = exploratory_decisions / total_decisions` over a rolling observation window |
| **Thresholds** | 0.0 = Rigid (Warning), maturity-indexed bands in the adaptive threshold table |
| **Implementation location** | ⚠️ **Not located.** |
| **Discrepancies** | Cannot assess. |

**Note:** The spec text was truncated mid-table at this point. The full εR threshold table and any additional formulas below (likely covering Part 3+ content) are not available for review.

---

### Formulas Referenced in Changelog but Not Visible (Truncated)

The spec's "What changed from v1.0" section references several additional computational elements that appear later in the document but were not available due to truncation:

| Referenced Element | Status |
|---|---|
| Topology-aware dampening (replaces fixed γ=0.7) | **Formula not visible; cannot inventory** |
| Hysteresis ratio (increased from 1.5× to 2.5×) | **Formula not visible; cannot inventory** |
| Signal conditioning pipeline | **Formula not visible; cannot inventory** |
| Pulsation frequency safety limits | **Formula not visible; cannot inventory** |
| Seven CAS vulnerability watchpoints | **Formula not visible; cannot inventory** |
| Visual encoding constraints | **Formula not visible; cannot inventory** |

---

## Consolidated Findings

### Finding 1: No Implementation Files Available for Cross-Reference (CRITICAL)

**No implementation source code was provided or discoverable.** This means one of two things:

- **(a)** The implementation does not yet exist, and the Engineering Bridge is entirely aspirational — in which case, **every formula is unimplemented**, and the spec is describing aspirational features as if they are implementable today. This directly relates to the parent review's concern (item 5) about aspirational-as-implemented language.
- **(b)** The implementation exists but was not included in the task context — in which case, this report should be re-run with the actual source tree.

**Recommendation:** Determine which case applies. If (a), flag the entire Engineering Bridge as "specification only — no implementation" and create implementation tracking tickets for each formula. If (b), re-execute this task with implementation file paths.

### Finding 2: Under-Specified Parameters

Three formulas contain normalization or parameterization that is insufficiently defined for deterministic implementation:

| Formula | Under-specified element | Risk |
|---|---|---|
| F3 (Recency) | λ has no default value | Divergent implementations |
| F5 (Maturity Index) | `normalize()` function undefined | Divergent implementations |
| F6 (λ₂ normalization) | "expected λ₂ for a composition of that size" undefined | Divergent implementations; nonsensical values possible |

**Recommendation:** For each, the spec should either provide a concrete default or define the normalization function explicitly.

### Finding 3: Potential Circular Dependencies

Two dependency chains create potential circularity:

1. **Maturity Index → ΦL thresholds → ΦL assessment → mean_ΦL_ecosystem → Maturity Index** (Formula 5 depends on ecosystem ΦL; ΦL thresholds depend on Maturity Index)
2. **ΨH → TV_G(ΦL) → ΦL → (if ΦL depends on ΨH anywhere in full spec) → ΨH** (Formula 7 uses ΦL as a monitored signal for friction)

**Recommendation:** Define explicit computation order / bootstrapping procedure. The simplest resolution: compute ΦL first with fixed thresholds, then maturity index, then ΨH; apply adaptive thresholds only on the *next* cycle.

### Finding 4: v1.0 → v2.0 Migration Risk

The spec explicitly states that `grammar_alignment_factor` has been absorbed into `axiom_compliance` and that ΨH computation has been "replaced entirely." If any v1.0 implementation exists, there is a migration surface:

- Residual `grammar_alignment_factor` variables
- Old ΨH computation (whatever it was) still running
- Old fixed γ=0.7 dampening still in code
- Old hysteresis ratio of 1.5× still in constants

**Recommendation:** If any v1.0 implementation exists, conduct a grep-based audit for deprecated variable names and constants.

### Finding 5: Truncated Specification

Approximately 40-60% of the document was not available for review (truncated at ~8,000 characters, mid-sentence in the εR section). Formulas related to dampening, hysteresis, signal conditioning, pulsation safety, CAS watchpoints, and visual encoding could not be inventoried.

**Recommendation:** Re-run this analysis with the complete specification text.

---

## Summary Table

| # | Formula | Spec Section | Implementation Located? | Discrepancies |
|---|---|---|---|---|
| F1 | ΦL Health Score | Part 2, ΦL | ❌ Not found | N/A |
| F2 | ΦL Maturity Modifier | Part 2, Maturity modifier | ❌ Not found | N/A |
| F3 | Recency Weighting | Part 2, Recency weighting | ❌ Not found | λ under-specified |
| F4 | Ring Buffer (algorithmic) | Part 2, Sliding window | ❌ Not found | N/A |
| F5 | Maturity Index | Part 2, Adaptive thresholds | ❌ Not found | `normalize()` undefined; circular dependency risk |
| F6 | λ₂ Structural Coherence | Part 2, ΨH Component 1 | ❌ Not found | Normalization baseline undefined |
| F7 | TV_G Runtime Friction | Part 2, ΨH Component 2 | ❌ Not found | Edge weights undefined; circularity risk with ΦL |
| F8 | Composite ΨH | Part 2, Composite ΨH | ❌ Not found | Inherits F6 ambiguity |
| F9 | εR Exploration Rate | Part 2, εR | ❌ Not found | Spec truncated mid-definition |
| F10+ | Dampening, hysteresis, signal conditioning, pulsation, CAS, visual encoding | Parts 3+ (not visible) | ❌ Not found | Spec truncated |

**Overall status: 0 of 9+ formulas have verified implementations.**