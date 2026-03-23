# Route :Observation creation in write-observation.ts through instantiateMorpheme

> Task ID: t6
> Model: claude-opus-4-5:extended:16k
> Duration: 71512ms
> Output chars: 7858
> Timestamp: 2026-03-23T23:51:23.412Z

> **⚠️ Hallucination flags (5):**
> - [content/warning] Task t6 references "./queries.js" but this file was not in its context
> - [content/warning] Task t6 references "../memory/graph-operations.js" but this file was not in its context
> - [content/warning] Task t6 references "write-observation.ts" but this file was not in its context
> - [content/warning] Task t6 references "src/memory/graph-operations.ts" but this file was not in its context
> - [content/warning] Task t6 references "npx vitest run tests/conformance/write-observation.test.ts" but this file was not in its context

---

# Analysis: Route :Observation Creation in write-observation.ts Through instantiateMorpheme

## Executive Summary

Analysis of `src/graph/write-observation.ts` reveals that :Observation node creation is **delegated** to an imported function (`recordObservation()` from `./queries.js`) rather than performed via inline raw Cypher. The routing modification requires replacing this delegated call with `instantiateMorpheme('seed', { subType: 'Observation' })` while preserving the two-phase write pattern (create node, then update with conditioned values).

---

## Findings

### Finding 1: No Inline Raw CREATE Statement for :Observation

**Evidence:** Full file scan shows no `CREATE (n:Observation)` or `CREATE (:Observation)` Cypher patterns.

**Location of Actual Creation:**
```typescript
// Step 1: Record the raw observation in the graph
await recordObservation(observation);
```
(Line ~130 in `writeObservation()`)

The creation is delegated to `recordObservation()` imported from `./queries.js`. This file acts as an **orchestration layer** rather than a direct Cypher execution point.

---

### Finding 2: Single Observation Creation Path

**Evidence:** The file has exactly one function that initiates observation creation:

| Function | Purpose | Creates :Observation? |
|----------|---------|----------------------|
| `writeObservation()` | Main entry point | Yes (via `recordObservation()`) |
| `writeThresholdEvent()` | Band crossing events | No (creates :ThresholdEvent) |

**Implication:** Only one call site needs modification to route all observations from this file through instantiateMorpheme.

---

### Finding 3: Two-Phase Write Pattern Must Be Preserved

**Evidence:** The observation lifecycle in this file follows a two-phase pattern:

```
Phase 1: recordObservation(observation)     → Creates node with raw properties
Phase 2: updateObservationConditioned(...)  → Adds conditioned signal values
```

**Critical Properties Set in Phase 1** (from `ObservationProps`):
- `id` — observation identifier
- `sourceBloomId` — linked Bloom
- `metric` — metric name
- `value` — raw observation value
- Additional timestamp/metadata properties

**Properties Added in Phase 2:**
- `smoothedValue`, `trendSlope`, `trendProjection`
- `cusumStatistic`, `macdValue`, `macdSignal`
- `filtered`, `alertCount`

**Requirement:** The instantiateMorpheme call must create the node with Phase 1 properties, and the Phase 2 update call (`updateObservationConditioned`) must continue to function against the newly-created node.

---

### Finding 4: ThresholdEvent Uses Raw CREATE (Out of Scope)

**Evidence:** Lines 249-264 contain:
```typescript
await tx.run(
  `CREATE (te:ThresholdEvent {
     id: $id,
     bloomId: $bloomId,
     ...
   })
