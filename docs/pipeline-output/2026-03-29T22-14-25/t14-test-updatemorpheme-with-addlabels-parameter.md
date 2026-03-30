# Test updateMorpheme() with addLabels parameter

> Task ID: t14
> Model: claude-opus-4-5:extended:32k
> Duration: 68692ms
> Output chars: 8422
> Timestamp: 2026-03-29T23:04:22.456Z

> **⚠️ Hallucination flags (3):**
> - [content/warning] Task t14 references "checks/axioms.ts" but this file was not in its context
> - [content/warning] Task t14 references "instantiation-protocol.test.ts" but this file was not in its context
> - [content/warning] Task t14 references "src/graph/instantiation.js" but this file was not in its context

---

# Analysis: Test updateMorpheme() with addLabels Parameter (t14)

## Task Summary

Write conformance tests verifying `updateMorpheme()` correctly handles the optional `addLabels` parameter with allowlist enforcement and atomic transaction guarantees, per M-10.1 requirement 7.

---

## Existing Test Infrastructure Analysis

### Current Mock Setup
The test file provides a robust mocking infrastructure:

| Component | Implementation | Assessment |
|-----------|---------------|------------|
| `mockRun` | `vi.fn().mockResolvedValue({ records: [] })` | Adequate for query capture |
| `mockWriteTransaction` | Wraps work function, calls `run` | Suitable for atomicity verification |
| `mockNodeLabels` | Configures label/property responses | Needs extension for label addition capture |

### Existing updateMorpheme() Test Coverage
```
describe("updateMorpheme()")
├── rejects update to non-existent node          ✓ (lines 256-262)
├── rejects setting content to empty string      ✓ (lines 264-270)
├── rejects setting content to whitespace        ✓ (lines 272-278)
├── rejects removing required property (null)    ✓ (lines 280-286)
├── rejects removing required property (empty)   ✓ (lines 288-294)
├── allows updating non-required properties      ✓ (lines 296-306)
├── allows updating content to new value         ✓ (lines 308-316)
├── describe("reparenting")                      ✓ (lines 318-360)
└── describe("parent status propagation")        ✓ (lines 362-375)
```

**Finding**: No tests currently exist for label manipulation. The `addLabels` parameter is a new capability requiring dedicated test coverage.

---

## Function Signature Analysis

Based on M-10.1 requirement 7 and existing usage patterns, the expected signature:

```typescript
updateMorpheme(
  nodeId: string,
  properties: Record<string, unknown>,
  newParentId?: string,
  options?: { addLabels?: string[] }
): Promise<MutationResult>
```

**Evidence**: The reparenting tests at line 318+ show the third parameter (`newParentId`) exists, suggesting `options` would be a fourth parameter or merged into a configuration object.

---

## Required Test Cases

### Test 1: Backward Compatibility (No addLabels)
**Purpose**: Verify existing behavior unchanged when `addLabels` omitted

**Verification approach**:
- Call `updateMorpheme()` with only properties
- Assert `result.success === true`
- Verify no label-related Cypher operations in `mockRun.mock.calls`

**Location**: Should appear first in new `describe("addLabels parameter")` block

---

### Test 2: Valid Label Application
**Purpose**: Verify `['Archived']` successfully applied

**Verification approach**:
- Mock node existence with `mockNodeLabels("test-seed", ["Seed"])`
- Call with `addLabels: ['Archived']`
- Assert `result.success === true`
- Verify Cypher query contains `SET n:Archived` or equivalent label syntax

**Query pattern to verify**:
```cypher
MATCH (n {id: $nodeId})
SET n:Archived, n.prop = $value
```

---

### Test 3: Atomic Transaction Guarantee
**Purpose**: Verify label application occurs in same transaction as property update

**Verification approach**:
- Track that `mockWriteTransaction` called exactly once
- Within that transaction, verify both:
  1. Property SET operations present
  2. Label addition operations present
- Both operations share same `run` invocation or sequential calls within same transaction

**Implementation detail**: The mock captures all `run` calls—verify label ops interleaved with property ops within same `writeTransaction` invocation boundary.

---

### Test 4: Allowlist Enforcement - Invalid Label Rejection
**Purpose**: Verify non-allowlisted labels rejected

