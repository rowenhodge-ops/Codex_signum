# Codex Signum

## A Semantic Encoding Where State Is Structural

**Version:** 4.3 (Draft)
**Status:** Draft — Architect Review Required
**Prior Version:** 4.2 (Draft)
**License:** CC0 / Public Domain (Specification) · Apache 2.0 (Reference Implementations)
**Canonical URL:** TBD
**SHA-256:** TBD (computed on release)

---

# Part One — The Language

## Abstract

In current architectures, system state and system representation are separate concerns. You build a system, then add observability. Metrics, logs, dashboards, and alerts form a parallel infrastructure for understanding what the system is doing.

Codex Signum eliminates the separation. It is a semantic encoding where **state is structural**. A protocol for representing complex patterns in a way that is simultaneously human-legible and machine-processable, where the encoding of a pattern **is** its observable state.

It describes systems where coherent work flows through layers of abstraction (agentic workflows, knowledge graphs, distributed processes, organisational dynamics) and where the health, provenance, relationships, and learning dynamics between components need to be *visible* rather than queried.

It is a protocol for encoding patterns so that their state is inseparable from their representation, and their adaptation is inseparable from their operation.


---

## Purpose

The separation between state and representation has costs. Monitoring lags reality. Health data lives outside the data path. Governance requires separate tooling. Integration points multiply failure modes. Learning happens in opaque subsystems. Degradation propagates invisibly.

Codex Signum encodes state directly in structure:

| Structural Property | Encoded Information |
|---------------------|---------------------|
| Luminance | Health, confidence, certainty |
| Pulsation rate | Activity, load, recency |
| Connection weight | Relationship strength, dependency |
| Color | Domain, type, warning state |
| Spatial position | Semantic proximity, clustering |
| Boundary definition | Scope, interface stability |
| Feedback flow | Learning direction, adaptation rate |


What follows from this:

**Compact semantic transfer** — Pattern state encoded in structure. The encoding is lossy by design, quantised to perceptually discriminable levels sufficient for human monitoring and paired with full-precision backing stores for machine processing.

**Integrated governance** — Trust, provenance, and health are visible properties. Anomalies present as structural irregularities. No separate audit layer.

**Perceptual monitoring** — Degradation shows as dimming, overload as instability, failure as darkness. The visual field *is* the health check.

**Distributed coherence** — Patterns with aligned signatures resonate. Misalignment creates visible dissonance. Coordination is structural.

**Adaptive feedback** — Learning is structural. Feedback flows visibly through connections. The system reports health and improves it.

**Graceful degradation** — Failing components dim before they fail completely. Routing adapts based on perceived health. Recovery follows the same paths in reverse.

The system behaves like a neural network at the architectural level: coherence, adaptation, and feedback are structural properties of how patterns are encoded and connected.

---

## Heuristic Imperatives

Three directional imperatives govern the *purpose* of the system. Where the axioms define how the language must behave, the heuristic imperatives define what the language is *for* — the direction toward which all valid expressions tend.

These are Dave Shapiro's heuristic imperatives for autonomous systems, applied here at all scales. They are scale-invariant: they hold meaning whether applied to a single pattern, a cluster, or a federated network.

### Ω₁ — Reduce Suffering

Patterns, systems, and networks described in Codex Signum tend toward reducing suffering — in participants, in affected systems, and in the broader environment.

A pattern that accurately represents a failing node reduces diagnostic suffering. At larger scale, a federated system that routes around failure reduces systemic suffering, and a health signal that warns before collapse reduces preventable damage.

The imperative applies to the system's direction of travel, its aggregate effect, rather than requiring that every pattern directly addresses suffering.

### Ω₂ — Increase Prosperity

The system distributes capability, rewards contribution, and expands access rather than concentrating control.

A well-composed pattern that others can learn from increases collective capability. Shared through federation, it multiplies its value. Open protocols, permissionless participation, and CC0 licensing keep prosperity ungated. The system creates more value than it captures.

### Ω₃ — Increase Understanding

The system makes the invisible visible, the complex comprehensible, and the opaque transparent.

This is the imperative most deeply embedded in Codex Signum's design. The entire language exists to increase understanding. Axiom 9 (Comprehension Primacy) is its structural expression.

A pattern's state is readable without querying a separate system. The aggregate health of a federated network is perceptible through the visual properties of its constituent patterns.

### Relationship to Axioms

The heuristic imperatives answer "toward what?" The axioms answer "by what rules?" The imperatives provide the directional context within which the axioms operate:

| Imperative | Served By (Axioms) |
|---|---|
| Reduce Suffering | Reversibility (A5), Graceful Degradation (cascade mechanics) |
| Increase Prosperity | Semantic Stability (A7), Provenance (A4), Adaptive Pressure (A8) |
| Increase Understanding | Comprehension Primacy (A9), Transparency (A3), Fidelity (A1), Visible State (A2) |


---

## Axioms

Nine principles constrain all valid expressions. They are organised in three groups that follow a narrative arc: the encoding does not lie, you can trace where things came from, and understanding always wins.

### Axiom Dependency Structure

The nine axioms are numbered for stable reference. Their logical dependencies form a directed acyclic graph (DAG):

```text
                    ┌──→ Fidelity (1)
Visible State (2) ──┤
                    ├──→ Provenance (4) ──→ Reversibility (5)
                    ├──→ Semantic Stability (7)
                    └──→ Adaptive Pressure (8)

Transparency (3) ──→ Fidelity (1)
                 ──→ Adaptive Pressure (8)
                 ──→ Comprehension Primacy (9)

Minimal Authority (6) ─── (independent)
```

**Reading the DAG:**

- **Foundation layer:** Visible State (A2), Transparency (A3), and Minimal Authority (A6) have no dependencies. They constrain all other axioms.
- **Structural layer:** Fidelity (A1) depends on both Visible State and Transparency — you cannot demand accurate representation without visibility and interpretability.
- **Derived layer:** Provenance (A4), Reversibility (A5), Semantic Stability (A7), Adaptive Pressure (A8), and Comprehension Primacy (A9) depend on the foundation and structural layers.

**Implications for implementors:** When evaluating axiom compliance, check the foundation layer first. If Visible State (A2) is violated, Fidelity (A1), Provenance (A4), Semantic Stability (A7), and Adaptive Pressure (A8) cannot be meaningfully assessed. If Transparency (A3) is violated, Fidelity (A1), Adaptive Pressure (A8), and Comprehension Primacy (A9) cannot be assessed.

The numbering is stable. The DAG is informational — it describes existing logical relationships, not new constraints.

### Structural (A1–A3)

State lives in structure. Signals are interpretable.*

#### A1. Fidelity

Representation must match actual state. A Seed displaying health while encoding corruption is a structural violation. The state dimension computations must be deterministic given the same structural inputs.

#### A2. Visible State

Health, activity, and connection are expressed in the structural properties of the encoding, never hidden, stored in a separate system, or accessible only through a different interface. Healthy patterns glow. Failing patterns dim. Dead patterns go dark. Learning patterns pulse.

Health must be available in the pattern's own structure. External monitoring systems may mirror this data but never be the sole source of it. The pattern itself is the source of truth about its own state.

#### A3. Transparency

Every signal must be interpretable by its receiver. No construct may be opaque by design. Patterns must be legible.

### Traceability & Constraint (A4–A6)

*Origin is known. Prior states are recoverable. Authority is minimal.*

#### A4. Provenance

Every element carries the signature of its origin. Anonymous elements are permitted for observation but suspect for action.

#### A5. Reversibility

Transformations should be reversible unless explicitly terminal. Prior states must be reconstructable. This enables recovery and audit.

#### A6. Minimal Authority

A pattern requests only the resources its purpose requires. No construct may demand more than its meaning needs.

### Comprehension & Growth (A7–A9)

*Vocabulary is stable. Learning is visible. Understanding wins.*

#### A7. Semantic Stability

The six morphemes are immutable. Their meanings are fixed across all versions, all implementations, all dialects. The three state dimensions (ΦL, ΨH, εR) are stable. The axioms are stable.

The language grows by composition, not mutation. New constructs must not invalidate existing valid expressions. Extension that requires breaking change to the foundation is a different language.

#### A8. Adaptive Pressure

Patterns evolve through feedback. Learning from observed outcomes is structural. A system that adapts visibly — routing around failure, strengthening successful paths, exploring alternatives — is healthier than one that performs identically but cannot learn. Systems that cannot learn are already degrading — their ΦL may be high today, but their brittleness increases with every environmental change they cannot detect.

Exploration of alternatives is a system health indicator.

This axiom requires that whatever learning occurs is structural and visible: feedback flows through Lines, adaptation manifests as luminance change, exploration is measurable as εR.

#### A9. Comprehension Primacy

When efficiency and understanding conflict, **understanding wins**.

The language serves communication. Communication serves comprehension. Comprehension serves the beings — human and artificial — who use it.


---

## The Ontology

Codex Signum describes systems as four layers of abstraction. Each layer is defined in terms of the morphemes. The illustrative examples below are drawn from agentic AI workflows, but the grammar is domain-agnostic.

### Substrate Layer

The compute that morphemes run on. Invisible to the encoding except through the performance of the morphemes it hosts.

