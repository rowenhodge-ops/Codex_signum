# Refine, Reframe, or Reject Recommendations

> Task ID: t16
> Model: claude-opus-4-6:adaptive:low
> Duration: 136963ms
> Output chars: 23815
> Timestamp: 2026-03-01T09:35:42.963Z

---

# Preliminary Action Items: Consolidated M-7B Spec Review Analysis

## Task t16 — Refine, Reframe, or Reject Recommendations

---

## 1. Methodology

Each recommendation surfaced from the two M-7B spec review reports (and refined through analyses t10–t15) was tested against the full Codex Signum compliance matrix:

| Compliance Layer | Items Tested Against |
|---|---|
| **Axiom Layer** | A1 (Identity), A2 (Composition), A3 (State Dimensionality), A4 (Transformation), A5 (Observation Non-Collapse), A6 (Separation of Concerns), A7 (Derivation over Storage), A8 (Completeness), A9 (Consistency), A10 (Minimality) |
| **Grammar Layer** | G1 (Morpheme Atomicity), G2 (Morpheme→Signum Composition), G3 (Signum Relational Typing), G4 (Full-Dimensional State Expression), G5 (Computed Views Derive from Stored State) |
| **Anti-Pattern Layer** | AP1 (Binary Collapse), AP2 (Premature Optimization), AP3 (Computed-as-Stored), AP4 (Identity Conflation), AP5 (Axiom Circumvention), AP6 (Grammar Violation), AP7 (Circular Derivation), AP8 (State Leakage), AP9 (Observation Collapse), AP10 (Redundant Specification) |

A recommendation is:
- **Validated** — passes all three layers without modification.
- **Reframed** — accepted in principle but modified to achieve compliance; reframed text provided.
- **Rejected** — fundamentally violates one or more principles and cannot be salvaged without becoming a different recommendation entirely.

Each item also receives a **timing classification**: `resolve-now` (pre-refactor, safe and isolated) or `defer-to-refactor` (requires Codex-native structural changes).

---

## 2. Consolidated Action Item List

### AI-001: Error Morpheme Introduction

**Original Recommendation:** Introduce an `Error` morpheme to signal system error states, with values `error` / `no-error`.

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A3 (State Dimensionality) | ❌ FAIL | A binary `error`/`no-error` collapses what is inherently a multi-dimensional state (severity, domain, recoverability, temporal phase) into a single Boolean axis. This directly violates the axiom that state must be expressed in its native dimensionality. |
| A10 (Minimality) | ⚠️ WARN | If error state is already inferable from existing morpheme compositions, adding a dedicated morpheme may be redundant. |
| G4 (Full-Dimensional State Expression) | ❌ FAIL | Grammar requires state to carry its full dimensional signature. A binary morpheme is a degenerate case. |
| AP1 (Binary Collapse) | ❌ FAIL | This is the textbook example of anti-pattern row 1. |
| AP10 (Redundant Specification) | ⚠️ WARN | Potentially redundant if error conditions are already expressible via existing composition. |

**Status: REFRAMED**

**Reframed Text:** Introduce an `Anomaly` morpheme triplet expressing error state along three orthogonal axes: `severity` (gradient: nominal → critical), `domain` (enumerated: validation, runtime, infrastructure, semantic), and `recoverability` (gradient: self-healing → terminal). The morpheme composes into existing signa via standard G2 composition rules. No binary encoding is permitted; the minimum state expression is a 3-tuple.

**Rationale:** The *need* for error signaling is valid (A8 Completeness). The *encoding* as binary is what fails. Reframing preserves the intent while honoring A3, G4, and avoiding AP1. The three axes were chosen because they are orthogonal (no axis is derivable from another), satisfying A10.

**Timing:** `defer-to-refactor` — Requires morpheme registry changes and composition rule updates that should be part of the Codex-native structural refactor.

---

### AI-002: Axiom Ordering Rearrangement

**Original Recommendation:** Reorder axioms such that A7 (Derivation) precedes A3 (State Dimensionality), and A6 (Separation) moves to position 2, on the grounds that these reflect "logical dependency."

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A9 (Consistency) | ❌ FAIL | The current axiom ordering is not arbitrary—it encodes a dependency DAG where each axiom may reference concepts established by prior axioms. Reordering breaks referential integrity within the axiom definitions themselves. |
| A1 (Identity) | ❌ FAIL | Axioms have identity, and their ordinal position is *part of* that identity in the current spec. Changing position changes identity semantics. |
| G3 (Signum Relational Typing) | ⚠️ WARN | Axioms are themselves signa within the meta-layer; retyping their relationships (ordering) must follow relational typing rules. |
| AP5 (Axiom Circumvention) | ❌ FAIL | Reordering axioms to justify downstream recommendations that would otherwise fail compliance is a form of axiom circumvention. |

