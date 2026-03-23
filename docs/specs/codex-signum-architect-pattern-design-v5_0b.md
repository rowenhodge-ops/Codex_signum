# Codex Signum Reference Pattern: Architect

## Planning, Decomposition & Orchestration — v5.0b

**Date:** 2026-03-18
**Status:** Pattern design specification — v5.0b methodology
**Supersedes:** `06_codex-signum-architect-pattern-design.md` (pre-v5.0)
**Conforms to:** v5.0 spec (`e1f6d88`), Engineering Bridge v3.0 (`5a6845f`), v5.0b Statistical Assessment methodology, Concurrent Pattern Topology v3 (`9c68eb1`), Morpheme Identity Map v2.0 (`dff5d9c`)

---

## §1. Pattern Identity

### What the Architect Is

The Architect is a **Bloom (○)** — a scoped composition of morphemes that governs the transformation of intent into executed, verified work.

The Architect contains 7 stage Blooms (SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT), concurrent governance morphemes (Assayer Bloom, Refinement Helix, ΨH Resonator, Escalation Mechanism Resonator), observation Grids, and learning Helixes. The stage Blooms are heterogeneous — some contain LLM-invoking model Resonators, others contain deterministic Resonators, one contains a human interface Resonator. DISPATCH contains the Thompson routing decision — where `selectModel()` runs for tasks being dispatched to DevAgent. The data dependency between stages creates a sequential execution chain, but this sequencing is a consequence of which FLOWS_TO Lines carry data, not a prescribed control flow.

### Why It Is a Bloom

**Constituent test (Identity Map v2.0):** Does the Architect have things inside it that need containment? Yes — 7 stage Blooms, each containing their own Resonators, Seeds, and Grids. An Assayer Bloom with its own internal composition. Governance Resonators that must operate within the Architect's scope boundary. Observation Grids that record execution history. Learning Helixes that span across executions. The Architect IS a container for governed transformations. That makes it a Bloom.

### Why It Is NOT a Resonator

A Resonator transforms a single input into a single output through a specific computational shape (compression, distribution, relay, bridge). The Architect does not transform — it **contains** transformations. SURVEY transforms intent + codebase state into context. DECOMPOSE transforms context into task graphs. Each of those is a Resonator's job (or more precisely, a model Resonator within a stage Bloom). The Architect's job is to provide the scope boundary within which those transformations are governed, their observations are recorded, and their learning accumulates.

If the Architect were typed as a Resonator, it would violate G3 (Containment) — Resonators don't contain. Only Blooms contain other morphemes (and Grids contain Seeds). A Resonator that houses 7 sub-Blooms, an Assayer Bloom, 3 Grids, and 2 Helixes is a Bloom wearing a Resonator label.

### Why It Is NOT a Grid

A Grid is a read-structured data store — it contains Seeds organised for retrieval, not for transformation. The Architect produces and transforms data; it doesn't just store it. The plan history Grid within the Architect is a Grid. The Architect itself is not.

### What the Architect Does

The Architect answers a question the Thompson Router and DevAgent cannot: **"What should be built next, in what order, and why?"**

The Router selects models. The DevAgent executes single tasks through a quality-assured pipeline. Neither can take "implement the stamp enforcement protocol" and produce the ordered sequence of sub-tasks, dependency declarations, phase boundaries, and decision gates that make the work tractable. DISPATCH bridges the gap — it contains the Thompson routing decision and hands Task Seeds to DevAgent (or to direct execution for deterministic tasks).

The Architect is the formalisation of the planning cognitive mode — synthesis, not analysis. It faces forward (what to build next), while the Retrospective pattern (not yet built) faces backward (what went wrong and why). These are separate patterns because coupling them would compromise both (see §9 Explicit Boundaries).

### What the Architect Produces

Every execution of the Architect Bloom produces:

- **Task Seeds** — atomic work units with descriptions, acceptance criteria, classification, and dependency declarations. Connected by DEPENDS_ON Lines. These become the DevAgent's input.
- **The dependency-aware task graph** — this IS the topology of Task Seeds and their DEPENDS_ON Lines. It doesn't need a separate Plan morpheme. The plan is the structure, not a description of the structure. The plan *record* (metadata: who triggered the execution, when, the intent string, the outcome) is a Seed in the execution observation Grid.
- **Observation Seeds** — per-stage execution records (what each stage produced, how long it took, what model was used, quality assessment). Written to each stage Bloom's observation Grid.
- **Adaptation Seeds** — records of replanning decisions when execution diverges from the plan.

These are graph entities, not in-memory data structures. Each stage Bloom writes its output Seeds to the graph inline (see §5 Data Dependency DAG, §6 Concurrent Governance Topology). The graph grows incrementally during execution — the pipeline IS the visualisation (CPT §Rendering Implications).

---

## §2. Anti-Pattern Test Table

The Architect design is tested against the six key structural anti-patterns from v5.0 §Structural Integrity. Each test must PASS for the design to be compliant.

### Test 1: Monitoring Overlay

**Question:** Does any component observe the Architect's execution from outside the Bloom boundary, writing derived state that the execution path itself should produce?

**PASS.** Each stage Bloom writes its own observation Seeds, its own ΦL contribution, and its own output Seeds inline as it executes. No `afterExecution()` hook chain aggregates results after the pipeline completes. The governance morphemes (Assayer Bloom, Refinement Helix, ΨH Resonator, Escalation Mechanism Resonator) live within the Architect Bloom — they are structural participants, not external observers. They read from the same Seeds that the operational stage Blooms produce, through Lines that connect them to those Seeds. They write their outputs (Violation Seeds, coherence updates, escalation events) as Seeds within the Bloom's observation Grids.

**Residual from current implementation:** The existing `afterExecution()` hook chain in `hybridAgent.ts` IS a monitoring overlay. The M-8.INT incremental migration (§12) replaces it with inline writes. Until that migration completes, the monitoring overlay persists — this is acknowledged, not designed.

### Test 2: Intermediary Layer

**Question:** Does any component sit between the stage Blooms and the graph, claiming authority the graph write path does not need?

**PASS.** Each stage Bloom's Resonator writes directly to the graph through the instantiation protocol (`instantiateMorpheme()`, `updateMorpheme()`, `createLine()`). No orchestrator sits between a Resonator's output and the graph. The data dependency DAG (§5) IS the execution sequencing — each stage fires when its input Lines carry data. The orchestrator dissolves into topology.

**Residual from current implementation:** `hybridAgent.ts` (~2400 lines) is an intermediary layer. It sequences stage calls, manages state between stages, and mediates all graph writes. M-8.INT replaces it with event-driven stage activation from FLOWS_TO Lines.

### Test 3: Shadow Operations

**Question:** Does any state exist outside the graph during the Architect's execution?

**PASS.** In the target design, every stage Bloom writes its output Seeds to the graph as it completes. SURVEY's context Seeds, DECOMPOSE's task Seeds, CLASSIFY's classification properties, SEQUENCE's ordering properties — all are graph entities. No persistent state exists outside the graph between stages. Ephemeral state within a single Resonator's execution (the LLM API call, the response buffer) is Stratum 1 — it exists only during the transformation and is discarded when the Resonator writes its output Seed to the graph.

**Residual from current implementation:** The current pipeline holds `SurveyOutput`, `TaskGraph`, and `ExecutionPlan` as TypeScript objects in memory between stage calls. These are shadow operations — persistent inter-stage state outside the governed topology. M-8.INT migrates them to graph Seeds with TypeScript interfaces serving as the read-side projection (see §7 Stage Descriptions).

### Test 4: Governance Theatre

**Question:** Do the Architect's governance structures actually influence execution, or do they exist without exercising authority?

**PASS.** The Assayer Bloom's evaluation Resonator evaluates each Seed as it appears in the graph. When a violation is detected, a Violation Seed is produced in the Violation Grid. The Refinement Helix reads the Violation Seed and fires a Return Line to the producing stage Bloom, carrying the correction. The stage must re-execute and produce a revised output. The Helix governs the iteration (evaluate → correct → re-evaluate, bounded by iteration count on the Helix Definition Seed). The ΨH Resonator's coherence measurement feeds ADAPT — if friction on a FLOWS_TO Line exceeds the hysteresis-gated threshold, ADAPT activates with a targeted re-survey scope. These are not advisory — they structurally influence execution flow.

**Detection signal if this degrades:** The Violation Grid grows (violations detected) but the correction event count stays flat (violations not addressed). The Refinement Helix's own ΦL dims (feedback effectiveness drops). The Assayer Bloom's ΦL dims (evaluation quality degrades). This divergence is the structural signature of Governance Theatre — detectable as a statistically significant ratio of violations-to-corrections (formalised through the Statistical Assessment Resonator when present).

### Test 5: Prescribed Behaviour

**Question:** Does the Architect dictate what other patterns do, rather than creating selective pressure through structural properties?

**PASS.** The Architect provides **specification** (what must be true), not **implementation** (how to make it true). Task Seeds carry `acceptance_criteria` that the DevAgent's VALIDATE stage checks against — this is legitimate scope specification, not prescribed execution. The Architect does not reach into the DevAgent's SCOPE, EXECUTE, REVIEW, or VALIDATE stages. It does not prescribe which model the DevAgent uses — the DevAgent's own Thompson routing selects models independently.

