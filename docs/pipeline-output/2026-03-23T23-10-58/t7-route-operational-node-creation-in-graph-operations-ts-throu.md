# Route operational node creation in graph-operations.ts through instantiateMorpheme

> Task ID: t7
> Model: claude-opus-4-6:adaptive:medium
> Duration: 150331ms
> Output chars: 20857
> Timestamp: 2026-03-23T23:43:15.193Z

> **⚠️ Hallucination flags (12):**
> - [content/warning] Task t7 references "../graph/queries.js" but this file was not in its context
> - [content/warning] Task t7 references "queries.js" but this file was not in its context
> - [content/warning] Task t7 references "graph-operations.ts" but this file was not in its context
> - [content/warning] Task t7 references "distillation.ts" but this file was not in its context
> - [content/warning] Task t7 references "../graph/queries/instantiation.js" but this file was not in its context
> - [content/warning] Task t7 references "../graph/queries/distillation.js" but this file was not in its context
> - [content/warning] Task t7 references "bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t7 references "write-observation.ts" but this file was not in its context
> - [content/warning] Task t7 references "scripts/bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t7 references "src/graph/queries/instantiation.ts" but this file was not in its context
> - [content/warning] Task t7 references "tests/memory/graph-operations.test.ts" but this file was not in its context
> - [content/warning] Task t7 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Analysis: Routing Operational Node Creation in graph-operations.ts Through instantiateMorpheme

## 1. Current State Assessment

### 1.1 Raw Cypher CREATE Statement Inventory

A line-by-line review of `src/memory/graph-operations.ts` reveals a critical finding:

| Raw Cypher CREATE Statements | Count |
|------------------------------|-------|
| `:Observation` | **0** |
| `:Decision` | **0** |
| `:TaskOutput` | **0** |
| `:Distillation` | **0** |
| **Total** | **0** |

**Finding:** This file contains **zero** raw Cypher statements of any kind. It is a pure bridge layer that delegates all graph I/O to imported query functions from `../graph/queries.js`. There is no `tx.run()`, no `writeTransaction()`, and no Cypher template literals in the file.

### 1.2 Creation Path Inventory — Delegation Analysis

Although there are no raw Cypher CREATEs, the file **delegates** node creation through one imported function:

| Delegated Creation | Function Called | Import Source | Called From | Line (approx) |
|--------------------|----------------|---------------|-------------|----------------|
| `:Distillation` | `createStructuredDistillation()` | `../graph/queries.js` | `checkAndDistill()` | ~160 |

**Evidence:** The call occurs inside `checkAndDistill()`:

```typescript
await createStructuredDistillation({
  id: distillationId,
  bloomId,
  confidence: performanceProfile.successRate,
  observationCount: rawObservations.length,
  sourceObservationIds: sourceIds,
  insight: `Performance: ΦL=...`,
  meanPhiL: performanceProfile.meanPhiL,
  phiLTrend: performanceProfile.phiLTrend,
  phiLVariance: performanceProfile.phiLVariance,
  successRate: performanceProfile.successRate,
  windowStart: performanceProfile.windowStart.toISOString(),
  windowEnd: performanceProfile.windowEnd.toISOString(),
  preferredModels: JSON.stringify(routingHints.preferredModels),
  avoidModels: JSON.stringify(routingHints.avoidModels),
});
```

No other imported function from `queries.js` creates `:Observation`, `:Decision`, or `:TaskOutput` nodes from within this file. The remaining query imports are all reads or deletes:

| Imported Function | Operation | Creates Operational Node? |
|---|---|---|
| `getCompactableObservations` | READ | No |
| `deleteObservations` | DELETE | No |
| `getActiveDistillationIds` | READ | No |
| `getObservationsForDistillation` | READ | No |
| `createStructuredDistillation` | **CREATE** | **Yes — :Distillation** |
| `getDistillationsForBloom` | READ | No |
| `supersededDistillation` | UPDATE | No |
| `countObservationsForBloom` | READ | No |

**Conclusion:** The task scope for this file reduces to a single creation path — the `createStructuredDistillation()` call in `checkAndDistill()`.

---

## 2. Routing Decision: Where Should instantiateMorpheme Be Called?

