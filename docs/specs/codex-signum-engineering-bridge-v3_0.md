# Codex Signum — Engineering Bridge

## Implementation Constraints and Parameter Guide

**Version:** 3.1
**Companion to:** Codex Signum v5.0 (canonised at `e1f6d88`, updated 2026-03-22)
**Audience:** Implementors, coding agents, deployment engineers
**Date:** 2026-03-22

---

## What This Document Is

This document translates the Codex Signum specification into concrete engineering rules, parameter values, and safety constraints. If you are building an implementation, follow this document. If you need to understand *why* a rule exists, read the Codex — but you should never need to read the Codex to know *what* to build.

The Codex defines the grammar. This document tells you how to compute the grammar's properties in practice. The Bridge View Principle (Part 1.1) constrains what may appear in these computations.

**What changed from v2.0:** This version codifies the Bridge View Principle — every formula must be a pure function of grammar-defined morpheme states and axiom-defined parameters. Seven formula corrections applied from the M-17.1 delta report, including the critical dampening safety fix (F-1). Writes against a live graph of 2,425 nodes with full morpheme identity, Constitutional Bloom, INSTANTIATES wiring, and governance Resonator enforcement. New sections: Line Conductivity (three-layer circuit model), Governance Resonators (Instantiation, Mutation, Line Creation), Remedy Archive (immune memory repair), Dimensional Profiles (partitioned ΦL), Superposition Operational Mechanics (instance lifecycle, three collapse modes, persistence), Event-Driven Execution Model (Resonator activation contract, per-Resonator transactions, concurrency management, migration path). Part 4 reframed: signal conditioning stages become seven named Resonators within a Signal Conditioning Bloom with intra-run/cross-run temporal scale distinction. Part 8 reframed: structural review triggers become input Lines to the Structural Review Resonator with five diagnostic output types. Morpheme shape derivation added to Part 5. Glossary rewritten from scratch against v5.0. M-17.6 additions: Part 7 reframed as morpheme compositions (recency = Line property, compaction = Resonator, distillation = Resonator). Part 6 reframed with structural defences and limitations per watchpoint. ΨH temporal decomposition (N-4) and composition-scope εR (N-5) added to Part 2. Build experience section: Thompson informed priors, context-blocked posteriors, exploration decay, hallucination detection (three-layer), CLAUDE.md governance. Deferred computation details verified against source: ΦL temporal_stability, εR spectral calibration, εR floor formula, ΨH hypothetical state. Vertical wiring specification: 8-row interface contract. M-17 complete. v3.1 (2026-03-22): Part 4 reframed — signal conditioning functions are inline computation within the observation write path, not separate Resonator nodes in the graph. Aligns with v5.0 §Transformation vs Structural Derivation (2026-03-22). Superposition ΨH references updated. Glossary updated.
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

### ΨH Temporal Decomposition

**Source:** v5.0 §ΨH Temporal Decomposition, implementation at `src/computation/psi-h.ts`.

A single composite ΨH value conflates transient operational friction with durable structural misalignment. Temporal decomposition separates these signals.

#### Spec Decomposition (Target — Four Dimensions)

v5.0 decomposes ΨH along four characteristics of resonant episodes:

| Dimension | What It Measures | Computation |
|---|---|---|
| Frequency | How often resonance occurs | Count of resonant episodes (ΨH above threshold) per observation window |
| Duration | How long each resonant episode lasts | Mean episode length in observations |
| Intensity | How strong the resonance when it occurs | Mean ΨH during resonant episodes |
| Scope | How many connected patterns participate | Count of Bloom nodes with ΨH above threshold during resonant episodes |

A "resonant episode" is a contiguous window of observations where ΨH exceeds the maturity-indexed dissonance threshold (Young: 0.75, Maturing: 0.80, Mature: 0.85 — the complement of the dissonance values in the adaptive threshold table). Episodes shorter than 3 observations are noise, not resonance.

#### Implementation Decomposition (Current — Three Components)

The implementation (`decomposePsiH()` in `src/computation/psi-h.ts`) decomposes ΨH by signal temporality into three components:

| Component | What It Measures | Computation | Status |
|---|---|---|---|
| `psiH_trend` | EWMA-smoothed trend | `S_t = α × psiH_instant + (1 - α) × S_{t-1}`, α configurable (default 0.15) | ✅ Implemented |
| `friction_transient` | Short-lived operational friction | `|psiH_instant - psiH_trend|` — deviation of current value from smoothed trend | ✅ Implemented |
| `friction_durable` | Persistent structural friction | `|psiH_trend - baseline|` — drift of trend from established baseline | ✅ Implemented |

**Baseline establishment:** After `BASELINE_MIN_OBSERVATIONS` (5) observations, the EWMA trend at that point becomes the baseline. The baseline is the system's memory of what "normal" coherence looks like.

**State management:** `PsiHState` carries a ring buffer of observations, the current trend value, the established baseline, EWMA alpha, and buffer max size. The caller owns and persists the state between runs — core remains stateless.

**Integrated computation:** `computePsiHWithState()` wraps both `computePsiH()` (structural computation from graph) and `decomposePsiH()` (temporal decomposition from observation history), returning the raw PsiH, the decomposition, and the updated state in a single call.

#### Relationship Between Decompositions

The spec's four dimensions and the implementation's three components are complementary frames, not equivalent:

| Spec Dimension | Implementation Counterpart | Notes |
|---|---|---|
| Intensity | `psiH_trend` magnitude | Trend magnitude approximates mean resonance intensity |
| Frequency | No direct counterpart | Requires episode detection logic over the observation stream |
| Duration | `friction_transient` inversely | Sustained low transient friction implies long-duration episodes |
| Scope | No direct counterpart | Requires cross-Bloom analysis — counting Blooms with ΨH above threshold during episodes |

The implementation's three components are computed today. The spec's four dimensions are the target specification. Frequency and Scope require cross-Bloom episode analysis not yet implemented — these are engineering milestones, not spec gaps.

#### ΨH Hypothetical State (Projectable)

v5.0 specifies that ΨH is projectable — computable against proposed states as well as observed states. This enables "what-if" analysis: what would ΨH be if we added this Resonator, or removed that Line?

**Implementation status:** ⚠️ Partial. The `computePsiH()` function accepts arbitrary `edges` and `nodeHealths` arrays, so hypothetical computation is structurally possible — pass a proposed edge set and node health set. However, there is no dedicated hypothetical API (no `computeHypotheticalPsiH()` function that takes a current graph plus proposed mutations). The computation infrastructure exists; the ergonomic API does not.

Passes Bridge View Principle: all decomposition components are pure functions of ΨH observation history (morpheme state in observation Grid) and window parameters (axiom-defined). The EWMA alpha, baseline observation count, and ring buffer size are axiom-defined parameters.

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

### Composition-Scope εR

**Source:** v5.0 §Event-Triggered Structural Review (εR spike at Bloom boundary), Ro's design decision from M-17.1 delta report.

