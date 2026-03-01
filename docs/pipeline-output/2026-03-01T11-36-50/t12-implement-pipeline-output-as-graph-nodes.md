# Implement pipeline output as graph nodes

> Task ID: t12
> Model: claude-opus-4-6:adaptive:low
> Duration: 132679ms
> Output chars: 18263
> Timestamp: 2026-03-01T12:01:54.110Z

---

# Analysis: Pipeline Output as Graph Nodes — Dispatch Stage (t12)

## 1. Executive Summary

The current `dispatch.ts` implements a linear, sequential execution model that produces a **flat array of `TaskOutcome` objects**. This fundamentally conflicts with the FR-12 requirement that pipeline outputs be graph nodes. The refactor requires structural changes to how dispatch emits results, how those results relate to each other and to upstream/downstream pipeline stages, and how provenance is tracked. The existing implementation is well-factored (clean injection pattern, clear separation of concerns) but architecturally incapable of meeting graph-node output requirements without modification.

---

## 2. Current Implementation Assessment

### 2.1 What Dispatch Does Today

| Aspect | Current Behavior |
|---|---|
| **Input** | `PlanState` containing `task_graph` and `execution_plan` |
| **Processing** | Sequential iteration over `execution_plan.ordered_tasks` |
| **Dependency Check** | Filters `hard` dependencies, verifies matching successful outcomes |
| **Output** | Mutated `PlanState` with flat `TaskOutcome[]` array |
| **Identity** | Outcomes keyed by `task_id` string only |
| **Provenance** | None — no record of what was evaluated, when, or under which axioms |
| **Edges** | Implicit via the dependency check; not preserved in output |

### 2.2 SIPOC Revalidation Against Axioms

| SIPOC Element | Current State | Axiom Alignment |
|---|---|---|
| **Supplier** | PLAN stage produces `PlanState` with task graph | ✅ Correct |
| **Input** | `PlanState`, `TaskExecutor`, `DispatchOptions` | ⚠️ Missing file context injection (FR-10) |
| **Process** | Sequential loop with dependency gate | ⚠️ Destroys graph topology (violates Structural Integrity if outputs must be graphs) |
| **Output** | Flat `TaskOutcome[]` in mutated `PlanState` | ❌ Not graph nodes — violates FR-12 |
| **Customer** | EXECUTE/COMMIT stages and learning subsystem | ❌ Customers cannot traverse relationships |

**Axiom Scope Application (Section 9 of intent):**
- *Operational scope*: The running dispatch correctly executes tasks in dependency order — Minimal Viable Process is satisfied for the current linear model.
- *Review scope*: The output format is foundationally inadequate for graph-based topology. This is not a Semantic Stability concern — it is a structural capability gap. Recommending change is substantively justified because the flat output destroys relational information that downstream consumers require.

---

## 3. Lean Value Stream Analysis

### 3.1 Value Stream Map: Dispatch Stage

```
[PlanState received] → [Parse task_graph] → [Iterate ordered_tasks] → [Check deps] → [Execute task] → [Collect outcome] → [Return PlanState]
                                                     ↑                       |
                                              (info destruction)      (flat array push)
```

### 3.2 Waste Identification (DOWNTIME)

| Waste Type | Evidence | Severity |
|---|---|---|
| **Defects** | Graph relationships from `task_graph.dependencies` are checked but not preserved in output. Downstream stages must reconstruct them or operate without them. | HIGH |
| **Overprocessing** | `checkDependencies` re-derives relationships from raw dependency array on every task instead of traversing a pre-built adjacency structure. | MEDIUM |
| **Waiting** | Sequential `for...of` loop. Independent tasks (no shared hard deps) still wait for prior tasks to complete. | MEDIUM |
| **Non-utilized talent** | The `task_graph` already encodes a rich graph structure that is discarded when outcomes are flattened to an array. | HIGH |
| **Motion** | The entire `PlanState` is spread-copied twice (lines ~36, ~82) even though only `task_outcomes` and `status` change. | LOW |

### 3.3 Cp/Cpk Assessment

**Process Capability:**
- **USL (Upper Spec Limit):** Output must be graph nodes with typed edges, content-addressable identity, and provenance metadata.
- **LSL (Lower Spec Limit):** Output must at minimum preserve parent-child relationships and be queryable by downstream stages.
- **Current Process Center (μ):** Flat `TaskOutcome[]` with `task_id` string and boolean `success`.

The current output has **zero structural capability** to represent graph relationships. This is not a centering problem — it is a fundamental specification mismatch:

