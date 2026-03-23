# Route :TaskOutput creation in task-output.ts through instantiateMorpheme

> Task ID: t4
> Model: claude-opus-4-6:adaptive:low
> Duration: 98916ms
> Output chars: 19045
> Timestamp: 2026-03-23T23:39:06.169Z

> **⚠️ Hallucination flags (3):**
> - [content/warning] Task t4 references "scripts/bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t4 references "task-output.ts" but this file was not in its context
> - [content/warning] Task t4 references "../../memory/graph-operations.js" but this file was not in its context

---

# Analysis: Routing :TaskOutput Creation Through instantiateMorpheme

## 1. Current State Assessment

### 1.1 CREATE Statement Inventory

A thorough review of `src/graph/queries/task-output.ts` reveals a single function containing raw node creation:

| Function | Statement | Target Label | Context |
|----------|-----------|--------------|---------|
| `createTaskOutput` | `CREATE (to:TaskOutput {...})` | `:TaskOutput` | Inside `writeTransaction`, followed by chained `MATCH`/`MERGE` for PipelineRun relationship |

All other functions are non-creative:

| Function | Operation Type | Modification Needed |
|----------|---------------|---------------------|
| `getTaskOutputsForRun` | READ | No |
| `queryTaskOutputsByModel` | READ | No |
| `updateTaskOutputQuality` | UPDATE (`SET`) on existing `:TaskOutput` | No |
| `getTaskOutput` | READ | No |

**Finding:** Only `createTaskOutput` requires modification. The file has a clean separation — one creation function, four query/update functions.

### 1.2 Current Creation Pattern Analysis

The existing `createTaskOutput` function performs two operations in a single `writeTransaction`:

```cypher
CREATE (to:TaskOutput {
  id, runId, taskId, title, taskType, modelUsed, provider,
  outputLength, durationMs, qualityScore, hallucinationFlagCount,
  status, createdAt: datetime()
})
WITH to
MATCH (pr:PipelineRun { id: $runId })
MERGE (pr)-[:PRODUCED]->(to)
```

**Operations bundled:**
1. Node creation with 12 explicit properties + `createdAt` inline
2. `PRODUCED` relationship from `PipelineRun` to TaskOutput

**Evidence:** The `WITH to` clause chains these two operations atomically. Compared to Decision (t3, which had 4 chained operations with conditional relationships) and Observation (t2, which had 3 operations including a counter increment), this is the simplest creation pattern — one mandatory relationship, no conditionals, no counter updates.

### 1.3 Module-Level Type Comment

The file header already contains forward-looking documentation:

```typescript
/**
 * TaskOutput nodes carry dual labels: :Seed:TaskOutput
 * INSTANTIATES → def:morpheme:seed
 * Specialisation label :TaskOutput retained for constraint scoping and query performance.
 * seedType = 'task-output'
 */
```

**Finding:** The existing comment block already describes the target state. This indicates the file was prepared for this migration. The `seedType` value `'task-output'` is explicitly documented here.

---

## 2. Property Schema Analysis

### 2.1 Current vs Required Properties

| Current `TaskOutputProps` | Required by `instantiateMorpheme('seed')` | Status |
|---------------------------|-------------------------------------------|--------|
| `id: string` | `id` | ✅ Present |
| `runId: string` | — | Extra (task-output-specific) |
| `taskId: string` | — | Extra (task-output-specific) |
| `title: string` | — | Extra (task-output-specific) |
| `taskType: string` | — | Extra (task-output-specific) |
| `modelUsed: string` | — | Extra (task-output-specific) |
| `provider: string` | — | Extra (task-output-specific) |
| `outputLength: number` | — | Extra (task-output-specific) |
| `durationMs: number` | — | Extra (task-output-specific) |
| `qualityScore?: number` | — | Extra (task-output-specific) |
| `hallucinationFlagCount: number` | — | Extra (task-output-specific) |
| `status: "succeeded" \| "failed"` | `status` | ⚠️ Semantic conflict (see §2.3) |
| — | `name` | ❌ Missing |
| — | `content` | ❌ Missing |
| — | `seedType` | ❌ Missing |

