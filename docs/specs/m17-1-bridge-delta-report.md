# M-17.1 — Engineering Bridge Delta Report

## Bridge v2.0 → v5.0 Stale Formula Audit

**Date:** 2026-03-13
**Auditor:** Opus (Architect session)
**Reviewed by:** Ro (in-session)
**Input:** `codex-signum-engineering-bridge-v2_0.md` (527 lines, 10 Parts + Anti-Patterns + Glossary)
**Against:** `cs-v5.0.md` (canonised at `e1f6d88`), `concurrent-pattern-topology-v3.md` (`9c68eb1`), `codex-signum-morpheme-identity-map.md` (`524b25be`), `codex-signum-roadmap-v8.md` (`8cf24c8`)

---

## Executive Summary

The Engineering Bridge v2.0 was written as companion to Codex Signum v3.0 (2026-02-14). It predates v5.0 by nearly a month. The mathematical parameters are largely correct — the formulas survived two spec revisions. But the structural container is wrong. Every computation is presented as an abstract algorithm applied to nodes. v5.0 requires every computation to be a morpheme instance with structural identity, operating through Lines, contained in Blooms, with its own ΦL.

Three categories of work, plus new sections:

1. **Formula fixes** — small, critical, targeted edits (7 findings)
2. **Terminology and cross-references** — medium, mechanical (9 findings)
3. **Structural reframing** — large, conceptual rewrite of every section's container (7 findings)
4. **New sections** — concepts absent from Bridge v2.0 that v5.0 requires (9 findings)

The maths doesn't change. The framing does.

---

## Structural Reality: Bridge v3.0 Writes Against a Live Graph

Bridge v2.0 was written against aspirational architecture — a conceptual spec with no running graph. Bridge v3.0 writes against structural reality. As of HEAD `9a9abdc`:

- **2,425 nodes** with full morpheme identity (multi-label retyping complete)
- **Constitutional Bloom** live: 1 Bloom + 41 Seeds + 3 Resonators + 3 Grids = 48 morpheme instances
- **INSTANTIATES wiring** complete: every node connects to its definition in the Constitutional Bloom
- **Governance Resonators** live: Instantiation, Mutation, Line Creation — all graph writes route through them
- **Content** required on all morpheme types — enforced by the Instantiation Resonator
- **Zero structural violations** — Neo4j scan 0 critical, 0 warnings after M-16 hygiene fixes

This means every Bridge v3.0 specification can be verified against the actual graph. When the Bridge says "the Instantiation Resonator validates content presence," that Resonator exists at a known node ID with a known INSTANTIATES Line to the Constitutional Bloom. When it says "Line conductivity Layer 1 checks morpheme hygiene," the hygiene properties it checks are properties that exist on 2,425 live nodes.

The design principle from M-16 applies: write docs against real graph structure, not hypothetical. The graph IS the structural reality the Bridge specifies against.

---

## Category 1: Formula Fixes (Critical)

### F-1: Dampening Formula — Safety Bug

**Location:** Part 3, lines 211–216

**Bridge v2.0:**
```
γ_effective = min(0.7, 0.8 / (k - 1))    for k > 1
γ_effective = 0.7                          for k ≤ 1
```

**v5.0:**
```
γ_effective = min(γ_base, safety_budget / k)
```

Where γ_base = 0.7, safety_budget = 0.8, k = branching factor (count of CONTAINS Lines).

**Impact:** At k=2, Bridge formula produces γ=0.7, μ=1.4 — **supercritical**. Failures amplify instead of attenuating. v5.0 formula produces γ=0.4, μ=0.8 — subcritical. This is a genuine safety bug.

**Fix:** Replace formula. Replace table (lines 220–226) with v5.0's table:

| k | γ_effective (s=0.8) | μ = k×γ | Status |
|---|---|---|---|
| 1 | 0.7 | 0.7 | Subcritical ✓ |
| 2 | 0.4 | 0.8 | Subcritical ✓ |
| 3 | 0.267 | 0.8 | Subcritical ✓ |
| 5 | 0.16 | 0.8 | Subcritical ✓ |
| 10 | 0.08 | 0.8 | Subcritical ✓ |

**Decision (Ro):** v5.0 is correct. Replace, no discussion needed.

---

