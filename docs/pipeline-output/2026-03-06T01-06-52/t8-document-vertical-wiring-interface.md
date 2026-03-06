# Document vertical wiring interface

> Task ID: t8
> Model: claude-opus-4-6:adaptive:medium
> Duration: 265185ms
> Output chars: 44282
> Timestamp: 2026-03-06T01:25:09.749Z

> **⚠️ Hallucination flags (12):**
> - [content/warning] Task t8 references "src/computation/index.ts" but this file was not in its context
> - [content/warning] Task t8 references "src/graph/index.ts" but this file was not in its context
> - [content/warning] Task t8 references "npx vitest run tests/graph/executor-graph-wiring.test.ts" but this file was not in its context
> - [content/warning] Task t8 references "scripts/bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t8 references "src/graph/" but this file was not in its context
> - [content/warning] Task t8 references "src/computation/" but this file was not in its context
> - [content/warning] Task t8 references "conditioning.ts" but this file was not in its context
> - [content/warning] Task t8 references "src/computation/dampening.ts" but this file was not in its context
> - [content/warning] Task t8 references "src/computation/psi-h.ts" but this file was not in its context
> - [content/warning] Task t8 references "src/patterns/thompson-router/" but this file was not in its context
> - [content/warning] Task t8 references "tests/graph/executor-graph-wiring.test.ts" but this file was not in its context
> - [content/warning] Task t8 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Vertical Wiring Interface Analysis — Engineering Bridge v2.1 (Task t8)

**Task:** t8 — Document vertical wiring interface between pipeline observations and state dimension computation
**Specification references:** `src/computation/index.ts`, `src/graph/index.ts`
**Verification:** `npx vitest run tests/graph/executor-graph-wiring.test.ts`
**Date:** 2025-07-17

---

## 1. Purpose and Scope

The Codex Signum architecture computes three state dimensions (ΦL, ΨH, εR) from pipeline observations flowing through a series of transformations. Between raw observation and final state value, data crosses **seven interface boundaries**. Each boundary is a potential site of:

- **Data loss** — producer emits information the consumer doesn't receive
- **Semantic drift** — producer and consumer interpret the same value differently
- **Missing glue** — no code connects producer output to consumer input; the wiring is conceptual but not implemented
- **Impedance mismatch** — data shape, timing, or coordinate system differs between sides

This analysis specifies each interface point, identifies what is implemented, what is missing, and what milestone is responsible for closing the gap. The output feeds directly into §6 of the Engineering Bridge v2.1 document.

### 1.1 Methodology

Each interface point was analyzed by:

1. Identifying the **producer side** — the module, function, or computation step that generates data for the boundary
2. Identifying the **consumer side** — the module, function, or computation step that expects data from the boundary
3. Cross-referencing against v2.0 Bridge documentation (Parts 2–4) for the conceptual contract
4. Cross-referencing against prior task outputs (t1, t3, t4, t5, t13) for implementation findings
5. Inferring code structure from the specification references (`src/computation/index.ts`, `src/graph/index.ts`) and corroborating references in task outputs
6. Flagging where direct code reading was not possible and marking inferences explicitly

### 1.2 Bridge View Principle Compliance

Per t3 analysis, every interface in this specification must satisfy the Bridge View Principle: data flowing across each boundary must be a pure function of grammar-defined morpheme states and axiom-defined parameters. Where an interface transmits data that cannot be traced to a morpheme or axiom, it is flagged as a compliance gap.

---

## 2. Architecture Overview — The Seven Interface Points

The seven interfaces form a directed dataflow graph. Observation is the sole external input; all other interfaces are internal transformations:

```
Raw Events
    │
    ▼
┌─────────────────┐
│  1. Observation  │──────────────────────────────┐
│     → Conditioning                              │
└────────┬────────┘                               │
         │ conditioned signal                     │
         ▼                                        │
┌─────────────────┐                               │
│  2. Conditioning │                               │
│     → PhiL       │                               │
└────────┬────────┘                               │
         │ ΦL_raw                                  │
         ▼                                        │
┌─────────────────┐                               │
│  3. PhiL         │                               │
│     → Maturity   │                               │
└────────┬────────┘                               │
         │ ΦL_effective                            │
         ▼                                        │
┌─────────────────┐    ┌─────────────────┐        │
│  4. Node         │    │  5. Graph        │        │
│     → Container  │    │     → PsiH       │        │
└────────┬────────┘    └────────┬────────┘        │
         │ dampened signal       │ Ψ_H             │
         └───────┬───────────────┘                 │
                 ▼                                 │
         ┌─────────────────┐                       │
         │  6. State        │◄─────────────────────┘
         │     → Events     │    (observation metadata)
         └────────┬────────┘
                  │ state-change events
                  ▼
         ┌─────────────────┐
         │  7. Recovery     │
         │     → Hysteresis │
         └─────────────────┘
```

Note: Interface 5 (Graph → PsiH) operates in parallel with Interface 4 (Node → Container), not sequentially after it. Both consume graph state; their outputs converge at the State → Events interface.

---

## 3. Interface-by-Interface Specification

### 3.1 Interface 1: Observation → Conditioning

**Conceptual contract (from v2.0 Part 4):** Raw health events from execution outcomes are transformed through a 7-stage signal conditioning pipeline before being used for any threshold or state computation.

#### Producer Side

