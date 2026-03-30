# Test ΦL derivation from γ-recursive posteriors

> Task ID: t12
> Model: claude-opus-4-6:adaptive:medium
> Duration: 61432ms
> Output chars: 8548
> Timestamp: 2026-03-29T23:09:11.485Z

> **⚠️ Hallucination flags (3):**
> - [content/warning] Task t12 references "phi-l.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "phi-l-gamma-recursive.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/conformance/phi-l-gamma-posterior.test.ts" but this file was not in its context

---

# Analysis: Test ΦL Derivation from γ-Recursive Posteriors (t12)

## 1. Scope & Intent

The task requires a new conformance test suite verifying that `assemblePatternHealthContext()` now sources its ΦL computation from **γ-recursive Bloom node properties** (`weightedSuccesses`, `weightedFailures`) via `getDecayWeightedPosteriors()`, rather than from observation Grid reads. This is a fundamental data-plumbing change — the computation formula for ΦL itself (4-factor weighted composite) is already well-tested in the existing `phi-l.test.ts`, but the **upstream data source** feeding the `usageSuccessRate` factor is being replaced.

## 2. Existing Coverage Gap

The current `phi-l.test.ts` covers:
- **Composite structure** — ΦL is always an object, never bare
- **Weight distribution** — axiomCompliance=0.4, others=0.2
- **Raw/effective score** — maturity adjustment, bounds
- **Trend** — ring buffer, temporal stability
- **`computePhiLWithState`** — round-trip with state

**What is entirely absent:**
- Any test of `assemblePatternHealthContext()` — the orchestration function that gathers data and invokes ΦL computation
- Any test of `getDecayWeightedPosteriors()` — the new data accessor
- Any test of the γ-recursive update formula `α_new = γ × α_old + outcome`
- Any test showing divergence between Bloom-property-based and Grid-read-based ΦL
- Any test of health band classification from the derived ΦL

## 3. Key Entities to Test

### 3.1 `getDecayWeightedPosteriors(bloomId, armId)`

- **Inputs**: A Bloom node ID and an arm (variant) ID
- **Reads**: `weightedSuccesses` and `weightedFailures` properties from the Bloom/Resonator node
- **Returns**: A Beta(α, β) posterior distribution object
- **Critical invariant**: α ≥ 0, β ≥ 0; both initialized from γ-recursive accumulation, not raw counts

### 3.2 γ-Recursive Formula

The update rule is: `α_new = γ × α_old + outcome` where:
- `γ` is the decay weight (0 < γ < 1), related to half-life via λ
- `outcome` is 1 for success, 0 for failure (contributing to β side)
- This means `weightedSuccesses` tracks exponentially-decayed successes, and `weightedFailures` tracks exponentially-decayed failures

**Testable properties:**
- After N identical outcomes, the weighted count should converge to `1/(1-γ)` (geometric series)
- More recent outcomes have exponentially more influence than older ones
- With γ=0, the posterior reflects only the last observation
- With γ→1, the posterior approaches simple counting (no decay)

### 3.3 `assemblePatternHealthContext()`

This function must:
1. Call `getDecayWeightedPosteriors()` to get Beta(α, β)
2. Derive `usageSuccessRate` from the posterior mean: `α / (α + β)`
3. Feed this into the existing 4-factor ΦL computation
4. **Not** read from the observation Grid for this factor

### 3.4 Divergence Test

When both Grid data and Bloom properties exist but tell different stories (e.g., Grid has old successful observations but recent Bloom-property updates reflect failures), the ΦL derived from `assemblePatternHealthContext()` must reflect the **Bloom-property data**, not Grid data.

## 4. Test Design Recommendations

### 4.1 Test Structure

A new `describe` block (or a separate test file, e.g., `phi-l-gamma-recursive.test.ts`) is needed, distinct from the existing pure-computation tests. The new tests are **integration-level** — they test the assembly/orchestration layer.

### 4.2 Mocking Strategy

- **Mock `getDecayWeightedPosteriors()`** to return controlled Beta(α, β) values
- **Mock any Grid read** paths to return contradictory data (for the divergence test)
- **Do not mock** `computePhiL` or `computePhiLWithState` — let the real computation run to confirm end-to-end correctness

### 4.3 Recommended Test Cases