The structural pressure: poorly-specified Task Seeds produce low-quality DevAgent output, which degrades the Architect's own ΦL — creating selective pressure toward better task specification without prescribing how the DevAgent should work.

### Test 6: Dimensional Collapse

**Question:** Does any computation within the Architect merge ΦL, ΨH, and εR into a single scalar consumed by downstream decisions?

**PASS.** The three state dimensions are preserved independently throughout:

- **ΦL** — computed per stage Bloom from its observation history (4-factor composite via `assemblePatternHealthContext()`). Propagated upward to the Architect Bloom via `propagatePhiLUpward()` with topology-aware dampening.
- **ΨH** — computed at the Architect Bloom scope from the Laplacian of the stage Bloom subgraph. Measures friction on FLOWS_TO Lines between stages. Updated on every topology change within the Bloom.
- **εR** — aggregated from Thompson Decision history for stages that use model routing (SURVEY, DECOMPOSE, ADAPT). Stages without model routing (CLASSIFY, SEQUENCE, GATE) make deterministic decisions that are not Thompson selections — they contribute zero to both the numerator and denominator of the εR ratio. εR counts only Thompson-routed decisions, not all decisions.

No computation aggregates across dimensions. The Architect's "health" is not a single number — it is three independent signals that may diverge (e.g., high ΨH with declining ΦL = Pathological Autopoiesis at pipeline scale).

---

## §3. Per-Axiom Compliance

How the Architect pattern satisfies each axiom. Per v5.0b methodology, each axiom requires a specific structural explanation — not a generic "we comply."

### A1 — Fidelity

*If the health signal doesn't match the operational reality, the signal has a fidelity violation.*

The Architect's ΦL reflects its actual planning effectiveness. Plan success rate (plans completing without plan-level replanning) feeds `usage_success_rate`. Task estimation accuracy (estimated vs actual complexity) feeds `temporal_stability`. Decomposition completeness (tasks that reveal undeclared dependencies) feeds `axiom_compliance`. If the Architect consistently produces plans that fail, its ΦL dims — the structural representation matches the operational reality.

**Fidelity risk:** The Architect's ΦL could be artificially high if the human always fixes plans at the GATE stage. The plan "succeeds" but only because the human corrected it. Mitigation: track `adaptation_rate` (adaptations / total_tasks) separately from `plan_success_rate`. A plan with zero adaptations and high success is genuinely healthy. A plan with 4 human-gate modifications that subsequently succeeds has low Fidelity in its initial decomposition. The Statistical Assessment Resonator (when present) can compute a confidence interval on `adaptation_rate` — a rate whose CI includes zero is genuinely healthy; a rate significantly above zero has a measurable fidelity gap.

### A2 — Visible State

*Health, activity, and connection must be expressed in the structural properties of the encoding, never hidden.*

Each stage Bloom writes its output Seeds to the graph inline. There are no dark periods where the Architect is working but the graph doesn't reflect it. SURVEY's context Seeds appear as SURVEY completes. DECOMPOSE's task Seeds appear as DECOMPOSE completes. The graph grows incrementally — the pipeline's internal state is visible as topology change in real time (CPT §Rendering Implications).

**Current violation (acknowledged):** The existing implementation holds state in memory between stages. This is the M-8.INT migration target.

### A3 — Transparency

*Every governance computation is interpretable. Formulas are published. Thresholds are queryable. Detection heuristics are readable from the Graph.*

The Architect's governance morphemes (Assayer Bloom, Refinement Helix, ΨH Resonator, Escalation Mechanism Resonator) read their configuration from Seeds in the Constitutional Bloom through INSTANTIATES Lines. The Refinement Helix's iteration bound is stored as a property on its Helix Definition Seed — not hardcoded. The ΨH threshold for ADAPT activation is stored on the ADAPT stage Bloom's config Seed — not embedded in code. A practitioner can query the graph to understand why the Architect behaved as it did.

**Learnable thresholds:** The ΨH threshold on ADAPT's config Seed is not static. It is a learnable parameter subject to the Calibration Helix at Scale 2 — if the threshold triggers too many ADAPT activations that don't improve outcomes, calibration adjusts it downward; if too permissive, upward. Queryable (A3) does not mean fixed (that would violate A8).

### A4 — Provenance

*Every governance output carries the signature of its computation path.*

Each stage Bloom's output Seeds carry: which model Resonator produced them (or "deterministic" for CLASSIFY, SEQUENCE, and GATE), which input Seeds they consumed (via FLOWS_TO Lines from the producing stage), the commit SHA of the codebase at execution time (on the Execution Bloom). Each Observation Seed in the stage's observation Grid carries the metric, the raw value, the conditioned value, and the conditioning chain applied. Plan outcomes are traceable from intent → survey → decompose → classify → sequence → gate → dispatch → result, with every intermediate Seed in the graph.

### A6 — Minimal Authority

*A governance Resonator requests only the data its computation requires. Its input Lines define its authority scope.*

Each stage Bloom's Resonator reads only from its declared input Lines. DECOMPOSE reads from SURVEY's output Seeds (via FLOWS_TO) and from the task templates Grid (via a read Line). It does not read DISPATCH's observation Grid or ADAPT's config Seeds — those are outside its authority scope.

The Assayer Bloom reads from: (1) all stage Bloom output Seeds (it evaluates them for grammar compliance), and (2) the Constitutional Bloom's axiom Seeds, grammar rule Seeds, and anti-pattern catalogue (read-only Lines to constitutional definitions — the minimum authority needed for compliance evaluation). It does not read stage config Seeds — it evaluates outputs, not configuration.

The Refinement Helix reads from: (1) the Assayer Bloom's Violation Seeds (to decide whether to iterate), and (2) the producing stage Bloom's Return Line (to send corrections). Its authority scope is narrower than the Assayer's — it governs the iteration cycle, it doesn't evaluate raw output directly.

### A7 — Semantic Stability

*Governance mechanisms are expressed in the same six morphemes. No governance-specific vocabulary outside the grammar.*

The Architect's governance is expressed entirely in Codex morphemes: Assayer Bloom (○) containing its evaluation Resonator (Δ), observation Grid (□), and config Seeds (•). Refinement Helix (🌀) governing the correction iteration cycle. ΨH Resonator (Δ) computing composition coherence. Escalation Mechanism Resonator (Δ) matching state trajectories against constitutional signatures. Violation Grid (□) recording detected violations.

No custom "PlanValidator" or "QualityChecker" entities. No "PipelineOrchestrator" managing execution. The stage Blooms are Blooms. The data flows are Lines. The observations are Seeds in Grids. Everything is expressed in the grammar.

### A8 — Adaptive Pressure

*The governance machinery learns. Calibration tunes thresholds. Governance that cannot learn about its own effectiveness is accumulating brittleness.*

The Architect has learning mechanisms at two distinct temporal scales:

**Scale 1 (within execution) — Refinement Helix.** When the Assayer Bloom's evaluation Resonator detects a violation in a stage's output, the Refinement Helix fires a Return Line to the producing stage. The correction cycle (Assayer evaluates → Helix fires correction → stage re-executes → Assayer re-evaluates) operates within a single execution. The iteration bound is configurable and stored on the Helix Definition Seed in the Constitutional Bloom, readable through the INSTANTIATES Line.

**Scale 2 (across executions) — Decomposition Learning Helix and Template Learning Helix.** These read from the Plan History Grid (Stratum 2 observations accumulated across multiple execution Blooms). The Decomposition Learning Helix extracts patterns from successful decompositions — what task shapes work for which domains, what dependency structures lead to high first-pass rates. The Template Learning Helix refines task templates from accumulated evidence. Both operate on the timescale of weeks to months, not minutes. They are structurally distinct from the Refinement Helix — different temporal scale, different input source (Plan History Grid vs current execution), different output (distilled knowledge vs inline corrections).

The governance machinery is itself subject to adaptive pressure. The Refinement Helix's own ΦL reflects its feedback effectiveness — if corrections don't improve output quality, its ΦL dims. The Assayer Bloom's ΦL reflects its evaluation quality — if it misses violations that surface later, or flags false positives that waste correction cycles, its ΦL dims. The Learning Helixes' ΦL reflects whether their distilled knowledge actually improves decomposition quality over time.

### A9 — Comprehension Primacy

*The governance machinery is comprehensible. A practitioner can inspect configurations, understand computations, trace inputs, and predict outputs.*

The Architect's full composition — every stage Bloom, every Resonator, every Grid, every Helix, every Line — is queryable from Neo4j. Example queries (IDs illustrative — actual IDs per the graph's naming convention):

- **See all stages:** `MATCH (a:Bloom {id: $architectId})-[:CONTAINS]->(stage:Bloom) RETURN stage.id, stage.name`
- **See what's inside SURVEY:** `MATCH (stage:Bloom {id: $surveyId})-[:CONTAINS]->(child) RETURN child`
- **See all learning mechanisms:** `MATCH (a:Bloom {id: $architectId})-[:CONTAINS]->(h:Helix) RETURN h`
- **See observation counts per stage:** `MATCH (obs:Seed)-[:OBSERVED_IN]->(g:Grid)<-[:CONTAINS]-(stage:Bloom) WHERE stage.id STARTS WITH $architectPrefix RETURN stage.id, count(obs)`

The practitioner doesn't need to read code to understand the Architect's structure. The graph IS the documentation. The code implements what the graph describes.

