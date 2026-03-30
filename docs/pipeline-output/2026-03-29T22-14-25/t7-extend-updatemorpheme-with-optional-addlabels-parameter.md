# Extend updateMorpheme() with optional addLabels parameter

> Task ID: t7
> Model: claude-opus-4-6:adaptive:medium
> Duration: 75242ms
> Output chars: 12702
> Timestamp: 2026-03-29T22:45:27.932Z

> **⚠️ Hallucination flags (3):**
> - [content/warning] Claims 7 axioms (canonical count is 8)
> - [content/warning] Task t7 references "axioms.ts" but this file was not in its context
> - [content/warning] Task t7 references "instantiation.ts" but this file was not in its context

---

# Analysis: Extend updateMorpheme() with Optional addLabels Parameter (t7)

## Summary

The change adds an optional `addLabels?: string[]` parameter to `updateMorpheme()` in `src/graph/instantiation.ts`. When provided, each label is validated against a closed allowlist (`['Archived']`), and labels are applied via `SET n:Label` Cypher within the existing write transaction. The modification is surgically scoped: one signature change, one validation gate, one Cypher addition inside an already-atomic transaction block.

---

## Findings

### F1: Insertion Point — Signature and Parameter Position

**Finding:** `updateMorpheme()` currently has three parameters: `nodeId: string`, `updates: Record<string, unknown>`, `newParentId?: string`. The new `addLabels?: string[]` should be the fourth parameter.

**Evidence:** Lines ~270–274 of instantiation.ts:
```typescript
export async function updateMorpheme(
  nodeId: string,
  updates: Record<string, unknown>,
  newParentId?: string,
): Promise<MutationResult>
```

**Assessment:** Appending a fourth optional parameter preserves backward compatibility — all existing call sites pass 1–3 arguments and will continue to work without modification. No callers need updating. The parameter is optional (`?`), so TypeScript will infer `undefined` when omitted.

**Risk:** None. Optional trailing parameters are fully backward-compatible in TypeScript.

---

### F2: Allowlist Constant — Placement and Design

**Finding:** The allowlist should be a module-level constant, following the established pattern of `VALID_LINE_TYPES`, `VALID_SEED_SUBTYPES`, `VALID_A6_JUSTIFICATIONS`, and `REQUIRED_PROPERTIES` in the same file.

**Evidence:** The file declares multiple `readonly` constant arrays/records at module scope (lines ~50–90) for validation purposes. The pattern is:
```typescript
const VALID_SEED_SUBTYPES: readonly string[] = [
  'Observation', 'Decision', 'TaskOutput', 'Distillation',
];
```

**Recommendation:** Declare at module scope:
```typescript
const VALID_ADD_LABELS: readonly string[] = ['Archived'];
```

Place it near the other validation constants (after `VALID_SEED_SUBTYPES`, ~line 80). The name `VALID_ADD_LABELS` mirrors the `VALID_*` naming convention used throughout the file.

**Future-proofing:** If additional lifecycle labels are anticipated (e.g., `Deprecated`, `Superseded`), this array is the single point of expansion. The t8 analysis confirms `Archived` is already added to the A7 axiom allowlist, so the governance chain is complete for this label.

---

### F3: Validation Logic — Position Within updateMorpheme()

**Finding:** Label validation must occur *before* the write transaction, following the existing validation cascade pattern (Steps 1 → 2 → 2.5 → 3, all pre-write guards). The natural insertion point is after Step 2.5 (retirement guard) and before Step 3 (relationship preservation check for reparenting).

**Evidence:** The function follows a strict pattern:
1. Step 1: Existence check → early return on failure
2. Step 2: Property preservation check → early return on failure
3. Step 2.5: Retirement guard → early return on failure
4. Step 3: Relationship preservation check → early return on failure
5. **try block**: Write transaction (Steps 3–5)
6. Step 6: Read-back verification

**Recommendation:** Insert a new Step 2.7 (or similar) between the retirement guard and the reparenting check:

- If `addLabels` is provided and non-empty:
  - Iterate each label in the array
  - Check membership against `VALID_ADD_LABELS`
  - On any non-allowlisted label: record mutation observation with failure, return `{ success: false, error: ... }`

