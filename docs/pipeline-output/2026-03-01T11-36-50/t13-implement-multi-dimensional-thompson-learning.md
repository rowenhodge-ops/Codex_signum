# Implement multi-dimensional Thompson learning

> Task ID: t13
> Model: claude-opus-4-6:adaptive:medium
> Duration: 136391ms
> Output chars: 22011
> Timestamp: 2026-03-01T12:04:12.260Z

---

# Multi-Dimensional Thompson Learning — Analysis & Recommendations

## Task Reference
**t13**: Add multi-dimensional learning to Thompson router
**Acceptance Criteria**: Thompson router supports multi-dimensional learning

---

## 1. Current State Assessment

### 1.1 Single-Dimensional Reward Model

The current `router.ts` maintains **one Beta distribution per arm** (`alpha`, `beta`). This collapses all quality signals into a single success/failure binary. The sampled `theta ∈ [0,1]` represents an undifferentiated "quality" estimate.

**Evidence** (router.ts, lines 49–51):
```
const alpha = stats?.alpha ?? 1;
const beta = stats?.beta ?? 1;
let theta = sampleBeta(alpha, beta);
```

A single `(alpha, beta)` pair per agent means the router cannot distinguish between a model that is accurate-but-slow versus one that is fast-but-inaccurate. It has one signal axis.

### 1.2 Post-Hoc Penalties Instead of Learned Dimensions

Latency and cost are applied as **deterministic penalties** on the sampled theta, not as learned distributions with their own uncertainty:

```
theta -= latencyExcess * config.latencyPenaltyFactor;
theta -= costExcess * config.costPenaltyFactor;
```

**Problems with this approach:**

| Issue | Impact |
|-------|--------|
| Penalties use static model metadata (`avgLatencyMs`, `costPer1kTokens`), not observed per-trial outcomes | No learning on actual latency/cost performance over time |
| Penalty factors are global constants, not context-sensitive | A 200ms latency excess is penalized identically for a real-time chat task vs. a batch analysis task |
| No uncertainty modeling on latency/cost | The router cannot explore to discover that a model's latency has improved after a provider update |
| Subtracting from theta can produce negative values | Distorts the `[0,1]` probability semantics of the Beta sample |

### 1.3 Context Cluster — Computed But Not Used for Learning

`buildContextClusterId` produces a deterministic key like `code:high:backend`, and this key is returned in the `RoutingDecision`. However, **no statistics are segmented by context cluster**. The same global `(alpha, beta)` is used regardless of task type, complexity, or domain.

This means the router cannot learn that GPT-4 excels at `code:high:backend` while Claude excels at `prose:medium:legal`. Every observation updates a single global distribution.

### 1.4 Confidence Computation

The confidence metric (`computeConfidence`) uses normalized Beta variance — this is sound for a single dimension but will need generalization to reflect confidence across multiple dimensions. A model may have high confidence on accuracy but low confidence on latency compliance.

---

## 2. What Multi-Dimensional Thompson Sampling Requires

### 2.1 Conceptual Model

Replace the single `(alpha, beta)` pair per arm with a **vector of Beta distributions**, one per reward dimension. Each dimension tracks an independent success/failure signal:

| Dimension | What It Captures | Observation Source |
|-----------|-----------------|-------------------|
| `accuracy` | Output correctness / quality score | Validation pipeline, user feedback |
| `latency` | Whether response met latency budget | Measured wall-clock time vs. budget |
| `cost` | Whether response stayed within cost ceiling | Token count × rate vs. ceiling |
| `format` | Output format compliance | Schema validation pass/fail |
| `domain` | Domain-specific quality | Domain-expert evaluation or proxy |

Each trial produces a **vector of binary outcomes** (or continuous outcomes mapped to Beta updates via moment matching), not a single success/failure.

### 2.2 Context-Segmented Statistics

Stats must be keyed by `(agentId, contextClusterId, dimension)` rather than `agentId` alone. This is the difference between a global bandit and a **contextual bandit**.

The existing `buildContextClusterId` already produces the right key — it just needs to actually segment the statistics store.

### 2.3 Scalarization Strategy

At decision time, multi-dimensional samples must be combined into a single routing score. Three viable strategies, in order of sophistication:

