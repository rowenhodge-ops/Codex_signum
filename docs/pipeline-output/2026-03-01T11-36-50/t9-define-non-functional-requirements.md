# Define non-functional requirements

> Task ID: t9
> Model: claude-opus-4-6:adaptive:medium
> Duration: 133597ms
> Output chars: 20876
> Timestamp: 2026-03-01T11:56:41.381Z

---

# Non-Functional Requirements for Codex-Native Topology Refactor

**Document:** NFR Specification — Codex Signum Topology Refactor
**Task:** t9 — Define non-functional requirements for the refactor
**Date:** 2025-01-27
**Baseline Source:** M-7B and M-8A consolidated findings, Codex Signum v3.0 spec, lean process maps v2

---

## 1. Scope and Methodology

These NFRs constrain **how** the functional requirements FR-9 through FR-15 must behave. They are derived from:

- **Codex axioms** (operational scope — the running system must satisfy these)
- **Lean Six Sigma measurements** from M-7B/M-8A baselines (Cp/Cpk, RTY, PCE targets)
- **Structural encoding principles** from the v3.0 spec (state-is-structural, graceful degradation, perceptual monitoring)
- **Gap analysis findings** from the lean process maps audit

Each NFR is assigned an identifier (NFR-R-nn), a category, a measurable threshold, and traceability to the functional requirement(s) and axiom(s) it supports.

---

## 2. Performance Requirements

### NFR-R-01: Pipeline Dispatch Latency

| Attribute | Value |
|---|---|
| **Category** | Performance |
| **Statement** | The total added latency from pre-flight auth validation (FR-9) and file context injection (FR-10) at the DISPATCH stage SHALL NOT exceed 500ms p95 for repositories ≤ 10,000 files. |
| **Rationale** | M-8A runs show current DISPATCH-to-first-task latency at ~1.2s. Adding two new synchronous operations must not double wall-clock time. The 500ms budget allocates ~200ms to auth validation (FR-9) and ~300ms to file context assembly (FR-10). |
| **Measurement** | Instrumented timer from DISPATCH entry to DISPATCH exit, measured at p50, p95, p99 over rolling 100-run windows. |
| **Traceability** | FR-9, FR-10; Axiom 3 (Bounded Mutation — changes must not destabilize throughput) |

### NFR-R-02: Directory Metadata Assembly at DECOMPOSE

| Attribute | Value |
|---|---|
| **Category** | Performance |
| **Statement** | Directory metadata gathering (FR-11) SHALL complete within 1 second p95 for repositories with ≤ 500 directories and ≤ 50,000 total files. Metadata SHALL be cached with a TTL of 60 seconds for repeated DECOMPOSE operations within the same pipeline run. |
| **Rationale** | DECOMPOSE is on the critical path for every sub-task. Filesystem stat operations scale linearly; caching prevents redundant traversal when the same directories appear across multiple decomposed tasks. |
| **Measurement** | Wall-clock time for metadata assembly step; cache hit ratio. |
| **Traceability** | FR-11; Axiom 6 (Feedback Directionality — metadata flows inward to inform decomposition) |

### NFR-R-03: Graph Node Serialization Throughput

| Attribute | Value |
|---|---|
| **Category** | Performance |
| **Statement** | Pipeline output serialized as graph nodes (FR-12) SHALL sustain ≥ 100 nodes/second write throughput for graphs up to 10,000 nodes. Node creation SHALL NOT block the pipeline's critical path — writes MAY be asynchronous with guaranteed delivery. |
| **Rationale** | A complex pipeline run may produce hundreds of output artifacts. If graph persistence is synchronous and slow, it becomes a bottleneck violating Axiom 2 (Directional Flow). |
| **Measurement** | Nodes written per second; queue depth of pending writes; data loss rate (must be 0). |
| **Traceability** | FR-12; Axiom 2 (Directional Flow), Axiom 4 (State Coherence) |

### NFR-R-04: Thompson Sampling Decision Latency

| Attribute | Value |
|---|---|
| **Category** | Performance |
| **Statement** | Multi-dimensional Thompson sampling (FR-13) SHALL return a routing decision within 50ms p99. The computational overhead of maintaining posterior distributions SHALL NOT exceed 5% of total pipeline CPU time. |
| **Rationale** | Thompson sampling replaces simpler routing heuristics. If the exploration-exploitation computation is expensive, it defeats the purpose of adaptive routing by slowing the system. The 50ms target keeps sampling below perceptual latency thresholds. |
| **Measurement** | Timer on sampling function; CPU profiling of posterior update operations. |
| **Traceability** | FR-13; Axiom 6 (Feedback Directionality), Axiom 8 (Entropic Cooling) |

