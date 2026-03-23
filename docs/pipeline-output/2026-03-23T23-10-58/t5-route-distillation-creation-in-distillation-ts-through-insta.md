# Route :Distillation creation in distillation.ts through instantiateMorpheme

> Task ID: t5
> Model: claude-opus-4-5:extended:8k
> Duration: 80525ms
> Output chars: 15601
> Timestamp: 2026-03-23T23:40:33.603Z

---

# Analysis: Routing :Distillation Creation Through instantiateMorpheme

## 1. Current State Assessment

### 1.1 CREATE Statement Inventory

A thorough review of `src/graph/queries/distillation.ts` reveals **two** functions containing raw node creation:

| Function | Statement | Target Label | Context |
|----------|-----------|--------------|---------|
| `createDistillation` | `CREATE (di:Distillation {...})` | `:Distillation` | Inside `writeTransaction`, followed by loop for `DISTILLED_FROM` relationships |
| `createStructuredDistillation` | `CREATE (di:Distillation {...})` | `:Distillation` | Inside `writeTransaction`, followed by batched `DISTILLED_FROM` relationships via `UNWIND` |

All other functions are non-creative:

| Function | Operation Type | Modification Needed |
|----------|---------------|---------------------|
| `getActiveDistillationIds` | READ | No |
| `getDistillationsForBloom` | READ | No |
| `supersededDistillation` | UPDATE (`SET supersededAt`) | No |

**Finding:** Unlike the prior three tasks (Observation, Decision, TaskOutput), this file has **two** creation functions with **different property schemas**. Both require migration, representing the most complex surface area in the R-62 pipeline.

### 1.2 Current Creation Pattern Analysis

#### Function 1: `createDistillation`

```cypher
CREATE (di:Distillation {
  id: $id,
  pattern: $pattern,
  confidence: $confidence,
  observationCount: toInteger($observationCount),
  insight: $insight,
  createdAt: datetime()
})
```

Followed by a **loop-based** relationship creation:
```typescript
for (const obsId of props.sourceObservationIds) {
  await tx.run(
    `MATCH (di:Distillation { id: $distId }), (o:Observation { id: $obsId })
     MERGE (di)-[:DISTILLED_FROM]->(o)`,
    { distId: props.id, obsId }
  );
}
```

**Operations bundled:**
1. Node creation with 6 properties (5 from interface + `createdAt` inline)
2. N sequential `DISTILLED_FROM` relationship creations (one per source observation)

**Performance observation:** The loop-based relationship creation issues N separate Cypher statements. This is less efficient than the batched approach in `createStructuredDistillation`.

#### Function 2: `createStructuredDistillation`

```cypher
CREATE (di:Distillation {
  id: $id, bloomId: $bloomId, confidence: $confidence,
  observationCount: toInteger($observationCount), insight: $insight,
  meanPhiL: $meanPhiL, phiLTrend: $phiLTrend, phiLVariance: $phiLVariance,
  successRate: $successRate, windowStart: datetime($windowStart),
  windowEnd: datetime($windowEnd), preferredModels: $preferredModels,
  avoidModels: $avoidModels, createdAt: datetime()
})
```

Followed by a **batched** relationship creation:
```cypher
MATCH (di:Distillation { id: $distId })
UNWIND $obsIds AS obsId
MATCH (o:Observation { id: obsId })
MERGE (di)-[:DISTILLED_FROM]->(o)
```

**Operations bundled:**
1. Node creation with 14 properties (13 from interface + `createdAt` inline)
2. Batched `DISTILLED_FROM` relationship creation via `UNWIND` (conditional on non-empty array)

**Evidence:** The conditional `if (props.sourceObservationIds.length > 0)` guard prevents unnecessary Cypher execution when no source observations exist. This pattern should be preserved post-migration.

### 1.3 Module-Level Type Comment

The file header contains forward-looking documentation:

```typescript
/**
 * Distillation nodes carry dual labels: :Seed:Distillation
 * INSTANTIATES → def:morpheme:seed
 * Specialisation label :Distillation retained for constraint scoping and query performance.
 * seedType = 'distillation'
 */
```

