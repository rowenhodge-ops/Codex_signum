# Add supersession notice to v2.0

> Task ID: t11
> Model: claude-opus-4-6:adaptive:high
> Duration: 67576ms
> Output chars: 10370
> Timestamp: 2026-03-06T01:19:02.836Z

> **⚠️ Hallucination flags (6):**
> - [content/warning] Task t11 references "docs/specs/codex-signum-engineering-bridge-v2_1.md" but this file was not in its context
> - [content/warning] Task t11 references "src/computation/" but this file was not in its context
> - [content/warning] Task t11 references "docs/specs/" but this file was not in its context
> - [content/warning] Task t11 references "codex-signum-engineering-bridge-v2_1.md" but this file was not in its context
> - [content/warning] Task t11 references a document ("docs/specs/01_codex-signum-v3_0.md") that was not in its context
> - [content/warning] Task t11 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Analysis: Supersession Notice for Engineering Bridge v2.0 (Task t11)

**Task:** t11 — Add supersession notice to v2.0
**Target file:** `docs/specs/codex-signum-engineering-bridge-v2_0.md`
**Superseding document:** `docs/specs/codex-signum-engineering-bridge-v2_1.md`
**Date:** 2025-07-17

---

## 1. Purpose

The v2.0 Engineering Bridge document must be clearly marked as superseded so that any reader — human or agent — who encounters it understands immediately that a newer authoritative version exists and that v2.0 should not be used for implementation decisions. This is a standard document governance practice required by the v2.1 intent workstream (6).

---

## 2. Findings

### 2.1 Current v2.0 Front Matter Has No Supersession Mechanism

The v2.0 document opens with:

```markdown
# Codex Signum — Engineering Bridge

## Implementation Constraints and Parameter Guide

**Version:** 2.0
**Companion to:** Codex Signum v3.0 (Consolidated Specification)
**Audience:** Implementors, coding agents, deployment engineers
**Date:** 2026-02-14
```

There is no `Status` field, no `Superseded-by` field, and no deprecation notice. The document presents itself as current and authoritative. The "Companion to" line references Codex Signum v3.0 — itself superseded by v4.3 — which compounds the staleness problem.

### 2.2 The Document Contains Known Stale Content That Could Cause Harm If Followed

Prior task outputs have identified specific errors that make v2.0 actively misleading if used for implementation:

| Finding | Source Task | Severity | Risk If v2.0 Followed |
|---|---|---|---|
| Axiom count stated as 10; actual is 9 | t2 | High | ΦL axiom_compliance computed with wrong denominator |
| History note ambiguously references `γ_base/√k` hub formula within v2.0 context | t1 (§3.1), t13 (§3.1) | Medium | Implementor may believe hub-specific dampening branch is current |
| Companion spec listed as v3.0, not v4.3 | t12 (§2.2) | High | Implementor references wrong version of the Codex |
| Algedonic bypass γ = 1.0 presented as naked scalar, not anchored to unified formula | t13 (§3.2) | Medium | Emergency path implemented as separate code branch with different semantics |
| "Hubs" used in two incompatible senses across proximate sections | t13 (§3.3) | Low | Confusion between cascade dampening and EWMA smoothing |
| No Bridge View Principle constraint | t3 | Medium | Formulas drift from grammar grounding without detection |

These are not minor editorial issues. Following v2.0's axiom count or hub dampening history note could produce incorrect implementations. The supersession notice must convey urgency, not just administrative status.

### 2.3 The v2.0 Document Is Referenced in Multiple Locations

The v2.0 document is likely referenced from:

1. **Code comments** — `src/computation/` files may cite Bridge v2.0 sections for formula rationale.
2. **CLAUDE.md governance files** — Agent context files may point to v2.0 as the authoritative implementation guide.
3. **Other spec documents** — Cross-references within `docs/specs/`.
4. **Milestone trackers and task definitions** — The current task pipeline itself references v2.0 as source material.

The supersession notice must be visible enough that automated searches for "engineering-bridge" surface the deprecation. It must also preserve the v2.0 content intact (do not delete sections) so that existing links resolve without 404s and readers can see what changed.

### 2.4 The Closing Line of v2.0 Also Needs Attention

The document ends with:

> *This document derives from Codex Signum v3.0. The Codex defines the grammar. This document defines how to compute the grammar's properties. When in doubt about implementation, follow this document. When in doubt about intent, read the Codex.*

The instruction "When in doubt about implementation, follow this document" is actively harmful once v2.1 exists. The supersession notice at the top addresses the primary risk, but this closing directive should also be neutralized. A corresponding notice at the bottom ensures readers who scroll to the end (or who are sent to a specific section via anchor link) also see the deprecation.

---

## 3. Requirements for the Supersession Notice

Based on the findings, the notice must satisfy the following requirements:

### 3.1 Placement

| Requirement | Rationale |
|---|---|
| **At the very top of the file** — before the title | Any reader or agent encountering the file sees the notice first, regardless of how they arrived |
| **Visually distinct** — blockquote, admonition, or horizontal-rule-delimited block | Must not blend into the document body; must register as a structural interruption |
| **Repeated at bottom** — brief closing notice replacing or amending the current closing directive | Catches readers who land mid-document via anchor links |

