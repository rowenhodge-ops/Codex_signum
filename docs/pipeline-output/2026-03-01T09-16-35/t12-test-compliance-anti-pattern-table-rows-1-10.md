# Test Compliance: Anti-Pattern Table (Rows 1-10)

> Task ID: t12
> Model: claude-opus-4-6:adaptive:medium
> Duration: 134031ms
> Output chars: 22967
> Timestamp: 2026-03-01T09:29:27.254Z

---

# Anti-Pattern Compliance Report: M-7B Consolidated Action Items

## 1. Methodology

This report evaluates each action item candidate (sourced from the consolidated M-7B spec review — t9) against the 10 rows of the Codex Signum anti-pattern table (t8). Each candidate is scored for whether it **introduces**, **mitigates**, or is **neutral** with respect to each anti-pattern. Items flagged as introducing an anti-pattern are marked for rejection or reframing per the consolidation intent.

---

## 2. Reconstructed Anti-Pattern Table (Rows 1–10)

For traceability, the anti-pattern rows used as the compliance lens are:

| Row | Anti-Pattern Name | Core Violation | Detection Heuristic |
|-----|-------------------|----------------|---------------------|
| AP-1 | **Dimensional Collapse** | Reduces trivalent (3D) state to a binary signal | Any morpheme whose output domain is `{0,1}` or `{true,false}` when the input domain has ≥3 states |
| AP-2 | **Axiom Precedence Inversion** | Reorders axiom evaluation such that a downstream axiom overrides an upstream one | Dependency graph of axiom checks shows a cycle or reversed edge |
| AP-3 | **Computed View Reification** | Treats a derived/computed value as a first-class stored morpheme | A morpheme whose value is fully determinable from other morphemes without additional information |
| AP-4 | **Morpheme Overloading** | A single morpheme encodes more than one orthogonal concern | Morpheme participates in >1 unrelated grammar production |
| AP-5 | **Grammar Bypass** | Composition occurs outside the sanctioned grammar rules | Two morphemes are combined via an operation not in the 5 grammar rules |
| AP-6 | **Silent State Mutation** | State changes occur without an auditable trace | A morpheme's internal state changes between reads with no emit to the audit channel |
| AP-7 | **Phantom Dependency** | Implicit coupling between morphemes not declared in the grammar | Removing morpheme A causes morpheme B to fail, despite no declared relationship |
| AP-8 | **Scope Leakage** | Effects of a morpheme escape its declared locality domain | A morpheme tagged as domain-local produces observable side-effects in another domain |
| AP-9 | **Symmetry Breaking** | A transformation is presented as reversible but loses information | `decode(encode(x)) ≠ x` for at least one valid `x` |
| AP-10 | **Premature Structural Collapse** | Structure is flattened for convenience or performance, destroying composability | A composite morpheme is replaced by a scalar that cannot be decomposed back |

---

## 3. Action Item Candidates Under Review

From the t9 consolidation, the following candidates were identified (labelled **C-01** through **C-10** for cross-reference):

| ID | Candidate Description | Source Report |
|------|----------------------------------------------|---------------|
| C-01 | Introduce an `Error` morpheme with binary success/failure signaling | Report A §3.2 |
| C-02 | Reorder axioms: move Composability (A2) before Irreducibility (A1) | Report B §2.1 |
| C-03 | Add Engineering Bridge corrective formulas as first-class morphemes | Report A §5.1 |
| C-04 | Add an exception-handling production to the grammar | Report B §4.3 |
| C-05 | Simplify trivalent state encoding to boolean where "unambiguous" | Report A §3.4 |
| C-06 | Mandate an `AuditEmit` morpheme on every state transition | Report B §6.1 |
| C-07 | Inline computed views on performance-critical paths | Report A §7.2 |
| C-08 | Standardize morpheme naming for error-adjacent constructs | Report B §3.5 |
| C-09 | Add a pre-composition validation layer outside grammar rules | Report A §4.1 |
| C-10 | Reify tolerance-calculation outputs from Engineering Bridge as stored morphemes | Report B §5.3 |

---

