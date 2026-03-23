# Route :Observation creation in observation.ts through instantiateMorpheme

> Task ID: t2
> Model: claude-opus-4-5:extended:8k
> Duration: 88081ms
> Output chars: 11436
> Timestamp: 2026-03-23T23:35:26.107Z

> **⚠️ Hallucination flags (6):**
> - [content/warning] Task t2 references "observation.ts" but this file was not in its context
> - [content/warning] Task t2 references "../client.js" but this file was not in its context
> - [content/warning] Task t2 references "graph-operations.ts" but this file was not in its context
> - [content/warning] Task t2 references "./queries/observation.js" but this file was not in its context
> - [content/warning] Task t2 references "client.js" but this file was not in its context
> - [content/warning] Task t2 references "npx vitest run tests/conformance/write-observation.test.ts" but this file was not in its context

---

# Analysis: Routing :Observation Creation Through instantiateMorpheme

## 1. Current State Assessment

### 1.1 CREATE Statement Inventory

A thorough review of `src/graph/queries/observation.ts` reveals a single function with raw node creation:

| Function | Line | Statement Type | Target Label |
|----------|------|----------------|--------------|
| `recordObservation` | ~35 | `CREATE (o:Observation {...})` | `:Observation` |

All other functions perform READ operations (`getObservationsForBloom`, `countObservationsForBloom`, `getCompactableObservations`, `getObservationsForDistillation`), DELETE operations (`deleteObservations`), or UPDATE operations (`updateObservationConditioned`).

**Finding:** Only `recordObservation` requires modification to route through `instantiateMorpheme`.

### 1.2 Current Creation Pattern Analysis

The existing `recordObservation` function performs three operations in a single transaction:

```cypher
CREATE (o:Observation {
  id: $id,
  metric: $metric,
  value: $value,
  unit: $unit,
  context: $context,
  timestamp: datetime(),
  retained: true
})
WITH o
MATCH (b:Bloom { id: $sourceBloomId })
MERGE (o)-[:OBSERVED_IN]->(b)
SET b.observationCount = coalesce(b.observationCount, 0) + 1
```

**Operations bundled:**
1. Node creation with properties
2. Domain relationship creation (`OBSERVED_IN` to Bloom)
3. Counter increment on Bloom

**Evidence:** The `WITH o` clause chains these operations atomically. This atomicity must be preserved post-refactor.

---

## 2. Property Schema Analysis

### 2.1 Current vs Required Properties

| Current `ObservationProps` | Required by `instantiateMorpheme('seed')` | Status |
|----------------------------|-------------------------------------------|--------|
| `id: string` | `id` | ✅ Present |
| `metric: string` | — | Extra (observation-specific) |
| `value: number` | — | Extra (observation-specific) |
| `unit?: string` | — | Extra (observation-specific) |
| `context?: string` | — | Extra (observation-specific) |
| `sourceBloomId: string` | — | Relationship target, not node property |
| — | `name` | ❌ Missing |
| — | `content` | ❌ Missing |
| — | `seedType` | ❌ Missing |
| — | `status` | ❌ Missing |

**Finding:** Four required seed properties are absent from `ObservationProps`. Additionally, the current implementation sets `timestamp` and `retained` inline in Cypher rather than in the interface.

### 2.2 Property Derivation Strategy

Based on semantic analysis of observation data:

| Required Property | Derivation | Rationale |
|-------------------|------------|-----------|
| `name` | `${metric}` or `observation-${id}` | Metric serves as human-readable identifier |
| `content` | JSON stringify of `{metric, value, unit, context}` | Captures the observation payload for content-based operations |
| `seedType` | `'observation'` (literal) | Matches enum value in cs-v5.0 specification |
| `status` | `'active'` (literal) | Observations are active upon creation |

**Evidence from t1:** The prior task confirms required properties check: `["id", "name", "content", "seedType", "status"]` and content non-empty check exists.

### 2.3 Properties Passthrough

Additional observation-specific properties must pass through to the created node:

- `metric`, `value`, `unit`, `context` — domain data
- `timestamp` — currently `datetime()` in Cypher
- `retained` — currently hardcoded `true`

**Recommendation:** These should be included in the properties object passed to `instantiateMorpheme`. The protocol should preserve arbitrary additional properties on the node.

---

## 3. Relationship Architecture

### 3.1 Dual Relationship Requirement

Post-migration, each Observation node requires **two** relationships:

| Relationship | Source | Target | Origin |
|--------------|--------|--------|--------|
| `CONTAINS` | Grid | Observation | Instantiation Protocol |
| `OBSERVED_IN` | Observation | Bloom | Domain logic |

**Evidence from t1:** `VALID_CONTAINERS` mapping confirms `grid: ["seed"]` is valid parentage. The protocol creates `(parent)-[:CONTAINS]->(n)`.

**Finding:** `OBSERVED_IN` relationship creation must occur after `instantiateMorpheme` returns, as it's domain-specific and outside protocol scope.

### 3.2 Grid Parent Determination

The current `recordObservation` has no concept of Grid containment. A Grid parent must be established.

**Options:**

| Option | Grid ID | Pros | Cons |
|--------|---------|------|------|
| Dedicated observation grid | `grid:observations` | Clear separation, easy querying | Requires grid pre-existence |
| Bloom's containing grid | Query from Bloom | Natural hierarchy | Extra query, bloom may have no grid |
| Parameter from caller | `gridId` param | Maximum flexibility | Breaking change to signature |

**Recommendation:** Use a dedicated `grid:observations` Grid. This mirrors the pattern from t1 where `grid:instantiation-observations` is used for governance observations. Ensure this Grid exists in bootstrap.

### 3.3 Bloom Counter Update

The current code performs:
```cypher
SET b.observationCount = coalesce(b.observationCount, 0) + 1
```

**Finding:** This counter increment must be preserved. It should execute in the same transaction context following the `instantiateMorpheme` call and `OBSERVED_IN` creation.

---

## 4. Transaction Semantics

### 4.1 Atomicity Requirement

The three original operations (create, relate, count) must remain atomic. If `instantiateMorpheme` fails, no `OBSERVED_IN` should exist. If `OBSERVED_IN` fails, the observation state is inconsistent.

**Analysis of `instantiateMorpheme` signature:**
```typescript
instantiateMorpheme(morphemeType, properties, parentId, highlander?, options?)
```

**Finding:** The function uses `writeTransaction` internally. The `OBSERVED_IN` relationship and counter update must be performed in a **separate subsequent transaction** after `instantiateMorpheme` completes.

**Risk Assessment:**

| Scenario | Current Behavior | Post-Migration Behavior | Impact |
|----------|------------------|-------------------------|--------|
| OBSERVED_IN creation fails | Full rollback | Orphan :Seed:Observation in Grid | ⚠️ Data inconsistency |
| Bloom not found | No observation created | Observation created, no link | ⚠️ Semantic change |

**Mitigation:** Wrap the post-instantiation relationship creation in a separate `writeTransaction`. Accept that full atomicity across both operations requires either:
1. Accepting two-phase commit risk (acceptable for observations)
2. Adding transaction injection to `instantiateMorpheme` (scope creep)

### 4.2 Recommended Transaction Flow

```
Phase 1: instantiateMorpheme('seed', props, 'grid:observations', undefined, { subType: 'Observation' })
  → Creates :Seed:Observation node
  → Creates Grid -[:CONTAINS]-> Observation
  → Creates Observation -[:INSTANTIATES]-> def:morpheme:seed
  → Records instantiation observation

Phase 2: writeTransaction for OBSERVED_IN
  → MATCH observation by returned ID
  → MATCH bloom by sourceBloomId
  → CREATE OBSERVED_IN relationship
  → Increment observationCount
```

---

## 5. Import and Dependency Analysis

### 5.1 Required Imports

The modified `observation.ts` will need:

```typescript
import { instantiateMorpheme } from "../../memory/graph-operations.js";
// or from "../client.js" if re-exported
```