v5.0 specifies εR spike at Bloom boundary as one of six event triggers for structural review. Bridge v2.0 computed εR only at the component level. Composition-scope εR aggregates contained components' exploration behaviour, following the same parent-from-children derivation as ΦL.

#### Computation

```
εR_bloom = exploratory_decisions_in_bloom / total_decisions_in_bloom
```

Where decisions are Decision Seeds within the Bloom's containment scope, queried via CONTAINS traversal. A Bloom whose Resonators always select the same substrate has low εR. A Bloom distributing across substrates has high εR.

**Alternative (weighted by Resonator ΦL):**

```
εR_bloom = Σ(εR_i × ΦL_i) / Σ(ΦL_i)   for all Resonators i within the Bloom
```

This weights exploration by the health of the exploring component — a degraded Resonator's exploration contributes less to composition εR than a healthy one's. Recommended: simple ratio for clarity. Weighted variant for mature deployments where degraded Resonators should have reduced influence on composition exploration signals.

#### Structural Review Trigger

εR spike at composition level triggers structural review (see Part 8) when:

```
εR_bloom > εR_stable_range_upper
```

Where `εR_stable_range_upper` is the maturity-indexed upper bound from the adaptive threshold table (Young: 0.40, Maturing: 0.30, Mature: 0.15). A Bloom that suddenly begins exploring more than its maturity warrants signals confidence collapse — something changed that the system's learned beliefs don't cover.

#### Upward Propagation

Composition εR propagates upward through nested Blooms using the same parent-from-children derivation as ΦL, with dampening:

```
εR_parent = (1/k) × Σ(εR_child_i)   for all k children
```

No dampening coefficient is applied — εR is an observation rate, not a health signal. Averaging preserves the information. A parent Bloom's εR is the mean exploration rate across its contained compositions.

Passes Bridge View Principle: pure function of Decision Seed counts within containment (morpheme state + topology) and maturity-indexed thresholds (axiom parameters).

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
- **Signal conditioning pipeline (Part 4):** processes signals that flow through conductive Lines — seven inline conditioning functions applied within the observation write path
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
  - Its own ΨH computation — harmonic signature computed inline from the instance's internal subgraph.
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

The parent pattern's governance morphemes observe all instances. The parent's ΨH computation sees the subgraph including all instance Blooms. If instances diverge significantly (one healthy, one degrading), the runtime friction between instance Blooms' FLOWS_TO Lines to the collapse Resonator is high — the Lines connecting divergent instances to the collapse point show visible strain in Layer 3 contextual fitness (see Line Conductivity Part, Layer 3).

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
| Signal conditioning | Part 4 | Instance observation streams are processed by the seven inline conditioning functions within the observation write path before feeding aggregate computations. Each instance's observations enter the chain independently. |
| Structural Review | Part 8 | Instance Bloom creation IS a topology change — adds nodes and edges to the graph. This triggers λ₂ recomputation and may activate the Structural Review Resonator if coherence shifts beyond the maturity-indexed threshold. |
| Thompson sampling | (M-17.6 — future) | Collapse results update Thompson posteriors for the selected substrate. Non-selected instance results also update posteriors — the model tried, its result was observed, the posterior learns from both selected and non-selected outcomes. |

---

## Event-Driven Execution Model

This Part specifies the Bridge-level architecture for the concurrent execution model described in CPT v3 (Concurrent Pattern Topology). The sequential orchestrator is a transitional mechanism that this model supersedes — in the target architecture, execution coordination is a property of the topology, not of a separate control flow layer.

### E.1 — The Orchestrator Dissolves

The current `hybridAgent.ts` orchestrator (~2400 lines) sequences stage calls, manages state between stages, and calls the `afterExecution()` hook chain on completion. This orchestrator is an Intermediary Layer (v5.0 §Anti-Patterns) — a mechanism interposed between execution and the graph that claims authority the graph write path does not need it to have.

The replacement is not a different orchestrator. It is the topology itself. Each Resonator:

1. Reads from its input Lines (which carry data written by the previous Resonator)
2. Executes its transformation (calling the LLM, processing data, whatever the substrate requires)
3. Writes its output Seeds to the graph through the Instantiation Resonator (Governance Resonators Part)
4. Writes its observation Seed to the execution observation Grid
5. The next Resonator in the data dependency chain activates because its input Lines now carry data

The "orchestrator" is the data dependency DAG. Sequential behaviour emerges from which Lines carry data, not from a control flow mechanism. This is G4 (Flow — Light Movement is Data Transfer).

### E.2 — Resonator Activation Contract

A Resonator activates when ALL of its required input Lines carry data (data dependency satisfaction). This is checked after each graph write — when a Resonator writes its output, the system checks which downstream Resonators now have all inputs satisfied.

The structural contract for each Resonator:

- **Watches:** a set of input Lines (identified by Cypher pattern)
- **Executes:** its transformation when all inputs are ready
- **Writes:** output Seeds through the Instantiation Resonator, output Lines through the Line Creation Resonator
- **Records:** an observation Seed in its execution Grid

**Illustrative TypeScript realisation (one possible implementation of the contract):**

```typescript
interface ResonatorHandler {
  /** Which input Lines this Resonator watches */
  inputLineQuery: string;  // Cypher pattern matching input Lines with data

  /** The transformation function */
  execute(inputs: InputData[]): Promise<OutputData>;

  /** Write output through governance Resonators */
  writeOutput(output: OutputData): Promise<void>;

  /** Record observation */
  recordObservation(observation: ObservationData): Promise<void>;
}
```

The substrate (TypeScript/Node.js runtime) provides the event mechanism. The graph provides the coordination. Specific implementation choices (polling vs event subscription, Node.js event library, connection pooling) are implementation decisions, not Bridge specifications.

### E.3 — Neo4j Write Sequencing

**Atomic per-Resonator transactions:** Each Resonator's output is a single Neo4j transaction. Not per-pipeline — per-Resonator.

This means:

- Each Resonator's output Seeds appear in the graph within seconds of production
- The Refinement Helix evaluation of each Seed can read the graph's current state
- ΨH recomputes on each topology change (Laplacian updates as nodes and Lines appear)
- The UI (M-13) renders a live, evolving topology

**Transaction boundary per Resonator:**

```
BEGIN TRANSACTION
  -- Create output Seed(s) via Instantiation Resonator
  -- Create output Lines via Line Creation Resonator
  -- Create observation Seed via Instantiation Resonator
  -- Update Resonator's ΦL via Mutation Resonator
COMMIT
```

All writes within a single Resonator's execution are atomic. If any write fails, the entire Resonator execution rolls back. The Resonator's ΦL (usage_success_rate) reflects this.

**Idempotency:** Consistent with the existing MERGE-based approach — each write is a self-contained MERGE that can be retried safely.

### E.4 — Concurrency Management

