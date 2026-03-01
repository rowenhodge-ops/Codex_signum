# M-7C Entity Mapping — Authoritative Rename Reference

**Milestone:** M-7C (Grammar Refactor — Morpheme-Native Codebase)
**Created:** 2026-03-02
**Status:** Active — single source of truth for all M-7C renames

---

## Principle

Only rename entities that ARE morphemes. Operational records (Decision, Observation,
ThresholdEvent, etc.) stay as they are — they describe *what happened*, not *what something is*.

---

## Neo4j Node Labels

| Current Label | New Label | Rationale |
|---|---|---|
| `Agent` | `Seed` | LLM model instances are atomic compute units (seedType: "function") |
| `Pattern` | `Bloom` | Patterns are scoped compositions of morphemes — Bloom encodes scope/boundary |
| `Decision` | Keep | Operational event, not a morpheme |
| `ConstitutionalRule` | Keep | Governance constraint, not a morpheme |
| `Observation` | Keep | Stratum 2 memory event, correctly named |
| `Distillation` | Keep | Stratum 3 extracted pattern, correctly named |
| `InstitutionalKnowledge` | Keep | Stratum 4, correctly named |
| `ContextCluster` | Keep | Thompson sampling grouping, operational |
| `ThresholdEvent` | Keep | Immutable band crossing record, operational |
| `Seed` | Keep (already exists) | Constraint `seed_id_unique` already in schema |
| `Resonator` | Keep (already exists) | Constraint `resonator_id_unique` already in schema |
| `Grid` | Keep (already exists) | Constraint `grid_id_unique` already in schema |
| `Helix` | Keep (already exists) | Constraint `helix_id_unique` already in schema |

---

## Neo4j Relationship Types

| Current | New | Rationale |
|---|---|---|
| `SELECTED` | `ROUTED_TO` | Decision routes to a Seed. "Selected" is ambiguous. |
| `MADE_BY` | `ORIGINATED_FROM` | Decision originates from a Bloom. |
| `OBSERVED_BY` | `OBSERVED_IN` | Observation observed in a Bloom. Preposition correction. |
| `IN_CONTEXT` | Keep | Already clear — Decision in ContextCluster |
| `DISTILLED_FROM` | Keep | Already clear |
| `CONTAINS` | Keep | G3 grammar rule — containment is first-class |
| `THRESHOLD_CROSSED_BY` | Keep | Already clear |

---

## Neo4j Node Properties (Stored on Nodes)

| Node Type | Current Property | New Property | Notes |
|---|---|---|---|
| Decision | `selectedAgentId` | `selectedSeedId` | Stored on Decision node |
| Observation | (index `sourcePatternId`) | (index `sourceBloomId`) | Property referenced by index; update for consistency |
| Decision | (index `madeByPatternId`) | (index `madeByBloomId`) | Property referenced by index; update for consistency |

---

## Neo4j Schema (Constraints + Indexes)

### Constraints Renamed

| Current | New |
|---|---|
| `agent_id_unique FOR (a:Agent)` | `seed_id_unique FOR (s:Seed)` (already exists) |
| `pattern_id_unique FOR (p:Pattern)` | `bloom_id_unique FOR (b:Bloom)` |

### Indexes Renamed

| Current | New |
|---|---|
| `agent_status FOR (a:Agent) ON (a.status)` | `seed_status FOR (s:Seed) ON (s.status)` |
| `agent_provider FOR (a:Agent) ON (a.provider)` | `seed_provider FOR (s:Seed) ON (s.provider)` |
| `agent_base_model FOR (a:Agent) ON (a.baseModelId)` | `seed_base_model FOR (s:Seed) ON (s.baseModelId)` |
| `agent_last_probed FOR (a:Agent) ON (a.lastProbed)` | `seed_last_probed FOR (s:Seed) ON (s.lastProbed)` |
| `pattern_state FOR (p:Pattern) ON (p.state)` | `bloom_state FOR (b:Bloom) ON (b.state)` |
| `observation_source ON (o.sourcePatternId)` | `observation_source ON (o.sourceBloomId)` |
| `decision_pattern ON (d.madeByPatternId)` | `decision_bloom ON (d.madeByBloomId)` |

---

## TypeScript Interface Renames

