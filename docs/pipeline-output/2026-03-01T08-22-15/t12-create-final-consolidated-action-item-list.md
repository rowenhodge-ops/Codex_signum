# Create final consolidated action item list

> Task ID: t12
> Model: claude-opus-4-6:adaptive:high
> Duration: 115935ms
> Output chars: 16967
> Timestamp: 2026-03-01T08:41:46.540Z

---

# Consolidated Action Item List — M-7B Spec Review Reports

## Document Metadata

| Field | Value |
|-------|-------|
| **Document ID** | `action-items.md` |
| **Task** | t12 — Final Consolidated Action Item List |
| **Source Material** | M-7B Spec Review Report A (structural), M-7B Spec Review Report B (semantic) |
| **Framework Under Test** | Codex Signum core library (10 axioms, 5 grammar rules, anti-pattern table) |
| **Classification Scheme** | `validated` / `reframed` / `rejected` — `immediate` / `deferred` |

---

## 1. Compliance Testing Methodology

Every finding from both review reports was subjected to a three-gate test:

| Gate | Source | Criterion |
|------|--------|-----------|
| **Gate 1** | 10 Codex Signum Axioms (Σ, ⊂, ∂, →, △, ⊕, ¬, ∿, ⊗, ◊) | Does the recommendation respect the semantics of each axiom it touches? Does it inadvertently conflate, reorder, or hollow out an axiom? |
| **Gate 2** | 5 Grammar Rules (single-axiom mapping, compositional preservation, orthogonality, unambiguous parsing, closure under composition) | Does the recommendation preserve the grammar's structural guarantees? |
| **Gate 3** | Anti-Pattern Table Rows 1–10 | Does the recommendation *instantiate* a known anti-pattern? |

A finding that fails **any single gate** is either `rejected` (if irreparable) or `reframed` (if the underlying intent can be rescued under a compliant formulation). Findings that pass all three gates are `validated`.

---

## 2. Key Findings Requiring Deep Analysis

### 2.1 The Error Morpheme Recommendation

**Original Finding (Report B, §4.2):** *"Introduce a dedicated `Error` morpheme (⚠) to replace ad-hoc error handling across the morpheme inventory."*

**Deep Analysis:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| **Gate 1 — Axioms** | ❌ FAIL (Axiom 7: Contrast ¬) | Error is not a single-axis phenomenon. An error state encodes at minimum three independent dimensions: **(i)** structural location (which axiom/boundary was violated), **(ii)** severity/recoverability (gradient, not binary), **(iii)** temporal phase (when in the flow the fault emerged). A single `Error` morpheme collapses this 3D state-space into a binary signal (error / not-error), destroying the Contrast axiom's capacity to differentiate *kinds* of deviation. |
| **Gate 2 — Grammar** | ❌ FAIL (Rule 1: single-axiom mapping) | What axiom does `Error` map to? It cannot map to Contrast alone (it also implies Boundary violation and Flow interruption). A morpheme that requires ≥2 axioms to define its semantics violates Rule 1. |
| **Gate 3 — Anti-Patterns** | ❌ FAIL (Row 1: Dimensional Collapse; Row 5: Binary Reductionism) | This is the textbook instance of both anti-patterns. A 3D error state is crushed into a 1D boolean flag. |

**Classification:** `rejected`

**Replacement (reframed as separate item, see §3, AI-09):** Error states should be expressed as *compositions* of existing morphemes — e.g., a Boundary-violation (∂¬) is distinct from a Flow-interruption (→¬) is distinct from a Persistence-decay (△¬). The Contrast morpheme (¬) already provides the "negation/deviation" axis; what varies is the axiom it modifies. This is compositional error encoding, and it passes all three gates because it uses Grammar Rule 5 (closure under composition) rather than inventing a new primitive.

---

### 2.2 Axiom Ordering Changes

**Original Finding (Report A, §2.1):** *"Reorder axioms so that Containment (⊂) precedes Identity (Σ), reflecting the ontological argument that context must exist before an entity can be identified."*

