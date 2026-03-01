# Rebuild dependency matrix

> Task ID: t5
> Model: claude-opus-4-6:adaptive:high
> Duration: 140080ms
> Output chars: 19307
> Timestamp: 2026-03-01T11:47:52.682Z

---

# Codex Signum Dependency Matrix v2.0

**Task:** t5 — Rebuild dependency matrix excluding Observer and Sentinel
**Date:** 2026-03-01
**Basis:** Codex Signum v3.0 spec, implementation plan v2.0, M-7B/M-8A consolidated findings

---

## 1. Rationale for Removal of Observer and Sentinel

Observer and Sentinel were external monitoring patterns that contradicted **Axiom 1 (Structural Encoding)**: system state must be encoded structurally in the graph, not inferred by external watchers. Their removal is not a loss of capability — it is an alignment correction. The functions they nominally performed are now distributed:

| Former Pattern | Former Responsibility | Structural Replacement |
|---|---|---|
| **Observer** | External state monitoring | Health dimensions (ΦL, ΨH, εR) computed from graph-resident data; afterPipeline hook writes computed state back to graph |
| **Sentinel** | Watchdog / violation detection | Constitutional evaluation (evaluateConstitution); OutputValidator pattern matching; Proposed jidoka/Andon-cord (FR-12–15) |

With these removed, the system contains **no external monitoring loop**. All awareness is derived from structural computation over graph state — consistent with the axiom foundation.

---

## 2. Component Inventory

Components are grouped into seven layers. Each component is assigned an ID for matrix cross-referencing.

### Layer 0: Axiom Foundation (implicit — constrains all layers)

Not a runtime component. The five axioms (Structural Encoding, Graph Authority, Computation Purity, Semantic Stability, Governance Completeness) are enforcement constraints, not dependencies in the runtime sense. They appear in the matrix only where a component **implements** an axiom.

### Layer 1: Core Computation

| ID | Component | Purpose | Axiom Basis |
|---|---|---|---|
| **A1** | Signal Conditioning | Debounce, Hampel, EWMA, CUSUM, MACD, hysteresis, trend regression | Ax-3 (Computation Purity) |
| **A2** | ΦL — System Vitality | Composite health: task completion (0.35), quality (0.30), cost efficiency (0.20), correction efficiency (0.15) | Ax-1 (Structural Encoding) |
| **A3** | ΨH — Harmonic Resonance | Spectral: λ₂ algebraic connectivity from graph Laplacian. Temporal: total variation over sliding window | Ax-1, Ax-2 (Graph Authority) |
| **A4** | εR — Exploration Rate | Ratio of exploratory to total decisions over observation window | Ax-1 |
| **A5** | Dampening | Cascade prevention: CASCADE_LIMIT=2, HYSTERESIS=2.5× | Ax-5 (Governance Completeness) |
| **A6** | Maturity | Shannon entropy over system state distribution | Ax-1 |

### Layer 2: Governance

| ID | Component | Purpose | Axiom Basis |
|---|---|---|---|
| **B1** | Constitutional Evaluation | Rule evaluation against axiom constraints | Ax-5 |
| **B2** | Degradation Propagation | Cascade propagation through pattern dependency graph | Ax-2, Ax-5 |
| **B3** | Thompson Routing | Bayesian posterior model selection with exploration/exploitation balance | Ax-3 |

### Layer 3: Infrastructure

| ID | Component | Purpose | Axiom Basis |
|---|---|---|---|
| **C1** | Neo4j Persistence | Graph store: Agent, Decision, Execution, Observation, PipelineRun, ConstitutionalRule nodes | Ax-2 |
| **C2** | Model Registry | Single source of truth for model capabilities, cost tiers, context windows | Ax-4 (Semantic Stability) |
| **C3** | Circuit Breaker | Provider-level: CLOSED → OPEN (3 failures) → HALF_OPEN (5min) → CLOSED | Ax-5 |
| **C4** | Error Classification | Taxonomy: INFRASTRUCTURE_ERROR vs QUALITY_FAILURE vs UNKNOWN | Ax-3 |

