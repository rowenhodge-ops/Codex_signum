# Extend instantiateMorpheme to accept seed sub-type for multi-label retyping

> Task ID: t1
> Model: claude-opus-4-6:adaptive:high
> Duration: 130379ms
> Output chars: 12447
> Timestamp: 2026-03-23T23:33:50.515Z

> **⚠️ Hallucination flags (8):**
> - [content/warning] Task t1 references "src/graph/queries/observation.ts" but this file was not in its context
> - [content/warning] Task t1 references "src/graph/queries/decision.ts" but this file was not in its context
> - [content/warning] Task t1 references "src/graph/queries/task-output.ts" but this file was not in its context
> - [content/warning] Task t1 references "src/graph/queries/distillation.ts" but this file was not in its context
> - [content/warning] Task t1 references "src/graph/queries/write-observation.ts" but this file was not in its context
> - [content/warning] Task t1 references "src/memory/graph-operations.ts" but this file was not in its context
> - [content/warning] Task t1 references "scripts/bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t1 references "instantiation.ts" but this file was not in its context

---

# Analysis: Extending `instantiateMorpheme` for Seed Sub-Type Multi-Label Retyping

## 1. Current State Assessment

### 1.1 Existing Signature and Flow

The current `instantiateMorpheme` signature is:

```typescript
instantiateMorpheme(morphemeType, properties, parentId, highlander?)
```

For `morphemeType === 'seed'`, the flow is:
1. Required property check: `["id", "name", "content", "seedType", "status"]`
2. Content non-empty check
3. Parent validation — `VALID_CONTAINERS` allows `grid: ["seed"]` and `bloom: ["seed", ...]`
4. Highlander Protocol — **skipped entirely** (only fires for `"resonator"` or `"bloom"`)
5. Atomic transaction: `MERGE (n:Seed {...})` → `MERGE (parent)-[:CONTAINS]->(n)` → `MERGE (n)-[:INSTANTIATES]->(def:Seed {id: 'def:morpheme:seed'})`
6. Observation recorded to `grid:instantiation-observations`

**Finding:** Seeds currently receive a single `:Seed` label. No mechanism exists for secondary labels.

### 1.2 Recursion Boundary Identification

Three functions constitute the governance Resonator self-observation boundary:

| Function | Grid Target | Creates |
|---|---|---|
| `recordInstantiationObservation` | `grid:instantiation-observations` | `:Seed` via raw `CREATE` |
| `recordMutationObservation` | `grid:mutation-observations` | `:Seed` via raw `CREATE` |
| `recordLineObservation` | `grid:line-creation-observations` | `:Seed` via raw `CREATE` |

**Evidence:** All three use `writeTransaction` with raw Cypher `CREATE (obs:Seed {...})`. They are called at the end of every `instantiateMorpheme` invocation. If these were routed through `instantiateMorpheme`, the call chain would be: `instantiateMorpheme` → `recordInstantiationObservation` → `instantiateMorpheme` → `recordInstantiationObservation` → ∞.

**Conclusion:** These three functions (lines ~530–650 in the file) must have zero diff. They are the recursion boundary.

---

## 2. Design Analysis

### 2.1 Parameter Placement

The acceptance criteria use pseudocode notation `instantiateMorpheme('seed', { subType: 'Observation' })`, but the actual function requires `properties` and `parentId` as mandatory positional parameters. The real question is where `subType` lives.

**Option A — Fifth positional parameter:**
```typescript
instantiateMorpheme(morphemeType, properties, parentId, highlander?, subType?)
```
- ✅ Fully backward-compatible (existing callers pass 3–4 args)
- ⚠️ Growing positional parameter list (5 args)

**Option B — Options bag as fifth parameter:**
```typescript
instantiateMorpheme(morphemeType, properties, parentId, highlander?, options?: { subType? })
```
- ✅ Backward-compatible
- ✅ Extensible for future options without further signature changes
- ⚠️ Slightly more ceremony at call sites

**Option C — Embed in `HighlanderOptions`:**
- ❌ Conceptually wrong — Highlander is about duplication control, not typing
- ❌ Seeds skip the Highlander block entirely (`if (morphemeType === "resonator" || morphemeType === "bloom")`)

**Option D — Embed in `properties`:**
- ❌ Mixes control parameters with node data
- ❌ Would require stripping `subType` before writing to Neo4j

**Recommendation:** Option B (options bag) is the strongest choice. It is backward-compatible, semantically clear, and extensible. A new type `SeedSubType` should be defined:

```typescript
export type SeedSubType = 'Observation' | 'Decision' | 'TaskOutput' | 'Distillation';
```

