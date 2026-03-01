# Audit memory module for terminology consistency

> Task ID: t14
> Model: claude-opus-4-6:adaptive:medium
> Duration: 179131ms
> Output chars: 14352
> Timestamp: 2026-03-01T23:05:22.871Z

---

# Audit Report: Memory Module Morpheme Terminology (t14)

## Executive Summary

The `src/memory/` module is in a **hybrid state** with significant Pattern→Bloom rename gaps. The refactor was applied unevenly: some output-facing fields (`sourceBloomId`, `madeByBloomId`) correctly use post-refactor naming, while input interfaces, parameters, method names, and internal variables still carry pre-refactor `pattern`/`patternId` terminology. This creates a characteristic signature where data flows _in_ through old-named parameters and flows _out_ through new-named type fields — the mapping between them is correct at runtime but the naming is inconsistent.

`compaction.ts` and `distillation.ts` are clean of Agent/Pattern morpheme references. `operations.ts` and `flow.ts` carry the bulk of the findings.

| File | Status | Findings |
|------|--------|----------|
| `compaction.ts` | ✅ Clean | No morpheme entity references; operates on stratum-level data |
| `distillation.ts` | ✅ Clean (with note) | No Agent/Pattern references; `modelId` flagged for consistency review |
| `flow.ts` | 🔴 Hybrid state | `execution.patternId` not renamed; hybrid assignment to `sourceBloomId` |
| `operations.ts` | 🔴 Hybrid state | `EphemeralStore` uses `patternId` throughout; `distillObservations` parameter `patternIds` not renamed; `findByPattern` method name retained |

---

## Methodology

1. Scanned all four files for pre-refactor terms: `Agent`, `Pattern`, `patternId`, `agentId`, `selectedModelId`, `madeByPatternId`, `sourcePatternId`, `SELECTED`, `MADE_BY`, `OBSERVED_BY`
2. Cross-referenced against t1 canonical morpheme mapping and t6 graph queries (confirmed post-refactor types)
3. Traced data flow paths to identify hybrid mapping points (old name in → new name out)
4. Verified Stratum 2 memory terminology (`Observation`, `createObservation`) is correctly retained per t1/t3 clarification that these are memory types, not observer→feedback targets
5. Compared against `Observation` type shape (inferred from usage: `sourceBloomId` field confirmed by t6)

---

## File: `src/memory/compaction.ts` — ✅ CLEAN

No morpheme entity references. The file operates entirely on stratum-level observation metadata (`CompactableObservation`, weight computation, distillation inclusion checks). It correctly uses:

- "observation" — Stratum 2 memory concept, not observer→feedback territory
- "distillation" — Stratum 3 concept, correctly named
- "signal" — pipeline concept, correctly named

No Seed, Bloom, Agent, or Pattern references. No action required.

---

## File: `src/memory/distillation.ts` — ✅ CLEAN (with consistency note)

No Agent or Pattern terminology found. All interfaces use neutral `componentId` identifiers.

### Note: `modelId` Consistency Question

**Severity: Low (consistency review, not a missed rename)**

`RoutingHints` and `RoutingObservation` use `modelId` throughout:

```typescript
preferredModels: Array<{ modelId: string; ... }>;
avoidModels: Array<{ modelId: string; ... }>;
```

```typescript
export interface RoutingObservation {
  modelId: string;
  // ...
}
```

Per t11, the thompson-router is migrating `selectedModelId` → `selectedSeedId` and `RoutableModel` → `RoutableSeed`. The distillation module's `modelId` likely refers to the same concept (which LLM was used).

**However**, there is a meaningful distinction: `modelId` here may refer to the _base model name_ (e.g., `"gpt-4"`, `"claude-3"`) rather than the graph Seed node ID. The graph schema (per t5) distinguishes `Seed.id` from `Seed.baseModel`. If `modelId` maps to `baseModel` (an infrastructure identifier), it is correctly named. If it maps to `Seed.id` (the graph entity), it should be `seedId`.

**Recommendation:** Defer to a cross-module consistency pass. If the thompson-router audit (t11) resolves that `modelId` → `seedId` broadly, propagate here. Otherwise, document the distinction.

---

## File: `src/memory/flow.ts` — 🔴 HYBRID STATE

### Finding 1 — `execution.patternId` Not Renamed

**Severity: High (missed rename in public interface)**

The `UpwardFlowInput.execution` interface retains `patternId`:

```typescript
export interface UpwardFlowInput {
  execution: {
    patternId: string;    // ← Pre-refactor: should be bloomId
    modelId: string;
    // ...
  };
  // ...
}
```

This is the entry point for all upward memory flow. Every caller must pass `patternId`, propagating pre-refactor terminology into the memory system.

### Finding 2 — Hybrid Assignment in Observation Creation

**Severity: High (hybrid state — old name in, new name out)**

