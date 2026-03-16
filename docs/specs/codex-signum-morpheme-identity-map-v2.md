# Codex Signum — Morpheme Identity Map

**Version:** 2.0
**Date:** 2026-03-16
**Spec alignment:** v5.0 + v5.0b (Statistical Assessment Resonator)
**Domains:** Agentic Orchestration, Governance Mechanisms, Memory Architecture, Immune Pattern, Consulting (Initium/Colophon), Federation, Reusable Analytical Morphemes
**Purpose:** Authoritative reference for morpheme type assignment. Every domain concept in the implementation must be typed to one of the six morphemes. This document provides the mapping, the justification, and the common mistypings to avoid.
**Changes from v1.0:** 5 reclassifications, 22 new entries, 1 structural pattern identified ("constituent test").

---

## Why This Document Exists

When the immune memory system's Remedy Matching Resonator instantiates a compensatory morpheme at a friction site, it needs to know *what type* to create. When Claude Code creates a node in Neo4j, it needs to know which morpheme label to apply. When the Assayer evaluates a proposed structural change, it needs to verify that every element is correctly typed.

All three of these depend on the same question: **given a domain concept, which morpheme is it?**

The answer is not intuitive. An LLM looks like data (a Seed — it has a name, a provider, a cost). But its primary function is transformation (a Resonator — it takes input and produces output). Typing it as a Seed because it has properties is typing by surface features. Typing it as a Resonator because it transforms is typing by dimensional channel. The grammar requires the latter.

This document will eventually be replaced by a Cypher query against the Constitutional Bloom's morpheme definition Seeds. Until then, it is the structural enforcement at the prompt layer — the lookup table that prevents mistyping before it reaches the graph.

---

## The Dimensional Channel Test

v5.0 §The Six Morphemes defines each morpheme as a dimensional channel:

| Morpheme | Dimensional Channel | The Question |
|---|---|---|
| **Seed** (•) | Lifecycle stage | Is this thing primarily a datum — a point of origin, an instance, a coherent unit of data? |
| **Line** (→) | Connectivity | Is this thing primarily a connection — a flow, a transformation path, a relationship? |
| **Bloom** (○) | Scope | Is this thing primarily a boundary — defining what's inside, what's protected, where the interface is? |
| **Resonator** (Δ) | Transformation | Is this thing primarily a transformer — reading inputs, producing outputs, making decisions? |
| **Grid** (□) | Structure | Is this thing primarily a knowledge store — pure data (Seeds and Lines only), stable between external writes? |
| **Helix** (🌀) | Temporality | Is this thing primarily an iteration governor — reading from a Grid, evaluating progress, deciding whether to continue? |

**The test:** Ask "what is the primary dimension this concept encodes?" not "what properties does it have?" Everything has properties (name, status, timestamps). The dimensional channel is the function, not the attributes.

**When the answer isn't obvious:** If a concept seems to encode two dimensions equally, it's probably a composition. A "pipeline" encodes scope (boundary) AND transformation (stages). It's a Bloom containing Resonators. A "learning loop" encodes temporality (iteration) AND structure (observation history). It's a Helix reading from a Grid. The morphemes compose. The identity map assigns the *primary* morpheme to each concept, with notes on what it composes with.

### The Constituent Test (v2.0 addition)

v1.0 typed several objects by surface behaviour ("it transforms → Resonator") when their primary dimension was scope ("it contains the things that transform → Bloom"). The systematic error was: **any object with constituents (model Resonator, config Seeds, observation Grid, analytical Resonators) was typed as a bare Resonator when it should have been a Bloom containing those constituents.**

The constituent test: **does this object have things inside it that need containment?** If yes, it's a Bloom regardless of what it appears to "do" at the surface level. The pipeline → Bloom argument (a pipeline doesn't transform, it contains transformations) applies at every level of the containment hierarchy. A stage doesn't transform — the model Resonator inside it transforms. The Assayer doesn't evaluate — the evaluation Resonator inside it evaluates.

This test caught 5 reclassifications in v2.0: pipeline stages, Assayer, signal conditioning chain, immune memory system, and all Initium consulting stages.

---

## I. Agentic Orchestration Domain

### LLM Models — Resonator (Δ) ✓

**Current graph state:** Typed as `Agent` Seeds. **This is a mistyping.**

**Why Resonator:** An LLM's primary function is transformation. It reads a prompt (input Line), produces a completion (output Line). Its shape IS its function — many inputs (context, system prompt, user prompt) compressed into one output (completion). That's a compression Resonator. Its ΦL reflects "how well it transforms" — which is exactly what the Thompson router reads.

**Why not Seed:** A Seed encodes lifecycle stage — a datum, a point of origin. An LLM is not data. It's a transformer that takes data in and produces data out. Typing it as a Seed because it has properties (name, provider, cost, capabilities) is typing by surface features. Every morpheme has properties. The question is what dimensional channel it occupies.

**Observation Grid:** Each LLM Resonator has its own observation Grid accumulating execution Seeds — task classification, latency, quality score, success/failure, hallucination count. This Grid is where dimensional profiles come from (ΦL_code = 0.92, ΦL_reasoning = 0.41). The Thompson router reads these profiles through Lines.

**Migration note:** The current `Agent` label and `AgentProps` interface need renaming. The node type becomes `Resonator` with properties that include provider, model string, capabilities, cost. The Thompson router's `selectModel()` queries Resonators, not Seeds.

---

