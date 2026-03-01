# Audit test files for old terminology leaks

> Task ID: t17
> Model: claude-opus-4-6:adaptive:low
> Duration: 143103ms
> Output chars: 16072
> Timestamp: 2026-03-01T23:16:33.971Z

---

# Audit Report: Test Files Old Terminology Leaks (t17)

## Executive Summary

The test files in `tests/conformance/` contain **multiple old-terminology leaks** that violate the acceptance criteria. Two of the four test files are clean (`bootstrap.test.ts`, and most of `memory.test.ts`), but `type-conformance.test.ts` and `patterns.test.ts` carry significant pre-refactor terminology in test descriptions, fixture data, and type references. The `tests/safety/` directory was not provided for review and remains unverified.

Findings fall into two categories: (1) **direct test authoring issues** — old terminology in `describe`/`it` strings and comments that tests control independently, and (2) **inherited type surface issues** — tests correctly referencing source types that themselves were not renamed, creating a cascade where fixing the source (per t11, t14) will require corresponding test updates.

| File | Agent Refs | Pattern Refs | Observer Refs | Morpheme-Native Assertions | Status |
|------|-----------|-------------|--------------|---------------------------|--------|
| `type-conformance.test.ts` | 0 | 5 | 0 | Partial | 🔴 FAIL |
| `patterns.test.ts` | 0 | 0 | 1 | Partial (hybrid) | 🔴 FAIL |
| `bootstrap.test.ts` | 0 | 0 | 0 | Full | ✅ PASS |
| `memory.test.ts` | 0 | 5 | 0 | Partial (hybrid) | 🔴 FAIL |

---

## Methodology

1. Scanned all four provided test files for exact matches of `Agent`, `Pattern`, and `observer`/`Observer`
2. Distinguished morpheme-term usage from proper nouns (e.g., "DevAgent" as a Bloom pattern name)
3. Distinguished inherited type-surface references (fields dictated by source types) from independently authored test text (descriptions, comments)
4. Cross-referenced against prior task outputs: t11 (thompson-router), t14 (memory module), t1 (canonical mapping)
5. Verified test descriptions and `it()` strings for morpheme-native naming

---

## Finding 1 — `type-conformance.test.ts`: `patternId` in EphemeralMemory Test

**Severity: High (direct Pattern terminology in test description and fixture)**

The Stratum 1 memory test uses pre-refactor field names in both its description and fixture data:

```typescript
it("Stratum 1: EphemeralMemory has executionId/patternId/data", () => {
  const e: EphemeralMemory = {
    stratum: 1,
    executionId: "exec-001",
    patternId: "router-v1",    // ← Pre-refactor field name
    data: { model: "gemini" },
    createdAt: new Date(),
  };
  // ...
  expect(e.patternId).toBeDefined();   // ← Assertion on old field name
});
```

**Assessment:** This is a **dual-layer issue**. The test description independently authored by the test author says "patternId" when it should say "bloomId." The fixture field `patternId` is dictated by the `EphemeralMemory` type — if the type still defines `patternId`, the test must use it to compile. However, the test *description* string is not type-constrained and should have been updated.

**Cross-reference:** t14 did not specifically audit the `EphemeralMemory` type definition, but the pattern is consistent with the `operations.ts` findings where `patternId` was retained throughout the ephemeral store.

**Violations:** Pattern reference in test (not compat). Test description not morpheme-native.

---

## Finding 2 — `type-conformance.test.ts`: `relatedPatternIds` in Distillation Test

**Severity: High (direct Pattern terminology in test description and fixture)**

```typescript
it("Stratum 3: Distillation has category/relatedPatternIds", () => {
  const d: Distillation = {
    // ...
    relatedPatternIds: ["router-v1"],   // ← Pre-refactor field name
  };
  // ...
  expect(d.category).toBe("performance_profile");
});
```

**Assessment:** Same dual-layer issue as Finding 1. The description string "relatedPatternIds" should read "relatedBloomIds." The field name is inherited from the `Distillation` type definition.

