# Review Maturity Factor Application in Spec

> Task ID: t6
> Model: claude-opus-4-6:adaptive:low
> Duration: 74498ms
> Output chars: 8918
> Timestamp: 2026-03-02T01:15:01.597Z

---

# Analysis: Maturity Factor Application in Engineering Bridge Part 2

## Summary

The Engineering Bridge v2.0 defines **two distinct maturity-related concepts** within the ΦL computation section. Both must be understood clearly to verify any implementation. This analysis documents their definitions, purposes, mathematical properties, and the relationship between them.

---

## Finding 1: Maturity Factor — Per-Component Multiplicative Modifier

### Definition (from spec)

```
ΦL_effective = ΦL_raw × maturity_factor

maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
```

### Purpose

The maturity factor prevents newly introduced or structurally isolated components from reporting artificially high health. A component with zero observations or zero connections will always have `ΦL_effective = 0`, regardless of how favorable its raw factor scores may appear.

### Mathematical Properties

| Property | Detail |
|---|---|
| **Range** | [0.0, 1.0) — asymptotically approaches but never reaches 1.0 |
| **Application** | Multiplicative — can only *reduce* ΦL_raw, never increase it |
| **Structure** | Product of two independent exponential saturation curves |
| **Zero-forcing** | Either `observations = 0` OR `connections = 0` forces the entire factor to 0 |

### Saturation Behavior — Observations Curve `(1 - e^(-0.05 × observations))`

| Observations | Curve Value | Interpretation |
|---|---|---|
| 0 | 0.000 | No data — fully suppressed |
| 10 | 0.394 | Early — significant suppression |
| 20 | 0.632 | Growing — still notably reduced |
| 50 | 0.918 | Approaching saturation — spec calls this "approaches 1.0" |
| 100 | 0.993 | Effectively saturated |

**Rate constant 0.05**: Designed so ~50 observations are needed to reach ~92% saturation. This is deliberate — the spec states *"At 50+ observations...maturity_factor approaches 1.0."*

### Saturation Behavior — Connections Curve `(1 - e^(-0.5 × connections))`

| Connections | Curve Value | Interpretation |
|---|---|---|
| 0 | 0.000 | Isolated — fully suppressed |
| 1 | 0.394 | Minimal connectivity — heavily suppressed |
| 2 | 0.632 | Some connectivity |
| 3 | 0.777 | Spec says "3+ connections...approaches 1.0" |
| 5 | 0.918 | Effectively saturated |
| 10 | 0.993 | Fully saturated |

**Rate constant 0.5**: Ten times faster than the observation curve. The spec requires far fewer connections than observations for saturation. This reflects the design intent: structural presence is established quickly (a few connections), but trustworthy health data requires sustained observation.

### Combined Behavior Example

A component with 20 observations and 2 connections:
```
maturity_factor = 0.632 × 0.632 = 0.400
```
Even with a perfect ΦL_raw = 1.0, this component's effective score would be 0.40 — placing it in "degraded" territory under mature thresholds. This is by design: the system does not trust young components.

### Key Implementation Constraints

1. **Application order**: The maturity factor is applied **after** the weighted sum of the four factors, not to individual factors.
2. **Product, not sum**: The two exponential terms are **multiplied**, creating an AND-gate. Both conditions (observed AND connected) must be met.
3. **No clamping required**: Since `ΦL_raw ∈ [0, 1]` and `maturity_factor ∈ [0, 1)`, the product is naturally bounded in `[0, 1)`.
4. **Constants are normative**: `0.05` and `0.5` are the specified rate constants. Implementations must use these values exactly.

---

## Finding 2: Maturity Index — Ecosystem-Level Threshold Selector

### Definition (from spec)

```
maturity_index = min(1.0,
    0.25 × normalize(mean_observation_depth) +
    0.25 × normalize(connection_density) +
    0.25 × normalize(mean_component_age) +
    0.25 × normalize(mean_ΦL_ecosystem)
)
```

### Purpose

The maturity index modulates *which thresholds apply* across the entire ecosystem. It determines whether the system is "Young," "Maturing," or "Mature," and selects corresponding threshold values for ΦL, εR, and ΨH.

### Distinction from Maturity Factor

