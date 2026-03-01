# Classify Resolution Timeline

> Task ID: t17
> Model: claude-opus-4-6:adaptive:medium
> Duration: 102065ms
> Output chars: 14926
> Timestamp: 2026-03-01T09:37:26.823Z

---

# Task t17 — Classify Resolution Timeline for Consolidated Action Items

## 1. Methodology

Each action item produced by the t16 consolidation pass is evaluated on three axes to determine its resolution timeline:

| Axis | "Resolve Now" Signal | "Defer" Signal |
|---|---|---|
| **Immediate Impact** | Correctness violation; blocks downstream work | Cosmetic; optimization-only; no downstream blocker |
| **Dependencies** | Self-contained; no structural prerequisite | Requires Codex-native type system, new grammar capacity, or axiom renumbering |
| **Strategic Alignment** | Fixes a framework self-contradiction _today_ | Best expressed in idioms that only exist after the refactor |

Items that are **rejected** in t16 receive no timeline — they are excluded from the action list entirely.

---

## 2. Consolidated Action Items with Timeline Classification

### AI-01 — Error Morpheme: Reject Binary Collapse, Reframe to Triadic Fault State

| Field | Value |
|---|---|
| **Source** | Report A §4.2, Report B §3.1 |
| **Original Recommendation** | Introduce a dedicated `Error` morpheme to signal fault conditions. |
| **t16 Classification** | **Reframed** |
| **Axiom Test** | Violates **Axiom 1 (Triadic Structure)**: a single `Error` morpheme reduces the (Signal, Context, Resolve) state-space to a binary ok/error flag. Violates **Axiom 5 (State Sovereignty)**: error is not an independent dimension — it is a _value_ within the existing Resolve dimension. |
| **Grammar Test** | Passes grammar rules 1-5 syntactically, but semantically the morpheme has no valid 3D decomposition — Grammar Rule 2 (State Transition) cannot map a binary token through a triadic transition table. |
| **Anti-Pattern Test** | Triggers **Anti-Pattern Row 1 (Binary Collapse)** and **Row 6 (Dimension Smuggling)** — encoding a Resolve-axis value as a top-level morpheme smuggles one dimension into the morpheme namespace. |
| **Reframed Form** | Represent fault conditions as a _value triple_ within the existing state model: `(Signal: fault-origin, Context: fault-scope, Resolve: fault-severity)`. No new morpheme; instead, extend the Resolve dimension's value vocabulary. |
| **Timeline** | **Resolve now** |
| **Rationale** | If the binary `Error` morpheme ships, every consumer that pattern-matches on it builds a dependency on a framework-violating primitive. The reframe is additive (extending Resolve vocabulary) and self-contained — it does not depend on the Codex-native refactor. Delaying this risks entrenching the anti-pattern. |

---

### AI-02 — Axiom Ordering: Swap Axioms 3 ↔ 5

| Field | Value |
|---|---|
| **Source** | Report B §2.4 |
| **Original Recommendation** | Reorder axioms so that State Sovereignty (currently 5) precedes Compositional Integrity (currently 3), arguing that sovereignty is a prerequisite for valid composition. |
| **t16 Classification** | **Validated** (the logical dependency argument is sound) |
| **Axiom Test** | Self-referential: the change _is_ an axiom-level edit. Cross-check: no other axiom's definition text references a peer by ordinal number, so renumbering has no cascade. |
| **Grammar Test** | Grammar rules reference axioms by name, not number — no breakage. |
| **Anti-Pattern Test** | **Row 4 (Unjustified Reordering)** is _not_ triggered because the dependency justification is provided and verifiable. |
| **Timeline** | **Defer to Codex-native refactor** |
| **Rationale** | The reorder is logically justified but has **zero runtime or correctness impact today** — axioms are referenced by name everywhere that matters. The Codex-native refactor is already planned to produce the canonical axiom registry; performing the swap there avoids a double-touch and keeps the current spec stable for in-flight consumers. |

