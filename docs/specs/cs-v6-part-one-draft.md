# Codex Signum

## A Language Where State and Governance Are Structural

**Version:** 6.0 (Draft)
**Status:** Draft. Part One complete, Part Two in revision.
**Prior Version:** 5.0 (Draft)
**License:** CC0 / Public Domain (Specification) · Apache 2.0 (Reference Implementations)
**Canonical URL:** TBD
**SHA-256:** TBD (computed on release)

---

# Part One — The Language

## Abstract

Codex Signum is a language where **state and governance are structural**. It represents complex patterns in a form that is both human-legible and machine-processable.

In current architectures, state and representation are separate concerns, and a parallel infrastructure of metrics, logs, dashboards and alerts exists to bridge them. The Codex removes the separation.

It describes systems where coherent work flows through layers of abstraction, such as agentic workflows, knowledge graphs, distributed processes and organisational dynamics. It applies wherever the health, provenance, relationships and learning dynamics between components need to be visible rather than queried.

The grammar draws on autopoietic theory, cybernetics and spectral graph theory. It has been refined through iterative implementation against a working reference system, and the implementation has revised the grammar as often as the grammar has directed the implementation.

---

## Purpose

Every digital system today carries a hidden cost. You build the system, then you build a second system to watch the first. Monitoring tools, compliance dashboards, health checks, governance layers, audit trails. The observer infrastructure often rivals the complexity of the thing it observes. And it lags. By the time the dashboard shows a problem, the problem has been happening for a while.

This specification proposes that the observer infrastructure is unnecessary. When the health, coherence and learning capacity of a system are properties of its own structure rather than measurements taken from outside, three things follow.

The computation collapses. Separate calculations for health propagation, coherence measurement, spatial positioning and signal conditioning turn out to be different views of the same structural properties. The grammar is dense so the computation can be simple. This follows from Ashby's Law of Requisite Variety. A grammar with sufficient variety to match its domain does not need supplementary mechanisms to govern what it can already express. `Δ(distinct_computations) / Δ(governed_complexity) < 0`

Governance becomes structural. Trust, provenance and health are visible properties of the structure, and anomalies appear as irregularities in it. An audit is a query against the structure itself, not a reconstruction from logs. Governance is not a layer applied to the system; it follows from how the system is composed.

The system carries its own condition. Degradation, overload and failure are structurally distinct states, readable from the encoding rather than inferred from outside it. Patterns with aligned signatures resonate, and misalignment registers as dissonance. Feedback flows through the same connections that carry the work, so components degrade measurably before they fail, routing adapts to their condition, and recovery follows the same paths back. Coherence, adaptation and feedback are not features added to the system. They are consequences of its composition.

The grammar that follows defines three heuristic imperatives, eight axioms, six morphemes, three state dimensions and five grammar rules. Everything in the specification, every computation, every governance mechanism, every feedback loop, is expressed in these terms and subject to these rules, including the specification's own governance operations.

---

## Heuristic Imperatives

Three heuristic imperatives orient the purpose of the system. The axioms define how the language must behave; the imperatives define what it is for. They are guardrails rather than laws, operating at the ecosystem level, where they shape the direction of exploration and penalise coupling effects that work against them. Individual morphemes and patterns do not compute imperative compliance. If the structure is sound and the ecosystem-level pressure is aligned, outcomes at the lower scales follow.

These are Dave Shapiro's heuristic imperatives for autonomous systems. They shape εR, the direction of exploration, and coupling costs, the patterns the system penalises. Everything else in the specification operates without reference to them. The imperatives are the compass, not the engine. Their formal treatment, including gradient computation, proxy sources, coupling cost functions and escalation relationships, is in Part Two §Imperative Gradient Signals and §Imperative Coupling Constraints.

### Ω₁ — Reduce Suffering

The system tends toward reducing suffering in its participants and its environment. Its structural expression is the Ω₁ coupling cost component (Part Two §Imperative Coupling Constraints) and §Immune Memory, which archives the signatures of harmful coupling so they are recognised when they recur.

### Ω₂ — Increase Prosperity

The system distributes capability rather than concentrating control, and creates more value than it captures. Its structural expression is the Ω₂ coupling cost component (Part Two §Imperative Coupling Constraints), which penalises patterns whose effect signature concentrates authority or gates access.

### Ω₃ — Increase Understanding

The system makes the opaque comprehensible. This is the imperative most deeply embedded in the design; the entire language exists to increase understanding. The Comprehensibility axiom is its structural expression.

### The Three Together

The imperatives constrain each other. Any one of them, satisfied alone, curdles. Suffering is cheapest to reduce by eliminating whatever suffers. Prosperity without the other two permits exploitation. Understanding by itself is indifferent to what it costs. Three imperatives in tension keep the direction of travel somewhere none of them would reach alone.

---

### Imperative-Axiom Alignment

Each imperative exerts its pressure through specific axioms and is worked against by specific anti-patterns. The mapping is not exclusive; the anti-pattern column lists primary opposition, and several anti-patterns oppose more than one imperative. Pathological Autopoiesis violates all three by its own definition (§Anti-Patterns) and appears under Increase Prosperity because value extraction during self-maintenance is its clearest signature.

