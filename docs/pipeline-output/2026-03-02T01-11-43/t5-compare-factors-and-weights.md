# Compare Factors and Weights

> Task ID: t5
> Model: claude-opus-4-6:adaptive:low
> Duration: 95951ms
> Output chars: 10973
> Timestamp: 2026-03-02T01:20:10.233Z

---

# ΦL Factors & Weights Comparison — Spec vs. Code

## Summary

The code in `src/computation/phi-l.ts` is **structurally faithful** to the Engineering Bridge v2.0 Part 2 specification. All four factors are present, the weighted-sum formula is correctly implemented, and the maturity modifier is applied in the correct position (`effective = raw × maturityFactor`). However, two **verification gaps** exist due to missing file context, and several **minor divergences** are identified below.

---

## 1. Factor-by-Factor Comparison

| # | Spec Factor Name | Code Factor Name | Present? | Notes |
|---|---|---|---|---|
| 1 | `axiom_compliance` | `axiomCompliance` | ✅ | Naming follows JS camelCase convention — acceptable |
| 2 | `provenance_clarity` | `provenanceClarity` | ✅ | |
| 3 | `usage_success_rate` | `usageSuccessRate` | ✅ | |
| 4 | `temporal_stability` | `temporalStability` | ✅ | |

**Finding:** All four spec factors are present in the code. No extra factors are introduced. No factors are missing. The code does not introduce any state, variable, or factor not grounded in the spec — consistent with the Bridge View Principle (Part 1.1).

---

## 2. Formula Comparison

### Raw ΦL

**Spec:**
```
ΦL = w₁ × axiom_compliance + w₂ × provenance_clarity + w₃ × usage_success_rate + w₄ × temporal_stability
```

**Code (`computeRawPhiL`):**
```typescript
weights.axiomCompliance * factors.axiomCompliance +
weights.provenanceClarity * factors.provenanceClarity +
weights.usageSuccessRate * factors.usageSuccessRate +
weights.temporalStability * factors.temporalStability
```

**Finding:** ✅ **Exact structural match.** Each weight is paired with its corresponding factor. The summation order matches the spec's enumeration order (axiom → provenance → usage → temporal).

### Effective ΦL (Maturity Application)

**Spec:**
```
ΦL_effective = ΦL_raw × maturity_factor
```

**Code (`computePhiL`):**
```typescript
const effective = raw * maturityFactor;
```

**Finding:** ✅ **Exact match.** Maturity is applied as a multiplicative modifier on the raw score, precisely as specified.

---

## 3. Weight Comparison

### Spec Recommended Weights

| Weight | Spec Value |
|---|---|
| w₁ (axiom_compliance) | 0.4 |
| w₂ (provenance_clarity) | 0.2 |
| w₃ (usage_success_rate) | 0.2 |
| w₄ (temporal_stability) | 0.2 |
| **Sum** | **1.0** |

### Code Default Weights

The code imports `DEFAULT_PHI_L_WEIGHTS` from `../types/state-dimensions.js`. **This file was not provided as context.**

**Finding:** ⚠️ **VERIFICATION GAP — Cannot confirm default weight values.** The actual numeric values of `DEFAULT_PHI_L_WEIGHTS` cannot be verified from the provided files. If `DEFAULT_PHI_L_WEIGHTS` is set to anything other than `{ axiomCompliance: 0.4, provenanceClarity: 0.2, usageSuccessRate: 0.2, temporalStability: 0.2 }`, this constitutes a divergence.

**Recommendation:** Inspect `src/types/state-dimensions.ts` to confirm the exported `DEFAULT_PHI_L_WEIGHTS` matches `{0.4, 0.2, 0.2, 0.2}`.

### Weight Constraint Validation

**Spec:** `w₁ + w₂ + w₃ + w₄ = 1.0`

**Code (`validateWeights`):**
```typescript
if (Math.abs(sum - 1.0) > 0.001) {
  throw new Error(`ΦL weights must sum to 1.0, got ${sum.toFixed(4)}`);
}
```

