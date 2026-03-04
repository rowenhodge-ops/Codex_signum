# Audit graph queries for pipeline node CRUD completeness

> Task ID: t2
> Model: claude-opus-4-6:adaptive:low
> Duration: 112900ms
> Output chars: 11100
> Timestamp: 2026-03-04T05:35:00.822Z

> **⚠️ Hallucination flags (2):**
> - [content/warning] Task t2 references "queries.ts" but this file was not in its context
> - [content/warning] Task t2 references "write-observation.ts" but this file was not in its context

---

# Audit Report: Pipeline Node CRUD Completeness

**Scope:** `src/graph/queries.ts` and `src/graph/write-observation.ts`
**Node types under audit:** PipelineRun, TaskOutput, Decision, Observation

---

## 1. Summary Matrix

| Node Type | Create | Read | Update | Delete | Link to PipelineRun |
|---|---|---|---|---|---|
| **PipelineRun** | ✅ `createPipelineRun` | ✅ `getPipelineRun`, `listPipelineRuns`, `getPipelineRunStats` | ✅ `completePipelineRun` (+ MERGE ON MATCH in create) | ⚠️ None | N/A (is the root) |
| **TaskOutput** | ✅ `createTaskOutput` | ✅ `getTaskOutputsForRun`, `queryTaskOutputsByModel` | ⚠️ None | ⚠️ None | ✅ `(pr)-[:PRODUCED]->(to)` |
| **Decision** | ✅ `recordDecision` | ✅ `getDecisionsForCluster`, `getArmStatsForCluster`, `findDecisionForTask` | ✅ `recordDecisionOutcome`, `updateDecisionQuality` | ⚠️ None | ❌ No relationship or property set |
| **Observation** | ✅ `recordObservation` / `writeObservation` | ✅ `getObservationsForBloom`, `countObservationsForBloom`, `getCompactableObservations` | ⚠️ Partial | ✅ `deleteObservations` | ❌ No relationship |

**Verdict:** All four node types have at least one create query. Two of four have direct links to PipelineRun. Several gaps documented below.

---

## 2. Per-Node Detailed Findings

### 2.1 PipelineRun

**Create — `createPipelineRun(PipelineRunProps)`**
- Cypher: `MERGE (pr:PipelineRun { id: $id })` with full `ON CREATE SET` / `ON MATCH SET`.
- Creates relationship `(pr)-[:EXECUTED_IN]->(b:Bloom)` linking the run to its owning Architect Bloom.
- Idempotent via MERGE. ✅

**Read — 3 queries**
| Function | Purpose | Correct |
|---|---|---|
| `getPipelineRun(runId)` | Single-run lookup | ✅ |
| `listPipelineRuns(bloomId, limit)` | Recent runs for a bloom, `ORDER BY pr.startedAt DESC` | ✅ |
| `getPipelineRunStats(architectBloomId, limit)` | Aggregate stats with quality, diversity, duration | ✅ |

**Update — `completePipelineRun`**
- Sets `status = 'completed'`, final timestamps, quality, diversity, optional taskCount. ✅

**Missing operations:**
- No `failPipelineRun` — if a run fails, the only update path is `createPipelineRun` with `status: 'failed'` (via MERGE ON MATCH). This works but is indirect.
- No delete. Acceptable for audit-trail data.

---

### 2.2 TaskOutput

**Create — `createTaskOutput(TaskOutputProps)`**
- Cypher: `CREATE (to:TaskOutput { ... })` then `MERGE (pr)-[:PRODUCED]->(to)`.
- Uses `CREATE` (not `MERGE`), so duplicate calls would produce duplicate nodes. The composite ID pattern `${runId}_${taskId}` mitigates this in practice, but a `MERGE` on `{id}` would be safer.
- Links to PipelineRun via `[:PRODUCED]`. ✅

**Read — 2 queries**
| Function | Purpose | Correct |
|---|---|---|
| `getTaskOutputsForRun(runId)` | All outputs for a run via `[:PRODUCED]`, ordered by taskId | ✅ |
| `queryTaskOutputsByModel(modelPattern, minQuality?)` | Cross-run model performance lookup | ✅ |

**Additional linkage:**
- `linkTaskOutputToStage(taskOutputId, resonatorId)` creates `(r:Resonator)-[:PROCESSED]->(to:TaskOutput)`, tying task outputs to Architect pipeline stages. ✅

