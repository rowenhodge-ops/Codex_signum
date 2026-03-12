# Codex Signum — Morpheme Identity Map

**Version:** 1.0
**Spec alignment:** v5.0
**Domain:** Agentic Orchestration (primary), Consulting (future)
**Purpose:** Authoritative reference for morpheme type assignment. Every domain concept in the implementation must be typed to one of the six morphemes. This document provides the mapping, the justification, and the common mistypings to avoid.

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

---

## Agentic Orchestration Domain

### LLM Models — Resonator (Δ)

**Current graph state:** Typed as `Agent` Seeds. **This is a mistyping.**

**Why Resonator:** An LLM's primary function is transformation. It reads a prompt (input Line), produces a completion (output Line). Its shape IS its function — many inputs (context, system prompt, user prompt) compressed into one output (completion). That's a compression Resonator. Its ΦL reflects "how well it transforms" — which is exactly what the Thompson router reads.

**Why not Seed:** A Seed encodes lifecycle stage — a datum, a point of origin. An LLM is not data. It's a transformer that takes data in and produces data out. Typing it as a Seed because it has properties (name, provider, cost, capabilities) is typing by surface features. Every morpheme has properties. The question is what dimensional channel it occupies.

**Observation Grid:** Each LLM Resonator has its own observation Grid accumulating execution Seeds — task classification, latency, quality score, success/failure, hallucination count. This Grid is where dimensional profiles come from (ΦL_code = 0.92, ΦL_reasoning = 0.41). The Thompson router reads these profiles through Lines.

**Migration note:** The current `Agent` label and `AgentProps` interface need renaming. The node type becomes `Resonator` with properties that include provider, model string, capabilities, cost. The Thompson router's `selectModel()` queries Resonators, not Seeds.

**Immune pattern implication:** When a friction Line signals that a model Resonator is weak on a task dimension, the Remedy Matching Resonator needs to instantiate a compensatory Resonator — not a compensatory Seed. This might be a prompt-conditioning Resonator (preprocessing input to compensate for the model's weakness), a validation Resonator (post-processing output to catch the model's known failure modes), or a routing override that selects a different model Resonator for that dimension.

---

### Pipeline Stages — Resonator (Δ)

SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT (Architect pattern). SCOPE, EXECUTE, REVIEW, VALIDATE (DevAgent pattern).

**Why Resonator:** Each stage reads input, transforms it, and produces output. SURVEY reads codebase + graph → produces source map. DECOMPOSE reads source map + intent → produces task graph. CLASSIFY reads task → produces classification. Each is a transformation with a specific shape.

**Shape derivation (v5.0):** DECOMPOSE has one input (intent + source map) and many outputs (task graph with multiple tasks) — a distribution Resonator. CLASSIFY has one input (task) and one output (classification) — a relay. The rendered shape is derived from the actual I/O topology.

**Common mistyping:** "Stage" or "Step" as a custom label. There is no Stage morpheme. If it transforms, it's a Resonator. If it's a boundary, it's a Bloom.

---

### Pipelines / Patterns — Bloom (○)

The Architect pattern, the DevAgent pattern, the Thompson Router pattern.

**Why Bloom:** A pipeline is a scoped boundary containing its stages (Resonators), its data flows (Lines), its observation history (Grids), and its learning loops (Helixes). The Bloom defines what belongs to this pattern. Lines crossing the Bloom boundary are its interface with the outside.

**Common mistyping:** "Pipeline" as a custom label, or worse, as a Resonator. A pipeline doesn't transform — it contains transformations. The individual stages transform. The pipeline is the scope within which those transformations are governed.

---

### Pipeline Runs / Executions — Bloom (○)

A single execution of the Architect or DevAgent pipeline.

**Why Bloom:** An execution is a scoped boundary for a specific run. It contains the input Seed, the output Seed, the intermediate transformation products, and the execution-specific ephemeral state (Stratum 1 memory). The execution Bloom is contained within the pattern Bloom — nested containment creating hierarchy through composition (G3).

