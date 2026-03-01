# Consolidate findings into single list

> Task ID: t3
> Model: claude-opus-4-6:adaptive:low
> Duration: 112043ms
> Output chars: 17502
> Timestamp: 2026-03-01T08:26:00.982Z

---

# Consolidated Findings: M-7B Spec Review Reports

**Source A:** `docs/pipeline-output/2026-03-01T00-32-11/`
**Source B:** `docs/pipeline-output/2026-03-01T01-38-26/`
**Reference Spec:** `docs/specs/codex-signum-review-report.md`
**Date:** Consolidated analysis

---

## 0. Preamble: Compliance Lenses Applied

Every finding below was tested against three compliance lenses:

| Lens | Shorthand | What it guards |
|------|-----------|----------------|
| **Axiom Gate** (A1–A10) | `AX-n` | The 10 Codex Signum axioms — foundational invariants |
| **Grammar Gate** (G1–G5) | `GR-n` | The 5 grammar rules — structural well-formedness |
| **Anti-Pattern Gate** (AP1–AP10) | `AP-n` | The anti-pattern table rows 1–10 — known failure modes |

Classification labels:

- **VALIDATED** — Finding and its recommendation pass all three gates. Safe to act on.
- **REFRAMED** — Finding is legitimate but the original recommendation violates at least one gate. A framework-compliant alternative is provided.
- **REJECTED** — Finding or recommendation is itself an instance of a known anti-pattern or axiom violation. Must not be adopted.

Timing labels:

- **RESOLVE NOW** — Can be addressed within the current M-7B stabilization pass.
- **DEFER TO REFACTOR** — Requires deeper structural work; belongs in the Codex-native refactor milestone.

---

## 1. Duplicate Identification

The two pipeline runs share significant overlap. The following deduplication was performed:

| Topic Cluster | Report A Finding(s) | Report B Finding(s) | Deduplicated Entry |
|---|---|---|---|
| Error morpheme design | Error type should use binary enum | Error states should collapse to success/failure | → **F-01** (merged) |
| Axiom ordering | Axioms 6 and 7 should swap | Axiom 6 should precede Axiom 4 | → **F-02** (merged, distinct proposals noted) |
| Engineering Bridge formulas | Three formula corrections proposed | Two formula corrections + one new derived metric | → **F-03** (merged, new metric separated as F-04) |
| Morpheme naming consistency | Naming convention deviations in 4 morphemes | Naming convention deviations in 3 morphemes (subset) | → **F-05** (merged, superset) |
| Composition rule ambiguity | GR-3 allows ambiguous nesting | GR-3 nesting flagged | → **F-06** (merged, identical) |
| Anti-pattern coverage gaps | AP-8, AP-9 under-specified | AP-9, AP-10 under-specified | → **F-07** (merged, union) |
| Axiom dependency documentation | Missing dependency graph | Missing dependency graph | → **F-08** (identical, single entry) |
| Signum validation strictness | Validation too permissive on empty compositions | Same finding | → **F-09** (identical) |
| Bridge metric provenance | Metric origin unclear for 2 metrics | Same 2 metrics + 1 additional | → **F-10** (merged, superset) |
| Codex index completeness | Index missing 2 entries | Index missing 3 entries (superset) | → **F-11** (merged, superset) |

**Net result:** 11 unique consolidated findings from ~21 raw items across both reports.

---

## 2. Consolidated Findings

---

### F-01 — Error Morpheme: Binary Collapse Proposal

**Original Recommendation (both reports):** Replace the current multi-dimensional Error morpheme (which encodes severity, category, and recoverability as distinct facets) with a binary `Success | Failure` enum to simplify composition.

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| AX-3 (Dimensional Integrity) | ❌ FAIL | The Error morpheme currently encodes a 3D state space (severity × category × recoverability). Collapsing to binary destroys two dimensions of information. AX-3 requires that morphemes preserve the dimensionality of the phenomenon they model. |
| AX-7 (Lossless Transformation) | ❌ FAIL | The transformation from 3D → 1D is lossy by definition. No inverse mapping exists from `Failure` back to `{critical, parse-error, non-recoverable}`. |
| GR-2 (Morpheme Completeness) | ❌ FAIL | A binary morpheme cannot fully describe the error-state grammar the spec already relies on in composition rules. |
| AP-4 (Premature Simplification) | ❌ MATCH | This is a textbook instance of AP-4: "Reducing a morpheme's state space for implementation convenience at the cost of semantic fidelity." |

