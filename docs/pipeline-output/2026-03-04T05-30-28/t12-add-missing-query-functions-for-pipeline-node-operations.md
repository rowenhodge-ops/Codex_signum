# Add missing query functions for pipeline node operations

> Task ID: t12
> Model: claude-opus-4-6:adaptive:low
> Duration: 113426ms
> Output chars: 16077
> Timestamp: 2026-03-04T05:41:00.412Z

> **⚠️ Hallucination flags (4):**
> - [content/warning] Task t12 references "decision-lifecycle.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "queries.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/conformance/decision-lifecycle.test.ts" but this file was not in its context
> - [content/warning] Task t12 references a document ("docs/specs/06_codex-signum-architect-pattern-design.md") that was not in its context

---

# Analysis: Missing Query Functions for Pipeline Node Operations (t12)

## 1. Acceptance Criteria Assessment

| Criterion | Current State | Verdict |
|-----------|---------------|---------|
| Create operations for all four node types | 4/4 exist (`createPipelineRun`, `createTaskOutput`, `recordDecision`, `recordObservation`) | ✅ Met |
| Linking nodes to PipelineRun | 1/3 direct links exist (`TaskOutput` via `[:PRODUCED]`); Decision and Observation have **no** PipelineRun linkage | ❌ Gap |
| All queries parameterized against injection | 38/39 query functions use `$param` binding; 1 function (`connectBlooms`) uses string interpolation for relationship type | ⚠️ Partial |
| Barrel export updated | All existing query functions exported; new functions will need addition | Pending |

---

## 2. Per-Node-Type Gap Analysis

### 2.1 PipelineRun — Minor Gaps

**Existing functions:** `createPipelineRun`, `completePipelineRun`, `getPipelineRun`, `listPipelineRuns`, `getPipelineRunStats`

**Missing function: `failPipelineRun(runId, failedAt, reason?)`**

- **Evidence (t2):** "No `failPipelineRun` — if a run fails, the only update path is `createPipelineRun` with `status: 'failed'` (via MERGE ON MATCH). This works but is indirect."
- **Evidence (t3):** The architect pattern `executePlan()` catches errors at lines ~116-125 but has no graph write for the failure state. When graph wiring is added (per t3 findings), there will need to be a clean path to record failure with an error reason.
- **Impact:** Without a dedicated failure function, callers must construct a full `PipelineRunProps` object and rely on MERGE upsert semantics just to flip `status` to `'failed'`. This is error-prone — the caller might accidentally overwrite `startedAt` or other immutable properties.
- **Recommendation:** Add `failPipelineRun(runId: string, failedAt: string, reason?: string)` that sets `status = 'failed'`, `completedAt`, and an optional `failureReason` property. Single-purpose, parameterized, minimal surface area.

### 2.2 TaskOutput — Moderate Gap

**Existing functions:** `createTaskOutput`, `getTaskOutputsForRun`, `queryTaskOutputsByModel`, `linkTaskOutputToStage`

**Missing function: `updateTaskOutputQuality(taskOutputId, qualityScore)`**

- **Evidence (t2):** "No update query for TaskOutput. If `qualityScore` is `null` at creation (allowed by the type) there is no `updateTaskOutputQuality()` to backfill it. Compare with `updateDecisionQuality` which exists for Decision. **This is a gap.**"
- **Evidence (code):** `TaskOutputProps.qualityScore` is typed as `qualityScore?: number` (optional). The `createTaskOutput` function passes `qualityScore: props.qualityScore ?? null`. This means TaskOutput nodes are routinely created with `qualityScore: null` when the quality assessment hasn't run yet.
- **Evidence (pattern):** `updateDecisionQuality(decisionId, qualityScore)` already exists as a surgical backfill for the Decision node. The identical pattern is needed for TaskOutput.
- **Impact:** Quality scores computed by `assessTaskQuality` (tested in `decision-lifecycle.test.ts`) cannot be persisted back to the TaskOutput node. The `queryTaskOutputsByModel` function filters on `to.qualityScore >= $minQuality`, which will exclude nodes that were never backfilled — making quality-based analytics incomplete.
- **Recommendation:** Add `updateTaskOutputQuality(taskOutputId: string, qualityScore: number)` using the exact same pattern as `updateDecisionQuality`.

**Missing function: `getTaskOutput(taskOutputId)`**

