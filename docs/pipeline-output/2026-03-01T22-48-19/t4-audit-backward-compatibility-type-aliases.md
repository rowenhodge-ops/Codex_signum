# Audit backward-compatibility type aliases

> Task ID: t4
> Model: claude-opus-4-6:adaptive:low
> Duration: 45154ms
> Output chars: 6139
> Timestamp: 2026-03-01T23:08:53.720Z

---

# Audit Report: Backward-Compatibility Type Aliases (t4)

## Executive Summary

**Status: FAIL — Backward-compatibility aliases are entirely absent.**

The M-7C refactor successfully introduced canonical Codex-native morpheme names (`Seed`, `Bloom`, etc.) in `src/types/morphemes.ts`, but the migration step of providing deprecated aliases from old names was not performed. No consumer currently importing `Agent` or `Pattern` types would compile after this refactor.

---

## Detailed Findings

### Finding 1: No `Agent → Seed` Alias Exists

**Severity: HIGH**
**File:** `src/types/morphemes.ts`

The file defines `Seed` correctly (line ~82–96) but contains no backward-compatibility alias of the form:

```ts
/** @deprecated Use Seed instead. Renamed in M-7C Grammar Refactor. */
export type Agent = Seed;
```

A `grep -n 'Agent' src/types/morphemes.ts` would return zero hits. The old name is completely absent from both `morphemes.ts` and the barrel `index.ts`.

**Impact:** Any downstream consumer or integration that references `Agent` will break at compile time with no migration guidance.

---

### Finding 2: No `Pattern → Bloom` Alias Exists

**Severity: HIGH**
**File:** `src/types/morphemes.ts`

Identical situation. `Bloom` is properly defined (line ~105–137), but no `Pattern` alias exists anywhere in the type system. The barrel export in `index.ts` exports only `Bloom` and `BloomShape` — no `Pattern` or `PatternShape` equivalents.

**Impact:** Same as Finding 1 — hard break for any consumer using the old `Pattern` type.

---

### Finding 3: No `@deprecated` JSDoc Tags Anywhere in the Type System

**Severity: MEDIUM**
**File:** `src/types/morphemes.ts`, `src/types/index.ts`

Running the verification command from the task spec:

```
grep -A2 '@deprecated' src/types/morphemes.ts || echo 'Check for deprecation markers'
```

This would hit the `echo` fallback. There are **zero** `@deprecated` annotations in either file. This confirms that the alias layer was never implemented — it's not that aliases exist without tags; the aliases themselves are missing.

---

### Finding 4: Sub-Type Aliases Also Missing

**Severity: MEDIUM**
**File:** `src/types/morphemes.ts`

The rename mapping (per `docs/entity-mapping-v3.md` reference) likely covers not just the primary interface names but also associated types. Expected aliases that are absent include:

| Old Name (Expected) | New Name (Defined) | Alias Present? |
|---|---|---|
| `Agent` | `Seed` | ❌ No |
| `AgentType` / similar | `Seed["seedType"]` | ❌ No |
| `Pattern` | `Bloom` | ❌ No |
| `PatternShape` | `BloomShape` | ❌ No |

Without access to `docs/entity-mapping-v3.md` directly, I cannot confirm the complete list, but the primary two entries called out in the acceptance criteria are definitively absent.

---

### Finding 5: Barrel Export (`index.ts`) Does Not Re-Export Any Aliases

**Severity: MEDIUM**
**File:** `src/types/index.ts`

Even if aliases were added to `morphemes.ts`, they would need to be re-exported from the barrel. Currently, the explicit export list in `index.ts` (lines 12–28) enumerates only the new canonical names. There is no `Agent` or `Pattern` in the export list.

This means the fix requires changes in **two** files, not one.

---

### Finding 6: No Circular or Broken Alias Chains (Vacuously True)

**Severity: INFO**

Since no aliases exist at all, there are no circular or broken chains. This acceptance criterion passes trivially but is not meaningful in the current state.

---

## Assessment Against Acceptance Criteria

| Criterion | Status | Evidence |
|---|---|---|
| Agent alias maps to Seed types | ❌ **FAIL** | No `Agent` type exists anywhere in the type files |
| Pattern alias maps to Bloom types | ❌ **FAIL** | No `Pattern` type exists anywhere in the type files |
| Aliases have `@deprecated` JSDoc tags | ❌ **FAIL** | Zero `@deprecated` tags in entire type system |
| No circular or broken alias chains | ✅ PASS (vacuous) | No aliases exist to form chains |

---

## Recommendations

### R1: Add Deprecated Alias Block to `morphemes.ts`

A dedicated section at the bottom of `morphemes.ts` (after the union type and grammar compliance definitions) should provide all backward-compatibility aliases. Each must carry:
- A `@deprecated` JSDoc tag
- A human-readable migration note naming the replacement
- A reference to the M-7C refactor or `entity-mapping-v3.md`

The aliases needed (at minimum, per acceptance criteria):
- `Agent` → `Seed`
- `Pattern` → `Bloom`
- `PatternShape` → `BloomShape` (if this was a prior public type)

### R2: Re-Export Aliases from `index.ts`

The barrel file must include the deprecated aliases in its export list so that consumers importing from `codex-signum-core/types` see them. These should also carry `@deprecated` in any re-export JSDoc if tooling supports it.

### R3: Cross-Reference Full Rename Map

Consult `docs/entity-mapping-v3.md` to confirm whether additional renames beyond Agent/Pattern require aliases (e.g., if "observer" was a type-level concept, or if relationship types were renamed). The current audit scope was limited to the two files provided; the full mapping document may reveal additional gaps.

### R4: Consider a Deprecation Timeline

Per `codex-signum-engineering-bridge-v2_0.md`, backward-compatibility aliases should have a documented sunset version. Add a note like `@deprecated Since v3.0. Will be removed in v4.0.` to give consumers a clear migration window.

### R5: Add Automated Verification

The verification command in the task spec (`grep -A2 '@deprecated'`) should be formalized as a CI check or test assertion to prevent regression — ensuring aliases remain present and tagged until the planned removal version.

---

## Conclusion

The M-7C refactor cleanly introduced the new canonical names but **omitted the backward-compatibility alias layer entirely**. This is not a partial or hybrid state — it is a complete absence. Any consumer of the old `Agent` or `Pattern` types will experience a hard compilation failure with no deprecation warning or migration path. This should be addressed before the refactor is considered complete.