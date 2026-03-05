# M-9.5 Test Reconciliation — Completion Report

**Date:** 2026-03-05
**Branch:** main
**Commits:** b273f5e, 4105752, 9dc3000

---

## Task Summary

| Task | Description | Status |
|------|-------------|--------|
| 0 | Clean stale Neo4j nodes | Done |
| 1 | Reconcile in-scope test failures | Done (none found) |
| 2 | Convert 18 .todo() tests to @future(M-N) | Done |
| 3 | Build @future test runner + gate exclusion | Done |
| 4 | Absorb 12 deferred M-9.VA items | Done |
| 5 | Final gate + completion report | Done |

---

## Task 0: Graph Cleanup

Deleted stale nodes from Neo4j:
- 1 Seed node (`claude-opus-4-1`) — orphaned from model rename
- 7 Resonator nodes (`bloom_architect_*`) — orphaned from bloom ID changes

Script: `scripts/cleanup-stale-nodes.ts`

## Task 1: In-Scope Test Failures

Baseline: **1182 tests passing, 0 failures.** No regressions from M-9.1–9.4.

## Task 2: .todo() → @future Conversion

Converted 18 `.todo()` placeholders across 3 test files to real `@future(M-N)` assertions:

| File | Tests | Milestone | Pass/Fail |
|------|-------|-----------|-----------|
| `tests/conformance/dev-agent.test.ts` | 7 | M-10 | 6 pass, 1 fail |
| `tests/conformance/hierarchical-health.test.ts` | 6 | M-9.V | 2 pass, 4 fail |
| `tests/conformance/immune-response.test.ts` | 5 | M-18 | 1 pass, 4 fail |

**9 @future tests failing** — correctly identifying vertical compute gaps:
- `phiL_factors` decomposition not exposed on AggregateHealth
- `dampening_applied` / `gamma_effective` tracking not wired
- `cascade_depth` tracking absent
- `signal_conditioned` flag absent
- `assembleTriggerState()` function missing (immune response)
- `persistedObservationId` absent on review results
- `recommendations` array absent on review results
- `thresholdEventId` absent on trigger state

**9 @future tests passing** — contracts the implementation already satisfies.

## Task 3: @future Test Runner

- `vitest.config.ts`: Added `testNamePattern: "^(?!.*@future)"` to exclude @future from main gate
- `vitest.config.future.ts`: Created with `testNamePattern: "@future"` and `passWithNoTests: true`
- `package.json`: Added `test:future` script with `|| true` for informational exit code

## Task 4: Absorb M-9.VA Items

### 9 New Query Functions (src/graph/queries.ts)

| Function | Purpose |
|----------|---------|
| `failPipelineRun` | Mark a PipelineRun as failed with error message |
| `updateTaskOutputQuality` | Update qualityScore on TaskOutput node |
| `getTaskOutput` | Get single TaskOutput by ID |
| `linkDecisionToPipelineRun` | Link Decision → PipelineRun via DECIDED_DURING |
| `getDecisionsForRun` | Get all Decisions linked to a PipelineRun |
| `getCompactionHistory` | Compaction audit trail (active distillations for a bloom) |
| `getModelPerformance` | Aggregate model-level performance stats |
| `getStagePerformance` | Stage-level (Resonator) performance stats |
| `getRunComparison` | Compare two PipelineRuns side-by-side |

### 3 NOT NULL Constraints (src/graph/schema.ts)

| Constraint | Target |
|------------|--------|
| `pipeline_run_started_at_required` | PipelineRun.startedAt |
| `task_output_run_id_required` | TaskOutput.runId |
| `observation_timestamp_required` | Observation.timestamp |

### RELATIONSHIP_TYPES Registry (src/graph/schema.ts)

Canonical registry of all 10 relationship types used in the graph:
CONTAINS, ROUTED_TO, ORIGINATED_FROM, IN_CONTEXT, DECIDED_DURING,
OBSERVED_IN, DISTILLED_FROM, EXECUTED_IN, PRODUCED, PROCESSED.

Exported as `const` with `RelationshipType` type alias.

### signalProcessed Dead Read (src/memory/compaction.ts)

Documented with JSDoc on `CompactableObservation` interface. The field is read in
`identifyCompactable()` (line 135) and `computeCompactionStats()` (line 217) but never
set to `true`. This is the correct safe default — signal conditioning (M-9.V vertical
compute) will set it when wired.

### 2 Previously Existing Functions

`getObservationsForBloom` and `getDistillationsForBloom` were listed in the deferred
items but already exist in queries.ts and are exported from the barrel.

### Barrel Export Updates

- `src/graph/index.ts`: Added all 9 new query functions + `RELATIONSHIP_TYPES` + `RelationshipType`
- `src/index.ts`: Already re-exports all graph exports via `export * from "./graph/index.js"`

### verifySchema Update

Expected constraint count: 15 → 18 (3 new NOT NULL constraints).

---

## Final Gate Metrics

| Metric | Value | Delta from Baseline |
|--------|-------|---------------------|
| Tests passing | 1196 | +14 |
| Tests skipped (@future) | 19 | +19 (new gate) |
| @future failing | 9 | n/a (new metric) |
| @future passing | 9 | n/a (new metric) |
| Barrel exports | 254 | +40 |
| TypeScript | Clean | — |
| Test files | 76 | — |

### Gate Commands

```
npx tsc --noEmit          → Clean
npm test                  → 1196 passed, 0 failed, 19 skipped
npm run test:future       → 9 failed, 9 passed, 1197 skipped (exit 0)
node -e "..."             → 254 exports
```

---

## Remaining Work

The 9 failing @future tests define the contract surface for:
- **M-9.V**: Vertical compute wiring (ΦL composite, dampening, signal conditioning)
- **M-10**: DevAgent full pipeline integration (correction helix, constitutional, memory)
- **M-18**: Immune response orchestration (assembleTriggerState, recommendations, thresholdEventId)