### Pipeline Stages — Bloom (○) ⚠️ RECLASSIFIED from Resonator (v1.0)

SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT (Architect pattern). SCOPE, EXECUTE, REVIEW, VALIDATE (DevAgent pattern).

**Why Bloom (not Resonator):** v1.0 typed stages as Resonators because "each stage reads input, transforms it, and produces output." This typed by surface behaviour. Applying the constituent test: a stage *contains* the things that transform. Consider DECOMPOSE:

- A **model Resonator** (dynamically bound by Thompson per execution)
- A **prompt template Seed** (the stage's instruction set)
- **Config Seeds** (parameters — max retries, temperature, output schema)
- An **observation Grid** (per-stage execution history across runs)
- Potentially analytical Resonators (Kano Classification, Statistical Assessment)

If a stage is typed as a bare Resonator, these constituents float as siblings in the pattern Bloom with no structural indication that *this* prompt template belongs to *this* stage. The topology is flat where it should be hierarchical. A Bloom provides containment scope, boundary-level Lines (satisfying BTM-G3b), per-stage ΦL from the containment topology, and dynamic model binding per execution.

**Containment hierarchy:**

```
Pattern Bloom (Architect)
  └─ CONTAINS → Stage Bloom (DECOMPOSE)
       ├─ CONTAINS → Model Resonator (dynamically bound per execution)
       ├─ CONTAINS → Prompt Template Seed
       ├─ CONTAINS → Config Seed(s)
       ├─ CONTAINS → Kano Classification Resonator (where applicable)
       ├─ CONTAINS → Statistical Assessment Resonator (where applicable)
       └─ CONTAINS → Observation Grid
```

**Shape derivation note:** v1.0 derived shapes (DECOMPOSE as distribution Resonator, CLASSIFY as relay). These shapes apply to the model Resonator *inside* the stage Bloom, not to the stage itself. The stage Bloom has no shape — it has a boundary.

**Common mistyping:** Stage as a Resonator (the v1.0 error). The stage doesn't transform. The model Resonator inside it transforms. The stage is the scope boundary within which that transformation is governed.

---

### Pipelines / Patterns — Bloom (○) ✓

The Architect pattern, the DevAgent pattern, the Thompson Router pattern.

**Why Bloom:** A pipeline is a scoped boundary containing its stages (stage Blooms), its data flows (Lines), its observation history (Grids), and its learning loops (Helixes). The Bloom defines what belongs to this pattern. Lines crossing the Bloom boundary are its interface with the outside.

**Common mistyping:** "Pipeline" as a custom label, or as a Resonator. A pipeline doesn't transform — it contains transformations.

---

### Pipeline Runs / Executions — Bloom (○) ✓

A single execution of the Architect or DevAgent pipeline.

**Why Bloom:** An execution is a scoped boundary for a specific run. It contains the input Seed, the output Seed, the intermediate transformation products, and the execution-specific ephemeral state (Stratum 1 memory). The execution Bloom is contained within the pattern Bloom — nested containment creating hierarchy through composition (G3).

**Current graph state:** Typed as `PipelineRun` nodes. Needs to become `Bloom {type: "execution"}` with CONTAINS relationships to the execution's Seeds.

---

### Tasks / Work Items — Seed (•) ✓

A task produced by DECOMPOSE. A work item in the backlog. A prompt to be executed.

**Why Seed:** A task is a coherent unit of data — it has content (what to do), a type (mechanical/generative), dependencies, and a lifecycle (planned → active → complete). Its primary dimension is lifecycle stage. It gets created, flows through the pipeline, and arrives at a terminal state.

**Common mistyping:** Task as a Resonator ("it does something"). The task doesn't transform. It IS the thing being transformed.

---

### Decisions / Routing Choices — Seed (•) ✓

A Thompson sampling decision: which model was selected, with what intent, at what confidence.

**Why Seed:** A decision is a datum — a recorded fact with provenance. It captures a point-in-time state. Its lifecycle: created → outcome recorded → feeds learning.

**Common mistyping:** Decision as a Resonator ("it decides"). The Thompson router Resonator *makes* the decision. The Decision Seed *records* it.

---

### Execution History / Observation Records — Grid (□) ✓

The accumulation of execution Seeds for a component.

**Why Grid:** A Grid contains Seeds and Lines, nothing else. It's pure data with no active computation inside it. The observation Grid's internal topology IS its retrieval structure — Seeds connected by temporal Lines forming a timeline. Resonators read from it; Helixes govern learning across it.

---

### Thompson Sampling Loop — Helix (🌀) ✓

The meta-process that updates model posteriors from execution outcomes.

**Why Helix:** Thompson sampling is iteration across executions. It reads from an observation Grid (execution history), evaluates whether the current model selection strategy is producing good outcomes, and updates beliefs (Beta posteriors). It operates at Scale 2 — Learning Helix temporal constant (hours to weeks).

**Convergence direction:** Tightening spiral when posteriors are converging. Loosening spiral when a new model enters or εR floor breach forces exploration.

---

### Configuration Parameters / Weights — Seed (•) ✓

ΦL weights (w₁–w₄), decay constants (λ), dampening factors (γ), threshold values, significance levels (α), minimum power thresholds (1-β), blocking variables.

**Why Seed:** A configuration parameter is a datum — it has content (the value), provenance (who set it, when), and lifecycle (current, superseded, reverted). Config Seeds live in the Constitutional Bloom or within stage Blooms, connected to the definitions they parameterise.

---

### Milestones / Roadmap Items — Bloom (○) ✓

**Why Bloom:** A milestone is a scoped boundary containing its deliverables (Seeds), its sub-milestones (nested Blooms), and its status derived from children.

---

### Data Flows Between Stages — Line (→) ✓

The connection from one stage Bloom's output to the next stage Bloom's input.

**Why Line:** Lines encode connectivity — flow, transformation path, direction. Direction (G2) encodes the relationship: forward (→) for processing flow, return (←) for feedback, parallel for observation.

**Conductivity:** Every data flow Line has conductivity evaluated at three layers (v5.0 §Line). The FSM's boundary assessments are fidelity measurements on these Lines.

---

### Prompt Templates / Task Templates — Seed (•) ✓

**Why Seed:** A template is a coherent unit of knowledge — it has content (the template structure), provenance (which successful executions it was distilled from), and ΦL (does using this template produce good outcomes?). Templates live in stage Blooms or in a Stratum 3 Grid (distilled knowledge).

---

### Error States / Failures — NOT a morpheme ✓

Error is not a thing. Error is a *region of ΦL/ΨH/εR space*. Record the execution outcome as an observation Seed in the Grid. The state dimensions carry the error signal. The Dimensional Collapse anti-pattern specifically calls out "an error morpheme when error is already a region of ΦL/ΨH/εR space."

---

### Retry Logic — Helix (🌀) ✓

**Why Helix:** This is a Refinement Helix (Scale 1). Tight, bounded iteration within a single execution. Maximum iteration count. Feedback through Return Lines (←). The Helix's convergence direction shows whether retries are improving (tightening) or flailing (loosening).

---

### CTQ Requirements — Seed (•) NEW

A Critical-to-Quality requirement derived from an intent or imperative. Measurable, with acceptance threshold and Kano classification.

**Why Seed:** A CTQ is a datum — it has content (the measurable requirement), properties (kanoClass, threshold, derivation), and lifecycle (proposed → validated → active → superseded). Tasks serve CTQs via `SERVES` Lines, making the importance topology queryable.

---

## II. Governance Mechanisms Domain

### Constitutional Bloom — Bloom (○) ✓

**Why Bloom:** The ultimate scoped boundary. Everything inside it is the system's identity. Every instance in the graph connects to it via INSTANTIATES. Its Merkle signature is the system's constitutional identity.

---

### Assayer — Bloom (○) ⚠️ RECLASSIFIED from Resonator

**v1.0 status:** Not explicitly in the identity map, but described as a Resonator throughout v5.0 and the concurrent pattern topology.

**Why Bloom (not Resonator):** Applying the constituent test. The Assayer comprises:

- An **evaluation Resonator** (the transformation: Seed in → finding out, axiom/grammar/anti-pattern checks)
- **Constitutional Bloom input Lines** (axiom definitions, grammar rules, anti-pattern catalogue)
- **Config Seeds** (which axioms to spot-check, evaluation depth, heuristic weights)
- Its own **observation Grid** (finding history, false positive/negative tracking)
- A **Statistical Assessment Resonator** instance (to quantify confidence in findings)

The Assayer doesn't just evaluate — it *governs* evaluation. The evaluation Resonator inside it transforms. The Assayer Bloom defines what belongs to the evaluation function, what its interface is (input Lines from stage Blooms carrying new Seeds, output Lines carrying Violation Seeds to ADAPT and scale escalation), and what observations accumulate within it.

**Containment:**

```
Pattern Bloom (Architect)
  └─ CONTAINS → Assayer Bloom
       ├─ CONTAINS → Evaluation Resonator (axiom/grammar/anti-pattern checks)
       ├─ CONTAINS → Statistical Assessment Resonator (finding confidence)
       ├─ CONTAINS → Config Seeds (evaluation parameters)
       └─ CONTAINS → Observation Grid (finding history, false positive tracking)
```

**Activation:** The Assayer Bloom's evaluation Resonator activates on topology change (new Seed appears within the pattern Bloom). This is a graph event, not polling.

**Common mistyping:** Assayer as a bare Resonator. Same error as stages — typing by surface behaviour ("it evaluates") rather than by dimensional channel ("it governs evaluation").

---

### Instantiation Resonator — Resonator (Δ) ✓

The sole entry point for morpheme creation. Contained within the Constitutional Bloom.

**Why Resonator (not Bloom):** The constituent test is negative. The Instantiation Resonator has a sibling observation Grid (within the Constitutional Bloom, not inside it — Resonators don't contain per v5.0 §Morpheme Interaction Rules). It reads config from the Constitutional Bloom through Lines. Its constituents are siblings, not children. It genuinely is a bare transformation: creation request in → morpheme instance + observation Seed out.

---

### Mutation Resonator — Resonator (Δ) ✓

The sole entry point for morpheme property updates. Contained within the Constitutional Bloom.

**Why Resonator:** Same argument as Instantiation Resonator. Bare transformation: update request in → updated morpheme + observation Seed out. No children requiring containment.

---

### Line Creation Resonator — Resonator (Δ) ✓

The sole entry point for Line creation. Contained within the Constitutional Bloom.

**Why Resonator:** Bare transformation: line request in → Line instance + observation Seed out. Enforces G2 direction, endpoint validity, initial conductivity computation.

---

### ΦL Computation — Resonator (Δ) ✓

Per the concurrent pattern topology: one ΦL Resonator per pipeline Resonator, contained within the pattern Bloom.

**Why Resonator:** Genuinely transforms observations → health value. Reads from an observation Seed (Line from the pipeline Resonator's execution output), reads ΦL Definition Seed from Constitutional Bloom, writes ΦL property on the pipeline Resonator. No constituents requiring containment.

---

### ΨH Computation — Resonator (Δ) ✓

Computes harmonic signature from structural coherence (λ₂) and runtime friction (TV_G).

**Why Resonator:** Transforms topology → coherence value. Reads adjacency matrix from the composition's subgraph, computes Laplacian eigenvalues and signal friction, writes ΨH property. No constituents requiring containment.

---

### εR Computation — Resonator (Δ) ✓ NEW

Computes exploration rate from state signals.

**Why Resonator:** Transforms state signals → exploration rate. Reads Thompson posterior distributions, ΦL trajectory, maturity index, writes εR property. No constituents.

---

### Calibration Process — Helix (🌀) ✓

Tunes thresholds, weights, and parameters across the governance system.

**Why Helix:** Iteration at months-to-quarters timescale. Reads from observation Grids (false positives, false negatives, threshold boundary oscillation events). Evaluates whether parameters need adjustment. Decides whether to adjust or hold stable. This is a temporal governor — it controls the pace and direction of parameter evolution.

---

### Constitutional Amendment — Helix (🌀) NEW

The evolutionary process for changing foundational rules (axioms, grammar, imperatives).

**Why Helix:** Iteration at the evolutionary timescale (Scale 3). Reads amendment proposals, evaluates against stability criteria (minimum duration between amendments, cooling periods, reversion protocol), decides whether to adopt. Rate-limited by design — the hoshin kanri catchball mechanism requires structured feedback before adoption.

**Not a Resonator:** An amendment is not a single-pass transformation. It's a deliberative process with multiple review iterations, feedback loops, and explicit convergence criteria (sufficient feedback gathered, cooling period elapsed, no conflicting amendments pending). The Helix governs this temporal process.

---

### Escalation Mechanism — Resonator (Δ) NEW

Reads state signals (ΦL trajectory, ΨH/ΦL divergence, εR floor breach, Refinement Futility) and determines whether scale escalation is warranted.

**Why Resonator:** Single-pass transformation. State signals in → escalation decision out. Produces an Escalation Event Seed connected to the evidence trail. Does not iterate — it assesses and decides once per trigger.

**Not a Helix:** Escalation doesn't govern iteration. It's a one-shot assessment triggered by trajectory signatures. The scales themselves have Helixes governing their iteration. The escalation mechanism is the Resonator that decides when to cross scale boundaries.

---

### Ecosystem Stress Resonator — Resonator (Δ) ✓ NEW

Reads rate-of-change signals from the graph (node creation rate, connection formation rate, mean ΦL velocity, ΨH distribution entropy, federation gossip volume) and computes a stress index.

**Why Resonator:** Transforms rate-of-change signals → stress index. Its output triggers bulkhead responses (federation isolation, acceptance rate limiting, cascade dampening override). No constituents.

---

## III. Signal Conditioning Domain

### Signal Conditioning Chain — Bloom (○) ⚠️ RECLASSIFIED from implicit collection of Resonators

The seven signal conditioning stages: Debounce, Hampel, EWMA, CUSUM, MACD, Hysteresis, Trend.

**Why Bloom:** The concurrent pattern topology already refers to a "Signal Conditioning Bloom" but the identity map v1.0 only listed individual signal conditioning Resonators without their containing scope. Applying the constituent test: the chain comprises seven Resonators, config Seeds (window sizes, thresholds, filter parameters), and an observation Grid (conditioning performance history). This is a scope boundary.

**Containment:**

```
Signal Conditioning Bloom
  ├─ CONTAINS → Debounce Resonator (Δ)
  ├─ CONTAINS → Hampel Resonator (Δ)
  ├─ CONTAINS → EWMA Resonator (Δ)
  ├─ CONTAINS → CUSUM Resonator (Δ)
  ├─ CONTAINS → MACD Resonator (Δ)
  ├─ CONTAINS → Hysteresis Resonator (Δ)
  ├─ CONTAINS → Trend Resonator (Δ)
  ├─ CONTAINS → Config Seeds (window sizes, thresholds, filter coefficients)
  └─ CONTAINS → Observation Grid
```

**Lines between individual conditioning Resonators** are internal to the Bloom — the observation stream flows through the chain via FLOWS_TO Lines. The Bloom boundary exposes two interface Lines: raw observations in, conditioned signal out.

---

### Individual Signal Conditioning Stages — Resonator (Δ) ✓

Debounce, Hampel, EWMA, CUSUM, MACD, Hysteresis, Trend.

**Why Resonator:** Each reads input, applies a specific transformation (smoothing, filtering, pattern detection), and produces conditioned output. No constituents. The stage is a bare transformation within the Signal Conditioning Bloom.

**Note:** These are *not* stage Blooms. Unlike pipeline stages (SURVEY, DECOMPOSE), signal conditioning stages don't contain model Resonators, prompt templates, or config — they ARE the transformations. The Signal Conditioning Bloom contains them. The distinction: pipeline stages govern transformations performed by LLMs. Signal conditioning stages ARE the transformations — deterministic, parameterised, no inner complexity requiring containment.

---

## IV. Memory Architecture Domain

### Memory Strata — Grid (□) ✓ NEW

Stratum 1 (Ephemeral), Stratum 2 (Observational), Stratum 3 (Distilled), Stratum 4 (Institutional).

**Why Grid (not Bloom):** Each stratum is a pure data store — Seeds connected by temporal Lines, similarity Lines, and provenance Lines. No active computation inside. Resonators (compaction, distillation) and Helixes (learning, calibration) read from and write to strata from outside.

v5.0 §Memory Topology explicitly grounds memory strata as Grids: "Morpheme home: A Grid (□)" for each stratum. The Grid's internal Line topology IS its retrieval structure.

| Stratum | Morpheme Home | Accessed By |
|---|---|---|
| 1. Ephemeral | Seeds within a Refinement Helix inside a Bloom | The executing pattern |
| 2. Observational | Grid (□) of execution records, component-local | Learning Helix (🌀) |
| 3. Distilled | Grid (□) at composition level | Learning Helix (🌀) at upper end of Scale 2 |
| 4. Institutional | Federated Grids (□) | Evolutionary Helix (🌀) at Scale 3 |

**Common mistyping:** Stratum as a Bloom ("it has things in it"). A Grid has things in it too — Seeds and Lines. The distinction: a Bloom has active computation (Resonators, Helixes) inside it. A Grid is pure data. Memory strata are pure data. The processes that operate on them (compaction, distillation) live outside in containing Blooms.

---

### Compaction — Resonator (Δ) ✓ NEW

Archives observation Seeds whose Line weight drops below threshold (0.01). The Seed remains in the Grid but its Lines to active computation Resonators are severed.

**Why Resonator:** Single-pass transformation. Reads the Grid, identifies candidates by Line weight, archives them. Triggered when the Grid exceeds its compaction threshold. No iteration — it runs once per trigger.

**Containment:** Contained within the pattern Bloom (or composition Bloom), not within the Grid itself (Grids contain Seeds and Lines only).

---

### Distillation — Resonator (Δ) ✓ NEW

Reads from a Stratum 2 Grid (observations) through Lines, compresses into insights, writes to a Stratum 3 Grid (lessons learned) through Lines.

**Why Resonator:** Transformation — many observations in, few distilled insights out. Compression Resonator. Its own ΦL reflects how well it distills: does the compressed insight preserve the information the raw observations carried?

**Not a Helix:** Distillation doesn't govern its own iteration. It transforms when triggered (enough new observations accumulated, periodic schedule). The Learning Helix at Scale 2 governs *when* distillation runs. The distillation Resonator performs the transformation itself.

---

### Recency Weighting — Line property ✓ NEW

**Not a morpheme at all.** Recency weighting is a property on Lines connecting observation Seeds to computation Resonators. The decay formula `e^(-λ × age)` is the Line's weight, decaying with the Seed's age. This is G4 — brightness encodes recency. Older Lines are dimmer, carrying less signal.

This is the correct Codex-native expression. No separate recency mechanism needed — the Line IS the recency signal.

---

## V. Immune Pattern Domain

### Immune Memory System — Bloom (○) ⚠️ RECLASSIFIED from implicit collection

v5.0 already describes this as a Bloom ("the immune memory Bloom"), but it was not in the identity map v1.0.

**Why Bloom:** Applying the constituent test, the immune memory system comprises:

- **Threat Archive Grid** (□) — Stratum 3. Coupling effect signature archetypes.
- **Remedy Archive Grid** (□) — Stratum 3. Successful compensatory pattern configurations.
- **Threat Matching Resonator** (Δ) — two-pass matching against Threat Archive.
- **Remedy Matching Resonator** (Δ) — friction profile matching against Remedy Archive.
- **Archive Helix** (🌀) — Learning Helix governing both Grids (recency, capacity, distillation, provenance).

**Containment:**

```
Immune Memory Bloom
  ├─ CONTAINS → Threat Archive Grid (□)
  ├─ CONTAINS → Remedy Archive Grid (□)
  ├─ CONTAINS → Threat Matching Resonator (Δ)
  ├─ CONTAINS → Remedy Matching Resonator (Δ)
  └─ CONTAINS → Archive Helix (🌀)
```

Two separate Resonators sharing the same containing Bloom — each with its own authority scope (A6), its own ΦL, its own observation history. The Bloom is the shared infrastructure. The Resonators are the separate functions.

---

### Threat Archive — Grid (□) ✓ NEW

**Why Grid:** Pure data. Contains archetype Seeds (each carrying a coupling effect signature), connected by similarity Lines (structural invariant matching) and temporal Lines (when the archetype was created). No active computation inside. The Threat Matching Resonator reads from it through Lines.

---

### Remedy Archive — Grid (□) ✓ NEW

**Why Grid:** Pure data. Contains compensatory pattern Seeds (each carrying a friction profile paired with the morpheme configuration that resolved it), connected by similarity Lines. The Remedy Matching Resonator reads from it. The Archive Helix governs its evolution.

---

### Threat Matching Resonator — Resonator (Δ) ✓ NEW

**Why Resonator:** Transforms incoming pattern coupling signatures → threat match/no-match findings. Two-pass matching: structural invariants first, surface variants second. Produces alert Seeds and acceleration Lines. No constituents.

---

### Remedy Matching Resonator — Resonator (Δ) ✓ NEW

**Why Resonator:** Transforms incoming friction profiles → remedy selection + compensatory morpheme instantiation. When a match is found, it calls the Instantiation Resonator to create the compensatory morpheme. When no match is found, it produces a capability gap Seed and escalation signal.

---

### Archive Helix — Helix (🌀) ✓ NEW

**Why Helix:** Temporal governor managing both Grids. Governs recency weighting (entries with no recent matches decay), capacity limits (low-confidence entries evicted first), distillation (redundant entries consolidated), and provenance constraints. Iterates on the Learning timescale (Scale 2).

---

### Compensatory Morpheme — Type determined by context ✓ NEW

A compensatory morpheme instantiated at a friction site. Its morpheme type depends on what the friction requires:

| Friction Type | Compensatory Morpheme | Rationale |
|---|---|---|
| Transformation Line (Resonator output is poor) | Resonator (Δ) | Preprocessing, postprocessing, or replacement transformer |
| Data Line (data quality is poor) | Seed (•) or Resonator (Δ) | Enriched data Seed, or filter/cleaner Resonator |
| Observation stream (learning not converging) | Grid (□) | Different observation structure or temporal resolution |

**Not its own type.** The compensatory morpheme is a standard morpheme instance (Seed, Resonator, Grid) created through the Instantiation Resonator. It follows all grammar rules. Its only special property is its provenance — created by the immune system in response to friction.

---

## VI. Consulting Domain

### Initium Pattern — Bloom (○) ✓

The diagnostic assessment pipeline: CONTEXT → INGEST → SURVEY → ANALYSE → SYNTHESISE with GATE.

**Why Bloom:** Scope boundary containing stages, data flows, observation history, and learning loops. Same typing as Architect pattern Bloom and DevAgent pattern Bloom.

---

### Initium Stages — Bloom (○) ⚠️ RECLASSIFIED from Resonator

CONTEXT, INGEST, SURVEY, ANALYSE, SYNTHESISE (Initium pattern).

**v1.0 / Initium design doc status:** The Bloom envelope explicitly lists stages as "resonators." This is the same mistyping as pipeline stages, caught by the same constituent test.

**Why Bloom:** Each Initium stage contains a model Resonator (LLM performing the analysis), config Seeds (sector calibration, framework weights, assessment depth), observation Grid (per-stage execution history across engagements), and potentially analytical Resonators (Kano Classification in ANALYSE, Statistical Assessment for diagnostic finding significance).

The argument is identical to pipeline stages. ANALYSE doesn't analyse — the model Resonator inside it analyses. ANALYSE is the scope boundary within which analysis is governed, with per-stage ΦL, dynamic model binding, and boundary-level Lines.

**Migration note:** The Initium Bloom envelope's `resonators` array needs reclassification. The stages become nested Blooms within the Initium pattern Bloom.

---

### Colophon Pattern — Bloom (○) ✓ NEW

The validation and follow-up pattern. Validates whether Initium prescriptions were accurate post-implementation.

**Why Bloom:** Scope boundary containing validation stages, comparison logic, feedback Lines to Initium's engagement history Grid. Contains its own observation Grid (validation history, prescription accuracy tracking).

---

### Engagement History — Grid (□) ✓ NEW

The Initium's persistent record of all engagements, findings, prescriptions, and validation outcomes.

**Why Grid:** Pure data. Contains engagement Seeds (each carrying diagnostic findings, prescriptions, outcomes), connected by temporal Lines (sequencing), sector Lines (cross-engagement sector clustering), and validation Lines (Colophon outcomes linked back to prescriptions). The Learning Helixes read from this Grid to improve diagnostic frameworks, sector knowledge, and accuracy calibration.

---

### Sector Knowledge — Grid (□) ✓ NEW

Accumulated sector-specific intelligence across engagements.

**Why Grid:** Pure data. Contains sector insight Seeds distilled from engagement history. Connected by sector Lines and temporal Lines. Read by the CONTEXT stage Bloom's model Resonator to calibrate lens weights for new engagements.

---

### Diagnostic Frameworks — Grid (□) ✓ NEW

The rubrics, axiom assessment templates, and anti-pattern library used by ANALYSE.

**Why Grid:** Pure data. Contains rubric Seeds, anti-pattern definition Seeds, scoring template Seeds. Connected by axiom dependency Lines (the DAG). Read by the ANALYSE stage Bloom's evaluation Resonator. Updated by the framework learning Helix.

---

## VII. Federation Domain

### Federation Protocol — Bloom (○) ✓ NEW

The scope boundary for cross-system interaction in a federated Codex ecosystem.

**Why Bloom:** Contains gossip mechanisms, trust evaluation Resonators, pattern acceptance logic, bulkhead response infrastructure. Defines what crosses system boundaries and what doesn't. Lines crossing this Bloom boundary are the federation's external interface.

**Not formally specified in detail yet.** The engineering bridge and v5.0 describe federation conceptually. When implementation occurs, the federation protocol's morpheme composition will follow this identity: a Bloom containing trust evaluation Resonators, acceptance Grids, and gossip Lines.

---

### Pattern Exchange — Composition (not a single morpheme) NEW

Pattern exchange is not one morpheme. It's a composition: the Federation Bloom contains exchange Resonators (transforming patterns into envelope format and back), exchange event Seeds (recording what was exchanged, when, with whom), and exchange Lines (connecting peer Federation Blooms).

---

## VIII. Reusable Analytical Morphemes

These are modular Resonators instantiable inside any stage Bloom or pattern Bloom that needs their analytical capability. They are not hardwired to a specific pattern.

### Kano Classification Resonator — Resonator (Δ) ✓ NEW

Classifies requirements or CTQs by quality contribution: must-be (absence = failure), one-dimensional (satisfaction scales with delivery), attractive (delighter).

**Why Resonator:** Transformation. Reads CTQ Seeds (input), applies Kano model (analytical judgment), produces classified CTQ Seeds with `kanoClass` property (output). Relay Resonator (one type in, same type out with enriched properties).

**Reusability:** Instantiable in DECOMPOSE stage Bloom, Initium ANALYSE stage Bloom, Assayer Bloom, or any context needing importance stratification.

**Common mistyping:** Kano as a Grid ("it stores classifications"). The Resonator *produces* classifications. The observation Grid *stores* the history.

---

### Statistical Assessment Resonator — Resonator (Δ) ✓ NEW

Produces uncertainty quantification: confidence intervals, hypothesis tests (Type I/II, power, P-values), ANOVA, Design of Experiments schedules, MSA/Gauge R&R.

**Why Resonator:** Transformation. Reads observation Seeds from a Grid, produces statistical finding Seeds (CI Seeds, hypothesis test Seeds, ANOVA Seeds, DOE design Seeds, MSA Seeds). Distribution Resonator (many observations in, multiple finding types out).

**Reusability:** Instantiable in any stage Bloom (per-stage assessment), Assayer Bloom (finding qualification), pattern Bloom (cross-stage ANOVA, DOE), or any context needing formal statistical rigour.

**Anti-pattern compliance:** Not a monitoring overlay (reads existing Grids, doesn't observe execution), not an intermediary layer (doesn't intercept ΦL computation or Thompson selection), not dimensional collapse (preserves full statistical dimensionality in output Seeds). See v5.0b supplement for full anti-pattern gauntlet.

**Common mistyping:** Statistical Assessment as a Grid ("it stores statistics"). The Resonator *computes* statistics. Its output Seeds may be stored in a Grid, but the Resonator is the transformation.

---

## IX. Quick Reference Table

### Confirmed (no change from v1.0)

| Domain Concept | Morpheme | Dimensional Channel | Common Mistyping |
|---|---|---|---|
| LLM / AI model | Resonator (Δ) | Transformation | Seed (has properties ≠ is data) |
| Pipeline / pattern | Bloom (○) | Scope | Custom "Pipeline" label, or Resonator |
| Pipeline execution | Bloom (○) | Scope | Custom "PipelineRun" label |
| Task / work item | Seed (•) | Lifecycle | Resonator ("it does something") |
| Decision record | Seed (•) | Lifecycle | Resonator ("it decides") |
| Observation history | Grid (□) | Structure | Bloom (has things in it ≠ is a boundary) |
| Thompson learning | Helix (🌀) | Temporality | Resonator ("it computes") |
| Config parameter | Seed (•) | Lifecycle | Custom "Config" label |
| Milestone | Bloom (○) | Scope | Seed (has properties ≠ is data) |
| Constitutional Bloom | Bloom (○) | Scope | — |
| Prompt template | Seed (•) | Lifecycle | Resonator or Grid |
| Data flow | Line (→) | Connectivity | — |
| Error state | NOT a morpheme | — | Seed ("Error") — use ΦL instead |
| Retry loop | Helix (🌀) | Temporality | Resonator or Line |

### Reclassified in v2.0

| Domain Concept | v1.0 | v2.0 | Reason |
|---|---|---|---|
| **Pipeline stage** | Resonator (Δ) | **Bloom (○)** | Constituent test: contains model Resonator, config, observation Grid |
| **Assayer** | Resonator (Δ) | **Bloom (○)** | Constituent test: contains evaluation Resonator, config, observation Grid, Statistical Assessment Resonator |
| **Signal conditioning chain** | 7 bare Resonators | **Bloom (○) containing 7 Resonators** | Constituent test: chain has shared config, shared observation Grid, boundary-level interface |
| **Initium stages** | Resonator (Δ) | **Bloom (○)** | Same argument as pipeline stages — each contains model Resonator, config, observation Grid |
| **Immune memory system** | Implicit collection | **Bloom (○)** | Constituent test: contains two Grids, two Resonators, one Helix |

### New in v2.0

| Domain Concept | Morpheme | Dimensional Channel | Common Mistyping |
|---|---|---|---|
| CTQ requirement | Seed (•) | Lifecycle | Resonator ("it specifies quality") |
| Kano classification | Resonator (Δ) | Transformation | Grid ("it stores classifications") |
| Statistical assessment | Resonator (Δ) | Transformation | Grid ("it stores statistics") |
| ΦL computation | Resonator (Δ) | Transformation | — |
| ΨH computation | Resonator (Δ) | Transformation | — |
| εR computation | Resonator (Δ) | Transformation | — |
| Calibration process | Helix (🌀) | Temporality | Resonator ("it adjusts") |
| Constitutional amendment | Helix (🌀) | Temporality | Resonator ("it decides") |
| Escalation mechanism | Resonator (Δ) | Transformation | Helix ("it's a process") |
| Ecosystem stress | Resonator (Δ) | Transformation | — |
| Signal conditioning (individual) | Resonator (Δ) | Transformation | Custom "Filter" label |
| Memory stratum | Grid (□) | Structure | Bloom ("it has things in it") |
| Compaction | Resonator (Δ) | Transformation | — |
| Distillation | Resonator (Δ) | Transformation | Helix ("it iterates") |
| Recency weighting | Line property | Connectivity | Separate mechanism |
| Threat archive | Grid (□) | Structure | — |
| Remedy archive | Grid (□) | Structure | — |
| Threat matching | Resonator (Δ) | Transformation | — |
| Remedy matching | Resonator (Δ) | Transformation | — |
| Archive helix | Helix (🌀) | Temporality | — |
| Compensatory morpheme | Type varies by context | — | Custom "Compensatory" label |
| Initium pattern | Bloom (○) | Scope | — |
| Colophon pattern | Bloom (○) | Scope | — |
| Engagement history | Grid (□) | Structure | — |
| Sector knowledge | Grid (□) | Structure | — |
| Diagnostic frameworks | Grid (□) | Structure | — |
| Federation protocol | Bloom (○) | Scope | — |
| Pattern exchange | Composition | — | Single morpheme |
| Instantiation Resonator | Resonator (Δ) | Transformation | — |
| Mutation Resonator | Resonator (Δ) | Transformation | — |
| Line Creation Resonator | Resonator (Δ) | Transformation | — |

---

## X. Migration Notes

### Current Graph Mistypings to Correct

| Current Label | Current Type | Correct Type | Migration |
|---|---|---|---|
| `Agent` | Seed-like (custom label) | Resonator (Δ) | Relabel nodes, update `AgentProps` → `ModelResonatorProps`, update `selectModel()` queries |
| `PipelineRun` | Custom label | Bloom (○) `{type: "execution"}` | Relabel nodes, add CONTAINS to execution Seeds |
| Pipeline stage Resonators | Resonator (Δ) | Bloom (○) `{type: "stage"}` | Relabel, add CONTAINS from stage Bloom to model Resonator, prompt template, config, observation Grid. Rewire inter-stage FLOWS_TO to connect at stage Bloom boundaries. |
| Assayer (if instantiated) | Resonator (Δ) | Bloom (○) `{type: "assayer"}` | Relabel, create contained evaluation Resonator, wire config Seeds and observation Grid inside |

### Correctly Typed (No Change Needed)

| Label | Current Type | Status |
|---|---|---|
| Milestone Blooms | Bloom (○) | ✓ Correct |
| Grammar reference Seeds | Seed (•) | ✓ Correct |
| Axiom Seeds | Seed (•) | ✓ Correct |
| Decision nodes | Seed (•) | ✓ Correct — if retyped from custom `Decision` label to `Seed {type: "decision"}` |
| Observation nodes | Seed (•) | ✓ Correct — if retyped from custom `Observation` label to `Seed {type: "observation"}` |

---

## XI. Structural Pattern: The Constituent Test

The systematic error in v1.0 was typing by surface behaviour rather than by dimensional channel. The correction principle:

**If it has constituents, it's a Bloom.** If the object contains a model Resonator, config Seeds, an observation Grid, or analytical Resonators — it's a scope boundary, regardless of what it appears to "do" at the surface level.

**If it doesn't have constituents, check the transformation test.** If it reads input, transforms, and produces output with no inner complexity requiring containment — it's a Resonator.

**If it stores data with no active computation inside — it's a Grid.** Grids contain Seeds and Lines only. If there's a Resonator "inside" what you thought was a Grid, either the Resonator is actually a sibling (contained by the same parent Bloom), or the object is actually a Bloom.

**If it governs iteration — it's a Helix.** The key distinction from Resonator: a Helix *evaluates whether to continue*, reading from a Grid and deciding convergence. A Resonator transforms once per activation. A Resonator that "runs periodically" is triggered externally. A Helix governs its own temporal process.

This hierarchy resolves every ambiguous case encountered in the v2.0 review.

---

## XII. Cascading Document Updates

The reclassifications in v2.0 affect:

1. **Concurrent Pattern Topology** — stage references as Resonators → stage Blooms. Signal conditioning chain → Signal Conditioning Bloom (already partially correct in this doc).
2. **Fidelity Stream Map v2** — boundary identifiers (Δ-A1 through Δ-A10) describe transformations at stage boundaries, which remains correct. Stage Blooms create the boundaries; model Resonators inside execute the transformations.
3. **BTM v1** — BTM-G3b (cross-boundary interaction via explicit Lines) is now structurally satisfied by stage Bloom boundaries.
4. **Lean Process Maps v2** — SIPOC process descriptions remain accurate (functional, not structural). Morpheme typing changes the structural representation.
5. **Engineering Bridge v3.0** — stage references read as "stage Bloom containing model Resonator."
6. **Initium Pattern Design** — Bloom envelope `resonators` array → nested stage Blooms. The Bloom envelope structure needs revision.
7. **v5.0 spec** — references to Assayer as Resonator throughout need updating. Signal conditioning "stages" in Engineering Bridge are correctly Resonators within a Signal Conditioning Bloom.
8. **Instantiation/Mutation Resonator Design** — no change needed. Governance Resonators are correctly typed as bare Resonators.

---

## XIII. Document Lifecycle

This document is consumed by Claude Code (DevAgent) during graph mutations, by the immune pattern's Remedy Matching Resonator during compensatory morpheme instantiation, and by the Assayer Bloom's evaluation Resonator during structural compliance assessment.

It will be superseded when the Constitutional Bloom contains machine-readable morpheme interaction rules queryable via Cypher. Until then, this is the structural enforcement at the prompt layer.

**Additions protocol:** When new domain concepts appear (new patterns, new consulting stages, new federation mechanisms, new reusable analytical Resonators), they are mapped here before they enter the graph. The mapping must pass the dimensional channel test AND the constituent test. If it doesn't pass cleanly, the concept is probably a composition — decompose it into its constituent morphemes.