| Attribute | Value |
|---|---|
| **Module** | Execution runtime / task executor |
| **Likely location** | `scripts/bootstrap-task-executor.ts` (confirmed in t5 analysis) and/or observation emitters in `src/graph/` |
| **Output type** | Raw observation record: `{ nodeId, timestamp, outcome: success|failure, latency?, confidence?, metadata }` |
| **Morpheme grounding** | Observation attaches to a Seed (•) or Bloom (○) node in the graph; outcome is a property of execution at a Resonator (Δ) |
| **Emission trigger** | Completion of an execution event (function call, pipeline stage, pattern invocation) |

**Evidence from t4 (Thompson router):** The Thompson router observes execution outcomes (success/failure) which must pass through the signal conditioning pipeline before updating posteriors. This confirms the observation event is the same data that feeds routing updates — a single producer serving multiple consumers.

**Evidence from t5 (hallucination detection):** The bootstrap task executor loads and checksums relevant source files at bootstrap time. The observation events it produces are grounded against this snapshot. Layer 1 (structural grounding) validates observations before they enter the pipeline.

#### Consumer Side

| Attribute | Value |
|---|---|
| **Module** | Signal conditioning pipeline |
| **Likely location** | `src/computation/` — either a dedicated `conditioning.ts` or integrated into the computation index |
| **Expected export** | A function accepting raw observations and returning conditioned signals |
| **Input contract** | Expects timestamped, node-identified observation records |
| **Pipeline stages** | 7 stages per v2.0 Part 4: Debounce → Hampel → EWMA → CUSUM → MACD → Hysteresis threshold → Trend regression |

#### Missing Glue

| Gap | Description | Severity |
|---|---|---|
| **G1.1 — Event schema contract** | No formal TypeScript interface or schema defining the observation event structure shared between producer and consumer. The executor emits events; the conditioning pipeline expects them; but the contract is implicit, not declared. | **High** — schema drift between producer and consumer is undetectable without a shared type. |
| **G1.2 — Async boundary** | The executor operates asynchronously (task completion is non-blocking). The conditioning pipeline must ingest observations as they arrive. Whether this is push-based (event emitter) or pull-based (polling a queue) is unspecified. | **Medium** — affects latency of state updates but not correctness if events are ordered. |
| **G1.3 — Hallucination detection integration** | Per t5, Layer 1 (structural grounding) should validate observations before they enter conditioning. The code path from hallucination detection to conditioning pipeline entry is not wired. | **Medium** — without this, ungrounded observations can enter the pipeline. |
| **G1.4 — Multi-source observation merge** | When a node receives observations from multiple sources (e.g., direct execution AND Thompson router feedback), the merge semantics are undefined. Are they interleaved by timestamp? Does source identity matter? | **Low** — relevant only for multi-agent execution scenarios. |

#### Implementing Milestone

| Milestone | Scope |
|---|---|
| **M-7 (Signal Conditioning)** | Core pipeline implementation — stages 1–7 |
| **M-9.VA (Verification)** | Validation that conditioning produces correct output from known input sequences |
| **M-10 (Integration)** | Wiring the executor's observation output to the conditioning pipeline's input — closes G1.1 and G1.2 |

---

### 3.2 Interface 2: Conditioning → PhiL (Φ_L)

**Conceptual contract (from v2.0 Part 2):** Conditioned signals are decomposed into four factors (axiom_compliance, provenance_clarity, usage_success_rate, temporal_stability) and weighted-summed to produce ΦL_raw.

#### Producer Side

| Attribute | Value |
|---|---|
| **Module** | Signal conditioning pipeline |
| **Likely location** | `src/computation/` — conditioning module output |
| **Output type** | Conditioned observation stream: `{ nodeId, timestamp, conditioned_value, stage_metadata: { ewma_state, cusum_state, macd_state } }` |
| **Morpheme grounding** | Conditioned values are derived from Seed/Bloom execution outcomes — they remain attached to the originating morpheme |

**Critical finding from t4:** The Thompson router's posterior updates and ΦL computation must consume the **same conditioned signal**. If they diverge (e.g., router uses raw observations while ΦL uses conditioned), the εR and ΦL dimensions will be inconsistent. This is a Bridge View Principle violation: two derived quantities from the same morpheme state should share the same input.

#### Consumer Side

| Attribute | Value |
|---|---|
| **Module** | ΦL computation |
| **Likely location** | `src/computation/index.ts` — exported as a ΦL calculator or similar |
| **Input contract** | Needs conditioned values decomposed or decomposable into the four ΦL factors |
| **Formula (corrected per t2)** | `ΦL = 0.4 × axiom_compliance + 0.2 × provenance_clarity + 0.2 × usage_success_rate + 0.2 × temporal_stability` where axiom_compliance is fraction of **9** axioms (not 10) |
| **Output** | `ΦL_raw ∈ [0.0, 1.0]` |

#### Missing Glue

