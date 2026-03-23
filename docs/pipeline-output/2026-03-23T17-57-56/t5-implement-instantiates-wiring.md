# Implement INSTANTIATES wiring

> Task ID: t5
> Model: claude-opus-4-6:adaptive:max
> Duration: 105721ms
> Output chars: 13907
> Timestamp: 2026-03-23T18:03:56.442Z

> **⚠️ Hallucination flags (8):**
> - [content/warning] Task t5 references "bloom.ts" but this file was not in its context
> - [content/warning] Task t5 references "../instantiation.js" but this file was not in its context
> - [content/warning] Task t5 references "grammar-reference.test.ts" but this file was not in its context
> - [content/warning] Task t5 references "instantiation.ts" but this file was not in its context
> - [content/warning] Task t5 references "src/graph/instantiation.ts" but this file was not in its context
> - [content/warning] Task t5 references "tests/graph/grammar-reference.test.ts" but this file was not in its context
> - [content/warning] Task t5 references "docs/specs/instantiation-mutation-resonator-design.md" but this file was not in its context
> - [content/warning] Task t5 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Analysis: INSTANTIATES Wiring Implementation (Cycle 8, t5)

## Executive Summary

The INSTANTIATES relationship is the graph grammar's "instance-of" edge connecting Bloom nodes to their Bloom Definition (Seed) nodes. Analysis of `bloom.ts` reveals that while the *delegation path* to `instantiateMorpheme()` exists, there are five concrete gaps in visibility, verification, and standalone wiring that must be addressed. These gaps compound with the λ₂=0 condition — INSTANTIATES edges that cross component boundaries are structurally invisible to both the topology visualization and the stamp verification system.

---

## 1. Current INSTANTIATES Surface Area

### 1.1 Creation Paths

| Path | Function | Creates INSTANTIATES? | Evidence |
|------|----------|----------------------|----------|
| Primary | `createContainedBloom` → `instantiateMorpheme` | **Presumed yes** (opaque) | Docstring: "Atomic CONTAINS + INSTANTIATES wiring" |
| Legacy | `createBloom` | **No** | Raw MERGE on `:Bloom` node only; no relationship creation |
| Ad-hoc | `connectBlooms` | **Technically possible** | Accepts arbitrary `relType` string, but no grammar enforcement |

**Critical finding**: The only documented INSTANTIATES creation path delegates entirely to `instantiateMorpheme()` from `../instantiation.js`, which is **not provided as context**. The actual Cypher that creates the INSTANTIATES edge is invisible to this analysis.

### 1.2 Verification Paths

| System | Checks INSTANTIATES? | Evidence |
|--------|----------------------|----------|
| `verifyStamp` | **No** | Only queries `OPTIONAL MATCH (parent)-[:CONTAINS]->(b)` |
| `getBloomAdjacency` | **No** | Generic `MATCH (a:Bloom)-[r]->(b:Bloom)` — misses edges to `:Seed` nodes |
| `getBloomsWithHealth` | **No** | Degree counts include all edges, but INSTANTIATES is not distinguished |
| `getBloomDegree` | **Partially** | Counts all relationships `(b)-[r]-()` — includes INSTANTIATES in aggregate but doesn't isolate it |

### 1.3 Consumption Paths (from t4 analysis)

The structural survey's Section 4 consumes INSTANTIATES edges via three UNION clauses matching `(instance)-[:INSTANTIATES]->(def:Seed)`. This is the **only** confirmed consumer of INSTANTIATES edges, and t4 identified that it lacks definition-level status filtering.

---

## 2. Identified Gaps

### Gap 1: No Standalone INSTANTIATES Wiring Function

**Evidence**: `createContainedBloom` always bundles INSTANTIATES with CONTAINS via `instantiateMorpheme()`. There is no function to:
- Wire INSTANTIATES to an **already-existing** Bloom node
- Re-wire INSTANTIATES when a definition is superseded
- Wire INSTANTIATES without a parent CONTAINS relationship

**Impact**: Bloom nodes created via the legacy `createBloom` path (which still exists and is not deprecated) will never have INSTANTIATES edges. Any node created outside the `createContainedBloom` entry point is structurally orphaned from its definition.

**Recommendation**: Expose a dedicated `wireInstantiates(instanceId: string, definitionId: string): Promise<Result>` function that:
1. Validates the target is a `:Seed` with appropriate `seedType`
2. Uses MERGE semantics for idempotency
3. Records the wiring in the Instantiation Resonator's Grid
4. Can be called independently of bloom creation

### Gap 2: `createContainedBloom` Has No Definition ID Parameter

**Evidence**: The function signature:
```typescript
createContainedBloom(props: BloomProps, parentId: string, relationship, highlander)
```

There is no `definitionId` parameter. The `instantiateMorpheme` call receives `"bloom"` as the morpheme type, suggesting it resolves the definition internally. This creates two problems:

