# Engineering Bridge Formula Cross-Reference

> Task ID: t4
> Model: claude-opus-4-6:adaptive:low
> Duration: 141728ms
> Output chars: 13822
> Timestamp: 2026-03-01T01:50:51.051Z

---

# Engineering Bridge Formula Cross-Reference Analysis

## 1. Scope and Limitations

**No implementation code was provided for cross-reference.** The `Relevant Files` section contains only the Engineering Bridge specification itself. Therefore, this analysis cross-references the formulas *against themselves* — checking for internal consistency, implementability, underspecification, and contradictions that would cause any implementation to diverge from the spec's intent. Each finding below represents a concrete discrepancy an implementor would encounter.

---

## 2. Critical Discrepancies

### 2.1 ΨH Threshold Table Is Inverted Relative to the Composite Formula

**Severity: HIGH — would cause implementations to flag the wrong components.**

The composite ΨH formula:
```
ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)
```

This produces a **coherence** score: high λ₂ (connected) + low friction (resonant) → **high ΨH** → good.

But the adaptive threshold table says:

| Threshold | Young (MI < 0.3) | Maturing (0.3–0.7) | Mature (MI > 0.7) |
|---|---|---|---|
| ΨH dissonance | **> 0.25** | **> 0.20** | **> 0.15** |

The `>` operator combined with the label "dissonance" implies: *flag when the dissonance metric exceeds the threshold*. But the formula produces coherence, not dissonance. Either:
- The thresholds should be `ΨH < 0.75 / < 0.80 / < 0.85` (coherence interpretation), or
- There is an implied `dissonance = 1 - ΨH` conversion that is **never stated** in the spec.

**Recommendation:** Add an explicit `ΨH_dissonance = 1 - ΨH` definition, or rewrite the threshold table to use coherence directly with `<` operators. Without this, implementors will produce opposite alerting behavior.

---

### 2.2 `temporal_stability` Creates a Circular Dependency in ΦL

**Severity: HIGH — blocks correct implementation without an undocumented workaround.**

ΦL is defined as:
```
ΦL = w₁ × axiom_compliance + w₂ × provenance_clarity + w₃ × usage_success_rate + w₄ × temporal_stability
```

Where `temporal_stability` = "Consistency of ΦL over the observation window" (i.e., low variance of ΦL).

This is self-referential: computing ΦL requires temporal_stability, which requires historical ΦL values, which each required their own temporal_stability at computation time. An implementor must choose one of:

| Resolution Strategy | Trade-off |
|---|---|
| Compute temporal_stability from ΦL values that *exclude* the temporal_stability component | Different effective formula than spec states |
| Use ΦL from the *previous* window only | Bootstrap problem: first computation has no history |
| Define temporal_stability over the *other three factors* only | Changes the semantic meaning |

**Recommendation:** Redefine temporal_stability explicitly as variance of the *non-temporal components* (axiom_compliance, provenance_clarity, usage_success_rate) over the observation window, breaking the cycle. Alternatively, define a `ΦL_core` (without w₄) and let temporal_stability measure variance of `ΦL_core`.

---

### 2.3 Friction Computation Also Depends on ΦL, Creating a Cross-Dimension Dependency

**Severity: MEDIUM — ordering ambiguity causes non-deterministic results.**

The friction component of ΨH is defined as:
```
friction = mean([TV_G(x) / max_TV_G(x) for x in monitored_signals])
```

With "monitored_signals" listed as: *latency, confidence, success rate, ΦL*.

ΨH therefore depends on ΦL. But no computation ordering is specified. If ΦL and ΨH are computed concurrently (e.g., in a parallel pipeline), the friction calculation would use stale or undefined ΦL values.

**Recommendation:** Add an explicit computation ordering section:
1. Compute εR (no dependencies on other dimensions)
2. Compute ΦL (no dependency on ΨH or εR)
3. Compute ΨH (depends on ΦL)

---

### 2.4 `normalize()` Is Used But Never Defined

**Severity: HIGH — different normalization choices produce materially different scores.**

The function `normalize()` appears in three formulas with no definition:

| Formula | Usage | Impact of choice |
|---|---|---|
| `maturity_index` | `normalize(mean_observation_depth)`, etc. | Determines MI bands and therefore which thresholds apply |
| `ΨH composite` | `normalize(λ₂)` | Determines ΨH scale; λ₂ can range from 0 to n for a complete graph |

Min-max normalization requires known bounds (which change as the system grows). Z-score normalization can produce negative values and values > 1, violating the implicit [0, 1] range. Percentile-based normalization requires a population.