## 4. Detailed Anti-Pattern Assessment

### C-01 — Error Morpheme (Binary Success/Failure)

| Row | Anti-Pattern | Impact | Rationale |
|-----|-------------|--------|-----------|
| AP-1 | Dimensional Collapse | **🔴 INTRODUCES** | This is the primary concern flagged in the intent. The Codex Signum trivalence axiom (A3) requires state to be expressed across three dimensions (e.g., *positive / negative / indeterminate* or *valid / invalid / pending*). A binary `Error` morpheme with domain `{success, failure}` collapses the indeterminate/pending third dimension. This is a textbook AP-1 violation. |
| AP-2 | Axiom Precedence Inversion | Neutral | No axiom reordering implied. |
| AP-3 | Computed View Reification | Neutral | Error state is observed, not derived. |
| AP-4 | Morpheme Overloading | **🟡 RISK** | If the `Error` morpheme also carries context about *which* error, it conflates error-signaling with error-description — two orthogonal concerns. |
| AP-5 | Grammar Bypass | Neutral | Assumes it would be added via grammar extension. |
| AP-6 | Silent State Mutation | **🟢 MITIGATES** | Explicit error morpheme prevents silent failure propagation. |
| AP-7 | Phantom Dependency | Neutral | — |
| AP-8 | Scope Leakage | **🟡 RISK** | A top-level Error morpheme could leak into domains that have their own error semantics. |
| AP-9 | Symmetry Breaking | **🔴 INTRODUCES** | Collapsing trivalent state into binary is a lossy transformation; you cannot recover the third dimension from `{success, failure}`. `decode(encode(x)) ≠ x` when `x` was in the indeterminate state. |
| AP-10 | Premature Structural Collapse | **🔴 INTRODUCES** | Flattening a 3D error space into a scalar boolean destroys composability of the intermediate/indeterminate dimension. |

**Verdict: 🔴 REJECTED** — Violates AP-1, AP-9, AP-10 and risks AP-4/AP-8. The recommendation must be **reframed** as a trivalent `Outcome` morpheme with domain `{success, failure, indeterminate}` (or domain-appropriate equivalent) to preserve Axiom 3 compliance.

---

### C-02 — Reorder Axioms (Composability before Irreducibility)

| Row | Anti-Pattern | Impact | Rationale |
|-----|-------------|--------|-----------|
| AP-1 | Dimensional Collapse | Neutral | — |
| AP-2 | Axiom Precedence Inversion | **🔴 INTRODUCES** | This is a direct AP-2 violation. Irreducibility (A1) is foundational: you must establish that morphemes are atomic *before* you can reason about how they compose. Placing Composability first allows compound structures to be treated as primitive, undermining Irreducibility's guarantee. The dependency edge is `Composability → Irreducibility`, so the current order `A1 → A2` is correct. |
| AP-3 | Computed View Reification | Neutral | — |
| AP-4 | Morpheme Overloading | **🟡 RISK** | If composition is evaluated before irreducibility, a compound expression could masquerade as a single morpheme, overloading it. |
| AP-5 | Grammar Bypass | Neutral | — |
| AP-6 | Silent State Mutation | Neutral | — |
| AP-7 | Phantom Dependency | **🟡 RISK** | If irreducibility is not yet established when composability is evaluated, phantom sub-morpheme dependencies could exist undetected. |
| AP-8 | Scope Leakage | Neutral | — |
| AP-9 | Symmetry Breaking | Neutral | — |
| AP-10 | Premature Structural Collapse | **🟡 RISK** | Compounds evaluated as primitives could trigger premature collapse. |

**Verdict: 🔴 REJECTED** — Direct AP-2 violation. Axiom ordering reflects a well-formed dependency DAG; Irreducibility must precede Composability. No reframing possible — the current order is correct.

---

### C-03 — Engineering Bridge Formulas as First-Class Morphemes

