# Audit graph queries for morpheme-native naming

> Task ID: t6
> Model: claude-opus-4-6:adaptive:medium
> Duration: 131527ms
> Output chars: 11429
> Timestamp: 2026-03-01T22:59:51.615Z

> **⚠️ Hallucination flags (3):**
> - [content/warning] References eliminated entity ":Agent"
> - [content/warning] References eliminated entity ":Pattern"
> - [content/warning] References eliminated entity "createAgent"

---

# Audit Report: Graph Queries Morpheme-Native Naming (t6)

## Executive Summary

The M-7C refactor has been **fully and correctly applied** to `src/graph/queries.ts`. All Cypher queries use post-refactor node labels (`Seed`, `Bloom`), all relationship types match the canonical spec mapping (`ROUTED_TO`, `ORIGINATED_FROM`, `OBSERVED_IN`), and all property/parameter names align with the new types. No hardcoded old terminology exists in any query string. This file is the cleanest of those audited so far.

---

## Audit Methodology

1. Extracted every Cypher string literal and scanned for node labels, relationship types, and property names
2. Cross-referenced against t1 canonical morpheme mapping for label/relationship/property correctness
3. Cross-referenced against t5 schema audit for consistency between schema definitions and runtime queries
4. Cross-referenced against t2 morphemes.ts audit and t11 thompson-router audit for type alignment
5. Verified interface definitions (`SeedProps`, `BloomProps`, `DecisionProps`, etc.) use post-refactor field names
6. Scanned all comments and JSDoc for residual old terminology

---

## Acceptance Criteria Results

| Criterion | Status | Evidence |
|-----------|--------|----------|
| All Cypher queries use `Seed` label | ✅ **PASS** | 7 distinct query functions reference `:Seed`; zero reference `:Agent` |
| All Cypher queries use `Bloom` label | ✅ **PASS** | 12 distinct query functions reference `:Bloom`; zero reference `:Pattern` |
| Relationship names in queries match spec | ✅ **PASS** | `ROUTED_TO`, `ORIGINATED_FROM`, `OBSERVED_IN`, `IN_CONTEXT`, `DISTILLED_FROM`, `CONTAINS` — all canonical |
| No hardcoded old terminology in query strings | ✅ **PASS** | Exhaustive scan confirms zero pre-refactor terms |

---

## Detailed Verification

### Node Label Scan

**`:Seed` label — 7 functions, all correct:**

| Function | Cypher Fragment | Status |
|----------|----------------|--------|
| `createSeed` | `MERGE (s:Seed { id: $id })` | ✅ |
| `getSeed` | `MATCH (s:Seed { id: $id })` | ✅ |
| `listActiveSeeds` | `MATCH (s:Seed) WHERE s.status = 'active'` | ✅ |
| `listActiveSeedsByCapability` | `MATCH (s:Seed) WHERE ...` | ✅ |
| `recordDecision` | `MATCH (s:Seed { id: $selectedSeedId })` | ✅ |
| `getDecisionsForCluster` | `MATCH (d)-[:ROUTED_TO]->(s:Seed)` | ✅ |
| `getArmStatsForCluster` | `MATCH (d)-[:ROUTED_TO]->(s:Seed)` | ✅ |

**`:Bloom` label — 12 functions, all correct:**

| Function | Cypher Fragment | Status |
|----------|----------------|--------|
| `createBloom` | `MERGE (b:Bloom { id: $id })` | ✅ |
| `getBloom` | `MATCH (b:Bloom { id: $id })` | ✅ |
| `updateBloomState` | `MATCH (b:Bloom { id: $id })` | ✅ |
| `connectBlooms` | `MATCH (a:Bloom { id: $fromId }), (b:Bloom { id: $toId })` | ✅ |
| `recordDecision` | `OPTIONAL MATCH (b:Bloom { id: $madeByBloomId })` | ✅ |
| `recordObservation` | `MATCH (b:Bloom { id: $sourceBloomId })` | ✅ |
| `getObservationsForBloom` | `(o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })` | ✅ |
| `countObservationsForBloom` | `(o:Observation)-[:OBSERVED_IN]->(b:Bloom { id: $bloomId })` | ✅ |
| `getBloomDegree` | `MATCH (b:Bloom { id: $bloomId })` | ✅ |
| `getBloomAdjacency` | `MATCH (a:Bloom)-[r]->(b:Bloom)` | ✅ |
| `getBloomsWithHealth` | `MATCH (b:Bloom)` | ✅ |
| `updateBloomPhiL` | `MATCH (b:Bloom { id: $bloomId })` | ✅ |