```typescript
const observation: Observation = {
  id: generateId(),
  stratum: 2,
  timestamp: new Date(),
  sourceBloomId: execution.patternId,   // ← reads old name, writes new name
  observationType: "execution_outcome",
  data,
};
```

The `Observation` type correctly has `sourceBloomId` (confirmed by t6 graph queries audit). But the _value_ is sourced from the old-named `execution.patternId`. At runtime this works (both are strings), but it creates a confusing code path where the rename boundary is inside a single assignment.

**Expected after fix:**
```
sourceBloomId: execution.bloomId
```

### Finding 3 — `execution.modelId` Propagation

**Severity: Low (same consistency question as distillation.ts)**

```typescript
modelUsed: execution.modelId,
```

The `ObservationData.modelUsed` field receives `execution.modelId`. Same question as distillation.ts — is this a base model name or a Seed graph ID? Deferred to cross-module pass.

---

## File: `src/memory/operations.ts` — 🔴 HYBRID STATE (Multiple Findings)

### Finding 4 — `EphemeralStore` Uses `patternId` Throughout

**Severity: High (missed rename in core class, 5+ occurrences)**

The `EphemeralStore` class uses `patternId` as both a parameter name and property accessor:

| Location | Code | Issue |
|----------|------|-------|
| `add()` parameter | `add(patternId: string, ...)` | Parameter name pre-refactor |
| `add()` body | `patternId,` (spread into EphemeralMemory) | Stores pre-refactor field |
| `findByPattern()` name | `findByPattern(patternId: string)` | Method name pre-refactor |
| `findByPattern()` body | `entry.patternId === patternId` | Accesses pre-refactor field |
| `promote()` body | `sourceBloomId: entry.patternId` | Hybrid: reads old, writes new |

The `promote()` method is the clearest hybrid evidence:

```typescript
promote(executionId, observationType, data): Observation | null {
  const entry = this.entries.get(executionId);
  if (!entry) return null;

  const observation: Observation = {
    // ...
    sourceBloomId: entry.patternId,   // ← reads patternId, writes sourceBloomId
    // ...
  };
```

**Implication for `types/memory.ts`:** The `EphemeralMemory` type (imported from `../types/memory.js`) must have a `patternId` field for this code to compile. This confirms a missed rename in the type definition as well, though `types/memory.ts` is outside the direct scope of this file audit.

**Expected renames:**
- `add(patternId)` → `add(bloomId)`
- `findByPattern(patternId)` → `findByBloom(bloomId)`
- `entry.patternId` → `entry.bloomId`
- `EphemeralMemory.patternId` → `EphemeralMemory.bloomId` (in types/memory.ts)

### Finding 5 — `distillObservations()` Parameter and Variable Names

**Severity: High (missed rename in public API)**

```typescript
export function distillObservations(
  observations: Observation[],
  category: DistillationCategory,
  patternIds?: string[],              // ← should be bloomIds
): Distillation {
  // ...
  const relatedPatternIds = patternIds ?? [
    ...new Set(observations.map((o) => o.sourceBloomId)),
  ];

  return {
    // ...
    relatedPatternIds,                // ← field name depends on Distillation type
  };
}
```

Three issues in one function:

