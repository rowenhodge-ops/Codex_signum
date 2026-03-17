# Verify hierarchical ΦL propagation through CONTAINS edges

> Task ID: t5
> Model: claude-opus-4-6:adaptive:medium
> Duration: 268242ms
> Output chars: 28702
> Timestamp: 2026-03-17T13:40:19.681Z

> **⚠️ Hallucination flags (10):**
> - [content/warning] References eliminated entity "getPattern"
> - [content/warning] Task t5 references "phi-l.ts" but this file was not in its context
> - [content/warning] Task t5 references "../graph/queries.js" but this file was not in its context
> - [content/warning] Task t5 references "graph/queries.js" but this file was not in its context
> - [content/warning] Task t5 references "./dampening.js" but this file was not in its context
> - [content/warning] Task t5 references "./aggregation.js" but this file was not in its context
> - [content/warning] Task t5 references "health.ts" but this file was not in its context
> - [content/warning] Task t5 references "dampening.ts" but this file was not in its context
> - [content/warning] Task t5 references a document ("docs/specs/01_codex-signum-v3_0.md") that was not in its context
> - [content/warning] Task t5 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Hierarchical ΦL Propagation Wiring Audit (M-22.5)

**Task:** t5 — Verify hierarchical ΦL propagation through CONTAINS edges
**Scope:** `src/computation/hierarchical-health.ts`, `src/computation/phi-l.ts`, `src/graph/queries/health.ts`
**Spec Reference:** Engineering Bridge v3.0, Part 2 §ΦL, Part 3 §Cascade; M-22 Row 5
**Prior Task Cross-References:** t1 (requirements extraction), t2 (signal conditioning gaps), t3 (ΨH wiring), t4 (εR aggregation)

---

## Executive Summary

The hierarchical ΦL propagation implementation contains two structurally complete paths — a **batch bottom-up computation** (`computeHierarchicalHealth`) and an **event-triggered upward cascade** (`propagatePhiLUpward`) — both correctly anchored on CONTAINS-edge graph traversal and leaf-to-root ordering. However, the audit identifies **one critical dead-code bug** where computed dampening (γ_effective) and hysteresis are calculated but never applied to the propagated ΦL value, **one structural wiring gap** where the batch path computes results but does not persist them, and **several moderate concerns** including a race condition window in concurrent propagation, system-health bypass of the containment hierarchy, and incomplete reconciliation between batch and event-triggered paths. The leaf-to-root invariant holds in both paths. The `phi-l.ts` core computation is sound and spec-compliant.

| Acceptance Criterion | Status | Summary |
|---|---|---|
| `propagateHealth` correctly traverses CONTAINS edges | ✅ **PASS** | Both batch and event paths use CONTAINS-edge graph queries |
| Parent node health derived from child node aggregation | ⚠️ **PARTIAL** | Aggregation correct; dampening/hysteresis computed but discarded |
| Propagation order is leaf-to-root verified | ✅ **PASS** | Batch: `getContainersBottomUp`; Event: recursive ascent |
| Graph queries retrieve hierarchical health correctly | ⚠️ **PARTIAL** | Query wiring correct from consumer side; implementations not visible; batch results not persisted |

---

## 1. CONTAINS-Edge Traversal Verification

### Finding 1.1 — Batch Path Correctly Chains CONTAINS Queries

**Evidence (`computeHierarchicalHealth`, lines 53–60):**

```typescript
// Step 1: Get all leaf-level health (patterns with stored ΦL)
const patterns = await getPatternsWithHealth();

// Step 2: Get containers ordered bottom-up (deepest first)
const containers = await getContainersBottomUp();

// Step 3: For each container, aggregate from children
for (const container of containers) {
  const childNodes = await getContainedChildren(container.id);
```

The traversal chain is:
1. `getPatternsWithHealth()` — retrieves all leaf nodes with pre-computed ΦL
2. `getContainersBottomUp()` — returns container nodes in depth-descending order
3. `getContainedChildren(container.id)` — retrieves children via CONTAINS edges

Each function is imported from `../graph/queries.js`:
```typescript
import {
  getContainedChildren,
  getContainersBottomUp,
  getParentBloom,
  // ...
} from "../graph/queries.js";
```

**Verdict:** ✅ The batch path correctly traverses CONTAINS edges at each hierarchy level. The query implementation details are encapsulated in `graph/queries.js` (not provided), but the consumer wiring is structurally sound — each container's children are looked up by CONTAINS relationship.