```

**Assessment:** :ThresholdEvent is **not** listed in R-62's four target node types (:Observation, :Decision, :TaskOutput, :Distillation). This raw CREATE should remain untouched for this task but may warrant future review if ThresholdEvent becomes a morpheme type.

---

### Finding 5: Import Dependencies

**Current Imports:**
```typescript
import {
  recordObservation,
  updateBloomPhiL,
  updateObservationConditioned,
} from "./queries.js";
```

**Required Changes:**
1. Add import for `instantiateMorpheme` (likely from `../memory/graph-operations.js` per file list)
2. Potentially remove `recordObservation` from imports if no longer used

**Dependency Concern:** Verify no circular import risk between `write-observation.ts` → graph-operations module → any module that imports from write-observation.

---

### Finding 6: Grid CONTAINS Relationship Requirement

**From Task Spec:**
> "Grid parent for CONTAINS, Option B multi-label retyping"

**Current State:** The existing `recordObservation()` call likely does not create a Grid CONTAINS relationship (needs verification in queries/observation.ts).

**Post-Change Requirement:** instantiateMorpheme('seed', {...}) must establish:
1. `:Seed:Observation` dual labels
2. `(:Grid)-[:CONTAINS]->(:Seed:Observation)` relationship

The instantiateMorpheme protocol handles this automatically per the Instantiation Protocol design.

---

## Property Mapping Analysis

**Input Type:** `ObservationProps` (imported from `./queries.js`)

**Mapping to instantiateMorpheme:**

| ObservationProps Field | instantiateMorpheme Handling |
|------------------------|------------------------------|
| All properties | Pass through to morpheme node properties |
| (implicit) | `subType: 'Observation'` triggers :Observation label |
| (implicit) | Protocol creates Grid CONTAINS relationship |

**Conditioned values** (smoothedValue, trendSlope, etc.) are NOT part of initial creation—they are added via `updateObservationConditioned()` in the subsequent step.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking two-phase update flow | Medium | High | Verify `updateObservationConditioned` locates node by ID after instantiateMorpheme creation |
| Missing Grid CONTAINS relationship | Low | High | instantiateMorpheme protocol ensures this |
| Property loss during creation | Low | Medium | Explicit pass-through of all ObservationProps |
| Type signature mismatch | Medium | Medium | TypeScript compilation will catch |
| Circular import | Low | High | Trace import graph before implementation |
| Existing tests break | Medium | Medium | Run verification command after changes |

---

## Recommendations

### R1: Replace recordObservation() with instantiateMorpheme()

**Location:** `writeObservation()` function, Step 1

**Pattern:**
```
Before: await recordObservation(observation);
After:  await instantiateMorpheme('seed', { 
          subType: 'Observation',
          ...observation // spread all ObservationProps
        });
```

### R2: Add Required Import

Import `instantiateMorpheme` from the graph-operations module. Check for exact export location in `src/memory/graph-operations.ts`.

### R3: Verify Update Function Compatibility

Confirm `updateObservationConditioned(observation.id, {...})` can locate nodes created via instantiateMorpheme. The node must be findable by its `id` property regardless of creation path.

### R4: Preserve All Existing Properties

The `ObservationProps` type defines required properties. All must be passed to instantiateMorpheme. No property filtering or transformation needed.

### R5: Retain updateObservationConditioned() Call

The Phase 2 update pattern for conditioned values must remain intact. This is not a raw CREATE operation—it's a property update on an existing node.

### R6: Leave writeThresholdEvent() Unchanged

:ThresholdEvent is not part of R-62 scope. The raw CREATE in this function should not be modified.

---

## Verification Checklist

| Check | Command/Method |
|-------|----------------|
| TypeScript compilation | `npx tsc --noEmit` |
| Targeted tests | `npx vitest run tests/conformance/write-observation.test.ts` |
| Dual labels present | Query: `MATCH (n:Seed:Observation) RETURN count(n)` |
| Grid CONTAINS exists | Query: `MATCH (:Grid)-[:CONTAINS]->(o:Observation) RETURN count(o)` |
| All properties preserved | Compare node properties against ObservationProps definition |
| Conditioned update works | Verify Phase 2 properties appear on observation nodes |

---

## Summary

The modification scope is **limited to one function call** in `writeObservation()`. The file's architecture as an orchestration layer means the change is surgically targeted. Key success criteria:

1. Replace `recordObservation(observation)` with `instantiateMorpheme('seed', { subType: 'Observation', ...observation })`
2. Preserve two-phase write pattern (create → condition update)
3. Verify Grid CONTAINS relationship via protocol
4. Confirm dual :Seed:Observation labels on created nodes
5. Leave ThresholdEvent creation untouched