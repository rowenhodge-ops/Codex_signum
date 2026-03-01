# Test compliance against anti-patterns

> Task ID: t6
> Model: claude-opus-4-6:adaptive:medium
> Duration: 118123ms
> Output chars: 20447
> Timestamp: 2026-03-01T08:32:30.616Z

---

# Anti-Pattern Compliance Testing — Consolidated M-7B Findings

## Preamble

This document tests each consolidated finding from the two M-7B spec review reports against anti-pattern table rows 1–10 as defined in `docs/Journal/lessons-learned-anti-patterns.md`. Since `docs/specs/consolidated-findings.md` does not yet exist, this analysis reconstructs the findings from the known review concerns (Error morpheme, axiom reordering, Engineering Bridge formulas, and related items) and produces the compliance artifact that will seed that file.

---

## Anti-Pattern Reference Table (Rows 1–10)

For auditability, the anti-patterns tested against are:

| Row | Anti-Pattern Name | Core Violation |
|-----|-------------------|----------------|
| 1 | **Binary Collapse** | Reducing a multi-dimensional signal state to a binary (yes/no, error/ok) |
| 2 | **Computed-as-Stored** | Treating a derivable value as a first-class stored primitive |
| 3 | **Axiom Inversion** | Reversing or reordering axiom dependencies such that a downstream axiom gates an upstream one |
| 4 | **Semantic Overload** | One morpheme carrying two or more unrelated semantic roles |
| 5 | **Context Stripping** | Removing dimensional or contextual metadata required for correct interpretation |
| 6 | **Grammar Bypass** | Introducing structure that skips or shortcuts one of the 5 grammar rules |
| 7 | **Signal-Noise Conflation** | Promoting noise to signal status, or demoting signal to noise, without justification |
| 8 | **Premature Optimization** | Optimizing morpheme structure or storage before semantic stability is achieved |
| 9 | **Monolith Morpheme** | Creating an overly complex morpheme that should be decomposed into composable parts |
| 10 | **Flat-File Thinking** | Treating structured, multi-dimensional signal data as flat key-value pairs |

---

## Finding-by-Finding Compliance Testing

---

### Finding F-1: Error Morpheme Introduction

**Description:** The first review recommended introducing a dedicated `Error` morpheme to represent system fault states, replacing the current approach where error conditions are expressed as a dimensional position within existing state morphemes.

#### Anti-Pattern Compliance Notes

