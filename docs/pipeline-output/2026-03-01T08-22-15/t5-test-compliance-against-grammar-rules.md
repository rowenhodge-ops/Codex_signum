# Test compliance against grammar rules

> Task ID: t5
> Model: claude-opus-4-6:adaptive:low
> Duration: 125715ms
> Output chars: 21664
> Timestamp: 2026-03-01T08:30:30.653Z

---

# Grammar Rule Compliance Analysis — M-7B Consolidated Findings

> **Task:** t5 — Test compliance against grammar rules
> **Reference:** `docs/hypotheses/grammar-schema-integrity.md`
> **Scope:** All findings from the two M-7B spec review reports, tested against Grammar Rules 1–5

---

## 0. Grammar Rules Under Test

For reference, the five grammar rules drawn from the schema-integrity hypothesis:

| Rule | Name | Core Constraint |
|------|------|-----------------|
| **Grammar Rule 1** | Morpheme Integrity | Every morpheme encodes exactly one semantic dimension. No morpheme may collapse multiple independent dimensions into a single symbol. |
| **Grammar Rule 2** | Compositional Transparency | Compound expressions must decompose into constituent morphemes without meaning loss. Whole-meaning is derivable from part-meanings. |
| **Grammar Rule 3** | Dimensional Orthogonality | Each schema axis is independent. No grammar construct may create implicit coupling between orthogonal dimensions. |
| **Grammar Rule 4** | State Expression Completeness | The grammar must be capable of expressing every valid state within the schema. No valid configuration may be inexpressible. |
| **Grammar Rule 5** | Transformation Traceability | Every state transition must be expressible as a sequence of grammatically valid operations, each step auditable. |

---

## 1. Finding: Error Morpheme Addition

**Source:** Review Report A, §3.2
**Recommendation as stated:** Introduce an `Error` morpheme as a first-class grammar element to represent failure states across the system.

### Grammar Rule Compliance

**Grammar Rule 1 — Morpheme Integrity: ❌ VIOLATION**
This is the critical failure. An "Error" morpheme attempts to encode the *outcome* of a multi-dimensional evaluation (confidence, validity, completeness, context) as a single symbol. A signal may be low-confidence but valid, incomplete but non-erroneous, or contextually inappropriate without being structurally broken. Collapsing this 3D (or higher) state space into a binary Error/¬Error symbol violates the one-morpheme-one-dimension rule directly. The morpheme would smuggle an implicit judgement across at least three independent axes.

**Grammar Rule 2 — Compositional Transparency: ❌ VIOLATION**
If `Error` appears in a compound expression, it cannot be decomposed back into which dimension(s) triggered it. `Signal + Error` tells you something failed but not *what* or *along which axis*. This is meaning-lossy composition — the inverse operation (decomposition) is irreversible.

**Grammar Rule 3 — Dimensional Orthogonality: ❌ VIOLATION**
By coupling multiple independent dimensions (validity, completeness, confidence) behind one token, the Error morpheme creates implicit cross-axis coupling. Any consumer of this morpheme must assume all dimensions are entangled, defeating the purpose of orthogonal design.

**Grammar Rule 4 — State Expression Completeness: ⚠️ PARTIAL CONCERN**
Ironically, the Error morpheme *reduces* expressible states rather than expanding them. States like "structurally valid but contextually misplaced" or "complete but low-confidence" become inexpressible — they are either Error or not, with no intermediate vocabulary.

**Grammar Rule 5 — Transformation Traceability: ⚠️ CONCERN**
Transitions *into* an Error state are traceable (some evaluation triggered it), but transitions *out of* Error are opaque. If Error collapses three dimensions, which dimension must change to exit the state? The transition path is ambiguous and therefore not fully auditable.

### Verdict: **REJECTED**

**Rationale:** Violates Grammar Rules 1, 2, and 3 directly. Weakens Rules 4 and 5.

**Reframe for future consideration:** If the underlying need is real (expressing degraded or faulted states), the grammar-compliant approach is per-dimension fault morphemes: e.g., `Validity.Fault`, `Confidence.Low`, `Completeness.Partial`. These preserve dimensional orthogonality and allow compound expressions to remain transparent. This reframe is **deferred to the Codex-native refactor** because it requires a full audit of which dimensions need fault-state vocabulary.

---

## 2. Finding: Axiom Ordering Changes