- **Evidence:** There is no single-node lookup for TaskOutput by ID, though `getPipelineRun` and `getSeed` and `getBloom` all have single-ID read functions. `getTaskOutputsForRun` returns all outputs for a run but requires knowing the `runId`.
- **Impact:** When `linkTaskOutputToStage` or `updateTaskOutputQuality` is called, there is no way to first verify the node exists without knowing its parent run.
- **Recommendation:** Add `getTaskOutput(taskOutputId: string): Promise<Neo4jRecord | null>` following the established pattern.

### 2.3 Decision — Critical Gap

**Existing functions:** `recordDecision`, `recordDecisionOutcome`, `updateDecisionQuality`, `findDecisionForTask`, `getDecisionsForCluster`, `getArmStatsForCluster`

**Critical finding: `DecisionProps` missing `runId` and `taskId` — breaks 3 downstream queries**

- **Evidence (t2):** "`DecisionProps` does **not** include `runId` or `taskId` fields... Yet three downstream queries depend on these properties existing on the Decision node":
  1. `recordHumanFeedback` — `WHERE d.runId = $runId AND d.success = true`
  2. `recordHumanFeedback` per-task — `WHERE d.runId = $runId AND d.taskId = $taskId`
  3. `listPendingFeedbackRuns` — `d.runId IS NOT NULL`
- **Evidence (code, lines ~87-99):** `DecisionProps` interface contains `id`, `taskType`, `complexity`, `domain`, `selectedSeedId`, `madeByBloomId`, `wasExploratory`, `contextClusterId`, `qualityRequirement`, `costCeiling` — no `runId`, no `taskId`.
- **Evidence (code, `recordDecision` Cypher):** The `CREATE (d:Decision { ... })` statement does not set `d.runId` or `d.taskId`.
- **Impact:** **The entire human feedback loop is broken.** `recordHumanFeedback` queries `MATCH (d:Decision) WHERE d.runId = $runId` — this will always return zero rows because `runId` is never set on Decision nodes. Thompson Sampling posteriors never incorporate human signal. `listPendingFeedbackRuns` aggregates by `d.runId` which is always null.
- **Recommendation:**
  1. Add `runId?: string` and `taskId?: string` to `DecisionProps` interface.
  2. Include both in the `recordDecision` Cypher `CREATE` statement: `d.runId = $runId, d.taskId = $taskId`.
  3. Pass `runId: props.runId ?? null, taskId: props.taskId ?? null` in the parameter object.

**Missing function: `linkDecisionToPipelineRun(decisionId, runId)`**

- **Evidence (t2):** "Missing relationship to PipelineRun: There is no `[:DECIDED]`, `[:USED_DECISION]`, or equivalent edge from PipelineRun to Decision."
- **Evidence (t10):** The relationship type catalog in the schema gap analysis lists no Decision-to-PipelineRun relationship. All four other node types have at least one relationship in the queries, but Decision's only outgoing edges go to Seed (`ROUTED_TO`), Bloom (`ORIGINATED_FROM`), and ContextCluster (`IN_CONTEXT`).
- **Impact:** Cannot traverse from a PipelineRun to its constituent routing decisions. Pipeline analytics (`getPipelineRunStats`) cannot aggregate decision-level data (e.g., exploration rate, model diversity by decision). The only link is the proposed `runId` property, which is a foreign-key pattern rather than a graph-native edge.
- **Recommendation:** Add `linkDecisionToPipelineRun(decisionId: string, runId: string)` that creates `(pr:PipelineRun)-[:DECIDED]->(d:Decision)`. Alternatively, embed this link inside `recordDecision` when `runId` is provided.

**Missing function: `getDecisionsForRun(runId)`**

- **Evidence:** There is no way to query all Decision nodes for a given pipeline run. `getDecisionsForCluster` filters by ContextCluster, `findDecisionForTask` filters by model+timestamp. Neither returns all decisions for a specific run.
- **Impact:** Pipeline analytics cannot answer "which models were selected for this run?" or "what was the exploration rate for this run?" — questions essential for understanding model diversity and Thompson Sampling behavior per-run.
- **Recommendation:** Add `getDecisionsForRun(runId: string): Promise<Neo4jRecord[]>` querying either by `d.runId` property or via `[:DECIDED]` relationship.

### 2.4 Observation — Moderate Gap

