# Extract M-22 wiring requirements from Engineering Bridge v3.0

> Task ID: t1
> Model: claude-opus-4-6:adaptive:low
> Duration: 216588ms
> Output chars: 29035
> Timestamp: 2026-03-17T13:21:35.858Z

> **⚠️ Hallucination flags (4):**
> - [content/warning] Task t1 references "src/graph/instantiation.ts" but this file was not in its context
> - [content/warning] Task t1 references "src/computation/psi-h.ts" but this file was not in its context
> - [content/warning] Task t1 references a document ("docs/specs/01_codex-signum-v3_0.md") that was not in its context
> - [content/warning] Task t1 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# M-22 Vertical Wiring Requirements Checklist

**Extracted from:** `docs/specs/codex-signum-engineering-bridge-v3_0.md` (v3.0)
**Task:** t1 — Extract M-22 wiring requirements
**Date:** Extraction performed against spec version 3.0 (2026-03-16)

---

## Overview

The Engineering Bridge v3.0 changelog explicitly references a **"Vertical wiring specification: 8-row interface contract"** (preamble, M-17 complete). The M-22 vertical wiring analysis maps these 8 rows to the end-to-end signal flow from bootstrap executor through graph persistence, covering the six subsystems named in the task intent:

| Row | Subsystem | Spec Location |
|-----|-----------|---------------|
| 1 | Bootstrap & Graph Initialization | Part 1, Governance Resonators |
| 2 | Signal Conditioning | Part 4 (7 Resonators in Signal Conditioning Bloom) |
| 3 | ΨH Computation | Part 2 §ΨH |
| 4 | εR Aggregation | Part 2 §εR, §Composition-Scope εR |
| 5 | Hierarchical Health Propagation (ΦL) | Part 2 §ΦL, Part 3 (Cascade) |
| 6 | Line Conductivity | Line Conductivity Part (3-layer model) |
| 7 | Event-Triggered Structural Review | Part 8 (Structural Review Resonator) |
| 8 | Graph Persistence | Part 1, Superposition §S.5, Governance Resonators |

---

## Row 1 — Bootstrap & Graph Initialization

### R1.1 — Single Source of Truth
- **Requirement:** The graph database is the single source of truth for both component relationships and component health. No separate health databases, monitoring tables, or status caches.
- **Spec Reference:** Part 1 ("State Is Structural"), ¶2–4
- **Verification:** Every write operation during bootstrap must target the graph. No sidecar JSON, no log-file-as-state.

### R1.2 — Constitutional Bloom Topology
- **Requirement:** Three governance Resonators (Instantiation, Mutation, Line Creation) exist **as siblings** within the Constitutional Bloom, connected via CONTAINS Lines. Associated observation Grids are also siblings, connected to their respective Resonators via FLOWS_TO Lines (not CONTAINS — Resonators do not contain).
- **Spec Reference:** Governance Resonators Part, §Architecture diagram
- **Verification:** After bootstrap, the following topology must be queryable:
  ```
  Constitutional Bloom (○)
  ├── CONTAINS → Instantiation Resonator (Δ)
  ├── CONTAINS → Mutation Resonator (Δ)
  ├── CONTAINS → Line Creation Resonator (Δ)
  ├── CONTAINS → Instantiation Grid (□)
  ├── CONTAINS → Mutation Grid (□)
  ├── CONTAINS → Line Creation Grid (□)
  └── CONTAINS → Grammar Seeds (•)
  ```
  With FLOWS_TO relationships from each Resonator to its respective Grid.

### R1.3 — All Graph Writes Route Through Governance Resonators
- **Requirement:** `instantiateMorpheme()` invokes Instantiation Resonator; `updateMorpheme()` invokes Mutation Resonator; `createLine()` invokes Line Creation Resonator. No raw graph writes bypass these three functions.
- **Spec Reference:** Governance Resonators Part, §Anti-Pattern Connection
- **Verification:** Trace all graph-write call sites. Every one must route through `src/graph/instantiation.ts`.

