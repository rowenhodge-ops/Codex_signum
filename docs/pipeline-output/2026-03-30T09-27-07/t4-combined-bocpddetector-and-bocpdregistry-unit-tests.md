# Combined BOCPDDetector and BOCPDRegistry unit tests

> Task ID: t4
> Model: claude-opus-4-5:extended:16k
> Duration: 99696ms
> Output chars: 12989
> Timestamp: 2026-03-30T09:45:30.314Z

> **⚠️ Hallucination flags (9):**
> - [content/warning] Task t4 references "tests/**/*.test.ts" but this file was not in its context
> - [content/warning] Task t4 references "vitest.config.ts" but this file was not in its context
> - [content/warning] Task t4 references "src/signals/" but this file was not in its context
> - [content/warning] Task t4 references "src/signals/types.ts" but this file was not in its context
> - [content/warning] Task t4 references "src/signals/BOCPDDetector.ts" but this file was not in its context
> - [content/warning] Task t4 references "src/signals/BOCPDRegistry.ts" but this file was not in its context
> - [content/warning] Task t4 references "src/signals/index.ts" but this file was not in its context
> - [content/warning] Task t4 references "src/signals" but this file was not in its context
> - [content/warning] Task t4 references "src/signals/types" but this file was not in its context

---

# Analysis: Combined BOCPDDetector and BOCPDRegistry Unit Tests

## 1. Test File Structure and Discovery

### 1.1 File Location Requirements

**Finding**: The file must be placed at `tests/conformance/bocpd.test.ts` to align with existing conformance test patterns and vitest configuration.

**Evidence**: The acceptance criteria explicitly state "tests/conformance/bocpd.test.ts exists and is discovered by vitest config". Standard vitest configurations include patterns like `tests/**/*.test.ts`, which would discover this path.

**Recommendation**: Verify the vitest config includes the `tests/conformance/` directory. If using a `vitest.config.ts` file, ensure the `include` pattern covers this path.

### 1.2 Import Constraints

**Finding**: The acceptance criteria mandate "No imports from outside `src/signals/` and `src/signals/types.ts`". This constrains what can be imported.

| Allowed Import | Source |
|---------------|--------|
| `BOCPDDetector` | `src/signals/BOCPDDetector.ts` or barrel |
| `BOCPDRegistry` | `src/signals/BOCPDRegistry.ts` or barrel |
| `BOCPDSignal`, `BOCPDConfig`, `BOCPDState` | `src/signals/types.ts` |

**Risk**: If the barrel export (`src/signals/index.ts`) is incomplete, tests may fail to compile. The t1 output indicates these re-exports are planned.

**Recommendation**: Import from the barrel `'../../src/signals'` for cleaner imports, with types from `'../../src/signals/types'` if not re-exported.

## 2. BOCPDDetector Test Cases

### 2.1 NIG Hyperparameter Update Correctness

**Objective**: Verify that incremental NIG updates produce mathematically correct posterior parameters after processing i.i.d. observations.

**Finding**: From the t2 analysis, the incremental update rules are:
- `κ_n = κ_0 + n` (deterministic — can verify exactly)
- `α_n = α_0 + n/2` (deterministic — can verify exactly)
- `μ_n` and `β_n` depend on observation values

**Test Strategy**:
1. Construct detector with known priors (e.g., `μ_0=0, κ_0=1, α_0=1, β_0=1`)
2. Feed exactly `n=10` synthetic i.i.d. samples (fixed values for reproducibility)
3. Verify κ and α have exact expected values
4. Verify μ converges toward sample mean (weighted by prior)

**Critical Question**: How to access internal NIG state? Two approaches:

| Approach | Trade-off |
|----------|-----------|
| Expose state via getter | Requires API modification; clean for testing |
| Infer from behavior | Use known input sequences where output is predictable |

**Recommendation**: If `BOCPDDetector` exposes a readonly `state` property (as suggested by the `bocpdState` persistence requirement in the task tree), use it directly. Otherwise, verify through behavioral invariants.

**Verification Formula**:
```
After n observations x_1, ..., x_n from prior (μ_0, κ_0, α_0, β_0):
  κ_n = κ_0 + n
  α_n = α_0 + n/2
  μ_n = (κ_0 · μ_0 + Σx_i) / κ_n
```

### 2.2 Run-Length Monotonic Growth in Stationary Segment

**Objective**: Verify that `runLength` (the mode of the posterior run-length distribution) increases during a stationary segment.

**Finding**: In a stationary process (no change points), the most probable run length should grow with each observation after an initial burn-in period. The hazard function constantly "erodes" the growth mass into the change-point hypothesis, but in the absence of actual distributional changes, the growth term dominates.