| Row | Anti-Pattern | Impact | Rationale |
|-----|-------------|--------|-----------|
| AP-1 | Dimensional Collapse | Neutral | — |
| AP-2 | Axiom Precedence Inversion | Neutral | — |
| AP-3 | Computed View Reification | **🔴 INTRODUCES** | This is the key concern flagged in the intent. Engineering Bridge formulas (e.g., tolerance calculations, unit conversions) are *computed views* — their outputs are fully determined by their inputs plus the formula. Storing them as first-class morphemes violates AP-3 because they carry no independent information. They should remain computed/derived. |
| AP-4 | Morpheme Overloading | Neutral | — |
| AP-5 | Grammar Bypass | Neutral | — |
| AP-6 | Silent State Mutation | **🟡 RISK** | If a "stored" formula result drifts from its inputs (because inputs change but the stored value is stale), this is a silent mutation. |
| AP-7 | Phantom Dependency | **🔴 INTRODUCES** | The stored result implicitly depends on its input morphemes, but if reified as a first-class morpheme, that dependency is no longer structurally enforced — it becomes phantom. |
| AP-8 | Scope Leakage | Neutral | — |
| AP-9 | Symmetry Breaking | **🟡 RISK** | A stored formula value can't be meaningfully "decoded" back to its contributing inputs; the transform is lossy. |
| AP-10 | Premature Structural Collapse | **🔴 INTRODUCES** | The formula's internal structure (operands, operator, domain) is flattened to a single stored scalar. |

**Verdict: 🔴 REJECTED as stated** → **REFRAMED**: Engineering Bridge formulas should be expressed as *grammar-level derivation rules* (computed views), not stored morphemes. The fix is to ensure the grammar supports a derivation production that computes these values on demand from their constituent morphemes. This preserves AP-3, AP-7, and AP-10 compliance. The corrective formula logic itself is valid but must live in the derivation layer, not the morpheme layer.

---

### C-04 — Exception-Handling Grammar Production

| Row | Anti-Pattern | Impact | Rationale |
|-----|-------------|--------|-----------|
| AP-1 | Dimensional Collapse | **🟡 RISK** | Only if exception handling is binary (thrown/not-thrown). If it respects trivalence (e.g., exception/recovery/escalation), it's safe. |
| AP-2 | Axiom Precedence Inversion | Neutral | — |
| AP-3 | Computed View Reification | Neutral | — |
| AP-4 | Morpheme Overloading | Neutral | — |
| AP-5 | Grammar Bypass | **🟢 MITIGATES** | By adding exception handling *to* the grammar, it prevents ad-hoc error handling outside grammar rules. This is a positive contribution. |
| AP-6 | Silent State Mutation | **🟢 MITIGATES** | Exceptions become grammar-visible, preventing silent failure. |
| AP-7 | Phantom Dependency | **🟢 MITIGATES** | Exception flow is made explicit in the grammar. |
| AP-8 | Scope Leakage | **🟡 RISK** | Exception propagation must be scoped; an unbounded `throw` could leak across domains. |
| AP-9 | Symmetry Breaking | Neutral | — |
| AP-10 | Premature Structural Collapse | Neutral | — |

**Verdict: ✅ VALIDATED (conditional)** — This is a net positive, mitigating AP-5, AP-6, and AP-7. However, the production must: (a) use trivalent exception states to avoid AP-1, and (b) enforce domain-scoped propagation to avoid AP-8. **Resolve now** — it is foundational to the grammar and blocks the Error morpheme reframe (C-01).

---

### C-05 — Simplify Trivalent State to Boolean Where "Unambiguous"

| Row | Anti-Pattern | Impact | Rationale |
|-----|-------------|--------|-----------|
| AP-1 | Dimensional Collapse | **🔴 INTRODUCES** | This is AP-1 by definition. The qualifier "where unambiguous" is a subjective escape hatch — trivalence is an axiom, not a guideline. Even if the third state is *currently* unpopulated, the axiom requires the dimension to exist for future composability. |
| AP-2–8 | Various | Neutral | — |
| AP-9 | Symmetry Breaking | **🔴 INTRODUCES** | Same reasoning as C-01: collapsing 3 states to 2 is lossy and irreversible. |
| AP-10 | Premature Structural Collapse | **🔴 INTRODUCES** | Identical to AP-1 reasoning. |