### R1.4 — INSTANTIATES Wiring
- **Requirement:** Every morpheme instance carries an INSTANTIATES relationship to the Constitutional Bloom. This is created at instantiation time by the Instantiation Resonator and is required for Line conductivity Layer 1 to pass.
- **Spec Reference:** Governance Resonators Part, §Instantiation Resonator; Line Conductivity Part, Layer 1
- **Verification:** `EXISTS { (node)-[:INSTANTIATES]->(:Bloom {name: 'Constitutional Bloom'}) }` for every morpheme.

### R1.5 — Content-for-All (N-8)
- **Requirement:** `content` is required and non-empty on ALL six morpheme types. Bloom content = scope/purpose; Resonator content = transformation; Grid content = what it stores; Helix content = iteration behaviour; Seed content = data unit. Lines are excluded.
- **Spec Reference:** Line Conductivity Part, Layer 1 (N-8 reference); Governance Resonators Part, §Instantiation Resonator
- **Verification:** Instantiation Resonator rejects creation without content. Layer 1 hygiene check darkens Lines to nodes with missing content.

---

## Row 2 — Signal Conditioning

### R2.1 — Signal Conditioning Bloom Architecture
- **Requirement:** Signal conditioning stages are seven named Resonators within a Signal Conditioning Bloom, with intra-run/cross-run temporal scale distinction.
- **Spec Reference:** Preamble changelog ("Part 4 reframed: signal conditioning stages become seven named Resonators within a Signal Conditioning Bloom with intra-run/cross-run temporal scale distinction")
- **Status:** ⚠️ Part 4 details truncated in available spec text. The seven Resonator names and their individual contracts must be extracted from the full Part 4 section.

### R2.2 — Signal Conditioning Placement in Pipeline
- **Requirement:** Signal conditioning processes signals that flow through conductive Lines. Insertion point: after Line conductivity evaluation (Row 6) and after cascade propagation (Row 5). Sequence: degradation propagates → conductivity gates → conditioning processes.
- **Spec Reference:** Line Conductivity Part, §Cross-References ("Signal conditioning pipeline (Part 4) processes signals that flow through conductive Lines")
- **Verification:** Bootstrap wiring must ensure the conditioning Bloom receives inputs only from Lines that have passed conductivity evaluation.

### R2.3 — Temporal Scale Distinction
- **Requirement:** Intra-run observations (within a single execution) and cross-run observations (across executions) must be distinguished within the signal conditioning pipeline.
- **Spec Reference:** Preamble changelog (Part 4 reframe description)
- **Status:** ⚠️ Detailed requirements in truncated Part 4.

---

## Row 3 — ΨH Computation

### R3.1 — Two-Component Composite ΨH
- **Requirement:** ΨH is computed from two independent components:
  - Component 1: Structural Coherence via graph Laplacian second-smallest eigenvalue (λ₂)
  - Component 2: Runtime Friction via total variation on graph (TV_G)
  - Composite: `ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)`
- **Spec Reference:** Part 2, §ΨH — Harmonic Signature (Two-Component)
- **Verification:** Implementation at `src/computation/psi-h.ts` must accept `edges` and `nodeHealths` arrays and compute both components.

### R3.2 — ΨH Temporal Decomposition (Three-Component Implementation)
- **Requirement:** `decomposePsiH()` decomposes ΨH into:
  - `psiH_trend`: EWMA-smoothed trend (α default 0.15)
  - `friction_transient`: `|psiH_instant - psiH_trend|`
  - `friction_durable`: `|psiH_trend - baseline|`
- **Spec Reference:** Part 2, §ΨH Temporal Decomposition, "Implementation Decomposition (Current — Three Components)"
- **Verification:** All three components computed. Baseline established after `BASELINE_MIN_OBSERVATIONS` (5) observations.