### F-2: Axiom Count 10 → 8

**Location:** Part 2, line 59

**Bridge v2.0:** "Fraction of 10 axioms satisfied (binary per axiom)"

**v5.0:** 8 axioms (A1–A4, A6–A9). A5 (Reversibility) removed — derived from A4 plus append-only memory topology.

**Fix:** Change "10" to "8."

---

### F-3: Cascade Example Numbers — Stale Arithmetic

**Location:** Part 3, line 244

**Bridge v2.0:** "expected cascade size for a binary tree is 4.36 nodes; with topology-aware dampening plus 2-level limit, it drops to 2.44 nodes."

These were computed with the old γ=0.7 at k=2. With v5.0's formula (k=2 → γ=0.4), the cascade attenuates much faster. Both numbers need recomputing against the corrected formula.

**Fix:** Recompute with γ=0.4 at k=2. The corrected numbers will be significantly smaller — the corrected formula produces safer cascade behaviour.

---

### F-4: Hub Dampening Formula — Kill

**Location:** Part 3, lines 230–236

**Bridge v2.0:** Recommends `γ_base/√k` for high-degree hub nodes as a separate formula.

**v5.0:** No separate hub formula. The general formula `safety_budget / k` handles all branching factors.

**Impact:** The hub formula is more permissive (γ=0.31 at k=5) than the general formula (γ=0.16 at k=5). It lets MORE signal through hubs — the opposite of safe behaviour. Having two formulas for the same thing is the pattern we've been eliminating.

**Decision (Ro):** Kill it. The general formula subsumes it and is both simpler and safer.

**Fix:** Remove the hub dampening subsection entirely.

---

### F-5: Cascade Description — "Grid" → "Bloom"

**Location:** Part 3, line 244

**Bridge v2.0:** "A failing Seed dims its Bloom. A failing Bloom dims its containing **Grid**."

**v5.0:** Degradation propagates through CONTAINS Lines. Containment is Bloom→Bloom→Bloom. Grids are pure data stores — Seeds and Lines, no computation, no containment hierarchy.

**Fix:** "A failing Seed dims its Bloom. A failing Bloom dims its containing **Bloom**."

---

### F-6: Bulkhead γ Override Example — Stale Value

**Location:** Part 9, line 439

**Bridge v2.0:** "Temporarily reduce γ (e.g., to 0.4)"

With the v5.0 formula fix, γ at k=2 is already 0.4. The override needs to go below computed, not to a fixed number.

**Decision (Ro):** Use `γ_override = γ_effective × stress_reduction_factor` where stress_reduction_factor = 0.5 during stress.

**Fix:** Replace fixed example with the multiplicative formula.

---

### F-7: Glossary Dampening Formula — Stale

**Location:** Glossary, line 515

**Bridge v2.0:** "γ_effective — Topology-aware dampening — min(0.7, 0.8/(k-1))"

**Fix:** "γ_effective — Topology-aware dampening — min(γ_base, safety_budget/k) where γ_base=0.7, safety_budget=0.8"

---

## Category 2: Terminology and Cross-References (Mechanical)

### T-1: Correction → Refinement (Global)

**Locations:** Part 8 line 409, Part 10 lines 458/467, Glossary line 511

All instances of "Correction Helix" → "Refinement Helix." All instances of "correction loops" → "refinement loops."

---

### T-2: "Agent" → "Component" or "Morpheme Instance"

**Locations:** Part 3 line 238 ("any agent"), Part 4 line 306 ("cross-agent correlation")

"Agent" is pre-v5.0 terminology. Per the Morpheme Identity Map, LLMs are Resonators. The generic term is "morpheme instance" or "component."

---

### T-3: Spec Version Reference v3.0 → v5.0

**Locations:** Header line 6 ("Companion to: Codex Signum v3.0"), Footer line 526 ("derives from Codex Signum v3.0")

---

### T-4: ΨH "Entropy" → "Variance"

**Location:** Part 9, line 428

**Bridge v2.0:** "ΨH distribution entropy — Sudden collapse"

**v5.0:** "Variance of ΨH values across compositions — Sudden collapse toward uniform value"

Same concept, v5.0 is more precise.

---

### T-5: Anti-Pattern Taxonomy Alignment

