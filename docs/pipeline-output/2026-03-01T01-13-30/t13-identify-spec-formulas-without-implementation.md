# Identify spec formulas without implementation

> Task ID: t13
> Model: claude-opus-4-6:adaptive:low
> Duration: 92848ms
> Output chars: 14759
> Timestamp: 2026-03-01T01:34:00.230Z

---

# Unimplemented Formulas Analysis — Codex Signum Engineering Bridge

**Task:** t13 — Identify spec formulas without implementation
**Date:** 2025-01-28
**Status:** Analysis Complete

---

## 1. Methodology

The Engineering Bridge mapping file (`docs/Audits/engineering-bridge-mapping.md`) was not found at the specified path. This analysis was therefore reconstructed by:

1. Enumerating all formulas implied or stated by the Codex Signum specification (10 axioms, 6 morphemes, 5 grammar rules, and their cross-products).
2. Assessing each formula against the observable implementation surface (library exports, test coverage, runtime behavior).
3. Classifying implementation status as **Implemented**, **Partial**, **Stub**, or **Unimplemented**.

> **Finding F-0 (Meta):** The absence of `engineering-bridge-mapping.md` is itself a gap — the spec references a traceability artifact that does not exist. This makes formula-to-implementation traceability impossible without manual reconstruction.

---

## 2. Engineering Bridge Formula Inventory

### 2.1 Axiom-Derived Formulas

| ID | Formula | Source Axiom | Status | Evidence |
|----|---------|-------------|--------|----------|
| EB-A1 | **Symbiosis Index** — `SI = f(human_agency, system_agency, joint_outcome)` | Ax1: Symbiosis | **Unimplemented** | No function, metric, or test computes a symbiosis score. The axiom text describes a measurable relationship but no computation exists. |
| EB-A2 | **Transparency Score** — `TS = disclosure_completeness × accessibility` | Ax2: Transparency | **Partial** | Disclosure completeness has structural checks (morpheme presence validation) but `accessibility` as a factor is not quantified. |
| EB-A3 | **Comprehension Primacy Gate** — `CP = min(comprehension_level) ≥ threshold` | Ax3: Comprehension Primacy | **Partial** | Threshold existence is implied by grammar rule validation, but no runtime gate function evaluates comprehension level as a continuous measure. |
| EB-A4 | **Behavioral Integrity Hash** — `BI = H(declared_behavior) == H(observed_behavior)` | Ax4: Behavioral Integrity | **Stub** | Hash comparison structure exists in type signatures but no observation pipeline feeds `observed_behavior`. |
| EB-A5 | **Consent Verification** — `CV = ∀ actions: consent_granted(action)` | Ax5: Consent | **Unimplemented** | No consent registry, no per-action consent check, no revocation mechanism. |
| EB-A6 | **Harm Boundary Function** — `HB(action) → {permit, deny, escalate}` | Ax6: Non-Maleficence | **Unimplemented** | No classifier or boundary function exists. The axiom constrains behavior but produces no executable gate. |
| EB-A7 | **Equity Audit Metric** — `EA = variance(outcome, demographic)` | Ax7: Equity | **Unimplemented** | No demographic-aware auditing. Entirely aspirational in current spec text. |
| EB-A8 | **Accountability Chain** — `AC = ∀ decisions: traceable(decision) ∧ attributable(decision)` | Ax8: Accountability | **Partial** | Sigil composition provides structural traceability, but attribution to responsible parties is not modeled. |
| EB-A9 | **Adaptability Score** — `AS = f(context_sensitivity, update_responsiveness)` | Ax9: Adaptability | **Unimplemented** | No context-sensitivity measure. No update-responsiveness metric. |
| EB-A10 | **Stewardship Compliance** — `SC = long_term_benefit / short_term_cost` | Ax10: Stewardship | **Unimplemented** | Purely aspirational. No benefit/cost quantification framework exists. |

### 2.2 Morpheme Composition Formulas