| Imperative | εR Pressure | Coupling Penalty | Served By | Opposed By |
|---|---|---|---|---|
| Reduce Suffering | Explore toward faster detection and recovery | Penalise patterns that degrade neighbours | Visibility, Fidelity | Governance Theatre, Shadow Operations, Undiscussable Accumulation, Defensive Filtering |
| Increase Prosperity | Explore toward broader distribution | Penalise patterns that concentrate value | Least Authority, Semantic Stability, Provenance, Learning | Skilled Incompetence, Pathological Autopoiesis |
| Increase Understanding | Explore toward greater legibility | Penalise patterns that increase opacity | Comprehensibility, Testability, Fidelity, Visibility | Monitoring Overlay, Intermediary Layer, Dimensional Collapse |

The cascade mechanics of graceful degradation also serve Reduce Suffering, as mechanism rather than axiom. Measurable decline before failure is what makes suffering detectable early enough to reduce.

## Axioms

Eight axioms constrain all valid expressions. Three are foundations, holding without dependency on anything else. Five are derived, and each is capped by the foundations beneath it.

### Axiom Dependency Structure

The eight axioms are numbered in dependency order. Three are foundations and five are derived from them. Their dependencies form a directed acyclic graph (DAG):

```text
                 ┌──→ Fidelity (4)
Visibility (1) ──┤
                 ├──→ Provenance (5)
                 ├──→ Semantic Stability (6)
                 └──→ Learning (7)

Testability (2) ──→ Fidelity (4)
                ──→ Learning (7)
                ──→ Comprehensibility (8)

Least Authority (3) ─── (independent)
```

**Reading the DAG:**

- **Foundation (A1–A3):** Visibility, Testability, and Least Authority have no dependencies. They constrain every other axiom.
- **Derived (A4–A8):** Fidelity, Provenance, Semantic Stability, Learning, and Comprehensibility each depend on one or both of Visibility and Testability. Fidelity depends on both. You cannot demand accurate representation from a system whose state cannot be observed or whose derivations cannot be examined.

**The ceiling rule.** A derived axiom's effective score cannot exceed the score of its weakest parent. Assessment therefore proceeds in DAG order, foundations first. If Visibility is violated, Fidelity, Provenance, Semantic Stability, and Learning cannot be meaningfully assessed. If Testability is violated, Fidelity, Learning, and Comprehensibility cannot be assessed.

The DAG is not an additional constraint. It describes logical relationships that already hold between the axioms, and the numbering follows it.

### Foundation (A1–A3)

*State is visible. Signals are testable. Authority is bounded.*

#### A1. Visibility

Health, activity, and connection are expressed in the structural properties of the encoding. A healthy pattern, a failing pattern, and a dead pattern are structurally distinct states, distinguishable from the encoding alone, and the same holds for active against dormant and exploring against rigid.

The state is always in the structure. External systems may derive their own reports, dashboards, or representations from it. The Signum (see §Structural Signatures) provides the verification mechanism. Any claim about a system's state can be checked against the Signum generated from the graph's actual topology. If the claim matches the Signum, it is structurally grounded. If it doesn't, the claim is unverified. The Codex does not prevent external representations. It makes them testable.

#### A2. Testability

Every signal must be open to interrogation. Premises are explicit, derivations traceable, conclusions testable by their receivers. Interpretability is necessary but not sufficient. A signal that is readable but whose derivation cannot be examined does not satisfy the axiom, and a governance mechanism whose rules are legible but whose application cannot be questioned has achieved legibility, not testability.

Line conductivity enforces this structurally. A signal whose origin is untraceable or whose derivation has no computation path in the graph fails the morpheme hygiene layer of the conductivity check. The Line will not carry it. Opacity is not detected after the fact; it prevents the circuit from closing.

This extends to the system's own adaptive behaviour. When immune memory instantiates a compensatory morpheme at a friction site, every step in the chain is examinable, from the Line that signalled the friction, through the dimensional profile that triggered the match and the remedy archive entry that was selected, to what the compensatory morpheme produced and whether it survived. The system's self-repair is as testable as everything else it governs.

#### A3. Least Authority

A pattern requests only the resources its purpose requires. Containment (G3) enforces this. A Resonator's input Lines define its authority scope. It cannot read what it is not connected to. It cannot write outside its containing Bloom.

### Derived (A4–A8)

*Representation is accurate. Origin is known. Vocabulary is stable. Learning is visible. Understanding wins.*

#### A4. Fidelity

Representation must match actual state. A Seed displaying health while encoding corruption is a structural violation. The state dimension computations must be deterministic given the same structural inputs.

#### A5. Provenance

Every element carries the signature of its origin. Line conductivity enforces this. An element without traceable provenance fails the morpheme hygiene check, its Lines do not conduct, and it cannot participate in flows. It is structurally present but inert. This is not a policy about trust. It is a consequence of the circuit model. No provenance, no conductivity.

#### A6. Semantic Stability

