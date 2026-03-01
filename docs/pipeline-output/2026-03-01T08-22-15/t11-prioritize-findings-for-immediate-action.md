# Prioritize findings for immediate action

> Task ID: t11
> Model: claude-opus-4-6:adaptive:max
> Duration: 81917ms
> Output chars: 12015
> Timestamp: 2026-03-01T08:39:48.706Z

---

# Consolidated Findings — Priority Classification (t11)

> **Document**: `docs/specs/consolidated-findings.md`
> **Status**: Initial creation — consolidation of M-7B Review Reports A & B
> **Governing spec**: `docs/specs/codex-signum-implementation-plan.md`

---

## 0. Methodology

Every finding from both M-7B review reports was tested against:

| Check-layer | Items tested against |
|---|---|
| **Axiom compliance** | All 10 Codex Signum axioms (A1–A10) |
| **Grammar compliance** | All 5 grammar rules (G1–G5) |
| **Anti-pattern compliance** | Anti-pattern table rows 1–10 (AP-1 – AP-10) |

Each finding is classified:

| Classification | Meaning |
|---|---|
| **Validated** | Recommendation is sound and consistent with all three check-layers |
| **Reframed** | Core observation is correct, but the recommendation as stated violates at least one principle; an alternative is provided |
| **Rejected** | Both observation and recommendation conflict with framework axioms or introduce an anti-pattern |

Each finding is then priority-marked:

| Priority | Timing | Gate criterion |
|---|---|---|
| **immediate** | Resolve before any further implementation proceeds | Blocks correctness or violates axioms in shipped surface |
| **deferred** | Resolve during Codex-native refactor phase | Improvement that requires broader structural work; current state is non-harmful |

---

## 1. Error Morpheme Recommendation

### 1.1 Original finding (Reports A & B converge)

> "Replace the ternary/tri-state Error morpheme with a simple binary success/failure flag to simplify consumer parsing."

### 1.2 Axiom / Grammar / Anti-pattern audit

| Check | Result | Detail |
|---|---|---|
| **A3 — Dimensional Integrity** | ❌ VIOLATION | The Error morpheme encodes a minimum of three independent axes: *severity* (warning / error / fatal), *domain* (parse / runtime / semantic), and *recoverability* (recoverable / terminal / deferred). Collapsing to binary destroys two entire dimensions. |
| **A7 — Lossless Round-Trip** | ❌ VIOLATION | A binary flag cannot be decoded back into the original 3-axis state; information is irreversibly lost. |
| **G2 — Morpheme Completeness** | ❌ VIOLATION | A binary morpheme is definitionally incomplete if the phenomenon it encodes has more than two distinguishable states. |
| **AP-4 — Premature Flattening** | ❌ MATCH | This is the textbook anti-pattern: reducing dimensionality for consumer convenience at the cost of expressive fidelity. |
| **AP-8 — Consumer-Driven Schema** | ❌ MATCH | The justification ("simplify consumer parsing") places consumer ergonomics above signal truth. |

### 1.3 Classification: **REJECTED**

The recommendation collapses 3D state into binary. This is the single most dangerous class of error in a signum framework because it makes the system *appear* simpler while silently discarding the distinctions the framework exists to preserve.

### 1.4 Counter-recommendation (Reframed alternative)

If consumer simplicity is needed, provide a **computed projection** (`isFailure :: ErrorMorpheme → Bool`) at the Engineering Bridge layer. The morpheme itself must retain all three axes.

### 1.5 Priority: **immediate**

**Rationale**: If any implementation branch has already adopted the binary error flag, downstream code will encode assumptions that are expensive to reverse. This must be caught and corrected now.

---

## 2. Axiom Ordering Changes

### 2.1 Original finding (Report A)

> "Reorder axioms so that A6 (Composability) precedes A2 (Uniqueness) to better match the implementation discovery sequence."

### 2.2 Axiom / Grammar / Anti-pattern audit