**Classification: REJECTED**

**Rationale:** Both reports' recommendation is itself an anti-pattern (AP-4) and violates two axioms. The current 3D Error morpheme is the correct design. If ergonomic concerns exist, the appropriate response is a *projection function* (a computed view that presents binary when a consumer only needs binary) — not a structural collapse.

**Alternative (if ergonomics are needed):**
> Define a `toBinary()` projection on the Error morpheme that yields `Success | Failure` as a *read-only computed view*. The morpheme itself retains all three facets. This satisfies AX-3, AX-7, and avoids AP-4. — **DEFER TO REFACTOR** (projection infrastructure may not yet exist).

---

### F-02 — Axiom Ordering Changes

**Original Recommendations:**
- Report A: Swap AX-6 (Composability) and AX-7 (Lossless Transformation).
- Report B: Move AX-6 to precede AX-4 (Canonical Form).

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| AX-1 (Foundational Immutability) | ❌ FAIL | AX-1 states that axiom identities are stable referents. Renumbering changes the referent of every `AX-n` citation across the entire corpus. |
| GR-1 (Structural Stability) | ❌ FAIL | Grammar rule 1 requires that the structural skeleton of the spec remains stable across revisions unless a breaking-change protocol is followed. Reordering axioms is a structural change. |
| AP-2 (Cosmetic Restructuring) | ❌ MATCH | Reordering for "logical flow" without a semantic necessity is AP-2: "Reorganizing structure for aesthetic reasons that creates referential instability." |

**Classification: REJECTED**

**Rationale:** The axioms are numbered identifiers, not a priority ranking. Their ordinal position carries no precedence semantics — this is explicitly stated in the spec preamble. Reordering them would break every existing cross-reference and provide zero semantic benefit while creating significant referential churn.

**If a dependency/precedence relationship needs documenting:** See F-08 below (axiom dependency graph). That is the correct mechanism.

---

### F-03 — Engineering Bridge Formula Corrections

**Original Recommendation (merged):** Three formula corrections in the Engineering Bridge:
1. **EB-Formula-2:** Sign error in the feedback-loop decay term.
2. **EB-Formula-5:** Missing normalization denominator.
3. **EB-Formula-7:** Exponent should be `n-1` not `n`.

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| AX-9 (Computational Verifiability) | ✅ PASS | Correcting mathematical errors improves verifiability. |
| AX-7 (Lossless Transformation) | ✅ PASS | Corrections restore intended lossless semantics. |
| GR-4 (Formula Provenance) | ✅ PASS | Corrections should include derivation traces. |
| AP-6 (Silent Fix) | ⚠️ CONDITIONAL | Passes only if each correction includes a changelog entry with the error identified and the mathematical justification for the fix. |

**Classification: VALIDATED** (conditional on provenance documentation)

**Timing: RESOLVE NOW** — Mathematical errors in bridge formulas are correctness bugs. Each fix must include:
- The erroneous formula (before)
- The corrected formula (after)
- A one-line derivation justification
- A changelog entry

---

### F-04 — New Derived Metric in Engineering Bridge

**Original Recommendation (Report B only):** Add a new "Composition Health Score" metric to the Engineering Bridge, computed from existing morpheme validity counts.

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| AX-5 (Parsimony) | ⚠️ CONCERN | Adding a new metric requires justification that it is not derivable from existing metrics at the point of use. |
| AX-8 (Separation of Stored vs. Computed) | ❌ FAIL | The proposed metric is explicitly defined as a computation over existing morpheme validity counts. AX-8 requires that computed views not be encoded as stored primitives in the spec. |
| AP-7 (Metric Proliferation) | ❌ MATCH | AP-7 warns against adding derived metrics to the core spec when they belong in a presentation/dashboard layer. |

**Classification: REFRAMED**

**Reframed Recommendation:** Do not add "Composition Health Score" as a core Engineering Bridge metric. Instead:
> Document it as a *suggested computed view* in an appendix or tooling guide. Tooling may compute and display it; the spec must not canonize it as a primitive.

**Timing: DEFER TO REFACTOR** — Computed-view infrastructure should be designed holistically, not ad hoc.

---

### F-05 — Morpheme Naming Consistency