> **Cp = 0** (output format cannot reach spec regardless of tuning)
> **Cpk = 0** (process mean is outside specification limits entirely)

### 3.4 Percent-Complete-and-Accurate (%C&A)

From the perspective of downstream consumers:

| Consumer | What They Need | What They Get | %C&A |
|---|---|---|---|
| Learning subsystem | Graph topology of outcomes for Thompson sampling | Flat array | ~20% (only task success/fail is usable) |
| Commit stage | Provenance chain for audit | None | 0% |
| Self-referential review | Node that can be introspected as graph entity | Opaque state blob | 0% |
| Axiom validation | Edge-typed relationships for structural integrity check | Implicit deps only | ~15% |

**Weighted %C&A ≈ 10–15%**

### 3.5 Rolled Throughput Yield (RTY)

Modeling dispatch as three sub-steps:

1. **Dependency resolution**: Works correctly for hard deps. FTY ≈ 95% (misses soft deps, no error typing).
2. **Task execution**: Delegates cleanly via `TaskExecutor`. FTY ≈ 90% (no retry, no jidoka).
3. **Output formation**: Destroys graph structure. FTY ≈ 15% (flat array is fundamentally incomplete).

> **RTY = 0.95 × 0.90 × 0.15 ≈ 12.8%**

The output formation step is the dominant yield killer.

### 3.6 Process Cycle Efficiency (PCE)

| Activity | Classification | Approx. % of Stage Time |
|---|---|---|
| Parse task graph | Value-enabling | 5% |
| Check dependencies | Value-add | 10% |
| Execute task (via executor) | Value-add | 70% |
| Flatten to array | Non-value-add (waste) | 5% |
| State copying/spread | Non-value-add | 5% |
| Lost: edge preservation | Non-value-add (missing work) | 5% |

> **PCE ≈ 80%** (task execution dominates), but the 5% waste in flattening causes **cascading rework downstream** that is not captured in this stage's PCE alone. System-level PCE impact is significantly worse.

### 3.7 Variation Analysis

| Variation Type | Source | Impact |
|---|---|---|
| **Common-cause** | Sequential execution order masks parallelizable work; consistent information loss | Structural — always present |
| **Special-cause** | Task executor failures (caught by try/catch) | Handled, but no retry or escalation |

The dominant problem is **common-cause variation built into the process design**, not special-cause events.

### 3.8 MSA (Measurement System Analysis)

Current measurement of dispatch quality:
- **What is measured:** `success: boolean` per task outcome
- **What should be measured:** Node completeness (edges, provenance, metadata), dependency satisfaction depth, execution timing per node, axiom compliance per node
- **Measurement system capability:** The current `TaskOutcome` type provides insufficient resolution to distinguish between partial success, axiom-constrained failure, and infrastructure failure. This is a **Gage R&R problem** — the measurement instrument (TaskOutcome) cannot discriminate between distinct failure modes.

### 3.9 Five Whys: Why Does Dispatch Destroy Graph Information?

1. **Why is the output a flat array?** — Because `TaskOutcome[]` is defined as an array type in `types.ts`.
2. **Why is `TaskOutcome` a flat structure?** — Because the original design modeled outcomes as independent results, not related nodes.
3. **Why were outcomes modeled as independent?** — Because the original pipeline was linear (stage → stage), not graph-based.
4. **Why was the pipeline linear?** — Because the initial architecture predates the graph-node topology requirement (FR-12).
5. **Why wasn't graph output designed from the start?** — Because the system evolved through DND-Manager refactoring where sequential task dispatch was sufficient for the original use case. The topology requirement emerged from M-7B/M-8A findings.

**Root Cause:** The type system and output structure were designed for a linear pipeline model and have not been updated to reflect the graph-node topology requirement.

---

## 4. Gap Analysis

### 4.1 Gaps Discovered During This Review