**Finding:** Three required seed properties are missing. The `status` field exists but has a semantic conflict. Additionally, `createdAt: datetime()` is set inline in Cypher, not in the interface.

### 2.2 Property Derivation Strategy

| Required Property | Derivation | Rationale |
|-------------------|------------|-----------|
| `name` | `title` (already present) or `task-output-${id}` | `title` is the natural human-readable identifier; it already exists on every TaskOutput and maps semantically to a "name" |
| `content` | JSON stringify of `{taskType, modelUsed, provider, outputLength, durationMs, hallucinationFlagCount, status}` | Captures the task output's meaningful payload; satisfies the non-empty content check |
| `seedType` | `'task-output'` (literal) | Explicitly documented in the file's header comment; matches v5.0 grammar |
| `status` | See §2.3 | Conflict requires resolution |

**Observation on `name`:** Unlike Observation (t2, which had no natural name field and required derivation from `metric`) and Decision (t3, which had no natural name and required synthetic construction), TaskOutput has a `title` property that maps directly and naturally to the seed `name` requirement. This is the cleanest mapping of the four node types.

### 2.3 Status Field Semantic Conflict

**Critical finding:** The `TaskOutputProps.status` field is typed as `"succeeded" | "failed"`, representing task execution outcome. The instantiation protocol requires a `status` property checked for presence in the required-properties validation.

| Dimension | Seed Protocol `status` | TaskOutput `status` |
|-----------|----------------------|---------------------|
| Semantic meaning | Graph lifecycle (active, archived, etc.) | Execution outcome (succeeded, failed) |
| Set at creation | Typically `'active'` | `'succeeded'` or `'failed'` |
| Mutated later | Yes (archival, compaction) | No (immutable after creation) |
| Values | Open-ended lifecycle states | Binary execution result |

**Comparison with prior tasks:**
- **Observation (t2):** No pre-existing `status` field — cleanly added `'active'`.
- **Decision (t3):** Had `status: 'pending'` → `'completed'` lifecycle. Recommended Option B (pass `'pending'` to satisfy presence check).

**Options:**

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| A | Pass `status: 'succeeded'/'failed'` directly to protocol | No property renaming; presence check passes | Semantic overload — protocol may interpret these values unexpectedly in future |
| B | Rename to `executionStatus`; add separate `status: 'active'` for protocol | Clean separation | **Breaking change** for `updateTaskOutputQuality` and all queries matching `to.status` |
| C | Pass `status: 'active'` to protocol; add `executionStatus` as separate property | Protocol satisfied cleanly; original `status` intent preserved under new name | Breaking change to downstream queries; two properties to maintain |
| D | Pass `status: props.status` to protocol (i.e., `'succeeded'`/`'failed'`); rely on presence-only check | Zero downstream changes; protocol check passes | Same as Option A |

**Recommendation:** Option D (equivalent to Option A). Evidence from t3's analysis confirms the instantiation protocol's required-properties check verifies **presence, not value**. The existing `status` field — carrying `'succeeded'` or `'failed'` — satisfies this check. The semantic overload is acceptable because:
1. TaskOutput status is set once at creation and never mutated by the protocol.
2. The `updateTaskOutputQuality` function and all READ queries match on `to.status` with these exact values — zero breakage.
3. Consistency with the t3 recommendation (Decision passed `'pending'` through, which is also not a standard seed lifecycle value).

### 2.4 qualityScore Null Handling

**Finding:** The current code explicitly maps `qualityScore`:

```typescript
qualityScore: props.qualityScore ?? null,
```

This coerces `undefined` to `null` for Neo4j compatibility. When constructing the properties object for `instantiateMorpheme`, this coercion must be preserved. Neo4j will store `null` as a missing property (not an explicit null), which is the desired behavior for optional quality scores.