**Current graph state:** Typed as `PipelineRun` nodes. This needs to become `Bloom {type: "execution"}` with CONTAINS relationships to the execution's Seeds.

---

### Tasks / Work Items — Seed (•)

A task produced by DECOMPOSE. A work item in the backlog. A prompt to be executed.

**Why Seed:** A task is a coherent unit of data — it has content (what to do), a type (mechanical/generative), dependencies, and a lifecycle (planned → active → complete). Its primary dimension is lifecycle stage. It gets created, flows through the pipeline, and arrives at a terminal state.

**Common mistyping:** Task as a Resonator ("it does something"). The task doesn't transform. It IS the thing being transformed. The DISPATCH Resonator takes the task Seed as input and produces executed output. The task Seed is the datum flowing through the circuit.

---

### Decisions / Routing Choices — Seed (•)

A Thompson sampling decision: which model was selected, with what intent, at what confidence.

**Why Seed:** A decision is a datum — a recorded fact with provenance. It captures a point-in-time state (which model was sampled, what the posteriors were, what the context was). It's a coherent unit in the observation stream. Its lifecycle: created → outcome recorded → feeds learning.

**Common mistyping:** Decision as a Resonator ("it decides"). The Thompson router Resonator *makes* the decision. The Decision Seed *records* it. The distinction: the Resonator is the transformer. The Seed is the output of that transformation, persisted for observation.

---

### Execution History / Observation Records — Grid (□)

The accumulation of execution Seeds for a component.

**Why Grid:** A Grid contains Seeds and Lines, nothing else. It's pure data with no active computation inside it. The observation Grid's internal topology IS its retrieval structure — Seeds connected by temporal Lines forming a timeline. Resonators read from it; Helixes govern learning across it.

**What goes inside:** Observation Seeds (execution success/failure, latency, quality score, task classification), connected by temporal Lines (sequencing), and similarity Lines (clustering by task type for dimensional profile computation).

---

### Thompson Sampling Loop — Helix (🌀)

The meta-process that updates model posteriors from execution outcomes.

**Why Helix:** Thompson sampling is iteration across executions. It reads from an observation Grid (execution history), evaluates whether the current model selection strategy is producing good outcomes, and updates beliefs (Beta posteriors). It operates at Scale 2 — Learning Helix temporal constant (hours to weeks), statistical accumulation across executions.

**Convergence direction:** Tightening spiral when posteriors are converging (the router is learning which models work). Loosening spiral when a new model enters the pool or an εR floor breach forces exploration.

---

### Configuration Parameters / Weights — Seed (•)

ΦL weights (w₁–w₄), decay constants (λ), dampening factors (γ), threshold values.

**Why Seed:** A configuration parameter is a datum — it has content (the value), provenance (who set it, when), and lifecycle (current, superseded, reverted). Configuration Seeds live in the Constitutional Bloom, connected to the definitions they parameterise. The Calibration meta-process (Helix at months-to-quarters timescale) governs their evolution.

---

### Milestones / Roadmap Items — Bloom (○)

R-29, R-31, M-9.5, etc.

**Why Bloom:** A milestone is a scoped boundary containing its deliverables (Seeds), its sub-milestones (nested Blooms), and its status derived from children. The milestone Bloom's ΦL is computed from its children's completion state — all complete → complete, some → active, none → planned. This is parent-from-children derivation, exactly how Bloom health works.

**Current graph state:** Already correctly typed as Blooms with CONTAINS relationships. This is one of the existing correct typings.

---

### Signal Conditioning Stages — Resonator (Δ)

EWMA smoothing, SPC rule evaluation, threshold detection.

**Why Resonator:** Each signal conditioning stage reads raw observation data (input), applies a transformation (smoothing, filtering, pattern detection), and produces a conditioned signal (output). v5.0 explicitly names signal conditioning stages as Resonators in the concurrent pattern topology review.