---

## §4. Containment Topology

This section is the centrepiece of the pattern design. Every morpheme within the Architect Bloom is enumerated, typed, and placed. The hierarchy is the implementation contract — M-8.INT builds what this section describes.

### Design Principles Governing This Topology

**Heterogeneous stage internals.** The 7 stage Blooms do not share a uniform internal composition. SURVEY, DECOMPOSE, and ADAPT contain LLM-invoking model Resonators with Thompson Selection Resonators. CLASSIFY and SEQUENCE contain deterministic Resonators. GATE contains a human interface Resonator. DISPATCH contains a Thompson Selection Resonator and an Execution Resonator. Pretending they all have model Resonators would violate A1 (Fidelity) — the representation must match the operational reality.

**Observation Grids are siblings, not children of Resonators.** Resonators don't contain (v5.0 §Morpheme Interaction Rules). Each stage Bloom's observation Grid is a sibling of the stage's Resonator within the Bloom, connected to the Resonator via a FLOWS_TO Line. This is the same architecture as the governance Resonators in the Constitutional Bloom (see Instantiation/Mutation Resonator Design `bc95c654`). SURVEY, DECOMPOSE, and ADAPT use a single observation Grid because selection and invocation are 1:1 within a single stage execution — both Resonators write to the same Grid with distinct seedTypes. DISPATCH uses two separate Grids (Selection Grid + Execution Grid) because its selection fans out to multiple tasks and the two data streams serve different consumers: the Thompson Learning Helix reads selection data, plan-level ΦL reads execution outcomes.

**Scope comes from Lines, not placement.** The Assayer Bloom's evaluation scope is determined by its Lines to stage output Seeds, not by its containment level. One Assayer instance is currently instantiated within the Architect Bloom, with Lines to all stage Bloom outputs and read-only Lines to the Constitutional Bloom. If stage-level evaluation is needed later, additional Assayer instances are instantiated within stage Blooms through standard superposition (v5.0 §Superposition) — same pattern composition, narrower scope, independent state dimensions. The grammar permits this without design changes. The decision is operational (do we need it yet?), not architectural (can we do it?).

**Temporal scale determines Helix placement.** Scale 1 Helixes (operating within a single execution) and Scale 2 Helixes (operating across executions) both live in the Architect Bloom, but they are structurally distinct: different input sources, different output types, different temporal granularity. The Refinement Helix reads the current execution's Violation Seeds. The three Learning Helixes read from accumulated Stratum 2/3 Grids across many executions. Placing them at the same containment level does not conflate them — their Lines and temporal signatures distinguish them. In the M-13 visualisation, the temporal scale difference renders as Helix tightness: the Refinement Helix (minutes) as a tight spiral, Learning Helixes (weeks-months) as loose spirals — comprehension from structure, not inspection (A9).

**Learned state is not configuration.** Posteriors updated by Thompson learning, decomposition patterns distilled from plan history, and template refinements are learned state — updated automatically from evidence. Config Seeds hold operator-set parameters (scope limits, threshold values, dispatch rules). These are structurally separated: learned state lives in dedicated Grids, config lives in Seeds. The distinction matters because config is deliberate (changed by an operator decision), learning is emergent (changed by accumulated evidence).

**Relationship type semantics.** Three relationship types carry distinct structural meaning in this topology:
- **FLOWS_TO** — data produced at the source is consumed at the target. Used for inter-stage data flow, Resonator→Grid observation writes, and read access from shared Grids (e.g., Model Selection Grid → Thompson Selection Resonators). Direction is always source → consumer (G2 forward).
- **REFERENCES** — read-only access to constitutional reference content. Used exclusively for the Assayer Bloom's Lines to Constitutional Bloom axiom Seeds and anti-pattern catalogue. REFERENCES is a governed relationship type in the Instantiation Protocol (`VALID_LINE_TYPES` in `instantiation.ts`). Semantically distinct from FLOWS_TO: the Assayer reads reference material, it doesn't consume data produced by the Constitutional Bloom.
- **INSTANTIATES** — constitutional identity. Every morpheme INSTANTIATES its type definition Seed in the Constitutional Bloom ("I am an instance of a Bloom/Seed/Resonator/Grid/Helix"). Not used for operational data access.
- **CORRECTS** — provenance link from a revised Seed to the original it supersedes. `(revised)-[:CORRECTS]->(original)`. Backward-reference (G2 "away" = result/feedback), same structural class as Return Lines. New relationship type to be added to `VALID_LINE_TYPES`. See §6 for full specification and the correction cycle mechanics that produce these Lines.

### Full Hierarchy