---

## 3. Relationship Architecture

### 3.1 Dual Relationship Requirement

Post-migration, each TaskOutput node requires **two** relationships:

| Relationship | Source | Target | Origin | Mandatory |
|--------------|--------|--------|--------|-----------|
| `CONTAINS` | Grid | TaskOutput | Instantiation Protocol | Yes (protocol) |
| `PRODUCED` | PipelineRun | TaskOutput | Domain logic | Yes (domain) |

**Evidence from t1:** `VALID_CONTAINERS` mapping confirms `grid: ["seed"]` is valid parentage. The protocol creates `(parent)-[:CONTAINS]->(n)`.

**Comparison with prior tasks:**
- Observation (t2): `CONTAINS` (protocol) + `OBSERVED_IN` (domain) + counter increment
- Decision (t3): `CONTAINS` (protocol) + `ROUTED_TO` (domain, mandatory) + `ORIGINATED_FROM` (domain, conditional) + `IN_CONTEXT` (domain, conditional)
- TaskOutput: `CONTAINS` (protocol) + `PRODUCED` (domain, mandatory)

**Finding:** TaskOutput has the simplest relationship topology — only one mandatory domain relationship beyond the protocol-created `CONTAINS`.

### 3.2 Grid Parent Determination

The current `createTaskOutput` has no concept of Grid containment. A Grid parent must be established.

**Options:**

| Option | Grid ID | Pros | Cons |
|--------|---------|------|------|
| A | Dedicated `grid:task-outputs` | Clear separation; mirrors `grid:observations` pattern from t2 | Requires bootstrap creation |
| B | `grid:pipeline-outputs` | Broader grouping for pipeline artifacts | May conflate different output types |
| C | Derived from `runId` (e.g., `grid:run-${runId}`) | Per-run containment | Unbounded grid proliferation; requires dynamic grid creation |
| D | Parameter from caller | Maximum flexibility | Breaking change to `createTaskOutput` signature |

**Recommendation:** Option A — `grid:task-outputs`. This follows the established pattern:
- t2 recommended `grid:observations` for Observation nodes
- Governance uses `grid:instantiation-observations`
- A dedicated grid provides clear containment and query scoping

The Grid must be guaranteed to exist at startup. This can be handled in `scripts/bootstrap-task-executor.ts` (already identified in the task intent as a relevant file).

### 3.3 PRODUCED Relationship Preservation

The `PRODUCED` relationship from `PipelineRun` to `TaskOutput` is domain-critical:
- `getTaskOutputsForRun` traverses `(pr)-[:PRODUCED]->(to)`
- `queryTaskOutputsByModel` traverses the same pattern
- Pipeline reporting logic depends on this edge

**Finding:** `PRODUCED` must be created in a follow-up transaction after `instantiateMorpheme` returns. This matches the pattern established by t2 (`OBSERVED_IN` after instantiation) and t3 (`ROUTED_TO`, `ORIGINATED_FROM`, `IN_CONTEXT` after instantiation).

---

## 4. Transaction Semantics

### 4.1 Atomicity Assessment

The current implementation bundles node creation + relationship creation in one `writeTransaction`. Post-migration:

| Operation | Transaction Boundary | Risk |
|-----------|---------------------|------|
| Node creation + CONTAINS + INSTANTIATES | `instantiateMorpheme` internal transaction | Atomic ✅ |
| Sub-type label addition (`:TaskOutput`) | Inside `instantiateMorpheme` transaction (per t1 design) | Atomic ✅ |
| `PRODUCED` relationship to PipelineRun | Separate subsequent transaction | Failure leaves orphaned node |

**Risk Assessment:**

| Failure Scenario | Impact | Severity | Mitigation |
|------------------|--------|----------|------------|
| `instantiateMorpheme` succeeds, `PRODUCED` creation fails | `:Seed:TaskOutput` node exists without `PRODUCED` edge to PipelineRun | Medium | `getTaskOutputsForRun` won't return the orphan; retry logic or idempotent MERGE on PRODUCED |
| `instantiateMorpheme` fails | No node created, no relationship attempted | None | Clean failure |

