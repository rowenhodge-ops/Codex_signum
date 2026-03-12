# Concurrent Pattern Topology

## Codex-Native Execution Model for Architect, DevAgent, and Future Patterns

**Status:** Draft v3 — v5.0 reconciliation applied
**Grounded In:** Codex Signum v5.0
**Supersedes:** Sequential pipeline execution model in current pattern designs
**Scope:** All patterns that compose Resonators within a Bloom boundary

### Review History

| Version | Reviewer | Findings | Resolution |
|---|---|---|---|
| v1 | Google Pro (Thinking) | 3 issues, 3 gaps | v2 |
| v2 corrections applied: | | | |
| — Issue 1 (significant) | Compliance Corpus Grid duplicates Constitutional Bloom — Shadow Operation | Eliminated local Grid. Assayer reads directly from Constitutional Bloom through Lines. |
| — Issue 2 (minor) | Signal conditioning stages described as unnamed pipeline stages, not Resonators | Each stage explicitly named as a Resonator (Δ) with morpheme identity, referencing M-9.7b mapping. |
| — Issue 3 (minor) | Phantom v5.0 §Pulsation Frequency Safety reference | Corrected to Engineering Bridge §Part 5. |
| — Gap 1 | Superposition during execution not addressed | New section: §Superposition During Execution — instance creation, concurrent governance across instances, collapse interaction, persistence. |
| — Gap 2 | Refinement Helix iteration bound source unspecified | Specified: stored as property on Helix Definition Seed in Constitutional Bloom, readable through INSTANTIATES Line. |
| — Gap 3 | GATE/Assayer interaction latency unresolved | Clarified: GATE approves on available information. Subsequent Assayer findings degrade approved tasks via standard cascade mechanics. System tolerates evaluation latency rather than blocking. |
| v3 reconciliation applied: | | |
| — Rename | Correction → Refinement throughout | v5.0 terminology: Scale 1 is Refinement, not Correction |
| — A5 removal | A5 (Reversibility) row in axiom compliance table | A5 removed in v5.0 — derived from A4 + memory topology. 8 axioms. |
| — Line references | All `line NNN` references to v5.0 | Replaced with section references (§Name) for stability across spec edits |
| — Morpheme identity | LLM models and PipelineRuns | Cross-referenced with Morpheme Identity Map v1.0: LLMs are Resonators (Δ), pipeline executions are Blooms (○) |
| — Visual fix | G4 urgency/volume claim in ΨH coherence property | Updated to v5.0 G4: brightness = ΦL/conductivity, pulsation frequency = activity rate |
| — Line conductivity | Assayer evaluation scope | Line conductivity Layers 1–2 handle hygiene and grammar structurally; Assayer focuses on Layer 3 contextual fitness and anti-pattern detection |
| — Immune memory | Intervention alongside ADAPT | Remedy Archive as complementary structural repair path — friction triggers both ADAPT (re-survey) and immune memory (learned compensatory morpheme instantiation) |
| — Dimensional profiles | Thompson routing in DISPATCH | Model Resonator selection reads per-dimension ΦL from observation Grids, not just composite ΦL |

---

## The Problem This Solves

The current pattern designs describe the Architect as SURVEY→DECOMPOSE→CLASSIFY→SEQUENCE→GATE→DISPATCH→ADAPT and the DevAgent as SCOPE→EXECUTE→REVIEW→VALIDATE. These are drawn as sequential chains with governance applied at discrete checkpoints — the Assayer runs advisory-before and gate-after. ΦL, ΨH, and εR are computed in the `afterExecution()` hook chain, meaning the graph receives state only after the pipeline completes.

This design has three properties that violate the Codex:

**It violates A2 (Visible State).** Health, activity, and connection must be expressed in the structural properties of the encoding, never hidden. A pipeline that runs for minutes while its graph representation remains static is hiding state. The graph says "nothing is happening" while seven Resonators are transforming data. The pipeline's internal state is invisible until completion — the system is dark while it works.

**It creates a Monitoring Overlay (anti-pattern).** The `afterExecution()` hook chain is a separate entity that observes execution and writes derived results to the graph, rather than execution producing its own observations inline. Each Resonator should write its own output Seeds, its own ΦL, its own observation records as it executes. The hook chain exists because the execution path does not produce the observations that the graph needs — the structural fix is to enrich what the execution path writes, not to build a parallel observation system (v5.0 §Anti-Patterns: Monitoring Overlay).

**It makes the Assayer reactive rather than concurrent.** The Assayer is described in v5.0 as being invoked "at natural decision points" — during decomposition, during review, against historical changes (v5.0 §The Assayer). In the sequential model, the Assayer evaluates DECOMPOSE's output only after DECOMPOSE completes and before CLASSIFY starts. This means a grammar violation in DECOMPOSE's first task Seed must wait for all task Seeds to be generated before it is caught. The violation propagates through every subsequent Seed in the same batch. The Assayer should evaluate each Seed as it appears in the graph.

The concurrent model eliminates all three violations. When a pattern Bloom activates, everything inside it goes live. The only sequential constraint is data dependency — a Resonator cannot transform data that does not yet exist on its input Lines. Everything else runs concurrently.

---

## Grounding: Why v5.0 Already Requires This

This is not an extension of the protocol. It is the correct reading of mechanisms v5.0 already specifies, applied to pattern execution rather than ecosystem-level governance.

### Morpheme Grounding Demands It