```
○ Architect Bloom
│
├─── STAGE BLOOMS (7) ──────────────────────────────────────────
│
├── ○ SURVEY Bloom
│   ├── Δ Thompson Selection Resonator (model selection via posterior sampling)
│   │     reads from: Model Selection Grid (FLOWS_TO, cross-boundary read)
│   │     → FLOWS_TO → □ Observation Grid
│   ├── Δ Model Resonator (LLM invocation — codebase analysis)
│   │     → FLOWS_TO → □ Observation Grid
│   ├── • Prompt Template Seed (survey prompt structure)
│   ├── • Config Seeds (scope limits, spec references, timeout)
│   └── □ Observation Grid (survey execution records — selection + invocation)
│
├── ○ DECOMPOSE Bloom
│   ├── Δ Thompson Selection Resonator (model selection via posterior sampling)
│   │     reads from: Model Selection Grid (FLOWS_TO, cross-boundary read)
│   │     → FLOWS_TO → □ Observation Grid
│   ├── Δ Model Resonator (LLM invocation — task graph generation)
│   │     → FLOWS_TO → □ Observation Grid
│   ├── • Prompt Template Seed (decomposition prompt structure)
│   ├── • Config Seeds (max tasks per plan, dependency rules, CTQ templates)
│   └── □ Observation Grid (decomposition execution records — selection + invocation)
│
├── ○ CLASSIFY Bloom
│   ├── Δ Deterministic Resonator (rule-based classification — R-31)
│   │     Classifies both task type (mechanical vs generative) AND importance
│   │     class (kanoClass: must-be / one-dimensional / attractive) from CTQs
│   │     produced by DECOMPOSE. CLASSIFY is the classification stage for all
│   │     classification concerns — adding Kano classification to its rule set
│   │     is natural, not a separate Resonator.
│   │     → FLOWS_TO → □ Observation Grid
│   ├── • Config Seeds (classification rules (type + kanoClass), complexity heuristics)
│   └── □ Observation Grid (classification records — task type + kanoClass per task)
│
├── ○ SEQUENCE Bloom
│   ├── Δ Deterministic Resonator (topological sort + phase assignment)
│   │     → FLOWS_TO → □ Observation Grid
│   ├── • Config Seeds (phase boundary rules, ordering heuristics)
│   └── □ Observation Grid (sequencing records)
│
├── ○ GATE Bloom
│   ├── Δ Human Interface Resonator (plan presentation + decision capture)
│   │     → FLOWS_TO → □ Observation Grid
│   ├── • Config Seeds (gate criteria, auto-gate ΦL threshold for future evolution)
│   └── □ Observation Grid (gate decision records — approve/modify/abort + rationale)
│
├── ○ DISPATCH Bloom
│   ├── Δ Thompson Selection Resonator (model selection for DevAgent execution)
│   │     reads from: Model Selection Grid (FLOWS_TO, cross-boundary read)
│   │     → FLOWS_TO → □ Selection Grid
│   │     NOTE: DISPATCH selects a model for the DevAgent to use — the causal
│   │     chain between selection and outcome passes through the entire DevAgent
│   │     pipeline (SCOPE → EXECUTE → REVIEW → VALIDATE). The Thompson Learning
│   │     Helix operates on a noisier signal from DISPATCH than from SURVEY/
│   │     DECOMPOSE/ADAPT where selection and outcome are within the same stage.
│   │     CIs on posteriors from DISPATCH selections will be wider. See §10.
│   ├── Δ Execution Resonator (DevAgent invocation + direct execution for mechanical tasks)
│   │     → FLOWS_TO → □ Execution Grid
│   ├── • Config Seeds (dispatch rules, DevAgent interface contract, git workflow config)
│   ├── □ Selection Grid (model selected, posteriors at selection time, context cluster)
│   └── □ Execution Grid (task routed, DevAgent outcome, quality, latency)
│
├── ○ ADAPT Bloom
│   ├── Δ Thompson Selection Resonator (model selection via posterior sampling)
│   │     reads from: Model Selection Grid (FLOWS_TO, cross-boundary read)
│   │     → FLOWS_TO → □ Observation Grid
│   ├── Δ Model Resonator (LLM invocation — replanning decisions)
│   │     → FLOWS_TO → □ Observation Grid
│   ├── • Prompt Template Seed (adaptation prompt structure)
│   ├── • Config Seeds (max adaptations per plan, scope classification rules,
│   │     ΨH friction threshold for re-survey trigger)
│   └── □ Observation Grid (adaptation records — trigger, scope, outcome)
│
├─── GOVERNANCE MORPHEMES ──────────────────────────────────────
│
├── ○ Assayer Bloom
│   ├── Δ Evaluation Resonator (per-Seed grammar + axiom compliance check)
│   │     → FLOWS_TO → □ Violation Grid
│   │     → FLOWS_TO → □ Observation Grid
│   ├── (Δ Statistical Assessment Resonator — R-60, not yet instantiated.
│   │     Will compute: CI on adaptation_rate, ANOVA on stage quality variance,
│   │     hypothesis tests on violation-to-correction ratio. Placement confirmed
│   │     here for forward compatibility — do not implement as part of M-8.INT.)
│   ├── • Config Seeds (evaluation rules, severity thresholds)
│   ├── □ Violation Grid (detected violations with severity, axiom reference, source stage)
│   └── □ Observation Grid (evaluation execution records)
│   │
│   Lines IN:
│   │ ← FLOWS_TO ← each stage Bloom's output Seeds (evaluation scope)
│   │ ← REFERENCES ← Constitutional Bloom axiom Seeds (grammar reference — read-only)
│   │ ← REFERENCES ← Constitutional Bloom anti-pattern catalogue (detection rules — read-only)
│   Lines OUT:
│     → Violation Seeds read by Refinement Helix
│
│   NOTE on REFERENCES vs INSTANTIATES: The Assayer Bloom INSTANTIATES the Bloom
│   Definition Seed (constitutional identity — "I am an instance of a Bloom").
│   It REFERENCES axiom Seeds and anti-pattern catalogue Seeds (operational input —
│   "I read these to perform my evaluation function"). INSTANTIATES means "what type
│   am I?" REFERENCES means "what do I read?" These are structurally distinct
│   relationships with different semantics.
│
├── Δ ΨH Resonator (composition coherence — Laplacian of stage Bloom subgraph)
│   │ Recomputes on every topology change within the Architect Bloom.
│   │ Measures friction on FLOWS_TO Lines between stage Blooms.
│   │ Two write targets:
│   │   (1) ΨH value written to the Architect Bloom's properties (Mutation Resonator
│   │       operation via updateMorpheme — makes ΨH queryable as architect.psiH)
│   │   (2) ΨH observation Seed written to the Execution Observation Grid
│   │       (execution record for historical tracking)
│   └── → FLOWS_TO → □ Execution Observation Grid
│
├── Δ Escalation Mechanism Resonator (pattern-local scale-crossing decision)
│   │ Matches state trajectories against constitutional escalation signatures
│   │ defined in v5.0 §Scale Escalation (Stagnation, Refinement Futility,
│   │ Coherence Fracture, Phase Lock).
│   │ Produces Escalation Event Seeds when threshold met.
│   │ Distinct from the ecosystem-level Structural Review Resonator
│   │ (Bridge v3.0 Part 8), which operates at Scale 3.
│   └── → FLOWS_TO → □ Execution Observation Grid
│
├── 🌀 Refinement Helix (Scale 1 — within execution)
│   │ Governs the correction iteration cycle:
│   │   Assayer detects violation → Helix fires Return Line to producing stage
│   │   Bloom boundary → stage re-executes → Assayer re-evaluates →
│   │   Helix decides: iterate or pass through with degraded ΦL.
│   │ Return Lines terminate at the stage Bloom boundary (per BTM-G3b —
│   │ cross-boundary interaction requires Lines at Bloom boundaries, not
│   │ reaching into internals). The stage Bloom's internal wiring routes
│   │ the correction to its Resonator(s) for re-execution. See §6 for
│   │ full correction cycle mechanics.
│   │ Iteration bound stored on Helix Definition Seed in Constitutional Bloom
│   │ (readable through INSTANTIATES Line).
│   │ Has its own ΦL reflecting feedback effectiveness.
│   │
│   Lines IN:
│   │ ← reads Assayer Bloom's Violation Seeds
│   Lines OUT:
│     → Return Lines to producing stage Bloom boundaries (corrections)
│
├─── RUNTIME MORPHEMES (created during execution) ──────────────
│
├── ○ Execution Bloom (one per Architect run — created at runtime)
│   │ Contained by the Architect Bloom. Each execution creates one Execution
│   │ Bloom containing: the input Intent Seed, output Task Seeds with
│   │ DEPENDS_ON Lines between them, intermediate stage output Seeds, and
│   │ ephemeral state (Stratum 1 — discarded after execution).
│   │ The 30-50 ephemeral morphemes per execution live inside these Blooms.
│   │ Observation Seeds flow from here to stage observation Grids.
│   │ Not shown in the template hierarchy because they are runtime instances,
│   │ but they are structurally real — queryable, governed, subject to ΦL.
│
├─── OBSERVATION + DATA GRIDS ──────────────────────────────────
│
├── □ Execution Observation Grid (plan-level records)
│   │ Contains: plan outcome Seeds, execution timing Seeds, ΨH history Seeds,
│   │ escalation event Seeds. One Grid per Architect Bloom — not per execution.
│   │ Execution Blooms (individual runs) produce observation Seeds that flow here.
│
├── □ Plan History Grid (Stratum 2 — accumulated across executions)
│   │ Contains: plan outcome Seeds from all past executions. Purely Stratum 2 —
│   │ raw execution records and observations, not distilled knowledge.
│   │ Read by: Decomposition Learning Helix, Template Learning Helix (as input).
│   │ Fed by: compaction from Execution Observation Grid (Stratum 1 → Stratum 2).
│
├── □ Task Templates Grid (Stratum 3 — distilled knowledge)
│   │ Contains: recurring task shapes (from Decomposition Learning Helix),
│   │ domain-specific prompt structure refinements (from Template Learning Helix).
│   │ Distinct seedTypes distinguish decomposition patterns from prompt templates.
│   │ Read by: DECOMPOSE stage Bloom (via FLOWS_TO Line).
│
├── □ Model Selection Grid (Stratum 3 — learned posteriors)
│   │ Contains: Thompson posterior Seeds per context cluster (model × task type).
│   │ Written by: Thompson Learning Helix (posterior updates from accumulated evidence).
│   │ Read by: Thompson Selection Resonators in SURVEY, DECOMPOSE, DISPATCH, ADAPT
│   │ (via FLOWS_TO Lines — each reads the posteriors relevant to its context cluster).
│   │
│   │ Posteriors are learned state, not configuration. They live in a dedicated
│   │ Grid at the Architect Bloom level because they accumulate across all executions
│   │ and are consumed by multiple stage Blooms. Placing them in a shared Grid avoids
│   │ cross-boundary writes and reflects their pattern-level scope.
│
├─── LEARNING HELIXES (Scale 2 — across executions) ────────────
│
├── 🌀 Decomposition Learning Helix
│   │ Reads from: Plan History Grid (Stratum 2 — task shapes, dependency structures, outcomes).
│   │ Produces: decomposition pattern Seeds (what task shapes work for which domains,
│   │ what dependency structures lead to high first-pass rates).
│   │ Writes to: Task Templates Grid (Stratum 3 — distilled patterns).
│   │ Temporal scale: weeks to months. Fires when sufficient new plan data accumulates.
│   │ Has its own ΦL reflecting whether distilled patterns improve decomposition quality.
│
├── 🌀 Template Learning Helix
│   │ Reads from: Plan History Grid (Stratum 2 — execution outcomes, prompt effectiveness).
│   │ Produces: refined prompt template Seeds, task template updates.
│   │ Writes to: Task Templates Grid (Stratum 3 — refined templates).
│   │ Temporal scale: weeks to months. Fires when template effectiveness data accumulates.
│   │ Has its own ΦL reflecting whether template refinements improve execution quality.
│
└── 🌀 Thompson Learning Helix
    │ Reads from: stage observation Grids + DISPATCH Selection Grid
    │ (model selection outcomes, quality feedback across all Thompson-routed stages).
    │ Produces: updated posterior Seeds for model selection per context cluster.
    │ Writes to: Model Selection Grid (Stratum 3 — updated posteriors).
    │ Temporal scale: Scale 2 — fires after each execution outcome but the learning
    │ accumulates across executions. The temporal constant is the posterior convergence
    │ rate, not the execution frequency.
    │ Has its own ΦL reflecting whether posterior updates improve model selection.
    │
    │ NOTE: The Thompson Selection Resonators (inside SURVEY, DECOMPOSE, DISPATCH,
    │ ADAPT) sample from posteriors during a single execution by reading from the
    │ Model Selection Grid via FLOWS_TO Lines. The Thompson Learning Helix updates
    │ those posteriors across executions by writing to the same Grid. Selection is
    │ Scale 1 (read). Learning is Scale 2 (write). They are separate morphemes at
    │ different containment levels connected through the Model Selection Grid.
```

### Stage Bloom Internal Composition — Detail

| Stage Bloom | Resonators | Prompt Template | Thompson Selection | Config Seed Examples |
|---|---|---|---|---|
| SURVEY | Thompson Selection + Model (LLM) | Yes | Yes | scope limits, spec refs, timeout |
| DECOMPOSE | Thompson Selection + Model (LLM) | Yes | Yes | max tasks, dependency rules, CTQ templates |
| CLASSIFY | Deterministic (R-31) | No | No | classification rules (type + kanoClass), complexity heuristics |
| SEQUENCE | Deterministic (topological sort) | No | No | phase boundary rules, ordering heuristics |
| GATE | Human Interface | No | No | gate criteria, auto-gate ΦL threshold |
| DISPATCH | Thompson Selection + Execution | No | Yes | dispatch rules, DevAgent contract, git config |
| ADAPT | Thompson Selection + Model (LLM) | Yes | Yes | max adaptations, scope rules, ΨH trigger threshold |

