# Codex Signum — Engineering Bridge

## Implementation Constraints and Parameter Guide

**Version:** 3.0-draft
**Companion to:** Codex Signum v5.0 (canonised at `e1f6d88`)
**Audience:** Implementors, coding agents, deployment engineers
**Date:** 2026-03-14

---

## What This Document Is

This document translates the Codex Signum specification into concrete engineering rules, parameter values, and safety constraints. If you are building an implementation, follow this document. If you need to understand *why* a rule exists, read the Codex — but you should never need to read the Codex to know *what* to build.

The Codex defines the grammar. This document tells you how to compute the grammar's properties in practice. The Bridge View Principle (Part 1.1) constrains what may appear in these computations.

**What changed from v2.0:** This version codifies the Bridge View Principle — every formula must be a pure function of grammar-defined morpheme states and axiom-defined parameters. Seven formula corrections applied from the M-17.1 delta report, including the critical dampening safety fix (F-1). Writes against a live graph of 2,425 nodes with full morpheme identity, Constitutional Bloom, INSTANTIATES wiring, and governance Resonator enforcement. New sections: Line Conductivity (three-layer circuit model), Governance Resonators (Instantiation, Mutation, Line Creation), Remedy Archive (immune memory repair), Dimensional Profiles (partitioned ΦL), Superposition Operational Mechanics (instance lifecycle, three collapse modes, persistence). Glossary rewritten from scratch against v5.0. Remaining structural reframing lands in M-17.5–M-17.6.
---

## Part 1: Foundational Principle

**State Is Structural.** Every component's health, activity, and relationships must be derivable from properties stored in the same graph where its relationships live. Health is not computed *about* the system in a separate monitoring layer — it is expressed *in* the system's own structure.

**In practice:** Your graph database (Neo4j, or whatever serves) is the single source of truth for both component relationships and component health. Do not create separate health databases, monitoring tables, or status caches. The graph *is* the state.

**What this means:**

- When recording an execution outcome, write it to the graph, not to a separate log file.
- When querying a component's health, derive it from structural properties in the graph — not from a cached score in a JSON file.
- When a component degrades, its structural properties change in-graph. That change *is* the degradation signal.

**Perceptual advantage, not information-theoretic:** The advantage of structural encoding is perceptual — pre-attentive parallel processing enables faster anomaly detection than serial text-log reading. It is not an information-theoretic compression advantage. Shannon entropy applies regardless of representation. Implementations should maintain full-precision backing stores alongside any visual encoding, with the visual layer serving human observation and the backing store serving machine processing and audit.

---

## Bridge View Principle

**Every Engineering Bridge formula MUST be expressible as a pure function of grammar-defined morpheme states and axiom-defined parameters.**

No Bridge formula may introduce state, thresholds, entities, or temporal behaviour not grounded in the symbolic grammar. If a formula references a quantity, that quantity must be:

1. **A morpheme property** defined in the grammar (ΦL, ΨH, εR, content, status, seedType, lineType, etc.)
2. **An axiom-defined parameter** with a fixed recommended value (γ_base, safety_budget, hysteresis_constant, cascade_depth_limit, etc.)
3. **A topological derivation** computable from the graph structure (branching factor k, containment depth, Line count, λ₂, etc.)

If a formula references anything else — an entity not in the grammar, a threshold without axiomatic grounding, temporal behaviour not derivable from observation Seeds — it fails the Bridge View Principle and must be either grounded or removed.

**Audit criterion:** For every formula `f` in this document, it must be possible to write:

```
f(morpheme_states, axiom_parameters, topology) → result
```

where `morpheme_states` are properties on nodes and relationships in the graph, `axiom_parameters` are constants defined in the Codex spec, and `topology` is derivable from graph structure via Cypher queries.

**Origin:** Discovered during M-8A (session t15). This single principle resolved nine M-8A recommendations (F-2, F-4, F-7, AI-03, AI-07, AI-09, C-03, C-07, C-10). Codified in M-17.2.

---

## Part 2: Computing the Three State Dimensions

### ΦL — Health Score

A composite score from 0.0 to 1.0. Computed as:

```
ΦL = wâ‚ × axiom_compliance +
     w₂ × provenance_clarity +
     w₃ × usage_success_rate +
     w₄ × temporal_stability

where wâ‚ + w₂ + w₃ + w₄ = 1.0
```

**Recommended weights:** wâ‚ = 0.4, w₂ = 0.2, w₃ = 0.2, w₄ = 0.2

**Factor definitions:**

| Factor | How to compute | Notes |
|---|---|---|
| axiom_compliance | Fraction of 8 axioms satisfied (A1–A4, A6–A9) | Includes grammar rule adherence (the former `grammar_alignment_factor` now lives here) |
| provenance_clarity | 0.0 = unknown origin, 1.0 = full chain documented | Can you trace any output back to its input, model, and execution context? |
| usage_success_rate | Fraction of invocations completing without error | From sliding window of recent observations |
| temporal_stability | Consistency of ΦL over the observation window | Low variance = stable |

**Maturity modifier:**

```
ΦL_effective = ΦL_raw × maturity_factor

maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
```

At 50+ observations and 3+ connections, maturity_factor approaches 1.0. At 0 observations or 0 connections, it approaches 0.

**Recency weighting:**

```
observation_weight = e^(-λ × age)
```

Set λ based on rate of change. Model performance: half-life of days to weeks. Schema definitions: half-life of months. Compaction threshold: discard raw observations when weight < 0.01 (statistical contribution already absorbed into running averages).

**Sliding window implementation:** Use count-based ring buffers with subtract-on-evict for O(1) snapshot retrieval. Window sizes should be topology-dependent:

| Node type | Window size N | Rationale |
|---|---|---|
| Leaf / function | 10–20 | Fast local response |
| Intermediate / pattern | 30–50 | Balance sensitivity with stability |
| Root / coordinator | 50–100 | Stability against individual child fluctuations |

**Adaptive thresholds — maturity-indexed:**

```
maturity_index = min(1.0,
    0.25 × normalize(mean_observation_depth) +
    0.25 × normalize(connection_density) +
    0.25 × normalize(mean_component_age) +
    0.25 × normalize(mean_ΦL_ecosystem)
)
```

| Threshold | Young (MI < 0.3) | Maturing (0.3–0.7) | Mature (MI > 0.7) |
|---|---|---|---|
| ΦL healthy | > 0.6 | > 0.7 | > 0.8 |
| ΦL degraded | < 0.4 | < 0.5 | < 0.6 |
| εR stable range | 0.10–0.40 | 0.05–0.30 | 0.01–0.15 |
| ΨH dissonance | > 0.25 | > 0.20 | > 0.15 |

**Threshold learning:** Thresholds themselves are learnable parameters. Track false positives (healthy things that failed), false negatives (sick things rated healthy), and oscillation events (components flapping near a threshold). Feed these into a calibration process operating monthly to quarterly.

### ΨH — Harmonic Signature (Two-Component)

**This replaces the v1.0 `grammar_alignment_factor` approach entirely.**

ΨH is computed from two independent components of the composition's graph:

**Component 1 — Structural Coherence (λ₂):**

```
L = D - A    (graph Laplacian)
λ₂ = second-smallest eigenvalue of L
```

For typical compositions of 3–20 components, this is a few milliseconds of computation. Use any standard linear algebra library (NumPy, LAPACK, etc.).

| λ₂ | State | Meaning |
|---|---|---|
| Near 0 | Fragile | Single point of failure in connectivity |
| Moderate | Connected | Multiple paths; can sustain connection loss |
| High | Robust | Densely connected; structurally over-determined |

"Near 0" / "moderate" / "high" are relative to composition size. Normalise by dividing by the expected λ₂ for a composition of that size and maturity.

**Component 2 — Runtime Friction (TV_G):**

```
TV_G(x) = Σ(i,j)∈E  aᵢⱼ × (xᵢ - xⱼ)²

friction = mean([TV_G(x) / max_TV_G(x) for x in monitored_signals])
```

Compute per signal (latency, confidence, success rate, ΦL). Normalise to [0, 1].

| Friction | State | Action |
|---|---|---|
| < 0.2 | Resonant | Normal operation |
| 0.2–0.5 | Working | Monitor |
| 0.5–0.8 | Strained | Investigate; flag for structural review |
| > 0.8 | Dissonant | Composition is fighting itself; redesign |