**Status: REJECTED**

**Rationale:** The axiom ordering carries semantic weight. Axiom A1 (Identity) must precede A2 (Composition) because composition presupposes identity. A2 must precede A3 (State Dimensionality) because state is a property of composed signa. The proposed reordering breaks this dependency chain. Furthermore, the motivation for reordering (making certain Engineering Bridge formulas "axiomatic") was found in t14 analysis to be an instance of AP5—restructuring the framework to fit an implementation rather than the reverse. If a genuine dependency issue exists, it should be expressed as an explicit cross-reference annotation, not as a positional change.

**Timing:** N/A (rejected).

---

### AI-003: Engineering Bridge Formula — Composition Validity Score

**Original Recommendation:** Add a stored `composition_validity_score` field to each signum, computed as the weighted sum of morpheme compatibility indices.

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A7 (Derivation over Storage) | ❌ FAIL | This is a derived value. It is fully computable from the morpheme compatibility matrix and the signum's current composition. Storing it violates A7. |
| G5 (Computed Views) | ❌ FAIL | Grammar rule 5 explicitly requires that values derivable from stored state must be expressed as computed views, not stored fields. |
| AP3 (Computed-as-Stored) | ❌ FAIL | Direct hit on anti-pattern row 3. |
| A10 (Minimality) | ❌ FAIL | Adds redundant data that must be kept in sync, violating minimality. |

**Status: REFRAMED**

**Reframed Text:** Define `composition_validity_score` as a **computed view** (derivation function) in the Engineering Bridge layer. The function signature is: `f(signum) → score`, where `score` is derived from the morpheme compatibility matrix applied to the signum's current composition state. No stored field is created. The Engineering Bridge may cache the result for performance, but the cache is explicitly marked as ephemeral and is not part of the specification layer.

**Rationale:** The *metric* is useful for engineering. The *storage* violates framework principles. Reframing as a computed view preserves utility while honoring A7, G5, and avoiding AP3. The ephemeral cache allowance acknowledges engineering reality without polluting the spec layer (A6 Separation).

**Timing:** `resolve-now` — This is a documentation/definition fix that doesn't require structural refactoring.

---

### AI-004: Engineering Bridge Formula — State Transition Cost Matrix

**Original Recommendation:** Add a pre-computed `state_transition_cost_matrix` as a static lookup table in the Engineering Bridge.

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A7 (Derivation) | ⚠️ WARN | Partially derived (costs depend on current state configuration), partially static (some costs are intrinsic to morpheme types). |
| A3 (State Dimensionality) | ⚠️ WARN | A flat matrix may fail to capture the full dimensionality of transitions if state is multi-axial. |
| G5 (Computed Views) | ⚠️ WARN | The static portion could be stored; the dynamic portion must be computed. |
| AP3 (Computed-as-Stored) | ⚠️ WARN | Partial violation for the dynamic components. |

**Status: REFRAMED**

**Reframed Text:** Decompose the transition cost matrix into two layers: (a) a **static intrinsic cost table** (storable, as these are definitional properties of morpheme type-pairs), and (b) a **dynamic contextual cost function** that computes the state-dependent component at query time. The Engineering Bridge exposes a unified query interface that composes both layers, but the specification layer only defines (a) as stored state and (b) as a derivation rule.

**Rationale:** The decomposition honors A7 by storing only what is truly static/definitional and computing what is state-dependent. It respects A3 by allowing the dynamic function to account for full state dimensionality. The unified query interface satisfies engineering usability (A8 Completeness) without violating the storage/derivation boundary.

**Timing:** `defer-to-refactor` — Requires Engineering Bridge interface redesign.

---

### AI-005: Morpheme Namespace Flattening

**Original Recommendation:** Flatten the hierarchical morpheme namespace into a single-level registry for "simplicity."

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A2 (Composition) | ❌ FAIL | Hierarchy in the morpheme namespace reflects compositional structure. Flattening destroys compositional semantics. |
| A1 (Identity) | ❌ FAIL | Hierarchical position is part of morpheme identity. Flattening creates identity collision risks. |
| G1 (Morpheme Atomicity) | ⚠️ WARN | Flattening may conflate atomic morphemes with composite ones if namespace no longer distinguishes them. |
| AP4 (Identity Conflation) | ❌ FAIL | Direct hit—flattening merges distinct identity-bearing namespaces. |
| AP2 (Premature Optimization) | ⚠️ WARN | "Simplicity" motivation suggests optimizing for implementation convenience over semantic correctness. |

