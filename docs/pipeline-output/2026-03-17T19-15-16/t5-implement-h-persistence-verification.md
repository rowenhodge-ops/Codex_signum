# Implement ΨH persistence verification

> Task ID: t5
> Model: claude-opus-4-6:adaptive:low
> Duration: 79356ms
> Output chars: 13398
> Timestamp: 2026-03-17T19:20:06.336Z

---

# Analysis: ΨH Persistence Verification (t5)

## 1. Problem Statement

Task t5 requires adding a test case to `tests/pipeline/m22-vertical-wiring.test.ts` that verifies **ΨH (composition subgraph health) persistence** — specifically that:

1. A composition subgraph is correctly identified within the graph topology.
2. After pipeline execution, a ΨH value is computed for that subgraph and **persisted** to the appropriate node (or edge/annotation) in the graph.
3. The persisted ΨH value is **correct** given the known state of the constituent nodes within that subgraph.

This is distinct from ΦL computation (t4): ΦL concerns per-node health rolled up hierarchically, whereas ΨH concerns the **holistic health of a compositional subgraph** — a structurally delineated cluster of nodes that together form a logical composition unit.

## 2. Dependency Analysis

### 2.1 Upstream Dependencies

| Dependency | Status | Impact |
|---|---|---|
| **Test file existence** | NOT FOUND | File must be created. t3/t4 or a scaffolding step is expected to establish it. t5 appends to the shared suite. |
| **t3 — Signal Conditioning** | Output empty/minimal | ΨH depends on correctly conditioned signals flowing into the subgraph's nodes. |
| **t4 — ΦL Computation** | Detailed analysis produced (see prior output) | ΨH likely consumes per-node ΦL values as inputs. If ΦL is not yet verified as correct, ΨH assertions may fail for upstream reasons. The fixture must guarantee deterministic ΦL values. |
| **Pipeline execution fixture** | Unknown / shared | A `beforeAll` or `beforeEach` block must run the full M-22 pipeline (or at least through the ΨH persistence stage) before assertions execute. |
| **Graph persistence layer** | Unknown | The mechanism by which ΨH is written to the graph must be understood — is it a node property, a dedicated annotation node, a metadata field on a subgraph container node, or an edge attribute? |

### 2.2 Downstream Consumers

ΨH feeds into:
- **εR Aggregation (t6)** — aggregate risk/health metrics across multiple subgraphs.
- **Immune Response (t7)** — trigger defensive/remediation actions when ΨH degrades past a threshold.

The t5 test must only verify persistence correctness, not downstream consumption.

## 3. Key Findings

### 3.1 What Is a "Composition Subgraph"?

The acceptance criteria state: *"The test identifies a specific composition subgraph within the test data."*

A composition subgraph is a **logically bounded subset of nodes** in the graph that together represent a coherent compositional unit — e.g., a module, a service boundary, a deployment group, or a feature cluster. Key characteristics:

- It has an **identity** — a subgraph ID, a container/root node, or a label that demarcates membership.
- It has **member nodes** — the individual nodes whose states contribute to ΨH.
- It has a **persistence target** — the node or annotation where the computed ΨH value is written.

**Gap:** The specification references section is empty. Without a formal definition of how composition subgraphs are demarcated in the Codex Signum data model, the test author must discover this from:
1. The core library's subgraph identification logic.
2. Any existing test fixtures or seed data.
3. Schema definitions (if the graph has typed nodes/edges).

**Recommendation:** Inspect the core library for a subgraph registry, a `CompositionSubgraph` type, or any function that enumerates subgraphs. Document the discovery in test comments.

### 3.2 ΨH Computation Formula

ΨH is described as "composition subgraph health." Without specification references, the formula is unknown but is likely a function of the member nodes' states. Plausible formulations:

| Candidate Formula | Semantics |
|---|---|
| `ΨH = mean(ΦL_i) for i ∈ subgraph` | Simple average health of all member nodes. |
| `ΨH = min(ΦL_i)` | Weakest-link model — subgraph health is bounded by its sickest member. |
| `ΨH = Σ(wᵢ · ΦLᵢ) / Σ(wᵢ)` | Weighted average, where weights reflect node criticality within the composition. |
| `ΨH = f(ΦL_i, connectivity, structural_metrics)` | A richer function that also considers internal edge density, coupling, or signal flow integrity. |

