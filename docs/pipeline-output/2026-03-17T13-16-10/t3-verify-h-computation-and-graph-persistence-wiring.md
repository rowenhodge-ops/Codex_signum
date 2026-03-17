# Verify ΨH computation and graph persistence wiring

> Task ID: t3
> Model: claude-opus-4-6:adaptive:medium
> Duration: 193150ms
> Output chars: 19755
> Timestamp: 2026-03-17T13:26:38.662Z

> **⚠️ Hallucination flags (12):**
> - [content/warning] Task t3 references "psi-h.ts" but this file was not in its context
> - [content/warning] Task t3 references "health.ts" but this file was not in its context
> - [content/warning] Task t3 references "queries/health.ts" but this file was not in its context
> - [content/warning] Task t3 references "./bloom.js" but this file was not in its context
> - [content/warning] Task t3 references "src/graph/queries/bloom.ts" but this file was not in its context
> - [content/warning] Task t3 references "src/patterns/thompson-router/select-model.js" but this file was not in its context
> - [content/warning] Task t3 references "src/patterns/architect/types.js" but this file was not in its context
> - [content/warning] Task t3 references "computation/psi-h.ts" but this file was not in its context
> - [content/warning] Task t3 references "queries/bloom.ts" but this file was not in its context
> - [content/warning] Task t3 references a document ("docs/specs/01_codex-signum-v3_0.md") that was not in its context
> - [content/warning] Task t3 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context
> - [content/warning] Task t3 references a document ("docs/specs/06_codex-signum-architect-pattern-design.md") that was not in its context

---

# ΨH Computation and Graph Persistence Wiring Audit

**Task:** t3 — Verify ΨH computation and graph persistence wiring per M-22.3
**Scope:** `src/computation/psi-h.ts`, `src/graph/queries/health.ts`, `scripts/bootstrap-executor.ts`
**Spec Reference:** Engineering Bridge v3.0, Part 2 §ΨH; M-22 Row 3

---

## Executive Summary

The ΨH computation module (`psi-h.ts`) is **well-implemented** with correct two-component composite architecture (λ₂ + friction), Jacobi eigenvalue decomposition, and EWMA temporal tracking. The persistence wiring through `health.ts` is **structurally complete**: composition subgraph extraction, stateful computation, and Neo4j write-back are properly chained via `computeAndPersistPsiH()`. However, the audit identifies **one computational bug** (2-node Fiedler eigenvalue), **one critical wiring gap** (no call site from bootstrap executor or any provided orchestrator), and **several specification conformance concerns** around subgraph edge filtering and edge weight semantics.

| Criterion | Status | Details |
|-----------|--------|---------|
| `computePsiH` correctly imported and invoked | ✅ **PASS** | Imported as `computePsiHWithState` in `health.ts` |
| Composition subgraph nodes identified and aggregated | ✅ **PASS** | `getCompositionSubgraph` extracts children + inter-edges |
| Graph persistence via `queries/health.ts` confirmed | ✅ **PASS** | `computeAndPersistPsiH` → `updateBloomPsiH` chain |
| ΨH values flow from computation to Neo4j nodes | ⚠️ **PARTIAL** | Write path exists; no confirmed call site in bootstrap flow |
| Two-component composite per R3.1 | ✅ **PASS** | λ₂ + TV_G with correct weights |
| Fiedler eigenvalue correctness | ❌ **BUG** | 2-node special case returns w instead of 2w |
| Bootstrap executor integration | ❌ **FAIL** | Zero ΨH references in bootstrap-executor.ts |

---

## 1. Import and Invocation Chain

### Finding 1.1 — Correct Import Wiring in `health.ts`

**Evidence (health.ts, lines 6–8):**
```typescript
import type { GraphEdge, NodeHealth } from "../../computation/psi-h.js";
import { computePsiHWithState, createDefaultPsiHState } from "../../computation/psi-h.js";
import type { PsiH, PsiHState } from "../../types/state-dimensions.js";
```

All required types and functions are imported:
- `GraphEdge` and `NodeHealth` — input types for subgraph representation
- `computePsiHWithState` — the stateful computation wrapper
- `createDefaultPsiHState` — factory for cold-start state initialization
- `PsiH` and `PsiHState` — output and state types from the shared type system

**Verdict:** ✅ Import wiring is complete and correctly targets the stateful variant (`computePsiHWithState`) rather than the bare `computePsiH`, enabling temporal decomposition per the EWMA specification.

### Finding 1.2 — Internal Invocation Chain Within `psi-h.ts`