---

## 3. Reliability Requirements

### NFR-R-05: Hallucination Detection Sensitivity (Jidoka / Andon Cord)

| Attribute | Value |
|---|---|
| **Category** | Reliability / Correctness |
| **Statement** | The jidoka/Andon-cord hallucination detection mechanism (FR-14) SHALL achieve: (a) **Recall ≥ 0.90** — at least 90% of hallucinated outputs are detected before commit. (b) **Precision ≥ 0.80** — no more than 20% of flagged outputs are false positives. (c) **Detection latency ≤ 2 seconds** from output generation to Andon signal. |
| **Rationale** | M-8A findings show approximately 12-15% of pipeline outputs contain fabricated file references or incorrect API assumptions. Current post-hoc validation catches ~60% (estimated recall). The refactor must substantially improve this. False positive rate must be bounded to prevent jidoka from halting every run. The 90/80 targets yield an F1 ≥ 0.847, representing a meaningful quality gate. |
| **Measurement** | Confusion matrix computed against human-labeled hallucination corpus from M-7B/M-8A runs. Measured per-run and aggregated monthly. |
| **Cp/Cpk Target** | Cpk ≥ 1.0 for recall (process centered at 0.90 with tolerance of ±0.05). This is an initial target; Cpk ≥ 1.33 is the maturity goal. |
| **Traceability** | FR-14; Axiom 1 (Structural Encoding — hallucination is invisible state, violating the axiom), Axiom 10 (Meta-Stability — system must self-correct) |

### NFR-R-06: Rolled Throughput Yield (RTY)

| Attribute | Value |
|---|---|
| **Category** | Reliability / Quality |
| **Statement** | The end-to-end pipeline RTY — measured as the product of percent-complete-and-accurate (%C&A) at each stage — SHALL achieve ≥ 0.70 within 90 days of refactor deployment, improving from the M-8A baseline of ~0.45-0.55 (estimated). |
| **Rationale** | RTY captures cumulative quality. M-8A runs show defects injected at DECOMPOSE (incomplete file context), EXECUTE (hallucinated references), and COMPOSE (inconsistent merge). Each stage's %C&A multiplies. An RTY of 0.70 requires each of 5 stages to achieve ~93% %C&A — ambitious but achievable with FR-10, FR-11, and FR-14 in place. |
| **Measurement** | %C&A measured at each SIPOC boundary (DISPATCH → DECOMPOSE → EXECUTE → VALIDATE → COMPOSE → COMMIT). RTY = ∏(%C&A_i). |
| **Traceability** | All FRs; Axiom 4 (State Coherence), Axiom 7 (Resonance Hierarchy) |

### NFR-R-07: Graceful Degradation Under Partial Failure

| Attribute | Value |
|---|---|
| **Category** | Reliability / Resilience |
| **Statement** | If any single FR-9 through FR-15 subsystem fails: (a) The pipeline SHALL continue operating with reduced capability (degraded mode), not halt entirely — UNLESS the Andon cord (FR-14) has been pulled. (b) The degraded state SHALL be structurally visible (per v3.0 spec: dimming, not darkness). (c) Recovery SHALL be automatic when the subsystem recovers, without manual intervention. |
| **Rationale** | The v3.0 spec mandates graceful degradation as a structural property. The Codex axiom of State Coherence requires that the system's actual state be represented in its encoding. A silent failure violates both. |
| **Measurement** | Chaos testing: inject failures in each subsystem; verify pipeline completes (possibly with lower quality); verify structural visibility of degradation. |
| **Traceability** | FR-9 through FR-15; Axiom 4 (State Coherence), Axiom 5 (Cascade Mechanics) |

---

## 4. Security Requirements

### NFR-R-08: Pre-Flight Auth Validation Integrity