| Gap | Description | Severity |
|---|---|---|
| **G2.1 — Factor decomposition** | The conditioning pipeline outputs a conditioned signal value. The ΦL formula requires four separate factors. **Who performs the decomposition?** Is there a factor-extraction layer between conditioning output and ΦL input? This is the most significant architectural ambiguity in the entire pipeline. | **Critical** — without this, ΦL cannot be computed from conditioned signals. |
| **G2.2 — Axiom compliance evaluator** | `axiom_compliance` requires evaluating 9 binary predicates against the node's structural state. This is a distinct computation from signal conditioning — it reads graph structure, not observation streams. The ΦL formula conflates two input sources (conditioned observations for factors 2–4; structural evaluation for factor 1) without specifying how they merge. | **High** — axiom compliance is structurally distinct from the other three factors. |
| **G2.3 — Temporal stability self-reference** | `temporal_stability` is defined as "consistency of ΦL over the observation window" (v2.0 Part 2). This creates a circular dependency: ΦL_raw depends on temporal_stability, which depends on historical ΦL_raw values. The bootstrap behavior (what temporal_stability equals when there is no ΦL history) is unspecified. | **Medium** — bootstrap can default to 0.0 or 1.0, but the choice affects maturity modifier behavior. |
| **G2.4 — Sliding window state ownership** | v2.0 specifies count-based ring buffers with subtract-on-evict. These buffers hold conditioned observations. **Where do these buffers live?** In the computation module? In the graph? The foundational principle ("State Is Structural — the graph is the single source of truth") suggests graph storage, but ring buffer performance may require in-memory structures with graph-backed persistence. | **Medium** — affects the "single source of truth" principle compliance. |

#### Implementing Milestone

| Milestone | Scope |
|---|---|
| **M-5 (ΦL Core)** | ΦL formula implementation with hardcoded or mock inputs |
| **M-7 (Signal Conditioning)** | Conditioned signal production |
| **M-10 (Integration)** | Factor decomposition wiring (closes G2.1), axiom evaluator integration (closes G2.2) |
| **M-11 (Bootstrap)** | Bootstrap behavior for temporal_stability (closes G2.3) |

---

### 3.3 Interface 3: PhiL → Maturity

**Conceptual contract (from v2.0 Part 2):** ΦL_raw is modulated by a maturity factor to produce ΦL_effective. The maturity factor ensures that new or poorly-connected nodes cannot achieve high effective health scores regardless of raw observation quality.

#### Producer Side

| Attribute | Value |
|---|---|
| **Module** | ΦL computation |
| **Likely location** | `src/computation/index.ts` |
| **Output type** | `ΦL_raw ∈ [0.0, 1.0]` for a specific node |
| **Co-requisite data** | Observation count and connection count for the node — needed by the maturity formula but not produced by the ΦL computation itself |

#### Consumer Side

| Attribute | Value |
|---|---|
| **Module** | Maturity modifier |
| **Likely location** | `src/computation/index.ts` or a dedicated maturity module |
| **Formula** | `ΦL_effective = ΦL_raw × maturity_factor` |
| **Maturity factor formula** | `maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))` |
| **Output** | `ΦL_effective ∈ [0.0, 1.0]` |

**Bridge View Principle audit (from t3 analysis):** The constants 0.05 and 0.5 in the maturity factor formula are identified as "magic numbers without axiom grounding." t3 asks: "Are they Axiom 3 (Maturity) parameters? If so, say so." The v2.1 Bridge must either ground these in a specific axiom or explicitly mark them as `[non-normative default]`.

#### Missing Glue

| Gap | Description | Severity |
|---|---|---|
| **G3.1 — Observation count source** | The maturity formula needs `observations` (count of observations for this node). This value is a property of the node's observation history — it must come from either the graph or the sliding window buffer. Neither the ΦL computation module nor the maturity module specifies which data store provides this count. | **Medium** — straightforward to wire, but currently implicit. |
| **G3.2 — Connection count source** | The maturity formula needs `connections` (count of active connections). This must come from the graph module (`src/graph/index.ts`). The computation module needs to query graph topology to compute maturity. **This is the first point where `src/computation/` must import from `src/graph/`** — the dependency direction matters for module boundaries. | **High** — this is a cross-module dependency that defines the computation-graph contract. |
| **G3.3 — Maturity index vs. maturity factor disambiguation** | v2.0 defines both a `maturity_factor` (per-node, used in ΦL_effective) and a `maturity_index` (ecosystem-wide, used for adaptive thresholds). These are different computations with confusingly similar names. The interface must specify which one feeds into ΦL_effective (answer: maturity_factor) and which feeds into threshold selection (answer: maturity_index). | **Low** — naming issue, not a wiring gap, but causes implementation errors. |
| **G3.4 — Thompson prior_strength coupling** | Per t4 analysis, the Thompson router's `prior_strength` should scale with maturity factor. This creates a consumer of maturity_factor output that is not the ΦL pipeline — it's the routing layer. The maturity computation must export its result to both ΦL_effective and the Thompson router. | **Medium** — additional consumer not reflected in the linear pipeline model. |

#### Implementing Milestone

| Milestone | Scope |
|---|---|
| **M-5 (ΦL Core)** | Maturity factor formula implementation |
| **M-6 (Graph Integration)** | Graph query for connection count (closes G3.2) |
| **M-10 (Integration)** | Observation count wiring (closes G3.1), Thompson coupling (closes G3.4) |

---

### 3.4 Interface 4: Node → Container

**Conceptual contract (from v2.0 Part 3):** When a node's ΦL_effective changes, the change propagates to its containing node (Bloom or Grid) via the topology-aware dampening formula. Propagation is limited to 2 levels.

#### Producer Side