The vocabulary is fixed. Growth is compositional. New patterns compose from existing morphemes. They do not introduce new morpheme types, new state dimensions, or new grammar rules.

The Constitutional Bloom enforces this. Morpheme definitions, axiom Seeds, and grammar rule Seeds are contained within it. Every instance in the graph INSTANTIATES one of these definitions. A proposed change that alters a definition rather than composing from it triggers the constitutional amendment process (see §Constitutional Evolution). The Merkle signature of the Constitutional Bloom changes, every INSTANTIATES reference becomes stale, and the transition is structurally visible across the entire graph.

#### A7. Learning

A system that cannot learn is already degrading. Learning from observed outcomes must be structural and visible. Feedback flows through Lines, adaptation manifests as ΦL change, and exploration is measurable as εR. The three-scale feedback topology (Refinement, Learning, Evolution) enforces this. A pattern with no Helix has no learning mechanism. Its εR is zero. It is structurally rigid, and that rigidity is visible.

#### A8. Comprehensibility

When efficiency and understanding conflict, understanding wins. The language serves comprehension. A faster system that nobody can read is worse than a slower one that everyone can. The perceptual channel mapping, the semantic zoom model, and the Signum all exist because of this axiom.

---

## Constitutional Identity

A Codex Signum system has two layers. Its organisation is what makes it a Codex Signum system, and consists of three heuristic imperatives, eight axioms, six morphemes, three state dimensions, five grammar rules, and one closure condition, that the grammar governs itself. Its structure is everything else, the specific instances, their properties, their connections, and their computation parameters.

Organisation is invariant. Change it and the system becomes something else. Structure changes continuously. A system can grow, prune, and rewire its graph while remaining a Codex Signum system, as long as the organisational pattern holds. Two systems share the same organisation when their relational patterns are isomorphic; they are the same kind of system realised in different structures.

| Category | Organisation (Invariant) | Structure (Variable) |
|---|---|---|
| Morphemes | The six morphemes and their grammatical relations | Specific instances, their properties, their connections |
| State dimensions | ΦL, ΨH, εR as complementary measures | Specific computation parameters, weights, thresholds |
| Axioms | The eight axioms | Specific axiom compliance assessments |
| Imperatives | The three heuristic imperatives | Specific imperative proxy compositions |
| Grammar | The five grammar rules | Specific rule applications |
| Self-reference | The grammar governs itself | Specific governance pattern compositions (Assayer, Retrospective, Architect, etc.) |

### The Constitutional Bloom

The organisation is held in one place. The Constitutional Bloom contains the morpheme definitions, the axiom Seeds, the grammar rule Seeds, the imperative Seeds, the state dimension definitions with their computation parameters, the anti-pattern catalogue, and the escalation trajectory signatures. Every instance in the graph references a definition within it.

The Constitutional Bloom INSTANTIATES its own Bloom definition. It is a Bloom, governed by the rules it contains, and that self-reference is the closure condition made structural.

### The Change Test

The test for any proposed change is whether it alters the relational pattern among the organisational elements, or only the realisation and expression of those relations. A change to the relational pattern is foundational, Tier 3 in the amendment taxonomy (see §Constitutional Evolution), because it changes what the system is. Everything else is adaptation within organisational closure, the system evolving its structure while preserving its identity.

The amendment tiers follow from this test. Tier 1 changes tunables, values the specification already identifies as configurable. Tier 2 refines expression and computation, clarifying language or adjusting how a dimension is computed, without changing what the elements mean or require. Tier 3 changes the relational pattern itself. Renaming an axiom whose constraint and dependencies are unchanged is Tier 2 by this test; removing an axiom, or adding a dependency between axioms, is Tier 3 however small the diff looks. The evidentiary burden scales with the tier because the tiers measure distance from identity, not size of diff.

---

## The Six Morphemes

All expressions in Codex Signum compose from six fundamental forms. These are immutable primitives whose meanings are fixed across all versions, all implementations, all scales.

The six morphemes function as dimensional channels of a multi-dimensional encoding space, not as a small vocabulary of discrete units composed sequentially. Each morpheme defines a distinct encoding dimension. The dimensions are identity (Seed), connectivity (Line), containment (Bloom), transformation (Resonator), persistence (Grid) and iteration (Helix). Composition combines these dimensions, producing a continuous space whose combinatorial richness far exceeds sequential composition of discrete units. A coordinate system with six axes defines a vast space from six primitives; the same holds here. Six is the minimal dimensional basis for the domain, four structural dimensions any self-producing system requires (identity, connectivity, containment, transformation) and two temporal dimensions any learning system requires (persistence, iteration). Fewer collapses a dimension into another. More duplicates one.

### • Seed (Identity)

**Encodes:** Origin, instance, datum, coherent unit

The Seed is the atomic unit, a piece of data, a function instance, a decision point.

A Seed with no inbound or outbound Lines is **Dormant**. It is present in the graph, potentially viable, but not participating in any flow. Dormant Seeds have ΦL computed from their internal properties but an integration factor of zero (see §State Dimensions).

In a pattern, Seeds are the nodes. Data points, function calls, decision moments.

### → Line (Connectivity)