**Data dependency resolution replaces orchestration:** The execution order is determined by the data dependency DAG, not by a sequential orchestrator. Resonators with independent inputs can execute concurrently. Resonators with shared dependencies execute in dependency order.

**Concurrent governance per instance:** Per the superposition specification (Superposition Operational Mechanics), each instance Bloom's governance morphemes operate independently. The Refinement Helix within each instance evaluates continuously — it does not wait for pipeline completion.

**Conflict resolution:** If two Resonators attempt to write to the same node simultaneously (e.g., two instances updating a shared Grid), Neo4j's transaction isolation handles it. The Bridge specifies:

- **Append-only writes (new Seeds, new Lines):** Use READ COMMITTED isolation. New Seeds never conflict with each other — each is a distinct node. Observation Grids where multiple Resonators write simultaneously are append-only and safe under READ COMMITTED.
- **Property mutations on existing nodes:** Use SERIALIZABLE isolation. Concurrent mutations to the same node (e.g., ΦL updates) must be serialised to prevent lost updates. This applies to Mutation Resonator operations.

This distinction matters for performance at scale — SERIALIZABLE serialises concurrent transactions, making shared mutable nodes bottlenecks. Keeping observation writes append-only (the common case) avoids this.

### E.5 — Migration Path from Current Implementation

The current `afterExecution()` hook chain writes everything to Neo4j in a single batch after pipeline completion. The event-driven model replaces this with incremental writes.

**Migration stages:**

| Stage | Description | What Changes |
|---|---|---|
| 1. Current state | Sequential orchestrator → batch write | Baseline |
| 2. Incremental writes | Each Resonator writes output immediately after execution | Keep orchestrator for sequencing, remove batch write |
| 3. Event-driven activation | Replace orchestrator sequencing with data dependency resolution | Resonator activates when inputs are ready |
| 4. Full concurrent model | Multiple Resonators execute concurrently where dependencies permit | Target state |

Each stage is independently deployable. The Bridge specifies the target state (stage 4). Implementation milestones can progress through stages 2–4 incrementally.

**This is specification, not implementation.** The Bridge specifies what the event-driven model looks like. Implementation details (which Node.js event library, how to poll for input Line data, connection pooling) belong in implementation milestones.

Passes Bridge View Principle: Resonator activation is a pure function of input Line data presence (morpheme state). Transaction boundaries are defined by Resonator scope (morpheme containment). Concurrency resolution uses graph topology (data dependency DAG). No entities, thresholds, or temporal behaviour outside the grammar.

---

## Part 4: Signal Conditioning — Inline Observation Processing

Raw observation streams are conditioned by seven named functions applied inline within the `writeObservation()` path. Each conditioning function processes the signal in sequence: Debounce → Hampel → EWMA → CUSUM → MACD → Hysteresis → Trend. The functions are not separate graph entities — they are what the observation write path DOES as part of recording structural state. Making each conditioning step a separate Resonator node watching the observation stream would be a monitoring overlay (see v5.0 §Transformation vs Structural Derivation).

These conditioning functions have type definitions in the Constitutional Bloom (mapped in M-9.7b). The type definitions prove grammar completeness (A7) — every conditioning function IS expressible as a Resonator composition. The implementation inlines them because instantiating each as a separate graph node would create a monitoring overlay. Their type IDs, functions, and parameters:

| Conditioning Function | Type ID | Function | Parameters |
|---|---|---|---|
| **Debounce** | `resonator:signal:debounce` | Suppress duplicate events | Within 100ms; require persistence for 2–3 event intervals |
| **Hampel** | `resonator:signal:hampel` | Outlier rejection via median absolute deviation | 7-point window (k=3); flag where \|x − median\| > 3 × 1.4826 × MAD; replace with local median |
| **EWMA** | `resonator:signal:ewma` | Exponentially weighted moving average | S_t = α·x_t + (1−α)·S_{t-1}; α = 0.25 for leaves, 0.15 default, 0.08 for hubs |
| **CUSUM** | `resonator:signal:cusum` | Cumulative sum for mean shift detection | C_t = max(0, C_{t-1} + x_t − μ₀ − δ/2); threshold h ≈ 4–5 |
| **MACD** | `resonator:signal:macd` | Rate-of-change detection | Difference of fast EWMA (α=0.25) and slow EWMA (α=0.04) |
| **Hysteresis** | `resonator:signal:hysteresis` | Prevent state flapping near thresholds | Alarm ON when S_t < T_low; OFF when S_t > T_high; band ≥ 2× V_pp |
| **Trend** | `resonator:signal:trend` | Project trajectory for early warning | Linear fit over 30–50 events; alarm if projected time-to-threshold < warning horizon |

### Parameter Grounding

The conditioning functions are inline — they do not have their own graph nodes, containment, Lines, or ΦL. What IS instantiated:

- **Type definitions:** Config Seeds in the Constitutional Bloom (`resonator:signal:debounce` through `resonator:signal:trend`), mapped in M-9.7b. These demonstrate grammar completeness (A7) — every conditioning function is expressible as a Resonator composition in the grammar. They do not mandate separate graph nodes.
- **Parameters:** Each function's tuning parameters (window sizes, α values, thresholds) are properties on the type definition Seeds in the Constitutional Bloom. Parameter calibration is a Helix operating at Scale 2.
- **Observation of conditioning quality:** Processing metrics (rejection rates, false positive rates, conditioning latency) are recorded as properties on the observation Seeds themselves — not in a separate conditioning observation Grid. The conditioned observation IS the evidence of conditioning quality.

The type definitions in the Constitutional Bloom (`resonator:signal:*`) prove grammar completeness — the A7 proof. They do not mandate separate graph nodes. See v5.0 §Transformation vs Structural Derivation.

### Intra-Run vs Cross-Run Temporal Scale

Not all seven conditioning functions are meaningful at all temporal scales. The Hampel filter requires sufficient observation window size and is primarily a Scale 2 (cross-run) mechanism. All others are applicable at both scales:

| Function | Intra-Run (Scale 1) | Cross-Run (Scale 2) |
|---|---|---|
| Debounce | ✓ Suppress duplicate evaluations during rapid topology changes | ✓ Standard |
| Hampel | ✗ Insufficient window size within a single run | ✓ Standard |
| EWMA | ✓ Smooth per-morpheme ΦL to prevent single-execution noise | ✓ Standard |
| CUSUM | ✓ Detect mean shift in coherence during execution | ✓ Standard |
| MACD | ✓ Rate-of-change detection on ΦL and coherence | ✓ Standard |
| Hysteresis | ✓ Prevent intervention flapping during execution | ✓ Standard |
| Trend | ✓ Early warning of degradation trajectory | ✓ Standard |

### Rate-of-Change Detection

**The MACD function is critical.** Absolute thresholds detect degradation only after crossing a fixed level. Rate-of-change detection identifies rapid degradation *before* the threshold is reached. A system degrading from ΦL = 0.9 to 0.6 in 5 events is far more alarming than one at steady ΦL = 0.55.

### Early Warning Signals