| Attribute | Value |
|---|---|
| **Module** | Node state (any Seed, Bloom, or Grid that has computed ΦL_effective) |
| **Likely location** | `src/computation/index.ts` — ΦL computation output; `src/graph/index.ts` — node-container relationship |
| **Output type** | `{ nodeId, ΦL_effective, ΦL_delta (change magnitude), timestamp }` |
| **Morpheme grounding** | The node is a Seed (•) or Bloom (○); its container is a Bloom (○) or Grid (□). The containment relationship is a Line (→). |

#### Consumer Side

| Attribute | Value |
|---|---|
| **Module** | Cascade dampening / container recomputation |
| **Likely location** | `src/computation/dampening.ts` (confirmed reference in t1) |
| **Formula (corrected per t1, t13)** | `impact_at_container = ΦL_delta × component_weight × γ_effective(k)` where `γ_effective(k) = min(γ_base, s/k)`, `γ_base = 0.7`, `s = 0.8`, `k = degree of container node` |
| **Cascade limit** | 2 levels maximum. Non-negotiable per v2.0 Part 3. |
| **Algedonic bypass** | If `ΦL_effective < 0.1`, bypass dampening with `γ = 1.0` and `s = k` (per t13 corrected formulation). |

#### Missing Glue

| Gap | Description | Severity |
|---|---|---|
| **G4.1 — Container discovery** | Given a node ID, how does the dampening module find the container? This requires a graph traversal query: "find parent containment relationship." The query must be defined in `src/graph/index.ts` and consumed by `src/computation/dampening.ts`. | **High** — fundamental to cascade propagation. |
| **G4.2 — Degree calculation** | The dampening formula needs `k` (degree of the container node). Degree must be computed from the graph at propagation time, not cached, because graph topology can change between propagation events. | **Medium** — caching would be a performance optimization but introduces staleness risk. |
| **G4.3 — Component weight** | The formula includes `component_weight` — the relative importance of the failing component within its container. v2.0 does not define how component weights are assigned or computed. Is it `1/k` (equal weighting)? Is it derived from usage frequency? This is unspecified in both v2.0 and the task outputs. | **High** — without this, the impact formula cannot be computed. |
| **G4.4 — Cascade depth tracking** | The 2-level cascade limit requires knowing how many levels the current propagation has traversed. This is runtime state that must be threaded through the recursive propagation call. No specification exists for how this counter is initialized, incremented, or checked. | **Medium** — straightforward to implement but must be explicit. |
| **G4.5 — Algedonic bypass trigger** | Per t13, the algedonic bypass sets `γ_base = 1.0` AND `s = k`. The dampening function must accept these as overrideable parameters, not hardcoded constants. The trigger condition (`ΦL_effective < 0.1`) must be evaluated before calling the dampening function — meaning the ΦL_effective value must be available at the call site. | **Medium** — requires parameterized dampening function signature. |
| **G4.6 — Hub dampening branch removal** | Per t1 (§3.3) and t13 (§3.1), no separate hub dampening branch should exist in the code. The wiring specification must explicitly state: "the dampening module exports a single function with no branching on degree thresholds." Verification: the conformance test should assert absence of hub-specific code paths. | **Low** — correctness issue, not a wiring gap, but the interface specification must forbid it. |

#### Implementing Milestone

| Milestone | Scope |
|---|---|
| **M-3 (Dampening Core)** | `γ_effective(k)` formula implementation (may already exist per t1 audit) |
| **M-6 (Graph Integration)** | Container discovery query, degree computation (closes G4.1, G4.2) |
| **M-8 (Cascade Engine)** | Cascade depth tracking, 2-level limit enforcement, algedonic bypass (closes G4.4, G4.5) |
| **M-10 (Integration)** | Component weight definition (closes G4.3) |

---

### 3.5 Interface 5: Graph → PsiH (Ψ_H)

**Conceptual contract (from v2.0 Part 2):** ΨH is computed from the graph's structural properties (Fiedler value λ₂) and runtime operational properties (graph total variation TV_G). It requires the full graph topology, not just individual node states.

#### Producer Side

| Attribute | Value |
|---|---|
| **Module** | Graph module |
| **Likely location** | `src/graph/index.ts` — graph representation, adjacency/Laplacian matrix construction |
| **Output type** | Graph Laplacian matrix `L = D - A` for a composition subgraph; per-edge weights `a_ij`; per-node signal vectors for monitored signals |
| **Morpheme grounding** | The graph is a Grid (□). Nodes are Seeds (•) and Blooms (○). Edges are Lines (→). The Laplacian is a pure function of the Grid's structure. |

#### Consumer Side

| Attribute | Value |
|---|---|
| **Module** | ΨH computation |
| **Likely location** | `src/computation/psi-h.ts` (confirmed in intent and t12) |
| **Formula** | `ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)` |
| **Sub-computations** | λ₂ = second-smallest eigenvalue of graph Laplacian; `friction = mean([TV_G(x) / max_TV_G(x) for x in monitored_signals])` |
| **Output** | `ΨH ∈ [0.0, 1.0]` |

**Temporal decomposition note (from intent workstream 5):** The `src/computation/psi-h.ts` file contains a temporal decomposition of ΨH that v2.0 does not document. This interface specification covers the *input wiring*; the decomposition internals are documented separately in §4 of the v2.1 Bridge.