**Test Strategy**:
1. Generate 50 i.i.d. samples from N(0, 1) — use fixed values or seeded PRNG
2. Feed sequentially to detector
3. After burn-in (first ~5 observations), verify `runLength` is non-decreasing

**Edge Case**: The run-length may plateau or briefly decrease due to numerical noise or the hazard prior. 

**Recommendation**: Assert that the run-length is **generally increasing** — e.g., `runLength[i+10] >= runLength[i]` for most checkpoints, or verify the final run-length is close to `n - 1`.

**Tolerance**: Allow up to 2 decreases in a 50-observation sequence. This is a heuristic bound; if the implementation is correct, decreases should be rare.

### 2.3 changePointProbability Spike at Mean-Shift Boundary

**Objective**: Verify that `changePointProbability` spikes when the underlying distribution changes.

**Finding**: This is the core functional test of BOCPD. A mean shift is the most detectable type of change point for the NIG model.

**Test Strategy**:
1. Generate two-segment sequence:
   - Segment 1: 30 samples from N(0, 1)
   - Segment 2: 30 samples from N(5, 1) — large mean shift for clear signal
2. Feed all 60 samples sequentially
3. Record `changePointProbability` at each step
4. Assert that `max(cp_prob[28:35])` significantly exceeds the baseline

**Spike Definition**: The change-point probability at the boundary region should be at least **3× the median** of the stationary-segment probabilities. For a hazardRate of 0.01, baseline CP probability is approximately 0.01; a spike to >0.1 is strongly indicative of a detected change.

**Finding**: The spike may appear **1–3 steps after** the actual change point due to the posterior needing evidence to reallocate mass. This is expected behaviour, not a defect.

**Recommendation**: Test that `max(cp_prob[changePoint-2 : changePoint+5])` exceeds a threshold, rather than requiring the exact index to spike.

### 2.4 reset() Zeroes Run-Length State

**Objective**: Verify that `reset()` restores the detector to its initial state.

**Finding**: From t2 analysis, `reset()` should restore:
- Run-length distribution to `[1.0]` (all mass on r=0)
- NIG hyperparameters to original priors

**Test Strategy**:
1. Create detector, feed 20 observations
2. Record state after observations (runLength should be ~19)
3. Call `reset()`
4. Feed one observation
5. Verify runLength is 0 or 1 (initial state behaviour)
6. Optionally verify `changePointProbability ≈ hazardRate` (first-step expectation)

**Alternative**: If state is accessible, directly assert `runLengths === [1.0]` and hyperparameters equal priors.

## 3. BOCPDRegistry Test Cases

### 3.1 Per-Metric Isolation

**Objective**: Verify that observations to metric A do not affect the posterior of metric B.

**Finding**: This is the **critical invariant** of the registry. Cross-contamination would produce spurious drift signals.

**Test Strategy**:
1. Create two detectors via `getOrCreate('metricA')` and `getOrCreate('metricB')`
2. Feed 20 observations from N(0, 1) to metricA
3. Feed 20 observations from N(10, 1) to metricB — different distribution
4. Verify that `detectorA.runLength` reflects ~20 steps of stationary growth
5. Verify that `detectorB.runLength` reflects ~20 steps of stationary growth
6. Verify `detectorA.changePointProbability` is **not** elevated due to metricB's different mean

**Stronger Assertion**: After feeding both, reset metricA and verify metricB state is unchanged:
```
cpBeforeReset = detectorB.detect(nextValue).changePointProbability
registry.reset('metricA')
cpAfterReset = detectorB.detect(anotherValue).changePointProbability
// cpAfterReset should reflect metricB's continuous history, not a reset
```

### 3.2 getOrCreate Idempotency

**Objective**: Verify that `getOrCreate(name)` returns the **identical instance** on repeated calls.

**Finding**: The acceptance criteria explicitly require "returns the identical BOCPDDetector instance on repeated calls for the same metricName".

**Test Strategy**:
1. `const d1 = registry.getOrCreate('metric')`
2. `const d2 = registry.getOrCreate('metric')`
3. Assert `d1 === d2` (strict reference equality)

**Supplementary Test**: Verify that config on second call is ignored:
1. `const d1 = registry.getOrCreate('metric', { mu0: 5 })`
2. `const d2 = registry.getOrCreate('metric', { mu0: 100 })` — different config
3. Assert `d1 === d2` (same instance, original config)

### 3.3 reset(metricName) Scope

**Objective**: Verify that resetting one metric leaves others unchanged.

**Finding**: The acceptance criteria state "reset(metricName) leaves other metrics unchanged".

**Test Strategy**:
1. Create metricA and metricB, feed 20 observations to each
2. Record metricB's runLength (should be ~19)
3. Call `registry.reset('metricA')`
4. Call `registry.detect('metricB', nextValue)`
5. Verify metricB's runLength is ~20 (continued from previous state)
6. Verify metricA's runLength is 0 or 1 (reset state)