### Layer 4: Pipeline Mechanics

| ID | Component | Purpose | Axiom Basis |
|---|---|---|---|
| **D1** | Pipeline Stage Engine | Orchestrates stage progression (SCOPE → EXECUTE → REVIEW → VALIDATE) | Ax-1 |
| **D2** | Correction Helix | Re-entry loop on quality failure; bounded by governance | Ax-5 |
| **D3** | OutputValidator | 9-pattern hallucination detection (pure function, no LLM) | Ax-3 |
| **D4** | HallucinationCollector | Aggregation across stages; writes Observation nodes | Ax-2 |
| **D5** | afterStage Hook | Per-stage persistence and hallucination collection trigger | Ax-2 |
| **D6** | afterPipeline Hook | Computes ΦL/ΨH/εR → writes to Neo4j | Ax-1, Ax-2 |

### Layer 5: Patterns

| ID | Component | Purpose | Axiom Basis |
|---|---|---|---|
| **E1** | DevAgent | Full pipeline pattern: SCOPE → EXECUTE → REVIEW → VALIDATE with correction helix | All axioms |
| **E2** | Architect (SURVEY) | Filesystem analysis, gap detection, duplication ID. Pure function, no LLM, deterministic | Ax-3 |
| **E3** | Retrospective | (Planned) Historical run analysis, improvement extraction | Ax-1, Ax-2 |
| **E4** | Research | (Planned) Multi-model knowledge synthesis | Ax-3 |

### Layer 6: Integration

| ID | Component | Purpose | Axiom Basis |
|---|---|---|---|
| **F1** | CodexBridge | Single integration point from consumer into core | Ax-4 |

### Layer 7: Proposed Refactor Components

| ID | Component | Functional Requirement | Axiom Basis |
|---|---|---|---|
| **G1** | Pre-flight Auth Validation | FR-9 | Ax-5 |
| **G2** | File Context Injection (DISPATCH) | FR-10 | Ax-3 |
| **G3** | Directory Metadata (DECOMPOSE) | FR-11 | Ax-1 |
| **G4** | Jidoka / Andon-cord Detection | FR-12–15 | Ax-5 |
| **G5** | Graph Node Pipeline Output | Pipeline output as graph nodes | Ax-2 |
| **G6** | Multi-dimensional Thompson Learning | Thompson sampling across quality/cost/latency dimensions | Ax-3 |

---

## 3. Dependency Matrix

**Reading convention:** Row **depends on** Column. An `●` indicates a runtime dependency. A `◐` indicates a data-flow dependency (the row consumes output of the column but does not import it directly). An `○` indicates an optional/planned dependency.

### 3.1 Core Computation × Infrastructure

| | C1 Neo4j | C2 Model Registry | C3 Circuit Breaker | C4 Error Classification |
|---|:---:|:---:|:---:|:---:|
| **A1** Signal Conditioning | | | | |
| **A2** ΦL | ◐ | | | |
| **A3** ΨH | ● | | | |
| **A4** εR | ◐ | | | |
| **A5** Dampening | | | | |
| **A6** Maturity | ◐ | | | |

**Notes:**
- A1 is pure computation — zero dependencies. This is the foundation everything else conditions through.
- A2 (ΦL) has a data-flow dependency on Neo4j: it reads task completion, quality, cost, and correction data from graph-resident Execution and PipelineRun nodes.
- A3 (ΨH) has a hard runtime dependency on Neo4j: the graph Laplacian is computed from the live graph topology. Without Neo4j, ΨH is undefined.
- A5 (Dampening) depends only on A2/A3/A4 outputs (see next sub-matrix), not infrastructure directly.

### 3.2 Core Computation Internal Dependencies

| | A1 Signal Cond. | A2 ΦL | A3 ΨH | A4 εR | A5 Dampening | A6 Maturity |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **A1** Signal Conditioning | | | | | | |
| **A2** ΦL | ● | | | | | |
| **A3** ΨH | ● | | | | | |
| **A4** εR | ● | | | | | |
| **A5** Dampening | | ● | ● | ● | | |
| **A6** Maturity | | ● | ● | ● | | |