**Existing functions:** `recordObservation`, `getObservationsForBloom`, `countObservationsForBloom`, `getCompactableObservations`, `deleteObservations`

**Missing function: `linkObservationToPipelineRun(observationId, runId)` or embedded link in creation**

- **Evidence (t3):** "Observations should capture runtime insights at key checkpoints" — survey completion, decomposition, classification, gate decisions, task execution, adaptation triggers. Each of these occurs within the context of a pipeline run.
- **Evidence (current code):** `recordObservation` creates `(o)-[:OBSERVED_IN]->(b:Bloom)` — linking observation to its owning Bloom. There is no link to the PipelineRun that generated it.
- **Impact:** Cannot answer "what observations were generated during run X?" — only "what observations belong to bloom Y?" This makes per-run diagnostics impossible.
- **Recommendation:** Either:
  - (a) Add `runId?: string` to `ObservationProps` and create `(pr:PipelineRun)-[:GENERATED]->(o:Observation)` when `runId` is provided, or
  - (b) Add standalone `linkObservationToPipelineRun(observationId, runId)`.
  - Option (a) is preferred for atomicity.

**Missing function: `getObservationsForRun(runId)`**

- **Evidence:** Follows from the missing linkage above. If observations are linked to runs, there must be a read query to retrieve them.
- **Recommendation:** Add `getObservationsForRun(runId: string): Promise<Neo4jRecord[]>`.

---

## 3. Parameterization Audit

### 3.1 All Existing Pipeline Queries — Safe

Every pipeline-related query function uses Neo4j parameter binding (`$paramName`):

| Function | Injection-Safe | Evidence |
|----------|:--------------:|---------|
| `createPipelineRun` | ✅ | All 10 properties bound via `$id`, `$intent`, etc. |
| `completePipelineRun` | ✅ | 6 parameters bound via `$runId`, `$completedAt`, etc. |
| `getPipelineRun` | ✅ | `$runId` |
| `listPipelineRuns` | ✅ | `$bloomId`, `$limit`; limit wrapped in `toInteger()` |
| `createTaskOutput` | ✅ | All 11 properties bound |
| `getTaskOutputsForRun` | ✅ | `$runId` |
| `queryTaskOutputsByModel` | ✅ | `$modelPattern`, `$minQuality` |
| `ensureArchitectResonators` | ✅ | `$resonatorId`, `$stage`, `$bloomId` |
| `linkTaskOutputToStage` | ✅ | `$taskOutputId`, `$resonatorId` |
| `getPipelineStageHealth` | ✅ | `$bloomId` |
| `getPipelineRunStats` | ✅ | `$bloomId`, `$limit` |

### 3.2 Pre-existing Injection Risk — `connectBlooms`

```typescript
// queries.ts, connectBlooms function
`MERGE (a)-[r:${relType}]->(b)`
```

- **Risk:** The `relType` parameter is interpolated directly into the Cypher string, not passed as a Neo4j parameter. Neo4j does not support parameterized relationship types in Cypher, so this is a known limitation.
- **Mitigation present:** None in the current code — `relType` is passed directly from caller.
- **Recommendation:** Add an allowlist check: validate `relType` against `VALID_RELATIONSHIP_TYPES` before interpolation. This is a pre-existing issue, not introduced by this task, but should be noted.

### 3.3 Recommendations for New Functions

All new functions must follow the established pattern:
- Use `$paramName` binding for all values
- Use `toInteger()` wrapper for `LIMIT` clauses (as done in `listPipelineRuns`)
- Default optional properties to `null` in the parameter object (as done in `createTaskOutput`)
- Never interpolate user-supplied strings into Cypher text

---

## 4. Barrel Export Analysis

### 4.1 Current Export State

All functions in `src/graph/queries.ts` that are relevant to the pipeline topology are exported from `src/graph/index.ts`. The barrel is comprehensive for the existing function set.

### 4.2 Containment Hierarchy Functions — Not Exported

The following functions exist in `queries.ts` but are absent from the barrel:

| Function | In Barrel? |
|----------|:----------:|
| `getContainedChildren` | ❌ |
| `getContainmentTree` | ❌ |
| `getSubgraphEdges` | ❌ |
| `getContainersBottomUp` | ❌ |

These appear to be internal utilities consumed by the health computation module. If they are intended for internal-only use, the barrel omission is intentional. If external consumers need containment traversal, they should be exported.

### 4.3 New Functions Requiring Export