Early warning signals for cascading failure (from critical slowing down theory):

- Variance increases — reduced recovery rate causes health fluctuations to grow
- Autocorrelation increases — health signals become more serially correlated
- Cross-component correlation rises — previously independent failure signals begin correlating (strongest cascade predictor)

Passes Bridge View Principle: all parameters are axiom-defined constants (stored as Config Seeds in the Constitutional Bloom); all inputs are morpheme properties (observation Seeds); all outputs are morpheme properties (conditioned signal values written back to the observation path). Each conditioning function is a pure function of its input data and its axiom-defined parameters.

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

### Morpheme Shape Derivation

v5.0 grounds every morpheme's visual shape in topology — shapes are derived, not prescribed. The Bridge specifies the computation that produces shape data from topology. The Rendering Specification specifies how to draw the computed shape (maintaining the Bridge/Rendering Spec boundary established in R-3/M-17.3a).

| Morpheme | Shape Derived From | Computation |
|---|---|---|
| **Resonator (Δ)** | Input/output Line ratio | Count FLOWS_TO Lines where this Resonator is target (inputs) vs source (outputs). Ratio determines shape: many-to-one = compression, one-to-many = distribution, balanced (±20%) = relay. |
| **Grid (□)** | Internal Line topology | Classify Lines between Seeds within the Grid: temporal Lines (ordered by timestamp) = timeline shape, similarity Lines (weighted by distance metric) = cluster map shape, provenance Lines (ordered by creation chain) = archive shape. |
| **Helix (🌀)** | Iteration behaviour | Tightness = `1 / temporal_scale` (fast iterations = tight spiral, slow = loose). Convergence direction = sign of ΦL trend over last N iterations, where N = the Helix's configured iteration window (recommended default: 5; tunable per Helix instance). Positive = improving, negative = degrading, flat (\|trend\| < 0.01) = stable. Depth = iteration count. |
| **Bloom (○)** | Interface Line count | Count active FLOWS_TO Lines crossing the Bloom boundary (where one endpoint is inside, the other outside). Active interface Lines > 0 = open boundary. Zero active interface Lines = closed boundary. |
| **Seed (•)** | No shape derivation | Point. Brightness = ΦL, hue = harmonic character. |
| **Line (→)** | No shape derivation | Filament with directional flow. Visual properties from conductivity and activity. |

**Cross-reference to visual channels:** Shape derivation produces the structural data (I/O ratio, internal topology, iteration metrics, interface count). The six visual channels (brightness, hue, pulsation frequency, pulsation phase, saturation, spatial position) provide the perceptual encoding. Shape and channels together produce the complete visual identity of each morpheme. Both are topology-derived.

Passes Bridge View Principle: all shape derivations are pure functions of graph topology (Line counts, Line types, iteration metrics). No prescribed geometry. The thing IS the thing.

---

## Part 6: Seven CAS Vulnerability Watchpoints — Risks with Structural Defences

These are architectural vulnerabilities identified by the Complex Adaptive Systems literature review. They are not bugs to fix — they are ongoing engineering concerns inherent to complex adaptive systems. v5.0's mechanisms now provide structural responses to several watchpoints. The risks remain valid — the defences are structural mitigations, not eliminations.

### 1. Emergence

Any optimised system is hypersensitive to unanticipated perturbations (HOT Fragility — Highly Optimised Tolerance). This is a mathematical inevitability of optimisation, not a risk to eliminate. Explicitly catalogue what the system is robust to and what it is fragile to.

**Structural defence:** The Structural Review Resonator (Part 8) detects unexpected topology patterns — anomalous node creation rates, disproportionate connection formation, sudden ΨH variance collapse. When topology changes match known perturbation signatures, the review triggers diagnostics.

**Limitation:** Can only detect patterns with known signatures. Novel perturbation types outside the designed-for set produce no signal until their effects propagate into observable state dimension changes.

### 2. Cascading Failures in Interdependent Subsystems

Interdependent networks undergo first-order (abrupt) phase transitions, not gradual degradation. Broader degree distributions *increase* vulnerability (opposite of isolated networks).

**Structural defence:** The dampening formula guarantees subcriticality for all topologies (Part 3): `γ_effective = min(0.7, 0.8/k)` ensures μ = k × γ ≤ 0.8 < 1. Cascade depth limit of 2 (Part 3) bounds propagation. Algedonic bypass (Part 3) ensures existential threats escalate despite dampening. Immune memory (Threat + Remedy Archives, Part 7) learns from cascade events — friction profiles from cascades are archived as threat signatures, enabling faster response to recurrence.

**Limitation:** Black swan: simultaneous failures across independent Blooms not connected by CONTAINS Lines. The dampening formula guarantees subcriticality within a containment hierarchy. Correlated failures across independent hierarchies (e.g., common-mode failure of an external API affecting multiple unrelated patterns) bypass the CONTAINS Line propagation model entirely.

### 3. Component Co-Evolution

As epistatic interactions increase relative to system components in NK models, reachable fitness optima converge toward mean fitness (Complexity Catastrophe). Modular design (low inter-module coupling, higher intra-module coupling) preserves navigability.

**Structural defence:** ΨH temporal decomposition (N-4, Part 2) distinguishes earned resonance (durable coherence from genuine alignment) from coincidental resonance (transient coherence from correlated external conditions). The `friction_durable` component detects long-term co-evolutionary drift — when the baseline shifts, even if instantaneous ΨH remains high.

**Limitation:** Slow co-evolutionary drift may not trigger friction thresholds. If two components gradually specialise in ways that reduce their compatibility, the drift rate may remain below the EWMA detection threshold indefinitely. Periodic structural reviews (operator-triggered) supplement automated detection.

### 4. Lock-In and Path Dependence

Use-based selection without diversity-maintenance mechanisms is vulnerable to Matthew effects and premature convergence (demonstrated in MusicLab studies).

**Structural defence:** εR floor computation (Part 2) with imperative gradient modulation and spectral calibration prevents exploration from collapsing to zero. The floor responds to structural signals — negative Ω gradients and high spectral ratio push εR UP regardless of accumulated confidence. Structural review triggers on Ω gradient inversion (Part 8) detect when previously positive imperatives begin stalling.

**Limitation:** Lock-in at the ecosystem level (all patterns converging on the same substrates simultaneously) is harder to detect than component-level lock-in. Composition-scope εR (Part 2) helps — a Bloom whose Resonators all select the same substrate has low εR — but ecosystem-level convergence requires cross-Bloom εR analysis not yet specified.

### 5. Parasitic Pattern Propagation

Patterns that satisfy selection criteria (high ΦL) without providing genuine utility. They game the metrics.

**Structural defence:** Immune memory Threat Archive (Part 7) stores coupling effect signatures from phased harmful patterns. The Threat Matching Resonator detects recurrence via two-pass matching (structural invariants + surface variants). Ω gradient inversion trigger (Part 8) detects when new patterns arrive without improving imperatives. Boundary penalty acceleration from the Threat Archive enables faster response to known threat types.