**DISPATCH is unique:** Two Resonators, two separate Grids. The Selection Grid records model selection decisions. The Execution Grid records task execution outcomes. DISPATCH's Thompson selection operates on a noisier signal than other stages — see §10 (Self-Referential ΦL).

**GATE is unique:** Its Human Interface Resonator does not invoke an LLM. The decision becomes a Gate Decision Seed that flows to DISPATCH (if approved) or back to DECOMPOSE (if modified).

**CLASSIFY handles all classification concerns:** Both task type and importance class (kanoClass). The kanoClass property on Task Seeds propagates through the DISPATCH boundary to DevAgent — see §8 (Downstream Consumption).

### Morpheme Count

| Morpheme Type | Count | Notes |
|---|---|---|
| Bloom | 9 template + runtime | 1 Architect + 7 stage + 1 Assayer = 9 template. Execution Blooms (1 per run) are runtime instances. |
| Resonator | 14 current, 15 planned | 4 Thompson Selection + 3 Model + 2 Deterministic + 1 Human Interface + 1 Execution + 1 Assayer Evaluation + 1 ΨH + 1 Escalation Mechanism = **14**. Planned: +1 Statistical Assessment in Assayer (R-60) = 15. |
| Seed | ~25+ | 4 prompt templates + ~14 config Seeds + task templates + plan records + kanoClass mappings |
| Grid | 13 | 7 stage observation Grids + 1 DISPATCH Selection Grid + 1 Violation Grid + 1 Execution Observation Grid + 1 Plan History Grid + 1 Task Templates Grid + 1 Model Selection Grid |
| Helix | 4 | 1 Refinement (Scale 1) + 3 Learning (Scale 2: Decomposition, Template, Thompson) |
| Line | ~60+ | 7 inter-stage FLOWS_TO + ~14 Resonator→Grid FLOWS_TO + 4 Model Selection Grid reads + 7 Assayer inputs + 2 Assayer REFERENCES + Helix Lines + CONTAINS + INSTANTIATES |

**Total: ~125+ template morphemes within the Architect Bloom boundary.**

Excludes execution-time morphemes: Execution Blooms, Task Seeds, DEPENDS_ON Lines, Observation Seeds, Decision Seeds, Violation Seeds, Adaptation Seeds. A single execution may add 30-50 ephemeral morphemes. Over 10 executions: 400-600 morphemes. Over 100 executions: 3,000-5,000. See §12 for AuraDB growth trajectory.

### Containment Invariants

These invariants must hold for the topology to be structurally valid. Each can be verified by a Cypher query.

1. **Every morpheme within the Architect Bloom is reachable from the Architect Bloom via CONTAINS edges.** No orphaned nodes within the boundary. This includes Execution Blooms created at runtime.

2. **Every Resonator writes to at least one Grid within the same Bloom.** The Assayer's Evaluation Resonator writes to both a Violation Grid (operational output) and an Observation Grid (execution record). These serve different consumers: the Refinement Helix reads Violations, the Assayer's ΦL reads Observations. The ΨH Resonator additionally writes a property to the Architect Bloom node (ΨH value via updateMorpheme).

3. **Every stage Bloom has at least one observation Grid.** DISPATCH has two (Selection Grid + Execution Grid). All other stage Blooms have one.

4. **Every Helix has a Definition Seed in the Constitutional Bloom readable through an INSTANTIATES Line.** The iteration bound, temporal scale, and learning mode are properties on the Definition Seed, not hardcoded.

5. **The Assayer Bloom has FLOWS_TO Lines from every stage Bloom's output Seeds.** If a stage Bloom produces output that the Assayer cannot reach, that output is outside governance — a structural gap, not a design choice.

6. **CONTAINS direction is always parent→child.** No PART_OF, no BELONGS_TO, no child→parent containment edges.

7. **Every node has an INSTANTIATES edge to its constitutional definition.** Enforced by `stampBloomComplete()` (M-23.2) and the Instantiation Protocol.

8. **REFERENCES Lines connect to Constitutional Bloom content only.** Not used for inter-stage data flow (FLOWS_TO), identity (INSTANTIATES), or shared Grid reads (FLOWS_TO).

9. **Cross-boundary interaction requires Lines at Bloom boundaries.** The Refinement Helix's Return Lines terminate at stage Bloom boundaries. Thompson Selection Resonators read from the Model Selection Grid through FLOWS_TO Lines that cross the stage Bloom boundary. No morpheme reaches into another Bloom's internals directly (BTM-G3b).

---

## §5. Data Dependency DAG

The Architect's stage Blooms execute in an order determined by data dependency, not by a prescribed control flow. Each stage Bloom fires when its input Lines carry data — whether that data is a newly created Seed or a mutation of an existing Seed's properties. This section specifies the complete FLOWS_TO topology between stage Blooms.

### The Orchestrator Dissolves

The current `hybridAgent.ts` (~2400 lines) sequences stage calls, manages state between stages, and mediates all graph writes. In the concurrent model, this orchestrator is an Intermediary Layer. The replacement is the topology itself. Each stage Bloom's Resonator(s):
1. Read from their input Lines (which carry Seeds written or mutated by the previous stage)
2. Execute their transformation
3. Write their output Seeds to the graph through the instantiation protocol
4. Write observation Seeds to their stage Bloom's observation Grid
5. The next stage Bloom activates because its input Lines now carry data

### Data Ownership: Stage Blooms vs Execution Blooms

Stage Blooms are **persistent** children of the Architect Bloom. They hold machinery: Resonators, Config Seeds, Prompt Template Seeds, observation Grids.

Execution Blooms are **ephemeral** children of the Architect Bloom, one per run. They hold products: Intent Seed, Context Seeds, Task Seeds, classification properties, Gate Decision Seeds, Execution Result Seeds, Adaptation Seeds, Plan Outcome Seed.

Stage Blooms' Resonators produce Seeds that are **CONTAINED by the Execution Bloom**, not by the stage Bloom. This is a protocol-mediated write: the Resonator calls `instantiateMorpheme(seedProps, executionBloomId)` specifying the Execution Bloom as the containment target. The stage Bloom's observation Grid receives observation Seeds via `instantiateMorpheme(obsProps, stageObsGridId)`. Both writes go through the instantiation protocol. Neither is a cross-boundary reach — the protocol places each Seed in its declared containment target (A6).

### Primary Data Flow

```
Intent Seed (input — provided by operator or upstream system)
  │ CONTAINED by the new Execution Bloom
  │
  ↓ FLOWS_TO
○ SURVEY Bloom
  │  Thompson Selection → model selected. Model Resonator invokes LLM.
  │  Produces: Context Seeds (file inventory, spec state, graph state,
  │  gap analysis, confidence, blind spots, governanceModifying flag)
  │  → Context Seeds CONTAINED by Execution Bloom
  │  → Observation Seeds CONTAINED by SURVEY observation Grid
  │
  ↓ FLOWS_TO
○ DECOMPOSE Bloom
  │  Thompson Selection → model selected. Model Resonator invokes LLM.
  │  Reads from: Task Templates Grid (Stratum 3 — via FLOWS_TO)
  │  Produces: Task Seeds + DEPENDS_ON Lines + Phase Seeds
  │  → Task Seeds CONTAINED by Execution Bloom
  │
  ↓ FLOWS_TO
○ CLASSIFY Bloom
  │  Deterministic Resonator applies classification rules.
  │  Produces: classification properties ON existing Task Seeds via updateMorpheme()
  │  (taskType, kanoClass, estimatedComplexity, routingHint)
  │  NOTE: CLASSIFY does not produce new Seeds — it enriches existing Task Seeds.
  │  The activation trigger for downstream stages is the property mutation event.
  │
  ↓ FLOWS_TO
○ SEQUENCE Bloom
  │  Deterministic Resonator: topological sort + phase assignment.
  │  Produces: ordering properties ON existing Task Seeds via updateMorpheme()
  │  (executionOrder, phaseId). Phase boundary Seeds (new, via instantiateMorpheme).
  │
  ↓ FLOWS_TO
○ GATE Bloom
  │  Human Interface Resonator presents plan. Captures decision.
  │  Gate Decision Seed: approve | modify | abort
  │
  ├── IF approve → FLOWS_TO → ○ DISPATCH Bloom
  ├── IF modify → Return Line → ○ DECOMPOSE (max 3 cycles — constitutional bound)
  └── IF abort → Plan archived. Abort Seed to Execution Observation Grid.

○ DISPATCH Bloom
  │  Thompson Selection → model for DevAgent. Execution Resonator routes tasks.
  │  Per-task: sequential in executionOrder, respects DEPENDS_ON.
  │  At phase boundaries: Phase Completion Seed → GATE for phase gate check.
  │  Produces: Execution Result Seeds
  │
  ↓ FLOWS_TO
○ ADAPT Bloom
     Reads: Execution Results + ΨH friction + Violation Seeds from Assayer
     IF no divergence → Plan Outcome Seed. Complete.
     IF task failure → Return Line → DISPATCH (max 2 retries per task)
     IF phase failure → Return Line → DECOMPOSE
     IF plan failure → Return Line → SURVEY
     Max 5 total adaptations (constitutional bound). Exceed → operator escalation.
```

### Activation Trigger Contract

Two event types trigger stage activation:

1. **Node creation** (`instantiateMorpheme()`) — a new Seed appears on input Lines. Primary trigger for SURVEY, DECOMPOSE, GATE, DISPATCH, ADAPT.
2. **Property mutation** (`updateMorpheme()`) — an existing Seed's properties change. Trigger for SEQUENCE (CLASSIFY enriches Task Seeds) and ADAPT (DISPATCH updates Task Seeds with outcomes).

**Superseded Seed exclusion:** When resolving which Seeds an input Line carries, Seeds with status `superseded` are excluded. If S is corrected to S' via the Refinement Helix, downstream stages consume S' instead.

### Return Lines

| Return Line | From | To | Trigger | What It Carries |
|---|---|---|---|---|
| Gate modification | GATE | DECOMPOSE | Operator selects "modify" | Modification constraints |
| Task retry | ADAPT | DISPATCH | Single task failure | Modified Task Seed |
| Phase replan | ADAPT | DECOMPOSE | Phase-level failure | Remaining scope + failure context |
| Plan re-survey | ADAPT | SURVEY | Plan-level failure or sustained ΨH friction | Narrowed scope + failure context |
| Refinement correction | Refinement Helix | Any stage Bloom boundary | Assayer detects violation | Correction Seed (see §6) |

### Cross-Boundary Read Lines

| Reader | Source | Direction | Purpose |
|---|---|---|---|
| SURVEY Thompson Selection | Model Selection Grid | Grid → Resonator | Posterior sampling |
| DECOMPOSE Thompson Selection | Model Selection Grid | Grid → Resonator | Posterior sampling |
| DECOMPOSE Model Resonator | Task Templates Grid | Grid → Resonator | Distilled task shapes |
| DISPATCH Thompson Selection | Model Selection Grid | Grid → Resonator | DevAgent model selection |
| ADAPT Thompson Selection | Model Selection Grid | Grid → Resonator | Posterior sampling |
| ADAPT Model Resonator | Violation Grid (Assayer) | Grid → Resonator | Unresolved violations for replanning |

### Execution Bloom Lifecycle

1. **Creation:** Operator provides Intent Seed. Execution Bloom created. Intent Seed placed inside.
2. **Execution:** Stage Blooms fire in data dependency order. Output Seeds CONTAINED by Execution Bloom. Observation Seeds flow to stage Grids.
3. **Completion:** Plan Outcome Seed written. Status → `complete`. ΦL computed.
4. **Compaction:** Stratum 1 ephemeral Seeds compacted into Stratum 2 Seeds in the Plan History Grid. Execution Bloom persists as structural record.

---

## §6. Concurrent Governance Topology

The governance morphemes are not invoked at discrete checkpoints. They are live from the moment the Architect Bloom activates.

### Activation Model

When the Architect Bloom activates (Intent Seed arrives), three things happen simultaneously:

1. **Data dependency chain begins.** SURVEY activates.
2. **Governance morphemes activate.** Assayer Bloom, ΨH Resonator, Escalation Mechanism Resonator begin listening for topology changes.
3. **Refinement Helix arms.** It reads from the Violation Grid. When a Violation Seed appears, it fires.

### The Assayer Bloom — Continuous Evaluation

The Assayer's Evaluation Resonator activates on **every topology change** within the Architect Bloom — both node creation (`instantiateMorpheme()`) AND property mutation (`updateMorpheme()`). This is critical: CLASSIFY and SEQUENCE enrich existing Task Seeds via `updateMorpheme()`. If the Assayer only triggered on node creation, mutation-based stages would create an ungoverned path.

**The Assayer does not evaluate its own output.** Seeds within the Assayer Bloom's own Grids (Violation Grid, observation Grid) are outside its evaluation scope — they are not connected by inbound FLOWS_TO Lines from stage Blooms. This prevents an infinite self-evaluation loop.

**What it checks:** Grammar compliance (REFERENCES → grammar rule Seeds G1-G5), axiom compliance (REFERENCES → axiom Seeds A1-A4, A6-A9), anti-pattern detection (REFERENCES → anti-pattern catalogue).

**Output:** Pass → observation Seed. Violation → Violation Seed carrying: violating Seed reference, axiom/rule violated, evidence, severity (warning | error | critical), source stage, `correctionType` (structural | content).

**Asynchronous, not blocking.** The Assayer does not block the pipeline. The correction is eventual, not synchronous.

**GATE/Assayer latency:** GATE approves based on available information. If the Assayer subsequently produces a Violation Seed for a Seed that GATE already approved, the consequence is ΦL degradation, not rollback. The system tolerates evaluation latency.

### Correction Timing — The Race Condition

If the pipeline moves past a stage before the Assayer evaluates that stage's output, the correction arrives after downstream stages have consumed uncorrected Seeds.

**Design choice: corrections apply within the current execution with ΦL degradation. Downstream work is NOT invalidated.**

1. Refinement Helix fires correction cycle. Producing stage re-executes, produces S'.
2. S' connected to S via a CORRECTS Line. S marked `superseded`.
3. Downstream stages that already consumed S are NOT re-executed. ΦL degrades on S and propagates.
4. Downstream stages that have NOT yet consumed S consume S' instead (superseded Seed exclusion).
5. Downstream invalidation occurs only when ADAPT explicitly triggers replan via Return Lines.

**Why:** Cascading re-execution can thrash worse than the original violation.

### The Refinement Helix — Correction Cycle Mechanics

**Trigger:** Violation Seed with severity `error` or `critical`. Warnings degrade ΦL only.

**Correction types:** The Violation Seed's `correctionType` property:
- **`structural`** — grammar/axiom violation. Model produced non-compliant output. Triggers Thompson re-selection (negative posterior update on previous model).
- **`content`** — structurally valid but operationally inadequate. Re-invokes same model with Correction Seed as additional context. Thompson posterior unchanged.

Determined by: grammar rule violations (G1-G5) and axiom violations (A1-A4, A6-A9) are `structural`. Anti-pattern detections and quality assessments without axiom violation are `content`.

**Cycle:**

```
1. Assayer detects violation in Seed S from Stage Bloom B.
   → Writes Violation Seed V to Violation Grid.

2. Refinement Helix reads V. Constructs Correction Seed C.
   → Fires Return Line to Stage Bloom B's boundary.

3. Stage Bloom B receives C at its boundary.
   IF correctionType = 'structural': Thompson re-selects (different model possible).
   IF correctionType = 'content': Same model, C as additional context.
   → Produces revised Seed S'. S' CONTAINED by Execution Bloom.
   → (S')-[:CORRECTS]->(S). S marked superseded.

4. Assayer evaluates S'.
   IF pass: cycle ends. S' flows forward.
   IF violation: Helix increments counter.
     IF counter < bound: go to step 2 with S'.
     IF counter ≥ bound: pass through with degraded ΦL. Correction Exhaustion Seed.
```

**The CORRECTS Line:** New relationship type for `VALID_LINE_TYPES`. `(revised)-[:CORRECTS]->(original)`. Backward-reference (G2 "away" = result/feedback). Direction follows the provenance question: "what did this Seed correct?" Same structural class as Return Lines.

**Deterministic stages (CLASSIFY, SEQUENCE):** Re-executing with the same input produces the same violation. Correction Exhaustion Seed fires immediately. Rule deficiency surfaced to operator as a Scale 2 concern.

**GATE:** The Refinement Helix does not correct human decisions. Violations are recorded. ΦL degrades. The operator's decision stands.

### The ΨH Resonator — Intra-Pipeline Coherence

Recomputes on every topology change. Measures friction on FLOWS_TO Lines between stage Blooms. Two write targets: ΨH property on the Architect Bloom, observation Seed to the Execution Observation Grid.

**What ΨH reveals that per-stage ΦL cannot:** Two individually healthy stages that don't compose well. High per-stage ΦL + high inter-stage friction = ΨH catches it.

**ΨH feeds ADAPT:** Friction exceeding hysteresis-gated threshold triggers ADAPT re-survey signal.

### The Escalation Mechanism Resonator — Scale Crossing

Matches trajectory against constitutional signatures (v5.0 §Scale Escalation): Stagnation, Refinement Futility, Coherence Fracture, Phase Lock. Reads Trend conditioning output. Produces Escalation Event Seeds.

### Signal Conditioning — Intra-Run

| Conditioning | Applied By | Intra-Run Application | Min Observations |
|---|---|---|---|
| Debounce | Assayer | Suppresses duplicate evaluations on rapid topology changes | N/A (per-event) |
| CUSUM | ΨH Resonator | Detects mean shift in coherence | ~10+ |
| MACD | ΨH Resonator | Rate-of-change on ΦL and coherence | ~7+ |
| Hysteresis | ΨH → ADAPT | Prevents ADAPT flapping | 3+ |
| Trend | Escalation Mechanism | Projects trajectory — feeds Escalation as conditioned input | ~5+ |

### Governance Interaction Summary

```
Topology change occurs
  │
  ├──→ Assayer evaluates
  │     ├── Pass → ΦL positive
  │     └── Violation → Violation Seed
  │           ├──→ Refinement Helix → correction cycle
  │           └──→ ADAPT reads (replanning scope)
  │
  ├──→ ΨH Resonator recomputes
  │     └── Friction exceeds threshold → ADAPT receives signal
  │
  └──→ Escalation Mechanism checks trajectory (Trend-conditioned)
        └── Match → Escalation Event → operator
```