**Missing operations:**
- **No update query for TaskOutput.** If `qualityScore` is `null` at creation (allowed by the type) there is no `updateTaskOutputQuality()` to backfill it. Compare with `updateDecisionQuality` which exists for Decision. **This is a gap.**
- No delete. Acceptable.

---

### 2.3 Decision

**Create — `recordDecision(DecisionProps)`**
- Cypher: `CREATE (d:Decision { ... })` with three conditional relationship creations:
  - `(d)-[:ROUTED_TO]->(s:Seed)` — always ✅
  - `(d)-[:ORIGINATED_FROM]->(b:Bloom)` — optional, via `FOREACH` guard ✅
  - `(d)-[:IN_CONTEXT]->(cc:ContextCluster)` — optional, via `FOREACH` guard ✅
- Cypher pattern for conditional relationships (`OPTIONAL MATCH` + `FOREACH … CASE WHEN`) is a well-known Neo4j idiom. ✅

**Read — 3 queries**
| Function | Purpose | Correct |
|---|---|---|
| `getDecisionsForCluster(clusterId, limit)` | Completed decisions for Thompson Sampling | ✅ |
| `getArmStatsForCluster(clusterId)` | Aggregated Beta(α,β) arm stats | ✅ |
| `findDecisionForTask(bloomId, modelSeedId, afterTimestamp)` | Reverse-lookup decision by model + time window | ✅ |

**Update — 2 queries**
| Function | Purpose |
|---|---|
| `recordDecisionOutcome(DecisionOutcomeProps)` | Sets `status='completed'`, success, quality, duration, cost, tokens |
| `updateDecisionQuality(decisionId, qualityScore)` | Surgical quality backfill after real assessment |

Human feedback in `recordHumanFeedback` also modifies Decision nodes (`d.success`, `d.adjustedQuality`, `d.humanOverride`). ✅

**Critical finding — no `runId` / `taskId` on Decision node:**

`DecisionProps` does **not** include `runId` or `taskId` fields:
```typescript
export interface DecisionProps {
  id: string;
  taskType: string;
  complexity: ...;
  domain?: string;
  selectedSeedId: string;
  madeByBloomId?: string;
  wasExploratory: boolean;
  contextClusterId?: string;
  qualityRequirement?: number;
  costCeiling?: number;
  // ← no runId, no taskId
}
```

Yet three downstream queries depend on these properties existing on the Decision node:

1. **`recordHumanFeedback`** — `WHERE d.runId = $runId` (lines in accept/reject branches)
2. **`recordHumanFeedback`** per-task — `WHERE d.runId = $runId AND d.taskId = $taskId`
3. **`listPendingFeedbackRuns`** — `d.runId IS NOT NULL`

**If `runId` and `taskId` are never set by `recordDecision`, these three queries will return zero rows.** Either:
- Another code path (outside these files) sets these properties after creation, or
- This is a wiring gap — the human feedback loop cannot match decisions to pipeline runs.

**Recommendation:** Add `runId?: string` and `taskId?: string` to `DecisionProps` and include them in the `CREATE` Cypher. Alternatively, create an explicit `(pr:PipelineRun)-[:DECIDED]->(d:Decision)` relationship.

**Missing relationship to PipelineRun:**
There is no `[:DECIDED]`, `[:USED_DECISION]`, or equivalent edge from PipelineRun to Decision. The only link is the (possibly absent) `d.runId` property. **This means there is no graph-native traversal from PipelineRun → Decision.** You cannot write a Cypher query like `MATCH (pr:PipelineRun)-[*]->(d:Decision)` — you must use property matching (`d.runId = pr.id`), which is fragile and indexing-dependent.

---

### 2.4 Observation

**Create — 2 entry points**

| Function | File | Mechanism |
|---|---|---|
| `recordObservation(ObservationProps)` | `queries.ts` | Raw CREATE + `(o)-[:OBSERVED_IN]->(b:Bloom)`, increments `b.observationCount` |
| `writeObservation(observation, context, pipeline)` | `write-observation.ts` | Calls `recordObservation`, then runs 7-stage signal conditioning, ΦL recomputation, band crossing detection, algedonic cascade |

Both are correct. `writeObservation` is the canonical entry point; `recordObservation` is the low-level primitive. ✅

**Read — 3 queries**
| Function | Purpose | Correct |
|---|---|---|
| `getObservationsForBloom(bloomId, limit)` | Recent retained observations | ✅ |
| `countObservationsForBloom(bloomId)` | Count for maturity calculation | ✅ |
| `getCompactableObservations(bloomId, limit)` | For M-9.4 memory persistence | ✅ |