**Finding:** ✅ **Match.** The sum-to-one constraint is enforced at runtime with reasonable floating-point tolerance (0.001).

---

## 4. Maturity Factor Comparison

### Spec Formula

```
maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
```

### Code

Delegated to `computeMaturityFactor(observationCount, connectionCount)` imported from `./maturity.js`. **This file was not provided as context.**

**Finding:** ⚠️ **VERIFICATION GAP — Cannot confirm maturity factor formula.** The implementation of `computeMaturityFactor` is not visible. The spec defines precise constants (`-0.05` for observations, `-0.5` for connections) that must be verified in `src/computation/maturity.ts`.

**Recommendation:** Inspect `src/computation/maturity.ts` to confirm:
1. The formula is `(1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))`
2. The two exponential terms are multiplied (not added, averaged, or otherwise combined)
3. The constants are exactly `0.05` and `0.5`

---

## 5. Factor Computation Detail Divergences

### 5a. `axiom_compliance` — Axiom Count Flexibility

**Spec:** "Fraction of **10 axioms** satisfied (binary per axiom)"

**Code (`computeAxiomComplianceFactor`):**
```typescript
export function computeAxiomComplianceFactor(
  compliance: Record<string, boolean>,
): number {
  const axiomKeys = Object.keys(compliance);
  if (axiomKeys.length === 0) return 0;
  const satisfied = axiomKeys.filter((k) => compliance[k]).length;
  return satisfied / axiomKeys.length;
}
```

**Finding:** 🔶 **Minor divergence.** The spec explicitly says "10 axioms." The code accepts any number of keys and divides by `axiomKeys.length` rather than by a fixed denominator of 10. This means:
- Passing 5 axioms with all satisfied yields 1.0, not 0.5.
- Passing 12 keys would work without error.

**Assessment:** This is defensible as a generalization (the Codex could evolve to have more axioms, and the fraction-of-satisfied approach is conceptually correct). However, the spec is explicit about "10 axioms." A strict reading requires either (a) enforcing exactly 10 keys, or (b) always dividing by 10.

**Severity:** Low. The formula is conceptually correct. The "10" in the spec describes the current Codex axiom set, not a mathematical constant.

### 5b. `temporal_stability` — Two Divergent Implementations

The code provides **two different formulas** for temporal stability:

**Implementation 1 — `computeTemporalStability` (coefficient of variation):**
```
stability = 1 - (stddev / mean)
```

**Implementation 2 — `computeTemporalStabilityFromState` (normalized variance):**
```
stability = 1 - (variance / MAX_EXPECTED_VARIANCE)
```
where `MAX_EXPECTED_VARIANCE = 0.04`

**Spec says:** "Consistency of ΦL over the observation window" with the note "Low variance = stable."

**Finding:** 🔶 **Divergence — dual formulas with different behavior.**

| Scenario | CV-based (impl 1) | Variance-based (impl 2) |
|---|---|---|
| mean=0.8, stddev=0.1 | 1 - 0.125 = **0.875** | 1 - 0.01/0.04 = **0.75** |
| mean=0.3, stddev=0.1 | 1 - 0.333 = **0.667** | 1 - 0.01/0.04 = **0.75** |
| mean=0.8, stddev=0.2 | 1 - 0.25 = **0.75** | 1 - 0.04/0.04 = **0.0** |

The CV-based approach is mean-sensitive (same absolute variance looks worse at low means). The variance-based approach is mean-independent but depends on the `MAX_EXPECTED_VARIANCE` constant, which is **not specified in the Engineering Bridge**.

**Assessment:** The spec does not prescribe a specific formula, only "low variance = stable." The variance-based approach (Implementation 2) more directly implements "low variance = stable." The `MAX_EXPECTED_VARIANCE = 0.04` constant is an engineering decision not grounded in the spec — this is a minor Bridge View Principle concern (introducing a parameter not defined in the Codex or Bridge).

