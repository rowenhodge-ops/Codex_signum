# Test Archived label in Gnosis A7 axiom checks

> Task ID: t15
> Model: claude-opus-4-6:adaptive:high
> Duration: 70109ms
> Output chars: 10484
> Timestamp: 2026-03-29T22:46:50.986Z

> **⚠️ Hallucination flags (5):**
> - [content/warning] Claims 7 axioms (canonical count is 8)
> - [content/warning] Task t15 references "tests/axioms/a7.test.ts" but this file was not in its context
> - [content/warning] Task t15 references "tests/checks/axioms.test.ts" but this file was not in its context
> - [content/warning] Task t15 references "src/patterns/cognitive/checks/__tests__/axioms.test.ts" but this file was not in its context
> - [content/warning] Task t15 references "axioms.ts" but this file was not in its context

---

# Analysis: Test Archived Label in Gnosis A7 Axiom Checks (t15)

## Summary

This task requires a test that creates a morpheme bearing the `Archived` label, asserts it passes the A7 (Semantic Stability) axiom check, and confirms no other axioms are violated by the label's presence. The test file `tests/axioms/comprehensive.test.ts` was declared as relevant context but was **NOT FOUND**, meaning either the file does not yet exist (and must be created) or the path is incorrect. The analysis below identifies the test structure, fixture design, assertion strategy, and integration points needed.

---

## Findings

### F1: Test File Location — Must Be Created or Appended

**Finding:** The referenced file `tests/axioms/comprehensive.test.ts` does not exist. Two scenarios are possible:

1. **File does not exist yet:** Another task in this pipeline may be responsible for creating it, or this task is the first to need it.
2. **File exists at a different path:** Common alternatives include `tests/axioms/a7.test.ts`, `tests/checks/axioms.test.ts`, or a co-located pattern like `src/patterns/cognitive/checks/__tests__/axioms.test.ts`.

**Evidence:** The task's "Relevant Files" section explicitly marks the file as `(NOT FOUND — this is a defect in DECOMPOSE)`. The verification command is `npm run test -- axioms`, implying the test runner's pattern matching expects a file containing "axioms" in its path or describe block.

**Recommendation:** Place the test at `tests/axioms/comprehensive.test.ts` as originally specified. If another file already hosts axiom tests (discoverable via `find . -path '*/test*' -name '*axiom*'`), append to that file instead. The describe block should be named to match the `-- axioms` filter pattern (e.g., `describe("axioms — Archived label")`).

---

### F2: Test Fixture Design — Minimal Morpheme With Archived Label

**Finding:** The test needs a morpheme node representation that includes `Archived` in its labels array alongside at least one core morpheme label. The `checkA7()` function receives a `target` object and filters `target.labels` against `ALLOWED_LABELS`. The fixture must therefore include:

- A valid core label (e.g., `Seed`, `Bloom`, `Resonator`) — to represent a real morpheme
- The `Archived` label — the label under test
- Standard required properties for the core morpheme type — to avoid triggering other axiom failures (A1, A3, A4)

**Evidence from t8:**
> The `checkA7()` function (starting ~line 202) filters `target.labels` against this exact set. Any label not present triggers a severity `"error"` failure.

**Evidence from t7:**
> `updateMorpheme()` applies `Archived` via an `addLabels` parameter with allowlist `['Archived']`

This means in production, `Archived` is always added to an *existing* morpheme that already has a core label. The fixture should mirror this: a Seed (or Bloom) that also carries `Archived`.

**Recommended fixture shape:**
```
{
  labels: ["Seed", "Archived"],
  properties: {
    id: "test:archived-morpheme",
    name: "Archived Test Morpheme",
    content: "Test content for archived morpheme validation",
    seedType: "config",
    status: "complete",
    createdAt: <timestamp>
  }
}
```

The exact TypeScript type depends on what `checkA7()` accepts — likely a `MorphemeTarget` or similar interface with `labels: string[]` and a properties bag.

---

### F3: A7 Check — Direct Invocation and Assertion

**Finding:** The test must directly invoke `checkA7()` (or the encompassing `runAxiomChecks()` / `validateMorpheme()` function) with the Archived-labeled fixture and assert zero violations.

**Evidence from t8:**
> `checkA7()` filters `target.labels` against `ALLOWED_LABELS.has(l)`. Any label not present triggers a severity `"error"` failure.

**Assertion strategy:**
1. Call `checkA7(fixture)` → expect result to contain no errors
2. Specifically assert that `Archived` is not in any violation's `label` field
3. Assert the return type indicates passing (e.g., `violations.length === 0` or `passed === true`)

**Risk:** If `checkA7()` is not exported individually, the test must use the aggregate axiom runner. The aggregate approach is actually preferable for this task since acceptance criteria require "no other axioms violated."

---

### F4: Cross-Axiom Non-Violation — Full Suite Assertion

**Finding:** The acceptance criteria explicitly require "No other axioms violated by Archived label." This means the test must run *all* axiom checks (A1, A2, A3, A4, A6, A7, A9) against the Archived-labeled morpheme and assert zero violations across the board.

**Evidence from t8's axiom impact table:**