| Current | New | File |
|---|---|---|
| `AgentProps` | `SeedProps` | `src/graph/queries.ts` |
| `PatternProps` | `BloomProps` | `src/graph/queries.ts` |

---

## TypeScript Property Renames

| Interface | Current Property | New Property |
|---|---|---|
| `DecisionProps` | `selectedAgentId` | `selectedSeedId` |
| `DecisionProps` | `madeByPatternId` | `madeByBloomId` |
| `ObservationProps` | `sourcePatternId` | `sourceBloomId` |
| `ArmStats` | `agentId` | `seedId` |
| `SelectModelResult` | `selectedAgentId` | `selectedSeedId` |
| `Observation` (memory type) | `sourcePatternId` | `sourceBloomId` |
| `Decision` (memory type) | `madeByPatternId` | `madeByBloomId` |

---

## TypeScript Function Renames

| Current | New | File |
|---|---|---|
| `createAgent()` | `createSeed()` | `src/graph/queries.ts` |
| `getAgent()` | `getSeed()` | `src/graph/queries.ts` |
| `listActiveAgents()` | `listActiveSeeds()` | `src/graph/queries.ts` |
| `listActiveAgentsByCapability()` | `listActiveSeedsByCapability()` | `src/graph/queries.ts` |
| `createPattern()` | `createBloom()` | `src/graph/queries.ts` |
| `getPattern()` | `getBloom()` | `src/graph/queries.ts` |
| `updatePatternState()` | `updateBloomState()` | `src/graph/queries.ts` |
| `connectPatterns()` | `connectBlooms()` | `src/graph/queries.ts` |
| `getPatternDegree()` | `getBloomDegree()` | `src/graph/queries.ts` |
| `getPatternAdjacency()` | `getBloomAdjacency()` | `src/graph/queries.ts` |
| `getPatternsWithHealth()` | `getBloomsWithHealth()` | `src/graph/queries.ts` |
| `updatePatternPhiL()` | `updateBloomPhiL()` | `src/graph/queries.ts` |
| `getObservationsForPattern()` | `getObservationsForBloom()` | `src/graph/queries.ts` |
| `countObservationsForPattern()` | `countObservationsForBloom()` | `src/graph/queries.ts` |
| `freshArmStats(agentId)` | `freshArmStats(seedId)` | `src/patterns/thompson-router/arm-stats.ts` |
| `bootstrapAgents()` | `bootstrapSeeds()` | `src/bootstrap.ts` |
| `bootstrapPatterns()` | `bootstrapBlooms()` | `src/bootstrap.ts` |

---

## Directory Renames

| Current | New | Rationale |
|---|---|---|
| `src/patterns/observer/` | `src/patterns/feedback/` | Observer is an eliminated entity. The code provides feedback functions — name it for what it does. |

---

## Barrel Export Deprecation Aliases

All renamed exports get `@deprecated` aliases in `src/graph/queries.ts`, `src/graph/index.ts`,
and `src/index.ts` for backward compatibility. Remove in M-8 when DND-Manager reconnects.

---

## What Does NOT Change

- `src/types/morphemes.ts` — already uses correct Codex names
- `src/computation/` — internal function names use generic terms
- `src/constitutional/` — rule engine works on any node type
- `src/memory/` — generic memory stratum names (except property renames above)
- `src/resilience/` — generic
- `src/signals/` — DO NOT TOUCH (Rule 8). `agentId` in signals is a generic entity key.
- `src/computation/condition-value.ts` — `agentId` parameter maps to signal pipeline key
- Hypothesis IDs — permanent
- Axiom names/numbers — immutable
- `src/patterns/architect/` — pattern name, not entity type
- `src/patterns/dev-agent/` — pattern name, not entity type
- `src/patterns/thompson-router/` — pattern name, not entity type
- `ModelExecutor`, `TaskExecutor` — interfaces, not graph entities
- `DevAgentModelExecutor` — interface, not graph entity
- Generic English "agent" or "pattern" in comments not referring to Neo4j labels

---

## Cypher Label Verification Target

After all renames:
```bash
grep -rn ":Agent\b" src/ --include="*.ts" | grep -v "deprecated\|@deprecated\|LEGACY"
grep -rn ":Pattern\b" src/ --include="*.ts" | grep -v "deprecated\|@deprecated\|LEGACY"
```
Both should return **zero** Cypher hits (function/variable references excluded, only Cypher label contexts).