**Composite ΨH:**

```
ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)
```

Runtime friction weighted higher because it reflects actual operational coherence.

**Pre-composition resonance check:** Before committing to a new composition, compute λ₂ of the proposed subgraph. If it falls below the maturity-indexed threshold, flag as structurally fragile. This is not a gate — it is a visible warning. Cost: trivial (single eigenvalue of a small matrix).

**Key diagnostic signal:** High λ₂ + high friction = the most informative dissonance. The graph says components *should* work together but operationally they don't. Investigate: different processing speeds, incompatible output formats, semantic drift.

### εR — Exploration Rate

```
εR = exploratory_decisions / total_decisions
```

Over a rolling observation window.

| εR | Status | Action |
|---|---|---|
| 0.0 | Rigid | **Warning.** Force minimum exploration. |
| 0.01–0.10 | Stable | Normal. Light exploration. |
| 0.10–0.30 | Adaptive | Active learning. Expected when environment changes. |
| > 0.30 | Unstable | Confidence collapsed or system is very new. Investigate. |

**Critical rule:** High ΦL with zero εR is a warning, not a success.

**Imperative gradient modulation:**

```
εR_floor = base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient))
```

Recommended `gradient_sensitivity`: 0.05–0.15. When Ω gradients are positive, the modulation term is zero.

**Spectral calibration (complementary signal):**

```
εR_floor = max(
    base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient)),
    min_εR_for_spectral_state(spectral_ratio)
)
```

| Spectral Ratio | Minimum εR |
|---|---|
| > 0.9 | 0.05 |
| 0.7–0.9 | 0.02 |
| 0.5–0.7 | 0.01 |
| < 0.5 | 0.0 |

### Dimensional Profiles — Partitioned ΦL by Task Classification

**Source:** v5.0 §Dimensional Profiles.

#### What They Are

Composite ΦL decomposed by task classification: ΦL_code, ΦL_reasoning, ΦL_analysis, etc. Not new state dimensions — partitioned views of existing observations.

#### How Observation Seeds Are Tagged

Each observation Seed in the Grid carries a task classification tag (e.g., `taskClass: "code"`, `taskClass: "reasoning"`). Patterns define their own classifications — the spec defines the mechanism, patterns define the vocabulary.

#### How Partitioned ΦL Is Computed

Filter the observation Grid by task classification tag. Run the same four-factor ΦL formula on the partition:

```
ΦL[task_class] = w₁ × axiom_compliance[task_class] +
                 w₂ × provenance_clarity[task_class] +
                 w₃ × usage_success_rate[task_class] +
                 w₄ × temporal_stability[task_class]
```

Same weights, same maturity modifier, but computed over a subset of observations. This is a query against the observation Grid, not a stored property. Profiles are ephemeral computations, recomputed on demand.

Passes Bridge View Principle: pure function of observation Seeds (morpheme state in Grid) + ΦL weights (axiom parameters) + task classification tag (morpheme property).

#### How the Thompson Router Reads Them

When selecting a model Resonator for a task, the router reads the dimensional profile matching the task's classification, not the composite ΦL. A model may have high composite ΦL but low ΦL_reasoning — the router should select based on ΦL_reasoning for a reasoning task.

#### How They Feed Layer 3

Line conductivity contextual fitness (see Line Conductivity Part, Layer 3) reads dimensional profiles from both endpoints' observation Grids, comparing them for the specific task classification being processed. The friction computation uses partitioned ΦL, not composite ΦL.

---

## Part 3: Degradation Cascade — CONTAINS Line Properties

When a component degrades, the effect propagates through the pattern network. This propagation follows defined rules to prevent both silent failure (degradation invisible) and panic cascading (one failure collapses everything). All cascade mechanics are properties of CONTAINS Lines — the same morpheme that carries containment, scope, and structural derivation.

### 3.1 Propagation as Line Properties

Degradation propagates through Lines — the same morpheme that carries data flow, signal transfer, and harmonic coupling. The propagation rules are properties of Lines, not separate mechanisms. Two propagation modes:

- **Through CONTAINS Lines:** Parent ΦL is structurally derived from children — this is not signal flow through a Line but structural derivation from the topology. The parent recomputes its own ΦL from its children's values.
- **Through FLOWS_TO Lines:** Degradation propagates forward (producer → consumer) as signal flow — a degraded producer's output carries that degradation to the consumer.
- Degradation does **not** propagate sideways through Resonance Lines.

### 3.2 Attenuation (G4: Weight)

Each CONTAINS Line carries a dampening weight — the fraction of the child's ΦL change that propagates to the parent. The weight is computed from the parent Bloom's branching factor:

```
γ_effective = min(γ_base, safety_budget / k)
```

Where `γ_base = 0.7`, `safety_budget = 0.8`, `k` = branching factor (count of CONTAINS Lines into this Bloom). This is a property of the Line, computed from the Bloom's topology. The formula guarantees spectral radius μ = k × γ ≤ 0.8 < 1 for all k ≥ 1 — failures attenuate faster than they accumulate regardless of topology.

| Branching Factor (k) | γ_effective (s=0.8) | μ = k×γ | Status |
|---|---|---|---|
| 1 | 0.7 | 0.7 | Subcritical ✓ |
| 2 | 0.4 | 0.8 | Subcritical ✓ |
| 3 | 0.267 | 0.8 | Subcritical ✓ |
| 5 | 0.16 | 0.8 | Subcritical ✓ |
| 10 | 0.08 | 0.8 | Subcritical ✓ |

**Why this matters:** γ=0.7 is supercritical for all tree topologies with branching factor ≥ 2. The budget-capped formula ensures the system is intrinsically subcritical: failures attenuate faster than they accumulate. This single formula handles all topologies including high-degree nodes — no separate hub formula exists.

> **History:** Prior formulas (v1: `0.8/(k-1)`, v2: separate high-degree formula) were found supercritical for k ≥ 3. Budget-capped formula `min(γ_base, s/k)` is the only topology-independent subcriticality guarantee. See Safety Analysis paper and commit `ce0ef96`.

### 3.3 Depth Limit (Containment Traversal)

**2 levels. This is not negotiable.** It is the primary safety mechanism, not a convenience.

Degradation propagates through at most two levels of CONTAINS Lines. A failing Seed dims its Bloom. A failing Bloom dims its containing Bloom. The containing Bloom recomputes its own ΦL from its constituents with the signal already attenuated. The 2-level depth limit is a property of CONTAINS Line propagation, not a separate rule.

Without the 2-level limit at k=2, the expected cascade size converges to 5.0 nodes (geometric series with μ=0.8); with the depth limit, it drops to 1 + μ + μ² = 2.44 nodes. The formula guarantees convergence — cascade size is bounded for all topologies.

### 3.4 Asymmetric Rate (G2: Direction Encodes Flow)

**Recovery is 2.5× slower than degradation.** (Changed from 1.5× in v1.0.)

The CONTAINS Line carries different attenuation for degradation versus recovery:

- Degradation propagates at `γ_effective`
- Recovery propagates at `γ_effective / hysteresis_constant` (recommended: 2.5)

Same Line, same property, different values depending on signal direction. Recovery requires sustained improvement — the system resists oscillation between healthy and degraded.

**Why 2.5×:** The 1.5× ratio from v1.0 is below Schmitt trigger engineering standards. For Gaussian noise with EWMA smoothing (α=0.2) and σ=0.05, filtered noise V_pp ≈ 0.10. The hysteresis band should be 0.20–0.30 (2–3× V_pp). At 1.5× V_pp = 0.15, the system is vulnerable to flapping under bursty or non-stationary noise. 2.5× provides margin for real-world conditions.

**Implementation:** Use separate thresholds for degradation and recovery:

```
degradation_threshold = 0.50    (or maturity-indexed equivalent)
recovery_threshold = degradation_threshold × 2.5 = 0.75
```

Additionally, require state persistence: N consecutive observations beyond threshold before state transition (recommended N = 3–5). This acts as debouncing.

### 3.5 Algedonic Bypass

When a component's ΦL drops below 0.1 (emergency threshold), the CONTAINS Line's dampening weight overrides to 1.0 — full propagation to root, bypassing all attenuation. This preserves cascade safety for normal operations while ensuring existential threats are never masked. The bypass is a property of the Line activated by the child's ΦL value, not a separate mechanism.

### 3.6 Cascade Behaviour Summary