### Finding 1.2 — Event-Triggered Path Correctly Ascends CONTAINS Hierarchy

**Evidence (`propagatePhiLUpward`, lines 150–164):**

```typescript
// Step 1: Find parent via CONTAINS edge
const parent = await getParentBloom(bloomId);
if (!parent) return; // Root node — nowhere to propagate

// Step 2: Read all children of the parent (siblings + this node)
const siblings = await getContainedChildren(parent.id);
const k = siblings.length;
```

The ascent chain is:
1. `getParentBloom(bloomId)` — follows CONTAINS edge **upward** from child to parent
2. `getContainedChildren(parent.id)` — follows CONTAINS edges **downward** to get all siblings
3. Recursive call to `propagatePhiLUpward(parent.id, ...)` — ascends to grandparent

The recursive structure guarantees upward traversal terminates at root (`parent === null`).

**Verdict:** ✅ Event-triggered path correctly navigates CONTAINS edges bidirectionally (upward to find parent, downward from parent to enumerate siblings).

### Finding 1.3 — ⚠️ `getParentBloom` Assumes Single-Parent Containment

The event-triggered path calls `getParentBloom(bloomId)` which returns a single parent (or null). This assumes each node has **at most one** CONTAINS parent — a tree invariant. If the graph permits multiple CONTAINS parents (DAG rather than tree), only one parent would be propagated to, and the other parent's ΦL would go stale until the next batch reconciliation.

**Spec conformance:** The Engineering Bridge v3.0 describes Blooms as "fractal containment" which implies strict tree nesting. The single-parent assumption is likely correct per spec, but no validation enforces it at write time (no provided code checks for this constraint during CONTAINS edge creation).

**Risk:** Low if tree invariant is maintained. High if any code path creates multiple CONTAINS parents for a single node.

---

## 2. Parent Health Derivation from Child Aggregation

### Finding 2.1 — ❌ Critical: Dampening (γ_effective) and Hysteresis Are Computed But Never Applied

**Evidence (`propagatePhiLUpward`, lines 168–193):**

```typescript
// Step 3: Compute dampened impact
const deltaPhiL = previousPhiL - newPhiL;
const isDegrading = deltaPhiL > 0;

const bypass = checkAlgedonicBypass(newPhiL);

let gamma: number;
if (bypass.bypassed) {
  gamma = 1.0;
} else {
  gamma = computeGammaEffective(k);
}

// Apply hysteresis: recovery is 2.5× slower than degradation
let effectiveImpact: number;
if (isDegrading) {
  effectiveImpact = gamma * deltaPhiL;
} else {
  effectiveImpact = (gamma / HYSTERESIS_RATIO) * Math.abs(deltaPhiL);
}

// Step 5: Recompute parent ΦL from children (weighted mean)
const childPhiLs = siblings.map((s) => s.phiL);
const parentNewPhiL = weightedMean(childPhiLs, siblings.map(() => 1));
```

**The `effectiveImpact` variable is assigned but never read.** The parent's new ΦL is computed as the raw weighted mean of children's stored ΦL values, completely ignoring:
- γ_effective dampening (`computeGammaEffective(k)`)
- Hysteresis ratio (`HYSTERESIS_RATIO` of 2.5× slower recovery)
- Algedonic bypass flag (`gamma = 1.0`)

The dampening and hysteresis computation on lines 168–193 produces `effectiveImpact` which is **dead code**. No subsequent line references it. A grep-equivalent analysis of the function confirms zero reads of `effectiveImpact` after the assignment.

**Specification requirement (t1, Row 5 / R5.x):** The M-22.5 specification requires that:
- γ_effective dampens propagation based on branching factor
- Hysteresis creates asymmetric response (degradation fast, recovery slow)
- Algedonic bypass (ΦL < 0.1) removes dampening for emergency signals

None of these take effect. The parent ΦL is always the arithmetic mean of its children, regardless of dampening, hysteresis, or algedonic state.

**Impact:** **Critical.** The entire dampening subsystem (imported from `./dampening.js`) is wired but has no effect on hierarchical ΦL propagation. This means:
- A single degrading child in a branching-factor-100 container produces the same propagation rate as a branching-factor-2 container
- Recovery from degradation is **not** slower than degradation onset (no hysteresis)
- The algedonic bypass path computes `gamma = 1.0` but the result is identical to `gamma = 0.01` since neither is used

