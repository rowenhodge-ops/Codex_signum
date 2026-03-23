# Run full test suite and fix any regressions from routing changes

> Task ID: t12
> Model: claude-opus-4-6:adaptive:medium
> Duration: 132571ms
> Output chars: 19971
> Timestamp: 2026-03-23T23:54:01.367Z

> **⚠️ Hallucination flags (14):**
> - [content/warning] Task t12 references "src/graph/instantiation.ts" but this file was not in its context
> - [content/warning] Task t12 references "src/graph/index.ts" but this file was not in its context
> - [content/warning] Task t12 references "../graph/index.js" but this file was not in its context
> - [content/warning] Task t12 references "tests/graph/queries/observation.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/graph/queries/decision.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/graph/queries/task-output.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/graph/queries/distillation.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/graph/write-observation.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/graph/instantiation.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/memory/graph-operations.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/memory/compaction.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/memory/distillation.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/bootstrap-task-executor.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "index.ts" but this file was not in its context

---

# t12: Test Suite Regression Analysis and Fix Plan for R-62 Routing Changes

## 1. Change Surface Summary

Based on analysis of t1–t11 outputs, the following code modifications were made:

| File | Change | Impact Surface |
|------|--------|---------------|
| `src/graph/instantiation.ts` | New `options?: InstantiationOptions` fifth parameter; `SeedSubType` type; `VALID_SEED_SUBTYPES` whitelist; conditional `SET n:${subType}` in seed transaction | Signature change; new exports |
| `src/graph/queries/observation.ts` | `recordObservation` delegates to `instantiateMorpheme('seed', ..., { subType: 'Observation' })` + post-creation domain transaction | Label change `:Observation` → `:Seed:Observation`; new `CONTAINS`/`INSTANTIATES` relationships |
| `src/graph/queries/decision.ts` | `recordDecision` delegates to `instantiateMorpheme('seed', ..., { subType: 'Decision' })` + post-creation domain transaction | Label change `:Decision` → `:Seed:Decision`; new `CONTAINS`/`INSTANTIATES` relationships |
| `src/graph/queries/task-output.ts` | `createTaskOutput` delegates to `instantiateMorpheme('seed', ..., { subType: 'TaskOutput' })` + post-creation domain transaction | Label change `:TaskOutput` → `:Seed:TaskOutput`; new `CONTAINS`/`INSTANTIATES` relationships |
| `src/graph/queries/distillation.ts` | Both `createDistillation` and `createStructuredDistillation` delegate to `instantiateMorpheme('seed', ..., { subType: 'Distillation' })` + post-creation domain transaction | Label change `:Distillation` → `:Seed:Distillation`; new `CONTAINS`/`INSTANTIATES` relationships |
| `src/graph/index.ts` | Re-exports `VALID_SEED_SUBTYPES`, `SeedSubType`, `InstantiationOptions` | New public API surface |
| `src/graph/write-observation.ts` | No direct changes (delegates to `recordObservation`) | Transitive routing |
| `src/memory/graph-operations.ts` | No direct changes (delegates to `createStructuredDistillation`) | Transitive routing |
| `scripts/bootstrap-task-executor.ts` | No direct changes (delegates to `createTaskOutput`) | Transitive routing |

---

## 2. Regression Category Inventory

### 2.1 Category A — Label Assertion Failures (HIGH PROBABILITY)

**Root Cause:** Tests that assert on node labels will find `:Seed:Observation` where they previously found `:Observation` alone.

**Evidence:** All four node types now carry dual labels. Any test that:
- Asserts `labels(n)` contains exactly one label
- Matches on `MATCH (o:Observation)` without `:Seed` (still works in Neo4j but label-count assertions break)
- Checks return values of creation functions for label metadata

**Affected Query Patterns:**

| Pattern | Before | After | Test Impact |
|---------|--------|-------|-------------|
| `CREATE (o:Observation {...})` | Single label `:Observation` | Dual labels `:Seed:Observation` | Tests asserting on `labels()` output |
| `CREATE (d:Decision {...})` | Single label `:Decision` | Dual labels `:Seed:Decision` | Same |
| `CREATE (to:TaskOutput {...})` | Single label `:TaskOutput` | Dual labels `:Seed:TaskOutput` | Same |
| `CREATE (di:Distillation {...})` | Single label `:Distillation` | Dual labels `:Seed:Distillation` | Same |