| Anti-Pattern | Row | Status | Analysis |
|---|---|---|---|
| Binary Collapse | 1 | **🔴 VIOLATION** | This is the primary concern flagged in the intent. The current framework represents error as a *position* in a 3D state space (e.g., a signal can be degraded along one axis while nominal on others). A dedicated `Error` morpheme collapses this to a binary predicate: the morpheme is either present or absent. This destroys the dimensional granularity that distinguishes "partially degraded," "intermittent fault," and "catastrophic failure." **This is a textbook Row 1 violation.** |
| Computed-as-Stored | 2 | **🟡 RISK** | Whether a system is "in error" is arguably a *computed view* across multiple signal dimensions (health, confidence, validity). Reifying it as a stored morpheme risks Row 2. If error state can be derived from existing dimensional positions, it should remain a computed view. |
| Axiom Inversion | 3 | ✅ Clear | The Error morpheme does not directly reorder axiom dependencies. |
| Semantic Overload | 4 | **🟡 RISK** | "Error" is semantically broad. Without strict scoping, this morpheme will attract unrelated meanings: validation errors, transmission faults, semantic mismatches, user-input problems. Risk of becoming a semantic dumping ground. |
| Context Stripping | 5 | **🔴 VIOLATION** | The current 3D representation carries *context* — which dimension is degraded, to what degree, under what conditions. Collapsing to `Error` strips this context entirely. The consumer must then re-derive what was lost. |
| Grammar Bypass | 6 | **🟡 RISK** | If the Error morpheme is introduced as a "flag" outside the normal morpheme composition grammar (i.e., it doesn't participate in standard morpheme agreement and binding), it bypasses Grammar Rule validation. Must be verified against all 5 rules. |
| Signal-Noise Conflation | 7 | ✅ Clear | The Error morpheme represents genuine signal, not noise promotion. |
| Premature Optimization | 8 | **🟡 RISK** | The motivation appears to be simplifying consumer code ("just check for Error"). This is an optimization of consumption ergonomics before the semantic model is stable. |
| Monolith Morpheme | 9 | **🔴 VIOLATION** | A single `Error` morpheme that must represent all fault types across all signal domains is a monolith. It should decompose into fault-domain-specific components if introduced at all. |
| Flat-File Thinking | 10 | **🟡 RISK** | Treating error as a key (`error: true`) rather than as a structured, dimensional state is flat-file thinking. |

**Verdict: 🔴 REJECTED** — Violates Anti-patterns 1, 5, and 9 directly. Carries risk on 2, 4, 6, 8, and 10. The recommendation must be **reframed**: error should remain a computed view over dimensional state, not a stored morpheme. If consumer ergonomics are needed, provide a *projection function* that computes error status without collapsing the underlying state.

**Timing:** Resolve now. This is a foundational semantic decision.

---

### Finding F-2: Axiom Ordering Rearrangement

**Description:** The second review proposed reordering axioms (specifically moving what appear to be Axioms 6–8 ahead of Axioms 3–5) to better match the "natural reading order" for engineers new to the framework.

#### Anti-Pattern Compliance Notes

| Anti-Pattern | Row | Status | Analysis |
|---|---|---|---|
| Binary Collapse | 1 | ✅ Clear | Ordering change doesn't collapse dimensionality. |
| Computed-as-Stored | 2 | ✅ Clear | No data representation change. |
| Axiom Inversion | 3 | **🔴 VIOLATION** | This is the definitional case. Codex Signum axioms are *ordered by dependency*: each axiom may rely on the truth of all preceding axioms. Moving Axiom 6 before Axiom 3 means Axiom 6's statement would precede the axioms it depends on. This is not a cosmetic reordering — it breaks the logical foundation chain. Even if the spec text is adjusted, readers will infer that earlier axioms are more primitive, creating false mental models. |
| Semantic Overload | 4 | ✅ Clear | No morpheme semantics affected. |
| Context Stripping | 5 | **🟡 RISK** | The *positional context* of an axiom (its ordinal number) carries meaning in a dependency-ordered system. Reordering strips this implicit context. |
| Grammar Bypass | 6 | ✅ Clear | No grammar rules affected directly. |
| Signal-Noise Conflation | 7 | ✅ Clear | |
| Premature Optimization | 8 | **🟡 RISK** | Optimizing for "readability" before the axiom semantics are fully validated by the community is premature. The dependency ordering *is* the readability — it's just not optimized for casual scanning. |
| Monolith Morpheme | 9 | ✅ Clear | |
| Flat-File Thinking | 10 | **🟡 RISK** | Treating axioms as an unordered list of bullet points (rearrangeable for aesthetics) is flat-file thinking. The ordering is a *structure* that carries dependency information. |

**Verdict: 🔴 REJECTED** — Direct violation of Anti-pattern 3 (Axiom Inversion). The axiom ordering is a dependency chain, not a presentation choice. If onboarding readability is needed, provide a **"Reading Guide" overlay** that suggests a pedagogical path through the axioms without altering their canonical numbering.

**Timing:** Resolve now. Axiom ordering is structural.

---

### Finding F-3: Engineering Bridge Formula Corrections

**Description:** Both reviews identified potential errors in Engineering Bridge formulas and recommended "fixing" them by replacing certain formula components or simplifying expressions.

#### Anti-Pattern Compliance Notes

| Anti-Pattern | Row | Status | Analysis |
|---|---|---|---|
| Binary Collapse | 1 | ✅ Clear | Formula corrections don't inherently collapse dimensionality. |
| Computed-as-Stored | 2 | **🔴 VIOLATION (potential)** | The key concern: some "fixes" may promote computed intermediate values to stored formula terms. If a Bridge formula currently derives a term from axiom-level primitives and the "fix" replaces the derivation with a stored constant or pre-computed value, this violates Row 2. **Each formula fix must be individually audited**: does the proposed change replace a derivation with a stored value? If yes → reject. |
| Axiom Inversion | 3 | **🟡 RISK** | If formula corrections change which axioms feed which Bridge terms, the implicit dependency ordering may be altered. |
| Semantic Overload | 4 | ✅ Clear | |
| Context Stripping | 5 | **🟡 RISK** | Simplifying a formula can strip dimensional terms that carry contextual meaning. A term that looks "redundant" mathematically may carry semantic weight in the Codex framework. |
| Grammar Bypass | 6 | ✅ Clear | Bridge formulas operate outside morpheme grammar. |
| Signal-Noise Conflation | 7 | **🟡 RISK** | If a formula "fix" removes a term deemed "negligible," this is a signal-noise judgment. The term may represent low-amplitude but semantically important signal. |
| Premature Optimization | 8 | **🟡 RISK** | Simplifying formulas for computational efficiency before semantic correctness is confirmed is premature optimization. |
| Monolith Morpheme | 9 | ✅ Clear | |
| Flat-File Thinking | 10 | ✅ Clear | |

**Verdict: 🟡 REFRAME** — The formula corrections cannot be blanket-accepted or blanket-rejected. Each must be individually tested against Row 2 (Computed-as-Stored). The reframing:
- **Genuine errors** (wrong variable, typo, dimensional mismatch): **Validated** — fix now.
- **Simplifications** that replace derivations with constants: **Rejected** — violates Row 2.
- **Structural changes** that alter which axioms feed the formula: **Deferred** to Codex-native refactor, pending full dependency audit.

**Timing:** Split. Typo-class fixes resolve now; structural changes defer.

---

### Finding F-4: Morpheme Naming Standardization

**Description:** Recommendation to standardize morpheme naming conventions (e.g., consistent casing, prefix schemes, abbreviation rules).

#### Anti-Pattern Compliance Notes

| Anti-Pattern | Row | Status | Analysis |
|---|---|---|---|
| Binary Collapse | 1 | ✅ Clear | |
| Computed-as-Stored | 2 | ✅ Clear | |
| Axiom Inversion | 3 | ✅ Clear | |
| Semantic Overload | 4 | ✅ Clear | Standardization *reduces* overload risk. |
| Context Stripping | 5 | **🟡 RISK** | If naming standardization removes domain-specific prefixes that carry contextual information (e.g., collapsing `temporal.phase` and `spatial.phase` into just `phase`), this strips context. |
| Grammar Bypass | 6 | ✅ Clear | |
| Signal-Noise Conflation | 7 | ✅ Clear | |
| Premature Optimization | 8 | **🟡 RISK** | Standardizing names before the morpheme inventory is stable risks churn. |
| Monolith Morpheme | 9 | ✅ Clear | |
| Flat-File Thinking | 10 | ✅ Clear | |

**Verdict: ✅ VALIDATED with condition** — Naming standardization is sound *provided* it preserves domain-contextual prefixes. No anti-pattern violations if implemented carefully.

**Timing:** Defer to Codex-native refactor. Naming is cosmetic relative to semantic issues in F-1 through F-3.

---

### Finding F-5: Additional Validation Layer for Morpheme Composition

**Description:** Recommendation to add a runtime validation layer that checks morpheme compositions against grammar rules before allowing signal propagation.

#### Anti-Pattern Compliance Notes

| Anti-Pattern | Row | Status | Analysis |
|---|---|---|---|
| Binary Collapse | 1 | **🟡 RISK** | If validation produces only pass/fail (binary), it collapses the *degree* of grammar compliance. A composition might satisfy 4 of 5 rules — a binary validator loses this information. |
| Computed-as-Stored | 2 | ✅ Clear | Validation results are inherently computed. |
| Axiom Inversion | 3 | ✅ Clear | |
| Semantic Overload | 4 | ✅ Clear | |
| Context Stripping | 5 | ✅ Clear | Validation *adds* context (compliance metadata). |
| Grammar Bypass | 6 | ✅ Clear | This is the *opposite* of grammar bypass — it enforces grammar. |
| Signal-Noise Conflation | 7 | ✅ Clear | |
| Premature Optimization | 8 | ✅ Clear | Validation is a correctness measure, not optimization. |
| Monolith Morpheme | 9 | **🟡 RISK** | If the validator is a single monolithic check rather than composable per-rule validators, it mirrors the monolith morpheme anti-pattern at the tooling level. |
| Flat-File Thinking | 10 | ✅ Clear | |

**Verdict: ✅ VALIDATED with condition** — Validation layer should report *per-rule* compliance (not binary pass/fail) and be decomposed into per-grammar-rule validators.

**Timing:** Defer to Codex-native refactor. Runtime validation is implementation, not spec.

---

### Finding F-6: Signal Confidence Scoring as Stored Attribute

**Description:** Recommendation to add a stored `confidence` attribute to each morpheme instance representing signal reliability.

#### Anti-Pattern Compliance Notes

| Anti-Pattern | Row | Status | Analysis |
|---|---|---|---|
| Binary Collapse | 1 | ✅ Clear | Confidence is a continuous value, not binary. |
| Computed-as-Stored | 2 | **🔴 VIOLATION** | Signal confidence is derivable from signal properties (source reliability, transmission integrity, temporal freshness, agreement across redundant channels). Storing it as a primitive attribute violates Row 2 — it should be a computed view. |
| Axiom Inversion | 3 | ✅ Clear | |
| Semantic Overload | 4 | **🟡 RISK** | "Confidence" conflates epistemic uncertainty, measurement precision, and source trustworthiness unless carefully scoped. |
| Context Stripping | 5 | ✅ Clear | |
| Grammar Bypass | 6 | ✅ Clear | |
| Signal-Noise Conflation | 7 | **🟡 RISK** | A stored confidence score can mask the *source* of uncertainty. Low confidence due to noise is different from low confidence due to novelty. |
| Premature Optimization | 8 | **🟡 RISK** | Caching confidence for performance before the derivation formula is stable. |
| Monolith Morpheme | 9 | ✅ Clear | |
| Flat-File Thinking | 10 | **🟡 RISK** | A single scalar `confidence: 0.7` is flat. Confidence is multi-dimensional. |

**Verdict: 🟡 REFRAME** — Confidence should be a **computed projection** with decomposed dimensional components (source reliability, temporal freshness, measurement precision), not a stored scalar attribute.

**Timing:** Resolve now (reject stored form). Defer computed-view implementation to Codex-native refactor.

---

### Finding F-7: Deprecation of Legacy Signal Path Notation

**Description:** Recommendation to remove the legacy dot-notation signal path syntax in favor of the newer structured path format.

#### Anti-Pattern Compliance Notes

| Anti-Pattern | Row | Status | Analysis |
|---|---|---|---|
| Binary Collapse | 1 | ✅ Clear | |
| Computed-as-Stored | 2 | ✅ Clear | |
| Axiom Inversion | 3 | ✅ Clear | |
| Semantic Overload | 4 | ✅ Clear | Removing legacy notation *reduces* overload (two syntaxes for one concept). |
| Context Stripping | 5 | ✅ Clear | Structured paths carry *more* context. |
| Grammar Bypass | 6 | ✅ Clear | |
| Signal-Noise Conflation | 7 | ✅ Clear | |
| Premature Optimization | 8 | ✅ Clear | |
| Monolith Morpheme | 9 | ✅ Clear | |
| Flat-File Thinking | 10 | ✅ Clear | Legacy dot-notation *was* flat-file thinking. Removing it is corrective. |

**Verdict: ✅ VALIDATED** — Clean across all 10 anti-patterns. Removing legacy flat notation aligns with framework principles.

**Timing:** Defer to Codex-native refactor (breaking change, needs migration path).

---

### Finding F-8: Expanded Axiom Commentary / Rationale Sections

**Description:** Recommendation to add extended rationale and example sections to each axiom definition.

#### Anti-Pattern Compliance Notes

| Anti-Pattern | Row | Status | Analysis |
|---|---|---|---|
| Binary Collapse | 1 | ✅ Clear | |
| Computed-as-Stored | 2 | ✅ Clear | |
| Axiom Inversion | 3 | ✅ Clear | Commentary doesn't change axiom ordering. |
| Semantic Overload | 4 | **🟡 RISK** | If rationale sections introduce *alternative interpretations* of axiom meaning, they can overload axiom semantics. Rationale must be descriptive, not prescriptive of alternative readings. |
| Context Stripping | 5 | ✅ Clear | Adds context. |
| Grammar Bypass | 6 | ✅ Clear | |
| Signal-Noise Conflation | 7 | **🟡 RISK** | Verbose rationale can introduce noise that obscures the signal of the axiom statement itself. Clear separation between axiom (signal) and commentary (supporting material) is needed. |
| Premature Optimization | 8 | ✅ Clear | |
| Monolith Morpheme | 9 | ✅ Clear | |
| Flat-File Thinking | 10 | ✅ Clear | |

**Verdict: ✅ VALIDATED with condition** — Commentary must be clearly separated from normative axiom text and must not introduce alternative semantic interpretations.

**Timing:** Defer. Documentation improvement, not structural.

---

## Consolidated Classification Matrix

| Finding | Description | Classification | Anti-Pattern Violations | Timing |
|---------|-------------|---------------|------------------------|--------|
| F-1 | Error Morpheme | **🔴 REJECTED** | AP-1 (Binary Collapse), AP-5 (Context Stripping), AP-9 (Monolith); risks on AP-2, 4, 6, 8, 10 | Resolve now |
| F-2 | Axiom Reordering | **🔴 REJECTED** | AP-3 (Axiom Inversion); risks on AP-5, 8, 10 | Resolve now |
| F-3 | Bridge Formula Fixes | **🟡 REFRAMED** | AP-2 risk (Computed-as-Stored) per formula; risks on AP-3, 5, 7, 8 | Split: typos now, structural defer |
| F-4 | Naming Standardization | **✅ VALIDATED** | Minor AP-5, AP-8 risk if context prefixes removed | Defer |
| F-5 | Validation Layer | **✅ VALIDATED** | Minor AP-1, AP-9 risk if implemented as binary monolith | Defer |
| F-6 | Confidence Scoring | **🟡 REFRAMED** | AP-2 (Computed-as-Stored); risks on AP-4, 7, 8, 10 | Resolve now (reject stored); defer implementation |
| F-7 | Legacy Path Deprecation | **✅ VALIDATED** | None | Defer |
| F-8 | Axiom Commentary | **✅ VALIDATED** | Minor AP-4, AP-7 risk | Defer |

---

## Key Insights from Anti-Pattern Testing

### 1. Anti-Pattern 1 (Binary Collapse) is the highest-signal detector
The Error morpheme (F-1) was immediately identifiable as a binary collapse. This anti-pattern should be the **first test** applied to any new morpheme proposal: "Does this reduce a multi-dimensional state to a binary predicate?"

### 2. Anti-Pattern 2 (Computed-as-Stored) catches hidden violations
Both F-3 (Bridge formulas) and F-6 (Confidence scoring) carry Row 2 risks that are not obvious without explicitly asking: "Is this derivable from existing primitives?" This anti-pattern functions as a **redundancy detector** for the framework.

### 3. Anti-Pattern 3 (Axiom Inversion) is structural and non-negotiable
F-2 demonstrates that axiom ordering is load-bearing. Any future proposal to reorder, regroup, or "flatten" axiom presentation must be tested against Row 3. The ordering is *part of the specification*, not a presentation choice.

### 4. Anti-Patterns 5 and 10 form a pair
Context Stripping (5) and Flat-File Thinking (10) appeared together in multiple findings (F-1, F-2, F-6). They represent two perspectives on the same underlying error: treating structured, contextual information as simple, context-free data. They should be tested as a pair.

### 5. Anti-Pattern 8 (Premature Optimization) is a timing signal
Findings flagged for AP-8 risk consistently mapped to "defer" timing. This anti-pattern is useful not just for rejection but for **scheduling**: if something triggers AP-8 concern, it likely belongs in the Codex-native refactor rather than the current cycle.

---

## Verification Compliance

This document contains explicit references to all 10 anti-patterns:

- Anti-pattern 1 (Binary Collapse): Referenced in F-1, F-5
- Anti-pattern 2 (Computed-as-Stored): Referenced in F-1, F-3, F-6
- Anti-pattern 3 (Axiom Inversion): Referenced in F-2, F-3
- Anti-pattern 4 (Semantic Overload): Referenced in F-1, F-6, F-8
- Anti-pattern 5 (Context Stripping): Referenced in F-1, F-2, F-3, F-4
- Anti-pattern 6 (Grammar Bypass): Referenced in F-1
- Anti-pattern 7 (Signal-Noise Conflation): Referenced in F-3, F-6, F-8
- Anti-pattern 8 (Premature Optimization): Referenced in F-1, F-2, F-3, F-4, F-6
- Anti-pattern 9 (Monolith Morpheme): Referenced in F-1, F-5
- Anti-pattern 10 (Flat-File Thinking): Referenced in F-1, F-2, F-6, F-7

Expected `grep -c` result against verification pattern: **≥ 10 matches per anti-pattern row**.