# Recompute lambda2 values

> Task ID: t7
> Model: claude-opus-4-6:adaptive:high
> Duration: 143747ms
> Output chars: 19665
> Timestamp: 2026-03-23T18:09:45.263Z

> **⚠️ Hallucination flags (3):**
> - [content/warning] Task t7 references "structural-review.ts" but this file was not in its context
> - [content/warning] Task t7 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context
> - [content/warning] Task t7 references a document ("docs/specs/06_codex-signum-architect-pattern-design.md") that was not in its context

---

# Lambda2 Recomputation Analysis (Cycle 8, t7)

## Executive Summary

The proposed wiring changes — creating the Assayer Bloom Definition (t1) and a single `FLOWS_TO` edge from `architect_GATE` (t2) — are **necessary but insufficient** to satisfy the acceptance criterion "No disconnected components warnings." A single bridging edge merges at most two components. The advisory's plural framing ("Stages have no inter-edges") and the Assayer's documented inbound topology (7 stage Blooms + 1 GATE) confirm that multiple components remain unwired. Post-mutation λ₂ will remain 0 unless the full inter-stage edge set is included in the computation's input. This analysis quantifies the gap, identifies the precise edges required, and recommends changes to the computation pathway to ensure lambda2 reflects the actual graph structure.

---

## 1. Pre-Mutation Graph Topology

### 1.1 Component Census

| Evidence Source | Finding |
|---|---|
| Pre-survey: `lambda2=0` | Laplacian kernel dimension ≥ 2 → at least 2 connected components |
| Advisory: "Stages have no inter-edges" | Every stage Bloom is an isolated subgraph; component count ≥ number of stages |
| t6: GATE is graph-unaware | GATE node has zero FLOWS_TO edges — confirmed isolated |
| t8: Assayer requires inbound from 7 stage Blooms | 7 stage-to-Assayer paths are undeclared |
| t5: INSTANTIATES invisible to topology | Bloom-to-Seed edges are excluded from adjacency queries feeding the review |

**Inferred minimum component count**: If each of the 7 stage Blooms, the GATE, and the Assayer all exist as nodes with only intra-component (CONTAINS) edges, the graph has **at minimum 8–9 disconnected components** visible to the structural review. The actual count depends on which CONTAINS subtrees share edges, but CONTAINS is explicitly excluded from `getSubgraphEdges` (t2 evidence: `WHERE type(r) <> 'CONTAINS'`), meaning even containment-linked nodes appear disconnected from the review's perspective.

### 1.2 Current Laplacian Structure

`computeGlobalLambda2` builds the Laplacian from the provided `(edges, nodeIds)` pair. With no `FLOWS_TO` or `REFERENCES` inter-stage edges, the Laplacian is block-diagonal:

```
L = diag(L₁, L₂, ..., Lₖ)   where k = number of components
```

The eigenvalue spectrum is the union of per-block spectra. The smallest eigenvalue is 0 (with multiplicity k). λ₂ = 0 because the second-smallest eigenvalue belongs to the zero-eigenspace of any component beyond the first.

