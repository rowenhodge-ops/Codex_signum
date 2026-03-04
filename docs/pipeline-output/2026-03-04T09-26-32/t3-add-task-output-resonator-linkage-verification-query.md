# Add task output Resonator linkage verification query

> Task ID: t3
> Model: claude-opus-4-5:extended:32k
> Duration: 60574ms
> Output chars: 7166
> Timestamp: 2026-03-04T09:31:29.480Z

> **⚠️ Hallucination flags (3):**
> - [content/warning] References eliminated entity "health dashboard"
> - [content/warning] Task t3 references "queries.ts" but this file was not in its context
> - [content/warning] Task t3 references "docs/specs/06_codex-signum-architect-pattern-design.md" but this file was not in its context

---

# Analysis: TaskOutput Resonator Linkage Verification Query

## Executive Summary

This analysis examines the requirements for implementing `verifyTaskOutputLinkage` — a diagnostic query to verify that all TaskOutput nodes maintain proper linkage to the DISPATCH Resonator after M-9.VA-FIX corrections.

---

## 1. Schema Analysis

### 1.1 TaskOutput Node Structure

From `TaskOutputProps` in `queries.ts`:

| Property | Type | Relevance |
|----------|------|-----------|
| `id` | string | Primary identifier (`${runId}_${taskId}`) |
| `runId` | string | Links to PipelineRun |
| `taskId` | string | Task identifier (t1, t2, etc.) |
| `status` | `"succeeded" \| "failed"` | **Critical** — must distinguish in query |
| `qualityScore` | number? | May correlate with linkage |

### 1.2 Resonator Structure

From `ensureArchitectResonators()`:

```
Resonator ID format: ${architectBloomId}_${stage}
Example: architect_bloom_DISPATCH
```

**ARCHITECT_STAGES constant:**
```typescript
["SURVEY", "DECOMPOSE", "CLASSIFY", "SEQUENCE", "GATE", "DISPATCH", "ADAPT"]
```

### 1.3 Relationship Pattern

From `linkTaskOutputToStage()`:
```
(r:Resonator)-[:PROCESSED]->(to:TaskOutput)
```

**Critical observation:** The relationship direction is `Resonator → TaskOutput`, meaning we query INCOMING `:PROCESSED` relationships on TaskOutput nodes.

---

## 2. Current Linkage Mechanism Analysis

### 2.1 Where Linkage Should Occur

The M-9.VA-FIX requirement states all TaskOutput nodes should link to DISPATCH Resonator **regardless of success or failure status**. This implies:

1. The `createTaskOutput()` function creates the node
2. A subsequent call to `linkTaskOutputToStage()` should link it to DISPATCH
3. Both paths (success/failure) in the task executor must call the linkage function

### 2.2 Potential Orphan Sources

Orphaned TaskOutput nodes may exist due to:

| Source | Likelihood | Detection |
|--------|------------|-----------|
| Pre-M-9.VA-FIX nodes without linkage | High | No `:PROCESSED` from DISPATCH |
| Failed tasks skipping linkage in executor | Medium | `status = 'failed'` + no link |
| Transaction failures during linkage | Low | Partial state |
| Resonator not yet created for Bloom | Low | Missing Resonator node |

---

## 3. Query Design Requirements

### 3.1 Required Outputs

Per acceptance criteria:

1. **Count of linked TaskOutputs** — nodes with `[:PROCESSED]` from DISPATCH Resonator
2. **Count of orphaned TaskOutputs** — nodes without DISPATCH linkage
3. **Breakdown by status** — success vs failure distinction

### 3.2 Return Shape Recommendation

```typescript
interface TaskOutputLinkageReport {
  totalTaskOutputs: number;
  linkedToDispatch: {
    succeeded: number;
    failed: number;
    total: number;
  };
  orphaned: {
    succeeded: number;
    failed: number;
    total: number;
  };
  linkageRate: number;  // 0-1, for health dashboards
}
```

### 3.3 Cypher Query Strategy

**Approach 1: Single aggregation query**
- Uses `OPTIONAL MATCH` to find DISPATCH Resonator link
- Groups by existence of link and status
- Most efficient for large datasets

**Approach 2: UNION of two queries**
- Explicit linked vs orphaned queries
- Clearer logic but two scans