**Original Recommendation:** Four morphemes deviate from the `PascalCase-with-domain-prefix` convention: `errorState`, `sig_validity`, `CompositionResult`, and `bridge.metric.decay`.

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| GR-5 (Lexical Uniformity) | ✅ PASS | GR-5 requires a single consistent naming convention across all morphemes. |
| AX-2 (Coherent Identity) | ✅ PASS | Naming inconsistency undermines morpheme identity coherence. |
| AP-1 (Convention Drift) | ✅ APPLICABLE | This is the correction AP-1 exists to catch. |

**Classification: VALIDATED**

**Timing: RESOLVE NOW** — Rename the four morphemes to conform to `PascalCase-with-domain-prefix`. Provide an alias table for one release cycle if external consumers exist.

| Current Name | Corrected Name |
|---|---|
| `errorState` | `Error.State` |
| `sig_validity` | `Signum.Validity` |
| `CompositionResult` | `Composition.Result` |
| `bridge.metric.decay` | `Bridge.MetricDecay` |

---

### F-06 — Composition Rule Ambiguity (GR-3 Nesting)

**Original Recommendation:** GR-3 allows recursive nesting of compositions without a depth bound, creating ambiguous parse trees.

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| GR-3 (Composition Well-Formedness) | ✅ LEGITIMATE FINDING | This is a genuine gap in GR-3 itself. |
| AX-9 (Computational Verifiability) | ✅ SUPPORTS FIX | Unbounded nesting makes verification undecidable in the general case. |
| AP-5 (Unbounded Recursion) | ✅ APPLICABLE | AP-5 specifically warns against specs that permit unconstrained recursive structures. |

**Classification: VALIDATED**

**Timing: RESOLVE NOW** — Add an explicit maximum nesting depth to GR-3. Recommend `depth ≤ 4` based on the current composition patterns in the spec (none exceed 3). Include an escape clause for future extension via explicit opt-in.

---

### F-07 — Anti-Pattern Table Under-Specification (AP-8, AP-9, AP-10)

**Original Recommendation:** Anti-pattern rows 8, 9, and 10 lack sufficient "detection criteria" and "example" columns compared to rows 1–7.

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| AX-6 (Composability) | ✅ PASS | Complete anti-pattern definitions enable better composition validation. |
| GR-4 (Formula Provenance) | ✅ PASS (by analogy) | Anti-pattern entries need the same rigor as formula entries. |
| Self-consistency | ✅ PASS | The spec should eat its own dogfood: under-specifying anti-patterns is itself a form of AP-3 (Incomplete Specification). |

**Classification: VALIDATED**

**Timing: RESOLVE NOW** — Complete AP-8, AP-9, and AP-10 with:
- A one-sentence detection heuristic
- A minimal triggering example
- A reference to which axiom(s) the anti-pattern violates

---

### F-08 — Axiom Dependency Graph

**Original Recommendation (both reports, identical):** The spec lacks a visual or formal dependency graph showing which axioms depend on or presuppose others.

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| AX-10 (Self-Documentation) | ✅ PASS | The relationship between axioms is a structural property the spec should document about itself. |
| GR-4 (Formula Provenance) | ✅ PASS | Dependency relationships are a form of provenance. |
| AP-2 (Cosmetic Restructuring) | ✅ NOT TRIGGERED | Adding documentation ≠ restructuring. |

**Classification: VALIDATED**

**Note:** This is the *correct* response to the impulse behind F-02. Rather than reordering axioms, document their dependency relationships.

**Timing: RESOLVE NOW** — Add a DAG (as a Mermaid diagram or adjacency list) in the axiom chapter showing logical dependencies. Example edges: `AX-7 → AX-3` (lossless transformation presupposes dimensional integrity), `AX-9 → AX-5` (verifiability is easier under parsimony).

---

### F-09 — Signum Validation: Empty Composition Permissiveness

**Original Recommendation:** The Signum validator currently accepts empty compositions (zero morphemes) as valid. It should reject them.

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| GR-2 (Morpheme Completeness) | ✅ PASS | An empty composition cannot be "complete." |
| AX-4 (Canonical Form) | ✅ PASS | The canonical form of a composition requires at least one morpheme. |
| AP-3 (Incomplete Specification) | ✅ APPLICABLE | Failing to specify a minimum cardinality is AP-3. |

**Classification: VALIDATED**

**Timing: RESOLVE NOW** — Add explicit minimum cardinality constraint: `|composition| ≥ 1`. Update validation logic and spec text together.

---

### F-10 — Bridge Metric Provenance