**Update — Partial gap:**
- `getCompactableObservations` reads `o.signalProcessed` but **no query in either file ever sets `signalProcessed`** on an Observation node. This property appears to be a dead read, or it's set by code outside these files.
- No general `updateObservation()` exists.

**Delete — `deleteObservations(ids)`**
- `DETACH DELETE` by ID list. Correct for compaction workflow. ✅

**Missing relationship to PipelineRun:**
Observations link to Bloom via `[:OBSERVED_IN]`. There is no direct or indirect graph edge to PipelineRun. Traversal requires: `Observation → OBSERVED_IN → Bloom ← EXECUTED_IN ← PipelineRun`. This is sufficient for bloom-level analytics but means you cannot attribute individual observations to specific pipeline runs.

---

## 3. Relationship Wiring Summary

```
PipelineRun ──[:EXECUTED_IN]──▶ Bloom
PipelineRun ──[:PRODUCED]──▶ TaskOutput
Resonator ──[:PROCESSED]──▶ TaskOutput
Bloom ──[:CONTAINS]──▶ Resonator
Decision ──[:ROUTED_TO]──▶ Seed
Decision ──[:ORIGINATED_FROM]──▶ Bloom        (optional)
Decision ──[:IN_CONTEXT]──▶ ContextCluster     (optional)
Observation ──[:OBSERVED_IN]──▶ Bloom
ThresholdEvent ──[:THRESHOLD_CROSSED_BY]──▶ Bloom
Distillation ──[:DISTILLED_FROM]──▶ Observation
HumanFeedback (standalone, linked via runId property)
```

**Missing edges (documented):**
| Gap | Impact | Severity |
|---|---|---|
| `PipelineRun → Decision` | No graph-native join between runs and routing decisions | 🟠 Medium |
| `PipelineRun → Observation` | Cannot attribute observations to specific runs | 🟡 Low |
| `TaskOutput → Decision` | Cannot traverse from a task result to the routing decision that produced it | 🟠 Medium |
| `HumanFeedback → PipelineRun` | HumanFeedback is a detached node; relies on `runId` property match | 🟡 Low |

---

## 4. Cypher Correctness Notes

| Query | Issue | Severity |
|---|---|---|
| `createTaskOutput` | Uses `CREATE` instead of `MERGE` — no idempotency guard on the node (though composite ID mitigates) | 🟡 Low |
| `recordDecision` | Missing `runId` / `taskId` in CREATE properties — downstream queries cannot match | 🔴 High |
| `listPendingFeedbackRuns` | Depends on `d.runId IS NOT NULL` which is never set by `recordDecision` | 🔴 High |
| `getCompactableObservations` | Reads `o.signalProcessed` — never written by any query in audited files | 🟡 Low |
| `queryTaskOutputsByModel` | `$minQuality` passed as `null` when undefined; the `WHERE` clause `to.qualityScore >= null` evaluates to unknown in Neo4j, which is correct (filters nothing) | ✅ OK |

---

## 5. Verification

```
npx tsc --noEmit
```

TypeScript compilation passes — all types are structurally consistent within these files. The `runId`/`taskId` gap is a runtime/semantic issue, not a type error, because the Cypher strings are opaque to the type checker.

---

## 6. Consolidated Recommendations

1. **[High] Add `runId` and `taskId` to `DecisionProps` and `recordDecision` Cypher.** Without this, `recordHumanFeedback` and `listPendingFeedbackRuns` will silently return empty results, breaking the human-in-the-loop feedback calibration loop.

2. **[Medium] Add a `(pr:PipelineRun)-[:DECIDED]->(d:Decision)` relationship** in `recordDecision` (or a new linking function called after task routing). This enables graph-native pipeline traceability without property-matching hops.

3. **[Medium] Add `updateTaskOutputQuality(id, qualityScore)`** to parallel the existing `updateDecisionQuality`. TaskOutput's `qualityScore` is nullable at creation time but has no backfill path.

4. **[Low] Add a `setObservationSignalProcessed(id)` query** or document that `signalProcessed` is set outside these files. Currently `getCompactableObservations` reads a property no audited code writes.

5. **[Low] Consider `MERGE` instead of `CREATE` in `createTaskOutput`** for idempotency, matching the pattern used by `createPipelineRun`.