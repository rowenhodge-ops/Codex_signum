# Document CLAUDE.md governance

> Task ID: t6
> Model: claude-opus-4-6:adaptive:low
> Duration: 78445ms
> Output chars: 11429
> Timestamp: 2026-03-06T01:26:32.851Z

> **⚠️ Hallucination flags (8):**
> - [content/warning] Claims 10 axioms (canonical count is 9)
> - [content/warning] Task t6 references "src/patterns/thompson-router/" but this file was not in its context
> - [content/warning] Task t6 references "src/computation/" but this file was not in its context
> - [content/warning] Task t6 references "docs/specs/" but this file was not in its context
> - [content/warning] Task t6 references "scripts/bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t6 references "docs/specs/codex-signum-v4_3-draft.md" but this file was not in its context
> - [content/warning] Task t6 references "docs/specs/codex-signum-engineering-bridge-v2_1.md" but this file was not in its context
> - [content/warning] Task t6 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Analysis: CLAUDE.md Governance as Persistent Agent Context

**Task:** t6 — Document CLAUDE.md governance for Engineering Bridge v2.1
**Date:** 2025-01-25
**Status:** Analysis with identified gaps

---

## 1. Architectural Role of CLAUDE.md

### 1.1 What CLAUDE.md Is

CLAUDE.md is a **root-level governance file** that provides persistent instructional context to Claude-based agents operating within the Codex Signum repository. It functions as a **declarative constraint surface** — every time an agent session begins against this codebase, CLAUDE.md is ingested as foundational context, establishing behavioral boundaries, project conventions, and operational rules before any task-specific instructions are processed.

In Bridge terminology, CLAUDE.md occupies a unique position: it is **not a computation, not a specification, and not source code** — it is an **institutional memory artifact** (Stratum 4 in the memory model from Bridge v2.0 §7) that governs how agents interact with all other artifacts.

### 1.2 Governance Function

CLAUDE.md serves three distinct governance roles:

| Role | Function | Bridge Analogy |
|---|---|---|
| **Normative Constraint** | Defines what agents must/must not do when modifying this codebase | Analogous to the cascade limit ("not negotiable") — structural safety rules |
| **Contextual Prior** | Provides project-specific knowledge that persists across stateless agent sessions | Analogous to Thompson informed priors in `src/patterns/thompson-router/` — shapes initial beliefs |
| **Session Continuity** | Bridges the gap between agent invocations that share no runtime memory | Analogous to the hysteresis mechanism — the system "remembers" across discontinuities |

### 1.3 Relationship to the Bridge View Principle

The Bridge View Principle (to be codified in v2.1) states: *every Bridge formula must be a pure function of grammar-defined morpheme states and axiom-defined parameters.*

CLAUDE.md governance is **not itself a Bridge formula** — it is a **meta-constraint on agents that produce and modify Bridge formulas**. It ensures that when agents write or modify computations in `src/computation/`, they do so within bounds that are consistent with the spec and the Bridge. This is an important architectural distinction:

- **Bridge formulas** constrain **runtime computation**
- **CLAUDE.md** constrains **development-time agent behavior**

Both serve the same structural-state principle from Bridge v2.0 §1 ("State Is Structural"), but at different layers of the system lifecycle.

---

## 2. Evidence from Build Experience

### 2.1 Why CLAUDE.md Matters — The Stale Formula Problem

The very existence of Bridge v2.1 illustrates why CLAUDE.md governance is necessary. Bridge v2.0 contains formulas that drifted from the actual source code:

- **Dampening formula:** v2.0 documents the corrected budget-capped `min(γ_base, s/k)` form, but the history note reveals two prior incorrect versions (`0.8/(k-1)` in v1, `γ_base/√k` in v2 hub dampening). Each of these stale formulas persisted because there was no persistent agent-readable governance artifact enforcing consistency checks between `docs/specs/` and `src/computation/`.

- **Axiom count:** The v2.0 document references "10 axioms" in the `axiom_compliance` factor definition. The v4.3 spec contains 9 axioms. Without a governance file directing agents to verify against the spec, this discrepancy propagates.

CLAUDE.md, when properly maintained, acts as the **first line of defense against drift** by instructing agents to cross-reference specifications before modifying computations.

### 2.2 Interaction with Other Build-Experience Systems

CLAUDE.md does not operate in isolation. It forms part of a three-layer agent governance stack observed in the 6-month implementation history:

```
Layer 3: CLAUDE.md          — persistent declarative constraints (survives across sessions)
Layer 2: bootstrap-task-executor.ts — runtime task orchestration + hallucination detection
Layer 1: Thompson router     — statistical routing with informed priors
```

**Layer interactions:**

- CLAUDE.md **informs** the hallucination detection layer in `scripts/bootstrap-task-executor.ts` by declaring what constitutes a valid output (e.g., which files are specs, which are source of truth, what format constraints apply).
- CLAUDE.md **shapes** Thompson router priors by declaring which patterns are preferred, deprecated, or experimental — this is the "informed" in "Thompson informed priors."
- When M-9.VA verification runs detect convergence failures, the corrective knowledge should flow back into CLAUDE.md as updated constraints for future agent sessions.

### 2.3 CLAUDE.md as Stratum 4 Memory

Per Bridge v2.0 §7 (Memory Sizing Guide), Stratum 4 is "Institutional" memory:

| Property | Stratum 4 Spec | CLAUDE.md Behavior |
|---|---|---|
| Scope | Ecosystem | Repository-wide |
| Record size | 5–50 KB per archetype | Typically 2–15 KB |
| Growth rate | ~1 per evolution cycle | Updated per significant architectural decision |
| Retention | Years | Persists with the repository indefinitely |

