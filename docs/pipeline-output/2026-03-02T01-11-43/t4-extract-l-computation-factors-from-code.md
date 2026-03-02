# Extract ΦL Computation Factors from Code

> Task ID: t4
> Model: claude-opus-4-6:adaptive:low
> Duration: 37376ms
> Output chars: 5248
> Timestamp: 2026-03-02T01:17:30.176Z

---

# ΦL Computation Factor & Weight Extraction — Analysis

## 1. Extracted Factors

The `computeRawPhiL` function (lines 108–115) explicitly computes the weighted sum over exactly **4 factors**, accessed from the `PhiLFactors` object:

| # | Factor Name (code property) | Spec Name (Engineering Bridge §Part 2) | Match? |
|---|---|---|---|
| 1 | `factors.axiomCompliance` | axiom_compliance | ✅ Yes |
| 2 | `factors.provenanceClarity` | provenance_clarity | ✅ Yes |
| 3 | `factors.usageSuccessRate` | usage_success_rate | ✅ Yes |
| 4 | `factors.temporalStability` | temporal_stability | ✅ Yes |

**Evidence** — from `computeRawPhiL` (line 108–115):
```typescript
return (
  weights.axiomCompliance * factors.axiomCompliance +
  weights.provenanceClarity * factors.provenanceClarity +
  weights.usageSuccessRate * factors.usageSuccessRate +
  weights.temporalStability * factors.temporalStability
);
```

All four factors are present, none are missing, and no extraneous factors are included.

---

## 2. Extracted Weights

### Weight Structure

The weights object (`PhiLWeights` type) contains exactly 4 fields corresponding 1:1 to the 4 factors:

| Weight Property | Paired Factor |
|---|---|
| `weights.axiomCompliance` | `factors.axiomCompliance` |
| `weights.provenanceClarity` | `factors.provenanceClarity` |
| `weights.usageSuccessRate` | `factors.usageSuccessRate` |
| `weights.temporalStability` | `factors.temporalStability` |

### Default Weight Values

The default weights are imported from a separate module:

```typescript
import { DEFAULT_PHI_L_WEIGHTS } from "../types/state-dimensions.js";
```

And applied as the default parameter in `computePhiL` (line 77):

```typescript
weights: PhiLWeights = DEFAULT_PHI_L_WEIGHTS,
```

> **⚠️ Critical gap**: The actual numeric values of `DEFAULT_PHI_L_WEIGHTS` are **not defined in this file**. They reside in `src/types/state-dimensions.ts`. Without that file provided as context, the expected values **(0.4, 0.2, 0.2, 0.2)** per the Engineering Bridge spec cannot be confirmed from this file alone.

### Weight Validation

The code **does** enforce that weights sum to 1.0 (lines 236–244):

```typescript
function validateWeights(weights: PhiLWeights): void {
  const sum =
    weights.axiomCompliance +
    weights.provenanceClarity +
    weights.usageSuccessRate +
    weights.temporalStability;

  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(`ΦL weights must sum to 1.0, got ${sum.toFixed(4)}`);
  }
}
```

This is consistent with the spec's prescribed weights of 0.4 + 0.2 + 0.2 + 0.2 = 1.0. The tolerance of ±0.001 is appropriate for floating-point arithmetic.

---

## 3. Formula Verification

### Raw ΦL

| Aspect | Spec (Engineering Bridge §Part 2) | Code | Match? |
|---|---|---|---|
| Formula | `raw = Σ(wᵢ × fᵢ)` | `weights.X * factors.X` summed for all 4 | ✅ Yes |
| Factor count | 4 | 4 | ✅ Yes |
| Factor domain | [0, 1] each | Validated at lines 226–233 | ✅ Yes |

### Maturity Factor

The JSDoc (line 14) documents:
```
maturityFactor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
```

The implementation delegates to:
```typescript
const maturityFactor = computeMaturityFactor(observationCount, connectionCount);
```

imported from `./maturity.js`.

> **⚠️ Secondary gap**: The maturity factor formula's correctness depends on `src/computation/maturity.ts`, which is not provided. The delegation itself is clean and correct, but the actual exponential constants (0.05, 0.5) must be verified in that file.

### Effective ΦL

```typescript
const effective = raw * maturityFactor;
```

This matches the spec's `effective = raw × maturityFactor`. ✅

---

## 4. Summary of Findings

| Item | Status | Notes |
|---|---|---|
| 4 factors present | ✅ Confirmed | axiomCompliance, provenanceClarity, usageSuccessRate, temporalStability |
| Factor names match spec | ✅ Confirmed | camelCase in code ↔ snake_case in spec (naming convention difference only) |
| 4 weight fields present | ✅ Confirmed | 1:1 correspondence with factors |
| Weights sum validated to 1.0 | ✅ Confirmed | Tolerance ±0.001 |
| Raw = weighted sum | ✅ Confirmed | Direct linear combination |
| Effective = raw × maturity | ✅ Confirmed | Single multiplication |
| Default weight **values** (0.4, 0.2, 0.2, 0.2) | ⚠️ Cannot confirm | Defined in `src/types/state-dimensions.ts` — not provided |
| Maturity factor formula (exponential constants) | ⚠️ Cannot confirm | Defined in `src/computation/maturity.ts` — not provided |

---

## 5. Recommendations

1. **Verify `DEFAULT_PHI_L_WEIGHTS`** in `src/types/state-dimensions.ts` — confirm the values are exactly `{ axiomCompliance: 0.4, provenanceClarity: 0.2, usageSuccessRate: 0.2, temporalStability: 0.2 }`. This is the single most important verification gap for this task.

2. **Verify `computeMaturityFactor`** in `src/computation/maturity.ts` — confirm the exponential constants match `(1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))`.

3. **No divergences found within this file** — the factor extraction, weighted sum formula, and multiplication by maturity factor all structurally match the Engineering Bridge Part 2 specification. The architecture is sound; only the imported constants need cross-file verification.