**Validation semantics:**
- `addLabels` is `undefined` → skip validation entirely (backward compatible)
- `addLabels` is `[]` (empty array) → no-op, skip (defensive but harmless)
- `addLabels` contains only allowlisted values → proceed to write
- `addLabels` contains *any* non-allowlisted value → reject *entire* mutation (fail-fast, not partial application)

**Rationale for fail-fast:** Partial label application (applying some labels but rejecting others) would violate atomicity expectations. The caller should fix their input, not receive partial results.

---

### F4: Cypher Integration — Atomic Label Application Within Write Transaction

**Finding:** Label application must happen inside the existing `writeTransaction()` callback (lines ~340–385) to maintain atomicity. The `SET n:LabelName` Cypher syntax adds a label without removing existing labels.

**Evidence:** The instantiation function already uses this exact pattern for seed sub-types:
```typescript
if (morphemeType === "seed" && options?.subType) {
  await tx.run(
    `MATCH (n:Seed {id: $nodeId}) SET n:${options.subType}`,
    { nodeId },
  );
}
```

**Recommendation:** After Step 4 (property update, ~line 375) and before Step 5 (parent status propagation), add label application:

```cypher
MATCH (n:<label> {id: $nodeId}) SET n:<addLabel>
```

For each label in the validated `addLabels` array, execute a `SET n:Label` clause. Two implementation options:

#### Option A: Single Cypher with concatenated labels (preferred)
Build a single `SET` clause: `SET n:Archived` (or `SET n:Archived:Deprecated` if multiple). This is a single round-trip per transaction.

**Pros:** Minimal Neo4j round-trips. Matches the seed sub-type pattern.
**Cons:** Requires string interpolation for label names (but labels are already validated against the allowlist, so injection risk is zero).

#### Option B: Loop with individual SET statements
For each label, execute a separate `tx.run()`.

**Pros:** Simpler code.
**Cons:** Multiple round-trips within the transaction (negligible for 1 label, but architecturally less clean).

**Assessment:** Option A is preferred. The allowlist validation guarantees only safe strings reach the Cypher interpolation point. This mirrors exactly how `LABEL_MAP[morphemeType]` and `options.subType` are already interpolated into Cypher throughout the file.

---

### F5: Read-Back Verification — Label Persistence Check

**Finding:** The existing read-back verification (Step 6, lines ~387–410) checks that property updates persisted by comparing `updates` entries against the read-back `props`. It does **not** verify labels. The verification should be extended to confirm added labels actually landed.

**Evidence:** Current verification:
```typescript
const verified = await readTransaction(async (tx) => {
  const res = await tx.run(
    `MATCH (n {id: $nodeId}) RETURN properties(n) AS props`,
    { nodeId },
  );
  return res.records[0]?.get("props") as Record<string, unknown> | undefined;
});
```

This query returns `properties(n)` but not `labels(n)`. Labels are metadata, not properties.

**Recommendation:** When `addLabels` is provided and non-empty, extend the read-back query to also return `labels(n)` and verify each requested label is present:

```cypher
MATCH (n {id: $nodeId}) RETURN properties(n) AS props, labels(n) AS labels
```

Then check:
```typescript
if (addLabels?.length) {
  const actualLabels = verified.labels as string[];
  for (const label of addLabels) {
    if (!actualLabels.includes(label)) {
      mismatches.push(`label '${label}' not found after write`);
    }
  }
}
```

**Risk if omitted:** Without label verification, a silent Neo4j failure to apply the label would go undetected. The existing verification pattern is explicitly designed to catch persistence failures — labels should receive the same treatment.

---

### F6: Observation Recording — Content Should Mention Labels

**Finding:** Both success and failure observation recordings (via `recordMutationObservation()`) currently capture `nodeId` and an optional error string. When `addLabels` is part of the mutation, the observation content should reflect that labels were applied.

**Evidence:** `recordMutationObservation()` (lines ~580+) creates an observation Seed with `content` describing the mutation. Currently the content is generic.

**Recommendation:** This is a nice-to-have, not a blocker. If `addLabels` was applied, the success observation could append ` + labels: [Archived]` to the content string. Not strictly required by acceptance criteria but improves auditability.

---