**Limitation:** Novel parasitic topologies not yet in the Threat Archive produce no immune response. The first encounter with a new parasitic pattern is always expensive — detection relies on downstream ΦL/Ω signals, not structural recognition. The Archive learns from each encounter but cannot anticipate.

### 6. Inadequate Measurement

Emergence claims without measurement frameworks are unfalsifiable. Power-law testing (Clauset et al.) required before claiming scale-free properties. Critical slowing down indicators (Scheffer et al.) for cascade approach warning.

**Structural defence:** Structural Signatures (v5.0 §Structural Signatures) provide Merkle hash verification and position calculation. Line conductivity Layer 1 (Line Conductivity Part) performs morpheme hygiene checks — required properties present, INSTANTIATES Line intact, content non-empty. These ensure measurement integrity at the morpheme level.

**Limitation:** Measurement adequacy is self-referential — the system measures what it is configured to measure. Blind spots in the observation Grid (signals not being recorded, dimensions not being tracked) are invisible to the measurement infrastructure. External audits and operator-triggered reviews (Part 8) provide the out-of-band verification that in-band measurement cannot.

### 7. Environmental Shift

The gap between CAS theory and CAS engineering remains unsolved (Emergence Inflation). Build for utility at current scale. Do not design for hypothetical emergence. If emergence occurs, measure it. If it doesn't, the system is still useful.

**Structural defence:** Dimensional profiles (Part 2, N-3) detect task-specific performance changes — a model that was strong at code but degrades on reasoning triggers a dimensional profile shift. εR spike triggers structural review (Part 8) when the system's confidence in its substrate selection collapses, signalling that the environment has changed in ways the system's beliefs don't cover.

**Limitation:** Requires the environmental shift to affect measurable dimensions. A shift that changes the nature of what "good" means (e.g., a new compliance requirement that renders previously correct outputs non-compliant) may not produce ΦL/ΨH/εR signals until the non-compliance is observed downstream.

### Watchpoint Defence Summary

| Watchpoint | v5.0 Structural Defence | Limitation |
|---|---|---|
| #1 Emergence | Structural Review Resonator detects unexpected topology patterns | Can only detect patterns with known signatures |
| #2 Cascading failures | Dampening formula (subcriticality), cascade depth limit, algedonic bypass, immune memory | Black swan: simultaneous failures across independent Blooms |
| #3 Co-evolution | ΨH temporal decomposition distinguishes earned from coincidental resonance | Slow drift may not trigger friction thresholds |
| #4 Lock-in | εR floor (imperative gradient + spectral calibration), Ω gradient inversion trigger | Ecosystem-level convergence harder to detect than component-level |
| #5 Parasitic patterns | Immune memory Threat Archive, Ω gradient inversion, boundary penalty acceleration | Novel parasitic topologies not yet in Threat Archive |
| #6 Inadequate measurement | Structural Signatures (Merkle hash, position), Line conductivity Layer 1 hygiene | Measurement adequacy is self-referential |
| #7 Environmental shift | Dimensional profiles, εR spike triggers structural review | Requires shift to affect measurable dimensions |

---

## Part 7: Memory Strata as Morpheme Compositions

**Source:** v5.0 §Memory Topology, §Morpheme Grounding of Memory Operations.

The four memory strata are not abstract layers — they are morpheme compositions. The memory operations ARE morpheme operations. The sizing guidance below is preserved from Bridge v2.0; the framing shifts from abstract strata to the morpheme compositions that implement them.

### Recency Weighting Is a Line Property

The decay formula `e^(-λ × age)` is the weight on the Line connecting an observation Seed to the computation Resonator that reads it. The Line's weight decays with the Seed's age. This is G4 — brightness encodes recency. Older Lines are dimmer, carrying less signal.

**λ settings by morpheme type:**

| Morpheme Context | Half-Life | λ | Rationale |
|---|---|---|---|
| Model performance observations | Days to weeks | 0.05–0.10 | Models update frequently; stale observations mislead |
| Schema definitions | Months | 0.005–0.01 | Structural definitions change slowly |
| Threat Archive entries | Weeks to months | 0.01–0.03 | Threats recur; recent matches more predictive |
| Remedy Archive entries | Months | 0.005–0.01 | Successful fixes remain applicable longer |

**Line weight update:** On each read. When a computation Resonator reads from an observation Seed via a Line, the Line's weight is recomputed from the Seed's age at that moment. No scheduled batch updates — the weight is always current at read time.

**Compaction threshold:** When `e^(-λ × age) < 0.01`, the observation Seed's statistical contribution has been absorbed into running averages. The Seed is eligible for compaction.

### Compaction Is a Resonator Operation

When an observation Seed's Line weight drops below the compaction threshold (0.01), a **Compaction Resonator** (Δ) archives the Seed — it remains in the Grid but its Lines to active computation Resonators are severed.

**Compaction Resonator morpheme identity:**

- **Containment:** within the Grid's containing Bloom
- **Input Lines:** FLOWS_TO from observation Seeds whose Line weights have decayed below threshold
- **Output:** archived Seed (status → archived, Lines to active Resonators severed)
- **Its own ΦL:** computed from compaction accuracy (does compaction remove Seeds whose information is truly absorbed?) and compaction latency
- **Trigger:** observation count threshold per Grid (recommended: compact when Grid exceeds 5× half-life observation count) or on demand

**Compaction routes through the Mutation Resonator** (see Governance Resonators Part). Line severing is a mutation — the Compaction Resonator requests Line removal via the Mutation Resonator, not via raw graph writes.

### Distillation Is a Resonator Operation Between Grids

The lossy compression from Stratum 2 to Stratum 3 is a **Distillation Resonator** (Δ) reading from one Grid and writing to another. Its inputs and outputs are traceable. Its quality is measurable. Its own ΦL reflects how well it distils.

**Distillation Resonator morpheme identity:**

- **Containment:** within the composition-level Bloom (alongside the Stratum 2 and Stratum 3 Grids)
- **Input Lines:** FLOWS_TO from Stratum 2 observation Grid — reads many observation Seeds
- **Output Lines:** FLOWS_TO to Stratum 3 composition-level Grid — writes few distilled insight Seeds
- **Quality metric:** information preservation. A distilled Seed that fails to predict future observations (the insight was wrong or irrelevant) degrades the Distillation Resonator's ΦL. A distilled Seed that correctly predicts future observations strengthens it.
- **Its own ΦL:** computed from distillation quality (prediction accuracy of distilled insights), compression ratio (how much data was compressed), and freshness (are distilled insights up to date?)

### Contextual Enrichment Flows Downward Through Lines

Higher strata inform lower strata about what to pay attention to. This is not a push mechanism — it is Lines from Stratum 3/4 Seeds to Stratum 1/2 computation Resonators, carrying context that sharpens lower-strata focus.

