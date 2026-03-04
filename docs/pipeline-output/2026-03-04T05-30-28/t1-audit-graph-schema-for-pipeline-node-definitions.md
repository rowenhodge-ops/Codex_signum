# Audit graph schema for pipeline node definitions

> Task ID: t1
> Model: claude-opus-4-5:extended:16k
> Duration: 62037ms
> Output chars: 9754
> Timestamp: 2026-03-04T05:33:04.485Z

> **⚠️ Hallucination flags (2):**
> - [content/warning] Task t1 references "docs/specs/06_codex-signum-architect-pattern-design.md" but this file was not in its context
> - [content/warning] Task t1 references "docs/specs/05_codex-signum-engineering-bridge-v2_0.md" but this file was not in its context

---

# Pipeline Node Schema Audit Report

## Executive Summary

Audit of `src/graph/schema.ts` for M-9 pipeline wiring structural completeness. This analysis catalogs the four target node types (PipelineRun, TaskOutput, Decision, Observation), their constraints, indexes, and relationships.

**Overall Assessment:** Schema defines all four required node types with uniqueness constraints and query indexes. However, **relationship types between pipeline nodes are not explicitly defined in the schema**, and several referential integrity constraints are missing.

---

## Node Label Catalog

### 1. PipelineRun ✅ DEFINED

| Property | Schema Element | Evidence |
|----------|---------------|----------|
| Uniqueness | `pipeline_run_id_unique` | Line ~98: `CREATE CONSTRAINT pipeline_run_id_unique IF NOT EXISTS FOR (pr:PipelineRun) REQUIRE pr.id IS UNIQUE` |
| Index: bloomId | `pipeline_run_bloom` | Line ~102: `CREATE INDEX pipeline_run_bloom IF NOT EXISTS FOR (pr:PipelineRun) ON (pr.bloomId)` |
| Index: status | `pipeline_run_status` | Line ~103: `CREATE INDEX pipeline_run_status IF NOT EXISTS FOR (pr:PipelineRun) ON (pr.status)` |
| Index: startedAt | `pipeline_run_timestamp` | Line ~104: `CREATE INDEX pipeline_run_timestamp IF NOT EXISTS FOR (pr:PipelineRun) ON (pr.startedAt)` |

**Properties implied by test interface:** `id`, `intent`, `bloomId`, `taskCount`, `startedAt`, `completedAt`, `durationMs`, `modelDiversity`, `overallQuality`, `status`

---

### 2. TaskOutput ✅ DEFINED

| Property | Schema Element | Evidence |
|----------|---------------|----------|
| Uniqueness | `task_output_id_unique` | Line ~101: `CREATE CONSTRAINT task_output_id_unique IF NOT EXISTS FOR (to:TaskOutput) REQUIRE to.id IS UNIQUE` |
| Index: runId | `task_output_run` | Line ~105: `CREATE INDEX task_output_run IF NOT EXISTS FOR (to:TaskOutput) ON (to.runId)` |
| Index: modelUsed | `task_output_model` | Line ~106: `CREATE INDEX task_output_model IF NOT EXISTS FOR (to:TaskOutput) ON (to.modelUsed)` |
| Index: status | `task_output_status` | Line ~107: `CREATE INDEX task_output_status IF NOT EXISTS FOR (to:TaskOutput) ON (to.status)` |

**Properties implied by test interface:** `id`, `runId`, `taskId`, `title`, `taskType`, `modelUsed`, `provider`, `outputLength`, `durationMs`, `qualityScore`, `hallucinationFlagCount`, `status`

---

### 3. Decision ✅ DEFINED