In agentic workflows, models are substrate which are interchangeable compute resources selected dynamically and released after use. But substrate could equally be human labour, mechanical processes, or any execution medium.

### Function Layer

A Seed (•) with focused transformation purpose. Stateless. Its ΦL reflects execution quality, not persistence.

Extract entities from text, classify intent, generate a response, validate output. These are Seeds — atomic, purposeful, visible through their luminance. Their execution frequency is whatever the domain requires. ΦL pulsation encodes it.

### Pattern Layer

A composition of morphemes within a Bloom (○). Has shape, health, and purpose. Persists as configuration.

A document processing pipeline that extracts, routes, transforms, validates, and outputs. The Bloom defines its boundary. Lines define its flows. Resonators define its transformations. The pattern's ΦL is the aggregate health of its constituents.

### Memory Layer

A Pattern that engages a Grid (□) with persistent memory. Where accumulated context produces consistent behaviour and long-term learning.

A pattern that reads and writes to a knowledge graph, accumulates context across sessions, and develops consistent behaviour through what it remembers. What this produces at scale is an operational question.


---

## The Six Morphemes

All expressions in Codex Signum compose from six fundamental forms, these are immutable primitives whose meanings are fixed across all versions, all implementations, all scales.

The six morphemes function as **dimensional channels of a multi-dimensional encoding space**, not as compositional primitives in the oligosynthetic sense. Each morpheme defines a distinct encoding dimension which are the  lifecycle stage (Seed), connectivity (Line), scope (Bloom), transformation (Resonator), structure (Grid) and temporality (Helix). Composition combines these dimensions, producing a continuous space whose combinatorial richness far exceeds sequential composition of discrete units. This is analogous to how a coordinate system with six axes defines a vast space from six primitives. The domain is constrained,  encoding the state of coherent work flowing through layers of abstraction, and the dimensional-channel design is well-suited to this domain's tractable semantic space.

### • Seed (Point/Singularity)

**Encodes:** Origin, instance, datum, coherent unit

A point of brilliant light,  prismatic, containing latent spectral colour with concentrated potential. The Seed is the atomic unit, which is a piece of data, a function instance, a decision point.

The **vibrancy and coherence** of internal patterns indicate vitality. A healthy Seed glows with clear light; a degraded one dims and flickers.

A Seed with no inbound or outbound Lines is **Dormant**, present in the system, potentially viable, but not participating in any flow. Dormant Seeds are visible as bright but isolated points, latent capability, built but unconnected. Dormant Seeds have ΦL computed from their internal properties but an integration factor of zero (see State Dimensions).

In a pattern: Seeds are the nodes — data points, function calls, decision moments.

### → Line (Vector/Connection)

**Encodes:** Flow, transformation, direction

A luminous filament with intrinsic oscillation. It connects Seeds, carries transformation, shows data flow.

**Direction** encodes relationship:

- Forward (→) — transformation, processing
- Return (←) — result, feedback
- Parallel — monitoring, observation
- Bidirectional (↔) — dialogue, iteration

Light pulses along the line show active flow. Speed encodes urgency, brightness encodes volume.

In a pattern: Lines are the flows — data moving, transformations executing, results returning.

### ○ Bloom (Circle/Boundary)

**Encodes:** Scope, boundary, context

A circle of light with petal-like segments. Petals bloom outward (projection) or fold inward (protection).

An open **C-shape** indicates receptive interface. A closed Bloom indicates protected scope or stable boundary.

In a pattern: Blooms define scope — what is inside this pattern, what is protected, where the interface is.

### Δ Resonator (Triangle/Process)

**Encodes:** Transformation, decision, routing

Three Lines meeting at Seed vertices. The internal space shows transformation in progress.

**Orientation matters:**

- Δ (apex up) — emission, output, decision made
- ∇ (apex down) — reception, input, decision pending

In a pattern: Resonators are the transformations — where input becomes output, where routing decisions happen.

### □ Grid (Square/Structure)

**Encodes:** Network, schema, knowledge structure

A lattice of interconnected Lines and Seed nodes. Light flows through pathways. Nodes change brightness to show state.

The Grid can form solid boundaries, like a sealed vault,  indicating protected persistent storage.

In a pattern: Grids are the knowledge structures. They are the graph, the schema, the persistent memory that accumulates over time.

### 🌀 Helix (Spiral/Evolution)

**Encodes:** Recursion, iteration, temporal flow, learning

A multi-stranded helix of interwoven Lines. Sections shift in translucency,  **phasing between states**, showing movement through stages of iteration or time.

A Helix operates in one of three modes, distinguished by its temporal scale and convergence properties (see Adaptive Feedback):

- **Correction Helix** — tight, bounded iteration within a single execution (retry loops, review cycles)
- **Learning Helix** — statistical iteration across executions (Bayesian updates, preference learning, sampling convergence)
- **Evolutionary Helix** — structural iteration across the ecosystem (pattern selection, composition fitness, capability propagation)

The mode is inferred from the Helix's temporal constant and containment context, not declared. A Helix inside a Bloom that completes within a single pipeline run is a Correction Helix. A Helix spanning a Grid of execution records is a Learning Helix. A Helix spanning federated pattern health is an Evolutionary Helix.

In a pattern: Helixes are the iterations — loops, retries, evolution over time, learning.


---

## State Dimensions

Every morpheme carries three state properties expressed *in* the encoding itself. Health, activity, resonance, and exploration are visible structural properties, never hidden.

In short: ΦL tells you whether something is healthy. ΨH tells you whether things work well together. εR tells you whether the system is still learning. The formal definitions are in Part Two (Formal Calculations).

### ΦL — Luminance Schema

**Encodes:** Pattern health and state through visual properties

| Property | Meaning |
|----------|---------|
| **Hue** | Domain or type |
| **Brightness** | Health, coherence, confidence |
| **Saturation** | Stability |
| **Pulsation** | Activity, recency |

Bright, steady ΦL means healthy and active. Dim or flickering means degradation or dormancy.

ΦL is computed from four observable factors: axiom compliance, provenance clarity, usage success rate, and temporal stability. The weights are tunable per deployment context. Raw ΦL is further adjusted by a maturity modifier that accounts for observation depth and integration state, and by recency weighting that decays old observations. See Formal Calculations for the full computation.

#### Interpretation

| ΦL_effective | Status | Meaning |
|---|---|---|
| ≥ 0.9 | Trusted | Highly coherent, well-tested, well-integrated |
| 0.7–0.9 | Healthy | Functional, sufficient for use |
| 0.5–0.7 | Degraded | Use with caution, investigate |
| < 0.5 | Unhealthy | Quarantine or ignore |

### ΨH — Harmonic Signature

**Encodes:** Relational coherence through structural and runtime properties

The intrinsic vibration of a morpheme. Elements with aligned ΨH are in **sympathetic resonance** — they share purpose or nature. Dissonant signatures indicate incompatibility.

**Resonance is relational, not intrinsic.** A single morpheme does not resonate. Two morphemes resonate *with each other*, or they don't. ΨH becomes meaningful in composition — it determines whether morphemes compose naturally or resist combination.

ΨH is a two-component metric. The first component (structural coherence) measures whether the graph structure supports coherent information flow. The second (runtime friction) measures whether signals flowing through the graph are smooth or turbulent. See Formal Calculations for the full computation.

| Friction | Runtime State | Meaning |
|---|---|---|
| < 0.2 | Resonant | Connected components are in phase. |
| 0.2–0.5 | Working | Some mismatch exists but the composition is functional. |
| 0.5–0.8 | Strained | Significant mismatch. Investigate. |
| > 0.8 | Dissonant | The composition is fighting itself. |

### εR — Exploration Rate

**Encodes:** Adaptive capacity through exploration behavior

The fraction of decisions within a pattern that sample from uncertain alternatives rather than exploiting known-best options. A system that never explores has brittle health — locked into a local optimum, blind to changes in the environment.

Measured over a rolling observation window, the healthy range is context-dependent, but the principle is fixed:

| εR | Status | Meaning |
|---|---|---|
| 0.0 | Rigid | No exploration. Fully exploiting current best. Fragile to environment change. |
| 0.01–0.10 | Stable | Light exploration. Confident in current approach, sampling edges. |
| 0.10–0.30 | Adaptive | Active exploration. Learning about alternatives. |
| > 0.30 | Unstable | Heavy exploration. Either early in learning or confidence collapsed. |

A pattern whose εR drops to zero may have high ΦL today but is accumulating brittleness risk. A spike in εR could mean the pattern is responding to environmental change, or that its confidence has collapsed — the distinction matters.

εR contextualises ΦL. High ΦL with zero εR is a warning. Moderate ΦL with adaptive εR means the system is learning.

---

## Grammar

Five principles govern how morphemes combine. For stable reference in implementations, each rule carries an identifier: G1 through G5.

### G1. Proximity — Connection Requires Intent

**Default:** Elements near each other are not automatically connected. Connection requires explicit intent.

**Exception (Structural Containment):** Containment creates inherent connection. A Seed inside a Grid is part of that Grid. A morpheme enclosed by a Bloom is within that Bloom's scope. This exception applies when one morpheme is *structurally enclosed* by another — containment is the trigger, not proximity alone.