#### Missing Glue

| Gap | Description | Severity |
|---|---|---|
| **G5.1 — Laplacian matrix construction** | The graph module must export a function that constructs the Laplacian matrix `L = D - A` for a given composition subgraph. This is a linear algebra operation on graph structure. The graph module stores relationships; the computation module needs them as a matrix. **Who builds the matrix?** If the graph module exports adjacency lists and the computation module converts to a matrix, the conversion code is glue that must be specified. If the graph module exports a matrix directly, it takes on a linear algebra dependency. | **Critical** — ΨH cannot be computed without this. |
| **G5.2 — Composition boundary definition** | λ₂ is computed for a "composition subgraph" — but what defines the boundary of a composition? A Bloom (○) defines a boundary, but compositions can nest. The interface must specify: "given a Bloom ID, return the subgraph of all contained nodes and their interconnections." This is a graph query that the computation module must invoke. | **High** — without boundary definition, the eigenvalue is computed over the wrong subgraph. |
| **G5.3 — Signal vectors for TV_G** | Runtime friction (TV_G) requires per-node signal values for monitored signals (latency, confidence, success rate, ΦL). These signal values come from different sources: latency from observations, confidence from the model, success rate from the sliding window, ΦL from the computation module itself. **The TV_G computation must collect signals from multiple producers.** No single module provides all of them. | **High** — TV_G has a multi-source input problem. |
| **G5.4 — Normalization of λ₂** | v2.0 says "Normalise by dividing by the expected λ₂ for a composition of that size and maturity." The expected λ₂ is itself a function of composition size. Who computes the expected value? Is it a lookup table? An analytical formula (e.g., for Erdős-Rényi graphs, expected λ₂ ≈ n·p - 2·√(n·p·(1-p)))? This normalization function is unspecified. | **Medium** — affects ΨH scaling but not its structural validity. |
| **G5.5 — Eigenvalue computation dependency** | Computing λ₂ requires a linear algebra library. The `src/computation/psi-h.ts` module must import or depend on such a library. In a TypeScript/JavaScript context, this is non-trivial — options include ml-matrix, mathjs, or a custom implementation. The dependency and its performance characteristics must be specified. | **Medium** — technology choice, but affects build and performance. |

#### Implementing Milestone

| Milestone | Scope |
|---|---|
| **M-4 (ΨH Core)** | ΨH formula implementation, eigenvalue computation, TV_G calculation |
| **M-6 (Graph Integration)** | Laplacian construction, composition boundary queries (closes G5.1, G5.2) |
| **M-9 (Signal Aggregation)** | Multi-source signal collection for TV_G (closes G5.3) |
| **M-10 (Integration)** | Normalization reference values (closes G5.4) |

---

### 3.6 Interface 6: State → Events

**Conceptual contract (from v2.0 Part 1 and Part 8):** When any state dimension (ΦL, ΨH, εR) changes, or when a state transition occurs (healthy → degraded, degraded → healthy), the change must be expressed as an event visible to the system and its operators. This is the observability interface.

#### Producer Side

| Attribute | Value |
|---|---|
| **Module** | Computation modules (ΦL, ΨH, εR, dampening, maturity) |
| **Likely location** | `src/computation/index.ts` — aggregated state output |
| **Output type** | State change records: `{ nodeId, dimension (ΦL|ΨH|εR), previousValue, newValue, timestamp, trigger (observation|cascade|recovery) }` |
| **Morpheme grounding** | State changes are properties of the node (Seed, Bloom, Grid) whose dimensions changed. The event itself should be recorded as a relationship in the Grid (□). |

**Bridge View Principle requirement:** Per v2.0 Part 1: "When recording an execution outcome, write it to the graph, not to a separate log file." State change events must be graph-resident, not external.

**Anti-pattern from v2.0:** "Silent routing around failure. When a component fails and the router switches to an alternative, this must be a visible event." This applies directly to the Thompson router (t4) — route changes are state events.

#### Consumer Side

| Attribute | Value |
|---|---|
| **Module** | Multiple consumers |
| **Consumers** | (a) Graph storage — events written to the graph as structural changes; (b) Structural review triggers (v2.0 Part 8) — events evaluated against trigger conditions; (c) Visual encoding layer — events trigger display updates; (d) Thompson router — events update posteriors; (e) Hallucination detection Layer 2 (t5) — events checked for cross-reference consistency |
| **Likely location** | `src/graph/index.ts` for (a); various modules for (b)–(e) |

#### Missing Glue