**Original Recommendation:** Three Engineering Bridge metrics lack provenance documentation (origin paper, derivation, or rationale): `MetricDecay`, `FeedbackGain`, and `CompositionEntropy`.

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| GR-4 (Formula Provenance) | ✅ PASS | Every metric must have documented provenance. |
| AX-10 (Self-Documentation) | ✅ PASS | Metrics without provenance are opaque. |

**Classification: VALIDATED**

**Timing: RESOLVE NOW** for `MetricDecay` and `FeedbackGain` (these are already used in bridge formulas and their provenance should be recoverable). **DEFER TO REFACTOR** for `CompositionEntropy` (this may need to be rederived or removed if provenance cannot be established — see AX-5 Parsimony).

---

### F-11 — Codex Index Completeness

**Original Recommendation:** The Codex index is missing entries for 3 morphemes that appear in the spec body.

**Compliance Testing:**

| Gate | Verdict | Reasoning |
|------|---------|-----------|
| AX-10 (Self-Documentation) | ✅ PASS | An incomplete index violates self-documentation. |
| AX-2 (Coherent Identity) | ✅ PASS | Morphemes that exist but aren't indexed have fragmented identity. |

**Classification: VALIDATED**

**Timing: RESOLVE NOW** — Add the three missing morphemes to the index. This is a bookkeeping fix.

---

## 3. Summary Matrix

| ID | Topic | Classification | Timing | Key Gate(s) |
|----|-------|---------------|--------|-------------|
| F-01 | Error Morpheme Binary Collapse | **REJECTED** | N/A | AX-3, AX-7, AP-4 |
| F-02 | Axiom Reordering | **REJECTED** | N/A | AX-1, GR-1, AP-2 |
| F-03 | Bridge Formula Corrections (×3) | **VALIDATED** | RESOLVE NOW | AX-9, GR-4 |
| F-04 | New Derived Bridge Metric | **REFRAMED** | DEFER | AX-8, AP-7 |
| F-05 | Morpheme Naming Consistency | **VALIDATED** | RESOLVE NOW | GR-5, AP-1 |
| F-06 | GR-3 Nesting Ambiguity | **VALIDATED** | RESOLVE NOW | GR-3, AX-9, AP-5 |
| F-07 | Anti-Pattern Table Gaps | **VALIDATED** | RESOLVE NOW | AX-6, Self-consistency |
| F-08 | Axiom Dependency Graph | **VALIDATED** | RESOLVE NOW | AX-10, GR-4 |
| F-09 | Empty Composition Validation | **VALIDATED** | RESOLVE NOW | GR-2, AX-4 |
| F-10 | Bridge Metric Provenance | **VALIDATED** | SPLIT (2 now, 1 defer) | GR-4, AX-10 |
| F-11 | Index Completeness | **VALIDATED** | RESOLVE NOW | AX-10, AX-2 |

**Totals:** 8 validated, 1 reframed, 2 rejected.

---

## 4. Resolve-Now Work Queue (Priority Order)

Items are ordered by blast radius (most-referenced-first):

1. **F-03** — Fix three Engineering Bridge formulas (correctness bug, blocks downstream consumers)
2. **F-09** — Add minimum composition cardinality (validation correctness)
3. **F-06** — Bound GR-3 nesting depth (parse decidability)
4. **F-05** — Rename four morphemes (referential consistency)
5. **F-07** — Complete AP-8/9/10 definitions (spec completeness)
6. **F-08** — Add axiom dependency DAG (addresses the valid concern behind rejected F-02)
7. **F-10** — Add provenance for `MetricDecay` and `FeedbackGain`
8. **F-11** — Add three missing index entries

## 5. Deferred-to-Refactor Queue

1. **F-04** — Design computed-view infrastructure; document `CompositionHealthScore` as a suggested view, not a primitive.
2. **F-10 (partial)** — Resolve `CompositionEntropy` provenance; if unrecoverable, evaluate for removal under AX-5.
3. **F-01 (alternative)** — If binary ergonomics are genuinely needed, build projection-function infrastructure on Error morpheme.

---

## 6. Methodological Note

Two findings (F-01, F-02) were *rejected* — meaning the review reports' own recommendations failed compliance testing against the framework they were reviewing. This is not unusual: review heuristics optimized for general software engineering (simplify enums, reorder for readability) can conflict with a formal specification framework's invariants. The Codex Signum axioms exist precisely to catch such well-intentioned-but-destructive simplifications. The framework worked as designed.