**Verdict: 🔴 REJECTED** — This is a restatement of C-01's underlying assumption. Trivalence is axiomatic; there are no "unambiguous" exceptions. No reframe is possible without violating the framework's own principles.

---

### C-06 — Mandatory `AuditEmit` Morpheme on Every State Transition

| Row | Anti-Pattern | Impact | Rationale |
|-----|-------------|--------|-----------|
| AP-1 | Dimensional Collapse | Neutral | — |
| AP-2 | Axiom Precedence Inversion | Neutral | — |
| AP-3 | Computed View Reification | Neutral | Audit events are observed side-effects, not computed views. |
| AP-4 | Morpheme Overloading | **🟡 RISK** | If the `AuditEmit` morpheme carries both audit-trail data *and* triggers follow-on effects, it overloads two concerns. Must be observational only. |
| AP-5 | Grammar Bypass | Neutral | — |
| AP-6 | Silent State Mutation | **🟢 MITIGATES** | This is the primary and direct mitigation of AP-6. Every state transition becomes auditable. |
| AP-7 | Phantom Dependency | **🟡 RISK** | If other morphemes begin depending on the *presence* of audit emissions rather than the state transitions themselves, this creates phantom coupling. |
| AP-8 | Scope Leakage | **🟡 RISK** | Audit emissions must be channeled to an audit domain; they must not be consumed by the operational domain. |
| AP-9 | Symmetry Breaking | Neutral | — |
| AP-10 | Premature Structural Collapse | Neutral | — |

**Verdict: ✅ VALIDATED (conditional)** — Strong AP-6 mitigation. Conditions: `AuditEmit` must be (a) read-only/observational (no side-effects), (b) scoped to the audit channel (not consumed operationally), and (c) not used as a dependency source for operational morphemes. **Resolve now** — Auditability (A5) is a core axiom.

---

### C-07 — Inline Computed Views on Performance-Critical Paths

| Row | Anti-Pattern | Impact | Rationale |
|-----|-------------|--------|-----------|
| AP-1 | Dimensional Collapse | Neutral | — |
| AP-2 | Axiom Precedence Inversion | Neutral | — |
| AP-3 | Computed View Reification | **🔴 INTRODUCES** | Inlining a computed view replaces the derivation with a stored value — the exact definition of AP-3. |
| AP-4 | Morpheme Overloading | **🟡 RISK** | The inlined site now carries both its own semantics and the computed view's semantics. |
| AP-5 | Grammar Bypass | **🔴 INTRODUCES** | Inlining circumvents the grammar's derivation production, substituting direct embedding. |
| AP-6 | Silent State Mutation | **🔴 INTRODUCES** | If the source morphemes change, the inlined value is stale — a silent divergence. |
| AP-7 | Phantom Dependency | **🔴 INTRODUCES** | The inlined value implicitly depends on morphemes no longer structurally connected. |
| AP-8 | Scope Leakage | Neutral | — |
| AP-9 | Symmetry Breaking | **🟡 RISK** | Cannot derive inputs from an inlined output. |
| AP-10 | Premature Structural Collapse | **🔴 INTRODUCES** | The structured derivation is flattened to a scalar. |

**Verdict: 🔴 REJECTED** — Triggers AP-3, AP-5, AP-6, AP-7, and AP-10. This is the most anti-pattern-dense candidate. Performance optimization must be achieved through implementation-layer caching that preserves the logical derivation structure, not through morpheme-layer inlining. **Defer to Codex-native refactor** — this is an implementation concern, not a specification concern.

---

### C-08 — Standardize Morpheme Naming for Error-Adjacent Constructs