**Critical distinction from ΦL aggregation:** ΦL aggregation (t4) follows the **hierarchical tree structure** (parent-child). ΨH operates on **subgraph membership**, which may cut across the hierarchy. A composition subgraph might include nodes from different branches of the tree, or only a subset of a branch's leaves. This is why ΨH is a separate pipeline stage and not merely a re-read of an intermediate ΦL value.

**Recommendation:** Reverse-engineer the ΨH computation from the core library source. The test must hand-calculate expected ΨH from known member-node states; without knowing the formula, no meaningful assertion can be written.

### 3.3 Persistence Semantics — The Core of t5

The word "persisted" in the acceptance criteria is the distinguishing concern of this task. Other tasks verify computation; t5 verifies that the **result is written to the graph** and can be **read back**. This implies:

1. **Write path:** The pipeline's ΨH stage must call a graph mutation (e.g., `setNodeProperty`, `annotate`, `upsert`) to store the value.
2. **Read path:** The test must query the graph after pipeline execution and retrieve the persisted value from the correct location.
3. **Location correctness:** The value must be on the **appropriate node** — likely a subgraph container node, a virtual/aggregate node, or the subgraph's designated root.

The test should therefore assert **two things**:
- **Existence:** The ΨH property/annotation exists on the expected node after pipeline execution (it wasn't silently dropped or written to the wrong node).
- **Correctness:** The persisted value matches the hand-calculated expected value.

Additionally, a **negative/boundary assertion** is valuable:
- Nodes that are *not* subgraph containers should *not* have ΨH values persisted on them (no leakage).

### 3.4 Fixture Design Requirements

Building on the hierarchy proposed in t4's analysis:

```
root
├── groupA (composition subgraph "alpha")
│   ├── leaf-1  (ΦL = known value)
│   └── leaf-2  (ΦL = known value)
└── groupB (composition subgraph "beta")
    └── leaf-3  (ΦL = known value)
```

For ΨH testing, the fixture must:

| Requirement | Rationale |
|---|---|
| **At least two composition subgraphs** | Verifies that ΨH is computed per-subgraph, not globally. |
| **Subgraphs with different member counts** | Tests aggregation with N>1 and N=1 members. |
| **Subgraph membership metadata** | Nodes must be tagged/associated with their subgraph (e.g., `compositionId: "alpha"`). |
| **Deterministic ΦL values for members** | So ΨH expected values can be hand-calculated. |
| **A container/root node per subgraph** | The persistence target where ΨH is expected to be written. |

If the hierarchy from t4 is reused, `groupA` and `groupB` may serve as natural subgraph containers. However, if composition subgraphs are defined independently of the tree hierarchy (e.g., via a separate registry or tagging system), the fixture must explicitly establish that mapping.

### 3.5 Assertion Strategy

| Assertion | Target | Method |
|---|---|---|
| ΨH exists on subgraph container node | `groupA` node (or equivalent) | `expect(node.ΨH).toBeDefined()` |
| ΨH value is numerically correct | `groupA` node | `expect(node.ΨH).toBeCloseTo(expectedΨH_alpha)` |
| ΨH exists on second subgraph | `groupB` node | `expect(node.ΨH).toBeDefined()` |
| ΨH for single-member subgraph equals member's contribution | `groupB` node | `expect(node.ΨH).toBeCloseTo(expectedΨH_beta)` |
| ΨH does NOT exist on leaf nodes | `leaf-1`, `leaf-2`, `leaf-3` | `expect(leaf.ΨH).toBeUndefined()` |
| ΨH values differ between subgraphs with different member states | `groupA` vs `groupB` | `expect(ΨH_alpha).not.toEqual(ΨH_beta)` (if member states differ) |

**Numerical tolerance:** As with ΦL, use `toBeCloseTo` or a tolerance-based matcher if floating-point arithmetic is involved.

### 3.6 Temporal/Ordering Consideration

The pipeline stage ordering from t4's analysis places ΨH persistence after ΦL computation:

```
Signal Input → Signal Conditioning → ΦL Computation → ΨH Persistence → εR Aggregation → Immune Response
```

The test should verify that ΨH values are **available after pipeline completion** but should not need to verify internal ordering (that's an implementation concern unless the spec mandates observable ordering guarantees). However, if the pipeline is lazy or event-driven, the test must ensure it awaits full pipeline settlement before querying.

**Recommendation:** If the pipeline returns a promise or has a completion signal, the test's `beforeAll`/`beforeEach` must `await` it. If it's synchronous, ensure the fixture calls through the full pipeline synchronously before assertions run.

### 3.7 Idempotency and Re-execution

A valuable supplementary assertion (if within scope): running the pipeline twice on the same data should produce the same persisted ΨH values. This guards against:
- Double-counting during aggregation.
- Stale values from a prior run contaminating the current one.
- Write-append rather than write-upsert semantics.

This may be deferred to a dedicated idempotency test, but it's worth noting as a risk.

## 4. Relationship to Prior Task Outputs

### 4.1 t4 (ΦL Computation) — Strong Coupling

t5 depends on ΦL values being correct and deterministic. The fixture must either:
- **Share the t4 fixture** and rely on ΦL being tested there, or
- **Independently set up ΦL values** (e.g., by injecting pre-computed ΦL into nodes before ΨH runs).

The first approach is preferable for integration testing (the pipeline runs end-to-end), but the second provides better isolation if ΦL computation has bugs.

**Recommendation for the shared fixture approach:** The test file should have a single `beforeAll` that runs the full pipeline. Individual `describe` blocks (one per stage) assert on their respective concerns. This is consistent with the "vertical wiring" intent — the test verifies the full vertical stack, not individual units.

### 4.2 t3 (Signal Conditioning) — Transitive Dependency

ΨH depends on ΦL, which depends on conditioned signals. If signal conditioning is broken, ΨH will be wrong, but the failure should surface in t3's assertions first. The test runner (vitest) will report all failures, so the developer can triage by looking at the earliest failing stage.

### 4.3 t8 (Finalization) — Consolidation Target

t8 is responsible for finalizing and documenting the full test suite. t5's output should be structured so that t8 can integrate it without conflicts. This means:
- Using a consistent `describe`/`it` naming convention.
- Not redefining shared fixtures.
- Exporting or clearly documenting expected values and their derivations.

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| **No spec for ΨH formula** | **High** | Extract from core library source; document formula as a comment in the test. |
| **Unknown persistence target (which node gets ΨH)** | **High** | Inspect graph schema and pipeline output; assert on the discovered location. |
| **Composition subgraph identification mechanism unknown** | **Medium** | Search core library for subgraph registration, tagging, or enumeration APIs. |
| **Shared fixture conflicts across tasks** | **Medium** | Coordinate fixture design; t8 reconciles. Use additive `describe` blocks rather than file-level redefinitions. |
| **ΨH stage not yet implemented in production code** | **Medium** | If the production code is incomplete, the test will fail. This is acceptable — the test documents the expected contract and drives implementation. |
| **Floating-point precision mismatches** | **Low** | Use `toBeCloseTo` with an explicit precision argument. |
| **Subgraph membership crosses hierarchy boundaries** | **Low** | Ensure fixture explicitly defines membership rather than assuming it mirrors the tree. |

## 6. Recommendations

1. **Discover the ΨH computation function** in the core library. Search for exports/modules matching patterns like `computePsiH`, `subgraphHealth`, `compositionHealth`, or `ΨH`. Document the formula.

2. **Discover the persistence mechanism.** Trace the pipeline stage that writes ΨH to understand the storage API and target node type. Search for graph mutation calls within the ΨH pipeline stage.

3. **Design the fixture to include explicit subgraph membership.** Do not rely on implicit derivation from hierarchy. Tag nodes with their composition subgraph ID and designate container nodes as persistence targets.

4. **Use a shared `beforeAll` pipeline execution** with per-stage `describe` blocks. This aligns with the "vertical wiring" paradigm and avoids redundant pipeline runs.

5. **Assert on both existence and correctness.** A missing ΨH property is a different failure mode than an incorrect ΨH value; the test should distinguish between them with separate, clearly labeled assertions.

6. **Include a negative assertion** confirming that non-container nodes do not have ΨH values, guarding against over-persistence.

7. **Hand-calculate and hard-code expected ΨH values** in the test, with a comment showing the derivation. Do not compute expected values using production code within the test (this creates tautological tests).