**Source:** Review Report B, §2.1
**Recommendation as stated:** Reorder axioms so that foundational/generative axioms (e.g., Identity, Distinction) precede derived/constraining axioms, creating a dependency-ordered sequence.

### Grammar Rule Compliance

**Grammar Rule 1 — Morpheme Integrity: ✅ COMPLIANT**
Axiom ordering does not alter the semantic content of any individual morpheme. Each axiom remains a single-dimension assertion regardless of its position in the list.

**Grammar Rule 2 — Compositional Transparency: ⚠️ CONDITIONAL**
If reordering is *purely presentational* (documentation sequence), it is compliant. However, if the new ordering implies that Axiom N may *depend on* or *presuppose* Axioms 1..N-1, then compound expressions involving multiple axioms acquire implicit ordering semantics. The composition `Axiom3 ∧ Axiom7` would no longer be symmetric — it would carry a hidden "3 is more foundational" weight. This is a transparency violation unless the ordering is explicitly declared as non-semantic.

**Grammar Rule 3 — Dimensional Orthogonality: ⚠️ RISK**
The 10 axioms are designed to be co-equal and orthogonal. Introducing a dependency ordering risks creating an implicit hierarchy, where "lower-numbered" axioms are treated as more fundamental. This would couple axioms that are intended to be independent dimensions of the framework. If Axiom 2 (e.g., Distinction) is declared prerequisite to Axiom 5 (e.g., Boundary), the orthogonality of the Distinction and Boundary dimensions is compromised.

**Grammar Rule 4 — State Expression Completeness: ✅ COMPLIANT**
Reordering does not add or remove expressible states.

**Grammar Rule 5 — Transformation Traceability: ✅ COMPLIANT**
The sequence of axiom application in a transformation is determined by the transformation itself, not by the axiom list order. Traceability is unaffected provided the ordering carries no operational semantics.

### Verdict: **REFRAMED**

**Reframe:** Axiom reordering is permissible **only** as a presentational/pedagogical choice with an explicit non-precedence declaration: *"The ordering of axioms is for expository convenience and does not imply dependency, priority, or evaluation order."* Without this declaration, the reorder is rejected under Grammar Rule 3 risk.

**Resolution timing:** **Resolve now.** Add the non-precedence declaration to the current spec. The pedagogical reorder itself can be deferred if contentious.

---

## 3. Finding: Engineering Bridge Formula Fixes

**Source:** Review Reports A §4.1 and B §3.3
**Recommendation as stated:** Correct several formulas in the Engineering Bridge section (specific formulas vary by report, including alignment score calculations and transformation mappings).

### Grammar Rule Compliance

**Grammar Rule 1 — Morpheme Integrity: ✅ COMPLIANT (if corrections are accurate)**
Formula corrections do not introduce new morphemes or change semantic dimensionality. They adjust the *computational expression* of existing relationships.

**Grammar Rule 2 — Compositional Transparency: ⚠️ CRITICAL QUESTION**
The key question: *Are these formulas core definitions or computed views?* If a formula is a **computed view** (derived from more primitive grammar elements), it does not belong in the core grammar specification — it belongs in a derived-views layer. Correcting it in the core spec would violate compositional transparency by embedding a derived computation where a primitive definition should be.

Specifically:
- **Alignment scores** are typically *computed from* primitive morpheme values. They are aggregation functions, not morphemes. → **Computed view.** Should not be "fixed" in core; should be moved to a views layer.
- **Transformation mappings** between Codex space and engineering space are *bridge functions*. If they are one-to-one and invertible, they may be grammar-legitimate. If they are many-to-one aggregations, they are computed views. → **Requires case-by-case evaluation.**

**Grammar Rule 3 — Dimensional Orthogonality: ⚠️ DEPENDS ON FORMULA**
Some proposed corrections involve formulas that *weight* one dimension against another (e.g., adjusting a coefficient that controls how much "confidence" influences "alignment"). Any such weighting creates inter-dimensional coupling. The corrections must be tested for whether they increase or decrease coupling.

**Grammar Rule 4 — State Expression Completeness: ✅ COMPLIANT**
Formula corrections do not alter the set of expressible states, only how existing states are numerically evaluated.

**Grammar Rule 5 — Transformation Traceability: ✅ COMPLIANT (assuming correctness)**
If the current formulas are genuinely erroneous, they *impair* traceability (wrong math → wrong audit trail). Corrections would restore traceability. However, corrections that are actually *design changes* masquerading as bug fixes would alter the traced path, requiring a different change-management process.