**Fix Strategy:** Update label assertions to expect both labels. Cypher `MATCH (o:Observation)` queries continue to work because Neo4j matches on label subsets — a node with `:Seed:Observation` satisfies `MATCH (o:Observation)`. Only tests that assert on the **exact label set** need updates.

### 2.2 Category B — Property Schema Failures (HIGH PROBABILITY)

**Root Cause:** The routing through `instantiateMorpheme` requires four additional seed properties (`name`, `content`, `seedType`, `status`) that were previously absent. Tests that construct creation input without these properties will fail the required-property validation inside `instantiateMorpheme`.

**Evidence from t1 analysis:** The required-properties check for seeds is:
```typescript
["id", "name", "content", "seedType", "status"]
```

**Affected Test Patterns:**

| Node Type | Missing Properties in Existing Tests | Derivation per t2–t5 Analysis |
|-----------|--------------------------------------|-------------------------------|
| Observation | `name`, `content`, `seedType`, `status` | `name` from metric, `content` from JSON payload, `seedType: 'observation'`, `status: 'active'` |
| Decision | `name`, `content`, `seedType` | `name` from id/taskType, `content` from JSON payload, `seedType: 'decision'` |
| TaskOutput | `content`, `seedType` | `name` from `title` (natural mapping), `content` from JSON payload, `seedType: 'task-output'` |
| Distillation | `name`, `content`, `seedType`, `status` | `name` from id, `content` from `insight`, `seedType: 'distillation'`, `status: 'active'` |

**Two sub-scenarios:**

1. **If derivation is internal** (the creation functions derive seed properties from domain properties before calling `instantiateMorpheme`): Existing tests pass property validation because the derivation is transparent. **No test changes needed for this sub-scenario.**

2. **If derivation is caller-responsibility** (callers must provide seed properties): Every test that calls `recordObservation`, `recordDecision`, `createTaskOutput`, `createDistillation`, or `createStructuredDistillation` must be updated with the additional properties. **This is a large blast radius.**

**Recommendation:** The t2–t5 analyses uniformly recommend **internal derivation** (the creation function maps domain properties to seed properties internally). Verify this is the implementation approach — it is critical for minimizing test regressions.

### 2.3 Category C — Mock/Spy Cypher Pattern Failures (MEDIUM PROBABILITY)

**Root Cause:** Tests that mock `writeTransaction` or spy on `tx.run` to capture Cypher statements and assert on their structure will find different Cypher. The creation now goes through `instantiateMorpheme`'s transaction (which uses `MERGE (n:Seed {...})` rather than `CREATE (o:Observation {...})`).

**Affected Patterns:**

| Test Pattern | Before | After |
|--------------|--------|-------|
| Spy on `tx.run`, assert Cypher contains `CREATE (o:Observation` | Matches | Fails — `instantiateMorpheme` uses `MERGE (n:Seed {...})` |
| Mock `writeTransaction` to capture params | Params include only domain properties | Params include seed protocol properties + domain properties |
| Assert single `writeTransaction` call per creation | One transaction: create + relate + counter | Two transactions: instantiation protocol + domain relationships |

**Fix Strategy:**
- Tests that spy on Cypher patterns must be updated to match the `instantiateMorpheme` Cypher patterns (`MERGE (n:Seed {...})`, `SET n:Observation`, `MERGE (parent)-[:CONTAINS]->(n)`, `MERGE (n)-[:INSTANTIATES]->(def)`)
- Tests that count `writeTransaction` calls must account for the two-transaction split
- Consider refactoring these tests to assert on **outcomes** (node exists with correct properties and relationships) rather than **implementation** (specific Cypher emitted)

### 2.4 Category D — New Relationship Assertions (MEDIUM PROBABILITY)