### R3.3 — Integrated ΨH Computation Entry Point
- **Requirement:** `computePsiHWithState()` wraps both `computePsiH()` (structural) and `decomposePsiH()` (temporal), returning raw ΨH, decomposition, and updated state in a single call.
- **Spec Reference:** Part 2, §ΨH Temporal Decomposition, "Integrated computation"
- **Verification:** Single-call API exists; caller owns and persists `PsiHState` between runs; core remains stateless.

### R3.4 — PsiHState Management
- **Requirement:** `PsiHState` carries: ring buffer of observations, current trend value, established baseline, EWMA alpha, buffer max size. State persistence is the caller's responsibility.
- **Spec Reference:** Part 2, §ΨH Temporal Decomposition, "State management"
- **Verification:** State structure matches contract. Bootstrap executor persists state to graph between runs.

### R3.5 — ΨH Hypothetical Projection
- **Requirement:** ΨH must be computable against proposed (hypothetical) states, not only observed states. `computePsiH()` accepts arbitrary edge/nodeHealth arrays.
- **Spec Reference:** Part 2, §ΨH Hypothetical State (Projectable)
- **Status:** ⚠️ Partial — infrastructure exists but no dedicated `computeHypotheticalPsiH()` ergonomic API.

### R3.6 — ΨH Diagnostic Signal
- **Requirement:** High λ₂ + high friction is flagged as the most informative dissonance signal. Graph says components *should* work together but operationally they don't.
- **Spec Reference:** Part 2, §ΨH, "Key diagnostic signal"
- **Verification:** Diagnostic output must surface this specific combination.

### R3.7 — Spec Target: Four-Dimension Decomposition
- **Requirement (target):** v5.0 specifies four dimensions: Frequency, Duration, Intensity, Scope. Frequency and Scope require cross-Bloom episode analysis not yet implemented.
- **Spec Reference:** Part 2, §ΨH Temporal Decomposition, "Spec Decomposition (Target — Four Dimensions)"
- **Status:** Engineering milestone, not yet required for M-22 wiring validation. Implementation currently covers Intensity (via `psiH_trend`) and Duration (inversely via `friction_transient`).

### R3.8 — Bridge View Principle Compliance
- **Requirement:** All ΨH decomposition components are pure functions of ΨH observation history (morpheme state in observation Grid) and window parameters (axiom-defined).
- **Spec Reference:** Part 2, §ΨH Temporal Decomposition, final paragraph
- **Verification:** No external state, no non-graph inputs.

---

## Row 4 — εR Aggregation

### R4.1 — Component-Level εR
- **Requirement:** `εR = exploratory_decisions / total_decisions` over a rolling observation window.
- **Spec Reference:** Part 2, §εR — Exploration Rate
- **Verification:** Computed from observation data in graph.

### R4.2 — εR Floor with Imperative Gradient Modulation
- **Requirement:** `εR_floor = base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient))`. Recommended `gradient_sensitivity`: 0.05–0.15. When Ω gradients are positive, modulation term is zero.
- **Spec Reference:** Part 2, §εR, "Imperative gradient modulation"
- **Verification:** Floor enforced — εR never drops below computed floor.

### R4.3 — εR Spectral Calibration
- **Requirement:** εR floor is the max of gradient-modulated floor and spectral-state minimum:
  ```
  εR_floor = max(gradient_floor, min_εR_for_spectral_state(spectral_ratio))
  ```
  Spectral ratio thresholds: >0.9→0.05, 0.7–0.9→0.02, 0.5–0.7→0.01, <0.5→0.0.
- **Spec Reference:** Part 2, §εR, "Spectral calibration (complementary signal)"
- **Verification:** Both floor computations implemented; max taken.