The module correctly layers three levels of abstraction:

| Level | Function | Role |
|-------|----------|------|
| Core | `computePsiH(edges, nodeHealths)` | Stateless λ₂ + friction → combined |
| Temporal | `decomposePsiH(state, psiH_instant)` | EWMA trend + friction classification |
| Integrated | `computePsiHWithState(edges, nodeHealths, state)` | Wraps both; returns `{ psiH, decomposition, updatedState }` |

The integrated function is the public API consumed by `health.ts`. The decomposition separates `friction_transient` (|instant − trend|) from `friction_durable` (|trend − baseline|), matching the Engineering Bridge v3.0 specification for temporal ΨH decomposition.

**Verdict:** ✅ Layered correctly.

---

## 2. Composition Subgraph Construction

### Finding 2.1 — Subgraph Extraction Query

**Evidence (`getCompositionSubgraph`, health.ts):**
```cypher
MATCH (parent:Bloom {id: $bloomId})-[:CONTAINS]->(child)
WITH collect(child) AS children, collect(child.id) AS childIds
UNWIND children AS c
OPTIONAL MATCH (c)-[r]-(other)
WHERE other.id IN childIds AND id(c) < id(other)
RETURN c.id AS nodeId, COALESCE(c.phiL, 0.5) AS phiL,
       type(r) AS relType, other.id AS otherId,
       COALESCE(r.weight, 1.0) AS weight
```

**Positive findings:**
- Children are correctly scoped via `[:CONTAINS]` from the parent Bloom
- Node deduplication uses `id(c) < id(other)` to avoid bidirectional edge doubling — standard Neo4j pattern for undirected edge collection
- `OPTIONAL MATCH` ensures isolated children (no inter-edges) still appear as nodes
- ΦL defaults to 0.5 (neutral health) via `COALESCE` for cold-start children
- Edge weight defaults to 1.0 via `COALESCE`

**Post-query processing (health.ts) correctly:**
- Deduplicates nodes via `nodeMap.has(nodeId)` check
- Deduplicates edges via `edgeSet` with `${nodeId}->${otherId}` keys
- Handles null `otherId` from OPTIONAL MATCH (skips edge creation)
- Returns `null` for empty compositions (no children)

**Verdict:** ✅ Subgraph construction is structurally sound.

### Finding 2.2 — ⚠️ Unfiltered Relationship Types in Subgraph

**Issue:** The query `(c)-[r]-(other)` captures **all** relationship types between children, not just structural relationships. This means FLOWS_TO, OBSERVED_IN, INSTANTIATES, or any future relationship type between child nodes would be included in the adjacency matrix used for Fiedler eigenvalue computation.

**Spec reference (t1, R3.1):** ΨH measures "Structural Coherence via graph Laplacian." The inclusion of non-structural edges (e.g., data-flow edges, observation edges) could inflate λ₂ beyond what pure structural connectivity warrants.

**Risk:** Moderate. In practice, most inter-child relationships are likely structural (CONTAINS, DEPENDS_ON), but as the graph grows, non-structural edges between siblings could distort the coherence metric.

**Recommendation:** Add a relationship type filter to the subgraph extraction query:
```cypher
OPTIONAL MATCH (c)-[r:DEPENDS_ON|RELATES_TO|INTERACTS_WITH]-(other)
```
or use a configurable allowlist. The `relType` column is already returned but is not used for filtering in the TypeScript code.

### Finding 2.3 — `relType` Returned but Unused

The query returns `type(r) AS relType` but the TypeScript post-processing code never reads this field. It was presumably included for debugging or future use, but currently the relationship type plays no role in edge weight differentiation or filtering.

---

## 3. ΨH Computation Correctness

### Finding 3.1 — ✅ Two-Component Composite Matches Spec

**Evidence (psi-h.ts, line 99–101):**
```typescript
const combined =
  PSI_H_WEIGHTS.structural * lambda2Normalized +
  PSI_H_WEIGHTS.runtime * (1 - friction);
```

Per the module documentation: `0.4 × normalize(λ₂) + 0.6 × (1 − friction)`. Runtime friction is weighted higher (0.6 vs 0.4), matching the Engineering Bridge v3.0 rationale that runtime operational coherence matters more than static topology.

**Component mapping to spec R3.1:**

