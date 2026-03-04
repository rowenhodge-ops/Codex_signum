# Add quality score distribution query to graph queries

> Task ID: t1
> Model: claude-opus-4-5:extended:32k
> Duration: 48172ms
> Output chars: 6122
> Timestamp: 2026-03-04T09:28:50.544Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] Task t1 references "docs/specs/06_codex-signum-architect-pattern-design.md" but this file was not in its context

---

# Analysis: Quality Score Distribution Query for M-9.VA-FIX Verification

## Executive Summary

This analysis examines the requirements for implementing a `getQualityScoreDistribution` function in `src/graph/queries.ts` to verify that genuine variance exists in quality scores post-M-9.VA-FIX. The implementation is straightforward given the existing patterns in the codebase.

---

## 1. Data Model Analysis

### TaskOutput Node Structure
From the `TaskOutputProps` interface (lines 115-127):

| Property | Type | Relevance |
|----------|------|-----------|
| `taskType` | `string` ("generative" \| "mechanical" \| "analytical") | **Primary grouping key** |
| `qualityScore` | `number \| undefined` | **Target metric** - optional field |
| `status` | `"succeeded" \| "failed"` | Potential filter dimension |
| `runId` | `string` | Links to PipelineRun for provenance |

### Key Observation
The `qualityScore` field is optional (`qualityScore?: number`), meaning the query must handle `NULL` values gracefully.

---

## 2. Cypher Query Design

### Required Aggregation Functions
Neo4j provides all necessary statistical functions:

| Statistic | Cypher Function | Notes |
|-----------|-----------------|-------|
| Mean | `avg()` | Works on numeric properties directly |
| Std Dev | `stDevP()` | Population std dev; use `stDev()` for sample |
| Min | `min()` | Native aggregation |
| Max | `max()` | Native aggregation |
| Count | `count()` | Counts non-null values when applied to property |

### Recommended Query Structure
```cypher
MATCH (to:TaskOutput)
WHERE to.qualityScore IS NOT NULL
RETURN to.taskType AS taskType,
       count(to) AS count,
       avg(to.qualityScore) AS mean,
       stDevP(to.qualityScore) AS stddev,
       min(to.qualityScore) AS min,
       max(to.qualityScore) AS max
ORDER BY taskType
```

### Design Rationale

1. **NULL Filtering**: `WHERE to.qualityScore IS NOT NULL` ensures only scored outputs are included
2. **Grouping**: Implicit grouping by `to.taskType` via aggregation
3. **Population vs Sample StdDev**: `stDevP()` recommended since we're analyzing all available data, not a sample

---

## 3. Interface Design

### Proposed Return Type
```typescript
export interface QualityScoreDistribution {
  taskType: string;
  count: number;
  mean: number;
  stddev: number;
  min: number;
  max: number;
}
```

### Alignment with Existing Patterns

The implementation should follow established patterns in the file:

| Pattern | Example Reference | Application |
|---------|-------------------|-------------|
| Async function with `runQuery` | `getArmStatsForCluster` (line ~380) | Use READ access mode |
| Record mapping | `getPipelineStageHealth` (line ~752) | Map records to typed objects |
| Number coercion | Throughout file | Use `Number()` for Neo4j integers |

---

## 4. Edge Cases and Robustness

### Identified Edge Cases

| Scenario | Impact | Mitigation |
|----------|--------|------------|
| No TaskOutputs with scores | Empty array returned | Document behavior; caller handles |
| Single observation per taskType | `stddev = 0` | Valid result; indicates no variance |
| Neo4j integer overflow | Unlikely for counts | `Number()` conversion handles |
| `NaN` from aggregation | If count=0 in a group | `WHERE` clause prevents this |

### Recommendation for M-9.VA-FIX Verification
To detect "genuine variance", the calling code should check:
- `stddev > 0` for each task type (variance exists)
- `count >= 2` for meaningful statistical analysis
- Distribution of `mean` values across task types

---

## 5. Integration Points

### File Location
`src/graph/queries.ts` - consistent with existing query organization

### Export Requirements
The function must be exported for external consumption:
```typescript
export async function getQualityScoreDistribution(): Promise<QualityScoreDistribution[]>
```

### Related Existing Queries

| Query | Relationship |
|-------|--------------|
| `getTaskOutputsForRun` | Returns raw TaskOutputs; this aggregates |
| `getArmStatsForCluster` | Similar aggregation pattern for Decisions |
| `getPipelineRunStats` | Aggregate pipeline stats; complementary |

---

## 6. Verification Strategy

### TypeScript Compilation
Per acceptance criteria: `npx tsc --noEmit`

Checklist:
- [ ] Interface exported
- [ ] Function exported  
- [ ] All types properly annotated
- [ ] Async/Promise types correct

### Functional Verification (Future)
Once implemented, verify against real data:
1. Query should return at least one row per distinct `taskType`
2. `stddev > 0` indicates variance fix is working
3. Cross-reference with known M-9.VA-FIX test runs

---

## 7. Recommendations

### Primary Recommendation
Implement the query as specified with the following structure:
1. Define `QualityScoreDistribution` interface in the TYPES section (~line 50)
2. Implement `getQualityScoreDistribution` in a new section: `// ============ ANALYTICS QUERIES ============`
3. Place after existing analytics queries (after `getPipelineRunStats`, ~line 790)

### Optional Enhancements (Future Consideration)
| Enhancement | Rationale | Priority |
|-------------|-----------|----------|
| Time-range filter | Trend analysis over time | Low |
| Include status dimension | Compare succeeded vs failed | Low |
| Add median/percentiles | More robust statistics | Medium |
| Overall totals row | Single-glance health check | Medium |

### Implementation Complexity
**Low** - This is a straightforward aggregation query following established patterns. Estimated implementation: 20-30 lines of code.

---

## 8. Specification Alignment

Per `docs/specs/06_codex-signum-architect-pattern-design.md`:
- This query supports the DISPATCH stage verification
- Enables Thompson sampling calibration validation
- Provides observability into routing quality

---

## Conclusion

The `getQualityScoreDistribution` function is well-scoped and implementable using existing patterns. The primary value is enabling M-9.VA-FIX verification by demonstrating non-zero variance in quality scores across task types. Implementation should be straightforward with no blocking dependencies.