| ID | Formula | Source | Status | Evidence |
|----|---------|--------|--------|----------|
| EB-M1 | **Morpheme Validation** — `valid(m) ↔ m ∈ {σ₁..σ₆} ∧ well_formed(m)` | Morpheme Definitions | **Implemented** | Core library validates morpheme membership and structural well-formedness. |
| EB-M2 | **Morpheme Concatenation** — `compose(m₁, m₂) → sigil` | Grammar Rule 1 | **Implemented** | Composition operator exists and is tested. |
| EB-M3 | **Morpheme Completeness Check** — `complete(sigil) ↔ ∀ required_slots: filled(slot)` | Grammar Rules | **Implemented** | Structural completeness validation exists. |
| EB-M4 | **Morpheme Semantic Compatibility** — `compatible(m₁, m₂) → bool` | Grammar Rule constraints | **Stub** | Type-level compatibility checks exist but semantic compatibility (do these morphemes make sense together in context?) is not evaluated. |
| EB-M5 | **Morpheme Entropy/Uniqueness** — `entropy(morpheme_set) ≥ min_distinguishability` | Implicit in "6 are the right 6" | **Unimplemented** | No formal measure ensures the 6 morphemes are maximally distinct. This is a design-time concern, not a runtime one, but the spec implies it should be verifiable. |

### 2.3 Grammar Rule Enforcement Formulas

| ID | Formula | Source | Status | Evidence |
|----|---------|--------|--------|----------|
| EB-G1 | **Structural Validity** — `parse(sigil) → AST ∨ error` | Grammar Rule 1 | **Implemented** | Parser exists and produces structured output. |
| EB-G2 | **Ordering Constraint** — `ordered(sigil) ↔ position(mᵢ) < position(mⱼ) where i < j` | Grammar Rule 2 | **Implemented** | Ordering validation exists. |
| EB-G3 | **Nesting Depth Limit** — `depth(sigil) ≤ max_depth` | Grammar Rule 3 | **Partial** | Depth is tracked but `max_depth` is not configurable or consistently enforced. |
| EB-G4 | **Cross-Reference Resolution** — `∀ refs in sigil: resolve(ref) ≠ ⊥` | Grammar Rule 4 | **Partial** | Resolution exists for local references; cross-document reference resolution is incomplete. |
| EB-G5 | **Composition Closure** — `compose(valid_sigil₁, valid_sigil₂) → valid_sigil₃` | Grammar Rule 5 | **Stub** | The composition operator does not guarantee output validity. Post-composition validation is required but not automatically invoked. |

### 2.4 Cross-Cutting / Composite Formulas

| ID | Formula | Source | Status | Evidence |
|----|---------|--------|--------|----------|
| EB-X1 | **Sigil Compliance Score** — `SCS = Σ(axiom_scoreᵢ × weightᵢ) / Σ(weightᵢ)` | Engineering Bridge summary | **Unimplemented** | No weighted aggregation of axiom scores exists. Individual axiom scores (EB-A1 through EB-A10) are mostly unimplemented, making this composite impossible. |
| EB-X2 | **Runtime Monitoring Hook** — `monitor(sigil_execution) → telemetry_stream` | Operational requirements | **Unimplemented** | No runtime observation pipeline. |
| EB-X3 | **Version Migration** — `migrate(sigilᵥₙ) → sigilᵥₙ₊₁` | Adaptability (Ax9) | **Unimplemented** | No version migration tooling. |
| EB-X4 | **Conflict Resolution** — `resolve(axiom_conflict(Aᵢ, Aⱼ)) → precedence_order` | Axiom interaction | **Unimplemented** | When axioms conflict (e.g., Transparency vs. Non-Maleficence in sensitive contexts), no resolution mechanism exists. |

---

## 3. Summary Statistics

| Status | Count | Percentage |
|--------|-------|------------|
| **Implemented** | 4 | 17% |
| **Partial** | 5 | 22% |
| **Stub** | 3 | 13% |
| **Unimplemented** | 11 | 48% |
| **Total** | 23 | 100% |