**Bridge v2.0:** 7 anti-patterns (Separate monitoring database, Morpheme labels on code, Assigned resonance, Silent routing around failure, Forced revival, Immediate blacklisting, Fixed dampening for all topologies)

**v5.0:** 10 foundational anti-patterns (Monitoring Overlay, Intermediary Layer, Dimensional Collapse, Prescribed Behaviour, Governance Theatre, Shadow Operations, Defensive Filtering, Skilled Incompetence, Undiscussable Accumulation, Pathological Autopoiesis)

**Decision (Ro):**
1. Keep Bridge-specific implementation anti-patterns (morpheme labels on code, assigned resonance, forced revival, immediate blacklisting) — valid engineering guidance
2. Remove "Fixed dampening for all topologies" — structurally impossible with correct formula
3. Cross-reference v5.0's foundational anti-patterns as the canonical taxonomy
4. Do not duplicate v5.0's taxonomy into the Bridge

---

### T-6: Glossary — Rewrite from Scratch

Seven findings justify a clean rewrite rather than patching:

| Entry | Issue |
|---|---|
| Seed | Lists "function" — functions are Resonators |
| Bloom | Lists "pipeline stage" — pipeline stages are Resonators within Blooms |
| Grid | "graph, schema" is vague — should be "observation history, archived signatures, persistent memory" |
| Helix | "correction retry" → "refinement retry" |
| γ_effective | Stale formula |
| Missing | Line conductivity, Constitutional Bloom, INSTANTIATES Line, Dimensional Profile, Remedy Archive, Signal Conditioning Resonator |
| Footer | "v3.0" → "v5.0" |

**Decision (Ro):** Rewrite from scratch against v5.0. Faster and cleaner than patching.

---

### T-7: CAS Watchpoints — Cross-Reference v5.0 Mechanisms

Part 6's seven CAS vulnerability watchpoints are valid but not connected to the structural mechanisms v5.0 now provides to address them:

| Watchpoint | v5.0 Structural Mechanism |
|---|---|
| Cascading failures (#2) | §Event-Triggered Structural Review — cascade activation trigger |
| Lock-in (#4) | εR floor computation (imperative gradient modulation + spectral calibration) |
| Parasitic patterns (#5) | Ω gradient inversion trigger in Structural Review Resonator |
| Inadequate measurement (#6) | §Structural Signatures (Merkle hash, position calculation) |

Additionally: immune memory system (Threat Archive + Remedy Archive) provides CAS-native defence mechanisms for watchpoints 2 and 5 that the Bridge should acknowledge.

---

### T-8: Failure Mode Analysis → Trajectory Signatures Cross-Reference

Part 10's component-level failure modes should cross-reference v5.0's composition-level Scale Escalation trajectory signatures. Component failure modes aggregate into trajectory signatures at composition scope.

---

### T-9: "Dashboard" Framing → Graph Visualisation

Part 5, line 343: "Dashboard modules beyond 9 simultaneously displayed elements overwhelm operators."

The M-13 design direction is graph-only — no dashboard chrome. Working memory constraints apply to visible graph elements at the current zoom level. v5.0's semantic zoom model manages this: Far zoom = fewer elements at lower detail, Near zoom = more elements at higher detail.

Reframe around graph visualisation working memory, not dashboard layout.

---

## Category 3: Structural Reframing (Conceptual)

These are not line-edits. Each requires rewriting the section's framing while preserving the mathematical parameters within.

### R-1: Part 3 — Degradation Cascade as CONTAINS Line Properties

**Current framing:** Propagation is a computation applied to nodes. Dampening is a formula you run. Hysteresis is a rule you apply. Cascade limit is a depth check.

**Required framing:** Propagation is properties of CONTAINS Lines. Dampening weight is a property on the CONTAINS Line, computed from the parent Bloom's branching factor. Hysteresis is asymmetric attenuation per signal direction on the same Line (G2 — direction encodes flow). Cascade limit is containment depth through CONTAINS Lines. Algedonic bypass is a Line property override activated by the child's ΦL value.

The formulas stay identical. The container shifts from "computation on nodes" to "properties on Lines."

**Decision (Ro):** This is a full rewrite of Part 3, not a formula patch. The v5.0 §Propagation as Line Properties section is the source.

---

### R-2: Part 4 — Signal Conditioning Stages as Resonators within a Bloom

**Current framing:** "Raw health events should be processed through this seven-stage pipeline."

**Required framing:** Seven named Signal Conditioning Resonators (Debounce, Hampel, EWMA, CUSUM, MACD, Hysteresis, Trend) within a Signal Conditioning Bloom, each with its own ΦL, input/output Lines, and observation history. Already typed as Resonators in M-9.7b mapping (`resonator:signal:debounce` through `resonator:signal:trend`).

Additionally: absorb CPT v3's intra-run vs cross-run temporal scale distinction. Not all seven Resonators are meaningful at all temporal scales (Hampel requires sufficient window size — primarily Scale 2).

Parameters don't change. Container does.

---

### R-3: Part 5 — Three Missing Visual Channels

**Current:** Three channels (pulsation, luminance, colour).

**v5.0:** Six channels (brightness/ΦL, hue/harmonic eigenmodes, pulsation frequency/activity, pulsation phase/ΨH, saturation/εR, spatial position/spectral embedding).

Three missing channels need implementation computation guidance (how to compute, not how to render — rendering belongs in the Rendering Specification):

| Channel | Computation Guidance Needed |
|---|---|
| Saturation → εR | Map εR ∈ [0,1] to saturation range. Specify discriminability, interaction with hue discrimination at low saturation |
| Pulsation phase → ΨH | Derive relative phase from eigenvector position. Specify synchronised animation timer technique. Reference 150ms pre-attentive detection window |
| Spatial position → spectral embedding | Compute screen coordinates from ΨH eigendecomposition. Specify the embedding computation that produces spatial layout |

**Hue contradiction:** Bridge says hue = categorical classification (domain/type). v5.0 says hue = continuous harmonic character from ΨH eigenmodes. v5.0 is correct — "domain or type" was explicitly killed this session.

**Decision (Ro):** The Bridge specifies the computation (what to compute). The Rendering Specification specifies the rendering (how to draw it). Keep them separate.

---

### R-4: Part 7 — Memory Strata Grounded in Morpheme Compositions

**Current framing:** Abstract strata with sizing numbers.

**Required framing:** Each stratum is a morpheme composition per v5.0 §Morpheme Grounding of Memory Operations:
- Recency weighting is a Line property (decay formula = Line weight)
- Compaction is a Resonator operation (archives Seeds, severs Lines below threshold)
- Distillation is a Resonator operation between Grids (many inputs → few outputs, its own ΦL)
- Contextual enrichment flows downward through Lines

Sizing guidance should account for:
- Stratum 3 now includes Remedy Archive entries (gap-plus-fix pairs with friction profiles) and immune memory archetypes — larger than generic "insights"
- Neo4j-specific storage overhead (node properties, relationship storage, index overhead for temporal queries)

---

### R-5: Part 8 — Structural Review Triggers Grounded in Resonator Identity

**Current:** Trigger conditions presented as abstract checks.

**Required:** Triggers are the input Lines to the **Structural Review Resonator** (Δ), which monitors event Seeds in the observation Grid. Diagnostic outputs (global λ₂, spectral gap, hub dependency, friction distribution, effective dampening assessment) are Seeds written to a Structural Review Grid.

The Resonator, its containment Bloom, its input Lines, and its five diagnostic output types should be specified.

---

### R-6: Part 9 — Bulkheads as Line Property Changes

**Current:** Bulkhead responses presented as external interventions ("Quarantine gossip from anomalous nodes").

**Required:** Per v5.0 §Bulkhead Mechanics: "These are stress responses expressed as Line property and Resonator configuration changes." Federation isolation is a Line property change (connection remains, transmission dampened). Cascade dampening override is a CONTAINS Line γ value reduction. Provenance weighting increase is a ΦL computation weight change.

Additionally: bulkhead activations are recorded as Seeds in the event Grid. The anomaly detection signals are read by the **Ecosystem Stress Resonator** (Δ).

---

### R-7: Part 6 — CAS Watchpoints Connected to Structural Defences

**Current:** Watchpoints presented as unresolved architectural risks.

**Required:** Acknowledge that v5.0's immune memory system (Threat Archive, Remedy Archive) and structural review mechanisms now provide structural responses to several watchpoints. The risks remain valid — the defences are structural mitigations, not eliminations.

---

## Category 4: New Sections Required

These concepts have no representation in Bridge v2.0. They are entirely new Parts for Bridge v3.0.

### N-1: Line Conductivity — Three-Layer Circuit Model

v5.0 §Line defines conductivity as a three-layer evaluation:

| Layer | What It Checks | Result |
|---|---|---|
| 1. Morpheme hygiene | Required properties present, INSTANTIATES Line intact, Merkle signature valid | Binary: conducts or dark |
| 2. Grammatical shape | Connection type valid for both endpoints (G3 containment, G2 direction, G4 signal type) | Binary: conducts or dark |
| 3. Contextual fitness | Dimensional property alignment for the specific work — reads dimensional profiles from observation Grids | Continuous: friction value |

The Bridge must specify:

- How each layer evaluates in Neo4j (Cypher patterns for hygiene check, shape validation, friction computation)
- TypeScript interfaces for conductivity results
- Caching strategy: conductivity is a cached property on the Line, re-evaluated when either endpoint's structural properties change
- Invalidation triggers
- How Layer 3 reads dimensional profiles (queries against observation Grids filtered by task classification)
- Relationship between conductivity and the signal conditioning pipeline
- How the Instantiation/Mutation/Line Creation Resonators evaluate conductivity at write time

---

### N-2: Immune Memory Repair — Remedy Archive and Compensatory Morpheme Lifecycle

v5.0 §Immune Memory defines a repair function:

- **Remedy Archive Grid** (□) — Stratum 3. Contains compensatory pattern Seeds with friction profiles paired with successful resolutions.
- **Remedy Matching Resonator** (Δ) — Reads incoming friction profiles from Lines exceeding threshold. Compares against Remedy Archive. On match, instantiates compensatory morpheme through the Instantiation Resonator.
- **Compensatory morpheme lifecycle** — Birth (near-zero ΦL), probation (monitored), survival/dissipation (ΦL rises = persists, falls = removed).

The Bridge must specify:

- How friction profiles are computed and represented (dimensional shape)
- How the Remedy Matching Resonator compares incoming profiles against archived remedies
- How compensatory morpheme instantiation goes through the Instantiation Resonator (not raw graph writes)
- Lifecycle evaluation criteria (ΦL thresholds for survival vs dissipation)
- How successful remedies strengthen the Remedy Archive (confidence increase)
- How the archive starts empty and learns from resolved escalations
- Interaction between Threat Archive (what to fight) and Remedy Archive (what to fix)

---

### N-3: Dimensional Profiles

v5.0 §Dimensional Profiles defines partitioned ΦL views:

- Composite ΦL decomposes by task classification (ΦL_code, ΦL_reasoning, etc.)
- Profiles are queries against the observation Grid filtered by tag — NOT stored properties
- Patterns define their own pins (task classifications and observation tags)
- Profiles feed Line conductivity Layer 3 (contextual fitness)

The Bridge must specify:

- How observation Seeds are tagged by task classification
- How partitioned ΦL is computed (filter Grid by tag, run same four-factor formula on partition)
- How the Thompson router reads dimensional profiles when selecting model Resonators
- That profiles are ephemeral computations, not persisted state

---

### N-4: ΨH Temporal Decomposition

Already implemented in codebase but not documented in the Bridge (from M-17.6 deferred computation table):

- EWMA trend component
- friction_transient component
- friction_durable component

The Bridge must specify formal computation details for the temporal decomposition of composite ΨH.

---

### N-5: Composition-Scope εR

v5.0 specifies εR spike at Bloom boundary as one of six event triggers. The Bridge doesn't specify how εR is computed at composition scope.

**Decision (Ro):** Composition εR is the aggregate of contained components' exploration behaviour. Follows the same parent-from-children derivation as ΦL. A Bloom whose Resonators always select the same substrate has low εR. A Bloom distributing across substrates has high εR.

---

### N-6: Bridge View Principle (M-17.2 — Codification)

Not a new *section* per se, but a governing constraint that must be codified as part of the Bridge v3.0 rewrite:

> "Every Engineering Bridge formula MUST be expressible as a pure function of grammar-defined morpheme states and axiom-defined parameters. No Bridge formula may introduce state, thresholds, entities, or temporal behavior not grounded in the symbolic grammar."

This resolved nine M-8A recommendations (F-2, F-4, F-7, AI-03, AI-07, AI-09, C-03, C-07, C-10). Codification means: normative constraint stated in the Bridge preamble, every formula auditable against the principle.

---

### N-7: Governance Resonators — Instantiation, Mutation, Line Creation

The Constitutional Bloom contains three governance Resonators that enforce all graph writes. These are new in M-16 and have no Bridge representation.

- **Instantiation Resonator** — invoked by `instantiateMorpheme()`. Creates new morpheme instances with required properties, wires INSTANTIATES Line to the Constitutional Bloom, validates content is present.
- **Mutation Resonator** — invoked by `updateMorpheme()`. Modifies existing morpheme properties. Auto-propagates parent Bloom status from children.
- **Line Creation Resonator** — invoked by `createLine()`. Creates relationships between morphemes. Evaluates Line conductivity at write time.

The Bridge must specify:
- How each Resonator maps to its TypeScript function (`src/graph/instantiation.ts`)
- Their observation Grid structure (what they record about each write operation)
- Their ΦL computation (what makes a governance Resonator healthy vs degraded)
- That ALL graph writes route through these Resonators — no raw Cypher writes

This could fold into N-1 (Line Conductivity) since the Line Creation Resonator evaluates conductivity at write time, or stand as its own section. The governance Resonators are the structural fix for the Compliance-as-Monitoring anti-pattern — when violations are structurally impossible, checking is unnecessary.

**Decision (Ro):** Keep as a separate section. The governance Resonators enforce morpheme creation and mutation — not just Lines. N-7 cross-references N-1 for the conductivity evaluation aspect of the Line Creation Resonator, but the Instantiation and Mutation Resonators have their own scope independent of conductivity.

---

### N-8: Content Required for ALL Morpheme Types

v5.0 changed this session to require `content` on all morpheme types — Blooms, Resonators, Grids, and Helixes, not just Seeds. Bridge v2.0's Part 2 ΦL computation section references content as a Seed property. The morpheme hygiene check in N-1 (Line Conductivity Layer 1) says "required properties present" — this must specifically include content for all morpheme types.

The Bridge must specify:
- Content is a required property across all six morpheme types
- The Instantiation Resonator (N-7) rejects morpheme creation without content
- Line Conductivity Layer 1 (morpheme hygiene) checks content presence on both endpoints regardless of morpheme type
- What constitutes valid content per morpheme type (a Bloom's content describes its scope/purpose; a Resonator's content describes its transformation; a Grid's content describes what it stores; a Helix's content describes its iteration behaviour)

---

### N-9: Morpheme Shape Derivation as Topology-Derived Computation

v5.0 grounds every morpheme's visual shape in topology — shapes are derived, not prescribed:

| Morpheme | Shape Derived From |
|---|---|
| Resonator (Δ) | Input/output Line ratio — many-to-one = compression, one-to-many = distribution, balanced = relay |
| Grid (□) | Internal Line topology — temporal Lines = timeline, similarity Lines = cluster map |
| Helix (🌀) | Iteration behaviour — tightness = temporal scale, convergence = improving/stable/degrading, depth = iteration count |
| Bloom (○) | Interface Line count — open boundary = active interface Lines crossing, closed = no active interface Lines |

The Bridge should specify the computation that produces shape data from topology (how to count input/output Lines for Resonator shape ratio, how to classify internal Line topology for Grid shape, how to compute iteration metrics for Helix shape). The Rendering Specification then specifies how to draw the computed shape. This maintains the Bridge = "what to compute" / Rendering Spec = "how to draw it" boundary established in R-3.

---

## Summary by Bridge Section

| Section | Formula Fixes | Terminology | Structural Reframing | New Content |
|---|---|---|---|---|
| Header | — | T-3 (v3.0→v5.0) | — | — |
| Part 1: Foundational Principle | — | — | — | — |
| Part 2: State Dimensions | F-2 (axiom count) | — | — | N-3 (Dimensional Profiles), N-4 (ΨH temporal), N-5 (composition εR) |
| Part 3: Degradation Cascade | F-1 (dampening formula), F-3 (cascade numbers), F-4 (kill hub formula), F-5 (Grid→Bloom) | T-1 (Correction→Refinement), T-2 (agent→component) | **R-1 (full rewrite as Line properties)** | — |
| Part 4: Signal Conditioning | — | T-2 (cross-agent→cross-component) | **R-2 (stages→Resonators within Bloom)** | Intra-run vs cross-run distinction from CPT v3 |
| Part 5: Visual Encoding | — | T-9 (dashboard→graph vis) | **R-3 (3 missing channels, hue contradiction)** | Saturation, pulsation phase, spatial position computation guidance, N-9 (shape derivation) |
| Part 6: CAS Watchpoints | — | — | **R-7 (connect to structural defences)** | Immune memory as CAS defence |
| Part 7: Memory Sizing | — | — | **R-4 (morpheme grounding)** | Remedy Archive + immune memory sizing, Neo4j guidance |
| Part 8: Structural Review | — | T-1 (Correction→Refinement) | **R-5 (Resonator identity + diagnostic outputs)** | — |
| Part 9: Adversarial Resilience | F-6 (γ override example) | T-4 (entropy→variance) | **R-6 (bulkheads as property changes)** | Ecosystem Stress Resonator identity |
| Part 10: Pattern Guidance | — | T-1 (Correction→Refinement) | — | T-8 (trajectory signature cross-ref) |
| Anti-Patterns | — | T-5 (taxonomy alignment) | — | — |
| Glossary | F-7 (dampening formula) | T-6 (rewrite from scratch) | — | Missing entries for all v5.0 concepts |
| — | — | — | — | **N-1 (Line Conductivity — new Part)** |
| — | — | — | — | **N-2 (Immune Memory Repair — new Part)** |
| — | — | — | — | **N-6 (Bridge View Principle — preamble)** |
| — | — | — | — | **N-7 (Governance Resonators — separate Part, cross-refs N-1)** |
| — | — | — | — | **N-8 (Content required for all morphemes — absorb into N-1 Layer 1 + N-7)** |
| — | — | — | — | **N-9 (Morpheme shape derivation — new subsection in Part 5)** |

---

## Sequencing Recommendation

**M-17.1** (this document) is complete — the audit is done.

**M-17.2** (Bridge View Principle codification) should be next. It establishes the governing constraint that every subsequent sub-milestone must satisfy. Write it into the Bridge preamble before touching any formulas.

**M-17.3–M-17.6** can proceed in any order — they add new sections and reframe existing ones. They are independent of each other:

- **M-17.3** — Line conductivity implementation detail (N-1). New Part.
- **M-17.4** — Superposition operational mechanics. New Part (not in this audit because Bridge v2.0 has no superposition content — it's entirely new).
- **M-17.5** — Event-driven execution model from CPT v3. New Part (Bridge-level specification of TypeScript event handlers, Neo4j write sequencing, concurrency).
- **M-17.6** — Build experience + deferred computations (N-4 ΨH temporal, N-5 composition εR, plus Thompson priors, context-blocked posteriors, exploration decay, hallucination detection).

**Formula fixes (F-1 through F-7)** can land in any sub-milestone — they're targeted edits. Recommend landing them in M-17.2 alongside the Bridge View Principle since they're the most safety-critical changes and the principle provides the audit criterion.

**Terminology (T-1 through T-9)** is mechanical and can be batched into a single pass.

**Structural reframing (R-1 through R-7)** is the bulk of the writing work. Each reframe touches one Part. Can be distributed across M-17.3–M-17.6 based on topical alignment, or batched as a separate reframing pass.

**New sections (N-1 through N-9)** align with M-17.3 (N-1 Line Conductivity, N-2 Immune Memory, N-3 Dimensional Profiles, N-7 Governance Resonators, N-8 content-for-all-morphemes), M-17.5 (N-9 shape derivation computation feeds the event-driven rendering model), and M-17.6 (N-4 ΨH temporal, N-5 composition εR).

---

## Bridge View Principle Audit Criterion

Every formula in the Bridge v3.0 must pass this test:

> Is this formula expressible as a pure function of grammar-defined morpheme states and axiom-defined parameters?

If yes: the formula belongs in the Bridge.
If no: either ground it in the grammar or remove it.

This is the acceptance criterion for M-17 completion.