---

### AI-03 — Engineering Bridge: Normalize Formula to Computed View

| Field | Value |
|---|---|
| **Source** | Report A §5.1, Report B §5.3 |
| **Original Recommendation** | Correct the Engineering Bridge energy-balance formula (`ΔE = …`) by replacing the constant `k₀` with a context-dependent coefficient. |
| **t16 Classification** | **Reframed** |
| **Axiom Test** | Violates **Axiom 6 (Derivation Transparency)**: the formula's output is fully derivable from existing state triples. Hard-coding a "corrected" constant stores a _computed_ value as a _primary_ — the very definition of a phantom derivation. |
| **Grammar Test** | Grammar Rule 4 (Derivation Rule) requires that any value computable from existing morphemes must be expressed as a derivation, not inlined as a literal. |
| **Anti-Pattern Test** | Triggers **Row 2 (Phantom Derivation)** and **Row 8 (Bridge Opacity)** — the bridge becomes opaque when its coefficient cannot be traced to source morphemes. |
| **Reframed Form** | Define `k(ctx)` as a **computed view** — a named derivation that reads `(Signal, Context, Resolve)` of the relevant morphemes and produces the coefficient at query time. The bridge formula references the view, not a constant. |
| **Timeline** | **Resolve now** |
| **Rationale** | The current hard-coded constant produces **incorrect bridge outputs** for any context outside the default. This is a correctness bug. The computed-view pattern is already supported in the current grammar (Rule 4). No refactor dependency. |

---

### AI-04 — Morpheme Namespace: Deduplicate Synonymic Entries

| Field | Value |
|---|---|
| **Source** | Report A §3.3 |
| **Original Recommendation** | Merge 4 pairs of morphemes that share identical `(Signal, Context)` but differ only in label casing. |
| **t16 Classification** | **Validated** |
| **Axiom Test** | Passes all 10. **Axiom 2 (Morphemic Atomicity)** is _strengthened_ by removing synonyms — each atom becomes unique. |
| **Grammar Test** | No violations. |
| **Anti-Pattern Test** | Fixes **Row 3 (Synonym Proliferation)**. |
| **Timeline** | **Resolve now** |
| **Rationale** | Low risk, high clarity gain. Each synonym pair is a potential match-time ambiguity. The fix is mechanical (alias + deprecation notice) and has no structural dependency. |

---

### AI-05 — Grammar Rule 5: Tighten Validation Predicate

| Field | Value |
|---|---|
| **Source** | Report B §4.1 |
| **Original Recommendation** | Add a cardinality constraint to Grammar Rule 5's validation predicate so that a composition cannot contain more than one morpheme of a given role. |
| **t16 Classification** | **Validated** |
| **Axiom Test** | Consistent with **Axiom 3 (Compositional Integrity)** and **Axiom 7 (Anti-Pattern Exclusion)** — the constraint excludes a known malformation. |
| **Grammar Test** | Modifies Rule 5 directly; no conflict with Rules 1-4. |
| **Anti-Pattern Test** | Addresses **Row 5 (Role Duplication)**. |
| **Timeline** | **Resolve now** |
| **Rationale** | Without this constraint, compositions can pass validation while containing conflicting role-bearers. This is an active correctness gap. The predicate change is additive and backward-compatible (all currently-valid well-formed compositions already satisfy it). |

---

### AI-06 — Anti-Pattern Table: Add Row 11 (Temporal Aliasing)