### 3.2 Content Elements

The notice must include:

| Element | Purpose |
|---|---|
| **Explicit "SUPERSEDED" status** | Unambiguous status declaration |
| **Relative link to v2.1** | `codex-signum-engineering-bridge-v2_1.md` — relative path since both files are in `docs/specs/` |
| **Date of supersession** | When v2.1 was published and v2.0 became archival |
| **Brief reason** | One-sentence summary of why — corrected formulas, updated spec companion (v4.3), new content |
| **Specific known-stale items** | At minimum: axiom count (9 not 10), hub dampening history note, companion spec version (v4.3 not v3.0) |
| **Instruction to not implement from v2.0** | Clear directive that v2.0 is retained for historical reference only |
| **Preservation statement** | Confirm the document is kept intact for link stability and change-tracking |

### 3.3 Link Format

The link should use a relative Markdown path:

```
[Engineering Bridge v2.1](codex-signum-engineering-bridge-v2_1.md)
```

This is robust across GitHub rendering, local Markdown preview, and documentation generators. An absolute path from repository root (`docs/specs/codex-signum-engineering-bridge-v2_1.md`) may be added as a secondary reference for agent consumption.

---

## 4. Recommended Notice Structure

### 4.1 Top-of-File Notice

The notice should appear before the existing `# Codex Signum — Engineering Bridge` heading, formatted as a visually distinct block. Recommended structure:

```
> ⚠️ **SUPERSEDED** — This document (Engineering Bridge v2.0) has been superseded by
> [Engineering Bridge v2.1](codex-signum-engineering-bridge-v2_1.md) as of {date}.
>
> **Do not use this document for implementation.** It is retained for historical
> reference and link stability only.
>
> Key corrections in v2.1 include: axiom count (9, not 10), unified hub dampening
> (single budget-capped formula with no hub-specific branches), companion spec
> updated to Codex Signum v4.3, Bridge View Principle added as normative constraint,
> vertical wiring interface specification, and build experience documentation.
>
> **All implementors, coding agents, and deployment engineers should use v2.1.**
```

### 4.2 Bottom-of-File Notice

Replace or amend the existing closing italic paragraph:

```
> ⚠️ **This document is superseded.** See [Engineering Bridge v2.1](codex-signum-engineering-bridge-v2_1.md).
```

The original closing text ("When in doubt about implementation, follow this document") should either be removed or struck through with a note, depending on whether the project convention permits strikethrough in specs.

### 4.3 Version Field Update

The front matter should be amended to include an explicit status:

```
**Version:** 2.0
**Status:** Superseded by v2.1
**Companion to:** Codex Signum v3.0 (Consolidated Specification)
```

This ensures metadata-level queries (grep for `Status:`) surface the deprecation.

---

## 5. Non-Requirements (Scope Boundaries)

| Out of Scope | Reason |
|---|---|
| Editing v2.0 formula content | Content is preserved as-is for archival integrity; corrections live in v2.1 |
| Updating cross-references in other files | Separate task; the supersession notice in v2.0 is self-contained |
| Deleting v2.0 | Explicitly contra-indicated; the file must remain for link stability |
| Adding diff annotations throughout v2.0 body | Would clutter the archival document; the top notice names key corrections |

---

## 6. Verification

The acceptance criteria state:

1. **Clear notice at top of document** — Satisfied by §4.1 structure above.
2. **Links to new version** — Satisfied by the relative Markdown link to `codex-signum-engineering-bridge-v2_1.md`.

Additional verification:

- `npx vitest run tests/spec-gaps` — should confirm the supersession notice exists and contains a valid link target. If the test checks for the presence of v2.1 as the authoritative Bridge document, the notice in v2.0 is a complementary signal (the test's primary check is presumably the existence and content of v2.1 itself).
- Manual: open v2.0 in a Markdown renderer and confirm the notice is visually prominent and the link resolves.

---

## 7. Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| v2.1 file doesn't exist when v2.0 notice is added (broken link) | Medium — depends on task ordering | t12 creates v2.1 skeleton; ensure t12 completes before or concurrently with t11 |
| Agent ignores blockquote notice and follows v2.0 formulas | Low — but nonzero with aggressive context windowing | Include `**SUPERSEDED**` keyword in first line; agents trained on common deprecation patterns will recognize this |
| Readers arrive via deep anchor link and miss top notice | Medium | Bottom-of-file notice (§4.2) mitigates; this is a known limitation of long Markdown documents |
| Notice is too verbose and gets skimmed | Low | The core message ("SUPERSEDED — use v2.1") is in the first line; details follow for those who want them |

---

## 8. Summary

The supersession notice is a straightforward document governance action with one critical nuance: the v2.0 document contains **actively harmful stale content** (wrong axiom count, ambiguous hub dampening history, wrong companion spec version). The notice must therefore go beyond a polite "see newer version" and explicitly warn against implementation use. The recommended approach — prominent top-of-file blockquote, amended front-matter status field, and bottom-of-file closing notice — satisfies both acceptance criteria and the operational safety requirement.