### 2.2 Where the Secondary Label Must Be Added

The secondary label addition (`SET n:Observation`) **must occur inside the same `writeTransaction`** as node creation (Steps 3–5 in the existing code). Reasons:

1. **Atomicity:** If the label addition were a separate transaction and it failed, the graph would contain a `:Seed` node without its operational label — a semantic orphan.
2. **Consistency:** Downstream queries that match on `:Observation` (or `:Decision`, etc.) would miss nodes created during the gap between transactions.
3. **Simplicity:** One additional Cypher statement inside the existing transaction block is trivial.

**Evidence from code:** The existing transaction at Steps 3–5 already runs three sequential `tx.run()` calls (node creation, CONTAINS, INSTANTIATES). Adding a fourth conditional `tx.run()` for label addition follows the established pattern.

### 2.3 Cypher Label Interpolation — Injection Risk

Neo4j does **not** support parameterized labels. The sub-type value must be string-interpolated:

```cypher
MATCH (n:Seed {id: $nodeId}) SET n:Observation
```

The `Observation` here cannot be `$subType` — it must be literal.

**Risk:** If the `subType` value is not validated, an attacker or errant caller could inject arbitrary Cypher via a crafted label string.

**Mitigation:** A strict whitelist check is mandatory before the value reaches any Cypher string:

```typescript
const VALID_SEED_SUBTYPES = ['Observation', 'Decision', 'TaskOutput', 'Distillation'] as const;
```

Reject any value not in this set **before** constructing the query. This mirrors the existing pattern for `VALID_LINE_TYPES`.

### 2.4 Validation Rules

The `subType` parameter should be subject to these guards:

| Rule | Rationale |
|---|---|
| `subType` only valid when `morphemeType === 'seed'` | Only Seeds receive operational sub-types |
| Value must be in `VALID_SEED_SUBTYPES` whitelist | Cypher injection prevention |
| `subType` is optional — absence means plain `:Seed` | Backward compatibility |

If `subType` is provided for a non-seed morpheme type, the function should reject with an explicit error (not silently ignore), following the existing pattern of early-return with descriptive error messages.

---

## 3. Impact Analysis

### 3.1 `getNodeMorphemeType` — No Change Needed

This helper iterates labels and checks `label.toLowerCase()` against `LABEL_MAP`:

```typescript
for (const label of result) {
    const lower = label.toLowerCase();
    if (lower in LABEL_MAP) return lower as MorphemeType;
}
```

For a `:Seed:Observation` node:
- `"Seed"` → `"seed"` → found in `LABEL_MAP` → returns `"seed"` ✅
- `"Observation"` → `"observation"` → not in `LABEL_MAP` → skipped ✅

Neo4j returns labels in non-deterministic order, but since `"Observation"` is not in `LABEL_MAP`, the function will always find `"Seed"` regardless of iteration order.

**Conclusion:** No modification needed. Multi-labeled nodes are correctly identified as seeds.

### 3.2 `VALID_CONTAINERS` — No Change Needed

Current: `grid: ["seed"]`. A `:Seed:Observation` node is still a `:Seed`. The containment check validates morpheme type (derived from `getNodeMorphemeType`), not Neo4j labels directly. Grid → Seed containment remains valid.

### 3.3 `REQUIRED_PROPERTIES` — No Change Needed

Seeds require: `["id", "name", "content", "seedType", "status"]`. Operational sub-types are still seeds and must carry all seed properties. The `seedType` property (e.g., `'observation'`, `'decision'`) provides the property-level typing, while the secondary label provides the graph-level typing. These are complementary, not redundant.

### 3.4 `DEFINITION_MAP` — Potential Consideration

Currently, all seeds INSTANTIATE `def:morpheme:seed`. Sub-typed seeds would also INSTANTIATE this same definition, which is correct — they ARE seeds. If the v5.0 grammar introduces sub-type-level definitions (e.g., `def:morpheme:seed:observation`), a future change could add a second INSTANTIATES edge. **For now, no change is needed.**

### 3.5 Existing Callers — Backward Compatible

The change adds an optional 5th parameter (or expands the 4th). All existing callers pass 3–4 arguments and will continue to work. The `subType` defaults to `undefined`, which means no secondary label is added — identical to current behavior.

### 3.6 Downstream File Impact (Not In Scope for This Task, But Noted)

The task description mentions these files need updating to **call** `instantiateMorpheme` instead of raw Cypher:
- `src/graph/queries/observation.ts`
- `src/graph/queries/decision.ts`
- `src/graph/queries/task-output.ts`
- `src/graph/queries/distillation.ts`
- `src/graph/queries/write-observation.ts`
- `src/memory/graph-operations.ts`
- `scripts/bootstrap-task-executor.ts`