**Notes:**
- Signal Conditioning (A1) is the lowest-level dependency in the computation stack. All health dimensions pass through it.
- Dampening (A5) and Maturity (A6) are second-order computations over the three primary health dimensions.
- No circular dependencies in this layer. DAG is: A1 → {A2, A3, A4} → {A5, A6}.

### 3.3 Governance Dependencies

| | A2 ΦL | A3 ΨH | A4 εR | A5 Damp. | A6 Mat. | B1 Const. | B2 Degrad. | B3 Thompson | C1 Neo4j | C2 Registry | C3 Breaker | C4 ErrClass |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **B1** Constitutional Eval | ● | ● | ● | ● | ● | | | | ● | | | |
| **B2** Degradation Prop. | | | | | | ● | | | ● | | | |
| **B3** Thompson Routing | | | | | | | | | ● | ● | ● | ◐ |

**Notes:**
- B1 (Constitutional Evaluation) is the most heavily-connected governance component. It evaluates all five health dimensions against constitutional rules stored in Neo4j.
- B2 (Degradation Propagation) depends on B1 for violation detection, then walks the graph (C1) to propagate cascade effects. This is the critical path for Axiom 5 enforcement.
- B3 (Thompson Routing) depends on C3 (Circuit Breaker) to filter candidates before sampling. Error Classification (C4) determines whether to update posteriors — data-flow dependency, not import.

### 3.4 Pipeline Mechanics Dependencies

| | B1 Const. | B3 Thompson | C1 Neo4j | C2 Registry | C4 ErrClass | D1 Stage | D2 Helix | D3 Validator | D4 HalCollect | D5 afterStage | D6 afterPipeline |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **D1** Pipeline Stage Engine | | ● | ● | ● | ● | | | | | | |
| **D2** Correction Helix | ● | | | | | ● | | ● | | | |
| **D3** OutputValidator | | | | | | | | | | | |
| **D4** HallucinationCollector | | | ● | | | | | ● | | | |
| **D5** afterStage Hook | | | ● | | | | | | ● | | |
| **D6** afterPipeline Hook | | | ● | | | | | | | | |

**Notes:**
- D3 (OutputValidator) has **zero dependencies**. It is a pure function with 9 detection patterns. This is correct and must remain so — it is the primary Axiom 3 exemplar in the pipeline layer.
- D2 (Correction Helix) depends on D3 for quality signal and B1 for governance bounds on re-entry.
- D6 (afterPipeline) depends only on Neo4j (C1) as a write target; it internally invokes A2/A3/A4 computations, but those are function calls, not coupling dependencies.

### 3.5 Pattern Dependencies

| | B1 Const. | B2 Degrad. | B3 Thompson | C1 Neo4j | C2 Registry | D1 Stage | D2 Helix | D3 Validator | D5 afterStage | D6 afterPipeline |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **E1** DevAgent | ● | ● | ● | ● | ● | ● | ● | ◐ | ● | ● |
| **E2** Architect (SURVEY) | | | | ○ | | | | | | |
| **E3** Retrospective | ○ | | | ○ | | | | | | ○ |
| **E4** Research | | | ○ | ○ | ○ | ○ | | | | |

**Notes:**
- E1 (DevAgent) is the highest-fanout component in the system. It touches nearly everything. This is expected — it is the primary execution pattern.
- E2 (Architect SURVEY) is nearly independent: pure filesystem analysis. The Neo4j dependency is optional (for output persistence). **This isolation is a feature** — SURVEY can run without any infrastructure.
- E3 and E4 are planned patterns; dependencies are projected.

### 3.6 Integration Dependencies

| | E1 DevAgent | E2 Architect | C1 Neo4j | C2 Registry |
|---|:---:|:---:|:---:|:---:|
| **F1** CodexBridge | ● | ● | ● | ● |

**Notes:**
- F1 is a facade. It aggregates pattern access for consumers. Its dependency set is the union of all pattern entry points.