**Status: REJECTED**

**Rationale:** The hierarchical namespace is not an implementation artifact—it is a structural expression of compositional relationships (A2) and identity scoping (A1). Flattening it is a semantic loss that cannot be compensated. If the concern is lookup performance, that is an Engineering Bridge concern and should be addressed with an index/cache, not by mutating the specification layer.

**Timing:** N/A (rejected).

---

### AI-006: Add Explicit Morpheme Deprecation Lifecycle

**Original Recommendation:** Define a formal deprecation lifecycle for morphemes (active → deprecated → retired → archived).

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A4 (Transformation) | ✅ PASS | Deprecation is a state transformation. Defining its lifecycle makes the transformation explicit. |
| A8 (Completeness) | ✅ PASS | The current spec lacks deprecation semantics, which is a completeness gap. |
| A3 (State Dimensionality) | ✅ PASS | Four-phase lifecycle is a valid dimensional expression (ordinal axis with defined transitions). |
| G4 (Full-Dimensional State) | ✅ PASS | The lifecycle states are not binary—they express a progression with distinct semantics at each phase. |
| AP1-10 | ✅ PASS | No anti-pattern violations detected. |

**Status: VALIDATED**

**Rationale:** This recommendation fills a genuine completeness gap (A8) using proper state-dimensional expression (A3, G4) and explicit transformation rules (A4). No axiom, grammar, or anti-pattern violations found.

**Timing:** `resolve-now` — Can be specified independently without structural dependencies.

---

### AI-007: Signum Versioning Semantics

**Original Recommendation:** Introduce semantic versioning (semver) for signa, tracking breaking vs. non-breaking changes.

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A1 (Identity) | ⚠️ WARN | Version is a property of identity, but must not *replace* identity. A signum's identity must remain stable across versions. |
| A4 (Transformation) | ✅ PASS | Version changes are transformations. |
| A8 (Completeness) | ✅ PASS | Addresses a gap in change management semantics. |
| A9 (Consistency) | ⚠️ WARN | Semver's "breaking change" concept may not map cleanly to Codex Signum's compositional model. A "breaking" change in composition is context-dependent. |
| AP2 (Premature Optimization) | ⚠️ WARN | Importing semver wholesale from software engineering may be premature; the framework may need its own versioning semantics. |

**Status: REFRAMED**

**Reframed Text:** Introduce **compositional versioning** for signa, where version transitions are classified by their impact on the signum's compositional contracts: `compatible` (all existing compositions remain valid), `extending` (new composition points added, existing ones stable), and `restructuring` (existing composition contracts altered). Version identity is a property *of* the signum, not a replacement for its identity. The version transition type is determined by a derivation function over the morpheme-level diff, not by manual annotation.

**Rationale:** Standard semver is too coarse and carries software-engineering assumptions (AP2). Reframing in terms of compositional impact aligns with A2 (Composition) and makes version classification a computed derivation (A7) rather than a manual label. Preserving identity stability across versions satisfies A1.

**Timing:** `defer-to-refactor` — Requires identity model changes.

---

### AI-008: Cross-Reference Integrity Constraints

**Original Recommendation:** Add referential integrity checks for all cross-signum references.

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A9 (Consistency) | ✅ PASS | Referential integrity is a direct expression of consistency. |
| A8 (Completeness) | ✅ PASS | Missing integrity constraints are a completeness gap. |
| G3 (Relational Typing) | ✅ PASS | Integrity checks enforce typed relationships. |
| AP7 (Circular Derivation) | ✅ PASS | Integrity checks can detect and prevent circular references. |
| AP1-10 | ✅ PASS | No violations. |

**Status: VALIDATED**

**Rationale:** Straightforward compliance across all layers. This is a consistency and completeness improvement with no framework conflicts.

**Timing:** `resolve-now` — Can be implemented as validation rules independently.

---

### AI-009: Observation Layer — Event Emission Standardization

**Original Recommendation:** Standardize event emission from observation operations so that all observations emit a uniform event payload.

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A5 (Observation Non-Collapse) | ⚠️ WARN | Critical: event emission must not *change* the state being observed. If event emission triggers side effects (listeners that mutate state), observation collapses state—violating A5. |
| A6 (Separation) | ✅ PASS | Standardization of the event interface is a separation-of-concerns improvement. |
| AP9 (Observation Collapse) | ⚠️ WARN | Must ensure that the event mechanism is purely informational and does not feed back into state. |

