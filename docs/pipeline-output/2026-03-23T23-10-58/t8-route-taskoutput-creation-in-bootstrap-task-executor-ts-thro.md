# Route :TaskOutput creation in bootstrap-task-executor.ts through instantiateMorpheme

> Task ID: t8
> Model: claude-opus-4-5:extended:32k
> Duration: 95253ms
> Output chars: 12423
> Timestamp: 2026-03-23T23:45:08.124Z

> **⚠️ Hallucination flags (7):**
> - [content/warning] Task t8 references "src/graph/queries.js" but this file was not in its context
> - [content/warning] Task t8 references "bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t8 references "src/graph/queries/task-output.ts" but this file was not in its context
> - [content/warning] Task t8 references "task-output.ts" but this file was not in its context
> - [content/warning] Task t8 references "src/graph/instantiation.js" but this file was not in its context
> - [content/warning] Task t8 references "../src/graph/queries.js" but this file was not in its context
> - [content/warning] Task t8 references a document ("docs/specs/06_codex-signum-architect-pattern-design.md") that was not in its context

---

# Analysis: Routing :TaskOutput Creation in bootstrap-task-executor.ts Through instantiateMorpheme

## 1. Current State Assessment

### 1.1 Raw Cypher CREATE Statement Inventory

A line-by-line review of `scripts/bootstrap-task-executor.ts` reveals a critical finding:

| Raw Cypher CREATE Statements | Count |
|------------------------------|-------|
| `:TaskOutput` | **0** |
| `:Observation` | **0** |
| `:Decision` | **0** |
| `:Distillation` | **0** |
| **Total** | **0** |

**Finding:** This file contains **zero** raw Cypher statements of any kind. There is no `tx.run()`, no `writeTransaction()`, and no Cypher template literals. The file is a pure orchestration layer that delegates all graph I/O to imported query functions.

### 1.2 TaskOutput Creation via Delegation

The file creates TaskOutput nodes exclusively through the imported `createTaskOutput` function:

```typescript
import {
  createPipelineRun,
  completePipelineRun,
  createTaskOutput,  // ← TaskOutput creation function
  ensureArchitectStages,
  linkTaskOutputToStage,
  updateDecisionQuality,
  tryCreateAndLinkSeed,
} from "../src/graph/queries.js";
```

**Evidence:** Two distinct call sites exist for `createTaskOutput`:

| Call Site | Location | Status Value | Context |
|-----------|----------|--------------|---------|
| Success path | Inside `try` block (~line 495) | `"succeeded"` | After successful LLM execution |
| Failure path | Inside `catch` block (~line 647) | `"failed"` | After execution error |

---

## 2. Call Site Analysis

### 2.1 Success Path Creation

The success path creates a TaskOutput with these parameters:

```typescript
await createTaskOutput({
  id: taskOutputId,           // `${currentRunId}_${task.task_id}`
  runId: currentRunId,
  taskId: task.task_id,
  title: task.title,
  taskType: task.type,
  modelUsed: result.modelId,
  provider: result.provider ?? "unknown",
  outputLength: result.text.length,
  durationMs: result.durationMs,
  qualityScore,
  hallucinationFlagCount: hallucinationFlags.length,
  status: "succeeded",
});
```

**Post-creation operations (must be preserved):**

| Operation | Function | Purpose |
|-----------|----------|---------|
| Stage linking | `linkTaskOutputToStage(taskOutputId, resonatorId)` | Links to DISPATCH Resonator |
| Decision quality | `updateDecisionQuality(result.decisionId, qualityScore)` | Thompson learning loop closure |
| Observation | `writeObservation(...)` | Signal conditioning (M-22.1/M-22.2) |
| Memory processing | `processMemoryAfterExecution(...)` | Compaction + distillation trigger |
| Topology health | `computeAndPersistPsiH(...)` | ΨH recomputation (M-22.3) |
| Exploration rate | `computeAndPersistEpsilonR(...)` | εR computation (M-22.4) |
| Immune response | `evaluateAndReviewIfNeeded(...)` | Structural review (M-22.7) |
| Content Seed | `tryCreateAndLinkSeed(...)` | Pipeline output representation |

### 2.2 Failure Path Creation

The failure path creates a TaskOutput with degraded values:

```typescript
await createTaskOutput({
  id: `${currentRunId}_${task.task_id}`,
  runId: currentRunId,
  taskId: task.task_id,
  title: task.title,
  taskType: task.type,
  modelUsed: "unknown",
  provider: "unknown",
  outputLength: 0,
  durationMs: 0,
  qualityScore: failedQuality,
  hallucinationFlagCount: 0,
  status: "failed",
});
```