### 3.7 Proposed Refactor Component Dependencies

| | B1 Const. | B3 Thompson | C1 Neo4j | C2 Registry | C4 ErrClass | D1 Stage | D3 Validator | E2 Architect |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **G1** Pre-flight Auth (FR-9) | | | | ● | ● | | | |
| **G2** File Context Inject (FR-10) | | | | | | ● | | |
| **G3** Dir Metadata (FR-11) | | | | | | | | ● |
| **G4** Jidoka/Andon (FR-12–15) | ● | | ● | | | ● | ● | |
| **G5** Graph Node Output | | | ● | | | ● | | |
| **G6** Multi-dim Thompson | | ● | ● | ● | | | | |

**Notes:**
- G1 (Pre-flight Auth) sits between Model Registry and Pipeline Stage Engine — it validates credentials before any model call. Dependency on Error Classification allows it to categorize auth failures correctly.
- G4 (Jidoka/Andon) is the structural replacement for Sentinel. It depends on Constitutional Evaluation (for violation rules), OutputValidator (for detection), Pipeline Stage Engine (for stop-the-line mechanics), and Neo4j (for persisting Andon events as graph nodes).
- G5 (Graph Node Output) converts pipeline output from ephemeral return values to graph-persisted nodes. This directly serves Axiom 2 (Graph Authority).
- G6 (Multi-dimensional Thompson) extends B3 from single-dimension (quality) to multi-dimensional (quality × cost × latency). It wraps B3 rather than replacing it.

---

## 4. Full DAG — Critical Path Analysis

```
Layer 0 (Foundation):     [Axioms] ─── constrain all ───────────────────────────────────
                                                                                         │
Layer 1 (Computation):    A1 ──→ A2 ──┐                                                 │
                           │     A3 ──┼──→ A5                                            │
                           │     A4 ──┤    A6                                            │
                           │          │                                                  │
Layer 2 (Governance):     │     B1 ◄──┘    B2 ◄── B1                                    │
                           │                B3                                            │
                           │                │                                             │
Layer 3 (Infrastructure): C1 ◄─────────────┼──── C2                                     │
                           │                │     C3 ◄── C4                               │
                           │                │     │                                       │
Layer 4 (Pipeline):       D1 ◄─── B3 ──────┘     │                                      │
                           │      D2 ◄── D1,B1,D3 │                                      │
                           │      D3 (independent) │                                      │
                           │      D4 ◄── D3,C1     │                                      │
                           │      D5 ◄── D4,C1     │                                      │
                           │      D6 ◄── C1        │                                      │
                           │                        │                                      │
Layer 5 (Patterns):       E1 ◄── D1,D2,B1,B2,B3,C1,C2,D5,D6                             │
                           E2 (near-independent)                                          │
                           │                                                              │
Layer 6 (Integration):   F1 ◄── E1,E2,C1,C2                                             │
                           │                                                              │
Layer 7 (Proposed):       G1..G6 ◄── various (see §3.7)                                  │
```

### Critical Path (longest dependency chain)

```
A1 → A2 → B1 → D2 → E1 → F1
 (6 hops from Signal Conditioning to consumer-facing CodexBridge)
```

This is acceptable. The critical path passes through pure computation (A1), structural health (A2), governance (B1), correction mechanics (D2), pattern execution (E1), and integration (F1). Every hop adds semantic value. No hop is ceremonial.

### Isolated Components (zero inbound dependencies from other layers)

| Component | Inbound Deps | Assessment |
|---|---|---|
| **A1** Signal Conditioning | 0 | Correct — foundational pure computation |
| **D3** OutputValidator | 0 | Correct — must remain pure per Axiom 3 |
| **E2** Architect SURVEY | 0 runtime | Correct — self-contained analysis |
| **C4** Error Classification | 0 | Correct — taxonomy is definitional, not derived |

These four components are the **stability anchors** of the system. They can be tested, validated, and deployed independently. Any refactoring that introduces dependencies into these components should be treated as a breaking architectural change requiring explicit governance review.