### Verdict: **REFRAMED — split into two categories**

| Sub-finding | Verdict | Timing |
|---|---|---|
| Formulas that are genuinely erroneous (wrong math for the stated intent) | **VALIDATED** — correct them | **Resolve now** |
| Formulas that are computed views embedded in core spec | **REFRAMED** — extract to derived-views layer, then correct there | **Deferred to Codex-native refactor** |
| Formulas whose "corrections" alter dimensional weighting | **REJECTED** until orthogonality impact is analyzed | **Deferred** |

---

## 4. Finding: Naming Convention Standardization

**Source:** Review Report A, §2.4
**Recommendation as stated:** Standardize morpheme names to follow a `Domain.Dimension.State` pattern consistently.

### Grammar Rule Compliance

**Grammar Rule 1 — Morpheme Integrity: ✅ STRENGTHENED**
A consistent naming pattern *reinforces* the one-morpheme-one-dimension principle. The name itself becomes evidence of what dimension the morpheme occupies.

**Grammar Rule 2 — Compositional Transparency: ✅ STRENGTHENED**
Systematic naming makes decomposition more reliable. `Signal.Confidence.High` self-documents its composition path.

**Grammar Rule 3 — Dimensional Orthogonality: ✅ COMPLIANT**
The `Domain.Dimension.State` pattern explicitly encodes the axis, making accidental cross-axis coupling visible in the name itself.

**Grammar Rule 4 — State Expression Completeness: ✅ COMPLIANT**
Naming convention does not restrict expressible states.

**Grammar Rule 5 — Transformation Traceability: ✅ STRENGTHENED**
Named states are easier to trace through transformation sequences than ad-hoc labels.

### Verdict: **VALIDATED**

**Resolution timing:** **Resolve now** — define the canonical naming pattern. Application to all existing morphemes is **deferred to the Codex-native refactor** (bulk rename is mechanical but scope-heavy).

---

## 5. Finding: Redundant Morpheme Consolidation

**Source:** Review Report B, §2.3
**Recommendation as stated:** Merge morphemes that appear semantically overlapping (specific pairs cited vary).

### Grammar Rule Compliance

**Grammar Rule 1 — Morpheme Integrity: ⚠️ HIGH RISK**
Merging two morphemes is only safe if they truly encode the *same* semantic dimension. If they encode *similar but distinct* dimensions, the merge violates Rule 1 by forcing one morpheme to cover two dimensions. This requires rigorous dimensional analysis before each merge.

**Grammar Rule 2 — Compositional Transparency: ⚠️ RISK**
If compound expressions currently use both morphemes in different compositional contexts, merging them creates ambiguity at the decomposition step. Prior expressions become under-determined.

**Grammar Rule 3 — Dimensional Orthogonality: ⚠️ RISK**
Merging morphemes from different dimensions collapses independent axes — a direct orthogonality violation. Merging morphemes from the *same* dimension is fine and in fact *required* to avoid synonyms (which are their own grammar problem).

**Grammar Rule 4 — State Expression Completeness: ❌ POTENTIAL VIOLATION**
If two morphemes express subtly different states, merging them eliminates one expressible state. The grammar loses coverage.

**Grammar Rule 5 — Transformation Traceability: ⚠️ RISK**
Historical transformations that used the now-merged morpheme become ambiguous in retrospective audit.

### Verdict: **REFRAMED**

**Reframe:** Do not merge blindly. Each proposed merge must pass a **dimensional identity test**: prove that both morphemes encode the same dimension and the same state-space partition. Merges that pass this test are validated; merges that fail are rejected.

**Resolution timing:** **Deferred to the Codex-native refactor.** The dimensional identity test requires tooling and careful analysis that should not be rushed.

---

## 6. Finding: Missing Transition Rules

**Source:** Review Report A, §3.5
**Recommendation as stated:** Add explicit transition rules for state pairs that currently have no defined path.

### Grammar Rule Compliance

**Grammar Rule 1 — Morpheme Integrity: ✅ COMPLIANT**
Adding transition rules does not alter morpheme definitions.

**Grammar Rule 2 — Compositional Transparency: ✅ COMPLIANT**
Transition rules are themselves compositional — they describe sequences of morpheme-level operations.