### G2. Orientation — Direction Encodes Flow

| Orientation | Meaning |
|-------------|---------|
| Toward (→) | Input, request, forward flow |
| Away (←) | Output, result, return flow |
| Parallel | Monitoring, logging |
| Bidirectional (↔) | Iteration, dialogue |

### G3. Containment — Enclosure Creates Scope

A Bloom or Grid enclosing other morphemes defines:

- **Scope** — what belongs to this pattern
- **Protection** — what is shielded from outside
- **Interface** — where external connection happens (the open edge of a C-shaped Bloom, the exposed nodes of a Grid)

Nested containment creates hierarchy through composition.

G3 governs **intentional effects**: data transformation, state mutation, and explicit signal propagation. A Resonator (Δ) that transforms state must operate within its declared containment. It cannot reach into a sibling Bloom and mutate its state. If a transformation must cross boundaries, it does so through explicit Lines connecting the boundaries — never by silent reach.

G3 does not govern **structural health propagation**. When a component degrades, its declining ΦL naturally affects the ΦL of its containing Bloom, because health is a structural property computed from constituents (see Degradation Cascade Mechanics). A parent Bloom's health reflects the health of its children. Intentional effects require explicit Lines. Structural health propagates through containment hierarchy.

### G4. Flow — Light Movement is Data Transfer

Active Lines pulse with light:

- **Direction** — where data flows
- **Speed** — urgency
- **Brightness** — volume
- **Color** — type

Dark Lines are dormant; bright, rapid Lines are under load.

### G5. Resonance — Alignment Enables Composition

Patterns with harmonically aligned ΨH compose naturally. They can:

- Share state implicitly
- Respond to each other's changes
- Connect without explicit wiring

Clashing signatures create visible dissonance — a warning of integration friction.


---

## Example

With the vocabulary and grammar defined, here is what the encoding looks like in practice. A document processing pipeline, expressed in Codex Signum:

```
• (input)
  → Δ (extract entities)
    → Δ (classify intent)
      → Δ (generate response)
        → • (output)

ΦL: Steady blue, bright (analytical domain, high confidence)
ΨH: Aligned across all Resonators
εR: 0.05 (stable — light exploration of alternative models)
Shape: Linear flow, four transformations
```

Seeds (•) are data points. Resonators (Δ) are transformations. Lines (→) are flows. ΦL is health. ΨH is coherence between components. εR is how much the system is exploring alternatives versus exploiting what works. The structure tells you what the system does. The light tells you how it is doing.

---

# Part Two — The System

## Perceptual Foundation

The foundational advantage of structural encoding is perceptual, not information-theoretic. Shannon's source coding theorem is representation-agnostic: no encoding compresses below source entropy regardless of medium. What structural encoding achieves is alignment with human perceptual processing — pre-attentive visual processing detects anomalies across 20–50 elements in under 200 milliseconds, yielding roughly 8–10× higher effective monitoring coverage than serial text-log reading. The encoding is optimised for the observer, not the wire.

The encoding is lossy by design — continuous health values are quantised to perceptually discriminable levels (5–10 luminance steps, 8–12 hue categories). This is sufficient for human monitoring (Weber-Fechner limits discrimination to ~7–8 bits per channel). Full-precision backing stores maintain machine-processable fidelity; the structural encoding provides the parallel perceptual channel that makes state comprehensible at a glance.

---

## Formal Calculations

This section collects the mathematical definitions for the state dimensions and heuristic imperative signals. The conceptual descriptions are in Part One. What follows is the computation.

### ΦL — Luminance Schema Calculations

**Design constraint — computation soundness:** The state dimension computations (ΦL, ΨH, εR) must be deterministic, reproducible from observable structure, and free of hidden dependencies. If two observers compute different values for the same pattern state, the computation has a bug, not a calibration problem. If a computation depends on hidden state outside the graph, it violates Provenance (A4). If it requires inference about unobservable internal states, it is not structural.

#### Formalized Calculation

ΦL is computed as a weighted composite of four observable factors:

```
ΦL = w₁ × axiom_compliance +
     w₂ × provenance_clarity +
     w₃ × usage_success_rate +
     w₄ × temporal_stability

where w₁ + w₂ + w₃ + w₄ = 1.0
```

The four factors are fixed — they define what ΦL measures. The weights are tunable per deployment context.

**Recommended defaults:** w₁ = 0.4, w₂ = 0.2, w₃ = 0.2, w₄ = 0.2. This weights axiom compliance highest, reflecting the principle that structural validity is the primary health signal. Implementors tune weights per domain: a safety-critical system may increase w₂ (provenance); a high-throughput system may increase w₃ (success rate).

Where:

- **axiom_compliance** — fraction of the nine axioms satisfied (binary per axiom, 0.0–1.0)
- **provenance_clarity** — can origin be traced? (0.0 = unknown, 1.0 = full chain documented)
- **usage_success_rate** — fraction of invocations completing without error
- **temporal_stability** — consistency of ΦL over the observation window

#### Centering and Spread Decomposition