### 2.1 Two Architectural Options

Since `graph-operations.ts` delegates to `createStructuredDistillation()` (which lives in `distillation.ts`), the routing can occur at either layer:

| Option | Layer | Description |
|--------|-------|-------------|
| **A — Query-layer routing** | `distillation.ts` | t5 modifies `createStructuredDistillation()` internally to use `instantiateMorpheme`. `graph-operations.ts` continues calling the same function with the same signature. |
| **B — Caller-layer routing** | `graph-operations.ts` | Replace the `createStructuredDistillation()` call with a direct `instantiateMorpheme('seed', { subType: 'Distillation' })` call, plus separate post-creation domain logic. |

### 2.2 Evaluation Against Acceptance Criteria

The acceptance criterion **"Each operational node creation calls instantiateMorpheme('seed') with the correct subType"** is ambiguous about indirection depth. Analysis of both options:

| Criterion | Option A (Query-layer) | Option B (Caller-layer) |
|-----------|----------------------|------------------------|
| No raw CREATE Cypher in graph-operations.ts | ✅ Trivially satisfied (none exist today) | ✅ Trivially satisfied |
| Each creation calls `instantiateMorpheme('seed')` | ⚠️ Satisfied transitively (call is hidden inside query function) | ✅ Satisfied directly (call visible in this file) |
| Dual labels `:Seed:Distillation` | ✅ Handled by underlying function | ✅ Handled directly |
| Grid CONTAINS relationship | ✅ Handled by underlying function | ✅ Handled directly |
| Existing properties and business logic preserved | ✅ No change to this file's logic | ⚠️ Requires careful reconstruction of domain logic |
| TypeScript compiles | ✅ Minimal change surface | ⚠️ Larger change surface, more compilation risk |

### 2.3 Coordination with Task t5

**Critical dependency:** Task t5 analyzed routing both `createDistillation` and `createStructuredDistillation` in `distillation.ts` through `instantiateMorpheme`. If t5 is implemented as designed, the query-layer function `createStructuredDistillation()` will internally call `instantiateMorpheme('seed', { subType: 'Distillation' })`.

**Scenario matrix:**

| t5 Implementation | graph-operations.ts Action | Result |
|--------------------|---------------------------|--------|
| t5 routes internally | Option A — no change | ✅ Protocol-compliant via delegation. `instantiateMorpheme` is called exactly once per creation. |
| t5 routes internally | Option B — replace call | ❌ **Double routing** — `instantiateMorpheme` would be called twice (once directly, once inside the query function) unless `createStructuredDistillation` is also modified to skip protocol. |
| t5 not yet implemented | Option A — no change | ❌ Creation still bypasses protocol. |
| t5 not yet implemented | Option B — replace call | ✅ Protocol-compliant. But `DISTILLED_FROM` relationships must be handled separately. |

**Finding:** Options A and B are **mutually exclusive with t5's implementation**. If t5 routes `createStructuredDistillation` internally, then graph-operations.ts should NOT also route — that would create double invocations of the instantiation protocol (double observations, double Grid CONTAINS). Conversely, if this file takes over routing, then `createStructuredDistillation` must become a "relationships-only" helper or be bypassed entirely.

### 2.4 Recommendation

**Option A (query-layer routing, coordinate with t5) is the recommended approach** for the following reasons:

1. **Single Responsibility:** `graph-operations.ts` is documented as a "bridge layer that wires pure memory functions to the Neo4j graph via graph query functions." It should not bypass its own query layer to make direct protocol calls.

2. **Avoids Double Protocol Invocation:** If t5 handles the routing inside `createStructuredDistillation`, no changes to `graph-operations.ts` creation logic are needed. The protocol is invoked exactly once.

3. **Minimal Risk:** Zero functional changes to `graph-operations.ts` means zero regression risk for the memory subsystem's orchestration logic.

4. **Import Hygiene:** Under Option B, `graph-operations.ts` would need to import `instantiateMorpheme` from the graph/queries/instantiation module, creating a new cross-cutting dependency from the memory subsystem to the instantiation protocol. Under Option A, the dependency is encapsulated within the query layer where it belongs.