| Property | Mechanism | Value |
|---|---|---|
| Attenuation | CONTAINS Line weight | γ_effective = min(0.7, 0.8/k) |
| Depth limit | CONTAINS Line traversal | 2 levels |
| Asymmetric rate | Directional attenuation | Degradation: γ, Recovery: γ/2.5 |
| Algedonic bypass | Weight override | γ → 1.0 when child ΦL < 0.1 |
| Propagation direction | Line type | CONTAINS: structural derivation. FLOWS_TO: forward signal. No sideways. |

### Recovery Model

Recovery dampening should be linear with a cap, not exponential:

```
recovery_delay = base_delay × (1 + 0.2 × failure_count)
capped at: 10 × base_delay
```

Where failure_count is the number of degradation events for this component in the current observation window. α ∈ [0.15, 0.25] is the accumulation rate.

**Exponential backoff with jitter for retry timing:**

```
actual_delay = random(0, min(base × 1.5^attempt, 300_seconds))
```

Full jitter is mandatory (reduces server load by >50% vs. synchronised backoff per AWS architecture guidance). Cap at 300 seconds (5 minutes) to prevent indefinite isolation.

**Half-open state for recovery:** After backoff period, run 5–10 trial probes before declaring recovery. This matches the circuit breaker pattern (Resilience4j).

---

## Line Conductivity — Three-Layer Circuit Model

**Source:** v5.0 §Line (Conductivity subsection).

Conductivity determines whether signals flow before conditioning processes them. A Line is not a passive connection — it is a circuit that closes only when both endpoints satisfy the requirements for that connection. Insert this evaluation between cascade propagation (Part 3) and signal conditioning (Part 4): degradation propagates through conductive Lines; signals flow through conductive Lines into the conditioning pipeline.

### Layer 1 — Morpheme Hygiene (Binary: conducts or dark)

Both endpoints must satisfy their morpheme contract. This is N-8 (content-for-all): `content` is required on ALL six morpheme types. A Bloom's content describes its scope/purpose; a Resonator's content describes its transformation; a Grid's content describes what it stores; a Helix's content describes its iteration behaviour. Empty strings are rejected.

**Required properties check (all morpheme types):**

- `content` — required on all six morpheme types. Non-empty.
- `status` — required (planned/active/complete/archived)
- `phiL` — required (0.0–1.0)
- INSTANTIATES relationship to Constitutional Bloom — required (structural coupling intact)

**Cypher pattern for hygiene check:**

```cypher
MATCH (a)-[line:FLOWS_TO|CONTAINS|DEPENDS_ON]->(b)
WHERE a.content IS NOT NULL AND a.content <> ''
  AND b.content IS NOT NULL AND b.content <> ''
  AND a.status IS NOT NULL
  AND b.status IS NOT NULL
  AND a.phiL IS NOT NULL
  AND b.phiL IS NOT NULL
  AND EXISTS { (a)-[:INSTANTIATES]->(:Bloom {name: 'Constitutional Bloom'}) }
  AND EXISTS { (b)-[:INSTANTIATES]->(:Bloom {name: 'Constitutional Bloom'}) }
RETURN line, true AS hygienePass
```

If either endpoint fails any check, the Line is topologically present but dark. No signal flows. This is the structural enforcement that makes tampering self-defeating — stripping a Seed's provenance darkens every Line connected to it.

**TypeScript interface:**

```typescript
interface HygieneResult {
  passes: boolean;
  failures: string[];  // e.g. ['endpoint_a: missing content', 'endpoint_b: no INSTANTIATES']
}
```

### Layer 2 — Grammatical Shape (Binary: conducts or dark)

The Line's connection type must be grammatically valid for both endpoints:

- **G2 Direction:** FLOWS_TO Lines carry signal in one direction. The source morpheme must produce output of the type the target morpheme accepts.
- **G3 Containment:** CONTAINS Lines flow from enclosing scope to enclosed element. Parent must be a Bloom. Child can be any morpheme type.
- **G4 Signal type:** The Line's signal type (data, control, observation, feedback) must match what both endpoints support.

**Valid connection patterns per morpheme type:**

| Source | Target | Via | Validity |
|---|---|---|---|
| Resonator output | Seed (result) | FLOWS_TO | Valid — transformation produces data |
| Seed (data) | Resonator input | FLOWS_TO | Valid — data feeds transformation |
| Bloom | Any morpheme | CONTAINS | Valid — scope contains elements |
| Any | Any | DEPENDS_ON | Valid — dependency declaration |
| Seed | Seed | FLOWS_TO | Valid — data pipeline |
| Grid | Resonator | FLOWS_TO | Valid — stored data feeds computation |
| Resonator | Grid | FLOWS_TO | Valid — transformation writes to storage |
| Helix | Resonator | FLOWS_TO | Valid — iteration governor triggers transformation |

### Layer 3 — Contextual Fitness (Continuous: friction value)

Beyond hygiene and grammar, the Line's friction profile reflects how well the endpoints' dimensional properties align for the specific work being done.

**How dimensional profiles are read:**