**Negative scan (old labels):**

| Search Term | Occurrences | Status |
|-------------|-------------|--------|
| `:Agent` | 0 | ✅ Clean |
| `:Pattern` | 0 | ✅ Clean |

---

### Relationship Type Scan

| Relationship | Spec Source | Occurrences | Functions | Status |
|--------------|------------|-------------|-----------|--------|
| `ROUTED_TO` | SELECTED→ROUTED_TO | 3 | `recordDecision`, `getDecisionsForCluster`, `getArmStatsForCluster` | ✅ |
| `ORIGINATED_FROM` | MADE_BY→ORIGINATED_FROM | 1 | `recordDecision` | ✅ |
| `OBSERVED_IN` | OBSERVED_BY→OBSERVED_IN | 3 | `recordObservation`, `getObservationsForBloom`, `countObservationsForBloom` | ✅ |
| `IN_CONTEXT` | Unchanged | 3 | `recordDecision`, `getDecisionsForCluster`, `getArmStatsForCluster` | ✅ |
| `DISTILLED_FROM` | Unchanged | 1 | `createDistillation` | ✅ |
| `CONTAINS` | Unchanged (G3 grammar rule) | 7+ | Containment hierarchy functions | ✅ |

**Negative scan (old relationships):**

| Search Term | Occurrences | Status |
|-------------|-------------|--------|
| `SELECTED` (as rel type) | 0 | ✅ Clean |
| `MADE_BY` | 0 | ✅ Clean |
| `OBSERVED_BY` | 0 | ✅ Clean |

---

### Property and Parameter Name Scan

**Decision-related properties (per t1 canonical mapping):**

| Property | Expected (Post-Refactor) | Actual in queries.ts | Status |
|----------|--------------------------|---------------------|--------|
| Selected seed reference | `selectedSeedId` | `selectedSeedId` (DecisionProps + Cypher) | ✅ |
| Originating bloom reference | `madeByBloomId` | `madeByBloomId` (DecisionProps + Cypher) | ✅ |

**Observation-related properties:**

| Property | Expected (Post-Refactor) | Actual in queries.ts | Status |
|----------|--------------------------|---------------------|--------|
| Source bloom reference | `sourceBloomId` | `sourceBloomId` (ObservationProps + Cypher) | ✅ |

**ArmStats alignment with graph layer (cross-ref t11):**

| Field | queries.ts ArmStats | Cypher RETURN alias | Status |
|-------|---------------------|---------------------|--------|
| `seedId` | `seedId: string` | `s.id AS seedId` | ✅ |

This confirms the graph layer consistently uses `seedId`, matching t11's finding that the graph data layer is correct while the thompson-router type layer lags.

**Negative scan (old property names):**

| Search Term | Occurrences | Status |
|-------------|-------------|--------|
| `selectedAgentId` | 0 | ✅ Clean |
| `madeByPatternId` | 0 | ✅ Clean |
| `sourcePatternId` | 0 | ✅ Clean |
| `selectedModelId` | 0 | ✅ Clean |
| `callerPatternId` | 0 | ✅ Clean |

---

### Interface Naming Audit

| Interface | Terminology | Status |
|-----------|-------------|--------|
| `SeedProps` | Post-refactor (Seed) | ✅ |
| `BloomProps` | Post-refactor (Bloom) | ✅ |
| `DecisionProps` | Contains `selectedSeedId`, `madeByBloomId` | ✅ |
| `DecisionOutcomeProps` | Operational, no morpheme refs | ✅ |
| `ObservationProps` | Contains `sourceBloomId` | ✅ |
| `DistillationProps` | Operational, no morpheme refs | ✅ |
| `ContextClusterProps` | Operational, no morpheme refs | ✅ |
| `ArmStats` | Contains `seedId` | ✅ |
| `HumanFeedbackProps` | Operational, no morpheme refs | ✅ |
| `CalibrationMetrics` | Operational, no morpheme refs | ✅ |

---

### Comment and Documentation Scan

| Location | Content | Status |
|----------|---------|--------|
| Module header | "M-7C: Uses morpheme-native names (Seed, Bloom, ROUTED_TO, etc.)" | ✅ Correct |
| `SeedProps` JSDoc | "compute substrate — LLM model instance" | ✅ "model" used descriptively, not as morpheme name |
| `BloomProps` JSDoc | "scoped composition of morphemes" | ✅ Matches spec |
| `DistillationProps.pattern` field | Refers to "distilled pattern" (an insight), not the Pattern morpheme | ✅ Domain-appropriate |
| Topology section comments | Reference "ΦL", "ΨH", "topology-aware dampening" | ✅ Spec-aligned |