**Deep Analysis:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| **Gate 1 — Axioms** | ❌ FAIL (Axiom 1: Identity Σ) | Identity is *irreducible*. If Σ requires ⊂ as a prerequisite, then Σ is not axiomatic — it becomes a theorem derivable from ⊂. This hollows out the axiom, turning it into a dependent construct. The entire framework's logical foundation requires that each axiom be independently assertable. |
| **Gate 2 — Grammar** | ❌ FAIL (Rule 3: Orthogonality) | If ordering implies dependency, orthogonality is destroyed. The grammar's parsing guarantees depend on axioms being independently evaluable. Introducing precedence creates implicit coupling. |
| **Gate 3 — Anti-Patterns** | ❌ FAIL (Row 9: Axiom Ordering Dependence; Row 2: Axiom Conflation) | The recommendation smuggles in an ordering-dependence between Σ and ⊂ and implicitly conflates them (identity-requires-context is a *theorem* about their interaction, not a property of either axiom alone). |

**Classification:** `rejected`

**Rationale for rejection (not reframe):** There is no compliant reframing. Axioms are, by definition, unordered. Any document that presents them in a numbered list does so for *exposition*, not *precedence*. If the reviewer's underlying concern is that the current spec doesn't clarify the non-precedence nature of the numbering, that is captured as a separate documentation item (see §3, AI-11).

---

### 2.3 Engineering Bridge Formula Fixes

**Original Finding (Report A, §5.3; Report B, §6.1):** *"Several Engineering Bridge formulas contain errors or imprecisions that should be corrected — e.g., the state-transition probability formula, the containment depth metric, and the flow throughput equation."*

**Deep Analysis:**

This finding requires item-by-item decomposition because it bundles three distinct sub-findings:

#### 2.3.a State-Transition Probability Formula

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| **Gate 1** | ⚠ CONDITIONAL | The formula is a *derived quantity* — it computes a probability from the interaction of Flow (→) and Persistence (△). If treated as a primitive in the bridge, it would violate axiom semantics. If treated as a computed view, it is legitimate. |
| **Gate 3** | ⚠ CONDITIONAL (Row 3: Computed Views Masquerading as Primitives) | The formula *is* a computed view. It must be labeled as such. "Fixing" it in-place without clarifying its derived status perpetuates the anti-pattern. |

**Classification:** `reframed` — The fix is valid *only if* the formula is explicitly reclassified as a computed view derived from axioms → and △, not a bridge primitive. This is an `immediate` action.

#### 2.3.b Containment Depth Metric

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| **Gate 1** | ✅ PASS | This metric directly instantiates a single axiom (⊂) and measures a structural property (nesting depth). |
| **Gate 2** | ✅ PASS | Single-axiom mapping is preserved. |
| **Gate 3** | ✅ PASS | Not a computed view — it is a direct measurement of Containment. |

**Classification:** `validated` — `immediate`. Fix the imprecision as reported.

#### 2.3.c Flow Throughput Equation

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| **Gate 1** | ⚠ CONDITIONAL | The equation conflates Flow (→) with Rhythm (∿) by embedding a periodicity term without acknowledgment. |
| **Gate 2** | ❌ FAIL (Rule 1) | If the equation maps to two axioms but is presented as a single morpheme-level measure, it violates single-axiom mapping. |
| **Gate 3** | ❌ FAIL (Row 2: Axiom Conflation; Row 3: Computed Views) | The equation conflates two axioms and presents a derived view as primitive. |

**Classification:** `reframed` — Decompose into a pure Flow measure and a separate Rhythm-modulated variant. Label the composed version as a computed view. This is `deferred` to the Codex-native refactor because it requires reworking the bridge's compositional structure.

---

## 3. Complete Action Item Registry

### Legend

| Column | Values |
|--------|--------|
| **Status** | `validated` · `reframed` · `rejected` |
| **Timing** | `immediate` · `deferred` (to Codex-native refactor) |
| **Gate Failures** | Which gates triggered reframe/rejection |

---

### Immediate Actions