- Query both endpoints' observation Grids, filtered by the current task classification tag
- Compute partitioned ΦL for each endpoint on the relevant task dimension (see Dimensional Profiles in Part 2)
- Friction = f(dimensional distance between endpoints' profiles for the task classification)

**Friction computation:**

```
friction = 1.0 - min(ΦL_source[task_class], ΦL_target[task_class])
```

Where `ΦL_source[task_class]` is the partitioned ΦL of the source endpoint for the current task classification. High friction (→1.0) means at least one endpoint has low dimensional ΦL for this task type. The Line conducts but poorly — visible friction.

Friction is continuous, not binary. A Line with friction 0.8 conducts but signals the system exactly where compensation is needed. This is the input to the Remedy Matching Resonator (see Part 7: Immune Memory Repair).

**TypeScript interface:**

```typescript
interface ConductivityResult {
  layer1: HygieneResult;
  layer2: { passes: boolean; reason?: string };
  layer3: { friction: number; taskClass: string };
  conducts: boolean;          // layer1.passes && layer2.passes
  effectiveFriction: number;  // 0 if !conducts, else layer3.friction
}
```

### Caching and Invalidation

Conductivity is a cached property on the Line (v5.0: "Between re-evaluations, conductivity is a cached property on the Line"). Re-evaluate when:

- Either endpoint's structural properties change (via the Mutation Resonator — see Governance Resonators)
- Either endpoint's ΦL crosses a threshold boundary
- A new observation changes a dimensional profile for the relevant task classification
- The Line is newly created (via the Line Creation Resonator — see Governance Resonators)

Between invalidation triggers, the cached value is used. Implementation detail: cache as a property on the relationship in Neo4j (`conductivity: number, conductivityValid: boolean, lastEvaluated: datetime`).

### Cross-References

- **Governance Resonators:** the Line Creation Resonator evaluates conductivity at write time
- **Dimensional Profiles (Part 2):** Layer 3 reads profiles from observation Grids
- **Signal conditioning pipeline (Part 4):** processes signals that flow through conductive Lines (Part 4 will be reframed as named Resonators in M-17.5)
- **Part 3 (Degradation Cascade):** degradation cascade propagates through conductive CONTAINS Lines

---

## Governance Resonators — Instantiation, Mutation, Line Creation

**Source:** `instantiation-mutation-resonator-design.md` and the live implementation at `src/graph/instantiation.ts`.

### Architecture

Three governance Resonators live **as siblings** within the Constitutional Bloom. They are contained by the Constitutional Bloom (via CONTAINS Lines), not by each other. Each Resonator has associated observation Grids that are also siblings within the Constitutional Bloom — the Grids are connected to the Resonators via FLOWS_TO Lines, NOT contained by the Resonators. (Resonators do not contain — v5.0 §Morpheme Interaction Rules.)

```
Constitutional Bloom (○)
├── CONTAINS → Instantiation Resonator (Δ)
├── CONTAINS → Mutation Resonator (Δ)
├── CONTAINS → Line Creation Resonator (Δ)
├── CONTAINS → Instantiation Grid (□)  ← FLOWS_TO from Instantiation Resonator
├── CONTAINS → Mutation Grid (□)       ← FLOWS_TO from Mutation Resonator
├── CONTAINS → Line Creation Grid (□)  ← FLOWS_TO from Line Creation Resonator
├── CONTAINS → Grammar Seeds (•)       (axiom definitions, morpheme type definitions)
└── ...
```

### Instantiation Resonator (Δ)

- **Invoked by:** `instantiateMorpheme()` in `src/graph/instantiation.ts`
- **Input Lines:** creation request with morpheme type, required properties, content
- **Validates:** content is present and non-empty (all six morpheme types — N-8), required properties per type, content semantics per type:
  - Seed content: describes the data unit
  - Bloom content: describes scope/purpose
  - Resonator content: describes the transformation
  - Grid content: describes what it stores
  - Helix content: describes iteration behaviour
  - Line: content not required (Lines are connections, not data)
- **Creates:** morpheme instance with all properties + INSTANTIATES Line to Constitutional Bloom
- **Writes to Instantiation Grid:** creation event Seed (timestamp, morpheme type, creator, success/failure, failure reason if applicable)
- **Rejects:** creation without content, creation without required properties

### Mutation Resonator (Δ)

- **Invoked by:** `updateMorpheme()` in `src/graph/instantiation.ts`
- **Input Lines:** mutation request with target node, property changes
- **Validates:** mutation preserves required properties (cannot null content, status, etc.)
- **Executes:** property updates on target node
- **Auto-propagates:** parent Bloom status from children (all-complete → complete, some-complete → active, none → planned)
- **Writes to Mutation Grid:** mutation event Seed (timestamp, target, properties changed, old/new values)

### Line Creation Resonator (Δ)

- **Invoked by:** `createLine()` in `src/graph/instantiation.ts`
- **Input Lines:** creation request with source, target, line type
- **Evaluates:** Line conductivity at write time (cross-reference Line Conductivity Part) — Layers 1 and 2 must pass for the Line to be created as conductive. Layer 3 friction is computed and cached.
- **Creates:** relationship in Neo4j with conductivity cache properties
- **Writes to Line Creation Grid:** creation event Seed (timestamp, source, target, line type, initial conductivity)

### ΦL for Governance Resonators

What makes a governance Resonator healthy vs degraded:

- **Usage success rate:** fraction of invocations completing without error (the primary factor)
- **Rejection rate:** rate of rejected creation/mutation requests — high rejection may indicate upstream problems, not Resonator problems
- **Validation latency:** time from request to completion — degradation if latency increases
- **Error pattern:** repeated errors of the same type indicate a systematic problem

These are computed from the observation Grid (Instantiation/Mutation/Line Creation Grid) using the standard ΦL four-factor formula.

### Anti-Pattern Connection

This is the structural fix for the Compliance-as-Monitoring anti-pattern. When ALL graph writes route through these three Resonators, violations are structurally impossible. The seven killed monitoring overlays (Model Sentinel, Observer, dashboard, computed views, CLAUDE.md rules, conformance tests, creation layer checks) are all replaced by these three functions. Checking is unnecessary when the creation layer prevents non-compliance.

---

## Superposition Operational Mechanics — Instance Lifecycle and Collapse

**Source:** v5.0 §Superposition (grammar permission), `concurrent-pattern-topology-v3.md` §Superposition During Execution (instance creation, concurrent governance, collapse, persistence).

### S.1 — Grammar Fact

v5.0 §Superposition establishes five grammar facts about superposition:

1. The grammar permits multiple simultaneous instances of the same composition.
2. Each instance INSTANTIATES the same constitutional definition.
3. Each instance has its own ΦL, ΨH, εR — independent state dimensions.
4. Each instance shares a composition signature (same structural topology) but is spatially distinct.
5. Instances collapse to a single result through a selection or synthesis mechanism.

These are grammar facts — they define what is structurally permitted. Everything below specifies the operational mechanics: how to create instances, govern them concurrently, collapse them, and persist the results.

### S.2 — Instance Creation

When a DISPATCH Resonator (or any spawning mechanism) creates superposed instances, each instance is a separate Bloom containing the pattern's morpheme topology. Each instance Bloom has:

- **Its own concurrent governance morphemes:**
  - Its own Refinement Helix — with an INSTANTIATES Line to the Constitutional Bloom carrying the iteration bound. The Helix connects to the Assayer Resonator within the instance; the Assayer IS the Helix's evaluation mechanism (per CPT v3).
  - Its own ΨH Resonator — computing harmonic signature from the instance's internal subgraph.
  - Its own per-Resonator ΦL computation — each Resonator within the instance has independent health.
  - Its own observation Grid — accumulating execution Seeds specific to this instance.
- **Its own ΦL, ΨH, εR** — computed independently. One instance may be healthy while another degrades.
- **Its own spatial position** — spatially distinct, visible as echoes of each other through shared composition signature and constitutional reference.

All instance creation routes through the Instantiation Resonator (see Governance Resonators Part). No raw graph writes for instance Blooms.

#### Spawning Event Recording

The spawning event is recorded as a Seed in the parent pattern's observation Grid, carrying:

- **Instance count** — how many parallel instances were created
- **Triggering context** — which task, which substrates (model Resonators)
- **Spawn timestamp** — provenance (A4)
- **Thompson posterior state at spawn time** — which model beliefs led to this exploration decision

#### Interaction with Thompson Sampling

εR determines how many instances to spawn — higher εR permits more parallel exploration. Thompson posteriors determine which substrates to explore by sampling from belief distributions. Instance count is bounded by the εR budget: spawning IS exploration. When εR hits its upper bound (maturity-indexed per Part 2), no additional instances may be created.

```
instance_count = f(εR, posterior_variance)
```

Where `posterior_variance` measures how uncertain the Thompson beliefs are across available substrates. High variance (uncertain which model is best) combined with high εR (exploration budget available) produces more instances. Low variance (beliefs have converged) produces fewer, regardless of εR budget.

Passes Bridge View Principle: pure function of εR (state dimension), posterior distributions (observation Grid contents), and εR bounds (axiom parameters).

### S.3 — Concurrent Execution Governance

Each instance's governance evaluates independently:

- A grammar violation in Instance A does not affect Instance B's execution.
- Refinement is local to each instance's Bloom boundary (G3 — containment scopes intentional effects).
- Each instance accumulates its own observation history in its own Grid.

#### Parent-Level Observation

The parent pattern's governance morphemes observe all instances. The parent's ΨH Resonator sees the subgraph including all instance Blooms. If instances diverge significantly (one healthy, one degrading), the runtime friction between instance Blooms' FLOWS_TO Lines to the collapse Resonator is high — the Lines connecting divergent instances to the collapse point show visible strain in Layer 3 contextual fitness (see Line Conductivity Part, Layer 3).

This is the superposition equivalent of decomposition drift: instances started from the same task but produced structurally different results. The friction is a structural signal, not a monitoring overlay — it is a property of the Lines themselves.

### S.4 — Collapse Mechanics

The collapse is a Resonator (Δ). It takes Lines from each superposed instance and produces a single output Line. Three collapse modes exist, each with distinct input/output/health semantics.

#### Selection Collapse (Thompson Sampling)

- **Input Lines:** output Lines from each instance Bloom, carrying the instance's result and its governance-computed ΦL.
- **Output Line:** single result Line carrying the selected output.
- **Collapse Resonator ΦL:** computed from selection quality — the ratio of selected output ΦL to the best available ΦL across all instances. A perfect selection (chose the best) yields high ΦL. A suboptimal selection (chose poorly, discovered retrospectively) degrades.
- **Unselected outputs:** persist as Stratum 2 observation records (see S.5). Their results update Thompson posteriors — the model tried and its result was observed, even though it wasn't selected.

The selected output's ΦL — computed inline by the instance's own concurrent governance — feeds directly into the selection decision. A dim instance (low ΦL from governance-detected issues) is structurally less likely to be selected. Concurrent governance within each instance directly influences the collapse decision without a separate quality assessment step.

```
collapse_ΦL = selected_instance_ΦL / max(all_instance_ΦL)
```

Passes Bridge View Principle: pure function of instance ΦL values (morpheme states) computed by governance Resonators.

#### Racing Collapse (First-Complete)

- **Input Lines:** output Lines from each instance Bloom. The collapse Resonator activates as soon as any instance's output Line carries data.
- **Output Line:** single result Line carrying the first-completed output.
- **Collapse Resonator ΦL:** reflects selection quality. If the first-completed instance had low ΦL (its governance detected issues), this ΦL propagates through the collapse Resonator to the parent pattern — the parent dims because the selected output was structurally suspect.
- **Unselected outputs:** instances that complete after the collapse still produce output. These persist as Stratum 2 records and update Thompson posteriors.

```
collapse_ΦL = first_complete_instance_ΦL × completion_confidence
```

Where `completion_confidence` reflects whether the first-complete instance finished significantly faster than others (high confidence — it was straightforward) or barely beat the next (low confidence — racing was essentially random selection).

Passes Bridge View Principle: pure function of instance ΦL (morpheme state) and completion timestamps (observation Seed properties).

#### Synthesis Collapse (Merge)

- **Input Lines:** output Lines from multiple (or all) instance Blooms. The collapse Resonator waits for a configurable subset of instances before activating.
- **Output Line:** single merged result Line combining outputs from multiple instances.
- **Collapse Resonator ΦL:** reflects merge quality and conflict resolution. High ΦL when instance outputs are complementary (low friction between merged results). Low ΦL when instance outputs conflict (high friction, requiring lossy resolution).
- **Unselected outputs:** not applicable — synthesis uses all contributing instances. Non-contributing instances (timed out or failed) persist as Stratum 2 records.

Applicable when instances process complementary aspects of the same task. The synthesis Resonator's merge function is task-type-specific — text tasks may concatenate, structured data tasks may merge fields, analytical tasks may combine perspectives.

```
synthesis_ΦL = 1 - (conflict_count / total_merge_points) × conflict_severity
```

Passes Bridge View Principle: pure function of instance outputs (morpheme states) and conflict detection (structural comparison of output Seeds).

#### Collapse Observation Recording

The collapse Resonator records each collapse decision as an observation Seed in its own Grid, carrying:

- Which instance was selected (or which contributed to synthesis)
- Selection criterion values: posterior beliefs, ΦL values, completion timestamps
- Quality delta between selected and non-selected outputs (where measurable)
- Collapse mode used

This feeds Scale 2 learning about collapse strategy itself: is selection outperforming racing for this task type? Are synthesis merges introducing conflicts that degrade quality? The Learning Helix governing the parent pattern reads these observations to adjust future collapse mode selection.

### S.5 — Persistence (Stratum 2)

After collapse, instances transition from Stratum 1 (active execution) to Stratum 2 (observation records):

- **Instance Blooms' observation Grids** persist as execution records — the full history of what each instance did, how its governance responded, what it produced.
- **Governance morpheme outputs** persist alongside: Refinement Helix iteration counts, ΨH trajectories showing coherence evolution, ΦL histories showing health during execution. These are Stratum 2 data.
- **Non-selected outputs are NOT deleted.** They persist as Stratum 2 records that feed Scale 2 learning. The persistent data answers: which substrates produce the best results for which task types? Which substrates trigger more governance refinements?

#### Memory Topology Integration

- **Recency weighting** applies to persisted instance data. Recent instances weighted higher per the standard exponential decay: `weight = e^(-λ × age)` (see Part 7 memory sizing).
- **Compaction Resonator** eventually consolidates old instance records. Individual execution details decay; aggregate statistics (success rate by substrate, friction patterns by task type) persist into Stratum 3.
- **Dimensional profiles** (see Dimensional Profiles section in Part 2) accumulate across ALL instances — a model Resonator's ΦL_code builds from every instance where it was the substrate, not just the instances whose output was selected. Non-selected instance observations still carry dimensional signal.

### S.6 — Interaction with Existing Mechanisms

| Mechanism | Part/Section | Interaction |
|---|---|---|
| Line conductivity | Line Conductivity Part | Instance output Lines are evaluated for conductivity at all three layers. Dark Lines from instances with hygiene failures (Layer 1) or shape mismatches (Layer 2) don't reach the collapse Resonator. Layer 3 friction from dimensional profile misalignment carries through. |
| Governance Resonators | Governance Resonators Part | All instance Bloom creation goes through the Instantiation Resonator. Instance morpheme mutations go through the Mutation Resonator. Instance output Lines go through the Line Creation Resonator. |
| Degradation cascade | Part 3 | Instance ΦL propagates through CONTAINS Lines to the parent pattern's ΦL via the collapse Resonator. Standard dampening applies: `γ_effective = min(0.7, 0.8/k)` where k is the parent's branching factor including instance Blooms. Cascade depth limit of 2 applies from the instance Bloom outward. |
| Dimensional profiles | Part 2 (Dimensional Profiles) | Instance observations contribute to substrate dimensional profiles. A model's ΦL_reasoning accumulates from all instances, not just winners. Thompson reads these profiles for future selection. |
| Remedy Archive | Part 7 (Immune Memory Repair) | If an instance repeatedly fails on a task dimension, the friction signal from its output Lines triggers remedy matching — potentially instantiating a compensatory morpheme for future instances of that task type. |
| Signal conditioning | Part 4 | Instance observation streams flow through the seven-stage signal conditioning pipeline before feeding aggregate computations. Each instance's observations enter the pipeline independently. |
| Structural Review | Part 8 | Instance Bloom creation IS a topology change — adds nodes and edges to the graph. This triggers λ₂ recomputation and may activate the Structural Review Resonator if coherence shifts beyond the maturity-indexed threshold. |
| Thompson sampling | (M-17.6 — future) | Collapse results update Thompson posteriors for the selected substrate. Non-selected instance results also update posteriors — the model tried, its result was observed, the posterior learns from both selected and non-selected outcomes. |

---

## Part 4: Signal Conditioning Pipeline

Raw health events should be processed through this seven-stage pipeline before being used for threshold decisions:

| Stage | Purpose | Parameters |
|---|---|---|
| 1. **Debounce** | Suppress duplicate events | Within 100ms; require persistence for 2–3 event intervals |
| 2. **Hampel filter** | Reject outliers | 7-point window (k=3); flag where \|x − median\| > 3 × 1.4826 × MAD; replace with local median |
| 3. **EWMA smoothing** | Noise reduction | S_t = α·x_t + (1−α)·S_{t-1}; α = 0.25 for leaves, 0.15 default, 0.08 for hubs |
| 4. **CUSUM monitoring** | Detect mean shifts | C_t = max(0, C_{t-1} + x_t − μ₀ − δ/2); threshold h ≈ 4–5 |
| 5. **MACD derivative** | Rate-of-change detection | Difference of fast EWMA (α=0.25) and slow EWMA (α=0.04) |
| 6. **Hysteresis threshold** | Prevent flapping | Alarm ON when S_t < T_low; OFF when S_t > T_high; band ≥ 2× V_pp |
| 7. **Trend regression** | Predictive warning | Linear fit over 30–50 events; alarm if projected time-to-threshold < warning horizon |

**The derivative term (Stage 5) is critical.** Absolute thresholds detect degradation only after crossing a fixed level. Rate-of-change detection identifies rapid degradation *before* the threshold is reached. A system degrading from ΦL = 0.9 to 0.6 in 5 events is far more alarming than one at steady ΦL = 0.55.

**Early warning signals for cascading failure (from critical slowing down theory):**

- Variance increases — reduced recovery rate causes health fluctuations to grow
- Autocorrelation increases — health signals become more serially correlated
- Cross-component correlation rises — previously independent failure signals begin correlating (strongest cascade predictor)

---

## Part 5: Visual Encoding Constraints

All six visual channels derive from two computations:

1. **State dimensions** (ΦL, ΨH, εR) → brightness, hue, pulsation frequency, saturation
2. **Graph Laplacian eigendecomposition** → hue (eigenmode profile), pulsation phase (v₂), spatial position (v₂/v₃/v₄)

The eigendecomposition is computed once and produces ΨH (scalar from λ₂), harmonic profile for hue (eigenmode shape), phase offsets for animation (v₂), and spatial coordinates for layout (v₂/v₃/v₄). Six perceptual outputs from two computations. The visual encoding is not six independent channels — it is two structural computations made perceptually available through six pre-attentive visual channels.

**Channel summary:**

| Channel | Maps To | Computation | Type |
|---|---|---|---|
| Brightness | ΦL | Direct mapping | State dimension |
| Hue | Harmonic character from ΨH eigenmode profile | Eigendecomposition | State dimension + topology |
| Pulsation frequency | Activity rate | Observation count per window | State dimension |
| Pulsation phase | Structural position on primary axis | `normalize(v₂[i]) × 2π` | Topology |
| Saturation | εR | `min(1.0, εR / 0.3)` | State dimension |
| Spatial position | Spectral embedding | `(v₂[i], v₃[i], v₄[i])` | Topology |

### Channel 1 — Brightness → ΦL

The primary health channel. Use 5–10 discriminable levels (Weber-Fechner limits discrimination to ~7–8 bits per channel, but practical discrimination with background variation is lower). Map linearly: bright = healthy, dim = degraded, dark = dead.

### Channel 2 — Hue → Harmonic Character (ΨH Eigenmode Profile)

Hue encodes continuous harmonic character derived from the ΨH eigenmode profile — the shape of a component's participation across the graph Laplacian's eigenvectors. Components that participate similarly in the graph's harmonic structure receive similar hues. Components with different structural roles receive different hues. The mapping is continuous, not categorical.

Color semantics are NOT culturally universal — pulsation and luminance have stronger cross-cultural grounding. Avoid relying on red/green distinctions (colour vision deficiency affects ~8% of males). Never use hue as the sole encoding channel.

Passes Bridge View Principle: pure function of eigenmode profile (topological derivation from graph Laplacian).

### Channel 3 — Pulsation Frequency → Activity Rate

**SAFETY CRITICAL: All pulsation must be 0.5–3 Hz.** The 8–15 Hz range, while perceptually salient, overlaps with the peak epilepsy risk zone (5–30 Hz, peak at 15–20 Hz per Epilepsy Foundation). WCAG 2.3.1 mandates no more than 3 flashes per second. Section 508 prohibits flickering between 2–55 Hz. ISO 9241-391 harmonises with these standards.

| Urgency | Pulsation Rate |
|---|---|
| Low / heartbeat / normal | 0.5–1 Hz |
| Moderate / active | 1–2 Hz |
| Critical / alert | 2–3 Hz |

The "calming heartbeat" association at 1 Hz is design intuition (resting heart rate = 60–80 bpm = 1.0–1.3 Hz), not established science. Higher pulse rates increase perceived urgency — this is well-supported.

### Channel 4 — Saturation → εR

```
saturation = min(1.0, εR / εR_saturation_ceiling)
```

Where `εR_saturation_ceiling = 0.3` (axiom-defined parameter — the boundary between adaptive and unstable from the εR status table in Part 2).

| εR | Saturation | Visual Semantics |
|---|---|---|
| 0.0 | 0.0 | Grey — rigid (warning state: "High ΦL with zero εR is a warning, not a success") |
| 0.05 | 0.17 | Lightly coloured — stable |
| 0.15 | 0.50 | Moderate — adaptive |
| 0.30 | 1.0 | Fully vivid — at stability boundary |
| >0.30 | 1.0 (clamped) | Saturated — unstable (εR numeric carries remaining discrimination) |

Design note: at εR = 0.0, saturation = 0.0 produces a bright grey node (bright from high ΦL, desaturated from zero exploration). This is perceptually distinctive and semantically correct — "healthy but dangerously rigid." The mapping produces the right visual warning without special-casing.

Additional note: at low saturation, hue discrimination degrades (desaturated colours converge toward grey). This is acceptable — rigid components (low εR) are less differentiated, which matches semantic meaning.

Passes Bridge View Principle: pure function of εR (morpheme state) + εR_saturation_ceiling (axiom parameter).

### Channel 5 — Pulsation Phase → ΨH Eigenvector Position

```
phase_i = normalize(v₂[i]) × 2π

where normalize(v₂[i]) = (v₂[i] - min(v₂)) / (max(v₂) - min(v₂))
```

v₂ is the Fiedler eigenvector (eigenvector corresponding to λ₂ of the graph Laplacian). v₂ values are real-valued and can be negative — the normalisation maps the full range to [0, 1] before scaling to [0, 2π].

All nodes share a global animation clock. Node i pulses as:

```
brightness(t) = base + amplitude × sin(2π × freq × t + phase_i)
```

Structurally coherent nodes have similar v₂ values → similar phases → pulse nearly in sync. Structurally distant nodes have different v₂ values → different phases → visible phase offset. The phase difference IS structural distance made perceptually available through animation synchrony.

Minimum discriminable phase offset at 1–2 Hz animation: ~π/6 (30°), within the 150ms pre-attentive detection window. Note: phase discrimination degrades at lower frequencies. At 0.5 Hz ("heartbeat" range from the pulsation table), a π/6 phase offset is ~333ms — still perceptible but at the edge of pre-attentive. This is a design constraint for pulsation frequency selection.

Redundant encoding note: v₂ also provides the x-coordinate for spatial position (Channel 6). Phase and horizontal position encode the same structural axis through two independent perceptual channels (animation synchrony and spatial proximity). This is intentional reinforcement, not accidental duplication. Redundant encoding across channels increases legibility.

Passes Bridge View Principle: pure function of v₂ (topological derivation from graph Laplacian).

### Channel 6 — Spatial Position → Spectral Embedding

```
x_i = v₂[i]    (Fiedler eigenvector — primary structural axis)
y_i = v₃[i]    (third eigenvector — secondary structural axis)
z_i = v₄[i]    (fourth eigenvector — depth axis for 3D/M-13 WebGL)
```

Computation: graph Laplacian L = D − A, eigendecomposition Lv = λv, use v₂, v₃, v₄ as coordinate axes. Viewport scaling (how to map eigenvector coordinates to screen pixels) is a rendering concern — belongs in the Rendering Specification, not the Bridge.

Structurally similar nodes cluster together. Disconnected components separate. The embedding is a pure function of graph adjacency.

Global vs local: spectral embedding produces coordinates optimal for global graph structure but can produce poor local layouts (overlapping nodes within dense clusters). Local refinement (force-directed adjustment, overlap removal) is a rendering concern deferred to the Rendering Specification. The Bridge specifies the computation that produces global layout coordinates.

Passes Bridge View Principle: pure function of graph Laplacian eigenvectors (topological derivation).

### Perceptual Grounding

| Channel | Grounding | Notes |
|---|---|---|
| Pulsation | Strong (innate) | Vertebrate "life detector"; no learning required |
| Spatial proximity | Strong (Gestalt) | "Close items go together" is near-universal |
| Luminance | Moderate | Brightness-positive valence is broadly cross-cultural; specific health mapping must be learned |
| Phase synchrony | Moderate | Coordinated motion is pre-attentive; specific phase-as-structure mapping must be learned |
| Saturation | Moderate | Vivid = active is broadly intuitive; specific εR mapping must be learned |
| Color | Weak | Highly culture-specific; never use as sole encoding channel |

### Working Memory Constraints

**Visual working memory is 3–4 integrated objects, not 7.** Miller's 7±2 applies to verbal short-term memory. Operators cannot actively hold more than ~4 glyph states in working memory simultaneously. For monitoring displays with dozens of elements, rely on pre-attentive pop-out to flag state changes rather than expecting operators to maintain continuous awareness.

Graph visualisation working memory constraint: at any zoom level, the visible graph elements must respect Miller's 7±2 limit. v5.0's semantic zoom model manages this — far zoom shows fewer elements at lower detail (Bloom boundaries only), near zoom shows more elements at higher detail (internal morphemes visible). The constraint applies to visible elements per zoom level, not total graph size. Design for "overview first, zoom and filter, then details-on-demand" (Shneiderman's mantra).

**Multi-layered interpretation:** 2–3 layers is the practical ceiling for general users. Specialist systems can support 3–5 layers with trained operators. Implement adaptive display: novice mode with explicit labels and simpler states; expert mode with denser information. A single fixed display cannot optimally serve both populations (expertise reversal effect — Kalyuga et al. 2003).

---

## Part 6: Seven CAS Vulnerability Watchpoints

These are architectural vulnerabilities identified by the Complex Adaptive Systems literature review. They are not bugs to fix — they are structural risks to monitor.

### 1. HOT Fragility (Highly Optimised Tolerance)

Any optimised system is hypersensitive to unanticipated perturbations. **This is a mathematical inevitability of optimisation, not a risk to eliminate.** Explicitly catalogue what the system is robust to and what it is fragile to. Monitor for perturbation types outside the designed-for set.

### 2. Cascading Failures in Interdependent Subsystems

Interdependent networks undergo first-order (abrupt) phase transitions, not gradual degradation. Broader degree distributions *increase* vulnerability (opposite of isolated networks). **Mitigation:** Reduce coupling strength between subsystems. The topology-aware dampening and 2-level cascade limit are the primary defences. Monitor for correlated failures across subsystem boundaries.

### 3. Complexity Catastrophe

As epistatic interactions increase relative to system components in NK models, reachable fitness optima converge toward mean fitness. **Keep interaction complexity moderate.** Modular design (low inter-module coupling, higher intra-module coupling) preserves navigability. Monitor adaptive walk lengths: if improvements require increasingly many steps, the landscape is too rugged.

### 4. Lock-In and Path Dependence

Use-based selection without diversity-maintenance mechanisms is vulnerable to Matthew effects and premature convergence (demonstrated in MusicLab studies). **Mitigation:** εR minimum floor (never zero); challenge seeds for mature networks; diversity metrics on pattern compositions.

### 5. Parasitic Pattern Propagation

Patterns that satisfy selection criteria (high ΦL) without providing genuine utility. They game the metrics. **Detection:** High pattern turnover with no Ω gradient improvement. New patterns structurally similar to predecessors (ΨH within 0.05). Rising compute cost without rising capability.

### 6. Inadequate Measurement

Emergence claims without measurement frameworks are unfalsifiable. **Required:** Power-law testing via Clauset et al. methodology before claiming scale-free properties. Critical slowing down indicators (Scheffer et al.) for cascade approach warning. Do not claim emergence without measurable evidence.

### 7. Emergence Inflation

The gap between CAS theory and CAS engineering remains unsolved. Holland's ECHO model failed to produce emergent hierarchical complexity. **Approach:** Build for utility at current scale. Do not design for hypothetical emergence. If emergence occurs, measure it. If it doesn't, the system is still useful.

### Cross-Reference: v5.0 Structural Mechanisms

Several watchpoints now have structural defences specified in v5.0. The risks remain valid — the defences are structural mitigations, not eliminations.

| Watchpoint | v5.0 Structural Mechanism |
|---|---|
| Cascading failures (#2) | §Event-Triggered Structural Review — cascade activation trigger. Immune memory (Threat + Remedy Archives) provides CAS-native defence. |
| Lock-in (#4) | εR floor computation (imperative gradient modulation + spectral calibration) |
| Parasitic patterns (#5) | Ω gradient inversion trigger in Structural Review Resonator. Immune memory provides CAS-native defence. |
| Inadequate measurement (#6) | §Structural Signatures (Merkle hash, position calculation) |

---

## Part 7: Memory Sizing Guide

| Stratum | Records Per | Record Size | Growth Rate | Retention |
|---|---|---|---|---|
| 1. Ephemeral | Execution | 1–10 KB | Constant (replaced per execution) | Seconds to minutes |
| 2. Observational | Component | 100–500 bytes | ~N obs/day per component | Rolling window (~5× half-life) |
| 3. Distilled | Composition | 1–5 KB per insight | ~1 per learning cycle | Months to years |
| 4. Institutional | Ecosystem | 5–50 KB per archetype | ~1 per evolution cycle | Years |

**Example sizing (100 active components, 20 compositions, 2-week half-life):**

- Stratum 2: ~100 × 70 days × 10 obs/day × 300 bytes ≈ 20 MB (rolling, not growing)
- Stratum 3: ~20 × 50 insights × 3 KB ≈ 3 MB (growing slowly)
- Stratum 4: ~100 archetypes × 25 KB ≈ 2.5 MB (growing very slowly)

Total active memory: ~25 MB. Stratum 2 is bounded by the compaction window, not by time.

### Immune Memory Repair — Remedy Archive

**Source:** v5.0 §Immune Memory (Gap Response, Compensatory Morpheme Lifecycle, Runaway Control, Cold Start).

#### Remedy Archive Grid (□)

Stratum 3 memory, alongside the Threat Archive. Contains compensatory pattern Seeds, each carrying:

- **Friction profile** — dimensional shape: which task classifications had high friction, and at what magnitude
- **Morpheme configuration** — the type, properties, and wiring pattern that resolved it
- **Confidence score** — increases with successful reuse, decreases with age without use

Storage sizing: larger than generic "insights" — each entry is a gap-plus-fix pair with dimensional friction profiles. Plan for 10–100 entries per active pattern Bloom, growing with system maturity.

#### Remedy Matching Resonator (Δ)

**Input:** friction profiles from Lines whose Layer 3 friction exceeds threshold.

**Matching algorithm:** Compare incoming friction profile's dimensional shape against archived remedies. Match on task classification overlap and friction magnitude similarity.

**Three output paths:**

| Match Quality | Action |
|---|---|
| Strong match | Instantiate compensatory morpheme from matched remedy (through Instantiation Resonator — see Governance Resonators Part) |
| Partial match | Speculative instantiation — low confidence, monitored closely |
| No match | Produce capability gap Seed + escalation signal. "I need something I don't have." |

ALL compensatory morpheme creation goes through the Instantiation Resonator. No raw graph writes.

#### Compensatory Morpheme Lifecycle

**Birth.** Instantiated from Remedy Archive at friction site. Near-zero ΦL (cold start per maturity modifier). Contained within the pattern Bloom (G3 — effects are local). Wired into the circuit between the weak point and the consumer.

**Trial.** Observations accumulate in its Grid. Monitored metrics: did Line friction drop? Did downstream ΦL improve?

**Survival.** ΦL rises → morpheme persists, becomes part of pattern's structural topology. Remedy Archive confidence for that entry increases.

**Dissipation.** ΦL doesn't rise → Lines go dark, morpheme's observations persist in Grid as a lesson ("this compensation didn't work for this gap type"). Prevents retrying the same failed remedy.

#### Runaway Control

Four structural bounds prevent compensatory morpheme runaway:

| Bound | Mechanism |
|---|---|
| εR budget | Speculative instantiation IS exploration — consumes εR budget. When εR hits upper bound (0.3), no more speculative creations. |
| ΦL drag | Each compensatory morpheme starts near-zero ΦL — drags parent Bloom's aggregate ΦL down. Too many speculative children = Bloom dims. |
| G3 containment | Compensatory morpheme contained within pattern Bloom. Effects are local. |
| Archive-only | System can only instantiate from LEARNED patterns. Recombination from experience, not novel invention. |

#### Cold Start

Archive starts empty. All friction exceeding threshold follows the "no match" → escalation path initially. Operator resolves friction (manually inserting a compensatory morpheme, reconfiguring the circuit, or accepting the friction). When the compensatory morpheme survives, the gap-plus-fix pair is distilled into the Remedy Archive. Archive accumulates organically from resolved escalations. Same learning pathway as Threat Archive.

#### Interaction with Threat Archive

Same containing Bloom (immune memory Bloom), same Learning Helix governing both Grids, same distillation mechanism. The Threat Matching Resonator handles defence (what to fight). The Remedy Matching Resonator handles repair (what to fix). Two separate Resonators sharing infrastructure, each with its own authority scope (A6), its own ΦL, its own observation history.

---

## Part 8: Structural Review Trigger Conditions

Structural reviews are event-triggered, not scheduled. Run one when any of these fire:

| Trigger | Threshold | What to compute |
|---|---|---|
| λ₂ drop on composition change | Below maturity-indexed threshold | Full spectral analysis |
| Friction spike | Sustained above 0.5 beyond Refinement Helix temporal constant | Friction distribution across all compositions |
| Cascade activation | Degradation reaches 2nd containment level | Hub dependency analysis |
| εR spike at composition level | Above maturity-indexed stable range | Spectral ratio and aligned/liberal energy |
| ΦL velocity anomaly | > 0.05/day ecosystem-wide | Global λ₂ and spectral gap |
| Ω gradient inversion | Any gradient negative after sustained positive | Full review |

**Review outputs feed existing feedback, not new channels:** Hub dependency → Scale 2 routing. Dampening recommendations → Calibration. Friction hotspots → Scale 2 evaluation. Global λ₂ trend → Scale 3 ecosystem health.

---

## Part 9: Adversarial Resilience Parameters

### Anomaly Detection Thresholds

| Signal | Normal Range | Anomaly |
|---|---|---|
| Node creation rate | Seasonal/usage patterns | > 3σ spike above rolling mean |
| Connection formation rate | Proportional to node creation | Disproportionate to node creation |
| Mean ΦL velocity | < 0.05/day | > 0.1/day |
| Variance of ΨH values across compositions | Stable or slowly increasing | Sudden collapse toward uniform value |
| Federation gossip volume | Proportional to activity | Disproportionate spike |

### Bulkhead Responses

When the ecosystem stress index exceeds the warning threshold, the **Ecosystem Stress Resonator** (Δ) activates bulkhead responses. These are stress responses expressed as Line property and Resonator configuration changes — not external interventions.

**Ecosystem Stress Resonator morpheme identity:**

- **Name:** Ecosystem Stress Resonator
- **Containment:** within an Ecosystem Monitoring Bloom
- **Input Lines:** from anomaly detection thresholds (the signals in the anomaly detection table above)
- **Output:** bulkhead activation Seeds + Line property override commands
- **Its own ΦL:** derived from detection accuracy (false positive/negative rate over time)

| Response | Structural Mechanism | Recovery |
|---|---|---|
| Federation isolation | Line property change — connection remains, transmission dampened (conductivity override on the Line) | Lift when behaviour returns to normal range |
| Acceptance rate limiting | Resonator configuration change — Instantiation Resonator applies throughput constraint | Ease back to normal over days, not hours |
| Cascade dampening override | CONTAINS Line γ value reduction: `γ_override = γ_effective × stress_reduction_factor` (stress_reduction_factor = 0.5 during stress) | Restore when stress index returns to normal |
| Provenance weighting increase | ΦL computation weight change (w₂ temporarily elevated) | Restore gradually |

Bulkhead activations are recorded as event Seeds in the observation Grid — carrying the stress index value, the activated responses, and the timestamp. These Seeds feed Scale 2 learning about what attack patterns look like and how effective the responses were.

**Recovery from attack is deliberately slow.** Match hysteresis principle: 2.5× longer to restore normal operation than to engage defences. This prevents snap-back vulnerability to follow-up attacks.

---

## Part 10: Pattern-Level Guidance

These are pattern design considerations — guidance for building good patterns using the Codex grammar. They are NOT part of the Codex specification. They belong here because they inform implementation decisions.

### Rolled Throughput Yield (RTY)

For multi-stage patterns, track the product of per-stage success rates:

```
RTY = Π(stage_success_rate for each stage)
```

RTY reveals hidden rework. A 3-stage pipeline with 95% per-stage success has RTY = 0.857, not 0.95. If any stage requires refinement loops, include refinement success rate in the computation.

### Error Classification (Poka-Yoke Levels)

When implementing error handling in patterns, classify by severity and appropriate response:

| Level | Error Type | Pattern Response |
|---|---|---|
| Prevention | Invalid input detected before processing | Reject at Bloom boundary; emit validation failure |
| Detection | Error caught during transformation | Refinement Helix retry with structured feedback |
| Mitigation | Error propagated but contained | Reduce ΦL; route around via εR sampling |
| Escape | Error reached output | Degradation signal; cascade to container |

### Failure Mode Analysis

For critical patterns, enumerate failure modes and their structural signals:

| Failure Mode | ΦL Signal | εR Signal | ΨH Signal |
|---|---|---|---|
| Model degradation | usage_success_rate drops | May spike (exploring alternatives) | Friction increases on latency/quality |
| Data drift | temporal_stability drops | Should spike (environment changed) | λ₂ unchanged; friction increases |
| Integration failure | axiom_compliance drops | No change | λ₂ may drop; friction high |
| Capacity exhaustion | temporal_stability drops (latency variance) | Should remain stable | No change |

Component-level failure modes aggregate into composition-level trajectory signatures at Bloom scope. See v5.0 §Scale Escalation for the six trajectory signatures (Stagnation, Refinement Futility, Coherence Fracture, Vitality Spiral, Phase Lock, Healthy Oscillation).

---

## Anti-Patterns

For the foundational anti-pattern taxonomy, see Codex Signum v5.0 §Anti-Patterns. The implementation anti-patterns below are specific to Bridge computations and engineering decisions.

**Separate monitoring database.** Do not create a health-scores cache that is the source of truth. Caching is acceptable for performance; the graph is always authoritative. (Cross-ref: v5.0 Monitoring Overlay)

**Morpheme labels on code.** Do not add `morphemeType: 'seed'` fields. The morpheme type *is* the structure — a function is a Seed because of what it does, not because of a label. (Cross-ref: v5.0 Prescribed Behaviour)

**Assigned resonance.** Do not set `ΨH = 0.95` as a property. Resonance emerges from structural coherence (λ₂) and operational friction (TV_G). You compute it; you don't assign it. (Cross-ref: v5.0 Prescribed Behaviour)

**Silent routing around failure.** When a component fails and the router switches to an alternative, this must be a visible event. The system's users need to know adaptation is happening. (Cross-ref: v5.0 A2 Visible State)

**Forced revival of archived components.** If a component has been dimming through disuse, do not forcibly revive it. Either reconnect it intentionally or let it archive naturally.

**Immediate blacklisting.** A single failure should not permanently exclude a component. Selection pressure (reduced ΦL, lower sampling probability) achieves gradual quarantine.

---

## Glossary

| Codex Term | Engineering Equivalent |
|---|---|
| Seed (•) | Atomic data unit — observation, decision record, configuration, task, prompt template |
| Line (→) | Connection with conductivity — data flow, transformation, feedback path. Three-layer evaluation (hygiene, shape, fitness). |
| Bloom (○) | Scope boundary — pipeline, execution context, milestone, service boundary |
| Resonator (Δ) | Transformation — LLM/AI model, pipeline stage, signal conditioning, governance enforcement |
| Grid (□) | Persistent data structure — observation history, archived signatures, remedy entries, threat archetypes |
| Helix (🌀) | Feedback loop — refinement retry, learning cycle, evolutionary selection |
| ΦL | Health score — 4-factor composite (axiom compliance, provenance clarity, usage success, temporal stability) × maturity modifier |
| ΨH | Harmonic signature — λ₂ (structural coherence) + TV_G (runtime friction). Temporal decomposition: EWMA trend + friction_transient + friction_durable |
| εR | Exploration rate — fraction of decisions sampling uncertain alternatives. Floor modulated by imperative gradients and spectral calibration. |
| γ_effective | Topology-aware dampening — min(γ_base, safety_budget/k) where γ_base=0.7, safety_budget=0.8, k=branching factor (CONTAINS Line count). Property of the CONTAINS Line. |
| Line conductivity | Three-layer circuit evaluation: morpheme hygiene (binary), grammatical shape (binary), contextual fitness (continuous friction). Cached on Line, invalidated on endpoint change. |
| Constitutional Bloom | Organisational core — contains grammar definition Seeds, axiom Seeds, governance Resonators, governance observation Grids |
| INSTANTIATES Line | Structural coupling — connects every morpheme instance to its definition in the Constitutional Bloom |
| Dimensional Profile | Partitioned ΦL by task classification — ephemeral computation (query against observation Grid), not stored state |
| Remedy Archive | Stratum 3 Grid of learned repair patterns — friction profiles paired with successful compensatory morpheme configurations |
| Governance Resonator | Instantiation, Mutation, Line Creation — the three Resonators in the Constitutional Bloom that enforce all graph writes |
| Luminance | Health visibility — bright = healthy, dim = degraded, dark = dead |
| Saturation | Exploration visibility — vivid = exploring, grey = rigid. Maps εR via min(1.0, εR/0.3) |
| Pulsation phase | Structural synchrony — phase offset from normalize(v₂) × 2π. Coherent nodes pulse in sync. |
| Spectral embedding | Spatial layout — coordinates from graph Laplacian eigenvectors (v₂, v₃, v₄). Global structure. |
| Dormant | Built but not connected — exists but not wired into active flow |
| Hysteresis | Asymmetric CONTAINS Line attenuation — recovery at γ_effective / 2.5, degradation at γ_effective |
| Cascade limit | 2-level CONTAINS Line depth limit — primary safety mechanism |
| Maturity index | 4-factor composite modulating thresholds — observation depth, connection density, component age, ecosystem ΦL |
| TV_G | Graph Total Variation — measures signal smoothness across connections |
| λ₂ | Fiedler value — algebraic connectivity of graph Laplacian |

---

*This document derives from Codex Signum v5.0 (canonised at e1f6d88, 2026-03-12). The Bridge View Principle governs all formulas: every computation must be a pure function of grammar-defined morpheme states and axiom-defined parameters. The Codex defines the grammar. This document defines how to compute the grammar's properties. When in doubt about implementation, follow this document. When in doubt about intent, read the Codex.*