**Root Cause:** Each creation now generates `CONTAINS` (Grid → node) and `INSTANTIATES` (node → definition) relationships that didn't exist before. Tests that assert on the **total relationship count** for a node, or that enumerate all relationships, will find unexpected extras.

**Evidence:** Per the instantiation protocol, after creation:
- `(grid)-[:CONTAINS]->(node)` — new
- `(node)-[:INSTANTIATES]->(def:Seed {id: 'def:morpheme:seed'})` — new
- Domain relationships unchanged (`:OBSERVED_IN`, `:ROUTED_TO`, `:PRODUCED`, `:DISTILLED_FROM`)

**Fix Strategy:** Update relationship-count assertions. If a test previously expected 1 relationship (e.g., `OBSERVED_IN`) on a new Observation node, it should now expect 3 (`OBSERVED_IN` + `CONTAINS` + `INSTANTIATES`).

### 2.5 Category E — Grid Pre-Existence Failures (HIGH PROBABILITY)

**Root Cause:** `instantiateMorpheme` requires a `parentId` parameter pointing to an existing Grid (or Bloom) node. Tests that create Observations/Decisions/TaskOutputs/Distillations in isolation — without first creating a Grid parent — will fail during the parent validation step.

**Evidence from t1 analysis:** `instantiateMorpheme` validates:
1. Parent node exists (`MATCH (parent {id: $parentId})`)
2. Parent can contain this morpheme type (`VALID_CONTAINERS` check)

**Affected Tests:** Any test that calls a creation function without a pre-existing Grid node in the test database.

**Fix Strategy:**
- Add Grid setup to test `beforeEach`/`beforeAll` blocks:
  ```typescript
  // Example setup
  await writeTransaction(async (tx) => {
    await tx.run(`MERGE (g:Grid {id: 'grid:test-observations'})`);
  });
  ```
- Or, if the creation functions use a hardcoded/default Grid ID internally (e.g., `grid:observations`), ensure this Grid is seeded in test fixtures
- If using an in-memory mock, ensure the mock satisfies the parent-existence check

### 2.6 Category F — Transaction Atomicity Test Failures (LOW PROBABILITY)

**Root Cause:** Tests that verify atomicity by asserting that node creation and domain relationship creation happen in a single transaction will fail, because the creation is now split across two transactions (instantiation protocol + domain relationships).

**Evidence from t2 analysis:**
> "The `OBSERVED_IN` relationship and counter update must be performed in a **separate subsequent transaction** after `instantiateMorpheme` completes."

**Impact Assessment:** If tests roll back a transaction and verify that both node and relationship are absent, the two-transaction split introduces a failure window where the node exists but the domain relationship does not. This is an intentional architectural trade-off documented in t2–t5.

**Fix Strategy:** Update atomicity tests to acknowledge the two-phase commit pattern. Consider adding tests that verify recovery behavior (e.g., if the domain relationship transaction fails, the Seed node still exists in the graph with correct labels).

### 2.7 Category G — TypeScript Compilation Failures (LOW-MEDIUM PROBABILITY)

**Root Cause:** Type signature changes in `instantiateMorpheme` and potential changes to creation function interfaces.

**Specific Risks:**

| Risk | Detail |
|------|--------|
| New required imports in test files | If tests import `instantiateMorpheme` directly, they need updated import for `InstantiationOptions` |
| Interface expansion | If `ObservationProps`, `DecisionProps`, etc. gained new required fields, test data factories break |
| Return type changes | If creation functions now return `InstantiationResult` instead of `void`, callers expecting `void` need updates |
| Barrel export changes | Tests importing from `../graph/index.js` need new types available |

**Fix Strategy:** Run `npx tsc --noEmit` first. Fix type errors before running the test suite — type errors manifest as compilation failures, not test failures.

---

## 3. Test File Impact Map

Based on standard test file naming conventions and the module structure:

| Likely Test File | Tests | Expected Failures |
|------------------|-------|-------------------|
| `tests/graph/queries/observation.test.ts` | `recordObservation`, `getObservationsForBloom`, `countObservationsForBloom`, compaction/distillation queries | Categories A, B, C, D, E |
| `tests/graph/queries/decision.test.ts` | `recordDecision`, `recordDecisionOutcome`, cluster queries | Categories A, B, C, D, E |
| `tests/graph/queries/task-output.test.ts` | `createTaskOutput`, `getTaskOutputsForRun`, model queries | Categories A, B, C, D, E |
| `tests/graph/queries/distillation.test.ts` | `createDistillation`, `createStructuredDistillation`, active distillation queries | Categories A, B, C, D, E |
| `tests/graph/write-observation.test.ts` | `writeObservation` integration flow | Categories A, D, E (transitive from observation.ts) |
| `tests/graph/instantiation.test.ts` | `instantiateMorpheme` base protocol tests | Category B (new sub-type tests needed, per t11) |
| `tests/memory/graph-operations.test.ts` | `checkAndDistill`, `runCompaction` | Categories A, D (transitive from distillation.ts) |
| `tests/memory/compaction.test.ts` | Pure function tests | Likely unaffected (operates on data structures, not graph) |
| `tests/memory/distillation.test.ts` | Pure function tests | Likely unaffected |
| `tests/bootstrap-task-executor.test.ts` | Executor integration tests | Category C (mock patterns for `createTaskOutput`) |

---

## 4. Priority-Ordered Fix Sequence

### Phase 1: Compilation Gate (blocking)

**Action:** Run `npx tsc --noEmit`

**Expected Issues:**
1. Missing `InstantiationOptions` / `SeedSubType` imports in test files that reference them
2. Creation function signature changes if interfaces expanded
3. New exports from `index.ts` barrel that test files may need

**Fix:** Resolve all type errors before proceeding. These are the fastest to identify and fix.

### Phase 2: Grid Fixture Setup (blocking for integration tests)

**Action:** Ensure all test fixtures create necessary Grid parent nodes.

**Required Grids (inferred from t2–t5 analysis):**

| Grid ID | Purpose | Created By |
|---------|---------|------------|
| `grid:observations` | Parent for Observation seeds | Test fixture |
| `grid:decisions` | Parent for Decision seeds | Test fixture |
| `grid:task-outputs` | Parent for TaskOutput seeds | Test fixture |
| `grid:distillations` | Parent for Distillation seeds | Test fixture |
| `def:morpheme:seed` | INSTANTIATES target | Bootstrap/schema migration |

**Evidence:** The `instantiateMorpheme` function's seed path creates `MERGE (n)-[:INSTANTIATES]->(def:Seed {id: 'def:morpheme:seed'})`. This definition node must exist or be auto-created by MERGE. The Grid parent must exist for the parent validation step.

**Fix:** Add shared test helper:
```
createTestGrid(gridId) → ensures Grid node exists in test DB
```

### Phase 3: Property Derivation Verification (determines blast radius)

**Action:** Verify whether the creation functions (post-modification) derive seed properties internally or require callers to provide them.

**If internal derivation (recommended by t2–t5):**
- Minimal test changes needed for property assertions
- Tests that pass only domain properties continue to work
- Only need to update assertions that check for exact property sets

**If caller-responsible derivation:**
- Every test calling a creation function needs `name`, `content`, `seedType`, `status` in test data
- This is a large blast radius and indicates an implementation issue (should be revisited)

### Phase 4: Label and Relationship Assertion Updates

**Action:** Update tests that assert on labels or relationship counts.

**Pattern replacements:**

| Before | After |
|--------|-------|
| `expect(labels).toEqual(['Observation'])` | `expect(labels).toContain('Seed'); expect(labels).toContain('Observation')` |
| `expect(labels).toHaveLength(1)` | `expect(labels).toHaveLength(2)` |
| `expect(relCount).toBe(1)` (for domain rel only) | `expect(relCount).toBe(3)` (domain + CONTAINS + INSTANTIATES) |

### Phase 5: Mock/Spy Pattern Updates

**Action:** Update tests that spy on Cypher patterns.

**Recommendation:** Where possible, refactor spy-based tests to outcome-based assertions. Instead of asserting that specific Cypher was emitted, assert that the resulting graph state is correct (correct labels, properties, relationships). This makes tests resilient to future implementation changes.