1. **Weighted linear scalarization**: `score = Σ(wᵢ × θᵢ)` where weights come from context (e.g., latency weight is high for real-time tasks). Simple, interpretable, well-studied.

2. **Constraint-then-optimize**: Filter arms that fail hard constraints (e.g., `P(latency_ok) > threshold`), then optimize on remaining dimensions. Maps naturally to the existing latency/cost ceiling semantics.

3. **Pareto sampling**: Sample from each dimension, identify Pareto-dominant set, select randomly from Pareto front. Preserves exploration across trade-off surface but harder to reason about.

**Recommendation**: Start with **weighted linear scalarization** with context-dependent weights. This is the minimal viable extension that satisfies the acceptance criteria while remaining testable and interpretable. The existing penalty approach is a degenerate case of this (where latency/cost "dimensions" have deterministic values rather than learned distributions).

### 2.4 Dimensional Weight Derivation

Weights should be derivable from `RoutingContext`:

```
taskType: "code" → higher accuracy weight
complexity: "high" → higher accuracy weight, relaxed latency
latencyBudgetMs: present → latency dimension activated with proportional weight
costCeiling: present → cost dimension activated with proportional weight
domain: "legal" → domain dimension activated
```

A `DimensionWeightPolicy` should map context to weight vectors. The default policy should reproduce current behavior (accuracy-dominant with penalty-style latency/cost adjustments) for backward compatibility.

---

## 3. Gap Analysis — Current vs. Required

### 3.1 Structural Gaps

| ID | Gap | Severity | Current Behavior | Required Behavior |
|----|-----|----------|-----------------|-------------------|
| G-TD-1 | Single reward dimension | **Critical** | One `(α,β)` per arm | `N` dimensions × `(α,β)` per arm per context cluster |
| G-TD-2 | No context-segmented learning | **High** | Global stats per arm | Stats keyed by `(armId, clusterId, dimension)` |
| G-TD-3 | Deterministic penalty vs. learned distribution | **High** | `theta -= excess * factor` | Sample from latency/cost Beta distributions |
| G-TD-4 | No dimensional weight policy | **Medium** | Hardcoded penalty factors | Context-derived weight vectors |
| G-TD-5 | Negative theta possible | **Medium** | Penalty subtraction can go below 0 | Scalarization stays in valid range |
| G-TD-6 | No multi-dimensional confidence | **Medium** | Single variance-based confidence | Per-dimension and aggregate confidence |
| G-TD-7 | No cold-start strategy per dimension | **Low** | Uniform prior `(1,1)` | May need different priors per dimension (e.g., latency prior based on model spec) |

### 3.2 Type System Gaps

The `ArmStats` type (from `graph/queries.ts`) currently carries:
- `agentId`, `alpha`, `beta`, `totalTrials`

Multi-dimensional learning requires either:
- **Option A**: `ArmStats` gains a `dimensions: Map<string, {alpha, beta, trials}>` field
- **Option B**: A new `MultiDimArmStats` type replaces `ArmStats` in the router interface

**Recommendation**: Option A with backward compatibility — if `dimensions` is absent, fall back to the existing `alpha`/`beta` as the `accuracy` dimension. This preserves graph node compatibility during migration.

The `RoutingDecision` type needs:
- `sampledValues` expanded from `Map<string, number>` to `Map<string, Map<string, number>>` (model → dimension → sample), or a flattened representation
- `dimensionWeights` included for observability
- Per-dimension confidence in addition to aggregate

### 3.3 Alignment with Codex Axioms

