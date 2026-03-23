# Update lambda2 computation

> Task ID: t3
> Model: claude-opus-4-6:adaptive:medium
> Duration: 61742ms
> Output chars: 6895
> Timestamp: 2026-03-23T18:01:16.301Z

> **⚠️ Hallucination flags (2):**
> - [content/warning] Task t3 references "npx vitest run tests/conformance/structural-review.test.ts" but this file was not in its context
> - [content/warning] Task t3 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Structural Analysis: Lambda2 Disconnected Components (t3)

## 1. Root Cause Identification

The pre-survey reports `lambda2=0`, which is mathematically precise: **a Fiedler eigenvalue of zero proves the graph has ≥2 connected components**. The advisory confirms the cause — "Stages have no inter-edges."

### Evidence in Code

`computeGlobalLambda2` operates on a flat `(edges, nodeIds)` pair with no awareness of bloom stage topology:

```
const { laplacian } = buildLaplacian(n, edges, nodeIndex);
return computeFiedlerEigenvalue(laplacian, n);
```

It faithfully computes λ₂ on whatever edge set it receives. If stages are self-contained subgraphs with no `FLOWS_TO` (or equivalent) edges bridging them, the Laplacian is block-diagonal, and the kernel has dimension equal to the number of components. λ₂ = 0 is the correct result — the problem is the **input**, not the arithmetic.

### Cascade Impact

The disconnected-graph state degrades all five diagnostics:

| Diagnostic | Degradation |
|---|---|
| D1: `globalLambda2` | Returns 0 — no connectivity signal |
| D2: `spectralGap` | Returns `Infinity` (guard at `lambda2 < 1e-10`) |
| D3: `hubDependencies` | Returns `[]` (early exit on `globalLambda2 <= 0`) |
| D4: `frictionDistribution` | Still computes but only within-component friction; cross-component friction is invisible |
| D5: `dampeningAssessment` | Degree-based, unaffected by connectivity — but recommendations are unsound if the graph is fragmented |

## 2. The Structural Gap

The `create_line` mutation ("Wire FLOWS_TO from architect_GATE") implies the system already models inter-stage relationships as `FLOWS_TO` edges. The gap is that `computeGlobalLambda2` and `runStructuralReview` have **no mechanism to ensure inter-stage edges are present in the input edge set**.

Two possibilities for why inter-stage edges are missing:

1. **Upstream omission**: The caller that assembles `edges[]` for the structural review filters or doesn't query `FLOWS_TO` edges between stages. The computation receives an incomplete graph.
2. **Lifecycle timing**: The Assayer Bloom Definition is being created (`create_bloom`) and the `FLOWS_TO` edge is being wired (`create_line`) in the same cycle, but the structural review may be running on a snapshot that predates the wiring.

The first is more likely given the advisory's framing as a systemic pattern ("Stages have no inter-edges" — plural, not "this stage").

## 3. Recommendations

### R1: Make `computeGlobalLambda2` stage-aware (Primary)

Extend the function signature to accept optional stage topology metadata:

- A `stages: Map<string, string[]>` parameter mapping stage IDs to their member node IDs
- When provided, the function should **detect missing inter-stage connectivity** by checking whether every pair of adjacent stages (per the bloom's declared flow order) has at least one edge bridging them
- If inter-stage edges are absent, the function should either:
  - **Inject synthetic bridge edges** with a declared weight (making the computation self-healing), or
  - **Return a richer result** that separates "per-component λ₂" from "global λ₂" so the advisory is actionable

I recommend the **richer result** approach. Silently injecting synthetic edges masks a real structural defect. The caller (or the bloom cycle orchestrator) should be the one deciding to wire the `FLOWS_TO` edge — as it's already doing with the `create_line` mutation.

### R2: Add a connectivity pre-check to `runStructuralReview`

Before computing eigenvalues, run a lightweight union-find or BFS on the edge set to count connected components. This is O(V + E) versus the O(V³) eigenvalue computation. If components > 1:

- Report which components are disconnected (map back to stage IDs if stage metadata is available)
- Still compute per-component λ₂ values so the review is informative rather than vacuously zero
- Emit a structured diagnostic (not just a console warning) that the bloom cycle orchestrator can act on

### R3: Ensure `FLOWS_TO` edges are included in the review's edge set (Upstream fix)

The `runStructuralReview` contract says it takes `edges: GraphEdge[]`. Whoever calls it must include **all** edge types that constitute the bloom's connectivity — including `FLOWS_TO` inter-stage edges. Verify the query/assembly logic upstream. This is the actual fix that resolves the acceptance criteria; R1 and R2 make the system robust against future regressions.

### R4: Update `StructuralReviewResult` to surface component information

Add a field:

- `connectedComponents: number` — how many components the graph has
- `componentSizes: number[]` — sizes of each component (sorted descending)
- `perComponentLambda2: number[]` — λ₂ within each component

This turns the "disconnected components warning" from a boolean alarm into a quantitative diagnostic.

### R5: Guard `computeSpectralGap` and `computeHubDependencies` against the disconnected case

`computeSpectralGap` already returns `Infinity` for disconnected graphs, which is correct but opaque. `computeHubDependencies` returns `[]`, losing information. Both should propagate the component-count diagnostic so their results are interpretable.

## 4. Verification Alignment

The acceptance criteria state:
1. **"Lambda2 computation includes inter-stage edges"** — satisfied by R3 (ensuring FLOWS_TO edges are in the input) combined with R1 (making the computation stage-aware as a defense).
2. **"No disconnected components warnings in survey"** — satisfied when inter-stage edges are present, verified by R2's pre-check returning `connectedComponents === 1`.

The verification command (`npx vitest run tests/conformance/structural-review.test.ts`) should include test cases for:
- A multi-stage bloom with no inter-stage edges → expects `lambda2 === 0`, `connectedComponents > 1`
- The same bloom after wiring `FLOWS_TO` → expects `lambda2 > 0`, `connectedComponents === 1`
- A single-stage bloom → baseline behavior unchanged

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Synthetic edge injection masks real defects | High | Use R1's "richer result" approach, not silent injection |
| Upstream callers forget to include `FLOWS_TO` edges | Medium | R2's connectivity pre-check catches this at review time |
| Eigenvalue computation cost with added edges | Low | Inter-stage edges are O(stages), negligible vs. existing O(V³) |
| `psiH=0.6` may shift when λ₂ becomes non-zero | Low-Medium | ψ_H depends on graph structure; re-run survey after fix to validate |

## 6. Summary

The λ₂=0 finding is correct math on an incomplete graph. The computation functions are sound but stage-blind. The primary fix is ensuring inter-stage `FLOWS_TO` edges reach the computation layer (R3). The robustness fixes (R1, R2, R4) ensure the system surfaces actionable diagnostics rather than vacuous zeros when connectivity gaps occur in future cycles.