**Finding:** Like TaskOutput (t4), the existing comment block already describes the target state. The `seedType` value `'distillation'` is explicitly documented.

---

## 2. Property Schema Analysis

### 2.1 Interface Comparison

| Property | `DistillationProps` | `StructuredDistillationProps` | Notes |
|----------|---------------------|-------------------------------|-------|
| `id` | ✅ | ✅ | Common |
| `pattern` | ✅ | ❌ | Only in basic |
| `confidence` | ✅ | ✅ | Common |
| `observationCount` | ✅ | ✅ | Common |
| `sourceObservationIds` | ✅ | ✅ | Common (relationship targets) |
| `insight` | ✅ | ✅ | Common |
| `bloomId` | ❌ | ✅ | Only in structured |
| `meanPhiL` | ❌ | ✅ | Performance profile |
| `phiLTrend` | ❌ | ✅ | Performance profile |
| `phiLVariance` | ❌ | ✅ | Performance profile |
| `successRate` | ❌ | ✅ | Performance profile |
| `windowStart` | ❌ | ✅ | Performance window |
| `windowEnd` | ❌ | ✅ | Performance window |
| `preferredModels` | ❌ | ✅ | Routing hints (JSON) |
| `avoidModels` | ❌ | ✅ | Routing hints (JSON) |
| `createdAt` | (inline) | (inline) | Set via `datetime()` in Cypher |

**Finding:** The two interfaces share 6 properties but diverge significantly. `StructuredDistillationProps` has 9 additional fields for performance profiling and routing hints. Both share the `sourceObservationIds` array for `DISTILLED_FROM` relationships.

### 2.2 Required Seed Properties Mapping

| Required Property | `DistillationProps` Mapping | `StructuredDistillationProps` Mapping |
|-------------------|-----------------------------|---------------------------------------|
| `id` | `id` ✅ | `id` ✅ |
| `name` | ❌ Missing | ❌ Missing |
| `content` | ❌ Missing | ❌ Missing |
| `seedType` | ❌ Missing | ❌ Missing |
| `status` | ❌ Missing | ❌ Missing |

**Finding:** Neither interface provides the four required seed properties beyond `id`. Both require derivation.

### 2.3 Property Derivation Strategy

| Required Property | Derivation for Basic | Derivation for Structured | Rationale |
|-------------------|----------------------|---------------------------|-----------|
| `name` | `distillation-${id}` or `${pattern}` | `distillation-${id}` | `pattern` exists only in basic; structured has no natural name field; ID-based naming provides consistency |
| `content` | JSON stringify of `{pattern, insight, confidence, observationCount}` | JSON stringify of `{insight, confidence, meanPhiL, phiLTrend, successRate}` | Captures semantically meaningful payload; insight is the human-readable summary in both |
| `seedType` | `'distillation'` (literal) | `'distillation'` (literal) | Documented in file header comment |
| `status` | `'active'` (literal) | `'active'` (literal) | Distillations are active upon creation; superseded state tracked via `supersededAt` property |

**Alternative for `name`:** The `insight` property contains a human-readable summary of the distillation. However, insights may be lengthy, making `insight.substring(0, 50)` unwieldy. ID-based naming is cleaner.

### 2.4 Status Field: No Conflict

**Critical finding:** Unlike Decision (t3, `status: 'pending'/'completed'`) and TaskOutput (t4, `status: 'succeeded'/'failed'`), Distillation has **no pre-existing `status` property**. The archival/replacement semantic is tracked separately via `supersededAt` timestamp.

| State | Current Implementation | Post-Migration |
|-------|----------------------|----------------|
| Active distillation | `supersededAt IS NULL` | `status: 'active'` AND `supersededAt IS NULL` |
| Superseded distillation | `supersededAt IS NOT NULL` | `status: 'active'` AND `supersededAt IS NOT NULL` |