| Spec Component | Implementation | Verified |
|---------------|----------------|----------|
| Structural Coherence (λ₂) | `computeFiedlerEigenvalue` → Jacobi eigenvalue algorithm | ✅ |
| Runtime Friction (TV_G) | `computeGraphTotalVariation` → weighted graph total variation | ✅ |
| Combined formula | `0.4 × norm(λ₂) + 0.6 × (1 − friction)` | ✅ |

### Finding 3.2 — ❌ Fiedler Eigenvalue Bug for 2-Node Graphs

**Evidence (psi-h.ts, line 143–146):**
```typescript
if (n === 2) {
  // For 2-node graph, λ₂ = trace / n or directly from Laplacian
  return laplacian[0]; // Both diagonal elements equal for undirected
}
```

**Mathematical analysis:** For a 2-node undirected graph with edge weight *w*:
- Laplacian: `[[w, −w], [−w, w]]`
- Characteristic equation: `λ(λ − 2w) = 0`
- Eigenvalues: `λ₁ = 0`, `λ₂ = 2w`

The code returns `laplacian[0] = w`, but the correct Fiedler eigenvalue is `2w`.

**Impact on combined score:** For a 2-node composition with edge weight 1:
- Computed: `lambda2Normalized = min(1, 1/2) = 0.5` → structural contribution = `0.4 × 0.5 = 0.2`
- Correct: `lambda2Normalized = min(1, 2/2) = 1.0` → structural contribution = `0.4 × 1.0 = 0.4`
- **Underestimate of 0.2** in the combined ΨH score for 2-node compositions.

**Severity:** Medium. Two-node compositions are common (parent with two children), and the structural coherence of a fully-connected pair should register as maximum (1.0 normalized), not half.

**Comment accuracy:** The inline comment says "λ₂ = trace / n" which for this Laplacian would be `2w / 2 = w`. The comment's formula is also wrong — it should be `trace` (= 2w for the 2-node Laplacian) not `trace / n`.

### Finding 3.3 — λ₂ Normalization Ceiling

**Evidence (psi-h.ts, line 95–96):**
```typescript
const lambda2Normalized = Math.min(1, lambda2 / Math.max(n, 2));
```

The theoretical maximum λ₂ for a complete graph on *n* nodes with unit weights is *n*. Dividing by *n* maps to [0, 1]. The `Math.max(n, 2)` guard prevents division by 1 (which could exceed 1.0 for strongly-connected singleton compositions). This is correctly conservative.

### Finding 3.4 — ⚠️ Edge Weight Fallback in Total Variation

**Evidence (psi-h.ts, line 231):**
```typescript
totalVariation += Math.abs(phiI - phiJ) * (edge.weight || 1);
```

The `||` operator treats `edge.weight = 0` as falsy, defaulting to 1. A zero-weight edge should contribute zero variation, not be promoted to weight 1. The correct operator is `??`:
```typescript
totalVariation += Math.abs(phiI - phiJ) * (edge.weight ?? 1);
```

**Severity:** Low. Zero-weight edges are unlikely in practice (the subgraph extraction query uses `COALESCE(r.weight, 1.0)`), but this is a semantic correctness issue.

### Finding 3.5 — Jacobi Eigenvalue Algorithm Appropriateness

The `computeAllEigenvalues` function uses the Jacobi rotation method with up to 50 sweeps and convergence threshold 1e-12. This is appropriate for the expected scale (n < 50 nodes per composition subgraph). The algorithm:

- Correctly identifies the largest off-diagonal element per sweep
- Applies Givens rotation to zero it
- Extracts eigenvalues from the diagonal after convergence

The code comment acknowledges the O(n³) complexity and recommends ARPACK for larger scale. For the current use case, this is acceptable.

---

## 4. Graph Persistence Wiring

### Finding 4.1 — ✅ Complete Persist Flow in `computeAndPersistPsiH`

**Evidence (health.ts, `computeAndPersistPsiH`):**

```
Step 1: getCompositionSubgraph(bloomId)     → { edges, nodeHealths }
Step 2: runQuery("MATCH (b:Bloom {id})      → PsiHState (JSON from Bloom node)
         RETURN b.psiHState")
Step 3: computePsiHWithState(edges,          → { psiH, decomposition, updatedState }
         nodeHealths, state)
Step 4: updateBloomPsiH(bloomId,             → Neo4j WRITE
         psiH.combined, psiH.lambda2,
         psiH.friction,
         decomposition.psiH_trend,
         JSON.stringify(updatedState))
```

The four-step flow correctly:
1. Extracts the composition subgraph from graph state
2. Reads temporal state (PsiHState) from the same Bloom node
3. Computes ΨH with EWMA decomposition
4. Persists results back to the Bloom node