**Recommendation:** Specify normalization method, bounds, and the reference population for each usage. For λ₂, the spec already mentions normalizing "by dividing by the expected λ₂ for a composition of that size and maturity" — this should be the explicit formula in the composite ΨH equation.

---

## 3. Moderate Discrepancies

### 3.1 Two Conflicting Maturity Concepts

The spec defines two separate maturity computations:

| Concept | Formula | Used for |
|---|---|---|
| `maturity_factor` | `(1 - e^(-0.05 × obs)) × (1 - e^(-0.5 × conn))` | Multiplicative modifier on ΦL_raw |
| `maturity_index` | Weighted sum of 4 normalized ecosystem properties | Selecting adaptive threshold bands |

These are computed differently, named similarly, and serve overlapping purposes. An implementor could easily confuse them. Worse, a component could have a high `maturity_factor` (many observations, many connections) but a low `maturity_index` (young ecosystem), or vice versa — producing contradictory signals.

**Recommendation:** Rename for clarity (e.g., `observation_confidence` for the first, `ecosystem_maturity` for the second). Consider whether both are needed, or whether one can be derived from the other.

### 3.2 Sliding Window Strategy Contradicts Recency Weighting

The spec defines **two** observation weighting strategies:

1. **Count-based ring buffers** (with subtract-on-evict for O(1) retrieval) with topology-dependent window sizes (10–100 observations)
2. **Exponential recency weighting** (`observation_weight = e^(-λ × age)`) with a compaction threshold (discard when weight < 0.01)

These strategies conflict:
- Ring buffers evict by **count** (oldest leaves when buffer is full)
- Recency weighting discards by **age** (observations below weight threshold)
- A ring buffer of size 20 might retain very old observations if the component is rarely invoked; recency weighting would discard them

**Recommendation:** Specify whether recency weighting is applied *within* the ring buffer (weighting observations inside a fixed-count window) or is an *alternative* strategy. If the former, the subtract-on-evict O(1) guarantee is lost (weights change every tick).

### 3.3 `max_TV_G(x)` Normalizer Is Ambiguous

```
friction = mean([TV_G(x) / max_TV_G(x) for x in monitored_signals])
```

`max_TV_G(x)` is undefined. Candidates:

| Interpretation | Consequence |
|---|---|
| Theoretical maximum for the graph topology | Stable but requires derivation per topology |
| Observed historical maximum | Moving target; friction decreases after a spike even if nothing changes |
| Maximum across all signals at current timestep | Couples signals together; one outlier rescales all |

Division by zero occurs if all nodes have identical signal values (TV_G = 0 for all signals, so max = 0).

**Recommendation:** Define `max_TV_G` as the theoretical maximum (which for a signal range of [0,1] on a graph with m edges and max weight w_max is `m × w_max`), and add a guard for the zero case.

### 3.4 Graph Laplacian Assumes Undirected Graph

```
L = D - A    (graph Laplacian)
```

The standard graph Laplacian is defined for undirected graphs. Compositions of AI components typically have **directed** relationships (data flows from source to sink, dependency edges point one way). For a directed graph:
- A is not symmetric
- L is not symmetric
- Eigenvalues may be complex
- λ₂ as an algebraic connectivity measure loses its standard interpretation

**Recommendation:** Specify whether to symmetrize the adjacency matrix (A_sym = (A + Aᵀ)/2), use the normalized Laplacian, or restrict the Laplacian computation to a specific edge type that is inherently bidirectional.

### 3.5 axiom_compliance Penalizes Non-Applicable Axioms

```
axiom_compliance = Fraction of 10 axioms satisfied (binary per axiom)
```

