# Review Maturity Factor Application in Code

> Task ID: t7
> Model: claude-opus-4-6:adaptive:low
> Duration: 59453ms
> Output chars: 7576
> Timestamp: 2026-03-02T01:16:49.936Z

---

# Review: Maturity Factor Application in `src/computation/phi-l.ts`

## Summary

The maturity factor serves as a **global confidence dampener** on the raw ΦL score. New or poorly-connected nodes are penalised regardless of their raw factor quality; mature, well-connected nodes asymptotically converge to their raw score. The application model is straightforward and clearly expressed in the code.

---

## How Maturity Is Applied

### Documented Formula (file header, lines 12–14)

```
raw = Σ(wᵢ × fᵢ)
maturityFactor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
effective = raw × maturityFactor
```

### Code Implementation (lines 79–87 of `computePhiL`)

```ts
const raw = computeRawPhiL(factors, weights);
const maturityFactor = computeMaturityFactor(observationCount, connectionCount);
const effective = raw * maturityFactor;
```

**Mechanics:**

| Step | Description |
|------|-------------|
| 1. Weighted sum | `raw` is computed as a standard linear combination of the 4 factors |
| 2. Maturity factor | Delegated to `computeMaturityFactor()` from `./maturity.ts` |
| 3. Multiplicative application | `effective = raw × maturityFactor` — a single scalar multiplication |

The maturity factor is **not** applied per-factor. It is a single global multiplier on the already-combined raw score. This is consistent with the spec formula where maturity operates on `raw` as a whole, not on individual `fᵢ`.

---

## Two-Component Saturation Curves

The maturity factor is the **product** of two independent exponential saturation terms:

### Observation Maturity: `(1 - e^(-0.05 × observations))`

| Observations | Factor value | Interpretation |
|-------------|-------------|----------------|
| 0 | 0.000 | No data → no trust |
| 1 | 0.049 | Essentially untrusted |
| 10 | 0.394 | Low confidence |
| 20 | 0.632 | Moderate confidence |
| 60 | 0.950 | Near-saturation |
| 100 | 0.993 | Fully mature |

**Rate constant 0.05** yields a characteristic scale of ~20 observations for meaningful trust and ~60 for near-saturation.

### Connection Maturity: `(1 - e^(-0.5 × connections))`

| Connections | Factor value | Interpretation |
|------------|-------------|----------------|
| 0 | 0.000 | Isolated → no trust |
| 1 | 0.394 | Weakly connected |
| 3 | 0.777 | Moderate connectivity |
| 6 | 0.950 | Near-saturation |
| 10 | 0.993 | Fully connected |

**Rate constant 0.5** saturates much faster — by ~6 connections the factor is negligible. This reflects that connectivity matters quickly but has diminishing returns.

### Combined Behavior (selected examples)

| Observations | Connections | Maturity Factor | Meaning |
|-------------|------------|----------------|---------|
| 0 | 0 | 0.000 | Completely new — effective ΦL is 0 |
| 1 | 1 | 0.019 | Nearly zero — heavy dampening |
| 20 | 5 | 0.580 | Moderate — still significantly suppressed |
| 60 | 6 | 0.903 | Approaching full trust |
| 100 | 10 | 0.987 | Essentially raw = effective |

---

## Key Design Observations

### 1. Maturity Is Transparent in the Result Object

The `PhiL` return type (line 91) includes `maturityFactor` as a named field alongside `raw` and `effective`. Any consumer can inspect the decomposition. This supports the Codex Signum principle that ΦL is "NEVER a single number."

### 2. Trend Uses Post-Maturity Values

```ts
const trend = computeTrend(effective, previousPhiL);
```

Trend is calculated from the **effective** (maturity-adjusted) value, not from raw. This is correct: the trend should reflect the signal that downstream consumers actually see. However, it means a node that is gaining maturity (more observations/connections over time) will show an "improving" trend even if its raw factor scores are unchanged. This is arguably desirable — a node *is* becoming more trustworthy as it matures.

### 3. Temporal Stability Feedback Loop (Stateful Variant)

In `computePhiLWithState`, the ring buffer stores **effective** ΦL values (post-maturity). Temporal stability is then derived from variance of these effective values. This creates a feedback path:

```
maturityFactor → effective → ring buffer → temporalStability factor → raw → effective
```

For a rapidly maturing node (observation count climbing), the effective values will trend upward even with stable raw factors, potentially *reducing* temporal stability and creating a temporary self-correcting dampening effect. This is mathematically sound but worth being aware of.

### 4. Zero-Observation / Zero-Connection Edge Case

When either `observationCount` or `connectionCount` is 0, maturityFactor = 0, forcing `effective = 0` regardless of raw scores. This is a hard floor — even a node with perfect axiom compliance reads as ΦL effective = 0 until it has at least one observation AND one connection. This is a strong design choice aligned with "no observation, no trust."

---

## Verification Gaps

### Cannot Verify `computeMaturityFactor` Constants

The actual formula implementation lives in `src/computation/maturity.ts`, which was **not provided** as a relevant file. The documented constants (0.05, 0.5) in the `phi-l.ts` header comment cannot be confirmed against the implementation without that file.

**Recommendation:** The maturity module (`src/computation/maturity.ts`) should be reviewed as a follow-up to confirm:
- The exponential formula matches: `(1 - e^(-0.05 × obs)) × (1 - e^(-0.5 × conn))`
- Input validation (non-negative integers) exists
- Edge cases (0, very large values) are handled

### Cannot Cross-Reference Against Spec Document

The specification file `docs/specs/05_codex-signum-engineering-bridge-v2_0.md` was referenced but not provided. The analysis is based on the formula documented in the code's JSDoc header. If the spec uses different constants, a different functional form, or specifies per-factor maturity adjustments, those divergences would not be caught by this review.

---

## Findings Summary

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Maturity is applied as a single multiplicative factor on raw ΦL | — | Understood; matches documented formula |
| 2 | Two-component product (observation × connection saturation) | — | Understood; clean separation of concerns |
| 3 | Effective ΦL = 0 when observations or connections = 0 | Note | Hard floor by design; consistent with spec intent |
| 4 | Trend computed post-maturity, meaning maturity growth alone can drive "improving" trend | Note | Arguably correct but may surprise consumers |
| 5 | Ring buffer stores effective (not raw) values, creating a maturity↔stability feedback loop | Note | Mathematically sound; self-correcting |
| 6 | `computeMaturityFactor` implementation in `maturity.ts` not available for verification | Gap | **Recommend follow-up review of `src/computation/maturity.ts`** |
| 7 | Spec document not available for cross-reference | Gap | **Recommend explicit spec-vs-code comparison once spec is available** |

---

## Conclusion

The maturity factor application in `phi-l.ts` is **well-structured and clearly documented**. The multiplicative model `effective = raw × maturityFactor` is simple, transparent, and correctly positioned in the computation pipeline. The code exposes the maturity factor in the result object, validates inputs, and handles the stateful variant cleanly by delegating back to the core function.

The primary outstanding risk is that the **actual constants and formula shape** inside `computeMaturityFactor` (in `maturity.ts`) have not been verified against the Engineering Bridge spec. This should be the next review step.