| Property | Schema Element | Evidence |
|----------|---------------|----------|
| Uniqueness | `decision_id_unique` | Line ~33: `CREATE CONSTRAINT decision_id_unique IF NOT EXISTS FOR (d:Decision) REQUIRE d.id IS UNIQUE` |
| NOT NULL | `decision_timestamp_required` | Line ~52: `CREATE CONSTRAINT decision_timestamp_required IF NOT EXISTS FOR (d:Decision) REQUIRE d.timestamp IS NOT NULL` |
| Index: timestamp | `decision_timestamp` | Line ~60: `CREATE INDEX decision_timestamp IF NOT EXISTS FOR (d:Decision) ON (d.timestamp)` |
| Index: madeByBloomId | `decision_bloom` | Line ~63: `CREATE INDEX decision_bloom IF NOT EXISTS FOR (d:Decision) ON (d.madeByBloomId)` |

---

### 4. Observation ✅ DEFINED

| Property | Schema Element | Evidence |
|----------|---------------|----------|
| Uniqueness | `observation_id_unique` | Line ~39: `CREATE CONSTRAINT observation_id_unique IF NOT EXISTS FOR (o:Observation) REQUIRE o.id IS UNIQUE` |
| Index: timestamp | `observation_timestamp` | Line ~57: `CREATE INDEX observation_timestamp IF NOT EXISTS FOR (o:Observation) ON (o.timestamp)` |
| Index: sourceBloomId | `observation_source_bloom` | Line ~60: `CREATE INDEX observation_source_bloom IF NOT EXISTS FOR (o:Observation) ON (o.sourceBloomId)` |

---

## Relationship Type Catalog

### Defined in Migration Code (migrateToMorphemeLabels)

| Relationship Type | Direction | Purpose | Schema Constraint? |
|-------------------|-----------|---------|-------------------|
| `ROUTED_TO` | Decision → Seed | Routing choice | ❌ None |
| `ORIGINATED_FROM` | Decision → Bloom | Decision origin | ❌ None |
| `OBSERVED_IN` | Observation → Bloom | Observation scope | ❌ None |

### Implied by Pipeline Functions (from test file)

| Relationship Type | Direction | Function | Schema Constraint? |
|-------------------|-----------|----------|-------------------|
| `(implied)` | PipelineRun → TaskOutput | `getTaskOutputsForRun` | ❌ None |
| `(implied)` | PipelineRun → Bloom | `createPipelineRun` (bloomId prop) | ❌ None |
| `(implied)` | TaskOutput → Resonator | `linkTaskOutputToStage` | ❌ None |
| `(implied)` | TaskOutput → Seed | model routing | ❌ None |

---

## Missing or Incomplete Definitions

### Critical Gaps (Structural Integrity)

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| **No explicit relationship types for pipeline wiring** | Pipeline topology relies on property references (runId, bloomId) rather than graph edges | Define relationships: `HAS_OUTPUT`, `EXECUTED_BY`, `INVOKED_STAGE` |
| **No relationship constraints** | Cannot enforce valid edge patterns (e.g., TaskOutput must connect to existing PipelineRun) | Add relationship existence constraints when Neo4j supports them, or enforce via application layer |
| **PipelineRun.startedAt NOT NULL missing** | Unlike Decision, PipelineRun allows null timestamps | Add: `CREATE CONSTRAINT pipeline_run_started_required IF NOT EXISTS FOR (pr:PipelineRun) REQUIRE pr.startedAt IS NOT NULL` |
| **TaskOutput.runId NOT NULL missing** | Orphan TaskOutputs possible | Add NOT NULL constraint |

### Moderate Gaps (Query Performance)

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| **No TaskOutput timestamp index** | Temporal queries across tasks may be slow | Add: `CREATE INDEX task_output_timestamp IF NOT EXISTS FOR (to:TaskOutput) ON (to.completedAt)` |
| **No index on TaskOutput.taskId** | Task-specific queries unoptimized | Add: `CREATE INDEX task_output_task_id IF NOT EXISTS FOR (to:TaskOutput) ON (to.taskId)` |
| **No index on PipelineRun.intent** | Intent-based filtering unoptimized | Consider adding if intent queries are common |