If a component type makes 3 of the 10 axioms inapplicable (e.g., a static data node has no "exploration" behavior, so axioms related to εR don't apply), the maximum achievable score is 7/10 = 0.70. With w₁ = 0.4, this caps the ΦL contribution from axiom_compliance at 0.28 instead of 0.40 — a permanent 12% penalty for component type rather than quality.

**Recommendation:** Define axiom_compliance as `satisfied / applicable` rather than `satisfied / 10`, with clear criteria for when an axiom is N/A for a given component type.

---

## 4. Division-by-Zero and Edge-Case Gaps

| Formula | Condition | Result |
|---|---|---|
| `εR = exploratory / total_decisions` | `total_decisions = 0` (new component) | Division by zero |
| `TV_G(x) / max_TV_G(x)` | All signal values identical across nodes | 0/0 |
| `maturity_factor` at 0 observations | `(1 - e^0) = 0` | ΦL_effective = 0 regardless of raw score |
| `λ₂` for disconnected graph | λ₂ = 0 (multiplicity equals number of components) | normalize(0) depends on undefined normalize() |
| Recency weighting with λ = 0 | All weights = 1 (no decay) | Violates stated intent of recency |

The maturity_factor edge case deserves special attention: a **brand-new component with perfect scores across all four factors** gets ΦL_effective = 0. This cold-start problem means new components cannot be distinguished from broken components by ΦL alone.

**Recommendation:** Add a minimum floor to ΦL_effective (e.g., `max(ΦL_effective, 0.1)` for bootstrapping), or define explicit initialization semantics for new components. Add guard clauses for all division operations.

---

## 5. Missing Formulas (Referenced but Not Shown)

The "What changed from v1.0" section references several items that are either absent from the visible spec or in the truncated portion:

| Referenced Feature | Evidence of Definition | Status |
|---|---|---|
| "topology-aware dampening replaces fixed γ=0.7" | No γ or dampening formula visible | **Missing or truncated** |
| "hysteresis ratio increased from 1.5× to 2.5×" | No hysteresis formula visible | **Missing or truncated** |
| "pulsation frequency safety limits" | No pulsation formula visible | **Missing or truncated** |
| "seven CAS vulnerability watchpoints" | Not enumerated | **Missing or truncated** |
| "signal conditioning pipeline" | Not defined | **Missing or truncated** |
| "visual encoding constraints" | Not defined | **Missing or truncated** |
| Propagation rules (how ΦL changes propagate through the graph) | Referenced by window size table ("Root / coordinator") but no formula | **Missing or truncated** |

**Recommendation:** Verify these are present in the full document. If they exist only in the changelog description but not as implementable formulas, they represent spec debt.

---

## 6. Aspirational Content Presented as Implementable

| Section | Claim | Issue |
|---|---|---|
| "Threshold learning" | "Feed [FP/FN/oscillation data] into a calibration process operating monthly to quarterly" | No calibration algorithm, loss function, or update rule specified. Cannot be implemented from this description alone. |
| "Pre-composition resonance check" | "Before committing to a new composition, compute λ₂ of the proposed subgraph" | Assumes a composition orchestration system with a "commit" step exists. No API or integration point specified. |
| "State Is Structural" | "Your graph database (Neo4j, or whatever serves) is the single source of truth" | Prescribes an architectural decision without reference to actual implementation code or schema. |

These are design principles, not engineering specifications. They should be clearly labeled as architectural requirements with separate implementation tickets, not interleaved with computable formulas.

---

## 7. Summary of Findings

| # | Finding | Severity | Type |
|---|---|---|---|
| 2.1 | ΨH threshold table inverted relative to formula | **Critical** | Formula–table contradiction |
| 2.2 | ΦL temporal_stability is self-referential | **Critical** | Circular dependency |
| 2.3 | ΨH depends on ΦL with no ordering specified | Medium | Underspecification |
| 2.4 | `normalize()` undefined across three formulas | **Critical** | Underspecification |
| 3.1 | Two conflicting maturity concepts | Medium | Naming/design confusion |
| 3.2 | Ring buffer vs. recency weighting contradiction | Medium | Strategy conflict |
| 3.3 | `max_TV_G` undefined | Medium | Underspecification |
| 3.4 | Graph Laplacian assumes undirected graph | Medium | Assumption mismatch |
| 3.5 | axiom_compliance penalizes N/A axioms | Medium | Formula design flaw |
| 4 | Six division-by-zero / edge-case gaps | Medium | Missing guards |
| 5 | Six referenced features missing or truncated | Medium–High | Spec completeness |
| 6 | Three aspirational features written as implementable | Low–Medium | Spec honesty |

### Proposed Priority for Corrections

1. **Resolve ΨH polarity** (2.1) — implementors will build opposite alerting without this.
2. **Break ΦL circularity** (2.2) — no correct implementation is possible as written.
3. **Define normalize()** (2.4) — three formulas are non-deterministic without this.
4. **Specify computation ordering** (2.3) — prevents non-deterministic ΨH.
5. **Reconcile observation windowing strategies** (3.2) — pick one or define their interaction.
6. **Add edge-case guards** (4) — standard engineering hygiene.
7. **Verify truncated content** (5) — confirm six referenced features have implementable formulas.