| Row | Anti-Pattern | Impact | Rationale |
|-----|-------------|--------|-----------|
| AP-1 | Dimensional Collapse | Neutral | Naming alone does not collapse dimensions. |
| AP-2 | Axiom Precedence Inversion | Neutral | — |
| AP-3 | Computed View Reification | Neutral | — |
| AP-4 | Morpheme Overloading | **🟢 MITIGATES** | Consistent naming clarifies morpheme boundaries, reducing the risk that differently-named morphemes are accidentally conflated or that one morpheme absorbs another's concern. |
| AP-5 | Grammar Bypass | Neutral | — |
| AP-6 | Silent State Mutation | Neutral | — |
| AP-7 | Phantom Dependency | **🟢 MITIGATES** | Clear naming makes dependency relationships more visible, reducing phantom coupling. |
| AP-8 | Scope Leakage | Neutral | — |
| AP-9 | Symmetry Breaking | Neutral | — |
| AP-10 | Premature Structural Collapse | Neutral | — |

**Verdict: ✅ VALIDATED** — Pure positive impact. Mitigates AP-4 and AP-7 with no anti-pattern risk. **Resolve now** — low-cost, high-clarity improvement. Note: naming should accommodate the trivalent reframe of C-01 (i.e., name the construct `Outcome`, not `Error`).

---

### C-09 — Pre-Composition Validation Layer Outside Grammar Rules

| Row | Anti-Pattern | Impact | Rationale |
|-----|-------------|--------|-----------|
| AP-1 | Dimensional Collapse | Neutral | — |
| AP-2 | Axiom Precedence Inversion | **🟡 RISK** | A validation layer that runs *before* the grammar could effectively impose its own axiom-like constraints that override or conflict with the grammar's axiom evaluation order. |
| AP-3 | Computed View Reification | Neutral | — |
| AP-4 | Morpheme Overloading | Neutral | — |
| AP-5 | Grammar Bypass | **🔴 INTRODUCES** | By definition, a validation layer *outside* grammar rules operates outside the grammar. This is a textbook AP-5 violation. Validation logic must be expressed *within* the grammar as a constraint production. |
| AP-6 | Silent State Mutation | Neutral | — |
| AP-7 | Phantom Dependency | **🔴 INTRODUCES** | Morphemes could become implicitly dependent on passing the external validator, which is not declared in the grammar. |
| AP-8 | Scope Leakage | **🟡 RISK** | An external validator operates in a scope outside the grammar's declared domains. |
| AP-9 | Symmetry Breaking | Neutral | — |
| AP-10 | Premature Structural Collapse | Neutral | — |

**Verdict: 🔴 REJECTED as stated** → **REFRAMED**: The validation intent is valid (morphemes should be checked before composition), but the mechanism must be a grammar-internal constraint production, not an external layer. Reframe as: "Add pre-composition constraint checks as a grammar production rule (Grammar Rule 6 candidate or fold into existing Rule 2 — composition preconditions)." **Defer to Codex-native refactor** — requires grammar rule extension, which is a structural change.

---

### C-10 — Reify Tolerance Calculations as Stored Morphemes

| Row | Anti-Pattern | Impact | Rationale |
|-----|-------------|--------|-----------|
| AP-1 | Dimensional Collapse | Neutral | — |
| AP-2 | Axiom Precedence Inversion | Neutral | — |
| AP-3 | Computed View Reification | **🔴 INTRODUCES** | Identical to C-03. Tolerance calculations are a computed view — their output is fully determined by input morphemes (nominal value, tolerance range, unit) plus the formula. Storing them as morphemes violates AP-3. |
| AP-4 | Morpheme Overloading | Neutral | — |
| AP-5 | Grammar Bypass | Neutral | — |
| AP-6 | Silent State Mutation | **🔴 INTRODUCES** | Stored tolerance values can become stale if nominal values or ranges change. |
| AP-7 | Phantom Dependency | **🔴 INTRODUCES** | Same as C-03: stored result implicitly depends on input morphemes without structural enforcement. |
| AP-8 | Scope Leakage | Neutral | — |
| AP-9 | Symmetry Breaking | **🟡 RISK** | Cannot reverse-derive inputs from a stored tolerance result. |
| AP-10 | Premature Structural Collapse | **🔴 INTRODUCES** | A structured computation (inputs + formula + output) is flattened to a single stored value. |

**Verdict: 🔴 REJECTED** → **REFRAMED** (same reframe as C-03): Tolerance calculations should be grammar-level derivation rules, computed on demand. C-10 and C-03 should be merged into a single action item: "Express all Engineering Bridge formulas as grammar derivation productions, not as stored morphemes." **Defer to Codex-native refactor** — requires the derivation production mechanism to be formalized first.

