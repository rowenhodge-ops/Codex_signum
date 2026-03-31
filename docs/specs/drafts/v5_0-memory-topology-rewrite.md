> **Projection document.** This is a human-readable projection of constitutional
> structures in the Codex Signum graph. The graph is the source of truth.
> See: `def:governance:property-evolution`, LLM Bloom nodes (`llm:*`), Config Seeds (`config:schema-gate:learning`, `config:lambda:*`)

# v5.0 Memory Topology Rewrite

## What Changed

The M-10 milestone replaced the Grid-based memory system (compaction + distillation + upward flow) with structural memory that lives directly on LLM Bloom properties.

### Before (M-9.4)

- Observations written as Seed nodes to Grid containers
- Compaction periodically DETACH DELETEd old Observations (destroyed provenance — A4 violation)
- Distillation computed PerformanceProfiles from Observation windows
- `processMemoryAfterExecution()` orchestrated the pipeline per-task

### After (M-10)

- Each LLM model family gets a Bloom node (`llm:claude-opus-4-6`, etc.)
- Thompson posteriors (`weightedSuccesses`, `weightedFailures`) live as Bloom properties
- Temporal decay: `gamma = e^(-lambda * elapsed)` applied on each update
- BOCPD drift detection: `bocpdState` stored as JSON property, checked each execution
- Dimensional affinity profiles: `phiL_code`, `phiL_analysis`, etc. on Bloom
- Learning Grid (Helix + Grid + ring buffer) for qualitative failure context
- Schema gate Config Seed governs what enters Learning Grids

### Key Design Decisions

1. **No deletion of provenance data.** The old `runCompaction()` → `deleteObservations()` path violated A4 (Provenance). The new system decays influence via gamma-recursive weighting — old data doesn't need deletion because its weight approaches zero naturally.

2. **Posteriors on Blooms, not Resonators.** G7 (Molecule Principle): accumulated self-knowledge requires a Bloom boundary. Agent:Resonator arms are contained by their LLM Bloom parent.

3. **Single constitutional schema gate.** 27 identical per-LLM Config Seeds consolidated to one constitutional-scope `config:schema-gate:learning`. FLOWS_TO wires it to each Learning Helix.

## Structural Topology

```
constitutional-bloom
  ├── def:governance:property-evolution
  ├── def:grammar:g7-molecule-principle
  ├── config:schema-gate:learning ──FLOWS_TO──> [Learning Helixes]
  └── ... (other definitions)

llm:claude-opus-4-6
  ├── Properties: weightedSuccesses, weightedFailures, bocpdState,
  │               phiL_code, phiL_analysis, phiL_creative, ...
  ├── Agent:Resonator arms (claude-opus-4-6:adaptive:max, etc.)
  ├── Helix (learning-helix:claude-opus-4-6)
  │     └── Grid (learning-grid:claude-opus-4-6)
  │           └── Seed entries (failure-signature, calibration-event, ...)
  └── Config Seeds (config:lambda:claude-opus-4-6, config:dimensional-phi-profiles:...)
```

## Functions

| Function | Location | Purpose |
|---|---|---|
| `updateStructuralMemoryAfterExecution()` | `src/graph/queries/memory-context.ts` | Post-execution: resolve LLM Bloom, gamma-recursive update, BOCPD |
| `getMemoryContextForBloom()` | `src/graph/queries/memory-context.ts` | Read full memory state for Thompson/SURVEY |
| `computePartialReset()` | `src/graph/queries/memory-context.ts` | Drift response: 30% retention reset |
| `formatMemoryContextForSurvey()` | `src/graph/queries/memory-context.ts` | Text formatting for SURVEY injection |
| `computeTemporalDecay()` | `src/graph/queries/arm-stats.ts` | gamma = e^(-lambda * elapsed) |