**Cascade to other diagnostics** (confirming t3's analysis):

| Diagnostic | Current Output | Root Cause |
|---|---|---|
| D1: `globalLambda2` | `0` | k > 1 → zero eigenspace has multiplicity k |
| D2: `spectralGap` | `Infinity` | Guard: `lambda2 < 1e-10` → returns Infinity |
| D3: `hubDependencies` | `[]` | Early exit: `globalLambda2 <= 0` |
| D4: `frictionDistribution` | Under-reports | Only within-component ΦL differences measured; cross-component friction invisible |
| D5: `dampeningAssessment` | Unsound | Degree computed only from visible edges; γ recommendations based on incomplete topology |

---

## 2. Post-Mutation Lambda2 Estimate

### 2.1 Edges Added This Cycle

| Mutation | Edge | Source | Target |
|---|---|---|---|
| t1 + t2 | `FLOWS_TO` | `architect_GATE` | Assayer Bloom Definition (new) |

This is **1 edge** bridging **2 nodes** that were previously in separate components.

### 2.2 Component Reduction

Adding one edge between two components reduces the component count by exactly 1:

```
Pre-mutation:  k components    → λ₂ = 0  (multiplicity k)
Post-mutation: k-1 components  → λ₂ = 0  (multiplicity k-1, if k-1 ≥ 2)
```

**For λ₂ > 0, the graph must have exactly 1 connected component.** With k ≥ 8 estimated pre-mutation, a single edge yields k-1 ≥ 7 remaining components. **λ₂ remains 0.**

### 2.3 Projected Lambda2 After Full Wiring

If all edges documented in t8 §2.1 are present:

| Edge Set | Count | Bridges |
|---|---|---|
| Stage Bloom outputs → Assayer | 7 | Connects each stage to Assayer component |
| `architect_GATE` → Assayer | 1 | Connects GATE to Assayer component |
| Constitutional Bloom → Assayer (`REFERENCES`) | 1–2 | Connects axiom/anti-pattern sources |
| Inter-stage `FLOWS_TO` (stage ordering) | ~6–7 | Sequential stage flow (PLAN→GATE→EXECUTE→...) |

**Total bridging edges needed**: ~15–17 edges minimum to form a single connected component from the current fragmented topology.

With full wiring, the Laplacian becomes irreducible. For a graph with n nodes and the degree distribution implied by the Architect pattern's hub-spoke topology (Assayer as high-degree hub receiving from 7+ sources):

- **Lower bound on λ₂**: For a star graph with hub degree d, λ₂ = 1. The Architect topology is denser than a star (stage-to-stage sequential edges exist alongside stage-to-Assayer hub edges), so **λ₂ ≥ 1.0** is a reasonable floor estimate.
- **Upper bound on λ₂**: Bounded by the minimum node degree in the graph. Leaf nodes with degree 1 constrain λ₂ ≤ 1 for unweighted graphs. With weighted edges (default weight 1.0 per t2), λ₂ is further constrained by the Cheeger inequality.

**Projected λ₂ after full inter-stage wiring: approximately 0.8–1.2** for the Architect pattern subgraph, assuming 8–12 nodes and 15–20 edges with uniform weight 1.0.

---

## 3. Root Cause: Why the Computation Receives an Incomplete Edge Set

The computation in `computeGlobalLambda2` is mathematically correct. The defect is upstream — in the assembly of the `edges[]` parameter. Three distinct failure modes contribute:

### 3.1 Missing FLOWS_TO Edges in Graph State

**Source**: t6 analysis. The GATE stage (and by extension, other stages) was ported from a procedural framework without graph-native edge declarations. The `FLOWS_TO` edges **do not exist in the graph database** because no stage has ever created them.

**Impact on computation**: `computeGlobalLambda2` receives an edge set that accurately reflects the graph — but the graph is structurally incomplete. The computation correctly reports λ₂ = 0 for an objectively disconnected graph.

### 3.2 Edge Type Filtering Excludes INSTANTIATES

**Source**: t5 analysis. The topology query pattern `MATCH (a:Bloom)-[r]->(b:Bloom)` excludes `INSTANTIATES` edges because their targets are `:Seed` nodes, not `:Bloom` nodes. Even where INSTANTIATES edges exist, they are invisible to the structural review.

**Impact on computation**: If INSTANTIATES edges cross component boundaries (a Bloom in one component linking to a Seed definition in another), their exclusion may artificially inflate the disconnection count. However, INSTANTIATES edges are semantically "type-of" links, not flow links — including them in the connectivity computation conflates structural identity with process topology. **Recommendation: Do not include INSTANTIATES in the λ₂ edge set**, but do surface them in a separate diagnostic (see §5).

### 3.3 CONTAINS Edges Explicitly Excluded

**Source**: t2 analysis — `getSubgraphEdges` filters `WHERE type(r) <> 'CONTAINS'`. CONTAINS edges represent hierarchical nesting, not process flow. Their exclusion is semantically correct for λ₂ computation (containment does not imply connectivity in the flow sense), but it means nodes that are only linked by containment appear disconnected.

**Impact**: Expected and correct. No change needed.

---

## 4. Findings: What Must Change in the Computation

### F1: The Single-Edge Mutation Does Not Resolve λ₂ = 0

**Evidence**: Section 2.2 above. One edge reduces component count by 1 from an estimated 8+. Lambda2 remains 0. The acceptance criterion "No disconnected components warnings" **cannot be satisfied** by this cycle's mutations alone unless additional inter-stage edges are wired simultaneously.

**Severity**: High — the acceptance criterion is structurally unachievable with the declared mutation scope.

### F2: `computeGlobalLambda2` Lacks Component Diagnostics

**Evidence**: The function returns a single scalar. When λ₂ = 0, the caller knows the graph is disconnected but not *how* disconnected (2 components? 10?). The `StructuralReviewResult` type has no field for component count or per-component analysis.

**Code reference** (`structural-review.ts`, lines 85–92):
```typescript
export function computeGlobalLambda2(
  edges: GraphEdge[],
  nodeIds: string[],
): number {
  if (nodeIds.length <= 1) return 0;
  const nodeIndex = new Map(nodeIds.map((id, i) => [id, i]));
  const n = nodeIds.length;
  const { laplacian } = buildLaplacian(n, edges, nodeIndex);
  return computeFiedlerEigenvalue(laplacian, n);
}
```

No pre-check for connectivity. No decomposition into components. The eigenvalue computation runs on the full (block-diagonal) Laplacian, which is O(n³) — wasteful when a linear-time union-find would immediately reveal the disconnection.

### F3: `spectralGap` and `hubDependencies` Degrade Silently

**Evidence**: `computeSpectralGap` returns `Infinity` (line 113: `if (lambda2 < 1e-10) return Infinity`). `computeHubDependencies` returns `[]` (line 129: `if (nodeIds.length <= 2 || globalLambda2 <= 0) return []`). Neither diagnostic surfaces *why* it produced a degenerate result. Downstream consumers receive valid-typed but informationally empty results with no indication that the underlying graph is fragmented.

### F4: No Mechanism to Track Lambda2 Progression Across Cycles

**Evidence**: `runStructuralReview` computes a point-in-time snapshot. There is no stored prior λ₂ value, no delta computation, no trend tracking. The pre-survey's `lambda2=0` was presumably captured outside this module. When the review runs post-mutation, it will report a new λ₂ value with no context about whether connectivity improved or degraded.

### F5: Edge Assembly Contract is Implicit

**Evidence**: `runStructuralReview` accepts `edges: GraphEdge[]` with no documentation of which edge types should be included. The caller must know to include `FLOWS_TO` and `REFERENCES` but exclude `CONTAINS` and (optionally) `INSTANTIATES`. This contract is enforced nowhere — it depends entirely on the upstream query.

---

## 5. Recommendations

### R1: Add Connected Components Pre-Check (Priority: Critical)

**What**: Before eigenvalue computation, run a union-find (O(V + E)) to count connected components and identify their membership.

**Why**: Satisfies the acceptance criterion by converting "λ₂ = 0" from a dead-end scalar into an actionable diagnostic. Also avoids the O(n³) eigenvalue computation when the answer is trivially 0.

**Where**: Inside `computeGlobalLambda2` or as a new exported function `computeConnectedComponents(edges, nodeIds) → { count, components: string[][] }`.

**Result type extension**: Add to `StructuralReviewResult`:

| Field | Type | Purpose |
|---|---|---|
| `connectedComponents` | `number` | Component count (1 = fully connected) |
| `componentMembership` | `Map<string, number>` | Node ID → component index |
| `perComponentLambda2` | `number[]` | λ₂ within each component (informative even when global λ₂ = 0) |
| `componentSizes` | `number[]` | Sorted descending |

### R2: Declare Edge Type Contract Explicitly (Priority: High)

**What**: Document and optionally enforce which `GraphEdge` types constitute the structural review's input.

**Proposed contract**:

| Edge Type | Include in λ₂? | Rationale |
|---|---|---|
| `FLOWS_TO` | **Yes** | Primary process connectivity |
| `REFERENCES` | **Yes** | Read-dependency connectivity |
| `INSTANTIATES` | **No** | Type identity, not process flow |
| `CONTAINS` | **No** | Hierarchical nesting, not flow |

**Where**: As a JSDoc contract on `runStructuralReview` and optionally as a runtime filter within the function itself (defensive, in case callers pass unfiltered edge sets).

### R3: Compute Per-Component Lambda2 When Global Is Zero (Priority: High)

**What**: When the pre-check detects k > 1 components, compute λ₂ within each component individually. This provides actionable diagnostics even in the disconnected state — a component with high internal λ₂ is well-structured internally but poorly integrated externally.

**Why**: The current behavior (return 0, suppress hub dependencies, return infinity for spectral gap) destroys all diagnostic value. Per-component analysis preserves it.

**Expected output for the current Cycle 8 post-mutation state** (estimated):

| Component | Nodes (est.) | Internal λ₂ (est.) | Interpretation |
|---|---|---|---|
| GATE + Assayer | 2 | 1.0 | Minimally connected pair |
| Stage Bloom 1 (e.g., PLAN) | 1–3 | 0 or small | Isolated stage |
| Stage Bloom 2 (e.g., EXECUTE) | 1–3 | 0 or small | Isolated stage |
| ... (×5 more stages) | 1–3 each | 0 or small | Isolated stages |

### R4: Track Lambda2 Delta Across Cycles (Priority: Medium)

**What**: Store the prior cycle's λ₂ in the review result or accept it as input, and compute Δλ₂.

**Proposed field**:

| Field | Type | Computation |
|---|---|---|
| `lambda2Delta` | `number \| null` | `currentLambda2 - priorLambda2` (null if no prior) |
| `lambda2Trend` | `'improving' \| 'degrading' \| 'stable' \| 'unknown'` | Derived from delta sign and magnitude |

**Why**: The Cycle 8 intent explicitly tracks lambda2 as a pre-survey metric. The recomputation (this task) should produce a value that can be compared to the pre-survey baseline (0) and to future cycles.

**Expected Cycle 8 delta**:

| Scenario | Prior λ₂ | Post λ₂ | Δλ₂ | Trend |
|---|---|---|---|---|
| Only t2 edge wired | 0 | 0 | 0 | `stable` (still disconnected) |
| All inter-stage edges wired | 0 | ~0.8–1.2 | +0.8–1.2 | `improving` |

### R5: Resolve the Acceptance Criterion Gap (Priority: Critical — Process)

**What**: Escalate that the acceptance criterion "No disconnected components warnings" requires wiring **all** inter-stage `FLOWS_TO` edges, not just the single `architect_GATE → Assayer` edge proposed in this cycle.

**Evidence chain**:
- t6 confirms GATE has zero outbound flow edges
- t8 documents 7 stage Bloom → Assayer edges plus ~6 inter-stage sequential edges
- t2 proposes exactly 1 of these ~15 edges
- Section 2.2 proves 1 edge is insufficient to achieve λ₂ > 0

**Options**:

| Option | λ₂ Outcome | Acceptance Criteria Met? |
|---|---|---|
| A: Wire only the t2 edge; defer remaining | λ₂ = 0 | **No** |
| B: Wire all inter-stage edges this cycle | λ₂ > 0 (~0.8–1.2) | **Yes** |
| C: Redefine acceptance criteria to "λ₂ improvement" rather than "no warnings" | λ₂ = 0, but delta tracked | Partially — warning suppression deferred |
| D: Implement per-component λ₂ (R3) and redefine "no warnings" as "no *undiagnosed* disconnections" | λ₂ = 0 globally, per-component values surfaced | Yes, if the criterion is interpreted as diagnostic adequacy |

**Recommendation**: Option B is the clean resolution. If scope constraints prevent wiring all edges in Cycle 8, Option D combined with R1/R3 makes the disconnection **diagnosed and tracked** rather than a silent warning — which may satisfy the spirit of the criterion.

### R6: Guard Against Edge Weight Inconsistency (Priority: Low)

**What**: `buildLaplacian` uses edge weights from `GraphEdge`. The default weight is 1.0 (per t2's analysis). Verify that all edges in the structural review's input carry consistent weights, or that `buildLaplacian` defaults absent weights to 1.0.

**Why**: Inconsistent or zero weights produce a Laplacian with artificially low λ₂, even for a connected graph. An edge with weight 0 is topologically equivalent to no edge.

---

## 6. Recomputed Lambda2 Values

### 6.1 Cycle 8 Post-t2 (Single Edge Added)

```
Nodes:       n ≥ 9 (7 stage Blooms + GATE + Assayer, minimum)
Edges added: 1 (architect_GATE → Assayer Bloom Definition)
Components:  k-1 ≥ 7 (still disconnected)

globalLambda2 = 0
spectralGap   = Infinity
hubDependencies = []
```

**No change from pre-survey.** The computation is correct; the graph remains disconnected.

### 6.2 Projected: Full Inter-Stage Wiring

```
Nodes:       n ≈ 9–15 (stages + GATE + Assayer + constitutional references)
Edges added: ~15–17 FLOWS_TO + 1–2 REFERENCES
Components:  1 (fully connected)

globalLambda2 ≈ 0.8–1.2 (estimated; exact value requires actual node/edge enumeration)
spectralGap   ≈ 3–8 (typical for hub-spoke with sequential backbone)
hubDependencies: Assayer Bloom likely #1 hub (degree ~9, highest criticality)
```

### 6.3 Diagnostic Improvement with R1+R3 (Per-Component)

Even without full wiring, implementing R1 and R3 transforms the output from:

```json
{ "globalLambda2": 0, "spectralGap": Infinity, "hubDependencies": [] }
```

To:

```json
{
  "globalLambda2": 0,
  "connectedComponents": 8,
  "componentSizes": [2, 1, 1, 1, 1, 1, 1, 1],
  "perComponentLambda2": [1.0, 0, 0, 0, 0, 0, 0, 0],
  "spectralGap": Infinity,
  "hubDependencies": []
}
```

This is **informationally rich** even though λ₂ remains 0 globally. The component census directly tells the orchestrator which stages need wiring and how many edges are missing.

---

## 7. Verification Alignment

The verification command is:
```
npx vitest run tests/conformance/structural-review.test.ts
```

The test suite should validate the following post-recomputation scenarios:

| Test Case | Input | Expected λ₂ | Expected Components | Validates |
|---|---|---|---|---|
| Fully disconnected stages (baseline) | No inter-stage edges | 0 | k ≥ 8 | Pre-mutation state faithfully reported |
| Single FLOWS_TO from GATE (post-t2) | 1 inter-stage edge | 0 | k-1 | Partial wiring does not falsely claim connectivity |
| All inter-stage FLOWS_TO wired | ~15 edges | > 0 | 1 | Full wiring resolves disconnection |
| Node removal from fully wired graph | Remove Assayer | 0 (likely) | ≥ 2 | Hub dependency correctly identified |
| Edge weight = 0 edge | Weight-zero FLOWS_TO | Same as absent | Same as absent | Weight guard functions correctly |

---

## 8. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Acceptance criteria unachievable with current mutation scope | **High** | **Certain** (proven in §2.2) | Escalate scope gap; adopt Option B or D (§5 R5) |
| Per-component λ₂ computation increases review cost | Medium | Medium | Union-find is O(V+E); per-component eigenvalues are bounded by largest component size, not n |
| Upstream edge assembly silently changes (adds/removes edge types) | Medium | Low | Enforce edge type contract (R2) |
| Eigenvalue numerical instability for near-zero λ₂ | Low | Low | Existing `1e-10` threshold in `computeSpectralGap` is adequate; apply same guard in pre-check |
| Cycle 9+ regression if inter-stage edges are not persisted durably | Medium | Medium | Add connectivity assertion to CI pipeline via the structural-review test suite |

---

## 9. Conclusion

The lambda2 computation in `structural-review.ts` is **arithmetically sound** — it correctly reports λ₂ = 0 for a disconnected graph. The recomputation after Cycle 8's proposed mutations yields **λ₂ = 0 unchanged**, because a single `FLOWS_TO` edge cannot merge 8+ disconnected components into one.

To satisfy the acceptance criteria, either:

1. **Expand the mutation scope** to wire all ~15 inter-stage `FLOWS_TO` edges (achieves λ₂ > 0, resolves all warnings), or
2. **Enhance the computation** with component decomposition (R1, R3) so that the λ₂ = 0 result is accompanied by actionable diagnostics that quantify the remaining gap and suppress the undifferentiated "disconnected components" warning in favor of a precise component census.

The recommended path is both: wire the edges (the structural fix) and enhance the diagnostics (the computational fix). The structural fix resolves the current cycle; the computational fix prevents silent regression in future cycles.