**Values persisted to Neo4j (via `updateBloomPsiH`):**

| Value | Source | Purpose |
|-------|--------|---------|
| `psiH.combined` | Core computation | Primary ΨH score for the Bloom |
| `psiH.lambda2` | Fiedler eigenvalue | Structural coherence diagnostic |
| `psiH.friction` | Graph total variation | Runtime friction diagnostic |
| `decomposition.psiH_trend` | EWMA trend | Smoothed temporal trend |
| `JSON.stringify(updatedState)` | Full PsiHState | Ring buffer + EWMA state for next computation |

### Finding 4.2 — PsiHState Serialization Round-Trip

**Read path (health.ts):**
```typescript
const stateJson: string | null = stateResult.records[0]?.get("psiHState") ?? null;
if (stateJson) {
  try {
    state = JSON.parse(stateJson) as PsiHState;
  } catch {
    state = createDefaultPsiHState();
  }
}
```

**Write path:**
```typescript
JSON.stringify(updatedState)
```

PsiHState contains only JSON-safe types (`number[]` ringBuffer, `number` scalars, `number | undefined` optionals). No `Date` objects or circular references. The silent catch with fallback to default state is a correct resilience pattern — corrupted state doesn't crash the system, it resets the EWMA baseline.

**Verdict:** ✅ Round-trip is sound.

### Finding 4.3 — ⚠️ `updateBloomPsiH` Not Provided for Verification

The persistence function is imported from `./bloom.js`:
```typescript
import { updateBloomPsiH, updateBloomEpsilonR } from "./bloom.js";
```

This file was **not included** in the provided context. We cannot verify:
- The actual Cypher query used (SET properties on Bloom node?)
- Whether it uses `WRITE` access mode
- Whether `psiHComputedAt` timestamp is set (for temporal auditing)
- Whether the property names match what other queries read

**Recommendation:** Include `src/graph/queries/bloom.ts` in the audit scope to close this verification gap.

### Finding 4.4 — Null Propagation for Empty Compositions

```typescript
const subgraph = await getCompositionSubgraph(bloomId);
if (!subgraph) return null;
```

If a Bloom has no children, `getCompositionSubgraph` returns `null`, and `computeAndPersistPsiH` returns `null` without attempting computation or persistence. This is correct — ΨH is undefined for a leaf Bloom with no composition.

**Edge case:** A Bloom with children that all lack ΦL values still gets computed, with all children defaulting to `phiL = 0.5` from `COALESCE`. This produces a valid but potentially misleading ΨH (low friction because all nodes have the same default value). This is an acceptable cold-start behavior.

---

## 5. Bootstrap Executor Integration

### Finding 5.1 — ❌ No ΨH Wiring in Bootstrap Executor

**Evidence:** Complete import analysis of `scripts/bootstrap-executor.ts`:

```typescript
import { selectModel } from "../src/patterns/thompson-router/select-model.js";
import type { ModelExecutor, ModelExecutorContext, ModelExecutorResult }
  from "../src/patterns/architect/types.js";
import { getVertexToken, getGcpProject, VERTEX_REGION } from "./vertex-auth.js";
```

**Missing:**
- ❌ No import of `computeAndPersistPsiH` from `queries/health.ts`
- ❌ No import of `computePsiH` or `computePsiHWithState` from `computation/psi-h.ts`
- ❌ No call to any ΨH-related function
- ❌ No post-pipeline-run hook that could trigger ΨH computation

**Consistency with t2 findings:** This mirrors the identical gap found for signal conditioning in t2: the bootstrap executor is a **model-calling harness** with no health orchestration responsibilities. It handles Thompson routing, provider authentication, and LLM API streaming — but does not participate in the ΦL/ΨH/εR computation lifecycle.

### Finding 5.2 — Architectural Interpretation

The function comment in health.ts provides the intended trigger point:

```typescript
/**
 * Call after pipeline runs or topology changes (not inside writeObservation).
 */
export async function computeAndPersistPsiH(bloomId: string): Promise<PsiH | null> {
```

This implies ΨH computation is designed to be invoked by a **pipeline orchestrator** that runs after the bootstrap executor completes its LLM work — not by the bootstrap executor itself. The missing piece is the orchestrator that:

1. Receives pipeline completion events
2. Identifies affected Bloom compositions
3. Calls `computeAndPersistPsiH` for each affected parent Bloom
4. Propagates results upward through the Bloom hierarchy

