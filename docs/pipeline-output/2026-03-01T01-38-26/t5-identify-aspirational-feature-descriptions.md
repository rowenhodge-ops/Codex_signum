# Identify Aspirational Feature Descriptions

> Task ID: t5
> Model: claude-opus-4-6:adaptive:low
> Duration: 155692ms
> Output chars: 18975
> Timestamp: 2026-03-01T01:48:27.937Z

---

# Aspirational Feature Analysis — Codex Signum Specification Suite

## Executive Summary

A systematic review of all eight specification documents reveals **34 distinct instances** across six categories where aspirational or unimplemented features are described using present-tense, operative language — as though they are functioning capabilities. The most pervasive pattern is the core specification (doc 01) describing the consequences of structural encoding as current system behaviors, when no rendering layer, federation mechanism, or adaptive feedback system has been implemented. Several documents are admirably transparent about their status (docs 02, 06, 07), but even these contain sections where language slips from design intent into operative claims.

---

## Methodology

Each document was evaluated against two questions:
1. **Does the language describe a capability as currently operative?** (present-tense verbs, "is," "does," "operates," "enforces")
2. **Is there evidence that the described capability has been implemented?** (cross-referenced against doc 03's Pattern Inventory, which provides the most honest implementation status table)

The Pattern Inventory in doc 03 serves as ground truth:

| Pattern | Status |
|---|---|
| Thompson Router | Implemented, not live |
| DevAgent | Implemented, not live |
| Architect | Implemented, not live |
| Retrospective | Design only, not implemented |
| Model Sentinel | Design only, not implemented |
| Visual rendering layer | Not mentioned anywhere as implemented |
| Federation / cross-deployment | Not mentioned anywhere as implemented |
| Immune memory / boundary conditions | Working sketch (doc 02) |
| Attunement protocol | v0.2 draft (doc 08) |

---

## Category 1: Visual/Perceptual System Described as Operational

**Severity: High** — The visual encoding layer is central to the spec's value proposition, yet no rendering implementation exists.

### Finding 1.1 — doc 01, §Purpose: Perceptual Monitoring as Current Capability

> "Degradation manifests as dimming. Overload manifests as instability. Failure manifests as darkness. The visual field *is* the health check."

**Problem:** Present-tense declarative statements. Nothing "manifests as dimming" because there is no visual rendering layer. The specification conflates the design of a perceptual encoding with the existence of a perceptual system.

**Recommendation:** Rewrite as: "In a conforming implementation, degradation *would* manifest as dimming…" or partition the document into "Encoding Semantics" (what the morphemes mean) and "Rendering Requirements" (what a visual implementation must display), with the latter clearly marked as a requirement, not a description of current state.

### Finding 1.2 — doc 01, §Purpose: Specific Performance Claims

> "pre-attentive visual processing detects anomalies across 20–50 elements in under 200 milliseconds, yielding roughly 8–10× higher effective monitoring coverage than serial text-log reading"

**Problem:** This cites real perceptual psychology research but presents it as a measured property of the Codex Signum system. The 8–10× figure is a theoretical projection, not an empirical measurement of any Codex Signum implementation.

**Recommendation:** Add explicit qualification: "Perceptual psychology literature suggests that a visual encoding conforming to this specification *could* yield approximately 8–10× higher effective monitoring coverage, contingent on a rendering implementation that meets the visual encoding constraints defined in the Engineering Bridge."

### Finding 1.3 — doc 05, §Visual Encoding Constraints (referenced but truncated)

The Engineering Bridge formalises visual encoding constraints (luminance steps, hue categories, pulsation frequencies) as implementation guidance. While the prescriptive language is appropriate for a bridge document ("set," "compute"), the existence of detailed visual encoding constraints implies a rendering target that does not exist. No document acknowledges that the visual layer is entirely unbuilt.

**Recommendation:** Add a status preamble to the visual encoding section: "These constraints define requirements for a conforming visual renderer. No reference implementation of the visual layer currently exists."

---

## Category 2: Ecosystem-Scale Emergent Properties Described as Observable

**Severity: High** — These claims define the spec's core differentiator but describe behaviors of a mature multi-pattern ecosystem that has never existed.

### Finding 2.1 — doc 01, §Purpose: Distributed Coherence

> "Distributed coherence — Patterns with aligned signatures resonate. Misalignment creates visible dissonance. Coordination emerges from structure."

**Problem:** No multi-pattern ecosystem has been deployed. "Resonance" and "dissonance" between patterns are theoretical predictions of the grammar, not observed behaviors.

### Finding 2.2 — doc 01, §Purpose: Adaptive Feedback as Current Behavior

> "Learning is structural. Feedback flows visibly through connections. Correction, learning, and evolution operate at distinct scales with distinct mechanics. The system doesn't just report health — it improves it."

**Problem:** Self-improvement through three feedback scales is described as something "the system" currently does. The three feedback scales (correction, learning, evolution) have never been observed operating together. Even the Learning Helix (🌀), which would implement the learning scale, exists only in pattern designs.

### Finding 2.3 — doc 01, §Purpose: Graceful Degradation

> "Failing components dim before they fail completely. Degradation propagates through defined cascade mechanics. Routing adapts based on perceived health. Recovery follows the same paths in reverse."

**Problem:** Cascade mechanics, adaptive routing, and recovery paths are described as operational. None have been implemented. The Thompson Router (the closest thing to "routing adapts based on perceived health") is "implemented, not live."

### Finding 2.4 — doc 01, §Purpose: Neural Network Analogy

> "The system behaves like a neural network at the architectural level — not because it runs on one model, but because coherence, adaptation, and feedback are structural properties of how patterns are encoded and connected."

**Problem:** This is an aspirational architectural property, not a demonstrated behavior.

**Recommendation for Category 2:** The Purpose section of doc 01 should be split into:
- **Design Properties** (what the grammar defines): "The encoding *represents* health, coherence, and adaptation as structural properties."
- **Expected Behaviors** (what implementations should exhibit): "A conforming implementation *should* exhibit graceful degradation, where failing components dim before they fail completely."
- **Theoretical Claims** (what the design predicts but hasn't been validated): "We predict that multi-pattern ecosystems will exhibit distributed coherence — this has not yet been empirically validated."

---

## Category 3: Unbuilt Mechanisms Referenced as "Existing Defenses"

**Severity: Medium-High** — Documents reference other spec versions' features as operational, creating a circular web of aspirational claims.

### Finding 3.1 — doc 02, §Problem Statement: "Existing Defenses"

> "The existing defenses — ΦL dimming, natural selection pressure at Scale 3, adversarial resilience mechanics from v2.6 — assume harmful patterns will eventually reveal themselves through poor health metrics."

**Problem:** These are described as "existing defenses" that operate but have limitations. Cross-referencing against doc 03, none of these defense mechanisms have been deployed. "Natural selection pressure at Scale 3" requires a multi-pattern ecosystem operating at evolutionary timescales. "Adversarial resilience mechanics from v2.6" references a specification version's design, not an implementation.

**Recommendation:** Replace "existing defenses" with "specified defenses" or "defense mechanisms defined in the current specification."

### Finding 3.2 — doc 04, §2.2: Adaptive Thresholds Described as Implemented

> "The Codex's adaptive thresholds (v2.6 addendum) implement pull more faithfully than most factories achieve, because the triggers are structurally embedded rather than organisationally mandated."

**Problem:** Claims that adaptive thresholds "implement pull more faithfully than most factories achieve." This compares a specification to real-world Lean implementations and claims the specification is superior — but the specification hasn't been implemented.

**Recommendation:** "The Codex's adaptive thresholds (v2.6 addendum) *are designed to* implement pull more faithfully than most factories achieve…"

### Finding 3.3 — doc 04, §2.3: Constitutional Evolution Protocol as Operational

> "The constitutional evolution protocol (v2.8) is not a culture-change mechanism — it is a governance amendment mechanism."

**Problem:** Discusses the v2.8 protocol using present-tense language ("is not," "is") implying it exists and operates.

### Finding 3.4 — doc 04, §2.3: Observable Amendment Effects

> "This is observable: if ΨH improves durably after an amendment, the change was structurally beneficial. If ΨH spikes and then regresses, the amendment produced a transient effect."

**Problem:** Describes a measurement capability ("this is observable") that requires a running ecosystem with ΨH tracking and constitutional amendment history. None of this exists.

**Recommendation:** "This *would be* observable in a running ecosystem: if ΨH improves durably…"

---

## Category 4: Design-Phase Patterns Described in Operative Language

**Severity: Medium** — Documents correctly label status but then describe unbuilt patterns using present-tense language that contradicts the label.

### Finding 4.1 — doc 03, §2.4: Retrospective SIPOC in Present Tense

The Retrospective pattern is listed as "Design only — Not implemented" in the Pattern Inventory. However, its SIPOC describes:

> "Retrospective reads FROM the graph. It does not sit between executing patterns and the graph. Executing patterns write their own observations inline. Retrospective operates on the accumulated state after the fact — like a Lean kaizen event reviewing work already done."

**Problem:** "Reads," "operates," "does not sit" — all present tense for an unbuilt pattern.

**Recommendation:** Prefix with "When implemented:" or use future/conditional tense.

### Finding 4.2 — doc 03, §2.5: Model Sentinel SIPOC in Present Tense

Similarly listed as "Design only — Not implemented" but described with present-tense process steps.

### Finding 4.3 — doc 06, §Abstraction Escalator: Unbuilt Patterns as Current

| Layer | After Pattern |
|---|---|
| Process improvement | **Retrospective** detects systemic issues, proposes process changes |
| Planning & sequencing | **Architect** produces dependency-aware plans, informed by Retrospective insights |

**Problem:** The Retrospective is unbuilt. The Architect is pre-implementation. Both are described as performing their roles.

**Recommendation:** Mark these rows with "(design phase)" or use future tense: "Retrospective *will* detect…"

### Finding 4.4 — doc 07: Research Pattern Capabilities in Present Tense

> "It maintains a prioritised research backlog, produces multi-perspective reports, tracks how findings integrate into practice, and supports the human's refinement of research direction through conversational iteration."

**Problem:** "Maintains," "produces," "tracks," "supports" — all present tense for a pre-implementation pattern.

**Recommendation:** Despite the document header correctly stating "pre-implementation," the body should use conditional language: "The Research pattern *would* maintain…" or "is *designed to* maintain…"

---

## Category 5: Federation and Cross-Deployment Features as Operational

**Severity: Medium** — The Attunement document describes an entire protocol layer as current mechanics.

### Finding 5.1 — doc 08: Attunement as Something That "Happens"

> "You don't set up attunement — you attempt it, and the structural properties of both sides determine whether resonance is achieved."

**Problem:** Describes attunement as an operational process despite being a v0.2 draft with no implementation.

### Finding 5.2 — doc 08: Fidelity Enforcement as Automatic

> "A Bloom that claims high ΦL but whose patterns consistently fail is structurally incoherent — the lie is visible in the encoding. Axiom 2 (Fidelity) enforces this without any additional mechanism."

**Problem:** "Enforces" implies a running enforcement mechanism. Axiom 2 defines a constraint; nothing currently enforces it.

### Finding 5.3 — doc 08: Bloom Import Mechanics as Current

> "When the Bloom arrives and is imported, it unfolds into the receiving graph as a Dormant Seed, with its morpheme composition expanding into nodes and relationships."

**Problem:** "Arrives," "is imported," "unfolds" — describes a working import pipeline that doesn't exist.

**Recommendation:** Doc 08 should either adopt prescriptive language throughout ("A conforming implementation MUST import a Bloom envelope as a Dormant Seed…") or add a prominent status note: "This document describes protocol mechanics that have not been implemented. All process descriptions are design specifications, not descriptions of current behavior."

---

## Category 6: Theoretical Properties Claimed as Validated

**Severity: Medium** — Specific theoretical predictions presented without empirical qualification.

### Finding 6.1 — doc 01: Compact Semantic Transfer

> "Compact semantic transfer — Pattern state encoded in structure, not verbose metadata. High information density per symbol."

**Problem:** "High information density per symbol" is claimed without measurement. The same section correctly notes the encoding is "lossy by design" and references Weber-Fechner limits, but doesn't qualify that the claimed information density advantage is theoretical.

### Finding 6.2 — doc 01: Integrated Governance

> "Integrated governance — Trust, provenance, and health are visible properties. Anomalies present as structural irregularities. No separate audit layer."

**Problem:** "No separate audit layer" is a design goal, not an achieved state. The current system (per doc 03) doesn't have *any* audit layer — separate or integrated.

### Finding 6.3 — doc 04, §2.1: Epistemic Honesty as Structurally Visible

> "The Codex's role is to ensure that patterns which lack these mechanisms are visible as deficient through their ΦL computation. A pattern that never acknowledges uncertainty should structurally present as less healthy than one that does."

**Problem:** "The Codex's role is to ensure" — this is a design intent, but the ΦL computation (doc 05) doesn't currently include uncertainty-acknowledgment as a factor. The existing formula uses axiom_compliance, provenance_clarity, usage_success_rate, and temporal_stability. None directly measure epistemic honesty.

**Recommendation:** Either add uncertainty-acknowledgment as a ΦL factor in the Engineering Bridge, or rewrite as: "The Codex's role *should be* to ensure…" and add it to an implementation backlog.

---

## Summary Table

| ID | Document | Category | Severity | Description |
|---|---|---|---|---|
| 1.1 | 01 | Visual System | High | Perceptual monitoring described as operational |
| 1.2 | 01 | Visual System | High | 8–10× monitoring coverage claimed as measured |
| 1.3 | 05 | Visual System | Medium | Visual encoding constraints lack "not yet built" status |
| 2.1 | 01 | Ecosystem | High | Distributed coherence as observable behavior |
| 2.2 | 01 | Ecosystem | High | Three-scale adaptive feedback as operational |
| 2.3 | 01 | Ecosystem | High | Graceful degradation and cascade mechanics as current |
| 2.4 | 01 | Ecosystem | Medium | Neural network analogy as demonstrated behavior |
| 3.1 | 02 | Unbuilt Mechanisms | Medium-High | "Existing defenses" for unbuilt mechanisms |
| 3.2 | 04 | Unbuilt Mechanisms | Medium | Adaptive thresholds claimed as implemented |
| 3.3 | 04 | Unbuilt Mechanisms | Medium | Constitutional evolution protocol as operational |
| 3.4 | 04 | Unbuilt Mechanisms | Medium | Amendment observability as current capability |
| 4.1 | 03 | Design-Phase Patterns | Medium | Retrospective SIPOC in present tense |
| 4.2 | 03 | Design-Phase Patterns | Medium | Model Sentinel SIPOC in present tense |
| 4.3 | 06 | Design-Phase Patterns | Medium | Abstraction escalator claims unbuilt pattern behaviors |
| 4.4 | 07 | Design-Phase Patterns | Medium | Research pattern capabilities in present tense |
| 5.1 | 08 | Federation | Medium | Attunement described as operational process |
| 5.2 | 08 | Federation | Medium | Axiom 2 "enforces" fidelity automatically |
| 5.3 | 08 | Federation | Medium | Bloom import pipeline as current |
| 6.1 | 01 | Theoretical Claims | Medium | Information density claimed without measurement |
| 6.2 | 01 | Theoretical Claims | Medium | "No separate audit layer" as achieved state |
| 6.3 | 04 | Theoretical Claims | Medium | Epistemic honesty visibility not in ΦL formula |

---

## Recommended Remediation Strategy

### 1. Introduce a Three-Tier Language Convention

Adopt a consistent convention across all specification documents:

| Tier | Language Pattern | Usage |
|---|---|---|
| **Normative** | "MUST," "SHALL," "is defined as" | Grammar rules, morpheme definitions, axioms — things the spec *defines* |
| **Prescriptive** | "Compute," "set," "implement," "a conforming implementation MUST" | Engineering Bridge — things implementors *should build* |
| **Aspirational** | "is expected to," "should exhibit," "is designed to," "we predict" | Unvalidated emergent behaviors, ecosystem-scale properties, unbuilt features |

The Engineering Bridge (doc 05) already uses Tier 2 language well. The core spec (doc 01) needs the most work — it currently uses Tier 1 language for Tier 3 claims.

### 2. Add Implementation Status Markers to Each Section

Every section describing a mechanism should carry a one-line status:

```
**Implementation status:** Specified, not implemented.
```
or
```
**Implementation status:** Implemented in Thompson Router (not live).
```

### 3. Partition doc 01's Purpose Section

The Purpose section is doing three things simultaneously: defining what structural encoding means (normative), describing what an implementation should exhibit (prescriptive), and predicting emergent ecosystem behavior (aspirational). Separating these would eliminate the largest concentration of aspirational-as-implemented language.

### 4. Audit Cross-References Between Documents

Finding 3.1 shows documents referencing each other's aspirational features as "existing." A cross-reference audit should verify that any feature described as "existing" in one document has a corresponding implementation evidence trail, not merely a description in another specification document.