### R4.4 — Composition-Scope εR (Bloom-Level Aggregation)
- **Requirement:** `εR_bloom = exploratory_decisions_in_bloom / total_decisions_in_bloom`, where decisions are Decision Seeds within the Bloom's containment scope via CONTAINS traversal.
- **Spec Reference:** Part 2, §Composition-Scope εR, "Computation"
- **Verification:** Bloom-level εR computed by querying Decision Seeds within containment.

### R4.5 — Weighted Variant (Mature Deployments)
- **Requirement (optional):** `εR_bloom = Σ(εR_i × ΦL_i) / Σ(ΦL_i)` for all Resonators i within the Bloom. Weights exploration by component health.
- **Spec Reference:** Part 2, §Composition-Scope εR, "Alternative (weighted by Resonator ΦL)"
- **Status:** Recommended simple ratio for initial implementation; weighted variant for mature deployments.

### R4.6 — εR Upward Propagation
- **Requirement:** `εR_parent = (1/k) × Σ(εR_child_i)` for all k children. No dampening coefficient — εR is an observation rate, not a health signal. Averaging preserves information.
- **Spec Reference:** Part 2, §Composition-Scope εR, "Upward Propagation"
- **Verification:** Mean (not dampened) propagation through nested Blooms.

### R4.7 — εR Structural Review Trigger
- **Requirement:** εR spike at composition level triggers structural review when `εR_bloom > εR_stable_range_upper` (Young: 0.40, Maturing: 0.30, Mature: 0.15).
- **Spec Reference:** Part 2, §Composition-Scope εR, "Structural Review Trigger"
- **Verification:** εR spike is wired as an input Line to the Structural Review Resonator (Row 7).

### R4.8 — Critical Diagnostic Rule
- **Requirement:** High ΦL with zero εR is a **warning**, not a success.
- **Spec Reference:** Part 2, §εR, "Critical rule"
- **Verification:** Alert/flag generated when ΦL > healthy threshold AND εR = 0.0.

### R4.9 — Bridge View Principle Compliance
- **Requirement:** Composition-scope εR is a pure function of Decision Seed counts within containment (morpheme state + topology) and maturity-indexed thresholds (axiom parameters).
- **Spec Reference:** Part 2, §Composition-Scope εR, final paragraph
- **Verification:** No external state references.

---

## Row 5 — Hierarchical Health Propagation (ΦL)

### R5.1 — ΦL Four-Factor Computation
- **Requirement:** `ΦL = w₁×axiom_compliance + w₂×provenance_clarity + w₃×usage_success_rate + w₄×temporal_stability` with recommended weights 0.4, 0.2, 0.2, 0.2.
- **Spec Reference:** Part 2, §ΦL — Health Score
- **Verification:** Four factors computed per factor definition table.

### R5.2 — Maturity Modifier
- **Requirement:** `ΦL_effective = ΦL_raw × maturity_factor` where `maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))`. Approaches 1.0 at 50+ observations and 3+ connections; approaches 0 at 0 observations or 0 connections.
- **Spec Reference:** Part 2, §ΦL, "Maturity modifier"
- **Verification:** New nodes with no observations have near-zero effective ΦL.

### R5.3 — Recency Weighting
- **Requirement:** `observation_weight = e^(-λ × age)`. λ varies by rate of change. Compaction threshold: discard raw observations when weight < 0.01.
- **Spec Reference:** Part 2, §ΦL, "Recency weighting"
- **Verification:** Exponential decay applied to observations.

### R5.4 — Sliding Window (Ring Buffers)
- **Requirement:** Count-based ring buffers with subtract-on-evict for O(1) snapshot retrieval. Topology-dependent sizes: Leaf 10–20, Intermediate 30–50, Root 50–100.
- **Spec Reference:** Part 2, §ΦL, "Sliding window implementation"
- **Verification:** Window size matches node type in topology.

### R5.5 — Adaptive Thresholds (Maturity-Indexed)
- **Requirement:** Thresholds vary by maturity index:
  | Threshold | Young (MI<0.3) | Maturing (0.3–0.7) | Mature (MI>0.7) |
  |---|---|---|---|
  | ΦL healthy | >0.6 | >0.7 | >0.8 |
  | ΦL degraded | <0.4 | <0.5 | <0.6 |