v5.0 §Morpheme Grounding (§Morpheme Grounding) establishes that every mechanism in the specification has a morpheme identity. Every computation is a Resonator with input Lines, output Lines, observation Grids, and calibration Helixes. Every Resonator has its own ΦL. Every Line carries measurable properties. The worked ΦL composition example (§Worked Example: ΦL Computation) makes this explicit:

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
```

If the ΦL computation is a Resonator with its own ΦL, then SURVEY is a Resonator with its own ΦL, and DECOMPOSE is a Resonator with its own ΦL, and the Assayer is a Resonator with its own ΦL. Their ΦL values should update when they execute, not after the pipeline completes. The morpheme grounding principle states (§Morpheme Grounding): "If a mechanism cannot be mapped to a morpheme composition, the mechanism is underspecified. The mapping is the specification."

A pipeline orchestrator that sequences Resonator calls and batches their graph writes cannot be mapped to a morpheme composition. It is an intermediary layer — a mechanism interposed between execution and the graph that has no morpheme identity. The concurrent model eliminates the orchestrator as a separate entity. Each Resonator writes its own output. Data dependency determines execution order. The orchestrator dissolves into the topology.

### Scale 1 Refinement Requires It

v5.0 §Scale 1: Refinement  describes bounded refinement loops within a single execution: a Resonator produces output, a downstream Resonator evaluates it, feedback flows backward through a Return Line, and the producing Resonator regenerates. The refinement loop completes within the execution's Bloom boundary.

For the Assayer to act as a Scale 1 correction mechanism during pipeline execution, it must be concurrent with the Resonators it evaluates. If the Assayer runs only before or after the pipeline, it operates at Scale 2 (across executions) — evaluating historical output rather than correcting current output. The Assayer's temporal constant should be seconds, not hours. It should evaluate each Seed as it appears, not each pipeline run after it completes.

### Self-Referential Axiom Application Requires It

v5.0 §Self-Referential Axiom Application (§Self-Referential Axiom Application) applies every axiom to the system's own operations:

- **A2 (Visible State):** Every governance mechanism's health is visible through the same structural properties as everything else. A malfunctioning ΦL Resonator has dim ΦL.
- **A3 (Transparency):** Every governance computation is interpretable.
- **A4 (Provenance):** Every governance output carries the signature of its computation path.

If the Architect's SURVEY Resonator is executing but its ΦL in the graph has not updated, A2 is violated — SURVEY's health is hidden during execution. If DECOMPOSE produces task Seeds that are not yet in the graph, A4 is violated — those Seeds have no provenance chain until the batch write occurs. The concurrent model satisfies these axioms because each Resonator writes inline, making its state visible and its provenance immediate.

### Fractal Validity Requires It

v5.0 §Fractal Validity  states: "The grammar is fractal. Any valid expression at one scale remains valid at all scales." The ecosystem is a live topology — nodes and Lines appear, ΦL updates, ΨH recomputes, the Assayer evaluates. A pattern within the ecosystem should exhibit the same properties at its scale. A pattern Bloom that goes dark during execution and lights up only on completion is not fractal — it behaves differently from the ecosystem it is part of.

---

## The Concurrent Topology Model

### Activation

When a pattern Bloom receives input on its boundary interface Lines, the Bloom activates. Activation means:

1. Every Resonator within the Bloom transitions from Dormant to Active (its pulsation begins — v5.0 §Integration State Lifecycle).
2. Every Resonator whose input Lines carry data begins transformation immediately.
3. Every Resonator whose input Lines are empty remains Active but waiting — visible as a pulsing node with no throughput (bright but still, per G4 — light movement is data transfer).
4. All concurrent governance morphemes within the Bloom activate simultaneously (see §Concurrent Governance Topology below).

Activation is a structural event — a property change on the Bloom node (status: dormant → active) that triggers downstream recomputation. The Bloom's own ΦL begins updating from its constituents' ΦL values the moment those values change.

### Data Dependency DAG

The only genuinely sequential constraint is data dependency. A Resonator cannot transform data that does not exist on its input Lines. The data dependency DAGs for the two current patterns:

**Architect Pattern:**

```
Intent Seed (input)
  │
  ↓ (FLOWS_TO)