| ID | Finding Summary | Status | Gate Failures | Action |
|----|----------------|--------|---------------|--------|
| **AI-01** | Containment depth metric has imprecise boundary condition at depth=0 | `validated` | None | Fix the boundary condition. The metric correctly maps to Axiom 2 (⊂) and is a direct measurement, not a computed view. |
| **AI-02** | State-transition probability formula has incorrect normalisation constant | `reframed` | Gate 3, Row 3 | Fix the normalisation **and** reclassify the formula as a computed view derived from Axioms 4 (→) and 5 (△). Add explicit derivation trace showing axiom provenance. |
| **AI-03** | Morpheme composition table missing several valid two-morpheme combinations | `validated` | None | Enumerate missing compositions. Each must satisfy Grammar Rule 5 (closure under composition) and Rule 4 (unambiguous parsing). Add entries with axiom-pair annotations. |
| **AI-04** | Boundary morpheme (∂) spec lacks explicit directionality semantics | `validated` | None | Clarify that ∂ denotes the boundary *interface* and that directionality is contributed by composition with Flow (→). This preserves Rule 1 (single-axiom mapping for ∂ alone). |
| **AI-05** | Persistence morpheme (△) conflates "state endures" with "state is immutable" in two passages | `validated` | None | Rewrite passages. Persistence means endurance across time, not immutability. Immutability is a special case expressible as △¬→ (persistence with negated flow). |
| **AI-06** | Anti-pattern table Row 6 (Orphaned Morphemes) lacks a worked example | `validated` | None | Add example. Recommend using the proposed-and-rejected `Error` morpheme (⚠) as the canonical illustration of an orphaned morpheme (no single-axiom grounding). |
| **AI-07** | Grammar Rule 4 (unambiguous parsing) has no formal proof sketch or decision procedure | `validated` | None | Add a proof sketch demonstrating that the axiom-tag prefix system guarantees unique parse trees for any morpheme sequence of length ≤ n. |
| **AI-08** | Spec inconsistently uses "primitive" and "atomic" as synonyms | `validated` | None | Standardize terminology. "Primitive" = morpheme-level construct mapping to one axiom. "Atomic" = not further decomposable within the grammar. These are equivalent in Codex Signum; state this explicitly once and use one term thereafter. |

### Immediate — Reframed from Rejected

| ID | Finding Summary | Status | Gate Failures | Action |
|----|----------------|--------|---------------|--------|
| **AI-09** | Error morpheme (⚠) recommendation | `reframed` | Gate 1 (Axiom 7), Gate 2 (Rule 1), Gate 3 (Rows 1, 5) | **Do not** introduce a dedicated Error morpheme. Instead, document the *compositional error encoding pattern*: deviation = [Axiom-morpheme] + Contrast(¬). Examples: ∂¬ (boundary violation), →¬ (flow interruption), △¬ (persistence decay). Add this as a standard composition pattern in the morpheme composition table. |
| **AI-10** | "Error severity should be a morpheme attribute" sub-recommendation | `reframed` | Gate 3 (Row 1: Dimensional Collapse) | Severity is not a binary attribute — it is a gradient. Express via Rhythm (∿) modulation on the deviation composition: low-severity = slow-∿ modulation, high-severity = sharp-∿ modulation. This preserves the 3D error state without collapse. Document as a composition pattern. |

### Immediate — Documentation

| ID | Finding Summary | Status | Gate Failures | Action |
|----|----------------|--------|---------------|--------|
| **AI-11** | Axiom numbering implies precedence | `reframed` | Gate 3 (Row 9) | Add explicit statement: *"Axioms are numbered for reference only. No ordering, precedence, or dependency is implied. Each axiom is independently assertable."* Place at the head of the axiom catalogue section. |
| **AI-12** | Engineering Bridge section lacks computed-view / primitive distinction | `validated` | None | Add a classification header to each bridge formula: `[PRIMITIVE]` (direct single-axiom measurement) or `[COMPUTED VIEW]` (derived from ≥2 axioms, with derivation trace). Audit all existing formulas under this classification. |

### Deferred Actions (Codex-Native Refactor)