- **Spec Reference:** Part 2, §ΦL, "Adaptive thresholds — maturity-indexed"
- **Verification:** Threshold lookup uses computed maturity index.

### R5.6 — CONTAINS Line Attenuation
- **Requirement:** `γ_effective = min(γ_base, safety_budget / k)` where γ_base=0.7, safety_budget=0.8, k=branching factor. Guarantees spectral radius μ = k×γ ≤ 0.8 < 1 for all k ≥ 1.
- **Spec Reference:** Part 3, §3.2 Attenuation (G4: Weight)
- **Verification:** For every CONTAINS Line, γ_effective computed from parent Bloom's branching factor. No separate hub formula.

### R5.7 — Depth Limit
- **Requirement:** **2 levels. Not negotiable.** Degradation propagates through at most two levels of CONTAINS Lines.
- **Spec Reference:** Part 3, §3.3 Depth Limit
- **Verification:** No propagation beyond grandparent. Expected cascade size bounded at 1 + μ + μ² = 2.44 nodes.

### R5.8 — Asymmetric Rate
- **Requirement:** Recovery is 2.5× slower than degradation. Recovery propagates at `γ_effective / 2.5`. Degradation threshold = 0.50; recovery threshold = 0.50 × 2.5 = 0.75 (or maturity-indexed equivalents).
- **Spec Reference:** Part 3, §3.4 Asymmetric Rate
- **Verification:** Separate thresholds for degradation vs. recovery. N consecutive observations (3–5) required for state transition (debouncing).

### R5.9 — Algedonic Bypass
- **Requirement:** When child ΦL < 0.1, CONTAINS Line dampening weight overrides to 1.0 — full propagation to root, bypassing all attenuation.
- **Spec Reference:** Part 3, §3.5 Algedonic Bypass
- **Verification:** Emergency threshold check on every propagation. Bypass activated by child ΦL value as a Line property.

### R5.10 — Propagation Direction Rules
- **Requirement:** CONTAINS Lines: structural derivation (parent from children). FLOWS_TO Lines: forward signal (producer → consumer). No sideways propagation through Resonance Lines.
- **Spec Reference:** Part 3, §3.1, §3.6 Summary
- **Verification:** No degradation propagates laterally.

### R5.11 — Recovery Model
- **Requirement:** Linear recovery delay with cap: `recovery_delay = base_delay × (1 + 0.2 × failure_count)`, capped at 10 × base_delay. Exponential backoff with full jitter for retry: `actual_delay = random(0, min(base × 1.5^attempt, 300s))`. Half-open state: 5–10 trial probes before declaring recovery.
- **Spec Reference:** Part 3, §Recovery Model
- **Verification:** Circuit breaker pattern implemented with mandatory full jitter and 300s cap.

### R5.12 — Dimensional Profiles
- **Requirement:** ΦL decomposed by task classification (ΦL_code, ΦL_reasoning, etc.). Same four-factor formula on observation subset filtered by `taskClass` tag. Ephemeral computations, recomputed on demand.
- **Spec Reference:** Part 2, §Dimensional Profiles
- **Verification:** Profiles queryable from observation Grid. Thompson router reads partitioned ΦL for task-matched selection.

---

## Row 6 — Line Conductivity

### R6.1 — Pipeline Position
- **Requirement:** Conductivity evaluation inserts between cascade propagation (Part 3) and signal conditioning (Part 4). Degradation propagates through conductive Lines; signals flow through conductive Lines into the conditioning pipeline.
- **Spec Reference:** Line Conductivity Part, opening paragraph
- **Verification:** Wiring order: cascade → conductivity check → conditioning.

