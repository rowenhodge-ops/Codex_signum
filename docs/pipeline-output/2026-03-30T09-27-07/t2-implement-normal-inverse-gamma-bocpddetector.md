# Implement Normal-Inverse-Gamma BOCPDDetector

> Task ID: t2
> Model: claude-opus-4-6:adaptive:high
> Duration: 84560ms
> Output chars: 8724
> Timestamp: 2026-03-30T09:41:53.745Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] Task t2 references "src/signals/types.ts" but this file was not in its context

---

# Analysis: Normal-Inverse-Gamma BOCPDDetector Implementation

## 1. Mathematical Foundation

### 1.1 BOCPD Message-Passing Algorithm (Adams & MacKay 2007)

The detector maintains a **run-length distribution** `R(t)` — a probability vector where `R(t)[r]` is the posterior probability that the current run length is `r` at time `t`. At each new observation `x_t`:

1. **Predictive step**: Compute `π(x_t | r)` for each active run-length hypothesis using the Student-t marginal of the NIG posterior associated with that hypothesis.
2. **Growth**: `growth[r] = R(t-1)[r-1] · π(x_t | r) · (1 - H)` for `r ≥ 1`.
3. **Change-point mass**: `cp = Σ_r R(t-1)[r] · π(x_t | r) · H`, accumulated into `R(t)[0]`.
4. **Normalise**: Divide `[cp, growth[1], growth[2], …]` by their sum (the evidence).

The **changePointProbability** returned is `R(t)[0]` — the normalised posterior mass on run length zero. The **runLength** returned is `argmax_r R(t)[r]`.

### 1.2 NIG Conjugate Updates (Incremental Form)

For each run-length hypothesis `r`, the NIG parameters `(μ_r, κ_r, α_r, β_r)` are updated incrementally when the hypothesis grows by one step with observation `x`:

| Parameter | Update Rule | Batch Equivalence |
|-----------|-------------|-------------------|
| `κ_new` | `κ_old + 1` | `κ_0 + n` ✓ |
| `μ_new` | `(κ_old · μ_old + x) / κ_new` | Weighted mean of prior and sample mean ✓ |
| `α_new` | `α_old + 0.5` | `α_0 + n/2` ✓ |
| `β_new` | `β_old + κ_old · (x - μ_old)² / (2 · κ_new)` | Sufficient-statistics form ✓ |

**Evidence**: The β update is derived from expanding the batch formula `β_0 + ½·SS + κ_0·n·(x̄ - μ_0)²/(2·κ_n)` into a telescoping incremental form. This avoids storing raw observations or maintaining separate sum/sum-of-squares accumulators.

### 1.3 Student-t Predictive Density

Under run-length hypothesis `r` with NIG parameters `(μ_r, κ_r, α_r, β_r)`, the predictive distribution for the next observation is:

```
x ~ Student-t(ν = 2α_r, loc = μ_r, scale² = β_r · (κ_r + 1) / (α_r · κ_r))
```

The PDF requires a log-gamma function. Since there is no native `lgamma` in JavaScript/TypeScript, the implementation must include one (Lanczos approximation or Stirling series).

## 2. Internal State Design

### 2.1 Parallel Hyperparameter Arrays

The detector must maintain **four parallel arrays** — `mu[]`, `kappa[]`, `alpha[]`, `beta[]` — indexed by run length, alongside the probability vector `R[]`. At each step:

- **Grow**: Extend each array by applying the NIG update from the predecessor run-length slot.
- **Prepend prior**: Insert the original prior `(mu0, kappa0, alpha0, beta0)` at index 0 (the "new run" hypothesis).

This is the canonical approach. An alternative (maintaining only a single set of hyperparameters and recomputing) is incorrect for BOCPD because each run-length hypothesis has its own posterior.

### 2.2 Memory Growth Concern

Without truncation, all arrays grow by one element per `detect()` call. For the acceptance criteria as stated, **no truncation is required**, but the analysis recommends:

- A future `maxRunLength` config option to cap array sizes.
- Log-sum-exp normalisation to prevent underflow over long sequences.

For the current task, unbounded growth is acceptable since the spec doesn't require truncation and the primary use case (per-metric instances with periodic recalibration via `reset()`) naturally bounds lifetime.

## 3. Alignment with Acceptance Criteria