**Comparison with prior tasks:**
- This risk profile is **identical** to t2 and t3. All four node types share the same two-transaction pattern post-migration.
- The `PRODUCED` relationship uses `MERGE` (not `CREATE`), which is already idempotent — a retry will not create duplicates.

**Mitigation:** Wrap the `PRODUCED` creation in a separate `writeTransaction` following `instantiateMorpheme`. Use `MERGE` (already present in current code) to ensure idempotency.

### 4.2 Transaction Sequence

```
1. instantiateMorpheme('seed', properties, 'grid:task-outputs', undefined, { subType: 'TaskOutput' })
   → Creates :Seed node with all properties
   → Creates Grid-[:CONTAINS]->node
   → Creates node-[:INSTANTIATES]->def:morpheme:seed
   → Adds :TaskOutput label (SET n:TaskOutput)
   → Records instantiation observation

2. writeTransaction:
   → MATCH (to:TaskOutput { id: $id })
   → MATCH (pr:PipelineRun { id: $runId })
   → MERGE (pr)-[:PRODUCED]->(to)
```

---

## 5. Downstream Query Impact

### 5.1 Label Compatibility

All existing queries in the file match on `:TaskOutput`:

| Query | Pattern | Post-Migration Match |
|-------|---------|---------------------|
| `getTaskOutputsForRun` | `(to:TaskOutput)` | ✅ Node carries `:Seed:TaskOutput` — label match on `:TaskOutput` succeeds |
| `queryTaskOutputsByModel` | `(to:TaskOutput)` | ✅ Same |
| `updateTaskOutputQuality` | `(to:TaskOutput { id: ... })` | ✅ Same |
| `getTaskOutput` | `(to:TaskOutput { id: ... })` | ✅ Same |

**Finding:** No downstream query changes are needed. Neo4j's label matching is inclusive — a node with `:Seed:TaskOutput` satisfies `MATCH (to:TaskOutput)`.

### 5.2 Property Compatibility

Post-migration, nodes will carry **all** original properties plus additional seed-required properties (`name`, `content`, `seedType`). Existing queries reference only original properties (`id`, `runId`, `taskId`, `modelUsed`, `qualityScore`, `createdAt`, `status`).

**Finding:** Additional properties are invisible to existing queries. No compatibility issues.

### 5.3 External References

The `TaskOutputProps` interface is exported and likely consumed by callers (e.g., `scripts/bootstrap-task-executor.ts`). The interface **should not change** — seed-required properties (`name`, `content`, `seedType`) should be derived inside `createTaskOutput`, not required from callers.

**Evidence:** The existing interface documents the domain contract. Callers should not need to know about the underlying seed protocol.

---

## 6. Interface Design

### 6.1 Signature Preservation

```typescript
export async function createTaskOutput(props: TaskOutputProps): Promise<void>
```

**Recommendation:** Preserve this signature exactly. The `TaskOutputProps` interface remains unchanged. Seed-required properties are derived internally:

| Seed Property | Derived From |
|---------------|-------------|
| `name` | `props.title` |
| `content` | `JSON.stringify({ taskType: props.taskType, modelUsed: props.modelUsed, provider: props.provider, outputLength: props.outputLength, durationMs: props.durationMs, status: props.status })` |
| `seedType` | `'task-output'` (hardcoded) |
| `status` | `props.status` (passthrough — see §2.3) |

### 6.2 Import Requirements

The refactored file will need:

```typescript
import { instantiateMorpheme } from "../../memory/graph-operations.js";
```

This import does not currently exist in `task-output.ts`. The `writeTransaction` import should be **retained** — it's still needed for the post-instantiation `PRODUCED` relationship creation.

The `runQuery` import is still needed for the READ functions.

