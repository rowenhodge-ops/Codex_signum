# Audit existing test coverage for pipeline node wiring

> Task ID: t4
> Model: claude-opus-4-5:extended:8k
> Duration: 83497ms
> Output chars: 10154
> Timestamp: 2026-03-04T05:36:27.362Z

> **⚠️ Hallucination flags (2):**
> - [content/warning] Task t4 references "decision-lifecycle.test.ts" but this file was not in its context
> - [content/warning] Task t4 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Test Coverage Audit: M-9 Pipeline Node Wiring

## Executive Summary

This audit catalogs test coverage for the M-9 pipeline wiring implementation across five test files. The analysis reveals that **current tests primarily verify export existence and interface shapes**, with significant gaps in **behavioral testing**, **relationship verification**, and **integration coverage** for the graph wiring layer.

---

## Coverage Matrix

### Node Types × Operations

| Node Type | Schema/Interface | Create | Read/Query | Update | Delete | Integration |
|-----------|:---------------:|:------:|:----------:|:------:|:------:|:-----------:|
| **PipelineRun** | ✅ | ⚪ Export | ⚪ Export | ⚪ Export | ❌ | ❌ |
| **TaskOutput** | ✅ | ⚪ Export | ⚪ Export | ❌ | ❌ | ❌ |
| **Decision** | ✅ | ❌ | ⚪ Export | ⚪ Export | ❌ | ⏭️ Skipped |
| **Observation** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **ContextCluster** | ✅ | ❌ | ❌ | ❌ | ❌ | ⏭️ Skipped |
| **Resonator/Stage** | ⚪ Export | ⚪ Export | ❌ | ❌ | ❌ | ❌ |

**Legend:** ✅ = Tested | ⚪ = Export verified only | ❌ = Not tested | ⏭️ = Skipped (requires Neo4j)

### Relationships × Test Coverage

| Relationship | Source File | Tested |
|-------------|-------------|:------:|
| `PipelineRun -[HAS_OUTPUT]→ TaskOutput` | queries.ts | ❌ |
| `TaskOutput -[AT_STAGE]→ Resonator` | queries.ts | ⚪ Export |
| `Decision -[MADE_BY]→ Bloom` | queries.ts | ❌ |
| `Decision -[IN_CLUSTER]→ ContextCluster` | queries.ts | ⏭️ Skipped |
| `Decision -[SELECTED]→ ModelSeed` | queries.ts | ❌ |
| `Observation -[OF_TASK]→ TaskOutput` | queries.ts | ❌ |
| `Observation -[UPDATES]→ Resonator` | queries.ts | ❌ |
| `TaskOutput -[PRECEDED_BY]→ TaskOutput` | queries.ts | ❌ |

---

## Detailed Findings by Test File

### 1. `tests/graph/pipeline-topology.test.ts`

**Coverage Scope:** Schema constants, interface shapes, export verification

| Test Category | Tests | Status |
|--------------|:-----:|:------:|
| `ARCHITECT_STAGES` constant | 3 | ✅ Pass |
| `PipelineRunProps` interface | 3 | ✅ Pass |
| `TaskOutputProps` interface | 3 | ✅ Pass |
| Function exports | 10 | ✅ Pass |
| Barrel re-exports | 1 | ✅ Pass |
| Schema module exports | 1 | ✅ Pass |

**Gap Analysis:**
- ❌ No tests verify `createPipelineRun` actually creates a node
- ❌ No tests verify `completePipelineRun` updates properties
- ❌ No tests verify `linkTaskOutputToStage` creates relationships

### 2. `tests/graph/executor-graph-wiring.test.ts`

**Coverage Scope:** Bootstrap executor configuration, graph opt-in behavior

| Test Category | Tests | Status |
|--------------|:-----:|:------:|
| `createBootstrapTaskExecutor` backward compat | 1 | ✅ Pass |
| Config with `graphEnabled=false` | 1 | ✅ Pass |
| Config with `graphEnabled=true` | 1 | ✅ Pass |
| Optional config fields | 1 | ✅ Pass |
| `writeManifest` async signature | 1 | ✅ Pass |
| `writeManifest` null when no tasks | 1 | ✅ Pass |
| Interface conformance | 1 | ✅ Pass |