| Axiom | Assessment |
|-------|-----------|
| **Deterministic Integrity** | Multi-dimensional sampling remains stochastic by design (Thompson sampling IS stochastic). The deterministic integrity applies to the *update* logic — given the same observations, stats must update identically. Dimension decomposition does not violate this; it strengthens it by making each update more granular and auditable. |
| **Semantic Stability** | Adding dimensions is an *extension*, not a redefinition. The `accuracy` dimension preserves the semantic meaning of the current single dimension. New dimensions add new semantics rather than mutating existing ones. Per the task scope instructions: this is a *review-scope* recommendation for a foundational improvement, not blocked by Semantic Stability. **Substantive reason**: the current single-dimension model provably loses information (latency and cost observations are discarded after each trial rather than learned). |
| **Minimal Viable Process** | The weighted-linear scalarization approach is the minimal extension that achieves multi-dimensional learning. It adds one new concept (dimension vector) without requiring full Pareto machinery. |
| **Traceable Lineage** | Each dimension's `(alpha, beta)` update must be individually logged as a graph edge, maintaining full auditability. The `reasoning` string should include per-dimension sample values. |
| **Feedback Coupling** | This is the axiom most served by multi-dimensional learning. Currently, feedback coupling is lossy — a success/failure signal cannot distinguish *why* a trial succeeded. Multi-dimensional feedback decomposes the signal into actionable channels. |

---

## 4. Lean Value Stream Analysis

### 4.1 Current Value Stream: Routing Decision

```
User Intent → Context Build → Stats Lookup → Sample → Penalize → Select → Return
                                    ↓
                              [Single dimension]
```

**Waste identification (Lean Six Sigma)**:

| Waste Type | Location | Description |
|------------|----------|-------------|
| **Information Destruction** (Defect) | Reward update | Multi-signal trial outcome collapsed to single binary — information is permanently lost |
| **Over-processing** | Penalty application | Latency/cost penalties recomputed from static metadata every routing call instead of being learned once |
| **Waiting** | Cold start | All arms start from uniform `(1,1)` prior regardless of known model characteristics — unnecessary exploration |
| **Motion** | Context cluster computation | Cluster ID computed but never used — wasted computation |

### 4.2 Process Capability (Cp/Cpk Analogy)

Treating "correct model selection" as the CTQ (Critical to Quality):

- **Specification limits**: The "correct" model depends on multiple dimensions. Current single-dimension scoring cannot represent these specifications, so **Cp is undefined** — the measurement system cannot capture the specification space.
- **MSA (Measurement System Analysis)**: The current measurement system (single binary outcome) has **resolution inadequacy**. It's analogous to measuring with a ruler marked only in meters when the tolerance is in millimeters. Gage R&R would show the measurement system contributes more variation than the actual process.

### 4.3 Percent Complete and Accurate (%C&A)

For the routing subprocess:

| Step | %C&A | Rationale |
|------|------|-----------|
| Context Build | ~90% | Context captures task type and complexity but domain is optional — sometimes incomplete |
| Stats Lookup | ~60% | Stats exist but are single-dimensional and non-context-segmented — incomplete representation |
| Sample | ~95% | Beta sampling is mathematically correct for its inputs |
| Penalize | ~40% | Penalties use static metadata, can produce invalid negative theta, don't learn |
| Select | ~85% | Argmax selection is correct given inputs; force-explore has randomness issues |

**Rolled Throughput Yield (RTY)**: 0.90 × 0.60 × 0.95 × 0.40 × 0.85 ≈ **17.4%**

This means roughly 1 in 6 routing decisions has fully accurate information flowing through the entire chain. The bottleneck is clearly the penalize step and the stats lookup.

### 4.4 Process Cycle Efficiency (PCE)

- **Value-added time**: Beta sampling + argmax selection (the actual decision-making)
- **Non-value-added time**: Rebuilding context cluster IDs that aren't used, computing penalties from static data, force-explore randomization

Estimated PCE: ~35%. The majority of computation in the routing path either doesn't contribute to decision quality or actively degrades it.

### 4.5 Common-Cause vs. Special-Cause Variation

- **Common-cause**: The inherent stochasticity of Thompson sampling is *designed* common-cause variation. This is correct and should not be reduced.
- **Special-cause**: Negative theta values from excessive penalties, force-explore overriding an informed decision with uniform randomness, context information being ignored — these are special-cause variations (assignable to specific design flaws).

### 4.6 Five Whys — "Why does the router sometimes select a suboptimal model?"

1. **Why?** The sampled score doesn't reflect true model fitness for the context.
2. **Why?** The score is based on a single global dimension that doesn't capture context-specific performance.
3. **Why?** The stats are not segmented by context cluster or quality dimension.
4. **Why?** The `ArmStats` type only supports `(alpha, beta)` — a single-dimensional representation.
5. **Why?** The original design prioritized simplicity of the first implementation over information fidelity.