**No arbiter.** Three independent signals, three independent consumers. Refinement corrects content. ADAPT corrects coherence. Escalation surfaces trajectory. Each reveals what the others cannot — the governance equivalent of the three irreducible state dimensions.

---

## §7. Stage Descriptions

All output Seeds carry an `executionBloomId` property for per-execution traceability. Observation Seeds also carry `executionBloomId` for per-execution performance queries from stage Grids.

### SURVEY — Reconnaissance

Build a working model of current system state before planning. The gemba walk.

**Retrospective soft dependency:** When the Retrospective pattern is not instantiated, `processInsights` fields are null/empty. The SURVEY Resonator checks for the Retrospective's insight Grid via a conditional Line (exists + has content → read; dark or absent → skip).

**Output Seed schema:**

```typescript
interface SurveyOutput {
  intentId: string;
  codebaseState: {
    structure: string;
    recentChanges: string[];
    testStatus: 'passing' | 'failing' | 'unknown';
    openIssues: string[];
  };
  graphState: {
    patternHealth: Record<string, number>;
    activeCascades: number;
    constitutionalAlerts: string[];
  };
  processInsights: {
    activeAdvisories: string[];
    applicableLearnings: string[];
    standardisedWorkRef: string | null;
  };
  gapAnalysis: {
    whatExists: string[];
    whatNeedsBuilding: string[];
    whatNeedsChanging: string[];
    risks: string[];
  };
  confidence: number;
  blindSpots: string[];
  governanceModifying: boolean;  // true if intent modifies constitutional content,
                                  // governance morphemes, or instantiation protocol.
                                  // GATE reads this — auto-gate never applies when true.
  executionBloomId: string;
}
```

### DECOMPOSE — Task Graph Generation

Core intellectual work. Produces dependency-aware task graph.

```typescript
interface TaskSeed {
  taskId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  ctqs: string[];
  filesAffected: string[];
  specificationRefs: string[];
  verification: string;
  commitMessage: string;
  // --- Set by CLASSIFY (absent until classification completes) ---
  estimatedComplexity?: 'trivial' | 'low' | 'medium' | 'high';
  taskType?: 'mechanical' | 'generative';
  kanoClass?: 'must-be' | 'one-dimensional' | 'attractive';
  routingHint?: string;
  // --- Set by SEQUENCE (absent until sequencing completes) ---
  executionOrder?: number;
  phaseId?: string;
  executionBloomId: string;
}
```

**Stage-dependent property invariants:** After CLASSIFY, `taskType`/`kanoClass`/`estimatedComplexity`/`routingHint` must be present. After SEQUENCE, `executionOrder`/`phaseId` must be present. DISPATCH validates completeness as a Layer 1 conductivity check — missing properties escalate to ADAPT.

### CLASSIFY — Task Classification

Deterministic (R-31). Classifies both taskType AND kanoClass.

| Dimension | Values | Downstream Consumer |
|---|---|---|
| taskType | mechanical, generative | DISPATCH (execution path) |
| kanoClass | must-be, one-dimensional, attractive | DevAgent REVIEW (quality threshold) |
| estimatedComplexity | trivial, low, medium, high | SEQUENCE (ordering within phases) |
| routingHint | model class suggestion | DISPATCH Thompson Selection (context cluster) |

### SEQUENCE — Topological Ordering

Deterministic. Topological sort + phase assignment. Writes `executionOrder`/`phaseId` on Task Seeds via `updateMorpheme()`. Creates Phase boundary Seeds.

### GATE — Human Decision Checkpoint

Mandatory approval. Approve / modify (max 3 cycles, constitutional) / abort. Phase gates use the same mechanism — Phase Completion Seed from DISPATCH flows to GATE.

**Future evolution:** Auto-gate when `architect.phiL > 0.85 AND plan.estimatedEffort = 'small'`. **Safety constraint:** Auto-gate never applies when `SurveyOutput.governanceModifying = true`. Plans modifying constitutional content, governance morphemes, or the instantiation protocol always require manual GATE.

### DISPATCH — Task Execution Management

**Input validation:** Validates all required classification/sequencing properties before routing. Missing properties → ADAPT escalation.

Per-task: sequential in executionOrder (concurrent dispatch of independent tasks is future — see §12). Task Seeds carry `kanoClass` to DevAgent — specification metadata, not implementation prescription.

**Signal quality:** DISPATCH's Thompson operates on noisier signal than SURVEY/DECOMPOSE/ADAPT (causal chain through DevAgent pipeline). See §10.

### ADAPT — Replanning on Divergence

Most informationally rich stage. Three input sources: execution outcomes, ΨH friction, Violation Seeds.

| Signal Combination | Scope | Response |
|---|---|---|
| Single task failure, ΨH healthy, no violations | Task | Modify task → DISPATCH. Max 2 retries. |
| Multiple failures OR dependency discovered | Phase | → DECOMPOSE for remaining phase. |
| Assumption wrong OR ΨH sustained | Plan | → SURVEY with narrowed scope. |
| Correction Exhaustion >3 per execution (configurable on Config Seed) | Plan | → SURVEY. Helix can't fix it. |
| No divergence | Complete | Plan Outcome Seed. Done. |

---

## §8. Downstream Consumption

### Internal Consumption

| Producer | Output | Consumer | What It Informs |
|---|---|---|---|
| SURVEY | Context Seeds | DECOMPOSE | Gap analysis drives task generation |
| DECOMPOSE | Task Seeds + DEPENDS_ON | CLASSIFY | Raw tasks need classification |
| CLASSIFY | `taskType` | DISPATCH | Execution path (direct vs DevAgent) |
| CLASSIFY | `kanoClass` | DevAgent REVIEW (via DISPATCH) | Quality threshold |
| CLASSIFY | `estimatedComplexity` | SEQUENCE | Ordering within phases |
| CLASSIFY | `routingHint` | DISPATCH Thompson Selection | Context cluster |
| SEQUENCE | Ordering + Phase Seeds | GATE, DISPATCH | Plan presentation, execution order |
| GATE | Gate Decision Seed | DISPATCH or DECOMPOSE | Proceed, modify, or abort |
| DISPATCH | Execution Result Seeds | ADAPT | Divergence assessment |
| Assayer | Violation Seeds | Refinement Helix, ADAPT | Correction cycle, replanning scope |
| ΨH Resonator | ΨH + friction | ADAPT, Escalation Mechanism | Coherence signal, trajectory |

### Cross-Pattern Consumption

| Producer | Output | Consumer | What It Informs |
|---|---|---|---|
| DISPATCH | Task Seeds (with kanoClass) | DevAgent SCOPE | Input. kanoClass = quality threshold for REVIEW. |
| DISPATCH | Model selection decisions | Thompson Router | Posterior updates via Model Selection Grid |
| Plan History Grid | Plan outcomes (Stratum 2) | Retrospective (soft dependency) | Systemic cross-plan analysis |
| Stage FLOWS_TO Lines | Friction values | Immune Memory (**future — not M-8.INT**) | Remedy matching when friction exceeds threshold |

### kanoClass Propagation

DECOMPOSE produces CTQs → CLASSIFY assigns kanoClass → Task Seed flows through SEQUENCE/GATE unchanged → DISPATCH routes to DevAgent → DevAgent SCOPE reads kanoClass → DevAgent REVIEW sets quality threshold proportionally. Specification metadata, not implementation prescription.

---

## §9. Explicit Boundaries

### Functional Exclusions

- **Does NOT do process improvement.** Retrospective's responsibility. Synthesis vs analysis.
- **Does NOT replace human strategic judgment.** "What to build" is a values question.
- **Does NOT manage concurrent plans.** V1 is sequential.
- **Does NOT compute ΦL/ΨH/εR itself.** Governance morphemes handle computation.
- **Does NOT own the Assayer.** Scope from Lines, not authority.
- **Does NOT bypass the instantiation protocol.** All writes through governed functions.

### Boundary Interface Contract

| Direction | Line Type | What Crosses | Endpoint |
|---|---|---|---|
| IN | FLOWS_TO | Intent Seed | → SURVEY |
| IN | FLOWS_TO | Human Decision Seed | → GATE |
| IN | FLOWS_TO (soft) | Process Insight Seeds (Retrospective) | → SURVEY |
| OUT | FLOWS_TO | Task Seeds (to DevAgent) | → DevAgent boundary |
| OUT | FLOWS_TO | Escalation Event Seeds | → operator / Scale 3 |
| READ | REFERENCES | Axiom Seeds, Grammar Rules, Anti-Pattern Catalogue | ← Constitutional Bloom |
| READ | REFERENCES | Governance rule Seeds (cycle bounds) | ← Constitutional Bloom |

**Note:** Helixes read Definition Seeds through INSTANTIATES Lines — no separate REFERENCES or FLOWS_TO needed. Plan Outcome Seed is internal (CONTAINED by Execution Bloom); external consumers read from Plan History Grid (Stratum 2, exposed read-only).

---

## §10. Self-Referential ΦL

### ΦL Composition

| Factor | Source | Weight | What It Measures |
|---|---|---|---|
| axiom_compliance | Constitutional evaluation of stage outputs | 0.3 | Structural validity |
| provenance_clarity | % plans with full trace | 0.2 | Traceability |
| usage_success_rate | % plans without plan-level replan | 0.25 | Plan effectiveness |
| temporal_stability | Variance of ΦL + success rate | 0.25 | Consistency |

