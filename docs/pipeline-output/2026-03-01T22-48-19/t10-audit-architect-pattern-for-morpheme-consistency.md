# Audit architect pattern for morpheme consistency

> Task ID: t10
> Model: claude-opus-4-5:extended:8k
> Duration: 62284ms
> Output chars: 6974
> Timestamp: 2026-03-01T23:02:22.334Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] References eliminated entity "Pattern node"

---

# Audit Report: Architect Pattern Morpheme Consistency

## Executive Summary

**Status: PARTIAL COMPLIANCE — Hybrid State Detected**

The architect pattern files show **incomplete migration** from Pattern→Bloom terminology. The Neo4j queries correctly reference `Bloom` nodes, but the surrounding TypeScript types and state objects still use `pattern` terminology, creating a hybrid state where the graph layer is migrated but the type layer is not.

---

## File-by-File Analysis

### 1. `src/patterns/architect/types.ts`

**Finding: Hybrid terminology in type definitions**

| Location | Current | Expected | Severity |
|----------|---------|----------|----------|
| `SurveyOutput.graphState.patternHealth` | `patternHealth` | `bloomHealth` | ⚠️ Warning |
| Comment line ~88 | "Pattern health readings: pattern id → ΦL value" | "Bloom health readings: bloom id → ΦL value" | ⚠️ Warning |
| `PipelineSurveyOutput.graph_state.pattern_health` | `pattern_health` | `bloom_health` | ⚠️ Warning |

**Evidence:**
```typescript
// Line ~85-88 in types.ts
graphState: {
  /** Pattern health readings: pattern id → ΦL value */
  patternHealth: Record<string, number>;
```

```typescript
// Line ~149-152 in types.ts  
graph_state: {
  pattern_health: Record<string, number>;
```

**Assessment:** These are exported public types. Consumer code may be using `pattern_health` and `patternHealth` property access. Requires backward-compatibility aliases if migrated.

---

### 2. `src/patterns/architect/survey.ts`

**Finding: Query/storage mismatch (correctly queries Bloom, incorrectly stores in patternHealth)**

| Location | Issue | Severity |
|----------|-------|----------|
| Line ~327-335 | Query uses `Bloom` label but stores in `patternHealth` | ⚠️ Warning |
| Line ~371 | Resolution message says "Pattern nodes" instead of "Bloom nodes" | 🔴 Error |

**Evidence — Query/storage hybrid:**
```typescript
// Line ~327-335: Comment says Bloom, query uses Bloom, stores in patternHealth
// Query bloom health (ΦL values)
try {
  const result = await session.run(
    "MATCH (b:Bloom) RETURN b.id AS id, b.phi_l AS phiL",  // ✅ Correct
  );
  for (const record of result.records) {
    // ...
    state.patternHealth[id] = phiL;  // ❌ Hybrid: should be bloomHealth
  }
}
```

**Evidence — Incorrect resolution text:**
```typescript
// Line ~371
resolution: "Check if Pattern nodes have constitutional_violations property",
// Should be: "Check if Bloom nodes have constitutional_violations property"
```

**Additional concern — ThresholdEvent schema:**
```typescript
// Line ~351
RETURN t.patternId AS pid, t.dimension AS dim
```
This references `t.patternId` in the graph. If the graph schema was migrated to `bloomId`, this query would fail. If the graph schema still uses `patternId`, there's a schema/spec drift.

---

### 3. `src/patterns/architect/decompose.ts`

**Finding: COMPLIANT — No morpheme terminology issues**

This file creates `Task` nodes within `TaskGraph` structures. Tasks are architect-pattern execution units, not Codex Signum morpheme types. The terminology is appropriate for the pipeline context.

- Creates: `Task[]`, `Phase[]`, `TaskGraph`
- No references to: Agent, Pattern, Seed, Bloom

**Assessment:** No changes required.

---

### 4. `src/patterns/architect/classify.ts`

**Finding: COMPLIANT — No morpheme terminology issues**

This file classifies tasks as "mechanical" vs "generative" based on heuristic analysis. No morpheme entity references.

**Assessment:** No changes required.

---

### 5. `src/patterns/architect/architect.ts`

**Finding: COMPLIANT — No morpheme terminology issues**

Orchestrates the 7-stage pipeline. Uses PipelineSurveyOutput which has the `pattern_health` issue, but the orchestrator itself doesn't directly reference morpheme terminology.

**Assessment:** No changes required (inherits issue from types.ts).

---

## Gap Analysis Matrix

| Aspect | Status | Details |
|--------|--------|---------|
| Decompose creates Seed nodes | ✅ N/A | Decompose creates Task nodes (execution units), not morpheme Seed nodes — correct for architect pattern |
| Task classification uses Bloom types | ⚠️ Partial | Types file uses `patternHealth` instead of `bloomHealth` |
| Survey functions use morpheme naming | ❌ Hybrid | Graph queries use `Bloom`, storage uses `pattern*` naming |
| No hybrid old/new terminology | ❌ Fail | Multiple instances of Pattern/Bloom hybrid state |

---

## Backward Compatibility Concerns

If these types are exported publicly (and they are — exported from `types.ts`), consumers may be accessing:

- `surveyOutput.graphState.patternHealth`
- `pipelineSurvey.graph_state.pattern_health`

**Recommendation:** Add type aliases if full backward compatibility is required:

```typescript
// Proposed pattern (analysis only — not a code change)
interface GraphState {
  bloomHealth: Record<string, number>;
  /** @deprecated Use bloomHealth instead */
  patternHealth?: Record<string, number>;  // Backward compat alias
}
```

---

## Spec Drift Analysis

Comparing against spec references:

**codex-signum-v3_0.md expectation:**
- Bloom is the canonical name for what was previously Pattern
- All ΦL (phi_l) health readings should associate with Bloom entities

**Current state:**
- Graph queries correctly use `Bloom` nodes ✅
- TypeScript types still reference `pattern` terminology ❌
- Resolution messages still reference `Pattern` nodes ❌

---

## Recommendations

### Priority 1 (Hybrid State Fixes)
1. **Rename in types.ts:** `patternHealth` → `bloomHealth`, `pattern_health` → `bloom_health`
2. **Update comment:** "Pattern health readings" → "Bloom health readings"

### Priority 2 (User-Facing Strings)
3. **Fix resolution text in survey.ts:** "Pattern nodes" → "Bloom nodes"

### Priority 3 (Graph Schema Verification)
4. **Verify ThresholdEvent schema:** Does the graph use `patternId` or `bloomId`? Align query with actual schema.

### Priority 4 (Backward Compatibility)
5. If breaking change is unacceptable, add deprecated type aliases for `patternHealth`/`pattern_health`

---

## Verification Commands

```bash
# Check for remaining Pattern references in architect pattern
grep -rn "pattern" src/patterns/architect/*.ts | grep -vi "decompose\|sequenc\|parallel" | head -20

# Check for Bloom references (should exist in queries)
grep -rn "Bloom" src/patterns/architect/*.ts

# Check for any Agent references (should be none or only in DevAgent consumer context)
grep -rn "Agent" src/patterns/architect/*.ts
```

---

## Conclusion

The architect pattern is in a **hybrid migration state**. The database layer (Neo4j queries) correctly uses `Bloom` terminology, but the TypeScript type layer retains `pattern` terminology. This creates a semantic mismatch where:

1. Code **queries** Bloom nodes
2. Code **stores** results in `patternHealth` properties
3. **Error messages** reference "Pattern nodes"

This should be resolved to complete the M-7C Grammar Refactor for the architect pattern.