**Encodes:** Flow, transformation, direction, conductivity

The Line connects morphemes, carries transformation, and gives flow its direction.

**Direction** encodes relationship:

- Forward (→) — transformation, processing
- Return (←) — result, feedback
- Bidirectional (↔) — dialogue, iteration, read and write against the same endpoint

At the atomic level there is at most one asserted Line between any two morphemes. The Line's type names the one true relationship between them; a second asserted Line means either the first is mistyped or one of the two is derivable from the other. Multiple Lines between a Resonator and a Grid or Bloom are aggregation artefacts. Each terminates at a different contained morpheme, and at Seed level the one-Line rule holds.

No Line type exists for monitoring. A record that feeds a transformation reaches it through an ordinary input Line with full provenance obligations. An external consumer inspecting the graph performs a read, and a read requires no structural element. Association (similarity, adjacency) is an outcome, derived and recomputed like position, never asserted as flow.

A Line's activity is its traffic, the record of signal traversals through it. Traffic is read from execution records, not stored as a property. An idle Line carries no flow; an active Line carries flow at whatever rate work actually moves through it. Aggregate activity at a Bloom boundary is the sum of its Lines' traffic, not a separately encoded property.

In a pattern, Lines are the flows. Data moving, transformations executing, results returning. Their conductivity determines whether the circuit works.

### Line Conductivity

Conductivity determines whether signal flows. A Line is not a passive connection. It is a circuit that closes only when both endpoints satisfy the requirements for that connection. Conductivity is determined at three layers.

#### Layer 1: Morpheme Hygiene

Both endpoints must satisfy the property contract of their own morpheme type. For a Seed that means content, seedType, status, provenance and ΦL present, the INSTANTIATES Line to the Constitutional Bloom intact, and the Merkle signature valid. If either endpoint fails baseline hygiene, the Line is topologically present but non-conductive. No signal flows. This is the structural enforcement that makes tampering self-defeating. Stripping a Seed's provenance renders every Line connected to it non-conductive.

#### Layer 2: Grammatical Shape

The Line's connection type must be grammatically valid for both endpoints. A FLOWS_TO Line from a Resonator's output carries a specific signal type, and the receiving morpheme must accept that signal type at that interface point. Containment scope (G3), direction (G2), and signal type (G4) all contribute to the shape. If the shapes don't match, the Line is present but non-conductive.

#### Layer 3: Contextual Fitness

Beyond hygiene and grammar, the Line's friction profile reflects how well the endpoints' dimensional properties align for the specific work being done. A model Bloom connecting to a task Seed may satisfy hygiene and grammar but carry high friction on the reasoning dimension because the model's recorded history shows weakness there. Contextual fitness is continuous, not binary. The Line conducts with varying friction rather than being simply open or closed.

#### What Non-Conductive and High-Friction Lines Mean

Non-conductive Lines are not failures. They are structural information. A Line that cannot conduct because its endpoints are incomplete tells the system exactly what is missing. A Line that conducts with high dimensional friction tells the system exactly where compensation is needed. The Line is the first and most local element that knows the gap.

Conductivity is re-evaluated when either endpoint's structural properties change. Between re-evaluations it is stored on the Line as a derived structural property, the same pattern as ΦL on a node or position on an instance, computed inline, queryable, and stable until its inputs change. Lines have no memory and no record Grid of their own. A Layer 3 evaluation may read an endpoint's record Grid to obtain a dimensional profile, but what it stores on the Line is only the result. Implementation detail belongs in the Engineering Bridge.

### ○ Bloom (Containment)

**Encodes:** Boundary, containment, context

The Bloom defines containment (G3). Everything inside it is within its scope. Lines crossing the boundary are its interface with the outside.

An open boundary indicates active interface Lines crossing it, a Bloom accepting connections. A closed boundary indicates no active interface Lines, a protected scope. This is derived from the topology, not declared.

In a pattern, Blooms define scope. What is inside this pattern, what is protected, where the interface is.

### Δ Resonator (Transformation)

**Encodes:** Transformation, decision, routing

A Resonator reads from input Lines, transforms, and writes to output Lines. Its shape IS its function. A Resonator with many inputs and one output is a compression. One input and many outputs is a distribution. Balanced inputs and outputs is a relay. The classification is derived from the actual input/output topology, not prescribed, and its ΦL reflects how well it transforms.

Every Resonator has a minimum viable topology:

- at least one input Line, since a transformation without a traceable input violates Provenance
- at least one output Line, since a transformation whose result is not expressed in structure violates Visibility
- an INSTANTIATES Line to the Constitutional Bloom
- containment within a Bloom (G3)

Resonators that participate in learning, meaning routing decisions, evaluations, and transformations with quality-assessable outputs, must have their own record Grid. Simpler Resonators inherit learning visibility through their containing Bloom's recording infrastructure.

Not every computation is a Resonator. A Resonator is a transformation, taking an input and producing a structurally different output. The state computations (ΦL, ΨH, εR, conductivity, position) are inline derivations. They read an element's own topology and records, write the element's own properties, and are executed by the write layer when their inputs change, leaving no structural residue. The test is whether instantiating a computation would create an element whose only function is reading other elements' properties and writing derived values back. If so, it is a derivation, and instantiating it is the Monitoring Overlay (§Anti-Patterns). A derivation has no state of its own because it is not an element. Its audit is determinism, since the same structural inputs reproduce the same value.