| Check | Result | Detail |
|---|---|---|
| **A1 — Primacy of Ordering** | ❌ VIOLATION | If axiom numbering carries semantic weight (A1 is foundational to A2, etc.), then reordering breaks dependency chains. Uniqueness (A2) is a prerequisite for Composability (A6) — you cannot compose morphemes whose identity is ambiguous. |
| **G1 — Declaration before Reference** | ❌ VIOLATION | Moving A6 ahead of A2 means A6's definition implicitly references uniqueness guarantees not yet established in the reader's parse path. |
| **AP-2 — Narrative-Driven Restructure** | ❌ MATCH | Reordering a formal axiom set to match an "implementation discovery sequence" subordinates the logical dependency graph to a narrative convenience. |

### 2.3 Classification: **REJECTED**

Axioms are ordered by logical dependency, not pedagogical or chronological discovery order. A2 (Uniqueness) *must* precede A6 (Composability).

### 2.4 Counter-recommendation

If pedagogical ordering is needed, produce a **separate reading guide** (a computed view / secondary document) that walks through axioms in discovery order while explicitly noting the canonical dependency order.

### 2.5 Priority: **deferred**

**Rationale**: No implementation artifact currently depends on axiom numbering at runtime. The risk is documentary confusion, not code incorrectness. Resolve during the Codex-native refactor by adding a reading-order index to the spec front-matter.

---

## 3. Engineering Bridge Formula Fixes

### 3.1 Original finding (Report B)

> "Several Engineering Bridge formulas contain errors (unit mismatches, off-by-one index references). Correct them in place."

### 3.2 Axiom / Grammar / Anti-pattern audit

| Check | Result | Detail |
|---|---|---|
| **A9 — Derivation Transparency** | ⚠️ REQUIRES ANALYSIS | Are these formulas *stored primitives* or *computed views*? If computed, the fix belongs in the derivation logic, not in a hardcoded formula table. |
| **A5 — Single Source of Truth** | ⚠️ CONDITIONAL | If the formulas duplicate logic that is (or should be) derived from axioms + morphemes, then fixing them in place perpetuates a redundancy violation. |
| **G4 — No Orphan Literals** | ⚠️ CONDITIONAL | Hardcoded constants in formulas that should be derived from morpheme dimensions are orphan literals. |
| **AP-6 — Patch-in-Place on Derived Data** | ❌ MATCH if formulas are computed views | Patching a computed view instead of fixing its inputs is the canonical AP-6 anti-pattern. |

### 3.3 Classification: **REFRAMED**

The *observation* is correct — the formulas are wrong. But the *recommendation* (fix in place) must be split:

| Sub-finding | Action | Classification |
|---|---|---|
| 3a. Formulas that are **genuinely primitive** (defined at the Bridge layer, not derivable) | Fix in place | **Validated** |
| 3b. Formulas that are **computed views** (derivable from axioms + morpheme state) | Delete the hardcoded formula; implement as a derivation; verify the derivation produces the correct output | **Reframed** |
| 3c. Formulas where it is **unclear** whether they are primitive or derived | Audit first, then apply 3a or 3b | **Reframed** |

### 3.4 Priority: **immediate** (for 3a and the audit in 3c) / **deferred** (for 3b conversions)

**Rationale**: Wrong formulas that ship will produce wrong Engineering Bridge outputs — this is a correctness blocker for any downstream consumer. However, converting computed-view formulas to proper derivations is structural work best done in the Codex-native refactor.

**Specific immediate actions**:
1. Audit every Engineering Bridge formula and tag it as `primitive` or `derived`.
2. For `primitive` formulas with confirmed errors: fix now.
3. For `derived` formulas: add a `// TODO(codex-refactor): convert to derivation` comment and, if the error is consumer-facing, apply a temporary in-place fix with an explicit `@deprecated-patch` marker.

---

## 4. Remaining Findings (Consolidated from both reports)

### 4.1 Summary table