1. **Opacity**: Callers cannot specify *which* Bloom Definition the new bloom instantiates
2. **Ambiguity**: If multiple Bloom Definitions exist (e.g., the new Assayer Bloom Definition from t1 alongside existing definitions), the resolution logic in `instantiateMorpheme` is a black box

**Recommendation**: Either:
- Add an optional `definitionId` parameter to `createContainedBloom`, or
- Document the resolution strategy that `instantiateMorpheme` uses (e.g., "most recently created active definition of matching type")

### Gap 3: `verifyStamp` Ignores INSTANTIATES

**Evidence**: The `StampVerification` interface and its implementation query only for `:CONTAINS` edges:

```typescript
OPTIONAL MATCH (parent)-[:CONTAINS]->(b)
```

The returned `StampVerification` object has no field for the INSTANTIATES relationship. A bloom can pass verification with zero INSTANTIATES edges.

**Impact**: Post-creation verification (which the docstring explicitly recommends: "Call this AFTER updateBloomStatus() to confirm persistence") provides no assurance that the definitional link is intact. Silent INSTANTIATES edge loss would be undetectable.

**Recommendation**: Extend `StampVerification` to include:

| New Field | Type | Purpose |
|-----------|------|---------|
| `instantiatesDefId` | `string \| null` | ID of the linked definition |
| `instantiatesDefType` | `string \| null` | `seedType` of the definition |
| `instantiatesEdgeExists` | `boolean` | Whether the INSTANTIATES edge is present |

Add a corresponding `OPTIONAL MATCH (b)-[:INSTANTIATES]->(def:Seed)` clause to the verification query.

### Gap 4: INSTANTIATES Invisible in Topology Visualization

**Evidence**: The topology-facing queries return only Bloom-to-Bloom relationships:

```typescript
// getBloomAdjacency
MATCH (a:Bloom)-[r]->(b:Bloom)
```

INSTANTIATES edges target `:Seed` nodes, not `:Bloom` nodes. They are excluded from:
- The adjacency list used for ψH computations
- The health/degree queries
- Any topology visualization built on these queries

**Impact**: The acceptance criterion "Wiring appears in topology visualization" **cannot be satisfied** with the current query structure. INSTANTIATES edges are invisible to the topology layer.

**Recommendation**: Either:
1. Add a dedicated `getInstantiatesEdges()` query that returns `Array<{instanceId, defId, defType, defStatus}>`, or
2. Extend `getBloomAdjacency()` to include a second result set for cross-type edges (Bloom→Seed)

Option 1 is preferable — it keeps the adjacency list homogeneous (Bloom→Bloom) while making INSTANTIATES edges available to the visualization through a separate channel.

### Gap 5: `LineType` Constraint Visibility

**Evidence**: `LineType` is imported from `../instantiation.js`:
```typescript
import type { LineType, HighlanderOptions } from "../instantiation.js";
```

In `createContainedBloom`, the non-CONTAINS relationship is cast:
```typescript
const lineResult = await createLine(parentId, props.id, relationship as LineType);
```

The `as LineType` cast suggests `relationship` might not naturally satisfy the `LineType` constraint. We cannot confirm whether `INSTANTIATES` is a valid `LineType` value without seeing the type definition.

**Impact**: If `INSTANTIATES` is not in the `LineType` union, any attempt to create it via `createLine` would either fail at runtime or require a type override.

**Recommendation**: Verify that `LineType` includes `'INSTANTIATES'`. If not, extend it. The grammar reference test (`grammar-reference.test.ts`) should validate this.

---

## 3. Interaction with Pre-Survey Metrics

### λ₂ = 0 (Disconnected Components)

INSTANTIATES edges connect `:Bloom` nodes to `:Seed` nodes. These are **cross-label** edges. Their impact on λ₂ depends on whether the Laplacian computation includes Seed nodes in its node set:

| Scenario | λ₂ Impact | Notes |
|----------|-----------|-------|
| Laplacian is Bloom-only | None | INSTANTIATES edges are excluded from the computation |
| Laplacian includes Seeds | Potential bridge | If definitions span components, INSTANTIATES could connect them |

From t3's analysis, `computeGlobalLambda2` operates on `(edges, nodeIds)` — the input determines scope. If the structural review only feeds Bloom-to-Bloom edges (as `getBloomAdjacency` suggests), INSTANTIATES wiring alone will **not** repair λ₂. The `FLOWS_TO` edge from t2 is the primary connectivity fix.

However, INSTANTIATES edges contribute to **ψH** (hierarchical coherence) even if they don't affect λ₂ directly. The current ψH=0.6 may improve with proper INSTANTIATES wiring establishing clear type hierarchies.

### Relationship to t1 and t2

The dependency chain for complete Assayer Bloom Definition integration:

```
t1: create_bloom (Assayer Bloom Definition as Seed node)
         │
         ├──► t2: FLOWS_TO from architect_GATE (process flow, fixes λ₂)
         │
         └──► t5: INSTANTIATES from new Bloom instances (type hierarchy, fixes ψH)
                   │
                   └── Requires: target definition exists (t1)
                       Requires: instance Bloom nodes exist (t1 or pre-existing)
```

