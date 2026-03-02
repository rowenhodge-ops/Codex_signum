# Review Engineering Bridge Part 2 Spec

> Task ID: t1
> Model: claude-opus-4-6:adaptive:low
> Duration: 64634ms
> Output chars: 8752
> Timestamp: 2026-03-02T01:13:04.424Z

---

# Spec Review: ΦL Computation in Engineering Bridge Part 2

## Summary

I have reviewed Section "Part 2: Computing the Three State Dimensions" of `docs/specs/05_codex-signum-engineering-bridge-v2_0.md`, specifically the **ΦL — Health Score** subsection. Below is a precise extraction of every normative requirement that an implementation in `src/computation/phi-l.ts` must satisfy.

---

## 1. Core Formula

The spec defines ΦL as a weighted linear combination of exactly **4 factors**:

```
ΦL = w₁ × axiom_compliance +
     w₂ × provenance_clarity +
     w₃ × usage_success_rate +
     w₄ × temporal_stability
```

**Constraint:** `w₁ + w₂ + w₃ + w₄ = 1.0`

---

## 2. Prescribed Weights

| Weight | Factor               | Value  |
|--------|----------------------|--------|
| w₁     | axiom_compliance     | **0.4** |
| w₂     | provenance_clarity   | **0.2** |
| w₃     | usage_success_rate   | **0.2** |
| w₄     | temporal_stability   | **0.2** |

The spec labels these as "Recommended weights." They are the normative default; any deviation would require justification outside the spec.

---

## 3. Factor Definitions (Semantic Contracts)

Each factor must produce a value in **[0.0, 1.0]**:

| Factor | Computation Rule | Key Details |
|--------|-----------------|-------------|
| **axiom_compliance** | Fraction of 10 axioms satisfied, each scored **binary** (pass/fail) | Subsumes the former `grammar_alignment_factor` — grammar rule adherence is folded into this factor, not computed separately. Range: 0.0 (0/10) to 1.0 (10/10). |
| **provenance_clarity** | Continuous [0.0, 1.0] | 0.0 = unknown origin; 1.0 = full chain documented (input → model → execution context traceable). |
| **usage_success_rate** | `successful_invocations / total_invocations` | Computed over a **sliding window** of recent observations (not all-time). |
| **temporal_stability** | Consistency (low variance) of ΦL over the observation window | Low variance → high stability → value near 1.0. The spec does not prescribe a specific variance formula, but the intent is clear: it measures how much ΦL has fluctuated recently. |

### Critical subtlety: axiom_compliance
The spec explicitly states axiom evaluation is **binary per axiom** — each of the 10 axioms is either satisfied (1) or not (0). The factor is the fraction `satisfied_count / 10`. There is no partial credit per axiom.

### Critical subtlety: temporal_stability is self-referential
`temporal_stability` measures consistency of ΦL itself over the observation window. This creates a mild circular dependency (ΦL depends on temporal_stability, which depends on historical ΦL). The implementation must use **prior** ΦL values (from the sliding window) to compute stability, then incorporate that into the **current** ΦL. This is standard for recursive signal metrics but must be handled correctly on initialization (no history → stability is undefined or defaults to 0).

---

## 4. Maturity Modifier

The raw ΦL is **not** the final value. The spec prescribes a maturity modifier:

```
ΦL_effective = ΦL_raw × maturity_factor
```

Where:

```
maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
```

### Key properties:
- **Two multiplicative terms** — one for observation count, one for connection count.
- **Observation decay constant:** `0.05` → at 50 observations, `(1 - e^(-2.5)) ≈ 0.918`
- **Connection decay constant:** `0.5` → at 3 connections, `(1 - e^(-1.5)) ≈ 0.777`
- **At 0 observations OR 0 connections:** maturity_factor → 0 (ΦL_effective → 0)
- **Asymptotic behavior:** approaches 1.0 as both observations and connections grow
- **Output is `ΦL_effective`**, not `ΦL_raw` — any consumer of the health score should receive the maturity-modified value

### Verification checkpoint for implementation:
The implementation must apply maturity_factor as a **post-multiplication** on the weighted sum, not as a 5th additive factor or as a modifier on individual weights.

---

## 5. Recency Weighting (for observations within the sliding window)

```
observation_weight = e^(-λ × age)
```

- `λ` is domain-dependent (model performance: half-life of days–weeks; schema definitions: half-life of months)
- **Compaction rule:** discard raw observations when `weight < 0.01` (their statistical contribution is already absorbed into running averages)
- This weighting applies to the observations used to compute `usage_success_rate` and `temporal_stability`

---

