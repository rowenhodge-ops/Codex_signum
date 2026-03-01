# Codex Signum — Milestone Roadmap

**Version:** 3.0
**Last updated:** 2026-03-02
**Companion to:** `codex-signum-implementation-plan.md` (phase-level tracking)

---

## Active Milestones

| Milestone | Description | Status |
|-----------|-------------|--------|
| M-7B | Architect pipeline operational — full 7-stage self-hosting validated | ✅ |
| M-8A | Lean review — SIPOC revalidation, gap analysis, value stream mapping | ✅ |
| M-8B | Lean review synthesis — consolidation, prioritisation, FR/NFR definition | ✅ |
| M-8C | Codex-native topology refactor (FR-9, FR-10/11, FR-12-15, R2, R4) | ✅ |
| M-8C.V | Spec edits (R-01 Bridge View, R-02 Axiom DAG) + verification run | ✅ |
| M-7C | Grammar refactor — morpheme-native entity names (Agent→Seed, Pattern→Bloom, observer→feedback) | ✅ |
| M-8 | Optimisation runs — Thompson data generation, human feedback CLI, DevAgent CLI | 🔄 |

---

## Validated Refinements Backlog

Refinements discovered through pipeline analysis and validated across runs.

| ID | Description | Source | Timeline | Status |
|----|-------------|--------|----------|--------|
| R-01 | Bridge View Principle — codify in Engineering Bridge spec | M-8A t15 | M-8C.V (spec edit, no code) | ✅ |
| R-02 | Axiom Dependency Declaration — DAG annotation, topological sort for doc order | M-8A t14 | M-8C.V (spec edit) | ✅ |
| R-03 | Dimensional Collapse anti-pattern — document in CLAUDE.md | M-8A t20 | M-8C (Phase 5) | ✅ |
| R-04 | Post-dispatch consistency check | M-8A t18 | M-8C (Phase 3) | ✅ |

---

## Dependency Graph

```text
M-7B ✅  Architect pipeline operational (7-stage self-hosting)
  └── M-8A ✅  Lean review (SIPOC, gap analysis, value stream)
        └── M-8B ✅  Lean review synthesis (FRs, NFRs, prioritisation)
              └── M-8C ✅  Codex-native topology refactor (FR-9, FR-10/11, FR-12-15, R2, R4)
                    └── M-8C.V ✅  Spec edits + verification run
              └── M-7C ✅  Grammar refactor (Agent→Seed, Pattern→Bloom, observer→feedback)
                    └── M-8 🔄  Optimisation runs + human feedback CLI + DevAgent CLI
```

---

## Deferred (Not Scheduled)

These items were identified during M-8A/M-8B analysis but are not yet scheduled:

| ID | Description | Source | Reason for Deferral |
|----|-------------|--------|---------------------|
| FR-1 through FR-8 | Original lean review FRs | M-8A | Superseded by M-8C scope |
| FR-13 | Pipeline output as graph nodes | M-8B | Requires Neo4j schema extension |
| FR-14 | Multi-dimensional Thompson learning | M-8B | Research-grade — needs hypothesis validation |
| FR-15 | Self-referential axiom review | M-8B | Depends on FR-13 |
| NFR-R1 through NFR-R7 | Refactor NFRs | M-8B | Tracked but not prioritised |

---

## Success Metrics (from M-8B review)

| Metric | M-8A Baseline | M-8C Target | Actual |
|--------|---------------|-------------|--------|
| Tests passing | 813 | 813+ | 813 (M-7C: 813) |
| Barrel exports | 193 | 193+ | 210 (M-7C: deprecated aliases added) |
| Pipeline completion rate | 96% | >99% | 100% (M-8C.V: 6/6) |
| Hallucination detection | manual | automated | ✅ Jidoka active |
| Pre-flight auth | absent | automated | ✅ Active |
| File context injection | absent | 32K cap | ✅ Active |

---

*Updated after M-7C close-out (2026-03-02).*