Those changes are separate tasks (t2–t8 per the R-62 decomposition). This task (t1) only modifies `instantiation.ts`.

---

## 4. Detailed Insertion Point

### 4.1 Type Definitions (Top of File)

**Location:** After `MorphemeType` and `LABEL_MAP` declarations (~lines 28–45).

**Add:**
- `SeedSubType` type
- `VALID_SEED_SUBTYPES` const array
- `InstantiationOptions` interface (if using options bag approach)

### 4.2 Signature Modification

**Location:** The `instantiateMorpheme` function signature (~line 108).

**Change:** Add optional parameter. Existing `highlander` parameter position is preserved.

### 4.3 SubType Validation

**Location:** After the grammatical shape check (Step 2), before the Highlander block (Step 2.5). Approximately between the `allowedChildren` check and the `if (morphemeType === "resonator" || morphemeType === "bloom")` block.

**Logic:**
- If `subType` is provided and `morphemeType !== 'seed'` → reject
- If `subType` is provided and not in `VALID_SEED_SUBTYPES` → reject

### 4.4 Secondary Label Application

**Location:** Inside the `writeTransaction` block at Steps 3–5 (~line 191), **after** the MERGE node creation and **before** (or after) the INSTANTIATES wiring. Specifically, after the `MERGE (n:${label} {id: $nodeId})` query.

**Cypher:** 
```cypher
MATCH (n:Seed {id: $nodeId}) SET n:${validatedSubType}
```

This must only execute when `subType` is defined and validated.

### 4.5 What Must NOT Change

The following code blocks must show zero diff:

| Block | Approximate Lines | Reason |
|---|---|---|
| `recordInstantiationObservation` | ~530–570 | Recursion boundary |
| `recordMutationObservation` | ~575–605 | Recursion boundary |
| `recordLineObservation` | ~610–650 | Recursion boundary |

---

## 5. Edge Cases and Risks

### 5.1 Idempotency with MERGE

The existing node creation uses `MERGE (n:Seed {id: $nodeId})`. If a `:Seed` node with that ID already exists:
- `ON MATCH SET` updates properties
- The secondary label `SET n:Observation` is additive and idempotent (adding a label that already exists is a no-op in Neo4j)

**Risk level:** Low. MERGE + SET label is safe for repeated calls.

### 5.2 Multiple Sub-Types on Same Node

Nothing prevents calling `instantiateMorpheme` twice with different sub-types for the same node ID. The second call would add a second operational label (e.g., `:Seed:Observation:Decision`). 

**Risk level:** Low-medium. This would be a caller bug, not an `instantiateMorpheme` bug. If desired, a guard could check for existing operational labels before adding a new one. **Recommendation:** Defer this guard unless it becomes a real issue — the simpler implementation is preferable for now.

### 5.3 `TaskOutput` Label — Camel Case

Neo4j labels are case-sensitive. `TaskOutput` is a valid label. Ensure the constant uses exactly `'TaskOutput'` (not `'Taskoutput'` or `'Task_Output'`). The downstream files that query `:TaskOutput` must match exactly.

### 5.4 Test Verification

The specified verification command:
```
npx tsc --noEmit && npx vitest run tests/conformance/instantiation-protocol.test.ts
```

The test file likely needs new test cases for:
- Each of the four sub-types
- Rejection when sub-type is used with non-seed morpheme type
- Rejection for invalid sub-type value
- Backward compatibility (no sub-type → plain `:Seed`)
- Label verification via `labels(n)` query

---

## 6. Recommendations Summary

| # | Recommendation | Priority |
|---|---|---|
| 1 | Use an options bag as the 5th parameter for extensibility | High |
| 2 | Define `VALID_SEED_SUBTYPES` as a const whitelist, parallel to `VALID_LINE_TYPES` | High |
| 3 | Add the `SET n:${subType}` inside the existing `writeTransaction`, not in a separate transaction | High |
| 4 | Validate sub-type against whitelist **before** any Cypher interpolation | Critical |
| 5 | Reject (not silently ignore) `subType` when `morphemeType !== 'seed'` | High |
| 6 | Export `SeedSubType` type for downstream callers | Medium |
| 7 | Do not modify `getNodeMorphemeType`, `VALID_CONTAINERS`, or `REQUIRED_PROPERTIES` | High |
| 8 | Confirm zero diff on all three `record*Observation` functions | Critical |
| 9 | Add the observation recording message to include sub-type info (e.g., "Created seed:Observation") for traceability | Low |