| Attribute | Value |
|---|---|
| **Category** | Security |
| **Statement** | Pre-flight auth validation (FR-9) SHALL: (a) Validate all required credentials BEFORE any pipeline stage reads or writes external resources. (b) Fail closed — if validation cannot complete, the pipeline SHALL NOT proceed. (c) Never log, cache, or persist credential values in plaintext. Credential references (not values) MAY appear in graph nodes. (d) Complete validation against all required providers in parallel with a combined timeout of 10 seconds. |
| **Rationale** | M-8A runs show failures at EXECUTE and COMMIT due to expired or missing credentials discovered mid-pipeline. This wastes all upstream compute. Fail-closed is the only safe default for auth. |
| **Measurement** | Penetration testing for credential leakage; verification that no pipeline stage executes external calls before auth gate passes; timeout compliance testing. |
| **Traceability** | FR-9; Axiom 3 (Bounded Mutation — unauthorized mutation must be prevented) |

---

## 5. Observability Requirements

### NFR-R-09: Structural State Visibility

| Attribute | Value |
|---|---|
| **Category** | Observability |
| **Statement** | Every graph node produced by FR-12 SHALL encode: (a) Health (luminance equivalent: numeric 0.0-1.0), (b) Activity (pulsation equivalent: timestamp of last state change), (c) Lineage (parent node references forming a DAG), (d) Axiom compliance status (which axioms were evaluated, pass/fail). The graph SHALL be queryable without pipeline re-execution. |
| **Rationale** | The v3.0 spec's foundational claim is "state is structural." If pipeline output is flat files, state is NOT structural — it must be queried, parsed, and interpreted. Graph nodes with encoded state fulfill the spec's promise. |
| **Measurement** | Schema validation of every emitted node; query latency for lineage traversal (≤ 100ms for 3-hop traversal); completeness audit (no nodes without health or lineage). |
| **Traceability** | FR-12; Axiom 1 (Structural Encoding), Axiom 4 (State Coherence) |

### NFR-R-10: Process Capability Metrics Emission

| Attribute | Value |
|---|---|
| **Category** | Observability / Lean |
| **Statement** | The pipeline SHALL emit metrics sufficient to calculate: (a) Cp and Cpk for each continuous quality characteristic (hallucination rate, latency, %C&A per stage). (b) Process Cycle Efficiency (PCE) = value-added time / total lead time. (c) Common-cause vs special-cause variation classification (using Western Electric rules or equivalent on control charts). These metrics SHALL be emitted per-run and aggregatable across runs. |
| **Rationale** | Without Cp/Cpk and PCE measurement, we cannot determine whether the refactor improves capability or merely shifts the mean. The lean review methodology requires these measurements to validate improvement. M-8A baseline PCE is estimated at 15-25% (high waste from rework and waiting). |
| **Measurement** | Metrics emission verified by schema; Cp/Cpk calculated from ≥ 25 consecutive runs; PCE calculated per run. |
| **Target** | PCE ≥ 0.40 within 90 days (doubling from estimated baseline). Cpk ≥ 1.0 for hallucination rate within 180 days. |
| **Traceability** | FR-12, FR-14, FR-15; Axiom 9 (Adaptive Thresholds) |

---

## 6. Maintainability Requirements

### NFR-R-11: Self-Referential Axiom Review Isolation

| Attribute | Value |
|---|---|
| **Category** | Maintainability / Correctness |
| **Statement** | The self-referential axiom review mechanism (FR-15) SHALL: (a) Execute in a separate evaluation context that cannot modify the pipeline state it is reviewing. (b) Produce findings as graph nodes (per FR-12) with explicit axiom references. (c) Be disableable without affecting pipeline correctness — it is a quality gate, not a functional dependency. (d) Complete within 10% of total pipeline execution time. |
| **Rationale** | A self-referential review that can modify its own subject creates a halting-problem-adjacent risk. Isolation ensures the review is observational. The 10% time budget prevents the review from dominating pipeline cost. Disableability ensures the mechanism doesn't become a single point of failure — consistent with NFR-R-07 (graceful degradation). |
| **Scope Awareness Note** | Per task instruction §9: This NFR operates at **review scope**. The axiom review evaluates whether the foundation is correct. Semantic Stability (Axiom 10) does not block this — the review's purpose is to identify where axioms are violated, including by the review mechanism itself. The constraint is **substantive**: unbounded self-modification creates non-termination risk. |
| **Measurement** | Integration test: verify review cannot write to pipeline state; verify disabling review does not cause pipeline failure; time budget compliance. |
| **Traceability** | FR-15; Axiom 10 (Meta-Stability), Axiom 3 (Bounded Mutation) |

### NFR-R-12: Modular Subsystem Boundaries