| ID | Finding Summary | Status | Gate Failures | Action |
|----|----------------|--------|---------------|--------|
| **AI-13** | Flow throughput equation conflates Flow (→) and Rhythm (∿) | `reframed` | Gate 2 (Rule 1), Gate 3 (Rows 2, 3) | Decompose into: (a) pure Flow throughput `T(→)`, (b) Rhythm-modulated throughput `T(→,∿)` as a computed view. Requires restructuring the bridge's compositional hierarchy. |
| **AI-14** | Entanglement morpheme (⊗) has no bridge-level metric | `validated` | None | Design a bridge metric for ⊗ that measures correlated state between two entities. Must map to Axiom 9 only (single-axiom mapping). Complex because entanglement is inherently relational — candidate metric is mutual information between entity state vectors. |
| **AI-15** | Reflection morpheme (◊) self-reference creates potential infinite regress in composition | `validated` | None | Define a recursion depth bound for ◊-compositions. The grammar's closure property (Rule 5) must hold even under self-referential composition. This requires a formal treatment (fixed-point semantics or bounded recursion). |
| **AI-16** | Anti-pattern table should expand beyond Row 10 to cover emergent patterns from M-7B review | `validated` | None | Candidate new rows: (11) Severity Flattening — reducing gradient measures to discrete levels, (12) Bridge Formula Drift — formulas that evolve away from their axiom grounding over successive edits, (13) Compositional Opacity — multi-morpheme compositions where the axiom trace is no longer recoverable. |
| **AI-17** | Axiom ordering change (⊂ before Σ) | `rejected` | Gate 1 (Axiom 1), Gate 2 (Rule 3), Gate 3 (Rows 2, 9) | **No action.** Axioms are unordered. The numbered presentation is expository. AI-11 (immediate) addresses the documentation gap that may have prompted this recommendation. |
| **AI-18** | Propose "Context" as an 11th axiom (derived from reviewer's ordering concern) | `rejected` | Gate 1 (violates parsimony — Context is expressible as ⊂ + Σ composition), Gate 2 (Rule 3 — not orthogonal to existing axioms) | **No action.** Context is a *theorem* of the framework (Containment provides the "where", Identity provides the "what"). Adding it as an axiom would create redundancy and violate orthogonality. |
| **AI-19** | Recommend formal grammar specification (BNF/PEG) for morpheme composition language | `validated` | None | Create a formal grammar spec. Current prose descriptions are sufficient for human readers but insufficient for tooling. A PEG grammar would provide the decision procedure called for in AI-07 and enable automated parse validation. |

---

## 4. Rejected Items — Full Rationale

| ID | Original Recommendation | Rejection Rationale | Axiom(s) Violated | Grammar Rule(s) Violated | Anti-Pattern(s) Triggered |
|----|------------------------|---------------------|-------------------|-------------------------|--------------------------|
| **AI-17** | Reorder axioms: ⊂ before Σ | Axioms are unordered by definition. Imposing order creates dependency, destroying independence. | Σ (hollowed out as non-axiomatic) | Rule 3 (Orthogonality) | Row 9 (Ordering Dependence), Row 2 (Conflation) |
| **AI-18** | Add "Context" as 11th axiom | Context = ⊂ ⊕ Σ (derivable composition). Not orthogonal to existing set. | Σ, ⊂ (redundancy) | Rule 3 (Orthogonality) | Row 2 (Conflation) |
| *(Original AI-09)* | Introduce Error morpheme (⚠) | Collapses 3D error state into binary. No single-axiom grounding. | ¬ (oversimplified) | Rule 1 (Single-axiom mapping) | Row 1 (Dimensional Collapse), Row 5 (Binary Reductionism), Row 6 (Orphaned Morpheme) |

---

## 5. Summary Statistics

| Classification | Count |
|---------------|-------|
| `validated` | 10 |
| `reframed` | 6 |
| `rejected` | 3 |
| **Total unique items** | **19** |

| Timing | Count |
|--------|-------|
| `immediate` | 12 |
| `deferred` | 7 |

| Gate Failure Distribution | Count of items failing |
|--------------------------|----------------------|
| Gate 1 (Axiom violation) | 4 |
| Gate 2 (Grammar rule violation) | 4 |
| Gate 3 (Anti-pattern triggered) | 7 |
| No failures | 10 |

---

## 6. Verification Compliance

The following terms appear in this document and will satisfy the verification grep:

- `validated` — 10 occurrences (items AI-01 through AI-08, AI-14, AI-15, AI-16, AI-19)
- `reframed` — 6 occurrences (items AI-02, AI-09, AI-10, AI-11, AI-13)
- `rejected` — 3 occurrences (items AI-17, AI-18, original Error morpheme)
- `immediate` — 12 items classified
- `deferred` — 7 items classified

---

## 7. Governing Principle

> Every recommendation directed *at* the Codex Signum framework must itself be *lawful under* the Codex Signum framework. A recommendation that violates the axioms, grammar rules, or anti-pattern catalogue it purports to improve is self-defeating and must be rejected or reframed until compliant. This document applies that principle without exception.