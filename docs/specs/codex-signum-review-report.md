# Codex Signum v3.0 — Specification Review Report

**Document:** `docs/specs/codex-signum-review-report.md`
**Specification under review:** `docs/specs/codex-signum-v3_0.md`
**Date:** 2025-01-28
**Status:** Initial Review — Action Items Open

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [T1 — Axiom Analysis](#2-t1--axiom-analysis)
3. [T2 — Morpheme Analysis](#3-t2--morpheme-analysis)
4. [T3 — Grammar Rule Analysis](#4-t3--grammar-rule-analysis)
5. [T4 — Engineering Bridge Cross-Reference](#5-t4--engineering-bridge-cross-reference)
6. [T5 — Aspirational vs Implemented](#6-t5--aspirational-vs-implemented)
7. [Consolidated Action Items](#7-consolidated-action-items)
8. [Recommended Prioritisation](#8-recommended-prioritisation)

---

## 1. Executive Summary

This report reviews Codex Signum v3.0 for internal consistency, design quality,
and alignment with the current implementation. Five analysis passes were
conducted (t1–t5). The principal findings are:

| Area | Severity | Count |
|---|---|---|
| Axiom overlaps / subsumption | **High** | 2 |
| Axiom under-constraint (not testable) | **Medium** | 1 |
| Axiom ordering misalignment | **Medium** | 3 |
| Missing morphemes | **Medium** | 1 |
| Redundant morphemes | **Low** | 0 |
| Grammar rule gaps | **Medium** | 2 |
| Stale Engineering Bridge formulas | **High** | 3 |
| Aspirational features described as implemented | **High** | 4 |

Each finding is detailed below with a unique identifier (e.g., `AX-01`) for
tracking purposes.

---

## 2. T1 — Axiom Analysis

### 2.1 Axiom Inventory

| # | Name | Core Constraint |
|---|---|---|
| A1 | Symbiosis | Human–AI collaboration is bidirectional |
| A2 | Transparency | Internal state must be observable |
| A3 | Comprehension Primacy | Understanding over rote retention |
| A4 | Autonomy Gradient | Agents choose their level of self-direction |
| A5 | Fidelity | Representations preserve source semantics |
| A6 | Composability | All constructs combine without special-casing |
| A7 | Traceability | Every output has an auditable derivation chain |
| A8 | Resilience | Graceful degradation under partial failure |
| A9 | Parsimony | Minimal structural complexity for a given capability |
| A10 | Evolution | The specification itself is designed to change |

### 2.2 Overlap & Subsumption

#### Finding AX-01 — A1 (Symbiosis) is subsumed by A2 + A3

**Severity: High**

Symbiosis states that human–AI interaction must be bidirectional and
cooperative. Decomposing the testable obligations it creates:

| Symbiosis obligation | Already covered by |
|---|---|
| "AI state must be legible to the human" | A2 (Transparency) |
| "Human intent must be legible to the AI" | A3 (Comprehension Primacy) — input understanding |
| "Collaboration is iterative" | A6 (Composability) — temporal composition of interaction |

No implementation constraint exists that passes the test "required by A1 but
not required by any other axiom." Symbiosis as currently written is a
*meta-narrative* rather than a *constraint*. It tells us *why* we want
Transparency and Comprehension Primacy but does not add a testable requirement
beyond them.

**Options:**
- **(a) Demote to Preamble.** Move the symbiosis narrative into the spec
  preamble / design philosophy section. This is the cleanest option.
- **(b) Sharpen into a unique constraint.** Rewrite A1 to mandate something
  the other axioms do not — e.g., "Every computation must expose at least one
  human-actionable feedback channel." This would give it a testable identity.
- **(c) Merge formally.** Fold Symbiosis language into A2 and A3 as
  motivating context.

> **ACTION ITEM AX-01:** Resolve A1 subsumption. Recommended: option (a).

#### Finding AX-02 — A7 (Traceability) overlaps significantly with A2 (Transparency)

**Severity: Medium**

Transparency requires observable state. Traceability requires auditable
derivation. In practice every implementation test that validates Traceability
also validates a subset of Transparency. The distinction is temporal:
Transparency is about *current* state, Traceability is about *historical*
derivation.

This overlap is **acceptable** if both axioms include explicit scoping
language:

- A2: "Transparency governs *point-in-time* observability."
- A7: "Traceability governs *causal chain* auditability."

Currently the spec does not draw this boundary explicitly.

> **ACTION ITEM AX-02:** Add scoping clauses to A2 and A7 to delineate
> point-in-time vs causal-chain obligations.

### 2.3 Under-Constrained Axioms

#### Finding AX-03 — A10 (Evolution) produces no testable constraint

**Severity: Medium**

A10 states the specification is designed to change. This is a meta-property of
the *document*, not a constraint on the *implementation*. No unit test, integration
test, or runtime assertion can validate or falsify A10. It belongs in the
document governance section, not in the axiom set.

> **ACTION ITEM AX-03:** Move A10 to a "Specification Governance" section.
> Replace with a true implementation constraint if a 10th axiom is desired
> (candidate: **Determinism** — given identical inputs and configuration, a
> computation must produce identical outputs).

### 2.4 Ordering Issues

The current axiom ordering appears to follow narrative flow (philosophy →
concrete → meta). For operational priority — i.e., "which axiom should an
implementor satisfy first when constraints conflict" — the ordering should
reflect dependency depth.

#### Finding AX-04 — Recommended operational ordering

**Severity: Medium**

| Priority | Axiom | Rationale |
|---|---|---|
| 1 | A5 Fidelity | If representations are wrong, nothing else matters |
| 2 | A6 Composability | Structural foundation for all other properties |
| 3 | A9 Parsimony | Constrains design space before complexity accrues |
| 4 | A2 Transparency | Enables verification of all subsequent properties |
| 5 | A7 Traceability | Depends on Transparency infrastructure |
| 6 | A3 Comprehension Primacy | Requires Fidelity + Transparency to validate |
| 7 | A8 Resilience | Requires Composability to implement graceful degradation |
| 8 | A4 Autonomy Gradient | Higher-order concern; depends on 1–7 |
| 9 | A1 Symbiosis | If retained: highest-level integration property |
| 10 | A10 Evolution | Meta-property (or removed per AX-03) |

> **ACTION ITEM AX-04:** Either reorder axioms by operational priority or add
> an explicit "Priority Resolution" clause that defines the tiebreaking order
> when axioms conflict.

---

## 3. T2 — Morpheme Analysis

### 3.1 Morpheme Inventory

| Symbol | Name | Role |
|---|---|---|
| Σ | Signal | A value that flows through the computation graph |
| Τ | Transform | A pure function that maps signals |
| Κ | Composite | A named grouping of transforms and signals |
| Β | Binding | An association between a name and a value/computation |
| Γ | Gate | A conditional that controls signal flow |
| Ω | Witness | An observation record proving a computation occurred |

### 3.2 Redundancy Assessment

No morpheme is fully redundant. Each occupies a distinct role in the structural
grammar. Γ (Gate) is the closest candidate for redundancy — it could be modelled
as a Transform with a boolean input — but its conditional-flow semantics are
sufficiently distinct to warrant a dedicated morpheme. Gates control *whether*
a signal flows; Transforms control *what* a signal becomes. Collapsing them
would lose the ability to statically analyse flow control paths.

**Verdict: No morphemes should be removed.**

### 3.3 Missing Morphemes

#### Finding MO-01 — No morpheme for Error / Anomaly

**Severity: Medium**

The current morpheme set has no primitive for representing a computation that
has faulted, an anomalous signal, or a propagating error. In the implementation,
errors are handled through several ad-hoc patterns:

- Signals carrying `null` or sentinel values
- Transforms throwing exceptions caught by composite-level try/catch
- Gates that check for error flags before propagating

None of these are structurally represented. A7 (Traceability) and A8
(Resilience) both require reasoning about failure, but the morpheme set
provides no structural primitive for it.

**Candidate morpheme:** `Ε` (Epsilon) — **Error** — represents a computation
that has diverged from its expected signal path. Carries provenance (which
transform faulted, what input caused it) and composes with Gates (a Gate can
match on error type) and Witnesses (a Witness can attest to the error).

> **ACTION ITEM MO-01:** Evaluate adding an Error morpheme (Ε). Draft its
> composition rules with all existing morphemes and assess implementation
> impact.

#### Finding MO-02 — No morpheme for Time / Sequence

**Severity: Low**

Temporal ordering is implicit in signal flow but has no explicit morpheme. This
is acceptable for the current computation model (dataflow-oriented), but may
become a gap if the spec ever needs to express "signal A must arrive before
signal B" as a structural constraint rather than a runtime assertion.

> **ACTION ITEM MO-02:** Flag for future review. No immediate action required.

---

## 4. T3 — Grammar Rule Analysis

### 4.1 Grammar Rule Inventory

| # | Rule | Structure |
|---|---|---|
| G1 | Composition | `Κ → Τ Σ Τ` (signals flow through transform chains) |
| G2 | Binding | `Β → name Σ` or `Β → name Κ` (names associate with values) |
| G3 | Gating | `Γ → condition Σ Σ` (conditional signal routing) |
| G4 | Witnessing | `Ω → Κ attestation` (composites produce observation records) |
| G5 | Nesting | `Κ → Κ` (composites contain composites) |

### 4.2 Coverage Analysis

#### Finding GR-01 — No rule for parallel / concurrent composition

**Severity: Medium**

G1 describes sequential signal flow (chain). G5 describes hierarchical nesting.
Neither describes *parallel* composition — two transforms receiving the same
signal simultaneously and producing independent outputs that are later joined.

In the implementation, parallel composition is used extensively:

```
// Actual implementation pattern (conceptual):
// signal → [transformA, transformB] → join → output
```

This pattern is expressible only by combining G1 + G5 in a non-obvious way.
A dedicated grammar rule would make parallel composition a first-class
structural relationship.

**Candidate rule:** `G6 — Fanout: Σ → [Τ₁, Τ₂, ..., Τₙ]` — a signal is
distributed to multiple transforms, producing multiple output signals.

> **ACTION ITEM GR-01:** Add a Fanout grammar rule (G6) or formally show how
> G1 + G5 express parallelism and add that derivation to the spec.

#### Finding GR-02 — No rule for feedback / cycles

**Severity: Medium**

The grammar rules describe acyclic dataflow. Feedback loops — where a
composite's output feeds back into its own input — are not expressible. If the
computation model is intentionally acyclic, this should be stated as a
constraint. If cycles are permitted (e.g., for iterative refinement), a grammar
rule is needed.

In the implementation, there are at least two patterns that resemble cycles:

1. Signal conditioning pipelines that re-process signals based on quality
   metrics (iterative refinement).
2. Witness-driven recomputation where an attestation failure triggers a
   re-run of the originating composite.

> **ACTION ITEM GR-02:** Determine whether the computation model permits
> cycles. If yes, add a Feedback grammar rule. If no, add an explicit
> acyclicity constraint and refactor the cyclic implementation patterns.

### 4.3 Rule Completeness Matrix

Cross-referencing grammar rules against morpheme pairs to check that every
meaningful morpheme interaction has a governing rule:

| | Σ | Τ | Κ | Β | Γ | Ω |
|---|---|---|---|---|---|---|
| **Σ** | — | G1 | G1 | G2 | G3 | ⚠️ |
| **Τ** | G1 | G1 | G1 | ⚠️ | ⚠️ | G4 |
| **Κ** | G1 | G1 | G5 | G2 | ⚠️ | G4 |
| **Β** | G2 | ⚠️ | G2 | — | ⚠️ | ⚠️ |
| **Γ** | G3 | ⚠️ | ⚠️ | ⚠️ | — | ⚠️ |
| **Ω** | ⚠️ | G4 | G4 | ⚠️ | ⚠️ | — |

⚠️ = no grammar rule governs this interaction.

Key gaps:
- **Σ↔Ω**: Can a signal carry a witness? (Provenance-bearing signals)
- **Τ↔Β**: Can a transform be bound to a name? (Named transforms / function registry)
- **Τ↔Γ**: Can a transform's applicability be gated? (Conditional transforms)
- **Γ↔Κ**: Can a gate control composite activation? (Conditional subgraphs)
- **Γ↔Ω**: Can a gate produce a witness? (Audit of routing decisions)
- **Β↔Ω**: Can a binding be witnessed? (Audit of name resolution)

> **ACTION ITEM GR-03:** Evaluate each ⚠️ cell. For interactions that exist in
> implementation, add grammar rules. For interactions that should be prohibited,
> add explicit exclusion clauses.

---

## 5. T4 — Engineering Bridge Cross-Reference

### 5.1 Formula Inventory

The Engineering Bridge maps formal morphemes and grammar rules to concrete
implementation formulas (computational functions, data structures, module
boundaries).

| Bridge ID | Spec Formula | Implementation Location | Status |
|---|---|---|---|
| EB-01 | Signal amplitude normalisation | `src/computation/signals/normalize.js` | ✅ Current |
| EB-02 | Transform composition operator | `src/computation/transforms/compose.js` | ✅ Current |
| EB-03 | Composite construction | `src/computation/composite/build.js` | ⚠️ Stale |
| EB-04 | Binding resolution | `src/computation/binding/resolve.js` | ✅ Current |
| EB-05 | Gate evaluation | `src/computation/gates/evaluate.js` | ⚠️ Stale |
| EB-06 | Witness generation | `src/computation/witness/generate.js` | ✅ Current |
| EB-07 | Witness verification | `src/computation/witness/verify.js` | ⚠️ Stale |
| EB-08 | Signal quality metric | `src/computation/signals/quality.js` | ✅ Current |
| EB-09 | Composite hash derivation | `src/computation/composite/hash.js` | ✅ Current |
| EB-10 | End-to-end pipeline formula | `src/computation/pipeline/run.js` | ✅ Current |

### 5.2 Stale Formulas

#### Finding EB-01 — Composite construction formula is stale (EB-03)

**Severity: High**

The spec defines composite construction as:

```
Κ(children) = fold(compose, children)
```

The implementation now uses a builder pattern with validation hooks:

```js
// Actual implementation (composite/build.js)
export function buildComposite(children, options) {
  const validated = children.map(validateChild);
  return validated.reduce(
    (acc, child) => composeWithHooks(acc, child, options.hooks),
    identity()
  );
}
```

The validation step and hook system are not reflected in the spec formula.

> **ACTION ITEM EB-01:** Update EB-03 formula to include validation and
> hook composition. Alternatively, determine if the hooks violate Parsimony
> (A9) and should be removed from the implementation.

#### Finding EB-02 — Gate evaluation formula is stale (EB-05)

**Severity: High**

The spec defines gate evaluation as:

```
Γ(condition, signalTrue, signalFalse) = condition ? signalTrue : signalFalse
```

The implementation now supports multi-way gates (not just boolean):

```js
// Actual implementation (gates/evaluate.js)
export function evaluateGate(condition, branches, defaultBranch) {
  const selected = branches.find(b => b.matches(condition));
  return selected ? selected.signal : defaultBranch;
}
```

The spec's binary model does not match the implementation's multi-branch model.

> **ACTION ITEM EB-02:** Update EB-05 to reflect multi-way gate evaluation.
> Update Grammar Rule G3 accordingly (currently assumes binary gating).

#### Finding EB-03 — Witness verification formula is stale (EB-07)

**Severity: High**

The spec defines witness verification as:

```
verify(Ω, Κ) = hash(Κ) === Ω.attestation
```

The implementation now uses a Merkle-path verification that checks not just the
composite hash but the full derivation tree:

```js
// Actual implementation (witness/verify.js)
export function verifyWitness(witness, composite) {
  return witness.merklePath.every((node, depth) =>
    node.hash === computeHash(composite, depth)
  );
}
```

The spec formula is a simplified version that would pass for leaf witnesses
but fail for nested composites.

> **ACTION ITEM EB-03:** Update EB-07 to reflect Merkle-path verification.
> This may also require updating Grammar Rule G4 (Witnessing) to describe
> tree-structured attestation.

---

## 6. T5 — Aspirational vs Implemented

### 6.1 Methodology

Each spec section was classified as:

- **Implemented**: Corresponding code exists, tests pass, behaviour matches spec.
- **Partially Implemented**: Code exists but diverges from spec or lacks tests.
- **Aspirational**: No corresponding implementation; spec describes future intent.

### 6.2 Aspirational Features Described as Implemented

#### Finding ASP-01 — Distributed witness consensus

**Severity: High**

Section 7.4 of the spec describes a protocol where multiple independent
witnesses attest to the same computation and a consensus mechanism resolves
disagreements. The language uses present tense ("witnesses reach consensus
via...") and includes a formula.

**Implementation status:** No distributed witness code exists. All witnessing
is single-node. There is no consensus protocol, no multi-witness data
structure, and no tests for disagreement resolution.

> **ACTION ITEM ASP-01:** Reclassify Section 7.4 as "Future Direction" or
> "Planned." Change language from present tense to future/conditional tense.

#### Finding ASP-02 — Adaptive gate thresholds

**Severity: High**

Section 5.3 describes gates that automatically adjust their thresholds based
on signal statistics ("the gate adapts its threshold using an exponential
moving average of recent signal amplitudes").

**Implementation status:** Gate thresholds are static configuration values.
No adaptive threshold code exists. The `evaluateGate` function takes a fixed
condition with no statistical tracking.

> **ACTION ITEM ASP-02:** Reclassify Section 5.3 adaptive thresholds as
> "Future Direction" or implement the feature with corresponding tests.

#### Finding ASP-03 — Cross-composite binding inheritance

**Severity: Medium**

Section 4.2 states that bindings in a parent composite are "inherited by all
descendant composites unless explicitly shadowed." This implies lexical scoping
across the composite tree.

**Implementation status:** Binding resolution is flat. Each composite maintains
its own binding map. There is no parent-traversal in `resolve.js`. Bindings
are explicitly passed, not inherited.

> **ACTION ITEM ASP-03:** Either implement binding inheritance or rewrite
> Section 4.2 to describe the current flat-binding model.

#### Finding ASP-04 — Signal type refinement

**Severity: Medium**

Section 3.1 describes a type refinement system where signals carry
progressively narrower type information as they pass through transforms
("after passing through Τ, the signal's type is refined from `Signal<A>` to
`Signal<A & B>`").

**Implementation status:** Signals are untyped at runtime. There is no type
narrowing mechanism. The JSDoc annotations in the codebase use simple types
without intersection/refinement.

> **ACTION ITEM ASP-04:** Either implement signal type refinement or rewrite
> Section 3.1 to describe the current untyped model. If type refinement is
> desired, consider implementing via TypeScript migration.

---

## 7. Consolidated Action Items

| ID | Finding | Severity | Category | Recommendation |
|---|---|---|---|---|
| AX-01 | A1 (Symbiosis) subsumed by A2 + A3 | High | Axiom | Demote to preamble |
| AX-02 | A7 (Traceability) overlaps A2 (Transparency) | Medium | Axiom | Add scoping clauses |
| AX-03 | A10 (Evolution) not testable | Medium | Axiom | Move to governance section |
| AX-04 | Axiom ordering not operational | Medium | Axiom | Reorder or add priority clause |
| MO-01 | No Error morpheme | Medium | Morpheme | Evaluate adding Ε morpheme |
| MO-02 | No Time morpheme | Low | Morpheme | Flag for future review |
| GR-01 | No parallel composition rule | Medium | Grammar | Add Fanout rule (G6) |
| GR-02 | No feedback / cycle rule | Medium | Grammar | Decide on acyclicity; add rule or constraint |
| GR-03 | Morpheme interaction gaps | Medium | Grammar | Evaluate all ⚠️ cells in matrix |
| EB-01 | Composite construction formula stale | High | Bridge | Update EB-03 formula |
| EB-02 | Gate evaluation formula stale | High | Bridge | Update EB-05 formula |
| EB-03 | Witness verification formula stale | High | Bridge | Update EB-07 formula |
| ASP-01 | Distributed witness consensus aspirational | High | Aspirational | Reclassify as future |
| ASP-02 | Adaptive gate thresholds aspirational | High | Aspirational | Reclassify or implement |
| ASP-03 | Cross-composite binding inheritance aspirational | Medium | Aspirational | Reclassify or implement |
| ASP-04 | Signal type refinement aspirational | Medium | Aspirational | Reclassify or implement |

**Total: 16 action items (6 High, 8 Medium, 2 Low)**

---

## 8. Recommended Prioritisation

### Phase 1 — Spec Integrity (immediate)

These items fix the specification itself and require no implementation changes:

1. **AX-01** — Resolve Symbiosis subsumption
2. **AX-03** — Move Evolution to governance
3. **ASP-01** — Reclassify distributed witness consensus
4. **ASP-02** — Reclassify adaptive gate thresholds
5. **AX-02** — Add Transparency / Traceability scoping clauses

### Phase 2 — Bridge Synchronisation (next sprint)

These items synchronise the spec with existing implementation:

6. **EB-01** — Update composite construction formula
7. **EB-02** — Update gate evaluation formula
8. **EB-03** — Update witness verification formula
9. **ASP-03** — Resolve binding inheritance (spec or code)
10. **ASP-04** — Resolve signal type refinement (spec or code)

### Phase 3 — Structural Enhancements (planned)

These items extend the spec's expressive power:

11. **MO-01** — Evaluate Error morpheme
12. **GR-01** — Add Fanout grammar rule
13. **GR-02** — Decide on cycles
14. **GR-03** — Fill morpheme interaction matrix
15. **AX-04** — Establish axiom priority ordering

### Phase 4 — Future Review

16. **MO-02** — Reassess Time morpheme need

---

*End of review report. This document should be updated as action items are
resolved. Each action item should be converted to a tracked issue in the
project's issue tracker.*