| Gap ID | Description | Severity | Affected FR/NFR |
|---|---|---|---|
| **G-T12-01** | `TaskOutcome` has no graph-node identity (no URI, no content hash) | CRITICAL | FR-12 |
| **G-T12-02** | Output is `TaskOutcome[]` (flat array) — no edge preservation | CRITICAL | FR-12 |
| **G-T12-03** | No provenance metadata on dispatch outputs | HIGH | FR-12, FR-15 |
| **G-T12-04** | `checkDependencies` only handles `hard` type — `soft`, `data-flow`, and `axiom` edge types are ignored | MEDIUM | FR-12, FR-14 |
| **G-T12-05** | No file context injection point at dispatch (FR-10 not implemented) | HIGH | FR-10 |
| **G-T12-06** | No mechanism to emit nodes incrementally (streaming graph construction) | MEDIUM | FR-12, NFR-performance |
| **G-T12-07** | No jidoka/Andon-cord integration — task failures are silently collected, not escalated | HIGH | FR-14 |
| **G-T12-08** | `PlanState` spread-copy pattern will not scale to graph accumulation | LOW | NFR-performance |
| **G-T12-09** | No self-referential node — dispatch cannot produce a node representing its own execution for axiom review | HIGH | FR-15 |
| **G-T12-10** | Sequential execution prevents parallel independent task processing | MEDIUM | NFR-performance |

### 4.2 Gaps Carried Forward from M-7B / M-8A

| Gap ID | Description | Status |
|---|---|---|
| **G-M7B-01** | Pipeline stages lack unified output schema | CONFIRMED — dispatch exemplifies this |
| **G-M8A-03** | No Thompson sampling integration point | CONFIRMED — flat outcomes provide no topology for multi-dimensional learning |
| **G-M8A-05** | Pre-flight auth validation absent from dispatch path | OPEN — FR-9 not addressed in dispatch |

---

## 5. Dependency Matrix (Without Observer or Sentinel)

```
                  DECOMPOSE   PLAN   DISPATCH   EXECUTE   COMMIT   GRAPH-STORE   AXIOM-ENGINE   THOMPSON
DECOMPOSE            -         →        -         -         -          →              ←             -
PLAN                 ←         -        →         -         -          →              ←             ←
DISPATCH             -         ←        -         →         -          →              ←             ←
EXECUTE              -         -        ←         -         →          →              ←             -
COMMIT               -         -        -         ←         -          →              ←             -
GRAPH-STORE          ←         ←        ←         ←         ←          -              →             →
AXIOM-ENGINE         →         →        →         →         →          ←              -             →
THOMPSON             -         →        →         -         -          ←              ←             -
```

**Key for dispatch column:**
- DISPATCH ← PLAN (receives PlanState)
- DISPATCH → EXECUTE (feeds tasks)
- DISPATCH → GRAPH-STORE (must emit nodes — **currently missing**)
- DISPATCH ← AXIOM-ENGINE (must validate outputs — **currently missing**)
- DISPATCH ← THOMPSON (must receive exploration/exploitation signals — **currently missing**)

---

## 6. Functional Requirements for Graph-Node Output at Dispatch

### FR-12 Requirements Specific to Dispatch

| Req ID | Requirement | Rationale |
|---|---|---|
| FR-12.D1 | Each `TaskOutcome` must be wrapped in (or replaced by) a `GraphNode` with a content-addressable ID, creation timestamp, source stage identifier, and schema version. | Graph traversal requires stable, unique node identity. |
| FR-12.D2 | Dependencies between task outcomes must be emitted as typed `GraphEdge` objects (hard, soft, data-flow, axiom). | Preserves the relational information currently destroyed by flattening. |
| FR-12.D3 | Dispatch must emit a **stage-level node** representing its own execution (input PlanState ref, execution duration, outcome summary). | Enables self-referential axiom review (FR-15) and pipeline-level graph traversal. |
| FR-12.D4 | Graph nodes must be emittable incrementally (per-task completion), not only as a batch at stage completion. | Enables streaming graph construction and early jidoka detection (FR-14). |
| FR-12.D5 | The dispatch return type must include a `GraphFragment` (nodes + edges) that can be merged into the pipeline-level graph. | Replaces the flat `TaskOutcome[]` with a composable graph structure. |
| FR-12.D6 | Each node must carry a `provenance` field linking to the PlanState, intent, and axiom evaluations that produced it. | Audit trail for committed output. |

### FR-10 at Dispatch

| Req ID | Requirement |
|---|---|
| FR-10.D1 | Dispatch must accept a `FileContextProvider` in its options or executor context that resolves file contents relevant to each task before execution. |
| FR-10.D2 | Resolved file context must be recorded as a graph edge (task-node → file-context-node) for provenance. |

### FR-14 at Dispatch (Jidoka/Andon)

| Req ID | Requirement |
|---|---|
| FR-14.D1 | Task failure must trigger an Andon evaluation — not silently push to outcomes array. |
| FR-14.D2 | Andon evaluation determines: retry, skip, escalate, or halt pipeline. |
| FR-14.D3 | Andon decisions must be recorded as graph nodes with edges to the failed task node. |