**t5 cannot be verified until t1 completes** — the INSTANTIATES target (Assayer Bloom Definition) must exist in the graph.

---

## 4. Grammar Conformance

The verification test (`grammar-reference.test.ts`) implies a formal graph grammar. Based on code evidence, the grammar rules for INSTANTIATES should include:

| Rule | Constraint | Evidence |
|------|-----------|----------|
| G-INST-1 | Source must be `:Bloom` | Structural survey matches `(instance)-[:INSTANTIATES]->(def:Seed)` |
| G-INST-2 | Target must be `:Seed` with valid `seedType` | Survey filters `def.seedType IN ['transformation-definition', 'bloom-definition']` |
| G-INST-3 | Cardinality: each Bloom INSTANTIATES exactly one definition | Implied by `instantiateMorpheme` creating a single edge |
| G-INST-4 | INSTANTIATES is immutable after creation | Docstring: "Relationship preservation (INSTANTIATES maintained)" |
| G-INST-5 | Target definition must have active status | From t4's analysis: no status filter currently enforced |

**G-INST-3 and G-INST-4 are unverified** — `verifyStamp` doesn't check them, and there's no uniqueness constraint visible in the Cypher.

**Recommendation**: The grammar reference test should validate:
1. INSTANTIATES edge exists after `createContainedBloom`
2. INSTANTIATES edge survives `updateBloomStatus` (preservation)
3. At most one INSTANTIATES edge per Bloom node (cardinality)
4. Source label is Bloom, target label is Seed (type constraint)
5. Target has valid `seedType` (semantic constraint)

---

## 5. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| `instantiateMorpheme` silently fails to create INSTANTIATES edge | **High** | Medium | Add INSTANTIATES check to `verifyStamp` |
| Legacy `createBloom` path produces definition-orphaned nodes | **High** | High | Deprecate `createBloom` or add post-creation INSTANTIATES wiring |
| Topology visualization never shows INSTANTIATES | **Medium** | High | Add dedicated cross-type edge query |
| Grammar reference test passes vacuously (no INSTANTIATES assertions) | **Medium** | Medium | Review test before relying on verification |
| `LineType` doesn't include INSTANTIATES | **Medium** | Low | Check `instantiation.ts` type definition |
| Multiple INSTANTIATES edges per Bloom (no uniqueness constraint) | **Low** | Low | Add MERGE semantics or uniqueness check |

---

## 6. Recommendations

### Immediate (Required for t5 Acceptance)

1. **Obtain `src/graph/instantiation.ts`** — The INSTANTIATES creation logic is entirely in this file. Without it, we cannot verify the edge is actually created, confirm its Cypher pattern, or validate `LineType` includes INSTANTIATES.

2. **Obtain `tests/graph/grammar-reference.test.ts`** — The verification target. Need to confirm it includes INSTANTIATES assertions rather than passing vacuously.

3. **Obtain `docs/specs/instantiation-mutation-resonator-design.md`** — The specification reference cited in the task. Required to validate our inferred grammar rules against the design intent.

### Implementation (After Context Obtained)

4. **Add `getInstantiatesEdges()` query** to `bloom.ts` — Returns INSTANTIATES edges for topology visualization. This directly satisfies the acceptance criterion "Wiring appears in topology visualization."

5. **Extend `verifyStamp` with INSTANTIATES verification** — Add an OPTIONAL MATCH for the definitional link and surface it in `StampVerification`.

6. **Add or expose `wireInstantiates()` for standalone use** — Decouples INSTANTIATES wiring from bloom creation, enabling post-hoc repair of definition-orphaned nodes.

### Structural (Cross-Task)

7. **Deprecate bare `createBloom`** — Or require callers to follow it with explicit INSTANTIATES wiring. The current dual-path (legacy vs. contained) creates a grammar violation surface.

8. **Coordinate with t4's status filter work** — INSTANTIATES edges to deprecated definitions should be filtered from the structural survey. The wiring implementation and the filter implementation must agree on valid definition statuses.

---

## 7. Conclusion

**Readiness Assessment**: ⚠️ **Partially Blocked**

The analysis identifies clear structural requirements for INSTANTIATES wiring and five concrete gaps in the current `bloom.ts` implementation. However, the core creation logic resides in `instantiation.ts` (not provided), and the grammar rules are specified in a document (not provided). 

**What can proceed now**: Design of the topology query (`getInstantiatesEdges`), `verifyStamp` extension, and grammar test assertions — these are all within `bloom.ts` scope.

**What requires additional context**: Confirmation that `instantiateMorpheme` actually creates the INSTANTIATES edge, `LineType` validation, and specification conformance checking.

**Priority**: Gap 4 (topology visibility) is the most actionable — it directly addresses an acceptance criterion and requires no upstream dependency. Gap 3 (stamp verification) is second — it provides the observability needed to confirm all other INSTANTIATES work is correct.