When a Stratum 3 insight informs a Stratum 2 observation — "pay attention to this signal" — the insight Seed connects via a Line to the observation Resonator. The Line carries the contextual signal. This is the reflexive loop that Argyris identified as both the memory system's greatest strength (organising principles shape observation) and greatest vulnerability (beliefs filter data to confirm themselves). The Scale 2→3 escalation triggers exist specifically to detect when this reflexive loop has become pathological.

### Sizing Guide

| Stratum | Morpheme Home | Records Per | Record Size | Growth Rate | Retention |
|---|---|---|---|---|---|
| 1. Ephemeral | Bloom (○) + Refinement Helix (🌀) | Execution | 1–10 KB | Constant (replaced per execution) | Seconds to minutes |
| 2. Observational | Grid (□) + Learning Helix (🌀) | Component | 100–500 bytes | ~N obs/day per component | Rolling window (~5× half-life) |
| 3. Distilled | Grid (□) at composition level | Composition | 1–10 KB per insight | ~1 per learning cycle | Months to years |
| 4. Institutional | Federated Grids (□) + Evolutionary Helix (🌀) | Ecosystem | 5–50 KB per archetype | ~1 per evolution cycle | Years |

**Stratum 3 sizing note:** Record size increased from v2.0's "1–5 KB" to "1–10 KB" because Stratum 3 now includes:
- Remedy Archive entries — gap-plus-fix pairs with dimensional friction profiles (see Immune Memory Repair below)
- Immune memory archetypes — coupling effect signatures distilled from phased harmful patterns
- These are structurally richer than generic "insights"

**Neo4j storage overhead:**

| Component | Overhead Per Unit | Notes |
|---|---|---|
| Node properties | ~500 bytes | Property map storage, labels, internal ID |
| Relationship storage | ~100 bytes | Source/target pointers, type, properties |
| Datetime index | ~50 bytes per indexed property | Required for temporal queries on observation Seeds |
| Full-text index | ~200 bytes per indexed property | Optional, for content search across Seeds |

**Example sizing (100 active components, 20 compositions, 2-week half-life):**

| Stratum | Calculation | Size | Bounded By |
|---|---|---|---|
| 2. Observational | 100 components × 70 days × 10 obs/day × 300 bytes | ~20 MB | Compaction window (rolling, not growing) |
| 2. Neo4j overhead | 70,000 nodes × 500 bytes + 70,000 relationships × 100 bytes | ~42 MB | Same compaction window |
| 3. Distilled | 20 compositions × 50 insights × 5 KB | ~5 MB | Growing slowly |
| 3. Remedy Archive | 20 compositions × 50 entries × 8 KB | ~8 MB | Growing with system maturity |
| 4. Institutional | 100 archetypes × 25 KB | ~2.5 MB | Growing very slowly |

Total active memory: ~78 MB including Neo4j overhead. Stratum 2 is bounded by the compaction window, not by time.

Passes Bridge View Principle: recency weighting is a Line property (G4). Compaction and distillation are Resonator operations with structural identity. λ values are axiom-defined parameters. All sizing derives from morpheme counts and observation rates (topology + morpheme state).

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

## Part 8: Structural Review — Resonator Identity and Diagnostic Outputs

Structural reviews are event-triggered, not scheduled. They are performed by the **Structural Review Resonator** (Δ), which monitors event Seeds in the observation Grid and produces diagnostic output Seeds.

### Structural Review Resonator Morpheme Identity

- **Name:** Structural Review Resonator
- **Containment:** within the Ecosystem Governance Bloom (alongside the Ecosystem Stress Resonator from Part 9)
- **Input Lines:** FLOWS_TO from event Seeds in the observation Grid that match trigger conditions (below)
- **Output:** diagnostic Seeds written to the Structural Review Grid (□)
- **Its own ΦL:** computed from diagnostic accuracy (how often diagnostics correctly predict issues), detection latency (time from event to diagnostic), and false positive rate — fed by its own observation Grid

### Trigger Conditions (Input Lines)

The Structural Review Resonator activates when event Seeds matching any of these conditions appear on its input Lines:

| Trigger | Threshold | What It Detects |
|---|---|---|
| λ₂ drop on composition change | Below maturity-indexed threshold | Structural coherence weakened |
| Friction spike | TV_G sustained above 0.5 beyond Refinement Helix temporal constant | Runtime friction exceeding tolerance |
| Cascade activation | Degradation reaches 2nd containment level | Cascade safety limit approached |
| εR spike at composition level | Above maturity-indexed stable range | Confidence collapsed |
| ΦL velocity anomaly | > 0.05/day ecosystem-wide | Systemic health shift |
| Ω gradient inversion | Any gradient negative after sustained positive | Parasitic pattern signal |
| External event | Operator trigger or scheduled review | Manual diagnostic request |

### Diagnostic Outputs (Seeds in the Structural Review Grid)

Each diagnostic is a Seed (•) written to the Structural Review Grid (□). The Grid is CONTAINED by the Ecosystem Governance Bloom.

| Diagnostic | What It Computes | Output Seed Content |
|---|---|---|
| Global λ₂ | Current Fiedler value of the ecosystem graph | Structural coherence snapshot |
| Spectral gap | λ₃/λ₂ ratio (how cleanly the graph partitions — higher = cleaner community structure) | Community structure stability |
| Hub dependency | Max betweenness centrality / mean | Single-point-of-failure risk |
| Friction distribution | TV_G histogram across FLOWS_TO Lines | Where friction concentrates |
| Dampening topology | Current γ_effective and μ for each Bloom, highlighting any approaching the subcritical boundary (μ > 0.7) | Cascade safety map |

**Review outputs feed existing feedback, not new channels:** Hub dependency → Scale 2 routing. Dampening recommendations → Calibration. Friction hotspots → Scale 2 evaluation. Global λ₂ trend → Scale 3 ecosystem health.

Passes Bridge View Principle: triggers are morpheme property thresholds (ΦL velocity, λ₂, TV_G, εR). Diagnostics are pure functions of graph topology (eigendecomposition, betweenness centrality, Line property histograms, dampening formula). All inputs and outputs are morpheme instances with structural identity.

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
- **Containment:** within the Ecosystem Governance Bloom (alongside the Structural Review Resonator — see Part 8)
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

## Build Experience — Thompson Sampling and Pipeline Governance

Observational data from 6 months of pipeline operation. These are empirically validated parameter recommendations, not theoretical derivations.

### Thompson Informed Priors

| Scenario | Prior | Rationale |
|---|---|---|
| New model (no history) | Beta(α=1, β=1) — uniform | No information. System starts with no preference. |
| Known model (accumulated history) | Beta(α, β) from observation counts | Prior reflects accumulated evidence. α = successes + 1, β = failures + 1. |
| Model version update (e.g., Sonnet 3.5 → Sonnet 4) | Prior from old version × decay factor (0.5) | Halve effective observation count. Past performance may not predict new-version performance. |