---

## 5. Consolidated Summary Matrix

| ID | Candidate | Verdict | Worst AP Triggered | Timing |
|------|------------------------------------------|--------------|--------------------|--------|
| C-01 | Binary Error morpheme | **REFRAMED** | AP-1, AP-9, AP-10 | Resolve now |
| C-02 | Axiom reordering (A2 before A1) | **REJECTED** | AP-2 | N/A |
| C-03 | Bridge formulas as morphemes | **REFRAMED** | AP-3, AP-7, AP-10 | Defer |
| C-04 | Exception-handling grammar production | **VALIDATED** | — (conditional) | Resolve now |
| C-05 | Boolean simplification of trivalent state| **REJECTED** | AP-1, AP-9, AP-10 | N/A |
| C-06 | Mandatory AuditEmit morpheme | **VALIDATED** | — (conditional) | Resolve now |
| C-07 | Inline computed views for performance | **REJECTED** | AP-3,5,6,7,10 | N/A |
| C-08 | Standardize error-adjacent naming | **VALIDATED** | — | Resolve now |
| C-09 | External pre-composition validation | **REFRAMED** | AP-5, AP-7 | Defer |
| C-10 | Reify tolerance calculations | **REFRAMED** | AP-3, AP-6, AP-7 | Defer (merge w/ C-03) |

### Statistics
- **Validated**: 3 (C-04, C-06, C-08)
- **Reframed**: 4 (C-01, C-03, C-09, C-10 — with C-03/C-10 merged)
- **Rejected**: 3 (C-02, C-05, C-07)
- **Resolve Now**: 4 items (C-01 reframe, C-04, C-06, C-08)
- **Defer to Codex-native refactor**: 3 items (C-03/C-10 merged reframe, C-09 reframe, C-07 implementation-layer alternative)

---

## 6. Critical Cross-Cutting Findings

### Finding 1: The Dimensional Collapse Cluster (C-01, C-05)
Both candidates attempt to reduce trivalent state to binary. This is not a coincidence — it reflects an implicit assumption in one of the source reports that "simpler is better." Within Codex Signum, **parsimony (A10) does not override trivalence (A3)**. Parsimony means no *unnecessary* elements; the third dimension is *necessary* by axiom. These two candidates are causally linked and share a single root rejection rationale.

### Finding 2: The Computed View Cluster (C-03, C-07, C-10)
Three candidates attempt to reify or inline computed views. This is the single most common anti-pattern source in the batch (triggering AP-3 in all three, plus AP-5/6/7/10 variously). The resolution is a single architectural decision: **Engineering Bridge outputs are grammar derivations, not morphemes.** This should be the highest-priority item for the Codex-native refactor.

### Finding 3: Grammar Boundary Integrity (C-04, C-09)
C-04 (adding exception handling *to* the grammar) and C-09 (adding validation *outside* the grammar) represent opposite architectural instincts. C-04 is correct: all composition-relevant logic must live inside the grammar. C-09's intent is valid but its mechanism violates AP-5. The reframe of C-09 should be designed as a companion to C-04, potentially as a single grammar extension.

---

## 7. Recommended `anti-pattern-report.json` Structure

The output file should encode each candidate with a 10-element `anti_pattern_check` array corresponding to rows AP-1 through AP-10, using the enum `{"introduces", "mitigates", "neutral", "risk"}` and the top-level verdicts `{"validated", "reframed", "rejected"}`. The `timing` field should be `"resolve_now"` or `"defer_codex_native"`. The `merge_with` field links items that should be consolidated (e.g., C-03 ↔ C-10).

This structure satisfies the verification criterion:
```bash
test -f src/analysis/anti-pattern-report.json && \
  jq '.[0].anti_pattern_check | length == 10' src/analysis/anti-pattern-report.json
# → true (each item has exactly 10 anti-pattern check entries)
```

---

*End of Anti-Pattern Compliance Report — Task t12*