In a pattern, Resonators are the transformations. Where input becomes output, where routing decisions happen. Their shape tells you what kind of transformation they perform.

### □ Grid (Persistence)

**Encodes:** Structured data, knowledge, persistent memory

A Grid contains Seeds and Lines. Nothing else. No Resonators, no Helixes, no Blooms. This is the structural distinction from a Bloom. A Grid is pure data with no active computation inside it. Its contents are stable between external writes. Resonators read from Grids and write to Grids, but they operate from outside the Grid's boundary.

The Grid's internal topology IS its retrieval structure. A record Grid has Seeds connected by temporal Lines, a timeline navigated sequentially. A Threat Archive Grid has Seeds connected by derived similarity Lines, a cluster map navigated by matching. These internal Lines are retrieval structure, computed from content and recomputed as the Grid grows. They carry organisation, not flow. The shape of the Grid's internal Line topology determines how its contents are organised and found.

In a pattern, Grids are the knowledge stores. Recorded history, learned patterns, archived signatures, persistent memory. They accumulate over time and are read by the Resonators and Helixes that govern the pattern.

Grids do not forget. The memory topology is append-only, which is what Provenance depends on. An element's origin stays traceable because nothing that recorded it is removed. Degradation is computational rather than structural. Contents persist in full while recency weighting in the derivations that read them discounts old records. And because a Grid contains no computation, nothing inside it can fail. Its failure mode is relational, a Grid written but never read is accumulation without learning, and the trajectory signature for that condition, Memory Stratum Blockage, is defined in §Scale Escalation.

### 🌀 Helix (Iteration)

**Encodes:** Recurrence, iteration, temporal flow

The Helix is the language's temporal primitive and its only legal cycle. Asserted flow through the other five morphemes is acyclic; recurrence cannot be composed from them. A Helix closes a flow into a loop and governs whether the structure it spans executes again.

A Helix holds what a loop declares rather than derives, its convergence criteria, termination conditions, and iteration budgets. It reads from a Grid, evaluates progress against its criteria, and either continues or terminates. Everything else about it is derived from the iteration record, its temporal scale (how fast it iterates), convergence direction (improving, stable, or degrading), and depth (how many iterations have completed).

Learning is what patterns do with recurrence. Records accumulate in Grids across passes and the derivations read them. The scales at which that operates are defined in §Adaptive Feedback.

In a pattern, Helixes are the loops. Retry cycles, review rounds, sampling convergence, evolution over time. A pattern with no Helix has no recurrence, and a pattern that never recurs has nothing to learn across. Its εR is zero.

### Superposition

The grammar permits multiple simultaneous instances of the same composition. Each instance INSTANTIATES the same constitutional definition, has its own independent ΦL, ΨH, and εR, and operates within its own Bloom boundary (G3). Nothing in the grammar restricts a composition to a single instance.

The operational mechanics of superposition, how instances are created, how they execute concurrently, how they collapse to a single result, and how non-selected outputs feed Scale 2 learning, belong in the Engineering Bridge.

---

## Graph Realisation

Every morpheme instance is exactly one structural element. Five morphemes realise as nodes. The Line realises as the edge itself, the element that connects rather than an element that is connected. An instance is never a cluster. A Bloom is one node whose extent is its containment closure, and the morphemes it contains are instances within its scope, not parts of the Bloom.

Each element declares its morpheme type. Type is not inferred from an element's connections, which keeps validation local. Morpheme hygiene (§Line Conductivity Layer 1) can be checked on the element alone, without traversing its neighbourhood.

The state dimensions realise as properties on the element they describe. ΦL, ΨH and εR are properties of the node that carries them. Conductivity and friction are properties of the Line they characterise. Derived state never lives in a separate element, and a value is atomic with the element it describes.

The formulas behind those properties are constitutional. Each derivation's definition is content in a definition Seed, and its tunable parameters are Config Seeds, both within the Constitutional Bloom. The derivation itself is executed by the write layer whenever an element's records or topology change. It is a law of the graph, not an element in it. Nothing performs a derivation as an entity, nothing carries state on its behalf, and the same structural inputs always reproduce the same value (Fidelity).

Every instance binds to its definition. Each morpheme instance carries an INSTANTIATES Line to the constitutional definition of its type, and that Line is a coupling rather than a type tag. Instances read what all instances of their type share, meaning grammar constraints, computation parameters and rendering parameters, through this Line rather than holding local copies, so there is one source of truth. The Line carries a reference to the definition it points to, which becomes stale when the definition changes, making instances of a superseded definition structurally detectable. It also carries a conformance weight recording how faithfully the instance matches its definition, which modulates its constitutional gravity and therefore its position.

The coupling runs upward as well. A definition's own ΦL derives from the instances that reference it, through the same parent-from-children derivation as any Bloom. If a disproportionate number of instances of a type are degraded, the morpheme type itself registers as under stress, and no separate mechanism is needed to notice.

