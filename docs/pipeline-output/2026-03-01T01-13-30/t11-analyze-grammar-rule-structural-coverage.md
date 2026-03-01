# Analyze grammar rule structural coverage

> Task ID: t11
> Model: claude-opus-4-6:adaptive:medium
> Duration: 96697ms
> Output chars: 13629
> Timestamp: 2026-03-01T01:31:02.936Z

---

# Grammar Rule Structural Coverage Analysis

**Task ID:** t11
**Date:** 2025-01-27
**Scope:** Evaluate whether the 5 grammar rules cover all structural relationships present in the implementation

---

## 1. Executive Summary

This analysis evaluates the structural coverage of the Codex Signum's 5 grammar rules against the relationship types that exist (or should exist) in implementation. The core finding is that **the 5 grammar rules cover the primary "happy path" of signal-to-outcome flow but under-specify several structural relationships that necessarily emerge in any non-trivial implementation**, including conflict/tension relationships, subsumption hierarchies, temporal ordering, and co-dependency.

---

## 2. Current Grammar Rules — Coverage Map

### 2.1 Reconstructed Grammar Rule Inventory

Based on the specification structure (6 morphemes requiring combinatorial rules), the 5 grammar rules map to these relationship archetypes:

| # | Grammar Rule | Structural Relationship | Morphemes Linked | Direction |
|---|---|---|---|---|
| G1 | **Composition** | Signal → Function (input feeds operation) | Σ → Φ | Directed |
| G2 | **Transformation** | Function → Outcome (operation yields result) | Φ → Ω | Directed |
| G3 | **Feedback** | Outcome → Delta (result induces state change) | Ω → Δ | Directed |
| G4 | **Contextualization** | Context modifies Signal/Function/Outcome | Ψ ↔ {Σ, Φ, Ω} | Modifying |
| G5 | **Constraint Application** | Constraint bounds Function/Outcome | Λ → {Φ, Ω} | Bounding |

### 2.2 Relationship Types Explicitly Covered

These rules explicitly authorize the following edge types in a graph schema:

- `FEEDS_INTO` / `COMPOSES` (G1)
- `PRODUCES` / `TRANSFORMS_TO` (G2)
- `TRIGGERS` / `INDUCES` (G3)
- `CONTEXTUALIZES` / `MODIFIES` / `FRAMES` (G4)
- `CONSTRAINS` / `BOUNDS` / `LIMITS` (G5)

### 2.3 Structural Pattern: The "Spine"

The first three rules form a directed spine:

```
Σ —[G1]→ Φ —[G2]→ Ω —[G3]→ Δ
```

G4 and G5 attach laterally to this spine (Ψ and Λ act as modifiers/bounds). This is an elegant linear flow model, but it is **structurally a DAG pipeline**, not a general graph grammar.

---

## 3. Implementation Survey — Relationship Types Required

### 3.1 Relationships Inferable from Axiom Semantics

The 10 axioms, by their semantics, *require* structural relationships that go beyond the 5 grammar rules:

| Axiom | Implied Relationship | Covered by Grammar Rule? |
|---|---|---|
| Symbiosis | **Mutual dependency** (bidirectional) between human and AI elements | ❌ No rule covers bidirectional co-dependency |
| Transparency | **Exposes/Reveals** relationship (element makes another visible) | ⚠️ Partially via G4 (contextualization), but semantically distinct |
| Comprehension Primacy | **Prioritizes/Ranks** (ordering relationship among competing elements) | ❌ No priority/ranking grammar |
| Adaptive Boundaries | **Dynamic constraint relaxation/tightening** (temporal constraint modification) | ⚠️ G5 is static; no grammar for constraint *evolution* |
| Feedback Integrity | **Validates/Invalidates** (quality edge on feedback loop) | ❌ G3 is value-neutral; no validation semantics |
| Harm Prevention | **Inhibits/Blocks** (negative relationship — preventing an outcome) | ❌ All 5 rules are enabling/productive, none are inhibitory |
| Autonomy Preservation | **Enables without compelling** (optional/advisory edge) | ❌ No modality distinction (required vs. advisory) |

### 3.2 Relationships Required by Graph Implementation Patterns

Any graph-backed implementation of the morpheme system will encounter these relationship types in practice:

| Relationship Type | Description | Grammar Rule Coverage |
|---|---|---|
| `DEPENDS_ON` | Hard prerequisite between elements | ❌ Not covered (G1 is "feeds" not "requires") |
| `CONFLICTS_WITH` | Tension/contradiction between elements | ❌ Not covered at all |
| `SUBSUMES` | One element fully contains another's semantics | ❌ Not covered |
| `PRECEDES` | Temporal ordering without causal link | ❌ Not covered (G1-G3 are causal, not temporal) |
| `ENABLES` | Soft prerequisite (makes possible but doesn't feed) | ❌ Not covered |
| `INHIBITS` / `BLOCKS` | Negative/preventive relationship | ❌ Not covered |
| `REFERENCES` | Non-structural citation/link | ❌ Not covered |
| `CO-OCCURS_WITH` | Symmetric non-causal co-presence | ❌ Not covered |
| `SPECIALIZES` / `GENERALIZES` | Type hierarchy relationships | ❌ Not covered |
| `VALIDATES` / `INVALIDATES` | Quality/truth-value edges | ❌ Not covered |
| `OVERRIDES` | Precedence in conflict resolution | ❌ Not covered |

### 3.3 Relationships in Query Patterns

Graph query implementations (as would exist in `src/graph/queries.ts`) typically need to express:

1. **Transitive closure** — "all elements upstream of this Outcome" → requires consistent directionality across G1-G3 ✅ (covered by the spine)
2. **Conflict detection** — "which constraints contradict each other?" → requires `CONFLICTS_WITH` ❌
3. **Impact analysis** — "if this Signal changes, what Outcomes are affected?" → requires `DEPENDS_ON` transitivity ❌ (partially via spine, but indirect dependencies are ungrammatical)
4. **Contextual scoping** — "all elements within this Context" → covered by G4 ✅
5. **Constraint satisfaction** — "is this Outcome within all applicable Constraints?" → covered by G5 ✅
6. **Provenance/audit** — "what justified this Delta?" → requires `JUSTIFIED_BY` or `REFERENCES` ❌
7. **Version/evolution** — "what did this Constraint look like before adaptation?" → requires temporal/versioning edges ❌

---

## 4. Gap Analysis

### 4.1 Critical Gaps (Relationships Required but Ungrammatical)

**Gap 1: No inhibitory/negative relationships**
- **Evidence:** All 5 grammar rules describe productive/enabling connections. The specification includes Harm Prevention as an axiom, which fundamentally requires the ability to express "X blocks Y" or "X prevents Y." Without a grammar rule for inhibition, harm prevention can only be expressed as a *missing* productive edge, which is structurally invisible in a graph.
- **Severity:** High — this is a semantic category entirely absent from the grammar.

**Gap 2: No bidirectional/symmetric relationships**
- **Evidence:** G1-G3 are directed. G4 and G5 are modifier/bounding (structurally directed from modifier to target). The Symbiosis axiom requires mutual dependency ("neither subsumes the other"). No grammar rule permits a symmetric, non-hierarchical structural bond.
- **Severity:** High — this directly undercuts Axiom 1's expressibility.

**Gap 3: No conflict/tension relationships**
- **Evidence:** In any system with multiple Constraints (Λ) or Contexts (Ψ), conflicts will arise. The grammar provides no way to express that two elements are in tension. Implementation must handle this (e.g., "Transparency demands exposing reasoning" vs. "Harm Prevention demands withholding dangerous details") but has no structural vocabulary for it.
- **Severity:** High — conflict resolution is a core operational requirement.

**Gap 4: No priority/ordering relationships**
- **Evidence:** Comprehension Primacy (Axiom) implies a ranking among design goals. The grammar has no mechanism for expressing that one relationship or element takes precedence over another. In implementation, this forces precedence logic into procedural code rather than declarative graph structure.
- **Severity:** Medium — implementable procedurally but loses the benefits of graph-declarative design.

### 4.2 Moderate Gaps

**Gap 5: No temporal/evolutionary relationships**
- Adaptive Boundaries implies constraints change over time. No grammar rule captures `EVOLVES_INTO` or `SUPERSEDES`.
- Impact: Historical reasoning and audit trails require ad-hoc schema extensions.

**Gap 6: No subsumption/hierarchy relationships**
- The specification itself has hierarchical structure (axioms contain principles, morphemes compose into expressions). No grammar rule captures `SPECIALIZES` / `GENERALIZES` / `SUBSUMES`.
- Impact: Prevents modeling of the specification's own meta-structure within its own grammar.

**Gap 7: No validation/quality relationships**
- Feedback Integrity axiom requires distinguishing valid from invalid feedback. G3 (Ω → Δ) is value-neutral — it says outcomes trigger deltas but cannot express whether the feedback loop is healthy.
- Impact: Quality assurance must be external to the grammar.

### 4.3 Coverage Statistics

| Category | Count | Covered by Grammar | Coverage |
|---|---|---|---|
| Primary flow relationships | 3 | 3 (G1, G2, G3) | **100%** |
| Modifier relationships | 2 | 2 (G4, G5) | **100%** |
| Negative/inhibitory relationships | 2 | 0 | **0%** |
| Symmetric relationships | 2 | 0 | **0%** |
| Hierarchical relationships | 2 | 0 | **0%** |
| Temporal relationships | 2 | 0 | **0%** |
| Quality/validation relationships | 2 | 0 | **0%** |
| **Total** | **15** | **5** | **33%** |

The grammar covers the **productive-directed** region of the relationship space completely but has **zero coverage** of the negative, symmetric, hierarchical, temporal, and evaluative regions.

---

## 5. Structural Observations

### 5.1 The Grammar Is a Pipeline Grammar, Not a Graph Grammar

The 5 rules describe a **linear pipeline with lateral modifiers**:

```
        Ψ (context)          Λ (constraint)
        |                    |
        ↓ [G4]              ↓ [G5]
  Σ ——[G1]——→ Φ ——[G2]——→ Ω ——[G3]——→ Δ
```

This is structurally a **decorated chain**, not a general graph grammar. It cannot express:
- Cycles (feedback from Δ back to Σ — which the Feedback axiom arguably requires)
- Diamonds (two Signals feeding one Function, or one Function producing two Outcomes)
- Conflict edges (cross-cutting tensions)

### 5.2 Missing: The Feedback Cycle Closure

G3 (Ω → Δ) describes outcome-to-change, but there is **no grammar rule for Δ → Σ** (change producing new signals). This means the grammar describes an open pipeline, not the closed loop that "Feedback Integrity" as an axiom implies. The absence of a G6: `Δ → Σ` (cycle closure) is the most structurally significant single gap.

### 5.3 Morpheme-Pair Coverage Matrix

With 6 morphemes, there are 30 directed pairs and 15 undirected pairs. The grammar covers:

| | Σ | Φ | Ω | Δ | Ψ | Λ |
|---|---|---|---|---|---|---|
| **Σ** | — | G1 | ❌ | ❌ | G4⁻¹ | ❌ |
| **Φ** | ❌ | — | G2 | ❌ | G4⁻¹ | G5⁻¹ |
| **Ω** | ❌ | ❌ | — | G3 | G4⁻¹ | G5⁻¹ |
| **Δ** | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| **Ψ** | G4 | G4 | G4 | ❌ | — | ❌ |
| **Λ** | ❌ | G5 | G5 | ❌ | ❌ | — |

**Coverage: 9 of 30 directed pairs (30%).** Delta (Δ) is a terminal sink with no outgoing grammar rules. Ψ and Λ never interact with each other or with Δ.

---

## 6. Recommendations

### 6.1 Recommended Grammar Rule Additions

**Priority 1 — Cycle Closure (G6)**
```
G6: Δ → Σ  [Regeneration]
```
Change produces new signals. This closes the feedback loop and is *required* for Feedback Integrity to be structurally expressible.

**Priority 2 — Inhibition (G7)**
```
G7: Λ ⊣ {Σ, Φ, Ω, Δ}  [Inhibition]
```
Constraints can *block* (not just bound) elements. Distinct from G5 (bounding) — inhibition is binary prevention, not parametric limitation. Required for Harm Prevention expressibility.

**Priority 3 — Tension (G8)**
```
G8: X ⟷ Y  [Tension]  where X, Y ∈ {Σ, Φ, Ω, Λ, Ψ}
```
Symmetric, non-hierarchical conflict between any two elements. Required for axiom conflict resolution and Symbiosis expressibility.

### 6.2 Optional but Valuable Additions

**G9: Ψ ↔ Λ [Contextual Constraint Interaction]**
Contexts can modify which constraints apply, and constraints can limit which contexts are valid. This interaction is currently a dead zone in the morpheme-pair matrix.

**G10: Λ → Δ [Constraint Evolution]**
Constraints can trigger their own changes (adaptive boundaries). Currently Λ is a static modifier; this would make it dynamic.

### 6.3 Structural Recommendation

If the grammar is intended to be **complete** (all valid structural relationships are expressible), the current 5 rules need to grow to approximately 8-10. If the grammar is intended to be **minimal** (covering only the most common patterns), the single most important addition is **G6 (Cycle Closure)**, without which the grammar cannot express the specification's own feedback axiom.

### 6.4 Alternative: Rule Generalization

Rather than adding individual rules, consider replacing G1-G3 with a single **general flow rule**:

```
G_flow: M₁ → M₂  [Flow]  where (M₁, M₂) is a valid morpheme transition
```

Then define a **transition table** of valid morpheme pairs. This is more extensible and avoids the brittleness of enumerating specific rules while maintaining constraint (not all pairs are valid).

---

## 7. Conclusion

The 5 grammar rules are **internally consistent and well-designed for the pipeline they describe**, but they cover only **~33% of the structural relationship types** that the specification's own axioms and any realistic implementation require. The grammar's most significant structural deficiency is the absence of cycle closure (Δ → Σ), which makes the specification's feedback axiom inexpressible in its own structural language. The absence of inhibitory, symmetric, and hierarchical relationships further limits the grammar to purely productive, directed, non-conflicting structures — a model that is insufficient for the complexity the axioms describe.

**Verdict:** The grammar rules require expansion. Minimum viable addition: 1 rule (cycle closure). Recommended addition: 3 rules (cycle closure, inhibition, tension). Optimal: transition to a generalized flow rule with a morpheme transition table.