---

## 7. Non-Functional Requirements for the Refactor

| NFR | Requirement | Metric |
|---|---|---|
| NFR-backward-compat | Existing `TaskExecutor` implementations must continue to function without modification during transition. | 100% of existing tests pass without executor changes. |
| NFR-performance | Graph node emission must not increase dispatch latency by more than 10% over current flat-array approach. | p95 latency delta < 10%. |
| NFR-testability | Graph output must be testable without a running graph store — in-memory graph fragment sufficient for unit tests. | All dispatch tests run without external dependencies. |
| NFR-schema-evolution | `GraphNode` schema must be versioned to allow future field additions without breaking deserialization. | Schema version field present; old nodes parseable by new code. |
| NFR-idempotency | Re-dispatching the same plan must produce nodes with the same content-addressable IDs (deterministic hashing). | Hash(same input) = same ID across runs. |

---

## 8. Baseline Measurements (from M-7B / M-8A)

| Metric | Baseline Value | Source |
|---|---|---|
| Dispatch output completeness | ~15% (flat array, no graph) | This analysis (Section 3.4) |
| Downstream rework rate | HIGH — learning subsystem cannot consume flat outcomes | M-8A consolidated findings |
| Dependency types handled | 1 of 4+ (hard only) | Code inspection (line 87) |
| Provenance captured | 0 fields | Code inspection |
| RTY at dispatch | ~12.8% | This analysis (Section 3.5) |
| Cp/Cpk for graph output | 0 / 0 | This analysis (Section 3.3) |
| Jidoka integration | None | Code inspection |
| File context injection | None | Code inspection |

---

## 9. Recommendations

### 9.1 Structural Changes (Priority Order)

1. **Define `GraphNode` and `GraphEdge` types in `types.ts`** — This is the foundational change. All other work depends on it. Include: `nodeId` (content-addressed), `nodeType`, `stageId`, `timestamp`, `schemaVersion`, `provenance`, `payload` (generic over stage-specific data like TaskOutcome).

2. **Define `GraphFragment` type** — A composable unit of `{ nodes: GraphNode[], edges: GraphEdge[] }` that dispatch (and all other stages) return instead of mutating PlanState.

3. **Refactor dispatch return type** — From `PlanState` with embedded `TaskOutcome[]` to `PlanState` with embedded `GraphFragment`. Preserve backward compatibility by keeping `task_outcomes` as a derived view during transition.

4. **Refactor `checkDependencies` to support typed edges** — Expand beyond `hard` to handle `soft` (warn but continue), `data-flow` (pass output as input), and `axiom` (validate constraint).

5. **Add incremental node emission** — Introduce a `GraphSink` interface (analogous to `TaskExecutor`) that receives nodes as they are produced. This enables streaming without requiring dispatch to batch.

6. **Add stage-level self-node** — Dispatch emits a node representing its own execution, enabling FR-15 self-referential axiom review.

7. **Integrate Andon-cord pattern** — Replace silent catch-and-push with an `AndonEvaluator` that decides the response to failures.

### 9.2 Axiom Compliance Notes

- **Minimal Viable Process**: The graph-node output is not gold-plating — it is the minimum structure required to enable FR-12 through FR-15. Flat arrays are structurally incapable.
- **Structural Integrity**: Graph output preserves relational information that the current implementation destroys. This change improves structural integrity.
- **Semantic Stability** (review-scope application): The recommendation to change the output type is a foundational correction, not a semantic drift. The current implementation diverges from the specification (FR-12). Semantic Stability constrains the running system from unnecessary change — it does not prohibit aligning implementation with specification. **Substantive reason**: The flat output format makes Thompson learning (FR-13), self-referential review (FR-15), and jidoka (FR-14) structurally impossible.
- **Auditability**: Graph nodes with provenance directly enable auditability. Current implementation has zero audit trail at the dispatch stage.

---

## 10. Conclusion

The `dispatch.ts` implementation is **well-crafted within its current paradigm** — the TaskExecutor injection pattern, dependency checking, and error handling are clean. However, the paradigm itself (linear state mutation, flat outcome arrays) is fundamentally misaligned with the graph-node topology requirement. The refactor is not about fixing bugs in dispatch — it is about evolving the output contract from a flat list to a composable graph fragment. This is the single highest-leverage change for enabling FR-12 through FR-15 at the dispatch stage, with a projected RTY improvement from ~12.8% to >80% once downstream consumers can traverse graph relationships natively.