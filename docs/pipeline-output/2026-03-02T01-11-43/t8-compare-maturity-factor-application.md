# Compare Maturity Factor Application

> Task ID: t8
> Model: claude-opus-4-5:extended:8k
> Duration: 38556ms
> Output chars: 5314
> Timestamp: 2026-03-02T01:18:13.728Z

---

# Maturity Factor Application Analysis

## Task: Compare Maturity Factor Application (t8)

Comparing how the maturity factor is applied in the Engineering Bridge specification versus the `phi-l.ts` implementation.

---

## Specification Reference

**From Engineering Bridge v2.0, Part 2 — ΦL Health Score:**

```
Maturity modifier:

ΦL_effective = ΦL_raw × maturity_factor

maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
```

The spec also states:
> "At 50+ observations and 3+ connections, maturity_factor approaches 1.0. At 0 observations or 0 connections, it approaches 0."

---

## Code Implementation Evidence

### 1. Docstring Formula (Lines 3-17)

```typescript
/**
 * Formula:
 *   raw = Σ(wᵢ × fᵢ)   where i ∈ {axiom, provenance, success, stability}
 *   maturityFactor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
 *   effective = raw × maturityFactor
 */
```

**Finding:** ✅ **MATCH** — The documented formula in the code header matches the spec exactly.

### 2. Application Pattern (Lines 68-79)

```typescript
// Raw weighted sum
const raw = computeRawPhiL(factors, weights);

// Maturity adjustment
const maturityFactor = computeMaturityFactor(
  observationCount,
  connectionCount,
);

// Effective = raw × maturity
const effective = raw * maturityFactor;
```

**Finding:** ✅ **MATCH** — The application pattern follows the spec:
- Raw ΦL computed first
- Maturity factor computed from observation and connection counts
- Effective = raw × maturityFactor (multiplicative application)

### 3. Parameter Passing

The `computePhiL` function signature:
```typescript
export function computePhiL(
  factors: PhiLFactors,
  observationCount: number,
  connectionCount: number,
  ...
)
```

The maturity factor computation receives:
```typescript
const maturityFactor = computeMaturityFactor(
  observationCount,
  connectionCount,
);
```

**Finding:** ✅ **MATCH** — Both required parameters (observations, connections) are correctly passed.

### 4. Return Object Structure (Lines 85-94)

```typescript
return {
  factors,
  weights,
  raw,
  maturityFactor,
  effective,
  trend,
  observationCount,
  connectionCount,
  computedAt: new Date(),
};
```

**Finding:** ✅ **COMPLIANT** — The `maturityFactor` is preserved in the return object, enabling:
- Auditability (can inspect what maturity adjustment was applied)
- Debugging (can verify maturity calculation independently)

---

## Divergences Identified

### Divergence 1: Formula Implementation Not Visible

| Aspect | Status |
|--------|--------|
| Severity | **Cannot Verify** |
| Location | `computeMaturityFactor` in `./maturity.js` |

**Evidence:**
```typescript
import { computeMaturityFactor } from "./maturity.js";
```

**Issue:** The actual formula implementation `(1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))` is delegated to an external module (`src/computation/maturity.ts`) that was **not provided for review**.

**Risk:** Cannot confirm that:
- The exponential decay constants (0.05 and 0.5) are correct
- The formula structure matches the spec
- Edge cases (0 observations, 0 connections) are handled per spec

**Recommendation:** Include `src/computation/maturity.ts` in the verification scope to complete this analysis.

---

### Divergence 2: No Explicit Edge Case Documentation

| Aspect | Status |
|--------|--------|
| Severity | **Minor (Documentation)** |
| Location | phi-l.ts docstring |

**Spec states:**
> "At 0 observations or 0 connections, it approaches 0."

**Code observation:** The phi-l.ts docstring describes the formula but does not document the edge case behavior explicitly.

**Recommendation:** Consider adding edge case documentation:
```typescript
/**
 * maturityFactor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
 * 
 * Edge cases:
 * - At 0 observations OR 0 connections → approaches 0
 * - At 50+ observations AND 3+ connections → approaches 1.0
 */
```

---

## Summary Table

| Aspect | Spec | Code | Match |
|--------|------|------|-------|
| Application formula | `ΦL_effective = ΦL_raw × maturity_factor` | `effective = raw * maturityFactor` | ✅ Yes |
| Maturity formula (documented) | `(1 - e^(-0.05 × obs)) × (1 - e^(-0.5 × conn))` | Same in docstring | ✅ Yes |
| Maturity formula (implementation) | As above | Delegated to `./maturity.js` | ⚠️ Cannot verify |
| Parameters | observations, connections | `observationCount, connectionCount` | ✅ Yes |
| Multiplicative application | ΦL_raw × maturity | `raw * maturityFactor` | ✅ Yes |
| Edge case documentation | 0 obs/conn → 0 | Not explicitly documented | ⚠️ Minor gap |

---

## Conclusion

**Primary Finding:** The maturity factor **application pattern** in `phi-l.ts` matches the Engineering Bridge specification exactly. The formula is correctly documented, the parameters are correct, and the multiplicative application is properly implemented.

**Verification Gap:** The actual maturity factor **formula implementation** resides in `src/computation/maturity.ts`, which was not provided for review. A complete verification requires examining that file.

**Recommendation:** 
1. Review `src/computation/maturity.ts` to verify the formula constants (0.05, 0.5) and exponential structure
2. Add explicit edge case documentation to improve spec traceability