**Prior transfer on version update:** When a model version changes, reduce confidence by multiplying both α and β by a decay factor (recommended: 0.5). This preserves the direction of the prior (which model was better) while reducing certainty (the new version might be different). A model with Beta(40, 10) after 50 observations becomes Beta(20, 5) after version update — same 80% success rate belief, but with the confidence of 25 observations instead of 50.

### Context-Blocked Posteriors

Thompson posteriors must be blocked by context (task classification). A model's posterior for code tasks should be independent of its posterior for reasoning tasks.

**Implementation:** Maintain separate Beta(α, β) per (model, task_class) pair. A model that excels at code but struggles at reasoning has two posteriors — high α/(α+β) for code, low α/(α+β) for reasoning — rather than a single misleadingly average posterior.

**Why this matters:** Without context blocking, a model that completes 90% of code tasks and 30% of reasoning tasks has a combined posterior reflecting ~60% success — too high for reasoning tasks, too low for code tasks. The router selects it too often for reasoning and too rarely for code.

**Connection to dimensional profiles (Part 2, N-3):** Context-blocked posteriors ARE the Thompson-sampling analogue of dimensional profiles. ΦL_code and the Thompson posterior for code tasks measure the same underlying signal from different angles — ΦL from observation Grid statistics, Thompson from sampling outcomes. They should converge as evidence accumulates.

### Exploration Decay

As the system accumulates evidence, exploration should naturally decrease:

```
εR_decayed = base_εR × decay_factor(total_observations)
decay_factor = max(0.01, 1 / log(total_observations + 1))
```

**Hard minimum:** εR never drops below `base_εR × 0.01` — even a highly confident system maintains minimal exploration to detect environmental shifts.

**Reset triggers:** New model added, environmental change detected (dimensional profile shift), or operator-initiated reset. Resets decay to explore the changed landscape.

**Interaction with εR floor (Part 2):** The εR floor from imperative gradient modulation and spectral calibration can push εR UP when structural signals demand exploration. The decay pulls εR DOWN as confidence grows. The floor always wins:

```
εR_effective = max(εR_floor, εR_decayed)
```

The floor responds to structural signals (the system NEEDS to explore). The decay reflects accumulated confidence (the system has LEARNED enough to explore less). Structural need overrides confidence.

### Hallucination Detection (Three-Layer)

**Layer 1 — ELIMINATED_ENTITIES:** A canonical list of entities that once existed but have been removed from the spec (old axiom names like "Reversibility" and "Symbiosis," removed morphemes like "Observer," superseded concepts like "Model Sentinel"). Any reference to an eliminated entity in agent output is a hallucination. Simple string-match check — fast, zero false positives.

**Layer 2 — Grammar Compliance (Assayer):** Agent output is checked against the grammar. References to entities not in the morpheme vocabulary, axiom numbering that doesn't match the current count (8, not 9 or 10), containment relationships that violate G3, seven-stage pipeline called "five-stage" — all are hallucination indicators. This layer catches fabricated structural claims.

**Layer 3 — Jidoka (Stop-the-Line):** When either Layer 1 or Layer 2 detects a hallucination, the pipeline stops immediately. The hallucinating step is not retried automatically — it escalates for review. This prevents hallucination propagation through downstream pipeline stages. In the current single-operator system, escalation routes to the human operator. In multi-operator deployments, the Jidoka escalation routes through the Scale 2→3 escalation mechanism (v5.0 §Escalation Mechanics).

**Connection to governance Resonators:** Hallucination detection is a function of the Refinement Helix within each pattern Bloom. The Assayer evaluates grammar compliance (Layer 2). ELIMINATED_ENTITIES (Layer 1) is a lookup against a Grid in the Constitutional Bloom. Jidoka (Layer 3) is the Helix's stop condition.

### Governance Files (CLAUDE.md)

CLAUDE.md functions as persistent agent context — a textual projection of the Constitutional Bloom:

- **What it contains:** Axiom table, anti-pattern table, eliminated entities list, morpheme type rules, pipeline governance constraints, graph-writing protocols
- **Why it works:** Claude Code reads CLAUDE.md at session start, giving the agent structural context that persists across invocations without requiring graph queries
- **What it enforces:** The same constraints that the governance Resonators enforce structurally, but in the agent's prompt context
- **Authority hierarchy:** When CLAUDE.md and the Constitutional Bloom diverge, the Bloom is authoritative. CLAUDE.md is a convenience projection, not a source of truth. Updates to CLAUDE.md must reflect verified graph state.

---

## Deferred Computation Details

Computations implemented in code but not previously specified in the Bridge. Each verified against source files before documenting.

### ΦL temporal_stability (Fourth Factor)

**Location:** `src/computation/phi-l.ts` — `computeTemporalStability()` and `computeTemporalStabilityFromState()`

**Implementation status:** ✅ Implemented

The fourth factor in the ΦL composite. Measures consistency of ΦL over the observation window. Two computation paths:

**Stateless path** (`computeTemporalStability(recentPhiLValues)`):

```
stability = 1 - coefficient_of_variation
         = 1 - (stddev / mean)
         clamped to [0, 1]
```

Requires at least 3 observations; returns 0.5 (moderate stability) with fewer.

**Stateful path** (`computeTemporalStabilityFromState(state, latestPhiL)`):

```
stability = 1 - min(1, variance / MAX_EXPECTED_VARIANCE)
         where MAX_EXPECTED_VARIANCE = 0.04 (stddev ≈ 0.2)
```

Uses a ring buffer (`PhiLState`) for O(1) snapshot retrieval. Requires at least 2 observations; returns 0.5 with fewer. The caller owns and persists the state between runs.

**Ring buffer sizes** (from `PHI_L_WINDOW_SIZES`):

| Node Type | Window Size | Default |
|---|---|---|
| Leaf / function | 10–20 | 20 |
| Intermediate / pattern | 30–50 | 40 |
| Root / coordinator | 50–100 | 75 |

**Integrated computation:** `computePhiLWithState()` combines the three non-stability factors with ring buffer temporal stability tracking in a single call. The caller provides `Omit<PhiLFactors, 'temporalStability'>` — stability is computed from state, not supplied.

**Weight:** w₄ = 0.2 (confirmed in `DEFAULT_PHI_L_WEIGHTS`: axiom_compliance=0.4, provenance_clarity=0.2, usage_success_rate=0.2, temporal_stability=0.2).

### εR Spectral Calibration

**Location:** `src/computation/epsilon-r.ts` — `minEpsilonRForSpectralState()`

**Implementation status:** ✅ Implemented

```typescript
function minEpsilonRForSpectralState(spectralRatio: number): number {
  if (spectralRatio > 0.9) return 0.05;
  if (spectralRatio >= 0.7) return 0.02;
  if (spectralRatio >= 0.5) return 0.01;
  return 0.0;
}
```

Matches the Bridge table exactly. The spectral ratio measures how concentrated model selection is — a ratio approaching 1.0 means all selections go to one model (exploration urgently needed). The function maps this ratio to a minimum εR floor that prevents exploration collapse.