**However**, if the task intent strictly requires `instantiateMorpheme` to be called visibly from this file (not transitively), Option B becomes necessary. In that case, see §3 for the full impact analysis.

---

## 3. Option B Impact Analysis — Direct Routing from graph-operations.ts

If the architectural decision is to route directly from this file (bypassing the query function for creation), the following changes are required.

### 3.1 Import Changes

**New imports required:**

| Import | Source | Purpose |
|--------|--------|---------|
| `instantiateMorpheme` | `../graph/queries/instantiation.js` | Protocol entry point |
| A new helper for `DISTILLED_FROM` relationships | `../graph/queries/distillation.js` (new export) or inline | Domain relationship creation post-instantiation |

**Import to remove (or repurpose):**

| Import | Current Usage | Post-Migration |
|--------|---------------|----------------|
| `createStructuredDistillation` | Called in `checkAndDistill()` | No longer needed for creation; may still be needed if repurposed as relationship-only helper |

### 3.2 Property Mapping — Structured Distillation

Aligning with t5's property derivation analysis, the `instantiateMorpheme` call requires seed-mandated properties:

| Required Property | Derivation from Current Code | Evidence |
|-------------------|------------------------------|----------|
| `id` | `distillationId` (already generated via `generateId()`) | Direct mapping |
| `name` | `distillation-${distillationId}` | No natural name field exists; ID-based naming consistent with t5 recommendation |
| `content` | JSON stringify of `{ insight, confidence, observationCount, meanPhiL, phiLTrend }` | Captures semantic payload; satisfies non-empty content check |
| `seedType` | `'distillation'` (literal) | Per t5 analysis and file header documentation |
| `status` | `'active'` (literal) | Distillations are active upon creation; `supersededDistillation()` later changes state |

**Additional properties to pass through:**

All 13 domain-specific properties currently passed to `createStructuredDistillation` must be included in the properties bag: `bloomId`, `confidence`, `observationCount`, `insight`, `meanPhiL`, `phiLTrend`, `phiLVariance`, `successRate`, `windowStart`, `windowEnd`, `preferredModels`, `avoidModels`, and `sourceObservationIds` (though the last is used only for relationships, not node properties).

### 3.3 Grid Parent Identification

**Current state:** `createStructuredDistillation` has no Grid parent concept. The `instantiateMorpheme` protocol requires a `parentId` for the `CONTAINS` relationship.

**Options (consistent with t5 analysis):**

| Option | Grid ID | Pros | Cons |
|--------|---------|------|------|
| Dedicated distillation grid | `grid:distillations` | Clear separation; matches `grid:observations` pattern from t2 | Requires bootstrap pre-existence |
| Bloom's containing grid | Derive from `bloomId` | Natural hierarchy | Extra query; bloom may lack grid |
| Hardcoded constant | `grid:memory` or `grid:operational` | Single grid for all memory-subsystem-created nodes | Coarser granularity |

**Recommendation:** `grid:distillations` — consistent with the per-type Grid pattern established in t2 (`grid:observations`) and t3. Must be ensured in bootstrap (see §5).

### 3.4 Domain Relationship Handling — DISTILLED_FROM

The current `createStructuredDistillation` creates `DISTILLED_FROM` relationships from the new Distillation to its source Observations via batched `UNWIND`:

```cypher
MATCH (di:Distillation { id: $distId })
UNWIND $obsIds AS obsId
MATCH (o:Observation { id: obsId })
MERGE (di)-[:DISTILLED_FROM]->(o)
```

**Post-migration requirement:** These relationships must still be created after `instantiateMorpheme` returns. Two approaches:

| Approach | Implementation | Pros | Cons |
|----------|---------------|------|------|
| Extract relationship helper | New exported function in `distillation.ts`: `linkDistillationToObservations(distId, obsIds)` | Reusable; clean separation | New function in query layer |
| Inline Cypher in graph-operations.ts | Direct `writeTransaction` with the UNWIND query | Self-contained | Introduces raw Cypher in a file that currently has none |
| Call `createStructuredDistillation` with a "relationships-only" flag | Modify existing function to skip creation when flag set | Reuses existing code | Awkward API; conflates creation and linking |