| Criterion | Implementation Approach | Risk |
|-----------|------------------------|------|
| Default export | `export default class BOCPDDetector` | None |
| Constructor defaults `(0, 1, 1, 1, 0.01)` | Spread `Partial<BOCPDConfig>` over defaults object | None |
| `detect(value)` returns `BOCPDSignal` | Implements full message-passing loop; returns `{ value, runLength, changePointProbability }` | None |
| NIG updates correct | Incremental formulas above satisfy `kappa_n = kappa + n`, `alpha_n = alpha + n/2`, `beta_n uses sufficient statistics` | Medium — β update must use the incremental form, not the batch form with stored data |
| `changePointProbability` in `[0, 1]` | Guaranteed by normalisation step; additionally clamp to handle floating-point edge cases | Low |
| `reset()` restores priors | Store original config in a readonly field; reset all arrays to `[1.0]` and hyper arrays to `[prior]` | None |
| `tsc --noEmit` passes | Must import types from `./types` as defined in t1 output; must not reference missing modules | Low — depends on t1 types being committed first |

## 4. Critical Implementation Details

### 4.1 Log-Gamma Function

**Finding**: The Student-t PDF `Γ((ν+1)/2) / (Γ(ν/2) · √(νπσ²)) · (1 + z²)^(-(ν+1)/2)` requires a log-gamma implementation. The Lanczos approximation with `g=7` and standard coefficients provides ~15 digits of precision and is compact (~20 lines). This should be a private helper, not exported.

**Recommendation**: Compute the entire predictive density in log-space to avoid overflow/underflow:

```
log_pdf = lgamma((ν+1)/2) - lgamma(ν/2) - 0.5·log(ν·π·σ²) - ((ν+1)/2)·log(1 + z²/ν)
```

Then exponentiate only when multiplying into the run-length distribution (which itself should be stored in probability space, not log space, because the normalisation step keeps values bounded).

### 4.2 First Call Edge Case

On the very first call to `detect()`, the run-length distribution is `R = [1.0]` (prior: run length 0 with probability 1). The predictive probability is computed under the prior NIG parameters. After the message-passing step, `R` becomes a two-element vector `[cp_prob, growth_prob]`.

**Finding**: The first call will always return `changePointProbability = hazardRate` (approximately), since with a single hypothesis all mass flows through the hazard split. This is expected behaviour, not a defect.

### 4.3 Mode Computation

The `runLength` field should be the **argmax** of the posterior run-length distribution. In the case of ties, the smallest run length (most conservative / most recent change point) should be preferred. This matches the `indexOf(Math.max(...R))` pattern, which naturally returns the first occurrence.

### 4.4 Numerical Edge Case: alpha < 0 or beta < 0

If the prior is mis-specified (e.g., `alpha = 0`), the Student-t degrees of freedom becomes 0, causing a degenerate distribution. The constructor should validate `alpha > 0`, `beta > 0`, `kappa > 0`, and throw a `RangeError` for invalid inputs.

## 5. Dependency on t1 Output

The implementation depends on the following types from `src/signals/types.ts` (as produced by t1):

- `BOCPDSignal` — return type of `detect()`
- `BOCPDConfig` — constructor parameter type
- `BOCPDState` — not directly needed for the detector class itself, but referenced by the persistence layer (later task)

**Finding**: The `BOCPDState` interface from t1 stores `runLengths: number[]` but does **not** store the per-run-length NIG hyperparameter arrays (`mu[]`, `kappa[]`, `alpha[]`, `beta[]`). This is a gap that will need to be addressed in the persistence task (not this task). For this task, the detector can maintain internal state that is richer than `BOCPDState`.

**Recommendation**: The detector should expose a `getState(): BOCPDState` method (or make the state extractable) for the persistence task, but this is outside the current acceptance criteria. Note this gap for the consolidation/persistence task.

## 6. Testing Implications (Context for t3)

Key test scenarios the implementation must support:

1. **Stationary sequence**: After many observations from a stable distribution, `changePointProbability` should remain low and `runLength` should grow monotonically.
2. **Mean shift**: After an abrupt shift in mean (e.g., 0 → 5), `changePointProbability` should spike and `runLength` should drop to near 0.
3. **Reset**: After `reset()`, behaviour should be identical to a fresh instance.
4. **Deterministic verification**: With a known sequence and known prior, the exact NIG posteriors and Student-t predictive probabilities can be hand-computed for the first 2–3 steps and compared.

## 7. Summary of Recommendations

1. **Use incremental NIG updates** with parallel arrays — not batch recomputation.
2. **Implement log-gamma** via Lanczos approximation as a private helper.
3. **Compute Student-t PDF in log-space** for numerical stability.
4. **Validate constructor inputs** (`kappa > 0`, `alpha > 0`, `beta > 0`, `0 < hazardRate < 1`).
5. **Store original config** immutably for `reset()`.
6. **Note the `BOCPDState` gap** — it lacks per-run-length hyperparameter arrays; flag for the persistence task.
7. **No truncation needed now**, but design the arrays so a `maxRunLength` cap can be added later without structural changes.