**Verification needed:** Confirm `instantiateMorpheme` is exported from a path that `observation.ts` can import without circular dependency.

### 5.2 Circular Dependency Check

| File | Imports From | Exports To |
|------|--------------|------------|
| `observation.ts` | `../client.js` | (consumers) |
| `graph-operations.ts` | `./queries/observation.js`? | `instantiateMorpheme` |

**Risk:** If `graph-operations.ts` imports from `observation.ts`, adding an import in the reverse direction creates a cycle.

**Evidence needed:** Review `graph-operations.ts` imports. If a cycle would occur, the import should come from a lower-level module or the function should be re-exported through `client.js`.

---

## 6. Read Query Compatibility

### 6.1 Label Matching in Existing Queries

All read queries in `observation.ts` match on `:Observation`:

```cypher
MATCH (o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })
```

**Finding:** A `:Seed:Observation` node will still match `(o:Observation)` patterns. No changes needed to read queries.

**Evidence:** Neo4j label matching is inclusive — a node with labels `[:Seed, :Observation]` matches `(n:Observation)`, `(n:Seed)`, and `(n:Seed:Observation)`.

### 6.2 Delete Query Compatibility

```cypher
MATCH (o:Observation) WHERE o.id IN $ids DETACH DELETE o
```

**Finding:** This will correctly match `:Seed:Observation` nodes. No change needed.

---

## 7. Timestamp Handling

### 7.1 Current Approach

```cypher
timestamp: datetime()
```

The `datetime()` function executes server-side in Neo4j, providing precise transaction timestamp.

### 7.2 Post-Migration Approach

If `instantiateMorpheme` accepts a properties object, timestamp could be:
1. Provided client-side: `timestamp: new Date().toISOString()`
2. Set by `instantiateMorpheme` if not provided

**Recommendation:** Generate timestamp client-side before calling `instantiateMorpheme` to ensure the observation's timestamp reflects call time, not internal protocol execution time. Use ISO string format for Neo4j compatibility.

---

## 8. Summary of Required Changes

### 8.1 Modifications to `recordObservation`

| Aspect | Current | Required |
|--------|---------|----------|
| Node creation | Raw `CREATE (o:Observation)` | `instantiateMorpheme('seed', ..., { subType: 'Observation' })` |
| Labels | `:Observation` only | `:Seed:Observation` |
| Grid relationship | None | `CONTAINS` from Grid |
| Bloom relationship | Same transaction | Separate follow-up transaction |
| Properties | Inline in Cypher | Mapped to seed-compatible object |

### 8.2 No Modifications Needed

- `getObservationsForBloom` — read only
- `countObservationsForBloom` — read only  
- `getCompactableObservations` — read only
- `deleteObservations` — delete, labels match
- `getObservationsForDistillation` — read only
- `updateObservationConditioned` — update, labels match

### 8.3 Interface Considerations

`ObservationProps` interface could remain unchanged for API stability. Internal mapping handles derivation of `name`, `content`, `seedType`, `status`.

---

## 9. Risk Summary

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Two-phase transaction inconsistency | Low | Medium | Accept risk; observations are not critical-path |
| Circular import | Medium | High | Verify import path before implementation |
| Missing Grid at runtime | Medium | High | Ensure `grid:observations` in bootstrap |
| Property mapping errors | Low | Low | Unit test property derivation |
| Breaking signature change | Low | Medium | Keep `ObservationProps` unchanged |

---

## 10. Verification Checklist

Per acceptance criteria:

- [ ] No raw `CREATE (n:Observation)` Cypher remains
- [ ] All creation paths call `instantiateMorpheme('seed', { subType: 'Observation' })`
- [ ] Created nodes carry `:Seed` and `:Observation` labels
- [ ] Grid `CONTAINS` relationship present
- [ ] Properties preserved: `id`, `metric`, `value`, `unit`, `context`, `timestamp`, `retained`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Tests pass: `npx vitest run tests/conformance/write-observation.test.ts`