---

### Assayer Reference Data — NOT a separate entity

The Assayer reads axiom Seeds, grammar rule Seeds, and anti-pattern catalogue Seeds directly from the Constitutional Bloom through Lines. There is no separate Compliance Corpus Grid. A local Grid copying constitutional data would be a Shadow Operation (v5.0 §Anti-Patterns) — state stored outside the governed source.

The anti-pattern catalogue Seeds live *inside* the Constitutional Bloom. The Assayer's input Lines connect directly to them. One source of truth, no local copies.

---

### The Constitutional Bloom — Bloom (○)

The organisational core containing all morpheme definitions, axiom Seeds, grammar rule Seeds, imperative Seeds, state dimension definitions.

**Why Bloom:** It's the ultimate scoped boundary. Everything inside it is the system's identity. Every instance in the graph connects to it via INSTANTIATES. Its Merkle signature is the system's constitutional identity. v5.0 §Constitutional Coupling defines its full morpheme composition.

---

### Prompt Templates / Task Templates — Seed (•)

Distilled patterns for how to structure prompts for specific task types.

**Why Seed:** A template is a coherent unit of knowledge — it has content (the template structure), provenance (which successful executions it was distilled from), and ΦL (does using this template produce good outcomes?). Templates live in a Stratum 3 Grid (distilled knowledge) inside the pattern Bloom.

---

### Data Flows Between Stages — Line (→)

The connection from SURVEY output to DECOMPOSE input. The connection from a model Resonator to its consumer.

**Why Line:** Lines encode connectivity — flow, transformation path, direction. The data flowing from one Resonator to the next IS a Line. Direction (G2) encodes the relationship: forward (→) for processing flow, return (←) for feedback, parallel for observation.

**Conductivity:** Every data flow Line has conductivity evaluated at three layers (v5.0 §Line). If the producing Resonator has incomplete provenance, the Line goes dark. If the receiving Resonator can't accept that signal type, the Line goes dark. If the dimensional profiles don't align, the Line conducts with friction.

---

### Error States / Failures — NOT a morpheme

**Common mistyping:** Creating an "Error" Seed or "FailureState" node. Error is not a thing. Error is a *region of ΦL/ΨH/εR space*. A degraded Resonator has low ΦL. A mismatch between components has low ΨH. A system that's lost confidence has high εR. The Dimensional Collapse anti-pattern specifically calls out "an error morpheme when error is already a region of ΦL/ΨH/εR space."

**What to do instead:** Record the execution outcome as an observation Seed in the Grid (with success: false, errorMessage, errorType). The Resonator's ΦL drops. The Line's conductivity may change. The state dimensions carry the error signal. No error morpheme needed.

---

### Retry Logic — Helix (🌀)

The bounded retry within a single execution — EXECUTE fails, REVIEW produces feedback, EXECUTE runs again.

**Why Helix:** This is a Refinement Helix (Scale 1). Tight, bounded iteration within a single execution. Maximum iteration count. Feedback is structured through Return Lines (←) carrying specific diagnostic content. The Helix's convergence direction shows whether the retries are improving (tightening) or flailing (loosening).

**Common mistyping:** Retry as a Resonator or as a Line. The retry doesn't transform — it governs iteration. And it's not a connection — it's a temporal process that decides whether to iterate.

---

## Immune Pattern Implications

When the Remedy Matching Resonator instantiates a compensatory morpheme at a friction site, the morpheme type must be correct. The identity map feeds this decision directly:

**Friction on a transformation Line (Resonator output is poor):** Instantiate a compensatory Resonator. This might be a preprocessing Resonator (conditioning input before it reaches the weak transformer), a postprocessing Resonator (validating/correcting output), or a replacement Resonator (routing to a different transformer).