| Gap | Description | Severity |
|---|---|---|
| **G6.1 — Event bus / dispatch mechanism** | State changes have **five identified consumers**. There is no specified event dispatch mechanism — no event bus, no pub/sub pattern, no observer registration. Each consumer must independently wire to the computation output, creating tight coupling and risk of missed events. | **Critical** — this is the most architecturally significant gap in the entire interface specification. Without an event dispatch mechanism, the system cannot maintain the "State Is Structural" principle across all consumers. |
| **G6.2 — Event schema** | The state change event structure is implicit. A formal TypeScript interface defining the event payload is required so all consumers parse the same data. | **High** — consumers will diverge without a shared contract. |
| **G6.3 — Graph write-back** | The foundational principle requires state changes to be written to the graph. But state changes are *computed* by the computation module. The computation module must call back into the graph module to persist changes. **This creates a bidirectional dependency between `src/computation/` and `src/graph/`** — computation reads from graph (for topology) and writes to graph (for state changes). The dependency direction must be managed carefully (e.g., via dependency injection or an interface contract). | **High** — bidirectional module dependency is an architectural risk. |
| **G6.4 — Structural review trigger evaluation** | v2.0 Part 8 defines six trigger conditions (λ₂ drop, friction spike, cascade activation, εR spike, ΦL velocity anomaly, Ω gradient inversion). Each trigger must be evaluated against incoming state events. **Who evaluates the triggers?** Is this a separate module? Is it inline in the event dispatch? The code location and module boundary are unspecified. | **Medium** — triggers are defined but not wired to a specific evaluator. |
| **G6.5 — Thompson router event consumption** | Per t4, route selection events and posterior updates are state changes. But the Thompson router is also a *consumer* of state events (it needs to know when ΦL changes to update priors). This bidirectional relationship (router produces events AND consumes events) creates a potential feedback loop. The interface must specify ordering: ΦL update → event emitted → router consumes event → router updates prior → router emits its own event. | **Medium** — ordering constraint, not a missing component. |

#### Implementing Milestone

| Milestone | Scope |
|---|---|
| **M-6 (Graph Integration)** | Graph write-back for state changes (closes G6.3) |
| **M-9 (Signal Aggregation)** | Event dispatch mechanism design (closes G6.1) |
| **M-9.VA (Verification)** | Event schema validation, trigger evaluation tests (closes G6.2, G6.4) |
| **M-10 (Integration)** | Full event bus wiring, Thompson router event loop (closes G6.5) |

---

### 3.7 Interface 7: Recovery → Hysteresis

**Conceptual contract (from v2.0 Part 3):** Recovery from degradation is deliberately slower than degradation (2.5× ratio). The recovery model includes linear delay with cap, exponential backoff with jitter for retry timing, and half-open state for recovery validation.

#### Producer Side

| Attribute | Value |
|---|---|
| **Module** | Recovery detector — the component that detects sustained improvement |
| **Likely location** | `src/computation/index.ts` or a dedicated recovery module |
| **Output type** | Recovery signal: `{ nodeId, consecutive_improvement_count, current_ΦL, trend_direction, timestamp }` |
| **Detection mechanism** | N consecutive observations beyond recovery threshold (recommended N = 3–5 per v2.0) |
| **Morpheme grounding** | Recovery is a temporal property of a Seed or Bloom's observation history — a Helix (🌀) morpheme representing the feedback cycle |

#### Consumer Side

| Attribute | Value |
|---|---|
| **Module** | Hysteresis state machine |
| **Likely location** | `src/computation/index.ts` or integrated into ΦL computation |
| **Formula (from v2.0)** | `degradation_threshold = 0.50`; `recovery_threshold = 0.50 × 2.5 = 0.75` (maturity-indexed equivalents apply) |
| **Recovery delay** | `recovery_delay = base_delay × (1 + 0.2 × failure_count)`, capped at `10 × base_delay` |
| **Retry timing** | `actual_delay = random(0, min(base × 1.5^attempt, 300_seconds))` — full jitter mandatory |
| **Half-open validation** | 5–10 trial probes before declaring recovery |

#### Missing Glue

| Gap | Description | Severity |
|---|---|---|
| **G7.1 — Hysteresis state storage** | The hysteresis mechanism requires persistent state: current degradation/recovery status, consecutive improvement count, failure history for recovery delay calculation. **Where is this state stored?** The foundational principle says the graph, but hysteresis state is transient computation state, not structural relationship data. This is a genuine tension. | **High** — storing hysteresis counters in the graph may violate "structural state" semantics; storing them outside violates "single source of truth." |
| **G7.2 — Failure count window** | `failure_count` in the recovery delay formula refers to "the number of degradation events for this component in the current observation window." The observation window is topology-dependent (10–100 events per v2.0 sliding window table). The recovery module must access the same sliding window used by ΦL computation. **Is this a shared data structure or a separate query?** | **Medium** — must share the sliding window, not duplicate it. |
| **G7.3 — Half-open probe routing** | The half-open recovery state requires 5–10 trial probes. **Who generates these probes?** In a circuit breaker pattern, the breaker itself lets through a controlled number of requests. In the Codex architecture, this means the routing layer (Thompson router) must be aware of the half-open state and route a limited number of requests to the recovering component. **This creates a dependency from the recovery module to the routing layer.** | **High** — the recovery mechanism needs to influence routing decisions, but routing is in `src/patterns/thompson-router/` while recovery is in `src/computation/`. |
| **G7.4 — Maturity-indexed threshold selection** | Recovery and degradation thresholds are maturity-indexed (v2.0 Part 2 adaptive thresholds table). The hysteresis module must consume the maturity index to select appropriate thresholds. This requires wiring to the ecosystem-wide maturity index computation, not just the per-node maturity factor. | **Medium** — maturity index is a different computation from maturity factor (see G3.3). |
| **G7.5 — Jitter source** | Full jitter in the retry timing formula requires a random number generator. For reproducibility in testing, this must be injectable (seeded RNG). The recovery module must accept a randomness source. | **Low** — standard dependency injection practice. |
| **G7.6 — Recovery event emission** | When a node transitions from degraded to healthy (or from half-open to fully recovered), this is a state change event that must flow through Interface 6 (State → Events). The recovery module must emit events into the same dispatch mechanism used by all other state changes. | **Medium** — dependent on G6.1 (event bus) being implemented. |