## 6. Sliding Window Implementation

- **Mechanism:** Count-based ring buffers with subtract-on-evict for O(1) snapshot retrieval
- **Window sizes are topology-dependent:**

| Node Type | Window Size N |
|-----------|--------------|
| Leaf / function | 10–20 |
| Intermediate / pattern | 30–50 |
| Root / coordinator | 50–100 |

---

## 7. Adaptive Thresholds (Maturity-Indexed)

Not part of ΦL *computation* per se, but part of ΦL *interpretation*:

```
maturity_index = min(1.0,
    0.25 × normalize(mean_observation_depth) +
    0.25 × normalize(connection_density) +
    0.25 × normalize(mean_component_age) +
    0.25 × normalize(mean_ΦL_ecosystem)
)
```

**Note:** `maturity_index` (ecosystem-wide) is distinct from `maturity_factor` (per-component). The implementation should not conflate these two concepts.

| Threshold | Young (MI < 0.3) | Maturing (0.3–0.7) | Mature (MI > 0.7) |
|-----------|-------------------|---------------------|---------------------|
| ΦL healthy | > 0.6 | > 0.7 | > 0.8 |
| ΦL degraded | < 0.4 | < 0.5 | < 0.6 |

---

## 8. Additional Spec Touchpoints Affecting ΦL

### From Part 9 (Adversarial Resilience):
> "Provenance weighting increase — Temporarily increase w₂ in ΦL calculation"

This means the implementation must support **runtime weight adjustment** for at least w₂. The weights are not compile-time constants; they are parameters that bulkhead responses can temporarily modify.

### From Part 3 (Hysteresis):
Recovery threshold for ΦL is `degradation_threshold × 2.5`. The ΦL computation itself doesn't change, but state transitions based on ΦL values use asymmetric thresholds.

### From Part 4 (Signal Conditioning):
Raw health events should pass through the 7-stage pipeline **before** being used for threshold decisions. This implies the observations feeding into `usage_success_rate` and `temporal_stability` should be conditioned signals, not raw events.

---

## 9. Checklist of Verification Points for Code Review

When reviewing `src/computation/phi-l.ts`, the following must be verified:

| # | Requirement | Source |
|---|-------------|--------|
| 1 | Exactly 4 factors in weighted sum | Part 2 formula |
| 2 | Weights are 0.4, 0.2, 0.2, 0.2 (as defaults) | Part 2 "Recommended weights" |
| 3 | Weights sum to 1.0 (invariant) | Part 2 constraint |
| 4 | axiom_compliance: binary per axiom, fraction of 10 | Part 2 factor table |
| 5 | provenance_clarity: continuous [0, 1] | Part 2 factor table |
| 6 | usage_success_rate: success/total from sliding window | Part 2 factor table |
| 7 | temporal_stability: variance-based consistency of ΦL | Part 2 factor table |
| 8 | maturity_factor formula exact: `(1 - e^(-0.05 × obs)) × (1 - e^(-0.5 × conn))` | Part 2 maturity modifier |
| 9 | maturity_factor applied as post-multiplication on raw ΦL | Part 2: `ΦL_effective = ΦL_raw × maturity_factor` |
| 10 | Output is `ΦL_effective`, not `ΦL_raw` | Part 2 maturity modifier |
| 11 | Output range is [0.0, 1.0] | Part 2 opening statement |
| 12 | Weights are configurable at runtime (not hardcoded constants) | Part 9 bulkhead response |
| 13 | No 5th factor or additional terms beyond the 4 specified | Bridge View Principle (Part 1.1) |
| 14 | No `grammar_alignment_factor` as separate factor (subsumed into axiom_compliance) | Part 2 factor table note |

---

## 10. Conclusion

The spec is clear and unambiguous on the ΦL computation. The formula is a simple weighted sum with 4 factors and fixed recommended weights, post-multiplied by a two-term maturity factor using specific exponential decay constants (`0.05` for observations, `0.5` for connections). The main implementation risks are:

1. **Getting the maturity_factor constants wrong** (0.05 and 0.5 are easy to swap or mistype)
2. **Applying maturity_factor incorrectly** (e.g., additively instead of multiplicatively, or on individual factors instead of the sum)
3. **Including a stale `grammar_alignment_factor`** as a separate 5th factor (it was absorbed into axiom_compliance in v2.0)
4. **Hardcoding weights** when they must be adjustable for adversarial resilience responses
5. **Conflating `maturity_factor`** (per-component, used in ΦL computation) with **`maturity_index`** (ecosystem-wide, used for threshold selection)

This review is complete. Ready to proceed to code comparison.