---

## 5. Impact of Observer/Sentinel Removal

### Dependencies That Were Severed

| Former Dependency | Resolution |
|---|---|
| DevAgent → Observer (state polling) | D6 (afterPipeline) computes state structurally and writes to graph |
| Sentinel → Health Dimensions (threshold monitoring) | B1 (Constitutional Evaluation) performs threshold checks as pure computation over graph data |
| Sentinel → Pipeline (halt mechanism) | G4 (Jidoka/Andon, proposed FR-12–15) provides structural stop-the-line |
| Observer → Neo4j (observation writes) | D5 (afterStage) and D6 (afterPipeline) write observations directly |
| CodexBridge → Observer (status queries) | F1 queries graph directly via health dimension computation |

### Gap Identified

**GAP-DM-01: No structural Andon-cord exists in current implementation.** Sentinel's halt capability has been removed but G4 (FR-12–15) is only proposed. Between removal and implementation, there is no mechanism to halt a pipeline run on detection of a governance violation mid-execution. The Correction Helix (D2) handles quality failures but not constitutional violations.

**Severity:** High
**Recommendation:** Prioritize FR-12–15 implementation. Until then, Constitutional Evaluation at stage boundaries (already wired in D2) provides partial coverage, but mid-stage violations are undetectable.

---

## 6. Dependency Health Assessment

| Metric | Value | Assessment |
|---|---|---|
| Total components | 24 (17 current + 1 integration + 6 proposed) |  |
| Total dependencies (current, excl. proposed) | 47 | Manageable |
| Max fan-out (outbound deps) | E1 DevAgent: 10 | Acceptable for primary execution pattern |
| Max fan-in (inbound deps) | C1 Neo4j: 12 | Expected for graph authority (Axiom 2) |
| Circular dependencies | 0 | Clean DAG confirmed |
| Orphan components | 0 | All components reachable from F1 |
| Stability anchors (0 inbound) | 4 (A1, C4, D3, E2) | Healthy — sufficient independent test points |
| Critical path length | 6 hops | Acceptable |

---

## 7. Comparison: Before vs. After Observer/Sentinel Removal

| Metric | With Observer+Sentinel | Without | Delta |
|---|---|---|---|
| Total components | 26 | 24 | −2 |
| Total dependencies | ~58 | 47 | −11 |
| Circular dependency risk | Medium (Observer ↔ Neo4j polling loop) | None | Eliminated |
| Axiom 1 compliance | Partial (Observer externalized state) | Full | ✓ |
| Axiom 3 compliance | Partial (Sentinel mixed IO with decisions) | Full | ✓ |
| Halt capability | Sentinel-provided | GAP (pending FR-12–15) | Temporary regression |

---

## 8. Recommendations

1. **Implement FR-12–15 (Jidoka/Andon) as first refactor priority.** The halt capability gap is the only functional regression from Observer/Sentinel removal.

2. **Preserve the four stability anchors (A1, C4, D3, E2) as zero-inbound-dependency components.** Any proposal to add dependencies into these components requires an explicit architectural decision record.

3. **Monitor C1 (Neo4j) fan-in.** At 12 inbound dependencies, Neo4j is the single highest-risk infrastructure component. This is architecturally correct (Axiom 2: Graph Authority), but operationally it means Neo4j unavailability cascades to 12 components. Circuit Breaker (C3) should be extended to cover Neo4j connectivity, not just model providers.

4. **E1 (DevAgent) fan-out of 10 is the refactoring target.** The proposed graph-node output (G5) and multi-dimensional Thompson (G6) will add 2 more dependencies. Consider whether DevAgent should be decomposed into a pipeline orchestrator (thin) and stage executors (pattern-specific), reducing any single component's fan-out.

5. **The dependency matrix should be persisted as a graph in Neo4j itself** — component nodes with DEPENDS_ON edges. This would make the dependency matrix subject to ΨH (Harmonic Resonance) computation, enabling the system to detect its own architectural degradation. This is the self-referential axiom review capability referenced in the intent.