**The wiring exists at the function level but not at the orchestration level.** The `computeAndPersistPsiH` function is a correctly-built brick that has not yet been laid into the wall.

---

## 6. Specification Conformance Matrix

| Spec Requirement (from t1) | Implementation Status | Evidence |
|---|---|---|
| **R3.1** Two-component composite (λ₂ + TV_G) | ✅ Implemented | `computePsiH` returns `{ lambda2, friction, combined }` |
| **R3.1** Weights: structural × λ₂ + runtime × (1−friction) | ✅ Correct | `PSI_H_WEIGHTS.structural` (0.4) + `PSI_H_WEIGHTS.runtime` (0.6) |
| **R3.1** λ₂ via graph Laplacian | ✅ Implemented | `buildLaplacian` + `computeFiedlerEigenvalue` (Jacobi) |
| **R3.1** λ₂ normalized to [0,1] | ✅ Correct | `Math.min(1, lambda2 / Math.max(n, 2))` |
| **R3.1** TV_G = weighted graph total variation | ✅ Implemented | `computeGraphTotalVariation` with ΦL signal |
| Composition subgraph scoped to CONTAINS children | ✅ Correct | `[:CONTAINS]->(child)` in Cypher |
| Temporal decomposition (EWMA trend + friction split) | ✅ Implemented | `decomposePsiH` with ring buffer + EWMA |
| Persistence to graph | ✅ Path exists | `updateBloomPsiH` called with all computed values |
| Triggered after pipeline runs | ⚠️ Unverified | Comment says "call after pipeline runs" but no call site found |
| Integration with bootstrap executor flow | ❌ Missing | Zero references in bootstrap-executor.ts |

---

## 7. Consolidated Findings

### Bugs

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| **B1** | Medium | `psi-h.ts:144` | 2-node Fiedler eigenvalue returns `w` instead of `2w`. Underestimates structural coherence by 50% for 2-node compositions. |
| **B2** | Low | `psi-h.ts:231` | `edge.weight || 1` treats zero-weight edges as weight 1. Should use `edge.weight ?? 1`. |

### Wiring Gaps

| ID | Severity | Description |
|----|----------|-------------|
| **W1** | High | No call site for `computeAndPersistPsiH` exists in the bootstrap executor or any provided orchestrator file. The computation-to-persistence pipeline is correctly built but not invoked. |
| **W2** | Medium | `updateBloomPsiH` (from `queries/bloom.ts`) is not in the audit scope — the final persistence step cannot be verified. |
| **W3** | Low | Subgraph extraction captures all relationship types between children; no filtering to structural-only edges. Could include non-structural edges that distort λ₂. |

### Positive Findings

| ID | Description |
|----|-------------|
| **P1** | `computePsiH` → `computePsiHWithState` → `decomposePsiH` layering is clean, testable, and correctly separates stateless computation from temporal tracking. |
| **P2** | PsiHState serialization round-trip via JSON is correctly bounded (ring buffer maxSize=40) and resilient to corruption (catch → reset). |
| **P3** | Null propagation for empty/leaf compositions is correctly handled at both query and computation layers. |
| **P4** | Cold-start defaults (`phiL = 0.5`, `PsiHState = createDefaultPsiHState()`) are sensible and don't crash the system. |
| **P5** | EWMA baseline establishment requires minimum 5 observations before locking, preventing premature baseline from noisy early signals. |

---

## 8. Recommendations

1. **Fix B1 (2-node eigenvalue):** Replace `return laplacian[0]` with `return laplacian[0] + laplacian[3]` (sum of diagonal = trace = 2w = sum of eigenvalues, minus λ₁=0 gives λ₂=2w). Alternatively, for correctness: `return 2 * laplacian[0]` since both diagonal entries are equal for undirected 2-node graphs.

2. **Close W1 (orchestration gap):** Implement a post-pipeline-run hook in the Architect pattern or pipeline orchestrator that calls `computeAndPersistPsiH` for affected parent Blooms. This is the critical missing link between computation and production use.

3. **Close W2 (audit scope):** Include `src/graph/queries/bloom.ts` in the next audit pass to verify the Cypher persistence query, property naming, and timestamp handling.

4. **Address W3 (edge type filtering):** Add relationship type filtering to `getCompositionSubgraph` to restrict the adjacency matrix to structural relationships only, or document the intentional inclusion of all edge types with rationale.

5. **Fix B2 (weight fallback):** Replace `edge.weight || 1` with `edge.weight ?? 1` in `computeGraphTotalVariation` for semantic correctness.