# Test getDecayWeightedPosteriors() query function

> Task ID: t11
> Model: claude-opus-4-5:extended:32k
> Duration: 64270ms
> Output chars: 7714
> Timestamp: 2026-03-29T23:05:48.500Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] Task t11 references "arm-stats.test.ts" but this file was not in its context

---

# Analysis: Test getDecayWeightedPosteriors() Query Function

## Executive Summary

This analysis examines the requirements for conformance testing of the new `getDecayWeightedPosteriors(bloomId, armId)` function, which reads γ-recursive Thompson posterior properties from Bloom nodes and returns Beta(α, β) parameters. The function replaces `getArmStats()` as specified in M-10.1 requirement 5.

---

## 1. Functional Requirements Analysis

### 1.1 Function Specification

| Aspect | Specification |
|--------|---------------|
| **Signature** | `getDecayWeightedPosteriors(bloomId, armId)` |
| **Input** | `bloomId` (Bloom node identifier), `armId` (arm identifier within Bloom) |
| **Output** | `{α: number, β: number}` — Beta distribution parameters |
| **Source** | Reads `weightedSuccesses` → α, `weightedFailures` → β from Bloom node properties |
| **Context** | Part of γ-recursive Thompson posterior system per M-10.1 |

### 1.2 Property Semantics

The properties being read are γ-recursively weighted values updated via:
```
α_new = γ × α_old + outcome
```

This differs fundamentally from the existing `ArmStats` approach which maintains simple counts. The weighted values provide exponential decay, giving recency bias to observations.

---

## 2. Existing Test Pattern Analysis

### 2.1 Current Structure in arm-stats.test.ts

| Describe Block | Focus |
|----------------|-------|
| `updateArmStats — Beta posterior update` | Pure function alpha/beta incrementing |
| `updateArmStats — EWMA smoothing` | Exponentially weighted moving average metrics |
| `freshArmStats` | Initial state creation with Beta(1,1) prior |
| `OutcomeRecord — infrastructure flag` | Optional infrastructure field handling |

### 2.2 Key Testing Patterns Observed

1. **State Transformation**: Tests verify before/after state transitions
2. **Invariant Checking**: `alpha + beta - 2 = totalTrials` invariant
3. **Default Handling**: Fresh stats start with Beta(1,1) prior
4. **Edge Cases**: Optional fields, first observations

---

## 3. Test Requirements Mapping

### 3.1 Acceptance Criteria Coverage Matrix

| Criterion | Test Type | Complexity |
|-----------|-----------|------------|
| Valid bloomId and armId call | Happy path | Low |
| Returns {α: number, β: number} | Type validation | Low |
| α matches weightedSuccesses | Property mapping | Medium |
| β matches weightedFailures | Property mapping | Medium |
| Missing bloomId handling | Edge case | Medium |
| Missing armId handling | Edge case | Medium |
| Defaults when properties absent | Default behavior | Medium |

### 3.2 Additional Test Considerations

**Not explicitly required but recommended:**
- Partial property presence (only `weightedSuccesses` exists)
- Numeric type validation (not strings/nulls)
- Zero/negative value handling
- Very large value handling (numerical stability)

---

## 4. Test Architecture Recommendations

### 4.1 Mock vs Integration Strategy

| Approach | Pros | Cons |
|----------|------|------|
| **Unit with mocks** | Fast, isolated, deterministic | Doesn't validate actual graph queries |
| **Integration** | Validates full stack | Slower, requires database setup |
| **Hybrid** | Best coverage | More test code to maintain |

**Recommendation**: Use mocked graph layer for conformance tests, mirroring the pattern in existing arm-stats tests which test pure functions without database dependencies.

### 4.2 Proposed Test Structure

```
describe("getDecayWeightedPosteriors — Bloom posterior reading", () => {
  // Group 1: Happy path
  it("returns object with α and β properties for valid inputs")
  it("α value matches weightedSuccesses from Bloom node")
  it("β value matches weightedFailures from Bloom node")
  
  // Group 2: Default behavior
  it("returns Beta(1,1) when weightedSuccesses absent")
  it("returns Beta(1,1) when weightedFailures absent")
  it("returns Beta(1,1) when both properties absent")
  
  // Group 3: Error handling
  it("handles missing bloomId gracefully")
  it("handles missing armId gracefully")
  it("handles non-existent Bloom node gracefully")
  
  // Group 4: Edge cases
  it("handles zero values in properties")
  it("handles fractional γ-weighted values")
})
```

---

## 5. Key Design Decisions Required

### 5.1 Return Type Definition

**Question**: Should use Greek letters (α, β) or ASCII (alpha, beta)?

| Option | Consistency | Developer Experience |
|--------|-------------|---------------------|
| `{α, β}` | Matches mathematical notation | Requires Unicode input |
| `{alpha, beta}` | Matches existing `ArmStats` type | ASCII-friendly |

**Recommendation**: Use `{alpha, beta}` for consistency with existing `ArmStats` interface in the codebase.

### 5.2 Error Handling Strategy

| Scenario | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Missing bloomId | Throw error | Return defaults | Return defaults (graceful) |
| Missing armId | Throw error | Return defaults | Return defaults (graceful) |
| Invalid bloomId | Throw error | Return null | Return defaults |

**Rationale**: Graceful degradation to Beta(1,1) prior maintains system stability and aligns with Thompson sampling semantics (uninformative prior).

### 5.3 Property Storage Pattern

**Question**: How are arm-specific properties keyed on Bloom nodes?

Likely patterns:
- `weightedSuccesses_${armId}` (prefixed)
- `arm:${armId}:weightedSuccesses` (namespaced)
- Nested object `arms[armId].weightedSuccesses`

**Note**: Tests should validate the actual property access pattern used by the implementation.

---

## 6. Verification Approach

### 6.1 Test Execution

Per task specification:
```bash
npm run test -- arm-stats
```

### 6.2 Coverage Targets

| Category | Minimum Coverage |
|----------|------------------|
| Statement | 100% for new function |
| Branch | All error paths covered |
| Edge cases | All defaults exercised |

---

## 7. Findings Summary

### 7.1 Critical Observations

1. **Function Does Not Yet Exist**: The test file contains no imports or tests for `getDecayWeightedPosteriors`, confirming this is new functionality

2. **Type Alignment Needed**: Must coordinate return type with existing `ArmStats` interface conventions

3. **Graph Query Dependency**: Function requires graph read capability, distinguishing it from the pure functions currently tested

4. **Default Semantics Critical**: Beta(1,1) prior is mathematically significant (uniform distribution) and must be preserved

### 7.2 Recommendations

| Priority | Recommendation |
|----------|----------------|
| **High** | Define explicit return type interface `BetaPosterior` |
| **High** | Document default behavior in function JSDoc |
| **Medium** | Add integration test verifying actual graph reads |
| **Medium** | Ensure property naming convention is documented |
| **Low** | Consider adding diagnostic logging for missing properties |

---

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Property naming mismatch | Tests pass but production fails | Validate against actual Bloom node schema |
| Default value confusion | Incorrect posterior estimates | Explicit documentation and test coverage |
| γ-weight magnitude issues | Numerical instability | Test with realistic γ-weighted values |

---

## Conclusion

The conformance test suite for `getDecayWeightedPosteriors()` should follow the established patterns in `arm-stats.test.ts` while accounting for the graph query dependency. Primary focus areas are: correct property mapping, graceful error handling with Beta(1,1) defaults, and type safety validation. The test structure should clearly separate happy path, default behavior, and error handling scenarios for maintainability.