| Aspect | Maturity Factor | Maturity Index |
|---|---|---|
| **Scope** | Per-component | Ecosystem-wide |
| **Inputs** | Component's own observations + connections | Ecosystem-wide normalized averages |
| **Application** | Multiplicative modifier on ΦL_raw | Selector for threshold bands |
| **Formula type** | Product of two exponentials | Equally-weighted sum of four normalized terms |
| **Output range** | [0.0, 1.0) | [0.0, 1.0] (clamped by min) |
| **Where used** | ΦL computation pipeline | Adaptive threshold table lookup |

### Threshold Selection (controlled by maturity_index)

| Threshold | Young (MI < 0.3) | Maturing (0.3–0.7) | Mature (MI > 0.7) |
|---|---|---|---|
| ΦL healthy | > 0.6 | > 0.7 | > 0.8 |
| ΦL degraded | < 0.4 | < 0.5 | < 0.6 |
| εR stable range | 0.10–0.40 | 0.05–0.30 | 0.01–0.15 |
| ΨH dissonance | > 0.25 | > 0.20 | > 0.15 |

As the ecosystem matures, thresholds become *stricter*. A mature ecosystem demands higher ΦL for "healthy" and narrower εR for "stable."

### Key Implementation Constraint

The `normalize()` function is **not defined** in the spec. Implementations must choose a normalization strategy (e.g., min-max over the ecosystem, z-score, domain-specific bounds). This is an area where divergence between spec and code is likely and must be carefully documented.

---

## Finding 3: Full ΦL Computation Chain

Combining all elements, the complete ΦL computation order as specified is:

```
Step 1: Compute four raw factors
   - axiom_compliance    ∈ [0, 1]  (fraction of 10 axioms satisfied)
   - provenance_clarity  ∈ [0, 1]  (origin chain completeness)
   - usage_success_rate  ∈ [0, 1]  (from sliding window)
   - temporal_stability  ∈ [0, 1]  (consistency of ΦL over window)

Step 2: Weighted sum
   ΦL_raw = 0.4 × axiom_compliance
          + 0.2 × provenance_clarity
          + 0.2 × usage_success_rate
          + 0.2 × temporal_stability

Step 3: Apply maturity factor
   maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
   ΦL_effective = ΦL_raw × maturity_factor
```

**Note:** The recency weighting (`observation_weight = e^(-λ × age)`) is applied *within* the sliding window when computing individual factor values (particularly `usage_success_rate` and `temporal_stability`). It is **not** an additional modifier applied alongside the maturity factor. This is a subtle ordering distinction that implementations could get wrong.

---

## Finding 4: Circular Dependency in `temporal_stability`

The spec defines `temporal_stability` as *"Consistency of ΦL over the observation window."* However, ΦL itself depends on temporal_stability. This creates a potential circular dependency:

- To compute ΦL at time *t*, you need temporal_stability at time *t*.
- Temporal_stability at time *t* measures variance of ΦL over the recent window.

**Resolution implied by spec**: Temporal stability should be computed from **historical** ΦL values (the rolling window of prior observations), not including the current computation. The current ΦL is computed using the stability of *past* ΦL values. This breaks the circularity but requires implementations to maintain a history of ΦL_effective values.

---

## Finding 5: Interaction Between Maturity Factor and Adaptive Thresholds

There is an important interaction effect: the maturity factor suppresses ΦL_effective for young components, while the maturity index relaxes thresholds for young ecosystems. These work in the **same direction** — both are lenient toward new components/ecosystems. However, a young component in a mature ecosystem faces a double penalty:

1. Its ΦL_effective is suppressed by the maturity factor (few observations/connections).
2. The mature ecosystem applies strict thresholds (ΦL healthy > 0.8).

This is likely intentional — mature ecosystems should be skeptical of new, unproven components — but implementations should be aware that newly introduced components in mature ecosystems will almost certainly start in "degraded" state.

---

## Recommendations for Code Verification (Task Context)

When reviewing `src/computation/phi-l.ts` against this spec, verify:

1. **Maturity factor formula**: Both exponential terms present, multiplied (not summed), with constants exactly `0.05` and `0.5`.
2. **Application order**: Maturity factor applied to the **result** of the weighted sum, not to individual factors.
3. **Zero behavior**: `observations = 0` or `connections = 0` must produce `ΦL_effective = 0`.
4. **Distinction maintained**: Maturity factor (per-component, multiplicative) must not be confused with or merged into maturity index (ecosystem-wide, threshold selector).
5. **No additional clamping**: The formula naturally stays in [0, 1); extra clamping would mask bugs.
6. **Temporal stability computation**: Uses historical ΦL values, not current-cycle values.