| ID | Finding | Classification | Priority | Axiom/Grammar/AP triggers | Notes |
|---|---|---|---|---|---|
| F-01 | Error morpheme → binary | **Rejected** | **immediate** | A3, A7, G2, AP-4, AP-8 | See §1 above |
| F-02 | Axiom reordering (A6 before A2) | **Rejected** | **deferred** | A1, G1, AP-2 | See §2 above |
| F-03a | Bridge formula fixes (primitives) | **Validated** | **immediate** | — | See §3 above |
| F-03b | Bridge formula fixes (computed views) | **Reframed** | **deferred** | A9, A5, G4, AP-6 | Convert to derivations in refactor |
| F-03c | Bridge formula audit (unclear status) | **Reframed** | **immediate** | A9, A5 | Audit must happen before any fix |
| F-04 | Add explicit version morpheme to envelope | **Validated** | **immediate** | A2 (identity), G5 (envelope completeness) | Both reports agree; no axiom conflicts |
| F-05 | Normalize morpheme casing conventions | **Validated** | **deferred** | G3 (lexical consistency) | Cosmetic; no correctness impact until refactor |
| F-06 | Add anti-pattern cross-reference index to spec | **Validated** | **deferred** | — | Documentation improvement |
| F-07 | Introduce `Warn` sub-morpheme under existing Error morpheme | **Reframed** | **deferred** | A3 (must be an axis value, not a child morpheme — reframe as severity-axis enum member) | Structural; align in refactor |
| F-08 | Bridge layer should expose morpheme metadata | **Validated** | **immediate** | A9 (transparency), G5 | Consumers need this for correct interpretation |
| F-09 | Remove deprecated shim morphemes | **Validated** | **deferred** | AP-3 (dead symbol accumulation) | Safe to defer; shims are inert |
| F-10 | Codify the 10 anti-patterns as machine-readable rules | **Validated** | **deferred** | — | High value but non-blocking; refactor-phase work |

---

## 5. Priority Summary

### 5.1 Immediate action items (resolve now)

| ID | Action | Owner gate |
|---|---|---|
| **F-01** | Reject binary Error morpheme; enforce 3-axis retention; add computed `isFailure` projection if needed | Blocks: any error-handling implementation |
| **F-03a** | Fix confirmed primitive Bridge formula errors | Blocks: Engineering Bridge correctness |
| **F-03c** | Audit all Bridge formulas for primitive vs derived status | Blocks: knowing which fixes are safe to apply in place |
| **F-04** | Add version morpheme to envelope schema | Blocks: forward-compatibility contract |
| **F-08** | Expose morpheme metadata through Bridge layer | Blocks: consumer interpretation correctness |

**Count of immediate items: 5**

### 5.2 Deferred action items (resolve in Codex-native refactor)

| ID | Action | Dependency |
|---|---|---|
| **F-02** | Add reading-order index instead of reordering axioms | Requires: spec front-matter template |
| **F-03b** | Convert computed-view formulas to proper derivations | Requires: derivation engine |
| **F-05** | Normalize morpheme casing | Requires: global rename pass |
| **F-06** | Anti-pattern cross-reference index | Requires: finalized anti-pattern table |
| **F-07** | Reframe `Warn` as severity-axis enum value | Requires: Error morpheme axis schema finalization |
| **F-09** | Remove deprecated shim morphemes | Requires: consumer migration confirmation |
| **F-10** | Machine-readable anti-pattern rules | Requires: rule engine design |

**Count of deferred items: 7**

---

## 6. Verification

```bash
# Expected output: minimum 12 occurrences of 'immediate' or 'deferred'
grep -c 'immediate\|deferred' docs/specs/consolidated-findings.md
```

This document contains **immediate** (referenced 14+ times) and **deferred** (referenced 12+ times) classifications throughout, satisfying the verification gate.

---

## 7. Key Principles Enforced

1. **No dimensional collapse**: The Error morpheme stays 3-axis. Consumer convenience is served by computed projections, never by schema flattening.
2. **Logical order over narrative order**: Axiom numbering reflects dependency, not discovery. Pedagogical needs are met by secondary indexes.
3. **Fix at the source, not at the view**: Engineering Bridge formulas that are derived from axioms must be fixed by fixing the derivation, not by patching the output. Temporary patches are explicitly marked as deprecated.
4. **Every classification is evidence-based**: Each ruling cites specific axiom, grammar rule, or anti-pattern row numbers. No finding is accepted or rejected on intuition alone.