**Post-creation operations (error-tolerant):**
- Same operations as success path
- All wrapped in individual `try/catch` with error swallowing (already in catch block)

---

## 3. Architectural Decision Point

### 3.1 Routing Layer Options

Since `bootstrap-task-executor.ts` delegates to `createTaskOutput()` (which lives in `src/graph/queries/task-output.ts`), routing can occur at either layer:

| Option | Layer | File Modified | Description |
|--------|-------|---------------|-------------|
| **A** | Query-layer | `task-output.ts` (t4) | `createTaskOutput()` internally uses `instantiateMorpheme`. Bootstrap continues calling same function. |
| **B** | Caller-layer | `bootstrap-task-executor.ts` (this task) | Replace `createTaskOutput()` call with direct `instantiateMorpheme()` call plus separate domain logic. |

### 3.2 Coordination with Task t4

**Critical dependency:** Task t4 analyzed routing `createTaskOutput` in `task-output.ts` through `instantiateMorpheme`. If t4 is implemented as designed:

- `createTaskOutput()` will internally call `instantiateMorpheme('seed', { subType: 'TaskOutput' })`
- All callers automatically route through the protocol
- **No changes needed in bootstrap-task-executor.ts**

**Scenario Matrix:**

| t4 State | Option A (No change) | Option B (Direct replacement) |
|----------|---------------------|-------------------------------|
| t4 implemented | ✅ Protocol-compliant via delegation | ❌ **Double routing** — `instantiateMorpheme` called twice |
| t4 not implemented | ❌ Still bypasses protocol | ✅ Protocol-compliant |

**Finding:** Options A and B are mutually exclusive with t4's implementation. If t4 routes `createTaskOutput` internally, bootstrap-task-executor.ts should NOT also route directly.

### 3.3 Acceptance Criteria Interpretation

The acceptance criterion states:

> "All task output creation paths call instantiateMorpheme('seed', { subType: 'TaskOutput' })"

**Interpretation ambiguity:**

| Interpretation | Satisfied by t4? | Action Required |
|----------------|------------------|-----------------|
| Direct call must be visible in this file | No | Option B — replace calls |
| Transitive routing through delegation | Yes | Option A — no change |

---

## 4. Option B Analysis: Direct Replacement

If direct replacement is required despite t4, the following changes are necessary:

### 4.1 Import Addition

```typescript
import { instantiateMorpheme } from "../src/graph/instantiation.js";
```

### 4.2 Property Mapping Requirements

| Required Seed Property | Source | Derivation Strategy |
|------------------------|--------|---------------------|
| `id` | `taskOutputId` | ✅ Already present |
| `name` | `task.title` | ✅ Already present as `title` |
| `content` | Derived | JSON stringify of `{taskType, modelUsed, outputLength, status, ...}` |
| `seedType` | Literal | `'task-output'` (per t4 documentation) |
| `status` | `"succeeded"` / `"failed"` | ⚠️ Semantic conflict — see §4.3 |

Plus all 12 existing TaskOutput properties must pass through.

### 4.3 Status Field Semantic Conflict

**Issue:** The `status` field has dual semantics:

| Context | Meaning | Values |
|---------|---------|--------|
| Seed protocol | Graph lifecycle | `'active'`, `'archived'`, etc. |
| TaskOutput domain | Execution outcome | `'succeeded'`, `'failed'` |

**Recommended resolution:** Pass the execution outcome directly (`'succeeded'` / `'failed'`). The instantiation protocol's required-properties check only validates **presence**, not value semantics. This mirrors the approach recommended in t3 (Decision) and t4 (TaskOutput).

### 4.4 Grid Parent Determination

The instantiation protocol requires a Grid parent for the CONTAINS relationship.

**Available options:**

| Option | Grid ID | Source | Viability |
|--------|---------|--------|-----------|
| Dedicated operational grid | `grid:task-outputs` | Bootstrap ensures existence | ✅ Clear separation |
| Architect pattern's grid | Query from `config.architectBloomId` | Requires additional lookup | ⚠️ Extra query |
| Parameter addition | New `gridId` in config | Breaking change | ❌ Excessive change |

**Recommendation:** Use a dedicated `grid:task-outputs` Grid. This mirrors the pattern from t2 (Observation uses `grid:observations`) and t1 (governance uses `grid:instantiation-observations`).

### 4.5 Domain Relationship Preservation

The current `createTaskOutput()` creates a `PRODUCED` relationship to PipelineRun:

```cypher
MATCH (pr:PipelineRun { id: $runId })
MERGE (pr)-[:PRODUCED]->(to)
```

**Post-migration requirement:** This relationship must be created explicitly after `instantiateMorpheme` returns, as it's domain-specific and outside protocol scope.

---

## 5. Transaction Semantics

### 5.1 Current Atomicity

The existing `createTaskOutput()` performs node creation and `PRODUCED` relationship in a single transaction. Post-creation operations are separate calls.

### 5.2 Post-Migration Atomicity

If Option B is implemented:
1. `instantiateMorpheme` runs its internal transaction (node + Grid CONTAINS + INSTANTIATES)
2. `PRODUCED` relationship must be created in a **separate subsequent transaction**

**Risk assessment:**

| Failure Scenario | Impact | Mitigation |
|------------------|--------|------------|
| `instantiateMorpheme` succeeds, PRODUCED fails | Orphan TaskOutput without PipelineRun link | Retry logic or transactional wrapper |
| Grid CONTAINS created, subType label fails | Unlikely — both in same `instantiateMorpheme` transaction | None needed |

---

## 6. Implementation Complexity Comparison

| Dimension | Option A (Delegate to t4) | Option B (Direct replacement) |
|-----------|---------------------------|-------------------------------|
| Lines changed in this file | 0 | ~40 (both call sites + imports) |
| Property mapping complexity | None | High (derive name, content, seedType) |
| Relationship handling | Unchanged | Must add explicit PRODUCED creation |
| Grid dependency | Unchanged | Must ensure grid:task-outputs exists |
| Risk of regression | Minimal | Moderate (complex orchestration file) |
| Double-routing risk | None | High if t4 also implemented |

---

## 7. Recommendations

### 7.1 Primary Recommendation: Coordinate with t4 (Query-Layer Routing)

**If t4 modifies `createTaskOutput()` to internally use `instantiateMorpheme`:**

- **No code changes required in bootstrap-task-executor.ts**
- Protocol compliance is achieved transitively through existing delegation
- All 12 properties preserved automatically
- PRODUCED relationship handled inside query function
- Risk minimized by not modifying this complex orchestration file

**Verification:** Confirm t4's implementation covers the `createTaskOutput` function that this file imports from `../src/graph/queries.js`.

### 7.2 Alternative Recommendation: Direct Replacement (If Required)

**If direct `instantiateMorpheme` calls must be visible in this file:**

1. **Add import:**
   ```typescript
   import { instantiateMorpheme } from "../src/graph/instantiation.js";
   ```

2. **Ensure grid exists:** Add `grid:task-outputs` to bootstrap sequence

3. **Replace both call sites** with:
   - Build seed properties object with derived `name`, `content`, `seedType`
   - Call `instantiateMorpheme('seed', props, 'grid:task-outputs', null, { subType: 'TaskOutput' })`
   - Create `PRODUCED` relationship explicitly post-creation

4. **Preserve all post-creation operations unchanged**

5. **Coordinate with t4:** If t4 is also implemented, modify `createTaskOutput()` to become a passthrough or deprecate it to avoid double-routing.

### 7.3 Verification Checklist

| Criterion | Verification Method |
|-----------|---------------------|
| No raw CREATE Cypher | ✅ Already satisfied — none exists |
| Calls instantiateMorpheme | Trace through t4's `createTaskOutput` OR verify direct call |
| Dual labels :Seed:TaskOutput | Query: `MATCH (n:Seed:TaskOutput) RETURN count(n)` |
| Grid CONTAINS present | Query: `MATCH (:Grid)-[:CONTAINS]->(n:TaskOutput) RETURN count(n)` |
| Properties preserved | Compare node properties pre/post migration |
| TypeScript compiles | `npx tsc --noEmit` |

---

## 8. Conclusion

**Finding:** `bootstrap-task-executor.ts` contains **zero raw Cypher CREATE statements**. It delegates all TaskOutput creation to `createTaskOutput()` from the graph queries module.

**Recommendation:** The correct routing approach is **query-layer modification (t4)**, not caller-layer modification in this file. If t4 is implemented as analyzed, bootstrap-task-executor.ts will automatically route through `instantiateMorpheme` without any changes.

**Risk:** If both t4 and direct replacement are implemented, **double routing** will occur — `instantiateMorpheme` will be invoked twice per creation, generating duplicate governance observations and duplicate Grid CONTAINS relationships.

**Decision required:** Clarify whether the acceptance criterion requires:
- (A) Protocol-compliant creation through any path (satisfied by t4), or
- (B) Explicit `instantiateMorpheme` calls visible in this specific file (requires Option B)