**Expected post-refactor:**
- Description: `"Stratum 3: Distillation has category/relatedBloomIds"`
- Field: `relatedBloomIds: ["router-v1"]`

**Violations:** Pattern reference in test description. Pattern reference in fixture data.

---

## Finding 3 — `type-conformance.test.ts`: `governsPatterns` in ConstitutionalRule Test

**Severity: Medium (Pattern terminology in fixture, not in description)**

```typescript
const rule: ConstitutionalRule = {
  // ...
  governsPatterns: ["router-v1"],   // ← Pre-refactor field name
  // ...
};
```

**Assessment:** The test description (`"ConstitutionalRule Expression Nesting"`) does not mention the field, so the description is clean. The field name `governsPatterns` is inherited from the `ConstitutionalRule` type. This represents a **missed rename in the constitutional type definitions** that was not flagged in prior task outputs.

**Expected post-refactor:** `governsBlooms: ["router-v1"]`

**Violations:** Pattern reference in test fixture.

---

## Finding 4 — `patterns.test.ts`: "Observer" in File Header Comment

**Severity: Medium (observer terminology in test documentation)**

```typescript
/**
 * Codex Signum — Conformance Tests: Patterns
 *
 * Tests Thompson Router (Resonator), DevAgent pipeline presets,
 * and Observer feedback mechanics.
 *                ^^^^^^^^ Pre-refactor terminology
 */
```

**Assessment:** This is independently authored test documentation, not constrained by any type definition. Per the observer→feedback rename, "Observer feedback mechanics" should read "Feedback pattern mechanics" or simply "feedback mechanics."

**Violations:** Observer reference in test.

---

## Finding 5 — `patterns.test.ts`: `RoutableModel` Type Used Throughout

**Severity: High (pre-refactor type name, 3+ direct references)**

```typescript
const testModels: RoutableModel[] = [
  { id: "gemini-flash", ... },
  { id: "claude-haiku", ... },
  { id: "mistral-medium", ... },
];
```

And in the inactive-model test:

```typescript
const modelsWithInactive = [
  ...testModels,
  { ..., status: "inactive" as const },
];
```

**Assessment:** `RoutableModel` is the pre-refactor type name identified in t11 (should be `RoutableSeed`). The test file imports and uses this type as its primary fixture type. This is an inherited issue — the test cannot use `RoutableSeed` until the source type is renamed.

**Cross-reference:** t11 Finding 2 — "`RoutableModel` is the primary type representing an AI model entity available for routing. Per Agent→Seed rename, this should be `RoutableSeed`."

**Violations:** Pre-refactor type name in test (indirect, inherited from source).

---

## Finding 6 — `patterns.test.ts`: `selectedModelId` in Assertions

**Severity: High (pre-refactor field name in multiple test assertions)**

| Line Context | Assertion | Expected Post-Refactor |
|---|---|---|
| Active-models test | `expect(decision.selectedModelId).not.toBe("inactive-model")` | `selectedSeedId` |
| Required-fields test | `expect(decision.selectedModelId).toBeDefined()` | `selectedSeedId` |
| Exploitation test | `if (d.selectedModelId === "gemini-flash")` | `selectedSeedId` |

**Assessment:** These assertions directly reference `selectedModelId` from the `RoutingDecision` type. Per t11 Finding 1, this field should be `selectedSeedId`. The test cannot change independently of the source type, but these assertions constitute the most prominent old-terminology leak in the test suite.

**Hybrid evidence:** In the *same test file*, `ArmStats` fixtures correctly use `seedId`:

```typescript
const armStats: ArmStats[] = [
  { seedId: "gemini-flash", alpha: 100, beta: 2, ... },  // ✅ post-refactor
  // ...
];
```

This creates a textbook hybrid state: `seedId` in input data coexists with `selectedModelId` in output assertions within the same `describe` block.

**Violations:** Pre-refactor field name in test assertions (3 occurrences). Hybrid coexistence within same test suite.

---

## Finding 7 — `patterns.test.ts`: "model" in Test Descriptions

**Severity: Low-Medium (test descriptions use pre-refactor framing)**