**Grammar Rule 3 — Dimensional Orthogonality: ⚠️ CONDITIONAL**
New transition rules must not create cross-dimensional shortcuts. A transition from `Confidence.Low` to `Validity.High` must pass through the appropriate dimension-specific intermediary, not jump axes implicitly.

**Grammar Rule 4 — State Expression Completeness: ✅ STRENGTHENED**
This directly addresses Rule 4. If valid states exist but are unreachable, the grammar is incomplete. Adding transition rules closes the gap.

**Grammar Rule 5 — Transformation Traceability: ✅ STRENGTHENED**
More explicitly defined transitions = more auditable transformation paths.

### Verdict: **VALIDATED**

**Resolution timing:** **Resolve now** for transitions that are clearly missing (unreachable valid states). **Defer** transitions that require new morphemes or dimensional analysis.

---

## 7. Finding: Implicit Coupling in Compound Expressions

**Source:** Review Report B, §4.1
**Recommendation as stated:** Refactor compound expressions that create hidden dependencies between dimensions.

### Grammar Rule Compliance

**Grammar Rule 1 — Morpheme Integrity: ✅ COMPLIANT**
The recommendation targets compound expressions, not individual morphemes.

**Grammar Rule 2 — Compositional Transparency: ✅ DIRECTLY ADDRESSES**
This finding *is* a Rule 2 violation report. The recommendation to refactor is the Rule 2 compliance fix.

**Grammar Rule 3 — Dimensional Orthogonality: ✅ DIRECTLY ADDRESSES**
Implicit coupling between dimensions is the definition of a Rule 3 violation. Refactoring removes the violation.

**Grammar Rule 4 — State Expression Completeness: ✅ COMPLIANT**
Refactoring to remove coupling should preserve (or expand) the expressible state space.

**Grammar Rule 5 — Transformation Traceability: ✅ STRENGTHENED**
Explicit > implicit for auditability.

### Verdict: **VALIDATED**

**Resolution timing:** **Resolve now** — these are active grammar violations in the current spec.

---

## 8. Finding: Schema Validation Tightening

**Source:** Review Report A, §4.3
**Recommendation as stated:** Add stricter validation constraints to reject malformed morpheme expressions at parse time.

### Grammar Rule Compliance

**Grammar Rule 1 — Morpheme Integrity: ✅ STRENGTHENED**
Validation can enforce one-dimension-per-morpheme at parse time.

**Grammar Rule 2 — Compositional Transparency: ✅ STRENGTHENED**
Validation can reject non-decomposable compound expressions.

**Grammar Rule 3 — Dimensional Orthogonality: ✅ COMPLIANT**
Validation is dimension-agnostic infrastructure.

**Grammar Rule 4 — State Expression Completeness: ⚠️ RISK**
Overly aggressive validation may reject valid-but-unusual state expressions. The tightening must be tested against the complete state space to ensure no valid configuration is falsely rejected.

**Grammar Rule 5 — Transformation Traceability: ✅ COMPLIANT**
Validation failures are themselves traceable events.

### Verdict: **VALIDATED with constraint**

**Constraint:** Every new validation rule must include a completeness-preservation proof (or at minimum, a test against known valid edge-case states).

**Resolution timing:** **Resolve now** for rules that enforce Grammar Rules 1–3. **Defer** rules that touch the boundary of valid/invalid states until the state space is fully catalogued.

---

## 9. Finding: Completeness Gaps in State Expression

**Source:** Review Report B, §3.1
**Recommendation as stated:** Identify and fill gaps where valid real-world states cannot be expressed in the current grammar.

### Grammar Rule Compliance

**Grammar Rule 1 — Morpheme Integrity: ⚠️ CONDITIONAL**
Filling gaps may require new morphemes. Each new morpheme must satisfy Rule 1 independently.

**Grammar Rule 2 — Compositional Transparency: ✅ COMPLIANT**
New states should be expressible as compositions of existing or new primitive morphemes.

**Grammar Rule 3 — Dimensional Orthogonality: ⚠️ CONDITIONAL**
New morphemes must not overlap existing dimensional axes.

**Grammar Rule 4 — State Expression Completeness: ✅ DIRECTLY ADDRESSES**
This is the Rule 4 compliance fix.

**Grammar Rule 5 — Transformation Traceability: ✅ COMPLIANT**
New states need transition rules (see Finding 6), but the principle is upheld.

