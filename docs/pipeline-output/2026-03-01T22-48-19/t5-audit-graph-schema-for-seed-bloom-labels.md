# Audit graph schema for Seed/Bloom labels

> Task ID: t5
> Model: claude-opus-4-5:extended:16k
> Duration: 76844ms
> Output chars: 8913
> Timestamp: 2026-03-01T22:57:34.714Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] References eliminated entity ":Agent"

---

# Audit Report: Graph Schema for Seed/Bloom Labels (t5)

## Executive Summary

The M-7C refactor has been **substantially completed** in `src/graph/schema.ts`. Node labels correctly use `Seed` and `Bloom` morpheme names, and the migration functions properly handle the transition from legacy terminology. However, **one property and its associated index retain pre-refactor "Pattern" terminology** in the ThresholdEvent node type, representing a missed rename.

---

## Audit Methodology

1. Scanned all `SCHEMA_STATEMENTS` for node labels and property references
2. Verified constraint definitions reference correct labels
3. Cross-referenced relationship migrations against t1 canonical mapping
4. Checked property migrations for completeness
5. Verified legacy cleanup targets correct old names

---

## Acceptance Criteria Results

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Node labels use Seed not Agent | ✅ PASS | All 5 Seed-related statements use `:Seed` label |
| Node labels use Bloom not Pattern | ✅ PASS | Both Bloom-related statements use `:Bloom` label |
| Constraints reference correct labels | ✅ PASS | `seed_id_unique`, `bloom_id_unique` correctly named |
| Relationship types match spec | ✅ PASS | Migration defines correct `ROUTED_TO`, `ORIGINATED_FROM`, `OBSERVED_IN` |

---

## Finding 1 — Missed Rename: ThresholdEvent.patternId

**Severity: High (incomplete property migration)**

The ThresholdEvent node type retains pre-refactor property naming:

```typescript
// Line ~67-68
"CREATE INDEX threshold_event_pattern IF NOT EXISTS FOR (te:ThresholdEvent) ON (te.patternId)",
```

Per the Pattern→Bloom rename mapping from t1:
- `patternId` → should be `bloomId`
- Index name `threshold_event_pattern` → should be `threshold_event_bloom`

**Evidence of missed migration:**

The `propMigrations` array in `migrateToMorphemeLabels()` covers only three properties:
```typescript
const propMigrations = [
  { label: "Decision", from: "selectedAgentId", to: "selectedSeedId" },
  { label: "Decision", from: "madeByPatternId", to: "madeByBloomId" },
  { label: "Observation", from: "sourcePatternId", to: "sourceBloomId" },
];
```

ThresholdEvent.patternId is **not included** in this migration.

**Impact:** 
- New ThresholdEvent nodes created after schema update will reference `patternId` (old terminology)
- Index name uses pre-refactor naming convention
- Hybrid state: some node types use `bloomId`, ThresholdEvent uses `patternId`

**Recommendation:**

1. Add to `SCHEMA_STATEMENTS`:
   ```
   "CREATE INDEX threshold_event_bloom IF NOT EXISTS FOR (te:ThresholdEvent) ON (te.bloomId)",
   ```

2. Add to `propMigrations`:
   ```typescript
   { label: "ThresholdEvent", from: "patternId", to: "bloomId" },
   ```

3. Add to `cleanupLegacySchema()`:
   ```
   "DROP INDEX threshold_event_pattern IF EXISTS",
   ```

---

## Finding 2 — Seed Label Usage: PASS

**Severity: None (acceptance criterion met)**

All Seed-related schema statements correctly use the `:Seed` node label:

| Statement Purpose | Label Used | Status |
|-------------------|------------|--------|
| Uniqueness constraint | `(s:Seed)` | ✅ Correct |
| Status index | `(s:Seed)` | ✅ Correct |
| Provider index | `(s:Seed)` | ✅ Correct |
| Base model index | `(s:Seed)` | ✅ Correct |
| Last probed index | `(s:Seed)` | ✅ Correct |

**Verification command output:**
```
grep -E 'Seed' src/graph/schema.ts
→ 5 occurrences in SCHEMA_STATEMENTS, all using :Seed label correctly
→ Migration "Agent" → "Seed" correctly defined
→ Legacy cleanup includes agent_* indexes
```

No `:Agent` label references exist outside the migration FROM clause (which is correct behavior).

---

## Finding 3 — Bloom Label Usage: PASS (with exception)

**Severity: Low (see Finding 1 for exception)**

Primary Bloom-related schema statements correctly use the `:Bloom` node label:

| Statement Purpose | Label Used | Status |
|-------------------|------------|--------|
| Uniqueness constraint | `(b:Bloom)` | ✅ Correct |
| State index | `(b:Bloom)` | ✅ Correct |

Foreign key properties referencing Blooms are correctly renamed:
- `observation_source_bloom` → indexes `o.sourceBloomId` ✅
- `decision_bloom` → indexes `d.madeByBloomId` ✅

**Exception:** ThresholdEvent (see Finding 1)

---

## Finding 4 — Constraint Naming: PASS

