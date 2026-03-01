# Audit graph backward-compat and migration support

> Task ID: t7
> Model: claude-opus-4-5:extended:8k
> Duration: 44360ms
> Output chars: 5815
> Timestamp: 2026-03-01T23:11:10.900Z

> **⚠️ Hallucination flags (10):**
> - [content/warning] References eliminated entity ":Agent"
> - [content/warning] References eliminated entity ":Pattern"
> - [content/warning] References eliminated entity "AgentProps"
> - [content/warning] References eliminated entity "PatternProps"
> - [content/warning] References eliminated entity "createAgent"
> - [content/warning] References eliminated entity "getAgent"
> - [content/warning] References eliminated entity "listActiveAgents"
> - [content/warning] References eliminated entity "createPattern"
> - [content/warning] References eliminated entity "getPattern"
> - [content/warning] References eliminated entity "updatePatternState"

---

# Audit Report: Graph Backward-Compatibility & Migration Support (t7)

## Executive Summary

The graph module barrel export (`index.ts`) demonstrates **good backward-compatibility alias coverage** for the M-7C refactor. However, the migration script (`migrate.ts`) has a **critical gap**: it lacks data migration logic to transition existing graph nodes from old labels (Agent, Pattern) to new labels (Seed, Bloom).

---

## Findings

### 1. ❌ CRITICAL: Missing Data Migration Logic in `migrate.ts`

**Evidence:**
```
grep -E '(Agent|Pattern|Seed|Bloom)' src/graph/migrate.ts
# Returns: no matches
```

The migration script only handles:
- Schema constraints and indexes via `migrateSchema()`
- Constitutional rules via `seedConstitutionalRules()`
- Schema verification via `verifySchema()`

**Gap:** No Cypher statements exist to:
- Relabel `:Agent` nodes to `:Seed`
- Relabel `:Pattern` nodes to `:Bloom`
- Migrate any renamed relationship types

**Risk:** Existing graph databases will retain old labels, causing queries targeting new labels (`:Seed`, `:Bloom`) to return empty results.

---

### 2. ✅ PASS: Index Exports Include Comprehensive Compat Aliases

**Evidence from `src/graph/index.ts`:**

| New Name | Deprecated Alias | Status |
|----------|------------------|--------|
| `createSeed` | `createAgent` | ✅ Present |
| `getSeed` | `getAgent` | ✅ Present |
| `listActiveSeeds` | `listActiveAgents` | ✅ Present |
| `listActiveSeedsByCapability` | `listActiveAgentsByCapability` | ✅ Present |
| `createBloom` | `createPattern` | ✅ Present |
| `getBloom` | `getPattern` | ✅ Present |
| `updateBloomState` | `updatePatternState` | ✅ Present |
| `connectBlooms` | `connectPatterns` | ✅ Present |
| `getObservationsForBloom` | `getObservationsForPattern` | ✅ Present |
| `countObservationsForBloom` | `countObservationsForPattern` | ✅ Present |
| `getBloomDegree` | `getPatternDegree` | ✅ Present |
| `getBloomAdjacency` | `getPatternAdjacency` | ✅ Present |
| `getBlomsWithHealth` | `getPatternsWithHealth` | ✅ Present |
| `updateBloomPhiL` | `updatePatternPhiL` | ✅ Present |

**Type Aliases:**

| New Name | Deprecated Alias | Status |
|----------|------------------|--------|
| `SeedProps` | `AgentProps` | ✅ Present |
| `BloomProps` | `PatternProps` | ✅ Present |

Aliases are properly commented as `// Backward compatibility aliases (deprecated)`.

---

### 3. ⚠️ WARNING: Hybrid State in write-observation.ts Export

**Evidence:**
```typescript
export type {
  PatternHealthContext,  // ← Still uses old "Pattern" naming
  WriteObservationResult,
} from "./write-observation.js";
```

**Issue:** The type `PatternHealthContext` was not renamed to `BloomHealthContext`. Per the engineering bridge spec, this should be:
- New name: `BloomHealthContext`
- Deprecated alias: `PatternHealthContext`

This represents **spec drift** from the refactor intent.

---

### 4. ⚠️ WARNING: Migration Script Dependencies Unverified

The migration script delegates to `./schema.js` for actual operations:
- `migrateSchema()`
- `seedConstitutionalRules()`
- `verifySchema()`

**Note:** Without access to `src/graph/schema.ts`, we cannot verify whether:
- Schema statements reference new labels (`:Seed`, `:Bloom`)
- Constraints are defined for both old and new labels during transition
- Index definitions cover the renamed entities

---

## Verification Against Acceptance Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Migration handles Agent→Seed transition | ❌ **FAIL** | No relabeling logic present |
| Migration handles Pattern→Bloom transition | ❌ **FAIL** | No relabeling logic present |
| Index exports include compat aliases | ✅ **PASS** | Comprehensive function and type aliases |
| No breaking changes for existing graph data | ⚠️ **AT RISK** | Old data won't be queryable with new names |

---

## Recommendations

### R1: Implement Data Migration Functions (Priority: Critical)

Add to `migrate.ts` or a dedicated migration module:

```cypher
// Required migration statements:
MATCH (a:Agent) SET a:Seed REMOVE a:Agent;
MATCH (p:Pattern) SET p:Bloom REMOVE p:Pattern;
```

Consider a phased approach:
1. **Phase 1:** Add new labels alongside old (dual-label period)
2. **Phase 2:** Update all queries to use new labels
3. **Phase 3:** Remove old labels

### R2: Rename `PatternHealthContext` to `BloomHealthContext`

In `src/graph/write-observation.ts`:
- Export as `BloomHealthContext`
- Add deprecated type alias: `export type PatternHealthContext = BloomHealthContext`

### R3: Audit `schema.ts` for Label Consistency

Verify that:
- Uniqueness constraints target `:Seed` and `:Bloom`
- Indexes are defined on new labels
- Consider dual constraints during migration period

### R4: Add Migration Versioning

Implement a migration version table or marker to:
- Track which migrations have run
- Prevent re-running completed migrations
- Support incremental migration rollout

### R5: Document Breaking Change Risk

Add explicit documentation noting that:
- Systems with existing `:Agent`/`:Pattern` data must run migration
- Timeline for deprecation alias removal
- Rollback procedures if migration fails

---

## Files Requiring Follow-up Review

| File | Reason |
|------|--------|
| `src/graph/schema.ts` | Verify constraints/indexes use new labels |
| `src/graph/queries.ts` | Verify alias implementations actually work |
| `src/graph/write-observation.ts` | Fix `PatternHealthContext` naming |

---

## Summary

The **barrel export** is well-structured with proper backward-compatibility aliases, satisfying API-level non-breaking requirements. However, the **migration infrastructure** is incomplete—it handles schema but not data migration, creating risk for existing deployments. The `PatternHealthContext` type represents residual hybrid state requiring correction.