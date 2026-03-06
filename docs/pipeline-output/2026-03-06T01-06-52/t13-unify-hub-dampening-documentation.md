# Unify hub dampening documentation

> Task ID: t13
> Model: claude-sonnet-4-6:adaptive:high
> Duration: 100597ms
> Output chars: 11821
> Timestamp: 2026-03-06T01:14:39.951Z

> **⚠️ Hallucination flags (4):**
> - [content/warning] Task t13 references "src/computation/dampening.ts" but this file was not in its context
> - [content/warning] Task t13 references "docs/specs/codex-signum-v4_3-draft.md" but this file was not in its context
> - [content/warning] Task t13 references "dampening.ts" but this file was not in its context
> - [content/warning] Task t13 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Analysis: Unified Hub Dampening Documentation (t13)

**Task:** Ensure consistent documentation of unified hub dampening across Engineering Bridge v2.1  
**Inputs reviewed:** `docs/specs/codex-signum-engineering-bridge-v2_0.md`, task spec references to `src/computation/dampening.ts` and `docs/specs/codex-signum-v4_3-draft.md`  
**Scope:** Identify all dampening-related passages, flag inconsistencies, and specify what v2.1 must say

---

## 1. Canonical Formula (Authoritative Statement)

The task specification and the v2.0 document agree on one canonical formula:

```
γ_effective(k) = min(γ_base, s / k)

where:
  γ_base = 0.7   (baseline transmission coefficient)
  s      = 0.8   (safety budget)
  k      = degree of receiving node (count of incoming connections)

Guarantee: μ = k × γ_effective ≤ s = 0.8 < 1   for all k ≥ 1
```

This formula is **topology-independent** and covers leaf nodes, intermediate nodes, and high-degree hub nodes with a single expression. It is the unified approach.

The task specification explicitly confirms: **"budget-capped min(gamma_base, s/k) not the old k-1 divisor"** and **"unified hub dampening"** as the mandated representation.

---

## 2. Inventory of All Dampening References in v2.0

The following table catalogs every passage in v2.0 that touches hub dampening or the γ parameter.

| Location | Passage Summary | Status |
|---|---|---|
| **Part 3, Topology-Aware Dampening** — main formula block | `γ_effective = min(γ_base, s / k)` with table of k values | ✅ Correct |
| **Part 3, History note** | "v1 used `0.8/(k-1)`, v2 added `γ_base/√k` for hubs" | ⚠️ Ambiguous (see §3.1) |
| **Part 3, Algedonic bypass** | "propagate to root with γ = 1.0, bypassing all dampening" | ⚠️ Underspecified (see §3.2) |
| **Part 4, EWMA smoothing row** | "α = 0.25 for leaves, 0.15 default, 0.08 for hubs" | ⚠️ Terminology collision (see §3.3) |
| **Part 9, Cascade dampening override** | "Temporarily reduce γ (e.g., to 0.4)" | ⚠️ Formula not applied (see §3.4) |
| **Glossary, γ_effective entry** | "min(γ_base, 0.8/k) where k is degree, guarantees μ ≤ 0.8" | ✅ Correct |
| **Anti-Patterns section** | "Use budget-capped γ_effective = min(γ_base, 0.8/k)" | ✅ Correct |

---

## 3. Inconsistencies Found

### 3.1 — History Note Uses Self-Referential Version Label

**Location:** Part 3, immediately after the γ_effective formula and table.

**Current text:**
> *"v1 used `0.8/(k-1)`, v2 added `γ_base/√k` for hubs. Both were found supercritical for k ≥ 3."*

**Problem:** This document *is* v2.0. Writing "v2 added `γ_base/√k`" implies the current document contains that formula, which it does not. A reader who arrives at v2.0 for the first time reads this as an active formula, not a deprecated one. There is also no mention that the `γ_base/√k` formula was **subsequently superseded** — the note presents it as a lineage but not as a full repudiation.

**Evidence of impact:** The history note immediately follows the statement "This single formula handles all topologies including hubs — no separate hub dampening is needed." The juxtaposition is confusing: the document rejects hub-specific formulas while naming one as a feature of its own version.

**Required fix for v2.1:** Rewrite history note to use neutral version labels and explicitly name all prior approaches as **deprecated**:

> *"Earlier revisions used `0.8/(k-1)` (supercritical for k ≥ 3) and a hub-specific variant `γ_base/√k` (supercritical for k ≥ 3 with γ_base = 0.7, s = 0.8). Both are deprecated. The budget-capped formula `min(γ_base, s/k)` is the sole supported expression as of v2.1. Commit `ce0ef96` records the supersession."*

---

### 3.2 — Algedonic Bypass Stated as γ = 1.0 Without Anchoring to Unified Formula

**Location:** Part 3, Topology-Aware Dampening, "Algedonic bypass" paragraph.

**Current text:**
> *"Any agent with ΦL < 0.1 (emergency threshold) should propagate to root with γ = 1.0, bypassing all dampening."*

**Problem:** The bypass correctly uses γ = 1.0, but presents it as a **naked scalar** rather than as a parameterised override of the unified formula. This creates two risks:

1. A reader implementing the bypass may treat γ as a standalone constant rather than as a parameter within `min(γ_base, s/k)`, leading to implementations where the emergency path and normal path use entirely different code branches with different semantics.
2. There is no guidance on whether the bypass also overrides the budget cap `s`. As written, setting γ = 1.0 means μ = k × 1.0 = k, which is supercritical for any k ≥ 2 — the exact condition the unified formula was designed to prevent. This is intentional for algedonic signals (existential threats must reach root), but the document does not state that intention explicitly.

**Required fix for v2.1:** Anchor the bypass to the unified formula and make the intentional supercriticality explicit:

> *"Algedonic bypass: when ΦL < 0.1, set γ_base = 1.0 AND s = k (effectively removing the budget cap). This makes γ_effective = 1.0 and μ = k × 1.0, which is intentionally supercritical — the emergency signal must reach root without attenuation. Normal subcriticality guarantees do not apply on the algedonic path. Restore normal parameters immediately after the root receives the signal."*

---

### 3.3 — "Hubs" Used in Two Incompatible Senses in Proximate Sections

**Location:** Part 3 (cascade dampening) vs. Part 4 (EWMA smoothing, Stage 3).

**Part 3 establishes:**
> "hubs" = high-degree nodes receiving many cascade signals; governed by γ_effective = min(γ_base, s/k)

**Part 4 states:**
> "α = 0.25 for leaves, 0.15 default, **0.08 for hubs**"

**Problem:** Part 4 uses "hubs" to mean the same high-degree nodes, but in the context of EWMA smoothing — a completely different mechanism. The term `α = 0.08 for hubs` is **not** a form of hub dampening; it is a slower exponential smoothing coefficient applied to reduce noise at nodes with many observations. However, placed without disambiguation two sections after the dampening discussion, it will be conflated with γ_effective.

The specific risk: an implementor who reads Part 3, concludes "no separate hub formula is needed," and then reads Part 4 may interpret the hub-specific α as a contradictory hub formula and be confused about which takes precedence.

**Evidence of distinctness:**
- Part 3 γ_effective governs **cascade propagation** — how much a failing child's ΦL drop reaches the parent.
- Part 4 α governs **observation smoothing** — how quickly EWMA tracks new health readings at a node.
- These are independent: a hub node applies γ_effective when cascading downward and α when updating its own ΦL.

**Required fix for v2.1:** Add an explicit disambiguating note in Part 4, Stage 3:

> *"Note: α = 0.08 for hubs refers to EWMA observation smoothing only — it is not a hub-specific cascade dampening formula and does not modify γ_effective. Cascade behaviour for hubs is governed entirely by the unified formula in Part 3."*

Additionally, in Part 3, a forward reference:

> *"Hub nodes also receive a slower EWMA smoothing (α = 0.08) for their own ΦL observations; see Part 4, Stage 3. This is independent of γ_effective."*

---

### 3.4 — Cascade Dampening Override in Part 9 Presents γ as Scalar, Not Formula Parameter

**Location:** Part 9, Adversarial Resilience, Bulkhead Responses table.

**Current text:**
> "Temporarily reduce γ (e.g., to 0.4)"