Raw ΦL conflates two distinct signals: systematic bias (the pattern is consistently under-performing) and random variation (the pattern's performance is noisy). Distinguishing these is critical for correct intervention. High mean ΦL with high variance needs stability improvement. Low mean with low variance needs fundamental redesign.

ΦL decomposes into centering (mean health relative to target) and spread (variance of health over the observation window). The centering component drives threshold decisions. The spread component drives stability assessments. Both are derived from the same observation stream — no additional instrumentation required.

#### Fragility Awareness

A pattern that has never been stress-tested presents as structurally fragile regardless of its observed success rate. ΦL must account for the breadth of conditions under which a pattern has been observed, alongside its performance under those conditions.

Fragility is visible through the maturity modifier (below) — a pattern with few observations or narrow operating conditions has low maturity regardless of axiom compliance. Fragility extends beyond observation count to include failure-mode coverage: a pattern that has succeeded 100 times in identical conditions is more fragile than one that has succeeded 80 times across diverse conditions. The diversity of the observation set contributes to the maturity assessment as much as its size.

#### Maturity Modifier

Raw ΦL is adjusted by confidence factors that reflect observation depth and integration state:

```
ΦL_effective = ΦL_raw × maturity_factor

maturity_factor = (1 - e^(-k₁ × observations)) × (1 - e^(-k₂ × connections))
```

Where:

- `k₁` is a tuning constant for observation depth (recommended: 0.05)
- `k₂` is a tuning constant for integration state (recommended: 0.5)
- `observations` is the count of independent uses or validations
- `connections` is the count of active Lines to and from the component

Zero observations means near-zero maturity regardless of axiom compliance. Zero connections (Dormant) means reduced maturity regardless of observation count. At 50+ observations and 3+ connections, the maturity factor approaches 1.0.

This prevents two failure modes: **cold-start inflation** (untested patterns signal clearly that they are untested) and **orphan inflation** (built-but-unconnected patterns signal clearly that they are unintegrated).

#### Recency Weighting

Observations decay over time:

```
observation_weight = e^(-λ × age)
```

Where `λ` is the decay constant, tuned per domain. Fast-changing systems use high decay (half-life of days to weeks); slow-changing systems use low decay (months to years).

#### Adaptive Thresholds

ΦL thresholds are indexed to network maturity. A young network where mean ΦL is 0.6 is healthy. A mature network where mean ΦL is 0.6 is sick.

```
maturity_index = min(1.0,
    0.25 × normalize(mean_observation_depth) +
    0.25 × normalize(connection_density) +
    0.25 × normalize(mean_component_age) +
    0.25 × normalize(mean_ΦL_ecosystem)
)
```

The maturity index modulates thresholds:

| Threshold | Young (MI < 0.3) | Maturing (0.3–0.7) | Mature (MI > 0.7) |
|---|---|---|---|
| ΦL healthy | > 0.6 | > 0.7 | > 0.8 |
| ΦL degraded | < 0.4 | < 0.5 | < 0.6 |
| εR stable range | 0.10–0.40 | 0.05–0.30 | 0.01–0.15 |
| ΨH dissonance | > 0.25 | > 0.20 | > 0.15 |

Beyond maturity indexing, thresholds are learnable parameters. A "healthy" pattern that subsequently fails reveals a threshold set too permissive; a "degraded" pattern that recovers without intervention reveals one set too aggressive. These observations feed a calibration process operating on the timescale of months to quarters — a meta-process that tunes the parameters of the existing three scales.

#### Statistical Process Control

Simple threshold crossings detect degradation only after it has occurred. Pattern-based anomaly detection identifies degradation signatures earlier by recognising characteristic sequences in the observation stream.

Beyond rate-of-change detection (see Signal Conditioning in the Engineering Bridge), the system detects non-random patterns in health observations: sustained runs above or below the mean, trends of consecutive increases or decreases, and oscillation patterns that indicate instability. These derive from the Western Electric and Nelson rules for statistical process control — well-established methods for distinguishing signal from noise in time-series data.

The specific rule implementations and parameters belong in the Engineering Bridge. The principle belongs here: the observation stream carries structural information in its patterns, not just its values.

### ΨH — Harmonic Signature Calculations

#### Two-Component Calculation

ΨH is a two-component metric grounded in the graph's own properties. The first component measures *potential* for resonance — whether the graph structure supports coherent information flow. The second measures *actual* resonance — whether signals flowing through the graph are smooth or turbulent.

**Component 1: Structural Coherence (λ₂)**

The algebraic connectivity of a composition's subgraph — the second-smallest eigenvalue of its Laplacian matrix (the Fiedler value). It answers: "if information needs to propagate through this composition, how many paths exist and how balanced are they?"

```
L = D - A

where:
  A = adjacency matrix (aᵢⱼ = relationship weight between components i and j)
  D = degree matrix (dᵢᵢ = sum of weights connected to component i)
```

The eigenvalues of L are 0 = λ₁ ≤ λ₂ ≤ ... ≤ λₙ. The value λ₂ is the structural coherence score.

| λ₂ | Structural State | Meaning |
|---|---|---|
| Near 0 | Fragile | The composition can be split by removing a single connection. Information flow has a bottleneck. |
| Moderate | Connected | Multiple paths exist. The composition can sustain connection loss without fragmenting. |
| High | Robust | Densely connected. Information propagates efficiently in all directions. |

"Near 0," "moderate," and "high" are relative to composition size and expected connectivity. The maturity index modulates the threshold: young compositions are expected to have lower λ₂.

**Component 2: Runtime Friction (TV_G)**

Graph Total Variation measures how smoothly a signal propagates across the composition during execution. Any node property — latency, confidence, success rate, ΦL — is a signal on the graph. Similar values between connected components mean low friction. Divergent values mean high friction.

```
TV_G(x) = Σ(i,j)∈E  aᵢⱼ × (xᵢ - xⱼ)²

where:
  x = signal vector (the property being measured at each node)
  aᵢⱼ = weight of the connection between nodes i and j
  E = the set of active connections in the composition
```

For a single composite friction score, normalise and aggregate:

```
friction = mean([TV_G(x) / max_TV_G(x) for x in monitored_signals])
```

| Friction | Runtime State | Meaning |
|---|---|---|
| < 0.2 | Resonant | Connected components are in phase. |
| 0.2–0.5 | Working | Some mismatch exists but the composition is functional. |
| 0.5–0.8 | Strained | Significant mismatch. Investigate. |
| > 0.8 | Dissonant | The composition is fighting itself. |

**The Composite ΨH:**

```
ΨH = structural_weight × normalize(λ₂) + runtime_weight × (1 - friction)
```

Recommended weights: `structural_weight = 0.4`, `runtime_weight = 0.6`. Runtime friction is weighted higher because it reflects actual operational coherence beyond structural potential.

ΨH is dynamic. A composition with high ΨH may degrade as one component drifts; one with moderate ΨH may improve as components synchronise through shared work.

**Deviation detection:** Structural deviation shows as λ₂ dropping on composition change; runtime deviation shows as friction crossing a threshold boundary. The most informative signal is the combination: high λ₂ (structurally connected) with high friction (operationally mismatched) — a mismatch that topology alone cannot explain.

**Relationship to grammar compliance:** Grammar rule adherence now contributes to ΦL's axiom_compliance factor, where it belongs. ΨH measures relational coherence using the graph's own properties.

#### Temporal Decomposition

A single ΨH value conflates transient and durable alignment. A composition that resonated briefly during a favourable task and one that has maintained resonance across diverse conditions carry the same ΨH if measured at the right moment.

ΨH decomposes along four temporal dimensions:

- **Frequency** — how often does resonance occur? (Rare alignment vs. consistent alignment)
- **Duration** — how long does each resonant episode last? (Momentary spike vs. sustained harmony)
- **Intensity** — how strong is the resonance when it occurs? (Weak alignment vs. deep coherence)
- **Scope** — how many connected patterns participate? (Local pair vs. neighbourhood-wide)

The temporal decomposition distinguishes earned resonance (high frequency, long duration, broad scope) from coincidental resonance (low frequency, brief duration, narrow scope). Both produce the same instantaneous ΨH. Only the temporal decomposition reveals which is which.

#### Hypothetical State Computation

ΨH is projectable.

ΨH is computable against proposed states as well as observed states. A proposed change that would reduce ΨH is structurally detectable without a separate simulation mechanism. ΨH accepts a proposed state delta as input and returns the projected resonance impact.

- **Current ΨH** = harmonic resonance of the ecosystem as it is
- **Projected ΨH(Δ)** = harmonic resonance of the ecosystem if change Δ is applied

This has three applications:

**Pre-composition assessment.** Before committing to a new composition, compute ΨH of the proposed subgraph. If it falls below the maturity-indexed threshold, flag as structurally fragile. A visible warning, not a gate.

**Constitutional impact assessment.** A proposed amendment that would reduce ΨH by more than a threshold is structurally harmful and must not proceed without evidence suggesting the short-term dissonance will resolve. This is the structural expression of hoshin kanri catchball — feasibility feedback without a separate organisational process.

**Coupling cost integration.** When coupling costs from imperative boundary conditions are active, the hypothetical ΨH computation includes them. A proposed composition involving a pattern with harmful coupling effects produces degraded projected ΨH — signaling dissonance before the coupling forms. The pattern is free to form the coupling anyway. The degraded ΨH is visible, and the coupling cost makes it structurally expensive to maintain.

ΨH projectability enables structural impact assessment of proposed patterns before deployment.

### εR — Exploration Rate Calculations

#### Formalized Calculation

```
εR = exploratory_decisions / total_decisions
```

Over a rolling observation window. The healthy range is context-dependent, but the principle is fixed:

| εR | Status | Meaning |
|---|---|---|
| 0.0 | Rigid | No exploration. Fully exploiting current best. Fragile to environment change. |
| 0.01–0.10 | Stable | Light exploration. Confident in current approach, sampling edges. |
| 0.10–0.30 | Adaptive | Active exploration. Learning about alternatives. |
| > 0.30 | Unstable | Heavy exploration. Either early in learning or confidence collapsed. |

A pattern whose εR drops to zero may have high ΦL today but is accumulating brittleness risk. A spike in εR could mean the pattern is responding to environmental change, or that its confidence has collapsed — the distinction matters.

εR contextualises ΦL. High ΦL with zero εR is a warning. Moderate ΦL with adaptive εR means the system is learning.

#### Imperative Gradient Modulation

εR can remain in the stable range while Ω gradients are positive. As they flatten or turn negative, the feedback loop raises the floor of εR system-wide:

```
εR_floor = base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient))
```

Where `gradient_sensitivity` is a tunable constant (recommended: 0.05–0.15) and `Ω_aggregate_gradient` is the weighted mean of the three imperative gradients. The correction term is zero while things are improving. It rises as improvement stalls, creating structural pressure to explore.

#### Spectral Calibration

The graph's own signal spectrum provides a complementary calibration signal. Any signal on the graph can be decomposed into components that follow the graph's structure (aligned) and components that ignore it (liberal), using the Graph Fourier Transform:

```
spectral_ratio = aligned_energy / (aligned_energy + liberal_energy)
```

When the system's signals are heavily aligned with its structure (spectral_ratio > 0.9), a minimum level of exploration is structurally warranted — not because the imperatives demand it, but because the graph's spectral profile indicates over-exploitation risk. The εR floor becomes:

```
εR_floor = max(
    base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient)),
    min_εR_for_spectral_state(spectral_ratio)
)
```

The imperative gradients and the spectral ratio are complementary signals from different sources. The `max()` ensures that whichever signal is more urgent dominates.


### Imperative Gradient Signals

The heuristic imperatives are horizons to be approached. "Reduce Suffering" does not mean "reach zero suffering." It means "continue to discover and address forms of suffering you haven't yet recognised."

The imperatives operate as continuous gradient functions. The question is never "are we reducing suffering?" but "what is the rate of change of suffering reduction, and is it decelerating?"

```
Ω₁_gradient = Δ(suffering_proxy) / Δt
Ω₂_gradient = Δ(prosperity_proxy) / Δt
Ω₃_gradient = Δ(understanding_proxy) / Δt
```

Where the proxies are composites of observable system properties:

| Imperative | Proxy Composition |
|---|---|
| Ω₁ (Reduce Suffering) | Mean time to detect degradation, cascade frequency, unresolved hygiene scan count, mean recovery duration |
| Ω₂ (Increase Prosperity) | Pattern reuse rate, federation sharing volume, capability distribution entropy, new composition rate |
| Ω₃ (Increase Understanding) | ΦL legibility, documentation coverage, cross-scale feedback latency |

When all three gradients flatten to zero, the system is not "done" — it is losing momentum. The three imperatives form a coupled system: when one imperative plateaus, it becomes dependent on progress in another.

```
Ω₁ plateau → requires Ω₃ progress (new understanding reveals new suffering)
Ω₂ plateau → requires Ω₁ progress (reducing suffering unlocks new prosperity)
Ω₃ plateau → requires Ω₂ progress (distributed capability enables new understanding)
```

The horizon recedes because each imperative's completion condition depends on the others advancing.

### Imperative Coupling Constraints

The imperative gradients detect ecosystem-wide deceleration. They do not detect actively harmful patterns that may be extracting value faster than they degrade. A pattern with superficially healthy ΦL can systematically degrade connected patterns' vitality, in other words, its own metrics look fine while the damage is visible only in the topology.

The heuristic imperatives therefore produce **coupling cost functions** in addition to gradient signals. Where the gradients say "the ecosystem is stalling, explore more," the coupling costs say "coupling with this effect signature carries increasing structural cost."

Every pattern's coupling with other patterns produces measurable effects on connected patterns' vitality trajectories. These effects compose into a **coupling effect signature** — a derived view of existing ΦL trajectories in connected patterns, correlated with coupling topology and timing. No new instrumentation is required. The signature is computed from data the system already produces.

Each heuristic imperative generates a coupling cost component:

- **Ω₁** penalises coupling signatures associated with vitality degradation in connected patterns
- **Ω₂** penalises signatures associated with value extraction asymmetry and capability concentration
- **Ω₃** penalises signatures associated with information opacity and reduced interpretability

The penalties are continuous and local per-connection, mildly extractive patterns face mild costs, severely harmful ones face prohibitive costs. They are reversible if a pattern's coupling effects improve, the costs decrease, following the hysteresis principle (recovery is slower than degradation).

The Codex does not define what constitutes harm. The topology reveals what produces harm through its effects on connected patterns. The coupling cost functions are the structural mechanism through which that revelation has consequences.

---

## Structural Integrity

The grammar governs what valid expressions look like. Structural integrity is the practice of verifying that proposed changes — to patterns, to compositions, to the specification itself — remain expressible in the grammar's existing terms.

### The Principle

Every proposed structural change must be expressible using the existing morphemes, state dimensions, grammar rules, and axioms. If it cannot, the proposal is either introducing a new concept that requires constitutional review, or it is attempting to build something the grammar does not support.

This is the operational expression of Semantic Stability (A7) applied to system evolution. Structural integrity verification tests whether a proposed change composes from existing primitives or mutates the vocabulary.

### What It Catches

The single most common architectural violation in practice is the introduction of entities, flows, or dependencies not grounded in the grammar. Patterns that have survived multiple review cycles have been found to contain:

- **Monitoring overlays** — separate entities that observe execution and write results to the graph, rather than execution writing its own observations inline. These fail A2 (Visible State) because they separate the pattern from its own health signal.
- **Intermediary layers** — signal pipelines, health computation services, or dashboard wrappers interposed between execution and the graph. These fail A6 (Minimal Authority) by claiming authority the graph write path does not need them to have.
- **Dimensional collapse** — attempts to represent multi-dimensional signal as a single scalar, flag, or binary state. An "error morpheme" when error is already a region of ΦL/ΨH/εR space. A "health score" that merges distinct signals into an opaque composite. These fail A3 (Transparency) because the collapsed representation obscures information the existing dimensions were designed to carry.
- **Prescribed behaviour** — patterns that dictate what other patterns do rather than creating selective pressure through structural properties. These fail the DNA principle: if the grammar needs a prescribed pattern to produce a desired behaviour, the grammar is not expressive enough.

### The Assayer

The structural integrity verification is itself a pattern — a Resonator (Δ) that transforms proposed changes into compliance assessments. Its interface is `validate(proposal) → ComplianceResult`, returning a per-axiom, per-grammar-rule assessment with evidence.

The Assayer reads from a Grid (□) containing the current axioms, grammar rules, and known anti-patterns. When violations are found, corrections flow through a Helix (🌀). The pattern operates within a Bloom (○) with defined interfaces.

The Assayer is the only pattern whose prescription *is* the grammar. It tells patterns whether their proposed work is expressible in the grammar's terms. Compilation, not governance.

Other patterns invoke the Assayer at their natural decision points:

- A planning pattern invokes it during decomposition — "does this task breakdown introduce entities not grounded in the grammar?"
- An execution pattern invokes it during review — "does this code change introduce monitoring overlays, shadow systems, or dimensional collapse?"
- A learning pattern invokes it against historical changes — "looking back, did any changes introduce grammar violations that weren't caught?"

And the pattern validates itself. When someone proposes a change to the Assayer, the Assayer tests that change against the grammar. Recursive structural integrity.

The Assayer's own health is visible. If patterns stop invoking it, its activity dims. If it catches violations, its success rate is high. The system's structural governance becomes self-observing — its usage and effectiveness are visible in the graph like any other pattern.

The full Assayer pattern design (SIPOCs, interfaces, invocation modes, feedback mechanisms) belongs in a companion pattern design document. The grammar-level justification belongs here: structural integrity verification is the grammar examining itself.


---

## Adaptive Feedback

Codex Signum describes systems that learn. Learning operates at three distinct scales, each with its own temporal constant, feedback mechanics, and convergence properties. These are structural properties of any pattern that persists long enough to accumulate observations.

The three scales nest. Each feeds the one above it.

### Scale 1: Correction (Within a Single Execution)

**Temporal constant:** Seconds to minutes.
**Morpheme:** Correction Helix (🌀 within a Bloom ○).
**Mechanics:** Bounded iteration. A Resonator produces output, a downstream Resonator evaluates it, feedback flows backward through a Return Line (←), and the producing Resonator regenerates.

Properties:

- **Bounded** — correction loops have a maximum iteration count. A loop that cannot converge within its bound must terminate and pass the best available result forward.
- **Feedback is structured** — the Return Line carries specific diagnostic content (what failed, why, how to fix), not just a retry signal.
- **Degradation behavior** — if correction fails within the iteration bound, the Bloom accepts the best available output and signals degradation through reduced ΦL on the output Seed.

**Feedback Effectiveness** — the fraction of identified issues resolved by the correction cycle. Low effectiveness across many runs signals mismatched feedback mechanics — the evaluating Resonator and the producing Resonator may have low ΨH.

### Scale 2: Learning (Across Executions)

**Temporal constant:** Hours to weeks.
**Morpheme:** Learning Helix (🌀 spanning a Grid □ of execution records).
**Mechanics:** Statistical accumulation. Each execution produces an observation. Observations update beliefs about which components, compositions, and configurations produce good outcomes. Beliefs inform future decisions.

Properties:

- **Statistical** — learning operates on distributions, not individual outcomes. A single failure does not condemn a component; a pattern of failure does. The spec does not prescribe a mechanism; it requires that whatever mechanism is used, the learning is visible through ΦL and εR change.
- **Decaying** — old observations carry less weight than new ones (see Recency Weighting). A component that was excellent six months ago but has not been tested since carries uncertainty, not confidence.
- **Explore/exploit balanced** — the system maintains εR in the adaptive range by sometimes selecting uncertain alternatives over known-best options.

**Degradation behavior** — a component whose success rate drops has its ΦL dim across future routing decisions. It gets selected less often, but not immediately excluded — continued sampling (εR > 0) allows for recovery.

**Degradation signaling** — when a component's ΦL crosses a threshold boundary, this is a visible event. Routing around failure is always accompanied by a signal.

### Scale 3: Evolution (Across the Ecosystem)

**Temporal constant:** Weeks to months.
**Morpheme:** Evolutionary Helix (🌀 spanning federated Grids □).
**Mechanics:** Selection pressure across pattern populations. High-ΦL patterns propagate; low-ΦL patterns diminish.

Properties:

- **Selective** — successful compositions propagate through utility. No central authority decides which patterns matter.
- **Structural** — evolution changes which patterns exist, which compositions get built, which capabilities get connected.

**Degradation behavior** — at ecosystem scale, degradation manifests as dark regions: areas of the pattern network where health is low, activity is minimal, and connections are dormant. These are the natural result of selection pressure. The system's response is to make their state visible.

### Cross-Scale Feedback

The three scales are connected by structured data flow:

```
Scale 1 (Correction) produces: execution records, feedback effectiveness metrics
    ↕
Scale 2 (Learning) consumes execution records, produces: component preferences,
    composition resonance data, degradation signals
    ↕
Scale 3 (Evolution) consumes composition data, produces: ecosystem health trends,
    pattern propagation signals, anomaly detection
    ↕
    (feeds back to Scale 2 as better defaults and Scale 1 as better composition choices)
```

This creates a closed loop of adaptation that operates without central coordination. The loop is visible: ΦL changes propagate through the feedback topology.

### Calibration (Meta-Process)

Operating on the timescale of months to quarters, calibration tunes the parameters of the existing three scales. It iterates on the parameters that govern how the system evaluates patterns, not on patterns themselves. Its inputs are false positives, false negatives, and threshold boundary oscillation events.


---

## Memory Topology

Memory in a Codex Signum system operates at four strata, each with different granularity, retention, and access patterns. The strata describe the *persistence characteristics* of information at each scope.

### Stratum 1: Ephemeral (Execution Context)

**Scope:** A single execution within a Bloom boundary.
**Retention:** Duration of the execution.
**Owner:** The executing pattern instance.
**Morpheme home:** Within a Correction Helix (🌀) inside a Bloom (○).

Working memory. Input data, intermediate results, retry state, correction feedback. Local to the execution and discarded on completion.

### Stratum 2: Observational (Execution Records)

**Scope:** A single component's history across multiple executions.
**Retention:** Governed by recency weighting (the λ decay constant). Observations fade but are not immediately deleted.
**Owner:** The component being observed.
**Morpheme home:** A Grid (□) of execution records, accessed by a Learning Helix (🌀).

This is where ΦL comes from. Each execution produces an observation — success/failure, latency, quality score. These accumulate in a component-local Grid and are the raw material for Scale 2 feedback.

**Compaction:** Once an observation's weight drops below a practical threshold (recommended: 0.01), it can be discarded from the raw record. Its statistical contribution has already been absorbed into running averages. The compaction threshold prevents unbounded growth. A rolling window of roughly 5× the half-life contains the practical observation history.

### Stratum 3: Distilled (Lessons Learned)

**Scope:** Cross-component insights derived from observational patterns.
**Retention:** Persistent until superseded or invalidated. Much slower decay than raw observations.
**Owner:** The containing Bloom (○) or Grid (□).
**Morpheme home:** A Grid (□) at the composition level, accessed by a Learning Helix (🌀) at the upper end of Scale 2.

Where raw observations become knowledge. This stratum stores learned preferences, performance profiles, composition heuristics, failure signatures, threshold calibration data, and **immune memory archetypes** (coupling effect signatures distilled from phased harmful patterns — see Immune Memory).

Distillation is a compression operation — the output is smaller than the input but carries more actionable meaning.

**Lifecycle management:** Supersession (new insights replace old), confidence decay (unreinforced insights lose certainty), relevance pruning (insights about decommissioned components are archived).

### Stratum 4: Institutional (Ecosystem Knowledge)

**Scope:** Network-wide knowledge that transcends individual components.
**Retention:** Persistent. Decays only through explicit obsolescence.
**Owner:** The ecosystem — no single component or pattern owns this.
**Morpheme home:** Federated Grids (□) accessed by Evolutionary Helixes (🌀) at Scale 3.

Collective memory: which composition archetypes succeed across deployments, what failure modes are common, how the network has evolved over time, what environmental changes have affected performance.

### Memory Flow

Information flows upward through distillation and downward through application:

```
Stratum 1 (Ephemeral) → execution completes → observation record written
    ↕
Stratum 2 (Observational) → learning cycle completes → insights distilled
    ↕
Stratum 3 (Distilled) → evolution cycle completes → ecosystem patterns synthesised
    ↕
Stratum 4 (Institutional) → feeds back as defaults, templates, anti-pattern warnings
    ↕
Stratum 3 → Stratum 2 → Stratum 1 (contextual enrichment)
```

The upward flow is **lossy compression** — each stratum contains less data but more concentrated meaning. The downward flow is **contextual enrichment** — higher strata inform lower strata about what to pay attention to.

Memory is a distillation cascade. The system remembers what matters, at the granularity appropriate to each scope.


---

## Immune Memory

The first encounter with a novel harmful coupling signature is expensive, the penalties ramp gradually and damage occurs in the gap. Subsequent encounters with structurally similar signatures trigger faster response.

When a pattern is phased out and its coupling effect signature at time of phasing showed harmful characteristics, the signature is distilled into a **signature archetype** and stored in Stratum 3 (Distilled Memory) of the ecosystem's memory topology (see Memory Topology).

The archive uses two-tier matching:

**Structural invariants** — the deep features of harm (extraction asymmetry, information opacity, vitality degradation gradient). These are hard to evade because they encode the functional requirements of harmful coupling. A pattern that does not exhibit them is not harmful. A pattern that does but uses novel topology still gets caught.

**Surface variants** — the specific topological shapes observed. These enable fast exact-match detection of repeat patterns.

When a new pattern's coupling effect signature matches an archived archetype, the boundary penalty functions receive an acceleration factor proportional to similarity and historical severity. The ecosystem responds faster to patterns it has seen before.

The archive follows the same memory principles as all Codex memory: recency weighting (old archetypes with no recent matches decay), capacity limits (low-confidence archetypes are evicted first), distillation (redundant surface variants are consolidated), and no false memory (archetypes can only be created from observed harmful patterns that were actually phased out, never pre-populated with hypothetical threats).


---

## Degradation Cascade Mechanics

When a component degrades, the effect propagates through the pattern network. This propagation follows defined rules to prevent both silent failure (degradation invisible) and panic cascading (one failure collapses everything).

### Propagation Rules

**Direction:** Degradation propagates upward through containment (component → containing Bloom/Grid) and forward through Lines (producer → consumer). It does not propagate backward through Lines or sideways through Resonance.

**Topology-Aware Dampening:** Each level of propagation reduces the impact, with the dampening factor adapted to the local graph topology:

```
impact_at_container = component_ΦL_drop × component_weight × γ_effective(k)
```

Where:

- `component_ΦL_drop` = the magnitude of the health change
- `component_weight` = the component's contribution to the container
- `γ_effective(k)` = topology-aware dampening factor

For a node with branching factor *k* (number of children whose health propagates to it):

```
γ_effective = min(γ_base, safety_budget / k)
```

Where `γ_base` is recommended at 0.7 and `safety_budget` at 0.8. This budget-capped formula guarantees spectral radius μ = k × γ ≤ 0.8 < 1 for all k ≥ 1, providing topology-independent subcriticality. Failures attenuate faster than they accumulate regardless of topology, including hubs. No separate hub dampening is needed.

| Branching Factor (k) | γ_effective (s=0.8) | μ = k×γ | Status |
|---|---|---|---|
| 1 | 0.7 | 0.7 | Subcritical ✓ |
| 2 | 0.4 | 0.8 | Subcritical ✓ |
| 3 | 0.267 | 0.8 | Subcritical ✓ |
| 5 | 0.16 | 0.8 | Subcritical ✓ |
| 10 | 0.08 | 0.8 | Subcritical ✓ |

**Cascade limit:** Degradation propagates at most two containment levels. A failing Seed dims its Bloom. A failing Bloom dims its containing Grid. But the Grid's container is not directly affected — it recomputes its own ΦL from its constituents, with the dampened signal already attenuated. The 2-level cascade limit is the system's primary safety mechanism.

**Algedonic bypass:** Any pattern with ΦL < 0.1 (emergency threshold) propagates to root with γ = 1.0, bypassing all dampening. This preserves the cascade limit for normal operations while ensuring existential threats are never masked.

**Hysteresis:** Recovery follows the same propagation paths but at a slower rate. The recovery dampening factor is the inverse of the degradation dampening factor multiplied by a hysteresis constant (recommended: 2.5×). Recovery requires sustained improvement — the system resists oscillation between healthy and degraded.

### Degradation Visibility

Degradation events produce visible signals at the point of degradation and at each propagation level:

| Event | Signal |
|-------|--------|
| Component ΦL crosses threshold | Luminance shift visible on the component; threshold event emitted |
| Degradation propagates to container | Container ΦL updates; container boundary may flicker |
| Component recovers across threshold | Luminance brightens; recovery event emitted |
| Component remains degraded beyond observation window | Sustained amber/dim state; escalation event |

---

## Event-Triggered Structural Review

The feedback topology operates at three scales (Correction, Learning, Evolution) plus Calibration. None of these is the right place for a structural health assessment of the *graph itself* — an assessment that examines aggregate spectral properties of the network.

Structural review is triggered by events the system already produces:

| Trigger | Signal Source | What It Means |
|---|---|---|
| λ₂ drop on formation | Computed when a composition is assembled or modified | New component weakens connectivity |
| Friction spike | TV_G during execution | Runtime friction crosses threshold, sustained beyond Correction Helix temporal constant |
| Cascade activation | Degradation Cascade | A degradation event reaches the 2-level cascade limit |
| εR spike at composition level | εR computation at Bloom boundary | Composition has lost confidence and is exploring heavily |
| ΦL velocity anomaly | Rate-of-change monitoring | Ecosystem-wide ΦL shifts faster than 0.05/day |
| Ω gradient inversion | Imperative gradient signals | Any imperative gradient turns negative after sustained positive period |

### What a Structural Review Computes

A structural review is a diagnostic. It computes aggregate properties that are expensive to derive continuously but cheap to derive on demand:

1. **Global λ₂** — algebraic connectivity of the full active graph
2. **Spectral gap** (λₙ / λ₂) — structural balance indicator
3. **Hub dependency** — nodes whose removal causes the largest λ₂ drop
4. **Friction distribution** — TV_G across all active compositions
5. **Effective dampening assessment** — whether current γ is appropriate for actual topology

Review outputs feed the existing feedback topology as signals, not actions. Hub dependency informs routing. Dampening recommendations feed Calibration. Friction hotspots feed Scale 2 evaluation. Global λ₂ trend feeds Scale 3 ecosystem health.

Reviews fire when triggers fire. An immune response, not a monitoring loop.


---

## Pattern Hygiene

Components exist in various states of health and integration. Codex Signum defines pattern hygiene as the practice of detecting and surfacing these states through regular assessment.

### Dormancy Detection

A Dormant Seed — a component with no active Lines — is not necessarily unhealthy. It may be newly created, previously active and disconnected, or intentionally reserved. Dormancy is visible through the maturity_factor.

### Hygiene Scans

| Check | What It Detects | Frequency |
|-------|----------------|-----------|
| **Dormant Seeds** | Components with no active Lines | On creation; periodic |
| **Stale observations** | Components whose most recent observation exceeds decay half-life | Periodic |
| **Broken Lines** | Connections where one endpoint no longer exists or has ΦL < 0.5 | On removal; periodic |
| **Containment leaks** | Resonators whose effects propagate beyond declared Bloom boundaries | Runtime |
| **Resonance drift** | Compositions whose ΨH has deviated > 0.15 from baseline | Post-learning-cycle |
| **Orphan inflation** | Components reporting high ΦL_raw but low ΦL_effective | On ΦL computation |

Hygiene scans are the immune system of the pattern network. They surface problems; remediation is a separate concern.

### Integration State Lifecycle

```
Created → Dormant → Connected → Active → [Degraded → Recovering | Archived]
                ↑                   │
                └───────────────────┘  (disconnected by refactor)
```

| State | ΦL Behavior | εR Behavior | Visible As |
|-------|-------------|-------------|------------|
| **Created** | Near zero | N/A | Bright but isolated point |
| **Dormant** | Suppressed by connection factor | N/A | Bright but isolated, no Lines |
| **Connected** | Growing | Active | Point with Lines, pulsing |
| **Active** | Stable or improving | Stable adaptive range | Steady glow, regular pulse |
| **Degraded** | Declining | May spike or drop | Dimming, irregular pulse |
| **Recovering** | Improving | Adaptive | Brightening, stabilising |
| **Archived** | Near zero | Zero | Dark, still |


---

## Maturity-Indexed Exploration

When a network reaches maturity — high mean ΦL, stable εR, flattening Ω gradients — it faces a paradox. Selection pressure has succeeded, consuming its own fuel. Three failure modes follow:

**Stagnation Through Success** — all scores high, no improvement. Detection: Ω gradient flatness sustained over multiple calibration periods. Response: imperative gradient modulator raises εR_floor, plus challenge seeds (see below).

**Forced Evolution as Destruction** — artificially destabilising a working system. Prevention: the system must never lower ΦL of a performing pattern or force εR above the context-appropriate range. Evolution comes from expanding the problem space, not degrading the solution space.

**Performative Evolution** — patterns replaced by functionally identical alternatives. Detection: high turnover rate with no Ω gradient improvement. New patterns structurally similar to predecessors.

### Challenge Seeds

The healthy response to maturity is **provocation**: introducing novel challenges that test whether existing patterns generalise beyond their current context.

Challenge seeds are standard Seeds (•) with distinct provenance markers, contained in their own Bloom boundary. They coexist alongside existing patterns. Their ΦL does not propagate into existing pattern health. They expire after a defined period — addressed challenges are archived, unaddressed challenges are surfaced as known gaps.

Introduction rate is proportional to maturity index and inversely proportional to Ω aggregate gradient:

```
challenge_rate = base_rate × maturity_index × max(0.1, 1.0 - Ω_aggregate_gradient)
```

---

## Adversarial Resilience

The existing specification addresses bad actors through structural properties. This section extends those defences to coordinated attacks that can overwhelm natural selection pressure.

### Rate-of-Change Anomaly Detection

| Signal | Normal Range | Anomaly Indicator |
|---|---|---|
| New node creation rate | Follows usage patterns | Sudden spike exceeding 3σ of rolling mean |
| Connection formation rate | Proportional to node creation | Disproportionate spike |
| Mean ΦL velocity | < 0.05/day ecosystem-wide | > 0.1/day |
| ΨH distribution entropy | Stable or slowly increasing | Sudden collapse |
| Federation gossip volume | Proportional to activity | Disproportionate spike |

These signals compose into an **ecosystem stress index**.

### Bulkhead Mechanics

When the stress index exceeds a warning threshold: federation isolation (quarantine, not exile), acceptance rate limiting, cascade dampening override (temporarily reducing γ), and provenance weighting increase. These are stress responses that engage automatically and disengage when the stress index returns to normal. Recovery is deliberately slow — matching the hysteresis principle.

---

## Scale

The grammar is fractal. Any valid expression at one scale remains valid at all scales. A Seed at system scale is an organisation; at function scale, a datum.

| Distance | Perception | Cost |
|----------|------------|------|
| **Far** | Glow, position, cluster membership | Minimal |
| **Medium** | Shape, connections, health state | Low |
| **Near** | Internal structure, specific flows | Moderate |
| **Threshold** | Full detail available | **Decision point** |
| **Engaged** | Bidirectional data flow | Active relationship |

Before threshold: perception is passive. After threshold: attention flows both ways. The threshold is where looking becomes engaging. This is consent built into geometry.


---

## Complex Adaptive System Dynamics

Codex Signum exhibits properties of a complex adaptive system when deployed in networked or federated contexts. These properties are not guaranteed — they follow from usage at sufficient scale. The system is useful at any scale regardless.

**Self-Organisation** — No central coordinator dictates pattern usage. Successful patterns propagate through utility. What works spreads. What does not, dims.

**Edge of Chaos** — The system operates in the critical zone between rigidity and incoherence. Too ordered (εR = 0) is prevented by Axiom 8 (Adaptive Pressure). Too chaotic is prevented by the axioms. At the edge: the core provides stability, extensions allow exploration, health signals create selective pressure.

---

## Autonomy and Constitutional Evolution

### Core Ossification

Once the core reaches stability, it becomes presumptively immutable: 6 morphemes, 9 axioms, 5 grammar rules, 3 state dimensions, 3 heuristic imperatives. Breaking changes require either a major version fork, which coexists rather than replaces, or a constitutional amendment under the conditions defined below.

Extensions and compositions continue freely after ossification. Only the vocabulary is frozen — the six morphemes mean what they mean, permanently. The English alphabet ossified centuries ago. We still create new words, but 'A' does not change meaning.

Ossification criteria: ΦL of the specification itself exceeds 0.95, multiple independent implementations exist without interpretive ambiguity, sustained stable usage with no major issues, and no unresolved axiom conflicts.

### Distributed Hosting and Self-Policing

No single entity hosts the canonical specification. Core specification stored on IPFS (content-addressed, permanent), with multiple mirrors and SHA-256 hash verification.

Bad actors are isolated through structural properties. Non-compliant patterns show low ΦL. Axiom violations are detectable by any participant. Reputation follows from observed behavior. The network routes around unhealthy patterns naturally.

### Constitutional Evolution

Ossification is the right default. But no initial design is perfect. A binary choice between "live with it" and "fork" is sometimes disproportionate. Constitutional Evolution provides the proportionate middle path: change what needs changing, at the layer it needs changing, with the rigor the layer demands.

#### Amendment Taxonomy

**Tier 1: Parameter Refinement** — Changes to recommended default values, threshold ranges, configurable weights. What the specification already identifies as tunable. Not changes to what things *mean* or how they are *computed*.

**Tier 2: Structural Refinement** — Modifications to axiom language that clarify or tighten intent without changing it. Additions to grammar rule exceptions. Adjustments to state dimension computation.

**Tier 3: Foundational Change** — Addition, removal, or redefinition of morphemes, axioms, grammar rules, state dimensions, or heuristic imperatives. Extraordinarily rare. The mechanism exists for completeness, not encouragement.

#### Amendment Lifecycle

An amendment is a structured evidence-gathering process using the system's own health signals.

1. **Proposal (Challenge Seed)** — Formal diff against the canonical specification. Contained in its own Bloom. Tier-classified. ΦL begins at 0.

2. **Experimentation (Parallel Operation)** — The change runs alongside the existing core. ΦL, ΨH, and Ω gradients are measured for both versions. Experimentation continues until the required statistical confidence is met. The system's own observation depth determines sufficiency — a change achieving required confidence quickly has met the bar regardless of calendar time.

3. **Evaluation (Statistical Threshold)** — The amendment must demonstrate measurable improvement across all three heuristic imperative gradients with pre-specified statistical confidence. Tier 1 requires 90% confidence. Tier 2 requires 95%. Tier 3 requires 99%.

4. **Consensus (Network Agreement)** — Trusted nodes vote. Thresholds: Tier 1 = 67% of Trusted nodes. Tier 2 = 80%. Tier 3 = 90%. Abstentions count as "no."

5. **Ratification (Transition Period)** — The amendment is merged. A transition period allows implementations to adopt. Both old and new are valid during transition. Transition ends when the ecosystem stress index returns to baseline after adoption.

#### Safeguards

**The axioms govern the process.** Every amendment must satisfy the axioms during evaluation. You can change what an axiom says, but not in a way that violates what the other axioms require of the process.

**Rate limiting.** No more than one Tier 3, three Tier 2, or five Tier 1 amendments may be simultaneously active.

**Cooling period.** After a successful amendment, new amendments of the same or higher tier cannot be proposed until the ecosystem stress index returns to baseline. The system must demonstrate it has absorbed the change before accepting another. This is evidence-based, not calendar-based — a resilient ecosystem recovers quickly, a fragile one needs more time.

**Reversion protocol.** If a ratified amendment produces sustained negative effects, any trusted node may initiate reversion. Abbreviated lifecycle. A reverted amendment cannot be resubmitted until the conditions that triggered the reversion are structurally addressed and the ecosystem stress index has returned to baseline.

**Fork freedom preserved.** The right to fork is unconditional. Constitutional Evolution is an alternative to forking, not a replacement for it.


---

## Governance

### Phase 1: Benevolent Dictator (Current)

- **Duration:** Until core stabilises
- **Authority:** Original creator
- **Scope:** Core clarifications, initial patterns, documentation
- **Constraint:** All decisions must satisfy the nine axioms and three heuristic imperatives
- **Transition condition:** Ossification criteria met

### Phase 2: Ossification (Default State)

- **Duration:** Indefinite
- **Authority:** None required
- **Core:** Presumptively immutable
- **Changes:** Through constitutional amendment or major version fork
- **Disputes:** Resolved by axiom compliance, ΦL measurement, and fork freedom

### Phase 3: Constitutional Evolution (When Active)

- **Duration:** While any amendment is in lifecycle
- **Authority:** Network consensus
- **Core:** Amendable under extreme threshold
- **Returns to Phase 2** when all amendments are resolved

### Handling Disputes

If disagreement on interpretation arises:

1. Check canonical core hash — does your core match SHA-256?
2. Run validator — does the pattern pass axiom checks?
3. Observe ΦL — is the pattern healthy or degraded?
4. Respect fork freedom — disagree fundamentally? Fork.

There is no court of appeals. Math and network effects decide.


---

# Part Three — Reference

## Composition

The same document processing pattern from the introduction, evolved through three states to show how the encoding carries lifecycle information in structure.

**Evolved — with routing, persistence, and feedback:**

```
○ Bloom (pattern boundary)
  │
  ├── • (input)
  │     → Δ (extract)
  │         → Δ (route) ─────┬─────┐
  │                          │     │
  │              [simple] ◄──┘     └──► [complex]
  │                 │                      │
  │                 ▼                      ▼
  │              Δ (respond)         □ Grid (knowledge)
  │                 │                      │
  │              Δ (review)          Δ (synthesise)
  │                 │                 🌀 Helix (iterate — Correction)
  │                 │                      │
  │                 └──────┬───────────────┘
  │                        ▼
  └──────────────────────── • (output)

  ──[parallel]──→ □ Grid (execution history)
                    │
                    🌀 Helix (learn — Learning)
                      │
                      └──→ Δ (route) [feedback: updated preferences]

ΦL: Blue (analytical) with gold threads (knowledge access)
ΨH: Resonators aligned; Grid resonates at lower harmonic
εR: 0.12 (adaptive — actively learning which models work best)
Shape: Branching flow with persistence and learning feedback
```

**The same pattern — degrading:**

```
○ Bloom (boundary flickering — scope instability)
  │
  ├── • (input — bright, data arriving normally)
  │     → Δ (extract — dim, slow pulsation — struggling)
  │         → Δ (route — amber, erratic pulse — decisions unreliable)

ΦL: Blue shifting to gray. Gold threads dimming. Amber warnings at route.
ΨH: Resonators drifting out of alignment. Grid at dissonant frequency.
εR: 0.35 (unstable — confidence collapsed, heavy exploration)
Shape: Same structure, but the light tells a different story.
```

The structure has not changed. The state has. The Learning Helix's εR has spiked — it is exploring alternatives.

**The same pattern — recovering:**

```
○ Bloom (boundary stabilising — scope firming)

ΦL: Gray shifting back to blue. New gold threads forming. Amber fading.
ΨH: Resonators realigning around new configuration.
εR: 0.15 (adaptive — found viable alternative, narrowing exploration)
Shape: Same structure. Different internal configuration. The light is returning.
```

Recovery follows the same structural paths as degradation, but slower (hysteresis). The system earns its way back through sustained improvement. The internal configuration has changed: this is the same pattern, but it has learned something.

The lifecycle is complete: healthy → evolved → degrading → recovering → healthy (with different internal configuration).


---

## What This Is Not

Codex Signum is not an agent framework. The "agent" framing implies discrete identity, persistent self, autonomous decision-making, and bounded existence. Most of a system is stateless coherent patterns flowing through fungible compute. The Codex encodes what happens *on* substrate, not the substrate itself.

It is not a governance system. Patterns expressed in the grammar may exhibit governance properties, for example a Bloom containing Resonators with feedback loops may govern its own health. But governance is an emergent property of well-formed patterns. The grammar creates selective pressure. What patterns do with that pressure is their own concern.

It is not a monitoring tool. Eliminating the separation between state and representation is the contribution. What to monitor, how often, and what to do about the findings are pattern design decisions. The grammar ensures the information exists in the structure.

The Codex defines the grammar. Patterns are the sentences. Like DNA, it contains encoding rules whereby organisms emerge from those rules interacting with environment. If a prescribed pattern is needed to produce a desired behaviour, the grammar needs strengthening.


---

## Using This Specification

This document is public domain. You may:

- Implement the morphemes and grammar in any medium — text, visual, spatial, or something not yet invented
- Extend the language by composing new expressions from the existing morphemes and grammar
- Build tools that serialise, render, or interpret Codex Signum
- Create spatial environments grounded in these semantics
- Build federated instances that sync canonical core and share patterns
- Ignore it entirely

**What is stable:** The six morphemes, the three state dimensions, the nine axioms, the three heuristic imperatives, the five grammar rules. These are the foundation. They do not change except through constitutional amendment.

**What is extensible:** Domain-specific vocabularies may compose from the morphemes. New rendering approaches may emerge. Serialisation formats may vary. Federation protocols may evolve. ΦL weights may be tuned per deployment context. Decay constants and dampening factors may be adjusted per domain.

**What is not permitted:** Extension that changes the morphemes, state dimensions, axioms, or heuristic imperatives is not extension — it is a fork or a constitutional amendment proposal. If you find the foundation insufficient, compose from it first. If composition cannot express what you need, consider whether the need is real or whether you are reaching for complexity the pattern does not require.


---

## Version History

| Version | Date | Changes |
|---|---|---|
| 2.0 | — | Initial public specification |
| 2.1 | — | Refined grammar rules, formalised ΨH, expanded ontology, added composition examples |
| 2.2 | 2026-02-06 | Added heuristic imperatives (Ω₁–Ω₃). Formalised ΦL/ΨH calculations. Added CAS dynamics. Added governance model. |
| 2.3 | 2026-02-06 | Added Axiom 10 (Adaptive Pressure). Added εR. Added three-scale feedback topology. Added Pattern Hygiene. Added Degradation Cascade Mechanics. |
| 2.4 | 2026-02-06 | Acknowledged ΨH as relational property. Made ΦL weights configurable. Added recovery composition example. |
| 2.5 | 2026-02-07 | Simplified morpheme names. Removed single-use named concepts. Tonal consistency pass. |
| 2.6 | 2026-02-08 | Addendum: System Vitality (imperative gradients, adaptive thresholds, adversarial resilience, challenge seeds). Addendum: Memory Topology (4-stratum architecture, compaction, ownership model). |
| 2.7 | 2026-02-10 | Addendum: Spectral Resonance (ΨH redefined as λ₂ + TV_G, topology-aware dampening, spectral εR calibration, event-triggered structural review, resonance check). |
| 2.8 | 2026-02-12 | Addendum: Constitutional Evolution (amendment taxonomy, lifecycle, safeguards, reversion protocol). |
| 3.0 | 2026-02-14 | Consolidated specification. Absorbed all addendums into single document. Research-derived corrections. Morphemes reframed as dimensional channels. Added "What This Is Not" section. |
| 3.0.1 | 2026-03-02 | Added Axiom Dependency DAG annotation. Informational, not normative. |
| 4.0 | 2026-03-03 | Removed Symbiosis axiom (subsumed). Reordered axioms to 9 with category structure. Absorbed Adaptive Imperative Boundaries and six OpEx-validated refinements. Added Structural Integrity and Assayer concept. Evidence-based Constitutional Evolution gates. |
| 4.1 | 2026-03-04 | Stylistic revision. Removed persona/emergence framing (consequence of environment, not design claim). Restored Dave Shapiro attribution — heuristic imperatives, not meta-imperatives. Immune Memory elevated to standalone section. Abstract restructured to lead with problem, not inventory. Composition example introduced early. Eliminated repetition across sections. Removed hedging language. Tonal consistency pass. |
| 4.2 | 2026-03-05 | Structural reorganisation into three parts: The Language (conceptual), The System (operational), Reference. Axioms and Heuristic Imperatives moved to front matter. All mathematical definitions consolidated into Formal Calculations. State Dimensions split: conceptual descriptions in Part One, computations in Part Two. Purpose trimmed. "What This Is Not" moved to Reference. Example moved to after Grammar. |
| 4.3 | 2026-03-05 | Accuracy pass. Reverted A5 (Reversibility) to should-language. Restored perceptual science foundation (Shannon, Weber-Fechner, pre-attentive processing) to Part Two. Restored "not declared" qualifier on Helix mode inference. Reverted "Using This Specification" to prohibition framing. Fixed comma splice in Purpose. Removed duplicate horizontal rules. |

---

*The grammar is the thing. Build in it. Watch it learn.*