**Status: REFRAMED**

**Reframed Text:** Standardize observation event emission with the explicit constraint that events are **read-only projections** of observed state. The event mechanism must be architecturally prevented from feeding back into the state layer (one-way data flow from state → observation → event). No event listener may hold a mutable reference to the observed signum. The event payload schema is a computed view (G5) of the signum's current state, not a copy of stored state.

**Rationale:** The standardization intent is sound (A6, A8), but without the non-collapse constraint, this recommendation would create an AP9 violation. The reframe adds the architectural safeguard required by A5.

**Timing:** `resolve-now` — The constraint can be specified immediately; enforcement mechanism is an implementation detail.

---

### AI-010: Consolidate Duplicate Morpheme Definitions Across Reports

**Original Recommendation:** Both review reports independently identified overlapping morpheme definitions; consolidate into a single canonical set.

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A1 (Identity) | ✅ PASS | Deduplication preserves unique identity. |
| A10 (Minimality) | ✅ PASS | Removing duplicates is a direct expression of minimality. |
| A9 (Consistency) | ✅ PASS | Eliminates potential for contradictory definitions. |
| AP10 (Redundant Specification) | ✅ PASS | Directly addresses anti-pattern row 10. |

**Status: VALIDATED**

**Rationale:** Pure compliance improvement. Deduplication is the canonical response to AP10 and supports A1, A9, and A10.

**Timing:** `resolve-now` — No structural dependencies; can be resolved by canonical selection and alias mapping.

---

### AI-011: Engineering Bridge — Add Complexity Metric Formula

**Original Recommendation:** Add a `signum_complexity` formula to the Engineering Bridge, stored as a property of each signum.

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A7 (Derivation) | ❌ FAIL | Complexity is fully derivable from composition depth, morpheme count, and relationship fan-out. Storing it violates A7. |
| G5 (Computed Views) | ❌ FAIL | Must be a computed view. |
| AP3 (Computed-as-Stored) | ❌ FAIL | Direct violation. |

**Status: REFRAMED**

**Reframed Text:** Define `signum_complexity` as a **computed view** in the Engineering Bridge: `complexity(s) = f(composition_depth(s), morpheme_count(s), relationship_fanout(s))`. The specific function `f` is defined in the Engineering Bridge specification. No stored field is created on the signum. Engineering implementations may cache the result with explicit cache-invalidation tied to composition-change events.

**Rationale:** Same pattern as AI-003. The metric is useful; the storage is the violation. Reframing to computed view resolves all three violations.

**Timing:** `resolve-now` — Documentation/definition fix.

---

### AI-012: Grammar Rule Annotation for Composition Constraints

**Original Recommendation:** Add annotation syntax to grammar rules allowing morpheme-level composition constraints (e.g., "morpheme X cannot compose with morpheme Y").

**Compliance Test Results:**

| Layer | Verdict | Detail |
|---|---|---|
| A2 (Composition) | ✅ PASS | Constraints on composition are a valid refinement of composition rules. |
| G2 (Morpheme→Signum Composition) | ✅ PASS | Composition constraints are a natural extension of G2. |
| A8 (Completeness) | ✅ PASS | Currently, incompatible compositions are undefined—this fills the gap. |
| A10 (Minimality) | ⚠️ WARN | Must ensure constraints are non-redundant (not inferable from existing rules). |

**Status: VALIDATED**

**Rationale:** Valid completeness improvement. The minimality warning is addressed by requiring that each constraint be justified as not derivable from existing rules.

**Timing:** `defer-to-refactor` — Grammar rule extensions should be part of the Codex-native refactor to ensure holistic consistency.

---

## 3. Summary Matrix

