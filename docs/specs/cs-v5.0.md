# Codex Signum

## A Semantic Encoding Where State Is Structural

**Version:** 5.0 (Draft)
**Status:** Draft — Architect Review Required
**Prior Version:** 4.3 (Draft)
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

Every digital system today carries a hidden cost. You build the system, then you build a second system to watch the first. Monitoring tools, compliance dashboards, health checks, governance layers, audit trails. The observer infrastructure often rivals the complexity of the thing it observes. And it lags. By the time the dashboard shows a problem, the problem has been happening for a while.

This specification proposes that the observer infrastructure is unnecessary. Its thesis: when state is structural, when the health, coherence and learning capacity of a system are properties of the system's own structure rather than measurements taken from outside, the consequences extend far beyond eliminating dashboards.

If the structure of a system IS its observable state, then:

**Complexity dissolves.** The mathematical apparatus required to monitor, govern and coordinate a system collapses when the structure itself carries that information. Separate calculations for health propagation, coherence measurement, spatial positioning and signal conditioning turn out to be different views of the same structural properties. The grammar is dense. The computation is simple. This follows from Ashby's Law of Requisite Variety: a grammar with sufficient variety to match its domain does not need supplementary mechanisms to govern what it can already express. `Δ(distinct_computations) / Δ(governed_complexity) < 0`

**Governance becomes structural.** Governance is not a layer applied to a system. It is a property of how the system is composed. A well-structured system governs itself for the same reason a well-built bridge holds weight. It is a consequence of the structure, not an addition to it. Maturana's structural determinism provides the theoretical basis: a structure-determined system's behaviour is fully determined by its current structure. If governance state IS the structure, governance behaviour follows without a separate governance system. `|ΦL_governance − ΦL_operational| → 0`

**Degradation becomes visible before failure.** A failing component dims before it goes dark. The dimming propagates through the structure. There is no gap between the system failing and someone noticing, because the failure IS a structural change and structural changes are visible by definition. This is the structural encoding of Meadows' leverage point on information flows: missing feedback is the most common cause of system malfunction. When state is structural, feedback is never missing. `Δt(observation_Seed, threshold_event_Seed) → 0 as maturity_index → 1`

**Scale follows from grammar.** The same grammar that describes a single function describes an organisation. The same rules that govern a local pattern govern a federated network. If the grammar is sound at small scale, it is sound at any scale. Scaling is composition, not re-engineering. This follows from the grammar's fractal property: any valid expression at one scale remains valid at all scales. `Δλ₂ / Δ(node_count) ≥ 0`

**The system governs its own governance.** The grammar that defines how patterns behave also defines how the grammar's own governance mechanisms behave. The system that computes health has a health. The system that detects violations is subject to the same violation detection. This self-reference is the operational closure that Maturana and Varela defined as autopoiesis: the system produces its own governance artifacts through its own governance operations. It eliminates the need for external oversight infrastructure. `ΦL_constitutional_bloom ≥ 0.9 without external intervention`

**Adaptation accelerates with complexity.** This is the counter-thesis to the dominant pattern in complex systems, where increasing complexity produces diminishing returns on adaptation. Senge's Limits to Growth archetype describes the norm: a reinforcing process drives performance until it encounters a balancing constraint, typically coordination overhead, governance cost, or information loss across layers. In the current paradigm, these constraints are internal. The more complex the system, the more monitoring, governance and coordination infrastructure it needs, and the more that infrastructure costs. `Δ²Ω / Δt² > 0 while ΨH_boundary → 1`

When state is structural, these internal constraints dissolve. There is no monitoring infrastructure that scales with the system because monitoring is not separate from the system. There is no governance overhead that grows with complexity because governance is a structural property. Each new pattern added to the graph enriches the topology that all governance computations read from. The harmonic profile gets richer. The immune memory gets deeper. The distillation cascade produces denser knowledge. Each cycle teaches the system not just about its domain but about how to learn about its domain. The learning compounds because the structure that learns IS the structure that operates. `TV_G(boundary) → 0 as structural_density → ∞`

The acceleration is bounded, but the bounds are external, not internal. The system's rate of useful adaptation increases with complexity until it encounters the limits of its environment:

Ashby's Law sets the ceiling on what the grammar can govern. When the environment's variety exceeds the grammar's variety, the system has reached the expressiveness boundary. This is a grammar design limit, not a complexity limit, and it is addressed through constitutional evolution rather than additional infrastructure. `εR → max when variety_environment > variety_grammar`

Shannon's source coding theorem sets the ceiling on compression. The distillation cascade cannot compress below the source entropy of the domain. Knowledge gets denser but not infinitely dense. `|Stratum_3| ≥ H(domain)`