**Recommendation:** Extract a `linkDistillationToObservations()` helper. This preserves `graph-operations.ts`'s zero-Cypher character while handling the domain relationships that `instantiateMorpheme` doesn't manage.

### 3.5 Transaction Atomicity Analysis

**Current state:** `createStructuredDistillation` executes node creation + relationship creation in a single `writeTransaction`, ensuring atomicity.

**Post-migration state:** Two separate operations:
1. `instantiateMorpheme('seed', ...)` — creates node + Grid CONTAINS + INSTANTIATES in its own transaction
2. `linkDistillationToObservations(distillationId, sourceIds)` — creates DISTILLED_FROM relationships in a separate transaction

**Risk assessment:**

| Failure Scenario | Impact | Severity |
|------------------|--------|----------|
| Step 1 succeeds, Step 2 fails | Distillation node exists without DISTILLED_FROM links | **Medium** — node is semantically incomplete but graph is structurally valid. The `supersededDistillation` logic and compaction can still operate. The `DISTILLED_FROM` links are informational provenance, not structural dependencies. |
| Step 1 fails | No node created, Step 2 never reached | **None** — clean failure |
| Both succeed | Full creation with protocol compliance | **None** — happy path |

**Comparison with prior tasks:**
- t2 (Observation): Similar two-phase issue with `OBSERVED_IN` + counter increment. Assessed as acceptable because observation pipeline is non-fatal by design.
- t3 (Decision): More complex — 3 conditional relationships. Assessed as acceptable with sequential post-creation operations.
- t4 (TaskOutput): Simple — one `PRODUCED` relationship. Minimal atomicity concern.

**Mitigation:** The existing `try/catch` in `checkAndDistill()` already handles failures non-fatally (returns `null` + logs warning). This is documented as a design principle in the file header: "All functions are NON-FATAL." The partial-creation scenario (node without DISTILLED_FROM) is recoverable and non-critical.

---

## 4. Comprehensive Node Type Audit — Absence Verification

To confirm that no other operational node types are created (even indirectly) from this file:

### 4.1 :Observation — Not Created Here

| Function | Observation Interaction | Creates? |
|----------|------------------------|----------|
| `runCompaction()` | Reads via `getCompactableObservations`, deletes via `deleteObservations` | No |
| `checkAndDistill()` | Reads via `getObservationsForDistillation`, maps to pure function inputs | No |
| `processMemoryAfterExecution()` | Reads count via `countObservationsForBloom` | No |

**Evidence:** Observation creation occurs in the executor layer (`bootstrap-task-executor.ts`) or `write-observation.ts`, not in the memory processing pipeline. By the time `processMemoryAfterExecution` is called, the observation for the current execution has already been persisted by the caller.

**Implication:** This file has no responsibility for routing `:Observation` creation. That is handled by tasks t2 and t6 (write-observation.ts).

### 4.2 :Decision — Not Created Here

No reference to `recordDecision` or any Decision creation function exists in the imports or function bodies.

**Implication:** Decision creation routing is entirely within t3's scope (decision.ts).

### 4.3 :TaskOutput — Not Created Here

No reference to `createTaskOutput` or any TaskOutput creation function exists in the imports or function bodies.

**Implication:** TaskOutput creation routing is entirely within t4's scope (task-output.ts) and t8's scope (bootstrap-task-executor.ts).

---

## 5. Bootstrap and Infrastructure Dependencies

### 5.1 Grid Pre-Existence Requirement

If Option B is implemented, the Grid node used as `parentId` for `instantiateMorpheme` must exist before `checkAndDistill()` is called. 

**Current bootstrap state (from task context):** `scripts/bootstrap-task-executor.ts` is listed as a relevant file in R-62. The bootstrap script likely ensures essential Grid nodes exist.

**Required Grid:** `grid:distillations` (or whichever Grid ID is chosen per §3.3).

**Risk:** If the Grid doesn't exist, `instantiateMorpheme` will fail parent validation (`MATCH (parent) WHERE parent.id = $parentId` returns no rows), and distillation creation will silently fail. The non-fatal error handling in `checkAndDistill()` would catch this, but distillations would never persist.

**Recommendation:** Ensure the chosen Grid ID is added to the bootstrap script. This may already be handled by other tasks in the R-62 pipeline that modify `bootstrap-task-executor.ts`.