| Attribute | Value |
|---|---|
| **Category** | Maintainability |
| **Statement** | Each FR (FR-9 through FR-15) SHALL be implementable as an independent module with: (a) A defined TypeScript interface (type-checked by `npx tsc --noEmit`). (b) No circular dependencies between FR modules. (c) Testable in isolation with mock inputs/outputs. (d) Replaceable without modifying other FR modules (Open-Closed Principle). |
| **Rationale** | The M-7B/M-8A dependency matrix (rebuilt without Observer/Sentinel per task §4) revealed tight coupling between validation and execution. The refactor must not replicate this. Each FR maps to a SIPOC boundary; module boundaries must align with value stream boundaries. |
| **Measurement** | Dependency graph analysis (no cycles); `npx tsc --noEmit` passes with any single FR module stubbed; test isolation verified by running each FR's test suite independently. |
| **Traceability** | All FRs; Axiom 2 (Directional Flow — dependencies must be acyclic) |

---

## 7. Scalability Requirements

### NFR-R-13: Graph Growth Bounds

| Attribute | Value |
|---|---|
| **Category** | Scalability |
| **Statement** | The graph node store (FR-12) SHALL: (a) Support ≥ 100,000 nodes without query degradation beyond 2× baseline latency. (b) Support graph pruning/archival based on configurable retention policies (default: 90 days). (c) Scale storage linearly (O(n)) with pipeline runs, not quadratically with node interconnections. |
| **Rationale** | Without bounds, graph accumulation will degrade the system over time. Axiom 8 (Entropic Cooling) requires that system complexity decreases over time, not increases. Unbounded graph growth violates this directly. |
| **Measurement** | Load testing with synthetic graph data at 10K, 50K, 100K, 500K nodes; query latency regression analysis. |
| **Traceability** | FR-12; Axiom 8 (Entropic Cooling) |

### NFR-R-14: Thompson Sampling Dimensional Scaling

| Attribute | Value |
|---|---|
| **Category** | Scalability |
| **Statement** | Multi-dimensional Thompson sampling (FR-13) SHALL support ≥ 10 simultaneous quality dimensions without: (a) Decision latency exceeding NFR-R-04 (50ms p99), (b) Posterior storage exceeding 10MB per routing context, (c) Convergence requiring > 100 observations per dimension for stable exploitation. |
| **Rationale** | "Multi-dimensional" is unbounded without this constraint. Real routing decisions involve model selection, prompt strategy, context window size, validation depth, and other dimensions. 10 dimensions covers foreseeable needs. The 100-observation convergence bound ensures Thompson learning is useful within a reasonable number of pipeline runs. |
| **Measurement** | Synthetic benchmarks varying dimension count from 2 to 20; convergence analysis with simulated reward signals. |
| **Traceability** | FR-13; Axiom 6 (Feedback Directionality), Axiom 9 (Adaptive Thresholds) |

---

## 8. Compatibility Requirements

### NFR-R-15: Backward Compatibility with Existing Pipeline Output

| Attribute | Value |
|---|---|
| **Category** | Compatibility |
| **Statement** | The refactored pipeline SHALL: (a) Continue producing flat-file output in the existing `docs/pipeline-output/` format as a compatibility layer. (b) Produce graph node output (FR-12) as an additional output, not a replacement, for a migration period of ≥ 2 major versions. (c) Ensure existing tooling that reads pipeline output directories continues to function without modification. |
| **Rationale** | The M-8A consolidated findings in `docs/pipeline-output/2026-03-01T08-19-52/` represent the current consumption format. Breaking this format violates Axiom 3 (Bounded Mutation) at operational scope — the running system's consumers must not be disrupted by internal refactoring. |
| **Measurement** | Regression test: existing pipeline output consumers produce identical results pre- and post-refactor. |
| **Traceability** | FR-12; Axiom 3 (Bounded Mutation) |

---

## 9. Measurement System Analysis (MSA) Requirements

### NFR-R-16: Measurement Repeatability and Reproducibility