**Weight rationale:** Differs from v5.0 defaults (0.4, 0.2, 0.2, 0.2) deliberately. The Architect's primary signal is plan effectiveness (`usage_success_rate`), not structural validity (`axiom_compliance`). The Assayer catches structural violations inline through the Refinement Helix — by the time ΦL is computed, structural violations have been corrected or acknowledged. Weights on Config Seeds, subject to Scale 2 calibration.

### DISPATCH Signal Quality Differential

- **SURVEY/DECOMPOSE/ADAPT:** Short causal chain (selection → invocation → outcome within stage). Tight CIs.
- **DISPATCH:** Long causal chain through DevAgent pipeline. Wide CIs. Slower convergence.

The Statistical Assessment Resonator (R-60) can compute the CI differential. If DISPATCH posteriors aren't converging while others are, the signal quality gap is the cause.

### Plan RTY

Fraction of plans executing without any adaptation. RTY volatility feeds `temporal_stability`.

---

## §11. Cascading Effects

- **Graph topology:** ~10 morphemes → ~125. Option B additive multi-label retyping (M-16.5 precedent `bb8f451`).
- **VALID_LINE_TYPES:** Add CORRECTS. Backward-reference provenance link.
- **Thompson Router:** Per-stage context clusters (architect:survey, architect:decompose, architect:dispatch, architect:adapt).
- **DevAgent interface:** Task Seed carries `description`, `acceptanceCriteria`, `kanoClass`, `taskType`, `filesAffected`, `verification`, `commitMessage`. R-53 must specify SCOPE's read contract.
- **Assayer design:** Dual-mode — standalone pattern (batch) and governance Bloom (inline). See ASY in roadmap v10.1 for standalone; §4/§6 here for governance mode.
- **Memory operations:** Execution Observation Grid → Plan History Grid (Stratum 2) → Task Templates Grid (Stratum 3). M-10 must account for this architecture.
- **CLAUDE.md:** Pipeline invocation contract changes. All edits through Claude Code (truncation risk from GitHub API — `3c82861`).
- **Existing code:** `hybridAgent.ts` (~2400 lines) replaced incrementally by §12 phases.

---

## §12. Implementation Phasing

### Phase 1: Retype + Wire (ec-2 partial)

Retype stage Resonators as stage Blooms (Option B additive). Create internal composition. Wire FLOWS_TO, CONTAINS, INSTANTIATES. **Test:** §4 containment invariants verified by Cypher. Existing pipeline continues.

### Phase 2: Incremental Writes (ec-2, ec-3, ec-5)

Each stage writes inline. Execution Blooms per run. Dual-target write pattern: output → Execution Bloom, observations → stage Grid.

**Activation flavours:** Node creation + property mutation. Protocol notifies registered listeners.

**Agent-as-trigger (ec-5):** Intent Seed → Execution Bloom creation → stage activation = agent-as-trigger contract.

**Partial writes:** Failed Execution Blooms get `status: 'failed'`. Partial Seeds remain visible. Learning Helixes skip failed executions. Cleanup deferred to M-10.

**Test:** Output visible per-stage. `afterExecution()` becomes no-op. ΨH recomputes per topology change.

### Phase 3: Concurrent Governance (ec-4)

Assayer Bloom instantiated. Refinement Helix wired. Assayer notification hook in `instantiateMorpheme()` and `updateMorpheme()`. Cached containment boundary for hot-path performance. Self-evaluation prevention: stage Bloom output Seeds only. Superseded Seed handling. **Test:** Malformed output triggers violation → correction → CORRECTS Line traversable.

### Phase 4: Thompson Per-Stage + Learning (ec-2, ec-6)

Thompson Selection Resonators in 4 stages. Model Selection Grid. Thompson Learning Helix. Per-stage context clusters. **Test:** Different stages select different models. Model retirement (ec-6) preserves capabilities.

### Exit Criteria Mapping

| EC | Criterion | Phase | Status |
|---|---|---|---|
| ec-1 | CLASSIFY routing logic | Done | ✅ R-31 |
| ec-2 | DISPATCH → DevAgent handoff | 1 + 2 + 4 | ⬜ |
| ec-3 | DevAgent results → Architect | 2 | ⬜ |
| ec-4 | Assayer invocation | 3 | ⬜ |
| ec-5 | Agent-as-trigger interface | 2 | ⬜ |
| ec-6 | Model retirement preserves capabilities | 4 | ⬜ |

### AuraDB Growth

Template: ~125 morphemes. Per execution: +30-50. After 100 executions: 3,000-5,000. Current graph: ~2,800 nodes — doubles. Assess AuraDB tier before Phase 1. Compaction (Stratum 1→2→3) manages growth — must preserve Stratum 2 before archiving Stratum 1 (see §13 FMEA #7). Compaction lifecycle deferred to M-10; Execution Bloom structure supports it from Phase 2.

---

## §13. FMEA

RPN = Severity × Occurrence × Detection (each 1-10). Sorted by descending RPN.

| # | Failure Mode | Sev | Occ | Det | RPN | Structural Signal | Mitigation |
|---|---|---|---|---|---|---|---|
| 1 | **Intent ambiguity not caught** | 8 | 5 | 7 | **280** | Wrong plan executes. Late discovery. | Survey confidence + blindSpots. Mandatory GATE. |
| 2 | **Incorrect dependency declaration** | 7 | 4 | 6 | **168** | Tasks fail on missing outputs. Phase replans spike. | Track missing_dependency_rate. Decomposition Learning Helix. |
| 3 | **SURVEY misreads codebase** | 8 | 4 | 4 | **128** | Early failures. ΨH friction on SURVEY→DECOMPOSE. | Survey confidence. Cross-ref git log. |
| 4 | **Assayer notification hook failure** | 9 | 2 | 7 | **126** | Governance dark — no evaluations, no corrections. | Assayer ΦL dims (temporal_stability → 0). Heartbeat: evaluation count per stage = 0 → hook broken. |
| 5 | **Under-decomposition** | 7 | 4 | 4 | **112** | DevAgent helix exhaustion. Low first-pass rate. | Templates. Track first-pass rate per complexity. |
| 6 | **Correction race** | 6 | 5 | 3 | **90** | Downstream built on degraded input. ΦL visible. | Design tradeoff (§6). ADAPT replans if degradation exceeds threshold. |
| 7 | **Compaction destroys learning signal** | 6 | 3 | 5 | **90** | Learning Helix quality degrades. Templates stagnate. | Preserve Stratum 2 before archiving Stratum 1. Configurable interval. |
| 8 | **DECOMPOSE hallucination** | 7 | 4 | 3 | **84** | Non-existent task IDs, file paths, spec refs. (M-9.VA, FSM B-1.3) | Assayer grammar compliance. CLASSIFY filesAffected validation. |
| 9 | **Assayer evaluation latency** | 5 | 4 | 3 | **60** | Violations late. Governance always behind. | Non-blocking (§6). ΦL carries signal. Cached boundary for performance. |
| 10 | **Over-decomposition** | 5 | 5 | 2 | **50** | High overhead. Low value-per-task. | Templates limit minimum scope. Max 30 tasks (constitutional). |
| 11 | **Mechanical/generative misclassification** | 6 | 4 | 2 | **48** | Wrong execution path. | Track classification accuracy. Scale 2 rule learning. |
| 12 | **Plan thrashing** | 8 | 3 | 2 | **48** | Adaptation count > 3. More replanning than executing. | Max 5 adaptations (constitutional). Mandatory GATE on plan replan. |
| 13 | **Thompson posterior divergence** | 4 | 3 | 4 | **48** | DISPATCH posteriors not converging while others do. | By design (§10). Statistical Assessment Resonator diagnoses. |
| 14 | **Stale codebase model** | 5 | 4 | 2 | **40** | "File not found." Hard failure. | Re-survey on phase boundaries. Verify git state before dispatch. |

---

## §14. Cross-Pattern Integration

### Architect → DevAgent

Task Seeds carry specification metadata. DevAgent's own governance determines execution. **Interface quality = ΨH.** Low ΨH means: ambiguous specs (fix Architect), struggling DevAgent (fix DevAgent), or bad model allocation (fix posteriors). Structural signal differentiates.

### Architect → Thompson Router

Per-stage context clusters: `architect:survey`, `architect:decompose`, `architect:dispatch`, `architect:adapt`. Distinct from DevAgent clusters. A model excellent at code generation may be poor at task decomposition — separate posteriors needed.

### Retrospective → Architect (Soft Dependency)

Architect reads Retrospective's insight Grid. Retrospective reads Architect's Plan History Grid. Neither modifies the other. Communication through the graph, not invocation.

**Graceful degradation:** If Retrospective is dormant/absent, Architect continues without process improvement feedback. Soft dependency Line carries data when Retrospective fires (event-triggered).

**Bootstrapping:** The Retrospective doesn't exist yet. The Architect must accumulate execution history before the Retrospective produces value. Initial deployments operate without process improvement feedback — this is expected, not a gap.

---

*The Architect formalises the rhythm. Every plan is a hypothesis about how to close the gap between intent and reality. The Codex measures whether the hypothesis was right. The governance corrects what it can, escalates what it can't, and learns from both. The human moves up. The patterns move forward.*