---

## Observations (Non-Blocking)

### Observation 1 — `SeedProps.baseModelId`: Acceptable Domain Term

**Severity: Informational (no action required)**

`SeedProps` includes `baseModelId: string`. This refers to the underlying AI model identifier (e.g., `"claude-sonnet-4-20250514"`), not the Codex Agent/Seed morpheme. Per the spec: "Models are infrastructure, not participants." The field correctly identifies which model a Seed node wraps. The term "model" here is a domain noun, not a morpheme name. Consistent with t11's analysis.

### Observation 2 — `connectBlooms` Dynamic Relationship Type

**Severity: Low (design observation)**

```typescript
MERGE (a)-[r:${relType}]->(b)
```

The `relType` parameter is interpolated directly into Cypher without validation against a canonical relationship type list. While this provides flexibility, it means callers could introduce non-spec relationship types. This is a trust boundary concern, not a morpheme naming issue.

**Suggestion:** Consider adding a runtime check or type constraint (e.g., a union type of valid relationship names) to prevent drift in relationship naming as the codebase evolves.

### Observation 3 — Containment Queries Use Unlabeled Node Patterns

**Severity: Informational (intentional design)**

Functions `getContainedChildren`, `getContainmentTree`, `getSubgraphEdges`, and `getContainersBottomUp` use unlabeled node patterns:

```cypher
MATCH (parent { id: $containerId })-[:CONTAINS]->(child)
```

This is intentionally generic — CONTAINS relationships can exist between Blooms, Grids, or other container types per G3 (Containment Creates Scope). The absence of a label constraint is correct for this use case.

### Observation 4 — No Backward-Compatibility Function Aliases

**Severity: Low (depends on consumer surface)**

No deprecated function aliases exist (e.g., `createAgent` → `createSeed`). Whether this is needed depends on whether external consumers call these query functions directly. Given that:
- The t3 audit flagged missing type aliases at the export boundary
- These query functions are internal to the core library

Function-level aliases may not be required if the module boundary is `src/graph/index.ts` and consumers interact through higher-level APIs. However, if any external code imports directly from `queries.ts`, aliases should be added for migration.

### Observation 5 — Consistency with t5 Schema Findings

The t5 audit found `ThresholdEvent.patternId` as a missed rename in `schema.ts`. Notably, `queries.ts` contains **zero** ThresholdEvent queries, which means the schema-level issue does not propagate into the query layer. However, when ThresholdEvent queries are eventually added, they must use `bloomId` (not `patternId`).

---

## Cross-Module Consistency Matrix

| Concept | queries.ts | schema.ts (t5) | morphemes.ts (t2) | thompson-router (t11) | Consistent? |
|---------|-----------|----------------|--------------------|-----------------------|-------------|
| Node label for LLM instances | `Seed` ✅ | `Seed` ✅ | `Seed` ✅ | N/A (type layer) | ✅ |
| Node label for compositions | `Bloom` ✅ | `Bloom` ✅ | `Bloom` ✅ | N/A (type layer) | ✅ |
| Decision→Seed relationship | `ROUTED_TO` ✅ | `ROUTED_TO` ✅ | N/A | N/A | ✅ |
| Decision→Bloom relationship | `ORIGINATED_FROM` ✅ | `ORIGINATED_FROM` ✅ | N/A | N/A | ✅ |
| Selected seed field | `selectedSeedId` ✅ | `selectedSeedId` ✅ | N/A | `selectedSeedId` (partial) ⚠️ | ⚠️ t11 gap |
| Arm stats seed ref | `seedId` ✅ | N/A | N/A | `seedId` ✅ | ✅ |
| Bloom dependencies | N/A (not in BloomProps) | N/A | `requiresModels` ⚠️ | N/A | ⚠️ t2 gap |

The graph query layer is internally consistent and consistent with the schema layer. Known gaps from t2 and t11 do not propagate into this file.

---

## Verification Command Output

```bash
$ grep -E '(MATCH|CREATE|MERGE).*(:Agent|:Pattern)' src/graph/queries.ts
# (no output)

$ echo 'No old labels in queries'
No old labels in queries
```

Confirmed: zero occurrences of pre-refactor labels in Cypher query strings.

---

## Final Assessment

**queries.ts passes all four acceptance criteria.** The file represents a complete and correct application of the M-7C morpheme-native rename. No fixes are required.