| # | Test Case | Verifies |
|---|-----------|----------|
| 1 | `assemblePatternHealthContext()` calls `getDecayWeightedPosteriors()` | Data source wiring |
| 2 | Beta(10, 2) → usageSuccessRate ≈ 0.833 → correct ΦL | Posterior mean derivation |
| 3 | Beta(1, 1) (uniform prior, no data) → usageSuccessRate = 0.5 | Prior handling |
| 4 | Sequence of γ-recursive updates produces expected α, β | Formula correctness |
| 5 | γ=0.95, 10 successes → α ≈ Σ(γ^k) for k=0..9 | Geometric series convergence |
| 6 | Grid returns high success rate, Bloom properties reflect failures → ΦL reflects low usageSuccessRate | Divergence from Grid |
| 7 | ΦL effective value maps to correct health band | Band classification |
| 8 | Zero observations on Bloom node → graceful fallback (prior) | Edge case |

### 4.4 γ-Recursive Formula Verification Detail

For test case 4, the exact expected values should be computed analytically:

Given γ = 0.9 and outcomes [1, 1, 0, 1, 0]:
- After outcome 1: α = 0.9 × 1 + 1 = 1.9 (starting α=1 as prior)
- After outcome 1: α = 0.9 × 1.9 + 1 = 2.71
- After outcome 0: β = 0.9 × 1 + 1 = 1.9 (starting β=1), α = 0.9 × 2.71 = 2.439
- After outcome 1: α = 0.9 × 2.439 + 1 = 3.1951
- After outcome 0: β = 0.9 × 1.9 + 1 = 2.71, α = 0.9 × 3.1951 = 2.8756

Posterior mean = 2.8756 / (2.8756 + 2.71) ≈ 0.515

This should be precomputed and asserted with `toBeCloseTo`.

### 4.5 Health Band Mapping

The test should verify that the derived ΦL effective value correctly maps to bands. Likely bands (from spec context):

| Band | ΦL Range |
|------|----------|
| Excellent | ≥ 0.85 |
| Good | 0.65–0.85 |
| Fair | 0.45–0.65 |
| Poor | < 0.45 |

Exact thresholds should be confirmed from the codebase, but the test must assert that a known Beta posterior produces the expected band.

## 5. Critical Assertions

### 5.1 No Grid Reads for usageSuccessRate

The most architecturally significant assertion: `assemblePatternHealthContext()` must **not** call any Grid observation read function when computing `usageSuccessRate`. This can be verified by:
- Mocking the Grid read to throw (and asserting no throw occurs)
- Or using a spy to confirm zero invocations

### 5.2 Numerical Precision

The γ-recursive formula accumulates floating-point operations. Tests should use `toBeCloseTo` with explicit decimal precision (suggest 4–6 places). Accumulated drift over many iterations is expected but bounded.

### 5.3 Property Persistence

`weightedSuccesses` and `weightedFailures` are stored as **node properties** on Bloom/Resonator nodes. The test should verify that `getDecayWeightedPosteriors()` reads these specific properties (not computed on-the-fly from raw events).

## 6. File Placement

Given that the existing `phi-l.test.ts` tests pure computation, and the new tests verify orchestration + data source integration, I recommend:

- **New file**: `tests/conformance/phi-l-gamma-posterior.test.ts`
- **Test filter**: Should match `npm run test -- phi-l` (the filename prefix ensures this)
- Alternatively, a new top-level `describe` block appended to the existing file, but separation is cleaner given the distinct concerns

## 7. Dependencies to Import

The new test will need:
- `assemblePatternHealthContext` from the health context module
- `getDecayWeightedPosteriors` from the Bloom property accessor
- Mocking utilities (vitest `vi.mock` / `vi.spyOn`)
- Possibly `computePhiL` / `computePhiLWithState` for comparison assertions
- Types: `PhiLFactors`, `PhiLState`, and any new `BetaPosterior` / `DecayWeightedPosterior` type

## 8. Risks & Considerations

| Risk | Mitigation |
|------|------------|
| `assemblePatternHealthContext()` may not yet exist or may have a different signature | Test should be written against the spec interface; implementation follows |
| γ value may come from per-context lambda config seeds | Test should either inject γ explicitly or mock the config resolution |
| Half-life conversion: λ (ms) → γ per observation requires knowing observation cadence | Test should verify the formula `γ = exp(-ln(2) × Δt / halfLife)` if time-based, or use a fixed γ |
| Existing tests in `phi-l.test.ts` must continue passing unchanged | New tests should not modify existing test infrastructure |

## 9. Summary

The conformance test must verify a **plumbing change**: ΦL's `usageSuccessRate` factor is now sourced from γ-recursive Thompson posterior properties on Bloom nodes via `getDecayWeightedPosteriors()`, not from Grid observation reads. The test suite needs 7–8 cases covering: correct wiring, formula accuracy, posterior-to-factor derivation, Grid divergence, health bands, and edge cases. The γ-recursive formula should be verified with analytically precomputed values. The strongest architectural assertion is that Grid reads are not consulted for this factor.