### F7: Interaction with Gnosis Compliance Evaluation (Step 6.5)

**Finding:** After the mutation, `isInEvaluationScope()` may trigger a Gnosis compliance evaluation on the mutated node. The `Archived` label is now in the A7 allowed set (per t8), so a node bearing `Archived` will pass A7.

**Evidence:** t8 analysis confirms `Archived` is added to `ALLOWED_LABELS` in `axioms.ts`. The evaluation runs on the node *after* the write transaction, so the label will be present during evaluation.

**Assessment:** No conflict. The t8 change is a prerequisite for t7 to function correctly under Gnosis evaluation. If t8 were not applied, adding `Archived` would cause A7 violations. The pipeline ordering (t8 before t7 in production deployment) is important.

---

### F8: Backward Compatibility Audit — Existing Call Sites

**Finding:** All existing calls to `updateMorpheme()` in the codebase pass 2–3 arguments. Adding a fourth optional parameter requires no changes to any call site.

**Evidence:** Within `instantiation.ts` itself, `updateMorpheme()` is called from:
- `stampBloomComplete()` — passes `(bloomId, updates)` (2 args)
- `stampBloomComplete()` force-stamp loop — passes `(ecId, { status: "complete" })` (2 args)
- `revertBloomToActive()` — passes `(bloomId, { status: "active" })` (2 args)

External callers (bootstrap scripts, pipeline runners) follow the same 2-arg pattern. No caller currently passes `newParentId` either, but that parameter has existed without issue.

**Risk:** None. TypeScript optional parameters are fully backward-compatible.

---

### F9: Edge Case — Empty or Duplicate Labels in addLabels Array

**Finding:** The function should handle degenerate inputs gracefully:
- `addLabels: []` → No-op (skip label logic entirely)
- `addLabels: ['Archived', 'Archived']` → Idempotent (Neo4j `SET n:Archived` is idempotent; applying twice has no effect)
- `addLabels: ['Archived', 'NotAllowed']` → Reject entire mutation (fail-fast per F3)

**Recommendation:** Deduplicate before validation as a defensive measure, or simply validate each entry (duplicates will pass the allowlist check and Neo4j handles the idempotency). The simpler approach (validate each, let Neo4j deduplicate) is preferred.

---

## Recommendations

1. **Add `VALID_ADD_LABELS` constant** at module scope near other validation constants. Contains `['Archived']`.

2. **Extend `updateMorpheme()` signature** with fourth parameter `addLabels?: string[]`.

3. **Insert validation step** (Step 2.7) after retirement guard, before reparenting check. Reject entire mutation if any label is not in `VALID_ADD_LABELS`. Use `recordMutationObservation()` on rejection for auditability.

4. **Apply labels in write transaction** after property SET (Step 4), before parent status propagation (Step 5). Use `SET n:Label` Cypher interpolation, matching the existing seed sub-type pattern. Allowlist validation guarantees injection safety.

5. **Extend read-back verification** to query `labels(n)` alongside `properties(n)` when `addLabels` is non-empty. Check each requested label is present in the returned labels array.

6. **Export `VALID_ADD_LABELS`** if test files need to reference it, otherwise keep it module-private (consistent with `VALID_A6_JUSTIFICATIONS` which is also private).

7. **Deployment ordering:** Ensure t8 (A7 allowlist update) is deployed before or simultaneously with t7, so that nodes receiving the `Archived` label pass Gnosis compliance evaluation.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Existing call sites break | None | High | Fourth parameter is optional; TypeScript enforces |
| Non-allowlisted label injected into Cypher | None | Critical | Validation gate rejects before write transaction |
| Label not persisted (silent Neo4j failure) | Very Low | Medium | Read-back verification extended to check labels |
| A7 violation on Archived label | None (if t8 deployed) | Medium | t8 adds Archived to ALLOWED_LABELS; pipeline dependency |
| Cypher injection via label string interpolation | None | Critical | Allowlist is closed set of compile-time constants |
| Transaction atomicity broken | None | High | Label SET runs inside existing writeTransaction callback |

**Overall risk: Very Low.** The change is a clean parameter addition with closed-set validation, using an existing Cypher pattern, inside an existing atomic transaction. No architectural changes required.