| Attribute | Value |
|---|---|
| **Category** | Quality / Measurement |
| **Statement** | All metrics used to evaluate NFR compliance SHALL demonstrate: (a) **Repeatability**: Same pipeline input produces metric values within ±5% across 10 consecutive runs. (b) **Reproducibility**: Metrics computed by different evaluation methods (automated vs manual audit) agree within ±10%. (c) **Gauge R&R** ≤ 30% of total observed variation (acceptable per AIAG MSA guidelines). |
| **Rationale** | If our measurement system has high variation, we cannot distinguish process improvement from measurement noise. This is particularly critical for hallucination detection (FR-14) where the "measurement" is itself an LLM judgment — MSA must confirm this measurement instrument is stable. The 5 Whys analysis of M-8A quality issues traces at least one root cause to inconsistent quality assessment criteria. |
| **Measurement** | Gauge R&R study: 3 evaluators × 10 pipeline outputs × 3 repetitions = 90 measurements. Compute %R&R. |
| **Traceability** | FR-14, FR-15; Axiom 4 (State Coherence — measured state must reflect actual state) |

---

## 10. Axiom Compliance Matrix

| NFR | Ax.1 Structural | Ax.2 Directional | Ax.3 Bounded | Ax.4 State Coherence | Ax.5 Cascade | Ax.6 Feedback | Ax.7 Resonance | Ax.8 Entropic | Ax.9 Adaptive | Ax.10 Meta-Stability |
|---|---|---|---|---|---|---|---|---|---|---|
| NFR-R-01 | | | ● | | | | | | | |
| NFR-R-02 | | | | | | ● | | | | |
| NFR-R-03 | | ● | | ● | | | | | | |
| NFR-R-04 | | | | | | ● | | ● | | |
| NFR-R-05 | ● | | | | | | | | | ● |
| NFR-R-06 | | | | ● | | | ● | | | |
| NFR-R-07 | | | | ● | ● | | | | | |
| NFR-R-08 | | | ● | | | | | | | |
| NFR-R-09 | ● | | | ● | | | | | | |
| NFR-R-10 | | | | | | | | | ● | |
| NFR-R-11 | | | ● | | | | | | | ● |
| NFR-R-12 | | ● | | | | | | | | |
| NFR-R-13 | | | | | | | | ● | | |
| NFR-R-14 | | | | | | ● | | | ● | |
| NFR-R-15 | | | ● | | | | | | | |
| NFR-R-16 | | | | ● | | | | | | |

---

## 11. Baseline Measurements from M-7B / M-8A

These baselines establish the "current state" against which NFR targets are evaluated:

| Metric | M-8A Estimated Baseline | NFR Target | NFR Reference |
|---|---|---|---|
| DISPATCH latency (p95) | ~1.2s (no auth/context) | ≤1.7s total (with FR-9, FR-10) | NFR-R-01 |
| Hallucination detection recall | ~0.60 | ≥0.90 | NFR-R-05 |
| Hallucination detection precision | ~0.50 (estimated, high false pos.) | ≥0.80 | NFR-R-05 |
| End-to-end RTY | ~0.45–0.55 | ≥0.70 | NFR-R-06 |
| PCE | ~0.15–0.25 | ≥0.40 | NFR-R-10 |
| Cpk (hallucination rate) | Not measured (no SPC in place) | ≥1.0 | NFR-R-10 |
| Auth-related mid-pipeline failures | ~18% of runs | 0% (fail at pre-flight) | NFR-R-08 |
| Rework rate (tasks re-executed) | ~30–35% | ≤15% | NFR-R-06 (implied) |

---

## 12. Scope Awareness Declaration

Per task instruction §9, these NFRs apply **operational scope** constraints — they define how the running refactored system must behave. They do not constrain the review's ability to question whether axioms themselves are correctly formulated.

Specifically:
- **Axiom 10 (Meta-Stability / Semantic Stability)** is referenced in NFR-R-05 and NFR-R-11 as a quality target for the running system. It is NOT invoked to prevent foundational recommendations about axiom reformulation. The substantive reason for any constraint is stated in each NFR's rationale — not deferred to axiomatic authority.
- **NFR-R-11** explicitly carves out the self-referential review (FR-15) as operating at review scope, where it evaluates axiom compliance including its own.

---

## 13. Verification

All NFRs are verifiable through the mechanisms specified in their individual **Measurement** fields. Additionally:

- **Type safety**: `npx tsc --noEmit` SHALL pass for all interface definitions supporting NFR measurement.
- **Automated regression**: NFR-R-06 (RTY), NFR-R-10 (PCE/Cp/Cpk), and NFR-R-16 (MSA) require sustained measurement infrastructure that persists across pipeline runs.
- **Acceptance gate**: No FR (FR-9 through FR-15) SHALL be considered complete until its associated NFRs demonstrate compliance over ≥ 5 consecutive pipeline runs.