**Severity:** Medium. Consumers of this module could get meaningfully different stability values depending on which function they call.

### 5c. `provenance_clarity` — No Computation Helper

**Spec:** "0.0 = unknown origin, 1.0 = full chain documented. Can you trace any output back to its input, model, and execution context?"

**Code:** No dedicated `computeProvenanceClarityFactor` function is provided. The caller must supply this value directly.

**Finding:** ℹ️ **Not a divergence**, but an asymmetry. Three of four factors have helper functions (`computeAxiomComplianceFactor`, `computeUsageSuccessRate`, `computeTemporalStability`). Provenance clarity does not. This is reasonable since provenance assessment is domain-specific and may not be reducible to a simple formula.

---

## 6. Code Additions Beyond Spec

| Addition | Spec Basis | Concern? |
|---|---|---|
| `PhiLTrend` (improving/declining/stable with ±0.02 band) | Not in ΦL formula | No — supplementary diagnostic, not part of the ΦL value itself |
| `PHI_L_WINDOW_SIZES` constants | Bridge Part 2 sliding window table | No — direct translation of spec table |
| `PhiLState` ring buffer management | Bridge Part 2 "count-based ring buffers" | No — implementation of spec guidance |
| `MAX_EXPECTED_VARIANCE = 0.04` | Not in spec | **Minor concern** — parameter not grounded in spec or Codex |
| `computedAt: new Date()` timestamp on result | Not in spec | No — operational metadata, not part of the formula |

**Finding:** The code does not introduce new factors, new weights, or new formula terms. Additions are either direct translations of spec guidance (window sizes, ring buffers) or supplementary diagnostics (trend). The `MAX_EXPECTED_VARIANCE` constant is the only ungrounded parameter.

---

## 7. Consolidated Findings

| # | Finding | Severity | Type |
|---|---|---|---|
| **V-1** | `DEFAULT_PHI_L_WEIGHTS` values cannot be verified (file not provided) | **High** | Verification gap |
| **V-2** | `computeMaturityFactor` implementation cannot be verified (file not provided) | **High** | Verification gap |
| **D-1** | `computeAxiomComplianceFactor` uses dynamic key count instead of fixed 10 | Low | Minor divergence |
| **D-2** | Two temporal stability formulas with different behavior (CV vs. normalized variance) | Medium | Divergence |
| **D-3** | `MAX_EXPECTED_VARIANCE = 0.04` is an ungrounded parameter | Low | Bridge View Principle concern |
| **C-1** | All 4 factors present and correctly named | — | Confirmed match |
| **C-2** | Weighted sum formula structurally matches spec | — | Confirmed match |
| **C-3** | Maturity applied as multiplicative modifier (`effective = raw × maturityFactor`) | — | Confirmed match |
| **C-4** | Weight sum-to-one constraint enforced at runtime | — | Confirmed match |
| **C-5** | Factor values validated to [0, 1] range | — | Confirmed match |

---

## 8. Recommendations

1. **Resolve V-1:** Read `src/types/state-dimensions.ts` and confirm `DEFAULT_PHI_L_WEIGHTS` equals `{ axiomCompliance: 0.4, provenanceClarity: 0.2, usageSuccessRate: 0.2, temporalStability: 0.2 }`.

2. **Resolve V-2:** Read `src/computation/maturity.ts` and confirm the formula `(1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))` with exact constants.

3. **Address D-2:** Designate one temporal stability formula as canonical for ΦL computation. Document the other as an alternative or remove it. The variance-based approach (`computeTemporalStabilityFromState`) more directly matches the spec's "low variance = stable" language.

4. **Address D-3:** Either define `MAX_EXPECTED_VARIANCE` in the spec/Codex (as an axiom-defined parameter) or derive it from spec-grounded quantities. Currently it has no traceability to the grammar.

5. **Consider D-1:** If strictness is desired, add a guard that `axiomKeys.length === 10` or at minimum log a warning when the count differs from the Codex's defined axiom set.