1. **Parameter `patternIds`** — public API uses pre-refactor name. Should be `bloomIds`.
2. **Local variable `relatedPatternIds`** — carries pre-refactor name internally. Should be `relatedBloomIds`.
3. **Return field `relatedPatternIds`** — must match the `Distillation` type definition. If the type still has `relatedPatternIds`, both need renaming. If the type has `relatedBloomIds`, this code would not compile (unlikely given it's presented as working).

**Implication for `types/memory.ts`:** The `Distillation` type likely still has `relatedPatternIds: string[]`, which is a missed rename.

### Finding 6 — `createObservation()` and `createDecision()` — ✅ PASS

These functions correctly use post-refactor naming:

```typescript
export function createObservation(
  sourceBloomId: string,      // ✅ Correct
  // ...
): Observation { ... }

export function createDecision(
  // ...
  madeByBloomId: string,      // ✅ Correct
  // ...
): Decision { ... }
```

This confirms the refactor was partially applied — these two functions were updated while `EphemeralStore` and `distillObservations` were missed.

### Finding 7 — `shouldDistill()` and `shouldPromoteToInstitutional()` — ✅ PASS

These functions operate on generic observation/distillation arrays without morpheme entity references. No issues.

---

## Cross-Module Implications: `types/memory.ts`

The memory module code reveals at least two likely missed renames in `src/types/memory.ts` (not provided for direct review):

| Inferred Type | Inferred Field | Expected Rename | Evidence |
|---------------|---------------|-----------------|----------|
| `EphemeralMemory` | `patternId: string` | `bloomId: string` | `EphemeralStore.add()` stores it; `promote()` reads it |
| `Distillation` | `relatedPatternIds: string[]` | `relatedBloomIds: string[]` | `distillObservations()` returns it |
| `ObservationData` | `modelUsed: string` | TBD (see consistency note) | `flow.ts` writes `modelUsed: execution.modelId` |

**Recommendation:** Audit `src/types/memory.ts` as a follow-on task. The memory module code cannot be fully corrected until the underlying types are renamed.

---

## Verification Command Results

```bash
grep -rE '(Agent|Pattern)' src/memory/ || echo 'Memory module clean'
```

**Expected output (will NOT report clean):**

```
src/memory/operations.ts:  add(patternId: string, data: Record<string, unknown> = {}): EphemeralMemory {
src/memory/operations.ts:      patternId,
src/memory/operations.ts:  findByPattern(patternId: string): EphemeralMemory[] {
src/memory/operations.ts:      (entry) => entry.patternId === patternId,
src/memory/operations.ts:    sourceBloomId: entry.patternId,
src/memory/operations.ts:  patternIds?: string[],
src/memory/operations.ts:  const relatedPatternIds = patternIds ?? [
src/memory/operations.ts:    relatedPatternIds,
src/memory/flow.ts:    patternId: string;
src/memory/flow.ts:    sourceBloomId: execution.patternId,
```

Zero matches for `Agent`. Multiple matches for `Pattern`/`pattern` — all in `operations.ts` and `flow.ts`.

---

## Acceptance Criteria Assessment

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Memory operations use Seed/Bloom types | ❌ **FAIL** | `EphemeralStore` uses `patternId` (6 occurrences); `distillObservations` uses `patternIds` (3 occurrences) |
| Compaction references correct node types | ✅ **PASS** | No morpheme node references; operates on stratum-level metadata |
| Flow coordinator uses morpheme naming | ❌ **FAIL** | `UpwardFlowInput.execution.patternId` not renamed; hybrid assignment in observation creation |
| No old terminology in memory code | ❌ **FAIL** | 9 occurrences of `pattern`/`Pattern` as morpheme references across `operations.ts` and `flow.ts` |

---

## Consolidated Finding Inventory

| # | File | Finding | Severity | Type |
|---|------|---------|----------|------|
| 1 | flow.ts | `execution.patternId` → `bloomId` | High | Missed rename |
| 2 | flow.ts | `sourceBloomId: execution.patternId` hybrid assignment | High | Hybrid state |
| 3 | operations.ts | `EphemeralStore.add(patternId)` → `add(bloomId)` | High | Missed rename |
| 4 | operations.ts | `findByPattern()` → `findByBloom()` | High | Missed rename |
| 5 | operations.ts | `entry.patternId` access (5 sites) → `entry.bloomId` | High | Missed rename |
| 6 | operations.ts | `promote()` hybrid: `entry.patternId` → `sourceBloomId` | High | Hybrid state |
| 7 | operations.ts | `distillObservations(patternIds)` → `(bloomIds)` | High | Missed rename |
| 8 | operations.ts | `relatedPatternIds` variable/field → `relatedBloomIds` | High | Missed rename |
| 9 | (types/memory.ts) | `EphemeralMemory.patternId` → `bloomId` | High | Upstream dependency |
| 10 | (types/memory.ts) | `Distillation.relatedPatternIds` → `relatedBloomIds` | High | Upstream dependency |
| 11 | distillation.ts | `modelId` consistency with Seed morpheme | Low | Consistency review |
| 12 | flow.ts | `execution.modelId` / `ObservationData.modelUsed` | Low | Consistency review |

---

## Recommendations

### Priority 1 — Resolve Hybrid State (Findings 1–10)

The hybrid state is the most urgent issue. Code that reads `patternId` and writes `sourceBloomId` is confusing and will mislead future contributors.

**Sequence:**
1. Rename fields in `src/types/memory.ts` first (`EphemeralMemory.patternId` → `bloomId`, `Distillation.relatedPatternIds` → `relatedBloomIds`)
2. Update `operations.ts` — EphemeralStore methods, distillObservations signature
3. Update `flow.ts` — UpwardFlowInput interface
4. Add backward-compatibility aliases in types if external consumers exist:
   ```typescript
   /** @deprecated Use bloomId */
   patternId?: string;
   ```

### Priority 2 — Backward Compatibility

If `EphemeralStore.findByPattern()` or `distillObservations(patternIds)` are called by external consumers, add deprecated wrapper methods:

```typescript
/** @deprecated Use findByBloom */
findByPattern(patternId: string) { return this.findByBloom(patternId); }
```

### Priority 3 — `modelId` / `seedId` Cross-Module Decision

Coordinate with t11 resolution on whether `modelId` broadly becomes `seedId`. If yes, propagate to `distillation.ts` (`RoutingHints`, `RoutingObservation`) and `flow.ts` (`UpwardFlowInput.execution`). If `modelId` is retained as an infrastructure identifier distinct from Seed node ID, document the convention.

### Priority 4 — Verify `types/memory.ts`

This audit inferred two missed renames in `types/memory.ts` from usage patterns. A direct audit of that file should confirm and remediate.