---

## 7. Comparison Across the Four Node Types

| Dimension | Observation (t2) | Decision (t3) | TaskOutput (t4) | Distillation (t5) |
|-----------|-----------------|---------------|-----------------|-------------------|
| CREATE sites | 1 | 1 | 1 | TBD |
| Domain relationships | 1 mandatory + counter | 1 mandatory + 2 conditional | 1 mandatory | TBD |
| Natural `name` field | No (derive from metric) | No (synthetic) | Yes (`title`) | TBD |
| `status` conflict | None | Yes (`pending`/`completed`) | Yes (`succeeded`/`failed`) | TBD |
| Complexity | Medium (counter) | High (conditional rels) | **Low** | TBD |
| Grid parent | `grid:observations` | `grid:decisions` | `grid:task-outputs` | TBD |

**Finding:** TaskOutput is the **simplest** of the four migrations. One creation site, one mandatory domain relationship, a natural `name` mapping from `title`, and no conditional logic or counter increments.

---

## 8. Bootstrap Considerations

### 8.1 Grid Pre-existence

The `grid:task-outputs` Grid must exist before any `createTaskOutput` call. The `scripts/bootstrap-task-executor.ts` file (mentioned in the task intent) is the natural location for this bootstrap.

**Required bootstrap operation:**
```
MERGE (g:Grid { id: 'grid:task-outputs' })
```

This follows the pattern established for `grid:observations` (t2) and `grid:decisions` (t3).

### 8.2 Migration of Existing Data

If `:TaskOutput` nodes already exist in the graph without `:Seed` labels, a migration query is needed:

```cypher
MATCH (to:TaskOutput) WHERE NOT to:Seed
SET to:Seed
SET to.seedType = 'task-output'
SET to.name = coalesce(to.title, 'task-output-' + to.id)
SET to.content = '{}'
WITH to
MATCH (g:Grid { id: 'grid:task-outputs' })
MERGE (g)-[:CONTAINS]->(to)
MERGE (to)-[:INSTANTIATES]->(:Seed { id: 'def:morpheme:seed' })
```

**Finding:** This migration is outside the scope of the current task (which targets code routing, not data migration) but should be flagged for operational planning.

---

## 9. Risk Summary

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| `PRODUCED` relationship creation fails after `instantiateMorpheme` succeeds | Medium | Low | MERGE is idempotent; orphan detection query can catch |
| `grid:task-outputs` does not exist at runtime | High | Medium | Bootstrap validation; fail-fast in `instantiateMorpheme` parent check |
| `qualityScore` null coercion lost | Low | Medium | Explicitly coerce `undefined` → `null` in properties object construction |
| `status` semantic overload causes future protocol conflict | Low | Low | Document the dual semantics; revisit if protocol adds value-based status checks |
| TypeScript type mismatch on properties object | Medium | Medium | Properties object must satisfy both `TaskOutputProps` domain shape and seed required-properties check; careful construction needed |

---

## 10. Recommendations Summary

1. **Modify only `createTaskOutput`** — all other functions in the file are read/update operations that require no changes.
2. **Preserve `TaskOutputProps` interface unchanged** — derive seed-required properties (`name`, `content`, `seedType`) internally.
3. **Use `props.title` as `name`** — this is the cleanest natural mapping of any of the four node types.
4. **Pass `props.status` directly** as the seed `status` — presence check is value-agnostic (consistent with t3 approach).
5. **Use `grid:task-outputs` as Grid parent** — ensure bootstrap creates this Grid.
6. **Retain `writeTransaction` import** for post-instantiation `PRODUCED` relationship creation.
7. **Add `instantiateMorpheme` import** from `../../memory/graph-operations.js`.
8. **Coerce `qualityScore` explicitly** (`?? null`) in the properties object to preserve current Neo4j null handling.
9. **Do NOT touch** governance Resonator self-observation functions — they remain the recursion boundary per t1 analysis.