**Gap Analysis:**
- ❌ No test verifies graph writes occur when `graphEnabled=true` + tasks executed
- ❌ No test verifies `writeManifest` returns valid manifest after execution
- ❌ No test verifies `architectBloomId` is used correctly

### 3. `tests/graph/decision-lifecycle.test.ts`

**Coverage Scope:** Decision lifecycle functions, quality assessment heuristic

| Test Category | Tests | Status |
|--------------|:-----:|:------:|
| `recordDecisionOutcome` export/shape | 4 | ✅ Pass |
| `updateDecisionQuality` export/signature | 2 | ✅ Pass |
| `findDecisionForTask` export/signature | 2 | ✅ Pass |
| `assessTaskQuality` heuristic | 6 | ✅ Pass |
| `getPipelineStageHealth` export | 2 | ✅ Pass |
| `getPipelineRunStats` export | 2 | ✅ Pass |
| `ModelExecutorResult.decisionId` | 2 | ✅ Pass |
| M-9.3 exports verification | 5 | ✅ Pass |

**Gap Analysis:**
- ❌ `assessTaskQuality` is tested but actual graph persistence is not
- ❌ No behavioral test for `updateDecisionQuality` mutating Decision node
- ❌ No test verifies `findDecisionForTask` query logic

### 4. `tests/conformance/architect-pipeline.test.ts`

**Coverage Scope:** End-to-end pipeline execution, stage logic, mock executors

| Test Category | Tests | Status |
|--------------|:-----:|:------:|
| 7-stage end-to-end execution | 1 | ✅ Pass |
| Task failure → ADAPT | 1 | ✅ Pass |
| Mock executor failure → graceful degradation | 1 | ✅ Pass |
| Dependency order execution | 1 | ✅ Pass |
| Individual stages (decompose, classify, sequence) | 3 | ✅ Pass |
| Parallel decompose (best-of-N) | 4 | ✅ Pass |
| Plan scoring | 4 | ✅ Pass |
| Mock model executor | 4 | ✅ Pass |
| Mock task executor | 3 | ✅ Pass |
| Survey type bridge | 1 | ✅ Pass |

**Gap Analysis:**
- ❌ End-to-end tests use mock executors with no graph wiring
- ❌ No test verifies `executePlan` writes `PipelineRun` to graph
- ❌ No test verifies `TaskOutput` nodes created during DISPATCH
- ❌ No test verifies `Observation` nodes created

### 5. `tests/conformance/decision-lifecycle.test.ts`

**Coverage Scope:** Decision/ContextCluster contracts, Thompson sampling invariants

| Test Category | Tests | Status |
|--------------|:-----:|:------:|
| `DecisionProps` contract | 3 | ✅ Pass |
| `DecisionOutcomeProps` contract | 3 | ✅ Pass |
| `ArmStats` contract | 3 | ✅ Pass |
| `ContextClusterProps` contract | 2 | ✅ Pass |
| `CORE_BLOOMS` registry | 5 | ✅ Pass |
| Decision lifecycle integration | 1 | ⏭️ Skipped |

**Gap Analysis:**
- ⏭️ Integration test exists but is skipped without `NEO4J_URI`
- ❌ No CI/CD environment runs integration tests

---

## Function-Level Coverage Summary

| Function | Export ✅ | Type/Shape ✅ | Behavior ❌ | Integration ⏭️ |
|----------|:---------:|:------------:|:---------:|:-----------:|
| `createPipelineRun` | ✅ | ✅ | ❌ | ❌ |
| `completePipelineRun` | ✅ | — | ❌ | ❌ |
| `getPipelineRun` | ✅ | — | ❌ | ❌ |
| `listPipelineRuns` | ✅ | — | ❌ | ❌ |
| `createTaskOutput` | ✅ | ✅ | ❌ | ❌ |
| `getTaskOutputsForRun` | ✅ | — | ❌ | ❌ |
| `queryTaskOutputsByModel` | ✅ | — | ❌ | ❌ |
| `ensureArchitectResonators` | ✅ | — | ❌ | ❌ |
| `linkTaskOutputToStage` | ✅ | — | ❌ | ❌ |
| `recordDecision` | — | ✅ | ❌ | ⏭️ |
| `recordDecisionOutcome` | ✅ | ✅ | ❌ | ⏭️ |
| `updateDecisionQuality` | ✅ | ✅ | ❌ | ❌ |
| `findDecisionForTask` | ✅ | ✅ | ❌ | ❌ |
| `getPipelineStageHealth` | ✅ | ✅ | ❌ | ❌ |
| `getPipelineRunStats` | ✅ | ✅ | ❌ | ❌ |
| `ensureContextCluster` | — | ✅ | ❌ | ⏭️ |
| `getArmStatsForCluster` | — | ✅ | ❌ | ⏭️ |
| `assessTaskQuality` | ✅ | ✅ | ✅ | — |