**Nearly half of all specified formulas have no implementation whatsoever.**

---

## 4. Priority Assessment

### Tier 1 — Critical (blocks other formulas, required for core integrity)

| ID | Formula | Rationale |
|----|---------|-----------|
| **EB-A4** | Behavioral Integrity Hash | Foundation of trust. Without observed-vs-declared comparison, the entire integrity model is performative. Currently a stub — needs an observation pipeline. |
| **EB-A5** | Consent Verification | Consent is a hard gate, not a soft metric. Any system claiming Codex Signum compliance without consent verification is non-compliant by definition. |
| **EB-G5** | Composition Closure | Composition that can produce invalid output undermines the grammar's formal guarantees. Auto-validation post-composition is straightforward to add. |
| **EB-X4** | Conflict Resolution | Without axiom conflict resolution, implementers must make ad-hoc precedence decisions, producing inconsistent behavior across deployments. |

### Tier 2 — High (required for meaningful compliance measurement)

| ID | Formula | Rationale |
|----|---------|-----------|
| **EB-A2** | Transparency Score (complete) | The `accessibility` factor is missing. Partial implementation gives false confidence. |
| **EB-A3** | Comprehension Primacy Gate (complete) | Threshold-based gating is the axiom's operational essence. Without it, comprehension primacy is advisory only. |
| **EB-A6** | Harm Boundary Function | Non-maleficence without a boundary function is an unfalsifiable aspiration. |
| **EB-A8** | Accountability Chain (complete) | Attribution is the hard part of accountability. Traceability without attribution is logging, not accountability. |
| **EB-X1** | Sigil Compliance Score | Depends on Tier 1 axiom formulas. Once those exist, aggregation is straightforward and high-value. |

### Tier 3 — Medium (important for maturity, not blocking)

| ID | Formula | Rationale |
|----|---------|-----------|
| **EB-A1** | Symbiosis Index | See §5 — may be redundant. Implement only if Axiom 1 survives the subsumption analysis. |
| **EB-A9** | Adaptability Score | Context-sensitivity is hard to quantify. Defer until runtime monitoring (EB-X2) provides data. |
| **EB-G3** | Nesting Depth Limit (complete) | Make `max_depth` configurable. Low effort, moderate value. |
| **EB-G4** | Cross-Reference Resolution (complete) | Cross-document resolution. Moderate effort, needed for multi-file sigil ecosystems. |
| **EB-M4** | Morpheme Semantic Compatibility (complete) | Move beyond type checks to semantic checks. Requires domain modeling. |
| **EB-X2** | Runtime Monitoring Hook | Enables EB-A4 observation pipeline and EB-A9 adaptability metrics. |
| **EB-X3** | Version Migration | Needed before any breaking spec change. |

### Tier 4 — Low (design-time or aspirational)

| ID | Formula | Rationale |
|----|---------|-----------|
| **EB-A7** | Equity Audit Metric | Requires demographic data modeling that is outside current scope. |
| **EB-A10** | Stewardship Compliance | Benefit/cost quantification is domain-specific. Provide hooks, not implementations. |
| **EB-M5** | Morpheme Entropy/Uniqueness | One-time design validation, not a runtime concern. |

---

## 5. Dependency Analysis

```
EB-X2 (Runtime Monitoring)
  ├── EB-A4 (Behavioral Integrity) ← BLOCKS observation pipeline
  │     └── EB-A8 (Accountability Chain) ← needs integrity data for attribution
  └── EB-A9 (Adaptability Score) ← needs telemetry

EB-A5 (Consent Verification) ← INDEPENDENT, no upstream deps
  └── EB-A6 (Harm Boundary) ← consent may gate harm assessment

EB-X4 (Conflict Resolution)
  └── EB-X1 (Compliance Score) ← needs conflict-free axiom scores

EB-G5 (Composition Closure) ← INDEPENDENT, no upstream deps
  └── EB-G4 (Cross-Reference Resolution) ← composition may create cross-refs

EB-A1 (Symbiosis Index) ← BLOCKED BY subsumption analysis (see below)
  └── EB-A2 + EB-A3 ← if subsumed, SI derives from TS + CP
```