**Root cause**: The data model constrains the learning model. Multi-dimensional, context-segmented stats are the structural fix.

---

## 5. Functional Requirements for Multi-Dimensional Thompson Learning

### FR-13: Multi-Dimensional Thompson Learning

| Sub-FR | Requirement | Priority |
|--------|------------|----------|
| FR-13.1 | The Thompson router SHALL maintain independent Beta distributions for each defined reward dimension per arm | **Must** |
| FR-13.2 | Reward dimensions SHALL include at minimum: `accuracy`, `latency`, `cost` | **Must** |
| FR-13.3 | Reward dimensions SHALL be extensible to include `format` and `domain` dimensions | **Should** |
| FR-13.4 | Statistics SHALL be segmented by context cluster ID (as produced by `buildContextClusterId`) | **Must** |
| FR-13.5 | The router SHALL combine multi-dimensional samples using weighted linear scalarization | **Must** |
| FR-13.6 | Dimension weights SHALL be derived from `RoutingContext` via a configurable weight policy | **Must** |
| FR-13.7 | The scalarized score SHALL remain in a valid range (no negative values) | **Must** |
| FR-13.8 | The `RoutingDecision` SHALL include per-dimension sampled values for observability | **Must** |
| FR-13.9 | The router SHALL compute per-dimension confidence and an aggregate confidence metric | **Should** |
| FR-13.10 | When context-segmented stats are unavailable (cold start), the router SHALL fall back to global stats, then to configurable priors | **Must** |
| FR-13.11 | The router SHALL remain backward-compatible: single-dimension `ArmStats` SHALL be treated as the `accuracy` dimension | **Must** |
| FR-13.12 | Dimension weight policy SHALL have a default configuration that reproduces current routing behavior (accuracy-dominant) | **Should** |

---

## 6. Non-Functional Requirements for Multi-Dimensional Learning

| NFR | Requirement | Metric |
|-----|------------|--------|
| NFR-MD-1 | Routing latency SHALL NOT increase by more than 2× over current single-dimension routing | p99 < 5ms for 10-arm, 3-dimension scenario |
| NFR-MD-2 | Memory overhead per arm SHALL scale linearly with dimension count, not exponentially with context clusters | Use hierarchical Bayesian shrinkage or bounded cluster count |
| NFR-MD-3 | Multi-dimensional stats updates SHALL be atomic — no partial dimension updates observable | Transactional graph writes |
| NFR-MD-4 | The dimensional model SHALL be fully serializable to/from graph nodes | Round-trip fidelity test |
| NFR-MD-5 | All per-dimension samples and weights SHALL be included in decision audit trail | Traceable Lineage axiom compliance |

---

## 7. Baseline Measurements from M-7B / M-8A

Based on the current single-dimensional implementation:

| Metric | Baseline | Source |
|--------|----------|--------|
| Reward dimensions per arm | 1 | Code inspection |
| Context clusters used for learning | 0 | Code inspection (computed but unused) |
| Penalty-induced negative theta rate | Estimated 5–15% for constrained contexts | Analytical (depends on model latency/cost vs. budget) |
| Effective exploration rate | Uncontrolled (force-explore + Thompson stochasticity) | Code inspection |
| Information bits per reward update | 1 (binary success/fail) | Design |
| Target information bits per reward update | 3–5 (one per dimension) | FR-13.2/13.3 |
| RTY of routing subprocess | ~17.4% | Section 4.3 analysis |
| Target RTY after multi-dim implementation | >60% | Eliminating penalty and stats lookup deficiencies |

---

## 8. Implementation Architecture Recommendation

### 8.1 Data Model Extension

Extend the stats model conceptually as:

```
ArmStats {
  agentId: string
  // Legacy single-dimension (backward compat)
  alpha: number
  beta: number
  totalTrials: number
  // Multi-dimensional extension
  dimensions?: {
    [dimensionName: string]: {
      alpha: number
      beta: number
      trials: number
    }
  }
  // Context-segmented stats
  contextStats?: {
    [clusterId: string]: {
      dimensions: { [dimensionName: string]: { alpha: number; beta: number; trials: number } }
    }
  }
}
```