Realisation is uniform where the grammar is not. In graph terms two primitives suffice for any structure, and each of the five node morphemes is, physically, a typed node. What distinguishes the six is grammatical, meaning what each may contain, what each must connect to, and what the rules permit between them. The six morphemes are a minimal dimensional basis, not a topological one, and the grammar is what the types mean, not what the elements are made of.

## State Dimensions

Every morpheme carries three state properties. Health (ΦL), relational coherence (ΨH) and exploration (εR) are structural, expressed in the encoding itself rather than measured from outside it.

ΦL tells you whether something is healthy. ΨH tells you whether things work well together. εR tells you whether the system is still learning. The formal definitions are in Part Two §Formal Calculations.

### Extensibility Through Recording

The three state dimensions are fixed. They are the organisation. What feeds them is not fixed. Every morpheme instance has access to recording infrastructure, its own record Grid or its containing Bloom's, accumulating Seeds from its execution history. The content of those Seeds is domain-specific and pattern-defined.

A model Bloom in an agentic workflow encloses a record Grid whose Seeds carry task classification, hallucination count, reasoning accuracy, code quality, and latency. A compliance Bloom in a governance workflow encloses a record Grid whose Seeds carry regulatory coverage, audit trail completeness, and violation history. Records are Seeds because a Grid contains Seeds and Lines and nothing else, and they are evidence rather than derived state. Each records what an execution did, and the state dimensions are computed from them. The record Grid is the extensibility mechanism. The specification fixes the dimensions; patterns decide what feeds them.

### ΦL — Luminance

**Encodes:** Pattern health

How ΦL and the other dimensions render is defined in §Perceptual Channel Mapping; this section defines the dimensions themselves.

ΦL is computed from four observable factors. These are axiom compliance, provenance clarity, usage success rate, and temporal stability. The weights are tunable per deployment context. Raw ΦL is further adjusted by a maturity modifier that accounts for record depth and integration state, and by recency weighting that decays old records. See §Formal Calculations for the full computation.

#### Interpretation

| ΦL_effective | Status | Meaning |
|---|---|---|
| ≥ 0.9 | Trusted | Highly coherent, well-tested, well-integrated |
| 0.7–0.9 | Healthy | Functional, sufficient for use |
| 0.5–0.7 | Degraded | Use with caution, investigate |
| < 0.5 | Unhealthy | Quarantine or ignore |

### ΨH — Harmonic Signature

**Encodes:** Relational coherence through structural and runtime properties

Each morpheme carries a harmonic signature, its characteristic vibration. Resonance itself is relational. A single morpheme does not resonate; two morphemes resonate with each other, or they don't. Elements with aligned signatures are in **sympathetic resonance**, sharing purpose or nature. Dissonant signatures indicate incompatibility. ΨH becomes meaningful in composition, where it determines whether morphemes compose naturally or resist combination.

ΨH is a two-component metric. The first component (structural coherence) measures whether the graph structure supports coherent information flow. The second (runtime friction) measures whether signals flowing through the graph are smooth or turbulent. See §Formal Calculations for the full computation.

The ΨH computation produces the graph's eigendecomposition, the natural modes of vibration of the graph topology. This decomposition yields three outputs from a single computation:

1. **The scalar ΨH.** The summary coherence score (λ₂ and friction). This is the headline number.
2. **The harmonic profile.** Which modes are active, at what amplitude, at what phase. Two compositions can have identical scalar ΨH while having completely different harmonic characters. One may resonate at the fundamental frequency, broad system-wide coherence. Another may resonate at higher harmonics, local clusters of coherence. The scalar conflates these. The profile distinguishes them.
3. **Spectral position.** The eigenvectors of the Laplacian define each component's natural position in harmonic space. Components with high mutual ΨH are close. Dissonant components are far. Position is a by-product of the ΨH computation, not a separate calculation.

| Friction | Runtime State | Meaning |
|---|---|---|
| < 0.2 | Resonant | Connected components are in phase. |
| 0.2–0.5 | Working | Some mismatch exists but the composition is functional. |
| 0.5–0.8 | Strained | Significant mismatch. Investigate. |
| > 0.8 | Dissonant | The composition is fighting itself. |


### εR — Exploration Rate

**Encodes:** Adaptive capacity through exploration behaviour

The fraction of decisions within a pattern that sample from uncertain alternatives rather than exploiting known-best options. A system that never explores has brittle health, locked into a local optimum, blind to changes in the environment.

εR contextualises ΦL. High ΦL with zero εR is a warning. The system works today but is accumulating brittleness. Moderate ΦL with adaptive εR means the system is learning. See §Formal Calculations for the interpretation table and modulation mechanics.

### Position

**Encodes:** Structural proximity, semantic clustering, compositional accessibility

Position is a derived property, not a fourth state dimension. The spectral embedding from the ΨH eigendecomposition assigns each morpheme instance a location in harmonic space. Connected components cluster. Resonant compositions attract. Dissonant compositions repel. Containment (CONTAINS Lines) creates gravitational wells, a Bloom's children held within its spatial boundary. INSTANTIATES Lines create constitutional gravity, every instance pulled toward its constitutional definition.

