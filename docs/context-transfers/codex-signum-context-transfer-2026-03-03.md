# Codex Signum — Context Transfer 2026-03-03

## Session Summary

Strategic planning session. No code written. Deep review and refinement of roadmap v5, closing gaps in test gate policy, Bridge View Principle detail, computation documentation status, model selection strategy, grammar reference, hypothesis tracking, and milestone sequencing. Milestones M-10 through M-15 and M-18 un-ice-boxed and properly sequenced. Lightning-in-a-bottle vision captured as M-19 (hypothesis tracking + research pipeline). This was a "pause and get the plan right" session — the kind that accelerates everything downstream.

## Repository Access

- **GitHub user:** `rowenhodge-ops`
- **Codex_signum:** `rowenhodge-ops/Codex_signum` (public, Apache 2.0)
- **DND-Manager:** `rowenhodge-ops/DND-Manager` (public, Apache 2.0)

---

## Where We Left Off

**M-8C.V complete** (20812f5). Active milestone: M-8.QG (quality gates) ⏳, then M-9 (structural compliance).

**Roadmap v5 is the canonical implementation plan.** 814 lines. All milestones through M-19 are sequenced with dependencies, test gates, model recommendations, and exit criteria. The ice box contains only M-9-DND (DND-Manager reconnection).

**No code was changed.** This was a pure planning session. The repository is unchanged from the prior session.

---

## Architectural Decisions Made (This Session)

### 1. Test Gate Policy — Contradictory Constraint Fixed

The original policy said "no phase advances with failing tests" + "tests verify spec requirements" + "spec not built yet" = agent writes tests verifying current behavior and calls them spec tests. This is exactly what produced 213 useless tests.

**Corrected policy:** Two categories — in-scope tests (block gate) and `@future(M-{N})` tests (expected to fail, promote to in-scope when their milestone begins). Gate success = all in-scope pass OR architect risk-accepts with rationale. Positive framing throughout.

### 2. Bridge View Principle — Full Codification Detail

M-17.2 was two sentences. Now fully specified: the principle itself, the nine M-8A recommendations it resolved, what codification means (normative constraint, testable compliance check, Assayer corpus entry, retroactive audit, CLAUDE.md constraint). Highest-value single architectural constraint in the project.

### 3. M-17.4 — Code Is Ahead of the Spec

Most deferred computation details ARE implemented. The Bridge document doesn't reflect this. εR spectral calibration flagged as ⚠️ VERIFY.

### 4. Agent Model Selection Strategy

Per-milestone recommendations: Opus 4.6 for architectural judgment, Sonnet 4.6 for well-scoped implementation, Codex 5.3 for UI work. Consolidated table in roadmap.

### 5. Grammar Reference Gap Identified

No single document lists every structural element. M-9.7 produces this as its first deliverable.

### 6. ΦL/ΨH/εR on Pipeline Performance

Computation code works. Pipeline has no graph nodes to compute health ON. M-9 fixes this.

### 7. Milestones Un-Ice-Boxed

M-10, M-11, M-12, M-14, M-15, M-18 — properly sequenced as post-critical-path milestones.

### 8. Hypotheses as Helixes, Papers as Blooms (M-19)

Six hypotheses (H-1 through H-6) as Helix morphemes. Five research papers as Blooms. Tracking starts at M-9.7. Sandbox evaluation pattern. Flywheel effect.

### 9. Process Maps Are Institutional Knowledge, Not Grids

SIPOCs consumed during planning, not runtime. Stratum 4, not morphemes.

### 10. FMEA Three-Layer Lifecycle

Assayer pre-DISPATCH advisory: per-task failure modes and detection signatures.

---

## Validated Refinements Added

| # | Refinement | Implement At |
|---|-----------|-------------|
| R-19 | Grammar reference document | M-9.7 |
| R-20 | Lean process maps v2 correction | M-9.7 |
| R-21 | Hypothesis Helix nodes (H-1 through H-6) | M-9.7/M-9.8 |
| R-22 | Research paper Bloom structure | M-11 |
| R-23 | Sandbox evaluation pattern | M-13 |
| R-24 | Flywheel validation | M-14 |

---

## What Next Session Should Do

1. **Execute M-8.QG** — quality gates (Sonnet 4.6)
2. **Then M-9.1** — schema for pipeline nodes (Sonnet 4.6)
3. **Start M-9.7 grammar reference early** — planning artifact (Opus 4.6)

---

## Lesson

> Sometimes it's good to pause, take a breath, and dive into the detail of the plan. No matter how smart the LLMs are, good structure, dependency management, and outcome orientation win out every time.

---

*This document is a snapshot. After M-9.8, the graph is the source of truth.*