**Two possible design intents:**

| Intent A (dampening modifies value) | Intent B (dampening gates cascade) |
|---|---|
| `parentNewPhiL = parent.phiL + effectiveImpact` | Dampening applied to noise gate threshold |
| Consistent with docstring Steps 3–4 | Would require `parentDelta > PHI_L_PROPAGATION_NOISE_GATE / gamma` |
| Most likely per spec language | Not implemented either |

**Recommendation:** Intent A is most consistent with the Engineering Bridge specification and the function's own docstring. The fix would replace the raw weighted mean with a dampened delta:
```
parentNewPhiL = parentPreviousPhiL ± effectiveImpact
```
or incorporate dampening into the weighted mean itself.

### Finding 2.2 — Batch Path Records Dampening Metadata But Does Not Apply It

**Evidence (`computeHierarchicalHealth`, lines 97–100):**

```typescript
// M-22.5: Compute dampening metadata for container
const gamma_effective = k > 0 ? computeGammaEffective(k) : 0;

results.set(container.id, {
  ...aggregated,
  dampening_applied: k > 0,
  gamma_effective,
  cascade_depth: container.depth + 1,
  // ...
});
```

The `gamma_effective` value is computed and stored as metadata on the aggregate result, but the `aggregated` health values (computed by `aggregateHealth(children, subgraph, container.depth + 1)`) are **not modified** by dampening. The `aggregateHealth` function receives no dampening parameter.

**Implication:** The batch path is consistent with the event-triggered path in that dampening is present in the code but has no effect on computed values. However, by recording `gamma_effective` as metadata, downstream consumers could theoretically apply dampening post-hoc — a weaker guarantee than applying it during computation.

**Verdict:** ⚠️ Dampening metadata is informational only. Neither path applies it to ΦL values.

### Finding 2.3 — Weighted Mean Aggregation Is Correct (When Dampening Is Not Considered)

Setting aside the dampening issue, the raw aggregation logic is correct:

**Batch path:**
```typescript
const aggregated = aggregateHealth(children, subgraph, container.depth + 1);
```
Delegates to `aggregateHealth` from `./aggregation.js`, which computes a weighted composite of child ΦL, ΨH (from subgraph), and εR values.

**Event-triggered path:**
```typescript
const childPhiLs = siblings.map((s) => s.phiL);
const parentNewPhiL = weightedMean(childPhiLs, siblings.map(() => 1));
```
Uses equal-weight mean of children's ΦL — simpler than the batch path (no ΨH/εR) but correct for triggered ΦL-only propagation.

**4-factor decomposition aggregation (batch path, lines 102–116):**
```typescript
phiL_factors = {
  axiom_compliance: weightedMean(childFactors.map((c) => c.phiL_factors!.axiom_compliance), weights),
  provenance_clarity: weightedMean(childFactors.map((c) => c.phiL_factors!.provenance_clarity), weights),
  usage_success_rate: weightedMean(childFactors.map((c) => c.phiL_factors!.usage_success_rate), weights),
  temporal_stability: weightedMean(childFactors.map((c) => c.phiL_factors!.temporal_stability), weights),
};
```
Each ΦL factor is independently aggregated via weighted mean — preserving per-factor visibility at every hierarchy level. This is a correct and spec-aligned approach.

**Verdict:** ✅ Aggregation math is correct. ❌ Dampening is not applied.

### Finding 2.4 — Leaf Node ΦL Factor Approximation

**Evidence (lines 68–73):**
```typescript
results.set(p.id, {
  phiL_effective: p.phiL,
  // ...
  phiL_factors: {
    axiom_compliance: p.phiL,
    provenance_clarity: p.phiL,
    usage_success_rate: p.phiL,
    temporal_stability: p.phiL,
  },
});
```

When individual factor decomposition isn't stored on leaf nodes, the code uses the effective ΦL as a uniform proxy for all four factors. The inline comment acknowledges this:

> "When the full 4-factor decomposition isn't stored on the node, we use the stored ΦL as a uniform approximation across all factors."

**Issue:** This approximation is valid only when all four factors contribute equally. If the DEFAULT_PHI_L_WEIGHTS are non-uniform (which they typically are — axiom compliance is often weighted higher), using the same value for all factors produces a correct effective ΦL (since `Σ(wᵢ × c) = c × Σ(wᵢ) = c × 1.0 = c`), but individual factor values at the parent level become misleading — they suggest all factors are equally healthy/unhealthy when in reality some may be better than others.