| Test Description | Morpheme-Native Equivalent |
|---|---|
| `"selects from active models only"` | `"selects from active seeds only"` |
| `"favors high-alpha model (exploitation)"` | `"favors high-alpha seed (exploitation)"` |
| `"throws for empty model list"` | `"throws for empty seed list"` |
| `"throws for all inactive models"` | `"throws for all inactive seeds"` |

**Assessment:** These are independently authored test descriptions. They use "model" where the morpheme-native term is "seed." However, this is at the boundary between morpheme terminology and domain terminology — "model" in the routing context refers to LLM instances, which the spec maps to Seeds. The descriptions should use morpheme-native naming per acceptance criteria.

**Violations:** Test descriptions not using morpheme naming.

---

## Finding 8 — `memory.test.ts`: `execution.patternId` in Upward Flow Tests

**Severity: High (5 occurrences of Pattern terminology in fixture data)**

Every `computeUpwardFlow` test passes `patternId` in the execution input:

```typescript
const result = computeUpwardFlow({
  execution: {
    patternId: "pattern-1",     // ← Pre-refactor, 5 occurrences
    modelId: "gemini-flash",
    // ...
  },
  // ...
});
```

Occurrences:
1. "creates observation from execution result" test
2. "triggers distillation when observation count exceeds threshold" test
3. "does not trigger distillation below threshold" test
4. "triggers institutional promotion" test
5. "does not trigger institutional promotion with low confidence" test
6. "captures failure signature in observation context" test (6 total, not 5)

**Cross-reference:** t14 Finding 1 confirmed `UpwardFlowInput.execution.patternId` was not renamed in source. The tests accurately reflect this.

**Hybrid evidence within same test:** The output assertions correctly use post-refactor naming:

```typescript
expect(result.observation.sourceBloomId).toBe("pattern-1");  // ← output field is post-refactor
```

This mirrors t14 Finding 2 exactly: old name flows in through `execution.patternId`, new name flows out through `observation.sourceBloomId`.

**Violations:** Pattern reference in test fixtures (6 occurrences). Hybrid input/output naming.

---

## Finding 9 — `memory.test.ts`: `modelId` Consistency Question

**Severity: Low (flagged for cross-module resolution, not a clear violation)**

The distillation tests use `modelId` throughout:

```typescript
{ modelId: "model-a", success: true, qualityScore: 0.9 },
```

Per t14's consistency note, `modelId` may correctly refer to base model identifiers (infrastructure) rather than graph Seed node IDs. If the cross-module resolution (t11/t14) determines `modelId` → `seedId`, these tests will need updating. Currently not a definitive violation.

---

## Clean File: `bootstrap.test.ts`

**Status: ✅ FULL PASS**

| Criterion | Result |
|---|---|
| No Agent references | ✅ Zero occurrences |
| No Pattern references | ✅ Zero occurrences |
| No observer references | ✅ Zero occurrences |
| Morpheme-native assertions | ✅ Uses "arms" (bandit context), neutral field names |

This file tests `ALL_ARMS` (bandit terminology, not a morpheme rename target) using neutral property names (`id`, `name`, `provider`, `model`, `status`). No morpheme-entity terminology appears.

---

## Coverage Gap: `tests/safety/` Directory

The task scope includes `tests/safety/` but **no files from this directory were provided for review**. This directory remains **unaudited** and may contain additional old-terminology leaks.

**Recommendation:** Provide `tests/safety/` files for a follow-up scan, or run the verification command:
```bash
grep -r 'Agent\|Pattern\|observer' tests/safety/ | grep -v 'compat\|alias\|backward'
```

---

## Summary: Acceptance Criteria Evaluation

| Criterion | Status | Evidence |
|---|---|---|
| No Agent references in tests (except compat) | ✅ **PASS** | Zero `Agent` morpheme references across all four files |
| No Pattern references in tests (except compat) | ❌ **FAIL** | 10+ occurrences across `type-conformance.test.ts` and `memory.test.ts` |
| No observer references in tests | ❌ **FAIL** | 1 occurrence in `patterns.test.ts` file header |
| Test assertions use morpheme naming | ❌ **FAIL** | `selectedModelId`, `patternId`, `relatedPatternIds`, `governsPatterns` in assertions; test descriptions use "model" instead of "seed" |