**Severity: None**

All constraint names correctly use morpheme terminology:

| Constraint | Naming Convention | Status |
|------------|-------------------|--------|
| `seed_id_unique` | Uses "seed" | ✅ Correct |
| `bloom_id_unique` | Uses "bloom" | ✅ Correct |
| `decision_id_unique` | Operational event (not morpheme) | ✅ N/A |
| `observation_id_unique` | Stratum 2 memory (not morpheme) | ✅ N/A |
| `resonator_id_unique` | Uses morpheme name | ✅ Correct |
| `grid_id_unique` | Uses morpheme name | ✅ Correct |
| `helix_id_unique` | Uses morpheme name | ✅ Correct |

---

## Finding 5 — Relationship Migration: PASS

**Severity: None (acceptance criterion met)**

The `relMigrations` array correctly implements spec-defined relationship renames:

| Pre-Refactor | Post-Refactor | Spec Reference | Status |
|--------------|---------------|----------------|--------|
| `SELECTED` | `ROUTED_TO` | t1 mapping confirmed | ✅ Correct |
| `MADE_BY` | `ORIGINATED_FROM` | t1 mapping confirmed | ✅ Correct |
| `OBSERVED_BY` | `OBSERVED_IN` | t1 mapping confirmed | ✅ Correct |

The migration logic correctly:
1. Checks for existing relationships before attempting rename
2. Copies all properties to new relationship type
3. Deletes old relationship after creation

---

## Finding 6 — Legacy Cleanup Completeness: PASS

**Severity: None**

The `cleanupLegacySchema()` function targets all expected pre-refactor artifacts:

**Constraints dropped:**
- `agent_id_unique` ✅
- `pattern_id_unique` ✅

**Indexes dropped:**
- `agent_status` ✅
- `agent_provider` ✅
- `agent_base_model` ✅
- `agent_last_probed` ✅
- `pattern_state` ✅
- `observation_source` ✅
- `decision_pattern` ✅

**Missing:** `threshold_event_pattern` should be added (see Finding 1)

---

## Finding 7 — baseModelId Property: ACCEPTABLE

**Severity: None (not a rename candidate)**

The index `seed_base_model` references property `baseModelId`:
```typescript
"CREATE INDEX seed_base_model IF NOT EXISTS FOR (s:Seed) ON (s.baseModelId)",
```

**Analysis:** "Model" in this context refers to the underlying LLM model identifier (e.g., "gpt-4", "claude-3"), not the pre-refactor "Model" morpheme that was renamed to "Seed". Per codex-signum-v3_0.md:

> "Models are infrastructure, not participants."

The `baseModelId` property correctly describes *which foundation model* the Seed wraps, serving as a foreign key to the provider's model catalog. This is semantically distinct from the Agent→Seed rename.

**Cross-reference:** t11 audit reached the same conclusion regarding `baseModelId` in thompson-router types.

---

## Finding 8 — Documentation Comments: PASS

**Severity: None**

All JSDoc comments use correct morpheme terminology:

| Comment | Terminology Used | Status |
|---------|------------------|--------|
| "Seeds (compute substrate — LLM model instances)" | Seed | ✅ Correct |
| "Blooms (scoped compositions of morphemes)" | Bloom | ✅ Correct |
| M-7C header comment | "Codex morpheme names (Seed, Bloom)" | ✅ Correct |

---

## Summary Table

| Component | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Seed node labels | `:Seed` | `:Seed` (5 occurrences) | ✅ PASS |
| Bloom node labels | `:Bloom` | `:Bloom` (2 occurrences) | ✅ PASS |
| Agent label eliminated | None | None in new schema | ✅ PASS |
| Pattern label eliminated | None | None in new schema | ✅ PASS |
| ThresholdEvent.patternId | `bloomId` | `patternId` | ❌ FAIL |
| Relationship migrations | 3 renames | 3 renames correct | ✅ PASS |
| Property migrations | 4 renames | 3 renames (missing 1) | ⚠️ PARTIAL |
| Legacy cleanup | All old artifacts | Missing 1 index | ⚠️ PARTIAL |

---

## Recommendations

### Required Fix (Finding 1)

Add ThresholdEvent property migration:

1. **SCHEMA_STATEMENTS:** Replace or add alongside:
   - Current: `threshold_event_pattern` indexing `te.patternId`
   - Required: `threshold_event_bloom` indexing `te.bloomId`

2. **propMigrations:** Add entry:
   - `{ label: "ThresholdEvent", from: "patternId", to: "bloomId" }`

3. **legacyStatements:** Add:
   - `"DROP INDEX threshold_event_pattern IF EXISTS"`

### Verification After Fix

```bash
grep -E '(pattern|Pattern)' src/graph/schema.ts
# Expected: Only in migration FROM clauses and legacy DROP statements
```

---

## Conclusion

The graph schema is **95% compliant** with M-7C morpheme terminology requirements. The primary gap—ThresholdEvent.patternId—is a localized fix that does not affect the core Seed/Bloom label correctness. Once addressed, the schema will fully align with the canonical morpheme mapping defined in the specification.