| Field | Value |
|---|---|
| **Source** | Report A §6.2, Report B §6.1 |
| **Original Recommendation** | Both reports independently identify a missing anti-pattern: using the same morpheme identifier across different temporal scopes. |
| **t16 Classification** | **Validated** |
| **Axiom Test** | Supported by **Axiom 5 (State Sovereignty)** (temporal scope is a Context-axis value and must not be conflated) and **Axiom 10 (Idempotent Resolution)** (temporal aliasing breaks idempotency). |
| **Grammar Test** | No rule conflict; the new row is a constraint _on usage_, not a grammar production. |
| **Anti-Pattern Test** | Extends the table; does not contradict rows 1-10. |
| **Timeline** | **Defer to Codex-native refactor** |
| **Rationale** | The anti-pattern is real but currently theoretical — no existing composition in the library triggers it. The Codex-native refactor will introduce explicit temporal scoping, making Row 11 both enforceable and testable at that point. Adding it now without enforcement machinery would be a dead letter. |

---

### AI-07 — Axiom 9 (Bridge Fidelity): Strengthen Losslessness Clause

| Field | Value |
|---|---|
| **Source** | Report B §2.7 |
| **Original Recommendation** | Revise Axiom 9's wording from "bridges _should_ preserve semantic content" to "bridges _must_ preserve semantic content without lossy projection". |
| **t16 Classification** | **Validated** |
| **Axiom Test** | Self-referential (edits Axiom 9). Cross-check: strengthening the clause does not contradict axioms 1-8 or 10. |
| **Grammar Test** | Grammar Rule 4 (Derivation) already assumes losslessness; the axiom edit aligns normative language. |
| **Anti-Pattern Test** | Directly supports enforcement of **Row 8 (Bridge Opacity)** and **Row 9 (Lossy Projection)**. |
| **Timeline** | **Defer to Codex-native refactor** |
| **Rationale** | The wording change is normatively correct but its enforcement tooling (bridge-level semantic diff) is a refactor deliverable. Shipping the stronger wording before the tooling exists creates an un-testable mandate — itself an anti-pattern (**Row 10: Unverifiable Constraint**). Align both together. |

---

### AI-08 — Report A §7.1: Add "Intent" Field to Every Morpheme Record

| Field | Value |
|---|---|
| **Source** | Report A §7.1 |
| **Original Recommendation** | Require every morpheme to carry a free-text `intent` field for documentation purposes. |
| **t16 Classification** | **Rejected** |
| **Axiom Test** | Violates **Axiom 2 (Morphemic Atomicity)**: a free-text field is not decomposable, not matchable, and inflates the morpheme's surface area beyond its irreducible semantic content. |
| **Anti-Pattern Test** | Triggers **Row 7 (Opaque Payload)**: embedding unstructured data inside a typed atom. |
| **Timeline** | **N/A — Excluded** |

---

### AI-09 — Report B §3.5: Introduce "Warning" Severity Level in Resolve Dimension

| Field | Value |
|---|---|
| **Source** | Report B §3.5 |
| **Original Recommendation** | Add a `warning` value to the Resolve dimension's vocabulary, between `nominal` and `fault`. |
| **t16 Classification** | **Validated** |
| **Axiom Test** | Consistent with **Axiom 1 (Triadic Structure)** — extends a dimension's value set without altering dimensionality. Consistent with **Axiom 5 (State Sovereignty)** — the new value lives entirely within Resolve. |
| **Grammar Test** | Rule 2 (State Transition) must be updated to include transition edges to/from `warning`. No structural conflict. |
| **Anti-Pattern Test** | Clean across rows 1-10. Crucially does _not_ trigger Row 1 (Binary Collapse) — it _increases_ granularity. |
| **Timeline** | **Resolve now** |
| **Rationale** | This directly supports the reframed AI-01 (triadic fault state). Without an intermediate severity value, the reframe's `fault-severity` axis has only two values, re-creating a binary in practice. The vocabulary extension is additive and backward-compatible. |

---

### AI-10 — Report A §8.2: Precompute Bridge Outputs for Common Contexts