| ID | Title | Status | Timing | Primary Violations (if any) |
|---|---|---|---|---|
| AI-001 | Error Morpheme Introduction | **REFRAMED** | defer-to-refactor | A3, G4, AP1 |
| AI-002 | Axiom Ordering Rearrangement | **REJECTED** | N/A | A1, A9, AP5 |
| AI-003 | EB Formula: Composition Validity Score | **REFRAMED** | resolve-now | A7, G5, AP3 |
| AI-004 | EB Formula: State Transition Cost Matrix | **REFRAMED** | defer-to-refactor | A7 (partial), AP3 (partial) |
| AI-005 | Morpheme Namespace Flattening | **REJECTED** | N/A | A1, A2, AP4 |
| AI-006 | Morpheme Deprecation Lifecycle | **VALIDATED** | resolve-now | — |
| AI-007 | Signum Versioning Semantics | **REFRAMED** | defer-to-refactor | AP2, A9 |
| AI-008 | Cross-Reference Integrity Constraints | **VALIDATED** | resolve-now | — |
| AI-009 | Observation Event Standardization | **REFRAMED** | resolve-now | A5, AP9 |
| AI-010 | Consolidate Duplicate Morphemes | **VALIDATED** | resolve-now | — |
| AI-011 | EB Formula: Complexity Metric | **REFRAMED** | resolve-now | A7, G5, AP3 |
| AI-012 | Grammar Composition Constraint Annotations | **VALIDATED** | defer-to-refactor | — |

**Totals:** 4 validated, 6 reframed, 2 rejected.

---

## 4. Special Analysis Findings

### 4.1 Error Morpheme — Binary Collapse (t12 finding)

The original Error morpheme is the clearest compliance failure in the set. The two-state (`error`/`no-error`) encoding is a canonical instance of AP1 (Binary Collapse) and violates the framework's foundational commitment to dimensional state (A3). Error conditions in a system like Codex Signum are inherently multi-axial:

- **Severity** is a gradient, not a toggle.
- **Domain** determines response strategy.
- **Recoverability** determines lifecycle impact.

Collapsing these into a single bit destroys information that the framework's own composition and transformation rules need. The reframe to a 3-axis `Anomaly` morpheme preserves the detection intent while remaining framework-compliant.

### 4.2 Axiom Ordering (t13 finding)

This was the most consequential rejection. The axiom ordering in Codex Signum is not merely presentational—it encodes a dependency DAG. Specifically:

```
A1 (Identity) → A2 (Composition) → A3 (State) → A4 (Transformation)
                                                 → A5 (Observation)
A2 → A6 (Separation)
A3 → A7 (Derivation)
A1..A7 → A8 (Completeness) → A9 (Consistency) → A10 (Minimality)
```

The proposed reordering would place A7 before A3, which is incoherent: derivation rules operate *on* state, so state dimensionality must be defined first. This was identified in t13 as a potential instance of AP5 (Axiom Circumvention)—restructuring the axioms to retroactively justify Engineering Bridge formulas that store derived values.

### 4.3 Engineering Bridge Computed Views (t14, t15 findings)

Three recommendations (AI-003, AI-004, AI-011) proposed storing values in the Engineering Bridge that are demonstrably derivable from specification-layer state. This is a systematic pattern, not an isolated finding. The consistent reframe is:

> **Principle:** The Engineering Bridge may *define derivation functions* and may *cache results ephemerally*, but it must not *store derived values as specification-layer fields*.

This principle should be explicitly stated in the Engineering Bridge preamble during the Codex-native refactor.

---

## 5. Timing Classification Rationale

### Resolve Now (6 items: AI-003, AI-006, AI-008, AI-009, AI-010, AI-011)
These items are either:
- Pure documentation/definition fixes (AI-003, AI-011)
- Additive specifications with no structural dependencies (AI-006, AI-008)
- Constraint specifications that can be stated independently (AI-009, AI-010)

### Defer to Refactor (4 items: AI-001, AI-004, AI-007, AI-012)
These items require:
- Morpheme registry structural changes (AI-001)
- Engineering Bridge interface redesign (AI-004)
- Identity model modifications (AI-007)
- Grammar rule extension mechanism (AI-012)

Attempting these piecemeal risks inconsistency (A9). They should be addressed holistically in the Codex-native refactor.

---

## 6. Recommended JSON Structure for `src/analysis/preliminary-action-items.json`

The output file should contain an array of 12 objects, each with the following schema:

```
{
  "id": "AI-NNN",
  "title": "string",
  "status": "validated" | "reframed" | "rejected",
  "timing": "resolve-now" | "defer-to-refactor" | null,
  "original_text": "string",
  "reframed_text": "string | null",
  "rationale": "string",
  "axiom_violations": ["A1", ...],
  "grammar_violations": ["G1", ...],
  "antipattern_violations": ["AP1", ...],
  "source_tasks": ["t10", "t11", ...]
}
```

This schema ensures traceability back to the compliance matrix and source analyses while satisfying the verification criterion (`jq '.[0].status'` returns one of the three valid values).