#### Implementing Milestone

| Milestone | Scope |
|---|---|
| **M-5 (ΦL Core)** | Hysteresis threshold parameters, debounce count |
| **M-8 (Cascade Engine)** | Recovery delay formula, failure count tracking |
| **M-10 (Integration)** | Half-open probe routing (closes G7.3), maturity index wiring (closes G7.4), event emission (closes G7.6) |
| **M-11 (Bootstrap)** | Hysteresis state storage decision (closes G7.1) |

---

## 4. Cross-Cutting Findings

### 4.1 Critical Glue Gaps — Priority Order

Across all 7 interfaces, the following gaps are assessed as **Critical** or **High** severity:

| Priority | Gap ID | Interface | Description | Blocking |
|---|---|---|---|---|
| 1 | **G6.1** | State → Events | No event dispatch mechanism | All consumers of state changes |
| 2 | **G2.1** | Conditioning → ΦL | Factor decomposition undefined | ΦL computation |
| 3 | **G5.1** | Graph → ΨH | Laplacian matrix construction | ΨH computation |
| 4 | **G4.1** | Node → Container | Container discovery query | Cascade propagation |
| 5 | **G1.1** | Observation → Conditioning | Event schema contract | All downstream processing |
| 6 | **G6.3** | State → Events | Bidirectional graph dependency | Architectural integrity |
| 7 | **G4.3** | Node → Container | Component weight undefined | Impact formula |
| 8 | **G5.2** | Graph → ΨH | Composition boundary definition | ΨH subgraph selection |
| 9 | **G5.3** | Graph → ΨH | Multi-source signal collection for TV_G | Runtime friction computation |
| 10 | **G3.2** | PhiL → Maturity | Connection count cross-module query | Maturity factor computation |
| 11 | **G6.2** | State → Events | Event schema definition | Consumer interoperability |
| 12 | **G7.1** | Recovery → Hysteresis | Hysteresis state storage location | Recovery state management |
| 13 | **G7.3** | Recovery → Hysteresis | Half-open probe routing | Recovery validation |
| 14 | **G2.2** | Conditioning → ΦL | Axiom compliance evaluator | ΦL factor 1 |

### 4.2 Bidirectional Dependency Pattern

Three interfaces reveal **bidirectional dependencies** between `src/computation/` and `src/graph/`:

| Direction | Interface | Purpose |
|---|---|---|
| graph → computation | Interface 5 (Graph → ΨH) | Graph provides topology for ΨH |
| graph → computation | Interface 3 (PhiL → Maturity) | Graph provides connection count for maturity |
| computation → graph | Interface 6 (State → Events) | Computation writes state changes to graph |

This bidirectional flow must be managed with either:
- **Dependency inversion** — define interfaces in a shared contract module, implement in respective modules
- **Event-driven decoupling** — computation emits events; graph subscribes and persists
- **Service layer** — a thin orchestrator module that coordinates reads and writes between computation and graph

**Recommendation:** The event dispatch mechanism (G6.1) should serve double duty as the decoupling mechanism. Computation modules emit state change events; the graph module subscribes and persists them. For reads (computation querying graph topology), a read-only query interface exported by `src/graph/index.ts` avoids the reverse dependency.

### 4.3 The Factor Decomposition Problem (G2.1) Is Architecturally Foundational

The gap between conditioned signals and ΦL factors (G2.1) is not merely a wiring issue — it reveals an **architectural ambiguity** in the v2.0 specification. The signal conditioning pipeline (Part 4) operates on raw observations and produces a conditioned signal. The ΦL formula (Part 2) requires four distinct factors. These are two different data models:

- **Conditioned signal:** a scalar time series of filtered observation values per node
- **ΦL factors:** four named dimensions, each with distinct semantics and potentially distinct data sources

The factor decomposition layer must:
1. Accept conditioned observation values
2. Route them to the appropriate factor(s) — a success/failure observation feeds `usage_success_rate`; a latency observation might feed `temporal_stability`
3. Separately query graph structure for `axiom_compliance` (not derived from observations)
4. Query the provenance chain for `provenance_clarity` (partially graph-structural, partially metadata)
5. Combine all four factors using the weighted sum formula

This is a non-trivial integration layer that v2.0 treats as implicit. The v2.1 Bridge must make it explicit.

### 4.4 Milestone Coverage Matrix

| Milestone | Interfaces Covered | Gaps Closed |
|---|---|---|
| **M-3** (Dampening Core) | Interface 4 (partial) | Dampening formula |
| **M-4** (ΨH Core) | Interface 5 (partial) | ΨH formula, eigenvalue, TV_G |
| **M-5** (ΦL Core) | Interfaces 2, 3, 7 (partial) | ΦL formula, maturity factor, hysteresis thresholds |
| **M-6** (Graph Integration) | Interfaces 3, 4, 5, 6 | G3.2, G4.1, G4.2, G5.1, G5.2, G6.3 |
| **M-7** (Signal Conditioning) | Interface 1, 2 (partial) | Conditioning pipeline, conditioned signal output |
| **M-8** (Cascade Engine) | Interfaces 4, 7 (partial) | G4.4, G4.5, recovery delay |
| **M-9** (Signal Aggregation) | Interfaces 5, 6 | G5.3, G6.1 |
| **M-9.VA** (Verification) | Interfaces 1, 6 | G6.2, G6.4, conformance testing |
| **M-10** (Integration) | ALL | G1.1, G1.2, G2.1, G2.2, G3.1, G3.4, G4.3, G5.4, G6.5, G7.3, G7.4, G7.6 |
| **M-11** (Bootstrap) | Interfaces 2, 7 | G2.3, G7.1 |