### R6.2 — Layer 1: Morpheme Hygiene (Binary)
- **Requirement:** Both endpoints must have: non-empty `content`, non-null `status`, non-null `phiL`, INSTANTIATES relationship to Constitutional Bloom. If either endpoint fails, Line is topologically present but dark (no signal flows).
- **Spec Reference:** Line Conductivity Part, §Layer 1
- **Verification:** Cypher pattern check per spec. `HygieneResult` interface: `{ passes: boolean; failures: string[] }`.

### R6.3 — Layer 2: Grammatical Shape (Binary)
- **Requirement:** Connection type must be grammatically valid per morpheme type compatibility table (8 valid patterns enumerated). Direction (G2), containment (G3), and signal type (G4) must all match.
- **Spec Reference:** Line Conductivity Part, §Layer 2
- **Verification:** Valid connection patterns enforced per table.

### R6.4 — Layer 3: Contextual Fitness (Continuous)
- **Requirement:** `friction = 1.0 - min(ΦL_source[task_class], ΦL_target[task_class])`. Reads dimensional profiles from both endpoints' observation Grids. Continuous value [0, 1].
- **Spec Reference:** Line Conductivity Part, §Layer 3
- **Verification:** Friction computed using partitioned ΦL (not composite). `ConductivityResult` interface per spec.

### R6.5 — Composite Conductivity Result
- **Requirement:** `conducts = layer1.passes && layer2.passes`. `effectiveFriction = 0 if !conducts, else layer3.friction`.
- **Spec Reference:** Line Conductivity Part, §Layer 3, TypeScript interface
- **Verification:** Full `ConductivityResult` returned with all three layers.

### R6.6 — Caching and Invalidation
- **Requirement:** Conductivity is cached on the Line relationship (`conductivity: number, conductivityValid: boolean, lastEvaluated: datetime`). Re-evaluate on: endpoint property change (via Mutation Resonator), ΦL threshold crossing, dimensional profile change, new Line creation.
- **Spec Reference:** Line Conductivity Part, §Caching and Invalidation
- **Verification:** Cache properties present on Neo4j relationships. Invalidation triggers wired to Mutation Resonator and ΦL computation.

### R6.7 — Line Creation Resonator Evaluates Conductivity at Write Time
- **Requirement:** When `createLine()` fires the Line Creation Resonator, Layers 1 and 2 must pass for the Line to be created as conductive. Layer 3 friction is computed and cached immediately.
- **Spec Reference:** Governance Resonators Part, §Line Creation Resonator; Line Conductivity Part, §Cross-References
- **Verification:** Initial conductivity evaluation occurs during creation, not deferred.

---

## Row 7 — Event-Triggered Structural Review

### R7.1 — Structural Review Resonator Architecture
- **Requirement:** Structural review triggers are input Lines to the Structural Review Resonator, which produces five diagnostic output types.
- **Spec Reference:** Preamble changelog ("Part 8 reframed: structural review triggers become input Lines to the Structural Review Resonator with five diagnostic output types")
- **Status:** ⚠️ Part 8 details truncated in available spec text. Five diagnostic output types must be extracted from full Part 8.

### R7.2 — Six Event Triggers (from v5.0)
- **Requirement:** v5.0 specifies six event triggers for structural review, including εR spike at Bloom boundary.
- **Spec Reference:** Part 2, §Composition-Scope εR, "Source" annotation ("v5.0 §Event-Triggered Structural Review — εR spike at Bloom boundary")
- **Verification:** All six triggers wired as input Lines to the Structural Review Resonator. εR trigger confirmed (R4.7).

### R7.3 — εR Spike Trigger Wiring
- **Requirement:** When `εR_bloom > εR_stable_range_upper` (maturity-indexed), this fires an input Line to the Structural Review Resonator.
- **Spec Reference:** Part 2, §Composition-Scope εR, "Structural Review Trigger"
- **Verification:** Composition-scope εR computation is connected to structural review input.

