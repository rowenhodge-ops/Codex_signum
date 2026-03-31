> **Projection document.** This is a human-readable projection of constitutional
> structures in the Codex Signum graph. The graph is the source of truth.
> See: `def:grammar:g7-molecule-principle`

# G7: Molecule Principle (Proposed)

## Statement

A composition that accumulates structural self-knowledge requires a Bloom boundary.

## Definition of Self-Knowledge

Self-knowledge is accumulated operational state that persists and evolves across executions:

- **Thompson posteriors:** `weightedSuccesses`, `weightedFailures`
- **Dimensional affinities:** `phiL_code`, `phiL_analysis`, `phiL_creative`, `phiL_structured_output`, `phiL_classification`, `phiL_synthesis`
- **Failure signatures:** Learning Grid entries (Seeds in Grid container)
- **Drift detection state:** `bocpdState` (BOCPD run-length distribution)

The following are NOT self-knowledge:
- **Identity properties:** `id`, `name`, `status` — these are definitional, not accumulated
- **Derived properties:** ΦL, ΨH, εR — these are computed from structure, not accumulated across executions

## Independence from G3

G7 is independent of G3 (Containment). A composition can satisfy G3 while violating G7:

- G3 satisfied: A Bloom contains Resonator arms → scope is defined
- G7 violated: Bare Resonators accumulate posteriors without a Bloom boundary

The distinction: G3 governs scope declaration. G7 governs where accumulated state lives.

## Evidence

The M-10.3 reclassification created 27 LLM Blooms to resolve G7 violations. Before M-10.3, Agent:Resonator arms accumulated Thompson posteriors as bare nodes — operational state without a Bloom boundary. The reclassification:

1. Grouped arms by `baseModelId`
2. Created LLM Blooms (`llm:claude-opus-4-6`, etc.)
3. Moved accumulated state to Bloom properties
4. Wired CONTAINS edges: Bloom → arms

## Status

**Proposed.** Awaiting formal amendment cycle. Currently enforced by convention (M-10.3 established the pattern) but not yet constitutionally ratified.
