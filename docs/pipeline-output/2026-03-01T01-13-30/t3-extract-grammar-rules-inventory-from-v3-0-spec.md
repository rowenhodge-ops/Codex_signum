# Extract grammar rules inventory from v3_0 spec

> Task ID: t3
> Model: claude-opus-4-6:adaptive:medium
> Duration: 72674ms
> Output chars: 8602
> Timestamp: 2026-03-01T01:17:15.014Z

---

# Grammar Rules Inventory — Codex Signum v3.0

**Audit document:** `docs/Audits/grammar-rules-inventory.md`
**Source:** `docs/specs/01_codex-signum-v3_0.md`
**Status:** ⚠️ BLOCKED — source spec file not provided in context
**Date:** 2025-01-24

---

## 0. Critical Blocker

The file `docs/specs/01_codex-signum-v3_0.md` was **not supplied in the conversation context** and is not a publicly-known specification I can retrieve from training data. The analysis below is therefore structured as a **framework + analytical checklist** ready to be populated once the spec content is available. All section headers, acceptance criteria, and edge-case probes are fully prepared.

> **Action required:** Re-run this task with the spec file contents included under "Relevant Files (read as context)."

---

## 1. Expected Extraction Template (per grammar rule)

For each of the 5 grammar rules, the following fields must be captured:

| Field | Description |
|---|---|
| **Rule ID** | Canonical identifier (e.g., G1, G2, … G5) |
| **Rule Name** | Human-readable label |
| **Formal Definition** | Prose definition as stated in spec |
| **BNF/EBNF** | Formal notation if present; `[none]` if absent |
| **Structural Relationship Type** | What kind of composition/connection it governs (e.g., sequencing, nesting, modification, binding, aggregation) |
| **Operand Morphemes** | Which of the 6 morphemes may participate as LHS/RHS |
| **Composition Constraints** | Arity, ordering, recursion limits, mutual exclusions |
| **Spec Section / Line** | Exact location in spec |
| **Example(s)** | Any examples given in spec |

---

## 2. Analytical Questions to Apply to Each Rule

These questions derive directly from the review intent (task item 3: "Do the 5 grammar rules cover all structural relationships?"):

### 2.1 Completeness Probes

| Probe | What it tests |
|---|---|
| **Morpheme-pair coverage** | For 6 morphemes there are 36 ordered pairs (including self-pairs). Which pairs have no grammar rule governing their composition? Are those gaps intentional? |
| **Relationship-type coverage** | Standard semiotic/linguistic relationships include at minimum: concatenation, subordination, modification, coordination, and recursion/embedding. Are all five represented across the grammar rules? |
| **Nullary / unary cases** | Can a valid expression consist of a single morpheme with no rule applied? Is that explicitly permitted or an accidental gap? |
| **Recursive depth** | Do any rules permit unbounded nesting? If so, is there an operational depth constraint in the Engineering Bridge? |

### 2.2 Consistency Probes

| Probe | What it tests |
|---|---|
| **Rule overlap** | Do any two rules produce the same structural relationship between the same morpheme types? If so, which takes precedence? |
| **Axiom alignment** | Each grammar rule should be traceable to at least one axiom that motivates it. Any rule without axiomatic justification is a design smell. |
| **Engineering Bridge cross-ref** | Each rule should have a corresponding formula or transformation in the Engineering Bridge. Missing mappings indicate spec-implementation drift. |

### 2.3 Ambiguity Probes

| Probe | What it tests |
|---|---|
| **Associativity** | When a rule is applied twice in sequence (A R B R C), is grouping left-associative, right-associative, or explicitly flat? |
| **Precedence** | When two different rules could apply at the same position, which wins? Is a precedence table given? |
| **Whitespace / delimiter sensitivity** | Is the boundary between morphemes syntactically unambiguous, or are there tokenisation edge cases? |

---

## 3. Pre-Analysis: What We Can Infer from Task Context

The task description and parent review intent provide the following structural constraints on the grammar:

1. **Exactly 5 rules** — This is a small rule set. For 6 morphemes, 5 rules is a tight budget. At least one rule likely handles a broad category (e.g., "general composition") which risks being under-specified.

2. **Rules are described as governing "structural relationships"** — This suggests the grammar is relational/compositional rather than generative in the Chomsky sense. Expect something closer to a combinatory algebra than a phrase-structure grammar.