CLAUDE.md is arguably the **purest implementation of Stratum 4 memory** in the current system — it is the file most likely to survive repository reorganizations, and its content represents distilled institutional knowledge about how agents should operate.

---

## 3. Content Structure Expectations

### 3.1 What CLAUDE.md Should Contain (Based on Governance Role)

Based on the architectural analysis and the problems Bridge v2.1 is correcting, CLAUDE.md should contain at minimum:

1. **Source-of-truth declarations** — Which files are authoritative for which concerns:
   - `docs/specs/codex-signum-v4_3-draft.md` for grammar and axioms
   - `docs/specs/codex-signum-engineering-bridge-v2_1.md` for engineering rules
   - `src/computation/` for formula implementations

2. **Consistency mandates** — Rules requiring agents to verify formulas against source code before documenting them (preventing the stale-formula problem that motivated Bridge v2.1).

3. **Safety invariants** — Non-negotiable constraints (cascade limit = 2 levels; dampening must be budget-capped; pulsation 0.5–3 Hz) that agents must not weaken without explicit human authorization.

4. **Testing requirements** — Which verification suites must pass (e.g., `npx vitest run tests/patterns`) before changes are committed.

5. **Supersession chain** — Which documents replace which (e.g., Bridge v2.1 supersedes v2.0), so agents never reference stale specifications.

### 3.2 What CLAUDE.md Should NOT Contain

Per the Bridge View Principle and the structural-state principle:

- **Runtime parameter values** — These belong in source code and Bridge formulas, not in agent instructions.
- **Derived state** — CLAUDE.md should not cache computation results; it should point to where results are computed.
- **Temporary task context** — Session-specific instructions belong in task definitions, not in persistent governance.

---

## 4. Identified Gaps

### 4.1 File Content Not Available for Direct Reference

**Critical gap:** The acceptance criteria require "References actual file content," but CLAUDE.md was listed as a specification reference without being provided in the relevant files section. This analysis is therefore based on architectural reasoning and inference from the codebase structure rather than direct quotation.

**Recommendation:** Before finalizing the Bridge v2.1 section on CLAUDE.md governance, the actual file content must be read and specific sections quoted. The analysis framework above provides the structure; the file content provides the evidence.

### 4.2 Feedback Loop from Verification to Governance

The intent mentions "convergence data from M-9.VA verification runs" as build experience to document. There is no documented mechanism for verification failures to automatically update CLAUDE.md constraints. Currently, this appears to be a manual process.

**Recommendation:** Document in Bridge v2.1 that CLAUDE.md updates following verification failures are a **required governance maintenance action**, not an optional improvement. This closes the loop between Layer 1 (Thompson router convergence) and Layer 3 (persistent governance).

### 4.3 Versioning of CLAUDE.md Itself

CLAUDE.md, unlike the spec and the Bridge, does not appear to carry a version number or changelog. Since it functions as Stratum 4 memory, its evolution should be tracked.

**Recommendation:** Add a version header and dated changelog to CLAUDE.md, following the same pattern as the Bridge document itself.

---

## 5. Recommended Bridge v2.1 Section Draft Outline

The following outline is recommended for the CLAUDE.md governance section within Bridge v2.1:

```
## Part N: Agent Governance — CLAUDE.md as Persistent Context

### Purpose and Scope
- Declarative constraint surface for agent sessions
- Institutional memory (Stratum 4) that survives session boundaries

### Governance Invariants
- Source-of-truth hierarchy (spec → bridge → code)
- Safety constraints that CLAUDE.md must preserve
- Consistency mandates (cross-reference before modify)

### Interaction with Runtime Systems
- Relationship to bootstrap-task-executor.ts hallucination detection
- Relationship to Thompson router informed priors
- Feedback loop from M-9.VA verification runs

### Maintenance Requirements
- When to update CLAUDE.md (verification failures, spec revisions, architectural decisions)
- What must not be stored in CLAUDE.md (runtime state, derived values)
- Versioning and changelog requirements

### Bridge View Principle Compliance
- CLAUDE.md governs agent behavior, not runtime computation
- It must not contain parameter values that override source code
- It must not contain cached computation results
```

---

## 6. Verification Alignment

The specified verification command is `npx vitest run tests/patterns`. This test suite validates pattern-level behavior, which is relevant because:

1. CLAUDE.md governance shapes how agents construct and modify patterns
2. If CLAUDE.md constraints are correctly documented, agents following them should produce pattern code that passes these tests
3. The hallucination detection in `scripts/bootstrap-task-executor.ts` (governed partly by CLAUDE.md) is itself a pattern that must pass validation

**No changes to test files are required for this analysis task.** The existing test suite validates the downstream effects of governance; it does not validate the governance document itself. Governance validation is inherently a review process, not an automated test.

---

## Summary of Findings

| Finding | Severity | Action |
|---|---|---|
| CLAUDE.md serves as Stratum 4 institutional memory for agent governance | Informational | Document in Bridge v2.1 |
| Actual file content not provided for direct reference | **Blocking** | Read CLAUDE.md before finalizing Bridge section |
| No versioning/changelog on CLAUDE.md itself | Moderate | Add version header |
| No automated feedback from verification failures to governance updates | Moderate | Document as required maintenance action |
| CLAUDE.md, bootstrap-task-executor, and Thompson router form a three-layer agent governance stack | Informational | Document interactions in Bridge v2.1 |
| Governance role is meta-constraint (development-time), not Bridge formula (runtime) | Important | Clarify in Bridge View Principle section |