### R7.4 — ΨH Dissonance Trigger (Inferred)
- **Requirement:** ΨH exceeding maturity-indexed dissonance threshold (Young: >0.25, Maturing: >0.20, Mature: >0.15) should trigger structural review.
- **Spec Reference:** Part 2, §ΦL, "Adaptive thresholds" (ΨH dissonance row); Part 2, §ΨH friction thresholds (0.5–0.8 = "Investigate; flag for structural review")
- **Verification:** ΨH friction in 0.5–0.8 range explicitly says "flag for structural review".

### R7.5 — Five Diagnostic Output Types
- **Requirement:** The Structural Review Resonator produces five distinct diagnostic outputs.
- **Spec Reference:** Preamble changelog (Part 8 reframe)
- **Status:** ⚠️ Full enumeration in truncated Part 8. Must be extracted from complete spec.

---

## Row 8 — Graph Persistence

### R8.1 — All State Written to Graph
- **Requirement:** Execution outcomes, health scores, observation data — all written to graph, not to separate log files or caches.
- **Spec Reference:** Part 1, ¶3 ("When recording an execution outcome, write it to the graph")
- **Verification:** No sidecar persistence stores.

### R8.2 — Governance Resonator Observation Grids
- **Requirement:** Each governance Resonator writes events to its dedicated Grid:
  - Instantiation Grid: creation event Seeds (timestamp, morpheme type, creator, success/failure, failure reason)
  - Mutation Grid: mutation event Seeds (timestamp, target, properties changed, old/new values)
  - Line Creation Grid: creation event Seeds (timestamp, source, target, line type, initial conductivity)
- **Spec Reference:** Governance Resonators Part, §Instantiation/Mutation/Line Creation Resonator
- **Verification:** Event Seeds present in Grids after every governance operation.

### R8.3 — Superposition Persistence (Stratum 2)
- **Requirement:** After collapse, instance Blooms' observation Grids persist as Stratum 2 execution records. Governance morpheme outputs (Helix iteration counts, ΨH trajectories, ΦL histories) persist alongside. Non-selected outputs are NOT deleted — they feed Scale 2 learning and Thompson posterior updates.
- **Spec Reference:** Superposition Part, §S.5 Persistence
- **Verification:** Stratum 2 records queryable after collapse. No deletion of non-selected outputs.

### R8.4 — Recency Weighting on Persisted Data
- **Requirement:** `weight = e^(-λ × age)` applied to persisted instance data. Compaction Resonator consolidates old records. Individual execution details decay; aggregate statistics persist into Stratum 3.
- **Spec Reference:** Superposition Part, §S.5, "Memory Topology Integration"
- **Verification:** Compaction is a Resonator (not a batch job), operating within the grammar.

### R8.5 — Collapse Observation Recording
- **Requirement:** Collapse Resonator records each collapse decision as an observation Seed: which instance selected, criterion values (posteriors, ΦL, timestamps), quality delta, collapse mode used.
- **Spec Reference:** Superposition Part, §S.4, "Collapse Observation Recording"
- **Verification:** Collapse Seeds present in collapse Resonator's Grid after every collapse.

### R8.6 — Full-Precision Backing Stores
- **Requirement:** Maintain full-precision backing stores alongside any visual encoding. Visual layer serves human observation; backing store serves machine processing and audit.
- **Spec Reference:** Part 1, "Perceptual advantage, not information-theoretic"
- **Verification:** No lossy-only representations.

---

## Cross-Cutting Requirements

### X1 — Bridge View Principle Compliance
- **Requirement:** Every formula is a pure function of `f(morpheme_states, axiom_parameters, topology) → result`. No formula may introduce state, thresholds, entities, or temporal behaviour not grounded in the symbolic grammar.
- **Spec Reference:** Bridge View Principle (Part 1.1)
- **Applies to:** All rows. Explicitly verified for ΨH decomposition (R3.8), composition-scope εR (R4.9), dimensional profiles (R5.12), superposition instance count (Superposition §S.2), all collapse modes (§S.4).

