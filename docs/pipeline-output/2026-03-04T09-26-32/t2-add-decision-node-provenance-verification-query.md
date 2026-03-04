# Add Decision node provenance verification query

> Task ID: t2
> Model: claude-opus-4-6:adaptive:high
> Duration: 55945ms
> Output chars: 7874
> Timestamp: 2026-03-04T09:29:50.270Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] Task t2 references "queries.ts" but this file was not in its context

---

# Analysis: Decision Node Provenance Verification Query

## 1. Current State Assessment

### 1.1 DecisionProps Interface

The `DecisionProps` interface (line ~87) already declares `runId` and `taskId` as **optional** properties:

```typescript
runId?: string;
taskId?: string;
```

This optionality is by design for backward compatibility, but it creates a provenance gap: any Decision node created without these fields becomes invisible to the human feedback wiring.

### 1.2 recordDecision Write Path

In `recordDecision` (line ~280), the Cypher `CREATE` statement sets both properties, but null-coalesces them:

```typescript
runId: props.runId ?? null,
taskId: props.taskId ?? null,
```

In Neo4j, setting a property to `null` is equivalent to **not setting it at all** — the property simply won't exist on the node. This means Decision nodes created without `runId`/`taskId` will have those properties entirely absent, not set to an empty string or sentinel value.

### 1.3 Downstream Dependencies on Provenance

Three critical query paths depend on `runId` and/or `taskId` being present:

| Query Function | Provenance Dependency | Failure Mode if Missing |
|---|---|---|
| `recordHumanFeedback` | `WHERE d.runId = $runId` | Feedback silently fails to match any Decisions — human signal is lost |
| `recordHumanFeedback` (per-task) | `WHERE d.runId = $runId AND d.taskId = $taskId` | Per-task granular feedback cannot bind |
| `listPendingFeedbackRuns` | `WHERE d.runId IS NOT NULL` | Correctly excludes orphan Decisions, but those Decisions can never receive feedback |

**This is the core M-9.VA-FIX concern**: Decision nodes without provenance are permanently disconnected from the human feedback loop, meaning Thompson sampling posteriors for those routing decisions will never incorporate human signal.

### 1.4 getArmStatsForCluster Impact

The arm stats query (line ~310) computes:
```cypher
avg(COALESCE(d.adjustedQuality, d.qualityScore)) AS avgQuality
```

The `adjustedQuality` field is only set by `recordHumanFeedback` when verdict is `"reject"`. Decision nodes missing `runId` can never have their quality adjusted, so the Thompson sampling arms will carry stale, potentially inflated quality estimates for those trials.

## 2. Required Query Design

### 2.1 Cypher Query Structure

The `verifyDecisionProvenance` function needs a **single read transaction** that returns a comprehensive provenance audit. The query should:

1. **Count Decision nodes with/without `runId`** — Uses `CASE WHEN d.runId IS NOT NULL`.
2. **Count Decision nodes with/without `taskId`** — Same pattern.
3. **Identify specific orphan Decision nodes** — Return IDs of nodes missing either field.
4. **Cross-reference with completion status** — A Decision in `status: 'completed'` missing provenance is more severe than one in `status: 'pending'`.

### 2.2 Recommended Return Shape

```typescript
interface DecisionProvenanceReport {
  totalDecisions: number;
  withRunId: number;
  withoutRunId: number;
  withTaskId: number;
  withoutTaskId: number;
  missingBoth: number;
  /** Completed decisions missing provenance — most critical */
  completedWithoutProvenance: number;
  /** IDs of Decision nodes missing runId or taskId */
  orphanDecisionIds: string[];
}
```

This shape gives operators immediate visibility into the severity of the provenance gap.

### 2.3 Query Implementation Considerations

**Single-pass vs. multi-pass**: A single Cypher query using `WITH` chaining and conditional aggregation is preferred over multiple round-trips. The query should use:

```
MATCH (d:Decision)
WITH d,
     d.runId IS NOT NULL AS hasRunId,
     d.taskId IS NOT NULL AS hasTaskId
...
```