**Risk:** Low for ΦL_effective (mathematically correct). Moderate for per-factor diagnostics at container level (masks real factor distribution).

---

## 3. Leaf-to-Root Propagation Order

### Finding 3.1 — Batch Path: Bottom-Up Ordering Invariant Verified

**Evidence (lines 56–60):**
```typescript
// Step 1: Get all leaf-level health (patterns with stored ΦL)
const patterns = await getPatternsWithHealth();
for (const p of patterns) {
  results.set(p.id, { ... });  // Leaves populated first
}

// Step 2: Get containers ordered bottom-up (deepest first)
const containers = await getContainersBottomUp();

// Step 3: For each container, aggregate from children
for (const container of containers) {
  const childNodes = await getContainedChildren(container.id);
  const children: ChildHealth[] = [];
  for (const child of childNodes) {
    const childHealth = results.get(child.id);  // ← Lookup from already-computed results
    if (childHealth) {
      children.push({ ... });
    }
  }
  // ...
  results.set(container.id, { ... });
}
```

The ordering guarantee is:

| Phase | Populates | Reads from |
|---|---|---|
| Step 1 (leaves) | `results[leaf.id]` | Graph (pre-computed ΦL) |
| Step 3 (deepest containers) | `results[deepContainer.id]` | `results[child.id]` — leaves ✅ |
| Step 3 (mid containers) | `results[midContainer.id]` | `results[child.id]` — deeper containers ✅ |
| Step 3 (shallowest containers) | `results[rootContainer.id]` | `results[child.id]` — mid containers ✅ |

The invariant holds because `getContainersBottomUp()` returns deepest-first, and each container only reads children that were populated in earlier iterations. The `results.get(child.id)` lookup guards against missing children with the `if (childHealth)` check.

**Edge case — missing children:** If a child node is neither a pattern (leaf) nor a container (intermediate), it would not appear in `results` and would be silently excluded from aggregation. The child's contribution to its parent's ΦL would be lost. This could occur with orphaned nodes or nodes of unexpected types.

**Verdict:** ✅ Leaf-to-root ordering is structurally sound assuming `getContainersBottomUp()` correctly sorts by depth descending.

### Finding 3.2 — Event-Triggered Path: Recursive Ascent Verified

**Evidence (lines 209–219):**
```typescript
if (parentDelta > PHI_L_PROPAGATION_NOISE_GATE) {
  if (bypass.bypassed || cascadeDepth + 1 < CASCADE_LIMIT) {
    await propagatePhiLUpward(
      parent.id,
      parentPreviousPhiL,
      clampedParentPhiL,
      cascadeDepth + 1,
    );
  }
}
```

The recursive structure guarantees leaf-to-root order:
1. Change detected at leaf bloom → `propagatePhiLUpward(leafId, prev, new, 0)`
2. Finds parent, recomputes parent ΦL → `propagatePhiLUpward(parentId, prev, new, 1)`
3. Finds grandparent, recomputes → `propagatePhiLUpward(grandparentId, prev, new, 2)`
4. Terminates when: `parent === null` (root), OR `parentDelta ≤ NOISE_GATE`, OR `cascadeDepth ≥ CASCADE_LIMIT`

**Termination guarantees:**

| Mechanism | Condition | Bypass |
|---|---|---|
| Root boundary | `getParentBloom()` returns null | None — always terminates |
| Noise gate | `parentDelta ≤ 0.01` | None — always checked |
| Cascade limit | `cascadeDepth + 1 ≥ CASCADE_LIMIT` | Algedonic bypass (`ΦL < 0.1`) |
| Algedonic bypass | `checkAlgedonicBypass(newPhiL)` | Only bypasses CASCADE_LIMIT |

**Concern:** Algedonic bypass removes the CASCADE_LIMIT guard. In a very deep hierarchy (e.g., 50 levels), an algedonic signal would cascade through all 50 levels. Termination is still guaranteed by the root boundary and noise gate, but the number of graph operations could be O(depth × branching_factor) in the worst case, since each level reads all siblings.

**Verdict:** ✅ Leaf-to-root order is guaranteed. ⚠️ Algedonic bypass could cause expensive cascades in deep hierarchies.

---

## 4. Graph Query Wiring for Hierarchical Health