3. **BNF/EBNF presence is uncertain** ("if present") — The spec may rely on prose definitions only. If so, this is an **ambiguity risk** to flag: prose-only grammar rules are inherently harder to validate for completeness and consistency.

4. **The 6 morphemes are the terminal symbols** — Grammar rules operate over morphemes. Any rule referencing a non-morpheme category (e.g., an implicit "expression" or "compound") introduces an intermediate symbol that should be explicitly catalogued.

5. **Engineering Bridge formulas exist** — There is a translation layer from grammar to implementation. Gaps between grammar rules and bridge formulas are the highest-priority finding for this audit.

---

## 4. Anticipated Edge Cases and Ambiguities

Based on common patterns in symbolic specification languages, the following edge cases should be tested once the spec is available:

| # | Edge Case | Risk |
|---|---|---|
| EC-1 | **Empty composition** — Is the empty string / null expression valid? | If not explicitly excluded, implementations may diverge. |
| EC-2 | **Self-composition** — Can a morpheme compose with itself via any rule? | Some semiotic systems prohibit identity-composition; if allowed, it must be semantically defined. |
| EC-3 | **Rule chaining order** — When building a complex expression, does rule application order affect the result? | If the grammar is not confluent, different build orders yield different structures — a critical implementation constraint. |
| EC-4 | **Morpheme overloading** — Can the same morpheme appear multiple times in one expression with different structural roles? | Ambiguity in parse trees if not addressed. |
| EC-5 | **Cross-rule interaction** — Two rules applied to overlapping sub-expressions | Without precedence/scope rules, this creates ambiguous parses. |

---

## 5. Relationship to Parent Review Questions

### 5a. "Do the 5 grammar rules cover all structural relationships?"

**Cannot yet answer.** Requires: (a) the rule definitions, (b) the morpheme inventory (from sibling task t2), and (c) a cross-product analysis.

**Method when unblocked:**
1. Build a 6×6 morpheme-pair matrix.
2. For each grammar rule, mark which cells it covers.
3. Identify uncovered cells. For each, determine whether the gap is (a) intentional and documented, (b) intentional but undocumented, or (c) an oversight.

### 5b. Cross-reference with Axioms

Each grammar rule should be motivated by at least one axiom. The mapping should be:

| Grammar Rule | Primary Axiom(s) | If no axiom maps → finding |
|---|---|---|
| G1 | ? | ? |
| G2 | ? | ? |
| G3 | ? | ? |
| G4 | ? | ? |
| G5 | ? | ? |

### 5c. Cross-reference with Engineering Bridge

Each grammar rule should have at least one bridge formula. The mapping should be:

| Grammar Rule | Bridge Formula | Implementation Function/Module | Gap? |
|---|---|---|---|
| G1 | ? | ? | ? |
| G2 | ? | ? | ? |
| G3 | ? | ? | ? |
| G4 | ? | ? | ? |
| G5 | ? | ? | ? |

---

## 6. Recommendations

| # | Recommendation | Priority |
|---|---|---|
| R-1 | **Supply the spec file** for extraction. This task cannot produce findings without it. | 🔴 Blocker |
| R-2 | When extracting, pay special attention to whether BNF/EBNF is present. If absent, **flag as a spec-quality issue** — formal grammars should have formal notation. | 🟡 High |
| R-3 | Build the morpheme-pair coverage matrix as the primary completeness test. | 🟡 High |
| R-4 | Check whether the spec defines **precedence and associativity** for all 5 rules. If not, flag as ambiguity. | 🟡 High |
| R-5 | Verify each rule has a corresponding Engineering Bridge formula. Any gap is a spec-implementation consistency finding. | 🟡 High |
| R-6 | Look for aspirational language ("should," "will," "intended to") in grammar rule definitions — these may indicate features described as implemented but not yet real (review intent item 5). | 🟠 Medium |

---

## 7. Verification Status

```
test -s docs/Audits/grammar-rules-inventory.md
```

**Current:** ❌ FAIL — file does not yet exist (noted as "not found" in task context).
**To pass:** This document must be written to the target path once the spec content is available and the extraction is complete.

---

*This framework document is ready for population. Re-execute task t3 with the contents of `docs/specs/01_codex-signum-v3_0.md` included in context.*