**Friction on a data Line (data quality is poor):** Instantiate a compensatory Seed with enriched content, or instantiate a compensatory Resonator that filters/cleans the data flowing through the Line.

**Friction on a containment boundary (scope violation):** This is a G3 issue, not a friction-site instantiation issue. The Assayer handles it.

**Friction on an observation stream (learning isn't converging):** Instantiate a compensatory Grid with different observation structure (different dimensional profiles, different temporal resolution), or adjust the Helix's iteration parameters.

The immune system can only instantiate from the Remedy Archive — learned patterns, not novel inventions. The Remedy Archive entries must be typed correctly for the instantiation to produce a valid morpheme. This document ensures the types are right at the point of entry.

---

## Quick Reference Table

| Domain Concept | Morpheme | Dimensional Channel | Common Mistyping |
|---|---|---|---|
| LLM / AI model | Resonator (Δ) | Transformation | Seed (has properties ≠ is data) |
| Pipeline stage | Resonator (Δ) | Transformation | Custom "Stage" label |
| Pipeline / pattern | Bloom (○) | Scope | Custom "Pipeline" label, or Resonator |
| Pipeline execution | Bloom (○) | Scope | Custom "PipelineRun" label |
| Task / work item | Seed (•) | Lifecycle | Resonator ("it does something") |
| Decision record | Seed (•) | Lifecycle | Resonator ("it decides") |
| Observation history | Grid (□) | Structure | Bloom (has things in it ≠ is a boundary) |
| Thompson learning | Helix (🌀) | Temporality | Resonator ("it computes") |
| Config parameter | Seed (•) | Lifecycle | Custom "Config" label |
| Milestone | Bloom (○) | Scope | Seed (has properties ≠ is data) |
| Signal conditioning | Resonator (Δ) | Transformation | Custom "Filter" label |
| Axiom/rule library | Lives in Constitutional Bloom | — | Separate Grid copy (Shadow Operation) |
| Constitutional Bloom | Bloom (○) | Scope | — |
| Prompt template | Seed (•) | Lifecycle | Resonator or Grid |
| Data flow | Line (→) | Connectivity | — |
| Error state | NOT a morpheme | — | Seed ("Error") — use ΦL instead |
| Retry loop | Helix (🌀) | Temporality | Resonator or Line |

---

## Migration Notes

### Current Graph Mistypings to Correct

| Current Label | Current Type | Correct Type | Migration |
|---|---|---|---|
| `Agent` | Seed-like (custom label) | Resonator (Δ) | Relabel nodes, update `AgentProps` → `ModelResonatorProps`, update `selectModel()` queries |
| `PipelineRun` | Custom label | Bloom (○) `{type: "execution"}` | Relabel nodes, add CONTAINS to execution Seeds |

### Correctly Typed (No Change Needed)

| Label | Current Type | Status |
|---|---|---|
| Milestone Blooms | Bloom (○) | ✓ Correct |
| Grammar reference Seeds | Seed (•) | ✓ Correct |
| Axiom Seeds | Seed (•) | ✓ Correct |
| Decision nodes | Seed (•) | ✓ Correct — if retyped from custom `Decision` label to `Seed {type: "decision"}` |
| Observation nodes | Seed (•) | ✓ Correct — if retyped from custom `Observation` label to `Seed {type: "observation"}` |

---

## Document Lifecycle

This document is consumed by Claude Code (DevAgent) during graph mutations and by the immune pattern's Remedy Matching Resonator during compensatory morpheme instantiation. It will be superseded when the Constitutional Bloom contains machine-readable morpheme interaction rules queryable via Cypher. Until then, this is the structural enforcement at the prompt layer.

Additions: When new domain concepts appear (consulting domain, federation, 3D visualisation), they are mapped here before they enter the graph. The mapping must pass the dimensional channel test. If it doesn't pass cleanly, the concept is probably a composition — decompose it into its constituent morphemes.