**Test cases**:
| Input | Expected Error Contains |
|-------|------------------------|
| `['Deprecated']` | "not in allowlist" or "not allowed" |
| `['Invalid']` | allowlist-related message |
| `['archived']` (lowercase) | Case sensitivity check |
| `['Active']` | System label protection |

**Expected behavior**: `result.success === false` with descriptive error

---

### Test 5: Error Thrown for Invalid Label
**Purpose**: Verify error message quality

**Verification approach**:
- Assert `result.error` contains:
  - The invalid label name
  - Reference to allowlist
  - Guidance (allowed values or axiom reference)

---

### Test 6: Existing Functionality Preserved
**Purpose**: Explicit verification that property updates work alongside label ops

**Test scenarios**:
- Property update + label: both applied
- Reparent + label: both applied atomically
- Label-only (empty properties): should work if valid

---

## Edge Cases to Consider

### Edge Case Matrix

| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Empty `addLabels` array `[]` | No-op, success | Medium |
| Multiple labels `['Archived', 'Invalid']` | Reject if any invalid | High |
| Already-archived node + `['Archived']` | Idempotent success | Medium |
| `addLabels` with no property changes `{}` | Apply label only | Medium |
| Combined: property + reparent + label | All atomic | High |

---

## Mock Helper Extension Required

The existing `mockNodeLabels` helper needs enhancement to:

1. **Capture label addition queries**: Track when `SET n:Label` syntax appears
2. **Return updated labels on subsequent reads**: If a test adds 'Archived', mock should reflect that

**Proposed helper signature**:
```typescript
function mockNodeWithLabelSupport(
  nodeId: string, 
  initialLabels: string[],
  captureAddedLabels?: boolean
)
```

---

## Allowlist Reference

Per M-10.1 requirement 8, the allowlist is defined in `checks/axioms.ts`:

```typescript
// Expected in Gnosis A7 check
const ALLOWED_UPDATE_LABELS = ['Archived'] as const;
```

Tests should verify against this canonical source. If the implementation allows additional labels in future, tests should remain aligned with axiom definitions.

---

## Test Organization Recommendation

```typescript
describe("updateMorpheme()", () => {
  // ... existing tests ...

  describe("addLabels parameter", () => {
    it("succeeds without addLabels parameter (backward compatibility)", ...);
    it("applies Archived label when specified in addLabels", ...);
    it("applies label in atomic transaction with property update", ...);
    it("rejects non-allowlisted label 'Deprecated'", ...);
    it("rejects non-allowlisted label 'Invalid'", ...);
    it("provides descriptive error for invalid label", ...);
    it("succeeds with empty addLabels array", ...);
    it("rejects if any label in array is not allowlisted", ...);
    it("succeeds when adding Archived to already-archived node (idempotent)", ...);
    it("applies label even with empty properties object", ...);
    it("applies label atomically with reparent operation", ...);
  });
});
```

---

## Verification Command

Per specification:
```bash
npm run test -- instantiation-protocol
```

This runs the `instantiation-protocol.test.ts` file where new tests should reside.

---

## Dependencies and Imports

No additional imports required beyond existing:
```typescript
import {
  instantiateMorpheme,
  updateMorpheme,  // Already imported
  createLine,
} from "../../src/graph/instantiation.js";
```

The type definition may need extension if `options` parameter is new:
```typescript
// May need to add to type imports
type UpdateOptions = { addLabels?: string[] };
```

---

## Summary of Findings

| Aspect | Status | Notes |
|--------|--------|-------|
| Test infrastructure | ✅ Ready | Mock system adequate |
| Backward compatibility coverage | ⚠️ Implicit | Existing tests cover this implicitly |
| Label application tests | ❌ Missing | Core requirement |
| Atomicity verification | ❌ Missing | Transaction boundary testing needed |
| Allowlist enforcement tests | ❌ Missing | Multiple invalid label scenarios |
| Error message quality tests | ❌ Missing | User-facing error clarity |
| Mock helper enhancement | ⚠️ Needed | Label capture capability |

---

## Recommendations

1. **Create new describe block** at line ~375 after existing updateMorpheme tests
2. **Extend mockNodeLabels helper** to capture and verify label operations
3. **Test all seven acceptance criteria** with explicit, separate test cases
4. **Include edge cases** for idempotency and combined operations
5. **Verify Cypher query patterns** contain correct label syntax (`SET n:Archived`)
6. **Assert transaction boundaries** to prove atomicity guarantee