| Axiom | Check Target | Archived Impact |
|-------|-------------|-----------------|
| A1 (Fidelity) | `content` property | None — label is orthogonal |
| A2 (Visible State) | Relationship types | None — label is not a relationship |
| A3 (Transparency) | Required properties per `morphemeType` | None — `Archived` is a label, not `morphemeType` |
| A4 (Provenance) | `createdAt`, `seedType`, `INSTANTIATES` edges | None — label doesn't affect properties |
| A6 (Minimal Authority) | Cross-Bloom `FLOWS_TO` counts | None — label doesn't create relationships |
| A7 (Semantic Stability) | Label allowlist | **Direct** — must pass |
| A9 (Comprehension Primacy) | Content length thresholds | None — label doesn't affect content |

**Recommendation:** The test should invoke the full axiom validation suite, not just `checkA7()` in isolation. This provides the strongest guarantee and directly satisfies the acceptance criterion. The assertion should be:
- Total violation count === 0
- Or: every axiom check returns passing status

**Secondary negative test (optional but valuable):** To confirm the allowlist is actually the mechanism, a companion assertion could verify that a morpheme with an *unknown* label (e.g., `"BogusLabel"`) *does* fail A7. This proves the test isn't vacuously passing.

---

### F5: Graph vs. In-Memory Testing Strategy

**Finding:** Axiom checks may operate in two modes: (a) against in-memory morpheme representations (unit-test friendly), or (b) against live Neo4j graph state (integration-test). The prior task outputs show both patterns.

**Evidence:**
- `checkA7()` receives a `target` object → suggests in-memory evaluation is possible
- A2, A4, A6 check relationships → may require graph queries or mock relationship data
- The verification command `npm run test -- axioms` suggests an existing test infrastructure

**Recommendation:** Prefer in-memory/unit-test approach if `checkA7()` (and the aggregate runner) accept a fully-specified target object without requiring live graph queries. This avoids Neo4j test instance dependencies and keeps the test fast. If relationship-dependent axioms (A2, A4, A6) require graph state, provide minimal mock relationship data or use the existing test harness's graph setup/teardown utilities.

---

### F6: Test Structure — Three Test Cases

**Finding:** The acceptance criteria decompose into three distinct assertions that map cleanly to individual test cases:

| Test Case | Assertion | Covers |
|-----------|-----------|--------|
| 1. Archived label passes A7 | `checkA7(archivedMorpheme)` → no violations | "Morpheme passes Gnosis A7 axiom check", "Label properly recognized as allowed" |
| 2. Full axiom suite passes | `runAllChecks(archivedMorpheme)` → no violations | "No other axioms violated by Archived label", "Validation succeeds without errors" |
| 3. Archived label is in ALLOWED_LABELS | `ALLOWED_LABELS.has("Archived")` → true | "Label properly recognized as allowed" (structural confirmation) |

**Optional case 4 (negative guard):**
| 4. Unknown label fails A7 | `checkA7(bogusLabelMorpheme)` → violation | Proves the check is actually operative |

---

### F7: Dependency on t8 Completion

**Finding:** This test is only meaningful *after* t8 (adding `Archived` to `ALLOWED_LABELS`) is applied. If t8's change is not yet merged, the A7 check will correctly *reject* `Archived`, and this test will fail — which is the expected TDD red-phase behavior.

**Evidence:** t8's analysis confirms the change is a single-element set addition. The test should be written to pass *with* t8 applied and fail *without* it, providing a regression guard.

**Recommendation:** No special handling needed. The test naturally validates t8's implementation. If the pipeline runs tests before applying t8, document the expected failure.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Test file path doesn't match runner glob | Medium | High | Verify `npm run test -- axioms` glob pattern; place file accordingly |
| Axiom check functions not individually exported | Low | Medium | Use aggregate runner; import from `axioms.ts` barrel |
| Fixture missing required properties triggers non-A7 failures | Medium | Medium | Populate all `REQUIRED_PROPERTIES` for chosen morpheme type |
| Test passes vacuously (check not actually running) | Low | High | Add negative test case with unknown label |
| t8 not applied when test runs | Medium | Low | Expected TDD behavior; document dependency |

**Overall risk: Low.** The test is straightforward given the axiom check architecture. The primary implementation risk is fixture completeness (F2) — an incomplete fixture will trigger A1/A3/A4 failures that obscure the A7 assertion.

---

## Recommendations

1. **Create `tests/axioms/comprehensive.test.ts`** (or append to existing axiom test file) with a describe block matching the `-- axioms` filter.

2. **Build a complete morpheme fixture** with labels `["Seed", "Archived"]` and all required Seed properties populated. Incomplete fixtures will cause false failures on non-A7 axioms.

3. **Test A7 in isolation first**, then test the full axiom suite. Two separate test cases provide better diagnostic signal when failures occur.

4. **Include a negative test** with an unrecognized label (e.g., `"UnknownLabel"`) to prove the A7 check is operative and the allowlist mechanism works bidirectionally.

5. **Assert structurally** that `ALLOWED_LABELS` contains `"Archived"` as a direct set membership check — this is the cheapest possible regression guard against accidental removal.

6. **No graph instance required** if axiom checks accept in-memory target objects. Prefer pure unit tests for speed and isolation. If graph state is needed for relationship-dependent axioms, use the test harness's existing setup/teardown pattern.