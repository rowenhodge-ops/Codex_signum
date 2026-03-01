# Audit types/index.ts for export completeness

> Task ID: t3
> Model: claude-opus-4-5:extended:32k
> Duration: 71681ms
> Output chars: 6598
> Timestamp: 2026-03-01T22:56:16.515Z

---

# Audit Report: types/index.ts Export Completeness (t3)

## Executive Summary

The barrel export file `src/types/index.ts` correctly exports all canonical post-refactor morpheme types (Seed, Bloom, etc.). However, **backward-compatibility aliases are entirely absent**, which violates the M-7C migration pattern requiring deprecated aliases for consumers still using pre-refactor terminology.

---

## Audit Methodology

Cross-referenced exports in `index.ts` against:
1. t2 output showing full morphemes.ts type definitions
2. t1 canonical rename mapping (Agent→Seed, Pattern→Bloom)
3. Acceptance criteria for backward-compat alias requirements

---

## Finding 1 — Missing Backward-Compatibility Aliases

**Severity: High (blocking criterion failure)**

The index.ts file exports only canonical post-refactor types. No backward-compatibility aliases exist for pre-refactor type names.

| Pre-Refactor Name | Post-Refactor Name | Alias Exported? |
|-------------------|-------------------|-----------------|
| `Agent` | `Seed` | ❌ Missing |
| `Pattern` | `Bloom` | ❌ Missing |

**Expected pattern per M-7C migration:**
```typescript
// Backward-compat aliases (should exist)
export type { Seed, Seed as Agent } from "./morphemes.js";
export type { Bloom, Bloom as Pattern } from "./morphemes.js";
```

Or via separate re-export:
```typescript
// After canonical exports
/** @deprecated Use Seed instead */
export type Agent = Seed;
/** @deprecated Use Bloom instead */
export type Pattern = Bloom;
```

**Impact:** External consumers importing `Agent` or `Pattern` types will experience breaking changes without a migration path.

**Recommendation:** Add deprecated type aliases in morphemes.ts and re-export them from index.ts with JSDoc `@deprecated` annotations.

---

## Finding 2 — Seed Types: PASS

**Severity: None (acceptance criterion met)**

All Seed-related types are correctly exported:

| Type | Export Status |
|------|---------------|
| `Seed` | ✅ Exported |
| `MorphemeKind` (includes `"seed"`) | ✅ Exported |

The `seedType` field on Seed uses an inline union (`"function" | "datum" | "decision" | "input" | "output"`) rather than a named type. This is acceptable but could be improved for DX.

**Minor suggestion:** Extract `SeedType` as a named export for consumer convenience.

---

## Finding 3 — Bloom Types: PASS

**Severity: None (acceptance criterion met)**

All Bloom-related types are correctly exported:

| Type | Export Status |
|------|---------------|
| `Bloom` | ✅ Exported |
| `BloomShape` | ✅ Exported |
| `MorphemeKind` (includes `"bloom"`) | ✅ Exported |

---

## Finding 4 — No Orphaned Old-Terminology Exports: PASS

**Severity: None (acceptance criterion met)**

Scanned all export statements for pre-refactor terminology:

| Search Term | Found? |
|-------------|--------|
| `Agent` | ❌ Not found |
| `Pattern` | ❌ Not found |
| `Model` (as type) | ❌ Not found |
| `SELECTED` | ❌ Not found |
| `MADE_BY` | ❌ Not found |
| `observer` | ❌ Not found |

No orphaned exports reference pre-refactor terminology. The file is clean of hybrid-state exports.

---

## Finding 5 — Morpheme Export Completeness: PASS

**Severity: None**

Cross-referencing against t2's morphemes.ts audit, all defined types are exported:

| Category | Types | Status |
|----------|-------|--------|
| Base | `MorphemeBase`, `MorphemeKind`, `IntegrationState`, `Morpheme` | ✅ All exported |
| Seed | `Seed` | ✅ Exported |
| Line | `Line`, `LineDirection` | ✅ All exported |
| Bloom | `Bloom`, `BloomShape` | ✅ All exported |
| Resonator | `Resonator`, `ResonatorOrientation` | ✅ All exported |
| Grid | `Grid`, `GridType` | ✅ All exported |
| Helix | `Helix`, `HelixMode` | ✅ All exported |
| Grammar | `GrammarCompliance` | ✅ Exported |

---

## Finding 6 — Flow Morpheme Absent

**Severity: Low (potential spec drift — needs clarification)**

The t1 canonical checklist lists six morphemes including **Flow** (directed movement). However:

- `MorphemeKind` does not include `"flow"`
- No `Flow` interface is exported
- The enum includes `"line"` instead

**Possible interpretations:**
1. **Intentional encoding:** Flow semantics are encoded via `Line.direction` property, making Flow implicit rather than explicit
2. **Spec drift:** The implementation diverged from the spec's six-morpheme model

**Evidence for interpretation 1:** Line has `direction: LineDirection` where `LineDirection = "forward" | "return" | "parallel" | "bidirectional"`, which captures flow semantics.

**Recommendation:** Confirm with spec author whether Flow is intentionally subsumed by Line, or if a separate Flow morpheme type is required.

---

## Finding 7 — Observation Types Are Correct (Not observer→feedback Issue)

**Severity: None (false positive avoided)**

Initial concern: `Observation`, `ObservationData`, `ObservationType` exports might conflict with observer→feedback rename.

**Resolution:** Per t1 mapping, `Observation` is a **memory stratum type** (Stratum 2 event), not related to the `observer` directory that was renamed to `feedback`. These types are correctly named and should remain as-is.

---

## Acceptance Criteria Summary

| Criterion | Status | Notes |
|-----------|--------|-------|
| All Seed types exported | ✅ PASS | `Seed` exported correctly |
| All Bloom types exported | ✅ PASS | `Bloom`, `BloomShape` exported correctly |
| Backward-compat aliases present and exported | ❌ FAIL | No `Agent`/`Pattern` aliases exist |
| No orphaned old-terminology exports | ✅ PASS | Clean of pre-refactor terms |

---

## Recommendations

### Required for M-7C Completion

1. **Add backward-compatibility aliases** in morphemes.ts:
   ```typescript
   /** @deprecated Use Seed — Agent terminology rejected per codex-signum-v3.0 */
   export type Agent = Seed;
   
   /** @deprecated Use Bloom — Pattern is now encoded as Bloom morpheme */
   export type Pattern = Bloom;
   ```

2. **Export aliases from index.ts**:
   ```typescript
   export type {
     // ... existing exports ...
     // Backward-compatibility aliases (deprecated)
     Agent,
     Pattern,
   } from "./morphemes.js";
   ```

### Optional Improvements

3. **Extract SeedType** as named export for better consumer DX
4. **Clarify Flow morpheme** encoding decision in code comments or ADR

---

## Verification Command Output (Expected)

```bash
$ grep -E 'export.*from.*morphemes' src/types/index.ts
export type {
  Bloom,
  BloomShape,
  # ... (current output matches file content)
  Seed,
} from "./morphemes.js";

# After fix, should also show:
  Agent,    // deprecated alias
  Pattern,  // deprecated alias
```