**Alternative**: Snapshot the entire return value of `detect()` for metricB before and after resetting metricA, verify continuity.

### 3.4 resetAll Coverage

**Objective**: Verify that `resetAll()` resets all registered metrics.

**Test Strategy**:
1. Create metricA, metricB, metricC, feed observations to each
2. Call `registry.resetAll()`
3. For each metric, verify initial-state behaviour (runLength ≈ 0)

**Important Invariant**: `resetAll()` should **preserve** detector instances, not delete them. Verify:
```
const dBefore = registry.getOrCreate('metric')
registry.resetAll()
const dAfter = registry.getOrCreate('metric')
expect(dBefore).toBe(dAfter) // Same instance
```

## 4. Synthetic Data Generation

### 4.1 Determinism Requirement

**Finding**: Tests must be deterministic. Using `Math.random()` directly will cause flaky tests.

**Options**:

| Approach | Pros | Cons |
|----------|------|------|
| Fixed arrays | Fully deterministic | Verbose; less realistic |
| Seeded PRNG | Reproducible; realistic | Requires implementing or importing PRNG |
| Box-Muller with seed | Generates Gaussian samples | More code |

**Recommendation**: Use fixed arrays for small test cases (n < 30) and a simple seeded linear congruential generator (LCG) for larger sequences. The LCG can be ~5 lines of code.

### 4.2 Gaussian Sample Generation

For tests requiring Gaussian-distributed samples, the Box-Muller transform can convert uniform samples to Gaussian:
```
z = sqrt(-2 * ln(u1)) * cos(2π * u2)
```

**Alternative**: Pre-compute and inline 50–100 samples from N(0,1) and N(5,1) as literal arrays. This avoids implementing Box-Muller but increases code size.

**Recommendation**: Use pre-computed arrays for the specific test cases. This ensures reproducibility without adding mathematical complexity to the test file.

## 5. Assertion Patterns

### 5.1 Numerical Tolerance

**Finding**: Floating-point comparisons require tolerance. Use `expect(value).toBeCloseTo(expected, precision)` where `precision` is the number of decimal digits.

| Comparison | Recommended Precision |
|------------|----------------------|
| κ, α (should be exact integers + fractions) | 10 |
| μ (posterior mean) | 6 |
| changePointProbability | 6 |

### 5.2 Distribution-Based Assertions

For assertions like "runLength increases monotonically", avoid strict monotonicity. Instead:

```typescript
// At least 90% of consecutive pairs should be non-decreasing
const increases = runLengths.filter((r, i) => i === 0 || r >= runLengths[i-1]).length;
expect(increases / runLengths.length).toBeGreaterThan(0.9);
```

## 6. Test Coverage Matrix

| Class | Test Case | describe/it Blocks | Acceptance Criterion |
|-------|-----------|-------------------|---------------------|
| BOCPDDetector | NIG updates | 1 describe + 1 it | ✓ Required |
| BOCPDDetector | Run-length growth | 1 describe + 1 it | ✓ Required |
| BOCPDDetector | CP spike | 1 describe + 1 it | ✓ Required |
| BOCPDDetector | reset() | 1 describe + 1 it | ✓ Required |
| BOCPDRegistry | Isolation | 1 describe + 1 it | ✓ Required |
| BOCPDRegistry | Idempotency | 1 describe + 1 it | ✓ Required |
| BOCPDRegistry | reset scope | 1 describe + 2 it | ✓ Required (includes resetAll) |

**Total**: 4 describe blocks for BOCPDDetector (minimum), 3 describe blocks for BOCPDRegistry (minimum).

## 7. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Internal state not exposed | Medium | Tests must infer state from behaviour | Design tests around observable outputs |
| Spike detection threshold too strict | Medium | Flaky tests | Use statistical threshold (3× median) |
| Run-length not strictly monotonic | Low | False test failures | Allow tolerance in monotonicity check |
| Import path mismatch | Low | Compilation failure | Verify against t1 barrel exports |
| Vitest config missing path | Low | Tests not discovered | Verify vitest.config.ts patterns |

## 8. Recommendations Summary

1. **Structure**: Use 2 top-level `describe` blocks (BOCPDDetector, BOCPDRegistry), with nested `describe`/`it` for each test case.

2. **Data**: Pre-compute fixed Gaussian samples as literal arrays to ensure determinism.

3. **State Access**: If `BOCPDDetector` exposes a `state` getter, use it; otherwise test through behavior.

4. **Tolerances**: Use `toBeCloseTo` for floating-point assertions; use >= 90% threshold for monotonicity.

5. **Isolation Test**: Verify isolation both by checking independent runLength values and by confirming reset of one metric doesn't affect another.

6. **Spike Detection**: Test a window around the expected change point (±3 steps), not the exact index.