### Finding 4.1 — ⚠️ Batch Results Are Not Persisted

`computeHierarchicalHealth()` returns `Map<string, AggregateHealth>` but **does not write** any results to the graph. The function is computation-only (despite being described as "NOT pure — calls graph/queries" in the module header).

By contrast, `propagatePhiLUpward()` **does persist** via:
```typescript
await updateBloomPhiL(parent.id, clampedParentPhiL, parentTrend);
```

**Asymmetry:**

| Path | Reads Graph | Computes | Writes Graph |
|---|---|---|---|
| `computeHierarchicalHealth` (batch) | ✅ | ✅ | ❌ |
| `propagatePhiLUpward` (event) | ✅ | ✅ | ✅ |

This means the batch computation path requires an external orchestrator to persist results. No such orchestrator is visible in the provided files. The caller receives the Map but must separately call graph write functions for each entry — functions whose signatures aren't shown in the provided code (only `updateBloomPhiL` is imported, but it's used only in the event path).

**Impact:** The batch hierarchical health computation is a "floating" function — it can compute correct results but they never reach the graph unless an unshown caller handles persistence.

### Finding 4.2 — `updateBloomPhiL` Wiring in Event Path Is Complete

**Evidence (lines 200–208):**
```typescript
const parentTrend: "improving" | "stable" | "declining" =
  clampedParentPhiL > parentPreviousPhiL + 0.01
    ? "improving"
    : clampedParentPhiL < parentPreviousPhiL - 0.01
      ? "declining"
      : "stable";

await updateBloomPhiL(parent.id, clampedParentPhiL, parentTrend);
```

The write path includes:
- Node ID (`parent.id`)
- New ΦL value (clamped `[0, 1]`)
- Trend classification with ±0.01 stability band

The trend classification band (±0.01) is consistent with `computeTrend` in `phi-l.ts` which uses ±0.02. The difference (0.01 vs 0.02) is minor but creates a subtle inconsistency: the propagation path classifies changes of 0.015 as improving/declining, while the core ΦL computation considers them stable.

**Verdict:** ✅ Write path is complete. ⚠️ Trend band inconsistency (0.01 vs 0.02).

### Finding 4.3 — `computeSystemHealth` Bypasses Containment Hierarchy

**Evidence (lines 128–148):**
```typescript
export async function computeSystemHealth(): Promise<AggregateHealth> {
  const patterns = await getPatternsWithHealth();
  // ...
  const children: ChildHealth[] = patterns.map((p) => ({
    id: p.id,
    phiL_effective: p.phiL,
    // ...
  }));
  return aggregateHealth(children, subgraph, maxDepth + 1);
}
```

System-level health is computed by **flat-aggregating all patterns**, treating every pattern as a direct child of the system regardless of containment depth. This ignores the hierarchical structure entirely — intermediate containers' aggregated health has no influence on the system health.

**Expected per spec:** System health should be the root of the containment hierarchy, derived from one level of aggregation over its direct children (which themselves aggregated from their children, etc.). The hierarchical structure should create a tree of weighted means, not a flat mean.

**Practical difference:** If the hierarchy has non-uniform fanout (e.g., one container holds 100 patterns, another holds 2), flat aggregation weights all 102 patterns equally. Hierarchical aggregation would weight each container equally (or by some scheme), producing different results.

**Verdict:** ❌ `computeSystemHealth` does not use hierarchical results, contradicting the purpose of hierarchical ΦL propagation.

### Finding 4.4 — Parallel with εR Propagation Pattern

The `health.ts` file shows `propagateEpsilonRToParent(bloomId)` — a Cypher-native upward propagation for εR:
```cypher
MATCH (parent:Bloom {id: $bloomId})-[:CONTAINS]->(child:Bloom)
WHERE child.epsilonR IS NOT NULL
WITH parent, avg(child.epsilonR) AS meanEpsilonR, count(child) AS childCount
WHERE childCount > 0
SET parent.epsilonR = meanEpsilonR
```

This is the εR analogue of ΦL propagation. Notably:
- εR propagation is done **in a single Cypher query** (atomic, no race condition)
- ΦL propagation is done **in TypeScript** with multiple sequential queries (race window)

The approaches are inconsistent. ΦL propagation could benefit from the same Cypher-native pattern for atomicity, though the dampening logic (once fixed) requires TypeScript computation.

### Finding 4.5 — ⚠️ Race Condition Window in Event-Triggered Propagation