**Finding:** The `supersededDistillation` function only sets `supersededAt`; it does not modify any `status` property. This is the cleanest migration of the four node types regarding status semantics. Using `status: 'active'` poses no conflict.

---

## 3. Relationship Architecture

### 3.1 Dual Relationship Requirement

Post-migration, each Distillation node requires **two** relationship categories:

| Relationship | Source | Target | Origin | Cardinality |
|--------------|--------|--------|--------|-------------|
| `CONTAINS` | Grid | Distillation | Instantiation Protocol | 1:1 |
| `DISTILLED_FROM` | Distillation | Observation | Domain logic | 1:N |

**Evidence from t1:** `VALID_CONTAINERS` mapping confirms `grid: ["seed"]` is valid parentage. The protocol creates `(parent)-[:CONTAINS]->(n)`.

**Finding:** `DISTILLED_FROM` relationships must be created **after** `instantiateMorpheme` returns, as they represent domain-specific semantics outside protocol scope.

### 3.2 Grid Parent Determination

Neither creation function currently has any concept of Grid containment. A Grid parent must be established.

**Recommendation:** Use a dedicated `grid:distillations` Grid, following the pattern from t2 (`grid:observations`) and the governance grid (`grid:instantiation-observations`). This provides:
- Clear separation of distillation nodes in the graph hierarchy
- Easy bulk querying via `MATCH (g:Grid {id: 'grid:distillations'})-[:CONTAINS]->(d:Distillation)`
- Consistent with the architectural approach across all four operational node types

**Bootstrap requirement:** Ensure `grid:distillations` exists in bootstrap scripts. Prior tasks (t2, t3, t4) established similar grids.

### 3.3 DISTILLED_FROM Relationship Preservation

Both functions create `DISTILLED_FROM` relationships to source observations. Key differences:

| Aspect | `createDistillation` | `createStructuredDistillation` |
|--------|----------------------|--------------------------------|
| Creation style | Loop-based (N queries) | Batched via UNWIND (1 query) |
| Empty array handling | Implicit (loop doesn't execute) | Explicit guard (`if length > 0`) |
| Pattern | Sequential MERGE | Single UNWIND + MERGE |

**Recommendation:** Post-migration relationship creation should use the batched `UNWIND` approach for both functions for consistency and performance:

```cypher
MATCH (di:Seed:Distillation { id: $distId })
UNWIND $obsIds AS obsId
MATCH (o:Observation { id: obsId })
MERGE (di)-[:DISTILLED_FROM]->(o)
```

The `MATCH` clause should target `:Seed:Distillation` dual labels to ensure the node was properly created through the protocol.

---

## 4. Transaction Semantics

### 4.1 Atomicity Requirements

Both functions currently run entirely within a single `writeTransaction`:

| Function | Operations in Transaction |
|----------|--------------------------|
| `createDistillation` | 1 CREATE + N MERGE (relationships) |
| `createStructuredDistillation` | 1 CREATE + 1 batched UNWIND/MERGE |

**Analysis of `instantiateMorpheme`:** Per t1, the function uses its own internal `writeTransaction`. The post-creation `DISTILLED_FROM` relationships must execute in a **separate subsequent transaction**.

### 4.2 Failure Scenario Analysis

| Scenario | Current Behavior | Post-Migration Behavior | Impact |
|----------|------------------|------------------------|--------|
| Node creation fails | Transaction rollback, no node or relationships | `instantiateMorpheme` throws, no node exists | Equivalent ✅ |
| Relationship creation fails | Transaction rollback, no node or relationships | Node exists (committed), relationships missing | **Semantic inconsistency** ⚠️ |
| Partial relationship failure | All-or-nothing within transaction | All-or-nothing for relationship batch | Equivalent (if batched) |

**Risk Assessment:** The post-migration architecture introduces a **gap** between node creation (transaction 1) and relationship creation (transaction 2). If transaction 2 fails:
- A `:Seed:Distillation` node exists with Grid `CONTAINS` relationship
- No `DISTILLED_FROM` relationships exist
- The distillation lacks semantic integrity (it claims to distill observations but doesn't link to them)

### 4.3 Mitigation Strategies

| Strategy | Approach | Trade-offs |
|----------|----------|------------|
| **A. Idempotent retry** | Wrap relationship creation in try/catch; on failure, delete the orphaned node and rethrow | Adds complexity; requires DELETE permission |
| **B. Accept eventual consistency** | Document that `DISTILLED_FROM` creation may fail separately; add background repair job | Simpler code; requires downstream tolerance |
| **C. Validate before creation** | Pre-validate all source observation IDs exist before calling `instantiateMorpheme` | Prevents one failure mode; doesn't prevent Neo4j connection failures |
| **D. Compensating transaction** | On relationship failure, delete the created node | Similar to A; more explicit |

**Recommendation:** Strategy A (idempotent retry with cleanup) combined with C (pre-validation). The implementation should:
1. Validate `sourceObservationIds` all exist before calling `instantiateMorpheme`
2. If `instantiateMorpheme` succeeds but relationship creation fails, delete the orphaned node
3. Rethrow the original error to signal failure to callers

This matches the effective atomicity of the current implementation.

---

## 5. Comparative Analysis with Prior Tasks

| Aspect | Observation (t2) | Decision (t3) | TaskOutput (t4) | Distillation (t5) |
|--------|------------------|---------------|-----------------|-------------------|
| Creation functions | 1 | 1 | 1 | **2** |
| Property interfaces | 1 | 1 | 1 | **2** |
| Domain relationships | 1 (`OBSERVED_IN`) | 3 (conditional) | 1 (`PRODUCED`) | **1 (N:M)** |
| Counter update | Yes (`observationCount`) | No | No | No |
| Status conflict | No | Yes | Yes | **No** |
| Natural `name` field | No (derive from `metric`) | No (synthetic) | Yes (`title`) | **No** (derive from `id`) |

**Finding:** Distillation is the most complex migration due to:
1. Two separate creation functions with different schemas
2. N:M relationship creation (multiple `DISTILLED_FROM` edges per distillation)
3. Performance divergence between loop-based and batched relationship creation

---

## 6. Implementation Recommendations

### 6.1 Shared Helper Function

Given the two creation paths share significant logic, extract a helper:

```typescript
async function createDistillationCore(
  seedProps: SeedProperties,
  additionalProps: Record<string, unknown>,
  sourceObservationIds: string[]
): Promise<string>
```

This helper would:
1. Call `instantiateMorpheme('seed', seedProps, 'grid:distillations', undefined, { subType: 'Distillation' })`
2. Create `DISTILLED_FROM` relationships via batched `UNWIND`
3. Return the created node ID

### 6.2 Function Refactoring

| Original Function | Post-Migration Approach |
|-------------------|------------------------|
| `createDistillation` | Build seed props from `DistillationProps`; call helper |
| `createStructuredDistillation` | Build seed props from `StructuredDistillationProps`; call helper with extended props |

### 6.3 Label Verification in Downstream Queries

Post-migration, queries should explicitly match dual labels where performance benefits:

```cypher
-- Current
MATCH (di:Distillation { id: $id })

-- Post-migration (for constraint enforcement)
MATCH (di:Seed:Distillation { id: $id })
```

However, single-label matching `:Distillation` remains valid and may be preferable for query simplicity in read-only operations.

---

## 7. Summary of Findings

| Finding | Severity | Action Required |
|---------|----------|-----------------|
| Two creation functions require migration | High | Both `createDistillation` and `createStructuredDistillation` must be refactored |
| Different property schemas | Medium | Property derivation logic must handle both interfaces |
| No status conflict | Low | Clean migration using `status: 'active'` |
| N:M relationship creation | Medium | Standardize on batched `UNWIND` approach |
| Transaction boundary introduces gap | Medium | Implement compensating cleanup on relationship failure |
| Grid parent required | Medium | Use `grid:distillations`; ensure bootstrap creates it |
| Loop-based relationships in basic function | Low | Opportunity to improve to batched approach |