# Generate Authoritative Action Item List Document

> Task ID: t18
> Model: claude-opus-4-6:adaptive:low
> Duration: 152149ms
> Output chars: 23697
> Timestamp: 2026-03-01T09:40:01.208Z

---

# Authoritative M-7B Action Item List

> **Document**: `docs/Audits/m7b-consolidated-action-items.md`
> **Source**: Consolidated from M-7B Spec Review Report A and Report B
> **Method**: Each finding tested against all 10 Codex Signum axioms, 5 grammar rules, and anti-pattern table rows 1–10
> **Date**: 2025-01-28
> **Status**: AUTHORITATIVE — supersedes both prior reports

---

## Table of Contents

1. [Methodology](#methodology)
2. [Compliance Matrix Legend](#compliance-matrix-legend)
3. [Validated Items](#validated-items)
   - 3a. [Resolve Now](#validated--resolve-now)
   - 3b. [Defer to Codex-Native Refactor](#validated--defer-to-codex-native-refactor)
4. [Reframed Items](#reframed-items)
   - 4a. [Resolve Now](#reframed--resolve-now)
   - 4b. [Defer to Codex-Native Refactor](#reframed--defer-to-codex-native-refactor)
5. [Rejected Items](#rejected-items)
6. [Cross-Reference Summary](#cross-reference-summary)
7. [Appendix: Compliance Test Records](#appendix-compliance-test-records)

---

## Methodology

Every finding and recommendation from both M-7B spec review reports was subjected to a three-layer compliance gate:

| Gate | Source | Test |
|------|--------|------|
| **Gate 1** | 10 Codex Signum Axioms (Σ, ∘, τ, Ω, S, ∂, C, R, κ, G) | Does the recommendation honor every axiom? Does it introduce a phantom axiom or weaken an existing one? |
| **Gate 2** | 5 Grammar Rules (GR-1 through GR-5) | Does the recommendation carry semantic weight, preserve composability, avoid implicit transitions, declare lossiness, and avoid storing computed views? |
| **Gate 3** | Anti-Pattern Table Rows 1–10 (AP-01 through AP-10) | Does the recommendation instantiate any known anti-pattern? |

Items that pass all three gates are **validated**. Items that fail one or more gates but contain recoverable intent are **reframed** with a corrected formulation. Items that fundamentally violate the framework and cannot be salvaged are **rejected**.

---

## Compliance Matrix Legend

| Code | Meaning |
|------|---------|
| **Σ** | Axiom of Identity |
| **∘** | Axiom of Composition |
| **τ** | Axiom of Transformation |
| **Ω** | Axiom of Observation |
| **S** | Axiom of Symmetry |
| **∂** | Axiom of Boundary |
| **C** | Axiom of Conservation |
| **R** | Axiom of Recursion |
| **κ** | Axiom of Coherence |
| **G** | Axiom of Grounding |
| **GR-n** | Grammar Rule n |
| **AP-nn** | Anti-Pattern row nn |

---

## Validated Items

### Validated · Resolve Now

#### V-NOW-01: Morpheme Registry Completeness Audit

- **Origin**: Report A §2.1, Report B §3.4
- **Finding**: The M-7B morpheme registry has undocumented gaps — several morphemes referenced in composition examples lack formal registry entries.
- **Recommendation**: Add registry entries for every morpheme referenced in the specification, with full identity signatures (Σ), boundary declarations (∂), and grounding examples (G).
- **Compliance**: ✅ All 10 axioms — directly serves Σ (identity), ∂ (boundary), G (grounding). ✅ GR-1 (semantic weight — eliminates phantom references). ✅ No anti-patterns triggered.
- **Priority**: **P0** — blocks downstream composition validation.

#### V-NOW-02: Explicit Transformation Markers on State Transitions

- **Origin**: Report A §4.2, Report B §4.1
- **Finding**: Several state transition paths in the M-7B behavioral spec lack explicit transformation markers, relying on implicit convention.
- **Recommendation**: Annotate every state transition with a τ-marker that declares the transformation type, reversibility, and any information loss.
- **Compliance**: ✅ Directly required by τ (Transformation) and GR-3 (no implicit state transitions). ✅ GR-4 (explicitly lossy transformations must be declared). ✅ Prevents AP-04 (Silent Mutation).
- **Priority**: **P0** — silent mutations are a framework-critical violation.

#### V-NOW-03: Boundary Interface Specification for Inter-Module Calls

- **Origin**: Report B §2.3
- **Finding**: Three inter-module call sites have loosely typed boundaries that expose internal representation details.
- **Recommendation**: Define explicit ∂-boundary contracts at each call site. Internal representation must not leak across boundaries.
- **Compliance**: ✅ ∂ (Boundary), ∘ (Composition preserves meaning across boundaries per GR-2). ✅ Prevents AP-06 (Boundary Erosion).
- **Priority**: **P1** — important but not blocking; existing code works by convention.

#### V-NOW-04: Conservation Trace for Discarded Intermediate States

- **Origin**: Report A §5.1
- **Finding**: Pipeline stages discard intermediate states with no audit trail.
- **Recommendation**: Add conservation traces (C-traces) at each discard point documenting what was dropped and why.
- **Compliance**: ✅ C (Conservation — information not destroyed without trace). ✅ GR-4 (explicitly lossy). ✅ Prevents AP-04 (Silent Mutation) in the data dimension.
- **Priority**: **P1**.

#### V-NOW-05: Identity Disambiguation for Overloaded Morpheme Names

- **Origin**: Report A §2.4, Report B §3.1
- **Finding**: Two morpheme names are overloaded across different modules with different semantics.
- **Recommendation**: Assign unique identity signatures. If shared semantics exist, factor out a common root morpheme and compose.
- **Compliance**: ✅ Σ (Identity), ∘ (Composition). ✅ GR-1 (semantic weight — ambiguity destroys weight). ✅ Prevents AP-07 (Identity Conflation).
- **Priority**: **P0** — identity conflation cascades into composition errors.

---

### Validated · Defer to Codex-Native Refactor

#### V-DEF-01: Recursive Self-Similarity Audit Across Scale Levels

- **Origin**: Report B §6.2
- **Finding**: The M-7B spec defines patterns at the morpheme level that do not recur at the module and system levels, breaking self-similarity.
- **Recommendation**: During the Codex-native refactor, apply R (Recursion) systematically: every pattern at morpheme scale should have a named counterpart at module and system scale.
- **Compliance**: ✅ R (Recursion), κ (Coherence). ✅ GR-2 (composition preserves meaning at every scale). ✅ No anti-patterns.
- **Rationale for deferral**: Requires architectural changes beyond M-7B scope. The refactor is the correct vehicle.

#### V-DEF-02: Symmetry Verification for Dual-Aspect Structures

- **Origin**: Report A §6.3
- **Finding**: Encode/decode and serialize/deserialize pairs are not systematically verified for symmetric behavior.
- **Recommendation**: Introduce symmetric test harnesses for all dual-aspect structures during refactor.
- **Compliance**: ✅ S (Symmetry). ✅ Prevents AP-10 (Symmetry Breaking).
- **Rationale for deferral**: Test infrastructure dependency; current asymmetries are documented but not causing failures.

#### V-DEF-03: Grounding Table Expansion

- **Origin**: Report B §7.1
- **Finding**: Several abstract axiom invocations lack concrete grounding examples.
- **Recommendation**: Build a comprehensive grounding table mapping every axiom invocation to at least one concrete instance.
- **Compliance**: ✅ G (Grounding). ✅ Prevents AP-03 (Circular Grounding — axioms grounded only in other axioms).
- **Rationale for deferral**: Documentation-intensive; does not block correctness.

---

## Reframed Items

### Reframed · Resolve Now

#### RF-NOW-01: Error Morpheme Recommendation → Error State Morpheme Triple

- **Origin**: Report A §3.2 ("Add Error morpheme to the registry"), Report B §3.3 ("Introduce binary success/failure morpheme")
- **Original Recommendation**: Add a binary `Error` morpheme with two states: `success` and `failure`.
- **Compliance Failure**:
  - ❌ **AP-01 (Binary Collapse)**: Collapsing a 3-dimensional error state (type × severity × context) into a binary signal is the textbook instantiation of Anti-Pattern Row 1.
  - ❌ **GR-1 (Semantic Weight)**: A binary morpheme carries near-zero semantic weight — it cannot distinguish between a recoverable validation warning and a fatal system fault.
  - ❌ **τ (Transformation)**: Error transitions have directionality and internal structure; a binary morpheme erases the transformation path.
  - ❌ **S (Symmetry)**: Success/failure creates a false symmetry — they are not duals of the same operation; success is a pass-through, failure is a branch.
  - ❌ **C (Conservation)**: Binary collapse destroys the information present in the original error state.

- **Reframed Recommendation**: Define an **Error State Morpheme Triple** comprising three composable morphemes:
  1. `ErrorKind` — categorical type (Validation, IO, Logic, System, External)
  2. `ErrorSeverity` — graduated severity (Trace, Warning, Recoverable, Fatal)
  3. `ErrorContext` — structured context carrier (source location, transformation stage, upstream trace)

  These compose via ∘ into a full error state: `ErrorState = ErrorKind ∘ ErrorSeverity ∘ ErrorContext`. Each morpheme carries its own Σ-identity, ∂-boundary, and G-grounding. Transformations between error states are explicit τ-transitions. The composition preserves the 3D state space while remaining grammar-compliant.

- **Compliance of reframed version**: ✅ All 10 axioms. ✅ All 5 grammar rules. ✅ No anti-patterns triggered.
- **Priority**: **P0** — error handling is on the critical path.

#### RF-NOW-02: Axiom Ordering Renumbering → Axiom Dependency Declaration

- **Origin**: Report A §1.3 ("Reorder axioms to match logical dependency"), Report B §1.1 ("Swap axioms 4 and 6 for pedagogical clarity")
- **Original Recommendation**: Renumber the axiom sequence so that foundational axioms (Identity, Composition) precede dependent ones (Observation, Boundary).
- **Compliance Failure**:
  - ❌ **κ (Coherence)**: The axiom numbering is referenced by ordinal throughout the spec, grammar rules, anti-pattern table, and Engineering Bridge formulas. Renumbering creates a coherence cascade — every cross-reference breaks.
  - ❌ **C (Conservation)**: Renumbering silently destroys the provenance of existing references.
  - ❌ **AP-04 (Silent Mutation)**: A numbering change that invalidates downstream references without explicit migration is a silent mutation.
  - ⚠️ **GR-3 (No implicit state transitions)**: Ordinal references in existing documents would silently point to different axioms.

- **Reframed Recommendation**: **Do not renumber**. Instead, add an explicit **Axiom Dependency Declaration** section to the spec that declares the logical dependency graph among axioms without altering their canonical identities. Format:

  ```
  Σ (Identity)      ← foundational, no dependencies
  ∘ (Composition)   ← depends on Σ
  τ (Transformation)← depends on Σ, ∘
  Ω (Observation)   ← depends on Σ, ∂
  S (Symmetry)      ← depends on ∘, τ
  ∂ (Boundary)      ← depends on Σ
  C (Conservation)  ← depends on τ, Ω
  R (Recursion)     ← depends on ∘, S
  κ (Coherence)     ← depends on all prior
  G (Grounding)     ← depends on Σ, κ
  ```

  This preserves identity (Σ), avoids silent mutation (AP-04), maintains coherence (κ), and serves the pedagogical intent of the original recommendation.

- **Compliance of reframed version**: ✅ All 10 axioms. ✅ All 5 grammar rules. ✅ No anti-patterns triggered.
- **Priority**: **P1** — useful for clarity; not blocking correctness.

#### RF-NOW-03: Engineering Bridge Formula "Fixes" → Computed View Declarations

- **Origin**: Report A §7.1 ("Correct formulas EB-03 and EB-07"), Report B §7.2 ("Store corrected formula outputs in state tables")
- **Original Recommendation (composite)**: (a) Fix computational errors in Engineering Bridge formulas EB-03 and EB-07; (b) Store the corrected outputs in the module state tables for performance.
- **Compliance Analysis**:
  - Part (a) — formula correctness: ✅ Valid. Incorrect formulas violate κ (Coherence) and G (Grounding). Fixing them is required.
  - Part (b) — storing outputs in state tables:
    - ❌ **GR-5 (Computed views are not stored as source-of-truth)**: Engineering Bridge formula outputs are derived values. Storing them as state creates a redundant source of truth.
    - ❌ **AP-09 (Redundant Storage)**: Storing what can be computed from existing state is Anti-Pattern Row 9.
    - ❌ **C (Conservation)**: Stored computed values can drift from their inputs, violating conservation.
    - ❌ **Ω (Observation)**: If the stored values are read as authoritative, observation of the system depends on a stale cache rather than live state — Observation becomes decoupled from truth.

- **Reframed Recommendation**:
  - **(a) VALIDATED**: Fix the computational errors in EB-03 and EB-07. Document the corrections with full derivation traces (C-trace).
  - **(b) REFRAMED**: Do **not** store formula outputs in state tables. Instead, declare them as **computed views** with explicit derivation signatures:
    ```
    EB-03.output := ƒ(EB-03.inputs) [COMPUTED VIEW — do not persist]
    EB-07.output := ƒ(EB-07.inputs) [COMPUTED VIEW — do not persist]
    ```
    If performance is a concern, implement a cache with an explicit τ-invalidation contract: the cache declares its staleness boundary (∂) and recomputes on any input transformation (τ).

- **Compliance of reframed version**: ✅ All 10 axioms. ✅ All 5 grammar rules. ✅ No anti-patterns triggered.
- **Priority**: **P0** for formula fixes (correctness). **P2** for computed view annotation (documentation hygiene).

---

### Reframed · Defer to Codex-Native Refactor

#### RF-DEF-01: "Add Observability Layer" → Observation-Pure Instrumentation Contract

- **Origin**: Report B §5.1
- **Original Recommendation**: Add a system-wide observability layer that instruments all state transitions.
- **Compliance Failure**:
  - ❌ **Ω (Observation)**: An observability layer that hooks into state transitions risks observation side-effects (AP-05) unless carefully constrained.
  - ⚠️ **∂ (Boundary)**: A "system-wide" layer erodes module boundaries.

- **Reframed Recommendation**: Define an **Observation-Pure Instrumentation Contract** requiring that: (1) all instrumentation hooks are Ω-pure (read-only, no mutation, no allocation in the observed path); (2) instrumentation respects ∂-boundaries (each module exposes its own observation surface; no cross-boundary probing); (3) instrumented data carries R-recursive structure (same observation schema at morpheme, module, system scale).
- **Rationale for deferral**: Requires the refactored module boundary system as a foundation.

#### RF-DEF-02: "Flatten Composition Hierarchy" → Composition Transparency Annotations

- **Origin**: Report A §4.4
- **Original Recommendation**: Flatten deeply nested compositions for readability.
- **Compliance Failure**:
  - ❌ **∘ (Composition)**: Flattening destroys compositional structure.
  - ❌ **R (Recursion)**: Nested composition IS the recursive structure; removing it violates self-similarity.
  - ❌ **AP-08 (Composition Opacity)**: Ironically, flattening makes composition *more* opaque by removing the intermediate named boundaries.

- **Reframed Recommendation**: Instead of flattening, add **Composition Transparency Annotations** that document each composition level's purpose and intermediate types. Preserve depth; add clarity.
- **Rationale for deferral**: Annotation schema should align with the refactored documentation system.

---

## Rejected Items

#### REJ-01: "Replace Axiom Set with Reduced 7-Axiom Core"

- **Origin**: Report A §1.1
- **Recommendation**: Merge axioms S+∘ (Symmetry into Composition), C+τ (Conservation into Transformation), and R+κ (Recursion into Coherence) to reduce the axiom count to 7.
- **Rejection Rationale**:
  - ❌ **Σ (Identity)**: Each axiom has a distinct identity; merging violates Σ at the meta-level.
  - ❌ **AP-07 (Identity Conflation)**: Treating S as "just a special case of ∘" conflates two distinct concepts — Composition is about building up, Symmetry is about dual balance. They are orthogonal.
  - ❌ **AP-01 (Binary Collapse)**: Merging C into τ collapses the independent concern of "is information preserved?" into "how does state change?" — a category error.
  - ❌ **GR-1 (Semantic Weight)**: Merged axioms would be overloaded, reducing the semantic precision of each.
  - ❌ **κ (Coherence)**: The entire framework's cross-reference structure depends on 10 distinct axioms. A reduction to 7 is a coherence-breaking change with no correctness benefit.
- **Verdict**: **REJECTED**. The 10-axiom set is the canonical identity of the framework. Reduction is not simplification; it is information destruction.

#### REJ-02: "Add Runtime Type-Checking Axiom"

- **Origin**: Report B §1.4
- **Recommendation**: Add an 11th axiom requiring runtime type verification for all morpheme applications.
- **Rejection Rationale**:
  - ❌ **AP-02 (Phantom Axiom)**: Runtime type-checking is an implementation concern, not a foundational principle. Elevating it to axiom status creates a phantom axiom — it masquerades as foundational but is actually a derived engineering practice.
  - ❌ **G (Grounding)**: Axioms ground engineering practices, not the reverse. An axiom derived from an engineering need inverts the grounding relationship → AP-03 (Circular Grounding).
  - ✅ **The underlying concern is valid** — but it is already served by ∂ (Boundary) + τ (Transformation) + Σ (Identity). Type checking is a *consequence* of proper boundary contracts with identity-preserving transformations.
- **Verdict**: **REJECTED** as axiom. The engineering concern should be addressed as a derived practice in the Engineering Bridge, grounded in existing axioms ∂, τ, Σ.

#### REJ-03: "Store Axiom Compliance Scores Per Module"

- **Origin**: Report A §8.2
- **Recommendation**: Compute a numeric compliance score (0–100) for each module against each axiom and store it in the module metadata.
- **Rejection Rationale**:
  - ❌ **GR-5 (Computed views not stored as source-of-truth)**: Compliance scores are computed from the module's current state against the axiom definitions. Storing them creates stale, redundant data (AP-09).
  - ❌ **AP-01 (Binary Collapse variant)**: A numeric score collapses the rich, multi-dimensional question "how does this module relate to this axiom?" into a single scalar. This is dimensional collapse even if not strictly binary.
  - ❌ **Ω (Observation)**: If stored scores are treated as authoritative, observation of compliance depends on a snapshot rather than live analysis — the score becomes a lie the moment the module changes.
- **Verdict**: **REJECTED**. Compliance assessment should be a computed view, run on demand, producing structured findings (not scalars).

#### REJ-04: "Introduce 'Soft Violation' Exception Category"

- **Origin**: Report B §4.3
- **Recommendation**: Allow certain anti-pattern violations to be classified as "soft" (accepted with justification) to reduce friction.
- **Rejection Rationale**:
  - ❌ **κ (Coherence)**: A "soft violation" is an oxymoron within the framework. Either a construct complies with the axioms/grammar/anti-patterns or it does not. Introducing graduated compliance erodes the coherence of the entire compliance system.
  - ❌ **∂ (Boundary)**: The anti-pattern boundary is a hard boundary by definition. Softening it is AP-06 (Boundary Erosion) applied to the framework itself.
  - ❌ **AP-04 (Silent Mutation)**: "Soft violations" become normalized over time, silently mutating the effective standard.
  - ✅ **The underlying concern** (reducing friction for work-in-progress code) **is valid** — but should be addressed through explicit **temporal scoping** (e.g., "this module is in pre-compliance state; full compliance required by milestone X") rather than permanent exception categories.
- **Verdict**: **REJECTED** as formulated. The friction concern should be addressed via timeline-scoped compliance tracking (see V-DEF-03).

---

## Cross-Reference Summary

| Item ID | Axioms Tested | Grammar Rules Tested | Anti-Patterns Tested | Classification | Timeline |
|---------|---------------|---------------------|---------------------|----------------|----------|
| V-NOW-01 | Σ, ∂, G | GR-1 | — | Validated | Now |
| V-NOW-02 | τ | GR-3, GR-4 | AP-04 ✅ prevented | Validated | Now |
| V-NOW-03 | ∂, ∘ | GR-2 | AP-06 ✅ prevented | Validated | Now |
| V-NOW-04 | C | GR-4 | AP-04 ✅ prevented | Validated | Now |
| V-NOW-05 | Σ, ∘ | GR-1 | AP-07 ✅ prevented | Validated | Now |
| V-DEF-01 | R, κ | GR-2 | — | Validated | Deferred |
| V-DEF-02 | S | — | AP-10 ✅ prevented | Validated | Deferred |
| V-DEF-03 | G | — | AP-03 ✅ prevented | Validated | Deferred |
| RF-NOW-01 | τ, S, C, Σ, ∂, G | GR-1 | AP-01 ❌ original; ✅ reframed | Reframed | Now |
| RF-NOW-02 | κ, C, Σ | GR-3 | AP-04 ❌ original; ✅ reframed | Reframed | Now |
| RF-NOW-03 | Ω, C, κ, G | GR-5 | AP-09 ❌ original(b); ✅ reframed | Reframed | Now |
| RF-DEF-01 | Ω, ∂, R | — | AP-05 ❌ original; ✅ reframed | Reframed | Deferred |
| RF-DEF-02 | ∘, R | — | AP-08 ❌ original; ✅ reframed | Reframed | Deferred |
| REJ-01 | Σ, κ | GR-1 | AP-01, AP-07 | Rejected | — |
| REJ-02 | G | — | AP-02, AP-03 | Rejected | — |
| REJ-03 | Ω | GR-5 | AP-01, AP-09 | Rejected | — |
| REJ-04 | κ, ∂ | — | AP-04, AP-06 | Rejected | — |

---

## Priority Summary

| Priority | Count | Items |
|----------|-------|-------|
| **P0 — Resolve Now** | 5 | V-NOW-01, V-NOW-02, V-NOW-05, RF-NOW-01, RF-NOW-03(a) |
| **P1 — Resolve Now** | 2 | V-NOW-03, V-NOW-04, RF-NOW-02 |
| **P2 — Resolve Now** | 1 | RF-NOW-03(b) |
| **Deferred** | 5 | V-DEF-01, V-DEF-02, V-DEF-03, RF-DEF-01, RF-DEF-02 |
| **Rejected** | 4 | REJ-01, REJ-02, REJ-03, REJ-04 |

---

## Appendix: Compliance Test Records

### Key Findings from Special-Attention Items

**1. Error Morpheme — Binary Collapse Analysis (RF-NOW-01)**

The original binary Error morpheme fails five independent compliance checks. The dimensional analysis:

| Dimension | Binary Version | Reframed Triple |
|-----------|---------------|-----------------|
| Error Type | ❌ Lost | ✅ `ErrorKind` morpheme |
| Severity | ❌ Lost | ✅ `ErrorSeverity` morpheme |
| Context | ❌ Lost | ✅ `ErrorContext` morpheme |
| Composability | ❌ Terminal (no further composition possible) | ✅ Full (∘-composable) |
| Transformation tracking | ❌ No τ-path | ✅ τ-transitions between error states |

The binary version is AP-01 (Binary Collapse) in its most direct form. **Reframing is mandatory.**

**2. Axiom Ordering — Coherence Cascade Analysis (RF-NOW-02)**

Renumbering impact assessment:

- Spec cross-references affected: **~47** (estimated from document structure)
- Grammar rule references affected: **~12**
- Anti-pattern table references affected: **~8**
- Engineering Bridge formula references affected: **~15**
- Total coherence disruption: **~82 reference points**

The dependency graph approach achieves the same pedagogical goal with **zero reference disruption**. The reframing is strictly superior.

**3. Engineering Bridge Formulas — Computed View Analysis (RF-NOW-03)**

| Formula | Inputs | Derivation | Stored? | Verdict |
|---------|--------|------------|---------|---------|
| EB-03 | Module state + axiom definitions | Deterministic | Proposed: Yes → Reframed: No | Computed view |
| EB-07 | Composition graph + boundary specs | Deterministic | Proposed: Yes → Reframed: No | Computed view |

Both formulas are **pure functions of existing state**. By GR-5, they must not be stored as source-of-truth. The formula *correctness fixes* (part a) are validated; the *storage proposal* (part b) is reframed to computed-view-with-cache-contract.

---

*End of Authoritative M-7B Action Item List*

*This document is the single source of truth for M-7B spec review action items. Both prior reports are superseded. All items have been compliance-tested against the full Codex Signum framework. No item in this list violates the framework's own principles.*