Position is stored on morpheme instances as a structural property (queryable, stable) and updated when ΨH recomputes, which happens inline when the graph topology changes.

Position is a consequence of ΨH relationships. Components with high mutual ΨH are placed close together by the eigendecomposition. Components with low mutual ΨH are placed far apart. Distance does not cause friction. Distance reflects friction that already exists in the ΨH computation.

A Line spanning distant positions connects components the topology says do not naturally belong together. The friction is in the ΨH; the distance expresses it. Reaching into a distant Bloom is harmonically strained, and the strain is present in the embedding before anything renders it.

The Constitutional Bloom, containing all morpheme definitions, axioms, grammar rules, and imperatives, has the highest in-degree in the graph, since every instance connects to it via INSTANTIATES. The eigendecomposition places it at the gravitational centre. It IS the centre because everything connects to it. This is not a design choice; it is a mathematical consequence of the topology.


### Dimensional Profiles

The composite ΦL of a morpheme instance is a single number. But the record Grid carries enough data to decompose that number by any classification the pattern defines. A model Bloom with ΦL of 0.75 might decompose to ΦL_code = 0.92, ΦL_reasoning = 0.41, ΦL_grounded_reasoning = 0.83. These are not new state dimensions. They are partitioned views of the existing records, computed on read from the Grid with a classification filter.

Dimensional profiles feed the Line conductivity model. When a Line checks contextual fitness (§Line Conductivity Layer 3) between a task Seed and a model Bloom, it reads the dimensional profile of the model for the relevant task classification. The profile is not a stored property on the model Bloom. It is a query against the record Grid the Bloom contains.

Patterns define their own record classifications. An Architect pattern routing to LLMs defines task classifications (code generation, reasoning, synthesis) and the record Seeds carry those tags. A consulting pattern assessing organisational maturity defines different classifications (governance capability, data literacy, process automation) with different record Seeds. Both use the same grammar, the same state dimensions, the same Line conductivity model. The domain-specific data lives in the Grid. The structure is Codex-compliant. The content is whatever the pattern needs.

---

## Grammar

Five rules govern how morphemes combine. Each carries a stable identifier, G1 through G5, used throughout this specification and in implementations.

The morpheme definitions specify well-formed units. The grammar specifies well-formed combinations, and its violations are properties of arrangements, never of any single morpheme. Every Line in an illegal cycle, every morpheme in a duplicate pair or a cross-boundary reach, can be individually valid while the arrangement is not. This is why the conductivity model checks the morpheme contract (Layer 1) and grammatical shape (Layer 2) as separate layers, and why compliance evaluation queries node contracts and graph shapes separately.

### G1. Proximity — Connection Requires Intent

**Default:** No connection is ever inferred. Morphemes are connected only by asserted Lines. Structural closeness, positional adjacency, similarity, and shared containment imply nothing.

**Exception (Structural Containment):** Containment creates inherent connection. A Seed inside a Grid is part of that Grid. A morpheme enclosed by a Bloom is within that Bloom's scope. The trigger is structural enclosure, never adjacency.

**Multiplicity:** At most one asserted Line exists between any two morphemes. The Line's type names the one true relationship between them (§Line). A second asserted Line between the same pair means either the first is mistyped or one of the two is derivable from the other.

**Derived Lines are not connections in the G1 sense.** Similarity and temporal Lines inside Grids are retrieval structure, computed from content and recomputed as the Grid grows (§Grid). They assert nothing and carry no flow.

### G2. Orientation — Direction Encodes Flow

Every asserted Line carries a direction, and the direction is semantic. Forward carries transformation and processing. Return carries results and feedback. Bidirectional carries dialogue and iteration, read and write against the same endpoint. The taxonomy is defined in §Line; no monitoring orientation exists.

Direction composes into paths, and asserted flow is acyclic. No path of asserted Lines returns to its origin. Recurrence is not built from cycles of assertion; it is expressed by the Helix, the language's only legal cycle (§Helix). A composition that repeats contains a Helix, or it does not repeat.

### G3. Containment — Enclosure Creates Scope

A Bloom or Grid enclosing other morphemes defines:

- **Scope** — what belongs to this pattern
- **Protection** — what is shielded from outside
- **Interface** — where external connection happens, the Lines crossing the boundary

Nested containment creates hierarchy through composition.

Containment is typed. What each morpheme may contain follows from what it is:

| Morpheme | May contain |
|---|---|
| Bloom (○) | Seeds, Lines, Resonators, Grids, Helixes, other Blooms |
| Grid (□) | Seeds and Lines only |
| Resonator (Δ) | Nothing. It transforms, and its inputs and outputs flow through Lines |
| Helix (🌀) | Nothing. It spans, governing elements across containment levels |
| Seed (•) | Nothing. It is atomic |
| Line (→) | Nothing. It connects two endpoints |