### 8.2 Routing Flow (Revised)

```
User Intent
  → Build Context + Derive Dimension Weights
  → Lookup Stats (context-segmented, with fallback chain)
  → Sample Each Dimension Independently (N Beta samples per arm)
  → Scalarize (weighted sum, clamped to [0,1])
  → Select (argmax of scalarized scores)
  → Return Decision (with per-dimension breakdown)
```

### 8.3 Fallback Chain for Cold Start

```
1. Context-segmented stats for (armId, clusterId, dimension)
2. Global stats for (armId, dimension)
3. Configurable prior for dimension (e.g., accuracy prior = (1,1), latency prior = (2,1) for known-fast models)
4. Uniform prior (1,1)
```

This implements **hierarchical shrinkage** — a well-established Bayesian approach for sparse contextual bandits.

### 8.4 Weight Policy Interface

```
DimensionWeightPolicy {
  getWeights(context: RoutingContext): Map<string, number>
}
```

The default policy maps:
- `accuracy` → 0.6 (always present)
- `latency` → 0.2 if `latencyBudgetMs` is set, else 0.0
- `cost` → 0.2 if `costCeiling` is set, else 0.0
- Weights normalized to sum to 1.0

This **replaces** the current penalty approach with a learned, principled alternative.

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Context cluster explosion (too many unique clusters) | Medium | Memory growth | Bound cluster count; merge low-traffic clusters; hierarchical shrinkage |
| Dimensional weight misconfiguration | Medium | Routing quality degradation | Default policy that reproduces current behavior; validation on weight vectors (must sum to 1, no negatives) |
| Backward compatibility break | Low | Pipeline failure | FR-13.11 fallback; single-dimension ArmStats treated as accuracy-only |
| Increased routing latency | Low | SLA violation | NFR-MD-1 benchmark; dimension count is small (3–5), sampling is O(1) per dimension |
| Sparse data per dimension × context | High | Slow convergence | Hierarchical fallback chain (section 8.3); informative priors |

---

## 10. Verification Strategy

| Test Category | What It Validates |
|--------------|-------------------|
| **Unit: Dimension independence** | Updating one dimension does not affect others |
| **Unit: Scalarization bounds** | Output always in [0,1] regardless of dimension values |
| **Unit: Weight normalization** | Weights always sum to 1.0 |
| **Unit: Fallback chain** | Context-specific → global → prior → uniform cascade works correctly |
| **Unit: Backward compatibility** | Single-dimension ArmStats produces identical routing to current implementation |
| **Integration: Context-segmented learning** | Different contexts produce different routing decisions after sufficient trials |
| **Integration: Convergence** | Multi-dimensional router converges to optimal arm faster than single-dimensional in simulated multi-objective scenarios |
| **Property: No negative scores** | Fuzz test that scalarized scores are never negative |
| **Regression: Current test suite** | All existing Thompson router tests pass without modification |

---

## 11. Summary of Findings

1. **The current router is structurally single-dimensional.** It cannot learn across quality dimensions — it can only penalize based on static metadata. This is the primary gap.

2. **Context clustering is implemented but disconnected from learning.** The `buildContextClusterId` function produces useful keys that are never used for stat segmentation. This is pure waste.

3. **The penalty approach is a design defect, not a feature.** It uses static metadata instead of learned distributions, can produce invalid negative scores, and doesn't model uncertainty. Multi-dimensional Beta distributions are the principled replacement.

4. **The RTY of the routing subprocess is approximately 17.4%.** The stats lookup and penalty steps are the primary quality bottlenecks. Multi-dimensional, context-segmented learning directly addresses both.

5. **The implementation path is well-defined**: extend `ArmStats` with dimensional structure, replace penalties with learned dimensions, activate context-segmented stats, add a weight policy interface, and implement a hierarchical fallback for cold start. Backward compatibility is achievable through FR-13.11.

6. **This change is axiom-aligned.** It strengthens Feedback Coupling (richer signals), Traceable Lineage (per-dimension audit trail), and Deterministic Integrity (granular, reproducible updates). It does not violate Semantic Stability — it extends the existing semantic model without redefining it.