### Phase 6: New Coverage Tests for Sub-Types

**Action:** Add at least one passing test per node type verifying the full routing path, as required by acceptance criteria.

**Required tests (minimum):**

| Test | Verifies |
|------|----------|
| `Observation creation produces :Seed:Observation dual labels` | Label correctness |
| `Decision creation produces :Seed:Decision dual labels` | Label correctness |
| `TaskOutput creation produces :Seed:TaskOutput dual labels` | Label correctness |
| `Distillation creation produces :Seed:Distillation dual labels` | Label correctness |
| `Observation has Grid CONTAINS relationship` | Protocol compliance |
| `Decision has INSTANTIATES to def:morpheme:seed` | Protocol compliance |
| `Existing domain relationships preserved for all four types` | Non-regression |

---

## 5. Governance Isolation Verification

**Critical constraint from R-62:**
> "Do NOT touch governance Resonator self-observation in instantiation.ts — that's the recursion boundary."

**Verification approach:** Ensure no test accidentally routes governance observations through `instantiateMorpheme`. The three boundary functions (`recordInstantiationObservation`, `recordMutationObservation`, `recordLineObservation`) must remain as raw Cypher `CREATE (obs:Seed {...})` with single `:Seed` label only.

**Test to add:**
- After calling `instantiateMorpheme('seed', ..., { subType: 'Observation' })`, verify that governance observation nodes in `grid:instantiation-observations` have **single** `:Seed` label (NOT `:Seed:Observation`). This confirms the recursion boundary is preserved and governance observations are not conflated with domain observations.

---

## 6. Acceptance Criteria Verification Matrix

| Criterion | Verification Method | Status |
|-----------|-------------------|--------|
| `npx vitest run` passes with zero failures | Execute after all fixes applied | Pending |
| `npx tsc --noEmit` passes | Execute as Phase 1 | Pending |
| No tests skipped that were previously active | Diff test output against baseline; grep for `.skip` additions | Pending |
| Observation creation path covered by passing test | At least one test calls `recordObservation` or `writeObservation` and asserts dual labels | Requires verification or addition |
| Decision creation path covered by passing test | At least one test calls `recordDecision` and asserts dual labels | Requires verification or addition |
| TaskOutput creation path covered by passing test | At least one test calls `createTaskOutput` and asserts dual labels | Requires verification or addition |
| Distillation creation path covered by passing test | At least one test calls `createDistillation` or `createStructuredDistillation` and asserts dual labels | Requires verification or addition |

---

## 7. Risk Summary

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Grid parent missing in test fixtures | **Blocker** | High | Phase 2 fixture setup |
| Definition node `def:morpheme:seed` missing in test DB | **Blocker** | Medium | Schema seed/MERGE auto-creates |
| Property derivation pushed to callers | **High** | Low (if t2–t5 recommendations followed) | Verify implementation matches analysis |
| Mock-based tests assert on old Cypher | **Medium** | Medium | Phase 5 pattern updates |
| Governance observation contaminated with dual labels | **Critical** | Very Low | Explicit isolation test (§5) |
| Two-phase commit breaks atomicity tests | **Medium** | Low | Document as intentional; update affected tests |
| Tests for `getNodeMorphemeType` confused by dual labels | **Low** | Low | Per t1 analysis, `LABEL_MAP` iteration finds `"seed"` first |

---

## 8. Recommended Execution Order

```
1. npx tsc --noEmit                    → Fix all type errors (Phase 1)
2. npx vitest run --reporter=verbose   → Capture baseline failure list
3. Categorize each failure into A–G    → Prioritize fixes
4. Apply Phase 2 (Grid fixtures)       → Re-run
5. Apply Phase 4 (label assertions)    → Re-run  
6. Apply Phase 5 (mock patterns)       → Re-run
7. Add Phase 6 coverage tests          → Re-run
8. npx tsc --noEmit && npx vitest run  → Final gate
9. Verify no .skip additions           → git diff on test files
```

This sequence ensures the fastest path to green: compilation first (catches most issues immediately), then structural prerequisites (Grid fixtures), then assertion updates (the bulk of failures), then new coverage.