### X2 — Per-Resonator Transactions
- **Requirement:** Per the Event-Driven Execution Model (referenced in preamble), Resonator activation follows a per-Resonator transaction contract with concurrency management.
- **Spec Reference:** Preamble changelog ("Event-Driven Execution Model: Resonator activation contract, per-Resonator transactions, concurrency management, migration path")
- **Status:** ⚠️ Full section may be in truncated portion.

### X3 — Propagation Ordering
- **Requirement:** The end-to-end signal path must follow this ordering:
  1. Bootstrap creates Constitutional Bloom + governance Resonators (R1.2, R1.3)
  2. Morphemes instantiated through Instantiation Resonator (R1.4, R1.5)
  3. Lines created through Line Creation Resonator with initial conductivity (R6.7)
  4. Degradation cascades propagate through conductive CONTAINS Lines (R5.6–R5.10)
  5. Line conductivity evaluated/cached (R6.1–R6.6)
  6. Signals flow through conductive Lines into Signal Conditioning Bloom (R2.1–R2.2)
  7. ΨH computed from conditioned graph state (R3.1–R3.3)
  8. εR aggregated at component and composition scope (R4.1, R4.4, R4.6)
  9. Triggers evaluated → Structural Review Resonator (R7.2–R7.4)
  10. All results persisted to graph (R8.1–R8.6)
- **Spec Reference:** Composite from Parts 1–4, 8, Line Conductivity, Governance Resonators
- **Verification:** No step references state that a later step produces. No circular dependency in the vertical wiring.

---

## Spec Gaps and Truncation Notes

| ID | Gap | Impact | Recommendation |
|----|-----|--------|----------------|
| G-1 | Part 4 (Signal Conditioning) truncated — seven Resonator names and individual contracts unavailable | Cannot verify Row 2 wiring completeness | Extract full Part 4 from untruncated spec |
| G-2 | Part 8 (Structural Review) truncated — five diagnostic output types unavailable | Cannot verify Row 7 wiring completeness | Extract full Part 8 from untruncated spec |
| G-3 | Event-Driven Execution Model section not in extracted text | Per-Resonator transaction contract unverifiable | Extract full section |
| G-4 | Part 7 (Memory Compositions — recency as Line property, compaction Resonator, distillation Resonator) truncated | Memory lifecycle wiring unverifiable | Extract full Part 7 |
| G-5 | Part 6 (Watchpoints — structural defences and limitations) truncated | Watchpoint wiring to structural review unverifiable | Extract full Part 6 |
| G-6 | ΨH Hypothetical API incomplete | R3.5 — ergonomic API does not exist; infrastructure only | Engineering milestone, not blocking |
| G-7 | ΨH Frequency and Scope dimensions not implemented | R3.7 — requires cross-Bloom episode analysis | Engineering milestone, not blocking |

---

## Summary Statistics

| Category | Requirements Extracted | Fully Specified | Partially Specified (truncation) |
|----------|----------------------|-----------------|----------------------------------|
| Row 1: Bootstrap | 5 | 5 | 0 |
| Row 2: Signal Conditioning | 3 | 1 | 2 |
| Row 3: ΨH Computation | 8 | 7 | 1 |
| Row 4: εR Aggregation | 9 | 9 | 0 |
| Row 5: Hierarchical Health | 12 | 12 | 0 |
| Row 6: Line Conductivity | 7 | 7 | 0 |
| Row 7: Structural Review | 5 | 2 | 3 |
| Row 8: Graph Persistence | 6 | 6 | 0 |
| Cross-Cutting | 3 | 2 | 1 |
| **Total** | **58** | **51** | **7** |

All 7 partially-specified requirements are due to spec truncation (Parts 4, 6, 7, 8). The available specification text is internally consistent across all cross-references checked. No contradictions found between sections.