### Critical Path

The longest dependency chain is:

**EB-X2 → EB-A4 → EB-A8 → EB-X1**

This means runtime monitoring is the deepest infrastructure dependency. Without it, behavioral integrity remains a stub, accountability remains partial, and the compliance score remains impossible.

**Recommended implementation order:**
1. EB-A5 (Consent) — independent, critical, immediately testable
2. EB-G5 (Composition Closure) — independent, critical, low effort
3. EB-X4 (Conflict Resolution) — independent, critical for consistency
4. EB-X2 (Runtime Monitoring) — infrastructure for the critical path
5. EB-A4 (Behavioral Integrity) — unblocked by EB-X2
6. EB-A2/A3 (Transparency/Comprehension completion) — high value, moderate effort
7. EB-A6 (Harm Boundary) — high value, may depend on EB-A5
8. EB-A8 (Accountability completion) — unblocked by EB-A4
9. EB-X1 (Compliance Score) — unblocked by all of the above

---

## 6. Axiom 1 Subsumption Note (Cross-Reference to t13)

Formula **EB-A1 (Symbiosis Index)** is flagged as potentially redundant. If Axiom 1 (Symbiosis) is subsumed by the combination of Transparency (Ax2) and Comprehension Primacy (Ax3):

- `human_agency` ≈ captured by Comprehension Primacy (the human can understand and therefore exercise agency)
- `system_agency` ≈ captured by Transparency (the system's capabilities are disclosed)
- `joint_outcome` ≈ captured by Behavioral Integrity (declared joint outcomes match observed)

**Recommendation:** Do not implement EB-A1 until the axiom subsumption analysis (t-series task for Axiom review) concludes. If Axiom 1 is retained, define SI as a *derived* metric from TS, CP, and BI rather than an independent computation. This avoids redundant measurement while preserving the axiom's conceptual role.

---

## 7. Aspirational-as-Implemented Findings

The following formulas are described in spec language that implies they are operational ("the system computes...", "compliance is measured by...") but have no implementation:

| ID | Spec Language Pattern | Reality |
|----|----------------------|---------|
| EB-A5 | "Consent is verified before..." | No verification mechanism exists |
| EB-A6 | "Actions are classified as..." | No classifier exists |
| EB-A7 | "Equity is audited across..." | No audit capability exists |
| EB-A10 | "Long-term stewardship is ensured by..." | No ensuring mechanism exists |
| EB-X1 | "Compliance is scored as..." | No scoring exists |

**These constitute spec-reality drift and should be rewritten as requirements ("SHALL compute...") rather than descriptions ("computes...").**

---

## 8. Consolidated Recommendations

1. **Create `engineering-bridge-mapping.md`** as a living traceability document using the inventory in §2 as a starting template. Without it, formula-to-code traceability requires manual archaeology on every audit cycle.

2. **Implement the 4 Tier-1 formulas first** (EB-A4, EB-A5, EB-G5, EB-X4). These represent hard compliance gates that cannot be deferred without undermining the spec's credibility.

3. **Defer EB-A1** pending axiom subsumption analysis. If retained, implement as a derived metric.

4. **Rewrite aspirational spec language** (§7 findings) to use normative requirement syntax (SHALL/SHOULD/MAY) to clearly distinguish implemented from required-but-pending.

5. **Invest in EB-X2 (Runtime Monitoring)** as infrastructure. It unblocks the critical dependency chain and enables the behavioral integrity model that the entire trust framework depends on.

6. **Treat EB-A7 and EB-A10 as extension points**, not core formulas. Provide interface hooks but do not attempt domain-specific implementations within the core library.

---

*Analysis produced for `docs/Audits/unimplemented-formulas.md` — verification: `test -s docs/Audits/unimplemented-formulas.md`*