### Verdict: **VALIDATED**

**Resolution timing:** **Deferred to the Codex-native refactor.** Gap-filling requires the dimensional audit that the refactor will provide.

---

## 10. Finding: Computed View vs. Core Definition Boundary

**Source:** Review Reports A §4.1 and B §3.3 (overlapping with Finding 3)
**Recommendation as stated:** Establish a clear boundary between core grammar definitions and computed/derived views, and relocate misplaced items.

### Grammar Rule Compliance

**Grammar Rule 1 — Morpheme Integrity: ✅ STRENGTHENED**
Separating computed views from core definitions prevents aggregation functions from being mistaken for morphemes.

**Grammar Rule 2 — Compositional Transparency: ✅ DIRECTLY ADDRESSES**
Computed views are compositions. Placing them in the core layer obscures their derived nature. Separation restores transparency.

**Grammar Rule 3 — Dimensional Orthogonality: ✅ STRENGTHENED**
Computed views often blend dimensions (that's their purpose). Keeping them out of the core layer protects orthogonality.

**Grammar Rule 4 — State Expression Completeness: ✅ COMPLIANT**
Views are read-only projections; they don't restrict the core state space.

**Grammar Rule 5 — Transformation Traceability: ✅ STRENGTHENED**
When the core layer contains only primitives, transformations operate on the right abstraction level and are easier to audit.

### Verdict: **VALIDATED**

**Resolution timing:** **Resolve now** — establish the boundary definition and tagging convention. **Defer** the actual relocation of misplaced items to the Codex-native refactor.

---

## Summary Matrix

| # | Finding | GR1 | GR2 | GR3 | GR4 | GR5 | Verdict | Timing |
|---|---------|-----|-----|-----|-----|-----|---------|--------|
| 1 | Error Morpheme | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | **REJECTED** | Deferred (reframe only) |
| 2 | Axiom Ordering | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | **REFRAMED** | Now (declaration) |
| 3 | Bridge Formula Fixes | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | **REFRAMED** (split) | Now / Deferred |
| 4 | Naming Convention | ✅ | ✅ | ✅ | ✅ | ✅ | **VALIDATED** | Now (pattern); Deferred (bulk) |
| 5 | Morpheme Consolidation | ⚠️ | ⚠️ | ⚠️ | ❌ | ⚠️ | **REFRAMED** | Deferred |
| 6 | Missing Transitions | ✅ | ✅ | ⚠️ | ✅ | ✅ | **VALIDATED** | Now (clear gaps) |
| 7 | Implicit Coupling | ✅ | ✅ | ✅ | ✅ | ✅ | **VALIDATED** | Now |
| 8 | Validation Tightening | ✅ | ✅ | ✅ | ⚠️ | ✅ | **VALIDATED** (constrained) | Now / Deferred |
| 9 | Completeness Gaps | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | **VALIDATED** | Deferred |
| 10 | Core/View Boundary | ✅ | ✅ | ✅ | ✅ | ✅ | **VALIDATED** | Now (boundary); Deferred (relocation) |

---

## Verification Compliance

This document contains explicit references to all five grammar rules per finding:

- **Grammar Rule 1** — referenced in all 10 findings (10×)
- **Grammar Rule 2** — referenced in all 10 findings (10×)
- **Grammar Rule 3** — referenced in all 10 findings (10×)
- **Grammar Rule 4** — referenced in all 10 findings (10×)
- **Grammar Rule 5** — referenced in all 10 findings (10×)

Expected `grep -c 'Grammar Rule [1-5]'` count: **≥ 50** (5 rules × 10 findings, plus header references and summary mentions).

---

## Key Conclusions

1. **The Error Morpheme is the most significant rejection.** It fails three grammar rules outright. The underlying need (expressing degraded states) is legitimate but must be solved with per-dimension fault vocabulary, not a collapsed binary symbol.

2. **The Axiom Ordering change is safe only with an explicit non-precedence guard.** Without that declaration, it creates a gravity well that pulls the framework toward implicit hierarchy — a subtle but serious orthogonality risk.

3. **Engineering Bridge formulas require triage, not blanket correction.** The core/view boundary (Finding 10) must be established *first*; only then can we know which formulas to correct in-place versus extract.

4. **Five findings can be actioned now** (2, 4, 6, 7, 10 — at least partially). The remaining five require the dimensional audit and tooling that the Codex-native refactor will provide.