This avoids scanning the Decision node set multiple times.

**Orphan ID collection**: The query should `collect()` orphan IDs but cap the list (e.g., `LIMIT 100`) to avoid returning unbounded result sets if the provenance gap is large.

**Completed-but-orphaned count**: This is the most actionable metric. A completed Decision without `runId` means a routing outcome that Thompson sampling learned from but that human feedback can never correct. The query should separately count:
```cypher
sum(CASE WHEN d.status = 'completed' AND NOT hasRunId THEN 1 ELSE 0 END) AS completedWithoutProvenance
```

### 2.4 Export and Module Placement

The function should be:
- Exported from `src/graph/queries.ts` alongside the existing verification/analytics queries
- Named `verifyDecisionProvenance` (matches acceptance criteria)
- Async, returning the typed report interface
- Uses `runQuery(..., "READ")` — this is a pure read operation

The function fits naturally in a new section between the existing `// ============ HUMAN FEEDBACK QUERIES ============` and `// ============ PIPELINE TOPOLOGY QUERIES ============` blocks, or at the end of the human feedback section since it directly supports that feature's correctness.

## 3. Type Safety Verification

Running `npx tsc --noEmit` should pass because:
- The new function would use `runQuery` (already imported)
- Return type would be a plain interface (no new Neo4j driver imports needed)
- The Cypher string is a template literal with no parameter interpolation issues
- All `.get()` calls on Neo4j records would need proper null-coalescing (consistent with existing patterns in the file)

**Potential type issue**: The `Neo4jRecord.get()` return type is `any` in the neo4j-driver typings. The existing codebase casts with `as number` / `as string` throughout (e.g., lines in `getCalibrationMetrics`). The new function should follow the same pattern and use `Number()` / `String()` wrappers for safety, matching the style in `getPipelineStageHealth` and `getPipelineRunStats`.

## 4. Edge Cases and Risks

| Edge Case | Mitigation |
|---|---|
| Zero Decision nodes in graph | All counts return 0; `orphanDecisionIds` is empty array. Query still executes cleanly. |
| Decision nodes with `runId` set to empty string `""` | `IS NOT NULL` returns true for empty strings. Consider adding `AND d.runId <> ''` if empty-string provenance should be treated as missing. |
| Very large number of orphan Decisions | Cap `orphanDecisionIds` collection with a LIMIT to prevent memory pressure on the Neo4j heap. |
| Decision nodes created before M-9.VA-FIX | These are the primary targets. The query correctly identifies them as missing provenance. |

## 5. Recommendations

1. **Implement the query as a single-pass aggregation** with conditional `CASE` expressions — avoids N+1 scans.
2. **Add a `completedWithoutProvenance` metric** — this is the highest-severity indicator since those decisions have already influenced Thompson posteriors without human feedback wiring.
3. **Cap orphan ID collection** at 100 entries with a note in the JSDoc that the full set can be retrieved by adjusting the limit parameter.
4. **Consider adding an empty-string guard** (`d.runId <> ''`) alongside `IS NOT NULL`, since Neo4j treats empty strings as non-null.
5. **Place the function** in the human feedback query section, immediately after `getCalibrationMetrics`, as it serves the same verification purpose.
6. **Add the `DecisionProvenanceReport` interface** to the types section at the top of the file, following the pattern of `CalibrationMetrics`.

## 6. Acceptance Criteria Mapping

| Criterion | Coverage |
|---|---|
| Count of Decision nodes with and without runId | `withRunId` / `withoutRunId` fields |
| Count of Decision nodes with and without taskId | `withTaskId` / `withoutTaskId` fields |
| Identifies Decision nodes missing provenance fields | `orphanDecisionIds` array + `missingBoth` count |
| Exports as `verifyDecisionProvenance` function | Named async export from `queries.ts` |

All four acceptance criteria are satisfiable with the proposed design. The `npx tsc --noEmit` verification step will confirm type-level correctness once implemented.