| Field | Value |
|---|---|
| **Source** | Report A §8.2 |
| **Original Recommendation** | Cache common Engineering Bridge outputs as static lookup tables to improve performance. |
| **t16 Classification** | **Rejected** |
| **Axiom Test** | Violates **Axiom 6 (Derivation Transparency)**: cached outputs are phantom derivations unless they are explicitly marked as derived and invalidated on input change. The recommendation proposes _static_ tables, which cannot self-invalidate. |
| **Anti-Pattern Test** | Triggers **Row 2 (Phantom Derivation)** directly. |
| **Timeline** | **N/A — Excluded** |

---

## 3. Summary Matrix

| ID | Title | t16 Status | Timeline | Blocking? |
|----|-------|-----------|----------|-----------|
| AI-01 | Error Morpheme → Triadic Fault State | Reframed | **Resolve now** | Yes — anti-pattern entrenchment risk |
| AI-02 | Axiom Ordering 3 ↔ 5 | Validated | **Defer** | No — cosmetic; name-referenced |
| AI-03 | Bridge Formula → Computed View | Reframed | **Resolve now** | Yes — correctness bug |
| AI-04 | Morpheme Namespace Dedup | Validated | **Resolve now** | Yes — match-time ambiguity |
| AI-05 | Grammar Rule 5 Cardinality | Validated | **Resolve now** | Yes — validation gap |
| AI-06 | Anti-Pattern Row 11 (Temporal Aliasing) | Validated | **Defer** | No — theoretical; needs enforcement tooling |
| AI-07 | Axiom 9 Losslessness Wording | Validated | **Defer** | No — needs verification tooling first |
| AI-08 | Free-text Intent Field | **Rejected** | N/A | — |
| AI-09 | Warning Severity in Resolve | Validated | **Resolve now** | Yes — prerequisite for AI-01 |
| AI-10 | Static Bridge Caches | **Rejected** | N/A | — |

---

## 4. Dependency Graph for "Resolve Now" Items

```
AI-09 (Warning severity)
  └──▶ AI-01 (Triadic fault state)  [AI-01 needs ≥3 Resolve values]

AI-03 (Computed view for bridge formula)  [independent]

AI-04 (Namespace dedup)  [independent]

AI-05 (Grammar Rule 5 cardinality)  [independent]
```

**Recommended execution order:** AI-09 → AI-01 → {AI-03, AI-04, AI-05} in any order.

---

## 5. Target File Structure — `src/analysis/final-action-items-draft.json`

The JSON output should contain an array of 8 objects (the 2 rejected items are excluded). Each object carries: `id`, `title`, `status` (validated | reframed), `timeline` ("resolve now" | "defer"), `rationale`, `axiom_refs`, `grammar_refs`, `antipattern_refs`, and `depends_on`. The verification command —

```bash
test -f src/analysis/final-action-items-draft.json && \
  jq '.[0].timeline' src/analysis/final-action-items-draft.json | grep -E 'resolve now|defer'
```

— will pass because the first element (AI-01) carries `"timeline": "resolve now"`.

---

## 6. Key Decisions and Justifications

1. **Error morpheme (AI-01) resolved now, not deferred.** Although it touches the morpheme model, the reframe does _not_ require new model infrastructure — it extends an existing dimension's vocabulary. Deferring would allow the binary anti-pattern to root in consumer code.

2. **Axiom reordering (AI-02) deferred.** The logical argument is valid, but the current system references axioms by name. The swap's only benefit is pedagogical ordering — a perfect candidate for the canonical registry the refactor will produce.

3. **Bridge formula (AI-03) reframed _and_ resolved now.** The original "fix the constant" recommendation was itself an anti-pattern (phantom derivation). The reframe to a computed view is implementable today under Grammar Rule 4.

4. **Anti-Pattern Row 11 (AI-06) and Axiom 9 wording (AI-07) both deferred** for the same structural reason: introducing a mandate without enforcement tooling triggers Anti-Pattern Row 10 (Unverifiable Constraint). Both items become enforceable only after the refactor delivers their respective tooling.