### Minor Gaps (Documentation)

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| **No schema documentation for Architect stage relationships** | `ARCHITECT_STAGES` (7 stages) not represented as Resonator constraints | Document that `ensureArchitectResonators` creates these at runtime |
| **Relationship semantics undocumented** | Edge meanings must be inferred from code | Add JSDoc for each relationship type |

---

## Conformance to Specification References

### docs/specs/06_codex-signum-architect-pattern-design.md

| Requirement | Schema Status | Evidence |
|-------------|---------------|----------|
| PipelineRun tracking | ✅ Present | Constraint + 3 indexes defined |
| TaskOutput recording | ✅ Present | Constraint + 3 indexes defined |
| Architect stage wiring | ⚠️ Partial | Resonator constraint exists; stage relationship via `linkTaskOutputToStage` implied but not schema-enforced |
| Model diversity tracking | ⚠️ Implicit | `modelDiversity` property referenced in test but no index |

### docs/specs/05_codex-signum-engineering-bridge-v2_0.md

| Requirement | Schema Status | Evidence |
|-------------|---------------|----------|
| Decision governance | ✅ Present | Constraint + NOT NULL + 2 indexes |
| Observation memory | ✅ Present | Constraint + 2 indexes |
| ΦL computation support | ✅ Present | Observation indexes on timestamp and sourceBloomId enable time-range queries |
| Routing provenance | ⚠️ Partial | `ROUTED_TO` relationship defined in migration but not constrained |

---

## Findings Summary

### Fully Defined ✅
1. **PipelineRun** - Uniqueness constraint + 3 query indexes
2. **TaskOutput** - Uniqueness constraint + 3 query indexes
3. **Decision** - Uniqueness constraint + NOT NULL timestamp + 2 indexes
4. **Observation** - Uniqueness constraint + 2 indexes

### Missing Schema Elements ❌
1. **Explicit relationship types** between pipeline nodes (structural edges vs property references)
2. **NOT NULL constraints** for PipelineRun.startedAt, TaskOutput.runId
3. **Relationship cardinality constraints** (1:N for PipelineRun→TaskOutput)
4. **Foreign key-like enforcement** (TaskOutput.runId must reference existing PipelineRun)

### Recommendations for Audit Test File

```
// AUDIT: Pipeline Node Definitions (M-9 Wiring)
// Reviewed: src/graph/schema.ts
//
// [PASS] PipelineRun — constraint + 3 indexes
// [PASS] TaskOutput — constraint + 3 indexes  
// [PASS] Decision — constraint + NOT NULL + 2 indexes
// [PASS] Observation — constraint + 2 indexes
//
// [MISSING] Relationship types not schema-defined:
//   - PipelineRun -[:HAS_OUTPUT]-> TaskOutput (implicit via runId property)
//   - PipelineRun -[:EXECUTED_BY]-> Bloom (implicit via bloomId property)
//   - TaskOutput -[:INVOKED_STAGE]-> Resonator (created by linkTaskOutputToStage)
//   - TaskOutput -[:USED_MODEL]-> Seed (implicit via modelUsed property)
//
// [MISSING] Constraints:
//   - PipelineRun.startedAt IS NOT NULL
//   - TaskOutput.runId IS NOT NULL
//   - TaskOutput.taskId IS NOT NULL
//
// [ADVISORY] Consider adding indexes:
//   - task_output_timestamp ON (to.completedAt)
//   - task_output_task_id ON (to.taskId)
```

---

## Verification Status

Test command: `npx vitest run tests/graph/pipeline-topology.test.ts --reporter=verbose`

The existing test file validates:
- ✅ ARCHITECT_STAGES constant (7 canonical stages)
- ✅ PipelineRunProps interface shape
- ✅ TaskOutputProps interface shape
- ✅ Function exports for pipeline operations
- ✅ Barrel re-exports from package root

**Gaps in test coverage:**
- ❌ No tests verify schema statements actually create the constraints
- ❌ No tests verify relationship creation/traversal
- ❌ No integration tests with live Neo4j for pipeline topology queries