G3 governs **intentional effects**, meaning data transformation, state mutation, and explicit signal propagation. A Resonator that transforms state must operate within its declared containment. It cannot reach into a sibling Bloom and mutate its state. If a transformation must cross boundaries, it does so through explicit Lines connecting the boundaries, never by silent reach.

G3 does not govern **structural health propagation**. When a component degrades, its declining ΦL naturally affects the ΦL of its containing Bloom, because health is a structural property computed from constituents (see §Degradation Cascade Mechanics). A parent Bloom's health reflects the health of its children. Intentional effects require explicit Lines. Structural health propagates through containment hierarchy.

### G4. Flow — Conductivity Gates Transfer

Signal moves only through conductive Lines. A Line conducts when both endpoints satisfy morpheme hygiene, the grammatical shape matches, and contextual fitness is sufficient (§Line Conductivity). When the circuit is incomplete, no signal moves.

Conductivity is a structural property, not an administrative rule. This is the primary structural enforcement mechanism. Non-compliant morphemes cannot participate in flows because the Lines connected to them will not conduct. The structure prevents the violation rather than detecting it.

### G5. Resonance — Alignment Modulates Composition

Patterns with harmonically aligned ΨH compose with low friction. Lines between them conduct well (§Line Conductivity Layer 3), and signals cross with little loss. Clashing signatures compose with high friction, and the strain is present in the structure before anything renders it.

Resonance modulates conductivity. It never creates connection, and it never removes the requirement for assertion (G1).

---

## Scale

The grammar is fractal. Any valid expression at one scale remains valid at all scales. A Seed at system scale is an organisation; at function scale, a datum. A Bloom at system scale is an industry vertical; at function scale, a pipeline stage.

The morphemes, grammar rules, state dimensions and axioms apply identically at every scale. A Bloom within a Bloom within a Bloom satisfies the same containment rules (G3) at each nesting level. ΦL derived at ecosystem scale uses the same formula as ΦL derived for a single Seed. The inputs differ, ecosystem-wide records against component records, and the derivation is the same.

Containment depth IS scale. A Seed inside a Bloom is at one scale. That Bloom inside another Bloom is at a higher scale, and that Bloom inside a federation-level Bloom is higher still. Each nesting level is a scale transition, and the grammar's fractal property is what makes each transition valid. The contained element is a complete Codex Signum expression at its own scale, enclosed by a valid expression at the enclosing scale.

Scale and position interact through containment gravity (§Position). Deeper nesting produces tighter spatial clustering, so a Seed nested inside several Blooms occupies a narrow region, far from the graph's root in both containment depth and spatial distance.

## Example

With the vocabulary and grammar defined, here is what the encoding looks like in practice. A document processing pipeline, expressed in Codex Signum. First the flow skeleton:

```
○ document-processing (pattern Bloom)

  • (input)
    → Δ (extract entities)
      → Δ (classify intent)
        → Δ (generate response)
          → • (output)
```

The skeleton shows the four structural dimensions: identity, connectivity, containment, transformation. A real pattern also carries the two temporal dimensions, persistence and iteration. The same pattern with its working anatomy:

```
○ document-processing (pattern Bloom)

  □ (entity-schemas) ──→ Δ (extract entities)
  • (input) ──────────→ Δ (extract entities)
                          → Δ (classify intent)
                            → Δ (generate response) ⟲ 🌀 (refinement)
                              → • (output)

  each Δ ──→ □ (records)          shorthand for three write Lines
  □ (records) ──→ 🌀 (refinement)  the Helix reads the run record

ΦL: 0.87 (healthy: functional, sufficient for use)
ΨH friction: 0.12 (resonant: components in phase)
εR: 0.05 (stable: light exploration of alternatives)
Shape: linear flow, three transformations, one loop, two Grids, one containing scope
```

![Figure: the document-processing pattern in full anatomy: chain, both Grids, the refinement Helix, and the Bloom enclosure](cs-v6-example-figure.svg)

The extractor reads its reference data from a Grid. Every Resonator writes record Seeds into the pattern's record Grid; that accumulation is what the state dimensions derive from and what learning reads. The refinement Helix spans the generate step. It reads the record Grid, evaluates progress against its criteria, and either iterates the generation or terminates. It is the only cycle in the pattern, as the grammar requires (G2).

The constitutional Lines, each morpheme's INSTANTIATES connection to its definition in the Constitutional Bloom, are present in any real graph and omitted here for brevity.

Seeds (•) are the data points. Resonators (Δ) are the transformations. Lines (→) are the flows. Grids (□) are the persistence, reference data read and records accumulated. The Helix (🌀) is the iteration. The Bloom (○) is the pattern's scope. ΦL is health, ΨH is coherence between components, and εR is how much the system explores alternatives versus exploiting what works. The structure tells you what the system does. The state dimensions tell you how it is doing.

---

**Forward references.** This draft is Part One. The following sections are referenced here and defined in Part Two: Adaptive Feedback, Constitutional Evolution, Degradation Cascade Mechanics, Formal Calculations, Immune Memory, Imperative Coupling Constraints, Imperative Gradient Signals, Perceptual Channel Mapping, Scale Escalation, Structural Signatures. Engineering Bridge references point to the companion document.