**Key observation:** M-10 (Integration) carries the heaviest load — 12 gaps across all interfaces. This is expected for an integration milestone, but it also means M-10 cannot begin until all prior milestones have delivered their partial implementations. M-6 (Graph Integration) is the critical path for most computational interfaces.

### 4.5 Thompson Router as Cross-Cutting Concern

The t4 analysis identified the Thompson router as touching three interfaces (1, 2, 6). This analysis extends the finding: the router also touches Interface 7 (Recovery → Hysteresis) through the half-open probe mechanism (G7.3). The Thompson router is therefore a **cross-cutting concern** that participates in four of the seven interfaces:

| Interface | Router's Role |
|---|---|
| 1. Observation → Conditioning | Observes outcomes; its observations must be conditioned before posterior update |
| 2. Conditioning → ΦL | Must consume same conditioned signal as ΦL computation |
| 6. State → Events | Emits route-change events; consumes ΦL-change events to update priors |
| 7. Recovery → Hysteresis | Must route controlled probes to half-open components |

This cross-cutting nature means the Thompson router cannot be cleanly isolated in `src/patterns/thompson-router/` — it needs import relationships or event subscriptions to computation and graph modules. The v2.1 Bridge must document this explicitly rather than treating the router as an isolated pattern.

---

## 5. Recommendations for v2.1 Bridge §6

### 5.1 Structural Recommendations

1. **Lead with the architecture diagram** (Section 2 of this analysis) so readers see the full dataflow before diving into individual interfaces.

2. **Use a consistent four-column table** for each interface: Producer | Consumer | Missing Glue | Milestone. Supplement with prose only where the table cannot capture essential context.

3. **Explicitly call out the three critical gaps** (G6.1 event dispatch, G2.1 factor decomposition, G5.1 Laplacian construction) as architectural decisions that must be resolved before integration milestone M-10 can proceed.

4. **Document the bidirectional dependency** between computation and graph modules as an architectural constraint, not a footnote.

5. **Cross-reference the Thompson router** in every interface it touches, with a note that it is documented in §7.1 (build experience) but has wiring implications documented here.

### 5.2 Bridge View Principle Compliance Notes

For the vertical wiring specification itself:

| Principle Requirement | Compliance Status |
|---|---|
| Every interface transmits morpheme-grounded data | ✅ All interfaces identified morpheme sources |
| No external state dependencies | ⚠️ G7.5 (jitter source) requires randomness — mark as `[non-normative implementation detail]` |
| Referential transparency | ⚠️ G5.4 (λ₂ normalization reference values) may depend on empirical data not in the grammar — needs axiom grounding |
| Outputs are morpheme properties | ✅ All computed values attach to identified morpheme types |

### 5.3 Verification Alignment

The verification test `tests/graph/executor-graph-wiring.test.ts` should validate:

1. That the graph module exports the query functions consumed by Interfaces 3, 4, and 5 (container discovery, degree, Laplacian, composition boundary, connection count)
2. That the computation module exports functions whose signatures match the consumer contracts specified for each interface
3. That an event dispatch mechanism exists (even if stubbed) that connects Interface 6's producers to consumers
4. That the executor (producer side of Interface 1) emits events conforming to the shared event schema

---

## 6. Summary Table — All 7 Interfaces

| # | Interface | Producer Module | Consumer Module | Critical Gap | Primary Milestone |
|---|---|---|---|---|---|
| 1 | Observation → Conditioning | Task executor (`scripts/`) | Conditioning pipeline (`src/computation/`) | G1.1 Event schema | M-7, M-10 |
| 2 | Conditioning → ΦL | Conditioning pipeline | ΦL computation (`src/computation/`) | G2.1 Factor decomposition | M-5, M-10 |
| 3 | PhiL → Maturity | ΦL computation | Maturity modifier (`src/computation/`) | G3.2 Connection count query | M-5, M-6 |
| 4 | Node → Container | Node state (computation + graph) | Dampening (`src/computation/dampening.ts`) | G4.1 Container discovery | M-3, M-6, M-8 |
| 5 | Graph → PsiH | Graph module (`src/graph/`) | ΨH computation (`src/computation/psi-h.ts`) | G5.1 Laplacian construction | M-4, M-6 |
| 6 | State → Events | All computation modules | Graph, triggers, display, router, hallucination detection | G6.1 Event dispatch | M-9, M-10 |
| 7 | Recovery → Hysteresis | Recovery detector | Hysteresis state machine + router | G7.1 State storage, G7.3 Probe routing | M-5, M-8, M-10 |

**Total gaps identified:** 28 (3 critical, 11 high, 10 medium, 4 low)
**Primary integration milestone:** M-10 (carries 12 gaps)
**Critical path module:** `src/graph/index.ts` (required by Interfaces 3, 4, 5, 6)