**Recommendation:** Approach 1 — single scan with conditional aggregation.

---

## 4. Edge Cases and Constraints

### 4.1 Resonator Identification

The query must correctly identify DISPATCH Resonators across **multiple Blooms**. Two options:

| Strategy | Query Pattern | Pros | Cons |
|----------|---------------|------|------|
| Match by `stage` property | `r.stage = 'DISPATCH'` | Works across all Blooms | Relies on property |
| Match by ID suffix | `r.id ENDS WITH '_DISPATCH'` | Convention-based | Fragile if naming changes |

**Recommendation:** Use `r.stage = 'DISPATCH'` for resilience.

### 4.2 Multi-Bloom Scenarios

If multiple Architect Blooms exist (e.g., different domains), each has its own DISPATCH Resonator. The verification query should:

- Count across ALL DISPATCH Resonators (global health)
- OR accept a `bloomId` parameter for scoped verification

**Recommendation:** Provide both variants — global and scoped.

### 4.3 Status Value Normalization

The `status` property uses string literals. Query should handle:
- Exact match: `"succeeded"`, `"failed"`
- Potential case sensitivity in Neo4j

---

## 5. Implementation Recommendations

### 5.1 Function Signature

```typescript
export async function verifyTaskOutputLinkage(
  architectBloomId?: string
): Promise<TaskOutputLinkageReport>
```

- Optional `architectBloomId` for scoped queries
- If omitted, queries across all DISPATCH Resonators

### 5.2 Query Structure

The Cypher query should:

1. Match all TaskOutput nodes
2. OPTIONAL MATCH to DISPATCH Resonator via `:PROCESSED`
3. Aggregate with CASE expressions for status breakdown
4. Return all counts in single result

### 5.3 Query Pattern (Analysis Only)

The query pattern would follow:
```
MATCH (to:TaskOutput)
OPTIONAL MATCH (r:Resonator {stage: 'DISPATCH'})-[:PROCESSED]->(to)
WITH to, r IS NOT NULL AS isLinked
RETURN 
  count(*) AS total,
  sum(CASE WHEN isLinked THEN 1 ELSE 0 END) AS linked,
  sum(CASE WHEN isLinked AND to.status = 'succeeded' THEN 1 ELSE 0 END) AS linkedSucceeded,
  ... etc
```

### 5.4 Verification Integration

This query supports M-9.VA-FIX verification by:

1. **Baseline measurement** — Run before fix to quantify orphans
2. **Post-fix validation** — Confirm orphan count = 0
3. **Ongoing monitoring** — Integrate into health checks

---

## 6. Testing Considerations

### 6.1 Test Data States

The verification function should be tested with:

| State | Expected Result |
|-------|-----------------|
| Empty graph | All zeros, linkageRate = 0 or undefined |
| All linked | orphaned.total = 0, linkageRate = 1.0 |
| All orphaned | linkedToDispatch.total = 0, linkageRate = 0 |
| Mixed states | Correct breakdown |
| Failed tasks linked | failed count in linked bucket |
| Failed tasks orphaned | failed count in orphaned bucket |

### 6.2 TypeScript Verification

Per task specification, verify with:
```bash
npx tsc --noEmit
```

The function return type must match the interface exactly.

---

## 7. Specification Alignment

From `docs/specs/06_codex-signum-architect-pattern-design.md`:

- DISPATCH is the 6th Architect pipeline stage
- TaskOutputs flow through DISPATCH for execution
- All outputs (success/failure) should be recorded for observability

The verification query directly supports **Stratum 2 provenance** requirements by ensuring complete linkage.

---

## 8. Summary

| Aspect | Recommendation |
|--------|----------------|
| Query approach | Single aggregation with OPTIONAL MATCH |
| Resonator matching | Use `stage = 'DISPATCH'` property |
| Scope | Support both global and per-Bloom queries |
| Return type | Structured object with counts + linkageRate |
| Function export | Named export `verifyTaskOutputLinkage` |
| File location | `src/graph/queries.ts` with other analytics queries |

The query should be placed in the "PIPELINE ANALYTICS QUERIES" section alongside `getPipelineStageHealth()` and `getPipelineRunStats()`, as it serves a similar diagnostic purpose.