### 5.2 Import Path Verification

`instantiateMorpheme` is exported from `src/graph/queries/instantiation.ts`. The import path from `graph-operations.ts` would be:

```typescript
import { instantiateMorpheme } from "../graph/queries/instantiation.js";
```

**Verification:** The `../graph/queries.js` barrel export already provides `createStructuredDistillation` and other query functions. If `instantiateMorpheme` is added to the barrel export, the import can use the existing path. If not, a direct import to the instantiation module is needed.

---

## 6. Testing Impact

### 6.1 Existing Test File

The verification command references `tests/memory/graph-operations.test.ts`. This test file likely mocks the imported query functions.

**Impact by option:**

| Option | Test Changes Needed |
|--------|---------------------|
| A (query-layer) | **Minimal to none** — `createStructuredDistillation` mock continues to work; behavior is unchanged from this file's perspective |
| B (caller-layer) | **Moderate** — Must mock `instantiateMorpheme` instead of `createStructuredDistillation`; must mock or add the new relationship helper; must verify correct `subType`, Grid parent, and property mapping |

### 6.2 Test Assertions for Option B

If Option B is implemented, tests should verify:

| Assertion | Purpose |
|-----------|---------|
| `instantiateMorpheme` called with `'seed'` as first arg | Correct morpheme type |
| Options include `subType: 'Distillation'` | Correct sub-type for multi-label retyping |
| Properties include `name`, `content`, `seedType`, `status` | Seed required properties present |
| Properties include all 12 domain-specific fields | Business logic preservation |
| Grid parent ID matches expected constant | CONTAINS relationship target |
| `DISTILLED_FROM` relationships created for all source observation IDs | Domain relationship preservation |
| Supersession logic unchanged | No regression in supersededDistillation calls |
| Non-fatal behavior preserved (try/catch returns null) | Error handling contract |

---

## 7. Summary of Findings and Recommendations

### 7.1 Key Findings

1. **No raw Cypher CREATE statements exist in `graph-operations.ts`.** The first acceptance criterion is trivially satisfied. All node creation is delegated to query-layer functions.

2. **Exactly one creation delegation exists:** `createStructuredDistillation()` in `checkAndDistill()`, producing `:Distillation` nodes.

3. **No other operational node types (Observation, Decision, TaskOutput) are created** from this file, directly or by delegation.

4. **The file's architectural role is orchestration, not direct graph manipulation.** Introducing `instantiateMorpheme` calls here would break the established pattern of delegating all graph writes to the query layer.

5. **Task t5 already covers routing `createStructuredDistillation` through `instantiateMorpheme`** at the query layer. If t5 is implemented, the protocol compliance propagates upward without changes to this file.

### 7.2 Recommendations

| Priority | Recommendation | Rationale |
|----------|---------------|-----------|
| **Primary** | Implement Option A — coordinate with t5 to ensure `createStructuredDistillation` internally uses `instantiateMorpheme`. Make minimal or no changes to `graph-operations.ts` creation logic. | Preserves architectural layering; avoids double protocol invocation; minimal regression risk; consistent with file's documented role as bridge layer. |
| **If Option A rejected** | Implement Option B with: (a) direct `instantiateMorpheme` call replacing `createStructuredDistillation`, (b) extracted `linkDistillationToObservations` helper for domain relationships, (c) `grid:distillations` as parent, (d) property mapping per §3.2. | Satisfies literal reading of acceptance criteria; requires careful coordination with t5 to avoid double routing. |
| **Regardless of option** | Add a comment block at the `checkAndDistill` function documenting that Distillation creation is routed through the Instantiation Protocol (either directly or via the query layer). | Traceability for future maintainers; makes protocol compliance explicit. |
| **Regardless of option** | Verify that `grid:distillations` (or chosen Grid) is present in bootstrap. | Prevents silent creation failures in the non-fatal error path. |
| **Testing** | If Option A: verify in integration tests that `createStructuredDistillation` produces `:Seed:Distillation` dual-labeled nodes. If Option B: add unit test mocks for `instantiateMorpheme` call with correct sub-type. | Ensures protocol compliance is verified at the appropriate layer. |