Maturana's domain of interactions sets the ceiling on what the system can perceive. A structure-determined system can only respond to perturbations its structure can accommodate. Environmental changes that fall outside the system's structural coupling boundary are invisible to it regardless of internal capability. This is why environmental scanning (Beer's System 4) remains a necessary external function even in a self-governing system. `ΦL_system is undefined for perturbations ∉ structural_coupling_boundary`

The internal acceleration with external bounds is the inverse of the current paradigm, where internal overhead produces diminishing returns regardless of environmental conditions. In a structurally sound grammar, the Limits to Growth archetype's balancing constraint shifts from internal coordination cost to external environmental variety.

Codex Signum is the grammar designed to test this thesis. What follows defines six morphemes, three state dimensions, eight axioms, five composition rules and three directional imperatives. If the thesis holds, systems expressed in this grammar will exhibit these properties as natural consequences of their structure.

---

## Heuristic Imperatives

Three directional imperatives govern the *purpose* of the system. Where the axioms define how the language must behave, the heuristic imperatives define what the language is *for*. They are guardrails, not universal laws. They operate at the ecosystem level, shaping which direction the system explores when it explores, and penalising coupling effects that work against their direction. Individual morphemes and patterns do not compute imperative compliance. They don't need to. If the structure is sound and the ecosystem-level pressure is aligned, the lower scales' outcomes follow.

These are Dave Shapiro's heuristic imperatives for autonomous systems. The imperatives shape two things: εR (what direction to explore in) and coupling costs (what patterns to penalise). Everything else in the spec operates without reference to them. The imperatives are the compass, not the engine. Their formal treatment, including gradient computation, proxy sources, coupling cost functions, and escalation relationships, is in Part Two (Imperative Gradient Signals).

### Ω₁ — Reduce Suffering

The system tends toward reducing suffering in participants, in affected systems, and in the broader environment. Not every pattern directly addresses suffering. The imperative applies to the system's aggregate direction of travel.

### Ω₂ — Increase Prosperity

The system distributes capability, rewards contribution, and expands access rather than concentrating control. Open protocols, permissionless participation, and CC0 licensing keep prosperity ungated. The system creates more value than it captures.

### Ω₃ — Increase Understanding

The system makes the invisible visible, the complex comprehensible, and the opaque transparent. This is the imperative most deeply embedded in the design. The entire language exists to increase understanding. Axiom 9 (Comprehension Primacy) is its structural expression.

### The Three Together

The imperatives are coupled. Each depends on the others for continued progress: reducing suffering reveals new understanding needs, distributing capability unblocks new adoption, increasing understanding reveals new forms of suffering.


---

## Axioms

Eight principles constrain all valid expressions. They are organised in three groups: structural truth (the encoding represents actual state), traceability and constraint (you can follow where anything came from, authority is minimal), and primacy of understanding (when in doubt, choose the option that increases comprehension).

### Axiom Dependency Structure

The eight axioms are numbered for stable reference. A5 (Reversibility) was removed in v5.0 — it is a derived consequence of Provenance (A4) plus the append-only memory topology, not an independent constraint. The numbering gap is preserved for stable reference across versions. Their logical dependencies form a directed acyclic graph (DAG):

```text
                    ┌──→ Fidelity (1)
Visible State (2) ──┤
                    ├──→ Provenance (4)
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
- **Derived layer:** Provenance (A4), Semantic Stability (A7), Adaptive Pressure (A8), and Comprehension Primacy (A9) depend on the foundation and structural layers.

**Implications for implementors:** When evaluating axiom compliance, check the foundation layer first. If Visible State (A2) is violated, Fidelity (A1), Provenance (A4), Semantic Stability (A7), and Adaptive Pressure (A8) cannot be meaningfully assessed. If Transparency (A3) is violated, Fidelity (A1), Adaptive Pressure (A8), and Comprehension Primacy (A9) cannot be assessed.

The numbering is stable. The DAG is informational — it describes existing logical relationships, not new constraints.

### Structural (A1–A3)

*State lives in structure. Signals are interpretable.*

#### A1. Fidelity

Representation must match actual state. A Seed displaying health while encoding corruption is a structural violation. The state dimension computations must be deterministic given the same structural inputs.

#### A2. Visible State

Health, activity, and connection are expressed in the structural properties of the encoding. Healthy patterns glow. Failing patterns dim. Dead patterns go dark. Active patterns pulse. Exploring patterns are vivid. Rigid patterns are grey.

The state is always in the structure. External systems may derive their own reports, dashboards, or representations from it. The Signum (see §Structural Signatures) provides the verification mechanism: any claim about a system's state can be checked against the Signum generated from the graph's actual topology. If the claim matches the Signum, it is structurally grounded. If it doesn't, the claim is unverified. The Codex does not prevent external representations. It makes them testable.

#### A3. Transparency

Every signal must be interpretable by its receiver. No construct may be opaque by design. Patterns must be legible.

Transparency requires more than visibility — it requires testability. Premises must be explicit, inferences traceable, and conclusions publicly testable. A signal that is visible but whose derivation cannot be examined does not satisfy transparency. A governance mechanism whose rules are readable but whose application cannot be questioned has achieved legibility without achieving transparency.

Line conductivity enforces transparency structurally. A signal whose origin is untraceable (missing provenance) or whose derivation is opaque (no computation path in the graph) fails the morpheme hygiene layer of the conductivity check. The Line will not carry it. Opacity is not detected after the fact. It prevents the circuit from closing.

This extends to the system's own adaptive behaviour. When the immune memory instantiates a compensatory morpheme at a friction site, the entire chain is transparent: which Line signalled the friction, which dimensional profile triggered the match, which remedy archive entry was selected, what the compensatory morpheme produced, whether it survived or dissipated, and why. The system's self-repair is as legible as everything else it governs.

### Traceability & Constraint (A4, A6)

*Origin is known. Authority is minimal.*

#### A4. Provenance

Every element carries the signature of its origin. Line conductivity enforces this: an element without traceable provenance fails the morpheme hygiene check, its Lines do not conduct, and it cannot participate in flows. It is structurally present but inert. This is not a policy about trust. It is a consequence of the circuit model. No provenance, no conductivity.

*A5 was removed in v5.0. Reversibility is a consequence of Provenance (A4) plus the append-only memory topology, not an independent constraint. The numbering gap is preserved for stable reference across versions.*

#### A6. Minimal Authority

A pattern requests only the resources its purpose requires. Containment (G3) enforces this: a Resonator's input Lines define its authority scope. It cannot read what it is not connected to. It cannot write outside its containing Bloom.

### Comprehension & Growth (A7–A9)

*Vocabulary is stable. Learning is visible. Understanding wins.*

#### A7. Semantic Stability

The vocabulary is fixed. Growth is compositional. New patterns compose from existing morphemes. They do not introduce new morpheme types, new state dimensions, or new grammar rules.

The Constitutional Bloom enforces this: morpheme definitions, axiom Seeds, and grammar rule Seeds are contained within it. Every instance in the graph INSTANTIATES one of these definitions. A proposed change that alters a definition rather than composing from it triggers the constitutional amendment process (see §Constitutional Evolution). The Merkle signature of the Constitutional Bloom changes, every INSTANTIATES reference becomes stale, and the transition is structurally visible across the entire graph.

#### A8. Adaptive Pressure

A system that cannot learn is already degrading. Learning from observed outcomes must be structural and visible: feedback flows through Lines, adaptation manifests as luminance change, exploration is measurable as εR. The three-scale feedback topology (Refinement, Learning, Evolution) enforces this. A pattern with no Helix has no learning mechanism. Its εR is zero. It is structurally rigid, and that rigidity is visible.

#### A9. Comprehension Primacy

When efficiency and understanding conflict, understanding wins. The language serves comprehension. A faster system that nobody can read is worse than a slower one that everyone can. The perceptual channel mapping, the semantic zoom model, and the Signum all exist because of this axiom.


---

## Constitutional Identity

A Codex Signum system has two layers. The organisation is what makes it a Codex Signum system: six morphemes, three state dimensions, eight axioms, three imperatives, five grammar rules, and self-referential governance. The structure is everything else: specific instances, their properties, their connections, their computation parameters.

Organisation is invariant. Change it and the system becomes something else. Structure changes continuously. A system can grow, prune, and rewire its graph while remaining a Codex Signum system, as long as the organisational pattern holds.

| Category | Organisation (Invariant) | Structure (Variable) |
|---|---|---|
| Morphemes | The six morphemes and their grammatical relations | Specific instances, their properties, their connections |
| State dimensions | ΦL, ΨH, εR as complementary measures | Specific computation parameters, weights, thresholds |
| Axioms | The eight axioms | Specific axiom compliance assessments |
| Imperatives | The three heuristic imperatives | Specific imperative proxy compositions |
| Grammar | The five grammar rules | Specific rule applications |
| Patterns | Self-referential (the grammar governs itself) | Specific pattern compositions (Assayer, Retrospective, Architect, etc.) |

**The test for any proposed change:** Does it alter the relational pattern among the organisational elements, or only the specific realisation of those relations? If the former, it is a constitutional change (Tier 3 amendment or fork). If the latter, it is adaptation within organisational closure — the system evolving its structure while preserving its identity.

This distinction is the formal foundation of the Constitutional Evolution process. Parameter changes (Tier 1) modify structure. Structural refinements (Tier 2) modify structure more substantially. Foundational changes (Tier 3) modify organisation — and therefore require the most extreme evidentiary burden, because they change what the system IS.


---

## The Six Morphemes

All expressions in Codex Signum compose from six fundamental forms, these are immutable primitives whose meanings are fixed across all versions, all implementations, all scales.

The six morphemes function as **dimensional channels of a multi-dimensional encoding space**, not as compositional primitives in the oligosynthetic sense. Each morpheme defines a distinct encoding dimension which are the lifecycle stage (Seed), connectivity (Line), scope (Bloom), transformation (Resonator), structure (Grid) and temporality (Helix). Composition combines these dimensions, producing a continuous space whose combinatorial richness far exceeds sequential composition of discrete units. This is analogous to how a coordinate system with six axes defines a vast space from six primitives. The domain is constrained, encoding the state of coherent work flowing through layers of abstraction, and the dimensional-channel design is well-suited to this domain's tractable semantic space.

### • Seed (Point/Singularity)

**Encodes:** Origin, instance, datum, coherent unit

A point of light. The Seed is the atomic unit: a piece of data, a function instance, a decision point. Its brightness reflects its ΦL. Its hue reflects its harmonic character. A healthy Seed glows. A degraded one dims.

A Seed with no inbound or outbound Lines is **Dormant**: present in the graph, potentially viable, but not participating in any flow. Dormant Seeds are visible as bright but isolated points. They have ΦL computed from their internal properties but an integration factor of zero (see State Dimensions).

In a pattern: Seeds are the nodes — data points, function calls, decision moments.

### → Line (Vector/Connection)

**Encodes:** Flow, transformation, direction, conductivity

A luminous filament with intrinsic oscillation. It connects morphemes, carries transformation, shows data flow.

**Direction** encodes relationship:

- Forward (→) — transformation, processing
- Return (←) — result, feedback
- Parallel — monitoring, observation
- Bidirectional (↔) — dialogue, iteration

Light pulses along the Line in the flow direction. Brightness reflects ΦL and conductivity. Pulsation frequency reflects activity rate. A dark Line is non-conductive or dormant. A bright, fast-pulsing Line is active and healthy.

**Conductivity** determines whether signal flows. A Line is not a passive connection. It is a circuit that closes only when both endpoints satisfy the requirements for that connection. Conductivity is determined at three layers:

**Morpheme hygiene.** Both endpoints must satisfy their morpheme contract: required properties present (content, seedType, status, provenance, ΦL), INSTANTIATES Line to the Constitutional Bloom intact, Merkle signature valid. If either endpoint fails baseline hygiene, the Line is topologically present but dark. No signal flows. This is the structural enforcement that makes tampering self-defeating — stripping a Seed's provenance darkens every Line connected to it.

**Grammatical shape.** The Line's connection type must be grammatically valid for both endpoints. A FLOWS_TO Line from a Resonator's output carries a specific signal type. The receiving morpheme must accept that signal type at that interface point. Containment scope (G3), direction (G2), and signal type (G4) all contribute to the shape. If the shapes don't match, the Line is present but dark.

**Contextual fitness.** Beyond hygiene and grammar, the Line's friction profile reflects how well the endpoints' dimensional properties align for the specific work being done. A model Seed connecting to a task Seed may satisfy hygiene and grammar but carry high friction on the reasoning dimension because the model's observation history shows weakness there. Contextual fitness is continuous, not binary — the Line conducts with varying friction rather than being simply open or closed.

Dark Lines are not failures. They are structural information. A Line that cannot conduct because its endpoints are incomplete tells the system exactly what is missing. A Line that conducts with high dimensional friction tells the system exactly where compensation is needed. The Line is the first and most local element that knows the gap.

Conductivity is re-evaluated when either endpoint's structural properties change. Between re-evaluations, conductivity is a cached property on the Line. Implementation detail belongs in the Engineering Bridge.

In a pattern: Lines are the flows — data moving, transformations executing, results returning. Their conductivity determines whether the circuit works.

### ○ Bloom (Circle/Boundary)

**Encodes:** Scope, boundary, context

A boundary of light. The Bloom defines containment (G3): everything inside it is within its scope. Lines crossing the boundary are its interface with the outside.

An open boundary indicates active interface Lines crossing it — the Bloom is accepting connections. A closed boundary indicates no active interface Lines — the Bloom is a protected scope. This is derived from the topology, not declared.

In a pattern: Blooms define scope — what is inside this pattern, what is protected, where the interface is.

### Δ Resonator (Transformation)

**Encodes:** Transformation, decision, routing

A Resonator reads from input Lines, transforms, and writes to output Lines. Its shape IS its function. A Resonator with many inputs and one output is a compression. One input and many outputs is a distribution. Balanced inputs and outputs is a relay. The rendered shape is derived from the actual input/output topology, not prescribed.

Minimum viable topology: at least one input Line (otherwise what is it transforming — A4 requires provenance), at least one output Line (otherwise the transformation is invisible — A2 requires visible state), an INSTANTIATES Line to the Constitutional Bloom, and containment within a Bloom (G3). Resonators that participate in learning (routing decisions, evaluations, transformations with quality-assessable outputs) must have their own observation Grid. Simpler Resonators inherit learning visibility through their containing Bloom's observation infrastructure. Its ΦL reflects how well it transforms. Its pulsation reflects its activity rate.

In a pattern: Resonators are the transformations — where input becomes output, where routing decisions happen. Their shape tells you what kind of transformation they perform.

### □ Grid (Structure/Knowledge)

**Encodes:** Structured data, knowledge, persistent memory

A Grid contains Seeds and Lines. Nothing else. No Resonators, no Helixes, no Blooms. This is the structural distinction from a Bloom: a Grid is pure data with no active computation inside it. Its contents are stable between external writes. Resonators read from Grids and write to Grids, but they operate from outside the Grid's boundary.

The Grid's internal topology IS its retrieval structure. An observation Grid has Seeds connected by temporal Lines — it is a timeline you navigate sequentially. A Threat Archive Grid has Seeds connected by similarity Lines — it is a cluster map you navigate by matching. The shape of the Grid's internal Line topology determines how its contents are organised and found.

In a pattern: Grids are the knowledge stores — observation history, learned patterns, archived signatures, persistent memory. They accumulate over time and are read by the Resonators and Helixes that govern the pattern.

### 🌀 Helix (Iteration/Learning)

**Encodes:** Recursion, iteration, temporal flow, learning

A Helix governs iteration. It reads from a Grid, evaluates whether progress is being made, and either continues iterating or terminates. Its shape is derived from its behaviour: tightness reflects temporal scale (fast iteration = tight, slow iteration = wide), convergence direction reflects whether the iterations are improving (tightening spiral), stable (steady spiral), or degrading (loosening spiral), and depth reflects how many iterations have completed.

A Helix operates in one of three modes, distinguished by its temporal scale and containment context (see Adaptive Feedback):

- **Refinement Helix** — tight, bounded iteration within a single execution (retry loops, review cycles)
- **Learning Helix** — statistical iteration across executions (Bayesian updates, preference learning, sampling convergence)
- **Evolutionary Helix** — structural iteration across the ecosystem (pattern selection, composition fitness, capability propagation)

The mode is inferred, not declared. A Helix inside a Bloom that completes within a single pipeline run is a Refinement Helix. A Helix spanning a Grid of execution records is a Learning Helix. A Helix spanning federated pattern health is an Evolutionary Helix.

In a pattern: Helixes are the iterations — loops, retries, evolution over time, learning. A pattern with no Helix has no learning mechanism.

### Superposition

The grammar permits multiple simultaneous instances of the same composition. Each instance INSTANTIATES the same constitutional definition, has its own independent ΦL, ΨH, and εR, and operates within its own Bloom boundary (G3). Nothing in the grammar restricts a composition to a single instance.

The operational mechanics of superposition — how instances are created, how they execute concurrently, how they collapse to a single result, and how non-selected outputs feed Scale 2 learning — belong in the Engineering Bridge.


---

## State Dimensions

Every morpheme carries three state properties expressed *in* the encoding itself. Health, activity, resonance, and exploration are visible structural properties, never hidden.

In short: ΦL tells you whether something is healthy. ΨH tells you whether things work well together. εR tells you whether the system is still learning. The formal definitions are in Part Two (Formal Calculations).

### Extensibility Through Observation

The three state dimensions are fixed. They are the organisation. What feeds them is not fixed. Every morpheme instance has an observation Grid that accumulates Seeds from its execution history. The content of those Seeds is domain-specific and pattern-defined.

A model Seed in an agentic workflow accumulates observation Seeds carrying task classification, hallucination count, reasoning accuracy, code quality, latency. A compliance Seed in a governance workflow accumulates observation Seeds carrying regulatory coverage, audit trail completeness, violation history. The observation Grid is the extensibility mechanism. The spec defines the state dimensions. Patterns define what goes in the Grid.

### Dimensional Profiles

The composite ΦL of a morpheme instance is a single number. But the observation Grid carries enough data to decompose that number by any classification the pattern defines. A model Seed with ΦL of 0.75 might decompose to ΦL_code = 0.92, ΦL_reasoning = 0.41, ΦL_grounded_reasoning = 0.83. These are not new state dimensions. They are partitioned views of the existing observations, computed by a Resonator that reads from the Grid with a filter.

Dimensional profiles feed the Line conductivity model. When a Line checks contextual fitness between a task Seed and a model Seed, it reads the dimensional profile of the model for the relevant task classification. The profile is not a stored property on the model Seed. It is a query against the model Seed's observation Grid.

Patterns define their own pins. An Architect pattern routing to LLMs defines task classifications (code generation, reasoning, synthesis) and the observation Seeds carry those tags. A consulting pattern assessing organisational maturity defines different classifications (governance capability, data literacy, process automation) with different observation Seeds. Both use the same grammar, the same state dimensions, the same Line conductivity model. The domain-specific data lives in the Grid. The structure is Codex-compliant. The content is whatever the pattern needs.

### ΦL — Luminance Schema

**Encodes:** Pattern health and state through visual properties

| Property | Meaning |
|----------|---------|
| **Brightness** | ΦL (health) |
| **Hue** | Harmonic character (dominant eigenmodes from ΨH profile) |
| **Saturation** | εR (exploration rate) |
| **Pulsation rate** | Activity |
| **Pulsation phase** | ΨH between connected components |

Bright, steady ΦL means healthy and active. Dim or flickering means degradation or dormancy. Vivid colour means exploring. Grey means rigid. See §Perceptual Channel Mapping for the full derivation.

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

The ΨH computation produces the graph's eigendecomposition — the natural modes of vibration of the graph topology. This decomposition yields three outputs from a single computation:

1. **The scalar ΨH** — the summary coherence score (λ₂ and friction). This is the headline number.
2. **The harmonic profile** — which modes are active, at what amplitude, at what phase. Two compositions can have identical scalar ΨH while having completely different harmonic characters. One may resonate at the fundamental frequency (broad, system-wide coherence). Another may resonate at higher harmonics (local clusters of coherence). The scalar conflates these. The profile distinguishes them.
3. **Spectral position** — the eigenvectors of the Laplacian define each component's natural position in harmonic space. Components with high mutual ΨH are close. Dissonant components are far. Position is a by-product of the ΨH computation, not a separate calculation.

| Friction | Runtime State | Meaning |
|---|---|---|
| < 0.2 | Resonant | Connected components are in phase. |
| 0.2–0.5 | Working | Some mismatch exists but the composition is functional. |
| 0.5–0.8 | Strained | Significant mismatch. Investigate. |
| > 0.8 | Dissonant | The composition is fighting itself. |

### Position — Spatial Dynamics

**Encodes:** Structural proximity, semantic clustering, compositional accessibility

Position is a derived property: the spectral embedding from the ΨH eigendecomposition assigns each morpheme instance a location in harmonic space. Connected components cluster. Resonant compositions attract. Dissonant compositions repel. Containment (CONTAINS Lines) creates gravitational wells — a Bloom's children are held within its spatial boundary. INSTANTIATES Lines create constitutional gravity — every instance is pulled toward its constitutional definition.

Position is stored on morpheme instances as a structural property (queryable, stable) and updated when the ΨH Resonator recomputes. The spatial layout IS the harmonic structure made visible. Moving through the visualisation is moving through the harmonic space.

Position is a visual consequence of ΨH relationships. Components with high mutual ΨH are placed close together by the eigendecomposition. Components with low mutual ΨH are placed far apart. Distance does not cause friction. Distance reflects friction that already exists in the ΨH computation.

A long Line crossing the graph is visually obvious — it tells the observer "this connection spans components that the topology says don't naturally belong together." The friction is in the ΨH. The distance is the picture of that friction. This makes G3 (containment scope) spatially visible: reaching into a distant Bloom produces a visibly long Line because the topology says the connection is harmonically strained.

The Constitutional Bloom — containing all morpheme definitions, axioms, grammar rules, and imperatives — has the highest in-degree in the graph (every instance connects to it via INSTANTIATES). The eigendecomposition places it at the gravitational centre. It IS the centre because everything connects to it. This is not a design choice; it is a mathematical consequence of the topology.

### εR — Exploration Rate

**Encodes:** Adaptive capacity through exploration behavior

The fraction of decisions within a pattern that sample from uncertain alternatives rather than exploiting known-best options. A system that never explores has brittle health — locked into a local optimum, blind to changes in the environment.

εR contextualises ΦL. High ΦL with zero εR is a warning — the system works today but is accumulating brittleness. Moderate ΦL with adaptive εR means the system is learning. See Formal Calculations for the interpretation table and modulation mechanics.

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
- **Speed** — activity rate
- **Brightness** — ΦL and conductivity
- **Color** — harmonic character (hue from ΨH eigenmode profile)

Dark Lines are dormant or non-conductive. Bright, rapid Lines are under load.

A Line's conductivity is a structural property, not an administrative rule. When a Line closes its circuit (both endpoints satisfy morpheme hygiene, grammatical shape matches, and contextual fitness is sufficient), signal flows. When the circuit is incomplete, the Line is dark. This is the primary structural enforcement mechanism: non-compliant morphemes cannot participate in flows because the Lines connected to them will not conduct. The structure prevents the violation rather than detecting it.

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

### Perceptual Channel Mapping

Human pre-attentive visual processing handles brightness, hue, motion, saturation, and size in parallel — each channel can carry independent information simultaneously:

| Visual Channel | State Encoding | Perceptual Effect |
|---|---|---|
| **Brightness** | ΦL (health) | Healthy = bright. Degraded = dim. Dead = dark. |
| **Hue** | Harmonic character (dominant eigenmodes from ΨH profile) | Components resonating at similar frequencies share similar colours. Colour harmony IS harmonic harmony. |
| **Pulsation frequency** | Activity rate | Active = fast pulse. Dormant = still. |
| **Pulsation phase** | ΨH between connected components | In-phase = resonant. Out-of-phase = dissonant. Synchronised pulsation is detected pre-attentively in under 150ms. |
| **Saturation** | εR (exploration) | Exploring = vivid. Rigid = desaturated/grey. |
| **Spatial position** | Spectral embedding (derived from ΨH eigendecomposition) | Resonant components cluster. Dissonant components separate. Containment creates gravitational wells. |

**Hue derivation from harmonic profile:** The ΨH eigendecomposition produces an eigenmode profile — which vibrational modes dominate for each component. The dominant eigenmode index maps to hue. Components dominated by the fundamental mode (λ₂ — broad, system-wide coherence) sit at one end of the colour spectrum. Components dominated by higher modes (local, clustered coherence) sit at the other end. Components with similar harmonic profiles receive similar hues. The mapping is continuous — gradual shifts in harmonic character produce gradual shifts in colour, not abrupt transitions. Specific colour palette choices (which end of the spectrum corresponds to fundamental vs higher modes) belong in the Rendering Specification.

**Pulsation phase derivation:** Each component's pulsation is a periodic brightness oscillation. The phase is derived from the component's position in the ΨH eigenvector — components with similar eigenvector values pulse in phase; components with dissimilar values pulse out of phase. For connected components, in-phase pulsation means their ΨH is high (resonant). Out-of-phase means their ΨH is low (dissonant). A human observing two connected components pulsing in sync perceives coherence; pulsing against each other perceives tension. This is the ΨH signal made perceptually pre-attentive — no number reading required.

**Morpheme-specific visual properties:** Each morpheme type has a distinctive shape that is recognisable at the Medium zoom level:

| Morpheme | Shape | Additional Visual Properties |
|---|---|---|
| **Seed** (•) | Point | Brightness = ΦL; hue = harmonic character |
| **Line** (→) | Filament with directional flow | Light pulses along the Line in the flow direction; brightness = ΦL/conductivity; pulsation frequency = activity rate |
| **Bloom** (○) | Boundary of light | Open = active interface Lines crossing boundary; closed = no active interface Lines |
| **Resonator** (Δ) | Shape derived from input/output topology | Many-to-one = compression; one-to-many = distribution; balanced = relay |
| **Grid** (□) | Topology derived from internal Line structure | Timeline (temporal Lines), cluster map (similarity Lines), archive (provenance Lines) |
| **Helix** (🌀) | Spiral derived from iteration behaviour | Tightness = temporal scale; convergence direction = improving/stable/degrading; depth = iteration count |

These mappings are structural — the visual properties are derived from the state dimensions and graph topology, not configured per deployment. A renderer that follows these mappings produces consistent visual language across all Codex Signum implementations. Specific rendering technologies, colour palettes, and animation parameters belong in the Rendering Specification.

---

## Morpheme Grounding

The grammar defines six morphemes. This section describes computations, feedback mechanisms, degradation cascades, memory operations, and governance processes. These descriptions use mathematical notation and procedural language. But every mechanism described here is itself a structural element of the system it describes. If it cannot be expressed in the grammar's own terms, it is not structural — it is an external imposition.

This follows from the core thesis. If state is structural, then the state of the system's own computations is structural. If the grammar is the encoding, then the system's governance operations are encodable. If the axioms constrain all valid expressions, they constrain the expressions that evaluate axiom compliance. The system governs itself with its own grammar, or the grammar is incomplete.

### The Principle

Every mechanism described in this specification has a morpheme identity:

| Mechanism | Morpheme Composition |
|---|---|
| A computation (ΦL, ΨH, εR, dampening, thresholds) | A **Resonator** (Δ) that transforms input signals into state values. Its inputs arrive through **Lines** (→). Its outputs are properties on the morpheme instances it evaluates. |
| An observation stream (execution records, threshold events) | A **Grid** (□) of **Seeds** (•), each Seed carrying structured content. Connected by temporal **Lines** encoding sequence. |
| A feedback loop (refinement, learning, calibration) | A **Helix** (🌀) operating at the appropriate temporal scale. Mode is inferred from temporal constant and containment context, not declared. |
| A detection mechanism (SPC, cascade detection, escalation triggers) | A **Resonator** (Δ) reading from the observation **Grid** (□), producing detection events as **Seeds** (•) connected to their evidence via **Lines** (→). |
| A governance boundary (containment scope, access control) | A **Bloom** (○) enclosing the elements it governs, with defined interface points. |
| A memory stratum | A **Grid** (□) at the appropriate scope, with distillation **Resonators** (Δ) transforming raw observations into compressed knowledge, operating through **Helixes** (🌀). |

If a mechanism cannot be mapped to a morpheme composition, the mechanism is underspecified. The mapping is the specification.

### Worked Example: ΦL Computation as Morpheme Composition

The ΦL computation for a single Seed, traced through its full morpheme identity:

```
○ ΦL Computation Bloom (scope boundary)
  │
  ├── Δ ΦL Resonator (the computation itself)
  │     ← Line from: target Seed's axiom_compliance property
  │     ← Line from: target Seed's provenance_clarity property
  │     ← Line from: target Seed's observation Grid (usage_success_rate)
  │     ← Line from: target Seed's observation Grid (temporal_stability)
  │     ← Line from: Constitutional Bloom → ΦL Definition Seed (weights, k₁, k₂, λ)
  │     → Line to: target Seed's ΦL property (output)
  │
  ├── □ Observation Grid (execution history for this component)
  │     ├── • Observation Seed (execution 1: success, latency, quality)
  │     ├── • Observation Seed (execution 2: failure, error type)
  │     ├── • Observation Seed (execution N: ...)
  │     └── → Lines connecting Seeds temporally (sequence)
  │
  └── 🌀 Calibration Helix (Learning Helix — spans calibration cycles)
        ← Line from: false positive / false negative event Seeds
        → Line to: ΦL Definition Seed in Constitutional Bloom (weight adjustments)
```

The Resonator reads four factors through four Lines. It reads the computation parameters through a Line to the Constitutional Bloom. It writes the result as a property on the target Seed. The Observation Grid stores the execution history that feeds the computation. The Calibration Helix governs the meta-process that tunes the parameters over time.

Every element in this diagram has its own ΦL. The ΦL Resonator has a ΦL reflecting how accurately it computes. The Observation Grid has a ΦL reflecting its data quality. The Calibration Helix has a ΦL reflecting how well calibration is converging. The grammar governs the computation that evaluates the grammar.

### Self-Referential Axiom Application

The axioms apply to the system's own operations, not just to the systems it governs:

- **A1 (Fidelity):** The ΦL computation's output must match actual state. If the computation produces 0.9 for a degraded component, the computation has a fidelity violation.
- **A2 (Visible State):** Every governance mechanism's health is visible through the same structural properties as everything else. A malfunctioning ΦL Resonator has dim ΦL.
- **A3 (Transparency):** Every governance computation is interpretable. Formulas are published. Thresholds are queryable. Detection heuristics are readable from the Graph.
- **A4 (Provenance):** Every governance output carries the signature of its computation path. A ΦL value is traceable to the observations and weights that produced it.
- **A6 (Minimal Authority):** A governance Resonator requests only the data its computation requires. Its input Lines define its authority scope.
- **A7 (Semantic Stability):** Governance mechanisms are expressed in the same six morphemes. No governance-specific vocabulary outside the grammar.
- **A8 (Adaptive Pressure):** The governance machinery learns. Calibration tunes thresholds. The Assayer refines heuristics from experience. Governance that cannot learn about its own effectiveness is accumulating brittleness.
- **A9 (Comprehension Primacy):** The governance machinery is comprehensible. A practitioner can inspect configurations, understand computations, trace inputs, and predict outputs.

### What This Changes

The Formal Calculations that follow describe computations mathematically. The mathematics must be precise. But the mathematical description is the *what*. The morpheme grounding is the *where* — which Resonator performs this computation, which Lines carry its inputs, which Grid stores its observation history, which Bloom contains it, which Helix governs its calibration.

Implementors should read the Formal Calculations as the logic of Resonators. Every formula is the internal operation of a morpheme instance. Every input is a Line. Every output is a property on a morpheme instance or a Seed in a Grid. Every feedback loop is a Helix. Every boundary is a Bloom.

The system that computes ΦL has a ΦL. The system that detects escalation triggers is subject to escalation triggers. The system that identifies anti-patterns can itself exhibit anti-patterns. This self-reference is not a paradox — it is the operational closure that makes the system autopoietic. The grammar produces the mechanisms that evaluate the grammar.

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

- **axiom_compliance** — fraction of the eight axioms satisfied (binary per axiom, 0.0–1.0)
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

#### Three Outputs from One Computation

The Laplacian eigendecomposition that produces λ₂ also produces eigenvectors. These are not discarded — they carry structural information that the scalar ΨH alone cannot express:

**Output 1 — Scalar ΨH:** The composite score above. Summary coherence for threshold decisions and routing.

**Output 2 — Harmonic profile:** The full set of eigenvalues and their amplitudes define which vibrational modes are active in the composition. The fundamental mode (λ₂) is broad, system-wide coherence. Higher modes are local, clustered coherence. Two compositions with identical scalar ΨH may have completely different harmonic profiles — one resonating broadly, the other in tight local clusters. The profile is stored as a vector property on the composition's Bloom, readable by the Assayer, the escalation detection Resonator, and the rendering layer. The profile maps to hue in the perceptual encoding — similar harmonic profiles produce similar colours.

**Output 3 — Spectral position:** The first 2-3 eigenvectors define each component's natural position in harmonic space. This is the spectral embedding — the same computation that produces ΨH places every component in space. Position is stored as a property on each morpheme instance. See Position in Part One.

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

### Position — Spectral Embedding Calculations

Position is not an independent computation. It is the third output of the Laplacian eigendecomposition that produces ΨH (see Three Outputs from One Computation above). The ΨH Resonator computes eigenvalues AND eigenvectors; position uses the eigenvectors.

#### Spatial Coordinates from Eigenvectors

The first k eigenvectors of the graph Laplacian define a k-dimensional spectral embedding. Each morpheme instance receives a position vector:

```
position(node_i) = [v₂(i), v₃(i), ..., v_{k+1}(i)]
```

Where `vⱼ(i)` is the i-th component of the j-th eigenvector. The first eigenvector (v₁) is constant and provides no spatial information. v₂ (the Fiedler vector) provides the most structurally significant axis — it separates the graph along its weakest connection. v₃ provides the next most significant axis, and so on.

**Dimensionality:** k = 2 for 2D rendering, k = 3 for 3D rendering. The choice is structure (variable), not organisation (invariant). The spectral embedding is valid at any dimensionality.

**What position encodes:** Euclidean distance between positions approximates the structural relationship between components. High mutual ΨH (resonant) → close positions. Low mutual ΨH (dissonant) → distant positions. Structurally similar components (same connectivity pattern) occupy similar positions even without direct connections. This is a mathematical property of the Laplacian, not a layout heuristic.

#### Spatial Forces

The spectral embedding provides the equilibrium position. Three additional forces modify position dynamically:

**Containment gravity:** CONTAINS Lines pull children inside the parent Bloom's spatial boundary. A child's equilibrium position is the spectral embedding position modulated by its parent's spatial extent. Nesting depth creates gravitational wells — deeper containment produces tighter spatial clustering.

**Constitutional gravity:** INSTANTIATES Lines pull every instance toward its constitutional definition in the Constitutional Bloom. The strength is proportional to the weight of the INSTANTIATES Line (which is proportional to how faithfully the instance matches its definition). Instances with stale constitutional references (mismatched signature) experience weakened gravitational pull — they drift.

**Signal flow corridors:** Active Lines with high signal traffic (bright, fast pulsation per G4) create spatial corridors. Components at either end of a high-traffic Line are pulled closer — the signal flow itself is a spatial force. Dormant Lines exert no spatial force.

#### Distance as Visual Signal

Distance between components is a rendering of ΨH, not an independent cost. Components are far apart because they have low mutual ΨH. The friction is in the TV_G computation. The distance is the spatial expression of that friction.

Long Lines are visually diagnostic. The Assayer can query spatial relationships: "Are there Lines whose spatial length exceeds what their containment context justifies?" A Line within a Bloom connecting siblings should be short. A Line crossing the full graph to reach an unrelated Bloom is structurally anomalous — not because distance is costly, but because the ΨH that produced the distance tells you the connection is harmonically strained. The distance makes the strain visible at a glance.

#### Update Frequency

Position is recomputed when the ΨH Resonator runs — which occurs when the graph topology changes (node or Line creation/deletion) or when a significant ΦL change triggers recomputation. Between recomputations, position is stable. This matches the perceptual requirement: the spatial layout should be stable enough for a human to build a mental map, changing only when the underlying topology changes.

#### Storage

Position is stored as a vector property on each morpheme instance: `position: [x, y]` or `position: [x, y, z]`. This makes position queryable via Cypher spatial queries: "find all components within distance D of this Bloom" or "find the nearest component to this position." Position is a first-class structural property, not a rendering-time computation.

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

The imperative gradients are computed by the **Imperative Gradient Resonator** (Δ), which reads from the ecosystem's observation Grids and produces gradient values as properties on the root Bloom. The Resonator's inputs arrive through Lines from the proxy data sources described below. Its outputs feed the εR floor modulation, the coupling cost functions, and the Scale Escalation detection. The Resonator has its own ΦL — if it is not computing gradients reliably, its own health dims.

The gradients are stored as Seeds in a dedicated **Imperative History Grid** (□) — one Seed per computation cycle, carrying all three gradient values, the proxy values that produced them, and the timestamp. The Grid is accessed by a Learning Helix (🌀) that operates at Scale 2 — across computation cycles. This Helix governs the calibration of gradient sensitivity and proxy weights.

```
Ω₁_gradient = Δ(suffering_proxy) / Δt
Ω₂_gradient = Δ(prosperity_proxy) / Δt
Ω₃_gradient = Δ(understanding_proxy) / Δt
```

Where the proxies are composites of morpheme properties already in the graph:

| Imperative | Proxy Composition | Morpheme Source |
|---|---|---|
| Ω₁ (Reduce Suffering) | Mean time to detect degradation | Temporal gap between ΦL threshold-crossing event Seeds and cascade activation Seeds in the event Grid |
| | Cascade frequency | Count of cascade activation Seeds per time window in the event Grid |
| | Unresolved hygiene scan count | Hygiene detection Seeds in the Pattern Hygiene Grid without corresponding resolution Seeds |
| | Mean recovery duration | Temporal gap between degradation event Seeds and recovery event Seeds |
| Ω₂ (Increase Prosperity) | Pattern reuse rate | Count of INSTANTIATES Lines to each composition pattern |
| | Federation sharing volume | Pattern Seeds propagated to federated Grids |
| | Capability distribution entropy | Degree distribution of the graph's Line topology |
| | New composition rate | Rate of new Bloom creation in the observation Grid |
| Ω₃ (Increase Understanding) | ΦL legibility | Prediction accuracy: ΦL-based predictions compared against actual outcomes in the observation Grid |
| | Documentation coverage | Fraction of morpheme instances with non-empty content (a structural property of the Seed creation layer) |
| | Cross-scale feedback latency | Temporal gap between Scale 1 refinement event Seeds and their reflection in Scale 2 learning event Seeds |

When all three gradients flatten to zero, the system is losing momentum (see §Coupled Plateau Dynamics below).

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

### Coupled Plateau Dynamics

The three imperatives form a coupled system. Progress in each depends on progress in the others:

Ω₁ stalls when all known suffering has been addressed. It needs Ω₃ progress to reveal new forms of suffering that weren't previously visible.

Ω₂ stalls when all known capability has been distributed. It needs Ω₁ progress to remove the suffering that was blocking new adoption.

Ω₃ stalls when all known patterns are legible. It needs Ω₂ progress to distribute new capabilities that create new complexity to understand.

This coupling prevents the system from declaring victory. If all three gradients flatten simultaneously, the system is losing momentum, not finished. The coupled dynamic creates structural pressure to keep exploring even when each individual imperative appears satisfied.

### Imperative-Axiom Alignment

| Imperative | εR Pressure | Coupling Penalty | Served By (Axioms) | Opposed By (Anti-Patterns) |
|---|---|---|---|---|
| Reduce Suffering | Explore toward faster detection and recovery | Penalise patterns that degrade neighbours | Graceful Degradation (cascade mechanics) | Governance Theatre, Shadow Operations, Undiscussable Accumulation, Defensive Filtering |
| Increase Prosperity | Explore toward broader distribution | Penalise patterns that concentrate value | Semantic Stability (A7), Provenance (A4), Adaptive Pressure (A8) | Skilled Incompetence, Pathological Autopoiesis |
| Increase Understanding | Explore toward greater legibility | Penalise patterns that increase opacity | Comprehension Primacy (A9), Transparency (A3), Fidelity (A1), Visible State (A2) | Monitoring Overlay, Intermediary Layer, Dimensional Collapse |

### Imperative Health in Scale Escalation

The trajectory signatures that trigger Scale 2→3 escalation (see §Scale Escalation) can be read as imperative health signals:

Refinement Futility (oscillating ΦL, stable ΨH, flat εR) signals Ω₁ failure — suffering recurs despite intervention. ΨH/ΦL Divergence signals Ω₁ and Ω₂ failure — the system is internally coherent but externally ineffective. εR Floor Breach signals Ω₃ failure — the system has stopped exploring, which means it has stopped discovering. Memory Stratum Blockage signals Ω₃ failure — data accumulates without becoming understanding.

---

## Structural Integrity

The grammar governs what valid expressions look like. Structural integrity is the practice of verifying that proposed changes — to patterns, to compositions, to the specification itself — remain expressible in the grammar's existing terms.

### The Principle

Every proposed structural change must be expressible using the existing morphemes, state dimensions, grammar rules, and axioms. If it cannot, the proposal is either introducing a new concept that requires constitutional review, or it is attempting to build something the grammar does not support.

This is the operational expression of Semantic Stability (A7) applied to system evolution. Structural integrity verification tests whether a proposed change composes from existing primitives or mutates the vocabulary.

### Anti-Patterns

An anti-pattern is a recurring structural configuration that violates one or more axioms or grammar rules. Anti-patterns are not prohibited by policy — they are structurally detectable through the graph's own properties.

Each anti-pattern has four properties:

| Property | What It Captures |
|---|---|
| **Structural signature** | The graph topology that constitutes the anti-pattern — what it looks like in the structure |
| **Axiom violation** | Which axiom(s) or grammar rule(s) the configuration violates, and why |
| **Detection heuristic** | How to identify the anti-pattern from observable graph properties |
| **Causal relationships** | Which anti-patterns this one causes, is caused by, or co-occurs with |

The anti-pattern catalogue is structural. It lives in the Assayer's Grid (□) alongside the axioms and grammar rules, and evolves through governance operations — new anti-patterns are added when structural violations are observed, existing entries are refined through operational experience, and entries with no observed instances over extended periods decay. The catalogue is produced by the governance system through its own operations, not maintained as an external reference.

The specification defines foundational anti-patterns that anchor the detection framework. These are organisational — they define classes of violation that follow from the grammar itself. The Assayer Grid extends them with structural anti-patterns discovered through operation.

#### Foundational Anti-Patterns

**Monitoring Overlay** — A separate entity that observes execution and writes derived results to the graph, rather than execution producing its own observations inline. Violates A2 (Visible State): the pattern's health signal is separated from the pattern itself. Structural signature: a node whose only function is to read other nodes' properties and write derived values back to the graph, with no operational function of its own. Detection: any node with read-only relationships to operational nodes and write relationships to observation stores, that has no operational purpose beyond observation.

**Querying the graph is not a monitoring overlay.** The distinction matters and is worth stating plainly. A governance committee wants headline numbers — mean ΦL across active Blooms, number of degraded components, top-3 risk concentrations. A Cypher query that reads these values and returns them is *reading state that was produced by the system's own operations*. The query is a lens on existing structural state, not an entity that produces structural state. This is legitimate, expected, and the primary way non-technical stakeholders interact with the system. Reports, summaries, committee packs, risk dashboards that read the graph — all fine. The test is simple: **does this thing write to the graph?** If it only reads, it is consumption. If it writes derived state that the operational path should have written, it is the anti-pattern.

The subtler distinction concerns **where computation occurs**. Two approaches can produce the same number:

*Approach A:* A Cypher query runs inside the governance system, computing mean ΦL from structural state. The computation occurs within the system's operational boundary, governed by the same axioms as the data it reads, with the query itself recorded in the provenance chain.

*Approach B:* An external dashboard extracts raw ΦL values, computes the mean in its own application layer, and presents the result as governance insight. The computation occurred outside the system's operational closure — ungoverned by the axioms, unrecorded in the provenance chain, unverifiable against the graph state at the time of computation.

The numbers may be identical. The difference is provenance. Approach A has a verifiable chain from graph state through computation to result. Approach B does not. When numbers arrive at a committee without provenance, there is no way to distinguish a faithfully computed result from a fabricated one. External computation that presents itself as system-derived insight is a provenance violation (A4) — its outputs claim an authority their computation path cannot support.

This matters because external computation tools will proliferate wherever the governed system contains valuable data. Each one introduces an unverifiable interpretation layer between structural state and the decisions made from it. The structural fix is not to prohibit external tools but to make the provenance distinction visible — to make it structurally obvious which numbers came from the graph and which did not. See Query Attestation below.

Causal: often co-occurs with Intermediary Layer. The pressure to build monitoring overlays and external computation arises when the operational path does not produce the observations that consumers need — the structural fix is to enrich what the operational path writes, not to build a parallel observation system.

**Intermediary Layer** — A signal pipeline, health computation service, or wrapper interposed between execution and the graph. Violates A6 (Minimal Authority): claims authority the graph write path does not need it to have. Structural signature: a Resonator that sits between an operational pattern and the graph write layer, transforming data that the operational pattern could write directly. Detection: any Resonator whose inputs and outputs could be connected directly without loss of information.

**Dimensional Collapse** — Represents multi-dimensional signal as a single scalar, flag, or binary state. An "error morpheme" when error is already a region of ΦL/ΨH/εR space. A "health score" that merges distinct signals into an opaque composite. Violates A3 (Transparency): the collapsed representation obscures information the existing dimensions were designed to carry. Structural signature: a derived property that aggregates two or more state dimensions into one value. Detection: any computation that aggregates across state dimensions (combining ΦL with ΨH, or εR with ΦL) into a single scalar consumed by downstream decisions. Aggregation within a dimension (computing ΨH from structural coherence and runtime friction, computing ΦL from its four factors) is legitimate composition, not collapse.

**Prescribed Behaviour** — Patterns that dictate what other patterns do rather than creating selective pressure through structural properties. Violates the grammar principle: if a prescribed pattern is needed to produce a desired behaviour, the grammar is not expressive enough. Structural signature: a pattern with outbound command Lines to other patterns' internal Resonators, bypassing those patterns' own decision logic. Detection: cross-Bloom Lines that target internal Resonators rather than Bloom boundary interfaces.

**Governance Theatre** — Formal governance structures that exist but do not influence actual decisions. Violates A1 (Fidelity): representation does not match reality — the governance structure claims authority it does not exercise. Structural signature: governance nodes (policies, constraints, review gates) with low or zero inbound Lines from operational patterns, indicating decisions flow around rather than through governance. Detection: governance-labelled nodes whose connection density and signal flow are significantly lower than their structural position implies.

**Shadow Operations** — State stored or decisions made outside governed channels. Violates A2 (Visible State): health and activity are hidden in places the governance graph cannot inspect. Structural signature: operational outcomes that appear without corresponding governance trail — effects visible in the graph that have no traceable cause within the governed topology. Detection: nodes or property changes with absent or incomplete provenance chains.

**Defensive Filtering** — Feedback loops that exist structurally but systematically exclude high-threat information. Violates A3 (Transparency): signals are interpretable in theory but filtered in practice so that threatening information never reaches decision points. Structural signature: ΨH divergence between governance Lines and operational Lines — governance Lines carry smooth, uniform signals (high ΨH / low friction) while operational Lines carry varied, turbulent signals (low ΨH / high friction). The gap between the two sets of Lines' friction values IS the filtering signal — governance channels are calmer than the reality they claim to represent. Detection: the runtime friction component of ΨH (TV_G) computed across governance Lines diverges significantly from TV_G computed across operational Lines within the same Bloom. Causal: causally prior to Governance Theatre — Governance Theatre is the visible symptom; Defensive Filtering is the mechanism that produces it.

**Skilled Incompetence** — Sophisticated compliance architectures that satisfy every formal requirement while systematically preserving existing arrangements and preventing genuine adaptation. Violates A8 (Adaptive Pressure): the governance apparatus grows but what it governs does not change — learning is blocked by the sophistication of the compliance structure itself. Structural signature: the Constitutional Bloom's Merkle signature is static (no constitutional changes, εR at the constitutional level is zero) while governance Blooms' containment grows — more Seeds, more Lines, more Resonators, expanding structure around a frozen core. Detection: the Constitutional Bloom's signature has not changed across multiple Learning Helix iterations while the governance Blooms' node and Line counts have grown. Visible as a stable, unchanging core surrounded by expanding structure. Causal: the structural mechanism through which Defensive Filtering achieves its effect in mature organisations.

**Undiscussable Accumulation** — Issues that cannot be raised through formal governance channels accumulate until they produce system failure. The formal channels exist but the cost of using them exceeds the perceived benefit of raising the issue. Violates A2 (Visible State) and A8 (Adaptive Pressure): state is hidden not because governance lacks the mechanism to surface it, but because the mechanism's social or structural cost suppresses its use. Structural signature: growing divergence between formal reports (governance channel outputs) and informal signals (shadow channel activity, escalation patterns, resolution latency). Detection: when an issue Seed surfaces, its provenance timestamp is compared against earlier observation Seeds in the affected component's Grid that carry the same signal signature. The temporal gap between the earliest matching observation Seed and the issue Seed's creation IS the accumulation period — measured by Line distance between two Seeds that already exist in the graph, not by external temporal analysis. Large gaps indicate prolonged suppression. Causal: second-order extension of Shadow Operations — Shadow Operations detects what is happening outside governance; Undiscussable Accumulation explains why.

**Pathological Autopoiesis** — A system optimising for self-maintenance rather than its stated purpose. Internal coherence rises while structural coupling with external purpose weakens. Violates Ω₁-₃ (Heuristic Imperatives): the system maintains its own governance structures but ceases to serve the purposes those structures were built for. Structural signature: ΨH (internal coherence) trending upward while ΦL (substrate health outcomes) trends flat or downward, combined with εR (exploration rate) contracting — the system interacts with decreasing variety of environmental states. Detection: compound signal from three state dimensions — ΨH ↑ while ΦL ↓ or flat, plus εR contraction sustained beyond the containing Learning Helix's iteration period. Distinct from Dimensional Collapse (which loses a dimension entirely) — Pathological Autopoiesis maintains all three dimensions but their relationship to purpose decouples. Causal: the terminal state of unchecked Skilled Incompetence — governance that has become so internally coherent it no longer responds to the reality it governs.

### Query Attestation

Provenance (A4) requires that every element carry the signature of its origin. This principle extends to query results. When a number leaves the governance graph and arrives at a decision-maker's table, the decision-maker needs a way to verify: did this number come from the graph, and does it faithfully represent the graph's state at the time it was computed?

Query attestation is the mechanism. Every query result produced within the governance system's operational boundary is itself a **Seed** (•) — a morpheme instance with morpheme properties:

| Seed Property | What It Carries |
|---|---|
| **Content** | The query result — the data returned |
| **Provenance (createdBy)** | The query that produced it — what was asked |
| **Provenance (sourceRef)** | The Merkle root of the Bloom(s) touched by the query at execution time — the structural snapshot the computation ran against |
| **Timestamp (createdAt)** | When the query executed |
| **Structural signature** | The Seed's own Merkle hash, binding all properties into a cryptographically verifiable attestation |

The attestation Seed connects via Lines to the Bloom(s) the query read from — making the provenance chain structural, not just metadata. The Seed's Merkle signature (from §Structural Signatures) binds all fields: content, provenance, timestamp, and graph state reference into a single verifiable hash.

This hash is small, deterministic, and machine-verifiable. It can be embedded in any output format — a QR code on a committee slide, a footer on a PDF report, a JSON block in an API response. Any recipient can verify: this result was computed from this graph state, by this query, at this time, within the governance system's operational boundary. Fabricated or externally computed numbers cannot produce a valid attestation because they lack a Seed in the graph with Lines to the source Blooms and a valid Merkle signature.

The attestation does not prove the query was *correct* — a poorly written query can return misleading results from valid data. It proves **provenance**: the result's origin is the governance graph, not an external computation. Correctness is a query design concern. Provenance is a structural guarantee.

For external tools that consume graph data: any tool that reads from the graph through attested queries and presents the results without further computation inherits the attestation. A tool that transforms, aggregates, or recomputes values outside the graph breaks the attestation chain — its outputs are its own, not the graph's, and should be marked accordingly. The boundary between "presenting graph state" and "computing new state" is the boundary between inherited provenance and broken provenance.

This mechanism does not prohibit external computation. It makes the provenance distinction structurally visible. A committee member receiving two numbers — one with a valid attestation and one without — can make an informed judgment about which to trust. The system does not police external tools. It makes the absence of provenance legible.

### The Assayer

The structural integrity verification is itself a pattern — a Resonator (Δ) that transforms proposed changes into compliance assessments. Its interface is `validate(proposal) → ComplianceResult`, returning a per-axiom, per-grammar-rule assessment with evidence.

The Assayer reads from a Grid (□) containing the current axioms, grammar rules, and the anti-pattern catalogue. The catalogue is a living structural artefact: entries are added when violations are observed and distilled, refined through operational experience, and decayed when no instances are detected over extended periods. When violations are found, refinements flow through a Helix (🌀). The pattern operates within a Bloom (○) with defined interfaces.

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

### Scale 1: Refinement (Within a Single Execution)

**Temporal constant:** Seconds to minutes.
**Morpheme:** Refinement Helix (🌀 within a Bloom ○).
**Mechanics:** Bounded iteration. A Resonator produces output, a downstream Resonator evaluates it, feedback flows backward through a Return Line (←), and the producing Resonator regenerates.

Properties:

- **Bounded** — refinement loops have a maximum iteration count. A loop that cannot converge within its bound must terminate and pass the best available result forward.
- **Feedback is structured** — the Return Line carries specific diagnostic content (what failed, why, how to fix), not just a retry signal.
- **Degradation behavior** — if refinement fails within the iteration bound, the Bloom accepts the best available output and signals degradation through reduced ΦL on the output Seed.

**Feedback Effectiveness** — the fraction of identified issues resolved by the refinement cycle. Low effectiveness across many runs signals mismatched feedback mechanics — the evaluating Resonator and the producing Resonator may have low ΨH.

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
Scale 1 (Refinement) produces: execution records, feedback effectiveness metrics
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

### Scale Escalation

Data flows between scales continuously. But data flow alone does not guarantee that patterns observed at one scale produce deliberation at the scale above. Without formal escalation triggers, a system can accumulate evidence at Scale 2 that its governing variables need changing while never transitioning to Scale 3 — doing unlimited adaptive learning within existing rules without questioning whether the rules themselves should change.

#### Scale 1 → Scale 2 Promotion

When the same Scale 1 refinement type is applied more than N times (constitutional default: 3) across distinct executions without a corresponding Scale 2 learning event, the refinement is promoted to Scale 2 for pattern analysis. "Same refinement type" is determined by the diagnostic content of the Return Line — refinements that carry the same structural signature are the same type regardless of which execution they occur in.

Without this trigger, recurring Scale 1 refinements become invisible at Scale 2 — each execution refines and moves on, and the structural pattern never surfaces.

#### Scale 2 → Scale 3 Trajectory Signatures

Scale 2 learns within existing rules. Scale 3 questions the rules. The transition between them is the most consequential boundary in the feedback architecture.

The conditions requiring escalation produce characteristic trajectories through the three-dimensional state space (ΦL, ΨH, εR). Detection is pattern recognition on the encoding itself — the Codex detects escalation conditions in the same dimensional channels it uses to encode everything else. The multi-dimensional trajectory shape IS the statistical confidence mechanism — the probability that noise produces a specific multi-dimensional pattern across dimensions simultaneously is much lower than for any single variable independently.

Six trajectory signatures are defined in the Constitutional Bloom as Seeds carrying the characteristic state-space shapes. An Escalation Detection Resonator matches observed trajectories against this vocabulary:

**Refinement Futility** — Damped oscillation in ΦL that does not converge upward. ΨH stable or rising. εR flat. Refinements are applied (ΦL rises) but the underlying cause reasserts (ΦL falls back). The refinement mechanism works (ΨH says the parts agree) but the governing variable is wrong. The system isn't exploring alternatives (εR flat).

**Pattern Recurrence** — Repeated identical excursions in ΦL across different components, with matching ΨH signatures at each excursion. The same structural problem manifests in different places.

**ΨH/ΦL Divergence** — ΨH trending upward while ΦL trends flat or downward. εR contracting. The system is becoming more internally coherent while its actual outcomes stagnate or decline. Increasingly resonant but increasingly dim.

**εR Floor Breach** — εR below constitutional minimum, sustained. ΦL may be high (false confidence). The system has stopped exploring — locked into a local optimum with no mechanism to detect environmental change.

**Temporal Stagnation** — ΨH shows high frequency but persistently low scope in its temporal decomposition. ΦL varies locally but is flat globally. A narrow part of the system is learning actively while the broader composition stagnates.

**Memory Stratum Blockage** — Stratum 2 (Observational) Grid growing but Stratum 3 (Distilled) Grid static. The distillation Resonator's own ΦL declining. The system is collecting observations but not distilling them into lessons.

For statistical confidence: trajectories must persist for at least one full iteration of the containing Learning Helix. Oscillation amplitude must exceed the spread component of the component's ΦL decomposition. Refinement Futility specifically requires temporal correlation between refinement events and ΦL peaks — uncorrelated oscillation is common-cause variation, not special-cause.

#### Escalation Mechanics

When a trigger fires, the event is recorded as a Seed in the graph — carrying the trigger type, the evidence, the timestamp, and the state dimension values. Scale 3 deliberation engages: in a single-operator system, the issue surfaces to the human; in a federated system, constitutional review initiates; in an automated system, the Evolutionary Helix triggers. The trigger persists until addressed (Scale 3 produces a response with evidence) or the conditions resolve. Silent dismissal without evidence is itself detectable — a governance event with no operational response, flaggable as potential Defensive Filtering.

#### Safeguards

Each trigger requires sustained evidence — not transient signals. Calibration tunes trigger thresholds over time based on false positive and false negative rates. Scale 3 engagement produces deliberation, not automatic change — the Constitutional Evolution safeguards (rate limiting, cooling periods, reversion protocol) apply to any changes that Scale 3 proposes.

### Calibration (Meta-Process)

Operating on the timescale of months to quarters, calibration tunes the parameters of the existing three scales. It iterates on the parameters that govern how the system evaluates patterns, not on patterns themselves. Its inputs are false positives, false negatives, and threshold boundary oscillation events.


---

## Memory Topology

Memory in a Codex Signum system operates at four strata, each with different granularity, retention, and access patterns. The strata describe the *persistence characteristics* of information at each scope.

### Stratum 1: Ephemeral (Execution Context)

**Scope:** A single execution within a Bloom boundary.
**Retention:** Duration of the execution.
**Owner:** The executing pattern instance.
**Morpheme home:** Inside a Bloom (○), governed by a Refinement Helix (🌀).

Working memory. Input data, intermediate results, retry state, refinement feedback. Local to the execution and discarded on completion.

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

### Morpheme Grounding of Memory Operations

The memory strata are not abstract layers — they are morpheme compositions:

**Recency weighting is a Line property.** The decay formula `e^(-λ × age)` is the weight on the Line connecting an observation Seed to the computation Resonator that reads it. The Line's weight decays with the Seed's age. This is G4 — brightness encodes recency. Older Lines are dimmer, carrying less signal.

**Compaction is a Resonator operation.** When an observation Seed's Line weight drops below the threshold (0.01), a compaction Resonator archives the Seed — it remains in the Grid but its Lines to active computation Resonators are severed. The Resonator is contained within the Grid's Bloom.

**Distillation is a Resonator operation between Grids.** The distillation Resonator reads from a Stratum 2 Grid (observations) through Lines and writes to a Stratum 3 Grid (insights) through Lines. Its inputs are many (raw observations); its output is few (distilled lessons). The quality of distillation — does the compressed insight preserve the information the raw observations carried? — is the distillation Resonator's own ΦL. A distillation Resonator that produces insights that fail to predict future observations has declining ΦL.

**Contextual enrichment flows downward through Lines.** When a Stratum 3 insight informs a Stratum 2 observation — "pay attention to this signal" — the insight Seed connects via a Line to the observation Resonator. The Line carries the contextual signal. This is the reflexive loop that Argyris identified as both the memory system's greatest strength (organising principles shape observation) and greatest vulnerability (beliefs filter data to confirm themselves). The Scale 2→3 escalation triggers (see §Scale Escalation) exist specifically to detect when this reflexive loop has become pathological.


---

## Immune Memory

The immune memory system performs two complementary functions from the same infrastructure: defence against harmful patterns and repair of capability gaps. In biology, the immune system identifies and attacks threats AND initiates wound repair. Same cells, same signalling pathways, complementary functions. The Codex immune memory follows the same principle.

### Morpheme Composition

The immune memory system is a composition of morphemes within a Bloom:

**The Threat Archive Grid** (□) — stored in Stratum 3 (Distilled Memory). Contains archetype Seeds (•), each carrying a coupling effect signature distilled from a harmful pattern that was phased out. Each archetype Seed has content (the structural invariants and surface variants of the harmful signature), provenance (which pattern produced it, when it was phased out), and ΦL (confidence in the archetype — high if recently matched, decaying if not).

**The Remedy Archive Grid** (□) — also Stratum 3. Contains compensatory pattern Seeds (•), each carrying a friction profile paired with the morpheme configuration that successfully resolved it. Every time a compensatory morpheme survived (its ΦL rose, the friction dropped, the Assayer approved), the successful gap-plus-fix pair is distilled into this Grid. The remedy archive is the system's learned library of structural repairs.

**The Threat Matching Resonator** (Δ) — reads incoming pattern coupling signatures from the ecosystem's operational Blooms and compares them against the Threat Archive using two-pass matching. First pass on structural invariants (the deep features of harm: extraction asymmetry, information opacity, vitality degradation gradient). Second pass on surface variants (specific topological shapes for fast exact-match detection). When a threat match is found, the Resonator produces an alert Seed and an Acceleration Line to the boundary penalty Resonator, with weight proportional to similarity and historical severity.

**The Remedy Matching Resonator** (Δ) — reads incoming friction profiles from Lines whose dimensional friction exceeds their threshold and compares them against the Remedy Archive, matching the friction profile's dimensional shape against known remedies. When a remedy match is found, the Resonator instantiates the compensatory morpheme within the Bloom that owns the receiving endpoint of the friction Line. Two separate Resonators sharing the same containing Bloom — each with its own authority scope (A6), its own ΦL, and its own observation history. The immune memory Bloom is the shared infrastructure. The Resonators are the separate functions.

**The Archive Helix** (🌀) — a Learning Helix governing both Grids. Manages recency weighting (entries with no recent matches decay), capacity limits (low-confidence entries evicted first), distillation (redundant entries consolidated), and provenance constraints (threat archetypes can only be created from observed harmful patterns that were actually phased out; remedy entries can only be created from compensatory morphemes that actually improved friction).

### Threat Response (Defence)

When a new pattern's coupling effect signature matches a threat archetype, the boundary penalty functions receive an acceleration factor proportional to similarity and historical severity. The ecosystem responds faster to threats it has seen before. The first encounter is expensive. Subsequent encounters trigger faster.

Threat archetypes are created when a pattern is phased out and its coupling effect signature showed harmful characteristics. A distillation Resonator reads the pattern's coupling history and produces a new archetype Seed carrying the structural invariants, surface variants, and phasing context.

### Gap Response (Repair)

When a Line's dimensional friction exceeds its threshold, the friction profile propagates as a signal to the immune memory Bloom. This is not a request for help routed through governance. It is a local chemical signal, like cytokine release at a wound site. The Line is the first and most local element that knows the gap.

The Remedy Matching Resonator runs the friction profile against the Remedy Archive:

**Match found.** A compensatory morpheme whose configuration previously resolved a similar friction profile is instantiated at the friction site within the containing Bloom. This is not novel creation. It is recombination from learned experience. The compensatory morpheme:

- INSTANTIATES the appropriate constitutional definition (it is a real morpheme, subject to all grammar rules)
- Starts with near-zero ΦL (cold start, per the maturity modifier)
- Is contained within the pattern Bloom (G3 — its effects are local)
- Begins executing immediately, its output flowing through the circuit it was inserted to repair

**Partial match found.** The closest remedy is instantiated speculatively. The Line conducts but with visible uncertainty (the compensatory morpheme's low ΦL dims the Bloom slightly through parent-from-children derivation). The system is trying something it hasn't fully validated.

**No match found.** The friction profile has no precedent in the Remedy Archive. The immune memory produces a capability gap Seed and an escalation signal. The system is surfacing "I need something I don't have" as a structural event, not a runtime error.

### Compensatory Morpheme Lifecycle

The compensatory morpheme follows natural selection:

**Birth.** Instantiated from the Remedy Archive at the friction site. Near-zero ΦL. Wired into the circuit between the weak point and the consumer.

**Trial.** The morpheme executes. Observations accumulate in its Grid. Did friction on the Line drop? Did downstream ΦL improve?

**Survival.** If ΦL rises (it added value), the morpheme persists. It becomes part of the pattern's structural topology. Future executions include it. The Assayer evaluates it like any other morpheme. If it passes grammar compliance and the friction data confirms its value, the Remedy Archive is strengthened — the remedy's confidence increases.

**Dissipation.** If ΦL doesn't rise (it added noise, or overhead, or didn't improve output), it dissipates. Its Lines go dark. Its observations persist in the Grid as a lesson — "this compensation didn't work for this gap type." The failure prevents the system from trying the same failed remedy again.

### Runaway Control

Compensatory morpheme creation is bounded by existing structural constraints:

εR bounds it. Speculative instantiation IS exploration. It consumes εR budget. When εR hits the upper bound of its healthy range, no more speculative creations until existing ones resolve.

ΦL bounds it. Each compensatory morpheme is a child of the pattern Bloom. Its near-zero ΦL drags the Bloom's aggregate ΦL down. Too many speculative children and the Bloom itself dims, triggering the system's own degradation signals.

G3 bounds it. The compensatory morpheme is contained within the pattern Bloom. Its effects are local.

The Remedy Archive bounds it. The system can only instantiate from LEARNED patterns. It cannot invent novel morphemes. This is recombination from experience, not generation from nothing.

### Cold Start

The Remedy Archive starts empty. During the learning period, all friction that exceeds threshold follows the "no match found" path — escalation to the operator. When the operator resolves the friction (manually inserting a compensatory morpheme, reconfiguring the circuit, or accepting the friction), the resolution is observed. If the compensatory morpheme survived, the gap-plus-fix pair is distilled into the Remedy Archive. The archive accumulates organically from resolved escalations. This matches the Threat Archive, which also starts empty and learns from observed harmful patterns.

### What This Means

The immune memory system learns in both directions. Every new threat enriches the Threat Archive. Every new gap successfully bridged enriches the Remedy Archive. The same distillation mechanism, the same Learning Helix, the same Stratum 3 memory. The system gets smarter about what to fight AND what to fix. Defence and repair from the same immune system.


---

## Degradation Cascade Mechanics

When a component degrades, the effect propagates through the pattern network. This propagation follows defined rules to prevent both silent failure (degradation invisible) and panic cascading (one failure collapses everything).

### Propagation as Line Properties

Degradation propagates through Lines — the same morpheme that carries data flow, signal transfer, and harmonic coupling. The propagation rules are properties of Lines, not separate mechanisms.

**Direction (G2):** Degradation propagates in two modes. Through CONTAINS Lines, parent ΦL is structurally derived from children — this is not signal flow through a Line but structural derivation from the topology. The parent recomputes its own ΦL from its children's values. Through FLOWS_TO Lines, degradation propagates forward (producer → consumer) as signal flow — a degraded producer's output carries that degradation to the consumer. Degradation does not propagate sideways through Resonance.

**Attenuation (G4):** Each CONTAINS Line carries a dampening weight — the fraction of the child's ΦL change that propagates to the parent. This weight is computed from the parent Bloom's branching factor (the number of CONTAINS Lines flowing into it):

```
γ_effective = min(γ_base, safety_budget / k)
```

Where `γ_base` is recommended at 0.7, `safety_budget` at 0.8, and `k` is the branching factor (count of CONTAINS Lines). This is a property of the Line, computed from the Bloom's topology. The formula guarantees spectral radius μ = k × γ ≤ 0.8 < 1 for all k ≥ 1 — failures attenuate faster than they accumulate regardless of topology.

| Branching Factor (k) | γ_effective (s=0.8) | μ = k×γ | Status |
|---|---|---|---|
| 1 | 0.7 | 0.7 | Subcritical ✓ |
| 2 | 0.4 | 0.8 | Subcritical ✓ |
| 3 | 0.267 | 0.8 | Subcritical ✓ |
| 5 | 0.16 | 0.8 | Subcritical ✓ |
| 10 | 0.08 | 0.8 | Subcritical ✓ |

**Depth limit:** Degradation propagates through at most two levels of CONTAINS Lines. A failing Seed dims its Bloom. A failing Bloom dims its containing Bloom. The containing Bloom recomputes its own ΦL from its constituents with the signal already attenuated. The 2-level depth limit is a property of CONTAINS Line propagation, not a separate rule.

**Asymmetric rate (G2 — direction encodes flow):** The CONTAINS Line carries different attenuation for degradation (downward ΦL change) versus recovery (upward ΦL change). Degradation propagates at γ_effective. Recovery propagates at γ_effective / hysteresis_constant (recommended: 2.5). The same Line, the same property, different values depending on signal direction. Recovery requires sustained improvement — the system resists oscillation between healthy and degraded.

**Algedonic bypass:** When a component's ΦL drops below 0.1 (emergency threshold), the CONTAINS Line's dampening weight overrides to 1.0 — full propagation to root, bypassing all attenuation. This preserves normal dampening for routine degradation while ensuring existential threats are never masked. The bypass is a property of the Line activated by the child's ΦL value, not a separate mechanism.

### Degradation Visibility

Degradation events produce visible signals at the point of degradation and at each propagation level. Each event is a Seed in the event Grid, connected by Lines to the component that produced it:

| Event | Signal | Morpheme |
|-------|--------|----------|
| Component ΦL crosses threshold | Luminance shift; threshold event emitted | Event Seed in observation Grid |
| Degradation propagates to container | Container ΦL updates; boundary may flicker | Container Bloom's ΦL recomputation |
| Component recovers across threshold | Luminance brightens; recovery event emitted | Recovery Seed in observation Grid |
| Component remains degraded beyond observation window | Sustained dim state; escalation event | Escalation Seed — feeds Scale Escalation |

---

## Event-Triggered Structural Review

Scale Escalation (see Adaptive Feedback) detects when the system's state-space trajectory indicates the need for deliberation — it reads ΦL, ΨH, and εR over time. Structural review is the complement: it examines the graph's topology itself — the shape of the network, not the health of its components.

None of the three feedback scales is the right place for this assessment. Structural review examines aggregate spectral properties that are expensive to compute continuously but cheap to compute on demand. It fires in response to events, not on a schedule — an immune response, not a monitoring loop.

### Triggers

The **Structural Review Resonator** (Δ) monitors event Seeds in the observation Grid. When specific events appear, it initiates a diagnostic:

| Trigger | Signal Source | What It Means |
|---|---|---|
| λ₂ drop on formation | ΨH Resonator output when a composition is assembled or modified | New component weakens the graph's connectivity |
| Friction spike | TV_G crossing threshold, sustained beyond the containing Refinement Helix's iteration period | Runtime friction indicates operational mismatch not resolvable by refinement |
| Cascade activation | Degradation event Seed reaching the 2-level CONTAINS Line depth limit | A failure is severe enough to propagate through containment |
| εR spike at composition level | εR computation at Bloom boundary | Composition has lost confidence — exploring heavily |
| ΦL velocity anomaly | Rate-of-change on ecosystem-wide ΦL | Ecosystem-wide health shifting faster than 0.05/day |
| Ω gradient inversion | Imperative Gradient Resonator output | Any imperative gradient turns negative after sustained positive period |

### Diagnostic Outputs

The Structural Review Resonator computes aggregate topological properties and writes them as Seeds in a Structural Review Grid:

1. **Global λ₂** — algebraic connectivity of the full active graph. From the same Laplacian eigendecomposition used for ΨH, but computed at the ecosystem scope rather than per-composition.
2. **Spectral gap** (λₙ / λ₂) — structural balance indicator. A large gap means the graph has even connectivity. A small gap means it has bottlenecks.
3. **Hub dependency** — nodes whose removal would cause the largest λ₂ drop. These are structural vulnerabilities — single points of failure in the connectivity.
4. **Friction distribution** — TV_G across all active compositions. Identifies which compositions are operationally strained.
5. **Effective dampening assessment** — whether the current γ values on CONTAINS Lines are appropriate for the actual topology. If branching factors have changed since γ was last computed, dampening may be miscalibrated.

Review outputs feed the existing feedback topology through Lines — hub dependency informs routing, dampening recommendations feed Calibration, friction hotspots feed Scale 2 evaluation, global λ₂ trend feeds Scale 3 ecosystem health.

### Relationship to Scale Escalation

Structural review and scale escalation are complementary, not competing. Scale escalation reads state-space trajectories (health and behaviour over time). Structural review reads topological properties (the shape of the network at a point in time). Either can trigger the other: a cascade activation (structural event) may initiate both a structural review AND a trajectory assessment. An εR spike (trajectory event) may trigger a structural review to understand why confidence collapsed.


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

Hygiene scans are the immune system of the pattern network. They surface problems; remediation is a separate concern. The hygiene scan Resonators are grounded morpheme instances — each scan is a Resonator (Δ) reading from the graph's properties through Lines, producing detection event Seeds when violations are found. The detection Seeds connect via Lines to the components they flag, forming a structural evidence trail.

Hygiene scans and anti-pattern detection are complementary. Hygiene scans detect component-level issues (dormant seeds, stale observations, broken connections). Anti-pattern detection (§Structural Integrity) detects structural-level violations (monitoring overlays, governance theatre, defensive filtering). Both operate through the same mechanism — a Resonator reading graph properties and producing detection Seeds — but at different scales of analysis. Hygiene scans are not monitoring overlays. They produce event Seeds (structural facts: "this Seed is dormant") rather than derived operational values that the operational path should have written. Events are new observations with their own provenance. Derived values duplicate what the operational path should have produced.

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

The existing specification addresses bad actors through structural properties — coupling costs penalise harmful patterns, immune memory accelerates response to known threat signatures. This section addresses coordinated attacks that can overwhelm natural selection pressure.

### The Ecosystem Stress Resonator

Adversarial detection is performed by the **Ecosystem Stress Resonator** (Δ), which reads rate-of-change signals from the graph's own properties. The Resonator has its own ΦL — if it is not detecting attacks, its health dims. Its inputs arrive through Lines from the graph's operational Grids. Its output is a stress index property on the root Bloom — a single value reflecting the aggregate stress level of the ecosystem.

The Resonator reads five signals, each derived from existing morpheme properties:

| Signal | Morpheme Source | Normal Range | Anomaly Indicator |
|---|---|---|---|
| Node creation rate | Count of new Seeds per time window in the observation Grid | Follows usage patterns | Spike exceeding 3σ of rolling mean |
| Connection formation rate | Count of new Lines per time window | Proportional to node creation | Disproportionate spike |
| Mean ΦL velocity | Rate of change of mean ΦL across all active Blooms | < 0.05/day | > 0.1/day |
| ΨH distribution collapse | Variance of ΨH values across compositions | Stable or slowly increasing | Sudden collapse toward uniform value |
| Federation gossip volume | Count of federation gossip Seeds per time window in the federation Grid | Proportional to activity | Disproportionate spike |

The stress index is computed as a weighted composite of these signals' deviation from their rolling means — the same approach as ΦL computation but applied to rate-of-change signals rather than state signals. The weights are tunable per deployment. The rolling means are maintained by a Learning Helix spanning the Ecosystem Stress Grid.

### Bulkhead Mechanics

When the stress index exceeds a warning threshold, the Ecosystem Stress Resonator activates bulkhead responses through Lines to the relevant governance Resonators:

- **Federation isolation** — quarantine, not exile. The Federation Resonator temporarily suspends pattern acceptance from high-stress sources. A Line property change, not a topology change — the connection remains but signal transmission is dampened.
- **Acceptance rate limiting** — the pattern onboarding Resonator reduces its throughput. New patterns queue rather than entering immediately.
- **Cascade dampening override** — CONTAINS Line γ values are temporarily reduced, tightening propagation attenuation. A Line property change that reduces how much of a child's degradation reaches its parent — the system becomes more conservative about propagating signals during stress.
- **Provenance weighting increase** — patterns without clear provenance chains (A4) receive elevated scrutiny. The ΦL computation's provenance_clarity weight (w₂) is temporarily increased.

These are stress responses expressed as Line property and Resonator configuration changes — they engage automatically when the stress index exceeds the threshold and disengage when it returns to normal. Recovery is deliberately slow — matching the hysteresis principle used throughout the cascade mechanics. The system absorbs the stress before reopening.

Each bulkhead activation is recorded as a Seed in the event Grid — carrying the stress index value, the activated responses, and the timestamp. These Seeds feed Scale 2 learning about what attack patterns look like and how effective the responses were.

---

## Constitutional Coupling

Every morpheme instance in the graph maintains an `INSTANTIATES` Line (→) to the constitutional definition of its morpheme type in the Constitutional Bloom. This Line is not a passive type tag. It is a structural coupling with consequences.

### The Constitutional Bloom

The Constitutional Bloom (○) is the organisational core — the Bloom that contains every definition that must hold for the system to be a Codex Signum system:

```
○ Constitutional Bloom
  │
  ├── Morpheme Definitions
  │     ├── • Seed Definition         ← INSTANTIATES ── every Seed instance
  │     ├── → Line Definition          ← INSTANTIATES ── every Line instance
  │     ├── ○ Bloom Definition         ← INSTANTIATES ── every Bloom instance
  │     ├── Δ Resonator Definition     ← INSTANTIATES ── every Resonator instance
  │     ├── □ Grid Definition          ← INSTANTIATES ── every Grid instance
  │     └── 🌀 Helix Definition       ← INSTANTIATES ── every Helix instance
  │
  ├── Axiom Seeds (A1–A4, A6–A9)              ← read by the Assayer Resonator
  │
  ├── Grammar Rule Seeds (G1–G5)       ← read by the Assayer Resonator
  │
  ├── Imperative Seeds (Ω₁–Ω₃)        ← read by the Imperative Gradient Resonator
  │
  ├── State Dimension Definitions      ← read by the ΦL, ΨH, εR Resonators
  │     ├── • ΦL Definition (computation parameters, weight defaults)
  │     ├── • ΨH Definition (structural/runtime weights, temporal decomposition)
  │     └── • εR Definition (gradient sensitivity, spectral calibration)
  │
  ├── Anti-Pattern Catalogue Seeds     ← read by the Assayer Resonator
  │     (foundational entries; catalogue extends through operation)
  │
  └── Escalation Trajectory Seeds      ← read by the Escalation Detection Resonator
        (six trajectory signature definitions)
```

The Constitutional Bloom INSTANTIATES its own Bloom Definition — it is a Bloom, governed by the same rules as every other Bloom. This self-reference is autopoietic closure.

### The INSTANTIATES Line

Each INSTANTIATES Line carries:

- **Constitutional reference:** Hash of the definition Seed it points to. When the definition changes (constitutional amendment), this hash becomes stale — detectable by comparing the Line's reference against the definition's current Merkle signature.
- **Conformance weight:** How faithfully the instance matches its definition. An instance that satisfies all grammar constraints for its morpheme type has a conformance weight of 1.0. An instance that stretches or partially violates constraints has a lower weight. The weight affects constitutional gravity (lower conformance = weaker gravitational pull toward the definition = spatial drift).
- **Direction:** The INSTANTIATES Line flows from instance to definition (G2 — toward = forward flow, seeking the source of identity). Signals flow in both directions through the Line, but the Line's direction encodes that the definition is the source and the instance is the realisation.

### What INSTANTIATES Carries

**Downward propagation (definition → instance):** When a constitutional definition changes through the amendment process, the change propagates through every INSTANTIATES Line. Instances with stale references are structurally detectable — their constitutional reference hash no longer matches the definition's current hash. During constitutional transition, both old and new hashes are valid.

**Upward aggregation (instance → definition):** The constitutional definitions carry aggregate health of all their instances. If a disproportionate number of Seed instances are degraded, the Seed definition's own ΦL reflects this — the morpheme type itself is under stress. This is morpheme-level health monitoring with zero monitoring overlay: the definition's ΦL is computed from its instances' ΦL through the same parent-from-children derivation as any Bloom.

**Rendering and behaviour:** The constitutional definition carries properties that all instances share — rendering parameters (what a healthy Seed looks like), grammar constraints (what a Seed may connect to), and computation configuration (how ΦL is computed for a Seed). Instances read these through the INSTANTIATES Line rather than storing local copies. One source of truth.

### Morpheme Interaction Rules

The grammar rules (G1-G5) constrain how morphemes combine. The Constitutional Bloom encodes which morphemes can interact in which ways:

| Container | May Contain | Relationship |
|---|---|---|
| **Bloom** (○) | Seeds, Lines, Resonators, Grids, Helixes, other Blooms | CONTAINS — G3 containment |
| **Grid** (□) | Seeds, Lines | CONTAINS — structured knowledge |
| **Helix** (🌀) | Does not contain — it spans. A Helix operates ACROSS elements it governs. | GOVERNS — temporal scope |
| **Resonator** (Δ) | Does not contain — it transforms. Inputs and outputs flow through Lines. | FLOWS_TO / FLOWS_FROM — G4 flow |
| **Seed** (•) | Does not contain — it is the atomic unit. | Contained by others |
| **Line** (→) | Does not contain — it connects. | Connects two endpoints |

These interaction rules are encoded in the morpheme definition Seeds within the Constitutional Bloom. The Assayer reads them when validating proposed structural changes — "Can a Resonator contain a Seed? No. Can a Bloom contain a Helix? A Bloom can contain elements that a Helix spans, but the Helix itself operates across containment levels."

---

## Structural Signatures

Every element in the graph carries a cryptographic signature that encodes its contents, its morpheme identity, and its position in the containment hierarchy. The Signature Resonator (Δ) reads a morpheme instance's properties through Lines, computes the hash, and writes the signature as a property on the instance. Signature propagation through CONTAINS Lines works exactly like ΦL degradation propagation — a change in a child's signature propagates upward to the parent.

### Composition

At the leaf level (a Seed with no children), the Signature Resonator reads: morpheme type, constitutional reference (hash of the definition it INSTANTIATES), content hash, properties hash (ΦL, ΨH, εR, status, timestamps), and relationship hashes (sorted hashes of all Lines).

At a containing level (a Bloom with children), the signature additionally includes the Merkle root of all contained elements' signatures — a single hash encoding the full state of everything inside.

The Constitutional Bloom's signature is the identity of the entire system's organisation. Two Codex Signum instances with the same constitutional signature share the same grammar, axioms, and morpheme definitions. Different signatures mean different organisations.

### The Signum

Provenance (A4) requires that every element carry the signature of its origin. This extends to query results through the attestation mechanism (see Query Attestation in §Structural Integrity). The attestation may be rendered in the Codex's own visual language — a **Signum** that encodes the attested scope's structural state through the same perceptual properties used throughout the encoding.

The Signum is generated by a rendering Resonator from the same structural data that produces the Merkle signature. Brightness encodes aggregate ΦL. Hue encodes harmonic character. Saturation encodes εR. Shape encodes composition density. Symmetry encodes structural balance. The visual IS the attestation — a healthy system produces a bright, vivid, harmonically coherent mark; a degraded system produces a dim, desaturated one.

The Signum is not designed. It is computed. Its aesthetics carry information.

### Relationship to Federation

In a federated network, each node's constitutional signature verifies organisational identity — same grammar, same axioms, same morphemes. Pattern sharing across federation is verifiable: a pattern's signature encodes its full contents and constitutional lineage. Nodes with different constitutional signatures are running different organisations, which is not an error but a structural fact that federation makes visible.

### Relationship to Constitutional Evolution

When a constitutional amendment is ratified, the Constitutional Bloom's signature changes. Every INSTANTIATES reference is stale. The staleness propagates upward through the Merkle tree. The root signature changes — structurally visible evidence of constitutional change. Transition completes when the root Bloom's ΦL recovers to its pre-amendment baseline, measurable as the proportion of instances with stale constitutional references approaching zero.

---

## Scale

The grammar is fractal. Any valid expression at one scale remains valid at all scales.

| Distance | Perception | Cost |
|----------|------------|------|
| **Far** | Glow, position, cluster membership | Minimal |
| **Medium** | Shape, connections, health state | Low |
| **Near** | Internal structure, specific flows | Moderate |
| **Threshold** | Full detail available | **Decision point** |
| **Engaged** | Bidirectional data flow | Active relationship |

Before threshold: perception is passive. After threshold: attention flows both ways. The threshold is where looking becomes engaging. This is consent built into geometry.

### Fractal Validity

The grammar is fractal. Any valid expression at one scale remains valid at all scales. A Seed at system scale is an organisation; at function scale, a datum. A Bloom at system scale is an industry vertical; at function scale, a pipeline stage.

This means the morphemes, grammar rules, state dimensions, and axioms apply identically at every scale. A Bloom within a Bloom within a Bloom satisfies the same containment rules (G3) at each nesting level. ΦL computed at the ecosystem level uses the same formula as ΦL computed for a single Seed — the inputs differ (ecosystem-wide observations vs component observations) but the computation is the same Resonator type with the same logic.

### Scale and Containment

Containment depth IS scale. A Seed inside a Bloom is at one scale. The Bloom inside another Bloom is at a higher scale. That Bloom inside a federation-level Bloom is at a higher scale still. Each nesting level is a scale transition. The grammar's fractal property means each transition is valid — the contained element is a complete Codex expression at its own scale, enclosed by a valid Codex expression at the enclosing scale.

Scale and position interact through containment gravity. Deeper containment (more nesting levels) produces tighter spatial clustering. A Seed deeply nested inside multiple Blooms occupies a narrow spatial region — it is far from the graph's root in both containment depth and spatial distance. The semantic zoom model follows this structure: zooming in spatially corresponds to descending through containment depth.

### Semantic Zoom

The distance table above describes perception at different scales. Semantic zoom is the mechanism that traverses these scales dynamically. At each zoom level, the perceptual channel mapping (see §Perceptual Foundation) delivers state information through the appropriate visual channels:

**Far (ecosystem):** Each Bloom is a point of light. Brightness = ΦL. Colour = harmonic character. Position = spectral embedding. The observer reads ecosystem health at a glance — which regions are bright (healthy), which are dim (degraded), which are vivid (exploring), which are grey (frozen). Clusters of similar colour = resonant compositions. Isolated dim points = degraded components. The Constitutional Bloom glows at the centre.

**Medium (composition):** Individual morphemes within a Bloom become visible. Seeds as points, Lines as connections, Resonators as transformations. The Bloom's boundary is visible. Connection density and signal flow patterns become readable. ΨH is perceptible through pulsation phase — synchronised pulsation between components means coherence.

**Near (component):** Internal properties of individual morphemes. ΦL as a precise value, not just brightness. Observation Grid contents visible. Helix iteration state visible. Provenance chains traceable. The full structural detail.

**Threshold (engagement):** The observer decides to interact. Attention flows both ways — the component now knows it is being observed (in an interactive system). Cypher queries become available. The LLM interface (see UI notes in the Engineering Bridge) enables natural-language interrogation of the component's state and history.

**Engaged (operation):** The observer is now an active participant. Data flows bidirectionally. The observer can invoke patterns, modify configurations, trigger reviews. The graph records the engagement as a structural event — who engaged, when, what they did.

---

## Complex Adaptive System Dynamics

Codex Signum exhibits properties of a complex adaptive system when deployed in networked or federated contexts. These properties are not guaranteed — they follow from usage at sufficient scale. The system is useful at any scale regardless.

### Emergence

When many patterns operate within a shared graph, system-level behaviours emerge that no individual pattern was designed to produce. Routing preferences develop from Thompson sampling across many executions. Composition archetypes form as successful structures are replicated. Knowledge propagates through the memory topology without central coordination. These are emergent properties — they arise from the interaction of governed patterns, not from a prescribed design.

Emergence is visible through the state dimensions: a composition's ΨH may rise without any component's ΨH changing, because the composition has found a resonant configuration through interaction rather than design. This is earned resonance (see ΨH temporal decomposition — high frequency, long duration, broad scope). The harmonic profile of the composition is a structural record of what emergence has produced.

### Self-Organisation

No central coordinator dictates pattern usage. Successful patterns propagate through utility. What works spreads. What does not, dims. This selective pressure operates through ΦL — high-health patterns are selected more often by routing decisions (Scale 2), and their compositions are replicated more readily (Scale 3). The selection is structural: the graph's own health signals create the pressure, not an external evaluator.

### Edge of Chaos

The system operates in the critical zone between rigidity (εR = 0, all decisions exploit known-best options) and incoherence (εR = 1, all decisions are random exploration). Too ordered is prevented by Axiom 8 (Adaptive Pressure) and the εR floor mechanisms (imperative gradient modulation, spectral calibration). Too chaotic is prevented by the axioms and grammar rules, which constrain what valid expressions look like. At the edge: the constitutional core provides stability, extensions allow exploration, and health signals create the selective pressure that maintains the balance.

This maps precisely to Kauffman's edge-of-chaos thesis: optimal adaptive behaviour occurs at the boundary between frozen dynamics (too-rigid governance) and chaotic dynamics (no governance). The εR state dimension IS the measure of where on this spectrum the system sits. The Calibration meta-process tunes the εR range over time, maintaining the edge as the system evolves.

### Requisite Variety

Ashby's Law of Requisite Variety states that a controller must have at least as many states as the system it controls. The six morphemes and three state dimensions provide the variety in the governance vocabulary — enough to encode health, coherence, exploration, containment, flow, transformation, structure, and temporality across any domain. If the governance vocabulary lacked a dimension, it would be unable to represent (and therefore govern) behaviours in that dimension. The three state dimensions are the minimum set that provides requisite variety for the domain of "coherent work flowing through layers of abstraction."

Superposition (instantiation multiplicity) provides variety in execution — the same pattern can be instantiated across diverse substrates, exploring different approaches simultaneously. The Thompson sampling router manages this variety, balancing exploration of uncertain alternatives against exploitation of known-good options.

---

## Autonomy and Constitutional Evolution

### Core Ossification

Once the core reaches stability, it becomes presumptively immutable: 6 morphemes, 8 axioms, 5 grammar rules, 3 state dimensions, 3 heuristic imperatives. Breaking changes require either a major version fork, which coexists rather than replaces, or a constitutional amendment under the conditions defined below.

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

5. **Ratification (Transition Period)** — The amendment is merged. A transition period allows implementations to adopt. Both old and new are valid during transition. Transition ends when the root Bloom's ΦL recovers to its pre-adoption baseline — measurable through the proportion of instances with updated constitutional references and the ecosystem's aggregate health trajectory.

#### Safeguards

**The axioms govern the process.** Every amendment must satisfy the axioms during evaluation. You can change what an axiom says, but not in a way that violates what the other axioms require of the process.

**Rate limiting.** No more than one Tier 3, three Tier 2, or five Tier 1 amendments may be simultaneously active.

**Cooling period.** After a successful amendment, new amendments of the same or higher tier cannot be proposed until the root Bloom's ΦL recovers to its pre-amendment baseline. The system must demonstrate it has absorbed the change before accepting another. This is evidence-based, not calendar-based — a resilient ecosystem recovers quickly, a fragile one needs more time.

**Reversion protocol.** If a ratified amendment produces sustained negative effects, any trusted node may initiate reversion. Abbreviated lifecycle. A reverted amendment cannot be resubmitted until the conditions that triggered the reversion are structurally addressed and the root Bloom's ΦL has returned to its pre-amendment baseline.

**Fork freedom preserved.** The right to fork is unconditional. Constitutional Evolution is an alternative to forking, not a replacement for it.


---

## Governance

### Phase 1: Benevolent Dictator (Current)

- **Duration:** Until core stabilises
- **Authority:** Original creator
- **Scope:** Core clarifications, initial patterns, documentation
- **Constraint:** All decisions must satisfy the eight axioms and three heuristic imperatives
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
  │                 │                 🌀 Helix (iterate — Refinement)
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

**What is stable:** The six morphemes, the three state dimensions, the eight axioms, the three heuristic imperatives, the five grammar rules. These are the foundation. They do not change except through constitutional amendment.

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
| 5.0 | 2026-03-12 | Major structural revision. Thesis rewritten as six falsifiable predictions with inline Codex formulas, grounded in Ashby, Maturana, Senge, Meadows, Shannon. A5 (Reversibility) removed — derived from A4 plus memory topology, not an independent constraint. Eight axioms. All axioms rewritten with structural enforcement mechanisms (Line conductivity, G3 containment, Constitutional Bloom). Ontology section removed — the grammar is the thing. Morpheme definitions grounded: all shapes derived from topology, all visual properties from state dimensions. Resonator shape from input/output ratio. Grid defined as pure data (Seeds and Lines, no computation). Helix shape from iteration behaviour. Superposition operational mechanics moved to Engineering Bridge. New concepts: Line Conductivity (three-layer circuit model — morpheme hygiene, grammatical shape, contextual fitness), Immune Memory repair function (Remedy Archive + compensatory morpheme lifecycle), observation Grid extensibility (patterns define their own pins), dimensional profiles (partitioned ΦL by task classification). Correction renamed to Refinement throughout. Part One stripped to grammar definitions — operational machinery moved to Part Two. Systems thinking integration (Maturana, Senge, Beer, Argyris). Constitutional Identity, Morpheme Grounding, anti-pattern framework (10 entries), Scale Escalation (six trajectory signatures), Constitutional Coupling with Bloom diagram and INSTANTIATES Line spec, Structural Signatures, the Signum, Position formal calculation, CAS Dynamics, Scale section developed. All Part Two mechanisms grounded in morpheme compositions. |

---

*The grammar is the thing. Build in it. Watch it learn.*