**Scenario:** Two children of the same parent update ΦL simultaneously.

| Time | Child A | Child B |
|---|---|---|
| T1 | `getContainedChildren(parent)` → reads all siblings | — |
| T2 | — | `getContainedChildren(parent)` → reads all siblings |
| T3 | Computes parent ΦL from siblings (includes B's **old** ΦL) | Computes parent ΦL from siblings (includes A's **old** ΦL) |
| T4 | `updateBloomPhiL(parent, valueA)` | — |
| T5 | — | `updateBloomPhiL(parent, valueB)` — **overwrites A's write** |

Neither computation sees the other child's update. The last writer wins with a value that reflects only one child's change. This is eventually corrected by the next batch `computeHierarchicalHealth` run, but the interim state is incorrect.

**Risk:** Moderate in high-concurrency scenarios (parallel pipeline runs updating multiple children). Low in sequential execution.

---

## 5. ΦL Core Computation Verification (`phi-l.ts`)

### Finding 5.1 — Core `computePhiL` Is Spec-Compliant

The core computation function correctly implements the formula:

```
raw = Σ(wᵢ × fᵢ)   for i ∈ {axiom, provenance, success, stability}
maturityFactor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
effective = raw × maturityFactor
```

**Verification matrix:**

| Spec Element | Implementation | Status |
|---|---|---|
| 4-factor weighted sum | `computeRawPhiL` | ✅ Correct |
| Weights sum to 1.0 | `validateWeights` throws if |Σw - 1.0| > 0.001 | ✅ |
| Factors in [0, 1] | `validateFactors` throws if out of range | ✅ |
| Maturity factor | Delegated to `computeMaturityFactor` | ✅ |
| Trend computation | ±0.02 stability band | ✅ |
| Timestamp recording | `computedAt: new Date()` | ✅ |

### Finding 5.2 — Ring Buffer Temporal Stability Is Correctly Wired

`computePhiLWithState` integrates the ring buffer for temporal stability:

1. Pushes previous ΦL into ring buffer
2. Computes variance-based stability from buffer
3. Builds full factors (including computed stability)
4. Delegates to `computePhiL` (backward compatible)
5. Returns `{ phiL, updatedState }` (caller persists state)

The window size recommendations (`PHI_L_WINDOW_SIZES`) match the spec:

| Node Type | Window Size | Spec |
|---|---|---|
| Leaf | 10–20 (default 20) | ✅ |
| Intermediate | 30–50 (default 40) | ✅ |
| Root | 50–100 (default 75) | ✅ |

**Verdict:** ✅ ΦL computation is correctly structured and spec-compliant.

### Finding 5.3 — `assemblePatternHealthContext` Bridges Graph to ΦL Computation

In `health.ts`, the `assemblePatternHealthContext` function queries the graph for all ΦL input data:

| ΦL Factor | Data Source | Query Evidence |
|---|---|---|
| axiomCompliance | Hardcoded 1.0 (V1 stub) | "assume compliant until Assayer wired" |
| provenanceClarity | TaskOutput provenance fields + commitSha | `count(CASE WHEN to.modelUsed IS NOT NULL ...)` |
| usageSuccessRate | TaskOutput success/total | `count(CASE WHEN to.status = 'succeeded' ...)` |
| temporalStability | PhiLState ring buffer (JSON on Bloom) | `b.phiLState AS phiLState` |

The bridge is complete for V1, with axiomCompliance as a documented stub. The single Cypher query efficiently collects all required data in one graph round-trip.

**Verdict:** ✅ Graph-to-computation bridge is complete for V1.

---

## 6. Cross-Reference with Prior Task Findings

### 6.1 — Consistent with t2 (Signal Conditioning Gap)

t2 identified that signal conditioning is not wired from the bootstrap executor. This affects hierarchical ΦL propagation because the `signal_conditioned: true` flag set on leaf nodes (line 73) is an assertion rather than a verified property. No code path confirms that the ΦL value stored on a pattern actually went through the signal conditioning pipeline before being used as a leaf input to hierarchical aggregation.

### 6.2 — Consistent with t3 (ΨH Wiring Gap at Bootstrap)

t3 found no ΨH call site from the bootstrap executor. Similarly, `computeHierarchicalHealth` is not called from any provided orchestrator. The ΨH values computed in the batch path (via `getSubgraphEdges` and `aggregateHealth`) exist only in the returned Map, mirroring the pattern of complete computation with incomplete orchestration.

