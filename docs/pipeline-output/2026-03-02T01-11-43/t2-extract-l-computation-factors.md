# Extract ΦL Computation Factors

> Task ID: t2
> Model: claude-opus-4-6:adaptive:low
> Duration: 37983ms
> Output chars: 4664
> Timestamp: 2026-03-02T01:13:44.942Z

---

# ΦL Computation Factors — Extraction from Spec

**Source:** `docs/specs/05_codex-signum-engineering-bridge-v2_0.md`, Part 2: "Computing the Three State Dimensions → ΦL — Health Score"

---

## 1. Extracted Formula

```
ΦL = w₁ × axiom_compliance +
     w₂ × provenance_clarity +
     w₃ × usage_success_rate +
     w₄ × temporal_stability

where w₁ + w₂ + w₃ + w₄ = 1.0
```

The result is a composite score bounded to **[0.0, 1.0]**.

---

## 2. Extracted Factors and Weights

| # | Factor | Weight Symbol | Weight Value | Computation (per spec) | Notes |
|---|---|---|---|---|---|
| 1 | `axiom_compliance` | w₁ | **0.4** | Fraction of 10 axioms satisfied (binary per axiom) | Includes grammar rule adherence; absorbs the former `grammar_alignment_factor` |
| 2 | `provenance_clarity` | w₂ | **0.2** | 0.0 = unknown origin, 1.0 = full chain documented | Traceability of output back to input, model, and execution context |
| 3 | `usage_success_rate` | w₃ | **0.2** | Fraction of invocations completing without error | Drawn from a sliding window of recent observations |
| 4 | `temporal_stability` | w₄ | **0.2** | Consistency of ΦL over the observation window | Low variance = stable |

**Weight sum verification:** 0.4 + 0.2 + 0.2 + 0.2 = **1.0** ✓

### Weight Distribution Observations

- `axiom_compliance` carries **double** the weight of any other factor (0.4 vs. 0.2). This makes compliance the dominant driver — a component can have perfect provenance, success rate, and stability but still score at most 0.6 if axiom compliance is zero.
- The remaining three factors are **equally weighted** at 0.2 each.
- The spec labels these as **"Recommended weights"**, implying they are defaults rather than hard-coded invariants. However, no mechanism for overriding them is specified in the Bridge document.

---

## 3. Extracted Maturity Modifier

The raw weighted sum is **not** the final ΦL. A maturity modifier is applied:

```
ΦL_effective = ΦL_raw × maturity_factor

maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
```

### Maturity Factor Properties

| Condition | maturity_factor | Effect |
|---|---|---|
| 0 observations **or** 0 connections | Approaches **0.0** | New/unconnected components are penalised to near-zero regardless of raw score |
| 50+ observations **and** 3+ connections | Approaches **1.0** | Mature, well-connected components express their full raw score |

**Key constants:**
- Observation decay rate: **0.05** (reaches ~92% at 50 observations)
- Connection decay rate: **0.5** (reaches ~78% at 3 connections, ~95% at 6 connections)

The maturity factor is a **product of two independent saturating curves**, meaning *both* conditions (sufficient observations *and* sufficient connections) must be met for full score expression. Either dimension being zero drives the entire factor to zero.

---

## 4. Additional Spec-Defined Behavioral Context

These items from Part 2 are directly relevant to correct ΦL implementation and should be checked against code:

### 4a. Recency Weighting on Observations
```
observation_weight = e^(-λ × age)
```
- λ is domain-dependent (days–weeks for model performance; months for schemas)
- **Compaction threshold:** discard raw observations when weight < 0.01

### 4b. Sliding Window Sizes (Topology-Dependent)
| Node type | Window size N |
|---|---|
| Leaf / function | 10–20 |
| Intermediate / pattern | 30–50 |
| Root / coordinator | 50–100 |

### 4c. Adversarial Override (from Part 9)
Under adversarial conditions, the spec permits **temporarily increasing w₂** (provenance_clarity weight) as a bulkhead response:
> "Provenance weighting increase — Temporarily increase w₂ in ΦL calculation"

This confirms the weights are treated as adjustable parameters, not fixed constants.

---

## 5. Summary of Extracted Specification Facts

For verification against `src/computation/phi-l.ts`, the following must hold:

| Property | Spec Value |
|---|---|
| Factor 1 name | `axiom_compliance` |
| Factor 2 name | `provenance_clarity` |
| Factor 3 name | `usage_success_rate` |
| Factor 4 name | `temporal_stability` |
| w₁ (default) | 0.4 |
| w₂ (default) | 0.2 |
| w₃ (default) | 0.2 |
| w₄ (default) | 0.2 |
| Combination method | Weighted linear sum |
| Raw score range | [0.0, 1.0] |
| Maturity factor formula | `(1 - e^(-0.05 × obs)) × (1 - e^(-0.5 × conn))` |
| Final score | `ΦL_raw × maturity_factor` |
| Maturity observation constant | 0.05 |
| Maturity connection constant | 0.5 |

All values extracted directly from `docs/specs/05_codex-signum-engineering-bridge-v2_0.md`, Part 2. No inference or interpolation was required — the spec is explicit on all points.