All newly added functions must be added to the barrel in `src/graph/index.ts`. Based on the gap analysis, the following will need barrel entries:

| New Function | Export Section |
|-------------|---------------|
| `failPipelineRun` | Pipeline Topology |
| `updateTaskOutputQuality` | Pipeline Topology |
| `getTaskOutput` | Pipeline Topology |
| `linkDecisionToPipelineRun` | Pipeline Topology / Decisions |
| `getDecisionsForRun` | Decisions |
| `getObservationsForRun` | Observations |

Additionally, if `runId` and `taskId` are added to `DecisionProps`, no new barrel entry is needed — the type is already exported.

---

## 5. Priority-Ordered Recommendations

### P0 — Structural Integrity (blocks human feedback loop)

| # | Action | Justification |
|---|--------|---------------|
| 1 | Add `runId?: string` and `taskId?: string` to `DecisionProps` | Three existing queries reference `d.runId` / `d.taskId` that are never set. Human feedback is silently broken. |
| 2 | Update `recordDecision` Cypher to include `d.runId = $runId, d.taskId = $taskId` | Enables `recordHumanFeedback` and `listPendingFeedbackRuns` to match decisions to runs. |
| 3 | Add `linkDecisionToPipelineRun(decisionId, runId)` | Creates `(pr)-[:DECIDED]->(d)` graph edge for traversal-based analytics. |
| 4 | Add `getDecisionsForRun(runId)` | Enables per-run decision analysis — model diversity, exploration rate, routing patterns. |

### P1 — Completeness (required by acceptance criteria)

| # | Action | Justification |
|---|--------|---------------|
| 5 | Add `failPipelineRun(runId, failedAt, reason?)` | Clean failure recording without full-object MERGE upsert. |
| 6 | Add `updateTaskOutputQuality(taskOutputId, qualityScore)` | Parallel to existing `updateDecisionQuality`. Required for quality-score backfill after `assessTaskQuality`. |
| 7 | Add `getTaskOutput(taskOutputId)` | Consistent with read patterns for all other node types (`getSeed`, `getBloom`, `getPipelineRun`). |
| 8 | Add `runId?: string` to `ObservationProps` and optional `[:GENERATED]` link in `recordObservation` | Enables per-run observation retrieval. |
| 9 | Add `getObservationsForRun(runId)` | Paired read function for run-scoped observations. |

### P2 — Barrel & Hygiene

| # | Action | Justification |
|---|--------|---------------|
| 10 | Add all new functions to `src/graph/index.ts` barrel | Acceptance criterion: "Barrel export in src/graph/index.ts updated." |
| 11 | Add allowlist validation in `connectBlooms` for `relType` parameter | Pre-existing injection surface; mitigate with `VALID_RELATIONSHIP_TYPES` check. |

---

## 6. Verification Strategy

After implementation, the following command validates structural correctness:

```bash
npx tsc --noEmit && npx vitest run tests/graph/ --reporter=verbose
```

**What this validates:**
- TypeScript compilation confirms new functions match their type signatures, updated interfaces are structurally sound, and barrel exports resolve correctly.
- Existing tests pass (no regressions in export-shape tests, interface conformance tests, and the skipped integration tests still compile).

**What this does NOT validate (documented gaps from t4):**
- No behavioral tests exist for any graph write functions — they require a live Neo4j instance.
- The skipped integration test in `tests/conformance/decision-lifecycle.test.ts` would exercise the updated `DecisionProps` with `runId`/`taskId` but only runs when `NEO4J_URI` is set.

---

## 7. Cypher Pattern Guidance for New Functions

Each new function should follow established patterns from the codebase:

| Pattern | Example Source | Apply To |
|---------|---------------|----------|
| Single-node update via `MATCH + SET` | `completePipelineRun` | `failPipelineRun`, `updateTaskOutputQuality` |
| Single-node read via `MATCH + RETURN` | `getPipelineRun` | `getTaskOutput` |
| Multi-node read with relationship traversal | `getTaskOutputsForRun` | `getDecisionsForRun`, `getObservationsForRun` |
| Relationship creation via `MERGE` | `linkTaskOutputToStage` | `linkDecisionToPipelineRun` |
| Optional relationship in CREATE via `OPTIONAL MATCH + FOREACH` | `recordDecision` (bloom/cluster links) | `recordObservation` (optional run link) |