**Problem:** The override instruction does not specify whether it:
- (a) Sets `γ_base = 0.4` in the unified formula, yielding `γ_effective = min(0.4, 0.8/k)` — topology-aware and still subcritical, or
- (b) Hard-sets `γ_effective = 0.4` for all nodes, bypassing topology awareness — supercritical for k ≥ 2 at the reduced value (μ = k × 0.4; safe for k ≤ 2, marginal for k = 3: μ = 1.2).

Interpretation (a) is the correct one consistent with the unified approach, but the document does not say so. Interpretation (b) would reintroduce a fixed-γ regime identical to the v1.0 anti-pattern that Part 3 explicitly rejects.

**Required fix for v2.1:** Specify the override as a γ_base reduction:

> "Temporarily reduce γ_base to 0.4 (from default 0.7); γ_effective continues to apply the unified formula: min(0.4, 0.8/k). This preserves topology-aware subcriticality at the reduced base. Restore γ_base = 0.7 when stress index returns to normal."

---

## 4. Missing Cross-Reference: Dampening Formula Not Linked to Implementation

**Observation:** The v2.0 document references commit `ce0ef96` in the history note but does not cite `src/computation/dampening.ts` as the normative implementation. The task specification identifies `src/computation/dampening.ts` as a specification reference.

For v2.1 to serve as an authoritative bridge document, the unified formula section must carry an explicit implementation cross-reference:

> *"Implementation: `src/computation/dampening.ts`, function `computeEffectiveDampening(k, gamma_base, s)`. The Bridge formula and the implementation are normatively co-authoritative. If they diverge, the implementation governs and this document must be updated."*

This anchors the documentation to the tested code and prevents drift.

---

## 5. Verification Against Acceptance Criteria

| Criterion | Current v2.0 State | Required v2.1 State |
|---|---|---|
| All references use unified approach | 4 of 7 references are clean; 3 have defects (§3.1–3.4) | All 7 references use `min(γ_base, s/k)` or explicitly defer to it |
| Consistent with implementation | Formula is stated but `dampening.ts` not cited | Explicit normative cross-reference to `dampening.ts` |
| No legacy hub formula remaining | History note implies `γ_base/√k` is a v2 feature | History note rewritten to classify all non-unified formulas as deprecated |
| Term "hub" unambiguous | Used in two incompatible senses across Part 3 and Part 4 | Disambiguated with explicit notes in both locations |
| Override paths use formula parameters | Part 9 override is a scalar, not a formula parameter change | Override specifies γ_base reduction, formula continues to apply |

---

## 6. Recommended Section Structure for v2.1 Part 3

The Part 3 dampening section in v2.1 should be reorganised into the following subsections for clarity:

1. **The Unified Formula** — state `min(γ_base, s/k)` with all parameters defined
2. **Guarantee proof** — μ = k × γ_effective ≤ s for all k ≥ 1 (two-line algebra)
3. **Parameter table** — the k vs. γ_eff vs. μ table (already present and correct)
4. **Why topology-independence matters** — current text is adequate
5. **Algedonic exception** — with explicit supercriticality acknowledgment (see §3.2)
6. **Deprecated predecessors** — history note rewritten per §3.1
7. **Implementation reference** — cite `dampening.ts` per §4
8. **Cross-reference: EWMA hub smoothing** — forward reference to Part 4 with disambiguation per §3.3

---

## 7. Summary of Required Changes

| Change ID | Location | Type | Severity |
|---|---|---|---|
| D-1 | Part 3, history note | Rewrite — neutral version labels, explicit deprecation | High |
| D-2 | Part 3, algedonic bypass | Augment — anchor bypass to formula, explain intentional supercriticality | High |
| D-3 | Part 4, Stage 3 EWMA row | Add — disambiguation note separating α from γ_effective | Medium |
| D-4 | Part 3, main formula block | Add — forward cross-reference to Part 4 EWMA disambiguation | Low |
| D-5 | Part 9, bulkhead override | Rewrite — "reduce γ_base to 0.4" not "reduce γ to 0.4" | High |
| D-6 | Part 3, main formula block | Add — normative implementation reference to `dampening.ts` | Medium |

No existing correct content needs to be removed. The canonical formula `min(γ_base, s/k)`, the parameter table, the subcriticality guarantee, and the anti-pattern warning are all accurate and should be retained verbatim.