**Note:** The spectral ratio itself is not yet computed from the graph. The function accepts it as input. Computing the spectral ratio from Thompson posterior distributions (measuring concentration of belief across models) is an engineering milestone.

### εR Floor Formula

**Location:** `src/computation/epsilon-r.ts` — `computeEpsilonRFloor()`

**Implementation status:** ✅ Implemented

```
εR_floor = max(
    base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient)),
    min_εR_for_spectral_state(spectral_ratio),
    0.01    // absolute minimum — εR must never fully collapse
)
```

**Parameters:**
- `baseFloor`: default 0.01
- `imperativeGradient`: Ω_aggregate_gradient. Negative = declining health → more exploration. Default 1.0 (neutral).
- `spectralRatio`: optional spectral concentration ratio (0–1). Higher = more concentrated.
- `gradientSensitivity`: how strongly negative gradients inflate the floor. Default 0.1.

The implementation adds an absolute minimum floor of 0.01 beyond the spec formula — εR must never fully collapse for active patterns, even when both gradient and spectral terms are zero.

### ΨH Hypothetical State

**Source:** v5.0 §ΨH (projectable property)

**Implementation status:** ⚠️ Partial

v5.0 specifies ΨH is projectable — computable against proposed states. The implementation's `computePsiH(edges, nodeHealths)` accepts arbitrary inputs, so hypothetical computation is structurally possible by passing proposed edge sets and node health sets. However, no dedicated hypothetical API exists. Computing "what would ΨH be if we added this edge" requires the caller to construct the hypothetical input manually.

**What exists:** The computation infrastructure accepts any graph representation.
**What's missing:** An ergonomic API that takes (current graph + proposed mutations) and returns projected ΨH.

---

## Vertical Wiring Specification

The full data flow from raw observations to aggregated state dimensions, specifying each interface point as a contract between upstream producer and downstream consumer. The interface is the graph itself — writes via governance Resonators, reads via Cypher queries.

| Interface Point | From | To | What Flows |
|---|---|---|---|
| Observation → Conditioning | Raw observation Seeds in Grid | Inline conditioning functions (7 stages applied within writeObservation()) | Raw metric values enter Debounce → Hampel → EWMA → CUSUM → MACD → Hysteresis → Trend |
| Conditioning → ΦL | Signal conditioning output (Trend function) | ΦL computation (4-factor formula) | Conditioned values feed axiom_compliance, provenance_clarity, usage_success_rate factors. temporal_stability computed from ring buffer. |
| ΦL → Maturity | Raw ΦL | Maturity modifier | `ΦL_effective = ΦL_raw × maturity_factor` where maturity_factor = f(observations, connections) |
| Node → Container | Component ΦL_effective | Parent Bloom ΦL | Dampened propagation via CONTAINS Line properties (Part 3): γ_effective = min(0.7, 0.8/k) |
| Graph → ΨH | Live graph Laplacian | ΨH computation | λ₂ + TV_G → two-component ΨH. Temporal decomposition (Part 2, N-4) produces trend, transient friction, durable friction. |
| Line → Conductivity | Endpoint properties | Line conductivity cache | 3-layer evaluation: hygiene (binary), shape (binary), fitness (continuous friction). Cached on Line. |
| State changes → Events | ΦL/ΨH/εR changes | Structural Review Resonator (Part 8) | 6 event triggers: λ₂ drop, friction spike, cascade activation, εR spike, ΦL velocity anomaly, Ω gradient inversion |
| Recovery → Hysteresis | Improving ΦL | CONTAINS Line attenuation | Recovery propagates at γ_effective / 2.5 (Part 3). Asymmetric rate prevents oscillation. |

Each row is a contract: the upstream producer writes data that the downstream consumer reads. Implementation requires each interface point to be:

- **Observable:** the data crossing each interface is a morpheme property on a node or relationship in the graph
- **Traceable:** provenance from observation Seed through conditioning chain to aggregated state dimension
- **Testable:** each interface point can be verified by Cypher query (e.g., "are conditioned values flowing from Trend Resonator output to ΦL computation input?")

Passes Bridge View Principle: all interface points are morpheme-to-morpheme data flows through Lines. No entities, thresholds, or temporal behaviour outside the grammar.

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
| Resonator (Δ) | Transformation — LLM/AI model invocation, Thompson selection, Assayer evaluation, distillation, classification, governance enforcement (Instantiation, Mutation, Line Creation) |
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
| Signal Conditioning Bloom | Conceptual scope for the seven conditioning functions. The functions run inline within the observation write path. The type definitions in the Constitutional Bloom (resonator:signal:*) prove grammar completeness. No separate Bloom is instantiated in the graph. |
| Signal Conditioning Resonator | One of seven conditioning functions (Debounce, Hampel, EWMA, CUSUM, MACD, Hysteresis, Trend) applied inline during observation recording. Type definitions exist in the Constitutional Bloom for grammar completeness (A7). The computation runs inline — not as separate graph nodes. |
| Structural Review Resonator | Diagnostic Resonator within Ecosystem Governance Bloom — monitors event Seeds, produces five diagnostic output types |
| Data dependency DAG | The graph topology that determines execution order — Resonators activate when input Lines carry data, replacing sequential orchestration |
| Collapse Resonator | Superposition resolution — selects, races, or synthesises outputs from superposed instances |
| Compaction Resonator | Stratum 2 → archive transition — severs Lines to observation Seeds whose weight has decayed below threshold (0.01). Routes through Mutation Resonator. |
| Distillation Resonator | Stratum 2 → Stratum 3 compression — reads raw observations, writes concentrated insights. Own ΦL reflects distillation quality (prediction accuracy). |
| Context-blocked posterior | Per-(model, task_class) Thompson Beta parameters — prevents averaging across task dimensions. The Thompson analogue of dimensional profiles. |
| Exploration decay | εR reduction with accumulated evidence — `max(0.01, 1/log(observations+1))`. εR floor always wins over decay. |
| ELIMINATED_ENTITIES | Canonical list of removed concepts — Layer 1 hallucination detection via string match. Zero false positives. |
| Jidoka | Stop-the-line on hallucination detection — no automatic retry, escalate for review. Prevents hallucination propagation. |
| Vertical wiring | Full data flow path: observation → conditioning → ΦL/ΨH/εR → aggregation → events. 8-row interface contract. |
| Composition εR | Aggregate exploration rate at Bloom scope — exploratory/total decisions within containment. Triggers structural review when above maturity-indexed bound. |

---

*This document derives from Codex Signum v5.0 (canonised at e1f6d88, 2026-03-12). The Bridge View Principle governs all formulas: every computation must be a pure function of grammar-defined morpheme states and axiom-defined parameters. The Codex defines the grammar. This document defines how to compute the grammar's properties. When in doubt about implementation, follow this document. When in doubt about intent, read the Codex.*