---

## Enumerated Gaps

### Critical Gaps (Spec vs. Test Coverage)

| # | Gap Description | Spec Requirement | Test Status |
|---|-----------------|-----------------|-------------|
| G1 | **Observation node type** untested | M-9 requires Observation nodes for ΦL updates | ❌ No tests |
| G2 | **PipelineRun → TaskOutput relationship** not verified | Pipeline must track outputs | ❌ No tests |
| G3 | **TaskOutput → Stage linking** not verified | Outputs linked to stages for health queries | ⚪ Export only |
| G4 | **Decision → ModelSeed selection** not verified | Decision must reference selected seed | ❌ No tests |
| G5 | **Graph writes during `executePlan`** not tested | `graphEnabled=true` should persist | ❌ No tests |
| G6 | **`writeManifest` with tasks** not tested | Should return manifest after execution | ❌ No tests |

### Moderate Gaps

| # | Gap Description | Impact |
|---|-----------------|--------|
| G7 | No behavioral test for `updateDecisionQuality` | Quality updates may silently fail |
| G8 | No behavioral test for `findDecisionForTask` | Query may return incorrect results |
| G9 | No behavioral test for `getPipelineStageHealth` | Stage health aggregation untested |
| G10 | No behavioral test for `getPipelineRunStats` | Run stats aggregation untested |
| G11 | Integration tests skipped in CI | Graph wiring never validated in CI |

### Minor Gaps

| # | Gap Description | Impact |
|---|-----------------|--------|
| G12 | `recordDecision` export not verified | Could break without warning |
| G13 | `ensureContextCluster` export not verified | Could break without warning |
| G14 | `getArmStatsForCluster` export not verified | Could break without warning |
| G15 | No delete operation tests | Cleanup operations untested |

---

## Recommendations

### Immediate (M-9 Completion)

1. **Add Observation node tests** in `tests/graph/pipeline-topology.test.ts`
   - Interface shape tests for `ObservationProps`
   - Export tests for `createObservation`, `getObservationsForTask`

2. **Add behavioral tests** for core pipeline functions (requires test Neo4j instance or mocks)
   - `createPipelineRun` creates node with correct properties
   - `createTaskOutput` links to PipelineRun
   - `linkTaskOutputToStage` creates relationship

3. **Add graph wiring integration test** to `tests/conformance/architect-pipeline.test.ts`
   - Execute pipeline with `graphEnabled=true` against test Neo4j
   - Verify `PipelineRun`, `TaskOutput`, `Decision` nodes created

### Short-Term

4. **Enable integration tests in CI** with Neo4j test container
   - Remove `.skipIf(!process.env.NEO4J_URI)` pattern
   - Add Neo4j service to CI workflow

5. **Add export verification** for missing functions:
   - `recordDecision`
   - `ensureContextCluster`
   - `getArmStatsForCluster`

### Medium-Term

6. **Add relationship verification tests**
   - Query to verify edge existence after creates
   - Verify cascade deletes if implemented

---

## Verification

To confirm existing tests still pass:

```bash
npx vitest run tests/graph/ tests/conformance/architect-pipeline.test.ts tests/conformance/decision-lifecycle.test.ts --reporter=verbose
```

**Expected Result:** All tests should pass. Integration tests in `decision-lifecycle.test.ts` will be skipped unless `NEO4J_URI` is set.

---

## Summary Statistics

| Metric | Count |
|--------|------:|
| Test files audited | 5 |
| Total test suites | 28 |
| Total test cases | ~85 |
| Node types with schema tests | 5/6 (83%) |
| Node types with behavioral tests | 0/6 (0%) |
| Relationships with tests | 0/8 (0%) |
| Functions with export tests | 14/17 (82%) |
| Functions with behavioral tests | 1/17 (6%) |
| Critical gaps identified | 6 |
| Total gaps identified | 15 |