SURVEY Resonator ─── produces ──→ Context Seeds (file inventory, spec state, graph state)
  │
  ↓ (FLOWS_TO — Context Seeds land on DECOMPOSE's input Lines)
DECOMPOSE Resonator ─── produces ──→ Task Seeds, Dependency Lines, Phase Seeds
  │
  ↓ (FLOWS_TO — Task Seeds land on CLASSIFY's input Lines)
CLASSIFY Resonator ─── produces ──→ Classification properties on Task Seeds (complexity, type, route)
  │
  ↓ (FLOWS_TO — classified Tasks land on SEQUENCE's input Lines)
SEQUENCE Resonator ─── produces ──→ Ordering properties on Task Seeds, dependency-aware execution plan
  │
  ↓ (FLOWS_TO — sequenced Tasks land on GATE's input Lines)
GATE Resonator ─── produces ──→ Gate decision Seed (proceed / block / re-plan)
  │
  ↓ (FLOWS_TO — approved Tasks land on DISPATCH's input Lines)
DISPATCH Resonator ─── produces ──→ Execution Seeds (Thompson-sampled model Resonator selection via dimensional profiles, task assignment)
  │
  ↓ (FLOWS_TO — execution results land on ADAPT's input Lines)
ADAPT Resonator ─── produces ──→ Adaptation Seeds (learning updates, re-plan signals)
  │
  ↓ (Return Line — if re-plan triggered, flows back to SURVEY)
SURVEY Resonator (re-entry with narrowed scope)
```

**DevAgent Pattern:**

```
Task Seed (input from Architect DISPATCH)
  │
  ↓ (FLOWS_TO)
SCOPE Resonator ─── produces ──→ Scoped context Seeds (file contents, acceptance criteria, spec refs)
  │
  ↓ (FLOWS_TO)
EXECUTE Resonator ─── produces ──→ Output Seeds (code changes, file mutations, test results)
  │
  ↓ (FLOWS_TO)
REVIEW Resonator ─── produces ──→ Review Seeds (quality assessment, feedback for refinement)
  │
  ↓ (FLOWS_TO — if review passes) / Return Line to EXECUTE (if refinement needed)
VALIDATE Resonator ─── produces ──→ Validation Seeds (compliance check, final gate)
```

Each arrow is a FLOWS_TO Line (G2 — toward = forward flow). Each Resonator fires when its input Lines carry data. The sequential chain is a consequence of data dependency, not a prescribed execution model.

**Dimensional profiles in model selection:** When DISPATCH selects a model Resonator via Thompson sampling, the selection reads dimensional profiles from each model Resonator's observation Grid — not just composite ΦL. A model Resonator with ΦL_code = 0.92 and ΦL_reasoning = 0.41 is a strong choice for code generation tasks and a weak choice for reasoning tasks (v5.0 §Dimensional Profiles). The task classification produced by CLASSIFY feeds DISPATCH's context, which the Thompson router uses to read the relevant dimensional profile for each candidate model Resonator. The Line conductivity between the task Seed and each model Resonator's observation Grid determines which dimensional profiles are accessible — conductivity Layer 3 (contextual fitness) is where the task-model alignment is evaluated.

### Concurrent Governance Topology

These morphemes are live from the moment the pattern Bloom activates, concurrent with the data dependency chain:

#### The Assayer Refinement Helix

The Assayer operates as a Refinement Helix (🌀) within the pattern Bloom. It is not invoked at discrete checkpoints. It watches the topology continuously.

**Morpheme composition:**

```
🌀 Assayer Refinement Helix (spans the pattern Bloom's internal topology)
  │
  ├── Δ Assayer Resonator
  │     ← Line from: Constitutional Bloom → Axiom Seeds (A1–A4, A6–A9)           [direct, not copied]
  │     ← Line from: Constitutional Bloom → Grammar Rule Seeds (G1–G5)    [direct, not copied]
  │     ← Line from: Constitutional Bloom → Anti-Pattern Catalogue Seeds  [direct, not copied]
  │     ← Line from: every Seed produced by every Resonator in the pattern
  │             (these Lines form as Seeds appear — the Assayer's input grows as execution proceeds)
  │     → Line to: Violation Seed (produced when a grammar violation is detected)
  │     → Return Line to: the Resonator that produced the violating Seed
  │
  └── □ Violation Grid (observation records of violations detected during this execution)
        ├── • Violation Seed (carries: violating Seed ref, axiom/rule violated, evidence, timestamp)
        └── → Lines connecting Violation Seeds to the Seeds they flag (structural evidence trail)
```

**No local Compliance Corpus Grid.** The Assayer reads directly from the Constitutional Bloom through Lines — not from a local copy. v5.0 §Constitutional Coupling is explicit: "Instances read these through the INSTANTIATES Line rather than storing local copies. One source of truth." A local Grid that copies Seeds from the Constitutional Bloom is a Shadow Operation (v5.0 §Anti-Patterns: Shadow Operations) — state stored outside the canonical governance channel. If the Constitutional Bloom is amended through the constitutional evolution process, a local copy becomes stale. The Assayer's Lines to the Constitutional Bloom ensure it always evaluates against the current axioms, grammar rules, and anti-pattern catalogue.

The Assayer's many Lines to the Constitutional Bloom create strong constitutional gravity (v5.0 §Constitutional Coupling), pulling the Assayer spatially close to the constitutional core. This is not a performance optimisation — it is a structural consequence. The Assayer belongs near the constitution because it reads from the constitution. Position follows topology.

**Activation trigger:** The Assayer Resonator activates whenever a new Seed appears within the pattern Bloom's topology. This is a graph event — a node creation within the Bloom's containment boundary. The Assayer does not poll. It reacts to topology change.

**Evaluation scope per activation:** When a new Seed appears (e.g., a task Seed produced by DECOMPOSE), Line conductivity and the Assayer divide the evaluation workload structurally:

**Line conductivity handles Layers 1–2 before the Assayer sees the Seed.** Morpheme hygiene (Layer 1: required properties present, INSTANTIATES Line intact, Merkle signature valid) and grammatical shape (Layer 2: connection type valid for both endpoints per G2, G3, G4) are evaluated by the Line's own conductivity check when the Seed's output Lines attempt to close their circuits. A Seed with missing content or broken provenance darkens its Lines — it cannot participate in flows. This is structural enforcement, not analytical evaluation. The Assayer does not need to check baseline hygiene because non-compliant Seeds are already inert.

**The Assayer handles Layer 3 and anti-pattern detection concurrently.** With hygiene and grammar handled by conductivity, the Assayer focuses on:

1. **Contextual fitness (Layer 3)** — Does this Seed's dimensional profile align with the work being done? Is DECOMPOSE's task classification consistent with the actual complexity of the task?
2. **Anti-pattern detection** — Does this Seed participate in a Monitoring Overlay, Intermediary Layer, Dimensional Collapse, Prescribed Behaviour, or any catalogued anti-pattern? Detection uses the structural signatures defined in v5.0 §Anti-Patterns.
3. **Axiom spot-check** — Does the Seed satisfy A1 (Fidelity — representation matches actual state), A6 (Minimal Authority — the Resonator that produced it did not exceed its declared containment scope per G3)?

This division is not a design choice — it follows from Line conductivity being a structural property of the graph (v5.0 §Line Conductivity). The Assayer's workload is lighter because the Lines do the baseline enforcement.

**Intervention mechanism:** When a violation is detected:

1. The Assayer produces a Violation Seed in the Violation Grid, connected by Lines to the violating Seed and the violated axiom/rule Seed in the Constitutional Bloom.
2. A Return Line (←, G2 — result, feedback) carries the Violation Seed's content to the Resonator that produced the violating output.
3. The producing Resonator re-executes with the violation feedback in its input context.
4. The Refinement Helix bounds this to a maximum iteration count (stored as a property on the Helix Definition Seed in the Constitutional Bloom, readable through the INSTANTIATES Line; constitutional default: 2). If the violation persists after maximum iterations, the best available output proceeds forward with degraded ΦL on the output Seed — signaling downstream Resonators that their input is structurally suspect.
5. The degraded ΦL propagates through the pattern Bloom via the standard cascade mechanics (v5.0 §Degradation Cascade Mechanics) — CONTAINS Line dampening, 2-level depth limit, asymmetric recovery rate.

**What this catches that discrete checkpoints miss:** A DECOMPOSE Resonator producing 8 task Seeds. In the sequential model, the Assayer evaluates all 8 after DECOMPOSE completes. In the concurrent model, the Assayer evaluates task Seed 1 while DECOMPOSE is producing task Seed 2. If Seed 1 introduces a Monitoring Overlay (e.g., a task that creates a separate validation entity rather than enriching the execution path), the Refinement Helix fires before Seeds 2–8 are produced. DECOMPOSE re-executes with the feedback, and the anti-pattern does not propagate into the remaining Seeds.

**The Assayer's own ΦL:** The Assayer Resonator has its own ΦL, computed from its observation Grid. If the Assayer consistently fails to detect violations that are later discovered (false negatives, detectable through Scale 2 learning when the same violation class recurs), its ΦL dims. If the Assayer produces false positives (triggering corrections that do not improve output quality, detectable through feedback effectiveness — v5.0 §Scale 1: Refinement), its ΦL dims. A dim Assayer is a structural signal that the anti-pattern catalogue in the Constitutional Bloom needs updating or the detection heuristics need calibration. This feeds the Assayer's own Calibration Helix at Scale 2.

#### The ΨH Resonator (Intra-Pattern Coherence)

The ΨH Resonator operates at pattern scope, recomputing when the Bloom's internal topology changes.

**Morpheme composition:**

```
Δ ΨH Resonator (contained within the pattern Bloom)
  ← Line from: the pattern Bloom's subgraph (all nodes and Lines within containment)
  ← Line from: Constitutional Bloom → ΨH Definition Seed (structural/runtime weights)
  → Line to: the pattern Bloom's ΨH property
  → Line to: each internal FLOWS_TO Line's coherence property
```

**Activation trigger:** Any topology change within the pattern Bloom — a new Seed created, a new Line formed, a property change on an existing node. This occurs naturally as each Resonator in the data dependency chain produces output.

**What it computes per activation:**

1. **Structural coherence (λ₂)** of the pattern Bloom's subgraph. As the pipeline executes and new nodes and Lines appear, λ₂ changes — the graph is growing, and the growth may strengthen or weaken connectivity. This is not expensive to recompute incrementally (the subgraph within a single pattern Bloom is small — 7 Resonators, their connecting Lines, and the Seeds they produce).

2. **Runtime friction (TV_G)** on each FLOWS_TO Line. This is the measurement that detects information degradation at stage boundaries. For each FLOWS_TO Line connecting Resonator A's output to Resonator B's input:

```
TV_G(line_AB) = Σ aᵢⱼ × (xᵢ - xⱼ)²
```

Where x is a signal vector computed from the Seeds on either side of the Line. The signal includes semantic content similarity (how much of A's output meaning is preserved in B's interpretation), structural property continuity (do the Seeds on both sides of the boundary maintain consistent types, references, and constraints), and ΦL trajectory (is quality degrading across the boundary).

High TV_G on a specific FLOWS_TO Line means the Resonator on the receiving side is losing information that the producing side provided. This is precisely the "decomposition drift" failure mode — SURVEY produces rich context, DECOMPOSE loses critical constraints.

3. **Harmonic profile update.** The full eigenmode profile updates, which means the hue encoding of pattern components updates in real time (v5.0 §Perceptual Channel Mapping). Components that are resonating share similar colours. Components that are drifting out of alignment shift hue. The visual encoding changes as the pattern executes.

4. **Coherence property on FLOWS_TO Lines.** Each inter-Resonator Line receives a coherence value (0.0–1.0) derived from the TV_G computation. This property is visible to the ADAPT Resonator and to the rendering layer. A Line with low coherence is visually strained — dim, slow-pulsing (G4 — brightness = ΦL/conductivity; pulsation frequency = activity rate; low coherence means low effective signal).

**Intervention via ADAPT:** The ADAPT Resonator reads coherence values from all FLOWS_TO Lines. If any Line's coherence drops below the hysteresis-gated threshold (using the standard asymmetric thresholds from v5.0 §Degradation Cascade Mechanics — degradation at the threshold, recovery at threshold × 2.5), ADAPT activates its Return Line to SURVEY with a targeted re-survey scope. This is proportional response — ADAPT does not restart the entire pipeline. It identifies the degraded segment and re-surveys only the context that was lost.

**Intervention via Immune Memory (complementary path):** When a Line's dimensional friction exceeds its threshold, the friction profile also propagates to the immune memory Bloom (v5.0 §Immune Memory: Gap Response). The Remedy Matching Resonator checks the Remedy Archive for a compensatory morpheme that previously resolved a similar friction profile. If a match is found, the compensatory morpheme is instantiated within the containing Bloom — a structural repair that operates in parallel with ADAPT's re-survey path.

ADAPT and the immune system are complementary, not competing. ADAPT is proportional re-survey — it gathers better context. The immune system is structural repair — it inserts a learned fix at the friction site. Both operate through the same friction signal. A friction event may trigger both paths simultaneously: ADAPT re-surveys to understand the gap while the immune system patches it from experience. If the immune system's compensatory morpheme resolves the friction before ADAPT's re-survey completes, the system self-repaired without replanning.

The hysteresis gate prevents flapping. A single low-coherence measurement does not trigger intervention. The coherence must persist below the degradation threshold for the debounce interval (the Debounce Resonator in the signal conditioning chain — Engineering Bridge §Part 4). This prevents refinement loops from firing on transient noise.

#### Per-Resonator ΦL Computation

Each Resonator in the pattern has its own ΦL, updated on every execution.

**Morpheme composition per Resonator:**

```
Δ ΦL Resonator (one per pipeline Resonator, contained within the pattern Bloom)
  ← Line from: the pipeline Resonator's execution Observation Seed
  ← Line from: Constitutional Bloom → ΦL Definition Seed
  → Line to: the pipeline Resonator's ΦL property
```

**Activation trigger:** The pipeline Resonator completes an execution (whether initial or refinement-loop re-execution).

**What it computes:** The standard four-factor ΦL (v5.0 §ΦL Calculations):
- axiom_compliance — did this Resonator's output satisfy A1–A4, A6–A9? (The Assayer's evaluation feeds this directly.)
- provenance_clarity — does the output carry traceable origin?
- usage_success_rate — did the transformation succeed? (Immediate for this execution; rolling average across executions.)
- temporal_stability — is this Resonator's ΦL stable over recent executions?

The ΦL update is immediate. The moment SURVEY completes, SURVEY's node in the graph brightens or dims. This is A2 compliance: SURVEY's health is visible in real time.

**Propagation:** The pattern Bloom's ΦL is computed from its constituents' ΦL through the standard parent-from-children derivation (v5.0 §Degradation Cascade Mechanics). When SURVEY's ΦL updates, the Bloom's ΦL updates with dampening. When DECOMPOSE completes and its ΦL updates, the Bloom's ΦL recomputes again. The Bloom's health tracks execution progress — it is not a static summary computed after the fact.

#### Observation Grid (Stratum 1 → Stratum 2 Bridge)

Each execution produces observation Seeds that bridge Stratum 1 (ephemeral execution context) and Stratum 2 (persistent execution records).

**Morpheme composition:**

```
□ Execution Observation Grid (contained within the pattern Bloom)
  │
  ├── • Observation Seed (SURVEY execution: duration, model used, success/failure, output quality)
  ├── • Observation Seed (DECOMPOSE execution: task count, decomposition confidence, model used)
  ├── • Observation Seed (CLASSIFY execution: classification confidence per task)
  ├── • Observation Seed (Assayer evaluation: violations found, corrections applied, false positive rate)
  ├── • Observation Seed (ΨH update: coherence values per FLOWS_TO Line, λ₂ trajectory)
  │   ...
  └── → Lines connecting Observation Seeds temporally (G2 — forward = sequence)
```

**Write timing:** Each Observation Seed is written when the event it records occurs — not batched. SURVEY's Observation Seed is written when SURVEY completes. The Assayer's Observation Seed is written when an evaluation completes. These writes are part of the Resonator's execution, not a separate hook chain.

**Stratum transition:** On pattern Bloom completion, Stratum 1 working memory (intermediate results, retry state) is discarded. The Observation Seeds persist as Stratum 2 records — they are the raw material for Scale 2 learning across executions. The Observation Grid survives the execution and feeds the Learning Helix that governs the pattern across runs.

#### Escalation Detection Resonator

The Escalation Detection Resonator operates concurrently, matching observed state trajectories against the six trajectory signatures defined in the Constitutional Bloom (v5.0 §Scale Escalation).

**Morpheme composition:**

```
Δ Escalation Detection Resonator (contained within the pattern Bloom)
  ← Line from: ΦL trajectory (rolling values from per-Resonator ΦL updates)
  ← Line from: ΨH trajectory (rolling values from intra-pattern ΨH updates)
  ← Line from: εR trajectory (rolling values from Thompson sampling decisions)
  ← Line from: Constitutional Bloom → Escalation Trajectory Seeds (six signature definitions)
  → Line to: Escalation Event Seed (produced when a trajectory matches a signature)
```

**Activation trigger:** Any state dimension update within the pattern Bloom.

**What it detects during execution:**

At pipeline-run scale, most trajectory signatures require cross-execution data (they measure patterns across Learning Helix iterations). But two signatures are detectable within a single run:

- **Refinement Futility** — The Assayer Refinement Helix fires repeatedly on the same Resonator's output without convergence. ΦL oscillates (correction applied → ΦL rises → same violation recurs → ΦL falls). ΨH is stable (the parts structurally agree). εR is flat (the system is not exploring alternatives). This indicates the governing variable is wrong — the correction mechanism works but the problem is structural.

- **ΨH/ΦL Divergence** — At the pattern Bloom level, ΨH trends upward (the Resonators are increasingly coherent with each other) while ΦL trends flat or downward (the actual output quality is not improving). The pattern is becoming more internally aligned but less effective. This is the structural signature of Pathological Autopoiesis at pipeline scale (v5.0 §Anti-Patterns: Pathological Autopoiesis).

When detected, the Escalation Event Seed is produced and connected to the evidence trail (which Resonators, which state values, which trajectory). This feeds Scale 2→3 escalation per v5.0 §Scale Escalation: in a single-operator system, the issue surfaces to the human.

#### Signal Conditioning Resonators (Intra-Run Application)

The seven signal conditioning stages (Engineering Bridge §Part 4) are each a Resonator (Δ) within a Signal Conditioning Bloom, with Lines carrying the observation stream through the chain. Per v5.0 §Morpheme Grounding: every mechanism is a Resonator. The Engineering Bridge predates v5.0's morpheme grounding and describes these as "stages of a pipeline" — in the concurrent model they are morpheme instances: Debounce Resonator, Hampel Resonator, EWMA Resonator, CUSUM Resonator, MACD Resonator, Hysteresis Resonator, Trend Resonator. Each has its own ΦL, its own input/output Lines, and its own observation history. They are already typed as Resonators in the M-9.7b morpheme mapping (`resonator:signal:debounce` through `resonator:signal:trend`).

These conditioning Resonators apply to the observation stream produced during execution, not only to the cross-execution observation history.

Within a single pattern run, the conditioning Resonators that are meaningful are:

| Resonator | Intra-Run Application |
|---|---|
| Δ Debounce Resonator | Suppress duplicate Assayer evaluations of the same Seed (rapid topology changes can trigger multiple evaluations) |
| Δ Hampel Resonator | Not applicable intra-run (requires sufficient window size) |
| Δ EWMA Resonator | Applied to per-Resonator ΦL to prevent single-execution noise from dominating the Bloom's aggregate ΦL |
| Δ CUSUM Resonator | Detects mean shift in coherence values across FLOWS_TO Lines during execution — catches progressive degradation |
| Δ MACD Resonator | Rate-of-change detection on ΦL and coherence values — catches rapid degradation before thresholds are crossed |
| Δ Hysteresis Resonator | Prevents ADAPT intervention from flapping — coherence must sustain below degradation threshold before correction fires |
| Δ Trend Resonator | Projects where coherence and ΦL are heading — early warning if the pattern is on a trajectory toward degradation |

The Hampel and EWMA Resonators are primarily useful at Scale 2 (cross-execution) where the observation window is large enough. The Debounce, CUSUM, MACD, Hysteresis, and Trend Resonators are directly applicable intra-run when the pattern produces enough observations (the Architect's 7 pipeline Resonators produce at least 7 observation points per run, plus Assayer evaluations and ΨH updates — sufficient for CUSUM and MACD).

---

## What Changes From the Current Implementation

### The Orchestrator Dissolves

The current `hybridAgent.ts` orchestrator (~2400 lines) sequences stage calls, manages state between stages, and calls the `afterExecution()` hook chain on completion. In the concurrent model, this orchestrator is an Intermediary Layer (v5.0 §Anti-Patterns) — a mechanism interposed between execution and the graph that claims authority the graph write path does not need it to have.

The replacement is not a different orchestrator. It is the topology itself. Each Resonator:
- Reads from its input Lines (which carry data written by the previous Resonator)
- Executes its transformation (calling the LLM, processing data, whatever the substrate requires)
- Writes its output Seeds to the graph through its output Lines
- Writes its Observation Seed to the Execution Observation Grid
- The next Resonator in the data dependency chain activates because its input Lines now carry data

The "orchestrator" is the data dependency DAG. The sequential behaviour emerges from which Lines carry data, not from a control flow mechanism. This is G4 (Flow — Light Movement is Data Transfer): the Lines are the execution sequencing.

**Implementation consequence:** The event-driven execution model requires each Resonator to be a handler that fires on graph events (input Lines receive data). The substrate (TypeScript runtime) provides the event mechanism. The graph provides the coordination.

### Graph Writes Become Incremental

The current model: pipeline runs → all stages execute in memory → `afterExecution()` writes everything to Neo4j.

The concurrent model: each Resonator writes its output to Neo4j as it completes. The graph grows incrementally during execution. This means:

1. Each Resonator's output Seeds appear in the graph within seconds of production, not minutes.
2. The Assayer's evaluation of each Seed can be computed from the graph's current state — it reads what is there, not what a batch write will eventually provide.
3. ΨH recomputes on each topology change — the Laplacian updates as nodes and Lines appear.
4. The UI (M-13) renders a live, evolving topology — the pipeline IS the visualisation.

**Implementation consequence:** Graph writes must be atomic per-Resonator (each Resonator's output is a single transaction), not per-pipeline. This is consistent with the existing MERGE-based idempotent approach — each write is a self-contained MERGE that can be retried safely.

### The Assayer Becomes Always-On

The current model: Assayer runs advisory-before-DISPATCH and gate-after-completion.

The concurrent model: the Assayer Refinement Helix is live from Bloom activation. It evaluates every Seed as it appears. Its intervention mechanism (Return Lines to producing Resonators) enables inline refinement during execution, not post-hoc review.

**Implementation consequence:** The Assayer Resonator must be an event handler that fires on Seed creation events within the pattern Bloom's containment boundary. Its evaluation must be fast enough to not bottleneck the data dependency chain — if DECOMPOSE produces a Seed and the Assayer takes longer to evaluate it than DECOMPOSE takes to produce the next Seed, the Assayer must not block the pipeline. The Assayer operates concurrently, not as a synchronous gate on every Seed.

The Assayer may produce its Violation Seed after the violating Resonator has already moved on to its next output. This is acceptable — the Refinement Helix delivers feedback whenever it arrives, and the producing Resonator handles it at its next opportunity. The correction is eventual, not synchronous. This matches v5.0 §Scale 1 Refinement: bounded iteration, not blocking gates.

**GATE/Assayer latency semantics:** The GATE Resonator produces its proceed/block/re-plan decision based on the information available in the graph at the moment it evaluates. If the Assayer has not yet completed evaluation of all Seeds upstream of GATE, GATE approves based on what it can see — including any Violation Seeds the Assayer has already produced, and the current ΦL of all upstream Resonators (which reflects any corrections already applied). If the Assayer subsequently produces a Violation Seed for a Seed that GATE has already approved, the consequence is not rollback — it is ΦL degradation on the violating Seed, which propagates through the standard cascade mechanics (CONTAINS Line dampening, 2-level depth limit). DISPATCH receives tasks whose ΦL may subsequently dim. This is consistent with v5.0's general approach: signals are continuous, not gating. The system tolerates evaluation latency rather than blocking execution. A downstream Resonator receiving input with degraded ΦL has structurally visible information about the quality of its input — it can weight its confidence accordingly.

### ΨH Becomes Intra-Pipeline

The current model: ΨH is computed ecosystem-wide in the `afterExecution()` hook chain.

The concurrent model: ΨH is computed at pattern Bloom scope on every topology change. The ecosystem-wide ΨH computation still runs at Scale 2 — but now there is also a pipeline-scale ΨH that updates during execution.

**What this reveals that ecosystem ΨH cannot:** Two Resonators within the same pattern Bloom that are structurally connected but operationally mismatched. SURVEY and DECOMPOSE may have high ecosystem-level ΨH (they are part of a well-connected Architect pattern). But the runtime friction on the FLOWS_TO Line between them — computed from the actual Seed properties on either side of the boundary — may be high. The pattern-scope ΨH catches this. The ecosystem-scope ΨH does not, because it operates at a coarser granularity.

---

## Anti-Pattern Prevention

The concurrent model structurally prevents several anti-patterns that the sequential model permits.

### Monitoring Overlay Prevention

The `afterExecution()` hook chain is a Monitoring Overlay — a separate entity that observes execution and writes derived results. The concurrent model eliminates it. Each Resonator writes its own observations. The governance morphemes (Assayer, ΨH Resonator, ΦL Resonators) operate within the pattern Bloom, reading from the graph's own state, writing their outputs as Seeds in the graph. They are not external observers — they are constituents of the pattern.

The test from v5.0 §Anti-Patterns: Monitoring Overlay: "does this thing write to the graph?" The concurrent governance morphemes write Violation Seeds, Observation Seeds, ΨH updates, and ΦL updates. But these are outputs of governance operations that are part of the pattern's execution — not derived results written by an external observer. The governance morphemes have their own ΦL, their own observation histories, their own Lines. They are structural participants, not monitoring infrastructure.

### Intermediary Layer Prevention

The sequential orchestrator is an Intermediary Layer — interposed between execution and the graph, claiming authority the graph write path does not need. The concurrent model eliminates it by making each Resonator responsible for its own graph writes. No intermediary sits between a Resonator's output and the graph.

### Shadow Operations Prevention

In the sequential model, pipeline state between stages lives in memory — in TypeScript variables, not in the graph. This is Shadow Operations (v5.0 §Anti-Patterns: Shadow Operations): state stored outside governed channels. When SURVEY completes and its output is held in memory pending DECOMPOSE's invocation, that state is invisible to governance. The Assayer cannot evaluate it. ΨH cannot be computed from it. ΦL cannot reflect it.

In the concurrent model, SURVEY's output is in the graph the moment it is produced. There is no in-memory intermediate state that exists outside the governed topology.

### Defensive Filtering Prevention

v5.0 §Anti-Patterns: Defensive Filtering describes feedback loops that exist structurally but systematically exclude high-threat information. The detection mechanism is ΨH divergence between governance Lines and operational Lines — governance channels are calmer than the reality they represent.

The concurrent Assayer evaluates the same Seeds that the operational Resonators produce. There is no separate governance channel that could diverge from the operational channel. The Assayer reads the same graph state that DECOMPOSE writes to and that CLASSIFY reads from. If DECOMPOSE produces a structurally suspect Seed, the Assayer sees it — because the Assayer's input Lines connect to the same Seeds that the operational Lines connect to.

### Governance Theatre Prevention

v5.0 §Anti-Patterns: Governance Theatre describes governance structures that exist but do not influence actual decisions. Detection: governance-labelled nodes whose connection density and signal flow are significantly lower than their structural position implies.

In the concurrent model, the Assayer's connection density is high by construction — it has input Lines to every Seed produced within the Bloom. Its signal flow is high — it evaluates continuously. If the Assayer's evaluations do not influence execution (corrections are ignored, violations accumulate without response), this is detectable as declining Assayer ΦL (feedback effectiveness drops) and as growing Violation Grid with no corresponding correction events. The concurrent model does not prevent Governance Theatre entirely — a pattern could ignore Assayer feedback — but it makes the ignoring structurally visible.

---

## Application to Future Patterns

Any pattern that composes Resonators within a Bloom boundary should follow this model. The concurrent topology is not specific to Architect and DevAgent — it is the natural consequence of morpheme grounding applied to pattern execution.

### Assayer Pattern

The Assayer pattern's own internal structure (when operating in full pattern mode rather than as a Refinement Helix within another pattern) follows the same model. Its Resonators (parse proposal, evaluate per-axiom, evaluate per-rule, detect anti-patterns, produce compliance result) have data dependencies between them, but its internal governance (its own ΦL computation, its own coherence measurement) runs concurrently.

### Retrospective Pattern

The Retrospective pattern reads across multiple pattern Grids to detect systemic issues. In the concurrent model, it activates when its input Lines carry data (threshold events accumulate, εR goes rigid, feedback effectiveness drops — per v5.0 §Scale Escalation triggers). Its internal Resonators execute with their own concurrent governance topology.

### Research Pattern

The Research pattern (scope → discover → synthesise → validate) follows the same data dependency chain with concurrent governance. The Assayer evaluates research outputs against the grammar — does the synthesis introduce entities not grounded in the morpheme vocabulary? Does the validation step create a Monitoring Overlay rather than enriching the structural understanding?

### Initium Pattern (Consulting)

The Initium pattern for scoping engagements follows the same model. Its Resonators (discover organisational context, assess maturity, identify governance gaps, produce recommendations) execute concurrently with Assayer evaluation. The Assayer ensures recommendations are expressible in Codex grammar — recommendations that introduce Shadow Operations, Intermediary Layers, or Monitoring Overlays are caught and corrected inline.

---

## Superposition During Execution

v5.0 §Superposition  describes multiple simultaneous instances of the same composition — exploration routing dispatches the same task to multiple substrate models in parallel. The concurrent topology model applies to each superposed instance independently, and introduces specific mechanics for how the collapse Resonator interacts with concurrent governance.

### Instance Creation

When the Architect's DISPATCH Resonator creates superposed instances (e.g., sending the same task to multiple DevAgent instances on different model Resonators via Thompson sampling), each instance is a separate Bloom containing the DevAgent's morpheme topology. Each instance Bloom has:

- **Its own concurrent governance morphemes** — its own Assayer Refinement Helix (with direct Lines to the Constitutional Bloom), its own ΨH Resonator, its own per-Resonator ΦL computation, its own Observation Grid. These activate independently when the instance Bloom activates.
- **Its own ΦL, ΨH, εR** — computed independently from its own execution. One instance may be healthy while another degrades (v5.0 §Superposition).
- **Its own spatial position** — spatially distinct, visible as echoes of each other through shared composition signature and constitutional reference (v5.0 §Superposition).

The spawning event is recorded as a Seed in the Architect's Observation Grid, carrying the instance count, the triggering context (which task, which substrates), and the spawn timestamp (v5.0 §Superposition).

### Concurrent Governance Across Instances

Each instance's Assayer evaluates independently — a grammar violation in Instance A does not affect Instance B's execution. The corrections are local to each instance's Bloom boundary (G3 — containment scopes intentional effects).

However, the parent pattern's governance morphemes observe all instances. The Architect's ΨH Resonator sees the subgraph that includes all instance Blooms. If instances diverge significantly (one healthy, one degrading), the runtime friction between the instance Blooms' FLOWS_TO Lines to the collapse Resonator is high — visually, the connections between divergent instances and the collapse point are strained. This is the superposition equivalent of decomposition drift: the instances started from the same task but produced structurally different results.

### Collapse Interaction with Concurrent Governance

The collapse Resonator (Δ) receives Lines from each instance carrying their outputs (v5.0 §Superposition). In the concurrent model, the collapse Resonator activates as soon as any instance's output Lines carry data — it does not wait for all instances to complete (unless the collapse mechanism requires it, e.g., synthesis mode).

For selection collapse (Thompson sampling): the collapse Resonator selects the highest-quality output based on posterior beliefs. The selected output's ΦL (which has been computed inline by the instance's own concurrent governance) feeds directly into the selection decision. A dim instance — one whose Assayer found violations, whose ΨH showed friction — is structurally less likely to be selected. The concurrent governance within each instance directly influences the collapse decision without a separate quality assessment step.

For racing collapse (first-complete): the first instance to produce output triggers the collapse. Subsequent instance outputs persist as Stratum 2 observation records. If the first-completed instance had low ΦL (its concurrent governance detected issues), this ΦL propagates through the collapse Resonator to the parent pattern — the parent's ΦL dims because the selected output was structurally suspect. This is visible: the collapse Resonator's own ΦL reflects selection quality (v5.0 §Superposition).

### Persistence

After collapse, instances transition from Stratum 1 to Stratum 2 per v5.0 §Superposition. The instance Blooms' Observation Grids persist as execution records. The concurrent governance morphemes' outputs (Violation Seeds, ΨH trajectories, ΦL histories) persist alongside — they are Stratum 2 data that feeds Scale 2 learning about which substrates produce the best results for which task types, and which substrates tend to trigger more Assayer corrections.

---

## Rendering Implications (M-13)

The concurrent model produces a fundamentally different rendering experience from the sequential model.

### Sequential Model Rendering

The pattern Bloom appears static. It activates, goes dark (internal state is hidden during execution), and lights up on completion with final ΦL/ΨH/εR values. The observer sees a result, not a process.

### Concurrent Model Rendering

The pattern Bloom activates. The observer sees:

1. **SURVEY brightens** — its pulsation increases as it processes. Context Seeds appear as points of light within the Bloom. Lines form connecting SURVEY to its output Seeds.

2. **The Assayer pulses** — evaluating each Context Seed as it appears. If all pass, the Assayer maintains steady brightness. If a violation is detected, the Assayer and the violating Seed both flash (pulsation frequency increases to the critical alert range — 2–3 Hz per Engineering Bridge §Part 5: Pulsation Frequency Safety). A Return Line illuminates briefly as feedback flows back.

3. **DECOMPOSE activates** — reading from Context Seeds. Task Seeds appear. Lines form. The Bloom's internal topology grows visibly.

4. **ΨH shifts** — the harmonic profile updates. Components that resonate share colours. If friction appears on a FLOWS_TO Line, the Line dims and slows (G4 — brightness = ΦL/conductivity; pulsation frequency = activity rate). The visual encoding tells the observer where coherence is strong and where it is strained.

5. **ΦL propagates** — each completed Resonator's brightness updates. The Bloom's overall brightness shifts as constituents update. A healthy execution brightens the Bloom progressively. A degrading execution dims it.

6. **The pipeline completes** — the Bloom's final state reflects the full execution history. But unlike the sequential model, the observer saw the process. They watched coherence form, saw corrections apply, observed friction emerge and resolve. The graph did not go dark during execution. A2 was satisfied throughout.

This is what "the graph is the entire application" means: the execution itself is visible as topology change. No progress bar. No log stream. The evolving graph IS the progress indicator.

### Semantic Zoom During Execution

Per v5.0 §Semantic Zoom :

- **Far:** The pattern Bloom is a point of light. Its brightness pulses during execution (activity). Its colour shifts as the harmonic profile evolves.
- **Medium:** Individual Resonators visible within the Bloom. Seeds appearing. Lines forming. The Assayer's evaluations visible as brief interactions.
- **Near:** Individual Seed properties readable. Observation Grid contents visible. Coherence values on Lines readable.
- **Threshold/Engaged:** The observer can interact — query a specific Resonator's state, inspect a Violation Seed's evidence, ask the LLM interface "why did coherence drop between SURVEY and DECOMPOSE?"

---

## Relationship to Existing Specifications

### What This Document Is

A pattern-level design specification for how patterns execute within the grammar v5.0 already defines. Every mechanism described here is a morpheme composition grounded in v5.0's vocabulary. No new morphemes, state dimensions, axioms, grammar rules, or anti-patterns are introduced. No parameters are changed.

### What This Document Is Not

This is not a spec change. v5.0 already describes Resonators with ΦL, Lines with properties, Helixes as refinement loops, the Assayer as a concurrent evaluator, Scale 1 refinement within single executions, incremental observation writes, and fractal validity across scales. This document applies those descriptions to pattern execution — the one context where the current implementation has not yet adopted them.

This is not an Engineering Bridge addendum. The Engineering Bridge specifies computation parameters, signal conditioning stages, and safety invariants. This document specifies the execution topology — which morphemes are live, when they activate, how they interact. The Engineering Bridge will need a corresponding addendum specifying the event-driven execution mechanics at the implementation level (TypeScript event handlers, Neo4j write sequencing, concurrency management). That addendum depends on this document's topology being agreed.

### What Needs to Follow

1. **Morpheme Retyping:** LLM models are Resonators, not Seeds (see Morpheme Identity Map v1.0). Pipeline executions are Blooms, not custom `PipelineRun` labels. These mistypings must be corrected in the graph and in all pattern design documents before the concurrent model can wire INSTANTIATES Lines correctly.

2. **Engineering Bridge Addendum:** Implementation-level specification of the event-driven execution model — Neo4j write sequencing, event handler architecture, concurrency management, transaction boundaries per-Resonator.

3. **Architect Pattern Design Revision:** The existing Architect pattern design (sequential pipeline, pinned to v3.0) is superseded by this document's concurrent topology. The pattern design document should be updated to reflect the data dependency DAG, concurrent governance morphemes, intervention mechanics, and v5.0 terminology (8 axioms, Refinement not Correction, Line conductivity, Constitutional Bloom references).

4. **DevAgent Pattern Design Revision:** Same as above for the DevAgent pattern.

5. **M-13 UI Specification:** The rendering implications described in §Rendering Implications need to be incorporated into the M-13 UI specification as requirements — real-time topology updates, semantic zoom during execution, visual encoding of coherence and friction.

6. **Implementation Milestone:** The `afterExecution()` hook chain needs to be replaced with per-Resonator inline writes. The orchestrator (`hybridAgent.ts`) needs to be refactored from sequential control flow to event-driven data dependency resolution. This is substantial implementation work — likely its own milestone on the roadmap.

---

## Axiom Compliance Summary

| Axiom | Sequential Model | Concurrent Model |
|---|---|---|
| **A1 (Fidelity)** | Representation matches state only after completion | Representation matches state continuously during execution |
| **A2 (Visible State)** | Pipeline state hidden during execution | Pipeline state visible as topology change in real time |
| **A3 (Transparency)** | Governance evaluations opaque during execution | Assayer evaluations produce visible Violation Seeds inline |
| **A4 (Provenance)** | Output Seeds receive provenance on batch write | Output Seeds receive provenance immediately on production |
| **A6 (Minimal Authority)** | Orchestrator holds authority over all stages | Each Resonator holds authority only over its own output Lines (G3) |
| **A7 (Semantic Stability)** | No change | No change — same morphemes, same grammar |
| **A8 (Adaptive Pressure)** | Learning deferred to Scale 2 | Scale 1 refinement during execution; Scale 2 learning across executions |
| **A9 (Comprehension Primacy)** | Pattern execution is opaque — readable only from logs | Pattern execution is visible as evolving topology — comprehensible at a glance |

---

*The pattern is live. The graph is live. They are the same thing.*