---

## Consolidated Finding Inventory

| # | File | Type | Old Term | Expected | Independently Fixable? |
|---|---|---|---|---|---|
| 1 | type-conformance.test.ts | Description + fixture | `patternId` | `bloomId` | Description: yes. Field: requires source type change. |
| 2 | type-conformance.test.ts | Description + fixture | `relatedPatternIds` | `relatedBloomIds` | Description: yes. Field: requires source type change. |
| 3 | type-conformance.test.ts | Fixture | `governsPatterns` | `governsBlooms` | Requires source type change. |
| 4 | patterns.test.ts | Comment | `Observer` | `Feedback` | Yes (test-only text). |
| 5 | patterns.test.ts | Type reference | `RoutableModel` | `RoutableSeed` | Requires source type change (t11). |
| 6 | patterns.test.ts | Assertion (×3) | `selectedModelId` | `selectedSeedId` | Requires source type change (t11). |
| 7 | patterns.test.ts | Description (×4) | "model"/"models" | "seed"/"seeds" | Yes (test-only text). |
| 8 | memory.test.ts | Fixture (×6) | `execution.patternId` | `execution.bloomId` | Requires source type change (t14). |

**Independently fixable now (no source dependency):** Findings 4, 7, and the description portions of 1 and 2 — a total of 7 string edits.

**Blocked on source type renames:** Findings 3, 5, 6, 8, and the field portions of 1 and 2 — requires resolution of t11 (thompson-router types), t14 (memory flow types), and constitutional type renames first.

---

## Recommendations

### R1: Fix Test-Only Text Immediately (No Source Dependency)

The following changes require zero source code modifications and should be applied now:

- `patterns.test.ts` header: "Observer feedback mechanics" → "feedback mechanics"
- `patterns.test.ts` descriptions: "models" → "seeds" in routing test names
- `type-conformance.test.ts` descriptions: "patternId" → "bloomId", "relatedPatternIds" → "relatedBloomIds"

### R2: Batch Test Updates with Source Type Renames

When the following source renames land (per t11, t14 recommendations), update tests in the same PR:

| Source Rename | Test Files Affected |
|---|---|
| `RoutableModel` → `RoutableSeed` | `patterns.test.ts` |
| `RoutingDecision.selectedModelId` → `selectedSeedId` | `patterns.test.ts` |
| `UpwardFlowInput.execution.patternId` → `bloomId` | `memory.test.ts` |
| `EphemeralMemory.patternId` → `bloomId` | `type-conformance.test.ts` |
| `Distillation.relatedPatternIds` → `relatedBloomIds` | `type-conformance.test.ts` |
| `ConstitutionalRule.governsPatterns` → `governsBlooms` | `type-conformance.test.ts` |

### R3: New Finding — `ConstitutionalRule.governsPatterns` Not Previously Flagged

Finding 3 reveals a **previously unidentified rename gap** in the constitutional type definitions. The `governsPatterns` field on `ConstitutionalRule` was not flagged in any prior audit task (t1–t16). This should be added to the M-7C tracking list:

- **Type:** `ConstitutionalRule` in `src/types/constitutional.ts`
- **Field:** `governsPatterns` → `governsBlooms`
- **Impact:** Constitutional rule definitions, conformance tests, any runtime rule evaluation

### R4: Audit `tests/safety/` When Available

The safety test directory was not provided. Run the verification grep and perform equivalent analysis when files are available.

### R5: Add CI Guard Against Regression

Formalize the verification command as a CI step:

```bash
grep -rn 'Agent\|Pattern\|observer' tests/ \
  | grep -v 'compat\|alias\|backward\|DevAgent\|ObservableEvent' \
  | grep -v '\.snap' \
  && echo "FAIL: Old terminology found in tests" && exit 1 \
  || echo "PASS: Tests clean"
```

Note the exclusions: `DevAgent` (proper noun), `ObservableEvent` (t12 notes this as retained — "Observable" is distinct from "observer").