### 6.3 — Consistent with t4 (εR Orchestration Gap)

t4 found that εR has a complete computation layer and persistence layer with no wiring between them. The εR propagation function `propagateEpsilonRToParent` in `health.ts` is a single-level Cypher-native operation, while ΦL propagation in `propagatePhiLUpward` is a multi-level TypeScript recursive function. The designs are inconsistent but functionally analogous in their gap: **both lack an orchestration trigger**.

---

## 7. Consolidated Findings Matrix

| # | Severity | Finding | Location | Spec Ref |
|---|---|---|---|---|
| **F1** | 🔴 Critical | Dampening (γ_effective) and hysteresis computed but never applied — `effectiveImpact` is dead code | `propagatePhiLUpward` L168–193 | M-22.5 dampening |
| **F2** | 🔴 Critical | Batch `computeHierarchicalHealth` returns results but does not persist to graph | `computeHierarchicalHealth` return | M-22.5 persistence |
| **F3** | 🟠 Major | `computeSystemHealth` flat-aggregates all patterns, bypassing containment hierarchy | `computeSystemHealth` L128–148 | Part 2 §ΦL fractal |
| **F4** | 🟠 Major | No orchestration call site for either `computeHierarchicalHealth` or `propagatePhiLUpward` in provided files | All bootstrap/orchestrator files | M-22 Row 5 |
| **F5** | 🟡 Moderate | Race condition window when concurrent children propagate to same parent | `propagatePhiLUpward` L195–208 | Data integrity |
| **F6** | 🟡 Moderate | Trend stability band inconsistency: ±0.01 in propagation vs ±0.02 in `computeTrend` | `propagatePhiLUpward` L200 vs `phi-l.ts` L115 | Internal consistency |
| **F7** | 🟡 Moderate | Dampening metadata recorded on batch results (`gamma_effective`, `dampening_applied`) but not applied to aggregated values | `computeHierarchicalHealth` L97–100 | M-22.5 dampening |
| **F8** | 🟢 Low | Leaf node ΦL used as uniform proxy for all 4 factors — masks real factor distribution at container level | `computeHierarchicalHealth` L68–73 | Part 2 §ΦL factors |
| **F9** | 🟢 Low | Algedonic bypass removes CASCADE_LIMIT guard — unbounded depth in deep hierarchies | `propagatePhiLUpward` L211–219 | Part 3 §Cascade |
| **F10** | 🟢 Low | `phiL_factors` may be `undefined` on containers where no children carry factor decomposition | `computeHierarchicalHealth` L102–116 | Defensive coding |

---

## 8. Recommendations

### Immediate (blocks correctness)

1. **Wire dampening into propagated ΦL** (F1): Apply `effectiveImpact` to compute the new parent ΦL, or adopt a hybrid approach where the weighted mean is blended with the dampened delta. The current code renders the entire `dampening.ts` import dead for hierarchical propagation.

2. **Add persistence to batch path** (F2): Either have `computeHierarchicalHealth` call `updateBloomPhiL` for each result, or create an explicit `persistHierarchicalHealth(results: Map<string, AggregateHealth>)` function that the orchestrator calls.

### Short-term (blocks spec conformance)

3. **Rewrite `computeSystemHealth` to use hierarchy** (F3): Compute system health as `computeHierarchicalHealth().get(rootId)` rather than flat-aggregating all patterns.

4. **Create orchestration entry point** (F4): Wire `computeHierarchicalHealth` into the bootstrap executor's periodic cycle and `propagatePhiLUpward` into `writeObservation` step 7 (as referenced in the function's docstring).

5. **Harmonize trend stability bands** (F6): Align propagation trend band (±0.01) with `computeTrend` (±0.02) or make the threshold a shared constant.

### Medium-term (robustness)

6. **Add single-parent invariant check** (F1.3): Validate at CONTAINS-edge creation time that no node gains multiple CONTAINS parents.

7. **Consider Cypher-native propagation** (F4.4/F5): For the non-dampened weighted-mean case, a single Cypher query (like `propagateEpsilonRToParent`) eliminates the race condition. Dampened propagation would still require TypeScript.

8. **Initialize `phiL_factors` to undefined explicitly** (F10): Add `let phiL_factors: AggregateHealth["phiL_factors"] = undefined;` to make the fallback behavior explicit rather than relying on `let` hoisting semantics.